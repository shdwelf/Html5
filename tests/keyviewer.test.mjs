// KeyViewer (Mathspace): the compendium in js/mathspace.js is verified,
// not trusted — every identity is evaluated at sample angles, every
// geometry formula recomputes its worked sample, the triangle solver is
// checked on known triangles (including the SSA ambiguous case), and
// complex arithmetic is checked against hand-computed values. The Webxdc
// bundle check mirrors tests/country-viewer.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { unzipSync } from "../vendor/fflate/index.mjs";
import {
  SPECIAL_ANGLES, TRIG_IDENTITIES, GEOMETRY_FORMULAS, PLATONIC_SOLIDS,
  solveTriangle, C, iPow, sind, cosd, tand, normDeg,
} from "../js/mathspace.js";

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

test("special-angle table is internally consistent", () => {
  assert.equal(SPECIAL_ANGLES.length, 16);
  for (const r of SPECIAL_ANGLES) {
    assert.ok(near(sind(r.deg) ** 2 + cosd(r.deg) ** 2, 1, 1e-12), `${r.deg}°: sin²+cos²=1`);
    if (r.tan !== "undefined") assert.ok(near(tand(r.deg), sind(r.deg) / cosd(r.deg)), `${r.deg}°: tan=sin/cos`);
  }
  // Anchor values, known exactly:
  assert.ok(near(sind(30), 0.5, 1e-12));
  assert.ok(near(cosd(60), 0.5, 1e-12));
  assert.ok(near(sind(45), Math.SQRT1_2, 1e-12));
  assert.ok(near(tand(45), 1, 1e-12));
  assert.equal(normDeg(-90), 270);
  assert.equal(normDeg(450), 90);
});

test("every compendium identity holds numerically", () => {
  assert.ok(TRIG_IDENTITIES.length >= 35, `compendium should be comprehensive, got ${TRIG_IDENTITIES.length}`);
  for (const e of TRIG_IDENTITIES) {
    for (const [a, b] of [[0.3, 0.5], [1.0, 0.2], [2.1, 1.3]]) {
      const d = Math.abs(e.lhs(a, b) - e.rhs(a, b));
      assert.ok(d < 1e-9, `${e.name}: |lhs−rhs|=${d} at (${a}, ${b})`);
    }
  }
  const families = new Set(TRIG_IDENTITIES.map((e) => e.family));
  for (const f of ["Pythagorean", "Angle sum", "Multiple angle", "Half-angle & power", "Product & sum"]) {
    assert.ok(families.has(f), `missing identity family ${f}`);
  }
});

test("every geometry formula reproduces its worked sample", () => {
  assert.ok(GEOMETRY_FORMULAS.length >= 45, `compendium should be comprehensive, got ${GEOMETRY_FORMULAS.length}`);
  for (const f of GEOMETRY_FORMULAS) {
    const got = f.compute(f.sample);
    assert.ok(Number.isFinite(got), `${f.name}: non-finite result`);
    assert.ok(near(got, f.expect), `${f.name}: got ${got}, expected ${f.expect}`);
  }
  // Hand-checkable anchors:
  const byName = Object.fromEntries(GEOMETRY_FORMULAS.map((f) => [f.name, f]));
  assert.equal(byName["Triangle area (Heron)"].compute({ a: 13, b: 14, c: 15 }), 84); // classic Heronian
  assert.ok(near(byName["Pythagoras (hypotenuse)"].compute({ a: 5, b: 12 }), 13, 1e-12));
  assert.ok(near(byName["Sphere volume"].compute({ r: 1 }), (4 / 3) * Math.PI, 1e-12));
});

test("Platonic solids satisfy Euler's formula", () => {
  assert.equal(PLATONIC_SOLIDS.length, 5);
  for (const p of PLATONIC_SOLIDS) assert.equal(p.vertices - p.edges + p.faces, 2, p.name);
});

test("triangle solver: SSS / SAS / ASA known triangles", () => {
  const [t] = solveTriangle({ a: 3, b: 4, c: 5 });
  assert.ok(near(t.A, 36.86989764584402), `A=${t.A}`);
  assert.ok(near(t.B, 53.13010235415598), `B=${t.B}`);
  assert.ok(near(t.C, 90), `C=${t.C}`);
  assert.equal(t.area, 6);
  assert.equal(t.R, 2.5);
  assert.equal(t.r, 1);

  const [sas] = solveTriangle({ a: 5, C: 60, b: 6 });
  assert.ok(near(sas.c, Math.sqrt(25 + 36 - 2 * 5 * 6 * 0.5)), "SAS closes by law of cosines");
  assert.ok(near(sas.A + sas.B + sas.C, 180));

  const [asa] = solveTriangle({ A: 45, B: 60, a: 10 });
  assert.ok(near(asa.C, 75));
  assert.ok(near(asa.b / Math.sin((60 * Math.PI) / 180), asa.a / Math.sin((45 * Math.PI) / 180)), "ASA obeys law of sines");

  assert.deepEqual(solveTriangle({ a: 1, b: 2, c: 9 }), [], "impossible triangle yields no solutions, not a fake one");
});

