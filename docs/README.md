# Docs wiki — research index

*In-repo wiki for `shdwelf/Html5`. Generated index of the research corpus in
this folder — the deep-dive notes, backlog execution rounds, and format studies.
Update this file whenever a new research document lands.*

*Conventions:* deep dives carry provenance inline (F3 — external hosts are
link/relay only); reverse-engineering is recipe/notes level (F4); cracking
procedures are out of scope; see `software-protection-encyclopedia.md` for the
standing boundaries.

## MIME quick reference

*Full study: [`mime-types-deep-dive-2026-10-21.md`](mime-types-deep-dive-2026-10-21.md).
Tooling: `tools/mime_lookup.mjs` (sniff + extension + claimed-vs-actual checks).*

| Bytes / extension | Media type | Notes |
| --- | --- | --- |
| `FF D8 FF` / .jpg .jpeg | `image/jpeg` | |
| `89 50 4E 47 0D 0A 1A 0A` / .png | `image/png` | |
| `GIF87a`·`GIF89a` / .gif | `image/gif` | GIFAR target type (polyglot §2) |
| `%PDF-` / .pdf | `application/pdf` | hybrid PDFs exist |
| `PK\x03\x04` / .zip .jar .apk .docx | `application/zip` | also `PK\x05\x06` (empty) |
| `1F 8B 08` / .gz | `application/gzip` | |
| `BZh` / .bz2 | `application/x-bzip2` | 3-byte magic — short |
| `37 7A BC AF 27 1C` / .7z | `application/x-7z-compressed` | |
| `Rar!\x1A\x07` / .rar | `application/vnd.rar` | |
| `60 EA` / .arj | `application/x-arj` | 2-byte magic |
| `MZ` / .exe .dll | `application/x-msdownload` | PE lives *inside* |
| `7F ELF` / .elf .so | `application/x-executable` | |
| `CA FE BA BE` / .class | `application/java-vm` | GIFAR payload |
| .lzh .ace | `application/x-lzh-compressed` · `application/x-ace-compressed` | extension-mapped |
| .wasm | `application/wasm` | RFC-consistent; `text/javascript` is canonical for .js (RFC 9239) |
| .txt .csv .json .html .css .xml .md | `text/plain` · `text/csv` · `application/json` · `text/html` · `text/css` · `application/xml` · `text/markdown` | |
| .mp3 .wav .ogg .mp4 | `audio/mpeg` · `audio/wav` · `audio/ogg` · `video/mp4` | |

**Serving rule of thumb:** derive the type from your own sniff + allow-list,
never replay a client's `Content-Type`; always send
`X-Content-Type-Options: nosniff`; uploads as `application/octet-stream` +
`Content-Disposition: attachment` unless display is intended. Registry:
IANA media types (RFC 6838 / BCP 13).

## Backlog execution (21 Oct 2026)

