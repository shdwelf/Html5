# Backlog execution round 13 — 21 Oct 2026

*Thirteenth round: “Continue backlog” on active branch `arena/a9f65e09-html5`. Previous rounds:
[1](backlog-execution-round-1-2026-10-21.md) · [2](backlog-execution-round-2-2026-10-21.md) ·
[3](backlog-execution-round-3-2026-10-21.md) · [4](backlog-execution-round-4-2026-10-21.md) ·
[5](backlog-execution-round-5-2026-10-21.md) · [6](backlog-execution-round-6-2026-10-21.md) ·
[7](backlog-execution-round-7-2026-10-21.md) · [8](backlog-execution-round-8-2026-10-21.md) ·
[9](backlog-execution-round-9-2026-10-21.md) · [10](backlog-execution-round-10-2026-10-21.md) ·
[11](backlog-execution-round-11-2026-10-21.md) · [12](backlog-execution-round-12-2026-10-21.md).*

## Delivered in Round 13

| Artifact | What it closes / enhances |
| --- | --- |
| `tools/sha512crypt.mjs` | **SHA-512 crypt ($6$) reference implementation**: Ulrich Drepper specification (2007) implementation with round calculation, DP/DS key/salt expansion, round hashing loop, and 64-byte base64 permutation table. Matches Openwall JtR `src/sha512crypt_common.h` test fixtures. |
| `tools/md5crypt.mjs` | **MD5 crypt ($1$) reference implementation**: Poul-Henning Kamp (1994) algorithm with 1000 rounds, B/A digest chaining, and Kamp's 16-byte base64 permutation table. Matches Openwall JtR `src/MD5_fmt.c` test fixtures. |
| `tests/john-test-vectors-audit.test.mjs` | **Multi-algorithm JtR Audit**: Expanded test suite auditing public test vectors for `$5$` (sha256crypt), `$6$` (sha512crypt), and `$1$` (md5crypt), all pinned against JtR `bleeding-jumbo` commit `5184bc0b8c10`. Total 7 audit tests covering standard passwords, empty passwords, salt truncations, and non-default rounds. |
| `public/apps/cyberchef/index.html` | **Spotlight — Omniglot & A-tom-tom pack**: Added spotlight recipe pack integrating `gcwTomTinesWin` configured for A-tom-tom slash/backslash encoding. |

## Test tally at round-13 close

| Suite | Tests | Result |
| --- | --- | --- |
| `tests/john-test-vectors-audit.test.mjs` | 7 | PASS |
| `tests/cyberchef-polyglot-scan.test.mjs` | 4 | PASS |
| `tests/cyberchef-recipe-sync.test.mjs` | 2 | PASS |
| `tests/cyberchef-sfx.test.mjs` | 1 | PASS |
| `tests/mime-lookup.test.mjs` | 6 | PASS |
| `tests/toy-mz-demo.test.mjs` | 6 | PASS |
| `tests/polyglot-scan.test.mjs` | 8 | PASS |
| `tests/cow-level-xgrep.test.mjs` | 5 | PASS |
| `tests/sierra-xgrep.test.mjs` | 5 | PASS |
| `tests/uhs-gamegenie.test.mjs` | 11 | PASS |
| `tests/cyberchef-round5-ops.test.mjs` | 8 | PASS |
| **Total regression suite** | **63** | **63/63 PASS** |

## Next steps

- S2 sneakers press kit: verify keyboard/mouse layout against headline-harry pattern.
- Candidate archive ops: `arjHeader` / `lhaHeader` / `aceHeader` / `paranoidUnzip`.
- HVD / Puzzle Code glyph tiles pending font terms.
- Gated: DOSBox sneakers smoke, Warrick relay runs.
