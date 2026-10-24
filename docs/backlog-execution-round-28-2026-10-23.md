# Backlog execution round 28 — 23 Oct 2026

*Twenty-eighth round: “Continue backlog.” This round follows the
round-27 queue entry: the Gulf/South Atlantic states continue with
**Georgia**, the first state east of Alabama on the Atlantic seaboard.
Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [26](backlog-execution-round-26-2026-10-23.md) ·
[27](backlog-execution-round-27-2026-10-23.md).*

## Scoping decision

Rounds 20–27 handed the queue the same instruction: remaining states in
**dated, per-row GNIS source-register batches**. Round 28 opens the South
Atlantic thread with **Georgia**, the state immediately east of
Alabama. The identity rule is unchanged: exact official name,
compatible returned type, intended state, returned primary county,
permanent FEATURE_ID, and returned primary point must all identify the
feature before `VERIFIED=1`; points are never described as boundaries,
shorelines, lake polygons, or river centerlines; ambiguous,
mismatched, duplicate, empty-screen, or out-of-reach features stay
unseeded or become generalized `context` corridors.

Round 28 also reconciled content that arrived on `main` through
**PR #134** (T3.1 Game Genie family, four new operations, twenty-one
new documents) while PR #137 was open; the merge tree's CyberChef
registry reads 515 operations while four count guards still said 511 —
details in “Merge-delta reconciliation” below.

## Delivered

