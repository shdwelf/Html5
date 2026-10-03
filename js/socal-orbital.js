/**
 * SOCAL SUBSURFACE — orbital observation windows.
 *
 * Minimal on purpose. This is not an ephemeris and it will not pretend to be
 * one: there is no SGP4 here, no TLE, no network. What it does is the
 * geometry that *is* stable for a sun-synchronous repeat-ground-track mission,
 * which is most of what you actually want to know when you are standing in the
 * frame looking up:
 *
 *   • which direction the thing crosses (ground-track heading at this latitude)
 *   • what local solar time it crosses at (derived, not guessed)
 *   • how wide the swath is, and therefore whether the frame is covered
 *   • how often it comes back (the repeat cycle, which is exact by design)
 *
 * What it cannot do is tell you the calendar date of the next pass to the
 * minute. A repeat-ground-track orbit recurs on an exact cycle, so the date
 * arithmetic is trivial *once you know one true pass*. The anchor epoch below
 * is declared nominal and tiered `context` for exactly that reason: re-anchor
 * `cycleAnchorUtc` to one observed acquisition and every window in the list
 * becomes real. One constant per satellite, documented in
 * docs/socal-utilities-orbital.md.
 *
 * The honest part is the time of day, and it is derived properly. For a
 * sun-synchronous orbit the local mean solar time at latitude φ is
 *
 *   LMST(φ) = LMST(node) + Δλ/15°,  Δλ = atan2(cos i · sin u, cos u)
 *
 * where u is the argument of latitude measured from the relevant node and
 * sin φ = sin i · sin u. The Earth-rotation terms cancel exactly, which is the
 * small piece of algebra that makes this worth shipping instead of hand-waving.
 */

const DEG = Math.PI / 180;

/** Sidereal-ish Earth rotation rate at the surface, used for track heading. */
const EARTH_SURFACE_SPEED_KMS = 0.4651;

export const ORBITAL_SOURCE_URLS = [
  "https://sentiwiki.copernicus.eu/web/s1-mission — Sentinel-1 mission and orbit",
  "https://nisar.jpl.nasa.gov/ — NISAR mission characteristics",
  "https://www.usgs.gov/landsat-missions/landsat-9 — orbit, repeat cycle, crossing time",
  "https://www.usgs.gov/landsat-missions/landsat-acquisitions — WRS-2 and the long term acquisition plan",
  "https://science.nasa.gov/mission/landsat-9/ — quick facts",
];

/**
 * The satellites that actually matter over this frame: two SAR constellations
 * that measure the ground moving, and the optical record that goes back to
 * 1972 and is the reason anyone can say what the Mojave looked like before.
 */
