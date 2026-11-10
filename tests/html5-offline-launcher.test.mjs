import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { buildCatalog, discoverApps } from "../scripts/build-html5-offline-launcher-assets.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PROJECT = join(ROOT, "apps", "html5-offline-launcher");
const MANIFEST = readFileSync(join(PROJECT, "app/src/main/AndroidManifest.xml"), "utf8");
const PRIVATE_MANIFEST = readFileSync(join(PROJECT, "app/src/private/AndroidManifest.xml"), "utf8");
const GRADLE = readFileSync(join(PROJECT, "app/build.gradle"), "utf8");
const CLIENT = readFileSync(
  join(PROJECT, "app/src/main/java/org/arena/html5launcher/OfflineAssetWebViewClient.java"),
  "utf8",
);
const MAIN_ACTIVITY = readFileSync(
  join(PROJECT, "app/src/main/java/org/arena/html5launcher/MainActivity.java"),
  "utf8",
);
const LAUNCHER_BUILDER = readFileSync(join(ROOT, "scripts", "build-html5-offline-launcher-assets.mjs"), "utf8");
const CATALOG_HTML = readFileSync(join(PROJECT, "app/src/main/assets/launcher/index.html"), "utf8");
const CATALOG_JS = readFileSync(join(PROJECT, "app/src/main/assets/launcher/catalog.js"), "utf8");
const README = readFileSync(join(PROJECT, "README.md"), "utf8");
const ANDROID_SMOKE_TEST = readFileSync(
  join(PROJECT, "app/src/androidTest/java/org/arena/html5launcher/OfflineWebViewSmokeTest.java"),
  "utf8",
);
const ANDROID_WORKFLOW = readFileSync(join(ROOT, ".github", "workflows", "html5-offline-launcher-build.yml"), "utf8");

const expectedSlugs = readdirSync(join(ROOT, "public", "apps"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, "public", "apps", entry.name, "index.html")))
  .map((entry) => entry.name)
  .sort();


test("catalog includes every current HTML entrypoint and no data-only sibling", () => {
  const discovered = discoverApps().map((app) => app.slug).sort();
  const catalog = buildCatalog();
  assert.equal(expectedSlugs.length, 93);
  assert.deepEqual(discovered, expectedSlugs);
  assert.deepEqual(catalog.map((app) => app.slug).sort(), expectedSlugs);
  assert.equal(catalog.length, 93);
  assert.ok(expectedSlugs.includes("newyork-subsurface"));
  assert.ok(expectedSlugs.includes("helios-observatory"));
  assert.ok(expectedSlugs.includes("prime-viewer"));
  assert.equal(catalog.some((app) => app.slug === "greeran-family-bible"), false);
});

test("private Android profile contains only its fixed two-app allowlist", () => {
  const catalog = buildCatalog("private");
  assert.deepEqual(catalog.map((app) => app.slug).sort(), ["helios-observatory", "prime-viewer"]);
  assert.equal(new Set(catalog.map((app) => app.host)).size, 2);
  assert.match(GRADLE, /create\('public'\)/);
  assert.match(GRADLE, /create\('private'\)/);
  assert.match(GRADLE, /applicationIdSuffix '\.private'/);
  assert.match(PRIVATE_MANIFEST, /HTML5 Offline Library \(Private\)/);
  assert.match(PRIVATE_MANIFEST, /tools:replace="android:label"/);
  assert.match(PRIVATE_MANIFEST, /android\.permission\.RECORD_AUDIO[\s\S]*?tools:node="remove"/);
  assert.match(PRIVATE_MANIFEST, /android\.permission\.MODIFY_AUDIO_SETTINGS[\s\S]*?tools:node="remove"/);
});

test("every entrypoint has a unique synthetic origin, including case-only slug collisions", () => {
  const catalog = buildCatalog();
  const hosts = catalog.map((app) => app.host);
  assert.equal(new Set(hosts).size, catalog.length);
  assert.ok(hosts.every((host) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.invalid$/.test(host)));
  assert.equal(hosts.includes("catalog.invalid"), false);
  const georgia = catalog.filter((app) => app.slug.toLowerCase() === "georgia-subsurface");
  assert.equal(georgia.length, 2);
  assert.notEqual(georgia[0].host, georgia[1].host);
  assert.equal(
    catalog.find((app) => app.slug === "headline-harry")?.host,
    "app-headline-harry.invalid",
  );
});

test("the bundled entrypoints have no direct remote resource tags; the launcher still flags blocked navigation", () => {
  const catalog = buildCatalog();
  const flagged = catalog.filter((app) => app.hasRemoteResources).map((app) => app.slug);
  assert.deepEqual(flagged, []);
  assert.match(CATALOG_HTML, /External links and network requests are blocked/);
  assert.match(CATALOG_JS, /Remote asset blocked/);
  const anc = readFileSync(join(ROOT, "public", "apps", "anc-studio", "index.html"), "utf8");
  assert.match(anc, /href="\.\/tailwind\.css"/);
  assert.doesNotMatch(anc, /cdn\.jsdelivr\.net|fonts\.googleapis\.com/i);
});

