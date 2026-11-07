# Backlog execution round 62 — 2026-11-05

## First requested phase: browser-based OpenPGP app

Implemented the static, locally bundled
[`OpenPGP Workbench`](../public/apps/openpgp-workbench/) as a separate JavaScript
app. It is powered by pinned OpenPGP.js 6.3.2 (LGPL-3.0+) and is not a browser
port of PGPonyCore. V1 is text-only, passphrase-only, and restricted to the
classic v4 SKESK/direct-S2K, SHA-256 S2K, AES-256, SEIPD v1 CFB+MDC profile.
Public-key operations, key management, signing, file attachments, AEAD, and
persistence are out of scope. The library bundle and license are served locally.

The app uses OpenPGP.js packet classes for the direct-S2K SKESK form because its
high-level `encrypt()` API wraps a random session key in an encrypted-session-
key field, which the existing local CyberChef reader does not implement. S2K,
AES-CFB/MDC, packet serialization, and armor remain library-provided. Tests
cross-check both Node and shipped browser builds against CyberChef; app decrypt
also uses a GnuPG-originated known-answer fixture. See
[`openpgp-workbench-v1-implementation-2026-11-05.md`](openpgp-workbench-v1-implementation-2026-11-05.md)
for the fixed profile, implementation boundary, evidence, and limitations.

That cross-check exposed and corrected a CyberChef bug: MDC is always SHA-1
under RFC 4880 §5.13, regardless of the S2K digest. A regression now exercises
an AES-256 message using SHA-256 S2K and verifies its MDC independently.

The Cookbook Reference card now links to the app and documents the separate
implementation boundary. The GnuPG-originated AES-128 fixture is shared between
the existing CyberChef tests and the new workbench tests.

## Verification

- `npm run build:openpgp-workbench` passed. The locally bundled OpenPGP.js
  browser module is 395,333 bytes; the LGPL license is included.
- `npm run build:cyberchef` refreshed the merged archive after the MDC
  correction: `cyberchef.xdc` is 1,089,682 bytes (8 entries).
- Targeted OpenPGP/CyberChef tests passed 14/14, including browser-bundle
  encryption/decryption, GnuPG known-answer input, independent CyberChef
  cross-decryption, tampering/wrong-passphrase checks, and size bounds.
- Full `npm test` passed: 307 Vitest tests; 966 Node tests, 955 passed,
  11 skipped, zero failed.
- `npm run build:wikiinajar` generated 318 Markdown documents into 318 pages
  in a 12-entry bundle. The build preflight passed; a page-aware post-build
  audit scanned 972 Markdown/HTML/Java-Wiki/package page bodies and found zero
  unsafe private Google/Drive links or identifier-context matches.
- `node tools/wikiinajar/sync-docs.mjs --check` passed for all 9 current Java
  Wiki note pages. `git diff --check` passed.
- The install reports 7 npm advisories (1 low, 1 moderate, 3 high, 2 critical);
  no dependency remediation was applied in this implementation.

## Next phases

The user-resolved order is browser OpenPGP app → Android consolidation → CA
pattern inspector when grid/time-series input is available. The Android target
was clarified as a separate offline WebView/catalog app for all 89 HTML
entrypoints, debug APK plus source, minSdk 24. Phase 2 is now implemented in
[`apps/html5-offline-launcher/`](../apps/html5-offline-launcher/); its APK is
built by CI because Java, Gradle, and the Android SDK are not installed in this
workspace. See
[`html5-offline-launcher-v1-implementation-2026-11-05.md`](html5-offline-launcher-v1-implementation-2026-11-05.md).
The existing `apps/riseup-invizible-gateway/` remains a separate VPN-specific
orchestration scaffold, not the launcher. The CA inspector remains conditional
on suitable grid/time-series data and a specified CA model.
