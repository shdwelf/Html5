# "Keyhole" disambiguation — the Denver BBS vs. Keyhole, Inc. (EarthViewer)

**Date:** 2026-10-22 · **Backlog stream:** S6 (historical networks / map layers) ·
**Type:** research note; no code or dataset changes.

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

## Disposition for the backlog

- The backlog's "Keyhole BBS" is most defensibly the **Denver dial-up board**
  — it is the only BBS-era referent found, and it is unrelated to Keyhole,
  Inc. Any future S6 work must keep the two separate and should cite this
  note rather than the bare name.
- No dataset was created this round. The S6 layer datasets named in the
  backlog (ARPANET nodes, FidoNet, payphone layers, …) still have no
  consumer viewer; per the round-15 scoping they wait for a round that
  builds one. The new statewide `california` frame (round 15, S4) is a city/
  state-subsurface viewer, not a historical-network viewer, and deliberately
  does not absorb S6 layers.
- Follow-up questions for a future research round, subject to flag F3
  (external hosts need repo-capture): does the Denver Keyhole BBS appear in
  FidoNet nodelists or other BBS lists (Boardwatch, USBBS other editions),
  and can its software/dates be pinned from a second independent listing?

## Sources (retrieved 2026-10-22)

- USBBS list edition 127, preserved at
  <http://protovision.textfiles.com/bbs/BBSLISTS/usbbs127.lst> — the
  "Keyhole BBS" line quoted above (located via web-search snippet).
- TEXTFILES.COM Historical BBS List, <http://bbslist.textfiles.com/> —
  general finding aid for dial-up-era boards.
- In-Q-Tel, "In-Q-Tel Announces Strategic Investment in Keyhole"
  (25 June 2003), <https://www.iqt.org/library/in-q-tel-announces-strategic-investment-in-keyhole>
  — primary source for the February 2003 investment and NIMA engagement.
- Wikipedia, "Google Earth" (Background/History sections and infobox release
  dates), <https://en.wikipedia.org/wiki/Google_Earth> — Intrinsic Graphics
  origin, 1999 spin-out under John Hanke, 2003 network-news usage, October
  2004 acquisition.
