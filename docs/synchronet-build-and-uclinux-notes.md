# Synchronet build from source, and the Ghidra / uClinux question

Follow-up to [`xport-bbs-deployment.md`](xport-bbs-deployment.md), which recorded
that Synchronet would not build here. Retried on 2026-10-17 by building the
missing dependencies from source. The build now gets substantially further and
stops on one specific, well-characterised blocker.

## Ghidra is the wrong tool for both programs

Worth saying before anything else, because it saves the work.

**Synchronet is open source.** The full tree is on GitHub at
`SynchronetBBS/sbbs` — 16,252 files, C and C++, including every routine a
decompiler would be asked to recover. Disassembling software whose source you
are holding produces a strictly worse version of what you already have: no
identifiers, no types, no comments, and no build system to test a change
against.

**Mystic BBS likewise has source for the version that matters.** Current Mystic
is distributed as binaries, but `FIDOSOFT/mysticbbs` is a Pascal clone of
1.10a30, the last openly-sourced release.

Ghidra earns its place when the source does not exist — which is exactly why
this repository uses it on `INSTALL.COM` and the ARJSFX stub in
[`arj-garble-format-notes.md`](arj-garble-format-notes.md). Neither BBS is that
case.

## What the retry achieved

`apt-get` is useless here — `deb.debian.org` and `archive.ubuntu.com` both fail
to resolve. But four of the five missing dependencies are obtainable from
GitHub, which is reachable:

| Dependency | Source | Result |
| --- | --- | --- |
| zlib | `madler/zlib` | **built and installed** |
| ncurses | `mirror/ncurses` (ships a generated `configure`, so no autoconf needed) | **built and installed** |
| NSPR | `mozilla/gecko-dev`, sparse checkout of `nsprpub` only (5.9 MB) | **built and installed** |
| pkg-config | no autotools to build pkgconf → shell shim | **shim** |
| libarchive | `libarchive/libarchive` | **built** — `configure` was never needed |

**Result: Synchronet 3.22a builds and runs.** `make` exits 0 and produces 23
binaries in `src/sbbs3/gcc.linux.x64.exe.debug/`, including `sbbs`, `node`,
`jsexec` and `scfg`. `./sbbs -v` prints:

```
Synchronet Console for Linux-x64  Version 3.22a  Copyright 2026 Rob Swindell
```

and `ldd` resolves `libarchive.so`, `libncursesw.so.6` and `libnspr4.so` from
`/usr/local/lib`.

I previously recorded libarchive as blocked. That verdict was wrong — see
*libarchive without autotools* below.

The NSPR route is the transferable trick: NSPR is not published as a standalone
GitHub repository, but it lives inside Gecko as `nsprpub/`, and a sparse
checkout pulls just that subtree:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/mozilla/gecko-dev.git
cd gecko-dev && git sparse-checkout set nsprpub
cd nsprpub && ./configure --prefix=/usr/local --enable-64bit && make -j4 && make install
```

`ncurses.h` installed to `/usr/local/include/ncurses/`, not
`/usr/local/include/`, so the five public headers had to be symlinked up one
level before `#include <ncurses.h>` would resolve.

With those in place the two expensive vendored dependencies **both compiled**:
SpiderMonkey `js-1.8.5` and cryptlib. That is the bulk of the build.

### A bug of mine, found and fixed

The first shim answered `--exists` successfully for *every* package. Synchronet's
configure therefore detected ALSA, which is not installed, defined
`USE_ALSA_SOUND`, and `xpbeep.c` failed on `<alsa/asoundlib.h>`. The include is
correctly guarded by `#ifdef USE_ALSA_SOUND` — the fault was the shim lying
about what exists. Rewritten to fail for anything not actually built, and ALSA
is now correctly reported absent.

A configure probe that always says yes is worse than no probe at all.

## libarchive without autotools

`src/sbbs3/filedat.c` includes `<archive.h>` unconditionally and calls **38
distinct libarchive functions**, so the dependency is not optional. The git repo
ships no generated `configure`, only `build/autogen.sh`, and autoconf cannot be
bootstrapped here — `autoconf`, `automake`, `libtool`, `cmake`, `meson` and
`ninja` are all absent. `tar-mirror/gnu-m4` *does* ship a generated `configure`
(1,122,193 bytes), but `autotools-mirror/autoconf`, `autotools-mirror/automake`,
`tar-mirror/autoconf`, `tar-mirror/automake` and `tar-mirror/libtool` all lack
one, and bootstrapping autoconf needs autoconf. Release tarballs are unreachable:
`github.com/.../releases/download/...` returns HTTP 302 to
`release-assets.githubusercontent.com`, which fails with `SSL_ERROR_SYSCALL`.

