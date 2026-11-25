# HTML5 Library (Android)

A separate Android WebView/catalog wrapper for every current
`public/apps/<directory>/index.html` entrypoint, with an additional, separately
opt-in network flavor for live aircraft and RSS apps. This does **not** repurpose
the Riseup × InviZible VPN scaffold and contains no VPN service or tunnel engine.

## Scope and packaging

- The current builder discovers **96** HTML entrypoints and packages **8,510
  files** (166,321,092 bytes uncompressed) inside those app directories. It
  excludes data-only directories without an `index.html`. Gradle stages the
  files under this module's ignored `app/build/` directory.
- The catalog is generated from each app's `manifest.toml` name/description,
  then the page title and directory name as fallbacks. It includes search and
  marks entrypoints with a static remote-resource reference.
- The catalog and every app use distinct synthetic HTTPS origins under the
  reserved `.invalid` suffix (`catalog.invalid` and one unique app host per
  entrypoint). Local paths are served from packaged APK assets by
  `OfflineAssetWebViewClient`.
- The public and private manifests deliberately have **no `INTERNET`
  permission**. Their unknown hosts, cleartext URLs, external links, popups,
  arbitrary URL downloads, camera access, and geolocation remain blocked. Only the separate
  `network` flavor adds `INTERNET`; it allows HTTPS requests to syntactically
  valid DNS hostnames on the usual HTTPS port and blocks literal IPs, reserved
  local suffixes, user-info URLs, and cleartext. This hostname check does not
  resolve or verify public IP addresses, publisher identity, or feed safety.
  The native app toolbar always provides Back and Catalog controls.
- ANC Studio microphone capture is opt-in, as are **Sound Sanctuary** and
  **AURA Sound Studio** microphone modes. Only these three packaged origins may
  request audio, with an exact match to the current top-level app, and only
  after Android's `RECORD_AUDIO` runtime permission. Camera, mixed resources,
  other apps and arbitrary network origins are denied. `MODIFY_AUDIO_SETTINGS`
  supports WebView audio routing. No microphone access is granted merely
  because the network flavor has `INTERNET`. These experimental audio labs are
  not certified branded DSP, reliable acoustic ANC or hearing protection.
  Start at low volume; use headphones and stop if feedback occurs. If denied,
  enable Microphone under Android Settings → Apps → HTML5 Offline Library →
  Permissions. AURA's alternate complete saved-settings snapshot is available
  from the main app's banner on the same origin. No original source was deleted.
- Local Blob exports now use Android's **system Files picker** instead of the
  formerly blanket-rejecting DownloadListener. The native write-only adapter
  accepts only matching packaged HTTPS origins, ordered 32-KiB chunks and a
  maximum 64 MiB/file. It stages only an explicitly requested export in the
  app-private cache, then writes the user-selected `content:` URI and verifies
  the bytes by SHA-256 read-back before confirming success. Cancel/failure is
  not success; partial destination files may need manual removal. Temporary
  files are removed on success/cancel/navigation/destruction and stale files
  on next startup; secure physical erasure/OS process-kill cleanup is not
  guaranteed. No broad storage permission, arbitrary file-read bridge,
  persistent URI grant, DownloadManager or JavascriptInterface is added.
  Choose an **on-device** Files destination for local-only storage: selecting a
  cloud document provider may upload your export. Arbitrary HTTPS/data URL
  downloads remain unsupported; open them in a full browser instead.
- Public certificate and audio-file imports use **ACTION_OPEN_DOCUMENT**;
  nothing is read automatically and apps still validate their input formats.
  Workbench's optional remembered PUBLIC keyring is separate from file saves:
  it revalidates on restore, includes public User IDs, and never remembers
  secret keys, revocations, text or passphrases. It is not a backup, can be lost
  on uninstall/data clearing, and remains separate for each app/site origin.
- The `network` flavor stages the same public catalog plus two extra entrypoints:
  RadarScope (`apps/ads-b-radar-scope`) and News Globe (`apps/news-globe.html`).
  It displays a required startup warning that News Globe's OPML/RSS host set is
  dynamic and not fixed. News Globe accepts only HTTPS feed URLs with valid
  hostname syntax before sending them to its RSS service; this is not a trust,
  DNS-reputation, or public-IP check. RadarScope and News Globe retain their
  existing third-party API/CDN dependencies; News Globe uses direct OPML and
  geocoding requests plus rss2json and does not use public CORS-proxy fallbacks.
  RadarScope keeps its direct-first third-party proxy fallbacks and defaults to
  its combined ADSB.fi/Airplanes.live sources. OpenSky is omitted because its
  documented API requires OAuth credentials, which this app does not provide.
  The remaining live services have not been verified by this build; provider
  availability, CORS, proxy visibility, and terms may change. No API
  credentials are packaged.

