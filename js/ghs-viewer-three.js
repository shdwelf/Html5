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

/**
 * Interactive VRML viewer shared by the Glendora and Stalag Luft IV apps.
 * It intentionally offers renderer-side styles; it does not change the VRML
 * source or claim to implement every VRML97 light/material node.
 */
export function startVrmlViewer({ host, wrlText, showControls = true }) {
  const { scene, stats, meshes, triangles } = vrmlToScene(wrlText);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth || 900, host.clientHeight || 560);
  host.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none";

  const camera = new THREE.PerspectiveCamera(52, (host.clientWidth || 900) / (host.clientHeight || 560), 0.5, 3000);
  const target = new THREE.Vector3(0, 6, 0);
  let yaw = 0.7;
  let pitch = 0.42;
  let dist = 420;
  let mode = "surface";
  let liveLight = false;
  let auto = true;

  const apply = () => {
    camera.position.set(
      target.x + Math.cos(pitch) * Math.sin(yaw) * dist,
      target.y + Math.sin(pitch) * dist,
      target.z + Math.cos(pitch) * Math.cos(yaw) * dist,
    );
    camera.lookAt(target);
    renderer.domElement.dataset.cameraDistance = dist.toFixed(3);
  };
  apply();

  const originalBackground = scene.background?.clone?.() ?? new THREE.Color(0x0a1410);
  const originalFog = scene.fog;
  const baseMaterials = new Map();
  scene.traverse((object) => {
    if (!(object.isMesh || object.isLine) || !object.material || Array.isArray(object.material)) return;
    const material = object.material;
    baseMaterials.set(object, {
      color: material.color?.clone?.() ?? new THREE.Color(0xffffff),
      emissive: material.emissive?.clone?.() ?? new THREE.Color(0x000000),
      emissiveIntensity: material.emissiveIntensity ?? 1,
      transparent: Boolean(material.transparent),
      opacity: material.opacity ?? 1,
      depthWrite: material.depthWrite ?? true,
      wireframe: Boolean(material.wireframe),
    });
  });

  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z, 10);
  const gridSize = span * 1.25;
  const grid = new THREE.GridHelper(
    gridSize,
    Math.max(4, Math.min(80, Math.round(gridSize / 10))),
    0x38bdf8,
    0x155e75,
  );
  grid.name = "ghs-vrml-blueprint-grid";
  grid.position.set(center.x, bounds.min.y - Math.max(0.01, span * 0.001), center.z);
  grid.visible = false;
  scene.add(grid);

  // A moving point source is additive to the steady hemisphere/directional
  // lights. Off by default, so adding the controls preserves the existing view.
  const livePoint = new THREE.PointLight(0x8be9ff, Math.max(20, span * span * 0.035), span * 3, 2);
  livePoint.visible = false;
  scene.add(livePoint);

  let modeButtons = [];
  let lightButton = null;
  let autoButton = null;
  const updateControls = () => {
    renderer.domElement.dataset.mode = mode;
    renderer.domElement.dataset.lightOn = String(liveLight);
    renderer.domElement.dataset.autoRotate = String(auto);
    for (const button of modeButtons) {
      const active = button.dataset.vrmlMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    if (lightButton) {
      lightButton.textContent = `LIVE LIGHT: ${liveLight ? "ON" : "OFF"}`;
      lightButton.setAttribute("aria-pressed", String(liveLight));
    }
    if (autoButton) {
      autoButton.textContent = `AUTO ROTATE: ${auto ? "ON" : "OFF"}`;
      autoButton.setAttribute("aria-pressed", String(auto));
    }
  };

  const applyMode = () => {
    const blueprint = mode === "blueprint";
    scene.background.copy(blueprint ? new THREE.Color(0x06172d) : originalBackground);
    scene.fog = blueprint ? null : originalFog;
    grid.visible = blueprint;
    scene.traverse((object) => {
      const base = baseMaterials.get(object);
      if (!base) return;
      const material = object.material;
      if (object.isMesh) {
        material.color.copy(blueprint ? new THREE.Color(0x42caff) : base.color);
        if (material.emissive) material.emissive.copy(blueprint ? new THREE.Color(0x16496b) : base.emissive);
        if ("emissiveIntensity" in material) material.emissiveIntensity = blueprint ? 1.25 : base.emissiveIntensity;
        material.wireframe = mode === "wireframe" || blueprint;
        material.transparent = blueprint ? false : base.transparent;
        material.opacity = blueprint ? 1 : base.opacity;
        material.depthWrite = blueprint ? true : base.depthWrite;
        material.needsUpdate = true;
      } else {
        material.color.copy(blueprint ? new THREE.Color(0x55d7ff) : base.color);
        material.transparent = true;
        material.opacity = blueprint ? 0.95 : base.opacity;
        material.needsUpdate = true;
      }
    });
    updateControls();
  };

  const setMode = (next) => {
    if (!["surface", "wireframe", "blueprint"].includes(next)) {
      throw new RangeError(`Unknown VRML display mode: ${next}`);
    }
    mode = next;
    applyMode();
    return mode;
  };

  const style = document.createElement("style");
  style.textContent = `
    .ghs-vrml-controls { position:absolute; left:12px; bottom:12px; z-index:25; display:flex; flex-wrap:wrap; align-items:center; gap:5px; max-width:calc(100% - 24px); padding:7px; color:#d7e3e8; background:rgba(4,12,20,.88); border:1px solid rgba(85,215,255,.35); box-shadow:0 4px 18px rgba(0,0,0,.35); font:11px ui-monospace,monospace; }
    .ghs-vrml-controls button { min-height:30px; padding:5px 8px; border:1px solid #294350; border-radius:2px; color:#b8cbd3; background:#0b1b26; font:inherit; letter-spacing:.06em; cursor:pointer; }
    .ghs-vrml-controls button:hover,.ghs-vrml-controls button:focus-visible { border-color:#55d7ff; color:#fff; outline:2px solid #55d7ff; outline-offset:1px; }
    .ghs-vrml-controls button.active,.ghs-vrml-controls button[aria-pressed="true"] { color:#03121a; background:#55d7ff; border-color:#55d7ff; }
  `;
  host.appendChild(style);
  const toolbar = document.createElement("div");
  toolbar.className = "ghs-vrml-controls";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "VRML renderer modes and lighting");
  const addButton = (text, title) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.title = title;
    return button;
  };
  if (showControls) {
    for (const [id, label] of [["surface", "SURFACE"], ["wireframe", "WIREFRAME"], ["blueprint", "BLUEPRINT"]]) {
      const button = addButton(label, `${label.toLowerCase()} rendering`);
      button.dataset.vrmlMode = id;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => setMode(id));
      modeButtons.push(button);
      toolbar.appendChild(button);
    }
    lightButton = addButton("LIVE LIGHT: OFF", "Toggle the moving renderer-side point light");
    lightButton.setAttribute("aria-pressed", "false");
    lightButton.addEventListener("click", () => {
      liveLight = !liveLight;
      livePoint.visible = liveLight;
      updateControls();
    });
    toolbar.appendChild(lightButton);

    autoButton = addButton("AUTO ROTATE: ON", "Toggle automatic model rotation");
    autoButton.setAttribute("aria-pressed", "true");
    autoButton.addEventListener("click", () => {
      auto = !auto;
      updateControls();
    });
    toolbar.appendChild(autoButton);

    const resetButton = addButton("RESET CAMERA", "Restore the default camera distance and angle");
    resetButton.addEventListener("click", () => {
      yaw = 0.7;
      pitch = 0.42;
      dist = 420;
      apply();
    });
    toolbar.appendChild(resetButton);
    host.appendChild(toolbar);
  }
  applyMode();

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
  const loopStarted = performance.now();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const elapsed = (performance.now() - loopStarted) / 1000;
    if (auto && !drag) {
      yaw += 0.0016;
      apply();
    }
    livePoint.position.set(
      center.x + Math.sin(elapsed * 0.65) * span * 0.48,
      center.y + Math.max(size.y * 0.45, span * 0.24),
      center.z + Math.cos(elapsed * 0.65) * span * 0.48,
    );
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
      updateControls();
    },
    get auto() {
      return auto;
    },
    get mode() {
      return mode;
    },
    set mode(v) {
      setMode(v);
    },
    get liveLight() {
      return liveLight;
    },
    set liveLight(v) {
      liveLight = !!v;
      livePoint.visible = liveLight;
      updateControls();
    },
    frame(dist2 = 420) {
      dist = Math.max(40, Math.min(1400, dist2));
      apply();
    },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("wheel", wheel);
      renderer.dispose();
      renderer.domElement.remove();
      toolbar.remove();
      style.remove();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
    },
  };
}
