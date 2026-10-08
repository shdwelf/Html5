# CITY SUBSURFACE 4Dwm — parametric city theaters + the geocache source tier

Research pass and build: **2026-10-07** (branch `arena/4924b3bd-html5`).

## What this adds

The SOCAL SUBSURFACE engine that only ever rendered one frame now has a
parametric city form. Five cities ship as their own apps and Webxdc bundles:

| City | Page | Data pack | Gazetteer pack | Webxdc |
| --- | --- | --- | --- | --- |
| Lawrence, Kansas | `lawrence-subsurface.html` | `js/city-subsurface-data-lawrence.js` | `js/city-gazetteer-data-lawrence.js` | `lawrence-subsurface.xdc` |
| Atlanta, Georgia | `atlanta-subsurface.html` | `js/city-subsurface-data-atlanta.js` | `js/city-gazetteer-data-atlanta.js` | `atlanta-subsurface.xdc` |
| Kansas City, Missouri | `kansascity-subsurface.html` | `js/city-subsurface-data-kansascity.js` | `js/city-gazetteer-data-kansascity.js` | `kansascity-subsurface.xdc` |
| Buffalo, New York | `buffalo-subsurface.html` | `js/city-subsurface-data-buffalo.js` | `js/city-gazetteer-data-buffalo.js` | `buffalo-subsurface.xdc` |
| Toronto, Ontario 🍁 | `toronto-subsurface.html` | `js/city-subsurface-data-toronto.js` | `js/city-gazetteer-data-toronto.js` | `toronto-subsurface.xdc` |

The engine is one module (`js/city-subsurface.js`) plus one gazetteer engine
(`js/city-gazetteer.js`, the ADL GSP offline subset lifted from the SoCal
build). Everything else is generated:

```
node scripts/build-city-subsurface.mjs       # pages + data packs from cities.json
node scripts/build-city-subsurface-xdc.mjs   # public/apps/<city>-subsurface + .xdc
npm run build:city-subsurface                # both
```

`resources/city-subsurface/cities.json` is the single source of truth;
`resources/city-subsurface-template.html` is the page shell. The build validates
that every gazetteer row has ten columns, sits inside its city bbox, and never
claims a GNIS FEATURE_ID it cannot back — verified rows must carry a numeric id,
unverified rows must not.

### Layer parity with SoCal

Each city ships the full layer list — terrain, gazetteer, **geocaches**,
water, products, crude/gas, rail, power, sites, bases, trails, roads, aviation,
harbors, offshore, industry, and **underground** — so the Toronto frame can
carry a PATH spine and a Don River reach, Buffalo carries the Lake Erie shore,
Niagara River and Erie Canal context, and every frame keeps the x-ray /
wireframe / labels / exaggeration controls and the orthographic plan view.

Corridors are schematic register lines (5–15 km class accuracy), not
alignments. Call 811.

## The Geocache class

The user's request was "add geocaches" alongside GNIS names. The honest way to
do that in a register that has a GNIS-verification discipline is a **separate
source tier**, not a quiet merge. Geocaches use:

- `fclass = "Geocache"`, `ftt = "rec.geocache"` — the same extension the SoCal
  GPX importer writes, matched by the `rec` facet;
- `VERIFIED = 0` **always** — a cache listing is a community record, never a
  GNIS feature, and the build fails a Geocache row that tries to claim a
  FEATURE_ID;
- the cache code (`GC…`) in the note, with the source named.

Three rows ship today, all pinned only because a public source prints the
posted coordinates:

| Row | Code | Source for the coordinate |
| --- | --- | --- |
| Why Not Buffalo? #1 | `GCQ1T1` | the archived cache's own public description: *"CACHE MOVED on 12/7/15 … N 42 54.055 W 78 53.933"* |
| Toronto's First Post Office | `GC7HT4Z` | the official Geocaching.com *Geocache of the Week* post (2024-12-04): *N 43° 39.111′ W 079° 22.221′* |
| (Lawrence, Atlanta, Kansas City) | — | no static row: no public source found that prints a posted coordinate. Those cities still take local GPX imports. |

