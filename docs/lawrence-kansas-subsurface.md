# LAWRENCE SUBSURFACE 4Dwm — Lawrence, Kansas

The Lawrence cut carries the SoCal Subsurface **4Dwm shell and offline
Gazetteer interaction model** into a city-specific frame. It does not copy
Southern California-only aqueduct, pipeline, fire, FCC-radio, or satellite
content into Kansas. Its checked-in content is intentionally small: the local
USGS 3DEP elevation sample grid, five verified USGS GNIS feature records, and
an optional user-selected GPX file.

## Build and test

```sh
node scripts/build-lawrence-dem-data.mjs
node scripts/build-lawrence-subsurface-xdc.mjs
node --test tests/lawrence-subsurface.test.mjs
```

Or run `npm run build:lawrence-subsurface` (the XDC build runs the data-module
generator automatically). The deterministic Webxdc archive is
`lawrence-subsurface.xdc`; its staged offline copy is under
`public/apps/lawrence-subsurface/`. `npm run build:4dwm` includes this XDC.

To preview the static app from the repository, open
`lawrence-subsurface.html`; the main SITE-K dock links to
`/apps/lawrence-subsurface/` after the app bundle has been built.

## Elevation source and honest resolution

- Frame: `[-95.31, 38.88, -95.15, 39.04]` in longitude/latitude order.
- Source service: [USGS 3DEP ImageServer `getSamples`](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples).
- Retrieval date: 2026-10-08.
- Method: `esriGeometryEnvelope`, `sampleCount=64`,
  `returnFirstValueOnly=true`, bilinear image-service sampling. The service
  returned a regular **8 × 8** set of locations at `0.02°` intervals: about
  `1.7 km` east-west and `2.2 km` north-south at Lawrence's latitude.
- The service reported `resolution=1` on these points. Source-metadata spot
  checks reported `Source=USGS`, `ProductName=USGS_3DEP`, and
  `VerticalDatum=North American Vertical Datum of 1988 (NAVD 88)`; sampled
  project rasters include `KS_SCentral_L1_2015` and
  `KS_Statewide_2018_A18`. See `metadataSpotChecks` in
  `data/lawrence/dem-anchors.json` for the exact four coordinates and raster
  IDs.
- The committed 8 × 8 values are **sparse samples from 1 m source pixels**, not
  a 1 m raster. The viewer bilinearly interpolates between sample points; it
  cannot show terrain features smaller than the multi-kilometre sample spacing.
  The grid range is about **246.8–326.6 m**. Vertical exaggeration is an
  interactive display parameter, not a change to the stored elevations.
- USGS says 3DEP products vary by area and resolution, vertical datum is
  typically NAVD88, and EPQS/3DEP point values are not surveyed control
  elevations: [USGS DEM datum/resolution FAQ](https://www.usgs.gov/faqs/what-projection-horizontal-datum-vertical-datum-and-resolution-a-usgs-digital-elevation-model),
  [USGS point-query accuracy FAQ](https://www.usgs.gov/faqs/how-accurate-are-elevations-generated-elevation-point-query-service-national-map).

The compact source register is `data/lawrence/dem-anchors.json`; its generated
browser module is `js/lawrence-dem-data.js`. The viewer labels the coarse grid
as such. It does not claim to have a seamless, clipped, full-resolution DEM.

### Optional denser resample

On a network-connected machine with `numpy` and `rasterio` installed:

```sh
python3 scripts/fetch-lawrence-dem.py --nx 160 --ny 160
node scripts/build-lawrence-subsurface-xdc.mjs
```

This requests a compact USGS 3DEP ImageServer GeoTIFF covering the same frame,
reprojects/crops it to the stated bounds, and writes the optional
`js/lawrence-dem-grid.js`. When present, the viewer loads that **local file**
before creating the terrain. The XDC builder follows the import and packs the
optional module. The app makes no external service request at runtime; it only
loads the optional grid as a same-origin asset if the file is present. The
checked-in archive uses the sparse grid; the optional raster module is generated
material and is not checked into the repository.

## Gazetteer rows

The checked-in feature rows come from the official USGS National Map Gazetteer
ArcGIS service refreshed October 2026. In the local data file, the service's
`gaz_id` is retained as the GNIS FEATURE_ID; coordinates are returned geometry
in EPSG:4326. Every included feature has a non-null, service-verified ID:

| Feature | GNIS ID | Class | Returned point (lat, lon) | Geometry note |
| --- | ---: | --- | --- | --- |
| Lawrence | 479145 | Populated Place | 38.971675824, -95.235257697 | GNIS gives a two-point multipoint; this row uses one point inside the frame. |
| Kansas River | 485184 | Stream | 39.005563828, -95.247480004 | Representative returned Douglas County point; not a river line. |
| Wakarusa River | 482756 | Stream | 38.911121513, -95.255813797 | Representative returned Douglas County point; not a channel trace. |
| Lake View Lake | 478818 | Lake | 39.012230227, -95.301647519 | Returned GNIS point near the frame edge. |
| Potter Lake | 479154 | Lake | 38.960326979, -95.248737398 | Returned GNIS point. |

The corresponding query layers are [3 · Populated Places](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/3),
[6 · Streams (Mouth)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/6),
and [7 · Other Hydrographic Features](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/7).
For reproducibility, the checked-in rows retain a query URL in their metadata.
A pin denotes the GNIS record's point or selected point within its multipoint;
it is not the complete geometry of a stream or lake.

There are currently no community/context seed rows and no transportation,
campus, road, or utility alignments. Those layers should only be added after
an authoritative or well-sourced geometry and its coordinates are checked.
No fake GNIS IDs or geocache coordinates are seeded. User GPX cache waypoints
are parsed locally, tagged `GNIS FEATURE_ID=null`, never uploaded, and not
persisted between reloads.

## Interface and layers

The app reuses the SoCal family’s WebGL stage, draggable/minimizable PiP
windows, HUD, evidence legend, fuzzy Gazetteer `search-name`, FTT facets,
`search-box` over the camera view, dossier, X-RAY / wireframe / labels controls,
and local GPX import. Its city-specific layer checkboxes are:

- USGS 3DEP terrain surface;
- GNIS populated-place pins;
- GNIS streams and lakes (point records only);
- user-imported GPX geocaches;
- schematic subsurface datum (no utilities are plotted);
- coordinate reference grid.

## Provenance notes

- USGS GNIS: [official GNIS overview](https://www.usgs.gov/tools/geographic-names-information-system-gnis) and the linked National Map ArcGIS query service above.
- USGS 3DEP: [ImageServer metadata](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer?f=pjson) reports the service's available-data date and its dynamic 3DEP DEM function; point-value and source-raster details are captured in the source register.
- Source-control and interpolation code: `data/lawrence/dem-anchors.json`, `js/lawrence-dem-data.js`, `js/lawrence-geo.js`, `scripts/build-lawrence-dem-data.mjs`, and `scripts/fetch-lawrence-dem.py`.
