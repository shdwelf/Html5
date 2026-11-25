import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { buildCatalog, discoverApps } from "../scripts/build-html5-offline-launcher-assets.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PROJECT = join(ROOT, "apps", "html5-offline-launcher");
const MANIFEST = readFileSync(join(PROJECT, "app/src/main/AndroidManifest.xml"), "utf8");
const PRIVATE_MANIFEST = readFileSync(join(PROJECT, "app/src/private/AndroidManifest.xml"), "utf8");
const NETWORK_MANIFEST = readFileSync(join(PROJECT, "app/src/network/AndroidManifest.xml"), "utf8");
const NEWS_GLOBE = readFileSync(join(ROOT, "apps", "news-globe.html"), "utf8");
const RADAR_SCOPE = readFileSync(join(ROOT, "apps", "ads-b-radar-scope"), "utf8");
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
  assert.equal(expectedSlugs.length, 96);
  assert.deepEqual(discovered, expectedSlugs);
  assert.deepEqual(catalog.map((app) => app.slug).sort(), expectedSlugs);
  assert.equal(catalog.length, 96);
  assert.ok(expectedSlugs.includes("newyork-subsurface"));
  assert.ok(expectedSlugs.includes("helios-observatory"));
  assert.ok(expectedSlugs.includes("prime-viewer"));
  assert.ok(expectedSlugs.includes("keyspace"));
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

