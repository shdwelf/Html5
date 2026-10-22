import {
  DATA_SOURCES,
  STORY_BEATS,
  STORY_TRACKS,
  VESSELS,
  VIEWER_VERSION,
  buildSceneManifest,
  buildVrml,
  buildXenaRecord,
  formatClock,
  projectOrthographic,
  sampleTrack,
  storyBeatAt,
  trackPosition,
} from "./core.js";

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));
const ui = {
  globe: byId("globeCanvas"),
  model: byId("modelCanvas"),
  globeStatus: byId("globeStatus"),
  appStatus: byId("appStatus"),
  progress: byId("progress"),
  progressValue: byId("progressValue"),
  beatMarkers: byId("beatMarkers"),
  beatKicker: byId("beatKicker"),
  beatTitle: byId("beatTitle"),
  beatRegion: byId("beatRegion"),
  beatSummary: byId("beatSummary"),
  beatShortLabel: byId("beatShortLabel"),
  selectedSubject: byId("selectedSubject"),
  clockReadout: byId("clockReadout"),
  clockScale: byId("clockScale"),
  vesselSelect: byId("vesselSelect"),
  modelCaption: byId("modelCaption"),
};

const state = {
  progress: 0,
  vesselId: "red-october",
  clockScale: "story",
  centerLat: 52,
  centerLon: -22,
  zoom: 1,
  xray: false,
  wireframe: false,
  labels: true,
  relief: false,
  world: null,
};

let renderQueued = false;
let dragStart = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function currentVessel() {
  return VESSELS.find((vessel) => vessel.id === state.vesselId) || VESSELS[0];
}

function canvasContext(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function screenPoint(lat, lon, centerLat, centerLon, cx, cy, radius) {
  const point = projectOrthographic(lat, lon, centerLat, centerLon);
  return point.visible ? { x: cx + point.x * radius, y: cy - point.y * radius, z: point.z } : null;
}

function traceProjectedLine(ctx, coordinates, projection, close = false) {
  if (!coordinates || coordinates.length < 2) return;
  ctx.beginPath();
  let drawing = false;
  let hasSegment = false;
  for (const coord of coordinates) {
    const point = projection(coord);
    if (!point) {
      drawing = false;
      continue;
    }
    if (!drawing) {
      ctx.moveTo(point.x, point.y);
      drawing = true;
    } else {
      ctx.lineTo(point.x, point.y);
      hasSegment = true;
    }
  }
  if (close && hasSegment) ctx.closePath();
  if (hasSegment) ctx.stroke();
}

function geoRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates || [];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flat();
  return [];
}

function drawGraticule(ctx, projection) {
  ctx.save();
  ctx.strokeStyle = "rgba(134, 191, 204, 0.18)";
  ctx.lineWidth = 0.7;
  for (let latitude = -75; latitude <= 75; latitude += 15) {
    const line = [];
    for (let longitude = -180; longitude <= 180; longitude += 4) line.push([longitude, latitude]);
    traceProjectedLine(ctx, line, ([lon, lat]) => projection(lat, lon));
  }
  for (let longitude = -180; longitude < 180; longitude += 20) {
    const line = [];
    for (let latitude = -90; latitude <= 90; latitude += 3) line.push([longitude, latitude]);
    traceProjectedLine(ctx, line, ([lon, lat]) => projection(lat, lon));
  }
  ctx.restore();
}

function drawCoastlines(ctx, projection) {
  if (!state.world || !Array.isArray(state.world.features)) return;
  ctx.save();
  ctx.strokeStyle = "rgba(148, 215, 197, 0.75)";
  ctx.lineWidth = 0.85;
  ctx.shadowColor = "rgba(76, 198, 163, 0.26)";
  ctx.shadowBlur = 4;
  for (const feature of state.world.features) {
    for (const ring of geoRings(feature.geometry)) {
      traceProjectedLine(ctx, ring, ([lon, lat]) => projection(lat, lon), true);
    }
  }
  ctx.restore();
}

