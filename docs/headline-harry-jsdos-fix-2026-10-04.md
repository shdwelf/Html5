# Headline Harry — js-dos boot fix — 2026-10-04

## Symptom

Pressing BOOT showed `failed to start js-dos: dosInstance.run is not a
function` and the game never started (reported as "dosgame.run not found —
jsdos didn't load").

## Root cause

API-version mismatch inside `headline-harry.xdc`:

- the bundled engine (`js-dos/js-dos.js`) is **js-dos v8** (8.4.1) —
  `window.Dos(element, options)` where the bundle `url` goes in the options
  and the player auto-starts;
- the shell page booted with the **v7 API** — `Dos(container, opts)` followed
  by `dosInstance.run("roms/headline-harry.jsdos")`. v8 returns a props object
  with no `.run()` method, so the call threw and the `catch` surfaced the
  error. (`Dos.configure` is likewise v7-only; the guard made it a no-op.)

## Fix

The shell's boot block now uses the v8 options API:

```js
window.Dos(container, {
  url: "roms/headline-harry.jsdos",
  pathPrefix: "js-dos/",     // engine assets load from the bundle, no CDN
  autoStart: true,
  noCloud: true,
  onEvent: (event) => { /* emu-ready / bnd-play / ci-ready / *-error */ },
});
```

Status-line updates moved from v7 `onready`/`onerror` callbacks to v8
`onEvent` events (`emu-ready`, `bnd-play`, `ci-ready`, `emu-error`,
`bnd-error` — all verified present in the bundled engine).

## Where things live

- Canonical shell source: `public/apps/headline-harry/index.html` (new — the
  archive previously had no in-repo source; the binary payloads, the
  2.0 MB `roms/headline-harry.jsdos` bundle and the js-dos engine with
  `wdosbox.wasm`, intentionally live only inside the archive).
- Repack script: `scripts/fix-headline-harry-xdc.mjs` — splices the staged
  shell into the existing archive, refuses to pack if a v7 `.run()` call
  sneaks back in, writes a deterministic zip (sorted entries, fixed
  timestamp, deflate 9).

## Result

`headline-harry.xdc`: 2,837,206 bytes, sha256
`9ae2d7eb5c636b540e99f3a3c5ed857020629196913d290f98a1a8eaabf754d7`.
All other entries byte-identical to the previous archive.

## Verification notes (sandbox)

No browser is available in this environment, so verification is static:
the packed `index.html` is byte-identical to the staged source, contains no
`dosInstance.run(` call, points v8 at `roms/headline-harry.jsdos`, and every
asset it references (`js-dos/js-dos.css`, `js-dos/js-dos.js`, `webxdc.js`)
is present in the archive alongside the engine files
(`js-dos/emulators.js`, `js-dos/wdosbox.js`, `js-dos/wdosbox.wasm`).

## Follow-up: the missing wlibzip pair (same day)

The v8 boot fix above still shipped an incomplete engine.  Reading the
bundled `js-dos/emulators.js` shows the bundle path is not optional:

- `emulators.js`'s module loader exposes a lazy `libzip()` that fetches
  `pathPrefix + "wlibzip.js"` (and `wlibzip.wasm` behind it);
- `bundleConfig()` — the function that opens a `.jsdos` bundle to read
  `.jsdos/dosbox.conf` — awaits `libzip()` **before** touching the bundle,
  with no JS fallback;
- the `Build` manifest baked into `emulators.js` lists `wlibzip.js`
  (72,957 B) and `wlibzip.wasm` (112,483 B) as part of the 8.4.1 set.

So a v8 boot against `roms/headline-harry.jsdos` with no `js-dos/wlibzip.*`
in the archive dies on a 404 right after `Dos()` — the same "jsdos didn't
load" symptom as the API mismatch, one step later.  The static verification
above checked the shell's references but not the engine's lazy ones, which
is how it slipped through.

Fix: `scripts/fix-headline-harry-xdc.mjs` now carries an engine-completeness
pass — it splices any missing file of the full 8.4.1 set from the vendored
copy at `webxdc-headline-harry/app/js-dos/` (which is where the genuine
`wlibzip.js` / `wlibzip.wasm` from the `js-dos@8.4.1` npm package now live)
and refuses to pack an incomplete engine.

`headline-harry.xdc`: 2,910,703 bytes, 14 entries, sha256
`19083399eee04d70218627d9fe07341528961385ce2b23e29609a670a13337ae`.
All non-engine entries remain byte-identical to the previous archive.

## Follow-up: keyboard/mouse capture in a webxdc iframe (2026-10-09)

Reported symptom: the game boots but there is **no keyboard or mouse**.

Diagnosis (from the bundled `js-dos/js-dos.js`, v8.4.1): the engine binds
`keydown`/`keyup` on the window and captures the mouse with
`requestPointerLock`. Both require the DOSBox **canvas to have focus**. Inside a
webxdc host the app runs in an iframe/webview whose canvas is not focused on
load, so window key events never reach DOSBox and the first click is consumed
before the canvas takes focus. (Pointer-lock can also be denied unless the host
iframe sets `allow="pointer-lock"` — outside this app's control.)

Fix in `public/apps/headline-harry/index.html`: give the canvas a tab stop and
focus it — `focusDos()` sets `tabindex="0"` and calls `canvas.focus()`, invoked
on boot (`setTimeout`), on the `ci-ready` event, and on every `pointerdown` /
`keydown` (capture phase) on the container. This is the standard remedy for
"DOSBox-in-iframe gets no keyboard."

`headline-harry.xdc`: 2,911,034 bytes, 14 entries, sha256
`c7a97f532b334e35967622e1d760899fb8b844e3701f7c28a11fc3fee45d15a8`. Repacked by
`scripts/fix-headline-harry-xdc.mjs`; `tests/webxdc-packages.test.mjs` (Headline
Harry case) passes. **Caveat:** the sandbox cannot reach a webxdc client or
dosinstance.run, so the focus fix is verified statically (present in the packed
shell, engine complete, package test green) but not confirmed at runtime on the
failing host.
