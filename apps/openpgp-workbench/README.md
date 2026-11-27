# OpenPGP Workbench

Local browser text tools, **conservative key creation, a public-only keyring with opt-in Keybase discovery, and bounded wordlist-assisted private-key passphrase recovery**. This is not a general-purpose secure PGP client or a certification that every target app accepts every export.

## Build and preview

```sh
npm ci
npm run build:openpgp-workbench
npm run dev -- --host 0.0.0.0
```

Open `/apps/openpgp-workbench/`. The build copies the application and the unmodified, pinned OpenPGP.js browser bundle to `public/apps/openpgp-workbench/`. No CDN or remote module is used. Web Crypto in a secure context (HTTPS or localhost) is required.

## Current scope

- **Encrypt:** the existing classic passphrase-only UTF-8 text writer. Up to 1 MiB plaintext, 2 MiB message armor and 4 KiB passphrase. v4/direct-S2K SKESK, iterated SHA-256 S2K (`0xFF`), AES-256 and SEIPD v1/MDC; no AEAD output.
- **Decrypt messages / files — no private key for password messages:** paste one complete `PGP MESSAGE`, or explicitly select an armored `.asc` / binary `.pgp` / `.gpg` file (content checked, extension not trusted). Supply its passphrase. Maximum 2 MiB encrypted input, 1 MiB payload, four password recipients and 64 MiB Argon2 memory. A fresh local module worker makes **one** attempt with a hard 30-second limit; Stop, input change, tool switch, Clear and page-hide terminate/discard pending work. No automatic attempt, network fetch, password guessing or main-thread fallback. Passphrase fields clear on Start.
- **Decrypted payload:** valid UTF-8 is shown as inert text; preview/clipboard line endings may normalize, while the explicit byte export preserves the original payload. Other bytes are never rendered/executed. A separate acknowledgement enables explicit save as fixed `openpgp-decrypted.bin`; embedded filenames are ignored, no archive extraction and no automatic save. Saved bytes are **unencrypted**. Browser download requests are not completed-save receipts; the existing Android system-picker/read-back adapter and native policy remain unchanged. Clear/page-hide drop payload references and suppress stale save/result status, but **cannot retract bytes already handed to the system picker**; a pending save may still finish. No guaranteed memory/disk erasure. The shared native-save client now compares the returned SHA-256 to the exact exported Blob before confirming any Workbench export.
- **Public-key-only ciphertext:** a public certificate, fingerprint, username or unrelated password cannot replace the matching private key / authorized hardware key. This password-message workflow explains that boundary; it does not ask for a private-key paste or weaken the separate recovery/keyring gates. A message with a valid password recipient can be opened by that password without a private key; this does not authenticate its sender. MDC does not authenticate the sender.
- **Create key:** supply your own name/alias and/or optional email, strong unique passphrase and expiry. Random **v4 RSA-3072 by default** signing/certification primary plus same-size encryption subkey; selectable 3072/4096/6144/8192/12288/16384 bits, SHA-256 self-certification and classic SHA-2 preferences. Default expiry 730 days; allowed 30–3650. No identity is inferred, and no wallet seed or recovery phrase is used.
- **Protected private export:** both packets use AES-256, iterated/salted SHA-256 S2K, count `0xFF` (65,011,712 octets). A minimum 12-character passphrase is required, but length is not a strength guarantee. Generated private armor never becomes a page field or clipboard item. Download requires explicit acknowledgement and the full matching fingerprint, with a packet-protection recheck.
- **Revocation backup:** a separate, explicit **unencrypted sensitive certificate**. Anyone holding it can revoke the key. Keep it private/offline; never bundle it with the public certificate you share.
- **Public keyring:** memory-only by default; optional device remembering for validated PUBLIC v4 RSA certificates (2048–16384 bits), v4 legacy Ed25519/Curve25519, or v6 Ed25519/X25519 certificates, 1 MiB / 32 certificates. Supports multiple keys inside one armor block and concatenated armor blocks. Secret packets, mixed/junk/unsupported packets and other key profiles are refused atomically. Full expected fingerprints may be supplied for a single-certificate import; short IDs are never accepted. Public fingerprints are 40 hex characters for v4 and 64 for v6; v6 still requires a modern destination client.
- **Keybase discovery (optional network):** exact-username public-key lookup, bounded local certificate/fingerprint validation, and per-certificate review actions. No request until you acknowledge the network disclosure and press Look up. Loading a result only stages public input; import and independent fingerprint comparison remain separate. See the privacy/trust rules below.
- **Fuzzy public search:** filter in-memory certificates by name/email with bounded typo tolerance, or exact-only fingerprint text. This changes the list only, never imports, recipient selection, confirmation fields, public remembering or full-keyring exports. Search text is not saved; Clear search / Escape restores the list. See the separate search rules below.
- Identical public certificates deduplicate; changed data with the same fingerprint requires explicit remove/reimport after reviewing updates/revocations in a dedicated client. Primary self-certification state is checked **at import time**, not continuously. Expired/revoked/invalid certificates are marked archival-only. Every User ID remains an unverified claim; there is no owner-trust assignment or blanket subkey audit. The display separately detects a currently usable bound encryption key; signing/authentication-only subkeys are not encryption keys.

