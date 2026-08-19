import * as THREE from "../vendor/three.module.min.js";
import { curveTable } from "./spacefill.js";
import { PURPOSES, COINS } from "./hdtopo.js";

function mix(bytes, i, j) {
  const a = bytes?.[i % (bytes?.length || 1)] ?? 1;
  const b = bytes?.[j % (bytes?.length || 1)] ?? 2;
  return ((a * 73 + b * 157 + i * 19) & 255) / 255;
}

function ptsFrom(arr, color, size = 0.04) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85 })
  );
}

function lineFrom(arr, color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
}

export function buildForm(name, { entropy, indices, checksumBits }) {
  const g = new THREE.Group();
  const e = entropy || new Uint8Array(16);
  const idx = indices || [];

  if (name === "hd") {
    const root = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x3dffb0 })
    );
    g.add(root);
    PURPOSES.forEach((p, i) => {
      const a = (i / PURPOSES.length) * Math.PI * 2;
      const x = Math.cos(a) * 1.6;
      const z = Math.sin(a) * 1.6;
      g.add(lineFrom([0, 0, 0, x, 0.8, z], 0x5ce1ff));
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x5ce1ff })
      );
      box.position.set(x, 0.8, z);
      g.add(box);
      COINS.slice(0, 4).forEach((c, j) => {
        const b = a + (j - 1.5) * 0.18;
        const x2 = Math.cos(b) * 2.6;
        const z2 = Math.sin(b) * 2.6;
        const y2 = 1.4 + j * 0.15;
        g.add(lineFrom([x, 0.8, z, x2, y2, z2], 0xffb020));
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffb020 })
        );
        m.position.set(x2, y2, z2);
        g.add(m);
      });
    });
  }

  if (name === "curve") {
    const arr = [];
    for (let t = -1.6; t <= 1.6; t += 0.02) {
      const x = t;
      const inner = x * x * x + 7 / 40;
      if (inner < 0) continue;
      const y = Math.sqrt(inner) * 0.45;
      arr.push(x, y, 0, x, -y, 0);
    }
    g.add(lineFrom(arr, 0x7ecbff));
    const k = mix(e, 0, 1);
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x3dffb0 })
    );
    bead.position.set((k - 0.5) * 2.8, Math.sin(k * 6) * 0.6, 0);
    g.add(bead);
  }

  if (name === "sphere") {
    const n = 256;
    const arr = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const t = Math.PI * (3 - Math.sqrt(5)) * i + mix(e, i, 3);
      arr.push(Math.cos(t) * r * 2.2, y * 2.2, Math.sin(t) * r * 2.2);
    }
    g.add(ptsFrom(arr, 0x5ce1ff, 0.05));
  }

  if (name === "constellation") {
    COINS.forEach((c, i) => {
      const a = (i / COINS.length) * Math.PI * 2 + mix(e, i, 4);
      const r = 1.4 + mix(e, i, 5);
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12),
        new THREE.MeshBasicMaterial({ color: 0xffb020 })
      );
      m.position.set(Math.cos(a) * r, (mix(e, i, 6) - 0.5) * 1.4, Math.sin(a) * r);
      g.add(m);
    });
    g.add(ptsFrom(fibNoise(e, 400, 3.2), 0x163246, 0.02));
  }

  if (name === "torus") {
    const arr = [];
    const R = 1.6;
    const r = 0.55;
    for (let i = 0; i < 512; i++) {
      const u = (i / 256) * Math.PI * 2;
      const v = ((i % 256) / 256) * Math.PI * 2 + mix(e, i, 0);
      arr.push(
        (R + r * Math.cos(v)) * Math.cos(u),
        r * Math.sin(v),
        (R + r * Math.cos(v)) * Math.sin(u)
      );
    }
    g.add(ptsFrom(arr, 0x3dffb0, 0.035));
  }

  if (name === "lattice") {
    const arr = [];
    idx.forEach((id, i) => {
      const x = ((id % 16) / 15 - 0.5) * 4;
      const y = (Math.floor(id / 16) % 16) / 15 * 2 - 0.5;
      const z = (i / Math.max(1, idx.length - 1) - 0.5) * 3;
      arr.push(x, y, z);
    });
    if (arr.length) {
      g.add(lineFrom(arr, 0x3dffb0));
      g.add(ptsFrom(arr, 0x5ce1ff, 0.1));
    }
  }

  if (name === "hilbert") {
    const { n, xs, ys } = curveTable("hilbert", 6);
    const arr = [];
    for (let i = 0; i < n * n; i += 2) {
      arr.push((xs[i] / n - 0.5) * 4, Math.sin(i / 40) * 0.4, (ys[i] / n - 0.5) * 4);
    }
    g.add(lineFrom(arr, 0x7ecbff));
  }

  if (name === "funnel") {
    for (let i = 0; i < 8; i++) {
      const y = 2 - i * 0.5;
      const rad = 2.2 - i * 0.24;
      const ring = [];
      for (let a = 0; a <= 32; a++) {
        const t = (a / 32) * Math.PI * 2;
        ring.push(Math.cos(t) * rad, y, Math.sin(t) * rad);
      }
      g.add(lineFrom(ring, i < 4 ? 0x5ce1ff : 0xffb020));
    }
  }

  if (name === "checksum") {
    const cs = checksumBits || 4;
    g.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 24, 16),
        new THREE.MeshBasicMaterial({ color: 0x12202c, wireframe: true })
      )
    );
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffb020, wireframe: true, transparent: true, opacity: 0.35 })
    );
    shell.scale.setScalar(1 + cs / 32);
    g.add(shell);
  }

  if (name === "birthday") {
    g.add(ptsFrom(fibNoise(e, 300, 1.2).map((v, i) => (i % 3 === 0 ? v - 1.4 : v)), 0x5ce1ff, 0.04));
    g.add(ptsFrom(fibNoise(e, 300, 1.2).map((v, i) => (i % 3 === 0 ? v + 1.4 : v)), 0xff5d6c, 0.04));
  }

  if (name === "cascade") {
    const arr = [];
    for (let i = 0; i < 128; i++) {
      arr.push(((i % 16) - 7.5) * 0.22, 2 - Math.floor(i / 16) * 0.45, mix(e, i, 1) - 0.5);
    }
    g.add(ptsFrom(arr, 0x5ce1ff, 0.07));
  }

  if (name === "hamming") {
    for (let s = 1; s <= 5; s++) {
      g.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.45 * s, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0x5ce1ff, wireframe: true, transparent: true, opacity: 0.2 })
        )
      );
    }
    const wt = e[0] ? countBits(e[0]) : 3;
    const mark = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x3dffb0 })
    );
    mark.position.set(0.45 * Math.min(5, wt + 1), 0, 0);
    g.add(mark);
  }

  if (name === "towers") {
    [40, 64, 80, 128, 256].forEach((b, i) => {
      const h = Math.log2(b) * 0.35;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, h, 0.35),
        new THREE.MeshBasicMaterial({ color: b === (e.length * 8) ? 0x3dffb0 : 0x163246 })
      );
      mesh.position.set((i - 2) * 0.7, h / 2 - 1, 0);
      g.add(mesh);
    });
  }

  return g;
}

function fibNoise(e, n, scale) {
  const arr = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / n) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = phi * i + mix(e, i, 8);
    arr.push(Math.cos(t) * r * scale, y * scale, Math.sin(t) * r * scale);
  }
  return arr;
}

function countBits(v) {
  let n = 0;
  for (let x = v; x; x >>= 1) n += x & 1;
  return n;
}

export const FORMS = [
  ["hd", "HD derivation topology"],
  ["curve", "Elliptic curve manifold"],
  ["sphere", "256-bit entropy sphere"],
  ["constellation", "Multi-coin constellation"],
  ["torus", "Entropy torus (512-bit seed)"],
  ["lattice", "Word lattice"],
  ["hilbert", "Hilbert ribbon"],
  ["funnel", "Address funnel"],
  ["checksum", "Checksum shell"],
  ["birthday", "Birthday surface"],
  ["cascade", "Bit cascade"],
  ["hamming", "Hamming shells"],
  ["towers", "Scale towers"],
];
