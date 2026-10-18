# BBS servers: archive.org abandonware, GitHub open source, and what porting to cfjvm takes

Research date: 2026-10-18. Two surveys, then the porting question.

A note on a stale assumption: this file records that **archive.org is reachable
from this sandbox**. Earlier work had it down as unreachable. It is reachable,
both the search UI and `advancedsearch.php?...&output=json`.

## 1. archive.org

`title:(bbs OR "bulletin board") OR description:"bbs server"`, `mediatype:software`,
sorted by downloads: **759 items**. The large majority are shareware CD
compilations, BBS file-section dumps, and demoscene intros *about* BBSes rather
than BBS software. Actual server engines in the top results:

| Identifier | Title | Year | Licence |
| --- | --- | --- | --- |
| **`telegard`** | **Telegard BBS Server** | 1999 | **CC Public Domain Mark 1.0** |
| `WILDCATGOLD` | Wildcat! Gold: The Optical BBS (Mustang Software) | 1992 | none stated |
| `mustang-software-wildcat-4.11` | Wildcat! 4.11 BBS for DOS | 1995 | none stated |
| `wildcat5` | Wildcat! BBS 5 | 1996 | none stated |
| `Wildcat_Elite_BBS_1998_04_01` | The Wildcat Elite BBS Collection | 1998 | none stated |
| `bbs-toolkit` / `bbs-toolkit_202108` | Powersource Multimedia BBS Toolkit | 1995 | none stated |
| `Mystic_BBS_v1.12_a41_linux` | Mystic BBS v1.12 a41 (x86/64 Linux) | 2018 | none stated |
| `BBS_Documentary_DVD_Set` | BBS: The Documentary DVD Set | 2005 | CC BY-SA 4.0 |

**`telegard` is the significant find.** It is the only genuine BBS *server* in
the result set carrying an explicit public-domain mark, which makes it the one
item here whose structure can be studied and reimplemented without a licensing
question. Telegard is a Pascal program, so it is a source of design rather than
of code: its menu tree, message-base layout, and user-record shape are what
port, not its sources.

Everything else above is either still-commercial shareware (the Wildcat!
family), still-maintained (Mystic), or documentation.

Two categories in the results were **deliberately not examined or recorded**:
adult-disc compilations, and items whose titles advertise being cracked
(`Blobby #26 - Merry Christmas (Working, Fully Cracked)` and similar). Neither
is relevant to porting and one is not something to help distribute.

## 2. GitHub

Searched by `topic:bbs` and by engine name. Sorted by stars, with the licence
GitHub reports:

| Repository | Stars | Language | Licence | Note |
| --- | --- | --- | --- | --- |
| `durdraw/durdraw` | 1,845 | Python | **BSD-3-Clause** | ANSI art BBS |
| `mrusme/superhighway84` | 792 | Go | GPL-3.0 | deliberately retro BBS |
| `NuSkooler/enigma-bbs` | 670 | JavaScript | **BSD-2-Clause** | the most active modern engine |
| `jquast/x84` | 373 | Python | none stated | telnet/ssh BBS |
| `iniquitybbs/iniquity` | 61 | TypeScript | **MIT** | |
| `SynchronetBBS/sbbs` | 111 | C++ | none stated | analysed separately in `docs/xport-pro-synchronet-fit.md` |
| `leewoodridge/RenegadeBBS` | 38 | Pascal | none stated | Renegade source |
| `hiraethbbs/renegade` | 6 | Pascal | GPL-3.0 | |
| `bozimmerman/Zimodem` | 541 | C | Apache-2.0 | Wi-Fi modem emulator, BBS-adjacent |

Two adjacent finds worth recording: `ghaerr/elks` (1,719 stars, the Embeddable
Linux Kernel Subset for 16-bit x86) is the closest thing in this space to the
MMU-less constrained-target problem, and `mrusme/neonmodem` (698 stars) is a
Go terminal client rather than a server.

## 3. What porting to ColdFire actually requires

Nothing in either survey can be ported wholesale, and it is worth being precise
about why, because the reason is not size.

`tools/jvm-requirements.mjs` measured four Java servers last time and every one
needs sockets, threads and exceptions. The engines above are worse positioned,
not better: enigma-bbs wants Node, superhighway84 wants a Go runtime, Synchronet
wants `fork()` on a kernel that only has `vfork()`.

