# FHE Masked Aggregation v2 — a different recipe and a real BFV companion

## Deliverables and labels

This is a **new workload**, not a renaming of the existing Study Lab or manual
Architecture Profile:

- Kitchen operation `fheMaskLab`: **FHE Masked Aggregation v2 (plaintext
  reference)**, a bounded synthetic workload oracle with a dedicated pack and
  Full Coverage entry. Kitchen now has 525 operations.
- `tools/fhe-mask-contract.mjs`: shared workload bounds / exact reference.
- `tools/he-bfv-mask-demo.mjs`: actual randomized encryption of both client
  vectors and selection masks using node-seal 7.0.0 / Microsoft SEAL 4.1.2 BFV,
  ciphertext evaluation, lazy relinearization and local aggregate decryption.
- `tests/fhe-mask.test.mjs`: browser/CLI reference equivalence, malformed inputs,
  empty selection, largest allowed workload, real encrypted evaluation and the
  evaluator's deliberately narrow function signature.

**The browser recipe does not encrypt anything.** The separate CLI is a real
**leveled, nonbootstrapped BFV** experiment of multiplicative depth one. Neither
implements full Lancelot, encrypted sorting/distances, Krum/Multi-Krum, CKKS,
vehicle control, a blockchain or production federated learning. The existing
Concrete/F17 bootstrapped experiment remains a separate backend/circuit; it is
not loaded by this recipe.

## Additional connected-resource research

Two additional resource excerpts were reviewed without publishing the source
files or private cloud identifiers. Both extractions were **explicitly
truncated**; only their visible openings are evidence here, not a complete
paper/security/benchmark reproduction.

1. *Towards compute-efficient Byzantine-robust federated learning with fully
   homomorphic encryption*, DOI
   [10.1038/s42256-025-01107-6](https://doi.org/10.1038/s42256-025-01107-6),
   Lancelot. The visible system model puts decrypting/sorting encrypted distances
   at a trusted key-generation centre. The centre encrypts a client-selection
   mask; the server applies that mask to encrypted model updates and aggregates;
   the centre decrypts the aggregate. Lazy relinearization/dynamic hoisting/GPU
   acceleration and a reported 20-fold result are paper claims in a particular
   setup, **not reproduced speedups in this repository**.
2. *The Data Protection of Intelligent Connected Vehicles Cloud Control
   Framework Using Fully Homomorphic Encryption*, DOI
   [10.1109/CVCI51460.2020.9338620](https://doi.org/10.1109/CVCI51460.2020.9338620).
   Its visible opening describes OEM engine-map encrypted cloud computation and
   a consortium audit trail. Although BGV theory appears, the verification
   explicitly uses **CKKS through Microsoft SEAL and Hyperledger Fabric**.
   The BFV mask companion here is not a reproduction of that experiment. No
   engine-map coefficients/timings, vehicle-control loop or ledger was rebuilt.

The engineering takeaway is to make **interactive trust boundaries** and the
separation of confidentiality, robust selection and audit logging explicit.
An FHE label alone provides neither Byzantine robustness nor a proof that an
untrusted evaluator computed the intended result. A ledger usage record is
not a ciphertext-correctness proof or an output-privacy mechanism.

## Workload contract and example

```json
{"schema":1,"updates":[[2,3],[10,20],[4,5]],"selection":[1,0,1]}
```

Bounds: 1–16 clients; 1–32 features; rectangular integer update rows in 0…100;
one 0/1 mask per client; no extra schema keys. Kitchen caps UTF-8 input at 16 KiB.
The largest sum is 1,600, below the selected BFV batching modulus 1,032,193,
so the accepted nonnegative workload has no plaintext wraparound.

Expected selected sum is **[6, 8]** and selected count **2**. The displayed mean
**[3, 4]** is ordinary arithmetic **after decryption**, not encrypted division.
An empty selection gives a zero sum/count and **null mean**, never a misleading
zero average. These synthetic values are not personal/model/vehicle data.

## Actual encrypted sequence

```sh
npm run demo:bfv-mask
# or: node tools/he-bfv-mask-demo.mjs path/to/bounded-synthetic-input.json
node --test tests/fhe-mask.test.mjs
```

1. Set BFV polynomial degree 4096, SEAL BFVDefault coefficient moduli and a
   20-bit batching plain modulus; require SEAL's `tc128` validation and batching.
2. Generate a public/secret key and relinearization keys locally. Client/selector
   inputs are encoded and **independently encrypted** under that public key.
3. Pass **only encrypted updates, encrypted masks, context and relinearization
   material** to `evaluateEncryptedMasks`. It does not take a selection array or
   secret key. Multiply matching ciphertext slots, add client products, then
   **relinearize once after the sum** rather than each product.
4. The local owner checks positive invariant noise budget, decrypts the aggregate
   and asserts exact agreement with the plaintext reference. Noise-budget
   inspection itself needs the secret key and is outside the evaluator.
5. Two fresh encryptions of the same mask must serialize differently. This is a
   randomization regression, **not** a proof of encryption security. No key,
   secret/ciphertext serialization or private model is exported in the report.
   Temporary buffers/objects are cleared/deleted best-effort; no perfect JS/WASM
   memory-erasure guarantee is made.

The default successful local execution used modulus 1,032,193, reported a
positive 13-bit remaining noise budget in that run, and returned [6,8]. Noise
budgets can vary with encryption randomness; the gate is positive remaining
budget, not an exact constant or unmeasured hardware timing. The boundary and
empty-selection workloads also passed real BFV evaluation in focused tests.

## What this deliberately does not prove

The roles are **co-located in one process**. A narrow function signature is a
review aid, not operating-system isolation or a deployed multi-party protocol.
A malicious caller/client/selector is not constrained by cryptographic range/
bit proofs. There is no authenticated transport, independent key distribution,
secret-key service, differential privacy, malicious-security proof, distance
ranking, encrypted comparison or Byzantine-robust training evaluation. A
single-client selection or a released aggregate can disclose input information.

This experiment measures no GPU acceleration, CKKS precision, dynamic hoisting,
bootstrapping, model accuracy, per-round communication or paper speedup. It is a
small, exact regression demonstrating that an **encrypted** selection bit can
mask an **encrypted** vector with one multiplication layer, and showing where
selection, decryption and averaging occur.
