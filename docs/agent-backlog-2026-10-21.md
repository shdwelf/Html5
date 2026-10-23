# Agent backlog processing — `agent.txt.xml` (21 Oct 2026)

*Source: `/tmp/arena-coding-uploads/agent.txt.xml` · SHA-256 `26296aed08203a5bcc27b2199933a0e9247b682d9dbe891d5c1ad187f0a494c0` · 234,703 bytes · 172 lines. Machine-readable companion: [`agent-backlog-2026-10-21.json`](agent-backlog-2026-10-21.json).*

The upload is a concatenated agent-session export: a research/build backlog of 21 distinct
task statements (two of them duplicated), a twice-repeated **failed** transcript of a
uuencode/base64 session over a `KGK.ARJ` listing capture, and one already-analyzed script
fragment. This document is the processing pass: everything extracted, deduplicated,
cross-referenced against what the repository already contains, and organized into
**fourteen parallel work streams** that can be executed concurrently.

## 1 · Input forensics

| Region | Lines | Content |
| --- | --- | --- |
| Task head | 2–11 | Backlog imperatives (crypto/archive RE, GIS mega-task, CyberChef, uClinux fax, shufflecake/vault, Android lab, password recipes) |
| Evidence notes | 12–14 | Regex-scan hits over the Sneakers SFX payload (`-lh5-` LHA, `SNEAKERS.EXE`, *LHA's SFX 2.12S*) |
| Failed session ×2 | 18–81, 83–152 | Near-verbatim duplicated transcript: “Decrypt to base64 uue” over a `GK.ARJ` listing capture; both attempts died on `SyntaxError`/`FileNotFoundError`. The base64 conversion was **never completed** |
| Task tail | 153–171 | BagIt/Xena order, survey markers, Sneakers wiki + xdc, goldkey/Gina.dll, BBS→ColdFire, SIM/Android lab, DTSearch/UCSB recipes, Cicada/Warrick/Geomate, haiku vault + RFC drafts |
| Drainer fragment | 155 | Changelly/docs.google.com script — already analyzed in [`changelly-drainer-analysis.md`](changelly-drainer-analysis.md) |

### Recovered payload

The listing capture that the failed sessions were trying to preserve is extracted verbatim to
[`research/kgk-arj-listing-extract.txt`](../research/kgk-arj-listing-extract.txt)
(33,678 bytes, SHA-256 `d0e6361e0071ad7a842290119b6a994c55dd0bbe2494fc72a18a3b5c9eaacbb6`).
It carries the ARJ comment `ARJ archive created by Kenneth G. Kirkpatrick R#2112` and the
`ALMANAC/` member list (`NAMES.EXE`, `DOCS.NAM`, `NAME001.NAM`…, `FILE_ID.DIZ`) — consistent
with the 17 October `KGK.ARJ` inspection recorded in
[`greeran-family-tree-ebook-and-data-status.md`](greeran-family-tree-ebook-and-data-status.md)
and the FNA102B preservation in [`fna102b-xena-preservation.md`](fna102b-xena-preservation.md).
This extract supersedes the transcript’s unfinished base64 work; no re-encoding is needed.

## 2 · Standing decisions applied while processing

| Flag | Decision |
| --- | --- |
| **F1** — “globally chmod 777 in the repository” (line 171) | **Declined.** World-writable files are a security defect and break git’s permission discipline. Nothing in the deliverables needs it; any runtime exception should be granted per-directory. |
| **F2** — ungarbling the KGK.ARJ / FNA102B name database | **Standing decision governs.** The repository has already recorded *preserve and inspect only: no member decrypted, no garble key sought* (see [`fna102b-xena-preservation.md`](fna102b-xena-preservation.md)). Recipe/tooling research about ARJ and SFX passwords stays in scope; applying it to the shareware name database does not. |
| **F3** — external hosts (archive.org, ebay, LexisNexis, cad.chp.ca.gov, docs.google.com, science.edu, cs.ucsb.edu, kksoft.com, …) | Route through the repo’s `.relay` / `.arena-drive` fetch runners or user-supplied captures; this build sandbox only reaches github.com/api.github.com, npm and PyPI directly. |
| **F4** — John the Ripper / Elcomsoft / rainbow tables / HaveIBeenPwned | Security-research notes and cookbook recipes only; no credential attacks against third-party systems. |

## 3 · Parallel work streams

Status key: **done** · **partial** (artifacts exist, work remains) · **open** · **declined**.
Full task→stream mapping and per-item line numbers are in the JSON companion.

### S1 · Archive formats & crypto-forensics corpus — *partial*
Decompressor recipe matrix (ace rar arj uue zip 7z iso img peazip 7zip pkware), ARJ/SFX
password recipes at the cookbook level (F2/F4), and the ordered “bag-it → xena → ghirdra”
preservation of the Google Doc `1luBwx1iBXdVbJu0AIvQabgWyz0NJ5dmJBtKoabJBr9I` with its Drive
PDF. Already on file: [`arj-garble-format-notes.md`](arj-garble-format-notes.md),
[`fna102b-xena-preservation.md`](fna102b-xena-preservation.md),
[`exe-compressors-and-scumm.md`](exe-compressors-and-scumm.md),
[`exe-protection-deep-dive.md`](exe-protection-deep-dive.md),
[`software-protection-encyclopedia.md`](software-protection-encyclopedia.md).

### S2 · Sneakers press kit: Ghidra, js-dos xdc, wiki — *partial*
FindCrypt/native-Ghidra work is done ([`sneakers-original-ghidra-wasm-2026-10-18.md`](sneakers-original-ghidra-wasm-2026-10-18.md),
[`ghidra/sneakers-original-native-ghidra-2026-10-18.md`](ghidra/sneakers-original-native-ghidra-2026-10-18.md),
wiki draft [`Sneakers-Archive-and-Ghidra`](github-wiki/Sneakers-Archive-and-Ghidra.md)).
Remaining: verify the `sneakers-press-kit.xdc` keyboard/mouse layout against the
headline-harry pattern, DOSBox+Xvfb automation notes, wiki refresh + PR.

### S3 · Retro gaming RE: Game Genie / Game Wizard / UHS / Sierra — *open*
Format study and abandonware sweep (Easter eggs, walkthroughs, *Shadow President*), feeding
the existing DOS disassembly line ([`dos-game-disassembly.md`](dos-game-disassembly.md),
[`spycraft-research.md`](spycraft-research.md)).

### S4 · Subsurface viewers: California → 50 states → country → planet — *partial*
The GIS mega-task (line 6). Existing base: `socal-subsurface.html` +
[`socal-subsurface.md`](socal-subsurface.md), [`city-subsurface.md`](city-subsurface.md),
[`terrain-vector-overlay-deep-dive.md`](terrain-vector-overlay-deep-dive.md),
gazetteer standards in [`research/`](research/02_ADL_GAZETTEER_CONTENT_STANDARD.md),
`planet-viewer-4dwm.html` + [`planet-viewer-deep-dive.md`](planet-viewer-deep-dive.md).
Sequencing implied by the source text: California state viewer (extend DEM; layers for Nike
missile sites, Aerojet, Morris Dam torpedo testing, Manzanar + other POW camps, Goleta
historical-society points, Western White House, Sonoma/Napa vineyards-by-vintner, UC campuses
+ satellites, Sierra Club huts, historic mine maps, factory outlets, Renaissance faires,
Red Cross / evacuation centers) → Nevada + Arizona → territories (Guam, American Samoa, USVI,
Midway) → remaining states → PC-Globe-style country viewer with CIA Factbook notes (national
anthem/instrument) → Ghidra PC Globe→Java experiment → reuse the Red October globe for the
planet viewer.

**Round 16 status (2026-10-22): partial.** California now has 16 per-ID
`VERIFIED=1` GNIS rows beside 11 retained curated `VERIFIED=0` rows; Nevada
and Arizona shipped as the seventh/eighth frames with 12/12 GNIS starter rows
each. The source contract and identity rejections are in
[`../resources/city-subsurface/gnis-state-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-source-register-2026-10-22.json)
and [`city-subsurface.md`](city-subsurface.md). Next in sequence: territories
before the remaining states; bulk California themes and archived-class
features still require dated per-row source registers.

**Round 17 status (2026-10-22): partial.** Guam, American Samoa
(Tutuila–Manuʻa only; Swains Island/Rose Atoll explicitly omitted), the U.S.
Virgin Islands, and Midway shipped as configurations 9–12 with 12/12/12/6
per-ID GNIS starter rows. The shared engine now formats N/S/E/W by sign and
renders disconnected coastline polylines; Hagåtña is correctly retained as
GNIS Civil rather than a populated place. Provenance and rejections are in
[`../resources/city-subsurface/gnis-territory-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-territory-source-register-2026-10-22.json).
Next in sequence: remaining states in source-register batches; bulk
California themes and archived-class features still require dated per-row
registers and an explicit archival-source decision.

**Round 18 status (2026-10-22): partial.** Utah, Colorado, and New Mexico
shipped as configurations 13–15 and complete the Four Corners state batch,
each with a 12/12 per-ID `VERIFIED=1` GNIS starter register, synthetic
relief, and generalized context corridors. Provenance, identity decisions,
and deliberately unseeded candidates are in
[`../resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json`](../resources/city-subsurface/gnis-state-batch2-source-register-2026-10-22.json).
Important guards include Green River Stream versus town; Grand Lake lake
versus town; South Platte's returned Logan County primary-county provenance
versus its sequence-1 point; and Pecos River remaining a corridor because
two Eddy County Stream records are indistinguishable.
Next in sequence: remaining states in dated per-row source-register batches;
bulk California themes and archived-class features still require separate
explicit source decisions before any new verified rows.

**Round 19 packaging status (2026-10-23): partial.** SoCal Subsurface now has
a finished inlined edition beside the canonical multi-file XDC:
`socal-subsurface-inlined.html` and the six-entry
`socal-subsurface-inlined.xdc`, built reproducibly by
`scripts/build-socal-subsurface-inlined.mjs`. The geographic queue is
unchanged: remaining states still need dated per-row source-register
batches, and no DEM is claimed for the checked-in inlined build.

**Round 20 status (2026-10-23): partial.** Oregon, Washington, and Idaho
shipped as configurations 16–18, each with a 12/12 per-ID `VERIFIED=1`
GNIS starter register, labelled synthetic relief, generalized context
corridors, and no DEM. Provenance and identity decisions are in
[`../resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch3-source-register-2026-10-23.json).
Guards include Mount Hood Summit versus populated place; Klamath County
Crater Lake versus same-name lakes; Columbia River seeded under Oregon
only after the Washington screen returned empty; Spokane River left
unseeded for two exact stream candidates; Snake River seeded under
Washington only after the Idaho screen returned no exact stream; and Bear
Lake left unseeded in Idaho. Next in sequence: remaining states in dated
per-row batches, then the country/planet thread.

**Round 21 status (2026-10-23): partial.** Montana and Wyoming shipped as
configurations 19–20, each with a 12/12 per-ID `VERIFIED=1` GNIS starter
register, labelled synthetic relief, generalized context corridors, and no
DEM. Provenance and identity decisions are in
[`../resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch4-source-register-2026-10-23.json).
Granite Peak and Jackson Lake additionally carry GNIS Domestic Names per-ID
checks: Granite Peak's Park County Summit record (`784178`, High Point)
beats two same-name Summit candidates, and Jackson Lake's Teton County
record is stored as a Reservoir (`1609177`) against the same-name Natrona
County lake. Yellowstone/Missouri rivers (MT) and North Platte/Snake/Green
River main stem (WY) remain corridors after empty or mismatched state
screens; Glacier National Park returned only Division records. Next in
sequence: remaining states in dated per-row batches, then the
country/planet thread.

**Round 22 status (2026-10-23): partial.** North Dakota and South Dakota
shipped as configurations 21–22, each with a 12/12 per-ID `VERIFIED=1`
GNIS starter register, labelled synthetic relief, generalized context
corridors, and no DEM. Provenance and identity decisions are in
[`../resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch5-source-register-2026-10-23.json).
White Butte and Black Elk Peak additionally carry GNIS Domestic Names
per-ID checks: four same-name Summit candidates collapse to Slope County
`1035239` (High Point, "3506 feet"), and `1261770` is the 2016
Harney→Black Elk rename in Pennington County. Devils Lake town and lake
seed as separate classes with distinct points; Missouri River and both
Red River spellings (ND) plus Missouri (SD), ND James River, Badlands
National Park, and Lake Sheridan stay unseeded after empty screens; the
South Dakota James River record is seeded only there. Next in sequence:
Nebraska–Kansas, then the remaining plains/mountain states before the
country/planet thread.

**Round 23 status (2026-10-23): partial.** Nebraska and Kansas shipped as
configurations 23–24, each with a 12/12 per-ID `VERIFIED=1` GNIS starter
register, labelled synthetic relief, generalized context corridors, and no
DEM. Provenance and identity decisions are in
[`../resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch6-source-register-2026-10-23.json).
Panorama Point and Mount Sunflower additionally carry GNIS Domestic Names
per-ID checks: both state high points keep their High Point coordinate
markers and “highest elevation” descriptions (NE 5424 ft, KS 4039 ft).
Lincoln rejects its precinct/county pile, Grand Island rejects the Buffalo
County island, Scottsbluff town and Scotts Bluff Summit seed as distinct
features, North Platte town and river seed as distinct features, and the
Wyandotte County Kansas City record stays separate from the Missouri-side
one. Missouri River (NE and KS), Republican River (NE), and Arkansas
River (KS) remain corridors after empty screens — the Arkansas result
matches the round-18 Colorado empty screen. Salina is identity-safe but
held to starter scope. Next in sequence: remaining plains/mountain states
in dated per-row batches, then the country/planet thread.

### S5 · Live incident, camera & sensor layers — *open*
API inventory and adapters: cad.chp.ca.gov live incidents, CALTRANS + other state DOT cameras,
WildCAD, interagency per-state incident lists, NIFC historical fires, WiFire, WREN cameras,
liveuamap, NOTAMs; static layers for fire lookouts and KiwiSDR/SDR receivers; dish-pointing /
satellite-alignment calculator layer; tv.garden / radio.garden transcription pipeline.

### S6 · BBS & telecom history: Keyhole, FidoNet/ARPANET, payphones, ColdFire — *partial*
Keyhole BBS + forum deep dive and In-Q-Tel/VC mapping are new; the BBS→ColdFire port line has
several docs already ([`bbs-abandonware-coldfire-port.md`](bbs-abandonware-coldfire-port.md),
[`java-bbs-coldfire-survey.md`](java-bbs-coldfire-survey.md),
[`xport-bbs-deployment.md`](xport-bbs-deployment.md)). Adds FidoNet + ARPANET map layers and a
payphone census (Mojave, rest stops, ZIP-coded).

**Round 16 status (2026-10-22): partial.** The consumer historical-network
viewer is scoped in
[`historical-network-viewer-scope-2026-10-22.md`](historical-network-viewer-scope-2026-10-22.md)
as a separate offline map/topology/records product; no ARPANET/FidoNet/
payphone dataset has been seeded. USBBS #134 (July 1995) repeats the Denver
Keyhole BBS listing, but it is the same publication lineage as #127—not the
requested second independent listing. Next: source-rights decision, lawful
F3 captures, and a one-snapshot Keyhole vertical slice before adapters.

**Round 17 status (2026-10-22): partial.** Phase 0 shipped as a tested
Keyhole evidence fixture, standalone
[`historical-network-viewer.html`](../historical-network-viewer.html), shared
validator/merge rules, and a local TEXTFILES-style BBS-list importer; see
[`historical-network-keyhole-fixture-2026-10-22.md`](historical-network-keyhole-fixture-2026-10-22.md).
The USBBS rights decision is conservative: short cited fixtures and local
import only, so the fixture is structurally valid but not capture-ready.
TEXTFILES.COM's 303 compilation repeats the Denver record with a 1994–1996
span, but its per-record source—and therefore independence from USBBS—is
unresolved. Exact NodelistDB historical searches found no Denver match.
Next: lawfully capture and hash redistributable snapshots before bundled
FidoNet/ARPANET/payphone datasets.

**Round 18 status (2026-10-22): partial.** The FidoNet Phase 2 local
adapter shipped: an FTS-5000 nodelist parser that derives `zone:net/node`
addresses and preserves branch/status/flag observations, local SHA-256
capture metadata in the viewer, format detection, and edition-checked
nodediff/chain application in the shared model. See
[`historical-network-fidonet-adapter-2026-10-22.md`](historical-network-fidonet-adapter-2026-10-22.md).
No historical nodelist was bundled: checked prologues allow intra-FidoNet
use/distribution but reserve other uses absent express written consent, so
a hashed local import remains local-only and `captureReady` remains false.
No new Keyhole evidence was claimed. Next: obtain a lawfully redistributable
complete snapshot/diff chain before deriving hierarchy/route edges; then a
dated ARPANET textual source and local payphone observations.

### S7 · Goldkey / Gina.dll parity backup, CAD + BOM, uClinux fax — *partial*
Continue [`goldkey-parity-gina-and-units.md`](goldkey-parity-gina-and-units.md) with the
master/grandmaster key hierarchy, per-unit CAD/BOM ([`tools/build_unit_cad.mjs`](../tools/build_unit_cad.mjs),
[`tools/gina-driver-guide-check.mjs`](../tools/gina-driver-guide-check.mjs)), and the uClinux
transcription + softmodem fax JAR ([`hp-aio-xport-modem-adapter-feasibility.md`](hp-aio-xport-modem-adapter-feasibility.md),
[`xport-nucleo-v92-eio-fax-card.md`](xport-nucleo-v92-eio-fax-card.md)).

**Round 19 toolchain status (2026-10-23): still externally blocked, but the
blocker is narrower.** The GitHub survey in
[`github-jdk-runtime-research-2026-10-23.md`](github-jdk-runtime-research-2026-10-23.md)
re-verified local Temurin OpenJDK 21 and a pinned/hash-checked Zulu OpenJDK 8
route; “no JDK” is no longer the blanket blocker. S7 still needs the actual
`gina.dll` binary, physical teardown data, or proprietary GoldKey drivers,
and a local Ghidra distribution still needs the CI/relay route. Do not invent
substitutes for those missing artifacts.

### S8 · Mobile & device lab: Android/QEMU, SIM, xdc ports, VoIP/iParty — *open*
QEMU Android lab (SDK, ADB sideload, replacement OSes, model-lock / number-porting caselaw),
SIM-lock research, Eagle CAD unlock schematics, xdc → TI-calc / Android / F-Droid ports
(socal-subsurface first), Hotline/KDX/FXP, Intel iParty + Creative Labs FCC schematics,
VoIP Blaster, DUCK codecs, lossless comms room, Tetrinet.

### S9 · Vault, stego & smartcard filesystems: shufflecake, haiku vault, boot-chain — *partial*
Catalog the OCR haiku into the haiku vault and verify the enso generators + haiku randomizers
against the standard vault format (the workbench lineage is in the [README](../README.md));
Shufflecake + steganography → CyberChef recipes; BasicCard/JavaCard virtualized reader and
smartcard filesystem candidates within the 4MB XPort Pro / 2MB S.S.E. URL budget; the
LUKS/GRUB/LILO boot-chain + AES pass-through dongle concept as a research note; quine → S.S.E.
URL export with password + QR/data-matrix (Avery Label Pro) — and **draft the BagIt and
haiku-vault RFC documents** (BagIt 1.0 / RFC 8493 is already the house preservation format).

**Round 19 smartcard status (2026-10-23): partial.** The MealPlan Java Card
toolchain now self-prepares from pinned GitHub inputs with SHA-256 checks,
and the live simulator suite passes 18/18 when GitHub is reachable; offline,
its card-backed cases skip explicitly. A physical-card/GlobalPlatform load
remains unproven. See
[`feitian-javacard-toolchain.md`](feitian-javacard-toolchain.md) and
[`github-jdk-runtime-research-2026-10-23.md`](github-jdk-runtime-research-2026-10-23.md).

### S10 · CyberChef & recipe corpus, lecture hall, UCSB course readers — *partial*
Comparative optimization of the whole recipe set (line 7), DTSearch + Granite Island TCSM
sweep, cipher-machine / virtual-intelligence lecture-hall material, course-reader sourcing
rounds ([`recipe-sourcing-round-5-2026-10-14.md`](recipe-sourcing-round-5-2026-10-14.md),
[`ucsb-2001-first-quarter-research.md`](ucsb-2001-first-quarter-research.md)).

### S11 · Wallets, mnemonics, classified name generator, spy-book challenges — *partial*
Wallet crypto-card + mnemonic work feeds the existing bip39-haiku workbench; the “classified
random name generator” links to the First Name Almanac `NAMES.EXE` lineage (historical
context only — F2); locate the cold-war spy book’s 18 end-of-book challenges and distill
recipes.

### S12 · Web archaeology: Cicada 3301, Warrick recovery, Geomate Jr — *partial*
Cicada QR + lat/long hunt → US subsurface viewer and cipher-machine Hall-of-Fame lecture;
apply the Warrick web-archiving method to lost cicada3301 sites
([`dss-casefiles-riddle-warrick.md`](dss-casefiles-riddle-warrick.md),
`research/warrick_geomate_audit`); Geomate Jr firmware + geocaching points
([`geomate-gpx-preservation.md`](geomate-gpx-preservation.md),
[`geomate-jr-firmware-research.md`](geomate-jr-firmware-research.md)).

### S13 · Intelligence-archive research: bin Laden hard-drive release — *open*
Publicly released CIA/FOIA/archive.org material only; deliverable is a source-checked
research note in house style.

### S14 · Changelly drainer script analysis — *done*
See [`changelly-drainer-analysis.md`](changelly-drainer-analysis.md).

## 4 · Execution notes

- The fourteen streams have **no dependencies on each other** except S4←S5/S12 (layer
  contributions) and S1↔S2 (shared Ghidra/Cookbook notes), so they can run concurrently.
- Items needing hosts outside the sandbox’s allowlist (F3) should be batched into one relay
  fetch round before execution to avoid stalling multiple streams.
- The failed transcript in the source file is **not** re-executed: its goal (preserve the
  KGK.ARJ listing) is satisfied by `research/kgk-arj-listing-extract.txt`, and its
  transformation goal is superseded by the F2 standing decision.
