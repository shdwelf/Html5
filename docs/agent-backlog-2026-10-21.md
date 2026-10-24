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
*2026-10-23 round (T1.2):* ZipCrypto identification notes added —
[`zipcrypto-identification-notes-2026-10-23.md`](zipcrypto-identification-notes-2026-10-23.md)
(identification only per F4; companion op `paranoidUnzip`). Ghidra-side decompressor
work remains blocked on a sandbox JVM.

### S2 · Sneakers press kit: Ghidra, js-dos xdc, wiki — *partial*
FindCrypt/native-Ghidra work is done ([`sneakers-original-ghidra-wasm-2026-10-18.md`](sneakers-original-ghidra-wasm-2026-10-18.md),
[`ghidra/sneakers-original-native-ghidra-2026-10-18.md`](ghidra/sneakers-original-native-ghidra-2026-10-18.md),
wiki draft [`Sneakers-Archive-and-Ghidra`](github-wiki/Sneakers-Archive-and-Ghidra.md)).
Remaining: verify the `sneakers-press-kit.xdc` keyboard/mouse layout against the
headline-harry pattern, DOSBox+Xvfb automation notes, wiki refresh + PR.

### S3 · Retro gaming RE: Game Genie / Game Wizard / UHS / Sierra — *partial*
Format study and abandonware sweep (Easter eggs, walkthroughs, *Shadow President*), feeding
the existing DOS disassembly line ([`dos-game-disassembly.md`](dos-game-disassembly.md),
[`spycraft-research.md`](spycraft-research.md)). Game Genie (NES) decode/encode shipped
in CyberChef as `gameGenieNes` (both builds; `SXIOPO → $91D9 ← $AD` known-answer +
round-trip tests — `tests/cyberchef-game-genie.test.mjs`); SNES Game Genie followed as
`gameGenieSnes` (worked example `ABCD-EFFF` = $C4A704:$C9, LoROM/HiROM offset option).
Game Boy/Game Gear and Genesis Game Genie followed (`gameGenieGb`, `gameGenieGenesis`;
7/7 tests, published worked examples). Game Wizard / UHS / Sierra strands surveyed in
[`game-wizard-uhs-sierra-status-2026-10-23.md`](game-wizard-uhs-sierra-status-2026-10-23.md):
Game Wizard needs its shareware binary (fetch-runner); a UHS88a reader is built
(`js/uhs.js` + `uhs-reader.html`, `tests/uhs.test.mjs` 3/3); the Sierra sweep is editorial.

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

**Round 24 status (2026-10-23): partial.** Oklahoma and Texas shipped as
configurations 25–26, each with a 12/12 per-ID `VERIFIED=1` GNIS starter
register, labelled synthetic relief, generalized context corridors (Texas
adds a labelled generalized Gulf coast line), and no DEM. Provenance and
identity decisions are in
[`../resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch7-source-register-2026-10-23.json).
Guadalupe Peak additionally carries a GNIS Domestic Names per-ID check:
Class=Summit, Culberson County, High Point, “Highest elevation in TX at
8749 feet”, with the El Capitan/Signal variants of the same record.
Oklahoma's Black Mesa high point stays unseeded after two empty `states=OK`
screens (Mount Scott notes it is not the high point); the Texas Red River
stream record `1344947` was reviewed per-ID and rejected because both
sequences sit in Brown County, far from the intended border reach, so
Red River stays corridor-only in both frames; Arkansas River is empty for
a third consecutive state after Colorado and Kansas. The Division piles
reject the Oklahoma City/Tulsa/Lawton/Norman/Stillwater/Enid same-name
records, the Texas metros reject their county/division/colonia/branch
piles, Galveston Bay stores the returned Bay class, Palo Duro Canyon
stores the returned Valley class, and Rio Grande seeds at the Cameron
County Gulf mouth where New Mexico left it unseeded in round 18. Next in
sequence: the West North Central remainder (Iowa, Missouri, Minnesota) or
the Gulf/South Atlantic states, then the country/planet thread.

**Round 25 status (2026-10-23): partial.** Iowa and Missouri shipped as
configurations 27–28, each with a 12/12 per-ID `VERIFIED=1` GNIS starter
register, labelled synthetic relief, generalized context corridors, and
no DEM. Provenance and identity decisions are in
[`../resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch8-source-register-2026-10-23.json).
Hawkeye Point and Taum Sauk Mountain additionally carry GNIS Domestic
Names per-ID checks: both state high points keep their High Point
coordinate markers and “highest elevation” descriptions (IA 1670 ft, MO
1772 ft), with the Taum Sauk record's “Tom Sauk Mountain” variant
rejected as the same record and its 1e-7-degree coordinate print
difference disclosed. The St./Saint spelling gates (St. Louis and St. Joseph
screens empty, Saint spelling returns the places), the Missouri River's
first statewide row after six empty upstream screens, the Mississippi
River Hills name/type mismatch, the Kansas City two-series disclosure,
and Waterloo's starter-scope hold are all recorded; Current River and the
Iowa-side Mississippi/Missouri rivers stay corridor-only. Next in
sequence: Minnesota closes the West North Central division, then the
Gulf/South Atlantic states, then the country/planet thread.

