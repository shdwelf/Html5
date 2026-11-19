#!/usr/bin/env node
/**
 * Real, finite-depth BFV experiment, inspired by the encrypted-selection-mask
 * boundary in Lancelot. NOT Lancelot, robust FL, encrypted sorting or FHE with
 * bootstrapping. Roles are co-located in this test process, not a deployed trust
 * separation. Only synthetic/public workload data; no keys/ciphertexts exported.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import SEAL from "node-seal";
import { MASK_EXAMPLE, validateMaskInput, maskReference } from "./fhe-mask-contract.mjs";

/** Evaluator boundary: ciphertexts + evaluation key only, no selection/plaintexts/secret key. */
export function evaluateEncryptedMasks(seal, context, relinKeys, encryptedUpdates, encryptedMasks, own) {
  const evaluator = own(new seal.Evaluator(context));
  let aggregate;
  for (let i = 0; i < encryptedUpdates.length; i++) {
    const product = own(new seal.Ciphertext());
    evaluator.multiply(encryptedUpdates[i], encryptedMasks[i], product);
    if (!aggregate) aggregate = product;
    else evaluator.addInplace(aggregate, product);
  }
  // Every product has equal size/level. Relinearize once AFTER the sum (lazy).
  evaluator.relinearizeInplace(aggregate, relinKeys);
  return aggregate;
}

export async function runMaskedBfvDemo(value = MASK_EXAMPLE) {
  const input = validateMaskInput(value);
  const reference = maskReference(input);
  const seal = await SEAL();
  const resources = [];
  const own = (resource) => { resources.push(resource); return resource; };
  try {
    const parameters = own(new seal.EncryptionParameters(seal.SchemeType.bfv));
    parameters.setPolyModulusDegree(4096);
    parameters.setCoeffModulus(own(seal.CoeffModulus.BFVDefault(4096, seal.SecLevelType.tc128)));
    const modulus = own(seal.PlainModulus.Batching(4096, 20));
    parameters.setPlainModulus(modulus);
    const context = own(new seal.SEALContext(parameters, true, seal.SecLevelType.tc128));
    if (!context.parametersSet()) throw new Error("SEAL rejected mask-demo parameters");
    const data = own(context.firstContextData()), qualifiers = own(data.qualifiers());
    if (!qualifiers.usingBatching || qualifiers.securityLevel.value !== 128) throw new Error("Expected a validated 128-bit batching context");
    const plainModulus = Number(modulus.value());
    assert.ok(plainModulus > 16 * 100, "workload bounds must prevent plaintext wraparound");
    const generator = own(new seal.KeyGenerator(context));
    const publicKey = own(generator.createPublicKey());
    const secretKey = own(generator.secretKey());
    const relinKeys = own(generator.createRelinKeys());
    const encoder = own(new seal.BatchEncoder(context));
    const encryptor = own(new seal.Encryptor(context, publicKey));
    const decryptor = own(new seal.Decryptor(context, secretKey));
    const encrypt = (values) => {
      const slots = new BigUint64Array(encoder.slotCount());
      values.forEach((value, index) => { slots[index] = BigInt(value); });
      const plain = own(new seal.Plaintext()), cipher = own(new seal.Ciphertext());
      try { encoder.encode(slots, plain); encryptor.encrypt(plain, cipher); }
      finally { slots.fill(0n); plain.setZero(); }
      return cipher;
    };
    const encryptedUpdates = input.updates.map(encrypt);
    const encryptedMasks = input.selection.map((bit) => encrypt(Array(input.updates[0].length).fill(bit)));
    const repeatedMask = encrypt(Array(input.updates[0].length).fill(input.selection[0]));
    const left = encryptedMasks[0].saveToArray(seal.ComprModeType.none), right = repeatedMask.saveToArray(seal.ComprModeType.none);
    let freshMaskCiphertextsDiffer;
    try { freshMaskCiphertextsDiffer = !Buffer.from(left).equals(Buffer.from(right)); }
    finally { left.fill(0); right.fill(0); }
    assert.equal(freshMaskCiphertextsDiffer, true, "fresh mask encryption must not be a deterministic plaintext mask");
    const aggregate = evaluateEncryptedMasks(seal, context, relinKeys, encryptedUpdates, encryptedMasks, own);
    const noiseBudgetBits = decryptor.invariantNoiseBudget(aggregate);
    assert.ok(noiseBudgetBits > 0, "mask aggregation exhausted BFV noise budget");
    const plain = own(new seal.Plaintext());
    decryptor.decrypt(aggregate, plain);
    const decoded = encoder.decodeBigUint64(plain);
    let selectedSum;
    try { selectedSum = Array.from(decoded.subarray(0, input.updates[0].length), Number); }
    finally { plain.setZero(); decoded.fill(0n); }
    assert.deepEqual(selectedSum, reference.selectedSum);
    return {
      scope: "Real leveled BFV encrypted-mask aggregation only; finite depth, no bootstrapping, sorting, BRFL guarantee or production protocol.",
      backend: "node-seal 7.0.0 / Microsoft SEAL 4.1.2",
      securityLevelBits: qualifiers.securityLevel.value, plainModulus,
      noiseBudgetBits, freshMaskCiphertextsDiffer,
      selectedSum, selectedCount: reference.selectedCount,
      meanAfterDecryption: reference.meanAfterDecryption,
      operations: { ciphertextMultiplications: input.updates.length, ciphertextAdditions: input.updates.length - 1, relinearizations: 1, multiplicativeDepth: 1, bootstraps: 0 },
      trustBoundary: "Clients and trusted selector encrypt under one public key. The evaluator receives only ciphertexts and a relinearization key. A trusted owner decrypts the aggregate; selector count/mean arithmetic here is outside encryption. Roles are not process-isolated.",
      limits: ["No proof that a malicious selector encrypted bits or that a client encrypted bounded updates.", "No encrypted distance computation, sorting, Krum/Multi-Krum, key distribution, authentication, differential privacy or output-privacy guarantee.", "An aggregate or single-client selection can reveal inputs. Fresh randomization checks are regressions, not a security proof."],
    };
  } finally {
    for (const resource of resources.reverse()) resource.delete();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : MASK_EXAMPLE;
  console.log(JSON.stringify(await runMaskedBfvDemo(value), null, 2));
}
