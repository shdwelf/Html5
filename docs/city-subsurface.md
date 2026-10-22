# CITY SUBSURFACE 4Dwm — shared city theaters and geocache source tier

Reconciliation update: **2026-10-08**. The five city apps and shared engine
arrived in merged PR #102; this note records how the useful Lawrence/GNIS/DEM
work from PR #100 fits that system without adding a duplicate Kansas City app.

Round 15 update: **2026-10-22**. A sixth frame, `california`, applies the same
parametric build at statewide scale (backlog stream S4); see the California
section below.

Round 16 update: **2026-10-22**. California now carries a 16-row per-ID GNIS
extract beside its retained curated rows, and `nevada` and `arizona` join as
the seventh and eighth configurations. The machine-readable evidence for the
new verified state rows is
[`resources/city-subsurface/gnis-state-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-source-register-2026-10-22.json).

## Shared app and build

The SoCal Subsurface engine now has eight configurations — five cities and
three statewide frames — each packaged as its own offline Webxdc:

| City | Page | Data pack | Gazetteer pack | Webxdc |
| --- | --- | --- | --- | --- |
| Lawrence, Kansas | `lawrence-subsurface.html` | `js/city-subsurface-data-lawrence.js` | `js/city-gazetteer-data-lawrence.js` | `lawrence-subsurface.xdc` |
| Atlanta, Georgia | `atlanta-subsurface.html` | `js/city-subsurface-data-atlanta.js` | `js/city-gazetteer-data-atlanta.js` | `atlanta-subsurface.xdc` |
| Kansas City, Missouri | `kansascity-subsurface.html` | `js/city-subsurface-data-kansascity.js` | `js/city-gazetteer-data-kansascity.js` | `kansascity-subsurface.xdc` |
| Buffalo, New York | `buffalo-subsurface.html` | `js/city-subsurface-data-buffalo.js` | `js/city-gazetteer-data-buffalo.js` | `buffalo-subsurface.xdc` |
| Toronto, Ontario | `toronto-subsurface.html` | `js/city-subsurface-data-toronto.js` | `js/city-gazetteer-data-toronto.js` | `toronto-subsurface.xdc` |
| California (statewide) | `california-subsurface.html` | `js/city-subsurface-data-california.js` | `js/city-gazetteer-data-california.js` | `california-subsurface.xdc` |
| Nevada (statewide) | `nevada-subsurface.html` | `js/city-subsurface-data-nevada.js` | `js/city-gazetteer-data-nevada.js` | `nevada-subsurface.xdc` |
| Arizona (statewide) | `arizona-subsurface.html` | `js/city-subsurface-data-arizona.js` | `js/city-gazetteer-data-arizona.js` | `arizona-subsurface.xdc` |

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
request. Optional DEM packs are loaded through the engine's variable-
specifier `importDem()` helper: a missing optional pack rejects into the
labelled synthetic-relief fallback at runtime instead of failing Vite's
static import transform during development. The XDC builder explicitly scans
`importDem()` calls, so an existing DEM pack is still collected into the
offline bundles. The shared city test also parses `js/city-subsurface.js` as
an ES module with `node --check`; bundle byte-currency alone would not catch
an engine syntax error because the data-pack tests do not boot the browser
scene. See `resources/city-subsurface-template.html` for the shared shell.

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

### California statewide frame (rounds 15–16, 2026-10-22)

Backlog stream S4 asked for a California viewer. Rather than a one-off page,
California ships as the sixth configuration of this parametric system, with a
statewide bounding frame (lon −124.48…−114.13, lat 32.53…42.01). Two small
scale fixes were required, both written so existing city frames are provably
unchanged (rebuilding all cities after the change produces zero diff on the
five existing data packs):

- `viewsFor` in `scripts/build-city-subsurface.mjs` now pulls the overview
  and underground cameras back with frame width (`max(20, w·0.45)` /
  `max(32, w·0.7)`); at city scale the floors reproduce the old constants.
- Fog range in `js/city-subsurface.js` scales with the frame diagonal
  (`max(45, d·0.55)` / `max(130, d·1.9)`); at city scale it is the old 45/130.

**Two evidence tiers, kept separate.** Round 15 shipped sixteen sourced
starter rows, all `VERIFIED=0`. Round 16 upgrades five of those rows where a
per-ID GNIS record denotes the same feature, adds eleven more identity-safe
GNIS point records, and leaves the other eleven cultural/landmark rows
`VERIFIED=0` with their named public sources. The generated register is
therefore 27 rows: **16 verified and 11 curated**. It must not be described
as a wholly GNIS-verified California gazetteer.

The verified extract is:

| Feature | GNIS FEATURE_ID | Class | Stored point (lat, lon) | Point basis |
| --- | ---: | --- | --- | --- |
| Los Angeles | 1662328 | Populated Place | 34.0522390563, −118.2436970875 | MapServer layer 3 multipoint |
| San Francisco | 277593 | Populated Place | 37.77500494, −122.41945762 | MapServer layer 3 multipoint |
| Sacramento | 1659564 | Populated Place | 38.58157698, −121.49441277 | MapServer layer 3 multipoint |
| San Diego | 1661377 | Populated Place | 32.71533396, −117.157267 | MapServer layer 3 multipoint |
| Oakville | 229899 | Populated Place | 38.4368599, −122.40221399 | MapServer layer 3 multipoint |
| Manzanar (locality) | 1659050 | Populated Place | 36.73993695, −118.08065811 | MapServer layer 3 returned point |
| Mount Whitney | 269051 | Summit | 36.57857512, −118.29243423 | MapServer layer 5 returned point |
| Mount Shasta | 266054 | Summit | 41.40917524, −122.19485877 | MapServer layer 5 returned point |
| Death Valley | 270787 | Basin | 36.24662318, −116.81700764 | MapServer layer 5 multipoint |
| Sacramento River | 1654949 | Stream | 38.0632528, −121.8527357 | Domestic Names sequence 1; MapServer layer-6 attributes also checked |
| San Joaquin River | 273488 | Stream | 38.06659111, −121.85108216 | MapServer layer 6 multipoint |
| Russian River | 267200 | Stream | 38.45047475, −123.1294616 | MapServer layer 6 multipoint |
| Lake Tahoe | 1654975 | Lake | 39.0960755, −120.0333974 | Domestic Names sequence 1 + Geocoder |
| Salton Sea | 248771 | Lake | 33.313568, −115.816772 | Domestic Names sequence 1 + Geocoder |
| Morris Reservoir | 272561 | Reservoir | 34.183909, −117.870436 | Domestic Names sequence 1 + Geocoder |
| Tule Lake | 268456 | Swamp | 41.890068, −121.5057865 | Domestic Names sequence 1 + Geocoder |

For multipoints the stored value is the first returned point identified in
the row note. For detail-record rows it is coordinate sequence 1, the GNIS
primary point. Neither representation is a boundary, shoreline, peak-area
polygon, basin outline, or river centerline.

The identity traps are part of the contract. `Manzanar` 1659050 is the
locality, not the National Historic Site; `Morris Reservoir` 272561 is not
the Morris Dam structure; and `Tule Lake` 268456 is the swamp/marsh, not the
War Relocation Center. The historic-site, dam, and relocation-center rows stay
`VERIFIED=0`. So do UC Berkeley, UCLA, Empire Mine State Historic Park, Nike
Site SF-88L, La Casa Pacifica, Stow House, Clair Tappaan Lodge, and Aerojet.
That is deliberate: the current GNIS Domestic Names service omits multiple
feature classes archived in 2021 (including school, park, mine, and dam), and
this round did not substitute an undated or non-reproducible third-party ID.

One service discrepancy is recorded rather than hidden. During the
2026-10-22 check, the current cartographic GNIS hydro layers did not return
the active Lake Tahoe, Salton Sea, or Los Angeles County Morris Reservoir
records, while their Domestic Names detail pages and matching USGS Geocoder
primary points did. Their row notes therefore cite Domestic Names + Geocoder,
not MapServer geometry. The Colorado River record (`45730`) was not seeded
in any of the three state frames because its returned primary point lies
south of their bounding boxes; it appears only as generalized corridor
context in Nevada and Arizona.

**Planned layers, not data rows.** Several S4 categories are ephemeral or
commercial (factory outlet centers, Renaissance faire sites, Red Cross /
evacuation points, seasonal events). Coordinates for those churn and go
stale; they are catalogued here as planned context layers for a future data
round with a dated source register, and are deliberately **not** seeded as
gazetteer rows. The same applies to bulk themes named in the brief (Nike
sites statewide, UC/CSU campuses beyond the two anchors, mine-map coverage
beyond Empire Mine, ranchos beyond Rancho La Patera): exemplar first,
bulk import only with per-row sources.

**Schematic context.** Coastline, nine relief gaussians (Sierra Nevada,
Cascades, Coast Ranges, Transverse/Peninsular Ranges, Central Valley,
Death Valley trough, …), and three corridors (El Camino Real / US-101,
California Aqueduct, Overland Route via Donner Pass) are generalized
sketches at the `context` tier, not surveyed geometry. Terrain is the
labelled synthetic RELIEF field — no California DEM is bundled, and the
frame is a rectangle, not a state outline. `tests/city-subsurface.test.mjs`
pins the exact 16-row verified set, the 11-row unverified set, the three
same-name non-upgrades (Manzanar, Morris, Tule Lake), synchronization with
the JSON source register, and the scale-aware views.

### Nevada and Arizona statewide frames (round 16, 2026-10-22)

Nevada and Arizona reuse the California recipe—config block, three loader
entries, generated packs, Webxdc, and contract tests—but start from a stricter
register: every seeded row is a per-ID GNIS record. Candidate discovery used
the USGS GNIS Geocoder in its documented fuzzy-suggestion role; a result was
accepted only when official name, returned type, state, primary county,
`GnisId`, and primary point all matched the intended feature. Similar
divisions, colonies, reservations, census places, and same-name features of
the wrong class were rejected. The stored coordinate is the returned GNIS
primary point and each note states what that point is not.

**Nevada** spans lon −120.03…−113.95, lat 34.88…42.03. Its 12 rows are
Carson City (`863976`), Reno (`861100`), Las Vegas (`847388`), Elko
(`845452`), Winnemucca (`844996`), Ely (`859671`), Tonopah (`845985`),
Pyramid Lake (`856349`), Walker Lake (`844615`; the lake, not the populated
place `854682`), Humboldt River (`860071`), Boundary Peak (`857652`), and
Wheeler Peak (`861956`). Four `context` corridors sketch the Overland
Route/Interstate 80, Humboldt River, US-95, and the Colorado River border
reach. Carson City uses the populated-place record, not the separate
county-equivalent record `863219`.

**Arizona** spans lon −114.82…−109.05, lat 31.33…37.01. Its 12 rows are
Phoenix (`44784`), Tucson (`43534`), Flagstaff (`29046`), Yuma (`14111`),
Prescott (`33189`), Kingman (`6704`), Salt River (`33995`; the stream, not
the populated place `44982`), Gila River (`42838`), Verde River (`35768`),
Humphreys Peak (`30290`), Mount Graham (`5204`), and Grand Canyon (`23907`;
the GNIS Valley landform, not the populated place `5213`). Four `context`
corridors sketch the Colorado River border, the Gila River, Interstate
40/Route 66, and Interstate 17. The Grand Canyon primary point is in the
western canyon in Mohave County; it is not a park boundary or visitor-center
location.

Neither state frame includes a DEM. Both use labelled synthetic relief
gaussians, generalized corridor polylines, and rectangular frames—not terrain
rasters, surveyed routes, or state-boundary clipping masks. Both omit a
Colorado River gazetteer row for the same out-of-frame primary-point reason
recorded for California.

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

- USGS GNIS: [official GNIS overview](https://www.usgs.gov/tools/geographic-names-information-system-gnis) and the National Map [MapServer](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer), especially [layer 3 (Populated Places)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/3), [layer 5 (Landforms)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/5), [layer 6 (Streams)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/6), and [layer 7 (Other Hydrographic Features)](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/7). The city-config row notes retain IDs and geometry limitations.
- USGS 3DEP: [ImageServer metadata](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer?f=pjson) and `getSamples`; Lawrence's sample register is `data/lawrence/dem-anchors.json`. Kansas City's exploratory sample values were not persisted, as disclosed above.
- Geomate.jr: 2014 [Brand 44 User's Guide](https://www.homesciencetools.com/content/reference/Geomatejr_Users_Guide.pdf); see `docs/geomate-jr-firmware-research.md` for the research disposition and license caveat.
- Local GPX import and BagIt preservation: `docs/geomate-gpx-preservation.md`, `js/gpx-geocache.js`, and `tests/city-subsurface.test.mjs`.
- California starter rows (round 15): per-row notes in `js/city-gazetteer-data-california.js` name the source for every retained unverified coordinate — Wikipedia article infoboxes, the [US EPA TRI facility profile](https://enviro.epa.gov/triexplorer/transfer_fac_profile?tri=95670RJTGNAEROJ&trilib=TRIQ1&year=2001) for Aerojet Sacramento Operations (38.642, −121.169), the EPA Superfund profile for site CAD980358832, and Clair Tappaan Lodge's published location data; all retrieved 2026-10-22.
- Round-16 state GNIS records: [`resources/city-subsurface/gnis-state-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-source-register-2026-10-22.json) records the service endpoints, selection rules, all 40 verified California/Nevada/Arizona state-frame rows, and the identity rejections/exclusions. In addition to GNIS MapServer, the checks used the [USGS GNIS Geocoder endpoint](https://dashboard.waterdata.usgs.gov/service/geocoder/get/location/1.0) and the GNIS Domestic Names per-ID record route (`https://edits.nationalmap.gov/apps/gaz-domestic/public/search/names/{featureId}`). The Geocoder was treated as a fuzzy candidate service, never as an unfiltered bulk import.