test("Android package has minSdk 24 and no network permission", () => {
  assert.match(GRADLE, /minSdk\s+24/);
  assert.match(GRADLE, /targetSdk\s+34/);
  assert.match(MANIFEST, /android\.permission\.RECORD_AUDIO/);
  assert.match(MANIFEST, /android\.permission\.MODIFY_AUDIO_SETTINGS/);
  assert.doesNotMatch(MANIFEST, /android\.permission\.INTERNET/);
  assert.match(MANIFEST, /android:usesCleartextTraffic="false"/);
  assert.match(MANIFEST, /android:allowBackup="false"/);
});

test("only ANC can request WebView audio after the Android runtime permission grant", () => {
  assert.match(MAIN_ACTIVITY, /ANC_AUDIO_HOST\s*=\s*"app-anc-studio\.invalid"/);
  assert.match(MAIN_ACTIVITY, /void handleWebPermissionRequest\(PermissionRequest request\)/);
  assert.match(MAIN_ACTIVITY, /isAncOrigin\(request\.getOrigin\(\)\)/);
  assert.match(MAIN_ACTIVITY, /resources != null &&\s*resources\.length == 1/);
  assert.match(MAIN_ACTIVITY, /PermissionRequest\.RESOURCE_AUDIO_CAPTURE/);
  assert.match(MAIN_ACTIVITY, /requestPermissions\(new String\[\]\s*\{\s*Manifest\.permission\.RECORD_AUDIO\s*\}/);
  assert.match(MAIN_ACTIVITY, /onRequestPermissionsResult/);
  assert.match(MAIN_ACTIVITY, /request\.deny\(\)/);
  assert.doesNotMatch(MAIN_ACTIVITY, /RESOURCE_VIDEO_CAPTURE/);
  assert.match(MAIN_ACTIVITY, /Enable it in Android Settings > Apps > HTML5 Offline Library > Permissions/);
});

test("Android emulator tests exercise microphone capture and Headline Harry boot", () => {
  assert.match(ANDROID_SMOKE_TEST, /navigator\.mediaDevices\.getUserMedia\(\{audio: true\}\)/);
  assert.match(ANDROID_SMOKE_TEST, /https:\/\/app-headline-harry\.invalid\/index\.html/);
  assert.match(ANDROID_SMOKE_TEST, /DOSBox ready/);
  assert.match(ANDROID_WORKFLOW, /reactivecircus\/android-emulator-runner@v2/);
  assert.match(ANDROID_WORKFLOW, /apt-get install --yes --no-install-recommends pulseaudio pulseaudio-utils/);
  assert.match(ANDROID_WORKFLOW, /module-null-sink sink_name=ci_mic_bus/);
  assert.match(ANDROID_WORKFLOW, /pactl set-default-source ci_mic_bus\.monitor/);
  assert.match(ANDROID_WORKFLOW, /grep -Fq 'android\.permission\.MODIFY_AUDIO_SETTINGS'/);
  assert.match(ANDROID_WORKFLOW, /:app:connectedPublicDebugAndroidTest/);
  assert.match(ANDROID_WORKFLOW, /:app:assemblePrivateDebug/);
  assert.match(ANDROID_WORKFLOW, /html5-offline-launcher-public-debug-apk/);
  assert.match(ANDROID_WORKFLOW, /app\/build\/outputs\/apk\/public\/debug\/app-public-debug\.apk/);
  assert.match(ANDROID_WORKFLOW, /app\/build\/outputs\/apk\/private\/debug\/app-private-debug\.apk/);
  assert.match(ANDROID_WORKFLOW, /Private APK contains only the two allowlisted apps; it will not be uploaded/);
  const uploadStep = ANDROID_WORKFLOW.slice(ANDROID_WORKFLOW.lastIndexOf("- uses: actions/upload-artifact@v4"));
  assert.match(uploadStep, /path: apps\/html5-offline-launcher\/app\/build\/outputs\/apk\/public\/debug\/app-public-debug\.apk/);
  assert.doesNotMatch(uploadStep, /private-debug\.apk/);
  assert.match(README, /93\*\* HTML entrypoints/);
  assert.match(README, /8,441\s+files/);
  assert.match(README, /160,420,682 bytes uncompressed/);
  assert.match(README, /ANC Studio microphone capture is opt-in/);
  assert.doesNotMatch(README, /still denies microphone permission/);
});

test("unreviewed BIP-39 candidates are not added to the offline launcher", () => {
  assert.doesNotMatch(LAUNCHER_BUILDER, /haiku\.xdc|bip39-standalone\.html/);
});

test("the WebView client serves packaged assets and blocks unknown hosts", () => {
  assert.match(CLIENT, /shouldInterceptRequest/);
  assert.match(CLIENT, /rootsByHost\.get/);
  assert.match(CLIENT, /Offline mode blocks external requests/);
  assert.match(CLIENT, /resolveAssetPath/);
  assert.match(CLIENT, /"\.\."\.equals\(part\)/);
  assert.match(CLIENT, /CATALOG_HOST/);
  assert.match(CLIENT, /HOME_URL/);
});

test("catalog uses local relative assets and generated per-app HTTPS origins", () => {
  assert.match(CATALOG_HTML, /href="catalog\.css"/);
  assert.match(CATALOG_HTML, /src="catalog\.js"/);
  assert.doesNotMatch(CATALOG_HTML, /(?:src|href)=["']https?:\/\//i);
  assert.match(CATALOG_JS, /https:\/\/\$\{app\.host\}/);
  assert.match(CATALOG_JS, /fetch\("\/catalog\.json"/);
  assert.doesNotMatch(CATALOG_JS, /localhost|127\.0\.0\.1/i);
});
