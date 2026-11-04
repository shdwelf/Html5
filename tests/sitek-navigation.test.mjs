import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { unzipSync } from "fflate";
import { normalizeSitekMode, framePageForMode, isSitekFrameMode, syncSitekDockLink } from "../js/sitek-modes.js";

const root = new URL("../", import.meta.url);
const text = (path) => readFileSync(new URL(path, root), "utf8");

test("SITE-K route aliases select visible embedded pages", () => {
  assert.equal(normalizeSitekMode("#enso"), "enso");
  assert.equal(normalizeSitekMode("#/art-studio"), "studio");
  assert.equal(normalizeSitekMode("#swf"), "flash");
  assert.equal(normalizeSitekMode("#distro-dossier"), "dossier");
  assert.equal(normalizeSitekMode("#unknown"), "grid");
  assert.equal(framePageForMode("enso"), "./art-studio.html");
  assert.equal(framePageForMode("ghidra"), "./ghidra-lab.html");
  assert.equal(framePageForMode("flash"), "./flash-decompiler.html");
  for (const mode of ["keyspace", "validator", "studio", "enso", "ghidra", "flash", "dossier"]) {
    assert.equal(isSitekFrameMode(mode), true, `${mode} is an iframe view`);
  }
  assert.equal(isSitekFrameMode("grid"), false);
});

test("dock synchronization preserves ordinary page links", () => {
  const external = {
    dataset: {},
    href: "./casefiles.html",
    getAttribute(name) { return name === "href" ? this.href : null; },
    setAttribute(name, value) { if (name === "href") this.href = value; },
    classList: { toggle() { throw new Error("external links should not be treated as mode tabs"); } },
  };
  assert.equal(syncSitekDockLink(external, "ghidra"), "./casefiles.html");
  assert.equal(external.href, "./casefiles.html", "ordinary links must not become #undefined");

  const classes = new Set();
  const mode = {
    dataset: { mode: "ghidra" }, href: "#old",
    getAttribute(name) { return name === "href" ? this.href : null; },
    setAttribute(name, value) { if (name === "href") this.href = value; },
    classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
  };
  syncSitekDockLink(mode, "ghidra");
  assert.equal(mode.href, "#ghidra");
  assert.equal(classes.has("on"), true);
  syncSitekDockLink(mode, "grid");
  assert.equal(classes.has("on"), false);
});

