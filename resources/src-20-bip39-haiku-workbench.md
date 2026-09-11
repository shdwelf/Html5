# BIP-39 Haiku Workbench · Mnemonic Validator & Derivation Explorer (build 1)

> **Register:** src-20 · **Original:** https://bashupload.app/58mcz5.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

## step 1 · validation — Paste a phrase
"Everything is computed in this tab with audited @scure libraries. No network calls, no storage."

### 🔍 Live checksum engine
2048-word list · SHA-256 checksum · PBKDF2-HMAC-SHA512 × 2048.
Buttons: Random 12 / Random 24 / Clear. Length selector: 12w · 128+4 / 15w · 160+5 /
18w · 192+6 / 21w · 224+7 / 24w · 256+8 (words · entropy bits).

"✓ valid checksum — 12 words · ENT 128b + CS 4b = 132b. 4 checksum bits recomputed from
SHA-256 of the entropy match the phrase exactly. Derivation paths are unlocked below."

#### Binary encoding · 11 bits per word
Entropy/free-entropy/checksum bit visualization per word; entropy (hex); checksum bits
comparison (e.g. `0011 == 0011`); per-word annotation (e.g. `_12_ about _#3_`).

#### Checksum solver · 128 valid final words for this prefix
"7 free entropy bits · 128 surviving candidates" — enumerates every legal closing word
with its index (about #3 … wrap #2032).
**"The last word is not free poetry: its first bits complete the entropy and its final
4 bits are forced by SHA-256. Only 128 of the 2048 words can close this phrase."**

### 🔒 Derivation paths are locked until the checksum passes
"A wallet will refuse to derive keys from an invalid mnemonic — exactly like this page."

## step 3 · the catalogue — Haikus, patterns & reference vectors
"120 curated phrases. Repeated-word patterns show why a checksum can't be guessed; poetic
phrases show why memorable entropy is almost never valid. Every card is verified on load."
**13 valid / 107 invalid.** Filters: All · 11/12 Pattern · 14/15 Pattern · 23/24 Pattern ·
Haiku · Test Vector · valid only.
Pattern cards (e.g. "abandon abandon … abandon art · 12w · 128b · cs 0110 · bad cs" with a
**fix** action that substitutes the checksum-valid closing word); test vectors; haikus.
