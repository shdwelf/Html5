/**
 * LAWRENCE SUBSURFACE 4Dwm — Lawrence, Kansas.
 *
 * The scene shell and Gazetteer/GPX workflow follow SOCAL SUBSURFACE, but the
 * content stays local to Douglas County: USGS 3DEP sampled terrain, official
 * GNIS point features, and an optional user-supplied GPX. No SoCal pipelines,
 * fire, radio, or orbital overlays are misrepresented as Kansas data.
 *
 * The offline terrain is an 8x8 sample grid from the USGS 3DEP ImageServer.
 * Interpolation is for visualization only; this is not a survey or utility
 * locate. For a denser locally generated grid, see scripts/fetch-lawrence-dem.py.
 */
import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  BBOX,
  BASE_ELEVATION_M,
  CENTER,
  KM_PER_DEG_LAT,
  KM_PER_DEG_LON,
  demInfo,
  elevationAt,
  frameSizeKm,
  insideFrame,
  loadHighResolutionDem,
  lonLatFromXZ,
  project,
  surfaceY,
} from "./lawrence-geo.js";
import { GAZ_META, GAZ_ROWS } from "./lawrence-gazetteer-data.js";
import {
  GAZ_CLASS_META,
  GAZ_FACETS,
  classRollup,
  getCapabilities,
  makeGazetteerIndex,
  searchBox,
  searchName,
} from "./socal-gazetteer.js";
import {
  MAX_GPX_BYTES,
  MAX_GPX_WAYPOINTS,
  geocachesToGazetteerRows,
  parseGeocacheGpx,
} from "./socal-geocache-gpx.js";

const $ = (id) => document.getElementById(id);
const canvas = $("stage");
if (!canvas || !(canvas.getContext("webgl2") || canvas.getContext("webgl"))) {
  const fallback = document.createElement("div");
  fallback.className = "fallback";
  fallback.textContent = "WebGL is unavailable in this webview, so the 3D terrain cannot render.";
  document.body.append(fallback);
  throw new Error("no-webgl");
}

// The optional local GeoTIFF resample, if present, is loaded before the terrain
// mesh is constructed. The app makes no network request at runtime.
const hasHighResolutionDem = await loadHighResolutionDem();
const dimensions = frameSizeKm();
const WIDTH_KM = dimensions.width;
const HEIGHT_KM = dimensions.height;
let VERT_EXAG = Number($("vertExag")?.value ?? 18);
let DEPTH_EXAG = Number($("depthExag")?.value ?? 2);
const TERRAIN_NX = 128;
const TERRAIN_NY = 128;

/* --------------------------------------------------------------- scene */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1018);
scene.fog = new THREE.Fog(0x0b1018, Math.max(WIDTH_KM, HEIGHT_KM) * 1.0, Math.max(WIDTH_KM, HEIGHT_KM) * 2.4);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.03, 300);
camera.position.set(0, HEIGHT_KM * 0.62, HEIGHT_KM * 0.78);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.minDistance = 0.8;
controls.maxDistance = Math.max(WIDTH_KM, HEIGHT_KM) * 2.4;
controls.target.set(0, 0.45, 0);

scene.add(new THREE.HemisphereLight(0xb9d0ff, 0x1b211a, 1.15));
const sun = new THREE.DirectionalLight(0xffe7bd, 1.45);
sun.position.set(-WIDTH_KM * 0.45, HEIGHT_KM, HEIGHT_KM * 0.28);
scene.add(sun);

const terrainGroup = new THREE.Group();
const placeGroup = new THREE.Group();
const hydroGroup = new THREE.Group();
const cacheGroup = new THREE.Group();
const labelGroup = new THREE.Group();
const cutawayGroup = new THREE.Group();
scene.add(terrainGroup, placeGroup, hydroGroup, cacheGroup, labelGroup, cutawayGroup);

const TERRAIN_MIN_M = 238;
const TERRAIN_MAX_M = 333;
const groundColor = new THREE.Color();
const lowTerrainColor = new THREE.Color(0x536b56); // Kaw floodplain / low ground
const highTerrainColor = new THREE.Color(0xa58d65); // upland loess / limestone hills
function terrainColor(elevM) {
  const f = THREE.MathUtils.clamp((elevM - TERRAIN_MIN_M) / (TERRAIN_MAX_M - TERRAIN_MIN_M), 0, 1);
  groundColor.copy(lowTerrainColor).lerp(highTerrainColor, f);
  return groundColor;
}

function buildTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(WIDTH_KM, HEIGHT_KM, TERRAIN_NX - 1, TERRAIN_NY - 1);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  let low = Infinity;
  let high = -Infinity;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const [lon, lat] = lonLatFromXZ(x, z);
    const elev = elevationAt(lon, lat) ?? BASE_ELEVATION_M;
    position.setY(i, surfaceY(elev, VERT_EXAG));
    low = Math.min(low, elev);
    high = Math.max(high, elev);
    const color = terrainColor(elev);
    color.toArray(colors, i * 3);
  }
  position.needsUpdate = true;
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return { geometry, minY: surfaceY(low, VERT_EXAG), minElevation: low, maxElevation: high };
}

const terrainMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.96,
  metalness: 0,
  side: THREE.DoubleSide,
});
const terrainMesh = new THREE.Mesh(new THREE.BufferGeometry(), terrainMaterial);
terrainMesh.name = "3DEP Lawrence terrain";
terrainGroup.add(terrainMesh);

const cutawayMaterial = new THREE.MeshStandardMaterial({
  color: 0x20190f,
  roughness: 1,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.82,
});
const cutawayMesh = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH_KM, HEIGHT_KM).rotateX(-Math.PI / 2), cutawayMaterial);
cutawayMesh.name = "Schematic subsurface datum (no utility alignments)";
cutawayGroup.add(cutawayMesh);

const grid = new THREE.GridHelper(Math.max(WIDTH_KM, HEIGHT_KM), 20, 0x456079, 0x263949);
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);

let terrainState = buildTerrainGeometry();
terrainMesh.geometry.dispose();
terrainMesh.geometry = terrainState.geometry;
grid.position.y = terrainState.minY - 0.5;
cutawayMesh.position.y = terrainState.minY - (0.35 * DEPTH_EXAG);

/* ----------------------------------------------------------- gazetteer */

const gazetteer = makeGazetteerIndex(GAZ_ROWS.slice());
const BASE_GAZETTEER_COUNT = gazetteer.entries.length;
const pinGeometry = new THREE.SphereGeometry(0.15, 10, 8);
const mastGeometry = new THREE.CylinderGeometry(0.024, 0.024, 0.34, 6);
const pinMaterials = new Map();
const pinByIndex = new Map();
const labelByIndex = new Map();

function materialFor(color) {
  if (!pinMaterials.has(color)) {
    pinMaterials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 }));
  }
  return pinMaterials.get(color);
}

function makeTextSprite(text, color) {
  const raster = document.createElement("canvas");
  const context = raster.getContext("2d");
  if (!context) return null;
  const fontSize = 28;
  context.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const width = Math.max(96, Math.ceil(context.measureText(text).width) + 22);
  raster.width = width;
  raster.height = 46;
  context.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillStyle = "rgba(4, 9, 15, 0.82)";
  context.fillRect(0, 0, width, raster.height);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(1, 1, width - 2, raster.height - 2);
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.fillText(text, 10, raster.height / 2);
  const texture = new THREE.CanvasTexture(raster);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(Math.max(0.9, text.length * 0.105), 0.38, 1);
  return sprite;
}

function pinColor(entry) {
  if (entry.fclass === "Geocache") return "#34d399";
  return GAZ_CLASS_META[entry.fclass]?.swatch ?? "#9db2d1";
}

function pinTargetY(entry) {
  const elev = entry.elev ?? elevationAt(entry.lon, entry.lat) ?? BASE_ELEVATION_M;
  return surfaceY(elev, VERT_EXAG);
}

