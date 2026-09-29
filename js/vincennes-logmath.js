/**
 * VINCENNES LOG MATH — a pure, DOM-free model of ship/aircraft logs.
 *
 * Everything the 4Dwm viewer draws is computed here, so the geometry can be
 * re-run headless (see tests/19-vincennes.mjs) and checked against the source
 * documents without a browser, a canvas, or three.js.
 *
 * Conventions
 * -----------
 *  - Positions are `{ lat, lon }` in signed decimal degrees, WGS84-ish.
 *    Altitude, when present, is `alt` in FEET (the unit every source uses).
 *  - Bearings and courses are degrees TRUE, 0 = north, clockwise.
 *  - Ranges are returned in METRES by the geodesy primitives and converted at
 *    the edges; the log layer works in nautical miles because the logs do.
 *  - Times are seconds past midnight UTC ("Z") for the 1988 case and seconds
 *    past midnight local zone time for the 1942/1944 cases, because that is
 *    how each primary document timestamps its entries. `zone` on a dataset
 *    records which.
 *
 * Nothing here knows about any particular incident. The datasets live in
 * js/vincennes-logs-data.js; the solved products live in `solveTheater()`.
 */

/* ------------------------------------------------------------------ units */

export const NM_M = 1852; // international nautical mile, exact
export const FT_M = 0.3048; // international foot, exact
export const KT_MS = NM_M / 3600; // 1 knot in m/s
/** IUGG mean Earth radius (R1). Great-circle work only; no ellipsoid here. */
export const R_EARTH_M = 6371008.8;

export const nmToM = (nm) => nm * NM_M;
export const mToNm = (m) => m / NM_M;
export const ftToM = (ft) => ft * FT_M;
export const mToFt = (m) => m / FT_M;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
export const rad = (d) => d * D2R;
export const deg = (r) => r * R2D;

export const wrap360 = (d) => ((d % 360) + 360) % 360;
export const wrap180 = (d) => {
  const w = wrap360(d);
  return w > 180 ? w - 360 : w;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* --------------------------------------------------------------- geodesy */

/** Great-circle surface distance, metres (haversine). */
export function distanceM(a, b) {
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const dp = rad(b.lat - a.lat);
  const dl = rad(b.lon - a.lon);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R_EARTH_M * Math.asin(Math.sqrt(clamp(h, 0, 1)));
}
export const distanceNm = (a, b) => mToNm(distanceM(a, b));

/** Initial great-circle bearing a → b, degrees true. */
export function initialBearing(a, b) {
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const dl = rad(b.lon - a.lon);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return wrap360(deg(Math.atan2(y, x)));
}

/** Final great-circle bearing arriving at b from a. */
export const finalBearing = (a, b) => wrap360(initialBearing(b, a) + 180);

/** Great-circle direct problem: go `distM` from `p` on bearing `brg`. */
export function destination(p, brg, distM) {
  const d = distM / R_EARTH_M;
  const t = rad(brg);
  const p1 = rad(p.lat);
  const l1 = rad(p.lon);
  const sp = Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t);
  const p2 = Math.asin(clamp(sp, -1, 1));
  const l2 =
    l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * sp);
  return { lat: deg(p2), lon: wrap180(deg(l2)) };
}

/**
 * Rhumb-line (constant-course) distance and bearing. A ship's log entry is a
 * course held, not a great circle, so DR between fixes uses this.
 */
export function rhumbDistanceM(a, b) {
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const dp = p2 - p1;
  let dl = rad(wrap180(b.lon - a.lon));
  const dpsi = Math.log(Math.tan(p2 / 2 + Math.PI / 4) / Math.tan(p1 / 2 + Math.PI / 4));
  const q = Math.abs(dpsi) > 1e-12 ? dp / dpsi : Math.cos(p1);
  return Math.sqrt(dp * dp + q * q * dl * dl) * R_EARTH_M;
}

export function rhumbBearing(a, b) {
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const dl = rad(wrap180(b.lon - a.lon));
  const dpsi = Math.log(Math.tan(p2 / 2 + Math.PI / 4) / Math.tan(p1 / 2 + Math.PI / 4));
  return wrap360(deg(Math.atan2(dl, dpsi)));
}

