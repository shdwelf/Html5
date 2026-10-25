# Backlog execution round 13 — 22 Oct 2026

*Thirteenth round: “Continue backlog” — the round-12 carry-over list, executed
in full (non-gated items). Index: [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).
Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md) · [11](backlog-execution-round-11-2026-10-21.md) ·
[12](backlog-execution-round-12-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| `arjHeader` / `lhaHeader` / `aceHeader` / `paranoidUnzip` CyberChef ops + `tests/cyberchef-archive-headers.test.mjs` | **registry (round-12 queue)**: the four explicitly-missing archive ops, as header-only inspectors (category Data, hex/latin1 input, kitCard reports). ARJ = magic scan + per-header CRC-32 mirroring `tools/arjwalk.py`; LHA = level-0/1/2 walk (header sum, level-1 skip-size − ext-headers, level-2 header CRC with the stored field zeroed) per `jca02266/lha` `header.doc.md` + `src/header.c`; ACE = block walk with header CRC-16 (low half of the un-inverted CRC-32) per `droe/acefile`; ZIP = EOCD/central-directory audit with local-header cross-checks, SFX-delta correction and ZIP64 extra-field resolution per PKWARE APPNOTE. **F2/F4 posture: no decompression, no decryption, no extraction anywhere.** Registry 507→511 (POST_MERGE_OPS 29→33, sfx `+29`→`+33`, header badge 511, `cyberchef.xdc` rebuilt). 10 tests over synthetic fixtures |
| `tools/md5crypt.mjs` / `tools/sha512crypt.mjs` + `tests/john-md5crypt-sha512crypt-vectors.test.mjs` | **round-11/12 optional, John open-question-4 extension**: `$1$` (Poul-Henning Kamp) and `$6$` (Drepper) verifiers beside round-11's `$5$`, wired to JtR's **published** `fmt_tests` vectors (`src/MD5_fmt.c`, `src/sha512crypt_common.h`, same pin `5184bc0b8c10`): 11 md5crypt + 12 sha512crypt fixtures + one `rounds=391939` case kept out of the wrong-password loop (~1 s/verify). Verification only (F4). 7 tests |
| Spotlight packs ×4 | **spotlight batch (round-12 queue)**: “Archive header triage” (polyglotScan + the 4 new ops — the MIME-triage intent: sniff magics, then per-format header detail; the claimed-vs-actual check itself stays in `tools/mime_lookup.mjs`), “TomTom slash round-trip” (`gcwTomTinesWin` encode→decode, now test-pinned: `ANZ` vector + full-alphabet identity), “SHA-2 & checksums” and “Data encodings” (10 tour-only ops get thematic packs; `--spotlights` recount 95→85 tour-only, 0 orphans, 247 packs) |
| [`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md) (correction) · [`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md) §4 · [`omniglot-recipes-deep-dive-2026-10-21.md`](omniglot-recipes-deep-dive-2026-10-21.md) §4 | ACE flag erratum (below); polyglot doc flips the four ops from “not yet implemented” to implemented; omniglot doc records the TomTom spotlight landing |
| Cookbook card + `tests/cyberchef-cookbook.test.mjs`; `wikiinajar.xdc` rebuild | **stale-artifact sweep found by baseline testing**: see Findings (3)–(4) |
| [`agent-backlog-2026-10-21.json`](agent-backlog-2026-10-21.json) (reconciled) | S1 status `partial`→`done` (round 12 closed it; T1.1 stays grouped under S13), S3/S10 next-actions refreshed, T10.1 note updated |

## Findings worth keeping

1. **ACE password flag is bit 14, not bit 3.** The round-6 password-notes doc
   said `HEAD_FLAGS` bit 3 = encrypted. Two independent implementations agree
   on FILE-header bit 14 (`16384`): `acefile` (`FLAG_PASSWORD = 1 << 14`,
   the predicate behind `AceMember.is_enc()`) and unace
   (`BASE_ACESTRUC_FLAG_PASSWORD 16384 //file`; bit 14 is `LOCK` in MAIN
   headers). Proven end-to-end: the synthetic ACE built for the new test file
   parses in upstream `acefile`, with `is_enc()` true exactly for the bit-14
   member. Doc corrected in place with a dated note (§5).
2. **Synthetic fixtures triangulated against independent parsers** before the
   ops were trusted: Python `zipfile` reads the fixture ZIP (incl. CRC check),
   in-repo `tools/arjwalk.py` parses the fixture ARJ field-for-field,
   upstream `acefile` parses the fixture ACE, and PyPI `lhafile` lists all
   three fixture LHA members (level 0/1/2). Checksum builders are anchored to
   textbook values (`crc32("123456789") = 0xCBF43926`, ACE CRC-16 = 50905 per
   acefile doctests, CRC-16/ARC = 0xBB3D) so builder/parser circularity
   cannot hide a wrong CRC.
3. **`cyberchef.xdc` and the cookbook were both stale at 500 recipes** —
   the xdc shipped the pre-round-5 registry (its freshness test in
   `webxdc-packages` was red at baseline) and the cookbook count test has
   been red since round 5 added the 501st op (rounds 5 and 12 updated
   POST_MERGE/sfx/header but not the cookbook card, the test's hardcoded 500,
   or the xdc). Now: card + test say 511 (“511 of 511”, historical counts
   preserved), xdc rebuilt (1,078,149 bytes). Registry-add checklist for
   future rounds is therefore **five** places: POST_MERGE_OPS, sfx `+N`,
   header badge, cookbook card+constant, and `npm run build:cyberchef`.
4. **The wikiinajar bundled corpus was likewise stale** (155 staged pages vs
   201 root/docs `*.md` at baseline, its test red). Rebuilt via
   `npm run build:wikiinajar` after this round's doc edits, so staged
   `docs.json` + `wikiinajar.xdc` again carry one converted page per file.
   Any round adding a `.md` must re-run that build.
5. **Full-suite baseline, for the record:** `node --test tests/*.test.mjs`
   = 703 tests. At round-13 close the only failures are 17
   `mealplan-applet-sim` cases requiring a JDK8 toolchain at
   `.cache/applet-toolchain/…` (absent in this sandbox, `ENOENT` —
   environmental, pre-existing, untouched by this round). The two baseline
   failures from Findings (3)–(4) are fixed.
6. **Format details that bit during implementation:** LHA level-1's
   `packed` field is a *skip* size (data + ext headers; true data =
   skip − ext total); the level-2 header CRC covers the whole header with
   its own two stored bytes zeroed; ACE “CRC-16” is the standard CRC-32
   *without* the final inversion, truncated — `std ^ 0xFFFFFFFF`, low half;
   ZIP readers must derive the SFX prefix from
   `eocdPos − (cdOffset + cdSize)` and correct every local offset by it;
   md5crypt's bit loop appends a NUL byte (bit set) or the first password
   byte (bit clear) — and the salt is literal bytes, which is why JtR's
   “invalid salt” fixture (`$1$` + backtick-punctuation) verifies.

## Verification notes

- Crypt vectors cross-oracled during development with `openssl passwd -1/-5/-6 -salt …`
  and Python `crypt` (both reproduce the pinned JtR fixtures used here).
  All passwords/salts are the published non-secret fixture strings (F4).
- Gated items unchanged and re-verified as gated: no DOSBox/Xvfb in the
  sandbox (Sneakers smoke stays on the relay runner), Warrick runs need the
  relay (F3), HVD/Puzzle Code glyph tiles still need font/image terms,
  S5/S8/S13 still need external hosts (F3).

## Test tally at round-13 close

| Suite | Result |
| --- | --- |
| `tests/cyberchef-archive-headers.test.mjs` (new) | 10 PASS |
| `tests/john-md5crypt-sha512crypt-vectors.test.mjs` (new) | 7 PASS |
| `cyberchef-recipe-sync` + `cyberchef-sfx` (counts now 33 / 511) | PASS |
| `cyberchef-polyglot-scan` 4 · `cyberchef-round5-ops` · `cyberchef-cookbook` (fixed) · `webxdc-packages` (fixed) · john-audit 5 · polyglot-cli 8 · mime 6 | PASS (68 targeted tests total) |
| `tests/wikiinajar.test.mjs` (corpus rebuilt) | PASS |
| full `node --test tests/*.test.mjs` | 703 tests; only the 17 JDK-environmental sim cases fail (see Finding 5); 12 skipped |

## Next (round 14)

- Spotlight batches for the remaining 85 tour-only ops (mechanical via
  `--spotlights`); optional `polyglot_scan` MIME fields (carried since
  round 11, still open).
- Stream backlog beyond the registry line: S4 California viewer sequencing,
  S6 Keyhole/FidoNet deep dive, S7 goldkey CAD completeness (local,
  non-gated candidates); S5/S8/S13 await relay fetches (F3).
- HVD/Puzzle Code glyph tiles pending font terms.
- Gated: DOSBox sneakers smoke; Warrick relay runs; mealplan applet sim JDK.
