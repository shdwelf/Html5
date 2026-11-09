const BASE_Z = 80;
let foregroundZ = BASE_Z;

function ensureWindowChromeStyles() {
  if (document.getElementById("4dwm-window-manager-styles")) return;
  const style = document.createElement("style");
  style.id = "4dwm-window-manager-styles";
  style.textContent = `
    .pip-head, .pip > header { cursor: grab; touch-action: none; user-select: none; }
    .pip-head:active, .pip > header:active { cursor: grabbing; }
    .four-dwm-window { display: flex; flex-direction: column; overflow: hidden; }
    .four-dwm-window-head {
      flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 8px 10px; border-bottom: 1px solid currentColor;
      cursor: grab; touch-action: none; user-select: none;
    }
    .four-dwm-window-head:active { cursor: grabbing; }
    .four-dwm-window-head strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .four-dwm-window-head button { flex: 0 0 auto; min-width: 30px; min-height: 28px; padding: 2px 8px; }
    .four-dwm-window-body { min-height: 0; flex: 1 1 auto; overflow: auto; }
    .four-dwm-window.min .four-dwm-window-body { display: none; }
  `;
  document.head.append(style);
}

function raise(element) {
  foregroundZ += 1;
  element.style.zIndex = String(foregroundZ);
}

function attachDrag(element, handle) {
  if (!handle || element.dataset.fourDwmDragBound === "true") return;
  element.dataset.fourDwmDragBound = "true";
  handle.style.touchAction = "none";
  let drag = null;

  element.addEventListener("pointerdown", (event) => {
    raise(element);
    if (
      event.button !== 0 ||
      !handle.contains(event.target) ||
      !(event.target instanceof Element) ||
      event.target.closest("button, a, input, select, textarea, label")
    ) return;
    const bounds = element.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    try { handle.setPointerCapture(event.pointerId); } catch { /* WebView may already own capture. */ }
    event.preventDefault();
  });

  element.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const bounds = element.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - Math.min(bounds.width, 60));
    const maxTop = Math.max(0, window.innerHeight - 32);
    const left = Math.min(maxLeft, Math.max(0, event.clientX - drag.offsetX));
    const top = Math.min(maxTop, Math.max(0, event.clientY - drag.offsetY));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.right = "auto";
    element.style.bottom = "auto";
  });

  const finish = (event) => {
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    drag = null;
  };
  element.addEventListener("pointerup", finish);
  element.addEventListener("pointercancel", finish);
  element.addEventListener("lostpointercapture", finish);
}

function observeMinimizedState(windowElement, button) {
  const update = () => {
    const minimized = windowElement.classList.contains("min");
    button.setAttribute("aria-expanded", String(!minimized));
    button.setAttribute("aria-label", minimized ? "Restore window" : "Minimize window");
  };
  update();
  new MutationObserver(update).observe(windowElement, { attributes: true, attributeFilter: ["class"] });
}

function preparePips() {
  for (const pip of document.querySelectorAll(".pip")) {
    const handle = pip.querySelector(":scope > .pip-head, :scope > header");
    if (!handle) continue;
    attachDrag(pip, handle);
    const minimize = pip.querySelector(":scope > .pip-head [data-min], :scope > header [data-min]");
    if (minimize) observeMinimizedState(pip, minimize);
  }
}

function prepareFloatingPanels() {
  for (const panel of document.querySelectorAll("[data-4dwm-window]")) {
    if (panel.dataset.fourDwmPrepared === "true") continue;
    panel.dataset.fourDwmPrepared = "true";
    const title = panel.dataset.windowTitle || panel.querySelector("h2")?.textContent?.trim() || "WINDOW";
    const body = document.createElement("div");
    body.className = "four-dwm-window-body";
    while (panel.firstChild) body.append(panel.firstChild);

    const head = document.createElement("div");
    head.className = "four-dwm-window-head";
    const label = document.createElement("strong");
    label.textContent = title;
    const collapse = document.createElement("button");
    collapse.type = "button";
    collapse.textContent = "−";
    collapse.setAttribute("aria-label", "Minimize window");
    collapse.setAttribute("aria-expanded", "true");
    collapse.addEventListener("click", (event) => {
      event.stopPropagation();
      const minimized = panel.classList.toggle("min");
      collapse.textContent = minimized ? "+" : "−";
      collapse.setAttribute("aria-expanded", String(!minimized));
      collapse.setAttribute("aria-label", minimized ? "Restore window" : "Minimize window");
    });
    head.append(label, collapse);
    panel.classList.add("four-dwm-window");
    panel.append(head, body);
    attachDrag(panel, head);
  }
}

ensureWindowChromeStyles();
preparePips();
prepareFloatingPanels();
