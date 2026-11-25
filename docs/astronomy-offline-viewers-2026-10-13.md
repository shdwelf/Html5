# Offline Helios Observatory and Prime Viewer

The checked-in `astronomy.xdc` contains the Helios Observatory source app;
`prime.xdc` contains Prime Viewer. The offline app trees are rebuilt from those
archives by `scripts/build-astronomy-offline-viewers.mjs`:

- `public/apps/helios-observatory/` — Helios is `index.html`; Prime Viewer is
  included as local `prime.html`.
- `public/apps/prime-viewer/` — Prime is `index.html`; Helios is included as
  local `helios.html`.

The build preserves the XDC source CSS, JavaScript, icon, Webxdc preview shim,
Three.js, OrbitControls, and `vendor/THREE_LICENSE`. The two viewers navigate
between their local companion pages instead of linking to missing SITE-K or
Keyspace pages. They share only view settings through the Webxdc update API
when the user presses a share button; no contact, badge, credential, or personal
record data is present in these payloads. The app-authored JavaScript has no
fetch/XHR/WebSocket/EventSource calls and the tests check that HTML, module
imports, and navigation targets resolve locally.

To rebuild the directories, run `npm run build:astronomy-offline`; to verify
that the checked-in output still matches both source archives, run
`npm run check:astronomy-offline`. `npm run build` packages each directory as a
standalone `helios-observatory.xdc` and `prime-viewer.xdc`. The offline Android
launcher discovers both app entrypoints from `public/apps/` and stages their
local assets.

The astronomy simulation uses an approximate heliocentric Kepler model, not
live observations, Horizons ephemerides, impact prediction, or navigation.
Prime counts and arithmetic are algorithmic; the rendered scale is a visual
transformation. Three.js and OrbitControls are third-party vendored code under
the bundled MIT license notice.
