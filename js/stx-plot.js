import { PARISHES, project, BBOX } from "./stx-geo.js";
import { SANCTUARIES } from "./stx-nodes.js";

export const PHASES = [
  { t: 0, r: 1.12, name: "GRID ARMED — POINT UDALL DATUM", tag: "STANDBY" },
  { t: 20, r: 0.92, name: "PHASE 1 — EAST END WALL", tag: "P1" },
  { t: 46, r: 0.74, name: "PHASE 2 — BUCK ISLAND REEF", tag: "P2" },
  { t: 72, r: 0.56, name: "PHASE 3 — HARBOR & SALT RIVER", tag: "P3" },
  { t: 100, r: 0.40, name: "PHASE 4 — CENTERLINE HIGHLANDS", tag: "P4" },
  { t: 128, r: 0.24, name: "PHASE 5 — WEST END LAST LIGHT", tag: "P5" },
  { t: 156, r: 0.11, name: "ENDGAME — MOUNT EAGLE", tag: "END" },
];

/** Atlantic approach: storm walks west from east of Point Udall. */
export const STORM0 = { lon: -64.72, lat: 17.74 };

const SCRIPT = [
  { t: 0.3, type: "log", lvl: "sys", msg: "IRIX 5.3  ·  4Dwm  ·  fsn /parkfs/stx" },
  { t: 1.0, type: "log", lvl: "sys", msg: "mount  usgs3dep:/usvi/stx  +  noaa ncei coastal bathy" },
  { t: 1.8, type: "log", lvl: "ok", msg: "vector  DANISH QUARTERS  11  (WE PR KI QU CO EEA EEB NSA NSB FR CH)" },
  { t: 2.6, type: "log", lvl: "ok", msg: "source map  villamargarita.com/st-croix-map  —  road / beach / quarter" },
  { t: 3.4, type: "log", lvl: "ok", msg: "nodes  15  ·  visitor pad VILLA·M  @  22 Salt River Rd" },
  { t: 4.4, type: "log", lvl: "warn", msg: "containment grid ARMED   datum POINT UDALL  17°45′20″N 64°33′55″W" },
  { t: 6.0, type: "log", lvl: "sys", msg: "access security please." },
  { t: 7.8, type: "log", lvl: "ok", msg: "it's a UNIX system.  I know this." },
  { t: 9.6, type: "log", lvl: "sys", msg: "the 990s are the phone book.  the quarters are the paddocks." },
  { t: 13.2, type: "log", lvl: "warn", msg: "PERIMETER FENCE 12  —  north wall voltage  11.2 → 3.8 kV" },
  { t: 16.8, type: "log", lvl: "bad", msg: "FENCE 12 OFFLINE.  objects in the paddock.  (north drop-off)" },
  { t: 20.0, type: "phase", name: "PHASE 1 — EAST END WALL" },
  { t: 21.0, type: "log", lvl: "bad", msg: "Atlantic feeder.  East End B  /  Point Udall  first to flicker." },
  { t: 26.0, type: "log", lvl: "warn", msg: "Isaac's Bay / Jack's Bay  swell  +  East End Marine Park advisory" },
  { t: 32.0, type: "log", lvl: "sys", msg: "opening PIP   /990/southgate   East End A threatened" },
  { t: 32.2, type: "pip", id: "southgate" },
  { t: 38.0, type: "log", lvl: "warn", msg: "Cramer Park road  —  Scenic Road East  spray over the cut" },
  { t: 46.0, type: "phase", name: "PHASE 2 — BUCK ISLAND REEF" },
  { t: 47.5, type: "log", lvl: "bad", msg: "Buck Island Reef NM  —  underwater trail  closed.  cay still dry." },
  { t: 54.0, type: "log", lvl: "warn", msg: "Chenay Bay / Southgate  contested.  Company Quarter holding." },
  { t: 60.0, type: "log", lvl: "sys", msg: "convoy vectors  sanctuary nodes → Kingshill highland" },
  { t: 66.0, type: "log", lvl: "warn", msg: "Christiansted harbor  seaplane ramp  load shedding" },
  { t: 72.0, type: "phase", name: "PHASE 3 — HARBOR & SALT RIVER" },
  { t: 73.5, type: "log", lvl: "sys", msg: "Salt River Bay  —  Columbus landing  /  villa row on the north lip" },
  { t: 78.0, type: "pip", id: "villa-margarita" },
  { t: 78.2, type: "log", lvl: "sys", msg: "PIP  VILLA·M  22 Salt River Road  ·  map source online" },
  { t: 86.0, type: "pip", id: "holy-cross" },
  { t: 86.2, type: "log", lvl: "sys", msg: "PIP  HOLY·X  Queen Street  ·  990 history" },
  { t: 92.0, type: "log", lvl: "warn", msg: "Protestant Cay  ferry  irregular.  boardwalk nodes amber." },
  { t: 98.0, type: "log", lvl: "bad", msg: "unregistered objects in Salt River  (not on the 990 book)" },
  { t: 100.0, type: "phase", name: "PHASE 4 — CENTERLINE HIGHLANDS" },
  { t: 102.0, type: "log", lvl: "ok", msg: "Kingshill / La Reine / Glynn  still inside the fence" },
  { t: 108.0, type: "pip", id: "lssvi" },
  { t: 114.0, type: "log", lvl: "warn", msg: "Centerline Road 70  open.  Evans Hwy 66  spray on the south shelf." },
  { t: 122.0, type: "log", lvl: "sys", msg: "whte_rbt.obj  —  you didn't say the magic word" },
  { t: 128.0, type: "phase", name: "PHASE 5 — WEST END LAST LIGHT" },
  { t: 130.0, type: "log", lvl: "bad", msg: "circle now smaller than a quarter" },
  { t: 136.0, type: "pip", id: "st-patrick" },
  { t: 142.0, type: "log", lvl: "warn", msg: "Frederiksted Pier  /  Rainbow Beach  last west light" },
  { t: 150.0, type: "log", lvl: "sys", msg: "visitor center = last 990 that still answers the phone" },
  { t: 156.0, type: "phase", name: "ENDGAME — MOUNT EAGLE" },
  { t: 158.0, type: "log", lvl: "ok", msg: "hold the highland.  files are the phone book." },
  { t: 168.0, type: "log", lvl: "sys", msg: "looping plot  —  protocol POINT UDALL" },
];

export function stormRadiusNorm(t) {
  const x = t % 180;
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
  const x = (t % 180) / 180;
  return {
    lon: STORM0.lon - x * 0.06 + Math.sin(x * Math.PI * 2) * 0.012,
    lat: STORM0.lat + Math.cos(x * Math.PI * 1.6) * 0.006,
  };
}

export function maxStormSpan() {
  const dlon = BBOX.maxLon - BBOX.minLon;
  const dlat = BBOX.maxLat - BBOX.minLat;
  return Math.hypot(dlon, dlat) * 0.55;
}

export function inStorm(lon, lat, t) {
  const c = stormCenter(t);
  const { r } = stormRadiusNorm(t);
  const k = Math.cos((lat * Math.PI) / 180);
  const d = Math.hypot((lon - c.lon) * k, lat - c.lat);
  return d <= r * maxStormSpan();
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
  const a = from % 180;
  const b = to % 180;
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

export { project };
