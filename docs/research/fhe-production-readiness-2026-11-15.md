# Production-readiness review: FHE for encrypted terrain metrics

**Reviewed:** 2026-11-15
**Scope:** The existing `tools/he-bfv-dem-sse-demo.mjs` is a synthetic BFV squared-error-sum experiment. It is not connected to elevation data or a viewer and is not a production implementation.

## Executive conclusion

There is no generally “production-ready FHE package” that makes a deployment secure by itself. For a real terrain-elevation workload, the two most plausible open-source candidates are **OpenFHE** (C++ with BFV/BGV/CKKS, threshold extensions and scheme switching) and **Zama TFHE-rs** (Rust, exact Boolean/integer arithmetic). Select after measuring the exact circuit, deployment language, and trust model. If the product needs approximate real-valued statistics, evaluate CKKS; if it needs exact bounded integer squared differences, evaluate BFV/BGV or TFHE-rs integer operations. Do not port the current Node demo to user data or infer security from its tiny successful test.

The OpenFHE documentation describes threshold FHE for BFV/BGV/CKKS and automatic parameter selection constrained by named security levels. Microsoft SEAL is a credible alternative for leveled BFV/BGV/CKKS arithmetic, but its own security notes specifically warn that decryptions must not be treated as safe-to-share, and that CKKS does not provide IND-CPA-D. These are important application protocol concerns, not defects that can be fixed merely by changing libraries.

## Candidate comparison

| Candidate | Strong fit | Important caveat |
| --- | --- | --- |
| [OpenFHE](https://github.com/openfheorg/openfhe-development) | C++ service; BFV/BGV exact arithmetic; CKKS approximate arithmetic; threshold features and switching between approximate and Boolean/integer schemes | The application still has to choose and validate the scheme, parameters, key ownership, protocol, and operational controls. Project support for a feature does not certify an application. Use current library guidance and the current community security guidelines rather than copying toy parameters. |
| [Zama TFHE-rs](https://github.com/zama-ai/tfhe-rs) | Rust service; encrypted Boolean and integer operations, particularly when the function is naturally expressed as integer gates/operations | Confirm that its exact integer/radix operation set and performance fit the complete DEM circuit; threshold/multiparty needs must be assessed separately and not presumed from single-key APIs. |
| [Microsoft SEAL](https://github.com/microsoft/SEAL) | Mature C++/C# library for leveled BFV/BGV or approximate CKKS arithmetic | SEAL’s own security guidance says the library’s CKKS does not provide IND-CPA-D, and decryption outputs (including some diagnostic outputs) can leak key-dependent information if exposed. Commercial applications require expert review. |
| [Concrete ML](https://docs.zama.org/concrete-ml/guides/client_server) | FHE machine-learning inference with documented client/server artifact deployment | It is primarily an ML workflow; it is not the default choice for a custom exact geospatial reduction unless the workload maps well to its compiler and APIs. |

## What a deployable terrain metric would require

1. **Freeze the function and bounds.** Specify input representation, signedness, maximum elevation delta, number of samples, output precision, overflow behavior, and whether the result is a sum, mean, threshold, or ranking. Bound the squared-error sum before selecting a plaintext modulus or encoding.
2. **Choose a threat model.** State who owns the DEMs, who runs evaluation, who can decrypt, whether inputs are jointly owned, whether the evaluator may submit chosen ciphertexts, and whether the output itself is sensitive. Single-key FHE protects inputs from the evaluator but does not automatically prevent the decrypting client from learning information encoded in outputs.
3. **Choose parameters with current guidance.** Use a supported security level and parameter-generation route; document the exact library version, scheme, parameters, multiplicative depth, and estimated security. The Homomorphic Encryption Standard site now also points to the 2024 *Security Guidelines for Implementing Homomorphic Encryption* and lattice-estimation resources. Do not use `HEStd_NotSet`, toy/demo parameters, or unreviewed hand-selected moduli for deployment.
4. **Protect decryption as a protocol.** Keep secret keys off the evaluator. Authenticate and rate-limit requests; constrain accepted ciphertext and operation shapes; avoid exposing decryption diagnostics or an unrestricted decryption oracle. If outputs cross a trust boundary, assess leakage and any scheme-specific mitigation with an FHE cryptographer. Use threshold key generation/decryption when the actual trust policy requires multiple parties; distribute and rotate key shares operationally.
5. **Validate inputs and outputs.** Authenticate data provenance, dimensions, coordinate systems, no-data masks, and preprocessing. Add range checks where the protocol permits, replay/idempotency handling, and strict serialization limits. FHE does not prove that the encrypted DEM is truthful or that the server evaluated the intended function.
6. **Benchmark the full deployment.** Measure key generation, client encryption, upload size, evaluation latency, peak memory, and decryption for realistic raster sizes on target hardware. Use representative non-sensitive fixtures and explicit budgets. FHE often makes ciphertexts and computation much more expensive than plaintext processing.
7. **Review the implementation.** Pin and update dependencies, track upstream security advisories, fuzz parsers/untrusted serialization, test numerical/correctness bounds and failure modes, and obtain an independent cryptographic/security review before processing sensitive data. FHE is not a replacement for access controls, transport security, secure key custody, or privacy review.

## Recommendation for this repository

Keep the existing Node BFV/SSE code labeled as a **synthetic research prototype**. That path uses `node-seal` and a local secret key; it has no DEM ingestion, no real data pipeline, no threshold protocol, and no bootstrapping. A separate optional Concrete F_17 control-circuit prototype now audits compiler-generated programmable bootstraps and key switches, serializes ciphertext requests/responses, and offers an opt-in evaluation-key deserialization round trip. It does not process DEM data and does not turn the BFV/SSE example into an unbounded or production protocol; see [the follow-up note](fhe-bootstrap-key-switch-prototype-2026-11-20.md). Next engineering step should remain a reproducible benchmark specification using public/synthetic bounded DEM tiles, comparing (a) exact BFV/BGV sum-of-squares and (b) TFHE-rs integer operations. Do not integrate cryptography into the browser viewer until the threat model and benchmark justify that architecture; a client/server service with keys held by the data owner is the more natural initial design.

## Sources (official / standards sources checked 2026-11-15)

- HomomorphicEncryption.org, [Security Guidelines](https://homomorphicencryption.org/security-guidelines/) — links to the current 2024 security-guidelines paper and lattice estimator / parameter tools.
- HomomorphicEncryption.org, [Homomorphic Encryption Security Standard](https://homomorphicencryption.org/standard/) — scheme descriptions, security properties, and parameter tables.
- Albrecht et al., [Security Guidelines for Implementing Homomorphic Encryption](https://eprint.iacr.org/2024/463) (2024) — security estimates plus functional parameter examples.
- OpenFHE, [project repository](https://github.com/openfheorg/openfhe-development) and [parameter documentation](https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md) — schemes, threshold extensions, and parameter/security-level guidance.
- Microsoft SEAL, [security guidance](https://github.com/microsoft/SEAL/blob/main/SECURITY.md) — decryption-output, CKKS IND-CPA-D, and commercial-review warnings.
- Zama, [TFHE-rs repository](https://github.com/zama-ai/tfhe-rs) and [Concrete ML client/server deployment guide](https://docs.zama.org/concrete-ml/guides/client_server) — implementation and deployment surface.

This is a technical landscape review, not a security certification or legal advice. Verify versions, supported feature status, and advisories again at implementation time.
