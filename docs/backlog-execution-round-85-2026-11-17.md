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

- Focused Node model/UI/launcher/adapter/snapshot checks: **39 passed**, zero
  skips. Additional recipient/streaming-backup/Drive-relay checks: **8 passed**.
  Final matching-head Android readiness belongs on PR #238, not inferred from
  these Node checks.
- Full Vitest: **318 passed / 36 files**, no failures. No timeout or production
  assertion was weakened.
- Actual Chromium OpenPGP tests passed with real RSA-3072 Web Crypto, protected
  private and revocation downloads, exact recovery, independent gpgv signatures,
  PUBLIC reload/revalidation and secret rejection. The same-job native RSA-16384
  public control is an explicit local skip; mandatory CI covers it separately.
- Audio browser/catalog tests: **4 passed**, covering the complete searchable
  catalog, actual local boots, user-started Web Audio, no automatic microphone
  request, self-HTML downloads and alternate AURA preset JSON. A first test incorrectly looked for Sanctuary's home-only download
  button after entry; the test now exits via its real control first. Cleanup
  also skips already-closed contexts rather than calling close twice. These
  failed harness attempts are not presented as passed runs.
- Android instrumentation compiles, including a test-only synthetic document
  provider. The first PR-head device run failed: a Java test compared CRLF
  before the HTML textarea normalized it, the file test used a non-user
  programmatic click, and Headline Harry/emulator diagnostics ended at timeout.
  Follow-up tests compare the actual submitted text, tap real touchscreen
  controls, and reject provider write/refetch corruption before checking retry.
  Save and import callbacks also guard an outstanding external picker against
  late results after navigation. Tests exercise real WebView callbacks and
  resolver I/O; only the Files picker choice is stubbed. Public and network
  flavors have separate execution, before independent audio and game runs.
  A background logcat collector preserves diagnostics even if a game hangs.
  The next device run compiled/build-checked all flavors but still failed the
  synthetic network-warning interaction: the raw accessibility-tree helper did
  not find/click the native dialog. It is replaced with synchronized UiAutomator
  title/resource-ID checks and an actual native button click, not a production
  consent bypass. Per-phase summaries and deduplicated report copies prevent
  duplicate failures from exhausting GitHub's annotation budget.
  This is not an interactive human picker, physical phone,
  acoustic-quality, OpenKeychain, PGPony or Kleopatra GUI certification.
- The prior PR #232/main Android runs really failed. New emulator subcommands
  have independent time bounds and preserve logs; neither APK compilation nor
  an upload is relabeled as a device-test pass. Final device results and any
  resulting fixes must be recorded on PR #238 before its merge.

## Encrypted backup boundary and next actions

The original pinned public certificate was absent from the restored checkout;
that gate was not bypassed using its fingerprint alone. The owner subsequently
attached three different PUBLIC certificates and explicitly selected the
compatible v4 certificate as the replacement for this backup. The exact
selected primary/encryption fingerprints and approval are retained only in the
ignored private delivery workspace, not the public app corpus. The other two
v6 certificates are not substituted, and Workbench's compatibility policy is
not loosened. No private key or passphrase was requested. No plaintext
private upload, public cloud sharing or recovery of already-lost in-memory
research is claimed. The current Drive connector's workspace upload completed
**four real ciphertext transfers** at checkpoint `a2438b7fe9e2adf3fdc26cd12766017362fd63d9`:

| Encrypted checkpoint backup | Ciphertext bytes |
| --- | ---: |
| Research/source preservation: 1,270 tracked source/research files, including all 188 audited app sources | 17,961,929 |
| Public portable browser release: 96 app entrypoints | 57,068,859 |
| Opt-in network portable browser release: 98 app entrypoints | 57,145,003 |
| Private portable browser copy: four allowlisted apps | 6,205,795 |

Each actual ciphertext envelope and independently recomputed local SHA-256/MD5
was checked against separately refetched Drive file metadata (including bytes,
parent and non-trashed state). The folder and all four payloads each have exactly
one user/owner permission, no public/domain/group sharing. JSON/Markdown receipts
and `SHA256SUMS` were also delivered and read back. Links, exact fingerprints and
full inventories stay in the private delivery workspace/receipts, not this public
source report. ZIP CRC and inner per-file digests were checked; fresh Chromium
boots also checked both portable public/network catalogs and the requested app
modules with zero page errors/external requests. The private browser's 98-file
manifest and four-entry catalog were independently checked.

**Owner decryption is not verified.** No owner secret was received. The archive
is encrypted, not sender-signed; it is a checkpoint of the named tracked trees,
not all live browser/phone/cloud state or every root binary/data dependency.
The three release copies above are browser packages, **not Android APK backups**.
The earlier failed Actions-secret handoff is not relabeled as a successful APK
upload. The Android recipient-dispatch gate and final device validation remain
separate. APK artifacts and curated browser bundles remain distinct; the private
Android two-app allowlist is not the private four-app browser bundle.

Immediate follow-through: matching-head Android save/import/device checks and
review, final inventories/registries, then merge the new PR as requested. Next
app candidates include the other ANC variants and older cancellation app, whose
remote CSS/icon dependencies still need localization and runtime review. Keep
the other backlog gates: finish independent per-deployment USDT/USDC evidence before
stETH/wstETH (no runtime promotion), actual target-client interop, stable owner Android
signing/recovery strategy, and author-approved private manuscript destination.

