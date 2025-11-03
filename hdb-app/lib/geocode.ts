// lib/geocode.ts
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

type GeoPt = { lat: number; lng: number };

let IDX3: Map<string, GeoPt> | null = null; // BLOCK|STREET|TOWN (only if a real 'town' column exists)
let IDX2: Map<string, GeoPt> | null = null; // BLOCK|STREET (fallback)

function norm(s: string): string {
  return (s || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function key2(block: string, street: string): string {
  return `${norm(block)}|${norm(street)}`;
}

function key3(block: string, street: string, town: string): string {
  return `${norm(block)}|${norm(street)}|${norm(town)}`;
}

function parseFloatSafe(x: string): number | null {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

function buildIndexesIfNeeded() {
  if (IDX2 && IDX3) return;

  IDX2 = new Map();
  IDX3 = new Map();

  const file = path.join(process.cwd(), 'data', 'hdb_property_information_ll.csv');
  console.log("[geocode] building indexes from", file);
  const txt = fs.readFileSync(file, 'utf8');

  const lines = txt.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    console.warn("[geocode] empty hdb_property_information_ll.csv");
    return;
  }

  // lightweight, header-based CSV parse (non-quoted)
  const headers = lines[0].split(',').map(h => h.trim());
  const idxBlk = headers.findIndex(h => /^blk[_\s]*no$/i.test(h));
  const idxStreet = headers.findIndex(h => /^street$/i.test(h));
  const idxLat = headers.findIndex(h => /^lat$/i.test(h));
  const idxLng = headers.findIndex(h => /^lng$/i.test(h));
  const idxTown = headers.findIndex(h => /^town$/i.test(h));
  const idxBCT  = headers.findIndex(h => /^bldg[_\s]*contract[_\s]*town$/i.test(h)); // not used for lookup today

  if (idxBlk < 0 || idxStreet < 0 || idxLat < 0 || idxLng < 0) {
    console.error("[geocode] required headers missing: blk_no, street, lat, lng");
    return;
  }

  let c2 = 0, c3 = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const blk = parts[idxBlk] ?? '';
    const street = parts[idxStreet] ?? '';
    const lat = parseFloatSafe(parts[idxLat] ?? '');
    const lng = parseFloatSafe(parts[idxLng] ?? '');
    if (!blk || !street || lat == null || lng == null) continue;

    const pt = { lat, lng };

    // Always index 2-part
    IDX2.set(key2(blk, street), pt);
    c2++;

    // If dataset already has a 'town' column, index 3-part
    if (idxTown >= 0) {
      const town = parts[idxTown] ?? '';
      if (town) {
        IDX3.set(key3(blk, street, town), pt);
        c3++;
      }
    }
  }

  console.log(`[geocode] built indexes: 2-part=${c2} entries, 3-part=${c3} entries, townHeader=${idxTown >= 0}, bldg_contract_townHeader=${idxBCT >= 0}`);
}

export async function geocodeWithCache(block: string, streetName: string, town?: string): Promise<GeoPt | null> {
  buildIndexesIfNeeded();

  // Try strict 3-part first (when available)
  if (town && IDX3) {
    const k3 = key3(block, streetName, town);
    const hit3 = IDX3.get(k3);
    if (hit3) {
      // uncomment to be very verbose:
      // console.debug("[geocode] HIT 3-part", k3, "→", hit3);
      return hit3;
    }
    // console.debug("[geocode] miss 3-part", k3);
  }

  // Fallback 2-part
  if (IDX2) {
    const k2 = key2(block, streetName);
    const hit2 = IDX2.get(k2);
    if (hit2) {
      // console.debug("[geocode] HIT 2-part", k2, "→", hit2);
      return hit2;
    }
    // console.debug("[geocode] miss 2-part", k2);
  }

  return null;
}