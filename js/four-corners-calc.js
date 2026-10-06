/* four-corners-calc.html — the FOUR CORNERS calculator bench.
 *
 * This page draws nothing of its own. It runs four-corners-calc/core/*.c
 * transpiled by calc/tools/c2js.py into js/four-corners-core.js, blits the
 * core's 1-bit framebuffer to a canvas, and feeds it normalized key codes.
 * Every string in the side panel is read out of the port's own string pool
 * through fc_str_at(), so the panel cannot drift from what the calculator
 * prints.
 *
 * `make -C four-corners-calc test` proves this build and the gcc build agree.
 */
import * as CORE from "./four-corners-core.js";

const $ = (id) => document.getElementById(id);

/* DEV_* ids from calc/core/sitek.h */
const DEV_IDS = { ti83: 0, ti89: 2, ti92: 4 };

/* Used when devices.json cannot be fetched (opened from file://, or packed
   into a .xdc without it). Must stay in step with four-corners-calc/devices.json. */
const FALLBACK_DEVICES = [
  { id: "ti83", name: "TI-83 / TI-83+ / TI-84+", cpu: "z80", clock_mhz: 6, lcd: [96, 64], ext: "8xp", toolchain: "sdcc", ram_k: 32 },
  { id: "ti89", name: "TI-89 / TI-89 Titanium", cpu: "m68k", clock_mhz: 12, lcd: [160, 100], ext: "89z", toolchain: "tigcc", ram_k: 256 },
  { id: "ti92", name: "TI-92 / TI-92 Plus", cpu: "m68k", clock_mhz: 10, lcd: [240, 128], ext: "9xz", toolchain: "tigcc", ram_k: 128 },
];

const SCREENS = [
  { id: 0, label: "BOOT" },
  { id: 1, label: "MAP" },
  { id: 2, label: "SECTION" },
  { id: 3, label: "LAYERS" },
  { id: 4, label: "DOSSIER" },
  { id: 5, label: "DEVICE" },
];

const HINTS = {
  0: "any key starts · 1–5 jump straight to a screen",
  1: "◄ ► step visible features · ▲ ▼ zoom 1–8× · ENTER dossier · F1 section",
  2: "◄ ► step features · ▲ ▼ depth gain ×5–40 · F1 along-route ↔ W–E transect",
  3: "▲ ▼ move · ENTER toggle a layer · F1 all on / defaults",
  4: "◄ ► step features · ENTER back to the map",
  5: "1–5 jump to a screen · CLEAR exits",
};

const LCD_ON = [25, 23, 18];
const LCD_OFF = [179, 173, 147];

/* Scratch the core writes strings into — same contract as the C screens. */
const SBUF = new Uint8Array(160);

let devices = FALLBACK_DEVICES;
let dev = FALLBACK_DEVICES[0];
let ctx = null;
let img = null;
let paused = false;
let bootTimer = 0;

/* Read a string out of the port's pool by offset. */
function poolStr(off) {
  const n = CORE.fc_str_at(SBUF, 0, off);
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(SBUF[i]);
  return s.trim();
}

async function loadDevices() {
  try {
    const res = await fetch("./four-corners-calc/devices.json", { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.devices) && data.devices.length) devices = data.devices;
  } catch {
    /* file:// or packed without the JSON — keep the fallback */
  }
}

function buildDeviceButtons() {
  const host = $("devices");
  host.innerHTML = "";
  for (const d of devices) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = d.id.toUpperCase();
    b.title = `${d.name} — ${d.cpu} — ${d.lcd[0]}x${d.lcd[1]} — .${d.ext}`;
    b.classList.toggle("on", d.id === dev.id);
    b.addEventListener("click", () => selectDevice(d));
    host.appendChild(b);
  }
}

function buildScreenButtons() {
  const host = $("screens");
  host.innerHTML = "";
  for (const s of SCREENS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = s.label;
    b.addEventListener("click", () => {
      CORE.fcorner_set_screen(s.id);
      CORE.fcorner_render();
      paint();
      syncPanel();
    });
    host.appendChild(b);
  }
  syncPanel();
}

function syncScreenButtons() {
  const cur = CORE.fcorner_get_screen();
  $("screens").querySelectorAll("button").forEach((b, i) => {
    b.classList.toggle("on", SCREENS[i].id === cur);
  });
  $("hint").textContent = HINTS[cur] || HINTS[1];
}

