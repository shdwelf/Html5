# OpenPGP dependency and recipient-encrypted release review

## Changes

- Pin OpenPGP.js **6.3.3**, regenerate the unmodified local browser distribution, and lock the newly declared Node dependency **eckey-utils 0.7.14**. The upstream release fixes Node loading of that helper for ECDSA brainpool/secp256k1; a Rollup guard now rejects undeclared runtime `nodeRequire` dependencies. This is not a claim that every cryptographic dependency has been audited.
- Extend **public-only** certificate import to the narrowly reviewed **v4 legacy Ed25519 primary / Ed25519 or Curve25519 subkey** packet profile (algorithms 22/18). RSA imports are v4, now extended to 2048–16384 bits by the follow-on large-RSA request. NIST, brainpool, secp256k1 and v6 app-keyring profiles are not added.
- Preserve the **default generator and protected-download invariants**: two same-size v4 RSA packets (3072 by default; explicitly selectable through 16384), AES-256 protected secret material, iterated SHA-256 S2K at coded count `0xFF`, explicit fingerprint and sensitive-backup acknowledgment. There is still no arbitrary secret-key importer or public-key message UI.
- Add `scripts/encrypt-openpgp-backup.mjs`: a separate Node 22 streaming release tool that does not require native GnuPG or an owner private key. It accepts exactly one public certificate and a separately supplied full primary fingerprint, verifies the primary and selects a currently valid bound encryption key. Ambiguous bundles, secret/mixed packets, incorrect fingerprints and unusable recipients are refused.
- Fix the Android encrypted-export handoff: use repository-root APK paths, encrypt **public / network / private** builds separately, and export ciphertext before potentially slow emulator tests. A recipient dispatch requires both the certificate and full fingerprint and exports no plaintext APK. Normal CI retains main's public + opt-in network plaintext artifact; the private APK is never published as plaintext. Device tests retain their assertions and have a 15-minute step bound; separate dispatch/PR concurrency groups prevent a backup dispatch canceling the PR gate.
- Explicitly install distribution-maintained `gnupg`, `gpg-agent`, `gpgconf` and `gpgv` in native interop CI, then require all native readers. `gpgv` alone is not full GnuPG. No native GnuPG binary is embedded into a WebView or renamed as a JavaScript dependency.

## Encryption boundaries

The tool writes exclusive-create, mode-0600 binary `.gpg` ciphertext and two UID-free sidecars: JSON provenance/checksums and a `sha256sum`-compatible file. It inspects the resulting envelope for exactly one v3 public-key-encrypted session-key packet addressed to the selected encryption key and a classic SEIPDv1/MDC body. AES-256 is preferred subject to the recipient's advertised preferences. Synthetic decryption controls independently check the actual selected session cipher.

These backups are **unsigned**. MDC detects ciphertext modification; it does not authenticate the sender. A checksum is not a signature. Receipt verification does not claim that a real owner decrypted the backup: that final test belongs on the owner's device, using a private key and passphrase that never enter CI or this repository. JavaScript processing and file removal are not secure-memory or secure-erasure guarantees.

The public keyring remains atomic, bounded and memory-only. Secret-packet preflight, full fingerprints, changed-certificate review, archival-only display, cancellation and import-revision checks remain in place. Accepting a certificate does not establish its owner identity, certify every UID/subkey, or assign owner trust.

## Source investigation

Machine-readable digests, npm integrities, exact commits, release metadata and limitations are retained in [`research/openpgp-dependency-update-2026-11-17.json`](research/openpgp-dependency-update-2026-11-17.json). The original nine-upstream/40-file review remains in its own source manifest; its dependency record now points to this update and retains the previous hashes.

