/**
 * Duke Nukem 3D (Build engine) total conversion writer.
 *
 * Duke3D has no WAD — its container is a GRP ("KenSilverman" archive) holding
 * a Build MAP v7, ART tile sheets, a DEF for hi-res textures and a CON.  This
 * module emits exactly that:
 *
 *   E1L1.MAP        Build map v7 — sectors with holes, red/white walls, doors
 *   TILES016.ART    ART v1, tiles 4096.., procedural 8-bit campus tiles
 *   GHSCHOOL.DEF    eDuke32 hi-res tile definitions (true-colour PNGs)
 *   GHSCHOOL.CON    volume / level names
 *   GHSCHOOL.TXT    build notes
 *   TILES/*.PNG     the hi-res textures referenced by the DEF
 *   → all packed into GHSCHOOL.GRP
 *
 * Scale: 1 m = 1024 map units horizontally, 1 m = 4096 z-units vertically
 * (Build rooms read taller than they are wide; 12 puds of clearance keeps the
 * Duke collision box able to stand up inside every interior).
 *
 * Pure module: no DOM.
 */

import { decompose, partition } from "./ghs-slab.js";
import { campusRegions } from "./ghs-doom.js";
import { ByteWriter } from "./ghs-doom.js";
import { pngEncodeRGB } from "./binfmt.js";
import { WALLTEX } from "./ghs-model.js";

export const BUILD_U_PER_M = 1024;
export const BUILD_Z_PER_M = 4096;
export const TILE_BASE = 4096;
export const MIN_ROOM_Z = 12 * 1024; // 12 puds — Duke needs 11 to stand

/* ------------------------------------------------------------------ *
 * Procedural tile art (RGB byte arrays, 64×64 unless noted)
 * ------------------------------------------------------------------ */

function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a ^ (a >>> 15);
    t = Math.imul(t, 0x2c1b3c6d);
    t ^= t >>> 12;
    return (t >>> 0) / 4294967296;
  };
}

function noiseFill(w, h, base, spread, seed) {
  const r = rnd(seed);
  const px = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const n = (r() - 0.5) * spread;
    px[i * 4] = Math.max(0, Math.min(255, base[0] + n));
    px[i * 4 + 1] = Math.max(0, Math.min(255, base[1] + n));
    px[i * 4 + 2] = Math.max(0, Math.min(255, base[2] + n));
    px[i * 4 + 3] = 255;
  }
  return { w, h, px };
}

function setPx(img, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  img.px[i] = rgb[0];
  img.px[i + 1] = rgb[1];
  img.px[i + 2] = rgb[2];
  img.px[i + 3] = a;
}

function rect(img, x0, y0, x1, y1, rgb) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setPx(img, x, y, rgb);
}

function brickTile(seed) {
  const img = noiseFill(64, 64, [150, 92, 74], 26, seed);
  const mortar = [196, 188, 176];
  for (let row = 0; row < 8; row++) {
    const y = row * 8;
    rect(img, 0, y + 7, 63, y + 7, mortar);
    const off = row % 2 ? 8 : 0;
    for (let x = off; x < 64; x += 16) rect(img, x, y, x, y + 6, mortar);
  }
  return img;
}

function stuccoTile(seed) {
  const img = noiseFill(64, 64, [214, 198, 164], 22, seed);
  rect(img, 0, 0, 63, 1, [186, 170, 140]);
  rect(img, 0, 62, 63, 63, [186, 170, 140]);
  return img;
}

function concreteTile(seed) {
  const img = noiseFill(64, 64, [176, 178, 180], 18, seed);
  rect(img, 0, 31, 63, 32, [140, 142, 146]);
  rect(img, 31, 0, 32, 63, [140, 142, 146]);
  return img;
}

function glassTile() {
  const img = noiseFill(64, 64, [112, 148, 176], 12, 99);
  rect(img, 0, 0, 63, 1, [70, 88, 104]);
  rect(img, 0, 62, 63, 63, [70, 88, 104]);
  rect(img, 31, 0, 32, 63, [70, 88, 104]);
  for (let y = 4; y < 60; y += 6) rect(img, 2, y, 28, y, [148, 182, 206]);
  return img;
}

function metalTile(seed) {
  const img = noiseFill(64, 64, [150, 156, 162], 10, seed);
  for (let x = 0; x < 64; x += 8) rect(img, x, 0, x + 1, 63, [110, 116, 122]);
  rect(img, 0, 0, 63, 2, [96, 102, 108]);
  rect(img, 0, 61, 63, 63, [96, 102, 108]);
  return img;
}

