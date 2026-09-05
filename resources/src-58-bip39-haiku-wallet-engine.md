# BIP-39 Haiku Wallet Engine — Poetic Wallet Suite

> **Register:** src-58 · **Original:** https://bashupload.app/7zv3d1.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

"## BIP-39 Poetic Wallet Suite · Hardware Compliant"

The offline-first build of the haiku-wallet line: instead of fetching the wordlist, it makes
the user supply it once and then keeps it locally, so that generation can run with the
network switched off.

## Local dictionary initialization

- Paste the official **2048-word English BIP-39 list** into the page
- "It will be permanently committed to your browser's local sandbox storage so that all
  cryptographic operations can run fully offline."
- **Load Wordlist Cache** · **Purge Saved Wordlist**
- On success: "Wordlist Active. System secure. Establish or enter your Master Password to
  unpack or write data to your locally encrypted AES-256-GCM cookie vault."

## Vault

- **Unlock Cryptographic Vault** — master password over an **AES-256-GCM** encrypted vault
- **Encrypted Storage Vault** — **Export Secure Backup (.TXT)**

## Mining

- **Wallets to Batch Mine** — queue size
- **Enable Grammar Filter** — "Automatically skips awkward poetic line breaks"
- **Mine Wallets** — standby state: "Awaiting generation parameters…"

## Note

Distinct from src-50 (BIP-39 Haiku Wallet Engine, `ya0iaz.htm`), which is a second-generation
haiku miner with the same offline wordlist and AES-256-GCM vault design. The two share a name
and an architecture; this one carries the "Poetic Wallet Suite · Hardware Compliant" banner and
the batch-mine grammar filter.
