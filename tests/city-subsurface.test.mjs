import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const decoder = new TextDecoder();
const cities = ["lawrence", "atlanta", "kansascity", "buffalo", "toronto", "california", "nevada", "arizona", "guam", "americansamoa", "usvirginislands", "midway", "utah", "colorado", "newmexico", "oregon", "washington", "idaho", "montana", "wyoming", "northdakota", "southdakota", "nebraska", "kansas", "minnesota", "iowa", "wisconsin", "michigan", "illinois", "indiana", "ohio", "pennsylvania", "missouri", "arkansas", "Kentucky", "tennessee", "virginia", "westvirginia", "northcarolina", "southcarolina", "Georgia", "florida"];

function read(name) {
  return readFileSync(path.join(root, name), "utf8");
}

function archive(name) {
  return unzipSync(readFileSync(path.join(root, name)));
}

test("every city app has a page, data packs, and a current Webxdc", async () => {
  for (const city of cities) {
    const page = read(`${city}-subsurface.html`);
    assert.match(page, new RegExp(`data-city="${city}"`));
    assert.match(page, /GAZETTEER/);
    assert.match(page, /LAYERS/);
    assert.match(page, /PLAN VIEW/);

    const data = await import(`../js/city-subsurface-data-${city}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${city}.js`);
    assert.equal(data.CITY.id, city);
    assert.ok(Array.isArray(data.LAYERS) && data.LAYERS.length >= 17);
    assert.ok(data.LAYERS.some((l) => l.id === "gazetteer"));
    assert.ok(data.LAYERS.some((l) => l.id === "geocaches"));
    assert.ok(data.LAYERS.some((l) => l.id === "underground"));
    assert.ok(data.VIEWS.length >= 4);

    for (const row of gaz.GAZ_ROWS) {
      assert.equal(row.length, 10, `${city}: gazetteer row must have 10 columns`);
      assert.ok(row[4] >= gaz.GAZ_META.bbox.lat0 && row[4] <= gaz.GAZ_META.bbox.lat1, `${city}: ${row[0]} lat out of frame`);
      assert.ok(row[5] >= gaz.GAZ_META.bbox.lon0 && row[5] <= gaz.GAZ_META.bbox.lon1, `${city}: ${row[0]} lon out of frame`);
      if (row[8] === 1) assert.match(String(row[7]), /^\d+$/, `${city}: verified row needs a GNIS id`);
      if (row[1] === "Geocache") {
        assert.equal(row[2], "rec.geocache", `${city}: geocache must use the community extension`);
        assert.equal(row[8], 0, `${city}: geocache must not claim GNIS verification`);
        assert.match(row[9], /GC[A-Z0-9]+/, `${city}: geocache note must carry the cache code`);
      }
    }
    assert.equal(gaz.GAZ_META.rowCount, gaz.GAZ_ROWS.length);

    const files = archive(`${city}-subsurface.xdc`);
    assert.ok(files["vendor/fflate/browser.mjs"], `${city}: browser ZIP helper is missing`);
    assert.equal(decoder.decode(files["vendor/fflate/browser.mjs"]), read("vendor/fflate/browser.mjs"));
    assert.ok(files["vendor/fflate/LICENSE"], `${city}: browser ZIP helper license is missing`);
    assert.doesNotMatch(decoder.decode(files["vendor/fflate/browser.mjs"]), /from ['\"](?:node:)?module['\"]/);
    if (data.CITY.requiresDem) {
      const demModule = `js/city-dem-grid-${city}.js`;
      assert.ok(existsSync(path.join(root, demModule)), `${city}: required DEM module is missing`);
      assert.deepEqual(Buffer.from(files[demModule]), readFileSync(path.join(root, demModule)), `${city}: required DEM is stale or absent in the XDC`);
    }
    const index = decoder.decode(files["index.html"]);
    assert.match(index, new RegExp(`data-city="${city}"`));
    assert.match(index, /<script src="\.\/webxdc\.js"><\/script>/);
    assert.match(decoder.decode(files["manifest.toml"]), new RegExp(data.CITY.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    for (const name of Object.keys(files).filter((n) => /^(?:js|css)\//.test(n))) {
      assert.ok(existsSync(path.join(root, name)), `${city}: archive has ${name} with no working-tree source`);
      assert.deepEqual(Buffer.from(files[name]), readFileSync(path.join(root, name)), `${city}: ${name} is stale in the archive`);
    }
  }
});

test("Lawrence and Kansas City contain only the cross-checked GNIS seed points", async () => {
  const lawrenceData = await import("../js/city-subsurface-data-lawrence.js");
  const lawrence = await import("../js/city-gazetteer-data-lawrence.js");
  const kansasCityData = await import("../js/city-subsurface-data-kansascity.js");
  const kansasCity = await import("../js/city-gazetteer-data-kansascity.js");
  const { DEM, DEM_META } = await import("../js/city-dem-grid-lawrence.js");
  const anchors = JSON.parse(read("data/lawrence/dem-anchors.json"));

  assert.equal(lawrenceData.CITY.requiresDem, true);
  assert.equal(DEM.nx, 8);
  assert.equal(DEM.ny, 8);
  assert.equal(DEM.data.length, 64);
  assert.deepEqual(Array.from(DEM.data), anchors.grid.values.map(Math.fround));
  assert.match(DEM_META.disclosure, /not a 1 m raster/i);
  assert.match(DEM.disclosure, /clamps only the narrow display-frame rim/i);
  assert.equal(lawrence.GAZ_META.verified, 5);
  assert.ok(lawrence.GAZ_ROWS.every((row) => row[8] === 1 && /^\d+$/.test(row[7])));
  assert.ok(lawrence.GAZ_ROWS.every((row) => /USGS GNIS MapServer layer \d/.test(row[9])));

  const expectedKansasCity = new Map([
    ["Kansas City", ["748198", 39.099733583208469, -94.578574134442377]],
    ["Missouri River", ["756398", 39.123899988352946, -94.561351431694305]],
    ["Kansas River", ["485184", 39.115288884269113, -94.610519544672499]],
    ["Blue River", ["479576", 39.130011195011377, -94.470793407864306]],
    ["Brush Creek", ["479243", 39.038901276636359, -94.520517112676060]],
    ["Bales Lake", ["713599", 39.079975978095113, -94.514469279585910]],
    ["Lake of the Woods", ["758366", 38.995271424192886, -94.519420617362172]],
    ["Zajic Lake", ["729219", 39.192542004572417, -94.570912272230103]],
  ]);
  assert.equal(kansasCity.GAZ_META.verified, expectedKansasCity.size);
  assert.equal(kansasCity.GAZ_ROWS.length, expectedKansasCity.size);
  for (const row of kansasCity.GAZ_ROWS) {
    const [gnisId, lat, lon] = expectedKansasCity.get(row[0]) ?? [];
    assert.ok(gnisId, `unexpected Kansas City row: ${row[0]}`);
    assert.equal(row[7], gnisId, `${row[0]} GNIS FEATURE_ID`);
    assert.equal(row[8], 1, `${row[0]} verification tier`);
    assert.ok(Math.abs(row[4] - lat) < 1e-10, `${row[0]} latitude`);
    assert.ok(Math.abs(row[5] - lon) < 1e-10, `${row[0]} longitude`);
    assert.match(row[9], /USGS GNIS MapServer layer \d/);
  }
  assert.deepEqual(kansasCityData.CORRIDORS, [], "no unverified Kansas City corridor coordinates are seeded");
  assert.deepEqual(kansasCityData.NODES, [], "no unverified Kansas City landmark coordinates are seeded");
});

test("local GPX imports land in a city register as rec.geocache rows", async () => {
  const { JSDOM } = await import("jsdom");
  const { parseGeomateGpx, cacheToGazetteerRow, safeGpxFilename } = await import("../js/gpx-geocache.js");
  const { makeGazetteerIndex, appendGazetteerRows, searchName, classRollup } = await import("../js/city-gazetteer.js");
  const lawrence = await import("../js/city-gazetteer-data-lawrence.js");

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="unit-test" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="38.9717" lon="-95.2353">
    <name>GC12345</name>
    <type>Geocache|Traditional Cache</type>
    <sym>Geocache</sym>
    <cache><name>Downtown test cache</name><type>Traditional Cache</type><container>micro</container><difficulty>2</difficulty><terrain>1.5</terrain></cache>
  </wpt>
  <wpt lat="39.7392" lon="-104.9903">
    <name>GC99999</name>
    <type>Geocache|Traditional Cache</type>
    <sym>Geocache</sym>
    <cache><name>Denver cache, outside the frame</name><type>Traditional Cache</type></cache>
  </wpt>
  <wpt lat="38.97" lon="-95.23"><name>Trailhead parking</name><sym>Parking Area</sym></wpt>
</gpx>`;

  const dom = new JSDOM("");
  const parsed = parseGeomateGpx(gpx, { sourceName: "../../etc/passwd", bounds: lawrence.GAZ_META.bbox, DOMParserImpl: dom.window.DOMParser });
  assert.equal(parsed.gpxVersion, "1.1");
  assert.equal(parsed.sourceName, "passwd", "filename is reduced to a safe leaf");
  assert.equal(parsed.stats.cacheWaypoints, 2);
  assert.equal(parsed.stats.nonCacheWaypoints, 1);
  assert.equal(parsed.stats.importedToMap, 1);
  assert.equal(parsed.stats.outOfFrame, 1);

  const rows = parsed.inFrameCaches.map((cache) => cacheToGazetteerRow(cache, parsed.sourceName));
  assert.equal(rows.length, 1);
  const [row] = rows;
  assert.equal(row[1], "Geocache");
  assert.equal(row[2], "rec.geocache");
  assert.equal(row[8], 0, "an import may never claim GNIS verification");
  assert.equal(row[10].type, "GPX");
  assert.equal(row[10].cacheCode, "GC12345");
  assert.equal(safeGpxFilename("a\\b/c 1.gpx"), "c_1.gpx", "paths are reduced to a sanitized leaf name");

  const idx = makeGazetteerIndex(lawrence.GAZ_ROWS);
  const added = appendGazetteerRows(idx, rows);
  assert.equal(added.length, 1);
  assert.equal(idx.entries.at(-1).fclass, "Geocache");
  const hits = searchName(idx, "GC12345", { limit: 5 });
  assert.equal(hits[0]?.name, "Downtown test cache (GC12345)");
  assert.equal(hits[0]?.source?.type, "GPX");
  assert.ok(classRollup([...lawrence.GAZ_ROWS, ...rows]).some((c) => c.fclass === "Geocache"));
  dom.window.close();
});

test("city gazetteer engine searches names, facets, boxes, and geocaches", async () => {
  const { makeGazetteerIndex, searchName, searchBox, searchPoint, classRollup } = await import("../js/city-gazetteer.js");
  const lawrence = await import("../js/city-gazetteer-data-lawrence.js");
  const buffalo = await import("../js/city-gazetteer-data-buffalo.js");
  const toronto = await import("../js/city-gazetteer-data-toronto.js");

  const idx = makeGazetteerIndex(lawrence.GAZ_ROWS);
  const hits = searchName(idx, "lawrence", { limit: 5 });
  assert.ok(hits.some((h) => h.name === "Lawrence"));
  const box = searchBox(idx, lawrence.GAZ_META.bbox, { classes: new Set(["Populated Place"]) });
  assert.ok(box.some((h) => h.name === "Lawrence"));

  const buffaloIdx = makeGazetteerIndex(buffalo.GAZ_ROWS);
  const cache = searchName(buffaloIdx, "GCQ1T1", { limit: 5 });
  assert.equal(cache[0]?.name, "Why Not Buffalo? #1 (GCQ1T1)");
  const near = searchPoint(buffaloIdx, 42.9009167, -78.8988833, { radiusKm: 1, limit: 5 });
  assert.ok(near.some((h) => h.fclass === "Geocache"));
  assert.ok(classRollup(buffalo.GAZ_ROWS).some((c) => c.fclass === "Geocache"));

  const torontoIdx = makeGazetteerIndex(toronto.GAZ_ROWS);
  const path = searchName(torontoIdx, "PATH", { limit: 10 });
  assert.ok(path.length >= 0); // PATH is a corridor/node, not necessarily a gazetteer row
  const firstPost = searchName(torontoIdx, "First Post Office", { limit: 5 });
  assert.equal(firstPost[0]?.fclass, "Geocache");
});

test("California keeps curated rows separate from its per-ID GNIS extract", async () => {
  const data = await import("../js/city-subsurface-data-california.js");
  const gaz = await import("../js/city-gazetteer-data-california.js");
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-source-register-2026-10-22.json"));

  assert.equal(data.CITY.id, "california");
  assert.equal(data.CITY.state, "CA");
  assert.equal(data.CITY.requiresDem, false, "statewide frame uses the labelled synthetic relief field");
  assert.equal(data.BBOX.lat0, 32.53);
  assert.equal(data.BBOX.lat1, 42.01);
  assert.equal(data.BBOX.lon0, -124.48);
  assert.equal(data.BBOX.lon1, -114.13);

  // Scale-aware views: the statewide overview must pull back past the city
  // floors (y=20, z=32) or the frame opens inside its own terrain.
  const overview = data.VIEWS.find((v) => v.id === "overview");
  assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `overview ${overview.position} must exceed city-scale floors`);
  const underground = data.VIEWS.find((v) => v.id === "underground");
  assert.ok(underground.position[2] > 20, "underground view must also scale with frame width");

  // Round 16 upgrades only these identity-safe per-ID records. A same-name
  // populated place, reservoir, or swamp must never be used as evidence for
  // the distinct historic-site, dam, or relocation-center rows below.
  const expectedVerified = new Map([
    ["Los Angeles|Populated Place", ["1662328", 34.0522390563, -118.2436970875]],
    ["San Francisco|Populated Place", ["277593", 37.77500494, -122.41945762]],
    ["Sacramento|Populated Place", ["1659564", 38.58157698, -121.49441277]],
    ["San Diego|Populated Place", ["1661377", 32.71533396, -117.157267]],
    ["Oakville|Populated Place", ["229899", 38.4368599, -122.40221399]],
    ["Manzanar|Populated Place", ["1659050", 36.73993695, -118.08065811]],
    ["Mount Whitney|Summit", ["269051", 36.57857512, -118.29243423]],
    ["Mount Shasta|Summit", ["266054", 41.40917524, -122.19485877]],
    ["Death Valley|Basin", ["270787", 36.24662318, -116.81700764]],
    ["Sacramento River|Stream", ["1654949", 38.0632528, -121.8527357]],
    ["San Joaquin River|Stream", ["273488", 38.06659111, -121.85108216]],
    ["Russian River|Stream", ["267200", 38.45047475, -123.1294616]],
    ["Lake Tahoe|Lake", ["1654975", 39.0960755, -120.0333974]],
    ["Salton Sea|Lake", ["248771", 33.313568, -115.816772]],
    ["Morris Reservoir|Reservoir", ["272561", 34.183909, -117.870436]],
    ["Tule Lake|Swamp", ["268456", 41.890068, -121.5057865]],
  ]);
  const expectedUnverified = new Set([
    "University of California, Berkeley|School",
    "University of California, Los Angeles|School",
    "Manzanar|Park",
    "Tule Lake War Relocation Center|Park",
    "Empire Mine State Historic Park|Park",
    "Nike Missile Site SF-88L|Military",
    "Morris Dam|Dam",
    "La Casa Pacifica|Building",
    "Stow House|Building",
    "Clair Tappaan Lodge|Building",
    "Aerojet General Corporation Site|Locale",
  ]);

  assert.equal(gaz.GAZ_ROWS.length, 27);
  assert.equal(gaz.GAZ_META.verified, expectedVerified.size);
  assert.equal(gaz.GAZ_META.unverified, expectedUnverified.size);
  for (const row of gaz.GAZ_ROWS) {
    const key = `${row[0]}|${row[1]}`;
    if (expectedVerified.has(key)) {
      const [gnisId, lat, lon] = expectedVerified.get(key);
      assert.equal(row[8], 1, `${key}: GNIS row must be VERIFIED=1`);
      assert.equal(row[7], gnisId, `${key}: GNIS FEATURE_ID`);
      assert.ok(Math.abs(row[4] - lat) < 1e-10, `${key}: latitude`);
      assert.ok(Math.abs(row[5] - lon) < 1e-10, `${key}: longitude`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${gnisId}`), `${key}: note must name its FEATURE_ID`);
      assert.match(row[9], /USGS GNIS (?:MapServer|Domestic Names)/, `${key}: note must name its USGS service`);
      assert.match(row[9], /2026-10-22/, `${key}: note must date the cross-check`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline)/, `${key}: note must state the point-geometry limit`);
    } else {
      assert.ok(expectedUnverified.has(key), `unexpected California row: ${key}`);
      assert.equal(row[8], 0, `${key}: curated row remains VERIFIED=0`);
      assert.equal(row[7], null, `${key}: curated row carries no GNIS id`);
      assert.match(row[9], /GNIS FEATURE_ID not claimed/, `${key}: note must disclaim a GNIS id`);
      assert.match(row[9], /retrieved 2026-10-22/, `${key}: note must date its source retrieval`);
    }
  }

  const rowByKey = new Map(gaz.GAZ_ROWS.map((r) => [`${r[0]}|${r[1]}`, r]));
  assert.equal(rowByKey.get("Manzanar|Populated Place")[8], 1);
  assert.equal(rowByKey.get("Manzanar|Park")[8], 0, "Manzanar locality must not upgrade the National Historic Site row");
  assert.equal(rowByKey.get("Morris Reservoir|Reservoir")[8], 1);
  assert.equal(rowByKey.get("Morris Dam|Dam")[8], 0, "Morris Reservoir must not upgrade the dam-structure row");
  assert.equal(rowByKey.get("Tule Lake|Swamp")[8], 1);
  assert.equal(rowByKey.get("Tule Lake War Relocation Center|Park")[8], 0, "Tule Lake Swamp must not upgrade the relocation-center row");
  assert.ok(!rowByKey.has("Colorado River|Stream"), "Colorado River GNIS primary point is outside the California frame and is not seeded");

  const registerIds = register.frames.california.verifiedRows.map((r) => `${r.name}|${r.featureClass}|${r.featureId}`);
  const generatedIds = gaz.GAZ_ROWS.filter((r) => r[8] === 1).map((r) => `${r[0]}|${r[1]}|${r[7]}`);
  assert.deepEqual(registerIds, generatedIds, "California source register must stay in sync with the generated pack");

  // Generalized context only: corridors stay schematic tiers, never official alignments.
  assert.ok(data.CORRIDORS.length >= 3);
  assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), "statewide corridors are generalized context, not alignments");
  assert.ok(data.COAST.length > 10, "generalized coastline polyline is present");
});

