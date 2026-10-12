/**
 * casefiles-4dwm.js — CASEFILES · 4DWM theater.
 *
 * The lab's dossier tabs read one object at a time, top to bottom. This plate
 * reads the same two objects spatially, in the repo's 4Dwm idiom: a third
 * dimension for magnitude, a fourth for time.
 *
 *   PLATE 1 — SHELF   the corpus. One column per Wayback capture of the site:
 *                     x = capture date, z = capture kind (a lane per shelf),
 *                     y = log2(record length). The scrubber is the fourth axis:
 *                     only captures dated at or before the cursor stand up, and
 *                     PLAY walks 1995 → the last capture.
 *   PLATE 2 — BYTES   the artifact on the table. A bit-plane relief:
 *                     x = file offset, z = bit position 7..0,
 *                     y = fraction of set bits in that window at that plane.
 *                     Here the scrubber is an offset sweep, so the fourth axis
 *                     walks the disassembly instead of the calendar.
 *
 * Colour carries evidence, in the family's three tiers:
 *   #ffb020 verified — bytes recovered in this session and checked against the
 *                      archive's own CDX SHA-1.
 *   #5cd6ff indexed  — the archive index has a row for it; no bytes fetched.
 *   #ff6ec7 claimed  — the site's own catalogue promised it and no crawler ever
 *                      got a 200. Note-only, and drawn flat because there are no
 *                      bytes to draw.
 *
 * Deliberately *not* a terrain. There is no DEM and no survey under either
 * plate: heights are log2 of byte counts and bit densities, the SHELF floor is
 * binned and smoothed, and that interpolation is disclosed in the legend rather
 * than hidden inside the shading. Nothing here reaches the network — every byte
 * comes from what the lab already recovered, or from the pinned catalog.
 *
 * The renderer is a painter's-algorithm rasteriser on a 2D canvas: no WebGL, no
 * three.js, no vendor bundle. That is what lets one module serve all three
 * builds — the ES-module page, the single-file inlined page, and the webxdc.
 *
 * The pure parts (dates, tiers, fields, the VRML writer) are exported so
 * `tests/casefiles-4dwm.test.mjs` can exercise them in Node with no DOM.
 */

import { hex } from "./x86dis.js";
import {
  LIBRARY, NOT_CAPTURED, CURATED, SITE, waybackUrl, waybackView,
  SHADOWELF, VXHEAVENS, TROJANSLAIR, MAKINT,
} from "./krome-catalog.js";
import { downloadText } from "./vrml-export.js";
import { initPipWm } from "./project-y-4dwm.js";

/* ------------------------------------------------------------------ tiers */

export const TIERS = [
  {
    id: "verified", label: "VERIFIED", color: "#ffb020",
    note: "bytes recovered this session, SHA-1 checked against the archive's own CDX index",
  },
  {
    id: "indexed", label: "INDEXED", color: "#5cd6ff",
    note: "a row in the CDX index for this URL and timestamp — no bytes fetched",
  },
  {
    id: "claimed", label: "CLAIMED", color: "#ff6ec7",
    note: "linked by the site's own catalogue, never captured with HTTP 200: note only",
  },
];

export const TIER_OF = Object.fromEntries(TIERS.map((t) => [t.id, t]));

/** Capture kinds become lanes, in the order the shelves were kept. */
export const SHELF_LANES = [
  { id: "z", label: "ARCHIVE", sub: "zip/arc" },
  { id: "t", label: "TEXT", sub: "txt/doc" },
  { id: "h", label: "PAGE", sub: "html" },
  { id: "!", label: "LATE", sub: "suspect capture" },
  { id: "x", label: "UNRECOVERED", sub: "no capture exists" },
];

const LANE_INDEX = Object.fromEntries(SHELF_LANES.map((l, i) => [l.id, i]));

/** Which shelf a catalog row belongs to. Late captures win over their kind. */
export function laneFor(entry) {
  // A row that already carries a lane index (a theater column, not a catalog
  // row) keeps it; LANE_INDEX is keyed by kind letters, so test numerically.
  if (Number.isInteger(entry.lane) && entry.lane >= 0 && entry.lane < SHELF_LANES.length) return entry.lane;
  if (entry.kind === "!") return LANE_INDEX["!"];
  if (typeof entry.kind === "string" && entry.kind in LANE_INDEX) return LANE_INDEX[entry.kind];
  return LANE_INDEX["t"];
}

/* ------------------------------------------------------------------ dates */

/** 14-digit Wayback timestamp → decimal year ("19981204015537" → 1998.93). */
export function captureYear(ts) {
  const s = String(ts || "");
  if (!/^\d{14}/.test(s)) return null;
  const y = Number(s.slice(0, 4));
  const mo = Math.min(12, Math.max(1, Number(s.slice(4, 6)) || 1));
  const da = Math.min(31, Math.max(1, Number(s.slice(6, 8)) || 1));
  if (!(y >= 1985 && y <= 2100)) return null;
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  const at = Date.UTC(y, mo - 1, da);
  if (!Number.isFinite(at)) return y;
  return y + Math.max(0, Math.min(0.9999, (at - start) / (end - start)));
}

const cf4FmtYear = (year) => {
  const y = Math.floor(year);
  const mo = Math.min(12, Math.floor((year - y) * 12) + 1);
  return `${y}-${String(mo).padStart(2, "0")}`;
};

/* ------------------------------------------------------------- the corpus */

/** Extension → shelf lane, for case corpora whose rows carry no `kind`. */
export function inferKind(name) {
  const ext = String(name || "").split(".").pop().toLowerCase();
  if (["zip", "arc", "lzh", "arj", "rar", "ha", "cab"].includes(ext)) return "z";
  if (["htm", "html"].includes(ext)) return "h";
  return "t";
}

/**
 * Every row the SHELF plate can draw, from the pinned catalog plus whatever the
 * lab has verified this session. Pure: pass the arrays, get the columns back.
 */
export function shelfColumns({
  library = LIBRARY,
  notCaptured = NOT_CAPTURED,
  verified = new Set(),
  site = SITE,
} = {}) {
  const columns = [];
  for (const e of library || []) {
    const year = captureYear(e.ts);
    const kind = e.kind || inferKind(e.name);
    columns.push({
      id: `cap:${e.name}:${e.ts}`,
      name: e.name,
      ts: e.ts,
      year,
      bytes: e.warc || 0,
      kind,
      lane: laneFor({ ...e, kind }),
      desc: e.desc || "",
      curated: CURATED[e.name]?.body || "",
      tag: CURATED[e.name]?.tag || "",
      tier: verified.has(e.name) ? "verified" : "indexed",
      captured: true,
      entry: e,
    });
  }
  // The files the site advertised and the crawlers never got.
  const nominal = cf4SiteYearRange(site);
  for (const e of notCaptured || []) {
    columns.push({
      id: `unc:${e.name}`,
      name: e.name,
      ts: null,
      year: nominal.end,
      bytes: 0,
      kind: "x",
      lane: LANE_INDEX["x"],
      desc: e.desc || "",
      curated: "",
      tag: "never captured",
      tier: "claimed",
      captured: false,
      entry: null,
    });
  }
  return columns.filter((c) => Number.isFinite(c.year));
}