- **Recover passphrase:** a separate, explicit transient protected-key input with ranked wordlist/hint preview and optional small typo variants. At most 256 candidates / 120 seconds, a dedicated local module worker, full fingerprint and permission acknowledgement, exact all-secret-packet unlock/validation, Stop/Clear/navigation termination, and explicit result reveal only. It does not import secrets into the public keyring, reset a passphrase, decrypt messages/files or export an unlocked key. See bounds below.

No public-key **message** encryption/decryption, persistent secret-key import, signing UI, attachments, modern AEAD message writer, hardware cards, pairing, general keyserver search/publishing, Keybase login/proof-chain verification, telemetry, background request or automatic secret persistence is implemented. Add a generated public key to the keyring explicitly; nothing is downloaded or published automatically.

## Keybase public-certificate discovery (explicit network opt-in)

1. Open **Public keyring → Find public certificates on Keybase**. Enter an exact
   Keybase username: 2–16 ASCII letters/digits, single underscores permitted but
   not first (a trailing underscore is permitted by Keybase). No `@` prefix,
   email, URL, wildcard, account autocomplete or fuzzy remote search.
2. Read and check the network disclosure, then press **Look up on Keybase**.
   Opening the panel, typing, checking the box, mounting/restoring the app and
   local fuzzy search do **not** make a request. Each lookup needs an explicit
   submit; consent/username/results are never remembered and Clear/navigation
   resets consent. The checkbox does not authorize publishing or account access.
3. Review locally calculated full primary fingerprints, User IDs, profile and
   import-time self-certification/encryption-binding state for **every** returned
   public certificate. Press **Load this PUBLIC certificate for review** on a
   chosen certificate to replace only the local public import input. No import,
   persistence, clipboard/download, recipient selection or owner trust follows.
4. Obtain the full fingerprint through an **independent trusted channel** and
   compare it in **Expected full fingerprint**, then explicitly **Import public
   keys**. Keybase never fills or changes that confirmation field. The existing
   optional-fingerprint import mode remains identity-unverified; even matching
   independently supplied bytes do not assign an owner-trust policy here.
   Fuzzy search after import filters local certificate User IDs, not Keybase
   accounts, and never supplies cryptographic authorization.

