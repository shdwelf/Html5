import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  HULL_FORM, halfWidthAt, hullProfile, hullSurface, pressureHulls,
  siloGrid, compartments, sectionAt,
} from "../js/red-october-geo.js";
import { BOATS, BOATS_BY_ID, STORYLINE, SOURCES, TIERS } from "../js/red-october-data.js";
import { envelopeVolume, checksForBoat, crossBoatChecks, allChecks } from "../js/red-october-checks.js";
import { boatToVrml, validateVrml } from "../js/red-october-vrml.js";

/* ======================================================================
   data integrity
   ====================================================================== */

test("every boat carries the dimensions the model draws from", () => {
  for (const b of BOATS) {
    for (const k of ["loa", "beam", "draft", "dispSurfaced", "dispSubmerged", "hullDiameter", "testDepth"]) {
      assert.ok(Number.isFinite(b.dim[k]) && b.dim[k] > 0, `${b.id}.dim.${k}`);
    }
    assert.ok(b.dim.loa > b.dim.beam, `${b.id}: LOA must exceed beam`);
    assert.ok(b.layout.length >= 6, `${b.id}: expected a real compartment breakdown`);
    // Compartments tile the length without running past it.
    assert.ok(b.layout[0].from === 0, `${b.id}: layout must start at the stern`);
    assert.ok(b.layout[b.layout.length - 1].to === 1, `${b.id}: layout must end at the bow`);
    for (const c of b.layout) {
      assert.ok(c.from < c.to, `${b.id}/${c.id}: empty compartment`);
      assert.ok(c.from >= 0 && c.to <= 1, `${b.id}/${c.id}: outside 0..1`);
    }
    assert.ok(HULL_FORM[b.id], `${b.id}: no hull form`);
  }
});

test("the naming collision is recorded for both projects", () => {
  assert.equal(BOATS_BY_ID.typhoon.nato, "Typhoon");
  assert.match(BOATS_BY_ID.typhoon.project, /941/);
  assert.match(BOATS_BY_ID.typhoon.project, /Акула/);
  assert.equal(BOATS_BY_ID.akula.nato, "Akula");
  assert.match(BOATS_BY_ID.akula.project, /971/);
  assert.match(BOATS_BY_ID.akula.project, /Щука/);
});

test("the storyline is monotonic in t and every beat has a tier the palette knows", () => {
  assert.ok(STORYLINE.length >= 8);
  let prev = -1;
  for (const s of STORYLINE) {
    assert.ok(s.t >= 0 && s.t <= 1, `${s.title}: t out of range`);
    assert.ok(s.t > prev, `${s.title}: t must increase`);
    prev = s.t;
    assert.ok(TIERS[s.tier], `${s.title}: unknown tier ${s.tier}`);
    if (s.boat) assert.ok(BOATS_BY_ID[s.boat], `${s.title}: unknown boat ${s.boat}`);
  }
  assert.equal(STORYLINE[0].t, 0);
  assert.equal(STORYLINE[STORYLINE.length - 1].t, 1);
});

test("the fictional fit is labelled as fiction, not smuggled in as fact", () => {
  const ty = BOATS_BY_ID.typhoon;
  assert.ok(ty.fiction.length >= 1, "the caterpillar drive should be modelled");
  assert.ok(TIERS.fiction, "no fiction tier");
  // No attack boat carries a fictional fit; only the novel's boat does.
  for (const id of ["dallas", "akula"]) {
    assert.deepEqual(BOATS_BY_ID[id].fiction, [], `${id} must not carry fictional kit`);
  }
  const src = SOURCES.find((s) => s.id === "src-novel");
  assert.equal(src.tier, "fiction");
  // And the open question is recorded rather than quietly dropped.
  assert.ok(SOURCES.some((s) => /unverified/i.test(s.id)));
});

/* ======================================================================
   hull form
   ====================================================================== */

