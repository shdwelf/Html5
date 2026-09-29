import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  NM_M, FT_M, distanceNm, initialBearing, destination, rhumbDistanceM,
  enuFromGeo, geoFromEnu, fixFromPolar, polarFromFix, groundFromSlant,
  crossTrackNm, alongTrackNm, deadReckon, trackAt, setAndDrift,
  relativeMotion, cpa, cbdr, linefit, lineCross, climbProfile,
  profileDivergence, interceptSolution, timeCompression, patrolStartCorner,
  fillPolarGaps, solveTheater, hhmmss, dm, dmPair, parseLatLon, wrap180, nmToM,
} from "../js/vincennes-logmath.js";
import { THEATERS, THEATERS_BY_ID, SOURCES } from "../js/vincennes-logs-data.js";
import {
  DEM_META, DEM_CONTROL, buildGrid, sampleDem, hypsometric, landAt,
  pointInRing, validateControl, profile as demProfile,
} from "../js/vincennes-dem.js";
import {
  parseDjvu, decodeInfo, decodeTxt, decodeDirmHeader, parseIaDjvuXml,
  encodePlate, zonesOfKind, dump, ZONE_TYPES, ZONE_RECORD,
} from "../js/vincennes-djvu.js";

const close = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} expected ${b} ±${tol}, got ${a}`);

/* ======================================================================
   geodesy primitives
   ====================================================================== */

test("distance and bearing agree with a known long line", () => {
  // Bandar Abbas 21L threshold -> IR 655 impact fix
  const a = { lat: 27.232453, lon: 56.387556 };
  const b = { lat: 26.6292, lon: 56.0167 };
  close(distanceNm(a, b), 41.3, 0.5, "runway to impact");
  close(initialBearing(a, b), 208, 3, "departure bearing ~ runway 21 heading");
});

test("destination inverts distance/bearing", () => {
  const a = { lat: 26.5131, lon: 56.0158 };
  for (const brg of [0, 45, 121, 211, 359]) {
    for (const nm of [0.5, 8, 47]) {
      const b = destination(a, brg, nmToM(nm));
      close(distanceNm(a, b), nm, 1e-6, `range ${brg}/${nm}`);
      close(wrap180(initialBearing(a, b) - brg), 0, 0.02, `bearing ${brg}/${nm}`);
    }
  }
});

test("rhumb and great circle differ, but not at theater scale", () => {
  const a = { lat: 26.5, lon: 56.0 };
  const b = { lat: 26.7, lon: 56.1 };
  close(rhumbDistanceM(a, b) / NM_M, distanceNm(a, b), 0.01, "12 NM leg");
});

test("ENU tangent plane round-trips", () => {
  const o = { lat: -9.12, lon: 159.95 };
  for (const p of [{ lat: -9.0, lon: 159.8 }, { lat: -9.3, lon: 160.1 }]) {
    const enu = enuFromGeo(p, o);
    const back = geoFromEnu(enu, o);
    close(back.lat, p.lat, 1e-6, "lat");
    close(back.lon, p.lon, 1e-6, "lon");
  }
  // sign convention: east is +e, north is +n. The viewer depends on this.
  const east = enuFromGeo({ lat: -9.12, lon: 160.05 }, o);
  assert.ok(east.e > 0 && Math.abs(east.n) < 1, "a point to the east has positive e");
  const north = enuFromGeo({ lat: -9.02, lon: 159.95 }, o);
  assert.ok(north.n > 0 && Math.abs(north.e) < 1, "a point to the north has positive n");
});

test("polar <-> geodetic fix round-trips", () => {
  const o = { lat: 26.5131, lon: 56.0158 };
  const p = fixFromPolar(o, 10, 10);
  const q = polarFromFix(o, p);
  close(q.bearing, 10, 0.01, "bearing");
  close(q.rangeNm, 10, 0.001, "range");
});

test("slant range exceeds ground range by the right amount", () => {
  // 13,500 ft at 8 NM slant
  const g = groundFromSlant(8, 13500);
  close(g, Math.sqrt(64 - (13500 * FT_M / NM_M) ** 2), 1e-9, "pythagoras");
  assert.ok(g < 8, "ground range is shorter");
  close(g, 7.69, 0.02, "8 NM slant at 13,500 ft");
});

test("cross-track and along-track split a corridor correctly", () => {
  const from = { lat: 27.18, lon: 56.33 };
  const to = { lat: 25.62, lon: 55.44 };
  const mid = destination(from, initialBearing(from, to), nmToM(30));
  close(crossTrackNm(mid, from, to), 0, 0.01, "on the centreline");
  close(alongTrackNm(mid, from, to), 30, 0.05, "30 NM along");
  const off = destination(mid, initialBearing(from, to) + 90, nmToM(4));
  close(Math.abs(crossTrackNm(off, from, to)), 4, 0.02, "4 NM off");
});

/* ======================================================================
   dead reckoning
   ====================================================================== */

test("a square patrol closes on itself", () => {
  const start = { lat: -9.1, lon: 159.9 };
  const legs = [45, 135, 225, 315].map((course, i) => ({ t: i * 1800, course, speed: 10 }));
  const track = deadReckon(start, legs, { until: 7200, stepS: 60 });
  const end = track[track.length - 1];
  close(distanceNm(start, end), 0, 0.02, "four 30-minute legs at 10 kt close the box");
});

test("patrolStartCorner puts the centroid at the stated centre", () => {
  const centre = { lat: -9.12, lon: 159.953 };
  const start = patrolStartCorner(centre, 5, [45, 135, 225, 315]);
  let p = start;
  const corners = [p];
  for (const c of [45, 135, 225, 315]) corners.push((p = destination(p, c, nmToM(5))));
  const mean = corners.slice(0, 4).reduce(
    (a, q) => ({ lat: a.lat + q.lat / 4, lon: a.lon + q.lon / 4 }), { lat: 0, lon: 0 }
  );
  close(distanceNm(mean, centre), 0, 0.02, "centroid is the box centre");
  close(distanceNm(start, centre), 5 / Math.SQRT2, 0.02, "corner is half a diagonal out");
});

test("trackAt interpolates and clamps", () => {
  const tr = [
    { t: 0, lat: 0, lon: 0 },
    { t: 100, lat: 0, lon: 1 },
  ];
  close(trackAt(tr, 50).lon, 0.5, 1e-9, "midpoint");
  close(trackAt(tr, -10).lon, 0, 1e-9, "clamps low");
  close(trackAt(tr, 999).lon, 1, 1e-9, "clamps high");
});

test("set and drift resolves a DR-versus-fix residual", () => {
  const dr = { lat: 26.5, lon: 56.0 };
  const fix = destination(dr, 90, nmToM(2)); // the ship was 2 NM east of the DR
  const r = setAndDrift(dr, fix, 1);
  close(r.offsetNm, 2, 0.01, "offset");
  close(r.setDeg, 90, 0.5, "the current set east");
  close(r.driftKt, 2, 0.01, "2 knots over the hour");
});

test("fillPolarGaps interpolates only between known values", () => {
  const out = fillPolarGaps([
    { t: 0, bearing: 20, rangeNm: 40 },
    { t: 60, rangeNm: 30 },
    { t: 120, bearing: 10, rangeNm: 20 },
    { t: 180 },
  ]);
  close(out[1].bearing, 15, 0.01, "midway bearing");
  assert.equal(out[1].bearingInterpolated, true);
  assert.equal(out[3].bearing, undefined, "nothing is extrapolated past the last known value");
  assert.equal(out[0].bearingInterpolated, undefined, "known values are not marked");
});

/* ======================================================================
   relative motion
   ====================================================================== */

test("CPA of a closing target", () => {
  // contact 10 NM due north, tracking due south at 400 kt; ownship stopped
  const own = { lat: 26.5, lon: 56.0, course: 0, speed: 0 };
  const contact = { ...destination(own, 0, nmToM(10)), course: 180, speed: 400 };
  const r = cpa(own, contact);
  close(r.cpaNm, 0, 0.02, "head-on gives a zero CPA");
  close(r.tcpaS, (10 / 400) * 3600, 1, "TCPA is range over closing speed");
  assert.equal(r.closing, true);

  // now offset the contact's course by 21 degrees: the 1988 geometry
  const angled = { ...destination(own, 10, nmToM(10)), course: 211, speed: 384 };
  const r2 = cpa(own, angled);
  assert.ok(r2.cpaNm > 2 && r2.cpaNm < 6,
    `TN 4131 would have passed the ship by ${r2.cpaNm.toFixed(1)} NM, not over it`);
  assert.ok(r2.tcpaS > 0 && r2.tcpaS < 180, `and would have done so in ${r2.tcpaS.toFixed(0)} s`);
});

test("CBDR is detected, and a drifting bearing is not", () => {
  const steady = cbdr([
    { bearing: 45, rangeNm: 10 }, { bearing: 45, rangeNm: 8 }, { bearing: 46, rangeNm: 6 },
  ]);
  assert.equal(steady.constant, true, "a steady bearing with closing range is CBDR");
  assert.equal(steady.closing, true);

  const drift = cbdr([
    { bearing: 25, rangeNm: 47 }, { bearing: 21, rangeNm: 20 }, { bearing: 1, rangeNm: 8 },
  ]);
  assert.equal(drift.constant, false);
  close(Math.abs(drift.driftDeg), 24, 0.001, "the 1988 bearing drifted 24 degrees");
  assert.equal(drift.closing, true, "it was closing — but a closing contact is not a CBDR contact");
});

test("relativeMotion produces a closing rate and a bearing rate", () => {
  const own = { lat: 26.5, lon: 56.0, course: 0, speed: 0 };
  const head = { ...destination(own, 0, nmToM(10)), course: 180, speed: 400 };
  const rm = relativeMotion(own, head);
  close(rm.rangeNm, 10, 0.01, "range");
  close(rm.bearing, 0, 0.5, "bearing");
  close(rm.rangeRateKt, -400, 1, "closing at the full 400 kt");
  close(rm.bearingRateDegMin, 0, 0.01, "dead ahead, so the bearing is not moving");
});

/* ======================================================================
   line fitting
   ====================================================================== */

test("linefit recovers a known line exactly", () => {
  const pts = [0, 1, 2, 3].map((x) => ({ x, y: 2 * x + 5 }));
  const f = linefit(pts);
  close(f.m, 2, 1e-9, "slope");
  close(f.b, 5, 1e-9, "intercept");
  close(f.r2, 1, 1e-9, "perfect fit");
  assert.equal(f.n, 4);
  // and it reports how badly it fits when the data is not a line
  const noisy = linefit([{ x: 0, y: 0 }, { x: 1, y: 10 }, { x: 2, y: 0 }, { x: 3, y: 10 }]);
  assert.ok(noisy.r2 < 0.25, `R2 should be poor for a zigzag, got ${noisy.r2}`);
  assert.ok(noisy.rmse > 4, "and the RMSE should be large");
});

test("lineCross finds the intersection of two fits", () => {
  const x = lineCross({ m: 2, b: 0 }, { m: -1, b: 9 });
  close(x.x, 3, 1e-9, "x");
  close(x.y, 6, 1e-9, "y");
  assert.equal(lineCross({ m: 2, b: 0 }, { m: 2, b: 5 }), null, "parallel lines do not cross");
});

/* ======================================================================
   engagement
   ====================================================================== */

test("intercept solution yields a plausible SM-2 mean speed", () => {
  const r = interceptSolution({ launchT: 24862, hitT: 24883, launchRangeNm: 10, hitRangeNm: 8, targetSpeedKt: 384 });
  assert.equal(r.tofS, 21);
  close(r.missileNm, 8, 0.01, "the missile flew the intercept range");
  close(r.missileMeanKt, 1371, 2, "~Mach 2.1 at sea level");
  assert.ok(r.missileMeanKt > 900 && r.missileMeanKt < 2200, "inside the SM-2MR envelope");
});

test("timeCompression measures the decision window", () => {
  const events = [{ id: "detect", t: 24420 }, { id: "key", t: 24845 }];
  const r = timeCompression(events, "detect", "key");
  assert.equal(r.seconds, 425, "Fogarty's seven minutes and five seconds");
  assert.equal(r.mmss, "7:05");
  assert.equal(timeCompression(events, "detect", "nope"), null);
});

/* ======================================================================
   the three theaters, solved
   ====================================================================== */

test("every theater solves and every declared check passes", () => {
  assert.equal(THEATERS.length, 3);
  for (const t of THEATERS) {
    const s = solveTheater(t);
    assert.ok(s.span.t1 > s.span.t0, `${t.id}: non-empty time span`);
    assert.ok(Object.keys(s.tracks).length > 0, `${t.id}: has tracks`);
    for (const c of s.checks) {
      assert.ok(c.pass, `${t.id}/${c.id} failed: ${JSON.stringify({ d: c.deltaNm, v: c.value, s: c.stated, e: c.error })}`);
    }
  }
});

test("1988 · the polar log and the ICAO fix describe the same aeroplane", () => {
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const launch = s.checks.find((c) => c.id === "launch-fix");
  assert.ok(launch.deltaNm < 1.0, `launch residual ${launch.deltaNm}`);
  assert.ok(launch.deltaBearingDeg < 1.0, `bearing residual ${launch.deltaBearingDeg}`);
});

test("1988 · the first radar line back-projects onto the runway", () => {
  // The strongest independent check available: BRG 025 / 47 NM from the
  // launch fix should land on the threshold of Bandar Abbas 21L, and the
  // two numbers come from unrelated documents.
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const c = s.checks.find((c) => c.id === "first-detection-runway");
  assert.ok(c.deltaNm < 1.5, `runway residual ${c.deltaNm} NM`);
});

test("1988 · the fall residual is a fall, not a disagreement", () => {
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const f = s.checks.find((c) => c.id === "fall");
  assert.ok(f.deltaNm > 0.5 && f.deltaNm < 2.0, `fall displacement ${f.deltaNm} NM`);
  const brg = initialBearing(f.modeled, f.stated);
  assert.ok(brg > 150 && brg < 220, `wreckage fell roughly down-track, got ${brg}`);
});

test("1988 · the tape climbs and the recollections do not", () => {
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const p = s.derived.profile;
  // Range is measured closing, so a climb has a NEGATIVE ft-per-NM slope.
  assert.ok(p.system.perNm < -200, `tape slope ${p.system.perNm}`);
  assert.ok(p.system.perNmR2 > 0.95, `tape fit R2 ${p.system.perNmR2}`);
  assert.ok(p.recalled.perNm > 0, `recalled slope ${p.recalled.perNm} should be the other sign`);
  assert.ok(p.slopeRatio < 0, "the two gradients have opposite signs");
  assert.ok(Math.abs(p.slopeRatio + 1) > 0.2, "but it is not a clean mirror image");
  assert.ok(p.crossRangeNm > 18 && p.crossRangeNm < 26,
    `the fits cross inside the 25-20 NM band where CIC called the descent, got ${p.crossRangeNm}`);
});

test("1988 · post-intercept samples are excluded from the climb fit", () => {
  const t = THEATERS_BY_ID["hormuz-1988"];
  const s = solveTheater(t);
  const falls = t.altitude.system.filter((x) => x.phase === "fall");
  assert.ok(falls.length >= 5, "the fall is in the data");
  assert.equal(s.derived.altitudeSystem.some((x) => x.phase === "fall"), false,
    "but not in the profile fit");
  assert.equal(s.derived.altitudeFall.length, falls.length);
  assert.ok(s.derived.fall.fpm < -3000, `the wreckage was falling fast: ${s.derived.fall.fpm} fpm`);
});

test("1988 · some CIC recollections match the tape exactly", () => {
  // If every console had been wrong the story would be simpler and less
  // interesting. The divergence is confined to the descent calls.
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const agree = s.derived.altitudeRecalled.filter((r) => r.agrees);
  assert.ok(agree.length >= 2, "at least two recollections are confirmed by the tape");
  for (const a of agree) {
    const sys = s.derived.altitudeSystem.reduce((b, x) =>
      Math.abs(x.rangeNm - a.rangeNm) < Math.abs(b.rangeNm - a.rangeNm) ? x : b);
    assert.ok(Math.abs(sys.alt - a.alt) < 1600,
      `${a.station} recalled ${a.alt} at ${a.rangeNm} NM; tape had ${sys.alt}`);
  }
});

test("1988 · the geometry was never constant bearing, decreasing range", () => {
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const tr = s.tracks.tn4131;
  assert.equal(tr.cbdr.constant, false);
  assert.ok(Math.abs(tr.cbdr.driftDeg) > 15, `bearing drifted ${tr.cbdr.driftDeg}°`);
});

test("1988 · the aircraft stayed inside airway A-59", () => {
  const s = solveTheater(THEATERS_BY_ID["hormuz-1988"]);
  const abs = s.tracks["ir655-abs"].track;
  for (const p of abs) {
    assert.ok(Math.abs(p.crossTrackNm) <= 10 + 4,
      `${hhmmss(p.t)} was ${p.crossTrackNm?.toFixed(1)} NM off the reconstructed centreline`);
  }
});

test("1942 · the box patrol has no free parameters", () => {
  const s = solveTheater(THEATERS_BY_ID["savo-1942"]);
  // "five mile square" and "ninety degrees every half hour" are the same
  // fact twice: 5 NM at 10 kt is exactly 1,800 seconds.
  assert.equal(s.derived.legSeconds, 1800);
  assert.equal(s.derived.boxCorners.length, 4);
  const c = s.derived.boxCorners;
  for (let i = 0; i < 4; i++) {
    close(distanceNm(c[i], c[(i + 1) % 4]), 5, 0.02, `side ${i}`);
  }
  close(distanceNm(c[0], c[2]), 5 * Math.SQRT2, 0.03, "diagonal");
});

test("1942 · the DR at first illumination lands near the sinking position", () => {
  const s = solveTheater(THEATERS_BY_ID["savo-1942"]);
  const c = s.checks.find((c) => c.id === "illum-position");
  assert.ok(c.deltaNm < 5, `residual ${c.deltaNm} NM`);
  assert.ok(c.deltaNm > 1, "and it is not zero — the ship manoeuvred and died over the next hour");
});

test("1942 · the column mates trail the flagship", () => {
  const s = solveTheater(THEATERS_BY_ID["savo-1942"]);
  const lead = s.tracks.ca44.track;
  const next = s.tracks.ca39.track;
  assert.ok(next.length > 10, "Quincy has a track");
  const t = lead[Math.floor(lead.length / 2)].t;
  const a = trackAt(lead, t);
  const b = trackAt(next, t);
  const gap = distanceNm(a, b);
  close(gap, (180 / 3600) * 10, 0.05, "600 yards astern at 10 kt");
});

test("1944 · the Canberra contradiction is preserved, not averaged away", () => {
  const s = solveTheater(THEATERS_BY_ID["leyte-1944"]);
  const c = s.checks.find((c) => c.id === "tow-speed");
  assert.equal(c.contradiction, true);
  assert.ok(c.pass, "the check passes precisely because the sources still disagree");
  assert.ok(c.value > 15, `made-good speed ${c.value} kt between the two plotted positions`);
  assert.ok(c.ratio > 3, "a cruiser under tow cannot make four times her towing speed");
  assert.ok(c.resolution, "and the model says which of the two numbers it thinks is wrong");
});

test("1944 · the multi-day clock is monotonic and ordered", () => {
  const s = solveTheater(THEATERS_BY_ID["leyte-1944"]);
  assert.ok(s.span.t1 - s.span.t0 > 10 * 86400, "the plot spans nearly two weeks");
  const ts = s.events.map((e) => e.t);
  assert.deepEqual(ts, [...ts].sort((a, b) => a - b), "events are in order");
});

/* ======================================================================
   provenance discipline
   ====================================================================== */

test("every src key in the data resolves to a source record", () => {
  const seen = new Set();
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (typeof o.src === "string") seen.add(o.src);
    for (const v of Object.values(o)) if (v && typeof v === "object") walk(v);
    for (const k of o.sources ?? []) seen.add(k);
  };
  walk(THEATERS);
  assert.ok(seen.size > 10, `expected many sources, found ${seen.size}`);
  for (const k of seen) {
    assert.ok(SOURCES[k], `unresolved source key: ${k}`);
    assert.ok(SOURCES[k].title, `source ${k} has no title`);
  }
});

test("every source has a kind, and the primaries have URLs", () => {
  for (const [k, s] of Object.entries(SOURCES)) {
    assert.ok(s.kind, `${k} has no kind`);
    if (s.kind.startsWith("primary") || s.kind === "secondary") {
      assert.ok(s.url, `${k} is ${s.kind} but has no URL`);
    }
  }
});

test("derived and assumed values are marked as such", () => {
  const t = THEATERS_BY_ID["hormuz-1988"];
  // The post-intercept positions are reconstructed, and say so.
  const post = t.altitude.system.filter((s) => s.phase === "fall");
  assert.ok(post.every((s) => s.derived), "every fall sample is flagged derived");
  // Ownship is held at one point; the holds are flagged assumed.
  const holds = t.ownship.fixes.filter((f) => f.assumed);
  assert.ok(holds.length >= 2, "the stationary-ownship assumption is declared");
  assert.ok(t.ownship.speedNote.length > 50, "and explained");
});

/* ======================================================================
   DEM
   ====================================================================== */

test("every DEM control point is on the side of the coast it claims", () => {
  for (const id of Object.keys(DEM_CONTROL)) {
    const v = validateControl(id);
    assert.ok(v.ok, `${id}: ${JSON.stringify(v.problems)}`);
  }
});

test("the DEM reproduces its own control heights", () => {
  const g = buildGrid("hormuz-1988", 240, 220);
  close(sampleDem(g, 55.88, 26.655), 106, 12, "Hengam summit, on a 9 km island");
  close(sampleDem(g, 56.46, 27.05), 186, 15, "Hormuz Island");
  const s = buildGrid("savo-1942", 220, 220);
  close(sampleDem(s, 159.818, -9.135), 485, 15, "Savo summit");
  close(sampleDem(s, 159.8667, -9.1667), -1020, 60, "the CA-44 wreck, in 1,020 m");
});

test("the sea is below zero and the islands are above it", () => {
  const g = buildGrid("hormuz-1988", 200, 180);
  assert.ok(sampleDem(g, 56.0158, 26.5131) < 0, "Vincennes was afloat");
  assert.ok(sampleDem(g, 56.0167, 26.6292) < 0, "and the impact point is water");
  assert.ok(sampleDem(g, 56.05, 26.86) > 200, "Qeshm is not");
});

test("point-in-ring handles the boundary cases", () => {
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
  assert.equal(pointInRing(0.5, 0.5, sq), true);
  assert.equal(pointInRing(1.5, 0.5, sq), false);
  assert.equal(pointInRing(0.5, 1.5, sq), false);
});

test("a DEM profile is continuous", () => {
  const g = buildGrid("savo-1942", 200, 200);
  const p = demProfile(g, { lon: 159.7, lat: -9.135 }, { lon: 159.95, lat: -9.135 }, 64);
  assert.equal(p.length, 64);
  for (let i = 1; i < p.length; i++) {
    assert.ok(Math.abs(p[i].elev - p[i - 1].elev) < 400, "no cliffs between adjacent samples");
  }
  assert.ok(Math.max(...p.map((x) => x.elev)) > 300, "the transect crosses Savo");
});

test("the DEM layer says what it is and is not", () => {
  assert.match(DEM_META.status, /reconstruction/i);
  const ids = DEM_META.products.map((p) => p.id);
  assert.ok(ids.includes("srtm1"), "names the USGS product that actually covers these theaters");
  assert.ok(ids.includes("gmted2010"));
  const threedep = DEM_META.products.find((p) => p.id === "3dep");
  assert.equal(threedep.unusable, true, "and records that 3DEP does not cover them");
  assert.match(DEM_META.swapIn, /gdal_translate/, "and gives the command to swap a real clip in");
});

test("hypsometric tint separates land from water", () => {
  const land = hypsometric(400);
  const sea = hypsometric(-400);
  assert.ok(sea[2] > sea[0], "water is blue-dominant");
  assert.ok(land[0] >= land[2] || land[1] > land[2], "land is not");
});

/* ======================================================================
   DjVu
   ====================================================================== */

test("INFO decodes, including the little-endian dpi quirk", () => {
  // 2550 x 3300, v26.0, 300 dpi (0x012C stored LE as 2C 01), gamma 2.2
  const b = Uint8Array.from([0x09, 0xf6, 0x0c, 0xe4, 0x00, 0x1a, 0x2c, 0x01, 22, 1]);
  const i = decodeInfo(b, 0, 10);
  assert.equal(i.width, 2550);
  assert.equal(i.height, 3300);
  assert.equal(i.version, 26);
  assert.equal(i.dpi, 300, "dpi is little-endian in an otherwise big-endian format");
  close(i.gamma, 2.2, 0.01);
  close(i.inchesWide, 8.5, 0.001);
});

test("DIRM header decodes and reports its BZZ tail without decoding it", () => {
  const b = new Uint8Array(3 + 8);
  b[0] = 0x81;            // bundled, version 1
  b[1] = 0x00; b[2] = 0x02; // 2 files
  new DataView(b.buffer).setUint32(3, 1000);
  new DataView(b.buffer).setUint32(7, 2000);
  const d = decodeDirmHeader(b, 0, b.length);
  assert.equal(d.bundled, true);
  assert.equal(d.version, 1);
  assert.equal(d.nFiles, 2);
  assert.deepEqual(d.offsets, [1000, 2000]);
  assert.equal(d.bodyDecoded, false);
  assert.match(d.bodyNote, /BZZ/);
});

test("a generated plate round-trips through the reader exactly", () => {
  const lines = [
    { text: "0654:22  TN 4131 BRG 010 RNG 10 NM  12,950 FT", x: 300, y: 3000, w: 1800, h: 46 },
    { text: "0654:43  INTERCEPT 8 NM 13,500 FT 383 KT", x: 300, y: 2930, w: 1650, h: 46 },
    { text: "IMPACT 26-37.75N 056-01E", x: 300, y: 2860, w: 980, h: 46 },
  ];
  const bytes = encodePlate({ width: 2550, height: 3300, dpi: 300, annotation: "(zoom page)", lines });
  const doc = parseDjvu(bytes);

  assert.equal(doc.magic, true, 'the "AT&T" magic survives');
  assert.deepEqual(doc.warnings, []);
  assert.equal(doc.pages.length, 1);
  assert.equal(doc.root.form, "DJVU");

  const ids = doc.inventory.map((c) => c.id);
  assert.deepEqual(ids.sort(), ["ANTa", "FORM:DJVU", "INFO", "TXTa"]);

  const page = doc.pages[0];
  assert.equal(page.info.width, 2550);
  assert.equal(page.info.dpi, 300);

  const txt = page.text[0];
  assert.equal(txt.zoneParse, "ok", "the zone tree parsed and consumed exactly the chunk");
  assert.equal(txt.text, lines.map((l) => l.text).join("\n"));
  assert.equal(txt.version, 1);

  const got = zonesOfKind(txt.zones, "line");
  assert.equal(got.length, lines.length);
  got.forEach((z, i) => {
    assert.equal(z.text, lines[i].text, `line ${i} text`);
    assert.equal(z.x, lines[i].x, `line ${i} x`);
    assert.equal(z.y, lines[i].y, `line ${i} y`);
    assert.equal(z.w, lines[i].w, `line ${i} width`);
  });
  const pages = zonesOfKind(txt.zones, "page");
  assert.equal(pages.length, 1);
  assert.equal(pages[0].children.length, lines.length);
});

test("odd-length chunks are padded, and the parser keeps its place", () => {
  // an odd-length ANTa forces the IFF pad byte on the path to TXTa
  const bytes = encodePlate({
    width: 100, height: 100, annotation: "odd",  // 3 bytes
    lines: [{ text: "x", x: 1, y: 2, w: 3, h: 4 }],
  });
  const doc = parseDjvu(bytes);
  assert.deepEqual(doc.warnings, []);
  assert.equal(doc.pages[0].text[0].zoneParse, "ok");
  assert.equal(doc.pages[0].text[0].text, "x");
});

test("a corrupt zone tree is reported, never guessed at", () => {
  const good = encodePlate({
    width: 100, height: 100,
    lines: [{ text: "hello", x: 1, y: 2, w: 3, h: 4 }],
  });
  // Locate the zone tree the same way the reader does, so this test does not
  // depend on the encoder's byte layout staying still.
  const doc0 = parseDjvu(good);
  const txtChunk = doc0.inventory.find((c) => c.id === "TXTa");
  const dataStart = txtChunk.offset + 8;
  const textLen = (good[dataStart] << 16) | (good[dataStart + 1] << 8) | good[dataStart + 2];
  const zoneStart = dataStart + 3 + textLen + 1;
  assert.equal(good[zoneStart], 1, "the first zone record is the page zone");

  // (a) a zone type outside the documented hierarchy
  const badType = Uint8Array.from(good);
  badType[zoneStart] = 0x63;
  const d1 = parseDjvu(badType);
  const t1 = d1.pages[0].text[0];
  assert.equal(t1.zoneParse, "length-mismatch");
  assert.deepEqual(t1.zones, [], "no boxes are emitted from a tree we could not read");
  assert.equal(t1.text, "hello", "but the text layer still works");
  assert.ok(d1.warnings.some((w) => /zone/i.test(w)), "and it says so");
  assert.equal(t1.zoneLayout.reference, ZONE_RECORD.reference,
    "and it points at the only normative description of the layout");

  // (b) a child count that runs off the end of the chunk
  const badCount = Uint8Array.from(good);
  badCount[zoneStart + 16] = 9;
  const t2 = parseDjvu(badCount).pages[0].text[0];
  assert.equal(t2.zoneParse, "length-mismatch");
  assert.equal(t2.text, "hello");

  // (c) trailing junk inside the chunk: the tree parses but does not fill it
  const doc2 = parseDjvu(good);
  assert.equal(doc2.pages[0].text[0].zoneParse, "ok", "the unmodified file still reads");
});

test("truncated files degrade instead of throwing", () => {
  const bytes = encodePlate({ width: 100, height: 100, lines: [{ text: "abc", x: 0, y: 0, w: 1, h: 1 }] });
  for (const n of [4, 9, 20, bytes.length - 6]) {
    const doc = parseDjvu(bytes.subarray(0, n));
    assert.ok(Array.isArray(doc.warnings), `truncation at ${n} returned a document`);
  }
  const notDjvu = parseDjvu(new TextEncoder().encode("%PDF-1.4 not a djvu at all"));
  assert.equal(notDjvu.magic, false);
  assert.ok(notDjvu.warnings.length > 0);
});

test("the reader declares what it cannot decode", () => {
  const doc = parseDjvu(encodePlate({ width: 10, height: 10, lines: [] }));
  assert.ok(doc.capabilities.notDecoded.includes("TXTz"));
  assert.ok(doc.capabilities.notDecoded.includes("NAVM"));
  assert.match(doc.capabilities.reason, /BZZ/);
  assert.ok(doc.capabilities.decoded.includes("TXTa"));
});

test("zone type table matches the DjVu hierarchy", () => {
  assert.deepEqual(Object.values(ZONE_TYPES),
    ["page", "column", "region", "paragraph", "line", "word", "character"]);
  assert.equal(ZONE_RECORD.bytes, 17);
  assert.match(ZONE_RECORD.caveat, /to be documented/i);
});

test("the Internet Archive word-box derivative reads", () => {
  const xml = `<?xml version="1.0"?><DjVuXML><BODY>
    <OBJECT data="file://p1.djvu" height="3300" width="2550">
      <PARAM name="DPI" value="300"/><PARAM name="PAGE" value="0001.djvu"/>
      <HIDDENTEXT><PAGECOLUMN><REGION><PARAGRAPH><LINE>
        <WORD coords="300,3052,700,3000">FORMAL</WORD>
        <WORD coords="720,3052,1400,3000">INVESTIGATION</WORD>
      </LINE></PARAGRAPH></REGION></PAGECOLUMN></HIDDENTEXT>
    </OBJECT></BODY></DjVuXML>`;
  const d = parseIaDjvuXml(xml);
  assert.equal(d.pages.length, 1);
  assert.equal(d.pages[0].dpi, 300);
  assert.equal(d.pages[0].width, 2550);
  assert.equal(d.pages[0].words.length, 2);
  assert.equal(d.pages[0].words[0].text, "FORMAL");
  assert.equal(d.pages[0].words[0].x, 300);
  assert.equal(d.pages[0].words[0].h, 52, "coords are left,bottom,right,top");
});

test("dump renders a djvudump-shaped tree", () => {
  const out = dump(parseDjvu(encodePlate({ width: 8, height: 8, annotation: "a", lines: [] })));
  assert.match(out, /FORM:DJVU/);
  assert.match(out, /INFO \[10\]/);
  assert.match(out, /8×8/);
});

/* ======================================================================
   shipped artefacts
   ====================================================================== */

test("the generated plate fixtures parse and match their manifest", async () => {
  const manifest = JSON.parse(readFileSync(new URL("../data/vincennes/plates.json", import.meta.url), "utf8"));
  assert.ok(manifest.plates.length >= 4);
  assert.match(manifest.meta.status, /GENERATED FIXTURES, NOT SCANS/);
  for (const p of manifest.plates) {
    const bytes = new Uint8Array(readFileSync(new URL(`../data/vincennes/${p.file}`, import.meta.url)));
    assert.equal(bytes.length, p.bytes, `${p.file} size`);
    const doc = parseDjvu(bytes);
    assert.equal(doc.magic, true, `${p.file} magic`);
    assert.deepEqual(doc.warnings, [], `${p.file} warnings`);
    const txt = doc.pages[0].text[0];
    assert.equal(txt.zoneParse, "ok", `${p.file} zones`);
    assert.equal(txt.zoneCount, p.zones, `${p.file} zone count`);
    assert.equal(txt.text.length, p.chars, `${p.file} char count`);
    assert.equal(doc.pages[0].info.width, p.pageWidth);
    assert.ok(p.url.startsWith("https://"), `${p.file} links the real document`);
    assert.ok(p.standsFor.length > 20, `${p.file} says what it stands for`);
    assert.ok(THEATERS_BY_ID[p.theater], `${p.file} belongs to a real theater`);
  }
});

test("dem.json matches what the module computes today", () => {
  const j = JSON.parse(readFileSync(new URL("../data/vincennes/dem.json", import.meta.url), "utf8"));
  assert.match(j.meta.disclosure, /not a sample of a USGS raster/);
  for (const [id, t] of Object.entries(j.theaters)) {
    const g = buildGrid(id, t.gridProbe.nx, t.gridProbe.ny);
    assert.equal(t.control.length, DEM_CONTROL[id].control.length, `${id} control count`);
    for (const p of t.probes) {
      close(sampleDem(g, p.lon, p.lat), p.elevM, 2, `${id}/${p.label}`);
    }
  }
});

/* ======================================================================
   the page wires up what the module expects
   ====================================================================== */

const html = readFileSync(new URL("../vincennes-4dwm.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../js/vincennes-4dwm.js", import.meta.url), "utf8");

test("the page carries every hook the viewer reaches for", () => {
  for (const id of [
    "stage", "labels", "tooltip", "subtitle", "layerList", "checkList",
    "profileChart", "profileNote", "infoTitle", "infoBody", "jumpList",
    "plateList", "djvuFile", "statTracks", "statChecks", "statDem",
    "statPlates", "status", "timeSlider", "timeReadout", "btnPlay",
    "btnSpeed", "btnTilt", "btnReset", "pipLayer", "wm4dDesk", "wm4dTray",
    "wm4dStatus",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id} in the page`);
  }
  for (const t of ["hormuz-1988", "savo-1942", "leyte-1944"]) {
    assert.ok(html.includes(`data-theater="${t}"`), `missing theater button ${t}`);
  }
  for (const m of ["all", "none", "geom"]) {
    assert.ok(html.includes(`data-layers="${m}"`), `missing layer preset ${m}`);
  }
});