export const SATELLITES = [
  {
    id: "sentinel-1a",
    name: "Sentinel-1A",
    agency: "ESA / Copernicus",
    kind: "sar",
    color: "#a3e635",
    band: "C-band 5.405 GHz (5.55 cm)",
    altitudeKm: 693,
    inclinationDeg: 98.18,
    periodMin: 98.6,
    repeatDays: 12,
    nodeLocalTimeHours: 18.0,
    nodeType: "ascending", // LTAN 18:00 — dawn-dusk, lit solar panels year round
    swathKm: 250,
    resolution: "5 × 20 m, Interferometric Wide swath",
    cycleAnchorUtc: "2026-01-02T00:00:00Z",
    tier: "official",
    facts: [
      "Launched 3 April 2014. Dawn-dusk sun-synchronous at 18:00 local time of the ascending node, which keeps the solar panels in sunlight almost continuously.",
      "Interferometric Wide swath: 250 km wide, 5 × 20 m, dual polarisation. The default mode over land, and the reason InSAR time series over California are routine rather than special.",
      "Orbit control is tight enough — a few hundred metres tube — that 12-day repeat pairs interfere. That orbital tube is the actual instrument.",
      "Each of the 175 relative orbits has its own well-defined incidence angle, which is why backscatter products can be normalised per track.",
    ],
    sources: ["ESA Copernicus Sentinel-1 mission documentation", "Nature Scientific Data — Sentinel-1 Global Backscatter Model"],
  },
  {
    id: "sentinel-1c",
    name: "Sentinel-1C",
    agency: "ESA / Copernicus",
    kind: "sar",
    color: "#84cc16",
    band: "C-band 5.405 GHz (5.55 cm)",
    altitudeKm: 693,
    inclinationDeg: 98.18,
    periodMin: 98.6,
    repeatDays: 12,
    nodeLocalTimeHours: 18.0,
    nodeType: "ascending",
    swathKm: 250,
    resolution: "5 × 20 m, Interferometric Wide swath",
    cycleAnchorUtc: "2026-01-08T00:00:00Z",
    tier: "official",
    facts: [
      "Launched 5 December 2024 to restore the two-satellite constellation after Sentinel-1B failed in orbit in December 2021.",
      "Flies the same ground track as 1A, phased 180° apart, so the constellation repeat over a given track halves from 12 days to 6.",
      "Carries an AIS receiver in addition to the SAR — ship identity and ship radar return in the same pass.",
    ],
    sources: ["ESA Sentinel-1C launch record", "Copernicus mission documentation"],
  },
  {
    id: "nisar",
    name: "NISAR",
    agency: "NASA / ISRO",
    kind: "sar",
    color: "#22d3ee",
    band: "L-band 1.257 GHz (24 cm) + S-band 3.2 GHz",
    altitudeKm: 747,
    inclinationDeg: 98.4,
    periodMin: 99.9,
    repeatDays: 12,
    nodeLocalTimeHours: 18.0,
    nodeType: "ascending",
    swathKm: 240,
    resolution: "SweepSAR, 3–10 m depending on mode",
    cycleAnchorUtc: "2026-01-05T00:00:00Z",
    tier: "official",
    facts: [
      "Launched 30 July 2025. The first dual-frequency L- and S-band radar imager in orbit, and the first NASA–ISRO Earth observing mission.",
      "L-band's 24 cm wavelength penetrates vegetation and keeps coherence where C-band loses it — over chaparral and desert scrub this is the difference between a usable interferogram and noise.",
      "Target sensitivity on the order of millimetres per year of surface deformation: aquifer compaction in the Antelope Valley, creep on the San Andreas, subsidence over oil fields.",
      "12-day repeat on a 747 km dawn-dusk orbit, swath about 240 km — the whole of this frame in two or three passes.",
    ],
    sources: ["NASA/JPL NISAR mission pages", "ISRO NISAR documentation"],
  },
  {
    id: "landsat-9",
    name: "Landsat 9",
    agency: "NASA / USGS",
    kind: "optical",
    color: "#fbbf24",
    band: "OLI-2 visible/SWIR + TIRS-2 thermal",
    altitudeKm: 705,
    inclinationDeg: 98.2,
    periodMin: 99.0,
    repeatDays: 16,
    nodeLocalTimeHours: 10.2, // 10:12 local time of the descending node
    nodeType: "descending",
    swathKm: 185,
    resolution: "30 m multispectral, 15 m panchromatic, 100 m thermal",
    cycleAnchorUtc: "2026-01-03T00:00:00Z",
    tier: "official",
    facts: [
      "Launched 27 September 2021 from Vandenberg into Landsat 7's old orbit, giving an 8-day offset against Landsat 8.",
      "Crosses the equator at 10:12 a.m. ±5 minutes local time on the descending node — late enough for sun angle, early enough to beat the afternoon cloud and haze build-up.",
      "16-day repeat, 185 × 180 km scenes on the WRS-2 path/row grid, about 740 scenes a day. This frame sits under paths 40–42.",
      "14-bit radiometry on OLI-2, which is the upgrade over Landsat 8 that matters for dark targets like burn scars and water.",
    ],
    sources: ["USGS Landsat 9 mission page", "NASA Landsat 9 quick facts", "USGS Landsat acquisitions / LTAP"],
  },
  {
    id: "landsat-8",
    name: "Landsat 8",
    agency: "NASA / USGS",
    kind: "optical",
    color: "#f59e0b",
    band: "OLI visible/SWIR + TIRS thermal",
    altitudeKm: 705,
    inclinationDeg: 98.2,
    periodMin: 99.0,
    repeatDays: 16,
    nodeLocalTimeHours: 10.18,
    nodeType: "descending",
    swathKm: 185,
    resolution: "30 m multispectral, 15 m panchromatic, 100 m thermal",
    cycleAnchorUtc: "2026-01-11T00:00:00Z",
    tier: "official",
    facts: [
      "Launched 11 February 2013; nominal equatorial crossing 10:11 a.m. ±15 minutes mean local time, descending.",
      "Phased 8 days from Landsat 9 on the same WRS-2 grid, so the pair give 8-day optical revisit over any path.",
      "Together with Landsat 1–7 this is the half-century record: the only continuously calibrated view of what this landscape used to be.",
    ],
    sources: ["USGS Landsat 8 Data Users Handbook (LSDS-1574)", "USGS Landsat missions"],
  },
];

