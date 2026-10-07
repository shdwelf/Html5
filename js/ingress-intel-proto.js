/**
 * INGRESS INTEL 4Dwm — wire formats.
 *
 * A reader and writer for everything the intel map speaks, so that a live
 * payload, a file dropped from a browser's Network tab, and an IITC layer export
 * all land in one shape. No network here: this module is pure, which is what
 * lets it run under node in the test suite and inside the .xdc with no fetch.
 *
 * Formats handled, all of them real:
 *   1. getEntities / get_thinned_entities responses (current):
 *        result.map[tileKey] = { gameEntities: [[guid, timestamp, data], …],
 *                                deletedGameEntityGuids: [guid, …] }
 *      with data an array whose first element is the type letter
 *        portal 'p': [type, team, latE6, lngE6, level, health, resCount, image,
 *                     title, ornaments, mission, mission50plus, artifactBrief,
 *                     timestamp, mods[], resonators[], owner, artifactDetail, history]
 *        link   'l': [type, team, oGuid, oLatE6, oLngE6, dGuid, dLatE6, dLngE6]
 *        field  'c': [type, team, [[guid,latE6,lngE6], ×3]]
 *   2. the older object form (json_examples/get_thinned_entities-response.js):
 *        gameEntities: [[guid, ts, {type:"portal", team:"RESISTANCE", latE6, …}]]
 *      and the keyed form { gameEntities: { guid: [ts, "PORTAL", data] } }
 *   3. getPortal / get_portal_details responses (portalV2 + resonatorArray)
 *   4. IITC layer exports: GeoJSON FeatureCollection, KML Placemarks, CSV
 *   5. intel permalinks: https://intel.ingress.com/intel?ll=..&z=..&pll=..&pguid=..
 *
 * Sources: IITC-CE core/code/{entity_decode,map_request,map_renderer,map_tiles,
 * total-conversion-build}.js and json_examples/, read at HEAD on 2026-10-07.
 */

import {
  LEVEL_COLORS,
  MAX_DATA_ZOOM,
  TILES_PER_EDGE,
  TEAM_BY_CODE,
  TEAM_BY_CODENAME,
  TEAM_BY_KEY,
  ZOOM_TO_LEVEL,
  ZOOM_TO_LINK_KM,
} from "./ingress-intel-data.js";

/* -------------------------------------------------------------------- teams */

/**
 * Team letters are not stable across API generations: 'M' means MACHINA in the
 * current codes and Matter (Resistance) in the 2012–2014 RED-era letters, and
 * 'L' meant "locked, own team" rather than any faction. Rather than silently
 * guessing, the reader keeps the raw token on every record (`raw.team`) and the
 * table below resolves what it can, flagging the ambiguity for the dossier.
 */
const TEAM_ALIAS = {
  N: "NEU", NEUTRAL: "NEU", NONE: "NEU", "": "NEU",
  R: "RES", RESISTANCE: "RES", MATTER: "RES",
  E: "ENL", ENLIGHTENED: "ENL", A: "ENL",
  M: "MAC", __MACHINA__: "MAC", MACHINA: "MAC",
  RES: "RES", ENL: "ENL", NEU: "NEU", MAC: "MAC",
  L: null, // legacy "locked" — faction is not implied by this letter
};

const AMBIGUOUS = new Set(["M", "L"]);

export function teamOf(input) {
  const raw = input && typeof input === "object" ? input.team : input;
  let key = null;
  if (typeof raw === "number") key = ["NEU", "RES", "ENL", "MAC"][raw] ?? null;
  else if (typeof raw === "string") {
    const up = raw.toUpperCase();
    key = TEAM_ALIAS[up] !== undefined ? TEAM_ALIAS[up] : TEAM_ALIAS[raw] ?? null;
  }
  const faction = key ? TEAM_BY_KEY[key] : TEAM_BY_KEY.NEU;
  return {
    ...faction,
    raw: raw == null ? "" : String(raw),
    ambiguous: typeof raw === "string" && AMBIGUOUS.has(raw.toUpperCase()),
  };
}

/* ------------------------------------------------------------ coordinate E6 */

const e6 = (v) => (typeof v === "number" && Number.isFinite(v) ? v / 1e6 : null);

function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function clampLat(lat) { return lat == null ? null : Math.max(-85, Math.min(85, lat)); }
function wrapLon(lon) {
  if (lon == null) return null;
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  return l;
}

/* ------------------------------------------------------- entity-array forms */

function decodePortalArray(a) {
  const mods = Array.isArray(a[14]) ? a[14].map((m) => (Array.isArray(m) ? { owner: m[0], name: m[1], rarity: m[2], stats: m[3] } : m)) : [];
  const resonators = Array.isArray(a[15])
    ? a[15].map((r, slot) => (Array.isArray(r) ? { slot, owner: r[0], level: num(r[1]), energy: num(r[2]) } : { slot, ...(r || {}) }))
    : [];
  return {
    team: a[1],
    latE6: a[2],
    lngE6: a[3],
    level: num(a[4]),
    health: num(a[5]),
    resCount: num(a[6]),
    image: typeof a[7] === "string" ? a[7] : "",
    title: typeof a[8] === "string" ? a[8] : "",
    timestamp: num(a[13]),
    mods,
    resonators,
    owner: typeof a[16] === "string" ? a[16] : null,
    history: typeof a[18] === "number"
      ? { visited: !!(a[18] & 1), captured: !!(a[18] & 2), scoutControlled: !!(a[18] & 4) }
      : null,
  };
}

function decodeLinkArray(a) {
  return {
    team: a[1],
    oGuid: a[2],
    oLatE6: a[3],
    oLngE6: a[4],
    dGuid: a[5],
    dLatE6: a[6],
    dLngE6: a[7],
  };
}

function decodeFieldArray(a) {
  const pts = Array.isArray(a[2]) ? a[2] : [];
  const corner = (p) => (Array.isArray(p) ? { guid: p[0], latE6: p[1], lngE6: p[2] } : p || null);
  return { team: a[1], points: [corner(pts[0]), corner(pts[1]), corner(pts[2])] };
}

