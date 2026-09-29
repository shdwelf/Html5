/**
 * VINCENNES LOG DATA — three ships, three logs, one name.
 *
 * Every number below is traceable to a named page of a public document. Where
 * a value is *derived* rather than quoted it is marked `derived: true` and the
 * derivation lives in js/vincennes-logmath.js, never here. Where a value is an
 * assumption made to draw a picture it is marked `assumed: true` and says so
 * in the viewer.
 *
 * Source keys are resolved against SOURCES at the bottom of this file.
 *
 * Boundary, stated once: this is a geometric reconstruction for study. It is
 * not a track chart, not an accident report, and not evidence. The recorded
 * tapes, the testimony and the court filings disagree with each other in ways
 * that are the whole point of the exercise; the model shows the disagreement,
 * it does not resolve it.
 */

import { distanceNm } from "./vincennes-logmath.js";

const hms = (h, m, s = 0) => h * 3600 + m * 60 + s;
/** October 1944 runs across twelve days; day 14 Oct = t 0. */
const oct = (d, h, m = 0) => (d - 14) * 86400 + h * 3600 + m * 60;

/* ========================================================================
   1988 · USS VINCENNES (CG-49) · Strait of Hormuz · 3 July 1988
   Times are Z (GMT). Local Iran time that day was Z+4:30.
   ======================================================================== */

/** Ship positions at the moment of launch, from ICAO Figure 1 via Yale JIL. */
const VINCENNES_88 = { lat: 26 + 30 / 60 + 47 / 3600, lon: 56 + 0 / 60 + 57 / 3600 };
const MONTGOMERY_88 = { lat: 26 + 31 / 60, lon: 55 + 55 / 60 + 12 / 3600 };
const IR655_LAUNCH_FIX = { lat: 26 + 40 / 60 + 6 / 3600, lon: 56 + 2 / 60 + 41 / 3600 };
const IR655_IMPACT_FIX = { lat: 26 + 37.75 / 60, lon: 56 + 1 / 60 };
const BANDAR_ABBAS_21L = { lat: 27.232453, lon: 56.387556 }; // 21L threshold, elev 14 ft

/**
 * TN 4131 as the AEGIS Mk 7 tape recorded it. Range is slant range from
 * USS Vincennes; bearing is true from Vincennes. Where the report quotes only
 * the reciprocal ("bearing 205, 40 miles from you", broadcast *to* the
 * aircraft), the bearing here is that reciprocal ± 180 and is marked so.
 */
const TN4131_SYSTEM = [
  { t: hms(6, 47, 0), rangeNm: 47, bearing: 25, alt: 900, label: "first SPY-1A detection", src: "fogarty-internal" },
  { t: hms(6, 49, 0), rangeNm: 40, bearing: 25, alt: 4000, speed: 303, course: 203, label: "MAD warning quotes system values", src: "fogarty-internal", reciprocal: true },
  { t: hms(6, 50, 0), rangeNm: 34, bearing: 25, alt: 6160, speed: 334, label: "IO Exhibit 91", src: "fogarty-internal" },
  { t: hms(6, 51, 0), rangeNm: 29, bearing: 25, alt: 7000, speed: 350, course: 207, label: "system held 7,000 ft at 29 NM", src: "fogarty-internal", reciprocal: true },
  { t: hms(6, 51, 40), rangeNm: 28, bearing: 24, alt: 8500, label: "Link 11 altitude report 8,500", src: "fogarty-internal" },
  { t: hms(6, 52, 10), rangeNm: 25, alt: 8400, label: "system at 25 NM", src: "fogarty-internal" },
  { t: hms(6, 52, 30), rangeNm: 22, alt: 9200, label: "system at 22 NM", src: "fogarty-internal" },
  { t: hms(6, 52, 50), rangeNm: 20, bearing: 21, alt: 10000, speed: 360, course: 210, label: "IAD challenge; kinematics agreed with system", src: "fogarty-internal", reciprocal: true },
  { t: hms(6, 53, 0), rangeNm: 16, bearing: 18, alt: 11230, speed: 371, label: "IO Exhibit 91", src: "fogarty-internal" },
  { t: hms(6, 53, 31), rangeNm: 15, alt: 11400, label: "system at 06:53:31", src: "fogarty-internal" },
  { t: hms(6, 53, 50), rangeNm: 14, alt: 12000, speed: 382, label: "system at 14 NM", src: "fogarty-internal" },
  { t: hms(6, 54, 0), rangeNm: 12, alt: 12370, speed: 380, course: 211, label: "start of 0654Z minute", src: "fogarty-internal" },
  { t: hms(6, 54, 22), rangeNm: 10, bearing: 10, alt: 12950, speed: 385, label: "missile 1 off forward rail A", src: "fogarty-internal" },
  { t: hms(6, 54, 41), rangeNm: 8.2, alt: 12900, label: "last Mode C altitude received", src: "fogarty-internal", derived: true },
  { t: hms(6, 54, 43), rangeNm: 8, bearing: 1, alt: 13500, speed: 383, label: "missile 1 intercept", src: "fogarty-internal" },
  { t: hms(6, 55, 0), rangeNm: 7.6, alt: 12000, label: "Link 11, 17 s after intercept", src: "fogarty-internal", derived: true, phase: "fall" },
  { t: hms(6, 55, 4), rangeNm: 7.4, alt: 10500, label: "post-intercept descent", src: "fogarty-internal", derived: true, phase: "fall" },
  { t: hms(6, 55, 14), rangeNm: 7.2, alt: 8300, label: "post-intercept descent", src: "fogarty-internal", derived: true, phase: "fall" },
  { t: hms(6, 55, 24), rangeNm: 7.1, alt: 6500, label: "post-intercept descent", src: "fogarty-internal", derived: true, phase: "fall" },
  { t: hms(6, 55, 34), rangeNm: 7.05, alt: 4700, label: "post-intercept descent", src: "fogarty-internal", derived: true, phase: "fall" },
  { t: hms(6, 55, 44), rangeNm: 7.0, alt: 3000, label: "post-intercept descent", src: "fogarty-internal", derived: true, phase: "fall" },
  { t: hms(6, 55, 54), rangeNm: 6.97, alt: 1900, label: "last system altitude", src: "fogarty-internal", derived: true, phase: "fall" },
];

