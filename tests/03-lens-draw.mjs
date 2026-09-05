/**
 * 03 · every 2-D renderer, with a canvas backend that reports non-finite
 * coordinates (a real canvas drops those calls silently).
 * node tests/03-lens-draw.mjs
 */
import { suite, JS, makeCanvas, buildLensContext } from "./lib.mjs";

const B = await import(JS + "bip39.js");
const F = await import(JS + "formal.js");
const M = await import(JS + "mathvis.js");
const D = await import(JS + "lens-draw.js");
const s = suite("03 · 2-D renderers");

const ctx = await buildLensContext(B, F, M, 25);

console.log("\n[1] each lens draws, with finite coordinates and real work");
for (const L of F.LENSES) {
  const cv = makeCanvas();
  let drew = false, err = null;
  try { drew = D.drawLens(L.id, cv, ctx); } catch (e) { err = e; }
  const expectDraw = L.kind !== "card";
  const ops = cv._ctx.ops;
  const total = Object.values(ops).reduce((a, b) => a + b, 0);
  s.ok(
    `draw ${L.id}`,
    !err && drew === expectDraw && (!expectDraw || total > 5) && cv._ctx.bad.length === 0,
    err ? err.message : `drew=${drew} ops=${total} nonFinite=${cv._ctx.bad.length}`
  );
  if (expectDraw) s.ok(`  ${L.id} canvas sized`, cv.width === 340 && cv.height === 172, `${cv.width}x${cv.height}`);
}

console.log("\n[2] a card draws nothing instead of faking geometry");
{
  const cv = makeCanvas();
  const drew = D.drawLens("lambda-typed", cv, ctx);
  s.ok("lambda-typed returns false", drew === false);
  s.ok("no draw calls issued", Object.values(cv._ctx.ops).reduce((a, b) => a + b, 0) === 0);
}

console.log("\n[3] empty data cannot throw");
const bare = {
  words: [], indices: [], entropy: null, layout: { entBits: 128, csBits: 8, words: 12 },
  analysis: null, path: [], flips: null, anf: null, pair: null, pairEntropy: null,
  actions: [], timings: [], seed: 1,
};
for (const id of ["inv-subcube", "inv-geodesic", "inv-complement", "inv-shell", "differential", "vector", "boolean", "umbral", "stochastic", "influence", "tensor"]) {
  let threw = null;
  try { D.drawLens(id, makeCanvas(), bare); } catch (e) { threw = e; }
  s.ok(`${id} survives empty data`, !threw, threw ? threw.message : "");
}

process.exit(s.done() ? 1 : 0);
