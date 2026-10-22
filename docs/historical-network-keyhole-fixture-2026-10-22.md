# Historical network — Keyhole Phase 0 fixture and local-import slice

*Round 17 implementation note, 2026-10-22. This advances backlog stream S6
from the Round 16 scope to a tested observation schema, one-system evidence
fixture, standalone viewer, and local BBS-list adapter. It does **not** seed
a bundled ARPANET, FidoNet, BBS, or payphone dataset.*

*Round 18 update: a local-only FTS-5000 FidoNet nodelist/nodediff adapter and
browser SHA-256 capture metadata were added; see
[`historical-network-fidonet-adapter-2026-10-22.md`](historical-network-fidonet-adapter-2026-10-22.md).
No historical nodelist was parsed into this fixture and the Keyhole evidence
conclusion below is unchanged.*

## What shipped

| Artifact | Purpose |
| --- | --- |
| [`resources/historical-network/keyhole-evidence-pack-2026-10-22.json`](../resources/historical-network/keyhole-evidence-pack-2026-10-22.json) | Canonical Phase 0 evidence fixture: three snapshots, three Keyhole observations, one city-level place, one canonical node, zero edges, two merge decisions, two rejected matches, and two negative searches. |
| [`js/historical-network.js`](../js/historical-network.js) | Pure validator, summary/search helpers, merge-candidate rules, TEXTFILES-style historical-list parser, observation CSV export, and—from Round 18—FTS-5000 FidoNet nodelist/nodediff adapters plus a SHA-256 helper. |
| [`scripts/build-historical-network.mjs`](../scripts/build-historical-network.mjs) | Deterministic JSON → browser data-module builder, with `--check`. Run `npm run build:historical-network` after editing the fixture. |
| [`js/historical-network-keyhole-data.js`](../js/historical-network-keyhole-data.js) | Generated browser module; tests require it to deep-equal the JSON fixture. |
| [`historical-network-viewer.html`](../historical-network-viewer.html) | Standalone one-system records/place/topology slice with snapshot/year/search controls, a source drawer, merge log, negative searches, exports, and local list import. |
| [`tests/historical-network.test.mjs`](../tests/historical-network.test.mjs) | Contract tests for generation, capture gating, place precision, name-only merge rejection, parser behavior, search/CSV, and the viewer shell. |

## Rights decision (resolved conservatively)

Round 16 recovered the USBBS header terms from `USBBS134.LST`: free
distribution of the list, but no remuneration, modifications/additions, or
bundling with another product/service without express written permission.
Round 17 adopts the safe interpretation:

1. USBBS remains **citation-only** in this repository.
2. The fixture may carry only the short factual Keyhole fields/excerpt needed
   to test the evidence schema. It must not grow into a transformed USBBS
   dataset.
3. Bulk BBS-list ingestion is **local-import-only**: a user supplies a list;
   the viewer parses it in the browser and does not upload or redistribute
   it.
4. TEXTFILES.COM's retrospective 303 compilation has no redistribution basis
   established here, so it receives the same one-record citation/local-import
   treatment.

The validator makes this machine-visible. The fixture returns
`valid: true` but `captureReady: false`: all three snapshots are uncaptured
citations, `sha256` is null, and their rights statuses block bundled
redistribution. A future bundled dataset needs a locally captured snapshot,
its captured-byte SHA-256, and `rightsStatus: "bundling-permitted"`.

## Evidence findings added in Round 17

### TEXTFILES.COM 303 historical list

The “Historical List of BBSes in the 303 Area Code,” headed “Created by
TEXTFILES.COM From Many Sources,” contains:

```text
303-477-6337 | Keyhole BBS
              | DENVER, CO (1994-1996)
```

This is a real advance, with a qualification that must not be dropped:

- It is a **separate publication** from USBBS.
- It repeats the same phone, board name, and city and adds a retrospective
  **1994–1996** activity span.
- It does not print the per-record source. Therefore it is evidence from a
  separate compilation, but **independence of the underlying observation
  from USBBS is unresolved**.
- The date span is one retrospective claim, not three dated observations.

The merge log therefore assigns it a lower confidence (0.86) and labels its
independence `separate-publication-underlying-source-unresolved`, rather
than calling it the still-missing fully independent contemporaneous listing.

### A distinct same-name Keyhole BBS

Indexed text for *THE BBS List 02-94* includes “The Keyhole BBS” at
`818-545-0870`, sysop Greg Hiscott, running XBBS. That record proves why the
schema forbids name-only merging: it is not merged with Linda McCraw's
Denver `303-477-6337` board. It is stored as a rejected match and as a
parser/merge test case.

