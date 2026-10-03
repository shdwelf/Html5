/**
 * SOCAL SUBSURFACE — radiowave propagation core.
 *
 * Pure functions. No THREE, no DOM, no network: hand it an elevation sampler
 * `elevAt(lon, lat) -> metres` and it will do terrain-aware path analysis over
 * whatever surface you have, synthetic field or real 3DEP grid.
 *
 * Three models live here, and they answer different questions:
 *
 *  1. FREE SPACE + KNIFE-EDGE DIFFRACTION over a 4/3-earth profile.
 *     The honest physical one. Used for the coverage polygons and the path
 *     profile tool. It knows about ridges, so its contours have fingers and
 *     shadows: Cajon Pass, the Verdugo wall, the San Jacinto back side.
 *
 *  2. THE FCC SMOOTH-EARTH CONTOUR, a closed-form stand-in for the F(50,50)
 *     curves of 47 CFR 73.333. It knows nothing about terrain — only ERP and
 *     HAAT — which is exactly the criticism levelled at contour maps. Carried
 *     so the app can show both numbers side by side and let them disagree.
 *
 *  3. AM GROUNDWAVE, an exponential-decay stand-in for the 47 CFR 73.184
 *     conductivity curves. Crude, flagged as crude, present because an AM
 *     clear channel in this frame does not propagate like anything else here.
 *
 * None of this is Longley-Rice (ITM). Longley-Rice as implemented in OET-69 is
 * the regulatory standard for DTV coverage and interference, and it adds
 * tropospheric scatter, climate zones, surface refractivity, ground constants
 * and location/time variability on top of the diffraction term. See
 * docs/socal-radio-propagation.md for the gap and for how to close it.
 */

/* ------------------------------------------------------------- constants */

/** Earth radius, km. */
export const EARTH_KM = 6371;

/** Standard refraction: the 4/3-earth k-factor used across broadcast work. */
export const K_FACTOR = 4 / 3;

/** Effective earth radius under standard refraction, km. */
export const EFF_EARTH_KM = EARTH_KM * K_FACTOR;

/**
 * Unattenuated free-space field at 1 km from 1 kW ERP (dipole reference),
 * in dB above 1 µV/m. 47 CFR 73.333 states the F(50,50) chart is built on an
 * ERP radiated from a half-wave dipole producing about 107 dBu at 1 km
 * (221.4 mV/m).
 */
export const FS_REF_DBU = 106.92;

/** Receive antenna height assumed by the FCC curves, metres AGL. */
export const RX_HEIGHT_M = 9;

/**
 * Smooth-earth contour model coefficients.
 *
 *   E(dBu) = K + 10·log10(ERP kW) + A·log10(HAAT m) − G·log10(d km)
 *
 * The height and distance exponents are least-squares fitted to all eight FCC
 * class reference facilities and their published reference distances in
 * 47 CFR 73.211(b)(1): worst case 3.3% error in distance (Class C2), RMS 1.8%.
 *
 * A sanity check worth recording: the Commission's own power/height trade in
 * 47 CFR 73.622(f) — ERPmax(dBk) = 72.57 − 17.08·log10(HAAT) for UHF, and the
 * same −17.08 slope for both VHF groups — is an iso-coverage curve. Our fit
 * says iso-coverage needs 10·log10(P) = const − 16.31·log10(HAAT). 16.31
 * against 17.08 is agreement to within 5% on an exponent nobody derived from
 * physics, which is about as much corroboration as a curve fit to a 1960s
 * chart can hope for.
 *
 * K is the band constant and it is *not* shared, because the FCC does not use
 * one chart for all of them. FM is anchored on the class reference facilities
 * above (F(50,50), 60 dBu). The three TV bands are anchored on the maximum
 * facility / maximum service radius pairs in the 47 CFR 73.626(c) Table of
 * Distances (Zone II/III, which is where California sits):
 *
 *   band       max facility        F(50,90) contour   threshold   K
 *   ch 2-6     45 kW @ 305 m       128 km             28 dBu      75.08
 *   ch 7-13    160 kW @ 305 m      123 km             36 dBu      76.71
 *   ch 14-36   1000 kW @ 365 m     103 km             41 dBu      68.68
 *
 * Fitting K per band matters more than it looks. The FM-fitted curve, pushed
 * out to the 28 dBu low-VHF threshold, predicts a 276 km contour where the
 * rule says 128 km — a single-slope power law cannot be right over both 30 km
 * and 300 km, because the real curves steepen past the horizon. Each K is
 * therefore honest only near its own anchor distance, which happens to be the
 * range these particular Mount Wilson stations work in.
 */
