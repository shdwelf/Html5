# SpiderMonkey, a C BBS for uClinux, and FidoNet↔news sync

*2026-10-23 · backlog S6/T6.3, S7/T7.2 · GitHub-grounded investigation.
Built this round: `js/fidonet-pkt.js` (FTS-0001 packet + echomail→news
mapping, 5/5 synthetic-fixture tests). Prior art in-repo:
[`synchronet-build-and-uclinux-notes.md`](synchronet-build-and-uclinux-notes.md)
(Synchronet 3.22a built here; XPort Pro fit analysis),
[`bbs-abandonware-coldfire-port.md`](bbs-abandonware-coldfire-port.md),
[`lantronix-uclinux-deep-dive-2026-10-08.md`](lantronix-uclinux-deep-dive-2026-10-08.md).*

## SpiderMonkey, as found on GitHub

SpiderMonkey is Mozilla's JavaScript engine. On GitHub in Oct 2026:

- **Upstream is not a standalone repo.** The engine lives at `js/src` in
  `mozilla/gecko-dev` (the Firefox monorepo); standalone tarballs are cut
  from ESR branches. `mozilla-spidermonkey/spidermonkey-embedding-examples`
  (228★) is the official embedding tutorial; `servo/mozjs` is Servo's fork;
  `mozilla/spidernode` (Node-on-SpiderMonkey) is archived.
- **The SpiderMonkey this repository actually runs is 1.8.5** — vendored
  inside Synchronet (with NSPR), and it *compiled* in the 2026-10-17 build
  here, though `jsexec` execution against a real control directory remains
  unverified. JS 1.8.5 is the Firefox-4-era engine (2011): pre-ES6,
  interpreter/JIT of its day, long past upstream support.

### Fit for ColdFire uClinux (XPort Pro class: 166 MHz, 8–16 MB RAM)

| Engine line | Reality on the target |
| --- | --- |
| Modern SpiderMonkey (ESR) | Multi-tens-of-MB engine + NSPR + Rust-built components, JIT assumes an MMU and executable-memory management, threads throughout. **Not portable** to 16 MB MMU-less ColdFire in any honest sense. |
| Vendored JS 1.8.5 (Synchronet) | Smaller and C++-only, but still sized and threaded for a desktop-class POSIX host (the 2026-10-17 notes: robust-mutex pthreads, fork expectations). Interpreter-only ColdFire port is conceivable as archaeology, not as a product: an unmaintained 2011 JS engine is also a security liability the moment it runs untrusted scripts (doors, JS sysop scripts). |
| Embedded engines (Duktape, JerryScript, QuickJS) | The size class the target actually admits (hundreds of KB, no JIT requirement for Duktape/JerryScript). But Synchronet's value is its **JS object model** (the `bbs`, `user`, `msgbase` APIs hundreds of mods target); an engine swap is an API re-implementation, not a recompile. |

**Verdict:** investigate-done — SpiderMonkey (either vintage) is the
*first thing to remove* in a uClinux conversion, not the thing to port.
On the hosted Linux side it stays exactly as built in 2026-10-17.

## A BBS in C, GitHub survey (Wildcat/Synchronet class)

Wildcat! itself is commercial and closed-source (WINServer), so it fails
the "on GitHub, in C" requirement outright. The real candidates:

| Candidate | Language (GitHub, Oct 2026) | FidoNet | News sync | uClinux fit |
| --- | --- | --- | --- | --- |
| **Synchronet** (`SynchronetBBS/sbbs`) | C++ 71.6 MB + C 62.1 MB + JS 18.4 MB; 396 MB repo; active daily | SBBSecho tosser + BinkIT mailer | NNTP service (`nntpservice.js`) + newslink gateway | **None** for XPort-class (see 2026-10-17 verdict: SpiderMonkey/cryptlib/fork/threads). Keep hosted. |
| **MBSE BBS** (`bbs-io/mbse`) | **C 4.28 MB**, GPL-2.0; repo dormant since 2021 | **Native**: `mbcico` BinkP/IFC mailer, `mbfido` tosser, areafix/filefix, TIC | **`mbfido news`** scans NNTP servers and gates articles↔areas; **`mbnntp`** (RFC977/2980) serves echomail areas that have valid newsgroup names | **Best starting point**: pure C, modular daemons, JAM bases. Still a full multi-process suite — conversion means selecting a node subset (below), not a recompile party trick. |
| WWIV (`wwivbbs/wwiv`) | C++ 5.4 MB; active 2026 | WWIVnet-native; FTN via add-ons | NNTP via add-ons | C++ runtime + its own deps; second choice behind MBSE for a C-first port. |
| ENiGMA½, Mystic | Node.js / closed Pascal | yes | yes | Excluded by the "in C" requirement (and the 2026-10-17 notes). |

## "Sync with FidoNet news" — the design