The way through is that **`configure` is not the only route to a `config.h`**.
libarchive ships `build/cmake/config.h.in` — 1,491 lines, 429 `#cmakedefine`
features — and `libarchive/archive_platform.h` accepts it:

```c
#if defined(PLATFORM_CONFIG_H)
# include PLATFORM_CONFIG_H
#elif defined(HAVE_CONFIG_H)
# include "config.h"
```

`tools/build_libarchive_config.py` turns that template into a `config.h` by
running real compiler probes: a `#cmakedefine HAVE_FOO_H` becomes a compile of
`#include <foo.h>`, a `HAVE_DECL_*` becomes a cast, a `SIZEOF_*` becomes a
compile-and-run of `sizeof`. Nothing is guessed. Final tally: **182 defined,
157 absent, 89 undecidable of 428**. All 134 sources in `libarchive/*.c`
compile, and the result is functionally verified, not just compiled:

```
$ ./laver            # links -larchive, calls archive_version_string()
libarchive libarchive 3.9.0dev (3009000)
```

Four bugs in that generator, all found by the compiler rather than by reading:

1. `header_test` stripped the `_H` suffix but never the `HAVE_` prefix, so it
   probed for a file named `have_stdint.h`. Every header came back absent.
2. The 37 `@VAR@` placeholders (`@SIZEOF_INT_CODE@`, `@VERSION@`, …) passed
   through verbatim and produced `stray '@' in program` in 133 of 134 files.
3. `decl_test` evaluated `&(UINT64_MAX)`, which never compiles for a macro
   constant, so every `HAVE_DECL_*_MAX` was falsely absent and
   `archive_read_support_format_rar5.c` failed on `#if UINT64_MAX`. A
   `(long long)(SYM)` cast works for both enums and macros.
4. The version fell back to a hardcoded `3.7.7` instead of reading
   `build/version`, which holds `3009000`.

## The two link problems after that

Getting the headers in place was not the end. Synchronet's build system never
emits a `-l` flag for either libarchive or curses:

- **curses.** `src/conio/curs_cio.c` uses `wint_t`, `cchar_t`, `mvin_wch` and
  `getcchar` but never includes `<wchar.h>`; it relies on `curses.h` pulling it
  in, which only happens for a **wide-character** ncurses. Rebuilding ncurses
  with `--enable-widec` is necessary but not sufficient: `make install` does not
  install `include/ncurses_cfg.h`, the generated header that sets
  `NCURSES_WIDECHAR 1`, so the installed `ncurses.h` silently falls back to
  `#define NCURSES_WIDECHAR 0`. Compiling with `-DNCURSES_WIDECHAR` fixes it.
  `libncursesw.so` then has to be reachable as `libncurses.so`.
- **libarchive.** Nothing in `build/` or `src/sbbs3/` adds `-larchive`. The
  trailing-library variable is assembled in a way that is not overridable from
  the environment, and link order genuinely matters — measured, not assumed:

  ```
  lib-before-object: FAILS: undefined reference to `archive_read_new'
  lib-after-object:  LINKS OK
  ```

  That holds for shared libraries too, so `-larchive` in `LDFLAGS` cannot work:
  `LDFLAGS` is expanded early in the link line. A compiler wrapper that appends
  `-larchive -lncursesw -lz` to link invocations only (detected by the absence
  of `-c`/`-S`/`-E`) resolves it without patching upstream. It has to wrap
  `g++` and `c++` as well as `cc` and `gcc`, because `libsbbs.so` is linked by
  the C++ driver.

## What is not verified

`jsexec` links and starts, but it aborts before running anything:

```
!ERROR changing directory to: /sbbs/ctrl
!ERROR loading configuration files: ... opening /sbbs/ctrl/main.ini
```

It needs an initialised Synchronet control directory. So SpiderMonkey compiling
is confirmed; **SpiderMonkey executing JavaScript is not**. Nor has any binary
been run against a real BBS instance — no `sbbs.ini`, no message base, no node
started.

## uClinux on the XPort Pro

The instinct is a good one and the architecture is right: the XPort Pro's CPU
is a **Freescale 32-bit ColdFire**, and ColdFire is the classic uClinux target
— uClinux originated on MMU-less 68k/ColdFire parts.

But the software does not fit, and the reason is worth being precise about.
The XPort Pro carries **8 or 16 MB of SDRAM and 16 MB of flash**.

- **Synchronet cannot run there.** It links SpiderMonkey (a full JavaScript
  engine), cryptlib, and pthreads using robust mutexes, and it expects a real
  POSIX filesystem and `fork()`. uClinux on an MMU-less ColdFire has no `fork`
  at all — only `vfork` — and no virtual memory to give a JS engine.
- **Mystic BBS cannot run there.** It is DOS software, which means DOSemu2,
  which needs an MMU.
- **The XPort's firmware is Lantronix's.** Both the bootloader and the flash
  layout are theirs; the module ships running Evolution OS or Lantronix Linux,
  and replacing either is a question for Lantronix rather than something a
  cross-compiler settles.

What *would* fit on 8 MB of ColdFire uClinux is a small single-process BBS in
C — a few hundred kilobytes, no scripting engine, no fork. `telnetbbs.py` from
the previous document is close in shape but not in weight: CPython is far too
large for that target. Porting it to C is a real and tractable project, and it
is the honest answer to "a BBS on the XPort Pro".

## Reproducing this

```sh
# 1. dependencies that do build
git clone --depth 1 https://github.com/madler/zlib.git && cd zlib
./configure --prefix=/usr/local && make -j4 && make install && cd ..

