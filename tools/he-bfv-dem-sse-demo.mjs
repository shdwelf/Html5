#!/usr/bin/env node
/**
 * Real, one-multiplication-depth BFV experiment of sum((sample-reference)^2).
 * Bounded quantized integer values. The default is synthetic; a separate
 * adapter can ingest measured 3DEP values (with explicit caveats). This is a
 * CLI experiment, not an encrypted/browser-integrated terrain viewer.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import SEAL from "node-seal";
import { DEM_SSE_EXAMPLE, demSseReference, validateDemSseInput } from "./fhe-dem-sse-contract.mjs";

/** Evaluator sees only paired ciphertexts and relinearization material. */
export function evaluateEncryptedDemSse(seal, context, relinKeys, encryptedPairs, own) {
  const evaluator = own(new seal.Evaluator(context));
  let sum;
  for (const [sample, reference] of encryptedPairs) {
    const residual = own(new seal.Ciphertext());
    evaluator.sub(sample, reference, residual);
    const squared = own(new seal.Ciphertext());
    evaluator.multiply(residual, residual, squared);
    if (!sum) sum = squared;
    else evaluator.addInplace(sum, squared);
  }
  evaluator.relinearizeInplace(sum, relinKeys);
  return sum;
}

export async function runDemSseBfvDemo(value = DEM_SSE_EXAMPLE) {
  const input = validateDemSseInput(value);
  const expected = demSseReference(input);
  const maxAggregate = input.samples.length * 1000 ** 2;
  const seal = await SEAL();
  const resources = [];
  const own = (resource) => { resources.push(resource); return resource; };
  try {
    const parameters = own(new seal.EncryptionParameters(seal.SchemeType.bfv));
    parameters.setPolyModulusDegree(8192);
    parameters.setCoeffModulus(own(seal.CoeffModulus.BFVDefault(8192, seal.SecLevelType.tc128)));
    const modulus = own(seal.PlainModulus.Batching(8192, 24));
    parameters.setPlainModulus(modulus);
    const context = own(new seal.SEALContext(parameters, true, seal.SecLevelType.tc128));
    if (!context.parametersSet()) throw new Error("SEAL rejected DEM-SSE parameters");
    const data = own(context.firstContextData()), qualifiers = own(data.qualifiers());
    if (!qualifiers.usingBatching || qualifiers.securityLevel.value !== 128) throw new Error("Expected a validated 128-bit batching context");
    const plainModulus = Number(modulus.value());
    assert.ok(plainModulus > maxAggregate, "plain modulus must prevent wraparound for the accepted SSE bound");
    const generator = own(new seal.KeyGenerator(context));
    const publicKey = own(generator.createPublicKey());
    const secretKey = own(generator.secretKey());
    const relinKeys = own(generator.createRelinKeys());
    const encoder = own(new seal.BatchEncoder(context));
    const encryptor = own(new seal.Encryptor(context, publicKey));
    const decryptor = own(new seal.Decryptor(context, secretKey));
    const encryptScalar = (value) => {
      const slots = new BigUint64Array(encoder.slotCount());
      slots.fill(BigInt(value));
      const plain = own(new seal.Plaintext()), cipher = own(new seal.Ciphertext());
      try { encoder.encode(slots, plain); encryptor.encrypt(plain, cipher); }
      finally { slots.fill(0n); plain.setZero(); }
      return cipher;
    };
    const encryptedPairs = input.samples.map((sample, i) => [encryptScalar(sample), encryptScalar(input.reference[i])]);
    const aggregate = evaluateEncryptedDemSse(seal, context, relinKeys, encryptedPairs, own);
    const noiseBudgetBits = decryptor.invariantNoiseBudget(aggregate);
    assert.ok(noiseBudgetBits > 0, "encrypted SSE exhausted BFV noise budget");
    const plain = own(new seal.Plaintext());
    decryptor.decrypt(aggregate, plain);
    const decoded = encoder.decodeBigUint64(plain);
    const squaredErrorSum = Number(decoded[0]);
    try { assert.equal(squaredErrorSum, expected.squaredErrorSum); }
    finally { plain.setZero(); decoded.fill(0n); }
    return {
      formula: "SSE = sum_i (sample_i - reference_i)^2",
      scope: "Leveled BFV exact-integer evaluation, multiplicative depth one, no bootstrapping; input provenance and meaning are supplied by the caller. Default CLI fixture is synthetic.",
      backend: "node-seal 7.0.0 / Microsoft SEAL 4.1.2",
      securityLevelBits: qualifiers.securityLevel.value,
      sampleCount: input.samples.length,
      plaintextModulus: plainModulus,
      noWrapBound: maxAggregate,
      squaredErrorSum,
      noiseBudgetBits,
      operations: { ciphertextSubtractions: input.samples.length, ciphertextMultiplications: input.samples.length, ciphertextAdditions: input.samples.length - 1, relinearizations: 1, multiplicativeDepth: 1, bootstraps: 0 },
      trustBoundary: "Both sample and reference values are encrypted. Evaluator receives paired ciphertexts plus relinearization keys; local owner decrypts one aggregate. Roles share a process in this demonstration.",
      limits: ["No range proofs, authenticated input, malicious security, differential privacy or guarantee that the aggregate does not disclose information.", "Finite leveled BFV only; no bootstrap, rotations, encrypted division, production protocol or integration into the browser 4DWM viewer.", "The default example is synthetic; the measured-data adapter uses non-co-located neighboring rows and does not assert a same-location 3DEP/DEM residual or terrain accuracy."],
    };
  } finally {
    for (const resource of resources.reverse()) resource.delete();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : DEM_SSE_EXAMPLE;
  console.log(JSON.stringify(await runDemSseBfvDemo(input), null, 2));
}
