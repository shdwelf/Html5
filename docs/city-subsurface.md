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

Round 17 update: **2026-10-22**. `guam`, `americansamoa`, `usvirginislands`,
and `midway` join as the ninth through twelfth configurations. They required
the shared engine to become hemisphere-aware (east longitude for Guam, south
latitude for American Samoa) and to render either one coastline polyline or
several disconnected island polylines. Their machine-readable evidence is
[`resources/city-subsurface/gnis-territory-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-territory-source-register-2026-10-22.json).

Round 18 update: **2026-10-22**. `utah`, `colorado`, and `newmexico` join as
the thirteenth through fifteenth configurations, completing the Four Corners
state set beside Arizona. Each starts with twelve all-GNIS `VERIFIED=1` rows.
Their machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json).

Round 20 update: **2026-10-23**. `oregon`, `washington`, and `idaho` join as
the sixteenth through eighteenth configurations. Each starts with twelve
all-GNIS `VERIFIED=1` rows in the same identity-safe starter-register form.
Their machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json).

Round 21 update: **2026-10-23**. `montana` and `wyoming` join as the
nineteenth and twentieth configurations. Each starts with twelve all-GNIS
`VERIFIED=1` rows; Granite Peak and Jackson Lake additionally carry GNIS
Domestic Names per-ID detail checks. Their machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json).

Round 22 update: **2026-10-23**. `northdakota` and `southdakota` join as
the twenty-first and twenty-second configurations. Each starts with twelve
all-GNIS `VERIFIED=1` rows; White Butte and Black Elk Peak additionally
carry GNIS Domestic Names per-ID detail checks. Their machine-readable
evidence is
[`resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json).

Round 23 update: **2026-10-23**. `nebraska` and `kansas` join as the
twenty-third and twenty-fourth configurations. Each starts with twelve
all-GNIS `VERIFIED=1` rows; Panorama Point and Mount Sunflower additionally
carry GNIS Domestic Names per-ID detail checks (both state high points,
with the per-ID “highest elevation” descriptions preserved in their
notes). Their machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json).

Round 24 update: **2026-10-23**. `oklahoma` and `texas` join as the
twenty-fifth and twenty-sixth configurations. Each starts with twelve
all-GNIS `VERIFIED=1` rows; Guadalupe Peak additionally carries a GNIS
Domestic Names per-ID detail check (Texas high point, “8749 feet”), and
the returned Red River record was reviewed per-ID and rejected because
its Brown County sequences do not identify the intended border reach.
Texas ships a labelled generalized Gulf coast line. Their machine-readable
evidence is
[`resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json).

Round 25 update: **2026-10-23**. `iowa` and `missouri` join as the
twenty-seventh and twenty-eighth configurations. Each starts with twelve
all-GNIS `VERIFIED=1` rows; Hawkeye Point and Taum Sauk Mountain
additionally carry GNIS Domestic Names per-ID detail checks (both state
high points, “1670 feet” and “1772 feet”). Missouri carries the first
statewide Missouri River row after six empty upstream state screens, and
the St./Saint spelling gates for Saint Louis and Saint Joseph are recorded.
Their machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json).

Round 26 update: **2026-10-23**. `minnesota` and `louisiana` join as the
twenty-ninth and thirtieth configurations, closing the West North Central
division and opening the Gulf thread. Each starts with twelve all-GNIS
`VERIFIED=1` rows; Eagle Mountain and Driskill Mountain additionally carry
GNIS Domestic Names per-ID detail checks (“2301 feet” disambiguated from
two undesignated same-name summits, and “535 feet”), Lake of the Woods
carries a Board-decision per-ID check, Louisiana seeds the **first
statewide Mississippi River row** (Plaquemines) after three distinct state
screen failures, and the Red River chain closes at the West Feliciana
record. Louisiana ships a labelled generalized Gulf coast line. Their
machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json).

Round 27 update: **2026-10-23**. `mississippi` and `alabama` join as the
thirty-first and thirty-second configurations, opening the Gulf state pair
east of Texas. Each starts with twelve all-GNIS `VERIFIED=1` rows;
Woodall Mountain and Cheaha Mountain additionally carry GNIS Domestic
Names per-ID detail checks (“806 feet” and “2407 feet”), Guntersville Lake
and Wheeler Lake carry decision-card per-ID checks that resolve a parallel
duplicate and a separate same-name lake, and both frames ship labelled
generalized Gulf coast lines. The Mississippi main stem stays corridor-only
in its own state after a fifth empty/mismatched screen, and Tombigbee
seeds only in Alabama. Their machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json).

Round 28 update: **2026-10-23**. `georgia` joins as the
thirty-third configuration, opening the South Atlantic seaboard east of
Alabama. It starts with twelve all-GNIS `VERIFIED=1` rows; Brasstown Bald
additionally carries a GNIS Domestic Names per-ID detail check
(“Highest elevation in GA at 4784 feet” via the official
`gaznames_default` REST layer), Lake Oconee carries a two-record
per-ID tie-break seeded on the Rockville locator description, and the
frame ships a labelled generalized Atlantic coast line. The Savannah
River screen returned an empty array (the national screen surfaces only
the South Carolina record), Lake Lanier screened as a populated place
only, and the Chattahoochee record is held to starter scope with its
FEATURE_ID kept in the corridor. Its machine-readable evidence is
[`resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json).

