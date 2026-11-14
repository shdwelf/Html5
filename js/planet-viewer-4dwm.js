import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { initPipWm } from "./project-y-4dwm.js";
import { hypsometric, sampleDem } from "./cheyenne-dem.js";
import { makeGazetteerIndex, searchName, searchBox } from "./city-gazetteer.js";
import { PLANET_GAZ_ROWS } from "./planet-viewer-gazetteer.js";
import { demToVrml, downloadText } from "./vrml-export.js";
import { buildPlates, PLATE_ORDER } from "./planet-viewer-data.js";
import { runChecks } from "./planet-viewer-checks.js";
import { COUNTRIES } from "./country-data.js";
import { globeMarkers, visibleMarkers, graticule, coastlineRings, projectSegments, projectOrthographic } from "./planet-globe.js";
import { locateGazetteerPoint } from "./planet-viewer-search.js";
import { PCGLOBE_INDEX_META, PCGLOBE_COUNTRY_NAMES, PCGLOBE_COUNTRY_RECORDS } from "./pcglobe-index-data.js";
import { filterIncidentFeatures, MAX_SNAPSHOT_BYTES, parseIncidentSnapshot } from "./incident-snapshot.js";

/* =========================================================================
   PLANET VIEWER · 4DWM

   USGS 3DEP terrain, drawn three ways, over an offline USGS GNIS gazetteer.
   One scene unit = one kilometre horizontally; vertical is the same scale
   times the exaggeration slider, so relief is never faked by a hidden scale.

   Modes:
     RELIEF  hypsometric vertex-coloured surface, lit
     WIRE    wireframe over the same grid
     XRAY    translucent surface + contour lattice so the terrain reads as
             structure, like an x-ray plate
   Labels project the packed GNIS points that fall inside the plate bbox.
   VRML export goes through js/vrml-export.js (the terrarium writer).
   ========================================================================= */

const $ = (id) => document.getElementById(id);

let renderer, scene, camera, controls, raycaster, pointer;
let plates = null;
let plate = null;
let terrainGroup = null;
let labelMarkers = [];
let mode = "relief";
let labelsOn = true;
let exag = 3;
let wm = null;
let gazIndex = null;

// Globe plate state (S4 tail): the Red October orthographic globe, reused.
let globeOn = false;
let pcgOn = false; // PC Globe index plate (index-only; nothing plotted)
let globeCentre = { lat: 20, lon: 10 };
let globeData = null; // { markers, skipped } from js/planet-globe.js
let globeRings = null; // coastline rings from vendor/world/countries.geo.json
let selectedGazetteer = null; // the most recently focused offline place
let gazetteerMarker = null; // selected terrain point, separate from the DEM mesh
let fpsAcc = { n: 0, t0: 0, fps: 0 };
// S5: only user-selected canonical JSON. No bundled/live incident feed.
let incidentSnapshot = null;
let selectedIncident = null;
let incidentLoadSerial = 0;
const INCIDENT_COLORS = Object.freeze({
  incident: "#ff6b76", fire: "#ffb454", camera: "#c4b5fd",
  notam: "#facc15", lookout: "#86efac", sdr: "#67e8f9",
});

const COL = { sky: 0x0a1016, contour: 0x5cd6ff, marker: 0xffb020 };

/* -------------------------------------------------------------- terrain */

function buildTerrain(p) {
  const g = new THREE.Group();
  const { nx, ny, elev, min } = p.grid;
  const { w, d } = p.world;
  const scale = exag / 1000;

  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const m = elev[k];
      pos[k * 3] = (i / (nx - 1) - 0.5) * w;
      pos[k * 3 + 1] = (m - min) * scale;
      pos[k * 3 + 2] = (j / (ny - 1) - 0.5) * d;
      const c = hypsometric(m);
      col[k * 3] = c[0];
      col[k * 3 + 1] = c[1];
      col[k * 3 + 2] = c[2];
    }
  }
  const index = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const dd = c + 1;
      index.push(a, c, b, b, c, dd);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();

  const surface = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02, side: THREE.DoubleSide }),
  );
  surface.userData.role = "surface";
  g.add(surface);

  const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2b4a5a, wireframe: true, transparent: true, opacity: 0.5 }));
  wire.userData.role = "wire";
  wire.visible = false;
  g.add(wire);

  const contours = buildContours(p, scale);
  contours.userData.role = "contour";
  contours.visible = false;
  g.add(contours);

  // Gazetteer markers in the active plate bbox. The limit accommodates the
  // complete synced SoCal register inside the compact Angeles frame.
  labelMarkers = [];
  const [bw, bs, be, bn] = p.grid.bbox;
  const inBox = searchBox(gazIndex, { lat0: bs, lat1: bn, lon0: bw, lon1: be }, { limit: 120 });
  for (const r of inBox) {
    const m = sampleDem(p.grid, r.lon, r.lat);
    const x = ((r.lon - bw) / (be - bw) - 0.5) * w;
    const z = ((r.lat - bs) / (bn - bs) - 0.5) * d;
    const y = (m - min) * scale;
    const mg = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), new THREE.MeshBasicMaterial({ color: COL.marker }));
    mg.position.set(x, y + 0.8, z);
    mg.userData.pick = { kind: "gnis", label: r.name, detail: `${r.fclass} · ${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}` };
    g.add(mg);
    labelMarkers.push({ el: null, v: new THREE.Vector3(x, y + 1.9, z), text: r.name });
  }

  return g;
}

