# Coin fees, network evidence and opt-in investigation

## What is implemented, and what is not

Keyspace section 14 now has **Fees & networks**, **Wallet investigation** and
**NFT / token metadata** tabs. The asset selector supports historical rank,
manual USD fee-scenario order, native candidates, token/unverified deployments,
unsupported derivation, pending fee reviews and host groups. All 500 historical
asset rows are retained; no ticker is silently treated as a verified contract.

The deterministic [per-asset coverage inventory](coin-research-inventory-2026-11-17.md)
records every defined asset and its gaps. This is **not 500 completed independent
asset reviews**. The research overlay has 57 host profiles, 17 primary-reviewed
fee models and 40 pending fee models. Only USDT's three existing mainnet contract
identities are catalogued. Most token deployments still need issuer/contract,
wrapped/migration, decimals and transfer-behaviour verification. Historical
SLIP-44/host mappings are not proofs of a token's current deployment.

No user mnemonic was processed, public-chain provider probed, holdings queried,
transaction signed or transaction broadcast during this implementation. Tests
use published throwaway BIP-39 vectors and synthetic provider responses. URLs
from documentation are not liveness, CORS, correctness or availability guarantees.

## Free to expensive: what is comparable

A native amount in SOL is not numerically comparable with one in XRP or ETH.
The default leaves all positive/unpriced and unknown entries unranked. Only
Nano's documented zero **protocol monetary fee** ranks at zero without a price;
it still has user-generated PoW/resource and possible service costs, and this
app does not support Nano derivation.

The JSON scenario accepts bounded, finite `prices` in USD per **fee asset**,
`nativeFees` by asset ID or `assetID@networkID`, `gasGwei` by ETH/BSC/HYPE/AVAX,
`tokenGas` by asset ID, and Bitcoin `vbytes` / `satPerVbyte`. Litecoin's
reviewed policy is documented separately; the BTC-only vbyte scenario is not
silently reused because Litecoin Core's reviewed `GetTotalFee` also accounts
for MWEB weight. Dogecoin's documented policy is also reviewed, but no DOGE
scenario calculator is enabled; its recommended/minimum relay rates are policy
settings, not transaction-specific quotes. For Avalanche,
`tokenGas` / native gas units must represent charged gas (including the Helicon
`max(gasUsed, gasLimit / 2)` floor); the manually supplied gwei price is an
assumption, not an RPC quote. This simple arithmetic omits transaction fee-cap
selection, changing base fee, inclusion timing, and any protocol-specific limits.
Nothing is fetched or saved. An explicit user-entered zero is labeled a scenario,
not an inferred
free transaction. Rollups do not receive an Ethereum-only fee estimate that
silently omits their parent-data charge. Testnet rows have no mainnet ranking.

| Reviewed model | Documented basis, not a live quote |
| --- | --- |
| Nano | Zero protocol monetary fee; PoW/resource/service costs separate |
| Solana | 5,000 lamports/signature base; priority and account/rent costs separate |
| XRP Ledger | Standard base 10 drops; load scaling / special transactions differ |
| Stellar | Inclusion minimum 100 stroops/operation; surge, contract resources/storage separate |
| Ethereum | `gasUsed × effectiveGasPrice`; simple native transfer 21,000 gas, not arbitrary tokens |
| BSC | Gas paid in BNB; BEP-20 execution cost differs from native transfer |
| TRON | Bandwidth/Energy and possible TRX burn; not an unconditional free-transfer promise |
| HyperEVM | HYPE, EIP-1559-style gas, base/priority fees burned; distinct from HyperCore |
| Avalanche C-Chain | AVAX; dynamic EIP-1559-style effective price `min(gasFeeCap, baseFee + gasTipCap)`, with base and priority fees burned. Since Helicon, charged gas is `max(gasUsed, gasLimit / 2)`; the base fee is a worst-case bound and the validator-voted minimum can change. No fixed minimum is assumed here. |
| Base | L2 execution + L1 security/data charge; minimum execution fee is not total cost |
| Arbitrum One | Child-chain execution and parent-chain poster/data components |
| Monad | **Gas limit** × effective MON gas price, not gas used; documented 100 MON-gwei floor implies 0.0021 MON for 21,000 gas, excluding priority/load changes |
| Sonic | EVM gas in S, published network parameters; no live gas-price measurement |
| Celo | CELO/default and allowlisted alternative fee currencies/adapters; not an all-token gas exemption |
| Bitcoin | Transaction vsize × selected sat/vB; inputs/outputs and congestion matter |
| Litecoin | Litecoin Core selects/configures a litoshi-per-kilobyte fee rate over serialized bytes, subject to wallet estimator/fallback and relay/mempool minima; MWEB adds 100 litoshis per MWEB weight unit in the pinned source. No single fixed transfer fee. |
| Dogecoin | Dogecoin Core v1.14.9 recommends 0.01 DOGE/kB for wallet/miner inclusion and documents a 0.001 DOGE/kB default relay minimum; exact transaction size determines rate-based cost, while local settings/miner policy and sub-dust outputs can change it. Defaults are policy, not consensus or a live quote. |

