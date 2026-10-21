# Backlog execution round 12 — 21 Oct 2026

*Twelfth round: “Continue backlog” — the round-11 carry-over list. Rounds:
[1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| [`zip-garble-format-notes.md`](zip-garble-format-notes.md) | **S1 remainder — the ZIP legacy-garble note**: the two “garbles” (code-page filename mojibake vs ZipCrypto garbage), flag bits 0/6/11, the 12-byte encryption header + 8-bit verify byte (1/256 wrong-password false accepts → “garbled with the right password”), Biham–Kocher/Stay known-plaintext at format level, AES/strong-encryption contrast, offline triage recipe; F2/F4 boundaries inherited from the ARJ notes. **S1 fully closed.** |
| `polyglotScan` CyberChef op + `tests/cyberchef-polyglot-scan.test.mjs` | **registry**: `tools/polyglot_scan.mjs` as op `polyglotScan` (category Data, hex/text input, kitCard report) + spotlight pack “Polyglot & format triage”; POST_MERGE_OPS 28→29, sfx `+28`→`+29`, header 506→507 recipes; 4 JSDOM known-answer tests |
| [`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md) (fix) | corrected the registry claim — `paranoidUnzip`/`arjHeader`/`lhaHeader`/`aceHeader` were never implemented; the doc now says so explicitly |

## Findings worth keeping

- **ZipCrypto false-accept** is the literal “garbled archive with the correct
  password” experience: the verify byte is 8 bits (1/256), and its *variant*
  (CRC-high-byte vs old PKZIP mod-time byte) depends on the writer — record
  both in any triage note (zip-garble §3).
- Registry gotcha: an op's `select` arg default is **not** auto-applied when
  tests call `op.run(input, {})` — treat `undefined` as the default inside the
  run function (`const fmt = a && a.inputfmt ? a.inputfmt : 'auto'`), or hex
  auto-detect silently falls back to text mode. `RECIPE_PACKS` is a keyed
  object, not an array (`Object.keys` in tests).

## Test tally at round-12 close

| Suite | Result |
| --- | --- |
| `tests/cyberchef-polyglot-scan.test.mjs` (new) | 4 PASS |
| `tests/cyberchef-recipe-sync.test.mjs` + `cyberchef-sfx.test.mjs` (counts now 29) | PASS |
| john-audit 5 · mime 6 · toy-mz 6 · polyglot-cli 8 · cow 5 · sierra 5 · uhs 11 · round5 8 | unchanged, green |

## Next (round 13)

- Spotlight packs batch (TomTom-slash round-trip, MIME triage with
  `polyglotScan`+checkUpload patterns); optional md5crypt/sha512crypt vectors
  beside the sha256crypt audit.
- `arjHeader`/`lhaHeader`/`aceHeader`/`paranoidUnzip` ops (now explicitly
  listed as missing) — candidates for the next registry round.
- HVD/Puzzle Code glyph tiles pending font terms.
- Gated: DOSBox sneakers smoke; Warrick relay runs.
