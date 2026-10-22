# Backlog execution round 18 — 22 Oct 2026

*Eighteenth round: “Continue backlog and merge the pull request” — the
round-17 queue on PR #131: the next dated state-source-register batch and
the lawful-capture path for historical-network adapters. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md) · [13](backlog-execution-round-13-2026-10-22.md) ·
[14](backlog-execution-round-14-2026-10-22.md) · [15](backlog-execution-round-15-2026-10-22.md) ·
[16](backlog-execution-round-16-2026-10-22.md) · [17](backlog-execution-round-17-2026-10-22.md).*

## Scoping decisions (recorded before implementation)

- **The state batch completes the Four Corners.** Utah, Colorado, and New
  Mexico join Arizona as a geographically coherent second batch rather
  than a scatter of unrelated state starts. Each gets the same 12-row,
  all-GNIS starter treatment as Nevada and Arizona.
- **Per-ID evidence remains the gate.** A state row is `VERIFIED=1` only
  when exact official name, returned Geocoder type, state, returned primary
  county, permanent FEATURE_ID, and returned GNIS primary point identify
  the intended feature. Political divisions, same-name towns/streams,
  ranges versus peaks, and ambiguous duplicate records do not substitute.
- **Ambiguous major rivers stay corridors.** It is better for Pecos River
  to be absent from the New Mexico gazetteer than to pick arbitrarily
  between two Eddy County `Stream` records. Likewise, exact Arkansas, Rio
  Grande, San Juan, and Canadian river records were not invented when the
  state-filtered Geocoder screens did not return them.
- **South Platte gets a per-ID detail check.** Its returned primary-county
  value and sequence-1 point look discordant. GNIS Domestic Names resolves
  the feature identity but preserves the discrepancy as returned-field
  provenance instead of silently turning it into a point-county claim.
- **The S6 adapter implements the standard, not a dataset claim.**
  FTS-5000 is public domain, but historical nodelist compilations are not
  thereby public domain. Checked nodelist prologues grant intra-FidoNet
  use/distribution and reserve other uses absent express written consent.
  Round 18 therefore ships a local importer, diff engine, and hashing,
  with synthetic tests—not a transformed historical nodelist.
- **Nodediffs need two inputs.** A diff without its exact previous edition
  is not a snapshot. The viewer detects one and refuses to fabricate a
  list; shared callers use edition-checked two-input application.
- **S7 unchanged.** It remains externally blocked on a gina.dll binary +
  JDK/Ghidra, physical teardown data, or proprietary GoldKey drivers.

## Delivered

