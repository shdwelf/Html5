/**
 * INGRESS INTEL 4Dwm — the connector.
 *
 * Everything that touches a network lives in this file, and it is written to
 * fail loudly. Each rung of the ladder in ingress-intel-data.js is attempted for
 * real, timed, and classified; the reason a rung failed is kept verbatim and
 * shown, because "connection failed" tells an agent nothing while "the browser
 * refused to send a cross-origin credentialed POST" tells them the fix.
 *
 * Two rules the whole module obeys:
 *   · No credentials are ever stored here. Cookies belong to the origin that
 *     issued them; if a relay is used, the relay holds the session and this page
 *     only ever talks to the relay URL the user typed. No tokens in localStorage.
 *   · Nothing is invented to fill a gap. If a rung does not answer, the count
 *     stays zero and the watermark says SIM or OFFLINE, never LIVE.
 */

import { INTEL_ENDPOINTS, LADDER, PEER_TAG, REFRESH, STORAGE_KEY, BUILD_PROBE } from "./ingress-intel-data.js";
import {
  ageText,
  buildEntitiesRequest,
  classifyFailure,
  parseGetEntities,
  parsePlexts,
  parsePortalDetails,
  readIntel,
  tileKeysForBBox,
  tileParams,
} from "./ingress-intel-proto.js";

const ORIGIN_OK = /(^|\.)ingress\.com$/i;
const INTEL_ORIGIN = "https://intel.ingress.com";

const PROXIES = {
  direct: { name: "direct", template: "" },
  allorigins: { name: "allorigins raw", template: "https://api.allorigins.win/raw?url={url}" },
  corsproxy: { name: "corsproxy.io", template: "https://corsproxy.io/?{url}" },
};

/* ------------------------------------------------------------------ config */

const DEFAULTS = {
  active: "sim",
  auto: true,
  relayBase: "",
  relayKey: "",
  proxy: "allorigins",
  refreshS: REFRESH.REFRESH_S,
  zoom: 12,
  tileMode: "extended",
  version: "",
  maxTiles: 30,
};

export function loadConfig() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    stored = null;
  }
  return { ...DEFAULTS, ...(stored && typeof stored === "object" ? stored : {}) };
}

export function saveConfig(cfg) {
  const { relayKey, ...rest } = cfg;
  // The key is deliberately session-only: a shared .xdc on a borrowed phone
  // should not leave an ops credential in persistent storage.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* private mode / quota — config stays in memory for this session */
  }
  try {
    if (relayKey) sessionStorage.setItem("ingress-intel.key", relayKey);
    else sessionStorage.removeItem("ingress-intel.key");
  } catch { /* no sessionStorage */ }
}

export function readRelayKey() {
  try { return sessionStorage.getItem("ingress-intel.key") || ""; } catch { return ""; }
}

/* --------------------------------------------------------------------- util */

