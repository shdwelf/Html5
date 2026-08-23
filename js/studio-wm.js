// Lightweight 4Dwm for the Art Studio workspace.
// 4D here means position (x/y), depth (z), and interaction time (t):
// a visual window model, not a cryptographic primitive.
const STORAGE_KEY = "art-studio-wm-v1";
const $ = (id) => document.getElementById(id);

function isTouchLayout() {
  return innerWidth < 980 || matchMedia("(pointer: coarse)").matches;
}

function readLayout() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLayout(layout) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch { /* private mode */ }
}

function ensureTitlebar(win) {
  let title = win.querySelector(":scope > .wm4d-title");
  if (title) return title;
  title = document.createElement("div");
  title.className = "wm4d-title";
  title.innerHTML = `<span class="wm4d-grip" aria-hidden="true">⋮⋮</span><span class="wm4d-name"></span><span class="wm4d-coords">x00 y00 z00 t00</span><span class="wm4d-buttons"><button type="button" data-wm-action="min" aria-label="Minimize window">−</button><button type="button" data-wm-action="icon" aria-label="Hide window">□</button><button type="button" data-wm-action="close" aria-label="Close window">×</button></span>`;
  title.querySelector(".wm4d-name").textContent = win.dataset.wmLabel || win.dataset.wmWindow || "WINDOW";
  win.prepend(title);
  return title;
}

function initialPositions(workbench) {
  const width = Math.max(640, workbench.clientWidth || 1000);
  const source = 260;
  const inspector = 220;
  const gap = 15;
  return {
    source: { x: 0, y: 0, width: source },
    canvas: { x: source + gap, y: 0, width: Math.max(380, width - source - inspector - gap * 2) },
    inspector: { x: Math.max(source + gap, width - inspector), y: 0, width: inspector },
  };
}

function toNumber(value, fallback = 0) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

