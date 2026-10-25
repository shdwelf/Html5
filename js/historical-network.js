/**
 * HISTORICAL NETWORK — observation-first evidence model for S6.
 *
 * This module is deliberately not a gazetteer. A historical BBS/FidoNet/
 * ARPANET/payphone claim starts life as an immutable observation tied to a
 * dated source snapshot. Places, canonical nodes, and edges are derived
 * claims and must keep their observation links, place granularity, and
 * geometry basis visible.
 *
 * Pure data functions only: no DOM, no network, no dialing, and no runtime
 * dependency. The browser viewer and Node tests share this implementation.
 */

export const HISTORICAL_NETWORK_SCHEMA_VERSION = 1;

export const EVIDENCE_TIERS = new Set([
  "contemporaneous-primary",
  "contemporaneous-compiled-list",
  "retrospective-compilation",
  "local-user-import",
]);

export const PLACE_GRANULARITIES = new Set([
  "address",
  "site",
  "city",
  "telephone-exchange",
  "region",
  "unknown",
]);

export const RIGHTS_STATUSES = new Set([
  "bundling-permitted",
  "citation-only",
  "local-import-only",
  "unknown",
]);

const COARSE_GRANULARITIES = new Set(["city", "telephone-exchange", "region", "unknown"]);
const SHA256_RE = /^[a-f0-9]{64}$/i;
const PHONE_RE = /\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/;

const asArray = (value) => (Array.isArray(value) ? value : []);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

export const normalizePhone = (value) => String(value ?? "").replace(/\D/g, "");
export const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeBoardName = (value) => normalizeText(value).replace(/^the\s+/, "");