**Round 26 status (2026-10-23): partial.** Minnesota and Louisiana shipped
as configurations 29–30, each with a 12/12 per-ID `VERIFIED=1` GNIS starter
register, labelled synthetic relief, generalized context corridors, and no
DEM; Louisiana additionally carries a labelled generalized Gulf coast line.
Provenance and identity decisions are in
[`../resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch9-source-register-2026-10-23.json).
Eagle Mountain and Driskill Mountain carry GNIS Domestic Names per-ID
checks (“Highest elevation in MN at 2301 feet” on FEATURE_ID 656081,
disambiguated from two undesignated same-name summits the Geocoder listed
first, and “Highest elevation in LA at 535 feet”); Lake of the Woods
carries a Board-decision per-ID check (1911/1953, 18 sequences) rejecting
the 2001 duplicate. The Mississippi River gets its first seeded statewide
row in Louisiana (Plaquemines) after the Iowa empty screen, the Missouri
name mismatch, and the Minnesota reservoir-only screen; the Red River
chain closes at the West Feliciana record after ND/OK empties, the Texas
Brown County rejection, and the Minnesota-registered Red River of the North
whose returned primary sits in Canada (border corridor with disclosure).
St. Paul and St. Cloud add the third and fourth St./Saint spelling gates;
Monroe is held out as two indistinguishable populated places; Lake
Superior, St. Croix River, and Toledo Bend Reservoir screened empty;
Rainy Lake holds as a four-way ambiguity. Next in sequence: Gulf/South
Atlantic states (Mississippi/Alabama/Georgia …), then the country/planet
thread.

**Round 27 status (2026-10-23): partial.** Mississippi and Alabama shipped
as configurations 31–32, each with a 12/12 per-ID `VERIFIED=1` GNIS starter
register, labelled synthetic relief, generalized context corridors, no DEM,
and a labelled generalized Gulf coast line. Provenance and identity
decisions are in
[`../resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch10-source-register-2026-10-23.json).
Woodall Mountain and Cheaha Mountain carry GNIS Domestic Names per-ID
checks (“Highest elevation in MS at 806 feet” on FEATURE_ID 692362 with
Bear/Woodalls Mountain variants, and “Highest elevation in AL at 2407 feet”
on FEATURE_ID 159374 with the 1906 Board Decision and four historic
variants) — both recalled elevations were wrong. Guntersville Lake selects
FEATURE_ID 119508 over the suggestion-listed parallel Jackson County
record 1286448 on decision-card evidence (a new register tie-break rule);
Wheeler Lake separates its intended Limestone County reservoir 112837 from
a same-name Chambers County lake 131097 entered on the Georgia border.
The Mississippi main stem stays corridor-only in its own state after a
**fifth empty/mismatched screen** (MS returned an empty array; Tombigbee
is empty under MS but seeds in Alabama; the Alabama Tombigbee point sits
~100 m from the Alabama River’s at their shared confluence, both as
returned). Ross R Barnett Reservoir clears the round-24 punctuation gate
(term carried periods, official name without); Lake Martin and Tennessee
River screens returned empty; Pearl River returns only county/town/census
records under states=MS. County/census-division-first suggestion traps
pile across all six Alabama cities and Jackson MS — every rejected twin is
named in the register. Final: cities 32 (17/17), Node 730, vitest 307,
wiki 222, city XDCs 79 entries. Next in sequence: Georgia, then Florida,
then the country/planet thread.