But a BBS is two separable things. The **network half** is what needs sockets
and threads. The **session half** — menu tree, message base, user record, ANSI
rendering, the login sequence — is ordinary sequential logic. On a
single-session, stdio-driven BBS the network half disappears entirely: the
XPort in Modem Emulation mode bridges serial bytes to a TCP connection, so
something reading stdin and writing stdout *is* a reachable BBS.

That reframes the work as: what does the session half need from a JVM?

`jvm/cfjvm.c` implements **9 classes**, all output-only:

```
java/io/PrintStream  java/lang/{Class,Integer,Long,Math,Object,String,StringBuilder,System}
```

There was **no input path of any kind**. No `getchar`, no `fgetc`, no
`System.in`. A BBS could announce itself and then never hear a reply. That was
the actual blocker, and it is much smaller than sockets or threads.

## 4. What was done about it

cfjvm now has standard input:

- `cfj_fgetc` added to `jvm/cfjvm_port.h`, so the µClinux contract stays
  complete and a target can redirect stdin rather than the interpreter calling
  `fgetc` behind the port layer's back.
- `java/io/InputStream` added to the builtin class list.
- `getstatic java/lang/System.in` resolves to a singleton, mirroring `System.out`.
- `InputStream.read()` returns `0..255`, or `-1` at end of input.

`read()` returning `-1` rather than throwing is not a shortcut. `java.io.InputStream.read()`
is specified that way, and this interpreter has no exception tables, so a
caller loops on `-1` instead of catching `IOException`. `available()` returns a
honest `0`: with a blocking single-threaded interpreter there is no look-ahead
to report, and callers must not rely on it.

### How it was verified without a Java toolchain

**This sandbox has no Java runtime whatsoever** — no `javac`, no `java`, no
`libjvm.so` anywhere on the filesystem, and the in-repo
`tools/java-compiler/ecj-4.4.jar` (2,298,872 bytes) is itself a JAR that needs a
JVM to run. So the ordinary verification route is closed.

`tools/emit_stdin_probe.py` assembles a class file directly instead: it reads one
byte from stdin, appends it to a `StringBuilder`, and prints it. Its output is a
direct echo of what the interpreter read, which makes the test functional rather
than a compile check. Observed:

```
printf 'X' | ./jvm/build/cfjvm StdinProbe.class   ->  X
printf 'Q' | ./jvm/build/cfjvm StdinProbe.class   ->  Q
printf '\n' | ./jvm/build/cfjvm StdinProbe.class  ->  two newlines (echo + println)
```

`tests/cfjvm-stdin.test.mjs` pins this, including that a byte above `0x7F`
returns unsigned rather than sign-extended, and that empty input is reported
rather than fatal. **Mutation-checked**: deleting the `InputStream` native block
fails 4 of the 7 tests.

The probe deliberately uses no `swap`, no exception table and no arithmetic, so
it exercises exactly the new path and nothing speculative.

### A bug the probe caught

The first version of the assembler returned `len(entries) + 1` as each new
constant's index, inflating every reference by one; a `NameAndType` ended up
pointing at itself. Decoding the emitted class showed it plainly —
`#9 NameAndType 8.9` where it should read `7.8`. Worth recording because
cfjvm's error message was `constant pool index 44 is not a Utf8 entry`, which
points at a symptom far from the cause.

## 5. What remains

The session half is now reachable but not yet written. The remaining work, in
order:

1. A menu/message/user model. The repo's established pattern applies — a pure
   model with tests, like `js/mealplan-model.js` or `js/tiny-dino-model.js` —
   with Telegard's public-domain structure as the design reference.
2. A `Bbs.java` targeting cfjvm's actual surface: no `int` where `short` will
   do is not a constraint here, but no exceptions, no threads, no `java.nio`,
   and no floating point are.
3. Wiring it into `jvm/Makefile` so CI compiles it against a real JDK and
   diffs the output against cfjvm's, the way `jvm/tests/Smoke.java` already is.

Step 3 cannot be verified locally and should not be described as working until
CI runs it. Steps 1 and 2 can be.

## What was not done

- **No BBS engine was ported.** The stdin path was the blocker and it is now
  open and verified; the session logic is next.
- **No archive.org item was downloaded.** The survey used the search API's
  metadata only.
- **No Java was compiled or executed**, because there is no Java here. The
  class file was assembled by hand and run under cfjvm.
- Cracked and adult items in the archive.org results were not examined.