test("opt-in network profile adds RadarScope and News Globe without changing offline inventories", () => {
  const network = buildCatalog("network");
  assert.equal(network.length, 98);
  assert.ok(network.some((app) => app.slug === "ads-b-radar-scope"));
  assert.match(RADAR_SCOPE, /feed: 'combined'/);
  assert.doesNotMatch(RADAR_SCOPE, /opensky-network\.org|OpenSky Network|feedOpenSky/);
  assert.match(RADAR_SCOPE, /api\.adsb\.fi/);
  assert.match(RADAR_SCOPE, /api\.airplanes\.live/);
  assert.ok(network.some((app) => app.slug === "news-globe"));
  const publicSlugs = buildCatalog("public").map((app) => app.slug);
  const networkPublicSlugs = network
    .filter((app) => !["ads-b-radar-scope", "news-globe"].includes(app.slug))
    .map((app) => app.slug);
  assert.equal(publicSlugs.length, 96);
  assert.deepEqual(networkPublicSlugs, publicSlugs, "network profile retains every approved public app, including existing coin apps");
  assert.deepEqual(buildCatalog("private").map((app) => app.slug).sort(), ["helios-observatory", "prime-viewer"]);
  assert.match(GRADLE, /create\('network'\)/);
  assert.match(GRADLE, /applicationIdSuffix '\.network'/);
  assert.match(GRADLE, /buildConfigField 'boolean', 'NETWORK_ENABLED', 'true'/);
  assert.match(NETWORK_MANIFEST, /android\.permission\.INTERNET/);
  assert.doesNotMatch(MANIFEST, /android\.permission\.INTERNET/);
  assert.doesNotMatch(PRIVATE_MANIFEST, /android\.permission\.INTERNET/);
  assert.match(MAIN_ACTIVITY, /News Globe loads dynamic OPML and RSS URLs, so the set of feed hosts is not fixed/);
  assert.match(NEWS_GLOBE, /function validateFeedUrl\(raw\)/);
  assert.match(NEWS_GLOBE, /parsed\.protocol !== 'https:'/);
  assert.match(NEWS_GLOBE, /Rejected invalid or non-HTTPS feed host/);
  assert.match(NEWS_GLOBE, /async function fetchValidated/);
  assert.doesNotMatch(NEWS_GLOBE, /api\.allorigins\.win|api\.cors\.lol|corsproxy\.io/);
  const validatorSource = NEWS_GLOBE.match(/  function validateFeedUrl\(raw\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(validatorSource, "News Globe feed URL validator is extractable for policy tests");
  const validateFeedUrl = new Function(`${validatorSource}; return validateFeedUrl;`)();
  assert.equal(validateFeedUrl("https://news.example.org/rss"), "https://news.example.org/rss");
  for (const rejected of [
    "http://news.example.org/rss",
    "https://127.0.0.1/feed.xml",
    "https://localhost/feed.xml",
    "https://feeds.example.org:8443/rss",
    "https://user:pass@feeds.example.org/rss",
    "javascript:alert(1)",
  ]) {
    assert.equal(validateFeedUrl(rejected), null, `expected URL to be rejected: ${rejected}`);
  }
  assert.match(CLIENT, /isValidExternalHttpsUri/);
  assert.match(CLIENT, /IDN\.toASCII/);
  assert.match(CLIENT, /Network mode allows only validated HTTPS hostnames/);
  assert.match(ANDROID_WORKFLOW, /:app:assembleNetworkDebug/);
  assert.match(ANDROID_WORKFLOW, /android\.permission\.INTERNET/);
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
  assert.match(CATALOG_JS, /catalog\.networkEnabled === true/);
  assert.match(CATALOG_HTML, /id="mode-description"/);
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

test("only the three packaged audio apps can request audio at their matching current origin", () => {
  for (const host of ["app-anc-studio.invalid", "app-sound-sanctuary.invalid", "app-aura-sound-studio.invalid"]) assert.ok(MAIN_ACTIVITY.includes(`"${host}"`));
  assert.match(MAIN_ACTIVITY, /void handleWebPermissionRequest\(PermissionRequest request\)/);
  assert.match(MAIN_ACTIVITY, /isAudioOrigin\(request\.getOrigin\(\)\)/);
  assert.match(MAIN_ACTIVITY, /LocalFileExports\.origin\(currentPage\)\.equals\(LocalFileExports\.origin\(request\.getOrigin\(\)\)\)/);
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
  assert.match(ANDROID_SMOKE_TEST, /window\.__arenaSmokeErrors/);
  assert.match(ANDROID_SMOKE_TEST, /headlineDiagnostics/);
  assert.match(ANDROID_WORKFLOW, /android-webview-logcat\.log/);
  assert.match(ANDROID_WORKFLOW, /system-out/);
  const smokeRunner = readFileSync(new URL("../scripts/test-html5-android-webview.sh", import.meta.url), "utf8");
  assert.match(smokeRunner, /adb logcat -v threadtime/);
  assert.ok(smokeRunner.indexOf("run_tests public-local-files") < smokeRunner.indexOf("run_tests public-headline-harry"));
  assert.match(smokeRunner, /trap finish EXIT/);
  assert.match(smokeRunner, /--max-workers=1/);
  assert.match(smokeRunner, /org\.gradle\.jvmargs=-Xmx1024m/);
  assert.match(smokeRunner, /host_evidence "\$label"/);
  assert.match(smokeRunner, /sudo -n dmesg --ctime/);
  assert.match(ANDROID_WORKFLOW, /-memory 2048 -cores 2/);
  assert.match(ANDROID_WORKFLOW, /emulator-options: -no-window -gpu swangle /);
  assert.doesNotMatch(ANDROID_WORKFLOW, /emulator-options:.*-gpu swiftshader_indirect/);
  assert.match(ANDROID_WORKFLOW, /Preserve bounded synthetic WebView diagnostics/);
  assert.match(ANDROID_WORKFLOW, /python3 scripts\/report-html5-android-runner\.py apps\/html5-offline-launcher\/app\/build/);
  assert.match(ANDROID_WORKFLOW, /tests\/html5-android-runner\.test\.mjs/);
  assert.match(ANDROID_WORKFLOW, /report-html5-android-runner\.py --require-complete/);
  assert.match(ANDROID_WORKFLOW, /run-html5-android-ci\.sh app\/build\/android-public-build\.log -- \.\/gradlew/);
  assert.match(ANDROID_WORKFLOW, /reactivecircus\/android-emulator-runner@v2/);
  assert.match(ANDROID_WORKFLOW, /apt-get install --yes --no-install-recommends pulseaudio pulseaudio-utils/);
  assert.match(ANDROID_WORKFLOW, /module-null-sink sink_name=ci_mic_bus/);
  assert.match(ANDROID_WORKFLOW, /pactl set-default-source ci_mic_bus\.monitor/);
  assert.match(ANDROID_WORKFLOW, /grep -Fq 'android\.permission\.MODIFY_AUDIO_SETTINGS'/);
  assert.match(smokeRunner, /:app:connectedPublicDebugAndroidTest/);
  assert.match(smokeRunner, /:app:connectedNetworkDebugAndroidTest/);
  assert.match(ANDROID_WORKFLOW, /:app:assemblePrivateDebug/);
  assert.match(ANDROID_WORKFLOW, /html5-offline-launcher-public-debug-apk/);
  assert.match(ANDROID_WORKFLOW, /html5-offline-launcher-network-debug-apk/);
  assert.match(ANDROID_WORKFLOW, /app\/build\/outputs\/apk\/public\/debug\/app-public-debug\.apk/);
  assert.match(ANDROID_WORKFLOW, /app\/build\/outputs\/apk\/network\/debug\/app-network-debug\.apk/);
  assert.match(ANDROID_WORKFLOW, /app\/build\/outputs\/apk\/private\/debug\/app-private-debug\.apk/);
  assert.match(ANDROID_WORKFLOW, /Private APK contains only the two allowlisted apps/);
  assert.match(ANDROID_WORKFLOW, /Encrypt all three APK profiles for supplied OpenPGP recipient/);
  assert.match(ANDROID_WORKFLOW, /for profile in public network private; do/);
  assert.match(ANDROID_WORKFLOW, /node scripts\/encrypt-openpgp-backup\.mjs/);
  assert.match(ANDROID_WORKFLOW, /--expected-fingerprint "\$RECIPIENT_FINGERPRINT"/);
  assert.match(ANDROID_WORKFLOW, /inputs\.recipient_public_key/);
  assert.match(ANDROID_WORKFLOW, /inputs\.recipient_fingerprint/);
  assert.match(ANDROID_WORKFLOW, /apk="apps\/html5-offline-launcher\/app\/build\/outputs\/apk\/\$profile\/debug\/app-\$profile-debug\.apk"/);
  assert.doesNotMatch(ANDROID_WORKFLOW, /gpg --batch|--list-keys|awk -F:/);
  const encryptedUploadStep = ANDROID_WORKFLOW.slice(ANDROID_WORKFLOW.indexOf("- name: Upload encrypted APKs only"), ANDROID_WORKFLOW.indexOf("- name: Report public APK"));
  assert.match(encryptedUploadStep, /encrypted-apks\/\*\.gpg\*/);
  assert.doesNotMatch(encryptedUploadStep, /path:.*(?:\.apk|\.asc)(?:\s|$)/);
  const publicUploadStep = ANDROID_WORKFLOW.slice(
    ANDROID_WORKFLOW.indexOf("- name: Upload public APK for backup"),
    ANDROID_WORKFLOW.indexOf("- name: Upload network APK for backup"),
  );
  const networkUploadStep = ANDROID_WORKFLOW.slice(
    ANDROID_WORKFLOW.indexOf("- name: Upload network APK for backup"),
    ANDROID_WORKFLOW.indexOf("- name: Install PulseAudio"),
  );
  assert.match(publicUploadStep, /inputs\.recipient_public_key == ''/);
  assert.match(publicUploadStep, /app-public-debug\.apk\.sha256/);
  assert.doesNotMatch(publicUploadStep, /network-debug\.apk/);
  assert.match(networkUploadStep, /inputs\.recipient_public_key == ''/);
  assert.match(networkUploadStep, /app-network-debug\.apk\.sha256/);
  assert.doesNotMatch(networkUploadStep, /private-debug\.apk/);
  for (const name of [
    "- name: Upload encrypted APKs only",
    "- name: Upload public APK for backup",
    "- name: Upload network APK for backup",
  ]) {
    assert.ok(ANDROID_WORKFLOW.indexOf(name) < ANDROID_WORKFLOW.indexOf("- name: Run Android WebView"), "build exports must not wait for emulator completion");
  }
  assert.match(ANDROID_WORKFLOW, /timeout-minutes: 20/);
  assert.match(README, /private Android[\s\S]*?two-app[\s\S]*?Helios Observatory and Prime Viewer/);
  assert.match(README, /96\*\* HTML entrypoints/);
  assert.match(README, /Sound Sanctuary/);
  assert.match(README, /AURA Sound Studio/);
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
