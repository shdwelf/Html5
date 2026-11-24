# Backlog execution round 86 — independent native OpenPGP v6 controls

Continuation on `arena/74f27a74-html5`, based on main
`ff65af686deca71198d257793e653fc8a9eeb11d`. PR #238 is already merged; its
matching-head Android, crypto/large-RSA and evidence checks passed. This round
does not repeat that merge, app restoration or immutable backup delivery.
This operational report and its evidence are excluded from public offline
manual bundles. Original research and existing archives remain untouched.

## Bounded item completed locally

The selected open item was **independent native v6 interoperability**. Earlier
Node/shipped-browser/Chromium v6 controls used the same OpenPGP.js implementation
and could not establish that gate. A test-only Go executable now uses pinned
ProtonMail/go-crypto v1.5.2, independent of both JS distributions.

The required native execution passed **4/4 with zero skips**:

1. Independently generated Go v6 Ed25519/X25519 certificate, complete primary /
   encryption fingerprints and verified self-signature/binding accepted by both
   app readers; throwaway secret packets also parse.
2. The actual streaming release helper's v6 PKESK / SEIPDv2 / AES-256-OCB backup
   decrypts independently to exact 384+ KiB synthetic bytes in Go. Body/final-tag
   changes, truncation, outer junk, same-short-ID/wrong-full-fingerprint and a
   separately retargeted unrelated secret fail without publishing plaintext.
3. Go verifies a fresh JS certificate and writes a negotiated AES-256-GCM v6
   message recovered exactly by both JS readers; altered/truncated/wrong-key
   controls fail. The different AEAD modes are explicit assertions, not a
   version downgrade or signed-preference rewrite.
4. Secret/mixed/bundled/junk, v4, revoked, expired, unbound, signing-only and
   short/wrong-fingerprint certificate inputs fail; existing destinations and
   synthetic keys are never overwritten.

[Technical evidence and limitations](openpgp-v6-native-interop-2026-11-17.md)
and the [pinned manifest](research/openpgp-v6-native-interop-2026-11-17.json)
record the tested files, exact versions and real local build. The local SDK is
Go **1.27.4** from a hash-checked PyPI toolchain wheel; CI separately pins
**1.26.9**. Local module archives matched the unchanged Go h1 locks, and native
format/build/vet completed. Failed draft assertions and the release-host egress
failure are recorded, not relabeled as successful attempts.

A separate read-only, SHA-pinned, ten-minute CI lane builds the native helper,
checks locked modules/format/vet, runs six policy regressions and requires all
four real cases. Missing readers cannot silently pass; no key/fixture artifact,
account secret, cloud upload or persistent private-material cache is added.
No production app code, import profile, key generation default, Android origin,
backup recipient, runtime token registry or npm dependency was changed.

## Fresh regression evidence

- Required native plus policy suites: **10 passed / 0 failed / 0 skipped**.
- Affected OpenPGP/release/model/corpus run: **131 total / 124 passed / 0 failed /
  7 explicit optional skips**; all four new native cases executed. The skips
  are the separately absent PGPy reader, four full-GnuPG controls and two
  opt-in expensive large-RSA controls, not the Go v6 lane.
- Full Vitest: **318 passed / 36 files**. Separate release/upload/native-save,
  sound and token-registry guards: **52 passed / 0 skipped**. Coin inventory,
  complete sound snapshots and the 96-entry browser catalog remain fresh.
- Actual v6 Chromium: **5 passed / 0 skipped**, with no uncaught errors or
  external requests. This still uses the synthetic JS browser profile, not an
  owner certificate or destination-client GUI.
- Both native workflow files parse as YAML 1.2 with unique keys. The existing
  classic/large-RSA workflow and production app/npm/encryption inputs are
  unchanged. Corpus regressions confirm the new operational exclusions without
  copying these notes or attachment details into public offline manuals.

## Newly supplied PUBLIC certificate

The supplied PUBLIC-only attachment was inspected intact. Its v6 Ed25519
primary, five supported v6 subkeys and selected bound X25519 encryption subkey
were accepted by both installed and shipped app readers **under Node**. There
were fourteen supported PUBLIC packets; no reduction was necessary. This was
not a Chromium UI, GUI-client, phone or owner-decryption test.

The exact byte/hash/identity report remains only in the ignored local delivery
workspace at
`google_drive/html5-backlog-round-86/attachments/5B78CDB2-public-inspection.json`.
The upload alone did **not** authorize a new backup recipient. The previously
approved exact v6 recipient remains the new-copy recipient; existing v4 and v6
backups are unchanged. No owner private key/passphrase was requested, and no
new copy or duplicate cloud upload was made in this round. A PUBLIC certificate
cannot decrypt an existing backup.

## Follow-through and still-open gates

- Obtain/review the matching-head **new native-v6 CI result**; the old classic-v4
  and same-library v6 checks do not substitute for it. Required local native
  tests have run successfully, not merely skipped because of a missing SDK.
- This synthetic library/CLI gate does not close OpenKeychain, PGPony Android /
  iOS or Kleopatra GUI compatibility, protected-v6-secret transfer, actual
  owner-key decryption or physical-device recovery. Keep throwaway test keys
  separate from any owner keyring; never send an owner secret to CI.
- Encrypted **APK** delivery remains blocked by the previously observed Actions
  integration 403. Three successful APK builds were not encrypted delivery.
  No authorization change was reported and no blind redispatch was attempted.
  The already verified encrypted browser/source deliveries remain available;
  they are not APKs or backups of all live browser/phone/cloud state.
- Preserve stable-signing/external-export recovery gates; do not uninstall an
  old Android build until the owner's exports and recovery path are verified.
- Finish block-anchored per-deployment USDT/USDC evidence before stETH/wstETH.
  The Circle address-reference review alone closes no deployment/financial gate
  and promotes no runtime mapping. The completed host-fee tranche is not repeated.
- Other ANC variants still require dependency localization, privacy/runtime
  review and truthful acoustic limits. A restored catalog is not certification
  of every imported source. Manuscript sync still needs a confirmed private
  destination/access and author approval; PhotonVPN and ProtonVPN stay distinct.