function addPin(entry) {
  const color = pinColor(entry);
  const parent = entry.fclass === "Geocache" ? cacheGroup : entry.fclass === "Populated Place" ? placeGroup : hydroGroup;
  const group = new THREE.Group();
  group.userData.entry = entry;
  const mast = new THREE.Mesh(mastGeometry, materialFor(color));
  mast.position.y = 0.20;
  mast.userData.entry = entry;
  const head = new THREE.Mesh(pinGeometry, materialFor(color));
  head.position.y = 0.42;
  head.userData.entry = entry;
  group.add(mast, head);
  parent.add(group);
  pinByIndex.set(entry.i, group);

  if (entry.fclass !== "Geocache") {
    const sprite = makeTextSprite(entry.name, color);
    if (sprite) {
      labelGroup.add(sprite);
      labelByIndex.set(entry.i, sprite);
    }
  }
  placePin(group, entry);
  return group;
}

function placePin(group, entry) {
  const [x, , z] = project(entry.lon, entry.lat);
  group.position.set(x, pinTargetY(entry), z);
  const sprite = labelByIndex.get(entry.i);
  if (sprite) sprite.position.set(x, pinTargetY(entry) + 0.68, z);
}

for (const entry of gazetteer.entries) addPin(entry);

/* -------------------------------------------------------------- layers */

let xray = false;
let wireframe = false;
let labelsOn = true;
const layerDefs = [
  { key: "terrain", label: "USGS 3DEP terrain", on: true, group: terrainGroup },
  { key: "places", label: "GNIS populated places", on: true, group: placeGroup },
  { key: "hydro", label: "GNIS streams + lakes", on: true, group: hydroGroup },
  { key: "caches", label: "User-imported GPX geocaches", on: true, group: cacheGroup },
  { key: "cutaway", label: "Schematic subsurface datum", on: false, group: cutawayGroup },
  { key: "grid", label: "Coordinate reference grid", on: false, object: grid },
];
const layerHost = $("layerList");
const layerToggles = new Map();
for (const layer of layerDefs) {
  const row = document.createElement("label");
  row.className = "layer-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = layer.on;
  checkbox.setAttribute("aria-label", layer.label);
  const text = document.createTextNode(layer.label);
  row.append(checkbox, document.createElement("span"), text);
  layerHost.append(row);
  layerToggles.set(layer.key, checkbox);
  checkbox.addEventListener("change", () => {
    layer.on = checkbox.checked;
    applyLayers();
  });
}
function applyLayers() {
  for (const layer of layerDefs) {
    if (layer.group) layer.group.visible = layer.key === "cutaway" ? layer.on || xray : layer.on;
    if (layer.object) layer.object.visible = layer.on;
  }
  updateHud();
}
applyLayers();

/* ------------------------------------------------------------- controls */

function setPressed(button, pressed) {
  button?.setAttribute("aria-pressed", String(Boolean(pressed)));
}
$("btnXray")?.addEventListener("click", (event) => {
  xray = !xray;
  terrainMaterial.transparent = xray;
  terrainMaterial.opacity = xray ? 0.32 : 1;
  cutawayGroup.visible = xray || Boolean(layerToggles.get("cutaway")?.checked);
  setPressed(event.currentTarget, xray);
});
$("btnWire")?.addEventListener("click", (event) => {
  wireframe = !wireframe;
  terrainMaterial.wireframe = wireframe;
  setPressed(event.currentTarget, wireframe);
});
$("btnLabels")?.addEventListener("click", (event) => {
  labelsOn = !labelsOn;
  labelGroup.visible = labelsOn;
  setPressed(event.currentTarget, labelsOn);
});

function updateTerrain() {
  const next = buildTerrainGeometry();
  terrainMesh.geometry.dispose();
  terrainMesh.geometry = next.geometry;
  terrainState = next;
  grid.position.y = next.minY - 0.5;
  cutawayMesh.position.y = next.minY - (0.35 * DEPTH_EXAG);
  for (const entry of gazetteer.entries) {
    const group = pinByIndex.get(entry.i);
    if (group) placePin(group, entry);
  }
  controls.target.y = surfaceY(elevationAt(CENTER.lon, CENTER.lat) ?? BASE_ELEVATION_M, VERT_EXAG) * 0.5;
}

