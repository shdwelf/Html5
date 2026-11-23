# OpenPGP Workbench

Local browser text tools plus **conservative key creation and a public-only keyring**. This is not a general-purpose secure PGP client or a certification that every target app accepts every export.

## Build and preview

```sh
npm ci
npm run build:openpgp-workbench
npm run dev -- --host 0.0.0.0
```

Open `/apps/openpgp-workbench/`. The build copies the application and the unmodified, pinned OpenPGP.js browser bundle to `public/apps/openpgp-workbench/`. No CDN or remote module is used. Web Crypto in a secure context (HTTPS or localhost) is required.

## Current scope

- **Encrypt / Decrypt:** the existing classic passphrase-only UTF-8 text tools. Up to 1 MiB plaintext, 2 MiB message armor and 4 KiB passphrase. v4/direct-S2K SKESK, iterated SHA-256 S2K (`0xFF`), AES-256 and SEIPD v1/MDC; no AEAD output. MDC does not authenticate the sender.
- **Create key:** supply your own name/alias and/or optional email, strong unique passphrase and expiry. Random **v4 RSA-3072** signing/certification primary plus RSA-3072 encryption subkey, SHA-256 self-certification and classic SHA-2 preferences. Default expiry 730 days; allowed 30–3650. No identity is inferred, and no wallet seed or recovery phrase is used.
- **Protected private export:** both packets use AES-256, iterated/salted SHA-256 S2K, count `0xFF` (65,011,712 octets). A minimum 12-character passphrase is required, but length is not a strength guarantee. Generated private armor never becomes a page field or clipboard item. Download requires explicit acknowledgement and the full matching fingerprint, with a packet-protection recheck.
- **Revocation backup:** a separate, explicit **unencrypted sensitive certificate**. Anyone holding it can revoke the key. Keep it private/offline; never bundle it with the public certificate you share.
- **Public keyring:** memory-only v4 RSA certificates (2048–4096 bits), 1 MiB / 32 certificates. Supports multiple keys inside one armor block and concatenated armor blocks. Secret packets, mixed/junk/unsupported packets and other key profiles are refused atomically. Full expected fingerprints may be supplied for a single-certificate import; short IDs are never accepted.
- Identical public certificates deduplicate; changed data with the same fingerprint requires explicit remove/reimport after reviewing updates/revocations in a dedicated client. Primary self-certification state is checked **at import time**, not continuously. Expired/revoked/invalid certificates are marked archival-only. Every User ID remains an unverified claim; there is no owner-trust assignment or subkey audit.

No public-key **message** encryption/decryption, secret-key import, signing UI, attachments, modern AEAD writer, hardware cards, pairing, keyserver lookup/publishing, telemetry, background request or app-level persistent storage is implemented. Add a generated public key to the keyring explicitly; nothing is downloaded or published automatically.

## Export to another client

1. Start with a **throwaway** identity for compatibility checks. Prefer a dedicated reviewed native client for a sensitive real identity.
2. Download the protected private `.asc` and separately the revocation backup. Keep both private; keep the passphrase separately. A public-only `.asc` is sufficient only for sharing a public certificate.
3. Use the destination's normal key-file import. This is **not** an OpenKeychain encrypted `.sec.pgp` backup or a numeric backup code.
4. Compare the **full 40-hex fingerprint**, UID, key/subkey sizes and expiry in the destination. Test wrong/correct passphrases, two-way throwaway encryption and signature verification before relying on the combination. Do not import the revocation certificate as an ordinary setup step.

Targets are **source-informed** OpenKeychain, PGPony Android/iOS and official KDE Kleopatra/GnuPG. Android, iOS and Kleopatra runtime import/unlock checks remain **not performed**. Proton VPN release signing and the unresolved Photon VPN candidate are separate topics, not PGP keyring integrations. See the [source review](../../docs/openpgp-keyring-source-review-2026-11-17.md) and its pinned manifest.

## Memory and security limits

Clear buttons and `pagehide` drop fields/references and suppress late async results. They do **not** guarantee erasure of JavaScript/Web Crypto/engine copies, clipboard, browser/autofill state, extensions or OS download files. Reloading loses unsaved material; this app cannot recover your passphrase. A compromised origin/browser can steal keys while they are generated. This educational app does not replace an independently reviewed secure-messaging client.

## Verification

```sh
node --test tests/openpgp-workbench.test.mjs tests/openpgp-keyring.test.mjs tests/openpgp-keyring-dom.test.mjs
node --test tests/openpgp-key-interop.test.mjs
# Full native GnuPG is separate from gpgv; requires gpg AND gpgconf:
node --test tests/openpgp-native-interop.test.mjs
# Optional Python reader: pin/hash-check build and runtime dependencies in an isolated environment:
# python -m pip install --require-hashes -r tests/requirements/openpgp-build.txt
# python -m pip install --no-build-isolation --require-hashes -r tests/requirements/openpgp-interop.txt
# REQUIRE_OPENPGP_INTEROP=1 REQUIRE_OPENPGP_NATIVE_INTEROP=1 node --test tests/openpgp-key-interop.test.mjs tests/openpgp-native-interop.test.mjs
# Optional existing Chromium harness dependencies:
node tests/openpgp-workbench-browser.mjs
```

Independent controls include the existing GnuPG symmetric vector/CyberChef reader, generated RSA signatures verified by **gpgv**, and optional **PGPy 0.6.0** parsing/unlock/cross-encryption/signature tests. `gpgv` is verification-only, **not** full `gpg` private-key import/decrypt validation. The real Chromium runner exercises Web Crypto, actual downloads, multi-key imports, reset and external-request observation. All keys are synthetic and temporary; no private fixture is committed. See the source review for the complete evidence/remaining-device-test matrix.

The separate native-GnuPG harness uses fresh private temporary homes, protected synthetic key files, passphrases through stdin (not argv/environment), and dedicated-agent shutdown before wrong-passphrase checks and cleanup. It covers both secret packets, exact fingerprints, bidirectional encryption/signatures, secret re-export, both public-keyring armor layouts and revocation. Missing tools/readers are explicit optional skips locally, but **fail** when the required flags above are set; the bounded `OpenPGP native interoperability` CI lane sets both flags. A successful harness run is not a Kleopatra GUI, OpenKeychain or PGPony device test. No synthetic private home, key, passphrase file or revocation artifact is uploaded.

A PGPy failure exposed OpenPGP.js's default SHA-3 preference IDs in otherwise classic RSA keys. `keyring.mjs` now constructs a fresh narrow UID self-certification using the **library's exported signature API**, then reparses and verifies the result. It does not alter already-signed bytes or implement a cryptographic primitive. Regression checks cover those exact preferences and the bundled browser distribution.

## Third-party library

OpenPGP.js **6.3.2**, `LGPL-3.0+`, remains pinned in the root manifest/lockfile. The unmodified browser distribution and full license are copied to `vendor/`. See `THIRD_PARTY_NOTICES.md`. No source from the reviewed native applications is shipped in this workbench.
