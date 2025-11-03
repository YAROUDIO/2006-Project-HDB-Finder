// app/api/finder/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { geocodeWithCache } from "@/lib/geocode";
import {
  loadStations,
  loadHospitals,
  loadSchools,
  haversineMeters,
} from "@/lib/loaders";

// Your resale loader should yield: town, block, street_name, resale_price
import { loadFlatsForTowns } from "@/lib/resale";

// --- read towns from resale CSV (full names) ---
import fs from "node:fs";
import path from "node:path";

const RESALE_CSV = path.join(
  process.cwd(),
  "data",
  "ResaleflatpricesbasedonregistrationdatefromJan2017onwards.csv"
);

// tiny, quote-aware CSV splitter
function splitCsvLine(line: string, expected?: number): string[] {
  const out: string[] = [];
  let i = 0,
    cur = "",
    inQ = false;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQ = !inQ;
      i++;
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  out.push(cur);
  if (expected) while (out.length < expected) out.push("");
  return out;
}

function readDistinctTownsFromResale(): string[] {
  console.log("[finder][GET /?op=towns] scanning resale CSV for distinct towns…");
  const txt = fs.readFileSync(RESALE_CSV, "utf8");
  const lines = txt.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  const iTown = headers.findIndex((h) => h.trim().toLowerCase() === "town");
  if (iTown < 0) return [];
  const set = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i], headers.length);
    const t = (parts[iTown] ?? "").trim();
    if (t) set.add(t);
  }
  const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
  console.log(`[finder][GET /?op=towns] found ${arr.length} towns.`);
  return arr;
}

type WeightInput = {
  mrt: number;
  school: number;
  hospital: number;
  affordability: number;
};

type FlatRow = {
  town: string;
  block: string;
  street_name: string;
  resale_price: string;
};

// ---------- helpers ----------

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

// Simple distance→score (0..100). Linear taper with a cap distance.
// Closer gets a higher score; beyond `capMeters` goes to 0.
function distanceToBaseScore(meters: number, capMeters: number): number {
  if (!Number.isFinite(meters)) return 0;
  const s = 100 * (1 - meters / capMeters);
  return Math.max(0, Math.min(100, s));
}

function nearestDistance(
  here: { lat: number; lng: number },
  candidates: { lat: number; lng: number }[]
) {
  let best = Infinity;
  for (const c of candidates) {
    const d = haversineMeters(here as any, c as any);
    if (d < best) best = d;
  }
  return Number.isFinite(best) ? best : NaN;
}

