# Historical network — FidoNet nodelist/nodediff adapter

*Round 18 implementation note, 2026-10-22. This advances backlog stream S6
from the Round 17 Keyhole citation slice to a working FidoNet source
adapter. It does not add a bundled FidoNet dataset and does not change the
Keyhole evidence conclusion.*

## What shipped

| Path | Round-18 role |
| --- | --- |
| [`js/historical-network.js`](../js/historical-network.js) | Adds `parseFidonetNodelist`, `applyFidonetNodediff`, `applyFidonetNodediffChain`, `detectHistoricalImportFormat`, and a shared WebCrypto `sha256Hex` helper. |
| [`historical-network-viewer.html`](../historical-network-viewer.html) | The local-import slice can now auto-detect and parse a FidoNet distribution nodelist, show its observations beside the Keyhole merge assessment, and download the local observation pack. It detects a standalone nodediff and refuses to treat it as a complete list. |
| [`tests/historical-network.test.mjs`](../tests/historical-network.test.mjs) | Synthetic contract tests for address derivation, unpublished nodes, SHA-256, nodediff application/chains, wrong-edition refusal, and partial-edit refusal. No historical nodelist text is copied into the fixture. |

The shared parser is input/output only: no network request, no dialing, no
runtime dependency, and no promotion of observations into canonical nodes or
edges.

## Nodelist parser contract

The parser follows the field and branch grammar in FTS-5000 revision 5:

- semicolon comment lines are skipped, while `;E` error comments surface as
  parser warnings;
- the first-line special header contributes the snapshot date when a full
  month-name date is present; the stated day number is checked against the
  computed day of year, and the five-digit header CRC is preserved;
- every data line needs at least the seven comma-separated FTS-5000 fields:
  keyword, number, system name, location, sysop, phone, and DCE speed;
- fields after the seventh remain an ordered `flags` array;
- underscores in name/location/sysop are decoded only for display fields;
  `locationRaw` and the complete original line remain available;
- `Zone`, `Region`, `Host`, and `Hub` update the flat-file administrative
  context used to derive a member record's `zone:net/node` address;
- administrative lines are observations too. Their source-stated hierarchy
  is retained as `fidonetBranch` metadata; the parser does not convert it
  into a physical link, proven mail session, or map geometry;
- `Pvt`, `Hold`, and `Down` remain visible historical statuses with a
  do-not-dial/probe warning rather than being deleted;
- `-Unpublished-` produces `phone: null`, never a synthetic dial string;
- a `000-…` phone field is preserved as `phoneRaw` because FTS-5000 permits
  that form to encode an IPv4 address; it is not misread as a telephone
  number;
- duplicate FidoNet addresses are warnings, not automatic merges. Hub
  redundancy and renumbering history make duplicate review a human evidence
  decision.

A segment that starts below `Zone` can pass `defaultZone` explicitly.
Otherwise the parser derives no full address rather than inventing zone 1.
Unknown keywords, including pointlist-like extensions, are retained as
observations with a warning but do not alter branch context.

The returned snapshot is deliberately:

```text
rightsStatus   = local-import-only
captureStatus  = user-supplied-local-text
evidenceTier   = local-user-import
captureReady   = false (even if the caller supplies a SHA-256)
```

A hash proves which user-supplied bytes were parsed. It does not supply
redistribution permission, source independence, a place coordinate, or a
canonical identity merge.

## Nodediff contract

A nodediff is an editing script for one exact previous edition. The shared
implementation therefore requires both inputs:

```js
applyFidonetNodediff(previousNodelistText, nodediffText)
applyFidonetNodediffChain(initialNodelistText, [diff1, diff2, ...])
```

It implements FTS-5000's three line commands—`Ann` adds the following
lines, `Cnn` copies lines from the previous file, and `Dnn` deletes/skips
previous lines—with four safety rules:

1. the nodediff's first line must match the previous nodelist's first line;
2. counts must be within the standard's 1…32767 range and cannot overrun
   either input;
3. the script must consume the entire previous file; partial edits are
   refused rather than silently completed;
