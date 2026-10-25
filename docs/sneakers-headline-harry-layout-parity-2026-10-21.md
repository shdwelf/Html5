# Sneakers Press Kit XDC vs Headline Harry XDC — Layout & Input Parity Audit

*Audit for Task S2 (Agent Backlog 2026-10-21, Line 16 / S2 next actions)*
*Companion to [`docs/headline-harry-jsdos-fix-2026-10-04.md`](headline-harry-jsdos-fix-2026-10-04.md), [`docs/jsdos-cdn-deep-dive-2026-10-04.md`](jsdos-cdn-deep-dive-2026-10-04.md), and [`docs/github-wiki/Sneakers-Archive-and-Ghidra.md`](github-wiki/Sneakers-Archive-and-Ghidra.md).*

---

## 1. Context & Task Specification

Task S2 / line 16 states:
> *"Create xdc like headline-harry.xdc for the Sneakers press kit (keyboard/mouse side, js-dos)... Verify sneakers-press-kit.xdc keyboard/mouse side layout against headline-harry.xdc pattern and close the gap if any."*

The reference implementation is `headline-harry.xdc` (reconstructed and hardened after the 2026-10-04 js-dos v8 API and canvas-focus fixes). The evaluated packages are:
1. `sneakers-press-kit.xdc` (compact repository reconstruction, 805 KB)
2. `sneakers-press-kit-exact.xdc` (exact floppy byte-for-byte image reconstruction, 4.9 MB)

---

## 2. Parity Inspection & Structural Comparison

Both packages were extracted and compared across DOM structure, js-dos engine versions, container layout, focus grabbing, and event handling.

### A. Engine Bundling & Offline Completeness

| Property | `headline-harry.xdc` | `sneakers-press-kit.xdc` | Parity Status |
|---|---|---|---|
| Engine Version | js-dos v8 (8.4.1) | js-dos v8 (8.4.1) | **Identical** |
| Engine Assets Bundled | `emulators.js`, `js-dos.js`, `js-dos.css`, `wdosbox.js`, `wdosbox.wasm`, `wlibzip.js`, `wlibzip.wasm` | `emulators.js`, `js-dos.js`, `js-dos.css`, `wdosbox.js`, `wdosbox.wasm`, `wlibzip.js`, `wlibzip.wasm` | **Identical** |
| Offline Guarantee | `noCloud: true`, `pathPrefix: "js-dos/"` | `noCloud: true`, `pathPrefix: "js-dos/"` | **Identical** |
| Webxdc Shim | `webxdc.js` present | `webxdc.js` present | **Identical** |

### B. Canvas Focus & Keyboard/Mouse Input Pipeline

In iframe-hosted Webxdc environments, the js-dos canvas does not receive focus by default, which causes window keyboard and mouse events to be dropped ("no keyboard / no mouse" symptom).

`headline-harry.xdc` resolved this via a dedicated `focusDos` pattern:
```javascript
var focusDos = function () {
  var c = container.querySelector("canvas");
  if (!c) return;
  if (!c.hasAttribute("tabindex")) c.setAttribute("tabindex", "0");
  try { c.focus({ preventScroll: true }); } catch (_) { c.focus(); }
};
container.addEventListener("pointerdown", focusDos, true);
container.addEventListener("keydown", focusDos, true);
```

`sneakers-press-kit.xdc` implements this exact same focus loop:
```javascript
function focusDos() {
  var canvas = container.querySelector("canvas");
  if (!canvas) return;
  if (!canvas.hasAttribute("tabindex")) canvas.setAttribute("tabindex", "0");
  try { canvas.focus({ preventScroll: true }); } catch (_) { canvas.focus(); }
}
container.addEventListener("pointerdown", focusDos, true);
container.addEventListener("keydown", focusDos, true);
```
Both packages invoke `focusDos()` on startup (`setTimeout(focusDos, 0)`), upon `ci-ready` completion, and on pointer/keyboard capture phases.

### C. UI & Visual Hierarchy

- **Layout Structure**: Both use `#app` with flex layout, `#stage` for the canvas player, and a high-contrast `#overlay` with splash branding, clear instructions, a "▶ BOOT" call-to-action button, and an accessible live status readout (`role="status"`, `aria-live="polite"`).
- **Controls & Guidance**:
  - `headline-harry.xdc`: indicates mouse + keyboard, notes the on-screen keyboard (☰ sidebar) on touch devices.
  - `sneakers-press-kit.xdc`: specifies the access password (`setec astronomy`), keyboard navigation, single-click mouse pointer lock capture, and touch sidebar instructions.
  - `sneakers-press-kit.xdc` adds an expandable `<details class="about">` panel documenting release provenance, control keys, and reconstruction notes without intruding on the main game canvas.

---

## 3. Findings & Verdict

1. **Input & Engine Parity**: Both packages follow the exact hardened js-dos v8 pattern with bundled `wlibzip` wasm/js, offline `noCloud` flags, `tabindex="0"` canvas focus injection, and capture-phase event listeners.
2. **Layout Parity**: Both packages structure the viewer identically into header/stage/overlay with responsive sizing and touch sidebar awareness.
3. **Gap Status**: **No gaps found.** `sneakers-press-kit.xdc` already incorporates the full `headline-harry.xdc` layout and keyboard/mouse focus solution.

The verification item for Task S2 is fully satisfied and closed.
