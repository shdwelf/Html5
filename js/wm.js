/** SITE-K 4Dwm — Motif collapse / iconify so chrome does not eat the terrain. */

const STORE = "sitek-wm-v1";
const wins = new Map();

const $ = (id) => document.getElementById(id);

export function isPhone() {
  return matchMedia("(max-width: 980px)").matches;
}

function mode() {
  return document.body.dataset.mode || "grid";
}

function visibleEl(el) {
  if (!el) return false;
  if (el.closest(".ui-grid") && mode() !== "grid") return false;
  if (el.closest(".ui-ter") && mode() !== "terrarium") return false;
  if (el.classList.contains("ui-grid") && mode() !== "grid") return false;
  if (el.classList.contains("ui-ter") && mode() !== "terrarium") return false;
  if (el.closest(".ui-pack") && mode() === "keyspace") return false;
  return true;
}

function storeKey() {
  return `${STORE}-${isPhone() ? "m" : "d"}`;
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(storeKey()) || "{}");
  } catch {
    return {};
  }
}

function persist() {
  const o = {};
  for (const [id, w] of wins) o[id] = w.state;
  try {
    localStorage.setItem(storeKey(), JSON.stringify(o));
  } catch {
    /* quota / private */
  }
}

function ensureChrome(el, id, label) {
  el.classList.add("win");
  let title = el.querySelector(":scope > .title");
  if (!title) {
    title = document.createElement("div");
    title.className = "title";
    title.innerHTML = `<span class="win-name">${label}</span>`;
    el.prepend(title);
  }
  if (!title.querySelector(".win-name")) {
    const name = document.createElement("span");
    name.className = "win-name";
    while (title.firstChild) name.appendChild(title.firstChild);
    title.appendChild(name);
  }
  if (!title.querySelector(".win-btns")) {
    const btns = document.createElement("span");
    btns.className = "win-btns";
    btns.innerHTML =
      `<button type="button" class="win-btn" data-act="min" aria-label="Collapse">–</button>` +
      `<button type="button" class="win-btn" data-act="icon" aria-label="Iconify">▪</button>`;
    title.appendChild(btns);
  }
  if (!el.querySelector(":scope > .win-body")) {
    const body = document.createElement("div");
    body.className = "win-body";
    [...el.children].forEach((c) => {
      if (c !== title) body.appendChild(c);
    });
    el.appendChild(body);
  }

  title.addEventListener("dblclick", (e) => {
    if (e.target.closest(".win-btn")) return;
    toggleMin(id);
  });
  title.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (btn.dataset.act === "min") toggleMin(id);
    if (btn.dataset.act === "icon") iconify(id);
  });

  let sy = 0;
  title.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".win-btn")) return;
    sy = e.clientY;
  });
  title.addEventListener("pointerup", (e) => {
    if (!isPhone() || e.target.closest(".win-btn")) return;
    if (e.clientY - sy > 40) iconify(id);
  });
}

function setState(id, state) {
  const w = wins.get(id);
  if (!w) return;
  w.state = state;
  w.el.dataset.winState = state;
  w.el.classList.toggle("is-min", state === "min");
  w.el.classList.toggle("is-icon", state === "icon");
  w.el.classList.toggle("is-open", state === "open");
  sync();
  persist();
}

function anyOpen() {
  for (const w of wins.values()) {
    if (w.state === "open" && visibleEl(w.el) && w.el.dataset.winDesktop !== "pinned") return true;
    if (w.state === "open" && visibleEl(w.el) && isPhone()) return true;
  }
  return false;
}

function syncDeskFlag() {
  const phone = isPhone();
  const open = anyOpen();
  const tray = document.body.classList.contains("wm-tray-open");
  if (!phone) {
    document.body.dataset.wm = open ? "dock" : tray ? "tray" : "dock";
    return;
  }
  if (open) document.body.dataset.wm = "sheet";
  else if (tray) document.body.dataset.wm = "tray";
  else document.body.dataset.wm = "clear";
  const catcher = $("wmCatch");
  if (catcher) catcher.hidden = !open;
}

function syncTray() {
  const tray = $("wmTray");
  if (!tray) return;
  tray.innerHTML = "";
  for (const [id, w] of wins) {
    if (!visibleEl(w.el)) continue;
    if (w.el.dataset.winDesktop === "pinned" && !isPhone()) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.className = `wm-icon${w.state === "open" ? " on" : ""}${w.nudge ? " nudge" : ""}`;
    b.dataset.win = id;
    b.title = w.label;
    b.innerHTML = `<b>${w.short}</b><span>${w.label}</span>`;
    b.addEventListener("click", () => {
      if (w.state === "open") iconify(id);
      else open(id);
    });
    tray.appendChild(b);
  }
}

