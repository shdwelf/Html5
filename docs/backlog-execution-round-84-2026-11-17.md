# Backlog execution round 84 — native OpenPGP, then independent token evidence

## Ordered continuation

1. Did **not repeat** the completed 43 host fee-model reviews or re-merge PR
   #231. The baseline remains 58 profiles / 58 source-reviewed fee models /
   zero pending fee models, not 58 complete token investigations.
2. Added and executed a separate, bounded **full native-GnuPG** CI lane for
   protected synthetic private import/unlock, wrong-passphrase rejection,
   exact primary/subkey fingerprints, two-way encryption/signatures,
   protected secret re-export, both public-keyring armor layouts and revocation.
   This addresses the command-line runtime gap without pretending gpgv is gpg.
3. Then started independent token-source reviews in registry order, **USDT then
   USDC**, with a separate offline ledger, exact-tuple evidence validator,
   provenance manifest and generated coverage column. Four mainnet tuples are
   described; **zero full token acceptance gates are closed**. No new runtime
   token, balance reader, contract, decimals, fee quote or derivation support
   was enabled.
4. Preserved the private editorial destination/access/author-approval gates.
   No private cloud material, manuscript synchronization, permission change or
   purported invocation of another agent was performed.

The active continuation uses only branch `arena/90bcde20-html5`, based on
`633c443c121f35ff4ebc2844e82cd01810819cf8`. PR #231 is already merged.
The new continuation is [PR #232](https://github.com/shdwelf/Html5/pull/232).
While working, `main` advanced through PR #233 to `cd2c9527c65fb8fb3912340f9ea81f9fe92af2e3`.
Merged it onto this same branch without conflicts, retaining its encrypted
private-APK workflow handoff. No recipient key was supplied and no private APK
export was requested or executed by this continuation. The separate long Android
lane remains distinct from the new native-PGP and offline-evidence checks.
The research-snapshot date in filenames is not a live-price, current-parameter
or reconstructed wall-clock execution claim.

## Native-GnuPG evidence

- [First mandatory native CI run](https://github.com/shdwelf/Html5/actions/runs/45229648748)
  **SUCCESS**, exact head `76078209ecd11f40b6cca8c47066184ea83e0bf1`, native job
  `137885388301`, 46 seconds. All required tool/install/model/DOM/policy and
  mandatory interop steps succeeded.
- [Structured job/step evidence](research/openpgp-native-ci-2026-11-17.json)
  and [full scope/limitations](openpgp-native-interop-2026-11-17.md) distinguish
  actual GitHub job success from the raw TAP/tool-version log archive, which
  this sandbox could not retrieve from the redirected results-receiver host.
- Local targeted run: **39 tests / 36 passed / 0 failed / 3 skipped**. This
  sandbox has gpgv, not full gpg/gpgconf, so the three native tests explicitly
  skipped here; the CI lane supplied that missing execution. Actual gpgv and
  PGPy controls ran locally. Missing mandatory readers are tested failures,
  not permitted skips.
- Test-only Python build/runtime dependencies are exact-version/hash locked.
  Actions are immutable-SHA pinned with read-only permission and no persisted
  checkout credentials, secret inputs, private artifacts or cross-job key cache.
  Dedicated agents and private temporary homes isolate synthetic keys; stdin
  carries passphrases and finally-block cleanup removes homes.
- The first policy run exposed inherited Node `NODE_TEST_CONTEXT` suppressing
  nested child TAP. Independent child invocations now remove that private
  runner variable and request the TAP reporter; the repaired run passed.
  The failed first run is not represented as successful.

## Previous Android outcome — not relabeled as passed

The optional [PR #231 Android run](https://github.com/shdwelf/Html5/actions/runs/45198170062)
finished **CANCELLED**, not successful. Job `137774118327` exceeded its
**1h0m0s maximum execution time** during Android WebView / Headline Harry
emulator smoke tests. Public/private/network APK builds, inventory and
permission stages succeeded; reporting and artifact-upload stages were skipped.
This does not validate PGPony, OpenKeychain, any physical device or the emulator
smoke suite. The new native-PGP lane deliberately does not depend on that job.
No Android workflow repair or fresh device execution is claimed in this round.

## Token source tranche and safeguards

- [Scoped review](token-identity-review-round-84-2026-11-17.md): two source reviews
  started / four mainnet tuples; three are existing USDT catalogue tuples and
  one Ethereum USDC reference is **research-only, not enabled**.
- [Provenance](research/token-identity-source-manifest-2026-11-17.json): 13
  actually fetched/digested pinned files plus nine explicitly unanchored page
  observations. No fabricated raw-page digest, implementation query or block
  anchor. A similarly named GitHub repository is not accepted as issuer proof.
- USDT's Ethereum/TRON issuer-listed tokens and the 18-decimal Binance peg stay
  distinct. ABI fee/deprecation controls do not establish current values or an
  exact formula. Circle's generic source and upgradeable proxy do not establish
  the current deployed implementation or perpetual zero transfer tax.
- `tools/token-research-evidence.mjs` requires stable asset ID plus full network,
  host, family, chain ID, contract, decimals and mainnet environment. Drift,
  duplicate matches, a ticker alias, mainnet-to-testnet copying, unsupported
  completion/backing claims and silent runtime promotion fail closed.
- Initial focused token/coin/network run: **26/26 passed**, zero skips. A ninth
  token regression then added a separate **five-minute, read-only evidence CI
  lane** policy check; the final 151-test affected suite below includes it.
  Coverage inventory freshness passed. The historical 500 assets / 347
  derivation-supported / 153 unsupported, 58 fee profiles and 18 host-test
  identities remain unchanged.

## Packaging and continuation validation

- Final affected Node run **after main integration**: **151 tests / 148 passed /
  0 failed / 3 skipped**. Includes all OpenPGP test files, token/coin/network/
  mocked chain reads and DOM, updated launcher policies, Wiki privacy,
  archive dependencies and navigation. The three explicit local gpg/gpgconf
  skips have separate actual mandatory CI execution above.
- Full standalone serial Vitest rerun: **318 passed / 36 files**. An earlier
  run concurrent with the crypto/packaging sweep had **317 passed / 1 timed
  out**, the existing randomized single-word recovery test's 5-second limit.
  It is not called a passed run. The clean serial rerun passed without changing
  production code, test assertions or timeouts.
- `npm run build:web` passed (one non-fatal upstream Rollup pure-annotation
  warning). Launcher inventory/policy checks passed for **94 public / 2 private /
  96 opt-in network** entries; no static external-resource marker in public or
  private index. The network index's `news-globe` marker is expected/explicit.
- Rebuilt Wiki: **346 approved Markdown pages**, preserving the shared public
  exclusions; rebuilt SITE-K with the updated public documentation only.
  Both ZIP integrity checks passed. Exact recorded artifacts:

  | Artifact | Bytes | SHA-256 |
  | --- | ---: | --- |
  | `wikiinajar.xdc` | 1,934,001 | `33109ffc5504c752a05989f17d08fa93b446be65bf6050d0d80c8270e6bb91c5` |
  | `sitek.xdc` | 16,069,064 | `ea38075459796379045ac962e69a88cfa9da8f8e5c9aaa3008f85f055ceb5d8b` |

- All 13 fetched token-source files independently rechecked for actual bytes,
  lines and SHA-256 against the manifest. The first native-CI harness digests
  still match. Research inventory freshness and whitespace checks passed.
- No full combined `npm test`, full subsurface fleet, new Chromium run, Android
  emulator/physical device, iOS or Kleopatra GUI execution is claimed for this
  continuation. Historical round-83 browser/fleet counts are not relabeled as
  fresh results. Production crypto/runtime-network/fee/derivation sources and
  the Keyspace payload remain unchanged.

This operational report is explicitly excluded from public offline corpora;
archive checks confirm its absence. The research-only token ledger is not
silently packaged as runtime config. Public technical reports are separate
from private handoff context; no private manuscript or cloud-inventory data is
introduced by the source tranche.

## Remaining acceptance gates / next order

1. **Kleopatra GUI, OpenKeychain Android, PGPony Android/iOS** need actual
   app/build/platform import/unlock/crypto results. Native gpg is not their UI.
   No real identity/passphrase was supplied or inferred; use throwaway keys.
2. Finish the per-deployment USDT/USDC current code/implementation, metadata,
   pause/blacklist/deprecation/fee/migration, reserves and redemption checks.
   No real-fund transfers merely to close a checkbox. Then continue source
   candidates **stETH, wstETH** in registry order; unknown hosts are not
   automatically declared tokens. Other host-read/identity/live-provider and
   token/test-deployment gaps remain distinct from completed host-fee research.
3. Diagnose the separate emulator timeout with bounded stage evidence before
   claiming device compatibility; successful APK builds do not close it.
4. Private manuscript synchronization still awaits author-confirmed
   destination, access/audience and approved source-gap/chronology edits.
   Do not publish personal recollections or infer sharing from a null public URL.

No new PR merge is claimed by this report. Final matching-head check/readiness
status belongs on PR #232, separate from the already-fulfilled PR #231 merge.
