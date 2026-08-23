import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { resolveSite, CATALOG } from "./site-id.js";
import { loadWeather, ecosystemFromWx, STATIONS, wxHudMarkup } from "./wx-live.js";
import { renderTerraink, paintTerraink } from "./terraink.js";
import { demToVrml, downloadText } from "./vrml-export.js";

const SITE_ID = resolveSite();
const PACKS = {
  la: "./la-geo.js",
  stx: "./stx-geo.js",
  ww: "./ca-geo.js",
  dalton: "./ca-geo.js",
  iv: "./ca-geo.js",
};

const $ = (id) => document.getElementById(id);
const isCoarse = matchMedia("(pointer: coarse)").matches || innerWidth < 860;

let geo, dem, wx, eco;
let scene, camera, renderer, controls;
let terrain, glass, rainPts, snowPts, trees, stationGroup;
let wxUniforms;

function viewSize() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.floor(vv?.width ?? innerWidth)),
    h: Math.max(1, Math.floor(vv?.height ?? innerHeight)),
  };
}

function resize() {
  const { w, h } = viewSize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

const VERT = `
attribute vec3 color;
varying vec3 vColor;
varying vec3 vWorld;
varying float vElev;
void main() {
  vColor = color;
  vElev = position.y;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FRAG = `
uniform float uTime;
uniform float uWet;
uniform float uSnow;
uniform float uCloud;
varying vec3 vColor;
varying vec3 vWorld;
varying float vElev;
void main() {
  vec3 col = vColor;
  col = mix(col, vec3(0.12, 0.18, 0.16), uWet * 0.35);
  col = mix(col, vec3(0.86, 0.90, 0.92), step(vElev, 0.0) * 0.0);
  col = mix(col, vec3(0.88, 0.90, 0.93), uSnow * smoothstep(2.4, 5.5, vElev));
  float scan = 0.04 * sin(vWorld.z * 3.0 - uTime * 1.6);
  col += vec3(0.05, 0.12, 0.07) * scan;
  col *= 1.0 - uCloud * 0.18;
  gl_FragColor = vec4(col, 1.0);
}
`;

function makeTerrain() {
  const { nx, ny, elev } = dem;
  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  const idx = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const lon = geo.BBOX.minLon + (i / (nx - 1)) * (geo.BBOX.maxLon - geo.BBOX.minLon);
      const lat = geo.BBOX.maxLat - (j / (ny - 1)) * (geo.BBOX.maxLat - geo.BBOX.minLat);
      const [x, z] = geo.project(lon, lat);
      const k = j * nx + i;
      const e = elev[k];
      pos[k * 3] = x;
      pos[k * 3 + 1] = e * geo.WORLD.elevScale;
      pos[k * 3 + 2] = z;
      const rgb = geo.hypsometric(e);
      col[k * 3] = rgb[0];
      col[k * 3 + 1] = rgb[1];
      col[k * 3 + 2] = rgb[2];
    }
  }
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  wxUniforms = {
    uTime: { value: 0 },
    uWet: { value: eco.moisture },
    uSnow: { value: eco.snow ? 1 : 0 },
    uCloud: { value: eco.cloud },
  };
  terrain = new THREE.Mesh(
    g,
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: wxUniforms })
  );
  scene.add(terrain);
  scene.add(
    new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ color: 0x1c4a28, wireframe: true, transparent: true, opacity: 0.08 })
    )
  );

  const outline = geo.drapeLine(dem, geo.LA_OUTLINE);
  const ol = new THREE.BufferGeometry();
  ol.setAttribute("position", new THREE.Float32BufferAttribute(outline, 3));
  scene.add(new THREE.Line(ol, new THREE.LineBasicMaterial({ color: 0xc45a18 })));

  const ctr = geo.buildContours(dem, geo.CONTOUR_LEVELS);
  ctr.forEach((c) => {
    if (!c.segs.length) return;
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(c.segs, 3));
    scene.add(
      new THREE.LineSegments(
        cg,
        new THREE.LineBasicMaterial({ color: c.level < 0 ? 0x1a4a58 : 0x2a4a28, transparent: true, opacity: 0.35 })
      )
    );
  });
}

function makeGlass() {
  const w = geo.WORLD.w + 3;
  const d = geo.WORLD.d + 3;
  const h = Math.max(8, geo.WORLD.w * 0.18);
  glass = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshPhongMaterial({
      color: 0x7cff6b,
      transparent: true,
      opacity: 0.07,
      shininess: 90,
      side: THREE.DoubleSide,
    })
  );
  glass.position.y = h * 0.38;
  scene.add(glass);
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    new THREE.LineBasicMaterial({ color: 0x7cff6b, transparent: true, opacity: 0.55 })
  );
  edge.position.copy(glass.position);
  scene.add(edge);
}

function makeWeather() {
  const n = isCoarse ? 400 : 1200;
  const rain = new Float32Array(n * 3);
  const snow = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    rain[i * 3] = (Math.random() - 0.5) * geo.WORLD.w;
    rain[i * 3 + 1] = Math.random() * 8 + 1;
    rain[i * 3 + 2] = (Math.random() - 0.5) * geo.WORLD.d;
    snow[i * 3] = (Math.random() - 0.5) * geo.WORLD.w;
    snow[i * 3 + 1] = Math.random() * 8 + 1;
    snow[i * 3 + 2] = (Math.random() - 0.5) * geo.WORLD.d;
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.BufferAttribute(rain, 3));
  rainPts = new THREE.Points(
    rg,
    new THREE.PointsMaterial({ color: 0x8ecfff, size: 0.045, transparent: true, opacity: 0.7 })
  );
  rainPts.visible = eco.rain;
  scene.add(rainPts);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(snow, 3));
  snowPts = new THREE.Points(
    sg,
    new THREE.PointsMaterial({ color: 0xe8f1ff, size: 0.07, transparent: true, opacity: 0.85 })
  );
  snowPts.visible = eco.snow;
  scene.add(snowPts);
}

function makeEcosystem() {
  trees = new THREE.Group();
  const n = isCoarse ? 40 : 90;
  const leaf = eco.leaf;
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    const v = Math.random();
    const lon = geo.BBOX.minLon + u * (geo.BBOX.maxLon - geo.BBOX.minLon);
    const lat = geo.BBOX.minLat + v * (geo.BBOX.maxLat - geo.BBOX.minLat);
    const e = geo.sampleDem(dem, lon, lat);
    if (e < 1) continue;
    const [x, z] = geo.project(lon, lat);
    const y = e * geo.WORLD.elevScale;
    const h = 0.18 + eco.moisture * 0.35 + Math.random() * 0.25;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.03, h * 0.45, 5),
      new THREE.MeshBasicMaterial({ color: 0x3a2818 })
    );
    trunk.position.set(x, y + h * 0.22, z);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.09 + eco.moisture * 0.06, h, 6),
      new THREE.MeshBasicMaterial({ color: leaf, transparent: true, opacity: 0.85 })
    );
    crown.position.set(x, y + h * 0.7, z);
    crown.userData.phase = Math.random() * 6;
    trees.add(trunk, crown);
  }
  scene.add(trees);

  stationGroup = new THREE.Group();
  const st = STATIONS[SITE_ID];
  const [sx, sz] = geo.project(st.lon, st.lat);
  const sy = geo.sampleDem(dem, st.lon, st.lat) * geo.WORLD.elevScale;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8),
    new THREE.MeshBasicMaterial({ color: 0xffb020 })
  );
  pole.position.set(sx, sy + 0.55, sz);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.16, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xe8f1ff })
  );
  box.position.set(sx, sy + 1.05, sz);
  const vane = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.18, 6),
    new THREE.MeshBasicMaterial({ color: 0xff5d6c })
  );
  vane.rotation.z = Math.PI / 2;
  vane.position.set(sx + 0.14, sy + 1.15, sz);
  vane.userData.vane = true;
  stationGroup.add(pole, box, vane);
  scene.add(stationGroup);
}

function stepWeather(dt) {
  const wind = (eco.wind || 4) * 0.004;
  const dir = ((eco.windDir || 0) * Math.PI) / 180;
  const dx = Math.sin(dir) * wind;
  const dz = Math.cos(dir) * wind;
  if (rainPts && rainPts.visible) {
    const a = rainPts.geometry.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) {
      a[i] += dx * 8;
      a[i + 1] -= 0.22 + wind * 4;
      a[i + 2] += dz * 8;
      if (a[i + 1] < 0) {
        a[i] = (Math.random() - 0.5) * geo.WORLD.w;
        a[i + 1] = 7 + Math.random() * 3;
        a[i + 2] = (Math.random() - 0.5) * geo.WORLD.d;
      }
    }
    rainPts.geometry.attributes.position.needsUpdate = true;
  }
  if (snowPts && snowPts.visible) {
    const a = snowPts.geometry.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) {
      a[i] += dx * 3 + Math.sin(i + performance.now() * 0.001) * 0.01;
      a[i + 1] -= 0.04;
      a[i + 2] += dz * 3;
      if (a[i + 1] < 0) a[i + 1] = 8;
    }
    snowPts.geometry.attributes.position.needsUpdate = true;
  }
  if (trees) {
    trees.children.forEach((c) => {
      if (c.geometry?.type === "ConeGeometry") {
        c.rotation.z = Math.sin(performance.now() * 0.002 + c.userData.phase) * wind * 8;
      }
    });
  }
  if (wxUniforms) wxUniforms.uTime.value += dt;
}

function paintWxHud() {
  const el = $("wxHud");
  if (!el || !wx) return;
  el.innerHTML = wxHudMarkup(wx);
}

async function drawLineart() {
  const cv = $("lineart");
  if (!cv) return;
  const art = await paintTerraink(cv, dem, geo.BBOX, {
    outline: geo.LA_OUTLINE,
    wx,
    levels: 18,
    hachureEvery: isCoarse ? 4 : 2,
  });
  $("lineNote").textContent = `TERRAINK HD  ${art.lo.toFixed(0)}–${art.hi.toFixed(0)} m  ${art.levels} contours`;
  state.lastSvg = art.svg;
}

const state = { lastSvg: "" };

function exportVrml() {
  const wrl = demToVrml(dem, geo.WORLD, wx, geo.SITE.title);
  downloadText(`${geo.SITE.id}-terrarium.wrl`, wrl, "model/vrml");
}

function exportSvg() {
  if (!state.lastSvg) return;
  downloadText(`${geo.SITE.id}-terraink.svg`, state.lastSvg, "image/svg+xml");
}

function initThree() {
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isCoarse, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isCoarse ? 1.25 : 1.75));
  renderer.setClearColor(eco.sky, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(eco.sky, eco.fog ? 0.045 : 0.016);
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.set(8, 14, 18);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 1.2, 0);
  controls.minDistance = 4;
  controls.maxDistance = 60;
  scene.add(new THREE.AmbientLight(0x6a8a70, 0.55));
  const sun = new THREE.DirectionalLight(0xffe6b0, 1.1);
  sun.position.set(12, 22, 8);
  scene.add(sun);
  makeTerrain();
  makeGlass();
  makeWeather();
  makeEcosystem();
  resize();
  addEventListener("resize", resize);
}

function tick() {
  controls.update();
  stepWeather(0.016);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function bind() {
  $("btnVrml").onclick = exportVrml;
  $("btnSvg").onclick = exportSvg;
  $("btnWx").onclick = async () => {
    $("wxHud").querySelector(".title i").textContent = "refresh…";
    wx = await loadWeather(SITE_ID);
    eco = ecosystemFromWx(wx);
    paintWxHud();
    if (rainPts) rainPts.visible = eco.rain;
    if (snowPts) snowPts.visible = eco.snow;
    if (wxUniforms) {
      wxUniforms.uWet.value = eco.moisture;
      wxUniforms.uSnow.value = eco.snow ? 1 : 0;
      wxUniforms.uCloud.value = eco.cloud;
    }
  };
  const nav = $("siteNav");
  if (nav) {
    nav.innerHTML = CATALOG.map((c) => {
      const q = c.id === "stx" ? "" : "?site=" + c.id;
      return `<a class="${c.id === SITE_ID ? "on" : ""}" href="./index.html${q}#terrarium">${c.label}</a>`;
    }).join("");
  }
}

async function main() {
  const pack = PACKS[SITE_ID] || PACKS.stx;
  geo = await import(pack);
  document.title = "TERRARIUM · " + geo.SITE.title;
  $("headTitle").textContent = "TERRARIUM · " + geo.SITE.code;
  $("headSub").textContent = "NOAA/NWS + WU PWS + Terraink HD · VRML 2.0";
  dem = geo.buildDem(isCoarse ? 120 : 180, isCoarse ? 80 : 120);
  wx = await loadWeather(SITE_ID);
  eco = ecosystemFromWx(wx);
  bind();
  paintWxHud();
  initThree();
  drawLineart();
  requestAnimationFrame(tick);
}

export { main as startTerrarium };

if (document.documentElement.dataset.shell !== "1") {
  main().catch((err) => {
    console.error(err);
    const el = $("wxHud");
    if (el) el.innerHTML = `<div class="body">${err.message}</div>`;
  });
}
