/**
 * GLENDORA HIGH · VRML viewer.
 *
 * Renders a .wrl file that this app wrote: the text is parsed with
 * js/wrl-parse.js and the flattened meshes are handed to three.js.  Nothing
 * here reaches back into the model, so what you see is proof the round trip
 * through VRML 2.0 survived.
 */

import * as THREE from "../vendor/three.module.min.js";
import { parseVrml, flattenVrml } from "./wrl-parse.js";

export function vrmlToScene(wrlText) {
  const parsed = parseVrml(wrlText);
  const flat = flattenVrml(parsed);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1410);
  scene.fog = new THREE.Fog(0x0a1410, 260, 900);

  const hemi = new THREE.HemisphereLight(0xdfefff, 0x33402c, 0.9);
  const sun = new THREE.DirectionalLight(0xfff3dd, 0.9);
  sun.position.set(140, 260, 120);
  scene.add(hemi, sun);

  let triangles = 0;
  let skipped = 0;
  for (const mesh of flat.meshes) {
    const pts = mesh.positions || [];
    if (pts.length < 9) {
      skipped++;
      continue;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    // Two shapes of index come out of the flattener.  IndexedFaceSet meshes
    // carry a VRML coordIndex where -1 ends a polygon; the primitive meshes
    // (boxes, cones, cylinders) are already triangulated and carry no -1 at
    // all.  Fanning the latter would invent geometry, so they are taken as is.
    const raw = mesh.index || [];
    const idx = [];
    if (!raw.includes(-1)) {
      if (raw.length % 3 === 0) idx.push(...raw);
    } else {
      let run = [];
      const flush = () => {
        if (run.length === 3) idx.push(...run);
        else if (run.length > 3) for (let k = 1; k + 1 < run.length; k++) idx.push(run[0], run[k], run[k + 1]);
        run = [];
      };
      for (const v of raw) {
        if (v === -1) flush();
        else run.push(v);
      }
      flush();
    }
    if (idx.length) {
      geo.setIndex(idx);
      triangles += idx.length / 3;
    }
    geo.computeVertexNormals();
    const c = mesh.appearance?.color || [0.72, 0.7, 0.64];
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(c[0], c[1], c[2]),
      side: THREE.DoubleSide,
      transparent: (mesh.appearance?.transparency ?? 0) > 0,
      opacity: 1 - (mesh.appearance?.transparency ?? 0),
    });
    const m = new THREE.Mesh(geo, mat);
    m.name = mesh.name || "";
    scene.add(m);
  }

  for (const line of flat.lines || []) {
    const pts = line.positions || [];
    if (pts.length < 6) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    const c = line.appearance?.color || [0.62, 0.85, 0.69];
    scene.add(
      new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]), transparent: true, opacity: 0.55 })),
    );
  }

  return { scene, stats: flat.stats, meshes: flat.meshes.length - skipped, triangles, named: flat.named };
}

/** Drag-to-orbit viewer with a wheel zoom. */
export function startVrmlViewer({ host, wrlText }) {
  const { scene, stats, meshes, triangles } = vrmlToScene(wrlText);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth || 900, host.clientHeight || 560);
  host.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(52, (host.clientWidth || 900) / (host.clientHeight || 560), 0.5, 3000);
  const target = new THREE.Vector3(0, 6, 0);
  let yaw = 0.7;
  let pitch = 0.42;
  let dist = 420;

  const apply = () => {
    camera.position.set(
      target.x + Math.cos(pitch) * Math.sin(yaw) * dist,
      target.y + Math.sin(pitch) * dist,
      target.z + Math.cos(pitch) * Math.cos(yaw) * dist,
    );
    camera.lookAt(target);
  };
  apply();

  let drag = null;
  const down = (e) => {
    drag = { x: e.clientX, y: e.clientY };
    renderer.domElement.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drag) return;
    yaw -= (e.clientX - drag.x) * 0.006;
    pitch = Math.max(0.04, Math.min(1.45, pitch + (e.clientY - drag.y) * 0.005));
    drag = { x: e.clientX, y: e.clientY };
    apply();
  };
  const up = () => (drag = null);
  const wheel = (e) => {
    e.preventDefault();
    dist = Math.max(40, Math.min(1400, dist * (1 + Math.sign(e.deltaY) * 0.12)));
    apply();
  };
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("wheel", wheel, { passive: false });

  const onResize = () => {
    const w = host.clientWidth || 900;
    const h = host.clientHeight || 560;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", onResize);

  let raf = 0;
  let auto = true;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (auto && !drag) {
      yaw += 0.0016;
      apply();
    }
    renderer.render(scene, camera);
  };
  loop();

  return {
    scene,
    camera,
    renderer,
    stats,
    meshes,
    triangles,
    set auto(v) {
      auto = !!v;
    },
    get auto() {
      return auto;
    },
    frame(dist2 = 420) {
      dist = dist2;
      apply();
    },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
