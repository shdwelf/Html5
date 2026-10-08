/**
 * wireless-charge.test.mjs — the Charge Pad Lab, engine and page.
 *
 *   npm test                                  (runs this with node --test)
 *   node --test tests/wireless-charge.test.mjs
 *
 * The heavier cross-validation (published constants, TI's tuning example, the
 * real TDK parts, the netlist and page contracts) lives in
 * `tools/verify_wireless_charge.mjs`; this file is the part that gates
 * `npm test`, and it also boots the real page in jsdom so the DOM contract is
 * exercised, not just asserted.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as W from "../js/wireless-charge.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("elliptic integrals match published constants", () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12 * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
  near(W.ellipticK(0), Math.PI / 2);
  near(W.ellipticE(0), Math.PI / 2);
  near(W.ellipticK(Math.SQRT1_2), 1.8540746773013719);
  near(W.ellipticE(Math.SQRT1_2), 1.3506438810476755);
  near(W.ellipticK(0.5), 1.685750354812596);
  near(W.ellipticE(0.5), 1.4674622093394272);
  assert.equal(W.ellipticE(1), 1);
  assert.equal(W.ellipticK(1), Infinity);   // K diverges as k → 1
});

test("Grover's closed form equals a brute-force Neumann integral", () => {
  for (const [a, A, d] of [[0.01, 0.01, 0.01], [0.0215, 0.005, 0.004], [0.006, 0.004, 0.0015]]) {
    const g = W.mutualCoaxial(a, A, d);
    const n = W.mutualNeumann(a, A, d, 0, 512);
    assert.ok(Math.abs(g - n) / n < 1e-9, `${g} vs ${n}`);
  }
});

test("misalignment reduces coupling, monotonically", () => {
  const k = (off) => W.mutualNeumann(0.006, 0.004, 0.0015, off, 256);
  assert.ok(k(0) > k(0.002) && k(0.002) > k(0.006));
});

test("AC resistance ratio behaves at both limits and is monotone between", () => {
  assert.ok(Math.abs(W.roundWireAcRatio(0.01) - 1) < 1e-4);
  assert.ok(Math.abs(W.roundWireAcRatio(60) - 15) / 15 < 5e-3);
  let prev = 0;
  for (let x = 0.1; x <= 30; x += 0.1) {
    const r = W.roundWireAcRatio(x);
    assert.ok(r >= prev - 1e-12, `not monotone at x=${x}`);
    prev = r;
  }
});

test("the exact link solve reaches the closed-form optimum efficiency", () => {
  const d = W.solveDesign(W.PRESETS.resonant);
  const w = 2 * Math.PI * d.spec.fHz;
  const q1 = (w * d.inductance.txH) / (d.resistance.txOhm + d.spec.rSource);
  const q2 = (w * d.inductance.rxOnFerriteH) / d.resistance.rxOhm;
  const closed = W.optimumLoadEfficiency(d.coupling.k, q1, q2);
  const loads = Array.from({ length: 400 }, (_, i) => 0.05 * Math.pow(4e4, i / 399));
  const best = W.sweepLoad(d, loads).reduce((a, b) => (b.efficiency > a.efficiency ? b : a));
  assert.ok(Math.abs(best.efficiency - closed) / closed < 5e-3,
    `numerical ${best.efficiency} vs closed form ${closed}`);
  assert.ok(Math.abs(best.rLoad - d.resistance.rxOhm * Math.sqrt(1 + d.q.kQ2))
    / (d.resistance.rxOhm * Math.sqrt(1 + d.q.kQ2)) < 0.15);
});

test("every preset conserves power and reconciles link with rectifier", () => {
  for (const key of Object.keys(W.PRESETS)) {
    const d = W.solveDesign(W.PRESETS[key]);
    const sum = d.link.pLoad + d.link.pCoil1 + d.link.pCoil2 + d.link.pSource;
    assert.ok(Math.abs(sum / d.link.pIn - 1) < 1e-9, `${key}: ${sum / d.link.pIn}`);
    assert.ok(Math.abs(d.chain.pAc - d.link.pLoad) / d.link.pLoad < 1e-9,
      `${key}: chain ${d.chain.pAc} vs link ${d.link.pLoad}`);
    assert.ok(d.chain.vRect > 3 && d.chain.vRect < 6, `${key}: V_RECT ${d.chain.vRect}`);
    assert.ok(d.power.endToEnd > 0 && d.power.endToEnd <= d.power.linkEfficiency + 1e-12);
    for (const v of [d.power.pInW, d.power.pCellW, d.link.i1, d.link.i2, d.coupling.k,
                     d.charge.timeHours, d.runtime.hours, d.thermalSpeaker.riseK, d.q.tx, d.q.rx]) {
      assert.ok(Number.isFinite(v), `${key}: non-finite result`);
    }
  }
});

test("CC/CV charge bookkeeps energy and its constant-current phase", () => {
  const ch = W.chargeProfile({ capacityMah: 320, iccA: 0.15, rIntOhm: 0.25 });
  assert.ok(Math.abs(ch.energyBalance - 1) < 1e-6, `balance ${ch.energyBalance}`);
  const ccTime = (320 * 3.6 * (ch.kneeSoc - 0.05)) / 0.15;
  assert.ok(Math.abs(ch.kneeTime - ccTime) / ccTime < 1e-3, `${ch.kneeTime} vs ${ccTime}`);
  assert.ok(ch.socEnd > 0.99);
  assert.ok(ch.cvCurrent < 0.15);
  assert.ok(ch.curve.every((p, i) => i === 0 || p.soc >= ch.curve[i - 1].soc));
});

test("playback runtime scales with capacity and load", () => {
  const base = W.playTime({ capacityMah: 320, acousticPeakW: 0.5 });
  const double = W.playTime({ capacityMah: 640, acousticPeakW: 0.5 });
  assert.ok(Math.abs(double.hours / base.hours - 2) < 1e-9);
  const louder = W.playTime({ capacityMah: 320, acousticPeakW: 4 });
  assert.ok(louder.hours < base.hours);
  assert.ok(base.totalMa === base.ampDrawMa + 12 + 2.4);
});

test("lathed solids match the analytic volume of their profile", () => {
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
  const body = W.speakerShellProfile({
    odMm: 12.7, heightMm: 50.8, wallMm: 0.8,
    coilPocketDiaMm: 10.4, driverDiaMm: 10, coilPocketDepthMm: 0.5, driverRecessDepthMm: 2.5,
  });
  const mesh = W.latheMesh(body, 240);
  assert.ok(Math.abs(mesh.volumeMm3 - pappus(body)) / pappus(body) < 2e-3,
    `${mesh.volumeMm3} vs ${pappus(body)}`);
  assert.ok(W.meshVolume(mesh.triangles) > 0, "normals point outward");

  const stl = W.stlBinary(mesh, "body");
  assert.equal(stl.length, 84 + mesh.triangles.length * 50);
  const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
  assert.equal(dv.getUint32(80, true), mesh.triangles.length);
});

test("the stack fit check catches a body that is too short", () => {
  const parts = [
    { label: "driver", diaMm: 10, heightMm: 2.5 },
    { label: "cell", diaMm: 10.5, heightMm: 44 },
    { label: "coil", diaMm: 10, heightMm: 0.5 },
  ];
  assert.ok(W.stackFit({ innerDiaMm: 11.1, innerHeightMm: 50, parts }).fits);
  assert.ok(!W.stackFit({ innerDiaMm: 11.1, innerHeightMm: 40, parts }).fits);
  assert.ok(!W.stackFit({ innerDiaMm: 10.2, innerHeightMm: 50, parts }).fits, "cell too wide");
});

test("Ø12.7 mm breaks the WPC receiver requirement — the reason this page exists", () => {
  const q100k = (2 * Math.PI * 1e5 * 8.32e-6) / 0.98;
  const q1M = (2 * Math.PI * 1e6 * 8.32e-6) / 0.98;
  assert.ok(q100k < W.QI.qRxMin, `Q at 100 kHz = ${q100k}`);
  assert.ok(q1M < W.QI.qRxMin, `Q at 1 MHz = ${q1M}`);
  // Passing would need ≤ 68 mΩ in a 12 mm winding, which the published part
  // does not have by a factor of fifteen.
  assert.ok((2 * Math.PI * 1e5 * 8.32e-6) / W.QI.qRxMin < 0.07);

  // And the Qi-band link between coils this small runs at a few percent:
  const qiBand = W.solveDesign(W.PRESETS.spec, { fHz: 125e3, proximityFactor: 1.5 });
  const resonant = W.solveDesign(W.PRESETS.resonant);
  assert.ok(qiBand.power.linkEfficiency < 0.2,
    `Qi band link efficiency ${(qiBand.power.linkEfficiency * 100).toFixed(1)} %`);
  assert.ok(resonant.power.linkEfficiency > 4 * qiBand.power.linkEfficiency,
    "the resonant link should be several times better");
  assert.ok(qiBand.link.i1 > 3 * resonant.link.i1,
    "and it should need far more coil current to do it");
});

test("the generated netlist is structurally valid and carries the solved values", () => {
  const d = W.solveDesign(W.PRESETS.resonant);
  const text = W.spiceNetlist(d);
  const lines = text.split("\n").filter((l) => l && !l.startsWith("*") && !l.startsWith("."));
  const nodeUse = new Map();
  for (const l of lines) {
    for (const f of l.split(/\s+/).slice(1)) {
      if (/^(n\d+|in|0)$/.test(f)) nodeUse.set(f, (nodeUse.get(f) || 0) + 1);
    }
  }
  const dangling = [...nodeUse].filter(([n, c]) => n !== "0" && c < 2).map(([n]) => n);
  assert.deepEqual(dangling, []);
  assert.match(text, /^K1 L1 L2 [\d.]+$/m);
  const l1 = parseFloat(text.match(/^L1 n1 n2 (\S+)$/m)[1]);
  assert.ok(Math.abs(l1 - d.inductance.txH) / d.inductance.txH < 1e-6,
    `L1 in the deck ${l1} vs solved ${d.inductance.txH}`);
});

test("BOM CSV is well formed and every row has a role", () => {
  const csv = W.bomCsv();
  const rows = csv.trim().split("\n");
  assert.equal(rows[0], "Qty,Part,Role,Source");
  const parts = rows.filter((r) => /^\d+,/.test(r));
  assert.ok(parts.length >= 10, `${parts.length} part rows`);
  for (const r of parts) assert.ok(r.split(",").length >= 2);
  assert.ok(csv.includes("WR121210-27M8-ID"), "the real 12 mm receiver coil is in the BOM");
  assert.ok(csv.includes("MAX98357A"), "the real amplifier is in the BOM");
});

/* ---------------------------------------------------------------- *
 * the page itself, in jsdom
 * ---------------------------------------------------------------- */

