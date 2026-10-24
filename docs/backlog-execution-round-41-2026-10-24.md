# Backlog execution — round 41 (2026-10-24)

**Stream:** S4 country thread — batch C1 (PC-Globe-style country viewer seed).
**Branch:** `arena/8c721d44-html5` (from `main` at `28b0b67`, the PR #147 merge,
which completed the 50-state atlas at 58 frames; PR #145 closed as superseded).
**Result:** the country thread is open: a working PC-Globe-style country viewer
over a pinned, hash-verified 25-country Factbook seed register.

## What shipped

- **`country-viewer.html` + `js/country-viewer.js`** — an offline PC-Globe-style
  viewer: searchable country list, equirectangular dot map of country reference
  points (selected country highlighted, capital marked), and a Factbook detail
  panel (capital + coordinates, reference point, total area, population,
  languages, government type, and the **national anthem** title and
  lyrics/music credit — the backlog's "national anthem/instrument" note).
  Anthem audio is not bundled; the title/credit text is shown as published.
- **`resources/country-viewer/country-factbook-batch1-source-register-2026-10-24.json`**
  — the frozen source register: 25 countries (US, CA, MX, GT, BR, AR, UK, FR,
  DE, IT, ES, UA, SF, EG, NI, TR, IL, KZ, RU, IN, CN, JP, ID, AU, NZ by Factbook
  FIPS codes) extracted **verbatim** from the CIA World Factbook as mirrored by
  `factbook/factbook.json`, pinned at upstream commit `144d6977b2b0` with a
  SHA-256 per country file (CC0 mirror; Factbook content is public domain).
  The raw upstream files are not committed — the register's hashes pin them,
  mirroring the GNIS extract convention. `tools/fetch_factbook_countries.py`
  regenerates the register; `scripts/build-country-viewer-data.mjs` reshapes
  it into `js/country-data.js`.
- **`tests/country-viewer.test.mjs`** — the register↔dataset deep-check oracle
  (every generated field equals the register's pinned extraction; coordinates
  and anthem presence asserted per country) plus helper/page-wiring tests.

## Verification

- Country tests: 2/2. Full Node suite: see the PR description.
- Extraction honesty notes: Factbook text is stored cleaned (HTML tags and
  entities stripped, whitespace normalized) but never reworded; France's
  multi-territory coordinate field resolves to its first (metropolitan) point,
  and countries whose Factbook anthem entry covers multiple anthems keep the
  published title string (both recorded here rather than editorialized).

## Next in thread

Expand country coverage in batches (C2…), package the viewer as a Webxdc,
then the remaining S4 sequencing: the Ghidra PC Globe→Java experiment and the
Red October globe → planet viewer step.
