# CASEFILES II — the riddle, the DSS card wars, D.I.R.T., and Warrick mode

*Built 2026-09-13 (second session) · extends `casefiles.html` · data in
`js/krome-catalog.js` · proof in `tools/verify_casefiles.mjs` (ALL CHECKS PASSED)*

## 1. The Kr0meCorp riddle is real, and still open

`members.tripod.com/~retrotech/hidden.html` (captured 1998-12-06, digest-checked)
says:

> Solve the following riddle and you will come up with four numbers forming an
> IP address. **Hint:** the order of the numbers is also given by the riddle.
>
> *Follow the path of the one who hath her face covered;*
> *clothed in white, holding in her left hand, four keys.*
> *One is the red Servant, contrary to the King;*
> *One is the white Jayre; dying, and recreated;*
> *One is the Camelion; something more sublime*
> *than the King, the last One; but fugitive.*
>
> — Kv QW n df

The dossier renders it verbatim with our reading: the veiled lady in white is
the albedo, the King is gold (79), the red Servant the red man/sulphur,
"dying and recreated" the lunar/silver phase, and the Camelion is *mercurius* —
whom the alchemists literally called the chameleon, "more sublime than the
King... but fugitive", punning on Maier's *Atalanta Fugiens*. The strongest
numeric reading is atomic numbers: **26 (or 97 = 79 reversed) . 47 . 79 . 80**.
Nobody has publicly confirmed the answer; the lab files it OPEN.

The trail: the riddle's pointer `kr0mecorp.home.ml.org` was a Monolith
redirect — Monolith shut down **Dec 15 1998**, and the Wayback's captures of
the redirect are 301s into that funeral page, so the target address is gone.
By April 1999 the Tripod index itself read *"This site is closed. Special
thanks and greetings to: Web Fringe … AEON Laboratories — thanks for your
invaluable help with channel 66 — Attacker."* So the group's closer was
"Attacker"; the coder was "Njord, from Kr0me BBS". Also on the site:
`secret.html` links out to a bare IP — `209.204.223.106` ("Hot Area" link farm)
— the only raw IP the captures give us.

## 2. DSS archaeology — dr7.com and hackhu.com

Both domains the user named turn out to be the **1998–2001 DirecTV smart-card
war** depots, and both are richly captured:

* **dr7.com** — "DR7 DSS Digital Corruption — Digital Satellite Info You Can
  Trust!" Front page (1 Dec 1998) news: WinExplorer 2.2 released by Dexter,
  Rev052 Echostar disassembly by The Crack, "Paul Maxwell King arrested".
  `/dssfiles/` holds dozens of 200-OK captures: `asic.zip`, `atr.zip`,
  `blocker25.zip`, `dssstealthpro30b.zip`, `emulpcb.zip`, `examiner.zip`,
  `openit.zip`, `sc99tamper.zip`, `su2code.zip`, `vcipherjulyfinalfix.zip`,
  `x2000-21a.zip`, `x3m.zip`, … — 20 are curated in the catalog with pinned
  timestamps and one-click recovery. (`/dreckware/` exes all 401'd — paywalled
  even then.)
* **hackhu.com** — "DSS Hacking, Scripts, Cloning, Bins, ZKT, Programmers,
  Unloopers", 475 captures since 1999; its `files.htm` served Script ID,
  Spoofer, Nitro3m, x2000. Later the domain became a court-records archive:
  the McKenzie complaint, judgments vs Clifford Jones, "two brothers pirating
  and fraud" — DirecTV's lawsuits, archived by the scene itself.
* **satellitemurach.com** — zero Wayback captures. Not even a 404 was
  archived; the dossier records the ghost honestly.

## 3. The keylogger: D.I.R.T. — identified, but not in the Wayback

"There was a keylogger dirti company" = **D.I.R.T. — Data Interception by
Remote Transmission, by Codex Data Systems**: the commercial remote-deploy
keylogger sold to law enforcement, exposed in 2002 when **Cryptome published
the program itself** (`moredirt.zip` 1.2 MB "Enabled DIRT Program",
`dirty-war.zip` 2.4 MB installer + guides, the DIRT Reference Guide) plus the
Frank Jones conviction documents.

CDX verdict: **every capture of the two zips (and the guide) is a 404 or 403**
— Cryptome pulled them and the crawlers never got a live byte. The dossier
says so and links Cryptome's still-live index instead. If a copy ever
surfaces, the drop zone feeds it into the same sniff→Ghidra pipeline.

## 4. Warrick, and the browser-native WARRICK MODE

The user pointed at `oduwsdl/warrick` (Frank McCown's website reconstructor,
ODU 2006; Memento redesign by Brunelle). The Perl tool walks timegates across
many archives — it cannot run from this sandbox (egress), but its core loop is
exactly what the lab already does, so the session generalized it:

