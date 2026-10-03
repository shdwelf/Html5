/**
 * js/cheyenne.js — CHEYENNE / ANGELES 4Dwm theater.
 *
 * Two plates in one scene:
 *   • chey — Pikes Peak massif + Cheyenne Mountain (NORAD), Colorado
 *   • ange — San Gabriel block of the Angeles National Forest, California
 *
 * Terrain is a control-point DEM built from genuine USGS 3DEP samples
 * (js/cheyenne-dem-data.js), hypsometrically tinted. Political relief drapes
 * real county/forest rings (js/cheyenne-borders.js). Mines come from the
 * USGS MRDS index, camps from USFS/CPW sources, names from the USGS GNIS
 * gazetteer. Schematic, offline, standalone. Not a survey.
 *
 * Boot-guarded so `node -e "import('./js/cheyenne.js')"` works as a smoke test.
 */

import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  META, LAYERS, POLITICS, GAZETTEER, FACILITIES, CAMPS, CORRIDORS, VIEWS,
  OFF_FRAME, allMines, mineSources,
} from "./cheyenne-data.js";
import { UNITS_PER_KM, haversineKm, makeProjection, resample } from "./cheyenne-geo.js";
import { buildGrid, sampleDem, hypsometric, elevationAt } from "./cheyenne-dem.js";

/* ------------------------------------------------------------------ boot */