$("vertExag")?.addEventListener("input", (event) => {
  VERT_EXAG = Number(event.currentTarget.value);
  $("vertExagVal").textContent = `${VERT_EXAG}×`;
  updateTerrain();
});
$("depthExag")?.addEventListener("input", (event) => {
  DEPTH_EXAG = Number(event.currentTarget.value);
  $("depthExagVal").textContent = `${DEPTH_EXAG}×`;
  cutawayMesh.position.y = terrainState.minY - (0.35 * DEPTH_EXAG);
});

/* -------------------------------------------------------------- camera */

const viewList = [
  { id: "overview", label: "VIEW · LAWRENCE / DOUGLAS COUNTY", lon: CENTER.lon, lat: CENTER.lat, distance: Math.max(WIDTH_KM, HEIGHT_KM) * 0.83 },
  { id: "lawrence", label: "VIEW · LAWRENCE (GNIS)", lon: -95.235257697033887, lat: 38.971675824003874, distance: 5.8 },
  { id: "kaw", label: "VIEW · KANSAS RIVER (GNIS)", lon: -95.247480004109718, lat: 39.005563828421565, distance: 4.3 },
  { id: "wakarusa", label: "VIEW · WAKARUSA RIVER (GNIS)", lon: -95.255813797171371, lat: 38.911121512695331, distance: 4.3 },
  { id: "potter", label: "VIEW · POTTER LAKE (GNIS)", lon: -95.248737397572469, lat: 38.960326978991638, distance: 3.4 },
];
const viewSelect = $("viewSelect");
for (const view of viewList) {
  const option = document.createElement("option");
  option.value = view.id;
  option.textContent = view.label;
  viewSelect.append(option);
}
function setView(view) {
  const [x, , z] = project(view.lon, view.lat);
  const targetY = surfaceY(elevationAt(view.lon, view.lat) ?? BASE_ELEVATION_M, VERT_EXAG);
  const distance = view.distance;
  controls.target.set(x, targetY, z);
  camera.position.set(x + distance * 0.42, targetY + distance * 0.65, z + distance * 0.82);
  controls.update();
}
viewSelect.addEventListener("change", () => {
  const selected = viewList.find((view) => view.id === viewSelect.value);
  if (selected) setView(selected);
});
viewSelect.value = "overview";
setView(viewList[0]);
$("btnReset")?.addEventListener("click", () => {
  viewSelect.value = "overview";
  setView(viewList[0]);
});

/* ---------------------------------------------------------- Gazetteer UI */

const gazIndex = gazetteer;
const gazQuery = $("gazQuery");
const gazFacet = $("gazFacet");
const gazClassesHost = $("gazClasses");
const gazHits = $("gazHits");
const gazState = { facet: "", classes: null };
const gazClassToggles = [];

for (const facet of GAZ_FACETS) {
  const option = document.createElement("option");
  option.value = facet.fac;
  option.textContent = facet.label;
  gazFacet.append(option);
}
gazFacet.addEventListener("change", () => {
  gazState.facet = gazFacet.value;
  runGazSearch();
});

function currentGazRows() {
  return gazIndex.entries.map((entry) => [entry.name, entry.fclass, entry.ftt, entry.county, entry.lat, entry.lon]);
}
function refreshClassFilters() {
  const previousSelection = gazState.classes ? new Set(gazState.classes) : null;
  gazClassesHost.textContent = "";
  gazClassToggles.length = 0;
  const classes = classRollup(currentGazRows(), ["Geocache"]);
  for (const category of classes) {
    const label = document.createElement("label");
    label.className = "gaz-chip";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = previousSelection === null || previousSelection.has(category.fclass);
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = category.swatch;
    const count = document.createElement("span");
    count.textContent = `${category.label} ${category.count}`;
    label.append(checkbox, swatch, count);
    gazClassesHost.append(label);
    gazClassToggles.push({ checkbox, category, count });
    checkbox.addEventListener("change", () => {
      const selected = gazClassToggles.filter((item) => item.checkbox.checked).map((item) => item.category.fclass);
      gazState.classes = selected.length === gazClassToggles.length ? null : new Set(selected);
      runGazSearch();
    });
  }
  if (previousSelection !== null) {
    const selected = gazClassToggles.filter((item) => item.checkbox.checked).map((item) => item.category.fclass);
    gazState.classes = selected.length === gazClassToggles.length ? null : new Set(selected);
  }
}
refreshClassFilters();

