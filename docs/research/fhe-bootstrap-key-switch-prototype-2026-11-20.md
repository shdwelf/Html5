# FHE prototype follow-up: programmable bootstrapping, key switching, and wire paths

**Reviewed:** 2026-11-20
**Status:** bounded educational prototype; not a deployment design or production recommendation.

## Scope distinction

The Node `node-seal` DEM squared-error experiment remains a finite-depth BFV demo. Its one-layer square operation is relinearized, but the demo does **not** bootstrap and does **not** switch between independent keys. This follow-up does not change that contract or claim that an actual DEM has been processed.

The separate optional Concrete Python prototype (`tools/he-concrete-fhe-demo.py`) evaluates a complete, bounded arithmetic control circuit over the small field F_17. It already compiled programmable bootstraps and tested repeated encrypted composition. This update makes the compiled key-switch count a required runtime invariant, reports bootstrap/key-switch and key-size metrics, and exercises serialized request/response ciphertexts in the ordinary end-to-end path.

## Added prototype coverage

- **Compiler-generated key switches:** the run fails closed unless Concrete reports both at least one programmable bootstrap and at least one key switch. `packing_key_switches` is reported separately. These are compiler-generated TFHE operations; this is not a hand-written key-switch primitive.
- **Ciphertext wire serialization:** encrypted client inputs are serialized/deserialized before server evaluation; server result values are also restored from serialized bytes before client decryption. The eight-step composition audit sends the selected encrypted outputs through the same serialized boundaries before reusing them, and performs no intermediate decryption.
- **Evaluation-key transport option:** by default the single-process runner uses Concrete's generated evaluation-only key view to avoid holding a second potentially multi-gigabyte keyset. `--roundtrip-evaluation-keys` instead deserializes the exact evaluation-key byte string whose digest/signature/circuit binding were verified, then uses that deserialized key object for server evaluation. This option intentionally risks substantial extra memory while the client retains its key material; use it only in an adequately provisioned environment.
- **Metrics and checks:** JSON output includes bootstrap count, key-switch count, packing key-switch count, serialized evaluation-key byte length, selected evaluation-key loading path, and whether ciphertext wire-format round trips were exercised. The optional integration test asserts these alongside F_17 known answers, exhaustive 289-pair correctness, encrypted composition, tamper checks, and randomness regressions.

## Reproduction

Install the pinned optional Python dependencies on CPython 3.11 x86-64 Linux. The normal integration keeps the lower-memory key path; the opt-in path verifies server use of deserialized evaluation keys and can use much more memory.

```sh
python3 -m pip install -r tools/he-concrete-requirements.txt
RUN_CONCRETE_FHE=1 node --test tests/he-concrete.test.mjs
RUN_CONCRETE_FHE_KEY_TRANSPORT=1 node --test tests/he-concrete.test.mjs
```

The standard Node test suite intentionally skips the heavyweight Concrete runtime integration unless one of those flags is set; it still checks the public circuit contract without importing Concrete.

## Security and implementation limits

The Concrete program's field, inputs, and outputs are synthetic control values, not DEM pixels. Its key transport option is a same-process serialization round trip, not a network deployment. The signer and trusted public key are generated in one process, so the manifest test does not establish a real trust root. There are no independent client/server processes, stable key custody, threshold key generation/decryption, ciphertext validity/range proofs, input provenance checks, replay protection, request authorization, hardened untrusted deserialization, or external cryptographic review. The reported security level and compiler counts do not certify the application or its complete protocol.

## Official implementation references

- Zama Concrete, [deployment guide](https://docs.zama.ai/concrete/guides/deploy) — documented `EvaluationKeys.deserialize` and `Value.deserialize` server-side transport.
- Zama Concrete, [execution statistics](https://docs.zama.org/concrete/execution-analysis/other/statistics) — circuit-level programmable bootstrap, key-switch, and packing key-switch counts.
- Zama Concrete, [security/parameter configuration](https://docs.zama.ai/concrete/guides/configure) — configuration is an input to compilation; validate the generated circuit and workload rather than equating a sample parameter with a deployment guarantee.

Treat this report as prototype status and implementation notes, not a security certification.
