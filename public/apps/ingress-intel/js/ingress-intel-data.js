/**
 * INGRESS INTEL 4Dwm — the register.
 *
 * Everything in this file is either (a) a public rule or constant of the game,
 * (b) a piece of interface geometry the viewer needs, or (c) a pointer to where
 * the live data comes from. No portal state is asserted here: there is no
 * baked-in "current network" of portals, links or fields, because a static file
 * cannot know the state of a live game. What is baked in is the *shape* of that
 * state plus the ladder of transports that try to fetch it.
 *
 * Evidence tiers follow the rest of the repo:
 *   official   — published by the rights holder (Niantic Spatial) or the game client itself
 *   community  — well-sourced secondary work (IITC-CE, the reference third-party client)
 *   context    — schematic / illustrative, including every number the sim generator derives
 *
 * Portal geometry that *is* real (gazetteer place names, coordinates) comes from
 * js/socal-gazetteer-data.js — see js/ingress-intel-sim.js for how it is reused.
 */

/* ----------------------------------------------------------------- factions */

/**
 * Team ids, letters and codenames exactly as the intel API speaks them, and the
 * colours the reference client draws them with.
 *
 * Source: IITC-CE core/total-conversion-build.js — TEAM_NAMES, TEAM_CODES,
 * TEAM_CODENAMES, COLORS, COLORS_LVL. Keeping the values identical to the
 * reference client means a captured payload and an imported IITC layer look the
 * same in both places, which is the whole point of an intel viewer.
 */
export const FACTIONS = [
  { id: 0, code: "N", codename: "NEUTRAL", key: "NEU", name: "Neutral", color: "#ff6600" },
  { id: 1, code: "R", codename: "RESISTANCE", key: "RES", name: "Resistance", color: "#0088ff" },
  { id: 2, code: "E", codename: "ENLIGHTENED", key: "ENL", name: "Enlightened", color: "#03dc03" },
  { id: 3, code: "M", codename: "MACHINA", key: "MAC", name: "__MACHINA__", color: "#ff0028" },
];

export const TEAM_BY_CODE = Object.fromEntries(FACTIONS.map((f) => [f.code, f]));
export const TEAM_BY_CODENAME = Object.fromEntries(FACTIONS.map((f) => [f.codename, f]));
export const TEAM_BY_KEY = Object.fromEntries(FACTIONS.map((f) => [f.key, f]));

/** Portal level swatches, index 0 = unclaimed. Same source as above. */
export const LEVEL_COLORS = [
  "#000000", "#fece5a", "#ffa630", "#ff7315", "#e40000", "#fd2992", "#eb26cd", "#c124e0", "#9627f4",
];

export const TIER_COLOR = {
  official: "#ffb020",
  community: "#5cd6ff",
  context: "#ff6ec7",
};

/* ------------------------------------------------------------- game rules */

/**
 * The handful of rules a viewer has to know to draw something honest. Each is
 * tier-marked so the UI can say where the number came from; anything we are not
 * sure of is deliberately absent rather than guessed at.
 */
export const RULES = [
  { key: "levelMax", value: 8, unit: "resonator level", tier: "official", note: "portals are levelled 1–8 by the resonators planted on them" },
  { key: "resonators", value: 8, unit: "slots", tier: "official", note: "eight slots, one resonator each, placed on the ring" },
  { key: "resEnergyPerLevel", value: 1000, unit: "LE per level", tier: "official", note: "a level-N resonator carries N×1000 link energy at full charge" },
  { key: "linkMaxKm", value: 160, unit: "km", tier: "official", note: "base maximum link length before any range-extending modifier" },
  { key: "fieldMu", value: "min(corner MU)", unit: "MU", tier: "official", note: "a triangle scores the lowest of its three corners, so the weakest portal sets the field value" },
  { key: "portalMu", value: "sum(res level)", unit: "MU", tier: "official", note: "a fully-charged level-8 portal is 64 MU" },
  { key: "mindshield", value: "1 h", unit: "duration", tier: "community", note: "newly captured portals are shielded; IITC-CE renders the same 60-minute window" },
  {
    key: "modifiers", value: null, unit: "not modelled", tier: "context",
    note: "link-range and resonator mods change the numbers above. Their deltas are not asserted here — a viewer that guesses them draws a plausible lie on top of real geometry.",
  },
];

/* ---------------------------------------------------------------- theaters */