test("SITE-K shell exposes the 4DWM directory and all directory targets ship", () => {
  const index = text("index.html");
  const catalog = text("js/sitek-catalog.js");
  const ports = text("4dwm-ports.html");
  const packer = text("tools/pack_xdc.sh");
  const worker = text("sw.js");
  assert.match(index, /href="\.\/4dwm-ports\.html">4DWM PORTS/);
  assert.match(catalog, /route: "\.\/4dwm-ports\.html"/);
  const targets = [...ports.matchAll(/href="\.\/([^"#?]+\.html)"/g)].map((match) => match[1]);
  assert.ok(targets.length >= 10, "directory gives users the available 4DWM launch targets");
  for (const target of targets) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${target}`, import.meta.url)), `${target} exists`);
    assert.ok(packer.includes(`${target}\n`), `${target} is included in SITE-K XDC packaging`);
    assert.ok(worker.includes(`"./${target}"`), `${target} is precached for SITE-K`);
  }
});

test("SITE-K app dock publishes both viewers and their offline dependencies", () => {
  const index = text("index.html");
  const catalog = text("js/sitek-catalog.js");
  const packer = text("tools/pack_xdc.sh");
  const worker = text("sw.js");
  for (const [id, label, page] of [
    ["planet-viewer", "PLANET VIEWER", "planet-viewer-4dwm.html"],
    ["country-viewer", "COUNTRY VIEWER", "country-viewer.html"],
  ]) {
    assert.ok(index.includes(`href="./${page}">${label}`), `${label} appears in the app dock`);
    assert.ok(catalog.includes(`id: "${id}", label: "${label}", route: "./${page}"`), `${id} is in the app catalog`);
    assert.ok(packer.includes(`${page}\n`), `${page} ships inside the SITE-K XDC`);
    assert.ok(worker.includes(`"./${page}"`), `${page} is cached for offline launch`);
    assert.doesNotThrow(() => readFileSync(new URL(`../${page}`, import.meta.url)));
  }
  for (const module of [
    "js/planet-viewer-4dwm.js", "js/planet-viewer-search.js", "js/planet-viewer-checks.js",
    "js/planet-viewer-data.js", "js/planet-globe.js", "js/country-viewer.js",
    "js/city-gazetteer.js", "js/city-gazetteer-data-atlanta.js",
    "js/city-gazetteer-data-buffalo.js", "js/city-gazetteer-data-kansascity.js",
    "js/city-gazetteer-data-lawrence.js", "js/city-gazetteer-data-toronto.js",
    "apps/red-october-command-viewer/core.js", "vendor/world/countries.geo.json",
  ]) {
    assert.ok(worker.includes(`"./${module}"`), `${module} is precached for offline search`);
  }
});

test("Local Directory Desk is listed, packaged, and cached as an offline app", () => {
  const index = text("index.html");
  const page = text("contacts.html");
  const catalog = text("js/sitek-catalog.js");
  const app = text("js/local-contacts-app.js");
  const core = text("js/local-contacts-core.js");
  const packer = text("tools/pack_xdc.sh");
  const worker = text("sw.js");

  assert.ok(index.includes('href="./contacts.html">LOCAL CONTACTS'), "the SITE-K dock links to Local Contacts");
  assert.ok(catalog.includes('id: "local-contacts", label: "LOCAL CONTACTS", route: "./contacts.html"'), "the offline app is in the SITE-K catalog");
  assert.match(packer, /\ncontacts\.html\n/, "the contacts page is packaged in SITE-K XDC");
  assert.ok(packer.includes("cp -R css js"), "local contacts modules are included in the SITE-K module tree");
  const offlineAssets = ["contacts.html", "css/local-contacts.css", "js/local-contacts-core.js", "js/local-contacts-app.js", "docs/historical-contact-directory-source-review-2026-11-03.md", "docs/convention-suppliers-transit-2017-2020.md"];
  for (const asset of offlineAssets) assert.ok(worker.includes(`"./${asset}"`), `${asset} is precached for offline use`);
  const archive = unzipSync(readFileSync(new URL("../sitek.xdc", import.meta.url)));
  for (const asset of offlineAssets) assert.ok(archive[asset], `${asset} is present in the built SITE-K XDC`);
  assert.equal(Buffer.from(archive["contacts.html"]).toString("utf8"), page, "the packaged page matches the current source");
  assert.match(app, /indexedDB\.open\(DB_NAME, DB_VERSION\)/, "contact records use a browser-local database");
  assert.match(core, /ZIP\/postal codes deliberately remain text/, "postal codes are preserved, not presented as validated");
  assert.match(page, /NO CONTACTS ARE SHIPPED WITH THIS APP/);
  assert.doesNotMatch(app, /fetch\s*\(/, "the local app does not call remote data APIs");
});

test("all standalone app modes share one shell visibility rule", () => {
  const app = text("js/app.js");
  const appCss = text("css/app.css");
  const wmCss = text("css/wm.css");
  const worker = text("sw.js");
  assert.match(app, /dataset\.shellView = isSitekFrameMode\(mode\) \? "frame" : "map"/);
  assert.match(appCss, /body\[data-shell-view="frame"\] #keyframe \{ display: block; \}/);
  assert.match(wmCss, /body\[data-shell-view="frame"\] \.wm-desk/);
  assert.match(app, /syncSitekDockLink\(a, mode\)/);
  assert.match(worker, /"\.\/wasm\/ghidra\/ghidra_decompiler\.wasm"/);
  assert.match(worker, /CACHE_PREFIX\}v42/);
});
