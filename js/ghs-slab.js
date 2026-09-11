/**
 * Planar decomposition shared by the Doom WAD and Duke3D/Build exporters.
 *
 * The campus is a polygon (the OSM boundary) with holes/overlays (fields,
 * courts, parking, roads, buildings).  Doom needs a watertight partition of
 * the plane into convex-ish pieces it can BSP; Build needs sector outlines
 * with red/white walls.  Both fall out of one vertical slab decomposition:
 *
 *   1. every polygon vertex x becomes a slab boundary
 *   2. inside a slab no edge starts or ends, so the crossing set is constant
 *   3. even-odd intervals between crossings become quads
 *   4. quads are labelled by point-in-polygon priority, then merged sideways
 *      when the shared edge matches exactly
 *   5. quad edges are split at T-junction vertices and paired up
 *
 * Pure module: no DOM.
 */

const EPS = 1e-6;

function edgeCrossings(edges, x) {
  const out = [];
  for (const e of edges) {
    const minX = Math.min(e.x1, e.x2);
    const maxX = Math.max(e.x1, e.x2);
    if (x <= minX || x >= maxX) continue; // vertical edges and non-spanning
    const t = (x - e.x1) / (e.x2 - e.x1);
    out.push({ y: e.y1 + (e.y2 - e.y1) * t, e });
  }
  out.sort((a, b) => a.y - b.y);
  return out;
}

function yAt(e, x) {
  if (Math.abs(e.x2 - e.x1) < 1e-12) return e.y1;
  const t = (x - e.x1) / (e.x2 - e.x1);
  return e.y1 + (e.y2 - e.y1) * t;
}

export function pointInRing(x, y, ring) {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1];
    const xj = ring[j * 2], yj = ring[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function ringEdges(ring, owner) {
  const out = [];
  const n = ring.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    out.push({
      x1: ring[i * 2], y1: ring[i * 2 + 1],
      x2: ring[j * 2], y2: ring[j * 2 + 1],
      owner,
    });
  }
  return out;
}

/**
 * @param {number[]} outer flat CCW/CW ring (metres)
 * @param {Array} regions [{ id, kind, ring, priority, data }]
 * @param {object} opts { minSlab }
 * @returns {Array} slabs [{x0,x1,yl0,yh0,yl1,yh1,kind,region}]
 */
export function decompose(outer, regions, opts = {}) {
  const minSlab = opts.minSlab ?? 0.05;
  const edges = [];
  for (const e of ringEdges(outer, null)) edges.push(e);
  for (const r of regions) for (const e of ringEdges(r.ring, r.id)) edges.push(e);

  const xsSet = new Set();
  for (const e of edges) {
    xsSet.add(Math.round(e.x1 * 1000) / 1000);
    xsSet.add(Math.round(e.x2 * 1000) / 1000);
  }
  const outerMinX = Math.min(...Array.from({ length: outer.length / 2 }, (_, i) => outer[i * 2]));
  const outerMaxX = Math.max(...Array.from({ length: outer.length / 2 }, (_, i) => outer[i * 2]));
  const xs = Array.from(xsSet).filter((x) => x >= outerMinX - EPS && x <= outerMaxX + EPS).sort((a, b) => a - b);

  const byId = new Map(regions.map((r) => [r.id, r]));
  const slabs = [];

  for (let i = 0; i + 1 < xs.length; i++) {
    const xa = xs[i];
    const xb = xs[i + 1];
    if (xb - xa < minSlab) continue;
    const xm = (xa + xb) / 2;
    const crossings = edgeCrossings(edges, xm);
    // De-duplicate coincident crossings.  The tolerance has to stay far below
    // the geometry: dropping a crossing that is merely "close" to another one
    // punches a hole in the partition, and a hole shows up later as a wall
    // loop that never closes.
    const ys = [];
    for (const c of crossings) {
      if (!ys.length || Math.abs(c.y - ys[ys.length - 1]) > minSlab) ys.push(c.y);
    }
    if (ys.length < 2) continue;
    for (let k = 0; k + 1 < ys.length; k++) {
      const yl = ys[k];
      const yh = ys[k + 1];
      if (yh - yl < 1e-9) continue; // zero-area quad contributes nothing but noise
      const ymid = (yl + yh) / 2;
      if (!pointInRing(xm, ymid, outer)) continue;
      let region = null;
      let bestPriority = -Infinity;
      for (const r of regions) {
        if ((r.priority ?? 0) < bestPriority) continue;
        if (pointInRing(xm, ymid, r.ring)) {
          if ((r.priority ?? 0) >= bestPriority) {
            bestPriority = r.priority ?? 0;
            region = r;
          }
        }
      }
      const lower = crossings.find((c) => Math.abs(c.y - yl) < minSlab);
      const upper = crossings.slice().reverse().find((c) => Math.abs(c.y - yh) < minSlab);
      if (!lower || !upper) continue;
      const ax = xa;
      const bx = xb;
      const a0 = yAt(lower.e, ax);
      const a1 = yAt(upper.e, ax);
      const b1 = yAt(upper.e, bx);
      const b0 = yAt(lower.e, bx);
      // Shoelace area of the quad.  Slivers with no area cannot become a
      // sector in any of the target engines (Build needs at least three
      // walls), so they are dropped here and their neighbours simply grow a
      // blocking wall where the sliver used to be.
      const area = Math.abs((bx - ax) * ((a1 - a0) + (b1 - b0))) / 2;
      if (area < 0.02) continue;
      slabs.push({
        x0: xa,
        x1: xb,
        yl0: yAt(lower.e, xa),
        yh0: yAt(upper.e, xa),
        yl1: yAt(lower.e, xb),
        yh1: yAt(upper.e, xb),
        kind: region ? region.kind : "yard",
        region: region ? region.id : null,
        cx: xm,
        cy: ymid,
      });
    }
  }

  return mergeSlabs(slabs, minSlab);
}

