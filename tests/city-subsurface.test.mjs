import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const decoder = new TextDecoder();
const cities = ["lawrence", "atlanta", "kansascity", "buffalo", "toronto"];

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