That last line is a deliberate result, not an omission. Searches across the
current cache pages, the Geocaching.com blog index, the Kansas Society of Land
Surveyors' NSPS geocaching pages, state society pages, and general web indexes
recovered **cache identities but not posted coordinates** for Lawrence
(`GCXWVE` NSPS, `GC4JKJT`, `GCA4JG9`, `GC5GFV9` …), Atlanta (`GC48X1E`,
`GC919`) and Kansas City (`GC7WH54`). Coordinates on Geocaching.com are
members-only; only caches whose coordinates appear in public body text (blog
posts, owner instructions embedded in the description, local news) can be
pinned. Inventing plausible-looking coordinates for the rest would violate the
same rule the GNIS tier follows.

## Local GPX import (shared with SoCal)

The five city pages carry the same **LOCAL GPX → GEOCACHE REGISTER** control as
`/socal-subsurface` and reuse `js/gpx-geocache.js` unchanged — one importer, one
row shape, one preservation format:

- pick a `.gpx` (GPX 1.0/1.1, ≤ 25 MiB, ≤ 5000 caches, DOCTYPE refused);
- the file is parsed in the page, in memory, against **that city's** bbox, so a
  Pocket Query / GSAK export / Geomate loader set shows only what belongs to the
  frame. Out-of-frame caches are counted and reported, not silently dropped;
- imported caches become `rec.geocache` rows (VERIFIED = 0, source metadata
  attached) and draw as octahedron pins in the **Geocaches** layer, searchable
  through the same gazetteer ops;
- **PRESERVATION BAG (.ZIP)** writes the BagIt 1.0 archive — original GPX
  byte-for-byte, normalized XML + JSON renditions, payload and tag SHA-256
  manifests, and a PREMIS-style preservation event — from main's importer;
- **CLEAR** removes the imported pins and restores the static register.

Nothing is uploaded, written to a device, or retained between sessions. The
static pack keeps its own two pinned caches (above); imports are session-only,
which is also where the SoCal audit landed after removing unsupported rows.

## Geomate.jr / Geomate Loader firmware research — status

The 2026-10-06 pass (`docs/geomate-jr-firmware-research.md`) is unchanged and
still correct: the archived `geomateQtGuiApp.exe` /
`geomateQtGuiApp.exe.zip` payloads have **no replayable Wayback capture**, the
live App Engine and Dropbox URLs are 404, and no Geomate firmware bytes are in
this checkout. Nothing has been fabricated to fill the gap.

What the city work adds is the import *target*. When a Geomate.jr database
dump, a GSAK export, or a Pocket Query GPX is supplied:

1. hash and record the file (SHA-256, size, URL, date) outside Git;
2. list/parse members without executing anything — the device database is the
   payload, the loader is just a transport;
3. convert records to the Geocache row shape above, keeping the GC code, the
   snapshot date, and the cache type/size/difficulty/terrain fields;
4. rebuild the city packs with `node scripts/build-city-subsurface.mjs` and the
   bundles with `node scripts/build-city-subsurface-xdc.mjs` — or, for a
   one-off look, load the GPX through the page's own import control (above),
   which needs no rebuild at all.

The engine already renders the tier; the missing input is bytes, not code.

## Sources used for this pass

- City coordinates/elevations: public city reference coordinates (documented
  per row in the packs) for context rows.
- Official GNIS rows: `City of Eudora` (FEATURE_ID **2394705**) and
  `City of Lecompton` (FEATURE_ID **2395667**), from the USGS National Map
  gazetteer service (`carto.nationalmap.gov/arcgis/rest/services/geonames/MapService`),
  retrieved 2026-10-07 for the Lawrence frame. USGS GNIS factual data is a US
  government work (17 USC §105).
- River reach context: USGS Water Data site **06891080** (Kansas River at
  Lawrence, KS) for the gauge coordinate; the corridor lines themselves are
  schematic.
- Buffalo cache: public Geocaching.com cache description for `GCQ1T1`.
- Toronto cache: Geocaching.com blog, *Toronto's First Post Office — Geocache
  of the Week*, 4 December 2024.
- Toronto PATH: City of Toronto, *PATH — Toronto's Downtown Pedestrian
  Walkway* (city page; more than 30 km, mostly underground). The plotted spine
  is schematic.
- Rock Chalk Park (Lawrence) and the Buffalo park landmarks: public listing
  coordinates (Explore Lawrence; cached public references).

Rows that could not be traced to a published coordinate are marked `curated`
in their note and stay `VERIFIED = 0`. Where a row is a *place* with an
authoritative GNIS record but the pass did not retrieve the FEATURE_ID, the id
column stays `null` rather than being guessed.