/** Merge neighbouring slabs that share an identical edge and label. */
export function mergeSlabs(slabs, eps = 1e-6) {
  const byStrip = new Map();
  for (const s of slabs) {
    const key = `${s.x0.toFixed(4)}:${s.x1.toFixed(4)}`;
    if (!byStrip.has(key)) byStrip.set(key, []);
    byStrip.get(key).push(s);
  }
  const strips = Array.from(byStrip.entries()).map(([key, list]) => {
    const [x0, x1] = key.split(":").map(Number);
    list.sort((a, b) => a.yl0 - b.yl0);
    return { x0, x1, list };
  });
  strips.sort((a, b) => a.x0 - b.x0);

  const merged = [];
  const consumed = new Set();

  for (let si = 0; si < strips.length; si++) {
    const strip = strips[si];
    for (let k = 0; k < strip.list.length; k++) {
      const s = strip.list[k];
      if (consumed.has(s)) continue;
      const out = { ...s };
      let cur = s;
      consumed.add(cur);
      // extend rightwards
      for (let sj = si + 1; sj < strips.length; sj++) {
        const next = strips[sj];
        if (Math.abs(next.x0 - out.x1) > eps) break;
        const match = next.list.find(
          (t) => !consumed.has(t) && t.kind === out.kind && t.region === out.region && Math.abs(t.yl0 - out.yl1) < eps && Math.abs(t.yh0 - out.yh1) < eps,
        );
        if (!match) break;
        consumed.add(match);
        out.x1 = match.x1;
        out.yl1 = match.yl1;
        out.yh1 = match.yh1;
        cur = match;
      }
      merged.push(out);
    }
  }
  return merged;
}

/**
 * Turn slabs into a shared-edge planar graph.
 * @returns {{verts:Array, edges:Array, slabs:Array}}
 *   verts: [{x,y}]
 *   edges: [{a,b,left,right}] indices into slabs (-1 = outside)
 *   slabs: input slabs with .edgeIds added
 */
export function partition(slabs) {
  /**
   * Vertices are snapped to a fixed grid before anything else happens.  The
   * decomposition cuts the same boundary from opposite sides, and a few tenths
   * of a millimetre of floating point noise is enough to produce two vertices
   * that look identical but never join — which silently leaves the wall loops
   * that both Build and Doom require to be closed wide open.  1/512 m is a
   * whole number of Build units (1024 u/m) and a 32nd of a Doom unit, so no
   * engine ever sees the grid.
   */
  const SNAP = 1 / 512;
  const snap = (v) => Math.round(v / SNAP) * SNAP;

  const verts = [];
  const vIndex = new Map();
  const addVert = (x0, y0) => {
    const x = snap(x0);
    const y = snap(y0);
    const k = `${x}|${y}`;
    if (vIndex.has(k)) return vIndex.get(k);
    verts.push({ x, y });
    const i = verts.length - 1;
    vIndex.set(k, i);
    return i;
  };

  const rawEdges = []; // {a,b,slab}
  const slabEdges = slabs.map(() => []);
  slabs.forEach((s, si) => {
    const corners = [
      [s.x0, s.yl0],
      [s.x0, s.yh0],
      [s.x1, s.yh1],
      [s.x1, s.yl1],
    ];
    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      rawEdges.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], slab: si });
    }
  });

  // register every vertex
  for (const e of rawEdges) {
    addVert(e.ax, e.ay);
    addVert(e.bx, e.by);
  }

  // split edges at collinear vertices (T-junctions)
  const splitEdges = [];
  for (const e of rawEdges) {
    const dx = e.bx - e.ax;
    const dy = e.by - e.ay;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-12) continue;
    const ts = [0, 1];
    for (let vi = 0; vi < verts.length; vi++) {
      const vx = verts[vi].x;
      const vy = verts[vi].y;
      const cross = Math.abs((vx - e.ax) * dy - (vy - e.ay) * dx);
      // perpendicular distance; the snap grid is the tolerance
      if (cross > SNAP * Math.sqrt(len2)) continue;
      const t = ((vx - e.ax) * dx + (vy - e.ay) * dy) / len2;
      if (t > 1e-6 && t < 1 - 1e-6) ts.push(t);
    }
    ts.sort((a, b) => a - b);
    for (let i = 0; i + 1 < ts.length; i++) {
      const t0 = ts[i];
      const t1 = ts[i + 1];
      if (t1 - t0 < 1e-7) continue;
      splitEdges.push({
        ax: e.ax + dx * t0,
        ay: e.ay + dy * t0,
        bx: e.ax + dx * t1,
        by: e.ay + dy * t1,
        slab: e.slab,
      });
    }
  }

  const edgeMap = new Map();
  const edges = [];
  for (const e of splitEdges) {
    const a = addVert(e.ax, e.ay);
    const b = addVert(e.bx, e.by);
    if (a === b) continue;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    let rec = edgeMap.get(key);
    if (!rec) {
      rec = { a, b, left: -1, right: -1 };
      edgeMap.set(key, rec);
      edges.push(rec);
      rec.index = edges.length - 1;
    }
    if (rec.left === -1) rec.left = e.slab;
    else if (rec.right === -1) rec.right = e.slab;
    slabEdges[e.slab].push(rec.index);
  }

  return { verts, edges, slabs: slabs.map((s, i) => ({ ...s, index: i, edgeIds: slabEdges[i] })) };
}
