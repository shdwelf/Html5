# Backlog execution round 85 — local exports, complete app discovery and research retention

Continuation on `arena/11974e95-html5`, from merged PR #232's base
`543a71313ed86513e586b443e8fae200b624aac3`. New work is
[PR #238](https://github.com/shdwelf/Html5/pull/238); PR #232 is not merged again.
This report records release operations and remains excluded from public offline
manual bundles. Original research sources are preserved, not deleted.

## Actual causes and fixes

1. **Android save failure:** the shared public/network Activity rejected every
   DownloadListener callback. A browser-only download test could not establish
   that an Android `.asc` file was saved. A write-only export adapter now stages
   an explicit Blob export in app-private cache, uses ACTION_CREATE_DOCUMENT,
   writes only the picker-selected content URI and checks size/SHA-256 by
   read-back. Only a matching current packaged HTTPS origin can call it. Chunk
   order, canonical base64, 32-KiB chunks and a 64-MiB/file cap are enforced.
   Cancellation/error does not become success; temporary cleanup is best-effort,
   with startup cleanup after process death. No arbitrary read API, broad storage
   permission, JavascriptInterface, persistent URI grant or remote-page save
   privilege was added. File import uses ACTION_OPEN_DOCUMENT and existing app
   input validation. A cloud document provider can upload a selected export;
   choose an on-device destination for local-only storage.
2. **Memory-only keyring:** default secret-state behavior is preserved, but
   PUBLIC certificate remembering is now an explicit default-off opt-in. Only
   the validated public model is serialized; reload revalidates it. User IDs
   remain unverified and may be identifying. Messages, private/revocation
   packets and passphrases are never remembered. Failed writes are visible;
   unreadable old copies are not silently overwritten. Explicit Forget/Clear
   removes the saved public copy; navigation clears secrets without deleting an
   opted-in public snapshot. Unsaved text and a failed/stale public snapshot
   still trigger the navigation warning. A device copy is not a backup.
3. **Missing sound apps:** full Sanctuary and two complete AURA snapshots were
   outside the builder's discovery root; the similarly named AURA source-entry
   shell is only 738 bytes and cannot run by itself. Deterministic restoration
   keeps the exact originals, removes Google Fonts and Cloudflare telemetry,
   adds truthful safety/uncertified-DSP labels and a restrictive sound-page CSP,
   and preserves both AURA versions on one isolated origin. The existing ANC,
   Sanctuary and AURA origins alone can request matching-origin audio after OS
   consent. Other origins, camera/mixed resources and network pages remain
   denied. Self-HTML export is not a guaranteed runtime-session backup; export
   preset JSON where available and inspect the resulting file.
4. **Second discovery omission:** the browser `/apps/` page was a short manual
   highlight list, separate from Android's complete discovery. It now loads a
   generated searchable catalog from the same reviewed public inventory. The
   three requested/related direct links remain as no-fetch fallbacks. Android
   public/network/private catalogs are **96 / 98 / 2**; browser public is 96.
5. **Reinstall data loss:** an Android version-code bump cannot change the
   same-signing-certificate rule. CI debug signing is not a promised stable
   production identity. Documentation now warns not to uninstall an old build
   to work around a signing mismatch until external exports are verified.
   Uninstall/data clearing/device loss can erase WebView storage. The three
   flavor application IDs remain distinct and do not silently migrate data.

## Full imported-source audit, without publishing private research

`npm run audit:app-sources -- --out .cache/app-source-inventory.json` accounts for
**188** tracked top-level imported HTML sources (including extensionless files)
and canonical directory entrypoints. The full paths/sizes/SHA-256/disposition
inventory is deliberately local and ignored; only aggregate counts are recorded
here. Filename/title triage is not a content/privacy or security certification.

| Disposition | Sources | Meaning |
| --- | ---: | --- |
| Reviewed snapshot/alias bundled | 5 | Sanctuary, two AURA versions and maintained ANC/CyberChef aliases |
| Maintained directory app bundled | 2 | Canonical source with existing public output |
| Explicit network-only source | 2 | Offline inventories unchanged by live-feed sources |
| Unbuilt placeholder | 29 | Missing built payload; not represented as functional |
| Personal/private review required | 22 | Preserve; exact-recipient encryption required for private backup |
| Wallet/security review required | 30 | No automatic runtime/security approval or promotion |
| Remote dependency review required | 46 | Localize/review before offline packaging |
| Other source review required | 52 | Preserve; no publication or completeness assumption |

No unreviewed source was copied wholesale into public assets. The existing
coin/network registries and research-only token gates are not modified by
catalog packaging. The completed host-fee research and prior merges are not
repeated.

## Evidence, scoped honestly

- Focused Node model/UI/launcher/adapter/snapshot checks passed locally; final
  counts belong with the matching-head validation on PR #238.
- Full Vitest: **318 passed / 36 files**, no failures. No timeout or production
  assertion was weakened.
- Actual Chromium OpenPGP tests passed with real RSA-3072 Web Crypto, protected
  private and revocation downloads, exact recovery, independent gpgv signatures,
  PUBLIC reload/revalidation and secret rejection. The same-job native RSA-16384
  public control is an explicit local skip; mandatory CI covers it separately.
- Audio browser tests cover actual local boots, user-started Web Audio, no
  automatic microphone request, self-HTML downloads and alternate AURA preset
  JSON. A first test incorrectly looked for Sanctuary's home-only download
  button after entry; the test now exits via its real control first. Cleanup
  also skips already-closed contexts rather than calling close twice. These
  failed harness attempts are not presented as passed runs.
- Android instrumentation compiles, including a test-only synthetic document
  provider. Tests exercise real WebView save/import callbacks and resolver I/O;
  only the Files picker choice is stubbed. Public and network flavors have
  separate execution. This is not an interactive human picker, physical phone,
  acoustic-quality, OpenKeychain, PGPony or Kleopatra GUI certification.
- The prior PR #232/main Android runs really failed. New emulator subcommands
  have independent time bounds and preserve logs; neither APK compilation nor
  an upload is relabeled as a device-test pass. Final device results and any
  resulting fixes must be recorded on PR #238 before its merge.

## Encrypted backup boundary and next actions

The exact owner recipient remains required. Its public certificate bytes are
absent from the restored checkout and were not recovered by the scoped backup
lookup; a fingerprint alone cannot encrypt a backup. Asked for the PUBLIC
certificate again, never the private key or passphrase. No substitute recipient,
new plaintext private artifact, public cloud sharing, successful encrypted
Drive delivery or recovery of already-lost in-memory research is claimed.
The Drive connector now accepts a workspace-file upload, but that does not by
itself supply a recipient or make a backup verified. Final delivery requires
actual ciphertext bytes, independent size/digests/metadata and private sharing
checks. APK artifacts and curated browser bundles remain distinct; the private
Android two-app allowlist is not the private four-app browser bundle.

Immediate follow-through: matching-head Android save/import/device checks and
review, final inventories/registries, then merge the new PR as requested. Next
app candidates include the other ANC variants and older cancellation app, whose
remote CSS/icon dependencies still need localization and runtime review. Keep
the other backlog gates: independent per-deployment token evidence (next stETH /
wstETH, no runtime promotion), actual target-client interop, stable owner Android
signing/recovery strategy, and author-approved private manuscript destination.