/** Maps the older object form onto the same field names. */
function decodePortalObject(o) {
  return {
    team: o.team,
    latE6: o.latE6 != null ? o.latE6 : Math.round((num(o.lat) ?? 0) * 1e6),
    lngE6: o.lngE6 != null ? o.lngE6 : Math.round((num(o.lng) ?? 0) * 1e6),
    level: num(o.level),
    health: num(o.health),
    resCount: num(o.resCount),
    image: o.image || o.imageUrl || "",
    title: o.title || o.name || "",
    timestamp: num(o.timestamp),
    mods: Array.isArray(o.mods) ? o.mods : [],
    resonators: Array.isArray(o.resonators) ? o.resonators : [],
    owner: o.owner ?? null,
    history: o.history ?? null,
  };
}

/* ------------------------------------------------------- the normalized frame */

/**
 * A frame is the one shape everything downstream consumes:
 *   { source, fetched, tiles:[…], portals:[…], links:[…], fields:[…],
 *     plexts:[…], deleted:[…], provenance, stats }
 * Records are flat and lon/lat is in degrees — E6 lives only on the wire.
 */
export function emptyFrame(source = "unknown") {
  return {
    source,
    fetched: Date.now(),
    tiles: [],
    portals: [],
    links: [],
    fields: [],
    plexts: [],
    deleted: [],
    provenance: "",
    params: null,
    warnings: [],
  };
}

let seqCounter = 0;
const nextSeq = () => ++seqCounter;

function portalRecord(guid, d, ts, frame) {
  const team = teamOf(d.team);
  const lat = clampLat(e6(d.latE6));
  const lon = wrapLon(e6(d.lngE6));
  if (lat == null || lon == null) {
    frame.warnings.push(`portal ${guid}: unusable coordinates (${d.latE6}, ${d.lngE6}) — skipped`);
    return null;
  }
  const resonators = (d.resonators || []).filter((r) => r && r.level != null);
  const mu = resonators.length ? resonators.reduce((s, r) => s + (r.level || 0), 0) : (d.level != null ? d.level * 8 : 0);
  return {
    seq: nextSeq(),
    kind: "portal",
    guid,
    title: d.title || "(untitled portal)",
    lat,
    lon,
    team: team.key,
    raw: { team: team.raw },
    ambiguousTeam: team.ambiguous,
    color: team.color,
    levelColor: LEVEL_COLORS[Math.max(0, Math.min(8, d.level ?? 0))],
    level: d.level,
    health: d.health,
    resCount: d.resCount ?? resonators.length,
    resonators,
    mods: d.mods || [],
    owner: d.owner ?? null,
    history: d.history,
    image: d.image || "",
    timestamp: d.timestamp ?? ts ?? null,
    mu,
    tier: "official",
    provenance: "wire · getEntities portal entity",
  };
}

function linkRecord(guid, d, ts, frame) {
  const a = { lat: clampLat(e6(d.oLatE6 ?? d.latE6)), lon: wrapLon(e6(d.oLngE6 ?? d.lngE6)) };
  const b = { lat: clampLat(e6(d.dLatE6)), lon: wrapLon(e6(d.dLngE6)) };
  if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) {
    frame.warnings.push(`link ${guid}: missing end coordinates — skipped`);
    return null;
  }
  const team = teamOf(d.team);
  return {
    seq: nextSeq(),
    kind: "link",
    guid,
    team: team.key,
    color: team.color,
    raw: { team: team.raw },
    oGuid: d.oGuid ?? null,
    dGuid: d.dGuid ?? null,
    from: a,
    to: b,
    lengthKm: greatCircleKm(a.lat, a.lon, b.lat, b.lon),
    timestamp: num(d.timestamp) ?? ts ?? null,
    tier: "official",
    provenance: "wire · getEntities link entity",
  };
}

function fieldRecord(guid, d, ts, frame) {
  const pts = (d.points || []).filter(Boolean).map((p) => ({
    guid: p.guid ?? null,
    lat: clampLat(e6(p.latE6)),
    lon: wrapLon(e6(p.lngE6)),
  }));
  if (pts.length < 3 || pts.some((p) => p.lat == null || p.lon == null)) {
    frame.warnings.push(`field ${guid}: fewer than three usable corners — skipped`);
    return null;
  }
  const team = teamOf(d.team);
  return {
    seq: nextSeq(),
    kind: "field",
    guid,
    team: team.key,
    color: team.color,
    raw: { team: team.raw },
    corners: pts,
    timestamp: num(d.timestamp) ?? ts ?? null,
    mu: num(d.mu) ?? null,
    tier: "official",
    provenance: "wire · getEntities field entity",
  };
}

/**
 * One entry of gameEntities, in whichever of the three shapes Niantic has used.
 * Returns {type, rec} or null when the entry is not something we draw.
 */
function decodeEntity(ent) {
  if (!ent) return null;

  // keyed form: guid → [timestamp, "PORTAL"|"LINK"|"FIELD", data]
  if (Array.isArray(ent) && ent.length >= 2 && typeof ent[1] === "string" && /^(PORTAL|LINK|FIELD|CREATURE|ARTIFACT|MOD)$/i.test(ent[1])) {
    const [timestamp, type, data] = ent;
    return { guid: null, timestamp, type: type.toUpperCase(), data };
  }

  // array/tuple form: [guid, timestamp, data] where data[0] is a type letter
  if (Array.isArray(ent) && ent.length >= 3 && typeof ent[0] === "string") {
    const [guid, timestamp, data] = ent;
    if (typeof data === "string") return null; // deleted-guids style noise
    if (Array.isArray(data)) {
      const letter = String(data[0] || "").toLowerCase();
      if (letter === "p") return { guid, timestamp, type: "PORTAL", data };
      if (letter === "l") return { guid, timestamp, type: "LINK", data };
      if (letter === "c") return { guid, timestamp: timestamp ?? data[5], type: "FIELD", data };
      return null;
    }
    if (data && typeof data === "object") {
      const t = String(data.type || "").toLowerCase();
      if (t === "portal" || data.latE6 != null) return { guid, timestamp, type: "PORTAL", data };
      if (t === "edge" || t === "link" || data.dLatE6 != null) return { guid, timestamp, type: "LINK", data };
      if (t === "region" || t === "field" || data.points) return { guid, timestamp: timestamp ?? data.timestamp, type: "FIELD", data };
    }
    return null;
  }

  // object form keyed by guid, data as an object
  if (ent && typeof ent === "object" && !Array.isArray(ent) && typeof ent.guid === "string") {
    const data = ent.data || ent;
    const t = String(data.type || "").toLowerCase();
    if (t === "portal" || data.latE6 != null) return { guid: ent.guid, timestamp: ent.timestamp, type: "PORTAL", data };
    if (t === "edge" || data.dLatE6 != null) return { guid: ent.guid, timestamp: ent.timestamp, type: "LINK", data };
    if (t === "region" || data.points) return { guid: ent.guid, timestamp: ent.timestamp, type: "FIELD", data };
  }
  return null;
}

