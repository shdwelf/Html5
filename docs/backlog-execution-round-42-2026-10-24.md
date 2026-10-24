# Backlog execution — round 42 (2026-10-24)

**Stream:** S4 country thread — batch C2 (full Factbook coverage + Webxdc packaging).
**Branch:** `arena/876f9abb-html5` (from `main` at `28b0b67`, the PR #147 merge).
**Result:** the country viewer covers the full inhabited Factbook at the pinned
upstream commit — 233 seeded profiles — and ships as `country-viewer.xdc`.

## Re-integration note

Batch C1 (round 41) was merged nowhere: PR #148 sat open on
`arena/8c721d44-html5` when this branch was cut from the same base. Per the
main-preferred rule (PRs #141/#143/#147), C1's twelve changed files were
transferred here verbatim (wiki bundle rebuilt locally rather than copied)
and its two tests passed before any extension. **PR #148 is superseded by
this round's PR and can be closed unmerged.**

## What shipped

- **Batch-2 register** (`resources/country-viewer/country-factbook-batch2-source-register-2026-10-24.json`)
  via `tools/fetch_factbook_full.py`: one codeload tarball download at the same
  pinned commit (`144d6977b2b0`, ~2.7 MB) replaces per-file API calls; every
  profile in the ten inhabited region directories is extracted verbatim with a
  per-file SHA-256. **233 seeded; 18 skipped**, each skip recorded with the
  exact missing identity fields (name / capital / coordinates) — mostly
  uninhabited or disputed features with no capital or reference point.
  Oceans and Antarctica directories are out of scope by design. Two seeded
  profiles publish no anthem title and three no population; those fields stand
  empty rather than interpolated. The Holy See publishes a rounded total area
  of `0 sq km` (land 0.44) and is stored as published.
- **Dataset + viewer updated by regeneration only** (`js/country-data.js` now
  carries 233 entries); the viewer code needed no changes — null-tolerant
  formatting from C1 already covered dependency profiles.
- **`country-viewer.xdc`** (`scripts/build-country-viewer-xdc.mjs`, staged via
  `public/apps/country-viewer/`, deterministic bytes): 5 entries, sha256
  `d6c7b67e…`. `npm run build:country-viewer` regenerates data + bundle.
- **Tests** (`tests/country-viewer.test.mjs`, 3/3): deep-check oracle against
  the batch-2 register at full-coverage scale; auditable-skip assertions;
  batch-1 seed survival spot-checks (by FIPS code); helper/wiring checks; and a
  bundle-contents check that unzips `country-viewer.xdc` and asserts its
  manifest and root page.

## Verification

- Country tests 3/3; full Node suite + wiki rebuild: see the PR description.

## Next in thread

The S4 tail: the Ghidra PC Globe→Java experiment, then reusing the Red October
globe for the planet viewer (`planet-viewer-4dwm.html` base already exists).
