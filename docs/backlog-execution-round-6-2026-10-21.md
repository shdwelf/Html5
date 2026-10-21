# Backlog execution round 6 — 21 Oct 2026

*Sixth parallel round against [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).*
*Streams advanced: **S1, S3, S10**. Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md).*

Round 6 executes the round-5 “Next” column: ARJ/LHA/ACE password notes at
cookbook level (S1), the Sierra message-table cross-grep pass and the Game
Wizard 32 protection entry (S3), and the spotlight-pack enhancement pass (S10).
DOSBox/Warrick items remain sandbox-gated as before.

## Delivered

| Artifact | Stream | What it closes |
| --- | --- | --- |
| [`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md) | S1 | cookbook-level password/“garble” notes for ARJ, LHA, ACE + SFX identification recipe (F2/F4-constrained) |
| `tools/sierra_xgrep.mjs` + `tests/sierra-xgrep.test.mjs` | S3 | the sweep's own recommendation, operationalized: cross-title egg-string sweep over a resource corpus (8 sourced needles, context reports) |
| [`software-protection-encyclopedia.md`](software-protection-encyclopedia.md) “Machine-binding installers” | S3 | Game Wizard 32 BIOS-checksum installer binding, studied as hardware fingerprinting (F4 posture) |
| `scripts/compare-cyberchef-recipe-packs.mjs --spotlights` | S10 | the promised enumerator: **144 tour-only ops** (every containing pack is a Full-Coverage tour), **0 orphan ops** |
| 13 themed “Spotlight — …” recipe packs | S10 | Caesar/ROT family, classical grids, classic hashes, block/stream ciphers, steganography lab, post-quantum, FIDO hardware keys, esolangs/CA, EXE protection, virus analysis, GCWizard ciphers, coin addresses, public-key classics |

## S1 findings (cookbook level, sources cited in the doc)

- **ARJ** “garbling” (`GARBLED_FLAG`, `-g`): XOR with a repeating keystream
  derived from the password — verified in-house against the KGK.ARJ header;
  F2 preserve-only, F4 no cracking recipes.
- **LHA/LZH** has **no first-party encryption at all** (Yoshizaki `lhx.doc`
  header spec, `lhasa` man page, format references agree) — “password LHA”
  means a third-party wrapper or a mislabeled format; the only verifier is the
  member CRC16. The cookbook's job here is identification, not crypto study.
- **ACE** is the real-cipher case: password (≤50 chars) → single SHA-1 →
  160-bit Blowfish key; CBC with constant **zero IV**, applied after
  compression, restarted per member; **no password verifier** (CRC32-only
  confirmation). Sources: Lemke's `ace-doc.txt` (May 1998), `acefile` docs,
  `ace-c` reimplementation notes. CVE-2018-20250 (`unacev2.dll`) recorded as an
  SFX handling hazard.

## S10 snapshot

| Metric | Before (round 3 comparison) | Now |
| --- | --- | --- |
| Spotlight-gap query | promised (`compare --spotlights`) | **implemented and run** |
| Tour-only ops | 144 (enumerated on demand) | 144 total; 44+ covered by 13 new themed spotlights |
| Orphan ops | unknown | **0** (every registry op sits in ≥1 pack) |
| Packs | 152 + 4 (round 5) | +13 themed spotlights |

The remaining tour-only ops (mostly the long GCWizard tails and per-coin format
ops) stay enumerated on demand via `--spotlights`; batches of one-op/themed
labs can continue mechanically.

## Test tally at round-6 close

| Suite | Result |
| --- | --- |
| `tests/sierra-xgrep.test.mjs` | 5 PASS |
| `tests/cyberchef-recipe-sync.test.mjs` + `tests/cyberchef-sfx.test.mjs` (pack entry validity) | 3 PASS |
| round-5 suites (`cyberchef-round5-ops`, `uhs-gamegenie`) | unchanged, green |

## Next (round 7)

- S10: more spotlight batches for the remaining ~100 tour-only ops (GCWizard
  alphabet tail, per-coin keypair ops) — mechanical via `--spotlights`.
- S3: run `sierra_xgrep` on any locally supplied Sierra dumps (F3: relay/user
  captures only) and file hits back into the sweep doc.
- S1: ZIP legacy “garble”/ZipCrypto note to round out the SFX password table
  (the encyclopedia already carries the PKZIP entry).
- Gated: DOSBox sneakers smoke; Warrick relay runs.

## Housekeeping

The harness re-cloned the workspace before this round (history reset to the PR
base with work re-applied as untracked files). Recovered via `git fetch` +
index-vs-origin comparison (byte-identical) + `git reset --hard` to
`e8d271d` before continuing — no content lost, no duplicate commits.
