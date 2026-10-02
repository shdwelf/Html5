/**
 * js/cheyenne-geo.js — dual-plate local equirectangular projection.
 *
 * The two theaters are ~1,300 km apart: a single flat projection cannot be
 * honest about both (the socal-subsurface theater solves this by being one
 * region). So each plate gets its own factory-built projection anchored on
 * its own center, and the app places the plates side by side in scene space
 * with the true great-circle distance labelled between them.
 *
 *   1 scene unit = 10 km at plate scale (UNITS_PER_KM = 0.1), matching the
 *   socal-subsurface convention so exaggeration sliders behave the same.
 */

export const KM_PER_DEG_LAT = 111.32;
export const UNITS_PER_KM = 0.1;

/** Great-circle distance in km (haversine, R = 6371 km). */
export function haversineKm(a, b) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Bearing from a to b, degrees clockwise from north. */
export function bearingDeg(a, b) {
  const rad = Math.PI / 180;
  const y = Math.sin((b.lon - a.lon) * rad) * Math.cos(b.lat * rad);
  const x =
    Math.cos(a.lat * rad) * Math.sin(b.lat * rad) -
    Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lon - a.lon) * rad);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

/**
 * Build a projection for one plate.
 * project(lon, lat) → { x, z } in plate-local scene units.
 * lonLatFromXZ(x, z) → { lon, lat } (inverse, exact for equirectangular).
 */
export function makeProjection(center) {
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  const kmPerDegLon = KM_PER_DEG_LAT * cosLat;
  return {
    center,
    cosLat,
    kmPerDegLon,
    project(lon, lat) {
      return {
        x: ((lon - center.lon) * kmPerDegLon) * UNITS_PER_KM,
        z: -((lat - center.lat) * KM_PER_DEG_LAT) * UNITS_PER_KM,
      };
    },
    lonLatFromXZ(x, z) {
      return {
        lon: center.lon + x / (kmPerDegLon * UNITS_PER_KM),
        lat: center.lat - z / (KM_PER_DEG_LAT * UNITS_PER_KM),
      };
    },
  };
}

/** Path length in km for a [[lon,lat], …] line (plate-local equirect). */
export function pathKm(path, projection) {
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    const a = projection.project(path[i - 1][0], path[i - 1][1]);
    const b = projection.project(path[i][0], path[i][1]);
    km += Math.hypot(b.x - a.x, b.z - a.z) / UNITS_PER_KM;
  }
  return km;
}

/** Resample a lon/lat path to roughly even `stepDeg` spacing. */
export function resample(path, stepDeg = 0.02) {
  if (path.length < 2) return path.slice();
  const out = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1];
    const [x1, y1] = path[i];
    const d = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const n = Math.max(1, Math.round(d / stepDeg));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

/** Point-in-ring test for lon/lat polygons (even-odd). */
export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export default { KM_PER_DEG_LAT, UNITS_PER_KM, haversineKm, bearingDeg, makeProjection, pathKm, resample, pointInRing };