async function timed(fn, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  const started = performance.now();
  try {
    const r = await fn(ctl.signal);
    return { r, ms: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(t);
  }
}

function describeResponse(res, text) {
  const head = (text || "").trim().slice(0, 80).replace(/\s+/g, " ");
  const looksJson = head.startsWith("{") || head.startsWith("[");
  const looksLogin = /<html|<!doctype|accounts\.google|sign[- ]?in/i.test(text || "");
  return {
    status: res.status,
    type: res.type,
    bytes: (text || "").length,
    json: looksJson,
    login: looksLogin,
    head,
    read: looksJson ? "json" : looksLogin ? "login wall / html" : head ? "non-json body" : "empty body",
  };
}

/* --------------------------------------------------------------- the feed */

/**
 * createFeed({ onFrame, onLog, onStatus, onView })
 *   onFrame(frame)    — a decoded frame is ready to draw
 *   onLog(row, cfg?)  — one line for the feed console; row = {rung,lvl,msg}
 *   onStatus(status)  — { rung, live, detail, age, tiles, requests }
 *   onView()          — () => { bbox, zoom }, asked fresh before every fetch
 */
export function createFeed(hooks = {}) {
  const cfg = loadConfig();
  if (!cfg.relayKey) cfg.relayKey = readRelayKey();
  const lines = [];
  const probeRows = [];
  const cache = new Map(); // tileKey → {at, frame}
  const inflight = new Set();
  let timer = null;
  let stopped = false;
  let failures = 0;
  let requestCount = 0;
  let status = { rung: cfg.active, live: false, detail: "not attempted yet", age: null, tiles: 0, requests: 0 };

  const emit = (rung, lvl, msg) => {
    const row = { at: Date.now(), rung, lvl, msg };
    lines.push(row);
    if (lines.length > 400) lines.shift();
    hooks.onLog?.(row, cfg);
    return row;
  };

  const setStatus = (patch) => {
    status = { ...status, ...patch };
    hooks.onStatus?.(status);
  };

  /* ----------------------------- rung implementations (the ladder) --------- */

  async function fetchThroughProxy(url, signal) {
    const tpl = PROXIES[cfg.proxy]?.template;
    if (!tpl) return fetch(url, { signal, mode: "cors", credentials: "omit" });
    return fetch(tpl.replace("{url}", encodeURIComponent(url)), { signal });
  }

  /** Rung 0 — same-origin. True only when this page IS served from intel.ingress.com. */
  async function probeSameOrigin() {
    const row = { rung: "sameorigin", label: LADDER[0].name, ok: false, ms: 0, detail: "", fix: "" };
    const here = location.hostname;
    if (!ORIGIN_OK.test(here)) {
      row.detail = `this page's origin is ${here || "file://"} — /r/getEntities only answers for intel.ingress.com, and the browser will not attach that origin's cookies to a cross-origin POST`;
      row.fix = LADDER[0].requires;
      // Still try it, once, from the actual origin, so the panel shows the real
      // failure rather than an assertion. Cheap and honest.
      const t0 = performance.now();
      try {
        const res = await fetch(`${INTEL_ORIGIN}/intel?ping=1`, { mode: "cors", credentials: "include", signal: AbortSignal.timeout(REFRESH.TIMEOUT_MS) });
        row.ms = Math.round(performance.now() - t0);
        row.detail += ` · direct probe answered ${res.status} (type ${res.type})`;
        row.ok = res.ok;
      } catch (err) {
        row.ms = Math.round(performance.now() - t0);
        const c = classifyFailure(err);
        row.cls = c.cls;
        row.detail += ` · ${err?.name || "Error"}: ${err?.message || "blocked before it left the browser"}`;
        row.fix = c.fix;
      }
      return row;
    }
    const { r: res, ms } = await timed((signal) => fetch("/intel?ping=1", { signal }), REFRESH.TIMEOUT_MS);
    row.ms = ms;
    row.ok = res?.ok === true;
    row.detail = res ? `ping=1 → HTTP ${res.status}` : "no response";
    if (row.ok) row.detail += " · same-origin path is live; tile requests will go straight through";
    return row;
  }

  /** Rung 1 — a relay the user runs. /status first, then a real tile request. */
  async function probeRelay({ bbox, zoom }) {
    const row = { rung: "relay", label: LADDER[1].name, ok: false, ms: 0, detail: "", fix: "" };
    const base = (cfg.relayBase || "").trim();
    if (!base) {
      row.detail = "no relay base URL configured";
      row.fix = "Type the relay origin in the FEED panel (e.g. http://127.0.0.1:8799) — see docs/ingress-intel-connector-research-2026-10-07.md for the 60-line relay this contract matches.";
      return row;
    }
    let url;
    try { url = new URL(base); } catch { row.detail = `relay base is not a URL: ${base}`; row.fix = "include the scheme, e.g. http://127.0.0.1:8799"; return row; }
    const key = cfg.relayKey || readRelayKey();
    const headers = { Accept: "application/json", ...(key ? { "X-Intel-Key": key } : {}) };
    try {
      const { r: hello, ms } = await timed((signal) => fetch(`${url.origin}${url.pathname.replace(/\/+$/, "")}/status`, { signal, headers }), REFRESH.TIMEOUT_MS);
      row.ms = ms;
      const text = await hello.text().catch(() => "");
      const d = describeResponse(hello, text);
      row.detail = `/status → HTTP ${d.status} · ${d.bytes} B · ${d.read}${d.head ? ` · “${d.head.slice(0, 48)}”` : ""}`;
      if (!hello.ok) { const c = classifyFailure(null, hello); row.cls = c.cls; row.fix = c.fix; return row; }
      let meta = null;
      try { meta = JSON.parse(text); } catch { /* relay may answer plain text */ }
      if (meta) {
        row.relay = meta;
        const seen = [];
        if (meta.loggedin != null) seen.push(`session ${meta.loggedin ? "present" : "absent"}`);
        if (meta.version) seen.push(`client v${String(meta.version).slice(0, 10)}…`);
        if (meta.tileParams?.TILES_PER_EDGE) seen.push("live tile params");
        if (seen.length) row.detail += ` · ${seen.join(" · ")}`;
        if (meta.loggedin === false) { row.cls = "AUTH"; row.fix = "the relay has no intel session. Log into the intel map in the same browser profile the relay uses."; return row; }
        if (meta.tileParams) { row.tileParams = meta.tileParams; cfg.version = meta.version || cfg.version; }
      }
      // Now ask it for actual tiles, so "reachable" is never confused with "useful".
      const keys = tileKeysForBBox(bbox, zoom, { limit: 3 });
      const req = buildEntitiesRequest({ tileKeys: keys, version: cfg.version, base });
      const { r: tiles, ms: ms2 } = await timed((signal) => fetch(req.url, { signal, headers }), REFRESH.TIMEOUT_MS);
      row.ms += ms2;
      const body = await tiles.text().catch(() => "");
      const d2 = describeResponse(tiles, body);
      row.requested = keys.length;
      if (!tiles.ok) { const c = classifyFailure(null, tiles); row.cls = c.cls; row.detail += ` · /getEntities → HTTP ${d2.status}`; row.fix = c.fix; return row; }
      let payload = null;
      try { payload = JSON.parse(body); } catch { row.cls = "PARSE"; row.detail += ` · /getEntities body is not JSON (${d2.head || "empty"})`; row.fix = "the relay should forward the intel JSON verbatim, not an HTML page."; return row; }
      const frame = parseGetEntities(payload, { source: "relay", tiles: keys });
      row.ok = true;
      row.detail += ` · /getEntities → ${frame.portals.length} portals · ${frame.links.length} links · ${frame.fields.length} fields`;
      row.frame = frame;
      if (!frame.portals.length) row.detail += " · (tiles answered empty — the relay is up but this view has no data yet)";
      if (frame.warnings.length) row.warnings = frame.warnings.slice(0, 4);
    } catch (err) {
      const c = classifyFailure(err);
      row.cls = c.cls;
      row.detail = `${err?.name || "Error"}: ${err?.message || "fetch refused"}`;
      row.fix = c.fix;
    }
    return row;
  }

  /** Rung 2 — public CORS proxies, GET only. Demonstrates what they can and cannot do. */
  async function probeProxy() {
    const row = { rung: "proxy", label: LADDER[2].name, ok: false, ms: 0, detail: "", fix: "" };
    const target = `${INTEL_ENDPOINTS.getLatency ? "/intel?ping=1" : ""}`;
    const url = `${INTEL_ORIGIN}${target}`;
    try {
      const { r: res, ms } = await timed((signal) => fetchThroughProxy(url, signal), REFRESH.TIMEOUT_MS);
      row.ms = ms;
      const text = await res.text().catch(() => "");
      const d = describeResponse(res, text);
      row.detail = `${cfg.proxy} → ${INTEL_ORIGIN}/intel?ping=1 · HTTP ${d.status} · ${d.bytes.toLocaleString()} B · ${d.read}`;
      if (!res.ok) { const c = classifyFailure(null, res); row.cls = c.cls; row.fix = c.fix; return row; }
      if (d.json) {
        row.ok = true;
        row.detail += " · JSON body — treating it as a captured payload";
        try { row.frame = parseGetEntities(JSON.parse(text), { source: "proxy" }); } catch { row.detail += " (but it did not decode)"; }
      } else if (d.login) {
        row.cls = "AUTH";
        row.detail += " · that is the Google sign-in wall, not game state";
        row.fix = "A public proxy forwards no cookies and cannot POST the CSRF-tokened getEntities body. This rung can read public pages; it cannot read your intel.";
      } else {
        row.cls = "SHAPE";
        row.fix = "something answered, but not with intel JSON. Use the relay rung for real data.";
      }
    } catch (err) {
      const c = classifyFailure(err);
      row.cls = c.cls;
      row.detail = `${err?.name || "Error"}: ${err?.message || "proxy unreachable"}`;
      row.fix = c.fix;
    }
    return row;
  }

  /* --------------------------------- probe walk ----------------------------- */

  async function probeAll({ view } = {}) {
    const v = view || hooks.onView?.() || { bbox: { lon0: -118.85, lon1: -117.85, lat0: 33.62, lat1: 34.55 }, zoom: cfg.zoom };
    probeRows.length = 0;
    setStatus({ detail: "probing the ladder…" });
    const rungs = LADDER.filter((r) => r.probe);
    for (const r of rungs) {
      emit(r.id, "info", `probe · ${r.name}`);
      const fn = r.id === "sameorigin" ? probeSameOrigin : r.id === "relay" ? () => probeRelay({ bbox: v.bbox, zoom: v.zoom }) : probeProxy;
      let row;
      try { row = await fn(); } catch (err) { row = { rung: r.id, label: r.name, ok: false, ms: 0, cls: "THREW", detail: String(err?.message || err), fix: "internal probe error — reported, not swallowed" }; }
      row.label = r.name;
      row.tier = r.tier;
      probeRows.push(row);
      emit(row.rung, row.ok ? "ok" : "warn", `${row.ok ? "reachable" : "no"} · ${row.ms || 0} ms · ${row.cls ? `${row.cls} · ` : ""}${row.detail}`);
      if (row.fix) emit(row.rung, "fix", row.fix);
      if (row.ok && row.frame) {
        cfg.active = row.rung;
        saveConfig(cfg);
        setStatus({ rung: row.rung, live: true, detail: `live via ${row.rung}`, age: Date.now(), tiles: row.frame.tiles.length });
        hooks.onFrame?.(row.frame, { rung: row.rung, live: true });
        return { rows: probeRows.slice(), winner: row.rung };
      }
    }
    // First reachable-but-frameless rung still wins the wiring, if any.
    const reachable = probeRows.find((x) => x.ok);
    cfg.active = reachable ? reachable.rung : "sim";
    saveConfig(cfg);
    setStatus({
      rung: cfg.active,
      live: false,
      detail: reachable
        ? `${reachable.rung} answered but returned no data — holding at that rung`
        : "no rung answered · drawing the offline register (SIM)",
      age: null,
    });
    return { rows: probeRows.slice(), winner: cfg.active };
  }

  /* --------------------------------- polling ------------------------------ */

  async function fetchTiles({ bbox, zoom }) {
    if (cfg.active !== "relay" && cfg.active !== "sameorigin") return null;
    const keys = tileKeysForBBox(bbox, zoom, { limit: cfg.maxTiles });
    if (!keys.length) return null;
    const cacheKey = keys.slice().sort().join("|");
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < REFRESH.TILE_TTL_S * 1000) {
      emit(cfg.active, "info", `${keys.length} tiles fresh in cache (${ageText(Date.now() - hit.at)} old) — no request sent`);
      return null;
    }
    setStatus({ tiles: keys.length, requests: requestCount });
    const headers = { Accept: "application/json" };
    const key = cfg.relayKey || readRelayKey();
    if (key) headers["X-Intel-Key"] = key;
    const req = buildEntitiesRequest({ tileKeys: keys, version: cfg.version, base: cfg.active === "relay" ? cfg.relayBase : null });
    if (inflight.has(req.url)) return null;
    inflight.add(req.url);
    try {
      const { r: res, ms } = await timed((signal) => fetch(req.url, {
        signal,
        method: req.method,
        headers: { ...headers, ...(req.headers || {}) },
        body: req.body || undefined,
        credentials: cfg.active === "sameorigin" ? "include" : "omit",
      }), REFRESH.TIMEOUT_MS);
      requestCount++;
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        const c = classifyFailure(null, res);
        failures++;
        emit(cfg.active, "err", `${keys.length} tiles requested → HTTP ${res.status} · ${c.cls} · ${c.fix}`);
        setStatus({ live: false, detail: `${c.cls} on tile fetch` });
        if (failures >= REFRESH.MAX_RETRIES + 1) { emit(cfg.active, "err", `${failures} consecutive failures — auto-disarm. Probe again when you want it back.`); disarm(); }
        return null;
      }
      let payload;
      try { payload = JSON.parse(text); } catch { failures++; emit(cfg.active, "err", `tile response was not JSON — first 60 chars: ${text.slice(0, 60).replace(/\s+/g, " ")}`); return null; }
      const frame = parseGetEntities(payload, { source: cfg.active, tiles: keys });
      cache.set(cacheKey, { at: Date.now(), count: frame.portals.length });
      failures = 0;
      setStatus({ live: true, age: Date.now(), tiles: keys.length, requests: requestCount });
      emit(cfg.active, "ok", `${ms} ms · ${frame.portals.length} portals · ${frame.links.length} links · ${frame.fields.length} fields${frame.warnings.length ? ` · ${frame.warnings.length} decode warnings` : ""}`);
      return frame;
    } catch (err) {
      const c = classifyFailure(err);
      failures++;
      emit(cfg.active, "err", `tile fetch · ${err?.name || "Error"}: ${err?.message || "no answer"} · ${c.cls}`);
      setStatus({ live: false, detail: c.cls });
      if (failures >= REFRESH.MAX_RETRIES + 1) disarm();
      return null;
    } finally {
      inflight.delete(req.url);
    }
  }

  function arm({ immediate = true } = {}) {
    disarm();
    stopped = false;
    if (!cfg.auto) { emit("feed", "info", "auto-refresh is off in config — armed only on demand"); }
    const tick = async () => {
      if (stopped) return;
      if (cfg.active === "relay" || cfg.active === "sameorigin") {
        const view = hooks.onView?.();
        if (view) {
          const frame = await fetchTiles(view);
          if (frame) hooks.onFrame?.(frame, { rung: cfg.active, live: true });
        }
      }
    };
    if (immediate) tick();
    timer = setInterval(tick, Math.max(15, cfg.refreshS) * 1000);
    setStatus({ detail: `armed · every ${cfg.refreshS}s when a live rung is active`, rung: cfg.active });
    emit("feed", "info", `armed · active rung ${cfg.active} · refresh ${cfg.refreshS}s · ${cfg.active === "sim" || cfg.active === "capture" ? "no polling (those rungs are local)" : `tile TTL ${REFRESH.TILE_TTL_S}s, ${REFRESH.MAX_REQUESTS} in flight max`}`);
  }

  function disarm() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
  }

  /* ------------------------------- import + peers ------------------------- */

  function absorb(text, { name = "" } = {}) {
    const res = readIntel(text, { name });
    if (res.kind === "permalink") {
      emit("capture", "info", `intel permalink parsed · ll ${res.link.lat?.toFixed(5)},${res.link.lon?.toFixed(5)} · z${res.link.zoom ?? "?"}${res.link.pguid ? ` · pguid ${res.link.pguid}` : ""}${res.link.isIntelOrigin ? ` · origin ${res.link.origin}` : ""}`);
      return res;
    }
    const frame = res.frame;
    if (!frame) { emit("capture", "err", `unreadable · ${res.error || res.warnings?.join(" · ") || "unknown format"}`); return res; }
    frame.source = "capture";
    for (const l of frame.portals) l.provenance = `import · ${name || "pasted"} · ${l.provenance}`;
    emit("capture", "ok", `read ${res.kind} · ${frame.portals.length} portals · ${frame.links.length} links · ${frame.fields.length} fields · ${frame.deleted.length} tombstones`);
    if (frame.warnings.length) for (const w of frame.warnings.slice(0, 6)) emit("capture", "warn", w);
    cfg.active = "capture";
    saveConfig(cfg);
    setStatus({ rung: "capture", live: false, detail: `static capture · ${name || "paste"}`, age: frame.fetched, tiles: frame.tiles.length });
    hooks.onFrame?.(frame, { rung: "capture", live: false });
    return res;
  }

  /**
   * One place that knows how to ask the relay vs. the live origin: a relay gets
   * a plain GET with a query string, the same-origin rung gets the stock POST
   * with the CSRF token the intel page set on this document.
   */
  function relayOrIntel({ relayPath, intelPath, query = {}, body = null }) {
    const useRelay = cfg.active === "relay" && (cfg.relayBase || "").trim();
    const headers = { Accept: "application/json" };
    const key = cfg.relayKey || readRelayKey();
    if (useRelay && key) headers["X-Intel-Key"] = key;
    if (useRelay) {
      const base = String(cfg.relayBase).replace(/\/+$/, "");
      const qs = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]));
      return { url: `${base}${relayPath}?${qs}`, init: { headers } };
    }
    headers["Content-Type"] = "application/json";
    if (ORIGIN_OK.test(location.hostname)) {
      const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
      if (m) headers["X-CSRFToken"] = decodeURIComponent(m[1]);
    }
    return {
      url: intelPath,
      init: { headers, method: "POST", body: JSON.stringify({ ...body, ...(cfg.version ? { v: cfg.version } : {}) }), credentials: "include" },
    };
  }

  /** Portal dossier enrichment — only meaningful when a rung can answer getPortal. */
  async function fetchPortalDetails(guid) {
    if (!guid || (cfg.active !== "relay" && cfg.active !== "sameorigin")) return null;
    const { url, init } = relayOrIntel({ relayPath: "/getPortal", intelPath: INTEL_ENDPOINTS.getPortalDetails.path, query: { guid }, body: { guid } });
    try {
      const { r: res, ms } = await timed((signal) => fetch(url, { ...init, signal }), REFRESH.TIMEOUT_MS);
      if (!res.ok) { const c = classifyFailure(null, res); emit("feed", "warn", `getPortal ${guid} → HTTP ${res.status} · ${c.cls}`); return null; }
      const rec = parsePortalDetails(await res.json());
      if (rec) emit("feed", "ok", `getPortal → ${ms} ms · ${rec.resonators?.length ?? 0} resonators · ${rec.links?.length ?? 0} edges`);
      return rec;
    } catch (err) {
      emit("feed", "warn", `getPortal ${guid} · ${err?.message || "no answer"}`);
      return null;
    }
  }

  async function fetchComms() {
    if (cfg.active !== "relay" && cfg.active !== "sameorigin") return null;
    const { url, init } = relayOrIntel({
      relayPath: "/getUpdates",
      intelPath: INTEL_ENDPOINTS.getPlexts.path,
      query: { interval: 86400, numPlayerPlexts: 64 },
      body: { interval: 86400, numPlayerPlexts: 64, newerThan: 1 },
    });
    try {
      const { r: res } = await timed((signal) => fetch(url, { ...init, signal }), REFRESH.TIMEOUT_MS);
      if (!res.ok) { emit("feed", "warn", `getUpdates → HTTP ${res.status}`); return null; }
      const frame = parsePlexts(await res.json());
      emit("feed", "ok", `getUpdates → ${frame.plexts.length} plexts · ${frame.plexts.filter((p) => p.geo).length} geo-tagged`);
      return frame;
    } catch (err) {
      emit("feed", "warn", `getUpdates · ${err?.message || "no answer"}`);
      return null;
    }
  }

  /* --------------------------------- webxdc peers ------------------------- */

  const w = typeof window !== "undefined" ? window.webxdc : null;
  const hasWebxdc = !!w?.sendUpdate;

  function send(kind, payload, summary) {
    if (!hasWebxdc) return { ok: false, why: "not running inside a webxdc host — this page is a plain browser tab" };
    try {
      w.sendUpdate({ payload: { tag: PEER_TAG, kind, seq: Date.now(), sent: new Date().toISOString(), from: w.selfName || w.selfAddr, payload }, info: summary || `${kind} shared from the intel viewer` });
      emit("peer", "ok", `broadcast ${kind} (${JSON.stringify(payload).length} B)`);
      return { ok: true };
    } catch (err) {
      emit("peer", "err", `broadcast failed · ${err?.message || err}`);
      return { ok: false, why: String(err?.message || err) };
    }
  }

  function startPeerListener(onPeer) {
    if (!hasWebxdc?.setUpdateListener) return () => {};
    const seen = new Set();
    w.setUpdateListener((update) => {
      const p = update?.payload;
      if (!p || p.tag !== PEER_TAG) return;
      const id = `${p.kind}:${p.seq}`;
      if (seen.has(id)) return;
      seen.add(id);
      if (seen.size > 500) seen.clear();
      emit("peer", "info", `inbound ${p.kind} from ${p.from || "agent"}`);
      onPeer?.(p, update);
    }, 0);
    return () => {};
  }

  return {
    cfg,
    lines,
    probeRows,
    status,
    hasWebxdc,
    probe: probeAll,
    arm,
    disarm,
    fetchTiles,
    absorb,
    send,
    startPeerListener,
    fetchPortalDetails,
    fetchComms,
    setRung(rung) { cfg.active = rung; saveConfig(cfg); setStatus({ rung, live: rung === "relay" || rung === "sameorigin" }); emit("feed", "info", `rung set to ${rung}`); },
    set(patch) { Object.assign(cfg, patch); saveConfig(cfg); emit("feed", "info", `config · ${Object.keys(patch).map((k) => `${k}=${k === "relayKey" ? (cfg.relayKey ? "set (session only)" : "cleared") : String(cfg[k]).slice(0, 40)}`).join(" · ")}`); },
    buildRequestForView(view) {
      const keys = tileKeysForBBox(view.bbox, view.zoom, { limit: cfg.maxTiles });
      const req = buildEntitiesRequest({ tileKeys: keys, version: cfg.version, base: cfg.active === "relay" ? cfg.relayBase : null });
      return { keys, req, params: tileParams(view.zoom) };
    },
    buildProbeNote: () => BUILD_PROBE,
    ageOf: (t) => ageText(t == null ? null : Date.now() - t),
  };
}
