import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BBOX, LAYERS, NODES } from "../js/socal-subsurface-data.js";
import { GAZETTEER_META, SOCAL_GAZETTEER } from "../js/socal-gazetteer-data.js";

assert.equal(SOCAL_GAZETTEER.length, 78, "curated GNIS register size changed; update docs/test intentionally");
assert.equal(new Set(SOCAL_GAZETTEER.map((r) => r.id)).size, SOCAL_GAZETTEER.length, "GNIS IDs must be unique");
assert.ok(LAYERS.some((layer) => layer.id === "gazetteer"), "gazetteer layer is registered");
assert.equal(NODES.filter((node) => node.layer === "gazetteer").length, SOCAL_GAZETTEER.length);
assert.match(GAZETTEER_META.service, /^https:\/\/carto\.nationalmap\.gov\//);

for (const record of SOCAL_GAZETTEER) {
  assert.ok(record.name && record.featureClass && record.county, `incomplete record: ${record.id}`);
  assert.ok(record.lon >= BBOX.lon0 && record.lon <= BBOX.lon1, `${record.name} longitude outside theater`);
  assert.ok(record.lat >= BBOX.lat0 && record.lat <= BBOX.lat1, `${record.name} latitude outside theater`);
  assert.equal(record.tier, "official");
  assert.equal(record.kind, "gazetteer");
}

const html = await readFile(new URL("../socal-subsurface.html", import.meta.url), "utf8");
const app = await readFile(new URL("../js/socal-subsurface.js", import.meta.url), "utf8");
const build = await readFile(new URL("../scripts/build-socal-subsurface-xdc.mjs", import.meta.url), "utf8");
assert.match(html, /id="searchBox"/);
assert.match(app, /USGS GNIS/);
assert.match(build, /socal-gazetteer-data\.js/);

console.log(`ok — ${SOCAL_GAZETTEER.length} embedded USGS Gazetteer controls`);
