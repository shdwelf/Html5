import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { unzipSync } from "../vendor/fflate/index.mjs";
import {
  DATA_SOURCES,
  STORY_BEATS,
  STORY_TRACKS,
  VESSELS,
  buildSceneManifest,
  buildVrml,
  buildXenaRecord,
  formatClock,
  interpolateGeo,
  projectOrthographic,
  sampleTrack,
  storyBeatAt,
  trackPosition,
} from "../apps/red-october-command-viewer/core.js";

const root = new URL("../", import.meta.url);
const htmlPath = new URL("../apps/red-october-command-viewer/index.html", import.meta.url);
const appHtml = readFileSync(htmlPath, "utf8");

test("the narrative timeline and time scales are ordinal or current wall clock, never story timestamps", () => {
  assert.equal(STORY_BEATS.length, 6);
  assert.equal(storyBeatAt(0).id, "patrol");
  assert.equal(storyBeatAt(0.2).id, "departure");
  assert.equal(storyBeatAt(1).id, "resolution");
  const fixed = new Date("2026-10-09T20:00:00.000Z");
  assert.match(formatClock("story", fixed, 0.42), /CHAPTER 03 \/ 06/);
  assert.equal(formatClock("utc", fixed, 0), "2026-10-09T20:00:00Z");
  assert.equal(formatClock("unix", fixed, 0), "1791576000 s · 1791576000000 ms");
  assert.equal(formatClock("julian", fixed, 0), "2461323.33333");
  assert.throws(() => formatClock("tai", fixed, 0), /Unsupported time scale/);
});

test("orthographic projection and spherical interpolation behave at globe boundaries", () => {
  const center = projectOrthographic(0, 0, 0, 0);
  assert.equal(center.visible, true);
  assert.ok(Math.abs(center.x) < 1e-12);
  assert.ok(Math.abs(center.y) < 1e-12);
  assert.ok(Math.abs(center.z - 1) < 1e-12);
  assert.equal(projectOrthographic(0, 180, 0, 0).visible, false);

  const halfway = interpolateGeo({ lat: 0, lon: 179 }, { lat: 0, lon: -179 }, 0.5);
  assert.ok(Math.abs(halfway.lat) < 1e-8);
  assert.ok(Math.abs(Math.abs(halfway.lon) - 180) < 1e-6);
  const midTrack = trackPosition(STORY_TRACKS["red-october"], 0.5);
  assert.ok(Number.isFinite(midTrack.lat) && Number.isFinite(midTrack.lon));
  const route = sampleTrack(STORY_TRACKS["red-october"], 0.5, 8);
  assert.ok(route.length > 8);
  assert.ok(Math.abs(route.at(-1).lat - midTrack.lat) < 1e-8);
});

test("VRML exports are syntactically headed and make their schematic scale explicit", () => {
  for (const vessel of VESSELS) {
    const model = buildVrml(vessel.id);
    assert.match(model, /^#VRML V2\.0 utf8/);
    assert.match(model, /normalized display units only/);
    assert.match(model, /IndexedFaceSet/);
    assert.doesNotMatch(model, /undefined|null/);
  }
  const xray = buildVrml("red-october", { xray: true, wireframe: true });
  assert.match(xray, /IndexedLineSet/);
  assert.match(xray, /generic inner volume · not an internal layout/);
  assert.match(xray, /transparency 0\.52/);
  assert.throws(() => buildVrml("not-a-vessel"), /Unknown vessel/);
});

test("Xena XML embeds the exact VRML bytes using the documented Xena and Binary namespaces", () => {
  const sceneText = buildVrml("dallas", { xray: true });
  const xml = buildXenaRecord({ vesselId: "dallas", sceneText, createdAt: "2026-10-09T20:00:00.000Z" });
  const parsed = new JSDOM(xml, { contentType: "application/xml" });
  try {
    const doc = parsed.window.document;
    assert.equal(doc.documentElement.localName, "xena");
    assert.equal(doc.documentElement.namespaceURI, "http://preservation.naa.gov.au/xena/1.0");
    assert.equal(doc.getElementsByTagName("normaliser_name")[0].textContent, "au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser");
    const binary = doc.getElementsByTagNameNS("http://preservation.naa.gov.au/binary-object/1.0", "binary-object")[0];
    assert.ok(binary, "the binary-object schema namespace is present");
    assert.equal(Buffer.from(binary.textContent.replace(/\s+/g, ""), "base64").toString("utf8"), sceneText);
  } finally {
    parsed.window.close();
  }
});

test("scene manifest disclaims coordinates, real tracks, operational data, and internal plans", () => {
  const record = buildSceneManifest({ vesselId: "red-october", progress: 0.81, createdAt: "2026-10-09T20:00:00.000Z", sceneSha256: "a".repeat(64) });
  assert.equal(record.scene.coordinatesAsserted, false);
  assert.equal(record.scene.historicalTrack, false);
  assert.equal(record.scene.operationalData, false);
  assert.equal(record.scene.internalArrangementClaimed, false);
  assert.equal(record.scene.storyBeatId, "deception");
  assert.equal(record.artifact.sha256, "a".repeat(64));
  assert.ok(DATA_SOURCES.some((source) => source.url.includes("archive.org")));
  assert.ok(DATA_SOURCES.some((source) => /Jane’s Defence Weekly exact-title/.test(source.label) && source.note.includes("zero records")));
  assert.ok(DATA_SOURCES.some((source) => source.url.includes("web.archive.org") && source.note.includes("SC-21")));
  assert.ok(DATA_SOURCES.some((source) => source.url === "https://trid.trb.org/View/427904" && source.note.includes("presumed")));
  assert.ok(DATA_SOURCES.some((source) => source.url.includes("bulletin-of-the-atomic-scientists_january-february-1987") && source.note.includes("access-restricted")));
  assert.ok(DATA_SOURCES.some((source) => source.url === "https://thebulletin.org/nuclear-notebook/"));
  assert.match(appHtml, /Archive\.org \/ Jane’s \/ Bulletin source audit/);
  assert.match(appHtml, /not real submarine track data/);
  assert.match(appHtml, /precise internal layout/);
});

test("the generated Webxdc contains every offline runtime asset and its data notice", () => {
  const xdc = readFileSync(new URL("../red-october-command-viewer.xdc", import.meta.url));
  const files = unzipSync(new Uint8Array(xdc));
  for (const name of [
    "index.html",
    "app.js",
    "core.js",
    "world-countries.geo.json",
    "manifest.toml",
    "icon.png",
    "webxdc.js",
    "THIRD_PARTY_NOTICES.md",
    "data-sources/UNLICENSE",
    "data-sources/archive-research.md",
  ]) assert.ok(files[name], `missing XDC entry ${name}`);
  const bundleHtml = new TextDecoder().decode(files["index.html"]);
  assert.match(bundleHtml, /\.\/app\.js/);
  assert.match(bundleHtml, /\.\/webxdc\.js/);
  const notices = new TextDecoder().decode(files["THIRD_PARTY_NOTICES.md"]);
  const archiveAudit = new TextDecoder().decode(files["data-sources/archive-research.md"]);
  assert.match(notices, /No Archive\.org game binary/);
  assert.match(notices, /Jane’s\/Bulletin issue scan or article text/);
  assert.match(notices, /archive-research\.md/);
  assert.match(archiveAudit, /TRID record/);
  assert.match(archiveAudit, /access-restricted-item=true/);
  assert.match(new TextDecoder().decode(files["manifest.toml"]), /No real submarine track data/);
});
