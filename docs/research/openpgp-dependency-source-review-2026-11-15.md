# OpenPGP dependency/source review — 15 November 2026

## Decision

Keep the current OpenPGP.js-based implementation for the browser workbench and
Node backup-encryption scripts. Do not add a second cryptographic implementation
to the Android WebView launcher, and do not import binaries or source snapshots
from Internet Archive. There is no identified native-Java/Rust requirement that
justifies a second crypto stack, additional APK size, and another interoperability
and security-maintenance surface.

This is a focused source and integration review, not a cryptographic audit or a
substitute for checking current advisories before any dependency upgrade.

## Current repository fit

- `public/apps/openpgp-workbench/vendor/` contains the browser OpenPGP.js bundle
  and its license notice. The workbench already provides the client-side key and
  message workflows.
- `scripts/encrypt-openpgp-backup.mjs` uses the same OpenPGP.js implementation
  for recipient-encrypted backup files. The Android build workflow encrypts APKs
  before any private artifact export; recipient-key checks and ciphertext
  receipts are separate from owner-side decryption.
- The launcher itself is an HTML/WebView container. A Java-only or Rust/C FFI
  dependency would add no capability unless a native Android feature is actually
  specified.

Retain the existing LGPL notice and version pin when maintaining the current
bundle. Any upgrade should run the repository's v4/v6 and independent-client
interoperability tests, plus a targeted review of upstream advisories and the
transitive crypto dependencies.

## Candidates examined

| Source | What the source establishes | Integration assessment |
| --- | --- | --- |
| [PGPainless 2.0.4 on GitHub](https://github.com/pgpainless/pgpainless/tree/2.0.4) | Its pinned README describes a Java/Android OpenPGP API. The repository is Apache-2.0; its core module depends on Bouncy Castle provider, OpenPGP, and utility artifacts. | A credible option if a future native Java/Kotlin feature is required. Not needed for the existing browser/Node path. Before adoption, pin and review the complete Bouncy Castle dependency graph, current advisories, Android compatibility, and cross-client packet behavior. |
| [Sequoia PGP on GitLab, OpenPGP v2.3.0](https://gitlab.com/sequoia-pgp/sequoia/-/tree/openpgp/v2.3.0) | Rust OpenPGP implementation under LGPL-2.0-or-later. Its Android build note describes cross-building OpenSSL, Nettle, and GMP with an Android NDK/Rust toolchain. | Strong native Rust project, but materially more build and JNI/FFI complexity than this app needs. The Android build note is historical guidance, not evidence of a maintained Android integration for this project. Do not add without a supported, reproducible Android build and a concrete Rust requirement. |
| [Arch Linux GnuPG package archive on Internet Archive](https://archive.org/details/archlinux_pkg_gnupg) | Archive.org describes the item as old Arch Linux GnuPG package versions and points to Arch's archive documentation and upstream GnuPG. | A historical package mirror, not an upstream release channel or a dependency source. Do not consume its binaries in the app. Resolve versions and signatures from the project/package maintainer's canonical distribution process instead. |
| [2018 OpenPGP.js GitHub snapshot on Internet Archive](https://archive.org/details/github.com-openpgpjs-openpgpjs_-_2018-03-13_07-34-52) | The record identifies itself as a 2018 GitHub repository snapshot and points back to `openpgpjs/openpgpjs`. | Useful historical provenance only. It predates current protocol/library behavior and is not suitable as the vendored implementation or a version reference. Use the official upstream repository and pinned package tarball. |

## Adoption gates if the requirement changes

1. Identify the exact native capability and why the existing browser/Node API
   cannot provide it.
2. Select a maintained, version-pinned upstream source and review its license,
   release provenance, security advisories, and every transitive crypto library.
3. Build the Android artifact reproducibly; measure APK size, memory use, and
   supported-device behavior.
4. Test key parsing and encryption/decryption against independent OpenPGP
   implementations for the exact v4/v6 packet profiles we intend to support.
5. Keep key material out of logs, build artifacts, and CI secrets unless it is a
   recipient public certificate; never place owner private keys or passphrases in
   the repository or workflow.

## Sources inspected

- GitHub PGPainless 2.0.4 README and `pgpainless-core/build.gradle`:
  <https://github.com/pgpainless/pgpainless/blob/2.0.4/README.md>
  <https://github.com/pgpainless/pgpainless/blob/2.0.4/pgpainless-core/build.gradle>
- GitLab Sequoia OpenPGP v2.3.0 Android build note and license:
  <https://gitlab.com/sequoia-pgp/sequoia/-/raw/openpgp/v2.3.0/README.android>
  <https://gitlab.com/sequoia-pgp/sequoia/-/raw/openpgp/v2.3.0/LICENSE.txt>
- Internet Archive records listed in the candidate table above.