function ingestEntity(target, ent) {
  const d = decodeEntity(ent);
  if (!d) return null;
  let rec = null;
  if (d.type === "PORTAL") {
    const data = Array.isArray(d.data) ? decodePortalArray(d.data) : decodePortalObject(d.data);
    rec = portalRecord(d.guid ?? data.guid ?? `p-${target.portals.length}`, data, d.timestamp, target);
    if (rec) rec.guid = d.guid ?? rec.guid;
    if (rec) {
      const i = target.portals.findIndex((p) => p.guid && p.guid === rec.guid);
      if (i >= 0) {
        // newer timestamp wins, as it does in the reference client
        if ((rec.timestamp ?? 0) > (target.portals[i].timestamp ?? 0)) target.portals[i] = rec;
        return rec;
      }
      target.portals.push(rec);
    }
  } else if (d.type === "LINK") {
    const data = Array.isArray(d.data) ? decodeLinkArray(d.data) : d.data;
    rec = linkRecord(d.guid ?? `l-${target.links.length}`, data, d.timestamp, target);
    if (rec) target.links.push(rec);
  } else if (d.type === "FIELD") {
    const data = Array.isArray(d.data) ? decodeFieldArray(d.data) : d.data;
    rec = fieldRecord(d.guid ?? `f-${target.fields.length}`, data, d.timestamp, target);
    if (rec) target.fields.push(rec);
  }
  return rec;
}

/**
 * `{ gameEntities: { guid: [timestamp, "PORTAL", data] } }` — the keyed variant
 * that older captures use. Normalize it onto the [guid, timestamp, data] triple
 * so every shape ends up in one reader.
 */
function keyedToTriple(guid, ent) {
  if (Array.isArray(ent)) return [guid, ent[0], ent[ent.length - 1]];
  if (ent && typeof ent === "object") return [guid, ent.timestamp ?? null, ent.data ?? ent];
  return null;
}

/**
 * getEntities / get_thinned_entities responses arrive as a whole payload, one
 * tile object, or a bare gameEntities array/map — all three have appeared in
 * the wild and in the json_examples fixtures.
 */
export function parseGetEntities(payload, { source = "capture", tiles = [] } = {}) {
  const frame = emptyFrame(source);
  const root = payload && payload.result ? payload.result : payload;
  if (!root) {
    frame.warnings.push("empty payload");
    return frame;
  }
  if (root.raw && typeof root.raw === "string") return parseGetEntities(JSON.parse(root.raw), { source, tiles });

  const eat = (ents) => {
    if (Array.isArray(ents)) { for (const ent of ents) ingestEntity(frame, ent); return; }
    if (ents && typeof ents === "object") {
      for (const [guid, ent] of Object.entries(ents)) {
        const triple = keyedToTriple(guid, ent);
        if (triple) ingestEntity(frame, triple);
      }
    }
  };

  const map = root.map;
  if (map && typeof map === "object") {
    for (const [key, tile] of Object.entries(map)) {
      frame.tiles.push(key);
      if (!tile) continue;
      for (const g of tile.deletedGameEntityGuids || []) frame.deleted.push(g);
      eat(tile.gameEntities);
    }
  } else if (root.gameEntities) {
    eat(root.gameEntities);
  } else if (root.result || root.map) {
    frame.warnings.push("payload has no map / gameEntities section");
  } else {
    frame.warnings.push("unrecognized payload root");
  }

  if (tiles.length && !frame.tiles.length) frame.tiles = tiles.slice();
  applyDeletions(frame);
  frame.provenance = `decoded ${frame.portals.length} portals · ${frame.links.length} links · ${frame.fields.length} fields · ${frame.deleted.length} tombstones`;
  deriveLinksFromFields(frame);
  frame.stats = scoreFrame(frame);
  return frame;
}

/**
 * getEntities tiles report deletedGameEntityGuids. Dropping tombstoned entities
 * is what keeps a long-lived view honest instead of accumulating dead links.
 */
export function applyDeletions(frame) {
  if (!frame.deleted.length) return frame;
  const dead = new Set(frame.deleted);
  const drop = (arr) => arr.filter((r) => !(r.guid && dead.has(r.guid)));
  frame.portals = drop(frame.portals);
  frame.links = drop(frame.links);
  frame.fields = drop(frame.fields);
  return frame;
}

/**
 * Fields arrive as three corners; the stock client also *fakes* the edges of a
 * field when it has no real link entity (IITC marks those guids `.b_ab`/`_ac`/
 * `_bc` and deliberately ignores them). We do the same: no invented links.
 * The hook exists so the behaviour is visible and testable, not buried.
 */
function deriveLinksFromFields(frame) {
  frame.fakedLinksSkipped = true;
  return frame;
}
export { deriveLinksFromFields };

/* ------------------------------------------------- portal details (getPortal) */

/**
 * A getPortal response carries the full dossier: resonators with owners, mods,
 * linked edges, fields, and (in the current client) tags and history. Fold it
 * onto an existing portal record, or return a standalone record.
 */
