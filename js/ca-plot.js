import { PARISHES, project, BBOX, SITE } from "./ca-geo.js";
import { SANCTUARIES } from "./ca-nodes.js";
import { resolveSite } from "./site-id.js";

const PAD = resolveSite();

const LIB = {
  ww: {
    storm0: { lon: -117.633, lat: 34.36 },
    phases: [
      { t: 0, r: 1.1, name: "GRID ARMED — SWARTHOUT VALLEY" },
      { t: 22, r: 0.88, name: "PHASE 1 — SANTA ANA / RED FLAG" },
      { t: 48, r: 0.68, name: "PHASE 2 — CREST HIGHWAY CUT" },
      { t: 76, r: 0.50, name: "PHASE 3 — FAULT BENCH" },
      { t: 104, r: 0.34, name: "PHASE 4 — VILLAGE CORE" },
      { t: 132, r: 0.16, name: "ENDGAME — PARK DRIVE" },
    ],
    script: [
      { t: 0.4, type: "log", lvl: "sys", msg: "SITE-W  wrightwood  ·  4Dwm  ·  fsn /angeles" },
      { t: 1.4, type: "log", lvl: "ok", msg: "3DEP tile  san-gabriels/wrightwood  ·  1800–2600 m" },
      { t: 2.6, type: "log", lvl: "ok", msg: "vector  SAN ANDREAS  lone pine canyon trace online" },
      { t: 4.0, type: "log", lvl: "warn", msg: "red flag  ·  RH 8%  ·  ridge wind  42 kt" },
      { t: 8.0, type: "log", lvl: "sys", msg: "access security please." },
      { t: 10.0, type: "log", lvl: "ok", msg: "it's a UNIX system.  I know this." },
      { t: 22.0, type: "phase", name: "PHASE 1 — SANTA ANA / RED FLAG" },
      { t: 24.0, type: "log", lvl: "bad", msg: "spot fires  blue ridge  ·  hwy 2 mile 80" },
      { t: 32.0, type: "pip", id: "wwfire" },
      { t: 48.0, type: "phase", name: "PHASE 2 — CREST HIGHWAY CUT" },
      { t: 52.0, type: "log", lvl: "warn", msg: "mountain high  east  ·  lifts hold" },
      { t: 58.0, type: "pip", id: "mhski" },
      { t: 76.0, type: "phase", name: "PHASE 3 — FAULT BENCH" },
      { t: 80.0, type: "log", lvl: "bad", msg: "objects in paddock  ·  lone pine canyon sag ponds" },
      { t: 104.0, type: "phase", name: "PHASE 4 — VILLAGE CORE" },
      { t: 108.0, type: "pip", id: "ols" },
      { t: 132.0, type: "phase", name: "ENDGAME — PARK DRIVE" },
      { t: 136.0, type: "log", lvl: "ok", msg: "hold cedar street.  files are the phone book." },
    ],
  },
  dalton: {
    storm0: { lon: -117.82, lat: 34.17 },
    phases: [
      { t: 0, r: 1.1, name: "GRID ARMED — BIG DALTON" },
      { t: 22, r: 0.86, name: "PHASE 1 — BURN SCAR SATURATION" },
      { t: 48, r: 0.66, name: "PHASE 2 — CANYON PULSE" },
      { t: 76, r: 0.48, name: "PHASE 3 — DAM POOL" },
      { t: 104, r: 0.32, name: "PHASE 4 — FOOTHILL BLVD" },
      { t: 132, r: 0.15, name: "ENDGAME — CITY HALL" },
    ],
    script: [
      { t: 0.4, type: "log", lvl: "sys", msg: "SITE-D  glendora / dalton  ·  fsn /lacounty" },
      { t: 1.6, type: "log", lvl: "ok", msg: "3DEP  big dalton canyon  +  little dalton" },
      { t: 2.8, type: "log", lvl: "ok", msg: "structure  BIG DALTON DAM  1929  ·  flood-control" },
      { t: 6.0, type: "log", lvl: "warn", msg: "burn scar  ·  15-minute rain  18 mm" },
      { t: 10.0, type: "log", lvl: "ok", msg: "it's a UNIX system.  I know this." },
      { t: 22.0, type: "phase", name: "PHASE 1 — BURN SCAR SATURATION" },
      { t: 26.0, type: "log", lvl: "bad", msg: "GMR  mile 4  ·  rockfall  ·  one-lane" },
      { t: 34.0, type: "pip", id: "bdpark" },
      { t: 48.0, type: "phase", name: "PHASE 2 — CANYON PULSE" },
      { t: 54.0, type: "log", lvl: "warn", msg: "debris basin  approaching  70%" },
      { t: 76.0, type: "phase", name: "PHASE 3 — DAM POOL" },
      { t: 80.0, type: "log", lvl: "bad", msg: "objects in paddock  ·  unregistered flow in the gut" },
      { t: 104.0, type: "phase", name: "PHASE 4 — FOOTHILL BLVD" },
      { t: 108.0, type: "pip", id: "stdorothy" },
      { t: 132.0, type: "phase", name: "ENDGAME — CITY HALL" },
      { t: 136.0, type: "log", lvl: "ok", msg: "hold valley center.  files are the phone book." },
    ],
  },
  iv: {
    storm0: { lon: -119.856, lat: 34.411 },
    phases: [
      { t: 0, r: 1.12, name: "GRID ARMED — ISLA VISTA" },
      { t: 20, r: 0.90, name: "PHASE 1 — KING TIDE / BLUFF" },
      { t: 46, r: 0.70, name: "PHASE 2 — DEL PLAYA" },
      { t: 72, r: 0.52, name: "PHASE 3 — PARDALL CORRIDOR" },
      { t: 100, r: 0.34, name: "PHASE 4 — CAMPUS CORE" },
      { t: 128, r: 0.16, name: "ENDGAME — STORKE TOWER" },
    ],
    script: [
      { t: 0.4, type: "log", lvl: "sys", msg: "SITE-I  isla vista / ucsb  ·  fsn /campus" },
      { t: 1.6, type: "log", lvl: "ok", msg: "3DEP  marine terrace  +  noaa shoreline" },
      { t: 2.8, type: "log", lvl: "ok", msg: "vector  IV CDP  ·  UCSB  ·  coal oil point reserve" },
      { t: 5.0, type: "log", lvl: "warn", msg: "king tide  +  1.2 m swell  ·  bluff notch growing" },
      { t: 9.0, type: "log", lvl: "ok", msg: "it's a UNIX system.  I know this." },
      { t: 20.0, type: "phase", name: "PHASE 1 — KING TIDE / BLUFF" },
      { t: 24.0, type: "log", lvl: "bad", msg: "del playa  fence 12  ·  notch under DP addresses" },
      { t: 32.0, type: "pip", id: "copr" },
      { t: 46.0, type: "phase", name: "PHASE 2 — DEL PLAYA" },
      { t: 52.0, type: "log", lvl: "warn", msg: "objects in paddock  ·  unregistered craft off campus point" },
      { t: 72.0, type: "phase", name: "PHASE 3 — PARDALL CORRIDOR" },
      { t: 78.0, type: "pip", id: "ivcsd" },
      { t: 100.0, type: "phase", name: "PHASE 4 — CAMPUS CORE" },
      { t: 106.0, type: "pip", id: "stmarks" },
      { t: 128.0, type: "phase", name: "ENDGAME — STORKE TOWER" },
      { t: 132.0, type: "log", lvl: "ok", msg: "hold embarcadero.  files are the phone book." },
    ],
  },
};