const caps = getCapabilities(GAZ_ROWS, ["Geocache"]);
$("gazCaps").textContent = `${GAZ_META.rowCount} records · ${GAZ_META.verified} GNIS IDs · ${caps.srs}`;

function addHitItem(entry, detailText) {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = `gaz-hit${entry.verified ? " verified" : ""}`;
  const meta = GAZ_CLASS_META[entry.fclass] ?? { short: "GNIS", swatch: "#9db2d1" };
  button.style.setProperty("--gaz", pinColor(entry));
  const name = document.createElement("span");
  name.className = "gaz-hit-name";
  name.textContent = entry.name;
  const details = document.createElement("span");
  details.className = "gaz-hit-meta";
  details.textContent = detailText ?? `${meta.short} · ${entry.county || "user GPX"} · ${entry.lat.toFixed(4)}, ${entry.lon.toFixed(4)}`;
  button.append(name, details);
  button.addEventListener("click", () => focusEntry(entry));
  item.append(button);
  gazHits.append(item);
}

function renderGazHits(hits, mode = "name") {
  gazHits.textContent = "";
  for (const entry of hits.slice(0, 40)) {
    const detail = mode === "box"
      ? `${entry.fclass} · ${entry.county || "user GPX"} · ${entry.lat.toFixed(4)}, ${entry.lon.toFixed(4)}`
      : undefined;
    addHitItem(entry, detail);
  }
}

function runGazSearch() {
  const query = String(gazQuery.value ?? "").trim();
  if (query.length < 2) {
    renderGazHits([]);
    return;
  }
  renderGazHits(searchName(gazIndex, query, {
    facet: gazState.facet,
    classes: gazState.classes,
    limit: 40,
  }));
}
let gazSearchTimer = 0;
gazQuery.addEventListener("input", () => {
  clearTimeout(gazSearchTimer);
  gazSearchTimer = setTimeout(runGazSearch, 75);
});
gazQuery.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    clearTimeout(gazSearchTimer);
    runGazSearch();
  }
});
$("gazClear").addEventListener("click", () => {
  gazQuery.value = "";
  renderGazHits([]);
});

$("gazBox").addEventListener("click", () => {
  const distance = camera.position.distanceTo(controls.target);
  const halfHeightKm = distance * Math.tan((camera.fov * Math.PI) / 360);
  const halfWidthKm = halfHeightKm * camera.aspect;
  const [centerLon, centerLat] = lonLatFromXZ(controls.target.x, controls.target.z);
  const box = {
    lon0: Math.max(BBOX.lon0, centerLon - halfWidthKm / KM_PER_DEG_LON),
    lon1: Math.min(BBOX.lon1, centerLon + halfWidthKm / KM_PER_DEG_LON),
    lat0: Math.max(BBOX.lat0, centerLat - halfHeightKm / KM_PER_DEG_LAT),
    lat1: Math.min(BBOX.lat1, centerLat + halfHeightKm / KM_PER_DEG_LAT),
  };
  renderGazHits(searchBox(gazIndex, box, {
    facet: gazState.facet,
    classes: gazState.classes,
    limit: 200,
  }), "box");
});

/* ---------------------------------------------------------- quick search */

const quickSearch = $("searchBox");
const quickResults = $("searchResults");
function renderQuickSearch() {
  quickResults.textContent = "";
  const query = quickSearch.value.trim();
  if (query.length < 2) return;
  for (const entry of searchName(gazIndex, query, { limit: 6 })) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-hit";
    const name = document.createElement("span");
    name.textContent = entry.name;
    const detail = document.createElement("small");
    detail.textContent = `${entry.fclass} · ${entry.lat.toFixed(4)}, ${entry.lon.toFixed(4)}`;
    button.append(name, detail);
    button.addEventListener("click", () => focusEntry(entry));
    quickResults.append(button);
  }
}
let quickTimer = 0;
quickSearch.addEventListener("input", () => {
  clearTimeout(quickTimer);
  quickTimer = setTimeout(renderQuickSearch, 70);
});
$("gazetteerSearch").addEventListener("submit", (event) => event.preventDefault());

