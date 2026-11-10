/**
 * Minimal, local 4Dwm controls for floating .pip panels.
 *
 * This module is shared by the standalone city, SoCal, Cheyenne, Four Corners,
 * and Ingress viewers. Each offline package keeps a local copy through its
 * module graph; no page needs to reach a sibling app or the network.
 */

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.("button, a, input, select, textarea, label"));
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Bind exactly one drag and one collapse/restore handler to a .pip panel. */
export function attachPipWindow(pip) {
  if (!pip || pip.dataset?.fourDwmDragBound === "true") return false;

  const handle = pip.querySelector(":scope > .pip-head, :scope > header") || pip.querySelector(".pip-head");
  if (!handle) return false;

  pip.dataset.fourDwmDragBound = "true";
  handle.style.touchAction = "none";

  let drag = null;
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag || isInteractiveTarget(event.target)) return;

    const bounds = pip.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    pip.style.right = "auto";
    pip.style.bottom = "auto";
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded WebViews may already have captured the pointer.
    }
    event.preventDefault();
  });

  handle.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const bounds = pip.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - Math.min(bounds.width, 60));
    const maxTop = Math.max(0, window.innerHeight - 32);
    pip.style.left = `${clamp(event.clientX - drag.offsetX, 0, maxLeft)}px`;
    pip.style.top = `${clamp(event.clientY - drag.offsetY, 0, maxTop)}px`;
  });

  const finishDrag = (event) => {
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    drag = null;
  };
  handle.addEventListener("pointerup", finishDrag);
  handle.addEventListener("pointercancel", finishDrag);
  handle.addEventListener("lostpointercapture", finishDrag);

  const minimize = pip.querySelector(":scope > .pip-head [data-min], :scope > header [data-min], [data-min]");
  if (minimize) {
    const updateMinimizeButton = () => {
      const minimized = pip.classList.contains("min");
      minimize.textContent = minimized ? "+" : "−";
      minimize.setAttribute("aria-expanded", String(!minimized));
      minimize.setAttribute("aria-label", minimized ? "Restore window" : "Minimize window");
    };

    updateMinimizeButton();
    minimize.addEventListener("click", (event) => {
      event.stopPropagation();
      pip.classList.toggle("min");
      updateMinimizeButton();
    });
  }

  return true;
}

/** Bind every .pip once, optionally within a narrower container. */
export function preparePipWindows(root = document) {
  for (const pip of root.querySelectorAll(".pip")) attachPipWindow(pip);
}
