import { PARISHES, project, BBOX } from "./la-geo.js";
import { SANCTUARIES } from "./sanctuaries.js";

export const PHASES = [
  { t: 0, r: 1.08, name: "GRID ARMED", tag: "STANDBY" },
  { t: 22, r: 0.90, name: "PHASE 1 — COASTAL COLLAPSE", tag: "P1" },
  { t: 48, r: 0.72, name: "PHASE 2 — BASIN BREACH", tag: "P2" },
  { t: 76, r: 0.54, name: "PHASE 3 — RIVER CORRIDOR", tag: "P3" },
  { t: 104, r: 0.38, name: "PHASE 4 — HIGHLANDS", tag: "P4" },
  { t: 132, r: 0.24, name: "PHASE 5 — FINAL PARISHES", tag: "P5" },
  { t: 162, r: 0.12, name: "ENDGAME", tag: "END" },
];

export const STORM0 = { lon: -91.72, lat: 31.05 };

const SCRIPT = [
  { t: 0.3, type: "log", lvl: "sys", msg: "IRIX 5.3  ·  4Dwm  ·  fsn /parkfs" },
  { t: 1.1, type: "log", lvl: "sys", msg: "mount  usgs3dep:/ned13/site-l  (reconstructed NED)" },
  { t: 2.0, type: "log", lvl: "ok", msg: "vector layer  PARISHES  64 features  TIGER-schematic" },
  { t: 2.8, type: "log", lvl: "ok", msg: "sanctuary nodes geocoded   20 headquarters" },
  { t: 3.6, type: "log", lvl: "sys", msg: "overlay  political/parish  ×  hypsometric DEM" },
  { t: 4.6, type: "log", lvl: "warn", msg: "containment grid   ARMED   sector A1–H8" },
  { t: 6.2, type: "log", lvl: "sys", msg: "access security please." },
  { t: 8.4, type: "log", lvl: "ok", msg: "it's a UNIX system.  I know this." },
  { t: 10.2, type: "log", lvl: "sys", msg: "files for the whole park — 990 series as phone book" },
  { t: 14.0, type: "log", lvl: "warn", msg: "PERIMETER FENCE 12   voltage drop  11.2 → 4.1 kV" },
  { t: 17.5, type: "log", lvl: "bad", msg: "FENCE 12  OFFLINE.  objects in paddock." },
  { t: 22.0, type: "phase", name: "PHASE 1 — COASTAL COLLAPSE" },
  { t: 23.0, type: "log", lvl: "bad", msg: "storm circle live.  coastal cells will go dark first." },
  { t: 28.0, type: "log", lvl: "warn", msg: "Cameron.grid  C-08  wetland sector flooding" },
  { t: 34.0, type: "log", lvl: "warn", msg: "Plaquemines finger  ferry link severed" },
  { t: 40.0, type: "log", lvl: "sys", msg: "opening PIP   /990/htdiocese   Houma-Thibodaux threatened" },
  { t: 40.2, type: "pip", id: "d-ht" },
  { t: 48.0, type: "phase", name: "PHASE 2 — BASIN BREACH" },
  { t: 50.0, type: "log", lvl: "bad", msg: "Atchafalaya basin  overtopping  levee 23" },
  { t: 56.0, type: "log", lvl: "warn", msg: "Terrebonne / Lafourche  contested" },
  { t: 62.0, type: "log", lvl: "sys", msg: "convoy vectors  sanctuary nodes → safe circle" },
  { t: 68.0, type: "log", lvl: "warn", msg: "Orleans bowl  pumps 1–6  load shedding" },
  { t: 76.0, type: "phase", name: "PHASE 3 — RIVER CORRIDOR" },
  { t: 78.0, type: "log", lvl: "sys", msg: "Mississippi corridor is the last hard road" },
  { t: 84.0, type: "pip", id: "arch-nola" },
  { t: 84.2, type: "log", lvl: "sys", msg: "PIP  ARCH·NOLA  990 history  +  Walmsley Ave" },
  { t: 92.0, type: "log", lvl: "warn", msg: "Jefferson / St. Bernard  grid flicker" },
  { t: 98.0, type: "log", lvl: "bad", msg: "unregistered objects in grid  (not on the 990 book)" },
  { t: 104.0, type: "phase", name: "PHASE 4 — HIGHLANDS" },
  { t: 106.0, type: "log", lvl: "ok", msg: "Kisatchie / Driskill still inside the fence" },
  { t: 112.0, type: "pip", id: "d-alex" },
  { t: 118.0, type: "log", lvl: "warn", msg: "Caddo node  holding.  Bossier corridor open." },
  { t: 126.0, type: "log", lvl: "sys", msg: "white_rabbit.obj   —   you didn't say the magic word" },
  { t: 132.0, type: "phase", name: "PHASE 5 — FINAL PARISHES" },
  { t: 134.0, type: "log", lvl: "bad", msg: "circle now smaller than a diocese" },
  { t: 142.0, type: "pip", id: "fmolhs" },
  { t: 148.0, type: "log", lvl: "warn", msg: "only highland + river-city nodes remain solvent" },
  { t: 156.0, type: "log", lvl: "sys", msg: "visitor center = last 990 that still answers the phone" },
  { t: 162.0, type: "phase", name: "ENDGAME" },
  { t: 164.0, type: "log", lvl: "ok", msg: "hold the circle.  files are the phone book." },
  { t: 172.0, type: "log", lvl: "sys", msg: "looping plot in 12s  —  protocol WHITE RABBIT" },
];

export function stormRadiusNorm(t) {
  const x = t % 184;
  let r = PHASES[0].r;
  for (let i = 0; i < PHASES.length - 1; i++) {
    const a = PHASES[i];
    const b = PHASES[i + 1];
    if (x >= a.t && x < b.t) {
      const u = (x - a.t) / (b.t - a.t);
      const s = u * u * (3 - 2 * u);
      r = a.r + (b.r - a.r) * s;
      return { r, phase: a, u, t: x };
    }
  }
  return { r: PHASES[PHASES.length - 1].r, phase: PHASES[PHASES.length - 1], u: 1, t: x };
}

export function stormCenter(t) {
  const x = (t % 184) / 184;
  return {
    lon: STORM0.lon + Math.sin(x * Math.PI * 2) * 0.22,
    lat: STORM0.lat + Math.cos(x * Math.PI * 1.4) * 0.12,
  };
}

export function maxStormSpan() {
  const dlon = BBOX.maxLon - BBOX.minLon;
  const dlat = BBOX.maxLat - BBOX.minLat;
  return Math.hypot(dlon, dlat) * 0.52;
}

export function inStorm(lon, lat, t) {
  const c = stormCenter(t);
  const { r } = stormRadiusNorm(t);
  const k = Math.cos((lat * Math.PI) / 180);
  const d = Math.hypot((lon - c.lon) * k, lat - c.lat);
  return d <= r * maxStormSpan();
}

export function parishStatus(p, t) {
  const inside = inStorm(p.lon, p.lat, t);
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
  const a = from % 184;
  const b = to % 184;
  const span = b >= a ? SCRIPT.filter((e) => e.t > a && e.t <= b) : SCRIPT.filter((e) => e.t > a || e.t <= b);
  return span;
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
    lon: c.lon - (dx / d) * (edge * 0.15) / k,
    lat: c.lat - (dy / d) * (edge * 0.15),
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

export { project };
