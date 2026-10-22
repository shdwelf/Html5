# Historical network viewer — consumer scope

*Round 16 scoping note, 2026-10-22. This is a product/data contract for
backlog stream S6. Its purpose is to give ARPANET, FidoNet, BBS-list, and
payphone records an evidence model before any of them are plotted.*

*Round 17 update, 2026-10-22: Phase 0 is now implemented as a tested
one-system citation fixture, a standalone
[`historical-network-viewer.html`](../historical-network-viewer.html), and a
local TEXTFILES-style list importer. See
[`historical-network-keyhole-fixture-2026-10-22.md`](historical-network-keyhole-fixture-2026-10-22.md).
This still ships **no bundled ARPANET/FidoNet/BBS/payphone dataset**: the
USBBS rights decision is citation-only/local-import-only, and the validator
reports the fixture as structurally valid but not capture-ready.*

## Decision

Build the historical-network material as a separate, offline-first consumer
viewer rather than as extra layers inside `city-subsurface`. The city/state
frames answer “where is this named physical feature?” with a stable GNIS or
curated point. Historical network sources answer a different question:
“what did a dated publication or observation claim about a named system,
address, route, or service at that time?”

Forcing the second question into the gazetteer tuple would create false
precision. A BBS listing normally identifies a city and telephone number, not
a street address; a FidoNet nodelist identifies a network address and flagged
mail/route relationships, not a surveyed site; an ARPANET map is a topology
snapshot, not a set of buried-cable alignments; and a payphone observation is
only current on its observation date.

## Intended users and questions

The first consumer is a reader/researcher who wants to:

1. Find a BBS, host, IMP/TIP, FidoNet node, or payphone by name, number,
   network address, sysop/organization, locality, or date.
2. Compare dated snapshots: when a system first appeared, disappeared,
   changed number/address, or changed upstream route.
3. Inspect the exact source behind every plotted or graphed claim.
4. Move between three complementary views without confusing them:
   - a coarse geographic map,
   - a logical topology graph,
   - a chronological listing/record view.
5. Export a small, cited evidence pack (JSON/CSV plus source manifest), not
   just a screenshot.

The viewer is a research instrument, not a dialer, terminal, route tracer, or
“still online” directory.

## Non-goals and safety boundaries

- No modem dialing, Telnet/SSH connection attempts, credential use, or active
  probing of historical numbers or hosts.
- No inference that a historical telephone number, hostname, or network
  address still belongs to the same person or organization.
- No street-address geocode for a BBS unless a contemporaneous public source
  actually prints that address. City/area-code precision must remain visibly
  coarse.
- No treating a topology edge as a physical cable route.
- No treating a payphone observation as current after its stated date.
- No bulk ingestion of a source whose reproduction terms have not been
  reviewed. F3 still applies: external material needs a lawful local capture
  with provenance; a search-result snippet is a lead, not a bundled dataset.

## Core data contract

Every import lands first as an *observation*. Normalized nodes, places, and
edges are derived claims that link back to one or more observations.

### `SourceSnapshot`

| Field | Meaning |
| --- | --- |
| `id` | Stable local snapshot ID, e.g. `usbbs-134-1995-07` |
| `title` | Publication/list title as printed |
| `publisher` / `editor` | As printed, if known |
| `issued` | Publication date or defensible date range |
| `valid_from` / `valid_to` | Temporal coverage claimed by the snapshot |
| `capture_uri` | Local capture path or archival identifier; public URL as a citation only |
| `sha256` | Hash of the captured source bytes used by the importer |
| `rights_note` | License/terms review outcome and what may be redistributed |
| `parser` | Adapter name/version that produced observations |

### `Observation`

One immutable row, host-table entry, map label, nodelist line, or field
observation:

- `snapshot_id`, `locator` (page, line, byte range, map cell, or record ID);
- `raw_text` or a rights-safe excerpt/hash when full text cannot be bundled;
- parsed fields exactly as printed (names, numbers, flags, software, fees,
  baud/features, locality, sysop/organization);
