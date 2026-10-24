# Backlog execution round 27 — 23 Oct 2026

*Twenty-seventh round: “Continue backlog.” This round follows the
round-26 queue entry: the **Gulf/South Atlantic states** open with
**Mississippi and Alabama**. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [25](backlog-execution-round-25-2026-10-23.md) ·
[26](backlog-execution-round-26-2026-10-23.md).*

## Scoping decision

Rounds 20–26 handed the queue the same instruction: remaining states in
**dated, per-row GNIS source-register batches**. Round 27 begins the
Gulf coast thread with the two states immediately east of the round-24
Texas frame: **Mississippi** and **Alabama**. The identity rule is
unchanged: exact official name, compatible returned type, intended state,
returned primary county, permanent FEATURE_ID, and returned primary point
must all identify the feature before `VERIFIED=1`; points are never
described as boundaries, shorelines, lake polygons, or river centerlines;
ambiguous, mismatched, duplicate, empty-screen, or out-of-reach features
stay unseeded or become generalized `context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **Mississippi** (`mississippi`) | Configuration 31. Twelve all-GNIS rows: Jackson, Gulfport, Biloxi, Hattiesburg, Tupelo, Vicksburg, Woodall Mountain, Sardis Lake, Ross R Barnett Reservoir, Yazoo River, Big Black River, and Pascagoula River. Four context corridors (I-55, I-20, I-10, Mississippi west-border reach) and four GNIS-backed nodes; labelled generalized Gulf coast line. |
| **Alabama** (`alabama`) | Configuration 32. Twelve all-GNIS rows: Montgomery, Birmingham, Mobile, Huntsville, Tuscaloosa, Dothan, Cheaha Mountain, Guntersville Lake, Wheeler Lake, Alabama River, Tombigbee River, and Mobile River. Five context corridors (I-65, I-20, I-10, Alabama River, Tombigbee River) and four GNIS-backed nodes; labelled generalized Gulf coast line with the Mobile Bay mouth notch. |
| [`../resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json) | Machine-readable batch-10 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules (including the new duplicate-record tie-break rule), thirteen identity decisions, and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 79 entries (32 data + 32 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe thirty-two configurations and the batch-10 evidence. |

## Identity findings

- **Both state high points again needed per-ID checks.** Woodall Mountain
  (`692362`) — “Highest elevation in MS at **806 feet**”, High Point
  sequence 1 at the stored coordinate, variants Bear Mountain and
  Woodalls Mountain; Cheaha Mountain (`159374`) — “Highest elevation in
  AL at **2407 feet**”, 1906 Board Decision, variants Blue Mountain,
  Che-aw-ha/Che-haw-haw/Chehaw Mountain and Shinbone Mountain. (Recalled
  elevations for both were wrong; the per-ID descriptions are canonical.)
- **Two lake pairs resolved by decision cards.** Guntersville Lake seeds
  `119508` (Marshall, Guntersville Dam quadrangle, decision-card PDFs
  1952+1954, dam point) while the parallel Jackson County record `1286448`
  (20 sequences, its own 1952 decision row, no cards) is disclosed as the
  same impoundment’s duplicate — suggestion order listed the duplicate
  first. Wheeler Lake seeds `112837` (Limestone, 1954 decision card,
  17 sequences including the Wheeler Dam sequence) while `131097`
  (Chambers County, entered 2003 on the Lafayette quadrangle, point on
  the Georgia border) is a **separate same-name feature**, not the
  intended reservoir. The register gains an explicit selection rule for
  both patterns.
- **The Mississippi main stem stays corridor-only in its own state.**
  Fifth state screen: IA empty → MO name mismatch → MN type mismatch →
  LA success (Plaquemines) → **MS empty array**. Tombigbee is likewise
  empty under MS but seeds in Alabama (`158094`); its primary point sits
  ~100 m from the Alabama River’s at their shared confluence, both as
  returned. Pearl River’s states=MS screen returns only the county, the
  Neshoba County town, and a census record — no stream — so it stays
  unseeded.
- **County/division-first trap piles everywhere.** Jackson (MS) led with
  Jackson County and returned ten same-prefix records (landing, branch,
  cut-off, three creeks, two bayous) before the capital. All six Alabama
  cities led with county or census-division records: Montgomery rejected
  a nine-record pile (county, division, hill, east, three lakes, creek,
  Tuscaloosa-county lakes), Mobile rejected county/division/junction/
  heights and four channel records while its river seeds separately, and
  Birmingham, Huntsville, Tuscaloosa, and Dothan each shed their division
  or county twins. Stream screens hid exact records behind cutoffs,
  canals, and estates (Yazoo, Big Black, Pascagoula), all recorded.
- **Ross R. punctuation gate.** The term “Ross R. Barnett Reservoir”
  returned the period-less official name “Ross R Barnett Reservoir” —
  identity taken from the returned record, the same treatment as the
  round-24 Grand Lake apostrophe. Lake Martin screened empty; Grenada
  Lake holds to starter scope (Waterloo/Salina/Lake Charles chain).

## Test tally at round-27 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 32 frames built; Mississippi/Alabama each report 12 gazetteer rows (12 verified), 4/5 corridors, 4 nodes; every city XDC has 79 entries |
| `node --test tests/city-subsurface.test.mjs` | 17/17 PASS (batch-10 pins the build’s exact overview-framing contract for narrow frames at the 20/32 floor) |
| `npm run build:wikiinajar` | PASS — 222 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS (one transient failure on the first run cleared on two consecutive reruns; recorded per the skip-blip practice) |
| Full `node --test tests/*.test.mjs` | 730 tests: 720 pass, 10 skipped, 0 fail |

## Next

- Gulf/South Atlantic continues: **Georgia** (and then Florida’s
  peninsula frames), then the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
