# SOCAL SUBSURFACE — USGS GNIS Gazetteer Register

An offline register of named places for the socal-subsurface theater, built on
the **USGS Geographic Names Information System (GNIS)** model and shaped after
the **ADL Gazetteer Content Standard v1.2** (research digest:
`docs/research/02_ADL_GAZETTEER_CONTENT_STANDARD.md`). It ships as a generated
JS data pack plus a pure-JS query engine — a client-side "GazBean" port of
`docs/research/03_GAZBEAN_ARCHITECTURE.md` — so the whole names service runs
inside the Webxdc with zero network calls.

## The ADL GCS entry model

Every register row keeps the ADL tripartite deal:

1. **Name set** — the GNIS `FEATURE_NAME` (US Board on Geographic Names
   authoritative form for the domestic US). Apostrophes and ḗvariants are kept
   verbatim (`Burro Schmidt's Tunnel`, `March Air Reserve Base`); search does
   the folding, never the data.
2. **Spatial footprint** — one point at the GNIS *primary coordinates*
   (Nad83 ≈ WGS84 at this scale). Bodies of water are pinned at standard
   anchors (mouth anchor for streams, centroid for lakes).
3. **Classification** — the GNIS `FEATURE_CLASS` (Summit, Lake, Reservoir,
   Spring, Stream, Populated Place, Census, Locale, Park, Military, Mine,
   Oilfield, Tunnel, Canal, Gap, Cape, Falls, Glacier, Flat, Basin, Valley,
   Range, Pillar, Crater, Lava …) crosswalked onto the ADL **Feature Type
   Thesaurus** path (`phys.summit`, `hydro.lake`, `manmade.mine`, `pop.ppl`,
   `admin.military`, …). Facet filtering in the UI and engine walks the FTT
   prefix tree, so `phys` matches every physiographic entry.

Row layout (see `js/socal-gazetteer-data.js` header):

```
[name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null]
```

`county` carries the state suffix for register fringes outside California
(`Clark NV`, `Mohave AZ`), matching the convention the generated pack has
always used.

## Provenance and the two-tier register

USGS GNIS is US government work, public domain (17 USC §105). Two tiers live
side by side, matching the theater's evidence-tier discipline:

- **VERIFIED = 1** — the `FEATURE_ID` was confirmed. Sources: the Wikidata
  `P590` anchor pull (`data/gnis/wikidata-anchors.json`, CC0, retrieved
  2026-10-03), or the official **DomesticNames** national-file extract when
  one is staged (see below). Verified pins render at full brightness in the
  theater; the dossier prints the FEATURE_ID.
- **VERIFIED = 0** — curated seed position from the repo's field/quad/situs
  corpus (`data/gnis/socal-gazetteer-seed.csv`). These render muted
  (community tier) and their dossier says plainly *"position from the curated
  seed register — no verified FEATURE_ID yet"*. **Never invent a
  FEATURE_ID**: unverified rows have `gnisId: null` by construction, and the
  build rejects any VERIFIED=1 row without a numeric id.

## Sources and regen

- Canonical register: `data/gnis/socal-gazetteer-seed.csv` (pipe-delimited;
  header documents the ten columns).
- Anchor pull: `data/gnis/wikidata-anchors.json` (Wikidata Query Service
  results; the labels-for-P590 pattern from
  `docs/research/04_USGS_GNIS_POSTGIS_INTEGRATION.md`).
- Official upgrade path: drop `data/gnis/DomesticNames_CA.txt` (the USGS GNIS
  domestic names text extract, same layout as the PostGIS loader pipeline in
  research/04). The build ingests in-bbox rows as VERIFIED=1 and lets them
  override curated coordinates on name+class collisions.

Rebuild:

```
node scripts/build-socal-gazetteer.mjs
node scripts/build-socal-subsurface-xdc.mjs   # restages public/apps + .xdc
```

Frame: lon −121.6°…−114.0°, lat 32.45°…38.35°. Out-of-frame seed rows are
dropped at build time (a deliberate register-vs-theater split), never pinned
approximate.

## The GazBean ops (offline ADL GSP)

`js/socal-gazetteer.js` implements the ADL Gazetteer Service Protocol op set
entirely in the client:

| op | signature | notes |
| --- | --- | --- |
| `get-capabilities` | `getCapabilities(rows)` | ops list, SRS (EPSG:4326), register stats, class inventory |
| `search-name` | `searchName(idx, query, {facet, classes, threshold, limit})` | fuzzy; see below |
| `search-box` | `searchBox(idx, {lat0,lat1,lon0,lon1})` | lon/lat rectangle, six decimals accepted |
| `search-point` | `searchPoint(idx, lat, lon, {radiusKm})` | haversine (R = 6371.0088 km), distance-ranked |
| `describe` | `describe(idx, i)` | full entry record; in the theater this is the dossier panel |

`search-name` reimplements the **pg_trgm** similarity model from research/03
in JS:

```
similarity(s1, s2) = |T(s1) ∩ T(s2)| / |T(s1) ∪ T(s2)| ≥ τ   (default τ = 0.26)
```

over space-padded character trigrams, plus the boost ladder the docker demo
used (exact → 1.0, prefix → 0.85, substring → 0.62) and county as a secondary
field (exact county match → 0.5, near → 0.55). Trigram sets are computed
lazily on first query per entry, so boot cost stays near zero. Facet and
class chips in the UI pass straight into the same filter predicates.

## Theater integration

- A **GNIS GAZETTEER** PiP (`socal-subsurface.html#pipGaz`) hosts the search,
  facet + class chips, an "in view" search-box flyout, the results list, and a
  get-capabilities caption. Every hit flies the camera to the pin and opens
  the ADL GCS dossier.
- Every register row draws a mast+pin marker colored by FTT-branch swatch:
  verified = full brightness, curated = muted. Raw labels stay off at frame
  scale — search hits and register-zoom proximity annotate the nearest pins,
  and clicked pins keep their label until the selection clears.
- All 26 classes (480 rows, 65 verified at the 2026-10-03 build) share the
  standard layer toggle, x-ray/wireframe/labels globals, exaggeration slider,
  and the 811/excavation disclaimers — the register is a *names* layer, not a
  survey layer.

## Geocache class (user-imported only)

`Geocache` / `rec.geocache` rows are not shipped in the register. The GAZETTEER
PiP can load a Pocket Query or GSAK GPX locally (`js/socal-geocache-gpx.js`);
those rows are unverified, carry an 11th `metadata` element (`cacheCode`,
`cacheType`, `difficulty`, `terrain`, `sourceFile`, `importedOn`) and are never
assigned a GNIS FEATURE_ID. See `docs/geomate-jr-firmware-research.md`.
