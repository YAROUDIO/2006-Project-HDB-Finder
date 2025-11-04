// lib/resale.ts
import "server-only";
import path from "node:path";
import fs from "node:fs/promises";

// Types used by finder
export type FlatRow = {
  town: string;
  block: string;
  street_name: string;
  flat_type: string;
  month: string;         // YYYY-MM
  resale_price: string;  // numeric string from API
};

// ===== data.gov.sg resale dataset info =====
const RESOURCE_ID = "f1765b54-a209-4718-8d38-a39237f502b3"; // Resale flat prices (Jan 2017 on)
const PAGE_SIZE = 1000;

// ---------- small utils ----------
function ymToKey(m: string): number {
  const [y, mm] = (m || "").split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mm)) return 0;
  return y * 100 + mm;
}
function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(n => parseInt(n, 10));
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + delta);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}
function isWithinRecentMonths(month: string, recentMonths: number): boolean {
  if (!recentMonths || recentMonths <= 0) return true;
  // End anchor: current month
  const now = new Date();
  const anchor = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const start = addMonths(anchor, -recentMonths + 1); // inclusive window
  const k = ymToKey(month);
  return k >= ymToKey(start) && k <= ymToKey(anchor);
}

function normU(s: string) { return (s ?? "").toString().trim().toUpperCase(); }

// ---------- GET: All towns from dataset ----------
export async function getAllTownsFromResaleAPI(): Promise<string[]> {
  const towns = new Set<string>();
  let offset = 0;
  for (let i = 0; i < 10; i++) { // up to 10k rows sample should include all towns
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}`;
    // Cache town discovery for a day; towns rarely change
    const r = await fetch(url, { next: { revalidate: 86400 } });
    const j = await r.json();
    const rows: any[] = j?.result?.records ?? [];
    for (const row of rows) {
      const t = normU(row.town || "");
      if (t) towns.add(t);
    }
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  const arr = Array.from(towns).sort((a, b) => a.localeCompare(b));
  // Fallback if something odd happens
  if (arr.length === 0) return ["ANG MO KIO", "BEDOK", "BISHAN", "BUKIT BATOK", "QUEENSTOWN", "TOA PAYOH"];
  return arr;
}

// ---------- FETCH: rows for a single town & flat type ----------
async function fetchTownTypeRows(town: string, flatType: string): Promise<FlatRow[]> {
  const T = normU(town);
  const F = normU(flatType);
  const filters = encodeURIComponent(JSON.stringify({ town: T, flat_type: F }));
  let offset = 0;
  const out: FlatRow[] = [];
  for (let i = 0; i < 500; i++) { // 500 * 1000 = 500k safety cap
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}&filters=${filters}`;
    // Cache upstream responses on the server for 1 hour to avoid repeated downloads
    const r = await fetch(url, { next: { revalidate: 3600 } });
    if (!r.ok) throw new Error(`Failed to fetch resale data: HTTP ${r.status}`);
    const j = await r.json();
    const rows: any[] = j?.result?.records ?? [];
    for (const rec of rows) {
      const row: FlatRow = {
        town: normU(rec.town || ""),
        block: normU(rec.block || rec.blk_no || ""),
        street_name: normU(rec.street_name || rec.street || ""),
        flat_type: normU(rec.flat_type || ""),
        month: (rec.month || "").toString().trim(),
        resale_price: (rec.resale_price || "").toString().trim(),
      };
      if (row.town && row.block && row.street_name && row.flat_type && row.month && row.resale_price) {
        out.push(row);
      }
    }
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return out;
}

// ---------- GROUP: choose cheapest recent per (BLOCK, STREET, TOWN) ----------
export async function loadCheapestRecentByBlockForTownsAndType(
  towns: string[],
  flatType: string,
  recentMonths: number
): Promise<FlatRow[]> {
  const wanted = towns.map(normU);
  // Fetch towns in parallel for speed
  const perTown = await Promise.all(wanted.map((t) => fetchTownTypeRows(t, flatType)));
  const all: FlatRow[] = perTown.flat();
  console.log(`[resale] fetched ${all.length} rows for towns=${wanted.join(",")} type=${flatType}`);

  type Agg = {
    bestRecent?: FlatRow; // cheapest within window
    bestAll?: FlatRow;    // cheapest overall (fallback)
  };

  const m = new Map<string, Agg>(); // key = block|street|town

  for (const r of all) {
    const key = `${r.block}|${r.street_name}|${r.town}`;
    const price = Number(r.resale_price);
    if (!Number.isFinite(price)) continue;

    let ag = m.get(key);
    if (!ag) { ag = {}; m.set(key, ag); }

    // best overall
    if (!ag.bestAll || Number(ag.bestAll.resale_price) > price) {
      ag.bestAll = r;
    }
    // best in recent window
    if (isWithinRecentMonths(r.month, recentMonths)) {
      if (!ag.bestRecent || Number(ag.bestRecent.resale_price) > price) {
        ag.bestRecent = r;
      }
    }
  }

  const out: FlatRow[] = [];
  for (const [k, ag] of m.entries()) {
    const pick = ag.bestRecent ?? ag.bestAll;
    if (pick) out.push(pick);
  }

  console.log(`[resale] grouped to ${out.length} representative rows (policy: cheapest recent ${recentMonths}m, fallback cheapest ever).`);
  return out;
}