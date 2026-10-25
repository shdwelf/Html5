# Backlog execution round 16 — 22 Oct 2026

*Sixteenth round: “Continue backlog” — the round-15 queue: a per-ID GNIS
extract for California, Nevada and Arizona state frames, an S6 historical-
network viewer scope, and no invented work for externally blocked S7. Lands
as a fourth commit on PR #129. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md) · [13](backlog-execution-round-13-2026-10-22.md) ·
[14](backlog-execution-round-14-2026-10-22.md) · [15](backlog-execution-round-15-2026-10-22.md).*

## Scoping decisions (recorded before data edits)

- **GNIS standard.** A row could move to `VERIFIED=1` only if the USGS
  record's exact official name, feature class/type, state and primary
  county, permanent FEATURE_ID, and returned point all described the
  intended feature. For multipoints, one actual returned point is stored and
  the note says so. No point is called a boundary, street-address geocode,
  generic centroid, shoreline, peak polygon, or stream centerline.
- **Publication-surface discrepancy.** Some active hydrographic records are
  present in GNIS Domestic Names and the USGS Geocoder but were not returned
  by the current cartographic GNIS hydro layers checked this round. Those
  rows were accepted only on a per-ID Domestic Names detail record
  (coordinate sequence 1) plus the matching Geocoder primary point, with the
  MapServer non-return stated in the row note. They are never described as
  MapServer geometry.
- **Archived cultural classes.** Current GNIS Domestic Names coverage omits
  several classes archived in 2021, including Dam, Mine, Park, and School.
  California's universities, Empire Mine, historic-site/park, Nike, house,
  lodge, Aerojet, and Morris Dam rows therefore remain `VERIFIED=0`; no
  archived, Wikidata-only, or non-reproducible snapshot ID was substituted.
- **Nevada/Arizona.** The new state registers contain only identity-safe
  GNIS rows. The USGS Geocoder was used as a fuzzy candidate service; every
  accepted result had to match exactly on name, type, state, primary county,
  ID, and primary point. Same-name administrative and wrong-class records
  were rejected.
- **S6 stays separate.** ARPANET/FidoNet/BBS/payphone records need dated
  observations, place granularity, and logical-versus-physical edge
  semantics. This round scopes that consumer viewer; it does not seed those
  records into the GNIS city/state system.
- **S7 unchanged.** It remains externally blocked on a gina.dll binary +
  JDK/Ghidra, a physical teardown, or proprietary drivers. No substitute
  artifacts were invented.

## Delivered