/** Contour lattice for X-RAY: segments where each elevation band crosses. */
function buildContours(p, scale) {
  const { nx, ny, elev, min, max } = p.grid;
  const { w, d } = p.world;
  const bands = 6;
  const pts = [];
  for (let b = 1; b < bands; b++) {
    const level = min + ((max - min) * b) / bands;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const e00 = elev[j * nx + i];
        const e10 = elev[j * nx + i + 1];
        const e01 = elev[(j + 1) * nx + i];
        const crosses = (e00 - level) * (e10 - level) < 0 || (e00 - level) * (e01 - level) < 0;
        if (!crosses) continue;
        pts.push(
          (i / (nx - 1) - 0.5) * w, (level - min) * scale, (j / (ny - 1) - 0.5) * d,
          ((i + 1) / (nx - 1) - 0.5) * w, (level - min) * scale, ((j + 1) / (ny - 1) - 0.5) * d,
        );
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: COL.contour, transparent: true, opacity: 0.7 }));
}

function applyMode() {
  if (!terrainGroup) return;
  terrainGroup.traverse((o) => {
    if (!o.userData.role) return;
    if (o.userData.role === "surface") {
      o.visible = true;
      o.material.wireframe = mode === "wire";
      o.material.transparent = mode === "xray";
      o.material.opacity = mode === "xray" ? 0.35 : 1;
      o.material.vertexColors = mode !== "wire";
      o.material.color.set(mode === "wire" ? 0x3f7d86 : 0xffffff);
      o.material.depthWrite = mode !== "xray";
      o.material.needsUpdate = true;
    } else if (o.userData.role === "wire") {
      o.visible = mode !== "relief";
    } else if (o.userData.role === "contour") {
      o.visible = mode === "xray";
    }
  });
  document.body.dataset.mode = mode;
  for (const b of document.querySelectorAll(".mode-switch [data-mode]")) {
    b.classList.toggle("active", b.dataset.mode === mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
  }
  announce(`${mode.toUpperCase()} · ${plate.name}`);
}

/* ------------------------------------------------------------ globe plate
   The Red October globe, reused (S4 tail): orthographic projection from
   apps/red-october-command-viewer/core.js, the same bundled Natural Earth
   outlines, and the country viewer's capitals as markers. Drag rotates.
   Coastline fetch failure degrades to graticule + markers, announced -
   the same fallback the Red October globe itself uses. */

function drawGlobe() {
  const cv = $("globeStage");
  if (!cv || !globeOn) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = innerWidth;
  const h = innerHeight;
  if (cv.width !== w * dpr || cv.height !== h * dpr) {
    cv.width = w * dpr;
    cv.height = h * dpr;
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  const { lat: cLat, lon: cLon } = globeCentre;
  const toPx = (p) => [cx + p.x * R, cy - p.y * R];

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = "#0d1a24";
  ctx.fill();
  ctx.strokeStyle = "rgba(92,214,255,0.5)";
  ctx.stroke();

  const drawLine = (coords, style) => {
    ctx.strokeStyle = style;
    ctx.beginPath();
    for (const seg of projectSegments(coords, cLat, cLon)) {
      seg.forEach((p, i) => {
        const [x, y] = toPx(p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    }
    ctx.stroke();
  };
  const grat = graticule(20);
  ctx.lineWidth = 0.5;
  for (const line of [...grat.meridians, ...grat.parallels]) drawLine(line, "rgba(125,143,153,0.25)");
  if (globeRings) {
    ctx.lineWidth = 0.7;
    for (const ring of globeRings) drawLine(ring, "rgba(92,214,255,0.75)");
  }

  if (globeData) {
    const vis = visibleMarkers(globeData.markers, cLat, cLon);
    ctx.fillStyle = "#ffb020";
    for (const m of vis) {
      const [x, y] = toPx(m);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (labelsOn) {
      ctx.font = "9px " + getComputedStyle(document.body).getPropertyValue("--mono");
      ctx.fillStyle = "rgba(215,227,232,0.9)";
      for (const m of vis.filter((v) => v.z > 0.55).slice(-42)) {
        const [x, y] = toPx(m);
        ctx.fillText(m.capital || m.name, x + 4, y - 3);
      }
    }
  }

  // Imported markers have their own palette and never imply a live feed.
  // visibleMarkers excludes the far hemisphere, exactly as for capitals.
  const sensorVis = visibleMarkers(
    filterIncidentFeatures(incidentSnapshot?.features ?? [], $("sensorKind")?.value ?? "all"),
    cLat, cLon,
  );
  cv.dataset.sensorVisible = String(sensorVis.length);
  for (const feature of sensorVis) {
    const [x, y] = toPx(feature);
    ctx.beginPath();
    ctx.arc(x, y, sameIncident(feature, selectedIncident) ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = INCIDENT_COLORS[feature.kind];
    ctx.fill();
    ctx.strokeStyle = "#051018";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (sameIncident(feature, selectedIncident)) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
  }
  if (labelsOn && sensorVis.length) {
    ctx.font = "bold 10px " + getComputedStyle(document.body).getPropertyValue("--mono");
    for (const feature of sensorVis.filter((m) => m.z > 0.65).slice(-16)) {
      const [x, y] = toPx(feature);
      ctx.fillStyle = INCIDENT_COLORS[feature.kind];
      ctx.fillText(feature.title.slice(0, 80), x + 7, y - 5);
    }
  }

  if (selectedGazetteer) {
    const p = projectOrthographic(selectedGazetteer.lat, selectedGazetteer.lon, cLat, cLon);
    if (p.visible) {
      const [x, y] = toPx(p);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ff5c78";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      if (labelsOn) {
        ctx.font = "bold 10px " + getComputedStyle(document.body).getPropertyValue("--mono");
        ctx.fillStyle = "#ffd7df";
        ctx.fillText(`${selectedGazetteer.name} · Gazetteer`, x + 8, y - 6);
      }
    }
  }
}

function setGlobe(on) {
  globeOn = on;
  syncGazetteerMarker();
  const cv = $("globeStage");
  if (cv) cv.hidden = !on;
  if (terrainGroup) terrainGroup.visible = !on;
  if (on) {
    setActivePlate("globe");
    const sh = $("statPlate");
    if (sh) sh.textContent = "plate: globe";
    renderChecks();
    renderLayers();
    drawGlobe();
    announce(
      globeRings
        ? `globe · ${globeData ? globeData.markers.length : 0} capital markers · Red October orthographic · drag to rotate`
        : "globe · coastlines unavailable — graticule and capital markers remain (offline fallback)",
    );
  }
}

/* ----------------------------------------------------- S5 local snapshot
   The globe is the only map for imported points. A snapshot is explicitly
   dated and never silently refreshed or fetched from agency hosts. */

const sameIncident = (a, b) => Boolean(a && b
  && a.id === b.id && a.kind === b.kind && a.sourceId === b.sourceId);

function renderIncidentSnapshot() {
  const status = $("sensorStatus");
  status.dataset.error = "false";
  const list = $("sensorResults");
  list.replaceChildren();
  const errors = $("sensorRejects");
  errors.hidden = !incidentSnapshot?.rejected.length;
  errors.querySelector("summary").textContent = `Rejected records: ${incidentSnapshot?.rejected.length ?? 0}`;
  const reasons = errors.querySelector("ul");
  reasons.replaceChildren();
  for (const reject of (incidentSnapshot?.rejected ?? []).slice(0, 20)) {
    const row = document.createElement("li");
    row.textContent = `${reject.id ?? "(no ID)"}: ${reject.reason}`;
    reasons.appendChild(row);
  }
  if (incidentSnapshot?.rejected.length > 20) {
    const more = document.createElement("li");
    more.textContent = `…and ${incidentSnapshot.rejected.length - 20} more; see the source file for details.`;
    reasons.appendChild(more);
  }
  $("sensorClear").disabled = !incidentSnapshot;
  if (!incidentSnapshot) {
    status.textContent = "No snapshot imported.";
    return;
  }
  const records = filterIncidentFeatures(incidentSnapshot.features, $("sensorKind").value);
  status.textContent = `Dated snapshot ${new Date(incidentSnapshot.capturedAtEpochMs).toISOString()} · `
    + `${records.length}/${incidentSnapshot.features.length} shown on GLOBE · `
    + `${incidentSnapshot.rejected.length} rejected, ${incidentSnapshot.deduplicatedCount} superseded · not live or saved.`;
  for (const feature of records.slice(0, 50)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sensor-record";
    button.setAttribute("aria-label", `Inspect ${feature.kind}: ${feature.title}`);
    const name = document.createElement("span");
    name.textContent = feature.title;
    const meta = document.createElement("small");
    meta.textContent = `${feature.kind} · ${feature.sourceId}`;
    button.append(name, meta);
    button.addEventListener("click", () => focusIncident(feature));
    list.appendChild(button);
  }
  if (records.length > 50) {
    const more = document.createElement("p");
    more.className = "tiny";
    more.textContent = `${records.length - 50} more markers on the globe. Narrow the kind filter to inspect more here.`;
    list.appendChild(more);
  }
}

function focusIncident(feature) {
  selectedIncident = feature;
  selectedGazetteer = null;
  clearGazetteerMarker();
  globeCentre = { lat: feature.lat, lon: feature.lon };
  if (pcgOn || !globeOn) selectPlate("globe");
  drawGlobe();
  $("infoTitle").textContent = feature.title;
  const host = $("infoBody");
  host.replaceChildren();
  const line = document.createElement("p");
  line.className = "small";
  line.textContent = `${feature.kind} · ${feature.lat.toFixed(5)}, ${feature.lon.toFixed(5)} · source ${feature.sourceId}`;
  const timing = document.createElement("p");
  timing.className = "tiny dim";
  timing.textContent = `Record updated ${new Date(feature.updatedEpochMs).toISOString()} · `
    + `snapshot captured ${new Date(incidentSnapshot.capturedAtEpochMs).toISOString()}. `
    + "Imported file only; no live status or remote link loaded.";
  host.append(line, timing);
  revealPanelOnCompact("inspectorPanel");
  announce(`Imported ${feature.kind} snapshot · ${feature.title} · centered globe (not live)`);
}

function pickIncidentAt(clientX, clientY) {
  const cv = $("globeStage");
  const rect = cv.getBoundingClientRect();
  const radius = Math.min(rect.width, rect.height) * 0.42;
  let closest = null;
  let distance = 12 ** 2;
  for (const feature of visibleMarkers(
    filterIncidentFeatures(incidentSnapshot?.features ?? [], $("sensorKind").value),
    globeCentre.lat, globeCentre.lon,
  )) {
    const x = rect.left + rect.width / 2 + feature.x * radius;
    const y = rect.top + rect.height / 2 - feature.y * radius;
    const d = (x - clientX) ** 2 + (y - clientY) ** 2;
    if (d < distance) { closest = feature; distance = d; }
  }
  if (closest) focusIncident(closest);
}

async function importIncidentFile(file) {
  const serial = ++incidentLoadSerial;
  try {
    if (file.size > MAX_SNAPSHOT_BYTES) throw new RangeError("snapshot exceeds 1 MiB limit");
    const parsed = parseIncidentSnapshot(await file.text());
    if (serial !== incidentLoadSerial) return; // clearing/reselecting beats a slow read
    incidentSnapshot = parsed;
    selectedIncident = null;
    renderIncidentSnapshot();
    if (!globeOn) selectPlate("globe");
    else { renderLayers(); drawGlobe(); }
    announce(`Imported dated local snapshot · ${parsed.features.length} accepted · ${parsed.rejected.length} rejected (not live)`);
  } catch (error) {
    if (serial !== incidentLoadSerial) return;
    const status = $("sensorStatus");
    status.dataset.error = "true";
    status.textContent = `Could not import: ${error.message}. ${incidentSnapshot ? "Previous snapshot kept." : "No snapshot loaded."}`;
  } finally {
    if (serial === incidentLoadSerial) $("sensorFile").value = "";
  }
}

function clearIncidentSnapshot() {
  incidentLoadSerial++;
  const wasSelected = Boolean(selectedIncident);
  incidentSnapshot = null;
  selectedIncident = null;
  $("sensorFile").value = "";
  $("sensorKind").value = "all";
  if (wasSelected) {
    $("infoTitle").textContent = "Inspector";
    $("infoBody").textContent = "Click a Gazetteer marker to inspect its place-name record and source.";
  }
  renderIncidentSnapshot();
  if (globeOn) { renderLayers(); drawGlobe(); }
  announce("Local incident snapshot cleared; no records retained");
}

/* ------------------------------------------------------- PC Globe index
   Index-only plate: decoded NAMES.DAT country names and COUNTRY1/2.DAT
   record label strings (js/pcglobe-index-data.js). The map payload is
   undecoded, so records stay in file order, unmatched to names, and no
   PC Globe geometry is ever drawn. */

function renderPcGlobe(filter) {
  const host = $("pcgBody");
  if (!host) return;
  const q = (filter || "").trim().toLowerCase();
  const names = PCGLOBE_COUNTRY_NAMES.filter((n) => !q || n.toLowerCase().includes(q));
  const records = PCGLOBE_COUNTRY_RECORDS.filter((r) =>
    !q || r.features.some((f) => f.toLowerCase().includes(q)) || `${r.file} ${r.index}`.toLowerCase().includes(q));
  host.innerHTML =
    `<h3>NAMES.DAT country index — ${names.length} of ${PCGLOBE_INDEX_META.countryNameCount} names</h3>` +
    `<div class="cols">${names.map((n) => esc(n)).join("<br>")}</div>` +
    `<h3>COUNTRY1.DAT / COUNTRY2.DAT records — ${records.length} of ${PCGLOBE_INDEX_META.countryRecordCount} records · ${PCGLOBE_INDEX_META.featureCount} decoded feature labels</h3>` +
    records.map((r) =>
      `<p class="rec"><b>${esc(r.file)} #${r.index}</b> · offset ${r.offset} · ${r.length} bytes ` +
      `(${r.undecodedPayloadBytes} undecoded) — ${r.features.map(esc).join(" · ") || "<i>no label strings</i>"}</p>`).join("") +
    `<p class="small dim">NAMES.DAT also carries a city-name run (${PCGLOBE_INDEX_META.cityNameRun.count} strings, ` +
    `${esc(PCGLOBE_INDEX_META.cityNameRun.first)} … ${esc(PCGLOBE_INDEX_META.cityNameRun.last)}) and a currency run ` +
    `(${PCGLOBE_INDEX_META.currencyRun.count}, ${esc(PCGLOBE_INDEX_META.currencyRun.first)} … ${esc(PCGLOBE_INDEX_META.currencyRun.last)}); ` +
    `only their counts were decoded, so they are reported, not listed.</p>`;
}

function setPcGlobe(on) {
  pcgOn = on;
  syncGazetteerMarker();
  const panel = $("pcgPanel");
  if (panel) panel.hidden = !on;
  if (terrainGroup) terrainGroup.visible = !on && !globeOn;
  if (on) {
    setActivePlate("pcg");
    const meta = $("pcgMeta");
    if (meta) {
      meta.textContent =
        `${PCGLOBE_INDEX_META.source} · ${PCGLOBE_INDEX_META.countryNameCount} country names · ` +
        `${PCGLOBE_INDEX_META.countryRecordCount} country records · ${PCGLOBE_INDEX_META.featureCount} feature labels · ` +
        `decoded by ${PCGLOBE_INDEX_META.decodedBy}`;
    }
    const sh = $("statPlate");
    if (sh) sh.textContent = "plate: pcglobe index";
    renderPcGlobe($("pcgSearch")?.value || "");
    announce("PC Globe index plate · decoded names and labels only — coordinates undecoded, nothing plotted");
  }
}

function setActivePlate(id) {
  for (const button of document.querySelectorAll(".plate-switch [data-plate]")) {
    const active = button.dataset.plate === id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function selectPlate(id) {
  setActivePlate(id);
  if (id === "pcg") {
    if (globeOn) setGlobe(false);
    setPcGlobe(true);
    return;
  }
  if (id === "globe") {
    setPcGlobe(false);
    setGlobe(true);
    return;
  }
  const next = plates[id];
  if (!next) return;
  if (pcgOn) setPcGlobe(false);
  if (globeOn) setGlobe(false);
  plate = next;
  if (terrainGroup) {
    scene.remove(terrainGroup);
    terrainGroup.traverse((o) => {
      if (o.isMesh || o.isLineSegments) {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose();
      }
    });
  }
  terrainGroup = buildTerrain(plate);
  scene.add(terrainGroup);
  syncGazetteerMarker();
  frame();
  applyMode();
  renderChecks();
  renderLayers();
  const sh = $("statPlate");
  if (sh) sh.textContent = `plate: ${plate.id}`;
  announce(`loaded ${plate.name} · ${plate.grid.nx}×${plate.grid.ny} · relief ${(plate.grid.max - plate.grid.min).toFixed(0)} m`);
}

function frame() {
  if (globeOn) {
    globeCentre = { lat: 20, lon: 10 };
    drawGlobe();
    return;
  }
  const { w, d } = plate.world;
  camera.position.set(w * 0.5, w * 0.55, d * 0.85);
  controls.target.set(0, 0, 0);
  camera.near = 0.1;
  camera.far = w * 40;
  camera.updateProjectionMatrix();
  controls.update();
}

/* --------------------------------------------------------------- panels */

function announce(msg) {
  const s = $("status");
  if (s) s.textContent = msg;
}

const PANEL_BUTTONS = { controlsPanel: "btnControls", inspectorPanel: "btnInspector" };
function compactPanels() {
  return typeof matchMedia === "function"
    ? matchMedia("(max-width: 760px)").matches
    : innerWidth <= 760;
}
function setPanelOpen(panelId, open) {
  if (!compactPanels()) open = false;
  if (open) {
    for (const id of Object.keys(PANEL_BUTTONS)) {
      if (id !== panelId) setPanelOpen(id, false);
    }
  }
  const panel = $(panelId);
  const button = $(PANEL_BUTTONS[panelId]);
  panel?.classList.toggle("is-open", open);
  button?.setAttribute("aria-expanded", String(open));
}
function revealPanelOnCompact(panelId) {
  if (compactPanels()) setPanelOpen(panelId, true);
}
function syncResponsivePanels() {
  if (!compactPanels()) {
    for (const id of Object.keys(PANEL_BUTTONS)) setPanelOpen(id, false);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderChecks() {
  const host = $("checkList");
  if (!host) return;
  const list = runChecks(plates).filter((c) => c.plate === null || c.plate === plate.id);
  host.innerHTML = list
    .map(
      (c) => `<div class="check ${c.ok ? "ok" : "bad"}"><span class="dot"></span><div>
      <b>${esc(c.label)}</b>${c.kind === "contradiction" ? " <em>contradiction</em>" : ""}
      <div class="tiny">${esc(c.actual)}</div>
      <div class="tiny dim">expects ${esc(c.expected)}</div></div></div>`,
    )
    .join("");
  const pass = list.filter((c) => c.ok).length;
  $("statChecks").textContent = `checks: ${pass}/${list.length}`;
}

function renderLayers() {
  const host = $("layerList");
  if (!host) return;
  const rows = globeOn ? [
    ["capitals", "Factbook capitals", String(globeData?.markers.length ?? 0)],
    ["coasts", "Offline coastlines", globeRings ? "on" : "unavailable"],
    ["sensor", "Imported snapshot (not live)", String(filterIncidentFeatures(
      incidentSnapshot?.features ?? [], $("sensorKind")?.value ?? "all",
    ).length)],
  ] : (() => {
    const [bw, bs, be, bn] = plate.grid.bbox;
    const inBox = searchBox(gazIndex, { lat0: bs, lat1: bn, lon0: bw, lon1: be }, { limit: 120 });
    return [
      ["surface", "Hypsometric surface", `${plate.grid.nx}×${plate.grid.ny}`],
      ["wire", "Wireframe lattice", mode === "wire" ? "on" : "off"],
      ["contour", "Contour bands (x-ray)", "6"],
      ["gnis", "Gazetteer points", String(inBox.length)],
    ];
  })();
  host.innerHTML = rows
    .map(
      ([k, label, val]) =>
        `<li class="legend-row" data-layer="${k}"><span class="swatch s-${k}"></span><span class="lname">${esc(label)}</span><span class="lval">${esc(val)}</span></li>`,
    )
    .join("");
}

/* ------------------------------------------------------------- VRML out */

function exportVrml() {
  if (globeOn) {
    announce("VRML export belongs to the terrain plates — select CHEYENNE, SAN GABRIEL or LAWRENCE");
    return;
  }
  const wrl = demToVrml(plate.grid, { w: plate.world.w, d: plate.world.d, elevScale: exag / 1000 }, null, `Planet viewer — ${plate.name}`, {
    layers: { weather: false, glass: false },
  });
  downloadText(`${plate.id}-planet.wrl`, wrl);
  announce(`wrote ${plate.id}-planet.wrl · ${wrl.length.toLocaleString()} bytes`);
}

/* ------------------------------------------------------------- labels */

function syncLabels() {
  const host = $("labels");
  if (!host) return;
  if (globeOn) {
    host.innerHTML = "";
    return;
  }
  if (!labelsOn || !terrainGroup) {
    host.innerHTML = "";
    labelMarkers.forEach((m) => (m.el = null));
    return;
  }
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  for (const m of labelMarkers) {
    if (!m.el) {
      m.el = document.createElement("div");
      m.el.className = "lbl";
      host.appendChild(m.el);
    }
    const v = m.v.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    if (v.z > 1 || x < -60 || x > w + 60 || y < -40 || y > h + 40) {
      m.el.style.display = "none";
      continue;
    }
    m.el.style.display = "";
    m.el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    m.el.textContent = m.text;
  }
}

/* ------------------------------------------------------------- search */

function publishGazetteerMarkerState() {
  if (renderer?.domElement) {
    renderer.domElement.dataset.gazetteerMarker = gazetteerMarker ? "active" : "none";
  }
}

function clearGazetteerMarker() {
  if (gazetteerMarker) {
    scene?.remove(gazetteerMarker);
    gazetteerMarker.geometry?.dispose();
    gazetteerMarker.material?.dispose();
    gazetteerMarker = null;
  }
  publishGazetteerMarkerState();
}

function syncGazetteerMarker() {
  clearGazetteerMarker();
  if (!scene || !plate || !selectedGazetteer || globeOn || pcgOn) return;
  const destination = locateGazetteerPoint(plates, PLATE_ORDER, selectedGazetteer);
  if (destination?.kind !== "terrain" || destination.plateId !== plate.id) return;

  const [west, south, east, north] = plate.grid.bbox;
  const { w, d } = plate.world;
  const x = ((selectedGazetteer.lon - west) / (east - west) - 0.5) * w;
  const z = ((selectedGazetteer.lat - south) / (north - south) - 0.5) * d;
  const y = (sampleDem(plate.grid, selectedGazetteer.lon, selectedGazetteer.lat) - plate.grid.min) * (exag / 1000);
  const radius = Math.max(0.1, Math.min(w, d) * 0.004);
  gazetteerMarker = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xff5c78, depthTest: false }),
  );
  gazetteerMarker.position.set(x, y + radius * 1.5, z);
  gazetteerMarker.renderOrder = 10;
  gazetteerMarker.name = "gazetteer-marker";
  scene.add(gazetteerMarker);
  publishGazetteerMarkerState();
}

function focusGazetteerPoint(point) {
  selectedGazetteer = point;
  const hasCoords = Number.isFinite(point?.lat) && Number.isFinite(point?.lon);
  const identity = point?.verified && point?.gnis
    ? `USGS GNIS ${point.gnis}`
    : hasCoords ? "reference point; no GNIS id claimed" : "name-only locality; no coordinates included";
  $("infoTitle").textContent = point?.name || "Place record";
  $("infoBody").innerHTML =
    `<div class="tiny dim">${esc(point?.fclass || "Place")} · ${esc(point?.county || "area not recorded")}</div>` +
    `<p class="small">${hasCoords ? `${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}` : "Coordinates not included"} · ${esc(identity)}</p>` +
    (point?.note ? `<p class="tiny dim">${esc(point.note)}</p>` : "");
  revealPanelOnCompact("inspectorPanel");
  if (!hasCoords) {
    announce(`${point?.name || "Place"} · locality record, not a country profile · coordinates not included; no map pin shown`);
    return;
  }

  const destination = locateGazetteerPoint(plates, PLATE_ORDER, point);
  if (!destination) {
    announce("This Gazetteer result has invalid coordinates.");
    return;
  }
  if (destination.kind === "terrain") {
    if (globeOn || pcgOn || plate.id !== destination.plateId) selectPlate(destination.plateId);
    syncGazetteerMarker();
    const [west, south, east, north] = plate.grid.bbox;
    const { w, d } = plate.world;
    const x = ((point.lon - west) / (east - west) - 0.5) * w;
    const z = ((point.lat - south) / (north - south) - 0.5) * d;
    const y = (sampleDem(plate.grid, point.lon, point.lat) - plate.grid.min) * (exag / 1000);
    controls.target.set(x, y, z);
    const range = Math.max(8, Math.min(w, d) * 0.24);
    camera.position.set(x + range, y + range * 1.2, z + range * 1.6);
    controls.update();
    announce(`${identity} · ${point.name} · ${plate.name} terrain plate · ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`);
    return;
  }

  setPcGlobe(false);
  globeCentre = { lat: point.lat, lon: point.lon };
  setGlobe(true);
  drawGlobe();
  announce(`Gazetteer · ${point.name} · no terrain plate in the offline set; centered globe · ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`);
}

function doSearch(q) {
  const host = $("searchResults");
  selectedGazetteer = null;
  clearGazetteerMarker();
  if (globeOn) drawGlobe();
  if (!q || q.length < 2) {
    host.innerHTML = q ? `<div class="tiny dim">Enter at least two characters.</div>` : "";
    return;
  }
  const hits = searchName(gazIndex, q, { limit: 8 });
  host.innerHTML = hits.length
    ? hits.map((r, i) => {
      const destination = locateGazetteerPoint(plates, PLATE_ORDER, r);
      const place = !Number.isFinite(r.lat) || !Number.isFinite(r.lon)
        ? "name only · no coordinates"
        : destination?.kind === "terrain" ? `${plates[destination.plateId].name} plate` : "globe";
      const identity = r.verified && r.gnis
        ? `GNIS ${r.gnis}`
        : Number.isFinite(r.lat) && Number.isFinite(r.lon) ? "reference point" : "locality name";
      return `<button type="button" class="res" data-result="${i}" aria-label="${esc(r.name)}, ${esc(r.fclass)}, ${esc(identity)}, ${esc(place)}">` +
        `<b>${esc(r.name)}</b><span>${esc(r.fclass)} · ${esc(identity)} · ${esc(place)}</span></button>`;
    }).join("")
    : `<div class="tiny dim">No match in the limited offline place-name index; this is not a live or complete lookup.</div>`;
  host.querySelectorAll(".res").forEach((button) => {
    button.addEventListener("click", () => focusGazetteerPoint(hits[Number(button.dataset.result)]));
  });
}

/* ------------------------------------------------------------- 4Dwm */

function initWm() {
  const cards = [
    ...PLATE_ORDER.map((id) => ({ id: `plate:${id}`, ref: plates[id] })),
    { id: "src-dem", ref: { id: "src-dem", label: "USGS 3DEP control points (NAVD 88)", tier: "official", note: "Committed control sets, Shepard-interpolated; grain between samples is disclosed texture, not data. This sandbox cannot reach USGS endpoints, so no live fetch." } },
    { id: "src-gnis", ref: { id: "src-gnis", label: "USGS GNIS-oriented offline registers", tier: "official", note: "Cheyenne/Pikes Peak names plus the synced SoCal register and five city datasets; Gazetteer search is implemented client-side with trigram similarity. The source packs retain their own coordinates and verification levels; this is a limited place-name index, not a live or complete lookup." } },
  ];
  const byId = Object.fromEntries(cards.map((c) => [c.id, c.ref]));
  wm = initPipWm({
    layer: $("pipLayer"),
    desk: $("wm4dDesk"),
    tray: $("wm4dTray"),
    status: $("wm4dStatus"),
    findRecord: (id) => byId[id],
    titleFor: (r) => r.name || r.label,
    chipFor: (r) => ({ top: r.name || r.label, sub: r.id || r.tier }),
    detailHtml: (r) =>
      r.grid
        ? `<div class="tiny">${esc(r.meta.plateSource || r.meta.source || "")}</div><p class="small">relief ${(r.grid.max - r.grid.min).toFixed(0)} m · ${r.grid.nx}×${r.grid.ny} · datum ${esc(r.meta.verticalDatum || "NAVD 88")}</p>`
        : `<div class="tiny"><span class="tier t-${r.tier}">${r.tier}</span></div><p class="small">${esc(r.note)}</p>`,
    bindBody: (root, r) => {
      if (!r.grid) return;
      const btn = document.createElement("button");
      btn.className = "pip-act";
      btn.type = "button";
      btn.textContent = "LOAD THIS PLATE";
      btn.addEventListener("click", () => selectPlate(r.id));
      root.appendChild(btn);
    },
    announce,
  });
  const host = $("cardList");
  if (host) {
    host.innerHTML = cards
      .map((c) => `<button type="button" class="card" data-id="${c.id}"><b>${esc(c.ref.name || c.ref.label)}</b><span>${esc(c.ref.id || c.ref.tier)}</span></button>`)
      .join("");
    host.querySelectorAll(".card").forEach((el) => el.addEventListener("click", () => wm.spawn(el.dataset.id)));
  }
}

/* ------------------------------------------------------------- boot */

function bind() {
  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    syncResponsivePanels();
    if (globeOn) drawGlobe();
  });
  syncResponsivePanels();
  for (const [panelId, buttonId] of Object.entries(PANEL_BUTTONS)) {
    $(buttonId)?.addEventListener("click", () => {
      const panel = $(panelId);
      setPanelOpen(panelId, !panel?.classList.contains("is-open"));
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !compactPanels()) return;
    for (const id of Object.keys(PANEL_BUTTONS)) setPanelOpen(id, false);
  });

  const gc = $("globeStage");
  if (gc) {
    let drag = null;
    gc.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false };
      gc.setPointerCapture(e.pointerId);
    });
    gc.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 5) drag.moved = true;
      globeCentre.lon -= (e.clientX - drag.x) * 0.25;
      globeCentre.lat = Math.max(-80, Math.min(80, globeCentre.lat + (e.clientY - drag.y) * 0.25));
      drag.x = e.clientX;
      drag.y = e.clientY;
      drawGlobe();
    });
    gc.addEventListener("pointerup", (e) => {
      if (drag && !drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) <= 5) {
        pickIncidentAt(e.clientX, e.clientY);
      }
      drag = null;
    });
    gc.addEventListener("pointercancel", () => (drag = null));
  }

  document.querySelectorAll(".plate-switch [data-plate]").forEach((b) =>
    b.addEventListener("click", () => selectPlate(b.dataset.plate)),
  );
  document.querySelectorAll(".mode-switch [data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      applyMode();
    }),
  );
  $("btnLabels")?.addEventListener("click", () => {
    labelsOn = !labelsOn;
    $("btnLabels").classList.toggle("active", labelsOn);
    $("btnLabels").setAttribute("aria-pressed", String(labelsOn));
    if (globeOn) drawGlobe();
    else syncLabels();
  });
  $("btnReset")?.addEventListener("click", frame);
  $("btnVrml")?.addEventListener("click", exportVrml);
  $("vertExag")?.addEventListener("input", (e) => {
    exag = Number(e.target.value);
    $("vertExagVal").textContent = `${exag}×`;
    selectPlate(plate.id);
  });
  $("searchBox")?.addEventListener("input", (e) => doSearch(e.target.value.trim()));
  $("pcgSearch")?.addEventListener("input", (e) => renderPcGlobe(e.target.value));
  $("sensorFile").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) void importIncidentFile(file);
  });
  $("sensorKind").addEventListener("change", () => {
    if (selectedIncident) {
      selectedIncident = null;
      $("infoTitle").textContent = "Inspector";
      $("infoBody").textContent = "Select a snapshot record or marker to inspect its source.";
    }
    renderIncidentSnapshot();
    if (globeOn) { renderLayers(); drawGlobe(); }
  });
  $("sensorClear").addEventListener("click", clearIncidentSnapshot);

  renderer.domElement.addEventListener("pointerdown", (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(terrainGroup.children.filter((o) => o.userData.pick), false)[0];
    if (!hit) return;
    $("infoTitle").textContent = hit.object.userData.pick.label;
    $("infoBody").innerHTML = `<div class="tiny dim">${esc(hit.object.userData.pick.detail)}</div>`;
    revealPanelOnCompact("inspectorPanel");
  });
}

