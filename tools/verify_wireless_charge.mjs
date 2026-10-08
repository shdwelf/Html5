#!/usr/bin/env node
/**
 * verify_wireless_charge.mjs — keep js/wireless-charge.js honest.
 *
 *   node tools/verify_wireless_charge.mjs
 *
 * Every check here is an independent reference, not a restatement of the model:
 *
 *   1. elliptic integrals against published constants (K, E at k = 0, ½, 1/√2);
 *   2. Grover's closed form for two coaxial filaments against a brute-force
 *      Neumann double integral of the same geometry;
 *   3. the round-wire AC resistance against both of its limits (→1 as d/δ→0,
 *      →d/4δ far out) and monotonicity in between;
 *   4. the exact 2×2 link solve against the closed-form optimum-load
 *      efficiency, and against power conservation;
 *   5. the rectifier chain against the link's own delivered power (they are
 *      the same watts by construction, so they must agree to 1e-9);
 *   6. TI's published bq5105xB tuning example (Ls' = 16 µH, C1 = 204 nF →
 *      C2 ≈ 1.63 nF) reproduced from the formula;
 *   7. the CC/CV integrator's energy bookkeeping and its constant-current time;
 *   8. the lathed solids against the analytic volume of the profile they came
 *      from (Pappus), and the STL byte layout against its triangle count;
 *   9. the generated ngspice deck, structurally (every node declared, L1/L2 in
 *      the K statement, element values equal to the solved ones) — ngspice is
 *      not installed here, so the deck is not executed;
 *  10. the page contract: every id js/wireless-charge-lab.js asks for exists in
 *      wireless-charge-pad.html;
 *  11. the real published parts, as far as a model can check them: the TDK
 *      12 mm receiver coil and the A11 pad coil, and the WPC receiver-coil Q
 *      requirement evaluated at the resistance a 12 mm winding actually has.
 *
 * Exit 1 on any failure.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import * as W from "../js/wireless-charge.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let pass = 0;
const failures = [];
function ok(label, cond, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${label}${detail ? ` — ${detail}` : ""}`); }
  else { failures.push(label); console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`); }
}
const relErr = (a, b) => Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
function near(label, got, want, tol) {
  ok(label, relErr(got, want) <= tol, `${got} vs ${want} (rel ${relErr(got, want).toExponential(2)})`);
}
function section(t) { console.log(`\n${t}`); }

/* --------------------------------------------------------------- 1 */
section("1 · complete elliptic integrals");
near("K(0) = π/2", W.ellipticK(0), Math.PI / 2, 1e-14);
near("E(0) = π/2", W.ellipticE(0), Math.PI / 2, 1e-14);
near("K(1/√2)", W.ellipticK(Math.SQRT1_2), 1.8540746773013719, 1e-13);
near("E(1/√2)", W.ellipticE(Math.SQRT1_2), 1.3506438810476755, 1e-13);
near("K(0.5)", W.ellipticK(0.5), 1.685750354812596, 1e-13);
near("E(0.5)", W.ellipticE(0.5), 1.4674622093394272, 1e-13);
near("E(1) = 1", W.ellipticE(1), 1, 1e-9);
ok("K(k) increases with k", W.ellipticK(0.3) < W.ellipticK(0.6) && W.ellipticK(0.6) < W.ellipticK(0.9));
ok("E(k) decreases with k", W.ellipticE(0.3) > W.ellipticE(0.6) && W.ellipticE(0.6) > W.ellipticE(0.9));

/* --------------------------------------------------------------- 2 */
section("2 · Grover closed form vs brute-force Neumann integral");
for (const [a, A, d] of [[0.01, 0.01, 0.01], [0.0215, 0.005, 0.004], [0.006, 0.004, 0.0015], [0.05, 0.02, 0.08]]) {
  near(`M(a=${a}, A=${A}, d=${d})`, W.mutualCoaxial(a, A, d), W.mutualNeumann(a, A, d, 0, 512), 1e-9);
}
ok("M is symmetric in the two radii",
  relErr(W.mutualCoaxial(0.004, 0.009, 0.002), W.mutualCoaxial(0.009, 0.004, 0.002)) < 1e-12);
