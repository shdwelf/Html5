import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.match(worker, /CACHE_PREFIX\}v39/);
});
