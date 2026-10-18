# BBS viewer, netcat capture, and why Wildcat! and Telegard are treated differently

Research and build date: 2026-10-18.

## What was searched

GitHub, by stars, for the three tools named:

**netcat** — `nmap/nmap` (13,809★, C, contains Ncat), `vi/websocat` (8,722★, Rust, MIT),
`tailscale/tailcat` (8,405★, Go, BSD-3), `binaricat/Netcatty` (6,648★, TypeScript, GPL-3),
`cytopia/pwncat` (1,961★, Shell, MIT).

**OpenSSH** — `openssh/openssh-portable` (4,047★, C, no SPDX licence declared),
`PowerShell/Win32-OpenSSH` (8,319★), `trzsz/trzsz-ssh` (2,759★, Go, MIT),
`xxh/xxh` (6,113★, Python, BSD-2).

**PuTTY** — the canonical PuTTY lives at `git.tartarus.org`, not GitHub; the
GitHub-hosted derivatives are `cyd01/KiTTY` (1,827★, C, PuTTY fork),
`jimradford/superputty` (2,056★, C#, MIT) and `chaterm/Chaterm` (3,096★, TypeScript).

What is present in this sandbox: `nc`/`netcat`, `ssh`, `socat`. Absent: `telnet`,
`ncat`, `putty`.

## Why a viewer rather than a client

A live connection is not possible here. DNS for arbitrary hosts fails
(`bbs.example.com: No address associated with hostname`) and the outbound
allowlist does not include any BBS. So the viewer is built around **captures**:
a byte stream recorded from a real session, rendered after the fact.

That is also the more useful artefact. A capture is stable, so the renderer can
be tested against exact expected output — which a live session, with its timing
and negotiation, cannot be.

Loopback *does* work, so the capture path itself is exercised for real:
`tools/bbs/wildcat-banner.mjs` serves a Wildcat!-flavoured screen on 127.0.0.1
and `tests/bbs-viewer.test.mjs` captures it with the same `nc` that would be
pointed at a real system. 392 bytes on the wire, 308 characters rendered, 11 CSI
sequences parsed. Only the destination is local.

## Capturing from a real BBS

```sh
# telnet BBS — the common case. -q1 waits a second after EOF so the banner lands.
nc -q1 bbs.example.net 23 > capture.ans

# SSH-only BBS. -tt forces a pty so the server sends its full ANSI screen.
ssh -tt user@bbs.example.net | tee capture.ans

# PuTTY has no capture flag; use its session logging (Session -> Logging ->
# "Printable output"), which records the byte stream including escapes.
```

The viewer accepts a pasted capture or a dropped `.ans` file. `\xNN` and `\e`
escapes in pasted text are honoured, since most captures get mangled by a text
editor before they reach a browser.

## Wildcat! and Telegard are not interchangeable

The preference for Wildcat! is recorded and the sample screen is modelled on its
v4/v5 main-menu shape. But the two systems differ in a way that matters for what
can be reused:

| | archive.org item | Licence | Reusable as |
| --- | --- | --- | --- |
| **Telegard** | `telegard`, 1999 | **CC Public Domain Mark 1.0** | structure *and* code |
| **Wildcat!** | `WILDCATGOLD` 1992, `mustang-software-wildcat-4.11` 1995, `wildcat5` 1996, `Wildcat_Elite_BBS_1998_04_01` 1998 | **none stated** | structure only |

Wildcat! was commercial software from Mustang Software. No item in the
archive.org result set carries a licence granting reuse, and "abandonware"
describes availability, not permission — the copyright did not lapse.

So: **Wildcat! is the favoured design reference; Telegard is the one whose code
may actually be consulted.** The banner in `tools/bbs/wildcat-banner.mjs` is an
imitation of a menu layout, written from scratch, containing no Mustang Software
text, art, or code. That is deliberate and should stay that way.

## Ghidra and the Telegard server: two independent blockers

Both were checked this session rather than assumed.

1. **Ghidra cannot run in this sandbox.** No `ghidra` or `analyzeHeadless` on
   PATH; the vendored `wasm/ghidra/` decompiler ships only Atmel and x86
   processor specs; and JDK 21, which Ghidra 12.x requires, fails to start here
   with `Failed setting boot class path`.
2. **The Telegard binary cannot be downloaded.** `fetch_page` reaches
   archive.org for text, but the shell does not:
   `curl https://archive.org/download/telegard/telegard.zip` returns
   `SSL_ERROR_SYSCALL`, `http=000 bytes=0`. The sandbox allowlist is
   `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`,
   `pypi.org`, `files.pythonhosted.org`.

Even with both solved, Telegard is a DOS Pascal program, so the useful output
would be an MZ-image disassembly via the repo's existing
`tools/decompile_mz.mjs` path — the same route already used for
`INSTALL.COM`. That is a real option if a binary can be staged in; it is not
something this branch did.

## What was built

- **`js/ansi-model.js`** — an ANSI/VT100 screen model. 16-colour SGR, cursor
  movement, ED/EL, ICH/DCH, save/restore, CR/LF/BS/TAB, plus the full 128-entry
  **CP437 upper-half table**. Scope is stated in the file: no alternate screen
  buffer, no scroll regions, no truecolour, no mouse, no charset selection.
  Unsupported sequences are consumed and discarded, as a terminal does.
- **`public/apps/bbs-viewer/index.html`** — 3,680 bytes. Imports the model;
  holds no palette or CP437 table of its own, which a test enforces so the page
  cannot drift from the code under test.
- **`tools/bbs/wildcat-banner.mjs`** — the local BBS and the capture source.
- **`tests/bbs-viewer.test.mjs`** (11 tests) and **`tests/ansi-model.test.mjs`**
  (26 tests).

## Bugs this caught

Recorded because each produced plausible-looking wrong output:

1. **`toHtml` rendered plain text as blank.** The flush guard tested the current
   *style* instead of the *buffer*, so every run of unattributed text — most of
   a BBS screen — was discarded. Found by the XSS-escaping test, which is not
   what it was written to find.
2. **A line feed at the bottom row put the cursor on row 0.** `scrollUp` moves
   the cursor with the content, which is right for an explicit `SU` and wrong
   for a newline; the next line overwrote the one above.
3. **Box art came out as `TPQZ]`.** The banner used `"\u2554"` pushed through
   `Buffer.from(..., "binary")`, which keeps only the low byte. BBS art is CP437
   bytes, so the wire wants `0xC9`.
4. **The box borders were one column short** because the padding was counted by
   eye. Now computed, with a test asserting all four border rows are equal width.
5. **Three test expectations were wrong, not the model** — `plainText` keeps all
   25 rows so trailing newlines are expected; ED 1 is inclusive of the cursor
   cell; and `onerror=` as escaped *text* is not an injection, so that assertion
   was replaced with the precise one (after this renderer's own tags are
   removed, no `<` survives).

## What was not done

- **No live BBS was contacted.** Not possible from here, and no attempt was made
  to work around it.
- **No Ghidra run and no Telegard binary.** Both blockers above.
- **No Wildcat! asset was copied.** The sample screen is an original imitation of
  a menu layout.
- SSH and PuTTY are documented as capture methods but were not exercised: there
  is no server here to capture from, and claiming otherwise would be a guess.