## Shared app and build

The SoCal Subsurface engine now has thirty-three configurations — five cities,
twenty-four statewide frames, and four territory/atoll frames — each packaged as
its own offline Webxdc:

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
| Guam | `guam-subsurface.html` | `js/city-subsurface-data-guam.js` | `js/city-gazetteer-data-guam.js` | `guam-subsurface.xdc` |
| American Samoa (Tutuila–Manuʻa) | `americansamoa-subsurface.html` | `js/city-subsurface-data-americansamoa.js` | `js/city-gazetteer-data-americansamoa.js` | `americansamoa-subsurface.xdc` |
| U.S. Virgin Islands | `usvirginislands-subsurface.html` | `js/city-subsurface-data-usvirginislands.js` | `js/city-gazetteer-data-usvirginislands.js` | `usvirginislands-subsurface.xdc` |
| Midway Atoll | `midway-subsurface.html` | `js/city-subsurface-data-midway.js` | `js/city-gazetteer-data-midway.js` | `midway-subsurface.xdc` |
| Utah (statewide) | `utah-subsurface.html` | `js/city-subsurface-data-utah.js` | `js/city-gazetteer-data-utah.js` | `utah-subsurface.xdc` |
| Colorado (statewide) | `colorado-subsurface.html` | `js/city-subsurface-data-colorado.js` | `js/city-gazetteer-data-colorado.js` | `colorado-subsurface.xdc` |
| New Mexico (statewide) | `newmexico-subsurface.html` | `js/city-subsurface-data-newmexico.js` | `js/city-gazetteer-data-newmexico.js` | `newmexico-subsurface.xdc` |
| Oregon (statewide) | `oregon-subsurface.html` | `js/city-subsurface-data-oregon.js` | `js/city-gazetteer-data-oregon.js` | `oregon-subsurface.xdc` |
| Washington (statewide) | `washington-subsurface.html` | `js/city-subsurface-data-washington.js` | `js/city-gazetteer-data-washington.js` | `washington-subsurface.xdc` |
| Idaho (statewide) | `idaho-subsurface.html` | `js/city-subsurface-data-idaho.js` | `js/city-gazetteer-data-idaho.js` | `idaho-subsurface.xdc` |
| Montana (statewide) | `montana-subsurface.html` | `js/city-subsurface-data-montana.js` | `js/city-gazetteer-data-montana.js` | `montana-subsurface.xdc` |
| Wyoming (statewide) | `wyoming-subsurface.html` | `js/city-subsurface-data-wyoming.js` | `js/city-gazetteer-data-wyoming.js` | `wyoming-subsurface.xdc` |
| North Dakota (statewide) | `northdakota-subsurface.html` | `js/city-subsurface-data-northdakota.js` | `js/city-gazetteer-data-northdakota.js` | `northdakota-subsurface.xdc` |
| South Dakota (statewide) | `southdakota-subsurface.html` | `js/city-subsurface-data-southdakota.js` | `js/city-gazetteer-data-southdakota.js` | `southdakota-subsurface.xdc` |
| Nebraska (statewide) | `nebraska-subsurface.html` | `js/city-subsurface-data-nebraska.js` | `js/city-gazetteer-data-nebraska.js` | `nebraska-subsurface.xdc` |
| Kansas (statewide) | `kansas-subsurface.html` | `js/city-subsurface-data-kansas.js` | `js/city-gazetteer-data-kansas.js` | `kansas-subsurface.xdc` |
| Oklahoma (statewide) | `oklahoma-subsurface.html` | `js/city-subsurface-data-oklahoma.js` | `js/city-gazetteer-data-oklahoma.js` | `oklahoma-subsurface.xdc` |
| Texas (statewide) | `texas-subsurface.html` | `js/city-subsurface-data-texas.js` | `js/city-gazetteer-data-texas.js` | `texas-subsurface.xdc` |
| Iowa (statewide) | `iowa-subsurface.html` | `js/city-subsurface-data-iowa.js` | `js/city-gazetteer-data-iowa.js` | `iowa-subsurface.xdc` |
| Missouri (statewide) | `missouri-subsurface.html` | `js/city-subsurface-data-missouri.js` | `js/city-gazetteer-data-missouri.js` | `missouri-subsurface.xdc` |
| Minnesota (statewide) | `minnesota-subsurface.html` | `js/city-subsurface-data-minnesota.js` | `js/city-gazetteer-data-minnesota.js` | `minnesota-subsurface.xdc` |
| Louisiana (statewide) | `louisiana-subsurface.html` | `js/city-subsurface-data-louisiana.js` | `js/city-gazetteer-data-louisiana.js` | `louisiana-subsurface.xdc` |
| Mississippi (statewide) | `mississippi-subsurface.html` | `js/city-subsurface-data-mississippi.js` | `js/city-gazetteer-data-mississippi.js` | `mississippi-subsurface.xdc` |
| Alabama (statewide) | `alabama-subsurface.html` | `js/city-subsurface-data-alabama.js` | `js/city-gazetteer-data-alabama.js` | `alabama-subsurface.xdc` |
| Georgia (statewide) | `georgia-subsurface.html` | `js/city-subsurface-data-georgia.js` | `js/city-gazetteer-data-georgia.js` | `georgia-subsurface.xdc` |

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

