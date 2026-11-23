# OpenPGP continuation — native GnuPG interoperability controls

## Result and exact evidence boundary

The separate [native interoperability CI run](https://github.com/shdwelf/Html5/actions/runs/45229648748)
**succeeded** for PR #232 head
`76078209ecd11f40b6cca8c47066184ea83e0bf1`. Its `native-gnupg`
[job](https://github.com/shdwelf/Html5/actions/runs/45229648748/job/137885388301)
completed in **46 seconds**, independently of the Android APK/emulator lane.
GitHub reports success for native tool checks, hash-checked Python installation,
model/DOM/policy controls and the mandatory native-GnuPG/gpgv/PGPy/symmetric step.

[Structured evidence](research/openpgp-native-ci-2026-11-17.json) preserves the
reported head, job and step results and SHA-256 digests of the tested harness
files. It is **job/step metadata, not a downloaded TAP log**: this sandbox could
not retrieve the log archive from GitHub's redirected results-receiver host.
Exact runner tool versions and raw TAP totals are therefore not asserted here.
GitHub's reported execution timestamps are retained verbatim; `2026-11-17`
is the research-snapshot name, not a reconstructed execution clock.

This closes the previously unperformed **full command-line GnuPG synthetic
private-import/unlock/cryptographic-control gate for the tested revision**.
It does **not** certify a production identity, a release binary, all GnuPG
versions, official Kleopatra's GUI, OpenKeychain, PGPony Android or PGPony iOS.
Those application/device runtimes still need their own recorded checks.
The [round-83 report](backlog-execution-round-83-2026-11-17.md) is a frozen
historical result; its unperformed full-gpg gate is superseded only by this
narrow continuation evidence, not rewritten as if it ran earlier.

## Three independent native controls

`tests/openpgp-native-interop.test.mjs` uses real `gpg` **and** `gpgconf`:

1. Import a fresh synthetic protected private certificate; check both RSA-3072
   primary/encryption-subkey fingerprints. Clear the dedicated agent before
   wrong-passphrase decrypt **and sign** attempts. Require failure and no
   successful-decryption/signature-created status. Then successfully decrypt
   OpenPGP.js output with MDC and exact Unicode/newline bytes, verify its
   signature and refuse modified plaintext. Encrypt/sign using GnuPG and
   independently decrypt/verify with OpenPGP.js. Read/unlock GnuPG's protected
   secret re-export in the test without adding an app secret-import feature or
   relaxing the app's strict generated-download protection checker.
2. Independently import **two certificates** inside one public armor block and
   concatenated public armor blocks. Check all primary/subkey counts and exact
   fingerprints, export GnuPG's single-block public ring, and import/export it
   through the app's public-only keyring without secret armor.
3. Apply the separate revocation only in a disposable GnuPG home; verify the
   revoked primary state and revoked public export. The app refuses silent
   changed-same-fingerprint replacement, then marks an explicitly removed and
   reimported revoked certificate archival-only.

The public-signature `gpgv` test remains a **separate verification-only control**;
it is not relabeled as full GnuPG. PGPy 0.6.0 remains a separately provisioned
independent reader for both secret packets, fingerprints, wrong/correct
passphrases and two-way encryption/signatures. Existing GnuPG symmetric-vector
and CyberChef controls are retained.

## Isolation, dependency and CI safeguards

- Every private home is a fresh OS-private temporary directory containing only
  throwaway test identities. `GNUPGHOME`, explicit `--homedir`, `--no-options`,
  batch/loopback pinentry and no automatic key retrieval isolate it from a real
  user keyring/configuration or a keyserver. No production identity is inferred.
- Passphrases reach the command through stdin, **not argv or environment**.
  Private files are mode `0600`. Dedicated-agent cache lifetime is zero and the
  agent is stopped before negative unlock controls and before home removal.
  Removal is not a physical-media secure-erasure guarantee.
- Each command has a bounded timeout/output. Temporary homes are removed in
  `finally`; no key/revocation home, fixture, private artifact or cache is uploaded.
- `.github/workflows/openpgp-interop.yml` has a **ten-minute job ceiling**,
  read-only contents permission, immutable action SHAs, no persisted checkout
  credentials, no `pull_request_target`, no application secrets or write token,
  no `continue-on-error`, and no APK or emulator dependency.
- Python test build/runtime requirements are exact-version and SHA-256 pinned
  under `tests/requirements/`. The PGPy build is installed without isolated
  unpinned build dependency resolution. These libraries are not browser assets.
- Locally absent optional readers are explicit skips. In CI,
  `REQUIRE_OPENPGP_INTEROP=1` and `REQUIRE_OPENPGP_NATIVE_INTEROP=1` make reader
  absence a **failure**. Four policy regressions include spawned missing-tool
  negative runs, SHA/permission/artifact policy and requirement lock checks.
  Nested runner invocations explicitly remove inherited `NODE_TEST_CONTEXT`;
  otherwise Node's private test IPC can suppress the child TAP unexpectedly.

## Local verification and remaining runtime gates

A fresh local six-file targeted run completed **39 tests / 36 passed / 0 failed /
3 skipped**. The three skips were the explicitly absent full `gpg`/`gpgconf`
controls; actual gpgv and PGPy controls ran. The mandatory CI lane above then
supplied the missing native execution, not a claim that gpg was installed here.

```sh
# Isolated test environment; never substitute a real user's keyring:
python3 -m pip install --target .cache/pgp-next/python --require-hashes -r tests/requirements/openpgp-build.txt
PYTHONPATH="$PWD/.cache/pgp-next/python" python3 -m pip install --target .cache/pgp-next/python --no-build-isolation --require-hashes -r tests/requirements/openpgp-interop.txt
PYTHONPATH="$PWD/.cache/pgp-next/python" REQUIRE_OPENPGP_INTEROP=1 node --test tests/openpgp-interop-policy.test.mjs tests/openpgp-key-interop.test.mjs tests/openpgp-keyring.test.mjs tests/openpgp-keyring-dom.test.mjs tests/openpgp-workbench.test.mjs
# A full-GnuPG machine must also run this without silently skipping:
REQUIRE_OPENPGP_NATIVE_INTEROP=1 node --test tests/openpgp-native-interop.test.mjs
```

The destination-app [throwaway transfer checklist](openpgp-keyring-source-review-2026-11-17.md#user-controlled-transfer-checklist-remaining-device-gate)
still applies: record exact app/version/platform, normal key-file import,
full fingerprints and both key packets, wrong/correct passphrases, two-way
throwaway encryption/signatures, certificate counts and separate revocation
handling. **No Android/iOS/Kleopatra GUI run has been performed by this lane.**
Photon's unresolved product identity, Proton VPN release verification and any
personal keyring/VPN integration remain distinct questions.