/** Lowercase SHA-256 for a string, ArrayBuffer, typed array, or Blob. */
export async function sha256Hex(data) {
  if (!globalThis.crypto?.subtle?.digest) {
    throw new Error("WebCrypto SHA-256 is unavailable in this runtime");
  }
  let bytes;
  if (typeof data === "string") bytes = new TextEncoder().encode(data);
  else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
  else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  else if (typeof Blob !== "undefined" && data instanceof Blob) bytes = new Uint8Array(await data.arrayBuffer());
  else throw new TypeError("sha256Hex expects a string, ArrayBuffer, typed array, or Blob");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertUniqueIds(items, collection, errors) {
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    if (!isObject(item) || !nonEmpty(item.id)) {
      errors.push(`${collection}[${index}] must be an object with a non-empty id`);
      continue;
    }
    if (seen.has(item.id)) errors.push(`${collection}: duplicate id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

function dateValue(value) {
  if (!nonEmpty(value)) return null;
  const normalized = /^\d{4}-\d{2}$/.test(value)
    ? `${value}-01`
    : /^\d{4}$/.test(value)
      ? `${value}-01-01`
      : value;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function observationStart(observation) {
  return dateValue(observation.validFrom) ?? dateValue(observation.observedAt);
}

function observationEnd(observation) {
  if (nonEmpty(observation.validTo)) return dateValue(observation.validTo);
  if (/^\d{4}-\d{2}$/.test(observation.observedAt ?? "")) {
    const [year, month] = observation.observedAt.split("-").map(Number);
    return new Date(Date.UTC(year, month, 0));
  }
  return dateValue(observation.observedAt);
}

function isoDay(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

/**
 * Validate an evidence pack.
 *
 * `valid` means the pack is structurally sound enough to render as a cited
 * research fixture. `captureReady` is stricter: every snapshot must have a
 * local captured status, a SHA-256, and a rights status that permits bundled
 * redistribution. Citation-only fixtures can therefore be valid while still
 * being correctly blocked as capture-ready datasets.
 */
export function validateEvidencePack(pack) {
  const errors = [];
  const warnings = [];

  if (!isObject(pack)) {
    return { valid: false, captureReady: false, errors: ["evidence pack must be an object"], warnings, counts: {} };
  }
  if (pack.schemaVersion !== HISTORICAL_NETWORK_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${HISTORICAL_NETWORK_SCHEMA_VERSION}`);
  }
  if (!nonEmpty(pack.id)) errors.push("evidence pack id is required");
  if (!nonEmpty(pack.title)) errors.push("evidence pack title is required");

  const snapshots = asArray(pack.snapshots);
  const observations = asArray(pack.observations);
  const places = asArray(pack.places);
  const nodes = asArray(pack.nodes);
  const edges = asArray(pack.edges);
  const mergeLog = asArray(pack.mergeLog);
  const rejectedMatches = asArray(pack.rejectedMatches);
  const negativeSearches = asArray(pack.negativeSearches);

  const snapshotIds = assertUniqueIds(snapshots, "snapshots", errors);
  const observationIds = assertUniqueIds(observations, "observations", errors);
  const placeIds = assertUniqueIds(places, "places", errors);
  const nodeIds = assertUniqueIds(nodes, "nodes", errors);
  assertUniqueIds(edges, "edges", errors);
  assertUniqueIds(mergeLog, "mergeLog", errors);
  assertUniqueIds(rejectedMatches, "rejectedMatches", errors);
  assertUniqueIds(negativeSearches, "negativeSearches", errors);

  let captureReady = snapshots.length > 0;
  for (const snapshot of snapshots) {
    if (!isObject(snapshot)) continue;
    const label = `snapshot ${snapshot.id ?? "<missing>"}`;
    if (!nonEmpty(snapshot.title)) errors.push(`${label}: title is required`);
    if (!nonEmpty(snapshot.issued) && !nonEmpty(snapshot.issuedLabel)) {
      errors.push(`${label}: issued date or issuedLabel is required`);
    }
    if (!nonEmpty(snapshot.captureUri)) errors.push(`${label}: captureUri/citation URI is required`);
    if (!nonEmpty(snapshot.captureStatus)) errors.push(`${label}: captureStatus is required`);
    if (!nonEmpty(snapshot.parser)) errors.push(`${label}: parser is required`);
    if (!RIGHTS_STATUSES.has(snapshot.rightsStatus)) {
      errors.push(`${label}: rightsStatus must be one of ${[...RIGHTS_STATUSES].join(", ")}`);
    }
    if (!nonEmpty(snapshot.rightsNote)) errors.push(`${label}: rightsNote is required`);
    if (snapshot.sha256 != null && !SHA256_RE.test(snapshot.sha256)) {
      errors.push(`${label}: sha256 must be 64 hexadecimal characters when present`);
    }

    const locallyCaptured = /captured-local|local-capture|user-supplied-local/.test(snapshot.captureStatus ?? "");
    if (!locallyCaptured || !SHA256_RE.test(snapshot.sha256 ?? "") || snapshot.rightsStatus !== "bundling-permitted") {
      captureReady = false;
    }
    if (!locallyCaptured) warnings.push(`${label}: not locally captured (${snapshot.captureStatus ?? "unknown"})`);
    if (!snapshot.sha256) warnings.push(`${label}: sha256 is null; citation-only evidence cannot be a capture-ready dataset`);
    if (snapshot.rightsStatus !== "bundling-permitted") {
      warnings.push(`${label}: rightsStatus=${snapshot.rightsStatus ?? "unknown"} blocks bundled redistribution`);
    }
  }

  for (const observation of observations) {
    if (!isObject(observation)) continue;
    const label = `observation ${observation.id ?? "<missing>"}`;
    if (!snapshotIds.has(observation.snapshotId)) errors.push(`${label}: unknown snapshotId ${observation.snapshotId}`);
    if (!nonEmpty(observation.locator)) errors.push(`${label}: locator is required`);
    if (!EVIDENCE_TIERS.has(observation.evidenceTier)) {
      errors.push(`${label}: evidenceTier must be one of ${[...EVIDENCE_TIERS].join(", ")}`);
    }
    if (!observationStart(observation) && !observationEnd(observation)) {
      errors.push(`${label}: observedAt or a validFrom/validTo range is required`);
    }
    if (!isObject(observation.fields)) {
      errors.push(`${label}: fields object is required`);
    } else if (!nonEmpty(observation.fields.name) && !nonEmpty(observation.fields.phone)) {
      errors.push(`${label}: fields.name or fields.phone is required`);
    }
    if (observation.fields?.phone && !PHONE_RE.test(observation.fields.phone)) {
      warnings.push(`${label}: phone does not look like a North American historical listing number`);
    }
    if (observation.rawTextStatus === "not-bundled" && nonEmpty(observation.rawText)) {
      errors.push(`${label}: rawTextStatus=not-bundled must not carry rawText`);
    }
  }

  for (const place of places) {
    if (!isObject(place)) continue;
    const label = `place ${place.id ?? "<missing>"}`;
    if (!nonEmpty(place.label)) errors.push(`${label}: label is required`);
    if (!PLACE_GRANULARITIES.has(place.granularity)) {
      errors.push(`${label}: granularity must be one of ${[...PLACE_GRANULARITIES].join(", ")}`);
    }
    const hasLat = place.lat != null;
    const hasLon = place.lon != null;
    if (hasLat !== hasLon) errors.push(`${label}: lat and lon must either both be present or both be null`);
    if (hasLat && hasLon) {
      if (!Number.isFinite(place.lat) || place.lat < -90 || place.lat > 90) errors.push(`${label}: lat out of range`);
      if (!Number.isFinite(place.lon) || place.lon < -180 || place.lon > 180) errors.push(`${label}: lon out of range`);
      if (!nonEmpty(place.coordinateBasis) || place.coordinateBasis === "not-geocoded") {
        errors.push(`${label}: coordinateBasis must explain a plotted coordinate`);
      }
      if (COARSE_GRANULARITIES.has(place.granularity)) {
        if (!(Number.isFinite(place.radiusKm) && place.radiusKm > 0)) {
          errors.push(`${label}: coarse place coordinates require radiusKm > 0; never render them as an exact site pin`);
        }
        if (/exact|address|site/.test(place.coordinateBasis ?? "")) {
          errors.push(`${label}: coarse granularity cannot claim an exact/address/site coordinate basis`);
        }
      }
    }
  }

  for (const node of nodes) {
    if (!isObject(node)) continue;
    const label = `node ${node.id ?? "<missing>"}`;
    if (!nonEmpty(node.name)) errors.push(`${label}: name is required`);
    if (!nonEmpty(node.network)) errors.push(`${label}: network is required`);
    if (!nonEmpty(node.kind)) errors.push(`${label}: kind is required`);
    if (node.placeId != null && !placeIds.has(node.placeId)) errors.push(`${label}: unknown placeId ${node.placeId}`);
    const ids = asArray(node.observationIds);
    if (ids.length === 0) errors.push(`${label}: at least one observationId is required`);
    for (const id of ids) if (!observationIds.has(id)) errors.push(`${label}: unknown observationId ${id}`);
    for (const identifier of asArray(node.identifiers)) {
      for (const id of asArray(identifier.observationIds)) {
        if (!observationIds.has(id)) errors.push(`${label}: identifier references unknown observationId ${id}`);
      }
    }
  }

  for (const edge of edges) {
    if (!isObject(edge)) continue;
    const label = `edge ${edge.id ?? "<missing>"}`;
    if (!nodeIds.has(edge.fromNodeId)) errors.push(`${label}: unknown fromNodeId ${edge.fromNodeId}`);
    if (!nodeIds.has(edge.toNodeId)) errors.push(`${label}: unknown toNodeId ${edge.toNodeId}`);
    if (!nonEmpty(edge.kind)) errors.push(`${label}: kind is required`);
    if (!nonEmpty(edge.geometryBasis)) errors.push(`${label}: geometryBasis is required`);
    if (edge.geometryBasis === "logical-only" && edge.geometry != null) {
      errors.push(`${label}: logical-only edges must not carry physical geometry`);
    }
    const ids = asArray(edge.observationIds);
    if (ids.length === 0) errors.push(`${label}: at least one observationId is required`);
    for (const id of ids) if (!observationIds.has(id)) errors.push(`${label}: unknown observationId ${id}`);
  }

  for (const merge of mergeLog) {
    if (!isObject(merge)) continue;
    const label = `mergeLog ${merge.id ?? "<missing>"}`;
    if (!['merged', 'rejected', 'manual-review'].includes(merge.decision)) {
      errors.push(`${label}: decision must be merged, rejected, or manual-review`);
    }
    const ids = asArray(merge.observationIds);
    if (ids.length < 2) errors.push(`${label}: at least two observationIds are required`);
    for (const id of ids) if (!observationIds.has(id)) errors.push(`${label}: unknown observationId ${id}`);
    if (merge.nodeId != null && !nodeIds.has(merge.nodeId)) errors.push(`${label}: unknown nodeId ${merge.nodeId}`);
    const matched = asArray(merge.matchedFields).map((field) => String(field).toLowerCase());
    if (merge.decision === "merged") {
      if (matched.length === 0) errors.push(`${label}: merged records must state matchedFields`);
      if (matched.every((field) => field === "name")) {
        errors.push(`${label}: records must never be merged solely because display names match`);
      }
      if (/same[- ]display[- ]name|name[- ]only/i.test(merge.rule ?? "")) {
        errors.push(`${label}: name-only merge rule is forbidden`);
      }
    }
    if (merge.confidence != null && (!Number.isFinite(merge.confidence) || merge.confidence < 0 || merge.confidence > 1)) {
      errors.push(`${label}: confidence must be between 0 and 1`);
    }
    if (!nonEmpty(merge.note)) warnings.push(`${label}: merge note is recommended`);
  }

  for (const rejected of rejectedMatches) {
    if (!isObject(rejected)) continue;
    if (!nonEmpty(rejected.label)) errors.push(`rejectedMatch ${rejected.id ?? "<missing>"}: label is required`);
    if (!nonEmpty(rejected.reason)) errors.push(`rejectedMatch ${rejected.id ?? "<missing>"}: reason is required`);
  }

  for (const search of negativeSearches) {
    if (!isObject(search)) continue;
    const label = `negativeSearch ${search.id ?? "<missing>"}`;
    if (!nonEmpty(search.source)) errors.push(`${label}: source is required`);
    if (!nonEmpty(search.query)) errors.push(`${label}: query is required`);
    if (!nonEmpty(search.date)) errors.push(`${label}: date is required`);
    if (!nonEmpty(search.result)) errors.push(`${label}: result is required`);
  }

  return {
    valid: errors.length === 0,
    captureReady: errors.length === 0 && captureReady,
    errors,
    warnings,
    counts: {
      snapshots: snapshots.length,
      observations: observations.length,
      places: places.length,
      nodes: nodes.length,
      edges: edges.length,
      merges: mergeLog.length,
      rejectedMatches: rejectedMatches.length,
      negativeSearches: negativeSearches.length,
    },
  };
}

