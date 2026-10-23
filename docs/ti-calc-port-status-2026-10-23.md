# TI-calc port status & the socal-subsurface question (T8.2) — 2026-10-23

## The port engine is proven, today, in this sandbox
The repo's calculator line is SITE-K: one integer-only C core
(`calc/core/*.c` — no libc, no float, no malloc) compiled by sdcc for the
Z80 models, TIGCC/GCC4TI for the 68k models, gcc for the host, and
transpiled to JS for the browser. Re-verified 2026-10-23:

- `make -C calc test` — **all green**: host self-test; C/JS differential
  test identical across **6 device profiles** (every scalar and every
  frame hash, 30 lines each); `ti_pack.py` container selftest producing
  valid `.8xp` / `.85s` / `.89z` / `.9xz` packages with correct checksums
  (590-byte TI-83 program, body 514 B).
- The browser copy (`js/calc-core.js`) is generated from the same C, so
  the web preview *is* the port, not a re-implementation.

What the sandbox cannot do: sdcc and tigcc are not installed, so real
device binaries of non-trivial code are a toolchain-fetch (runner) job.
The Makefile's rule stands: missing toolchains are reported and skipped,
never faked.

## Why socal-subsurface itself will never run on a TI-83
The ask names socal-subsurface as the first xdc→TI candidate. Measured:

| | socal-subsurface (inlined) | TI-83+/84+ |
| --- | --- | --- |
| Program size | **862,916 B** single HTML (389,401 B as `.xdc`) | 24 KB user RAM total |
| Rendering | WebGL (THREE.js), float DEM grids | 96×64 monochrome LCD |
| Data | 1.4 MB app tree (DEM, wells, faults) | framebuffer is 768 B (96×64×1 bit) |

The app alone is ~36× the calculator's entire user RAM, before data,
and its renderer assumes floats and a GPU pipeline the Z80 does not
have. A "port" that kept the name and dropped the subsurface would be a
fake; the backlog does not ship fakes.

## The honest TI expression (defined, not yet built)
SITE-K already solved this shape of problem once: the 15 KB BIP-39
wordlist deliberately stays in the web app while the calculator carries
indices and real checksum maths. The same pattern fits a *subsurface
sketch*:

- a new screen set in `calc/core` reusing the existing 8×8 sector grid
  (`grid.c`): sectors light up where the reduced dataset has wells or
  fault crossings; depth shown as the framebuffer's dither levels;
- the dataset is a few dozen cited points (the viewer's published
  Southern California wells/faults, decimated to sector resolution),
  compiled to C tables by a `gen_tables.py`-style generator, budget a
  few KB — the same order as the existing font/sin tables;
- five device targets come free from the existing pipeline; host +
  differential tests gate it exactly like SITE-K.

That is a new core feature measured in days, not a conversion; it is
recorded here as the defined follow-on rather than started silently.

## Android / F-Droid strand
Unchanged blockers: no Android SDK/Gradle in the sandbox. The standard
route (WebView wrapper around the inlined app, F-Droid metadata,
reproducible-build flags) is runner work; the Java-server side of T8.2
already shipped as Tomcat WARs (`tools/build_xdc_wars.mjs`).

## Bottom line for T8.2
TI engine: **proven end-to-end except device compilation** (toolchain
fetch). socal-subsurface full port: **ruled out with numbers**. Defined
follow-ons: (1) SUBSURF sketch screens in the SITE-K pattern, (2) sdcc
toolchain via runner to cut real `.8xp` binaries, (3) F-Droid wrapper
via runner. T8.2 stays open on those three.
