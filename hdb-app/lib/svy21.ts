// lib/svy21.ts
// SVY21 (EPSG:3414) -> WGS84 lat/lng
// Adapted for Singapore TM (SVY21). Good for block-level accuracy.

const a = 6378137.0;                  // WGS84 major axis
const f = 1 / 298.257223563;          // WGS84 flattening
const k0 = 1.0;                       // SVY21 scale factor
const e2 = 2 * f - f * f;             // eccentricity squared
const b = a * (1 - f);
const e4 = e2 * e2;
const e6 = e4 * e2;

const falseE = 28001.642;
const falseN = 38744.572;
const lat0 = toRad(1 + 22 / 60);      // 1°22' N
const lon0 = toRad(103 + 50 / 60);    // 103°50' E

function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

export function svy21ToWgs84(x: number, y: number): { lat: number; lng: number } {
  const E = x - falseE;
  const N = y - falseN;

  // Meridional arc
  const n = (a - b) / (a + b);
  const A0 = 1 + (n * n) / 4 + (n ** 4) / 64;
  const A2 = (3 / 2) * (n - (n ** 3) / 8);
  const A4 = (15 / 16) * (n * n - (n ** 4) / 4);
  const A6 = (35 / 48) * (n ** 3);
  const A8 = (315 / 512) * (n ** 4);

  const M = N / (a * (1 - e2) * A0 * k0);
  let latPrime =
    lat0 +
    M +
    A2 * Math.sin(2 * (lat0 + M)) +
    A4 * Math.sin(4 * (lat0 + M)) +
    A6 * Math.sin(6 * (lat0 + M)) +
    A8 * Math.sin(8 * (lat0 + M));

  // Series terms
  const sinLat = Math.sin(latPrime);
  const cosLat = Math.cos(latPrime);
  const tanLat = Math.tan(latPrime);

  const v = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = (a * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const psi = v / rho;

  const xOverKv = E / (k0 * v);

  // Latitude
  const term1 = (tanLat / (2 * k0 * k0 * rho * v)) * (E * E);
  const term2 =
    (tanLat / (24 * k0 ** 4 * rho * v ** 3)) *
    (5 + 3 * tanLat * tanLat + psi - 9 * psi * tanLat * tanLat) *
    (E ** 4);
  const term3 =
    (tanLat / (720 * k0 ** 6 * rho * v ** 5)) *
    (61 + 90 * tanLat * tanLat + 45 * tanLat ** 4) *
    (E ** 6);

  const lat = latPrime - term1 + term2 - term3;

  // Longitude
  const lon =
    lon0 +
    xOverKv / cosLat -
    ((1 + 2 * tanLat * tanLat + psi) * Math.pow(xOverKv, 3)) / (6 * cosLat) +
    ((5 + 28 * tanLat * tanLat + 24 * tanLat ** 4 + 6 * psi + 8 * psi * tanLat * tanLat) *
      Math.pow(xOverKv, 5)) /
      (120 * cosLat);

  return { lat: toDeg(lat), lng: toDeg(lon) };
}
