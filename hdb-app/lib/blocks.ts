// lib/blocks.ts
import fs from "fs";
import path from "path";
import 'server-only';

type Row = Record<string, any>;

type BlockRec = {
  block: string;
  street: string;
  town?: string;     // may be contract code (e.g., KWN), may be undefined
  lat: number;
  lng: number;
};

let INDEX_EXACT: Map<string, { lat: number; lng: number }> | null = null;
let INDEX_LOOSE: Map<string, { lat: number; lng: number }> | null = null;
let RAW_ROWS: Map<string, BlockRec> | null = null; // for optional listing/inspection

function splitCsv(line: string, expected: number) {
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
  while (out.length < expected) out.push("");
  return out;
}

function loadIndex() {
  if (INDEX_EXACT && INDEX_LOOSE && RAW_ROWS) return;

  const file = path.join(process.cwd(), "data", "hdb_property_information_ll.csv");
  const txt = fs.readFileSync(file, "utf-8");
  const lines = txt.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) throw new Error("hdb_property_information_ll.csv is empty.");

  const headers = lines[0].split(",");
  const col = (name: string) =>
    headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const colOneOf = (...names: string[]) => {
    for (const n of names) {
      const i = col(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iBlk    = colOneOf("blk_no", "block");
  const iStreet = colOneOf("street", "street_name");
  const iTown   = colOneOf("town", "estate", "bldg_contract_town"); // optional
  const iLat    = col("lat");
  const iLng    = col("lng");

  // Only require blk, street, lat, lng (town is optional in this file)
  if (iBlk < 0 || iStreet < 0 || iLat < 0 || iLng < 0) {
    throw new Error(
      "hdb_property_information_ll.csv is missing required columns: blk_no/block, street/street_name, lat, lng"
    );
  }

  const exact = new Map<string, { lat: number; lng: number }>();
  const loose = new Map<string, { lat: number; lng: number }>();
  const raw = new Map<string, BlockRec>();

  for (let li = 1; li < lines.length; li++) {
    const parts = splitCsv(lines[li], headers.length);
    if (!parts.length) continue;

    const blk    = (parts[iBlk] ?? "").trim().toUpperCase();
    const street = (parts[iStreet] ?? "").trim().toUpperCase();
    const town   = iTown >= 0 ? (parts[iTown] ?? "").trim().toUpperCase() : undefined;
    const lat    = Number((parts[iLat] ?? "").trim());
    const lng    = Number((parts[iLng] ?? "").trim());

    if (!blk || !street || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    // Save raw row (keyed by blk|street|town? for uniqueness)
    const rawKey = `${blk}__${street}__${town ?? ""}`;
    raw.set(rawKey, { block: blk, street, town, lat, lng });

    // Exact index (only if town present)
    if (town) {
      const kExact = `${blk}__${street}__${town}`;
      exact.set(kExact, { lat, lng });
    }

    // Loose index (blk + street only)
    const kLoose = `${blk}__${street}`;
    // If multiple rows share the same blk+street, keep the first — that’s fine for a fallback
    if (!loose.has(kLoose)) loose.set(kLoose, { lat, lng });
  }

  INDEX_EXACT = exact;
  INDEX_LOOSE = loose;
  RAW_ROWS = raw;
}

/**
 * Lookup lat/lng by block + street + (optional) town.
 * Tries exact key (blk+street+town) then falls back to loose key (blk+street).
 */
export function lookupBlockLatLng(block?: string, street?: string, town?: string) {
  if (!block || !street) return null;
  loadIndex();

  const blk = block.trim().toUpperCase();
  const st  = street.trim().toUpperCase();
  const tw  = (town ?? "").trim().toUpperCase();

  // Exact
  if (tw && INDEX_EXACT) {
    const k = `${blk}__${st}__${tw}`;
    const hit = INDEX_EXACT.get(k);
    if (hit) return hit;
  }
  // Loose
  if (INDEX_LOOSE) {
    const k2 = `${blk}__${st}`;
    const hit2 = INDEX_LOOSE.get(k2);
    if (hit2) return hit2;
  }
  return null;
}

/**
 * Optional: expose a one-time loaded map of raw block rows, useful for
 * listing available “town” values (though they may be contract codes).
 */
export function loadBlocksOnce(): Map<string, BlockRec> {
  loadIndex();
  return RAW_ROWS!;
}