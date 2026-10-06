/**
 * js/four-corners-geo.js — the FOUR CORNERS 4Dwm geo core.
 *
 * The projection, the curated IDW relief field and the planar path length,
 * split out of js/four-corners.js so they can be imported anywhere — the
 * viewer, the tests, and four-corners-calc/tools/fc_dump.mjs, which runs this
 * file under node to pin the calculator port's integer terrain field to the
 * app's own elevAt() rather than to a copy of its numbers.
 *
 * Single source of truth for the constants: META.center in the data pack.
 */

import { META, TERRAIN_POINTS } from "./four-corners-data.js";

export const KM_PER_DEG_LAT = 111.32;
export const COS_LAT = Math.cos((META.center.lat * Math.PI) / 180);
export const KM_PER_DEG_LON = KM_PER_DEG_LAT * COS_LAT;
export const UNITS_PER_KM = META.unitsPerKm; // 0.1 → 1 scene unit = 10 km

/* Local equirectangular projection about META.center (scene units). */
export const px = (lon) => (lon - META.center.lon) * KM_PER_DEG_LON * UNITS_PER_KM;
export const pz = (lat) => -(lat - META.center.lat) * KM_PER_DEG_LAT * UNITS_PER_KM;
export const lonFromX = (x) => META.center.lon + x / (KM_PER_DEG_LON * UNITS_PER_KM);
export const latFromZ = (z) => META.center.lat - z / (KM_PER_DEG_LAT * UNITS_PER_KM);

/* Curated control-point relief — inverse-distance interpolation, power 2.4,
   distances in km, snapping to the anchor inside 0.5 km. Context tier by
   construction: a reading surface, not a DEM. */
export const IDW_POWER = 2.4;
export const IDW_SNAP_KM2 = 0.25;

export function elevAt(lon, lat) {
  let num = 0, den = 0;
  for (const [plon, plat, pel] of TERRAIN_POINTS) {
    const dx = (lon - plon) * KM_PER_DEG_LON;
    const dy = (lat - plat) * KM_PER_DEG_LAT;
    const d2 = dx * dx + dy * dy;
    if (d2 < IDW_SNAP_KM2) return pel;
    const w = 1 / Math.pow(d2, IDW_POWER / 2);
    num += w * pel;
    den += w;
  }
  return num / den;
}

/* Planar polyline length in km — the same approximation socal-geo.js uses. */
export function pathKm(path) {
  let km = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = (path[i + 1][0] - path[i][0]) * KM_PER_DEG_LON;
    const dy = (path[i + 1][1] - path[i][1]) * KM_PER_DEG_LAT;
    km += Math.hypot(dx, dy);
  }
  return km;
}
