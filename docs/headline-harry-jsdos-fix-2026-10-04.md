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
