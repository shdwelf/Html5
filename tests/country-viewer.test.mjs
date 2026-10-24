import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const REGISTER = "resources/country-viewer/country-factbook-batch1-source-register-2026-10-24.json";

test("country viewer dataset reproduces the pinned Factbook source register", async () => {
  const register = JSON.parse(read(REGISTER));
  const data = await import("../js/country-data.js");

  assert.match(register.upstream.commit, /^[0-9a-f]{40}$/, "register must pin a full upstream commit SHA");
  assert.equal(register.upstream.repo, "https://github.com/factbook/factbook.json");
  assert.equal(data.COUNTRY_DATA_META.upstreamCommit, register.upstream.commit);
  assert.equal(data.COUNTRY_DATA_META.count, register.countries.length);
  assert.equal(data.COUNTRIES.length, register.countries.length);

  for (const [i, c] of register.countries.entries()) {
    const d = data.COUNTRIES[i];
    assert.match(c.fileSha256, /^[0-9a-f]{64}$/, `${c.code}: upstream file must be hash-pinned`);
    assert.equal(d.code, c.code);
    assert.equal(d.name, c.name, `${c.code}: name`);
    assert.equal(d.capital.name, c.capital.name, `${c.code}: capital`);
    assert.deepEqual([d.capital.lat, d.capital.lon], c.capital.coords, `${c.code}: capital coords`);
    assert.deepEqual([d.lat, d.lon], c.coords, `${c.code}: reference point`);
    assert.equal(d.areaTotalSqKm, c.areaTotalSqKm, `${c.code}: area`);
    assert.equal(d.population, c.population, `${c.code}: population`);
    assert.equal(d.anthemTitle, c.anthem.title, `${c.code}: anthem title`);

    assert.ok(d.lat >= -90 && d.lat <= 90 && d.lon >= -180 && d.lon <= 180, `${c.code}: reference point in range`);
    assert.ok(d.capital.lat >= -90 && d.capital.lat <= 90, `${c.code}: capital latitude in range`);
    assert.ok(d.areaTotalSqKm > 0, `${c.code}: positive area`);
    assert.ok(d.population > 0, `${c.code}: positive population`);
    assert.ok(d.anthemTitle.length > 0, `${c.code}: anthem title present (PC-Globe note)`);
    assert.ok(d.governmentType.length > 0, `${c.code}: government type present`);
  }
});

test("country viewer helpers and page wiring", async () => {
  const { filterCountries, project, formatInt, sortByName } = await import("../js/country-viewer.js");
  const { COUNTRIES } = await import("../js/country-data.js");

  assert.equal(filterCountries(COUNTRIES, "").length, COUNTRIES.length);
  assert.equal(filterCountries(COUNTRIES, "ottawa")[0].code, "ca");
  assert.equal(filterCountries(COUNTRIES, "US")[0].code, "us");
  assert.deepEqual(project(-180, 90, 960, 480), [0, 0]);
  assert.deepEqual(project(180, -90, 960, 480), [960, 480]);
  assert.deepEqual(project(0, 0, 960, 480), [480, 240]);
  assert.equal(formatInt(39187155), "39,187,155");
  assert.equal(formatInt(null), "—");
  const sorted = sortByName(COUNTRIES);
  assert.equal(sorted[0].name, "Argentina");

  const html = read("country-viewer.html");
  assert.match(html, /js\/country-viewer\.js/, "page must load the viewer module");
  assert.match(html, /PC-Globe style/i, "page must identify the PC-Globe idiom");
  assert.match(html, /id="world"/, "page must carry the map canvas");
  assert.match(html, /id="sourcepin"/, "page must surface the source pin");
});