function init() {
  gazIndex = makeGazetteerIndex(PLANET_GAZ_ROWS);
  plates = buildPlates(140, 100);
  globeData = globeMarkers(COUNTRIES);
  // Same bundled coastline file the Red October globe draws; failure is a
  // disclosed fallback (graticule + markers), never a fabricated outline.
  fetch("./vendor/world/countries.geo.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (j) {
        globeRings = coastlineRings(j);
        if (globeOn) {
          renderLayers();
          drawGlobe();
        }
      }
    })
    .catch(() => {});

  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.sky);
  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 6000);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xbfd4dd, 0.8));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
  sun.position.set(80, 140, 40);
  scene.add(sun);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  selectPlate("chey");
  initWm();
  renderIncidentSnapshot();
  bind();
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
    // Expose the active plate and actual Three.js draw counts on the canvas
    // for diagnostics and deterministic browser smoke tests.
    renderer.domElement.dataset.activePlate = globeOn ? "globe" : pcgOn ? "pcg" : plate.id;
    renderer.domElement.dataset.cameraDistance = controls.getDistance().toFixed(3);
    renderer.domElement.dataset.drawCalls = String(renderer.info.render.calls);
    renderer.domElement.dataset.triangles = String(renderer.info.render.triangles);
    syncLabels();
    fpsAcc.n++;
    const now = performance.now();
    if (!fpsAcc.t0) fpsAcc.t0 = now;
    if (now - fpsAcc.t0 >= 1000) {
      fpsAcc.fps = Math.round((fpsAcc.n * 1000) / (now - fpsAcc.t0));
      fpsAcc.n = 0;
      fpsAcc.t0 = now;
      const h = $("hudFps");
      if (h) h.textContent = `${fpsAcc.fps} fps`;
    }
  });
  announce("boot · three USGS 3DEP plates loaded");
}

init();
export { init, selectPlate, applyMode, exportVrml };
