# Independent token identities — round 84 source-review tranche

## Scope and order

After the native-GnuPG control lane, this continuation starts the next evidence
lane in the historical registry's order: **USDT (rank 3), then USDC (rank 6)**.
These are **two source reviews started, not two completed token investigations**.
The 43 host fee reviews are already complete; they are not repeated and do not
verify a token contract, transfer tax, backing or redeemability.

- [Offline research ledger](../config/token-research.json): two stable asset IDs,
  four exact mainnet tuples, zero full token acceptance gates closed.
- [Provenance manifest](research/token-identity-source-manifest-2026-11-17.json):
  **13 pinned files** (nine Circle reference-source files, four secondary
  catalogue entries) plus **nine explicitly unanchored page observations**.
- [Generated 500-asset inventory](coin-research-inventory-2026-11-17.md): host,
  fee, catalogue and independent token-source evidence are separate columns.

The ledger and validator are research tooling only, **not a runtime token list**.
No contract or decimals were changed in `config/token-networks.json`; USDC has
not been enabled for balance reads by this work. No personal address, private
key, signing, deployment, funded transaction, price feed or background RPC was
used. `2026-11-17` names the research snapshot, not a claim that mutable source
pages or their changing timestamps/values are block-anchored to that date.

## 1. USDT — distinguish the issuer's tokens from the custodial peg

