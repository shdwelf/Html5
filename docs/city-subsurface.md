# CITY SUBSURFACE 4Dwm — shared city theaters and geocache source tier

Reconciliation update: **2026-10-08**. The five city apps and shared engine
arrived in merged PR #102; this note records how the useful Lawrence/GNIS/DEM
work from PR #100 fits that system without adding a duplicate Kansas City app.

## Shared app and build

The SoCal Subsurface engine now has five city configurations, each packaged as
its own offline Webxdc:

| City | Page | Data pack | Gazetteer pack | Webxdc |
| --- | --- | --- | --- | --- |
| Lawrence, Kansas | `lawrence-subsurface.html` | `js/city-subsurface-data-lawrence.js` | `js/city-gazetteer-data-lawrence.js` | `lawrence-subsurface.xdc` |
| Atlanta, Georgia | `atlanta-subsurface.html` | `js/city-subsurface-data-atlanta.js` | `js/city-gazetteer-data-atlanta.js` | `atlanta-subsurface.xdc` |
| Kansas City, Missouri | `kansascity-subsurface.html` | `js/city-subsurface-data-kansascity.js` | `js/city-gazetteer-data-kansascity.js` | `kansascity-subsurface.xdc` |
| Buffalo, New York | `buffalo-subsurface.html` | `js/city-subsurface-data-buffalo.js` | `js/city-gazetteer-data-buffalo.js` | `buffalo-subsurface.xdc` |
| Toronto, Ontario | `toronto-subsurface.html` | `js/city-subsurface-data-toronto.js` | `js/city-gazetteer-data-toronto.js` | `toronto-subsurface.xdc` |

There is one shared engine (`js/city-subsurface.js`), one offline Gazetteer
engine (`js/city-gazetteer.js`), one shared GPX importer (`js/gpx-geocache.js`),
and one app shell. `resources/city-subsurface/cities.json` supplies city
configuration; checked-in DEM samples, when available, live in
`data/<city>/dem-anchors.json`.

```sh
node scripts/build-city-dem-data.mjs
node scripts/build-city-subsurface.mjs
node scripts/build-city-subsurface-xdc.mjs
npm run build:city-subsurface     # all three steps
npm run build:4dwm                # includes the shared city build
```

The builders validate gazetteer row shape, frame bounds, and GNIS ID/evidence
tier consistency. A city marked `demRequired` cannot be packaged without a
valid local DEM module. The viewer never makes a runtime terrain-service
request. See `resources/city-subsurface-template.html` for the shared shell.

## SoCal interface parity

Each city keeps the shared Gazetteer, geocache layer, full layer controls,
X-RAY / wireframe / labels / exaggeration controls, orthographic plan view,
HUD, dossier, and local GPX import. Toronto and Buffalo have city-specific
schematic corridors; those are expressly context layers, not surveyed or
operational alignments. Call 811 before touching soil.

## Reconciled evidence and DEM status

### Lawrence, Kansas

The standalone Lawrence viewer from PR #100 is not retained beside the shared
city app. Its useful evidence is integrated into the shared Lawrence config:

- Five verified USGS GNIS records (FEATURE_IDs `479145`, `485184`, `482756`,
  `478818`, and `479154`) use returned EPSG:4326 point geometry. River records
  are multipoints, not river centerlines; lake pins are not shore polygons.
- The curated, unverified Lawrence landmarks and schematic corridors from the
  old standalone app were not copied into the fixed register.
- `data/lawrence/dem-anchors.json` holds the reproducible 8 × 8 USGS 3DEP
  sample grid and source notes. It samples 1 m source rasters at roughly
  1.7 km × 2.2 km spacing; **it is not a 1 m raster**. The shared viewer
  interpolates between samples, clamps only the narrow frame rim, and labels
  the limitations. Lawrence is `demRequired`; the XDC builder fails closed if
  that grid module is absent.

Full Lawrence query notes, coordinates, and optional denser-resample steps are
in [`docs/lawrence-kansas-subsurface.md`](lawrence-kansas-subsurface.md).

### Kansas City, Missouri / Kansas

The existing Kansas City app from PR #102 is retained; no second city app is
created. Its former six unverified/context rows are replaced by eight USGS
GNIS records with checked FEATURE_IDs and returned point coordinates:

