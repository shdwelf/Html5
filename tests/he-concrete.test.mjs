import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

// Concrete (and Torch) are optional, multi-GB dependencies. Enable explicitly
// after installing tools/he-concrete-requirements.txt in CPython 3.11.
test("Concrete bootstraps complete F17 arithmetic with randomization, provenance and failure checks", {
  skip: process.env.RUN_CONCRETE_FHE !== "1" && "set RUN_CONCRETE_FHE=1 after installing Concrete",
}, () => {
  const run = spawnSync("python3", ["tools/he-concrete-fhe-demo.py"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    timeout: 900_000,
    env: { ...process.env, OMP_NUM_THREADS: "1", MKL_NUM_THREADS: "1", OPENBLAS_NUM_THREADS: "1" },
  });
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
  const demo = JSON.parse(run.stdout);
  const {
    modulus,
    plaintext_min: plaintextMin,
    plaintext_max: plaintextMax,
    bounds,
    programmable_bootstraps: bootstraps,
    evaluation_key_provenance_verified: provenanceVerified,
    tampered_evaluation_key_rejected: tamperedKeyRejected,
    tampered_evaluation_key_signature_rejected: tamperedSignatureRejected,
    wrong_circuit_binding_rejected: wrongCircuitRejected,
    out_of_range_input_rejected: outOfRangeRejected,
    randomization_audit: randomizationAudit,
    composition_audit: compositionAudit,
    results,
  } = demo;

  assert.equal(modulus, 17);
  assert.equal(plaintextMin, 0);
  assert.equal(plaintextMax, 16);
  assert.deepEqual(bounds, {
    raw_product_max: 256,
    reduction_index_max: 256,
    square_index_max: 33,
    square_modulus: 17,
  });
  assert.ok(bootstraps > 0, "compiled circuit must contain programmable bootstrapping");
  assert.match(demo.circuit_spec_sha256, /^[a-f0-9]{64}$/);
  assert.equal(provenanceVerified, true);
  assert.equal(tamperedKeyRejected, true);
  assert.equal(tamperedSignatureRejected, true);
  assert.equal(wrongCircuitRejected, true);
  assert.equal(outOfRangeRejected, true);
  assert.deepEqual(compositionAudit, {
    depth: 8,
    decryption_matches_oracle: true,
  });

  assert.equal(results.length, 17 * 17, "all ordered F17 input pairs must be evaluated");
  for (const [sequence, row] of results.entries()) {
    const { x, y, square, sum, difference, product, quotient, divisor_valid: divisorValid } = row;
    assert.equal(row.sequence, sequence);
    assert.ok(x >= plaintextMin && x <= plaintextMax);
    assert.ok(y >= plaintextMin && y <= plaintextMax);
    const expectedProduct = (x * y) % modulus;
    assert.equal(square, (expectedProduct + x + 1) ** 2 % modulus);
    assert.equal(sum, (x + y) % modulus);
    assert.equal(difference, ((x - y) % modulus + modulus) % modulus);
    assert.equal(product, expectedProduct);
    assert.equal(divisorValid, Number(y !== 0));
    if (divisorValid) {
      assert.equal((quotient * y) % modulus, x);
    } else {
      assert.equal(quotient, 0, "zero divisor has no quotient result");
    }
  }

  assert.deepEqual(randomizationAudit.known_plaintexts, [[2, 1], [2, 0]]);
  assert.equal(randomizationAudit.same_plaintext_ciphertexts_differ, true);
  assert.equal(randomizationAudit.different_examples_ciphertexts_differ, true);
  assert.equal(randomizationAudit.repeated_evaluations_decrypt_equal, true);
  assert.equal(randomizationAudit.known_outputs_match_plaintext_oracle, true);
});
