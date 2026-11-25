import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { sync4dwmWindowAssets } from "../scripts/build-4dwm-window-assets.mjs";

const root = path.resolve(import.meta.dirname, "..");
const appSlugs = [
  "dalton-race-4dwm",
  "esgvrop-4dwm",
  "glendora-high-4dwm",
  "greeran-subsurface",
  "sanborn-restaurant-4dwm",
];
const manager = readFileSync(path.join(root, "public/apps/_shared/4dwm-window-manager.js"), "utf8");

function appFile(slug, file) {
  return readFileSync(path.join(root, "public/apps", slug, file), "utf8");
}

test("the 4DWM window manager is synchronized once per isolated app origin", () => {
  assert.deepEqual(sync4dwmWindowAssets({ checkOnly: true }), appSlugs);
  for (const slug of appSlugs) {
    const html = appFile(slug, "index.html");
    assert.equal((html.match(/4dwm-window-manager\.js/g) ?? []).length, 1, `${slug} should import one manager`);
    assert.match(html, /src=["']\.\/js\/4dwm-window-manager\.js["']/);
    assert.equal(appFile(slug, "js/4dwm-window-manager.js"), manager, `${slug} manager copy drifted`);
    assert.doesNotMatch(html, /src=["']\.\/"js\//, `${slug} has a malformed module URL`);
  }
});

test("the shared manager binds one pointer handler, raises windows, and supports collapse/restore", () => {
  assert.match(manager, /dataset\.fourDwmDragBound === "true"/);
  assert.equal((manager.match(/element\.addEventListener\("pointerdown"/g) ?? []).length, 1);
  assert.doesNotMatch(manager, /handle\.addEventListener\("pointerdown"/);
  assert.match(manager, /raise\(element\)/);
  assert.match(manager, /pointercancel/);
  assert.match(manager, /data-min/);
  assert.match(manager, /classList\.toggle\("min"\)/);
  assert.match(manager, /aria-expanded/);
  assert.match(manager, /cursor: grab/);
});

test("Dalton Race and Sanborn panels are draggable/collapsible without replacing their content", () => {
  for (const slug of ["dalton-race-4dwm", "sanborn-restaurant-4dwm"]) {
    const html = appFile(slug, "index.html");
    assert.ok((html.match(/data-4dwm-window\b/g) ?? []).length >= 2, `${slug} needs two floating panels`);
    assert.match(html, /data-window-title=/);
  }
  const daltonCss = appFile("dalton-race-4dwm", "css/dalton-race-4dwm.css");
  const sanbornHtml = appFile("sanborn-restaurant-4dwm", "index.html");
  assert.match(daltonCss, /\.panel\.four-dwm-window/);
  assert.match(sanbornHtml, /\.workspace\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/s);
  assert.match(sanbornHtml, /\.sidebar,\.inspector\s*\{[^}]*position:fixed/s);
});
