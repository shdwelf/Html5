import test from "node:test";
import assert from "node:assert/strict";
import { ltEncode, ltDecode, toBytes, toText } from "../tools/cryptofountain_core.mjs";
import { hybridRaptorDecode, solveGF2 } from "../tools/raptor_gaussian_decoder.mjs";
import { gfMulFast, gfInv, gfDiv, gfAdd } from "../tools/gf256.mjs";

test("GF(2^8) arithmetic: multiplication, inverse, and division identities hold", () => {
  assert.equal(gfMulFast(0, 42), 0);
  assert.equal(gfMulFast(1, 42), 42);
  for (let a = 1; a < 256; a++) {
    const inv = gfInv(a);
    assert.equal(gfMulFast(a, inv), 1);
  }
  assert.equal(gfDiv(42, 42), 1);
  assert.equal(gfDiv(0, 42), 0);
});

test("GF(2) bit-matrix Gaussian Elimination solves linearly independent systems", () => {
  const depEquations = [
    { mask: 3n, data: new Uint8Array([1, 2]) },
    { mask: 6n, data: new Uint8Array([2, 3]) },
    { mask: 5n, data: new Uint8Array([3, 1]) }
  ];
  assert.equal(solveGF2(depEquations, 3, 2), null);

  const indepEquations = [
    { mask: 1n, data: new Uint8Array([5, 6]) },
    { mask: 3n, data: new Uint8Array([1, 2]) },
    { mask: 6n, data: new Uint8Array([6, 7]) }
  ];
  const sol = solveGF2(indepEquations, 3, 2);
  assert.ok(sol !== null);
  assert.deepEqual(Array.from(sol[0]), [5, 6]);
  assert.deepEqual(Array.from(sol[1]), [4, 4]);
  assert.deepEqual(Array.from(sol[2]), [2, 3]);
});

test("Hybrid Raptor Decoder recovers stalled peeling cycles via inactivation Gaussian elimination", () => {
  let found = false;
  for (let seed = 1; seed < 50; seed++) {
    const payload = "High-resilience erasure packet stream.";
    const blockSize = 8;
    const enc = ltEncode(payload, blockSize, 20, seed);
    const K = enc.numBlocks;

    for (let count = K; count <= K + 4; count++) {
      const subset = enc.packets.slice(0, count);
      const peeling = ltDecode(subset, K, blockSize);
      const hybrid = hybridRaptorDecode(subset, K, blockSize);

      if (hybrid.success && !peeling.success) {
        assert.equal(hybrid.method, "hybrid-gaussian");
        const full = new Uint8Array(K * blockSize);
        for (let i = 0; i < K; i++) full.set(hybrid.blocks[i], i * blockSize);
        let end = full.length;
        while (end > 0 && full[end - 1] === 0) end--;
        assert.equal(toText(full.slice(0, end)), payload);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  assert.ok(found, "Should demonstrate a stalled peeling graph resolved by inactivation decoding");
});
