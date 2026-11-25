import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeFeed } from "../js/incident-adapters.js";
import {
  DYNAMIC_MAX_AGE_MS, INCIDENT_SNAPSHOT_SCHEMA, MAX_SNAPSHOT_BYTES, MAX_SNAPSHOT_RECORDS,
  filterIncidentFeatures, parseIncidentSnapshot,
} from "../js/incident-snapshot.js";
import { visibleMarkers } from "../js/planet-globe.js";

const NOW = Date.parse("2026-11-13T12:00:00Z");
const record = (over = {}) => ({
  id: "synthetic-42", kind: "incident", title: "Synthetic dispatch record",
  lat: 34.1, lon: -118.2, updatedEpochMs: NOW - 1_000,
  sourceId: "synthetic-chp", ...over,
});
const snapshot = (records, over = {}) => JSON.stringify({
  schema: INCIDENT_SNAPSHOT_SCHEMA,
  capturedAt: new Date(NOW).toISOString(),
  records,
  ...over,
});
const parse = (data) => parseIncidentSnapshot(data, { nowEpochMs: NOW });

test("a canonical local snapshot is normalized and projected only onto the visible globe", () => {
  const out = parse(snapshot([
    record(),
    record({ id: "synthetic-sdr", sourceId: "synthetic-sdr-dir", kind: "sdr", lat: -34, lon: 62 }),
  ]));
  assert.equal(out.capturedAtEpochMs, NOW);
  assert.equal(out.inputCount, 2);
  assert.equal(out.deduplicatedCount, 0);
  assert.equal(out.rejected.length, 0);
  assert.equal(out.features.length, 2);
  assert.deepEqual(filterIncidentFeatures(out.features, "incident").map((r) => r.id), ["synthetic-42"]);
  assert.deepEqual(filterIncidentFeatures(out.features, "sdr").map((r) => r.id), ["synthetic-sdr"]);
  assert.equal(visibleMarkers(out.features, 34.1, -118.2).length, 1, "far-hemisphere receiver is hidden");
  assert.equal(visibleMarkers(out.features, -34, 62).length, 1, "globe rotation shows the other record");
});

test("identical IDs from distinct agencies or kinds do not overwrite one another", () => {
  const rows = [
    record({ title: "older", updatedEpochMs: NOW - 20_000 }),
    record({ title: "newer", updatedEpochMs: NOW - 10_000 }),
    record({ sourceId: "synthetic-wfigs", kind: "fire" }),
    record({ kind: "camera" }),
  ];
  const { features } = normalizeFeed(rows, { nowEpochMs: NOW });
  assert.equal(features.length, 3);
  assert.equal(features.find((r) => r.sourceId === "synthetic-chp" && r.kind === "incident").title, "newer");
  const parsed = parse(snapshot(rows));
  assert.equal(parsed.features.length, 3);
  assert.equal(parsed.deduplicatedCount, 1);
  assert.equal(parsed.inputCount, parsed.features.length + parsed.rejected.length + parsed.deduplicatedCount);
});

test("invalid coordinates and kind are rejected with reasons; no data is silently plotted", () => {
  const out = parse(snapshot([
    record(),
    record({ id: "null-island", lat: 0, lon: 0 }),
    record({ id: "bad-longitude", lon: 200 }),
    record({ id: "no-time", updatedEpochMs: "2026-11-13T11:59:59Z" }),
    record({ id: "unknown-kind", kind: "screenshot" }),
  ]));
  assert.equal(out.inputCount, 5);
  assert.equal(out.features.length, 1);
  assert.deepEqual(out.rejected.map((r) => r.id), ["null-island", "bad-longitude", "no-time", "unknown-kind"]);
  assert.deepEqual(out.rejected.map((r) => r.reason), [
    "coordinates are the (0,0) placeholder", "coordinates out of range", "updatedEpochMs not finite", "unknown kind: screenshot",
  ]);
});