/** Derived display summary; node dates are computed from observations. */
export function summarizeEvidencePack(pack) {
  const observations = asArray(pack?.observations);
  const starts = observations.map(observationStart).filter(Boolean);
  const ends = observations.map(observationEnd).filter(Boolean);
  const nodes = asArray(pack?.nodes).map((node) => {
    const linked = observations.filter((observation) => asArray(node.observationIds).includes(observation.id));
    const nodeStarts = linked.map(observationStart).filter(Boolean);
    const nodeEnds = linked.map(observationEnd).filter(Boolean);
    return {
      id: node.id,
      name: node.name,
      network: node.network,
      kind: node.kind,
      observationCount: linked.length,
      firstObserved: nodeStarts.length ? isoDay(new Date(Math.min(...nodeStarts))) : null,
      lastObserved: nodeEnds.length ? isoDay(new Date(Math.max(...nodeEnds))) : null,
    };
  });
  return {
    id: pack?.id ?? null,
    title: pack?.title ?? null,
    status: pack?.status ?? null,
    firstObserved: starts.length ? isoDay(new Date(Math.min(...starts))) : null,
    lastObserved: ends.length ? isoDay(new Date(Math.max(...ends))) : null,
    snapshotCount: asArray(pack?.snapshots).length,
    observationCount: observations.length,
    nodeCount: nodes.length,
    edgeCount: asArray(pack?.edges).length,
    nodes,
  };
}

