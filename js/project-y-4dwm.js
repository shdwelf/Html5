/** Project Y 4Dwm — loads a floating PIP (personnel record) for each badge card.
 *
 *  The archive opened one shared <dialog>; the 4Dwm gives every card its own
 *  window: title-bar drag, collapse, iconify to the desk tray, close, focus
 *  raises. PIP RESULTS loads one pip per visible card (capped), TILE arranges
 *  them, CLEAR dismisses them.
 *
 *  initPipWm({
 *    layer, desk, tray, status, // DOM elements (desk/tray/status optional)
 *    findRecord(id),            // -> record | undefined
 *    titleFor(r),               // -> title-bar string
 *    chipFor(r),                // -> { top, sub } tray chip labels
 *    detailHtml(r),             // -> body HTML for the record
 *    bindBody(root, r),         // wire images + buttons inside a pip body
 *    isPhone(),                 // small-screen behavior (optional)
 *    announce(msg),             // status line / console fallback (optional)
 *  })
 */

/** Pure placement helpers (unit-tested without a DOM). */
export function cascadePosition(index, vw, vh) {
  const step = index % 8;
  return {
    left: Math.max(16, Math.min(Math.round((vw - 380) / 2) + step * 26, vw - 220)),
    top: Math.max(16, Math.min(120 + step * 22, vh - 120)),
  };
}

export function tilePositions(count, vw, vh, { margin = 12, topInset = 24, bottomInset = 66 } = {}) {
  if (count < 1) return [];
  const cols = Math.max(1, Math.floor(vw / 380));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cw = vw / cols;
  const ch = Math.max(140, (vh - topInset - bottomInset) / rows);
  return Array.from({ length: count }, (_, i) => ({
    left: Math.round((i % cols) * cw + margin),
    top: Math.round(Math.min(topInset + Math.floor(i / cols) * ch + margin, vh - bottomInset - 40)),
  }));
}

