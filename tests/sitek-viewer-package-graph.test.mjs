// The Country and Planet Viewers are exposed from SITE-K's app dock and must
// retain every local ES-module dependency when installed as the SITE-K XDC.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = unzipSync(readFileSync(path.join(root, "sitek.xdc")));
const specifiers = (source) => {
  const found = [];
  const patterns = [
    /\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) found.push(match[1]);
  return found;
};

test("SITE-K packages the complete offline module graphs for both viewers", () => {
  const pending = ["js/planet-viewer-4dwm.js", "js/country-viewer.js"];
  const visited = new Set();
  while (pending.length) {
    const module = pending.pop();
    if (visited.has(module)) continue;
    visited.add(module);
    assert.ok(files[module], `SITE-K archive is missing ${module}`);
    const source = readFileSync(path.join(root, module), "utf8");
    for (const specifier of specifiers(source)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(module), specifier));
      if (!existsSync(path.join(root, dependency))) continue;
      assert.ok(files[dependency], `${module} imports ${dependency}, but SITE-K does not package it`);
      pending.push(dependency);
    }
  }
  assert.ok(files["country-viewer.html"]);
  assert.ok(files["planet-viewer-4dwm.html"]);
  assert.ok(files["vendor/world/countries.geo.json"], "offline globe coastlines are included");
});
