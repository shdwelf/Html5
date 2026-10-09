// Regression checks for the distributable webxdc archives.
//
// The archives are committed deliverables, not merely build by-products.  Keep
// the assertions at the archive boundary so a new HTML page/site cannot be
// present in the working tree yet absent from the file users install.

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("SoCal Subsurface archive is current and closes its local module graph", () => {
  const files = archive("socal-subsurface.xdc");
  const required = [
    "index.html", "manifest.toml", "css/socal-subsurface.css",
    "js/socal-subsurface.js", "js/socal-radio.js", "js/socal-radio-data.js",
    "js/socal-propagation.js", "js/socal-relief.js", "js/socal-utilities.js",
    "js/socal-utilities-data.js", "js/socal-orbital.js", "js/gpx-geocache.js",
    "vendor/fflate/index.mjs", "vendor/fflate/LICENSE",
  ];
  for (const file of required) assert.ok(files[file], `archive is missing ${file}`);
  assert.equal(text(files, "js/gpx-geocache.js"), source("js/gpx-geocache.js"));
  assert.equal(text(files, "vendor/fflate/index.mjs"), source("vendor/fflate/index.mjs"));
  assert.match(text(files, "index.html"), /LOCAL GPX → GEOCACHE REGISTER/);
  assert.doesNotMatch(text(files, "js/socal-gazetteer-data.js"), /\["[^"]+","Geocache",/);

  // Every staged first-party source must be byte-identical to the working tree.
  // This catches archives that contain the right filename but stale contents.
  for (const archived of Object.keys(files).filter((name) => /^(?:js|css)\//.test(name))) {
    const working = path.join(root, archived);
    assert.ok(existsSync(working), `${archived} in socal-subsurface.xdc has no working-tree source`);
    assert.deepEqual(
      Buffer.from(files[archived]),
      readFileSync(working),
      `${archived} in socal-subsurface.xdc is stale`,
    );
  }

  const specifiers = (sourceText) => {
    const found = [];
    const patterns = [
      /\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    ];
    for (const pattern of patterns) {
      for (const match of sourceText.matchAll(pattern)) found.push(match[1]);
    }
    return found;
  };

  // Traverse source imports. Every resolvable first-party dependency must also
  // be in the archive; unresolved imports are optional runtime enhancements.
  const pending = ["js/socal-subsurface.js"];
  const visited = new Set();
  while (pending.length) {
    const moduleName = pending.pop();
    if (visited.has(moduleName)) continue;
    visited.add(moduleName);
    assert.ok(files[moduleName], `archive module graph is missing ${moduleName}`);
    const sourceText = readFileSync(path.join(root, moduleName), "utf8");
    for (const specifier of specifiers(sourceText)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(moduleName), specifier));
      if (dependency.startsWith("vendor/")) continue;
      if (existsSync(path.join(root, dependency))) pending.push(dependency);
    }
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

test("SITE-K ships the Cheyenne and Four Corners exhibits with local dependencies", () => {
  const files = archive("sitek.xdc");
  for (const file of [
    "cheyenne.html", "four-corners.html",
    "css/cheyenne.css", "css/four-corners.css",
    "js/cheyenne.js", "js/cheyenne-data.js",
    "js/four-corners.js", "js/four-corners-data.js",
  ]) {
    assert.ok(files[file], `SITE-K is missing ${file}`);
  }
  // The pages must be the current working-tree versions, not stale copies.
  assert.equal(text(files, "cheyenne.html"), source("cheyenne.html"));
  assert.equal(text(files, "four-corners.html"), source("four-corners.html"));
  assert.equal(text(files, "js/four-corners.js"), source("js/four-corners.js"));
  assert.equal(text(files, "js/four-corners-data.js"), source("js/four-corners-data.js"));
  // The theater and the 4Dwm map need the local three.js modules.
  assert.ok(files["vendor/three.module.min.js"], "SITE-K is missing vendor three for the exhibits");
  assert.ok(files["vendor/OrbitControls.js"], "SITE-K is missing vendor OrbitControls for the exhibits");
});

test("Four Corners theater archive is current and closes its local module graph", () => {
  const files = archive("four-corners.xdc");
  for (const file of [
    "index.html", "manifest.toml", "webxdc.js",
    "css/four-corners.css", "js/four-corners.js", "js/four-corners-data.js",
    "vendor/three.module.min.js", "vendor/OrbitControls.js",
  ]) assert.ok(files[file], `four-corners.xdc is missing ${file}`);

  // Every staged first-party source must be byte-identical to the working tree.
  for (const archived of Object.keys(files).filter((name) => /^(?:js|css)\//.test(name))) {
    assert.deepEqual(
      Buffer.from(files[archived]),
      readFileSync(path.join(root, archived)),
      `${archived} in four-corners.xdc is stale`,
    );
  }

  // index.html is the root page with the webxdc.js injection spliced in.
  const stagedIndex = text(files, "index.html");
  const rootPage = source("four-corners.html");
  assert.ok(
    stagedIndex.includes('<script src="./webxdc.js"></script>'),
    "four-corners.xdc index.html lost the webxdc.js injection",
  );
  for (const line of rootPage.split("\n")) {
    if (line.includes("four-corners.css") || line.includes("four-corners.js")) {
      assert.ok(stagedIndex.includes(line.trim()), `staged index lost reference: ${line.trim()}`);
    }
  }

  const specifiers = (sourceText) => {
    const found = [];
    const patterns = [
      /\b(?:import\s+(?:[^'";]*?from\s*)?|export\s+[^'";]*?from\s*)["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    ];
    for (const pattern of patterns) for (const match of sourceText.matchAll(pattern)) found.push(match[1]);
    return found;
  };

  const pending = ["js/four-corners.js"];
  const visited = new Set();
  while (pending.length) {
    const moduleName = pending.pop();
    if (visited.has(moduleName)) continue;
    visited.add(moduleName);
    assert.ok(files[moduleName], `four-corners module graph is missing ${moduleName}`);
    const sourceText = readFileSync(path.join(root, moduleName), "utf8");
    for (const specifier of specifiers(sourceText)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(moduleName), specifier));
      if (dependency.startsWith("vendor/")) continue;
      if (existsSync(path.join(root, dependency))) pending.push(dependency);
    }
  }
});

test("Headline Harry archive boots the js-dos v8 API with the complete engine", () => {
  const files = archive("headline-harry.xdc");

  // The full 8.4.1 engine set — emulators.js lazily fetches wdosbox.js AND
  // the wlibzip pair via pathPrefix; a missing wlibzip 404s inside
  // bundleConfig() before the game can start.
  const engineDir = path.join(root, "webxdc-headline-harry", "app", "js-dos");
  for (const name of [
    "js-dos.js", "js-dos.css", "emulators.js",
    "wdosbox.js", "wdosbox.wasm", "wlibzip.js", "wlibzip.wasm",
  ]) {
    const entry = `js-dos/${name}`;
    assert.ok(files[entry], `headline-harry.xdc is missing ${entry}`);
    assert.deepEqual(
      Buffer.from(files[entry]),
      readFileSync(path.join(engineDir, name)),
      `${entry} is not the vendored js-dos 8.4.1 file`,
    );
  }

  const shell = text(files, "index.html");
  assert.equal(shell, source("public/apps/headline-harry/index.html"), "packed shell is stale");
  assert.doesNotMatch(shell, /dosInstance\.run\(/, "v7 dosInstance.run() crept back into the shell");
  assert.match(shell, /url:\s*"roms\/headline-harry\.jsdos"/);
  assert.match(shell, /pathPrefix:\s*"js-dos\/"/);

  // The roms bundle must be a real .jsdos bundle: autoexec mounts C: and boots.
  const rom = unzipSync(files["roms/headline-harry.jsdos"]);
  const conf = decoder.decode(rom[".jsdos/dosbox.conf"]);
  assert.match(conf, /\[autoexec\]/);
  assert.match(conf, /mount c \./);
  assert.ok(rom["MAP.EXE"], "headline-harry.jsdos lost MAP.EXE");
});

test("merged CyberChef archive is current and self-contained", () => {
  const files = archive("cyberchef.xdc");
  assert.equal(text(files, "index.html"), source("public/apps/cyberchef/index.html"));
  assert.match(text(files, "manifest.toml"), /CyberChef Kitchen \(Html5 merged\)/);
  assert.match(text(files, "manifest.toml"), /479 operations/);
  assert.match(text(files, "index.html"), /HTML5 · 479 recipes/);
  for (const id of ["enigmaM4", "secomExact", "virusSigScan", "dosBootSector", "gcwBraille", "primesFactor"]) {
    assert.match(text(files, "index.html"), new RegExp(`addOp\\(['"]${id}['"]`), `archive is missing ${id}`);
  }
  assert.ok(files["webxdc.js"], "cyberchef.xdc is missing the webxdc shim");
});

test("webxdc-dos archive boots js-dos v8 with complete engine and prebuilt bundles", () => {
  const files = archive("webxdc-dos/dos-binary-loader.xdc");

  for (const name of [
    "js-dos/js-dos.js", "js-dos/js-dos.css", "js-dos/emulators.js",
    "js-dos/wdosbox.js", "js-dos/wdosbox.wasm",
    "js-dos/wlibzip.js", "js-dos/wlibzip.wasm",
  ]) assert.ok(files[name], `dos-binary-loader.xdc is missing ${name}`);

  // Relative engine references only — a webxdc host serves the archive from an
  // arbitrary path, root-absolute /js-dos/ URLs 404.
  const index = text(files, "index.html");
  assert.match(index, /href="\.\/js-dos\/js-dos\.css"/);
  assert.match(index, /src="\.\/js-dos\/js-dos\.js"/);
  assert.doesNotMatch(index, /["'](\/js-dos\/|\/roms\/)/);

  // The bundled app: v8 boot markers, runtime zip wrapping, global exports.
  const appChunk = Object.keys(files).find((name) => /^assets\/index-[^/]+\.js$/.test(name));
  assert.ok(appChunk, "dos-binary-loader.xdc has no vite app chunk");
  const app = text(files, appChunk);
  // vite minifies strings to backticks — accept either quoting style
  assert.match(app, /pathPrefix:\s*["'`]\.\/js-dos\/["'`]/);
  assert.match(app, /roms\/DOSDEMO\.jsdos/);
  assert.match(app, /roms\/SNEAKERS\.jsdos/);
  assert.match(app, /window\.loadDemo\s*=/, "module exports missing: Run Demo button cannot reach loadDemo");
  assert.doesNotMatch(app, /Dos\.configure\(/, "v6 Dos.configure crept back into the app");
  assert.doesNotMatch(app, /dosInstance\.run\(/, "v7 dosInstance.run() crept back into the app");
  assert.match(app, /invalid zip data/, "fflate runtime zip-wrapping is not bundled");

  // Prebuilt .jsdos bundles carry a dosbox.conf whose autoexec boots the game.
  for (const [bundle, launcher, payload] of [
    ["roms/DOSDEMO.jsdos", "DEMO.COM", "DEMO.COM"],
    ["roms/SNEAKERS.jsdos", "RUN.BAT", "SNEAKERS.EXE"],
  ]) {
    assert.ok(files[bundle], `dos-binary-loader.xdc is missing ${bundle}`);
    const inner = unzipSync(files[bundle]);
    const conf = decoder.decode(inner[".jsdos/dosbox.conf"]);
    assert.match(conf, /\[autoexec\]/, `${bundle} has no autoexec`);
    assert.ok(conf.trimEnd().endsWith(launcher), `${bundle} autoexec does not run ${launcher}`);
    assert.ok(inner[payload], `${bundle} lost ${payload}`);
  }
});
