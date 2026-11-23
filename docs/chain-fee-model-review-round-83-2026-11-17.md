# Remaining host fee models — round 83 (2026-11-17)

Completed the **43 originally pending host-network fee-model reviews**, in the
registry order below, before moving on to the OpenPGP backlog. There are now
**58 profiles / 58 source-reviewed fee models / 0 pending fee models**: the one
additional profile separates **Cronos EVM (25)** from **Cronos POS** for the
historical VVS row. This is not 500 token-contract reviews, a live fee survey,
a security audit, independent network identity validation or a claim that
historical networks are operational.

## Method and evidence boundary

- Read first-party fee/protocol documentation and/or the specific upstream
  fee implementation for each host, not a shared “all EVM/all Cosmos” guess.
- The [source manifest](research/chain-fee-source-manifest-2026-11-17.json)
  records immutable GitHub file URLs, full commit IDs and SHA-256 digests for
  cited code/doc files fetched through the GitHub API. Only provenance is
  committed, not cloned upstream trees. The GitLab Pulse source is separately
  pinned; its raw-byte digest was **not** collected.
- “Primary-reviewed” means **the fee model was source-reviewed**. Current
  governance prices, activation heights, UTXOs, gas use, balances, CORS and RPC
  liveness were not measured. Identity review stays a separate field.
- No new automatic numeric estimator is enabled: all 43 newly reviewed profiles
  still have unknown default monetary costs. Existing manually entered fee/price
  scenarios remain explicitly labeled and never turn missing information into
  zero. Fees paid in different assets cannot be ranked without prices.
- Host formulas do not verify issuer contracts/mints, decimals, migrations,
  backing, transfer taxes, wallet paths or any testnet token deployment. Existing
  derivation support and the 18 test-network identities remain unchanged.

## Per-host findings (original pending order)

### 1. ZEC — Zcash

**Fee asset:** ZEC. **Model:** `logical-actions`.

ZIP-317 conventional fee = marginal fee × max(2, logical actions), in zatoshis. The marginal fee and action pools depend on the applicable revision/height; this wallet policy is not a consensus minimum.

- ZIP-317 snapshot labels revisions 0 and 1 active and revision 2 proposed. Do not silently treat the proposed 1000-zatoshi marginal fee as activated; expected mining height and wallet/miner policy must be checked.
- Transparent-only address derivation does not implement shielded transactions, action counting or a Zcash fee estimator.

Primary evidence:
- https://github.com/zcash/zips/blob/c41951cc43d1f5074fc6821b892692a7f0d85e54/zips/zip-0317.rst
- https://zips.z.cash/zip-0317

### 2. DOGE — Dogecoin

**Fee asset:** DOGE. **Model:** `utxo-bytes`.

Serialized transaction bytes × selected DOGE/kB rate / 1000; dust/change policies may add cost. No fixed fee per transfer.

- Pinned Core recommendation is 0.01 DOGE/kB with exact-size charging since 1.14.5, not whole-kilobyte rounding. Relay minimum and miner inclusion policy differ; recommendations are not live quotes.

Primary evidence:
- https://github.com/dogecoin/dogecoin/blob/e7c9581519bea20a93d15b0e78b37e3e0905e589/doc/fee-recommendation.md

### 3. BCH — Bitcoin Cash

**Fee asset:** BCH. **Model:** `utxo-policy-size`.

Fee = charged transaction size × chosen base-unit rate; BCHN fee-rate code supports integer/ceiling rounding and policy virtual size = max(serialized bytes, sigchecks × bytes-per-sigcheck).

- Do not substitute Bitcoin witness vbytes: BCH policy size can be sigcheck-adjusted. CashTokens, dust and selected inputs/outputs need their own estimate; no default rate is installed.

Primary evidence:
- https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/07576013c91ff4a3a74acd85f189c69121cdad1b/src/feerate.cpp
- https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/07576013c91ff4a3a74acd85f189c69121cdad1b/src/policy/policy.cpp

### 4. LTC — Litecoin

**Fee asset:** LTC. **Model:** `utxo-mweb`.

Transparent fee = policy vsize × selected litoshi/vB rate, with integer rounding. MWEB additionally charges a separate weight-based component; total is byte fee + MWEB fee.

- Pinned code exposes GetTotalFee and GetMWEBFeeForWeight separately. A transparent SegWit receive address does not implement MWEB or establish an all-Litecoin transfer price.

Primary evidence:
- https://github.com/litecoin-project/litecoin/blob/9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343/src/policy/feerate.cpp
- https://github.com/litecoin-project/litecoin/blob/9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343/src/policy/policy.cpp

