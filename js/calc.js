/* calc.html — the calculator bench.
 *
 * This page does not draw anything itself: it runs calc/core/*.c transpiled by
 * calc/tools/c2js.py into js/calc-core.js, blits the core's framebuffer, and
 * feeds it key codes. `make -C calc test` proves this build and the gcc build
 * agree for every device.
 */
import * as CORE from "./calc-core.js";

const $ = (id) => document.getElementById(id);

const DEV_IDS = { ti83: 0, ti85: 1, ti89: 2, ti90: 3, ti92: 4 };

const FALLBACK_DEVICES = [
  { id: "ti83", name: "TI-83 / TI-83+", cpu: "z80", lcd: [96, 64], ext: "8xp", toolchain: "sdcc", ram_k: 32 },
  { id: "ti85", name: "TI-85", cpu: "z80", lcd: [128, 64], ext: "85s", toolchain: "sdcc", ram_k: 32 },
  { id: "ti89", name: "TI-89", cpu: "m68k", lcd: [160, 100], ext: "89z", toolchain: "tigcc", ram_k: 256 },
  { id: "ti90", name: "TI-90", cpu: "z80", lcd: [96, 64], ext: "8xp", toolchain: "sdcc", ram_k: 32 },
  { id: "ti92", name: "TI-92", cpu: "m68k", lcd: [240, 128], ext: "9xz", toolchain: "tigcc", ram_k: 128 },
];

const SCREENS = [
  { id: 0, label: "BOOT" },
  { id: 1, label: "GRID" },
  { id: 2, label: "KEYS" },
  { id: 3, label: "TERR" },
  { id: 4, label: "DEVICE" },
];

const LCD_ON = [22, 36, 26];
const LCD_OFF = [169, 184, 153];

let devices = FALLBACK_DEVICES;
let dev = FALLBACK_DEVICES[0];
let ctx = null;
let img = null;
let paused = false;
let bootTimer = 0;

function ptrStr(arr) {
  if (!arr) return "";
  let s = "";
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 0) break;
    s += String.fromCharCode(arr[i]);
  }
  return s;
}

async function loadDevices() {
  try {
    const res = await fetch("./calc/devices.json", { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.devices) && data.devices.length) devices = data.devices;
  } catch {
    /* packed without the JSON, or opened from file:// — keep the fallback */
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
    b.classList.toggle("on", CORE.sitek_get_screen() === s.id);
    b.addEventListener("click", () => {
      CORE.sitek_set_screen(s.id);
      CORE.sitek_render();
      paint();
      syncScreenButtons();
    });
    host.appendChild(b);
  }
}

function syncScreenButtons() {
  const btns = $("screens").querySelectorAll("button");
  btns.forEach((b, i) => b.classList.toggle("on", SCREENS[i].id === CORE.sitek_get_screen()));
}

const KEYPAD = [
  { label: "2ND", k: null },
  { label: "MODE", k: null },
  { label: "DEL", k: () => CORE.SKK_ACT },
  { label: "CLEAR", k: () => CORE.SKK_EXIT },
  { label: "1", k: () => CORE.SKK_1 },
  { label: "2", k: () => CORE.SKK_2 },
  { label: "3", k: () => CORE.SKK_3 },
  { label: "4", k: () => CORE.SKK_4 },
  { label: "5", k: () => CORE.SKK_5 },
  { label: "◄", k: () => CORE.SKK_LEFT },
  { label: "▲", k: () => CORE.SKK_UP },
  { label: "►", k: () => CORE.SKK_RIGHT },
  { label: "▼", k: () => CORE.SKK_DOWN },
  { label: "ENTER", k: () => CORE.SKK_ENTER },
  { label: "SEED", k: () => CORE.SKK_ACT },
  { label: "⏸", action: togglePause },
];

function buildKeypad() {
  const host = $("keypad");
  host.innerHTML = "";
  for (const key of KEYPAD) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = key.label;
    b.addEventListener("click", () => {
      if (key.action) key.action();
      else if (key.k) press(key.k());
    });
    host.appendChild(b);
  }
}

