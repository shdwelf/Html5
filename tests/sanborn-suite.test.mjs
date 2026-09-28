// Guards the fused webxdc app: public/apps/sanborn-suite/index.html
//
//   node --test tests/sanborn-suite.test.mjs
//
// The suite must stay ONE self-contained file that carries BOTH apps whole,
// with every feature of each app intact and nothing fetched at runtime.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const suitePath = path.join(root, "public/apps/sanborn-suite/index.html");
const suite = readFileSync(suitePath, "utf8");

function payload(id) {
  const m = suite.match(
    new RegExp(`<script type="application/x-sanborn-payload" id="payload-${id}">([A-Za-z0-9+/=]+)</script>`),
  );
  assert.ok(m, `payload ${id} not found`);
  return Buffer.from(m[1], "base64").toString("utf8");
}

const codex = payload("codex");
const vrml = payload("vrml");

test("the container ships index.html, manifest, shim and icon", () => {
  for (const f of ["index.html", "manifest.toml", "webxdc.js", "icon.png"]) {
    assert.ok(existsSync(path.join(root, "public/apps/sanborn-suite", f)), `missing ${f}`);
  }
  const manifest = readFileSync(path.join(root, "public/apps/sanborn-suite/manifest.toml"), "utf8");
  assert.match(manifest, /^name = ".+"/m);
});

test("both apps are carried whole, byte-for-byte apart from the bridge", () => {
  const sources = {
    codex: readFileSync(path.join(root, "public/apps/sanborn-codex/index.html"), "utf8"),
    vrml: readFileSync(path.join(root, "public/apps/kryptos-vrml/index.html"), "utf8"),
  };
  for (const [id, original] of Object.entries(sources)) {
    const carried = id === "codex" ? codex : vrml;
    // the only permitted differences: the child's own webxdc <script src> is
    // dropped, and the suite bridge is injected after <head>
    const stripped = original.replace(/\s*<script\s+src=["']\.\/webxdc\.js["']\s*><\/script>/gi, "");
    const bridgeStart = carried.indexOf("<script>/* sanborn-suite bridge");
    assert.ok(bridgeStart > 0, `${id}: bridge not injected`);
    const bridgeEnd = carried.indexOf("</script>", bridgeStart) + "</script>".length;
    const withoutBridge = carried.slice(0, bridgeStart).replace(/\n$/, "") + carried.slice(bridgeEnd);
    assert.equal(withoutBridge.length, stripped.length, `${id}: payload length differs from the packaged app`);
    assert.ok(withoutBridge === stripped, `${id}: payload is not the packaged app`);
  }
});

test("no child keeps a relative webxdc.js it cannot resolve", () => {
  assert.doesNotMatch(codex, /src=["']\.\/webxdc\.js["']/);
  assert.doesNotMatch(vrml, /src=["']\.\/webxdc\.js["']/);
  // …and each child is handed the host's webxdc object instead
  assert.match(codex, /window\.webxdc = window\.parent\.webxdc/);
  assert.match(vrml, /window\.webxdc = window\.parent\.webxdc/);
});

test("the codex keeps its features", () => {
  assert.match(codex, /Sanborn Codex/);
  assert.match(codex, /<div id="root"/);
  assert.ok(codex.includes("react"), "React runtime missing");
  assert.ok(codex.length > 1_000_000, "codex bundle looks truncated");
  assert.match(codex, /zgdice/); // zen-garden skin switcher
  assert.match(codex, /boot watchdog/); // offline failure explainer
});

test("the viewer keeps its features, including the source-check pass", () => {
  assert.match(vrml, /const SCULPTURES = \{/);
  const keys = [...vrml.matchAll(/^ {2}([a-z_0-9]+): \{$/gm)].map((m) => m[1]);
  assert.equal(keys.length, 11, `expected 11 installations, saw ${keys.length}`);
  assert.ok(keys.includes("lingua"));
  assert.match(vrml, /SOURCES &amp; VERIFICATION/);
  assert.match(vrml, /Walter E\. Washington Convention Center/);
  assert.match(vrml, /University of North Carolina, Charlotte/);
  assert.match(vrml, /has still not been broken/);
  assert.match(vrml, /selectSculpture\('kryptos'\)/); // same guard as the standalone build
});

test("the shell mounts each app in its own document and can switch", () => {
  assert.match(suite, /doc\.open\(\);\s*\n\s*doc\.write\(html\);\s*\n\s*doc\.close\(\);/);
  assert.match(suite, /srcdoc = html/); // fallback path
  assert.match(suite, /KEYMAP = \{ "1": "codex", "2": "vrml", "3": "about" \}/);
  assert.match(suite, /sanbornSuite !== "nav"/); // keystrokes forwarded out of the children
  for (const id of ["nav-codex", "nav-vrml", "nav-about"]) {
    assert.ok(suite.includes(`id="${id}"`), `missing control ${id}`);
  }
});

test("nothing is fetched at runtime — no external script, style, or iframe src", () => {
  const shell = suite.replace(/<script type="application\/x-sanborn-payload"[\s\S]*?<\/script>/g, "");
  const refs = [...shell.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]);
  for (const ref of refs) {
    assert.ok(/^\.\//.test(ref), `shell references something non-local: ${ref}`);
  }
  assert.doesNotMatch(shell, /\bfetch\s*\(/);
  assert.doesNotMatch(shell, /XMLHttpRequest/);
  // the children must not pull assets either
  for (const [id, html] of [["codex", codex], ["vrml", vrml]]) {
    const tags = [...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const ref of tags) {
      assert.ok(!/^https?:/i.test(ref), `${id} loads a remote asset: ${ref}`);
    }
  }
});

test("the suite explains the merge and the source check to the reader", () => {
  assert.match(suite, /Two apps, one container/);
  assert.match(suite, /Why they are mounted, not merged/);
  assert.match(suite, /\$962,500/);
  assert.match(suite, /Ethiopic/);
});
