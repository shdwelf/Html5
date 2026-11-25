# HTML5 Offline Library v1 — Android WebView implementation

**Date:** 2026-11-05

**State:** source implementation complete; the debug APK built successfully in
PR #184's GitHub Actions run. This workspace does not have Java, Gradle, or the
Android SDK installed.

## Deliverable

A separate Android app lives at
[`apps/html5-offline-launcher/`](../apps/html5-offline-launcher/). It is a
catalog/WebView wrapper for every immediate `public/apps/<directory>/index.html`
entrypoint. The current inventory is **89 apps**, **8,030 files**, and
**147,970,584 uncompressed bytes**. A local zlib estimate is about 47.4 MB for
the app payload before APK metadata/alignment; the actual APK size and SHA-256
are reported by the CI run. Files are staged only beneath the ignored Gradle
`app/build/` directory, avoiding a second committed copy of the 148 MB corpus.
The one data-only sibling without `index.html` is not in the catalog or APK.

The existing `apps/riseup-invizible-gateway/` project remains untouched; the
launcher does not include VPN orchestration, tunnel code, or VPN permissions.

## Offline and origin model

- The manifest has **no `INTERNET` permission** and disallows cleartext traffic.
  The WebViewClient serves files from `AssetManager` and returns a local error
  for non-packaged hosts; external navigation, popups, permission requests,
  geolocation, and downloads are not delegated.
- `catalog.invalid` serves only the catalog. Every app receives a unique
  synthetic HTTPS host ending in the RFC-reserved `.invalid` suffix. Host IDs
  are generated deterministically, with a short hash to resolve case-folding
  collisions (`Georgia-subsurface` and `georgia-subsurface`). Per-app origins
  keep WebView same-origin storage separate; the static app directories remain
  isolated beneath their own asset roots.
- Paths reject dot-segments, backslashes, and NULs before opening an APK asset.
  Common HTML/JS/CSS/JSON, image, font, audio, video, WASM, and document MIME
  types are mapped explicitly. The Renga app's `/apps/` link returns to the
  catalog.
- JavaScript and DOM storage are enabled because they are required by many
  bundled apps. Camera/microphone and browser permission requests are denied.

## Dependency/offline caveat

The initial scan is intentionally described as **static and non-exhaustive**.
A check of the 89 entrypoint documents found one direct remote resource tag:
`anc-studio` loads `@tailwindcss/browser` from jsDelivr. That request is denied by
the offline client, and the catalog marks the entry as having a remote asset.
External links and API-backed features in other apps are also blocked even when
they are not captured by this scan. Download behavior and device APIs may be
reduced. The launcher packages each app's local files; it does not claim that
all remote-backed features have been replaced with local implementations.

## Build and verification

Gradle 8.7 / AGP 8.5.2, JDK 17, compile/target SDK 34, **minSdk 24**, and Node 22
are used. `prepareHtmlAppsAssets` runs
`scripts/build-html5-offline-launcher-assets.mjs` as part of `preBuild`. The
workflow `.github/workflows/html5-offline-launcher-build.yml` builds
`:app:assembleDebug` for pull requests and uploads
`app/build/outputs/apk/debug/app-debug.apk` as the
`html5-offline-launcher-debug-apk` artifact for 30 days. It does not commit the
binary to Git; this is a debug-signed sideload/review build, not a store release.

Validation in the source workspace:

- `node --check scripts/build-html5-offline-launcher-assets.mjs` passed.
- `node scripts/build-html5-offline-launcher-assets.mjs --check` passed for all
  89 entrypoints. The scan marked only `anc-studio`'s entrypoint-level remote
  resource tag.
- A full staging run copied 8,030 files / 147,970,584 bytes into the ignored
  build directory. Generated app hosts are unique, including the two
  case-colliding Georgia directory names.
- Node unit tests validate inventory parity, host uniqueness, minSdk/network
  permission policy, catalog routing, and the explicit CDN warning.
- PR #184 GitHub Actions run [42088364485](https://github.com/shdwelf/Html5/actions/runs/42088364485)
  passed the Android Gradle build, inventory checks, and artifact upload. The
  `html5-offline-launcher-debug-apk` artifact archive is 53,448,446 bytes
  (archive SHA-256 `5d082779f7d2d2f7fbc18dae1eb148af52e5ab2eb42938ba96fa3ecc2861a2c1`)
  and expires 2026-12-05. The build log reports the APK's own size and SHA-256;
  no emulator/device installation test has been performed.
