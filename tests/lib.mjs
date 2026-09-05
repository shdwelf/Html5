/** Shared assertions + a canvas backend that reports non-finite coordinates. */

export const ROOT = new URL("../", import.meta.url).pathname;
export const JS = new URL("../js/", import.meta.url).href;

export function suite(name) {
  const s = { name, pass: 0, fail: 0 };
  s.ok = (label, cond, extra = "") => {
    if (cond) { s.pass++; console.log("  ok  ", label, extra); }
    else { s.fail++; console.log("  FAIL", label, extra); }
  };
  s.eq = (label, got, want) =>
    s.ok(`${label} = ${JSON.stringify(got)}`, JSON.stringify(got) === JSON.stringify(want), `want ${JSON.stringify(want)}`);
  s.near = (label, a, b, tol = 1e-9) => s.ok(`${label} = ${a}`, Math.abs(a - b) <= tol, `want ${b} ±${tol}`);
  s.done = () => {
    console.log(`\n${s.name}: ${s.pass} passed, ${s.fail} failed`);
    return s.fail;
  };
  return s;
}

/** 2-D context double. Any non-finite numeric argument is recorded, because a
 *  real canvas drops those draw calls silently and the chart just disappears. */
export function makeCanvas() {
  const bad = [];
  const ops = { fillRect: 0, fillText: 0, stroke: 0, fill: 0, arc: 0, moveTo: 0, lineTo: 0, rect: 0, strokeRect: 0 };
  const count = (fn) => (...a) => {
    ops[fn] = (ops[fn] || 0) + 1;
    for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) bad.push(`${fn}(${a.join(",")})`);
  };
  const chk = count;
  const noop = () => {};
  const ctx = {
    bad,
    measureText: (t) => ({ width: String(t).length * 5 }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData: noop, drawImage: noop, setTransform: noop, save: noop, restore: noop, setLineDash: noop,
    beginPath: noop, closePath: noop,
    fillRect: chk("fillRect"), strokeRect: chk("strokeRect"), arc: chk("arc"), rect: chk("rect"),
    moveTo: chk("moveTo"), lineTo: chk("lineTo"), stroke: chk("stroke"), fill: chk("fill"),
    fillText: (t, x, y) => {
      ops.fillText++;
      for (const v of [x, y]) if (!Number.isFinite(v)) bad.push(`fillText(${x},${y})`);
    },
  };
  ctx.ops = ops;
  const canvas = { width: 0, height: 0, style: {}, getContext: (k) => (k === "2d" ? ctx : null), _ctx: ctx };
  return canvas;
}

/** Build the context object viewer.js hands to every lens, from a real phrase. */
export async function buildLensContext(B, F, M, nWords, { withFlips = true, withAnf = true } = {}) {
  const layout = B.layoutForWords(nWords);
  const entropy = new Uint8Array(layout.entBytes);
  crypto.getRandomValues(entropy);
  const words = await B.entropyToMnemonic(entropy);
  const analysis = await B.mnemonicToEntropy(words);
  const baseIdx = analysis.indices;
  let flips = null;
  if (withFlips) {
    flips = [];
    for (let b = 0; b < analysis.entropyBits; b++) {
      const w = await B.entropyToMnemonic(M.flipEntropyBit(entropy, b));
      const idx = B.indicesOf(w);
      let changed = 0;
      const deltas = [];
      for (let i = 0; i < idx.length; i++) {
        if (idx[i] !== baseIdx[i]) { changed++; deltas.push([i, Math.abs(idx[i] - baseIdx[i])]); }
      }
      flips.push({ bit: b, changed, deltas, lastChanged: idx[idx.length - 1] !== baseIdx[baseIdx.length - 1] });
    }
  }
  let anf = null;
  if (withAnf) {
    anf = [];
    for (let m = 0; m < 16; m++) {
      const e = new Uint8Array(entropy);
      for (let i = 0; i < 4; i++) if ((m >> i) & 1) e[0] ^= 1 << (7 - i);
      const w = await B.entropyToMnemonic(e);
      anf.push((B.INDEX.get(w[w.length - 1]) ?? 0) & 1);
    }
  }
  const other = F.notBytes(entropy);
  return {
    words, indices: analysis.indices, entropy, layout, analysis,
    path: words.map((_, i) => [Math.sin(i), Math.cos(i * 1.3) * 0.6, i / words.length - 0.5]),
    flips, anf,
    pair: F.invertReport(entropy, other), pairEntropy: other,
    actions: [
      { kind: "sample", at: 1, ok: true },
      { kind: "project", at: 30, ok: true },
      { kind: "flip", at: 90, ok: true },
    ],
    timings: [{ label: "sample+encode", ms: 2.4 }, { label: "phrasePath", ms: 0.3 }],
    seed: 12345,
  };
}
