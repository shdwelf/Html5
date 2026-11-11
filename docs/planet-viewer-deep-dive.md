# PLANET VIEWER · 4DWM — deep dive

*Updated 2026-10-13 · `planet-viewer-4dwm.html` · companion to `js/planet-viewer-*.js`*

> **Distribution note (2026-10-13):** At the user's direction, the existing
> `planet-viewer-4dwm.xdc` filename now carries the **SoCal Subsurface 4Dwm**
> package instead of the Planet page. It is byte-identical to
> `socal-subsurface.xdc`, with a truthful SoCal manifest; `npm run build:planet`
> rebuilds both artifacts. The interactive Planet HTML and its sources/tests
> remain available separately for browser use.

USGS 3DEP terrain, drawn three ways, over an offline USGS GNIS gazetteer, in
the `socal-subsurface` viewer idiom. It is the second item of the agreed order
and reuses the committed control-point machinery rather than fetching anything:
this sandbox cannot reach USGS endpoints (egress is limited to the code
registries and GitHub), and the repo's own convention is to commit the 3DEP
control points and interpolate locally, disclosing the interpolation as
texture, not data.

## Plates

| id | terrain | relief | source |
| --- | --- | --- | --- |
| `chey` | Cheyenne / Pikes Peak front range | ~2,540 m | USGS 3DEP 1 m control points, NAVD 88 |
| `ange` | San Gabriel / Angeles | ~2,980 m | USGS 3DEP 1 m control points, NAVD 88 |
| `lawrence` | Lawrence, Kansas plains | ~80 m | USGS 3DEP minimal control grid |

`js/planet-viewer-data.js` normalises each to the `{ nx, ny, bbox, elev, min,
max }` shape the terrarium VRML writer consumes, plus a `world` block in
kilometres so one scene unit is one km and the vertical exaggeration is an
explicit slider, never a hidden scale. The Lawrence source is an 8×8 sparse
3DEP grid stored north-to-south. The adapter flips it to the viewer's
south-to-north row convention and bilinearly resamples it to the selected
render-grid dimensions, preserving the same 64 source samples and making no
new elevation claims. No cross-bbox terrain blend is performed: Cheyenne,
Angeles, and Lawrence are geographically separate plates, not adjacent DEM
tiles.

## Modes

- **RELIEF** — hypsometric vertex-coloured surface (the `hypsometric()` ramp
  from `js/cheyenne-dem.js`), lit.
- **WIREFRAME** — the same grid as a lattice.
- **X-RAY** — a translucent surface plus a contour lattice (segments where each
  of six elevation bands crosses a cell), so the terrain reads as structure.
- **LABELS** — projects the packed GNIS points that fall inside the plate bbox.
- **VRML** — exports through `js/vrml-export.js` `demToVrml()`, the same writer
  the SITE-K terrarium uses.

## Gazetteer

The offline name index combines the Cheyenne/Pikes Peak register, the synced
SoCal register, five city datasets (Atlanta, Buffalo, Kansas City, Lawrence,
Toronto), and the Bora Bora name-only locality — `js/planet-viewer-gazetteer.js`.
Search uses the trigram model from `js/city-gazetteer.js`. Each terrain plate
has in-bounds local names, but this remains a limited offline place-name index,
not a complete GNIS query or address service. Source coordinates and
verification levels are preserved; absent FEATURE_IDs are not inferred. The
Cheyenne documentation records a July 2026 GNIS refresh, while its exact query
date is unverified in retained source notes; 2026-10-02 DEM/MRDS dates are not
attributed to GNIS.

## Cross-checks

Every check compares two independent paths; `chey/interp-vs-control` is a
contradiction check that passes while the interpolated grain between 3DEP
control points remains disclosed. The control-repro checks run
`js/cheyenne-dem.js`'s probe validator (each control point reproduces its own
elevation; famous summits land in a sanity window).

## Verification

- `tests/planet-viewer.test.mjs` — pure data, resampling/orientation, checks,
  Gazetteer, VRML, and page-wiring regressions.
- `tests/planet-viewer-browser.mjs` — automation covers real WebGL drawing,
  plate/mode changes, terrain zoom, and Gazetteer jumps. Running it requires a
  supported browser runtime; this environment has no Chromium/Chrome binary, so
  no real-browser result is claimed here.
- `npm run build:planet-offline` stages the self-contained catalog app and its
  complete relative module graph. `npm run build:planet` continues to rebuild
  `socal-subsurface.xdc` under the legacy compatibility filename by design.
