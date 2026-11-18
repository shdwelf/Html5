import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { MASK_EXAMPLE, validateMaskInput, maskReference } from "../tools/fhe-mask-contract.mjs";
import { runMaskedBfvDemo, evaluateEncryptedMasks } from "../tools/he-bfv-mask-demo.mjs";

const dom = new JSDOM(readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8"), {
  runScripts: "dangerously", url: "https://kitchen.example.test/", pretendToBeVisual: true,
  beforeParse(w) { w.alert = () => {}; w.confirm = () => false; w.prompt = () => null; w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; },
});
after(() => dom.window.close());
const run = (value) => JSON.parse(dom.window.eval(`OPERATIONS.find(o=>o.id==='fheMaskLab').run(${JSON.stringify(typeof value === "string" ? value : JSON.stringify(value))},{})`));

test("Kitchen v2 is a separate bounded plaintext reference with explicit trust boundaries", () => {
  const result = run(MASK_EXAMPLE);
  assert.match(result.scope, /NO encryption/);
  assert.equal(result.workload_version, 2);
  assert.deepEqual(result.selectedSum, [6, 8]); assert.equal(result.selectedCount, 2);
  assert.deepEqual(result.meanOutsideCiphertextEvaluation, [3, 4]);
  assert.equal(result.operations_in_separate_bfv_experiment.bootstraps, 0);
  assert.match(result.trust_boundaries.join(" "), /decrypt and sort/);
  assert.match(result.trust_boundaries.join(" "), /not a deployed/);
  const packs = JSON.parse(JSON.stringify(dom.window.eval("RECIPE_PACKS")));
  assert.deepEqual(packs["FHE Study — Masked aggregation v2 (plaintext reference, BFV companion CLI)"], [["fheMaskLab", {}]]);
  assert.ok(packs["Full Coverage — Educational"].some(([id]) => id === "fheMaskLab"));
  assert.equal(dom.window.eval("OPERATIONS.length"), 525);
});

test("browser/reference agree over selection boundaries and reject malformed workloads", () => {
  for (const input of [MASK_EXAMPLE, { schema: 1, updates: [[1], [100]], selection: [0, 0] }, { schema: 1, updates: Array.from({ length: 16 }, () => Array(32).fill(100)), selection: Array(16).fill(1) }]) {
    const result = run(input), reference = maskReference(input);
    assert.deepEqual(result.selectedSum, reference.selectedSum);
    assert.equal(result.selectedCount, reference.selectedCount);
    assert.deepEqual(result.meanOutsideCiphertextEvaluation, reference.meanAfterDecryption);
  }
  const zero = run({ schema: 1, updates: [[1]], selection: [0] });
  assert.equal(zero.empty_selection, true); assert.equal(zero.meanOutsideCiphertextEvaluation, null);
  for (const input of [null, {}, [], { ...MASK_EXAMPLE, schema: 2 }, { ...MASK_EXAMPLE, script: "bad" }, { ...MASK_EXAMPLE, selection: [2, 0, 1] }, { ...MASK_EXAMPLE, updates: [[-1], [1], [1]] }, { ...MASK_EXAMPLE, updates: [[1], [2, 3], [1]] }, { ...MASK_EXAMPLE, selection: [] }, { ...MASK_EXAMPLE, updates: Array(17).fill([0]), selection: Array(17).fill(0) }]) {
    assert.throws(() => validateMaskInput(input)); assert.throws(() => run(input));
  }
  assert.throws(() => run("x".repeat(16385)), /16384/);
});

test("real BFV encrypts updates AND masks, lazily relinearizes, matches exact oracle", async () => {
  const workloads = [
    MASK_EXAMPLE,
    { schema: 1, updates: [[1, 100], [2, 0]], selection: [0, 0] },
    { schema: 1, updates: Array.from({ length: 16 }, () => Array(32).fill(100)), selection: Array(16).fill(1) },
  ];
  for (const input of workloads) {
    const result = await runMaskedBfvDemo(input), reference = maskReference(input);
    assert.deepEqual(result.selectedSum, reference.selectedSum);
    assert.deepEqual(result.meanAfterDecryption, reference.meanAfterDecryption);
    assert.equal(result.freshMaskCiphertextsDiffer, true);
    assert.equal(result.securityLevelBits, 128); assert.ok(result.noiseBudgetBits > 0);
    assert.equal(result.operations.ciphertextMultiplications, input.updates.length);
    assert.equal(result.operations.relinearizations, 1);
    assert.equal(result.operations.multiplicativeDepth, 1); assert.equal(result.operations.bootstraps, 0);
    assert.match(result.scope, /no bootstrapping/);
    assert.equal(Object.keys(result).some((key) => /secret|ciphertext|private/i.test(key) && key !== "freshMaskCiphertextsDiffer"), false);
  }
});

test("evaluator boundary accepts only ciphertexts and evaluation material; no decryption or plaintext mask", () => {
  const source = evaluateEncryptedMasks.toString();
  assert.doesNotMatch(source, /secretKey|decrypt|selection|Plaintext|encryptor/);
  assert.match(source, /evaluator\.multiply/); assert.match(source, /relinearizeInplace/);
});
