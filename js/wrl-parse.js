/**
 * Tiny VRML 2.0 reader — the subset the SITE-K exporters emit plus the
 * common extras (Transform/Group/Shape/Appearance/Material, the Indexed*
 * geometry nodes, Box/Cone/Cylinder/Sphere/PointSet, DEF/USE, lights,
 * Background, NavigationInfo, WorldInfo).
 *
 * The point of this module is that glendora.html does not cheat: it writes
 * a real .wrl file and then renders *the parsed file*, so the download and
 * the on-screen model cannot drift apart.
 *
 * Pure module: no DOM.
 */

const IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/;

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "#") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === '"' ) {
      let j = i + 1;
      let s = "";
      while (j < n && src[j] !== '"') {
        if (src[j] === "\\") {
          s += src[j + 1] || "";
          j += 2;
        } else {
          s += src[j++];
        }
      }
      tokens.push({ t: "str", v: s });
      i = j + 1;
      continue;
    }
    if ("{}[]".includes(c)) {
      tokens.push({ t: c });
      i++;
      continue;
    }
    if (c === ",") {
      i++;
      continue; // commas are whitespace in VRML
    }
    if (/[\s]/.test(c)) {
      i++;
      continue;
    }
    const m = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i, i + 40));
    if (m) {
      tokens.push({ t: "num", v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    const idm = IDENT_RE.exec(src.slice(i, i + 80));
    if (idm) {
      tokens.push({ t: "id", v: idm[0] });
      i += idm[0].length;
      continue;
    }
    i++; // unknown char — skip
  }
  return tokens;
}

/** SFVec3f / SFVec4f / SFColor fields, which VRML allows unbracketed. */
const FIELD_ARITY = {
  translation: 3,
  scale: 3,
  center: 3,
  size: 3,
  direction: 3,
  diffuseColor: 3,
  emissiveColor: 3,
  specularColor: 3,
  ambientIntensity: 1,
  rotation: 4,
  centerOfRotation: 3,
  bboxSize: 3,
  bboxCenter: 3,
};

/** Multi-valued numeric fields, which may also be written unbracketed. */
const MULTI_FIELDS = new Set([
  "point",
  "coordIndex",
  "colorIndex",
  "normalIndex",
  "creaseAngle",
  "texCoordIndex",
]);

/** Parse a VRML document into a node tree. */
export function parseVrml(src) {
  const toks = tokenize(String(src));
  let p = 0;

  const peek = (k = 0) => toks[p + k];
  const eat = () => toks[p++];

  function parseValue() {
    const tok = peek();
    if (!tok) return null;
    if (tok.t === "num") {
      eat();
      return tok.v;
    }
    if (tok.t === "str") {
      eat();
      return tok.v;
    }
    if (tok.t === "[") {
      eat();
      const arr = [];
      while (peek() && peek().t !== "]") arr.push(parseValue());
      if (peek()?.t === "]") eat();
      return arr;
    }
    if (tok.t === "id") {
      if (tok.v === "TRUE") {
        eat();
        return true;
      }
      if (tok.v === "FALSE") {
        eat();
        return false;
      }
      if (tok.v === "NULL") {
        eat();
        return null;
      }
      if (tok.v === "USE") {
        eat();
        const nameTok = eat();
        return { type: "USE", name: nameTok?.v || "" };
      }
      return parseNode();
    }
    eat();
    return null;
  }

  function parseNumberList() {
    const out = [];
    while (peek()?.t === "num") out.push(eat().v);
    return out;
  }

  function parseFieldValue(name) {
    const arity = FIELD_ARITY[name];
    if (arity && peek()?.t === "num") {
      const nums = parseNumberList();
      if (nums.length >= arity) {
        // push back any surplus so the next field still parses
        for (let i = nums.length - 1; i >= arity; i--) toks[--p] = { t: "num", v: nums[i] };
        return arity === 1 ? nums[0] : nums.slice(0, arity);
      }
      return nums;
    }
    if (MULTI_FIELDS.has(name) && peek()?.t === "num") return parseNumberList();
    return parseValue();
  }

  function parseNode() {
    const head = eat();
    if (!head || head.t !== "id") return null;
    let name = null;
    let type = head.v;
    if (type === "DEF") {
      const nm = eat();
      name = nm?.v || null;
      const t = eat();
      type = t?.v || "Unknown";
    }
    const node = { type, name, fields: {} };
    if (peek()?.t === "{") {
      eat();
      while (peek() && peek().t !== "}") {
        const f = eat();
        if (f.t !== "id") continue;
        node.fields[f.v] = parseFieldValue(f.v);
      }
      if (peek()?.t === "}") eat();
    } else if (peek()?.t === "[") {
      // prototype/interface style body — capture loosely
      node.fields.__body = parseValue();
    }
    return node;
  }

  const roots = [];
  while (p < toks.length) {
    const tok = peek();
    if (tok.t === "id") {
      const node = parseNode();
      if (node) roots.push(node);
    } else {
      eat();
    }
  }
  return roots;
}

/* ------------------------------------------------------------------ *
 * Scene-graph flattening → render primitives
 * ------------------------------------------------------------------ */

function matIdentity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function matMul(a, b) {
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
    }
  }
  return o;
}

