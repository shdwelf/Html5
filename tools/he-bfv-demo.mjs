#!/usr/bin/env node
/**
 * Locally executable, bounded-depth homomorphic arithmetic example.
 *
 * BFV encrypts integer slots; the evaluator adds, subtracts and multiplies
 * ciphertexts without seeing their plaintext. Subtraction is modulo the BFV
 * plaintext prime. It is leveled HE, NOT an unbounded/FHE demo:
 * node-seal 7 / SEAL 4.1.2 do not provide bootstrapping in this example.
 * A small known-plaintext regression also re-encrypts the same values and
 * checks their serialized ciphertexts differ and decrypt correctly. This is
 * not a security proof. Keys and ciphertexts exist only in memory; do not use
 * as a key-management or multi-party deployment template. Run
 * `npm ci && npm run demo:bfv`.
 */

import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import SEAL from "node-seal";

function evaluateEncrypted(seal, context, relinKeys, ciphertextA, ciphertextB, own) {
  // Server-side boundary: only evaluation key + ciphertexts; no secret key,
  // decryptor, plaintext inputs, or decoded values are passed here.
  const evaluator = own(new seal.Evaluator(context));
  const sum = own(new seal.Ciphertext());
  const difference = own(new seal.Ciphertext());
  const product = own(new seal.Ciphertext());
  evaluator.add(ciphertextA, ciphertextB, sum);
  evaluator.sub(ciphertextA, ciphertextB, difference);
  evaluator.multiply(ciphertextA, ciphertextB, product);
  evaluator.relinearizeInplace(product, relinKeys);
  return { sum, difference, product };
}

