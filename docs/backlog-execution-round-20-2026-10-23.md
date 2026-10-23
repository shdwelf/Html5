# Backlog execution round 20 — 23 Oct 2026

*Twentieth round: “Continue backlog.” This round resumes the S4 geographic
queue after the round-19 JDK/inlined-SoCal work. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Previous rounds: [18](backlog-execution-round-18-2026-10-22.md) ·
[19](backlog-execution-round-19-2026-10-23.md).*

## Scoping decision

Round 18 and the round-19 status both left the same next S4 step: remaining
states in **dated, per-row GNIS source-register batches**. Round 20 takes the
Pacific Northwest batch—**Oregon, Washington, and Idaho**—because those three
states complete the western state sequence already established by California,
Nevada, Arizona, Utah, Colorado, and New Mexico.

The identity rule did not change:

- a row is `VERIFIED=1` only when exact official name, compatible returned
  GNIS type, intended state, returned primary county, permanent FEATURE_ID,
  and returned primary point all identify the intended feature;
- a GNIS point is never described as a boundary, address geocode, shoreline,
  lake polygon, summit outline, watershed, or river centerline;
- ambiguous or state-screen-unreturned features remain unseeded and may be
  shown only as generalized `context` corridors;
- statewide terrain is labelled synthetic relief, not a DEM or a
  state-boundary mask.

## Delivered

| Frame | Result |
| --- | --- |
| **Oregon** (`oregon`) | Configuration 16. Twelve all-GNIS rows: Salem, Portland, Eugene, Bend, Medford, Astoria, Mount Hood, Mount Jefferson, Crater Lake, Willamette River, Deschutes River, and Columbia River. Includes one generalized Pacific coast line, four context corridors, and four GNIS-backed nodes. |
| **Washington** (`washington`) | Configuration 17. Twelve all-GNIS rows: Olympia, Seattle, Spokane, Tacoma, Vancouver, Yakima, Mount Rainier, Mount Saint Helens, Lake Chelan, Lake Washington, Snake River, and Skagit River. Includes two generalized outer-coast/Puget lines, four context corridors, and four GNIS-backed nodes. |
| **Idaho** (`idaho`) | Configuration 18. Twelve all-GNIS rows: Boise, Idaho Falls, Pocatello, Coeur d'Alene, Twin Falls, Lewiston, Borah Peak, Hyndman Peak, Lake Pend Oreille, Coeur d'Alene Lake, Salmon River, and Clearwater River. Includes four context corridors and four GNIS-backed nodes. |
| [`../resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json) | Machine-readable batch-3 register: row-level FEATURE_IDs, returned Geocoder types/counties, stored points, source notes, selection rules, identity decisions, and limitations. The city test reconstructs every generated gazetteer row from it exactly. |
| Generated apps | Root pages, data/gazetteer packs, public staged apps, and Webxdc bundles for all three states. Because every city bundle carries every data/gazetteer pack, all eighteen city XDCs now contain 51 entries. |
| Docs/backlog | [`city-subsurface.md`](city-subsurface.md), root README, backlog MD/JSON, docs index, and the Wiki archive now describe eighteen configurations and the batch-3 evidence. |

## Identity findings

- **Mount Hood is two nearby exact-name features.** The Summit record
  `1143711` was seeded; the same-name populated place `1143710` and division
  were rejected.
- **Crater Lake is a three-way same-name screen.** The intended Klamath
  County caldera lake `1163669` was seeded rather than Baker County
  `1140396` or Malheur County `1119515`.
- **Rogue River was left out of the Oregon starter set.** Its screen returned
  Curry County Stream `1148698` and Polk County Stream `1148699`; the batch
  already had identity-safe Willamette, Deschutes, and Columbia records, so
  no same-name choice was needed.
- **Columbia River demonstrates why the state filter matters.** The exact
  record `1140014` was returned under `states=OR` with Clatsop County, while
  `states=WA` returned an empty array. It is therefore a gazetteer row only
  in Oregon and a generalized corridor in Washington.
- **Spokane River was not seeded.** Two exact Stream records (`1508606` and
  `391131`) have nearby mouth-area points; the suggestion screen alone does
  not distinguish a statewide starter record safely.
- **Snake River demonstrates the reverse state-screen case.** The exact
  record `1533479` was returned under `states=WA`; the Idaho screen returned
  canal/plain/valley/canyon records but not the intended stream. It is a
  gazetteer row only in Washington and a generalized corridor in Idaho.
- **Bear Lake remains unseeded, now on both sides of its state line.** Utah
  omitted it in round 18; the Idaho screen returned several small same-name
  lakes but not an identity-safe returned record for the intended large
  Bear Lake County lake.
- **Coeur d'Alene city and lake are separate features.** Both are seeded in
  their own classes; the river record is not conflated with either point.
- **Twin Falls city is not Twin Falls waterfall.** The populated-place record
  was seeded and its note names the separate Falls record.

## Test tally at round-20 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — 18 frames built; Oregon/Washington/Idaho each report 12 gazetteer rows (12 verified), 4 corridors, and 4 nodes; every city XDC has 51 entries |
| `node --test tests/city-subsurface.test.mjs` | 10/10 PASS (after `npm ci --ignore-scripts` supplied jsdom in the fresh sandbox) |
| `npm run build:wikiinajar` | PASS — 215 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 723 tests: 713 pass, 10 skipped, 0 fail |

## Next

- Continue the remaining states in dated per-row GNIS batches; Montana and
  Wyoming are the natural geographic continuation, followed by the Dakotas/
  Nebraska/Kansas plains sequence before the country/planet thread.
- Keep bulk California themes and archived-class features behind their own
  explicit source decisions and registers.
- The round-19 JDK queue remains: relay official current Temurin 8/21 with
  recorded hashes, evaluate OpenJVM-Wasm only in isolation, and keep Ghidra
  distributions on the CI/relay route.
- S6 still needs lawfully redistributable historical snapshots before any
  bundled FidoNet/ARPANET/payphone dataset or route edges; S7 remains blocked
  on its missing binary/teardown/driver artifacts.
