// Regression checks for the distributable webxdc archives.
//
// The archives are committed deliverables, not merely build by-products.  Keep
// the assertions at the archive boundary so a new HTML page/site cannot be
// present in the working tree yet absent from the file users install.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const decoder = new TextDecoder();

function archive(name) {
  return unzipSync(readFileSync(path.join(root, name)));
}

function text(files, name) {
  assert.ok(files[name], `archive is missing ${name}`);
  return decoder.decode(files[name]);
}

function source(name) {
  return readFileSync(path.join(root, name), "utf8");
}

test("SITE-K archive contains the current shell and complete Project Y exhibit", () => {
  const files = archive("sitek.xdc");
  for (const file of [
    "index.html", "manifest.toml", "los-alamos.html",
    "css/project-y-sites.css", "css/project-y-4dwm.css",
    "js/project-y-sites-data.js", "js/project-y-sites.js", "js/project-y-4dwm.js",
    "vendor/three.module.min.js", "vendor/OrbitControls.js",
  ]) text(files, file);

  assert.match(text(files, "manifest.toml"), /SITE-K · Offline Site Collection/);
  assert.equal(text(files, "los-alamos.html"), source("los-alamos.html"));
  assert.equal(text(files, "js/project-y-sites-data.js"), source("js/project-y-sites-data.js"));
  assert.equal(text(files, "sw.js"), source("sw.js"));

  for (const id of ["los-alamos", "oak-ridge", "hanford", "trinity", "ivy-mike", "castle-bravo"]) {
    const model = `models/project-y/${id}.wrl`;
    assert.equal(text(files, model), source(model), `${id} model is stale or missing in SITE-K`);
    assert.match(source("sw.js"), new RegExp(`models/project-y/${id}\\.wrl`), `${id} is not precached by SITE-K`);
  }
});

test("focused Project Y archive ships all six sites and their local dependencies", () => {
  const files = archive("los-alamos.xdc");
  assert.equal(text(files, "index.html"), source("los-alamos.html"));
  assert.match(text(files, "manifest.toml"), /Project Y — Los Alamos Badge Archive/);
  for (const id of ["los-alamos", "oak-ridge", "hanford", "trinity", "ivy-mike", "castle-bravo"]) {
    assert.equal(
      text(files, `models/project-y/${id}.wrl`),
      source(`models/project-y/${id}.wrl`),
      `${id} is stale or absent from los-alamos.xdc`,
    );
  }
});

test("Sanborn Installations archive carries both complete source applications", () => {
  const named = readFileSync(path.join(root, "sanborn-installations.xdc"));
  const compatibility = readFileSync(path.join(root, "sanborn-suite.xdc"));
  assert.deepEqual(named, compatibility, "compatibility archive must be the exact complete suite");

  const files = unzipSync(named);
  const suite = text(files, "index.html");
  assert.match(text(files, "manifest.toml"), /Sanborn Installations — Complete Suite/);
  assert.match(suite, /30-installation catalogue/);
  assert.match(suite, /11 source-checked site entries/);

  const payload = (id) => {
    const match = suite.match(
      new RegExp(`<script type="application/x-sanborn-payload" id="payload-${id}">([A-Za-z0-9+/=]+)</script>`),
    );
    assert.ok(match, `missing ${id} payload`);
    return Buffer.from(match[1], "base64").toString("utf8");
  };

  const codex = payload("codex");
  const viewer = payload("vrml");
  assert.match(codex, /30 installations/);
  assert.match(codex, /critical-assembly/);
  const viewerEntries = [...viewer.matchAll(/^ {2}([a-z_0-9]+): \{$/gm)].map((match) => match[1]);
  assert.equal(viewerEntries.length, 11);
  for (const id of ["kryptos", "lingua", "atomic_time", "find_lodestone"]) {
    assert.ok(viewerEntries.includes(id), `missing Sanborn viewer entry: ${id}`);
  }
});