/* --------------------------------------------------------------- dossier */

const dossier = $("detailBody");
function addDossierLine(label, value) {
  const p = document.createElement("p");
  const b = document.createElement("b");
  b.textContent = `${label}: `;
  const span = document.createElement("span");
  span.textContent = value;
  p.append(b, span);
  dossier.append(p);
}
function showDossier(entry) {
  dossier.textContent = "";
  if (!entry) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "Select a GNIS pin or click the ground for its sampled elevation and provenance.";
    dossier.append(hint);
    return;
  }
  const heading = document.createElement("h3");
  heading.textContent = entry.name;
  dossier.append(heading);
  addDossierLine("class", entry.fclass);
  addDossierLine("coordinates", `${entry.lat.toFixed(6)}, ${entry.lon.toFixed(6)} · EPSG:4326`);
  if (entry.fclass === "Geocache") {
    const md = entry.metadata ?? {};
    if (md.cacheCode) addDossierLine("GPX cache code", md.cacheCode);
    if (md.cacheType) addDossierLine("type", md.cacheType);
    if (md.difficulty != null || md.terrain != null) addDossierLine("D/T", `${md.difficulty ?? "—"}/${md.terrain ?? "—"}`);
    addDossierLine("source", `${md.sourceFile ?? "user GPX"} · imported ${md.importedOn ?? "this session"}`);
    addDossierLine("GNIS ID", "none — user-supplied waypoint");
  } else {
    addDossierLine("county", entry.county || "not stated");
    addDossierLine("GNIS FEATURE_ID", entry.gnis ?? "null / unverified");
    addDossierLine("tier", entry.verified ? "official USGS GNIS feature" : "community/context; ID not asserted");
    addDossierLine("feature type", `${entry.ftt} (ADL FTT)`);
    if (entry.note) addDossierLine("note", entry.note);
    if (entry.metadata?.source) addDossierLine("source", entry.metadata.source);
  }
  const elev = elevationAt(entry.lon, entry.lat);
  if (elev != null) addDossierLine("ground (3DEP estimate)", `${elev.toFixed(1)} m NAVD88 · bilinear sample grid`);
}
showDossier(null);

/* ------------------------------------------------------------ GPX import */

