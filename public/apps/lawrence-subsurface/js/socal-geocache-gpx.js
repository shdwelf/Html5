/**
 * Read geocache waypoints from a user-selected GPX file.
 *
 * GeoMate.jr's 2014 user's guide documents GPX 1.1 Pocket Query/custom-cache
 * inputs. This reader handles the public GPX waypoint structure plus the
 * common Groundspeak cache extension. It never fetches or uploads anything.
 */

export const MAX_GPX_BYTES = 20 * 1024 * 1024;
export const MAX_GPX_WAYPOINTS = 5000;

const elementName = (element) =>
  String(element?.localName || element?.nodeName || "").split(":").pop().toLowerCase();

const directChild = (parent, name) =>
  Array.from(parent?.children ?? []).find((child) => elementName(child) === name.toLowerCase()) ?? null;

const directText = (parent, name) => directChild(parent, name)?.textContent?.trim() ?? "";

const descendants = (parent, name) =>
  Array.from(parent?.getElementsByTagName?.("*") ?? []).filter((element) => elementName(element) === name.toLowerCase());

const descendantText = (parent, name) => descendants(parent, name)[0]?.textContent?.trim() ?? "";

const normalized = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function extractCacheCode(waypointName, url) {
  const name = String(waypointName ?? "").trim();
  if (/^GC[A-Z0-9]{1,10}$/i.test(name)) return name.toUpperCase();
  const match = String(url ?? "").match(/\/geocache\/(GC[A-Z0-9]{1,10})(?:[/?#_]|$)/i);
  return match ? match[1].toUpperCase() : null;
}

function decimalOrNull(text) {
  if (text == null || String(text).trim() === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * Parse GPX 1.1 into cache-like waypoints.
 *
 * The return value includes counters for records that were unusable or
 * duplicated. Callers should apply their own theater bounding box; the parser
 * deliberately does not assume a geography.
 */
export function parseGeocacheGpx(xmlText, { DOMParserClass = globalThis.DOMParser } = {}) {
  if (typeof xmlText !== "string") throw new TypeError("GPX content must be text.");
  const byteLength = new TextEncoder().encode(xmlText).byteLength;
  if (byteLength > MAX_GPX_BYTES) {
    throw new Error(`GPX file exceeds the ${Math.round(MAX_GPX_BYTES / (1024 * 1024))} MB import limit.`);
  }
  if (typeof DOMParserClass !== "function") throw new Error("This browser does not provide an XML parser.");

  const document = new DOMParserClass().parseFromString(xmlText, "application/xml");
  const root = document.documentElement;
  const parserErrors = descendants(document, "parsererror");
  if (!root || elementName(root) !== "gpx" || parserErrors.length) {
    throw new Error("The selected file is not well-formed GPX XML.");
  }

  const waypoints = descendants(root, "wpt");
  if (waypoints.length > MAX_GPX_WAYPOINTS) {
    throw new Error(`GPX has ${waypoints.length.toLocaleString()} waypoints; the offline viewer limit is ${MAX_GPX_WAYPOINTS.toLocaleString()}.`);
  }

  const caches = [];
  const seen = new Set();
  let invalidCoordinates = 0;
  let duplicates = 0;

  for (const waypoint of waypoints) {
    const latText = waypoint.getAttribute("lat");
    const lonText = waypoint.getAttribute("lon");
    const lat = latText == null || latText.trim() === "" ? NaN : Number(latText);
    const lon = lonText == null || lonText.trim() === "" ? NaN : Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      invalidCoordinates += 1;
      continue;
    }

    const waypointName = directText(waypoint, "name");
    const url = directText(waypoint, "url");
    const code = extractCacheCode(waypointName, url);
    const extension = descendants(waypoint, "cache")[0] ?? null;
    const extensionName = descendantText(extension, "name");
    const description = directText(waypoint, "desc");
    const comment = directText(waypoint, "cmt");
    const urlName = directText(waypoint, "urlname");
    const name = (urlName || extensionName || comment || description || code || waypointName || "Unnamed cache")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);

    const key = code
      ? `code:${code}`
      : `waypoint:${normalized(name)}:${lat.toFixed(6)}:${lon.toFixed(6)}`;
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);

    const rawType = directText(waypoint, "type");
    const cacheType = rawType.split("|").map((part) => part.trim()).filter(Boolean).at(-1)
      || directText(waypoint, "sym")
      || descendantText(extension, "container")
      || null;
    const difficulty = decimalOrNull(descendantText(extension, "difficulty"));
    const terrain = decimalOrNull(descendantText(extension, "terrain"));
    const elevationM = decimalOrNull(directText(waypoint, "ele"));

    caches.push({
      cacheCode: code,
      name,
      lat,
      lon,
      elevationM,
      cacheType,
      difficulty,
      terrain,
      sourceWaypointName: waypointName || null,
    });
  }

  return {
    caches,
    waypointCount: waypoints.length,
    invalidCoordinates,
    duplicates,
  };
}

/** Convert parsed GPX caches to the optional 11-column Gazetteer row shape. */
export function geocachesToGazetteerRows(caches, { sourceFile = "user GPX", importedOn } = {}) {
  if (!Array.isArray(caches)) throw new TypeError("Caches must be an array.");
  const importDate = importedOn || new Date().toISOString().slice(0, 10);
  return caches.map((cache) => {
    const metadata = {
      cacheCode: cache.cacheCode ?? null,
      cacheType: cache.cacheType ?? null,
      difficulty: cache.difficulty ?? null,
      terrain: cache.terrain ?? null,
      sourceFile: String(sourceFile),
      importedOn: String(importDate),
    };
    return [
      cache.name,
      "Geocache",
      "rec.geocache",
      "",
      cache.lat,
      cache.lon,
      cache.elevationM ?? null,
      null,
      0,
      `User-supplied GPX waypoint; imported locally from ${metadata.sourceFile} on ${metadata.importedOn}.`,
      metadata,
    ];
  });
}
