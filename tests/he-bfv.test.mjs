import assert from "node:assert/strict";
import { test } from "node:test";
import { runBfvDemo } from "../tools/he-bfv-demo.mjs";

test("BFV really evaluates addition and multiplication on encrypted inputs", async () => {
  for (const [a, b] of [[3, 5], [0, 100], [100, 100]]) {
    const result = await runBfvDemo(a, b);
    assert.equal(result.sum, a + b);
    assert.equal(result.product, a * b);
    assert.equal(result.securityLevelBits, 128);
    assert.ok(result.noiseBudgetBits > 0);
  }
});

test("BFV demo rejects out-of-domain inputs rather than silently wrapping", async () => {
  for (const [a, b] of [[-1, 3], [101, 2], [2.5, 2], [NaN, 1]]) {
    await assert.rejects(runBfvDemo(a, b), RangeError);
  }
});
