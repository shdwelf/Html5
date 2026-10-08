import test from "node:test";
import assert from "node:assert/strict";
import { DEM_GRID, DEM_META } from "../js/lawrence-dem-data.js";
import { BBOX, elevationAt, frameSizeKm, insideFrame, lonLatFromXZ, project } from "../js/lawrence-geo.js";
import { GAZ_META, GAZ_ROWS } from "../js/lawrence-gazetteer-data.js";
import { makeGazetteerIndex, searchBox, searchName } from "../js/socal-gazetteer.js";

test("Lawrence offline 3DEP control grid is finite, correctly ordered, and source-disclosed", () => {
  assert.equal(DEM_GRID.nx, 8);
  assert.equal(DEM_GRID.ny, 8);
  assert.equal(DEM_GRID.data.length, 64);
  assert.match(DEM_META.source, /USGS 3DEP/);
  assert.match(DEM_META.disclosure, /not a 1 m raster/);
  assert.match(DEM_META.verticalDatum, /NAVD 88/);
  assert.ok(DEM_GRID.data.every((value) => Number.isFinite(value) && value > 200 && value < 400));

  // The north-west and south-east nodes pin the stated north-to-south row order.
  assert.equal(elevationAt(DEM_GRID.lon0, DEM_GRID.lat1), DEM_GRID.data[0]);
  assert.equal(elevationAt(DEM_GRID.lon1, DEM_GRID.lat0), DEM_GRID.data.at(-1));
  assert.equal(elevationAt(BBOX.lon0 - 0.01, 38.95), null);
});

test("Lawrence scene projection round-trips and its frame has plausible scale", () => {
  const lon = -95.235257697033887;
  const lat = 38.971675824003874;
  const [x, , z] = project(lon, lat, 1.25);
  const [roundLon, roundLat] = lonLatFromXZ(x, z);
  assert.ok(Math.abs(roundLon - lon) < 1e-10);
  assert.ok(Math.abs(roundLat - lat) < 1e-10);
  assert.ok(insideFrame(lon, lat));

  const size = frameSizeKm();
  assert.ok(size.width > 10 && size.width < 16);
  assert.ok(size.height > 16 && size.height < 19);
});

test("Lawrence GNIS seed rows have verified IDs and search through the shared Gazetteer engine", () => {
  assert.equal(GAZ_META.rowCount, GAZ_ROWS.length);
  assert.equal(GAZ_META.verified, GAZ_ROWS.length);
  assert.equal(GAZ_META.unverified, 0);
  assert.ok(GAZ_ROWS.every((row) => row[7] !== null && row[8] === 1));
  assert.ok(GAZ_ROWS.every((row) => insideFrame(row[5], row[4])));
  assert.equal(new Set(GAZ_ROWS.map((row) => row[7])).size, GAZ_ROWS.length);

  const index = makeGazetteerIndex(GAZ_ROWS);
  assert.equal(searchName(index, "Wakarusa river", { limit: 5 })[0]?.gnis, "482756");
  const central = searchBox(index, { lon0: -95.26, lon1: -95.23, lat0: 38.95, lat1: 38.98 });
  assert.ok(central.some((entry) => entry.name === "Potter Lake"));
});