function transformMatrix(fields) {
  const t = fields.translation || [0, 0, 0];
  const s = fields.scale || [1, 1, 1];
  const c = fields.center || [0, 0, 0];
  const rot = fields.rotation || [0, 0, 1, 0];
  const [ax, ay, az, ang] = rot.length >= 4 ? rot : [0, 0, 1, 0];
  const len = Math.hypot(ax, ay, az) || 1;
  const x = ax / len, y = ay / len, z = az / len;
  const co = Math.cos(ang);
  const si = Math.sin(ang);
  const R = [
    x * x * (1 - co) + co, x * y * (1 - co) - z * si, x * z * (1 - co) + y * si, 0,
    y * x * (1 - co) + z * si, y * y * (1 - co) + co, y * z * (1 - co) - x * si, 0,
    z * x * (1 - co) - y * si, z * y * (1 - co) + x * si, z * z * (1 - co) + co, 0,
    0, 0, 0, 1,
  ];
  const S = [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, 0, 0, 0, 1];
  const T = matIdentity();
  T[12] = t[0];
  T[13] = t[1];
  T[14] = t[2];
  const C1 = matIdentity();
  C1[12] = c[0];
  C1[13] = c[1];
  C1[14] = c[2];
  const C2 = matIdentity();
  C2[12] = -c[0];
  C2[13] = -c[1];
  C2[14] = -c[2];
  return matMul(T, matMul(C1, matMul(R, matMul(S, C2))));
}

function applyMat(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

/** Tessellate the primitive geometry nodes into triangles. */
function primitiveMesh(geo) {
  const type = geo.type;
  if (type === "Box") {
    const [sx, sy, sz] = geo.fields.size || [2, 2, 2];
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v = [
      [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
      [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
    ];
    const f = [
      [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3],
    ];
    const index = [];
    for (const q of f) index.push(q[0], q[1], q[2], q[0], q[2], q[3]);
    return { coord: v.flat(), index };
  }
  if (type === "Cone" || type === "Cylinder") {
    const r = geo.fields.bottomRadius ?? geo.fields.radius ?? 1;
    const rt = type === "Cylinder" ? (geo.fields.radius ?? 1) : 0;
    const h = geo.fields.height ?? 2;
    const seg = 14;
    const coord = [];
    const index = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const b0 = coord.length / 3;
      coord.push(Math.cos(a0) * r, -h / 2, Math.sin(a0) * r);
      coord.push(Math.cos(a1) * r, -h / 2, Math.sin(a1) * r);
      coord.push(Math.cos(a1) * rt, h / 2, Math.sin(a1) * rt);
      coord.push(Math.cos(a0) * rt, h / 2, Math.sin(a0) * rt);
      index.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
    }
    return { coord, index };
  }
  if (type === "Sphere") {
    const r = geo.fields.radius ?? 1;
    const seg = 12;
    const rings = 8;
    const coord = [];
    const index = [];
    for (let j = 0; j <= rings; j++) {
      const v = (j / rings) * Math.PI;
      for (let i = 0; i <= seg; i++) {
        const u = (i / seg) * Math.PI * 2;
        coord.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u));
      }
    }
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const a = j * (seg + 1) + i;
        const b = a + 1;
        const c = a + seg + 1;
        const d = c + 1;
        index.push(a, c, b, b, c, d);
      }
    }
    return { coord, index };
  }
  return null;
}

function materialOf(shape) {
  const app = shape.fields.appearance;
  const mat = app && app.type === "Appearance" ? app.fields.material : null;
  const m = mat && mat.fields ? mat.fields : {};
  const diff = m.diffuseColor ?? [0.8, 0.8, 0.8];
  const emis = m.emissiveColor ?? [0, 0, 0];
  const color = [
    Math.min(1, (Array.isArray(diff) ? diff[0] : diff) + (Array.isArray(emis) ? emis[0] : emis)),
    Math.min(1, (Array.isArray(diff) ? diff[1] : diff) + (Array.isArray(emis) ? emis[1] : emis)),
    Math.min(1, (Array.isArray(diff) ? diff[2] : diff) + (Array.isArray(emis) ? emis[2] : emis)),
  ];
  return { color, transparency: m.transparency || 0, specular: m.specularColor || [0, 0, 0] };
}