function init() {
  const $ = (id) => document.getElementById(id);
  const canvas = $("stage");
  const labelsEl = $("labels");

  /* ------------------------------------------------------------- state -- */
  const state = {
    vert: 6,
    depth: 2.5,
    xray: false,
    wire: false,
    labelsOn: true,
    layerOn: Object.fromEntries(LAYERS.map((l) => [l.id, l.on])),
    view: "cheyNORAD",
    fps: 0,
  };
  const TIER_COLOR = { official: "#ffb020", community: "#5cd6ff", context: "#ff6ec7" };

  /* ---------------------------------------------------------- renderer -- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080d);
  scene.fog = new THREE.Fog(0x05080d, 26, 64);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.01, 300);
  camera.position.set(-2.5, 6.5, 8.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxDistance = 60;
  controls.minDistance = 0.4;
  controls.maxPolarAngle = Math.PI * 0.52;

  scene.add(new THREE.AmbientLight(0xcfe2f0, 0.55));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.15);
  sun.position.set(-6, 9, 4);
  scene.add(sun);
  const back = new THREE.DirectionalLight(0x88a7c4, 0.35);
  back.position.set(7, 4, -6);
  scene.add(back);

  /* ------------------------------------------------------------ plates -- */
  const PLATE_X = { chey: -4.75, ange: 4.75 };
  const PLATE_TITLE = { chey: "COLORADO · CHEYENNE PLATE", ange: "CALIFORNIA · ANGELES PLATE" };
  const plates = {};
  const layerGroups = Object.fromEntries(LAYERS.map((l) => [l.id, []]));
  const pickables = [];
  const pickRecords = new Map(); // mesh.uuid -> record
  const labelItems = []; // { el, world: Vector3, layerId, cull }
  const terrainMeshes = [];

  for (const id of ["chey", "ange"]) {
    const center = id === "chey" ? META.cheyCenter : META.angeCenter;
    const projection = makeProjection(center);
    const grid = buildGrid(id, 172, 138);
    const [w, s, e, n] = grid.bbox;
    const cornersSE = projection.project(e, s);
    const cornersNW = projection.project(w, n);
    const widthU = Math.abs(cornersSE.x - cornersNW.x);
    const heightU = Math.abs(cornersSE.z - cornersNW.z);

    const group = new THREE.Group();
    group.position.x = PLATE_X[id];
    scene.add(group);

    /* terrain shell ---------------------------------------------------- */
    const SEG_X = 150;
    const SEG_Y = 124;
    const geo = new THREE.PlaneGeometry(widthU, heightU, SEG_X, SEG_Y);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const baseElev = new Float32Array(pos.count);
    const colors = new Float32Array(pos.count * 3);
    const lonLatOf = (i) => {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      return projection.lonLatFromXZ(x, z);
    };
    for (let i = 0; i < pos.count; i++) {
      const { lon, lat } = lonLatOf(i);
      const elev = sampleDem(grid, lon, lat);
      baseElev[i] = elev;
      pos.setY(i, elevY(elev));
      const c = hypsometric(elev);
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.93,
      metalness: 0.0,
      transparent: true,
      opacity: 1,
    });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.userData.plate = id;
    group.add(terrain);
    terrainMeshes.push(terrain);

    /* ground plane + frame --------------------------------------------- */
    const frameMat = new THREE.LineBasicMaterial({ color: 0x2a4258, transparent: true, opacity: 0.9 });
    const hw = widthU / 2;
    const hh = heightU / 2;
    const frameGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-hw, 0, -hh), new THREE.Vector3(hw, 0, -hh),
      new THREE.Vector3(hw, 0, hh), new THREE.Vector3(-hw, 0, hh),
      new THREE.Vector3(-hw, 0, -hh),
      new THREE.Vector3(-hw, 0.35, -hh), new THREE.Vector3(hw, 0.35, -hh),
      new THREE.Vector3(hw, 0.35, hh), new THREE.Vector3(-hw, 0.35, hh),
      new THREE.Vector3(-hw, 0.35, -hh),
    ]);
    group.add(new THREE.Line(frameGeo, frameMat));

    plates[id] = { id, group, projection, grid, terrain, geo, mat, baseElev, widthU, heightU, hw, hh };
  }

  /* elevation/depth scaling (vert exaggeration shared with the slider) -- */
  function elevY(m) {
    return (m / 1000) * UNITS_PER_KM * state.vert;
  }
  function depthY(m) {
    return (m / 1000) * UNITS_PER_KM * state.vert * state.depth;
  }
  function worldOf(plateId, lon, lat, m = 0) {
    const p = plates[plateId];
    const { x, z } = p.projection.project(lon, lat);
    return new THREE.Vector3(PLATE_X[plateId] + x, m >= 0 ? elevY(m) : depthY(m), z);
  }

  /* -------------------------------------------------------- decorations */
  /* (political drapes, gazetteer dots, nodes, corridors — rebuilt whenever
     the exaggeration slider moves, because everything is draped on terrain) */

  function makeLabel(text, cls, layerId, world, cull = 130) {
    const el = document.createElement("div");
    el.className = `lbl ${cls}`;
    el.textContent = text;
    labelsEl.appendChild(el);
    labelItems.push({ el, world, layerId, cull });
    return el;
  }

  function pickable(mesh, record) {
    mesh.userData.record = record;
    pickables.push(mesh);
    pickRecords.set(mesh.uuid, record);
  }

  function buildNodeGroup(plateId, rec, layerId) {
    const p = plates[plateId];
    const { x, z } = p.projection.project(rec.lon, rec.lat);
    const ground = elevationAt(plateId, rec.lon, rec.lat) ?? 0;
    const g = new THREE.Group();
    g.position.set(x, elevY(ground), z);
    const tier = TIER_COLOR[rec.tier] ?? "#d8e6f2";

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.17, 5),
      new THREE.MeshBasicMaterial({ color: 0x5c7a94 })
    );
    mast.position.y = 0.085;
    g.add(mast);

    let head;
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(rec.kind === "camp" ? "#7dd87d" : layerId === "minesA" || layerId === "minesC" ? "#e8e3d3" : tier),
      roughness: 0.5,
      emissive: new THREE.Color(tier).multiplyScalar(0.25),
    });
    if (rec.kind === "norad") head = new THREE.Mesh(new THREE.OctahedronGeometry(0.062), headMat);
    else if (rec.kind === "mil") head = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), headMat);
    else if (rec.kind === "bridge") {
      head = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 14, Math.PI), headMat); // ∩ arch
    } else if (rec.kind === "camp") head = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.07, 6), headMat);
    else if (rec.kind === "district") head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.052), headMat);
    else {
      head = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.075, 6), headMat); // mine: funnel pointing down
      head.rotation.x = Math.PI;
    }
    head.position.y = 0.17;
    g.add(head);
    pickable(head, rec);
    head.userData.layerId = layerId;
    head.userData.plate = plateId;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.072, 22),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tier), transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    ring.userData.layerId = layerId;
    g.add(ring);
    pickable(ring, rec);

    if (rec.depthM && rec.depthM < 0) {
      const d = depthY(rec.depthM);
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, Math.abs(d), 5, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.4 })
      );
      shaft.position.y = d / 2;
      shaft.userData.layerId = layerId;
      g.add(shaft);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x1a5566 })
      );
      bulb.position.y = d;
      bulb.userData.layerId = layerId;
      g.add(bulb);
    }

    makeLabel(rec.name, `t-${rec.tier}`, layerId, worldOf(plateId, rec.lon, rec.lat, Math.max(ground, 0) + 420));
    return g;
  }

  function buildDecorations() {
    // wipe previous
    for (const arr of Object.values(layerGroups)) {
      for (const g of arr) {
        g.parent?.remove(g);
        g.traverse((o) => {
          o.geometry?.dispose?.();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        });
      }
      arr.length = 0;
    }
    for (const l of labelItems) l.el.remove();
    labelItems.length = 0;
    pickables.length = 0;
    pickRecords.clear();

    for (const plateId of ["chey", "ange"]) {
      const p = plates[plateId];

      /* political relief ---------------------------------------------- */
      const polGroup = new THREE.Group();
      for (const pol of POLITICS[plateId]) {
        const pts = resample([...pol.ring, pol.ring[0]], 0.008).map(([lon, lat]) => {
          const { x, z } = p.projection.project(lon, lat);
          const g = elevationAt(plateId, lon, lat) ?? 0;
          return new THREE.Vector3(x, elevY(g) + 0.006, z);
        });
        const color = pol.kind === "forest" ? 0x86c98a : pol.kind === "county" ? 0xe8d9a0 : 0xd9c98a;
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
        line.userData.layerId = "politics";
        polGroup.add(line);
      }
      p.group.add(polGroup);
      layerGroups.politics.push(polGroup);

      for (const lab of POLITICS.labels[plateId]) {
        const { x, z } = p.projection.project(lab.lon, lab.lat);
        const g = elevationAt(plateId, lab.lon, lab.lat) ?? 0;
        makeLabel(lab.name, `t-politics${lab.small ? " small" : ""}${lab.kind === "state" ? " state" : ""}`, "politics",
          worldOf(plateId, lab.lon, lab.lat, g + (lab.kind === "state" ? 2600 : 500)), 400);
      }

      /* gazetteer dots -------------------------------------------------- */
      const gazGroup = new THREE.Group();
      const dotGeo = new THREE.SphereGeometry(0.013, 8, 6);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xb8c7d1 });
      for (const [name, lon, lat, cls] of GAZETTEER[plateId]) {
        const { x, z } = p.projection.project(lon, lat);
        const g = elevationAt(plateId, lon, lat) ?? 0;
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(x, elevY(g) + 0.01, z);
        dot.userData.layerId = "gaz";
        gazGroup.add(dot);
        makeLabel(name, "t-gaz", "gaz", worldOf(plateId, lon, lat, g + 240), 55);
      }
      p.group.add(gazGroup);
      layerGroups.gaz.push(gazGroup);

      /* facility + camp nodes ------------------------------------------- */
      const noradGroup = new THREE.Group();
      for (const f of FACILITIES.filter((r) => r.plate === plateId)) noradGroup.add(buildNodeGroup(plateId, { ...f, layer: "norad" }, "norad"));
      p.group.add(noradGroup);
      layerGroups.norad.push(noradGroup);

      const campGroup = new THREE.Group();
      for (const c of CAMPS.filter((r) => r.plate === plateId)) campGroup.add(buildNodeGroup(plateId, c, "camps"));
      p.group.add(campGroup);
      layerGroups.camps.push(campGroup);

      /* mines ------------------------------------------------------------- */
      const mines = allMines().filter((m) => m.plate === plateId);
      const minesByLayer = {};
      for (const m of mines) (minesByLayer[m.layer] ??= []).push(m);
      for (const [layerId, rows] of Object.entries(minesByLayer)) {
        const mineGroup = new THREE.Group();
        for (const m of rows) mineGroup.add(buildNodeGroup(plateId, m, layerId));
        p.group.add(mineGroup);
        layerGroups[layerId]?.push(mineGroup);
      }

      /* corridors --------------------------------------------------------- */
      const corGroup = new THREE.Group();
      for (const c of CORRIDORS.filter((r) => r.plate === plateId)) {
        const pts = resample(c.path, 0.006).map(([lon, lat]) => {
          const { x, z } = p.projection.project(lon, lat);
          const g = elevationAt(plateId, lon, lat) ?? 0;
          return new THREE.Vector3(x, elevY(g) + 0.018, z);
        });
        const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.2);
        const radius = c.kind === "trail" ? 0.016 : 0.022;
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, Math.min(360, pts.length * 2), radius, 7),
          new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x0d3540, roughness: 0.45 })
        );
        tube.userData.layerId = "corridor";
        corGroup.add(tube);
        const mid = c.path[Math.floor(c.path.length / 2)];
        const midG = (elevationAt(plateId, mid[0], mid[1]) ?? 0) + 380;
        makeLabel(c.short, "t-corridor", "corridor", worldOf(plateId, mid[0], mid[1], midG), 160);
      }
      p.group.add(corGroup);
      layerGroups.corridor.push(corGroup);
    }

    /* plate titles + gap indicator (context layer of the whole scene) ----- */
    for (const plateId of ["chey", "ange"]) {
      const p = plates[plateId];
      makeLabel(PLATE_TITLE[plateId], "t-plate", "terrain", new THREE.Vector3(PLATE_X[plateId], 0.42, -p.hh - 0.15), 500);
    }
    const gapGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(PLATE_X.chey + plates.chey.hw + 0.1, 0, 0),
      new THREE.Vector3(PLATE_X.ange - plates.ange.hw - 0.1, 0, 0),
    ]);
    const gapLine = new THREE.Line(gapGeo, new THREE.LineDashedMaterial({ color: 0x5c7a94, dashSize: 0.08, gapSize: 0.06 }));
    gapLine.computeLineDistances();
    scene.add(gapLine);
    layerGroups.terrain.push(gapLine);
    const gapKm = Math.round(haversineKm(META.cheyCenter, META.angeCenter)).toLocaleString();
    makeLabel(`≈ ${gapKm} km actual separation — scene shows plates side by side`, "t-gap", "terrain", new THREE.Vector3(0, 0.28, 0), 600);

    applyLayerVisibility();
    applyXray();
    applyWire();
  }

  /* ------------------------------------------------------ layer visibility */

  function applyLayerVisibility() {
    for (const [layerId, groups] of Object.entries(layerGroups)) {
      const on = !!state.layerOn[layerId];
      for (const g of groups) {
        g.visible = on;
        if (g instanceof THREE.Line && g.parent === scene) g.visible = on;
      }
    }
    for (const p of Object.values(plates)) p.terrain.visible = !!state.layerOn.terrain;
  }

  function applyXray() {
    for (const p of Object.values(plates)) {
      p.mat.opacity = state.xray ? 0.24 : 1;
      p.mat.depthWrite = !state.xray;
    }
  }
  function applyWire() {
    for (const p of Object.values(plates)) p.mat.wireframe = state.wire;
  }

  /* ------------------------------------------------------------- rebuild */

  function rebuildFromSliders() {
    for (const p of Object.values(plates)) {
      const pos = p.geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, elevY(p.baseElev[i]));
      pos.needsUpdate = true;
      p.geo.computeVertexNormals();
    }
    buildDecorations();
    setStatus(`terrain exaggeration ${state.vert}× · depth ${state.depth}× — vertical is exaggerated, plan distances are true`);
  }

  /* -------------------------------------------------------------- labels */

  const v = new THREE.Vector3();
  function updateLabels() {
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    for (const item of labelItems) {
      const show =
        state.labelsOn && state.layerOn[item.layerId] && item.world.distanceTo(camera.position) < item.cull;
      if (!show) {
        item.el.style.display = "none";
        continue;
      }
      v.copy(item.world).project(camera);
      if (v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) {
        item.el.style.display = "none";
        continue;
      }
      item.el.style.display = "block";
      item.el.style.left = `${((v.x * 0.5 + 0.5) * w).toFixed(1)}px`;
      item.el.style.top = `${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px`;
      const d = item.world.distanceTo(camera.position);
      item.el.style.opacity = d > item.cull * 0.75 ? "0.55" : "1";
    }
  }

  /* -------------------------------------------------------------- picking */

  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let downAt = null;

  function activePickables() {
    return pickables.filter((m) => {
      let o = m;
      while (o) {
        if (o.visible === false) return false;
        if (o.userData.layerId && !state.layerOn[o.userData.layerId]) return false;
        o = o.parent;
      }
      return true;
    });
  }

  renderer.domElement.addEventListener("pointerdown", (e) => {
    downAt = [e.clientX, e.clientY];
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    downAt = null;
    if (moved > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    pointerNDC.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(activePickables(), false);
    if (hits.length) {
      const rec = pickRecords.get(hits[0].object.uuid);
      if (rec) return showDossier(rec);
    }
    const tHits = raycaster.intersectObjects(terrainMeshes.filter((t) => t.visible), false);
    if (tHits.length) return showTerrainDossier(tHits[0]);
  });

  let hoverLonLat = null;
  renderer.domElement.addEventListener("pointermove", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointerNDC.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointerNDC, camera);
    const tHits = raycaster.intersectObjects(terrainMeshes.filter((t) => t.visible), false);
    hoverLonLat = null;
    if (tHits.length) {
      const hit = tHits[0];
      const plateId = hit.object.userData.plate;
      const local = plates[plateId].group.worldToLocal(hit.point.clone());
      const ll = plates[plateId].projection.lonLatFromXZ(local.x, local.z);
      hoverLonLat = { ...ll, plate: plateId, elev: elevationAt(plateId, ll.lon, ll.lat) };
    }
  });

  /* -------------------------------------------------------------- dossier */

  const detailBody = $("detailBody");
  function el(tag, cls, text) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text != null) d.textContent = text;
    return d;
  }
  function rows(pairs) {
    const dl = el("dl", "kv");
    for (const [k, val] of pairs) {
      dl.append(el("dt", null, k), el("dd", null, val));
    }
    return dl;
  }
  function showDossier(rec) {
    detailBody.replaceChildren();
    const plateName = rec.plate === "chey" ? "Colorado · Cheyenne plate" : "California · Angeles plate";
    const ground = elevationAt(rec.plate, rec.lon, rec.lat) ?? 0;
    detailBody.append(el("h3", "detail-title", rec.name));
    detailBody.append(el("span", `tier ${rec.tier}`, rec.tier.toUpperCase()));
    const srcs = rec.layer === "minesA" || rec.layer === "minesC" ? mineSources(rec) : rec.sources || [];
    const pairs = [
      ["plate", plateName],
      ["position", `${rec.lat.toFixed(4)}°N ${Math.abs(rec.lon).toFixed(4)}°W`],
      ["ground (3DEP)", ground ? `${Math.round(ground)} m` : "—"],
    ];
    if (rec.status) pairs.push(["status (MRDS)", rec.status]);
    if (rec.com) pairs.push(["commodities", rec.com]);
    if (rec.elevM && !ground) pairs.push(["elevation", `${rec.elevM} m`]);
    if (rec.depthM < 0) pairs.push(["workings", `${Math.abs(rec.depthM)} m below surface (schematic)`]);
    if (rec.dep) pairs.push(["MRDS dep_id", String(rec.dep)]);
    detailBody.append(rows(pairs));
    const facts = [...(rec.facts || []), ...(rec.story || [])];
    if (facts.length) {
      const ul = el("ul", "facts");
      for (const f of facts) ul.append(el("li", null, f));
      detailBody.append(ul);
    }
    if (srcs.length) {
      const ul = el("ul", "srcs");
      for (const s of srcs) ul.append(el("li", null, s));
      detailBody.append(ul);
    }
    webxdcStatus(`dossier · ${rec.name}`);
  }
  function showTerrainDossier(hit) {
    const plateId = hit.object.userData.plate;
    const local = plates[plateId].group.worldToLocal(hit.point.clone());
    const ll = plates[plateId].projection.lonLatFromXZ(local.x, local.z);
    const dem = elevationAt(plateId, ll.lon, ll.lat) ?? 0;
    detailBody.replaceChildren();
    detailBody.append(el("h3", "detail-title", "Terrain sample — USGS 3DEP control-point DEM"));
    detailBody.append(el("span", "tier context", "INTERPOLATED"));
    detailBody.append(
      rows([
        ["plate", plateId === "chey" ? "Colorado · Cheyenne plate" : "California · Angeles plate"],
        ["position", `${ll.lat.toFixed(4)}°N ${Math.abs(ll.lon).toFixed(4)}°W`],
        ["elevation", `${Math.round(dem)} m (NAVD 88, interpolated)`],
        ["control pts", `${plates[plateId].grid.meta.controlCount} within plate`],
        ["note", "Value is a Shepard interpolation of real 3DEP samples; ±25 m fractal texture between controls is texture, not data."],
      ])
    );
    const ul = el("ul", "srcs");
    ul.append(el("li", null, "USGS 3DEP 1 m DEM products via National Map ImageServer getSamples (2026-10-02)"));
    detailBody.append(ul);
  }

  /* ---------------------------------------------------------------- views */

  function applyView(id) {
    const view = VIEWS[id];
    if (!view) return;
    state.view = id;
    if (view.plate === "both") {
      controls.target.set(view.target.x, view.target.y, view.target.z);
      camera.position.set(view.cam.x, view.cam.y, view.cam.z);
    } else {
      const t = worldOf(view.plate, view.target.lon, view.target.lat, 0);
      controls.target.set(t.x, t.y + (view.target.h || 0.5), t.z);
      const c = worldOf(view.plate, view.cam.lon, view.cam.lat, 0);
      camera.position.set(c.x, t.y + view.cam.h, c.z);
    }
    controls.update();
    setStatus(view.note);
    $("viewSelect").value = id;
    webxdcStatus(`view · ${view.label}`);
  }

  function flyTo(plateId, lon, lat) {
    const t = worldOf(plateId, lon, lat, 0);
    controls.target.copy(t);
    camera.position.set(t.x + 1.9, t.y + 1.5, t.z + 1.9);
    controls.update();
  }

  /* ---------------------------------------------------------------- search */

  const searchInput = $("searchBox");
  const searchResults = $("searchResults");
  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    searchResults.replaceChildren();
    if (q.length < 2) return;
    const gaz = [];
    for (const plateId of ["chey", "ange"]) {
      for (const [name, lon, lat, cls] of GAZETTEER[plateId]) {
        if (name.toLowerCase().includes(q)) gaz.push({ name: `${name} · ${cls}`, plateId, lon, lat });
      }
    }
    const nodes = [
      ...FACILITIES, ...CAMPS, ...allMines(),
    ]
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((r) => ({ name: r.name, plateId: r.plate, lon: r.lon, lat: r.lat, rec: r }));
    const seen = new Set();
    for (const item of [...nodes, ...gaz].slice(0, 12)) {
      const key = item.name + item.plateId;
      if (seen.has(key)) continue;
      seen.add(key);
      const btn = el("button", "search-hit", item.name);
      btn.addEventListener("click", () => {
        flyTo(item.plateId, item.lon, item.lat);
        if (item.rec) showDossier(item.rec);
        else {
          const g = elevationAt(item.plateId, item.lon, item.lat) ?? 0;
          setStatus(`${item.name} — GNIS ${Math.round(g)} m`);
        }
      });
      searchResults.append(btn);
    }
    if (!seen.size) searchResults.append(el("p", "hint", "no match in the embedded GNIS gazetteer or feature register"));
  }
  searchInput?.addEventListener("input", runSearch);

  /* ------------------------------------------------------------------ UI */

  const layerList = $("layerList");
  for (const l of LAYERS) {
    const row = el("label", "layer-row");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.layerOn[l.id];
    cb.addEventListener("change", () => {
      state.layerOn[l.id] = cb.checked;
      applyLayerVisibility();
    });
    row.append(cb);
    const sw = el("span", "swatch");
    sw.style.background = l.color;
    row.append(sw, el("span", null, l.name));
    layerList.append(row);
  }
  const offFrameList = $("offFrameList");
  for (const o of OFF_FRAME) {
    const d = el("div", "hint");
    d.append(el("strong", null, o.name), el("br"), document.createTextNode(o.note));
    offFrameList.append(d);
  }

  const viewSelect = $("viewSelect");
  for (const [id, view] of Object.entries(VIEWS)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `VIEW · ${view.label}`;
    viewSelect.append(opt);
  }
  viewSelect.addEventListener("change", () => applyView(viewSelect.value));

  const btnXray = $("btnXray");
  btnXray.addEventListener("click", () => {
    state.xray = !state.xray;
    btnXray.setAttribute("aria-pressed", String(state.xray));
    applyXray();
    setStatus(state.xray ? "x-ray — terrain shell ghosted; shafts and depth bulbs visible" : "x-ray off");
  });
  const btnWire = $("btnWire");
  btnWire.addEventListener("click", () => {
    state.wire = !state.wire;
    btnWire.setAttribute("aria-pressed", String(state.wire));
    applyWire();
    setStatus(state.wire ? "wireframe terrain — the control-point DEM grid" : "wireframe off");
  });
  const btnLabels = $("btnLabels");
  btnLabels.addEventListener("click", () => {
    state.labelsOn = !state.labelsOn;
    btnLabels.setAttribute("aria-pressed", String(state.labelsOn));
    updateLabels();
  });
  $("btnReset").addEventListener("click", () => {
    state.vert = 6;
    state.depth = 2.5;
    $("vertExag").value = "6";
    $("depthExag").value = "2.5";
    $("vertExagVal").textContent = "6×";
    $("depthExagVal").textContent = "2.5×";
    rebuildFromSliders();
    applyView("cheyNORAD");
  });

  $("vertExag").addEventListener("input", (e) => {
    state.vert = +e.target.value;
    $("vertExagVal").textContent = `${state.vert}×`;
    rebuildFromSliders();
  });
  $("depthExag").addEventListener("input", (e) => {
    state.depth = +e.target.value;
    $("depthExagVal").textContent = `${state.depth}×`;
    rebuildFromSliders();
  });

  /* draggable PIPs -------------------------------------------------------- */
  for (const pip of document.querySelectorAll(".pip")) {
    const head = pip.querySelector(".pip-head");
    let drag = null;
    head.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      drag = { x: e.clientX, y: e.clientY, l: pip.offsetLeft, t: pip.offsetTop };
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener("pointermove", (e) => {
      if (!drag) return;
      pip.style.left = `${drag.l + e.clientX - drag.x}px`;
      pip.style.top = `${drag.t + e.clientY - drag.y}px`;
      pip.style.right = "auto";
      pip.style.bottom = "auto";
    });
    head.addEventListener("pointerup", () => (drag = null));
    head.querySelector("[data-min]")?.addEventListener("click", () => pip.classList.toggle("min"));
  }

  /* --------------------------------------------------------------- minimap */

  const mini = $("minimap");
  const miniRenderer = new THREE.WebGLRenderer({ canvas: mini, antialias: true });
  miniRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  miniRenderer.setSize(220, 150, false);
  const miniCam = new THREE.OrthographicCamera(-10.5, 10.5, 8, -8, 0.1, 60);
  miniCam.position.set(0, 22, 0.001);
  miniCam.up.set(0, 0, -1);
  miniCam.lookAt(0, 0, 0);
  const wedgeGeo = new THREE.ConeGeometry(0.28, 0.7, 3);
  wedgeGeo.rotateX(Math.PI / 2); // cone axis → +Z (points where the camera looks)
  const wedge = new THREE.Mesh(wedgeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  wedge.visible = false;
  scene.add(wedge);

  function renderMinimap() {
    const fog = scene.fog;
    scene.fog = null;
    wedge.visible = true;
    wedge.position.set(camera.position.x, 0.05, camera.position.z);
    camera.getWorldDirection(v);
    wedge.rotation.set(0, Math.atan2(v.x, v.z), 0);
    miniRenderer.render(scene, miniCam);
    wedge.visible = false;
    scene.fog = fog;
  }

  /* ------------------------------------------------------------------- HUD */

  const hud = {
    cam: $("hudCam"), target: $("hudTarget"), lonLat: $("hudLonLat"), elev: $("hudElev"),
    layers: $("hudLayers"), objects: $("hudObjects"), fps: $("hudFps"),
  };
  let frames = 0;
  let lastFpsAt = performance.now();

  function updateHud() {
    hud.cam.textContent = `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
    hud.target.textContent = `${controls.target.x.toFixed(1)}, ${controls.target.y.toFixed(1)}, ${controls.target.z.toFixed(1)}`;
    hud.lonLat.textContent = hoverLonLat
      ? `${hoverLonLat.lat.toFixed(3)}°N ${Math.abs(hoverLonLat.lon).toFixed(3)}°W · ${hoverLonLat.plate}`
      : "—";
    hud.elev.textContent = hoverLonLat ? `${Math.round(hoverLonLat.elev ?? 0)} m` : "—";
    hud.layers.textContent = `${Object.values(state.layerOn).filter(Boolean).length}/${LAYERS.length}`;
    hud.objects.textContent = String(pickables.length);
    hud.fps.textContent = String(state.fps);
  }

  /* -------------------------------------------------------------- webxdc -- */

  let lastxdc = 0;
  function webxdcStatus(summary) {
    if (!window.webxdc?.sendUpdate) return;
    const now = Date.now();
    if (now - lastxdc < 1200) return;
    lastxdc = now;
    try {
      window.webxdc.sendUpdate({ payload: { system: true, summary } }, summary);
    } catch {
      /* simulator shim swallows */
    }
  }

  const statusEl = $("status");
  function setStatus(text) {
    statusEl.textContent = text;
  }

  /* ----------------------------------------------------------------- loop */

  function resize() {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  buildDecorations();
  applyView("cheyNORAD");
  setStatus("USGS 3DEP control-point DEM · GNIS gazetteer · USGS MRDS mine index — schematic, not a survey");
  webxdcStatus(`opened ${META.title}`);

  let last = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    frames++;
    if (now - lastFpsAt > 500) {
      state.fps = Math.round((frames * 1000) / (now - lastFpsAt));
      frames = 0;
      lastFpsAt = now;
    }
    controls.update();
    renderer.render(scene, camera);
    renderMinimap();
    updateLabels();
    updateHud();
  });
}

/* --------------------------------------------------------------- exports */
/* (nothing — this module is the app entry; boot-guarded for smoke tests)  */

function bootFail(err) {
  const card = document.createElement("div");
  card.style.cssText =
    "position:fixed;inset:1rem;z-index:999;background:#0a0f16;color:#ffd28a;" +
    "border:1px solid #e0a020;padding:1rem 1.2rem;" +
    "font:14px/1.55 ui-monospace,monospace;overflow:auto;" +
    "white-space:pre-wrap;border-radius:8px;";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "✕ close";
  close.style.cssText =
    "position:absolute;top:0.6rem;right:0.8rem;background:none;" +
    "border:1px solid #e0a020;color:#ffd28a;border-radius:4px;" +
    "padding:0.1rem 0.5rem;font:inherit;cursor:pointer;";
  close.addEventListener("click", () => card.remove());
  card.appendChild(close);
  const msg = document.createElement("div");
  msg.textContent =
    "CHEYENNE / ANGELES 4Dwm failed to start.\n\n" +
    (err && err.message ? err.message : String(err)) +
    "\n\nThis theater needs WebGL (WebGL2 preferred). Some webxdc hosts and " +
    "simulators run without GPU access — open the static bundle " +
    "(public/apps/cheyenne/index.html) or cheyenne.html in a full browser instead.";
  card.appendChild(msg);
  document.body.appendChild(card);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const start = () => {
    const canvas = document.getElementById("stage");
    if (!canvas) return;
    let gl = null;
    try {
      gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    } catch (err) {
      /* fall through to the guard below */
    }
    if (!gl) {
      bootFail(new Error("WebGL is not available in this host."));
      return;
    }
    try {
      init();
    } catch (err) {
      console.error(err);
      bootFail(err);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
}
