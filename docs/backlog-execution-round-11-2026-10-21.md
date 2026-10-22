# Backlog execution round 11 — 21 Oct 2026

*Eleventh round: “Investigate mime-types deep dive · continue researching ·
update wiki with mime types · continue backlog”. Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md) ·
[10](backlog-execution-round-10-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| [`mime-types-deep-dive-2026-10-21.md`](mime-types-deep-dive-2026-10-21.md) | **MIME deep dive**: RFC lineage (2045–2049 → 6838/BCP 13 → 9110/9239/9694), IANA registry + trees + `+suffix`, the declared/extension/sniffed triangle, WHATWG sniffing §7 (incl. “never text/plain→HTML”, the scriptable-type survey), `nosniff` + the redeagle caveat (never replay client-supplied types), RFC 6838 §4.6, repo touchpoints |
| [`tools/mime_lookup.mjs`](../tools/mime_lookup.mjs) + `tests/mime-lookup.test.mjs` | **research tooling**: curated IANA-style magic/extension tables for this corpus; `sniffMime` / `extMime` / `checkUpload` (claimed-vs-actual validation recipe); 6 tests |
| [`README.md`](README.md) (wiki) | **“update wiki with mime types”**: the docs wiki now carries a **MIME quick-reference table** (bytes → media type, serving rule of thumb) + all 186 docs indexed |
| `tools/sha256crypt.mjs` + `tests/john-test-vectors-audit.test.mjs` | **backlog — John/Ghidra open question 4 answered**: JtR's **published sha256crypt `fmt_tests` vectors** (openwall/john `src/sha256crypt_common.h` @ `5184bc0b8c10`) wired into a local, non-secret audit regression — 7 vectors incl. the salt-truncation case; Drepper-spec verifier; 5 tests |

## Findings worth keeping

- **sha256crypt implementation gotchas** (both bit on first run): digest A is a
  *single* hash pass over pwd‖salt‖B-chunks‖bit-loop (pre-hashing pwd+salt is
  wrong), and DP/DS are pwd/salt repeated *N times* (pwdlen² / (16+A[0])·saltlen
  input bytes), not stretched to N bytes. The spec's permuted base64 output
  (0,10,20 / 21,1,11 / … / 0,31,30) is easy to get right by copying glibc's
  order. Python's `crypt` module reproduces the same vectors — a good
  oracle for future hash work.
- **MIME × polyglot is one subject:** labels (`mime-types-deep-dive`) are
  attackable exactly where the bytes are multi-headed (`polyglot-files-deep-dive`);
  the `checkUpload` recipe = sniff + allow-list + never trust the client label.
- Extension-less names must not match any table entry (the ELF `''` ext bug in
  `extMime` — `README` mapped to `application/x-executable`).

## Test tally at round-11 close

| Suite | Result |
| --- | --- |
| `tests/john-test-vectors-audit.test.mjs` (new) | 5 PASS |
| `tests/mime-lookup.test.mjs` (new) | 6 PASS |
| `tests/toy-mz-demo` 6 · `polyglot-scan` 8 · cow-level 5 · sierra 5 · uhs 11 · sync+sfx 3 · round5 8 | unchanged, green |

## Next (round 12)

- ZIP legacy-garble note (S1 remainder — last open S1 item).
- `polyglotScan` CyberChef op (registry add workflow).
- Spotlight packs incl. TomTom-slash round-trip; HVD/Puzzle Code glyph tiles.
- Optional: md5crypt/sha512crypt vectors beside the sha256crypt audit (same
  `fmt_tests` pattern), polyglot_scan MIME fields.
- Gated: DOSBox sneakers smoke; Warrick relay runs.