const KEYPAD = [
  { label: "1", k: () => CORE.SKK_1 },
  { label: "2", k: () => CORE.SKK_2 },
  { label: "3", k: () => CORE.SKK_3 },
  { label: "4", k: () => CORE.SKK_4 },
  { label: "5", k: () => CORE.SKK_5 },
  { label: "◄", k: () => CORE.SKK_LEFT },
  { label: "▲", k: () => CORE.SKK_UP },
  { label: "▼", k: () => CORE.SKK_DOWN },
  { label: "►", k: () => CORE.SKK_RIGHT },
  { label: "F1", k: () => CORE.SKK_ACT },
  { label: "2ND", ghost: true },
  { label: "MODE", ghost: true },
  { label: "ENTER", k: () => CORE.SKK_ENTER, wide: true },
  { label: "CLEAR", k: () => CORE.SKK_EXIT },
];

function buildKeypad() {
  const host = $("keypad");
  host.innerHTML = "";
  for (const key of KEYPAD) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = key.label;
    if (key.wide) b.classList.add("wide");
    if (key.ghost) {
      b.classList.add("ghost");
      b.disabled = true;
      b.title = "not wired to anything — the port uses eight keys";
    } else {
      b.addEventListener("click", () => press(key.k()));
    }
    host.appendChild(b);
  }
}

function press(code) {
  CORE.fcorner_key(code);
  CORE.fcorner_render();
  paint();
  syncPanel();
}

function togglePause() {
  paused = !paused;
  $("btnPause").textContent = paused ? "Resume" : "Pause";
}

function selectDevice(d) {
  dev = d;
  const id = DEV_IDS[d.id] ?? 0;
  const [w, h] = d.lcd;
  const canvas = $("lcd");
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext("2d");
  img = ctx.createImageData(w, h);

  CORE.fcorner_init(id, w, h);
  CORE.fcorner_render();
  paint();

  $("brand").textContent = poolStr(CORE.fc_dev_label(id)) || d.id.toUpperCase();
  $("brandSub").textContent = `${w}×${h} · 1BPP · ${CORE.SK_FBB} B`;
  $("cmd").textContent = `make -C four-corners-calc ${d.id}   # ${d.toolchain}`;
  $("buildNote").textContent =
    d.toolchain === "tigcc"
      ? `Links a .${d.ext} AMS program with TIGCC/GCC4TI. Neither toolchain is installed in this repo's sandbox, so no .${d.ext} has ever been assembled here — the build target reports the missing compiler and stops rather than shipping a fake.`
      : `Assembles a .${d.ext} with sdcc plus ti83plus.inc from the TI-83+ SDK, then wraps it with tools/ti_pack.py. sdcc is not installed in this repo's sandbox, so no .${d.ext} has ever been assembled here.`;

  buildDeviceButtons();
  buildScreenButtons();
  buildLayerList();

  clearTimeout(bootTimer);
  bootTimer = setTimeout(() => {
    if (CORE.fcorner_get_screen() === 0) press(CORE.SKK_ENTER);
  }, 2400);
}

/* ---- side panel -------------------------------------------------------- */

const TIERS = ["official", "community", "context"];

/* Feature class as the port itself classifies it: the two surveyed state
   lines and the river are corridors; dossier sites and the gazetteer
   register are nodes, told apart by the register flag. */
function featClass(f) {
  if (CORE.fcorner_feat_class(f) === CORE.FC_CLS_COR) return "corridor";
  return CORE.fcorner_feat_reg(f) !== 0 ? "register" : "site";
}

function layerCount(i) {
  let n = 0;
  for (let f = 0; f < CORE.fcorner_feat_count(); f++) {
    if (CORE.fcorner_feat_layer(f) === i) n++;
  }
  return n;
}

function updateFacts() {
  const sel = CORE.fcorner_get_sel();
  const cls = featClass(sel);
  const elev = CORE.fcorner_feat_elev(sel);
  const depth = CORE.fcorner_feat_depth(sel);
  const lon = CORE.fc_lon_mdeg(CORE.fcorner_feat_qlon(sel)) / 1000;
  const lat = CORE.fc_lat_mdeg(CORE.fcorner_feat_qlat(sel)) / 1000;
  const kind =
    cls === "corridor" ? "polyline" : poolStr(CORE.fcorner_feat_kind(sel)).toLowerCase();

  const rows = [
    ["feature", poolStr(CORE.fcorner_feat_name(sel))],
    ["class", cls],
    ["kind", kind],
    ["layer", poolStr(CORE.fcorner_layer_name(CORE.fcorner_feat_layer(sel)))],
    ["evidence", TIERS[CORE.fcorner_feat_tier(sel)] ?? "?"],
    ["elevation", elev ? `${elev} m (${Math.round(elev * 3.28084)} ft)` : "—"],
    ["depth", depth ? `${depth} m (${Math.round(-depth * 3.28084)} ft)` : "—"],
    ["position", `${lon.toFixed(3)}, ${lat.toFixed(3)}`],
    ["zoom", `${1 << CORE.FC_ZOOM}×`],
    ["profile", `${CORE.fc_prof_km()} km · ${CORE.fc_prof_n()} samples`],
    ["visible", `${CORE.fcorner_visible()} / ${CORE.fcorner_feat_count()}`],
    ["framebuffer", `${CORE.SK_FBB} B (${CORE.SK_ROWB} B/row)`],
  ];

  const table = $("facts");
  table.innerHTML = "";
  for (const [k, v] of rows) {
    const tr = document.createElement("tr");
    const a = document.createElement("td");
    const b = document.createElement("td");
    a.textContent = k;
    b.textContent = v;
    tr.append(a, b);
    table.appendChild(tr);
  }
}