const gpxInput = $("gazGpxFile");
const gpxStatus = $("gazGpxStatus");
function setGpxStatus(message) {
  gpxStatus.textContent = message;
}
function clearPinGroup(group) {
  while (group.children.length) group.remove(group.children[group.children.length - 1]);
}
function clearImportedGeocaches() {
  clearPinGroup(cacheGroup);
  gazIndex.truncate(BASE_GAZETTEER_COUNT);
  gazState.classes = null;
  const removed = [...pinByIndex.keys()].filter((index) => index >= BASE_GAZETTEER_COUNT);
  for (const index of removed) pinByIndex.delete(index);
  setGpxStatus("no GPX loaded");
  refreshClassFilters();
  updateHud();
}
$("gazGpxClear").addEventListener("click", clearImportedGeocaches);
gpxInput.addEventListener("change", async () => {
  const file = gpxInput.files?.[0];
  if (!file) return;
  if (file.size > MAX_GPX_BYTES) {
    setGpxStatus(`file is ${file.size.toLocaleString()} bytes; maximum is ${MAX_GPX_BYTES.toLocaleString()}`);
    gpxInput.value = "";
    return;
  }
  try {
    const parsed = parseGeocacheGpx(await file.text());
    const inFrame = parsed.caches.filter((cache) => insideFrame(cache.lon, cache.lat));
    clearImportedGeocaches();
    const rows = geocachesToGazetteerRows(inFrame, { sourceFile: file.name });
    const added = gazIndex.addRows(rows);
    for (const entry of added) addPin(entry);
    const outside = parsed.caches.length - inFrame.length;
    setGpxStatus(`${inFrame.length} loaded · ${outside} outside frame · ${parsed.invalidCoordinates} invalid · ${parsed.duplicates} duplicate · local only`);
    refreshClassFilters();
    if (parsed.waypointCount > MAX_GPX_WAYPOINTS) {
      setGpxStatus(`waypoint limit exceeded (${parsed.waypointCount} > ${MAX_GPX_WAYPOINTS})`);
    }
  } catch (error) {
    setGpxStatus(`GPX import failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  gpxInput.value = "";
});

/* -------------------------------------------------------------- picking */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function intersect(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const objects = [terrainMesh, ...placeGroup.children, ...hydroGroup.children, ...cacheGroup.children];
  return raycaster.intersectObjects(objects, true)[0] ?? null;
}
function focusEntry(entry) {
  const [x, y, z] = project(entry.lon, entry.lat, pinTargetY(entry));
  controls.target.set(x, y, z);
  camera.position.set(x + 2.4, y + 3.4, z + 4.4);
  controls.update();
  showDossier(entry);
}
canvas.addEventListener("click", (event) => {
  const hit = intersect(event);
  if (!hit) return;
  let object = hit.object;
  while (object && !object.userData?.entry && object.parent) object = object.parent;
  if (object?.userData?.entry) {
    showDossier(object.userData.entry);
    focusEntry(object.userData.entry);
    return;
  }
  if (hit.object === terrainMesh) {
    const [lon, lat] = lonLatFromXZ(hit.point.x, hit.point.z);
    const elev = elevationAt(lon, lat);
    dossier.textContent = "";
    const heading = document.createElement("h3");
    heading.textContent = "Ground sample";
    dossier.append(heading);
    addDossierLine("coordinates", `${lat.toFixed(6)}, ${lon.toFixed(6)} · EPSG:4326`);
    addDossierLine("elevation", elev == null ? "outside DEM frame" : `${elev.toFixed(1)} m NAVD88 (interpolated)`);
    addDossierLine("grid", `${demInfo().nx}×${demInfo().ny} nodes; not a survey`);
  }
});
canvas.addEventListener("mousemove", (event) => {
  const hit = intersect(event);
  if (!hit || hit.object !== terrainMesh) return;
  const [lon, lat] = lonLatFromXZ(hit.point.x, hit.point.z);
  const elev = elevationAt(lon, lat);
  $("hudLonLat").textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  $("hudElev").textContent = elev == null ? "—" : `${elev.toFixed(1)} m · 3DEP estimate`;
});

/* --------------------------------------------------------------- HUD */

const fmtVector = (vector) => `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}`;
function updateHud() {
  $("hudCam").textContent = fmtVector(camera.position);
  $("hudTarget").textContent = fmtVector(controls.target);
  $("hudLayers").textContent = layerDefs.filter((layer) => layer.on).length.toString();
  $("hudObjects").textContent = gazetteer.entries.length.toLocaleString();
}
const dem = demInfo();
$("demNote").textContent = hasHighResolutionDem
  ? `USGS 3DEP local resample · ${dem.nx}×${dem.ny} · NAVD88 where reported`
  : `USGS 3DEP sample grid ${dem.nx}×${dem.ny} · ~1.7×2.2 km sample spacing · not a 1 m raster`;

let fpsFrames = 0;
let previousHudUpdate = previousFrame;
function animate(now) {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  fpsFrames += 1;
  if (now - previousHudUpdate > 500) {
    const fps = Math.round((fpsFrames * 1000) / (now - previousHudUpdate));
    $("hudFps").textContent = String(fps);
    fpsFrames = 0;
    previousHudUpdate = now;
    updateHud();
  }
}
requestAnimationFrame(animate);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
});

document.querySelectorAll("[data-min]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".pip");
    panel?.classList.toggle("min");
  });
});

// Let the shared layout be rearranged without adding a separate widget system.
for (const panel of document.querySelectorAll(".pip")) {
  const handle = panel.querySelector(".pip-head");
  if (!handle) continue;
  let drag = null;
  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    const rect = panel.getBoundingClientRect();
    drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", (event) => {
    if (!drag) return;
    panel.style.left = `${Math.max(4, Math.min(innerWidth - 72, drag.left + event.clientX - drag.x))}px`;
    panel.style.top = `${Math.max(4, Math.min(innerHeight - 48, drag.top + event.clientY - drag.y))}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  });
  const stopDrag = () => { drag = null; };
  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);
}

updateHud();