- [agent-backlog-2026-10-21.md](agent-backlog-2026-10-21.md) — agent backlog 2026 10 21
- [backlog-execution-round-1-2026-10-21.md](backlog-execution-round-1-2026-10-21.md) — backlog execution round 1 2026 10 21
- [backlog-execution-round-10-2026-10-21.md](backlog-execution-round-10-2026-10-21.md) — backlog execution round 10 2026 10 21
- [backlog-execution-round-11-2026-10-21.md](backlog-execution-round-11-2026-10-21.md) — backlog execution round 11 2026 10 21
- [backlog-execution-round-12-2026-10-21.md](backlog-execution-round-12-2026-10-21.md) — backlog execution round 12 2026 10 21
- [backlog-execution-round-13-2026-10-22.md](backlog-execution-round-13-2026-10-22.md) — backlog execution round 13 2026 10 22
- [backlog-execution-round-14-2026-10-22.md](backlog-execution-round-14-2026-10-22.md) — backlog execution round 14 2026 10 22
- [backlog-execution-round-15-2026-10-22.md](backlog-execution-round-15-2026-10-22.md) — backlog execution round 15 2026 10 22
- [backlog-execution-round-16-2026-10-22.md](backlog-execution-round-16-2026-10-22.md) — backlog execution round 16 2026 10 22
- [backlog-execution-round-17-2026-10-22.md](backlog-execution-round-17-2026-10-22.md) — backlog execution round 17 2026 10 22
- [backlog-execution-round-18-2026-10-22.md](backlog-execution-round-18-2026-10-22.md) — backlog execution round 18 2026 10 22
- [backlog-execution-round-19-2026-10-23.md](backlog-execution-round-19-2026-10-23.md) — backlog execution round 19 2026 10 23
- [backlog-execution-round-2-2026-10-21.md](backlog-execution-round-2-2026-10-21.md) — backlog execution round 2 2026 10 21
- [backlog-execution-round-20-2026-10-23.md](backlog-execution-round-20-2026-10-23.md) — backlog execution round 20 2026 10 23
- [backlog-execution-round-21-2026-10-23.md](backlog-execution-round-21-2026-10-23.md) — backlog execution round 21 2026 10 23
- [backlog-execution-round-22-2026-10-23.md](backlog-execution-round-22-2026-10-23.md) — backlog execution round 22 2026 10 23
- [backlog-execution-round-23-2026-10-23.md](backlog-execution-round-23-2026-10-23.md) — backlog execution round 23 2026 10 23
- [backlog-execution-round-24-2026-10-23.md](backlog-execution-round-24-2026-10-23.md) — backlog execution round 24 2026 10 23
- [backlog-execution-round-25-2026-10-23.md](backlog-execution-round-25-2026-10-23.md) — backlog execution round 25 2026 10 23
- [backlog-execution-round-3-2026-10-21.md](backlog-execution-round-3-2026-10-21.md) — backlog execution round 3 2026 10 21
- [backlog-execution-round-4-2026-10-21.md](backlog-execution-round-4-2026-10-21.md) — backlog execution round 4 2026 10 21
- [backlog-execution-round-5-2026-10-21.md](backlog-execution-round-5-2026-10-21.md) — backlog execution round 5 2026 10 21
- [backlog-execution-round-6-2026-10-21.md](backlog-execution-round-6-2026-10-21.md) — backlog execution round 6 2026 10 21
- [backlog-execution-round-7-2026-10-21.md](backlog-execution-round-7-2026-10-21.md) — backlog execution round 7 2026 10 21
- [backlog-execution-round-8-2026-10-21.md](backlog-execution-round-8-2026-10-21.md) — backlog execution round 8 2026 10 21
- [backlog-execution-round-9-2026-10-21.md](backlog-execution-round-9-2026-10-21.md) — backlog execution round 9 2026 10 21

## Research deep dives (the “ghirdra” line)

- [abandonware-download-portals-2026-10-21.md](abandonware-download-portals-2026-10-21.md) — abandonware download portals 2026 10 21
- [game-show-ghidra-research-2026-10-21.md](game-show-ghidra-research-2026-10-21.md) — game show ghidra research 2026 10 21
- [gfi-languard-nss-research.md](gfi-languard-nss-research.md) — gfi languard nss research
- [john-ghidra-diablo-research.md](john-ghidra-diablo-research.md) — john ghidra diablo research
- [mime-types-deep-dive-2026-10-21.md](mime-types-deep-dive-2026-10-21.md) — mime types deep dive 2026 10 21
- [omniglot-recipes-deep-dive-2026-10-21.md](omniglot-recipes-deep-dive-2026-10-21.md) — omniglot recipes deep dive 2026 10 21
- [polyglot-files-deep-dive-2026-10-21.md](polyglot-files-deep-dive-2026-10-21.md) — polyglot files deep dive 2026 10 21
- [radmin-and-smtp-research-2026-10-21.md](radmin-and-smtp-research-2026-10-21.md) — radmin and smtp research 2026 10 21
- [snopes-game-show-forensics-2026-10-21.md](snopes-game-show-forensics-2026-10-21.md) — snopes game show forensics 2026 10 21

## Software protection & disassembly