export function parsePortalDetails(payload, { base = null } = {}) {
  const p = payload && payload.result ? payload.result : payload;
  if (!p || typeof p !== "object") return null;
  const loc = p.locationE6 || {};
  const lat = clampLat(e6(p.latE6 ?? loc.latE6));
  const lon = wrapLon(e6(p.lngE6 ?? loc.lngE6));
  const resonators = (p.resonatorArray?.resonators || p.resonators || []).map((r, i) => ({
    slot: r?.slot ?? i,
    level: num(r?.level),
    energy: num(r?.energy) ?? num(r?.energyNow),
    energyTotal: num(r?.energyTotal) ?? (num(r?.level) != null ? num(r?.level) * 1000 : null),
    owner: r?.ownerGuid ?? r?.owner ?? null,
    distanceToPortal: num(r?.distanceToPortal),
  }));
  const team = teamOf(p.controllingTeam?.team ?? p.team);
  const rec = {
    ...(base || {}),
    kind: "portal",
    guid: p.guid ?? base?.guid ?? null,
    title: p.title ?? p.name ?? base?.title ?? "(portal)",
    lat: lat ?? base?.lat ?? null,
    lon: lon ?? base?.lon ?? null,
    team: team.key,
    color: team.color,
    raw: { team: team.raw },
    level: num(p.level) ?? (resonators.length ? Math.max(...resonators.map((r) => r.level || 0)) : base?.level ?? 0),
    health: num(p.health) ?? base?.health ?? (resonators.length ? healthFromResonators(resonators) : null),
    resCount: p.resCount ?? resonators.length,
    resonators,
    mods: p.mods ?? p.portalV2?.portalsMods ?? p.inventory ?? base?.mods ?? [],
    image: p.image ?? p.imageUrl ?? base?.image ?? "",
    timestamp: num(p.timestamp) ?? base?.timestamp ?? null,
    mu: resonators.reduce((s, r) => s + (r.level || 0), 0) || base?.mu || 0,
    links: (p.portalV2?.linkedEdges || []).map((e) => ({
      guid: e.otherPortalGuid ?? e.portalGuid,
      lengthKm: e.length ? num(e.length) / 1000 : null,
      originMods: e.originMods ?? [],
      destinationMods: e.destinationMods ?? [],
    })),
    fields: (p.portalV2?.fieldIndices || []).map((f) => f?.points?.length).filter(Boolean),
    tags: p.tags ?? [],
    tier: "official",
    provenance: "wire · getPortal details",
  };
  return rec;
}

function healthFromResonators(resonators) {
  let now = 0;
  let total = 0;
  for (const r of resonators) {
    now += r.energy || 0;
    total += (r.level || 0) * 1000;
  }
  return total ? Math.round((now / total) * 100) : null;
}

/* ------------------------------------------------------------- comms/plexts */

/**
 * getUpdates returns plexts — the comms feed. Shape (current):
 *   result.plexts = [{timestamp, plext:{ownerName, messageData, team, latE6, lngE6, plextType}}]
 * The viewer uses the geo-tagged ones as ping markers.
 */
export function parsePlexts(payload) {
  const frame = emptyFrame("capture");
  const p = payload && payload.result ? payload.result : payload;
  const list = p?.plexts || p?.result || (Array.isArray(p) ? p : []);
  for (const entry of Array.isArray(list) ? list : []) {
    const px = entry.plext || entry;
    const lat = clampLat(e6(px.latE6 ?? px.latitudeE6 ?? entry.latE6));
    const lon = wrapLon(e6(px.lngE6 ?? entry.lngE6));
    const md = px.messageData || {};
    const name =
      md.portal?.title || md.portalName || md.team?.name || md.artifactFragment?.displayName || md.operationData?.name || "";
    const msg =
      md.autoPlext?.plextMessage ||
      md.plainText ||
      (px.plextType ? String(px.plextType).replace(/_/g, " ").toLowerCase() : "");
    const text = [msg, name].filter(Boolean).join(" · ");
    frame.plexts.push({
      seq: nextSeq(),
      kind: "plext",
      time: num(px.timestamp ?? entry.timestamp) ?? Date.now(),
      team: teamOf(px.team).key,
      color: teamOf(px.team).color,
      lat: lat ?? 0,
      lon: lon ?? 0,
      geo: lat != null && lon != null,
      agent: px.ownerName || px.fromLayer || null,
      text: (text || "comms event").trim(),
      tier: "official",
      provenance: "wire · getUpdates plext",
    });
  }
  return frame;
}

/* ------------------------------------------------------- IITC export formats */

const PROPS_TEAM_KEYS = ["team", "Team", "owner", "data"];

function readGeoJSONPortal(f, i) {
  const coords = f.geometry?.coordinates;
  const [lon, lat] = Array.isArray(coords) ? coords : [];
  const p = f.properties || {};
  const team = p.team ?? (typeof p.team === "string" ? p.team : "");
  const t = teamOf(PROPS_TEAM_KEYS.map((k) => p[k]).find((v) => v != null && (typeof v === "string" ? v.length : true)) ?? team);
  return {
    seq: nextSeq(),
    kind: "portal",
    guid: p.guid ?? p.GUID ?? `gj-${i}`,
    title: p.name ?? p.title ?? f.title ?? "(imported portal)",
    lat: clampLat(num(lat)),
    lon: wrapLon(num(lon)),
    team: t.key,
    color: t.color,
    raw: { team: t.raw },
    level: num(p.level ?? p.tier ?? p.LVL),
    health: num(p.health ?? p.HPT),
    resCount: num(p.resCount),
    resonators: [],
    mods: [],
    image: p.image ?? p.imageUrl ?? "",
    timestamp: num(p.timestamp),
    mu: num(p.mu),
    tier: "community",
    provenance: "import · GeoJSON feature",
  };
}