export const SAT_BY_ID = new Map(SATELLITES.map((s) => [s.id, s]));

/* ------------------------------------------------------------- geometry */

/**
 * Argument of latitude, degrees, for a given geodetic latitude on the branch
 * of the orbit requested. Returns null if the latitude is unreachable (above
 * the orbit's turning latitude).
 */
export function argumentOfLatitudeDeg(inclinationDeg, latDeg, descending) {
  const s = Math.sin(latDeg * DEG) / Math.sin(inclinationDeg * DEG);
  if (Math.abs(s) > 1) return null;
  const u = Math.asin(s) / DEG; // ascending branch, measured from the ascending node
  return descending ? 180 - u : u;
}

/**
 * Local mean solar time, in hours, at which the satellite crosses `latDeg`.
 *
 * LMST(φ) = LMST(node) + Δλ/15, with Δλ measured from the node the pass
 * belongs to. The Earth-rotation term cancels: the satellite's longitude
 * drifts west at exactly the rate the clock drifts, so only the inertial
 * longitude displacement survives.
 */
export function localSolarTimeAtLat(sat, latDeg) {
  const descending = sat.nodeType === "descending";
  const u = argumentOfLatitudeDeg(sat.inclinationDeg, latDeg, descending);
  if (u === null) return null;
  // Measure from whichever node this pass is referenced to.
  const uFromNode = descending ? u - 180 : u;
  const cosi = Math.cos(sat.inclinationDeg * DEG);
  const dLambda =
    Math.atan2(cosi * Math.sin(uFromNode * DEG), Math.cos(uFromNode * DEG)) / DEG;
  let t = sat.nodeLocalTimeHours + dLambda / 15;
  t = ((t % 24) + 24) % 24;
  return t;
}

/**
 * Ground-track heading in degrees from north at a given latitude, including
 * the Earth-rotation correction — a satellite's ground track is noticeably
 * more westward than its inertial azimuth, which is why descending SSO tracks
 * over California run closer to 193° than to 190°.
 */
export function groundTrackHeadingDeg(sat, latDeg) {
  const i = sat.inclinationDeg * DEG;
  const phi = latDeg * DEG;
  const sinBeta = Math.cos(i) / Math.cos(phi);
  if (Math.abs(sinBeta) > 1) return null;
  const beta = Math.asin(sinBeta); // inertial azimuth of the ascending branch
  // Orbital speed from the period and radius.
  const rKm = 6371 + sat.altitudeKm;
  const v = (2 * Math.PI * rKm) / (sat.periodMin * 60);
  const descending = sat.nodeType === "descending";
  // Only the north component flips between the ascending and descending legs.
  // The east component does not: for a retrograde orbit (i > 90°) the inertial
  // eastward velocity is negative on both legs — the track always drifts west,
  // which is why successive ground tracks step westward across the map. Flip
  // both and you get the classic error, a descending track leaning southeast.
  const vNorth = (descending ? -1 : 1) * v * Math.cos(beta);
  const vEast = v * Math.sin(beta) - EARTH_SURFACE_SPEED_KMS * Math.cos(phi);
  let h = Math.atan2(vEast, vNorth) / DEG;
  h = ((h % 360) + 360) % 360;
  return h;
}

/**
 * The two ground-track directions a repeat-track mission offers over a point:
 * the node it is scheduled on, and its opposite twelve hours away.
 */
export function trackGeometry(sat, latDeg) {
  const heading = groundTrackHeadingDeg(sat, latDeg);
  const localTime = localSolarTimeAtLat(sat, latDeg);
  const mirror = { ...sat, nodeType: sat.nodeType === "descending" ? "ascending" : "descending" };
  return {
    heading,
    localTime,
    pass: sat.nodeType,
    opposite: {
      pass: mirror.nodeType,
      heading: groundTrackHeadingDeg(mirror, latDeg),
      // The opposite node is twelve hours away by construction of an SSO.
      localTime: ((localSolarTimeAtLat(sat, latDeg) + 12) % 24),
    },
  };
}

