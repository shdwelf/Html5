# PLANET VIEWER · 4DWM — deep dive

*2026-10-09 · `planet-viewer-4dwm.html` · companion to `js/planet-viewer-*.js`*

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
explicit slider, never a hidden scale.

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

The offline GNIS subset is five packed cities (Atlanta, Buffalo, Kansas City,
Lawrence, Toronto) — `js/city-gazetteer-data-*.js`. Search is the trigram
model from `js/city-gazetteer.js`. A mountain plate therefore legitimately has
zero points; `*/gaz-in-box` asserts exactly that (every ADL search-box hit is
inside the bbox, and Lawrence returns its packed points). The viewer says so
rather than pretending to full coverage.

## Cross-checks

Every check compares two independent paths; `chey/interp-vs-control` is a
contradiction check that passes while the interpolated grain between 3DEP
control points remains disclosed. The control-repro checks run
`js/cheyenne-dem.js`'s probe validator (each control point reproduces its own
elevation; famous summits land in a sanity window).

## Verification

- `tests/planet-viewer.test.mjs` — 9/9 pure (data adapter, checks, VRML, wiring).
- `tests/planet-viewer-browser.mjs` — 8/8 on real WebGL (SwiftShader): boots,
  draws terrain, survives every plate × mode transition, exports a `.wrl` from
  the page, and the scoped `[data-mode]` selector guard holds (a stray click
  cannot reset the view).
- `npm run build:planet` → Webxdc bundle.
