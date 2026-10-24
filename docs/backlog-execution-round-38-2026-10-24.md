# Backlog execution round 38 — 2026-10-24 (reconciliation)

**S4 · GNIS domestic-names state frames (T4.1). Reconciliation-only
round: the state atlas completed on main while this branch's staging
was in flight.** Nothing new ships as a frame from
`arena/fb1c7be1-html5`; this record keeps the free round-38 slot (the
parallel sessions hold 36, 37, 39 and 40) and documents what was
staged, what main won, and the evidence that crossed over.

## What landed without us

| PR | Contents | Rounds / batches | Configs |
| --- | --- | --- | --- |
| #144 | Maine, Massachusetts, Connecticut, Rhode Island | 36–37 / 18–19 | 52–55 |
| #146 | Alaska | 39 / 21 | 56 |
| #147 | New Jersey + Hawaii (**50-state atlas complete**) | 40 / 20 | 57–58 |

This branch had staged **New Jersey + Connecticut** as round 36 /
batch 18 (configurations claimed 52–53 at the time), with the
register, 29-test suite additions, loader triplets and docs ready.

## Reconciliation decisions (main-preferred, fifth S4 collision)

* **Connecticut dropped against PR #144 with zero evidence
  transfer** — first such collision: main's batch-19 register was
  re-verified to carry every identity decision this branch had
  recorded independently (Bear Mountain `205348` per-ID locator over
  the blank southern twin, Mount Frissell's missing Connecticut
  record with the Massachusetts-keyed `607428` disclosure,
  planning-region county handling, Candlewood screen, main-stem
  mouth seeding — and broader: Farmington River, Lake Lillinonah,
  Jerimoth Hill).
* **New Jersey dropped against PR #147 after a roster diff** —
  shared rows: Trenton `884540`, Newark `878762`, Jersey City
  `877450`, Paterson `879164`, Camden `875105`, High Point
  `877098`, Lake Hopatcong `877238`, Raritan River `879618`,
  Passaic River `879159`. Main's roster keeps Atlantic City
  `874413`, Mullica River `878659`, Round Valley Reservoir
  `879839`; this branch's Elizabeth `876147`, Manasquan River
  `878067` and Delaware and Raritan Canal `875875` were not seated.
  Main's High Point note carries the same substance in its own form
  ("1,803 feet" USGS-published, per-ID check, Ocean County twin
  `877099` rejected), Lake Hopatcong records the Reservoir
  classification, and the Delaware River empty `states=NJ` screen is
  a register decision — so no row-note patches were needed either.

## Unique material retained in this round

1. **Batch-20 register evidence transfer** — main's
   `gnis-state-batch20-source-register-2026-10-24.json` gains a
   known-limitation recording the three independently verified but
   unseeded New Jersey records (Elizabeth `876147` — already one of
   their decisions — Manasquan River `878067`, Delaware and Raritan
   Canal `875875` with the Stream-grouping/hydro.stream storage rule
   that avoids an untokenised canal class), available for future
   register expansion without widening the 12-row starter scope.
2. **Runner/extract lesson** — `tools/gnis_extract.py` rebuilds
   `gnis-candidates-batch7.json` solely from
   `.arena-gnis/candidates.json`; the first batch-18 request
   (NJ+CT only) overwrote the cumulative extract and red-lit ten
   earlier batch tests. The request was made cumulative again (27
   states by this branch, now 29 on main covering AK/HI/NJ too).
3. **Workflow branch list** — `.github/workflows/arena-gnis-fetch.yml`
   keeps main's branch and gains `arena/fb1c7be1-html5` so this
   branch's future GNIS requests trigger the runner extract.
4. **README bundle count** — line 125's shared-bundle figure is
   carried forward and corrected to **fifty-eight** (both prior PRs
   updated the feature list but left this counter behind).
5. **Backlog bookkeeping** — Round-38 status block, JSON
   `next_actions` / T4.1 note, `docs/README.md` index line, and this
   record.

## Verification

* `node --test tests/city-subsurface.test.mjs` → green on main's
  58-frame suite (state-batch tests through round 40).
* `node --test tests/*.test.mjs` → full-suite green after the merge.
* `npm run build:city-subsurface` consistency: main's generated
  packs/pages taken verbatim (`--theirs`) for every built artifact;
  loader deduplicated to single `newjersey`/`alaska`/`hawaii`
  triplets.
* `npm run build:wikiinajar` rebuilt after this record.
* `git diff --check` clean before staging.

## Queue

**All fifty state frames are complete** (atlas closed by PR #147).
The S4 backlog moves to its final thread: the country/planet viewer
(country index a la PC Globe + CIA Factbook notes, PC Globe
abandonware study, Red October globe reuse), per
`docs/agent-backlog-2026-10-21.md`.