4. a chain stops at the first wrong-edition or malformed diff.

Successful output is returned in memory with CRLF line endings and the
nodelist Ctrl-Z terminator by default. The new header's date/day/CRC are
parsed, but the CRC is **not verified** by this adapter; callers must not
describe a parse as CRC-validated.

The standalone viewer intentionally exposes only detection for nodediffs.
Its import form has one source text, while a diff needs a second, specific
previous list. Guessing that parent edition would be worse than refusing.
Programmatic callers and tests use the shared two-input functions.

## Capture hashing in the viewer

When a file is loaded, the viewer retains the original `ArrayBuffer`,
decodes a copy for display/parsing, and computes SHA-256 over the original
bytes. If the user edits the textarea, that buffer is discarded and the
next parse hashes the textarea's UTF-8 encoding instead. The summary and
downloaded local snapshot state which byte basis was used. Nothing is
uploaded.

This is a capture-integrity improvement, not a repository capture. The
downloaded JSON remains a user-local artifact unless a separate rights and
source-register decision allows it to be checked in.

## Rights decision

Two different copyrighted/public-domain objects must not be conflated:

- FTS-5000.005 itself says the standard document is released to the public
  domain, so implementing and describing its grammar is not the blocker.
- Historical FidoNet nodelist files are separate compilations. The
  1993/1994-era prologues checked for this round grant use and
  intra-FidoNet distribution to FidoNet system operators for communication
  or applying for a node number, reserve contributor rights, and say other
  use requires express written consent.

Accordingly, this round ships a local importer and synthetic tests only.
It does not bundle a transformed historical nodelist, seed nodes from a
downloaded list, or treat a GitHub mirror's presence as permission. A
future bundled FidoNet snapshot needs a documented rights basis in
addition to captured bytes, SHA-256, locator, dated snapshot metadata, and
merge provenance under F3.

## Relationship to Keyhole

The adapter provides the missing tool for examining a lawfully supplied
Denver-area nodelist locally, but Round 18 parsed no historical nodelist in
the repository and found no new Keyhole record. The Round 17 position is
unchanged:

- Denver Keyhole BBS is established by USBBS and the separate retrospective
  TEXTFILES compilation, with unresolved source independence for the latter;
- exact NodelistDB system/sysop searches found no Denver FidoNet match;
- a future nodelist observation would still need telephone/name/locality/
  sysop comparison before any merge; display name alone remains forbidden.

## Remaining Phase 2 work

- obtain a lawfully bundled or user-supplied complete historical nodelist
  and an applicable diff chain under an explicit source-register decision;
- design snapshot-diff review and administrative/mail-route semantics
  before deriving canonical nodes or logical edges;
- implement and test the FTS-5000 header CRC variant only from a reliable
  algorithm specification or published vectors; until then keep CRC
  “parsed, not verified”;
- decide whether the viewer needs a two-file nodediff workflow or whether
  build-time/source-register tooling is the safer interface.

## Sources

- FTSC, [FTS-5000.005, “The Distribution Nodelist”](http://ftsc.org/docs/fts-5000.005)
  (public-domain standard; fields, branch keywords, special header, and
  A/C/D nodediff commands).
- Historical FidoNet nodelist prologue reproduced in
  [“INFORMATION & Instructions- FidoNet”](https://www.africa.upenn.edu/E_Mail/INFORMATION_Instructions_10458.html)
  (26 March 1993 list; intra-FidoNet use/distribution grant and written-
  consent limit for other use).
- FidoNet nodelist prologue in a downloadable 2014 list at
  [NodelistDB](https://nodelist.fidonet.cc/download/nodelist/2014/nodelist.315)
  (same contributor/intra-FidoNet rights structure).
- Round-17 scope and fixture boundaries:
  [`historical-network-viewer-scope-2026-10-22.md`](historical-network-viewer-scope-2026-10-22.md)
  and
  [`historical-network-keyhole-fixture-2026-10-22.md`](historical-network-keyhole-fixture-2026-10-22.md).
