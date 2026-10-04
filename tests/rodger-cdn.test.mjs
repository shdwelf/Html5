// The Rodger Ramrod HTML5 apps load the js-dos v6 runtime from a CDN at boot.
// The original build pointed at js-dos.com/6.22/current/, which is dead (the
// domain stopped serving /6.22/ assets; the css path never existed at all —
// zero archived 200s).  These checks pin the apps to the jsDelivr mirror of
// the js-dos@6.22.60 npm package and keep the optional stylesheet load
// non-fatal.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apps = [
  "apps/rodger-ramrod.html",
  "apps/Rodger_Ramrod_HTML5_Quine.html",
];

test("Rodger Ramrod apps reference a live pinned js-dos CDN, not js-dos.com", () => {
  for (const app of apps) {
    const html = readFileSync(path.join(root, app), "utf8");

    assert.ok(!html.includes("js-dos.com"), `${app} still references the dead js-dos.com CDN`);

    // Pinned, immutable version on jsDelivr — the npm dist directory is the
    // same layout js-dos.com/6.22/current/ used to mirror, so the engine's
    // own relative fetches (wdosbox.wasm.js etc.) resolve as before.
    assert.match(
      html,
      /https:\/\/cdn\.jsdelivr\.net\/npm\/js-dos@6\.22\.60\/dist\/js-dos\.js/,
      `${app} lost the pinned js-dos.js URL`,
    );
    assert.match(
      html,
      /https:\/\/cdn\.jsdelivr\.net\/npm\/js-dos@6\.22\.60\/dist\/wdosbox\.js/,
      `${app} lost the pinned wdosbox.js URL`,
    );
  }
});

test("Rodger Ramrod stylesheet load is optional", () => {
  // js-dos 6.22 injects its own styles from js-dos.js; the standalone
  // js-dos.css has never existed on any CDN. The boot Promise.all used to
  // reject on that 404 and kill the launch before DOSBox even started.
  for (const app of apps) {
    const html = readFileSync(path.join(root, app), "utf8");
    const loaders = [...html.matchAll(/Promise\.all\(\[[^[\]]*\.catch\(\(\)=>\{\}\)[^[\]]*\]\)/g)];
    assert.ok(
      loaders.length >= 1,
      `${app}: the css loader inside Promise.all is not wrapped in .catch(()=>{})`,
    );
  }
});
