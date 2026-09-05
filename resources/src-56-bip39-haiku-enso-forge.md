# BIP-39 Haiku Wallet & Ensō Forge

> **Register:** src-56 · **Original:** https://bashupload.app/lcagd1.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

"Mining ensures exact 5-7-5 syllables with a valid BIP39 SHA-256 Checksum."

The build that fuses the two threads of the workshop: a mnemonic that has to scan as strict
5-7-5 haiku *and* validate as a BIP-39 seed phrase, forged together with an ensō drawn from
the same parameters.

## Wallet

- **Mine Haiku Wallet (5-7-5)** — grinds entropy until the phrase is both a checksum-valid
  BIP-39 mnemonic and a metrically correct haiku
- **Ensōgen ID** — identifier tying the wallet to its ensō
- **Checksum** — BIP-39 SHA-256 checksum readout
- **Path:** `m/44'/0'/0'/0/0` (BIP44)
- **Format:** 12-Word (128-bit)
- **Download Ensō PNG** — export the circle generated alongside the wallet

## Encrypted Local Storage (AES-256)

A master password gates every persistence action — required for save, load, and export:

- **Save to Local List** · **Load / Decrypt List** · **Export as Encrypted TXT** · **Delete All**

## State

Quoted UI state at capture: "Awaiting Forge…" / "Click to Mine".
