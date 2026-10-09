/** RED OCTOBER · CUTAWAY — pure hull geometry.
 *
 *  Deliberately free of Three.js. Everything here is a plain function on plain
 *  numbers so tests can assert on the hull form, the silo grid and the
 *  cross-section without booting a renderer. The viewer in
 *  js/red-october-4dwm.js turns these arrays into meshes; the VRML writer in
 *  js/red-october-vrml.js turns the same arrays into a .wrl.
 *
 *  Coordinate convention, matching the other 4DWM viewers in this repo:
 *    +X  toward the bow        (x = 0 at the stern, x = LOA at the bow)
 *    +Y  up                    (y = 0 at the keel baseline of the pressure hull)
 *    +Z  starboard
 *  All units are metres unless a name says otherwise.
 */

/**
 * Hull-form parameters. These are NOT published dimensions — they are the
 * shape a teardrop hull takes on screen, tier `context`. Dimensioned numbers
 * live in js/red-october-data.js and are what the cross-checks assert on.
 *
 *   aft      station where the long aft taper ends and full beam begins,
 *            as a fraction of LOA measured from the stern (u = 0)
 *   fwd      station where full beam ends and the bow nose begins
 *   tail     aft taper exponent; lower = fuller run aft
 *   flat     0 = fully faired round hull, 1 = boxy (Project 941's light hull)
 *
 * u runs stern-to-bow. The hull is deliberately asymmetric, the way a real
 * boat is: a blunt elliptical nose forward (the sonar dome is close to a
 * hemisphere) and a long taper aft running to the screw. Getting that the
 * other way round produces a hull shaped like a teardrop pointed at the bow,
 * which is the easy mistake to make with a symmetric formula.
 */
export const HULL_FORM = {
  // Nose runs are kept short and the full-beam band long, matching the boats:
  // Dallas 0.85 -> a 16 m nose on 110 m, Typhoon 0.88 -> a 21 m nose on 175 m
  // with a 101 m parallel body, which is what makes that hull look as full as
  // it is.
  typhoon: { aft: 0.3, fwd: 0.88, tail: 0.55, flat: 0.55 },
  dallas: { aft: 0.35, fwd: 0.85, tail: 0.62, flat: 0 },
  akula: { aft: 0.36, fwd: 0.85, tail: 0.6, flat: 0.1 },
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Normalised half-width of the light hull at station u (0 = stern, 1 = bow),
 * as a fraction of half-beam. Continuous at both breakpoints, zero at both
 * ends, monotonic on each taper.
 */
export function halfWidthAt(u, form = HULL_FORM.dallas) {
  const t = clamp01(u);
  const { aft, fwd, flat, tail } = form;

  let w;
  if (t >= aft && t <= fwd) {
    // Full beam.
    w = 1;
  } else if (t < aft) {
    // Long aft taper, blended toward a fuller run as `flat` rises.
    const s = (aft - t) / aft;
    const ell = Math.sqrt(Math.max(0, 1 - s * s));
    const pow = Math.pow(Math.max(0, 1 - s), tail);
    w = ell * (1 - flat) + pow * flat;
  } else {
    // Blunt elliptical nose. xi is the distance back from the tip normalised
    // over the nose run, so xi = 0 at the bow and 1 where full beam begins;
    // sqrt(1 - (1-xi)^2) starts at zero with a vertical tangent, which is the
    // hemispherical sonar dome rather than a point.
    const xi = (1 - t) / (1 - fwd);
    w = Math.sqrt(Math.max(0, 1 - (1 - xi) * (1 - xi)));
  }

  return clamp01(w);
}

/**
 * Sample the hull profile. Returns stations from stern to bow.
 * `n` is the number of stations including both ends.
 */
export function hullProfile(boat, n = 49, form = HULL_FORM[boat.id]) {
  const lo = boat.dim.loa;
  const hw = boat.dim.beam / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = u * lo;
    const half = halfWidthAt(u, form) * hw;
    out.push({ u, x, half, yTop: half * 0.94, yBottom: -half * 0.94 });
  }
  return out;
}

/**
 * Cross-section circles of the pressure hull(s), in metres, at the design
 * waterline. Project 941 carries two side by side; everyone else carries one.
 * `cx` is signed toward starboard, `r` is radius.
 */
export function pressureHulls(boat) {
  const { hullCount, hullDiameter, hullGap } = boat.dim;
  const r = hullDiameter / 2;
  if (hullCount <= 1) return [{ cx: 0, r, id: "pressure" }];
  const offset = (hullDiameter + hullGap) / 2;
  return [
    { cx: -offset, r, id: "pressure-port" },
    { cx: +offset, r, id: "pressure-starboard" },
  ];
}

