/** SITE-K 4Dwm PIP deck — loads a floating PIP (990 file) window for each card.
 *
 *  The classic PIP is a single shared panel: clicking a node replaces it.
 *  The deck makes the 4Dwm real — every sanctuary node gets a card, and each
 *  card can load up its own floating Motif window. PIP ALL loads one per card.
 *
 *  initPipDeck({
 *    cards,            // container element for the node cards
 *    layer,            // floating window layer element (#pipLayer)
 *    bar,              // taskbar element for iconified pips (#pipBar)
 *    nodes,            // SANCTUARIES list for the current pad
 *    money(v),         // currency formatter from the node pack
 *    status(node, t),  // parishStatus(node, simTime) -> SAFE | CONTESTED | OFFLINE
 *    renderBody(node), // HTML for the 990 file body
 *    inspect(node),    // FLY action (select parish + camera move)
 *    log(lvl, msg),    // syslog line
 *    beep(...),        // ui beep
 *    phone(),          // true on small viewports (pips become sheets)
 *  })
 */

export function initPipDeck(cfg) {
  const pips = new Map(); // node.id -> { id, node, el, state }
  let zTop = 0;
  let cascade = 0;
  let statusAt = 0;

  const phone = () =>
    (typeof cfg.phone === "function" ? cfg.phone() : false) ||
    matchMedia("(max-width: 980px)").matches;

  /* ── cards ─────────────────────────────────────────────────── */

  function renderCards() {
    if (!cfg.cards) return;
    cfg.cards.innerHTML = "";
    for (const n of cfg.nodes) {
      const latest = n.filings?.[n.filings.length - 1];
      const el = document.createElement("article");
      el.className = "deck-card";
      el.dataset.node = n.id;
      el.innerHTML = `
        <header><b>${n.short}</b><span class="dot" title="status"></span></header>
        <h3>${n.name}</h3>
        <p class="meta">${n.rite} · EIN ${n.ein}</p>
        <p class="meta">${n.parish} · ${n.city}</p>
        ${latest ? `<p class="meta rev">REV ${cfg.money ? cfg.money(latest.rev) : latest.rev} · FY${latest.y}</p>` : ""}
        <div class="card-actions">
          <button type="button" class="hot" data-act="pip">PIP</button>
          <button type="button" data-act="fly">FLY</button>
        </div>`;
      el.querySelector('[data-act="pip"]').addEventListener("click", () => spawn(n));
      el.querySelector('[data-act="fly"]').addEventListener("click", () => cfg.inspect?.(n));
      el.addEventListener("dblclick", (e) => {
        if (!e.target.closest("button")) spawn(n);
      });
      cfg.cards.appendChild(el);
    }
    const count = document.getElementById("deckCount");
    if (count) count.textContent = `${cfg.nodes.length} CARDS`;
  }

  /* ── pip windows ───────────────────────────────────────────── */

  function raise(w) {
    zTop += 1;
    w.el.style.zIndex = String(zTop);
    for (const o of pips.values()) o.el.classList.toggle("focus", o === w);
  }

  function placeCascade(w) {
    if (phone()) return; // CSS sheet layout takes over
    const bw = 340;
    const baseL = Math.max(320, Math.round((innerWidth - bw) / 2) - 110);
    const step = cascade++ % 8;
    w.el.style.left = `${Math.min(baseL + step * 28, innerWidth - 200)}px`;
    w.el.style.top = `${Math.min(92 + step * 24, innerHeight - 160)}px`;
    w.el.style.right = "auto";
  }

  function iconifyOthers(keepId) {
    for (const w of pips.values()) {
      if (w.id !== keepId && w.state === "open") setState(w, "icon");
    }
  }

  function setState(w, st) {
    w.state = st;
    w.el.classList.toggle("is-min", st === "min");
    w.el.classList.toggle("is-icon", st === "icon");
    w.el.classList.toggle("is-open", st === "open");
    if (st === "open") raise(w);
    syncBar();
  }

  function close(w) {
    w.el.remove();
    pips.delete(w.id);
    if (!w.quiet) cfg.log?.("sys", `4dwm  pip /990/${w.id}   closed`);
    syncBar();
  }

  function closeAll() {
    if (!pips.size) return;
    for (const w of [...pips.values()]) {
      w.quiet = true;
      close(w);
    }
    cfg.log?.("sys", "4dwm  pips cleared");
    syncBar();
  }

  function syncBar() {
    if (!cfg.bar) return;
    cfg.bar.innerHTML = "";
    const icons = [...pips.values()].filter((w) => w.state === "icon");
    cfg.layer?.classList.toggle("has-icons", icons.length > 0);
    for (const w of icons) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pip-chip";
      b.title = `Restore ${w.node.name}`;
      b.innerHTML = `<b>${w.node.short}</b><span>990</span>`;
      b.addEventListener("click", () => {
        if (phone()) iconifyOthers(w.id);
        setState(w, "open");
      });
      cfg.bar.appendChild(b);
    }
  }

  function bindDrag(w) {
    const title = w.el.querySelector(".pip-title");
    title.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".win-btn") || phone()) return;
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
        const x = Math.max(2, Math.min(innerWidth - 96, ev.clientX - dx));
        const y = Math.max(48, Math.min(innerHeight - 40, ev.clientY - dy));
        w.el.style.left = `${x}px`;
        w.el.style.top = `${y}px`;
        w.el.style.right = "auto";
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

  function spawn(node, opts = {}) {
    if (!cfg.layer) return null;
    let w = pips.get(node.id);
    if (w) {
      if (phone()) iconifyOthers(node.id);
      setState(w, "open");
      return w;
    }
    const el = document.createElement("section");
    el.className = "pip-win";
    el.dataset.pip = node.id;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", `${node.name} — Form 990 PIP`);
    el.innerHTML = `
      <header class="pip-title">
        <span class="pip-name">${node.short} · 990 FILE <i>EIN ${node.ein}</i></span>
        <span class="win-btns">
          <button type="button" class="win-btn" data-act="min" aria-label="Collapse">–</button>
          <button type="button" class="win-btn" data-act="icon" aria-label="Iconify">▪</button>
          <button type="button" class="win-btn" data-act="close" aria-label="Close">×</button>
        </span>
      </header>
      <div class="pip-body">${cfg.renderBody(node)}</div>`;
    cfg.layer.appendChild(el);

    w = { id: node.id, node, el, state: "open", quiet: opts.quiet };
    pips.set(node.id, w);
    placeCascade(w);
    bindDrag(w);

    el.addEventListener("pointerdown", () => raise(w), true);
    const title = el.querySelector(".pip-title");
    title.addEventListener("dblclick", (e) => {
      if (e.target.closest(".win-btn")) return;
      setState(w, w.state === "min" ? "open" : "min");
    });
    title.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.act === "min") setState(w, w.state === "min" ? "open" : "min");
      if (btn.dataset.act === "icon") setState(w, "icon");
      if (btn.dataset.act === "close") close(w);
    });

    if (phone()) iconifyOthers(node.id);
    setState(w, "open");
    if (!opts.quiet) {
      cfg.log?.("sys", `4dwm  pip /990/${node.id}   ${node.short}   card loaded`);
      cfg.beep?.(740, 0.05, 0.02, "triangle");
    }
    return w;
  }

  function spawnAll() {
    cfg.nodes.forEach((n) => spawn(n, { quiet: true }));
    cfg.log?.("ok", `4dwm  loaded ${pips.size} pip${pips.size === 1 ? "" : "s"} — one per card`);
    cfg.beep?.(880, 0.08, 0.02, "triangle");
  }

  function tileAll() {
    const openWins = [...pips.values()].filter((w) => w.state !== "icon");
    if (!openWins.length) return;
    if (phone()) {
      openWins.slice(1).forEach((w) => setState(w, "icon"));
      cfg.log?.("sys", "4dwm  tile keeps one sheet on small screens");
      return;
    }
    openWins.forEach((w) => {
      if (w.state === "min") setState(w, "open");
    });
    const areaL = 320;
    const areaR = innerWidth - 320;
    const areaT = 92;
    const areaB = innerHeight - 100;
    const cols = Math.max(1, Math.floor((areaR - areaL) / 300));
    const rows = Math.max(1, Math.ceil(openWins.length / cols));
    const cw = (areaR - areaL) / cols;
    const ch = Math.max(120, (areaB - areaT) / rows);
    openWins.forEach((w, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      w.el.style.left = `${Math.round(areaL + col * cw + 6)}px`;
      w.el.style.top = `${Math.round(Math.min(areaT + row * ch, areaB - 48))}px`;
      w.el.style.right = "auto";
    });
    cfg.log?.("sys", `4dwm  tiled ${openWins.length} pips`);
  }

  /* ── deck status refresh (storm sim) ───────────────────────── */

  function refresh(t) {
    const now = performance.now();
    if (now - statusAt < 900) return;
    statusAt = now;
    if (!cfg.cards || typeof cfg.status !== "function") return;
    for (const card of cfg.cards.querySelectorAll(".deck-card")) {
      const node = cfg.nodes.find((n) => n.id === card.dataset.node);
      const dot = card.querySelector(".dot");
      if (!node || !dot) continue;
      const st = String(cfg.status(node, t) || "").toLowerCase();
      dot.className = `dot ${st}`;
      dot.title = `${node.short}: ${st.toUpperCase()}`;
    }
  }

  /* ── deck chrome buttons ───────────────────────────────────── */

  document.getElementById("btnDeckAll")?.addEventListener("click", spawnAll);
  document.getElementById("btnDeckTile")?.addEventListener("click", tileAll);
  document.getElementById("btnDeckClear")?.addEventListener("click", closeAll);

  renderCards();

  return {
    spawn,
    spawnAll,
    tileAll,
    closeAll,
    refresh,
    has: (id) => pips.has(id),
    focus: (id) => {
      const w = pips.get(id);
      if (w) setState(w, "open");
    },
    count: () => pips.size,
  };
}