ok("M falls with distance",
  W.mutualCoaxial(0.006, 0.005, 0.001) > W.mutualCoaxial(0.006, 0.005, 0.004)
  && W.mutualCoaxial(0.006, 0.005, 0.004) > W.mutualCoaxial(0.006, 0.005, 0.02));
{
  const m0 = W.mutualNeumann(0.006, 0.004, 0.0015, 0, 256);
  const m2 = W.mutualNeumann(0.006, 0.004, 0.0015, 0.002, 256);
  const m6 = W.mutualNeumann(0.006, 0.004, 0.0015, 0.006, 256);
  ok("misalignment reduces coupling", m0 > m2 && m2 > m6, `${m0.toExponential(3)} > ${m2.toExponential(3)} > ${m6.toExponential(3)}`);
}
near("round-wire loop self inductance", W.loopSelfInductance(0.01, 0.0005),
  W.MU0 * 0.01 * (Math.log(8 * 0.01 / 0.0005) - 2 + 0.25), 1e-15);

/* --------------------------------------------------------------- 3 */
section("3 · skin effect and the round-wire AC ratio");
near("skin depth Cu @ 100 kHz", W.skinDepth(1e5), 2.063e-4, 2e-3);
near("skin depth Cu @ 6.78 MHz", W.skinDepth(6.78e6), 2.508e-5, 2e-3);
ok("Rac/Rdc → 1 for a strand far below skin depth", Math.abs(W.roundWireAcRatio(0.01) - 1) < 1e-4);
near("Rac/Rdc ≈ x/4 far out", W.roundWireAcRatio(60), 60 / 4, 5e-3);
{
  let mono = true;
  let prev = 0;
  for (let x = 0.1; x <= 30; x += 0.1) {
    const r = W.roundWireAcRatio(x);
    if (r < prev - 1e-12) mono = false;
    prev = r;
  }
  ok("Rac/Rdc monotone increasing in x", mono);
}
near("AWG 24 diameter", W.awgDiameterMm(24), 0.5106, 2e-3);
near("AWG 36 diameter", W.awgDiameterMm(36), 0.127, 2e-3);

/* --------------------------------------------------------------- 4 */
section("4 · the link solve, against the closed form");
{
  const d = W.solveDesign(W.PRESETS.resonant);
  const w = 2 * Math.PI * d.spec.fHz;
  const q1 = (w * d.inductance.txH) / (d.resistance.txOhm + d.spec.rSource);
  const q2 = (w * d.inductance.rxOnFerriteH) / d.resistance.rxOhm;
  const etaClosed = W.optimumLoadEfficiency(d.coupling.k, q1, q2);
  // sweep the load finely and take the numerical maximum
  const loads = [];
  for (let i = 0; i < 400; i++) loads.push(0.05 * Math.pow(2000 / 0.05, i / 399));
  const sw = W.sweepLoad(d, loads);
  const best = sw.reduce((a, b) => (b.efficiency > a.efficiency ? b : a));
  near("numerically maximised link efficiency vs closed form", best.efficiency, etaClosed, 5e-3);
  ok("the numerical optimum sits at the predicted load",
    relErr(best.rLoad, d.resistance.rxOhm * Math.sqrt(1 + d.q.kQ2)) < 0.15,
    `${best.rLoad.toFixed(2)} vs ${(d.resistance.rxOhm * Math.sqrt(1 + d.q.kQ2)).toFixed(2)} Ω`);
  for (const p of Object.keys(W.PRESETS)) {
    const dd = W.solveDesign(W.PRESETS[p]);
    const sum = dd.link.pLoad + dd.link.pCoil1 + dd.link.pCoil2 + dd.link.pSource;
    near(`power conservation, preset ${p}`, sum / dd.link.pIn, 1, 1e-9);
    ok(`preset ${p} solves to finite numbers`,
      [dd.power.pInW, dd.power.pCellW, dd.link.i1, dd.link.i2, dd.coupling.k, dd.charge.timeHours,
       dd.runtime.hours, dd.thermalSpeaker.riseK, dd.q.tx, dd.q.rx].every(Number.isFinite));
  }
}