For example, 21,000 × 12 gwei = 0.000252 ETH is only an illustrative execution
scenario. A token call needs its own gas assumption/estimate. Fees can exclude
priority, data posting, activation, rent, deposits, bridging, exchange withdrawal
and service charges. Contract failures can also consume fees.

## Test identities and derivation

The following **18 host test-network identities** have primary documentation;
matching address encodings do not verify any particular token deployment:

- Bitcoin testnet4 and signet: `tb`, P2PKH 111 / P2SH 196, curated SLIP-44 test
  coin type 1; mainnet remains `bc` / coin type 0. These two networks share
  address encoding but are different ledgers. No Bitcoin balance reader added.
- Ethereum Sepolia 11155111; BSC 97; Avalanche C-Chain Fuji 43113; Base Sepolia
  84532; Arbitrum Sepolia 421614; HyperEVM 998; Flare Coston2 114; Celo Sepolia
  11142220; Monad Testnet 10143.
- Solana Devnet and validator-oriented Testnet; XRPL Testnet; Stellar Testnet;
  TRON Shasta and Nile; NEAR Testnet implicit-account encoding.

No mainnet token contract/decimals are copied onto a testnet. The host address
may still be derived for educational inspection, but its token balance stays
**unsupported**, not zero. Use a separate test mnemonic; test balances do not
carry into mainnet and faucets may reset. A curated default path is not a claim
about every wallet's account, purpose, coin type or passphrase convention.

## Local default-leaf investigation

`js/wallet-investigation.js` validates a standard/checksum-valid BIP-39 phrase,
runs one PBKDF2 and derives one curated default mainnet leaf per supported asset.
Shared `(family, chain, path)` results are cached. The public table contains
asset ID/symbol/host, path, public key, address, derivation status and initially
`unqueried` holdings. No seed/private key/phrase enters its rows, storage,
webxdc updates, URL or HTTP body. The caller-owned seed is cleared best-effort;
JavaScript cannot guarantee memory erasure. This is not constant-time audited
wallet software: never use funded/real recovery phrases in this educational app.

The 500-row public vector regression produced 347 derived rows, 153 explicitly
unsupported rows and no derivation errors. This means only those default leaves
can be encoded; it proves no balances or completeness of recovery. Alternate
accounts/indices/passphrases, gap limits, imported keys, contract wallets and
wallet-specific derivation choices remain outside scope.

Phrase input, phrase application, passphrase edits and clear invalidate batch
results, queued single derivations and in-flight lookup epochs. Asset/network/
endpoint changes invalidate the selected lookup and its consent. Cancellation
is checked at each derivation yield; stale late provider results cannot restore
cleared UI. A dirty/unapplied phrase is refused before derivation.

## Read-only balance boundary

`js/chain-read.js` has no connection/signing/broadcast API. RPC methods are
allowlisted to `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_getCode`,
`eth_call` and Solana `getAccountInfo`. Before address/contract disclosure, the
EVM reader checks that the provider-reported chain ID matches the selected
expected ID and pins reads to one reported block. That is **not independent
network verification or a proof against a malicious provider**.

Readers cover native EVM, catalogued mainnet EVM ERC-20, native Solana, native
Stellar and native TRON. The non-EVM network identity is **not independently
verified**; the user selects/trusts the documented endpoint. Other token/chain
readers are unsupported. The endpoint receives one selected public address,
any necessary catalogued contract, and the user's IP; it may correlate/log
requests. No automatic batch lookup is performed. Consent is explicit and
one-shot. Revoking it aborts the pending read, clears its pending UI and ignores
late replies; it cannot retract requests already sent to the provider. All
amounts are parsed exactly (BigInt or checked safe-integer wire values), not via
lossy floating-point token balances.

- `unqueried`: no lookup for this selection;
- `unsupported`: no derivation/reader/verified token deployment;
- `error`: CORS/rate limit/timeout/revert/malformed reply; never zero;
- `unavailable`: provider reports an absent/uncreated/unactivated account;
- `observed-zero` / `observed-nonzero`: provider-reported balance at **this one
  address/block/slot**, not a whole-wallet scan, independent verification,
  ownership/spendability or proof that no other assets exist.

Solana uses a zero-data-slice account read rather than `getBalance`, which
would conflate a missing account with zero. Stellar and TRON reject mismatched
returned account identities. EVM cannot infer an account's history/existence
or ownership from a native zero alone. A small number of checked paths never
establishes an empty wallet.

Requests use HTTPS, omit credentials/referrer, disable cache, disallow redirects,
have a 12-second per-request timeout and a 1 MiB response limit. URL checks
reject IP literals, local names, userinfo and fragments, **but do not resolve
DNS or rule out DNS rebinding/private DNS answers**. This browser helper must
not be exposed as an unrestricted server-side fetch proxy. SITE-K's SW bypasses
cross-origin, non-GET and `no-store` requests; balances/metadata are not cached.

## Actual NFT viewer, not a parallel replacement

