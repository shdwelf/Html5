/** Hash-mode routing for the SITE-K shell. Keep the iframe destinations and
 * hash aliases explicit so standalone app tabs do not silently land on a blank
 * map view. */

const MODE_ALIASES = Object.freeze({
  artstudio: "studio",
  "art-studio": "studio",
  "distro-dossier": "dossier",
  distro: "dossier",
  "flash-decompiler": "flash",
  swf: "flash",
});

const VALID_MODES = new Set([
  "terrarium", "keyspace", "validator", "studio", "enso", "ghidra", "flash", "dossier", "grid",
]);

export const SITEK_FRAME_PAGES = Object.freeze({
  keyspace: "./keyspace.html",
  validator: "./validator.html",
  studio: "./art-studio.html",
  enso: "./art-studio.html",
  ghidra: "./ghidra-lab.html",
  flash: "./flash-decompiler.html",
  dossier: "./distro-dossier.html",
});

export function normalizeSitekMode(hash = "#grid") {
  const raw = String(hash || "#grid").replace(/^#\/?/, "").split("?")[0];
  const normalized = MODE_ALIASES[raw] || raw;
  return VALID_MODES.has(normalized) ? normalized : "grid";
}

export function framePageForMode(mode) {
  return SITEK_FRAME_PAGES[mode] || null;
}

export function isSitekFrameMode(mode) {
  return framePageForMode(mode) !== null;
}

/**
 * Update only hash-mode links. Ordinary app URLs in the same dock must remain
 * intact; overwriting those links with `#undefined` made the 4DWM launchers
 * appear clickable while silently routing nowhere.
 */
export function syncSitekDockLink(anchor, mode) {
  const linkMode = anchor?.dataset?.mode;
  if (!linkMode) return anchor?.getAttribute?.("href") ?? null;
  anchor.classList?.toggle("on", linkMode === mode);
  anchor.setAttribute?.("href", `#${linkMode}`);
  return `#${linkMode}`;
}