function cf4SiteYearRange(site) {
  const years = String(site?.years || "1995–98");
  const nums = years.match(/\d{4}/g) || ["1995", "1998"];
  const start = Number(nums[0]);
  const endYear = Number(nums.length > 1 ? nums[nums.length - 1] : nums[0]);
  const end = endYear > start ? endYear + 0.5 : endYear + 0.9;
  return { start, end };
}

/**
 * Which cases ship a pinned capture corpus the SHELF plate can draw. Cases not
 * listed here have no index rows to place (they are page-scraped, script
 * shelves, or a local drop), so the plate says so instead of inventing a shape.
 */
export const CASE_CORPORA = {
  krome: { label: "kr0me corp · members.tripod.com/~retrotech", rows: () => LIBRARY, extra: () => NOT_CAPTURED, site: () => SITE },
  shadowelf: { label: "the shadow elf · geocities.com/SiliconValley/Park/8099", rows: () => SHADOWELF.files, site: () => SHADOWELF },
  vcl: { label: "VX Heavens · the Constructors shelf", rows: () => VXHEAVENS.files, site: () => VXHEAVENS },
  trojanslair: { label: "Trojan's Lair · tlsecurity.net depot", rows: () => TROJANSLAIR.files, site: () => TROJANSLAIR },
  makint: { label: "MAKInterface · Maki GmbH, Karben", rows: () => MAKINT.files, site: () => MAKINT },
};

export function corpusFor(caseId, { verified = new Set() } = {}) {
  const spec = CASE_CORPORA[caseId];
  if (!spec) return null;
  return {
    label: spec.label,
    columns: shelfColumns({
      library: spec.rows(),
      notCaptured: spec.extra ? spec.extra() : [],
      verified,
      site: spec.site(),
    }),
  };
}


/**
 * The SHELF field: a binned, 1-2-1 smoothed density floor under the columns.
 * `nx` bins along the calendar, `ny` shelf lanes across. Elevation is the share
 * of the corpus's log-bytes that landed in that bin — a rendering of index
 * metadata, and `interpolated: true` says so.
 */
export function buildShelfField(entries, { bins = 44 } = {}) {
  const columns = Array.isArray(entries?.columns) ? entries.columns : entries;
  let min = Infinity, max = -Infinity, maxLog = 0;
  for (const c of columns) {
    if (c.year < min) min = c.year;
    if (c.year > max) max = c.year;
    const l = logSize(c.bytes);
    if (l > maxLog) maxLog = l;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 1995; max = 1999; }
  if (max - min < 0.5) max = min + 0.5;
  if (!(maxLog > 0)) maxLog = 1;
  const nx = Math.max(4, Math.round(bins));
  const ny = SHELF_LANES.length;
  const width = (max - min) / nx;
  const raw = new Float64Array(nx * ny);
  const binCount = new Array(nx).fill(0);
  const binBytes = new Float64Array(nx);
  for (const c of columns) {
    const i = Math.max(0, Math.min(nx - 1, Math.floor((c.year - min) / width)));
    const j = c.lane;
    raw[j * nx + i] += logSize(c.bytes) / maxLog;
    binCount[i] += 1;
    binBytes[i] += c.bytes;
  }
  const elev = cf4Smooth121(raw, nx, ny);
  let peak = 0;
  for (const v of elev) if (v > peak) peak = v;
  const grid = [];
  for (let i = 0; i < nx; i++) {
    grid.push({
      year0: min + i * width,
      year1: min + (i + 1) * width,
      n: binCount[i],
      bytes: binBytes[i],
    });
  }
  for (const c of columns) {
    c.bin = Math.max(0, Math.min(nx - 1, Math.floor((c.year - min) / width)));
    c.h = logSize(c.bytes) / maxLog;
    c.fx = (c.year - min) / (max - min);
    c.fz = ny > 1 ? c.lane / (ny - 1) : 0.5;
  }
  return {
    plate: "shelf", nx, ny, elev, min: 0, max: peak || 1,
    years: { min, max }, binWidth: width, bins: grid, columns,
    interpolated: true,
    // Two quantities, two normalisations — both stated, neither folded away.
    units: {
      floor: "Σ log2(record length) per year-bin and shelf, scaled to the busiest bin",
      column: "one capture's log2(1+bytes) ÷ log2(1+8 MiB), so the biggest file stands one unit tall",
    },
    unit: "capture sizes and bin sums on the same 0–1 log axis",
  };
}

/**
 * The 4th axis as pure data: which captures have landed by `asOf`. A null
 * cursor, or one at/after the last capture, is the all-time aggregate — the
 * same view the plate boots with and what ALL TIME restores.
 */
export function columnsUpTo(columns, asOf, endYear) {
  if (!Array.isArray(columns)) return [];
  if (asOf == null || asOf >= endYear) return columns;
  return columns.filter((c) => c.year <= asOf + 1e-9);
}

/** Byte counts on a log axis: one unit is 8 MiB, so a 40 KB zip and an 8 MB
 *  one share the same plate instead of the big one eating the picture. */
export function logSize(bytes) {
  const n = Math.max(0, Number(bytes) || 0);
  return n > 0 ? Math.log2(1 + n) / 23 : 0; // 2^23 = 8 MiB ceiling
}

function cf4Smooth121(src, nx, ny) {
  const out = new Float64Array(src.length);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = src[j * nx + Math.max(0, i - 1)];
      const b = src[j * nx + i];
      const c = src[j * nx + Math.min(nx - 1, i + 1)];
      out[j * nx + i] = (a + 2 * b + c) / 4;
    }
  }
  return out;
}

/* ---------------------------------------------------------- the artifact */

/**
 * The BYTES field: bit-plane relief of the bytes the lab is holding.
 * Window size is a multiple of 8 so a window is a whole number of bytes, and
 * at most `bins` windows are kept so a 8 MB drop still draws at 60 fps.
 */
export function buildByteField(bytes, { bins = 72, planes = 8 } = {}) {
  const len = bytes?.length || 0;
  const nx = Math.max(2, Math.min(bins, len > 0 ? Math.ceil(len / 64) : 2));
  const window = Math.max(8, 8 * Math.ceil((len / nx) / 8)) || 8;
  const ny = planes;
  const elev = new Float64Array(nx * ny);
  const ent = new Float64Array(nx);
  const rows = [];
  for (let i = 0; i < nx; i++) {
    const off = i * window;
    if (off >= len) break;
    const slice = bytes.subarray(off, Math.min(len, off + window));
    let bits = 0, ones = 0;
    const planeOnes = new Float64Array(ny);
    for (const b of slice) {
      for (let p = 0; p < ny; p++) {
        const bit = (b >> (7 - p)) & 1;
        bits += 1;
        ones += bit;
        planeOnes[p] += bit;
      }
    }
    let h = 0;
    const counts = new Map();
    for (const b of slice) counts.set(b, (counts.get(b) || 0) + 1);
    for (const c of counts.values()) {
      const p = c / slice.length;
      h -= p * Math.log2(p);
    }
    ent[i] = h;
    // A plane's height is "how many bytes in this window have bit p set", so it
    // divides by the byte count; the window's overall density divides by the
    // full bit count. Conflating the two flattens the relief by 8×.
    for (let p = 0; p < ny; p++) elev[p * nx + i] = slice.length ? planeOnes[p] / slice.length : 0;
    rows.push({ i, off, len: slice.length, entropy: h, density: bits ? ones / bits : 0 });
  }
  const used = rows.length || 1;
  const grid = new Float64Array(nx * ny);
  for (let p = 0; p < ny; p++) for (let i = 0; i < used; i++) grid[p * nx + i] = elev[p * nx + i];
  let peak = 0;
  for (const v of grid) if (v > peak) peak = v;
  return {
    plate: "bytes", nx: used, ny, elev: grid, min: 0, max: peak || 1,
    entropy: ent, rows, window, bytesLen: len,
    interpolated: false,
    units: {
      floor: "fraction of set bits in that window at that bit plane, bit 7 down to bit 0",
      colour: "Shannon entropy of the window — green code, amber mixed, red packed or random",
    },
    unit: "set-bit fraction per plane",
  };
}

