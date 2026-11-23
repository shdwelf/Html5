# Backlog execution round 83 — remaining fee models, then local OpenPGP keyrings

## Ordered work completed

1. Completed the **43 originally pending host fee-model reviews** in their
   registry order, before implementing the next backlog item. The research
   registry now has **58 profiles / 58 fee models source-reviewed / 0 pending**.
   The extra profile separates Cronos EVM 25 from Cronos POS for VVS; THETA and
   TFUEL remain separate native assets whose fees are paid in TFUEL. No current
   price, governance parameter, historical-network liveness, funded transaction
   or new fee estimator is implied. [Ordered report](chain-fee-model-review-round-83-2026-11-17.md),
   [46-file fee provenance manifest](research/chain-fee-source-manifest-2026-11-17.json).
2. Continued the requested OpenPGP backlog: investigated the named discovery
   routes and pinned selected source from **nine upstream projects / 40 files**.
   PGPony Android/iOS was user-confirmed. Official KDE Kleopatra/GnuPG,
   OpenKeychain, PGPony and the two separate Photon/Proton VPN investigations
   have distinct evidence and runtime boundaries. The Photon candidate remains
   unconfirmed; no VPN integration or credentials action was attempted.
3. Extended the existing local Workbench with explicit conservative **v4
   RSA-3072** generation, protected private and separate sensitive revocation
   downloads, full-fingerprint checks and a bounded memory-only **public**
   keyring. No personal identity or passphrase was inferred; only synthetic
   throwaway test keys were generated. [Source/implementation review](openpgp-keyring-source-review-2026-11-17.md),
   [40-file provenance manifest](research/openpgp-source-manifest-2026-11-17.json),
   [application usage](../apps/openpgp-workbench/README.md).

Before release, integrated `main` through `c32c4f7` on the **same working
branch**, preserving its Solana-genesis/Stellar-passphrase mismatch guards,
Android network-profile/Gradle-wrapper work and existing source references.
That concurrent continuation already used execution round 82, so this
unpublished report/batch was renumbered **83** rather than replacing its history.
DOGE/LTC/NEAR/AVAX overlap the original requested 43; their interim main-branch
reviews and sources are retained, then completed/rechecked here. Avalanche's
generic 21,000-gas shortcut is replaced by explicit `nativeFees` totals because
it does not model the gas-limit floor; no transaction-specific estimator is
invented. Both positive manual-total and negative generic-gas cases are tested.

The `2026-11-17` paths identify this task's research snapshot, not a live quote,
source-release date, network activation claim or reproducible wall-clock build
time. Full immutable source revisions/digests are retained. Existing historical
round-81 and v1 OpenPGP reports are not rewritten as if they described this work.

## Defects found by independent/negative controls

- PGPy 0.6.0 rejected the generated certificate because OpenPGP.js advertised
  SHA-3 preference IDs even when SHA-256 was selected. Generation now signs a
  **fresh** narrow UID self-certification using the library's exported signature
  API, reparses the serialized certificate and verifies it. SHA-2/AES classic
  preferences are asserted in tests; the vendor bundle stays unmodified.
- OpenPGP.js retains unknown non-critical packets as unparseable objects despite
  strict unsupported-packet flags. A second packet allowlist check prevents
  those from being silently dropped into an apparently successful public or
  private export. Forged public headers, secret/orphan-secret packets, messages,
  trailing text, nested/incomplete armor and atomic batches have negative tests.
- Explicit state/epoch guards prevent cleared generation, import, private export,
  text operations or file reads from restoring stale data or starting downloads.
  Running RSA generation cannot be forcibly stopped; its result can be discarded.
  Clearing JavaScript fields/references does **not** guarantee secure erasure.
- Fee review preserves unusual network models instead of importing Ethereum's
  assumptions: gas-charge floors, separate fees/assets, taxed versus non-taxed
  Cosmos transactions, UTXO policy sizes, Qtum gas and Verge's 999-byte step.
  A final pinned eCash amount.cpp review resolves its display unit explicitly:
  **100 internal satoshi units = 1 XEC**, not Bitcoin's COIN constant.

## Validation commands

```sh
npm run build:openpgp-workbench
node tools/build-coin-research-inventory.mjs
npm run check:coin-research
node --test tests/coin-research.test.mjs
# Optional independent Python installation (no new root/package dependency):
# python3 -m pip install --target .cache/pgp-review/python PGPy==0.6.0
PYTHONPATH="$PWD/.cache/pgp-review/python" node --test tests/openpgp-workbench.test.mjs tests/openpgp-keyring.test.mjs tests/openpgp-keyring-dom.test.mjs tests/openpgp-key-interop.test.mjs
node tests/openpgp-workbench-browser.mjs
sh tools/pack_keyspace.sh
npm run build:wikiinajar
SITEK_ONLY=1 sh tools/pack_xdc.sh
# Refresh inherited shared-module copies after main integration:
node scripts/build-city-subsurface-xdc.mjs
node scripts/build-georgia-subsurface-alias-xdc.mjs
./node_modules/.bin/vitest run --maxWorkers=2
# The full fleet sweep below already ran separately; don't duplicate it:
PYTHONPATH="$PWD/.cache/pgp-review/python" node --test --test-concurrency=2 --test-skip-pattern='every subsurface viewer boots, renders, and stays error-free' tests/*.test.mjs
npm run test:browser
npm run build:web
node --import ./tests/stubs/register.mjs tests/05-viewer-dom.mjs
node tests/11-wallet-coins.mjs
node scripts/build-html5-offline-launcher-assets.mjs --check --profile public
node scripts/build-html5-offline-launcher-assets.mjs --check --profile private
node scripts/build-html5-offline-launcher-assets.mjs --check --profile network
git diff HEAD --check
```