export const FCC_FIT = { K: 91.6046, A: 16.3125, G: 49.4173 };

/** Per-band band constants K for the equation above. See FCC_FIT. */
export const CONTOUR_FITS = {
  fm: { K: 91.6046, A: 16.3125, G: 49.4173, note: "47 CFR 73.211(b)(1) class reference facilities, F(50,50)" },
  vhfLo: { K: 75.08, A: 16.3125, G: 49.4173, note: "47 CFR 73.626(c) ch 2-6 Zone II/III, 45 kW @ 305 m -> 128 km" },
  vhfHi: { K: 76.71, A: 16.3125, G: 49.4173, note: "47 CFR 73.626(c) ch 7-13 Zone II/III, 160 kW @ 305 m -> 123 km" },
  uhf: { K: 68.68, A: 16.3125, G: 49.4173, note: "47 CFR 73.626(c) ch 14-36, 1000 kW @ 365 m -> 103 km" },
};

/**
 * Pick the band constants for a carrier frequency in MHz. Anything outside the
 * broadcast bands (land mobile, for instance) has no FCC contour chart of this
 * kind at all; those fall back to the nearest band and should be read as
 * indicative only — the terrain model is the one to trust there.
 */
export function contourFit(freqMHz = 98) {
  if (freqMHz >= 300) return CONTOUR_FITS.uhf;
  if (freqMHz >= 88 && freqMHz <= 108) return CONTOUR_FITS.fm;
  if (freqMHz >= 100) return CONTOUR_FITS.vhfHi;
  return CONTOUR_FITS.vhfLo;
}

/* ------------------------------------------------------------ free space */

/** Free-space field strength, dBµV/m, for an ERP in kW at d km. */
export function freeSpaceFieldDbu(erpKw, dKm) {
  const d = Math.max(dKm, 0.001);
  return FS_REF_DBU + 10 * Math.log10(Math.max(erpKw, 1e-9)) - 20 * Math.log10(d);
}

/** Wavelength in metres. */
export const wavelengthM = (freqMHz) => 299.792458 / freqMHz;

/**
 * Distance to the radio horizon from height h (metres) under 4/3-earth
 * refraction, km. d = sqrt(2·k·R·h) with R in metres → 4.124·sqrt(h).
 */
export function radioHorizonKm(hM) {
  return Math.sqrt(2 * EFF_EARTH_KM * Math.max(hM, 0) / 1000);
}

/** Earth bulge between two path legs, metres (4/3 earth). */
export function earthBulgeM(d1Km, d2Km) {
  return (d1Km * d2Km * 1000) / (2 * EFF_EARTH_KM);
}

/**
 * First Fresnel zone radius at a point split d1/d2 along the path, metres.
 * F1 = 17.32 · sqrt( d1·d2 / (f · d) ) with distances in km and f in GHz.
 */
export function fresnelRadiusM(freqMHz, d1Km, d2Km) {
  const d = d1Km + d2Km;
  if (d <= 0 || freqMHz <= 0) return 0;
  return 17.32 * Math.sqrt((d1Km * d2Km) / ((freqMHz / 1000) * d));
}

/**
 * Fresnel-Kirchhoff diffraction parameter v for an obstruction standing h
 * metres above the direct ray, with legs d1/d2 in km.
 *
 *   v = h · sqrt( 2(d1 + d2) / (λ · d1 · d2) )     [all lengths in metres]
 */
export function diffractionParameter(hM, d1Km, d2Km, freqMHz) {
  if (d1Km <= 0 || d2Km <= 0) return -Infinity;
  const lambda = wavelengthM(freqMHz);
  const d1 = d1Km * 1000;
  const d2 = d2Km * 1000;
  return hM * Math.sqrt((2 * (d1 + d2)) / (lambda * d1 * d2));
}

