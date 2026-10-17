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
| libarchive | `libarchive/libarchive` | **blocked** — see below |

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

## Where it stops

```
filedat.c:38:10: fatal error: archive.h: No such file or directory
make: *** [.../Common.gmake:712: gcc.linux.x64.obj.debug-mt/filedat.o] Error 1
```

libarchive is not optional. `src/sbbs3/filedat.c` includes `<archive.h>`
unconditionally, with no `#ifdef` around it, and calls **38 distinct
libarchive functions** spanning the read, write, entry, filter and format APIs
— `archive_read_open_filename`, `archive_write_set_format_7zip`,
`archive_entry_copy_pathname`, and so on. Stubbing the header would only move
the failure to link time, and faking 38 functions would produce a BBS with a
silently broken file database.

Every route to a real libarchive is closed here:

- **The git repo has no generated `configure`**, only `build/autogen.sh`, which
  needs autoconf.
- **autoconf cannot be bootstrapped**: `autoconf`, `automake`, `libtool`, `meson`,
  `ninja` and `cmake` are all absent, and `m4` does not exist anywhere on the
  filesystem. The GitHub mirrors of autoconf and automake do not ship a
  prebuilt `configure` either.
- **Release tarballs do ship a generated `configure`, but they are
  unreachable**: `github.com/.../releases/download/...` returns HTTP 302 to
  `release-assets.githubusercontent.com`, which fails with
  `SSL_ERROR_SYSCALL`. Only `github.com`, `codeload.github.com`,
  `api.github.com`, `registry.npmjs.org`, `pypi.org` and
  `files.pythonhosted.org` resolve from this sandbox.

On a normal Debian or Ubuntu host none of this applies — the prerequisites are
one line, as recorded in the earlier document.

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

git clone --depth 1 https://github.com/mirror/ncurses.git && cd ncurses
./configure --prefix=/usr/local --with-shared --without-debug --without-ada
make -j4 && make install && cd ..
for h in ncurses.h curses.h term.h ncurses_dll.h unctrl.h; do
  ln -sf /usr/local/include/ncurses/$h /usr/local/include/$h
done

git clone --depth 1 --filter=blob:none --sparse https://github.com/mozilla/gecko-dev.git
cd gecko-dev && git sparse-checkout set nsprpub && cd nsprpub
./configure --prefix=/usr/local --enable-64bit && make -j4 && make install

# 2. libarchive - blocked without autotools or a reachable release tarball

# 3. Synchronet
git clone --depth 1 https://github.com/SynchronetBBS/sbbs.git
export CFLAGS="-I/usr/local/include" CXXFLAGS="$CFLAGS"
export LDFLAGS="-L/usr/local/lib -Wl,-rpath,/usr/local/lib"
make -C sbbs/src/sbbs3 -j4        # stops at filedat.c: archive.h
```