## Evidence and release status

- **32/32** targeted OpenPGP model/DOM/interop/existing-workbench tests passed,
  with **zero skips** in the explicitly provisioned environment. Includes actual
  `gpgv` public-certificate/signature verification and modified-plaintext refusal,
  plus PGPy 0.6.0 wrong/correct passphrase, both secret packets, fingerprint and
  **bidirectional encryption/signature** controls.
- **6/6** real Chromium/Web Crypto checks passed: local module loading, random
  key generation, actual public/private/revocation/public-keyring downloads,
  two-key single-block import, private paste refusal, reload/clear and mobile
  keyboard tabs. No external request or page error was observed. Screenshots
  and synthetic downloads are temporary/excluded, not distributed keys.
- Final standalone Vitest run: **318 passed / 36 files**, no failures.
- Final reduced-concurrency Node run: **1,157 tests / 1,149 passed / 8 optional
  skipped / 0 failed**. The already-passed fleet sweep is filtered from this
  repeated run, not counted twice. Optional omissions are five barcode/pixel
  controls, opt-in Concrete FHE, the opt-in executable-JAR integration and an
  upstream Synchronet byte comparison; none is relabeled as validation.
- Dedicated real-browser components passed: **46 Keyspace**, **75 WASM
  rasterizer**, **6 OpenPGP** checks, plus the **full subsurface fleet sweep**
  (one aggregate assertion over all routes). The long sweep finished after the
  initial shell wrapper's timeout; its own TAP result is retained. We did not
  mistake the wrapper timeout for a successful overall `npm test` exit.
- The initial combined `npm test` run did **not** pass: the inherited city-archive
  freshness assertion attempted to format a huge byte diff and was killed.
  Bounded diagnostics exposed `lawrence-subsurface.xdc` (and the other shared
  city bundles) containing the older California module. Rebuilt all affected
  city/Georgia-alias dependencies without changing their source geometry;
  exact byte equality is still required, now with bounded failure messages.
  The isolated city suite then passed **34/34**, and the clean Node rerun above
  includes it. The duplicate pending fleet run was stopped, not called passed.
- Viewer DOM **77/77**, legacy wallet/coin stack **133/133**; final
  coin/archive/navigation/wiki/privacy release gates **57/57**. The fee
  inventory is fresh. Wiki rebuild contains **344 approved Markdown pages**;
  existing private/excluded sources and this operational handoff stay excluded.
- `npm run build:web` passed. Launcher inventories validate **94 public / 2
  private / 96 opt-in network** entries; public files still have no static
  external-resource markers. These are packaging checks, not an Android app
  or PGPony device execution claim. Both diff whitespace checks and the
  changed/new-file generated-key-payload scan passed; no secrets were added.

| Rebuilt artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `keyspace.xdc` | 503,454 | `d3bd6858845ec44921c46decba9643d7ca8ca216eee1c5325165d894fd18df7b` |
| `wikiinajar.xdc` | 1,926,848 | `e72f6d2fefc1af9846afc367fe292fccfbf13e8b33340c10dd9db87a5fb78b58` |
| `sitek.xdc` | 16,054,662 | `0f842374b6d93dcbbedc13077167f360204363fda7d6a74fd60141ce03d069c6` |

Matching-head GitHub checks and the authorized **new** PR merge are reported
on the PR itself; they are not inferred from the already-merged PR #223 or old
successful/canceled jobs. This frozen source report records local validation,
not a claim that pending/optional GitHub checks have passed.

## Remaining acceptance gates (not silently closed)

- Full `gpg` private-key import/decryption, official Kleopatra GUI, OpenKeychain
  Android, PGPony Android and the partly closed PGPony iOS app remain **not
  runtime-tested**. `gpgv` is a separate verification-only control. The review
  provides a throwaway-device transfer checklist, not product certification.
- The 43 **host fee models** are complete, but independent token issuer,
  contract/mint, decimals, migrations/backing/transfer-tax reviews are not.
  The historical 500 assets remain **347 derivation-supported / 153 unsupported**,
  with 18 host test identities. Host identity/read-adapter coverage and live
  provider liveness retain their existing evidence gates. No signing, broadcast,
  background RPC, balances or new native-token identities were invented.
- Private editorial material/manuscript synchronization still requires explicit
  destination/access verification and author approval. This technical release
  does not publish it, change sharing or claim that another agent ran.
- Independent protocol/security audits, physical-device tests and full research
  benchmark reproductions remain distinct from bounded local unit/browser and
  independent cryptographic controls. The existing BFV workload is not turned
  into a general FHE performance/privacy proof by this unrelated release.
