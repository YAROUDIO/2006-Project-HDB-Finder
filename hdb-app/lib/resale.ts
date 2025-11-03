// lib/resale.ts
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

export type FlatRow = {
  town: string;
  block: string;
  street_name: string;
  resale_price: string; // keep as string for JSON parity with your route
};

// Simple CSV splitter (quote-aware)
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

function monthToKey(m: string): number {
  // Expecting "YYYY-MM"
  const [y, mm] = (m || '').split('-').map(x => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mm)) return 0;
  return y * 100 + mm; // comparable numeric key
}

let CACHE: Map<string, FlatRow> | null = null; // key: BLK|STREET|TOWN => latest row

export async function loadFlatsForTowns(towns: string[]): Promise<FlatRow[]> {
  if (!CACHE) {
    const file = path.join(process.cwd(), 'data', 'ResaleflatpricesbasedonregistrationdatefromJan2017onwards.csv');
    console.log("[resale] reading resale CSV:", file);
    const txt = await fs.readFile(file, 'utf8');
    const { headers, rows } = parseCsv(txt);
    console.log(`[resale] parsed rows=${rows.length}, headers=${headers.length}`);

    const townKey = headers.find(h => /^town$/i.test(h)) || 'town';
    const blockKey = headers.find(h => /^(blk_no|block)$/i.test(h)) || 'block';
    const streetKey = headers.find(h => /^street[_\s]*name$/i.test(h) || /^street$/i.test(h)) || 'street_name';
    const priceKey = headers.find(h => /^resale[_\s]*price$/i.test(h)) || 'resale_price';
    const monthKey = headers.find(h => /^month$/i.test(h)) || 'month';

    const m = new Map<string, FlatRow & { _month: number }>();
    let skipped = 0;

    for (const r of rows) {
      const town = (r[townKey] ?? '').toString().trim().toUpperCase();
      const block = (r[blockKey] ?? '').toString().trim().toUpperCase();
      const street_name = (r[streetKey] ?? '').toString().trim().toUpperCase();
      const resale_price = (r[priceKey] ?? '').toString().trim();
      const month = (r[monthKey] ?? '').toString().trim();

      if (!town || !block || !street_name || !resale_price) { skipped++; continue; }

      const mk = monthToKey(month);
      const key = `${block}|${street_name}|${town}`;
      const prev = m.get(key);
      if (!prev || mk > prev._month) {
        m.set(key, { town, block, street_name, resale_price, _month: mk });
      }
    }

    // strip helper field
    CACHE = new Map<string, FlatRow>();
    for (const [k, v] of m.entries()) {
      const { _month, ...rest } = v;
      CACHE.set(k, rest);
    }

    console.log(`[resale] unique latest entries=${CACHE.size}, skipped invalid=${skipped}`);
  }

  const wanted = new Set(towns.map(t => t.trim().toUpperCase()));
  const out: FlatRow[] = [];
  for (const v of CACHE.values()) {
    if (wanted.has(v.town.trim().toUpperCase())) out.push(v);
  }
  console.log(`[resale] returning ${out.length} rows for ${wanted.size} requested towns.`);
  return out;
}