// ---------- GET (utility ops like ?op=towns) ----------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const op = (searchParams.get("op") || "").toLowerCase();

  if (op === "towns") {
    try {
      const towns = readDistinctTownsFromResale(); // full names e.g. "ANG MO KIO"
      return NextResponse.json({ ok: true, towns });
    } catch (e: any) {
      console.error("[finder][GET /?op=towns] error:", e?.message || e);
      return NextResponse.json(
        { ok: false, error: e?.message || "Failed to load towns" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown op" }, { status: 400 });
}

// ---------- POST (main scoring) ----------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const weights: WeightInput =
      body?.weights ?? { mrt: 7, school: 6, hospital: 3, affordability: 8 };
    const towns: string[] = Array.isArray(body?.towns) ? body.towns : [];

    console.log("[finder][POST] incoming towns:", towns);
    console.log("[finder][POST] incoming weights:", weights);

    if (towns.length === 0) {
      console.warn("[finder][POST] No towns selected.");
      return NextResponse.json(
        { ok: false, error: "No towns selected." },
        { status: 400 }
      );
    }

    // Load amenities from local GeoJSON
    console.log("[finder][POST] loading amenity points from data/…");
    const stations = loadStations(); // MRT/LRT
    const hospitals = loadHospitals(); // clinics/hospitals
    const schools = loadSchools(); // MOE + preschools
    console.log(
      `[finder][POST] amenity counts: stations=${stations.length}, hospitals=${hospitals.length}, schools=${schools.length}`
    );

    // Load candidate flats
    console.log("[finder][POST] loading candidate flats for selected towns…");
    const flats: FlatRow[] = await loadFlatsForTowns(towns);
    console.log(`[finder][POST] candidate unique (BLOCK|STREET|TOWN) = ${flats.length}`);

    // First pass: compute locations, distances, and collect price range
    type Temp = {
      row: FlatRow;
      here: { lat: number; lng: number } | null;
      dMrt: number;
      dSchool: number;
      dHospital: number;
      price: number;
    };
    const temp: Temp[] = [];

    let misses = 0;
    const missSamples: string[] = [];

    for (const row of flats) {
      const pt = await geocodeWithCache(row.block, row.street_name, row.town);
      if (!pt) {
        misses++;
        if (missSamples.length < 8) {
          missSamples.push(`${row.block} | ${row.street_name} | ${row.town}`);
        }
        continue;
      }

      const here = { lat: pt.lat, lng: pt.lng };
      const dMrt = nearestDistance(here, stations);
      const dSchool = nearestDistance(here, schools);
      const dHospital = nearestDistance(here, hospitals);
      const price = Number(row.resale_price);

      temp.push({ row, here, dMrt, dSchool, dHospital, price });
    }

    console.log(`[finder][POST] geocoded ok=${temp.length}, misses=${misses}`);
    if (misses > 0) {
      console.warn("[finder][POST] sample geocode misses:", missSamples);
    }

    if (temp.length === 0) {
      console.warn("[finder][POST] No geocoded candidates; returning empty results.");
      return NextResponse.json({ ok: true, results: [] });
    }

    // Compute price min/max over candidate set (for rank-like mapping)
    const validPrices = temp.map((t) => t.price).filter(Number.isFinite) as number[];
    const priceLow = Math.min(...validPrices);
    const priceHigh = Math.max(...validPrices);
    const priceSpan = Math.max(priceHigh - priceLow, 1); // avoid zero division

    console.log(
      `[finder][POST] price range among candidates: low=${priceLow.toLocaleString()} high=${priceHigh.toLocaleString()} span=${priceSpan.toLocaleString()}`
    );

    // Convert raw weights (0..10) into percentage shares
    const w = {
      mrt: Math.max(0, weights.mrt || 0),
      school: Math.max(0, weights.school || 0),
      hospital: Math.max(0, weights.hospital || 0),
      affordability: Math.max(0, weights.affordability || 0),
    };
    let wSum = w.mrt + w.school + w.hospital + w.affordability;
    if (wSum <= 0) wSum = 4; // all zeros -> equal shares

    const pct = {
      mrt: w.mrt / wSum,
      school: w.school / wSum,
      hospital: w.hospital / wSum,
      affordability: w.affordability / wSum,
    };

    console.log("[finder][POST] weight shares:", pct);

    // Second pass: compute base scores (0..100) and final weighted score
    const MRT_CAP = 3000;      // 3.0 km
    const SCHOOL_CAP = 2000;   // 2.0 km
    const HOSPITAL_CAP = 3000; // 3.0 km

    const results = temp.map((t) => {
      const baseMrt = distanceToBaseScore(t.dMrt, MRT_CAP);
      const baseSchool = distanceToBaseScore(t.dSchool, SCHOOL_CAP);
      const baseHospital = distanceToBaseScore(t.dHospital, HOSPITAL_CAP);

      const priceScore =
        Number.isFinite(t.price)
          ? 100 * clamp01((priceHigh - t.price) / priceSpan)
          : 50;

      // Final score in 0..100 (no percent sign)
      const score =
        pct.mrt * baseMrt +
        pct.school * baseSchool +
        pct.hospital * baseHospital +
        pct.affordability * priceScore;

      // Build a stable 3-part uppercase key
      const compositeKey = [
        (t.row.block || "").toString().trim().toUpperCase(),
        (t.row.street_name || "").toString().trim().toUpperCase(),
        (t.row.town || "").toString().trim().toUpperCase(),
      ].join("__");

      return {
        town: t.row.town,
        block: t.row.block,
        street_name: t.row.street_name,
        resale_price: t.row.resale_price,
        score, // 0..100
        distances: { dMrt: t.dMrt, dSchool: t.dSchool, dHospital: t.dHospital },
        compositeKey,
      };
    });

    results.sort((a, b) => b.score - a.score);

    console.log("[finder][POST] top 3 results (compositeKey | score | price):");
    results.slice(0, 3).forEach((r, i) => {
      console.log(
        `  #${i + 1} ${r.compositeKey} | ${r.score.toFixed(2)} | ${r.resale_price}`
      );
    });

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    console.error("[finder][POST] error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}