/**
 * The missile silo grid, laid out as `rows` files running fore-and-aft inside
 * the silo-deck compartment. Returns silo centre positions in boat coords.
 *
 * The point of returning this rather than drawing it is that checks.js can ask
 * whether the grid the model drew actually fits the compartment the published
 * dimensions imply — an off-by-one in the count shows up as an overlap.
 */
export function siloGrid(boat) {
  const a = boat.armament;
  if (!a.missiles || a.missiles <= 0) return [];
  const rows = Math.max(1, a.missileRows || 1);
  const perRow = Math.ceil(a.missiles / rows);
  const deck = boat.layout.find((c) => c.id === "silo-deck");
  if (!deck) return [];

  const lo = boat.dim.loa;
  const x0 = deck.from * lo + a.siloPitch / 2;
  const x1 = deck.to * lo - a.siloPitch / 2;
  const span = Math.max(0, x1 - x0);
  const step = perRow > 1 ? span / (perRow - 1) : 0;

  // Transverse offset: the files straddle the centreline symmetrically.
  const lat = boat.dim.hullDiameter / 2 + boat.dim.hullGap / 2;
  const offsets =
    rows === 1
      ? [0]
      : Array.from({ length: rows }, (_, i) => (i - (rows - 1) / 2) * 2 * lat);

  const out = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < perRow && n < a.missiles; i++, n++) {
      out.push({
        n: n + 1,
        x: x0 + step * i,
        z: offsets[r],
        r: a.siloDiameter / 2,
        row: r + 1,
      });
    }
  }
  return out;
}

/**
 * Compartment boxes as fractions of LOA resolved to metres.
 * The sail is flagged so the viewer can extrude it above the hull.
 */
export function compartments(boat) {
  const lo = boat.dim.loa;
  const r = boat.dim.hullDiameter / 2;
  return boat.layout.map((c) => ({
    ...c,
    x0: c.from * lo,
    x1: c.to * lo,
    yTop: c.tall ? r + 4.5 : r * 0.92,
    yBottom: -r * 0.92,
  }));
}

/**
 * DK cross-section — the pressure-body section at station u.
 *
 * Returns the light-hull outline polygon at that station plus the pressure
 * hull circles and which compartments the station falls inside. This is what
 * the SECTION view and the VRML export draw: a slice, not a guess.
 */
export function sectionAt(boat, u, form = HULL_FORM[boat.id]) {
  const lo = boat.dim.loa;
  const x = clamp01(u) * lo;
  const hw = boat.dim.beam / 2;
  const h = halfWidthAt(clamp01(u), form);

  const half = h * hw;
  const vHalf = half * 0.94;

  // Rounded-rectangle outline: `flat` pulls the corners square, matching the
  // hull form used for the surface above so the two agree at every station.
  const flat = form.flat;
  const outline = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // Superellipse: exponent 2 = ellipse, rising toward 4 as the hull flattens.
    const p = 2 + flat * 2.5;
    const k = Math.pow(
      Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p),
      -1 / p,
    );
    outline.push({ y: s * k * vHalf, z: c * k * half });
  }

  const inside = boat.layout.filter((c) => x >= c.from * lo && x <= c.to * lo);

  return {
    u: clamp01(u),
    x,
    half,
    vHalf,
    outline,
    pressure: pressureHulls(boat),
    compartments: inside,
    depthBelowKeel: 0,
  };
}

/**
 * Longitudinal surface grid: stations × circumferential rings, in metres.
 * The viewer builds a BufferGeometry from it; the VRML writer builds an
 * IndexedFaceSet from exactly the same numbers, so the two cannot disagree.
 */
export function hullSurface(boat, nStations = 49, nRings = 28, form = HULL_FORM[boat.id]) {
  const r = boat.dim.hullDiameter / 2;
  const positions = [];
  for (let i = 0; i < nStations; i++) {
    const u = i / (nStations - 1);
    const x = u * boat.dim.loa;
    const half = halfWidthAt(u, form) * (boat.dim.beam / 2);
    const vHalf = half * 0.94;
    const flat = form.flat;
    const p = 2 + flat * 2.5;
    for (let j = 0; j < nRings; j++) {
      const a = (j / nRings) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const k = Math.pow(
        Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p),
        -1 / p,
      );
      positions.push(x, s * k * vHalf, c * k * half);
    }
  }

  const index = [];
  for (let i = 0; i < nStations - 1; i++) {
    for (let j = 0; j < nRings; j++) {
      const j2 = (j + 1) % nRings;
      const a = i * nRings + j;
      const b = i * nRings + j2;
      const c = (i + 1) * nRings + j;
      const d = (i + 1) * nRings + j2;
      index.push(a, b, d, a, d, c);
    }
  }

  return { positions, index, nStations, nRings };
}
