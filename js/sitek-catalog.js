/** SITE-K application catalog. Keep route metadata in one place so the shell,
 * window manager, and offline worker agree on the public integrations. */
export const SITEK_APPS = Object.freeze([
  { id: "lecturehall", label: "LECTURE HALL", route: "./index.html#grid", preserved: true },
  { id: "four-dwm", label: "4DWM PORTS", route: "./4dwm-ports.html", preserved: true },
  { id: "planet-viewer", label: "PLANET VIEWER", route: "./planet-viewer-4dwm.html", offline: true },
  { id: "country-viewer", label: "COUNTRY VIEWER", route: "./country-viewer.html", offline: true },
  { id: "local-contacts", label: "LOCAL CONTACTS", route: "./contacts.html", offline: true },
  { id: "enso", label: "ENSŌ GENERATOR", route: "./index.html#enso", entry: "./art-studio.html", offline: true },
]);

export const SITEK_APP_BY_ID = Object.freeze(
  Object.fromEntries(SITEK_APPS.map((app) => [app.id, app]))
);

export function appByRoute(route) {
  return SITEK_APPS.find((app) => app.route === route || app.id === route) || null;
}
