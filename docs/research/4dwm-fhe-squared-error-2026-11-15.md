# 4DWM × FHE research note: encrypted squared-error aggregate (2026-11-15)

## Research question and formula

A practical next formula for a terrain/data-quality workflow is the exact
integer sum of squared differences:

```text
SSE = Σᵢ (sampleᵢ − referenceᵢ)²
```

It returns one aggregate residual score without releasing each sample. It is
not a complete quality metric: SSE loses the locations and signs of individual
residuals, is sensitive to outliers, and disclosing one aggregate can still
leak information. It provides neither authenticated input nor range proofs.

Microsoft SEAL documents BFV as exact modular integer arithmetic; its example
and security notes emphasize selecting parameters for the evaluated circuit,
plaintext modulus, and noise budget. The local prototype uses node-seal 7.0.0,
which its bundled README says is aligned with Microsoft SEAL **4.1.2**. This is
older than the Microsoft SEAL repository's current README warning that version
4.4.0 contains critical security fixes for untrusted-input handling and native
memory safety. Therefore the code here is an educational regression only; do
not deploy it or feed it untrusted ciphertexts. Updating the wrapper to a fixed
underlying SEAL is a separate prerequisite before any production consideration.

Sources:

- Microsoft SEAL README (version/security notice; consulted 2026-11-15):
  <https://github.com/microsoft/SEAL/blob/main/README.md>
- Repository-pinned node-seal README (reports SEAL 4.1.2):
  `node_modules/node-seal/README.md`, package `node-seal@7.0.0`.
- Existing project background and limits: [BFV masked aggregation v2](../cyberchef-fhe-masked-aggregation-2026-11-17.md),
  [FHE study lab](../cyberchef-fhe-study-lab-2026-11-17.md).

## 4DWM-oriented prototype

`tools/fhe-dem-sse-contract.mjs` defines at most eight pairs of synthetic
integer values from 0 through 1,000. This is an explicit quantized,
terrain-like toy domain, **not the viewer's USGS 3DEP data**. At the maximum,
`8 × 1,000² = 8,000,000`, which is below the actual 24-bit batching prime
16,760,833 used in the run; the accepted nonnegative SSE therefore does not
wrap modulo the plaintext modulus.

`tools/he-bfv-dem-sse-demo.mjs` independently encrypts every sample and
reference value, subtracts paired ciphertexts, squares each encrypted
residual, adds the resulting ciphertexts, relinearizes once after the sum, and
locally decrypts one aggregate. BFV polynomial modulus degree is 8192 with
SEAL's `tc128` parameter validation; multiplication depth is one and no
bootstrapping occurs. The evaluator helper accepts ciphertext pairs and
relinearization material, not plaintext arrays or the secret key. Roles still
share one process, so this is not a deployed trust boundary.

Run:

```sh
npm run demo:bfv-dem-sse
node --test tests/fhe-dem-sse.test.mjs
```

Default synthetic pair vectors:

```json
{"schema":1,"samples":[125,310,480,655],"reference":[120,315,470,650]}
```

The exact reference and encrypted BFV result are **175**. The observed run had
104 bits of remaining invariant noise budget for that random encryption; the
workload-boundary run (`[1000 × 8]` against `[0 × 8]`) returned 8,000,000 with
positive remaining budget. Noise-budget values are run-specific headroom, not
security bits, benchmark claims, or proof of a production parameter set.

## 4DWM connection and caveats

The Planet Viewer shows the formula and reproducible command in its inspector,
but the browser viewer does not encrypt terrain and no DEM sample is passed to
the BFV program. The experiment is a separate CLI trial inspired by
4DWM's integer-valued terrain/elevation comparison. It makes no claim about
actual 3DEP residuals, accuracy, performance, or user data. Because
node-seal's pinned SEAL core is old, this is intentionally a research result,
not a security recommendation.
