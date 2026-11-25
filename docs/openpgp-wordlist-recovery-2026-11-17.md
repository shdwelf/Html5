# OpenPGP Workbench: bounded owner-authorized wordlist recovery

Research-series label: **2026-11-17**, not an upstream release date. Engine
observations below distinguish pinned source, moving documentation and actual
execution. This is a small local assistance workflow, not unbounded cracking,
a cryptographic audit, owner-key recovery, or physical-device certification.

## Delivered scope and acceptance

The requested target was clarified as **protected private-key passphrase
recovery**, with **both** ranked wordlist entries and optional bounded typo
variants, **previewed before attempts**. The separate **Recover passphrase** tab
implements that scope. Public-key/message/file recovery is not added.

1. Explicitly select/paste one protected private certificate and a small UTF-8
   wordlist. No account/identity inference, auto-generation, online wordlist,
   keyserver or automatic attempt.
2. Optional remembered hint: NFC + lowercase Unicode OSA edit comparison
   (insert/delete/substitute/adjacent transpose), distance 0–2, stable ordering.
   Actual passphrase strings keep their spaces, case and Unicode form; **fuzzy
   similarity is not partial cryptographic success**. Without a hint use list
   order. Filtering may omit the correct guess; the preview reports exclusions.
3. Variants are default-off. Explicit opt-in generates case changes, a single
   deletion/duplication/adjacent swap from the hint and first three ranked
   entries. No alphabet/range expansion, masks, chaining, GPU/distributed work
   or retries. Matched original entries have priority when the total cap is hit.
4. Preview shows ordered sources/distances and counts (including duplicates,
   exclusions and capped variants). Candidate values remain hidden until
   explicitly revealed. Inspection tries **zero** passphrases.
5. Enter/compare the exact full primary fingerprint and acknowledge permission.
   Start tries exact guesses sequentially; a match must unlock **and validate
   every included secret packet** using the same candidate. Different packet
   passphrases are not recovered. There is no fuzzy fingerprint acceptance.
6. Only counts, fingerprint and a matching **index** leave the worker. Inputs
   clear on Start; a successful candidate is retained in parent memory solely
   for explicit reveal, not automatically copied/saved/exported. No unlocked
   key, public certificate, decrypted message or file is produced.

A successful check is not owner/UID authentication, certificate self-signature,
subkey-binding, expiration/revocation validation or proof an old archive can be
opened. Those recipient/public-keyring checks remain separate and unchanged.

## Enforced profile and resource limits

| Input / operation | Limit |
| --- | --- |
| Private ASCII armor | Exactly one complete certificate, 1 MiB, 128 packets, 16 secret packets |
| Key algorithms | v4 RSA-2048–16384; legacy v4 Ed25519/Curve25519; v6 Ed25519/X25519 |
| Secret protection | AES-128/192/256, iterated salted SHA-1/SHA-2 S2K, SHA-1 integrity or standard AEAD |
| Refused before attempts | Public/bundled/mixed/unsupported/photo packets; unprotected or dummy/missing-secret material; simple/salted-only S2K, MD5/old 16-bit checksums; Argon2 |
| Wordlist | 32 KiB UTF-8, 256 nonempty entries; exact duplicates removed; malformed UTF-8 refused |
| Candidate / hint | At most 128 Unicode characters and 256 UTF-8 bytes, no C0/C1 controls, line separators, bidi overrides/isolates or unpaired surrogates; empty guesses unsupported |
| Combined plan | At most 256 exact candidates; no parallel guessing |
| Key inspection | Dedicated module worker, hard 15-second parent timeout |
| Candidate attempts | New dedicated worker, hard 120-second parent timeout |

CRLF separates wordlist lines; blank lines are ignored. No trimming or Unicode
normalization changes actual guesses; a BOM remains candidate data. Argon2 is
explicitly outside this bounded profile, not weakened or relabeled a wrong
guess. S2K remains the original key's S2K. The time cap bounds the run but does
not promise a fixed browser-wide memory ceiling or secure erasure.

## Implementation and security boundaries

- `recovery.mjs`: bounded pure planning plus an injectable wrapper around the
  existing OpenPGP.js packet/parser/fingerprint/decrypt/validation APIs. Strict
  raw packet preflight is compared with the high-level reader's complete secret
  packet list; no silent unsupported-subkey drop is accepted. Every secret
  packet's parameters are validated, rather than relying on high-level
  `decryptKey`'s primary-key validation alone. No primitive is reimplemented.