| Mainnet tuple | Identifier | Decimals evidence | Representation / boundary |
| --- | --- | --- | --- |
| Ethereum / chain ID 1 | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6; pinned catalogue plus explorer | Tether integration page lists this address. Existing receive/balance catalogue unchanged. |
| BNB Smart Chain / chain ID 56 | `0x55d398326f99059fF775485246999027B3197955` | **18**, not 6; pinned catalogue plus explorer | Binance-Peg BSC-USD, a custodial representation. Not promoted to issuer-native Tether USD₮. |
| TRON / **no EVM chain ID** | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` | 6; pinned catalogue plus explorer | Tether integration page lists this independent TRC-20 address. Ethereum ABI/code is not substituted for TVM evidence. |

Primary identifier evidence: [Tether integration guidelines](https://tether.to/en/supported-protocols/).
Its BNB section names XAU₮ rather than identifying the BSC-USDT address above;
absence alone is not a verdict on all unlisted tokens. Binance's
[collateral page](https://www.binance.com/en/proof-of-collateral) separately
labels its scope as **Binance Bridge pegged tokens**, not Binance.com's general
proof of reserves. Its USDT BEP20 row abbreviates the address; the full address
and 18 decimals are separately corroborated by the pinned catalogue and
[BscScan](https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955).
The operator's displayed ratios are claims, not an independently reproduced
collateral or redemption audit. No changing reserve amount or price was copied.

### Transfer/control findings and limits

- The issuer explicitly warns that the Ethereum contract's `transfer` does
  **not return a Boolean**; integrations need handling such as SafeERC20. This
  is not an implementation task for this receive-only wallet.
- The [Ethereum explorer](https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7)
  exposed a verified-source label, outline and ABI. The ABI names
  `basisPointsRate`, `maximumFee`, `setParams`, `deprecated`, `upgradedAddress`,
  pause and blacklist/destruction methods. **The complete Solidity body was not
  retrieved in that rendered view.** Neither an exact fee formula nor a current
  fee value is established by an ABI method name. In particular, **unknown is
  not zero transfer tax**, and host ETH gas is a different cost.
- The [TRON explorer](https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
  corroborates its address and six decimals. Current TVM code, role/fee state
  and transaction behaviour remain unqueried; no Ethereum control conclusion
  is copied to TRON or the BSC peg.
- [Tether's backing statement](https://tether.to/en/transparency/) is recorded
  **as an issuer claim only**. No independent reserves-report review, solvency
  proof, legal redemption analysis or current deprecation/migration check is
  claimed. Historical/deprecated protocol entries must not be automatically
  enabled just because they share a ticker.

Source rejection matters: `tethercoin/USDT` was not accepted as issuer source
merely because its name looks relevant; no issuer linkage was established.
`tetherto/tether-dev-docs` describes ESLint configuration, not token contract
specifications. No code from either was reused or executed.

## 2. USDC — issuer-listed token proxy, not its implementation or a bridge

Circle's [contract-address page](https://developers.circle.com/stablecoins/usdc-contract-addresses)
lists Ethereum mainnet **`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`**.
Six decimals are corroborated by a pinned secondary catalogue entry and
[Etherscan](https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).
This tuple remains **research-only** here. The proxy is the token identity;
a linked implementation address or a CCTP `TokenMessenger` must never replace
it. The old `evm-smart-contracts` documentation route redirected to CCTP
addresses, so it was rejected as token-identity evidence.

Selected [Circle reference source at `fc85788bc7c23cefe3df1a757133048bfddadeaa`](https://github.com/circlefin/stablecoin-evm/tree/fc85788bc7c23cefe3df1a757133048bfddadeaa)
was inspected, **not executed, deployed or copied into the application**:

- [`FiatTokenV1.sol`](https://github.com/circlefin/stablecoin-evm/blob/fc85788bc7c23cefe3df1a757133048bfddadeaa/contracts/v1/FiatTokenV1.sol)
  sets `decimals = tokenDecimals` at initialization; this generic source is
  **not itself proof that a particular proxy was initialized with six**.
  The inspected `_transfer` debits/credits the full `value` and emits it.
  That source-level accounting is not a timeless zero-tax guarantee for an
  upgradeable deployed proxy or a separate fee adapter.
- `Pausable`, `Blacklistable`, minter controls and the proxy admin/upgrade paths
  are explicit. A valid private key and a host fee estimate do not guarantee
  that a transfer is permitted. The deployment guide calls for checking the
  actual implementation/admin and initialized fields; these checks have not
  been performed at a chosen block.
- The current proxy slot, deployed implementation bytecode, role holders,
  paused/blacklisted state and transaction results remain **unqueried**. The
  explorer's implementation link is not a bytecode match or block anchor.
- Circle's [overview](https://developers.circle.com/stablecoins/what-is-usdc)
  states reserve backing/redemption and monthly attestations. These are
  **issuer claims**, not an independent reproduction of an attestation or a
  guarantee that a bridge/wrapper is backed by Circle.
- Circle's mainnet/testnet separation and its explicit distinction between
  Circle-issued USDC and a bridged USDC.e support keeping representations
  distinct. This tranche does not review every host, bridge or test contract;
  **no test deployment is inferred** from a mainnet address.

## Mechanical evidence guards

`tools/token-research-evidence.mjs` validates the ledger and source references
before inventory generation. Its matcher requires the **stable asset ID,
mainnet environment, network ID, host, address family, chain ID, contract and
decimals** together. Ambiguous duplicates fail closed. Matching EVM receive
addresses, a ticker alias or a mainnet contract copied onto testnet do not match.

V1 intentionally cannot close a full token acceptance gate, invent a block,
set unknown transfer tax to zero, call a source claim an independent backing
audit, or silently add a research-only tuple to the runtime catalogue. These
bookkeeping controls do not turn source review into contract execution or an
audited financial claim. A separate **five-minute, read-only Token research
evidence CI lane** enforces inventory freshness and exact-tuple/no-promotion
regressions with SHA-pinned actions, no persisted checkout credentials, no
application secrets, no RPC/deployment step and no artifact upload. A passing
bookkeeping job does not close any financial/runtime evidence gate.

```sh
node tools/build-coin-research-inventory.mjs
npm run check:coin-research
node --test tests/token-research.test.mjs tests/coin-research.test.mjs tests/coin-networks.test.mjs
```

## Next acceptance work

The follow-up [deployment capture preflight](token-deployment-capture-2026-11-17.md)
adds bounded offline hash-pinned request plans and strict local-capture controls
for the three existing EVM tuples, including the Circle reference's legacy
proxy-slot distinction. It does not contact RPC, change this ledger's unqueried
state or close a deployment/financial gate. TRON still needs separate TVM
evidence; consistent provider assertions are not consensus/state proofs.

1. Finish per-deployment block-anchored code/implementation, initialized metadata,
   control/fee state, migration and reserve/redemption-source checks. Current
   fee and transfer behaviour remain unknown until independently evidenced.
2. Use separately verified synthetic test deployments for transaction controls;
   never send real funds merely to close a research checkbox. Extra mainnet,
   testnet, bridged and wrapped tuples require their own evidence.
3. Continue the next source-review candidates in registry order: **stETH, then
   wstETH**. Unresolved-host assets such as RAIN and unsupported native assets
   are identity tasks, not automatically classified as ERC-20 tokens by this
   queue. No broad “448 tokens verified” or “500 assets complete” claim follows.