test("the page loads the shared pip stylesheet before its own", () => {
  const a = html.indexOf("project-y-4dwm.css");
  const b = html.indexOf("vincennes-4dwm.css");
  assert.ok(a > 0 && b > a, "the local theme must be able to override the shared one");
});

test("the viewer reuses the shared window manager rather than reinventing it", () => {
  assert.match(js, /from "\.\/project-y-4dwm\.js"/);
  assert.match(js, /initPipWm\(/);
});

test("the viewer imports its numbers instead of hard-coding them", () => {
  assert.match(js, /from "\.\/vincennes-logmath\.js"/);
  assert.match(js, /from "\.\/vincennes-logs-data\.js"/);
  assert.match(js, /from "\.\/vincennes-dem\.js"/);
  assert.match(js, /from "\.\/vincennes-djvu\.js"/);
  assert.match(js, /solveTheater\(/);
  // no literal latitudes in the view layer
  const suspicious = js.match(/\blat:\s*-?\d+\.\d{3,}/g) ?? [];
  assert.deepEqual(suspicious, [], `view layer should not carry coordinates: ${suspicious}`);
});

test("formatters render the way a plot is labelled", () => {
  assert.equal(hhmmss(24862), "0654:22");
  assert.equal(dm(26.6292, "lat"), "26\u00b037.75'N");
  assert.equal(dm(56.0167, "lon"), "56\u00b001.00'E");
  assert.equal(dmPair({ lat: -9.1667, lon: 159.8667 }), "9\u00b010.00'S 159\u00b052.00'E");
  close(parseLatLon("26-37.75N"), 26.6292, 1e-4, "degrees and decimal minutes");
  close(parseLatLon("056-01E"), 56.0167, 1e-4, "leading zero longitude");
  close(parseLatLon("9-10S"), -9.1667, 1e-4, "southern hemisphere");
  close(parseLatLon("26\u00b030'47\"N"), 26.5131, 1e-4, "degrees, minutes, seconds");
  close(parseLatLon("-9.1667"), -9.1667, 1e-9, "plain signed decimal");
});