/** Entropy colour, identical to the lab's own HEX · ENTROPY strip. */
export function entropyColor(bits) {
  if (bits > 7.2) return "#ff5470";
  if (bits > 6) return "#f7d56a";
  return "#4be585";
}

/**
 * Markers worth a pip on the BYTES plate: the entry point the container
 * declares, the addresses the technique map recovered, and the symbols the
 * disassembler saw referenced most.
 */
export function byteMarkers(artifact, { max = 48 } = {}) {
  if (!artifact) return [];
  const out = [];
  const push = (m) => {
    if (out.length < max) out.push(m);
  };
  const len = Math.max(1, artifact.bytes?.length || 1);
  const base = artifact.base ?? 0;
  const fxOf = (addr) => Math.max(0, Math.min(0.9999, (addr - base) / len));
  if (Number.isFinite(artifact.entry)) {
    push({
      id: `entry:${artifact.entry}`, label: "ENTRY", off: artifact.entry - base,
      detail: `${artifact.meta?.kind || "?"} declares CS:IP at ${hex(artifact.entry)}`,
      addr: artifact.entry, tier: "verified", kind: "entry",
    });
  }
  for (const row of artifact.techniques || []) {
    for (const addr of (row.addrs || []).slice(0, 2)) {
      push({
        id: `tech:${row.label}:${addr}`, label: row.label, off: addr - base,
        detail: row.note || "", addr, tier: "indexed", kind: "technique",
      });
    }
  }
  const syms = [...(artifact.symbols || [])]
    .sort((a, b) => (b.ref.calls + b.ref.jumps) - (a.ref.calls + a.ref.jumps))
    .slice(0, 12);
  for (const s of syms) {
    push({
      id: `sym:${s.addr}`, label: s.label, off: s.addr - base,
      detail: `c${s.ref.calls} call · j${s.ref.jumps} jump target`, addr: s.addr,
      tier: "indexed", kind: "symbol",
    });
  }
  for (const m of out) m.fx = fxOf(m.addr ?? base);
  return out;
}

/* ------------------------------------------------------------- VRML writer */

/**
 * VRML 2.0 writer for these two fields. js/vrml-export.js is the family's
 * terrarium writer, but its WorldInfo block advertises "USGS 3DEP
 * reconstruction" — true of the terrain plates, a lie here — so the casefiles
 * theater writes its own header and reuses the same IndexedFaceSet idiom.
 */
