# HTML5 Library (Android)

A separate Android WebView/catalog wrapper for every current
`public/apps/<directory>/index.html` entrypoint, with an additional, separately
opt-in network flavor for live aircraft and RSS apps. This does **not** repurpose
the Riseup × InviZible VPN scaffold and contains no VPN service or tunnel engine.

## Scope and packaging

- The current builder discovers **94** HTML entrypoints and packages **8,475
  files** (161,806,930 bytes uncompressed) inside those app directories. It
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
track startup, not acoustic capture quality. CI uploads only the public APK as
the `html5-offline-launcher-public-debug-apk` artifact. It builds and validates
the private APK and the network APK, including their distinct permission and
catalog inventories, but does not publish either APK as plaintext. For a
private backup, manually dispatch the workflow with a recipient's armored
OpenPGP **public** key. CI encrypts the private APK and uploads only the
ciphertext as a seven-day artifact. Download the `.apk.asc` artifact, verify
its entry in `SHA256SUMS.txt`, and decrypt locally with PGPony or another
OpenPGP client (for example, `gpg --output app-private-debug.apk --decrypt
app-private-debug-<subkey-fingerprint>.apk.asc`). The private key never leaves
its owner.
The sandbox itself has no local Java/Gradle/Android SDK, so Android APK
verification and live-feed smoke testing remain CI/device follow-ups.
