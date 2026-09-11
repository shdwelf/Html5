/**
 * DOOM WAD writer — Glendora High School as a playable DOOM level.
 *
 * Emits a PWAD with a full map lump set:
 *   E1M1 (marker) THINGS LINEDEFS SIDEDEFS VERTEXES SEGS SSECTORS NODES
 *   SECTORS REJECT BLOCKMAP
 * The node builder is a real recursive BSP (not a stub), so the level loads
 * in Chocolate DOOM / Crispy / GZDoom without running ZENNode or DEU.
 *
 * Geometry comes from the shared slab decomposition (js/ghs-slab.js), which
 * guarantees a watertight partition of the campus polygon.
 *
 * Pure module: no DOM. Returns Uint8Array.
 */

import { decompose, partition } from "./ghs-slab.js";
import { SURFACE, WALLTEX } from "./ghs-model.js";

export const DOOM_UNITS_PER_M = 32;
const SKY_CEIL = 1024;

/* ------------------------------------------------------------------ *
 * Little-endian byte writer
 * ------------------------------------------------------------------ */

export class ByteWriter {
  constructor() {
    this.chunks = [];
    this.length = 0;
  }
  _push(u8) {
    this.chunks.push(u8);
    this.length += u8.length;
  }
  u8(v) {
    this._push(Uint8Array.of(v & 0xff));
    return this;
  }
  i16(v) {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setInt16(0, v | 0, true);
    this._push(b);
    return this;
  }
  u16(v) {
    return this.i16(v);
  }
  i32(v) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setInt32(0, v | 0, true);
    this._push(b);
    return this;
  }
  raw(u8) {
    this._push(u8 instanceof Uint8Array ? u8 : new Uint8Array(u8));
    return this;
  }
  ascii(s, len) {
    const b = new Uint8Array(len);
    for (let i = 0; i < len && i < s.length; i++) b[i] = s.charCodeAt(i) & 0x7f;
    this._push(b);
    return this;
  }
  bytes() {
    const out = new Uint8Array(this.length);
    let o = 0;
    for (const c of this.chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }
}

/* ------------------------------------------------------------------ *
 * Region construction (shared shape with the Build exporter)
 * ------------------------------------------------------------------ */

export const KIND_INFO = {
  yard: { flat: "FLAT23", light: 208, ceil: SKY_CEIL, sky: true },
  field: { flat: "FLAT23", light: 208, ceil: SKY_CEIL, sky: true },
  court: { flat: "FLOOR4_8", light: 208, ceil: SKY_CEIL, sky: true },
  track: { flat: "FLAT20", light: 208, ceil: SKY_CEIL, sky: true },
  parking: { flat: "FLAT20", light: 200, ceil: SKY_CEIL, sky: true },
  road: { flat: "FLOOR7_1", light: 200, ceil: SKY_CEIL, sky: true },
  path: { flat: "FLOOR5_1", light: 200, ceil: SKY_CEIL, sky: true },
  block: { flat: "FLAT1", light: 144, ceil: null },
  interior: { flat: "FLOOR4_8", light: 176, ceil: null },
  doorway: { flat: "FLOOR5_1", light: 192, ceil: null },
};

/** Pick the buildings that get walkable interiors (the big ones). */
export function pickWalkable(model, count = 5) {
  return model.buildings
    .filter((b) => b.kind !== "canopy" && b.h >= 4)
    .sort((a, b) => b.area - a.area)
    .slice(0, count);
}

