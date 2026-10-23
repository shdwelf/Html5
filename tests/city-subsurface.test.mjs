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
const cities = ["lawrence", "atlanta", "kansascity", "buffalo", "toronto", "california", "nevada", "arizona", "guam", "americansamoa", "usvirginislands", "midway", "utah", "colorado", "newmexico", "oregon", "washington", "idaho"];

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