- `observed_at` / publication date;
- `evidence_tier`: contemporaneous primary, contemporaneous compiled list,
  retrospective compilation, or local user import;
- parser warnings and ambiguous-field notes.

### `Place`

A place is a claim with an explicit granularity:

- `label` (city, campus, facility, intersection, rest area, etc.);
- optional `lat`/`lon` and `coordinate_basis`;
- `granularity`: `address`, `site`, `city`, `telephone-exchange`, `region`,
  or `unknown`;
- `radius_km` or another machine-readable uncertainty value;
- geocoder/source and date if coordinates were added later.

A city-level BBS place may be drawn with a halo or aggregate marker. It must
never be rendered with the same pin semantics as a surveyed GNIS point.

### `NetworkNode`

- canonical display name plus dated aliases;
- network (`arpanet`, `fidonet`, `bbs`, `payphone`, other local network);
- identifiers valid for that snapshot (host name, IMP number, FidoNet
  zone:net/node.point, BBS telephone number, payphone number);
- node kind and role (host, IMP, hub, host/NC/RC/ZC, BBS, payphone, gateway);
- place reference, if any;
- first/last observed dates, always computed from linked observations.

### `NetworkEdge`

- `from_node_id`, `to_node_id`;
- edge kind (`physical-link-claimed`, `mail-route`, `hosted-by`,
  `administrative-parent`, `dial-peer-claimed`, `same-site`);
- dated validity and direction, if the source states them;
- one or more observation IDs;
- `geometry_basis`: normally `logical-only`; a polyline is allowed only when
  a source actually supplies route geometry.

### Merge log

Canonicalization is itself evidence. Each merge records:

- observations/nodes merged;
- rule used (same network + number/address; same name + locality + sysop;
  explicit source cross-reference; manual decision);
- confidence and reviewer note;
- rejected near-matches that could otherwise be silently conflated.

## Source adapters and rights gates

### BBS lists

Candidate sources include USBBS, the TEXTFILES.COM historical BBS list,
regional BBS lists, and Boardwatch-derived listings. They are not
interchangeable and must remain separate snapshots.

The header recovered with `USBBS134.LST` (July 1995) permits free
distribution of the list but says that modifications, bundling with another
product/service, and remuneration require prior written permission. The safe
default is therefore:

1. cite the issue/date and line locator;
2. store locally captured bytes only under the repository's capture rules;
3. do not bundle a transformed USBBS dataset until the rights position is
   explicitly resolved;
4. allow the viewer to import a user-supplied local list and render it
   locally without redistributing that list.

### FidoNet nodelists and diffs

A nodelist adapter should parse the record grammar, flags, hierarchy, phone
or IP fields, and publication epoch, and should preserve the raw line. A diff
is not a complete snapshot unless its parent snapshot and application result
are recorded. Private/unpublished nodes, points, and hold/down states need
first-class display states rather than deletion.

### ARPANET material

RFCs, host tables, BBN reports, and dated logical/geographic maps should be
separate source types. A map-derived edge needs a map locator and a note if
the line is schematic. Site coordinates come from a defensible site/campus
source, never from measuring pixels on a topological map and presenting the
result as a facility coordinate.

### Payphone observations

Payphones are observations, not permanent named features:

- number as printed/observed;
- date and observer/source;
- location text and coordinate basis;
- status on that date (`seen-working`, `seen-present`, `removed`, `unknown`);
- photo/file hash when supplied by the user;
- ZIP/postal code only as a locality field, not a coordinate substitute.

The default import path should be local CSV/GPX/GeoJSON. Any bundled census
needs dated, per-row sources and an ageing display.

## Viewer shape

### First screen

- Time control first: snapshot selector plus a date slider. No record is
  shown without its date context.
- Network/layer selector: ARPANET, FidoNet, BBS, payphones; evidence tiers
  can be filtered independently.
