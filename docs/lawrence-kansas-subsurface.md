# Lawrence Subsurface 4Dwm — reconciled into the shared city engine

Lawrence is now one configuration of the shared SoCal-family city theater, not
an independent viewer. The checked-in Lawrence source set is deliberately
small: one sparse USGS 3DEP sample grid, five verified USGS GNIS point records,
and the shared local GPX importer. The city app keeps the shared Gazetteer,
layer controls, plan view, evidence tiers, and Webxdc build path.

## Build and test

```sh
npm run build:city-subsurface
node --test tests/city-subsurface.test.mjs
```

`data/lawrence/dem-anchors.json` is the DEM source register. The shared
`scripts/build-city-dem-data.mjs` generates `js/city-dem-grid-lawrence.js`,
then `scripts/build-city-subsurface.mjs` generates the page and city packs, and
`scripts/build-city-subsurface-xdc.mjs` creates `lawrence-subsurface.xdc` and
stages `public/apps/lawrence-subsurface/`. `npm run build:4dwm` includes the
shared city build. Lawrence is marked `demRequired`; the XDC builder refuses to
package it if its base DEM module is absent, and the viewer will not silently
replace a missing Lawrence grid with synthetic relief.

Preview the shared shell at `lawrence-subsurface.html`; the packaged offline
app is `lawrence-subsurface.xdc`.

## Elevation source and honest resolution

- Frame: `[-95.31, 38.88, -95.15, 39.04]` in longitude/latitude order.
- Source: [USGS 3DEP ImageServer `getSamples`](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples), queried 2026-10-08.
- Method: `esriGeometryEnvelope`, `sampleCount=64`,
  `returnFirstValueOnly=true`, and bilinear service sampling. The 8 × 8 sample
  locations are spaced at `0.02°`, about 1.7 km east-west by 2.2 km north-south
  at Lawrence's latitude.
- The service reported `resolution=1` at the sample points. Source-metadata
  spot checks reported USGS / `USGS_3DEP` / NAVD 88; the checked source-raster
  IDs and point checks are recorded in `data/lawrence/dem-anchors.json`.
- The 8 × 8 values are sparse point samples from 1 m source pixels, **not a
  1 m grid or raster**. Values range about 246.8–326.6 m. The viewer
  interpolates between sample nodes and clamps only the narrow frame rim to
  the nearest sampled edge. It does not resolve features smaller than the
  multi-kilometre spacing; these are not surveyed control elevations.

### Optional denser resample

On a network-connected machine with `numpy` and `rasterio` installed:

```sh
python3 scripts/fetch-lawrence-dem.py --nx 160 --ny 160
npm run build:city-subsurface
```

This generates the optional `js/city-dem-grid-lawrence-highres.js`; the shared
viewer prefers it when present and otherwise uses the checked-in 8 × 8 grid.
The local runtime makes no USGS request. The optional resample's cell spacing
is not the source raster resolution, and the script records its retrieval date
and whole-metre rounding in its metadata.

## Verified GNIS records

Only official USGS GNIS rows are seeded in the Lawrence Gazetteer. Coordinates
are returned EPSG:4326 geometry points, not hand-placed city pins. Stream and
lake point records are not complete lines or shoreline polygons.

| Feature | GNIS FEATURE_ID | Class | Returned point (lat, lon) |
| --- | ---: | --- | --- |
| Lawrence | 479145 | Populated Place | 38.971675824, -95.235257697 |
| Kansas River | 485184 | Stream | 39.005563828, -95.247480004 |
| Wakarusa River | 482756 | Stream | 38.911121513, -95.255813797 |
| Lake View Lake | 478818 | Lake | 39.012230227, -95.301647519 |
| Potter Lake | 479154 | Lake | 38.960326979, -95.248737398 |

The source layers are [3 · Populated Places](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/3),
[6 · Streams (Mouth)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/6),
and [7 · Other Hydrographic Features](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/7).
The app seeds no campus, road, airport, rail, utility, cache, or generalized
river-alignment coordinates. Such layers remain available in the shared UI but
should be populated only after an authoritative or well-sourced geometry and
its coordinates are checked.

## Geocache import and license boundary

The shared **LOCAL GPX → GEOCACHE REGISTER** control parses a user-selected
GPX 1.0/1.1 file in the browser. Imported points use `fclass=Geocache`,
`ftt=rec.geocache`, `VERIFIED=0`, and no GNIS ID; only in-frame caches are
plotted, and nothing is uploaded or persisted. The fixed Lawrence register has
no static cache rows.

The 2014 Brand 44 Geomate.jr User's Guide contains a reverse-engineering
prohibition. This GPX path is not permission to inspect `.cry` region files,
the loader, or firmware. Keep Geomate.jr work at public-source research and
user-directed local GPX import unless the user has read that clause and
explicitly authorizes further analysis. No Geomate.jr binary has been
analyzed. See `docs/geomate-jr-firmware-research.md` and
`docs/ghidra-headless-benign-sample-methodology.md`.

## References and source files

- USGS GNIS: [official GNIS overview](https://www.usgs.gov/tools/geographic-names-information-system-gnis) and the National Map MapServer layers linked above.
- USGS 3DEP: [ImageServer metadata](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer?f=pjson); point samples and checked raster metadata are recorded in the source JSON.
- Source files: `data/lawrence/dem-anchors.json`, `resources/city-subsurface/cities.json`, `scripts/build-city-dem-data.mjs`, `scripts/build-city-subsurface.mjs`, `scripts/build-city-subsurface-xdc.mjs`, and `scripts/fetch-lawrence-dem.py`.