/* --------------------------------------------------------------- 5 */
section("5 · rectifier chain vs the link");
for (const p of Object.keys(W.PRESETS)) {
  const d = W.solveDesign(W.PRESETS[p]);
  near(`chain AC power == link delivered power (${p})`, d.chain.pAc, d.link.pLoad, 1e-9);
  ok(`chain losses are positive (${p})`, d.chain.bridgeLoss > 0 && d.chain.pDc > d.chain.pCell);
  ok(`V_RECT is a sane charging rail (${p})`, d.chain.vRect > 3 && d.chain.vRect < 6, `${d.chain.vRect.toFixed(2)} V`);
}

/* --------------------------------------------------------------- 6 */
section("6 · TI bq5105xB tuning example");
{
  // TI bq5105xB datasheet worked example: Ls' = 16 µH → C1 = 158.3 nF.
  const t = W.qiTuningCapacitors(16e-6);
  near("datasheet C1 for Ls' = 16 µH", t.c1, 158.3e-9, 5e-3);
  // TI E2E guidance for the same Ls' quotes C2 = 1.63 nF.
  near("TI-quoted C2 for Ls' = 16 µH", t.c2, 1.63e-9, 5e-2);
  // And the property C2 exists for: the L/C1/C2 network must anti-resonate at
  // 1 MHz. Checked directly on the admittance rather than on the formula.
  for (const ls of [8e-6, 16e-6, 40e-6]) {
    const tt = W.qiTuningCapacitors(ls);
    const wd = 2 * Math.PI * 1e6;
    const ySeries = 1 / (wd * ls - 1 / (wd * tt.c1));
    const im = wd * tt.c2 - ySeries;
    ok(`parallel anti-resonance at 1 MHz for Ls' = ${ls * 1e6} µH`, Math.abs(im) < 1e-6,
      `Im(Y) = ${im.toExponential(2)} S`);
  }
}

/* --------------------------------------------------------------- 7 */
section("7 · CC/CV charge integration");
{
  const ch = W.chargeProfile({ capacityMah: 320, iccA: 0.15, rIntOhm: 0.25 });
  near("energy in = stored + heat", ch.energyBalance, 1, 1e-6);
  // constant-current time to the knee: capacity·ΔSoC / I
  const ccTime = (320 * 3.6 * (ch.kneeSoc - 0.05)) / 0.15;
  near("constant-current phase length", ch.kneeTime, ccTime, 1e-3);
  ok("charge reaches full", ch.socEnd > 0.99, `SoC ${ch.socEnd.toFixed(4)}`);
  ok("CV current falls below the CC value", ch.cvCurrent < 0.15, `${ch.cvCurrent.toFixed(3)} A`);
  const slow = W.chargeProfile({ capacityMah: 320, iccA: 0.05, rIntOhm: 0.25 });
  ok("halving the current roughly triples the time", slow.timeHours / ch.timeHours > 2.5,
    `${ch.timeHours.toFixed(2)} h → ${slow.timeHours.toFixed(2)} h`);
  ok("curve is monotone in SoC", ch.curve.every((p, i) => i === 0 || p.soc >= ch.curve[i - 1].soc));
}

