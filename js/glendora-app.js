/**
 * GLENDORA HIGH · page controller.
 *
 * One model, four views: the VRML campus (parsed back out of the .wrl text),
 * the three.js arena shooter, the export desk, and the survey data behind it.
 */

import { buildModel } from "./ghs-model.js";
import { campusToVrml } from "./ghs-vrml.js";
import { parseVrml, flattenVrml } from "./wrl-parse.js";
import { startVrmlViewer } from "./ghs-viewer-three.js";
import { startShooter } from "./ghs-shooter-three.js";
import { buildDoomMap } from "./ghs-doom.js";
import { buildDukeBundle } from "./ghs-build.js";
import { buildWolfLevel, wolfLevelSource } from "./ghs-wolf.js";
import { buildXdcBundle } from "./ghs-xdc.js";

const $ = (id) => document.getElementById(id);

const model = buildModel({ boxes: false, simplify: 0.6 });
const wrl = campusToVrml(model, { grid: 18 });

function download(name, data, type = "application/octet-stream") {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`);

/* ------------------------------------------------------------------ *
 * tabs
 * ------------------------------------------------------------------ */

const tabs = [...document.querySelectorAll(".ghs-tab")];
const panels = [...document.querySelectorAll(".ghs-panel")];
let viewer = null;
let shooter = null;

async function show(name) {
  for (const t of tabs) t.classList.toggle("on", t.dataset.tab === name);
  for (const p of panels) p.hidden = p.dataset.panel !== name;
  document.body.dataset.tab = name;
  if (name === "campus" && !viewer) {
    viewer = startVrmlViewer({ host: $("vrmlStage"), wrlText: wrl });
    $("vrmlStats").textContent = `${viewer.stats.meshes} meshes · ${viewer.stats.shapes} shapes · ${viewer.stats.triangles} triangles · ${viewer.stats.defs} DEFs`;
  }
  if (name === "arena" && !shooter) {
    const host = $("arenaStage");
    shooter = startShooter({ host, model, waves: 6, quota: 24, seed: 20260910 });
  }
}

for (const t of tabs) {
  t.addEventListener("click", () => show(t.dataset.tab));
}

/* ------------------------------------------------------------------ *
 * VRML source
 * ------------------------------------------------------------------ */

$("wrlHead").textContent = `glendora.wrl · ${kb(new TextEncoder().encode(wrl).length)} · drag to orbit, wheel to zoom`;
$("wrlSrc").textContent = wrl.split("\n").slice(0, 140).join("\n") + "\n… (download the full file below)";
$("btnWrlTop").addEventListener("click", () => download("glendora.wrl", wrl, "model/vrml"));
$("btnWrlCopy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(wrl);
    $("btnWrlCopy").textContent = "COPIED";
    setTimeout(() => ($("btnWrlCopy").textContent = "COPY"), 1600);
  } catch {
    $("btnWrlCopy").textContent = "BLOCKED";
  }
});

/* ------------------------------------------------------------------ *
 * exports
 * ------------------------------------------------------------------ */

function exportRow(id, title, note, run) {
  const btn = $(id);
  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.textContent = "BUILDING…";
    // let the button repaint before the heavy build
    setTimeout(() => {
      try {
        const out = run();
        const bytes = typeof out.data === "string" ? new TextEncoder().encode(out.data).length : out.data.length;
        download(out.name, out.data, out.type);
        note.textContent = `${out.name} · ${kb(bytes)} · ready`;
      } catch (err) {
        note.textContent = `failed: ${err.message}`;
        console.error(err);
      }
      btn.disabled = false;
      btn.textContent = "BUILD";
    }, 30);
  });
}

exportRow("btnWrl", "VRML", $("noteWrl"), () => ({ name: "glendora.wrl", data: wrl, type: "model/vrml" }));

const doomModel = buildModel({ boxes: true, simplify: 1.2, trees: 0 });

exportRow("btnWad", "DOOM WAD", $("noteWad"), () => {
  const { lumps } = buildDoomMap(doomModel, { mapName: "E1M1", walkable: 5 });
  return { name: "glendora.wad", data: lumps };
});

exportRow("btnGrp", "DUKE3D GRP", $("noteGrp"), () => {
  const bundle = buildDukeBundle(model, { walkable: 5 });
  return { name: "GHSCHOOL.GRP", data: bundle.grp };
});

exportRow("btnMap", "BUILD MAP", $("noteMap"), () => {
  const bundle = buildDukeBundle(model, { walkable: 5 });
  const map = bundle.files.find((f) => f.name === "E1L1.MAP");
  return { name: "E1L1.MAP", data: map.data };
});

exportRow("btnWolf", "WOLF3D JS", $("noteWolf"), () => {
  const level = buildWolfLevel(model, { size: 64 });
  return { name: "glendora-wolf3d.js", data: wolfLevelSource(level, model), type: "text/javascript" };
});

exportRow("btnXdc", "WEBXDC", $("noteXdc"), () => {
  const { xdc } = buildXdcBundle(model, wrl);
  return { name: "glendora.xdc", data: xdc, type: "application/zip" };
});

/* ------------------------------------------------------------------ *
 * survey table
 * ------------------------------------------------------------------ */

const parsed = flattenVrml(parseVrml(wrl)).stats;
const rows = [
  ["Campus", `${(model.bounds.maxX - model.bounds.minX).toFixed(1)} m × ${(model.bounds.maxY - model.bounds.minY).toFixed(1)} m · ${(model.stats.campusAreaM2 / 10000).toFixed(2)} ha`],
  ["Buildings", `${model.buildings.length} footprints · ${(model.stats.buildingFootprintM2 / 1000).toFixed(1)} thousand m²`],
  ["Open areas", `${model.areas.length} (fields, courts, track, parking)`],
  ["Circulation", `${model.roads.length} roads and paths`],
  ["Trees", `${model.trees.length} placed off buildings and pavement`],
  ["Elevation", `${model.stats.zMin.toFixed(1)}–${model.stats.zMax.toFixed(1)} m MSL (OSM ele tags, IDW surface)`],
  ["VRML round trip", `${parsed.shapes} shapes parsed back · ${parsed.triangles} triangles · ${parsed.defs} DEFs · ${kb(new TextEncoder().encode(wrl).length)}`],
  ["Address", model.site.address],
  ["Source", `OpenStreetMap way ${model.site.osmWay} · © OpenStreetMap contributors (ODbL)`],
];
$("facts").innerHTML = rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");

$("ghsBuildings").innerHTML = model.buildings
  .slice()
  .sort((a, b) => b.h - a.h)
  .map((b) => `<li><b>${b.name || b.id}</b><i>${b.kind}</i><span>${b.h.toFixed(1)} m</span></li>`)
  .join("");

show("campus");
