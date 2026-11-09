import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { buildCatalog, discoverApps } from "../scripts/build-html5-offline-launcher-assets.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PROJECT = join(ROOT, "apps", "html5-offline-launcher");
const MANIFEST = readFileSync(join(PROJECT, "app/src/main/AndroidManifest.xml"), "utf8");
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

test("every entrypoint has a unique synthetic origin, including case-only slug collisions", () => {
  const catalog = buildCatalog();
  const hosts = catalog.map((app) => app.host);
  assert.equal(new Set(hosts).size, catalog.length);
  assert.ok(hosts.every((host) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.invalid$/.test(host)));
  assert.equal(hosts.includes("catalog.invalid"), false);
  const georgia = catalog.filter((app) => app.slug.toLowerCase() === "georgia-subsurface");
  assert.equal(georgia.length, 2);
  assert.notEqual(georgia[0].host, georgia[1].host);
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
  assert.doesNotMatch(MANIFEST, /android\.permission\.INTERNET/);
  assert.match(MANIFEST, /android:usesCleartextTraffic="false"/);
  assert.match(MANIFEST, /android:allowBackup="false"/);
});

test("only ANC can request WebView audio after the Android runtime permission grant", () => {
  assert.match(MAIN_ACTIVITY, /ANC_AUDIO_HOST\s*=\s*"app-anc-studio\.invalid"/);
  assert.match(MAIN_ACTIVITY, /isAncOrigin\(request\.getOrigin\(\)\)/);
  assert.match(MAIN_ACTIVITY, /resources != null &&\s*resources\.length == 1/);
  assert.match(MAIN_ACTIVITY, /PermissionRequest\.RESOURCE_AUDIO_CAPTURE/);
  assert.match(MAIN_ACTIVITY, /requestPermissions\(new String\[\]\s*\{\s*Manifest\.permission\.RECORD_AUDIO\s*\}/);
  assert.match(MAIN_ACTIVITY, /onRequestPermissionsResult/);
  assert.match(MAIN_ACTIVITY, /request\.deny\(\)/);
  assert.doesNotMatch(MAIN_ACTIVITY, /RESOURCE_VIDEO_CAPTURE/);
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