export function rhumbDestination(p, brg, distM) {
  const d = distM / R_EARTH_M;
  const t = rad(brg);
  const p1 = rad(p.lat);
  const dp = d * Math.cos(t);
  let p2 = p1 + dp;
  if (Math.abs(p2) > Math.PI / 2) p2 = p2 > 0 ? Math.PI - p2 : -Math.PI - p2;
  const dpsi = Math.log(Math.tan(p2 / 2 + Math.PI / 4) / Math.tan(p1 / 2 + Math.PI / 4));
  const q = Math.abs(dpsi) > 1e-12 ? dp / dpsi : Math.cos(p1);
  const dl = (d * Math.sin(t)) / q;
  return { lat: deg(p2), lon: wrap180(deg(rad(p.lon) + dl)) };
}

/* ------------------------------------------------ local tangent plane (ENU) */

/**
 * East/North/Up metres of `p` relative to `origin`, on the local tangent
 * plane. Good to a few metres over the tens of nautical miles these scenes
 * cover, which is far below the precision of any of the logs.
 */
export function enuFromGeo(p, origin) {
  const lat0 = rad(origin.lat);
  const e = rad(wrap180(p.lon - origin.lon)) * R_EARTH_M * Math.cos(lat0);
  const n = rad(p.lat - origin.lat) * R_EARTH_M;
  const u = ftToM((p.alt ?? 0) - (origin.alt ?? 0));
  return { e, n, u };
}

export function geoFromEnu({ e, n, u = 0 }, origin) {
  const lat0 = rad(origin.lat);
  return {
    lat: origin.lat + deg(n / R_EARTH_M),
    lon: origin.lon + deg(e / (R_EARTH_M * Math.cos(lat0))),
    alt: mToFt(u) + (origin.alt ?? 0),
  };
}

/* ----------------------------------------------------- polar reconstruction */

/**
 * Turn a polar log line ("TN 4131 at RNG 10 NM, BRG 010") back into a
 * geodetic fix, given where the observer was. This is the operation that lets
 * a ship's own tape be checked against somebody else's absolute coordinates.
 */
export function fixFromPolar(observer, bearingDeg, rangeNm, altFt) {
  const p = destination(observer, bearingDeg, nmToM(rangeNm));
  if (altFt != null) p.alt = altFt;
  return p;
}

/** Inverse: range/bearing of `target` seen from `observer`. */
export function polarFromFix(observer, target) {
  return {
    bearing: initialBearing(observer, target),
    rangeNm: distanceNm(observer, target),
  };
}

/**
 * Slant range ↔ ground range. A radar reports slant range; a chart plots
 * ground range. At 13,500 ft and 8 nm the difference is ~0.15 nm — small, but
 * it is the difference between two documents agreeing and not.
 */
export const groundFromSlant = (slantNm, altFt) =>
  Math.sqrt(Math.max(0, slantNm ** 2 - mToNm(ftToM(altFt)) ** 2));
export const slantFromGround = (groundNm, altFt) =>
  Math.hypot(groundNm, mToNm(ftToM(altFt)));

/* ------------------------------------------------------- corridor geometry */

/**
 * Signed cross-track distance of `p` from the great circle a→b, in nautical
 * miles. Positive = right of the track (looking a→b). This is how "within the
 * Amber 59 corridor, 10 miles each side of centreline" becomes a number.
 */
export function crossTrackNm(p, a, b) {
  const d13 = distanceM(a, p) / R_EARTH_M;
  const t13 = rad(initialBearing(a, p));
  const t12 = rad(initialBearing(a, b));
  return mToNm(Math.asin(clamp(Math.sin(d13) * Math.sin(t13 - t12), -1, 1)) * R_EARTH_M);
}

/** Distance from a along the track a→b to the foot of p's perpendicular. */
export function alongTrackNm(p, a, b) {
  const d13 = distanceM(a, p) / R_EARTH_M;
  const xt = nmToM(crossTrackNm(p, a, b)) / R_EARTH_M;
  const c = Math.cos(d13) / Math.cos(xt);
  return mToNm(Math.acos(clamp(c, -1, 1)) * R_EARTH_M);
}

/* ------------------------------------------------------------ dead reckoning */

/**
 * Integrate a course/speed log into a track.
 *
 * `legs` is `[{ t, course, speed }]` — each entry is "from time t, steer
 * `course` at `speed` knots until the next entry". `t` is seconds. Returns
 * `[{ t, lat, lon, legIndex }]` with one node per leg boundary plus optional
 * intermediate samples.
 */
