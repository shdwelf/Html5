// S5: incident/camera/fire layer normalizers.
// All fixtures below are SYNTHETIC records shaped like the public
// services in docs/s5-live-layers-inventory-2026-10-25.md — no live
// record is bundled (fetching is F3 runner/relay work).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRecord, normalizeFeed, fromArcgisPoint, nearby,
} from "../js/incident-adapters.js";

const NOW = Date.parse("2026-10-25T12:00:00Z");
const rec = (over = {}) => ({
  id: "syn-1", kind: "incident", title: "Synthetic test incident",
  lat: 34.05, lon: -118.24, updatedEpochMs: NOW - 60_000,
  sourceId: "synthetic-fixture", ...over,
});

test("a well-formed record passes through canonicalized", () => {
  const rejected = [];
  const f = normalizeRecord(rec({ url: "https://example.invalid/x" }), rejected);
  assert.equal(rejected.length, 0);
  assert.equal(f.kind, "incident");
  assert.equal(f.url, "https://example.invalid/x");
});

test("invalid records are rejected with reasons, never NaN features", () => {
  const rejected = [];
  assert.equal(normalizeRecord(rec({ lat: 0, lon: 0 }), rejected), null);
  assert.equal(normalizeRecord(rec({ id: "" }), rejected), null);
  assert.equal(normalizeRecord(rec({ kind: "ufo" }), rejected), null);
  assert.equal(normalizeRecord(rec({ updatedEpochMs: NaN }), rejected), null);
  assert.deepEqual(rejected.map(r => r.reason), [
    "coordinates are the (0,0) placeholder",
    "missing id",
    "unknown kind: ufo",
    "updatedEpochMs not finite",
  ]);
});

test("feed dedupes by id keeping the newest, and drops stale records loudly", () => {
  const { features, rejected } = normalizeFeed([
    rec({ title: "old copy", updatedEpochMs: NOW - 5000 }),
    rec({ title: "new copy", updatedEpochMs: NOW - 1000 }),
    rec({ id: "syn-2", updatedEpochMs: NOW - 10 * 60_000 }),
  ], { nowEpochMs: NOW, maxAgeMs: 5 * 60_000 });
  assert.equal(features.length, 1);
  assert.equal(features[0].title, "new copy");
  assert.deepEqual(rejected.map(r => r.reason), ["stale: older than maxAgeMs"]);
});

test("ArcGIS point adapter maps WFIGS-shaped features via the field map", () => {
  const feature = {
    attributes: { OBJECTID: 42, IncidentName: "Synthetic Fire", ModifiedOnDateTime_dt: NOW - 1000 },
    geometry: { x: -118.5, y: 34.1 },
  };
  const fields = { id: "OBJECTID", title: "IncidentName", updated: "ModifiedOnDateTime_dt" };
  const raw = fromArcgisPoint(feature, { kind: "fire", sourceId: "wfigs-fixture", fields });
  const f = normalizeRecord(raw, []);
  assert.equal(f.id, "42");
  assert.equal(f.kind, "fire");
  assert.equal(f.lat, 34.1);
  assert.equal(f.lon, -118.5);
});

test("nearby filters by kind and radius, nearest first, with distances", () => {
  const features = [
    normalizeRecord(rec({ id: "a", lat: 34.05, lon: -118.24 }), []),
    normalizeRecord(rec({ id: "b", kind: "camera", lat: 34.4, lon: -118.5 }), []),
    normalizeRecord(rec({ id: "c", kind: "camera", lat: 40.0, lon: -120.0 }), []),
  ];
  const out = nearby(features, { lat: 34.05, lon: -118.24 }, 50, "camera");
  assert.deepEqual(out.map(f => f.id), ["b"]);
  assert.ok(out[0].distanceKm > 40 && out[0].distanceKm < 55);
});
