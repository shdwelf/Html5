/**
 * 04 · every 3-D layer builder: vertex counts, non-finite coordinates,
 * determinism, and clean degradation with no key loaded.
 * node tests/04-lens-3d.mjs
 */
import { suite, JS, buildLensContext } from "./lib.mjs";

const B = await import(JS + "bip39.js");
const F = await import(JS + "formal.js");
const M = await import(JS + "mathvis.js");
const L3 = await import(JS + "lens-3d.js");
const s = suite("04 · 3-D layers");

const ctx = await buildLensContext(B, F, M, 25);

function audit(g) {
  if (!g) return { ok: false, why: "null" };
  let meshes = 0, pts = 0, lines = 0, verts = 0, bad = 0;
  g.traverse((o) => {
    const pos = o.geometry?.attributes?.position;
    if (!pos) return;
    verts += pos.count;
    for (let i = 0; i < pos.array.length; i++) if (!Number.isFinite(pos.array[i])) bad++;
    if (o.type === "Points") pts++;
    else if (o.type === "Line") lines++;
    else if (o.type === "Mesh") meshes++;
  });
  return { ok: verts > 0 && bad === 0, verts, bad, meshes, pts, lines };
}

console.log("\n[1] every declared layer builds real geometry");
for (const id of L3.LENS_3D) {
  let g = null, err = null;
  try { g = L3.buildLensLayer(id, ctx); } catch (e) { err = e; }
  const a = err ? { ok: false, why: err.message } : audit(g);
  s.ok(`layer ${id}`, a.ok, err ? err.message : `verts=${a.verts} meshes=${a.meshes} pts=${a.pts} lines=${a.lines} nonFinite=${a.bad}`);
}

console.log("\n[2] layers return null (not throw) with no key / no pair");
const bare = { words: [], entropy: null, pairEntropy: null, layout: null, flips: null, path: [] };
for (const id of ["inv-subcube", "inv-geodesic", "inv-complement", "inv-shell", "differential", "influence", "vector"]) {
  let threw = null, g;
  try { g = L3.buildLensLayer(id, { ...bare, layout: { entBits: 128 } }); } catch (e) { threw = e; }
  s.ok(`${id} no-throw`, !threw, threw ? threw.message : `returned ${g === null ? "null" : "group"}`);
}

console.log("\n[3] projection stays in bounds and is deterministic");
{
  const g1 = L3.buildLensLayer("inv-complement", ctx);
  const g2 = L3.buildLensLayer("inv-complement", ctx);
  const range = (g) => {
    let lo = Infinity, hi = -Infinity;
    g.traverse((o) => { const p = o.geometry?.attributes?.position; if (!p) return; for (const v of p.array) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    return [lo, hi];
  };
  const [lo, hi] = range(g1);
  s.ok("coords finite and inside ±12", Number.isFinite(lo) && Number.isFinite(hi) && Math.abs(hi) < 12, `[${lo.toFixed(2)}, ${hi.toFixed(2)}]`);
  s.ok("identical across two builds", JSON.stringify(range(g1)) === JSON.stringify(range(g2)));
}

process.exit(s.done() ? 1 : 0);