export function fieldToVrml(field, { title = "CASEFILES · 4DWM", provenance = "", stepX = 1, stepY = 1 } = {}) {
  const { nx, ny, elev } = field;
  const w = 40, d = 24, elevScale = 3.2;
  const max = field.max || 1;
  const fmt = (n) => Number(n).toFixed(4);
  const cols = [];
  for (let j = 0; j < ny; j += stepY) {
    for (let i = 0; i < nx; i += stepX) {
      const v = elev[j * nx + i] || 0;
      cols.push(`${fmt((i / (nx - 1 || 1) - 0.5) * w)} ${fmt((v / max) * elevScale)} ${fmt((j / (ny - 1 || 1) - 0.5) * d)}`);
    }
  }
  const cx = Math.ceil(nx / stepX);
  const cy = Math.ceil(ny / stepY);
  const faces = [];
  for (let j = 0; j < cy - 1; j++) {
    for (let i = 0; i < cx - 1; i++) {
      const a = j * cx + i, b = a + 1, c = a + cx, dd = c + 1;
      faces.push(`${a} ${c} ${b} -1`, `${b} ${c} ${dd} -1`);
    }
  }
  const nodes = [];
  if (field.plate === "shelf") {
    for (const c of field.columns || []) {
      const y = c.h * elevScale * 1.15;
      const x = (c.fx - 0.5) * w;
      const z = (c.fz - 0.5) * d;
      const shade = c.tier === "verified" ? "1 0.69 0.13" : c.tier === "claimed" ? "1 0.43 0.78" : "0.36 0.84 1";
      nodes.push(
        `Transform { translation ${fmt(x)} ${fmt(Math.max(0.05, y) / 2)} ${fmt(z)} children [ Shape { appearance Appearance { material Material { diffuseColor ${shade} } } } geometry Box { size ${fmt(w / nx)} ${fmt(Math.max(0.1, y))} ${fmt(d / ny)} } ] }`,
      );
    }
  }
  const safe = (s) => String(s).replace(/["\r\n]/g, "").slice(0, 200);
  return `#VRML V2.0 utf8
# ${safe(title)}
# ${safe(provenance)}
# NOT a survey product. Elevations are ${safe(field.unit || "derived statistics")}.
# height: ${safe(field.units?.floor || field.unit || "derived statistics")}
# shade:  ${safe(field.units?.colour || field.units?.column || "")}
# generated ${new Date().toISOString()}

WorldInfo {
  title "${safe(title)}"
  info [ "${safe(provenance || "no provenance string")}", "byte statistics, not terrain", "read-only static analysis" ]
}

Background { skyColor [ 0.04 0.05 0.08 ] }
NavigationInfo { type [ "EXAMINE" "ANY" ] headlight TRUE }
DirectionalLight { direction -0.4 -1 -0.3 color 0.6 0.75 0.95 intensity 0.8 }
DirectionalLight { direction 0.6 -0.4 0.5 color 1 0.7 0.3 intensity 0.3 }

DEF LAYER_MESH Transform {
  children [
    Shape {
      appearance Appearance { material Material { diffuseColor 0.2 0.42 0.5 specularColor 0.2 0.3 0.35 transparency 0.12 } }
      geometry IndexedFaceSet {
        solid FALSE
        creaseAngle 1.2
        coord Coordinate { point [ ${cols.join(", ")} ] }
        coordIndex [ ${faces.join(" ")} ]
      }
    }
  ]
}
${nodes.length ? `\nDEF LAYER_COLUMNS Transform {\n  children [\n    ${nodes.join("\n    ")}\n  ]\n}` : ""}
`;
}

/* ------------------------------------------------------------- the theater */

const CF4_CAM = { yaw: -0.62, pitch: 0.66, dist: 2.05, fov: 2.1 };
const CF4_WORLD = { w: 1.0, d: 0.62, h: 0.34 };
const EMPTY_CAM = { ...CF4_CAM };

const $id = (id) => document.getElementById(id);
const esc4 = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clamp4 = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function prefersReducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Mount the theater. Called lazily, the first time THEATER · 4DWM is opened, so
 * the lab never pays for a canvas it does not look at.
 *
 *   initCasefilesTheater({
 *     getState,          // () => the lab's live state
 *     log(msg, level),   // the lab's engine log
 *     recover(entry),    // run the lab's Wayback + SHA-1 gate for a column
 *     openRecovered(n),  // hand verified bytes back to the lab's loader
 *     inspectAddress(a), // send an address to the disassembly + decompiler
 *   })
 */
export function initCasefilesTheater(cfg = {}) {
  const canvas = $id("cf4Canvas");
  if (!canvas) return null;
  const ctx2d = canvas.getContext("2d");
  if (!ctx2d) {
    const empty = $id("cf4Empty");
    if (empty) { empty.hidden = false; empty.textContent = "no 2D canvas in this browser — the theater cannot draw; every other tab still works."; }
    return null;
  }
  const labels = $id("cf4LabelLayer");
  const hud = $id("cf4Hud");
  const statLine = $id("cf4Stat");

  const view = {
    plate: "shelf",
    caseId: "krome",
    mode: "relief",
    labelsOn: true,
    spin: false,
    asOf: null,          // decimal year for the SHELF plate
    sweep: 0,            // 0..1 offset fraction for the BYTES plate
    playing: false,
    reduced: prefersReducedMotion(),
  };
  const cam = { ...EMPTY_CAM };
  let field = null;         // the plate's field (grid + columns/markers)
  let corpusLabel = "";
  let anchors = [];         // projected click targets
  let artifact = null;
  let verifiedNames = new Set();
  let wm = null;
  let raf = 0;
  let dirty = true;
  let dpr = 1;
  let fps = { n: 0, t0: 0, value: 0 };
  let grow = new Map();     // column id -> 0..1 rise progress
  let observer = null;      // keeps the backing store matched to the CSS size
  let lastT = 0;

  /* ---------------------------------------------------------------- log */

  const announce = (msg, level = "info") => {
    if (hud) hud.textContent = msg;
    deskStatus(msg);
    cfg.log?.(msg, level);
  };

  /**
   * The desk bar keeps its own count, so `#cf4WmStatus` is never a dead label:
   * `initPipWm` owns the desk buttons, and everything it says arrives here.
   */
  function deskStatus() {
    const el = $id("cf4WmStatus");
    if (!el) return;
    const n = wm?.count?.() ?? 0;
    el.textContent = n ? `4Dwm desk · ${n} pip${n === 1 ? "" : "s"}` : "4Dwm desk · no pips";
  }

  /* -------------------------------------------------------------- sizing */

  function resize() {
    const host = canvas.parentElement;
    const rect = host.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const wpx = Math.max(240, Math.round(rect.width));
    const hpx = Math.max(180, Math.round(Math.min(rect.height || 420, 62 * (window.innerHeight / 100))));
    canvas.width = Math.round(wpx * dpr);
    canvas.height = Math.round(hpx * dpr);
    canvas.style.height = `${hpx}px`;
    dirty = true;
  }

  /* ------------------------------------------------------------ rebuild */

  const empty = $id("cf4Empty");

  function showEmpty(msg) {
    field = null;
    if (empty) { empty.hidden = false; empty.textContent = msg; }
    if (statLine) statLine.textContent = "";
    drawLegend();
    dirty = true;
    schedule();
  }

  function rebuild() {
    corpusLabel = "";
    if (empty) empty.hidden = true;
    // rebuild() is authoritative about which field is on screen: if the bytes
    // plate has nothing to draw it falls back and says so in view.plate, so no
    // caller can end up with a "bytes" label over a shelf field.
    if (view.plate === "bytes" && artifact?.bytes?.length) {
      field = buildByteField(artifact.bytes, { bins: 72 });
      field.markers = byteMarkers(artifact, { max: 48 });
      view.plate = "bytes";
    } else {
      const state = cfg.getState?.() || {};
      const corpus = corpusFor(state.caseId, { verified: verifiedNames });
      if (!corpus) {
        showEmpty(`the ${state.caseId || "selected"} case has no pinned capture corpus for the SHELF plate — it is a page scrape, a script shelf or a local drop. Pick a case with index rows, or load bytes and switch to BIT-PLANE RELIEF.`);
        return;
      }
      corpusLabel = corpus.label;
      field = buildShelfField(corpus, { bins: 44 });
      view.plate = "shelf";
    }
    for (const c of field.columns || []) if (!grow.has(c.id)) grow.set(c.id, 0);
    drawStatLine();
    drawLegend();
    dirty = true;
  }

  function drawStatLine() {
    if (!statLine) return;
    statLine.textContent = "";
    if (!field) return;
    const part = (label, value, cls = "") => {
      const s = document.createElement("span");
      if (cls) s.className = cls;
      const b = document.createElement("b");
      b.textContent = label;
      s.append(b, ` ${value}`);
      statLine.append(s);
    };
    if (field.plate === "shelf") {
      const n = field.columns.length;
      const ok = field.columns.filter((c) => c.tier === "verified").length;
      part("plate", `SHELF · ${corpusLabel || "capture corpus"}`);
      part("columns", `${n}`);
      part("verified", `${ok}`, ok ? "ok" : "dim");
      part("span", `${cf4FmtYear(field.years.min)} → ${cf4FmtYear(field.years.max)}`);
      part("grid", `${field.nx}×${field.ny} bins, 1-2-1 smoothed`);
    } else {
      part("plate", `BYTES · ${artifact?.name || ""}`);
      part("bytes", `${artifact.bytes.length}`);
      part("window", `${field.window} B × ${field.nx}`);
      part("planes", "bit 7 → bit 0");
      part("markers", `${field.markers?.length || 0}`);
    }
  }

  function drawLegend() {
    const host = $id("cf4Legend");
    if (!host) return;
    host.textContent = "";
    const add = (color, label, note) => {
      const li = document.createElement("li");
      const sw = document.createElement("i");
      sw.style.background = color;
      const b = document.createElement("b");
      b.textContent = label;
      const small = document.createElement("span");
      small.textContent = note;
      li.append(sw, b, small);
      host.append(li);
    };
    for (const t of TIERS) add(t.color, t.label, t.note);
    if (field?.plate === "shelf") {
      add("#76e2df", "FLOOR", field.units?.floor || "binned log-bytes per year — interpolated grain, not a measurement");
      add("#fbf9f2", "COLUMN", field.units?.column || "one capture, log-scaled");
      add("#5b6178", "LANES", SHELF_LANES.map((l) => l.label).join(" · "));
    } else if (field) {
      add("#76e2df", "SURFACE", field.units?.floor || "set-bit fraction per plane");
      add("#4be585", "CODE", "window entropy under 6 bits/byte");
      add("#f7d56a", "MIXED", "6 – 7.2 bits/byte");
      add("#ff5470", "PACKED", "over 7.2 bits/byte — compressed, encrypted or random");
    }
    const foot = document.createElement("p");
    foot.className = "cf4-disclose";
    foot.textContent = field?.plate === "shelf"
      ? "Nothing was fetched to draw this: heights come from the CDX record lengths pinned in js/krome-catalog.js. Unrecovered files stand in the last lane at zero height, because there are no bytes to draw."
      : "Heights are the fraction of set bits per 8-bit plane across fixed windows of the file — a bit-plane relief, not a terrain. No byte was executed to produce it.";
    host.append(foot);
  }

  /* ------------------------------------------------------------ timeline */

  function timeMax() {
    return field?.plate === "shelf" ? field.years.max : 1;
  }

  function syncTimeControl() {
    const range = $id("cf4Time");
    const label = $id("cf4TimeLabel");
    const caption = $id("cf4TimeCaption");
    if (!range || !field) return;
    if (field?.plate === "shelf") {
      range.min = String(field.years.min);
      range.max = String(field.years.max);
      range.step = String((field.years.max - field.years.min) / 240 || 0.01);
      if (view.asOf == null || view.asOf < field.years.min) view.asOf = field.years.max;
      range.value = String(view.asOf);
      range.disabled = false;
      if (label) label.textContent = `as of ${cf4FmtYear(view.asOf)}`;
      if (caption) caption.textContent = "4th axis: capture date. Columns rise as their capture arrives.";
    } else {
      range.min = "0";
      range.max = "1";
      range.step = "0.002";
      range.value = String(view.sweep);
      range.disabled = false;
      const rows = field?.rows || [];
      const r = rows[Math.round(view.sweep * Math.max(0, rows.length - 1))] || null;
      if (label) label.textContent = r ? `sweep 0x${(r.off).toString(16)}` : "sweep —";
      if (caption) caption.textContent = "4th axis: file offset. The scan plane walks the windows; nothing here is a calendar.";
    }
  }

  const visibleColumns = () => (field?.plate === "shelf" ? columnsUpTo(field.columns, view.asOf, field.years.max) : []);

  /* ---------------------------------------------------------- projection */

  function project(x, y, z) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const X0 = x * cy - z * sy;
    const Z0 = x * sy + z * cy;
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const Y1 = y * cp - Z0 * sp;
    const Z1 = y * sp + Z0 * cp;
    const depth = cam.dist - Z1;
    const s = (cam.fov / Math.max(0.25, depth)) * (canvas.width / 3.4);
    return {
      x: canvas.width / 2 + X0 * s,
      y: canvas.height * 0.62 - Y1 * s,
      depth, s,
    };
  }

  /* ------------------------------------------------------------- raster */

  const faces = [];

  function pushPoly(pts, fill, depth, stroke = null) {
    faces.push({ pts, fill, depth, stroke });
  }

  function surfaceFaces() {
    const { nx, ny, elev, max } = field;
    const vis = new Set(visibleColumns().map((c) => c.bin));
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const h = (v) => ((v || 0) / (max || 1)) * CF4_WORLD.h;
        const c00 = elev[j * nx + i], c10 = elev[j * nx + i + 1];
        const c01 = elev[(j + 1) * nx + i], c11 = elev[(j + 1) * nx + i + 1];
        const fx = (i) => (i / (nx - 1) - 0.5) * CF4_WORLD.w;
        const fz = (j) => (j / (ny - 1 || 1) - 0.5) * CF4_WORLD.d;
        const a = project(fx(i), h(c00), fz(j));
        const b = project(fx(i + 1), h(c10), fz(j));
        const c = project(fx(i + 1), h(c11), fz(j + 1));
        const d = project(fx(i), h(c01), fz(j + 1));
        if ([a, b, c, d].some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) continue;
        let tint;
        if (field.plate === "shelf") {
          const lit = (c00 + c10 + c01 + c11) / 4;
          const shelfHue = ["#1b3a44", "#20323f", "#1a2c3a", "#2a2740", "#33283a"][j % 5];
          tint = shade(mix("#0a1219", shelfHue, clamp4(lit * 1.6, 0.1, 1)), 0.7 + 0.5 * lit);
        } else {
          const e = field.entropy?.[i] ?? 0;
          tint = shade(entropyColor(e), 0.42 + 0.5 * ((c00 + c10) / 2 / (max || 1)));
        }
        const alive = field.plate === "shelf" ? (vis.size ? vis.has(i) || vis.has(i + 1) : true) : sweepAlive(i, nx);
        if (view.mode === "wire") {
          pushPoly([a, b, c, d], "rgba(0,0,0,0)", (a.depth + c.depth) / 2, alive ? "rgba(118,226,223,0.5)" : "rgba(118,226,223,0.14)");
        } else if (view.mode === "xray") {
          pushPoly([a, b, c, d], alive ? hexA(tint, 0.3) : hexA(tint, 0.1), (a.depth + c.depth) / 2, "rgba(118,226,223,0.28)");
        } else {
          pushPoly([a, b, c, d], alive ? tint : hexA(tint, 0.25), (a.depth + c.depth) / 2);
        }
      }
    }
  }

  /** The sweep band lights the windows inside it; everything else recedes. */
  function sweepAlive(i, nx) {
    if (field.plate !== "bytes") return true;
    const at = view.sweep * (nx - 1);
    return Math.abs(i - at) <= 2.5;
  }

  function contourFaces() {
    if (view.mode !== "xray" || field.plate !== "bytes") return;
    const { nx, ny, elev, max } = field;
    const bands = 5;
    const fx = (i) => (i / (nx - 1) - 0.5) * CF4_WORLD.w;
    const fz = (j) => (j / (ny - 1 || 1) - 0.5) * CF4_WORLD.d;
    for (let b = 1; b < bands; b++) {
      const level = (max * b) / bands;
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const e00 = elev[j * nx + i], e10 = elev[j * nx + i + 1], e01 = elev[(j + 1) * nx + i];
          const L = (v) => ((v || 0) / (max || 1)) * CF4_WORLD.h;
          if ((e00 - level) * (e10 - level) < 0 || (e00 - level) * (e01 - level) < 0) {
            const p = project(fx(i), L(level), fz(j));
            const q = project(fx(i + 1), L(level), fz(j + 1));
            pushPoly([p, q, q], "rgba(0,0,0,0)", p.depth, "rgba(118,226,223,0.55)");
          }
        }
      }
    }
  }

  function columnFaces() {
    if (field.plate !== "shelf") return;
    const visible = visibleColumns();
    for (const c of visible) {
      const g = grow.get(c.id) ?? 1;
      // Columns keep their own 0–1 log axis (see field.units); the floor under
      // them is the busiest bin. Two scales, one ceiling, both in the legend.
      const hgt = Math.max(0.004, c.h * g) * CF4_WORLD.h * 1.15;
      const x = (c.fx - 0.5) * CF4_WORLD.w;
      const z = (c.fz - 0.5) * CF4_WORLD.d;
      const hw = (CF4_WORLD.w / field.nx) * 0.62;
      const hd = (CF4_WORLD.d / field.ny) * 0.42;
      const tier = TIER_OF[c.tier] || TIERS[1];
      const base = hexA(tier.color, c.captured ? 0.92 : 0.5);
      const corners = [
        project(x - hw, 0, z - hd), project(x + hw, 0, z - hd),
        project(x + hw, 0, z + hd), project(x - hw, 0, z + hd),
      ];
      const tops = corners.map((p, i) => {
        const q = [
          [x - hw, hgt, z - hd], [x + hw, hgt, z - hd],
          [x + hw, hgt, z + hd], [x - hw, hgt, z + hd],
        ][i];
        return project(q[0], q[1], q[2]);
      });
      if (view.mode === "wire") {
        pushPoly(tops, "rgba(0,0,0,0)", tops[0].depth, hexA(tier.color, 0.9));
        for (let i = 0; i < 4; i++) pushPoly([corners[i], tops[i]], "rgba(0,0,0,0)", tops[i].depth, hexA(tier.color, 0.35));
      } else {
        pushPoly(tops, shade(base, 1.18), tops[0].depth, null);
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          pushPoly([corners[i], corners[j], tops[j], tops[i]], shade(base, 0.62 + 0.13 * i), (corners[i].depth + tops[j].depth) / 2, null);
        }
      }
      if (!c.captured) {
        // A file the crawlers never got: a flat tile, so "no bytes" stays visible.
        pushPoly(corners, hexA(tier.color, 0.3), corners[0].depth, tier.color);
      }
      const head = project(x, hgt + 0.012, z);
      anchors.push({
        x: head.x, y: head.y, kind: "column", rec: c, color: tier.color,
        label: Boolean(c.tag || c.tier === "verified" || !c.captured),
      });
    }
  }

  function markerFaces() {
    const marks = field.plate === "bytes" ? field.markers || [] : [];
    const { nx, max, elev } = field;
    for (const m of marks) {
      const i = clamp4(Math.round(m.fx * (nx - 1)), 0, nx - 1);
      const y0 = ((elev[i] || 0) / (max || 1)) * CF4_WORLD.h;
      const x = (m.fx - 0.5) * CF4_WORLD.w;
      const z = -CF4_WORLD.d / 2;
      const tier = TIER_OF[m.tier] || TIERS[1];
      const foot = project(x, y0, z);
      const head = project(x, y0 + 0.09, z);
      pushPoly([foot, head], "rgba(0,0,0,0)", head.depth + 0.001, tier.color);
      anchors.push({ x: head.x, y: head.y, kind: "marker", rec: m, color: tier.color, label: true });
    }
  }

  function sweepFace() {
    if (field.plate !== "bytes" || !field.nx) return;
    const i = view.sweep * (field.nx - 1);
    const x = (i / (field.nx - 1) - 0.5) * CF4_WORLD.w;
    const top = ((field.max || 1) / (field.max || 1)) * CF4_WORLD.h * 1.6;
    const a = project(x, 0, -CF4_WORLD.d / 2);
    const b = project(x, 0, CF4_WORLD.d / 2);
    const c = project(x, top, CF4_WORLD.d / 2);
    const d = project(x, top, -CF4_WORLD.d / 2);
    pushPoly([a, b, c, d], "rgba(246,197,116,0.16)", Math.min(a.depth, b.depth) - 0.02, "rgba(246,197,116,0.75)");
    const row = field.rows?.[Math.round(i)];
    if (row) {
      const p = project(x, top, -CF4_WORLD.d / 2);
      anchors.push({ x: p.x, y: p.y, kind: "sweep", label: true, rec: { label: `0x${row.off.toString(16)}`, detail: `${row.entropy.toFixed(2)} bits/B · density ${row.density.toFixed(3)}`, addr: (artifact?.base ?? 0) + row.off }, color: "#f6c574" });
    }
  }

  /* ------------------------------------------------------------- colour */

  function hexA(color, alpha) {
    const c = normalize(color);
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  }
  function shade(color, k) {
    const c = normalize(color);
    return `rgb(${c.map((v) => clamp4(Math.round(v * k), 0, 255)).join(",")})`;
  }
  function mix(a, b, t) {
    const A = normalize(a), B = normalize(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
  }
  function normalize(color) {
    const s = String(color || "#000").trim();
    if (s.startsWith("#")) {
      const h = s.slice(1);
      const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
      return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
    }
    const m = s.match(/(\d+(?:\.\d+)?)/g);
    return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
  }

  /* --------------------------------------------------------------- frame */

  function frame(t = 0) {
    raf = 0;
    const dt = Math.min(120, t - lastT || 16);
    lastT = t;

    if (view.playing) stepTime(dt);
    if (view.spin && !view.reduced) cam.yaw += dt / 12000;
    animateGrow(dt);

    ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    const grd = ctx2d.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#0b1018");
    grd.addColorStop(1, "#070910");
    ctx2d.fillStyle = grd;
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);

    faces.length = 0;
    anchors = [];
    if (field) {
      surfaceFaces();
      contourFaces();
      columnFaces();
      markerFaces();
      sweepFace();
    }

    faces.sort((p, q) => q.depth - p.depth);
    ctx2d.lineJoin = "round";
    for (const f of faces) {
      if (f.pts.length < 2) {
        const p = f.pts[0];
        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, Math.max(1.2, p.s * 0.012), 0, Math.PI * 2);
        ctx2d.fillStyle = f.stroke || "#fff";
        ctx2d.fill();
        continue;
      }
      ctx2d.beginPath();
      ctx2d.moveTo(f.pts[0].x, f.pts[0].y);
      for (let i = 1; i < f.pts.length; i++) ctx2d.lineTo(f.pts[i].x, f.pts[i].y);
      ctx2d.closePath();
      if (f.fill !== "rgba(0,0,0,0)") { ctx2d.fillStyle = f.fill; ctx2d.fill(); }
      if (f.stroke) { ctx2d.strokeStyle = f.stroke; ctx2d.lineWidth = Math.max(1, dpr * 0.7); ctx2d.stroke(); }
      else if (view.mode === "relief" && f.pts.length === 4) {
        ctx2d.strokeStyle = "rgba(8,10,16,0.5)";
        ctx2d.lineWidth = 1;
        ctx2d.stroke();
      }
    }
    drawPips();
    updateLabels();

    fps.n += 1;
    if (t - fps.t0 > 500) {
      fps.value = Math.round((fps.n * 1000) / (t - fps.t0 || 1));
      fps.n = 0; fps.t0 = t;
      const el2 = $id("cf4Fps");
      if (el2) el2.textContent = `fps ${fps.value} · ${faces.length} faces`;
    }
    if (dirty) { dirty = false; schedule(); }
    else if (view.playing || view.spin || growing()) schedule();
  }

  const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const growing = () => {
    if (field?.plate !== "shelf") return false;
    for (const c of field.columns) { const g = grow.get(c.id) ?? 0; if (g < 1) return true; }
    return false;
  };

  function animateGrow(dt) {
    if (field?.plate !== "shelf") return;
    const visible = new Set(visibleColumns().map((c) => c.id));
    for (const c of field.columns) {
      const want = visible.has(c.id) ? 1 : 0;
      const cur = grow.get(c.id) ?? 0;
      if (cur === want) continue;
      const rate = view.reduced ? 1 : dt / 260;
      grow.set(c.id, want > cur ? Math.min(1, cur + rate) : Math.max(0, cur - rate * 1.6));
    }
  }

  /** Heads + halos for clickable anchors, drawn after the surface. */
  function drawPips() {
    for (const a of anchors) {
      const r = Math.max(2.2, canvas.width * (a.label ? 0.0034 : 0.002));
      if (a.label) {
        ctx2d.beginPath();
        ctx2d.arc(a.x, a.y, r * 1.9, 0, Math.PI * 2);
        ctx2d.strokeStyle = hexA(a.color || "#ffb020", 0.35);
        ctx2d.lineWidth = Math.max(1, dpr);
        ctx2d.stroke();
      }
      ctx2d.beginPath();
      ctx2d.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx2d.fillStyle = hexA(a.color || "#ffb020", a.label ? 1 : 0.5);
      ctx2d.fill();
    }
  }

  function updateLabels() {
    if (!labels) return;
    labels.textContent = "";
    if (!view.labelsOn) return;
    const picked = anchors.filter((a) => a.label).slice(0, 26);
    for (const a of picked) {
      const span = document.createElement("span");
      span.className = "cf4-lbl";
      span.style.transform = `translate(${(a.x / dpr).toFixed(1)}px, ${(a.y / dpr).toFixed(1)}px)`;
      span.textContent = a.rec?.label || a.rec?.name || "";
      labels.append(span);
    }
  }

  /* ---------------------------------------------------------- interaction */

  let drag = null;
  canvas.setAttribute("tabindex", "0");

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: 0 };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* capture unsupported */ }
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    cam.yaw = drag.yaw + dx / 180;
    cam.pitch = clamp4(drag.pitch + dy / 320, 0.08, 1.42);
    dirty = true; schedule();
  });
  const endDrag = (e) => {
    if (drag && drag.moved < 4) pick(e);
    drag = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => { drag = null; });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    cam.dist = clamp4(cam.dist + Math.sign(e.deltaY) * 0.09, 0.85, 4.2);
    dirty = true; schedule();
  }, { passive: false });
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.12 : 0.045;
    if (e.key === "ArrowLeft") cam.yaw -= step;
    else if (e.key === "ArrowRight") cam.yaw += step;
    else if (e.key === "ArrowUp") cam.pitch = clamp4(cam.pitch + step / 2, 0.08, 1.42);
    else if (e.key === "ArrowDown") cam.pitch = clamp4(cam.pitch - step / 2, 0.08, 1.42);
    else if (e.key === "+" || e.key === "=") cam.dist = clamp4(cam.dist - 0.12, 0.85, 4.2);
    else if (e.key === "-") cam.dist = clamp4(cam.dist + 0.12, 0.85, 4.2);
    else if (e.key === "Enter" || e.key === " ") { if (lastHover) openAnchor(lastHover); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    dirty = true; schedule();
  });
  let lastHover = null;
  canvas.addEventListener("pointermove", (e) => {
    const hit = hitTest(e);
    lastHover = hit;
    canvas.style.cursor = hit ? "pointer" : "grab";
  });

  function hitTest(e) {
    const r = canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) * (canvas.width / r.width);
    const py = (e.clientY - r.top) * (canvas.height / r.height);
    let best = null, bestD = (16 * dpr) ** 2;
    for (const a of anchors) {
      const d2 = (a.x - px) ** 2 + (a.y - py) ** 2;
      if (d2 < bestD) { bestD = d2; best = a; }
    }
    return best;
  }
  const pick = (e) => { const a = hitTest(e); if (a) openAnchor(a); };

  function openAnchor(a) {
    if (a.kind === "marker") {
      wm?.spawn(a.rec.id);
      return;
    }
    if (a.kind === "sweep") {
      if (typeof a.rec.addr === "number") cfg.inspectAddress?.(a.rec.addr);
      return;
    }
    wm?.spawn(a.rec.id);
  }

  /* ----------------------------------------------------------- pip windows */

  function pipRecords() {
    const map = new Map();
    if (field?.plate === "shelf") {
      for (const c of field.columns) map.set(c.id, c);
    }
    for (const m of field?.markers || []) map.set(m.id, m);
    return map;
  }

  function initWm() {
    if (wm || !$id("cf4PipLayer")) return;
    wm = initPipWm({
      layer: $id("cf4PipLayer"),
      desk: $id("cf4Desk"),
      tray: $id("cf4Tray"),
      status: null,
      announce: (m) => announce(m),
      isPhone: () => matchMedia("(max-width: 900px)").matches,
      findRecord: (id) => pipRecords().get(id),
      titleFor: (r) => esc4(r.label || r.name || r.id),
      chipFor: (r) => ({ top: (r.label || r.name || "PIP").slice(0, 14), sub: r.kind || r.tier || "rec" }),
      ariaKindFor: (r) => (r.ts ? "capture record" : "code marker"),
      detailHtml: (r) => {
        const rows = [];
        if (r.name) rows.push(["file", esc4(r.name)]);
        if (r.ts) rows.push(["capture", `${esc4(r.ts)} (${cf4FmtYear(r.year)})`]);
        if (r.bytes != null && r.kind !== "x") rows.push(["record length", `${r.bytes.toLocaleString()} B`]);
        if (r.name) rows.push(["lane", esc4(SHELF_LANES[Number.isInteger(r.lane) ? r.lane : laneFor(r)]?.label || r.kind || "—")]);
        if (r.off != null && r.kind !== "x") rows.push(["offset", `0x${(r.off >>> 0).toString(16)}`]);
        if (r.detail) rows.push(["recovered", esc4(r.detail)]);
        if (r.desc) rows.push(["catalogue", esc4(r.desc)]);
        if (r.curated) rows.push(["note", esc4(r.curated)]);
        const tier = TIER_OF[r.tier] || TIERS[1];
        const dl = `<dl class="cf4-pip-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
        const acts = [];
        if (r.entry) {
          acts.push(`<a class="cf4-pip-a" href="${esc4(waybackUrl(r.name, r.ts))}" target="_blank" rel="noreferrer">raw memento ↗</a>`);
          acts.push(`<a class="cf4-pip-a" href="${esc4(waybackView(r.name, r.ts))}" target="_blank" rel="noreferrer">as rendered ↗</a>`);
          if (r.tier === "indexed") acts.push(`<button type="button" class="mini" data-cf4="recover">RECOVER + SHA-1 GATE</button>`);
          else acts.push(`<button type="button" class="mini" data-cf4="open">OPEN IN LAB</button>`);
        } else if (typeof r.addr === "number") {
          acts.push(`<button type="button" class="mini" data-cf4="addr">GO TO ${esc4(hex(r.addr))}</button>`);
        } else {
          acts.push(`<span class="cf4-pip-none">no bytes to open — this row is a note about an absence</span>`);
        }
        return `<p class="cf4-pip-tier" style="color:${tier.color}">${esc4(tier.label)} · ${esc4(tier.note)}</p>${dl}<div class="cf4-pip-acts">${acts.join("")}</div>`;
      },
      bindBody: (root, r) => {
        root.querySelector('[data-cf4="recover"]')?.addEventListener("click", () => {
          cfg.recover?.(r.entry);
          announce(`recovering ${r.name} — the lab's SHA-1 gate decides`, "ok");
        });
        root.querySelector('[data-cf4="open"]')?.addEventListener("click", () => {
          if (cfg.openRecovered?.(r.name)) announce(`opened ${r.name} from verified bytes`, "ok");
          else announce(`${r.name} is not in the recovered set this session`, "warn");
        });
        root.querySelector('[data-cf4="addr"]')?.addEventListener("click", () => {
          if (typeof r.addr === "number") { cfg.inspectAddress?.(r.addr); announce(`address ${hex(r.addr)} sent to the decompiler`, "ok"); }
        });
      },
    });
  }

  /* --------------------------------------------------------------- steps */

  function stepTime(dt) {
    if (field?.plate === "shelf") {
      const span = field.years.max - field.years.min;
      const next = (view.asOf ?? field.years.max) + (span / 60) * (dt / 16.7);
      if (next >= field.years.max) { view.asOf = field.years.min; announce("timeline wrapped to the earliest capture"); }
      else view.asOf = next;
    } else {
      view.sweep += 0.0035 * (dt / 16.7);
      if (view.sweep > 1) view.sweep = 0;
    }
    syncTimeControl();
    dirty = true;
  }

  /* ------------------------------------------------------------ controls */

  function wireControls() {
    for (const b of document.querySelectorAll("[data-cf4-plate]")) {
      b.addEventListener("click", () => {
        if (b.dataset.cf4Plate === "bytes" && !artifact?.bytes?.length) {
          announce("no artifact on the table yet — recover a file or use DEMO.EXE, then the BYTES plate has something to draw", "warn");
          return;
        }
        view.plate = b.dataset.cf4Plate;
        for (const o of document.querySelectorAll("[data-cf4-plate]")) {
          o.classList.toggle("on", o === b);
          o.setAttribute("aria-pressed", String(o === b));
        }
        view.asOf = null;
        rebuild();
        syncTimeControl();
        announce(`plate ${view.plate.toUpperCase()} · drag to orbit, wheel to zoom, click a pip for the record`);
      });
    }
    for (const b of document.querySelectorAll("[data-cf4-mode]")) {
      b.addEventListener("click", () => {
        view.mode = b.dataset.cf4Mode;
        for (const o of document.querySelectorAll("[data-cf4-mode]")) {
          o.classList.toggle("on", o === b);
          o.setAttribute("aria-pressed", String(o === b));
        }
        dirty = true; schedule();
        announce(`${view.mode.toUpperCase()} · ${field.nx}×${field.ny} grid`);
      });
    }
    $id("cf4Labels")?.addEventListener("click", (e) => {
      view.labelsOn = !view.labelsOn;
      e.currentTarget.classList.toggle("on", view.labelsOn);
      e.currentTarget.setAttribute("aria-pressed", String(view.labelsOn));
      dirty = true; schedule();
    });
    $id("cf4Spin")?.addEventListener("click", (e) => {
      view.spin = !view.spin;
      e.currentTarget.classList.toggle("on", view.spin);
      e.currentTarget.setAttribute("aria-pressed", String(view.spin));
      if (view.spin) schedule();
    });
    $id("cf4Reset")?.addEventListener("click", () => {
      Object.assign(cam, EMPTY_CAM);
      dirty = true; schedule();
      announce("view reset");
    });
    $id("cf4Vrml")?.addEventListener("click", () => {
      const name = field.plate === "bytes" ? `${(artifact?.name || "artifact").replace(/[^\w.-]+/g, "_")}-bitplanes` : "krome-captures";
      const text = fieldToVrml(field, {
        title: `CASEFILES 4DWM · ${name}`,
        provenance: field.plate === "bytes"
          ? `${artifact?.name} · ${artifact?.provenance || "no provenance string"}`
          : `wayback CDX rows pinned in js/krome-catalog.js · ${field.columns.length} captures`,
      });
      downloadText(`${name}-4dwm.wrl`, text);
      announce(`VRML 2.0 written: ${name}-4dwm.wrl (${(text.length / 1024).toFixed(0)} KB) — open it in any VRML97 viewer`, "ok");
    });
    $id("cf4PipAll")?.addEventListener("click", () => {
      const ids = (field.plate === "shelf" ? visibleColumns() : field.markers || [])
        .filter((c) => c.tier === "verified" || c.kind === "entry")
        .map((c) => c.id);
      const fallback = (field.plate === "shelf" ? visibleColumns() : field.markers || []).slice(0, 8).map((c) => c.id);
      wm?.spawnAll(ids.length ? ids : fallback, 8);
      deskStatus();
    });
    const range = $id("cf4Time");
    range?.addEventListener("input", () => {
      const v = Number(range.value);
      if (field?.plate === "shelf") view.asOf = v; else view.sweep = clamp4(v, 0, 1);
      syncTimeControl();
      dirty = true; schedule();
    });
    $id("cf4AllTime")?.addEventListener("click", () => {
      if (field?.plate === "shelf") view.asOf = field.years.max;
      else view.sweep = 1;
      syncTimeControl();
      dirty = true; schedule();
      announce(field?.plate === "shelf" ? "all time — every capture in the pinned index" : "sweep at end of file");
    });
    $id("cf4Play")?.addEventListener("click", (e) => {
      view.playing = !view.playing;
      e.currentTarget.classList.toggle("on", view.playing);
      e.currentTarget.textContent = view.playing ? "PAUSE" : "PLAY";
      e.currentTarget.setAttribute("aria-pressed", String(view.playing));
      if (view.playing) announce(view.reduced ? "reduced motion is on — stepping the 4th axis without easing" : "walking the 4th axis");
      if (view.playing) schedule();
    });
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(() => resize());
      observer.observe(canvas.parentElement);
    } else {
      addEventListener("resize", resize);
    }
  }

  /* ------------------------------------------------------------ lifecycle */

  resize();
  rebuild();
  syncTimeControl();
  wireControls();
  initWm();
  schedule();

  return {
    /** The lab loaded a new artifact into state.artifact. */
    setArtifact(next) {
      artifact = next;
      if (view.plate === "bytes" || (next && !field?.columns)) { rebuild(); syncTimeControl(); }
      else drawStatLine();
    },
    /** The lab's recovered set changed: a capture passed or failed the gate. */
    verificationChanged(names) {
      verifiedNames = names instanceof Set ? names : new Set(names || []);
      rebuild();
    },
    /** The lab switched case: the SHELF plate follows its corpus. */
    setCase(id) {
      if (artifact?.bytes?.length) view.plate = "bytes";
      else if (!corpusFor(id, {})) return rebuild();
      else view.plate = "shelf";
      for (const o of document.querySelectorAll("[data-cf4-plate]")) {
        const on = o.dataset.cf4Plate === view.plate;
        o.classList.toggle("on", on);
        o.setAttribute("aria-pressed", String(on));
      }
      view.asOf = null;
      rebuild();
      syncTimeControl();
    },
    /** Called when the tab is shown — cheap, and it keeps the canvas sized. */
    show() {
      resize();
      if (view.plate === "bytes" && !artifact?.bytes?.length) {
        view.plate = "shelf";
        for (const o of document.querySelectorAll("[data-cf4-plate]")) o.classList.toggle("on", o.dataset.cf4Plate === "shelf");
        rebuild();
        syncTimeControl();
        announce("no artifact yet — showing the capture corpus; load a file for the BYTES plate", "warn");
      }
      dirty = true;
      schedule();
    },
    refresh() { rebuild(); syncTimeControl(); schedule(); },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      view.playing = false;
      observer?.disconnect();
      observer = null;
    },
  };
}
