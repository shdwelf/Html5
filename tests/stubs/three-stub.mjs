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
export class SphereGeometry extends BufferGeometry {}
export class BoxGeometry extends BufferGeometry {}
export class OctahedronGeometry extends BufferGeometry {}
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