### 5. NEAR — NEAR Protocol (implicit account)

**Fee asset:** NEAR. **Model:** `near-gas`.

Action/receipt gas burned × applicable gas price in NEAR, with execution gas prepaid at the purchase price and unused gas/price differences refunded. Account-creation charges and attached deposits affect required balance; storage staking is separate.

- Purchase price and burn price differ; prepaid gas is not the final charge. Runtime parameters, receipt path, account creation and storage requirements must be checked; no live gas or account state was queried.

Primary evidence:
- https://github.com/near/docs/blob/46247ba605e4f92a5b9849eeaa13779157253357/protocol/transactions/gas.mdx
- https://docs.near.org/integrations/exchange-integration

### 6. AVAX — Avalanche C-Chain

**Fee asset:** AVAX. **Model:** `gas-charged-floor`.

C-Chain non-atomic fee = charged gas × effective AVAX gas price (fee-cap bounded base + tip). Where Helicon is active, charged gas is at least max(gasUsed, gasLimit / 2).

- This EVM host is C-Chain, not X/P chains or arbitrary Avalanche L1s. Atomic import/export and other chains have distinct schedules.
- Source documentation describes Helicon/ACP-194 and a validator-governed minimum price; header base fee is a worst-case bound. Do not reuse a stale 25/1 nAVAX floor or assume only gasUsed is billed. Activation/current parameters were not queried.

Primary evidence:
- https://github.com/ava-labs/builders-hub/blob/1261bb8d23336f5c7c9a654aabd64ed66c639a06/content/docs/rpcs/other/guides/txn-fees.mdx
- https://build.avax.network/docs/rpcs/other/guides/txn-fees

### 7. CRO — Cronos POS Chain

**Fee asset:** CRO. **Model:** `cosmos-gas`.

Declared Cosmos fee budget = ceil(gasLimit × accepted gas price), paid in CRO/basecro; transaction simulation and node/network policy determine the required budget.

- Cronos POS (crypto-org-chain-mainnet-1, cro1 addresses) is not Cronos EVM chain 25. The documented 5000basecro multisig fee is an example, not a universal fee.
- The historical VVS row is EVM-family: its research host is separately overridden to CRONOS_EVM without claiming its token contract is verified.

Primary evidence:
- https://docs.cronos-pos.org/cronos-pos-chain-protocol/chain-details/protocol-documentation
- https://docs.cronos-pos.org/for-users/wallets/multisig-account
- https://github.com/cosmos/cosmos-sdk/blob/06a015222f13fe7b41bc3969504da7dee875ae5c/docs/docs/learn/beginner/04-gas-fees.md

### 8. FTM — Fantom Opera (historical FTM host)

**Fee asset:** FTM. **Model:** `gas`.

Opera fee = gas used × FTM gas price; its demand-sensitive base fee/priority policy must be obtained for the selected transaction.

- Reviewed the original foundation fee explanation, not its historical USD comparison as a current quote. Opera/FTM remains distinct from Sonic/S; migration or an identically formatted address does not make the ledgers interchangeable.

Primary evidence:
- https://blog.fantom.foundation/understanding-fantom-transaction-fees/

### 9. ETC — Ethereum Classic

**Fee asset:** ETC. **Model:** `gas`.

Execution fee = charged gas × ETC gas price, after the refunds allowed by the active ETC fork rules; token calls require transaction-specific gas.

- The primary Classic config identifies chain 61 and a partial London/Mystique fork, not Ethereum mainnet. Generic Core-Geth EIP branches do not prove EIP-1559 is active on Classic; no ETH burn/fee-floor claim is imported.

Primary evidence:
- https://github.com/etclabscore/core-geth/blob/4720ac33055e8e5482ce2fb6c5ff800aad8a5889/core/state_transition.go
- https://github.com/etclabscore/core-geth/blob/4720ac33055e8e5482ce2fb6c5ff800aad8a5889/params/config_classic.go

### 10. DASH — Dash

**Fee asset:** DASH. **Model:** `utxo-bytes`.

Transaction byte size × chosen duff/byte rate, rounded upward by the pinned Core fee-rate implementation; transaction type and wallet policy can add costs.

- Ordinary transfer fee arithmetic is not a quote for CoinJoin, special transactions, service fees or every wallet policy. No Bitcoin sat/vB assumption is reused.

Primary evidence:
- https://github.com/dashpay/dash/blob/81e52fffb9489da6e1759d66717115e6debe32b2/src/policy/feerate.cpp

