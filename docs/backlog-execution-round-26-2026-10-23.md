# Backlog execution round 26 — 23 Oct 2026

*Twenty-sixth round: “continue backlog.” This round follows the round-25
queue entry exactly: **Minnesota closes the West North Central division**,
and the Gulf thread opens with **Louisiana**. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [24](backlog-execution-round-24-2026-10-23.md) ·
[25](backlog-execution-round-25-2026-10-23.md).*

## Scoping decision

Rounds 20–25 handed the queue the same instruction: remaining states in
**dated, per-row GNIS source-register batches**. Round 26 delivers two
frames: **Minnesota** (completing the nine-state West North Central
division begun in rounds 18–23) and **Louisiana** (the first Gulf state
after the round-24 Southern Plains pair). The identity rule is unchanged:
exact official name, compatible returned type, intended state, returned
primary county, permanent FEATURE_ID, and returned primary point must all
identify the feature before `VERIFIED=1`; points are never described as
boundaries, shorelines, lake polygons, or river centerlines; ambiguous,
mismatched, out-of-state-primary, or state-screen-unreturned features stay
unseeded or become generalized `context` corridors.

## Delivered

| Frame | Result |
| --- | --- |
| **Minnesota** (`minnesota`) | Configuration 29. Twelve all-GNIS rows: Saint Paul, Minneapolis, Duluth, Rochester, Mankato, Saint Cloud, International Falls, Eagle Mountain, Lake of the Woods, Mille Lacs Lake, Lake Minnetonka, and Minnesota River. Five context corridors (I-35, I-90, I-94, Mississippi headwaters reach, Red River of the North reach) and four GNIS-backed nodes. |
| **Louisiana** (`louisiana`) | Configuration 30. Twelve all-GNIS rows: New Orleans, Baton Rouge, Shreveport, Lafayette, Lake Charles, Natchitoches, Driskill Mountain, Lake Pontchartrain, Lake Maurepas, **Mississippi River (first seeded statewide row)**, Atchafalaya River, and Red River. Four context corridors (I-10, I-20, and the two seeded river reaches) and four GNIS-backed nodes; a labelled generalized Gulf coast line, not a shoreline survey. |
| [`../resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json) | Machine-readable batch-9 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, fourteen identity decisions (including three known service discrepancies), and limitations. The city test reconstructs every generated row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for both states. Every city XDC now contains 75 entries (30 data + 30 gazetteer packs plus the shared shell/vendor set). |
| Docs/backlog | `city-subsurface.md`, root README, backlog MD/JSON, docs index, and the Wiki archive describe thirty configurations and the batch-9 evidence. |

## Identity findings

- **Eagle Mountain needed the fullest disambiguation yet.** The MN screen
  returned **three exact-name Summit records** and listed the undesignated
  Lutsen-quad summit (`656080`) first. Per-ID checks show the state
  high-point description — “Highest elevation in MN at 2301 feet. Located
  20 mi NW of Grand Marais.” — sits on `656081` (the second suggestion,
  Eagle Mountain quad, sequence 1 marked High Point); the Lutsen record
  and the Todd County namesake (`643035`) are rejected. Suggestion order
  is not identity evidence.
- **Lake of the Woods carries a 1911/1953 Board-decision record.** `654378`
  has 18 coordinate sequences and both official Board decisions; the 2001
  single-point text duplicate (`1930543`), the county, and the Sherburne
  County same-name swamp are rejected.
- **The Mississippi River finally seeds — in Louisiana.** `1629903` at the
  returned Plaquemines Parish sequence is the first seeded row after three
  distinct failure modes: Iowa empty, Missouri name mismatch (“Mississippi
  River Hills”), Minnesota type mismatch (Mississippi River *Reservoir*
  only).
- **The four-state Red River saga closes in Louisiana.** ND/OK empty → TX
  Brown County rejected → MN exact record whose returned primary sits in
  Canada (the per-ID check marks sequence 1 with no state; MN sequences
  exist but were not the returned primary) → LA West Feliciana stream
  `558728` seeds. The Minnesota frame draws a disclosed border corridor.
- **St./Saint gates: two more pairs.** `St. Paul` and `St. Cloud` both
  returned empty under `states=MN`; the Saint spellings are the official
  names — the fourth such gate after St. Louis and St. Joseph (round 25).
- **New same-name traps resolved:** Lafayette and Natchitoches reject their
  parish records; Lake Charles rejects its same-name lake (identity-safe,
  starter scope); Monroe is omitted as two indistinguishable populated
  places (Ouachita vs Union); Mille Lacs resolves via the official name
  “Mille Lacs Lake”; Duluth/Minneapolis/Rochester/Saint Paul reject their
  airport/military/shore piles. Driskill Mountain per-ID confirms “Highest
  elevation in LA at 535 feet.” Lake Superior, St. Croix River (MN) and
  Toledo Bend Reservoir (LA, both terms) screened empty; Rainy Lake holds
  as a four-way ambiguity.

## Test tally at round-26 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 30 frames built; Minnesota/Louisiana each report 12 gazetteer rows (12 verified), 5/4 corridors, 4 nodes; every city XDC has 75 entries |
| `node --test tests/city-subsurface.test.mjs` | 16/16 PASS |
| `npm run build:wikiinajar` | PASS — 221 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 729 tests: 719 pass, 10 skipped, 0 fail |

## Next

- The West North Central division is **closed**; the Gulf/South Atlantic
  thread continues (Mississippi/Alabama/Georgia …), then Florida’s
  peninsula frames, then the country/PC Globe thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions.
- Unchanged from round 19: relay official current Temurin 8/21, evaluate
  OpenJVM-Wasm only in isolation, keep Ghidra distributions on CI/relay.
- S6 still needs lawfully redistributable historical snapshots; S7 remains
  blocked on its missing binary/teardown/driver artifacts.