### FidoNet archive check

On 2026-10-22 the NodelistDB historical API was searched with
`latest_only=false` for `system_name=Keyhole BBS`, `system_name=Keyhole_BBS`,
`sysop_name=Linda McCraw`, and `sysop_name=Linda_McCraw`. No exact Denver
Keyhole match was returned. A broader `system_name=Keyhole` query returned
an irrelevant fuzzy Phoenix/Barnaul node (`2:5002/21`), which is recorded as
a search artifact. This is a negative result over that indexed archive, not
proof the board never had a FidoNet listing. No FidoNet address, node, or
edge is seeded.

### Boardwatch

Exact indexed searches for the historical number/name/sysop with Boardwatch
variants still did not locate a Boardwatch listing. That remains a negative
search result, not a claim of nonexistence.

## Local importer contract

`parseTextfilesHistoricalList(text, options)` handles the TEXTFILES
area-code list shape:

```text
303-477-6337 | Keyhole BBS
              | DENVER, CO (1994-1996)
        SYSOP | Linda McCraw
     SOFTWARE | ExampleBBS
     COMMENTS | Wrapped comments continue on
              | following pipe lines
--------------+-----------------------------------------------------------
```

It returns a local snapshot object with:

- `captureStatus: "user-supplied-local-text"`;
- `rightsStatus: "local-import-only"`;
- `sha256: null` unless the caller supplies a hash of the exact local bytes
  (the synchronous parser does not pretend to have captured archival bytes;
  from Round 18 the viewer supplies this hash and byte length);
- one observation per telephone-keyed record, with line locator, locality,
  state, printed year range, sysop, software, comments, and the user-supplied
  raw block retained locally.

It returns **observations only**. Canonical nodes are never inferred during
parsing. `assessMergeCandidate` can later propose:

- `merge-candidate` when telephone + board name + locality agree (0.98 if
  sysop also agrees; 0.86 if sysop is missing on one side);
- `reject` for a name-only match or same board name with a different phone;
- `manual-review` for partial/conflicting identity evidence.

## Viewer behavior

The standalone viewer is intentionally a Phase 0/1 slice:

- time, snapshot, and text-search controls filter the three observations;
- the place/topology pane shows Denver as a dashed uncertainty area with one
  node and **zero edges**—it is schematic, not a geographic map pin;
- the record table and source drawer expose locator, evidence tier, rights,
  capture status, snapshot URI, and warnings;
- merge decisions, rejected matches, and negative searches are visible
  rather than hidden in code;
- pack JSON and observation CSV export are generated in the browser;
- a local TEXTFILES-style list can be pasted or selected from disk and parsed
  without a fetch or upload;
- historical telephone numbers are text only. The page creates no dial link
  and performs no network probe.

## What remains before a bundled historical-network dataset

1. Lawfully capture at least one redistributable source snapshot under F3,
   record its bytes' SHA-256, and store the capture under the repository's
   source rules.
2. If USBBS bulk data is ever desired, obtain or document a different
   permission/rights basis; otherwise keep it local-import-only.
3. Apply the same snapshot discipline to one complete FidoNet nodelist and
   one proven applied diff before drawing hierarchy or route edges. The
   Round 18 adapter/diff engine now exists; a redistributable historical
   snapshot and derived-edge semantics remain missing.
4. Add ARPANET host/IMP snapshots from dated textual sources before map
   transcription.
5. Add payphone imports as dated observations, never as an undated “current”
   layer.

## Sources consulted 2026-10-22

- TEXTFILES.COM, “Historical List of BBSes in the 303 Area Code,”
  <http://bbslist.textfiles.com/303/303.txt> — Keyhole BBS record keyed by
  `303-477-6337`, `DENVER, CO (1994-1996)`.
- NodelistDB API, `https://nodelist.fidonet.cc/api/nodes` — exact historical
  system/sysop searches described above.
- *THE BBS List 02-94* indexed text — distinct `818-545-0870` “The Keyhole
  BBS,” sysop Greg Hiscott.
- Round 15/16 USBBS evidence and rights header:
  [`keyhole-disambiguation-deep-dive-2026-10-22.md`](keyhole-disambiguation-deep-dive-2026-10-22.md)
  and [`historical-network-viewer-scope-2026-10-22.md`](historical-network-viewer-scope-2026-10-22.md).
