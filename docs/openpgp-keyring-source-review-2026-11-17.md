> **Follow-on size policy:** This source-review record describes the original
> RSA-3072 generator / 4096-bit import ceiling. The later explicit user request
> adds bounded large RSA through 16384 bits; see
> [the current policy and real-generation gates](openpgp-large-rsa-2026-11-17.md).
> Original upstream evidence and non-size compatibility caveats remain intact.

# Local OpenPGP keyrings — source review and implementation

## Scope and identity decisions

This follows completion of the [43 remaining host fee-model reviews](chain-fee-model-review-round-83-2026-11-17.md).
The user confirmed **PGPony Android/iOS**, not a guessed “PonyPG” project, and
asked to investigate **both Photon VPN and Proton VPN** because the intended
VPN name was uncertain. They remain separate investigations below.

Implemented in the existing [OpenPGP Workbench](../public/apps/openpgp-workbench/):
user-driven **v4 RSA-3072 key generation**, protected private/revocation downloads,
and an in-memory **public-only** keyring with import/export and full-fingerprint
checks. No personal name, email or passphrase was supplied or inferred; no
personal key was created for the user. Runtime tests generated only random,
explicitly synthetic throwaway identities, not wallet-derived or usable demo
keys distributed in the repository.

This is a **targeted source review**, not an exhaustive security audit. Nine
upstream commits and 40 selected fetched files are recorded in the
[provenance manifest](research/openpgp-source-manifest-2026-11-17.json), including
full commit IDs, immutable file URLs, byte counts, SHA-256 digests and specific
inspection sections. Downloaded/marker-inspected files are not all claimed to
have been audited line by line. Upstream applications were not built or run.

## Discovery versus evidence

The requested **GitHub, baresearch.org, libresearch.space, utilibre.org and
searx.space** routes were investigated. Utilibre's search route was
`search.utilibre.org/search`; `searx.space` is an instance directory, not a PGP
implementation or a compatibility oracle. Search pages gave mixed/noisy leads;
exact-name GitHub searches for “PonyPG” and “PhotonVPN” did not resolve a unique
intended product. Discovery results were followed to the primary repositories
below, not treated as compatibility tests. No searches of a personal keyserver
identity, key publication, email verification or VPN/account login were done.

## Primary source findings

### KDE Kleopatra and GnuPG — the official desktop projects

