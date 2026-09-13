# CASEFILES — kr0me corp & Rodger Ramrod under Ghidra-WASM

*Built 2026-09-13 · page: `casefiles.html` · controller: `js/casefiles.js` ·
data: `js/krome-catalog.js` · headless proof: `tools/verify_casefiles.mjs`*

This session continued the Ghidra lab work ("run Ghidra on the Rodger Ramrod
archive, and on Kr0meCorp software"). It shipped a second analysis app next to
`ghidra-lab.html`, plus the research that pins both dossiers to verifiable
bytes.

## What "Kr0meCorp" turned out to be

The GeoCities hacking link pages of 1998 (mirrored at OoCities,
`timessquare/lair/6606/hacks1.html`) index **kr0mecorp** as
*"Retrocomputing, Hacking, Cyberpunk resources"*, linking to
`http://members.tripod.com/~retrotech/`. The Wayback Machine's capture of that
index (5 Dec 1998) renders the site title **`-=# KR0ME CORP #=-`**, and its
catalogue page (`files.html`, 8 May 1999) reads:

> **PUBLIC RELEASES** — Tools coded by Njord, from Kr0me BBS

followed by sections: public releases (phAse Zero, Euthanasia, Death Scythe,
DeShadow, Brazen, EtherMail, Thetahedron, Pin-G), **IP SPOOFERS** (Erect97,
Spoofit, SIRC, IRCSEQ, IPSTUFF, DrSpewfy, WinSpoof), **SCANNERS** (CHA0SCAN,
7th Sphere PORTSCAN, PSCAN, SCAN, WSCAN), **CONSPIRACY**, **CYBERTEK** (the
Cybertek zine library mirrored from l0pht.com), **PGP** (anonymity/nym papers,
"our PGP public key"), and the nuke-era tools of the Armory (`netwar.html`):
winnuke, c2myazz, boink, land, teardrop, newtear, nestea, jolt, synk4 — plus
`staog.zip` (the first Linux virus), `pwlview.zip` (the .PWL weakness),
`winGateScan95`, ICQ attack tools, and `kr0menfo.zip`, the group's own info
file. Footer: *"Copyright © 1995-98 Kr0me Corp - All rights reserved."*

## The recovery problem, and the hash-gated answer

The build sandbox can reach `github.com`, `api.github.com` and
`registry.npmjs.org` only — `web.archive.org` and `archive.org` are egress-
blocked, and the platform's page-fetch proxy returns text, not binaries. So
no Kr0me Corp zip and no Rodger Ramrod exe could be pulled into the sandbox
byte-exactly, and hand-transcribing ~200 SHA-1 base32 digests was ruled out as
error-prone (a single wrong character would silently poison the corpus).

The design that survived contact with reality:

* the repo carries the **capture manifest** (name, timestamp, compressed
  WARC length, kind, the site's own descriptions) — short, safe-to-transcribe
  fields only;
* the page itself fetches the **expected SHA-1 from the Wayback CDX index at
  recover time** (`/cdx/search/cdx?url=…&timestamp=…&limit=1`), fetches the
  raw capture (the `id_` variant), hashes it with WebCrypto and shows a
  ✓/✗ verdict before anything reaches the disassembler;
* recovery runs **in the user's browser**, where those hosts are reachable.
  The lab stays serverless and the analysis stays local, exactly like the
  virus lab's "nothing uploaded" contract.

## Rodger Ramrod — pinned provenance (from the archive.org metadata API)

| copy | item | size | md5 | sha1 | access |
|---|---|---|---|---|---|
| shareware ZIP | `msdos_Rodger_Ramrod_1996` | 8,433,873 B (16 files) | `d09be88736b388ea4dbb0887db8adfec` | `40154b55114302155ea19ffeb63102e7959ed98f` | **stream_only** |
| eXoDOS repack | `exov5_2` → `eXo/eXoDOS/Rodger Ramrod (1996).zip` | 8,433,873 B | **same md5** — byte-identical | same | public torrent item; this is the copy the page fetches |
| full game RAR | `cdfwps` ("Nonaz.com and Barneghetto Piratesoft", 1996) | 78,051,394 B (34 files) | `37c882b3e8b740c2ca5e6466dca947fc` | `aa7393ee651214879e1fcc3710772a6c285f8ea9` | public, `publicdomain/mark/1.0` — RAR, so no in-browser unpack here |

The eXoDOS zip unzips to the `rodger/` package already documented in
`resources/src-62-rodger-ramrod-html5-app.md`: `RRR.BAT → STKRUN.EXE
(39 KB, 16-bit MZ loader) → MAIN.EXE (642 KB)`, `RRR.DAT` (22 MB data),
`READ.ME`, `*.DWM` music. The page hashes the fetched zip against the
metadata-API SHA-1, unzips in memory, sniffs each member (MZ / NE / LE / PE)
and routes: **STKRUN.EXE** decompiles as `x86:LE:16:Real Mode`; **MAIN.EXE**
gets header routing — 16-bit stub or a mapped PE32 image through
`x86:LE:32:default`. If archive.org refuses the fetch client-side (403), the
page says so and offers the drop zone instead of pretending.

## What ships in the repo

* `casefiles.html` + `css/casefiles.css` — the CASEFILES app (cases: kr0me
  corp / Rodger Ramrod / demo.exe), tabs DOSSIER · DISASSEMBLY · GHIDRA C ·
  TECHNIQUES · HEX·ENTROPY · RESEARCH.
* `js/krome-catalog.js` — 199 Wayback captures of `~retrotech` with capture
  timestamps, the 12 linked-but-never-captured files, curated notes for the
  tools worth a Ghidra session, the full Ramrod dossier numbers, method and
  references.
* `js/casefiles.js` — recovery console (CDX digest → capture → SHA-1 gate →
  fflate unzip → member sniffing), MZ/PE loader math, decompile plumbing with
  a RETF-padding terminator for tiny DOS images.
* `tools/verify_casefiles.mjs` — headless proof (all checks pass): catalog
  integrity, RFC-4648 base32 ↔ SHA-1 vectors, MZ entry math on `demo.exe`,
  a synthetic zip → `unzipSync` → member → disassembly → **real
  `ghidra_decompiler.wasm` decompilation** of the member (50 lines of C).
  Run: `node tools/serve.mjs 8099 & node tools/verify_casefiles.mjs 8099`.
* `index.html` dock link + `sw.js` precache (v16): `casefiles.html`,
  `js/casefiles.js`, `js/krome-catalog.js`, `css/casefiles.css`, `demo.exe`.
  (`vendor/fflate/index.mjs` was already precached.)

## Verification status of this session

* `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED** (catalog 199/199,
  base32 vectors, MZ math, zip round-trip, 2 real wasm decompiles).
* `tools/verify_ghidra.mjs` — still **21/21** functions decompile on the
  virus corpus (no regression).
* `tools/check-dom-ids.mjs` (lab) + an equivalent ad-hoc id contract check
  for `casefiles.html` — all controller ids exist in the markup.
* `tools/smoke_pipeline.mjs` — pipeline clean.
* `vitest run` cannot start in this sandbox: `node_modules` is not installed
  (`@vitejs/plugin-react` unresolvable) — pre-existing, unrelated to these
  changes; the `tools/` harnesses above are the lab's own gate and they pass.

## Honest limits

* Sandbox egress means no Kr0me Corp or Ramrod bytes were downloaded *here*;
  the first real recovery happens in a visitor's browser, with the verdict
  badge as the receipt.
* Twelve files the site linked (`phAse-0.zip`, `euthan.zip`, `scythe.zip`,
  `deshadow.zip`, `ether.zip`, `theta.zip`, `pin-g.zip`, `spoofit.zip`,
  `ctelec1/3.zip`, `radcommo.zip`, `ciasws.zip`) were never captured with
  HTTP 200 — the dossier lists them as unrecoverable rather than inventing
  stand-ins.
* Late captures (1999–2000) whose CDX mimetype came back `text/html` are
  flagged `!` in the library: Tripod was serving error pages by then, and the
  SHA-1 gate is expected to refuse them — which is the gate working, not
  failing.
