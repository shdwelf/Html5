/**
 * 06 · the extreme the custom length box allows: 512 words = 5632 bits.
 * Measures the cost and proves nothing overflows to NaN.
 * node tests/06-extreme.mjs
 */
import { suite, JS, makeCanvas, buildLensContext } from "./lib.mjs";

const B = await import(JS + "bip39.js");
const F = await import(JS + "formal.js");
const M = await import(JS + "mathvis.js");
const D = await import(JS + "lens-draw.js");
const s = suite("06 · 512 words / 5632 bits");

const L = B.layoutForWords(512);
console.log(`\nlayout: 512 words -> ${L.entBits} ENT + ${L.csBits} CS = ${L.totalBits} bits`);
s.ok("11n closes at 512 words", 11 * 512 === L.entBits + L.csBits);
s.ok("ENT byte aligned", L.entBits % 8 === 0);

let t = Date.now();
const entropy = new Uint8Array(L.entBytes);
crypto.getRandomValues(entropy);
const words = await B.entropyToMnemonic(entropy);
const analysis = await B.mnemonicToEntropy(words);
const encodeMs = Date.now() - t;
console.log(`encode+decode: ${encodeMs} ms`);
s.ok("512-word phrase is well formed", analysis.ok, `${encodeMs} ms`);

t = Date.now();
const baseIdx = analysis.indices;
const flips = [];
for (let b = 0; b < analysis.entropyBits; b++) {
  const w = await B.entropyToMnemonic(M.flipEntropyBit(entropy, b));
  const idx = B.indicesOf(w);
  let changed = 0;
  const deltas = [];
  for (let i = 0; i < idx.length; i++) if (idx[i] !== baseIdx[i]) { changed++; deltas.push([i, Math.abs(idx[i] - baseIdx[i])]); }
  flips.push({ bit: b, changed, deltas, lastChanged: idx[idx.length - 1] !== baseIdx[baseIdx.length - 1] });
}
const sweepMs = Date.now() - t;
console.log(`flip sweep over ${analysis.entropyBits} bits: ${sweepMs} ms`);
s.ok("flip sweep completes in under 15 s", sweepMs < 15000, `${sweepMs} ms`);

const other = F.notBytes(entropy);
const pair = F.invertReport(entropy, other);
s.ok("d(A,¬A) = ENT at this size", pair.d === L.entBits, `d=${pair.d}`);
s.ok("geodesics = d! is computed, not overflowed", pair.geodesics.toString().length > 1000, `${pair.geodesics.toString().length} digits`);

const inf = F.influenceMatrix(flips, words.length);
const mb = (inf.rows.length * inf.rows[0].length * 8) / 1048576;
console.log(`influence matrix ${inf.rows.length}×${inf.rows[0].length} = ${mb.toFixed(1)} MB`);
s.ok("influence matrix under 64 MB", mb < 64, `${mb.toFixed(1)} MB`);

console.log("\nevery lens at 5632 bits: compute then draw");
const ctx = {
  words, indices: analysis.indices, entropy, layout: analysis.layout, analysis,
  path: words.map((_, i) => [Math.sin(i), Math.cos(i * 1.3) * 0.6, i / words.length - 0.5]),
  flips, anf: null, pair, pairEntropy: other,
  actions: [{ kind: "sample", at: 1, ok: true }], timings: [{ label: "flip sweep", ms: sweepMs }], seed: 5,
};
for (const lens of F.LENSES) {
  let res = null, err = null;
  const t0 = Date.now();
  try { res = lens.compute(ctx); } catch (e) { err = e; }
  const ms = Date.now() - t0;
  const text = JSON.stringify(res?.rows ?? null);
  const overflow = text && (text.includes("NaN") || text.includes("Infinity"));
  s.ok(`compute ${lens.id}`, !err && !!res && !overflow && ms < 2000, err ? err.message : `${res?.rows.length} rows, ${ms} ms`);

  const cv = makeCanvas();
  let derr = null;
  try { D.drawLens(lens.id, cv, ctx); } catch (e) { derr = e; }
  s.ok(`draw ${lens.id}`, !derr && cv._ctx.bad.length === 0, derr ? derr.message : `nonFinite=${cv._ctx.bad.length}`);
}

process.exit(s.done() ? 1 : 0);
