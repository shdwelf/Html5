# Backlog execution — round 46 (2026-10-24)

**Stream:** S2 — verify the `sneakers-press-kit.xdc` keyboard/mouse
layout against the headline-harry pattern; DOSBox+Xvfb automation
notes; wiki refresh. **S2 is complete.**
**Branch:** `arena/98365730-html5` (from `main` at the PR #152 merge
`272e809`; PR #153 is a separate open branch and untouched).

## The pattern, and the verification

The headline-harry fix (`docs/headline-harry-jsdos-fix-2026-10-04.md`)
established the shell pattern this repo's js-dos Webxdcs must follow:
inside a Webxdc iframe the DOSBox canvas is not focused by default, so
window keydown never arrives ("no keyboard") and the first click can be
eaten before focus ("no mouse"). The pattern is: canvas `tabindex="0"`,
focus after `Dos()`, on `ci-ready`, and on capture-phase
`pointerdown`/`keydown`; js-dos v8 options (`url`, local `pathPrefix`,
`autoStart`, `noCloud`, `kiosk: false` so the ☰ sidebar stays
reachable, `onEvent` statuses); the full engine file set including the
`wlibzip` pair.

The new parity test in `tests/sneakers-press-kit.test.mjs` ("keyboard/
mouse layout matches the headline-harry pattern") checks **both**
shells against that contract, plus DOSBox-side parity: identical
`[cpu]/[mixer]/[sblaster]/[speaker]` values in both bundles'
`dosbox.conf`, and no `keyboardlayout` or `[mouse]` override in either
(DOSBox defaults govern both). It also guards Sneakers' deliberate
strengthenings (retry stops the old instance and clears the container).

**Result: the layout conforms**, with one delta found and fixed — the
Sneakers `ci-ready` status now repeats the ☰ sidebar hint
(`js-dos sidebar: ☰ = on-screen keyboard/gamepad, 💾 = actions`),
because the pre-boot overlay carrying the hint is gone once DOS runs.
`webxdc-sneakers/app/index.html` is the only source change; the XDC
rebuilt deterministically (805,280 bytes, 13 entries, sha256
`e4d7d38295286b9ee182b35a064b52cc79e516e1e50bdee9aef0808afdd45b70`).

## DOSBox+Xvfb automation notes (already in place — cited, not rebuilt)

The smoke pair predates this round and is CI-backed: `tools/smoke_sneakers_dosbox.sh`
(reconstruction: unzip bundle, MZ/RUN.BAT/autoexec validation, Xvfb
:99, focus, type, screenshot + OCR) and
`tools/smoke_sneakers_original_dosbox.sh` (hash-verified original,
Space via XTest), driven by `.github/workflows/arena-sneakers-smoke.yml`
(run 39161148174 passed both jobs; screenshots/logs are diagnostic
until visually reviewed — the sandbox cannot retrieve the artifact).
No new automation was needed; an early draft duplicate script written
this round was discarded and the tracked script restored byte-identical.

## Verification

- `tests/sneakers-press-kit.test.mjs` 4/4 (including deterministic
  rebuild currency after the shell edit); wiki page refreshed
  (`docs/github-wiki/Sneakers-Archive-and-Ghidra.md`).
- Full suite and wiki-bundle rebuild in the PR verification table.
- Not done: visual review of the smoke-run screenshots (sandbox egress
  cannot fetch the CI artifact) — stated as an open research item on
  the wiki page, not silently assumed.

## Next

S2 complete. Open fronts: S5 (live incident/camera layers), S6's
externally gated remainders (redistributable nodelist, second Keyhole
listing), S1/S7/S8 residuals needing binaries or hardware.
