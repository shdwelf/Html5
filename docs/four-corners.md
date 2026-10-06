# Four Corners 4Dwm

Built: **4 October 2026**, modeled after `socal-subsurface.html` (interaction
grammar) and `cheyenne.html` (data-pack discipline).

`/four-corners.html` is a single-plate Three.js theater of the AZ / CO / NM /
UT quadripoint country: the Navajo volcanic field necks, the San Juan Basin
energy district, the uranium-legacy ring, and the Ancestral Puebloan core —
with a curated GNIS-style gazetteer register.

## What the viewer does

- One plate on a local equirectangular projection centered on the Four
  Corners Monument (1 scene unit = 10 km, the suite convention), bbox
  −110.60…−107.80 lon, 35.80…37.90 lat.
- **Terrain is a curated control-point relief surface** (inverse-distance
  interpolation over ~30 hand-placed [lon, lat, elev] anchors), context tier
  by construction — a reading surface, not a DEM. Exaggeration slider 1–18×.
- State quadrants are tinted in the terrain vertex colors; the state lines
  are drawn through the **surveyed quadripoint** (36.998976, −109.045172
  NAD83), with the dossier explaining why the surveyed point beats the
  "ideal" intersection (it is legally final).
- Layers: borders + quadripoint · San Juan River corridor · gazetteer ·
  volcanic necks · energy · uranium legacy · Puebloan ruins. Every site node
  carries an evidence tier (official / community / context) and sources.
- Gazetteer search (register + sites), dossier picking, draggable/minimizable
  PiPs, plan-view minimap, FPS/cursor/ground HUD readouts.

## Data notes

- **Gazetteer**: 47-row curated seed register in the ADL GCS entry model
  (name set + point footprint + GNIS feature-class → FTT), following
  `docs/socal-usgs-gazetteer.md`. FEATURE_IDs are *not pinned* — rows are
  8-column by design so no id can be invented (enforced by the test).
- **Energy**: Four Corners Power Plant / Navajo Mine / San Juan GS (+mine) /
  Hogback + Rattlesnake historic fields / Greater Aneth / McElmo Dome CO₂.
- **Uranium**: DOE-LM UMTRA sites (Shiprock, Mexican Hat, Monument Valley),
  Monument No. 2, and White Mesa Mill (the only operating conventional US
  uranium mill).
- **Ruins**: Mesa Verde, Chaco, Aztec Ruins, Hovenweep, Canyon de Chelly,
  Salmon Ruins, Lowry Pueblo — NPS/BLM units official tier, Salmon community.
- **Necks**: Shiprock, Agathla, Alhambra Rock, Mitten Rock — Navajo volcanic
  field minette diatremes, community tier geology summaries.

## Files

- `four-corners.html` — app shell.
- `css/four-corners.css` — 4Dwm dark PiP layout.
- `js/four-corners-data.js` — data pack (META/LAYERS/BORDERS/GAZETTEER/SITES/TERRAIN_POINTS/VIEWS).
- `js/four-corners.js` — Three.js viewer.
- `scripts/build-four-corners-xdc.mjs` — Webxdc packager → `four-corners.xdc`.
- `tests/four-corners.test.mjs` — bbox/tier/register-shape checks.

## Validation

```sh
node --test tests/four-corners.test.mjs
node --check js/four-corners-data.js js/four-corners.js
node scripts/build-four-corners-xdc.mjs
python3 scripts/serve-los-alamos.py --host 0.0.0.0 --port 5173
# open http://localhost:5173/four-corners.html
```

## Boundaries

- The relief is honest about being curated: the HUD labels ground readouts
  "(curated IDW)" and the status bar says "no DEM".
- Border lines are schematic straight lines through the quadripoint, not the
  surveyed line segments with their historical kinks.
- Navajo Nation / Ute Mountain Ute / Hopi land status is carried in site
  dossiers where it matters (FCPP, UMTRA sites, Canyon de Chelly), not as a
  boundary layer — drawing honest reservation boundaries needs a sourced
  geometry pass of its own.

## Calculator port (`four-corners-calc/`)

The same map as a native port for three graphing calculators, built the way
`socal-calc/` was built: one integer-only C89 core, no float / libc / malloc /
`struct`, compiled by gcc for the host tests and transpiled to an ES module
for the `four-corners-calc.html` bench — so the browser preview *is* the port.
Six screens (boot, map, section, layers, dossier, device), 74 features —
3 corridors, 24 sites, 47 register rows — plus 19 corridor vertices and the
31-point IDW relief in **6105 bytes**, 24.8 % of a TI-83's practical program
budget. Evidence tier survives as line style (official solid, community
dashed, context dotted); the two schematic depths (Greater Aneth −1700 m,
McElmo Dome CO₂ −2400 m) hang under the terrain on a log ramp.

`four-corners-calc/tools/xdc2c.py` derives the data pack from
`four-corners.xdc` itself — it unzips the bundle and runs the app's own ES
modules under node, so the port cannot drift from the app. The terrain is the
app's own `elevAt()` from `js/four-corners-geo.js` re-derived in fixed point
and checked against 221 captured samples: mean error 2 m, worst 13 m.

```sh
make -C four-corners-calc test      # 47 core checks, C/JS differential test, containers
make -C four-corners-calc preview   # PBM frames for all three devices
```

See [`four-corners-calc/README.md`](../four-corners-calc/README.md) for the
full architecture, the data ledger and the accuracy notes.
