import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const canonical = readFileSync(path.join(root, "sanborn-codex.html"), "utf8");
const publicCodex = readFileSync(path.join(root, "public/apps/sanborn-codex/index.html"), "utf8");
const restaurant = readFileSync(path.join(root, "public/apps/sanborn-restaurant-4dwm/index.html"), "utf8");
const suite = readFileSync(path.join(root, "public/apps/sanborn-suite/index.html"), "utf8");
const codexArchive = unzipSync(readFileSync(path.join(root, "sanborn-codex.xdc")));

function suiteCodex() {
  const match = suite.match(/<script type="application\/x-sanborn-payload" id="payload-codex">([A-Za-z0-9+/=]+)<\/script>/);
  assert.ok(match, "Sanborn Suite codex payload is missing");
  return Buffer.from(match[1], "base64").toString("utf8");
}

function matchingLightBlocks(html) {
  return [...html.matchAll(/w\.jsx\("hemisphereLight",\{args:\[([st])==="blueprint"\?"#38bdf8":"#aacbc7",\1==="blueprint"\?"#030712":"#071014",1\.5\]\}\),w\.jsx\("directionalLight",\{position:\[-10,18,12\],intensity:2\.2,color:\1==="blueprint"\?"#38bdf8":"#d3e0d5"/g)];
}

test("Codex uses Sanborn Restaurant's hemisphere/directional lighting in both scene variants", () => {
  assert.match(restaurant, /new THREE\.HemisphereLight\("#aacbc7","#071014",1\.5\)/);
  assert.match(restaurant, /new THREE\.DirectionalLight\("#d3e0d5",2\.2\)/);
  assert.match(restaurant, /sun\.position\.set\(-10,18,12\)/);
  for (const html of [canonical, publicCodex, suiteCodex()]) {
    assert.equal(matchingLightBlocks(html).length, 2, "both Codex scene variants should use the calibrated setup");
    assert.doesNotMatch(html, /w\.jsx\("ambientLight",\{intensity:[st]==="blueprint"\?\.6:\.4\}\)/);
  }
  assert.equal(publicCodex, canonical, "the public app must mirror the canonical single-file source");
  assert.equal(new TextDecoder().decode(codexArchive["index.html"]), canonical, "the XDC must package the same source");
});
