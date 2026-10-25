# Backlog execution round 17 — 22 Oct 2026

*Seventeenth round: “Continue backlog” — the round-16 queue: territory frames
before the remaining states, and the S6 rights/schema/Keyhole vertical slice.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md) · [13](backlog-execution-round-13-2026-10-22.md) ·
[14](backlog-execution-round-14-2026-10-22.md) · [15](backlog-execution-round-15-2026-10-22.md) ·
[16](backlog-execution-round-16-2026-10-22.md).*

## Scoping decisions (recorded before implementation)

- **Territory GNIS standard stays per-ID.** A territory row is
  `VERIFIED=1` only when exact official name, returned feature type,
  territory, returned county/district, permanent FEATURE_ID, and GNIS
  primary point all identify the intended feature. Census-designated places,
  election districts, political divisions, and same-name features in other
  classes are not substitutes.
- **The Geocoder `Type` is a grouped label, not the row class.** Accepted
  rows preserve it in the note and map it to the corresponding GNIS feature
  class. Hagåtña was additionally confirmed in GNIS Domestic Names and
  MapServer as `Civil`.
- **Island geometry needs two engine changes.** The shared formatter cannot
  assume north latitude/west longitude (Guam is east; American Samoa is
  south), and one coastline polyline cannot represent disconnected island
  groups. Both fixes are backward-compatible with existing frames.
- **American Samoa extent is explicit.** The frame covers Tutuila and the
  Manuʻa group legibly. Swains Island and Rose Atoll are omitted and named as
  omitted; the frame is not presented as the territory's full political
  extent.
- **Midway requires bounded discovery.** The Geocoder returns `State=null`;
  `states=UM` returned no suggestions. Exact names were therefore screened by
  the documented latitude/longitude bound parameters from the USGS
  `search_api` client contract.
- **USBBS rights are resolved conservatively.** The recovered USBBS header
  restricts modification and bundling. Round 17 therefore ships short cited
  fixture fields and a local importer, not a transformed bundled USBBS
  dataset. Missing captures/hashes remain explicit blockers.
- **S7 unchanged.** It remains externally blocked on a gina.dll binary +
  JDK/Ghidra, physical teardown data, or proprietary GoldKey drivers.

## Delivered