function sync() {
  syncTray();
  syncDeskFlag();
  const btn = $("btnWm");
  if (btn) btn.classList.toggle("hot", document.body.dataset.wm !== "clear" && isPhone());
}

export function open(id) {
  const w = wins.get(id);
  if (!w) return;
  if (isPhone()) {
    for (const [k, other] of wins) {
      if (k !== id && other.state === "open" && other.el.dataset.winDesktop !== "pinned") {
        setState(k, "icon");
      }
    }
  }
  setState(id, "open");
  w.el.querySelector(":scope > .win-body")?.scrollTo?.(0, 0);
}

export function iconify(id) {
  setState(id, "icon");
}

export function toggleMin(id) {
  const w = wins.get(id);
  if (!w) return;
  setState(id, w.state === "min" ? "open" : "min");
}

export function toggle(id) {
  const w = wins.get(id);
  if (!w) return;
  if (w.state === "open") iconify(id);
  else open(id);
}

export function clearView() {
  for (const [id, w] of wins) {
    if (w.el.dataset.winDesktop === "pinned" && !isPhone()) continue;
    setState(id, "icon");
  }
  document.body.classList.remove("wm-tray-open", "pads-open");
  syncDeskFlag();
}

export function toggleDesk() {
  if (isPhone()) {
    const front = [...wins.entries()].find(([, w]) => w.state === "open" && visibleEl(w.el));
    if (front) {
      iconify(front[0]);
      return;
    }
    document.body.classList.toggle("wm-tray-open");
    if (!document.body.classList.contains("wm-tray-open")) {
      document.body.classList.remove("pads-open");
    }
    syncDeskFlag();
    return;
  }
  const hidden = [...wins.values()].filter((w) => w.state === "icon" && visibleEl(w.el));
  if (hidden.length) {
    for (const w of hidden) setState(w.el.dataset.win, "open");
    return;
  }
  clearView();
}

export function nudge(id) {
  const w = wins.get(id);
  if (w) w.nudge = true;
  const icon = document.querySelector(`.wm-icon[data-win="${id}"]`);
  icon?.classList.add("nudge");
  setTimeout(() => {
    if (w) w.nudge = false;
    icon?.classList.remove("nudge");
    syncTray();
  }, 2600);
  if (isPhone()) document.body.classList.add("wm-tray-open");
  sync();
}

function bindPads() {
  $("btnPads")?.addEventListener("click", () => {
    document.body.classList.toggle("pads-open");
  });
  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("pads-open")) return;
    if (e.target.closest("#siteNav") || e.target.closest("#btnPads")) return;
    document.body.classList.remove("pads-open");
  });
}

function bindViewport() {
  const place = () => {
    const vv = window.visualViewport;
    const kb = vv ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
    document.documentElement.style.setProperty("--vv-bottom", `${kb}px`);
  };
  visualViewport?.addEventListener("resize", place);
  visualViewport?.addEventListener("scroll", place);
  addEventListener("resize", () => {
    sync();
  });
  place();
}

export function initWm() {
  document.querySelectorAll("[data-win]").forEach((el) => {
    const id = el.dataset.win;
    const label = el.dataset.winLabel || id.toUpperCase();
    const short = (el.dataset.winShort || label.slice(0, 3)).toUpperCase();
    const pinnedDesk = el.dataset.winDesktop === "pinned" && !isPhone();
    if (!pinnedDesk) ensureChrome(el, id, label);
    wins.set(id, { el, label, short, state: "open", nudge: false });
  });

  const saved = loadStore();
  const phone = isPhone();
  for (const [id, w] of wins) {
    if (w.el.dataset.winDesktop === "pinned" && !phone) {
      setState(id, "open");
      continue;
    }
    const next = saved[id] || (phone ? "icon" : "open");
    setState(id, next);
  }
  if (phone && !Object.keys(saved).length) {
    document.body.classList.remove("wm-tray-open");
  } else if (phone) {
    document.body.classList.toggle(
      "wm-tray-open",
      [...wins.values()].some((w) => w.state !== "icon")
    );
  }

  $("btnWm")?.addEventListener("click", toggleDesk);
  $("btnWmTop")?.addEventListener("click", toggleDesk);
  $("wmCatch")?.addEventListener("click", () => {
    for (const [id, w] of wins) {
      if (w.state === "open" && w.el.dataset.winDesktop !== "pinned") iconify(id);
    }
  });
  $("btnPauseTop")?.addEventListener("click", () => $("btnPause")?.click());
  addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      toggleDesk();
    }
  });
  bindPads();
  bindViewport();
  sync();

  const api = { open, iconify, toggle, toggleMin, toggleDesk, clearView, nudge, isPhone, sync };
  window.SITEK_WM = api;
  return api;
}