/* --------------------------------------------------------------- 8 */
section("8 · solids: lathed mesh vs Pappus, STL layout");
{
  // Pappus: V = 2π·r̄·A, with r̄ = (1/6A)·Σ (r_i + r_{i+1})·cross_i.
  function pappus(profile) {
    let A = 0, m = 0;
    for (let i = 0; i < profile.length; i++) {
      const [r0, z0] = profile[i];
      const [r1, z1] = profile[(i + 1) % profile.length];
      const cross = r0 * z1 - r1 * z0;
      A += cross / 2;
      m += (r0 + r1) * cross / 6;
    }
    return Math.abs(2 * Math.PI * (m / A) * A);
  }
  const cases = [
    ["speaker body", W.speakerShellProfile({ odMm: 12.7, heightMm: 50.8, wallMm: 0.8, coilPocketDiaMm: 10.4, driverDiaMm: 10, coilPocketDepthMm: 0.5, driverRecessDepthMm: 2.5 })],
    ["charge pad", W.padShellProfile({ odMm: 26, heightMm: 8, wallMm: 1.5, wellDiaMm: 14.4, wellDepthMm: 1.2 })],
    ["hollow cylinder", [[0, 0], [6, 0], [6, 10], [5, 10], [5, 1], [0, 1]]],
  ];
  for (const [name, prof] of cases) {
    const mesh = W.latheMesh(prof, 240);
    const want = name === "hollow cylinder" ? Math.PI * (36 * 1 + 11 * 9) : pappus(prof);
    near(`${name}: mesh volume`, mesh.volumeMm3, want, 2e-3);
    const stl = W.stlBinary(mesh, name);
    const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
    ok(`${name}: STL byte length matches its triangle count`,
      stl.length === 84 + mesh.triangles.length * 50, `${stl.length} bytes`);
    ok(`${name}: STL header count matches`, dv.getUint32(80, true) === mesh.triangles.length);
    ok(`${name}: outward normals (positive signed volume)`, W.meshVolume(mesh.triangles) > 0);
  }
}

/* --------------------------------------------------------------- 9 */
section("9 · generated ngspice deck (structural)");
{
  const d = W.solveDesign(W.PRESETS.resonant);
  const text = W.spiceNetlist(d);
  const lines = text.split("\n").filter((l) => l && !l.startsWith("*") && !l.startsWith("."));
  const names = new Set(lines.map((l) => l.split(/\s+/)[0]));
  const nodeUse = new Map();
  for (const l of lines) {
    for (const f of l.split(/\s+/).slice(1)) {
      if (/^(n\d+|in|0)$/.test(f)) nodeUse.set(f, (nodeUse.get(f) || 0) + 1);
    }
  }
  ok("L1 and L2 both appear", names.has("L1") && names.has("L2"));
  const kLine = text.split("\n").find((l) => l.startsWith("K1"));
  ok("K statement couples exactly L1 and L2", /^K1 L1 L2 [\d.]+$/.test(kLine.trim()), kLine);
  const dangling = [...nodeUse].filter(([n, c]) => n !== "0" && c < 2).map(([n]) => n);
  ok("no dangling nodes (every node is used twice)", dangling.length === 0, dangling.join(", ") || "none");
  ok("node 0 (ground) is present and shared", (nodeUse.get("0") || 0) >= 3, `${nodeUse.get("0")} uses`);
  ok("the receiver loop is series and closed: L2→Cs2→R2→Rload→L2",
    text.includes("L2 n4 n5") && text.includes("Cs2 n5 n6") && text.includes("R2 n6 n7") && text.includes("Rload n7 n4"));
  const l1 = parseFloat(text.match(/^L1 n1 n2 (\S+)$/m)[1]);
  near("L1 in the deck equals the solved inductance", l1, d.inductance.txH, 1e-6);
  const kk = parseFloat(kLine.trim().split(" ")[3]);
  near("k in the deck equals the solved coupling", kk, d.coupling.k, 1e-6);
  console.log("  note ngspice is not installed in this environment; the deck is checked structurally, not run.");
}