/** Incidence-angle half-width of the swath on the ground, degrees of arc. */
export function swathHalfWidthKm(sat) {
  return sat.swathKm / 2;
}

/* -------------------------------------------------------------- windows */

/** Hours → "HH:MM". */
export function formatHours(h) {
  const total = Math.round(((h % 24) + 24) % 24 * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Next `count` observation windows over a point, from the repeat cycle.
 *
 * Each window is one revisit slot: the date the cycle lands on, and the local
 * solar time the geometry puts it at. The date is only as good as
 * `cycleAnchorUtc` (declared nominal — see the module header); the time of day
 * and the direction are derived and trustworthy.
 */
export function passWindows(sat, { lat, lon, from = new Date(), count = 4 } = {}) {
  const localHours = localSolarTimeAtLat(sat, lat);
  if (localHours === null) return [];
  // Local mean solar time → UTC at this longitude.
  const utcHours = ((localHours - lon / 15) % 24 + 24) % 24;

  const anchor = new Date(sat.cycleAnchorUtc);
  const cycleMs = sat.repeatDays * 86400000;
  // First slot at or after `from`.
  const dayMs = 86400000;
  const anchorDay = Math.floor(anchor.getTime() / dayMs) * dayMs;
  let k = Math.ceil((from.getTime() - anchorDay) / cycleMs);
  const out = [];
  for (let n = 0; n < count; n++, k++) {
    const day = anchorDay + k * cycleMs;
    const t = new Date(day + utcHours * 3600000);
    if (t.getTime() < from.getTime()) {
      n--;
      continue;
    }
    out.push({
      satellite: sat.id,
      utc: t,
      localSolarHours: localHours,
      localSolarLabel: formatHours(localHours),
      pass: sat.nodeType,
      headingDeg: groundTrackHeadingDeg(sat, lat),
      swathKm: sat.swathKm,
      nominal: true,
    });
  }
  return out;
}

/** All satellites' next windows over a point, merged and sorted by time. */
export function nextWindows({ lat, lon, from = new Date(), perSat = 2, satellites = SATELLITES } = {}) {
  const all = [];
  for (const sat of satellites) all.push(...passWindows(sat, { lat, lon, from, count: perSat }));
  all.sort((a, b) => a.utc - b.utc);
  return all;
}

/**
 * Swath footprint across a bounding box for one satellite, as a centreline and
 * two edges. Minimal by design: a straight track at the local heading through
 * the frame centre, which at this scale and over 6° of latitude is within a
 * few kilometres of the real curved track.
 */
export function swathAcross(sat, { bbox, lon, lat, offsetKm = 0, steps = 16 } = {}) {
  const heading = groundTrackHeadingDeg(sat, lat);
  if (heading === null) return null;
  const a = heading * DEG;
  const KM_PER_DEG = 111.32;

  // Long enough to cross the frame from any starting point inside it.
  const spanKm =
    Math.max(
      (bbox.lat1 - bbox.lat0) * KM_PER_DEG,
      (bbox.lon1 - bbox.lon0) * KM_PER_DEG * Math.cos(lat * DEG),
    ) * 1.6;

  /** Step from a point along an azimuth, using that point's own latitude. */
  const step = (plon, plat, azRad, km) => {
    const dLat = (km * Math.cos(azRad)) / KM_PER_DEG;
    const latMid = plat + dLat / 2;
    const dLon = (km * Math.sin(azRad)) / (KM_PER_DEG * Math.cos(latMid * DEG));
    return [plon + dLon, plat + dLat];
  };

  const perp = a + Math.PI / 2;
  const [clon, clat] = offsetKm ? step(lon, lat, perp, offsetKm) : [lon, lat];

  // Along-track samples first, then the lateral offset applied at each sample
  // with its own latitude. Offsetting once at the frame centre and reusing the
  // longitude delta puts the swath edge several kilometres out by the top of
  // the frame — small, but this is the one number the layer is for.
  const line = (lateralKm) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const along = -spanKm / 2 + (spanKm * i) / steps;
      const [plon, plat] = step(clon, clat, a, along);
      pts.push(lateralKm ? step(plon, plat, perp, lateralKm) : [plon, plat]);
    }
    return pts;
  };

  return {
    heading,
    centre: line(0),
    left: line(-sat.swathKm / 2),
    right: line(sat.swathKm / 2),
    swathKm: sat.swathKm,
  };
}