function buildLayerList() {
  const host = $("layers");
  host.innerHTML = "";
  for (let i = 0; i < CORE.FC_NLAYER; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.layer = String(i);
    b.title = poolStr(CORE.fcorner_layer_name(i));
    const box = document.createElement("span");
    box.className = "box";
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = poolStr(CORE.fcorner_layer_name(i));
    const ct = document.createElement("span");
    ct.className = "ct";
    ct.textContent = String(layerCount(i));
    b.append(box, nm, ct);
    b.addEventListener("click", () => {
      CORE.fcorner_set_laycur(i);
      CORE.fcorner_toggle_layer(i);
      CORE.fcorner_render();
      paint();
      syncPanel();
    });
    host.appendChild(b);
  }
  syncLayerList();
}

function syncLayerList() {
  const cur = CORE.FC_LAYCUR;
  $("layers").querySelectorAll("button").forEach((b, i) => {
    b.classList.toggle("on", CORE.fcorner_layer_on(i) !== 0);
    b.classList.toggle("cur", i === cur);
  });
  $("layerCount").textContent = `${CORE.fcorner_visible()} / ${CORE.fcorner_feat_count()}`;
}

let panelAt = 0;
function syncPanel(force) {
  const now = performance.now();
  if (!force && now - panelAt < 180) return;
  panelAt = now;
  syncScreenButtons();
  updateFacts();
  syncLayerList();
}

/* ---- blit -------------------------------------------------------------- */

function paint() {
  if (!ctx || !img) return;
  const w = CORE.SK_W;
  const h = CORE.SK_H;
  const rowb = CORE.SK_ROWB;
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const byte = CORE.SK_FB[y * rowb + (x >> 3)];
      const on = (byte >> (7 - (x & 7))) & 1;
      const o = (y * w + x) * 4;
      data[o] = on ? LCD_ON[0] : LCD_OFF[0];
      data[o + 1] = on ? LCD_ON[1] : LCD_OFF[1];
      data[o + 2] = on ? LCD_ON[2] : LCD_OFF[2];
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const cell = Math.max(2, Math.min(8, Math.floor(($(\"lcd\").clientWidth || w) / w)));
  document.querySelector(".grid-overlay").style.setProperty("--cell", cell + "px");
}

function savePng() {
  const scale = 4;
  const src = $("lcd");
  const out = document.createElement("canvas");
  out.width = src.width * scale;
  out.height = src.height * scale;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;
  octx.drawImage(src, 0, 0, out.width, out.height);
  const a = document.createElement("a");
  a.href = out.toDataURL("image/png");
  a.download = `fcorner-${dev.id}-${CORE.SK_W}x${CORE.SK_H}.png`;
  a.click();
}

function bindKeyboard() {
  const map = {
    ArrowLeft: () => CORE.SKK_LEFT,
    ArrowRight: () => CORE.SKK_RIGHT,
    ArrowUp: () => CORE.SKK_UP,
    ArrowDown: () => CORE.SKK_DOWN,
    Enter: () => CORE.SKK_ENTER,
    Escape: () => CORE.SKK_EXIT,
    Backspace: () => CORE.SKK_ACT,
    Delete: () => CORE.SKK_ACT,
    F1: () => CORE.SKK_ACT,
  };
  addEventListener("keydown", (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === " ") {
      e.preventDefault();
      togglePause();
      return;
    }
    if (e.key >= "1" && e.key <= "5") {
      press(CORE.SKK_1 + (Number(e.key) - 1));
      e.preventDefault();
      return;
    }
    const fn = map[e.key];
    if (fn) {
      press(fn());
      e.preventDefault();
    }
  });
}

let last = 0;
function loop(t) {
  if (!paused && t - last > 110) {
    last = t;
    CORE.fcorner_tick();
    CORE.fcorner_render();
    paint();
  }
  requestAnimationFrame(loop);
}

async function main() {
  await loadDevices();
  dev = devices.find((d) => d.id === "ti92") || devices[0];
  buildKeypad();
  selectDevice(dev);
  syncPanel(true);
  $("btnPng").addEventListener("click", savePng);
  $("btnPause").addEventListener("click", togglePause);
  bindKeyboard();
  requestAnimationFrame(loop);
}

main();
