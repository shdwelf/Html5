/**
 * lens-3d.js — WebGL layer builders for the keyspace lenses.
 *
 * Keys are placed with the canonical projection from spacefill.js: the top 21
 * entropy bits de-interleaved into a 128³ Morton grid. In that projection the
 * Hamming geometry of the prefix is honest — an affine subcube between two keys
 * really is an axis-aligned box.
 */

import * as THREE from "../vendor/three.module.min.js";
import { keyProjection } from "./spacefill.js";
import { invertReport, notBytes, differentialProfile, influenceMatrix, reachabilityFixpoint, lcg } from "./formal.js";

const SCALE = 3.1;

function pt(bytes) {
  const p = keyProjection(bytes, 7);
  return new THREE.Vector3((p.x * 2 - 1) * SCALE, (p.y * 2 - 1) * SCALE, (p.z * 2 - 1) * SCALE);
}

function points(arr, color, size = 0.06, opacity = 0.95) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true })
  );
}

function polyline(arr, color, opacity = 0.9) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function marker(v, color, r = 0.09) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), new THREE.MeshBasicMaterial({ color }));
}

function at(mesh, v) {
  mesh.position.copy(v);
  return mesh;
}

function wireBox(a, b, color) {
  const g = new THREE.Group();
  const min = new THREE.Vector3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
  const max = new THREE.Vector3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
  const corners = [];
  for (let i = 0; i < 8; i++) {
    corners.push(
      new THREE.Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z)
    );
  }
  const edges = [
    [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
  ];
  for (const [i, j] of edges) {
    g.add(polyline([corners[i].x, corners[i].y, corners[i].z, corners[j].x, corners[j].y, corners[j].z], color, 0.75));
  }
  return g;
}

function flipSequence(A, B, limit) {
  const path = [Uint8Array.from(A)];
  let cur = Uint8Array.from(A);
  for (let byte = 0; byte < Math.min(A.length, B.length); byte++) {
    for (let b = 7; b >= 0; b--) {
      const idx = byte * 8 + (7 - b);
      if (limit && idx >= limit) continue;
      if (((A[byte] >> b) & 1) !== ((B[byte] >> b) & 1)) {
        const next = Uint8Array.from(cur);
        next[byte] ^= 1 << b;
        path.push(next);
        cur = next;
      }
    }
  }
  return path;
}

