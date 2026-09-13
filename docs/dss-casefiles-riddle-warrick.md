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
