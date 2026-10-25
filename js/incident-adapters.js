/**
 * incident-adapters.js — feed-agnostic normalizers for the S5 live
 * incident / camera / sensor layers.
 *
 * One canonical feature shape for every source kind, so viewers never
 * care which CAD or camera network a record came from:
 *
 *   { id, kind, title, lat, lon, updatedEpochMs, sourceId, url? }
 *
 * kind ∈ incident | camera | fire | lookout | sdr | notam
 *
 * This module does NO network I/O. Live endpoints sit outside the
 * sandbox allowlist (standing decision F3), so fetching is runner /
 * relay work; callers hand recorded or relayed records in, and every
 * rejection is reported with a reason instead of silently dropped —
 * a layer that hides its gaps is worse than a gap. Fixtures in tests
 * are synthetic and labelled as such; no live record is bundled.
 */

export const LAYER_KINDS = Object.freeze([
  "incident", "camera", "fire", "lookout", "sdr", "notam",
]);

const EARTH_R_KM = 6371.0;

export function haversineKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function validCoords(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "coordinates not finite";
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return "coordinates out of range";
  if (lat === 0 && lon === 0) return "coordinates are the (0,0) placeholder";
  return null;
}

/**
 * Validate + canonicalize one already-shaped record. Returns the
 * feature, or null with the reason pushed onto `rejects`.
 */
export function normalizeRecord(raw, rejects = []) {
  const reject = (reason) => { rejects.push({ id: raw?.id ?? null, reason }); return null; };
  if (!raw || typeof raw !== "object") return reject("record is not an object");
  if (typeof raw.id !== "string" || raw.id === "") return reject("missing id");
  if (!LAYER_KINDS.includes(raw.kind)) return reject(`unknown kind: ${raw.kind}`);
  if (typeof raw.title !== "string" || raw.title === "") return reject("missing title");
  const bad = validCoords(raw.lat, raw.lon);
  if (bad) return reject(bad);
  if (!Number.isFinite(raw.updatedEpochMs)) return reject("updatedEpochMs not finite");
  if (typeof raw.sourceId !== "string" || raw.sourceId === "") return reject("missing sourceId");
  return {
    id: raw.id,
    kind: raw.kind,
    title: raw.title,
    lat: raw.lat,
    lon: raw.lon,
    updatedEpochMs: raw.updatedEpochMs,
    sourceId: raw.sourceId,
    ...(typeof raw.url === "string" && raw.url !== "" ? { url: raw.url } : {}),
  };
}

/**
 * Adapter for ArcGIS point features (the WFIGS/NIFC public services
 * shape): { attributes: {...}, geometry: { x, y } } with a caller-
 * supplied field map, because service field names differ per layer.
 * fields = { id, title, updated } attribute names; updated may be
 * epoch ms or an ISO string. kind/sourceId are per-layer constants.
 */
export function fromArcgisPoint(feature, { kind, sourceId, fields }) {
  const a = feature?.attributes ?? {};
  const g = feature?.geometry ?? {};
  const updated = a[fields.updated];
  return {
    id: String(a[fields.id] ?? ""),
    kind,
    title: String(a[fields.title] ?? ""),
    lat: g.y,
    lon: g.x,
    updatedEpochMs: typeof updated === "number" ? updated : Date.parse(updated),
    sourceId,
  };
}

/**
 * Normalize a whole feed: validate, dedupe by id (newest wins), drop
 * records older than maxAgeMs relative to nowEpochMs, sort newest
 * first. Returns { features, rejected } — nothing vanishes quietly.
 */
export function normalizeFeed(rawRecords, { nowEpochMs, maxAgeMs = Infinity } = {}) {
  if (!Array.isArray(rawRecords)) throw new TypeError("rawRecords must be an array");
  if (!Number.isFinite(nowEpochMs)) throw new TypeError("nowEpochMs is required");
  const rejected = [];
  const byId = new Map();
  for (const raw of rawRecords) {
    const f = normalizeRecord(raw, rejected);
    if (!f) continue;
    const prev = byId.get(f.id);
    if (!prev || f.updatedEpochMs >= prev.updatedEpochMs) byId.set(f.id, f);
  }
  const features = [...byId.values()]
    .filter((f) => {
      if (nowEpochMs - f.updatedEpochMs > maxAgeMs) {
        rejected.push({ id: f.id, reason: "stale: older than maxAgeMs" });
        return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedEpochMs - a.updatedEpochMs);
  return { features, rejected };
}

/** Features of one kind within radiusKm of a point, nearest first. */
export function nearby(features, center, radiusKm, kind = null) {
  return features
    .filter((f) => kind === null || f.kind === kind)
    .map((f) => ({ ...f, distanceKm: haversineKm(center, f) }))
    .filter((f) => f.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
