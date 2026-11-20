# Backlog execution round 82 — NEAR transaction-fee evidence

## Bounded item resumed

Continued the round-81 pending host-fee review queue with **NEAR Protocol**.
The curated native host identity was already marked primary-reviewed; this work
reviews only the transaction-fee model. It does not verify every registry asset,
token deployment, address convention, RPC endpoint, or current fee quote.

## Evidence and resulting model

Reviewed the NEAR documentation for [exchange integration and transaction
gas](https://docs.near.org/integrations/exchange-integration#fees-and-required-balances),
[account creation](https://docs.near.org/integrations/accounts),
[storage staking](https://docs.near.org/protocol/storage/storage-staking), and
[network identity](https://docs.near.org/protocol/network/networks).

The fee profile now records:

- NEAR is the fee asset. The transaction gas price has a documented floor of
  0.0001 NEAR/Tgas and changes with network load.
- Execution gas is bought up front at no less than 0.001 NEAR/Tgas; gas burned
  is charged at the applicable price, and unused gas plus the price difference
  are refunded. Action parameters and contract execution determine gas usage.
- A new-account creation charge of about 0.007 NEAR is conditional and in
  addition to other transaction gas. Attached deposits are value transferred,
  not fees. Storage staking is a separate balance lock, documented at
  10^19 yoctoNEAR per byte.
- The workbench does **not** calculate a transaction fee from this general
  formula: no specific action/receipt, current gas price, or execution input is
  available. Missing transaction-specific information remains unknown; manual
  native-fee input remains explicitly user-entered and not a quote.

Updated `config/chain-research.json` and the deterministic coverage inventory.
Fee status is now primary-reviewed for **18/57** host profiles, with **39**
pending. Network identity status was not changed. Added regression assertions
that NEAR's formula is surfaced, missing transaction-specific estimates remain
unknown, and a manual amount is never marked live.

## Validation

- Focused fee/read/workbench regression: **26/26 passed**.
- Keyspace/SITE-K archive and navigation regression: **23/23 passed**.
- `npm run check:coin-research`, `git diff --check`, and the source/bundled
  NEAR research-config comparison passed.
- `npm test`: **1,110 passed, 12 optional skipped, 0 failed** (1,122 total).
- Rebuilt Keyspace, Wiki-in-a-Jar, and SITE-K. The new round record is explicitly
  excluded from public docs bundles; Wiki-in-a-Jar remains at 342 approved
  Markdown pages and the privacy/count regression passes.

An initial full-suite attempt caught that the new operational round note needed
to be added to the existing public-corpus exclusion list. Added the explicit
exclusion, rebuilt Wiki-in-a-Jar and SITE-K, then reran the full suite
successfully. No private or operational backlog text is copied into those
public bundles.

| Refreshed archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `keyspace.xdc` | 492,815 | `ccc42499cea74b7000fcd240c7e1cdbf0daf171db1fb8805c005eef22d028f2e` |
| `sitek.xdc` | 15,983,658 | `6ed1671710e345b88fe54f4a1f3581c348b669ca5e47aaafe80fc4ed28b64e39` |
| `wikiinajar.xdc` | 1,906,578 | `25aa60e17d04cdf5d0b58e6acf8a2c77135011d76bb09c213cfb17cbe4d12e37` |

## Limits / next

This is a primary-document fee-mechanics review only, not a fee calculator,
transaction quote, endpoint probe, current gas-price read, full NEAR-wallet
compatibility review, or token-contract verification. Next backlog item remains
one bounded primary-source review from the pending host-fee queue.