const L = LIB[PAD] || LIB.ww;
export const PHASES = L.phases;
export const STORM0 = L.storm0;
const SCRIPT = L.script;
const LOOP = 156;

export function stormRadiusNorm(t) {
  const x = t % LOOP;
  for (let i = 0; i < PHASES.length - 1; i++) {
    const a = PHASES[i];
    const b = PHASES[i + 1];
    if (x >= a.t && x < b.t) {
      const u = (x - a.t) / (b.t - a.t);
      const s = u * u * (3 - 2 * u);
      return { r: a.r + (b.r - a.r) * s, phase: a, u, t: x };
    }
  }
  return { r: PHASES[PHASES.length - 1].r, phase: PHASES[PHASES.length - 1], u: 1, t: x };
}

export function stormCenter(t) {
  const x = (t % LOOP) / LOOP;
  return {
    lon: STORM0.lon + Math.sin(x * Math.PI * 2) * 0.004,
    lat: STORM0.lat + Math.cos(x * Math.PI * 1.5) * 0.002,
  };
}

export function maxStormSpan() {
  return Math.hypot(BBOX.maxLon - BBOX.minLon, BBOX.maxLat - BBOX.minLat) * 0.55;
}

export function inStorm(lon, lat, t) {
  const c = stormCenter(t);
  const { r } = stormRadiusNorm(t);
  const k = Math.cos((lat * Math.PI) / 180);
  return Math.hypot((lon - c.lon) * k, lat - c.lat) <= r * maxStormSpan();
}

export function parishStatus(p, t) {
  const c = stormCenter(t);
  const { r } = stormRadiusNorm(t);
  const k = Math.cos((p.lat * Math.PI) / 180);
  const d = Math.hypot((p.lon - c.lon) * k, p.lat - c.lat);
  const edge = r * maxStormSpan();
  if (d <= edge * 0.78) return "SAFE";
  if (d <= edge) return "CONTESTED";
  return "OFFLINE";
}

export function liveNodes(t) {
  return SANCTUARIES.filter((s) => inStorm(s.lon, s.lat, t));
}

export function drainEvents(from, to) {
  const a = from % LOOP;
  const b = to % LOOP;
  return b >= a ? SCRIPT.filter((e) => e.t > a && e.t <= b) : SCRIPT.filter((e) => e.t > a || e.t <= b);
}

export function phaseName(t) {
  return stormRadiusNorm(t).phase.name;
}

export function convoyTarget(s, t) {
  if (inStorm(s.lon, s.lat, t)) return { lon: s.lon, lat: s.lat, moving: false };
  const c = stormCenter(t);
  const { r } = stormRadiusNorm(t);
  const edge = r * maxStormSpan() * 0.9;
  const k = Math.cos((s.lat * Math.PI) / 180);
  const dx = (c.lon - s.lon) * k;
  const dy = c.lat - s.lat;
  const d = Math.hypot(dx, dy) || 1;
  return {
    lon: c.lon - ((dx / d) * (edge * 0.12)) / k,
    lat: c.lat - (dy / d) * (edge * 0.12),
    moving: true,
  };
}

export function remainingParishes(t) {
  return PARISHES.filter((p) => parishStatus(p, t) !== "OFFLINE");
}

export function gridCellStatus(col, row, t) {
  const lon = BBOX.minLon + ((col + 0.5) / 8) * (BBOX.maxLon - BBOX.minLon);
  const lat = BBOX.maxLat - ((row + 0.5) / 8) * (BBOX.maxLat - BBOX.minLat);
  return inStorm(lon, lat, t) ? "LIVE" : "DARK";
}

export { project, SITE };
