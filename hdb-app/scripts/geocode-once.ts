/* scripts/geocode-once.ts
   One-time geocoding for:
   1) Generalinformationofschools.csv  -> data/schools_points.geojson
   2) HDBPropertyInformation.csv       -> data/hdb_property_information_ll.csv

   Requires env:
     ONEMAP_EMAIL
     ONEMAP_PASSWORD

   Run examples:
     npx tsx scripts/geocode-once.ts            # default 'all'
     npx tsx scripts/geocode-once.ts schools    # only schools
     npx tsx scripts/geocode-once.ts flats      # only HDB (alias: hdb)
*/

import fs from "node:fs/promises";
import path from "node:path";

// ---------- Config ----------
const INPUT_SCHOOLS_CSV = path.join(process.cwd(), "data", "Generalinformationofschools.csv");
const OUTPUT_SCHOOLS_GEOJSON = path.join(process.cwd(), "data", "schools_points.geojson");

const INPUT_FLATS_CSV = path.join(process.cwd(), "data", "HDBPropertyInformation.csv");
const OUTPUT_FLATS_CSV = path.join(process.cwd(), "data", "hdb_property_information_ll.csv");

// ---------- Mode from CLI ----------
const MODE = (process.argv[2] || "all").toLowerCase();

//Debug
console.log(
  `[geocode-once] mode=${MODE} | schools: ${INPUT_SCHOOLS_CSV} -> ${OUTPUT_SCHOOLS_GEOJSON} | hdb: ${INPUT_FLATS_CSV} -> ${OUTPUT_FLATS_CSV}`
);

//small delay
const DELAY_MS = 120;

// ---------- CSV helpers ----------
function splitCsvLine(line: string, expected?: number): string[] {
  const out: string[] = [];
  let i = 0, cur = "", inQ = false;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i += 2; continue; }
      inQ = !inQ; i++; continue;
    }
    if (ch === "," && !inQ) { out.push(cur); cur = ""; i++; continue; }
    cur += ch; i++;
  }
  out.push(cur);
  if (expected) while (out.length < expected) out.push("");
  return out;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string,string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  const rows: Record<string,string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i], headers.length);
    const rec: Record<string,string> = {};
    for (let c = 0; c < headers.length; c++) rec[headers[c]] = (parts[c] ?? "").trim();
    rows.push(rec);
  }
  return { headers, rows };
}

function toCsv(headers: string[], rows: Record<string, any>[]): string {
  const esc = (v: any) => {
    const s = (v ?? "").toString();
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map(h => esc(r[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ---------- Normalizers ----------
function normalizePostal(x: any): string | null {
  if (x == null) return null;
  const raw = String(x).trim();
  const digits = raw.replace(/\D+/g, ""); // keep only digits
  if (!digits) return null;
  if (digits.length === 6) return digits;
  if (digits.length < 6) return digits.padStart(6, "0"); // fix dropped leading zero(s)
  return digits.slice(0, 6); // defensive
}

function cleanAddress(addr: any): string | null {
  if (!addr) return null;
  const a = String(addr).replace(/\s+/g, " ").trim();
  return a || null;
}

// ---------- OneMap (token + elastic search) ----------
async function getToken(): Promise<string> {
  const email = process.env.ONEMAP_EMAIL || "";
  const password = process.env.ONEMAP_PASSWORD || "";
  if (!email || !password) {
    throw new Error("Missing ONEMAP_EMAIL / ONEMAP_PASSWORD env vars");
  }

  const url = "https://www.onemap.gov.sg/api/auth/post/getToken";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`getToken HTTP ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const token: string = data?.access_token || data?.token || "";
  if (!token) throw new Error("getToken: no access_token in response");
  return token;
}

async function searchPrivate(token: string, q: string) {
  const url =
    "https://www.onemap.gov.sg/api/common/elastic/search" +
    `?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: token },
  });

  if (!res.ok) {
    const t = await res.text().catch(()=>"");
    throw new Error(`elastic search HTTP ${res.status} ${t?.slice(0,120)}`);
  }
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch { throw new Error("elastic search returned non-JSON"); }
}

type LatLng = { lat: number; lng: number, postal?: string } | null;

function pickLatLng(resultObj: any): LatLng {
  if (!resultObj) return null;
  const lat = Number(resultObj.LATITUDE ?? resultObj.latitude ?? resultObj.Y);
  const lng = Number(resultObj.LONGITUDE ?? resultObj.longitude ?? resultObj.X);
  const postal = (resultObj.POSTAL ?? resultObj.POSTALCODE ?? "").toString().trim();
  const inSG = Number.isFinite(lat) && Number.isFinite(lng) && lat > 1.15 && lat < 1.55 && lng > 103.5 && lng < 104.15;
  return inSG ? { lat, lng, postal } : null;
}

async function geocodeWithVariants(token: string, variants: string[]): Promise<LatLng> {
  let lastErr: any = null;
  for (const q of variants) {
    try {
      const data = await searchPrivate(token, q);
      const results = data?.results || data?.Results || [];
      for (const r of results) {
        const pt = pickLatLng(r);
        if (pt) return pt;
      }
    } catch (e) {
      lastErr = e;
    }
    await sleep(DELAY_MS);
  }
  if (lastErr) console.warn("[geocode] no hit; last error:", String(lastErr));
  return null;
}

// ---------- Schools: CSV -> GeoJSON ----------
async function processSchools(token: string) {
  const txt = await fs.readFile(INPUT_SCHOOLS_CSV, "utf8");
  const { headers, rows } = parseCsv(txt);
  if (rows.length === 0) {
    console.warn("[schools] input CSV is empty");
    await fs.writeFile(OUTPUT_SCHOOLS_GEOJSON, JSON.stringify({ type:"FeatureCollection", features: [] }, null, 2));
    return;
  }

  const nameKey = headers.find(h => /sch[_\s]*name/i.test(h)) || headers.find(h => /name/i.test(h)) || "SCH_NAME";
  const addrKey = headers.find(h => /sch[_\s]*addr/i.test(h)) || headers.find(h => /address/i.test(h)) || "SCH_ADDR";
  const postKey = headers.find(h => /postal/i.test(h)) || "SCH_POSTAL";

  const features: any[] = [];
  let ok = 0, miss = 0;

  for (const r of rows) {
    const rawName = (r[nameKey] ?? "").toString();
    const rawAddr = (r[addrKey] ?? "").toString();
    const rawPostal = r[postKey];

    const name = rawName.trim();
    const addr = cleanAddress(rawAddr);
    const postal = normalizePostal(rawPostal);

    const candidates: string[] = [];

    //address + postal (if both present)
    if (addr && postal) candidates.push(`${addr} ${postal}`);
    //address variants
    if (addr) {
      candidates.push(addr);
      candidates.push(`${addr} SINGAPORE`);
    }
    //postal code only
    if (postal) candidates.push(postal);
    //name variants as last resort
    if (name) {
      candidates.push(name);
      candidates.push(`${name} SINGAPORE`);
    }

    const hit = await geocodeWithVariants(token, candidates);
    if (hit) {
      ok++;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [hit.lng, hit.lat] },
        properties: { name, address: addr ?? rawAddr, postal: hit.postal || postal || (rawPostal ?? "") }
      });
    } else {
      miss++;
      console.warn("[schools] MISS:", name || addr || rawAddr);
    }
  }

  const gj = { type: "FeatureCollection", features };
  await fs.writeFile(OUTPUT_SCHOOLS_GEOJSON, JSON.stringify(gj, null, 2));
  console.log(`[schools] wrote ${features.length} features → ${OUTPUT_SCHOOLS_GEOJSON} (ok: ${ok}, miss: ${miss})`);
}