export function parseGeoJSON(text) {
  const gj = typeof text === "string" ? JSON.parse(text) : text;
  const frame = emptyFrame("capture");
  const feats = gj.type === "FeatureCollection" ? gj.features : gj.type === "Feature" ? [gj] : gj.features || [];
  for (let i = 0; i < feats.length; i++) {
    const f = feats[i];
    const g = f.geometry?.type;
    const p = f.properties || {};
    const t = teamOf(p.team || p.TEAM || p.data?.team);
    if (g === "Point" || g === "MultiPoint") {
      const rec = readGeoJSONPortal(f, i);
      if (rec.lat != null && rec.lon != null) frame.portals.push(rec);
      else frame.warnings.push(`geojson point ${i}: no usable coordinates`);
    } else if (g === "LineString") {
      const c = f.geometry.coordinates;
      if (c.length >= 2) {
        frame.links.push({
          seq: nextSeq(), kind: "link", guid: p.guid ?? `gj-l-${i}`, team: t.key, color: t.color,
          from: { lat: c[0][1], lon: c[0][0] }, to: { lat: c[1][1], lon: c[1][0] },
          lengthKm: greatCircleKm(c[0][1], c[0][0], c[1][1], c[1][0]), timestamp: num(p.timestamp),
          tier: "community", provenance: "import · GeoJSON line",
        });
      }
    } else if (g === "Polygon") {
      const ring = f.geometry.coordinates[0] || [];
      const corners = ring.slice(0, 3).map((c) => ({ lat: c[1], lon: c[0], guid: null }));
      if (corners.length === 3) {
        frame.fields.push({
          seq: nextSeq(), kind: "field", guid: p.guid ?? `gj-f-${i}`, team: t.key, color: t.color,
          corners, mu: num(p.mu), timestamp: num(p.timestamp),
          tier: "community", provenance: "import · GeoJSON polygon",
        });
      }
    }
  }
  frame.provenance = `imported GeoJSON · ${frame.portals.length} pts · ${frame.links.length} lines · ${frame.fields.length} polys`;
  frame.stats = scoreFrame(frame);
  return frame;
}

/**
 * KML Placemarks. Names are the portal titles, so this is the path that accepts
 * a Google-Earth-shaped portal list, and any KML with a Point + a team token.
 */
export function parseKML(text) {
  const frame = emptyFrame("capture");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const places = [...doc.getElementsByTagName("Placemark")];
  places.forEach((pm, i) => {
    const name = pm.getElementsByTagName("name")[0]?.textContent?.trim() || `placemark ${i + 1}`;
    const coordsRaw = pm.getElementsByTagName("coordinates")[0]?.textContent?.trim() || "";
    const first = coordsRaw.split(/\s+/)[0];
    if (!first) return;
    const [lon, lat] = first.split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const data = [...pm.getElementsByTagName("Data"), ...pm.getElementsByTagName("SimpleData")]
      .reduce((acc, el) => { acc[(el.getAttribute("name") || "value")] = el.textContent.trim(); return acc; }, {});
    const t = teamOf(data.team ?? data.TEAM ?? name.match(/\((RES|ENL|NEU)\)/)?.[1]);
    frame.portals.push({
      seq: nextSeq(), kind: "portal", guid: data.guid ?? `kml-${i}`, title: name,
      lat: clampLat(lat), lon: wrapLon(lon), team: t.key, color: t.color, raw: { team: t.raw },
      level: num(data.level ?? data.tier), health: num(data.health), resCount: num(data.resCount),
      resonators: [], mods: [], image: data.image || "", timestamp: null, mu: num(data.mu),
      tier: "community", provenance: "import · KML placemark",
    });
  });
  frame.provenance = `imported KML · ${frame.portals.length} placemarks`;
  frame.warnings.push("KML carries points only — no links or fields exist in the format");
  frame.stats = scoreFrame(frame);
  return frame;
}

/**
 * CSV. Header-driven, so any column order works; the columns the dossier wants
 * are optional. This is also the format the intel-map-adjacent planning tools
 * (Maxfield style portal lists) speak, so name/lat/lng is enough to import.
 */
export function parseCSV(text) {
  const frame = emptyFrame("capture");
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  if (!lines.length) return frame;
  const split = (line) => {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; continue; }
      if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => /^(name|title|portal|lat|latitude|lon|lng)$/i.test(h));
  const cols = hasHeader ? header : ["name", "lat", "lon", "team", "level"];
  const idx = (...names) => names.reduce((acc, n) => (acc >= 0 ? acc : cols.indexOf(n)), -1);
  const iName = idx("name", "title", "portal");
  const iLat = idx("lat", "latitude");
  const iLon = idx("lon", "lng", "longitude", "long");
  const iTeam = idx("team", "faction");
  const iLevel = idx("level", "tier");
  const iGuid = idx("guid", "portal_id");
  const iImage = idx("image", "imageurl", "img");
  const iKind = idx("kind", "type");
  const rows = hasHeader ? lines.slice(1) : lines;
  let deferred = 0;
  rows.forEach((line, i) => {
    const c = split(line);
    // A row our own exporter tagged as a link or a field cannot be a point:
    // geometry needs both ends (and a field needs three), so those rows belong
    // to the GeoJSON export and are counted rather than silently flattened.
    if (iKind >= 0 && c[iKind] && c[iKind] !== "portal") { deferred++; return; }
    const lat = clampLat(num(c[iLat]));
    const lon = wrapLon(num(c[iLon]));
    if (lat == null || lon == null) { frame.warnings.push(`csv row ${i + 1}: skipped (no usable lat/lon)`); return; }
    const t = teamOf(iTeam >= 0 ? c[iTeam] : null);
    frame.portals.push({
      seq: nextSeq(), kind: "portal", guid: iGuid >= 0 ? c[iGuid] : `csv-${i}`, title: iName >= 0 ? c[iName] || `row ${i + 1}` : `row ${i + 1}`,
      lat, lon, team: t.key, color: t.color, raw: { team: t.raw }, level: num(c[iLevel]), health: null,
      resCount: null, resonators: [], mods: [], image: iImage >= 0 ? c[iImage] : "", timestamp: null, mu: null,
      tier: "community", provenance: "import · CSV row",
    });
  });
  frame.provenance = `imported CSV · ${frame.portals.length} rows`;
  frame.stats = scoreFrame(frame);
  if (deferred) frame.warnings.push(`csv: ${deferred} row(s) tagged as links or fields were skipped — geometry needs the GeoJSON export`);
  return frame;
}

