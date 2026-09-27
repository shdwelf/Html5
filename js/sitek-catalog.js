/** SITE-K application catalog. Keep route metadata in one place so the shell,
 * window manager, and offline worker agree on the public integrations. */
export const SITEK_APPS = Object.freeze([
  { id: "lecturehall", label: "LECTURE HALL", route: "./index.html#grid", preserved: true },
  { id: "four-dwm", label: "4DWM", route: "./index.html#grid", preserved: true },
  { id: "enso", label: "ENSŌ GENERATOR", route: "./index.html#enso", entry: "./art-studio.html", offline: true },
]);

export const SITEK_APP_BY_ID = Object.freeze(
  Object.fromEntries(SITEK_APPS.map((app) => [app.id, app]))
);

export function appByRoute(route) {
  return SITEK_APPS.find((app) => app.route === route || app.id === route) || null;
}