/**
 * The same seven minutes as the Combat Information Center remembered it.
 * Fogarty Table 1 plus the individual recollections in the 0650–0655 findings.
 * `agrees` marks the recollections the tape *confirms* — they matter as much
 * as the ones it contradicts, because they rule out "every console was wrong".
 */
const TN4131_RECALLED = [
  { rangeNm: 30, alt: 9000, label: "AIC-3, third look, east of Qeshm", station: "AIC-3", src: "fogarty-internal" },
  { rangeNm: 30, alt: 8500, label: "AAWC recalled 8–9 kft at 30 NM", station: "AAWC", src: "fogarty-internal" },
  { rangeNm: 25, alt: 12000, label: "49 ADT: highest altitude seen", station: "49 ADT", src: "fogarty-internal" },
  { rangeNm: 22, alt: 10300, label: "CSC: last altitude looked at", station: "CSC", src: "fogarty-internal" },
  { rangeNm: 20, alt: 10500, label: "IAD talker", station: "IAD", src: "fogarty-internal" },
  { rangeNm: 20, alt: 9000, label: "AIC-3 at 20 NM", station: "AIC-3", agrees: true, src: "fogarty-internal" },
  { rangeNm: 15, alt: 11000, label: "TIC at 15 NM", station: "TIC", agrees: true, src: "fogarty-internal" },
  { rangeNm: 15, alt: 7700, label: "AIC-3, fourth look", station: "AIC-3", src: "fogarty-internal" },
  { rangeNm: 14, alt: 7800, label: "IDS: 445 kt, descending, one minute to launch", station: "IDS", src: "fogarty-internal" },
  { rangeNm: 10, alt: 7800, label: "49 ADT at launch — \u201cthat, I haven't been able to get out of my mind\u201d", station: "49 ADT", src: "fogarty-internal" },
  { rangeNm: 6, alt: 7000, label: "MSS at intercept", station: "MSS", src: "fogarty-internal" },
  { rangeNm: 6, alt: 7800, label: "AIC-3 wrote 7,800 / 6 NM at intercept", station: "AIC-3", src: "fogarty-internal" },
];

