# Drive hash-lab investigation, CyberChef port, and viewer/country/planet completion — 2026-10-25

Round record for the 2026-10-25 session on `arena/a3bce79b-html5`: subsurface
viewer repair, a Google Drive recipe investigation (utilize additional
resources), the resulting CyberChef hash-lab port, and the country/planet
backlog finish.

## 1. Subsurface viewers: the boot crash

Every city subsurface frame (`*-subsurface.html`, 58 frames) died at boot
with `ReferenceError: Cannot access 'gazClassesHost' before initialization`:
the gazetteer host/state constants sat below the boot code that first used
them in `js/city-subsurface.js`. The constants were moved above boot
population (duplicates deleted), a capital-K `Georgia` orphan set (page,
`.xdc`, both data modules, `public/apps/Georgia-subsurface/`) was removed,
all 58 city Webxdc bundles were rebuilt, and `tests/viewer-boot.test.mjs`
now jsdom-boots sample cities, `socal-subsurface.html`,
`greeran-subsurface.html`, `country-viewer.html` and
`planet-viewer-4dwm.html` with zero-error assertions so the class of failure
cannot silently return.

**Corridor contract.** A frame sweep found exactly five corridor endpoints
outside their frame bboxes. They are real places the generalized corridors
deliberately trace: the Tennessee and Cumberland rivers to their Ohio River
confluence (Kentucky), the Florida Keys chain to Key West, the Connecticut
River in from Massachusetts, and the Northwest highlands context to Mount
Greylock (Massachusetts). The engine projects centre-relative and samples
labelled synthetic relief outside the DEM grid, so the lines render past
the terrain plate by design; moving the endpoints or expanding state frames
over unsampled out-of-state terrain would falsify either the feature or the
frame. The five reaches are now pinned as the *only* allowed exceptions in
`tests/city-subsurface.test.mjs` (exact coordinates, corridor names, and a
stale-exception guard): any new out-of-frame geometry fails the suite.

## 2. Drive investigation: two patches, one gap

Drive holds two CyberChef patches (folder `143iR3GObuk84afkg-y-wf5Y5gy3IUfZC`):

- **2026-10-08 kitchen sync patch** (`1XrtEWypntbwvbLPmDAh-Rx8QyZl-TyUz`) —
  **already fully landed.** The six Crow/field-cipher ops (`enigmaM4`,
  `secomSchedule`, `odPoemKey`, `secomExact`, `iocFitness`,
  `plugboardHillClimb`) are present in both the canonical and merged builds,
  and `tests/cyberchef-recipe-sync.test.mjs` passes against the frozen
  baseline `docs/cyberchef-recipe-sync-2026-10-07.json`. No action needed.
- **2026-09-27 SSE hash-lab patch** (`11XcjdO04fRM1azWT3q5DdSUQ6ziodEwS`) —
  **not landed.** Six SSE-v3 file-format ops and eleven hash-lab ops
  (Argon2 d/i/id + PHC, keyed BLAKE2b/BLAKE2s, digest-size BLAKE2 wrappers,
  a Java `Random` demo) are absent from both builds. The patch targets the
  sibling layout (`projects/sse-cyberchef/`, `webxdc/cyberchef/`), so it
  cannot apply here mechanically; the portable subset was re-implemented
  clean-room in this repo's `addOp` architecture.