export function deadReckon(start, legs, { until = null, stepS = 0, mode = "rhumb" } = {}) {
  const step = mode === "great-circle" ? destination : rhumbDestination;
  const out = [{ t: legs[0].t, lat: start.lat, lon: start.lon, legIndex: -1 }];
  let cur = { lat: start.lat, lon: start.lon };
  const end = until ?? legs[legs.length - 1].t;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const legEnd = Math.min(i + 1 < legs.length ? legs[i + 1].t : end, end);
    let t = leg.t;
    while (t < legEnd) {
      const dt = stepS > 0 ? Math.min(stepS, legEnd - t) : legEnd - t;
      cur = step(cur, leg.course, leg.speed * KT_MS * dt);
      t += dt;
      out.push({ t, lat: cur.lat, lon: cur.lon, legIndex: i });
    }
  }
  return out;
}

/** Position of a DR/logged track at an arbitrary time (linear in ENU). */
export function trackAt(track, t) {
  if (!track.length) return null;
  if (t <= track[0].t) return { ...track[0] };
  const last = track[track.length - 1];
  if (t >= last.t) return { ...last };
  let i = 1;
  while (i < track.length && track[i].t < t) i++;
  const a = track[i - 1];
  const b = track[i];
  const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  const o = { lat: a.lat, lon: a.lon, alt: a.alt ?? 0 };
  const eb = enuFromGeo({ lat: b.lat, lon: b.lon, alt: b.alt ?? 0 }, o);
  const p = geoFromEnu({ e: eb.e * f, n: eb.n * f, u: eb.u * f }, o);
  return { t, lat: p.lat, lon: p.lon, alt: a.alt != null || b.alt != null ? p.alt : undefined };
}

/**
 * Residual between where the log says the ship was and where the DR model
 * puts it: the classic "set and drift" solution. `hours` is the elapsed time
 * over which the error accumulated.
 */
export function setAndDrift(drPos, fixPos, hours) {
  const nm = distanceNm(drPos, fixPos);
  return {
    setDeg: initialBearing(drPos, fixPos),
    driftKt: hours > 0 ? nm / hours : 0,
    offsetNm: nm,
  };
}

/* ------------------------------------------------------- relative motion */

/** Ownship/contact geometry at one instant. */
export function relativeMotion(own, contact) {
  const bearing = initialBearing(own, contact);
  const rangeNm = distanceNm(own, contact);
  const rel = enuFromGeo(contact, own);
  const ov = vectorOf(own);
  const cv = vectorOf(contact);
  const rvE = cv.e - ov.e;
  const rvN = cv.n - ov.n;
  // range rate = component of relative velocity along the line of sight
  const losE = rangeNm > 0 ? rel.e / nmToM(rangeNm) : 0;
  const losN = rangeNm > 0 ? rel.n / nmToM(rangeNm) : 0;
  const rangeRateKt = (rvE * losE + rvN * losN) / KT_MS;
  // bearing rate, degrees per minute
  const cross = rvE * losN - rvN * losE;
  const bearingRateDegMin =
    rangeNm > 0 ? deg(-cross / nmToM(rangeNm)) * 60 : 0;
  return { bearing, rangeNm, rangeRateKt, bearingRateDegMin };
}

function vectorOf(o) {
  const s = (o.speed ?? 0) * KT_MS;
  const c = rad(o.course ?? 0);
  return { e: s * Math.sin(c), n: s * Math.cos(c) };
}

/**
 * Closest point of approach under constant velocity. Returns TCPA in seconds
 * (negative = already past) and the CPA range in nautical miles.
 */
export function cpa(own, contact) {
  const rel = enuFromGeo(contact, own);
  const ov = vectorOf(own);
  const cv = vectorOf(contact);
  const rvE = cv.e - ov.e;
  const rvN = cv.n - ov.n;
  const v2 = rvE * rvE + rvN * rvN;
  if (v2 < 1e-9) return { tcpaS: 0, cpaNm: mToNm(Math.hypot(rel.e, rel.n)), closing: false };
  const tcpaS = -(rel.e * rvE + rel.n * rvN) / v2;
  const e = rel.e + rvE * tcpaS;
  const n = rel.n + rvN * tcpaS;
  return { tcpaS, cpaNm: mToNm(Math.hypot(e, n)), closing: tcpaS > 0 };
}

/**
 * "Constant bearing, decreasing range" — the classic collision/attack cue the
 * Vincennes CIC called on TN 4131. It is a *test*, not a fact: run it over the
 * bearing series and see how constant the bearing actually was.
 */
