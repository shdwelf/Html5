# Java telnet / SSH servers on ColdFire µClinux — a measured survey

Question: can an abandonware Java BBS, or any Java telnet/SSH server JAR, run on
a Lantronix xPort Pro (DSTni-FX ColdFire, MMU-less µClinux, 4 MiB writable
JFFS2)?

**No.** And unlike the Synchronet analysis in `docs/xport-pro-synchronet-fit.md`,
this is not a size finding. Every candidate fits in the partition many times
over. They fail because they need JVM capabilities that no JVM for this target
provides.

The survey is measured, not recalled. `tools/jvm-requirements.mjs` reads a
target's Java source and a JVM's C source, and reports the gap. cfjvm's
capability profile is parsed out of `jvm/cfjvm.c`, so if the interpreter ever
gains socket support the verdict changes on its own.

    node tools/jvm-requirements.mjs --target <dir> [--jvm jvm/cfjvm.c] [--json]

Exit 0 = can run, 1 = cannot, 2 = usage or parse error.

## What cfjvm provides

Parsed from `jvm/cfjvm.c`: **9 classes**, and nothing else.

```
java/io/PrintStream  java/lang/Class    java/lang/Integer  java/lang/Long
java/lang/Math       java/lang/Object   java/lang/String   java/lang/StringBuilder
java/lang/System
```

Output is `stdout`/`stderr` only. There is no socket call, no thread support,
no `athrow`/exception table, no `monitorenter`, no reflection, no `java.nio`,
no `java.util.concurrent`, no `invokedynamic`, and no floating point — the last
by explicit decision, since approximating `Math.sqrt` would have been worse
than omitting it.

## The candidates, measured

Cloned at HEAD and analysed. Hit counts are after stripping comments and
string literals, which matters — see the note at the end.

| Target | Provenance | Files | Lines | Missing capabilities |
| --- | --- | --- | --- | --- |
| **telnetd-x** | `net.wimpi`, Dieter Wimberger 2000-2005, last release 2010, Modified BSD TelnetD licence, SourceForge categories "Chat, BBS, Internet" | 49 | 8,733 | **5** — socket-io, threads, exceptions, synchronization, reflection |
| **kTelnet** | `teverett/ktelnet`, embeddable multithreaded Java telnet server, BSD, `com.khubla.ktelnet` | 84 | 5,141 | **6** — socket-io, threads, exceptions, file-io, nio, concurrent |
| **petscii-bbs** | `sblendorio/petscii-bbs`, active, PETSCII BBS framework for C64/C128 clients | 468 | 64,864 | **10** — every capability tested |
| **Apache MINA SSHD** | `apache/mina-sshd`, actively maintained, Java 8+ runtime, slf4j, ExecutorService threads, NIO2 `AsynchronousSocketChannel` by default, JCE crypto | 1,425 | 227,402 | **10** — every capability tested |

All four: `verdict: CANNOT run`.

**telnetd-x is the floor.** It is the most favourable candidate in the whole
space — pre-`java.nio`, no `java.util.concurrent`, plain blocking sockets with
one thread per session, 8.7k lines. It is also the one that most closely fits
"abandonware BBS telnet server JAR": a 91 KB JAR, BSD-licensed, categorised as
BBS software, unmaintained since 2010, with the Google Code home page long
gone. And it still needs five capabilities cfjvm does not have.

The ordering is consistent: as you move from a 2005 blocking-I/O daemon to a
modern SSH server, the required JVM surface grows monotonically. Nothing in the
space gets *easier* than telnetd-x.

## Why the five matter

- **socket-io** — without it there is no server. Non-negotiable.
- **threads** — telnetd-x spawns a `Connection` thread per accepted socket. A
  single-threaded VM serves exactly one caller at a time, which is not a BBS.
- **exceptions** — 230 hits across 19 files. Blocking reads signal end-of-stream
  and errors by throwing `IOException`. Without an exception table the first
  disconnect is fatal rather than handled.
- **synchronization** — 40 hits. The accept loop and the sessions share state.
- **reflection** — shells and terminals are instantiated by class name from a
  properties file. `TelnetD.prepareShellManager` resolves them at boot.