/**
 * Two stages, one dataset. The globe answers "who holds the planet"; the basin
 * plate answers "what is happening on this block". Both consume the same frame,
 * so a captured getEntities payload renders identically in either.
 */
export const THEATERS = {
  globe: {
    id: "globe",
    name: "PLANET · faction network",
    radius: 20,
    latLimit: 85,
  },
  la: {
    id: "la",
    name: "LOS ANGELES · ops plate",
    bbox: { lon0: -118.85, lon1: -117.85, lat0: 33.62, lat1: 34.55 },
    center: { lon: -118.35, lat: 34.08 },
    /** metres→scene scaling is inherited from the SoCal theater's geo module. */
    reliefHint: "Santa Monica Mtns · Verdugos · San Gabriels to the north, harbour to the south",
  },
  socal: {
    id: "socal",
    name: "SOCAL · Transect (same frame as socal-subsurface)",
    /** Deliberately the socal-subsurface bbox, so the two apps share geography. */
    bbox: { lon0: -121.6, lon1: -114.0, lat0: 32.45, lat1: 38.35 },
    center: { lon: -117.95, lat: 34.6 },
    reliefHint: "shared with SOCAL SUBSURFACE: the same gaussian relief field, or the same 3DEP grid when generated",
  },
};

export const DEFAULT_THEATER = "la";

/* ------------------------------------------------------------------ layers */

export const LAYERS = [
  { id: "terrain", name: "Plate · terrain shell", color: "#3c5a70", kind: "surface", on: true, views: ["la", "socal"] },
  { id: "countries", name: "Country outlines", color: "#6d8ba3", kind: "line", on: true, views: ["globe"] },
  { id: "graticule", name: "Graticule · 15°", color: "#43607a", on: false, views: ["globe"] },
  { id: "portals", name: "Portals · level ring + team core", color: "#e8f3ff", kind: "node", on: true, views: ["globe", "la", "socal"] },
  { id: "front", name: "Contact front · nearest opposing pair", color: "#ffd166", kind: "line", on: true, views: ["globe", "la", "socal"] },
  { id: "links", name: "Mind links (great circle / draped)", color: "#7dd3fc", kind: "line", on: true, views: ["globe", "la", "socal"] },
  { id: "fields", name: "Control fields", color: "#a3e635", kind: "poly", on: true, views: ["globe", "la", "socal"] },
  { id: "heat", name: "Activity heat · 24 h", color: "#fb923c", kind: "poly", on: false, views: ["globe", "la", "socal"] },
  { id: "shield", name: "Mind shields · active window", color: "#67e8f9", kind: "node", on: true, views: ["la", "socal"] },
  { id: "plext", name: "Ping markers · comms picks", color: "#f9a8d4", kind: "node", on: true, views: ["globe", "la", "socal"] },
  { id: "own", name: "Our drops · shared with the chat", color: "#fde047", kind: "node", on: true, views: ["globe", "la", "socal"] },
  { id: "gazetteer", name: "USGS gazetteer register", color: "#b8c7d1", kind: "node", on: false, views: ["la", "socal"] },
];