function press(code) {
  CORE.sitek_key(code);
  CORE.sitek_render();
  paint();
  syncScreenButtons();
}

function togglePause() {
  paused = !paused;
  $("btnPause").textContent = paused ? "Resume" : "Pause";
}

function selectDevice(d) {
  dev = d;
  const id = DEV_IDS[d.id] ?? 0;
  const w = d.lcd[0];
  const h = d.lcd[1];
  const canvas = $("lcd");
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext("2d");
  img = ctx.createImageData(w, h);

  CORE.sitek_init(id, w, h);
  CORE.sitek_set_screen(0);
  CORE.sitek_render();
  paint();

  $("brand").textContent = ptrStr(CORE.dev_name(id)) || d.id.toUpperCase();
  $("brandSub").textContent = `${w}×${h} · 1BPP`;
  $("cmd").textContent = `make -C calc ${d.id}   # ${d.toolchain}`;
  $("buildNote").textContent =
    d.toolchain === "tigcc"
      ? "Produces a ." + d.ext + " AMS program with TIGCC/GCC4TI. No toolchain here? The container writer is the fallback: it needs an already-linked payload."
      : "Produces a ." + d.ext + " with sdcc plus " + (d.id === "ti85" ? "ti85.inc" : "ti83plus.inc") + " from the SDK.";

  buildDeviceButtons();
  buildScreenButtons();
  syncScreenButtons();
  updateFacts();

  // let the splash breathe, then drop into the grid like the real thing
  clearTimeout(bootTimer);
  bootTimer = setTimeout(() => {
    if (CORE.sitek_get_screen() === 0) press(CORE.SKK_ENTER);
  }, 2600);
}

function updateFacts() {
  const id = DEV_IDS[dev.id] ?? 0;
  const rows = [
    ["model", ptrStr(CORE.dev_name(id)) || dev.id.toUpperCase()],
    ["cpu", ptrStr(CORE.dev_cpu(id))],
    ["clock", dev.clock_mhz ? `${dev.clock_mhz} MHz` : "—"],
    ["lcd", `${dev.lcd[0]}×${dev.lcd[1]} · 1 bpp`],
    ["framebuffer", `${CORE.SK_FBB} B (${CORE.SK_ROWB} B/row)`],
    ["ram", `${CORE.dev_ram_k(id)} K`],
    ["file", `.${dev.ext}`],
    ["toolchain", dev.toolchain],
    ["words", `${CORE.ks_words()} · ${CORE.ks_ent_bits()} ent + ${CORE.ks_cs_bits()} cs bits`],
    ["ones", `${CORE.ks_ones()} / ${CORE.ks_ent_bits()}`],
    ["H8", (CORE.ks_h8() / 256).toFixed(2)],
    ["word 0 index", CORE.ks_word(0)],
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
  // pixel grid in device pixels
  const cell = Math.max(2, Math.min(8, Math.floor(($("lcd").clientWidth || w) / w)));
  document.querySelector(".grid-overlay").style.setProperty("--cell", cell + "px");
  updateFactsThrottled();
}

let factsAt = 0;
function updateFactsThrottled() {
  const now = performance.now();
  if (now - factsAt > 400) {
    factsAt = now;
    updateFacts();
  }
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
  a.download = `sitek-${dev.id}-${CORE.SK_W}x${CORE.SK_H}.png`;
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
  if (!paused && t - last > 90) {
    last = t;
    CORE.sitek_tick();
    CORE.sitek_render();
    paint();
  }
  requestAnimationFrame(loop);
}

async function main() {
  await loadDevices();
  dev = devices.find((d) => d.id === "ti83") || devices[0];
  buildKeypad();
  selectDevice(dev);
  $("btnPng").addEventListener("click", savePng);
  $("btnPause").addEventListener("click", togglePause);
  bindKeyboard();
  requestAnimationFrame(loop);
}

main();