None of these is incidental. Removing any one breaks the daemon rather than
degrading it.

## The abandonware BBS landscape

What the survey turned up, for completeness:

- **telnetd / telnetd-x** (`net.wimpi.telnetd`) — the canonical embeddable Java
  telnet daemon, and the one everything else builds on. `ringmud`'s
  `TelnetInputStream` wraps its `BasicTerminalIO`. This is the JAR that comes
  closest to the request.
- **JBuzz** — a Java "BBS Server Framework" telnet daemon, listed under Java
  telnet software with discussion-board and chat facilities. Not cloned or
  measured here; see below.
- **kTelnet**, **petscii-bbs** — measured above.
- **Java MUD servers** (`ringmud`, `mud-server`) — telnet protocol constants
  including MCCP1/MCCP2, MSP, MXP, ZMP, ATCP. Same JVM requirements as
  telnetd-x, since they sit on the same primitives.
- **Apache MINA SSHD** — the only serious pure-Java SSH *server*. Not
  abandonware at all, and the furthest from feasible here.

Non-Java, for contrast: Synchronet (C — analysed separately, fails on size and
`fork()`), Mystic (Pascal), Enigma ½ (Node.js), Iniquity (TypeScript/DOSBox),
Citadel and WWIV (C). None is a JAR, so none is in scope.

## What would actually work on this board

The repo already has the working answer: `tools/bbs/telnetbbs.py`, a real
telnet BBS that speaks IAC negotiation when a telnet client connects and treats
the stream as raw 8-bit serial when the XPort bridges in Modem Emulation mode.
Its rule — negotiate only what the peer initiates — is what makes the same
listener work behind a client, behind the XPort, and behind a test harness.

Porting *that* to C is the credible path. It needs no JVM, no `fork()`, and no
heap growth, so it fits both the 4 MiB partition and the MMU-less constraint
that killed Synchronet. The protocol semantics are already written down and
tested; the work is translation and measurement.

Making cfjvm host telnetd-x instead would mean adding sockets, threads,
exceptions, monitors and reflection to the interpreter — in effect writing a
second, much larger JVM. µClinux can supply the primitives (pthreads work on
MMU-less ColdFire; they are kernel threads sharing one address space, and BSD
sockets are ordinary syscalls), so it is not impossible. It is simply a
different and far larger project than "find a JAR that fits".

## A note on how this was measured

The first version of the tool produced two false negatives in the same
direction, both from matching raw source text:

- `jvm/cfjvm.c` contains the comment *"no support for invokedynamic"*. Matching
  the word `invokedynamic` anywhere registered the interpreter as **providing**
  it. The tool reported `capabilities: lambdas` for a VM whose own header
  disclaims them.
- telnetd-x contains 29 log messages of the form
  `"readNEVariables()::NE_IN_ERROR"`. Matching `::` registered **Java 8 method
  references in Java 1.4 code**, adding a capability requirement that does not
  exist.

Both made the verdict look more permissive than the truth, which is the
dangerous direction for a feasibility tool. The fix is a single-pass scan that
strips comments and string/char literals before matching, applied to the Java
targets and to the JVM's C source alike. Class names, which in the C source
*are* string literals, are extracted from the raw text. Tests
`tests/jvm-requirements.test.mjs` pin both regressions.

## What was not done

- **JBuzz was not measured.** It appears in SourceForge's Java telnet listing
  but has no obvious current Git home to clone. It is listed rather than
  assessed, and should not be quoted as a candidate until it is measured.
- **Nothing was compiled or executed.** There is no JDK in this sandbox
  (`.cache/jdk` is absent, no `javac` on PATH), so cfjvm's own differential
  test is skipping and `make -C jvm test` fails with `no javac available`. The
  verdicts here come from source analysis, which is the right tool for this
  question but is not a substitute for running the code.
- **No JAR file was fetched.** The analysis reads source trees, so the results
  do not depend on any build artefact.
- The clones live in gitignored `.cache/` and are not committed.