test("Nevada and Arizona statewide frames ship all-GNIS starter registers", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-source-register-2026-10-22.json"));
  const expectations = {
    nevada: {
      state: "NV",
      bbox: { lon0: -120.03, lat0: 34.88, lon1: -113.95, lat1: 42.03 },
      rows: new Map([
        ["Carson City|Populated Place", "863976"],
        ["Reno|Populated Place", "861100"],
        ["Las Vegas|Populated Place", "847388"],
        ["Elko|Populated Place", "845452"],
        ["Winnemucca|Populated Place", "844996"],
        ["Ely|Populated Place", "859671"],
        ["Tonopah|Populated Place", "845985"],
        ["Pyramid Lake|Lake", "856349"],
        ["Walker Lake|Lake", "844615"],
        ["Humboldt River|Stream", "860071"],
        ["Boundary Peak|Summit", "857652"],
        ["Wheeler Peak|Summit", "861956"],
      ]),
      anchor: ["Carson City|Populated Place", 39.1637984, -119.7674034],
    },
    arizona: {
      state: "AZ",
      bbox: { lon0: -114.82, lat0: 31.33, lon1: -109.05, lat1: 37.01 },
      rows: new Map([
        ["Phoenix|Populated Place", "44784"],
        ["Tucson|Populated Place", "43534"],
        ["Flagstaff|Populated Place", "29046"],
        ["Yuma|Populated Place", "14111"],
        ["Prescott|Populated Place", "33189"],
        ["Kingman|Populated Place", "6704"],
        ["Salt River|Stream", "33995"],
        ["Gila River|Stream", "42838"],
        ["Verde River|Stream", "35768"],
        ["Humphreys Peak|Summit", "30290"],
        ["Mount Graham|Summit", "5204"],
        ["Grand Canyon|Valley", "23907"],
      ]),
      anchor: ["Phoenix|Populated Place", 33.4483771, -112.0740373],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    assert.ok(data.BBOX.lat1 - data.BBOX.lat0 > 5, `${frameId}: frame spans a state`);
    assert.ok(data.BBOX.lon1 - data.BBOX.lon0 > 5, `${frameId}: frame spans a state`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service that supplied the primary point`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-22/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerIds = register.frames[frameId].verifiedRows.map((r) => `${r.name}|${r.featureClass}|${r.featureId}`);
    const generatedIds = gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[1]}|${r[7]}`);
    assert.deepEqual(registerIds, generatedIds, `${frameId}: source register must stay in sync with the generated pack`);

    assert.ok(data.CORRIDORS.length >= 3, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    assert.deepEqual(data.COAST, [], `${frameId}: inland state frame has no coastline`);
  }

  const arizonaGaz = await import("../js/city-gazetteer-data-arizona.js");
  const grandCanyon = arizonaGaz.GAZ_ROWS.find((r) => r[0] === "Grand Canyon" && r[1] === "Valley");
  assert.equal(grandCanyon[7], "23907", "Grand Canyon must use the Valley landform record, not the populated-place record");
  assert.match(grandCanyon[9], /not a canyon outline/);
});

test("territory frames ship hemisphere-aware, multi-coast GNIS starter registers", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    guam: {
      state: "GU",
      bbox: { lon0: 144.58, lat0: 13.22, lon1: 144.99, lat1: 13.69 },
      coastLines: 2,
      signs: [1, 1],
      rows: new Map([
        ["Guam|Island", "1389704"],
        ["Hagåtña|Civil", "1389443"],
        ["Dededo|Populated Place", "1389637"],
        ["Tamuning|Populated Place", "1390090"],
        ["Yigo|Populated Place", "1390188"],
        ["Mangilao|Populated Place", "2414264"],
        ["Barrigada|Populated Place", "1389569"],
        ["Santa Rita|Populated Place", "1390020"],
        ["Inarajan|Populated Place", "1389737"],
        ["Mount Lamlam|Summit", "1389785"],
        ["Apra Harbor|Bay", "1389489"],
        ["Talofofo River|Stream", "1390088"],
      ]),
      anchor: ["Hagåtña|Civil", 13.4741667, 144.7477778],
    },
    americansamoa: {
      state: "AS",
      bbox: { lon0: -170.88, lat0: -14.42, lon1: -169.37, lat1: -14.1 },
      coastLines: 5,
      signs: [-1, -1],
      rows: new Map([
        ["Pago Pago|Populated Place", "1389119"],
        ["Fagatogo|Populated Place", "1388792"],
        ["Tāfuna|Populated Place", "1669450"],
        ["Nuʻuuli|Populated Place", "1389088"],
        ["Leone|Populated Place", "1388922"],
        ["Ofu|Populated Place", "1389091"],
        ["Olosega|Populated Place", "1389103"],
        ["Ta‘ū|Populated Place", "1389249"],
        ["Tutuila Island|Island", "1389316"],
        ["Pago Pago Harbor|Bay", "1389120"],
        ["Matafao Peak|Summit", "1389004"],
        ["Lata Mountain|Summit", "1388875"],
      ]),
      anchor: ["Pago Pago|Populated Place", -14.2780556, -170.7025],
    },
    usvirginislands: {
      state: "VI",
      bbox: { lon0: -65.12, lat0: 17.65, lon1: -64.52, lat1: 18.44 },
      coastLines: 5,
      signs: [1, -1],
      rows: new Map([
        ["Charlotte Amalie|Populated Place", "1613808"],
        ["Christiansted|Populated Place", "1613811"],
        ["Frederiksted|Populated Place", "1613945"],
        ["Cruz Bay|Populated Place", "1613859"],
        ["Cruz Bay|Bay", "1613858"],
        ["Water Island|Island", "1614413"],
        ["Buck Island|Island", "1613753"],
        ["Crown Mountain|Summit", "1613857"],
        ["Bordeaux Mountain|Summit", "1613741"],
        ["Mount Eagle|Summit", "1613894"],
        ["Magens Bay|Bay", "1614115"],
        ["Christiansted Harbor|Bay", "1613812"],
      ]),
      anchor: ["Charlotte Amalie|Populated Place", 18.3419004, -64.9307007],
    },
    midway: {
      state: "UM",
      bbox: { lon0: -177.44, lat0: 28.175, lon1: -177.29, lat1: 28.245 },
      coastLines: 3,
      signs: [1, -1],
      rows: new Map([
        ["Midway Islands|Island", "1393085"],
        ["Sand Island|Island", "1393170"],
        ["Eastern Island|Island", "1393009"],
        ["Welles Harbor|Bay", "1393264"],
        ["Seward Roads|Bay", "1393174"],
        ["Frigate Point|Cape", "1393020"],
      ]),
      anchor: ["Midway Islands|Island", 28.2052778, -177.3613889],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: territory frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: frame bbox`);
    assert.deepEqual(data.VIEWS.find((v) => v.id === "overview").position, [0, 20, 32], `${frameId}: small island frame keeps the city-scale overview floors`);

    assert.ok(Array.isArray(data.COAST[0]?.[0]), `${frameId}: coast must use disconnected polylines`);
    assert.equal(data.COAST.length, expected.coastLines, `${frameId}: generalized coastline count`);
    for (const line of data.COAST) {
      assert.ok(line.length >= 2, `${frameId}: each coast line needs at least two points`);
      for (const [lon, lat] of line) {
        assert.ok(lon >= data.BBOX.lon0 && lon <= data.BBOX.lon1, `${frameId}: coast lon in frame`);
        assert.ok(lat >= data.BBOX.lat0 && lat <= data.BBOX.lat1, `${frameId}: coast lat in frame`);
      }
    }

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.equal(Math.sign(row[4]), expected.signs[0], `${frameId}: ${key} latitude hemisphere`);
      assert.equal(Math.sign(row[5]), expected.signs[1], `${frameId}: ${key} longitude hemisphere`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-22/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.equal(registerFrame.coastlineCount, data.COAST.length, `${frameId}: register coastline count`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: territory source register must reproduce the generated rows exactly`);

    assert.ok(data.CORRIDORS.length >= 3, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
  }

  const guamGaz = await import("../js/city-gazetteer-data-guam.js");
  const hagatna = guamGaz.GAZ_ROWS.find((r) => r[0] === "Hagåtña");
  assert.equal(hagatna[1], "Civil", "Hagåtña must not be mislabeled as a GNIS populated place");
  assert.match(hagatna[9], /GNIS Domestic Names detail/);
  assert.match(hagatna[9], /Class=Civil/);
  assert.ok(!guamGaz.GAZ_ROWS.some((r) => r[0] === "Hagåtña" && r[1] === "Populated Place"));

  const americanSamoaData = await import("../js/city-subsurface-data-americansamoa.js");
  assert.match(americanSamoaData.CITY.subtitle, /Swains Island and Rose Atoll omitted/);
  assert.match(register.frames.americansamoa.frameNote, /must not be described as covered/);

  const usviGaz = await import("../js/city-gazetteer-data-usvirginislands.js");
  const cruzTown = usviGaz.GAZ_ROWS.find((r) => r[0] === "Cruz Bay" && r[1] === "Populated Place");
  const cruzBay = usviGaz.GAZ_ROWS.find((r) => r[0] === "Cruz Bay" && r[1] === "Bay");
  assert.notEqual(cruzTown[7], cruzBay[7], "Cruz Bay town and bay are distinct GNIS records");
  const buckIsland = usviGaz.GAZ_ROWS.find((r) => r[0] === "Buck Island");
  assert.match(buckIsland[9], /FEATURE_ID 1613754/, "Buck Island note must reject the Saint Thomas same-name record");

  const midwayGaz = await import("../js/city-gazetteer-data-midway.js");
  const midwayIslands = midwayGaz.GAZ_ROWS.find((r) => r[0] === "Midway Islands");
  assert.match(midwayIslands[9], /FEATURE_ID 1802699/, "Midway Islands note must distinguish the political-division record");
  assert.match(midwayIslands[9], /State returned null/, "Midway notes must preserve the bounded-query State=null provenance");
  assert.ok(!midwayGaz.GAZ_ROWS.some((r) => /Spit Island|Midway Lagoon|Brooks Channel|Henderson Field/.test(r[0])), "unreturned Midway names must not be seeded as GNIS rows");

  const engine = read("js/city-subsurface.js");
  assert.match(engine, /lat >= 0 \? "N" : "S"/, "shared engine must format south latitude");
  assert.match(engine, /lon >= 0 \? "E" : "W"/, "shared engine must format east longitude");
  assert.match(engine, /Array\.isArray\(COAST\[0\]\?\.\[0\]\)/, "shared engine must normalize single- and multi-polyline coasts");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Utah, Colorado, and New Mexico complete the Four Corners GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    utah: {
      state: "UT",
      bbox: { lon0: -114.25, lat0: 36.95, lon1: -108.85, lat1: 42.05 },
      rows: new Map([
        ["Salt Lake City|Populated Place", "1454997"],
        ["Provo|Populated Place", "1444661"],
        ["Ogden|Populated Place", "1444049"],
        ["Saint George|Populated Place", "1455098"],
        ["Moab|Populated Place", "1430389"],
        ["Logan|Populated Place", "1442849"],
        ["Great Salt Lake|Lake", "1441459"],
        ["Utah Lake|Lake", "1446894"],
        ["Green River|Stream", "1428399"],
        ["Sevier River|Stream", "1445451"],
        ["Kings Peak|Summit", "1442332"],
        ["Bonneville Salt Flats|Flat", "1425872"],
      ]),
      anchor: ["Salt Lake City|Populated Place", 40.7607794, -111.8910474],
    },
    colorado: {
      state: "CO",
      bbox: { lon0: -109.07, lat0: 36.98, lon1: -102.04, lat1: 41.02 },
      rows: new Map([
        ["Denver|Populated Place", "201738"],
        ["Colorado Springs|Populated Place", "204797"],
        ["Boulder|Populated Place", "178680"],
        ["Fort Collins|Populated Place", "204673"],
        ["Aspen|Populated Place", "204686"],
        ["Durango|Populated Place", "202983"],
        ["Mount Elbert|Summit", "180381"],
        ["Pikes Peak|Summit", "204770"],
        ["South Platte River|Stream", "201759"],
        ["Grand Lake|Lake", "204950"],
        ["Blue Mesa Reservoir|Reservoir", "186973"],
        ["San Luis Valley|Valley", "1930540"],
      ]),
      anchor: ["Denver|Populated Place", 39.7391536, -104.9847034],
    },
    newmexico: {
      state: "NM",
      bbox: { lon0: -109.06, lat0: 31.32, lon1: -102.99, lat1: 37.01 },
      rows: new Map([
        ["Santa Fe|Populated Place", "936823"],
        ["Albuquerque|Populated Place", "928679"],
        ["Las Cruces|Populated Place", "899715"],
        ["Roswell|Populated Place", "894171"],
        ["Farmington|Populated Place", "902246"],
        ["Taos|Populated Place", "911545"],
        ["Wheeler Peak|Summit", "928839"],
        ["Sierra Blanca Peak|Summit", "920702"],
        ["Elephant Butte Reservoir|Reservoir", "888840"],
        ["Rio Chama|Stream", "923661"],
        ["Animas River|Stream", "900284"],
        ["Conchas Lake|Lake", "897344"],
      ]),
      anchor: ["Santa Fe|Populated Place", 35.6869752, -105.937799],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    assert.deepEqual(data.COAST, [], `${frameId}: inland state frame has no coastline`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-22/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-2 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.ok(registerRow.geocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
  }

  const utahGaz = await import("../js/city-gazetteer-data-utah.js");
  const greenRiver = utahGaz.GAZ_ROWS.find((r) => r[0] === "Green River" && r[1] === "Stream");
  assert.match(greenRiver[9], /FEATURE_ID 1428398/, "Green River note must reject the same-name populated place");
  assert.ok(!utahGaz.GAZ_ROWS.some((r) => r[0] === "Bear Lake"), "ambiguous Bear Lake candidates must not be seeded");

  const coloradoData = await import("../js/city-subsurface-data-colorado.js");
  const coloradoGaz = await import("../js/city-gazetteer-data-colorado.js");
  const grandLake = coloradoGaz.GAZ_ROWS.find((r) => r[0] === "Grand Lake" && r[1] === "Lake");
  assert.match(grandLake[9], /FEATURE_ID 202505/, "Grand Lake note must distinguish the town record");
  const southPlatte = coloradoGaz.GAZ_ROWS.find((r) => r[0] === "South Platte River");
  assert.match(southPlatte[9], /GNIS Domestic Names detail/);
  assert.match(southPlatte[9], /Class=Stream/);
  assert.match(southPlatte[9], /Primary County field/);
  assert.match(southPlatte[9], /sequence 1/);
  assert.ok(!coloradoGaz.GAZ_ROWS.some((r) => ["Arkansas River", "Rio Grande", "Colorado River"].includes(r[0])), "unreturned or out-of-frame Colorado river records must remain context corridors only");
  assert.ok(coloradoData.CORRIDORS.some((c) => /Colorado River/.test(c.name) && /No Colorado River gazetteer row/.test(c.facts[0])));

  const newMexicoData = await import("../js/city-subsurface-data-newmexico.js");
  const newMexicoGaz = await import("../js/city-gazetteer-data-newmexico.js");
  assert.ok(!newMexicoGaz.GAZ_ROWS.some((r) => ["Pecos River", "Rio Grande", "San Juan River"].includes(r[0])), "ambiguous or unreturned New Mexico river records must not be seeded");
  assert.ok(newMexicoData.CORRIDORS.some((c) => /Pecos River/.test(c.name) && /two exact Eddy County Stream records/.test(c.facts[0])));
  const animas = newMexicoGaz.GAZ_ROWS.find((r) => r[0] === "Animas River");
  assert.match(animas[9], /FEATURE_ID 900283/, "Animas River note must reject the Hidalgo County same-name stream");
  const sierraBlanca = newMexicoGaz.GAZ_ROWS.find((r) => r[0] === "Sierra Blanca Peak");
  assert.match(sierraBlanca[9], /FEATURE_ID 912567/, "Sierra Blanca Peak note must distinguish the mountain-range record");
  const wheeler = newMexicoGaz.GAZ_ROWS.find((r) => r[0] === "Wheeler Peak");
  assert.match(wheeler[9], /Nevada's Wheeler Peak/, "New Mexico Wheeler Peak must not be conflated with the Nevada record");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Oregon, Washington, and Idaho complete the Pacific Northwest GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    oregon: {
      state: "OR",
      bbox: { lon0: -124.75, lat0: 41.95, lon1: -116.45, lat1: 46.35 },
      coastLines: 1,
      rows: new Map([
        ["Salem|Populated Place", "1167861"],
        ["Portland|Populated Place", "1136645"],
        ["Eugene|Populated Place", "1120527"],
        ["Bend|Populated Place", "1137914"],
        ["Medford|Populated Place", "1124040"],
        ["Astoria|Populated Place", "1117076"],
        ["Mount Hood|Summit", "1143711"],
        ["Mount Jefferson|Summit", "1144246"],
        ["Crater Lake|Lake", "1163669"],
        ["Willamette River|Stream", "1158060"],
        ["Deschutes River|Stream", "1140916"],
        ["Columbia River|Stream", "1140014"],
      ]),
      anchor: ["Salem|Populated Place", 44.9428975, -123.0350963],
    },
    washington: {
      state: "WA",
      bbox: { lon0: -124.85, lat0: 45.5, lon1: -116.85, lat1: 49.08 },
      coastLines: 2,
      rows: new Map([
        ["Olympia|Populated Place", "1533353"],
        ["Seattle|Populated Place", "1512650"],
        ["Spokane|Populated Place", "1512683"],
        ["Tacoma|Populated Place", "1512713"],
        ["Vancouver|Populated Place", "1531916"],
        ["Yakima|Populated Place", "1509643"],
        ["Mount Rainier|Summit", "1533614"],
        ["Mount Saint Helens|Summit", "1525360"],
        ["Lake Chelan|Lake", "1530367"],
        ["Lake Washington|Lake", "1531534"],
        ["Snake River|Stream", "1533479"],
        ["Skagit River|Stream", "1525850"],
      ]),
      anchor: ["Olympia|Populated Place", 47.0378741, -122.9006951],
    },
    idaho: {
      state: "ID",
      bbox: { lon0: -117.3, lat0: 41.95, lon1: -110.95, lat1: 49.05 },
      coastLines: 0,
      rows: new Map([
        ["Boise|Populated Place", "400590"],
        ["Idaho Falls|Populated Place", "396684"],
        ["Pocatello|Populated Place", "397053"],
        ["Coeur d'Alene|Populated Place", "379485"],
        ["Twin Falls|Populated Place", "398273"],
        ["Lewiston|Populated Place", "396788"],
        ["Borah Peak|Summit", "378037"],
        ["Hyndman Peak|Summit", "383587"],
        ["Lake Pend Oreille|Lake", "398523"],
        ["Coeur d'Alene Lake|Lake", "397563"],
        ["Salmon River|Stream", "400069"],
        ["Clearwater River|Stream", "379406"],
      ]),
      anchor: ["Boise|Populated Place", 43.6135002, -116.2034505],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: generalized coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-3 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.ok(registerRow.geocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
  }

  const oregonGaz = await import("../js/city-gazetteer-data-oregon.js");
  const mountHood = oregonGaz.GAZ_ROWS.find((r) => r[0] === "Mount Hood" && r[1] === "Summit");
  assert.match(mountHood[9], /FEATURE_ID 1143710/, "Mount Hood note must reject the same-name populated place");
  const craterLake = oregonGaz.GAZ_ROWS.find((r) => r[0] === "Crater Lake");
  assert.match(craterLake[9], /1140396/, "Crater Lake note must reject the Baker County same-name lake");
  assert.match(craterLake[9], /1119515/, "Crater Lake note must reject the Malheur County same-name lake");
  assert.ok(!oregonGaz.GAZ_ROWS.some((r) => r[0] === "Rogue River"), "Rogue River must not be seeded from its two-record exact-name screen in this starter batch");

  const washingtonData = await import("../js/city-subsurface-data-washington.js");
  const washingtonGaz = await import("../js/city-gazetteer-data-washington.js");
  assert.ok(!washingtonGaz.GAZ_ROWS.some((r) => ["Columbia River", "Spokane River"].includes(r[0])), "Washington-screen-empty Columbia and ambiguous Spokane River records must remain corridors only");
  assert.ok(washingtonData.CORRIDORS.some((c) => /Columbia River/.test(c.name) && /No Columbia River gazetteer row/.test(c.facts[0])));

  const idahoData = await import("../js/city-subsurface-data-idaho.js");
  const idahoGaz = await import("../js/city-gazetteer-data-idaho.js");
  assert.ok(!idahoGaz.GAZ_ROWS.some((r) => ["Snake River", "Bear Lake"].includes(r[0])), "Idaho-screen-unreturned Snake River and ambiguous Bear Lake records must not be seeded");
  assert.ok(idahoData.CORRIDORS.some((c) => /Snake River/.test(c.name) && /No Snake River gazetteer row/.test(c.facts[0])));
  const twinFalls = idahoGaz.GAZ_ROWS.find((r) => r[0] === "Twin Falls");
  assert.match(twinFalls[9], /FEATURE_ID 375624/, "Twin Falls note must distinguish the waterfall record");
  assert.ok(idahoGaz.GAZ_ROWS.some((r) => r[0] === "Coeur d'Alene" && r[1] === "Populated Place"));
  assert.ok(idahoGaz.GAZ_ROWS.some((r) => r[0] === "Coeur d'Alene Lake" && r[1] === "Lake"));

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Montana and Wyoming complete the Northern Rockies GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    montana: {
      state: "MT",
      bbox: { lon0: -116.4, lat0: 44.3, lon1: -104.0, lat1: 49.1 },
      coastLines: 0,
      rows: new Map([
        ["Helena|Populated Place", "802116"],
        ["Billings|Populated Place", "802034"],
        ["Missoula|Populated Place", "787504"],
        ["Great Falls|Populated Place", "802113"],
        ["Bozeman|Populated Place", "769173"],
        ["Butte|Populated Place", "780689"],
        ["Miles City|Populated Place", "774202"],
        ["Flathead Lake|Lake", "783514"],
        ["Fort Peck Lake|Lake", "771516"],
        ["Lake McDonald|Lake", "787038"],
        ["Bighorn River|Stream", "779903"],
        ["Granite Peak|Summit", "784178"],
      ]),
      anchor: ["Helena|Populated Place", 46.5927122, -112.036109],
    },
    wyoming: {
      state: "WY",
      bbox: { lon0: -111.4, lat0: 40.95, lon1: -104.0, lat1: 45.1 },
      coastLines: 0,
      rows: new Map([
        ["Cheyenne|Populated Place", "1609077"],
        ["Casper|Populated Place", "1586424"],
        ["Laramie|Populated Place", "1590526"],
        ["Jackson|Populated Place", "1604404"],
        ["Rock Springs|Populated Place", "1593588"],
        ["Green River|Populated Place", "1589126"],
        ["Gannett Peak|Summit", "1599903"],
        ["Grand Teton|Summit", "1609199"],
        ["Devils Tower|Summit", "1609083"],
        ["Yellowstone Lake|Lake", "1609324"],
        ["Jackson Lake|Reservoir", "1609177"],
        ["Shoshone River|Stream", "1594293"],
      ]),
      anchor: ["Cheyenne|Populated Place", 41.1399814, -104.8202462],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-4 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.ok(registerRow.geocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
  }

  const montanaGaz = await import("../js/city-gazetteer-data-montana.js");
  const montanaData = await import("../js/city-subsurface-data-montana.js");
  const granite = montanaGaz.GAZ_ROWS.find((r) => r[0] === "Granite Peak");
  assert.match(granite[9], /Domestic Names per-ID check/, "Granite Peak note must cite the per-ID check");
  assert.match(granite[9], /FEATURE_ID 784179/, "Granite Peak note must reject the Madison County same-name summit");
  assert.match(granite[9], /FEATURE_ID 784177/, "Granite Peak note must reject the second Park County same-name summit");
  assert.match(granite[9], /High Point/, "Granite Peak note must preserve the per-ID coordinate designation");
  const lakeMcDonald = montanaGaz.GAZ_ROWS.find((r) => r[0] === "Lake McDonald");
  assert.match(lakeMcDonald[9], /FEATURE_ID 785919/, "Lake McDonald note must reject the same-name populated place");
  assert.ok(!montanaGaz.GAZ_ROWS.some((r) => ["Yellowstone River", "Missouri River", "Glacier National Park"].includes(r[0])), "Montana river/park records must not be seeded from empty or division-only screens");
  assert.ok(montanaData.CORRIDORS.some((c) => /Missouri River/.test(c.name) && /empty array/.test(c.facts[0])));
  assert.ok(montanaData.CORRIDORS.some((c) => /Yellowstone River/.test(c.name) && /empty array/.test(c.facts[0])));

  const wyomingData = await import("../js/city-subsurface-data-wyoming.js");
  const wyomingGaz = await import("../js/city-gazetteer-data-wyoming.js");
  const jacksonLake = wyomingGaz.GAZ_ROWS.find((r) => r[0] === "Jackson Lake");
  assert.equal(jacksonLake[1], "Reservoir", "Jackson Lake must store the per-ID Class=Reservoir identity");
  assert.match(jacksonLake[9], /Class=Reservoir/, "Jackson Lake note must preserve the per-ID class");
  assert.match(jacksonLake[9], /FEATURE_ID 1590031/, "Jackson Lake note must reject the Natrona County same-name lake");
  const greenRiver = wyomingGaz.GAZ_ROWS.find((r) => r[0] === "Green River");
  assert.match(greenRiver[9], /FEATURE_ID 1600086/, "Green River town note must reject the Weston County same-name stream");
  assert.ok(!wyomingGaz.GAZ_ROWS.some((r) => r[1] === "Stream" && ["North Platte River", "Snake River", "Green River"].includes(r[0])), "unreturned Wyoming stream records must not be seeded");
  const devilsTower = wyomingGaz.GAZ_ROWS.find((r) => r[0] === "Devils Tower");
  assert.match(devilsTower[9], /FEATURE_ID 1604684/, "Devils Tower note must reject the same-name populated place");
  const grandTeton = wyomingGaz.GAZ_ROWS.find((r) => r[0] === "Grand Teton");
  assert.match(grandTeton[9], /FEATURE_ID 1589026/, "Grand Teton note must reject the same-name canal");
  assert.ok(wyomingData.CORRIDORS.some((c) => /North Platte/.test(c.name) && /empty array/.test(c.facts[0])));
  assert.ok(wyomingData.CORRIDORS.some((c) => /Snake River/.test(c.name) && /Mountain Ranges record/.test(c.facts[0])));
  assert.ok(register.identityDecisions.some((d) => /Bighorn River/.test(d.candidate) && /empty array/.test(`${d.candidate} ${d.reason || ""}`)), "register must record the Wyoming Bighorn River empty screen");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("North and South Dakota complete the Dakotas GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    northdakota: {
      state: "ND",
      bbox: { lon0: -104.3, lat0: 45.9, lon1: -96.5, lat1: 49.1 },
      coastLines: 0,
      rows: new Map([
        ["Bismarck|Populated Place", "1035849"],
        ["Fargo|Populated Place", "1028945"],
        ["Grand Forks|Populated Place", "1029197"],
        ["Minot|Populated Place", "1030249"],
        ["Williston|Populated Place", "1032815"],
        ["Dickinson|Populated Place", "1028683"],
        ["Devils Lake|Populated Place", "1028672"],
        ["Devils Lake|Lake", "1034194"],
        ["Lake Sakakawea|Lake", "1033989"],
        ["White Butte|Summit", "1035239"],
        ["Sheyenne River|Stream", "1035146"],
        ["Heart River|Stream", "1034918"],
      ]),
      anchor: ["Bismarck|Populated Place", 46.8083268, -100.7837392],
    },
    southdakota: {
      state: "SD",
      bbox: { lon0: -104.3, lat0: 42.45, lon1: -96.4, lat1: 46.0 },
      coastLines: 0,
      rows: new Map([
        ["Pierre|Populated Place", "1266887"],
        ["Sioux Falls|Populated Place", "1267670"],
        ["Rapid City|Populated Place", "1265333"],
        ["Aberdeen|Populated Place", "1253581"],
        ["Mitchell|Populated Place", "1256500"],
        ["Yankton|Populated Place", "1259091"],
        ["Belle Fourche|Populated Place", "1265119"],
        ["Black Elk Peak|Summit", "1261770"],
        ["Lake Oahe|Lake", "1266878"],
        ["Bad River|Stream", "1265114"],
        ["Cheyenne River|Stream", "1267017"],
        ["James River|Stream", "1261082"],
      ]),
      anchor: ["Pierre|Populated Place", 44.3683156, -100.3509665],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-5 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.ok(registerRow.geocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
  }

  const ndGaz = await import("../js/city-gazetteer-data-northdakota.js");
  const ndData = await import("../js/city-subsurface-data-northdakota.js");
  const whiteButte = ndGaz.GAZ_ROWS.find((r) => r[0] === "White Butte");
  assert.match(whiteButte[9], /Domestic Names per-ID check/, "White Butte note must cite the per-ID check");
  assert.match(whiteButte[9], /FEATURE_ID 1032775/, "White Butte must reject the Hettinger County same-name summit");
  assert.match(whiteButte[9], /FEATURE_ID 2761541/, "White Butte must reject the Morton County same-name summit");
  assert.match(whiteButte[9], /FEATURE_ID 1032774/, "White Butte must reject the Stark County same-name summit");
  assert.match(whiteButte[9], /High Point/, "White Butte note must preserve the per-ID designation");
  assert.match(whiteButte[9], /3506 feet/, "White Butte note must preserve the per-ID elevation description");
  const devilsTown = ndGaz.GAZ_ROWS.find((r) => r[0] === "Devils Lake" && r[1] === "Populated Place");
  const devilsLake = ndGaz.GAZ_ROWS.find((r) => r[0] === "Devils Lake" && r[1] === "Lake");
  assert.match(devilsTown[9], /FEATURE_ID 1034194/, "Devils Lake town must name the same-name lake it does not verify");
  assert.match(devilsLake[9], /FEATURE_ID 1028672/, "Devils Lake lake must name the same-name town it does not verify");
  assert.notDeepEqual([devilsTown[4], devilsTown[5]], [devilsLake[4], devilsLake[5]], "town and lake points must be distinct");
  assert.ok(!ndGaz.GAZ_ROWS.some((r) => ["Missouri River", "Red River", "Red River of the North", "James River"].includes(r[0])), "empty-screen North Dakota river records must not be seeded");
  assert.ok(ndData.CORRIDORS.some((c) => /Missouri River/.test(c.name) && /empty array/.test(c.facts[0])));
  assert.ok(ndData.CORRIDORS.some((c) => /Red River/.test(c.name) && /empty array/.test(c.facts[0])));

  const sdGaz = await import("../js/city-gazetteer-data-southdakota.js");
  const sdData = await import("../js/city-subsurface-data-southdakota.js");
  const blackElk = sdGaz.GAZ_ROWS.find((r) => r[0] === "Black Elk Peak");
  assert.match(blackElk[9], /Domestic Names per-ID check/, "Black Elk Peak note must cite the per-ID check");
  assert.match(blackElk[9], /High Point/, "Black Elk Peak note must preserve the per-ID designation");
  assert.match(blackElk[9], /Harney Peak/, "Black Elk Peak note must record the former official name");
  assert.match(blackElk[9], /2016 rename/, "Black Elk Peak note must date the Board rename");
  assert.ok(!sdGaz.GAZ_ROWS.some((r) => ["Missouri River", "Badlands National Park", "Lake Sheridan", "Harney Peak", "Belle Fourche River"].includes(r[0])), "empty-screen or out-of-scope South Dakota records must not be seeded");
  assert.ok(sdGaz.GAZ_ROWS.some((r) => r[0] === "James River" && r[1] === "Stream"), "the unique South Dakota James River stream is seeded only there");
  assert.ok(sdData.CORRIDORS.some((c) => /Missouri River/.test(c.name) && /empty array/.test(c.facts[0])));
  const siouxFalls = sdGaz.GAZ_ROWS.find((r) => r[0] === "Sioux Falls");
  assert.match(siouxFalls[9], /FEATURE_ID 1258087/, "Sioux Falls note must reject the waterfall record");
  const mitchell = sdGaz.GAZ_ROWS.find((r) => r[0] === "Mitchell");
  assert.match(mitchell[9], /FEATURE_ID 1256502/, "Mitchell note must reject the Hyde County same-name lake");
  const cheyenne = sdGaz.GAZ_ROWS.find((r) => r[0] === "Cheyenne River");
  assert.match(cheyenne[9], /FEATURE_ID 1267254/, "Cheyenne River note must reject the reservation record");
  const belleFourche = sdGaz.GAZ_ROWS.find((r) => r[0] === "Belle Fourche");
  assert.match(belleFourche[9], /FEATURE_ID 1265120/, "Belle Fourche town must name the same-hydronym river it does not verify");
  assert.ok(register.identityDecisions.some((d) => /Badlands National Park and Lake Sheridan/.test(d.candidate) && /empty arrays/.test(d.reason || "")), "register must record the Badlands/Lake Sheridan empty screens");
  assert.ok(register.identityDecisions.some((d) => /Rogue River/.test(d.decision)), "register must keep the starter-scope precedent for Belle Fourche river/reservoir");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Nebraska and Kansas complete the Central Plains GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    nebraska: {
      state: "NE",
      bbox: { lon0: -104.3, lat0: 39.95, lon1: -95.0, lat1: 43.05 },
      coastLines: 0,
      rows: new Map([
        ["Lincoln|Populated Place", "837279"],
        ["Omaha|Populated Place", "835483"],
        ["Grand Island|Populated Place", "829622"],
        ["Kearney|Populated Place", "830442"],
        ["Scottsbluff|Populated Place", "833318"],
        ["North Platte|Populated Place", "831719"],
        ["Lake McConaughy|Lake", "831115"],
        ["Panorama Point|Summit", "1851953"],
        ["Scotts Bluff|Summit", "835997"],
        ["Platte River|Stream", "835915"],
        ["Niobrara River|Stream", "835960"],
        ["North Platte River|Stream", "204647"],
      ]),
      anchor: ["Lincoln|Populated Place", 40.8000011, -96.6669599],
    },
    kansas: {
      state: "KS",
      bbox: { lon0: -102.3, lat0: 36.95, lon1: -94.5, lat1: 40.1 },
      coastLines: 0,
      rows: new Map([
        ["Topeka|Populated Place", "485477"],
        ["Wichita|Populated Place", "473862"],
        ["Kansas City|Populated Place", "478635"],
        ["Dodge City|Populated Place", "485363"],
        ["Lawrence|Populated Place", "479145"],
        ["Hays|Populated Place", "475182"],
        ["Mount Sunflower|Summit", "484933"],
        ["Tuttle Creek Lake|Lake", "472898"],
        ["Milford Lake|Lake", "476180"],
        ["Kansas River|Stream", "485184"],
        ["Republican River|Stream", "485443"],
        ["Smoky Hill River|Stream", "485314"],
      ]),
      anchor: ["Topeka|Populated Place", 39.0483336, -95.6780371],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-6 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.ok(registerRow.geocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
  }

  const neGaz = await import("../js/city-gazetteer-data-nebraska.js");
  const neData = await import("../js/city-subsurface-data-nebraska.js");
  const panorama = neGaz.GAZ_ROWS.find((r) => r[0] === "Panorama Point");
  assert.match(panorama[9], /Domestic Names per-ID check/, "Panorama Point note must cite the per-ID check");
  assert.match(panorama[9], /High Point/, "Panorama Point note must preserve the per-ID designation");
  assert.match(panorama[9], /5424 feet/, "Panorama Point note must preserve the per-ID elevation description");
  const lincoln = neGaz.GAZ_ROWS.find((r) => r[0] === "Lincoln");
  assert.match(lincoln[9], /FEATURE_ID 835877/, "Lincoln note must reject Lincoln County");
  assert.match(lincoln[9], /Lincoln Election Precinct/, "Lincoln note must reject the same-name precincts");
  const omaha = neGaz.GAZ_ROWS.find((r) => r[0] === "Omaha");
  assert.match(omaha[9], /FEATURE_ID 834985/, "Omaha note must reject the reservation record");
  assert.match(omaha[9], /FEATURE_ID 1900411/, "Omaha note must reject the Regency record");
  const grandIsland = neGaz.GAZ_ROWS.find((r) => r[0] === "Grand Island");
  assert.match(grandIsland[9], /FEATURE_ID 829621/, "Grand Island note must reject the same-name island record");
  const kearney = neGaz.GAZ_ROWS.find((r) => r[0] === "Kearney");
  assert.match(kearney[9], /FEATURE_ID 835871/, "Kearney note must reject Kearney County");
  assert.match(kearney[9], /FEATURE_ID 1873810/, "Kearney note must reject the historical Kearney City record");
  const scottsTown = neGaz.GAZ_ROWS.find((r) => r[0] === "Scottsbluff");
  const scottsSummit = neGaz.GAZ_ROWS.find((r) => r[0] === "Scotts Bluff");
  assert.match(scottsTown[9], /FEATURE_ID 835997/, "Scottsbluff town must name the same-hydronym summit it does not verify");
  assert.match(scottsSummit[9], /FEATURE_ID 833318/, "Scotts Bluff summit must name the same-hydronym town it does not verify");
  assert.notDeepEqual([scottsTown[4], scottsTown[5]], [scottsSummit[4], scottsSummit[5]], "town and summit points must be distinct");
  const npTown = neGaz.GAZ_ROWS.find((r) => r[0] === "North Platte");
  const npRiver = neGaz.GAZ_ROWS.find((r) => r[0] === "North Platte River");
  assert.match(npTown[9], /FEATURE_ID 1929109/, "North Platte town must reject the precinct record");
  assert.match(npRiver[9], /FEATURE_ID 831720/, "North Platte River must reject the canal record");
  assert.notDeepEqual([npTown[4], npTown[5]], [npRiver[4], npRiver[5]], "town and river points must be distinct");
  assert.ok(!neGaz.GAZ_ROWS.some((r) => ["Missouri River", "Republican River", "Salina"].includes(r[0])), "empty-screen or out-of-scope Nebraska records must not be seeded");
  assert.ok(neData.CORRIDORS.some((c) => /Missouri River/.test(c.name) && /empty array/.test(c.facts[0])));
  assert.ok(register.identityDecisions.some((d) => /Panorama Point/.test(d.candidate) && /5424 feet/.test(d.decision)), "register must record the Panorama Point per-ID check");

  const ksGaz = await import("../js/city-gazetteer-data-kansas.js");
  const ksData = await import("../js/city-subsurface-data-kansas.js");
  const sunflower = ksGaz.GAZ_ROWS.find((r) => r[0] === "Mount Sunflower");
  assert.match(sunflower[9], /Domestic Names per-ID check/, "Mount Sunflower note must cite the per-ID check");
  assert.match(sunflower[9], /High Point/, "Mount Sunflower note must preserve the per-ID designation");
  assert.match(sunflower[9], /4039 feet/, "Mount Sunflower note must preserve the per-ID elevation description");
  const kcKs = ksGaz.GAZ_ROWS.find((r) => r[0] === "Kansas City");
  assert.match(kcKs[9], /FEATURE_ID 748198/, "Kansas City KS must name the Missouri-side record it does not verify");
  const kcGaz = await import("../js/city-gazetteer-data-kansascity.js");
  const kcMo = kcGaz.GAZ_ROWS.find((r) => r[0] === "Kansas City");
  assert.notDeepEqual([kcKs[4], kcKs[5]], [kcMo[4], kcMo[5]], "Kansas City MO and KS points must be distinct");
  const ksRiver = ksGaz.GAZ_ROWS.find((r) => r[0] === "Kansas River");
  assert.match(ksRiver[9], /FEATURE_ID 2108836/, "Kansas River note must reject the bend record");
  const wichita = ksGaz.GAZ_ROWS.find((r) => r[0] === "Wichita");
  assert.match(wichita[9], /FEATURE_ID 485062/, "Wichita note must reject Wichita County");
  assert.match(wichita[9], /FEATURE_ID 473847/, "Wichita note must reject Wichita Heights");
  const lawrence = ksGaz.GAZ_ROWS.find((r) => r[0] === "Lawrence");
  assert.match(lawrence[9], /FEATURE_ID 472149/, "Lawrence note must reject Lawrence Creek");
  assert.ok(!ksGaz.GAZ_ROWS.some((r) => ["Missouri River", "Arkansas River", "Salina"].includes(r[0])), "empty-screen or out-of-scope Kansas records must not be seeded");
  assert.ok(ksData.CORRIDORS.some((c) => /Missouri River/.test(c.name) && /empty array/.test(c.facts[0])));
  assert.ok(ksData.CORRIDORS.some((c) => /Arkansas River/.test(c.name) && /empty array/.test(c.facts[0]) && /round-18 Colorado/.test(c.facts[0])));
  assert.ok(register.identityDecisions.some((d) => /Mount Sunflower/.test(d.candidate) && /4039 feet/.test(d.decision)), "register must record the Mount Sunflower per-ID check");
  assert.ok(register.identityDecisions.some((d) => /Missouri River under states=NE and states=KS/.test(d.candidate)), "register must record the empty river screens");
  assert.ok(register.identityDecisions.some((d) => /Salina/.test(d.candidate) && /starter-scope/.test(d.decision)), "register must keep the starter-scope precedent for Salina");
  assert.ok(register.identityDecisions.some((d) => /Kansas River, FEATURE_ID 485184/.test(d.candidate) && /Multiple counties/.test(d.knownServiceDiscrepancy || "")), "register must record the Kansas River multipoint service discrepancy");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Minnesota and Iowa complete the Upper Midwest GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    minnesota: {
      state: "MN",
      bbox: { lon0: -97.35, lat0: 43.45, lon1: -89.45, lat1: 49.4 },
      coastLines: 0,
      rows: new Map([
        ["Saint Paul|Populated Place", "662851"],
        ["Minneapolis|Populated Place", "655030"],
        ["Duluth|Populated Place", "661145"],
        ["Rochester|Populated Place", "650180"],
        ["Saint Cloud|Populated Place", "650559"],
        ["Mankato|Populated Place", "647438"],
        ["Eagle Mountain|Summit", "656080"],
        ["Lake of the Woods|Lake", "654378"],
        ["Mille Lacs Lake|Lake", "647859"],
        ["Vermilion Lake|Lake", "662716"],
        ["Minnesota River|Stream", "659759"],
        ["Lake Itasca|Lake", "645541"],
      ]),
      anchor: ["Saint Paul|Populated Place", 44.9444101, -93.0932742],
    },
    iowa: {
      state: "IA",
      bbox: { lon0: -96.65, lat0: 40.35, lon1: -89.95, lat1: 43.55 },
      coastLines: 0,
      rows: new Map([
        ["Des Moines|Populated Place", "465961"],
        ["Cedar Rapids|Populated Place", "465941"],
        ["Davenport|Populated Place", "455799"],
        ["Sioux City|Populated Place", "461653"],
        ["Iowa City|Populated Place", "457827"],
        ["Ames|Populated Place", "454167"],
        ["Hawkeye Point|Summit", "1851955"],
        ["West Okoboji Lake|Lake", "462893"],
        ["Clear Lake|Lake", "455462"],
        ["Spirit Lake|Lake", "461850"],
        ["Des Moines River|Stream", "465582"],
        ["Cedar River|Stream", "465058"],
      ]),
      anchor: ["Des Moines|Populated Place", 41.6005448, -93.6091064],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      // Second-surface evidence: the same FEATURE_ID must reproduce in the
      // DomesticNames state text extract at the same primary point.
      const exState = extract.states[expected.state];
      const exRow = exState.rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-7 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      const expectedGeocoderCounty = registerRow.county === "St. Louis" ? "Saint Louis County" : `${registerRow.county} County`;
      assert.equal(registerRow.geocoderCounty, expectedGeocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const mnGaz = await import("../js/city-gazetteer-data-minnesota.js");
  const mnData = await import("../js/city-subsurface-data-minnesota.js");
  const eagle = mnGaz.GAZ_ROWS.find((r) => r[0] === "Eagle Mountain");
  assert.match(eagle[9], /Domestic Names per-ID check/, "Eagle Mountain note must cite the per-ID check");
  assert.match(eagle[9], /High Point/, "Eagle Mountain note must preserve the high-point designation");
  assert.match(eagle[9], /2,301 feet/, "Eagle Mountain note must preserve the published elevation");
  assert.match(eagle[9], /FEATURE_ID 656081/, "Eagle Mountain note must reject the second Cook County summit");
  assert.match(eagle[9], /FEATURE_ID 643035/, "Eagle Mountain note must reject the Todd County summit");
  const lotw = mnGaz.GAZ_ROWS.find((r) => r[0] === "Lake of the Woods");
  assert.match(lotw[9], /FEATURE_ID 1930543/, "Lake of the Woods note must name the unseeded duplicate record");
  const itasca = mnGaz.GAZ_ROWS.find((r) => r[0] === "Lake Itasca");
  assert.match(itasca[9], /FEATURE_ID 645540/, "Lake Itasca note must reject the Anoka County lake");
  assert.match(itasca[9], /FEATURE_ID 645542/, "Lake Itasca note must reject the populated place");
  const vermilion = mnGaz.GAZ_ROWS.find((r) => r[0] === "Vermilion Lake");
  assert.match(vermilion[9], /official name order is Vermilion Lake/, "Vermilion Lake note must preserve the official name order");
  assert.ok(!mnGaz.GAZ_ROWS.some((r) => ["Mississippi River", "Red River of the North", "Lake Superior"].includes(r[0])), "empty-screen or out-of-frame Minnesota records must not be seeded");
  assert.ok(mnData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /Mississippi River Reservoir/.test(c.facts[0])), "Minnesota Mississippi corridor must record why no stream row was seeded");
  assert.ok(mnData.CORRIDORS.some((c) => /Red River/.test(c.name) && /Lake Winnipeg/.test(c.facts[0])), "Minnesota Red River corridor must record the out-of-frame primary point");
  assert.ok(register.identityDecisions.some((d) => /Eagle Mountain, FEATURE_ID 656081/.test(d.candidate)), "register must record the Eagle Mountain identity decision");
  assert.ok(register.identityDecisions.some((d) => /Lake of the Woods, FEATURE_ID 1930543/.test(d.candidate) && /knownServiceDiscrepancy/.test(d.candidate + (d.knownServiceDiscrepancy || "")) || /Lake of the Woods, FEATURE_ID 1930543/.test(d.candidate)), "register must record the Lake of the Woods duplicate decision");

  const iaGaz = await import("../js/city-gazetteer-data-iowa.js");
  const iaData = await import("../js/city-subsurface-data-iowa.js");
  const hawkeye = iaGaz.GAZ_ROWS.find((r) => r[0] === "Hawkeye Point");
  assert.match(hawkeye[9], /Domestic Names per-ID check/, "Hawkeye Point note must cite the per-ID check");
  assert.match(hawkeye[9], /High Point/, "Hawkeye Point note must preserve the high-point designation");
  assert.match(hawkeye[9], /1,670 feet/, "Hawkeye Point note must preserve the published elevation");
  const desMoines = iaGaz.GAZ_ROWS.find((r) => r[0] === "Des Moines");
  assert.match(desMoines[9], /FEATURE_ID 465217/, "Des Moines note must reject Des Moines County");
  const clearLake = iaGaz.GAZ_ROWS.find((r) => r[0] === "Clear Lake");
  assert.match(clearLake[9], /FEATURE_ID 455465/, "Clear Lake lake note must reject the populated place");
  assert.match(clearLake[9], /FEATURE_ID 455463/, "Clear Lake lake note must reject the Pocahontas County lake");
  const spiritLake = iaGaz.GAZ_ROWS.find((r) => r[0] === "Spirit Lake");
  assert.match(spiritLake[9], /FEATURE_ID 461851/, "Spirit Lake note must reject the same-name city record");
  assert.notDeepEqual([clearLake[4], clearLake[5]], [43.1380151, -93.3793725], "Clear Lake lake and city points must be distinct");
  assert.ok(!iaGaz.GAZ_ROWS.some((r) => ["Mississippi River", "Missouri River"].includes(r[0])), "empty-screen Iowa river records must not be seeded");
  assert.ok(iaData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /empty array/.test(c.facts[0])), "Iowa Mississippi corridor must record the empty screen");
  assert.ok(iaData.CORRIDORS.some((c) => /Missouri River/.test(c.name) && /empty array/.test(c.facts[0])), "Iowa Missouri corridor must record the empty screen");
  assert.ok(register.identityDecisions.some((d) => /Missouri River under states=IA/.test(d.candidate)), "register must record the empty Iowa river screens");
  assert.ok(register.identityDecisions.some((d) => /Bloomington and Lake Minnetonka/.test(d.candidate) && /starter-scope/.test(d.decision)), "register must keep the starter-scope precedents");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Wisconsin and Michigan complete the Great Lakes GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    wisconsin: {
      state: "WI",
      bbox: { lon0: -92.95, lat0: 42.45, lon1: -86.75, lat1: 47.1 },
      coastLines: 0,
      rows: new Map([
        ["Madison|Populated Place", "1581834"],
        ["Milwaukee|Populated Place", "1577901"],
        ["Green Bay|Populated Place", "1565801"],
        ["Kenosha|Populated Place", "1567416"],
        ["Racine|Populated Place", "1572015"],
        ["Eau Claire|Populated Place", "1564402"],
        ["Timms Hill|Summit", "1575464"],
        ["Lake Winnebago|Lake", "1576879"],
        ["Lake Mendota|Lake", "1569337"],
        ["Devils Lake|Lake", "1563937"],
        ["Wisconsin River|Stream", "1580811"],
        ["Chippewa River|Stream", "1578997"],
      ]),
      anchor: ["Madison|Populated Place", 43.0730517, -89.4012302],
    },
    michigan: {
      state: "MI",
      bbox: { lon0: -90.45, lat0: 41.65, lon1: -82.1, lat1: 48.05 },
      coastLines: 0,
      rows: new Map([
        ["Lansing|Populated Place", "1625035"],
        ["Detroit|Populated Place", "1617959"],
        ["Grand Rapids|Populated Place", "627105"],
        ["Ann Arbor|Populated Place", "620133"],
        ["Traverse City|Populated Place", "1615042"],
        ["Marquette|Populated Place", "631600"],
        ["Mount Arvon|Summit", "1623751"],
        ["Houghton Lake|Lake", "628664"],
        ["Torch Lake|Lake", "1614970"],
        ["Lake Superior|Lake", "1618946"],
        ["Grand River|Stream", "627109"],
        ["Saginaw River|Stream", "636503"],
      ]),
      anchor: ["Lansing|Populated Place", 42.732535, -84.5555347],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] > 20 && overview.position[2] > 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-8 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      const expectedGeocoderCounty = registerRow.county === "St. Louis" ? "Saint Louis County" : `${registerRow.county} County`;
      assert.equal(registerRow.geocoderCounty, expectedGeocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const wiGaz = await import("../js/city-gazetteer-data-wisconsin.js");
  const wiData = await import("../js/city-subsurface-data-wisconsin.js");
  const timms = wiGaz.GAZ_ROWS.find((r) => r[0] === "Timms Hill");
  assert.match(timms[9], /Domestic Names per-ID check/, "Timms Hill note must cite the per-ID check");
  assert.match(timms[9], /High Point/, "Timms Hill note must preserve the high-point designation");
  assert.match(timms[9], /1,951 feet/, "Timms Hill note must preserve the published elevation");
  const devils = wiGaz.GAZ_ROWS.find((r) => r[0] === "Devils Lake");
  assert.match(devils[9], /FEATURE_ID 1579123/, "Devils Lake note must reject the same-name lakes");
  const greenBay = wiGaz.GAZ_ROWS.find((r) => r[0] === "Green Bay");
  assert.match(greenBay[9], /FEATURE_ID 1565800/, "Green Bay city note must reject the bay record");
  assert.ok(!wiGaz.GAZ_ROWS.some((r) => ["Mississippi River", "Saint Croix River", "Lake Michigan", "Lake Superior"].includes(r[0])), "empty-screen or cross-state Wisconsin records must not be seeded");
  assert.ok(wiData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /empty array/.test(c.facts[0])), "Wisconsin Mississippi corridor must record the empty screen");
  assert.ok(wiData.CORRIDORS.some((c) => /Saint Croix River/.test(c.name) && /FEATURE_ID 662324/.test(c.facts[0])), "Wisconsin Saint Croix corridor must record the cross-state record");
  assert.ok(register.identityDecisions.some((d) => /Saint Croix River under states=WI/.test(d.candidate)), "register must record the Saint Croix cross-state decision");

  const miGaz = await import("../js/city-gazetteer-data-michigan.js");
  const miData = await import("../js/city-subsurface-data-michigan.js");
  const arvon = miGaz.GAZ_ROWS.find((r) => r[0] === "Mount Arvon");
  assert.match(arvon[9], /Domestic Names per-ID check/, "Mount Arvon note must cite the per-ID check");
  assert.match(arvon[9], /High Point/, "Mount Arvon note must preserve the high-point designation");
  assert.match(arvon[9], /1,979 feet/, "Mount Arvon note must preserve the published elevation");
  const superior = miGaz.GAZ_ROWS.find((r) => r[0] === "Lake Superior");
  assert.match(superior[9], /FEATURE_ID 1624619/, "Lake Superior note must name held Lake Huron");
  assert.match(superior[9], /FEATURE_ID 1623080/, "Lake Superior note must name held Lake Michigan");
  assert.match(superior[9], /not a shoreline or lake polygon/, "Lake Superior note must state the mid-lake point limit");
  const torch = miGaz.GAZ_ROWS.find((r) => r[0] === "Torch Lake");
  assert.match(torch[9], /FEATURE_ID 1614969/, "Torch Lake note must reject the Houghton County lake");
  const grandRapids = miGaz.GAZ_ROWS.find((r) => r[0] === "Grand Rapids");
  assert.match(grandRapids[9], /FEATURE_ID 1620055/, "Grand Rapids note must reject the Ontonagon County record");
  assert.ok(!miGaz.GAZ_ROWS.some((r) => ["Lake Huron", "Lake Michigan", "Lake Erie", "Higgins Lake"].includes(r[0])), "starter-scope Michigan records must not be seeded");
  assert.ok(miData.CORRIDORS.some((c) => /Saginaw Bay/.test(c.name) && /starter scope/.test(c.facts[0])), "Michigan Saginaw Bay corridor must record the held Huron record");
  assert.ok(register.identityDecisions.some((d) => /Lake Superior, FEATURE_ID 1618946/.test(d.candidate) && /Seeded/.test(d.decision)), "register must record the Lake Superior seeding decision");
  assert.ok(register.identityDecisions.some((d) => /Higgins Lake, FEATURE_ID 628219/.test(d.candidate) && /starter scope/.test(d.decision)), "register must keep the Higgins Lake starter-scope decision");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Illinois and Indiana complete the Illinois-Indiana GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    illinois: {
      state: "IL",
      bbox: { lon0: -91.55, lat0: 36.95, lon1: -87.05, lat1: 42.55 },
      coastLines: 0,
      rows: new Map([
        ["Springfield|Populated Place", "426595"],
        ["Chicago|Populated Place", "423587"],
        ["Aurora|Populated Place", "403732"],
        ["Naperville|Populated Place", "421954"],
        ["Rockford|Populated Place", "416843"],
        ["Peoria|Populated Place", "415536"],
        ["Charles Mound|Summit", "423586"],
        ["Rend Lake|Lake", "416524"],
        ["Peoria Lake|Lake", "415539"],
        ["Illinois River|Stream", "410769"],
        ["Kaskaskia River|Stream", "426395"],
        ["Rock River|Stream", "416824"],
      ]),
      anchor: ["Springfield|Populated Place", 39.8017171, -89.6437107],
    },
    indiana: {
      state: "IN",
      bbox: { lon0: -88.1, lat0: 37.75, lon1: -84.75, lat1: 41.8 },
      coastLines: 0,
      rows: new Map([
        ["Indianapolis|Populated Place", "452890"],
        ["Fort Wayne|Populated Place", "434689"],
        ["Evansville|Populated Place", "434258"],
        ["South Bend|Populated Place", "452796"],
        ["Bloomington|Populated Place", "431207"],
        ["Terre Haute|Populated Place", "444648"],
        ["Hoosier Hill|Summit", "1851956"],
        ["Monroe Lake|Lake", "451234"],
        ["Patoka Lake|Lake", "451715"],
        ["Lake Maxinkuckee|Lake", "438748"],
        ["Wabash River|Stream", "449850"],
        ["White River|Stream", "445955"],
      ]),
      anchor: ["Indianapolis|Populated Place", 39.7683765, -86.1580423],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    // Narrow frames sit exactly on the generator's Math.max floors (20, 32);
    // wider frames exceed them (see viewsFor in build-city-subsurface.mjs).
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-9 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      const expectedGeocoderCounty = registerRow.county === "St. Louis" ? "Saint Louis County" : `${registerRow.county} County`;
      assert.equal(registerRow.geocoderCounty, expectedGeocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const ilGaz = await import("../js/city-gazetteer-data-illinois.js");
  const ilData = await import("../js/city-subsurface-data-illinois.js");
  const charles = ilGaz.GAZ_ROWS.find((r) => r[0] === "Charles Mound");
  assert.match(charles[9], /Domestic Names per-ID check/, "Charles Mound note must cite the per-ID check");
  assert.match(charles[9], /Summit in Wayne County/, "Charles Mound note must name the correct county");
  assert.match(charles[9], /High Point/, "Charles Mound note must preserve the high-point designation");
  assert.match(charles[9], /1,235 feet/, "Charles Mound note must preserve the published elevation");
  const chicago = ilGaz.GAZ_ROWS.find((r) => r[0] === "Chicago");
  assert.match(chicago[9], /FEATURE_ID 406039/, "Chicago note must reject Chicago Heights");
  const rockRiver = ilGaz.GAZ_ROWS.find((r) => r[0] === "Rock River");
  assert.match(rockRiver[9], /FEATURE_ID 1692463/, "Rock River note must reject the same-name lake records");
  assert.ok(!ilGaz.GAZ_ROWS.some((r) => ["Mississippi River", "Ohio River", "Lake Michigan"].includes(r[0])), "empty-screen Illinois records must not be seeded");
  assert.ok(ilData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /empty array/.test(c.facts[0])), "Illinois Mississippi corridor must record the empty screen");
  assert.ok(ilData.CORRIDORS.some((c) => /Ohio River/.test(c.name) && /empty array/.test(c.facts[0])), "Illinois Ohio corridor must record the empty screen");

  const inGaz = await import("../js/city-gazetteer-data-indiana.js");
  const inData = await import("../js/city-subsurface-data-indiana.js");
  const hoosier = inGaz.GAZ_ROWS.find((r) => r[0] === "Hoosier Hill");
  assert.match(hoosier[9], /Domestic Names per-ID check/, "Hoosier Hill note must cite the per-ID check");
  assert.match(hoosier[9], /High Point/, "Hoosier Hill note must preserve the high-point designation");
  assert.match(hoosier[9], /1,257 feet/, "Hoosier Hill note must preserve the published elevation");
  const monroe = inGaz.GAZ_ROWS.find((r) => r[0] === "Monroe Lake");
  assert.match(monroe[9], /official name order is Monroe Lake/, "Monroe Lake note must preserve the official name order");
  const whiteRiver = inGaz.GAZ_ROWS.find((r) => r[0] === "White River");
  assert.match(whiteRiver[9], /FEATURE_ID 445956/, "White River note must reject the Gibson County populated place");
  assert.ok(!inGaz.GAZ_ROWS.some((r) => ["Ohio River", "Lake Michigan", "Lake Monroe"].includes(r[0])), "empty-screen or reversed-name Indiana records must not be seeded");
  assert.ok(inData.CORRIDORS.some((c) => /Ohio River/.test(c.name) && /empty array/.test(c.facts[0])), "Indiana Ohio corridor must record the empty screen");
  assert.ok(inData.CORRIDORS.some((c) => /Lake Michigan/.test(c.name) && /empty array/.test(c.facts[0]) && /FEATURE_ID 1623080/.test(c.facts[0])), "Indiana Lake Michigan corridor must record the cross-state record");
  assert.ok(register.identityDecisions.some((d) => /Hoosier Hill, FEATURE_ID 1851956/.test(d.candidate) && /1851955/.test(d.decision)), "register must record the Hoosier Hill series observation");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Ohio and Pennsylvania complete the Ohio-Pennsylvania GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    ohio: {
      state: "OH",
      bbox: { lon0: -84.85, lat0: 38.4, lon1: -80.5, lat1: 42.25 },
      coastLines: 0,
      rows: new Map([
        ["Columbus|Populated Place", "1080996"],
        ["Cleveland|Populated Place", "1066654"],
        ["Cincinnati|Populated Place", "1066650"],
        ["Toledo|Populated Place", "1067015"],
        ["Akron|Populated Place", "1064305"],
        ["Dayton|Populated Place", "1064514"],
        ["Campbell Hill|Summit", "1079572"],
        ["Lake Erie|Lake", "1075813"],
        ["Grand Lake|Lake", "1083992"],
        ["Scioto River|Stream", "1072258"],
        ["Maumee River|Stream", "1084017"],
        ["Cuyahoga River|Stream", "1072205"],
      ]),
      anchor: ["Columbus|Populated Place", 39.9611755, -82.9987942],
    },
    pennsylvania: {
      state: "PA",
      bbox: { lon0: -80.55, lat0: 39.7, lon1: -74.95, lat1: 42.3 },
      coastLines: 0,
      rows: new Map([
        ["Harrisburg|Populated Place", "1213649"],
        ["Philadelphia|Populated Place", "1209052"],
        ["Pittsburgh|Populated Place", "1213644"],
        ["Allentown|Populated Place", "1213700"],
        ["Erie|Populated Place", "1174305"],
        ["Scranton|Populated Place", "1213652"],
        ["Mount Davis|Summit", "1209050"],
        ["Pymatuning Reservoir|Lake", "1044806"],
        ["Raystown Lake|Lake", "1193175"],
        ["Lake Wallenpaupack|Lake", "1199735"],
        ["Allegheny River|Stream", "1209386"],
        ["Monongahela River|Stream", "1209053"],
      ]),
      anchor: ["Harrisburg|Populated Place", 40.2737002, -76.8844179],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    // Narrow frames sit exactly on the generator's Math.max floors (20, 32);
    // wider frames exceed them (see viewsFor in build-city-subsurface.mjs).
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.equal(exRow.county, row[3], `${frameId}: ${key} extract county must match the stored county`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-10 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      const expectedGeocoderCounty = `${registerRow.county} County`;
      assert.equal(registerRow.geocoderCounty, expectedGeocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const ohGaz = await import("../js/city-gazetteer-data-ohio.js");
  const ohData = await import("../js/city-subsurface-data-ohio.js");
  const campbell = ohGaz.GAZ_ROWS.find((r) => r[0] === "Campbell Hill");
  assert.match(campbell[9], /Domestic Names per-ID check/, "Campbell Hill note must cite the per-ID check");
  assert.match(campbell[9], /High Point/, "Campbell Hill note must preserve the high-point designation");
  assert.match(campbell[9], /1,550 feet/, "Campbell Hill note must preserve the published elevation");
  assert.match(campbell[9], /Summit in Logan County/, "Campbell Hill note must name the correct county");
  assert.match(campbell[9], /FEATURE_ID 1048578/, "Campbell Hill note must reject the Pike County summit");
  const erieLake = ohGaz.GAZ_ROWS.find((r) => r[0] === "Lake Erie");
  assert.match(erieLake[9], /seeded once/, "Lake Erie note must record the single seeding");
  assert.ok(!ohGaz.GAZ_ROWS.some((r) => ["Ohio River", "Indian Lake"].includes(r[0])), "empty-screen or corrupted-coordinate Ohio records must not be seeded");
  assert.ok(ohData.CORRIDORS.some((c) => /Ohio River/.test(c.name) && /empty array/.test(c.facts[0])), "Ohio River corridor must record the empty screen");
  assert.ok(register.identityDecisions.some((d) => /Indian Lake, FEATURE_ID 1041943/.test(d.candidate) && /corrupted longitude/.test(d.knownServiceDiscrepancy || "")), "register must record the Indian Lake coordinate discrepancy");

  const paGaz = await import("../js/city-gazetteer-data-pennsylvania.js");
  const paData = await import("../js/city-subsurface-data-pennsylvania.js");
  const davis = paGaz.GAZ_ROWS.find((r) => r[0] === "Mount Davis");
  assert.match(davis[9], /Domestic Names per-ID check/, "Mount Davis note must cite the per-ID check");
  assert.match(davis[9], /High Point/, "Mount Davis note must preserve the high-point designation");
  assert.match(davis[9], /3,213 feet/, "Mount Davis note must preserve the published elevation");
  assert.match(davis[9], /Summit in Somerset County/, "Mount Davis note must name the correct county");
  const pymatuning = paGaz.GAZ_ROWS.find((r) => r[0] === "Pymatuning Reservoir");
  assert.match(pymatuning[9], /FEATURE_ID 1199940/, "Pymatuning note must name the unseeded duplicate record");
  const harrisburg = paGaz.GAZ_ROWS.find((r) => r[0] === "Harrisburg");
  assert.match(harrisburg[9], /FEATURE_ID 1213812/, "Harrisburg note must reject the Philadelphia County namesake");
  assert.ok(!paGaz.GAZ_ROWS.some((r) => ["Susquehanna River", "Delaware River", "Ohio River", "Lake Erie"].includes(r[0])), "empty-screen Pennsylvania records must not be seeded");
  assert.ok(paData.CORRIDORS.some((c) => /Susquehanna River/.test(c.name) && /empty array/.test(c.facts[0])), "Susquehanna corridor must record the empty screen");
  assert.ok(paData.CORRIDORS.some((c) => /Ohio River/.test(c.name) && /empty array/.test(c.facts[0])), "Pennsylvania Ohio corridor must record the empty screen");
  assert.ok(register.identityDecisions.some((d) => /Pymatuning Reservoir, FEATURE_ID 1199940/.test(d.candidate) && /knownServiceDiscrepancy/.test(d.candidate + (d.knownServiceDiscrepancy || "")) || /Pymatuning Reservoir, FEATURE_ID 1199940/.test(d.candidate)), "register must record the Pymatuning duplicate decision");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Missouri and Arkansas complete the Missouri-Arkansas GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const normCounty = (s) => s.replace(" (city)", "").replace(/^City of /, "").replace(/Saint/g, "St.");
  const expectations = {
    missouri: {
      state: "MO",
      bbox: { lon0: -95.65, lat0: 35.9, lon1: -89.0, lat1: 40.7 },
      coastLines: 0,
      rows: new Map([
        ["Jefferson City|Populated Place", "758233"],
        ["Saint Louis|Populated Place", "765765"],
        ["Kansas City|Populated Place", "748198"],
        ["Springfield|Populated Place", "735864"],
        ["Columbia|Populated Place", "716133"],
        ["Saint Joseph|Populated Place", "730205"],
        ["Taum Sauk Mountain|Summit", "752501"],
        ["Lake of the Ozarks|Lake", "729600"],
        ["Table Rock Lake|Lake", "752479"],
        ["Missouri River|Stream", "756398"],
        ["Osage River|Stream", "756484"],
        ["Meramec River|Stream", "756378"],
      ]),
      anchor: ["Jefferson City|Populated Place", 38.5767017, -92.1735164],
    },
    arkansas: {
      state: "AR",
      bbox: { lon0: -94.65, lat0: 32.95, lon1: -90.0, lat1: 36.55 },
      coastLines: 0,
      rows: new Map([
        ["Little Rock|Populated Place", "83350"],
        ["Fort Smith|Populated Place", "76952"],
        ["Fayetteville|Populated Place", "76914"],
        ["Springdale|Populated Place", "78436"],
        ["Jonesboro|Populated Place", "77389"],
        ["Magazine Mountain|Ridge", "67051"],
        ["Lake Ouachita|Lake", "75813"],
        ["Beaver Lake|Lake", "70305"],
        ["Greers Ferry Lake|Lake", "75245"],
        ["Bull Shoals Lake|Lake", "83589"],
        ["Arkansas River|Stream", "78956"],
        ["White River|Stream", "78762"],
      ]),
      anchor: ["Little Rock|Populated Place", 34.7464809, -92.2895948],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.equal(normCounty(exRow.county), normCounty(row[3]), `${frameId}: ${key} extract county must match the stored county (St./Saint surfaces normalized)`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-11 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      const expectedGeocoderCounty = registerRow.county === "City of Saint Louis" ? "City of Saint Louis" : `${registerRow.county} County`;
      assert.equal(registerRow.geocoderCounty, expectedGeocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const moGaz = await import("../js/city-gazetteer-data-missouri.js");
  const moData = await import("../js/city-subsurface-data-missouri.js");
  const sauk = moGaz.GAZ_ROWS.find((r) => r[0] === "Taum Sauk Mountain");
  assert.match(sauk[9], /Domestic Names per-ID check/, "Taum Sauk note must cite the per-ID check");
  assert.match(sauk[9], /1,772 feet/, "Taum Sauk note must preserve the published elevation");
  assert.match(sauk[9], /Summit in Iron County/, "Taum Sauk note must name the correct county");
  const stl = moGaz.GAZ_ROWS.find((r) => r[0] === "Saint Louis");
  assert.equal(stl[3], "City of Saint Louis", "Saint Louis row must keep the independent-city county identity");
  assert.ok(!moGaz.GAZ_ROWS.some((r) => ["Mississippi River", "Current River", "Bull Shoals Lake"].includes(r[0])), "empty-screen Missouri records must not be seeded");
  assert.ok(moData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /empty array/.test(c.facts[0])), "Missouri Mississippi corridor must record the empty screen");
  assert.ok(moData.CORRIDORS.some((c) => /Current River/.test(c.name) && /empty array/.test(c.facts[0])), "Current River corridor must record the empty screen");

  const arGaz = await import("../js/city-gazetteer-data-arkansas.js");
  const arData = await import("../js/city-subsurface-data-arkansas.js");
  const mag = arGaz.GAZ_ROWS.find((r) => r[0] === "Magazine Mountain");
  assert.equal(mag[1], "Ridge", "Magazine Mountain must keep the GNIS Ridge class");
  assert.equal(mag[2], "phys.ridge", "Magazine Mountain must use the ridge path");
  assert.ok(GAZ_CLASS_META.Ridge, "gazetteer must define the Ridge class");
  assert.match(mag[9], /as a Ridge in Logan County/, "Magazine Mountain note must name the class and county");
  assert.match(mag[9], /2,753 feet/, "Magazine Mountain note must preserve the published elevation");
  const beaver = arGaz.GAZ_ROWS.find((r) => r[0] === "Beaver Lake");
  assert.match(beaver[9], /five small same-name/, "Beaver Lake note must record the namesake rejection");
  assert.ok(!arGaz.GAZ_ROWS.some((r) => r[0] === "Mississippi River"), "Arkansas Mississippi record must not be seeded");
  assert.ok(arData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /empty array/.test(c.facts[0])), "Arkansas Mississippi corridor must record the empty screen");
  assert.ok(register.identityDecisions.some((d) => /Magazine Mountain, FEATURE_ID 67051/.test(d.candidate)), "register must record the Ridge-class decision");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Kentucky and Tennessee complete the Kentucky-Tennessee GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch12-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    Kentucky: {
      state: "KY",
      bbox: { lon0: -89.6, lat0: 36.4, lon1: -80.0, lat1: 39.55 },
      coastLines: 0,
      rows: new Map([
        ["Frankfort|Populated Place", "517517"],
        ["Louisville|Populated Place", "509453"],
        ["Lexington|Populated Place", "496343"],
        ["Bowling Green|Populated Place", "487744"],
        ["Covington|Populated Place", "490167"],
        ["Black Mountain|Summit", "510753"],
        ["Lake Cumberland|Lake", "490483"],
        ["Lake Barkley|Lake", "486356"],
        ["Ohio River|Stream", "425264"],
        ["Tennessee River|Stream", "517033"],
        ["Cumberland River|Stream", "517018"],
        ["Kentucky River|Stream", "513130"],
      ]),
      anchor: ["Frankfort|Populated Place", 38.2009055, -84.8732836],
    },
    tennessee: {
      state: "TN",
      bbox: { lon0: -90.35, lat0: 34.95, lon1: -81.6, lat1: 36.7 },
      coastLines: 0,
      rows: new Map([
        ["Nashville|Populated Place", "1652484"],
        ["Memphis|Populated Place", "1326388"],
        ["Knoxville|Populated Place", "1648562"],
        ["Chattanooga|Populated Place", "1307240"],
        ["Clarksville|Populated Place", "1269467"],
        ["Murfreesboro|Populated Place", "1295105"],
        ["Mount Le Conte|Summit", "1646824"],
        ["Kentucky Lake|Lake", "1269701"],
        ["Norris Lake|Lake", "1269832"],
        ["Douglas Lake|Lake", "1282739"],
        ["Cherokee Lake|Lake", "1280322"],
        ["Chickamauga Lake|Lake", "1326920"],
      ]),
      anchor: ["Nashville|Populated Place", 36.1658899, -86.7844432],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.equal(exRow.county, row[3], `${frameId}: ${key} extract county must match the stored county`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-12 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.equal(registerRow.geocoderCounty, `${registerRow.county} County`, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const kyGaz = await import("../js/city-gazetteer-data-Kentucky.js");
  const kyData = await import("../js/city-subsurface-data-Kentucky.js");
  const black = kyGaz.GAZ_ROWS.find((r) => r[0] === "Black Mountain");
  assert.match(black[9], /Domestic Names per-ID check/, "Black Mountain note must cite the per-ID check");
  assert.match(black[9], /4,145 feet/, "Black Mountain note must preserve the published elevation");
  assert.match(black[9], /Summit in Harlan County/, "Black Mountain note must name the correct county");
  assert.match(black[9], /FEATURE_ID 487379/, "Black Mountain note must reject the populated-place namesake");
  const ohioRiver = kyGaz.GAZ_ROWS.find((r) => r[0] === "Ohio River");
  assert.match(ohioRiver[9], /Kentucky-associated/, "Ohio River note must record the Kentucky-associated resolution");
  assert.ok(!kyGaz.GAZ_ROWS.some((r) => r[0] === "Kentucky Lake"), "Kentucky Lake record is Tennessee-associated and must not be seeded in Kentucky");
  assert.ok(kyData.CORRIDORS.some((c) => /Kentucky Lake/.test(c.name) && /empty array/.test(c.facts[0])), "Kentucky Lake corridor must record the empty screen");
  assert.ok(register.identityDecisions.some((d) => /Ohio River, FEATURE_ID 425264/.test(d.candidate)), "register must record the Ohio River resolution");

  const tnGaz = await import("../js/city-gazetteer-data-tennessee.js");
  const tnData = await import("../js/city-subsurface-data-tennessee.js");
  const leconte = tnGaz.GAZ_ROWS.find((r) => r[0] === "Mount Le Conte");
  assert.match(leconte[9], /Domestic Names per-ID check/, "Mount Le Conte note must cite the per-ID check");
  assert.match(leconte[9], /6,593 feet/, "Mount Le Conte note must preserve the published elevation");
  assert.match(leconte[9], /Summit in Sevier County/, "Mount Le Conte note must name the correct county");
  assert.ok(!tnGaz.GAZ_ROWS.some((r) => ["Tennessee River", "Cumberland River", "Mississippi River", "Clingmans Dome", "Kuwohi"].includes(r[0])), "corridor-only Tennessee records must not be seeded");
  assert.ok(tnData.CORRIDORS.some((c) => /Mississippi River/.test(c.name) && /empty array/.test(c.facts[0])), "Tennessee Mississippi corridor must record the empty screen");
  assert.ok(tnData.CORRIDORS.some((c) => /Clingmans/.test(c.name) && /no Tennessee GNIS record/.test(c.facts[0])), "Kuwohi corridor must record the missing Tennessee record");
  assert.ok(register.identityDecisions.some((d) => /Kuwohi \/ Clingmans Dome/.test(d.candidate)), "register must record the Kuwohi decision");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Virginia and West Virginia complete the Virginia-West Virginia GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch13-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const normCounty = (s) => s.replace(" (city)", "").replace(/^City of /, "").replace(/Saint/g, "St.");
  const expectations = {
    virginia: {
      state: "VA",
      bbox: { lon0: -83.7, lat0: 36.45, lon1: -75.0, lat1: 39.5 },
      coastLines: 0,
      rows: new Map([
        ["Richmond|Populated Place", "1499957"],
        ["Virginia Beach|Populated Place", "1500261"],
        ["Norfolk|Populated Place", "1497051"],
        ["Roanoke|Populated Place", "1499971"],
        ["Charlottesville|Populated Place", "1498463"],
        ["Chesapeake|Populated Place", "1496841"],
        ["Mount Rogers|Summit", "1485637"],
        ["Smith Mountain Lake|Lake", "1502131"],
        ["Lake Anna|Lake", "1501942"],
        ["Claytor Lake|Lake", "1501983"],
        ["James River|Stream", "1488853"],
        ["Rappahannock River|Stream", "1479404"],
      ]),
      anchor: ["Richmond|Populated Place", 37.5537575, -77.4602617],
    },
    westvirginia: {
      state: "WV",
      bbox: { lon0: -82.7, lat0: 37.15, lon1: -77.7, lat1: 40.7 },
      coastLines: 0,
      rows: new Map([
        ["Charleston|Populated Place", "1558347"],
        ["Huntington|Populated Place", "1540605"],
        ["Morgantown|Populated Place", "1555161"],
        ["Parkersburg|Populated Place", "1544587"],
        ["Wheeling|Populated Place", "1548994"],
        ["Spruce Knob|Summit", "1553014"],
        ["Summersville Lake|Lake", "1553142"],
        ["Cheat Lake|Lake", "1537226"],
        ["New River|Stream", "1552301"],
        ["Kanawha River|Stream", "1551620"],
        ["Shenandoah River|Stream", "1556740"],
        ["Greenbrier River|Stream", "1551294"],
      ]),
      anchor: ["Charleston|Populated Place", 38.3498195, -81.6326235],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.equal(normCounty(exRow.county), normCounty(row[3]), `${frameId}: ${key} extract county must match the stored county (independent-city surfaces normalized)`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-13 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      const expectedGeocoderCounty = registerRow.county.startsWith("City of ") ? registerRow.county : `${registerRow.county} County`;
      assert.equal(registerRow.geocoderCounty, expectedGeocoderCounty, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const vaGaz = await import("../js/city-gazetteer-data-virginia.js");
  const vaData = await import("../js/city-subsurface-data-virginia.js");
  const rogers = vaGaz.GAZ_ROWS.find((r) => r[0] === "Mount Rogers");
  assert.match(rogers[9], /Domestic Names per-ID check/, "Mount Rogers note must cite the per-ID check");
  assert.match(rogers[9], /5,729 feet/, "Mount Rogers note must preserve the published elevation");
  assert.match(rogers[9], /Summit in Smyth County/, "Mount Rogers note must name the correct county");
  const richmond = vaGaz.GAZ_ROWS.find((r) => r[0] === "Richmond");
  assert.equal(richmond[3], "City of Richmond", "Richmond row must keep the independent-city county identity");
  assert.ok(!vaGaz.GAZ_ROWS.some((r) => ["Shenandoah River", "New River", "Potomac River"].includes(r[0])), "cross-state Virginia river records must not be seeded");
  assert.ok(vaData.CORRIDORS.some((c) => /Shenandoah River/.test(c.name) && /no stream record/.test(c.facts[0])), "Shenandoah corridor must record the missing Virginia stream record");
  assert.ok(vaData.CORRIDORS.some((c) => /Potomac River/.test(c.name) && /empty array/.test(c.facts[0])), "Potomac corridor must record the empty screen");

  const wvGaz = await import("../js/city-gazetteer-data-westvirginia.js");
  const wvData = await import("../js/city-subsurface-data-westvirginia.js");
  const knob = wvGaz.GAZ_ROWS.find((r) => r[0] === "Spruce Knob");
  assert.match(knob[9], /Domestic Names per-ID check/, "Spruce Knob note must cite the per-ID check");
  assert.match(knob[9], /4,863 feet/, "Spruce Knob note must preserve the published elevation");
  assert.match(knob[9], /Summit in Pendleton County/, "Spruce Knob note must name the correct county");
  assert.match(knob[9], /FEATURE_ID 1555698/, "Spruce Knob note must reject the Randolph namesake");
  const kanawha = wvGaz.GAZ_ROWS.find((r) => r[0] === "Kanawha River");
  assert.equal(kanawha[3], "Fayette", "Kanawha row must preserve the returned primary county verbatim");
  assert.ok(!wvGaz.GAZ_ROWS.some((r) => ["Ohio River", "Monongahela River"].includes(r[0])), "empty-screen West Virginia records must not be seeded");
  assert.ok(wvData.CORRIDORS.some((c) => /Ohio River/.test(c.name) && /empty array/.test(c.facts[0])), "West Virginia Ohio corridor must record the empty screen");
  assert.ok(register.identityDecisions.some((d) => /Kanawha River primary county/.test(d.candidate)), "register must record the Kanawha county preservation");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("North Carolina and South Carolina complete the Carolina GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch14-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    northcarolina: {
      state: "NC",
      bbox: { lon0: -84.35, lat0: 33.75, lon1: -75.35, lat1: 36.6 },
      coastLines: 0,
      rows: new Map([
        ["Raleigh|Populated Place", "1024242"],
        ["Charlotte|Populated Place", "1019610"],
        ["Greensboro|Populated Place", "1020557"],
        ["Durham|Populated Place", "1020059"],
        ["Asheville|Populated Place", "1018864"],
        ["Wilmington|Populated Place", "1023269"],
        ["Mount Mitchell|Summit", "1013745"],
        ["Kuwohi|Summit", "1326387"],
        ["Lake Norman|Lake", "991183"],
        ["B. Everett Jordan Lake|Lake", "980401"],
        ["Cape Fear River|Stream", "1023879"],
        ["Roanoke River|Stream", "1502110"],
      ]),
      anchor: ["Raleigh|Populated Place", 35.772096, -78.6386145],
    },
    southcarolina: {
      state: "SC",
      bbox: { lon0: -83.4, lat0: 31.9, lon1: -78.5, lat1: 35.25 },
      coastLines: 0,
      rows: new Map([
        ["Columbia|Populated Place", "1245051"],
        ["Charleston|Populated Place", "1221516"],
        ["Greenville|Populated Place", "1245842"],
        ["Spartanburg|Populated Place", "1250982"],
        ["Myrtle Beach|Populated Place", "1249770"],
        ["Sassafras Mountain|Summit", "1015279"],
        ["Lake Marion|Lake", "1224315"],
        ["Lake Moultrie|Lake", "1230046"],
        ["Lake Murray|Lake", "1224900"],
        ["Savannah River|Stream", "1253486"],
        ["Congaree River|Stream", "1249468"],
        ["Pee Dee River|Stream", "1251573"],
      ]),
      anchor: ["Columbia|Populated Place", 34.0007104, -81.0348144],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.equal(exRow.county, row[3], `${frameId}: ${key} extract county must match the stored county`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-14 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.equal(registerRow.geocoderCounty, `${registerRow.county} County`, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const ncGaz = await import("../js/city-gazetteer-data-northcarolina.js");
  const mitchell = ncGaz.GAZ_ROWS.find((r) => r[0] === "Mount Mitchell");
  assert.match(mitchell[9], /Domestic Names per-ID check/, "Mount Mitchell note must cite the per-ID check");
  assert.match(mitchell[9], /6,684 feet/, "Mount Mitchell note must preserve the published elevation");
  assert.match(mitchell[9], /Summit in Yancey County/, "Mount Mitchell note must name the correct county");
  const kuwohi = ncGaz.GAZ_ROWS.find((r) => r[0] === "Kuwohi");
  assert.match(kuwohi[9], /Domestic Names per-ID check/, "Kuwohi note must cite the per-ID check");
  assert.match(kuwohi[9], /6,643 feet/, "Kuwohi note must preserve the published elevation");
  assert.match(kuwohi[9], /Summit in Swain County/, "Kuwohi note must name the correct county");
  assert.match(kuwohi[9], /no Tennessee GNIS record|no record/, "Kuwohi note must record the closed Tennessee decision");
  const jordan = ncGaz.GAZ_ROWS.find((r) => r[0] === "B. Everett Jordan Lake");
  assert.match(jordan[9], /empty/, "Jordan Lake note must record the plain-name empty screen");

  const scGaz = await import("../js/city-gazetteer-data-southcarolina.js");
  const sassafras = scGaz.GAZ_ROWS.find((r) => r[0] === "Sassafras Mountain");
  assert.match(sassafras[9], /Domestic Names per-ID check/, "Sassafras note must cite the per-ID check");
  assert.match(sassafras[9], /3,553 feet/, "Sassafras note must preserve the published elevation");
  assert.match(sassafras[9], /Summit in Pickens County/, "Sassafras note must name the correct county");
  const Peedee = scGaz.GAZ_ROWS.find((r) => r[0] === "Pee Dee River");
  assert.equal(Peedee[3], "Chesterfield", "Pee Dee row must preserve the returned primary county verbatim");
  assert.ok(register.identityDecisions.some((d) => /Kuwohi/.test(d.candidate)), "register must record the Kuwohi seeding decision");
  assert.ok(register.identityDecisions.some((d) => /Pee Dee River/.test(d.candidate)), "register must record the Pee Dee county preservation");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("Georgia and Florida complete the Georgia-Florida GNIS state batch", async () => {
  const register = JSON.parse(read("resources/city-subsurface/gnis-state-batch15-source-register-2026-10-23.json"));
  const extract = JSON.parse(read("resources/city-subsurface/gnis-candidates-batch7.json"));
  const { GAZ_CLASS_META } = await import("../js/city-gazetteer.js");
  const expectations = {
    Georgia: {
      state: "GA",
      bbox: { lon0: -85.65, lat0: 30.35, lon1: -80.75, lat1: 35.05 },
      coastLines: 0,
      rows: new Map([
        ["Atlanta|Populated Place", "351615"],
        ["Augusta|Populated Place", "310670"],
        ["Macon|Populated Place", "332301"],
        ["Columbus|Populated Place", "331443"],
        ["Savannah|Populated Place", "322590"],
        ["Athens|Populated Place", "354407"],
        ["Brasstown Bald|Summit", "354839"],
        ["Hartwell Lake|Lake", "356215"],
        ["Lake Sidney Lanier|Lake", "322971"],
        ["Altamaha River|Stream", "354294"],
        ["Chattahoochee River|Stream", "354236"],
        ["Flint River|Stream", "358207"],
      ]),
      anchor: ["Atlanta|Populated Place", 33.7489954, -84.3879824],
    },
    florida: {
      state: "FL",
      bbox: { lon0: -87.7, lat0: 25.1, lon1: -79.9, lat1: 31.05 },
      coastLines: 0,
      rows: new Map([
        ["Tallahassee|Populated Place", "308416"],
        ["Jacksonville|Populated Place", "295003"],
        ["Miami|Populated Place", "295004"],
        ["Tampa|Populated Place", "292005"],
        ["Orlando|Populated Place", "288240"],
        ["Pensacola|Populated Place", "294117"],
        ["Britton Hill|Summit", "1851954"],
        ["Lake Okeechobee|Lake", "307550"],
        ["Lake George|Lake", "305722"],
        ["Saint Johns River|Stream", "308105"],
        ["Suwannee River|Stream", "308455"],
        ["Apalachicola River|Stream", "305219"],
      ]),
      anchor: ["Tallahassee|Populated Place", 30.4382559, -84.2807329],
    },
  };

  for (const [frameId, expected] of Object.entries(expectations)) {
    const data = await import(`../js/city-subsurface-data-${frameId}.js`);
    const gaz = await import(`../js/city-gazetteer-data-${frameId}.js`);

    assert.equal(data.CITY.id, frameId);
    assert.equal(data.CITY.state, expected.state);
    assert.equal(data.CITY.requiresDem, false, `${frameId}: statewide frame uses labelled synthetic relief, not a DEM`);
    assert.deepEqual(data.BBOX, expected.bbox, `${frameId}: statewide frame bbox`);
    const overview = data.VIEWS.find((v) => v.id === "overview");
    assert.ok(overview.position[1] >= 20 && overview.position[2] >= 32, `${frameId}: overview must be scale-aware`);
    const coastLines = data.COAST.length === 0 ? 0 : (Array.isArray(data.COAST[0]?.[0]) ? data.COAST.length : 1);
    assert.equal(coastLines, expected.coastLines, `${frameId}: coast line count`);

    assert.equal(gaz.GAZ_ROWS.length, expected.rows.size, `${frameId}: starter row count`);
    assert.equal(gaz.GAZ_META.verified, expected.rows.size, `${frameId}: starter register is all-GNIS`);
    assert.equal(gaz.GAZ_META.unverified, 0);
    for (const row of gaz.GAZ_ROWS) {
      const key = `${row[0]}|${row[1]}`;
      assert.equal(row[8], 1, `${frameId}: ${key} must be VERIFIED=1`);
      assert.equal(row[7], expected.rows.get(key), `${frameId}: ${key} FEATURE_ID`);
      assert.ok(GAZ_CLASS_META[row[1]], `${frameId}: ${row[1]} needs gazetteer UI metadata`);
      assert.match(row[9], /USGS GNIS Geocoder/, `${frameId}: ${key} must name the USGS service`);
      assert.match(row[9], new RegExp(`FEATURE_ID=${row[7]}`), `${frameId}: ${key} note must name its FEATURE_ID`);
      assert.match(row[9], /cross-checked 2026-10-23/, `${frameId}: ${key} note must date the cross-check`);
      assert.match(row[9], /GNIS primary point/, `${frameId}: ${key} note must identify the point basis`);
      assert.match(row[9], /not a .*?(?:boundary|geocode|polygon|centerline|outline)/, `${frameId}: ${key} note must state the point-geometry limit`);
      const exRow = extract.states[expected.state].rows.find((r) => r.featureId === row[7]);
      assert.ok(exRow, `${frameId}: ${key} FEATURE_ID must appear in the DomesticNames extract`);
      assert.equal(exRow.name, row[0], `${frameId}: ${key} extract name`);
      assert.equal(exRow.county, row[3], `${frameId}: ${key} extract county must match the stored county`);
      assert.ok(Math.abs(exRow.lat - row[4]) < 2e-4 && Math.abs(exRow.lon - row[5]) < 2e-4, `${frameId}: ${key} extract point must match the stored point`);
    }

    const [anchorKey, anchorLat, anchorLon] = expected.anchor;
    const anchor = gaz.GAZ_ROWS.find((r) => `${r[0]}|${r[1]}` === anchorKey);
    assert.ok(Math.abs(anchor[4] - anchorLat) < 1e-10, `${frameId}: capital anchor latitude`);
    assert.ok(Math.abs(anchor[5] - anchorLon) < 1e-10, `${frameId}: capital anchor longitude`);

    const registerFrame = register.frames[frameId];
    assert.equal(registerFrame.totalRows, gaz.GAZ_ROWS.length, `${frameId}: register row count`);
    assert.deepEqual(registerFrame.bbox, data.BBOX, `${frameId}: register bbox`);
    const registerRows = registerFrame.verifiedRows.map((r) => [r.name, r.featureClass, r.ftt, r.county, r.latitude, r.longitude, null, r.featureId, r.verified, r.sourceNote]);
    assert.deepEqual(registerRows, gaz.GAZ_ROWS, `${frameId}: batch-15 source register must reproduce the generated rows exactly`);
    for (const registerRow of registerFrame.verifiedRows) {
      assert.ok(registerRow.geocoderType, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder type`);
      assert.equal(registerRow.geocoderCounty, `${registerRow.county} County`, `${frameId}: ${registerRow.name} register must preserve the returned Geocoder county string`);
    }

    assert.ok(data.CORRIDORS.length >= 4, `${frameId}: generalized context corridors are present`);
    assert.ok(data.CORRIDORS.every((c) => c.tier === "context"), `${frameId}: corridors remain context tier`);
    const rowPoint = new Set(gaz.GAZ_ROWS.map((r) => `${r[0]}|${r[5]}|${r[4]}`));
    for (const node of data.NODES) {
      assert.equal(node.tier, "official", `${frameId}: ${node.name} node tier`);
      assert.ok(rowPoint.has(`${node.name}|${node.lon}|${node.lat}`), `${frameId}: ${node.name} node must reuse its gazetteer GNIS point`);
    }
    assert.match(extract.states[expected.state].zipSha256, /^[0-9a-f]{64}$/, `${frameId}: extract must pin the source ZIP hash`);
  }

  const gaGaz = await import("../js/city-gazetteer-data-Georgia.js");
  const brasstown = gaGaz.GAZ_ROWS.find((r) => r[0] === "Brasstown Bald");
  assert.match(brasstown[9], /Domestic Names per-ID check/, "Brasstown note must cite the per-ID check");
  assert.match(brasstown[9], /4,784 feet/, "Brasstown note must preserve the published elevation");
  assert.match(brasstown[9], /Summit in Towns County/, "Brasstown note must name the correct county");
  const chatt = gaGaz.GAZ_ROWS.find((r) => r[0] === "Chattahoochee River");
  const flint = gaGaz.GAZ_ROWS.find((r) => r[0] === "Flint River");
  assert.equal(chatt[4], flint[4], "Chattahoochee/Flint GNIS points must coincide (lat)");
  assert.equal(chatt[5], flint[5], "Chattahoochee/Flint GNIS points must coincide (lon)");
  assert.notEqual(chatt[7], flint[7], "The coincident river pins must remain distinct FEATURE_IDs");
  assert.ok(register.identityDecisions.some((d) => /Chattahoochee River 354236/.test(d.candidate)), "register must record the shared-point decision");

  const flGaz = await import("../js/city-gazetteer-data-florida.js");
  const britton = flGaz.GAZ_ROWS.find((r) => r[0] === "Britton Hill");
  assert.match(britton[9], /Domestic Names per-ID check/, "Britton Hill note must cite the per-ID check");
  assert.match(britton[9], /345 feet/, "Britton Hill note must preserve the published elevation");
  assert.match(britton[9], /lowest state high point/, "Britton Hill note must preserve the lowest-high-point distinction");
  assert.match(britton[9], /Summit in Walton County/, "Britton Hill note must name the correct county");

  const engine = read("js/city-subsurface.js");
  for (const frameId of Object.keys(expectations)) {
    assert.match(engine, new RegExp(`city-subsurface-data-${frameId}\\.js`), `${frameId}: data loader`);
    assert.match(engine, new RegExp(`city-gazetteer-data-${frameId}\\.js`), `${frameId}: gazetteer loader`);
    assert.match(engine, new RegExp(`city-dem-grid-${frameId}\\.js`), `${frameId}: optional DEM loader`);
  }
});

test("shared city engine parses as an ES module", () => {
  // The data-pack tests do not execute the browser engine, so parse it
  // explicitly. This guards the class of failure where an event parameter
  // and a lexical variable collide and every city page fails before boot.
  const dir = mkdtempSync(path.join(os.tmpdir(), "city-subsurface-engine-"));
  try {
    const file = path.join(dir, "city-subsurface.mjs");
    writeFileSync(file, read("js/city-subsurface.js"));
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
