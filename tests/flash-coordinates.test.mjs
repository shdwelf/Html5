import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scanFlashCoordinateCandidates } from "../js/flash-coordinates.js";

const root = new URL("../", import.meta.url);
const text = (path) => readFileSync(new URL(path, root), "utf8");

test("Flash printable strings produce explicit decimal coordinate candidates", () => {
  const [candidate] = scanFlashCoordinateCandidates(["lat=34.0522, lon=-118.2437"]);
  assert.equal(candidate.format, "labelled decimal");
  assert.deepEqual(candidate.candidates, [{
    latitude: 34.0522, longitude: -118.2437, order: "explicit labels",
  }]);
});

test("unlabelled decimal pairs preserve valid axis order and ambiguity", () => {
  const [latLon, lonLat, ambiguous] = scanFlashCoordinateCandidates([
    "Coordinates: 34.0522, -118.2437",
    "Coordinates: -118.2437 34.0522",
    "point=43.70,-79.40",
  ]);
  assert.equal(latLon.candidates.length, 1);
  assert.equal(latLon.candidates[0].order, "first=latitude");
  assert.equal(lonLat.candidates[0].order, "first=longitude");
  assert.equal(ambiguous.candidates.length, 2, "both numbers are in the valid latitude range");
  assert.match(ambiguous.summary, /OR/);
});

test("DMS pairs convert to decimal degrees with hemisphere signs", () => {
  const [candidate] = scanFlashCoordinateCandidates(["34° 03' 08.0\" N, 118° 14' 37.3\" W"]);
  assert.equal(candidate.format, "degrees/minutes/seconds");
  assert.ok(Math.abs(candidate.candidates[0].latitude - 34.0522222222) < 1e-9);
  assert.ok(Math.abs(candidate.candidates[0].longitude + 118.2436944444) < 1e-9);
});

test("invalid coordinates are rejected and output count is bounded", () => {
  assert.deepEqual(scanFlashCoordinateCandidates(["lat=91, lon=181", "999.00, 999.00"]), []);
  const strings = Array.from({ length: 12 }, (_, i) => `place ${i}: ${i + 1}.123, ${i + 30}.456`);
  assert.equal(scanFlashCoordinateCandidates(strings, { limit: 5 }).length, 5);
});

test("Flash UI reports the scanner's scope and disclaimer", () => {
  const app = text("js/flash-decompiler.js");
  const worker = text("sw.js");
  assert.match(app, /scanFlashCoordinateCandidates\(allStrings\)/);
  assert.match(app, /Textual coordinate candidates \(unverified\)/);
  assert.match(app, /calculated or binary-encoded coordinates are not covered/);
  assert.match(worker, /"\.\/js\/flash-coordinates\.js"/);
});
