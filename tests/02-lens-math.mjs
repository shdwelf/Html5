/**
 * 02 · known-answer maths for every formal-system lens, on a real phrase.
 * node tests/02-lens-math.mjs
 */
import { suite, JS, buildLensContext } from "./lib.mjs";

const B = await import(JS + "bip39.js");
const F = await import(JS + "formal.js");
const M = await import(JS + "mathvis.js");
const s = suite("02 · lens maths");

console.log("\n[1] number helpers");
s.ok("factorialBig(5) = 120", F.factorialBig(5) === 120n);
s.ok("binomBig(5,2) = 10", F.binomBig(5, 2) === 10n);
s.near("log10Big(1000n)", F.log10Big(1000n), 3, 1e-12);
s.ok("fmtBig(2^256) is 1.1579 × 10^77", /1\.1579 × 10\^77/.test(F.fmtBig(2n ** 256n)), F.fmtBig(2n ** 256n));
s.ok("pow2Big(10) = 1024", F.pow2Big(10) === 1024n);

console.log("\n[2] invert keyspace invariants");
const A = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const Bk = new Uint8Array([255, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const notA = F.notBytes(A);
const r1 = F.invertReport(A, Bk);
s.ok("d(A,B) = popcount of the differing byte", r1.d === F.popcount(A[0] ^ Bk[0]), `d=${r1.d}`);
s.ok("d(¬A,B) = ENT − d(A,B)", r1.complementAToB === r1.entBits - r1.d, `${r1.complementAToB} = ${r1.entBits} − ${r1.d}`);
const r2 = F.invertReport(A, notA);
s.ok("d(A,¬A) = all 128 bits", r2.d === 128, `d=${r2.d}`);
s.ok("d(¬A, ¬A) = 0", r2.complementAToB === 0);
s.ok("|S(A,¬A)| = 2^128", r2.subcubeSize === 2n ** 128n);
s.ok("geodesics = d!", r2.geodesics === F.factorialBig(128));
s.ok("unequal lengths left-padded", (() => { const r = F.invertReport(new Uint8Array([1, 2]), A); return r.entBits === 128 && !r.equalLength; })());

console.log("\n[3] differential / integral / fractional");
const flips = [];
for (let b = 0; b < 128; b++) {
  const w = Math.floor(b / 11);
  flips.push({ bit: b, changed: w === 11 ? 1 : 2, deltas: [[w, 64], [11, 3]], lastChanged: true });
}
const dp = F.differentialProfile(flips);
s.ok("gradient length", dp.grad.length === 128);
s.ok("confined (max ≤ 2 words)", dp.confined);
s.ok("total = Σ grad", dp.total === dp.grad.reduce((a, b) => a + b, 0));
const ip = F.integralProfile(dp.grad);
s.ok("cumulative monotone", ip.cum.every((v, i) => i === 0 || v >= ip.cum[i - 1]));
s.ok("area = total", ip.area === dp.total);
s.ok("α=1 → backward difference", JSON.stringify(F.fractionalDerivative([1, 3, 6, 10, 15], 1)) === "[1,2,3,4,5]");
s.ok("α=0 → identity", JSON.stringify(F.fractionalDerivative([1, 3, 6, 10, 15], 0)) === "[1,3,6,10,15]");
s.near("GL c₁(0.5)", F.glCoeffs(0.5, 3)[1], -0.5);
s.near("GL c₂(0.5)", F.glCoeffs(0.5, 3)[2], -0.125);

console.log("\n[4] linear algebra / Boolean");
const ev = F.eigenSymmetric([[2, 0], [0, 3]], 2);
s.near("λ₁ of diag(2,3)", ev[0].lambda, 3, 1e-6);
s.near("λ₂ of diag(2,3)", ev[1].lambda, 2, 1e-6);
s.ok("Möbius is an involution", JSON.stringify(F.mobius(F.mobius([1, 0, 1, 1]))) === "[1,0,1,1]");
s.ok("ANF of AND(x₁,x₂)", JSON.stringify(F.mobius([0, 0, 0, 1])) === "[0,0,0,1]");
s.ok("ANF of XOR = x₁⊕x₂", F.anfTerms(F.mobius([0, 1, 1, 0])).join("⊕") === "x₁⊕x₂");

console.log("\n[5] modal μ / stochastic / umbral / vector / process");
const rc = F.reachabilityFixpoint(4, 4);
s.ok("|B(1)| on Q₄ = 5", rc.balls[1].ball === 5n);
s.ok("|B(4)| on Q₄ = 16", rc.balls[4].ball === 16n);
s.ok("50% radius on Q₁₂₈ = 64", F.reachabilityFixpoint(128, 0).halfRadius === 64);
const st = F.stochasticForecast(128, [{ label: "1e12", rate: 1e12 }]);
s.near("log₁₀ years to hit 2^128 @10¹²/s", Math.log10(st.rows[0].years), 19.03, 0.02);
s.ok("Itô path is deterministic for a fixed seed", F.itoReport(12345, 100).quadraticVariation === F.itoReport(12345, 100).quadraticVariation);
const um = F.umbralProfile([1, 3, 6, 10]);
s.ok("Δ of [1,3,6,10]", JSON.stringify(um.diffs[1]) === "[2,3,4]");
s.ok("Δ² of [1,3,6,10]", JSON.stringify(um.diffs[2]) === "[1,1]");
s.ok("binomial transform of [1,1,1]", JSON.stringify(F.binomialTransform([1, 1, 1])) === "[1,0,0]");
const cv = F.curveInvariants([[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]]);
s.near("straight line: turning = 0", cv.totalTurning, 0, 1e-9);
s.near("straight line: arc = chord = 3", cv.arcLength, 3, 1e-9);
const lts = F.ltsReport();
s.ok("LTS = 8 states / 7 τ transitions", lts.count === 8 && lts.transitions === 7);
s.ok("π-calculus: 8 bound names, none free", F.piReport().boundNames === 8 && F.piReport().freeNames === 0);
s.ok("Ricci flat on the cube", F.ricciReport(new Uint8Array([255, 0])).ricciScalar === 0 && F.ricciReport(new Uint8Array([255, 0])).weight === 8);

console.log("\n[6] logic family on a real 25-word phrase");
const ctx = await buildLensContext(B, F, M, 25);
const atoms = F.wellFormedAtoms(ctx.analysis, ctx.words);
s.ok("all three atoms true for a fresh phrase", atoms.every((a) => a.value));
const tt = F.truthTable(atoms);
s.ok("truth table has 8 rows", tt.rows.length === 8);
s.ok("the actual valuation is the all-true row", tt.actualIndex === 7 && tt.rows[7].result === true);
const sp = F.sequentProof(atoms);
s.ok("derivation closes", sp.root.ok && sp.failed.length === 0);
const sp2 = F.sequentProof(atoms.map((a, i) => (i === 2 ? { ...a, value: false } : a)));
s.ok("derivation breaks exactly at ⊢ C", !sp2.root.ok && sp2.failed.join() === "⊢ C");
const rq = F.relationalQuery(ctx.analysis, ctx.words);
s.ok("π_word(σ_cs(PHRASE)) returns 1 tuple", rq.result.length === 1, rq.result.join());
s.ok("all checksum rows agree", rq.checksumRows === `${ctx.analysis.checksumBits}/${ctx.analysis.checksumBits}`);
s.ok("predicate claims all decided", F.predicateClaims(ctx.analysis).every((c) => typeof c.value === "boolean"));
s.ok("simply typed judgments = 7 rows", F.simplyTypedJudgments(ctx.analysis.layout).length === 7);

console.log("\n[7] every lens computes a clean readout on that phrase");
let clean = 0;
for (const L of F.LENSES) {
  let res = null, err = null;
  try { res = L.compute(ctx); } catch (e) { err = e; }
  const good = res && Array.isArray(res.rows) && res.rows.length > 0 && res.describe && res.explain && res.predict;
  s.ok(`lens ${L.id} (${L.kind})`, !!good && !err, err ? String(err.message) : `${res?.rows.length} rows`);
  if (good) clean++;
  for (const [k, v] of res?.rows || []) {
    const t = String(v);
    if (t.includes("NaN") || t.includes("undefined") || v === null) { s.fail++; console.log("    BAD ROW", L.id, k, t); }
  }
}
s.ok(`all ${F.LENSES.length} lenses clean`, clean === F.LENSES.length, `${clean}/${F.LENSES.length}`);

console.log("\n[8] the differential prediction, checked against the real hash");
const rp = F.differentialProfile(ctx.flips);
s.ok("every flip moves 1 or 2 words", rp.histogram.every(([k]) => k === 1 || k === 2), JSON.stringify(rp.histogram));
s.ok("the checksum word moved on most flips", rp.lastWordChanged > 0, `${rp.lastWordChanged}/${ctx.flips.length}`);
s.ok("word ⌊i/11⌋ is always in the support", ctx.flips.every((f) => f.deltas.some(([w]) => w === Math.floor(f.bit / 11))));


console.log("\n[9] algebra/geometry/trigonometry known answers");
s.eq("permutation [1,2,0] order", F.permutationCycles([1, 2, 0]).order, 3);
s.ok("3-cycle is even", F.permutationCycles([1, 2, 0]).sign === 1);
s.eq("two transpositions order", F.permutationCycles([1, 0, 3, 2]).order, 2);
s.eq("gcd(12,18)", F.gcd(12, 18), 6);
s.eq("lcm(4,6)", F.lcm(4, 6), 12);
s.eq("GF(2) rank of {11,10,01}", F.gf2Rank([[1,1],[1,0],[0,1]]).rank, 2);
s.eq("GF(2) rank of dup rows", F.gf2Rank([[1,0,1],[1,0,1]]).rank, 1);
s.eq("AES 0x57·0x83", F.gf256Mul(0x57, 0x83), 0xc1);
s.ok("a·a⁻¹=1 for all bytes", (() => { for (let a = 1; a < 256; a++) if (F.gf256Mul(a, F.gf256Inv(a)) !== 1) return false; return true; })());
s.near("3-4-5 right angle", F.lawOfCosinesAngle(3, 4, 5), Math.PI / 2, 1e-9);
const oct = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const ea = F.sphericalAngle(oct[0], oct[1], oct[2]);
s.near("octant spherical angle = π/2", ea, Math.PI / 2, 1e-9);
s.near("octant excess = π/2", 3 * ea - Math.PI, Math.PI / 2, 1e-9);
s.eq("divisors(12) count", F.divisors(12).length, 6);
s.eq("μ(12)=0", F.mobiusFn(12), 0);
s.eq("μ(6)=1", F.mobiusFn(6), 1);
s.eq("μ(30)=−1", F.mobiusFn(30), -1);
const sq = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]];
s.eq("hull of square+center = 4", F.convexHull(sq).length, 4);
s.near("shoelace unit square = 1", F.shoelace([[0, 0], [1, 0], [1, 1], [0, 1]]), 1, 1e-9);
s.ok("crossing segments detected", F.segmentsCross([0, 0], [1, 1], [0, 1], [1, 0]) === true);
s.ok("parallel segments do not cross", F.segmentsCross([0, 0], [1, 0], [0, 1], [1, 1]) === false);
const crx = [0.1, 0.4, 0.6, 0.9];
const mob = (t) => (2 * t + 1) / (t + 3);
s.near("cross-ratio Möbius-invariant", F.crossRatio(...crx.map(mob)), F.crossRatio(...crx), 1e-9);
const seq64 = Array.from({ length: 64 }, (_, t) => 100 + 50 * Math.cos((2 * Math.PI * 2 * t) / 64));
const amp64 = F.dftAmplitudes(seq64).slice(1); // skip DC (k=0), which is just the mean
s.eq("DFT peak among k>=1 is 2", amp64.indexOf(Math.max(...amp64)) + 1, 2);
s.near("Parseval ratio = 1", F.parseval([3, 1, 4, 1, 5, 9, 2, 6]).freq / F.parseval([3, 1, 4, 1, 5, 9, 2, 6]).time, 1, 1e-6);
s.ok("sinusoid fit R²≈1 on a pure cosine", F.fitSinusoid(seq64, 2).r2 > 0.99, F.fitSinusoid(seq64, 2).r2.toFixed(4));

process.exit(s.done() ? 1 : 0);