* `recoverCapture({name, url, ts, digest})` — the Warrick primitive for ANY
  archived URL: pinned CDX digest → `id_` capture → WebCrypto SHA-1 gate →
  unzip/sniff/decompile. (kr0me's `recoverKrome` is now a thin wrapper.)
* **WARRICK MODE** (new DSS ARCHAEOLOGY case panel): type any domain (presets:
  `dr7.com/dssfiles/`, `hackhu.com/`, `members.tripod.com/~retrotech/`,
  `dr7.com/dreckware/`) → the page pulls the CDX listing (500 rows, 200s only,
  files sorted first) → click any row → SHA-1-gated recovery with the digest
  straight from the listing. This is the "faster Warrick" the user wanted —
  it runs in the visitor's tab, where the archives are reachable.

## 5. The other GitHub resources — assessed

* `oduwsdl/warrick` — used conceptually (above), credited in the app + docs.
* `MohammedHabibQureshi/Blockchain-Learning` — a small Solidity study repo
  (Remix/smart-contract exercises). No Kr0meCorp/DSS relevance found; filed as
  not applicable.
* `waves-exchange` (org) — Waves DEX infrastructure (neutrino/oracles/etc.).
  Not related to the 1998 corpus; filed as not applicable.
* `PirateNetwork/PirateOcean` — the Pirate chain (ARRR) Qt wallet in C++ — a
  perfectly good *future* Ghidra target as a native binary, but no tie to
  kr0me corp; filed as not applicable.

## 6. UEFI / OpenBIOS / javac — what was adopted and what can't be

* Adopted: **PE32+ (UEFI .efi) support.** `parsePE` now maps PE32+ images
  (64-bit ImageBase, optional-header differences handled), routes them to
  `x86:LE:64:default` + gcc spec, and the verifier synthesizes a minimal
  .efi-style module (`lea eax,[rcx+rdx]; ret`) and decompiles it through the
  real wasm engine — so OpenBIOS/coreboot/UEFI-loader dumps and DSS card tools
  alike can go through the same tab. OpenBIOS proper (Open Firmware/Forth
  bytecode) is out of scope for an x86 SLEIGH lab, honestly noted.
* Not adopted, with reasons: javac's `JavacParser` parses Java *source*; it
  cannot convert Ghidra's Java jars to JavaScript (that would need a
  Java-bytecode→JS compiler like TeaVM, and Ghidra's full Java stack is far
  beyond a browser tab). The practical "Ghidra port" the user half-remembers
  already exists and is what this lab runs: the decompiler's C++ core compiled
  to WebAssembly with vendored SLEIGH specs, plus in-repo JS disassembly
  (`js/x86dis.js`). Ghidra's own Java-side scripting (Rhino/GraalJS via
  ghidraal, pyghidra) remains the desktop route for anything the wasm engine
  can't carry.

## 7. Verification status of this session

* `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED**, now 31 checks:
  catalog (199 captures), riddle/DR7/HackHu/DIRT/satellitemurach/Warrick
  dossier rows, base32/SHA-1 vectors, demo.exe MZ math, synthetic zip
  round-trip, demo carve + zip-member + **PE32+/UEFI** wasm decompiles.
* `tools/verify_ghidra.mjs` — still **21/21**; `tools/smoke_pipeline.mjs` —
  pipeline clean; `tools/check-dom-ids.mjs` — pass; casefiles id contract —
  no missing ids; `sw.js` precache bumped to v17.
* Honest limits unchanged: the sandbox still cannot reach web.archive.org /
  archive.org directly, so the first live DSS recovery happens in a visitor's
  browser — with the SHA-1 verdict badge as the receipt.

## 8. Wave 3 — the lecture hall, the closed hunt, the archivist's homepage

**Cipher suite lecture hall.** The Intelligence Lecture Hall of
`apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html` carried only a
placeholder for Kr0meCorp — a record that said the riddle was "added later with
provenance." That placeholder is now replaced with the full primary-source
record: the six riddle lines and the `Kv QW n df` footer verbatim from the
hash-verified Dec 6 1998 capture of `hidden.html` (Wayback digest
`MMOS2TQI5722PUSYVTROIMSZEYIJH5G4`), the hermetic reading, the atomic-number
candidates (26·47·79·80, unconfirmed), the Monolith trail
(`kr0mecorp.home.ml.org` died with ml.org's shutdown on Dec 15 1998), the
letters.html fan-mail page, and six source links back to the captures and to
this lab. The record is flagged `confidence:"Primary source recovered"`. The
modified bundle's app script was re-extracted and re-parsed clean.

**The solution hunt is closed.** Every later capture of `hidden.html`
(2004→2012) is a 404 — no solution was ever edited into the page. `letters.html`
holds fan mail (Attacker of Webfringe, L0rd Binary, others) but no solution
letter. Lord Shinva's *Enciclopedia dell'Hacking* Vol. 14 uses
`kr0mecorp.home.ml.org` only as its proxy-tutorial example URL. The open web
preserves nothing. The catalog now files this verdict permanently
(`RIDDLE.hunt`): the case stays **OPEN** — and because the riddle's own pointer
died with Monolith, even a correct answer can no longer be checked against
anything.

**SHADOWELF — the archivist's own homepage.** The user's original site,
`www.geocities.com/SiliconValley/Park/8099` — *"The Shadow Elf's Homepage"* —
is now CASEFILES case #5. All **27 files** the Wayback still serves 200-OK
(12 HTML pages, 9 images, 5 MIDIs, 1 Flash movie, Feb 1999 → Aug 2000) are
cataloged in `SHADOWELF` with each row's CDX SHA-1 pinned at catalog time.
The recovery console verifies every fetch against the pinned digest and
displays mismatches; the GeoCities view captures carry Yahoo's watermark JS,
but the raw `id_` mementos are the original bytes, which is why the gate
matches. Site story: splash page demanding 800×600 and Netscape Navigator 3.0,
visitor-submitted C&C cheats (CC.html), an underground links page naming LoD,
cDc, CCC, l0pht and the Jargon File (sites.htm), five MIDIs, one Flash toy —
recovered with the same gate as the attack tools, which is the lab's thesis
demonstrated on the archivist's own address.

Verification after wave 3: `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED,
37 checks** (adds: hunt verdict, 27 shadowelf pinned rows, suite-file lecture
record present + placeholder gone); `smoke_pipeline.mjs` clean;
`check-dom-ids.mjs` pass; `sw.js` precache bumped to v18.

