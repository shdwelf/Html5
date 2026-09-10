/**
 * Metric campus model for Glendora High School.
 *
 * Pure module (no DOM): turns the OSM extract in ghs-data.js into a
 * metres-based model that every exporter consumes —
 *   VRML 2.0, Doom WAD, Duke3D/Build, Wolfenstein 3D JS, webxdc.
 */

import {
  SITE,
  CAMPUS_RING,
  BUILDINGS,
  AREAS,
  PATHS,
  makeProjector,
  ringBounds,
  polygonArea,
  makeTerrain,
} from "./ghs-data.js";

/** Deterministic PRNG so every export of the same data is byte-identical. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pointInRing(x, y, ring) {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2];
    const yi = ring[i * 2 + 1];
    const xj = ring[j * 2];
    const yj = ring[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Perpendicular distance from a point to segment ab. */
export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Douglas–Peucker simplification of a polyline (flat [x,y,...] array). */
export function simplifyPath(pts, tol) {
  const n = pts.length / 2;
  if (n < 3) return pts.slice();
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let best = -1;
    let bestD = tol;
    for (let k = i + 1; k < j; k++) {
      const d = distToSegment(pts[k * 2], pts[k * 2 + 1], pts[i * 2], pts[i * 2 + 1], pts[j * 2], pts[j * 2 + 1]);
      if (d > bestD) {
        bestD = d;
        best = k;
      }
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([i, best], [best, j]);
    }
  }
  const out = [];
  for (let k = 0; k < n; k++) if (keep[k]) out.push(pts[k * 2], pts[k * 2 + 1]);
  return out;
}

/** Simplify a closed ring; always keeps at least 3 points. */
export function simplifyRing(ring, tol) {
  // open the ring, simplify, re-close
  const open = ring.slice();
  if (Math.hypot(open[0] - open[open.length - 2], open[1] - open[open.length - 1]) < 1e-6) {
    open.length -= 2;
  }
  const pts = open.concat(open[0], open[1]);
  const s = simplifyPath(pts, tol);
  if (s.length < 8) return open.slice();
  return s.slice(0, s.length - 2);
}

function convexHull(ring) {
  const pts = [];
  for (let i = 0; i + 1 < ring.length; i += 2) pts.push([ring[i], ring[i + 1]]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Minimum-area oriented bounding box as a flat 8-number ring (CCW). */
export function orientedBox(ring) {
  const hull = convexHull(ring);
  if (hull.length < 3) return ring.slice();
  let best = { area: Infinity, ring };
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey);
    if (len < 1e-9) continue;
    const ux = ex / len;
    const uy = ey / len;
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const [px, py] of hull) {
      const u = px * ux + py * uy;
      const v = -px * uy + py * ux;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    const area = (maxU - minU) * (maxV - minV);
    if (area < best.area) {
      const corner = (u, v) => [u * ux - v * uy, u * uy + v * ux];
      const c = [corner(minU, minV), corner(maxU, minV), corner(maxU, maxV), corner(minU, maxV)];
      best = { area, ring: c.flat() };
    }
  }
  return best.ring;
}

function ringCentroid(ring) {
  let cx = 0, cy = 0, a = 0;
  const n = ring.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cr = ring[i * 2] * ring[j * 2 + 1] - ring[j * 2] * ring[i * 2 + 1];
    a += cr;
    cx += (ring[i * 2] + ring[j * 2]) * cr;
    cy += (ring[i * 2 + 1] + ring[j * 2 + 1]) * cr;
  }
  if (Math.abs(a) < 1e-9) {
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) {
      sx += ring[i * 2];
      sy += ring[i * 2 + 1];
    }
    return { x: sx / n, y: sy / n };
  }
  a /= 2;
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