- The [KDE application page](https://apps.kde.org/kleopatra/) identifies the
  official certificate manager/front end for OpenPGP and S/MIME, with Gpg4win
  distribution on Windows. It is not evidence that an unrelated Android APK
  using the name “Kleopatra” is a KDE/GnuPG application.
- [`KDE/kleopatra` at `42c92dae`](https://github.com/KDE/kleopatra/tree/42c92dae2da5950e1da391b266fd209ce6ffcad7)
  depends on Gpgmepp/QGpgmeQt6 and Libkleo. `newopenpgpcertificatecommand.cpp`
  calls `QGpgME::openpgp()->keyGenerationJob()`. File import dispatches to the
  OpenPGP/CMS backend; it does not implement an independent browser cipher.
- `exportsecretkeycommand.cpp` chooses `secretKeyExportJob(armor)` using the
  **full primary fingerprint**, handles cancel/error/empty results, and writes
  `.asc` or other appropriate export files. Its SPDX header is GPL-2.0-or-later;
  a null GitHub repository-license metadata field does **not** mean unlicensed.
- [`gpg/gnupg` at `b4a61527`](https://github.com/gpg/gnupg/tree/b4a6152796619e7f0ab93eb8141de2938989ed95):
  `g10/parse-packet.c` handles secret-key protection usage 254/255, the cipher,
  S2K hash/salt/count and classic iterated mode. `g10/import.c` explicitly notes
  that an expected fingerprint has to be enforced by the import caller. A
  successful parse or a short key ID is not independent identity verification.

**Local runtime boundary:** only `gpgv` 2.2.40 is installed. Its separate RSA
signature verification control passed; **full `gpg` private-key import/decrypt
and the Kleopatra GUI were not run**. The reviewed GnuPG source commit is not
claimed to be the source of the sandbox's installed 2.2.40 binary.

### OpenKeychain — transferable rings versus encrypted application backups

- [`open-keychain/open-keychain` at `8d0bd1f8`](https://github.com/open-keychain/open-keychain/tree/8d0bd1f8537fb3a795fda8161f730a313ef7b01c)
  warns that development is maintenance/security-fix only. The reviewed build
  uses `bcprov-jdk18on:1.77` plus its local BC OpenPGP module; the source license
  is GPLv3. This is not a recommendation to use an obsolete downloaded APK.
- `UncachedKeyRing.fromStream` iterates both public/secret rings through a
  decoder/object factory. `decodeFromData` deliberately rejects more than one
  ring, whereas the stream API continues over multiple objects/blocks.
  `encodeArmored` writes transferable armored key data. The known-algorithm
  list includes RSA; public rings remain **unverified**, not owner-trusted.
- The key-operation and backup code distinguish protected secret-key material
  from application-specific backups. A protected transferable `.asc` is **not**
  an OpenKeychain encrypted `.sec.pgp` backup or its numeric restore code.

**Not executed:** Android import, key-unlock, signing/decryption, contacts, NFC,
USB and backup/restore. Source-level support informs the profile, but the target
app's full fingerprint and a throwaway message must still be checked on device.

### PGPony Android — relevant mechanics and a multi-key import regression

- [`norsehorse-dev/PGPonyAndroid` at `fe8545f2`](https://github.com/norsehorse-dev/PGPonyAndroid/tree/fe8545f2450ab9a8284646230678ab7c322e08ee)
  is the user-confirmed Android source, Apache-2.0. Its README distinguishes
  ordinary exported keys from OpenKeychain backup restoration.
- `PGPCryptoService.buildRSAKeyRingGenerator` creates RSA primary/encryption
  keys, signing/certification/encryption flags, SHA-256 certification signatures
  and SHA-2 preferences. `importArmoredKey` handles secret/public rings, with
  protection-policy checks and binding sanitization. We did not copy this
  implementation into the browser app.
- `S2kPolicy.kt` uses AES-256 plus iterated/salted SHA-256 protection for v4/v5
  keys. Its device calibration targets about 200 ms, with coded count **0xE0
  (16,777,216 octets) through 0xFF (65,011,712)**. Existing keys retain their old
  protection until a passphrase change. `SecretKeyUnlock` applies separate
  Argon2 resource guards; our writer does **not** emit Argon2 or v6 keys.
- `MultiKeyImportRoutingTest.kt` explains a real distinction: one armor block
  can contain **N certificates**, while multiple concatenated blocks require
  a second split. Counting armor headers loses keys. Our importer tests both
  shapes and refuses malformed/mixed batches atomically. The Android regression
  test source was read, **not executed here**.
- The upstream README distinguishes APK signing-certificate SHA-256, detached
  OpenPGP APK signatures and SSH-signed source tags/commits. Those are different
  verification systems. No APK signature/reproducibility claim was reproduced.

### PGPony iOS — public core is not the entire app

[`norsehorse-dev/PGPonyCore` at `86d23e0a`](https://github.com/norsehorse-dev/PGPonyCore/tree/86d23e0abc05a7135e46c6eab5aa215fea2025d6)
is the Apache-2.0 Swift/Apple crypto core. Its README explicitly keeps the iOS
application, storage and parts of orchestration/ObjectivePGP integration closed.
CoreNFC/iOS build constraints and initially internal APIs prevent treating it as
a drop-in JavaScript or generic Linux Swift library.

The selected parser recognizes RSA and v4 framing; `Primitives/S2K.swift` shows
UTF-8 passphrases and classic iterated SHA-256/SHA-1 derivation.
`CertificateValidator` separates fingerprint framing, binding validation,
encryption eligibility and decryption with expired subkeys. This supports a
conservative interoperability hypothesis, **not proof of the closed app's
complete v4 secret-import/unlock path**. No iOS simulator, device, hardware card
or PGPonyPair test was performed.

### Proton VPN — release authenticity is not a user's PGP keyring

- [`ProtonVPN/android-app` at `416d2ee1`](https://github.com/ProtonVPN/android-app/tree/416d2ee1d979615d7c644f19338b56f82cb39b68)
  publishes an APK certificate SHA-256. Its `verify_apk_signature.sh` invokes
  `apksigner verify --print-certs` and compares that digest. This is **APK/X.509
  signer verification**, not OpenPGP user-key import or a PGP tunnel protocol.
- [`ProtonVPN/win-app` at `52b9967a`](https://github.com/ProtonVPN/win-app/tree/52b9967ae9b196117adce7a52774dc148672b72c)
  describes its Windows service/OpenVPN/adapter architecture. The selected
  sources do not establish a user-facing OpenPGP keyring integration; this is
  not an exhaustive absence claim about all Proton VPN code.
- The [official Debian/Ubuntu installation guide](https://protonvpn.com/support/linux-vpn-debian-ubuntu)
  separates repository configuration/keys, a release-package checksum and
  repository signing. It specifically warns against equating the release
  package's signing key with the repository key. No package was installed,
  signature checked or VPN tunnel started for this review.
- [`ProtonMail/gopenpgp` at `dcc4859a`](https://github.com/ProtonMail/gopenpgp/tree/dcc4859aba4cd912c7562a534912fc8fc688e04b)
  is a **separate MIT OpenPGP library**, not evidence that Proton VPN accepts
  this workbench's keys. Its `profile/preset.go` distinguishes default,
  RFC4880 (RSA-3072/4096), RFC9580 and PQC/Argon2/AEAD profiles. These must not
  be collapsed into a single “Proton-compatible” format claim.

### Photon VPN — unresolved product identity, not silently renamed Proton

GitHub discovery found an **unconfirmed candidate**:
[`h-nargesi/Photon-VPN` at `e9c672b0`](https://github.com/h-nargesi/Photon-VPN/tree/e9c672b018cb0075e81cacf7ffe04264efa8ce65).
The selected sources are an ASP.NET/net6 web/admin project, account/plan page
sketches, service setup and an empty `AuthMiddleware` class. They do not establish
an OpenPGP implementation, keyring exchange or the identity of the product the
user intended. No repository license was established; no code was reused.
This is not proof that every similarly named Photon app lacks PGP, and not a
security verdict. A specific official URL/package identifier remains necessary
before claiming Photon compatibility, installing it or integrating credentials.

## Implemented profile and safeguards

Source: [`apps/openpgp-workbench/keyring.mjs`](../apps/openpgp-workbench/keyring.mjs).
The unmodified **OpenPGP.js 6.3.2** distribution remains pinned/local, with its
LGPL-3.0+ license. Upstream app code was not vendored or executed.

- A submitted name/alias and/or optional email becomes one **public User ID**;
  no identity is inferred from the session, browser or wallet. Random RSA-3072
  signing/certification primary and RSA-3072 encryption subkey; default expiry
  730 days, bounded to 30–3650 days. No zero-expiry option in this narrow UI.
- Both private packets are checked for v4, protection usage **254**, AES-256,
  SHA-256 type-3 S2K and coded count **0xFF**. This fixed count is not PGPony's
  device-time calibration, Argon2 or a passphrase-strength guarantee. The v4
  private-packet SHA-1 integrity trailer and SHA-1-based v4 fingerprint framing
  are format features, **not SHA-1 certification signatures**.
- SHA-256 self-certification; preferences limited to AES-256/AES-128,
  SHA-256/SHA-384/SHA-512 and uncompressed messages; MDC feature, no AEAD output.
  **Independent check caught a defect:** OpenPGP.js's default certificate
  preferences include SHA-3 IDs even with SHA-256 selected; PGPy 0.6.0 rejected
  that entire certificate. We now use a **fresh library `SignaturePacket`**
  with the narrow preferences, sign it with OpenPGP.js, replace the generated
  UID self-certification and reparse/verify the serialized key (avoiding the
  in-memory verification cache). No already-signed packet is edited and no
  cipher, hash, KDF, fingerprint or RSA primitive is implemented here.
- Generated private armor is never rendered or offered on the clipboard. Downloads need
  explicit backup acknowledgement **and the full matching 40-hex fingerprint**;
  packet protection is rechecked immediately before downloading. Public export
  is separate; filenames use the fingerprint, not the email. A revocation
  certificate is a **separate unencrypted sensitive download**: possession lets
  someone revoke the key; it must not be published with the public certificate.
- Public import: **1 MiB / 32 certificates**, v4 RSA 2048–4096 only. Both armor
  layouts are parsed. A packet allowlist rejects secret/orphan-secret packets,
  forged PUBLIC headers, message/photo/unsupported packets, trailing junk and
  malformed batches. The library retains unknown non-critical packets as
  unparseable objects even with strict flags; a second allowlist check refuses
  those too. Standard marker/trust/padding packets are ignored by the library
  according to the format, **not imported as trust decisions**. Literal armor
  scans also reject nested/incomplete blocks without repeated regex backtracking.
  Imports are atomic; full expected fingerprints are optional for a single
  certificate and never silently matched against just
  one item in a bulk import. Short IDs are refused.
- Identical certificates deduplicate. Different certificate data with the same
  fingerprint is **refused**, not silently overwritten/merged (which could drop
  an update/revocation). Review in a dedicated client, then explicitly remove
  and reimport. Primary self-certification state is labeled **at import time**;
  expired/revoked/invalid certificates are archival-only, and all UIDs remain
  unverified claims. This is not a web-of-trust engine or subkey audit.
- No public-key message operations, secret-key import, signing UI, AEAD writer,
  keyserver lookup, publishing, device pairing, hardware cards or background
  network operation. No application persistence: reload/clear loses unsaved
  keyring/exports. Pagehide clears fields/references; abort/revision tokens
  suppress late generation/import/download/message/file-read results.
- JavaScript strings, engine/Web Crypto copies, OS downloads, clipboard,
  autofill/history, extensions and a compromised origin cannot be reliably
  erased or controlled here. Clearing is **not secure zeroization**. Prefer a
  dedicated reviewed client for sensitive production identities.

## Validation matrix — do not conflate evidence levels

**Continuation:** the table below records round 83. A later, separate mandatory
[full-native-GnuPG CI lane passed](openpgp-native-interop-2026-11-17.md), adding
synthetic private import/unlock, wrong-passphrase, bidirectional crypto, public
ring and revocation execution. That closes only the tested command-line gate;
Kleopatra GUI and Android/iOS app checks remain unperformed. Do not reinterpret
the historical gpgv row as private-import evidence.

| Target | Evidence obtained in this round | Not claimed |
| --- | --- | --- |
| OpenPGP.js Node and exact local browser bundle | Protected key/profile, fresh self-certification, key flags/expiry/fingerprint, multi-key and malformed/negative/atomicity tests | External security audit |
| Real Chromium/Web Crypto | 6 passing browser checks; actual public/private/revocation/keyring downloads; import refusal, reset, mobile tabs; no external requests or page errors observed | Android WebView, Gecko/WebKit or physical-device validation |
| PGPy 0.6.0 | Independently parses fingerprints, refuses wrong passphrase, unlocks both packets, decrypts/signs/verifies in both directions with synthetic keys | OpenKeychain/PGPony equivalence or a production trust-policy audit |
| GnuPG `gpgv` 2.2.40 | Exported public certificate verifies the generated RSA detached signature; modified plaintext fails | Full `gpg` private import/decrypt or Kleopatra GUI testing |
| OpenKeychain / PGPony Android | Targeted pinned source paths and format rationale | Android builds, import/unlock or hardware tests |
| PGPony iOS | Selected public core paths and explicit closed-orchestration boundary | iOS app/runtime compatibility |
| Proton VPN / Photon candidate | Separate provenance and release-verification/product-identity distinctions | User-keyring integration, tunnel security, product endorsement or credentials testing |

The exact test commands and complete suite results are in the
[round-83 execution report](backlog-execution-round-83-2026-11-17.md).

## User-controlled transfer checklist (remaining device gate)

1. Start with a throwaway identity/key. Prefer creating a sensitive real identity
   in the destination's reviewed native client instead of an educational web app.
2. Back up the protected private `.asc` and **separately** the sensitive revocation
   certificate. Keep the strong passphrase separate; do not put either backup
   into source control, a public keyserver, shared chat or a public cloud page.
3. In the destination app choose its normal key-file import, **not** OpenKeychain
   encrypted-backup restore for this `.asc`. Importing a public certificate alone
   does not give decryption/signing capability.
4. Compare the **entire fingerprint** in both apps through a trusted channel;
   inspect the UID, RSA sizes, encryption subkey and expiry. A visible matching
   name/email, a successful parse or a short ID is insufficient.
5. With the throwaway key, exercise wrong/correct passphrases, two-way encryption
   and decryption and signature verification in the actual target app. Check
   every certificate count in a multi-key export. Record app/build/platform and
   results before calling that combination compatible.
6. Do not import the revocation certificate as a routine setup step; test it only
   on a disposable copy. It intentionally revokes the key. No revocation upload
   or native-client action was performed by this implementation.