/** Build the door rectangles that punch through a building outline. */
export function doorsForBuilding(b, model, widthM = 3) {
  const ring = b.ring;
  const n = ring.length / 2;
  let best = null;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = ring[i * 2], ay = ring[i * 2 + 1];
    const bx = ring[j * 2], by = ring[j * 2 + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < widthM + 1) continue;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    // distance from the edge midpoint to the nearest road centre line
    let d = Infinity;
    for (const r of model.roads) {
      for (let k = 0; k + 3 < r.line.length; k += 2) {
        const dd = pointSegDist(mx, my, r.line[k], r.line[k + 1], r.line[k + 2], r.line[k + 3]);
        if (dd < d) d = dd;
      }
    }
    if (!best || d < best.d) best = { d, ax, ay, bx, by, len, mx, my };
  }
  if (!best) return [];
  const ux = (best.bx - best.ax) / best.len;
  const uy = (best.by - best.ay) / best.len;
  const nx = -uy;
  const ny = ux;
  const hw = widthM / 2;
  const depth = 2.0;
  return [
    {
      ring: [
        best.mx - ux * hw + nx * depth, best.my - uy * hw + ny * depth,
        best.mx + ux * hw + nx * depth, best.my + uy * hw + ny * depth,
        best.mx + ux * hw - nx * depth, best.my + uy * hw - ny * depth,
        best.mx - ux * hw - nx * depth, best.my - uy * hw - ny * depth,
      ],
      building: b.id,
    },
  ];
}

function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Assemble the region list consumed by the slab decomposition.
 * @returns {{regions:Array, walkable:Set, doorOwners:Map}}
 */
export function campusRegions(model, opts = {}) {
  const walkableCount = opts.walkable ?? 5;
  const includeRoads = opts.roads !== false;
  const walkable = new Set(pickWalkable(model, walkableCount).map((b) => b.id));
  const regions = [];

  for (const a of model.areas) {
    regions.push({ id: `area:${a.id}`, kind: a.kind, ring: a.ring, priority: 4, data: { area: a } });
  }
  if (includeRoads) {
    for (const r of model.roads) {
      if (r.kind !== "road") continue;
      if (r.ribbon.length < 8) continue;
      regions.push({ id: `way:${r.id}`, kind: r.kind, ring: r.ribbon, priority: 6, data: { road: r } });
    }
  }
  const doorOwners = new Map();
  for (const b of model.buildings) {
    const isWalkable = walkable.has(b.id);
    regions.push({
      id: `bld:${b.id}`,
      kind: isWalkable ? "interior" : "block",
      ring: b.ring,
      priority: 10,
      data: { building: b, walkable: isWalkable },
    });
    if (isWalkable) {
      for (const d of doorsForBuilding(b, model)) {
        const id = `door:${b.id}:${regions.length}`;
        regions.push({ id, kind: "doorway", ring: d.ring, priority: 20, data: { building: b, door: true } });
        doorOwners.set(id, b.id);
      }
    }
  }
  return { regions, walkable, doorOwners };
}

/* ------------------------------------------------------------------ *
 * Map construction
 * ------------------------------------------------------------------ */

function sectorKey(slab, regions) {
  const region = slab.region ? regions.get(slab.region) : null;
  if (!region) return "yard";
  if (region.kind === "block" || region.kind === "interior") return `${region.kind}:${region.id}`;
  if (region.kind === "doorway") return `doorway:${region.data.building.id}`;
  return `${region.kind}:${region.id}`;
}

function wallTextureFor(a, b) {
  // pick the texture of whichever side is a building
  for (const r of [a, b]) {
    if (!r) continue;
    if (r.kind === "interior" || r.kind === "block" || r.kind === "doorway") {
      return r.data.building.wall.doom;
    }
  }
  return WALLTEX.fence.doom;
}

/**
 * @param {object} model buildModel() output (use boxes:true for Doom)
 * @param {object} opts { mapName, walkable, roads, things, scale }
 */