/** Turn a centre line into a flat ribbon polygon of the given width. */
export function ribbon(pts, width) {
  const n = pts.length / 2;
  if (n < 2) return [];
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? i - 1 : i;
    const next = i < n - 1 ? i + 1 : i;
    let dx = pts[next * 2] - pts[prev * 2];
    let dy = pts[next * 2 + 1] - pts[prev * 2 + 1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const hw = width / 2;
    left.push(pts[i * 2] - dy * hw, pts[i * 2 + 1] + dx * hw);
    right.push(pts[i * 2] + dy * hw, pts[i * 2 + 1] - dx * hw);
  }
  for (let i = right.length / 2 - 1; i >= 0; i--) left.push(right[i * 2], right[i * 2 + 1]);
  return left;
}

export const SURFACE = {
  yard: { label: "CAMPUS LAWN", doomFlat: "FLAT23", buildTile: 40, wolf: 0 },
  field: { label: "ATHLETIC FIELD", doomFlat: "FLAT23", buildTile: 41, wolf: 0 },
  court: { label: "HARD COURT", doomFlat: "FLOOR4_8", buildTile: 42, wolf: 0 },
  track: { label: "TRACK", doomFlat: "FLAT20", buildTile: 43, wolf: 0 },
  parking: { label: "PARKING", doomFlat: "FLAT20", buildTile: 44, wolf: 0 },
  road: { label: "SERVICE ROAD", doomFlat: "FLOOR7_1", buildTile: 45, wolf: 0 },
  path: { label: "WALKWAY", doomFlat: "FLOOR5_1", buildTile: 46, wolf: 0 },
  plaza: { label: "QUAD", doomFlat: "FLAT20", buildTile: 47, wolf: 0 },
  interior: { label: "INTERIOR", doomFlat: "FLOOR4_8", buildTile: 48, wolf: 0 },
};

export const WALLTEX = {
  classroom: { doom: "STARG3", build: 10, wolf: 1, label: "STUCCO BLOCK" },
  admin: { doom: "BRICK1", build: 11, wolf: 2, label: "BRICK" },
  gym: { doom: "CEMENT5", build: 12, wolf: 3, label: "TILT-UP CONCRETE" },
  hall: { doom: "STONE2", build: 13, wolf: 2, label: "MASONRY" },
  annex: { doom: "CEMENT7", build: 14, wolf: 1, label: "CONCRETE" },
  portable: { doom: "METAL1", build: 15, wolf: 4, label: "RIBBED METAL" },
  shed: { doom: "METAL3", build: 15, wolf: 4, label: "RIBBED METAL" },
  canopy: { doom: "SUPPORT2", build: 16, wolf: 5, label: "OPEN CANOPY" },
  amphitheater: { doom: "STONE4", build: 17, wolf: 6, label: "STONE RISER" },
  cafeteria: { doom: "SHAWN2", build: 18, wolf: 1, label: "SERVERY WALL" },
  fence: { doom: "SPACEW2", build: 19, wolf: 5, label: "CHAIN LINK" },
  door: { doom: "BIGDOOR1", build: 20, wolf: 7, label: "ENTRY DOOR" },
  glass: { doom: "SILVER1", build: 21, wolf: 8, label: "GLASS CURTAIN" },
};

/**
 * Build the metric campus model.
 * @param {object} opts { simplify: metres, boxes: bool, trees: number, seed: int }
 */
