// lib/scoring.ts
// Utility functions for HDB scoring logic (used by /api/finder)

export type WeightInput = {
  mrt: number;
  school: number;
  hospital: number;
  affordability: number;
};

export type Distances = {
  dMrt: number;
  dSchool: number;
  dHospital: number;
};

export type FlatCandidate = {
  price: number;
  distances: Distances;
};

// --- Utility helpers ---
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Linear distance → score (0–100)
// 0m = 100, capMeters = 0, decreases linearly until 0 at capMeters
export function distanceToBaseScore(meters: number, capMeters: number): number {
  if (!Number.isFinite(meters)) return 0;
  const score = 100 * (1 - meters / capMeters);
  return Math.max(0, Math.min(100, score));
}

// Converts 0–10 slider values into percentage shares
export function normalizeWeights(w: WeightInput) {
  const safe = {
    mrt: Math.max(0, w.mrt || 0),
    school: Math.max(0, w.school || 0),
    hospital: Math.max(0, w.hospital || 0),
    affordability: Math.max(0, w.affordability || 0),
  };
  let total = safe.mrt + safe.school + safe.hospital + safe.affordability;
  if (total <= 0) total = 4; // default equal if all 0

  return {
    mrt: safe.mrt / total,
    school: safe.school / total,
    hospital: safe.hospital / total,
    affordability: safe.affordability / total,
  };
}

// Computes the price rank score (cheaper = higher score)
export function computePriceScore(price: number, low: number, high: number): number {
  const span = Math.max(high - low, 1);
  return 100 * clamp01((high - price) / span);
}

// Main scoring function for 1 flat
export function computeFlatScore(
  flat: FlatCandidate,
  weights: WeightInput,
  priceLow: number,
  priceHigh: number
) {
  const pct = normalizeWeights(weights);

  const baseMrt = distanceToBaseScore(flat.distances.dMrt, 3000);
  const baseSchool = distanceToBaseScore(flat.distances.dSchool, 2000);
  const baseHospital = distanceToBaseScore(flat.distances.dHospital, 3000);

  const priceScore =
    Number.isFinite(flat.price)
      ? computePriceScore(flat.price, priceLow, priceHigh)
      : 50; // fallback mid-value

  // Final 0–100
  const score =
    pct.mrt * baseMrt +
    pct.school * baseSchool +
    pct.hospital * baseHospital +
    pct.affordability * priceScore;

  return Math.max(0, Math.min(100, score));
}