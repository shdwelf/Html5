# Backlog execution round 14 — 22 Oct 2026

*Fourteenth round: “Continue backlog” — the non-gated round-13 carry-overs:
spotlight closure, `polyglot_scan` MIME fields, and an S7 completeness audit.
Lands as a second commit on PR #129. Index:
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md) · [13](backlog-execution-round-13-2026-10-22.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| 18 new `Spotlight — …` recipe packs in `public/apps/cyberchef/index.html` + `tests/cyberchef-spotlight-coverage.test.mjs` | **T10.1 spotlight queue, closed**: every one of the 85 tour-only ops (ops whose only packs were `Full Coverage — <category>` tours) now has a thematic pack — Classical II (9), Electronics lab (10), Keypairs/agreement/generators (8), Coins II (7), GCWizard tools + alphabet bundles I/II (16), Boxentriq ciphers + utilities (8), Analysis (4), Educational/visual (5), File & link encryption (3), Text encodings II (3), Parity/LRC/HMAC (3), Wallets & sharing (3), Calculator (3), Hardware-key extras (2), Recipe pack loader (1). `--spotlights` recount: **tour-only 85→0**, orphans 0, packs 247→265 (809 entries), still 511 ops. Pinned by the new 2-test coverage suite so the queue cannot silently reopen |
| MIME fields in `tools/polyglot_scan.mjs` + registry `polyglotScan` mirror + tests | **round-11 optional, closed**: every signature and every match now carries its IANA media type (names consistent with `tools/mime_lookup.mjs` and the docs/README quick-reference; CAB uses the registered `application/vnd.ms-cab-compressed`). CLI prints `+off NAME (mime)`; the op report does likewise. Tests: export-surface now asserts a MIME label per signature, known-answer matches (GIF/PNG/ZIP/MZ/ARJ), and the op's `(image/gif)` / `(application/zip)` output |
| `test/cyberchef-ghidra-recipes.test.ts` (fix) | fallout fix, see Finding 2 |
| S7 audit record (below) + backlog JSON refresh | **S7 candidate checked**: no code change needed; remaining S7 work explicitly re-scoped |
| `cyberchef.xdc` rebuilt · `docs/agent-backlog-2026-10-21.json` · `docs/README.md` · `wikiinajar.xdc` rebuilt | registry-change workflow (op count unchanged at 511, so cookbook/badge strings are stable; corpus gains this page) |

## Findings worth keeping

1. **“Tour-only = 0” is worth a pinned test, not just an enumerator run.**
   The metric lived only in `compare-cyberchef-recipe-packs.mjs
   --spotlights` output, which is how it sat at 144→95→85 across rounds
   without anything failing. `tests/cyberchef-spotlight-coverage.test.mjs`
   reimplements the same definition (every containing pack matches
   `/full coverage/i`) against the booted registry, so a future op added
   with only a Full Coverage entry — or a deleted spotlight — fails CI.
2. **Loop-generated op ids are invisible to static `addOp('…')` scans.**
   Six Electronics ops register as `addOp('ic' + g.name, …)` over the
   `GATES` table (`icAND`…`icXNOR`). `test/cyberchef-ghidra-recipes.test.ts`
   derives “implemented” ids from a plain `addOp('([^']+)'` regex — correct
   for 506 of 511 ids, and dormant only because those six appeared solely in
   a non-literal `RECIPE_PACKS["Full Coverage — Electronics"]` assignment.
   The new Electronics spotlight (inside the literal the test parses)
   exposed it. The test now materialises the GATES loop ids explicitly;
   the runtime truth stays pinned by the JSDOM suites
   (`cyberchef-recipe-sync`, `cyberchef-spotlight-coverage`). Any future
   loop/table-generated registration must be taught to that static test too.
3. **S7's automated completeness checks are already green** — the stream's
   remaining work is not a CAD gap: `npm run check:unit-cad` passes 54/54
   (with one vendor-data conflict on record: the nMU's published dims
   `19 × 7.3 × 4.3 in` contain no 3.5 in value although the unit is
   described as 2U; panel height uses the EIA-310-D 3.5 in standard) and
   `tests/gina-driver-guide-check.test.mjs` passes 29/29. What remains in
   S7 is the master/grandmaster write-up and the uClinux softmodem-fax JAR
   build — the latter is JDK-gated in this sandbox (no `java` on PATH,
   same gate as the mealplan sim suite).

## Verification notes

- Pack membership was generated from the enumerator's own 85-id ground
  truth and asserted exact (no duplicates, no extras) before splicing,
  then re-enumerated after the splice (tour-only 0) and audited
  (`audit-cyberchef-sfx-coverage`: 511/511 select-all).
- Gated items unchanged: DOSBox sneakers smoke + Warrick relay (runner),
  HVD/Puzzle Code glyph terms, S5/S8/S13 external hosts (F3), JDK
  toolchain (mealplan sim + S7 JAR).

## Test tally at round-14 close

| Suite | Result |
| --- | --- |
| `tests/cyberchef-spotlight-coverage.test.mjs` (new) | 2 PASS |
| `tests/polyglot-scan.test.mjs` (9, incl. new MIME KAT) + `tests/cyberchef-polyglot-scan.test.mjs` | PASS |
| targeted batch (spotlight · polyglot pair · recipe-sync · sfx · cookbook · archive-headers · mime) | 39 PASS |
| vitest cyberchef subset (7 files, incl. fixed ghidra-recipes) | 42 PASS |
| `check:unit-cad` 54 checks · `gina-driver-guide-check` 29 | PASS (S7 audit) |
| full `node --test tests/*.test.mjs` | 706 tests: 677 pass, 12 skipped, only the 17 JDK-environmental sim cases fail (pre-existing) |

## Next (round 15)

- Beyond the registry line: S4 California-viewer sequencing, S6
  Keyhole/FidoNet/ARPANET + payphone layers (research docs + layer data),
  S7 hierarchy write-up; S5/S8/S13 await relay fetches (F3).
- HVD/Puzzle Code glyph tiles pending font terms.
- Gated: DOSBox sneakers smoke; Warrick relay runs; JDK toolchain items
  (mealplan sim, uClinux fax JAR).