test("halfWidthAt closes at both ends, is full beam amidships, and tapers monotonically", () => {
  for (const [id, form] of Object.entries(HULL_FORM)) {
    assert.ok(Math.abs(halfWidthAt(0, form)) < 1e-12, `${id}: hull must close at the stern`);
    assert.ok(Math.abs(halfWidthAt(1, form)) < 1e-12, `${id}: hull must close at the bow`);
    const mid = (form.aft + form.fwd) / 2;
    assert.ok(Math.abs(halfWidthAt(mid, form) - 1) < 1e-12, `${id}: parallel body must be full beam`);

    // Continuity across both breakpoints.
    for (const u of [form.aft, form.fwd]) {
      const e = 1e-6;
      const a = halfWidthAt(u - e, form);
      const b = halfWidthAt(u + e, form);
      assert.ok(Math.abs(a - b) < 1e-3, `${id}: discontinuity at u=${u} (${a} vs ${b})`);
    }

    // Monotonic non-increasing walking aft from the parallel body to the stern.
    let prev = 1;
    for (let i = 0; i <= 40; i++) {
      const u = form.aft * (1 - i / 40);
      const w = halfWidthAt(u, form);
      assert.ok(w <= prev + 1e-9, `${id}: hull widens going aft at u=${u}`);
      prev = w;
    }
    // ... and monotonic non-increasing walking forward to the bow.
    prev = 1;
    for (let i = 0; i <= 40; i++) {
      const u = form.fwd + (1 - form.fwd) * (i / 40);
      const w = halfWidthAt(u, form);
      assert.ok(w <= prev + 1e-9, `${id}: hull widens going forward at u=${u}`);
      prev = w;
    }

    // The stern runs fine into the screw; the bow stays fuller.
    assert.ok(halfWidthAt(0.02, form) < 0.45, `${id}: stern should run fine, got ${halfWidthAt(0.02, form)}`);
    assert.ok(
      halfWidthAt(0.9, form) > halfWidthAt(0.02, form),
      `${id}: bow should be fuller than the stern`,
    );
  }
});

test("hullProfile spans the published LOA and never exceeds the published beam", () => {
  for (const b of BOATS) {
    const p = hullProfile(b, 49);
    assert.equal(p.length, 49);
    assert.ok(Math.abs(p[0].x) < 1e-9);
    assert.ok(Math.abs(p[p.length - 1].x - b.dim.loa) < 1e-6);
    for (const s of p) {
      assert.ok(s.half <= b.dim.beam / 2 + 1e-9, `${b.id}: half-width ${s.half} exceeds beam/2`);
      assert.ok(Number.isFinite(s.half));
    }
  }
});

test("hullSurface is a closed watertight grid with no NaN", () => {
  for (const b of BOATS) {
    const { positions, index, nStations, nRings } = hullSurface(b, 25, 16);
    assert.equal(positions.length, nStations * nRings * 3);
    assert.equal(index.length % 3, 0, "index must be triangles");
    for (const v of positions) assert.ok(Number.isFinite(v), "NaN in positions");
    for (const i of index) {
      assert.ok(i >= 0 && i < nStations * nRings, "index out of range");
    }
  }
});

test("the Project 941 really is two pressure hulls and the others are one", () => {
  assert.equal(pressureHulls(BOATS_BY_ID.typhoon).length, 2);
  assert.equal(pressureHulls(BOATS_BY_ID.dallas).length, 1);
  assert.equal(pressureHulls(BOATS_BY_ID.akula).length, 1);
  const [port, stbd] = pressureHulls(BOATS_BY_ID.typhoon);
  assert.ok(port.cx < 0 && stbd.cx > 0, "the two hulls must straddle the centreline");
  assert.ok(Math.abs(port.cx + stbd.cx) < 1e-9, "the pair must be symmetric");
});

/* ======================================================================
   silo grid
   ====================================================================== */

test("the 20 R-39 silos lay out in two files of ten, inside the silo deck", () => {
  const ty = BOATS_BY_ID.typhoon;
  const grid = siloGrid(ty);
  assert.equal(grid.length, 20);

  const rows = new Map();
  for (const s of grid) {
    if (!rows.has(s.row)) rows.set(s.row, []);
    rows.get(s.row).push(s);
  }
  assert.equal(rows.size, 2, "two files");
  for (const xs of rows.values()) assert.equal(xs.length, 10, "ten per file");

  const deck = compartments(ty).find((c) => c.id === "silo-deck");
  for (const s of grid) {
    assert.ok(s.x - s.r >= deck.x0 - 1e-9, `silo ${s.n} forward of the deck`);
    assert.ok(s.x + s.r <= deck.x1 + 1e-9, `silo ${s.n} aft of the deck`);
    // No overlap within a file.
    const same = rows.get(s.row).filter((o) => o !== s);
    for (const o of same) {
      assert.ok(Math.abs(o.x - s.x) >= ty.armament.siloDiameter - 1e-9, `silos ${s.n}/${o.n} overlap`);
    }
  }

  // Numbering is 1..20 with no gaps.
  assert.deepEqual(grid.map((s) => s.n).sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));
});

