# CASEFILES · 4DWM

`casefiles.html` is the static-analysis lab for the 1998 **kr0me corp** Tripod library
and the 1996 **Rodger Ramrod** DOS4GW package: Wayback CDX recovery behind a SHA-1
gate, `fflate` unzip in memory, SLEIGH x86 16/32 from the CyberChef recipe corpus, and
the Ghidra decompiler as WebAssembly. It had no 4Dwm view. Now it has one, and the
`.xdc` it ships in is a real webxdc container.

Two things changed. The lab gained a plate, and the package gained a format.

## The plate

`js/casefiles-4dwm.js` (CSS in `css/casefiles-4dwm.css`) mounts a 2D canvas inside the
`4DWM` tab — no WebGL, `three`, or `OrbitControls`, the same constraint
`js/project-y-4dwm.js` ships under, and the reason the 4dwm family opens on an offline
host. Two fields share one camera, one projection, one painter:

| Plate | Rows | Height unit | Drawn from |
| --- | --- | --- | --- |
| **SHELF · captures** | one column per index row, one lane per capture kind (`.html` `.htm` `.gif` `.swf` `.mid` `.exe` …, `UNRECOVERED` last) | `log2(1 + bytes) / 23` → 8 MiB is exactly one unit | `js/krome-catalog.js`'s pinned library |
| **BYTES · this file** | one column per 8-byte-aligned window, one row per bit plane (LSB at the front) | set-bit fraction of that plane in that window | whatever artifact the lab has on the table |

Each surface is a binned grid, 1-2-1 smoothed along the grid, painted ridge by ridge
back-to-front — the same painter's algorithm as the planet and site viewers, so byte
relief reads as terrain rather than as a heatmap. On the shelf plate the floor is *not*
copied from the columns: it is the corpus's log-bytes share per bin, smoothed, marked
`interpolated: true` and disclosed by the legend as "no capture lands in this bin".
Never-captured titles are real records, so they stand in the `UNRECOVERED` lane at
zero height with a hollow pip at the site's nominal end year; the floor still counts
them, because an absent file was once some size.

Colour on the bytes plate is honest data, not decoration: green below 6 bits, amber to
7.2, red above — Shannon entropy per cell, so the high-entropy regions (packed or
encrypted) climb out of the text in front of you. `js/makint.js` is imported for its
`analyze()` and the marker faces only cite what the lab *actually recovered*
(`state.recovered`), never anything the byte math cannot see.

## The fourth axis

Time is the 4th dimension, and on this plate it is the x axis itself. Capture timestamps
in the catalog are **pinned data, not fetched** — `js/krome-catalog.js` is a plain ES
module with no DOM access so the theater, the browser page, the single-file build and
the test suite all read one copy. The slider picks a year; columns rise as their year
arrives, and a column whose capture falls outside the window goes to zero height and
loses its pip, because a shelf that keeps showing what has not happened yet is a
different chart than the one being claimed. **ALL TIME** drops the filter, keeps the
peaks, and says so in the status line; `◀ ▶` step a year; `SPIN` orbits.
`prefers-reduced-motion` mutes the easing, the auto-orbit, and autoplay — it does not
disable the time axis, which is the exhibit.

The window filter is a pure function, `columnsUpTo(columns, asOf, endYear)`, so the year
math is testable without a canvas at all.

## Evidence tiers, and what the plate refuses to claim

A bar in a 4Dwm plate looks like a measurement, so the record rides on it:
`INFERRED` / `INDEXED` / `CLAIMED` — a pinned catalog row, a name whose size and date
come from a Wayback index record, and a page-level recollection from a secondary write-up.
Each tier gets a colour and a shape: **filled diamond** = a capture whose fetched bytes
recomputed to the pinned SHA-1, **hollow diamond** = catalog row, not fetched,
**square** = third-party recollection. Pips come only from `state.verified`, so the
filled ones appear exactly when the hash gate passes.

The plate will not present an interpolation as a measurement (the floor is labelled),
and the export will not present itself as survey data:

```js
import { fieldToVrml, corpusFor, buildShelfField } from "./js/casefiles-4dwm.js";
const corpus = corpusFor("krome", { verified: new Set(["20000101_big.html"]) });
saveVrml(fieldToVrml(buildShelfField(corpus), { caseId: "krome", corpusLabel: corpus.label }));
```

`fieldToVrml` is its own writer rather than `demToVrml` from `js/vrml-export.js`, because
that one stamps every header with "elevations are metres above the WGS84 ellipsoid from
the USGS 3DEP ... DEM" — a provenance line that is true of a DEM and false of a log-byte
field. The 4Dwm header vocabulary is kept (grid, units, interpolation disclosure, the
time-window line, `# CAPTURE CORPUS · <tier> · <case>` per point); the
`NOT a survey product` line is added.

## The desk

`js/wm4d.js` cannot be imported here: its `#wm4d-layer` root is not in this page, and a
second window manager on a page that already scrolls through dossier tabs is not a
small request. So the collapse / iconify / restore / tile semantics are wired directly
in `css/casefiles-4dwm.css`, with the 4Dwm skin from `css/project-y-4dwm.css`: collapse
hides the plate body so the header carries the status line, iconify shrinks it to a tray
button that restores on click, and **DESK** opens three real `wm4d` windows — LEGEND,
TIMELINE, RECORD — that raise, drag and pin. `4Dwm/Terminal` comes back with the captured
field as shell text, `4Dwm/File Manager` spawns a pip per capture on the plate, and
`4Dwm/Help` prints the honest limits in the status line.

