# Waves paper practice and historical `.hts` lead — 17 November 2026

## What changed, and what did not

The maintained TypeScript workbench's Waves tab is now **Waves practice**.
`src/components/WavesExchange.tsx` is an offline, explicitly **synthetic,
paper-only** teaching screen. It is not a Waves wallet, a market-data client,
a matcher, a bridge or a real exchange. The historical uploaded HTML documents
remain intact; this is not a rewrite or replacement of those originals.

The previous screen generated mnemonic-looking records and a fabricated Waves
address while presenting exchange-like controls. That path is removed from the
maintained screen. The replacement does not generate, import, reveal or persist
seeds/keys/addresses; request wallet access; query balances; or submit orders.
No real funds, owner phrases or account connections are needed or appropriate.

An existing browser record under `waves_acc_v1` is **not read, overwritten,
exported or deleted**. A non-reading disclosure explains that an older demo
record is not proof of a valid account. Nothing attempts to migrate or recover
legacy secret-looking records. Preservation is not an endorsement of their
cryptographic validity.

## UX and bounded model

- A prominent “Offline practice · no real funds” header explains synthetic
  prices, charts, balances and illustrative book levels before the controls.
- The default WAVES illustration is explicitly **1 virtual credit**, not a
  current WAVES price. The shared random-walk feed does not contain WAVES;
  the new screen no longer dereferences its missing history or borrows another
  coin's identity. BTC/ETH examples remain clearly synthetic, not USD quotes.
- A user must explicitly start a memory-only portfolio. Reset/end are separate
  actions; leaving the tool or reloading discards the paper session. No browser
  storage operation is needed. Initial virtual holdings are 5,000 credits,
  100 paper WAVES, 0.05 paper BTC and 0.5 paper ETH.
- Labeled pair and amount inputs, pressed-state buy/sell buttons, descriptive
  totals, inline validation, a polite result status, keyboard focus and a
  responsive card layout replace alerts and ambiguous wallet controls.
- The skip link moves focus locally to the practice order. It deliberately
  does **not** replace the parent `#codebase=suite` route hash and leave the
  workbench. The target is programmatically focusable.
- Missing/invalid selected tickers fail closed and do not display a misleading
  order book. Illustrative asks/bids have fixed example sizes and are not
  displayed as genuine liquidity or a matching-engine result.

`src/lib/paper-market.ts` uses **BigInt fixed point, 10^8 units**, with exact
supported asset/side checks and fresh copies of balances. Positive ordinary
decimal amounts have at most eight fractional places and at most 1,000,000
paper units; exponent, signed, empty, zero, malformed or nonfinite input is
rejected. Prices are positive finite examples, at most 1,000,000 credits and
representable at the model's precision. Portfolio and cost caps bound arithmetic
and reject insufficient holdings/credits. Buy totals round up and sell totals
round down to avoid creating credits from tiny round trips. These are **model
precision rules, not real trading/network fees**. Unknown token tax/fees are
not silently set to zero by a paper exercise.

Reducers serialize repeated actions against the latest state instead of
stale event-closure balances. There is no persistent account state, networking,
private material, fee acceptance gate or financial guarantee in this model.

## Strict compilation and regression diagnosis

The new helper uses the ES2020-compatible
`Object.prototype.hasOwnProperty.call`, not `Object.hasOwn` and not a relaxed
TypeScript target. Strict compilation also exposed three pre-existing bridge
issues: an unused `packRenga` import, a missing `js/coins.js` declaration, and
consumers of a nonexistent registry `_meta.built` field. The changes remove the
unused import, add a public-result-only `.d.ts` and show the actual historical
`marketSnapshot` date. The JS derivation algorithms and registry JSON remain
unchanged. The typed bridge correctly falls back to the original Ed25519 row's
family when the unchanged JS result omits its `family` property; public vector
regressions check Ethereum bytes/path and Solana public metadata.

An earlier full unit run failed one 5-second missing-word recovery test. Focused
diagnosis measured both full address-pinned searches at about 3.4–3.5 seconds
under lighter load. Test-only corrections replace random fixtures, a tautological
self-comparison, an early-return “skip” and an unbounded random fixture-generation
loop with explicit public/synthetic fixtures and meaningful unchanged-slot
checks. Both pinned cases now require **all 2,048 trials**, a unique exact
mnemonic/address and a bounded **15-second per-case** CPU budget; the default
suite timeout and production recovery/KDF/cancellation/search code are unchanged.
The vanity test still exercises the real bounded random miner. The two-word
un-pinned test is accurately described as stopping at the existing result cap,
not a claimed exhaustive 2048² pinned search.