test("dynamic records expire after 24 hours while old static lookouts and receivers remain labeled snapshots", () => {
  const stale = NOW - DYNAMIC_MAX_AGE_MS - 1;
  const out = parse(snapshot([
    record({ id: "incident", updatedEpochMs: stale }),
    record({ id: "fire", kind: "fire", updatedEpochMs: stale }),
    record({ id: "camera", kind: "camera", updatedEpochMs: stale }),
    record({ id: "notam", kind: "notam", updatedEpochMs: stale }),
    record({ id: "lookout", kind: "lookout", updatedEpochMs: stale }),
    record({ id: "sdr", kind: "sdr", updatedEpochMs: stale }),
  ]));
  assert.deepEqual(out.features.map((r) => r.id), ["lookout", "sdr"]);
  assert.equal(out.rejected.length, 4);
  assert.ok(out.rejected.every((r) => r.reason.startsWith("stale:")));
  const captureOld = parse(snapshot([record(), record({ id: "sdr", kind: "sdr", updatedEpochMs: stale - 1_000 })], {
    capturedAt: new Date(stale).toISOString(),
  }));
  assert.deepEqual(captureOld.features.map((r) => r.kind), ["sdr"]);
  assert.match(captureOld.rejected[0].reason, /after snapshot capture/);
});

test("future capture and updates are refused without erasing an earlier valid copy", () => {
  assert.throws(() => parse(snapshot([], { capturedAt: new Date(NOW + 6 * 60_000).toISOString() })), /capture time is in the future/);
  const out = parse(snapshot([
    record({ id: "future", updatedEpochMs: NOW - 1_000 }),
    record({ id: "future", updatedEpochMs: NOW + 6 * 60_000 }),
  ]));
  assert.equal(out.features.length, 1);
  assert.equal(out.features[0].updatedEpochMs, NOW - 1_000);
  assert.match(out.rejected[0].reason, /after snapshot capture/);
  const invalidDate = parse(snapshot([record({ updatedEpochMs: -1e100 })]));
  assert.equal(invalidDate.features.length, 0);
  assert.match(invalidDate.rejected[0].reason, /outside Date range/);
});

test("only the versioned canonical JSON shape and bounded input are accepted", () => {
  for (const bad of ["{", "null", "[]", "{}", "{\"schema\":\"not-ours\"}"]) {
    assert.throws(() => parse(bad), /invalid snapshot JSON|expected schema/);
  }
  assert.throws(() => parse(snapshot([], { capturedAt: "tomorrow" })), /ISO-8601 UTC/);
  assert.throws(() => parse(snapshot([], { records: {} })), /records must be an array/);
  assert.throws(() => parse(snapshot(Array(MAX_SNAPSHOT_RECORDS + 1).fill(null))), /2,000 record limit/);
  assert.throws(() => parse(" ".repeat(MAX_SNAPSHOT_BYTES + 1)), /1 MiB limit/);
  assert.throws(() => parseIncidentSnapshot(snapshot([]), { nowEpochMs: NaN }), /nowEpochMs must be finite/);
  assert.throws(() => filterIncidentFeatures([], "ufo"), /unknown incident kind/);
});

test("viewer only imports a user-selected local file; no incident fetch or remote media", () => {
  const page = readFileSync(new URL("../planet-viewer-4dwm.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../js/planet-viewer-4dwm.js", import.meta.url), "utf8");
  assert.match(page, /id="sensorFile"[^>]*type="file"[^>]*accept="\.json,application\/json"/);
  assert.match(js, /parseIncidentSnapshot\(await file\.text\(\)/);
  assert.doesNotMatch(js, /fetch\([^\n]*(?:cad\.chp|arcgis|kiwisdr|radio\.garden|sensorFile)/);
  assert.match(page, /No live feed is fetched/);
  assert.match(js, /textContent = feature\.title/);
});
