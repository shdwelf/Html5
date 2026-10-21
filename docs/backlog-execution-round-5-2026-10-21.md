# Backlog execution round 5 — 21 Oct 2026

*Fifth parallel execution round against [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).*
*Streams advanced: **S3, S10, S1** + the new GTA decoder request.*
*Rounds: [1](backlog-execution-round-1-2026-10-21.md) · [2](backlog-execution-round-2-2026-10-21.md) ·
[3](backlog-execution-round-3-2026-10-21.md) · [4](backlog-execution-round-4-2026-10-21.md).*

Round 5 executes the new headline request (**GTA `asc()+1` decoder**) and the
remaining stream work named at the close of round 4: the **Sierra/Shadow President
sweep** (S3) and **thin-category sourced ops** (S10). The DOSBox/Warrick items stay
sandbox-gated (no `dosbox`/`Xvfb` host binaries; live-archive crawling out of scope
— relay runbooks unchanged).

## Delivered

| Artifact | Stream | What it closes |
| --- | --- | --- |
| [`gta-text-decoder-2026-10-21.md`](gta-text-decoder-2026-10-21.md) | new request | **GTA text decoder** (`gtaText` op): per-byte `asc()+1` codec, pinned pairs incl. `GOURANGA`↔`HPVSBOHB` |
| [`sierra-shadow-president-sweep-2026-10-21.md`](sierra-shadow-president-sweep-2026-10-21.md) | S3 | Sierra Easter-egg/walkthrough catalogue sweep, *Shadow President* dossier, Game Wizard 32 notes, Ghidra-encryption cross-refs |
| `tools/verify_uhs_gamegenie.mjs` (extended) | S3 | **Sega Game Gear Game Genie** codec (`decodeGGG`/`encodeGGG`, SMSPower DDA-AAA-RRR format) + 8 published Sonic GG codes — all five Galoob formats now covered |
| 5 sourced registry ops | S10 | thin categories: **Crypto** `aesKeySched` (FIPS 197), **MAC** `aesCmac` (RFC 4493), **Text** `base45` (RFC 9285) + `gtaText`, **Math** `gf256` (FIPS 197 §4), **Secret Sharing** `mignotte` (Stinson CRT) |
| 4 recipe packs | S10 | one-pack spotlights for the RFC/FIPS vectors + Mignotte + GTA codec |
| `tests/cyberchef-round5-ops.test.mjs` | S10 | 8 tests: known-answer vectors + independent `node:crypto` CMAC + independent CRT |

## Thin-category census (before → after)

| Category | Before | After | New ops |
| --- | --- | --- | --- |
| Crypto | 1 (`xorBrute`) | 2 | `aesKeySched` |
| MAC | 1 (`poly1305`) | 2 | `aesCmac` |
| Text | 1 (`typoglycemia`) | 3 | `base45`, `gtaText` |
| Math | 1 (`vecAlu`) | 2 | `gf256` |
| Secret Sharing | 1 (`shamir`) | 2 | `mignotte` |

Registry: 500 → **506 recipes** (`mergedRuntime` 478 + 28 post-merge ops;
`tests/cyberchef-recipe-sync.test.mjs` and `tests/cyberchef-sfx.test.mjs` gates updated).

## Known-answer vectors pinned this round

- **RFC 4493 §4** (AES-CMAC): subkeys `K1=fbeed618…7236a8de`, `K2=f7ddac30…e46d513b`
  and all four example MACs (empty → `bb1d6929…`, 16/40/64-byte messages), each
  cross-checked against an independent `node:crypto` AES-ECB CMAC in the test.
- **RFC 9285 §4.3/4.4** (Base45): `AB`→`BB8`, `Hello!!`→`%69 VD92EX0`,
  `base-45`→`UJCLQE7W581`, `QED8WEX0`→`ietf!`.
- **FIPS 197**: §4.1 `{57}+{83}={d4}`; §4.2 `{57}·{83}={c1}`; §4.2.1 xtime chain
  `02=ae 04=47 08=8e 10=07`, `{57}·{13}={fe}`; §5.1.1 `inv({53})={ca}` (→ S-box
  `{ed}`); Appendix A.1 words `w4=a0fafe17 … w7=2a6c7605`, `w8..w11=f2c295f2 …
  7359f67f`; Appendix **C.1 full round-key table** for key `000102…0f` (11 round
  keys, ending `13111d7f…30c5`).
- **Game Gear Game Genie** (SMSPower format + gamegenie.com Sonic 1/2 lists):
  8 published codes round-trip exactly; cloak = 8 in all of them, as published.
- **Mignotte CRT sharing** (Stinson): round-trip via independent CRT + Mignotte
  bound/coprime rejection. Labelled *classic textbook scheme, no published KAT
  claimed* in the op description.

## Gated checks (unchanged)

- S2/S2′ DOSBox+Xvfb sneakers smoke — host tools absent; script ready.
- S12 Warrick + F3 relay items — live-archive crawling out of scope; runbooks stand.

## Test tally at round-5 close

| Suite | Result |
| --- | --- |
| `tests/cyberchef-round5-ops.test.mjs` | 8 PASS |
| `tests/uhs-gamegenie.test.mjs` (incl. Game Gear) | 11 PASS |
| `tests/cyberchef-recipe-sync.test.mjs` + `tests/cyberchef-sfx.test.mjs` | 3 PASS |
| round-4 suites (GB ROM, AES/NaCl, haiku) | unchanged, green |

## Next (round 6)

- S1: LHA/ARJ/ACE cookbook-level password-recipe notes (F2/F4-constrained docs).
- S3: Sierra message-table cross-grep RE pass (the sweep's own recommendation);
  Game Wizard 32 BIOS-checksum installer note into the protection encyclopedia.
- S10: spotlight packs for full-coverage-only hub ops (comparison doc §findings).
- Gated: DOSBox smoke + Warrick on the relay runner.
