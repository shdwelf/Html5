# "Keyhole" disambiguation — the Denver BBS vs. Keyhole, Inc. (EarthViewer)

**Date:** 2026-10-22 · **Backlog stream:** S6 (historical networks / map layers) ·
**Type:** research note; no code or dataset changes in Round 15. A Round 17
implementation addendum appears below and in
[`historical-network-keyhole-fixture-2026-10-22.md`](historical-network-keyhole-fixture-2026-10-22.md).

## Task

The processed `agent.txt.xml` backlog (stream S6) names a "Keyhole BBS"
without further context. Before any S6 dataset work uses the name, this note
establishes what "Keyhole" can defensibly refer to, because the string is
heavily overloaded by a much more famous company.

## Finding: there are two unrelated referents

### 1. Keyhole BBS — a dial-up bulletin board in Denver, Colorado (documented)

The USBBS list, edition 127 (`usbbs127.lst`, November 1994), preserved in the
textfiles.com BBS-lists collection, contains this entry:

```
303-477-6337 CO Denver Linda McCraw X$ 99D 123 Keyhole BBS 20+3
```

That is: a board named **Keyhole BBS**, reachable at a 303 (Denver, Colorado)
number, with Linda McCraw as the listed operator. The trailing fields
(`X$ 99D 123`, `20+3`) are USBBS-format codes; this note does not decode them
further without the USBBS format key in hand. The entry was located via web
search quotation of the file at
`protovision.textfiles.com/bbs/BBSLISTS/usbbs127.lst` (2026-10-22); the same
line can be re-verified there or through the TEXTFILES.COM Historical BBS
List (`bbslist.textfiles.com`), which aggregates 100,000+ dial-up-era boards.

Nothing found this round establishes further facts about the board (software
package, FidoNet address, lifespan). Those remain open research questions —
see *Disposition*.

### 2. Keyhole, Inc. — EarthViewer / Google Earth lineage (documented)

- The core technology was developed at **Intrinsic Graphics** in the late
  1990s, beginning as a spinning-globe demonstration of its 3D software
  libraries. In **1999** Intrinsic created **Keyhole Corporation**, headed by
  John Hanke, to productize it.
- Keyhole's product **EarthViewer** (released 11 June 2001) streamed large
  mapping/imagery databases over the internet to a 3D client — the
  "fly from space to street level" interface.
- In early **2003**, CNN, ABC, CBS and other networks used EarthViewer's 3D
  flybys in coverage of the invasion of Iraq; demand outstripped Keyhole's
  servers.
- **In-Q-Tel** (the CIA-funded nonprofit venture firm) made a strategic
  investment in Keyhole in **February 2003**, announced **25 June 2003**. Per
  In-Q-Tel's own press release it was "In-Q-Tel's first engagement with a
  company on behalf of the National Imagery and Mapping Agency (NIMA)";
  NIMA's Rob Zitz states the technology was implemented "to support our
  mission within the Pentagon" within two weeks. NIMA had become a limited
  partner with In-Q-Tel in summer 2002.
- **Google acquired Keyhole in October 2004**; EarthViewer was relaunched as
  **Google Earth on 28 June 2005**. The name survives in **KML (Keyhole
  Markup Language)**.

The frequently repeated claim that the company was named for the KH
("Keyhole") reconnaissance-satellite series is **not corroborated by any
source consulted for this note** and is left as folklore, not fact.

## Timeline

| When | What |
| --- | --- |
| Nov 1994 | "Keyhole BBS" (Denver, 303-477-6337, sysop Linda McCraw) listed in USBBS edition 127 |
| late 1990s | Intrinsic Graphics develops the globe/streaming technology |
| 1999 | Keyhole Corporation created under John Hanke |
| 11 Jun 2001 | EarthViewer released |
| Feb 2003 | In-Q-Tel invests in Keyhole (first engagement for NIMA) |
| 25 Jun 2003 | Investment publicly announced; NIMA already operational with it |
| Oct 2004 | Google acquires Keyhole |
| 28 Jun 2005 | Relaunch as Google Earth; KML preserves the Keyhole name |

