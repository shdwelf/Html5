/**
 * VRML 2.0 (ISO/IEC 14772) writer for the Glendora High campus model.
 *
 * Output is deliberately restricted to the node subset that
 * js/wrl-parse.js understands, so the page can feed its own .wrl back
 * through the viewer (write → parse → render round trip).
 *
 * VRML space: x = east (m), y = up (m, relative to campus datum 265 m MSL),
 * z = south (m).  Pure module: no DOM.
 */

const F = (n, d = 3) => Number(n).toFixed(d).replace(/\.?0+$/, (m) => (m.includes(".") ? "" : m));

function num(n) {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 1000) / 1000;
  return String(r);
}

/** Map ring (x east, y north) → VRML x/z pair. */
export function toVrmlXZ(x, y) {
  return [x, -y];
}

/** Ear-clipping triangulation of a simple polygon (flat [x,y,...]). */
export function triangulate(ring) {
  const n = ring.length / 2;
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i * 2] * ring[j * 2 + 1] - ring[j * 2] * ring[i * 2 + 1];
  }
  const ccw = area > 0;
  if (!ccw) idx.reverse();

  const at = (k) => [ring[idx[k] * 2], ring[idx[k] * 2 + 1]];
  const triArea = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
  const inside = (p, a, b, c) => {
    const d1 = triArea(p, a, b);
    const d2 = triArea(p, b, c);
    const d3 = triArea(p, c, a);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  };

  const out = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 4000) {
    let earFound = false;
    for (let i = 0; i < idx.length; i++) {
      const i0 = (i + idx.length - 1) % idx.length;
      const i2 = (i + 1) % idx.length;
      const a = at(i0);
      const b = at(i);
      const c = at(i2);
      if (triArea(a, b, c) <= 1e-9) continue; // reflex or degenerate
      let contains = false;
      for (let k = 0; k < idx.length; k++) {
        if (k === i0 || k === i || k === i2) continue;
        if (inside(at(k), a, b, c)) {
          contains = true;
          break;
        }
      }
      if (contains) continue;
      out.push(idx[i0], idx[i], idx[i2]);
      idx.splice(i, 1);
      earFound = true;
      break;
    }
    if (!earFound) break;
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}

function cross(a, b, c) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

/**
 * Extrude a map-space ring into a closed solid mesh.
 * @returns {{coord:number[], index:number[]}} triangle soup, outward facing.
 */
export function extrudeRing(ring, base, height) {
  const n = ring.length / 2;
  const coord = [];
  const index = [];
  let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) {
    cx += ring[i * 2];
    cy += ring[i * 2 + 1];
  }
  cx /= n;
  cy /= n;

  const push = (x, y, z) => {
    coord.push(x, y, z);
    return coord.length / 3 - 1;
  };

  const bot = [];
  const top = [];
  for (let i = 0; i < n; i++) {
    const [vx, vz] = toVrmlXZ(ring[i * 2], ring[i * 2 + 1]);
    bot.push(push(vx, base, vz));
    top.push(push(vx, base + height, vz));
  }

  const addTri = (a, b, c, ref) => {
    const nrm = cross(coord.slice(a * 3, a * 3 + 3), coord.slice(b * 3, b * 3 + 3), coord.slice(c * 3, c * 3 + 3));
    const flip = nrm[0] * ref[0] + nrm[1] * ref[1] + nrm[2] * ref[2] < 0;
    if (flip) index.push(a, c, b);
    else index.push(a, b, c);
  };

  // Walls.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const mx = (ring[i * 2] + ring[j * 2]) / 2 - cx;
    const my = (ring[i * 2 + 1] + ring[j * 2 + 1]) / 2 - cy;
    const ref = [mx, 0, -my];
    addTri(bot[i], bot[j], top[j], ref);
    addTri(bot[i], top[j], top[i], ref);
  }

  // Roof + floor.
  const tris = triangulate(ring);
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t], b = tris[t + 1], c = tris[t + 2];
    addTri(top[a], top[b], top[c], [0, 1, 0]);
    addTri(bot[a], bot[b], bot[c], [0, -1, 0]);
  }

  return { coord, index };
}