| Artifact | What it closes / establishes |
| --- | --- |
| `utah`, `colorado`, and `newmexico` configs in `resources/city-subsurface/cities.json`; generated pages/data/gazetteer packs, three new XDCs, and all fifteen city XDCs rebuilt | **S4 Four Corners batch:** city-subsurface now has fifteen configurations. Utah, Colorado, and New Mexico each ship 12/12 verified GNIS rows, four labelled synthetic-relief context corridors, and scene nodes pinned to gazetteer GNIS points. |
| [`../resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json) | Machine-readable provenance for all 36 batch-2 rows: Geocoder type/county, class mappings, point basis, frame extents, identity decisions, explicit exclusions, and limitations. The city test reconstructs every generated row from this register exactly. |
| `js/city-subsurface.js` data/gazetteer/optional-DEM loader entries for the three frames | The new frames use the same shared engine and variable-specifier optional-DEM fallback; no DEM is stubbed or claimed. |
| [`../js/historical-network.js`](../js/historical-network.js) FidoNet adapter | **S6 Phase 2 local tooling:** FTS-5000 nodelist parser (branch context, `zone:net/node`, flags, `Pvt`/`Hold`/`Down`, `-Unpublished-`, header date/day/CRC metadata), A/C/D nodediff + chain application, import-format detection, address/flag search and CSV fields, and `sha256Hex`. |
| [`../historical-network-viewer.html`](../historical-network-viewer.html) local-import upgrade | Auto-detects TEXTFILES versus FidoNet lists, parses complete nodelists locally, computes SHA-256 over original file bytes or edited textarea UTF-8, records byte length in the downloaded snapshot, and refuses to treat a standalone nodediff as a list. |
| [`historical-network-fidonet-adapter-2026-10-22.md`](historical-network-fidonet-adapter-2026-10-22.md) | Rights and semantics contract: FTS grammar versus nodelist compilation rights; local-only status; branch records are not physical edges; header CRC is parsed, not verified; hashed local packs remain `captureReady: false`. |
| `tests/city-subsurface.test.mjs` and `tests/historical-network.test.mjs` | City file: 8 → 9 tests, with all fifteen frames in the bundle-currency test and every batch-2 bbox/ID/class/register/node/exclusion/loader contract pinned. Historical file: 7 → 9 tests, adding synthetic nodelist address/status/hash and nodediff wrong-edition/partial-edit contracts. |
| City/historical/backlog docs, README files, backlog JSON, and rebuilt Wiki archive | S4 remains partial (remaining states, bulk California themes, country/planet); S6 remains partial (adapter done, bundled historical snapshots/datasets still rights/capture blocked); S7 remains externally blocked. |

## Four Corners registers and identity decisions

### Utah — 12 rows

Salt Lake City `1454997`; Provo `1444661`; Ogden `1444049`; Saint George
`1455098`; Moab `1430389`; Logan `1442849`; Great Salt Lake `1441459`;
Utah Lake `1446894`; Green River Stream `1428399`; Sevier River `1445451`;
Kings Peak `1442332`; Bonneville Salt Flats `1425872`.

Green River uses the Stream record, not the same-name populated place
`1428398` or division `1939372`. Great Salt Lake does not borrow the Great
Salt Lake Desert point. Bear Lake is omitted: the state screen returned
same-name records in Duchesne, Garfield, Rich, and Summit counties,
including two distinct Rich County IDs, so selecting “the” Bear Lake would
have required a per-ID treatment beyond this starter batch.

Utah's frame is lon −114.25…−108.85, lat 36.95…42.05. Those are modest
rectangular display margins around the state, not a surveyed boundary.
The margin also keeps Utah above the shared builder's city-scale camera
floors without changing its evidence coordinates.

### Colorado — 12 rows

Denver `201738`; Colorado Springs `204797`; Boulder `178680`; Fort Collins
`204673`; Aspen `204686`; Durango `202983`; Mount Elbert `180381`; Pikes
Peak `204770`; South Platte River `201759`; Grand Lake `204950`; Blue Mesa
Reservoir `186973`; San Luis Valley `1930540`.

Grand Lake is the lake record `204950`, not the populated place `202505`.
Mount Elbert is the Summit, not Mount Elbert Forebay. South Platte River's
per-ID Domestic Names detail confirms `Class=Stream`, describes the
439-mile tributary of the North Platte, and gives the stored coordinate as
sequence 1. Its Primary County field says Logan County even though
sequence 1 is from the Deckers map in the headwaters area; the generated
row preserves Logan as returned primary-county provenance and expressly
does not claim it is the sequence-1 point county.

Colorado, Arkansas, and Rio Grande rivers appear only as generalized
corridors. The Colorado River FEATURE_ID `45730` primary point is outside
the frame. Under `states=CO`, Arkansas River returned Arkansas River
Canyon rather than the stream, and Rio Grande returned the county/canals/
reservoir rather than the exact stream record.

### New Mexico — 12 rows

Santa Fe `936823`; Albuquerque `928679`; Las Cruces `899715`; Roswell
`894171`; Farmington `902246`; Taos `911545`; Wheeler Peak `928839`;
Sierra Blanca Peak `920702`; Elephant Butte Reservoir `888840`; Rio Chama
`923661`; Animas River `900284`; Conchas Lake `897344`.

Sierra Blanca Peak is the Summit record, not the near-coincident Sierra
Blanca mountain-range record `912567`. Animas River is the San Juan County
stream, not Hidalgo County's same-name `900283`. Wheeler Peak is New
Mexico's Taos County high point, not Nevada's Wheeler Peak `861956`.

Pecos River is the round's most important non-seed. The Geocoder returned
three Eddy County records named Pecos River. Domestic Names identifies
`900170` as `Canal`, while both `900171` and `900172` are `Stream`, each
with nearby Lake McMillan-area coordinate sequences. Neither Stream record
is distinguished as the statewide river record, so Pecos remains a
generalized corridor with that reason in the generated data and register.
Rio Grande and San Juan River likewise remain corridors because their
exact stream records were not returned by the `states=NM` screens.

## Historical-network findings worth keeping

1. **A public-domain file-format standard does not make its historical
   data public domain.** FTS-5000 can be implemented freely; downloaded
   nodelist compilations retain their own prologue/contributor terms.
2. **A hash is not a rights grant.** SHA-256 over local bytes strengthens
   capture integrity and round-tripping, but a rights-restricted local
   import still fails the repository's `captureReady` gate.
3. **A nodediff is an edit script with a parent-edition precondition.**
   Exact first-line matching, bounded A/C/D counts, complete consumption,
   and chain stop-on-error are evidence protections, not parser pedantry.
4. **Hierarchy is not geometry.** Zone/Region/Host/Hub branch records
   establish source-stated administrative context and addressing. They do
   not by themselves prove a mail session, physical link, cable route, or
   location coordinate.
5. **Historical status fields matter.** `Pvt`, `Hold`, `Down`, and
   `-Unpublished-` remain visible observations and non-contact states;
   dropping them would recreate the false “still dialable directory”
   failure the S6 viewer was designed to avoid.
6. **CRC metadata is not CRC verification.** The FTS special-header value
   is preserved, but no algorithm variant or published-vector check was
   established this round. Output must say “parsed, not verified.”

## Verification notes

- GNIS checks were retrieved on 2026-10-22 from the USGS Water Data GNIS
  Geocoder using exact candidate terms with `states=UT|CO|NM`,
  `include=gnis`, and bounded suggestion counts. South Platte River and
  the three Pecos candidates were additionally checked in GNIS Domestic
  Names by FEATURE_ID.
- The city builder enforces 10-column rows, in-frame points, unique
  `name|fclass`, and `VERIFIED=1 ⇒ numeric GNIS ID`. Batch-2 tests
  additionally pin FEATURE_IDs, dated service notes, primary-point limits,
  exact register reconstruction, returned Geocoder type/county,
  scale-aware views, node-point reuse, loader entries, and exclusions.
- State relief and corridors are schematic. They are not DEMs, state
  boundary masks, river centerlines, shorelines, or highway alignments.
- FidoNet tests use wholly synthetic `Example_*` systems and 555 numbers;
  no historical nodelist text, Keyhole observation, node, or edge was
  added. The viewer still makes no external fetch for imported material
  and creates no dial links.
- A local Vite preview returned HTTP 200 for the Utah, Colorado, and New
  Mexico pages, the historical-network viewer, and their generated JS
  packs.

## Test tally at round-18 close

| Suite | Result |
| --- | --- |
| `npm run build:city-subsurface` | PASS — all 15 frames built; each XDC has 45 entries; absent optional DEM modules are reported for non-Lawrence frames |
| `npm run build:historical-network` / `--check` | PASS — exercised by the generated-fixture contract test |
| `npm run build:wikiinajar` | PASS — 211 Markdown files converted to Wiki pages; `wikiinajar.xdc` rebuilt |
| `tests/city-subsurface.test.mjs` (9 tests) | 9 PASS |
| `tests/historical-network.test.mjs` (9 tests) | 9 PASS |
| Targeted `city-subsurface` + `historical-network` + `webxdc-packages` Node tests | 30 PASS |
| Targeted city + historical + Wiki/docs-sync/Webxdc Node tests | 57 PASS |
| Full `vitest run` | 35 files, 307/307 PASS |
| Full `node --test tests/*.test.mjs` | 720 tests: 691 pass, 12 skipped, 17 fail. All 17 failures are the known environmental `tests/mealplan-applet-sim.test.mjs` cases, each `spawn …/bin/java ENOENT` because the sandbox has no bundled JDK. No other Node failures. |

## Next (round 19)

- **S4:** continue remaining states in dated per-ID batches (a Pacific
  Northwest or northern Mountain/Plains batch is the natural next source
  register). Keep archived-class California features and bulk themes
  behind explicit dated source decisions.
- **S6:** obtain a lawfully redistributable historical snapshot (and, for
  FidoNet, an applicable diff chain), then design snapshot-diff review and
  administrative-versus-mail-route edge semantics before deriving nodes
  or edges. Continue seeking contemporaneous Boardwatch evidence for
  Keyhole without treating negative index searches as final.
- **S7:** unchanged and externally blocked.
- **Gated:** external-host and JDK-dependent work remains under F3 and the
  known sandbox constraints.