function stoneTile(seed) {
  const img = noiseFill(64, 64, [148, 140, 128], 20, seed);
  for (let row = 0; row < 4; row++) {
    const y = row * 16;
    rect(img, 0, y + 15, 63, y + 15, [110, 104, 96]);
    const off = row % 2 ? 16 : 0;
    for (let x = off; x < 64; x += 32) rect(img, x, y, x + 1, y + 14, [110, 104, 96]);
  }
  return img;
}

function doorTile() {
  const img = noiseFill(64, 64, [122, 86, 54], 14, 7);
  rect(img, 0, 0, 63, 3, [86, 60, 38]);
  rect(img, 0, 60, 63, 63, [86, 60, 38]);
  rect(img, 6, 8, 28, 30, [150, 110, 72]);
  rect(img, 36, 8, 58, 30, [150, 110, 72]);
  rect(img, 6, 36, 58, 56, [138, 100, 64]);
  rect(img, 52, 34, 56, 38, [226, 214, 150]);
  return img;
}

function fenceTile() {
  const img = noiseFill(64, 64, [96, 104, 96], 10, 21);
  for (let i = -64; i < 64; i += 8) {
    for (let k = 0; k < 64; k++) {
      setPx(img, i + k, k, [188, 196, 188]);
      setPx(img, i + k, 63 - k, [188, 196, 188]);
    }
  }
  rect(img, 0, 0, 63, 1, [70, 78, 70]);
  rect(img, 0, 62, 63, 63, [70, 78, 70]);
  return img;
}

function grassTile(seed) {
  const img = noiseFill(64, 64, [86, 132, 62], 34, seed);
  const r = rnd(seed + 5);
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(r() * 64);
    const y = Math.floor(r() * 64);
    setPx(img, x, y, [70 + r() * 40, 150 + r() * 40, 60 + r() * 30]);
  }
  return img;
}

function asphaltTile(seed) {
  const img = noiseFill(64, 64, [74, 74, 78], 22, seed);
  const r = rnd(seed + 11);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(r() * 64);
    const y = Math.floor(r() * 64);
    setPx(img, x, y, [120, 120, 124]);
  }
  return img;
}

function courtTile() {
  const img = noiseFill(64, 64, [70, 108, 96], 14, 33);
  rect(img, 0, 0, 63, 1, [228, 228, 220]);
  rect(img, 0, 62, 63, 63, [228, 228, 220]);
  rect(img, 0, 0, 1, 63, [228, 228, 220]);
  rect(img, 62, 0, 63, 63, [228, 228, 220]);
  return img;
}

function trackTile(seed) {
  const img = noiseFill(64, 64, [164, 92, 66], 20, seed);
  for (let x = 0; x < 64; x += 16) rect(img, x, 0, x, 63, [212, 208, 200]);
  return img;
}

function floorTile(seed) {
  const img = noiseFill(64, 64, [196, 184, 158], 14, seed);
  rect(img, 0, 0, 63, 0, [158, 146, 122]);
  rect(img, 0, 0, 0, 63, [158, 146, 122]);
  rect(img, 32, 0, 32, 63, [170, 158, 134]);
  rect(img, 0, 32, 63, 32, [170, 158, 134]);
  return img;
}

function ceilingTile(seed) {
  const img = noiseFill(64, 64, [212, 212, 208], 8, seed);
  rect(img, 0, 0, 63, 1, [172, 172, 168]);
  rect(img, 0, 62, 63, 63, [172, 172, 168]);
  rect(img, 0, 0, 1, 63, [172, 172, 168]);
  rect(img, 62, 0, 63, 63, [172, 172, 168]);
  rect(img, 24, 24, 40, 40, [236, 236, 214]);
  return img;
}

function skyTile() {
  const img = { w: 64, h: 64, px: new Uint8Array(64 * 64 * 4) };
  for (let y = 0; y < 64; y++) {
    const t = y / 63;
    const rgb = [Math.round(120 - 60 * t), Math.round(170 - 70 * t), Math.round(226 - 40 * t)];
    rect(img, 0, y, 63, y, rgb);
  }
  const r = rnd(4);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(r() * 64);
    const y = Math.floor(r() * 32);
    setPx(img, x, y, [246, 248, 252]);
  }
  return img;
}

