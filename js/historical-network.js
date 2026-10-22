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
      sha256: null,
      rightsStatus: "local-import-only",
      rightsNote: "Parsed in the browser or caller from user-supplied text. This adapter does not grant redistribution rights and does not upload the list.",
      parser: "js/historical-network.js parseTextfilesHistoricalList/1",
    },
    observations,
    warnings,
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
    ].map(csvCell).join(",");
  });
  return [headers.join(","), ...rows].join("\n") + "\n";
}