test("the attack boats carry no silos at all", () => {
  assert.deepEqual(siloGrid(BOATS_BY_ID.dallas), []);
  assert.deepEqual(siloGrid(BOATS_BY_ID.akula), []);
});

/* ======================================================================
   DK section
   ====================================================================== */

test("the section polygon closes on itself and carries the pressure hulls", () => {
  for (const b of BOATS) {
    for (const u of [0.25, 0.5, 0.75]) {
      const s = sectionAt(b, u);
      assert.ok(Math.abs(s.x - u * b.dim.loa) < 1e-9);
      assert.ok(s.outline.length >= 24, "section needs enough points to be a curve");
      for (const p of s.outline) {
        assert.ok(Number.isFinite(p.y) && Number.isFinite(p.z), "NaN in the section outline");
        assert.ok(Math.abs(p.z) <= s.half + 1e-9, "section sticks out of the hull");
      }
      assert.equal(s.pressure.length, b.dim.hullCount);
      assert.ok(s.compartments.length >= 1, `no compartment at u=${u} on ${b.id}`);
    }
  }
});

/* ======================================================================
   cross-checks
   ====================================================================== */

test("envelope volume lands within the published displacement band", () => {
  const expected = { typhoon: 48000, dallas: 6927, akula: 12770 };
  for (const b of BOATS) {
    const vol = envelopeVolume(b);
    const ratio = (vol * 1.025) / expected[b.id];
    assert.ok(ratio > 0.5 && ratio < 2.0, `${b.id}: ratio ${ratio.toFixed(2)} outside 0.5..2.0`);
    // And converges: doubling the station count must not move it much.
    const coarse = envelopeVolume(b, 31);
    assert.ok(Math.abs(coarse - vol) / vol < 0.02, `${b.id}: integration not converged (${coarse} vs ${vol})`);
  }
});

test("every check runs, and the ones that must hold do", () => {
  const all = allChecks();
  assert.ok(all.length >= 20, `expected a substantial check set, got ${all.length}`);
  for (const c of all) {
    assert.equal(typeof c.ok, "boolean", `${c.id}: ok must be a boolean`);
    assert.ok(c.label && c.actual && c.expected, `${c.id}: missing label/actual/expected`);
    assert.ok(TIERS[c.tier], `${c.id}: unknown tier ${c.tier}`);
    assert.ok(["closure", "band", "consistency", "contradiction"].includes(c.kind), `${c.id}: unknown kind`);
  }
  const failing = all.filter((c) => !c.ok);
  assert.deepEqual(failing.map((c) => `${c.id}: ${c.actual}`), [], "checks must pass");
});

test("a contradiction check still prints the spread it is refusing to hide", () => {
  const disp = checksForBoat(BOATS_BY_ID.typhoon).find((c) => c.id === "typhoon/displacement-band");
  assert.equal(disp.kind, "contradiction");
  assert.match(disp.actual, /ratio \d+\.\d+/);
  assert.match(disp.actual, /published/);
});

test("cross-boat checks need all three boats and fail on a partial fleet", () => {
  const full = crossBoatChecks(BOATS);
  assert.ok(full.length >= 3);
  assert.ok(full.every((c) => c.boat === null), "cross-boat checks belong to no one boat");

  const partial = crossBoatChecks([BOATS_BY_ID.dallas, BOATS_BY_ID.akula]);
  const naming = partial.find((c) => c.id === "fleet/naming-collision");
  assert.equal(naming.ok, false, "dropping the Typhoon must break the naming check");
  assert.equal(partial.filter((c) => c.id.startsWith("fleet/")).length, 1, "depth/beam checks need all three");
});