/** Flat draped polygon (ground surfaces) — map ring at a per-vertex height. */
export function flatRing(ring, heightAt, lift = 0.02) {
  const n = ring.length / 2;
  const coord = [];
  const index = [];
  for (let i = 0; i < n; i++) {
    const [vx, vz] = toVrmlXZ(ring[i * 2], ring[i * 2 + 1]);
    coord.push(vx, heightAt(ring[i * 2], ring[i * 2 + 1]) + lift, vz);
  }
  const tris = triangulate(ring);
  for (let t = 0; t + 2 < tris.length; t += 3) index.push(tris[t], tris[t + 1], tris[t + 2], -1);
  return { coord, index };
}

function meshNode(name, color, mesh, opts = {}) {
  const pts = [];
  for (let i = 0; i + 2 < mesh.coord.length; i += 3) {
    pts.push(`${num(mesh.coord[i])} ${num(mesh.coord[i + 1])} ${num(mesh.coord[i + 2])}`);
  }
  const transparency = opts.transparency ? ` transparency ${num(opts.transparency)}` : "";
  const solid = opts.solid === false ? "\n        solid FALSE" : "";
  const crease = opts.crease ? `\n        creaseAngle ${num(opts.crease)}` : "";
  return `DEF ${name} Shape {
      appearance Appearance {
        material Material { diffuseColor ${num(color[0])} ${num(color[1])} ${num(color[2])}${transparency} specularColor 0.12 0.12 0.12 }
      }
      geometry IndexedFaceSet {${solid}${crease}
        coord Coordinate { point [ ${pts.join(", ")} ] }
        coordIndex [ ${mesh.index.join(" ")} ]
      }
    }`;
}

function lineNode(name, color, pairs) {
  if (!pairs.length) return "";
  const pts = [];
  const idx = [];
  for (const seg of pairs) {
    const n0 = pts.length;
    for (const p of seg) pts.push(`${num(p[0])} ${num(p[1])} ${num(p[2])}`);
    idx.push(`${n0} ${n0 + 1} -1`);
  }
  return `DEF ${name} Shape {
      appearance Appearance { material Material { emissiveColor ${num(color[0])} ${num(color[1])} ${num(color[2])} } }
      geometry IndexedLineSet {
        coord Coordinate { point [ ${pts.join(", ")} ] }
        coordIndex [ ${idx.join(" ")} ]
      }
    }`;
}

export const VRML_KIND_COLOR = {
  classroom: [0.86, 0.8, 0.66],
  admin: [0.72, 0.38, 0.3],
  gym: [0.78, 0.8, 0.83],
  hall: [0.66, 0.55, 0.44],
  annex: [0.8, 0.78, 0.72],
  portable: [0.6, 0.66, 0.7],
  shed: [0.55, 0.58, 0.6],
  canopy: [0.9, 0.9, 0.92],
  amphitheater: [0.75, 0.7, 0.6],
  cafeteria: [0.84, 0.76, 0.55],
  fence: [0.5, 0.55, 0.55],
};

export const VRML_SURFACE_COLOR = {
  yard: [0.28, 0.44, 0.22],
  field: [0.3, 0.5, 0.24],
  court: [0.42, 0.36, 0.5],
  track: [0.62, 0.34, 0.22],
  parking: [0.42, 0.43, 0.44],
  road: [0.3, 0.31, 0.32],
  path: [0.62, 0.58, 0.5],
  plaza: [0.55, 0.53, 0.48],
  interior: [0.75, 0.72, 0.66],
};

export const VRML_ROAD_COLOR = {
  road: [0.22, 0.23, 0.24],
  aisle: [0.26, 0.27, 0.28],
  path: [0.66, 0.62, 0.54],
  runway: [0.7, 0.3, 0.2],
};

export const GHS_VRML_LAYERS = [
  { id: "ground", label: "GROUND" },
  { id: "buildings", label: "BUILDINGS" },
  { id: "areas", label: "FIELDS" },
  { id: "roads", label: "ROADS" },
  { id: "trees", label: "TREES" },
  { id: "outline", label: "OUTLINE" },
  { id: "anchors", label: "ANCHORS" },
];