### 11. ATOM — Cosmos Hub

**Fee asset:** ATOM. **Model:** `cosmos-feemarket`.

Gas-priced ATOM/uatom transaction budget (gas limit × accepted price, integer rounding); Gaia wraps SDK deduction with FeeMarketCheckDecorator, so current fee-market policy and simulation must be consulted.

- Fee-market and governance/node parameters are not measured here. A fixed validator example, generic SDK minimum or deprecated globalfee design is not a final Cosmos Hub quote.

Primary evidence:
- https://github.com/cosmos/gaia/blob/c5a460ed482a25496d4dd831fec8f0a440757005/ante/ante.go
- https://github.com/cosmos/cosmos-sdk/blob/06a015222f13fe7b41bc3969504da7dee875ae5c/x/auth/ante/fee.go

### 12. VET — VeChainThor

**Fee asset:** VTHO. **Model:** `vechain-clauses`.

Gas = 5000 transaction overhead + sum of each clause type/data/VM gas. Fees are paid in VTHO: dynamic transactions use charged gas × fee-cap-bounded base-plus-priority price; legacy transactions use their coefficient-based price.

- VET is not the gas asset: VTHO pays fees. Single-clause transfer assumptions do not cover multi-clause or contract transactions. VIP-251 dynamic and legacy pricing must not be conflated; delegation changes who pays, not the existence of the fee.

Primary evidence:
- https://docs.vechain.org/core-concepts/transactions/transaction-calculation

### 13. INJ — Injective

**Fee asset:** INJ. **Model:** `cosmos-dynamic-gas`.

Native transaction fee budget = ceil(gasLimit × INJ gas price in inj base units). Txfees enforces a minimum price and high-gas rules, and an adaptive base fee when Mempool1559Enabled is enabled.

- Module defaults are not observed governance values. inj uses 18 decimal places, not the micro-denomination assumed for many Cosmos chains. Trading/maker rebates and sponsorship do not imply arbitrary transfers are free; EVM and token-module operations need separate estimates.

Primary evidence:
- https://docs.injective.network/developers-native/injective/txfees
- https://docs.injective.network/developers-native/core/auth

### 14. FLR — Flare

**Fee asset:** FLR. **Model:** `gas-charged-floor`.

Fee = charged gas × FLR effective gas price (legacy gasPrice or fee-cap-bounded base + priority). Where Helicon is active, at least half the gas limit is charged even if execution uses less.

- Flare 14 / FLR is distinct from Songbird / SGB and Coston test assets. The source describes all transaction fees burned and Helicon minimum-gas charging; activation and live base fee were not queried.

Primary evidence:
- https://dev.flare.network/network/overview

### 15. LUNC — Terra Classic

**Fee asset:** LUNC. **Model:** `cosmos-gas-tax`.

Gas fee budget = ceil(gasLimit × effective gas price), plus applicable transfer/burn taxes under the Classic tax and exemption rules. Taxes can be covered by declared fees or reverse-charged through the message route.

- Do not drop tax when quoting a bank/wasm/IBC-related action. Burn rate, exemptions, caps, fee denominations and charging path are state/message dependent and were not queried. Classic LUNC/columbus history is not Terra 2 LUNA, despite shared uluna naming.

Primary evidence:
- https://github.com/classic-terra/core/blob/498e81a961d752bdcadbce36100227b9b461c477/custom/auth/ante/fee.go
- https://github.com/classic-terra/core/blob/498e81a961d752bdcadbce36100227b9b461c477/custom/auth/ante/fee_tax.go

### 16. XDC — XDC Network

**Fee asset:** XDC. **Model:** `gas`.

Transaction fee = charged gas × effective XDC gas price; native, XRC-20 and contract operations require their own estimates.

- Primary documentation supplies the formula; published 0.25-Gwei/USD/comparison tables are illustrations, not measured prices. No default 21000/35000 gas is installed for this host because examples and fork rules can differ.

Primary evidence:
- https://docs.xdc.network/learn/gas-fees/

### 17. BSV — Bitcoin SV

**Fee asset:** BSV. **Model:** `utxo-bytes`.

Serialized transaction bytes × negotiated/selected BSV base-unit fee rate, with node fee-rate integer rounding and miner/relay policy constraints.

- A miner fee quote can distinguish data and standard bytes or service policy; the Core scalar fee-rate primitive is not proof of a universal miner rate or free data carriage.

Primary evidence:
- https://github.com/bitcoin-sv/bitcoin-sv/blob/6504a3aff65ba97c0f6c80962b033e35ecbfed4b/src/amount.cpp

