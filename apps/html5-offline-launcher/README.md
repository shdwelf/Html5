# HTML5 Offline Library (Android)

A separate Android WebView/catalog wrapper for every current
`public/apps/<directory>/index.html` entrypoint. This does **not** repurpose the
Riseup × InviZible VPN scaffold and contains no VPN service or tunnel engine.

## Scope and packaging

- The current builder discovers **93** HTML entrypoints and packages **8,441
  files** (160,420,682 bytes uncompressed) inside those app directories. It
  excludes data-only directories without an `index.html`. Gradle stages the
  files under this module's ignored `app/build/` directory.
- The catalog is generated from each app's `manifest.toml` name/description,
  then the page title and directory name as fallbacks. It includes search and
  marks entrypoints with a static remote-resource reference.
- The catalog and every app use distinct synthetic HTTPS origins under the
  reserved `.invalid` suffix (`catalog.invalid` and one unique app host per
  entrypoint). Local paths are served from packaged APK assets by
  `OfflineAssetWebViewClient`.
- The manifest deliberately has **no `INTERNET` permission**. Unknown hosts,
  cleartext URLs, external links, popups, downloads, camera access, and
  geolocation are blocked. The native app toolbar always provides Back and
  Catalog controls.
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

## Build and test the debug APK

Requirements: JDK 17, Gradle 8.7, Android SDK platform/build-tools 34, and Node
22 (the Gradle asset-staging task runs the repository's Node builder).

From the repository root:

```sh
node scripts/build-html5-offline-launcher-assets.mjs --check
cd apps/html5-offline-launcher
gradle --no-daemon :app:assembleDebug
# With an API 34 Android emulator running:
gradle --no-daemon :app:connectedDebugAndroidTest
```

The APK is written to:

```text
app/build/outputs/apk/debug/app-debug.apk
```

The Android instrumentation suite exercises the ANC-only WebView permission
policy, requests a real `getUserMedia` audio track, and boots the packaged
Headline Harry DOS program in Android WebView. CI runs these tests on an API 34
emulator with a silent, local PulseAudio source; this verifies permission and
track startup, not acoustic capture quality. CI uploads the debug APK as the
`html5-offline-launcher-debug-apk` artifact. The sandbox itself has no local
Java/Gradle/Android SDK, so a physical-device microphone check remains a useful
follow-up. The APK is debug-signed for sideloading/review; it is not a Play
Store release build.
