import test from "node:test";
import assert from "node:assert/strict";

import { buildPlates, PLATE_ORDER } from "../js/planet-viewer-data.js";
import { locateGazetteerPoint } from "../js/planet-viewer-search.js";
import { makeGazetteerIndex, searchName } from "../js/city-gazetteer.js";
import { GAZ_ROWS as atlantaRows } from "../js/city-gazetteer-data-atlanta.js";
import { GAZ_ROWS as lawrenceRows } from "../js/city-gazetteer-data-lawrence.js";
import { GAZ_ROWS as polynesiaRows } from "../js/city-gazetteer-data-polynesia.js";
import { PLANET_GAZ_ROWS } from "../js/planet-viewer-gazetteer.js";

test("Gazetteer search routes an in-plate point to its terrain plate", () => {
  const plates = buildPlates(64, 48);
  const lawrence = lawrenceRows.find((row) => row[0] === "Lawrence");
  assert.ok(lawrence, "the packed Lawrence Gazetteer point exists");
  const result = locateGazetteerPoint(plates, PLATE_ORDER, { lat: lawrence[4], lon: lawrence[5] });
  assert.deepEqual(result, { kind: "terrain", plateId: "lawrence" });
});

test("Cheyenne, SoCal, and Lawrence Gazetteer entries route to their local terrain plates", () => {
  const plates = buildPlates(64, 48);
  const idx = makeGazetteerIndex(PLANET_GAZ_ROWS);
  const expected = new Map([["Pikes Peak", "chey"], ["Mount Wilson", "ange"], ["Lawrence", "lawrence"]]);
  for (const [name, plateId] of expected) {
    const entry = searchName(idx, name, { limit: 10 }).find((hit) => hit.name === name);
    assert.ok(entry, `missing local Gazetteer entry ${name}`);
    assert.deepEqual(
      locateGazetteerPoint(plates, PLATE_ORDER, { lat: entry.lat, lon: entry.lon }),
      { kind: "terrain", plateId },
      `${name} should focus its matching terrain plate`,
    );
  }
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

test("name-only Bora Bora entry is searchable but has no map destination", () => {
  const plates = buildPlates(32, 24);
  const boraBora = polynesiaRows.find((row) => row[0] === "Bora Bora");
  assert.ok(boraBora);
  assert.deepEqual([boraBora[4], boraBora[5]], [null, null]);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, { lat: boraBora[4], lon: boraBora[5] }), null);
});

test("invalid coordinates are refused instead of being centered at zero", () => {
  const plates = buildPlates(32, 24);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, { lat: NaN, lon: -95 }), null);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, { lat: 38, lon: Infinity }), null);
  assert.equal(locateGazetteerPoint(plates, PLATE_ORDER, null), null);
});