### 18. PLS — PulseChain

**Fee asset:** PLS. **Model:** `gas`.

Charged execution gas × effective PLS gas price; type-2 price is min(feeCap, baseFee + tipCap), with active-fork refund/data-floor rules.

- Official network page identifies chain 369 / PLS; execution source was inspected at the named GitLab commit. Copied Ethereum token state, bridge assets, HEX, WPLS and PLSX are not thereby verified or native fee assets.

Primary evidence:
- https://pulsechain.com/
- https://gitlab.com/pulsechaincom/go-pulse/-/raw/60db0c8ad721b778c4ddfd0d72c0e675f1bb472a/core/state_transition.go

### 19. SEI — Sei (historical Cosmos/EVM host)

**Fee asset:** SEI. **Model:** `sei-dual-gas`.

Gas-priced SEI fee budget: Cosmos-format transactions declare gas/fees; EVM charges use effective gas price and Sei-specific billed-gas/refund rules, not a universal Ethereum transfer assumption.

- Primary docs say base fees are not burned, governance controls minimum prices and some excess gas limit may not be refunded. They also describe Cosmos/CosmWasm deprecation: the historical cosmos-family derivation is not proof every old operation remains enabled.
- Do not apply a proposed Sei Giga three-part design as an observed mainnet fee model. No automatic estimator or EVM identity/read adapter is added.

Primary evidence:
- https://docs.sei.io/evm/differences-with-ethereum
- https://github.com/cosmos/cosmos-sdk/blob/06a015222f13fe7b41bc3969504da7dee875ae5c/docs/docs/learn/beginner/04-gas-fees.md

### 20. TIA — Celestia

**Fee asset:** TIA. **Model:** `cosmos-blob-gas`.

Declared TIA/utia fee = gasLimit × selected gas price (rounded to base units); PayForBlobs gas includes fixed/transaction overhead and sparse-share bytes × gas-per-blob-byte. Unused declared fee is not automatically refunded.

- The reviewed source enforces a governance-controlled network minimum as well as local mempool policy. Older documentation saying no consensus minimum is not current evidence. Blob sizes/share versions and runtime constants must be checked; no flat per-blob price is assumed.

Primary evidence:
- https://github.com/celestiaorg/celestia-app/blob/bdbfea031687d040b76e68af4e9a2b17d0baefc1/app/ante/fee.go
- https://github.com/celestiaorg/celestia-app/blob/bdbfea031687d040b76e68af4e9a2b17d0baefc1/specs/src/resource_pricing.md
- https://docs.celestia.org/learn/TIA/submit-data/

### 21. THETA — Theta Mainnet

**Fee asset:** TFUEL. **Model:** `theta-dual`.

Native Theta Send transactions declare a TFUEL fee subject to transaction-specific minimums; smart-contract transactions meter gas and pay in TFUEL. THETA and TFUEL are both native assets, but THETA does not pay gas.

- A Theta Send and an Ethereum-format contract call do not have one universal gas rule. Do not use the old RPC sample fee as a current minimum. The two native stable IDs are curated separately from TNT token contracts.

Primary evidence:
- https://docs.thetatoken.org/docs/rpc-api-reference
- https://docs.thetatoken.org/docs/theta-js-sdk-contract

### 22. KAIA — Kaia

**Fee asset:** KAIA. **Model:** `gas-delegated`.

Fee = gas used × effective KAIA gas price. After the Kaia fork effective price = min(baseFee + tipCap, feeCap); historical Magma pricing and fee-delegated transaction types differ.

- Fee payer/ratio transactions can split sponsorship; this is not protocol-free execution. Consult active fork and governance parameters rather than hard-coding an old unit price or KLAY ticker.

Primary evidence:
- https://docs.kaia.io/learn/transaction-fees/
- https://docs.kaia.io/learn/transactions/

### 23. RUNE — THORChain

**Fee asset:** RUNE. **Model:** `thor-native-dynamic`.

Native transfer/inbound fee is the network native_tx_fee_rune value / 10^8 RUNE; ADR-009 makes it USD-targeted and converted to RUNE, not generic Cosmos gas-limit multiplication. Swaps also have route-specific liquidity/affiliate/outbound fees.

- Primary pages conflict: the fee overview still mentions a fixed 0.02 RUNE, while the transaction guide requires reading the dynamic network value. Treat the numeric example as non-binding and require a fresh network quote/halting check; no zero-fee inference from amount: [].

