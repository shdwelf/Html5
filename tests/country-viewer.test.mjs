import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { unzipSync } from "../vendor/fflate/index.mjs";

const read = (p) => readFileSync(p, "utf8");
const REGISTER = "resources/country-viewer/country-factbook-batch3-source-register-2026-10-25.json";

test("country viewer dataset reproduces the pinned full-coverage Factbook register", async () => {
  const register = JSON.parse(read(REGISTER));
  const data = await import("../js/country-data.js");

  assert.match(register.upstream.commit, /^[0-9a-f]{40}$/, "register must pin a full upstream commit SHA");
  assert.equal(register.upstream.repo, "https://github.com/factbook/factbook.json");
  assert.equal(register.counts.seeded, register.countries.length, "register seeded count must match its country list");
  assert.ok(Array.isArray(register.skipped) && register.skipped.length > 0, "register must document skipped profiles");
  for (const s of register.skipped) {
    assert.ok(s.factbookPath && Array.isArray(s.missing) && s.missing.length > 0,
      "each skipped profile must name what it was missing (auditable coverage)");
  }
  assert.equal(data.COUNTRY_DATA_META.upstreamCommit, register.upstream.commit);
  assert.equal(data.COUNTRY_DATA_META.count, register.countries.length);
  assert.equal(data.COUNTRIES.length, register.countries.length);
  assert.ok(data.COUNTRIES.length >= 200, "batch C2 must be full-coverage scale, not the batch-1 seed");

  // Batch C3 completion: of the 18 batch-2 skips, the 17 whose source
  // publishes a name + reference point are seeded (capital fields standing
  // empty as published). The one remaining skip is the European Union
  // profile (europe/ee.json), which publishes neither a conventional name
  // nor a country reference point - seeding it would invent identity.
  assert.equal(register.skipped.length, 1, "batch C3 leaves exactly one auditable skip");
  assert.deepEqual(register.skipped[0],
    { factbookPath: "europe/ee.json", code: "ee", missing: ["name", "coords"] });
  const byCode = new Map(data.COUNTRIES.map((c) => [c.code, c]));
  for (const code of ["wi", "at", "cr", "tl", "um", "wq", "bq", "hk", "mc", "pf", "pg", "jn", "gz", "we", "ip", "sx"]) {
    const c = byCode.get(code);
    assert.ok(c, `${code}: batch-2 capital-less skip is seeded in batch C3`);
    assert.equal(c.capital.name, "", `${code}: capital name stands empty as published`);
    assert.deepEqual([c.capital.lat, c.capital.lon], [null, null], `${code}: no capital coordinates published`);
  }
  const HongKong = byCode.get("hk");
  assert.equal(HongKong.name, "Hong Kong");
  assert.deepEqual([HongKong.lat, HongKong.lon], [22.25, 114.1667], "hk: verbatim reference point");
  const Nauru = byCode.get("nr");
  assert.match(Nauru.capital.name, /Yaren District/, "nr: verbatim capital note (no coordinates published)");
  assert.deepEqual([Nauru.capital.lat, Nauru.capital.lon], [null, null]);

  for (const [i, c] of register.countries.entries()) {
    const d = data.COUNTRIES[i];
    assert.match(c.fileSha256, /^[0-9a-f]{64}$/, `${c.code}: upstream file must be hash-pinned`);
    assert.equal(d.code, c.code);
    assert.equal(d.name, c.name, `${c.code}: name`);
    assert.equal(d.capital.name, c.capital.name, `${c.code}: capital`);
    assert.deepEqual([d.capital.lat, d.capital.lon], c.capital.coords ?? [null, null], `${c.code}: capital coords`);
    assert.deepEqual([d.lat, d.lon], c.coords, `${c.code}: reference point`);
    assert.equal(d.areaTotalSqKm, c.areaTotalSqKm, `${c.code}: area`);
    assert.equal(d.population, c.population, `${c.code}: population`);
    assert.equal(d.anthemTitle, c.anthem.title, `${c.code}: anthem title`);

    assert.ok(d.lat >= -90 && d.lat <= 90 && d.lon >= -180 && d.lon <= 180, `${c.code}: reference point in range`);
    if (d.capital.lat !== null) {
      assert.ok(d.capital.lat >= -90 && d.capital.lat <= 90, `${c.code}: capital latitude in range`);
    }
    assert.ok(d.areaTotalSqKm === null || d.areaTotalSqKm >= 0, `${c.code}: area non-negative when published (Holy See publishes a rounded total of 0)`);
    assert.ok(d.population === null || d.population > 0, `${c.code}: population positive when published`);
    assert.equal(typeof d.anthemTitle, "string", `${c.code}: anthem title is a (possibly empty) published string`);
    assert.equal(typeof d.governmentType, "string", `${c.code}: government type is a (possibly empty) published string`);
  }

  // The batch-1 seed countries survive into full coverage with anthems intact.
  for (const code of ["us", "ca", "fr", "ja", "as"]) {
    const c = data.COUNTRIES.find((x) => x.code === code);
    assert.ok(c && c.anthemTitle.length > 0, `${code}: seed country keeps its anthem note`);
  }
});

