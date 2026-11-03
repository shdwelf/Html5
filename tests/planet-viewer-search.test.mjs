import test from "node:test";
import assert from "node:assert/strict";

import { buildPlates, PLATE_ORDER } from "../js/planet-viewer-data.js";
import { locateGazetteerPoint } from "../js/planet-viewer-search.js";
import { GAZ_ROWS as atlantaRows } from "../js/city-gazetteer-data-atlanta.js";
import { GAZ_ROWS as lawrenceRows } from "../js/city-gazetteer-data-lawrence.js";

test("Gazetteer search routes an in-plate point to its terrain plate", () => {
  const plates = buildPlates(64, 48);
  const lawrence = lawrenceRows.find((row) => row[0] === "Lawrence");
  assert.ok(lawrence, "the packed Lawrence Gazetteer point exists");
  const result = locateGazetteerPoint(plates, PLATE_ORDER, { lat: lawrence[4], lon: lawrence[5] });
  assert.deepEqual(result, { kind: "terrain", plateId: "lawrence" });
});

test("a valid point outside the DEM plates falls back to the globe", () => {
  const plates = buildPlates(64, 48);
  const atlanta = atlantaRows.find((row) => row[0] === "Atlanta");
  assert.ok(atlanta, "the packed Atlanta reference point exists");
  assert.deepEqual(
    locateGazetteerPoint(plates, PLATE_ORDER, { lat: atlanta[4], lon: atlanta[5] }),
    { kind: "globe", lat: atlanta[4], lon: atlanta[5] },
  );
});

test("invalid coordinates are refused instead of being centered at zero", () => {
  const plates = buildPlates(32, 24);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, { lat: NaN, lon: -95 }), null);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, { lat: 38, lon: Infinity }), null);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, null), null);
});