## Follow-up — explicit v6 compatibility and current Android gate

The owner subsequently authorized one exact v6 primary for **new** encrypted
copies and full/reduced PUBLIC exports, with all existing v4 copies retained.
The previous v4 approval/history is not overwritten. A packet-level check
corrected the initial high-level inspection: the selected full v6 file has nine
subkeys, of which OpenPGP.js exposes five and silently skips four unsupported
public algorithm blocks (IDs 35, 30, 36, 31). This establishes parser
incompatibility, **not** that those omitted keys are malformed or revoked.
The explicit reduced copy retains one validated X25519 encryption subkey and
its binding; the full original is preserved byte-for-byte. Exact identities,
export digests and the approval stay in the ignored delivery workspace.

Workbench now offers explicit full/subset PUBLIC exports and narrowly scoped
v6 Ed25519/X25519 public imports with full 64-hex fingerprint comparison and
usable-bound-encryption detection. Strict import does not silently omit unknown
algorithms. The subset operation preserves global revocations, refuses secret /
mixed / malformed / ambiguous packets and never edits signed fields or converts
v6 into v4. The release tool/three-profile Actions path separately offers
`modern-v6` (v6 PKESK + SEIPDv2/AEAD); the default classic-v4 recipient profile,
RSA generation/private-export gates and browser passphrase message UI remain
unchanged. Public keys cannot decrypt the existing Drive archives.

Fresh local affected Node run: **108 total / 101 passed / 7 explicit optional
skips / 0 failed**. Actual v6 Chromium: **5 passed**, including both real .asc
downloads, original retention, reduced import/encryption detection, PUBLIC reload
and synthetic v6 Web Crypto exact recovery, with zero uncaught errors or external
requests. Both changed workflow YAML files parse, and all five embedded Python
blocks compile. Native/GUI v6 client compatibility and real owner decryption
are not inferred from same-library JS tests.

The last pre-v6 Android run at `d736dc6` **failed**: public/network local-file
phases each passed four of five, audio passed, and Headline Harry failed with an
empty JUnit failure element. The PUBLIC fixture generated v4; that result is not
proof of a v6 defect. The reload helper could observe the old complete document
at the same URL. It now marks the old document and awaits a new document plus
completed restore status; the assertion is retained. A separate v6 test covers
the two native .asc saves and remembered subset. The game's dedicated captured
logcat now precedes Gradle stack noise within GitHub's per-step annotation cap;
no game assertion is skipped or relabeled. The old diagnostic download/log
redirects are unavailable through the sandbox's permitted egress hosts.
All three APK builds/permission checks had passed independently of device tests.

The earlier manual encrypted Actions dispatch was refused with integration 403;
this is unrelated to subkey parsing. Manual recipient inputs exist, while
automatic PR builds do not solicit them. New profile inputs reach the web UI
once on the default branch. Matching-head Android/native checks, encrypted APK
delivery and PR #238's ready/merge decision remain separate pending gates.

### d20fcdc device result and next bounded correction

The new head built all three profiles and passed both native/large-RSA crypto
jobs, including the required real v6 Chromium suite. Full local Vitest was
rerun: **318 passed / 36 files**. The separate token/coin guard tranche passed
**27 tests** without promoting new runtime mappings or closing financial gates.

Android `45357811641` still failed: public local files **4/6**, network local
files **0/6**, audio **1/1**, Harry **0/1**. The public v4 reload assertion now
passes; the new v6 save fixture used two filenames missing from the synthetic
provider's deliberately fixed allowlist. They are now added explicitly, not by
relaxing production file access or save/read-back checks. Actual failure details
also establish that file-input/Harry touchscreen injections were directed at a
non-target window, while the emulator recorded a Nexus launcher ANR. This does
not establish a DOSBox or OpenPGP v6 cryptographic failure.

The next harness waits for the target app's visible/focused foreground window
and checks coordinates inside its visible WebView before injecting a real
touch. The emulator uses a smaller boot-time skin, matching density and more
RAM rather than reflowing a 1440p Pixel 7 launcher after boot. Native network
warning consent, real file input gesture, read-back verification and the actual
DOSBox-ready assertion are retained. Per-phase notices now include their own
first failure so one flavor's repeated stacks cannot hide another's error.
No app assertion or crash condition is converted to a skip or success.

Two PUBLIC .asc versions and four **new v6-encrypted d20fcdc** source/browser
copies were delivered into a new owner-only Drive child folder. Each payload's
bytes, SHA-256, MD5, parent/non-trashed state and one-user-owner-only permissions
were independently re-fetched and matched. The current source checkpoint has
**1,548 tracked files**, including tests/workflows/config and all **188** audited
app entries. Only the maintained OpenPGP entrypoint changed from the original
inventory; imported research originals and all five prior v4 ciphertext hashes
are unchanged. Portable browser catalogs remain **96 / 98 / private 4**, versus
Android private **2**. None of these four ciphertexts is an APK or live-state
backup, and no real owner decryption is claimed. The newly attempted manual
v6 Actions dispatch also received integration **403**; reconnect is still
required for that separate encrypted-APK delivery path.
