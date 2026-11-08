import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { unzipSync } from "../vendor/fflate/index.mjs";
import { lightIntensity, parseSanbornManifest } from "../js/sanborn-restaurant-manifest.js";

const source = readFileSync("sanborn-restaurant.wrl", "utf8");
const html = readFileSync("sanborn-restaurant-4dwm.html", "utf8");

test("Sanborn XDC comment prefix is normalized and the source manifest produces scene objects", () => {
  const minimal = parseSanbornManifest("# XDC_BOX demo 0 1 0 2 2 2 #aabbcc display none Demo box\n# VRML note");
  assert.equal(minimal.length, 1, "the XDC_ marker must not be mistaken for the geometry kind");
  assert.equal(minimal[0].kind, "BOX");
  assert.equal(minimal[0].id, "demo");
  assert.deepEqual(minimal[0].pos, [0, 1, 0]);

  const rows = parseSanbornManifest(source);
  assert.ok(rows.length > 50, `expected a substantive scene manifest, got ${rows.length} rows`);
  assert.ok(rows.some((row) => row.kind === "BOX" && row.id === "cashier-base"));
  assert.equal(rows.filter((row) => row.kind === "POINTLIGHT").length, 3);
  const lights = rows.filter((row) => row.kind === "POINTLIGHT");
  assert.deepEqual(lights.map((row) => row.id), ["service-glow", "kitchen-glow", "bar-glow"]);
  assert.ok(lights.every((row) => row.intensity > 0 && row.distance > 0 && row.layer === "livelight"));
  assert.equal(lightIntensity(lights[0], true), 2.3);
  assert.equal(lightIntensity(lights[0], false), 0);
  assert.equal(lightIntensity({ intensity: Number.NaN }, true), 0);
});

test("Sanborn viewer reflects live-light state and explains the VRML/XDC rendering boundary", () => {
  assert.match(html, /parseSanbornManifest\(sourceText\)/);
  assert.match(html, /setLight\(liveLight,false\)/);
  assert.match(html, /class="tool active" id="light-btn"/);
  assert.match(html, /data-layer="livelight" checked/);
  assert.match(html, /not a full parser/i);
  assert.match(html, /not a general VRML97 parser/i);
  assert.match(html, /new THREE\.WebGLRenderer[\s\S]{0,300}catch\(error\)/);
  assert.match(html, /TOP-DOWN XDC PREVIEW/);
  assert.match(html, /WebGL could not start; showing a top-down XDC preview/);
});

test("Sanborn Webxdc and offline app include the local parser dependency", () => {
  assert.ok(existsSync("public/apps/sanborn-restaurant-4dwm/js/sanborn-restaurant-manifest.js"),
    "run npm run build:4dwm or node scripts/build-sanborn-restaurant-xdc.mjs");
  const appParser = readFileSync("public/apps/sanborn-restaurant-4dwm/js/sanborn-restaurant-manifest.js", "utf8");
  assert.equal(appParser, readFileSync("js/sanborn-restaurant-manifest.js", "utf8"));
  assert.equal(readFileSync("public/apps/sanborn-restaurant-4dwm/index.html", "utf8"), html);
  const archive = unzipSync(new Uint8Array(readFileSync("sanborn-restaurant-4dwm.xdc")));
  assert.ok(archive["js/sanborn-restaurant-manifest.js"]);
  assert.equal(new TextDecoder().decode(archive["js/sanborn-restaurant-manifest.js"]), appParser);
});
