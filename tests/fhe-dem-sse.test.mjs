import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEM_SSE_EXAMPLE, demSseReference, validateDemSseInput } from "../tools/fhe-dem-sse-contract.mjs";
import { evaluateEncryptedDemSse, runDemSseBfvDemo } from "../tools/he-bfv-dem-sse-demo.mjs";
import { prepareRealDemSseInput } from "../tools/fhe-dem-sse-real-dem.mjs";

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
  assert.match(result.limits.join(" "), /does not assert a same-location 3DEP\/DEM residual or terrain accuracy/i);

  const boundary = await runDemSseBfvDemo({ schema: 1, samples: Array(8).fill(1000), reference: Array(8).fill(0) });
  assert.equal(boundary.squaredErrorSum, 8_000_000);
  assert.ok(boundary.plaintextModulus > boundary.noWrapBound);
  assert.ok(boundary.noiseBudgetBits > 0);
});

test("measured Lawrence 3DEP anchors enter the bounded SSE contract with provenance caveats", () => {
  const source = JSON.parse(readFileSync(new URL("../data/lawrence/dem-anchors.json", import.meta.url), "utf8"));
  const prepared = prepareRealDemSseInput(source);
  assert.equal(prepared.input.samples.length, 8);
  assert.equal(prepared.provenance.sourceProduct, source.meta.sourceProduct);
  assert.equal(prepared.provenance.verticalDatum, source.meta.verticalDatum);
  assert.equal(prepared.provenance.sampleCount, 8);
  assert.match(prepared.provenance.interpretation, /different neighboring grid rows/i);
  assert.match(prepared.provenance.interpretation, /not a same-cell DEM comparison/i);
  assert.ok(Math.max(...prepared.input.samples, ...prepared.input.reference) <= 1000);
  const reference = demSseReference(prepared.input);
  assert.equal(reference.squaredErrorSum, prepared.input.samples.reduce((sum, v, i) => sum + (v - prepared.input.reference[i]) ** 2, 0));
  assert.throws(() => prepareRealDemSseInput(source, { count: 9 }), /count must be 1–8/);
  assert.throws(() => prepareRealDemSseInput({ ...source, grid: { ...source.grid, values: [NaN, ...source.grid.values.slice(1)] } }), /finite/);
});

test("BFV evaluates the measured-data adapter output without changing its bounded integer result", async () => {
  const source = JSON.parse(readFileSync(new URL("../data/lawrence/dem-anchors.json", import.meta.url), "utf8"));
  const { input, provenance } = prepareRealDemSseInput(source);
  const expected = demSseReference(input).squaredErrorSum;
  const result = await runDemSseBfvDemo(input);
  assert.equal(result.squaredErrorSum, expected);
  assert.equal(result.sampleCount, provenance.sampleCount);
  assert.equal(result.securityLevelBits, 128);
  assert.ok(result.noiseBudgetBits > 0);
});

test("ciphertext evaluator has no decryptor, secret key or plaintext inputs", () => {
  const source = evaluateEncryptedDemSse.toString();
  assert.doesNotMatch(source, /secretKey|decrypt|Plaintext|encryptor/);
  assert.match(source, /evaluator\.sub/);
  assert.match(source, /evaluator\.multiply/);
  assert.match(source, /relinearizeInplace/);
});
