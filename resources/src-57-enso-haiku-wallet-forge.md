# Ensō Haiku Wallet Forge

> **Register:** src-57 · **Original:** https://bashupload.app/lahh89.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

The most instrumented build of the ensō/key line: a forge that surfaces every parameter of
the wallet and the circle side by side, and encodes all of them into a single printable
reference number.

## Controls

`⊙ FORGE` · `✦ SPELL CHECK` · `↷ SKIP HAIKU` · `✦ SAVE WALLET` · `⬇ DOWNLOAD PNG`

- **FORGE** — generate; UI state reads "FORGING WALLET… / Generating entropy…"
- **SPELL CHECK** — validates the haiku line before the wallet is kept
- **SKIP HAIKU** — discard the current poem and draw again
- **SAVE WALLET** / **DOWNLOAD PNG** — persist the wallet, export its ensō

## Readouts

- **Haiku** · **Seed Phrase** · **Wallet** — "Press FORGE to begin…"
- **BIP-39 Mnemonic** (click to copy) · **12/24 Words** toggle · **BIP-44 Path**
- **Master Public Key (xpub)** · **Address (Bitcoin P2PKH)**
- **Wallet ID (SHA-256 Fingerprint)** · **CHECKSUMS**
- **Ensō Parameters** — the drawing inputs behind the circle

## Ensō Reference Number

"Unique seed encoding all parameters" — the full parameter set (wallet and circle) reduced to
a single **Ensō Number, Base-62 encoded**. The circle *is* the backup: the number is a
compact, human-copyable handle for everything that produced it.

## Stated posture

> ⚠ For educational/demonstration purposes. Do not use for storing real funds without
> independent verification.

Footer state at capture: "Ready — Offline standalone mode · OFFLINE ✓"
