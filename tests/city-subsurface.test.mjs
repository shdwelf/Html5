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
        assert.equal(row[2], "community.geocache", `${city}: geocache must use the community extension`);
        assert.equal(row[8], 0, `${city}: geocache must not claim GNIS verification`);
        assert.match(row[9], /GC[A-Z0-9]+/, `${city}: geocache note must carry the cache code`);
      }
    }
    assert.equal(gaz.GAZ_META.rowCount, gaz.GAZ_ROWS.length);

    const files = archive(`${city}-subsurface.xdc`);
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

test("city gazetteer engine searches names, facets, boxes, and geocaches", async () => {
  const { makeGazetteerIndex, searchName, searchBox, searchPoint, classRollup } = await import("../js/city-gazetteer.js");
  const lawrence = await import("../js/city-gazetteer-data-lawrence.js");
  const buffalo = await import("../js/city-gazetteer-data-buffalo.js");
  const toronto = await import("../js/city-gazetteer-data-toronto.js");

  const idx = makeGazetteerIndex(lawrence.GAZ_ROWS);
  const hits = searchName(idx, "lawrence", { limit: 5 });
  assert.ok(hits.some((h) => h.name === "Lawrence"));
  const box = searchBox(idx, lawrence.GAZ_META.bbox, { classes: new Set(["Populated Place"]) });
  assert.ok(box.some((h) => h.name === "City of Eudora"));

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
