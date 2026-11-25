# USDT/USDC deployment capture preflight — 17 November 2026

## Bounded backlog progress, not live deployment evidence

This continuation prepares the next acceptance step for the **existing USDT and
USDC source reviews**, before stETH/wstETH. It adds an offline, bounded request
planner and local-capture validator. There are still **zero complete token acceptance gates**
closed. The source ledger, 500-asset inventory, receive catalogue, wallet UI and
balance reader are unchanged. USDC remains research-only and is not enabled for
balance reads. An accepted capture is only **consistent provider claims**;
provider labels do not prove independence, and a JSON file can be fabricated.

**No mainnet RPC was contacted**, no endpoint or owner address was supplied, no
transaction was signed/sent/simulated, and no funded test was used. Automated
controls use in-memory synthetic headers, addresses and bytecode that do not
claim to represent a real block. Network egress for this research was limited
to retrieving pinned public source/specification files from GitHub. A source
file SHA-256 is provenance for those source bytes, not a chain block anchor.

## Source finding: do not assume every proxy uses ERC-1967

The pinned Circle reference at
[`fc85788bc7c23cefe3df1a757133048bfddadeaa`](https://github.com/circlefin/stablecoin-evm/tree/fc85788bc7c23cefe3df1a757133048bfddadeaa)
uses legacy Zeppelinos storage slots:

| Reference field | Slot derivation | Slot |
| --- | --- | --- |
| implementation | `keccak256("org.zeppelinos.proxy.implementation")` | `0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3` |
| proxy admin | `keccak256("org.zeppelinos.proxy.admin")` | `0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b` |

These are directly asserted/loaded by the inspected
[`UpgradeabilityProxy`](https://github.com/circlefin/stablecoin-evm/blob/fc85788bc7c23cefe3df1a757133048bfddadeaa/contracts/upgradeability/UpgradeabilityProxy.sol)
and
[`AdminUpgradeabilityProxy`](https://github.com/circlefin/stablecoin-evm/blob/fc85788bc7c23cefe3df1a757133048bfddadeaa/contracts/upgradeability/AdminUpgradeabilityProxy.sol)
reference files. They are **not** the `keccak256("eip1967.proxy.…") - 1` slots
specified in the inspected [ERC-1967](https://github.com/ethereum/ERCs/blob/8dd085d159cb123f545c272c0d871a5339550e79/ERCS/erc-1967.md).
The old EIPs path was only a `status: Moved` stub; its 132 bytes were not passed
off as the full specification. The five inspected files' immutable revisions,
raw-byte digests, sizes and limitations are in the
[source manifest](research/token-deployment-capture-sources-2026-11-17.json).
Existing issuer/identifier references remain in the
[original source review](token-identity-review-round-84-2026-11-17.md).

This source finding **does not prove** that a particular live USDC deployment
uses that code/layout at a chosen block. The planner deliberately labels its
slot reads a **reference-layout probe**. Nonzero padded values are only
implementation/admin *candidates*, not a verified implementation, role holder
or replacement token identity. Empty/malformed/self-referential values reject
this profile as incomplete; they do not authorize a fallback slot or imply
that the deployment has no admin/proxy. Matching deployed code, implementation
bytecode and source remains a separate acceptance step. The proxy admin must
not be confused with the token owner, pauser, blacklister or master minter.

## Exact profiles and the state pin

`tools/token-deployment-capture.mjs` supports only these already-reviewed EVM
tuples. Tests compare every tuple field against the existing ledger:

| Asset ID | Network / chain | Token identity | Decimals | Extra probe |
| --- | --- | --- | --- | --- |
| `usdt-tether` | `ethereum` / 1 | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6 | none |
| `usdt-tether` | `bsc` / 56 | `0x55d398326f99059fF775485246999027B3197955` | **18** | none; custodial Binance-Peg is separate |
| `usdc-usd-coin` | `ethereum` / 1 | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6 | two legacy reference-slot reads |

**TRON requires a separate TVM-specific capture profile**; no invented EVM chain
ID, storage layout or Ethereum USDT control conclusion is substituted. Testnets,
other hosts, bridges, ticker aliases and later assets fail closed. No new token
mapping is written to `config/token-networks.json`.

Each plan contains six fixed read requests (eight for USDC), to be captured in
order separately from each provider:

1. `eth_chainId`, which must identify the exact host (this method has no block
   parameter; it is not falsely represented as historical chain-ID evidence).
2. `eth_getBlockByHash` at the explicit hash, without full transaction objects.
3. `eth_getBlockByNumber` at the explicit number, before the state reads.
4. `eth_getCode` at the token, with the hash pin below.
5. `eth_call` of **only `decimals()`**, with the same pin. There is no wallet
   `from`, transfer calldata or state override.
6. For USDC only, `eth_getStorageAt` at each legacy reference slot, same pin.
7. `eth_getBlockByNumber` again after the state reads.

Every state query requires the
[EIP-1898](https://github.com/ethereum/EIPs/blob/282fac210e1727fb8472b99c5cda59b844391844/EIPS/eip-1898.md)
object `{ "blockHash": "…", "requireCanonical": true }`. Number-only state,
`latest`, `pending`, `safe`, `finalized`, false/missing canonical flags and
endpoint errors are **not** silently retried or downgraded. A provider that
does not implement the hash-pinned method cannot satisfy this profile. The
header lookups are consistency checks, not a consensus/finality proof or a
full header-hash recomputation. For BSC in particular this tooling does not
assert that every node implements the required interface.

Number/timestamp quantities must be canonical lowercase uint64 hex; bytecode
must be nonempty even-length DATA, at most 64 KiB per provider; decimals must
be a full 32-byte ABI word equal to the tuple's value. The
[EIP-1474](https://github.com/ethereum/EIPs/blob/445383fa32433bee55e56a8edd36fb2aad18b7fd/EIPS/eip-1474.md)
quantity/DATA distinction is intentional: `0x6` is not a complete ABI word,
and `0x00` is not a canonical quantity. These are preflight resource/schema
bounds, not claims about the maximum allowed bytecode or block number on every
chain. The two captures must agree on bytecode, decimals, relevant header
fields and the optional legacy probe. Every expected request needs exactly one
matching JSON-RPC 2.0 success result, with no error, duplicate, omitted or extra
exchange. Method, target, selector, slots and hash pin must match the generated
plan exactly. Request IDs permit reordering when reviewing a saved batch; JSON
objects are normalized input, **not authenticated raw wire transcripts or proof
that requests were executed in that order**.

## Local use (no automatic collection)

Supply a number and hash obtained by an independently reviewed, authorized
process. These commands only print JSON or read a local file:

```sh
node tools/token-deployment-capture.mjs plan usdt-tether ethereum "$BLOCK_NUMBER" "$BLOCK_HASH"
node tools/token-deployment-capture.mjs plan usdt-tether bsc "$BSC_BLOCK_NUMBER" "$BSC_BLOCK_HASH"
node tools/token-deployment-capture.mjs plan usdc-usd-coin ethereum "$BLOCK_NUMBER" "$BLOCK_HASH"
node tools/token-deployment-capture.mjs validate /path/to/local-capture.json
node --test tests/token-deployment-capture.test.mjs
```

A local capture has exactly `schema: "html5-token-rpc-capture-v1"`, `assetId`,
`networkId`, `anchor: { number, hash }` and `providers`. `providers` contains
exactly two objects with distinct short non-secret `label` strings and
`exchanges: [{ request, response }, …]`. Each request is copied from the plan;
responses are the corresponding JSON-RPC envelopes. The tool does not accept
RPC URLs or credentials and does not fetch, execute requests, spawn processes,
write files or change either research ledger. It reads at most **1 MiB** from a
regular local file, refuses symlinks on supported platforms, and bounds reads
even if the file grows. Invalid input gives a nonzero CLI exit with a generic
error, not raw captured data, a URL, secret fixture text or a stack trace.
Do not put provider credentials, personal addresses or actual private captures
in Git, CI, comments or public artifacts. There is no upload step. Locally
retaining an authorized capture and its provenance is a separate owner action;
this task did not create or upload such a capture.

## What acceptance still requires

Even a successful preflight always reports `acceptanceGatesClosed: 0`,
`runtimePromotion: false`, `transactionTested: false`, unknown transfer tax and
unverified backing. It cannot change those fields through a capture property.
Two labeled streams may share an upstream, lie together or be manually edited.
The tool does not verify provider independence, a block's consensus/header hash,
state-trie proofs, deployed source or financial claims. A bytecode digest is
only a digest of returned code; nonempty code is not token identification.

Before marking the USDT/USDC per-deployment gates complete, still obtain and
independently review:

- Real chosen-block captures with documented provenance, chain/finality and
  appropriate state/bytecode proof or trusted-node validation.
- Actual proxy layout, implementation code and reproducible source match,
  independently for each deployment; no token/implementation substitution.
- Initialized metadata and current fee, pause, blacklist, deprecation/migration
  and role state. No sender/recipient-specific permission is inferred from
  decimals or bytecode, and unknown transfer tax is not zero.
- Primary migration/redemption terms and an independent reserves/collateral
  review. Issuer/operator claims are not reproduced audits or solvency proof.
- Separately verified synthetic test deployments for transaction controls;
  never send real funds just to close a research checkbox. Test-deployment
  controls do not establish current mainnet transaction behaviour.

Only then proceed to the next assets, stETH and wstETH, in the agreed order.
The bounded offline CI lane now requires these capture controls in addition to
all original inventory, exact-tuple and no-promotion checks. A green tooling
job validates the tooling and synthetic cases, **not a mainnet deployment**.