- [arj-garble-format-notes.md](arj-garble-format-notes.md) — arj garble format notes
- [arj-lha-ace-password-notes-2026-10-21.md](arj-lha-ace-password-notes-2026-10-21.md) — arj lha ace password notes 2026 10 21
- [dos-game-disassembly.md](dos-game-disassembly.md) — dos game disassembly
- [dr-solomon-virus-encyclopaedia-ghidra.md](dr-solomon-virus-encyclopaedia-ghidra.md) — dr solomon virus encyclopaedia ghidra
- [exe-protection-deep-dive.md](exe-protection-deep-dive.md) — exe protection deep dive
- [ghidra-cyberchef-recipes.md](ghidra-cyberchef-recipes.md) — ghidra cyberchef recipes
- [ghidra-dos-disasm-plan.md](ghidra-dos-disasm-plan.md) — ghidra dos disasm plan
- [ghidra-headless-benign-sample-methodology.md](ghidra-headless-benign-sample-methodology.md) — ghidra headless benign sample methodology
- [jcreator-jdk-ghidra.md](jcreator-jdk-ghidra.md) — jcreator jdk ghidra
- [sneakers-original-ghidra-wasm-2026-10-18.md](sneakers-original-ghidra-wasm-2026-10-18.md) — sneakers original ghidra wasm 2026 10 18
- [software-protection-encyclopedia.md](software-protection-encyclopedia.md) — software protection encyclopedia
- [spycraft-ghidra-analysis.md](spycraft-ghidra-analysis.md) — spycraft ghidra analysis
- [spycraft-research.md](spycraft-research.md) — spycraft research
- [zip-garble-format-notes.md](zip-garble-format-notes.md) — zip garble format notes
- [zlibrary-apk-ghidra-research-2026-10-13.md](zlibrary-apk-ghidra-research-2026-10-13.md) — zlibrary apk ghidra research 2026 10 13

## Archives, carving & formats

- [acme-httpd-ecj.md](acme-httpd-ecj.md) — acme httpd ecj
- [arcanechat-xdc-games-research-2026-10-02.md](arcanechat-xdc-games-research-2026-10-02.md) — arcanechat xdc games research 2026 10 02
- [bbs-abandonware-coldfire-port.md](bbs-abandonware-coldfire-port.md) — bbs abandonware coldfire port
- [bbs-viewer-and-netcat-capture.md](bbs-viewer-and-netcat-capture.md) — bbs viewer and netcat capture
- [dss-casefiles-riddle-warrick.md](dss-casefiles-riddle-warrick.md) — dss casefiles riddle warrick
- [fna102b-xena-preservation.md](fna102b-xena-preservation.md) — fna102b xena preservation
- [java-bbs-coldfire-survey.md](java-bbs-coldfire-survey.md) — java bbs coldfire survey
- [sanborn-kryptos-webxdc.md](sanborn-kryptos-webxdc.md) — sanborn kryptos webxdc
- [xport-bbs-deployment.md](xport-bbs-deployment.md) — xport bbs deployment

## Crypto, protocols & networking

- [aes-nacl-recipe-checks-2026-10-21.md](aes-nacl-recipe-checks-2026-10-21.md) — aes nacl recipe checks 2026 10 21
- [bip-standards.md](bip-standards.md) — bip standards

## Silicon, RTL & hardware intel

- [cheyenne.md](cheyenne.md) — cheyenne
- [ingress-intel-connector-research-2026-10-07.md](ingress-intel-connector-research-2026-10-07.md) — ingress intel connector research 2026 10 07
- [ingress-intel-map-viewer.md](ingress-intel-map-viewer.md) — ingress intel map viewer
- [socal-radio-propagation.md](socal-radio-propagation.md) — socal radio propagation
- [socal-subsurface.md](socal-subsurface.md) — socal subsurface
- [socal-usgs-gazetteer.md](socal-usgs-gazetteer.md) — socal usgs gazetteer
- [socal-utilities-orbital.md](socal-utilities-orbital.md) — socal utilities orbital

## Applications & build tooling

- [blink-webgl-wasm.md](blink-webgl-wasm.md) — blink webgl wasm
- [cyberchef-aztec-cuecat.md](cyberchef-aztec-cuecat.md) — cyberchef aztec cuecat
- [cyberchef-cipher-machine-recipe-checks-2026-10-05.md](cyberchef-cipher-machine-recipe-checks-2026-10-05.md) — cyberchef cipher machine recipe checks 2026 10 05
- [cyberchef-classical-cipher-deep-dive.md](cyberchef-classical-cipher-deep-dive.md) — cyberchef classical cipher deep dive
- [cyberchef-gb-rom-2026-10-21.md](cyberchef-gb-rom-2026-10-21.md) — cyberchef gb rom 2026 10 21
- [cyberchef-matrix-deep-dive.md](cyberchef-matrix-deep-dive.md) — cyberchef matrix deep dive
- [cyberchef-modern-cryptography-research-2026-09-29.md](cyberchef-modern-cryptography-research-2026-09-29.md) — cyberchef modern cryptography research 2026 09 29
- [cyberchef-recipe-comparison-2026-10-21.md](cyberchef-recipe-comparison-2026-10-21.md) — cyberchef recipe comparison 2026 10 21
- [cyberchef-sfx-coverage-audit-2026-10-09.md](cyberchef-sfx-coverage-audit-2026-10-09.md) — cyberchef sfx coverage audit 2026 10 09
- [cyberchef-sfx-coverage-audit-2026-10-13.md](cyberchef-sfx-coverage-audit-2026-10-13.md) — cyberchef sfx coverage audit 2026 10 13
- [decompressor-recipe-matrix-2026-10-21.md](decompressor-recipe-matrix-2026-10-21.md) — decompressor recipe matrix 2026 10 21
- [recipe-sourcing-round-4-2026-10-14.md](recipe-sourcing-round-4-2026-10-14.md) — recipe sourcing round 4 2026 10 14
- [recipe-sourcing-round-5-2026-10-14.md](recipe-sourcing-round-5-2026-10-14.md) — recipe sourcing round 5 2026 10 14
- [uhs-gamegenie-recipe-cards-2026-10-21.md](uhs-gamegenie-recipe-cards-2026-10-21.md) — uhs gamegenie recipe cards 2026 10 21

