/**
 * Local-only S5 snapshot importer for the Planet Viewer's globe.
 *
 * Accepts a small canonical JSON export chosen by the user. No network I/O,
 * no persistence, no remote media/link loading. A dated import is an offline
 * snapshot, never a claim to show current agency feeds. Raw CAD HTML, live
 * API responses, and ArcGIS projected coordinates are not accepted here;
 * they must first be normalized by an authorized F3 runner.
 */
import { LAYER_KINDS, normalizeFeed, normalizeRecord } from "./incident-adapters.js";

export const INCIDENT_SNAPSHOT_SCHEMA = "html5-incident-snapshot-v1";
export const MAX_SNAPSHOT_BYTES = 1_048_576;
export const MAX_SNAPSHOT_RECORDS = 2_000;
export const DYNAMIC_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const DYNAMIC_KINDS = new Set(["incident", "fire", "camera", "notam"]);
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/** Validate a canonical snapshot and report each invalid/stale record. */
export function parseIncidentSnapshot(text, { nowEpochMs = Date.now() } = {}) {
  if (typeof text !== "string") throw new TypeError("snapshot must be JSON text");
  if (!Number.isFinite(nowEpochMs)) throw new TypeError("nowEpochMs must be finite");
  if (new TextEncoder().encode(text).length > MAX_SNAPSHOT_BYTES) {
    throw new RangeError("snapshot exceeds 1 MiB limit");
  }

  let snapshot;
  try {
    snapshot = JSON.parse(text);
  } catch {
    throw new Error("invalid snapshot JSON");
  }
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)
      || snapshot.schema !== INCIDENT_SNAPSHOT_SCHEMA) {
    throw new Error(`expected schema ${INCIDENT_SNAPSHOT_SCHEMA}`);
  }
  if (typeof snapshot.capturedAt !== "string" || !UTC_INSTANT.test(snapshot.capturedAt)) {
    throw new Error("capturedAt must be an ISO-8601 UTC instant");
  }
  const capturedAtEpochMs = Date.parse(snapshot.capturedAt);
  if (!Number.isFinite(capturedAtEpochMs)) throw new Error("invalid capturedAt instant");
  if (capturedAtEpochMs > nowEpochMs + CLOCK_SKEW_MS) {
    throw new Error("snapshot capture time is in the future");
  }
  if (!Array.isArray(snapshot.records)) throw new Error("records must be an array");
  if (snapshot.records.length > MAX_SNAPSHOT_RECORDS) {
    throw new RangeError("snapshot exceeds 2,000 record limit");
  }

  // Validate before deduplication: a bad/future update must not erase an
  // earlier valid record with the same agency identity. Static lookout/SDR
  // locations can be old; dynamic kinds expire after 24 hours.
  const rejected = [];
  const plausible = [];
  for (const raw of snapshot.records) {
    const feature = normalizeRecord(raw, rejected);
    if (!feature) continue;
    if (feature.updatedEpochMs > capturedAtEpochMs + CLOCK_SKEW_MS
        || feature.updatedEpochMs > nowEpochMs + CLOCK_SKEW_MS) {
      rejected.push({ id: feature.id, reason: "record updated after snapshot capture" });
    } else {
      plausible.push(feature);
    }
  }
  const { features } = normalizeFeed(plausible, { nowEpochMs });
  const deduplicatedCount = plausible.length - features.length;
  const accepted = [];
  for (const feature of features) {
    if (DYNAMIC_KINDS.has(feature.kind)
        && nowEpochMs - Math.min(feature.updatedEpochMs, capturedAtEpochMs) > DYNAMIC_MAX_AGE_MS) {
      rejected.push({ id: feature.id, reason: "stale: dynamic record or capture older than 24 hours" });
    } else {
      accepted.push(feature);
    }
  }
  return { capturedAtEpochMs, inputCount: snapshot.records.length, deduplicatedCount, features: accepted, rejected };
}

export function filterIncidentFeatures(features, kind = "all") {
  if (kind === "all") return features;
  if (!LAYER_KINDS.includes(kind)) throw new RangeError(`unknown incident kind: ${kind}`);
  return features.filter((feature) => feature.kind === kind);
}
