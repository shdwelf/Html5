# Backlog execution — round 80 (2026-11-17)

## Scope and outcome

Continue the requested Keyspace mathematical-field and coin/network work, then
follow the YAWNING-TITAN Neuron Edition, SnapSafe, HOPE_16 and 2600 historical
software/recipe leads. This round is a bounded implementation plus a sampled
public-source collation, **not** a claim that every magazine issue, platform or
biological backend has been compiled or tested.

Work stays on `arena/249178eb-html5`, in existing
[PR #223](https://github.com/shdwelf/Html5/pull/223), which also carries the
completed round-79 signed Concrete-contract correction. The latest request
explicitly authorizes merging after validation. No branch switch is needed.

## 1. Exact, selectable Galois-field view

- Add four vetted presets: GF(16) / polynomial `0x13`, AES GF(256) / `0x11b`,
  GF(256) / `0x11d` (Reed–Solomon basis), and prime field GF(17).
- Separate pure arithmetic (`js/galois.js`) from its DOM/canvas explorer
  (`js/galois-view.js`). Show exact sum, product, inverse and quotient,
  polynomial representation and multiplication-by-a permutation grid.
- Explicitly mark zero inversion/division **undefined**. Fix the same zero-
  inverse readout in the existing entropy lens, its 2-D renderer and the
  Kitchen's existing AES-field operation. Remove the misleading implication
  that BIP-39's SHA-256 checksum is a linear finite-field checksum.
- Entropy sampling is explicit and display-only. Reduction to a smaller field
  loses information; no mnemonic mutation, entropy gain or new wallet algorithm
  is claimed. Arbitrary reducible moduli are not accepted. The 72-lens rack is
  unchanged; this is an additional independent explorer.
- Exhaustively compare pairwise products with independent polynomial long
  division (or prime arithmetic), check every nonzero inverse, and test
  zero/error/DOM behaviour. See [KEYSPACE.md](../KEYSPACE.md).

## 2. Full registry and explicit USDT networks

- Expose all **500 historical asset rows**, with name/symbol/ID filtering,
  instead of the first 50. **347** rows support derivation; other rows remain
  visible with explicit reasons. This is not a new live-market snapshot or
  500 newly implemented chain codecs.
- Interpret “bbep20” as **BEP-20**. Add curated network identities separately
  in `config/token-networks.json`; preserve market IDs/ranks and existing
  default paths. USDT choices now include:

  | Network | Holder path | Token scale |
  | --- | --- | --- |
  | Ethereum / ERC-20, chain ID 1 | `m/44'/60'/0'/0/0` | 6 decimals |
  | BNB Smart Chain / Binance-Peg USDT (BSC-USD), BEP-20, chain ID 56 | `m/44'/60'/0'/0/0` | 18 decimals |
  | TRON / TRC-20 | `m/44'/195'/0'/0/0` | 6 decimals |

- Display the network, contract identifier, decimals, fee asset and warning.
  A token contract is **not** the derived holder receive address. The BSC
  representation is pegged; no collateral/redemption guarantee is offered.
  Identical EVM receive addresses do not make chains interchangeable.
- Clear stale output and invalidate queued derivation on asset, network,
  phrase or passphrase changes. Keep the standard-mnemonic gate and the
  existing blurred Bitcoin-private-material controls. No new secrets are
  serialized, shared or displayed by the network selector; no RPC, balances,
  signing, transfer or bridge code was added.
- Fix `tools/build_coins.mjs --check`: it previously went stale solely because
  `built` used today's date. Deterministic source-date metadata replaces that
  wall clock. Generated asset rows are unchanged; the snapshots remain
  **2026-09-11**, including their historical rank ties. A simulated 2040 clock
  regression now checks the CLI.

The [standards survey](bip-standards.md#round-80-network-identity-is-not-another-bip-44-coin-number)
records pinned Bitcoin BIPs, Trust Wallet Core/assets, BEPs and scure repositories.
BSC's actual default derivation uses coin type **60**, not chain ID **56**, the
library enum **20000714**, or Beacon Chain's **714**. Tests compare BSC/TRON
public keys with scure BIP-32/39 and BSC's payload with independent Keccak, plus
Unicode NFKD and fixed known addresses. This does not establish full wallet
compliance, alternative account conventions or production safety.

## 3. Public magazine/software collation and builds

Detailed source table, licences, review limits, build commands and remaining
platform gates:
[2600-public-software-review-2026-11-17.md](2600-public-software-review-2026-11-17.md).

- Use the official 2600 public code index/TOCs, with sampled issues from
  2004, 2005, 2025–2026 and 2026; do not imply access to full magazine scans or
  all Hacker Digests. The official Digest 42 announcement describes the 2025
  compilation. The requested Shadow Libraries landing page supplied no usable
  recipe provenance.
- Review the public 43:3 DOS Hello World NASM and Python byte-writer listings.
  Assemble with NASM **3.02** from scratch `nasm-runtime-linux-x64@3.2.0`,
  syntax-compile/run only the reviewed Python file writer, and byte-compare
  their outputs. Both produce **31 bytes**, SHA-256
  `d9f17e47afc1c6b1dca6ec9cf156ddfc83ad76d3e0daa37639aebb6ad79146cd`.
  The initial strict NASM relocation warning and narrowly disabled warning are
  documented. The **DOS program was not executed**. No compiler, magazine
  listing or generated executable was added to Git.
- Collate ROS/SLAM commands, wpUsers, MIT historical stripe-decoding code,
  steganography batch files, and emulator/other index leads. Do not execute
  unreviewed code or destructive `-sdel` examples; record dependency/licence and
  platform gates separately from successful builds.
- Pin SnapSafe v4.2.0 and review its SECV writer/reader/header/video flow.
  Distinguish release-published APK hashes from local verification. Video uses
  a temporary plaintext MP4 before post-recording encryption; secure deletion,
  legal immunity, TEE behaviour and whole-file integrity are not proven here.
- Read the canonical Neuron Edition README and random fake TCP server; do not
  confuse it with biological learning. The real backend requires Cortical
  Labs/`cl`; the GitHub simulator's pinned legacy dependencies exclude this
  session's Python 3.11. No full training or neuron-server run occurred.
- Treat HOPE_16 as the historical August 15–17, **2025** conference. Public
  abstracts provide follow-up leads, not validated software or upcoming events.

## 4. Tested Kitchen recipes and offline packaging

Add three source-labelled packs, reusing existing operations where sufficient:

1. **2600 — Code Wall binary to UTF-8 (43:3)** → `INSPIRE`.
2. **2600 — DOS Hello World bytes (43:3, hex to static hexdump)** → static
   inspection and byte-exact round trip only; input is spaced hex or a dump.
3. **2600 — SnapSafe SECV v1 header (42:4, passive only)** → new `snapSafeSecv`
   operation, 64-byte hex-header mode or ≤1 MiB complete-small-file length mode.

The new operation uses exact BigInt size/offset arithmetic, validates metadata,
rejects malformed/oversized input, and explicitly reports
`authentication_verified: false`. It performs no AES-GCM authentication,
decryption, PIN guessing, remote request or erasure verification. Tests include
fake tag bytes to prevent a layout-only check from becoming a false security
claim. The Kitchen has **524 operations**, all included in recipe packs; the
cookbook and manifest counts are updated.

Rebuild the generated Keyspace app/XDC and CyberChef app/XDC. Include the full
new module/config graph in SITE-K too, bump its service-worker cache to v46,
and add an archive-boundary regression for freshness and precaching. Refresh
the Wiki in a Jar corpus to **338 approved Markdown pages**, including the
new research/round notes. `SITEK_ONLY=1` avoids rebuilding unrelated companion
packages; explicitly refresh the wiki when its documentation sources change.

```sh
npm run build:keyspace
npm run build:cyberchef
npm run build:wikiinajar
SITEK_ONLY=1 sh tools/pack_xdc.sh
```

## Verification

Completed in this round:

| Gate | Observed result |
| --- | --- |
| `npm test` — Vitest | **318 passed**, 36 files |
| `npm test` — Node runner | **1,080 passed, 12 optional skipped, 0 failed** (1,092 cases) |
| Field/network/2600-SECV and recipe/count-focused Node suites | **39 passed**, including 7 field, 7 network and 6 2600/SECV tests |
| Archive, SFX and SITE-K navigation suites | **24 passed**; both Keyspace/SITE-K module graphs, registry payloads, precache and current Kitchen archive checked |
| Final archive/wiki/field/network/SECV rerun after documentation refresh | **71 passed, 0 skipped, 0 failed** |
| `node tests/02-lens-math.mjs` | **148 passed** |
| `node tests/03-lens-draw.mjs` | **140 passed** |
| `node tests/04-lens-3d.mjs` | **20 passed** |
| `node tests/05-viewer-dom.mjs` | **77 passed** against the actual viewer module with a DOM harness |
| `node tests/11-wallet-coins.mjs` | **133 passed** |
| `node tests/07-browser.mjs http://127.0.0.1:8000/index.html` | **38 passed, 0 failed** in actual headless Chromium/SwiftShader; **zero console/network errors** |
| `node tools/build_coins.mjs --check` | 500 assets / 347 derivable; current, including a simulated 2040 clock regression |
| JS syntax / whitespace | Changed pure/viewer modules pass `node --check`; `git diff --check` passes |

The real browser was served the generated `public/apps/keyspace` tree. Its
checks include live WebGL and actual stage/field-grid rasterization, the known
BEP-20 holder address, network-change clearing, undefined zero inverse and the
existing 512-word extended-layout regression. Optional browser dependencies were
installed only in scratch; the standard suite keeps unrelated browser gates
optional. Its 12 skips cover optional label pixel dependencies, unrelated
browser checks, the opt-in Concrete/JAR integrations and a missing upstream
Synchronet checkout. Those skipped paths are **not** reported as tested.

The first broad run exposed two stale test expectations (523 vs 524 operations
and cache v45 vs v46) and excessive runtime in an unrelated optional browser
suite; that run was stopped, not counted as a pass. The next standard run
caught an out-of-date bundled wiki (335 vs 338 pages). After correcting the
expectations and regenerating the wiki, the clean full run above succeeded.
The final documentation-only refresh is repackaged and checked again at the
archive/wiki boundary.

No Concrete arithmetic/compiler code changed in this round; its expensive real
encrypted integration is not repeated or relabelled as a new result (see
[round 79](backlog-execution-round-79-2026-11-17.md)).

## Remaining explicit gates

- Full licensed historical-magazine/digest coverage and individual listing
  redistribution permissions; this sample is not a complete software archive.
- ROS/vision data and platform toolchains, libsndfile/OSS-era source cleanup,
  Windows batch/emulator labs where appropriate; no indiscriminate execution.
- Android SDK/device/signing/reproducible-build/forensic validation for SnapSafe;
  Cortical Labs hardware/API and supported legacy environment for Neuron Edition.
- BIP-44 account discovery/alternative wallet conventions, token issuer/bridge
  semantics and real-fund safety. This viewer remains offline and educational.
- Existing unrelated hardware/live-service backlog gates are not claimed closed
  by documentation, simulation or these browser/format tests.