function treeSprite() {
  const img = { w: 64, h: 64, px: new Uint8Array(64 * 64 * 4) };
  for (let i = 0; i < img.px.length; i += 4) img.px[i + 3] = 0; // alpha 0
  const r = rnd(77);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const dx = x - 32;
      const dy = (y - 26) * 1.15;
      if (dx * dx + dy * dy < 26 * 26) {
        const n = r() * 40 - 20;
        setPx(img, x, y, [Math.max(0, 54 + n), Math.max(0, 116 + n), Math.max(0, 48 + n)], 0);
      }
    }
  }
  rect(img, 30, 46, 34, 63, [92, 66, 40]);
  // Build treats palette index 255 as transparent; alpha is carried by the PNG
  for (let i = 0; i < img.px.length; i += 4) if (img.px[i + 3] === 0) img.px[i] = img.px[i + 1] = img.px[i + 2] = 0;
  return img;
}

function lampSprite() {
  const img = { w: 32, h: 64, px: new Uint8Array(32 * 64 * 4) };
  for (let i = 0; i < img.px.length; i += 4) img.px[i + 3] = 0;
  rect(img, 14, 20, 18, 63, [70, 74, 80]);
  for (let y = 4; y < 20; y++) {
    for (let x = 8; x < 24; x++) {
      const d = Math.hypot(x - 16, y - 12);
      if (d < 8) setPx(img, x, y, [255, 244, 190], 0);
    }
  }
  return img;
}

export const TILE_DEFS = [
  { key: "brick", name: "GHS_BRICK", gen: () => brickTile(3), kind: WALLTEX.admin },
  { key: "stucco", name: "GHS_STUCCO", gen: () => stuccoTile(5), kind: WALLTEX.classroom },
  { key: "concrete", name: "GHS_CONCRETE", gen: () => concreteTile(9), kind: WALLTEX.gym },
  { key: "stone", name: "GHS_STONE", gen: () => stoneTile(13), kind: WALLTEX.hall },
  { key: "annex", name: "GHS_ANNEX", gen: () => concreteTile(17), kind: WALLTEX.annex },
  { key: "metal", name: "GHS_METAL", gen: () => metalTile(19), kind: WALLTEX.portable },
  { key: "canopy", name: "GHS_CANOPY", gen: () => metalTile(23), kind: WALLTEX.canopy },
  { key: "riser", name: "GHS_RISER", gen: () => stoneTile(29), kind: WALLTEX.amphitheater },
  { key: "servery", name: "GHS_SERVERY", gen: () => stuccoTile(31), kind: WALLTEX.cafeteria },
  { key: "fence", name: "GHS_FENCE", gen: () => fenceTile(), kind: WALLTEX.fence },
  { key: "door", name: "GHS_DOOR", gen: () => doorTile(), kind: WALLTEX.door },
  { key: "glass", name: "GHS_GLASS", gen: () => glassTile(), kind: WALLTEX.glass },
  { key: "grass", name: "GHS_GRASS", gen: () => grassTile(41), floor: "yard" },
  { key: "field", name: "GHS_FIELD", gen: () => grassTile(43), floor: "field" },
  { key: "court", name: "GHS_COURT", gen: () => courtTile(), floor: "court" },
  { key: "track", name: "GHS_TRACK", gen: () => trackTile(47), floor: "track" },
  { key: "asphalt", name: "GHS_ASPHALT", gen: () => asphaltTile(53), floor: "parking" },
  { key: "road", name: "GHS_ROAD", gen: () => asphaltTile(59), floor: "road" },
  { key: "walk", name: "GHS_WALK", gen: () => floorTile(61), floor: "path" },
  { key: "plaza", name: "GHS_PLAZA", gen: () => floorTile(67), floor: "plaza" },
  { key: "interior", name: "GHS_FLOOR", gen: () => floorTile(71), floor: "interior" },
  { key: "ceiling", name: "GHS_CEILING", gen: () => ceilingTile(73), ceiling: "interior" },
  { key: "sky", name: "GHS_SKY", gen: () => skyTile(), ceiling: "sky" },
  { key: "tree", name: "GHS_TREE", gen: () => treeSprite(), sprite: "tree" },
  { key: "lamp", name: "GHS_LAMP", gen: () => lampSprite(), sprite: "lamp" },
];

/** Build a 256-entry palette and quantise tile RGB into it. */
export function makePalette() {
  const pal = new Uint8Array(256 * 3);
  const set = (i, r, g, b) => {
    pal[i * 3] = r;
    pal[i * 3 + 1] = g;
    pal[i * 3 + 2] = b;
  };
  let i = 0;
  for (let k = 0; k < 32; k++) set(i++, Math.round((k / 31) * 255), Math.round((k / 31) * 255), Math.round((k / 31) * 255));
  const ramp = (n, from, to) => {
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1);
      set(
        i++,
        Math.round(from[0] + (to[0] - from[0]) * t),
        Math.round(from[1] + (to[1] - from[1]) * t),
        Math.round(from[2] + (to[2] - from[2]) * t),
      );
    }
  };
  ramp(32, [62, 40, 28], [238, 214, 176]); // browns / stucco
  ramp(32, [22, 48, 18], [158, 214, 128]); // greens
  ramp(32, [16, 34, 62], [168, 210, 246]); // blues
  ramp(32, [62, 22, 18], [244, 150, 110]); // reds
  ramp(32, [58, 56, 22], [238, 232, 150]); // yellows
  ramp(32, [40, 48, 54], [206, 214, 220]); // cool greys
  ramp(30, [54, 40, 22], [252, 244, 196]); // warm light
  set(255, 255, 0, 255); // Build transparent marker
  return pal;
}