/** @returns {Promise<{sum:number,differenceResidue:number,product:number,plainModulus:number,securityLevelBits:number,noiseBudgetBits:number,randomizationDistinctForA:boolean,randomizationDistinctForB:boolean,repeatedPlaintextA:number,repeatedPlaintextB:number}>} */
export async function runBfvDemo(a = 3, b = 5) {
  // Keep examples within the plaintext modulus so arithmetic doesn't wrap.
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) {
    throw new RangeError("BFV demo inputs must be integers from 0 through 100");
  }

  const seal = await SEAL();
  const resources = [];
  const own = (resource) => { resources.push(resource); return resource; };
  try {
    // Use the library's 128-bit security-level parameter selection, not an
    // ad-hoc polynomial size or a context that disables security validation.
    const parameters = own(new seal.EncryptionParameters(seal.SchemeType.bfv));
    parameters.setPolyModulusDegree(4096);
    parameters.setCoeffModulus(own(seal.CoeffModulus.BFVDefault(4096, seal.SecLevelType.tc128)));
    const plainModulus = own(seal.PlainModulus.Batching(4096, 20));
    parameters.setPlainModulus(plainModulus);
    const modulus = plainModulus.value();
    const context = own(new seal.SEALContext(parameters, true, seal.SecLevelType.tc128));
    if (!context.parametersSet()) throw new Error("SEAL rejected BFV parameters");
    const contextData = own(context.firstContextData());
    const qualifiers = own(contextData.qualifiers());
    const securityLevelBits = qualifiers.securityLevel.value;
    if (!qualifiers.parametersSet() || !qualifiers.usingBatching || securityLevelBits !== 128) {
      throw new Error("SEAL did not validate the 128-bit batching context");
    }

    const keyGenerator = own(new seal.KeyGenerator(context));
    const publicKey = own(keyGenerator.createPublicKey());
    const secretKey = own(keyGenerator.secretKey()); // client-only; never export or log
    const relinKeys = own(keyGenerator.createRelinKeys()); // evaluation key
    const encoder = own(new seal.BatchEncoder(context));
    const encryptor = own(new seal.Encryptor(context, publicKey));
    const decryptor = own(new seal.Decryptor(context, secretKey));
    const encrypt = (value) => {
      const slots = new BigUint64Array(encoder.slotCount());
      slots[0] = BigInt(value);
      const plain = own(new seal.Plaintext());
      encoder.encode(slots, plain);
      const encrypted = own(new seal.Ciphertext());
      encryptor.encrypt(plain, encrypted);
      plain.setZero();
      return encrypted;
    };

    const ciphertextA = encrypt(a);
    const ciphertextB = encrypt(b);
    // A known-plaintext regression check: encrypt each known input a second
    // time under the same key. SEAL's encryption randomness, not an added
    // plaintext/LT mask, should make these serialized ciphertexts differ.
    const repeatedCiphertextA = encrypt(a);
    const repeatedCiphertextB = encrypt(b);
    const ciphertextsDiffer = (left, right) => {
      const leftBytes = left.saveToArray(seal.ComprModeType.none);
      const rightBytes = right.saveToArray(seal.ComprModeType.none);
      try {
        if (leftBytes.length !== rightBytes.length) return true;
        for (let i = 0; i < leftBytes.length; i++) {
          if (leftBytes[i] !== rightBytes[i]) return true;
        }
        return false;
      } finally {
        leftBytes.fill(0);
        rightBytes.fill(0);
      }
    };
    const randomizationDistinctForA = ciphertextsDiffer(ciphertextA, repeatedCiphertextA);
    const randomizationDistinctForB = ciphertextsDiffer(ciphertextB, repeatedCiphertextB);
    if (!randomizationDistinctForA || !randomizationDistinctForB) {
      throw new Error("Fresh BFV encryptions of known plaintexts unexpectedly matched");
    }

    const { sum, difference, product } = evaluateEncrypted(
      seal, context, relinKeys, ciphertextA, ciphertextB, own
    );
    const decrypt = (ciphertext) => {
      const plain = own(new seal.Plaintext());
      decryptor.decrypt(ciphertext, plain);
      const decoded = encoder.decodeBigUint64(plain)[0];
      plain.setZero();
      return Number(decoded);
    };
    const repeatedPlaintextA = decrypt(repeatedCiphertextA);
    const repeatedPlaintextB = decrypt(repeatedCiphertextB);
    assert.equal(repeatedPlaintextA, a);
    assert.equal(repeatedPlaintextB, b);
    const result = {
      sum: decrypt(sum),
      differenceResidue: decrypt(difference),
      product: decrypt(product),
      plainModulus: Number(modulus),
      securityLevelBits,
      noiseBudgetBits: decryptor.invariantNoiseBudget(product),
      randomizationDistinctForA,
      randomizationDistinctForB,
      repeatedPlaintextA,
      repeatedPlaintextB,
    };
    assert.equal(result.sum, a + b);
    assert.equal(result.differenceResidue, Number((BigInt(a) - BigInt(b) + modulus) % modulus));
    assert.equal(result.product, a * b);
    assert.ok(result.noiseBudgetBits > 0, "multiplication exhausted BFV noise budget");
    return result;
  } finally {
    // Free WASM-side keys, ciphertexts and plaintexts even if a check fails.
    for (const resource of resources.reverse()) resource.delete();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { sum, differenceResidue, product, plainModulus,
    securityLevelBits, noiseBudgetBits, randomizationDistinctForA,
    randomizationDistinctForB, repeatedPlaintextA, repeatedPlaintextB } = await runBfvDemo();
  console.log(`BFV encrypted evaluation: 3 + 5 = ${sum}; 3 − 5 ≡ ${differenceResidue} (mod ${plainModulus}); 3 × 5 = ${product}`);
  console.log(`SEAL context: ${securityLevelBits}-bit parameter check, ${noiseBudgetBits}-bit remaining noise budget`);
  console.log(`Known-plaintext randomization check: repeated 3 distinct=${randomizationDistinctForA}, decrypt=${repeatedPlaintextA}; repeated 5 distinct=${randomizationDistinctForB}, decrypt=${repeatedPlaintextB}`);
  console.log("Bounded-depth leveled HE; no encrypted-denominator division or bootstrapping here.");
}
