# Backlog execution round 1 — 21 Oct 2026

*First parallel execution round against [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).*
*Streams advanced this round: **S1, S2, S3, S9, S12**. All findings below came from live*
*GitHub/npm/PyPI/web sweeps run concurrently with the local S2 verification.*

## S2 · Sneakers press kit — T2.3 closed

Verified the built player shell (`sneakers-press-kit.xdc`) against the
headline-harry pattern the task names (“keyboard **and mouse** on the side”):

- **Already at parity:** the webxdc-iframe canvas-focus fix is present in
  `webxdc-sneakers/app/index.html` (`focusDos()` with `tabindex`, wired to
  `pointerdown`/`keydown` and to js-dos ready events) — the “no keyboard / no mouse
  inside the iframe” failure mode from the Harry fix is covered.
- **Gap found and fixed:** the controls hint only described Keyboard and Touch. Added
  a Mouse line — *click the display once to hand the pointer to DOSBox; clicks and keys
  reach the game only while the display has focus* — then rebuilt
  `sneakers-press-kit.xdc` through `scripts/build-sneakers-press-kit-xdc.mjs`
  (deterministic build; `--check` reports *current*; new SHA-256
  `23433886da5553650a6cb2bff25dc2c7e9bedecd034ed6e9df6c7dc0b213012d`).
  `tests/sneakers-press-kit.test.mjs` and `tests/sneakers-press-kit-exact.test.mjs`
  both pass (3+3, exit 0). The byte-preserved `sneakers-press-kit-exact.xdc` is
  untouched.

### DOSBox/Xvfb automation sourcing (T2.3 line 165: “search github for dosbox xvfb”)