const HORMUZ = {
  id: "hormuz-1988",
  title: "USS Vincennes (CG-49) \u00b7 Iran Air 655 \u00b7 3 July 1988",
  subtitle: "Strait of Hormuz \u00b7 AEGIS Mk 7 data-reduction tape vs. CIC recollection",
  zone: "Z",
  zoneNote: "All times Z (GMT). Iran was Z+4:30; the ship kept Bahrain time, Z+3 \u2014 one of the reasons the airline schedule was misread.",
  origin: { ...VINCENNES_88, alt: 0 },
  viewSpanNm: 60,
  ownship: {
    id: "cg49",
    name: "USS Vincennes (CG-49)",
    course: 0,
    speed: 0,
    speedNote:
      "Vincennes was manoeuvring hard in a gun action with Iranian boghammars throughout. No ownship course/speed series is published minute-by-minute, so the model holds her at the ICAO launch fix and flags every range/bearing as slant data from that point.",
    fixes: [
      { t: hms(6, 43, 0), ...VINCENNES_88, label: "surface engagement opens", src: "fogarty-internal", assumed: true },
      { t: hms(6, 54, 22), ...VINCENNES_88, label: "missile launch position (ICAO Figure 1)", src: "yale-jil" },
      { t: hms(6, 56, 0), ...VINCENNES_88, label: "hold", src: "yale-jil", assumed: true },
    ],
  },
  contacts: [
    {
      id: "tn4131",
      name: "TN 4131 \u00b7 Iran Air 655 (A300B2, EP-IBU)",
      kind: "air",
      color: "#ffd166",
      samples: TN4131_SYSTEM.map((s) => ({ ...s, fromId: "cg49" })),
    },
    {
      id: "ir655-abs",
      name: "IR 655 \u00b7 absolute fixes (ICAO / ICJ)",
      kind: "air-fix",
      color: "#4cc9f0",
      samples: [
        { t: hms(6, 47, 0), ...BANDAR_ABBAS_21L, alt: 14, label: "lift-off, runway 21L, 0647Z", src: "fogarty-formal" },
        { t: hms(6, 49, 18), alt: 3500, label: "\u201cpassing out of 3,500 feet\u201d to Bandar Abbas approach", src: "icj-memorial", noFix: true },
        { t: hms(6, 51, 4), alt: 7000, label: "\u201cpassing out of 7,000 for 14,000\u201d to Tehran ACC", src: "icj-memorial", noFix: true },
        { t: hms(6, 54, 22), ...IR655_LAUNCH_FIX, alt: 12950, label: "position at missile launch", src: "yale-jil" },
        { t: hms(6, 56, 30), ...IR655_IMPACT_FIX, alt: 0, label: "impact, 6.5 mi east of Hengam Island", src: "fogarty-formal" },
      ],
    },
    {
      id: "ffg14",
      name: "USS Sides (FFG-14)",
      kind: "ship",
      color: "#9bd1a0",
      samples: [
        {
          t: hms(6, 48, 0),
          lat: 26.72,
          lon: 56.36,
          label: "detected IR 655 bearing ~355, range ~32 NM, 1,500 ft",
          src: "fogarty-formal",
          assumed: true,
          assumedNote:
            "Sides' own position is not published. The pin is the point that satisfies her stated bearing 355\u00b0/32 NM to the aircraft at 0648Z and is drawn as an assumed fix.",
        },
      ],
    },
    {
      id: "ff1082",
      name: "USS Elmer Montgomery (FF-1082)",
      kind: "ship",
      color: "#9bd1a0",
      samples: [{ t: hms(6, 54, 22), ...MONTGOMERY_88, label: "position at missile launch (ICAO Figure 1)", src: "yale-jil" }],
    },
  ],
  /** Amber 59: 20 NM wide, 10 NM each side of centreline, Bandar Abbas → Dubai. */
  corridor: {
    id: "a59",
    name: "Airway A-59 (Amber 59)",
    halfWidthNm: 10,
    from: { lat: 27.18, lon: 56.33 },
    to: { lat: 25.62, lon: 55.44 },
    note:
      "Centreline drawn Bandar Abbas \u2192 Dubai through the ICAO-published corridor. It is a reconstruction: the published sources give the width (20 NM) and the aircraft's maximum deviation (4 NM), not the centreline geodetic. The LSD #2 line in front of the AAW coordinator was itself drawn slightly west of the true centreline \u2014 Fogarty, IO Exhibit 187.",
    src: "icao-1988",
  },
  altitude: { system: TN4131_SYSTEM, recalled: TN4131_RECALLED },
  engagement: {
    launchT: hms(6, 54, 22),
    launchRangeNm: 10,
    hitT: hms(6, 54, 43),
    hitRangeNm: 8,
    targetSpeedKt: 384,
    weapon: "2 \u00d7 RIM-66 SM-2MR Block II, forward launcher rails A and B",
    src: "fogarty-internal",
  },
  events: [
    { id: "gun", t: hms(6, 43, 0), label: "Vincennes opens fire on Iranian small boats", src: "fogarty-formal" },
    { id: "takeoff", t: hms(6, 47, 0), label: "IR 655 lifts off runway 21, squawking Mode III 6760", src: "fogarty-formal" },
    { id: "detect", t: hms(6, 47, 0), label: "SPY-1A detection, BRG 025 / 47 NM / 900 ft \u2014 TN 4131 assigned", src: "fogarty-internal" },
    { id: "sides", t: hms(6, 48, 0), label: "USS Sides detects, BRG ~355 / 32 NM / 1,500 ft", src: "fogarty-formal" },
    { id: "mad1", t: hms(6, 49, 0), label: "first MAD challenge \u2014 on a military frequency the A300 could not receive", src: "fogarty-internal" },
    { id: "modeii", t: hms(6, 50, 0), label: "IDS reports Mode II-1100 on his RCI; the system holds only Mode III-6760", src: "fogarty-internal" },
    { id: "astro", t: hms(6, 50, 50), label: "TN 4131 called \u201cAstro\u201d (F-14) on the AAW net; tagged F-14 on the large screen", src: "fogarty-internal" },
    { id: "comair", t: hms(6, 51, 30), label: "\u201cPossible COMAIR\u201d called to the CO; acknowledged with a raised hand", src: "fogarty-internal" },
    { id: "descend", t: hms(6, 52, 30), label: "first \u201cdecreasing altitude\u201d call, between 25 and 20 NM \u2014 tape shows continued ascent", src: "fogarty-internal" },
    { id: "sides-eval", t: hms(6, 53, 20), label: "CO USS Sides evaluates TN 4131 as a non-threat on CPA and turns to the P-3", src: "fogarty-internal" },
    { id: "key", t: hms(6, 54, 5), label: "firing key turned", src: "fogarty-internal" },
    { id: "auth", t: hms(6, 54, 19), label: "FIRING AUTHORIZE \u2014 TN 4131 at 10 NM", src: "fogarty-internal" },
    { id: "launch", t: hms(6, 54, 22), label: "two SM-2MR away, one second apart", src: "fogarty-internal" },
    { id: "hit", t: hms(6, 54, 43), label: "intercept \u2014 8 NM, BRG 001, 13,500 ft, 383 kt. 290 dead.", src: "fogarty-internal" },
    { id: "kill", t: hms(6, 54, 51), label: "system assesses PROBABLE KILL WITH TRACK", src: "fogarty-internal" },
    { id: "splash", t: hms(6, 55, 54), label: "last recorded altitude, 1,900 ft", src: "fogarty-internal" },
  ],
  checks: [
    {
      id: "launch-fix",
      kind: "polar-vs-absolute",
      label: "Vincennes' own polar log vs. the ICAO absolute fix, at launch",
      observer: VINCENNES_88,
      bearing: 10,
      rangeNm: 10,
      stated: IR655_LAUNCH_FIX,
      toleranceNm: 1,
      note:
        "The AEGIS tape says TN 4131 bore 010\u00b0 at 10 NM when the missiles left the rail. ICAO's Figure 1 \u2014 reproduced in Iran's own Memorial to the ICJ \u2014 puts IR 655 at 26\u00b040\u203206\u2033N 56\u00b002\u203241\u2033E. Two documents from opposite sides of the case, reduced to one point each.",
      sources: ["fogarty-internal", "yale-jil", "icj-memorial"],
    },
    {
      id: "first-detection-runway",
      kind: "polar-vs-absolute",
      label: "First SPY-1A detection, back-projected onto the runway",
      observer: VINCENNES_88,
      bearing: 25,
      rangeNm: 47,
      stated: BANDAR_ABBAS_21L,
      toleranceNm: 1.5,
      note:
        "The strongest independent check in the set, and nobody had to state it. Take the very first radar line \\u2014 BRG 025 at 47 NM, 900 ft \\u2014 and project it from the launch fix. It lands within a mile of the threshold of runway 21L at Bandar Abbas, which is where a jet at 900 feet on a 47-mile-distant radar ought to be. The bearing and the range come from the AEGIS tape; the threshold coordinate comes from an aerodrome chart. Neither was derived from the other, and the geometry closes anyway. That is what licenses the rest of the polar reconstruction.",
      sources: ["fogarty-internal", "fogarty-formal", "oikb-chart"],
    },
    {
      id: "fall",
      kind: "polar-vs-absolute",
      label: "Intercept fix vs. impact fix \u2014 the fall",
      observer: VINCENNES_88,
      bearing: 1,
      rangeNm: 8,
      stated: IR655_IMPACT_FIX,
      toleranceNm: 2,
      note:
        "Not a disagreement: the first is where the warheads went off at 13,500 ft, the second is where the wreckage reached the water 70 seconds later. The residual is the fall displacement.",
      sources: ["fogarty-internal", "fogarty-formal"],
    },
    {
      id: "a59-centre",
      kind: "offset-derives",
      label: "A-59 centreline, derived from the impact point",
      from: IR655_IMPACT_FIX,
      bearing: 121,
      offsetNm: 3.37,
      note:
        "Fogarty states the aircraft went down 3.37 miles *west* of the A-59 centreline. Taking the corridor axis as 211\u00b0 (the aircraft's own recorded course at 0654Z), the perpendicular to the east is 121\u00b0 \u2014 so the stated offset derives a point on the centreline. Derived, not quoted.",
      sources: ["fogarty-internal"],
    },
    {
      id: "tof",
      kind: "value",
      label: "SM-2 mean speed over the intercept run",
      compute: (s) => s.derived.intercept?.missileMeanKt ?? 0,
      stated: 1370,
      tolerance: 60,
      note:
        "8 NM in 21 seconds is ~1,370 kt mean, about Mach 2.1 at sea level \u2014 the right order for an SM-2MR Block II including boost. A reconstruction that cannot produce a plausible weapon is a reconstruction with a bad clock.",
      sources: ["fogarty-internal"],
    },
    {
      id: "window",
      kind: "value",
      label: "Decision window, detection to firing key",
      compute: (s) => {
        const a = s.events.find((e) => e.id === "detect");
        const b = s.events.find((e) => e.id === "key");
        return a && b ? b.t - a.t : 0;
      },
      stated: 425,
      tolerance: 20,
      note:
        "Fogarty's first endorsement: \u201conly seven minutes and five seconds elapsed between the time Iran Air Flight 655 was first detected by USS Vincennes and the decision made to fire\u201d \u2014 425 seconds.",
      sources: ["fogarty-formal"],
    },
  ],
};

