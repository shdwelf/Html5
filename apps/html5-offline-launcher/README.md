# HTML5 Library (Android)

A separate Android WebView/catalog wrapper for every current
`public/apps/<directory>/index.html` entrypoint, with an additional, separately
opt-in network flavor for live aircraft and RSS apps. This does **not** repurpose
the Riseup × InviZible VPN scaffold and contains no VPN service or tunnel engine.

## Scope and packaging

- The current builder discovers **94** HTML entrypoints and packages **8,496
  files** (163,748,950 bytes uncompressed) inside those app directories. It
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
  downloads, camera access, and geolocation remain blocked. Only the separate
  `network` flavor adds `INTERNET`; it allows HTTPS requests to syntactically
  valid DNS hostnames on the usual HTTPS port and blocks literal IPs, reserved
  local suffixes, user-info URLs, and cleartext. This hostname check does not
  resolve or verify public IP addresses, publisher identity, or feed safety.
  The native app toolbar always provides Back and Catalog controls.
- ANC Studio microphone capture is opt-in. Only its dedicated app origin may
  request audio, and only after the user starts ANC or Smart Calibrate. The
  WebView permission is granted only after Android's `RECORD_AUDIO` runtime
  permission is granted. The APK also declares Android's normal
  `MODIFY_AUDIO_SETTINGS` permission, which WebView audio capture needs for
  audio routing; all other apps and non-audio WebView resources are denied.
  Captured audio stays on-device and is not saved or transmitted. If
  permission is denied, enable Microphone under Android Settings → Apps → HTML5
  Offline Library → Permissions, then retry. Other browser-only features may
  remain unavailable, and the static external-resource scan is a warning aid,
  not a complete runtime-dependency audit.
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

The **public** profile packages all 94 approved local HTML entrypoints. The
**private Android** profile is a separate, reduced build with a fixed two-app
allowlist (Helios Observatory and Prime Viewer), a distinct application ID, and
no audio permissions. This Android allowlist is separate from the four-app
private browser bundle. Both profiles omit network permission.

The **network Android** profile keeps the same 94 public apps and adds
RadarScope and News Globe (96 catalog entries total), with a distinct
application ID and the only `INTERNET` permission. Build/install this APK only
when the user wants live network access; its network warning must be accepted
at startup. Public and private flavor behavior remains offline. All APKs are
debug-signed for sideloading/review; none is a Play Store release build.

APK outputs:

```text
Public:  app/build/outputs/apk/public/debug/app-public-debug.apk
Private: app/build/outputs/apk/private/debug/app-private-debug.apk
Network: app/build/outputs/apk/network/debug/app-network-debug.apk
```

The Android instrumentation suite exercises the ANC-only WebView permission
policy, requests a real `getUserMedia` audio track, and boots the packaged
Headline Harry DOS program in Android WebView. CI runs these tests on an API 34
emulator with a silent, local PulseAudio source; this verifies permission and
track startup, not acoustic capture quality. Device testing has a separate
15-minute step bound; build artifacts are exported **before** it starts. An APK
build/inventory check is not a WebView or live-provider test result.

Normal CI uploads only the public APK as
`html5-offline-launcher-public-debug-apk` (30 days). Neither the private nor the
network APK is published as plaintext. To back up **all three profiles**, manually
dispatch `.github/workflows/html5-offline-launcher-build.yml` with both:

- `recipient_public_key`: exactly one armored OpenPGP **public** certificate;
- `recipient_fingerprint`: its independently checked, full 40-hex primary
  fingerprint, not a short ID or the encryption subkey fingerprint.

This dispatch uploads **only encrypted APKs** and UID-free checksums/receipts in
`html5-offline-launcher-encrypted-debug-apks` (seven days). The locked Node 22 /
OpenPGP.js 6.3.3 release script works without a native `gpg` install. It validates
the public certificate and usable encryption key, refuses ambiguous/secret or
expired/revoked recipients, uses correct repository-root APK paths and checks the
actual one-recipient classic integrity-protected envelope. RSA v4 and legacy v4
Ed25519/Curve25519 recipients are supported. No private key/passphrase is needed
for encryption, and no key is embedded in an APK or committed to the repository.

Download the `.gpg`, `.gpg.sha256` and `.gpg.json` files. Check the ciphertext,
then decrypt **locally**, substituting the selected profile:

```sh
sha256sum --check app-network-debug.apk.gpg.sha256
gpg --output app-network-debug.apk --decrypt app-network-debug.apk.gpg
```

These are unsigned recipient-encrypted debug builds, not publisher-signed store
releases. A checksum is not a signature. Only the recipient can perform the
final owner-key decryption test; keep that private key and passphrase out of CI.
Drive backup copies must retain private sharing settings even for the profile
called “public”; this label describes its app inventory, not cloud sharing.

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
