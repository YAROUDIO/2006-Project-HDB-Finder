// lib/loaders.ts
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export type Pt = { lat: number; lng: number };

function flattenCoords(coords: any): number[][] {
  const out: number[][] = [];
  (function walk(c: any) {
    if (Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
      out.push([c[0], c[1]]);
    } else if (Array.isArray(c)) {
      for (const x of c) walk(x);
    }
  })(coords);
  return out;
}

function centroidLngLat(coords: number[][]): Pt | null {
  if (!coords.length) return null;
  let sx = 0, sy = 0, n = 0;
  for (const [lng, lat] of coords) {
    if (Number.isFinite(lat) && Number.isFinite(lng)) { sx += lng; sy += lat; n++; }
  }
  if (!n) return null;
  return { lat: sy / n, lng: sx / n };
}

function readGeoJSONSync(file: string): any {
  const p = path.join(process.cwd(), 'data', file);
  const txt = fs.readFileSync(p, 'utf8');
  return JSON.parse(txt);
}

let CACHE_STATIONS: Pt[] | null = null;
let CACHE_HOSPITALS: Pt[] | null = null;
let CACHE_SCHOOLS: Pt[] | null = null;

export function loadStations(): Pt[] {
  if (CACHE_STATIONS) return CACHE_STATIONS;
  console.log("[loaders] loading stations from MasterPlan2019RailStationlayerGEOJSON.geojson …");
  const gj = readGeoJSONSync('MasterPlan2019RailStationlayerGEOJSON.geojson');
  const out: Pt[] = [];
  let polyCount = 0, ptCount = 0;

  for (const f of gj.features ?? []) {
    const g = f?.geometry;
    if (!g) continue;
    if (g.type === 'Point') {
      const c = g.coordinates;
      if (Array.isArray(c) && c.length >= 2) { out.push({ lat: c[1], lng: c[0] }); ptCount++; }
    } else {
      const flat = flattenCoords(g.coordinates);
      const ctr = centroidLngLat(flat);
      if (ctr) { out.push(ctr); polyCount++; }
    }
  }
  console.log(`[loaders] stations: total=${out.length} (points=${ptCount}, polys=${polyCount})`);
  CACHE_STATIONS = out;
  return out;
}

export function loadHospitals(): Pt[] {
  if (CACHE_HOSPITALS) return CACHE_HOSPITALS;
  console.log("[loaders] loading hospitals/clinics from chas_clinics.geojson …");
  const gj = readGeoJSONSync('chas_clinics.geojson');
  const out: Pt[] = [];
  for (const f of gj.features ?? []) {
    const c = f?.geometry?.coordinates;
    if (Array.isArray(c) && c.length >= 2) out.push({ lat: c[1], lng: c[0] });
  }
  console.log(`[loaders] hospitals/clinics: total=${out.length}`);
  CACHE_HOSPITALS = out;
  return out;
}

export function loadSchools(): Pt[] {
  if (CACHE_SCHOOLS) return CACHE_SCHOOLS;
  console.log("[loaders] loading schools from schools_points.geojson (+preschools.geojson if present) …");
  const out: Pt[] = [];

  const schools = readGeoJSONSync('schools_points.geojson');
  for (const f of schools.features ?? []) {
    const c = f?.geometry?.coordinates;
    if (Array.isArray(c) && c.length >= 2) out.push({ lat: c[1], lng: c[0] });
  }
  let preCount = 0;
  try {
    const pre = readGeoJSONSync('preschools.geojson');
    for (const f of pre.features ?? []) {
      const c = f?.geometry?.coordinates;
      if (Array.isArray(c) && c.length >= 2) { out.push({ lat: c[1], lng: c[0] }); preCount++; }
    }
  } catch {
    // optional file; ignore if missing
  }
  console.log(`[loaders] schools: total=${out.length} (including ${preCount} preschools if any)`);
  CACHE_SCHOOLS = out;
  return out;
}

// Haversine in meters
export function haversineMeters(a: Pt, b: Pt): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}