| Feature | GNIS FEATURE_ID | Class | Returned point (lat, lon) |
| --- | ---: | --- | --- |
| Kansas City | 748198 | Populated Place | 39.0997335832, -94.5785741344 |
| Missouri River | 756398 | Stream | 39.1238999884, -94.5613514317 |
| Kansas River | 485184 | Stream | 39.1152888843, -94.6105195447 |
| Blue River | 479576 | Stream | 39.1300111950, -94.4707934079 |
| Brush Creek | 479243 | Stream | 39.0389012766, -94.5205171127 |
| Bales Lake | 713599 | Lake | 39.0799759781, -94.5144692796 |
| Lake of the Woods | 758366 | Lake | 38.9952714242, -94.5194206174 |
| Zajic Lake | 729219 | Lake | 39.1925420046, -94.5709122722 |

All rows are marked verified only because they carry the numeric GNIS
`gaz_id`; county-repeated city/river multipoints are identified as such. A pin
is one returned point, never a complete water geometry. The former hand-placed
landmark and generalized Kansas City corridor coordinates were not retained.

The USGS 3DEP exploration for Kansas City used the compact frame
`[-94.74, 38.97, -94.46, 39.23]` and returned 64 samples (8 × 8), about
2.91 km east-west by 3.75 km north-south, with reported values spanning
218.46–325.47 m and source-raster metadata spot checks reporting USGS,
`USGS_3DEP`, and NAVD 88. **Those 64 point values were not saved into the
workspace**, so no Kansas City DEM module is included and no grid has been
reconstructed from the range or synthetic relief. The existing app therefore
continues to show its explicitly labelled synthetic relief field. It must not
be described as a USGS DEM until the point values and their source metadata are
checked into a source register and built as a local module.

### Other city packs

Atlanta, Buffalo, and Toronto retain PR #102's existing packs. Any
non-GNIS/context coordinate stays at its stated evidence tier; no new
coordinates or GNIS IDs were inferred for those cities in this reconciliation.

## Geocache class and local GPX import

Geocaches use a separate evidence tier rather than being quietly mixed with
GNIS:

- `fclass = "Geocache"`, `ftt = "rec.geocache"`, matching the `rec` facet;
- `VERIFIED = 0` always, with no GNIS FEATURE_ID;
- only cache coordinates printed by a public source are bundled; otherwise a
  user imports their own GPX locally.

Two public-coordinate cache rows ship: Buffalo `GCQ1T1` and Toronto `GC7HT4Z`.
Lawrence and Kansas City have no static cache rows. The app can still accept
GPX 1.0/1.1 files (≤ 25 MiB, ≤ 5,000 caches, DOCTYPE refused) in the browser.
Only in-frame cache points are added to the live `rec.geocache` register;
out-of-frame items are counted. **PRESERVATION BAG (.ZIP)** exports the source
GPX unchanged plus normalized XML/JSON, BagIt manifests, and a preservation
event. Nothing is uploaded or written to a Geomate device; imported rows are
session-only. See `docs/geomate-gpx-preservation.md` for scope and privacy
notes.

## Geomate.jr license and analysis boundary

The 2014 Brand 44 Geomate.jr User's Guide contains a clause prohibiting reverse
engineering. The public-source research and local GPX import do not authorize
analysis of its loader, firmware, or encrypted `.cry` region files. Do not
acquire or import those artifacts into Ghidra unless the user has read the
restriction and explicitly directs that work. No Geomate.jr firmware or loader
analysis is claimed. Modern GeoMate Positioning / CHCNav products are a
different product family and are not substitutes for Geomate.jr evidence.

## Sources

- USGS GNIS: [official GNIS overview](https://www.usgs.gov/tools/geographic-names-information-system-gnis) and the National Map [MapServer](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer), especially [layer 3 (Populated Places)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/3), [layer 6 (Streams)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/6), and [layer 7 (Other Hydrographic Features)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/7). The city-config row notes retain IDs and geometry limitations.
- USGS 3DEP: [ImageServer metadata](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer?f=pjson) and `getSamples`; Lawrence's sample register is `data/lawrence/dem-anchors.json`. Kansas City's exploratory sample values were not persisted, as disclosed above.
- Geomate.jr: 2014 [Brand 44 User's Guide](https://www.homesciencetools.com/content/reference/Geomatejr_Users_Guide.pdf); see `docs/geomate-jr-firmware-research.md` for the research disposition and license caveat.
- Local GPX import and BagIt preservation: `docs/geomate-gpx-preservation.md`, `js/gpx-geocache.js`, and `tests/city-subsurface.test.mjs`.
