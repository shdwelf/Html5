# Will Synchronet fit on a Lantronix xPort Pro? (No — and here is the arithmetic)

Written 2026-10-18. The question was *"try putting Synchronet on the xPort Pro
with wiki.in.a.jar, it won't fit."* It does not fit. This file shows why with
measured numbers rather than asserting the conclusion, because the conclusion is
the easy part and the arithmetic is what makes it checkable.

Model: [`tools/xport-pro-fit-model.mjs`](../tools/xport-pro-fit-model.mjs),
tests: [`tests/xport-pro-fit.test.mjs`](../tests/xport-pro-fit.test.mjs) (12 tests).
Reproduce the analysis with `node tools/xport-pro-fit-model.mjs --check`.

The device facts are from
[docs/lantronix-uclinux-deep-dive-2026-10-08.md](lantronix-uclinux-deep-dive-2026-10-08.md),
which sources them from Lantronix's Linux SDK user guide 900-548. The
Synchronet and Wiki-in-a-Jar numbers were measured here, today, from shallow
clones; the commands are recorded in the model's header.

---

## 1. The budget is 4 MiB, not 16 MiB

The xPort Pro has 16 MB of parallel flash, which invites the assumption that
there are 16 MB to play with. There are not.

| Region | Size | Note |
| --- | --- | --- |
| dBUG bootloader | 256 KiB | 128-byte image header |
| Kernel bank × 2 | 1.5 MiB each | **dual-bank upgrade with a safe bank** |
| `/dev/mtd4` ROMFS | 3.5 MiB | read-only, XIP, already occupied |
| `/dev/mtd5` JFFS2 | **4 MiB** | the only writable space there is |
| Unaccounted | 5.25 MiB | config, padding, partition alignment |

Two things are usually missed. First, **there are two kernel images**, because an
in-field upgrade needs somewhere to fail into. Second, the root filesystem is
**ROMFS** — read-only, and already holding the vendor userland (BusyBox 1.13.3,
boa + axTLS, dropbear 0.52, openssl 0.9.8k, the `s2e` family). Nothing can be
installed into it.

So a third-party application gets `/dev/mtd5`: **4 MiB**.

## 2. Synchronet, measured

From `SynchronetBBS/sbbs` at depth 1:

| Component | Size | Files |
| --- | --- | --- |
| `ctrl/` | **22.40 MiB** | 1,350 |
| — of which `.tdf` | **20.51 MiB** | 1,196 |
| `text/` | 220 KiB | — |
| `web/` + `webv4/` | 4.33 MiB | — |
| Core source | 472,398 lines | 9 modules → 23 binaries |

`ctrl/` is the runtime directory — node configuration, message bases, text, and
the `.tdf` area and file lists. It is not build output and not optional.

**The headline needs no assumptions:** the `.tdf` files alone are 20.51 MiB,
which is **128 % of the entire 16 MiB chip**. Before considering a compiler, a
toolchain, or a single byte of executable, the data does not fit on the flash —
not in the writable partition, not in the whole device.

Strip it down as far as it goes — no doors, no web content, no `.tdf` lists, just
`ctrl/` minus `.tdf` plus `text/`, which is 2.10 MiB — and add the 23 binaries:

| Binary size assumed | Total | vs 4 MiB writable |
| --- | --- | --- |
| 100 KiB each | 4.35 MiB | 109 % — does not fit |
| 1 MiB each | 25.10 MiB | 628 % — does not fit |

The binary size is the **only** quantity in the model that was not measured, so
it is carried as a range and the conclusion is tested at both ends. There is no
assumption under which this fits.

## 3. The blocker that has nothing to do with bytes

Even with infinite flash, Synchronet would not run on this kernel.

The xPort Pro's Linux part numbers run **µClinux**, and µClinux on this part is
MMU-less — that is what µClinux *is*. Consequences, counted rather than
remembered:

- **No `fork()`, only `vfork()`.** `grep` over `src/sbbs3` and `src/xpdev` finds
  **7 `fork()` sites**, **9 `popen()`** and **1 `execv()`**. `popen` is
  fork + pipe + exec. Under uClibc on an MMU-less target, `fork()` is `vfork()`,
  so the child shares the parent's address space until it calls `exec` — a
  program that forks and then does any real work before execing does not
  survive it.
- **No virtual memory for a scripting engine.** Synchronet embeds a JavaScript
  engine. An MMU-less flat memory model has no heap growth semantics to give one.

This is the same conclusion
[docs/synchronet-build-and-uclinux-notes.md](synchronet-build-and-uclinux-notes.md)
reached from the build side, where `make -C sbbs/src/sbbs3 -j4` does exit 0 and
produces 23 binaries — for x86-64 Linux with an MMU.

## 4. wiki.in.a.jar — the size was never the problem

| | |
| --- | --- |
| `lib/xrays.jar` | **26,107 bytes** (measured; matches the deep-dive's own reading of the bytes) |
| `WikiInAJar-0.8-20081128-bin.zip` | 123.4 KiB |
| Fits in the 4 MiB writable partition | **yes, 33 times over** |
| Can run on the xPort Pro | **no** |

It is a Java web application with its own HTTP server — a NanoHTTPD derivative
relocated into `net.sf.wikiinajar.xrays`, default port 3003, no container, no
database. One jar, 26 KB, exactly the shape you would want for an embedded box.

And it cannot execute, because **there is no JVM for ColdFire µClinux**. The only
Java virtual machine this device family is ever discussed alongside is the Java
Card VM, and that is a different machine: no threads, no dynamic class loading,
no `java.io`, no sockets. Section 5.2 of the deep-dive is the long form of that
distinction, and this is the concrete case where it bites.

A 26 KB program that cannot run is not a near miss. It is a category error, and
the size is a distraction from it.

## 5. What the device would actually accept

4 MiB of JFFS2, an MMU-less ColdFire at 166 MHz, and a kernel with `vfork`. That
accepts:

- a **single process** — no `fork`, only `vfork`
- **no scripting engine** — no VM heap to give one
- **C against uClibc**, static or against the vendor runtime
- telnet or raw TCP in, serial out — the device is already a serial-to-Ethernet
  bridge, and `s2e` is right there

A few hundred kilobytes is the honest ceiling for that shape, which leaves
comfortable headroom in the partition. The device is not short of flash; it is
short of *everything Synchronet assumes*.

---

## What was not done

- **No ColdFire binary was built.** There is no `freescale-coldfire-*` toolchain
  in this sandbox, so the size of a ColdFire `sbbs` is a range, not a
  measurement. Everything else in the model is measured or sourced, and the
  binary size is the one number the tests span rather than pin.
- **Nothing was flashed or booted.** The partition map is Lantronix's published
  one, read from the SDK documentation, not from a device.
- The `.cache/fit/` clones are gitignored and not committed. The re-measure test
  skips cleanly when they are absent.