export function quantize(rgb, pal) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < 255; i++) {
    const dr = rgb[0] - pal[i * 3];
    const dg = rgb[1] - pal[i * 3 + 1];
    const db = rgb[2] - pal[i * 3 + 2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** ART v1 sheet for tiles TILE_BASE..TILE_BASE+n-1. */
export function buildArt(tiles) {
  const w = new ByteWriter();
  w.i32(1); // version
  w.i32(tiles.length);
  w.i32(TILE_BASE);
  for (const t of tiles) w.i16(t.img.w).i16(t.img.h);
  for (const t of tiles) {
    const img = t.img;
    const px = new Uint8Array(img.w * img.h);
    for (let y = 0; y < img.h; y++) {
      for (let x = 0; x < img.w; x++) {
        const s = (y * img.w + x) * 4;
        px[y * img.w + x] = img.px[s + 3] === 0 ? 255 : t.indices[y * img.w + x];
      }
    }
    w.raw(px);
  }
  return w.bytes();
}

/** Ken Silverman GRP archive. */
export function buildGrp(entries) {
  const head = new ByteWriter();
  head.ascii("KenSilverman", 12).i32(entries.length);
  let offset = 12 + 4 + entries.length * 21; // 13-byte name + int32 offset + int32 size
  const dir = new ByteWriter();
  const body = new ByteWriter();
  for (const e of entries) {
    const data = typeof e.data === "string" ? new TextEncoder().encode(e.data) : e.data;
    dir.ascii(e.name.toUpperCase().slice(0, 12), 13).i32(offset).i32(data.length);
    body.raw(data);
    offset += data.length;
  }
  const out = new ByteWriter();
  out.raw(head.bytes()).raw(dir.bytes()).raw(body.bytes());
  return out.bytes();
}

/* ------------------------------------------------------------------ *
 * MAP v7
 * ------------------------------------------------------------------ */

const FLOOR_TILE = {
  yard: "grass",
  field: "field",
  court: "court",
  track: "track",
  parking: "asphalt",
  road: "road",
  path: "walk",
  plaza: "plaza",
  interior: "interior",
  block: "plaza",
  doorway: "walk",
};

function tileIndex(map, key) {
  const t = map.get(key);
  if (t === undefined) throw new Error(`unknown tile ${key}`);
  return t;
}

/**
 * @param {object} model
 * @param {object} opts { walkable, roads }
 */
export function buildDukeMap(model, opts = {}) {
  const { regions } = campusRegions(model, opts);
  const regionById = new Map(regions.map((r) => [r.id, r]));
  const slabs = decompose(model.campus, regions, { minSlab: 0.05 });
  const part = partition(slabs);

  const labelOf = (slab) => {
    if (!slab.region) return "yard";
    const r = regionById.get(slab.region);
    if (r.kind === "block" || r.kind === "interior") return `${r.kind}:${r.id}`;
    if (r.kind === "doorway") return `doorway:${r.data.building.id}`;
    return `${r.kind}:${r.id}`;
  };

  const tiles = TILE_DEFS.map((d, i) => ({ ...d, index: TILE_BASE + i }));
  const tileByKey = new Map(tiles.map((t) => [t.key, t.index]));

  const sectors = [];
  const walls = [];
  const sectorOfSlab = new Int32Array(part.slabs.length).fill(-1);

  const z = (m) => Math.round(m * BUILD_Z_PER_M);
  const mu = (m) => Math.round(m * BUILD_U_PER_M);

  /**
   * One sector per slab.  A slab is a simple quad, so its wall loop closes by
   * construction.  Merging the slabs of a region into a single sector instead
   * would need a chain walk over a graph that touches itself wherever three
   * regions meet at a point, and that walk silently drops walls — Build will
   * not run a map with an open loop, and neither will the player survive it.
   */
  const slabWalls = part.slabs.map(() => []);
  for (let ei = 0; ei < part.edges.length; ei++) {
    const e = part.edges[ei];
    // `left` walks a→b and `right` walks b→a, so the slab always stays on the
    // right-hand side of travel, which is the wall order Build expects.  An
    // edge claimed by the same slab twice bounds nothing and would only
    // produce a wall paired with itself.
    if (e.left === e.right) continue;
    if (e.left >= 0) slabWalls[e.left].push({ edge: ei, from: e.a, to: e.b });
    if (e.right >= 0) slabWalls[e.right].push({ edge: ei, from: e.b, to: e.a });
  }

  /** Walk the four sides of a slab quad, laying its split edges end to end. */
  const orderLoop = (slab, list) => {
    const corners = [
      [slab.x0, slab.yl0],
      [slab.x0, slab.yh0],
      [slab.x1, slab.yh1],
      [slab.x1, slab.yl1],
    ];
    const out = [];
    const used = new Set();
    for (let i = 0; i < 4; i++) {
      const ax = corners[i][0];
      const ay = corners[i][1];
      const bx = corners[(i + 1) % 4][0];
      const by = corners[(i + 1) % 4][1];
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      if (len2 <= 0) continue;
      const len = Math.sqrt(len2);
      // The corners are raw floats while the vertices were snapped to the
      // 1/512 m grid, so a vertex can sit a hair outside the side's span.
      const ttol = 1 / 256 / len + 1e-9;
      const hits = [];
      for (let k = 0; k < list.length; k++) {
        if (used.has(k)) continue;
        const w = list[k];
        const on = [part.verts[w.from], part.verts[w.to]].every((v) => {
          const cross = Math.abs((v.x - ax) * dy - (v.y - ay) * dx) / len;
          const t = ((v.x - ax) * dx + (v.y - ay) * dy) / len2;
          return cross <= 1 / 256 && t >= -ttol && t <= 1 + ttol;
        });
        if (!on) continue;
        const p = part.verts[w.from];
        hits.push({ k, t: ((p.x - ax) * dx + (p.y - ay) * dy) / len2 });
      }
      hits.sort((m, n) => m.t - n.t);
      for (const h of hits) {
        used.add(h.k);
        out.push(list[h.k]);
      }
    }
    return out;
  };

  const wallAt = new Map(); // "slabIndex:edgeIndex" -> wall index
  let unmatchedEdges = 0;
  let degenerateSlabs = 0;

  for (const slab of part.slabs) {
    const list = slabWalls[slab.index];
    const loop = orderLoop(slab, list);
    unmatchedEdges += list.length - loop.length;
    if (loop.length < 3) {
      // A slab that collapsed to a line under the vertex grid cannot be a
      // sector.  Leave it out: its neighbours keep their walls, which become
      // white (blocking) where the sliver used to be.
      degenerateSlabs++;
      continue;
    }
    const region = slab.region ? regionById.get(slab.region) : null;
    const g = model.ground(slab.cx, slab.cy);
    const floorZ = -z(g);
    let ceilingZ = floorZ - 131072; // outdoor sky dome
    let ceilingStat = 1; // parallaxing sky
    let ceilingPic = tileIndex(tileByKey, "sky");
    const floorPic = tileIndex(tileByKey, FLOOR_TILE[slab.kind] || "grass");
    let floorStat = 0;
    if (slab.kind === "interior") {
      ceilingZ = floorZ - Math.max(z(region.data.building.h), MIN_ROOM_Z);
      ceilingStat = 0;
      ceilingPic = tileIndex(tileByKey, "ceiling");
    } else if (slab.kind === "doorway") {
      ceilingZ = floorZ - Math.max(z(Math.min(3.2, region.data.building.h)), MIN_ROOM_Z);
      ceilingStat = 0;
      ceilingPic = tileIndex(tileByKey, "ceiling");
    } else if (slab.kind === "block") {
      ceilingZ = floorZ;
      ceilingStat = 0;
    }
    const sec = {
      key: labelOf(slab),
      kind: slab.kind,
      wallptr: walls.length,
      wallnum: 0,
      ceilingZ,
      floorZ,
      ceilingStat,
      floorStat,
      ceilingPic,
      floorPic,
      ceilingshade: slab.kind === "yard" ? 0 : 8,
      floorshade: 0,
      visibility: 0,
      lotag: 0,
      hitag: 0,
      extra: -1,
      name: region ? region.data.building?.name || region.data.area?.name || labelOf(slab) : "CAMPUS GROUNDS",
      region,
    };
    sectorOfSlab[slab.index] = sectors.length;
    sectors.push(sec);
    const si = sectors.length - 1;

    for (const step of loop) {
      const e = part.edges[step.edge];
      const v = part.verts[step.from];
      const otherIndex = e.left === slab.index ? e.right : e.left;
      const otherSlab = otherIndex >= 0 ? part.slabs[otherIndex] : null;
      const otherKind = otherSlab ? otherSlab.kind : null;
      let picnum;
      if (slab.kind === "block" || slab.kind === "interior" || slab.kind === "doorway") {
        picnum = tileIndex(tileByKey, wallKeyFor(region));
      } else if (otherKind === "interior" || otherKind === "doorway" || otherKind === "block") {
        picnum = tileIndex(tileByKey, wallKeyFor(regionById.get(otherSlab.region)));
      } else {
        picnum = tileIndex(tileByKey, "fence");
      }
      let cstat = 0;
      if (!otherSlab) cstat |= 1 | 64; // white wall: blocks movement and shots
      else if (otherKind === "block") cstat |= 1 | 64; // solid footprint, no room inside
      walls.push({
        x: mu(v.x),
        y: -mu(v.y), // Build y grows south
        point2: -1,
        nextwall: -1,
        nextsector: -1,
        cstat,
        picnum,
        overpicnum: -1,
        shade: 0,
        pal: 0,
        xrepeat: 8,
        yrepeat: 32,
        xpanning: 0,
        ypanning: 0,
        lotag: 0,
        hitag: 0,
        extra: -1,
        from: step.from,
        to: step.to,
        edge: step.edge,
        sector: si,
      });
      wallAt.set(`${slab.index}:${step.edge}`, walls.length - 1);
    }
    for (let k = 0; k < loop.length; k++) {
      walls[sec.wallptr + k].point2 = sec.wallptr + ((k + 1) % loop.length);
    }
    sec.wallnum = loop.length;
  }

  // Red walls: the same elementary edge seen from both of its slabs.
  // Anything left unpaired afterwards is a white wall by definition, and a
  // white wall in Build has to stop the player and stop bullets.
  for (const slab of part.slabs) {
    for (const step of slabWalls[slab.index]) {
      const e = part.edges[step.edge];
      const otherIndex = e.left === slab.index ? e.right : e.left;
      if (otherIndex < 0) continue;
      const a = wallAt.get(`${slab.index}:${step.edge}`);
      const b = wallAt.get(`${otherIndex}:${step.edge}`);
      if (a === undefined || b === undefined) continue;
      walls[a].nextwall = b;
      walls[a].nextsector = walls[b].sector;
      walls[b].nextwall = a;
      walls[b].nextsector = walls[a].sector;
    }
  }
  for (const w of walls) {
    if (w.nextwall < 0) w.cstat |= 1 | 64;
  }

  // Sprites: trees + lamps along the service drive.
  const sprites = [];
  const sectorAt = (x, y) => {
    for (const s of part.slabs) {
      const lo = Math.min(s.yl0, s.yl1);
      const hi = Math.max(s.yh0, s.yh1);
      if (x >= s.x0 && x <= s.x1 && y >= lo && y <= hi) {
        const sec = sectors[sectorOfSlab[s.index]];
        if (!sec) continue;
        if (sec.kind === "block" || sec.kind === "interior") continue;
        return sec;
      }
    }
    return null;
  };
  const treeTile = tileIndex(tileByKey, "tree");
  const lampTile = tileIndex(tileByKey, "lamp");
  for (const t of model.trees) {
    const sec = sectorAt(t.x, t.y);
    if (!sec) continue;
    sprites.push({
      x: mu(t.x),
      y: -mu(t.y),
      z: sec.floorZ,
      cstat: 1,
      picnum: treeTile,
      shade: 0,
      pal: 0,
      clipdist: 32,
      xrepeat: 64,
      yrepeat: 128,
      xoffset: 0,
      yoffset: 0,
      sectnum: sec === sectors[0] ? 0 : sectors.indexOf(sec),
      statnum: 0,
      ang: 0,
      owner: 0,
      xvel: 0,
      yvel: 0,
      zvel: 0,
      lotag: 0,
      hitag: 0,
      extra: -1,
    });
  }
  for (const r of model.roads) {
    if (r.kind !== "road") continue;
    let acc = 0;
    for (let i = 0; i + 3 < r.line.length; i += 2) {
      const ax = r.line[i], ay = r.line[i + 1];
      const bx = r.line[i + 2], by = r.line[i + 3];
      acc += Math.hypot(bx - ax, by - ay);
      if (acc < 26) continue;
      acc = 0;
      const sec = sectorAt((ax + bx) / 2, (ay + by) / 2);
      if (!sec) continue;
      sprites.push({
        x: mu((ax + bx) / 2),
        y: -mu((ay + by) / 2),
        z: sec.floorZ,
        cstat: 0,
        picnum: lampTile,
        shade: -16,
        pal: 0,
        clipdist: 16,
        xrepeat: 40,
        yrepeat: 80,
        xoffset: 0,
        yoffset: 0,
        sectnum: sectors.indexOf(sec),
        statnum: 0,
        ang: 0,
        owner: 0,
        xvel: 0,
        yvel: 0,
        zvel: 0,
        lotag: 0,
        hitag: 0,
        extra: -1,
      });
    }
  }

  // Player start: the Foothill Boulevard service drive.
  const startSector = sectorAt(model.entry.x, model.entry.y) || sectors[0];
  const dx = -model.entry.x;
  const dy = model.entry.y; // Build y is south, map y is north
  let ang = Math.round((Math.atan2(-dy, dx) * 2048) / (2 * Math.PI));
  ang = ((ang % 2048) + 2048) % 2048;

  const map = serializeMap({
    posx: mu(model.entry.x),
    posy: -mu(model.entry.y),
    posz: startSector.floorZ,
    ang,
    cursectnum: sectors.indexOf(startSector),
    sectors,
    walls,
    sprites,
  });

  return { map, sectors, walls, sprites, tiles, tileByKey, startSector, unmatchedEdges, degenerateSlabs };
}

function wallKeyFor(region) {
  const kind = region?.data?.building?.kind || "classroom";
  switch (kind) {
    case "admin":
      return "brick";
    case "gym":
      return "concrete";
    case "hall":
      return "stone";
    case "annex":
      return "annex";
    case "portable":
    case "shed":
      return "metal";
    case "canopy":
      return "canopy";
    case "amphitheater":
      return "riser";
    case "cafeteria":
      return "servery";
    default:
      return "stucco";
  }
}

function serializeMap({ posx, posy, posz, ang, cursectnum, sectors, walls, sprites }) {
  const w = new ByteWriter();
  w.i32(7); // map version
  w.i32(posx).i32(posy).i32(posz);
  w.i16(ang).i16(cursectnum);
  w.u16(sectors.length);
  for (const s of sectors) {
    w.i16(s.wallptr).i16(s.wallnum);
    w.i32(s.ceilingZ).i32(s.floorZ);
    w.u16(s.ceilingStat).u16(s.floorStat);
    w.i16(s.ceilingPic).i16(0); // heinum
    w.u8(s.ceilingshade).u8(0).u8(0).u8(0);
    w.i16(s.floorPic).i16(0);
    w.u8(s.floorshade).u8(0).u8(0).u8(0);
    w.u8(s.visibility).u8(0);
    w.u16(s.lotag).u16(s.hitag).i16(s.extra);
  }
  w.u16(walls.length);
  for (const wl of walls) {
    w.i32(wl.x).i32(wl.y);
    w.i16(wl.point2).i16(wl.nextwall).i16(wl.nextsector);
    w.u16(wl.cstat);
    w.i16(wl.picnum).i16(wl.overpicnum);
    w.u8(wl.shade).u8(wl.pal).u8(wl.xrepeat).u8(wl.yrepeat).u8(wl.xpanning).u8(wl.ypanning);
    w.u16(wl.lotag).u16(wl.hitag).i16(wl.extra);
  }
  w.u16(sprites.length);
  for (const s of sprites) {
    w.i32(s.x).i32(s.y).i32(s.z);
    w.u16(s.cstat).i16(s.picnum);
    w.u8(s.shade).u8(s.pal).u8(s.clipdist).u8(0);
    w.u8(s.xrepeat).u8(s.yrepeat);
    w.u8(s.xoffset).u8(s.yoffset);
    w.i16(s.sectnum).i16(s.statnum).i16(s.ang).i16(s.owner);
    w.i16(s.xvel).i16(s.yvel).i16(s.zvel);
    w.u16(s.lotag).u16(s.hitag).i16(s.extra);
  }
  return w.bytes();
}

/* ------------------------------------------------------------------ *
 * Text assets
 * ------------------------------------------------------------------ */

export function buildDef(tiles) {
  const lines = [
    "// GHSCHOOL.DEF — Glendora High School total conversion, eDuke32 hi-res tiles",
    "// Generated by SITE-K ghs-build.js — geometry (c) OpenStreetMap contributors (ODbL)",
    "",
  ];
  tiles.forEach((t, i) => {
    lines.push(
      `tilefromtexture ${TILE_BASE + i} { file "GHSCHOOL/TILES/${t.name}.PNG" xoffset 0 yoffset 0 }`,
    );
  });
  return lines.join("\n") + "\n";
}

export function buildCon() {
  return [
    "// GHSCHOOL.CON — Glendora High School total conversion",
    "include GAME.CON",
    "",
    'volumename 0 "GLENDORA HIGH"',
    'levelname 0 0 "GHS CAMPUS"',
    'levelname 0 1 "GHS CAMPUS"',
    'levelname 0 2 "GHS CAMPUS"',
    'levelname 0 3 "GHS CAMPUS"',
    'levelname 0 4 "GHS CAMPUS"',
    'levelname 0 5 "GHS CAMPUS"',
    "",
    "// E1L1.MAP inside this GRP replaces the stock first level.",
    "",
  ].join("\n");
}

export function buildReadme(model, stats) {
  return [
    "GLENDORA HIGH SCHOOL — DUKE NUKEM 3D TOTAL CONVERSION",
    "=====================================================",
    "",
    `${model.site.name} · ${model.site.address}`,
    `Source geometry: ${model.site.source}`,
    `Campus extents: ${stats.widthM.toFixed(0)} m × ${stats.depthM.toFixed(0)} m`,
    `Buildings ${stats.buildings} · fields/courts ${stats.areas} · ways ${stats.roads} · trees ${stats.trees}`,
    "",
    "WHAT IS IN THE GRP",
    "  E1L1.MAP      Build engine map, format version 7 (Duke3D's native level format;",
    "                the Build engine has no WAD — the GRP is its container).",
    "  TILES016.ART  ART v1 tile sheet holding tiles 4096-4120 (procedural campus art).",
    "  GHSCHOOL.DEF  eDuke32 hi-res definitions pointing at GHSCHOOL/TILES/*.PNG.",
    "  GHSCHOOL.CON  Volume / level names (E1L1 loads automatically).",
    "  GHSCHOOL.TXT  This file.",
    "",
    "HOW TO PLAY",
    "  eDuke32:   eduke32 -g GHSCHOOL.GRP -x GHSCHOOL.CON -hires",
    "  Vanilla:   duke3d /g GHSCHOOL.GRP",
    "  The map is E1L1, so episode 1 level 1 is the campus.",
    "",
    "SCALE",
    `  1 m = ${BUILD_U_PER_M} map units horizontally, 1 m = ${BUILD_Z_PER_M} z-units vertically.`,
    `  Interior ceilings are at least ${MIN_ROOM_Z / 1024} puds so the Duke collision box stands up.`,
    "",
    "COLOUR NOTE",
    "  TILES016.ART stores 8-bit indices quantised against an approximation of the",
    "  stock Duke3D palette. Run eDuke32 with the bundled .DEF for the intended",
    "  true-colour textures.",
    "",
    "Generated by the SITE-K HTML5 exporter. Geometry (c) OpenStreetMap contributors, ODbL.",
    "",
  ].join("\n");
}

/** Full total-conversion bundle: every file plus the packed GRP. */
export function buildDukeBundle(model, opts = {}) {
  const palette = makePalette();
  const tiles = TILE_DEFS.map((d) => {
    const img = d.gen();
    const indices = new Uint8Array(img.w * img.h);
    for (let i = 0; i < indices.length; i++) {
      const s = i * 4;
      indices[i] = img.px[s + 3] === 0 ? 255 : quantize([img.px[s], img.px[s + 1], img.px[s + 2]], palette);
    }
    return { ...d, img, indices };
  });

  const { map, sectors, walls, sprites, unmatchedEdges, degenerateSlabs } = buildDukeMap(model, opts);
  const art = buildArt(tiles);
  const def = buildDef(tiles);
  const con = buildCon();
  const readme = buildReadme(model, model.stats);

  const pngs = tiles.map((t) => ({
    name: `GHSCHOOL/TILES/${t.name}.PNG`,
    data: pngEncodeRGB(t.img.w, t.img.h, t.img.px),
  }));

  const entries = [
    { name: "E1L1.MAP", data: map },
    { name: "TILES016.ART", data: art },
    { name: "GHSCHOOL.DEF", data: def },
    { name: "GHSCHOOL.CON", data: con },
    { name: "GHSCHOOL.TXT", data: readme },
    ...pngs,
  ];
  const grp = buildGrp(entries);

  return {
    grp,
    files: entries,
    map,
    art,
    def,
    con,
    readme,
    palette,
    tiles,
    stats: {
      sectors: sectors.length,
      walls: walls.length,
      sprites: sprites.length,
      tiles: tiles.length,
      mapBytes: map.length,
      grpBytes: grp.length,
      unmatchedEdges,
      degenerateSlabs,
    },
  };
}