test("country viewer helpers and page wiring", async () => {
  const { filterCountries, searchGazetteerPoints, project, formatInt, sortByName, capitalText } = await import("../js/country-viewer.js");
  const { COUNTRIES } = await import("../js/country-data.js");

  // Capital-less profiles (batch C3) render honest labels, never placeholders.
  assert.equal(capitalText(COUNTRIES.find((c) => c.code === "hk")),
    "none published (source profile lists no capital)");
  assert.match(capitalText(COUNTRIES.find((c) => c.code === "nr")), /Yaren District \(no coordinates published\)/);
  assert.match(capitalText(COUNTRIES.find((c) => c.code === "ca")), /^Ottawa \(/);

  assert.equal(filterCountries(COUNTRIES, "").length, COUNTRIES.length);
  assert.equal(filterCountries(COUNTRIES, "ottawa")[0].code, "ca");
  assert.ok(filterCountries(COUNTRIES, "US").some((c) => c.code === "us"), "code search must find the US entry");
  assert.deepEqual(searchGazetteerPoints(""), []);
  const lawrence = searchGazetteerPoints("Lawrence").find((p) => p.name === "Lawrence");
  assert.ok(lawrence?.verified && lawrence.gnis, "official GNIS result is searchable and keeps its ID");
  const atlanta = searchGazetteerPoints("Atlanta").find((p) => p.name === "Atlanta");
  assert.ok(atlanta && !atlanta.verified && !atlanta.gnis, "reference rows are not mislabeled as GNIS IDs");
  assert.deepEqual(project(-180, 90, 960, 480), [0, 0]);
  assert.deepEqual(project(180, -90, 960, 480), [960, 480]);
  assert.deepEqual(project(0, 0, 960, 480), [480, 240]);
  assert.equal(formatInt(39187155), "39,187,155");
  assert.equal(formatInt(null), "—");
  assert.equal(sortByName(COUNTRIES)[0].name, "Afghanistan");

  const html = read("country-viewer.html");
  assert.match(html, /js\/country-viewer\.js/, "page must load the viewer module");
  assert.match(html, /PC-Globe style/i, "page must identify the PC-Globe idiom");
  assert.match(html, /id="world"/, "page must carry the map canvas");
  assert.match(html, /id="gazSearch"/, "the country viewer exposes Gazetteer search");
  assert.match(html, /id="gazResults"/, "Gazetteer search results are present");
  assert.match(html, /id="gazDetail"/, "a selected Gazetteer point has an inspector");
  assert.match(html, /Only rows marked GNIS/, "non-GNIS reference coordinates stay clearly labeled");
  assert.match(html, /id="sourcepin"/, "page must surface the source pin");
});

test("country outlines render from local Natural Earth data with island-focused views", async () => {
  const { MAP_VIEWS, projectMapPoint, drawCountryOutlines, nearestCountryAt } = await import("../js/country-map.js");
  const geojson = JSON.parse(read("vendor/world/countries.geo.json"));
  assert.equal(geojson.type, "FeatureCollection");
  assert.equal(geojson.features.length, 180);
  assert.ok(MAP_VIEWS.caribbean.scale > MAP_VIEWS.world.scale);
  assert.ok(MAP_VIEWS.pacific.scale > MAP_VIEWS.world.scale);
  assert.deepEqual(projectMapPoint(0, 0, 960, 480, MAP_VIEWS.world), [480, 240]);
  const pacificDateLinePoint = projectMapPoint(-170, 0, 960, 480, MAP_VIEWS.pacific);
  assert.ok(pacificDateLinePoint[0] > 480, "wrapped longitudes should stay near the Pacific center");
  assert.equal(nearestCountryAt(480, 240, [{ name: "center", lon: 0, lat: 0 }], 960, 480, MAP_VIEWS.world)?.name, "center");

  let strokes = 0;
  const context = {
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, moveTo() {}, lineTo() {},
    stroke() { strokes += 1; },
  };
  const count = drawCountryOutlines(context, geojson, 960, 480, MAP_VIEWS.world);
  assert.equal(count, 180);
  assert.ok(strokes > 180, "polygon and multipolygon rings are stroked as outlines");

  const html = read("country-viewer.html");
  for (const view of ["world", "europe", "caribbean", "pacific"]) {
    assert.match(html, new RegExp(`data-map-view="${view}"`));
  }
  assert.match(html, /Zoom to selected/);
  assert.match(html, /Natural Earth country outlines are public domain/);
});

test("country viewer Webxdc bundle carries the offline app and outline license", () => {
  assert.ok(existsSync("country-viewer.xdc"), "country-viewer.xdc must be built (npm run build:country-viewer)");
  const entries = unzipSync(new Uint8Array(readFileSync("country-viewer.xdc")));
  const names = Object.keys(entries).sort();
  assert.deepEqual(names, [
    "index.html",
    "js/city-gazetteer-data-atlanta.js",
    "js/city-gazetteer-data-buffalo.js",
    "js/city-gazetteer-data-kansascity.js",
    "js/city-gazetteer-data-lawrence.js",
    "js/city-gazetteer-data-toronto.js",
    "js/city-gazetteer-data.js",
    "js/city-gazetteer.js",
    "js/country-data.js",
    "js/country-map.js",
    "js/country-viewer.js",
    "manifest.toml",
    "vendor/world/README.md",
    "vendor/world/UNLICENSE",
    "vendor/world/countries.geo.json",
    "webxdc.js",
  ].sort());
  const manifest = new TextDecoder().decode(entries["manifest.toml"]);
  assert.match(manifest, /Country Viewer/, "manifest must name the app");
  const index = new TextDecoder().decode(entries["index.html"]);
  assert.match(index, /COUNTRY VIEWER/, "bundle index must be the country viewer page");
});