## Restored apps and omission audit

`npm run build:sound-apps` deterministically restores the full Sanctuary and
both AURA snapshots. `npm run check:sound-apps` checks pinned source/output
hashes. Remote Google Fonts and Cloudflare analytics are removed, inline
runtime code is preserved, and the unbuilt 738-byte AURA shell is not shipped
in place of a working app. Self-HTML export is not a guaranteed runtime-session
backup; export preset JSON where available and verify the saved file.

`npm run audit:app-sources` accounts for **188** tracked imported HTML sources,
including extensionless imports and canonical directory entrypoints. It reports
all unbuilt, dependency/security/privacy-review and other pending sources instead
of silently treating the mixed `apps/` archive as public-ready. Run with
`-- --out .cache/app-source-inventory.json` for the complete local inventory
(paths, sizes, SHA-256, disposition and reason). The complete mixed/private
inventory is ignored and is never put in a public APK/manual. Unreviewed sources
are preserved, not deleted or falsely marked functional. Private research backup
requires the exact supplied recipient certificate; a fingerprint alone cannot
encrypt anything. No public sharing or unverified Drive delivery is implied.

## Build and test the APK profiles

Requirements: a JDK 17 distribution (Temurin, Zulu, or another OpenJDK 17 build),
Android SDK platform/build-tools 34, and Node 22. A JRE alone is insufficient
because Gradle and Android build tasks need the JDK compiler. The checked-in
Gradle wrapper pins Gradle 8.7 and verifies the distribution SHA-256, so a
separate system Gradle installation is not required.

