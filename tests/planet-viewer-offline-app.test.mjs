import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const app = path.join(root, "public", "apps", "planet-viewer");
const read = (relative) => readFileSync(path.join(app, relative), "utf8");

function moduleSpecifiers(source) {
  const specs = [];
  for (const pattern of [
    /\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g,
    /\bimport\s*\(\s*(?:\/\*.*?\*\/\s*)?["']([^"']+)["']\s*\)/g,
  ]) {
    for (const match of source.matchAll(pattern)) specs.push(match[1]);
  }
  return specs;
}

test("Planet Viewer is staged as a local, self-contained offline catalog app", () => {
  for (const relative of [
    "index.html", "manifest.toml", "webxdc.js", "icon.png",
    "vendor/world/countries.geo.json", "vendor/world/README.md", "vendor/world/UNLICENSE",
    "vendor/THREE_LICENSE",
  ]) assert.ok(existsSync(path.join(app, relative)), `missing packaged asset ${relative}`);

  const sourceHtml = readFileSync(path.join(root, "planet-viewer-4dwm.html"), "utf8");
  const expected = sourceHtml.replace(
    '<script type="module" src="./js/planet-viewer-4dwm.js"></script>',
    '<script src="./webxdc.js"></script>\n  <script type="module" src="./js/planet-viewer-4dwm.js"></script>',
  );
  assert.equal(read("index.html"), expected, "offline page preserves the existing Planet Viewer UI");
  assert.match(read("manifest.toml"), /Planet Viewer/);
  assert.doesNotMatch(read("index.html"), /(?:src|href)=["']https?:\/\//i);

  const pending = ["js/planet-viewer-4dwm.js"];
  const visited = new Set();
  while (pending.length) {
    const relative = pending.pop();
    if (visited.has(relative)) continue;
    visited.add(relative);
    const source = read(relative);
    for (const specifier of moduleSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(relative), specifier));
      assert.ok(!dependency.startsWith("../"), `${relative} import escapes packaged app: ${specifier}`);
      assert.ok(existsSync(path.join(app, dependency)), `${relative} import not packaged: ${dependency}`);
      pending.push(dependency);
    }
  }
  assert.ok(visited.has("apps/red-october-command-viewer/core.js"),
    "the globe module dependency is present under its preserved relative path");
  assert.ok(existsSync(path.join(app, "apps/red-october-command-viewer/core.js")));
  assert.ok(visited.size >= 15, `module graph should include terrain, globe, controls, and source data; got ${visited.size}`);

  const cssRefs = [...read("index.html").matchAll(/<link\b[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
  for (const relative of cssRefs) {
    assert.ok(!/^https?:/i.test(relative), `remote stylesheet: ${relative}`);
    assert.ok(existsSync(path.join(app, relative)), `missing stylesheet ${relative}`);
  }
  assert.match(read("js/planet-viewer-4dwm.js"), /fetch\("\.\/vendor\/world\/countries\.geo\.json"\)/,
    "runtime country geometry must resolve from the packaged local data file");
});

test("Planet offline staging does not repurpose the legacy XDC filename", () => {
  const builder = readFileSync(path.join(root, "scripts/build-planet-viewer-offline-app.mjs"), "utf8");
  assert.match(builder, /legacy planet-viewer-4dwm\.xdc compatibility artifact/);
  assert.doesNotMatch(builder, /writeFile\([^\n]*planet-viewer-4dwm\.xdc/);
  const legacyBuilder = readFileSync(path.join(root, "scripts/build-planet-viewer-xdc.mjs"), "utf8");
  assert.match(legacyBuilder, /socal-subsurface/i);
});
