// lib/coords.ts
import proj4 from "proj4";

export type Pt = { lat: number; lng: number };

// EPSG:3414 (SVY21) → WGS84
const EPSG3414 =
  "+proj=tmerc +lat_0=1.36666666666667 +lon_0=103.83333333333333 " +
  "+k=1.0 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs";

function isFiniteNum(x: any) { return Number.isFinite(x); }
function looksLikeLatLng(lat: any, lng: any) {
  return isFiniteNum(lat) && isFiniteNum(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * Coerce many common data.gov / GeoJSON shapes into {lat,lng} (WGS84 degrees).
 * - Accepts LAT/LONG / latitude/longitude / x/y / X_COORD/Y_COORD
 * - Auto-reads GeoJSON geometry.coordinates [lng, lat]
 * - Converts SVY21 (EPSG:3414) to WGS84 when needed
 */
export function toLatLngAny(x: any): Pt | null {
  if (!x) return null;

  // Common field names
  let lat = x.lat ?? x.Lat ?? x.latitude ?? x.LATITUDE ?? x.y ?? x.Y ?? x.Y_COORD ?? x.y_coord;
  let lng = x.lng ?? x.lon ?? x.long ?? x.Lon ?? x.longitude ?? x.LONGITUDE ?? x.x ?? x.X ?? x.X_COORD ?? x.x_coord;

  // GeoJSON geometry [lng, lat]
  if ((lat == null || lng == null) && x.geometry?.coordinates?.length >= 2) {
    const [gx, gy] = x.geometry.coordinates;
    lng = lng ?? gx; lat = lat ?? gy;
  }

  const nlat = typeof lat === "string" ? Number(lat.trim()) : lat;
  const nlng = typeof lng === "string" ? Number(lng.trim()) : lng;

  // Already WGS84?
  if (looksLikeLatLng(nlat, nlng)) return { lat: nlat, lng: nlng };

  // Try projected easting/northing
  const ex = (isFiniteNum(nlng) ? nlng : (x.E ?? x.e ?? x.EASTING ?? x.easting ?? x.X ?? x.x));
  const ey = (isFiniteNum(nlat) ? nlat : (x.N ?? x.n ?? x.NORTHING ?? x.northing ?? x.Y ?? x.y));
  if (!isFiniteNum(ex) || !isFiniteNum(ey)) return null;

  // Convert SVY21 (returns [lng, lat])
  const [lngWGS, latWGS] = proj4(EPSG3414, proj4.WGS84, [Number(ex), Number(ey)]);
  if (!looksLikeLatLng(latWGS, lngWGS)) return null;
  return { lat: latWGS, lng: lngWGS };
}

export function normalizeList(arr: any[]): Pt[] {
  if (!Array.isArray(arr)) return [];
  const out: Pt[] = [];
  for (const item of arr) {
    const pt = toLatLngAny(item);
    if (pt) out.push(pt);
  }
  return out;
}
