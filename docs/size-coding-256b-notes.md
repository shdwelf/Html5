# Size coding: 256b.com, the demoscene's smallest category, and what it means here

Research date: 2026-10-18.

## What was asked

Investigate `256b.com`, search archive.org for something "like Dino but small",
and continue researching. This document records what was found, what could not
be reached, and the one thing that was actually built as a result
(`public/apps/tiny-dino/index.html`, 4,171 bytes, logic in
`js/tiny-dino-model.js`).

## 256b.com

`256b.com` is the short name for the archive at
`http://256bytes.untergrund.net/` — self-described as *"the 256bytes demos
archive | featuring news and demoscene productions of 256 bytes maximum on all
platforms."* Its `/demo/latest` index lists productions across every platform,
not just PC: entries in the current list include *Purple*, *Incircle*,
*superhero*, *melo.tic*, *Relaxation Exercise - 128DSP1B*, *Alblur*, *Pokemon*,
*HighTower*, *linenoise*, *mini*, *27bytes*, *0x20*, *invitronic*, *zork*,
*mondrotation*, *A Warm Place*, *94 bytes*, *Fish*, *Jupiler*, *Desert
Fractal*, *kernel*, *circle*.

**Reachability caveat, stated plainly:** neither `256b.com` nor
`256bytes.untergrund.net/demo/latest` could be fetched from this sandbox
(HTTP 500 and a connection failure respectively). The titles above come from a
search index, not from reading the site directly, so they are indicative of the
archive's contents rather than a verified current listing. Anyone acting on the
list should re-check it against the live site.

Related indexes worth knowing about:

- **`nanogems.demozoo.org`** — a curated "best of" maintained by demosceners,
  broken into size categories: `#256_byte_intros`, and down through 128, 64, 32,
  16 and 8 bytes. This is the better starting point than the raw archive,
  because it is filtered.
- **`wod.untergrund.net`** — World Of Demos, a much larger cross-platform index
  where a production titled *Dino* appears alongside 256b compo entries.
- **`demozoo.org`** — the general demoscene database.

## "Like Dino but small"

Two distinct things answer to that description, and they are worth separating
because they are different kinds of object:

1. **`chrome://dino`** — the Chrome offline dinosaur endless-runner. It turns up
   in size-coding discussions as a joke entry: a "13-byte demo" that runs in a
   browser, because the entire payload is the URL. This is the reading that
   matches an *Html5* repository, and it is the one acted on below.
2. **A production titled *Dino*** listed on World Of Demos. This is a real
   demo, but nothing in the reachable sources ties it to the 256-byte category
   specifically, so treating it as the reference would be a guess.

## The archive.org reference

The strongest archive.org hit is **`archive.org/details/a-mind-is-born`**:
*A Mind Is Born* by Linus Åkesson (lft), a **256-byte** Commodore 64 intro,
published 2017-04-14, item size 2.5 MB (the recording and sidecar files, not the
program), licensed **CC BY-NC-SA 4.0**. Submitted to the Oldskool 4K Intro compo
at Revision 2017 in the absence of an actual 256-byte compo, where it placed
first. Åkesson publishes a full technical breakdown at
`linusakesson.net/scene/a-mind-is-born/`.

### Why that write-up is the useful part

The techniques are the transferable content, and they are all about making the
existing hardware do work that would otherwise cost bytes:

- **A 60 Hz timer interrupt drives everything.** The interrupt handler plays the
  music; the visuals run in main context. One timing source, no scheduler.
- **The SID register shadow buffer doubles as state.** All 25 bytes are copied
  into `$d400–$d418` at the end of each interrupt. Two of those bytes are a
  16-bit *global clock* incremented by two per interrupt — the low byte is the
  position within a bar, the high byte the bar number (range `$00–$40`, 64 bars
  total). Because they live in the SID shadow, the low byte automatically
  modulates pulse width and animates a palette entry, and the high byte drives
  the filter cutoff for a slow sweep. State and output are the same bytes.
