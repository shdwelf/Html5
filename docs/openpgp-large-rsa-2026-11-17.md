# OpenPGP Workbench: bounded large-RSA support

## Supported sizes

| Operation | RSA sizes |
| --- | --- |
| Default generation | **3072 bits**, unchanged |
| Explicit generation choices | 3072, 4096, **6144, 8192, 12288**, and experimental browser **16384** bits |
| Public certificate import | v4 RSA, **2048 through 16384 bits**, for the primary and every subkey |
| Protected secret export | Exactly two RSA packets of the **saved selected generation size**, with the existing protection requirements |

**Browser 16384-bit generation is experimental and has not completed successfully in the recorded browser trial:** it reached the 20-minute resource guard and retained no key. Do not mistake successful native Node generation or public import for successful browser generation at that size. The above-8192 completed browser control is **12288 bits**.

The primary is for signing/certification and the same-size subkey is for encryption. A 16384-bit ceiling is an input/resource policy, not a claim that every OpenPGP implementation, phone, browser or hardware token supports that size. Legacy v4 Ed25519/Curve25519 public imports remain available; this change does not enable arbitrary ECC or v6 profiles.

## Explicit advanced opt-in

The Create key panel has a labeled size selector. Above 4096 bits, a separate performance/compatibility acknowledgment is required before generation starts. Changing to another size resets that acknowledgment. It does not replace consent for sensitive secret/revocation exports or full-fingerprint confirmation.

Very large prime searches can take many minutes and consume substantial CPU, especially on mobile devices. There is no bounded completion-time promise. Native Web Crypto does not expose cancellation for an already running RSA generation: Clear discards its eventual result, prevents overlapping generation and resets the selector; it does **not** stop native CPU work or guarantee memory erasure. Above 8192 bits the separate worker described below **can** be terminated by Clear and has a 20-minute resource limit. Worker absence, resource exhaustion and generation errors fail rather than silently downgrade.

Larger RSA is not automatically safer or more interoperable. Existing SHA-256 self-certifications, classic SHA-2 preferences, AES-256 secret protection, iterated SHA-256 S2K at coded count `0xFF`, v4 fingerprints and no-AEAD output remain unchanged. Increasing the RSA modulus does not by itself strengthen every other component or make an identity post-quantum secure. Prefer the default unless a reviewed workflow genuinely needs a larger size.

## Chromium ceiling and worker-only dispatch patch

Actual Chromium testing exposed a native `generateKey` limit of **8192 bits**.
The unmodified OpenPGP.js 6.3.3 RSA generator propagates this rejection; merely
raising the selector would not provide above-8192 browser generation.

For the explicit 12288/16384-bit choices only, a **dedicated local module worker**
uses a narrowly patched OpenPGP.js build. The patch adds `bits <= 8192 &&` to the
RSA generator's native Web Crypto dispatch condition. In a browser worker this
reaches the **existing upstream** `randomProbablePrime(..., 40)` implementation,
without changing its prime tests, number of rounds, arithmetic or RNG. All
randomness still comes from native `crypto.getRandomValues`; other Web Crypto
operations remain enabled and no crypto global is overwritten. This is a local
compatibility patch, **not an unmodified upstream build, independent security
audit or endorsement**. The upstream 40-round probabilistic-prime policy is
unchanged; a larger modulus does not upgrade every security component.

`scripts/openpgp-large-rsa-build.mjs` requires the complete unminified upstream
input SHA-256 `c6dcff139be7d67a65fabbc3a38437e94bfe8afbf1b06d6217b8c11b42d02778`
and exactly one expected dispatch match. Unknown inputs fail closed. Locked
esbuild 0.28.2 produces the separate worker, readable corresponding source and
build receipt, all included in the shipped app; the original normal browser
bundle and installed Node distribution remain byte-identical upstream. See the
shipped third-party notices, readable source and `vendor/large-rsa-build.json`.

Preflight bounds fields and sizes before a worker is created or receives a
message. Each worker processes one explicit request, sends only protected
exports (never raw private parameters), and closes. The main thread rechecks
selected size, fingerprint, protected secret packets and public certification
before retaining its result. Clear/pagehide or a 20-minute deadline terminates
the worker and discards any late response. No worker, native job or sensitive
export starts automatically. Unsupported workers never silently fall back to
main-thread prime searches or substitute a smaller key.

## Export and import invariants

`generateCompatibilityKey({ ..., rsaBits })` validates an explicit integer from the generation allowlist **before** invoking the library. It returns immutable `rsaBits` metadata with its public/protected-secret/revocation exports. The browser retains that metadata alongside the generated bundle.