test("triangle solver: SSA ambiguous case is honest (0, 1, 2 solutions)", () => {
  assert.equal(solveTriangle({ a: 8, b: 10, A: 30 }).length, 2, "two valid triangles");
  assert.equal(solveTriangle({ a: 5, b: 10, A: 30 }).length, 1, "right-triangle boundary");
  assert.equal(solveTriangle({ a: 4, b: 10, A: 30 }).length, 0, "side too short to reach");
  for (const s of solveTriangle({ a: 8, b: 10, A: 30 })) {
    assert.ok(near(s.A + s.B + s.C, 180));
    assert.ok(near(s.a / Math.sin((s.A * Math.PI) / 180), s.b / Math.sin((s.B * Math.PI) / 180)));
  }
});

test("complex arithmetic against hand-computed values", () => {
  assert.deepEqual(C.mul({ re: 1, im: 2 }, { re: 3, im: -4 }), { re: 11, im: 2 });
  const q = C.div({ re: 1, im: 2 }, { re: 3, im: -4 });
  assert.ok(near(q.re, -0.2) && near(q.im, 0.4), `div=${C.format(q)}`);
  assert.deepEqual(C.conj({ re: 3, im: -2 }), { re: 3, im: 2 });
  assert.ok(near(C.abs({ re: 3, im: 4 }), 5, 1e-12));
  assert.ok(near(C.argDeg({ re: 0, im: -1 }), 270), "arg is reported in [0°, 360°)");
  assert.equal(C.format({ re: 0, im: 1 }), "i");
  assert.equal(C.format({ re: 0, im: -1 }), "-i");
  assert.equal(C.format({ re: 3, im: -2 }), "3 − 2i");
  assert.throws(() => C.div({ re: 1, im: 1 }, { re: 0, im: 0 }), /division by 0/);
});

test("De Moivre, roots of unity, Euler, and the i-power cycle", () => {
  const cubed = C.pow(C.fromPolar(1, 30), 3); // (cos30° + i sin30°)³ = cos90° + i sin90°
  assert.ok(near(cubed.re, 0, 1e-12) && near(cubed.im, 1, 1e-12), C.format(cubed));
  const roots = C.roots({ re: 8, im: 0 }, 3);
  assert.equal(roots.length, 3);
  assert.ok(near(roots[0].re, 2, 1e-12) && near(roots[0].im, 0, 1e-12));
  assert.ok(near(roots[1].re, -1) && near(roots[1].im, Math.sqrt(3)), C.format(roots[1]));
  for (const r of roots) { // each root really cubes back to 8
    const back = C.pow(r, 3);
    assert.ok(near(back.re, 8) && near(back.im, 0, 1e-9), C.format(r));
  }
  const u = C.roots({ re: 1, im: 0 }, 5); // 5th roots of unity sum to 0
  assert.ok(near(u.reduce((s, r) => s + r.re, 0), 0) && near(u.reduce((s, r) => s + r.im, 0), 0));
  const e = C.euler(90); // e^{iπ/2} = i
  assert.ok(near(e.re, 0, 1e-12) && near(e.im, 1, 1e-12));
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(iPow).map(C.format), ["1", "i", "-1", "-i", "1", "i"]);
});

test("keyviewer page wires every control the app binds", () => {
  const html = readFileSync(new URL("../keyviewer.html", import.meta.url), "utf8");
  assert.match(html, /js\/keyviewer\.js/, "page must load the viewer module");
  assert.match(html, /KEYVIEWER/, "page must name the app");
  for (const id of ["circleCanvas", "angleDeg", "angleSlider", "circleReadout", "specialTable",
    "in_a", "in_b", "in_c", "in_A", "in_B", "in_C", "solveBtn", "solve345", "solverOut",
    "compSearch", "identityCards", "formulaCards", "platonicTable",
    "complexCanvas", "zRe", "zIm", "wRe", "wIm", "cN", "complexReadout"]) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }
  const app = readFileSync(new URL("../js/keyviewer.js", import.meta.url), "utf8");
  for (const sym of ["solveTriangle", "TRIG_IDENTITIES", "GEOMETRY_FORMULAS", "PLATONIC_SOLIDS", "C.roots", "iPow"]) {
    assert.ok(app.includes(sym), `viewer does not use ${sym}`);
  }
});

test("keyviewer Webxdc bundle carries the offline app", () => {
  assert.ok(existsSync("keyviewer.xdc"), "keyviewer.xdc must be built (npm run build:keyviewer)");
  const entries = unzipSync(new Uint8Array(readFileSync("keyviewer.xdc")));
  assert.deepEqual(Object.keys(entries).sort(),
    ["index.html", "js/keyviewer.js", "js/mathspace.js", "manifest.toml", "webxdc.js"]);
  const manifest = new TextDecoder().decode(entries["manifest.toml"]);
  assert.match(manifest, /KeyViewer - Mathspace/, "manifest must name the app");
  const index = new TextDecoder().decode(entries["index.html"]);
  assert.match(index, /KEYVIEWER · MATHSPACE/, "bundle index must be the keyviewer page");
  // The bundle is the current build, not a stale copy.
  assert.equal(new TextDecoder().decode(entries["js/mathspace.js"]),
    readFileSync(new URL("../js/mathspace.js", import.meta.url), "utf8"));
});