/** Case/punctuation-insensitive search over the observation fields. */
export function searchObservations(pack, query) {
  const needle = normalizeText(query);
  const observations = asArray(pack?.observations);
  if (!needle) return [...observations];
  return observations.filter((observation) => {
    const fields = observation.fields ?? {};
    const haystack = normalizeText([
      observation.id,
      observation.snapshotId,
      observation.locator,
      observation.evidenceTier,
      fields.name,
      fields.phone,
      fields.locality,
      fields.state,
      fields.sysop,
      fields.software,
      fields.years,
      fields.phoneRaw,
      fields.location,
      fields.fidonetAddress,
      fields.fidonetKeyword,
      asArray(fields.flags).join(" "),
    ].filter(Boolean).join(" "));
    return haystack.includes(needle);
  });
}

/**
 * Assess whether two BBS observations may be the same system.
 *
 * Display-name equality is deliberately insufficient: the 1994 sources
 * contain both the Denver Keyhole BBS and a distinct 818 Keyhole BBS.
 */
export function assessMergeCandidate(left, right) {
  const a = left?.fields ?? left ?? {};
  const b = right?.fields ?? right ?? {};
  const matchedFields = [];
  const mismatchedFields = [];

  const compare = (field, leftValue, rightValue) => {
    if (!leftValue || !rightValue) return;
    if (leftValue === rightValue) matchedFields.push(field);
    else mismatchedFields.push(field);
  };
  compare("phone", normalizePhone(a.phone), normalizePhone(b.phone));
  compare("name", normalizeBoardName(a.name), normalizeBoardName(b.name));
  compare("locality", normalizeText([a.locality, a.state].filter(Boolean).join(" ")), normalizeText([b.locality, b.state].filter(Boolean).join(" ")));
  compare("sysop", normalizeText(a.sysop), normalizeText(b.sysop));

  const has = (field) => matchedFields.includes(field);
  const conflict = (field) => mismatchedFields.includes(field);
  let decision = "manual-review";
  let confidence = 0.35;
  let reason = "Insufficient shared identifying fields for an automatic merge.";

  if (has("phone") && has("name") && has("locality") && !conflict("sysop")) {
    decision = "merge-candidate";
    confidence = has("sysop") ? 0.98 : 0.86;
    reason = has("sysop")
      ? "Telephone, board name, locality, and sysop all agree."
      : "Telephone, board name, and locality agree; sysop is missing on at least one side.";
  } else if (has("name") && conflict("phone")) {
    decision = "reject";
    confidence = 0.08;
    reason = "Same display name but different telephone numbers; keep as separate candidates.";
  } else if (matchedFields.length === 1 && has("name")) {
    decision = "reject";
    confidence = 0.05;
    reason = "Name-only matching is forbidden.";
  } else if (has("phone") && (conflict("name") || conflict("sysop"))) {
    decision = "manual-review";
    confidence = 0.45;
    reason = "Telephone agrees but another identity field conflicts; a reviewer must decide.";
  }

  return { decision, confidence, matchedFields, mismatchedFields, reason };
}

function parseLocalityLine(text) {
  const match = text.match(/^(.+?),\s*([A-Z]{2})(?:\s*\((\d{4})(?:-(\d{4}))?\))?\s*$/);
  if (!match) return null;
  const [, localityRaw, state, startYear, endYear] = match;
  const titleCase = localityRaw
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bFt\./g, "Ft.");
  return {
    locality: titleCase,
    state,
    years: startYear ? (endYear && endYear !== startYear ? `${startYear}-${endYear}` : startYear) : null,
    validFrom: startYear ? `${startYear}-01-01` : null,
    validTo: startYear ? `${endYear ?? startYear}-12-31` : null,
  };
}

/**
 * Parse a user-supplied TEXTFILES.COM historical BBS list (`303.txt` shape).
 *
 * The input text stays in memory in the caller. This function returns
 * observation objects, not canonical nodes: merging remains an explicit,
 * reviewed step.
 */
