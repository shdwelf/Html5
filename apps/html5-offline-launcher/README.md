# HTML5 Offline Library (Android)

A separate Android WebView/catalog wrapper for every current
`public/apps/<directory>/index.html` entrypoint. This does **not** repurpose the
Riseup × InviZible VPN scaffold and contains no VPN service or tunnel engine.

## Scope and packaging

- At this revision the builder discovers **90** HTML entrypoints and packages
  **8,068 files** (149,895,087 bytes uncompressed) inside those app directories.
  It excludes the data-only directory without an `index.html`. The packaged
  corpus includes the standalone Planet Viewer and its local terrain, globe,
  and Natural Earth data dependencies. Gradle stages the files under this
  module's ignored `app/build/` directory.
- The catalog is generated from each app's `manifest.toml` name/description,
  then the page title and directory name as fallbacks. It includes a search box
  and marks the entrypoint with a static remote-resource reference.
- The catalog and every app use distinct synthetic HTTPS origins under the
  reserved `.invalid` suffix (`catalog.invalid` and one unique app host per
  entrypoint). This gives each app a separate browser origin/storage namespace;
  local paths are served from packaged APK assets by `OfflineAssetWebViewClient`.
- The manifest deliberately has **no `INTERNET` permission**. Unknown hosts,
  cleartext URLs, external links, popups, geolocation and web permission prompts
  are denied. The native app toolbar always provides Back and Catalog controls.
- This is an offline **launcher**, not a promise that every app feature works
  without a server. The ANC app's Tailwind utilities are now compiled and
  packaged locally, with system-font fallbacks and no direct CDN/font request.
  The Android WebView still denies microphone permission; ANC live capture and
  calibration are explicitly disabled there. Network-backed APIs, external
  links, downloads, camera/microphone access, and other browser-only features
  may also be unavailable. The static scan is a warning aid, not a complete
  runtime-dependency audit.

## Build the debug APK

Requirements: JDK 17, Gradle 8.7, Android SDK platform/build-tools 34, and Node
22 (the Gradle asset-staging task runs the repository's Node builder).

From the repository root:

```sh
node scripts/build-html5-offline-launcher-assets.mjs --check
cd apps/html5-offline-launcher
gradle --no-daemon :app:assembleDebug
```

The APK is written to:

```text
app/build/outputs/apk/debug/app-debug.apk
```

The sandbox has no local Java/Gradle/Android SDK, so the CI workflow builds the
APK on an Ubuntu runner and uploads it as the
`html5-offline-launcher-debug-apk` artifact. The APK is debug-signed for
sideloading/review; it is not a Play Store release build.