| Frame | Result |
| --- | --- |
| **Georgia** (`georgia`) | Configuration 33. Twelve all-GNIS rows: Atlanta, Savannah, Augusta, Columbus, Macon, Athens, Brasstown Bald, Lake Seminole, Lake Oconee, Ocmulgee River, Oconee River, Altamaha River. Five context corridors (I-75, I-20, I-95, Savannah River reach, Chattahoochee reach) and four GNIS-backed nodes; labelled generalized Atlantic coast line (nine points). |
| [`../resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json) | Machine-readable batch-11 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules (including the new description-locator tie-break rule), thirteen identity decisions, and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root page, data/gazetteer packs, public staged app, and Webxdc bundle for Georgia. Every city XDC now contains **81 entries** (33 data + 33 gazetteer packs plus the shared shell/vendor set); georgia-subsurface.xdc is 538,071 bytes, sha256 `e153f1920ff2e6e3…`. |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe thirty-three configurations and the batch-11 evidence. |

## Identity findings

- **Georgia's high point cleared at the source.** Brasstown Bald
  (`354839`) returned a single exact Summit record in Towns County; the
  per-ID check against the official `gaznames_default` ArcGIS REST layer
  (the SPA detail route renders client-side) showed the description
  “Highest elevation in GA at **4784 feet**” at the stored point. Class
  `Summit` is stored as returned.
- **Lake Oconee's two-record tie-break.** The state screen returned two
  same-name Reservoir records: `330982` (Putnam County) and `319902`
  (Oconee County). The per-ID check shows `330982` carries the official
  description “Located 6 km (3.7 mi) ENE of Rockville” — placing it on
  the Putnam shore of the intended Oconee River reservoir — while
  `319902` has a blank description and a stored `gaz_elevation` of 221
  against 132. The register gains a selection rule for the pattern:
  duplicate same-name reservoir records seed only the record whose
  official description independently locates the intended feature; the
  blank-description twin is disclosed, never merged.
- **Savannah River: empty state screen, out-of-state national screen.**
  `states=GA` returned an empty array; the no-state national screen
  returns only the South Carolina record (`1253486`, Jasper County),
  which must not seed this frame. The river stays a generalized context
  corridor carrying the disclosure chain (fifth-state style, inverted:
  this time GA itself is empty).
- **Lake Lanier screened as a populated place.** The only
  `states=GA` record was “Lake Lanier Vista” (`1688216`, Cities &
  Populated Places); the alternate “Buford Reservoir” screen returned an
  empty array. The lake stays unseeded; Atlanta's anchor and the I-75
  corridor cover the area.
- **Chattahoochee held to starter scope with its record on file.**
  Single exact Streams & Canals record `354236` (Decatur County, Florida
  line) lost the roster slot to the Ocmulgee/Oconee/Altamaha chain; the
  corridor keeps the FEATURE_ID rather than dropping it. Ogeechee River
  (`354254`) is held the same way.
- **County/census-division-first piles everywhere.** Atlanta led with
  two division records plus Atlanta Junction; Columbus led with East/
  North/West + census divisions; Macon carried a five-record pile
  including the consolidated Macon-Bibb County record and Macon County;
  Savannah, Augusta, and Athens shed divisions, a canal, an arsenal,
  and three Athens-named water records (one returned for Rabun County).
  Every rejected FEATURE_ID is named in the row notes.
- **Ocmulgee + Oconee confluence pair.** Both exact Wheeler County
  records seed; their primary points sit about sixty metres apart at
  the shared confluence area, both as returned — neither treated as
  the other (the Alabama Tombigbee/Alabama pattern, mirrored).

## Merge-delta reconciliation (PR #134 → merge of #137)

The round-28 checkout is the merge of PR #137, whose merge tree also
contains PR #134 (T3.1 Game Genie family, merged to `main` while #137
was open): four new operations (`gameGenieNes`, `gameGenieSnes`,
`gameGenieGb`, `gameGenieGenesis`), twenty-one new documents, and the
canonical `POST_MERGE_OPS` list extended to 37 — but four other count
guards were left at 511 and the background `bake()` teardown race
surfaced:

- `tests/cyberchef-archive-headers.test.mjs` — registry length
  511 → 515.
- `tests/cyberchef-cookbook.test.mjs` — registry length 511 → 515 and
  the coverage string “511 of 511” → “515 of 515”.
- `public/apps/cookbook/index.html` — card text updated to 515/515 to
  match the guard.
- `tests/cyberchef-sfx.test.mjs` — `report.counts.mergedRuntime + 33`
  → `+ 37` with the Game Genie group documented (the registry-change
  workflow that normally updates these sites was not run on #134).
- `tests/cyberchef-barcode.test.mjs` and the cookbook counts test now
  stub `window.bake` the way the SFX suite already does: with the full
  registry selected, `applyRecipePacks` schedules the kitchen's
  background bake, which outlives `window.close()` in jsdom and rejects
  against a dead document. In a real browser the document stays alive;
  this is a harness teardown race, not an app defect.

The Wiki/docs page-count guard fails between docs edits and Wiki
rebuilds by design; round 28's rebuild absorbs both the twenty-one
merged documents and this record.

## Test tally at round-28 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 33 frames built; Georgia reports 12 gazetteer rows (12 verified), 5 corridors, 4 nodes; every city XDC has 81 entries |
| `node --test tests/city-subsurface.test.mjs` | 18/18 PASS (batch-11 plus both batch overview mirrors now reproduce the build's `project()` arithmetic bit-for-bit) |
| Full `node --test tests/*.test.mjs` | 806 tests: 796 pass, 10 skipped, 0 fail (after the Wiki rebuild below; the single remaining pre-rebuild failure was the docs page count) |
| Full `vitest run` | 35 files, 307/307 PASS |
| `npm run build:wikiinajar` | PASS — 244 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |

## Next

- South Atlantic continues: **South Carolina** (and then the remaining
  seaboard states northward), Florida's peninsula frames, then the
  country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their
  own explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21,
  evaluate OpenJVM-Wasm only in isolation, keep Ghidra distributions
  on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7
  remains blocked on its missing binary/teardown/driver artifacts.
- Carry the PR #134 reconciliation forward: any future op-count change
  must update *all* five count sites (recipe-sync list, SFX constant,
  archive-headers, cookbook guard + card) or the suites go red again.