- `recovery-worker.mjs`: a readable one-shot module importing the **unmodified**
  local `vendor/openpgp.min.mjs` by relative URL. Workers do not inherit page
  importmaps. This is not the large-RSA generation-patched distribution.
- `recovery-worker-client.mjs`: strict metadata/count/index protocol, sequential
  progress and final-count checks, hard timeout, abort cleanup and unconditional
  termination. Never expose dependency errors/inputs as UI diagnostics; invalid,
  duplicate or late responses cannot yield a match.
- `recovery-ui.mjs`: dependency-injected, revision-bound preview/run/file-read
  lifecycle, stale-input recheck before Start, text-only rendering, permission
  and full-fingerprint confirmation, explicit reveal and no persistence/export
  capability. A canceled older preview cannot reset a newer active job.
- Stop, recovery/global Clear, edits and navigation terminate work and suppress
  late replies; file reads cannot repopulate cleared/newer inputs. No worker
  support means a visible failure, **not main-thread decryption fallback**.
- Recovery Clear does not change an opted-in PUBLIC snapshot or any original
  key/backup. Global Clear retains its existing explicit public-storage removal;
  navigation retains only an opted-in public snapshot. Recovery never receives
  the ring, storage or file-export helper.

Use a trusted isolated device/origin for secrets, not an untrusted shared
catalog. Browser extensions, same-origin code, autofill/keyboard/clipboard,
screenshots, engine/native memory copies, swap and existing files are outside
this wrapper's protection. Clearing drops references; it is **not** a guaranteed
memory/clipboard/disk erase. Do not send owner keys, hints or guesses to chat,
CI, online recovery services or metasearch. No owner secret was requested or
used in development; all controls use newly generated synthetic keys.

## Engine investigation: discovery is not cryptography

The reproducible source pins, file SHA-256 values and discovery URLs are in
[`research/openpgp-recovery-engines-2026-11-17.json`](research/openpgp-recovery-engines-2026-11-17.json).
Only generic public engine names were queried.