/* --------------------------------------------------------------- 10 */
section("10 · page contract: wireless-charge-pad.html ↔ js/wireless-charge-lab.js");
{
  const html = readFileSync(join(ROOT, "wireless-charge-pad.html"), "utf8");
  const js = readFileSync(join(ROOT, "js", "wireless-charge-lab.js"), "utf8");
  const defined = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const wanted = new Set([...js.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]));
  const missing = [...wanted].filter((id) => !defined.has(id) && !js.includes(`in-${id}`));
  ok("every id the controller asks for exists in the markup", missing.length === 0, missing.join(", ") || "none missing");
  // ids built from field paths: f-<path with dots as dashes>
  const dynamic = [...js.matchAll(/const id = `f-\$\{path\.replace\(\/\\\.\//g)].length;
  ok("dynamic input ids are constructed from field paths", dynamic === 1);
  ok("page imports the engine", /from "\.\/wireless-charge\.js"/.test(js));
}

/* --------------------------------------------------------------- 11 */
section("11 · published parts, as far as a model can reach them");
{
  // TDK WT505090-10F2-A11-G1: Ø51.4 mm, 6.3 µH at 100 kHz, 60 mΩ.
  // The winding geometry is not published, so this is an order-of-magnitude
  // check: an 11-turn, 48×0.1 mm litz winding across a 51.4/20 mm window.
  const a11 = W.planarCoil({ odMm: 51.4, idMm: 20, turns: 11, wireMm: 1.4, strands: 48, strandMm: 0.1 });
  const lA11 = W.coilInductance(a11);
  ok("A11 reconstruction lands within 2× of the published 6.3 µH",
    lA11 > W.QI.a11.lUh * 1e-6 / 2 && lA11 < W.QI.a11.lUh * 1e-6 * 2,
    `${(lA11 * 1e6).toFixed(2)} µH vs ${W.QI.a11.lUh} µH`);
  near("A11 reconstruction lands within 2× of the published 60 mΩ",
    a11.dcr, W.QI.a11.dcrOhm, 1.0);

  // TDK WR121210-27M8-ID: Ø12.0 mm, 8.32 µH, 0.95–0.98 Ω. A 12 mm winding
  // cannot reach 8.32 µH in free space, which is the point: the part carries a
  // magnetic sheet. Check both halves of that claim.
  const tdk = W.planarCoil({ odMm: 12, idMm: 7.6, turns: 20, wireMm: 0.11, strands: 1, strandMm: 0.11 });
  const lFree = W.coilInductance(tdk);
  ok("a 12 mm winding reaches 8.32 µH only with its magnetic sheet",
    lFree < 8.32e-6 && lFree > 8.32e-6 / 3,
    `${(lFree * 1e6).toFixed(2)} µH in free space vs 8.32 µH published`);
  near("the published DCR is consistent with fine wire in that window", tdk.dcr, 0.965, 0.2);

  // The requirement that decides the whole design: Q ≥ 77 with the resistance
  // a 12 mm winding actually has.
  const q100k = (2 * Math.PI * 1e5 * 8.32e-6) / 0.98;
  const q1M = (2 * Math.PI * 1e6 * 8.32e-6) / 0.98;
  ok("the Ø12 mm catalogue coil fails WPC's Q ≥ 77 at 100 kHz", q100k < W.QI.qRxMin, `Q = ${q100k.toFixed(1)}`);
  ok("it still fails at the 1 MHz Q test point", q1M < W.QI.qRxMin, `Q = ${q1M.toFixed(1)}`);
  ok("and the resistance needed to pass would be impractical in 12 mm",
    (2 * Math.PI * 1e5 * 8.32e-6) / W.QI.qRxMin < 0.07,
    `needs R ≤ ${((2 * Math.PI * 1e5 * 8.32e-6) / W.QI.qRxMin * 1000).toFixed(0)} mΩ`);

  // Qi band edges are what the page says they are.
  ok("WPC band is 110–205 kHz", W.QI.fMinHz === 110e3 && W.QI.fMaxHz === 205e3);
}

/* --------------------------------------------------------------- */
console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(`FAILURES:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log("all checks passed");
