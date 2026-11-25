import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PAGE = readFileSync(join(ROOT, "offline-viewer.html"), "utf8");
const BUILDER = readFileSync(join(ROOT, "scripts", "build-private-html5-offline-viewer.py"), "utf8");
const APPS = ["helios-observatory", "prime-viewer", "wikiinajar", "keyspace"];

function appFiles(slug) {
  const root = join(ROOT, "public", "apps", slug);
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.push(path);
    }
  }
  walk(root);
  return files;
}

test("public offline viewer contains only the explicitly reviewed local apps", () => {
  assert.match(PAGE, /data-app-root="\.\/public\/apps\/"/);
  assert.match(PAGE, /data-package-root="\.\/"/);
  for (const slug of APPS) {
    assert.ok(existsSync(join(ROOT, "public", "apps", slug, "index.html")), `${slug} entrypoint exists`);
    assert.ok(existsSync(join(ROOT, `${slug}.xdc`)), `${slug} WebXDC exists`);
    assert.match(PAGE, new RegExp(`slug:\\s*"${slug}"`));
  }
  assert.equal((PAGE.match(/slug:\s*"[a-z0-9-]+"/g) ?? []).length, APPS.length);
  assert.match(PAGE, /slug:\s*"keyspace",\s*name:\s*"Keyspace Viewer"/);
  assert.match(PAGE, /slug:\s*"wikiinajar",\s*name:\s*"Wiki in a Jar"/);
  assert.doesNotMatch(PAGE, /slug:\s*"keyviewer"/, "Keyspace Viewer is distinct from the keyviewer app");
  assert.match(PAGE, /\.\/xdc-viewer\.html/);
  assert.doesNotMatch(PAGE, /bip39-haiku|Greeran|Resume|\.arena-drive|drive\.google\.com/i);
});

test("viewer page and selected app entrypoints make no automatic remote requests", () => {
  assert.doesNotMatch(PAGE, /<(?:script|link|img|iframe|audio|video)\b[^>]*\b(?:src|href)\s*=\s*["']https?:\/\//i);
  assert.doesNotMatch(PAGE, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/i);
  for (const slug of APPS) {
    const vendorRoot = `${resolve(ROOT, "public", "apps", slug, "vendor")}${sep}`;
    const files = appFiles(slug).filter((path) => !path.startsWith(vendorRoot));
    for (const path of files) {
      if (!/\.(?:html|js|mjs|css)$/i.test(path)) continue;
      const text = readFileSync(path, "utf8");
      assert.doesNotMatch(text, /<(?:script|link|img|iframe|audio|video)\b[^>]*\b(?:src|href)\s*=\s*["']https?:\/\//i, path);
      assert.doesNotMatch(text, /\bfetch\s*\(\s*(?:new\s+URL\s*\(\s*)?["'`]https?:\/\//i, path);
      assert.doesNotMatch(text, /\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b/i, path);
    }
  }
});

test("private builder is ignored-output-only and uses the same four-app allowlist", () => {
  assert.match(BUILDER, /APP_SLUGS = \("helios-observatory", "prime-viewer", "wikiinajar", "keyspace"\)/);
  assert.match(BUILDER, /OUT_BASE = ROOT \/ "google_drive"/);
  assert.doesNotMatch(BUILDER, /M \(1\)\.xdc|haiku-workbench|Resume \(1\)\.html|greeran-family/);
  assert.match(BUILDER, /Only allowlisted repository apps are included/);
  assert.match(readFileSync(join(ROOT, ".gitignore"), "utf8"), /^google_drive\/$/m);
});
