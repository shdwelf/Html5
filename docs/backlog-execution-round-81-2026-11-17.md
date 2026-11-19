# Backlog execution round 81 — coin investigation and encrypted-mask follow-up

## Implemented in this round

- Keyspace section 14: host/native-candidate/token/unsupported/pending groups,
  manual fee-scenario order, explicit native/host/fee distinctions, per-asset
  evidence summaries and the requested discovery links.
- All 500 historical assets have a deterministic [coverage/gap inventory](coin-research-inventory-2026-11-17.md).
  This is not 500 independent issuer/contract reviews: 57 host profiles have
  **14 reviewed fee models / 43 pending**, and **18** host test-network
  identities. Only the prior three USDT mainnet contracts are catalogued.
- Bitcoin testnet4/signet explicit type-1 / `tb` address encoding, independent
  scure derivation comparison, unchanged mainnet defaults. Host test identities
  never inherit mainnet token contracts or economic ranking.
- Local default-leaf investigation: checksum-valid standard BIP-39, one seed,
  cached host/path leaves, abort/yield/progress, public fields only. Published
  vector test: 347 derived, 153 unsupported, no errors, all holdings unqueried.
- Opt-in, one-selected-public-address, read-only lookup. EVM expected chain ID
  guard before address disclosure, block-pinned reads; non-EVM network identity
  remains unverified. Missing/uncreated accounts, unsupported adapters, errors
  and provider-observed zero/nonzero have different states. No whole-wallet
  absence/ownership/spendability claim, signing, broadcast or automatic queries.
- Extended the actual `apps/index3.html` NFT viewer with ERC-20 facts and local
  read helpers. Off-chain JSON has separate consent; remote images/animations/
  HTML/SVG are not auto-loaded/executed. All metadata remains untrusted text.
- Kitchen **525** operations: distinct plaintext `fheMaskLab` recipe and pack;
  separate actual node-seal BFV encrypted-update + encrypted-mask companion.
  Depth one, lazy relinearization once, positive noise budget, exact expected
  sums, empty-selection and maximum-bounds checks. No bootstrapping or paper
  speedup reproduction. [FHE workload report](cyberchef-fhe-masked-aggregation-2026-11-17.md).
- Keyspace/SITE-K dependency closures include the registry, helpers and actual
  metadata page; SW v47 bypasses `no-store` reads as well as cross-origin/non-GET.

## Research and external-state limits

The coin research used all requested discovery routes followed by primary
network/fee docs; sources and detailed limitations are in
[the coin report](coin-fees-and-investigation-2026-11-17.md). No live fees,
prices, endpoint probes or real holdings are asserted. Public vectors and
synthetic RPC replies were used, not user recovery material.

Two additional connected-resource openings (Lancelot and vehicular cloud
control) were reviewed with explicit truncation. They motivated a different
bounded mask workload, not a recreated FL/vehicle experiment. The vehicular
verification is CKKS/SEAL + Hyperledger Fabric, not the BFV companion. No private
cloud IDs, source books, invitations or phrase-like backup notes are published.

Notion now has a research index, a public-safe technical draft, a separate
editorial working brief and an updated **written** Agent instructions handoff.
Content classification is not access control; Notion sharing remains
unverified, so sensitive manuscript material was withheld. Further targeted
searches did not locate an appropriate integration-visible manuscript. No agent
invocation API is available in the discovered tool set and no Notion agent is
claimed to have started. The author must confirm/share the manuscript page and
private audience before sensitive synchronization or chapter editing. Existing
source/evidence-tier, chronology-first and stable-register-ID rules stand.

## Reproducible checks

```sh
npm run check:coin-research
node --test tests/coin-research.test.mjs tests/chain-read.test.mjs tests/coin-workbench-dom.test.mjs tests/fhe-mask.test.mjs
node --import ./tests/stubs/register.mjs tests/05-viewer-dom.mjs
node tests/11-wallet-coins.mjs
# For a server serving public/apps/keyspace (optional local Chromium dependencies):
node tests/07-browser.mjs http://127.0.0.1:8000/index.html
npm test
sh tools/pack_keyspace.sh
node scripts/build-cyberchef-xdc.mjs
SITEK_ONLY=1 sh tools/pack_xdc.sh
node --test tests/webxdc-packages.test.mjs tests/sitek-navigation.test.mjs tests/cyberchef-sfx.test.mjs
```

## Final local validation

- Vitest: **318 passed in 36 files**, no failures.
- Full Node runner: **1,122 tests; 1,110 passed, 12 optional skipped, 0 failed**.
  The optional skips remain skips, not claimed runtime validation.