export function parseTextfilesHistoricalList(text, {
  snapshotId = "local-textfiles-historical-list",
  title = "Local TEXTFILES historical BBS list import",
  captureUri = "local-file:user-supplied",
  sha256 = null,
  byteLength = null,
} = {}) {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
  const observations = [];
  const warnings = [];
  let current = null;
  let lastField = "name";

  const finish = () => {
    if (!current) return;
    const fields = current.fields;
    fields.name = fields.name.replace(/\s+/g, " ").trim();
    if (!fields.name) warnings.push(`line ${current.startLine}: record ${fields.phone} has no system name`);
    observations.push({
      id: `local-${String(observations.length + 1).padStart(4, "0")}-${normalizePhone(fields.phone)}`,
      snapshotId,
      locator: `line ${current.startLine}: record keyed by telephone number ${fields.phone}`,
      observedAt: null,
      validFrom: current.validFrom,
      validTo: current.validTo,
      evidenceTier: "local-user-import",
      rawTextStatus: "user-supplied-local-text",
      rawText: current.rawLines.join("\n").trim(),
      fields,
      warnings: ["Parsed locally from a user-supplied retrospective list; no canonical merge has been performed."],
    });
    current = null;
  };

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const start = line.match(/^\s*(\d{3}-\d{3}-\d{4})\s*\|\s*(.*)$/);
    if (start) {
      finish();
      current = {
        startLine: lineNo,
        rawLines: [line],
        validFrom: null,
        validTo: null,
        fields: {
          name: start[2].trim(),
          phone: start[1],
          locality: null,
          state: null,
          sysop: null,
          software: null,
          years: null,
          comments: null,
        },
      };
      lastField = "name";
      return;
    }

    if (!current) return;
    if (/^-+\+-+\s*$/.test(line.trim())) {
      finish();
      return;
    }
    const pipe = line.indexOf("|");
    if (pipe < 0) return;
    current.rawLines.push(line);
    const label = line.slice(0, pipe).trim().toUpperCase();
    const value = line.slice(pipe + 1).trim();
    if (!value) return;

    if (label === "SYSOP") {
      current.fields.sysop = value;
      lastField = "sysop";
      return;
    }
    if (label === "SOFTWARE") {
      current.fields.software = value;
      lastField = "software";
      return;
    }
    if (label === "COMMENTS") {
      current.fields.comments = value;
      lastField = "comments";
      return;
    }

    if (!current.fields.locality) {
      const locality = parseLocalityLine(value);
      if (locality) {
        current.fields.locality = locality.locality;
        current.fields.state = locality.state;
        current.fields.years = locality.years;
        current.validFrom = locality.validFrom;
        current.validTo = locality.validTo;
        lastField = "locality";
        return;
      }
    }

    // Wrapped name/comment/sysop/software values continue the previous field.
    const target = lastField === "locality" ? "name" : lastField;
    current.fields[target] = [current.fields[target], value].filter(Boolean).join(" ");
  });
  finish();

  return {
    snapshot: {
      id: snapshotId,
      title,
      publisher: "user-supplied local text",
      editor: null,
      issued: null,
      issuedLabel: "Imported locally; source publication date must be supplied by the user before dataset use",
      validFrom: null,
      validTo: null,
      captureUri,
      captureStatus: "user-supplied-local-text",
      sha256,
      byteLength,
      rightsStatus: "local-import-only",
      rightsNote: "Parsed in the browser or caller from user-supplied text. This adapter does not grant redistribution rights and does not upload the list.",
      parser: "js/historical-network.js parseTextfilesHistoricalList/1",
    },
    observations,
    warnings,
  };
}

const FIDONET_MONTHS = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

const FIDONET_KEYWORDS = new Map([
  ["", ""],
  ["pvt", "Pvt"],
  ["hold", "Hold"],
  ["down", "Down"],
  ["hub", "Hub"],
  ["host", "Host"],
  ["region", "Region"],
  ["zone", "Zone"],
]);

const FIDONET_ADMIN_KEYWORDS = new Set(["Zone", "Region", "Host", "Hub"]);
const NODEDIFF_COMMAND_RE = /^([ACD])(\d{1,5})$/;

function splitHistoricalLines(text) {
  let value = String(text ?? "");
  const eofIndex = value.indexOf("\u001a");
  const dataAfterEof = eofIndex >= 0 ? value.slice(eofIndex + 1).trim().length > 0 : false;
  if (eofIndex >= 0) value = value.slice(0, eofIndex);
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return { lines, hadEof: eofIndex >= 0, dataAfterEof };
}

function parseFidonetHeader(line) {
  if (!nonEmpty(line)) return null;
  const dateMatch = line.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})\b/i);
  let issued = null;
  let computedDayNumber = null;
  if (dateMatch) {
    const month = FIDONET_MONTHS[dateMatch[1].toLowerCase()];
    const day = Number(dateMatch[2]);
    const year = Number(dateMatch[3]);
    const candidate = new Date(Date.UTC(year, Number(month) - 1, day));
    if (
      candidate.getUTCFullYear() === year
      && candidate.getUTCMonth() === Number(month) - 1
      && candidate.getUTCDate() === day
    ) {
      issued = `${year}-${month}-${String(day).padStart(2, "0")}`;
      computedDayNumber = Math.round((candidate.valueOf() - Date.UTC(year, 0, 0)) / 86_400_000);
    }
  }
  const dayMatch = line.match(/\bDay number\s+(\d{1,3})\b/i);
  const crcMatch = line.match(/:\s*(\d{5})\s*$/);
  return {
    raw: line,
    issued,
    dayNumber: dayMatch ? Number(dayMatch[1]) : null,
    computedDayNumber,
    crc: crcMatch ? crcMatch[1] : null,
  };
}

const decodeFidonetField = (value) => String(value ?? "").replace(/_+/g, " ").trim();

function parseFidonetLocation(locationRaw) {
  const raw = String(locationRaw ?? "").trim();
  const suffix = raw.match(/^(.*)_([A-Z]{2})$/);
  if (suffix) {
    return {
      locality: decodeFidonetField(suffix[1]) || null,
      state: suffix[2],
      location: decodeFidonetField(raw) || null,
    };
  }
  const locality = decodeFidonetField(raw) || null;
  return { locality, state: null, location: locality };
}

function parseFidonetPhone(phoneRaw) {
  const raw = String(phoneRaw ?? "").trim();
  if (raw === "-Unpublished-") return { phone: null, unpublished: true, encodedIpv4: false };
  const parts = raw.split("-").filter(Boolean);
  if (parts[0] === "000") return { phone: null, unpublished: false, encodedIpv4: true };
  const groups = parts.length >= 4 ? parts.slice(-3) : parts;
  if (
    groups.length === 3
    && /^\d{3}$/.test(groups[0])
    && /^\d{3}$/.test(groups[1])
    && /^\d{4}$/.test(groups[2])
  ) {
    return { phone: groups.join("-"), unpublished: false, encodedIpv4: false };
  }
  return { phone: null, unpublished: false, encodedIpv4: false };
}

