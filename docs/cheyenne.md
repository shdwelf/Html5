# CHEYENNE / ANGELES 4Dwm

Two-plate Three.js theater pairing **Cheyenne Mountain, Colorado — the granite
under NORAD** — with the **Angeles National Forest's San Gabriel block** in
California: its USGS-indexed mines, its campgrounds, and the Bridge to Nowhere.
Built on the socal-subsurface app's architecture (PIP windows, layer register,
dossier, plan view, exaggeration sliders, webxdc packaging) with a new dual-plate
projection and a USGS-sourced control-point DEM.

Open `cheyenne.html` (or install `cheyenne.xdc` in a webxdc host such as
Delta Chat). Everything is vendored and offline.

## Why two plates

Cheyenne Mountain and the Angeles National Forest are ~1,310 km apart. A single
flat projection cannot be honest about both at theater scale, so each plate
gets its own local equirectangular projection (`js/cheyenne-geo.js`
`makeProjection(center)`, 1 scene unit = 10 km) and the app renders them side
by side in scene space with the true separation labelled. Plan distances
inside a plate are true; the gap between plates is for reading, not flying.

## Data layers

| layer | source | notes |
| --- | --- | --- |
| Terrain · 3DEP control | USGS 3DEP 1 m DEM samples via National Map ImageServer `getSamples` (2026-10-02) | 291 real control points (138 chey + 153 ange), Shepard-interpolated between them; NAVD 88 |
| Political relief | OpenStreetMap boundaries via Nominatim (county rings at 0.002–0.004°, ANF proclamation ring at 0.005°) | Teller + El Paso counties, LA + San Bernardino counties, Angeles NF |
| GNIS gazetteer | USGS GNIS via carto.nationalmap.gov geonames MapServer (July 2026 refresh) | 75 summits/gaps/valleys/places, first point of each MultiPoint; feeds the search box |
| NORAD / facilities | NORAD & US Space Force published history | Cheyenne Mountain Complex dossier: 1961–66 construction, 15 buildings on ~1,300 springs, 25-ton doors, 11 Sep 2001 |
| Campsites | USFS/Recreation.gov (ANF), Colorado Parks & Wildlife (Cheyenne Mtn SP, Mueller) | 10 campgrounds incl. Crystal Lake, Chilao, Table Mountain, Manker Flat, Coldbrook, Heaton Flat |
| Mines · San Gabriels | USGS MRDS (mrdata.usgs.gov WFS, pulled 2026-10-02) | 67 records: the East Fork gold belt (Big Horn, Allison, Gold Dollar, Eagle, Native Son, Holly, Zanteson…), Acton district (Red Rover, Puritan, Hi-Grade), tungsten/graphite/barite/gemstone oddities |
| Mines · Cripple Creek | USGS MRDS | 15 records from the ~500-record gold caldera district + district node |
| Corridors | USFS trail alignments + Pikes Peak Highway | East Fork trail (Azusa → Bridge to Nowhere → Iron Fork), Pikes Highway |

**Stanley-Miller Mine** is plotted at community tier: the USGS MRDS point index
has no record at the site, so the pin comes from mine-historian and trip-report
concordance (~1,200 ft above the Narrows on Iron Mountain's west face). The
dossier says so explicitly. The **Bridge to Nowhere** is a bridge, not a mine —
it lives in the facilities layer with its own dossier (1936 arch, 1938 flood).

## Evidence tiers

Same discipline as socal-subsurface:

- **official** (amber) — USGS MRDS/GNIS records, agency published fact
- **community** (cyan) — well-sourced secondary (mine historians, Recreation.gov detail)
- **context** (magenta) — approximate/schematic only, never blended

## Controls

- **VIEW** select — NORAD · Cheyenne Mountain / Pikes massif / Cripple Creek / East Fork / San Gabriel crest / both plates
- **X-RAY** — ghost the terrain shell to read shafts and depth bulbs
- **WIREFRAME** — see the control-point DEM grid itself
- **LABELS** — toggle the projected label layer
- **RESET** — sliders and camera back to defaults
- Sliders — terrain exaggeration (1–18×) and depth scale (1–6×); everything
  draped on terrain rebuilds live
- Search box (HUD PIP) — offline matcher over the embedded GNIS gazetteer and
  feature register; jumps the camera to any hit
- Click any node or the terrain — dossier with provenance (MRDS dep_id,
  3DEP note, sources)
- PIP windows drag by their headers, minimize with –

## Honest scale notes

- Vertical is exaggerated (default 6×); plan distances per plate are true at
  1 unit = 10 km.
- The DEM is **not** a raster sample: it is Shepard interpolation of 291 real
  3DEP point values plus a disclosed ±25 m fractal grain for texture. Between
  control points the surface is smooth by construction. `js/cheyenne-dem.js`
  `buildGrid()` returns exactly the shape a clipped 3DEP GeoTIFF should be
  converted to (`gdal_translate -projwin`), so a true raster can be swapped in
  without touching the app.
- Mine depth pins are schematic (record-scale depths, not surveyed workings).
- Political rings are generalized (0.002–0.005°) — schematic, not survey lines.
- 14 MRDS records plot outside the carried ANF proclamation ring (Acton
  district + desert fringe + valley floor); the off-frame register in the
  LAYERS PIP says which and why.

## Rebuilding the DEM control set

```sh
# the raw USGS getSamples responses live in tools/cheyenne/raw/*.json
node tools/cheyenne/compile-dem.mjs   # → js/cheyenne-dem-data.js
```

The query log is the proof: every elevation in the app can be traced to a
`getSamples` response file fetched 2026-10-02.

## Webxdc

```sh
node scripts/build-cheyenne-xdc.mjs   # → cheyenne.xdc (+ dist/, public/apps/cheyenne/)
```

Deterministic zip (fixed mtime), `manifest.toml` with name + source URL, and a
`webxdc.js` simulator shim so the bundle also runs from a plain static server.
The app sends webxdc status updates (view changes, dossiers) when hosted.