/* ======================================================================
   VRML export
   ====================================================================== */

test("the VRML export is structurally valid for every boat, cut and uncut", () => {
  for (const b of BOATS) {
    for (const cut of [true, false]) {
      const wrl = boatToVrml(b, { cut });
      assert.deepEqual(validateVrml(wrl), [], `${b.id} cut=${cut} produced an invalid .wrl`);
      assert.match(wrl, /^#VRML V2\.0 utf8/);
      assert.match(wrl, /DEF LAYER_/);
      assert.match(wrl, /IndexedFaceSet/);
      if (b.armament.missiles) assert.match(wrl, /_SILOS/);
    }
  }
});

test("the cut really removes faces rather than hiding them", () => {
  const b = BOATS_BY_ID.typhoon;
  const cut = boatToVrml(b, { cut: true });
  const whole = boatToVrml(b, { cut: false });
  const faces = (w) => (w.match(/-1/g) || []).length;
  const c = faces(cut);
  const n = faces(whole);
  assert.ok(c < n, `cut (${c}) should drop faces from the whole hull (${n})`);
  // Roughly a half, since the cut plane is the centreline.
  assert.ok(c / n > 0.3 && c / n < 0.7, `cut kept ${(c / n).toFixed(2)} of the hull`);
  // And the cap is only present when cut.
  assert.match(cut, /_SECTION/);
  assert.doesNotMatch(whole, /_SECTION/);
});

test("the export records the dimensions it was drawn from", () => {
  const b = BOATS_BY_ID.dallas;
  const wrl = boatToVrml(b);
  assert.match(wrl, /LOA 110\.0000 m/);
  assert.match(wrl, /beam 10\.0000 m/);
  assert.match(wrl, /hull Ø 7\.0000 m/);
});

/* ======================================================================
   the page and the viewer wiring
   ====================================================================== */

test("the page wires every control the viewer binds", () => {
  const html = readFileSync(new URL("../red-october-4dwm.html", import.meta.url), "utf8");
  assert.match(html, /css\/project-y-4dwm\.css/);
  assert.match(html, /css\/red-october-4dwm\.css/);
  assert.match(html, /<script type="module" src="\.\/js\/red-october-4dwm\.js"><\/script>/);

  for (const id of [
    "stage", "labels", "hullTable", "layerList", "checkList", "infoTitle", "infoBody",
    "jumpList", "cardList", "pipLayer", "wm4dDesk", "wm4dTray", "wm4dStatus",
    "statHull", "statChecks", "hudFps", "status",
    "btnLabels", "btnVrml", "btnReset", "btnPlay", "btnSpeed", "timeSlider", "timeReadout",
    "cutSlider", "cutVal",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }

  for (const b of ["typhoon", "dallas", "akula"]) {
    assert.ok(html.includes(`data-boat="${b}"`), `missing boat switch for ${b}`);
  }
  for (const m of ["relief", "section", "xray", "wire", "ghost"]) {
    assert.ok(html.includes(`data-mode="${m}"`), `missing view mode ${m}`);
  }
});

test("the viewer uses the pure modules rather than re-deriving geometry", () => {
  const app = readFileSync(new URL("../js/red-october-4dwm.js", import.meta.url), "utf8");
  for (const sym of ["hullSurface", "siloGrid", "pressureHulls", "compartments", "sectionAt"]) {
    assert.ok(app.includes(sym), `viewer does not use ${sym} from red-october-geo.js`);
  }
  assert.match(app, /from "\.\/red-october-geo\.js"/);
  assert.match(app, /from "\.\/red-october-checks\.js"/);
  assert.match(app, /from "\.\/red-october-vrml\.js"/);
  assert.match(app, /initPipWm/, "must reuse the shared 4Dwm window manager");
  // One unit = one metre: the camera moves to the boat, the boat is never scaled.
  assert.match(app, /one unit = one\n\s+metre|m/, "the metre convention should be stated");
  assert.doesNotMatch(app, /boatGroup\.scale/, "scaling the boat would break the metre convention");
  // The section is a real clip plane, not a texture trick.
  assert.match(app, /localClippingEnabled = true/);
  assert.match(app, /new THREE\.Plane/);
});