The builders validate gazetteer row shape, frame bounds, GNIS ID/evidence
tier consistency, and coastline shape. `coast` remains backward-compatible:
existing frames may supply one polyline of `[lon, lat]` points, while island
frames may supply an array of disconnected polylines. The shared detail and
HUD coordinate formatters select `N/S` and `E/W` from the numeric signs rather
than assuming the northern/western hemispheres. A city marked `demRequired`
cannot be packaged without a valid local DEM module. The viewer never makes a runtime terrain-service
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

### Territory and Midway frames (round 17, 2026-10-22)

The four territory frames use the stricter Nevada/Arizona rule: every seeded
row is an identity-safe per-ID GNIS record. The USGS GNIS Geocoder was used
as the discovery service, and a row was accepted only when exact official
name, returned grouped Type, state/territory, returned county or district,
FEATURE_ID, and primary point all matched. The grouped Geocoder Type is
preserved in each note while the gazetteer class uses the corresponding GNIS
feature class (`Cities & Populated Places` → `Populated Place`, `Islands` →
`Island`, `Bays & Harbors` → `Bay`, `Streams & Canals` → `Stream`). `Bay`,
`Island`, and `Civil` now have explicit metadata in `js/city-gazetteer.js`.
The territory JSON register reproduces every generated row byte-semantically
and is pinned by `tests/city-subsurface.test.mjs`.

**Guam** spans lon 144.58…144.99, lat 13.22…13.69. Its 12 rows are Guam
Island (`1389704`), Hagåtña (`1389443`), Dededo (`1389637`), Tamuning
(`1390090`), Yigo (`1390188`), Mangilao (`2414264`), Barrigada (`1389569`),
Santa Rita (`1390020`), Inarajan (`1389737`), Mount Lamlam (`1389785`), Apra
Harbor (`1389489`), and Talofofo River (`1390088`). Hagåtña is deliberately
labelled **Civil**: GNIS Domestic Names and MapServer layer 1 both return
`Class=Civil` for 1389443. It must not be described as a GNIS populated-place
record or a municipal polygon. Hagåtña CDP 2414024, Hagatna Election District
1927061, and West Hagåtña Beach 1948047 are different records. Mangilao and
Santa Rita populated places likewise use their populated-place IDs, not the
separate election-district/CDP records returned in the same searches.