- Three synchronized panes or tabs:
  1. **Map** — coarse places and uncertainty halos; logical edges are faint
     and explicitly labelled as non-geographic.
  2. **Topology** — force/hierarchical graph with no implied geography.
  3. **Records** — searchable table/listing in snapshot order.
- Selecting any item opens a source drawer with the raw/allowed excerpt,
  locator, snapshot metadata, merge history, and “what this does not prove”
  note.

### Search and comparison

- exact and fuzzy search over names, numbers, network addresses, sysops/
  organizations, localities, software, and flags;
- snapshot diff: added, removed, renamed, renumbered, moved-at-place-
  granularity, and route/parent changed;
- permalink-like local state (query string or exported state JSON) so a
  research view can be reproduced offline;
- CSV/JSON/GEXF export with a source manifest and hashes.

### Implementation direction

Reuse the repository's offline pattern: static HTML + generated JSON data
packs + a Webxdc bundle, with parsers run at build/import time rather than a
runtime server. Keep the graph/map renderer replaceable; the durable asset is
the observation schema and source register. Dynamic imports per snapshot can
keep each bundle small, as the city-subsurface packs already do.

## Phased build

### Phase 0 — provenance spike

**Round 17 status: implemented as a citation fixture; capture-ready sample
snapshots remain open.**

- Decide the rights treatment for USBBS and any Boardwatch scans.
  *Round 17 decision: USBBS is citation-only in the repository and
  local-import-only for bulk work until permission or another rights basis is
  documented. TEXTFILES historical compilations receive the same treatment.*
- Capture two or three lawfully usable sample snapshots with hashes.
  *Still open: the shipped fixture is intentionally `captureReady: false`.*
- Write schema fixtures by hand, including ambiguous and rejected matches.
  *Done for Keyhole, including Keyhole Inc. and the distinct 818 Keyhole BBS
  as rejected matches.*

### Phase 1 — vertical slice

**Round 17 status: one-system slice shipped; full geographic map deferred.**

- One snapshot, one locality, and one named system rendered in map, graph,
  and record views. *The shipped page renders the place as a Denver
  city-level schematic uncertainty area rather than a geographic pin, shows
  one node with zero edges, and gives the full record/source view.*
- Keyhole BBS is the natural fixture because it is small, dated, and tests
  city-level place precision, same-name disambiguation, and repeated-listing
  persistence.
- No bulk import yet. *Bulk text can be parsed locally, but no resulting
  dataset is bundled or canonicalized automatically.*

### Phase 2 — FidoNet adapter

- Import one complete nodelist and one applied diff.
- Render hierarchy/routes as dated logical edges.
- Add snapshot diff tests.

### Phase 3 — ARPANET adapter

- Import one dated host/IMP snapshot from a textual source before attempting
  map transcription.
- Add map-derived snapshots only with locators and geometry-basis flags.

### Phase 4 — payphone local imports

- CSV/GPX/GeoJSON import, ageing/status display, and local-only photo hashes.
- Bundle no “current payphone” claim without a recent dated observation.

## Acceptance gates

A dataset is not ready to ship unless tests can prove that:

1. every node, place, and edge resolves to at least one observation;
2. every observation resolves to a source snapshot with date, locator, hash,
   and rights note;
3. no city/exchange-level place is rendered as an exact site point;
4. no edge present in the map view claims physical geometry unless its
   `geometry_basis` says a source supplied it;
5. snapshot diffs never merge records solely because their display names
   match;
6. historical numbers/addresses are labelled with their snapshot dates;
7. a user-imported payphone photo/list remains local and is never silently
   promoted to the bundled evidence tier;
8. generated packs can be rebuilt byte-for-byte from the checked-in source
   register and captured fixtures.

## Keyhole BBS evidence ledger (used as the design fixture)

Round 15 established the essential disambiguation: the BBS referent is the
Denver dial-up board, not Keyhole, Inc./EarthViewer. Round 16 adds a second
dated USBBS listing, and Round 17 adds a separate retrospective compilation;
each carries a qualification that must remain attached to the claim.

