import test from "node:test";
import assert from "node:assert/strict";

import {
  META, LAYERS, BORDERS, SAN_JUAN_RIVER, GAZETTEER, SITES,
  TERRAIN_POINTS, VIEWS, CREDITS,
} from "../js/four-corners-data.js";

const inBbox = (lon, lat) =>
  lon >= META.bbox.lon0 && lon <= META.bbox.lon1 && lat >= META.bbox.lat0 && lat <= META.bbox.lat1;

test("quadripoint sits inside the theater bbox and matches the surveyed values", () => {
  assert.ok(inBbox(META.quadripoint.lon, META.quadripoint.lat));
  assert.ok(Math.abs(META.quadripoint.lat - 36.998976) < 1e-6);
  assert.ok(Math.abs(META.quadripoint.lon - -109.045172) < 1e-6);
  assert.equal(BORDERS.quadLat, META.quadripoint.lat);
  assert.equal(BORDERS.quadLon, META.quadripoint.lon);
});

test("exactly four states, one per quadrant", () => {
  assert.equal(BORDERS.states.length, 4);
  const quads = new Set(
    BORDERS.states.map((s) => `${s.labelAt.lon < BORDERS.quadLon ? "W" : "E"}${s.labelAt.lat < BORDERS.quadLat ? "S" : "N"}`),
  );
  assert.equal(quads.size, 4);
});

test("every site lands in the bbox, in a real layer, with a real tier", () => {
  const layerIds = new Set(LAYERS.map((l) => l.id));
  const tiers = new Set(["official", "community", "context"]);
  const ids = new Set();
  for (const s of SITES) {
    assert.ok(inBbox(s.lon, s.lat), `${s.id} out of bbox`);
    assert.ok(layerIds.has(s.layer), `${s.id} has unknown layer ${s.layer}`);
    assert.ok(tiers.has(s.tier), `${s.id} has unknown tier ${s.tier}`);
    assert.ok(!ids.has(s.id), `duplicate site id ${s.id}`);
    ids.add(s.id);
    assert.ok(Array.isArray(s.story) && s.story.length > 0, `${s.id} needs a story`);
    for (const [, url] of s.sources || []) assert.match(url, /^https:\/\//, `${s.id} source not https`);
  }
});

test("gazetteer rows are well-formed ADL GCS triples with no invented ids", () => {
  const fttRoots = new Set(["phys", "hydro", "manmade", "pop", "admin"]);
  for (const row of GAZETTEER) {
    const [name, fclass, ftt, state, lat, lon] = row;
    assert.equal(typeof name, "string");
    assert.equal(typeof fclass, "string");
    assert.ok(fttRoots.has(ftt.split(".")[0]), `${name}: odd FTT ${ftt}`);
    assert.ok(typeof state === "string" && state.length >= 2);
    assert.ok(inBbox(lon, lat), `${name} out of bbox`);
    assert.equal(row.length, 8, `${name}: row must be the 8-column seed shape (no FEATURE_ID column to invent)`);
  }
});

test("terrain control points cover all four quadrants with sane elevations", () => {
  const quads = new Set();
  for (const [lon, lat, elev] of TERRAIN_POINTS) {
    assert.ok(inBbox(lon, lat));
    assert.ok(elev > 1100 && elev < 3600, `odd elevation ${elev}`);
    quads.add(`${lon < BORDERS.quadLon ? "W" : "E"}${lat < BORDERS.quadLat ? "S" : "N"}`);
  }
  assert.equal(quads.size, 4);
});

test("views target points inside the bbox", () => {
  assert.ok(VIEWS.length >= 5);
  for (const v of VIEWS) assert.ok(inBbox(v.target[0], v.target[1]), `${v.id} target out of bbox`);
});

test("san juan river corridor flows roughly west and stays in bbox", () => {
  for (const [lon, lat] of SAN_JUAN_RIVER) assert.ok(inBbox(lon, lat));
  assert.ok(SAN_JUAN_RIVER[0][0] > SAN_JUAN_RIVER[SAN_JUAN_RIVER.length - 1][0], "downstream should be west");
});

test("uranium and energy layers carry the headline records", () => {
  const byId = new Map(SITES.map((s) => [s.id, s]));
  assert.equal(byId.get("fcpp").tier, "official");
  assert.equal(byId.get("white-mesa-mill").tier, "official");
  assert.ok(byId.get("umtra-shiprock").sources.some(([, u]) => u.includes("energy.gov")));
  assert.ok(CREDITS.length >= 3);
});