Primary evidence:
- https://dev.thorchain.org/concepts/sending-transactions.html
- https://dev.thorchain.org/concepts/fees.html

### 24. AKT — Akash Network

**Fee asset:** AKT. **Model:** `cosmos-gas`.

Declared native gas budget = ceil(gasLimit × selected AKT/uakt price), or an explicit fee amount; configured client/network floors and validator policy must be satisfied.

- The akt configuration guide distinguishes gas auto (limit estimation), its configured price floor and an authoritative explicit --fees value. Deployment escrow, leases/compute pricing and fee grants are separate from a simple native transfer fee.

Primary evidence:
- https://akash.network/docs/developers/akt/configuration/
- https://github.com/cosmos/cosmos-sdk/blob/06a015222f13fe7b41bc3969504da7dee875ae5c/docs/docs/learn/beginner/04-gas-fees.md

### 25. XEC — eCash

**Fee asset:** XEC. **Model:** `utxo-policy-size`.

Charged virtual transaction size × selected base-unit fee rate, rounded up by Bitcoin ABC EvaluateFeeUp. In XEC display mode, 100 internal satoshi units = 1 XEC (two decimal places); Bitcoin COIN = 10^8 is not the displayed XEC unit.

- Primary amount.cpp explicitly separates XEC (100 × SATOSHI, two decimals) from legacy BCHA (COIN, eight decimals), selected by -ecash. Check the RPC/client display mode before converting a fee quote. Fee rate, script/sigcheck policy, dust and transaction bytes remain transaction-specific.

Primary evidence:
- https://github.com/Bitcoin-ABC/bitcoin-abc/blob/dbf4a10663c28506ddc424e4cb274c7c910086f2/src/feerate.cpp
- https://github.com/Bitcoin-ABC/bitcoin-abc/blob/dbf4a10663c28506ddc424e4cb274c7c910086f2/src/policy/policy.cpp
- https://github.com/Bitcoin-ABC/bitcoin-abc/blob/dbf4a10663c28506ddc424e4cb274c7c910086f2/src/consensus/amount.cpp

### 26. QTUM — Qtum

**Fee asset:** QTUM. **Model:** `utxo-contract-gas`.

Ordinary UTXO transfer fee is policy-size × selected rate. Contract creation/calls additionally budget nGasFee; wallet coin selection includes both size fee and gas budget, and execution refunds require transaction-specific accounting.

- Qtum is a UTXO/EVM hybrid, not an Ethereum-style account-transfer fee for every operation. A token call cannot be estimated by the ordinary UTXO fee alone; no universal gas price or refund is installed.

Primary evidence:
- https://github.com/qtumproject/qtum/blob/493ab77f64425887c8a806fe57bbcdbd8eebfac6/src/policy/feerate.cpp
- https://github.com/qtumproject/qtum/blob/493ab77f64425887c8a806fe57bbcdbd8eebfac6/src/wallet/spend.cpp

### 27. DGB — DigiByte

**Fee asset:** DGB. **Model:** `utxo-vsize`.

Policy virtual size × selected DGB base-unit/vB rate, with upward integer rounding; witness weight and sigop-adjusted policy size are accounted for by Core.

- The historical P2PKH default leaf is only one script type. A current Core source snapshot does not prove a minimum relay rate, DigiAsset fees or a particular transaction confirmation cost.

Primary evidence:
- https://github.com/DigiByte-Core/digibyte/blob/c5449487c59e09171847255213d2d7b90122207b/src/policy/feerate.cpp
- https://github.com/DigiByte-Core/digibyte/blob/c5449487c59e09171847255213d2d7b90122207b/src/policy/policy.cpp

### 28. DYDX — dYdX Chain

**Fee asset:** DYDX. **Model:** `cosmos-multi-fee`.

Gas-bearing transactions declare a Cosmos-style fee budget in a supported fee asset (native DYDX or USDC). Trading/subaccount operations have distinct gas exemptions and trading fees; not every action is a paid bank transfer.

- USDC for gas must be in the main wallet, not locked in another subaccount. DYDX is the default fee-asset scenario label here; an alternative USDC quote must not be mislabeled DYDX. No automatic positive or zero quote is produced.

Primary evidence:
- https://docs.dydx.xyz/concepts/onboarding-faqs
- https://docs.dydx.xyz/concepts/trading/accounts#subaccounts
- https://github.com/cosmos/cosmos-sdk/blob/06a015222f13fe7b41bc3969504da7dee875ae5c/docs/docs/learn/beginner/04-gas-fees.md

### 29. WEMIX — WEMIX3.0 Mainnet

