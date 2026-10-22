# Backlog execution round 4 — 21 Oct 2026

*Fourth parallel execution round against [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md).*
*Streams advanced: **S10, S3** (S2/S12 gated as before).*
*Rounds: [1](backlog-execution-round-1-2026-10-21.md) · [2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md).*

Round 4 executes the two live threads from the latest instruction —
**"Convert cyberchef to Gameboy rom"** and **"try aes nc recipe"** (resolved:
AES + NaCl recipe families) — with a third (backlog continuation) folded into
their streams.

## Delivered

| Artifact | Stream | What it closes |
| --- | --- | --- |
| [`cyberchef-gb-rom-2026-10-21.md`](cyberchef-gb-rom-2026-10-21.md) | S3 / S10 | "Convert CyberChef to Game Boy ROM": a bootable 32 KB DMG ROM whose on-screen program runs the verified UHS-88a recipe (`gHrGtGs iqrGr` → `Opening Scene`) live on the LR35902 |
| `tools/build_cyberchef_gb.mjs` | S3 | ROM builder: two-pass LR35902 mini-assembler, Nintendo header + checksums, public-domain 8×8 font → 2bpp tiles (tile index = ASCII), CLI → `dist/cyberchef-gb/cyberchef.gb` + sha256 |
| `tests/cyberchef-gb-rom.test.mjs` | S3 | Independent LR35902 emulator executes the finished ROM and checks the tile map against `decrypt88a` from the verified UHS port — 4 tests |
| `vendor/font8x8_basic.h` | S3 | dhepper/font8x8 public-domain glyph source for the ROM tiles |
| [`aes-nacl-recipe-checks-2026-10-21.md`](aes-nacl-recipe-checks-2026-10-21.md) | S10 / S1 | "Try aes nc recipe": AES + NaCl recipes pinned to known-answer vectors — 9 tests |
| `tests/aes-nacl-recipe-vectors.test.mjs` | S10 | `naclSecretbox` vs the **official NaCl vector** (+ tweetnacl cross-check), `aesGCM`/`aesCBC` vs an independent `node:crypto` PBKDF2+AES re-derivation, `saltpackEncrypt` seal/open round-trip |

## Headline findings

1. **The CyberChef lab's crypto is not just plausible — it matches official
   artifacts.** The lab's from-scratch XSalsa20-Poly1305 (`secretbox` in the
   app) produces the exact official NaCl test-vector box (`f3ffc770…`, 147 B),
   and the op's UI defaults *are* the official example key/nonce. tweetnacl
   agrees in both directions. The AES recipes round-trip through an
   independent `node:crypto` pipeline (PBKDF2-SHA256 100k, salt = iv).
2. **ROM-level recipes are testable without ROM toolchains.** The GB builder
   plus an opcode-subset emulator is a closed loop: the emulator caught three
   real first-build bugs (entry jump little-endian typo; `ld_rr_nn`
   size/encode mismatch drifting every label 15 bytes; tile-clear loop
   clobbering `A` with the loop counter). The builder now self-guards the
   size/encode invariant.
3. **Mixed case matters:** the published UHS-88a pairing is
   `gHrGtGs iqrGr` → **`Opening Scene`**, not the all-caps rendering used in
   older notes. The ROM displays the published pairing.

## Gated checks (unchanged)

- **S2 sneakers DOSBox/Xvfb smoke** — host tools absent; script ready.
- **S12 Warrick + F3 relay items** — archive.org/external hosts unreachable
  from the sandbox; runbooks from round 2 stand.

## Round status

| Stream | Rounds 1–4 | Next (round 5) |
| --- | --- | --- |
| S1 crypto/archive | Recipes + matrix + NaCl/AES vector checks | LHA/ARJ/ACE spotlight ops (S10 finding); relay BagIt |
| S2 Sneakers | Toolkit + scripts | Hosted DOSBox smoke |
| S3 retro-game RE | UHS + NES/SNES/GEN/GB GG vectors + **GB CyberChef ROM** | Sierra/Shadow President sweep; Game Gear vector |
| S9 vault/stego | Haiku-vault spec + vectors | Shufflecake notes; F3 captures |
| S10 CyberChef corpus | 225-pack comparison + AES/NaCl vector pass + ROM recipe | Thin-category sourced ops (Crypto/MAC/Text/Math) |
| S12 Cicada/Warrick/Geomate | Geometry audit + Warrick recipes | Relay-gated execution |

## Test tally at round-4 close

| Suite | Result |
| --- | --- |
| `tests/cyberchef-gb-rom.test.mjs` | 4 PASS |
| `tests/aes-nacl-recipe-vectors.test.mjs` | 9 PASS |
| `tests/uhs-gamegenie.test.mjs` + `tests/haiku-vault-format-vector.test.mjs` | 14 PASS |
| sneakers press-kit vectors | 3 + 3 PASS (round 1) |
| `tools/verify_uhs_gamegenie.mjs` | 24 checks PASS (round 3) |