export function defaultVrmlLayers() {
  return Object.fromEntries(GHS_VRML_LAYERS.map((l) => [l.id, true]));
}

/** Slugify a name for use in a VRML DEF identifier. */
export function defName(prefix, raw) {
  const s = String(raw || "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return `${prefix}_${s || "N"}`.slice(0, 60);
}

/**
 * @param {object} model from buildModel()
 * @param {object} opts { layers, title, grid, wire }
 * @returns {string} VRML 2.0 document
 */
export function campusToVrml(model, opts = {}) {
  const L = { ...defaultVrmlLayers(), ...(opts.layers || {}) };
  const grid = opts.grid ?? 26;
  const title = opts.title || `${model.site.name} — SITE-K VRML reconstruction`;
  const parts = [];

  parts.push(`#VRML V2.0 utf8
# ${title}
# ${model.site.address}
# geometry: ${model.site.source}
# generator: SITE-K ghs-vrml.js · ${new Date().toISOString()}
# stats: ${model.stats.buildings} buildings, ${model.stats.areas} fields, ${model.stats.roads} ways, ${model.stats.trees} trees
# extents: ${num(model.stats.widthM, 1)} m × ${num(model.stats.depthM, 1)} m, elevation ${num(model.stats.zMin, 1)}–${num(model.stats.zMax, 1)} m MSL

WorldInfo {
  title "${title}"
  info [ "OpenStreetMap ODbL", "Glendora High School campus", "SITE-K HTML5 exporter", "Doom WAD / Duke3D Build / Wolf3D JS siblings" ]
}

Background { skyColor [ 0.52 0.68 0.86 ] groundColor [ 0.30 0.34 0.26 ] }
NavigationInfo { type [ "EXAMINE" "ANY" ] headlight TRUE }

DirectionalLight { direction -0.35 -1 -0.45 color 1 0.96 0.88 intensity 0.85 }
DirectionalLight { direction 0.55 -0.35 0.6 color 0.6 0.72 0.95 intensity 0.3 }
`);

  const groups = [];

  if (L.ground) {
    const { minX, minY, maxX, maxY } = model.bounds;
    const coord = [];
    const index = [];
    const gx = grid + 1;
    for (let j = 0; j <= grid; j++) {
      for (let i = 0; i <= grid; i++) {
        const x = minX + ((maxX - minX) * i) / grid;
        const y = minY + ((maxY - minY) * j) / grid;
        const [vx, vz] = toVrmlXZ(x, y);
        coord.push(vx, model.ground(x, y), vz);
      }
    }
    for (let j = 0; j < grid; j++) {
      for (let i = 0; i < grid; i++) {
        const a = j * gx + i;
        const b = a + 1;
        const c = a + gx;
        const d = c + 1;
        index.push(a, c, b, -1, b, c, d, -1);
      }
    }
    const pts = [];
    for (let i = 0; i + 2 < coord.length; i += 3) pts.push(`${num(coord[i])} ${num(coord[i + 1])} ${num(coord[i + 2])}`);
    groups.push(`DEF LAYER_GROUND Transform {
    children [
      DEF MESH_TERRAIN Shape {
        appearance Appearance {
          material Material { diffuseColor 0.26 0.42 0.21 specularColor 0.05 0.05 0.05 }
        }
        geometry IndexedFaceSet {
          solid FALSE
          creaseAngle 1.2
          coord Coordinate { point [ ${pts.join(", ")} ] }
          coordIndex [ ${index.join(" ")} ]
        }
      }
    ]
  }`);
  }

  if (L.areas) {
    const kids = model.areas.map((a) => {
      const mesh = flatRing(a.ring, (x, y) => model.ground(x, y), 0.05);
      const color = VRML_SURFACE_COLOR[a.kind] || VRML_SURFACE_COLOR.yard;
      return meshNode(defName("AREA", a.id), color, mesh, { crease: 0.5 });
    });
    groups.push(`DEF LAYER_AREAS Group {
    children [
  ${kids.join("\n  ")}
    ]
  }`);
  }

  if (L.roads) {
    const kids = [];
    for (const r of model.roads) {
      if (r.ribbon.length < 8) continue;
      const mesh = flatRing(r.ribbon, (x, y) => model.ground(x, y), 0.08);
      const color = VRML_ROAD_COLOR[r.kind] || VRML_ROAD_COLOR.road;
      kids.push(meshNode(defName("WAY", r.id), color, mesh, { crease: 0.5 }));
    }
    groups.push(`DEF LAYER_ROADS Group {
    children [
  ${kids.join("\n  ")}
    ]
  }`);
  }

  if (L.buildings) {
    const kids = model.buildings.map((b) => {
      const mesh = extrudeRing(b.ring, b.base, b.h);
      const color = VRML_KIND_COLOR[b.kind] || VRML_KIND_COLOR.classroom;
      return meshNode(defName("BLD", b.id), color, mesh, { crease: 0.9 });
    });
    groups.push(`DEF LAYER_BUILDINGS Group {
    children [
  ${kids.join("\n  ")}
    ]
  }`);
  }

  if (L.trees) {
    const kids = model.trees.map((t, i) => {
      const [vx, vz] = toVrmlXZ(t.x, t.y);
      const green = t.kind === "palm" ? "0.32 0.52 0.24" : "0.18 0.4 0.16";
      return `DEF TREE_${i} Transform {
      translation ${num(vx)} ${num(t.base + t.h * 0.5)} ${num(vz)}
      children [
        Shape {
          appearance Appearance { material Material { diffuseColor ${green} } }
          geometry Cone { bottomRadius ${num(t.r)} height ${num(t.h)} }
        }
      ]
    }`;
    });
    groups.push(`DEF LAYER_TREES Group {
    children [
  ${kids.join("\n  ")}
    ]
  }`);
  }

  if (L.outline) {
    const pts = [];
    const idx = [];
    const n = model.campus.length / 2;
    for (let i = 0; i < n; i++) {
      const [vx, vz] = toVrmlXZ(model.campus[i * 2], model.campus[i * 2 + 1]);
      pts.push(`${num(vx)} ${num(model.ground(model.campus[i * 2], model.campus[i * 2 + 1]) + 0.15)} ${num(vz)}`);
    }
    for (let i = 0; i < n; i++) idx.push(`${i} ${(i + 1) % n} -1`);
    groups.push(`DEF LAYER_OUTLINE Transform {
    children [
      DEF LINE_CAMPUS Shape {
        appearance Appearance { material Material { emissiveColor 1 0.68 0.14 } }
        geometry IndexedLineSet {
          coord Coordinate { point [ ${pts.join(", ")} ] }
          coordIndex [ ${idx.join(" ")} ]
        }
      }
    ]
  }`);
  }

  if (L.anchors) {
    const [ex, ez] = toVrmlXZ(model.entry.x, model.entry.y);
    groups.push(`DEF LAYER_ANCHORS Group {
    children [
      DEF ANCHOR_PLAYER_START Transform {
        translation ${num(ex)} ${num(model.ground(model.entry.x, model.entry.y) + 0.6)} ${num(ez)}
        children [
          Shape {
            appearance Appearance { material Material { emissiveColor 0.2 1 0.55 } }
            geometry Box { size 1.6 1.2 1.6 }
          }
        ]
      }
    ]
  }`);
  }

  parts.push(`DEF GHS_CAMPUS Group {
  children [
  ${groups.join("\n  ")}
  ]
}`);

  return parts.join("\n") + "\n";
}

/** Small helper so the UI can offer a text download without touching the DOM here. */
export function vrmlStats(wrl) {
  return {
    bytes: new TextEncoder().encode(wrl).length,
    lines: wrl.split("\n").length,
    shapes: (wrl.match(/Shape\s*\{/g) || []).length,
    defs: (wrl.match(/DEF\s+[A-Za-z0-9_]+\s+(Shape|Transform|Group)\s*\{/g) || []).length,
  };
}