/** Conservative local-import format detection for the supported adapters. */
export function detectHistoricalImportFormat(text) {
  const { lines } = splitHistoricalLines(text);
  const nonEmptyLines = lines.map((line) => line.trim()).filter(Boolean);
  if (
    nonEmptyLines[0]?.startsWith(";")
    && NODEDIFF_COMMAND_RE.test(nonEmptyLines[1] ?? "")
  ) {
    return "fidonet-nodediff";
  }
  const sample = nonEmptyLines.slice(0, 30);
  if (sample.some((line) => /^(?:Zone|Region|Host|Hub|Pvt|Hold|Down)?,\d+,/.test(line))) {
    return "fidonet-nodelist";
  }
  return "textfiles-historical-list";
}

/**
 * Parse a user-supplied FidoNet distribution nodelist (FTS-5000 shape).
 *
 * Data lines become observations, including Zone/Region/Host/Hub branch
 * records. The parser derives the zone:net/node address from the flat-file
 * administrative context, but it does not canonicalize systems, infer
 * physical routes, or claim that a Hub/Host relationship is a physical edge.
 * The header CRC is preserved as source metadata; this evidence adapter
 * does not verify it.
 */
export function parseFidonetNodelist(text, {
  snapshotId = "local-fidonet-nodelist",
  title = "Local FidoNet nodelist import",
  captureUri = "local-file:user-supplied",
  sha256 = null,
  byteLength = null,
  defaultZone = null,
  issuedOverride = null,
} = {}) {
  const { lines, dataAfterEof } = splitHistoricalLines(text);
  const observations = [];
  const warnings = [];
  const stats = { commentLines: 0, dataLines: 0, skippedLines: 0, duplicateAddresses: 0 };
  if (dataAfterEof) warnings.push("Data after the Ctrl-Z EOF marker was ignored, as required for a distribution nodelist.");

  const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);
  const headerLine = firstLineIndex >= 0 && lines[firstLineIndex].trimStart().startsWith(";")
    ? lines[firstLineIndex].trim()
    : null;
  const header = parseFidonetHeader(headerLine);
  const issued = issuedOverride ?? header?.issued ?? null;
  if (!headerLine) warnings.push("No FTS-5000 special-header comment was found on the first non-empty line.");
  if (header && !header.issued && !issuedOverride) warnings.push("The FidoNet header date could not be parsed; observations will be undated until the caller supplies one.");
  if (
    header?.dayNumber != null
    && header?.computedDayNumber != null
    && header.dayNumber !== header.computedDayNumber
  ) {
    warnings.push(`Header day number ${header.dayNumber} does not match the day-of-year ${header.computedDayNumber} computed from ${header.issued}.`);
  }
  if (header?.crc) warnings.push(`Header CRC ${header.crc} was preserved but not verified by this evidence adapter.`);

  let context = {
    zone: Number.isInteger(defaultZone) && defaultZone >= 1 && defaultZone <= 32767 ? defaultZone : null,
    region: null,
    net: null,
    hub: null,
    branchKind: null,
  };
  if (defaultZone != null && context.zone == null) warnings.push(`Ignoring invalid defaultZone ${defaultZone}; expected an integer from 1 to 32767.`);
  const addressLines = new Map();

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith(";")) {
      stats.commentLines += 1;
      if (/^;[SUFAE]*E[SUFAE]*(?:\s|$)/.test(trimmed)) warnings.push(`line ${lineNo}: nodelist error comment preserved as a warning: ${trimmed}`);
      return;
    }

    const fieldsRaw = line.split(",");
    if (fieldsRaw.length < 7) {
      stats.skippedLines += 1;
      warnings.push(`line ${lineNo}: skipped; a FidoNet data line needs at least seven comma-separated fields.`);
      return;
    }

    const keywordRaw = fieldsRaw[0].trim();
    const keyword = FIDONET_KEYWORDS.get(keywordRaw.toLowerCase()) ?? keywordRaw;
    if (!FIDONET_KEYWORDS.has(keywordRaw.toLowerCase())) {
      warnings.push(`line ${lineNo}: unrecognized FidoNet keyword ${keywordRaw || "<empty>"}; record kept as an observation without changing branch context.`);
    }
    const nodeFieldRaw = fieldsRaw[1].trim();
    const nodeNumber = /^\d+$/.test(nodeFieldRaw) ? Number(nodeFieldRaw) : null;
    if (nodeNumber == null || nodeNumber < 1 || nodeNumber > 32767) {
      stats.skippedLines += 1;
      warnings.push(`line ${lineNo}: skipped; node-number field must be an integer from 1 to 32767.`);
      return;
    }

    let fidonetAddress = null;
    let branchKind = context.branchKind;
    if (keyword === "Zone") {
      context = { zone: nodeNumber, region: nodeNumber, net: nodeNumber, hub: null, branchKind: "zone" };
      branchKind = "zone";
      fidonetAddress = `${nodeNumber}:${nodeNumber}/0`;
    } else if (keyword === "Region") {
      branchKind = "region";
      if (context.zone == null) {
        warnings.push(`line ${lineNo}: Region appears before a Zone or defaultZone, so no full address was derived.`);
      } else {
        context = { ...context, region: nodeNumber, net: nodeNumber, hub: null, branchKind: "region" };
        fidonetAddress = `${context.zone}:${nodeNumber}/0`;
      }
    } else if (keyword === "Host") {
      branchKind = "host";
      if (context.zone == null) {
        warnings.push(`line ${lineNo}: Host appears before a Zone or defaultZone, so no full address was derived.`);
      } else {
        context = { ...context, net: nodeNumber, hub: null, branchKind: "host" };
        fidonetAddress = `${context.zone}:${nodeNumber}/0`;
      }
    } else if (keyword === "Hub") {
      branchKind = "hub";
      if (context.zone == null || context.net == null) {
        warnings.push(`line ${lineNo}: Hub appears before Zone/Host context, so no full address was derived.`);
      } else {
        context = { ...context, hub: nodeNumber, branchKind: "hub" };
        fidonetAddress = `${context.zone}:${context.net}/${nodeNumber}`;
      }
    } else if (context.zone == null || context.net == null) {
      warnings.push(`line ${lineNo}: member record appears before Zone/Host context, so no full address was derived.`);
    } else {
      fidonetAddress = `${context.zone}:${context.net}/${nodeNumber}`;
    }

    const locationRaw = fieldsRaw[3].trim();
    const location = parseFidonetLocation(locationRaw);
    const phoneRaw = fieldsRaw[5].trim();
    const phone = parseFidonetPhone(phoneRaw);
    const flags = fieldsRaw.slice(7).map((flag) => flag.trim()).filter(Boolean);
    const name = decodeFidonetField(fieldsRaw[2]) || null;
    const sysop = decodeFidonetField(fieldsRaw[4]) || null;
    const observationWarnings = [
      "Parsed locally from a user-supplied FidoNet nodelist; no canonical merge has been performed.",
    ];
    if (FIDONET_ADMIN_KEYWORDS.has(keyword)) {
      observationWarnings.push("Administrative branch record; source-stated hierarchy alone does not prove a physical route, session, or edge geometry.");
    }
    if (["Pvt", "Hold", "Down"].includes(keyword)) {
      observationWarnings.push(`${keyword} is a historical listing status only; do not dial or probe the listed system.`);
    }
    if (phone.unpublished) observationWarnings.push("Phone field is -Unpublished-; no dial string is exposed.");
    if (phone.encodedIpv4) {
      observationWarnings.push("Phone field begins with 000 and appears to encode an IPv4 address; it is preserved as phoneRaw and is not treated as a telephone number.");
    }
    if (!fidonetAddress) {
      observationWarnings.push("Full FidoNet address could not be derived from the preceding administrative context.");
    }
    if (!name) warnings.push(`line ${lineNo}: data line has no node name.`);

    if (fidonetAddress) {
      const seen = addressLines.get(fidonetAddress) ?? [];
      seen.push(lineNo);
      addressLines.set(fidonetAddress, seen);
    }
    const addressSlug = fidonetAddress ? fidonetAddress.replace(/[^a-zA-Z0-9]+/g, "-") : "unaddressed";
    stats.dataLines += 1;
    observations.push({
      id: `local-fido-${String(observations.length + 1).padStart(4, "0")}-${addressSlug}-line-${lineNo}`,
      snapshotId,
      locator: `line ${lineNo}: FidoNet data line${fidonetAddress ? ` for ${fidonetAddress}` : ""}`,
      observedAt: issued,
      validFrom: null,
      validTo: null,
      evidenceTier: "local-user-import",
      rawTextStatus: "user-supplied-local-text",
      rawText: line,
      fields: {
        name,
        phone: phone.phone,
        phoneRaw: phoneRaw || null,
        phoneUnpublished: phone.unpublished,
        locality: location.locality,
        state: location.state,
        location: location.location,
        locationRaw: locationRaw || null,
        sysop,
        software: null,
        years: null,
        comments: null,
        fidonetAddress,
        fidonetKeyword: keyword || "Node",
        fidonetZone: context.zone,
        fidonetRegion: context.region,
        fidonetNet: context.net,
        fidonetHub: context.hub,
        fidonetBranch: branchKind ? `${branchKind} segment` : null,
        nodeNumber,
        dceSpeed: fieldsRaw[6].trim() || null,
        flags,
      },
      warnings: observationWarnings,
    });
  });

  for (const [address, lineNumbers] of addressLines) {
    if (lineNumbers.length < 2) continue;
    stats.duplicateAddresses += 1;
    warnings.push(`Duplicate FidoNet address ${address} at lines ${lineNumbers.join(", ")}; observations were kept separate for review.`);
  }

  return {
    snapshot: {
      id: snapshotId,
      title,
      publisher: "user-supplied local text",
      editor: null,
      issued,
      issuedLabel: headerLine ? `FTS-5000 header: ${headerLine}` : "Imported locally; source publication date must be supplied by the user before dataset use",
      validFrom: null,
      validTo: null,
      captureUri,
      captureStatus: "user-supplied-local-text",
      sha256,
      byteLength,
      format: "FidoNet distribution nodelist (FTS-5000.005)",
      header,
      rightsStatus: "local-import-only",
      rightsNote: "Parsed locally from user-supplied text. Historical FidoNet nodelist prologues checked for this adapter grant use/intra-FidoNet distribution for FidoNet communication and reserve other uses absent express written consent; this adapter therefore does not claim bundled-redistribution rights.",
      parser: "js/historical-network.js parseFidonetNodelist/1 (FTS-5000.005)",
    },
    observations,
    warnings,
    stats,
  };
}