export function cbdr(samples, { toleranceDeg = 5 } = {}) {
  const brgs = samples.map((s) => s.bearing).filter((b) => Number.isFinite(b));
  if (brgs.length < 2) return { constant: false, spreadDeg: 0, driftDeg: 0, closing: false };
  let min = brgs[0];
  let max = brgs[0];
  for (const b of brgs) {
    min = Math.min(min, b);
    max = Math.max(max, b);
  }
  const driftDeg = wrap180(brgs[brgs.length - 1] - brgs[0]);
  const rngs = samples.map((s) => s.rangeNm).filter((r) => Number.isFinite(r));
  return {
    constant: max - min <= toleranceDeg,
    spreadDeg: max - min,
    driftDeg,
    closing: rngs.length > 1 && rngs[rngs.length - 1] < rngs[0],
  };
}

/* ------------------------------------------------------------- regression */

/** Ordinary least squares y = m·x + b with R² and residuals. */
export function linefit(points) {
  const n = points.length;
  if (n < 2) return { m: 0, b: n ? points[0].y : 0, r2: 0, n, residuals: [], rmse: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const mx = sx / n;
  const my = sy / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const m = sxx === 0 ? 0 : sxy / sxx;
  const b = my - m * mx;
  let ssRes = 0;
  let ssTot = 0;
  const residuals = points.map((p) => {
    const r = p.y - (m * p.x + b);
    ssRes += r * r;
    ssTot += (p.y - my) ** 2;
    return { ...p, fit: m * p.x + b, residual: r };
  });
  return {
    m,
    b,
    r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot,
    n,
    residuals,
    rmse: Math.sqrt(ssRes / n),
  };
}

/** Intersection of two fitted lines, or null if parallel. */
export function lineCross(f1, f2) {
  if (Math.abs(f1.m - f2.m) < 1e-9) return null;
  const x = (f2.b - f1.b) / (f1.m - f2.m);
  return { x, y: f1.m * x + f1.b };
}

/**
 * Vertical profile of an altitude series.
 *   - `perNm`  : feet gained per nautical mile of range *closed* (dh/dr, so a
 *                climbing inbound target has a negative dh/dr)
 *   - `fpm`    : feet per minute from the time fit
 *   - `monotone`: did the recorded altitude ever decrease?
 */
export function climbProfile(samples) {
  const byRange = samples.filter((s) => Number.isFinite(s.rangeNm) && Number.isFinite(s.alt));
  const byTime = samples.filter((s) => Number.isFinite(s.t) && Number.isFinite(s.alt));
  const fitR = linefit(byRange.map((s) => ({ x: s.rangeNm, y: s.alt, src: s })));
  const fitT = linefit(byTime.map((s) => ({ x: s.t, y: s.alt, src: s })));
  let monotone = true;
  let maxDrop = 0;
  const ordered = [...byTime].sort((a, b) => a.t - b.t);
  for (let i = 1; i < ordered.length; i++) {
    const d = ordered[i].alt - ordered[i - 1].alt;
    if (d < 0) {
      monotone = false;
      maxDrop = Math.min(maxDrop, d);
    }
  }
  return {
    perNm: fitR.m,
    perNmR2: fitR.r2,
    fpm: fitT.m * 60,
    fpmR2: fitT.r2,
    fitRange: fitR,
    fitTime: fitT,
    monotone,
    maxDropFt: maxDrop,
    firstAlt: ordered.length ? ordered[0].alt : null,
    lastAlt: ordered.length ? ordered[ordered.length - 1].alt : null,
  };
}

/**
 * Compare two altitude series sampled against the same independent variable
 * (here: slant range). Returns per-point residuals plus the range at which the
 * two fitted lines cross — the "pivot" of the disagreement.
 */
export function profileDivergence(systemSamples, recalledSamples) {
  const sys = climbProfile(systemSamples);
  const rec = climbProfile(recalledSamples);
  const cross = lineCross(sys.fitRange, rec.fitRange);
  const pairs = recalledSamples
    .filter((r) => Number.isFinite(r.rangeNm) && Number.isFinite(r.alt))
    .map((r) => {
      const sysAlt = sys.fitRange.m * r.rangeNm + sys.fitRange.b;
      const exact = systemSamples.find(
        (s) => Number.isFinite(s.rangeNm) && Math.abs(s.rangeNm - r.rangeNm) < 0.51
      );
      const ref = exact && Number.isFinite(exact.alt) ? exact.alt : sysAlt;
      return {
        rangeNm: r.rangeNm,
        recalled: r.alt,
        system: ref,
        systemFit: sysAlt,
        residual: r.alt - ref,
        exact: Boolean(exact),
        label: r.label ?? "",
        source: r.source ?? "",
      };
    })
    .sort((a, b) => b.rangeNm - a.rangeNm);
  const worst = pairs.reduce(
    (w, p) => (Math.abs(p.residual) > Math.abs(w?.residual ?? -Infinity) ? p : w),
    null
  );
  return {
    system: sys,
    recalled: rec,
    pairs,
    worst,
    crossRangeNm: cross ? cross.x : null,
    crossAltFt: cross ? cross.y : null,
    /**
     * Slope ratio: −1 means the recalled series is the exact mirror of the
     * recorded one about the crossing point. Reported, never asserted as a
     * mechanism — the investigation's own explanation is "scenario fulfilment".
     */
    slopeRatio: sys.fitRange.m === 0 ? null : rec.fitRange.m / sys.fitRange.m,
  };
}

/* --------------------------------------------------------- engagement math */

/**
 * Mean closing speed a weapon had to make good between launch and intercept.
 * Nothing fancy — it is (range flown)/(time of flight), which is exactly what
 * a tape gives you and a useful sanity check on any reconstruction.
 */
export function interceptSolution({ launchT, launchRangeNm, hitT, hitRangeNm, targetSpeedKt }) {
  const tofS = hitT - launchT;
  const closedNm = launchRangeNm - hitRangeNm;
  const targetClosedNm = ((targetSpeedKt ?? 0) * tofS) / 3600;
  const missileNm = hitRangeNm; // flew out to where the target was at intercept
  return {
    tofS,
    closedNm,
    targetClosedNm,
    missileNm,
    missileMeanKt: tofS > 0 ? (missileNm * 3600) / tofS : 0,
    closingMeanKt: tofS > 0 ? (closedNm * 3600) / tofS : 0,
  };
}

/** Seconds of decision time between two log events, plus a per-nm budget. */
export function timeCompression(events, firstId, lastId) {
  const a = events.find((e) => e.id === firstId);
  const b = events.find((e) => e.id === lastId);
  if (!a || !b) return null;
  const s = b.t - a.t;
  return {
    seconds: s,
    mmss: `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`,
    fromId: firstId,
    toId: lastId,
  };
}

/* ------------------------------------------------------------- formatting */

export const hhmmss = (s) => {
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const ss = t % 60;
  return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};
export const hhmm = (s) => hhmmss(s).slice(0, 4);

/** 26.51306 → 26°30.8'N. The form every one of these documents uses. */
export function dm(value, axis) {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const a = Math.abs(value);
  const d = Math.floor(a);
  const m = (a - d) * 60;
  return `${d}\u00b0${m.toFixed(2).padStart(5, "0")}'${hemi}`;
}
export const dmPair = (p) => `${dm(p.lat, "lat")} ${dm(p.lon, "lon")}`;

/** Parse 26-37.75'N / 26°37'45"N / -9.1667 into signed degrees. */
export function parseLatLon(text) {
  const s = String(text).trim();
  const plain = Number(s);
  if (Number.isFinite(plain)) return plain;
  // The hyphen in "26-37.75N" is a field separator, not a minus sign \u2014 which
  // is exactly the trap, because it is also how a negative latitude is written.
  // Resolve it by hemisphere letter first, and only then by sign.
  const hemi = s.match(/([NSEW])\s*$/i)?.[1]?.toUpperCase() ?? null;
  const body = hemi ? s.slice(0, s.length - 1).trim() : s;
  const nums = body.match(/\d+(?:\.\d+)?/g);
  if (!nums || !nums.length) return NaN;
  const leadingMinus = /^\s*-/.test(body);
  const v =
    Number(nums[0]) + Number(nums[1] || 0) / 60 + Number(nums[2] || 0) / 3600;
  const sign = hemi ? (hemi === "S" || hemi === "W" ? -1 : 1) : leadingMinus ? -1 : 1;
  return sign * v;
}

/* ------------------------------------------------------------ the solver */

/**
 * Take one theater dataset and produce every derived quantity the viewer
 * draws. Deterministic, side-effect free, and the single place a number can
 * come from.
 *
 * A theater is `{ id, zone, origin, ownship, contacts, corridor, events,
 * patrol, checks }` — see js/vincennes-logs-data.js for the shapes.
 */
export function solveTheater(theater) {
  const out = {
    id: theater.id,
    title: theater.title,
    zone: theater.zone,
    origin: theater.origin,
    tracks: {},
    ownship: null,
    derived: {},
    checks: [],
    span: { t0: Infinity, t1: -Infinity },
  };

  /* --- ownship: either a fixed position or a DR'd patrol ---------------- */
  if (theater.patrol) {
    const { center, sideNm, speedKt, legs, startT, startCorner } = theater.patrol;
    const start = startCorner
      ? startCorner
      : patrolStartCorner(center, sideNm, legs);
    const legList = [];
    let t = startT;
    const legSeconds = (sideNm / speedKt) * 3600;
    for (let i = 0; i < theater.patrol.legCount; i++) {
      legList.push({ t, course: legs[i % legs.length], speed: speedKt });
      t += legSeconds;
    }
    const track = deadReckon(start, legList, { until: t, stepS: 60 });
    out.ownship = { id: theater.ownship.id, name: theater.ownship.name, track, kind: "dr" };
    out.derived.patrolStart = start;
    out.derived.legSeconds = legSeconds;
    // the closed square itself, for drawing
    const corners = [start];
    for (let i = 0; i < legs.length; i++) {
      corners.push(destination(corners[i], legs[i], nmToM(sideNm)));
    }
    out.derived.boxCorners = corners.slice(0, legs.length);
    out.tracks[theater.ownship.id] = out.ownship;
  } else if (theater.ownship?.fixes?.length) {
    const track = theater.ownship.fixes.map((f) => ({ ...f }));
    out.ownship = { id: theater.ownship.id, name: theater.ownship.name, track, kind: "log" };
    out.tracks[theater.ownship.id] = out.ownship;
  }

  /* --- contacts: absolute fixes and/or polar log lines ------------------ */
  for (const c of theater.contacts ?? []) {
    // A ship in column has no log of its own here: it is drawn on the
    // leader's track, offset astern by the stated interval.
    if (Number.isFinite(c.followsOwnshipByS) && out.ownship) {
      const t0 = out.ownship.track[0]?.t ?? 0;
      const track = [];
      for (const p of out.ownship.track) {
        const lag = p.t - c.followsOwnshipByS;
        if (lag < t0) continue; // do not invent track before the leader has any
        const q = trackAt(out.ownship.track, lag);
        if (q) track.push({ ...q, t: p.t, lagT: lag });
      }
      out.tracks[c.id] = {
        id: c.id,
        name: c.name,
        kind: c.kind ?? "contact",
        color: c.color,
        track,
        derivedFrom: out.ownship.id,
        note: `drawn on ${out.ownship.name}'s own DR track, ${c.followsOwnshipByS} s astern`,
      };
      continue;
    }
    const samples = fillPolarGaps(c.samples);
    const track = [];
    for (const s of samples) {
      let p = null;
      if (Number.isFinite(s.lat) && Number.isFinite(s.lon)) {
        p = { lat: s.lat, lon: s.lon };
      } else if (Number.isFinite(s.bearing) && Number.isFinite(s.rangeNm)) {
        const obs =
          s.fromId && out.tracks[s.fromId]
            ? trackAt(out.tracks[s.fromId].track, s.t)
            : out.ownship
              ? trackAt(out.ownship.track, s.t)
              : theater.origin;
        p = fixFromPolar(obs, s.bearing, s.rangeNm);
      }
      if (!p) continue;
      track.push({
        ...s,
        lat: p.lat,
        lon: p.lon,
        reconstructed: !(Number.isFinite(s.lat) && Number.isFinite(s.lon)),
      });
    }
    track.sort((a, b) => a.t - b.t);
    out.tracks[c.id] = { id: c.id, name: c.name, kind: c.kind ?? "contact", color: c.color, track };
  }

  /* --- per-sample relative geometry against ownship --------------------- */
  const own = out.ownship;
  for (const key of Object.keys(out.tracks)) {
    const tr = out.tracks[key];
    if (!own || tr === own) continue;
    for (const s of tr.track) {
      const o = trackAt(own.track, s.t);
      if (!o) continue;
      const geom = relativeMotion(
        { ...o, course: theater.ownship?.course, speed: theater.ownship?.speed },
        { lat: s.lat, lon: s.lon, course: s.course, speed: s.speed }
      );
      s.solvedBearing = geom.bearing;
      s.solvedRangeNm = geom.rangeNm;
      s.rangeRateKt = geom.rangeRateKt;
      s.bearingRateDegMin = geom.bearingRateDegMin;
      if (Number.isFinite(s.course) && Number.isFinite(s.speed)) {
        const c = cpa(
          { ...o, course: theater.ownship?.course ?? 0, speed: theater.ownship?.speed ?? 0 },
          { lat: s.lat, lon: s.lon, course: s.course, speed: s.speed }
        );
        s.cpaNm = c.cpaNm;
        s.tcpaS = c.tcpaS;
      }
    }
    const cb = cbdr(tr.track.map((s) => ({ bearing: s.solvedBearing ?? s.bearing, rangeNm: s.solvedRangeNm ?? s.rangeNm })));
    tr.cbdr = cb;
  }

  /* --- corridor deviation ----------------------------------------------- */
  if (theater.corridor) {
    const { from, to, halfWidthNm } = theater.corridor;
    out.derived.corridor = { from, to, halfWidthNm, samples: [] };
    for (const key of Object.keys(out.tracks)) {
      const tr = out.tracks[key];
      if (!tr.track.length || tr === own) continue;
      for (const s of tr.track) {
        s.crossTrackNm = crossTrackNm({ lat: s.lat, lon: s.lon }, from, to);
        s.insideCorridor = Math.abs(s.crossTrackNm) <= halfWidthNm;
      }
    }
  }

  /* --- vertical profile: recorded vs recalled --------------------------- */
  if (theater.altitude) {
    // Only the inbound leg is a "profile". The post-intercept samples are a
    // falling airframe and belong to a different physical problem; mixing
    // them in would turn a climb into a parabola and a fit into a lie.
    const sysSamples = theater.altitude.system
      .filter((s) => s.phase !== "fall")
      .map((s) => ({ ...s }));
    const recSamples = theater.altitude.recalled.map((s) => ({ ...s }));
    out.derived.profile = profileDivergence(sysSamples, recSamples);
    out.derived.altitudeSystem = sysSamples;
    out.derived.altitudeRecalled = recSamples;
    out.derived.altitudeFall = theater.altitude.system
      .filter((s) => s.phase === "fall")
      .map((s) => ({ ...s }));
    if (out.derived.altitudeFall.length > 1) {
      out.derived.fall = climbProfile(out.derived.altitudeFall);
    }
  }

  /* --- engagement ------------------------------------------------------- */
  if (theater.engagement) out.derived.intercept = interceptSolution(theater.engagement);

  /* --- events must exist before the checks that read them --------------- */
  out.events = (theater.events ?? []).map((e) => ({ ...e }));

  /* --- declared cross-checks: run them, do not trust them --------------- */
  for (const chk of theater.checks ?? []) out.checks.push(runCheck(chk, out, theater));

  /* --- time span --------------------------------------------------------- */
  for (const key of Object.keys(out.tracks)) {
    for (const s of out.tracks[key].track) {
      out.span.t0 = Math.min(out.span.t0, s.t);
      out.span.t1 = Math.max(out.span.t1, s.t);
    }
  }
  for (const e of out.events) {
    out.span.t0 = Math.min(out.span.t0, e.t);
    out.span.t1 = Math.max(out.span.t1, e.t);
  }
  if (!Number.isFinite(out.span.t0)) out.span = { t0: 0, t1: 1 };
  return out;
}

/**
 * A radar log is ragged: some lines carry range and bearing, most carry only
 * one of them. Fill the gaps by linear interpolation in time across the lines
 * that do have the value, and mark what was filled. Nothing is extrapolated
 * past the ends of the series — a sample with no usable geometry stays
 * unplottable rather than becoming invented.
 */
export function fillPolarGaps(samples) {
  const sorted = samples.map((s) => ({ ...s })).sort((a, b) => a.t - b.t);
  const interpField = (field, wrap = false) => {
    const known = sorted.filter((s) => Number.isFinite(s[field]));
    if (known.length < 2) return;
    for (const s of sorted) {
      if (Number.isFinite(s[field])) continue;
      if (Number.isFinite(s.lat) && Number.isFinite(s.lon)) continue;
      let lo = null;
      let hi = null;
      for (const k of known) {
        if (k.t <= s.t) lo = k;
        if (k.t >= s.t && !hi) hi = k;
      }
      if (!lo || !hi || lo === hi) continue;
      const f = (s.t - lo.t) / (hi.t - lo.t);
      const d = wrap ? wrap180(hi[field] - lo[field]) : hi[field] - lo[field];
      s[field] = wrap ? wrap360(lo[field] + d * f) : lo[field] + d * f;
      s[`${field}Interpolated`] = true;
    }
  };
  interpField("bearing", true);
  interpField("rangeNm", false);
  return sorted;
}

/**
 * Corner of a square patrol such that the four legs close and the centroid is
 * `center`. The northern-force box at Savo is specified by its centre and its
 * leg headings, not by a corner, so the corner has to be solved for.
 */
export function patrolStartCorner(center, sideNm, legs) {
  // Walk the closed polygon from an arbitrary origin, average the vertices,
  // then translate so the average lands on `center`.
  let e = 0;
  let n = 0;
  const verts = [{ e: 0, n: 0 }];
  for (let i = 0; i < legs.length - 1; i++) {
    e += nmToM(sideNm) * Math.sin(rad(legs[i]));
    n += nmToM(sideNm) * Math.cos(rad(legs[i]));
    verts.push({ e, n });
  }
  const ce = verts.reduce((a, v) => a + v.e, 0) / verts.length;
  const cn = verts.reduce((a, v) => a + v.n, 0) / verts.length;
  return geoFromEnu({ e: -ce, n: -cn }, center);
}

function runCheck(chk, solved, theater) {
  const res = { id: chk.id, label: chk.label, kind: chk.kind, note: chk.note, sources: chk.sources };
  try {
    if (chk.kind === "polar-vs-absolute") {
      const observer = chk.observer ?? theater.origin;
      const modeled = fixFromPolar(observer, chk.bearing, chk.rangeNm);
      res.modeled = modeled;
      res.stated = chk.stated;
      res.deltaNm = distanceNm(modeled, chk.stated);
      res.deltaBearingDeg = Math.abs(
        wrap180(initialBearing(observer, chk.stated) - chk.bearing)
      );
      res.pass = res.deltaNm <= (chk.toleranceNm ?? 1);
    } else if (chk.kind === "dr-vs-reported") {
      const tr = solved.tracks[chk.trackId];
      const p = tr ? trackAt(tr.track, chk.t) : null;
      res.modeled = p;
      res.stated = chk.stated;
      res.deltaNm = p ? distanceNm(p, chk.stated) : null;
      res.bearingDeg = p ? initialBearing(p, chk.stated) : null;
      res.pass = res.deltaNm != null && res.deltaNm <= (chk.toleranceNm ?? 5);
    } else if (chk.kind === "offset-derives") {
      // A stated perpendicular offset from a point derives a second point.
      res.modeled = destination(chk.from, chk.bearing, nmToM(chk.offsetNm));
      res.pass = true;
    } else if (chk.kind === "value") {
      const v = chk.compute(solved);
      res.value = v;
      res.stated = chk.stated;
      res.pass =
        chk.stated == null ||
        Math.abs(v - chk.stated) <= (chk.tolerance ?? Math.abs(chk.stated) * 0.1);
    } else if (chk.kind === "contradiction") {
      // A check that is *supposed* to fail. Two numbers in the sources cannot
      // both be right; the model's job is to show by how much, not to average
      // them into a plausible lie. `pass` means "the contradiction is still
      // there", so that silently repairing the data breaks the test.
      const v = chk.compute(solved);
      res.value = v;
      res.stated = chk.stated;
      res.excess = v - chk.stated;
      res.ratio = chk.stated ? v / chk.stated : null;
      res.pass = Math.abs(v - chk.stated) >= (chk.minDiscrepancy ?? 0);
      res.contradiction = true;
      res.resolution = chk.resolution ?? null;
    }
  } catch (err) {
    res.pass = false;
    res.error = String(err && err.message ? err.message : err);
  }
  return res;
}

export default {
  NM_M,
  FT_M,
  R_EARTH_M,
  distanceNm,
  initialBearing,
  destination,
  crossTrackNm,
  deadReckon,
  trackAt,
  cpa,
  cbdr,
  climbProfile,
  profileDivergence,
  solveTheater,
};