/* ========================================================================
   1942 · USS VINCENNES (CA-44) · Savo Island · 9 August 1942
   Times are L (zone -11, Solomons). The whole northern-force position
   problem is a closed-form dead-reckoning exercise, because the patrol was
   published as a geometry rather than as a list of fixes.
   ======================================================================== */

const SAVO_BOX_CENTER = { lat: -(9 + 7 / 60), lon: 159 + 57 / 60 + 12 / 3600 };
const SAVO_ISLAND = { lat: -9.135, lon: 159.82 };
const VINCENNES_WRECK = { lat: -(9 + 10 / 60), lon: 159 + 52 / 60 };

const SAVO = {
  id: "savo-1942",
  title: "USS Vincennes (CA-44) \u00b7 Battle of Savo Island \u00b7 9 August 1942",
  subtitle: "Northern force box patrol \u2014 a log published as a geometry, integrated back into a track",
  zone: "L",
  zoneNote: "Zone -11 local time, as used in the action reports and the Graybook.",
  origin: { lat: -9.13, lon: 159.9, alt: 0 },
  viewSpanNm: 24,
  ownship: {
    id: "ca44",
    name: "USS Vincennes (CA-44)",
    course: 45,
    speed: 10,
  },
  /**
   * "Patrolling at a speed of 10 knots on a square, the center of which lay
   * approximately midway between Savo and the western end of Florida Island…
   * At midnight it turned onto course 045\u00b0 T. and was to make a change of 90\u00b0
   * to the right approximately every half hour." (NHHC, *The Battles of Savo
   * Island*). The 5-mile side and the centre geodetic come from the order of
   * battle. Note the geometry is self-consistent: 5 NM at 10 kt is exactly
   * 30 minutes, so "5-mile square" and "90\u00b0 every half hour" are the same fact
   * stated twice \u2014 which is what makes the integration trustworthy.
   */
  patrol: {
    center: SAVO_BOX_CENTER,
    sideNm: 5,
    speedKt: 10,
    legs: [45, 135, 225, 315],
    legCount: 6,
    startT: hms(0, 0, 0),
    src: "nhhc-savo",
  },
  contacts: [
    {
      id: "ca39",
      name: "USS Quincy (CA-39)",
      kind: "ship",
      color: "#f4978e",
      followsOwnshipByS: 180,
      samples: [],
    },
    {
      id: "ca34",
      name: "USS Astoria (CA-34)",
      kind: "ship",
      color: "#f4978e",
      followsOwnshipByS: 360,
      samples: [],
    },
    {
      id: "mikawa",
      name: "IJN Eighth Fleet (Mikawa, Ch\u014dkai leading)",
      kind: "ship",
      color: "#ff6b6b",
      samples: [
        { t: hms(0, 54, 0), lat: -9.23, lon: 159.72, course: 120, speed: 26, label: "closing the 7-mile Savo/Guadalcanal gap at 26 kt", src: "world-war-canberra", assumed: true },
        { t: hms(1, 43, 0), lat: -9.19, lon: 159.83, course: 90, speed: 26, label: "engaging the southern group; Patterson's TBS warning", src: "nhhc-savo", assumed: true },
        { t: hms(1, 50, 0), lat: -9.15, lon: 159.88, course: 60, speed: 26, label: "searchlights on the northern group", src: "nhhc-savo", assumed: true },
        { t: hms(2, 16, 0), lat: -9.10, lon: 159.95, course: 20, speed: 26, label: "Astoria hits Ch\u014dkai's forward turret", src: "wikipedia-savo", assumed: true },
      ],
      note:
        "Mikawa's column is drawn from the narrative (course 120\u00b0 at 26 kt into the gap, then east and north around the northern box) and is the only track here that is a *sketch*: no minute-by-minute Japanese log is in the public sources used.",
    },
  ],
  events: [
    { id: "midnight", t: hms(0, 0, 0), label: "northern group turns onto 045\u00b0 T; box patrol begins", src: "nhhc-savo" },
    { id: "riefkohl", t: hms(0, 50, 0), label: "Capt. Riefkohl turns in; exec has the ship", src: "danfs-ca44" },
    { id: "flares", t: hms(1, 43, 0), label: "aircraft flares and gunfire to the south; Patterson's TBS warning", src: "nhhc-savo" },
    { id: "lights", t: hms(1, 50, 0), label: "Japanese searchlights illuminate the northern cruisers", src: "wikipedia-savo" },
    { id: "fire", t: hms(1, 53, 0), label: "Kako opens on Vincennes; Vincennes returns fire", src: "wikipedia-savo" },
    { id: "torps", t: hms(1, 55, 0), label: "Vincennes hit port side by torpedoes; 25 kt ordered", src: "nhhc-savo" },
    { id: "quincy", t: hms(2, 38, 0), label: "Quincy sinks bow first", src: "wikipedia-savo" },
    { id: "sink", t: hms(2, 50, 0), label: "Vincennes rolls over and sinks \u2014 332 lost", src: "danfs-ca44" },
  ],
  checks: [
    {
      id: "leg-closes",
      kind: "value",
      label: "Does the published geometry close? (leg duration)",
      compute: (s) => s.derived.legSeconds ?? 0,
      stated: 1800,
      tolerance: 1,
      note:
        "A 5 NM side at 10 knots is 1,800 seconds. The action report's \u201c90\u00b0 to the right approximately every half hour\u201d and the order of battle's \u201c5-mile square\u201d are therefore the same statement, and the DR has no free parameters.",
      sources: ["nhhc-savo", "grokipedia-savo-obat"],
    },
    {
      id: "illum-position",
      kind: "dr-vs-reported",
      label: "Box-patrol DR at first illumination vs. the reported sinking position",
      trackId: "ca44",
      t: hms(1, 50, 0),
      stated: VINCENNES_WRECK,
      toleranceNm: 6,
      note:
        "Riefkohl wrote that Vincennes \u201crolled over and then sank at about 0250 \u2026 about 2\u00bd miles east of Savo Island.\u201d The residual between the 0150 DR and that position is the hour of manoeuvring, drifting and dying that the log does not record. It is a measurement of the gap, not an error.",
      sources: ["nhhc-savo", "danfs-ca44", "veterans-collection"],
    },
  ],
  landmarks: [
    { id: "savo", name: "Savo Island", ...SAVO_ISLAND, note: "Volcanic cone, highest point ~485 m." },
    { id: "wreck", name: "Vincennes (CA-44) wreck", ...VINCENNES_WRECK, note: "Located 16 Jan 2015, Paul Allen expedition, ~1,020 m of water." },
    { id: "boxcentre", name: "Northern box centre", ...SAVO_BOX_CENTER, note: "Midway between Savo and the western end of Florida Island." },
  ],
};

