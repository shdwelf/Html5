# Backlog execution round 38 — 2026-10-24

**S4 · GNIS domestic-names state frames (T4.1).** New Jersey ships
as **configuration 56** from `arena/fb1c7be1-html5` — the final
Atlantic seaboard state. The round was renumbered in flight: this
branch staged New Jersey + Connecticut as round 36 / batch 18, and a
parallel session's PR #144 landed first (2026-10-24T07:22:13Z) with
Maine, Massachusetts, Connecticut and Rhode Island as configurations
52–55 / batches 18–19 / rounds 36–37. Under the standing
main-preferred reconciliation rule the duplicate Connecticut
generation was dropped wholesale, New Jersey's configuration number
moved 52 → 56, the register became **batch 20**, and this record
takes the next free round number (38).

## Connecticut duplicate disposition (first collision with no transfer)

Main's batch-19 Connecticut frame was re-verified against every
identity decision this branch had independently recorded before
dropping our generation:

* Bear Mountain `205348` seeded by its Domestic Names per-ID
  description locator (Northwest Hills region, blank southern twin
  `205347` rejected) — present on main;
* Mount Frissell south slope (official CT high point, USGS
  Elevations and Distances 2,380 ft) disclosed as having **no
  Connecticut-keyed GNIS record** (empty `states=CT` screen; the
  summit keys to Massachusetts `607428` and is never seeded) —
  present on main (their record renders 2,379 ft from the state-line
  description);
* post-2022 planning-region counties stored as returned, with the
  historical Hartford county divisions rejected — main stores the
  same bare extract identities (`Capitol`, `Southeastern
  Connecticut`, …) this branch's extract comparison produced;
* Candlewood Lake screen (communities only), CT main-stem river
  seeding at the mouth record, and the Bantam Lake lake-row
  decision — all present on main's batch-19 register.

Nothing needed to be transferred: main's generation was complete
(and in places broader — Farmington River, Lake Lillinonah, Rhode
Island's Jerimoth Hill). This is the first parallel-session
collision of the S4 backlog where the loser's unique evidence set
was empty.

## New Jersey screens (cross-checked 2026-10-23 local)

All twelve rows are `VERIFIED=1` USGS GNIS records screened by exact
official name, returned class/type, state, returned primary county,
permanent FEATURE_ID, and returned primary point (USGS Geocoder +
GNIS DomesticNames state text extract):

| # | Feature | Class/type | County | FEATURE_ID |
| --- | --- | --- | --- | --- |
| 1 | Trenton (capital anchor) | Populated Place | Mercer | `884540` |
| 2 | Newark | Populated Place | Essex | `878762` |
| 3 | Jersey City | Populated Place | Hudson | `877450` |
| 4 | Elizabeth | Populated Place | Union | `876147` |
| 5 | Paterson | Populated Place | Passaic | `879164` |
| 6 | Camden | Populated Place | Camden | `875105` |
| 7 | High Point | Summit | Sussex | `877098` |
| 8 | Lake Hopatcong | Lake | Sussex | `877238` |
| 9 | Raritan River | Stream | Middlesex | `879618` |
| 10 | Passaic River | Stream | Essex | `879159` |
| 11 | Manasquan River | Stream | Monmouth | `878067` |
| 12 | Delaware and Raritan Canal | Stream | Mercer | `875875` |

Identity decisions (batch-20 register):

* **High Point** — the Sussex summit `877098` (548 m) is seeded;
  the same-name Ocean County populated place `877099` is rejected,
  and the note quotes the per-ID description "Highest elevation in
  NJ at 1803 feet." (the official figure comes from that GNIS
  description; the USGS Elevations and Distances chunk renders its
  NJ line oddly, so it is not cited).
* **Lake Hopatcong** — the Sussex-keyed lake `877238` (returned
  type Reservoir, `39004` recorded per-ID) is seeded; the Morris
  populated place `876215` and census division `2806109` are
  rejected.
* **Delaware and Raritan Canal** — stored as class `Stream`/ftt
  `hydro.stream`: the Geocoder groups Streams & Canals under the
  Stream row type, and no untokenised `hydro.canal` token was
  introduced.
* **Delaware River** — `states=NJ` returns an empty array, so the
  river stays a generalized context corridor citing the empty screen
  and cross-referencing main's Delaware frame row `217887` (the
  statewide frame already seeds it). No cross-state record is seeded
  into New Jersey.

The frame: bbox (−75.55, 38.93, −73.88, 41.36), one labelled
synthetic Atlantic coast polyline (15 context points), five context
corridors (I-95, I-78, I-80, Garden State Parkway, Delaware River),
four node anchors (trenton, newark, jersey-city, high-point) reusing
row coordinates exactly, labelled synthetic relief gaussians, and no
DEM.

## Runner/extract note

`.arena-gnis/candidates.json` is rebuilt by `tools/gnis_extract.py`
into `gnis-candidates-batch7.json` from the request list **alone** —
the first batch-18 request (NJ+CT only) overwrote the cumulative
extract and red-lit ten earlier batch tests. The request was made
cumulative again and now carries all **27 states** ever screened
(24 previous + NJ restored in the union with main's 26); the round-38
CI runs (workflow branch list gained `arena/fb1c7be1-html5`) confirm
the union holds.

## Verification

* `node --test tests/city-subsurface.test.mjs` → **31/31 pass**
  (main's 30 + the batch-20 New Jersey block).
* `node --test tests/*.test.mjs` → **807 pass, 0 fail, 12 skipped**.
* `npm run build:city-subsurface` → **56** pages + 56 Webxdc
  packages (New Jersey: 12 gazetteer rows, 5 corridors, 4 nodes).
* `npm run build:wikiinajar` → rebuilt after this record lands.
* `git diff --check` clean before staging.

## Files

* `resources/city-subsurface/cities.json` — `newjersey` frame
  appended (56 frames; main's 4 PR-#144 frames kept verbatim).
* `resources/city-subsurface/gnis-state-batch20-source-register-2026-10-23.json`
  — batch-20 register (12 verifiedRows, 3 identity decisions, 5
  selection rules, 5 known limitations; screens dated 2026-10-23).
* `tests/city-subsurface.test.mjs` — batch-20 block inserted before
  the engine anchor (31 tests), array gains `newjersey`.
* `js/city-subsurface.js` — three `newjersey` loader lines.
* `.arena-gnis/candidates.json` — cumulative 27-state request,
  batch 20 / configuration 56.
* `.github/workflows/arena-gnis-fetch.yml` — branch list gains this
  branch alongside main's.
* Docs: this record, `docs/agent-backlog-2026-10-21.md` Round-38
  status, backlog JSON `next_actions` + T4.1 note, `README.md`
  counts/list, `docs/city-subsurface.md` round-38 paragraph + table
  row + counts, `docs/README.md` index line.

## Queue

**Two state frames remain — AK and HI** — then the country/planet
thread (S4 hand-off to the country viewer / PC Globe work).
