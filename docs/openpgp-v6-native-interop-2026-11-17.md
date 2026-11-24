# OpenPGP v6 — independent native synthetic interoperability

## Result and scope

The required local native run completed **4 tests / 4 passed / 0 failed / 0
skipped**, using **ProtonMail/go-crypto/openpgp/v2 v1.5.2**, Go **1.27.4**,
Node **22.22.3**, and both installed/shipped OpenPGP.js **6.3.3** distributions.
The executable was actually built and run; missing-reader policy checks or
same-library JS decryption are not substituted for native execution.

[Machine-readable provenance and evidence](research/openpgp-v6-native-interop-2026-11-17.json)
binds the tested harness files by SHA-256. The separate CI workflow pins Go
**1.26.9** and requires all four cases. Its matching-head GitHub result is a
separate gate; the local SDK is not mislabeled as that CI SDK. The filename date
is the repository research-snapshot date, not an inferred upstream release date.

Fresh regression runs also passed: native plus policy **10/10**, full Vitest
**318 tests / 36 files**, and actual v6 Chromium **5/5**. The affected Node/corpus
run completed **131 total / 124 passed / 0 failed / 7 explicit optional skips**
(absent PGPy/full GnuPG and opt-in expensive large-RSA controls). All four Go
v6 cases ran in that suite; none of its skips is presented as native v6 success.

This closes the previously unperformed **independent native v6 library/CLI
control for these synthetic keys and two packet profiles**. It does not certify
owner-key recovery, protected v6 secret export/unlock, all RFC 9580 algorithms,
PQC, native GnuPG/PGPy v6 support, OpenKeychain/PGPony Android/iOS, Kleopatra's GUI,
physical phones, a release APK or a complete cryptographic security audit.

## What actually crosses the implementation boundary

| Control | Required observation |
| --- | --- |
| Go-generated v6 certificate → both JS readers | One Ed25519 primary and one X25519 encryption subkey; both full 64-hex fingerprints, direct self-signature, validated binding and app recipient eligibility; both public and throwaway secret packets parse |
| Actual streaming release helper → Go | `encryptBackup(..., profile: "modern-v6")` encrypts 384+ KiB of exact binary/Unicode/CRLF data; Go independently decrypts the same ciphertext and recovers every byte |
| Go → both JS readers | Go independently validates a fresh JS certificate and encrypts; both JS distributions independently of Go recover the exact original bytes |
| Strictness / tamper / destination controls | Malformed/secret/mixed/bundled, v4, revoked, expired, unbound, signing-only and short/wrong-fingerprint certificates fail; modified body/final tag, truncation, trailing junk, same-short-ID/wrong-full-fingerprint and unrelated secrets fail; existing output is never overwritten |

Both directions assert **v6 PKESK**, the entire selected encryption-subkey
fingerprint, **SEIPDv2** and **AES-256**. The release-helper direction requires
**OCB (AEAD ID 2)**. The reverse Go writer negotiates **GCM (AEAD ID 3)** because
the fresh JS certificate advertises both and this pinned high-level Go writer
prefers common GCM. `AEADConfig.DefaultMode` does not override that negotiation.
The harness checks the exact per-direction mode; it does not edit a recipient's
signed preferences, accept a silent version downgrade or change app profiles.

The initial draft wrongly required OCB in the reverse direction; its profile
assertion correctly failed. A second draft placed truncated-message parsing
outside the expected-rejection closure; a parser rejection then failed the test
instead of being counted as the intended negative control. Both harness issues
were corrected before the final four-pass execution. No production crypto or
public-key import checks were relaxed to obtain a pass.

## Authentication and temporary-material boundaries

`tests/openpgp-v6-native/main.go` is a deliberately narrow **test executable**,
not a general owner-key importer or a production decrypt command. No crypto
primitive is implemented here. It preflights raw packets before `ReadEntity`:
`ReadKeyRing` can otherwise skip malformed/unsupported entities. Exactly one
v6 Ed25519 primary and one X25519 subkey are required, with complete expected
fingerprints and independent primary/binding verification.