# ncurses must be widec, or curs_cio.c will not see wint_t/cchar_t
git clone --depth 1 https://github.com/mirror/ncurses.git && cd ncurses
./configure --prefix=/usr/local --with-shared --without-debug --without-ada \
            --enable-widec --enable-ext-colors --enable-ext-mouse
make -j4 && make install && cd ..
for h in ncurses.h curses.h term.h ncurses_dll.h unctrl.h; do
  ln -sf /usr/local/include/ncursesw/$h /usr/local/include/$h
done
ln -sf libncursesw.so /usr/local/lib/libncurses.so

git clone --depth 1 --filter=blob:none --sparse https://github.com/mozilla/gecko-dev.git
cd gecko-dev && git sparse-checkout set nsprpub && cd nsprpub
./configure --prefix=/usr/local --enable-64bit && make -j4 && make install

# 2. libarchive - no autotools, so generate config.h from the CMake template
git clone --depth 1 https://github.com/libarchive/libarchive.git
python3 tools/build_libarchive_config.py      # writes generated-config.h
cp generated-config.h config.h
mkdir -p /tmp/la-obj
for f in libarchive/*.c; do
  gcc -w -c -O2 -fPIC -DHAVE_CONFIG_H -I. -Ilibarchive \
      -o "/tmp/la-obj/$(basename "$f" .c).o" "$f"
done                                          # 134 compiled, 0 failed
ar rcs /usr/local/lib/libarchive.a /tmp/la-obj/*.o
gcc -shared -o /usr/local/lib/libarchive.so /tmp/la-obj/*.o -lz
cp libarchive/archive.h libarchive/archive_entry.h /usr/local/include/

# 3. Synchronet. The wrapper appends -larchive/-lncursesw at the END of link
#    lines only; order matters and LDFLAGS is expanded too early to work.
mkdir -p /tmp/ccwrap
for n in cc gcc g++ c++; do
  printf '#!/bin/sh\nlink=1\nfor a in "$@"; do case "$a" in -c|-S|-E|-M|-MM) link=0;; esac; done\nif [ "$link" = 1 ]; then exec /usr/bin/%s "$@" -Wl,--no-as-needed -larchive -lncursesw -lz; fi\nexec /usr/bin/%s "$@"\n' "$n" "$n" > /tmp/ccwrap/$n
  chmod +x /tmp/ccwrap/$n
done
git clone --depth 1 https://github.com/SynchronetBBS/sbbs.git
export PATH=/tmp/ccwrap:/usr/local/bin:$PATH
export CFLAGS="-I/usr/local/include -DNCURSES_WIDECHAR"
export CXXFLAGS="$CFLAGS"
export LDFLAGS="-L/usr/local/lib -Wl,-rpath,/usr/local/lib"
make -C sbbs/src/sbbs3 -j4        # exit 0, 23 binaries
./sbbs/src/sbbs3/gcc.linux.x64.exe.debug/sbbs -v
```

Everything above lives under `/usr/local` and `/tmp`, neither of which persists
between sessions — the whole chain has to be rebuilt each time.