- Actual Chromium/SwiftShader Keyspace run: **46 passed, 0 failed**, no browser
  console/network errors. It renders all 500 rows (347 derived / 153 explicitly
  unsupported), checks the known public BEP-20 holder, fee ordering, local NFT
  iframe and phrase reset, and observes **no automatic external requests**.
- Actual viewer DOM: **77/77**; legacy wallet/coin stack: **133/133**.
- Workbench/NFT DOM regression: **5/5**, including one-shot disclosure consent,
  revocation aborts, cleared pending UI and suppression of late provider replies.
- Real BFV default, empty selection and maximum accepted workload match the exact
  reference; validated 128-bit context, fresh mask ciphertexts, positive noise
  budget, depth one, one lazy relinearization and **zero bootstraps**.
- Deterministic 500-row research inventory, local dependency/archive freshness,
  explicit public-corpus privacy exclusions and `git diff --check` are checked
  separately from cryptographic application security or live provider validity.

Final archive/wiki/model/read/DOM/BFV release regression: **56/56 passed**, no
skips or failures. The rebuilt Wiki contains **341 approved Markdown pages**;
private editorial/backlog context is explicitly excluded rather than weakening
the privacy preflight.

| Rebuilt deliverable | Bytes | SHA-256 |
| --- | ---: | --- |
| `keyspace.xdc` | 489,941 | `efd148383f5a8fe3425a97b99e8b3f3b7cdaa4cade7599a0d40e1f545781173e` |
| `cyberchef.xdc` | 1,105,682 | `313336abadda57761c265b91631edd38522382b590a91c933770ac59af78deeb` |
| `wikiinajar.xdc` | 1,902,556 | `a9c539b0dbfa056bec4f95ee9e8e643dc36dd1cf13981c75691efc17443c5d11` |
| `sitek.xdc` | 15,976,498 | `641d40e9d19a6097d45da0df887df5c5f2fb072db29cb34642fd08f2bb459297` |

The browser run caught a real UI overlap: the older sticky math pager covered
new tabs when controls scrolled. Tabs now remain reachable below that pager;
the passing run uses real clicks, not injected activation. Initial stale
operation-count / SW-version assertions were updated for 525 operations / v47.
The first browser invocation used an invalid server-relative route; only the
correct-route passing result above counts as runtime evidence.

PR #223 is the authorized merge target. The previous-head Android job first
exceeded its 60-minute execution limit during emulator smoke tests (confirmed
by its check annotation), then **passed on rerun** including both public/private
APK checks and real Android WebView/Headline Harry smoke tests. This does not
validate SnapSafe or another Android application. A new push still requires
matching-head Android and DOSBox checks; the final GitHub merge result is not
inferred from earlier-head success.

## Bounded continuation on `arena/0ebdf4ca-html5`

Reviewed the primary Avalanche Builder Hub transaction-fee guide and recorded
its C-Chain (not X/P-Chain) fee mechanics in `config/chain-research.json`:
EIP-1559-style cap/tip pricing, AVAX burning, Helicon charged-gas floor, and a
mutable validator-voted minimum. The docs report the floor at 5 nAVAX in late
September 2026; this is preserved as dated context only, not a hardcoded current
value. `eth_baseFee` is a worst-case bound since Helicon; this review did not
query RPC or validate live fee parameters. The host's fee status moves from
pending to primary-reviewed, updating the inventory to **15 reviewed / 42
pending**; this does not independently review AVAX assets or token contracts.

The local, user-supplied fee scenario now accepts AVAX gas inputs for native and
token arithmetic. Those are explicit assumptions (charged gas units, effective
gwei price and optional fee-asset USD price), not quotes, transaction
simulation, fee-cap recommendations, or forecasts. Parent-data rollup behavior
remains excluded. Regression coverage tests native and token arithmetic and
labels the result as user-entered. Detailed qualifications are in the [coin
fee report](coin-fees-and-investigation-2026-11-17.md).

A second bounded item reviewed Litecoin Core fee handling at pinned upstream
commit `9fe73a4bd1433f9b90ee0ea5fc6e985b6702d343`. Wallet fee rate × serialized
bytes is constrained by the wallet's estimator/fallback and relay/mempool floors;
MWEB adds a weight-based component. Marked the **fee model** primary-reviewed,
while keeping Litecoin host identity pending as a separate evidence question.
The generic BTC vbyte scenario is deliberately not applied to LTC: no Litecoin
transaction estimator or live mempool quote was added. Inventory now records
**16 reviewed / 41 pending** host fee models. Tests assert both the separated
identity status and that BTC-only assumptions yield no LTC estimate.