| Artifact | What it closes / establishes |
| --- | --- |
| California frame updated in `resources/city-subsurface/cities.json`; regenerated `california-subsurface.html`, `js/city-gazetteer-data-california.js`, and `california-subsurface.xdc` | **S4 California GNIS extract:** 16 `VERIFIED=1` rows — Los Angeles `1662328`, San Francisco `277593`, Sacramento `1659564`, San Diego `1661377`, Oakville `229899`, Manzanar locality `1659050`, Mount Whitney `269051`, Mount Shasta `266054`, Death Valley `270787`, Sacramento River `1654949`, San Joaquin River `273488`, Russian River `267200`, Lake Tahoe `1654975`, Salton Sea `248771`, Morris Reservoir `272561`, and Tule Lake Swamp `268456`. The other 11 round-15 cultural rows retain `VERIFIED=0`, GNIS null, and named public sources. |
| `nevada` and `arizona` configs; generated pages/data/gazetteer packs and `nevada-subsurface.xdc` / `arizona-subsurface.xdc` | **S4 Nevada + Arizona:** the parametric system now has eight configurations. Nevada ships 12/12 verified GNIS rows (Carson City, Reno, Las Vegas, Elko, Winnemucca, Ely, Tonopah, Pyramid Lake, Walker Lake, Humboldt River, Boundary Peak, Wheeler Peak). Arizona ships 12/12 (Phoenix, Tucson, Flagstaff, Yuma, Prescott, Kingman, Salt/Gila/Verde rivers, Humphreys Peak, Mount Graham, Grand Canyon Valley). Each state has four generalized `context` corridors, four nodes, synthetic relief, and no DEM. |
| [`../resources/city-subsurface/gnis-state-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-source-register-2026-10-22.json) | Machine-readable per-row provenance for all 40 newly verified state-frame rows: endpoints, selection rules, class/county/ID/point basis, retained California unverified rows, identity decisions, exclusions, and limitations. `tests/city-subsurface.test.mjs` compares this register with the generated packs so it cannot silently drift. |
| Nevada/Arizona entries in all three loader maps in `js/city-subsurface.js`; `Swamp` and `Dam` class metadata in `js/city-gazetteer.js`; optional-DEM import hardening in the engine and `scripts/build-city-subsurface-xdc.mjs`; all eight XDCs rebuilt | The state pages resolve their data/gazetteer packs; absent state DEM modules remain optional and are reported by the XDC builder. Live-preview QA found that Vite's static import analysis returned HTTP 500 for absent optional DEM packs before the runtime catch could run. DEM loads now route through a variable-specifier `importDem()` helper, while the XDC builder explicitly scans those calls so the checked-in Lawrence DEM still ships. Because the shared engine's import graph ships every frame pack, the eight bundles now contain 31 entries rather than the round-15 count of 27, and the shared test byte-checks all staged JS/CSS against the worktree. |
| `tests/city-subsurface.test.mjs` | The old “all California rows unverified” test was replaced by an exact-partition contract: the 16 verified IDs/coordinates and 11 unverified rows are enumerated; the Manzanar, Morris, and Tule Lake non-upgrades are pinned; Colorado River is asserted absent; Nevada/Arizona bboxes, all 24 IDs, Geocoder note/primary-point wording, context corridors, and source-register synchronization are pinned. A separate regression test parses the browser engine as an ES module. Test count for this file: 5 → 7. |
| [`historical-network-viewer-scope-2026-10-22.md`](historical-network-viewer-scope-2026-10-22.md) | **S6 consumer scope:** a separate offline map/topology/records viewer with an observation-first schema (`SourceSnapshot`, `Observation`, `Place`, `NetworkNode`, `NetworkEdge`, merge log), place-granularity and edge-geometry rules, source/rights gates, phased build, and acceptance tests. It also records that `USBBS134.LST` (July 1995) repeats the Denver Keyhole BBS listing with first-listed code 123—but as the same publication lineage as USBBS #127, not independent corroboration. |
| [`city-subsurface.md`](city-subsurface.md), backlog Markdown/JSON, docs README, and rebuilt Wiki archive | S4 remains partial (territories, other states, country/planet, and bulk themed layers remain); S6 remains partial with the viewer scoped but datasets unseeded; S7 remains externally blocked. |

## Identity decisions worth keeping

1. **Manzanar.** GNIS `1659050` is a populated-place/locality record at
   `(36.73993695, −118.08065811)`. It is useful as its own row, but it does
   not verify Manzanar National Historic Site/War Relocation Center.
2. **Morris.** GNIS `272561` is Morris Reservoir, class Reservoir, with
   Domestic Names sequence-1 point `(34.183909, −117.870436)`. It is not the
   Morris Dam structure. A “Morris Dam” Geocoder search returned a Mendocino
   County record instead, so no Los Angeles County dam ID was inferred.
3. **Tule Lake.** GNIS `268456` is a perennial Swamp with primary point
   `(41.890068, −121.5057865)` in Siskiyou County. It is not the War
   Relocation Center/National Monument.
4. **Grand Canyon.** Arizona uses `23907`, the GNIS Valley landform whose
   primary point lies in the western canyon in Mohave County—not `5213`, the
   Grand Canyon populated place, and not a visitor-center coordinate.
5. **Walker Lake and Salt River.** Nevada uses Walker Lake lake `844615`,
   not populated place `854682`; Arizona uses Salt River stream `33995`, not
   populated place `44982`.
6. **Carson City.** Nevada uses populated place `863976`, not the separate
   county-equivalent record `863219`.
7. **Colorado River.** GNIS `45730` is omitted from all three gazetteers
   because its returned primary point `(31.9, −114.9508333)` is outside the
   California, Nevada, and Arizona frame boxes. Generalized river corridors
   are context only, not unspoken gazetteer geometry.

## Findings worth keeping

1. **“Not in the cartographic layer” is not “not in GNIS.”** Lake Tahoe
   `1654975`, Salton Sea `248771`, and Morris Reservoir `272561` have active
   Domestic Names detail records with coordinate sequences matching the
   USGS Geocoder. Current GNIS cartographic hydro layers searched during
   scoping did not return them. The correct response was to identify which
   service supplied each point, not to centroid a lake or discard an active
   record.
2. **The USGS Geocoder is a candidate generator, not an import file.** Its
   responses interleave divisions, colonies, census entities, townships, and
   same-name features of other classes. The type field is therefore part of
   the identity check; accepting the first name match would have been wrong
   repeatedly.
3. **The archived-class ceiling is real.** A modern end point that omits
   School/Park/Mine/Dam coverage cannot be made to verify the California
   cultural starter rows. Keeping those rows public-source `VERIFIED=0`
   preserves the exemplar geography without laundering an unavailable ID.
4. **A later issue of the same list is not independent corroboration.**
   USBBS #134 strengthens the Keyhole board's temporal persistence through
   July 1995 and indicates first listing by #123, but S6 still needs a
   different publisher/source—Boardwatch, FidoNet material, or another
   contemporaneous directory—before “second independent listing” can be
   claimed.
5. **Source terms can shape architecture.** The recovered USBBS header
   restricts modification and bundling with another product/service without
   prior written permission. That is why the historical-network scope puts a
   rights decision and local-import path before any bulk BBS dataset.
6. **The frame recipe remains cheap; the evidence is the expensive part.**
   Two states required only config blocks plus six loader lines. The work
   was in deciding what a point proves, which same-name record to reject,
   and how to make the register test fail if those choices are blurred.
7. **An optional dynamic import is not optional to every tool.** Native
   browser execution rejected a missing DEM pack into the intended catch,
   but Vite tried to resolve every literal specifier during transformation
   and served HTTP 500 for the whole shared engine. `@vite-ignore` on a
   literal did not change that in Vite 7. A variable-specifier helper makes
   absence a runtime condition again; the offline packager was taught to
   recognize that helper so “works in preview” did not become “DEM missing
   from the XDC.”
8. **A byte-current bundle can still contain an unparseable engine.** A
   manual `node --check` exposed a pre-existing pointer-move handler shaped
   as `(e) => { … const e = elevationAt(…); }`, which is a module-level
   SyntaxError in a browser. The data and bundle-currency tests passed
   because they never parsed/booted `js/city-subsurface.js`. The variable is
   now `elev`, and the test suite writes the engine to a temporary `.mjs`
   file and runs Node's parser over it. Generated-artifact freshness is not
   a substitute for parsing the shipped entry point.

## Verification notes

- GNIS checks were retrieved on 2026-10-22 from the National Map GNIS
  MapServer, the USGS Water Data GNIS Geocoder, and GNIS Domestic Names
  detail records. Direct sandbox HTTPS to the USGS endpoints had failed in
  scoping with TLS EOF, so targeted page fetches and the public
  `usgs/search_api` client source were used to identify and query the
  Geocoder contract.
- Every verified row note names its FEATURE_ID, service, date, and point
  limitation. The build validator enforces 10 columns, in-frame points,
  unique `name|fclass`, `VERIFIED=1 ⇒ numeric GNIS ID`, and
  `VERIFIED=0 ⇒ GNIS null`.
- Nevada/Arizona terrain and corridors are schematic: synthetic gaussians
  and generalized `context` polylines, not DEMs, route surveys, or state
  outline masks.
- S6 shipped no dataset. The USBBS #134 result is recorded as a cited lead
  and design fixture; no transformed USBBS corpus is bundled.

## Test tally at round-16 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — all 8 frames built; each XDC has 31 entries; absent optional DEM modules are reported for the non-Lawrence frames |
| `npm run build:wikiinajar` | PASS — 207 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| `tests/city-subsurface.test.mjs` (7 tests; shared currency test now covers 8 frames, plus an engine-parse regression test) | 7 PASS |
| Targeted `city-subsurface` + `wikiinajar` + `wikiinajar-docs-sync` + `wiki-webxdc` + `webxdc-packages` Node tests | 46 PASS |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 709 tests: 680 pass, 12 skipped, 17 fail. All 17 failures are the known environmental `tests/mealplan-applet-sim.test.mjs` cases, each `spawn …/bin/java ENOENT` because the sandbox has no bundled JDK. No other Node failures. |

## Next (round 17)

- S4: territories (Guam, American Samoa, USVI, Midway) before the other
  states, using the same per-ID/source-register discipline where a GNIS or
  territorial authority applies. California bulk themes and archived-class
  features only with dated per-row registers and an explicit archival-source
  decision.
- S6: resolve the USBBS rights/local-import question; capture one lawful
  source snapshot with a hash; implement schema fixtures and the Keyhole
  one-snapshot vertical slice. Continue seeking a genuinely independent
  Denver Keyhole listing in FidoNet/Boardwatch captures under F3.
- S7 stays blocked on external artifacts (binary/JDK/Ghidra, teardown, or
  proprietary drivers).
- Gated, unchanged: DOSBox and external-host items under their existing
  F3/toolchain constraints.