**American Samoa** is explicitly a **Tutuila–Manuʻa frame**, lon
−170.88…−169.37, lat −14.42…−14.10. Its 12 rows are Pago Pago (`1389119`),
Fagatogo (`1388792`), Tāfuna (`1669450`), Nuʻuuli (`1389088`), Leone
(`1388922`), Ofu (`1389091`), Olosega (`1389103`), Ta‘ū (`1389249`), Tutuila
Island (`1389316`), Pago Pago Harbor (`1389120`), Matafao Peak (`1389004`),
and Lata Mountain (`1388875`). Distant **Swains Island and Rose Atoll are
omitted**; the subtitle, register, docs, and tests all say so. A full
political-extent rectangle would have been mostly ocean and would have made
the inhabited groups harder to read, but this frame must never be presented
as the territory's full extent. Tutuila Island preserves the Geocoder's
returned Eastern District county value for that record; that is record
provenance, not a claim that the whole island lies in one district. The
official name for the high point commonly called Mount Lata is returned as
**Lata Mountain**.

**U.S. Virgin Islands** spans lon −65.12…−64.52, lat 17.65…18.44. Its 12
rows are Charlotte Amalie (`1613808`), Christiansted (`1613811`),
Frederiksted (`1613945`), Cruz Bay populated place (`1613859`), Cruz Bay Bay
(`1613858`), Water Island (`1614413`), Buck Island (`1613753`), Crown
Mountain (`1613857`), Bordeaux Mountain (`1613741`), Mount Eagle (`1613894`),
Magens Bay (`1614115`), and Christiansted Harbor (`1613812`). Cruz Bay is an
intentional same-name pair in two classes. Buck Island is the Saint Croix
record, not the Saint Thomas same-name record 1613754. Exact searches for
Saint Thomas/Saint John/Saint Croix “Island” returned political-division
records rather than physical Island records, so those political records were
not mislabeled as island landforms.

**Midway** spans lon −177.44…−177.29, lat 28.175…28.245. Its six rows are
Midway Islands (`1393085`), Sand Island (`1393170`), Eastern Island
(`1393009`), Welles Harbor (`1393264`), Seward Roads (`1393174`), and Frigate
Point (`1393020`). The Geocoder returns `State=null` for Midway, and a
`states=UM` filter returned no suggestions during the 2026-10-22 check;
accepted rows therefore came from exact-name **bounded queries** using
`latitudeMin`, `longitudeMin`, `latitudeMax`, and `longitudeMax`. Midway
Islands uses the Islands record, not political-division record 1802699 at the
same point. Eastern Island 1393009 is the Midway record, not same-name U.S.
Minor Outlying Islands record 1390268 far outside the frame. Spit Island,
Midway Lagoon, Brooks Channel, and Henderson Field were not seeded because
the bounded exact-name queries returned no matching GNIS records; lagoon,
reef, and channel lines remain generalized `context` corridors only.

No territory frame bundles a DEM. Relief is a labelled synthetic gaussian
field, the frame is rectangular, and all coastlines are generalized
orientation lines—two lines for Guam/Cocos, five for Tutuila/Aunuʻu/Ofu/
Olosega/Ta‘ū, five for the U.S. Virgin Islands, and three for Midway. They are
not shoreline surveys, territorial boundaries, ferry routes, or navigation
data. Scene nodes reuse their gazetteer GNIS points exactly, a contract the
test checks rather than a convention left to inspection.

### Utah, Colorado, and New Mexico statewide frames (round 18, 2026-10-22)