function drawRoute(ctx, projection, color) {
  const track = STORY_TRACKS[state.vesselId];
  if (!track) return;
  const route = sampleTrack(track, state.progress, 16);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.setLineDash([5, 5]);
  ctx.shadowColor = color;
  ctx.shadowBlur = 9;
  traceProjectedLine(ctx, route.map((point) => [point.lon, point.lat]), ([lon, lat]) => projection(lat, lon));
  ctx.setLineDash([]);
  const first = screenPoint(track[0].lat, track[0].lon, state.centerLat, state.centerLon, projection.cx, projection.cy, projection.radius);
  if (first) {
    ctx.beginPath();
    ctx.fillStyle = "#e2f2f2";
    ctx.arc(first.x, first.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const position = trackPosition(track, state.progress);
  const active = screenPoint(position.lat, position.lon, state.centerLat, state.centerLon, projection.cx, projection.cy, projection.radius);
  if (active) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.lineWidth = 1;
    ctx.arc(active.x, active.y, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(active.x, active.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.arc(active.x, active.y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlobe() {
  if (!ui.globe) return;
  const { ctx, width, height } = canvasContext(ui.globe);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(20, Math.min(width * 0.43, height * 0.47) * state.zoom);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#040d15";
  ctx.fillRect(0, 0, width, height);

  const ocean = ctx.createRadialGradient(cx - radius * 0.38, cy - radius * 0.46, radius * 0.04, cx, cy, radius * 1.12);
  ocean.addColorStop(0, "#1c5368");
  ocean.addColorStop(0.48, "#0c3449");
  ocean.addColorStop(0.83, "#092436");
  ocean.addColorStop(1, "#04101b");
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = ocean;
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
  ctx.clip();
  const projection = (lat, lon) => screenPoint(lat, lon, state.centerLat, state.centerLon, cx, cy, radius);
  projection.cx = cx;
  projection.cy = cy;
  projection.radius = radius;
  drawGraticule(ctx, projection);
  drawCoastlines(ctx, projection);
  drawRoute(ctx, projection, currentVessel().color);
  const vignette = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius);
  vignette.addColorStop(0, "rgba(2,7,12,0)");
  vignette.addColorStop(1, "rgba(1,5,9,.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(138,207,204,.5)";
  ctx.lineWidth = 1.2;
  ctx.shadowColor = "rgba(88,203,181,.24)";
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(191,220,228,.44)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText(`ROTATION ${Math.round(state.centerLon)}° / ${Math.round(state.centerLat)}°`, 14, height - 15);
}

function drawModel() {
  if (!ui.model) return;
  const { ctx, width, height } = canvasContext(ui.model);
  const vessel = currentVessel();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#07131d";
  ctx.fillRect(0, 0, width, height);
  const left = width * 0.14;
  const length = width * 0.72;
  const right = left + length;
  const centerY = height * 0.59;
  const form = vessel.silhouette === "broad" ? 1 : vessel.silhouette === "slender" ? 0.62 : 0.78;
  const hullHeight = Math.min(height * 0.27, 54) * form;
  const bodyTop = centerY - hullHeight * 0.38;
  const bodyBottom = centerY + hullHeight * 0.42;
  const fill = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
  fill.addColorStop(0, state.xray ? "rgba(74,146,157,.38)" : "#397887");
  fill.addColorStop(0.5, state.xray ? "rgba(28,83,101,.36)" : "#1c5366");
  fill.addColorStop(1, state.xray ? "rgba(9,34,49,.26)" : "#0b2638");

  ctx.beginPath();
  ctx.moveTo(left, centerY);
  ctx.bezierCurveTo(left + length * 0.025, bodyTop, left + length * 0.16, bodyTop - hullHeight * 0.15, left + length * 0.39, bodyTop);
  ctx.lineTo(right - length * 0.08, bodyTop + hullHeight * 0.08);
  ctx.quadraticCurveTo(right - length * 0.015, centerY - hullHeight * 0.03, right, centerY);
  ctx.quadraticCurveTo(right - length * 0.02, centerY + hullHeight * 0.18, right - length * 0.10, bodyBottom);
  ctx.lineTo(left + length * 0.22, bodyBottom + hullHeight * 0.02);
  ctx.quadraticCurveTo(left + length * 0.03, centerY + hullHeight * 0.2, left, centerY);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = vessel.color;
  ctx.lineWidth = state.wireframe ? 1.35 : 1.8;
  ctx.shadowColor = vessel.color;
  ctx.shadowBlur = 9;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const sailX = left + length * 0.54;
  const sailWidth = vessel.silhouette === "broad" ? length * 0.105 : length * 0.075;
  const sailHeight = hullHeight * 0.76;
  ctx.beginPath();
  ctx.moveTo(sailX, bodyTop + 2);
  ctx.lineTo(sailX + sailWidth * 0.22, centerY - sailHeight);
  ctx.lineTo(sailX + sailWidth * 0.72, centerY - sailHeight);
  ctx.lineTo(sailX + sailWidth, bodyTop + 2);
  ctx.closePath();
  ctx.fillStyle = state.xray ? "rgba(255,192,110,.23)" : "#976d42";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,203,131,.84)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (state.xray) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(left + length * 0.49, centerY, length * 0.24, hullHeight * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,192,110,.10)";
    ctx.fill();
    ctx.setLineDash(state.wireframe ? [4, 4] : [2, 5]);
    ctx.strokeStyle = "rgba(255,192,110,.78)";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (state.wireframe) {
    ctx.save();
    ctx.strokeStyle = "rgba(182,231,226,.49)";
    ctx.lineWidth = 0.75;
    for (let i = 1; i <= 9; i += 1) {
      const x = left + (length * i) / 10;
      const widthAtX = hullHeight * (0.07 + 0.14 * Math.sin((i / 10) * Math.PI));
      ctx.beginPath();
      ctx.ellipse(x, centerY, Math.max(2, length * 0.014), widthAtX, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let offset = -2; offset <= 2; offset += 1) {
      ctx.beginPath();
      ctx.moveTo(left + length * 0.04, centerY + offset * hullHeight * 0.1);
      ctx.bezierCurveTo(left + length * 0.25, centerY + offset * hullHeight * 0.11, right - length * 0.15, centerY + offset * hullHeight * 0.11, right - length * 0.03, centerY + offset * hullHeight * 0.04);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (state.relief) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, height * 0.88);
    ctx.bezierCurveTo(width * 0.18, height * 0.8, width * 0.25, height * 0.95, width * 0.44, height * 0.89);
    ctx.bezierCurveTo(width * 0.65, height * 0.82, width * 0.79, height * 0.96, width, height * 0.84);
    ctx.strokeStyle = "rgba(121,185,255,.62)";
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(121,185,255,.07)";
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (state.labels) {
    ctx.fillStyle = "rgba(204,225,232,.76)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText("OUTER FORM · SCHEMATIC", 12, 18);
    if (state.xray) {
      ctx.fillStyle = "#ffd18f";
      ctx.fillText("GENERIC INNER VOLUME · NO ARRANGEMENT", 12, 33);
    }
    if (state.relief) {
      ctx.fillStyle = "#9dc9f1";
      ctx.fillText("SYNTHETIC PROFILE CURVE · NOT BATHYMETRY", 12, height - 10);
    }
  }
}

function renderScene() {
  renderQueued = false;
  drawGlobe();
  drawModel();
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderScene);
}

function renderStory() {
  const beat = storyBeatAt(state.progress);
  const index = STORY_BEATS.indexOf(beat);
  ui.beatKicker.textContent = `STORY STAGE ${String(index + 1).padStart(2, "0")} / ${String(STORY_BEATS.length).padStart(2, "0")}`;
  ui.beatTitle.textContent = beat.title;
  ui.beatRegion.textContent = beat.region;
  ui.beatSummary.textContent = beat.summary;
  ui.beatShortLabel.textContent = beat.title.toUpperCase();
  ui.progressValue.textContent = `${String(Math.round(state.progress * 100)).padStart(2, "0")}%`;
  for (const button of ui.beatMarkers.querySelectorAll("button")) {
    const isCurrent = button.dataset.beatId === beat.id;
    button.toggleAttribute("aria-current", isCurrent);
    if (isCurrent) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  renderClock();
}

function renderClock() {
  const value = formatClock(state.clockScale, new Date(), state.progress);
  ui.clockReadout.textContent = value;
}

function renderVessel() {
  const vessel = currentVessel();
  ui.selectedSubject.textContent = vessel.name;
  ui.modelCaption.textContent = vessel.sourceNote;
  ui.model.setAttribute("aria-label", `${vessel.name}: normalized schematic hull silhouette. ${vessel.sourceNote}`);
  queueRender();
}

function renderBeatButtons() {
  ui.beatMarkers.innerHTML = STORY_BEATS.map((beat, index) => (
    `<button class="beat-button" type="button" data-beat-id="${beat.id}" data-progress="${beat.at}" aria-current="${index === 0 ? "step" : "false"}">` +
    `<span class="num">STAGE ${String(index + 1).padStart(2, "0")}</span>${beat.title}</button>`
  )).join("");
  ui.beatMarkers.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-beat-id]");
    if (!button) return;
    state.progress = Number(button.dataset.progress);
    ui.progress.value = String(Math.round(state.progress * 1000));
    renderStory();
    queueRender();
  });
}

function renderSourceLinks() {
  const list = byId("sourceList");
  list.innerHTML = DATA_SOURCES.map((source) => {
    const url = escapeHtml(source.url);
    return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a><p>${escapeHtml(source.note)}</p></li>`;
  }).join("");
}

function downloadText(fileName, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function sha256(text) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto SHA-256 is unavailable in this host");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function reportStatus(message, isWarning = false) {
  ui.appStatus.textContent = message;
  ui.appStatus.style.color = isWarning ? "#ffcf69" : "#83a29f";
}

function currentModelText() {
  return buildVrml(state.vesselId, { wireframe: state.wireframe, xray: state.xray });
}

byId("progress").addEventListener("input", (event) => {
  state.progress = Number(event.target.value) / 1000;
  renderStory();
  queueRender();
});

ui.clockScale.addEventListener("change", (event) => {
  state.clockScale = event.target.value;
  renderClock();
});

ui.vesselSelect.addEventListener("change", (event) => {
  state.vesselId = event.target.value;
  renderVessel();
});

const toggleSpecs = [
  ["toggleXray", "xray"],
  ["toggleWire", "wireframe"],
  ["toggleLabels", "labels"],
  ["toggleRelief", "relief"],
];
for (const [buttonId, stateKey] of toggleSpecs) {
  byId(buttonId).addEventListener("click", (event) => {
    state[stateKey] = !state[stateKey];
    event.currentTarget.setAttribute("aria-pressed", String(state[stateKey]));
    queueRender();
  });
}

byId("exportVrml").addEventListener("click", () => {
  const vessel = currentVessel();
  const model = currentModelText();
  downloadText(`red-october-${vessel.id}-schematic.wrl`, model, "model/vrml;charset=utf-8");
  reportStatus("VRML 2.0 schematic exported. Geometry is normalized and not to scale.");
});

byId("exportXena").addEventListener("click", async () => {
  try {
    const vessel = currentVessel();
    const createdAt = new Date().toISOString();
    const model = currentModelText();
    const sceneSha256 = await sha256(model);
    const xena = buildXenaRecord({ vesselId: vessel.id, sceneText: model, createdAt });
    const record = buildSceneManifest({
      vesselId: vessel.id,
      progress: state.progress,
      toggles: state,
      createdAt,
      sceneSha256,
    });
    downloadText(`red-october-${vessel.id}-schematic.xena`, xena, "application/xml;charset=utf-8");
    downloadText(`red-october-${vessel.id}-schematic.xena.manifest.json`, `${JSON.stringify(record, null, 2)}\n`, "application/json;charset=utf-8");
    reportStatus(`Xena XML + SHA-256 sidecar exported. VRML SHA-256: ${sceneSha256}`);
  } catch (error) {
    reportStatus(error.message || String(error), true);
  }
});

byId("exportManifest").addEventListener("click", async () => {
  try {
    const model = currentModelText();
    const record = buildSceneManifest({
      vesselId: state.vesselId,
      progress: state.progress,
      toggles: state,
      createdAt: new Date().toISOString(),
      sceneSha256: await sha256(model),
    });
    downloadText(`red-october-${state.vesselId}-scene.json`, `${JSON.stringify(record, null, 2)}\n`, "application/json;charset=utf-8");
    reportStatus("Scene manifest exported with explicit non-track / schematic provenance.");
  } catch (error) {
    reportStatus(error.message || String(error), true);
  }
});

ui.globe.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  dragStart = { x: event.clientX, y: event.clientY, lon: state.centerLon, lat: state.centerLat };
  ui.globe.classList.add("dragging");
  ui.globe.setPointerCapture(event.pointerId);
});
ui.globe.addEventListener("pointermove", (event) => {
  if (!dragStart) return;
  const rect = ui.globe.getBoundingClientRect();
  const radius = Math.max(80, Math.min(rect.width, rect.height) * 0.43);
  state.centerLon = ((dragStart.lon - ((event.clientX - dragStart.x) / radius) * 58 + 540) % 360) - 180;
  state.centerLat = clamp(dragStart.lat + ((event.clientY - dragStart.y) / radius) * 58, -82, 82);
  queueRender();
});
function endDrag() {
  dragStart = null;
  ui.globe.classList.remove("dragging");
}
ui.globe.addEventListener("pointerup", endDrag);
ui.globe.addEventListener("pointercancel", endDrag);
ui.globe.addEventListener("lostpointercapture", endDrag);
ui.globe.addEventListener("wheel", (event) => {
  event.preventDefault();
  state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.001), 0.72, 1.85);
  queueRender();
}, { passive: false });

window.addEventListener("resize", queueRender);
if (typeof ResizeObserver === "function") {
  const resizeObserver = new ResizeObserver(queueRender);
  resizeObserver.observe(ui.globe);
  resizeObserver.observe(ui.model);
}

renderBeatButtons();
renderSourceLinks();
renderStory();
renderVessel();

fetch(new URL("./world-countries.geo.json", import.meta.url))
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((geojson) => {
    state.world = geojson;
    const count = Array.isArray(geojson.features) ? geojson.features.length : 0;
    ui.globeStatus.textContent = `${count.toLocaleString()} bundled country features · low-resolution coastlines only`;
    reportStatus(`Red October 4D Command Theater ${VIEWER_VERSION} ready · offline scene · no track data`);
    queueRender();
  })
  .catch(() => {
    ui.globeStatus.textContent = "Bundled coastline file unavailable; schematic globe grid remains active.";
    reportStatus("Offline globe started without coastlines. Rebuild the Webxdc bundle to restore the bundled basemap.", true);
    queueRender();
  });

setInterval(renderClock, 1000);
queueRender();