The existing `apps/index3.html` is now driven by local `js/nft-viewer.js` and is
embedded in Keyspace without receiving the mnemonic or derived address. It
supports ERC-20 name/symbol/decimals/raw total supply, and ERC-165-gated ERC-721 /
ERC-1155 facts, owner and URI at one provider-reported EVM block. Optional reverts
or malformed metadata remain unavailable; code presence and a symbol do not
verify identity, backing, authorship, approval safety or authenticity.

A URI returned by a contract is a pointer, not proof that its JSON/image is
on-chain. Fetching JSON requires **separate consent**, including IPFS/Arweave
public gateways. A JSON data URI can be decoded locally, also after the separate
step. Both consents reset after their single read; revocation aborts the matching
pending request and suppresses stale results without retracting prior traffic.
JSON is rendered via `textContent`, never `innerHTML`. External HTML/SVG,
images and animations are not executed/automatically loaded; safe HTTPS links
are optional navigation with `noopener noreferrer`. Off-chain data is untrusted
and may change. This is a deliberate safety change from the earlier automatic
metadata/image loading.

## Discovery and primary provenance

Requested discovery routes used: `baresearch.org`, `libresearch.space`,
`search.utilibre.org` (the search tool reached via Utilibre), and `searx.space`
(an instance directory, not a fee oracle). Each asset has those discovery links.
Network/fee facts are grounded in primary documentation where reviewed, not
search snippets or marketing USD tables. More source URLs and separate review
statuses are in `config/chain-research.json`.

- https://docs.nano.org/what-is-nano/overview/
- https://solana.com/docs/core/fees and https://solana.com/docs/references/clusters
- https://ethereum.org/developers/docs/gas/ and https://ethereum.org/developers/docs/networks/
- https://ethereum.org/en/developers/docs/apis/json-rpc/
- https://docs.bnbchain.org/bnb-smart-chain/developers/quick-guide/
- https://developers.tron.network/docs/resource-model and https://developers.tron.network/docs/networks
- https://build.avax.network/docs/rpcs/other/guides/txn-fees (C-Chain fee mechanics; Helicon/ACP-194 and validator-voted minimum/ACP-283)
- Litecoin Core at pinned commit [`9fe73a4`](https://github.com/litecoin-project/litecoin/tree/9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343): [wallet/fees.cpp](https://github.com/litecoin-project/litecoin/blob/9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343/src/wallet/fees.cpp), [policy/feerate.cpp](https://github.com/litecoin-project/litecoin/blob/9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343/src/policy/feerate.cpp) and [policy/feerate.h](https://github.com/litecoin-project/litecoin/blob/9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343/src/policy/feerate.h)
- Dogecoin Core v1.14.9: [fee recommendation](https://github.com/dogecoin/dogecoin/blob/e0a1c157791544e818c901bd9341896965afbf9d/doc/fee-recommendation.md), [fee implementation](https://github.com/dogecoin/dogecoin/blob/e0a1c157791544e818c901bd9341896965afbf9d/src/dogecoin-fees.cpp), and [release notes](https://github.com/dogecoin/dogecoin/releases/tag/v1.14.9). The fee guide says it was last updated for v1.14.6.
- https://xrpl.org/docs/concepts/transactions/transaction-cost and https://xrpl.org/docs/concepts/networks-and-servers/parallel-networks
- https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering and https://developers.stellar.org/docs/networks
- https://docs.base.org/specifications/transactions/network-fees
- https://docs.arbitrum.io/how-arbitrum-works/deep-dives/gas-and-fees and https://docs.arbitrum.io/chain-info
- https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm
- https://docs.monad.xyz/developer-essentials/gas-pricing and https://docs.monad.xyz/developer-essentials/testnet
- https://docs.soniclabs.com/sonic/build-on-sonic/network-parameters
- https://docs.celo.org/learn/network/overview
- https://docs.near.org/protocol/network/networks
- https://docs.openzeppelin.com/contracts/5.x/erc721
- Bitcoin Core pinned source: https://github.com/bitcoin/bitcoin/blob/d55f55eda79a98ddaad7f7bec9faca8beb097b99/src/kernel/chainparams.cpp
- Secondary EVM catalogue only, not primary verification: https://github.com/ethereum-lists/chains/tree/ced25e716d875bfb78361772e4415784af0f86f5

## Regression checks

```sh
node tools/build-coin-research-inventory.mjs --check
node --test tests/coin-research.test.mjs tests/chain-read.test.mjs tests/coin-workbench-dom.test.mjs
node --import ./tests/stubs/register.mjs tests/05-viewer-dom.mjs
```

The checks cover all 500 coverage rows, exact default-leaf public vectors,
Bitcoin test encodings vs an independent scure derivation, native/token fees,
unknown-last ordering, explicit consent, chain mismatch before disclosure,
malformed/oversized provider data, missing-vs-zero accounts, stale-result
cancellation and inert NFT metadata. They are not a security audit or validation
of live endpoints/holdings. The package graph and real-browser checks are
separate gates.