The second state batch completes the Four Corners set. It uses the strict
Nevada/Arizona recipe: candidate discovery through the USGS GNIS Geocoder,
acceptance only on an exact official name, compatible returned type, state,
returned primary county, permanent FEATURE_ID, and returned primary point.
The JSON batch register preserves the Geocoder type/county for every row and
reproduces the generated gazetteer rows exactly. Current `tests/city-subsurface.test.mjs`
pins that synchronization, scene-node reuse of GNIS points, loader entries,
and the exclusions below.

**Utah** spans lon −114.25…−108.85, lat 36.95…42.05—a rectangular frame
with modest visual margins around the state, not a boundary mask. Its 12
rows are Salt Lake City (`1454997`), Provo (`1444661`), Ogden (`1444049`),
Saint George (`1455098`), Moab (`1430389`), Logan (`1442849`), Great Salt
Lake (`1441459`), Utah Lake (`1446894`), Green River (`1428399`, the Stream
record, not the same-name populated place `1428398`), Sevier River
(`1445451`), Kings Peak (`1442332`), and Bonneville Salt Flats (`1425872`).
Bear Lake was not seeded: the state screen returned several same-name lake
records, including two in Rich County, and no per-ID statewide-lake identity
was established in this batch.

**Colorado** spans lon −109.07…−102.04, lat 36.98…41.02. Its 12 rows are
Denver (`201738`), Colorado Springs (`204797`), Boulder (`178680`), Fort
Collins (`204673`), Aspen (`204686`), Durango (`202983`), Mount Elbert
(`180381`), Pikes Peak (`204770`), South Platte River (`201759`), Grand Lake
(`204950`, the Lake record, not the populated place `202505`), Blue Mesa
Reservoir (`186973`), and San Luis Valley (`1930540`). South Platte River
also received a GNIS Domestic Names per-ID check: it confirms `Class=Stream`,
describes the 439-mile tributary, and returns the stored point as coordinate
sequence 1. Both USGS services say Logan County in their primary-county
field, although sequence 1 is a headwaters-area point from the Deckers map;
the row preserves that returned primary-county provenance and expressly does
not assert that sequence 1 lies in Logan County. The Colorado, Arkansas,
and Rio Grande rivers are generalized `context` corridors only: the Colorado
River primary point is outside the frame, and the state-filtered Geocoder
screens did not return the intended Arkansas/Rio Grande stream records.

**New Mexico** spans lon −109.06…−102.99, lat 31.32…37.01, including the
bootheel latitude. Its 12 rows are Santa Fe (`936823`), Albuquerque
(`928679`), Las Cruces (`899715`), Roswell (`894171`), Farmington
(`902246`), Taos (`911545`), Wheeler Peak (`928839`), Sierra Blanca Peak
(`920702`, the Summit record, not the near-coincident Sierra Blanca range
`912567`), Elephant Butte Reservoir (`888840`), Rio Chama (`923661`), Animas
River (`900284`, the San Juan County record, not the Hidalgo County
same-name stream `900283`), and Conchas Lake (`897344`). The Rio Grande and
Pecos River are context corridors only. Rio Grande's exact stream record was
not returned under `states=NM`; Pecos returned Eddy County records `900170`,
`900171`, and `900172`, which per-ID checks identify as Canal, Stream, and
Stream respectively. Neither Stream record is distinguished as the statewide
Pecos River record, so choosing one would have violated the identity-safe
rule. New Mexico's Wheeler Peak is also deliberately distinct from Nevada's
same-name state high point (`861956`).

None of these frames bundles a DEM. As with California/Nevada/Arizona, the
displayed terrain is a labelled synthetic gaussian field and the corridors
are generalized context—not river centerlines, highway alignments,
shorelines, or a state-boundary clipping mask.

### Oregon, Washington, and Idaho statewide frames (round 20, 2026-10-23)

The third state batch applies the same strict recipe to the Pacific
Northwest: candidate discovery through the USGS GNIS Geocoder, acceptance
only on an exact official name, compatible returned type, state, returned
primary county, permanent FEATURE_ID, and returned primary point. The batch
register preserves the Geocoder type/county for every row and reproduces the
generated gazetteer rows exactly. The city test pins that synchronization,
scene-node reuse of GNIS points, loader entries, generalized coast-line
counts, and the exclusions below.

