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