- [searx.space](https://searx.space/) is a SearXNG **instance directory**, not a
  PGP engine or privacy/compatibility certification.
- [BareSearch](https://baresearch.org/) is a metasearch instance. Its JSON query
  fetch failed; the tested general HTML query returned no results. This is not
  an engine-support finding or an exhaustive search.
- [Utilibre](https://utilibre.org/en/) is a tool catalog. Its actual
  [search endpoint](https://search.utilibre.org/) returned irrelevant/noisy IT
  and mixed general results, including Sequoia. Candidate engines were checked
  against primary sources afterward; catalog privacy descriptions are not an
  independent privacy audit.

| Engine / interface | Primary-source finding | What was actually executed / decision |
| --- | --- | --- |
| OpenPGP.js **6.3.3** | Existing pinned runtime; secret-packet decrypt/validation APIs reviewed. Node/browser builds share an implementation. | New synthetic exact/wrong, v4/v6, all-packet, malformed/stub/mixed, Unicode and cancellation controls; actual Chromium workers. Keep this runtime. |
| [GnuPG / GPGME](https://gnupg.org/software/gpgme/index.html) | Native GnuPG provides key operations; GPGME wraps its engine. `gpgv` only verifies signatures. [Key-management manual](https://www.gnupg.org/documentation/manuals/gnupg/OpenPGP-Key-Management.html). | Existing mandatory classic GnuPG harness extended to recover a protected synthetic GnuPG re-export. Local full `gpg`/`gpgconf` absent; exact-head CI must supply/run them. No GnuPG v6 claim, native binary or browser shell bridge added. |
| [Sequoia / sq / sqop](https://www.sequoia-pgp.org/projects/) | Rust library/project page describes RFC 9580, CLI and SOP operations; `sqv` is a detached-signature verifier. | Documentation only. The [status page](https://www.sequoia-pgp.org/status/) explicitly says **2024-10-02**; do not treat it as a current-version support matrix. No Rust/WASM build or browser integration. |
| [RNP / librnp](https://github.com/rnpgp/rnp/blob/3f2dcc913631b84d834d95eee8a33ef824dc69df/include/rnp/rnp.h) | C API has exact-password/provider `rnp_key_unlock` and protection queries. At the pinned source, crypto-refresh/PQC features depend on backend/build flags and default off. [Backend matrix](https://github.com/rnpgp/rnp/blob/3f2dcc913631b84d834d95eee8a33ef824dc69df/docs/crypto-backends.adoc). | Commit-pinned source review only. Do not infer a packaged binary's v6/Argon2/AEAD support from the name RNP. Not compiled/linked. |
| [rPGP](https://github.com/rpgp/rpgp/blob/1a5788b91726200e1c4ccd697430e59426c82be2/README.md) | Pure Rust; README and [implementation checklist](https://github.com/rpgp/rpgp/blob/1a5788b91726200e1c4ccd697430e59426c82be2/docs/IMPL_STATUS.md) claim v4/v6 and RFC-9580 packet/envelope support. | Commit-pinned source review, not an executed interop result or guarantee for every rPGP-based app. No new runtime dependency. |
| [Bouncy Castle Java bcpg](https://github.com/bcgit/bc-java/blob/6560e91d0a164b8ab58266f141ee6daeec21a340/README.md) | Pinned README lists RFC 4880/9580; `PGPSecretKey.extractPrivateKey` takes a decryptor and returns null for missing private material. General specifications page still lists older OpenPGP RFCs. | Source only. Neither old general documentation nor a distinct FIPS provider certificate establishes this app's v6/Android support. No Java/Android engine added. |
| [go-crypto v1.5.2 / GOpenPGP](openpgp-v6-native-interop-2026-11-17.md) | The separate, pinned native-v6 message harness already exists; GOpenPGP is a wrapper, not a second independent engine. | Existing four mandatory native-v6 message controls rerun separately. They do not certify protected owner-key recovery. No Go engine shipped in browser. |

**Decision:** no runtime engine picker, native binary, dependency update,
metasearch call, automatic dictionary download or secret upload. A future native
backend needs version/build-flag/license review, isolated homes/agents, safe IPC,
explicit user consent and exact protected-key negative/positive controls. Fuzzy
ranking belongs outside each engine's exact passphrase/integrity validation.

## Fresh local verification and required CI

Commands are in the app README. The new work was checked independently of the
prior PR239 head's successful native-v6/classic/large-RSA runs:

| Run | Fresh local result |
| --- | --- |
| Three new recovery unit/crypto/protocol/DOM suites | **32 passed / 0 failed / 0 skipped** |
| New real Chromium recovery suite | **10 passed / 0 failed / 0 skipped**; real Stop, recovery/global Clear and navigation worker destruction, exact v4/v6, variant and refusal checks |
| All `tests/openpgp*.test.mjs`, required local Go reader | **117 passed / 124 total / 0 failed / 7 explicit skips**; 4 full-GnuPG, 1 PGPy and 2 slow large-RSA controls unavailable/opt-in locally |
| Existing real Chromium modern-v6 suite | **5 passed / 0 failed / 0 skipped** |
| Existing real Chromium classic suite (default RSA-3072) | **10 passed / 11 total / 0 failed / 1 explicit same-job large-public-control skip** |
| Android/package/save/backup/sound/token/coin/public-corpus guards | **97 passed / 0 failed / 0 skipped**; catalog regenerated and 96-entry freshness confirmed |
| Wider Vitest regression | **318 passed / 36 files** using `vitest run --maxWorkers=1`. An initial run alongside crypto/browser workloads hit one existing unrelated BIP39 5-second timeout (317/318 passed); the isolated rerun passed without changing any timeout or wallet production code. |

The four existing native-v6 cases are included in the 117 passed count, not four
additional independent new recovery tests. Local Go provenance/limitations
remain as recorded in the native-v6 report. Local absence of full GnuPG is not
misrepresented as native recovery success.

The fast **native-gnupg** CI job now explicitly requires all three new suites,
actual Chromium recovery (browser absence fails, not skips), and the extended
GnuPG protected re-export control. It retains mandatory PGPy/full-GnuPG and the
separate slow large-RSA lane. Generated/shipped modules are byte-matched, and
Android APK asset checks include all recovery modules. Android packaging success
is **not** an actual Android worker/device/GUI recovery test. The subsequent
[Android recovery acceptance gate](openpgp-android-recovery-2026-11-17.md) adds
separate real-WebView/module-worker cases; its exact-head results must be
reviewed independently, not folded into this earlier local capture. No synthetic
secret artifact, home, passphrase or revocation file is uploaded/cross-job cached.

Exact-head required CI must pass before merge; old-head passes do not validate
new recovery code. Later CI evidence belongs to the matching PR head/results,
not retroactively to this local capture. Existing backups/recipients and unrelated
owner/device, encrypted-APK delivery and token-deployment gates are unchanged.