**Oregon** spans lon −124.75…−116.45, lat 41.95…46.35. Its 12 rows are
Salem (`1167861`), Portland (`1136645`), Eugene (`1120527`), Bend
(`1137914`), Medford (`1124040`), Astoria (`1117076`), Mount Hood
(`1143711`, the Summit record, not the populated place `1143710`), Mount
Jefferson (`1144246`), Crater Lake (`1163669`, the Klamath County record,
not same-name lakes `1140396` and `1119515`), Willamette River (`1158060`),
Deschutes River (`1140916`), and Columbia River (`1140014`). Rogue River
was not seeded in this starter composition because its exact-name screen
returned two Stream records (Curry `1148698` and Polk `1148699`).

**Washington** spans lon −124.85…−116.85, lat 45.50…49.08. Its 12 rows are
Olympia (`1533353`), Seattle (`1512650`), Spokane (`1512683`), Tacoma
(`1512713`), Vancouver (`1531916`), Yakima (`1509643`), Mount Rainier
(`1533614`), Mount Saint Helens (`1525360`), Lake Chelan (`1530367`), Lake
Washington (`1531534`), Snake River (`1533479`), and Skagit River
(`1525850`). Columbia River is a context corridor in Washington because the
`states=WA` screen returned an empty array while the intended exact record
was returned and seeded under Oregon. Spokane River was also left unseeded:
two exact Stream records (`1508606` and `391131`) have nearby mouth-area
points, and the Geocoder screen alone does not safely distinguish the
statewide starter record.

**Idaho** spans lon −117.30…−110.95, lat 41.95…49.05. Its 12 rows are Boise
(`400590`), Idaho Falls (`396684`), Pocatello (`397053`), Coeur d'Alene
(`379485`), Twin Falls (`398273`, the populated place, not the waterfall
`375624`), Lewiston (`396788`), Borah Peak (`378037`), Hyndman Peak
(`383587`), Lake Pend Oreille (`398523`), Coeur d'Alene Lake (`397563`),
Salmon River (`400069`), and Clearwater River (`379406`). Snake River is a
context corridor in Idaho because the `states=ID` screen returned canals,
plains, valley, and canyon records but not the intended exact stream record;
that record was returned and seeded under Washington. Bear Lake remains
unseeded: the Idaho screen returned several small same-name lakes but not an
identity-safe returned record for the intended large Bear Lake County lake,
consistent with Utah's round-18 omission.

None of these frames bundles a DEM. Oregon uses one generalized Pacific
coast line and Washington uses two generalized outer-coast/Puget lines;
Idaho has no coast. Terrain is labelled synthetic relief, and all corridors
remain generalized `context`—not river centerlines, highway alignments,
shoreline surveys, state boundaries, or navigation data.

### Montana and Wyoming statewide frames (round 21, 2026-10-23)

The fourth state batch applies the same strict recipe to the Northern
Rockies. Every row is an exact-name Geocoder acceptance on compatible
returned type, state, returned primary county, permanent FEATURE_ID, and
returned primary point; Granite Peak and Jackson Lake additionally carry a
GNIS Domestic Names per-ID detail check. The batch register preserves the
Geocoder type/county for every row and reconstructs the generated gazetteer
rows exactly.

**Montana** spans lon −116.4…−104.0, lat 44.3…49.1. Its 12 rows are Helena
(`802116`), Billings (`802034`), Missoula (`787504`), Great Falls
(`802113`), Bozeman (`769173`), Butte (`780689`), Miles City (`774202`),
Flathead Lake (`783514`), Fort Peck Lake (`771516`), Lake McDonald
(`787038`, the Lake record, not the populated place `785919`), Bighorn
River (`779903`), and Granite Peak (`784178`). Granite Peak had three
exact-name Summit candidates; the per-ID detail check confirms
`Class=Summit`, Primary County=Park County, and coordinate sequence 1
marked **High Point** at the stored point, while the Madison County record
(`784179`) and second Park County record (`784177`) are rejected. The
Yellowstone and Missouri rivers are context corridors only because both
`states=MT` exact-name screens returned empty arrays, and Glacier National
Park was not seeded because the screen returned only Division records.

