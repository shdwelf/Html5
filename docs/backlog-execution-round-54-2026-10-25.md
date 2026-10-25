# Backlog execution round 54 — 2026-10-25

**Branch:** `arena/cf41000d-html5` · **Scope:** every subsurface viewer proven
fully functional over its described area; S4 (country/planet) backlog finished
honestly; pull request.

## Parallel-session reconciliation (why this is round 54)

Round 51 was claimed first on main by PR #159 (`arena/a3bce79b-html5`,
KeyViewer/hash-lab/country batch-3 round), which also shipped the same
`gazClassesHost` TDZ diagnosis for the city engine and **deleted** the
Georgia frame as a stale orphan. This branch was cut for the explicit
request to *fix all the subsurface viewers and see them fully functional*,
so after merging main it restores and repairs Georgia (data-city + preload +
app-dir sync + 134-entry zip) instead of deleting it, adds the 65-route
real-Chromium sweep as the permanent proof, closes the S4 country/planet
records, and repairs the greeran items the newly-runnable browser tests
exposed. The duplicate TDZ fix from #159 is kept as-is (main's version wins
in `js/city-subsurface.js`; this round's rebuilds simply re-verify the
bundles carry it).

A second renumber happened at PR #160 merge time:
a parallel session also wrote a round-52 record (Playwright 1.64
disassembly + JavaScript conversion, PR #162), which landed on main
first and owns `backlog-execution-round-52-2026-10-25.md`, so this
record became round 54 (next free number).

## 1. Subsurface fleet audit and fixes

Static audit first: all 62 root `*-subsurface.html` pages (58 city keys,
Georgia, greeran, socal, socal-inlined) plus the packaged app entries were
script-checked for `data-city` keys against `resources/city-subsurface/cities.json`
(58 keys), preload script presence and engine-before-preload ordering. One
root page failed: **Georgia-subsurface.html** used `data-city="Georgia"` and
shipped no `js/city-frame-preload-georgia.js`.

### Georgia frame repaired

- Root page and `public/apps/Georgia-subsurface/index.html` now declare
  `data-city="georgia"` with the preload inserted before the engine.
- The legacy `public/apps/Georgia-subsurface/` directory was 35 files behind
  the working `public/apps/georgia-subsurface/` build (stale engine included);
  the full app tree was re-synced from the fresh build, keeping only the
  index/manifest/icon trio.
- `Georgia-subsurface.xdc` rebuilt: 134 entries, level 9, fixed mtime
  2026-10-07, index assertions (georgia + preload) verified.

### City engine boot-killer found and fixed (gazClassesHost TDZ)

Real-Chromium boot probing surfaced what every static check and the jsdom
probe could not: `js/city-subsurface.js` threw
`ReferenceError: Cannot access 'gazClassesHost' before initialization` on
**every city page**. The top-level gazetteer row population (`addGazEntry` →
`refreshGazClasses()`, line ~710) ran before the panel `const`s at line ~784.
The five gazetteer panel refs plus `gazState`/`gazClassToggles` are now
declared next to `gazRows`/`gazIdx`, above the population loop. Lawrence (and
then the fleet) boots to `ready · …` in under a second afterwards.

Because the engine ships inside every package, `npm run build:city-subsurface`
was re-run: all 58 city XDCs and all 58 app-dir engine copies now carry the
fix (59 XDCs changed including the legacy Georgia zip).

### Full-fleet browser sweep (permanent regression test)

New `tests/subsurface-viewers-browser.test.mjs`: boots **65 routes** — all 62
root pages plus `public/apps/Georgia-subsurface/index.html`,
`public/apps/socal-subsurface/index.html` and
`public/apps/greeran-subsurface/index.html` — in real Chromium
(`tests/lib-browser.mjs`, puppeteer-core + @sparticuz/chromium, optional
deps like the other Blink suites) and asserts per route:

- `#status` reaches `ready …` — except greeran, whose boot contract keeps the
  node-count line `/nodes · /` (the branch's interim ready line was reverted
  to main's tested behaviour), no page errors;
- no 404/failed requests except the documented optional
  `js/socal-dem-grid.js` probe (absent → shipped synthetic relief, disclosed
  in the demSource hint);
- no WebGL fallback, canvas sized, layer rows mounted;
- stage screenshot rasterises ≥ 200 lit pixels (the scene actually draws).

Result: **65/65 routes pass** (~5.8 min). The greeran app entry failed until
`npm run build:greeran-subsurface` refreshed its stale engine copy.

## 2. S4 close-out: country + planet backlog

- **Instrument honesty item finished.** The country viewer's Factbook note
  now states that the source pin carries **no national-instruments field**, so
  none is shown rather than a substituted value (the anthem already ships as
  Factbook title/credit text with the no-audio disclosure at
  `js/country-viewer.js`).
- **Records reconciled.** `docs/agent-backlog-2026-10-21.json` S4 moved
  `partial → done` with a round-52 `next_actions` entry backfilling what
  rounds 41–44 (country batches C1–C3, PC Globe stages 1–3 +
  `docs/pcglobe-ghidra-java-scope-2026-10-24.md`, planet viewer reuse of the
  Red October globe) never wrote to the JSON. The Markdown section header now
  reads *done* with a matching round-52 block after the round-49 note.
- **Stale next-actions retired:** "nine state frames remain" (atlas complete
  since rounds 38–40) and the California catalog line (La Casa Pacifica =
  Western White House and Oakville/Mondavi = vintner rows shipped in rounds
  15–16; ephemeral categories remain planned layers per `docs/city-subsurface.md`
  — no fabricated rows).
- Evidence before close-out: country/planet/pcglobe-java/12-globe-wasm tests
  green; anthem UI present; `instrument` has zero hits in Factbook data
  (hence disclosure, not fabrication).

## 3. Greeran viewer repairs (exposed by the optional browser deps)

Installing puppeteer-core/@sparticuz/chromium turned three long-skipped
greeran browser tests on; two product gaps and one packaging gap were fixed
without weakening any assertion:

1. **`greeran-book.html` intro spread** — the test expects
   `.intro-book-spread` / `.intro-book-object` structure; the markup had
   neither. The intro now wraps the flight/book in a viewport-sized spread
   box that re-declares the scene's `perspective: 1100px` (so 3-D rendering
   is unchanged) with a boxless `display: contents` object layer. Centred,
   on-screen geometry and backface asserts pass at both viewports.
2. **`buildGreeranGedcom()` page API** — the test calls a global builder;
   only the Node tool existed. `greeran-family-4dwm.html` now exposes
   `window.buildGreeranGedcom()` implementing the same appendText/appendEvent
   GEDCOM 5.5.1 contract against the embedded PEOPLE/FAMILIES arrays:
   CRLF lines, 2,089 sourced individuals (blank reference stubs are omitted
   in-page; the Node baseline keeps them in the `.ged` download — disclosed
   in the header NOTE), 588 families, ≤248-char lines, no LATI/LONG tags,
   trailing `0 TRLR\r\n`, and the required "No standalone source GEDCOM was
   available" provenance sentence. First insertion nested inside the main
   script and broke `sw`; the tag structure was repaired (3 balanced script
   blocks) before the rebuild.
3. **QR images moved to package-local SVG files** — the keepsake QRs were
   `data:image/svg+xml` URIs, which the offline test counts as non-local
   requests. `scripts/build-greeran-family-qr.mjs` now emits
   `assets/greeran/family-tree-qr.svg` and
   `assets/greeran/world-english-bible-epub-qr.svg` (same payloads, verify +
   `--write` modes preserved) and the XDC packs both files. The vitest
   package-manifest pin was extended with exactly those two entries —
   contract maintenance for an intentional packaging change; every other
   assertion in that test (2,090-INDI baseline `.ged` with the blank stub,
   588 FAM, entry bytes) is untouched and green.

## 4. Validation

- `npm test` **exit 0**: vitest 35 files / **307 pass**, node --test
  **861 tests — 854 pass, 0 fail, 7 skipped** (browser suites now execute:
  the 65-route sweep and the greeran tests replaced prior skips).
- Sweep run standalone also green (65/65, ~346 s).
- `node tools/greeran-family-export.mjs --check` still exit 0 (baseline `.ged`
  unchanged).
- Rebuilds re-run: `build:city-subsurface` (58 XDCs + app dirs),
  `build:greeran-family` (qr + 4dwm XDC), `build:greeran-subsurface`.

## Files touched (headline)

- `js/city-subsurface.js` — gazetteer panel refs hoisted above population.
- `tests/viewer-boot.test.mjs` — main's boot suite: its known-standalone
  allowlist now registers the repaired `Georgia` alias (contract maintenance).
- `js/country-viewer.js` — no-instrument-field disclosure.
- `Georgia-subsurface.html`, `public/apps/Georgia-subsurface/**`,
  `Georgia-subsurface.xdc`, `georgia-subsurface.xdc` + all city XDCs/app dirs
  (engine fix).
- `greeran-book.html`, `css/greeran-book.css` — intro spread structure.
- `greeran-family-4dwm.html`, `greeran-family-4dwm.xdc`,
  `scripts/build-greeran-family-qr.mjs`, `scripts/build-greeran-family-4dwm-xdc.mjs`,
  `assets/greeran/*-qr.svg` — GEDCOM page API + local QR assets.
- `tests/subsurface-viewers-browser.test.mjs` — new fleet sweep.
- `test/greeran-family-4dwm.test.ts` — manifest pin +2 QR entries.
- `docs/agent-backlog-2026-10-21.{json,md}` — S4 → done, round-51 entries.
