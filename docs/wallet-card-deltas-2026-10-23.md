# T11.1 — wallet crypto-card deltas vs the bip39-haiku workbench (2026-10-23)

T11.1 asked what a *wallet crypto-card* needs that this repo's
bip39-haiku lineage does not already have, and vice versa. The repo
side before this pass: `js/bip39.js` (phrase ↔ entropy, checksum
verified), `js/wallet-derivatives.js` (BIP-44/49/84 derivation for
the Keyspace Viewer), and the haiku workbench (`js/haiku-workbench.js`,
whose wallet cell already prints "Entertainment only — not a funded
wallet" on everything it parks).

## The delta

| A physical wallet card carries | Repo status before | Now |
|---|---|---|
| Numbered word grid (1…12/24) with the BIP-39 checksum word | bip39 validates; nothing rendered a card | **`js/wallet-card.js` renders + re-parses the grid** |
| Master fingerprint (BIP-32, hash160 of master pubkey, first 4 bytes) | derivable but never surfaced | on the card (`73c5da0a` for the canonical test phrase) |
| Account public key + first receive address, to verify a restore *without* the seed | wallet-derivatives computed rows incl. WIF keys for a local UI | card takes **public fields only** — no xprv, no WIF, no seed hex, enforced by test |
| A passphrase *indicator* (never the passphrase) | passphrase silently changed the seed | card prints `IN USE (not printed)`; fingerprint change proves the seed differs |
| Standard layouts only | bip39.js supports generalised 2…512-word layouts | wallet cards **refuse** non-standard counts — a backup card is not the place for exotic layouts |

## What the haiku lineage deliberately does *not* gain

The haiku workbench is a mnemonic-*shaped* entertainment format. Its
5-7-5 phrases are not BIP-39 entropy, and the delta runs one way:
**nothing haiku enters the wallet card.** `createWalletCard` fails
closed on non-wordlist input (a haiku line is the test case), on a
broken checksum (`abandon … zoo`), and on unknown words; a rendered
card with a numbering gap refuses to parse. The workbench's own
"not a funded wallet" label remains the correct description of that
side, unchanged.

## Verification

`tests/wallet-card.test.mjs` (4/4) pins the canonical published
values for `abandon ×11 + about` — fingerprint `73c5da0a`, BIP-84
first address `bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu`, the
matching zpub — plus render→parse round-trip, the
no-private-material scan, passphrase secrecy (the string `TREZOR`
never appears), and the fail-closed cases above.

## Honest limits

- A printed card *is* the seed: anyone holding it holds the funds.
  The render says so. No encryption is applied to the paper form —
  sealing a card for transport is the haiku-vault-v1 envelope's job
  (`js/haiku-vault.js`), and composing the two is a page-level
  concern, not something this module smuggles in.
- BIP-84 mainnet is the card default because it is the current
  standard single-sig path; testnet/multisig cards are new formats,
  not flags, when a strand actually needs them.
- The cold-war spy book's 18 challenges remain blocked on locating
  the source book; nothing in this strand substitutes for it.
