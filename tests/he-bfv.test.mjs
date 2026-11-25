import assert from "node:assert/strict";
import { test } from "node:test";
import { runBfvDemo } from "../tools/he-bfv-demo.mjs";

test("BFV evaluates encrypted addition, modular subtraction and multiplication", async () => {
  for (const [a, b] of [[3, 5], [0, 100], [100, 100], [99, 0]]) {
    const result = await runBfvDemo(a, b);
    assert.equal(result.sum, a + b);
    assert.ok(result.plainModulus > 100, "plaintext modulus covers the demo input range");
    assert.equal(result.differenceResidue,
      ((a - b) % result.plainModulus + result.plainModulus) % result.plainModulus);
    assert.equal(result.product, a * b);
    assert.equal(result.securityLevelBits, 128);
    assert.ok(result.noiseBudgetBits > 0);
    assert.equal(result.randomizationDistinctForA, true);
    assert.equal(result.randomizationDistinctForB, true);
    assert.equal(result.repeatedPlaintextA, a);
    assert.equal(result.repeatedPlaintextB, b);
  }
});

test("BFV demo rejects out-of-domain inputs rather than silently wrapping", async () => {
  for (const [a, b] of [[-1, 3], [101, 2], [2.5, 2], [NaN, 1]]) {
    await assert.rejects(runBfvDemo(a, b), RangeError);
  }
});