"FidoNet news" resolves to two concrete flows, and both candidate stacks
name the same parts:

1. **Echomail → news (read side).** Areas served to newsreaders require a
   valid newsgroup name per area (MBSE's `mbnntp` rule). Mapping used by
   this repo's new code: `FIDOTEST` → `fidonet.fidotest` (lowercase,
   non-alphanumerics folded to dots, validity-checked). Synchronet's
   answer is its NNTP service over the same message bases.
2. **News → echomail (write side).** `mbfido news` polls an NNTP server,
   stores new articles, and forwards them to FTN up/downlinks;
   Synchronet's `newslink.js` is the equivalent gateway module.

The gateway invariants (where data loss actually happens) are implemented
and tested in `js/fidonet-pkt.js`:

- **Identity:** FTN `^AMSGID: zone:net/node seq` ↔ NNTP `Message-ID`
  (`<seq@zone.net.node.fidonet.invalid>`), `^AREPLY` → `References`.
  Without this, threads and dupe detection disintegrate at the boundary.
- **Hygiene:** kludges, SEEN-BY, PATH, tearline and origin are *evidence*
  — preserved on the parsed record, never posted to the news side.
- **Transport integrity:** Type-2 packet (FTS-0001) parse is bounded and
  fail-soft per message; a corrupt packet degrades to warnings, not a
  crashed tosser.

A minimal ColdFire node then composes as: `mbcico`-class BinkP mailer
(TCP 24554) ↔ packet layer (this parser's C analogue) ↔ JAM/message store
↔ `mbnntp`-class server + telnet BBS front end, single-process or
vfork-spawned sessions, no JavaScript engine.

## uClinux conversion plan (for the MBSE-derived subset)

Target recap (repo-measured): ColdFire 166 MHz, 16 MB flash, 8–16 MB
SDRAM, uClinux — **no `fork()` (vfork only), no MMU, fixed stacks, FLAT
binaries**. Phases, each independently checkable:

1. **Host-side subset selection.** From MBSE's ~30 programs, the node
   needs: mailer (BinkP only; drop modem/IFC), tosser (pkt/JAM only; drop
   TIC/filefix), BBS + NNTP server, setup/mon utilities dropped.
2. **POSIX audit.** `fork`→`vfork`+exec or single-process session loop;
   `mmap` file I/O→read/write; daemonization, syslog, and signals
   reworked; per-process stack budgets set explicitly.
3. **Cross-build.** `m68k-uclinux-gcc` (the classic ColdFire toolchain),
   static or XFLAT; size gate: mailer+tosser+BBS+NNTP must fit the flash
   budget beside kernel+rootfs in 16 MB — the reason SpiderMonkey and the
   full suite stay behind.
4. **Sync acceptance.** Synthetic PKT fixtures (the JS suite's vectors
   ported to C asserts) round-trip losslessly; a gated article keeps its
   Message-ID across FTN→NNTP→FTN; SEEN-BY/PATH never leak to news.
   *Started 2026-10-23:* `tools/bbs/ftnpkt.c` is the C99 reference
   implementation of the packet layer (dump + `--news` gateway views),
   cross-checked against the JS implementation on identical fixtures —
   `tests/fidonet-pkt-c.test.mjs` compiles it `-Wall -Wextra -Werror`
   clean and asserts output parity, truncation behaviour, and exit
   codes. It is deliberately uClinux-shaped: one translation unit, no
   fork/threads, bounded buffers, capped input.

**Bottom line:** Synchronet remains the hosted flagship (already building
here, SpiderMonkey and all); the uClinux deliverable is an MBSE-derived
minimal FTN node whose news sync follows the mapping above. Wildcat is
out (closed), WWIV is the fallback if C++ is ever acceptable.

## Sources

- GitHub API survey 2026-10-23: `SynchronetBBS/sbbs` (396 MB, C++/C/JS),
  `bbs-io/mbse` (C 4.28 MB, GPL-2.0), `wwivbbs/wwiv`,
  `mozilla-spidermonkey/spidermonkey-embedding-examples`, `servo/mozjs`
- MBSE manual (mbcico BinkP/1.1 + PLZ; `mbfido news`; `mbnntp` RFC977/2980
  newsgroup-name rule) — phoenix.bnbbbs.net/mbseman; `bbs-io/mbse` README
- Synchronet wiki: SBBSecho (FTN tosser, not a mailer — pair with BinkIT),
  NNTP service, networking docs (wiki.synchro.net)
- FTS-0001 (Type-2 packet format) as implemented in `js/fidonet-pkt.js`

Backlog: T6.3/T7.2 advanced — candidate chosen (MBSE-derived subset),
SpiderMonkey question closed with evidence, news-sync substrate built
and tested. Remaining: the C port itself (cross-toolchain work) and any
live FTN peering (needs a real uplink; none is fabricated here).
