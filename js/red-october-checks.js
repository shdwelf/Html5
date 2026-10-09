/** RED OCTOBER · CUTAWAY — cross-checks.
 *
 *  A check here always compares two numbers that reached the model down
 *  independent paths: a published dimension against something the geometry
 *  module derived from other published dimensions, or one publication against
 *  another. Green means they agree inside the stated tolerance.
 *
 *  `kind: "contradiction"` marks a check written to *pass while the sources
 *  still disagree*. It reports the spread instead of averaging it away, because
 *  quietly repairing the disagreement would hide the fact that Project 941 and
 *  Project 971 figures were never published by their builders in full.
 */

import {
  HULL_FORM,
  halfWidthAt,
  siloGrid,
  pressureHulls,
  compartments,
} from "./red-october-geo.js";
import { BOATS } from "./red-october-data.js";

/** ∫₀¹ (1 - t^p)^(1/p) dt by Simpson's rule — the superellipse area factor. */
function superellipseIntegral(p, n = 400) {
  const h = 1 / n;
  const f = (t) => Math.pow(Math.max(0, 1 - Math.pow(t, p)), 1 / p);
  let s = f(0) + f(1);
  for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 === 0 ? 2 : 4);
  return (s * h) / 3;
}

/**
 * Displaced volume of the light-hull envelope, m³, integrated along the length
 * from the same stations the renderer draws. Independent of the published
 * displacement figure, which is what makes the comparison worth making.
 */
export function envelopeVolume(boat, nStations = 121) {
  const lo = boat.dim.loa;
  const dx = lo / (nStations - 1);
  let vol = 0;
  for (let i = 0; i < nStations; i++) {
    const u = i / (nStations - 1);
    const half = halfWidth(u, boat) * (boat.dim.beam / 2);
    const vHalf = half * 0.94;
    const p = 2 + flatness(boat) * 2.5;
    const area = 4 * half * vHalf * superellipseIntegral(p);
    // Trapezoid along the length.
    const w = i === 0 || i === nStations - 1 ? 0.5 : 1;
    vol += area * dx * w;
  }
  return vol;
}

// The two hull-form lookups, kept local so this module reads top-to-bottom
// without jumping back into red-october-geo.js for defaults.
function formFor(boat) {
  return HULL_FORM[boat.id] || HULL_FORM.dallas;
}
function halfWidth(u, boat) {
  return halfWidthAt(u, formFor(boat));
}
function flatness(boat) {
  return formFor(boat).flat;
}

/** Knots to m/s. */
const KN_MS = 0.514444;
/** Shaft horsepower to watts. */
const HP_W = 745.7;
/** Seawater density, t/m³. */
const RHO_SW = 1.025;

/**
 * Run every check against every boat. Returns a flat list; the viewer groups
 * by boat and the tests assert on the ids.
 */
export function runChecks(boats = BOATS) {
  const out = [];
  for (const boat of boats) out.push(...checksForBoat(boat));
  return out;
}