export function buildModel(opts = {}) {
  const simplify = opts.simplify ?? 0.6;
  const useBoxes = !!opts.boxes;
  const treeCount = opts.trees ?? 190;
  const seed = opts.seed ?? 20260910;

  const proj = makeProjector(SITE);
  const campus = proj.ring(CAMPUS_RING);
  const bounds = ringBounds(campus);

  // Ground: IDW over every OSM `ele` tag we captured.
  const eleSamples = [{ x: 0, y: 0, z: SITE.ele }];
  for (const b of BUILDINGS) {
    const ring = proj.ring(b.p);
    const c = ringCentroid(ring);
    eleSamples.push({ x: c.x, y: c.y, z: b.ele });
  }
  const terrain = makeTerrain(eleSamples);

  const ground = (x, y) => terrain.at(x, y) - SITE.ele; // metres relative to campus datum

  const buildings = BUILDINGS.map((b, i) => {
    let ring = proj.ring(b.p);
    const raw = ring.slice();
    const clean = simplifyRing(ring, simplify);
    ring = useBoxes ? orientedBox(clean) : clean;
    const c = ringCentroid(ring);
    const bb = ringBounds(ring);
    return {
      idx: i,
      id: b.id,
      name: b.name,
      kind: b.kind,
      h: b.h,
      ring,
      raw,
      box: orientedBox(clean),
      cx: c.x,
      cy: c.y,
      base: ground(c.x, c.y),
      top: ground(c.x, c.y) + b.h,
      area: Math.abs(polygonArea(ring)),
      bounds: bb,
      wall: WALLTEX[b.kind] || WALLTEX.classroom,
    };
  }).sort((a, b) => a.cy - b.cy);

  const areas = AREAS.map((a, i) => {
    let ring = proj.ring(a.p);
    const clean = simplifyRing(ring, simplify);
    ring = useBoxes ? orientedBox(clean) : clean;
    const c = ringCentroid(ring);
    return {
      idx: i,
      id: a.id,
      name: a.name,
      kind: a.kind,
      ring,
      raw: proj.ring(a.p),
      cx: c.x,
      cy: c.y,
      base: ground(c.x, c.y),
      area: Math.abs(polygonArea(ring)),
      bounds: ringBounds(ring),
    };
  });

  const roads = PATHS.map((p, i) => {
    const line = proj.ring(p.p);
    const simple = simplifyPath(line, simplify * 0.5);
    return {
      idx: i,
      id: p.id,
      kind: p.kind,
      width: p.w,
      line: simple,
      ribbon: ribbon(simple, p.w),
      raw: line,
    };
  });

  // Seeded tree scatter: reject anything inside a building, court or road.
  const rnd = mulberry32(seed);
  const trees = [];
  let guard = 0;
  while (trees.length < treeCount && guard < treeCount * 60) {
    guard++;
    const x = bounds.minX + rnd() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + rnd() * (bounds.maxY - bounds.minY);
    if (!pointInRing(x, y, campus)) continue;
    if (buildings.some((b) => pointInRing(x, y, b.box))) continue;
    if (areas.some((a) => pointInRing(x, y, a.ring))) continue;
    let onRoad = false;
    for (const r of roads) {
      for (let i = 0; i + 3 < r.line.length; i += 2) {
        if (distToSegment(x, y, r.line[i], r.line[i + 1], r.line[i + 2], r.line[i + 3]) < r.width * 0.8 + 1.5) {
          onRoad = true;
          break;
        }
      }
      if (onRoad) break;
    }
    if (onRoad) continue;
    trees.push({
      x,
      y,
      base: ground(x, y),
      h: 4 + rnd() * 5,
      r: 1.2 + rnd() * 1.6,
      kind: rnd() < 0.22 ? "palm" : "oak",
    });
  }

  // Main entry: the Foothill Boulevard service drive on the west edge.
  const entry = { x: -178, y: -60, angle: 90 };

  return {
    site: SITE,
    proj,
    campus,
    bounds,
    terrain,
    ground,
    buildings,
    areas,
    roads,
    trees,
    entry,
    opts: { simplify, boxes: useBoxes, treeCount, seed },
    stats: {
      buildings: buildings.length,
      areas: areas.length,
      roads: roads.length,
      trees: trees.length,
      campusAreaM2: Math.abs(polygonArea(campus)),
      buildingFootprintM2: buildings.reduce((s, b) => s + b.area, 0),
      widthM: bounds.maxX - bounds.minX,
      depthM: bounds.maxY - bounds.minY,
      zMin: terrain.zMin,
      zMax: terrain.zMax,
    },
  };
}