## The container

`casefiles.xdc` **was not a webxdc container.** It was 5.77 MB of files delimited by NUL
bytes with a `manifest.json` inside, which no spec-compliant host opens; its own builder
knew ("the container is a custom NUL-delimited archive, not a ZIP ... documented, not
hidden"). It is now a deflated ZIP rooted at `index.html`, with `manifest.toml`
(`name` + `source_code_url`, the pair the sibling packagers write, plus a
`description` line a host can show), `webxdc.js` (the same cooperative
multiplayer shim every sibling drops in), `icon.png` and the `img/app-*.png`
icons the page's manifest link asks for — the layout
`scripts/build-ingress-intel-xdc.mjs` and its neighbours produce.

| | before | after |
| --- | --- | --- |
| container | NUL-delimited pseudo-archive | deflated ZIP, 55 entries |
| manifest | `manifest.json` | `manifest.toml` |
| size | 5,771,983 B | 2,541,336 B |
| entry point | `casefiles.html` | `index.html` |
| module style | ES modules + `import.meta.url` | the same modules, unchanged |

The module graph is shipped as-is instead of inlined: `js/ghidra-wasm.js` resolves
`new URL("../wasm/ghidra/", import.meta.url)`, so placing the modules at `js/` with the
31 `wasm/ghidra/` files at the archive root puts the engine exactly where it looks, with
one fewer build-only file to keep fresh. Two real adjustments were needed:

- `index.html` gains `<script src="./webxdc.js"></script>` before the module tag.
- `vendor/fflate/index.mjs` loses its two-line `import { createRequire } from "module"`
  preamble, which is node-only and throws at evaluation in a host where bare specifiers
  do not resolve. Its `nodejs-utils` comment block is a comment, so it is inert.

## Build and verify

```bash
npm run build:casefiles      # inliner, then the packer (also writes dist/casefiles.xdc)
npm run check:casefiles      # both derived artifacts must still match their sources
node tools/smoke_casefiles_bundle.mjs
node --test tests/casefiles-4dwm.test.mjs
node tools/serve.mjs 8099 &  node tools/verify_casefiles.mjs 8099   # real wasm, offline
```

`tools/build_casefiles.mjs` was rewritten in the middle: `casefiles-inlined.html` was
generated as *two* files (a JSON container, then an HTML document reading
`document.currentScript.previousElementSibling.textContent`) because a `<script>` body
may not contain `</script>` and a base64 blob inside an HTML file deflates badly. It now
replaces only the page's `./js/*.js` and `./css/*.css` references — the same closure the
`.xdc` ships, with the fflate preamble stripped — plus a `window.__CASEFILES_ASSETS__`
map for the 31 wasm files and `demo.exe`, which `js/ghidra-wasm.js` reads *before* it
falls back to network fetches. So the single-file build and the archive share one
content-identical JS closure instead of diverging in how bytes arrive. The inliner keeps
`</script` escaping, per-module syntax checks, a duplicate-top-level-name check across
the concatenated modules, and a self-verification pass; both derived files are generated
and must never be hand-edited.

The theater is now one bundle module, which means it is also a flat scope: a
module-scope `const $` once collided with the controller's `$`, and the flat build parsed
cleanly while the browser would have thrown. That failure mode is now checked at build
time by `topLevelNames()`, and the smoke script imports the theater directly to assert
the two definitions coexist in the graph.

Because `casefiles.html` is also a SITE-K page, `tools/pack_xdc.sh` now copies `demo.exe`
as well — the 63-byte MZ that makes the BYTES plate checkable with no network at all.

## Files

| File | Role |
| --- | --- |
| `js/casefiles-4dwm.js` | the plate: two field builders, the timeline filter, the relief painter, the pips, the VRML writer |
| `css/casefiles-4dwm.css` | the collapse / iconify / desk state for `#tab-theater` |
| `js/krome-catalog.js` | the pinned library, split out of the controller so the plate and the tests read one copy |
| `casefiles.html` | the `4DWM` tab, the canvas, the label/pip layers, the control strip, the 4Dwm desk tray |
| `js/casefiles.js` | `ensureTheater()` / `tellTheater()` around every state transition |
| `scripts/build-casefiles-xdc.mjs` | the packager: ZIP, `manifest.toml`, shim, icons, deterministic mtimes |
| `tools/build_casefiles.mjs` | the single-file inliner, now carrying the theater |
| `tests/casefiles-4dwm.test.mjs` | field math, the 4th-axis semantics, tier counts, the markup contract, a headless render, the archive boundary |

## Limits

The catalog pins 199 captures with sizes and 12 titles that were never captured; a
`year` on a row is a *capture* year from a Wayback timestamp, not a publish date, and a
bin with no capture in it is labelled interpolated rather than measured. `demo.exe`,
`makint.js` and the `*.wrv` parts on the bytes plate are bytes the lab generated or
picked up locally — the plate draws them as faithfully as a fetched archive and never
claims one. The renderer is a canvas painter: 60 fps at the sizes this page uses, no
depth buffer, and a hit test against projected anchors instead of a raycaster.