// ---------- Flats: CSV -> CSV with lat/lng ----------
async function processFlats(token: string) {
  const txt = await fs.readFile(INPUT_FLATS_CSV, "utf8");
  const { headers, rows } = parseCsv(txt);
  if (rows.length === 0) {
    console.warn("[flats] input CSV is empty");
    await fs.writeFile(OUTPUT_FLATS_CSV, "");
    return;
  }

  // detect columns
  const blkKey = headers.find(h => /^(blk_no|block)$/i.test(h)) || "blk_no";
  const streetKey = headers.find(h => /^street[_\s]*name$/i.test(h) || /^street$/i.test(h)) || "street_name";
  const townKey = headers.find(h => /^town$/i.test(h) || /^estate$/i.test(h)) || "town";

  // output headers (append lat,lng,postal if not present)
  const outHeaders = [...headers];
  for (const h of ["lat","lng","postal"]) {
    if (!outHeaders.some(x => x.toLowerCase() === h)) outHeaders.push(h);
  }

  const outRows: Record<string, any>[] = [];
  let ok = 0, miss = 0;

  // simple de-dup cache to avoid repeated geocoding
  const cache = new Map<string, { lat:number; lng:number; postal?:string }>();

  for (const r of rows) {
    const blk = (r[blkKey] ?? "").toString().trim();
    const street = (r[streetKey] ?? "").toString().trim();
    const town = (r[townKey] ?? "").toString().trim();
    const key = `${blk}|${street}|${town}`.toUpperCase();

    let hit = cache.get(key) || null;
    if (!hit) {
      // Build robust variants for HDB addresses
      const addr = cleanAddress(`BLK ${blk} ${street} ${town}`);
      const variants: string[] = [];
      if (addr) {
        variants.push(addr);
        variants.push(`${addr} SINGAPORE`);
      }
      // Slightly looser fallbacks
      variants.push(`BLK ${blk} ${street}`.trim());
      variants.push(`${street} ${town}`.trim());

      hit = await geocodeWithVariants(token, variants);
      if (hit) cache.set(key, hit);
    }

    const out = { ...r };
    if (hit) {
      ok++;
      out["lat"] = String(hit.lat);
      out["lng"] = String(hit.lng);
      if (hit.postal) out["postal"] = String(hit.postal);
    } else {
      miss++;
      out["lat"] = "";
      out["lng"] = "";
      if (!out["postal"]) out["postal"] = "";
      console.warn("[flats] MISS:", key);
    }
    outRows.push(out);
  }

  const csv = toCsv(outHeaders, outRows);
  await fs.writeFile(OUTPUT_FLATS_CSV, csv, "utf8");
  console.log(`[flats] wrote ${outRows.length} rows → ${OUTPUT_FLATS_CSV} (ok: ${ok}, miss: ${miss})`);
}

// ---------- main ----------
async function main() {
  try {
    const token = await getToken();
    console.log("[onemap] token acquired");

    if (MODE === "all" || MODE === "schools") {
      await processSchools(token);
      await sleep(300);
    }
    if (MODE === "all" || MODE === "flats" || MODE === "hdb") {
      await processFlats(token);
    }

    console.log("[done] geocode-once completed.");
  } catch (e: any) {
    console.error("geocode-once failed:", e?.message || e);
    process.exitCode = 1;
  }
}

main();