| Source | What it gives us |
| --- | --- |
| [dosbox-automation/dosbox-automation](https://github.com/dosbox-automation/dosbox-automation) | DOSBox fork with an HTTP REST API + sandboxed Lua scripting: install, type, swap disks, **grab screenshots**, shutdown — CI-ready headless control |
| [wburns02/tlrb2](https://github.com/wburns02/tlrb2) | Practical gotchas from a live DOS RE project: `dosbox-staging` under Xvfb needs `output=surface` or screenshots come out black; run two rigs on distinct `:9x` displays and kill by pid |
| [cgoldberg/xvfbwrapper](https://github.com/cgoldberg/xvfbwrapper) · [kesla/node-headless](https://github.com/kesla/node-headless) · [leonid-shevtsov/headless](https://github.com/leonid-shevtsov/headless) | Thin Xvfb lifecycle wrappers (Python / Node / Ruby) with screenshot capture |
| [jay23606/shotbox](https://github.com/jay23606/shotbox) | Sealed X11/Wayland session driving GUIs via accessibility tree + input injection + screenshots |

## S1 · Decompressor recipe sources — T1.2 sourced

Open-source implementations to mine for the GHIDRA_COOKBOOK / CyberChef recipe matrix
(ace rar arj uue zip 7z iso img pkware …). Directly relevant detail from the backlog’s
own scan notes: the Sneakers SFX is **LHA `-lh5-`** (“LHA’s SFX 2.12S”) and
KGK.ARJ is **ARJ rev 4, method 1, GARBLED** — so the LHA and ARJ rows are live needs.

| Format | Implementations |
| --- | --- |
| LHA/LZH (-lh5- … -lh7-, LArc, PMarc) | [fragglet/lhasa](https://github.com/fragglet/lhasa) (ISC; per-method decoders incl. `lh7_decoder.c`) · [jca02266/lha](https://github.com/jca02266/lha) (original LHa for UNIX) · FreeDOS `archiver/lha` |
| ARJ (incl. garble flag) | [mkrueger/unarj-rs](https://github.com/mkrueger/unarj-rs) · `unarj` 2.65 (pkgsrc) · open-source `arj` clone (3.10.22) · in-repo `tools/arjwalk.py` |
| ACE | [wdlkmpx/unace1](https://github.com/topics/decompressor) (unace) · `unace`/PeaZip addon |
| RAR | [DrMcCoy/dmc_unrar](https://github.com/topics/decompressor) (single-file FLOSS unrar) · [selmf/unarr](https://github.com/selmf/unarr) (rar/tar/zip/7z library) · `unrar` 7.x |
| Universal / retro grab-bag | [peazip/PeaZip](https://github.com/peazip/PeaZip) (7Z SFX, ACE, ARJ, LHA, RAR, ISO, split, ZIPX …) · [ip7z/7zip](https://github.com/ip7z/7zip) (unpacks ARJ/LHA/CHM/SWF/XAR/Z + disk images) · `unarc-rs` (7z, ZIP, RAR, CAB, LHA, LZX, ACE, ARJ, ARC/PAK, ZOO, HA, UC2, SQ) · `ancient` (ancient formats) · `libarchive` |
| uuencode/base64 | stdlib `uudecode`/`base64` recipes; the failed session in the backlog is superseded by `research/kgk-arj-listing-extract.txt` |

Note (F2): ARJ/SFX *password* recipe research stays at cookbook level; it is not
applied to the FNA102B shareware name database.

## S3 · Game Genie / Game Wizard / UHS — T3.1 sourced

**Universal Hint System** (`.uhs`, Jason Strautman 1988; formats 88a→96a):

- [Vhati/OpenUHS](https://github.com/Vhati/OpenUHS) — Java reader that **decrypts all
  hints from current UHS files** (88a–96a) · [uhhpctools/openuh](https://github.com/uhhpctools/openuh) ★55 ·
  [Tormen/my-uhs](https://github.com/Tormen/my-uhs) — pure-Python manager that also
  **composes** real 96a files, with the three encodings documented: (1) 88a simple
  transform `c < 80 ? 2c-32 : 2c-127`; (2) nest-keyed `key[i] = (title[i] + "key"[i%3]) ^ (i+40)`;
  (3) text-hunk keyed variant after a `0x1A` separator ·
  Stefan Wolff’s [UHS2HTML primer](https://www.swolff.dk/uhs/) (file structure + CRC trailer).
  All three map cleanly onto cipher-machine / CyberChef recipe material.

**Game Genie** (code = encrypted address/value[/compare]):

- Encoders/decoders: [kevinselwyn/gamegenie](https://github.com/kevinselwyn/gamegenie) ·
  [satoshinm/nes-game-genie](https://github.com/satoshinm/nes-game-genie) (npm) ·
  [ascenderx/gamegenie](https://github.com/ascenderx/gamegenie) (NES/SNES/GBA) ·
  [gjbianco/game-genie](https://github.com/gjbianco/game-genie) (NES/SNES/Genesis/GB) ·
  [jdratlif/ggencoder-java](https://github.com/jdratlif/ggencoder-java) ·
  [Fordi/nes-gg](https://github.com/Fordi/nes-gg) · [qalle2/nes-gg-disassembly](https://github.com/qalle2/nes-gg-disassembly) (the ROM itself).
- Cipher core ([NESdev](https://www.nesdev.org/wiki/Game_Genie),
  [gamehacking.org schemes](https://gamehacking.org/library/114)): 15-bit address +
  8-bit value + optional 8-bit compare, nibble-letter table
  `A P Z L G I T Y E O X U K S V N` = `0..F`, bit-interleave layout
  `DDDD ADDD HAAA AAAA AAAA CAAA CCCC DCCC`; SNES uses a value in clear plus a
  fixed 24-bit address transposition (`ijklqrst opabcduv wxefghmn`).

**Game Wizard** (Enhanced Software Design; Ray Hsu / Gerald Ryckman): TSR memory
search/edit + state save for DOS. Sources: [archive.org/details/GameWizard](https://archive.org/details/GameWizard)
(1994 shareware, `GWSHARE.EXE`), `GWIZ23A.ZIP`/`GWSHARE.DOC` reference guide
([Programmer’s Corner](https://www.pcorner.com/list/GAMES/GWIZ23A.ZIP/INFO/)), VOGONS DOSBox
notes (`ems=false` to reach extended memory; state-save needs real DOS), 1997 `gwiz.com`
snapshot on the Wayback Machine.

## S9 · Shufflecake / stego vault backing — T9.1 sourced

- **Shufflecake canonical home is Codeberg, not GitHub**
  ([shufflecake/shufflecake-c](https://codeberg.org/shufflecake/shufflecake-c), v0.6.1,
  GPLv2/3) — they deliberately left GitHub. Components: `dm_sflc` kernel module
  (device-mapper target), `sflc` CLI, `libsflc`. Up to 15 nested hidden volumes,
  filesystem-agnostic, backwards-key-chained headers, indistinguishable from random
  noise; CCS’23 paper [arXiv 2310.04589](https://arxiv.org/abs/2310.04589).
- GitHub satellites worth tracking:
  [sidstuff/sflc-boot](https://github.com/sidstuff/sflc-boot) — Dracut module that boots
  a hidden OS from a Shufflecake partition (this is the T9.1 boot-chain concept already
  implemented) · [albinoloverats/stegfs](https://github.com/albinoloverats/stegfs) — FUSE
  steganographic FS · [hakavlad/tird](https://github.com/hakavlad/tird) + `tirdFS`
  ([PyPI `tird`](https://pypi.org/project/tird/)) — header-less stego containers/time-lock ·
  AUR `shufflecake` (DKMS packaging reference).
- Vault placement candidates within the XPort Pro 4MB / S.S.E. 2MB budget: ext4 (or
  FAT for smartcard-class targets) on an `sflc` layer; `stegfs` or `tirdFS` for the
  header-less variant the S.S.E. URL export wants. The Kudelski post distinguishes the
  terminology the backlog blurs: Shufflecake is *plausible deniability*, not
  steganography — recipes for both belong in the CyberChef/cipher-machine corpus.

## S12 · Warrick web archaeology — T12.1 sourced

[Warrick](https://github.com/oduwsdl/warrick) (ODU Web Science lab; Perl) is the tool
the task asks for. It “crawls the crawlers”: given a seed URL it walks Memento
TimeMaps across Internet Archive + search-engine caches, saves the best memento per
resource, recurses over HTML links beneath the seed. Key usage facts for the cicada3301
recovery attempt:

- Flags: `-dr DATE` (closest to date), `-D dir`, `-k` (convert links relative),
  `-ic` (case-insensitive URLs — important for Windows-hosted cicada sites),
  `-nc` (no-clobber for incremental reruns), `-n N` / `-l depth` caps, `-o logfile`.
- The wiki’s operational advice is explicit: **run early and rerun over days/weeks**
  because caches fluctuate — i.e. a Cicada recovery should be a scheduled retry loop,
  not a one-shot.
- Hard limits: never-crawled pages, robots.txt-excluded, password/JS/Flash deep-web
  content and server-side code are unrecoverable — only the crawler’s external view.
- Literature: [arXiv cs.IR/0512069](https://arxiv.org/abs/cs.IR/0512069),
  [CACM 2008 “Why Web Sites Are Lost”](https://cacm.acm.org/research/why-web-sites-are-lost-and-how-theyre-sometimes-found/)
  (≈61% of resources recovered on average in immediate-reconstruction studies).

## Round status

| Stream | This round | Next (round 2) |
| --- | --- | --- |
| S1 | Sources mined for the decompressor matrix | Write the recipe matrix into `GHIDRA_COOKBOOK`/CyberChef; BagIt the Drive Google Doc (needs relay) |
| S2 | **T2.3 closed** (mouse parity + rebuild + tests); DOSBox/Xvfb automation sourced | Run the smoke scripts under Xvfb with `output=surface`; wiki refresh + PR body update |
| S3 | UHS/GG/GW fully sourced with cipher details | Encode the three UHS schemes + GG nibble/transposition as cipher-machine recipes |
| S9 | Shufflecake reality-check (Codeberg), boot-chain satellite found | Haiku-vault-on-filesystem prototype; vault-format RFC drafting |
| S12 | Warrick found + usage plan | First Warrick pass over known cicada3301 URLs (needs relay); Geomate Jr cross-check |
