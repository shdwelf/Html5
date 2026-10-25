# Backlog execution — round 44 (2026-10-24)

**Stream:** S4 — PC Globe→Java experiment stage 3 (Java country-database
reader) plus the S4 tail (Red October globe → planet viewer).
**Branch:** `arena/3c1048e1-html5` (from `main` at `769b89b`, the PR #149
merge; the round-43 branch was fast-forwarded in, so this PR also carries
PR #151's content verbatim and supersedes it).
**Result:** the 1990 PC Globe country database is decoded by a
dependency-free Java reader whose dump is committed and test-pinned; the
planet viewer gains a GLOBE plate reusing the Red October globe. **S4's
sequenced thread is complete** (50-state atlas → country viewer → PC
Globe Ghidra/Java → planet globe).

## Stage 3 — Java reader (`tools/pcglobe/PcGlobeReader.java`)

The sandbox has no JVM, so `arena-pcglobe-java.yml` compiles and runs the
reader on a Temurin 21 runner against the SHA-256-re-verified media and
commits the dump to `research/pcglobe-java/` (not a trigger path). The
reader walks the layouts the round-43 probes hinted at, now pinned down:

- **Offset tables.** `COUNTRY1.DAT` (83 records), `COUNTRY2.DAT` (94) and
  `DATABASE.DAT` (177) all open with a little-endian u32 offset table
  whose last entry is an end sentinel equal to the file size.
- **COUNTRY label sections.** Each record ends with `[u8 token count]
  [tokens]`; a token starting with a byte ≥ 0x80 carries its first
  character in that byte (OR 0x80), a plain token continues the previous
  feature (`North` + `Albanian Alps`). The count byte verifies the parse
  of **all 177 records** — the Java reader only accepts a section whose
  token chain consumes the record exactly and matches the count.
- **NAMES.DAT.** After a 3,015-byte binary prefix (reported undecoded,
  not guessed), three string runs: 216 country names (current names with
  former/alternate names adjacent, e.g. `RHODESIA` last), 1,268 place
  names, 146 currency names.
- **DATABASE.DAT** records carry plain NUL-terminated resource/product
  labels (Afghanistan: Natural Gas, Crude Oil, Coal, Copper, Talc,
  Karakul Pelts, …) beside binary statistic fields.

Undecoded payloads are reported as byte counts, never guessed. The
name↔record alignment is asserted only where order plus geography
corroborate it: records follow canonical-name order (record 83 is North
Korea via its Yalu River features, sorting as `KOREA, NORTH`, while the
name list is alphabetical by display name). `tests/pcglobe-java.test.mjs`
(2/2) pins the media hashes, the JDK-only imports, and the named sample
(Afghanistan's `Hindu Kush Mountains` … `Helmand River`, Jordan #80,
Kenya #81, Kiribati #82, the Koreas #83–84, Kuwait #85). The dump's
embedded source SHA-256s are checked against the round-43 manifest.

The Java algorithm was first mirrored in Python locally (no JVM in the
sandbox) to prove the layout; the committed dump is the runner's Java
output, and it matches the mirror on every pinned sample.

## S4 tail — Red October globe → planet viewer

`js/planet-globe.js` reuses the Red October globe for the planet viewer:

- the orthographic projection is **imported** from
  `apps/red-october-command-viewer/core.js` (`projectOrthographic`), not
  copied;
- coastlines are the same bundled low-resolution Natural Earth outlines
  (`vendor/world/countries.geo.json`, 180 features) the Red October
  globe draws;
- markers are the country viewer's 233 Factbook capitals
  (`js/country-data.js`), projected with limb clipping and back-to-front
  ordering; PC Globe features are deliberately **not** plotted — their
  coordinates live in the undecoded binary payload, and inventing them
  would be fabrication.

`planet-viewer-4dwm.html` gains a GLOBE plate: a drag-rotatable 2D
orthographic disc overlaid on the terrain viewer (terrain plates,
checks, GNIS search untouched; VRML export announces it is terrain-only;
coastline fetch failure degrades to graticule + markers with the status
line saying so, mirroring the Red October globe's own fallback). Two new
cross-checks (`globe/markers`, `globe/projection`) join
`js/planet-viewer-checks.js`.

## Verification

- `tests/pcglobe-java.test.mjs` 2/2; `tests/planet-viewer.test.mjs` 13/13
  (including 4 new globe tests: projection reuse, capital markers,
  bundled coastline ranges, wiring/VRML guard); `tests/country-viewer`
  3/3. Full suite and wiki rebuild in the PR verification table.
- Not run: `tests/planet-viewer-browser.mjs` (needs a WebGL browser;
  the globe plate is exercised through the pure geometry tests, canvas
  syntax, and the check suite instead).
- `planet-viewer-4dwm.xdc` is untouched: by standing direction that
  filename carries the SoCal package.

## Next

S4 is complete. Open backlog fronts: S5 (live incident/camera layers,
*open*), S6 (ARPANET 1971/1977 time slices; redistributable nodelist
only if rights clear), S2 (sneakers-press-kit.xdc layout verification),
S1/S7/S8 residuals that need binaries or hardware.