/**
 * Single knife-edge diffraction loss, dB, ITU-R P.526 approximation:
 *   J(v) = 6.9 + 20·log10( sqrt((v − 0.1)² + 1) + v − 0.1 )   for v > −0.78
 *   J(v) = 0                                                   otherwise
 */
export function knifeEdgeLossDb(v) {
  if (!Number.isFinite(v) || v <= -0.78) return 0;
  const t = v - 0.1;
  return 6.9 + 20 * Math.log10(Math.sqrt(t * t + 1) + t);
}

/* ------------------------------------------------- FCC smooth-earth model */

/** Smooth-earth FCC-curve field strength, dBµV/m. */
export function fccFieldDbu(erpKw, haatM, dKm, freqMHz = 98) {
  const h = Math.max(haatM, 30); // 47 CFR 73.313: HAAT below 30 m is taken as 30 m
  const { K, A, G } = contourFit(freqMHz);
  const curve = K + 10 * Math.log10(Math.max(erpKw, 1e-9)) + A * Math.log10(h) - G * Math.log10(Math.max(dKm, 0.001));
  // Never exceed free space: the fit is a far-field curve and runs away close in.
  return Math.min(curve, freeSpaceFieldDbu(erpKw, dKm));
}

/** Distance in km at which the smooth-earth model falls to `dbu`. */
export function fccContourKm(erpKw, haatM, dbu, freqMHz = 98) {
  const h = Math.max(haatM, 30);
  const { K, A, G } = contourFit(freqMHz);
  const exponent = (K + 10 * Math.log10(Math.max(erpKw, 1e-9)) + A * Math.log10(h) - dbu) / G;
  return 10 ** exponent;
}

/* -------------------------------------------------------- AM groundwave  */

/**
 * Daytime groundwave field, mV/m, as an exponential-decay stand-in for the
 * 47 CFR 73.184 conductivity curves.
 *
 *   E = (E0 / d) · exp(−d / d0),  d0 = 3.9 · σ(mS/m) / f(MHz)
 *
 * E0 is the unattenuated field at 1 km: 300 mV/m per kW½ for a conventional
 * quarter-to-half-wave series-fed radiator over a buried-copper ground system.
 * Calibrated so that a 50 kW clear channel at 640 kHz over 8 mS/m ground puts
 * its 0.5 mV/m contour near 160 km, which is about where Southern California's
 * Class A daytime signals actually land. It is a cartoon of a Sommerfeld
 * solution, not one.
 */
export function groundwaveFieldMvM(powerKw, dKm, freqMHz, sigmaMsM = 8) {
  const e0 = 300 * Math.sqrt(Math.max(powerKw, 1e-9));
  const d = Math.max(dKm, 0.1);
  const d0 = (3.9 * Math.max(sigmaMsM, 0.1)) / Math.max(freqMHz, 1e-6);
  return (e0 / d) * Math.exp(-d / d0);
}

/** mV/m → dBµV/m. */
export const mvmToDbu = (mvm) => 20 * Math.log10(Math.max(mvm, 1e-12) * 1000);

/** dBµV/m → mV/m. */
export const dbuToMvm = (dbu) => 10 ** (dbu / 20) / 1000;

