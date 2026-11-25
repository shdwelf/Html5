import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { unzipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appsRoot = path.join(root, "public", "apps");
const appNames = ["helios-observatory", "prime-viewer"];

function walkFiles(directory, relative = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolute, child));
    else if (entry.isFile()) files.push(child.split(path.sep).join("/"));
  }
  return files.sort();
}

function assertLocalHtmlReferences(appDir, html, pageName) {
  for (const [, raw] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    assert.doesNotMatch(raw, /^(?:https?:)?\/\//i, `${pageName} has a remote reference: ${raw}`);
    if (raw.startsWith("#") || raw.startsWith("data:")) continue;
    const filePart = raw.split("#", 1)[0].split("?", 1)[0];
    const resolved = path.resolve(appDir, path.dirname(pageName), decodeURIComponent(filePart));
    assert.ok(resolved.startsWith(appDir + path.sep), `${pageName} escapes its offline app: ${raw}`);
    assert.ok(statSync(resolved, { throwIfNoEntry: false })?.isFile(), `${pageName} references missing local file ${raw}`);
  }
}

function assertLocalImports(appDir, appName) {
  for (const filename of walkFiles(appDir).filter((file) => file.startsWith("js/") && file.endsWith(".js"))) {
    const source = readFileSync(path.join(appDir, filename), "utf8");
      assert.doesNotMatch(source, /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/, `${appName}/${filename} must not initiate network requests`);
    for (const [, specifier] of source.matchAll(/(?:\bfrom\s*|\bimport\s*\()\s*["']([^"']+)["']/g)) {
      if (!specifier.startsWith(".")) continue;
      const resolved = path.resolve(appDir, path.dirname(filename), specifier);
      assert.ok(resolved.startsWith(appDir + path.sep), `${appName}/${filename} import escapes the app: ${specifier}`);
      assert.ok(statSync(resolved, { throwIfNoEntry: false })?.isFile(), `${appName}/${filename} imports missing local file ${specifier}`);
    }
  }
}

for (const appName of appNames) {
  test(`${appName} is a self-contained local offline viewer`, () => {
    const appDir = path.join(appsRoot, appName);
    const files = walkFiles(appDir);
    for (const required of [
      "index.html", "manifest.toml", "README.md", "webxdc.js", "icon.png",
      "vendor/three.module.min.js", "vendor/OrbitControls.js", "vendor/THREE_LICENSE",
      "css/astronomy.css", "css/prime.css", "js/astronomy.js", "js/astronomy-viewer.js",
      "js/primes.js", "js/prime-viewer.js",
    ]) {
      assert.ok(files.includes(required), `${appName} is missing ${required}`);
    }
    assert.ok(files.some((file) => file === "prime.html" || file === "helios.html"), `${appName} is missing its local companion page`);
    assert.match(readFileSync(path.join(appDir, "vendor/THREE_LICENSE"), "utf8"), /MIT/i);

    for (const pageName of ["index.html", "prime.html", "helios.html"].filter((name) => files.includes(name))) {
      const html = readFileSync(path.join(appDir, pageName), "utf8");
      assertLocalHtmlReferences(appDir, html, pageName);
    }
    assertLocalImports(appDir, appName);
    for (const filename of ["js/astronomy.js", "js/astronomy-viewer.js", "js/primes.js", "js/prime-viewer.js"]) {
      const source = readFileSync(path.join(appDir, filename), "utf8");
      assert.doesNotMatch(source, /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/, `${appName}/${filename} must not initiate network requests`);
    }
    const heliosCode = readFileSync(path.join(appDir, "js/astronomy-viewer.js"), "utf8");
    const primeCode = readFileSync(path.join(appDir, "js/prime-viewer.js"), "utf8");
    assert.match(heliosCode, /payload:\{type:"helios",view:st\.view,days:st\.days,focus:st\.focus,stream:st\.stream\}/);
    assert.match(primeCode, /type: "prime-view", view: state\.view, limit: state\.limit, focus: state\.focus/);

    const ownHtml = readFileSync(path.join(appDir, "index.html"), "utf8");
    if (appName === "helios-observatory") {
      assert.match(ownHtml, /href="\.\/prime\.html"/);
      assert.match(readFileSync(path.join(appDir, "prime.html"), "utf8"), /href="\.\/index\.html"/);
    } else {
      assert.match(ownHtml, /href="\.\/helios\.html"/);
      assert.match(readFileSync(path.join(appDir, "helios.html"), "utf8"), /href="\.\/index\.html"/);
    }
  });
}

test("packaged Helios and Prime XDCs carry both local pages and their local runtime assets", () => {
  for (const [archiveName, homeName, companionName, homeTarget] of [
    ["helios-observatory.xdc", "index.html", "prime.html", "./prime.html"],
    ["prime-viewer.xdc", "index.html", "helios.html", "./helios.html"],
  ]) {
    const entries = unzipSync(new Uint8Array(readFileSync(path.join(root, archiveName))));
    assert.ok(entries[homeName] && entries[companionName], `${archiveName} contains both offline pages`);
    assert.ok(entries["manifest.toml"] && entries["webxdc.js"]);
    assert.ok(entries["vendor/three.module.min.js"] && entries["vendor/OrbitControls.js"]);
    assert.ok(entries["vendor/THREE_LICENSE"]);
    const home = new TextDecoder().decode(entries[homeName]);
    assert.ok(home.includes(`href="${homeTarget}"`), `${archiveName} has working local companion navigation`);
  }
});

test("offline viewer outputs exactly match the source-XDC builder", () => {
  const result = spawnSync(process.execPath, [path.join(root, "scripts", "build-astronomy-offline-viewers.mjs"), "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
