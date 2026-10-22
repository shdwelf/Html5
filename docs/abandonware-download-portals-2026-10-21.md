# Verified download portals — Radmin VPN, game-show sets, spy games (21 Oct 2026)

*The requester supplied a download-guide (with citations); this note processes
it into the corpus records with verification status, per the standing F3 rule:
**links and provenance only — nothing is downloaded here**. “Verified” =
cross-checked against a primary/secondary source on 2026-10-21; “as supplied” =
reported by the requester, not independently confirmed.*

## 1. Radmin.exe / Radmin VPN — obtainment hygiene

| Portal | URL | Status |
| --- | --- | --- |
| **Official Radmin VPN homepage** | <https://www.radmin-vpn.com/> | as supplied — preferred first stop |
| **Official Famatech downloads** | <https://www.radmin.com/download/> | as supplied — legacy deployment payloads |
| Uptodown Radmin VPN mirror | <https://radmin-vpn.en.uptodown.com/windows> | as supplied — secondary mirror |
| Softpedia Network repository | <https://www.softpedia.com/get/Internet/Secure-Browsing-VPN/Radmin-VPN.shtml> | as supplied — secondary mirror |

**Wrapping caution (the requester's cited risk, real and recurring):** fake
download pages and “wrapper” executables ride on utility names (their
citations: Reddit r/CrackSupport malicious-redirect warnings + r/Roms fake-file
malware reports). Rules that hold for any network utility: prefer the vendor
domain; on mirrors, compare hashes against the vendor build when published;
treat any self-extracting “downloader” as a polyglot-until-proven-innocent
(see [`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md)
§2 SFX); run a first-launch triage (`tools/exe_triage.py` / `tools/polyglot_scan.mjs`)
on your own copy before installing. Research context for the product itself:
[`radmin-and-smtp-research-2026-10-21.md`](radmin-and-smtp-research-2026-10-21.md).

**LAN-gaming use case (the requester's closing question, part one):** using
Radmin VPN to LAN classic titles with friends is the product's intended
hobbyist case (virtual LAN over NAT; the `radmin-vpn-linux` driver work in the
research note is exactly the Wine/Linux side of that). Scope rules unchanged:
only your own machines and consenting friends' — the encyclopedia's
remote-admin boundary covers it. For DOS-era IPX games specifically, note the
stack: DOSBox has **IPX-over-UDP** (`ipx=true` + `[ipx]` `ipxnet startserver
<port>` on one side, `ipxnet connect <host> <port>` on the others) — most
GameTek-era multiplayer titles ride that; the Radmin VPN LAN only needs to
carry the UDP.

## 2. Game-show editions — corpus annex (verification status)

| Edition | Claim (requester) | Status |
| --- | --- | --- |
| **Wheel of Fortune (1998, Hasbro Interactive)** | “564 MB full-disc release, original TV elements” | ✅ lineage verified (Hasbro Interactive 1998–2001; dev. **Artech Digital**; PCGamingWiki = retail disc-check DRM; fandom: 1st ed. blue, **2nd ed. red (2000)** with behind-the-scenes Vanna/Charlie/Friedman interviews + sample contestant exam). The 564 MB figure: as supplied. |
| **Wheel of Fortune Deluxe (2005 Windows)** | “road-trip modes, offline single-keyboard multiplayer” | ✅ release verified — Sony Online Entertainment, **Dec 30, 2005** (fandom: later *Super Deluxe* 2008 is a feature-identical update). Features: as supplied. |
| **Wheel of Fortune New Second Edition (1988, Softie/ShareData)** | “compact text-and-board, DOSBox-friendly” | ✅ verified — myabandonware 108 KB (DOSBox “Supported”); IA `msdos_Wheel_of_Fortune_-_New_Second_Edition_1988` (343.9 K) and `msdos_Wheel_of_Fortune_2nd_Edition_1987` (“more than a thousand new phrases”). |
| Jeopardy! PC sets | — | round-8 table stands; myabandonware Jeopardy! (1987, 160 KB) + 2nd Edition (1988) + Super Jeopardy! (1991) + 25th Anniversary (1991) |

Family tree cross-check: Old Games Finder enumerates the whole ShareData/Softie/
GameTek ladder (1st, 2nd, 3rd, Junior, Golden, New 2nd, New 3rd, Deluxe,
“Tommy's Wheel of Misfortune” pirate variant) — useful for spotting mislabeled
uploads. MyAbandonware pages with **browser play** (`wheel-of-fortune-dz/play-dz`)
run in-page DOSBox — good for triage without keeping files.

## 3. Retro espionage / spy-game index (extends [`spycraft-research.md`](spycraft-research.md))

| Title | Lineage | Portals |
| --- | --- | --- |
| **Sid Meier's Covert Action** (MicroProse/MPS Labs, 1990; Sid Meier + Bruce Shelley; “Max Remington” CIA sim) | ⚠️ **re-sold** (Tommo/Retroism digital on GOG since 2015; FreeGameEmpire has pulled its archive as “not abandonware any more”) — treat like the LucasArts situation: archival copies exist, but the title is commercially active | myabandonware `sid-meier-s-covert-action-v2`; IA `covert-action-microprose` (25.2 MB: floppies + **player aid card + technical supplement scans**), `covertactionmanual` (98.2 MB manual scan) |
| **Floor 13** (Virgin/PSI Software Designers, 1991; “the power behind the democracy”) | DOS + Amiga; DOSBox 0.61 supported | myabandonware `floor-13-1eo` (2 MB + 39 KB manual); IA `Various_DOS_Abandonware_Ark` contains `Floor 13 (1991)(Virgin Interactive).zip` |
| **Spy Fox** series (Humongous; kids' spy parody) | ⚠️ **re-sold** (Humongous catalog on Steam/GOG via Tommo) | IA `SPYFOXCOLLECTION` (852 MB: Dry Cereal, Cheese Chase, Some Assembly Required, Hold the Mustard, Operation Ozone), `spy-fox-operation-milkshake` (French ed., 486 MB) |

Portal-safety consensus (community + press, cited in the requester's research):
MyAbandonware (no arbitrary user uploads, removes on rights-holder request),
**archive.org** (institutional preservation policy — the most legally
defensible), Abandonware DOS / Old Games Finder (aggregators — verify the
target), Abandonia. Keep the round-8 discipline: record identifiers, capture
provenance, hash what you keep.

## 4. DOSBox quick-config (the requester's closing question, part two)

Baseline for the DOS-era sets (works for GameTek game-shows, Floor 13, Covert
Action):

```ini
[dosbox]
machine=svga_s3            ; game-show titles are VGA-era
[cpu]
core=auto
cycles=max                ; fixed cycles if a timer-logic bug appears (see dos-game-disassembly.md)
[mixer]
nosound=false
[ipx]
ipx=true                  ; only for LAN sessions (see §1)
[sblaster]
sb16=auto                 ; Covert Action / Floor 13 sound
```

Known quirks already logged in this repo: the Game Wizard 32 Pro trainer wants
`ems=false`/`ems=board` and cannot save memory states under emulation
(round-5); js-dos pointer-lock needs a focused canvas
(`headline-harry-jsdos-fix-2026-10-04.md`); timer-sensitive titles should use
fixed cycles. A scripted sneakers smoke run remains gated (no DOSBox/Xvfb in
the sandbox) — the config above is lab documentation, not an automation claim.

## 5. Provenance

Requester-supplied guide (citations retained above) + independent verification
passes (web_search 2026-10-21: PCGamingWiki, wheeloffortunehistory.fandom,
myabandonware, archive.org item pages, Wikipedia Covert Action, Infobits
abandonware-safety overview, r/abandonware safety thread). No binaries fetched;
all entries are links + status.
