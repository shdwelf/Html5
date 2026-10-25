# S5 · Live incident, camera & sensor layers — inventory and first slice (round 48, 2026-10-25)

The backlog's S5 stream was the only one still fully *open*. This round
opens it honestly: an inventory of the named sources with their real
access patterns, plus the two pieces that can be built and verified
without live fetching — the dish-pointing calculator and the
feed-normalization layer. Live endpoints sit outside the sandbox
allowlist (F3), so **nothing in this round fetches anything**; live
capture remains runner/relay work, and the test fixtures are synthetic
and labelled as such.

## What shipped

- `js/dish-pointing.js` — GEO look angles (azimuth/elevation/slant
  range/visibility + visible-arc span). Spherical-Earth model, limits
  stated in every result. Known-answer tests: overhead satellite
  (elevation 90°, range = 42,164.17 − 6,371 = 35,793 km), Los Angeles →
  GOES-West 137.2°W (az 211.5°, el 45.5°), antipode invisibility.
- `dish-pointing.html` — the calculator as a page.
- `js/incident-adapters.js` — one canonical layer feature
  (`incident | camera | fire | lookout | sdr | notam`) with validating
  normalization: (0,0) placeholders and bad coordinates rejected *with
  reasons*, dedupe-by-id (newest wins), stale filtering, `nearby`
  radius/kind queries, and an ArcGIS-point adapter (the WFIGS service
  shape) driven by a caller-supplied field map. Tests 10/10 across the
  two suites.

## Source inventory (access reality, not wishful thinking)

| Backlog item | What it actually is | Access pattern | Adapter status |
|---|---|---|---|
| CHP CAD live incidents | CHP's public Traffic Incident Information Page, per communications center, at [cad.chp.ca.gov](https://cad.chp.ca.gov/) [1](https://cad.chp.ca.gov/) | Server-rendered HTML (ASP.NET), auto-refresh; no documented public JSON API — third-party archives (e.g. UC Davis CHIPS) are scrape-built | Normalizer ready; HTML capture/parser is F3 runner work |
| Caltrans + state DOT cameras | Caltrans QuickMap (`quickmap.dot.ca.gov`) and district CCTV; other states run 511 systems | Public map + per-camera still images | Normalizer ready (`kind: camera`); image URLs supplied by caller, nothing hotlinked or bundled |
| WildCAD | WildCAD-E is agency CAD software (Bighorn) [1](https://www.wildfire.gov/application/wildcade) | **Not a public feed** — runs inside dispatch centers; public surface is dispatch logs + IRWIN downstream | No adapter (correctly); do not scrape agency CAD |
| NIFC historical/current fires | WFIGS public services on the NIFC Open Data site (perimeters + incident points) [2](https://wfigs-nifc.hub.arcgis.com/pages/wfigs-public-data) [3](https://data-nifc.opendata.arcgis.com/maps/nifc::wfigs-interagency-fire-perimeters) | Public ArcGIS REST services; only IRWIN records flagged Public/Approved/Visible are published | `fromArcgisPoint` adapter + field map shipped |
| WiFire | UC San Diego / SDSU wildfire research platform (WIFIRE/Firemap) | Research platform, partner access | Inventory only |
| WREN cameras | Named in the backlog as "WREN cameras"; the referent is **not yet verified** (candidate: a regional fire-camera network distinct from ALERTCalifornia, UC San Diego's camera network) | — | Blocked on referent resolution — flagged, not guessed |
| liveuamap | Commercial conflict/incident aggregator | Subscription/ToS-governed | Inventory only; no scraping |
| NOTAMs | FAA NOTAM distribution | Public NOTAM Search for lookups; bulk via FAA NAS data services | Inventory only (`kind: notam` reserved) |
| Fire lookouts (static) | Published lookout directories (USFS / Forest Fire Lookout Association listings) | Static snapshots via runner | `kind: lookout` reserved; snapshot not yet captured |
| KiwiSDR / SDR receivers (static) | Public KiwiSDR receiver directory | Public list, snapshot via runner | `kind: sdr` reserved |
| Dish-pointing calculator | Backlog layer item | Pure math | **Done this round** |
| tv.garden / radio.garden transcription | Stream-directory transcription pipeline | Stream ToS + speech-to-text cost/rights questions | Inventory only; not started |

## Layer schema

`{ id, kind, title, lat, lon, updatedEpochMs, sourceId, url? }` — a
viewer consumes any kind uniformly; provenance rides in `sourceId`,
and every rejected record surfaces in `rejected[]` with a reason so a
layer never hides its own gaps.

## Next steps (unchanged blockers)

1. F3 runner capture for CHP CAD pages + WFIGS services → recorded
   fixtures → per-source parsers on top of the normalizers.
2. Resolve the "WREN cameras" referent before any camera adapter
   beyond Caltrans.
3. Static snapshots (lookouts, KiwiSDR) via the same runner path.
4. Viewer integration: the S4 viewers consume `normalizeFeed` output;
   wiring is a follow-up round, deliberately not bolted on here.