The first full Node run completed rather than hanging: its long subsurface
browser sweep passed. It found one corpus-selection failure because the three
new review/operational notes were automatically eligible for the public Wiki
bundle. They and the two provenance manifests are now explicitly excluded by
`tools/wikiinajar/public-corpus-policy.mjs`, preserving the editorial boundary
instead of disabling the corpus assertions or publishing the review material.
The affected Wiki/workspace/Webxdc checks then passed **54/54**. Applicable
exact-head CI, including the independent-native lane selected by that policy
change, remains mandatory; earlier Android/native receipts are not substitutes.

## Historical `.hts` investigation — unresolved

The supplied recollection remains **`.hts`**. No artifact/file/link was supplied,
and `.html` or `.hta` is not silently substituted as an identification.

Public evidence inspected without executing old code:

| Lead | Immutable revision / scope | Result |
| --- | --- | --- |
| Reachable local Git history at `98c6de83…` | `git log --all -- '*.hts' '*.hta'` | No matching filename commits; this is not all historical distributions |
| [WavesGUI v0.5.18](https://github.com/wavesplatform/WavesGUI/releases/tag/v0.5.18) | `8fcc0ae67e6b7814196061ed9d7768888793cb6f`, 674 source-tree paths | No `.hts`/`.hta`; README/template/assets show a multi-file Angular/build lead |
| WavesGUI `old-client` | `932364f6050f547e86631c9595dfff0ee7f55edb`, 268 source-tree paths | No `.hts`/`.hta`; `src/index.html` is a source entry, not single-file proof |
| [waves-lite-client fork](https://github.com/username1565/waves-lite-client) | `b48fb2fbead066194679f0696595ce43bd5599d2`, 77 source-tree paths | No `.hts`/`.hta`; `index.html` and accompanying files are a lead, not identity confirmation |

All three remote tree responses were untruncated. The v0.5.18 release metadata
lists mainnet/testnet ZIP assets (1,926,699 / 1,926,693 bytes), published
28 February 2018. **The ZIPs were not downloaded, unpacked or executed.** A
source-tree listing is not an inspection of the compiled release archives.
The existing `apps/cryptoopoly-live-market-nft-edition` is another local
market-themed source, not established as the remembered file.

Exact source-byte digests and tree pins are in the
[source manifest](research/wordpress-waves-small-web-sources-2026-11-17.json).
Failure to find an extension in these bounded searches does not prove the file
never existed. Identification still needs a filename, file, hash, capture or
other positive artifact match. Archived wallet software is not recommended
for real keys/funds, and an exchange-branded page is not a safety endorsement.

## Reproduce applicable checks

```sh
npx --no-install tsc --noEmit
npx --no-install vitest run
npm run build:web
node tests/waves-practice-browser.mjs
node --test tests/token-deployment-capture.test.mjs tests/token-research.test.mjs tests/coin-networks.test.mjs tests/coin-research.test.mjs
npm run check:coin-research
git diff --check
```

The browser control requires real Chromium dependencies and the production web
build; absence is a failure, not a silent success. It tests desktop **1440 px**,
mobile **390 px** and narrow **320 px** rendering, keyboard start/skip-link,
valid/invalid orders, virtual balance arithmetic, reset/end/navigation/reload,
legacy-record preservation, no storage calls during practice, no external
requests, no uncaught page errors and no horizontal overflow. Synthetic public
sentinels are the only stored fixture. Screenshots can optionally go to an
ignored local directory with `WAVES_SCREENSHOT_DIR`.

`.github/workflows/waves-practice.yml` requires strict typecheck, the **whole**
maintained application Vitest suite, web build and actual browser controls for
relevant PRs. The separate token evidence workflow retains its original
no-promotion tests and requires the new offline capture controls. Neither lane
contacts a chain, publishes WordPress, uploads private artifacts or claims
Android/physical-device, independent-native-reader or financial acceptance.
Exact-head CI receipts belong on the actual new PR, not on an already-merged
PR or as a substitution of older green runs.
