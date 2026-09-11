/** Minimal stand-in for the WebGL backend: geometry maths stay real enough to audit. */
class Obj3D {
  constructor() {
    this.children = [];
    this.position = new Vector3();
    this.scale = { setScalar() {} };
    this.visible = true;
  }
  add(...o) { this.children.push(...o); return this; }
  remove(o) { this.children = this.children.filter((c) => c !== o); return this; }
  traverse(fn) { fn(this); this.children.forEach((c) => c.traverse?.(fn)); }
}
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
}
export class BufferGeometry {
  constructor() { this.attributes = {}; }
  setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  dispose() {}
}
export class Float32BufferAttribute {
  constructor(arr, itemSize) { this.array = Float32Array.from(arr); this.count = this.array.length / itemSize; this.itemSize = itemSize; }
}
function geom(...a) { return new BufferGeometry(...a); }

/**
 * Parametric solids synthesise real vertex data, otherwise a lens whose only
 * geometry is a mesh (inv-shell, modal-mu) audits as "0 verts" and the test
 * cannot tell a wireframe sphere from a layer that drew nothing at all. Counts
 * follow three.js: a SphereGeometry(r, w, h) has (w+1)·(h+1) vertices, a
 * BoxGeometry 24 (four per face), an OctahedronGeometry 18.
 */
class ParametricGeometry extends BufferGeometry {
  constructor(kind, params = {}) {
    super();
    this.parameters = params;
    this.setAttribute("position", new Float32BufferAttribute(points(kind, params), 3));
  }
}
function points(kind, p) {
  const out = [];
  const finite = (v, fallback) => (Number.isFinite(v) ? v : fallback);
  const push = (x, y, z) => out.push(finite(x, 0), finite(y, 0), finite(z, 0));
  const r = finite(p.radius, 1);
  if (kind === "sphere") {
    const w = p.widthSegments ?? 8;
    const h = p.heightSegments ?? 6;
    for (let iy = 0; iy <= h; iy++) {
      const v = (iy / h) * Math.PI;
      for (let ix = 0; ix <= w; ix++) {
        const u = (ix / w) * Math.PI * 2;
        push(-r * Math.cos(u) * Math.sin(v), r * Math.cos(v), r * Math.sin(u) * Math.sin(v));
      }
    }
  } else if (kind === "box") {
    const hx = finite(p.width, 1) / 2, hy = finite(p.height, 1) / 2, hz = finite(p.depth, 1) / 2;
    // 24 vertices: four per face, one face per ±axis.
    for (const ax of ["x", "y", "z"]) {
      const half = { x: hx, y: hy, z: hz }[ax];
      const uAxis = ax === "x" ? "y" : "x";
      const vAxis = ax === "z" ? "y" : "z";
      const uHalf = { x: hx, y: hy, z: hz }[uAxis];
      const vHalf = { x: hx, y: hy, z: hz }[vAxis];
      for (const sign of [-1, 1]) {
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const pt = { [ax]: sign * half, [uAxis]: u * uHalf, [vAxis]: v * vHalf };
          push(pt.x, pt.y, pt.z);
        }
      }
    }
  } else {
    // octahedron: 8 triangular faces × 3 unshared vertices.
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      push(r * sx, 0, 0); push(0, r * sy, 0); push(0, 0, r * sz);
    }
  }
  return out;
}
export class SphereGeometry extends ParametricGeometry {
  constructor(radius = 1, widthSegments = 8, heightSegments = 6) {
    super("sphere", { radius, widthSegments, heightSegments });
  }
}
export class BoxGeometry extends ParametricGeometry {
  constructor(width = 1, height = 1, depth = 1) {
    super("box", { width, height, depth });
  }
}
export class OctahedronGeometry extends ParametricGeometry {
  constructor(radius = 1) { super("octahedron", { radius }); }
}
export class MeshBasicMaterial { constructor(p = {}) { Object.assign(this, p); } dispose() {} }
export class PointsMaterial { constructor(p = {}) { Object.assign(this, p); } dispose() {} }
export class LineBasicMaterial { constructor(p = {}) { Object.assign(this, p); } dispose() {} }
export class Group extends Obj3D { constructor() { super(); this.type = "Group"; } }
export class Scene extends Obj3D { constructor() { super(); this.type = "Scene"; this.fog = null; } }
export class Mesh extends Obj3D { constructor(g, m) { super(); this.type = "Mesh"; this.geometry = g; this.material = m; } }
export class Points extends Obj3D { constructor(g, m) { super(); this.type = "Points"; this.geometry = g; this.material = m; } }
export class Line extends Obj3D { constructor(g, m) { super(); this.type = "Line"; this.geometry = g; this.material = m; } }
export class PerspectiveCamera extends Obj3D {
  constructor(fov, aspect, near, far) { super(); Object.assign(this, { fov, aspect, near, far }); }
  updateProjectionMatrix() {}
}
export class AmbientLight extends Obj3D {}
export class PointLight extends Obj3D {}
export class PolarGridHelper extends Obj3D {}
export class FogExp2 { constructor(c, d) { this.color = c; this.density = d; } }
export class WebGLRenderer {
  constructor(opts = {}) { this.domElement = opts.canvas; this.calls = 0; }
  setPixelRatio() {} setClearColor() {} setSize() {} render() { this.calls++; }
}
export default { Vector3, BufferGeometry, Float32BufferAttribute, SphereGeometry, BoxGeometry, OctahedronGeometry, MeshBasicMaterial, PointsMaterial, LineBasicMaterial, Group, Scene, Mesh, Points, Line, PerspectiveCamera, AmbientLight, PointLight, PolarGridHelper, FogExp2, WebGLRenderer };
/** OrbitControls lives in the same stub module (the hook maps both specifiers here). */
export class OrbitControls extends Obj3D {
  constructor(camera, dom) { super(); this.camera = camera; this.domElement = dom; this.autoRotate = false; }
  addEventListener() {} update() {}
}
