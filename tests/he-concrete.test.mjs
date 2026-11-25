import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { test } from "node:test";

function readPublicCircuitSpec() {
  // -I -S disables user/site packages: this contract check must not need
  // Concrete, Torch, or cryptography (and does not pretend to evaluate FHE).
  const run = spawnSync("python3", ["-I", "-S", "tools/he_concrete_spec.py"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, "");
  assert.ok(run.stdout.endsWith("\n"));
  const canonical = run.stdout.replace(/\r?\n$/, ""); // omit the CLI's display newline
  return {
    spec: JSON.parse(canonical),
    sha256: createHash("sha256").update(canonical, "utf8").digest("hex"),
  };
}

test("Concrete's public circuit contract binds composability without optional runtime packages", () => {
  const { spec, sha256 } = readPublicCircuitSpec();
  assert.equal(spec.circuit_id, "f17-complete-field-arithmetic-v6");
  assert.equal(spec.schema, "arena-fhe-circuit-manifest-v1");
  assert.equal(spec.frontend, "concrete-python==2.11.0");
  assert.equal(spec.composable, true);
  assert.equal(spec.compress_evaluation_keys, true);
  assert.equal(spec.security_level_bits, 128);
  assert.equal(spec.target_p_error_per_tlu, 1.6e-6);
  assert.equal(spec.arithmetic_modulus, 17);
  assert.deepEqual(spec.input_domain, { x: [0, 16], y: [0, 16] });
  assert.deepEqual(spec.multiplication_chunk_widths, [2, 2, 1]);
  assert.deepEqual(spec.table_index_bounds, {
    modular_reduction_inclusive_max: 33,
    multivariate_packed_input_bit_width_max: 7,
    square_lookup_inclusive_max: 33,
  });
  // Known-answer hash of the canonical v6 contract, not a compiled binary.
  assert.equal(sha256, "71c5c1366bc27b6df892154422b7bdaff6cc8f38de8d76851044eed532802235");
});

// Concrete (and Torch) are optional, multi-GB dependencies. Enable explicitly
// after installing tools/he-concrete-requirements.txt in CPython 3.11. The key
// transport mode may temporarily duplicate a large keyset in this process.
const runConcreteFhe = process.env.RUN_CONCRETE_FHE === "1";
const runConcreteKeyTransport = process.env.RUN_CONCRETE_FHE_KEY_TRANSPORT === "1";
test("Concrete bootstraps and key-switches complete F17 arithmetic with wire, randomization and provenance audits", {
  skip: !runConcreteFhe && !runConcreteKeyTransport && "set RUN_CONCRETE_FHE=1 after installing Concrete",
}, () => {
  const args = ["tools/he-concrete-fhe-demo.py"];
  if (runConcreteKeyTransport) args.push("--roundtrip-evaluation-keys");
  const run = spawnSync("python3", args, {
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
    security_level_bits: securityLevelBits,
    composable,
    probability_of_error: probabilityOfError,
    programmable_bootstraps: bootstraps,
    key_switches: keySwitches,
    packing_key_switches: packingKeySwitches,
    evaluation_keys_serialized_bytes: evaluationKeysSerializedBytes,
    evaluation_keys_deserialized_for_server: evaluationKeysDeserialized,
    ciphertext_transport_roundtrips_verified: ciphertextTransportVerified,
    evaluation_key_provenance_verified: provenanceVerified,
    tampered_evaluation_key_rejected: tamperedKeyRejected,
    tampered_evaluation_key_signature_rejected: tamperedSignatureRejected,
    wrong_circuit_binding_rejected: wrongCircuitRejected,
    wrong_configuration_binding_rejected: wrongConfigurationRejected,
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
    reduction_index_max: 33,
    square_index_max: 33,
    square_modulus: 17,
  });
  assert.ok(bootstraps > 0, "compiled circuit must contain programmable bootstrapping");
  assert.ok(keySwitches > 0, "compiled circuit must contain key switching");
  assert.ok(packingKeySwitches >= 0);
  assert.ok(evaluationKeysSerializedBytes > 0, "client must serialize evaluation keys for provenance/transport");
  assert.equal(evaluationKeysDeserialized, runConcreteKeyTransport);
  assert.equal(ciphertextTransportVerified, true, "request and response ciphertexts cross wire serialization");
  assert.equal(securityLevelBits, 128);
  const declared = readPublicCircuitSpec();
  assert.equal(composable, declared.spec.composable);
  assert.equal(demo.circuit_id, declared.spec.circuit_id);
  assert.equal(demo.circuit_spec_sha256, declared.sha256);
  assert.equal(probabilityOfError.target_per_tlu, 1.6e-6);
  assert.ok(probabilityOfError.actual_per_tlu > 0);
  assert.ok(probabilityOfError.actual_per_tlu <= probabilityOfError.target_per_tlu);
  assert.ok(probabilityOfError.global_per_invocation >= probabilityOfError.actual_per_tlu);
  assert.match(demo.circuit_spec_sha256, /^[a-f0-9]{64}$/);
  assert.equal(provenanceVerified, true);
  assert.equal(tamperedKeyRejected, true);
  assert.equal(tamperedSignatureRejected, true);
  assert.equal(wrongCircuitRejected, true);
  assert.equal(wrongConfigurationRejected, true);
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