The only network adapter is `keybase.mjs`. It uses Keybase's documented
[CORS-enabled public-key file endpoint](https://keybase.io/docs/api/1.0/call/user/pgp_keys.asc):
`GET https://keybase.io/<username>/pgp_keys.asc`. Unlike a primary-only JSON
lookup, this endpoint can contain multiple certificates. The username rules
follow the [upstream kbun checker](https://github.com/keybase/client/blob/02a1da1c8a54c916a72b47d14c5e8e21a48cd99b/go/kbun/username.go).
Only the normalized username is taken from the workspace. Keybase receives it,
your network address and normal browser metadata (for example, Origin and User
Agent); it may log them. Requests use CORS, `credentials: omit`, no referrer,
`cache: no-store`, no request body and `redirect: error`. No API token/login,
account cookie, remote avatar/script, proxy, fallback service, automatic retry
or app background request is involved. Private keys, protected exports,
messages, recovery hints/wordlists/guesses and passphrases never reach this
adapter. A restrictive `connect-src` permits only this service and same-origin
local assets; it is defense in depth, not protection against a compromised
origin/browser or extensions.

Network and local preview are bounded to **15 seconds** and a **1 MiB** streamed
UTF-8 response (actual bytes, not a trusted Content-Length). There is no
unbounded `.text()` fallback. The entire file goes through the **same read-only
public parser** used by imports: at most 32 certificates, reviewed v4 RSA,
legacy v4 Ed25519/Curve25519 or modern v6 Ed25519/X25519 profiles, no secret,
mixed, malformed or unsupported packets. A bad later certificate refuses the
whole preview, never silently selecting the first valid one. Multiple-key files
are displayed separately for an explicit choice. Expired/revoked/invalid
self-certifications remain marked archival-only; discovery never makes them
usable encryption recipients. HTTP errors, missing public PGP keys, redirects,
invalid encoding, oversize data, CORS/offline failure and timeout are visible
without changing existing input, keyring or saved public data.

Cancel, username/consent edits, lookup Clear, keyring/global Clear and navigation
abort/discard pending requests and reject stale results. A request already sent
cannot be recalled from Keybase; cancel drops app references but cannot promise
server-log or browser-memory erasure. Local library validation is not a
preemptible secure worker; its late results have no import/storage authority.

**Discovery is not identity verification.** Fingerprints are computed from the
returned public bytes, not trusted server metadata, but a malicious/wrong
account can still publish the wrong key. Workbench does not verify Keybase's
signature chain, Merkle tree, social/domain proofs, account ownership or current
revocation history outside the returned certificate. A Keybase username,
self-signed UID, HTTPS response or matching Keybase-supplied fingerprint would
not constitute independent proof.

**Android:** public/private offline profiles retain their existing network
blocks and no INTERNET permission. The UI disables lookup in the offline
launcher without making a connectivity probe; native policy remains authoritative.
Use the separately opted-in network APK or an HTTPS browser for lookup, or
load public `.asc` files locally. No Android permission or native network policy
is relaxed. All other Workbench crypto/recovery remains local.

Tests use synthetic certificates and intercepted CORS responses, including real
Chromium with the shipped modules. Live Keybase availability/CORS from a user's
origin and a physical-device Android Keybase lookup are **not** claimed by those
controls; provider availability/policy can change. Official documentation and a
public endpoint were inspected, but are not an identity or live-browser guarantee.

## Fuzzy public-certificate search

Open **Public keyring**, explicitly import your public certificates, then use
**Fuzzy search public certificates**. Name/email words compare case-insensitively
with NFC Unicode normalization: insertion, deletion, substitution or adjacent
swap, one edit for 3–5 code points and two for 6–64. Shorter/longer terms match
literally. Every word must match; literal text matches rank before fuzzy matches,
with original ring order for ties. Up to 128 input characters / eight words;
the existing 32-certificate, 32-UID/certificate and 2048-byte/UID model bounds
still apply. Empty search shows the original list, and no-match/invalid input
has its own accessible status. Punctuation is not a regular-expression wildcard.

Hex-looking queries of eight or more digits (spaces/case allowed) filter primary
fingerprint text **exactly**, without fuzzy name fallback. A fragment is only a
display convenience: expected import/recipient/recovery/export fingerprints
still require the existing exact full 40-hex v4 / 64-hex v6 value. No result is
automatically trusted, imported, exported or selected as a recipient. User IDs
remain unverified text, not HTML.

The filter never edits certificates or the full-keyring `.asc` output. Even
with zero visible results, **Download/Copy public keyring includes every stored
certificate**. Individual result actions remain bound to that certificate's
original full fingerprint, not its ranked position. Search does not rewrite an
opted-in PUBLIC snapshot and is cleared on ring/global Clear or navigation;
reload restores only an explicitly remembered, revalidated public ring, not
queries or secrets. The local filter itself adds no engine, network request, dependency or store; it never invokes the separate opt-in Keybase lookup.

This public metadata filter is distinct from the existing private-key recovery
planner below. Fuzzy resemblance never authorizes cryptography or partially
unlocks a key.

## Bounded local passphrase recovery

Open **Recover passphrase**, load/paste your protected private `.asc` and a small
UTF-8 wordlist, optionally supply a remembered hint, then **Preview**. No
passphrases are tried during inspection. NFC + lowercase Unicode OSA edit
comparison ranks/filters entries at distance 0–2; original candidate strings
retain spaces, case and Unicode form. A zero fuzzy distance is **not** an exact
passphrase match. Without a hint, wordlist order is kept. Exact duplicates and
blank lines are removed; CRLF separates lines; malformed UTF-8 files are refused
and a BOM is retained as candidate data. Fuzzy filtering may remove the correct
candidate; the preview reports matched, filtered, duplicate and capped counts.

Variants are off by default: when explicitly enabled, generate case changes,
one deletion, character duplication or adjacent swap from the hint and first
three ranked entries. No arbitrary alphabet/numeric range, mask, chaining,
GPU/distributed search, large imported dictionaries or automatic retries. At
most 256 original entries / 32 KiB, 128 characters / 256 UTF-8 bytes per guess or
hint, and 256 total candidates. Existing matched entries take priority over
variants at the cap; all included guesses are ranked stably. Preview values are
hidden until explicitly revealed on screen.

Inspect exactly one complete protected certificate, at most 1 MiB / 128 packets
and 16 secret packets: v4 RSA-2048–16384, legacy v4 Ed25519/Curve25519, or v6
Ed25519/X25519. All included secret packets must have AES-128/192/256 protection,
iterated salted SHA-1/SHA-2 S2K and SHA-1 integrity or standard AEAD. **Argon2 is
refused before derivation**, not weakened; so are stubs, unprotected/mixed keys,
photo/unsupported packets, simple/salted-only S2K and old 16-bit checksums. Other
formats need a separately reviewed offline native client. Keep the original;
never strip private subkeys just to make a recovery attempt pass.

Compare and enter the full 40-hex v4 / 64-hex v6 primary fingerprint, acknowledge
ownership/permission and **Start**. This checks one exact candidate at a time
against **every** included secret packet, then validates each secret/public
parameter pair. It does not use the high-level primary-only validation shortcut
or weaken the existing public binding/revocation/recipient checks. Different
per-packet passphrases are not recovered. Success proves only that candidate's
unlock/parameter validation in this library, not owner identity, certificate
validity, ability to decrypt an old file, or another client's support.

Inspection has a 15-second worker limit; attempts have a hard 120-second limit.
Stop, Clear, global Clear, edits or navigation terminate the dedicated worker
and reject late replies. Progress counts only completed candidate trials;
timeout/cancel is not exhaustion, and an exhausted bounded plan is not proof
recovery is impossible. There is no main-thread fallback or new engine.
The unmodified local OpenPGP.js browser module is imported by relative URL in
the worker; it never uses the patched large-RSA generator.

Private/wordlist/hint fields are cleared on Start. Only counts, a fingerprint
and a matching **index**, never private parameters/passphrases, leave the worker.
The parent retains a successful candidate only for explicit reveal; no secret
copy/download/automatic save or PUBLIC keyring import is offered. Recovery Clear
does not alter an opted-in PUBLIC snapshot or any original/backup file.
Clearing/navigation drops references; it does not guarantee memory, clipboard,
autofill, extension, keyboard, swap or disk erasure. Use a trusted isolated
origin/device, not a shared catalog origin for high-value secrets. Do not send
private keys, guesses or hints to chat, CI, metasearch or online recovery sites.

See the [implementation/evidence and engine investigation](../../docs/openpgp-wordlist-recovery-2026-11-17.md).
SearXNG instances are discovery services, **not cryptographic engines**; no
metasearch integration or engine switching was added to the app.

## Export to another client

1. Start with a **throwaway** identity for compatibility checks. Prefer a dedicated reviewed native client for a sensitive real identity.
2. Download the protected private `.asc` and separately the revocation backup. Keep both private; keep the passphrase separately. A public-only `.asc` is sufficient only for sharing a public certificate.
3. Use the destination's normal key-file import. This is **not** an OpenKeychain encrypted `.sec.pgp` backup or a numeric backup code.
4. Compare the **full 40-hex fingerprint**, UID, key/subkey sizes and expiry in the destination. Test wrong/correct passphrases, two-way throwaway encryption and signature verification before relying on the combination. Do not import the revocation certificate as an ordinary setup step.

Targets are **source-informed** OpenKeychain, PGPony Android/iOS and official KDE Kleopatra/GnuPG. Android, iOS and Kleopatra runtime import/unlock checks remain **not performed**. Proton VPN release signing and the unresolved Photon VPN candidate are separate topics, not PGP keyring integrations. See the [source review](../../docs/openpgp-keyring-source-review-2026-11-17.md) and its pinned manifest.

## Explicit v6 public certificate subsets

Strict imports never silently discard unsupported algorithms. Some full v6
certificates contain additional public algorithms that OpenPGP.js cannot read;
the library's default high-level `readKey` can skip those blocks. Workbench
instead fails the import and leaves existing data unchanged.

For **one** certificate, enter the independently checked full primary fingerprint
and use the two explicit public input exports:

- **Full original PUBLIC .asc** preserves the input byte-for-byte, including
  unsupported PUBLIC subkey algorithm packets. This is the archival copy.
- **One-encryption-subkey PUBLIC .asc** retains the primary, User IDs, global
  signatures/revocations, and one usable bound encryption subkey with its binding
  and revocation material. It omits other subkey blocks, including unsupported
  v6 subkeys and their associated subkey signatures. A primary revocation cannot
  be stripped based on packet position. Malformed/mixed/secret/ambiguous material
  still fails closed; unsupported signatures outside omitted blocks are refused.

Exports do not edit signed fields, generate replacement signatures, silently
import a certificate, assign trust, revoke omitted keys or turn v6 into v4.
Omitted algorithms have **not** been judged invalid. Keep the full original:
old ciphertext may require a different secret subkey. Public material alone
cannot decrypt an archive. The v4 RSA generator and protected secret-export
fingerprint/protection checks are unchanged.

## Reliable local saves and opt-in PUBLIC remembering

In Android public/network builds, exports now open the system Files picker.
The old shell rejected all downloads; browser-only download tests did not cover
that failure. Success is shown only after the selected document has been written
and read-back checked for size/SHA-256. Cancel or a provider failure leaves the
export available in the open tab; it is not reported as saved. Choose an on-device
destination for local-only storage. A selected cloud provider may upload the
file. Explicit exports are temporarily staged in app-private cache, bounded to
64 MiB/file and cleaned on completion/cancel/navigation or next startup; neither
process-kill cleanup nor secure disk erasure is guaranteed. Ordinary browsers
still request downloads and explicitly tell you to check the Downloads folder;
a download request is not proof of a successful save.

“Remember PUBLIC certificates on this device” is off by default. It stores only
the validated public model, rechecks its 1-MiB limit and revalidates certificates
on reload. It never serializes forms/application state, private/revocation
material, messages or passphrases. User IDs are public claims but can be
personally identifying; the device copy is unencrypted and origin-scoped. It is
not a backup: uninstall/data clearing/device loss can remove it. Storage
quota/access failures are visible; unreadable saved copies are not silently
overwritten. “Forget” and explicit Clear remove the opted-in public copy;
navigation clears tab secrets without deleting that saved public copy. File
import uses the user-selected system file picker and the existing bounded parser.

## Memory and security limits

Clear buttons and `pagehide` drop fields/references and suppress late async results. They do **not** guarantee erasure of JavaScript/Web Crypto/engine copies, clipboard, browser/autofill state, extensions or OS download files. Reloading loses unsaved material other than the explicitly remembered PUBLIC keyring; this app cannot recover your passphrase. A compromised origin/browser can steal keys while they are generated. This educational app does not replace an independently reviewed secure-messaging client.

## Verification

```sh
node --test tests/openpgp-workbench.test.mjs tests/openpgp-keyring.test.mjs tests/openpgp-keyring-search.test.mjs tests/openpgp-keyring-dom.test.mjs
node --test tests/openpgp-keybase.test.mjs tests/openpgp-keybase-dom.test.mjs
node --test tests/openpgp-key-interop.test.mjs
# Full native GnuPG is separate from gpgv; requires gpg AND gpgconf:
node --test tests/openpgp-native-interop.test.mjs
# Optional Python reader: pin/hash-check build and runtime dependencies in an isolated environment:
# python -m pip install --require-hashes -r tests/requirements/openpgp-build.txt
# python -m pip install --no-build-isolation --require-hashes -r tests/requirements/openpgp-interop.txt
# REQUIRE_OPENPGP_INTEROP=1 REQUIRE_OPENPGP_NATIVE_INTEROP=1 node --test tests/openpgp-key-interop.test.mjs tests/openpgp-native-interop.test.mjs
# Optional existing Chromium harness dependencies:
node tests/openpgp-workbench-browser.mjs
REQUIRE_OPENPGP_BROWSER=1 node tests/openpgp-keybase-browser.mjs
node --test tests/openpgp-v6.test.mjs
node tests/openpgp-v6-browser.mjs
node --test tests/openpgp-recovery.test.mjs tests/openpgp-recovery-worker.test.mjs tests/openpgp-recovery-dom.test.mjs
REQUIRE_OPENPGP_BROWSER=1 node tests/openpgp-recovery-browser.mjs
```

Independent controls include the existing GnuPG symmetric vector/CyberChef reader, generated RSA signatures verified by **gpgv**, and optional **PGPy 0.6.0** parsing/unlock/cross-encryption/signature tests. `gpgv` is verification-only, **not** full `gpg` private-key import/decrypt validation. The real Chromium runner exercises Web Crypto, actual downloads, public remembering/restore, multi-key imports, reset and external-request observation. Real Android WebView file-save coverage is separate from Chromium downloads. All keys are synthetic and temporary; no private fixture is committed. See the source review for the complete evidence/remaining-device-test matrix.

The separate native-GnuPG harness uses fresh private temporary homes, protected synthetic key files, passphrases through stdin (not argv/environment), and dedicated-agent shutdown before wrong-passphrase checks and cleanup. It covers both secret packets, exact fingerprints, bidirectional encryption/signatures, secret re-export, both public-keyring armor layouts and revocation. Missing tools/readers are explicit optional skips locally, but **fail** when the required flags above are set; the bounded `OpenPGP native interoperability` CI lane sets both flags. Its first mandatory [run passed](https://github.com/shdwelf/Html5/actions/runs/45229648748) for head `76078209ecd11f40b6cca8c47066184ea83e0bf1`; see the [exact evidence and remaining-runtime boundaries](../../docs/openpgp-native-interop-2026-11-17.md). This is not a Kleopatra GUI, OpenKeychain or PGPony device test. No synthetic private home, key, passphrase file or revocation artifact is uploaded.

A PGPy failure exposed OpenPGP.js's default SHA-3 preference IDs in otherwise classic RSA keys. `keyring.mjs` now constructs a fresh narrow UID self-certification using the **library's exported signature API**, then reparses and verifies the result. It does not alter already-signed bytes or implement a cryptographic primitive. Regression checks cover those exact preferences and the bundled browser distribution.

## Third-party library

OpenPGP.js **6.3.3**, `LGPL-3.0+`, remains pinned in the root manifest/lockfile. The unmodified browser distribution and full license are copied to `vendor/`. See `THIRD_PARTY_NOTICES.md`. No source from the reviewed native applications is shipped in this workbench.

## Recipient-encrypted release backups

`scripts/encrypt-openpgp-backup.mjs` is a separate Node 22 release tool, not a new message UI or a bundled native GnuPG binary. It streams files to a **single** public recipient, requires the exact full primary fingerprint, and rejects secret/mixed certificates, ambiguous bundles, expired/revoked primaries and missing/invalid encryption keys. It defaults to the reviewed v4 RSA and legacy Ed25519/Curve25519 public profiles. An explicit `--profile modern-v6` accepts only a v6 Ed25519/X25519 recipient; it does not change the 3072-bit default or relax selected-size/protected-private-download checks.

Outputs are exclusive-create, mode-0600 binary OpenPGP ciphertext plus a UID-free JSON receipt and SHA-256 sidecar. The default `classic-v4` envelope must contain one matching v3 PKESK and SEIPDv1/MDC. Explicit `modern-v6` instead requires one v6 PKESK containing the complete selected subkey fingerprint and SEIPDv2/AEAD; the actual cipher/AEAD IDs are recorded. A version/profile mismatch is an error, not an automatic downgrade. Use the checked reduced certificate if the full original has unsupported subkeys; encryption never strips them implicitly. These unsigned backups protect confidentiality/integrity but do not authenticate a sender. The owner must perform final decryption with their own private key; do not send that key or its passphrase to CI. See `apps/html5-offline-launcher/README.md` for the three distinct APK profiles.

OpenPGP.js is exactly pinned at 6.3.3, including its newly declared `eckey-utils` Node dependency in the lockfile. Node ECDSA dependency-loading regressions exercise brainpool and explicitly opted-in secp256k1; neither curve is newly accepted by the app keyring, and the library's default secp256k1 rejection stays intact. Native `gpg`, `gpgconf` and `gpgv` remain independent CI readers, not browser dependencies.

## Large RSA (advanced opt-in)

Create key offers **3072 / 4096 / 6144 / 8192 / 12288 / 16384 bits** for both
packets. Public RSA imports accept 2048–16384 bits. Above 4096 bits, the UI
requires a separate performance/compatibility acknowledgment. Large searches
can take many minutes; Native Web Crypto work cannot be canceled once started. Clear discards that
result but cannot stop native CPU work, and another job cannot overlap. Above
8192 bits uses an isolated local worker with the existing OpenPGP.js prime-search
fallback enabled by a one-condition dispatch patch, not native generation;
Clear terminates this worker, which has a 20-minute resource cap. The normal
vendored module remains upstream, while the separate worker is an explicitly
modified local build with readable corresponding source and a pinned build
receipt. See `THIRD_PARTY_NOTICES.md`; this is not a cryptographic security audit.
**16384-bit browser generation is experimental**: a real trial hit that limit
without completing; successful Node generation does not prove browser
completion. Real 12288-bit worker generation did complete.
The default stays 3072, unsupported sizes never silently downgrade, and very
large keys are not a mobile/hardware-client compatibility guarantee.

`checkedPrivateDownload(armor, fingerprint, { rsaBits })` requires the immutable
saved generation size; the default parameter stays 3072 for existing callers.
Both secret packets must match and retain the same original protection. The UI
uses the saved bundle metadata, never a later selector value. See
`docs/openpgp-large-rsa-2026-11-17.md` for bounds, caveats and the separate mandatory
real 8192/16384-bit native GnuPG lane and 8192/12288-bit completed Chromium
generation controls (16384-bit browser worker cancellation is separate). Fast local runs explicitly skip expensive prime
searches unless `RUN_OPENPGP_LARGE_RSA=1` is set.

Modern v6 tests cover the Node and shipped browser distributions, actual Chromium
Web Crypto, explicit full/subset downloads, public reload and synthetic exact-byte
recovery/tamper rejection. Both JS distributions use OpenPGP.js; those controls
alone are not independent native evidence. A separate, test-only
[Go v6 harness](../../tests/openpgp-v6-native/README.md) pins
ProtonMail/go-crypto v1.5.2 and requires four real two-way/strictness/tamper
controls in its own bounded CI lane. It recovers the actual streaming release
helper's AES-256-OCB output independently and writes negotiated AES-256-GCM for
both JS readers, with exact full fingerprints and authentication-before-output.
See the [versions, evidence and limitations](../../docs/openpgp-v6-native-interop-2026-11-17.md).
This is not GnuPG/PGPy v6, OpenKeychain/PGPony/Kleopatra GUI, protected-v6-secret
export or owner-key recovery certification. Owner decryption with a real key
remains a separate local acceptance check; no owner private key/passphrase is
needed by these synthetic tests.
