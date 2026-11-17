# CyberChef FHE study lab — 17 Nov 2026

## Public scope

This is a new educational recipe group for the offline CyberChef kitchen. It is
intentionally **not** an FHE implementation. The `FHE Study Lab (plaintext
only)` operation has three mutually exclusive presets:

1. **F17 plaintext circuit oracle** — accepts one `x,y` pair per line, with
   `x,y ∈ {0,…,16}`, and reports the exact outputs of the bounded F17 arithmetic
   specification used by `tools/he-concrete-fhe-demo.py`. It accepts up to 289
   pairs per bake; malformed rows and out-of-range inputs fail instead of
   wrapping. For `y=0`, the quotient placeholder is zero and
   `divisor_valid=false`.
2. **UTF-8 byte ↔ F17 pair codec** — illustrates the lossless representation
   `b → [floor(b/17), b mod 17]` for up to 4096 UTF-8 bytes. The output includes
   the original byte values so the teaching round trip is inspectable. This is
   representation only: it does not encrypt, authenticate, or refresh noise.
3. **Lancelot architecture card** — summarizes a Drive-provided, published
   research paper's client/server/key-generation-centre roles and its
   interactive encrypted-distance workflow.

The preset packs are separate on purpose; applying the plaintext oracle after
encoding bytes, or vice versa, would be an unrelated transform rather than a
coherent multi-step FHE recipe. The existing ElGamal recipe remains explicitly
multiplicative-only and “not FHE.”

### F17 example

Input:

```text
2,1
2,0
```

For `(2,1)`, the oracle reports `sum=3`, `difference=1`, `product=2`,
`quotient=2`, `divisor_valid=true`, and `square=8`. For `(2,0)`, it reports
`quotient=0` with `divisor_valid=false`; callers must reject that quotient.
The square is `((x*y mod 17)+x+1)^2 mod 17`. The intermediary maxima are
raw product/reduction index 256 and square-LUT index 33. These are exact
plaintext reference computations—not results from encrypted evaluation.

## Research informed by the connected Drive

The most directly readable technical source in Drive was:

- Siyang Jiang, Hao Yang, Qipeng Xie, Chuan Ma, Sen Wang, Zhe Liu, Tao Xiang,
  and Guoliang Xing, “Towards compute-efficient Byzantine-robust federated
  learning with fully homomorphic encryption,” *Nature Machine Intelligence*
  7 (2025), 1657–1668, DOI
  [10.1038/s42256-025-01107-6](https://doi.org/10.1038/s42256-025-01107-6).

The Drive text extraction was truncated. The following architecture summary
records only the accessible excerpt and is not a full-paper, threat-model, or
security review; the paper's reported speedup was not independently reproduced.

The article describes Lancelot, a Byzantine-robust federated-learning design
that combines encrypted model computation with a trusted key-generation centre.
In its workflow, clients encrypt updates, the server calculates encrypted
distances, and the encrypted distance list is sent to the trusted centre for
decryption and sorting. The centre returns an encrypted selection mask; the
server aggregates under that mask, and the centre decrypts the final aggregate.
The paper discusses lazy relinearization, dynamic hoisting, and GPU acceleration
and reports a 20-fold processing-speed improvement in its evaluated setup. That
is the paper's reported result, not a general FHE performance guarantee.

Important security boundary: FHE protects plaintext confidentiality for
supported ciphertext computations; it does not itself prevent poisoning,
provide integrity/authentication, or remove trust from a participant that
decrypts intermediate results. The Lancelot case study explicitly separates
robust aggregation from encryption and includes an interactive trusted-centre
boundary. This is why the CyberChef card does not describe its workflow as
server-only or non-interactive.

Drive also contains the 2023 titles *On Architecting Fully Homomorphic
Encryption-based Computing* (Rashmi Agrawal and Ajay Joshi) and *XeHE: An Intel
GPU Accelerated Fully Homomorphic Encryption* (Drive metadata lists 2023).
Both EPUBs have since been downloaded and inspected locally. The CKKS
architecture findings, source metadata, careful treatment of reported GPU
results, and the distinct manual profile recipe are documented in the
[second FHE architecture-profile edition](cyberchef-fhe-architecture-profile-2026-11-17.md).
That public note paraphrases the sources and does not copy the Drive files or
expose private Drive URLs/identifiers.

## Connection to this repository's experiments

- `tools/he-concrete-fhe-demo.py` and `tests/he-concrete.test.mjs` define the
  bounded F17 circuit, including the encrypted zero-divisor validity flag,
  evaluation-key provenance checks, and the depth-8 encrypted-output
  composition audit. Concrete's programmable bootstrap is for that compiled
  circuit; it is not an assertion about arbitrary circuit families or
  unbounded resources.
- `tools/he-bfv-demo.mjs` is a separate leveled BFV example. It has finite noise
  and does **not** bootstrap.
- Fresh library encryption randomness, transport erasure coding, and evaluated
  circuit semantics are separate layers. LT/ZIP/compression do not encrypt or
  refresh HE noise; authentication must be provided separately.
- This browser lab only checks the plaintext contract. It does not call either
  FHE library, generate keys, receive ciphertexts, or claim an encrypt/evaluate/
  decrypt integration result.

## Reproduction and checks

The new operation is pinned by `tests/cyberchef-fhe-kitchen.test.mjs` against
independent arithmetic vectors, range/format errors, UTF-8 codec round trips,
the architecture-card boundaries, and the three separate recipe presets. The
kitchen registry and its full-coverage count are checked by the existing
CyberChef tests; `scripts/build-cyberchef-xdc.mjs` produces the offline bundle.

The real Concrete integration remains opt-in and is separate from this
plaintext-only CyberChef lab. See
[the FHE randomization/stream audit](fhe-randomization-stream-audit-2026-11-17.md)
for commands, finite-domain assumptions, and its run status.
