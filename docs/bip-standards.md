# Wallet standards survey: what the derivation stack implements

The wallet stack (`js/hash.js`, `js/codec.js`, `js/secp256k1.js`,
`js/ed25519.js`, `js/bip32.js`, `js/addrs.js`, `js/coins.js`, `js/bip39*.js`)
is dependency-free and derivation-only: it turns a mnemonic into addresses.
It never signs. Every implemented standard below names its module and the
`tests/11-wallet-coins.mjs` section that pins it; the last section lists what
was surveyed and deliberately left out.

Provenance: SLIP-0044 registry snapshot `e9f91569…` (1479 entries);
Coinpaprika rank snapshot `2026-09-11T16:48:15Z`. Cross-check libraries
(`@scure/bip32`, `@noble/*`, `micro-ed25519-hdkey`, `ripple-keypairs`,
`@scure/base`) were scratch oracles only — no test depends on them.

## BIP-39 — mnemonic code for generating deterministic keys

- Word layer: `js/bip39.js` + `js/bip39-en.js` (2048-word English list,
  entropy↔mnemonic, checksum, `LADDER` of valid 12–24 word counts).
- Seed layer: `mnemonicToSeed` in `js/coins.js` — NFKD, salt
  `"mnemonic"+passphrase`, PBKDF2-HMAC-SHA512 ×2048, 64 bytes. Both the
  empty and the `"TREZOR"` passphrases are oracle-checked against
  `node:crypto` (tests/11 §hash).
- The optional passphrase ("25th word") is supported end to end
  (`deriveCoin(…, { passphrase })`); it produces a wholly different tree.

## BIP-32 — hierarchical deterministic wallets (secp256k1)

`js/bip32.js`: master from `HMAC-SHA512("Bitcoin seed")`, private child
derivation (hardened `0x00||k||i` and normal `K||i`), **public child
derivation** (`secpDerivePub`, for watch-only xpubs), path parser
(`m/…`, `'`, `h`/`H`), fingerprint/depth/index bookkeeping, and
extended-key serialisation. Test pins (tests/11 §bip32/10):

- BIP-32 test vector 1 master `xpub661MyMwAq…` and the `m/0'/1/2'/2/1000000000`
  key `xpub6H1LXWLaKs…` reproduce byte-for-byte (via the `@scure/bip32` oracle).
- xpub anatomy: version `0x0488b21e`, depth, and parent fingerprint are
  asserted structurally; xpub-derived children equal priv-derived children.

## BIP-43/44/49/84/86 — purposes and script families

`defaultPath` (`js/addrs.js`) builds `m/{purpose}'/{coin}'/{account}'/{change}/{index}`:

| purpose | family key     | address                | example (row default) |
| ------- | -------------- | ---------------------- | --------------------- |
| 44      | `p2pkh`        | base58check P2PKH      | DOGE, BCH, DASH …     |
| 49      | `p2sh-p2wpkh`  | base58check P2SH wrap  | via `purpose` override|
| 84      | `p2wpkh`       | bech32 v0              | BTC, LTC rows         |
| 86      | `p2tr`         | bech32m v1 key-spend   | BTC runes (DOG, ORDI) |

`deriveCoin` accepts a `purpose` override (44/49/84/86) so one row serves
legacy/segwit/taproot wallets; the row's own family stays the default.
Zcash transparent (`t1…`, version `0x1cb8`) rides purpose 44 as `zcash-t`.

## BIP-141/143/173/350 — segwit and bech32(m)

- P2WPKH program is `hash160(compressed-pub)`; P2SH-P2WPKH wraps
  `0x0014||hash160` and hashes again — both asserted by decoding real
  derived addresses (tests/11 §derived).
- `js/codec.js` implements bech32 and bech32m with the correct checksum
  constants (`1` vs `0x2bc830a3`) and the v0→bech32 / v1+→bech32m rule.
  All five valid BIP-173 vectors and three BIP-350 vectors decode; note
  the `abcdef1…` BIP-173 string circulating online carries a wrong tail —
  `@scure/base` and this codec agree the checksum must be `hmxsvg`.

## BIP-340/86 — taproot key-spend (lift + tweak, no signing)

`taprootOutputKey` takes the **33-byte compressed** internal key (not
x-only) so it can negate the tweak when P has odd Y, per BIP-86
(`Q = P + t·G`, `t = tagged_hash("TapTweak", x)`). Two bugs died here
during development and both are now guarded by tests:

1. `liftX` once computed `sqrt(x)` instead of `sqrt(x³+7)` — every lifted
   point is now asserted **on-curve** (`y² = x³+7`, even Y).
2. The odd-key tweak negation was missing — taproot outputs now match
   `@noble/curves` element-wise for both parities (6/6), and the tweak
   equation is re-checked inside the suite.

No Schnorr signing/verification is implemented (out of scope: derivation only).

## SLIP-0044 — registered coin types

`config/slip44.json` is the verbatim registry (1479 entries).
`tools/build_coins.mjs` resolves each row's coin number by family:

- Bitcoin-family L1 rows: registry by symbol (BTC 0, LTC 2, DOGE 3, DASH 5,
  BCH 145, ZEC 133, …).