| Artifact | What it closes / establishes |
| --- | --- |
| `guam`, `americansamoa`, `usvirginislands`, and `midway` configs in `resources/city-subsurface/cities.json`; generated pages/data/gazetteer packs and four new XDCs; all twelve city XDCs rebuilt | **S4 territories:** city-subsurface now has twelve configurations. Guam ships 12/12 verified GNIS rows; American Samoa 12/12; U.S. Virgin Islands 12/12; Midway 6/6. Each uses labelled synthetic relief, three generalized `context` corridors, and scene nodes pinned to gazetteer GNIS points. |
| [`../resources/city-subsurface/gnis-territory-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-territory-source-register-2026-10-22.json) | Machine-readable provenance for all 42 territory rows: service contracts, bounded-query treatment, selection rules, frame extents, coastline counts, identity decisions, rejected records, and limitations. The city test reconstructs every generated row from this register and requires exact equality. |
| `js/city-subsurface.js` loaders, hemisphere formatters, and coastline normalization; `js/city-gazetteer.js` `Bay`/`Island`/`Civil` metadata; coastline validation in `scripts/build-city-subsurface.mjs` | Existing single-polyline frames keep working, while island frames can supply disconnected polylines. Detail/HUD coordinates now choose `N/S` and `E/W` by sign. Guam has 2 coast lines, American Samoa 5, USVI 5, and Midway 3. |
| [`../resources/historical-network/keyhole-evidence-pack-2026-10-22.json`](../resources/historical-network/keyhole-evidence-pack-2026-10-22.json), [`../js/historical-network.js`](../js/historical-network.js), [`../scripts/build-historical-network.mjs`](../scripts/build-historical-network.mjs), generated data module, and [`../historical-network-viewer.html`](../historical-network-viewer.html) | **S6 Phase 0/1 slice:** an observation-first evidence pack (3 snapshots, 3 observations, 1 city-level place, 1 node, 0 edges, 2 merges, 2 rejected matches, 2 negative searches), validator/summary/search/merge rules, TEXTFILES-style local list parser, deterministic browser data generation, and a standalone records/source viewer with local import and JSON/CSV export. |
| TEXTFILES.COM 303 and NodelistDB checks recorded in the fixture and [`historical-network-keyhole-fixture-2026-10-22.md`](historical-network-keyhole-fixture-2026-10-22.md) | A separate retrospective compilation repeats Denver Keyhole BBS (`303-477-6337`, Denver, `1994-1996`), but doesn't identify its per-record source, so source independence from USBBS remains unresolved. Exact historical NodelistDB system/sysop searches found no Denver FidoNet match. The distinct 818 Greg Hiscott “The Keyhole BBS” is rejected rather than merged. |
| `tests/city-subsurface.test.mjs` and `tests/historical-network.test.mjs` | City file: 7 → 8 tests, with every territory bbox/ID/hemisphere/class/coastline/register/node contract pinned and the shared currency test expanded to twelve frames. New historical file: 7 tests covering generated-fixture equality, capture gating, coarse-place and name-only-merge rejection, parser output, merge assessment, search/CSV, and viewer wiring. |
| City/backlog/Keyhole docs, README files, backlog JSON, and rebuilt Wiki archive | S4 remains partial (remaining states, bulk California themes, country/planet); S6 remains partial (schema/slice done, captured bundled datasets still blocked); S7 remains externally blocked. |

## Territory registers and identity decisions

### Guam — 12 rows

Guam Island `1389704`; Hagåtña Civil `1389443`; Dededo `1389637`; Tamuning
`1390090`; Yigo `1390188`; Mangilao populated place `2414264`; Barrigada
`1389569`; Santa Rita populated place `1390020`; Inarajan `1389737`; Mount
Lamlam `1389785`; Apra Harbor Bay `1389489`; Talofofo River `1390088`.

Hagåtña is the round's clearest class trap. The Geocoder groups 1389443
under Counties & Political Divisions; GNIS Domestic Names and MapServer
return feature class **Civil**. It is not upgraded into a Populated Place.
Hagåtña CDP 2414024, Hagatna Election District 1927061, and West Hagåtña
Beach 1948047 are different records. Mangilao and Santa Rita likewise use
their populated-place IDs rather than election/CDP records.

### American Samoa — 12 rows

Pago Pago `1389119`; Fagatogo `1388792`; Tāfuna `1669450`; Nuʻuuli
`1389088`; Leone `1388922`; Ofu `1389091`; Olosega `1389103`; Ta‘ū
`1389249`; Tutuila Island `1389316`; Pago Pago Harbor `1389120`; Matafao
Peak `1389004`; Lata Mountain `1388875`.

The frame is **Tutuila–Manuʻa only**. Swains Island and Rose Atoll are
outside it. “Mount Lata” returned no GNIS result, while **Lata Mountain**
returned the exact Summit record. Tutuila Island preserves the service's
returned Eastern District county value as provenance; it is not a claim that
the island is contained in only that district.

### U.S. Virgin Islands — 12 rows

Charlotte Amalie `1613808`; Christiansted `1613811`; Frederiksted
`1613945`; Cruz Bay populated place `1613859`; Cruz Bay Bay `1613858`; Water
Island `1614413`; Buck Island `1613753`; Crown Mountain `1613857`; Bordeaux
Mountain `1613741`; Mount Eagle `1613894`; Magens Bay `1614115`;
Christiansted Harbor `1613812`.

Cruz Bay is deliberately present twice because the town and bay are distinct
records. Buck Island uses the Saint Croix record, not Saint Thomas record
1613754. Exact “Saint Thomas/Saint John/Saint Croix Island” searches returned
political-division records rather than physical Island records, so they were
not mislabeled as landforms.

### Midway — 6 rows

Midway Islands Island `1393085`; Sand Island `1393170`; Eastern Island
`1393009`; Welles Harbor `1393264`; Seward Roads `1393174`; Frigate Point
Cape `1393020`.

Midway Islands political-division record 1802699 (same returned point) and a
different Eastern Island record 1390268 (far outside the frame) were
rejected. Bounded exact searches for Spit Island, Midway Lagoon, Brooks
Channel, Henderson Field, Sand Islet, Middle Ground, North Point, Turtle
Beach, and West Beach returned no records, so none were seeded. Lagoon/reef/
channel lines are schematic `context` corridors only.

## Historical-network findings worth keeping

1. **A separate compilation is not automatically independent evidence.**
   TEXTFILES.COM is not USBBS, but “created … From Many Sources” does not
   say which source supplied the Keyhole line. The correct claim is
   “separate publication; underlying independence unresolved.”
2. **A retrospective span is one claim, not annual observations.** The 303
   list's `(1994-1996)` range extends the derived Keyhole span, but it should
   not be expanded into synthetic 1994, 1995, and 1996 sightings.
3. **Same-name BBSes are real.** The 818 “The Keyhole BBS” is exactly why
   canonicalization requires phone/locality/sysop evidence and why rejected
   matches belong in the data, not in a footnote.
4. **Negative archive searches need their query retained.** NodelistDB's
   exact system/sysop searches returned no Denver record, while a broad fuzzy
   query returned an irrelevant Barnaul node. Recording both prevents the
   fuzzy artifact from being mistaken for a candidate and prevents “not in
   this index” from becoming “never existed.”
5. **Capture readiness is a separate predicate from schema validity.** The
   fixture should render and test cleanly while still failing the bundled
   dataset gate because its snapshots are uncaptured, unhashed, and
   rights-restricted. `validateEvidencePack` encodes that distinction.
6. **A city-level source doesn't need an invented point.** Denver is stored
   with `lat: null`, `lon: null`, `coordinateBasis: "not-geocoded"`. If a
   later coarse coordinate is introduced, the validator requires a positive
   uncertainty radius and forbids exact-site semantics.

## Verification notes

- GNIS checks were retrieved on 2026-10-22 from the USGS Water Data GNIS
  Geocoder, with Hagåtña/class spot checks against GNIS Domestic Names and
  the National Map GNIS MapServer. Geocoder parameters included `term`,
  `states=GU|AS|VI`, `include=gnis`, and `maxSuggestions`; Midway used the
  bounded parameters identified in the public USGS `search_api` client.
- The city builder enforces 10-column rows, in-frame points, unique
  `name|fclass`, `VERIFIED=1 ⇒ numeric GNIS ID`, and finite coastline
  polylines. Territory rows additionally carry FEATURE_ID, service, date,
  primary-point wording, and a geometry limitation.
- Territory coastlines, relief, and corridors are schematic. They are not
  shoreline surveys, DEMs, territorial boundary masks, ferry routes, or
  navigation products.
- The historical viewer performs no external fetch. Locally imported BBS
  lists remain in the page/caller, and historical telephone numbers are
  displayed as dated text, never as dial links.

## Test tally at round-17 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — all 12 frames built; each XDC has 39 entries; absent optional DEM modules are reported for non-Lawrence frames |
| `npm run build:historical-network` / `--check` | PASS — browser data module is byte-current with the JSON fixture |
| `npm run build:wikiinajar` | PASS — 209 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| `tests/city-subsurface.test.mjs` (8 tests) | 8 PASS |
| `tests/historical-network.test.mjs` (7 tests) | 7 PASS |
| Targeted `city-subsurface` + `historical-network` + `wikiinajar` + `wikiinajar-docs-sync` + `wiki-webxdc` + `webxdc-packages` Node tests | 54 PASS |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 717 tests: 688 pass, 12 skipped, 17 fail. All 17 failures are the known environmental `tests/mealplan-applet-sim.test.mjs` cases, each `spawn …/bin/java ENOENT` because the sandbox has no bundled JDK. No other Node failures. |

## Next (round 18)

- **S4:** remaining states in dated, per-ID source-register batches now that
  California/Nevada/Arizona and the territories establish the recipe. Keep
  archived-class and bulk California layers behind explicit per-row sources.
- **S6:** capture one or more lawfully redistributable source snapshots
  under F3, hash the captured bytes, and only then promote an evidence pack
  toward `captureReady`. Continue seeking a contemporaneous Boardwatch or
  FidoNet capture for Denver Keyhole; do not treat NodelistDB absence as a
  final answer.
- **S7:** unchanged and externally blocked.
- **Gated:** DOSBox and external-host tasks remain under their existing
  F3/toolchain constraints.
