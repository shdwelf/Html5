import assert from "node:assert/strict";
import test from "node:test";
import { DEM_SSE_EXAMPLE, demSseReference, validateDemSseInput } from "../tools/fhe-dem-sse-contract.mjs";
import { evaluateEncryptedDemSse, runDemSseBfvDemo } from "../tools/he-bfv-dem-sse-demo.mjs";

test("bounded SSE reference is exact and validates shape/range", () => {
  assert.deepEqual(demSseReference(DEM_SSE_EXAMPLE), { residuals: [5, -5, 10, 5], squaredErrorSum: 175 });
  assert.equal(validateDemSseInput(DEM_SSE_EXAMPLE).samples.length, 4);
  for (const value of [null, [], {}, { ...DEM_SSE_EXAMPLE, schema: 2 }, { ...DEM_SSE_EXAMPLE, extra: true },
    { schema: 1, samples: [1], reference: [] }, { schema: 1, samples: [], reference: [] },
    { schema: 1, samples: Array(9).fill(0), reference: Array(9).fill(0) },
    { schema: 1, samples: [-1], reference: [0] }, { schema: 1, samples: [1001], reference: [0] },
    { schema: 1, samples: [1.5], reference: [0] }]) assert.throws(() => validateDemSseInput(value));
});

test("real BFV encrypts both synthetic vectors and evaluates depth-one SSE", async () => {
  const result = await runDemSseBfvDemo(DEM_SSE_EXAMPLE);
  assert.equal(result.squaredErrorSum, 175);
  assert.equal(result.securityLevelBits, 128);
  assert.equal(result.sampleCount, 4);
  assert.ok(result.plaintextModulus > result.noWrapBound);
  assert.ok(result.noiseBudgetBits > 0);
  assert.equal(result.operations.multiplicativeDepth, 1);
  assert.equal(result.operations.relinearizations, 1);
  assert.equal(result.operations.bootstraps, 0);
  assert.match(result.scope, /no bootstrapping/);
  assert.match(result.limits.join(" "), /do not assert a measured 3DEP\/DEM residual or terrain accuracy/i);

  const boundary = await runDemSseBfvDemo({ schema: 1, samples: Array(8).fill(1000), reference: Array(8).fill(0) });
  assert.equal(boundary.squaredErrorSum, 8_000_000);
  assert.ok(boundary.plaintextModulus > boundary.noWrapBound);
  assert.ok(boundary.noiseBudgetBits > 0);
});

test("ciphertext evaluator has no decryptor, secret key or plaintext inputs", () => {
  const source = evaluateEncryptedDemSse.toString();
  assert.doesNotMatch(source, /secretKey|decrypt|Plaintext|encryptor/);
  assert.match(source, /evaluator\.sub/);
  assert.match(source, /evaluator\.multiply/);
  assert.match(source, /relinearizeInplace/);
});