- **GitHub:** publisher [OpenPGP.js 6.3.3 release](https://github.com/openpgpjs/openpgpjs/releases/tag/v6.3.3) and [6.3.2…6.3.3 comparison](https://github.com/openpgpjs/openpgpjs/compare/v6.3.2...v6.3.3), pinned to `804cf464668fa088e20f7d3fe4501e39aa4cd4e1`. Reviewed `package.json`, `rollup.config.js`, ECDSA Node conversion entrypoints and `src/config.ts`; four fetched source files have independent SHA-256 records. Publisher timestamps are copied verbatim, not used to redefine the review date. GitHub's signature badges are not independent local tag-signature verification.
- **New helper limitation:** `eckey-utils` is retained at the exact lockfile resolution allowed by OpenPGP.js, not silently upgraded to its incompatible new major. Its installed entrypoint was inspected and hashed. The npm metadata's `gitHead` could not be retrieved from the stated GitHub repository (404), so source-byte equivalence at that revision is **not claimed**. npm SHA-512 integrity, local source hashing and synthetic Node sign/verify controls provide a narrower, explicit provenance boundary.
- **GitLab:** official [Sequoia OpenPGP](https://gitlab.com/sequoia-pgp/sequoia), including a pinned Cargo project page, was inspected as an independent Rust implementation. It is not a JavaScript drop-in; no Sequoia install, complete transitive Cargo review, WebAssembly port or additional binary is claimed.
- **Internet Archive:** the [historical Arch GnuPG collection](https://archive.org/details/archlinux_pkg_gnupg) and [2018 OpenPGP.js mirror](https://archive.org/details/github.com-openpgpjs-openpgpjs_-_2018-03-13_07-34-52) were inspected for provenance. Neither was installed or treated as a current security update. Archival availability is not package authenticity or permission to downgrade.
- **Native GnuPG:** consult the [canonical publisher download/dependency page](https://gnupg.org/download/index.html). Native readers are installed from the CI runner's signed distribution repositories; the browser library and native toolchain are different components.

## Network/coin packaging

The opt-in network APK contains the same current 94 approved public apps plus RadarScope and News Globe (96 total). Its build now compares the APK's three Keyspace registry files and OpenPGP keyring/browser bundle **byte-for-byte** with the current reviewed checkout. This guards against shipping an old generated app tree after a dependency or coin-research update.

The existing catalogue remains **500 assets / 347 derivation-supported / 153 unsupported**, with 58 researched host-fee profiles and the three existing USDT network identities. The network permission does not imply all-chain support, live balances, token backing, zero transfer taxes, transfers or bridge compatibility. The USDC Ethereum source tranche remains research-only; its outstanding acceptance gates are not bypassed by this release. Public/private Android profiles still omit `INTERNET`. The private Android two-app allowlist is not the separate four-app private browser bundle.

## Regression and remaining gates

- New synthetic recipient controls exercise both Node and the actual vendored browser distribution; an additional signing subkey, full-primary-fingerprint matching, concatenated/single-block ambiguity, secret-packet refusal, expired/revoked/signing-only/unbound recipients, exact binary recovery, negotiated AES-256, single-recipient/MDC envelope checks, modified-ciphertext and wrong-owner failures, mode-0600 output, non-overwrite and failed-sidecar cleanup.
- Node ECDSA regressions exercise brainpool and **explicitly opted-in, test-only** secp256k1 to cover the upstream dependency fix. The production library's default secp256k1 rejection and narrow app-keyring policy stay intact.
- A new mandatory native test imports a fresh synthetic legacy Ed25519/Curve25519 key into isolated GnuPG, decrypts the actual streaming release-tool output with `GOODMDC`, checks exact bytes and round-trips all three public key packets. The pre-existing RSA/PGPy/gpgv controls remain required in CI. Synthetic homes/agents are removed afterward and never uploaded.
- Real Chromium tests cover the new ECC import in addition to RSA generation, protected downloads, private-input rejection, memory reset, mobile layout and absence of external requests.
- APK builds, device/WebView smoke tests, native interop, GUI/mobile-client compatibility and owner-key decryption are separate evidence. Local absence of a JDK/Android SDK or full `gpg`/`gpgconf` must be reported as a skip, never relabeled as a successful device/native execution. Live providers, PhotonVPN identity, and financial/backing checks retain their separate acceptance gates.

## Optional direct storage handoff

A manually dispatched, opt-in transport can bridge artifact-download restrictions
using **file-specific, one-time Drive upload sessions**, not an account OAuth
token. A temporary GitHub Actions secret binds three HTTPS session URLs to the
exact source revision and distinct encrypted targets. The uploader preflights
all three ciphertext receipts/digests and recipient fingerprints before sending
any bytes, refuses redirects, uses bounded chunks and confirms upload state and
offsets. CI notices carry only ciphertext provenance and returned file IDs, not
the credential-bearing session URLs. Independent destination metadata/checksum
verification and temporary-secret deletion remain release-operator duties.
An uncertain/finalized upload must be inspected before retrying, never blindly
replayed. This mode does not change cloud sharing or publish a private APK.

The follow-on user request adds bounded large RSA generation/import, with
separate advanced-size consent and saved-size private-export validation. See
`openpgp-large-rsa-2026-11-17.md`; the earlier fixed-3072-only scope is superseded,
not a claim that the new sizes have mobile-client certification. The Drive
handoff remains blocked by the integration's HTTP 403 on Actions Secrets access;
no temporary Actions secret has been created and no APK transfer is claimed.