/**
 * Apply one FTS-5000 nodediff editing script to a previous nodelist.
 *
 * The first nodediff line must exactly match the previous nodelist's first
 * line (after line-ending normalization). A/C/D commands are applied in
 * order, and the script must consume the complete previous file. Output is
 * returned in memory only; the resulting header CRC is parsed but not
 * verified.
 */
export function applyFidonetNodediff(previousText, diffText, {
  appendEof = true,
  lineEnding = "\r\n",
} = {}) {
  const previous = splitHistoricalLines(previousText);
  const diff = splitHistoricalLines(diffText);
  const errors = [];
  const warnings = [];
  const stats = { commands: 0, addedLines: 0, copiedLines: 0, deletedLines: 0 };
  if (diff.hadEof) warnings.push("Nodediff contains a Ctrl-Z marker; FTS-5000 says a nodediff has no terminating EOF character, so parsing stopped there.");
  if (previous.lines.length === 0) errors.push("Previous nodelist is empty.");
  if (diff.lines.length === 0) errors.push("Nodediff is empty.");
  if (previous.lines.length > 0 && diff.lines.length > 0 && diff.lines[0] !== previous.lines[0]) {
    errors.push("Nodediff first line does not exactly match the previous nodelist first line; refusing to apply it to the wrong edition.");
  }

  const output = [];
  let previousIndex = 0;
  let diffIndex = 1;
  while (errors.length === 0 && diffIndex < diff.lines.length) {
    const commandLine = diff.lines[diffIndex].trim();
    const commandLineNo = diffIndex + 1;
    diffIndex += 1;
    const match = commandLine.match(NODEDIFF_COMMAND_RE);
    if (!match) {
      errors.push(`Nodediff line ${commandLineNo}: expected an A, C, or D command, got ${JSON.stringify(commandLine)}.`);
      break;
    }
    const [, command, countRaw] = match;
    const count = Number(countRaw);
    if (count < 1 || count > 32767) {
      errors.push(`Nodediff line ${commandLineNo}: command count must be from 1 to 32767.`);
      break;
    }
    stats.commands += 1;
    if (command === "A") {
      if (diffIndex + count > diff.lines.length) {
        errors.push(`Nodediff line ${commandLineNo}: A${count} needs ${count} following lines, but only ${diff.lines.length - diffIndex} remain.`);
        break;
      }
      output.push(...diff.lines.slice(diffIndex, diffIndex + count));
      diffIndex += count;
      stats.addedLines += count;
    } else if (command === "C") {
      if (previousIndex + count > previous.lines.length) {
        errors.push(`Nodediff line ${commandLineNo}: C${count} exceeds the remaining previous-nodelist lines.`);
        break;
      }
      output.push(...previous.lines.slice(previousIndex, previousIndex + count));
      previousIndex += count;
      stats.copiedLines += count;
    } else {
      if (previousIndex + count > previous.lines.length) {
        errors.push(`Nodediff line ${commandLineNo}: D${count} exceeds the remaining previous-nodelist lines.`);
        break;
      }
      previousIndex += count;
      stats.deletedLines += count;
    }
  }
  if (errors.length === 0 && previousIndex !== previous.lines.length) {
    errors.push(`Nodediff consumed ${previousIndex} of ${previous.lines.length} previous-nodelist lines; refusing a partial edit.`);
  }

  const previousHeader = parseFidonetHeader(previous.lines[0] ?? null);
  const outputHeader = errors.length === 0 ? parseFidonetHeader(output[0] ?? null) : null;
  if (outputHeader?.crc) warnings.push(`Output header CRC ${outputHeader.crc} was parsed but not verified.`);
  return {
    text: errors.length === 0
      ? `${output.join(lineEnding)}${output.length ? lineEnding : ""}${appendEof ? "\u001a" : ""}`
      : null,
    lines: errors.length === 0 ? output : [],
    previousHeader,
    outputHeader,
    errors,
    warnings,
    stats,
  };
}