- EVM rows: **per chain** — a token lives at its chain's address, so VTHO
  inherits VET 818, CUSD inherits CELO 52752, RIF inherits RSK 137.
  Chains whose deployed convention is the shared Ethereum path are pinned
  in `EVM_CHAIN_OVERRIDE` (BSC/AVAX-C/L2s/forks → 60).
- Cosmos rows: 118 default with a per-chain map (CRO 394, RUNE 931, …).
- Single-key families: fixed (SOL 501, TRX 195, XRP 144, XLM 148, NEAR 397).

### Deliberate divergences (re-checked every build)

Each fires a build warning until the registry agrees with deployed practice:

| chain | registry | used | why |
| ----- | -------- | ---- | --- |
| SEI / DYDX | 19000118 / 22000118 | 118 | Keplr-style Cosmos wallets derive both at 118 |
| INJ | 22000119 | 60 | our row is the EVM side (`inj1…` over ETH bytes) |
| AVAX | 9000 (pre-mainnet AVA) | 60 | C-chain has always used the ETH path |
| BSC (BNB) | 714 (retired Beacon) | 60 | BSC uses the ETH path |
| HYPE / MON / S / PLS | 2457 / 268435779 / 10007 / 1028 | 60 | MetaMask-first chains; funds sit at ETH-path addresses |
| FTM / PEAQ / 0G | 1007 / 3338 / 16661 | 60 | same: EVM side follows the ETH path |
| VVS on CRO | 394 (Cosmos side) | 60 | the token lives on Cronos EVM |
| RSK | unregistered | 137 | RSK-docs convention |
| RON / KUB / FLR / WEMIX | unregistered | 60 | EVM clones with no registration; 60 in every wallet |

THETA follows the registry (500), ISLM follows the registry (1348, EVM
side — least certain entry; verify against your wallet), KAIA follows the
registry (8217).

## SLIP-0010 — HD derivation for ed25519

`edMaster`/`edDerive` (`js/bip32.js`): `HMAC-SHA512("ed25519 seed")`
master, hardened-only children, and the final IL used **as** the RFC 8032
seed — the deployed Solana/Stellar/NEAR behaviour. Cross-checked against
`micro-ed25519-hdkey` (3 seeds × 4 paths) and pinned in tests/11.
Paths: SOL `m/44'/501'/{a}'/0'`, XLM `m/44'/148'/{a}'`, NEAR `m/44'/397'/0'`.

## SLIP-0132 — version bytes for script-separated extended keys

`VERSIONS` (`js/bip32.js`): ypub `0x049d7cb2`, zpub `0x04b24746`,
tpub `0x043587cf`, upub `0x044a4e28`, vpub `0x045f1cf6` (+ private
counterparts). The suite asserts the famous `ypub…`/`zpub…`/`tpub…`
prefixes decode from these bytes.

## EIP-55 — mixed-case checksum for hex addresses

`eip55` (`js/codec.js`) reproduces all three EIP-55 spec test cases, and
the Hardhat zero account (`0xf39Fd6e5…92266`) pins the full
mnemonic→key→keccak→checksum pipeline.

## Non-BIP chains (same zero-dep stack)

| chain | algorithm | pin |
| ----- | --------- | --- |
| Tron | base58check(`0x41\|\|`evm-bytes) | version byte + shared payload with EVM |
| XRP | base58check/XRP-alphabet, hash160 | `ripple-keypairs` oracle on our pubkey |
| Cosmos-SDK | bech32(`hrp`, hash160) | hrp + payload decode per row |
| Solana | base58(pub) — no checksum | zeros → `1111…1111` (the system program) |
| Stellar | strkey v6≪3 + CRC16-XModem | CRC check value `31C3` + round-trip |
| NEAR | hex(pub) implicit account | identity with the ed25519 pubkey |

## Surveyed but out of scope

- **BIP-38** (encrypted keys), **BIP-47** (reusable payment codes),
  **BIP-85** (deterministic entropy), **BIP-129** (BTChip masterseed),
  **SLIP-39** (Shamir shares) — key-management layers above derivation.
- **BIP-48 + output descriptors (BIP-380–386) + miniscript** — the
  multisig/script-policy world; our rows are single-key only.
- **PSBT (BIP-174)** and all signing (ECDSA, Schnorr, EdDSA) — the stack
  is derivation-only by design.
- **BIP-352 silent payments**, tapscript trees, annex — no BIP-86 trees.
- **cashaddr** (BCH/XEC), **Ton**, **Substrate SS58**, **Shelley**,
  **CryptoNote**, **blake2b-derived formats** (Algorand, Tezos, Filecoin,
  Aptos, Sui, …) — each unsupported row's `reason` names the missing piece;
  blake2b is the single most-wanted primitive (it would unlock ~15 rows).

## Security model

Private keys exist transiently in `deriveCoin` and are never serialised;
the UI layer (`src/lib/coins.ts`) exposes addresses, paths, and xpubs, not
keys. There is no network code anywhere in the stack — registry JSON is
built offline and checked in, so derivation cannot leak. Treat any
`slip44Source` ending in `-fallback` or the ISLM row as "verify against a
second wallet before funding".