test("the page boots in jsdom and renders a solved design", async (t) => {
  let JSDOM;
  try {
    ({ JSDOM } = await import("jsdom"));
  } catch (err) {
    t.skip(`jsdom unavailable: ${err.message}`);
    return;
  }
  const html = readFileSync(join(ROOT, "wireless-charge-pad.html"), "utf8");
  const dom = new JSDOM(html, { pretendToBeVisual: true, url: "http://localhost/wireless-charge-pad.html" });
  const { window } = dom;

  // jsdom has no 2-D canvas backend. Rather than stub it to null — which would
  // skip every chart — give it a recording context in the style of
  // tests/lib.mjs makeCanvas(): any non-finite coordinate is a real bug, since
  // a browser drops those draw calls silently and the chart just vanishes.
  const drawn = { ops: 0, bad: [] };
  const makeCtx = () => {
    const noop = () => {};
    const chk = (name) => (...a) => {
      drawn.ops++;
      for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) drawn.bad.push(`${name}(${a.join(",")})`);
    };
    return {
      setTransform: noop, clearRect: chk("clearRect"), save: noop, restore: noop,
      beginPath: noop, closePath: noop, setLineDash: noop,
      fillRect: chk("fillRect"), strokeRect: chk("strokeRect"), arc: chk("arc"), rect: chk("rect"),
      moveTo: chk("moveTo"), lineTo: chk("lineTo"), stroke: chk("stroke"), fill: chk("fill"),
      fillText: chk("fillText"), translate: chk("translate"), rotate: chk("rotate"),
      measureText: (t) => ({ width: String(t).length * 5 }),
    };
  };
  window.HTMLCanvasElement.prototype.getContext = (kind) => (kind === "2d" ? makeCtx() : null);

  for (const key of ["window", "document", "requestAnimationFrame", "cancelAnimationFrame",
                     "HTMLElement", "Node", "Blob", "URL", "devicePixelRatio", "getComputedStyle"]) {
    if (key in globalThis) continue;
    globalThis[key] = window[key];
  }
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
  globalThis.HTMLCanvasElement = window.HTMLCanvasElement;

  await import(pathToFileURL(join(ROOT, "js", "wireless-charge-lab.js")).href);
  await new Promise((r) => setTimeout(r, 50));

  const doc = window.document;
  const verdict = doc.getElementById("verdict").textContent;
  assert.ok(verdict.length > 200, `verdict is thin: ${verdict.slice(0, 80)}`);
  assert.ok(/k = 0\.\d+/.test(verdict), "verdict reports a coupling coefficient");
  assert.ok(!/NaN|undefined|Infinity/.test(verdict), `verdict contains a bad number: ${verdict}`);

  const minRows = { coils: 12, link: 6, budget: 5, charge: 5, runtime: 6, thermal: 5, fit: 6, bom: 10, solid: 2 };
  for (const [id, min] of Object.entries(minRows)) {
    const rows = doc.getElementById(id).querySelectorAll("tr").length;
    assert.ok(rows >= min, `${id} has ${rows} rows, expected at least ${min}`);
  }
  const flags = doc.querySelectorAll("#checks .flag");
  assert.ok(flags.length >= 8, `${flags.length} checks rendered`);
  assert.ok([...flags].some((f) => f.className.includes("na") || f.className.includes("no")),
    "the checks are not all green — a real design has failures to report");

  // Every number the page printed must be a number, not a formatting failure.
  const body = doc.body.textContent;
  assert.ok(!/NaN|undefined|\[object Object\]/.test(body), "the rendered page contains a non-number");

  // Driving an input re-solves: halve the gap, coupling must rise.
  const kOf = (txt) => Number(txt.match(/k = (0?\.\d+)/)[1]);
  const verdictEl = doc.getElementById("verdict");
  const kBefore = kOf(verdictEl.textContent);
  const gapInput = doc.getElementById("f-gapMm");
  gapInput.value = String(Number(gapInput.value) / 2);
  gapInput.dispatchEvent(new window.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 120));
  const kAfter = kOf(verdictEl.textContent);
  assert.ok(kAfter > kBefore, `halving the gap moved k from ${kBefore} to ${kAfter}`);
  assert.ok(doc.getElementById("f-rx-turns"), "coil inputs are addressed by field path");

  // The charts actually drew, and every coordinate they drew was a number.
  assert.deepEqual(drawn.bad, [], `non-finite draw coordinates: ${drawn.bad.slice(0, 4).join(" | ")}`);
  assert.ok(drawn.ops > 200, `only ${drawn.ops} canvas operations — the charts did not render`);
});
