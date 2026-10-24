# Backlog execution — round 40 (2026-10-24)

**Stream:** T4.1 GNIS state gazetteer coverage — batch 20 re-integration (New Jersey + Hawaii).
**Branch:** `arena/8c721d44-html5` (from `main` at `42112ef`, the PR #146 merge).
**Result:** configurations 57–58 of the city-subsurface atlas; 58 frames total.
**Every US state now has a statewide frame.**

## Why this round exists

Batch 20 (NJ+HI, round 38) was built on `arena/dce0f74e-html5` and opened as
PR #145. PR #146 (Alaska, round 39) merged first, leaving #145 `CONFLICTING`.
Per the main-preferred reconciliation rule used for PRs #141/#143 — and because
this session works only on `arena/8c721d44-html5` — batch 20's unique work was
re-integrated here rather than repaired on its own branch. **PR #145 is
superseded by this round's PR and can be closed unmerged.**

## What was transferred (from PR #145 head `0fa5149`)

- **Frames:** the `newjersey` and `hawaii` entries appended to
  `resources/city-subsurface/cities.json` after `alaska` (insertions only,
  main's 56 frames untouched), plus the three engine loader maps.
- **Frozen register:** `resources/city-subsurface/gnis-state-batch20-source-register-2026-10-24.json`
  transferred **verbatim** (High Point `877098` 1,803 ft and Mauna Kea `366215`
  13,796 ft per-ID checks, the Delaware River corridor decision, Lake Hopatcong's
  reservoir-record seeding, Hawaii's verbatim Līhuʻe/Haleakalā spellings, Waiau's
  name-order screen, the displaced Elizabeth/Kahului records).
- **Extract:** the NJ and HI state objects merged into this branch's cumulative
  `gnis-candidates-batch7.json` (29 states now, Alaska included); candidate
  staging lists merged into `.arena-gnis/candidates.json`.
- **Test:** the batch-20 test block inserted alongside Alaska's batch-21 test.
- The GNIS fetch workflow trigger was repointed to `arena/8c721d44-html5`.

## Verification

- City suite: 32/32 (batches 20 and 21 tests coexist; both register oracles
  deep-equal their generated rows against the same extract).
- Full Node suite and wiki rebuild: see the PR description.

## Next

The country/planet thread (the atlas pattern beyond US states).