/**
 * Walk the parsed graph and emit render-ready primitives.
 * @returns {{meshes:Array,lines:Array,points:Array,named:Object,stats:object}}
 */
export function flattenVrml(roots) {
  const defs = new Map();
  const meshes = [];
  const lines = [];
  const points = [];
  const named = {};
  let shapeCount = 0;
  let triCount = 0;

  const register = (node) => {
    if (node && node.name) defs.set(node.name, node);
  };

  const walk = (node, mat, path) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "USE") {
      const target = defs.get(node.name);
      if (target) walk(target, mat, path);
      return;
    }
    register(node);

    let nextMat = mat;
    if (node.type === "Transform") nextMat = matMul(mat, transformMatrix(node.fields));

    if (node.name) named[node.name] = node.type;

    if (node.type === "Shape") {
      shapeCount++;
      const geo = node.fields.geometry;
      const appearance = materialOf(node);
      if (!geo) return;
      const here = path.concat(node.name ? [node.name] : []);
      if (geo.type === "IndexedFaceSet") {
        const coords = geo.fields.coord?.fields?.point || [];
        const idx = geo.fields.coordIndex || [];
        const positions = [];
        for (let i = 0; i + 2 < coords.length; i += 3) {
          positions.push(...applyMat(nextMat, coords[i], coords[i + 1], coords[i + 2]));
        }
        const index = [];
        for (const v of idx) {
          if (v >= 0) index.push(v);
          else if (index.length) {
            // fan-close the polygon that just ended (VRML faces may be n-gons)
            index.push(-1);
          }
        }
        triCount += index.filter((v) => v === -1).length * 0; // counted below
        meshes.push({ name: node.name || null, path: here, positions, index, appearance, kind: "face" });
        return;
      }
      if (geo.type === "IndexedLineSet") {
        const coords = geo.fields.coord?.fields?.point || [];
        const idx = geo.fields.coordIndex || [];
        const positions = [];
        for (let i = 0; i + 2 < coords.length; i += 3) {
          positions.push(...applyMat(nextMat, coords[i], coords[i + 1], coords[i + 2]));
        }
        lines.push({ name: node.name || null, path: here, positions, index: idx, appearance, kind: "line" });
        return;
      }
      if (geo.type === "PointSet") {
        const coords = geo.fields.coord?.fields?.point || [];
        const positions = [];
        for (let i = 0; i + 2 < coords.length; i += 3) {
          positions.push(...applyMat(nextMat, coords[i], coords[i + 1], coords[i + 2]));
        }
        points.push({ name: node.name || null, path: here, positions, appearance, kind: "point" });
        return;
      }
      const prim = primitiveMesh(geo);
      if (prim) {
        const positions = [];
        for (let i = 0; i + 2 < prim.coord.length; i += 3) {
          positions.push(...applyMat(nextMat, prim.coord[i], prim.coord[i + 1], prim.coord[i + 2]));
        }
        meshes.push({ name: node.name || null, path: here, positions, index: prim.index, appearance, kind: "prim", prim: geo.type });
      }
      return;
    }

    for (const value of Object.values(node.fields)) {
      collect(value, nextMat, path);
    }
  };

  const collect = (value, mat, path) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const v of value) collect(v, mat, path);
      return;
    }
    if (typeof value === "object" && value.type) walk(value, mat, path);
  };

  for (const root of roots) walk(root, matIdentity(), []);

  for (const m of meshes) {
    if (m.kind === "face") {
      // count triangles from the -1 delimited polygons
      let start = 0;
      let polys = 0;
      for (let i = 0; i < m.index.length; i++) {
        if (m.index[i] === -1) {
          polys += Math.max(0, i - start - 2);
          start = i + 1;
        }
      }
      m.triangles = polys;
      triCount += polys;
    } else {
      m.triangles = m.index.length / 3;
      triCount += m.triangles;
    }
  }

  return {
    meshes,
    lines,
    points,
    named,
    stats: {
      meshes: meshes.length,
      lines: lines.length,
      points: points.length,
      shapes: shapeCount,
      triangles: triCount,
      defs: defs.size,
    },
  };
}