export function checksForBoat(boat) {
  const d = boat.dim;
  const a = boat.armament;
  const pr = boat.propulsion;
  const checks = [];

  /* 1 · the pressure hulls must fit inside the light hull ------------------- */
  const hulls = pressureHulls(boat);
  const extent = Math.max(...hulls.map((h) => Math.abs(h.cx) + h.r));
  const beamRoom = d.beam / 2;
  checks.push({
    id: `${boat.id}/beam-closure`,
    boat: boat.id,
    label: `${hulls.length} pressure hull${hulls.length > 1 ? "s" : ""} fit the light hull`,
    kind: "closure",
    tier: d.hullCount > 1 ? "community" : "community",
    expected: `2 × ${extent.toFixed(2)} m ≤ ${d.beam.toFixed(2)} m beam`,
    actual: `${(2 * extent).toFixed(2)} m across, ${(beamRoom - extent).toFixed(2)} m of side clearance each side`,
    ok: 2 * extent <= d.beam,
  });

  /* 2 · the missile grid must fit its own compartment ------------------------ */
  if (a.missiles > 0) {
    const grid = siloGrid(boat);
    const deck = compartments(boat).find((c) => c.id === "silo-deck");
    const countOk = grid.length === a.missiles;
    const spanOk = deck ? grid.every((s) => s.x + s.r <= deck.x1 + 1e-9 && s.x - s.r >= deck.x0 - 1e-9) : false;
    // No two silos in a file may overlap.
    const byRow = new Map();
    for (const s of grid) {
      if (!byRow.has(s.row)) byRow.set(s.row, []);
      byRow.get(s.row).push(s.x);
    }
    let spacingOk = true;
    for (const xs of byRow.values()) {
      xs.sort((p, q) => p - q);
      for (let i = 1; i < xs.length; i++) {
        if (xs[i] - xs[i - 1] < a.siloDiameter - 1e-9) spacingOk = false;
      }
    }
    const ok = countOk && spanOk && spacingOk;
    checks.push({
      id: `${boat.id}/silo-grid`,
      boat: boat.id,
      label: `${a.missiles} silos laid out in ${a.missileRows} files fit the silo deck`,
      kind: "closure",
      tier: "community",
      expected: `count ${a.missiles}, inside deck ${deck ? deck.x0.toFixed(1) : "?"}–${deck ? deck.x1.toFixed(1) : "?"} m, pitch ≥ ${a.siloDiameter} m`,
      actual: `count ${grid.length}, in-deck ${spanOk ? "yes" : "NO"}, spacing ${spacingOk ? "clear" : "OVERLAPPING"}`,
      ok,
    });
  }

  /* 3 · envelope volume against published displacement ----------------------- */
  // Contradiction check: a teardrop envelope is not the real hull, and the
  // published displacement was never reconciled to a drawing. Passes inside a
  // generous band and always prints the ratio.
  const vol = envelopeVolume(boat);
  const volDisp = vol * RHO_SW;
  const ratio = d.dispSubmerged > 0 ? volDisp / d.dispSubmerged : NaN;
  checks.push({
    id: `${boat.id}/displacement-band`,
    boat: boat.id,
    label: "Envelope volume is the right order as the published submerged displacement",
    kind: "contradiction",
    tier: "community",
    expected: `0.50 ≤ ratio ≤ 2.00`,
    actual: `${vol.toFixed(0)} m³ × ${RHO_SW} t/m³ = ${volDisp.toFixed(0)} t vs ${d.dispSubmerged} t published — ratio ${ratio.toFixed(2)}`,
    ok: Number.isFinite(ratio) && ratio >= 0.5 && ratio <= 2.0,
  });

  /* 4 · crew density -------------------------------------------------------- */
  // Contradiction: this compares an SSBN to an SSN on an axis that does not
  // transfer. Most of a Project 941's envelope is missile volume and inter-hull
  // void, not habitable space, so its m³/person is six times a Los Angeles'
  // and that is expected rather than wrong. The band is wide on purpose and
  // the spread is printed.
  const perCrew = boat.crew > 0 ? vol / boat.crew : NaN;
  checks.push({
    id: `${boat.id}/crew-density`,
    boat: boat.id,
    label: "Displaced volume per crewmember is inside the submarine band",
    kind: "contradiction",
    tier: "community",
    expected: "30 – 500 m³/person",
    actual: `${perCrew.toFixed(0)} m³/person (${boat.crew} crew) — an SSBN's envelope is mostly missile volume, so this is not comparable across classes`,
    ok: Number.isFinite(perCrew) && perCrew >= 30 && perCrew <= 500,
  });

  /* 5 · admiralty coefficient from shaft power and top speed ---------------- */
  // C = Δ^(2/3) · V³ / P in SI. The three boats are not expected to agree;
  // the spread is the finding, so this is a wide band that reports C.
  const massKg = d.dispSubmerged * 1000;
  const v = pr.speedSubmerged * KN_MS;
  const pw = pr.shaftPower * HP_W;
  const C = (Math.pow(massKg, 2 / 3) * v * v * v) / pw;
  checks.push({
    id: `${boat.id}/admiralty`,
    boat: boat.id,
    label: "Shaft power and top speed imply a plausible admiralty coefficient",
    kind: "contradiction",
    tier: "community",
    expected: "1.5 ≤ C ≤ 12 (SI, Δ^(2/3)·V³/P)",
    actual: `C = ${C.toFixed(2)} from ${pr.shaftPower} shp and ${pr.speedSubmerged} kn on ${d.dispSubmerged} t`,
    ok: C >= 1.5 && C <= 12,
  });

  /* 6 · reactors against shafts --------------------------------------------- */
  checks.push({
    id: `${boat.id}/plant-symmetry`,
    boat: boat.id,
    label: "Reactor count and shaft count are consistent for the class",
    kind: "consistency",
    tier: "official",
    expected: "2 reactors ⇒ 2 shafts, 1 reactor ⇒ 1 shaft",
    actual: `${pr.reactors} × ${pr.reactor} on ${pr.shafts} shaft${pr.shafts > 1 ? "s" : ""}`,
    ok: pr.reactors === 1 ? pr.shafts === 1 : pr.shafts >= 2,
  });

  /* 7 · torpedo tubes match the class --------------------------------------- */
  const tubeOk = a.torpedoTubes >= 4 && a.torpedoTubes <= 8;
  checks.push({
    id: `${boat.id}/torpedo-tubes`,
    boat: boat.id,
    label: "Torpedo tube count is inside the class band",
    kind: "band",
    tier: "community",
    expected: "4 – 8 tubes",
    actual: `${a.torpedoTubes} × ${a.torpedoCalibre}`,
    ok: tubeOk,
  });

  return checks;
}

