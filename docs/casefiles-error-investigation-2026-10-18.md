# CASEFILES error investigation — 2026-10-18

This is a reproducible baseline for the reported CASEFILES update/error work, not a claim that an unspecified user error has been fixed. The exact failing host, action, and error text were not available in this checkout.

## What was checked

- `npm run check:casefiles`: both generated deliverables match source (`casefiles-inlined.html`, 5,730,236 bytes; `casefiles.xdc`, 2,541,336 bytes, 55 entries).
- `node tools/smoke_casefiles_bundle.mjs`: all local bundle smoke checks passed, including the theater builders and VRML writer.
- `node --test tests/casefiles-4dwm.test.mjs`: 18/18 tests passed, including archive layout, self-contained relative references, both 4DWM field modes, and headless rendering.
- Started the repo's `tools/serve.mjs` on port 8099 and ran `node tools/verify_casefiles.mjs 8099`: all 82 checks passed, including recovery, a synthetic ZIP, the local Ghidra-WASM engine, demo.exe and a PE32+/UEFI module decompile. `node tools/verify_casefiles_inline_decompile.mjs 8099` also returned `INLINE DECOMPILE OK`.

These checks exercise the local server, fixtures and packaged archive. They do **not** verify a remote Wayback fetch, an arbitrary real-world binary, an ArcaneChat/Webxdc client, or the user's particular failure path. See `docs/casefiles-4dwm.md` for the archive/inliner boundary and `docs/dss-casefiles-riddle-warrick.md` for source and recovery limitations.

## If the error recurs

Capture: the URL or installed `.xdc` filename and SHA-256; which tab and button were used; the full on-screen error and browser console stack; whether online recovery was attempted; and, for a binary failure, its digest and file type. Avoid posting sensitive binaries or credentials. Reproduce against the two shipped entry points (`casefiles.html` and `casefiles.xdc`) before changing a generated artifact; edit tracked sources and rebuild with `npm run build:casefiles` instead of editing `casefiles-inlined.html` by hand.