export function buildDoomMap(model, opts = {}) {
  const scale = opts.scale ?? DOOM_UNITS_PER_M;
  const mapName = (opts.mapName || "E1M1").toUpperCase();
  const { regions } = campusRegions(model, opts);
  const regionById = new Map(regions.map((r) => [r.id, r]));

  const slabs = decompose(model.campus, regions, { minSlab: 0.05 });
  const part = partition(slabs);

  // ---- sectors ------------------------------------------------------
  const sectors = [];
  const sectorIndex = new Map();
  const slabSector = new Int32Array(part.slabs.length).fill(-1);

  const regionOf = (slab) => (slab && slab.region ? regionById.get(slab.region) : null);
  const groundAt = (x, y) => model.ground(x, y);
  const u = (m) => Math.round(m * scale);

  part.slabs.forEach((slab, i) => {
    const key = sectorKey(slab, regionById);
    if (sectorIndex.has(key)) {
      slabSector[i] = sectorIndex.get(key);
      return;
    }
    const info = KIND_INFO[slab.kind] || KIND_INFO.yard;
    const region = slab.region ? regionById.get(slab.region) : null;
    const g = u(groundAt(slab.cx, slab.cy));
    const floorH = Math.round(g / 4) * 4;
    let ceilH = info.sky ? SKY_CEIL : floorH;
    if (slab.kind === "interior") ceilH = floorH + u(region.data.building.h);
    if (slab.kind === "doorway") ceilH = floorH + u(Math.min(3.2, region.data.building.h));
    const sec = {
      key,
      kind: slab.kind,
      floorH,
      ceilH,
      floorFlat: info.flat,
      ceilFlat: info.sky ? "F_SKY1" : info.flat === "FLOOR4_8" ? "CEIL3_5" : "FLAT1",
      light: info.light,
      special: 0,
      tag: 0,
      region: slab.region ? regionById.get(slab.region) : null,
      name: slab.region ? (regionById.get(slab.region)?.data?.building?.name || regionById.get(slab.region)?.data?.area?.name || key) : "CAMPUS GROUNDS",
    };
    sectorIndex.set(key, sectors.length);
    slabSector[i] = sectors.length;
    sectors.push(sec);
  });

  // ---- vertices / linedefs / sidedefs --------------------------------
  const vertexIndex = new Map();
  const vertexes = [];
  const vid = (i) => {
    const v = part.verts[i];
    const x = u(v.x);
    const y = u(v.y);
    const key = `${x}:${y}`;
    if (vertexIndex.has(key)) return vertexIndex.get(key);
    vertexes.push({ x, y });
    const n = vertexes.length - 1;
    vertexIndex.set(key, n);
    return n;
  };

  const sidedefs = [];
  const sidedefCache = new Map();
  const addSidedef = (mid, upper, lower, sector) => {
    const key = `${mid}|${upper}|${lower}|${sector}`;
    if (sidedefCache.has(key)) return sidedefCache.get(key);
    sidedefs.push({ xoff: 0, yoff: 0, upper, lower, mid, sector });
    const n = sidedefs.length - 1;
    sidedefCache.set(key, n);
    return n;
  };

  const linedefs = [];
  for (const e of part.edges) {
    const v1 = vid(e.a);
    const v2 = vid(e.b);
    if (v1 === v2) continue;
    const sL = e.left >= 0 ? slabSector[e.left] : -1;
    const sR = e.right >= 0 ? slabSector[e.right] : -1;
    const slabL = e.left >= 0 ? part.slabs[e.left] : null;
    const slabR = e.right >= 0 ? part.slabs[e.right] : null;

    if (sR < 0 || sL < 0) {
      // one sided: front = the real sector, drawn as a solid wall
      const front = sL >= 0 ? sL : sR;
      const a = sL >= 0 ? slabL : slabR;
      const tex = a.kind === "yard" ? WALLTEX.fence.doom : wallTextureFor(regionOf(a), null);
      const side = addSidedef(tex, "-", "-", front);
      linedefs.push({ v1, v2, flags: 0x0001 | 0x0002, special: 0, tag: 0, front: side, back: 0xffff });
      continue;
    }

    const secA = sectors[sL];
    const secB = sectors[sR];
    const same = sL === sR;
    const openDoor = secA.kind === "doorway" || secB.kind === "doorway";
    let flags = 0x0004; // ML_TWOSIDED
    let upper = "-";
    let lower = "-";
    let mid = "-";
    if (!same && !openDoor) {
      const tex = wallTextureFor(regionOf(slabL), regionOf(slabR));
      if (Math.max(secA.ceilH, secB.ceilH) > Math.min(secA.ceilH, secB.ceilH)) upper = tex;
      if (Math.min(secA.floorH, secB.floorH) < Math.max(secA.floorH, secB.floorH)) lower = tex;
    } else if (!same && openDoor) {
      const tex = wallTextureFor(regionOf(slabL), regionOf(slabR));
      const doorSec = secA.kind === "doorway" ? secA : secB;
      const other = doorSec === secA ? secB : secA;
      if (other.ceilH > doorSec.ceilH) upper = tex;
      if (other.floorH < doorSec.floorH) lower = tex;
    }
    const front = addSidedef(mid, upper, lower, sL);
    const back = addSidedef(mid, upper, lower, sR);
    linedefs.push({ v1, v2, flags, special: 0, tag: 0, front, back });
  }

  // ---- segs / ssectors / nodes (BSP) ---------------------------------
  const segs = [];
  for (let li = 0; li < linedefs.length; li++) {
    const ld = linedefs[li];
    const a = vertexes[ld.v1];
    const b = vertexes[ld.v2];
    segs.push(makeSeg(ld.v1, ld.v2, li, 0, a, b, sectors[sidedefs[ld.front].sector]));
    if (ld.back !== 0xffff) {
      segs.push(makeSeg(ld.v2, ld.v1, li, 1, b, a, sectors[sidedefs[ld.back].sector]));
    }
  }

  const vIndex = new Map(vertexes.map((v, i) => [`${v.x}:${v.y}`, i]));
  vertexes._bspIndex = vIndex;
  const bsp = buildBsp(segs, vertexes);

  // ---- reject --------------------------------------------------------
  const rejectSize = Math.ceil((sectors.length * sectors.length) / 8);
  const reject = new Uint8Array(rejectSize);

  // ---- blockmap ------------------------------------------------------
  const blockmap = buildBlockmap(linedefs, vertexes);

  // ---- things --------------------------------------------------------
  const things = [];
  const entrySector = findSectorAt(part, slabSector, sectors, model.entry.x, model.entry.y);
  const angTo = (dx, dy) => {
    let a = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (a < 0) a += 360;
    return a;
  };
  things.push({
    x: u(model.entry.x),
    y: u(model.entry.y),
    angle: angTo(-model.entry.x, -model.entry.y),
    type: 1,
    flags: 0x0007 | 0x0010,
  });
  // four deathmatch starts spread across the campus
  const dmSpots = [
    [-150, 60],
    [120, 90],
    [140, -120],
    [-60, -150],
  ];
  for (const [dx, dy] of dmSpots) {
    const p = nearestOpenPoint(part, slabSector, sectors, dx, dy);
    things.push({ x: u(p.x), y: u(p.y), angle: 0, type: 11, flags: 0x0007 | 0x0010 });
  }
  if (opts.things !== false) {
    // floor lamps along the service drive (thing 2028)
    for (const r of model.roads) {
      if (r.kind !== "road") continue;
      let acc = 0;
      for (let i = 0; i + 3 < r.line.length; i += 2) {
        const ax = r.line[i], ay = r.line[i + 1];
        const bx = r.line[i + 2], by = r.line[i + 3];
        const len = Math.hypot(bx - ax, by - ay);
        acc += len;
        if (acc > 30) {
          acc = 0;
          const p = nearestOpenPoint(part, slabSector, sectors, (ax + bx) / 2, (ay + by) / 2, 3);
          things.push({ x: u(p.x), y: u(p.y), angle: 0, type: 2028, flags: 0x0007 });
        }
      }
    }
  }

  return {
    mapName,
    scale,
    lumps: assembleWad({
      mapName,
      things,
      linedefs,
      sidedefs,
      vertexes,
      segs: bsp.segs,
      ssectors: bsp.ssectors,
      nodes: bsp.nodes,
      sectors,
      reject,
      blockmap,
      customTextures: !!opts.customTextures,
    }),
    info: {
      things: things.length,
      linedefs: linedefs.length,
      sidedefs: sidedefs.length,
      vertexes: vertexes.length,
      segs: bsp.segs.length,
      ssectors: bsp.ssectors.length,
      nodes: bsp.nodes.length,
      sectors: sectors.length,
      slabs: part.slabs.length,
      walkable: [...(opts._walkable || [])],
      entrySector,
      bounds: {
        minX: Math.min(...vertexes.map((v) => v.x)),
        minY: Math.min(...vertexes.map((v) => v.y)),
        maxX: Math.max(...vertexes.map((v) => v.x)),
        maxY: Math.max(...vertexes.map((v) => v.y)),
      },
    },
  };
}

