/**
 * Safe, offline GPX 1.0/1.1 import and preservation helpers for the SoCal
 * Subsurface gazetteer. This is intentionally a small read-only importer: it
 * never writes to the device, executes embedded content, or uploads the file.
 *
 * A BagIt ZIP preserves the exact source GPX and adds a deliberately limited,
 * app-defined XML/JSON normalization plus SHA-256 manifests. It is Xena-inspired
 * (retain source + create an open normalized rendition), not a native Xena file.
 */

import { zipSync } from "../vendor/fflate/index.mjs";

export const MAX_GPX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_GEOCACHES = 5000;
export const SOCAL_GAZETTEER_BOUNDS = Object.freeze({
  lon0: -121.6,
  lon1: -114.0,
  lat0: 32.45,
  lat1: 38.35,
});

const GPX_NS = new Map([
  ["1.0", "http://www.topografix.com/GPX/1/0"],
  ["1.1", "http://www.topografix.com/GPX/1/1"],
]);
const ALLOWED_GPX_NAMESPACES = new Set(["", ...GPX_NS.values()]);
const GC_CODE = /^GC[A-Z0-9]{1,10}$/i;
const CACHE_TYPE = /cache/i;

const asArray = (items) => Array.from(items ?? []);
const utf8 = (text) => new Uint8Array(new TextEncoder().encode(text));
const localName = (node) => String(node?.localName ?? node?.nodeName ?? "").toLowerCase();
const tidy = (value, max = 180) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Return only a safe display filename; browser File objects do not expose paths. */
export function safeGpxFilename(input) {
  const leaf = String(input ?? "geocaches.gpx").split(/[\\/]/).pop() || "geocaches.gpx";
  const safe = leaf
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);
  return safe || "geocaches.gpx";
}

function directChild(parent, wantedName) {
  return asArray(parent?.children).find((child) => localName(child) === wantedName.toLowerCase()) ?? null;
}

function directText(parent, wantedName) {
  return tidy(directChild(parent, wantedName)?.textContent ?? "");
}

function descendant(parent, wantedName) {
  return asArray(parent?.getElementsByTagName?.("*"))
    .find((child) => localName(child) === wantedName.toLowerCase()) ?? null;
}

function descendantText(parent, wantedName) {
  return tidy(descendant(parent, wantedName)?.textContent ?? "");
}

function validRating(value) {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const number = Number(value);
  return number >= 0 && number <= 5 ? number : null;
}

function pointInBounds(lat, lon, bounds) {
  return lat >= bounds.lat0 && lat <= bounds.lat1 && lon >= bounds.lon0 && lon <= bounds.lon1;
}

/**
 * Parse GPX cache waypoints. The full `caches` list is retained for the
 * preservation derivative; only `inFrameCaches` is added to the SoCal map.
 * Descriptions, hints, logs, owners, and personal user data are never copied
 * into the normalized metadata.
 */