A third bounded host-fee item reviewed Dogecoin Core v1.14.9. Its maintained fee
guide (last updated for v1.14.6) distinguishes the 0.01 DOGE/kB wallet/miner
recommendation from the 0.001 DOGE/kB default relay minimum; source code also
applies dust-related fees. Recorded those as configurable software policy, not
consensus requirements or a live estimate. DOGE identity remains pending, and
no Dogecoin calculator or Bitcoin vbyte fallback was introduced. The inventory
now has **17 reviewed / 40 pending** host fee models; the regression guards
against accidentally using BTC scenario fields for DOGE.

For the read-adapter/identity gate, added a Solana `getGenesisHash` preflight for
curated Mainnet, Devnet and Testnet hashes. A mismatch stops before the selected
account address is sent; a cluster without an expected hash is unsupported. This
checks accidental endpoint/cluster mismatch, not a malicious provider: no
second-provider quorum, consensus proof, Stellar/TRON identity proof, or new
balance reader was added. Mock tests assert request order, fail-closed mismatch,
and that the address is not disclosed before the hash matches.

### Continuation validation and package refresh

- Targeted fee/read/UI regression: **26/26 passed**.
- Full `npm test`: Vitest **318/318 passed**; Node **1,110 passed, 12 optional
  skipped, 0 failed** (1,122 total). The run exposed stale tracked Keyspace/SITE-K
  packages; both were rebuilt and their two archive freshness tests then passed.
- `npm run check:coin-research` and `git diff --check` passed.

| Refreshed tracked archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `keyspace.xdc` | 491,864 | `6a65d496ad10a0713626d2e722bb02fefe4acb9461e84a9425a427cbcd45fe34` |
| `sitek.xdc` | 15,979,680 | `348596c3b040ffc265b523447e39289289f4572edbb6037e44cd385261223f34` |

## Lancelot FHE benchmark lane (selected; reconnaissance only)

The user selected Lancelot for the next benchmark lane. Identified the 2025
Nature Machine Intelligence paper and its public Zenodo software archive, and
recorded a bounded source/evidence review, environment blocker, and reproduction
plan in [the Lancelot benchmark note](lancelot-fhe-benchmark-2026-11-15.md).
This workspace has no `nvidia-smi`, `nvcc`, or CMake, so CUDA build and benchmark
execution were not possible. No paper result is claimed as reproduced. The
acceptance item remains open pending a suitable GPU host, exact artifact
checksum/source inspection, and logged reproduction.

## Stellar mainnet/testnet read preflight

Added a Stellar Horizon-root `network_passphrase` check using official Stellar
Mainnet/Testnet passphrases, before the adapter sends an account ID to the
`/accounts/{id}` endpoint. Missing curated identity is unsupported, a mismatch
fails closed, and returned results mark provider identity matched but not
independently verified. The passphrase values are from Stellar's primary network
documentation; the root-response field shape is supported by a community CAIP-2
resolution reference and is labelled as such. A provider can lie about both the
passphrase and account response; this is not a second-provider or consensus
check. TRON identity remains unverified. Added catalog propagation and tests for
Mainnet/Testnet values, call order, mismatch-before-disclosure, missing identity,
and absent-vs-zero accounts. Focused Node tests **21/21 passed**, inventory check
fresh, and `git diff --check` passed. After refreshing generated archives, full
`npm test` passed: Vitest suite passed; Node **1,110 passed, 12 optional skipped,
0 failed** (1,122 total). The generated `wikiinajar` bundle was rebuilt after the
new Markdown source changed the approved corpus count; its privacy preflight
passed. Keyspace and SITE-K archives were refreshed and archive-freshness tests
passed.

| Refreshed tracked archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `keyspace.xdc` | 492,274 | `8d85edfdc71e7ddaf57693fdceb839d0e3252000c7a5306fcc6c2407b0d611fe` |

`sitek.xdc` and `wikiinajar.xdc` were also regenerated and checked. Their
hashes are intentionally not embedded in this Markdown: these packages contain
this report/corpus, so embedding their own hashes would be self-referential.

## Remaining acceptance work

1. Independently research the issuer/current host/contract or mint/migrations/
   decimals for every token, and the 40 pending host fee models. Pending and
   catalogue-only evidence remains visibly unverified; no arbitrary live USD
   free-to-expensive table is invented.
2. Expand supported read adapters and independent non-EVM chain checks before
   treating provider identity as established. Live endpoint availability and
   funded-wallet recovery/security audit are not covered by synthetic tests.
3. Notion remains blocked: a fresh integration-visible search found the private
   editorial workflow/gate page, not an editable manuscript destination. The page
   explicitly requests the author's intended page and private-audience
   confirmation. Until the author supplies those, do not sync private notes or
   create a public-lane rewrite. A written brief is not agent execution or
   manuscript editing.
4. Full cryptographic application/protocol security and actual reproduced
   Lancelot / vehicular-control / XeHE benchmarking are outside this small
   BFV mask experiment; do not relabel plaintext aids as FHE.