`checkedPrivateDownload(armor, fullFingerprint, { rsaBits })` defaults to 3072 for backward compatibility. For an explicitly larger generated key, pass the saved size. It requires both secret packets to have that exact size and the original AES-256 / iterated SHA-256 S2K protection. The UI passes the **saved bundle size**, not the currently displayed selector value. A later UI selection cannot weaken validation or relabel an existing key. This remains a checker for generated exports, not an arbitrary secret-key importer.

Public import retains full packet preflight, the 1 MiB / 32-certificate limits, the per-certificate subkey/UID bounds, atomic batches, complete 40-hex v4 fingerprints, archival-only labeling and explicit review of changed certificates. Oversized RSA packets are refused before self-certification checks, including tampered oversized inputs that otherwise might be retained as archival-only data. Import does not assign owner trust.

## Evidence and runtime gates

- Fast controls reproduce the worker build and test worker abort/timeout/errors/malformed replies, exercise every selectable size, reject strings/fractions/unbounded or unsupported sizes before the expensive generator, check matching primary/subkey options, enforce mismatched-size export rejection, and reject above-cap public packet inputs.
- DOM controls exercise large-size acknowledgment, reset, prevention of overlapping generation, and saved-size export binding after the selector changes.
- Real Chromium controls exercise the advanced-size gate, actual native RSA-8192 and isolated-worker RSA-12288 generation/download workflows, plus startup/cancellation of a real experimental RSA-16384 worker, ECC import, keyboard/mobile layout and absence of external requests. A size-selector-only or canceled-worker test is not counted as a generated large key. Exact recovery and independent gpgv verification exercise the actual browser-exported key, not a substituted Node fixture.
- The separate **`large-rsa`** CI lane actually generates fresh synthetic **8192- and 16384-bit primary/subkey pairs**, checks their protection and selected-size exports, imports them using both the Node and shipped browser distributions, verifies signatures with independent **gpgv**, and requires full **GnuPG** cross-encryption with exact byte recovery. A further Chromium step requires completed **8192/12288-bit** generation and actual 16384-worker cancellation; it does **not** assert completed 16384-bit browser generation. All synthetic secret material is temporary and is never uploaded or cached across jobs.
- The expensive lane has a 30-minute job limit and does not consume the fast native lane's 10-minute budget. Its real-generation tests are opt-in locally with `RUN_OPENPGP_LARGE_RSA=1`, not silently counted as executed when skipped. A timeout/failure remains a failure, not device compatibility evidence.

Local full GnuPG, actual matching-head browser results, mobile OpenKeychain/PGPony clients and hardware-token limits remain separate runtime checks. Consult the actual matching-head CI result rather than treating the existence of a test or a source-level policy as a successful execution.

## Recorded controls and limits

- Native Node / browser-distribution-in-Node control: real synthetic 8192- and
  16384-bit pairs, protected export, exact byte recovery and independent gpgv;
  **4/4 passed, exit 0**. This is not browser prime-search evidence.
- Real Chromium **8192-bit native**: **8/8 passed, exit 0**, including actual
  protected/revocation downloads, import and clearing.
- Real Chromium **12288-bit worker**: **8/8 passed, exit 0**; the two-key prime
  search/protection took about **339 seconds** on this sandbox. This is an
  observation, not a time or device-compatibility guarantee.
- Real Chromium **16384-bit native**: refused with the native 8192-bit ceiling.
  The worker trial then reached its **20-minute limit**, terminated and retained
  no key. This is recorded as **not completed**, not passed generation.
- The later default-size Chromium controls additionally verify actual
  experimental-16384 worker creation/destruction by Clear, exact byte recovery
  and independent gpgv verification: **9/9 passed, exit 0**.
- Fast aggregate after the worker build and policy controls: **146 passed,
  6 explicit skips** (4 missing full-native local controls and 2 opt-in expensive
  generations), **0 failures, exit 0**. Mandatory CI does not allow missing
  independent native readers to masquerade as successful interop.
- Separate repository Vitest run: **318 passed / 36 files, exit 0**, resolving
  the earlier unexplained nonzero run without claiming that earlier run passed.

The later matching-head CI result remains the release gate. In particular,
experimental 16384-bit browser completion, OpenKeychain/PGPony device imports,
hardware-token support and the encrypted Drive transfer are **not** established
by these controls. Encrypted Drive delivery remains blocked separately; a
successful key test is not a cloud backup receipt.