/** The graticule colour above is a typo-guard demo of the registry format; fix at load. */
for (const l of LAYERS) if (!/^#[0-9a-f]{6}$/i.test(l.color)) l.color = "#43607a";

/* ------------------------------------------------------------ tile physics */

/**
 * Map-data pagination in the intel API is tile-based, and the tile addressing is
 * the usual slippy-map scheme with a level hint welded onto the key.
 *
 * These arrays are IITC-CE's documented fallbacks (core/code/map_tiles.js). A
 * relay that can read the live intel page should forward whatever the page
 * reports instead — the viewer will use the relay's params when present and say
 * which it used, because tile params change without notice when the client
 * updates.
 */
export const TILES_PER_EDGE = [1, 1, 1, 40, 40, 80, 80, 320, 1000, 2000, 2000, 4000, 8000, 16000, 16000, 32000];
export const ZOOM_TO_LEVEL = [8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1, 1];
export const ZOOM_TO_LINK_KM = [200, 200, 200, 200, 200, 60, 60, 10, 5, 2.5, 2.5, 0.8, 0.3, 0, 0];
export const MAX_DATA_ZOOM = 21;

/* -------------------------------------------------------- the connect ladder */

/**
 * The honest part of this app. Six rungs, cheapest-truth first, each with what
 * it actually requires. `probe: true` rungs are attempted for real at boot and
 * their outcome — including the reason for failure — is printed in the FEED PiP.
 *
 * Why the first rung is almost always the one that works: the intel API answers
 * only its own origin. It wants the Google session cookie of a logged-in agent
 * and a CSRF token that lives in that same origin, so no page on any other host
 * can call it from a browser, with or without a proxy that forwards POST. That
 * is not a bug to route around here; it is the constraint the panel displays.
 */
export const LADDER = [
  {
    id: "sameorigin",
    rank: 0,
    name: "SAME-ORIGIN · intel.ingress.com",
    probe: true,
    tier: "official",
    summary:
      "If this page is served from the intel origin, /r/getEntities is callable directly — this is how IITC-CE works, because it runs inside the intel page as a userscript.",
    requires: "serve this app from https://intel.ingress.com/* (userscript / local proxy that rewrites Host)",
    endpoint: "/r/getEntities",
    method: "POST",
    body: "application/json {tileKeys:[…], v:CURRENT_VERSION}",
    headers: "X-CSRFToken from the csrftoken cookie",
    docs: [
      "https://github.com/IITC-CE/ingress-intel-total-conversion/blob/master/core/code/send_request.js",
      "https://github.com/IITC-CE/ingress-intel-total-conversion/blob/master/core/code/map_request.js",
    ],
  },
  {
    id: "relay",
    rank: 1,
    name: "RELAY · your own CORS-open forwarder",
    probe: true,
    tier: "community",
    summary:
      "A tiny forwarder you run holds the session and answers this app with Access-Control-Allow-Origin. The relay contract below is what this viewer sends.",
    requires: "a base URL from you; the relay must allow the app's origin and add the CORS headers",
    endpoint: "{base}/getEntities?tileKeys=…",
    method: "GET",
    body: "none (query only) — POST to {base}/r/getEntities also accepted, body forwarded verbatim",
    headers: "optional X-Intel-Key if you set one on the relay",
    docs: ["docs/ingress-intel-connector-research-2026-10-07.md"],
  },
  {
    id: "proxy",
    rank: 2,
    name: "PUBLIC CORS PROXY · GET only",
    probe: true,
    tier: "context",
    summary:
      "allorigins / corsproxy.io style readers, the same preset pair the FLASH DECOMPILER bench in this repo uses. They can fetch a public URL, not a cookie-authenticated POST, so they yield a page or a 401 — never game state.",
    requires: "outbound from your browser to the proxy; nothing stored",
    endpoint: "https://api.allorigins.win/raw?url={url}",
    method: "GET",
    body: "none",
    headers: "none forwarded",
    docs: ["https://github.com/shdwelf/Html5/blob/main/js/flash-decompiler.js"],
  },
  {
    id: "capture",
    rank: 3,
    name: "CAPTURE · paste or drop a payload",
    probe: false,
    tier: "official",
    summary:
      "Drop the JSON you saved from the intel page's Network tab (getEntities / get_thinned_entities), or an IITC layer export (GeoJSON / KML / CSV). Decoded by the same reader the relay feed uses, so a file and a live feed are indistinguishable downstream.",
    requires: "a file or clipboard text; nothing leaves the page",
    endpoint: "local",
    method: "—",
    body: "getEntities JSON · GeoJSON · KML · CSV",
    headers: "—",
    docs: ["https://github.com/IITC-CE/ingress-intel-total-conversion/tree/master/json_examples"],
  },
  {
    id: "peer",
    rank: 4,
    name: "PEERS · webxdc broadcast",
    probe: false,
    tier: "community",
    summary:
      "Inside a chat app, agents share what they hold: intel drops, op markers and whole frames, broadcast with sendUpdate and merged on setUpdateListener. This is a real network path that needs no Niantic permission.",
    requires: "run this app as ingress-intel.xdc inside a webxdc host (Delta Chat)",
    endpoint: "webxdc.sendUpdate",
    method: "broadcast",
    body: "{kind:'intel-frame'|'intel-drop', seq, sent, payload}",
    headers: "—",
    docs: ["https://webxdc.org/docs/spec/application.html"],
  },
  {
    id: "sim",
    rank: 5,
    name: "SIM · offline register",
    probe: false,
    tier: "context",
    summary:
      "A deterministic synthetic network over real gazetteer coordinates, so the theater is never an empty globe. Every record carries a provenance string naming its generator; the panel watermark says SIM and nothing here should be read as game state.",
    requires: "nothing",
    endpoint: "js/ingress-intel-sim.js",
    method: "seeded PRNG",
    body: "mulberry32(seed) over USGS GNIS rows",
    headers: "—",
    docs: ["js/socal-gazetteer-data.js"],
  },
];

/** Endpoints a relay may be asked to forward, with the shape each wants. */
export const INTEL_ENDPOINTS = {
  getEntities: { path: "/r/getEntities", method: "POST", params: ["tileKeys", "v"], note: "map data: portals + links + fields per tile" },
  getPortalDetails: { path: "/r/getPortal", method: "POST", params: ["guid", "v"], note: "one portal: resonators, mods, links, fields, history" },
  getPlexts: { path: "/r/getUpdates", method: "POST", params: ["newerThan", "interval", "numPlayerPlexts", "numMissionPlexts", "v"], note: "comms feed; the ping markers" },
  getStatus: { path: "/r/getMode", method: "POST", params: ["v"], note: "faction + agent status" },
  getLatency: { path: "/intel?ping=1", method: "GET", params: [], note: "reachable-as-a-canary ping" },
};

/* ------------------------------------------------------------------ sources */

export const SOURCE_URLS = [
  { label: "intel.ingress.com — the primary map (agent login required)", url: "https://intel.ingress.com/intel" },
  { label: "IITC-CE — reference third-party client; every wire format here comes from its source", url: "https://github.com/IITC-CE/ingress-intel-total-conversion" },
  { label: "IITC-CE json_examples — captured getEntities / getPortal request+response pairs", url: "https://github.com/IITC-CE/ingress-intel-total-conversion/tree/master/json_examples" },
  { label: "IITC-CE map_tiles.js — tile addressing, ZOOM_TO_LEVEL, TILES_PER_EDGE", url: "https://github.com/IITC-CE/ingress-intel-total-conversion/blob/master/core/code/map_tiles.js" },
  { label: "IITC-CE entity_decode.js — the array wire format decoded by this app's reader", url: "https://github.com/IITC-CE/ingress-intel-total-conversion/blob/master/core/code/entity_decode.js" },
  { label: "IITC-CE extract_niantic_parameters.js — how CURRENT_VERSION and tile params are read off the stock page", url: "https://github.com/IITC-CE/ingress-intel-total-conversion/blob/master/core/code/extract_niantic_parameters.js" },
  { label: "MDN — CORS: cross-origin requests and credentials", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS" },
  { label: "Ingress rules (community wiki) — levels, links, fields", url: "https://ingress.com/rules" },
  { label: "This repo: docs/ingress-intel-map-viewer.md", url: "https://github.com/shdwelf/Html5/blob/main/docs/ingress-intel-map-viewer.md" },
];

/** What the sandbox that built this app could and could not reach — recorded, not glossed. */
export const BUILD_PROBE = {
  date: "2026-10-07",
  results: [
    "GET https://intel.ingress.com/intel → TLS connect failed: the build sandbox egress allow-list has no route to ingress.com (github/npm/pypi only).",
    "GET https://apis.ingress.com/ → no route, same allow-list.",
    "GitHub API + codeload → reachable; the wire formats below were read from IITC-CE source at HEAD, not from Niantic.",
    "Google Drive connector → searched for name contains 'ingress' | 'intel' | 'portal': 0 files, so no local dataset was staged.",
  ],
  meaning:
    "Nothing in this app has ever touched a Niantic server from the machine that wrote it. Every live path is wired, documented and left to run in a browser that can reach the origin — and the FEED panel reports the outcome instead of hiding it.",
};

/* --------------------------------------------------------------------- misc */

export const REFRESH = {
  /** IITC uses 0.4 s after a map move before it starts fetching; keep the same manners. */
  MOVE_DELAY_S: 0.4,
  /** Minimum seconds between full refreshes of the same tile set. */
  REFRESH_S: 60,
  /** Parallel requests in flight — the stock client is polite; so are we. */
  MAX_REQUESTS: 6,
  TILES_PER_REQUEST: 30,
  TILE_TTL_S: 420,
  TIMEOUT_MS: 12000,
  MAX_RETRIES: 2,
};

export const STORAGE_KEY = "ingre...y.v1";
export const PEER_TAG = "ingress-intel/1";
