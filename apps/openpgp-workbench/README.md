# OpenPGP Workbench

A static, local-processing browser tool for passphrase-protected OpenPGP text messages. Version 1 intentionally implements a narrow classic symmetric profile rather than a general-purpose PGP client.

## Build and preview

```sh
npm ci
npm run build:openpgp-workbench
npm run dev -- --host 0.0.0.0
```

Open `/apps/openpgp-workbench/` on the Vite preview. The build copies the application and the unmodified OpenPGP.js browser bundle into `public/apps/openpgp-workbench/`; it does not load crypto code from a CDN. The browser must provide Web Crypto in a secure context (HTTPS or localhost).

## Version 1 scope

- Encrypt UTF-8 text with a passphrase and produce ASCII armor.
- Decrypt passphrase-protected ASCII-armored text messages.
- Plaintext is limited to 1 MiB, armored input to 2 MiB, and passphrases to 4 KiB.
- No public-key encryption, key generation/import, signing, signature verification, file attachments, AEAD output, or app-level data persistence/network requests.

The fixed classic output profile is v4 SKESK (tag 3), iterated-and-salted SHA-256 S2K (type 3, coded count `0xFF`), AES-256, and SEIPD v1 (tag 18) with CFB and an MDC. The settings are aligned with the classic passphrase-only writer described in the PGPonyCore source review, but the implementation here is OpenPGP.js—not PGPonyCore Swift code or a port of it.

MDC provides message-integrity checking; it does not authenticate the sender. Do not infer identity or trust from a successful decrypt. The app is not a substitute for an independently reviewed secure-messaging client.

## Verification

`tests/openpgp-workbench.test.mjs` checks the bundled build, a GnuPG-originated AES-128 test message with a known plaintext, round-trip behavior, passphrase failure handling, resource limits, and cross-decryption of app-generated AES-256/SHA-256-S2K output with the existing CyberChef `pgpSymDecrypt` implementation. The output is also checked for the classic packet profile and MDC. These tests cover only the stated v1 boundary.

## Third-party library

OpenPGP.js `6.3.2` is pinned in the root package manifest and lockfile. It is distributed under `LGPL-3.0+`; the local browser distribution and full license are copied to `public/apps/openpgp-workbench/vendor/`. See `THIRD_PARTY_NOTICES.md` and the bundled `vendor/openpgp.LICENSE`.