/* ========================================================================
   1944 · USS VINCENNES (CL-64) · Formosa / Leyte Gulf · October 1944
   Times are I (zone -9), as the Graybook keeps them.
   ======================================================================== */

const LEYTE = {
  id: "leyte-1944",
  title: "USS Vincennes (CL-64) \u00b7 Formosa and Leyte Gulf \u00b7 October 1944",
  subtitle: "Nimitz Graybook plot \u2014 Cripple Division 1 and the TG 34.5 sweep",
  zone: "I",
  zoneNote:
    "Zone -9 (item) time, as kept in the CINCPAC running estimate. The Besugo contact is logged GCT in the Graybook and is converted here (+9 h) so the whole plot runs on one clock.",
  epoch: { day: 14, month: "Oct", year: 1944 },
  multiDay: true,
  origin: { lat: 18, lon: 126, alt: 0 },
  viewSpanNm: 900,
  ownship: {
    id: "cl64",
    name: "TG 34.5 / USS Vincennes (CL-64)",
    course: 180,
    speed: 25,
    fixes: [
      { t: oct(25, 2, 40), lat: 17.3, lon: 126.18, label: "TG 34.5 formed under VAdm Lee, 0240I 25 Oct", src: "graybook-v5-282" },
      { t: oct(25, 17, 34), lat: 12.58, lon: 125.53, label: "San Bernardino sweep, 25 Oct 1734I", src: "graybook-v5-426" },
      { t: oct(26, 0, 35), lat: 12.5, lon: 125.4, label: "Nowaki brought to action off San Bernardino Strait, ~0035 26 Oct", src: "nhhc-h038", assumed: true },
    ],
  },
  contacts: [
    {
      id: "ca70",
      name: "USS Canberra (CA-70) \u2014 Cripple Division 1",
      kind: "ship",
      color: "#4cc9f0",
      samples: [
        { t: oct(14, 7, 0), lat: 22.56, lon: 123.43, course: 140, speed: 4.5, label: "torpedoed east of Formosa, in tow, 14 Oct 0700I", src: "graybook-v5-270" },
        { t: oct(15, 6, 0), lat: 17.0, lon: 130.0, course: 140, speed: 4.5, label: "retiring towards Ulithi \u2014 date label disputed, see check \u2018tow-speed\u2019", src: "graybook-v5-270", disputed: true },
      ],
    },
    {
      id: "cl81",
      name: "USS Houston (CL-81) \u2014 Cripple Division 1",
      kind: "ship",
      color: "#f72585",
      samples: [
        { t: oct(14, 18, 0), lat: 22.51, lon: 124.08, course: 110, speed: 3, label: "hit aft, in tow, 14 Oct 1800I", src: "graybook-v5-270" },
        { t: oct(16, 14, 22), lat: 20.75, lon: 125.4, course: 100, speed: 3, label: "hit a second time, still in tow, 16 Oct 1422I", src: "graybook-v5-272" },
      ],
    },
    {
      id: "besugo",
      name: "IJN cruiser force \u2014 Besugo contact",
      kind: "ship",
      color: "#ffb703",
      samples: [
        { t: oct(15, 8, 0), lat: 32.5, lon: 132.6, course: 140, speed: 18, label: "enemy contact off Bungo Suido, 14 Oct 2300 GCT = 0800I 15 Oct", src: "graybook-v5-271" },
      ],
    },
  ],
  events: [
    { t: oct(14, 7, 0), id: "canberra", label: "Canberra torpedoed east of Formosa", src: "graybook-v5-270" },
    { t: oct(25, 2, 40), id: "tg345", label: "TG 34.5 forms: Iowa, New Jersey, Biloxi, Vincennes, Miami, 8 DD", src: "hyperwar-leyte-be" },
    { t: oct(25, 17, 34), id: "sweep", label: "San Bernardino sweep, 20 kt on 270", src: "graybook-v5-426" },
    { t: oct(26, 0, 35), id: "nowaki", label: "Nowaki sunk by cruiser gunfire and Owen's torpedoes \u2014 ~1,400 lost with Chikuma's survivors", src: "nhhc-h038" },
    { t: oct(27, 7, 0), id: "dissolve", label: "TG 34.5 dissolved, 0700I 27 Oct", src: "hyperwar-leyte-be" },
  ],
  checks: [
    {
      id: "tow-speed",
      kind: "contradiction",
      label: "Canberra under tow \u2014 the two plotted positions cannot both be 15 October",
      compute: (s) => {
        const tr = s.tracks.ca70?.track ?? [];
        if (tr.length < 2) return 0;
        const a = tr[0];
        const b = tr[tr.length - 1];
        return distanceNm(a, b) / ((b.t - a.t) / 3600) || 0;
      },
      stated: 4.5,
      minDiscrepancy: 5,
      resolution:
        "The position is almost certainly good and the date label is not. At the stated 4.5 kt the run from 22\u00b033.6\u2032N 123\u00b025.8\u2032E to 17\u00b000\u2032N 130\u00b000\u2032E takes about four and a half days, which would put Canberra there around 18\u201319 October \u2014 consistent with her reaching Ulithi at the end of the month, and not with 0600 on the 15th.",
      note:
        "Cripple Division 1 is the one part of this plot that can be checked against itself: two positions and, in the same entry, the speed the ship was making. They do not agree, and they miss by a factor of five. A crippled heavy cruiser under tow does not make 21 knots. This check is written to pass while the contradiction survives, so that quietly \u2018fixing\u2019 the coordinate would break the test suite rather than the plot \u2014 the disagreement is the finding.",
      sources: ["graybook-v5-270"],
    },
  ],
};

