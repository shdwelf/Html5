/** SITE-K HTML5 app shell — hash modes: #grid | #terrarium | #keyspace | #validator | #studio | #haiku | #cylinders */
import { initWm } from "./wm.js";

document.documentElement.dataset.shell = "1";

const $ = (id) => document.getElementById(id);

function currentMode() {
  const raw = (location.hash || "#grid").replace(/^#\/?/, "").split("?")[0];
  const normalized = raw === "artstudio" || raw === "art-studio" ? "studio" : raw;
  if (normalized === "terrarium" || normalized === "keyspace" || normalized === "validator" || normalized === "studio" || normalized === "haiku" || normalized === "cylinders" || normalized === "grid") return normalized;
  return "grid";
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    navigator.standalone === true
  );
}

function markDock(mode) {
  document.body.dataset.mode = mode;
  document.body.dataset.display = isStandalone() ? "standalone" : "browser";
  document.body.dataset.net = navigator.onLine ? "on" : "off";
  document.querySelectorAll(".app-dock a").forEach((a) => {
    a.classList.toggle("on", a.dataset.mode === mode);
    if (a.dataset.mode) a.setAttribute("href", `#${a.dataset.mode}`);
  });
  window.SITEK_WM?.sync?.();
  const net = $("netChip");
  if (net) net.hidden = navigator.onLine;
  const flag = $("displayFlag");
  if (flag) flag.textContent = isStandalone() ? "STANDALONE" : "BROWSER";
}

function bindInstall() {
  const chip = $("installChip");
  const tip = $("installTip");
  if (!chip) return;

  if (isStandalone()) {
    chip.hidden = true;
    return;
  }

  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    chip.hidden = false;
    chip.textContent = "INSTALL APP";
  });

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios) {
    chip.hidden = false;
    chip.textContent = "ADD TO HOME";
  }

  chip.addEventListener("click", async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      chip.hidden = true;
      return;
    }
    if (tip) {
      tip.hidden = false;
      tip.textContent = ios
        ? "Share → Add to Home Screen"
        : "Use the browser install / Add to Home Screen control";
      setTimeout(() => {
        tip.hidden = true;
      }, 4200);
    }
  });

  window.addEventListener("appinstalled", () => {
    chip.hidden = true;
    if (tip) tip.hidden = true;
  });
}

async function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    reg.update?.().catch(() => {});
  } catch {
    /* file:// or restricted host */
  }
}

let started = null;

async function start(mode) {
  markDock(mode);

  if (mode === "cylinders") {
    const frame = $("syncframe");
    if (frame && !frame.getAttribute("src")) frame.src = "./cylinder-sync.html";
    document.title = "Cylinder Sync · UCSB Library";
    return;
  }

  if (mode === "keyspace" || mode === "validator" || mode === "studio" || mode === "haiku") {
    const frame = $("keyframe");
    const view = mode === "studio"
      ? "./art-studio.html"
      : mode === "validator"
        ? "./validator.html"
        : mode === "haiku"
          ? "./haiku.html"
          : "./keyspace.html";
    if (frame && frame.getAttribute("src") !== view) frame.src = view;
    document.title = mode === "studio"
      ? "Ensō & Haiku Wallet Forging Engine · Art Studio"
      : mode === "validator"
        ? "BIP-39 Mnemonic Validator"
        : mode === "haiku"
          ? "BIP-39 Haiku Workbench"
          : "SITE-K · Keyspace";
    return;
  }

  if (started && started !== mode) {
    location.reload();
    return;
  }
  if (started === mode) return;

  if (mode === "terrarium") {
    const { startTerrarium } = await import("./terrarium.js");
    started = "terrarium";
    await startTerrarium();
    return;
  }

  const { startGrid } = await import("./jp-grid.js");
  started = "grid";
  await startGrid();
}

function bootHash() {
  if (!location.hash) {
    history.replaceState(null, "", `${location.pathname}${location.search}#grid`);
  }
}

async function boot() {
  bootHash();
  markDock(currentMode());
  initWm();
  bindInstall();
  addEventListener("online", () => markDock(currentMode()));
  addEventListener("offline", () => markDock(currentMode()));
  addEventListener("hashchange", () => {
    start(currentMode()).catch((err) => {
      console.error(err);
      const term = $("term");
      if (term) term.textContent = err.message || String(err);
    });
  });
  await registerSW();
  await start(currentMode());
}

boot().catch((err) => {
  console.error(err);
  const term = $("term");
  if (term) term.textContent = err.message || String(err);
});
