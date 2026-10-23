# FidoNet + ARPANET map layers; Mojave payphone — S6 layer research

*2026-10-23 · backlog T6.2 (S6) · desk research + a reviewed seed dataset in
the repository's historical-network observation schema. Seed:
[`resources/historical-network/comms-history-seed-2026-10-23.json`](../resources/historical-network/comms-history-seed-2026-10-23.json).
It extends the Phase-0/1/2 work (`historical-network-viewer.html`,
`js/historical-network.js`, rounds 16–18) — that viewer, not the
california-subsurface frame, is the consumer (round 15 decision). The pack
passes the viewer's own `validateEvidencePack` (`valid: true`,
`captureReady: false` — citation-only, as it should be;
`tests/historical-network-comms-seed.test.mjs` gates that). Viewer rendering
of this pack is the named next step; nothing renders it yet.*

## Where this seed fits

The historical-network viewer already has an observation-first schema
(`schemaVersion` 1: snapshots → observations → places/nodes/edges) and a
local FTS-5000 nodelist adapter (round 18). What it lacked was any bundled
**content** beyond the Keyhole fixture. This seed adds the layer's public-fact
backbone — ARPANET's first IMP sites, FidoNet's origin, and the Mojave
payphone — as a conforming pack with cited snapshots, so the viewer gains a
second, independent dataset without touching the rights-restricted material.

## ARPANET layer (verified seed facts)

The initial ARPANET is four IMP sites, three of them in California:

| # | Site | IMP installed | Host | Role |
| --- | --- | --- | --- | --- |
| 1 | UCLA (Boelter Hall) | 1 Sep 1969 (delivered 30 Aug) | SDS Sigma 7 | Network Measurement Center (Kleinrock) |
| 2 | SRI, Menlo Park | 1 Oct 1969 | SDS 940 "Genie" | ARC / Network Information Center (Engelbart) |
| 3 | UCSB | 1 Nov 1969 | IBM 360/75 | Culler-Fried Interactive Mathematics |
| 4 | Univ. of Utah | Dec 1969 | DEC PDP-10 / TENEX | Graphics (Sutherland) — completes the four-node net by 5 Dec 1969 |

First edge: UCLA→SRI, 29 Oct 1969 22:30 PST — the attempted `LOGIN` that
crashed after `LO`; permanent link 21 Nov 1969. The seed carries the three
California IMPs, Utah marked out-of-frame, and that first edge. Later
logical maps (the 1970s BBN/Heart maps) are the expansion path: each map is
a dated snapshot, and the layer should be *time-sliced* (1969 / 1971 /
1977) rather than one undated blob — the same discipline as the fire-history
layers in S5.

## FidoNet layer (model, within the standing rights decision)

FidoNet (1984, Tom Jennings' Fido BBS, San Francisco) addressed nodes as
`Zone:Net/Node(.Point)` and distributed the network's membership as a
weekly `NODELIST.nnn` text file. The round 17/18 rights review is decisive
here: checked nodelist prologues grant intra-FidoNet use/distribution and
reserve other uses absent express written consent, so **nodelists stay
local-import-only in this repository** (`captureReady=false`); the shipped
FTS-5000 parser/adapter is how a user brings their own snapshot in. This
seed therefore bundles **no nodelist records** — only the public-fact origin
row.

If a lawfully redistributable snapshot is ever obtained (written consent or
a differently-based source), the rendering model is ready: nodelists carry
city/state names, not coordinates, so nodes aggregate to dated city points
with per-city counts ("FidoNet 1990", "at peak") — honest aggregation for a
network that at its mid-1990s peak numbered in the tens of thousands of
nodes — geocoded through the city gazetteers, with unmatched cities left
unmapped rather than invented.

## Mojave payphone anchor

The Mojave phone booth is the layer's payphone anchor and its cautionary
tale: a lone Pacific Bell booth in what is now Mojave National Preserve
(35.285827, −115.68463 as published), number 760-733-9969, installed after
WWII for nearby miners, internet-famous in the late 1990s, **removed
17 May 2000** at the National Park Service's request after visitor impact;
the number was revived as a VoIP conference in 2013. The seed row says
plainly that nothing remains on site. Rest-stop and ZIP-code rows from the
original task text belong to the same context tier when sourced — unpublished
payphone locations should not be crowd-sourced into the layer without a
dated public source, since the booth's own history shows what publicity
does to fragile desert sites.

## Next steps (named, not done)

1. Teach `historical-network-viewer.html` / `js/historical-network.js` to
   load this pack alongside the Keyhole fixture (pack picker + place
   rendering for `site`-granularity places, which Phase 0 didn't need).
2. Time-slice ARPANET: add 1971 and 1977 logical-map node sets from the
   published BBN maps as dated snapshots in this pack.
3. FidoNet bulk layer only if a lawfully redistributable nodelist snapshot
   is obtained; until then the local-import adapter (round 18) is the path.
   Rest-stop/ZIP context rows likewise need dated public sources per row.

## Sources

- Wikipedia, *ARPANET*; *Interface Message Processor* (IMP install dates,
  hosts) — https://en.wikipedia.org/wiki/ARPANET
- SRI International, *ARPANET* history page — https://www.sri.com/hoi/arpanet/
- Kleinrock/ICANN, *The First Message Transmission* (29 Oct 1969) —
  https://www.icann.org/en/blogs/details/the-first-message-transmission-29-10-2019-en
- Wikipedia, *Mojave phone booth*; Atlas Obscura, *Mojave Phone Booth*
  (coordinates, removal 2000-05-17, 2013 number revival)
- GitHub: `Mithgol/node-fidonet-nodelist`, `xx25/nodelistdb`,
  `oldzoomer-ru/nodehistj` (parsers/history tooling surveyed 2026-10-23)

Backlog status: T6.2 moves open → partial. Done: layer design, verified
ARPANET/Mojave seed in repo format, FidoNet ingestion model. Open:
generator wiring, pinned nodelist bulk layer, rest-stop/ZIP context rows.
