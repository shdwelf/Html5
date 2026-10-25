# Backlog execution round 52 — 2026-10-25

**Round:** 52 · **Stream/task:** new user-directed side task — Playwright
1.64 disassembly + JavaScript conversion (wiki-workspace browser tooling)
· **PR:** this branch (`arena/ab02c7e0-html5`)

## The ask

“Disassemble playwright 1.64 and convert to javascript; continue
backlog.” Pinned target: `playwright-core@1.64.1` (npm latest;
SHA-512/SHA-256 recorded in the research doc).

## Research (what was taken from each source)

- **npm registry** (`playwright-core@1.64.1` tarball, 3.2 MB / 115
  files): the shipped artifact itself is the disassembly subject — two
  esbuild bundles with module banners intact, `browsers.json` pins,
  generated `types/protocol.d.ts` (59 CDP domains).
- **The bundle as its own map:** banners give the monorepo layout —
  client 51 modules ⇄ channel protocol ⇄ server 154 modules, per-browser
  servers (`crPage` CDP / Juggler / `wkPage`), 7 injected in-page
  modules. Full census in
  [`playwright-164-disassembly-javascript-2026-10-25.md`](playwright-164-disassembly-javascript-2026-10-25.md),
  machine-readable register in
  [`playwright164-evidence/module-map-1.64.1.json`](playwright164-evidence/module-map-1.64.1.json)
  (regenerable via `tools/playwright164/disassemble.mjs`).
- **Repo idiom:** the converted consumer follows `tests/lib-browser.mjs`
  (Chromium via `@sparticuz/chromium`, curated launch args, skip-clean
  browser tests) — the same binary source the planet/red-october suites
  already use. No part of Playwright's Apache-2.0 code is vendored; the
  conversion is a clean-room re-implementation of the used slice over
  raw CDP.

## What shipped

- **`tools/playwright164/disassemble.mjs`** — package disassembler:
  bundle module maps (path/start/lines), area roll-ups, browser pins,
  CDP domains, SHA-256 of load-bearing files; deterministic JSON out.
- **`docs/playwright164-evidence/module-map-1.64.1.json`** — the 1.64.1
  register (414 core + 627 utils modules; test-pinned).
- **`tools/wiki-workspace/cdp-browser.mjs`** — dependency-free JavaScript
  conversion of the used slice: CDP transport (WebSocket, session
  routing), `launchChromium`, Browser/Page/Locator/Download with the
  Playwright-shaped calls `browser-smoke.mjs` makes (mapping table in
  the research doc).
- **`tools/wiki-workspace/browser-smoke.mjs` converted** — no longer
  requires `playwright-core`; only a Chromium binary stays external.
  README's install line updated to match.
- **`tests/playwright164.test.mjs`** (11/11, fake CDP transport) and
  **`tests/playwright164-browser.mjs`** (6/6 in real HeadlessChrome
  153.0.8010.0; skips cleanly without the binary deps).

Defects found in-round (all fixed, all recorded in the research doc):
`@sparticuz/chromium`'s Lambda arg set deadlocks the Target flow;
Chrome's dual Page+Browser download events overwrote the waiter entry
(`download.path()` hang); `setInputFiles` temp naming falsified
`input.files[0].name`.

## Backlog position

Side task complete as scoped: the disassembly register is committed and
regenerable, the conversion is proven at protocol level and in a real
browser, and the repo's only Playwright consumer in the tooling tree no
longer depends on the package. The 14-stream backlog in
`docs/agent-backlog-2026-10-21.md` is untouched by this round (its parked
streams remain blocked on their recorded lawful-access/source decisions);
`scripts/wormhole-fetch.mjs` deliberately still uses full `playwright`
on the operator's machine. Follow-ups if wanted: run the converted
`browser-smoke.mjs` against a live wiki JAR server, and grow
`cdp-browser.mjs` only when a second consumer needs more surface.
