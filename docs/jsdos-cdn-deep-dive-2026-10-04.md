# js-dos delivery deep dive — 2026-10-04

## The reports

Five defects arrived together: Headline Harry breaks on boot ("dosgame.run
not found, jsdos didn't load"), the webxdc-dos emulator panel does not load,
Rodger Ramrod cannot boot, `cheyenne.xdc` "didn't load", and SoCal exhibits
were stale. Four of the five are real code defects in how we ship the js-dos
engine; one (Cheyenne) is host-side. All are addressed in this pass, plus the
Four Corners 4Dwm theater (the full socal-subsurface-style xdc) is merged
from the 2026-10-04 backup and shipped.

## js-dos API archaeology

We ship **two incompatible js-dos generations** and had mixed them up:

| | js-dos 6.22 (v6/v7 line) | js-dos 8.4.1 (v8, current) |
|---|---|---|
| boot | `Dos(el).run(url, main)` / `dosInstance.run()` | `Dos(el, { url, autoStart, pathPrefix, onEvent })` |
| engine config | `Dos.configure({ wdosboxUrl })` | `pathPrefix` option; engine self-locates |
| callbacks | `onready` / `onerror` | `onEvent` stream: `emu-ready`, `bnd-play`, `ci-ready`, `emu-error`, `bnd-error` |
| bundle format | plain ZIP of game files | ZIP **with `.jsdos/dosbox.conf`** (autoexec), else config editor |
| runtime files | `js-dos.js` + `wdosbox.js` (+ `wdosbox.wasm.js`) | + `emulators.js`, **`wlibzip.js`, `wlibzip.wasm`** |
| styles | injected by `js-dos.js` itself | injected by `js-dos.js` itself |

Three failure modes kept recurring:

1. **v7 call on a v8 engine.** `headline-harry.xdc` booted
   `Dos(container, opts)` then `dosInstance.run("roms/…")`. v8's `Dos()`
   returns a props object with no `.run()` → `TypeError` → the catch block
   shows "failed to start js-dos". This was the "dosgame.run not found"
   report.
2. **Incomplete engine set.** v8's `emulators.js` lazily fetches more files
   via `pathPrefix`: `wdosbox.js` for the core and — critically —
   `wlibzip.js`/`wlibzip.wasm` for bundle handling. `bundleConfig()` (the
   function that opens a `.jsdos` bundle to read `.jsdos/dosbox.conf`)
   `await`s `libzip()` **before** touching the bundle, with no JS fallback.
   A v8 boot without the wlibzip pair 404s one step after `Dos()` and dies
   with the same "jsdos didn't load" symptom. The `Build` manifest baked
   into `emulators.js` lists the full set; our archives shipped 5 of 7
   files.
3. **Root-absolute URLs.** `webxdc-dos` referenced `/js-dos/*` and
   `/roms/*`, and its vite build emitted `/assets/index-*.js`. A webxdc
   host serves the archive from an arbitrary origin path — every one of
   those 404s, and with them the whole module graph (buttons included).

## The dead CDN (Rodger)

`apps/rodger-ramrod.html` and `apps/Rodger_Ramrod_HTML5_Quine.html` loaded
the js-dos 6.22 runtime from `https://js-dos.com/6.22/current/…`:

- `js-dos.js` — Wayback CDX shows 200s up to ~2026-09, dead since; the
  domain no longer serves `/6.22/` assets.
- `js-dos.css` — **never existed**: zero archived 200s on any date. v6
  injects its own styles from `js-dos.js`; the separate css URL was always
  a 404.
- `wdosbox.js` — dead like the rest of the directory.

The boot code did `await Promise.all([scriptLoader(js), cssLoader(css)])`,
so the *optional* stylesheet 404 rejected the whole launch — the UI's baked
error string ("Unable to load …/js-dos.css") is literally this failure.

Fix: pin the **jsDelivr mirror of the npm package** — same directory layout
the dead path used to mirror, so the engine's own relative fetches
(`wdosbox.wasm.js` etc.) resolve unchanged:

- `https://cdn.jsdelivr.net/npm/js-dos@6.22.60/dist/js-dos.js`
- `https://cdn.jsdelivr.net/npm/js-dos@6.22.60/dist/wdosbox.js`

and demote the stylesheet to best-effort: `gy(css).catch(()=>{})` inside
the `Promise.all`. Regression: `tests/rodger-cdn.test.mjs` (no `js-dos.com`
reference, pinned jsDelivr URLs, non-fatal css) and the baked error string
no longer points users at a URL that cannot work.

## webxdc-dos (dos-binary-loader.xdc)

Full rework of the emulator panel on the v8 options API:

- relative engine refs (`./js-dos/…`) and `base: './'` in `vite.config.js`
  so the built chunk is `./assets/index-*.js`;
- complete 8.4.1 engine set under `public/js-dos/` (wlibzip pair added,
  sourced from the `js-dos@8.4.1` npm tarball);
- pre-built v8 bundles: `roms/DOSDEMO.jsdos` (autoexec `DEMO.COM`) and
  `roms/SNEAKERS.jsdos` (autoexec `RUN.BAT`), generated deterministically
  by `webxdc-dos/scripts/build-rom-bundles.mjs`;
- runtime wrapping for user-dropped files with bundled
  `vendor/fflate.mjs`: a dropped plain ZIP gets a generated
  `.jsdos/dosbox.conf` (launcher picked: `run/start/play/go/demo.bat`, then
  first `.com`, `.exe`, any `.bat`); a dropped bare COM/EXE is wrapped into
  a single-file bundle; a dropped `.jsdos` boots directly;
- the app is a module script, but the buttons used inline `onclick` —
  `loadDemo` etc. were module-scoped and every button threw
  `ReferenceError` ("loadDemo is not defined"). The UI functions are now
  exported to `window` (which also revives the SNEAKERS secrets hook that
  patches `window.loadFile`);
- `npm run xdc` now removes the old archive first — `zip -r` updates in
  place and had leaked stale hashed chunks from previous builds into the
  xdc.

## Headline Harry

Merged fix (v7→v8 options API, staged shell at
`public/apps/headline-harry/index.html`, repack via
`scripts/fix-headline-harry-xdc.mjs`) **plus the follow-up it needed**: the
repack script now carries an engine-completeness pass that splices any
missing 8.4.1 file from the vendored copy at
`webxdc-headline-harry/app/js-dos/` — which is where the genuine wlibzip
pair now lives. Result: 14 entries, 2,910,703 bytes, full engine, same game
bundle (`roms/headline-harry.jsdos` untouched). See
`docs/headline-harry-jsdos-fix-2026-10-04.md` for the original fix write-up.

## Cheyenne: not an archive defect

`cheyenne.xdc` is structurally sound and current (the gazetteer-sync
rebuild landed in this same pass):

- `tools/cheyenne-boot-smoke.mjs`: **BOOT-OK**, `init()` runs to completion
  under a stubbed DOM/WebGL; all 25 DOM ids resolve; the HTTP module graph
  closes; the archive mirrors the working tree.
- The xdc is byte-identical in architecture to `socal-subsurface.xdc`.

When it "doesn't load" for a user, the causes that survive scrutiny are
host-side:

1. **stale download** — an old copy (pre-webxdc.js injection, pre-gazetteer)
   keeps circulating; the current build's manifest/sha differ. Re-download
   from the repo, not from an old chat message.
2. **opening via `file://`** — module scripts and wasm are blocked from
   file:// origins in every mainstream browser; webxdc apps must be loaded
   by a webxdc host (ArcaneChat/Delta Chat) or an HTTP server
   (`tools/serve.mjs`).
3. **WebGL-less host** — the theater needs WebGL; the app degrades to an
   explicit boot-fail card rather than a blank screen, so "nothing loads"
   means the host stripped even that — check the host's CSP/console.

To make re-download the easy path, SITE-K now ships `cheyenne.html` (and
`four-corners.html`) with their full local dependency trees — see below.

## SoCal freshness + Four Corners theater

The stale-Socal report resolved as two things: the archives in the repo lag
the sources (fixed by rebuilding — `socal-subsurface.xdc` now includes the
gazetteer sync), and the **Four Corners exhibit was only half-merged**: a
flat single-page atlas existed (PR #90), while the full 4Dwm **theater** —
same architecture as `socal-subsurface.xdc` (root authoring sources
`four-corners.html` + `css/` + `js/`, deterministic staging into
`public/apps/four-corners/` with webxdc.js injection and vendored three.js,
built by `scripts/build-four-corners-xdc.mjs`) — lived only in the
2026-10-04 backup. It is merged now:

- `four-corners.xdc` — 336,087 B, 10 entries, deterministic rebuild is
  byte-identical to the merged artifact;
- the flat `public/apps/four-corners/*.js` staging from the atlas version
  is superseded (its research lives on in
  `docs/source-check-four-corners-2026-10-04.md` and git history);
- `tests/four-corners.test.mjs` (data integrity) plus a new archive test
  (currency + module-graph closure, mirroring the SoCal test);
- SITE-K ships the theater page and the Cheyenne page alongside the SoCal
  exhibit, and `tools/pack_xdc.sh` lists both HTML entry points explicitly
  so they cannot silently drop out of a future package.

## Verification matrix

| deliverable | check | result |
|---|---|---|
| `headline-harry.xdc` | engine set = vendored 8.4.1 set, v8 boot, no `.run(`, roms bundle autoexec | pass (tests) |
| `webxdc-dos/dos-binary-loader.xdc` | engine set, relative refs, v8 markers, prebuilt bundles, fflate, window exports | pass (tests) |
| Rodger apps | no js-dos.com, pinned jsDelivr, non-fatal css | pass (tests) |
| `cheyenne.xdc` | boot smoke under stubbed DOM | BOOT-OK |
| `socal-subsurface.xdc` | archive currency + module graph | pass (tests) |
| `four-corners.xdc` | data integrity + archive currency + module graph + deterministic rebuild | pass (tests) |
| `sitek.xdc` | ships cheyenne/four-corners pages + deps, byte-identical to tree | pass (tests) |

Sandbox limits: no browser is available here, so runtime boot of the DOS
engines is verified statically (API-shape checks, engine file completeness,
bundle internals, module-graph closure, JS syntax). The v8 options API and
the `onEvent` names were cross-checked against the bundled engine source
itself, and the headline-harry/webxdc-dos shells now use the identical
options shape. A real-host smoke (tap BOOT in Headline Harry, Run Demo /
SNEAKERS in webxdc-dos, Launch in Rodger) is the final gate for the
release notes.

## File map

| change | where |
|---|---|
| Headline Harry engine completion + docs | `scripts/fix-headline-harry-xdc.mjs`, `webxdc-headline-harry/app/{index.html,js-dos/}`, `docs/headline-harry-jsdos-fix-2026-10-04.md` |
| webxdc-dos v8 rework | `webxdc-dos/index.html`, `webxdc-dos/vite.config.js`, `webxdc-dos/package.json`, `webxdc-dos/scripts/build-rom-bundles.mjs`, `webxdc-dos/vendor/fflate.mjs`, `webxdc-dos/public/{js-dos,roms}/` |
| Rodger CDN pin | `apps/rodger-ramrod.html`, `apps/Rodger_Ramrod_HTML5_Quine.html` |
| Four Corners theater merge | `four-corners.html`, `css/four-corners.css`, `js/four-corners{,-data}.js`, `public/apps/four-corners/`, `scripts/build-four-corners-xdc.mjs`, `docs/four-corners.md` |
| Gazetteer sync / Lost Treasure / launch windows | `scripts/sync-gazetteer.mjs`, `js/*gazetteer*`, `js/cheyenne-data.js`, `js/satellite-constellations*`, `docs/gazetteer-sync-2026-10-04.md`, `docs/lost-treasure-source-check-2026-10-04.md`, `docs/satellite-launch-windows-research-2026-10-04.md` |
| SITE-K refresh | `tools/pack_xdc.sh` (+ cheyenne.html, four-corners.html) |
| regression tests | `tests/webxdc-packages.test.mjs`, `tests/rodger-cdn.test.mjs`, `tests/four-corners.test.mjs`, `tests/satellite-constellations.test.mjs` |