/* ------------------------------------------------------------- intel links */

/**
 * The intel map's own permalink format — `ll` is the view centre, `z` the zoom,
 * `pll` a portal to fly to, `pguid` a portal's guid. Parsing it is the one
 * "Ingress connection" that always works, because it is just a URL: an agent
 * pastes a link from the intel map and this viewer jumps to the same place.
 */
export function parseIntelPermalink(url) {
  const out = { ok: false, warnings: [] };
  let u;
  try {
    u = new URL(String(url).trim(), "https://intel.ingress.com/");
  } catch {
    out.warnings.push("not a URL");
    return out;
  }
  const q = u.searchParams;
  const ll = (q.get("ll") || "").split(",").map(Number);
  const pll = (q.get("pll") || "").split(",").map(Number);
  if (ll.length === 2 && ll.every(Number.isFinite)) { out.lat = clampLat(ll[0]); out.lon = wrapLon(ll[1]); out.ok = true; }
  if (pll.length === 2 && pll.every(Number.isFinite)) { out.portalLat = clampLat(pll[0]); out.portalLon = wrapLon(pll[1]); out.ok = true; }
  const z = num(q.get("z"));
  if (z != null) out.zoom = Math.max(1, Math.min(MAX_DATA_ZOOM, Math.round(z)));
  const pg = q.get("pguid") || q.get("pg");
  if (pg) out.pguid = pg;
  if (u.search.includes("ping=1")) out.ping = true;
  out.origin = `${u.protocol}//${u.host}`;
  out.isIntelOrigin = /(^|\.)ingress\.com$/.test(u.hostname);
  return out;
}

export function buildIntelPermalink({ lat, lon, zoom = 12, portalLat, portalLon, pguid, team, layers, host = "https://intel.ingress.com" } = {}) {
  // Commas are spelled literally rather than serialised through URLSearchParams,
  // which would percent-encode them into something the intel site still parses
  // but no agent would recognise when they paste it back into chat.
  const parts = [];
  if (lat != null && lon != null) parts.push(`ll=${lat.toFixed(6)},${lon.toFixed(6)}`);
  if (zoom != null) parts.push(`z=${zoom}`);
  if (portalLat != null && portalLon != null) parts.push(`pll=${portalLat.toFixed(6)},${portalLon.toFixed(6)}`);
  if (pguid) parts.push(`pguid=${encodeURIComponent(pguid)}`);
  if (team) parts.push(`team=${encodeURIComponent(team)}`);
  if (layers) parts.push(`l=${encodeURIComponent(Array.isArray(layers) ? layers.join(",") : String(layers))}`);
  return `${String(host).replace(/\/+$/, "").replace(/\/+intel\/?$/, "")}/intel${parts.length ? `?${parts.join("&")}` : ""}`;
}

/* ------------------------------------------------------------- tile physics */

export function tileParams(zoom, override) {
  const z = Math.max(0, Math.min(MAX_DATA_ZOOM, Math.round(zoom)));
  const tpe = (override?.TILES_PER_EDGE || TILES_PER_EDGE);
  const lvl = (override?.ZOOM_TO_LEVEL || ZOOM_TO_LEVEL);
  const linkKm = (override?.ZOOM_TO_LINK_KM || ZOOM_TO_LINK_KM);
  const maxTpe = tpe[tpe.length - 1];
  return {
    zoom: z,
    tilesPerEdge: tpe[z] || maxTpe,
    level: lvl[z] ?? 0,
    minLinkKm: linkKm[z] ?? 0,
    /** the stock client returns no portals below this data zoom at all */
    hasPortals: z >= linkKm.length,
  };
}

export function lngToTile(lng, params) {
  return Math.floor((((lng + 180) % 360 + 360) % 360) / 360 * params.tilesPerEdge);
}
export function latToTile(lat, params) {
  const r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * params.tilesPerEdge);
}
export function tileToLng(x, params) { return (x / params.tilesPerEdge) * 360 - 180; }
export function tileToLat(y, params) {
  const n = Math.PI - (2 * Math.PI * y) / params.tilesPerEdge;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
export function tileToBBox(key, params) {
  const [z, x, y] = key.split("_").map(Number);
  const p = { ...params, zoom: z, tilesPerEdge: TILES_PER_EDGE[z] || params.tilesPerEdge };
  return { lon0: tileToLng(x, p), lon1: tileToLng(x + 1, p), lat0: tileToLat(y + 1, p), lat1: tileToLat(y, p) };
}

/** `zoom_x_y` plus the level/min-health hint the stock client appends. */
export function pointToTileId(params, x, y, { extended = true } = {}) {
  const tpe = params.tilesPerEdge;
  const wx = ((x % tpe) + tpe) % tpe;
  const base = `${params.zoom}_${wx}_${y}`;
  return extended ? `${base}_${params.level}_8_100` : base;
}

/** All tile keys intersecting a bbox, nearest-to-centre first. */
export function tileKeysForBBox(bbox, zoom, { params, extended = false, limit = 120 } = {}) {
  const p = params || tileParams(zoom);
  const x0 = lngToTile(bbox.lon0, p);
  const x1 = lngToTile(bbox.lon1, p);
  const yN = latToTile(bbox.lat1, p);
  const yS = latToTile(bbox.lat0, p);
  const y0 = Math.max(0, Math.min(yN, yS));
  const y1 = Math.min(p.tilesPerEdge - 1, Math.max(yN, yS));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const keys = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) keys.push({ key: pointToTileId(p, x, y, { extended }), d: (x - cx) ** 2 + (y - cy) ** 2 });
  }
  keys.sort((a, b) => a.d - b.d);
  return keys.map((k) => k.key).slice(0, limit);
}

