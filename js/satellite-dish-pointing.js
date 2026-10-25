// Dish pointing / satellite-alignment calculator (S5 · T5.1).
// Closed-form GEO look angles on the same spherical model this viewer uses.
// Cross-checked in tests against an independent ECEF→ENU vector derivation
// and against a published worked example (SPU lecture: 52°N/0° → 66°E,
// azimuth 109.33°, elevation 5.85°).
import { EARTH_RADIUS_KM, MU_EARTH_KM3_S2 } from "./satellite-constellations-data.js";

export const EARTH_ROTATION_RAD_S = 7.2921150e-5;

export function geoOrbitRadiusKm(mu = MU_EARTH_KM3_S2, omega = EARTH_ROTATION_RAD_S) {
  return Math.cbrt(mu / (omega * omega));
}

function wrap180(deg) {
  const w = ((deg + 180) % 360 + 360) % 360 - 180;
  return w;
}

const DEG = Math.PI / 180;

export function geostationaryLookAngles({
  siteLatDeg,
  siteLonDeg,
  satLonDeg,
  earthRadiusKm = EARTH_RADIUS_KM,
  geoRadiusKm = geoOrbitRadiusKm(),
}) {
  for (const [name, v] of [["siteLatDeg", siteLatDeg], ["siteLonDeg", siteLonDeg], ["satLonDeg", satLonDeg]]) {
    if (!Number.isFinite(v)) throw new Error(`dish pointing: ${name} must be a finite number`);
  }
  if (siteLatDeg < -90 || siteLatDeg > 90) throw new Error("dish pointing: siteLatDeg out of [-90, 90]");
  const lat = siteLatDeg * DEG;
  const dLon = wrap180(satLonDeg - siteLonDeg) * DEG;
  const cosGamma = Math.min(1, Math.max(-1, Math.cos(lat) * Math.cos(dLon)));
  const gamma = Math.acos(cosGamma);
  const sinGamma = Math.sin(gamma);
  const kRatio = earthRadiusKm / geoRadiusKm;
  const horizonCentralAngleDeg = Math.acos(kRatio) / DEG;

  let elevationDeg;
  let azimuthDeg = null;
  if (gamma < 1e-9) {
    elevationDeg = 90;
  } else {
    elevationDeg = Math.atan2(cosGamma - kRatio, sinGamma) / DEG;
    // Great-circle bearing to the sub-satellite point (latitude 0):
    // atan2(sin Δλ, −sin φ · cos Δλ), normalised to [0, 360).
    azimuthDeg = (Math.atan2(Math.sin(dLon), -Math.sin(lat) * Math.cos(dLon)) / DEG + 360) % 360;
  }
  const rangeKm = Math.sqrt(
    earthRadiusKm * earthRadiusKm + geoRadiusKm * geoRadiusKm - 2 * earthRadiusKm * geoRadiusKm * cosGamma,
  );
  return {
    azimuthDeg,
    elevationDeg,
    rangeKm,
    centralAngleDeg: gamma / DEG,
    aboveHorizon: elevationDeg > 0,
    horizonCentralAngleDeg,
    geoRadiusKm,
    earthRadiusKm,
    kRatio,
  };
}