/**
 * Cross-boat checks — the ones that only make sense with all three loaded.
 */
export function crossBoatChecks(boats = BOATS) {
  const out = [];
  const byId = Object.fromEntries(boats.map((b) => [b.id, b]));
  const ty = byId.typhoon;
  const ak = byId.akula;
  const da = byId.dallas;

  /* · the naming collision is recorded, not smoothed over ------------------- */
  const recorded =
    ty &&
    ak &&
    ty.nato === "Typhoon" &&
    /Акула/.test(ty.project) &&
    ak.nato === "Akula" &&
    /Щука/.test(ak.project);
  out.push({
    id: "fleet/naming-collision",
    boat: null,
    label: "The Akula / Typhoon naming collision is carried, not averaged",
    kind: "consistency",
    tier: "official",
    expected: "Project 941 = Soviet «Акула» / NATO “Typhoon”; Project 971 = NATO “Akula”",
    actual: recorded
      ? `941 → ${ty.project} / ${ty.nato};  971 → ${ak.project} / ${ak.nato}`
      : "the data no longer records both names for both projects",
    ok: Boolean(recorded),
  });

  /* · published test depths order the way the classes are understood to ----- */
  if (ty && ak && da) {
    const order = ak.dim.testDepth > ty.dim.testDepth && ty.dim.testDepth > da.dim.testDepth;
    out.push({
      id: "fleet/test-depth-order",
      boat: null,
      label: "Published test depths order Akula > Typhoon > Dallas",
      kind: "consistency",
      tier: "community",
      expected: `${ak.dim.testDepth} > ${ty.dim.testDepth} > ${da.dim.testDepth} m`,
      actual: `${ak.dim.testDepth} / ${ty.dim.testDepth} / ${da.dim.testDepth} m`,
      ok: order,
    });

    /* · beam: the SSBN is the widest, but not by the same margin against
         both attack boats — 23 m is 2.3× a Los Angeles and only 1.69× a
         Project 971. Assert both margins rather than one flattering one. --- */
    const vsDallas = ty.dim.beam / da.dim.beam;
    const vsAkula = ty.dim.beam / ak.dim.beam;
    out.push({
      id: "fleet/beam-spread",
      boat: null,
      label: "Project 941's beam is >2× a Los Angeles and >1.5× a Project 971",
      kind: "band",
      tier: "community",
      expected: `>2.00× vs ${da.dim.beam} m, >1.50× vs ${ak.dim.beam} m`,
      actual: `${ty.dim.beam} m → ${vsDallas.toFixed(2)}× Dallas, ${vsAkula.toFixed(2)}× Akula`,
      ok: vsDallas > 2 && vsAkula > 1.5,
    });
  }

  return out;
}

export function allChecks(boats = BOATS) {
  return [...runChecks(boats), ...crossBoatChecks(boats)];
}