/* ------------------------------------------------------------------ scoring */

export function scoreFrame(frame) {
  const per = { RES: { portals: 0, mu: 0, links: 0, fields: 0 }, ENL: { portals: 0, mu: 0, links: 0, fields: 0 }, NEU: { portals: 0, mu: 0, links: 0, fields: 0 }, MAC: { portals: 0, mu: 0, links: 0, fields: 0 } };
  for (const p of frame.portals) { const t = per[p.team] || per.NEU; t.portals++; t.mu += p.mu || 0; }
  for (const l of frame.links) { const t = per[l.team] || per.NEU; t.links++; }
  for (const f of frame.fields) {
    const t = per[f.team] || per.NEU;
    t.fields++;
    if (f.mu == null) f.mu = fieldMu(frame, f);
    t.mu += f.mu || 0;
  }
  const total = Object.values(per).reduce((s, t) => s + t.mu, 0) || 1;
  for (const t of Object.values(per)) t.share = Math.round((t.mu / total) * 100);
  return {
    per,
    portals: frame.portals.length,
    links: frame.links.length,
    fields: frame.fields.length,
    ambiguousTeam: frame.portals.filter((p) => p.ambiguousTeam).length,
    maxLinkKm: frame.links.reduce((m, l) => Math.max(m, l.lengthKm || 0), 0),
  };
}

/** Field MU = the weakest corner, per the published rule. */
export function fieldMu(frame, field) {
  if (field.mu != null) return field.mu;
  const byGuid = new Map(frame.portals.map((p) => [p.guid, p]));
  const vals = field.corners.map((c) => (byGuid.get(c.guid)?.mu ?? null)).filter((v) => v != null);
  return vals.length === 3 ? Math.min(...vals) : null;
}

/** The nearest RES↔ENL portal pair — the "contact front" line the HUD draws. */
export function contactFront(frame) {
  const res = frame.portals.filter((p) => p.team === "RES");
  const enl = frame.portals.filter((p) => p.team === "ENL");
  if (!res.length || !enl.length) return null;
  let best = null;
  for (const a of res) {
    for (const b of enl) {
      const d = greatCircleKm(a.lat, a.lon, b.lat, b.lon);
      if (!best || d < best.km) best = { a, b, km: d };
    }
  }
  return best;
}

/* --------------------------------------------------------------- frame merge */

/**
 * Merge an incoming frame into the standing one — guid-keyed, newest timestamp
 * wins, tombstones applied. Same-tile refreshes must not double-draw.
 */
export function mergeFrames(base, incoming, { limit = 4000 } = {}) {
  const out = emptyFrame(base.source);
  out.fetched = incoming?.fetched ?? base.fetched;
  out.params = incoming?.params ?? base.params;
  const byKind = { portal: out.portals, link: out.links, field: out.fields };
  for (const kind of ["portal", "link", "field"]) {
    const map = new Map(base[kind === "portal" ? "portals" : kind === "link" ? "links" : "fields"].map((r) => [r.guid || `#${r.seq}`, r]));
    for (const r of incoming?.[kind === "portal" ? "portals" : kind === "link" ? "links" : "fields"] || []) {
      const key = r.guid || `#${r.seq}`;
      const prev = map.get(key);
      if (!prev || (r.timestamp ?? 0) >= (prev.timestamp ?? 0)) map.set(key, r);
    }
    const list = [...map.values()].slice(-limit);
    byKind[kind].push(...list);
  }
  out.tiles = [...new Set([...base.tiles, ...(incoming?.tiles || [])])].slice(-200);
  out.plexts = [...(base.plexts || []), ...(incoming?.plexts || [])].slice(-400);
  out.deleted = [...new Set([...(base.deleted || []), ...(incoming?.deleted || [])])].slice(-2000);
  out.warnings = (incoming?.warnings || []).slice();
  out.provenance = incoming?.provenance || base.provenance;
  out.source = incoming?.source || base.source;
  out.stats = scoreFrame(out);
  return out;
}

/* ------------------------------------------------------------------- export */

export function toGeoJSON(frame) {
  const fc = { type: "FeatureCollection", name: "ingress-intel-4dwm", features: [] };
  for (const p of frame.portals) {
    fc.features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: { guid: p.guid, name: p.title, kind: "portal", tier: p.tier, team: p.team, level: p.level, health: p.health, resCount: p.resCount, mu: p.mu, timestamp: p.timestamp, provenance: p.provenance },
    });
  }
  for (const l of frame.links) {
    fc.features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[l.from.lon, l.from.lat], [l.to.lon, l.to.lat]] },
      properties: { guid: l.guid, team: l.team, lengthKm: Number.isFinite(l.lengthKm) ? +l.lengthKm.toFixed(3) : null, kind: "link", tier: l.tier, provenance: l.provenance },
    });
  }
  for (const f of frame.fields) {
    const ring = [...f.corners.map((c) => [c.lon, c.lat]), [f.corners[0].lon, f.corners[0].lat]];
    fc.features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: { guid: f.guid, team: f.team, mu: f.mu, kind: "field", tier: f.tier, provenance: f.provenance },
    });
  }
  return JSON.stringify(fc, null, 1);
}

export function toKML(frame) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const pm = (r, desc) =>
    `    <Placemark>\n      <name>${esc(r.title ?? r.kind)}</name>\n      <description>${esc(desc)}</description>\n      <Point><coordinates>${r.lon},${r.lat},0</coordinates></Point>\n    </Placemark>`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    "  <Document>",
    `    <name>ingress-intel 4Dwm export · ${esc(frame.source)}</name>`,
    ...frame.portals.map((p) => pm(p, `${p.team} · L${p.level ?? "?"} · ${p.health ?? "?"}% · ${p.provenance}`)),
    "  </Document>",
    "</kml>",
  ].join("\n");
}

