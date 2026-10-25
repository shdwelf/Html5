/**
 * dish-pointing.js — geostationary dish-pointing / satellite-alignment
 * calculator (S5 layer math; backlog: "dish-pointing / satellite-
 * alignment calculator layer").
 *
 * Given an observer (lat/lon) and a GEO satellite (orbital longitude),
 * compute look angles: azimuth, elevation, slant range, and whether
 * the satellite is above the local horizon at all. Spherical-Earth
 * model — the industry-standard first-order pointing calculation
 * (accurate to well under a degree for GEO alignment; it ignores
 * Earth oblateness, atmospheric refraction, and magnetic declination,
 * and the module says so in every result).
 *
 * Pure functions, no I/O. Angles in degrees, ranges in km.
 */

export const EARTH_RADIUS_KM = 6371.0;
export const GEO_RADIUS_KM = 42164.17; // Earth-centre distance of the GEO arc

const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function normLon(lon) {
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  return l === -180 ? 180 : l;
}

/**
 * Look angles from an observer to a GEO satellite.
 * @param {{lat:number, lon:number}} observer degrees, lon East-positive
 * @param {number} satLon satellite orbital longitude, degrees East-positive
 * @returns {{azimuthDeg:number, elevationDeg:number, rangeKm:number,
 *   visible:boolean, model:string}}
 *   azimuthDeg is true-north clockwise (add local magnetic declination
 *   for a compass); visible=false when elevationDeg < 0.
 */
export function geoLookAngles(observer, satLon) {
  if (!observer || !Number.isFinite(observer.lat) || !Number.isFinite(observer.lon)) {
    throw new TypeError("observer must have finite lat/lon");
  }
  if (observer.lat < -90 || observer.lat > 90) throw new RangeError("lat out of range");
  if (!Number.isFinite(satLon)) throw new TypeError("satLon must be finite");

  const phi = rad(observer.lat);
  const lam = rad(normLon(observer.lon));
  const lamS = rad(normLon(satLon));

  // ECEF positions (spherical Earth).
  const ox = EARTH_RADIUS_KM * Math.cos(phi) * Math.cos(lam);
  const oy = EARTH_RADIUS_KM * Math.cos(phi) * Math.sin(lam);
  const oz = EARTH_RADIUS_KM * Math.sin(phi);
  const sx = GEO_RADIUS_KM * Math.cos(lamS);
  const sy = GEO_RADIUS_KM * Math.sin(lamS);
  const vx = sx - ox, vy = sy - oy, vz = -oz;

  // ENU components at the observer.
  const east = -Math.sin(lam) * vx + Math.cos(lam) * vy;
  const north = -Math.sin(phi) * Math.cos(lam) * vx
    - Math.sin(phi) * Math.sin(lam) * vy + Math.cos(phi) * vz;
  const up = Math.cos(phi) * Math.cos(lam) * vx
    + Math.cos(phi) * Math.sin(lam) * vy + Math.sin(phi) * vz;

  const rangeKm = Math.hypot(vx, vy, vz);
  const elevationDeg = deg(Math.atan2(up, Math.hypot(east, north)));
  let azimuthDeg = deg(Math.atan2(east, north));
  if (azimuthDeg < 0) azimuthDeg += 360;

  return {
    azimuthDeg,
    elevationDeg,
    rangeKm,
    visible: elevationDeg > 0,
    model: "spherical-earth; no refraction/declination correction",
  };
}

/**
 * Maximum GEO arc visibility for an observer: the longitude span over
 * which a GEO satellite stays above a minimum elevation. Useful for
 * "which satellites can this site see" layer queries.
 */
export function geoVisibleArc(observer, minElevationDeg = 0) {
  if (!Number.isFinite(minElevationDeg)) throw new TypeError("minElevationDeg must be finite");
  const lon = normLon(observer.lon);
  let lo = null, hi = null;
  for (let d = -180; d <= 180; d += 0.25) {
    const satLon = normLon(lon + d);
    if (geoLookAngles(observer, satLon).elevationDeg >= minElevationDeg) {
      if (lo === null) lo = d;
      hi = d;
    }
  }
  if (lo === null) return null;
  return { westOffsetDeg: lo, eastOffsetDeg: hi, observerLon: lon };
}