**Fee asset:** WEMIX. **Model:** `gas`.

Charged gas × effective WEMIX price under its EIP-1559 variant: variable base fee plus configured priority policy, bounded by the transaction fee cap.

- The documented default priority fee and maximum base fee are governance-adjustable, not live values. WEMIX3.0 mainnet must not be confused with legacy/wrapped WEMIX token deployments.

Primary evidence:
- https://docs.wemix.com/en/design/eip1559

### 30. RSK — Rootstock Mainnet

**Fee asset:** RBTC. **Model:** `gas`.

Fee = total gas used × Rootstock RBTC gas price, subject to the block header minimumGasPrice and active execution rules.

- RBTC, not RIF or BTC on Bitcoin L1, pays gas. Negotiated minimum gas price changes by block. Peg-in/out, bridge and service costs are separate; experimental fiat-stable configuration is not a fixed network-wide USD charge.

Primary evidence:
- https://dev.rootstock.io/concepts/rbtc/gas/

### 31. ISLM — HAQQ L1 Network

**Fee asset:** ISLM. **Model:** `gas`.

HAQQ L1 EVM fee = charged gas × effective ISLM price (aISLM base units), with fee-cap/base-fee validation. Cosmos-format transactions use separately checked declared fee budgets.

- This profile is HAQQ L1 chain 11235, not the separate Ethiq L2 and its L1-data fees. Active feemarket settings and refund rules require simulation; no unconditional EIP-1559/burn/zero-fee assumption is made.

Primary evidence:
- https://github.com/haqq-network/haqq/blob/9c8401da06e2514e16f75fcd8177698dea04b5c7/x/evm/keeper/fees.go
- https://github.com/haqq-network/haqq/blob/9c8401da06e2514e16f75fcd8177698dea04b5c7/app/ante/evm/fee_checker.go
- https://github.com/haqq-network/haqq/blob/9c8401da06e2514e16f75fcd8177698dea04b5c7/app/ante/cosmos/fees.go
- https://docs.haqq.network/l1-network/modules/evm/

### 32. KAVA — Kava Cosmos co-chain

**Fee asset:** KAVA. **Model:** `cosmos-evm-gas`.

Cosmos-format budget = ceil(gasLimit × accepted KAVA/ukava price); Ethereum-extension transactions route through separate EVM fee checking/accounting in akava.

- The native Cosmos fee path filters the EVM denomination out of node minimum-price checks. ukava and akava are different unit scales; a single hard-coded Ethereum gas price must not be applied to both co-chains.

Primary evidence:
- https://github.com/Kava-Labs/kava/blob/917cc322eae208c29faeaac83d524a5b07b39d78/app/ante/ante.go
- https://github.com/Kava-Labs/kava/blob/917cc322eae208c29faeaac83d524a5b07b39d78/app/ante/min_gas_filter.go
- https://docs.kava.io/docs/nodes-and-validators/node-setup-guide/

### 33. PEAQ — peaq (EVM and Substrate runtime)

**Fee asset:** PEAQ. **Model:** `substrate-evm-gas`.

EVM charges gas at a runtime-derived PEAQ price using weight-per-gas and the congestion multiplier. Substrate extrinsics use base/length/adjusted-weight fees plus tip and EoT adjustment, with configured currency conversion where available.

- The two transaction surfaces have different fee paths; the Substrate EoT/currency-swap adapter is not automatically an EVM fee exemption. Existential deposits, active runtime weights, accepted currencies and DEX conversion liquidity are separate requirements.

Primary evidence:
- https://github.com/peaqnetwork/peaq-network-node/blob/9c18928975d96780a9fa1431e80589732a6388a8/runtime/peaq/src/lib.rs
- https://github.com/peaqnetwork/peaq-network-node/blob/9c18928975d96780a9fa1431e80589732a6388a8/runtime/common/src/payment.rs

### 34. KUB — KUB Mainnet (formerly Bitkub Chain)

**Fee asset:** KUB. **Model:** `gas`.

Execution fee = charged gas × effective KUB gas price; unused gas/refunds are handled by the selected fork rules, not a fixed total fee per transaction.

- Primary docs identify L1 chain 96 / KUB; the KUB Layer 2 chain 9601 is distinct. Historical 5/25-Gwei descriptions are not a present quote; no constant gas price or L2 fee model is imported.

Primary evidence:
- https://github.com/kub-chain/bkc/blob/28cb5603e9c866a0ff67c5e0520274adf819402a/core/state_transition.go
- https://docs.kubchain.com/about-kub/connect-to-kub.md
- https://docs.kubchain.com/about-kub/glossary.md