/** Apply an ordered chain of nodediffs; stop at the first edition mismatch. */
export function applyFidonetNodediffChain(initialText, diffTexts, options = {}) {
  let text = initialText;
  const results = [];
  for (const diffText of asArray(diffTexts)) {
    const result = applyFidonetNodediff(text, diffText, options);
    results.push(result);
    if (result.errors.length > 0) {
      return {
        text: null,
        results,
        errors: result.errors,
        warnings: results.flatMap((item) => item.warnings),
      };
    }
    text = result.text;
  }
  return {
    text,
    results,
    errors: [],
    warnings: results.flatMap((item) => item.warnings),
  };
}

const csvCell = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Export observations (not inferred nodes/edges) as CSV. */
export function observationsToCsv(pack) {
  const headers = [
    "observation_id",
    "snapshot_id",
    "locator",
    "observed_at",
    "valid_from",
    "valid_to",
    "evidence_tier",
    "name",
    "phone",
    "locality",
    "state",
    "sysop",
    "software",
    "years",
    "fidonet_address",
    "fidonet_keyword",
    "phone_raw",
    "fidonet_flags",
  ];
  const rows = asArray(pack?.observations).map((observation) => {
    const fields = observation.fields ?? {};
    return [
      observation.id,
      observation.snapshotId,
      observation.locator,
      observation.observedAt,
      observation.validFrom,
      observation.validTo,
      observation.evidenceTier,
      fields.name,
      fields.phone,
      fields.locality,
      fields.state,
      fields.sysop,
      fields.software,
      fields.years,
      fields.fidonetAddress,
      fields.fidonetKeyword,
      fields.phoneRaw,
      asArray(fields.flags).join(" "),
    ].map(csvCell).join(",");
  });
  return [headers.join(","), ...rows].join("\n") + "\n";
}