### The ordering correction (immediately post-wave-3)

The archive's first-pass candidate — `26.47.79.80` — violated the riddle's own
hint: *"the order of the numbers is also given by the riddle."* The verses
enumerate their figures: the veiled lady in white **first**, then "the red
Servant, contrary to the King," then "the white Jayre; dying, and recreated,"
and the Chameleon explicitly **"the last One."** The King is never one of the
four figures — he appears only as the measure ("contrary to the King", "more
sublime than the King") — so 79, or 97 reversed, was never a valid octet.
Order-corrected atomic reading: **47·26·47·80** (Luna, Mars, Luna, mercury) —
with the doubled silver honestly flagging that the colour→metal mapping is
probably not the whole mechanism. Still unconfirmed; the case stays open.
`RIDDLE.reading` and the lecture-hall record now carry this correction.

The Shadow Elf panel also gained a **RECOVER ALL 27** sweep: one click walks
every pinned row through the SHA-1 gate sequentially (500 ms spaced, progress
in the status line, per-file verdict cards in the recovery log, failures
counted and displayed, never hidden).

## 9. Wave 4 — going over the files with Ghidra

**The sweep.** "Go over the files with Ghidra" is now a first-class pass, not
a per-click affair. `ghidraSweep()` in `js/casefiles.js` walks a case's
recoverable captures through the entire pipeline in one button press:
SHA-1 gate (`fetchVerified`, factored out of `recoverCapture`) → unzip →
sniff (`staticPass`, factored out of `loadArtifact`) → linear-sweep +
recursive-descent disassembly → Ghidra-WASM decompile of each executable
member's entry point. Two panels carry it:

* **KR0ME CORP → `GHIDRA SWEEP — 12 CURATED ZIPS`** — winnuke, teardrop,
  land, nestea, newtear, c2myazz, staog (the first Linux virus), synk4,
  pwlview, portscan, winGateScan, kr0menfo — every digest pulled from the
  CDX at recovery time.
* **DSS ARCHAEOLOGY → `GHIDRA SWEEP — 20 DSSFILES ZIPS`** — the card-war
  depot, same gate, same decompiler.

The report table lands in the panel: member · bytes · kind·lang ·
instruction count · decompile verdict (✓ lines/ms or the exact failure) ·
notable strings. Honest by construction: a digest mismatch **excludes** the
capture from the sweep and prints the got/expected digests; member caps
(12/zip) and a decompile budget (48) are displayed when reached, never
silently dropped.

**The dissectors.** The Shadow Elf case forced the honest counterpoint: a
1999 GeoCities homepage contains **no machine code** — there is nothing for
a decompiler to say about HTML, GIF, MIDI or Flash. Pretending otherwise
would be exactly the legend-making the lab exists to avoid. So the non-code
views got real static analysis instead: `js/artifacts.js` parses SWF (FWS/
CWS/ZWS header, bit-packed RECT, tag walk, DoAction ActionScript ops incl.
GetURL extraction, ConstantPool), Standard MIDI Files (per-track names,
tempo, program changes, note-ons, and **lyrics** — karaoke meta events),
GIF (dims, global palette, comment and application extensions), JPEG
(markers, SOF dimensions, COM comments, EXIF/ICC presence) and PNG (IHDR,
text chunks). The Shadow Elf LISTING view shows this structure table under
an explicit "no machine code for the decompiler here" note.

Verification: `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED, 45
checks** (adds: SWF FWS+CWS fixtures with GetURL extraction, MIDI fixture
with name/tempo/program/lyrics, GIF/JPEG/PNG fixtures, dissect router,
casefiles sweep wiring); `smoke_pipeline.mjs` clean; `check-dom-ids.mjs`
pass; `sw.js` precache v20 (+`js/artifacts.js`).

## 10. Wave 5 — the Virus Creation Laboratory, and the trojanlair hunt

**The lead.** "The trojanlair in archive.org might have the virus creation
laboratory — continue researching." Two claims to check: that a *trojanlair*
exists in the archives, and that the *Virus Creation Laboratory* can be
recovered from them. The second checked out completely; the first did not,
and the lab records both verdicts with the same ink.

**The trojanlair hunt: UNCONFIRMED.** Nothing under that name exists in
archive.org library metadata (identifiers, titles, descriptions, uploaders —
zero hits in every spelling tried) or in the Wayback under any host spelling
checked: `trojanlair.com`/`www.trojanlair.com` are parked (302s and
robots.txt only, no content captures), `trojan-lair.com` is robots.txt only,
`thetrojanlair.com` has nothing, and neither do `trojanlair.tripod.com`,
`members.tripod.com/~trojanlair` or `members.aol.com/trojanlair`. The era
link lists were walked too — VX Heavens' links page and constructors index,
textfiles.com/virus, the Malware Museum items — no trojanlair entry anywhere.
The catalog files this as `TROJANLAIR` with the verdict UNCONFIRMED and a
standing offer: paste a URL and it gets CDX-pinned and SHA-1-gated like
every other case.

**The VCL itself needed no trojanlair.** VX Heavens' Constructors shelf
carries it outright, and the Wayback photographed the shelf:

| capture | timestamp | CDX SHA-1 (base32) | note |
|---|---|---|---|
| `vxheavens.com/dl/gen/vcl.zip` | 20141010085240 | `JXGKSSLP5WW5TYZXJUISVXTAR3MB3ONW` | 190,066 B per the shelf page, MD5 `a82ac0a215221e29b659c11fdffc84d3`, "[VCL] (cracked version)" |
| `vxheavens.com/dl/gen/vcl32.zip` | 20141010054124 | `I5FNKABEHIAVFO2XKILBXIQVBKUP3OKK` | later 32-bit build, same shelf |
| `vxheavens.com/dl/gen/nxvcl.zip` | 20141010053701 | `EDCM227TCTTWQO4VIAQVTDEIZ4GAM7NK` | companion build, same shelf |
| `vxheavens.com/vx.php?id=tv03` | 20141010043629 | `J3RQTZMI3G2BUJFSN7253OJCIUWP7SXP` | the Virus Creation Lab shelf page |
| `vxheavens.com/vx.php?id=tidx` | 20101129093503 | `MMDNZWPZ5V4FIM2NXMLJR56RO7UOGCRF` | Constructors index (200 tools) |
| `vxheavens.com/vl.php?dir=Virus.DOS.VCL` | 20141010092440 | `6NN345DT3OZDJ4VNT3XEQNXKBXBC3CSD` | 216 VCL-made samples, MD5+SHA-1 each |
| `textfiles.com/virus/DOCUMENTATION/vcl.txt` | 20030128200211 | `6ZMNQBZ3MVG5LYBMEYTI2DBVLJWQEKHS` | VCL.DOC verbatim, digest-stable 2003–2012 |

(The 6-byte gap between the shelf page's 190,066 B and the capture's 190,060
transfer length is record framing, not a short read — the SHA-1 gate is the
authority, and it will say so in the browser either way.)

**What the documents say.** VCL 1.00, July 5 1992, by Nowhere Man of the
American group [NuKE]: a Borland-style DOS IDE (CUA menus, mouse,
context-sensitive help) that emits commented assembler for appending,
overwriting and companion viruses plus trojans and logic bombs, with
selectable triggers and payloads, then shells out to TASM/LINK/EXE2BIN.
Requirements: a 286, 512K, DOS 3.0+. Written in Borland C++ 3.0 small model
with the CXL library; self-checking — it wipes itself if its data files are
altered — and install-tied to one machine, which is why the shelf copy being
the *cracked* build matters. Contact address: The Hell Pit BBS,
708-459-7267. The shelf page is candid about the flop: F-PROT recognized
most VCL viruses before VCL was even analyzed, and much of its output won't
assemble; in April 1994 Firecracker (then NuKE) released a VCL Mutator to
make VCL viruses unscannable again (reported, no capture pinned yet).

**Why it's case #6.** The main lab's timeline runs MtE (1991) → PS-MPC/G2
kits (1993); VCL is the missing 1992 link — the first constructor with a
commercial-grade face. And VCL.EXE is a genuine decompile target: 16-bit
Borland C++ with an anti-tamper wipe, straight into the wave-4 sweep. The
112 GB `vxheavens-2010-05-18` library snapshot exists but carries a 2025
corruption report and can't cross a browser tab — so the case recovers the
seven file captures above, each through the gate.

**Wiring.** `VXHEAVENS` + `TROJANLAIR` exports in `js/krome-catalog.js`;
`VIRUS CREATION LAB` case in `js/casefiles.js` with per-file recovery and
`GHIDRA SWEEP — 3 VCL ZIPS` over the constructor builds; dossier sections
for the shelf history, the VCL.DOC manifest (compare after recovery), the
lab rationale, the snapshot caveat, and the trojanlair verdict.

Verification: `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED, 50
checks** (adds: 7 pinned rows with unique names/timestamps/digests, vcl.zip
capture+MD5 pin, vcl.txt pin, manifest+shelf+caveat, trojanlair UNCONFIRMED
verdict, VCL panel/dossier/sweep wiring); `smoke_pipeline.mjs` clean;
`check-dom-ids.mjs` pass; `sw.js` precache v21.

## 11. Wave 6 — Trojan's Lair, and the case button that never shipped

**The address was half-remembered.** The user said `trojanslair.org` — zero
Wayback rows, unresolvable. But `trojanslair.com` (with the S the earlier
hunt was missing) *is* captured: a 377-byte doorway, Nov 2000, digest
`OOR6MPJYCJ4B45SVKKZBT3TQRYJQJWE6`, whose rendered form bounces visitors on
to the real depot — **TL Security at tlsecurity.net**, splash title
*"Hacking, Hackers, Subseven, Icq, trojans, download."* The deep dive mapped
it from the CDX: ~60 builds in /backdoors (SubSeven 2.1–2.2, BioNet
2.8–3.12, Theef, Y3K, Nettrash, Infector, keyloggers), /trojansarchive
(NetSphere, the RAT line, ServeU), the 2003 /Incoming/Backdoor upload tray
(GT Bot, Voodoo Doll), /0-day and /archive/exploits with sources, /windows
tooling, /advisories, and a `download.cgi` zip gateway. Post-2007 captures
are domain parking; the 2009+ asterisk URLs are late-era noise. Twenty rows
pinned (12 Win32 trojan builds — SubSeven 2.2 and the *unpacked* BioNet 3.12
first among them — 3 exploit sources, 5 paper-trail pages), each through the
same SHA-1 gate, with `GHIDRA SWEEP — 12 TROJAN BUILDS` routing the PE32s to
`x86:LE:32`.

**The wave-5 post-mortem, honestly told.** This wave found that the VCL
case's functions shipped but its *case button never did*: a parallel-edit
race ate the `CASES.vcl` entry and the `selectCase` branch, and the
verifier's wiring grep only checked function names and element ids — so 50
checks passed while the case was unreachable from the UI. Fixed here, and
the verifier now greps the `vcl: {` / `trojanslair: {` case entries and the
`if (id === …)` branches too. Lesson recorded with the fix, not instead of
it: never parallel-edit the same file, and grep what the user clicks.

**Still open: the HU firmware.** No head-unit (or Hughes, or HU-card) blob
lives in this repo or on the Lair's shelves, and none was attached — so the
second half of the order waits on a pointer. Drop the file in the lab's
drop zone or paste a URL, and it goes through the same pipeline; if it
turns out to be ARM/MIPS/PIC rather than x86, the lab will say exactly
where its coverage ends instead of guessing.

Verification: `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED, 56
checks** (adds: 20 trojan rows, SubSeven + unpacked-BioNet + doorway pins,
shelf map, trojan wiring with case-entry/branch coverage); VCL wiring check
strengthened the same way; `smoke_pipeline.mjs` clean;
`check-dom-ids.mjs` pass; `sw.js` precache v22.

## §12 — Wave 7: the HU unlooper firmware hunt (Trojan's Lair deep dive, Ghidra verdict, MAKInterface)

The order was threefold — dive deeper on trojanslair.org, run Ghidra on the
HU unlooper firmware, keep researching digital-laboratory / the software /
MAKInterface disassembly — and the wave answers all three, including the
parts whose honest answer is "not found" or "cannot run here".

**The Lair, deeper.** A `(huff|ul4s|ul4|hackhu|loader|atmel|2313|8515)`
sweep of tlsecurity.net's captures returns nothing DSS at all: only 2007
parking (the Downloader-Removal ad feed), one 2001 `moduloader.c`, and the
2003 SinisterUploader page. Trojan's Lair is a trojan/exploit depot, not a
satellite shelf — the firmware hunt moved on to dr7's full `dssfiles`
depot (enumerated end to end: `su2code.zip`, `Suv2.zip`,
`spoofer(hu).zip`, `hu_test5.zip`, `humenu.zip`, the 101 KB
`HCDT-Disassembly.txt`, the WhiteViperX review), hackhu (whose
`/files/*.zip` captures are *all* 404 — the HUHack binaries were never
archived — though the `huhack.txt` doctrine page survives: Atmel.exe to
flash any in-circuit unlooper with the ex-commercial HU Atmel code, HUPro
to apply `input.hex`), dssmagic (catalog page kept, zips never archived),
angelfire (the full HUFF prose, signed -unatester-, but no .hex/.eep
siblings) and phathacks (hardware photos plus the HU-loader schematic).
The Atmel firmware blobs — HUFF/UL4S .hex, HACKHU 2, input.hex — survive
in no pinnable archive found. The Akacastor #tvpiratehistory thread dates
the free HU unloopers (HUFF + ul4s, March 2002) and the HackHU Atmel-code
post that let anyone program pirate HU cards.

**What the lab holds instead.** GitHub's API (the one egress that works
here) gave up `travisgoodspeed/winexplorer` — 197 files of period
glitching scripts — and thirteen blobs came down through it, every one
SHA-1-gated at fetch time and again against `samples/hu-unlooper/
MANIFEST.sha1`: UL4S_10 and HUFF_DTV_P4 (Lee Gibling's glitch-interval
research), TurboUnloop 1.1 (aol6945, 2288 lines), UL4SComboV2 (whose
`ChipVer()` demands the `55 4C 34 53` magic from a UL4S-flashed Atmel),
the Nagra Atmel flash generator, HU Eclipse 1.7, WildWinExtremeHUV3.0,
Crusaider 4.1, HtoHu — plus WinExplorer 4.6 and 5.0 themselves. Both PEs
went through the capstone+pefile static pass
(`tools/hu_unlooper_static.py`, report in `analysis.json`): packed Delphi
with DCPcrypt (sha1, twofish) and 6008 exports on 5.0, the
IMethods/IMyFileSystem/IParams COM objects that are the `Sc`/`Wx`/`Fs`
script API, vendor trail Dream Company → Altium (Dream VCL), and
entry-point disassembly proving the packer stubs (5.0 keeps its real
image crypted in a 729 KB `.pdata` at entropy 7.99).

**The Ghidra verdict, honestly told.** Real headless Ghidra cannot run in
this sandbox — no JVM anywhere on disk, apt mirrors unreachable, GitHub
release objects blocked — so `analyzeHeadless` is *specified* (project
HUUNLOOP, `x86:LE:32:default` for the WinExplorer pair,
`avr8:LE:2:default` the hour an Atmel .hex surfaces) rather than
executed, and capstone did the decode work instead. Even with Ghidra,
both PEs would need unpacking first (dynamic — outside the lab's
static-only rule), and the AVR side waits on bytes, not tooling: no
.hex/.eep with a verifiable hash has surfaced anywhere.

**MAKInterface, resolved.** The `makinterface` lead is makinterface.net,
a German universal-programmer vendor: smartcard reader/writer
(DSS/Dishnetwork/GSM/phonecards, Phoenix/SmartMouse-compatible), Atmel
AT90S2313/8515 + PIC + EEPROM programming — the exact hardware class
that flashed HU unlooper code — and the MAKStripe USB magstripe
reader/writer (the `s3c/PyMAKInt` reverse-engineering target) with
MAKStripeExplorer for Windows, Linux and Windows Mobile. Five
December-2005 software drops are pinned for disassembly; the fifteen
megabytes of vendor software ride the case sweep with everything else.

**digital-laboratory, resolved.** The GitHub user `Digital-Laboratory`
is an empty December-2021 placeholder (zero repos, no bio) — not a lead.
The name means this lab: the static-analysis bench the verdicts above
were reached on.

Verification: `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED, 66
checks** (adds: 9 scripts + 2 PEs with full md5/sha1/crc32, UL4S +
TurboUnloop + WinExplorer pins, 17 wayback rows, SU2 + WhiteViperX +
HUHack + MAKStripe pins, AT90S2313/UL4S text markers, Digital-Laboratory
resolution, huunloop wiring, and a live re-hash of all 13 in-repo files
against the catalog); `smoke_pipeline.mjs` clean; `check-dom-ids.mjs`
pass; `sw.js` precache v23.

## §13 — Wave 8: MAKInterface read at source — the depot, the port, the emulator, two peripherals

The order was: keep researching digital-laboratory / MAKInterface, do the disassembly the five
December-2005 drops were pinned for, and — since the vendor documents pinouts — say whether the
interface can be virtualised and a smart-card emulator emulated along with it; plus add the
RadioShack :CueCat and the Iomega Clik!. All four landed, one premise was corrected, and the
session note is `resources/src-74-makinterface-port-lab.md`.

**The five pins hold, and the depot is twelve.** Every wave-7 digest was re-queried against the
live CDX index and came back identical — `dms.zip`, `MaksAct.zip`, `makstripe.zip`,
`makstripee.zip`, `Pinout.zip`. The same 11-Dec-2005 crawl also caught eight archives nobody had
pinned: `MAKI_DE.ZIP` and `MAKI_EN.ZIP` (2.6 MB each, the driver/toolkit), `MAKITEST.ZIP`,
`MAKS_DE.ZIP`/`MAKS_EN.ZIP` (the smart-card software), `DMS_EN.ZIP`/`DMS_DE.ZIP`, and `PRSC.ZIP`.
Three facts come out of the index without opening a byte: `MAKI_DE.ZIP` keeps one digest across
nine captures from 2003 to 2006 (recorded WARC length wobbles, SHA-1 does not — capture framing,
not payload), `MAKS_DE.ZIP` shows a four-step version chain frozen since September 2003, and
`PRSC.ZIP` is `SCPROG.ZIP` renamed — identical SHA-1, different name. All 13 archives now ride the
sweep; 22 rows are pinned in `js/krome-catalog.js` as `MAKINT`.

**Which port: serial.** The premise that MAKInterface maps its hardware to the parallel port is
wrong, and the vendor says so directly: *"MAKInterface has to be connected to a free 25pole serial
port"*, with the 5 V (12 V for PIC VPP) *"taken from the RS232 port"*. The parallel port appears
twice and both times for something else — the optional wide PROM/EPROM adapter kit (*"free Parallel
Ports on the PC are required"*, for 27xxx/28xxx/29Fxxx) and **art. 00605**, a standalone
parallel-port Nokia flasher, a separate line item. This matters beyond accuracy: it changes the
virtualisation target from an LPT timing problem to a UART-plus-GPIO register model, which is a
much better answer to the question being asked.

**The pinouts, transcribed not summarised.** `pinout_e.php3` is HTML, so it recovers as text
without waiting on `Pinout.zip`. The 2×5 header (art. 00992) documents the reader and the emulator
as two different wirings — VCC on 8 and GND on 4 in both, Reset on 6 for the reader but 5 for the
emulator, **CLK on 7 for the reader and absent for the emulator** (an emulated card is clocked by
its master), and I/O on the *pair* 1+2 in both. That pairing is the mechanism behind the box's
"compatible with CBUS/DumbMouse/FBUS/Harpune/JDM/LudiPipo/M2BUS/Phoenix/Season7/SmartMouse" claim:
drive one half, receive on the other, tie them, and a two-wire UART becomes ISO 7816's single
half-duplex I/O. The EEPROM and PIC rows fix the rest — 4 = ground, 8 = supply, 9 = VPP, 5/6/7
reassignable.

**Emulation is a product category, so yes — twice over.** The vendor sold the emulator (art. 00519
and 00524 "Smartcard Emulator & Datalogger", 00525 the PCB, 00522 the cable), and `univpcpe.php3`
documents art. 00529 where the populated chip set *is* the card: Whitewafer = 16F84, Goldwafer =
16F84+24C16, TwinPIC = 2×16F84, Triple = +24C16, Quadracard = 2×16F84+2×24C16, Jupiter1 =
90S2323/43+24C16, Funcard = 90S8515+24C65 with the EEPROM under the Atmel for the lowered contacts.
So the interface virtualises as a line model (assert VCC, hold Reset, run the clock, bit-bang
ISO 7816-3) and the card virtualises as a memory model plus a firmware image. `js/makint.js`
implements the first and a small ISO 7816-4 file image for the second, with the arithmetic that
explains the odd crystal: 3.579545 MHz at F=372/D=1 is a 103.924 µs ETU, i.e. **9622.4 baud** —
the 9600 every period smart-card COM driver defaulted to, and the reason the 6.0 MHz option exists.
The module's last export is a scope note: transport and memory cards, not payment instruments, not
SIM authentication secrets, not conditional-access modules.

**The disassembly, done on what is reachable.** `web.archive.org` is still not routable from the
build host — verified this session, alongside github.com/api.github.com/pypi/files.pythonhosted.org
returning 200 — so the twelve archives stay hash-pinned for the browser-side path and were *not*
opened here. What could be opened was disassembled for real: PyMAKInt was cloned and put through
`tools/makint_static.py`, giving CPython 3.4 bytecode census (pymakint 20 code objects / 1438
instructions, pymagpar 4 / 347), a header check proving the shipped `.pyc` was compiled from the
shipped `.py` (`source_in_sync`, 10876 and 3638 bytes, build timestamp 15 Sep 2015, build path
`/home/user/Work/PyMAKInt/`), the MAKStripe wire protocol pulled out of the constant pool (38400
8N1, `?`→`MSUSB`, `R`→`Ready`/`RD `/ticks/`RD=OK`, `F`, `E`/`e`, `I`, `H`→`EZ=OK`), and the `.mag`
container verified against **all 144** captures upstream with the clock proven from the data itself
(widest gap 3.406667 s = 511/150 — the 9-bit tick ceiling, so seconds-and-150 Hz and nothing else
fits). Upstream ships no license, so nothing was re-hosted: hashes and derived facts only, and its
`woodlands_bulk/` real-ticket captures were parsed for format and never published — a synthetic
`.mag` stands in as the fixture.

**:CueCat and the Clik!** — both added as `PERIPHERALS`, both with their limits stated. The :Cat
(RadioShack 68-1965, Hyundai CPU, 93Cxx serial EEPROM) has no pinnable firmware dump, so its
disassembly is of the *encoding*: custom alphabet, base64 regrouping, then `(v ^ 3) + 64` folded
by *"if larger than 128 then subtract 128"* — that fold, not `& 0xff`, is what ports get wrong, and
four independently published scan strings now decode exactly in `tests/13-makint.mjs` (including
`ENr7C3n1C3PWD3rYCxzYChnZ` → `978006093471251300`, Bookland → ISBN `0060934719`, and the cat's own
catalog barcode `040293153502`). The Iomega Clik! is "disassemble which of the three": PC Card
ATAPI (the `IOMEGA Clik! 40 CZ ATAPI` model-string match that became an 11-character prefix
compare, data in the fourth partition), parallel cradle, and USB bridge; no controller firmware is
pinnable and none is claimed, so what ships is the verifiable part — the ATA IDENTIFY model field
with its per-word byte swap and an MBR reader whose fourth record returns 78 125 sectors × 512 =
40 000 000 bytes exactly.

Verification: `tools/verify_casefiles.mjs` — **ALL CHECKS PASSED, 82 checks** (was 66; adds the
22-row depot with ts+digest+length each, the five wave-7 pins held against drift, 13 sweep
archives, the PRSC/SCPROG rename asserted in the pin text, the port verdict, reader-vs-emulator
pin rows line by line, the 00529 recipes, `:CueCat`/Clik! limits, live calls into `js/makint.js`,
and the `makint` case wiring); `node tests/13-makint.mjs` — 72 assertions, including JS↔Python
agreement on the crystal arithmetic; `smoke_pipeline.mjs` clean; `check-dom-ids.mjs` pass;
`verify_disasm.mjs` 364/364; `sw.js` precache v24. One repair outside the wave: `tests/run.sh`
called `run_stale node tests/05…`, i.e. `node node tests/05…`, so the two known-stale suites died
with MODULE_NOT_FOUND and never ran — they now run and skip honestly. `run.sh` still exits 1 on a
**pre-existing** `build_coins.mjs --check` staleness that reproduces at HEAD without this wave's
files; it is a pinned data file regenerated from a market snapshot and was left alone rather than
quietly rebuilt.

## Wave 8 — the lecture hall grows a second shelf (2026-09-14)

Full research log: **`docs/lecture-hall-research-2026-09-14.md`**; the proofs live in
`tools/verify_lecture_hall.mjs` against the reference code in `js/lecture-ciphers.js`.

Four records were added to the Intelligence Lecture Hall of
`apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html` (now 8 rows), each one
computable rather than merely quoted:

* **F5’s Black Hat 2016 cipher challenge** — the operator’s post-mortem publishes all four
  ciphertexts and the Ruby generator; the port rebuilds the 42-character key square, re-derives
  the 22-digram T-shirt puzzle digram-for-digram, and re-peels the three intermediates the
  article prints. The circulating claim that the hard layer fell to F5 product terminology
  (“BIG-IP”, “ASM”) is **contradicted by the primary source** and is now flagged in the record.
* **The MD5 in the USCYBERCOM seal** — `9ec4c12949a4f31474f299058ce2b22a` recomputed from the
  392-character mission statement with `node:crypto`, with the newline and “specific” variants
  asserted to fail; CRN’s 31-character rendering recorded as the transcription error it is;
  “decoded” corrected to “guessed and re-hashed”, and the jemelehill/Correll primacy dispute
  left unresolved on purpose.
* **The Field Notes cipher wheel (“Clandestine”, 2018), via Jurph’s model** — 1296 keys reach
  exactly 648 alphabets, `XV`/`XW` are null keys, both verified by enumeration. Searching those
  648 recovers two lines of `messages.txt` under key `FN` (“IT’S NOT ENCRYPTED IN CODE TO
  DECIPHER IT LATER, IT’S ENCRYPTED IN CODE TO DECIPHER IT NOW”, and `F6ELDNOTESBRAND.COM`);
  the four short codes stay **unrecovered**, and the harness re-asserts that negative every run.
* **Agents of F.I.E.L.D. (f1eldn0tes.com)** — 8 of 8 published puzzle codes re-derive exactly
  from answer + two-letter key, #9 checks out as its documented `VK`→`KS` double decode, #11
  matches up to its documented spiral, and the blog’s **#19/#20 code collision** is flagged
  (that shared string decrypts under `IE` to `OVERLYGODLYESCAPADE02378`, which is not #20’s
  answer; #19’s code is not reconstructible) rather than quietly fixed.

The edit also repaired the hall’s own vocabulary bug — the legend defined
*Community recollection* but the filter row could not select it, while the filter and colour map
offered *Community archive* that the legend never defined — and now asserts
**legend ∩ colour map ∩ filter row** for every label any record carries. A raised bar is enforced
for new material: ≥ 8 facts, ≥ 4 provenance links, ≥ 200-character summary and caution, and no
unverified answer stated as fact.

Verification for this wave: `node tools/verify_lecture_hall.mjs` — **ALL CHECKS PASSED, 40
checks**; `node tools/verify_casefiles.mjs 8099` — **ALL CHECKS PASSED, 82 checks** (unchanged,
re-run after the bundle edit); the modified bundle’s inline app script (911 590 bytes) re-extracted
and re-parsed clean via `vm.Script`; `smoke_pipeline.mjs` clean; `check-dom-ids.mjs` pass.
`sw.js` untouched at v24 — the suite file and the new module are not in the precache list.