The native envelope preflight checks packet framing, versions, algorithms and
full fingerprint, but **does not authenticate the encrypted body**. Go's
`UnverifiedBody` must be read through a successful EOF. The helper buffers at
most 4 MiB and creates the exclusive mode-0600 plaintext destination only after
that authentication succeeds. Modified final-tag controls assert that no
plaintext file or stdout prefix exists. The retargeted-wrong-secret control
first reparses and validates its changed header so fingerprint rejection cannot
masquerade as a failed secret-key unwrap.

Fresh throwaway keys/data live only in OS-private mode-0700 temporary directories
with mode-0600 files. The secret packets are intentionally **unprotected
synthetic test material**, not a new protected-v6-secret app feature. Every test
removes its own directories in `finally`. Removal/reference clearing is not a
physical secure-erasure or OS/engine zeroization guarantee. No owner attachment,
keyring, private key, passphrase, archive or account is read by this suite.

A regression also checks OpenPGP.js's lazy `Message.write()` ArrayStream:
serializing a fingerprint mutation must drain the stream's reader completely.
Treating its initially empty array as complete bytes would create a false
negative from an empty fixture, not test the intended mutated envelope.

## Dependency and toolchain provenance

- Test module `tests/openpgp-v6-native/go.mod` requires Go 1.23.0 and exactly
  `github.com/ProtonMail/go-crypto v1.5.2`, tag resolved to
  [`7537b30ff8aaf643512ce8bb78f5f92c44ffa6b4`](https://github.com/ProtonMail/go-crypto/tree/7537b30ff8aaf643512ce8bb78f5f92c44ffa6b4)
  (BSD-3-Clause). CIRCL 1.6.3, x/crypto 0.41.0 and x/sys 0.35.0 are exact and
  `go.sum`-locked. These dependencies are not added to browser/app packages.
- Local egress cannot fetch GitHub release-asset or Go module-proxy hosts. The
  official setup-go SDK asset fetch failed at its redirected host, not at
  compilation. For local execution only, the SDK came from the reviewed
  `jmelahman/go-bin` **1.27.4** PyPI wheel, SHA-256
  `d7e327a50c4f3ad8605420f0dbe7d20e7ad011de480d1c51804e207ae369ddf2`.
  Its pinned packaging source repackages the Go distribution. The wheel was
  hash-checked and extracted into ignored cache without pip install/build hooks.
  This verifies the selected package bytes, not source-to-binary equivalence.
- Module source archives were fetched from the four pinned GitHub commits,
  represented in a local file proxy and checked by Go against the **unchanged
  committed h1 module/go.mod sums**. `go mod download`, `go mod verify`, native
  `gofmt`, `go build -trimpath -mod=readonly` and `go vet` succeeded. Automatic
  toolchain switching and VCS fallback were disabled. No alternate sums,
  replacement directives or production dependencies were introduced.
- CI uses the separate SHA-pinned setup-go action and SDK **1.26.9**, normal Go
  module/checksum verification, `GOTOOLCHAIN=local`, `-mod=readonly` and a
  post-build lockfile-diff guard. It does not depend on the local wheel/cache.

See the linked manifest for exact commits, licenses, module sums, toolchain
package and action identities. Provenance/hash verification is not an audit or
a reproducible-build claim.

## Mandatory CI and reproduction

`.github/workflows/openpgp-v6-native.yml` is separate from expensive large-RSA
and Android jobs: ten-minute ceiling, contents-read-only permission, immutable
checkout/setup-node/setup-go SHAs, no persisted checkout credentials, no app
secrets, `pull_request_target`, artifact uploads or persistent key caches.
`REQUIRE_OPENPGP_V6_NATIVE=1` makes reader absence/breakage fail rather than skip.
A bounded TAP reporter emits only synthetic result counts/test titles, requires
all four cases and preserves the test command's failing exit status. Six policy
regressions cover missing tools, exact dependencies, workflow safeguards,
complete mutated streams, evidence handling and corpus exclusions.

Follow the [self-cleaning build/run commands](../tests/openpgp-v6-native/README.md)
from the repository root. Without the executable, four explicit local optional
skips are honest absence, **not** native interoperability success. Classic-v4
GnuPG/gpgv/PGPy controls and real Chromium/Android controls remain separate.
Owner recovery and encrypted APK delivery are not outcomes of this test lane.