Install a JDK 17 and Android SDK with **platform 34** and **build-tools 34.0.0**;
then set `JAVA_HOME` and `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) to those
installations. On Linux/macOS, accept Android SDK licenses and install packages
with `sdkmanager "platforms;android-34" "build-tools;34.0.0"`. From the
repository root:

```sh
node scripts/build-html5-offline-launcher-assets.mjs --check --profile public
node scripts/build-html5-offline-launcher-assets.mjs --check --profile private
node scripts/build-html5-offline-launcher-assets.mjs --check --profile network
cd apps/html5-offline-launcher
./gradlew --no-daemon :app:assemblePublicDebug :app:assemblePrivateDebug :app:assembleNetworkDebug
# With an API 34 Android emulator running:
./gradlew --no-daemon :app:connectedPublicDebugAndroidTest
```

On Windows, use `gradlew.bat` instead of `./gradlew`. The first wrapper run
fetches the pinned Gradle 8.7 distribution and validates its SHA-256 before use.

The **public** profile packages all 96 approved local HTML entrypoints. The
**private Android** profile is a separate, reduced build with a fixed two-app
allowlist (Helios Observatory and Prime Viewer), a distinct application ID, and
no audio permissions. This Android allowlist is separate from the four-app
private browser bundle. Both profiles omit network permission.

The **network Android** profile keeps the same 96 public apps and adds
RadarScope and News Globe (98 catalog entries total), with a distinct
application ID and the only `INTERNET` permission. Build/install this APK only
when the user wants live network access; its network warning must be accepted
at startup. Public and private flavor behavior remains offline. All APKs are
debug-signed for sideloading/review; none is a Play Store release build.

**Do not uninstall an existing copy to work around a signing mismatch before
exporting and verifying your research.** Uninstall erases its WebView storage.
CI debug signing keys are not a promised stable update identity; production
in-place updates require an owner-controlled stable Android signing key.
Version 1.1.0 increments the version code but does not bypass Android's
same-signing-certificate requirement or migrate data across the three distinct
application IDs. Device remembering is not a substitute for an exported backup.

APK outputs:

```text
Public:  app/build/outputs/apk/public/debug/app-public-debug.apk
Private: app/build/outputs/apk/private/debug/app-private-debug.apk
Network: app/build/outputs/apk/network/debug/app-network-debug.apk
```

The Android instrumentation suite exercises matching-origin microphone policy,
requests a real `getUserMedia` audio track, saves/imports synthetic files through
real WebView callbacks and a test document provider, runs protected-key
recovery through actual local module workers, and boots the packaged Headline
Harry DOS program in Android WebView. CI runs these tests on an API 34
emulator with a silent, local PulseAudio source; this verifies permission and
track startup, not acoustic capture quality. Device testing has a separate
20-minute step bound; build artifacts are exported **before** it starts. An APK
build/inventory check is not a WebView or live-provider test result.

On failure, bounded synthetic diagnostics include suite-level `system-err` /
`system-out`, native process/runner failures and the last real-touchscreen
activation phases. An empty JUnit `<failure/>` or a partial testcase count is
not a passing phase and does not establish an emulator-only root cause. These
diagnostics do not change the tests, permission/save policies or time limits.
CI additionally requires complete results: six public file/save cases, six
network file/save cases, three protected-key recovery cases, one audio-policy
case and one game-boot case. All **17** must pass with zero skips and all five
phase exits zero; missing/partial runner output cannot yield a green device gate. The CI guest is limited to 2 GiB and
connected-test Gradle invocations to a 1-GiB heap / one worker; normal APK build
settings are unchanged. On failure the runner captures bounded host memory,
cgroup counters, process **names** (not arguments), device state and matching
kernel OOM/crash lines **before** emulator teardown. A disappearing emulator is
not itself proof of a host OOM or an app assertion failure. No test is retried,
removed, accepted as skipped or given a longer deadline by these controls.

The CI emulator explicitly uses **`-gpu swangle`**, ANGLE with software drivers.
[Android's graphics documentation](https://developer.android.com/studio/run/emulator-acceleration#command-gpu)
lists `swiftshader_indirect` and `swangle_indirect` as deprecated since 36.4.9;
`swangle` is the supported spelling used here. In PR239 the old renderer lost
the entire emulator during DOSBox startup after real touchscreen injection
returned, while the other 13 cases passed. Resource reduction alone did not fix
it; the captured host snapshot had ample available memory and no matching OOM
kernel evidence. A related external renderer-crash report [1](https://github.com/expo/eas-cli/issues/4928)
is a discovery clue, not proof of our exact native crash or universal hardware
compatibility. The renderer change passed the original 14-case, zero-skip gate
in PR239. The expanded 17-case gate retains every one of those cases; no packaged
game/WebView/app behavior or graphics-success assertion is changed.

The three additional recovery cases exercise protected v4 legacy-25519 and
v6 Ed25519/X25519 exact two-candidate checks, full-fingerprint refusal, explicit
reveal, public/unprotected/Argon2 refusal before attempts, bounded no-match,
and real Stop/recovery Clear/global Clear during expensive S2K work. Preview,
acknowledgement, Start, reveal, Stop and Clear use the foreground/focus-gated
real-touchscreen helper; synthetic input fields are populated by the harness.
A test-APK-only script generates fresh synthetic keys in memory and delegates to native
module workers, recording only URL/type/operation/count/termination metadata.
The identical fixture also runs in mandatory Chromium as an independent test
of the harness; Chromium is not Android proof. No owner inputs, private fixture,
secret diagnostics, persistence, download or production test hook is added.
This API-34 public-APK test is not physical-device, network-flavor recovery,
OpenKeychain, PGPony, Kleopatra or guaranteed-memory-erasure acceptance. See
[the recovery acceptance record](../../docs/openpgp-android-recovery-2026-11-17.md).

Normal CI uploads the public and opt-in network APKs as separate 30-day
artifacts: `html5-offline-launcher-public-debug-apk` and
`html5-offline-launcher-network-debug-apk`. Each includes its APK and SHA-256
sidecar; check the individual archive size before sending it through a service
with a per-file transfer cap. This avoids combining both profiles in one 120 MB
handoff archive. The network package retains all 96 approved public apps plus
RadarScope and News Globe. The private APK is never published as plaintext.
A recipient dispatch disables **all plaintext APK uploads** and encrypts each of
the three profiles separately. To back up **all three profiles**, manually
dispatch `.github/workflows/html5-offline-launcher-build.yml` with both:

- `recipient_public_key`: exactly one armored OpenPGP **public** certificate;
- `recipient_fingerprint`: its independently checked, full 40-hex v4 or 64-hex v6
  primary fingerprint, not a short ID or the encryption subkey fingerprint;
- `recipient_profile`: `classic-v4` (default) or explicit `modern-v6` matching
  that certificate. The v6 path accepts Ed25519/X25519 and requires a modern
  decryption client. If the full original has unsupported public subkeys, first
  create the checked reduced PUBLIC export in Workbench; keep the original.

This dispatch uploads **only encrypted APKs** and UID-free checksums/receipts in
`html5-offline-launcher-encrypted-debug-apks` (seven days). The locked Node 22 /
OpenPGP.js 6.3.3 release script works without a native `gpg` install. It validates
the public certificate and usable encryption key, refuses ambiguous/secret or
expired/revoked recipients, uses correct repository-root APK paths and checks the
actual one-recipient integrity-protected envelope. RSA v4 and legacy v4
Ed25519/Curve25519 use v3 PKESK + SEIPDv1/MDC. Explicit v6 Ed25519/X25519 uses
v6 PKESK + SEIPDv2/AEAD with the full encryption-subkey fingerprint checked.
There is no v6-to-v4 downgrade and no implicit subkey removal. No private key/passphrase is needed
for encryption, and no key is embedded in an APK or committed to the repository.

Download the `.gpg`, `.gpg.sha256` and `.gpg.json` files. Check the ciphertext,
then decrypt **locally with a client supporting the chosen certificate and
packet versions**, substituting the selected profile (older GnuPG may not read
v6/AEAD):

```sh
sha256sum --check app-network-debug.apk.gpg.sha256
gpg --output app-network-debug.apk --decrypt app-network-debug.apk.gpg
```

These are unsigned recipient-encrypted debug builds, not publisher-signed store
releases. A checksum is not a signature. Only the recipient can perform the
final owner-key decryption test; keep that private key and passphrase out of CI.
Drive backup copies must retain private sharing settings even for the profile
called “public”; this label describes its app inventory, not cloud sharing.

Automatic pull-request/main builds do not ask for a key. In GitHub Actions,
choose **Run workflow** for a manual recipient dispatch; new input definitions
appear in the web UI only once they are on the default branch. Every run still
builds public, network and private regardless of recipient inputs. A 403
“Resource not accessible by integration” is a GitHub connection/permission issue,
not a subkey parsing error: reconnect the GitHub integration in Arena rather
than supplying a private key, access token or passphrase in chat. Build success,
device-test success, artifact upload and owner decryption are separate results.

### Coin/network coverage in this build

The network APK includes the same rebuilt Keyspace registry as the offline
catalog: 500 asset records, 347 derivation-supported / 153 explicitly unsupported,
with the existing 58 researched host-fee profiles and three reviewed USDT
network identities. These are local derivation/research capabilities, not a
promise of transfers, live balances, audited token backing, or all-chain support.
The USDC Ethereum evidence tranche remains research-only; it is not promoted to
a runtime token mapping by packaging. The network permission does not bypass
separate read-only lookup consent or turn unknown fees/taxes into zeroes.

The sandbox has no local JDK/Android SDK or full GnuPG. APK builds and native
GnuPG interop are independent mandatory CI lanes; GUI/mobile-client and live-feed
compatibility remain separate acceptance gates.

### Optional direct encrypted Drive handoff

When artifact downloads are unavailable, an operator may obtain three one-time,
file-specific Drive resumable-upload URLs in an owner-only destination. Store
only those scoped URLs, target ciphertext names and exact source revision in the
temporary Actions secret `HTML5_RELEASE_UPLOAD_SESSIONS`, and dispatch with
`upload_to_drive: true` plus the recipient certificate/fingerprint. The secret's
JSON schema is `{ "schema": 1, "sourceRevision": "<40-hex>", "profiles": {
"public": { "fileName": "<encrypted.apk.gpg>", "sessionUri": "<scoped HTTPS URL>" },
"network": { ... }, "private": { ... } } }` (replace every placeholder).

`scripts/upload-encrypted-drive-backups.py` preflights all three ciphertext
receipts, release revision, recipient, digests and HTTPS Google session origins
before sending any bytes. It uploads bounded chunks, checks session state/byte
offsets, refuses redirects and logs no session URL. A final file ID and
independent Drive metadata/checksum verification are both required. No Drive
account OAuth token or private-key credential is put in GitHub. Delete the
temporary Actions secret after the handoff, including on failure; inspect Drive
before retrying an uncertain upload. A profile called public is not permission
to add public cloud sharing. Unit tests mock transport and never use real URLs.