## Notes, essays & archives

- [CYLINDER_RESEARCH.md](CYLINDER_RESEARCH.md) — CYLINDER_RESEARCH
- [CYLINDER_SYNC.md](CYLINDER_SYNC.md) — CYLINDER_SYNC
- [GHIDRA_COOKBOOK.md](GHIDRA_COOKBOOK.md) — GHIDRA_COOKBOOK
- [RESEARCH_SMARTCARD.md](RESEARCH_SMARTCARD.md) — RESEARCH_SMARTCARD
- [UEFI_OPENBIOS_JAVAC.md](UEFI_OPENBIOS_JAVAC.md) — UEFI_OPENBIOS_JAVAC
- [VCHIP.md](VCHIP.md) — VCHIP
- [arxiv-course-reader-research-2026-09-28.md](arxiv-course-reader-research-2026-09-28.md) — arxiv course reader research 2026 09 28
- [berlin-wall-monument-deep-dive-2026-10-05.md](berlin-wall-monument-deep-dive-2026-10-05.md) — berlin wall monument deep dive 2026 10 05
- [casefiles-4dwm.md](casefiles-4dwm.md) — casefiles 4dwm
- [casefiles-error-investigation-2026-10-18.md](casefiles-error-investigation-2026-10-18.md) — casefiles error investigation 2026 10 18
- [catalog-internal-server.md](catalog-internal-server.md) — catalog internal server
- [changelly-drainer-analysis.md](changelly-drainer-analysis.md) — changelly drainer analysis
- [city-subsurface.md](city-subsurface.md) — city subsurface
- [convention-venues.md](convention-venues.md) — convention venues
- [crow-217-letter-claim-check-2026-10-14.md](crow-217-letter-claim-check-2026-10-14.md) — crow 217 letter claim check 2026 10 14
- [crow-cryptogram-solution-research-2026-10-02.md](crow-cryptogram-solution-research-2026-10-02.md) — crow cryptogram solution research 2026 10 02
- [crow-cryptogram-stecker-audit-2026-10-02.md](crow-cryptogram-stecker-audit-2026-10-02.md) — crow cryptogram stecker audit 2026 10 02
- [crow-cyrillic-hypothesis-2026-10-02.md](crow-cyrillic-hypothesis-2026-10-02.md) — crow cyrillic hypothesis 2026 10 02
- [crow-poem-keyspace-search-2026-10-02.md](crow-poem-keyspace-search-2026-10-02.md) — crow poem keyspace search 2026 10 02
- [crow-secom-deep-dive-2026-10-02.md](crow-secom-deep-dive-2026-10-02.md) — crow secom deep dive 2026 10 02
- [crow-source-check-2026-10-02.md](crow-source-check-2026-10-02.md) — crow source check 2026 10 02
- [crow-structured-extraction-search-2026-10-02.md](crow-structured-extraction-search-2026-10-02.md) — crow structured extraction search 2026 10 02
- [crow-ukrainian-source-check-2026-10-02.md](crow-ukrainian-source-check-2026-10-02.md) — crow ukrainian source check 2026 10 02
- [crow-wikipedia-secom-source-check-2026-10-02.md](crow-wikipedia-secom-source-check-2026-10-02.md) — crow wikipedia secom source check 2026 10 02
- [drive-backup-2026-10-08.md](drive-backup-2026-10-08.md) — drive backup 2026 10 08
- [drive-backup-2026-10-17.md](drive-backup-2026-10-17.md) — drive backup 2026 10 17
- [drive-backup-wiki-2026-10-15.md](drive-backup-wiki-2026-10-15.md) — drive backup wiki 2026 10 15
- [drive-repo-sync-2026-10-04.md](drive-repo-sync-2026-10-04.md) — drive repo sync 2026 10 04
- [esgvrop-deep-dive.md](esgvrop-deep-dive.md) — esgvrop deep dive
- [exe-compressors-and-scumm.md](exe-compressors-and-scumm.md) — exe compressors and scumm
- [federal-reclassification-deep-dive-2026-10-05.md](federal-reclassification-deep-dive-2026-10-05.md) — federal reclassification deep dive 2026 10 05
- [feitian-javacard-toolchain.md](feitian-javacard-toolchain.md) — feitian javacard toolchain
- [field-cipher-deep-dive-2026-10-14.md](field-cipher-deep-dive-2026-10-14.md) — field cipher deep dive 2026 10 14
- [flash-decompiler-workflow.md](flash-decompiler-workflow.md) — flash decompiler workflow
- [for-dummies-catalog-list.md](for-dummies-catalog-list.md) — for dummies catalog list
- [for-dummies-source-check.md](for-dummies-source-check.md) — for dummies source check
- [four-corners.md](four-corners.md) — four corners
- [gazetteer-sync-2026-10-04.md](gazetteer-sync-2026-10-04.md) — gazetteer sync 2026 10 04
- [geneva-icj-research-2026-10-06.md](geneva-icj-research-2026-10-06.md) — geneva icj research 2026 10 06
- [geomate-gpx-preservation.md](geomate-gpx-preservation.md) — geomate gpx preservation
- [geomate-jr-firmware-research.md](geomate-jr-firmware-research.md) — geomate jr firmware research
- [geomate-sg7-firmware-analysis.md](geomate-sg7-firmware-analysis.md) — geomate sg7 firmware analysis
- [geomate-viewermade-source-check-2026-10-07.md](geomate-viewermade-source-check-2026-10-07.md) — geomate viewermade source check 2026 10 07
- [github-jdk-runtime-research-2026-10-23.md](github-jdk-runtime-research-2026-10-23.md) — github jdk runtime research 2026 10 23
- [goldkey-parity-gina-and-units.md](goldkey-parity-gina-and-units.md) — goldkey parity gina and units
- [greeran-book-ideas-backlog.md](greeran-book-ideas-backlog.md) — greeran book ideas backlog
- [greeran-commencement-research-2026-10-16.md](greeran-commencement-research-2026-10-16.md) — greeran commencement research 2026 10 16
- [greeran-family-4dwm.md](greeran-family-4dwm.md) — greeran family 4dwm
- [greeran-family-tree-ebook-and-data-status.md](greeran-family-tree-ebook-and-data-status.md) — greeran family tree ebook and data status
- [greeran-name-resources.md](greeran-name-resources.md) — greeran name resources
- [gta-text-decoder-2026-10-21.md](gta-text-decoder-2026-10-21.md) — gta text decoder 2026 10 21
- [haiku-vault-format-draft.md](haiku-vault-format-draft.md) — haiku vault format draft
- [headline-harry-jsdos-fix-2026-10-04.md](headline-harry-jsdos-fix-2026-10-04.md) — headline harry jsdos fix 2026 10 04
- [historical-network-fidonet-adapter-2026-10-22.md](historical-network-fidonet-adapter-2026-10-22.md) — historical network fidonet adapter 2026 10 22
- [historical-network-keyhole-fixture-2026-10-22.md](historical-network-keyhole-fixture-2026-10-22.md) — historical network keyhole fixture 2026 10 22
- [historical-network-viewer-scope-2026-10-22.md](historical-network-viewer-scope-2026-10-22.md) — historical network viewer scope 2026 10 22
- [hp-aio-xport-modem-adapter-feasibility.md](hp-aio-xport-modem-adapter-feasibility.md) — hp aio xport modem adapter feasibility
- [iacr-research-watch-2026-09-28.md](iacr-research-watch-2026-09-28.md) — iacr research watch 2026 09 28
- [jcreator-jdk-coupling.md](jcreator-jdk-coupling.md) — jcreator jdk coupling
- [jsdos-cdn-deep-dive-2026-10-04.md](jsdos-cdn-deep-dive-2026-10-04.md) — jsdos cdn deep dive 2026 10 04
- [keyhole-disambiguation-deep-dive-2026-10-22.md](keyhole-disambiguation-deep-dive-2026-10-22.md) — keyhole disambiguation deep dive 2026 10 22
- [kromecorp-rodger-ramrod-casefile.md](kromecorp-rodger-ramrod-casefile.md) — kromecorp rodger ramrod casefile
- [lantronix-uclinux-deep-dive-2026-10-08.md](lantronix-uclinux-deep-dive-2026-10-08.md) — lantronix uclinux deep dive 2026 10 08
- [lawrence-kansas-subsurface.md](lawrence-kansas-subsurface.md) — lawrence kansas subsurface
- [lecture-hall-research-2026-09-14.md](lecture-hall-research-2026-09-14.md) — lecture hall research 2026 09 14
- [lecture-hall-research-2026-09-20.md](lecture-hall-research-2026-09-20.md) — lecture hall research 2026 09 20
- [lecture-hall-research-2026-09-27.md](lecture-hall-research-2026-09-27.md) — lecture hall research 2026 09 27
- [lecture-hall-research-2026-09-29.md](lecture-hall-research-2026-09-29.md) — lecture hall research 2026 09 29
- [lecture-hall-research-2026-10-02-sylichenko.md](lecture-hall-research-2026-10-02-sylichenko.md) — lecture hall research 2026 10 02 sylichenko
- [lecture-hall-research-2026-10-02.md](lecture-hall-research-2026-10-02.md) — lecture hall research 2026 10 02
- [lecture-hall-research-2026-10-03-crow-gemini-battery.md](lecture-hall-research-2026-10-03-crow-gemini-battery.md) — lecture hall research 2026 10 03 crow gemini battery
- [los-alamos-bulletin.md](los-alamos-bulletin.md) — los alamos bulletin
- [los-alamos-domain-deep-dive-2026-09-30.md](los-alamos-domain-deep-dive-2026-09-30.md) — los alamos domain deep dive 2026 09 30
- [los-alamos-frankel.md](los-alamos-frankel.md) — los alamos frankel
- [los-alamos-metropolis.md](los-alamos-metropolis.md) — los alamos metropolis
- [los-alamos-source-check-2026-09-30.md](los-alamos-source-check-2026-09-30.md) — los alamos source check 2026 09 30
- [lost-treasure-source-check-2026-10-04.md](lost-treasure-source-check-2026-10-04.md) — lost treasure source check 2026 10 04
- [norton-ghost-deep-dive.md](norton-ghost-deep-dive.md) — norton ghost deep dive
- [pdfdrive-deep-dive-2026-10-13.md](pdfdrive-deep-dive-2026-10-13.md) — pdfdrive deep dive 2026 10 13
- [phreaking-boxes-vlsi-notes.md](phreaking-boxes-vlsi-notes.md) — phreaking boxes vlsi notes
- [planet-viewer-deep-dive.md](planet-viewer-deep-dive.md) — planet viewer deep dive
- [project-y-catalog.md](project-y-catalog.md) — project y catalog
- [project-y-sites.md](project-y-sites.md) — project y sites
- [project-y-verification.md](project-y-verification.md) — project y verification
- [reclassification-budget-draft-bill-2026-10-05.md](reclassification-budget-draft-bill-2026-10-05.md) — reclassification budget draft bill 2026 10 05
- [reclassification-legislation-catalog-2026-10-05.md](reclassification-legislation-catalog-2026-10-05.md) — reclassification legislation catalog 2026 10 05
- [reclassification-source-check-2026-10-05.md](reclassification-source-check-2026-10-05.md) — reclassification source check 2026 10 05
- [reclassification-symbolic-logic-2026-10-05.md](reclassification-symbolic-logic-2026-10-05.md) — reclassification symbolic logic 2026 10 05
- [red-october-4dwm-research-2026-10-09.md](red-october-4dwm-research-2026-10-09.md) — red october 4dwm research 2026 10 09
- [red-october-cutaway-deep-dive.md](red-october-cutaway-deep-dive.md) — red october cutaway deep dive
- [sanborn-suite-deep-dive.md](sanborn-suite-deep-dive.md) — sanborn suite deep dive
- [satellite-constellations.md](satellite-constellations.md) — satellite constellations
- [satellite-launch-windows-research-2026-10-04.md](satellite-launch-windows-research-2026-10-04.md) — satellite launch windows research 2026 10 04
- [sgreeran-resume-chronology.md](sgreeran-resume-chronology.md) — sgreeran resume chronology
- [sierra-shadow-president-sweep-2026-10-21.md](sierra-shadow-president-sweep-2026-10-21.md) — sierra shadow president sweep 2026 10 21
- [simgirls-disassembly-research.md](simgirls-disassembly-research.md) — simgirls disassembly research
- [size-coding-256b-notes.md](size-coding-256b-notes.md) — size coding 256b notes
- [source-check-2026-09-28.md](source-check-2026-09-28.md) — source check 2026 09 28
- [source-check-2026-09-29-vincennes.md](source-check-2026-09-29-vincennes.md) — source check 2026 09 29 vincennes
- [source-check-2026-09-29.md](source-check-2026-09-29.md) — source check 2026 09 29
- [source-check-bibliography.md](source-check-bibliography.md) — source check bibliography
- [source-check-four-corners-2026-10-04.md](source-check-four-corners-2026-10-04.md) — source check four corners 2026 10 04
- [spectre-press-source-check.md](spectre-press-source-check.md) — spectre press source check
- [synchronet-build-and-uclinux-notes.md](synchronet-build-and-uclinux-notes.md) — synchronet build and uclinux notes
- [terrain-vector-overlay-deep-dive.md](terrain-vector-overlay-deep-dive.md) — terrain vector overlay deep dive
- [territorial-classification-deep-dive-2026-10-06.md](territorial-classification-deep-dive-2026-10-06.md) — territorial classification deep dive 2026 10 06
- [ucsb-2001-first-quarter-research.md](ucsb-2001-first-quarter-research.md) — ucsb 2001 first quarter research
- [vincennes-4dwm-deep-dive.md](vincennes-4dwm-deep-dive.md) — vincennes 4dwm deep dive
- [virtual-intelligence-lecture-hall-update-2026-10-05.md](virtual-intelligence-lecture-hall-update-2026-10-05.md) — virtual intelligence lecture hall update 2026 10 05
- [virus-encyclopedia-xena-preservation.md](virus-encyclopedia-xena-preservation.md) — virus encyclopedia xena preservation
- [virus-encyclopedia.md](virus-encyclopedia.md) — virus encyclopedia
- [wiki-javacard-validation-2026-10-15.md](wiki-javacard-validation-2026-10-15.md) — wiki javacard validation 2026 10 15
- [wiki-samples-vault-drive-map-2026-10-16.md](wiki-samples-vault-drive-map-2026-10-16.md) — wiki samples vault drive map 2026 10 16
- [wiki-workspace-research-2026-10-15.md](wiki-workspace-research-2026-10-15.md) — wiki workspace research 2026 10 15
- [wikiinajar-image-support.md](wikiinajar-image-support.md) — wikiinajar image support
- [wimax-pi-powerline-variants-2026-10-08.md](wimax-pi-powerline-variants-2026-10-08.md) — wimax pi powerline variants 2026 10 08
- [wireless-charging-pad-2026-10-08.md](wireless-charging-pad-2026-10-08.md) — wireless charging pad 2026 10 08
- [xport-nucleo-v92-eio-fax-card.md](xport-nucleo-v92-eio-fax-card.md) — xport nucleo v92 eio fax card
- [xport-pro-synchronet-fit.md](xport-pro-synchronet-fit.md) — xport pro synchronet fit
- [yubnub-crypto-transport-audit-2026-10-13.md](yubnub-crypto-transport-audit-2026-10-13.md) — yubnub crypto transport audit 2026 10 13
- [yubnub-description-matches-2026-10-13.md](yubnub-description-matches-2026-10-13.md) — yubnub description matches 2026 10 13
- [yubnub-github-archive-research-2026-10-13.md](yubnub-github-archive-research-2026-10-13.md) — yubnub github archive research 2026 10 13
- [yubnub-opensource-backing-2026-10-13.md](yubnub-opensource-backing-2026-10-13.md) — yubnub opensource backing 2026 10 13
- [z3950-server-deep-dive-2026-09-28.md](z3950-server-deep-dive-2026-09-28.md) — z3950 server deep dive 2026 09 28
- [zshaolin-javascript-port.md](zshaolin-javascript-port.md) — zshaolin javascript port