export function parseGeomateGpx(xmlText, options = {}) {
  const {
    sourceName = "user-supplied.gpx",
    bounds = SOCAL_GAZETTEER_BOUNDS,
    maxBytes = MAX_GPX_FILE_BYTES,
    maxCaches = MAX_GEOCACHES,
    DOMParserImpl = globalThis.DOMParser,
  } = options;

  if (typeof xmlText !== "string" || !xmlText.trim()) throw new Error("The selected file is empty or is not text.");
  const byteLength = new TextEncoder().encode(xmlText).byteLength;
  if (byteLength > maxBytes) throw new Error(`GPX is larger than the ${Math.floor(maxBytes / (1024 * 1024))} MiB import limit.`);
  if (/<!DOCTYPE/i.test(xmlText)) throw new Error("GPX documents with a DOCTYPE are not accepted.");
  if (typeof DOMParserImpl !== "function") throw new Error("This browser does not provide an XML DOMParser.");
  if (!bounds || !(bounds.lon0 <= bounds.lon1 && bounds.lat0 <= bounds.lat1)) {
    throw new Error("The map bounds are invalid.");
  }

  const document = new DOMParserImpl().parseFromString(xmlText, "application/xml");
  const root = document.documentElement;
  const parserError = asArray(document.getElementsByTagName("parsererror"))[0];
  if (parserError || !root || localName(root) !== "gpx") throw new Error("The selected file is not well-formed GPX XML.");

  const namespace = root.namespaceURI ?? "";
  if (!ALLOWED_GPX_NAMESPACES.has(namespace)) throw new Error(`Unsupported GPX namespace: ${namespace || "(none)"}.`);

  const declaredVersion = root.getAttribute("version")?.trim() ?? "";
  const inferredVersion = [...GPX_NS.entries()].find(([, uri]) => uri === namespace)?.[0] ?? "1.1";
  const gpxVersion = declaredVersion || inferredVersion;
  if (!GPX_NS.has(gpxVersion)) throw new Error(`Only GPX 1.0 and GPX 1.1 are supported (file says ${gpxVersion}).`);
  if (namespace && namespace !== GPX_NS.get(gpxVersion)) {
    throw new Error(`The GPX version (${gpxVersion}) does not match its XML namespace.`);
  }

  const waypoints = asArray(root.getElementsByTagNameNS?.("*", "wpt"));
  // Some DOM implementations treat a no-namespace query differently; GPX
  // without a namespace is permitted by this importer, so include that case.
  const allWaypoints = waypoints.length
    ? waypoints
    : asArray(root.getElementsByTagName?.("*")).filter((node) => localName(node) === "wpt");

  const caches = [];
  const seen = new Set();
  let nonCacheWaypoints = 0;
  let invalidCoordinates = 0;
  let duplicates = 0;
  let outOfFrame = 0;
  let omittedBeyondLimit = 0;
  let cacheOrdinal = 0;

  for (const waypoint of allWaypoints) {
    const waypointName = directText(waypoint, "name");
    const gpxType = directText(waypoint, "type");
    const symbol = directText(waypoint, "sym");
    const cacheElement = descendant(waypoint, "cache");
    const extensionType = descendantText(cacheElement, "type");
    const isGeocache = Boolean(cacheElement)
      || GC_CODE.test(waypointName)
      || CACHE_TYPE.test(gpxType)
      || CACHE_TYPE.test(symbol);

    if (!isGeocache) {
      nonCacheWaypoints += 1;
      continue;
    }

    cacheOrdinal += 1;
    const latText = waypoint.getAttribute("lat")?.trim() ?? "";
    const lonText = waypoint.getAttribute("lon")?.trim() ?? "";
    const lat = latText === "" ? NaN : Number(latText);
    const lon = lonText === "" ? NaN : Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      invalidCoordinates += 1;
      continue;
    }

    const codeCandidates = [
      waypointName,
      cacheElement?.getAttribute("id") ?? "",
      descendantText(cacheElement, "code"),
    ];
    const cacheCode = codeCandidates.find((candidate) => GC_CODE.test(candidate))?.toUpperCase() ?? "";
    const extensionName = descendantText(cacheElement, "name");
    const displayName = tidy(extensionName || (waypointName && waypointName !== cacheCode ? waypointName : cacheCode), 180)
      || `Custom geocache ${cacheOrdinal}`;
    const cacheType = tidy(extensionType || gpxType.replace(/^Geocache\s*\|\s*/i, "") || "Geocache", 80);
    const container = tidy(descendantText(cacheElement, "container"), 48);
    const difficulty = validRating(descendantText(cacheElement, "difficulty"));
    const terrain = validRating(descendantText(cacheElement, "terrain"));

    const dedupeKey = cacheCode
      ? `code:${cacheCode}`
      : `point:${displayName.toLocaleLowerCase()}|${lat.toFixed(6)}|${lon.toFixed(6)}`;
    if (seen.has(dedupeKey)) {
      duplicates += 1;
      continue;
    }
    seen.add(dedupeKey);

    if (caches.length >= maxCaches) {
      omittedBeyondLimit += 1;
      continue;
    }

    const inFrame = pointInBounds(lat, lon, bounds);
    if (!inFrame) outOfFrame += 1;
    caches.push({
      cacheCode,
      name: displayName,
      cacheType,
      container,
      difficulty,
      terrain,
      lat,
      lon,
      inFrame,
    });
  }

  const inFrameCaches = caches.filter((cache) => cache.inFrame);
  return {
    sourceName: safeGpxFilename(sourceName),
    gpxVersion,
    namespace,
    byteLength,
    waypointCount: allWaypoints.length,
    caches,
    inFrameCaches,
    stats: {
      waypoints: allWaypoints.length,
      cacheWaypoints: cacheOrdinal,
      normalized: caches.length,
      importedToMap: inFrameCaches.length,
      nonCacheWaypoints,
      invalidCoordinates,
      duplicates,
      outOfFrame,
      omittedBeyondLimit,
    },
  };
}

