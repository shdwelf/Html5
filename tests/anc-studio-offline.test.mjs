import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync("public/apps/anc-studio/index.html", "utf8");
const standalone = readFileSync("apps/anc-studio-ultra-html5-active-noise-control-lab", "utf8");
const css = readFileSync("public/apps/anc-studio/tailwind.css", "utf8");
const mirroredCss = readFileSync("apps/anc-studio-tailwind.css", "utf8");
const launcher = readFileSync("apps/html5-offline-launcher/app/src/main/java/org/arena/html5launcher/MainActivity.java", "utf8");

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

test("Android offline page clearly disables microphone-only controls", () => {
  assert.match(html, /id="offlineMicNotice"/);
  assert.match(html, /Microphone unavailable in the offline Android viewer/);
  assert.match(html, /hostname\.endsWith\('\.invalid'\)/);
  assert.match(html, /startBtn\.disabled = true/);
  assert.match(html, /calibrateBtn\.disabled = true/);
  assert.match(html, /denies microphone permission/i);
  assert.match(html, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(launcher, /onPermissionRequest\(PermissionRequest request\)/);
  assert.match(launcher, /request\.deny\(\)/);
});