### 35. XVG — Verge

**Fee asset:** XVG. **Model:** `utxo-rounded-kb`.

Pinned Verge fee-rate code charges nSatoshisPerK × ceil(serializedBytes / 999); its fee-paid constructor sets 10 × CENT (commented as 0.1 XVG) for non-empty size. Confirm wallet/relay policy before estimating.

- Unlike the exact-byte Bitcoin-like models, this source has a 999-byte rounding constant and a fixed-rate constructor. This is a source observation, not proof of all deployed versions or a live minimum. No generic BTC sat/vB estimate is used.

Primary evidence:
- https://github.com/vergecurrency/verge/blob/6e9651d5ee0e19403007b8bbd83039fd3b3f8913/src/policy/feerate.cpp

### 36. 0G — 0G Mainnet

**Fee asset:** 0G. **Model:** `gas-charged-floor`.

Charged gas × effective native 0G price. In the pinned geth implementation, when restaking is active, billed gas is at least floor(gasLimit × 80 / 100), in addition to applicable data/refund rules.

- Official docs identify mainnet 16661 and native 0G without a token contract. Fork/activation state was not queried; storage/compute service fees and bridged/wrapped tokens are distinct. Overestimating the gas limit can increase the actual fee after the charging-floor activation.

Primary evidence:
- https://github.com/0gfoundation/0g-geth/blob/d5a7ee6f0148d08d3d5e542cdd749d647f69c44b/core/state_transition.go
- https://docs.0g.ai/introduction/how-to-get-0g

### 37. AXL — Axelar

**Fee asset:** AXL. **Model:** `cosmos-allowlisted-gas`.

Declared gas-priced fee budget = ceil(gasLimit × accepted price), normally AXL/uaxl. Reviewed ante code allows at most one governance-allowlisted fee denomination (default uaxl), then applies SDK fee deduction.

- Cross-chain GMP/gas-service delivery is not priced solely by the native AXL fee. An empty fee bypass in a denomination guard is not proof an ordinary transaction passes later minimum-fee checks or is free. Governance allowlist/current rates were not queried.

Primary evidence:
- https://github.com/axelarnetwork/axelar-core/blob/707eee78e1071a8208acc539261ed4f4b4aed251/x/ante/ante.go
- https://github.com/axelarnetwork/axelar-core/blob/707eee78e1071a8208acc539261ed4f4b4aed251/x/ante/limit_fee_denom.go
- https://github.com/axelarnetwork/axelar-core/blob/707eee78e1071a8208acc539261ed4f4b4aed251/x/feepolicy/types/params.go
- https://docs.axelar.dev/infrastructure/node/setup#cli-configuration

### 38. RON — Ronin Mainnet

**Fee asset:** RON. **Model:** `gas`.

Charged gas × RON gas price; after EIP-1559 activation, effective price is bounded by maxFeePerGas and includes base fee + priority fee. Use active-fork fee data, not the old flat 20-Gwei suggestion.

- The primary guide describes an activation-height transition and a 20-Gwei priority floor plus variable base fee. It is not an independent current-state observation. Sponsored/free-transaction programs do not imply all Ronin transfers are free.

Primary evidence:
- https://docs.roninchain.com/developers/network/eip-1559/

### 39. RVN — Ravencoin

**Fee asset:** RVN. **Model:** `utxo-asset-burn`.

Ordinary fee = serialized size × chosen RVN base-unit/byte rate with Core rounding. Asset issuance/reissuance and other asset operations additionally require transaction-type-specific burns.

- Pinned mainnet config has separate issue/reissue/subasset/unique/restricted-asset burn amounts and addresses. Those burns are not the miner fee or a universal cost for sending existing RVN/assets.

Primary evidence:
- https://github.com/RavenProject/Ravencoin/blob/6d48ae0175b10283248146ae3080e2ba70966739/src/policy/feerate.cpp
- https://github.com/RavenProject/Ravencoin/blob/6d48ae0175b10283248146ae3080e2ba70966739/src/chainparams.cpp

### 40. BAND — BandChain

**Fee asset:** BAND. **Model:** `cosmos-globalfee`.

Declared fee = ceil(gasLimit × accepted BAND/uband price). The globalfee checker combines local and global price requirements during CheckTx; oracle requests also depend on script/data-source work.

- Documentation gas tables are resource estimates, not token-denominated prices. Read current governance/node policy and account for oracle/data-provider charges; a zero fallback in a parameter helper is not a free-transfer promise.