export function initPipWm(cfg) {
  const pips = new Map(); // record id -> { id, r, el, state: 'open'|'min'|'icon' }
  let zTop = 0;
  let cascade = 0;
  let focused = null;
  let allIcon = false;

  const isPhone =
    cfg.isPhone || (() => typeof matchMedia === "function" && matchMedia("(max-width: 900px)").matches);

  const iconified = () => [...pips.values()].filter((w) => w.state === "icon");

  function announce(msg) {
    if (cfg.status) {
      cfg.status.textContent = msg;
    } else cfg.announce?.(msg);
  }

  function raise(w) {
    zTop += 1;
    w.el.style.zIndex = String(zTop);
    focused = w;
    for (const o of pips.values()) o.el.classList.toggle("focus", o === w);
    syncTray();
  }

  function setState(w, st) {
    w.state = st;
    w.el.classList.toggle("is-min", st === "min");
    w.el.classList.toggle("is-icon", st === "icon");
    if (st === "open") raise(w);
    syncDesk();
    syncTray();
  }

  function syncTray() {
    if (!cfg.tray) return;
    cfg.tray.innerHTML = "";
    for (const w of pips.values()) {
      if (w.state !== "icon") continue;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "wm4d-chip";
      const labels = cfg.chipFor?.(w.r) || { top: w.r.surname || w.r.name, sub: w.r.badge || "PIP" };
      chip.innerHTML = `<b>${labels.top}</b><span>${labels.sub}</span>`;
      chip.title = `Restore ${w.r.name}`;
      chip.addEventListener("click", () => {
        if (isPhone()) iconifyOthers(w.id);
        setState(w, "open");
      });
      cfg.tray.appendChild(chip);
    }
  }

  function syncDesk() {
    if (!cfg.desk) return;
    cfg.desk.hidden = pips.size === 0;
  }

  function iconifyOthers(keepId) {
    for (const w of pips.values()) {
      if (w.id !== keepId && w.state === "open") setState(w, "icon");
    }
  }

  function placeCascade(w) {
    if (isPhone()) return; // the stylesheet lays out the sheet
    const { left, top } = cascadePosition(cascade++, innerWidth, innerHeight);
    w.el.style.left = `${left}px`;
    w.el.style.top = `${top}px`;
  }

  function bindDrag(w) {
    const title = w.el.querySelector(".pip4-title");
    title.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button") || isPhone()) return;
      if (w.state === "min") return;
      const r = w.el.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      e.preventDefault();
      try {
        title.setPointerCapture(e.pointerId);
      } catch {
        /* capture unsupported */
      }
      const move = (ev) => {
        w.el.style.left = `${Math.max(2, Math.min(innerWidth - 80, ev.clientX - dx))}px`;
        w.el.style.top = `${Math.max(2, Math.min(innerHeight - 40, ev.clientY - dy))}px`;
      };
      const up = () => {
        title.removeEventListener("pointermove", move);
        title.removeEventListener("pointerup", up);
        title.removeEventListener("pointercancel", up);
      };
      title.addEventListener("pointermove", move);
      title.addEventListener("pointerup", up);
      title.addEventListener("pointercancel", up);
    });
  }

  function spawn(id, { quiet = false } = {}) {
    const r = cfg.findRecord(id);
    if (!r || !cfg.layer) return null;
    let w = pips.get(id);
    if (w) {
      if (isPhone()) iconifyOthers(id);
      setState(w, "open");
      return w;
    }
    const el = document.createElement("section");
    el.className = "pip4";
    el.dataset.pip = id;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", `${r.name} — badge pip`);
    el.innerHTML = `
      <header class="pip4-title">
        <span class="pip4-name">${cfg.titleFor ? cfg.titleFor(r) : r.name}</span>
        <span class="pip4-btns">
          <button type="button" data-act="min" aria-label="Collapse">–</button>
          <button type="button" data-act="icon" aria-label="Iconify">▪</button>
          <button type="button" data-act="close" aria-label="Close">×</button>
        </span>
      </header>
      <div class="pip4-body">${cfg.detailHtml(r)}</div>`;
    cfg.layer.appendChild(el);

    w = { id, r, el, state: "open" };
    pips.set(id, w);
    placeCascade(w);
    bindDrag(w);
    cfg.bindBody?.(el, r);

    el.addEventListener("pointerdown", () => raise(w), true);
    const title = el.querySelector(".pip4-title");
    title.addEventListener("dblclick", (e) => {
      if (!e.target.closest("button")) setState(w, w.state === "min" ? "open" : "min");
    });
    el.querySelector(".pip4-btns").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      e.preventDefault();
      if (btn.dataset.act === "min") setState(w, w.state === "min" ? "open" : "min");
      if (btn.dataset.act === "icon") setState(w, "icon");
      if (btn.dataset.act === "close") close(w);
    });

    if (isPhone()) iconifyOthers(id);
    setState(w, "open");
    if (!quiet) announce(`${r.surname || r.name} ${r.badge ? "· " + r.badge : ""} — pip loaded`);
    return w;
  }

  function close(w) {
    w.el.remove();
    pips.delete(w.id);
    if (focused === w) focused = null;
    syncDesk();
    syncTray();
  }

  function spawnAll(ids, cap = 12) {
    const take = ids.slice(0, Math.max(1, cap));
    take.forEach((id) => spawn(id, { quiet: true }));
    const skipped = ids.length - take.length;
    announce(
      skipped > 0
        ? `${take.length} pips loaded · ${skipped} more cards in results — narrow the filters to pip a smaller set`
        : `${take.length} pip${take.length === 1 ? "" : "s"} loaded — one per card`
    );
    return { spawned: take.length, skipped };
  }

  function tile() {
    const openWins = [...pips.values()].filter((w) => w.state !== "icon");
    if (!openWins.length) return;
    if (isPhone()) {
      openWins.slice(1).forEach((w) => setState(w, "icon"));
      announce("tile keeps one sheet on small screens");
      return;
    }
    for (const w of openWins) {
      w.state = "open";
      w.el.classList.remove("is-min", "is-icon");
    }
    tilePositions(openWins.length, innerWidth, innerHeight).forEach((pos, i) => {
      openWins[i].el.style.left = `${pos.left}px`;
      openWins[i].el.style.top = `${pos.top}px`;
    });
    announce(`tiled ${openWins.length} pips`);
    syncTray();
  }

  function clear() {
    for (const w of [...pips.values()]) close(w);
    allIcon = false;
    announce("pips cleared");
  }

  function toggleDesk() {
    const icons = iconified();
    if (icons.length) {
      for (const w of icons) setState(w, "open");
      allIcon = false;
      return;
    }
    if (!pips.size) return;
    for (const w of pips.values()) setState(w, "icon");
    allIcon = true;
  }

  function closeTop() {
    if (focused) close(focused);
    else {
      const last = [...pips.values()].pop();
      if (last) close(last);
    }
  }

  cfg.desk?.querySelector("[data-wm4d='desk']")?.addEventListener("click", toggleDesk);
  cfg.desk?.querySelector("[data-wm4d='tile']")?.addEventListener("click", tile);
  cfg.desk?.querySelector("[data-wm4d='clear']")?.addEventListener("click", clear);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !pips.size) return;
    if (e.target.closest?.("input, textarea, select")) return;
    closeTop();
  });

  return {
    spawn,
    spawnAll,
    tile,
    clear,
    toggleDesk,
    closeTop,
    has: (id) => pips.has(id),
    count: () => pips.size,
    ids: () => [...pips.keys()],
  };
}