- **A five-byte palette sits at fixed file offsets**, so the file *is* the data.
- **The "script" is a poke table** — eight entries as byte pairs (zero-page
  target address, value), applied in time with the kick drums, each lasting
  eight bars. No sequencing logic beyond an index.
- **The melody is an LFSR, not a stored tune.** Deterministic enough to sound
  musical, but it costs bytes proportional to the register width rather than the
  song length.
- **The bass pitch table hides the MSB in the two low bits** of each entry, then
  masks them off to recover the high byte. Slightly detunes the bass; accepted
  to save a byte.
- **An illegal 6510 opcode (`sre`) is used deliberately** to save one byte in
  the LFSR, which is written backwards — load the constant first, shift and XOR,
  write back only when a one was shifted out.
- **The ending jumps through the system reset vector.** At bar `$40` the program
  turns off the display and resets; the final moments are the C64's own boot
  sequence returning to the BASIC prompt. The last part of the demo is free.

The general lesson, and the one that applies to the barcode voucher and the
cfjvm work in this repository: **when the budget is the constraint, the wins
come from making one structure serve two purposes**, not from writing tighter
code.

### Other data points found

- A **16-byte** x86 real-mode intro by DESiRE (reported 2026-05) does the same
  trick — pumping soundtrack plus visuals — two orders of magnitude below 256.
- *Endbot* / "A whole boss fight in 256 bytes" is a recent HTML-file example of
  the same category on the web platform.
- `github.com/balrogsoft/Intro256bytes_Amiga` — a 256-byte Amiga 500 (KS 1.3)
  skeleton leaving 164 bytes free for your effect. Useful as a structural
  template.
- Community summary of the size-coding toolkit: self-modifying code, jumping
  into the middle of BIOS or video ROM routines, using code as data and vice
  versa, tiny runtime unpackers, and pregenerated buffers written in one order
  and read in another.

## What was built

`public/apps/tiny-dino/index.html` — a single-file endless runner, **4,171
bytes**, with the game logic in `js/tiny-dino-model.js`.

Design decisions, and the reasons:

- **The logic is a module the page imports, not an inlined copy.** A test
  (`tests/tiny-dino.test.mjs`) asserts both that the page imports `STEP` from the
  shared module and that it does *not* re-declare the physics constants.
  Inlining would have meant the browser and the test suite running different
  numbers — the exact failure mode that makes a "verified" demo broken on
  screen.
- **Fixed timestep with an accumulator.** The simulation rate is decoupled from
  the display rate, so the physics under test is the physics that runs.
- **The byte budget is asserted, not advertised.** The test fails if the file
  grows past 8 KiB, so growth has to be a decision.
- **Determinism from a seeded LCG.** Two states with the same seed must produce
  identical obstacle streams; this is what makes a scoring assertion meaningful.
- **Autoplay is tested for survival, not just score.** A test that only checked
  "the score goes up" would pass on a game where every obstacle is unavoidable.
  Autoplay has to survive at least 4 of 8 seeds.
- **Ducking was removed rather than left in.** It was implemented, and the
  computed duck height was never read — a ground obstacle cannot be ducked
  under, so the input could never have done anything. A feature that looks
  present and silently does nothing is worse than no feature; the comment in the
  collision function records why it is absent.

Run it: `python3 -m http.server` from the repository root, then
`/public/apps/tiny-dino/index.html`. The module must be served with a
JavaScript MIME type or the import fails silently in some browsers.

## What was not done

- The live 256b.com index could not be read from here, so the production list
  above is second-hand.
- No archive.org item was downloaded; `archive.org` is not in this sandbox's
  outbound allowlist. The *A Mind Is Born* facts come from search results and
  the author's own write-up.
- Nothing here is a 256-byte production. 4,171 bytes of HTML plus a 5.5 KB model
  is a different exercise: the constraint applied was "small, measured, and
  tested", not "minimal at any cost". Claiming otherwise would overstate it.