## Round 17 addendum — separate compilation, FidoNet check, and a namesake

Three source checks refine the fixture without changing the Round 15
identification:

1. TEXTFILES.COM's undated retrospective “Historical List of BBSes in the
   303 Area Code” carries `303-477-6337 | Keyhole BBS | DENVER, CO
   (1994-1996)`. It is a separate publication from USBBS and extends the
   claimed activity span through 1996, but its header says only that it was
   created “From Many Sources.” Because the per-record source is not printed,
   the underlying observation cannot yet be called independent of USBBS.
2. Exact historical searches against the NodelistDB API for
   `system_name=Keyhole BBS`/`Keyhole_BBS` and `sysop_name=Linda McCraw`/
   `Linda_McCraw` returned no Denver match. A broad `system_name=Keyhole`
   query returned an unrelated fuzzy Phoenix/Barnaul result. This negative
   indexed-archive result does not prove the board was never in FidoNet, and
   no FidoNet address or edge is inferred.
3. *THE BBS List 02-94* includes a distinct “The Keyhole BBS” at
   `818-545-0870`, sysop Greg Hiscott, software XBBS. It is a same-name
   namesake, not Linda McCraw Denver board, and is the concrete counterexample
   behind the evidence model's “never merge by display name alone” rule.

Round 17 turns those findings into a machine-readable Phase 0 fixture and a
standalone historical-network viewer. The USBBS rights decision remains
conservative: short cited fixture records in the repository, bulk USBBS data
only through local import unless another rights basis is documented.

## Disposition for the backlog

- The backlog's "Keyhole BBS" is most defensibly the **Denver dial-up board**
  — it is the only BBS-era referent found, and it is unrelated to Keyhole,
  Inc. Any future S6 work must keep the two separate and should cite this
  note rather than the bare name.
- No dataset was created in Round 15. Round 16 scoped a separate
  historical-network viewer, and Round 17 shipped its Phase 0 Keyhole
  fixture/local-import slice. The statewide `california` frame remains a
  city/state-subsurface viewer, not a historical-network viewer, and
  deliberately does not absorb S6 layers.
- Follow-up questions remain, subject to flag F3 (external hosts need
  lawful capture): can a contemporaneous FidoNet or Boardwatch capture be
  obtained, can the TEXTFILES record's underlying source be identified, and
  can the board's software or exact start/end dates be pinned? The Round 17
  NodelistDB result is negative evidence over that archive, not a final
  answer.

## Sources (retrieved 2026-10-22)

- USBBS list edition 127, preserved at
  <http://protovision.textfiles.com/bbs/BBSLISTS/usbbs127.lst> — the
  "Keyhole BBS" line quoted above (located via web-search snippet).
- TEXTFILES.COM Historical BBS List, <http://bbslist.textfiles.com/> —
  general finding aid for dial-up-era boards.
- TEXTFILES.COM, “Historical List of BBSes in the 303 Area Code,”
  <http://bbslist.textfiles.com/303/303.txt> — Denver Keyhole BBS record
  with the retrospective `(1994-1996)` span (Round 17).
- NodelistDB historical node API,
  <https://nodelist.fidonet.cc/api/nodes> — exact Keyhole/Linda McCraw negative
  searches (Round 17).
- *THE BBS List 02-94*, indexed at
  <https://groups.google.com/g/alt.bbs.lists/c/ojbvcXr5ZUc/m/0fxdmVAbkoUJ>
  — distinct 818 “The Keyhole BBS” namesake (Round 17).
- In-Q-Tel, "In-Q-Tel Announces Strategic Investment in Keyhole"
  (25 June 2003), <https://www.iqt.org/library/in-q-tel-announces-strategic-investment-in-keyhole>
  — primary source for the February 2003 investment and NIMA engagement.
- Wikipedia, "Google Earth" (Background/History sections and infobox release
  dates), <https://en.wikipedia.org/wiki/Google_Earth> — Intrinsic Graphics
  origin, 1999 spin-out under John Hanke, 2003 network-news usage, October
  2004 acquisition.