/* ========================================================================
   sources
   ======================================================================== */

export const SOURCES = {
  "fogarty-internal": {
    title:
      "Formal Investigation into the Circumstances Surrounding the Downing of Iran Air Flight 655 on 3 July 1988 \u2014 Internal Report",
    author: "RAdm William M. Fogarty, USN",
    date: "28 July 1988",
    url: "https://en.wikisource.org/wiki/Formal_Investigation_into_the_Circumstances_Surrounding_the_Downing_of_Iran_Air_Flight_655_on_3_July_1988/Internal_Report",
    kind: "primary",
    note: "Declassified/redacted. Section 2.D findings by Z minute; Table 1 collates what each station reported.",
  },
  "fogarty-formal": {
    title: "Investigation Report \u2014 formal report and first endorsement (DoD release scan)",
    author: "U.S. Department of Defense",
    date: "1988",
    url: "https://time.com/wp-content/uploads/2014/03/dodvincennes.pdf",
    kind: "primary-scan",
    note: "The scanned release. Page images, OCR of variable quality \u2014 the DjVu layer of this app exists because of documents like this one.",
  },
  "icj-memorial": {
    title: "Memorial of the Islamic Republic of Iran (Aerial Incident of 3 July 1988)",
    author: "International Court of Justice",
    date: "24 July 1990",
    url: "https://www.icj-cij.org/public/files/case-related/79/6629.pdf",
    kind: "primary",
    note: "Iran's pleading. Quotes the ICAO report's radio-communication transcript and Figure 2 (route A59 and the position when hit).",
  },
  "icao-1988": {
    title: "ICAO fact-finding investigation report, Iran Air 655 (C-WP/8708)",
    author: "International Civil Aviation Organization",
    date: "December 1988",
    url: "https://www.icj-cij.org/case/79",
    kind: "primary",
    note: "Cited through the ICJ filings and the Yale JIL article; the report's Figure 1/2 are the source of the absolute fixes used here.",
  },
  "yale-jil": {
    title: "The Yale Journal of International Law, Vol. 16 No. 2 \u2014 Iran Air 655",
    date: "Summer 1991",
    url: "https://openyls.law.yale.edu/server/api/core/bitstreams/6def3043-a413-4592-a489-255762a9fbf8/content",
    kind: "secondary",
    note:
      "Reproduces ICAO Figure 1 positions: Vincennes 26\u00b030\u203247\u2033N 56\u00b000\u203257\u2033E, Montgomery 26\u00b031\u2032N 55\u00b055\u203212\u2033E, Flight 655 26\u00b040\u203206\u2033N 56\u00b002\u203241\u2033E at launch.",
  },
  "usni-carlson": {
    title: "\u201cVincennes: A Case Study\u201d",
    author: "Cdr David R. Carlson, USN (CO, USS Sides)",
    date: "U.S. Naval Institute Proceedings, August 1993",
    url: "https://www.usni.org/magazines/proceedings/1993/august/vincennes-case-study",
    kind: "secondary",
    note: "The other ship's captain, on the track-number swap and the 6700-series squawk.",
  },
  "nhhc-savo": {
    title: "The Battles of Savo Island, 9 August 1942 (Combat Narratives)",
    author: "Naval History and Heritage Command",
    url: "https://www.history.navy.mil/content/dam/nhhc/browse-by-topic/War%20and%20Conflict/WWII-Pacific-Battles/Savo%20Web.pdf",
    kind: "primary-derived",
    note: "Gives the box patrol: 10 knots, square, centre midway Savo\u2013Florida, 045\u00b0 at midnight, 90\u00b0 right every half hour.",
  },
  "grokipedia-savo-obat": {
    title: "Savo Island order of battle",
    url: "https://grokipedia.com/page/savo_island_order_of_battle",
    kind: "tertiary",
    note:
      "Used only for the numeric box: 5-mile square centred 09\u00b007\u2032S 159\u00b057\u203212\u2033E. Tertiary \u2014 flagged as such in the viewer and in the source check.",
  },
  "danfs-ca44": {
    title: "Vincennes II (CA-44), Dictionary of American Naval Fighting Ships",
    author: "Naval History and Heritage Command",
    url: "https://www.history.navy.mil/research/histories/ship-histories/danfs/v/vincennes-ii.html",
    kind: "primary-derived",
    note: "Riefkohl's own sentence on the time and place of the sinking.",
  },
  "veterans-collection": {
    title: "Riefkohl's log of the attack, quoted",
    url: "https://veteranscollection.org/tag/uss-vincennes-ca-44/",
    kind: "tertiary",
  },
  "wikipedia-savo": {
    title: "Battle of Savo Island",
    url: "https://en.wikipedia.org/wiki/Battle_of_Savo_Island",
    kind: "tertiary",
  },
  "world-war-canberra": {
    title: "HMAS Canberra and the Battle of Savo Island \u2014 first-hand account",
    url: "https://www.world-war.co.uk/canberra_story.php",
    kind: "tertiary",
    note: "Source for Mikawa's 120\u00b0/26 kt approach and the clockwise 045-135-225-315 box.",
  },
  "oikb-chart": {
    title: "Bandar Abbas International (OIKB / BND) aerodrome data",
    kind: "reference",
    note:
      "Field elevation 22 ft; runway 03R/21L 3,660 \u00d7 45 m, true heading 027/207, 21L threshold 27.232453 N 56.387556 E. Used only to test the first radar line \u2014 no part of the aircraft track is taken from it.",
  },
  "graybook-v5-270": {
    title: "Nimitz Graybook, Volume 5 (1 Jan \u2013 31 Dec 1944), p. 270",
    author: "CINCPAC staff / Naval War College Archives",
    url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22",
    kind: "primary-scan",
  },
  "graybook-v5-271": { title: "Nimitz Graybook, Volume 5, p. 271", url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22", kind: "primary-scan" },
  "graybook-v5-272": { title: "Nimitz Graybook, Volume 5, p. 272", url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22", kind: "primary-scan" },
  "graybook-v5-282": { title: "Nimitz Graybook, Volume 5, p. 282", url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22", kind: "primary-scan" },
  "graybook-v5-426": { title: "Nimitz Graybook, Volume 5, p. 426", url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22", kind: "primary-scan" },
  "hyperwar-leyte-be": {
    title: "Battle Experience: Battle for Leyte Gulf (CominCh secret information bulletin)",
    url: "https://www.ibiblio.org/hyperwar/USN/rep/Leyte/BatExp/Leyte-BE-78.1.html",
    kind: "primary-derived",
    note: "TG 34.5 composition and the 0240I formation / 0700I 27 Oct dissolution.",
  },
  "nhhc-h038": {
    title: "H-038-2: Leyte Gulf in Detail",
    author: "Naval History and Heritage Command, Director's Corner",
    url: "https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-gram-038/h-038-2.html",
    kind: "secondary",
  },
};

export const THEATERS = [HORMUZ, SAVO, LEYTE];
export const THEATERS_BY_ID = Object.fromEntries(THEATERS.map((t) => [t.id, t]));
export default THEATERS;