**Wyoming** spans lon −111.4…−104.0, lat 40.95…45.1. Its 12 rows are
Cheyenne (`1609077`), Casper (`1586424`), Laramie (`1590526`), Jackson
(`1604404`), Rock Springs (`1593588`, the populated place, not the
same-name springs `1593589`/`1593590`), Green River (`1589126`, the
populated place; the screen's only exact-name Stream is a different feature
in Weston County `1600086`), Gannett Peak (`1599903`), Grand Teton
(`1609199`, the Summit record, not the canal `1589026`), Devils Tower
(`1609083`, the Summit record, not the populated place `1604684`),
Yellowstone Lake (`1609324`), Jackson Lake (`1609177`, stored as
**Reservoir** after the per-ID check confirmed `Class=Reservoir` in Teton
County against the same-name Natrona County lake `1590031`), and Shoshone
River (`1594293`). North Platte River, Snake River, and the Green River
main stem are corridors only: the state screens returned an empty array,
only a mountain-range record, and town/canal/other-county records
respectively. The Bighorn River screen also returned empty under Wyoming;
only the Montana record is seeded.

Neither frame bundles a DEM. Both are inland rectangles with labelled
synthetic relief; all corridors remain generalized `context`—not river
centerlines, highway alignments, state boundaries, or survey geometry.

### North Dakota and South Dakota statewide frames (round 22, 2026-10-23)

The fifth state batch applies the same strict recipe to the Dakotas.
White Butte and Black Elk Peak additionally carry GNIS Domestic Names
per-ID detail checks; the batch register reconstructs every generated row
exactly.

**North Dakota** spans lon −104.3…−96.5, lat 45.9…49.1. Its 12 rows are
Bismarck (`1035849`), Fargo (`1028945`), Grand Forks (`1029197`), Minot
(`1030249`), Williston (`1032815`), Dickinson (`1028683`), Devils Lake
town (`1028672`) and Devils Lake (`1034194`) as separate classes with
distinct returned points, Lake Sakakawea (`1033989`), White Butte
(`1035239`), Sheyenne River (`1035146`), and Heart River (`1034918`).
White Butte had four exact-name Summit candidates; the per-ID check
confirms `Class=Summit`, Slope County, coordinate sequence 1 marked
**High Point**, and the description "Highest elevation in ND at 3506
feet", while the Hettinger, Morton, and Stark records are rejected. The
Missouri River and the Red River—screened under both `Red River` and the
official `Red River of the North` name—are context corridors only because
all three `states=ND` screens returned empty arrays, and the North Dakota
James River is not claimed because that screen was also empty; the unique
South Dakota James River record is seeded only in South Dakota.

**South Dakota** spans lon −104.3…−96.4, lat 42.45…46.0. Its 12 rows are
Pierre (`1266887`), Sioux Falls (`1267670`, the populated place, not the
waterfall `1258087`), Rapid City (`1265333`), Aberdeen (`1253581`),
Mitchell (`1256500`, not the two same-name Mitchell Lakes), Yankton
(`1259091`, not the county or reservation), Belle Fourche (`1265119`, the
town; its same-hydronym river `1265120` and reservoir `1253838` stay out
of the 12-row starter as separate identity-safe records), Black Elk Peak
(`1261770`), Lake Oahe (`1266878`), Bad River (`1265114`), Cheyenne River
(`1267017`, not the reservation `1267254`), and James River (`1261082`).
Black Elk Peak's per-ID check confirms `Class=Summit`, Pennington County,
sequence 1 marked **High Point**, and the Board on Geographic Names'
2016 rename from Harney Peak—the former name returns no record under
`states=SD`. Missouri River is a corridor only after an empty `states=SD`
screen; Badlands National Park and Lake Sheridan exact-name screens also
returned empty arrays and were not seeded.

Neither frame bundles a DEM. Both are inland rectangles with labelled
synthetic relief; all corridors remain generalized `context`—not river
centerlines, highway alignments, state boundaries, or shoreline geometry.

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
- Round-18 Four Corners state GNIS records: [`resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json) records the 36 verified Utah/Colorado/New Mexico rows, returned Geocoder type/county fields, identity decisions, ambiguous-candidate exclusions, and the South Platte/Pecos per-ID checks.