function makeSeg(v1, v2, linedef, dir, a, b, sector) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let ang = Math.round((Math.atan2(dy, dx) * 32768) / Math.PI);
  ang = ((ang % 65536) + 65536) % 65536;
  if (ang > 32767) ang -= 65536;
  return { v1, v2, angle: ang, linedef, dir, offset: 0, sector, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

/* ------------------------------------------------------------------ *
 * BSP node builder
 * ------------------------------------------------------------------ */

function segBBox(list) {
  let minX = 32767, minY = 32767, maxX = -32768, maxY = -32768;
  for (const s of list) {
    minX = Math.min(minX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2);
    maxX = Math.max(maxX, s.x1, s.x2);
    maxY = Math.max(maxY, s.y1, s.y2);
  }
  return { minX, minY, maxX, maxY };
}

function sideOf(px, py, nx, ny, dx, dy) {
  const v = (px - nx) * dy - (py - ny) * dx;
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

function splitSeg(s, nx, ny, dx, dy, vertexes) {
  const x1 = s.x1, y1 = s.y1, x2 = s.x2, y2 = s.y2;
  const d1 = sideOf(x1, y1, nx, ny, dx, dy);
  const d2 = sideOf(x2, y2, nx, ny, dx, dy);
  const t = ((nx - x1) * dy - (ny - y1) * dx) / ((x2 - x1) * dy - (y2 - y1) * dx);
  const mx = Math.round(x1 + (x2 - x1) * t);
  const my = Math.round(y1 + (y2 - y1) * t);
  const key = `${mx}:${my}`;
  let vi = vertexes._bspIndex ? vertexes._bspIndex.get(key) : undefined;
  if (vi === undefined) {
    vertexes.push({ x: mx, y: my });
    vi = vertexes.length - 1;
    if (vertexes._bspIndex) vertexes._bspIndex.set(key, vi);
  }
  const front = { ...s, v2: vi, x2: mx, y2: my };
  const back = { ...s, v1: vi, x1: mx, y1: my };
  front.angle = segAngle(front);
  back.angle = segAngle(back);
  return { front, back, d1, d2 };
}

function segAngle(s) {
  let ang = Math.round((Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 32768) / Math.PI);
  ang = ((ang % 65536) + 65536) % 65536;
  if (ang > 32767) ang -= 65536;
  return ang;
}

function pickPartition(list) {
  let best = null;
  let bestScore = Infinity;
  const step = Math.max(1, Math.floor(list.length / 40));
  for (let i = 0; i < list.length; i += step) {
    const cand = list[i];
    const nx = cand.x1, ny = cand.y1;
    const dx = cand.x2 - cand.x1, dy = cand.y2 - cand.y1;
    let front = 0, back = 0, splits = 0;
    for (const s of list) {
      const d1 = sideOf(s.x1, s.y1, nx, ny, dx, dy);
      const d2 = sideOf(s.x2, s.y2, nx, ny, dx, dy);
      if (d1 > 0 || (d1 === 0 && d2 > 0)) front++;
      else if (d1 < 0 || (d1 === 0 && d2 < 0)) back++;
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) splits++;
    }
    const score = splits * 8 + Math.abs(front - back);
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best || list[0];
}

export function buildBsp(segsIn, vertexes, opts = {}) {
  const maxPerLeaf = opts.maxPerLeaf ?? 6;
  const outSegs = [];
  const ssectors = [];
  const nodes = [];

  const build = (list, depth) => {
    if (list.length <= maxPerLeaf || depth > 60) {
      const first = outSegs.length;
      for (const s of list) outSegs.push(s);
      ssectors.push({ count: list.length, first });
      return { ssector: ssectors.length - 1, bbox: segBBox(list) };
    }
    const part = pickPartition(list);
    const nx = part.x1, ny = part.y1;
    const dx = part.x2 - part.x1, dy = part.y2 - part.y1;
    const front = [];
    const back = [];
    for (const s of list) {
      const d1 = sideOf(s.x1, s.y1, nx, ny, dx, dy);
      const d2 = sideOf(s.x2, s.y2, nx, ny, dx, dy);
      if ((d1 > 0 && d2 >= 0) || (d1 >= 0 && d2 > 0)) front.push(s);
      else if ((d1 < 0 && d2 <= 0) || (d1 <= 0 && d2 < 0)) back.push(s);
      else if (d1 === 0 && d2 === 0) front.push(s);
      else {
        const { front: f, back: b } = splitSeg(s, nx, ny, dx, dy, vertexes);
        front.push(f);
        back.push(b);
      }
    }
    if (!front.length || !back.length) {
      const first = outSegs.length;
      for (const s of list) outSegs.push(s);
      ssectors.push({ count: list.length, first });
      return { ssector: ssectors.length - 1, bbox: segBBox(list) };
    }
    const right = build(front, depth + 1);
    const left = build(back, depth + 1);
    const bboxR = right.bbox;
    const bboxL = left.bbox;
    const node = {
      x: nx,
      y: ny,
      dx,
      dy,
      right: { bbox: bboxR, child: right.ssector !== undefined ? right.ssector | 0x8000 : right.node },
      left: { bbox: bboxL, child: left.ssector !== undefined ? left.ssector | 0x8000 : left.node },
    };
    nodes.push(node);
    return {
      node: nodes.length - 1,
      bbox: {
        minX: Math.min(bboxR.minX, bboxL.minX),
        minY: Math.min(bboxR.minY, bboxL.minY),
        maxX: Math.max(bboxR.maxX, bboxL.maxX),
        maxY: Math.max(bboxR.maxY, bboxL.maxY),
      },
    };
  };

  build(segsIn, 0);
  return { segs: outSegs, ssectors, nodes };
}

/** Point location through the finished BSP (used by the verifier). */
export function bspPointSector(nodes, ssectors, segs, x, y) {
  if (!nodes.length) return -1;
  let i = 0;
  let guard = 0;
  while (!(i & 0x8000) && guard++ < 10000) {
    const n = nodes[i];
    const side = sideOf(x, y, n.x, n.y, n.dx, n.dy) > 0 ? n.right.child : n.left.child;
    i = side;
  }
  const ss = ssectors[i & 0x7fff];
  if (!ss || !ss.count) return -1;
  return segs[ss.first].sector;
}

/* ------------------------------------------------------------------ *
 * Blockmap
 * ------------------------------------------------------------------ */

function buildBlockmap(linedefs, vertexes) {
  if (!linedefs.length) return { x: 0, y: 0, cols: 1, rows: 1, blocks: [[], []] };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of vertexes) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  const originX = Math.floor(minX / 128) * 128;
  const originY = Math.floor(minY / 128) * 128;
  let cols = Math.min(128, Math.max(1, Math.ceil((maxX - originX) / 128) + 1));
  let rows = Math.min(128, Math.max(1, Math.ceil((maxY - originY) / 128) + 1));
  const grid = Array.from({ length: cols * rows }, () => []);
  const clampC = (c) => Math.max(0, Math.min(cols - 1, c));
  const clampR = (r) => Math.max(0, Math.min(rows - 1, r));
  const touch = (c, r, i) => {
    const cell = grid[clampR(r) * cols + clampC(c)];
    if (cell[cell.length - 1] !== i) cell.push(i);
  };
  linedefs.forEach((ld, i) => {
    const a = vertexes[ld.v1];
    const b = vertexes[ld.v2];
    // walk the 128-unit block grid along the segment (Amanatides & Woo)
    let cx = Math.floor((a.x - originX) / 128);
    let cy = Math.floor((a.y - originY) / 128);
    const ex = Math.floor((b.x - originX) / 128);
    const ey = Math.floor((b.y - originY) / 128);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(128 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(128 / dy) : Infinity;
    let tMaxX = dx !== 0 ? ((stepX > 0 ? (cx + 1) * 128 + originX - a.x : a.x - (cx * 128 + originX)) / Math.abs(dx)) : Infinity;
    let tMaxY = dy !== 0 ? ((stepY > 0 ? (cy + 1) * 128 + originY - a.y : a.y - (cy * 128 + originY)) / Math.abs(dy)) : Infinity;
    touch(cx, cy, i);
    let guard = 0;
    while ((cx !== ex || cy !== ey) && guard++ < 4096) {
      if (tMaxX < tMaxY) {
        cx += stepX;
        tMaxX += tDeltaX;
      } else {
        cy += stepY;
        tMaxY += tDeltaY;
      }
      touch(cx, cy, i);
    }
  });
  return { x: originX, y: originY, cols, rows, grid };
}

/* ------------------------------------------------------------------ *
 * Lump assembly
 * ------------------------------------------------------------------ */

function thingsLump(things) {
  const w = new ByteWriter();
  for (const t of things) {
    w.i16(t.x).i16(t.y).i16(t.angle).i16(t.type).i16(t.flags);
  }
  return w.bytes();
}

function linedefsLump(linedefs) {
  const w = new ByteWriter();
  for (const l of linedefs) {
    w.u16(l.v1).u16(l.v2).u16(l.flags).u16(l.special).u16(l.tag).u16(l.front).u16(l.back);
  }
  return w.bytes();
}

function sidedefsLump(sidedefs) {
  const w = new ByteWriter();
  for (const s of sidedefs) {
    w.i16(s.xoff).i16(s.yoff).ascii(s.upper, 8).ascii(s.lower, 8).ascii(s.mid, 8).u16(s.sector);
  }
  return w.bytes();
}

function vertexesLump(vertexes) {
  const w = new ByteWriter();
  for (const v of vertexes) w.i16(v.x).i16(v.y);
  return w.bytes();
}

function segsLump(segs) {
  const w = new ByteWriter();
  for (const s of segs) {
    w.u16(s.v1).u16(s.v2).i16(s.angle).u16(s.linedef).u16(s.dir).u16(s.offset);
  }
  return w.bytes();
}

function ssectorsLump(ssectors) {
  const w = new ByteWriter();
  for (const s of ssectors) w.u16(s.count).u16(s.first);
  return w.bytes();
}

function nodesLump(nodes) {
  const w = new ByteWriter();
  // DOOM node bbox order is top, bottom, left, right
  const bb = (b) => w.i16(b.maxY).i16(b.minY).i16(b.minX).i16(b.maxX);
  for (const n of nodes) {
    w.i16(n.x).i16(n.y).i16(n.dx).i16(n.dy);
    bb(n.right.bbox);
    bb(n.left.bbox);
    w.u16(n.right.child).u16(n.left.child);
  }
  return w.bytes();
}

function sectorsLump(sectors) {
  const w = new ByteWriter();
  for (const s of sectors) {
    w.i16(s.floorH).i16(s.ceilH).ascii(s.floorFlat, 8).ascii(s.ceilFlat, 8).u16(s.light).u16(s.special).u16(s.tag);
  }
  return w.bytes();
}

function blockmapLump(bm) {
  const w = new ByteWriter();
  w.i16(bm.x).i16(bm.y).u16(bm.cols).u16(bm.rows);
  const headerWords = 4;
  const offsets = new Uint8Array(bm.cols * bm.rows * 2);
  const body = new ByteWriter();
  let word = headerWords + bm.cols * bm.rows;
  for (let r = 0; r < bm.rows; r++) {
    for (let c = 0; c < bm.cols; c++) {
      const list = bm.grid[r * bm.cols + c];
      new DataView(offsets.buffer).setUint16((r * bm.cols + c) * 2, word, true);
      body.u16(0);
      word += 1;
      for (const i of list) {
        body.u16(i);
        word += 1;
      }
      body.u16(0xffff);
      word += 1;
    }
  }
  w.raw(offsets).raw(body.bytes());
  return w.bytes();
}

/** Custom TEXTURE1/PNAMES built from stock DOOM patch names. */
function textureLumps(usedTextures) {
  const names = Array.from(new Set(usedTextures)).sort();
  const pnames = new ByteWriter();
  pnames.i32(names.length);
  for (const n of names) pnames.ascii(n, 8);
  const tex = new ByteWriter();
  tex.i32(names.length);
  const offsetBase = 4 + names.length * 4;
  names.forEach((n, i) => tex.i32(offsetBase + i * 22));
  for (const n of names) {
    tex.ascii(`GHS${n.slice(0, 5)}`, 8).i32(0).i16(128).i16(128).i16(1);
    tex.i16(0).i16(0).u16(names.indexOf(n)).u8(1).u8(0);
  }
  return { pnames: pnames.bytes(), texture1: tex.bytes(), names };
}

function assembleWad({
  mapName,
  things,
  linedefs,
  sidedefs,
  vertexes,
  segs,
  ssectors,
  nodes,
  sectors,
  reject,
  blockmap,
  customTextures,
}) {
  const lumps = [];
  const push = (name, data) => lumps.push({ name: name.toUpperCase().slice(0, 8), data });

  if (customTextures) {
    const used = new Set();
    for (const s of sidedefs) {
      for (const t of [s.upper, s.lower, s.mid]) if (t && t !== "-") used.add(t);
    }
    const { pnames, texture1 } = textureLumps(Array.from(used));
    push("PNAMES", pnames);
    push("TEXTURE1", texture1);
  }

  push(mapName, new Uint8Array(0));
  push("THINGS", thingsLump(things));
  push("LINEDEFS", linedefsLump(linedefs));
  push("SIDEDEFS", sidedefsLump(sidedefs));
  push("VERTEXES", vertexesLump(vertexes));
  push("SEGS", segsLump(segs));
  push("SSECTORS", ssectorsLump(ssectors));
  push("NODES", nodesLump(nodes));
  push("SECTORS", sectorsLump(sectors));
  push("REJECT", reject);
  push("BLOCKMAP", blockmapLump(blockmap));

  // header + directory
  const headerSize = 12;
  const dirSize = lumps.length * 16;
  let offset = headerSize + dirSize;
  const body = new ByteWriter();
  const dir = new ByteWriter();
  for (const l of lumps) {
    dir.i32(offset).i32(l.data.length).ascii(l.name, 8);
    body.raw(l.data);
    offset += l.data.length;
  }
  const head = new ByteWriter();
  // the directory follows the header immediately; lump data starts after it
  head.ascii("PWAD", 4).i32(lumps.length).i32(headerSize);
  const out = new ByteWriter();
  out.raw(head.bytes()).raw(dir.bytes()).raw(body.bytes());
  return out.bytes();
}

/* ------------------------------------------------------------------ *
 * helpers used above
 * ------------------------------------------------------------------ */

function findSectorAt(part, slabSector, sectors, x, y) {
  for (let i = 0; i < part.slabs.length; i++) {
    const s = part.slabs[i];
    if (x >= s.x0 && x <= s.x1 && y >= Math.min(s.yl0, s.yl1) && y <= Math.max(s.yh0, s.yh1)) {
      return sectors[slabSector[i]];
    }
  }
  return null;
}

/** Nudge a point until it lands on a walkable slab (yard / road / field). */
function nearestOpenPoint(part, slabSector, sectors, x, y, tries = 8) {
  const ok = (s) => {
    const sec = sectors[slabSector[s]];
    return sec && sec.kind !== "block" && sec.kind !== "interior";
  };
  for (let i = 0; i < part.slabs.length; i++) {
    const s = part.slabs[i];
    if (Math.abs(s.cx - x) < 2 && Math.abs(s.cy - y) < 2 && ok(i)) return { x: s.cx, y: s.cy };
  }
  for (let t = 0; t < tries; t++) {
    const r = 4 + t * 4;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      for (let i = 0; i < part.slabs.length; i++) {
        const s = part.slabs[i];
        const lo = Math.min(s.yl0, s.yl1);
        const hi = Math.max(s.yh0, s.yh1);
        if (px >= s.x0 && px <= s.x1 && py >= lo && py <= hi && ok(i)) {
          const ymid = lo + (py - lo) * 0 + (hi - lo) / 2;
          return { x: px, y: ymid };
        }
      }
    }
  }
  return { x, y };
}