**Round 28 status (2026-10-23): partial.** Georgia shipped as
configuration 33 with a 12/12 per-ID `VERIFIED=1` GNIS starter register,
labelled synthetic relief, five generalized context corridors, no DEM,
and a labelled generalized Atlantic coast line. Provenance and identity
decisions are in
[`../resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch11-source-register-2026-10-23.json).
Brasstown Bald carries the per-ID high-point check (“Highest elevation in
GA at 4784 feet”, FEATURE_ID 354839, executed against the official
gaznames_default REST layer because the SPA detail route renders
client-side). Lake Oconee seeds FEATURE_ID 330982 over the parallel Oconee
County same-name record 319902 via a new description-locator tie-break
(“Located 6 km (3.7 mi) ENE of Rockville” on the seeded record; blank
description and differing stored gaz_elevation on the twin). The Savannah
River screen is empty under states=GA — the national screen returns only
the South Carolina record 1253486 — and Lake Lanier screens as a
populated place only (1688216; Buford Reservoir alternate empty); both
stay corridor/unseeded with disclosure. Chattahoochee 354236 and
Ogeechee 354254 are held to starter scope with their FEATURE_IDs kept in
the corridor. All six city screens shed county/census-division piles.
Ocmulgee + Oconee seed as a confluence pair (points ~60 m apart, both as
returned). Round 28 also reconciled merge-delta content from PR #134
(T3.1 Game Genie family): four stale CyberChef count guards 511 → 515,
the cookbook card text, and the jsdom `bake()` teardown race stubbed in
two tests. Final: cities 33 (18/18), Node 806 = 796/10/0, vitest 307,
wiki 244, city XDCs 81 entries. Next in sequence: South Carolina, then
the remaining seaboard states, Florida, then the country/planet thread.

**Round 33 status (2026-10-23): partial.** PR #139 merged into main
under a main-preferred reconciliation (PRs #137/#140 had built
Minnesota/Iowa/Missouri/Georgia in parallel; main's copies are kept).
PR #139's non-duplicated frames — Wisconsin, Michigan, Illinois,
Indiana, Ohio, Pennsylvania, Arkansas, Kentucky, Tennessee, Virginia,
West Virginia, North Carolina, South Carolina, Florida — shipped as
configurations 34–47, each with a 12/12 per-ID `VERIFIED=1` GNIS
starter register, labelled synthetic relief, generalized context
corridors, and no DEM. Provenance is in
`gnis-state-batch8-source-register-2026-10-23-pr139.json` (WI/MI),
`gnis-state-batch9-source-register-2026-10-23-pr139.json` (IL/IN),
`gnis-state-batch10-source-register-2026-10-23-pr139.json` (OH/PA),
`gnis-state-batch11-source-register-2026-10-23-pr139.json` (AR),
[`../resources/city-subsurface/gnis-state-batch12-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch12-source-register-2026-10-23.json) (KY/TN),
[`../resources/city-subsurface/gnis-state-batch13-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch13-source-register-2026-10-23.json) (VA/WV),
[`../resources/city-subsurface/gnis-state-batch14-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch14-source-register-2026-10-23.json) (NC/SC),
and the Florida frame of
[`../resources/city-subsurface/gnis-state-batch15-source-register-2026-10-23.json`](../resources/city-subsurface/gnis-state-batch15-source-register-2026-10-23.json)
(its Georgia frame is superseded by main's batch-11 Georgia). The
gazetteer gained the `Ridge` class (Magazine Mountain), and PR #139's
GNIS candidate-extraction pipeline (`tools/gnis_extract.py`,
`.arena-gnis/candidates.json`, `arena-gnis-fetch.yml`) plus the
cumulative `gnis-candidates-batch7.json` extract were retained.
Final: cities 47 (26/26), Node 814 = 802 pass/12 skipped/0 fail.
Next in sequence: the country/planet thread.

**Round 34 status (2026-10-23): partial.** PR #141 reconciled
main-preferred after PR #139 landed: the branch had independently run
“Continue backlog” as its own South Carolina (their batch-12, 12 rows:
North Charleston, Rock Hill, Santee, …) while PR #139 shipped the
canonical South Carolina as configuration 34 in batch 14 (Myrtle Beach,
Lake Moultrie, Congaree, …). Main's frame, batch numbering
(batch 12 = Kentucky–Tennessee), registers, tests, and docs are kept;
the branch's duplicate generation is dropped, with its unique screening
evidence transferred instead: the Sassafras Mountain row/node/frameNote/
knownLimitations now carry **3,560 feet from the current USGS
Elevations and Distances table** (fetched 2026-10-23 — the same table
that supplies this batch's Mount Mitchell 6,684 and Kuwohi 6,643
citations) beside the earlier USGS-published 3,553 feet, both figures
disclosed and both pinned by test; the Savannah River row's stale
“no Georgia frame exists yet” parenthetical is replaced by the live
cross-reference (main's Georgia frame carries the batch-11
`savannah-river` corridor on FEATURE_ID 1253486, whose states=GA screen
returned an empty array — pinned by test); and a new known limitation
preserves the parallel screen's Rock Hill census-class tie-break
(York 1250417 P1+GSA/OPM versus Fairfield 1231736 U6, ~78 km apart,
neither seeded) plus the North Charleston and Santee River verified
alternates. Record: [`backlog-execution-round-34-2026-10-23.md`](backlog-execution-round-34-2026-10-23.md).
Final: cities 47 (26/26), city XDCs 47 rebuilt (southcarolina 109
entries), wiki 250. Next in sequence unchanged: the country/planet
thread.

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

**Round 19 status (2026-10-23): T6.2 open → partial.** First bundled
comms-history content pack seeded in the historical-network schema:
ARPANET IMP #1–#4 (1969, with the UCLA→SRI first-message edge), FidoNet
origin (San Francisco, 1984), and the Mojave phone booth (removed
2000-05-17) — all cited public facts, no nodelist/USBBS bulk data
(local-import-only rights decision stands).
[`fidonet-arpanet-map-layers-2026-10-23.md`](fidonet-arpanet-map-layers-2026-10-23.md);
seed `resources/historical-network/comms-history-seed-2026-10-23.json`.
Remaining: viewer rendering of the pack, ARPANET 1971/1977 time slices,
redistributable-nodelist bulk layer if rights ever clear.

**Round 20 status (2026-10-23): viewer wiring DONE.** `historical-network-viewer.html`
now offers all three bundled packs (Keyhole, comms-history, Cicada-3301 US
posters) in a pack picker; `scripts/build-historical-network.mjs` generates
all three data modules; coordinate-bearing places render as a schematic
lon/lat scatter with logical edges, ungeocoded packs keep the uncertainty
box; year filter bounds are per-pack. Tests: historical-network suites
16/16. Remaining: ARPANET 1971/1977 time slices; bulk FidoNet layer only
with a redistributable snapshot.

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
*2026-10-23 round (with S6/T6.3):* SpiderMonkey investigated (upstream in
`mozilla/gecko-dev`; the repo's live engine is Synchronet's vendored JS
1.8.5) and ruled out for the ColdFire target; C-BBS survey chose an
**MBSE-derived minimal FTN node** (pure C, `mbcico`/`mbfido news`/`mbnntp`)
over Synchronet (hosted flagship) and WWIV (fallback); Wildcat excluded
(closed source). FidoNet↔news substrate built: `js/fidonet-pkt.js`
(FTS-0001 + MSGID→Message-ID mapping, 5/5 tests).
[`spidermonkey-bbs-uclinux-fidonet-news-2026-10-23.md`](spidermonkey-bbs-uclinux-fidonet-news-2026-10-23.md).
Remaining: the m68k-uclinux C port itself; no live FTN peering fabricated.
*Conversion started:* `tools/bbs/ftnpkt.c` (C99 FTS-0001 parser + `--news`
mapper) cross-checked against the JS implementation with a `-Werror` test
harness — the first uClinux-shaped C artifact of the MBSE-subset plan.
*2026-10-23 round (T6.3/T7.2):* the m68k cross-build now runs —
`.github/workflows/arena-m68k-crossbuild.yml` (run 40027253569) compiled
`ftnpkt.c` with `m68k-linux-gnu-gcc` 13.3 (`-Werror`-clean, static MC68000
ELF, sha256 `efb8e6b83a81…`) and executed it under `qemu-m68k` 8.2.2:
dump + `--news` output **byte-identical** to the host build on the fixture
from `tools/bbs/make_fixture.mjs` (`.arena-m68k/result.md`). The sandbox
zig route was ruled out (its LLVM ships no m68k backend). Remaining:
uClinux bFLT target, a run on ColdFire iron, live peering.

**Round 19 toolchain status (2026-10-23): still externally blocked, but the
blocker is narrower.** The GitHub survey in
[`github-jdk-runtime-research-2026-10-23.md`](github-jdk-runtime-research-2026-10-23.md)
re-verified local Temurin OpenJDK 21 and a pinned/hash-checked Zulu OpenJDK 8
route; “no JDK” is no longer the blanket blocker. S7 still needs the actual
`gina.dll` binary, physical teardown data, or proprietary GoldKey drivers,
and a local Ghidra distribution still needs the CI/relay route. Do not invent
substitutes for those missing artifacts.

### S8 · Mobile & device lab: Android/QEMU, SIM, xdc ports, VoIP/iParty — *partial*
QEMU Android lab (SDK, ADB sideload, replacement OSes, model-lock / number-porting caselaw),
SIM-lock research, Eagle CAD unlock schematics, xdc → TI-calc / Android / F-Droid ports
(socal-subsurface first), Hotline/KDX/FXP, Intel iParty + Creative Labs FCC schematics,
VoIP Blaster, DUCK codecs, lossless comms room, Tetrinet.
*2026-10-23 round (T8.3):* iParty / VoIP Blaster / DUCK research delivered —
[`iparty-voipblaster-duck-2026-10-23.md`](iparty-voipblaster-duck-2026-10-23.md):
iParty is 1995 Intel software (no FCC filing; ACM-delegated codec), the VoIP
Blaster is Part 15B wired (no FCC schematics exist), DUCK/TrueMotion lineage
ends in WebM with FFmpeg decoders source-available. T8.3 now *partial*;
lossless comms room + Tetrinet remain.
*2026-10-23 round (T8.4):* SIM-lock research delivered —
[`sim-lock-research-2026-10-23.md`](sim-lock-research-2026-10-23.md):
§1201 exemption timeline (2006→Pub. L. 113-144→89 FR 85437 in 2024), CTIA
commitments, FCC 24-77 unadopted, DA 26-43 (2026) Verizon waiver — all from
free primary sources, LexisNexis alternatives mapped. T8.4 now *partial*;
QEMU phone lab remains.
*2026-10-23 round:* the xdc-port family gained its Java-server path — all 55
repo `.xdc` converted to deterministic Tomcat WARs (54 built, `greeran-book.xdc`
skipped as not-a-ZIP) with an `xdc-viewer.war` catalogue/player; Struts/JSF
investigated and deliberately not adopted for static apps
([`apache-struts-jsf-tomcat-xdc-war-2026-10-23.md`](apache-struts-jsf-tomcat-xdc-war-2026-10-23.md)).
TI-calc strand scoped in [`ti-calc-port-status-2026-10-23.md`](ti-calc-port-status-2026-10-23.md):
the SITE-K calc engine re-verified green (`make -C calc test`), a full socal-subsurface
port ruled out with numbers (863 KB WebGL app vs 24 KB RAM), and the honest follow-ons
defined (SUBSURF sketch screens, sdcc via runner, F-Droid wrapper via runner).
*Correction (2026-10-23, later pass):* the TI expression already exists — `socal-calc/`
is a complete SOCAL SUBSURFACE calculator port; `make -C socal-calc test` re-verified
green. Only device compilation (sdcc/tigcc via runner) and the F-Droid wrapper remain.
TI-calc/F-Droid builds and the device-lab items remain open.

### S9 · Vault, stego & smartcard filesystems: shufflecake, haiku vault, boot-chain — *partial*
Catalog the OCR haiku into the haiku vault and verify the enso generators + haiku randomizers
against the standard vault format (the workbench lineage is in the [README](../README.md));
Shufflecake + steganography → CyberChef recipes; BasicCard/JavaCard virtualized reader and
smartcard filesystem candidates within the 4MB XPort Pro / 2MB S.S.E. URL budget; the
LUKS/GRUB/LILO boot-chain + AES pass-through dongle concept as a research note; quine → S.S.E.
URL export with password + QR/data-matrix (Avery Label Pro) — and **draft the BagIt and
haiku-vault RFC documents** (BagIt 1.0 / RFC 8493 is already the house preservation format).

*2026-10-23 round:* T9.1's Shufflecake + steganography halves closed by
[`shufflecake-stego-cyberchef-2026-10-23.md`](shufflecake-stego-cyberchef-2026-10-23.md)
— Shufflecake (dm-sflc, CCS 2023) documented with its corruption-trap and
multi-snapshot caveats, **not ported** (a kernel block layer has no honest
browser expression); repo CyberChef stego ops audited (`stegoLSB` demo-grade,
real-image pixel-ingesting LSB named as the follow-on build). BasicCard/
JavaCard + algorithms-book parts of T9.1 remain open.

*2026-10-23 round (T9.2):* haiku generator + catalog shipped — `js/haiku-vault.js` +
`haiku-vault.html` (seeded 5-7-5 generator, OCR-triple cataloger, collection payloads
sealed as haiku-vault-v1 byte-identical to the draft's §2 vector; `tests/haiku-vault-gen.test.mjs` 6/6).

**Round 19 smartcard status (2026-10-23): partial.** The MealPlan Java Card
toolchain now self-prepares from pinned GitHub inputs with SHA-256 checks,
and the live simulator suite passes 18/18 when GitHub is reachable; offline,
its card-backed cases skip explicitly. A physical-card/GlobalPlatform load
remains unproven. See
[`feitian-javacard-toolchain.md`](feitian-javacard-toolchain.md) and
[`github-jdk-runtime-research-2026-10-23.md`](github-jdk-runtime-research-2026-10-23.md).

*2026-10-23 round (T9.4):* quine → S.S.E. URL shipped — `js/quine-sse.js` +
`quine-sse.html` (execution-verified quines, password-sealed `quine-sse-v1.` fragments,
Avery 5160 QR label sheet; `tests/quine-sse.test.mjs` 4/4). **T9.4 complete.**
*2026-10-23 round (T9.1):* virtualized card reader built — `js/cardreader.js` (ISO 7816-4
APDU codec, MF/DF/EF tree, PIN lockout, applet-AID routing; `tests/cardreader.test.mjs` 6/6).
Smartcard-filesystem choice, algorithms book and boot-chain strands remain.
*2026-10-23 round (T9.1, cont.):* filesystem choice + boot-chain closed by
[`smartcard-filesystem-choice-2026-10-23.md`](smartcard-filesystem-choice-2026-10-23.md)
(ISO/IEC 7816-4 MF/DF/EF) and
[`boot-chain-dongle-note-2026-10-23.md`](boot-chain-dongle-note-2026-10-23.md)
(key-release, not data-path). Algorithms-book strand closed by
[`card-algorithms-book-2026-10-23.md`](card-algorithms-book-2026-10-23.md):
`js/card-algorithms.js` binds seven canonical algorithms (CRC-16, Luhn,
binary search, insertion sort, Euclid GCD, FNV-1a, uint16 modExp) as the
ALGO-BOOK applet on the virtual reader; tests 3/3 on published known answers.
T9.1 remaining: physical-card load + personalisation write path.
*2026-10-23 round (T9.1, cont.):* personalisation write path built — CREATE FILE /
DELETE FILE on `js/cardreader.js` (PIN-gated issuer provisioning; duplicate-FID and
MF protections; `tests/cardreader-personalisation.test.mjs` 4/4, card suites 13/13).
T9.1's sole remainder is now physical-card/GlobalPlatform load (hardware).
### S10 · CyberChef & recipe corpus, lecture hall, UCSB course readers — *partial*
Comparative optimization of the whole recipe set (line 7), DTSearch + Granite Island TCSM
sweep, cipher-machine / virtual-intelligence lecture-hall material, course-reader sourcing
rounds ([`recipe-sourcing-round-5-2026-10-14.md`](recipe-sourcing-round-5-2026-10-14.md),
[`ucsb-2001-first-quarter-research.md`](ucsb-2001-first-quarter-research.md)).
*2026-10-23 round (T10.2):* the lecture item shared with T12.1 is discharged —
Cicada 3301 Hall-of-Fame induction (hall 33 → 34; verifier green). DTSearch / Granite
Island / cookbook strands remain.
*2026-10-23 round (T10.2, cont.):* Granite Island strand closed (user confirmed the
referent: Granite Island Group, TSCM = Technical Surveillance Countermeasures) —
[`granite-island-tscm-2026-10-23.md`](granite-island-tscm-2026-10-23.md) +
`resources/tscm/granite-island-inspection-2026-10-23.json` (10 threat levels,
13-phase inspection sequence; defensive distillation only; tests 4/4).
Remaining: Ghidra DTSearch (runner), cookbook recipes tail.
*2026-10-23 round (T10.3):* course-reader sourcing round delivered —
[`ucsb-course-readers-2026-10-23.md`](ucsb-course-readers-2026-10-23.md) (eleven UCSB CS
texts sourced; CS 32's SBPrinter reader located; algorithms cross-check: Weiss/Sahni,
not CLRS). **T10.3 complete.**
*2026-10-23 round (T10.1):* final audit — `--spotlights` enumerator reports 515 ops,
tour-only 0, orphans 0; guard suites green. Every enumerated sub-item is delivered;
**T10.1 complete** (comparative tuning continues as a standing activity).

### S11 · Wallets, mnemonics, classified name generator, spy-book challenges — *partial*
Wallet crypto-card + mnemonic work feeds the existing bip39-haiku workbench; the “classified
random name generator” links to the First Name Almanac `NAMES.EXE` lineage (historical
context only — F2); locate the cold-war spy book’s 18 end-of-book challenges and distill
recipes.
*2026-10-23 round (T11.1):* classified name generator built (`js/codename.js` +
`codename.html`; seeded operation/cryptonym/project-word formats, repeat-free batches,
honest ~11-bit entropy note; `tests/codename.test.mjs` 3/3). Spy-book challenges await
the source book.
*2026-10-23 round (T11.1, cont.):* wallet-card deltas closed —
[`wallet-card-deltas-2026-10-23.md`](wallet-card-deltas-2026-10-23.md):
`js/wallet-card.js` renders/parses strict-BIP-39 wallet cards (public
verification data only; haiku input fails closed); `tests/wallet-card.test.mjs` 4/4.
Only the spy-book challenges remain, blocked on the source book.

### S12 · Web archaeology: Cicada 3301, Warrick recovery, Geomate Jr — *done (T12.1)*
Cicada QR + lat/long hunt → US subsurface viewer and cipher-machine Hall-of-Fame lecture;
apply the Warrick web-archiving method to lost cicada3301 sites
([`dss-casefiles-riddle-warrick.md`](dss-casefiles-riddle-warrick.md),
`research/warrick_geomate_audit`); Geomate Jr firmware + geocaching points
([`geomate-gpx-preservation.md`](geomate-gpx-preservation.md),
[`geomate-jr-firmware-research.md`](geomate-jr-firmware-research.md)).
*2026-10-23 round:* Cicada QR + lat/long half researched in
[`cicada-3301-qr-locations-2026-10-23.md`](cicada-3301-qr-locations-2026-10-23.md)
*2026-10-23 round (T12.1):* Warrick half closed — planner `js/warrick-plan.js`
(4/4 tests; plan-only, `.onion`/credentialed seeds refused, BagIt packaging) and
[`warrick-cicada-recovery-2026-10-23.md`](warrick-cicada-recovery-2026-10-23.md);
fetch leg is a runner job. Hall-of-Fame lecture remains.
*2026-10-23 round (T12.1):* Hall-of-Fame lecture delivered — `cicada-3301-hall-of-fame`
induction record in the Cipher Machines Lecture Hall (33 → 34 records, raised-bar;
`tools/patch_lecture_hall_cicada_hof.py`, `tools/verify_lecture_hall.mjs` all checks passed;
[`cicada-3301-hall-of-fame-lecture-2026-10-23.md`](cicada-3301-hall-of-fame-lecture-2026-10-23.md)).
**T12.1 complete.**
(all 14 coordinates of 2012-01-09 tabulated; the 8 US sites seeded as a
citation-only historical-network pack,
`resources/historical-network/cicada-3301-poster-seed-2026-10-23.json`,
validator-clean). No QR payloads or puzzle content recorded; posters are
gone and every row says so.

*2026-10-23 round (T12.2):* dual-shuffle explorers surveyed (CyTube + successors) and built locally — `dual-shuffle.html`/`js/dual-shuffle.js` with both Fisher–Yates duals, the naive swap convicted by a permutation-distribution probe, and four two-deck merge strategies; `tests/dual-shuffle.test.mjs` 4/4; [`dual-shuffle-explorers-2026-10-23.md`](dual-shuffle-explorers-2026-10-23.md).
### S13 · Intelligence-archive research: bin Laden hard-drive release — *done*
Publicly released CIA/FOIA/archive.org material only; deliverable is a source-checked
research note in house style.
*2026-10-23 round:* closed by
[`abbottabad-release-research-2026-10-23.md`](abbottabad-release-research-2026-10-23.md)
— release timeline (CTC 2012; ODNI Bookshelf 2015/2016/2017; CIA ~470,000
files 2017-11-01, reposted 2017-11-09 minus 3,935 files with executables
defanged), no encryption catalogued in the public material, Ghidra not
applicable. Also closes T1.1 (T13.1 grouped execution).

### S14 · Changelly drainer script analysis — *done*
See [`changelly-drainer-analysis.md`](changelly-drainer-analysis.md).
*2026-10-23 round:* second stage (`node`+`path`, 75,791 B) retrieved inert
from the Sheet via Drive CSV export, de-rotated (256-entry string array,
221 rotations), bagged (BagIt + Xena), Ghidra assessed not-applicable
(JavaScript text, no MZ/ELF/PE, no crypto keywords); dev panel v3.27
lifecycle and an independent campaign variant compared in
[`changelly-dev-panel-v327-2026-10-23.md`](changelly-dev-panel-v327-2026-10-23.md).
Tests: 12/12. T14.1 closed for this sample (KGK.ARJ / fna102b remain under
F2/F4 standing decisions).

## 4 · Execution notes

- The fourteen streams have **no dependencies on each other** except S4←S5/S12 (layer
  contributions) and S1↔S2 (shared Ghidra/Cookbook notes), so they can run concurrently.
- Items needing hosts outside the sandbox’s allowlist (F3) should be batched into one relay
  fetch round before execution to avoid stalling multiple streams.
- The failed transcript in the source file is **not** re-executed: its goal (preserve the
  KGK.ARJ listing) is satisfied by `research/kgk-arj-listing-extract.txt`, and its
  transformation goal is superseded by the F2 standing decision.