/** Groundwave distance, km, to a given field in dBµV/m (bisection). */
export function groundwaveContourKm(powerKw, freqMHz, dbu, sigmaMsM = 8) {
  const target = dbuToMvm(dbu);
  let lo = 0.1;
  let hi = 2000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (groundwaveFieldMvM(powerKw, mid, freqMHz, sigmaMsM) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------- service targets */

/**
 * Service threshold in dBµV/m for a band/frequency.
 * UHF DTV is frequency-dependent per OET-69 Table 2: 41 − 20·log(615/f).
 */
export function serviceThresholdDbu(band, freqMHz) {
  switch (band) {
    case "fm":
      return 60;
    case "vhf":
      return freqMHz < 100 ? 28 : 36;
    case "uhf":
      return 41 - 20 * Math.log10(615 / Math.max(freqMHz, 1));
    case "am":
      return mvmToDbu(0.5);
    default:
      return 39;
  }
}

/* -------------------------------------------------------------- geodesy  */

const DEG = Math.PI / 180;
const KM_PER_DEG = 111.32;

/** Step from lon/lat along an azimuth (deg from north) by `km`. */
export function offsetLonLat(lon, lat, azimuthDeg, km) {
  const a = azimuthDeg * DEG;
  const dLat = (km * Math.cos(a)) / KM_PER_DEG;
  const latMid = lat + dLat / 2;
  const dLon = (km * Math.sin(a)) / (KM_PER_DEG * Math.cos(latMid * DEG));
  return [lon + dLon, lat + dLat];
}

/** Planar-approximation distance between two lon/lat points, km. */
export function distanceKm(lon1, lat1, lon2, lat2) {
  const latMid = ((lat1 + lat2) / 2) * DEG;
  const dx = (lon2 - lon1) * KM_PER_DEG * Math.cos(latMid);
  const dy = (lat2 - lat1) * KM_PER_DEG;
  return Math.hypot(dx, dy);
}

/** Azimuth in degrees from north, point 1 → point 2. */
export function azimuthDeg(lon1, lat1, lon2, lat2) {
  const latMid = ((lat1 + lat2) / 2) * DEG;
  const dx = (lon2 - lon1) * KM_PER_DEG * Math.cos(latMid);
  const dy = (lat2 - lat1) * KM_PER_DEG;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/* ------------------------------------------------------- terrain profile */

/**
 * Sample the ground along a radial.
 * @returns {{distKm: number[], elevM: number[], lon: number[], lat: number[]}}
 */
export function radialProfile(elevAt, lon, lat, azimuth, lengthKm, stepKm = 0.5) {
  const n = Math.max(2, Math.ceil(lengthKm / stepKm));
  const distKm = new Float64Array(n + 1);
  const elevM = new Float64Array(n + 1);
  const lons = new Float64Array(n + 1);
  const lats = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const d = (i * lengthKm) / n;
    const [plon, plat] = offsetLonLat(lon, lat, azimuth, d);
    distKm[i] = d;
    lons[i] = plon;
    lats[i] = plat;
    elevM[i] = elevAt(plon, plat);
  }
  return { distKm, elevM, lon: lons, lat: lats };
}

/** Sample the ground between two points. */
export function pathProfile(elevAt, from, to, steps = 160) {
  const distKm = new Float64Array(steps + 1);
  const elevM = new Float64Array(steps + 1);
  const lons = new Float64Array(steps + 1);
  const lats = new Float64Array(steps + 1);
  const total = distanceKm(from.lon, from.lat, to.lon, to.lat);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const plon = from.lon + (to.lon - from.lon) * t;
    const plat = from.lat + (to.lat - from.lat) * t;
    distKm[i] = total * t;
    lons[i] = plon;
    lats[i] = plat;
    elevM[i] = elevAt(plon, plat);
  }
  return { distKm, elevM, lon: lons, lat: lats, totalKm: total };
}

/* ----------------------------------------------------- path analysis core */

/**
 * Worst (largest) diffraction parameter over a profile between index 0 and
 * index `end`, treating the terminals as tx/rx AMSL heights.
 *
 * Earth curvature is folded in as a bulge added to each intermediate ground
 * height, which is the standard 4/3-earth flattening trick.
 */
export function worstObstruction(profile, end, txAmslM, rxAmslM, freqMHz) {
  const { distKm, elevM } = profile;
  const total = distKm[end];
  let worst = { v: -Infinity, index: -1, clearanceM: Infinity, heightM: 0, distKm: 0 };
  if (total <= 0) return worst;
  for (let i = 1; i < end; i++) {
    const d1 = distKm[i];
    const d2 = total - d1;
    if (d1 <= 0 || d2 <= 0) continue;
    const ray = txAmslM + ((rxAmslM - txAmslM) * d1) / total;
    const ground = elevM[i] + earthBulgeM(d1, d2);
    const h = ground - ray;
    const v = diffractionParameter(h, d1, d2, freqMHz);
    const f1 = fresnelRadiusM(freqMHz, d1, d2);
    if (v > worst.v) {
      worst = { v, index: i, clearanceM: -h, heightM: h, distKm: d1, fresnelM: f1, fresnelFraction: f1 > 0 ? -h / f1 : Infinity };
    }
  }
  return worst;
}

/**
 * Full point-to-point analysis.
 *
 * @param {object} o
 * @param {(lon:number,lat:number)=>number} o.elevAt elevation sampler, metres
 * @param {{lon:number,lat:number,aglM:number}} o.tx transmitter
 * @param {{lon:number,lat:number,aglM?:number}} o.rx receiver
 * @param {number} o.freqMHz carrier frequency
 * @param {number} o.erpKw effective radiated power
 * @param {number} [o.medianAllowanceDb] clutter / median-location allowance
 */
export function analyzePath({ elevAt, tx, rx, freqMHz, erpKw, steps = 160, medianAllowanceDb = 6 }) {
  const profile = pathProfile(elevAt, tx, rx, steps);
  const txAmsl = elevAt(tx.lon, tx.lat) + (tx.aglM || 0);
  const rxAmsl = elevAt(rx.lon, rx.lat) + (rx.aglM ?? RX_HEIGHT_M);
  const end = profile.distKm.length - 1;
  const obstruction = worstObstruction(profile, end, txAmsl, rxAmsl, freqMHz);
  const diffractionDb = knifeEdgeLossDb(obstruction.v);
  const fsDbu = freeSpaceFieldDbu(erpKw, profile.totalKm);
  return {
    profile,
    txAmsl,
    rxAmsl,
    distKm: profile.totalKm,
    obstruction,
    diffractionDb,
    freeSpaceDbu: fsDbu,
    fieldDbu: fsDbu - diffractionDb - medianAllowanceDb,
    // Geometric line of sight: no ground (plus 4/3 bulge) rises into the
    // straight ray. A path can be geometrically clear and still take a dB or
    // two of loss because the first Fresnel zone is obstructed — that is what
    // fresnelClear reports, and it is why microwave engineers survey for 0.6F1
    // clearance rather than for bare visibility.
    lineOfSight: obstruction.index < 0 || obstruction.heightM < 0,
    fresnelClear: (obstruction.fresnelFraction ?? Infinity) >= 0.6,
    horizonKm: radioHorizonKm(txAmsl - elevAt(rx.lon, rx.lat)) + radioHorizonKm(rx.aglM ?? RX_HEIGHT_M),
  };
}

/* -------------------------------------------------------------- coverage */

/**
 * March one radial outward and return the distance at which the terrain-aware
 * field drops below `thresholdDbu` and stays below it.
 */
export function coverageRadialKm({
  elevAt,
  lon,
  lat,
  aglM,
  azimuth,
  freqMHz,
  erpKw,
  thresholdDbu,
  maxKm = 220,
  stepKm = 1,
  medianAllowanceDb = 6,
  haatM = null,
}) {
  const profile = radialProfile(elevAt, lon, lat, azimuth, maxKm, stepKm);
  const txAmsl = profile.elevM[0] + aglM;
  const n = profile.distKm.length - 1;
  let last = 0;
  for (let i = 1; i <= n; i++) {
    const rxAmsl = profile.elevM[i] + RX_HEIGHT_M;
    const obstruction = worstObstruction(profile, i, txAmsl, rxAmsl, freqMHz);
    const physical =
      freeSpaceFieldDbu(erpKw, profile.distKm[i]) - knifeEdgeLossDb(obstruction.v) - medianAllowanceDb;
    // Over water or down a smooth desert radial, free space minus a knife edge
    // that never appears says a 1700 m site serves 240 km. Geometrically it
    // does — the ray clears the bulge. In practice the signal is eaten by
    // troposcatter variability, clutter and multipath that this model has no
    // term for, which is precisely what the FCC's statistical curves roll up.
    // So the smooth-earth curve is used as a CEILING: terrain can only ever
    // subtract from it. Shadows stay sharp, open radials stop at something a
    // broadcast engineer would recognise.
    const field =
      haatM == null ? physical : Math.min(physical, fccFieldDbu(erpKw, haatM, profile.distKm[i], freqMHz));
    if (field >= thresholdDbu) last = profile.distKm[i];
    else if (last > 0 && profile.distKm[i] > last + 12) break; // allow one shadowed valley, then stop
  }
  return last;
}

/**
 * Terrain-aware coverage ring for one emitter.
 *
 * @returns {{ring: [number,number][], radialsKm: number[], areaKm2: number,
 *            minKm: number, maxKm: number, meanKm: number}}
 */
export function coverageRing({
  elevAt,
  lon,
  lat,
  aglM,
  freqMHz,
  erpKw,
  thresholdDbu,
  azimuths = 72,
  maxKm = 220,
  stepKm = 1.5,
  medianAllowanceDb = 6,
  haatM = null,
}) {
  const ring = [];
  const radialsKm = [];
  for (let a = 0; a < azimuths; a++) {
    const az = (a * 360) / azimuths;
    const d = coverageRadialKm({
      elevAt,
      lon,
      lat,
      aglM,
      azimuth: az,
      freqMHz,
      erpKw,
      thresholdDbu,
      maxKm,
      stepKm,
      medianAllowanceDb,
      haatM,
    });
    radialsKm.push(d);
    ring.push(offsetLonLat(lon, lat, az, Math.max(d, 0.4)));
  }
  // Polygon area by the shoelace on the radial fan (planar, good at this scale).
  let areaKm2 = 0;
  for (let i = 0; i < radialsKm.length; i++) {
    const r1 = radialsKm[i];
    const r2 = radialsKm[(i + 1) % radialsKm.length];
    areaKm2 += 0.5 * r1 * r2 * Math.sin((2 * Math.PI) / radialsKm.length);
  }
  const sum = radialsKm.reduce((s, v) => s + v, 0);
  return {
    ring,
    radialsKm,
    areaKm2,
    minKm: Math.min(...radialsKm),
    maxKm: Math.max(...radialsKm),
    meanKm: sum / radialsKm.length,
  };
}

/**
 * Circular ring at a fixed radius — used to draw the smooth-earth FCC contour
 * next to the terrain-aware one, so the difference is visible rather than
 * argued about.
 */
export function circleRing(lon, lat, radiusKm, steps = 96) {
  const ring = [];
  for (let i = 0; i < steps; i++) ring.push(offsetLonLat(lon, lat, (i * 360) / steps, radiusKm));
  return ring;
}

/* ------------------------------------------------------------------ HAAT */

/**
 * Height above average terrain per 47 CFR 73.313(d): average the ground
 * elevation along each of the eight cardinal radials between 3 and 16 km,
 * then subtract that average from the antenna radiation centre AMSL.
 *
 * The rule samples at least 50 evenly spaced points per radial. Overall HAAT
 * is the mean of the eight radial values.
 */
export function haatPerFcc(elevAt, lon, lat, rcAmslM, { samples = 50 } = {}) {
  const radials = [];
  for (let a = 0; a < 8; a++) {
    const az = a * 45;
    let sum = 0;
    for (let i = 0; i < samples; i++) {
      const d = 3 + ((16 - 3) * i) / (samples - 1);
      const [plon, plat] = offsetLonLat(lon, lat, az, d);
      sum += elevAt(plon, plat);
    }
    const avg = sum / samples;
    radials.push({ azimuth: az, averageTerrainM: avg, haatM: rcAmslM - avg });
  }
  const haatM = radials.reduce((s, r) => s + r.haatM, 0) / radials.length;
  return { haatM, radials };
}

/* ------------------------------------------------------------- shadowing */

/**
 * Which named points does this emitter actually reach, and which are in its
 * terrain shadow? The payoff question for putting towers and a DEM in the
 * same scene.
 */
export function serviceCheck({ elevAt, tx, freqMHz, erpKw, thresholdDbu, targets, medianAllowanceDb = 6 }) {
  return targets
    .map((t) => {
      const a = analyzePath({ elevAt, tx, rx: { lon: t.lon, lat: t.lat }, freqMHz, erpKw, medianAllowanceDb });
      return {
        target: t,
        distKm: a.distKm,
        fieldDbu: a.fieldDbu,
        diffractionDb: a.diffractionDb,
        lineOfSight: a.lineOfSight,
        served: a.fieldDbu >= thresholdDbu,
        obstruction: a.obstruction,
      };
    })
    .sort((x, y) => x.distKm - y.distKm);
}