export function initStudioWm() {
  const workbench = document.querySelector(".workbench[data-wm-root]") || document.querySelector(".workbench");
  const bar = $("wm4dBar");
  const tray = $("wm4dTray");
  const toggle = $("wm4dToggle");
  const reset = $("wm4dReset");
  if (!workbench || !bar || !tray || !toggle || !reset) return null;

  const windows = [...workbench.querySelectorAll("[data-wm-window]")];
  if (!windows.length) return null;
  windows.forEach((win) => {
    win.classList.add("wm-window");
    ensureTitlebar(win);
  });

  let layout = readLayout();
  let floating = isTouchLayout() ? false : layout.mode !== "docked";
  let z = Math.max(3, ...windows.map((win) => toNumber(win.dataset.wmZ, 0)));
  let tick = 0;
  const defaults = initialPositions(workbench);
  const state = new Map();

  windows.forEach((win) => {
    const id = win.dataset.wmWindow;
    const saved = layout.windows?.[id] || {};
    state.set(id, {
      state: saved.state || "open",
      x: toNumber(saved.x, defaults[id]?.x || 0),
      y: toNumber(saved.y, defaults[id]?.y || 0),
      width: toNumber(saved.width, defaults[id]?.width || 240),
      z: toNumber(saved.z, ++z),
    });
  });

  function persist() {
    const windowsState = {};
    for (const win of windows) {
      const item = state.get(win.dataset.wmWindow);
      windowsState[win.dataset.wmWindow] = item;
    }
    writeLayout({ mode: floating ? "floating" : "docked", windows: windowsState });
  }

  function updateCoords(win) {
    const item = state.get(win.dataset.wmWindow);
    if (!item) return;
    const title = win.querySelector(":scope > .wm4d-title");
    if (!title) return;
    title.querySelector(".wm4d-coords").textContent = `x${String(Math.round(item.x / 8)).padStart(2, "0")} y${String(Math.round(item.y / 8)).padStart(2, "0")} z${String(item.z).padStart(2, "0")} t${String(tick % 100).padStart(2, "0")}`;
  }

  function applyWindow(win) {
    const id = win.dataset.wmWindow;
    const item = state.get(id);
    if (!item) return;
    win.dataset.wmZ = item.z;
    win.classList.toggle("wm-minimized", item.state === "minimized");
    win.classList.toggle("wm-iconified", item.state === "iconified" || item.state === "closed");
    win.classList.toggle("wm-closed", item.state === "closed");
    if (floating && !isTouchLayout()) {
      const availableWidth = Math.max(460, workbench.clientWidth || 1000);
      item.x = Math.max(0, Math.min(item.x, Math.max(0, availableWidth - 160)));
      item.y = Math.max(0, item.y);
      item.width = Math.max(220, Math.min(item.width, Math.max(220, availableWidth - item.x - 10)));
      win.style.left = `${Math.round(item.x)}px`;
      win.style.top = `${Math.round(item.y)}px`;
      win.style.width = `${Math.round(item.width)}px`;
      win.style.zIndex = String(item.z);
    } else {
      win.style.left = "";
      win.style.top = "";
      win.style.width = "";
      win.style.zIndex = "";
    }
    updateCoords(win);
  }

  function updateWorkbenchHeight() {
    if (!floating || isTouchLayout()) {
      workbench.style.minHeight = "";
      return;
    }
    const bottoms = windows.filter((win) => !win.classList.contains("wm-iconified")).map((win) => {
      const item = state.get(win.dataset.wmWindow);
      return item ? item.y + win.offsetHeight : 0;
    });
    workbench.style.minHeight = `${Math.max(690, ...bottoms, 690) + 22}px`;
  }

  function applyAll() {
    workbench.classList.toggle("wm-floating", floating && !isTouchLayout());
    workbench.classList.toggle("wm-docked", !floating || isTouchLayout());
    bar.classList.toggle("is-floating", floating && !isTouchLayout());
    bar.classList.toggle("is-touch", isTouchLayout());
    toggle.textContent = isTouchLayout() ? "STACKED ON TOUCH" : floating ? "DOCK WINDOWS" : "FLOAT WINDOWS";
    toggle.disabled = isTouchLayout();
    $("wm4dState").textContent = isTouchLayout() ? "TOUCH STACK" : floating ? "FLOATING" : "DOCKED";
    if (isTouchLayout()) for (const item of state.values()) item.state = "open";
    for (const win of windows) applyWindow(win);
    renderTray();
    updateWorkbenchHeight();
  }

  function bringToFront(win) {
    const item = state.get(win.dataset.wmWindow);
    if (!item) return;
    item.z = ++z;
    item.state = "open";
    tick = (tick + 1) % 100;
    applyWindow(win);
    renderTray();
    persist();
  }

  function restore(id) {
    const win = windows.find((candidate) => candidate.dataset.wmWindow === id);
    const item = state.get(id);
    if (!win || !item) return;
    item.state = "open";
    item.z = ++z;
    applyWindow(win);
    updateWorkbenchHeight();
    renderTray();
    persist();
  }

  function renderTray() {
    tray.replaceChildren();
    windows.forEach((win) => {
      const item = state.get(win.dataset.wmWindow);
      if (!item || (item.state === "open" && !win.classList.contains("wm-iconified"))) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wm4d-tray-item";
      button.innerHTML = `<b></b><span></span>`;
      button.querySelector("b").textContent = win.dataset.wmShort || win.dataset.wmLabel?.slice(0, 3) || "WIN";
      button.querySelector("span").textContent = win.dataset.wmLabel || "WINDOW";
      button.title = `Restore ${win.dataset.wmLabel || "window"}`;
      button.addEventListener("click", () => restore(win.dataset.wmWindow));
      tray.append(button);
    });
  }

  function setState(win, next) {
    const item = state.get(win.dataset.wmWindow);
    if (!item) return;
    item.state = next;
    applyWindow(win);
    renderTray();
    updateWorkbenchHeight();
    persist();
  }

  windows.forEach((win) => {
    const title = win.querySelector(":scope > .wm4d-title");
    title.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      if (!floating || isTouchLayout()) return;
      const item = state.get(win.dataset.wmWindow);
      const start = { x: event.clientX, y: event.clientY, left: item.x, top: item.y };
      bringToFront(win);
      title.setPointerCapture?.(event.pointerId);
      const move = (moveEvent) => {
        item.x = Math.max(0, Math.min(workbench.clientWidth - 80, start.left + moveEvent.clientX - start.x));
        item.y = Math.max(0, Math.min(Math.max(0, workbench.clientHeight - 80), start.top + moveEvent.clientY - start.y));
        tick = (tick + 1) % 100;
        applyWindow(win);
        updateWorkbenchHeight();
      };
      const up = () => { title.removeEventListener("pointermove", move); title.removeEventListener("pointerup", up); persist(); };
      title.addEventListener("pointermove", move);
      title.addEventListener("pointerup", up, { once: true });
      event.preventDefault();
    });
    title.addEventListener("click", (event) => {
      const action = event.target.closest("[data-wm-action]")?.dataset.wmAction;
      if (action === "min") setState(win, state.get(win.dataset.wmWindow).state === "minimized" ? "open" : "minimized");
      if (action === "icon") setState(win, "iconified");
      if (action === "close") setState(win, "closed");
      if (!action && floating && !isTouchLayout()) bringToFront(win);
    });
    win.addEventListener("pointerdown", (event) => {
      if (floating && !isTouchLayout() && !event.target.closest(".wm4d-title")) bringToFront(win);
    });
  });

  toggle.addEventListener("click", () => {
    if (isTouchLayout()) return;
    floating = !floating;
    if (floating) {
      const fallback = initialPositions(workbench);
      windows.forEach((win) => {
        const item = state.get(win.dataset.wmWindow);
        const base = fallback[win.dataset.wmWindow];
        if (!Number.isFinite(item.x)) item.x = base.x;
        if (!Number.isFinite(item.y)) item.y = base.y;
        if (!Number.isFinite(item.width)) item.width = base.width;
      });
    }
    applyAll(); persist();
  });
  reset.addEventListener("click", () => {
    const fallback = initialPositions(workbench);
    windows.forEach((win) => {
      const item = state.get(win.dataset.wmWindow);
      const base = fallback[win.dataset.wmWindow];
      Object.assign(item, { state: "open", x: base.x, y: base.y, width: base.width, z: ++z });
    });
    floating = isTouchLayout() ? false : true;
    applyAll(); persist();
  });

  addEventListener("resize", () => {
    if (isTouchLayout() && floating) floating = false;
    applyAll();
  });
  addEventListener("keydown", (event) => {
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target?.tagName)) return;
    if (event.key.toLowerCase() === "w") { if (!isTouchLayout()) { floating = !floating; applyAll(); persist(); } }
    if (event.key === "Escape") { windows.forEach((win) => { if (state.get(win.dataset.wmWindow).state === "open") setState(win, "iconified"); }); }
  });

  applyAll();
  return { reset: () => reset.click(), toggle: () => toggle.click(), restore };
}