export function buildLensLayer(id, data) {
  const g = new THREE.Group();
  g.name = `lens:${id}`;
  const A = data.entropy;
  const B = data.pairEntropy;

  if (id === "inv-subcube") {
    if (!A || !B) return null;
    const a = pt(A);
    const b = pt(B);
    g.add(at(marker(a, 0x5ce1ff), a));
    g.add(at(marker(b, 0x3dffb0), b));
    g.add(wireBox(a, b, 0xffb020));
    // sample corners of the projected box: keys that share A's prefix except on
    // the differing prefix bits
    const r = invertReport(A, B);
    const prefixDiffs = r.differing.filter((i) => i < 21).slice(0, 10);
    const arr = [];
    const count = Math.min(512, 1 << prefixDiffs.length);
    for (let s = 0; s < count; s++) {
      const k = Uint8Array.from(A);
      prefixDiffs.forEach((bit, j) => {
        if ((s >> j) & 1) k[bit >> 3] ^= 1 << (7 - (bit & 7));
      });
      const p = pt(k);
      arr.push(p.x, p.y, p.z);
    }
    g.add(points(arr, 0xffb020, 0.05, 0.7));
  }

  if (id === "inv-geodesic") {
    if (!A || !B) return null;
    const path = flipSequence(A, B, 21);
    const arr = [];
    path.forEach((k) => {
      const p = pt(k);
      arr.push(p.x, p.y, p.z);
    });
    g.add(polyline(arr, 0x3dffb0));
    g.add(points(arr, 0x3dffb0, 0.07));
    g.add(at(marker(pt(A), 0x5ce1ff, 0.11), pt(A)));
    g.add(at(marker(pt(B), 0xffb020, 0.11), pt(B)));
  }

  if (id === "inv-complement") {
    if (!A) return null;
    const a = pt(A);
    const na = pt(notBytes(A));
    g.add(at(marker(a, 0x5ce1ff), a));
    g.add(at(marker(na, 0xff5d6c), na));
    g.add(polyline([a.x, a.y, a.z, na.x, na.y, na.z], 0xff5d6c, 0.6));
    if (B) {
      const b = pt(B);
      const nb = pt(notBytes(B));
      g.add(at(marker(b, 0x3dffb0), b));
      g.add(at(marker(nb, 0xffb020, 0.07), nb));
      g.add(polyline([b.x, b.y, b.z, nb.x, nb.y, nb.z], 0xffb020, 0.4));
    }
  }

  if (id === "inv-shell") {
    if (!A || !B) return null;
    const a = pt(A);
    const r = invertReport(A, B);
    const radius = 0.35 + (r.d / Math.max(1, r.entBits)) * SCALE * 2;
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(Math.min(radius, SCALE * 1.6), 20, 14),
      new THREE.MeshBasicMaterial({ color: 0x5ce1ff, wireframe: true, transparent: true, opacity: 0.18 })
    );
    shell.position.copy(a);
    g.add(shell);
    g.add(at(marker(a, 0x5ce1ff, 0.1), a));
    g.add(at(marker(pt(B), 0x3dffb0, 0.1), pt(B)));
  }

  if (id === "differential") {
    const p = differentialProfile(data.flips);
    if (!p) return null;
    const arr = [];
    const sizes = [];
    p.grad.forEach((v, i) => {
      const x = (i / Math.max(1, p.grad.length - 1) - 0.5) * SCALE * 2;
      arr.push(x, -2.4, v * 0.5);
      sizes.push(v);
    });
    g.add(points(arr, 0xffb020, 0.08));
    // analytic prediction: chunk boundaries every 11 bits
    const ticks = [];
    for (let i = 0; i < p.grad.length; i += 11) {
      const x = (i / Math.max(1, p.grad.length - 1) - 0.5) * SCALE * 2;
      ticks.push(x, -2.4, 0, x, -2.1, 0);
    }
    g.add(polyline(ticks, 0x163246, 0.8));
  }

  if (id === "modal-mu") {
    const n = data.layout?.entBits ?? 128;
    const r = reachabilityFixpoint(Math.min(n, 1024), 4);
    for (let k = 1; k <= 4; k++) {
      const radius = (k / 4) * SCALE * 1.1;
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 18, 12),
        new THREE.MeshBasicMaterial({
          color: k === 1 ? 0x3dffb0 : 0x5ce1ff,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
        })
      );
      g.add(shell);
    }
    void r;
  }

  if (id === "influence") {
    const inf = influenceMatrix(data.flips, data.words?.length || 0);
    if (!inf) return null;
    const arr = [];
    const rows = Math.min(12, inf.words);
    const cols = Math.min(64, inf.bits);
    const stride = Math.ceil(inf.bits / cols);
    for (let w = 0; w < rows; w++) {
      for (let b = 0; b < cols; b++) {
        // clamp: cols*stride can overshoot the bit count, and a Float64Array
        // read past the end is undefined — !(v > 0) drops it (NaN-safe).
        const v = inf.rows[w][Math.min(b * stride, inf.bits - 1)];
        if (!(v > 0)) continue;
        arr.push((b / cols - 0.5) * SCALE * 2, (w / rows - 0.5) * SCALE * 2, v * 2);
      }
    }
    g.add(points(arr, 0xffb020, 0.07, 0.85));
  }

  if (id === "stochastic") {
    const rnd = lcg(0x5eed);
    const arr = [];
    const n = 600;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const r = Math.pow(rnd(), 1 / 3) * SCALE * 1.2;
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      arr.push(
        r * Math.sin(phi) * Math.cos(theta) * (0.4 + t),
        r * Math.cos(phi) * (0.4 + t),
        r * Math.sin(phi) * Math.sin(theta) * (0.4 + t)
      );
    }
    g.add(points(arr, 0x5ce1ff, 0.045, 0.45));
  }

  if (id === "vector") {
    const path = data.path;
    if (!path || path.length < 3) return null;
    const arr = [];
    path.forEach((p) => arr.push(p[0] * SCALE, p[1] * SCALE, p[2] * SCALE));
    g.add(polyline(arr, 0x5ce1ff, 0.55));
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i - 1];
      const b = path[i];
      const c = path[i + 1];
      const u = [0, 1, 2].map((k) => b[k] - a[k]);
      const v = [0, 1, 2].map((k) => c[k] - b[k]);
      const nu = Math.hypot(...u) || 1;
      const nv = Math.hypot(...v) || 1;
      const cos = Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (nu * nv)));
      if (Math.acos(cos) < 0.6) continue;
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffb020 })
      );
      m.position.set(b[0] * SCALE, b[1] * SCALE, b[2] * SCALE);
      g.add(m);
    }
  }

  if (id === "process" || id === "pi") {
    const stages = 8;
    const arr = [];
    for (let i = 0; i < stages; i++) {
      const a = (i / stages) * Math.PI * 2;
      const x = Math.cos(a) * SCALE * 0.8;
      const z = Math.sin(a) * SCALE * 0.8;
      const y = (i / stages - 0.5) * SCALE;
      arr.push(x, y, z);
      const node = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.14),
        new THREE.MeshBasicMaterial({ color: i === stages - 1 ? 0x3dffb0 : 0x5ce1ff })
      );
      node.position.set(x, y, z);
      g.add(node);
    }
    for (let i = 0; i < stages - 1; i++) {
      g.add(
        polyline(
          [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2], arr[i * 3 + 3], arr[i * 3 + 4], arr[i * 3 + 5]],
          0xffb020,
          0.6
        )
      );
    }
  }

  return g.children.length ? g : null;
}

export const LENS_3D = [
  "inv-subcube",
  "inv-geodesic",
  "inv-complement",
  "inv-shell",
  "differential",
  "modal-mu",
  "influence",
  "stochastic",
  "vector",
  "process",
  "pi",
];
