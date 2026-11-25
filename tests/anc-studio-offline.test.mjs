import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync("public/apps/anc-studio/index.html", "utf8");
const standalone = readFileSync("apps/anc-studio-ultra-html5-active-noise-control-lab", "utf8");
const css = readFileSync("public/apps/anc-studio/tailwind.css", "utf8");
const mirroredCss = readFileSync("apps/anc-studio-tailwind.css", "utf8");
const launcher = readFileSync("apps/html5-offline-launcher/app/src/main/java/org/arena/html5launcher/MainActivity.java", "utf8");
const manifest = readFileSync("apps/html5-offline-launcher/app/src/main/AndroidManifest.xml", "utf8");

test("ANC Studio uses only packaged styles and system fonts", () => {
  assert.match(html, /href="\.\/tailwind\.css"/);
  assert.match(standalone, /href="\.\/anc-studio-tailwind\.css"/);
  assert.equal(css, mirroredCss);
  assert.ok(css.length > 20_000, "compiled utility CSS should contain the app's layout and visual classes");
  assert.match(css, /\.hidden\{display:none\}/);
  for (const page of [html, standalone]) {
    assert.doesNotMatch(page, /cdn\.jsdelivr\.net|fonts\.googleapis\.com|@import\s+url\(/i);
    assert.doesNotMatch(page, /<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i);
  }
  assert.ok(existsSync("public/apps/anc-studio/tailwind.css"));
  assert.ok(existsSync("apps/anc-studio-tailwind.css"));
});

test("Android microphone access is ANC-only, opt-in, and runtime-permission gated", () => {
  assert.match(html, /id="offlineMicNotice"/);
  assert.match(html, /Microphone permission is requested only after you press Start/);
  assert.match(html, /hostname === 'app-anc-studio\.invalid'/);
  assert.match(html, /Android Settings &gt; Apps &gt; HTML5 Offline Library &gt; Permissions/);
  assert.match(html, /microphone permission is requested on demand/);
  assert.doesNotMatch(html, /microphone permission is unavailable here/i);
  assert.doesNotMatch(html, /startBtn\.disabled\s*=\s*true|calibrateBtn\.disabled\s*=\s*true/);
  assert.match(html, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(html, /startBtn\.addEventListener\('click',[\s\S]*?if \(!isRunning\) startEngine\(\)/);
  assert.match(html, /calibrateBtn\.addEventListener\('click',[\s\S]*?runCalibration\(\)/);

  assert.match(manifest, /<uses-permission android:name="android\.permission\.RECORD_AUDIO"\s*\/>/);
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
  assert.match(launcher, /ANC_AUDIO_HOST\s*=\s*"app-anc-studio\.invalid"/);
  assert.match(launcher, /request\.getOrigin\(\)/);
  assert.match(launcher, /resources\.length\s*==\s*1/);
  assert.match(launcher, /PermissionRequest\.RESOURCE_AUDIO_CAPTURE/);
  assert.match(launcher, /checkSelfPermission\(Manifest\.permission\.RECORD_AUDIO\)/);
  assert.match(launcher, /requestPermissions\(new String\[\]\s*\{\s*Manifest\.permission\.RECORD_AUDIO\s*\}/);
  assert.match(launcher, /request\.grant\(new String\[\]\s*\{\s*PermissionRequest\.RESOURCE_AUDIO_CAPTURE\s*\}\)/);
  assert.match(launcher, /request\.deny\(\)/);
});