| Date | Source | Record | What it proves | Limit |
| --- | --- | --- | --- | --- |
| Nov 1994 | USBBS list #127 | Denver, Colorado; `303-477-6337`; sysop Linda McCraw; “Keyhole BBS” | A board of that name was listed in Denver in 1994. | One compiled BBS list; no street address or network affiliation should be inferred. |
| Jul 1995 | `USBBS134.LST`, Darwin Systems/USBBS list #134 | The same number, city, sysop, and “Keyhole BBS” name recur; the line's first-listed code is `123` under the header's column key. | The listing persisted across USBBS editions into mid-1995 and had first appeared by list #123. | This is a second *edition of the same publication lineage*, not a second independent publisher/listing. |
| 1994–1996 span (retrospective) | TEXTFILES.COM, “Historical List of BBSes in the 303 Area Code” | `303-477-6337`, “Keyhole BBS”, `DENVER, CO (1994-1996)`; no sysop or software printed. | A separate compilation repeats the number/name/city and extends the claimed span through 1996. | The compilation says it was created from many sources but does not identify this record's source, so independence from USBBS is unresolved; the span is one retrospective claim, not annual observations. |

On 2026-10-22, Round 17 repeated exact searches for the number, board name,
and sysop; queried the NodelistDB historical API by exact system and sysop
with `latest_only=false`; and inspected the TEXTFILES 303 historical list.
No exact FidoNet or Boardwatch listing was located. A broad
`system_name=Keyhole` NodelistDB query returned an irrelevant fuzzy
Phoenix/Barnaul node, which the fixture records as a search artifact rather
than a candidate. Indexed February 1994 text also surfaced a distinct
`818-545-0870` “The Keyhole BBS” run by Greg Hiscott; that record is a rejected
same-name match, not the Denver board. Negative results do not prove that no
other Denver listing exists. The next capture targets remain lawfully usable
Denver-area FidoNet nodelists/diffs and Boardwatch captures under F3.

Primary web citations for this ledger:

- USBBS #134 file and header/column key:
  <https://textfiles.meulie.net/bbs/BBSLISTS/USBBS/usbbs134.lst>
- TEXTFILES.COM historical 303 BBS text (Keyhole record keyed by
  `303-477-6337`): <http://bbslist.textfiles.com/303/303.txt>
- NodelistDB historical node API:
  <https://nodelist.fidonet.cc/api/nodes>
- Round-15 disambiguation and the #127 evidence:
  [`keyhole-disambiguation-deep-dive-2026-10-22.md`](keyhole-disambiguation-deep-dive-2026-10-22.md)
- Round-17 fixture, rights decision, and parser:
  [`historical-network-keyhole-fixture-2026-10-22.md`](historical-network-keyhole-fixture-2026-10-22.md)

## Decisions and remaining build questions

1. **Rights — resolved conservatively in Round 17:** transformed USBBS
   records are not bundled. USBBS is limited to local user import plus short
   cited fixtures unless permission or another rights basis is documented.
2. **Place gazetteer:** still open for a future multi-system map. The
   Keyhole slice avoids the question by storing no coordinate for Denver;
   it does not assign a city centroid or radius.
3. **Identity keys — partial rule implemented:** telephone + board name +
   locality can produce a merge candidate; sysop agreement raises
   confidence. Display-name equality alone is rejected, and a changed number
   with persistent name/sysop/city remains manual review rather than an
   automatic merge.
4. **Graph semantics:** still open. No FidoNet edge is drawn in the Keyhole
   slice, so administrative-parent versus mail-route layers remain a design
   decision for the nodelist adapter.
5. **Bundle size:** still follow measured captured-fixture sizes. The
   one-system citation pack does not answer snapshot/year/locality packing.

The correct state is therefore **Phase 0 built, bundled datasets still
blocked**. That is preferable to seeding ARPANET/FidoNet/payphone claims
without captured snapshots and hashes or hiding their dates and
uncertainties inside an unrelated viewer.