**Evidence boundary (the patch's own audit, preserved):** the hash-lab ops
derive from `github.com/norkator/cryptography` pinned at
`d5dd097447f36fc6b17b201b7be05cb739df62ab` (MIT, © 2023 Norkator), which
ships BLAKE2b wrappers/tests for 160/256/384/512-bit digests and explicitly
insecure `java.util.Random` demos. The patch authors state no "crazy hash"
implementation exists in the inspected sources, the APKPure-listed Argon2
feature is a remote API, and the APK was not downloaded, executed, or
reverse-engineered. This port therefore claims known-answer correctness
against RFC 7693 / RFC 9106 reference vectors — **not** clone fidelity to
any Nitramite APK behaviour.

**Ported:** one `blake2` op (b-512/384/256/160, s-256/224, optional key;
BLAKE2s written clean-room, BLAKE2b reuses the app's existing pure-JS
implementation) and one `argon2` op (d/i/id, time/memory/parallelism/output
controls, PHC-string + hex report), plus a `Spotlight — Hash lab` recipe
pack. Kitchen totals move 515 → 517; `blake2`/`argon2` are appended to
`POST_MERGE_OPS` in the sync test, and the merged build was regenerated
(`npm run build:cyberchef`).

**Skipped, with reasons:** the six SSE-v3 file-URL/format-recovery ops
(coupled to SSE file-format edge cases and layout that do not exist in this
app) and the Java-Random demo op (the source audit itself flags the PRNG
as insecure; reproducing a broken-PRNG demo under a "hash lab" label invites
misuse-by-confusion). Both can return if the SSE thread resumes with its
own reference files.

**Verification.** Expected values were generated *only* by the reference
implementations (argon2-cffi binding of PHC argon2 20190702, hashlib),
including minimal configurations, multi-lane, output lengths 16–100 bytes,
empty and Unicode passwords. The first port failed every Argon2 vector;
block-level comparison against an instrumented reference build isolated it
to the H′ final chunk: H′ ends with `H^(τ−32r)(V_r)`, not one extra full
hash (the preliminaries, seeding and compression all matched bit-for-bit).
Fixed; `tests/cyberchef-hash-lab.test.mjs` now pins BLAKE2 and Argon2
vectors (incl. the PHC strings `$argon2id$v=19$m=4096,t=3,p=2$…`) against
the live registry. Note the op is pure JS over BigInt: at the default
4096 KiB × 3 passes it takes a few seconds, and the UI caps memory at
64 MiB accordingly.

## 3. Country viewer: batch C3 completion

Batch C2 seeded 233 Factbook profiles and recorded 18 auditable skips.
Batch C3 (`tools/fetch_factbook_completion.py`, register
`resources/country-viewer/country-factbook-batch3-source-register-2026-10-25.json`,
same pinned commit `144d6977b2b0`, per-file SHA-256) re-examines exactly
those 18: the 17 whose source publishes a conventional name and a country
reference point, but no capital (mostly uninhabited or disputed features,
plus Hong Kong and Macau; Nauru publishes the verbatim note "no official
capital; government offices in the Yaren District"), are now seeded with
capital fields standing empty **as published** — the treatment C2 already
gave profiles with no anthem title or population. All 233 C2 entries are
byte-identical in C3. The one remaining skip is genuinely unseedable:
`europe/ee.json` is the European Union profile, which publishes neither a
conventional name nor a country reference point; inventing either would
break the register's verbatim rule.

The viewer learned to say so: `capitalText()` renders "none published
(source profile lists no capital)", the capital marker is only drawn when
coordinates are finite, and list buttons drop the dangling " — " for
capital-less profiles. Planet-viewer expected counts are derived from the
data rather than hardcoded at 233. `country-viewer.xdc` was rebuilt
(sha256 `446873e3…`).

## 4. Planet viewer: PC Globe index plate

The GLOBE plate already plotted Factbook capitals and reported skips
honestly. The remaining planet backlog item — PC Globe — stays unplotted:
`tools/pcglobe/PcGlobeReader.java` decoded the NAMES.DAT country run (216
names) and 177 COUNTRY1/2.DAT records (1,063 label strings), but the binary
map payload (coordinates and the name→record pointer table) is undecoded,
so no record can even be matched to a country name. The new **PC GLOBE
INDEX** plate lists both decoded registers exactly as decoded — names;
records by file position with their feature labels; the city-name (1,268)
and currency (146) runs reported by count only, since only their counts
were decoded — under a disclosure that nothing from PC Globe is plotted.
A `pcglobe/index` consistency check recomputes the counts and asserts zero
coordinate-shaped fields exist in the data. `planet-viewer-4dwm.xdc` was
not rebuilt (it contains the SoCal package by standing direction).

## Verification

Targeted suites (hash-lab, recipe-sync, spotlight-coverage, country,
planet, city, viewer-boot) pass; the full Node suite runs green before the
PR. Generated artifacts were produced only by their builders:
`npm run build:cyberchef`, `npm run build:country-viewer`,
`node scripts/build-pcglobe-index-data.mjs`,
`node scripts/build-wikiinajar-xdc.mjs`.