/** Convert a parsed cache into the SoCal gazetteer's extended tuple row. */
export function cacheToGazetteerRow(cache, sourceName) {
  const label = cache.cacheCode ? `${cache.name} (${cache.cacheCode})` : cache.name;
  return [
    label,
    "Geocache",
    "rec.geocache",
    "Imported GPX",
    cache.lat,
    cache.lon,
    null,
    null,
    0,
    "User-supplied GPX record; not GNIS-verified.",
    {
      type: "GPX",
      file: safeGpxFilename(sourceName),
      cacheCode: cache.cacheCode || null,
      cacheType: cache.cacheType || null,
      container: cache.container || null,
      difficulty: cache.difficulty,
      terrain: cache.terrain,
    },
  ];
}

const xmlEscape = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const normalizedCache = (cache) => ({
  cacheCode: cache.cacheCode || null,
  name: cache.name,
  cacheType: cache.cacheType || null,
  container: cache.container || null,
  difficulty: cache.difficulty,
  terrain: cache.terrain,
  latitude: Number(cache.lat.toFixed(6)),
  longitude: Number(cache.lon.toFixed(6)),
  inSoCalFrame: Boolean(cache.inFrame),
});

/** Application-defined, open XML rendition; explicitly not Xena's XML schema. */
export function createNormalizedGeocacheXml(parsed, { sourceSha256, importedAt } = {}) {
  const attributes = [
    `source-file="${xmlEscape(parsed.sourceName)}"`,
    `gpx-version="${xmlEscape(parsed.gpxVersion)}"`,
    `source-sha256="${xmlEscape(sourceSha256 ?? "")}"`,
    `normalized-at="${xmlEscape(importedAt ?? "")}"`,
  ].join(" ");
  const records = parsed.caches.map((cache) => {
    const code = cache.cacheCode ? ` code="${xmlEscape(cache.cacheCode)}"` : "";
    const optional = (tag, value) => value == null || value === "" ? "" : `    <gc:${tag}>${xmlEscape(value)}</gc:${tag}>\n`;
    return [
      `  <gc:cache${code}>`,
      `    <gc:name>${xmlEscape(cache.name)}</gc:name>`,
      `    <gc:position latitude="${cache.lat.toFixed(6)}" longitude="${cache.lon.toFixed(6)}" in-socal-frame="${cache.inFrame ? "true" : "false"}"/>`,
      optional("type", cache.cacheType),
      optional("container", cache.container),
      optional("difficulty", cache.difficulty),
      optional("terrain", cache.terrain),
      "  </gc:cache>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<gc:register xmlns:gc="urn:shdwelf:geomate-gpx-normalized:1" ${attributes}>\n  <gc:normalization-profile>geomate-gpx-normalized-v1</gc:normalization-profile>\n  <gc:records-count>${parsed.caches.length}</gc:records-count>\n  <gc:omitted-beyond-limit>${parsed.stats.omittedBeyondLimit}</gc:omitted-beyond-limit>\n${records ? records + "\n" : ""}</gc:register>\n`;
}

async function sha256Hex(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto SHA-256 is unavailable in this browser.");
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function checksumLines(entries) {
  return entries.map(([digest, name]) => `${digest}  ${name}`).join("\n") + "\n";
}

/**
 * Create a BagIt v1.0 ZIP. `sourceFile` is embedded unchanged; normalized
 * renditions exclude descriptions, hints, logs, owner names and child waypoints.
 */
export async function createGpxPreservationBag({ sourceFile, parsed, importedAt = new Date().toISOString() }) {
  if (!sourceFile || typeof sourceFile.arrayBuffer !== "function") throw new Error("The original GPX file is not available for preservation.");
  if (!parsed || !Array.isArray(parsed.caches) || !parsed.stats) throw new Error("A successfully parsed GPX file is required.");
  if (Number(sourceFile.size) > MAX_GPX_FILE_BYTES) throw new Error("The original GPX exceeds the preservation export limit.");

  const originalBytes = new Uint8Array(await sourceFile.arrayBuffer());
  if (originalBytes.byteLength > MAX_GPX_FILE_BYTES) throw new Error("The original GPX exceeds the preservation export limit.");
  const sourceName = safeGpxFilename(sourceFile.name || parsed.sourceName);
  const originalSha256 = await sha256Hex(originalBytes);
  const normalized = parsed.caches.map(normalizedCache);
  const normalizedJson = `${JSON.stringify({
    schema: "urn:shdwelf:geomate-gpx-normalized:1",
    source: { fileName: sourceName, sha256: originalSha256, gpxVersion: parsed.gpxVersion },
    importedAt,
    complete: parsed.stats.omittedBeyondLimit === 0,
    stats: parsed.stats,
    caches: normalized,
  }, null, 2)}\n`;
  const normalizedXml = createNormalizedGeocacheXml(parsed, { sourceSha256: originalSha256, importedAt });
  const payload = new Map([
    [`data/original/${sourceName}`, originalBytes],
    ["data/normalized/geocache-register.json", utf8(normalizedJson)],
    ["data/normalized/geocache-register.xml", utf8(normalizedXml)],
  ]);

  const payloadChecksums = [];
  for (const [name, bytes] of [...payload.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    payloadChecksums.push([await sha256Hex(bytes), name]);
  }
  const payloadManifest = checksumLines(payloadChecksums);
  const bagit = "BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n";
  const bagInfo = [
    `Bagging-Date: ${importedAt.slice(0, 10)}`,
    "Bag-Software-Agent: SoCal Subsurface GPX Preservation Workbench 1.0",
    `Source-File: ${sourceName}`,
    `Source-SHA256: ${originalSha256}`,
    `Normalized-Cache-Count: ${parsed.caches.length}`,
    `Map-Import-Count: ${parsed.inFrameCaches.length}`,
    "",
  ].join("\n");
  const event = `${JSON.stringify({
    eventType: "normalization",
    eventDateTime: importedAt,
    softwareAgent: { name: "SoCal Subsurface GPX Preservation Workbench", version: "1.0" },
    source: { fileName: sourceName, format: "GPX", version: parsed.gpxVersion, sha256: originalSha256, byteLength: originalBytes.byteLength },
    outcome: {
      normalizedXml: "data/normalized/geocache-register.xml",
      normalizedJson: "data/normalized/geocache-register.json",
      normalizedRecordCount: parsed.caches.length,
      mapRecordCount: parsed.inFrameCaches.length,
      omittedBeyondLimit: parsed.stats.omittedBeyondLimit,
      complete: parsed.stats.omittedBeyondLimit === 0,
      fieldsRetained: ["cacheCode", "name", "coordinates", "cacheType", "container", "difficulty", "terrain"],
      fieldsExcludedFromRendition: ["description", "hint", "logs", "owner", "childWaypoints"],
      note: "The original GPX is retained unchanged. The XML/JSON schema is application-defined and is not a native Xena format.",
    },
  }, null, 2)}\n`;

  const tagFiles = new Map([
    ["bagit.txt", utf8(bagit)],
    ["bag-info.txt", utf8(bagInfo)],
    ["metadata/preservation-event.json", utf8(event)],
    ["manifest-sha256.txt", utf8(payloadManifest)],
  ]);
  const tagChecksums = [];
  for (const [name, bytes] of [...tagFiles.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    tagChecksums.push([await sha256Hex(bytes), name]);
  }
  const tagManifest = checksumLines(tagChecksums);
  tagFiles.set("tagmanifest-sha256.txt", utf8(tagManifest));

  const mtime = new Date(importedAt);
  const archive = {};
  for (const [name, bytes] of [...payload.entries(), ...tagFiles.entries()]) {
    archive[name] = [bytes, { level: 6, mtime }];
  }
  const zipBytes = zipSync(archive, { level: 6, mtime });
  const zipSha256 = await sha256Hex(zipBytes);
  const baseName = sourceName.replace(/\.gpx$/i, "") || "geocaches";
  return {
    bytes: zipBytes,
    fileName: `${baseName}-preservation-bag.zip`,
    originalSha256,
    zipSha256,
    payloadManifest,
    tagManifest,
    recordCount: parsed.caches.length,
    complete: parsed.stats.omittedBeyondLimit === 0,
  };
}