Primary evidence:
- https://github.com/bandprotocol/chain/blob/33998e8cb67a3d8c87ba080bc395517d57581fff/x/globalfee/feechecker/feechecker.go
- https://docs.bandchain.org/core-concepts/gas-and-fee
- https://docs.bandchain.org/develop/developer-tools/bandchain.js/getting-started

### 41. LUNA — Terra 2

**Fee asset:** LUNA. **Model:** `cosmos-gas`.

Declared Cosmos fee budget = ceil(gasLimit × accepted LUNA/uluna gas price), with SDK deduction, simulation and message-specific execution/resource costs.

- Terra 2 LUNA is separate from Terra Classic LUNC. Shared denom text/Bech32 format is not identity proof; do not transplant Classic burn-tax policy to this host. Fee grants change payer, not the existence of fees.

Primary evidence:
- https://github.com/terra-money/core/blob/7dce06b225b2ef57ddd69f7ac729a98c6257e5a1/app/ante/ante.go
- https://github.com/terra-money/core/blob/7dce06b225b2ef57ddd69f7ac729a98c6257e5a1/app/params/denoms.go
- https://github.com/cosmos/cosmos-sdk/blob/06a015222f13fe7b41bc3969504da7dee875ae5c/docs/docs/learn/beginner/04-gas-fees.md
- https://docs.terra.money/develop/module-specifications/spec-feegrant/

### 42. MERLIN — Merlin Mainnet

**Fee asset:** BTC. **Model:** `rollup-gas`.

Merlin L2 execution is gas-priced in native Merlin_BTC; obtain a transaction-specific L2 fee quote and separately account for applicable bridge/withdrawal or data-service charges. MERL-as-gas in AA wallets is a separate sponsored/conversion path.

- MERL is not the universal native fee asset. The primary gas guide does not establish an independently verified parent-data fee formula or a current subsidy; a plain Ethereum execution-only total would be incomplete. No automatic rollup estimate is added.

Primary evidence:
- https://docs.merlinchain.io/merlin-docs/user-quick-start/how-to/gas
- https://docs.merlinchain.io/merlin-docs/user-quick-start/how-to/staking-and-unstaking/unstaking/nft

### 43. HECO — Huobi ECO Chain (historical)

**Fee asset:** HT. **Model:** `historical-gas`.

Historical HECO execution fee = gas charged × HT gas price under the forked client rules; sponsored/meta-transaction arrangements change payer or subsidy, not a general zero fee.

- Historical primary project source only. Operational status, shutdown/withdrawal availability, live RPCs, current token migrations and testnets remain unverified. No endpoint or balance adapter is enabled; do not send funds based on this archival profile.

Primary evidence:
- https://github.com/stars-labs/heco-chain/blob/123ccb14caf0bb27a7563de7f55db54910d92fdd/README.md
- https://github.com/stars-labs/heco-chain/blob/123ccb14caf0bb27a7563de7f55db54910d92fdd/core/state_transition.go

## Additional correction: Cronos EVM

EVM fee ≈ gas charged × min(baseFee + tipCap, feeCap), paid in CRO. Cronos feemarket parameters differ from Ethereum and are governance controlled.

- Separate primary-documented chain 25 from Cronos POS/basecro. This extra profile corrects the historical VVS research mapping only; no VVS contract, decimals, transfer behaviour or holdings are verified.
- No default gas/minimum, testnet token deployment, new RPC or balance adapter is enabled by the fee-model review.

- https://docs.cronos.com/for-users/metamask
- https://docs.cronos.com/for-users/tips-and-faqs.md
- https://docs.cronos.com/for-dapp-developers/cronos-evm-differences-from-ethereum/gas-mechanics.md

## Remaining acceptance gates (not closed by this research)

1. Independent token deployment/issuer/migration/decimals/behaviour reviews.
2. Live, consented transaction-specific fee quotes and separate network-identity
   validation; never send a mnemonic/private key to a provider.
3. Historical network status, especially HECO; current chain governance and
   activation state, including the charging floors on AVAX/FLR/0G.
4. Mobile/desktop wallet-path and transaction-format compatibility, funded-device
   validation, and any new balance readers. No signing/broadcast API was added.
5. Privacy-gated manuscript/Drive/Notion work and all other unrelated backlog
   gates remain open. This round does not assert access or publish private data.

## Reproducibility and validation

The registry, deterministic 500-row inventory and regression tests are updated
in this round. Test results are recorded in the round-83 execution report after
validation; source review itself is not a passing runtime check.