export function toCSV(frame) {
  const esc = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const rows = ["guid,name,lat,lon,team,level,health,resCount,mu,lengthKm,kind,provenance"];
  for (const p of frame.portals) rows.push([p.guid, p.title, p.lat, p.lon, p.team, p.level, p.health, p.resCount, p.mu, "", "portal", p.provenance].map(esc).join(","));
  for (const l of frame.links) rows.push([l.guid, "link", l.from.lat, l.from.lon, l.team, "", "", "", "", l.lengthKm?.toFixed(2), "link", l.provenance].map(esc).join(","));
  for (const f of frame.fields) rows.push([f.guid, "field", f.corners[0].lat, f.corners[0].lon, f.team, "", "", "", f.mu, "", "field", f.provenance].map(esc).join(","));
  return rows.join("\n");
}

/* --------------------------------------------------------------- plumbing */

/** Haversine, km. */
export function greatCircleKm(lat0, lon0, lat1, lon1) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat1 - lat0);
  const dLon = toRad(lon1 - lon0);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat0)) * Math.cos(toRad(lat1)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Spherical surface area of a triangle in km², for field MU sanity checks. */
export function sphericalTriangleKm2(pts) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const [A, B, C] = pts.map((p) => [toRad(p.lat), toRad(p.lon)]);
  const ang = (a, b, c) => {
    const gc = (x, y) => greatCircleKm(x[0], x[1], y[0], y[1]);
    const aa = gc(b, c) / R, bb = gc(a, c) / R, cc = gc(a, b) / R;
    const cosA = (Math.cos(aa) - Math.cos(bb) * Math.cos(cc)) / (Math.sin(bb) * Math.sin(cc) || 1e-12);
    return Math.acos(Math.max(-1, Math.min(1, cosA)));
  };
  const E = ang(A, B, C) + ang(B, A, C) + ang(C, A, B) - Math.PI;
  return Math.abs(E) * R * R;
}

/**
 * Sniff an arbitrary blob of intel text and read it with the right decoder.
 * Order matters: the intel permalink check comes first because a pasted URL is
 * the most common thing an agent has.
 */
export function readIntel(text, { name = "" } = {}) {
  const s = String(text ?? "").trim();
  if (!s) return { kind: "empty", frame: emptyFrame("capture"), warnings: ["nothing to read"] };
  if (/^(https?:)?\/\//i.test(s) || /intel\.ingress\.com/i.test(s)) {
    const link = parseIntelPermalink(s);
    return { kind: "permalink", link, warnings: link.warnings };
  }
  if (s.startsWith("{") || s.startsWith("[")) {
    let json = null;
    try { json = JSON.parse(s); } catch (err) { return { kind: "json-error", error: err.message, warnings: [err.message] }; }
    if (json?.type === "FeatureCollection" || json?.type === "Feature") return { kind: "geojson", frame: parseGeoJSON(json) };
    return { kind: "entities", frame: parseGetEntities(json) };
  }
  if (/<kml[\s>]/i.test(s.slice(0, 400)) || /<Placemark/i.test(s.slice(0, 4000))) return { kind: "kml", frame: parseKML(s) };
  if (/^\s*(guid|name|title|portal|lat|latitude)\s*[,;]/i.test(s)) return { kind: "csv", frame: parseCSV(s) };
  // A CSV with an unknown header: try it if the first line looks like x,y,x…
  const head = s.split("\n")[0];
  if ((head.match(/,/g) || []).length >= 2) return { kind: "csv", frame: parseCSV(s) };
  return { kind: "unknown", warnings: ["could not tell what this is: expected JSON, GeoJSON, KML, CSV or an intel link"] };
}

/**
 * Request builder for the documented relay contract, and the same-call shape for
 * the same-origin rung, so there is exactly one place that knows how to ask.
 */
export function buildEntitiesRequest({ tileKeys, version = "", base = null, csrf = null }) {
  const body = { tileKeys, ...(version ? { v: version } : {}) };
  if (base) {
    return {
      url: `${String(base).replace(/\/+$/, "")}/getEntities?tileKeys=${encodeURIComponent(tileKeys.join(","))}`,
      method: "GET",
      headers: { Accept: "application/json" },
      body: null,
    };
  }
  return {
    url: "/r/getEntities",
    method: "POST",
    headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRFToken": csrf } : {}) },
    body: JSON.stringify(body),
  };
}

/**
 * Failure triage. The distinction that matters to an agent is "the browser
 * would not let me" versus "the server said no" versus "nothing answered",
 * because only the second and third are fixable by trying a different rung.
 */
export function classifyFailure(err, res) {
  if (res) {
    if (res.status === 401 || res.status === 403) return { cls: "AUTH", fix: "not logged in at that origin, or the relay has no session. Log into intel.ingress.com in this browser, or give the relay an authenticated session." };
    if (res.status === 404) return { cls: "PATH", fix: "the relay does not expose this path. Check it serves /getEntities and /r/getEntities." };
    if (res.status === 429) return { cls: "RATE", fix: "backing off — the intel API rate-limits aggressively and a proxy makes it worse for everyone." };
    if (res.status >= 500) return { cls: "UPSTREAM", fix: "the far end is unhappy. Wait for the intel map itself to answer in a tab." };
    return { cls: `HTTP_${res.status}`, fix: "unexpected status; see the raw response." };
  }
  const msg = String(err?.message || err || "");
  if (/aborted/i.test(msg)) return { cls: "TIMEOUT", fix: "no answer in time. A public CORS proxy is often slow or gone; use a relay you run." };
  if (/Failed to fetch|NetworkError|Load failed|CORS|Cross-?origin/i.test(msg)) {
    return { cls: "CORS_OR_NET", fix: "either the browser blocked the cross-origin call (no Access-Control-Allow-Origin) or the host is unreachable. Only a same-origin or CORS-open endpoint can pass here." };
  }
  return { cls: "ERROR", fix: msg || "unknown failure" };
}

export function ageText(ms) {
  if (ms == null) return "—";
  const s = Math.max(0, ms / 1000);
  if (s < 90) return `${Math.round(s)}s`;
  if (s < 5400) return `${Math.round(s / 60)}m`;
  if (s < 172800) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}
