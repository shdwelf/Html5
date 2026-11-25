# KEYSPACE VIEWER — layers, lenses, and the generalised word count

`keyspace.html` · `js/viewer.js` · `js/formal.js` · `js/lens-draw.js` · `js/lens-3d.js`

Open `keyspace.html` in a browser, or load `keyspace.xdc` into a messenger that
speaks webxdc. Offline-first, no build step. Entropy, lenses and derivations
are local. Section 14 also offers explicitly consented read-only public-address /
contract queries and separately consented off-chain JSON; nothing is queried
automatically, and phrases/private keys never enter those requests. Fee estimates
are labeled manual scenarios or documented minima, not live quotes.

## Word counts: the generalised checksum rule

BIP-39 fixes `CS = ENT/32`, which only lands on a whole 11-bit word for
ENT ∈ {128, 160, 192, 224, 256}. That is why 25 words is "not an option" in the
standard. The rule this viewer uses instead:

```
CS = the largest c ≤ 11 such that (11·n − c) is a whole number of bytes
```

| words | ENT bits | CS | 11n | note |
|------:|---------:|---:|----:|------|
| 12 | 128 | 4 | 132 | BIP-39 |
| 15 | 160 | 5 | 165 | BIP-39 |
| 18 | 192 | 6 | 198 | BIP-39 |
| 21 | 224 | 7 | 231 | BIP-39 |
| 24 | 256 | 8 | 264 | BIP-39 |
| 25 | 264 | 11 | 275 | generalised (CS = ENT/24) |
| 27 | 288 | 9 | 297 | generalised |
| 30 | 320 | 10 | 330 | generalised |
| 33 | 352 | 11 | 363 | generalised |
| 56 | 608 | 8 | 616 | generalised |
| 6 | 56 | 10 | 66 | from the "ENT bits" box |

It reproduces BIP-39 exactly on the ladder and both directions agree
(`layoutForWords` / `layoutForEntropyBits` are mutual inverses for every
n = 2…512, asserted in suite 01). There are no gaps: every integer word count
from 2 to 512 closes `11n = ENT + CS` with a byte-aligned ENT and a checksum of
4…11 bits (CS = 11 recurs every 8 words: 9, 17, 25, 33, …). The **Phrase** menu
therefore lists every count above the ladder, 25 … 512, each labelled with its
ENT/CS straight from `layoutForWords` (`js/viewer.js` rebuilds the menu at boot
so the labels cannot drift from the maths), and the custom row takes either a
word count (2–512) or an entropy bit length (any multiple of 8). 512 words is
the ceiling (`MAX_WORDS` in `js/bip39.js`): 5624-bit ENT + 8 CS = 5632 bits,
703 entropy bytes — the identity itself is unbounded, the UI stops where every
phrase still fits the WASM engine's index/path buffers and a full ∂Φ flip sweep
stays interactive (suite 06 measures it). Above the ladder the checksum is a
*smaller* fraction of the entropy, so the generalised lengths are not
"stronger BIP-39" — the status line, the layout note and the menu group all say
which rule produced the phrase, and the wallet / asset derivations in §14 keep
refusing anything that is not a standard 12/15/18/21/24-word phrase.

## Invert keyspace A ↔ B

Two keys are two corners of the ENT-dimensional Hamming cube. The keys
"between" them are the affine subcube they span:

```
S(A,B) = { A ⊕ (m ⊙ s) : s ∈ {0,1}^d },   m = A ⊕ B,   d = |m|
```

Four layers, each with a 2-D Hilbert-slice view (top 14 ENT bits) and a 3-D
layer on the canonical projection (top 21 bits de-interleaved into a 128³
Morton grid, so the prefix's Hamming geometry is honest):

| layer | what it draws | invariant it states |
|-------|---------------|---------------------|
| affine subcube | box spanned by A and B + sampled corners | \|S\| = 2^d, measure 2^(d−ENT) |
| geodesics | the staircase of prefix-bit flips | d! shortest paths, each d flips |
| complement ¬k | ¬A, ¬B and the A–¬A chord | d(¬A,B) = ENT − d(A,B) |
| Hamming shell | sphere of radius d around A | \|shell\| = C(ENT, d) |

`B ← phrase of ¬A` builds the well-formed phrase whose entropy is the bitwise
complement of A's, so the invariant can be checked by eye: d(A,B) = ENT and
d(¬A,B) = 0.

## Formal-system lenses

Section 12 is a layer rack, not a list. Every entry is a viewing method: it
computes numbers from the loaded key and writes a **Describe / Explain /
Predict** readout. The dot adds or removes the layer in the 3-D scene (turning
one on opens its panel); the name opens the readout without touching the scene.

Ten families, 72 lenses (`LENSES` in `js/formal.js` is the count the rack
renders and suites 03/05/06 assert): invert (4), λ-calculus (4), analysis (7),
logic (5), algebra (35), geometry (6), trigonometry (4), time (3), stochastic
(2), process (2). The **algebra** group keeps the lenses it already had
(`boolean`, `umbral`) and merges in group theory (the sorting permutation's cycle type / order / sign),
linear algebra over GF(2) (rank of the word-bit matrix), finite fields
(GF(2⁸) byte arithmetic + inverses), the divisor lattice of the word count, and
the index sequence as a polynomial over Z. **Geometry** adds metric, Euclidean,
spherical, projective (cross-ratio), convex (hull/shoelace) and topological
(Euler / Betti) readings. **Trigonometry** adds the unit circle, the DFT with
Parseval, the laws of sines/cosines, and harmonic regression.

Where a system has real geometry or real measurement behind it, it gets a
renderer. Where it does not, the entry is marked `card` and says why — the
first was **typed λ-calculus**, because stating Φ's type precisely needs a
dependent type (`Φ : (e : Bit^ENT) → Bit^(ENT/32)`), and there is no keyspace
geometry to draw from that; the abstract-algebra entries (Hopf, C*, von
Neumann, Kleene, …) are cards for the same reason, 17 in all.

Measurement-backed examples:

- **differential** — flips every entropy bit, re-runs Φ, counts the words that
  move. Measured on a 25-word key: 263/264 flips move exactly 2 words, 1 moves
  one. BIP-39 is *not* an avalanche function; the support is
  {⌊i/11⌋, last}, and the lens says so with the numbers.
- **Boolean** — 16 preimages give the checksum word's LSB as a Boolean function
  of 4 entropy bits; the Möbius transform yields its Zhegalkin polynomial and
  weight, against the affine ceiling n+1.
- **tensor / influence** — the influence matrix J^w{}_b from the same sweep,
  its Gram tensor, and λ₁/λ₂ by power iteration.
- **duration / event / situation** — `performance.now()` spans and the actual
  action history of the tab, not modelled times.
- **Ricci** — computes the contraction and reports the honest answer: the
  Hamming cube is flat, Γⁱⱼₖ = 0 and R = 0. Any lens claiming curvature here
  would be wrong.

### Selectable Galois-field explorer

Below the rack, an independent exact-arithmetic explorer (`js/galois.js` /
`js/galois-view.js`) offers four vetted fields; it does not change the rack's
72-lens count:

| Field | Representation / modulus |
| --- | --- |
| GF(2⁴) | polynomial bits, x⁴ + x + 1 (`0x13`) |
| GF(2⁸), AES basis | x⁸ + x⁴ + x³ + x + 1 (`0x11b`) |
| GF(2⁸), Reed–Solomon basis | x⁸ + x⁴ + x³ + x² + 1 (`0x11d`) |
| GF(17) | integers modulo the prime 17 |

Enter decimal or `0x`-prefixed hex elements to view addition, multiplication,
inversion and division. The grid displays multiplication by `a` over every
field element in row-major order, with `b` highlighted. A nonzero multiplier
permutes all outputs; zero collapses them. Different polynomial bases of order
256 are isomorphic fields but the same byte labels need not multiply identically.
Both zero inversion and division by zero are explicitly **undefined**, including
in the existing AES entropy lens and its 2-D table.

**Inspect first two entropy bytes** is an explicit, local-only action. Reducing
bytes modulo a smaller field's order is a lossy display projection, not an
entropy generator or a change to the mnemonic. BIP-39's checksum is a SHA-256
prefix, not a field-linear checksum; the `2^ENT` keyspace is unchanged. These
small fields are not secp256k1's coordinate or scalar field, and the calculator
is not constant-time wallet cryptography. No arbitrary reducible moduli are
accepted. Tests cover every pairwise product and every nonzero inverse in all
four presets, compare binary multiplication with independent polynomial long
division, and exercise zero/error/UI behaviour.

## Statistical views and measured 3-D layers

Math view 6 adds three coordinated, data-backed diagnostics for the loaded
entropy rather than another metaphor:

- a 16-bin nibble histogram with the uniform expected-count line and Pearson
  χ² statistic (15 degrees of freedom);
- a bit-run raster with transition marks, observed/expected runs and longest
  run;
- Pearson autocorrelation bars for bit lags 1–32, plus lag-1 correlation of the
  BIP-39 word-index sequence.

The readout also reports one-bit balance, exploratory monobit and runs p-values,
empirical byte Shannon entropy, observed unique bytes, word-index standard
deviation and nibble χ². The module (`js/key-stats.js`) is deliberately labelled
**descriptive only**: 128–256 bits is too small for byte-frequency inference or
a randomness certification, p-values are multiple looks at one sample, and a
pleasant-looking chart does not make a mnemonic safe. The generator's security
still comes from `crypto.getRandomValues`, not from passing a dashboard test.
This treatment follows NIST's own cautions: SP 800-22 says its asymptotic
references are inappropriate for small `n` and makes bit balance a prerequisite
for its runs test, while NIST entropy-source guidance explains why generic
output tests do not substitute for source modelling and entropy assessment:

- https://doi.org/10.6028/NIST.SP.800-22r1a
- https://doi.org/10.6028/NIST.SP.800-90B

Two additional 3-D engine layers expose the same measurements: **Nibble
distribution skyline** maps the 16 observed counts to radial bar height, and
**Bit autocorrelation ring** maps measured lag-1…32 Pearson coefficients to
radius and height. Unlike the older schematic forms, both are marked as measured
layers and rebuild whenever the phrase changes. Their finite geometry and the
statistics' known cases (all-zero, alternating, and byte ramp) are regression
tested in suite 16.

## Seed Haiku identity (Drive research integration)

Section 13 now carries forward the useful local-only presentation ideas from
`create (1).xdc.xml` / **Seed Haiku Lab** without importing its wallet or game
surface into the keyspace viewer:

- the current phrase is folded contiguously with the shared, tested syllable
  engine (`js/syllables.js`), preserving overflow rather than dropping words;
- exact 5–7–5 is identified explicitly, while other folds show their measured
  syllable counts and are not called strict haiku;
- valid entropy deterministically selects an existing packed ensō brush setting
  (`js/enso-id.js`), so the same phrase produces the same image and EN id;
- the poem can be copied and the canvas exported as PNG. Both actions remain
  local. The phrase itself is only shared through the viewer's existing,
  explicit **Share in chat** action.

The ensō selector uses a 32-bit non-cryptographic hash because it is a compact
visual fingerprint, not authentication, collision resistance, a key derivation,
or a proof of mnemonic ownership. The UI states this distinction. Invalid
mnemonic checksums do not receive an identity image. Researching the packed EN
identifier also found that its check character was emitted but never verified;
`decodeEnsoId` now rejects a corrupted check character, with a regression test.

The source `.xdc` also contains BIP-32/BIP-44/49/84 wallet derivatives. Section
14 now preserves that workflow using this repository's independently
vector-tested wallet stack rather than copying the archive's inline crypto:
PBKDF2-HMAC-SHA512 seed, root xprv, account xpub/ypub/zpub, and five receive
addresses plus compressed-mainnet WIFs for each scheme. Derivation requires an
explicit click, accepts only valid standard BIP-39 lengths, never enters the
webxdc update payload, and keeps the seed, root private key, and WIFs blurred and
unselectable until **Reveal secrets** is pressed. Changing the phrase or
passphrase clears derived output; **Clear** also clears the passphrase. JavaScript
cannot guarantee physical memory erasure, so the warning against real-fund
mnemonics remains prominent.

The same panel now exposes **all 500 rows** of the committed market/SLIP-0044
snapshot, with name/symbol/ID filtering, rather than truncating the selector at
50. There are **347 derivable historical asset rows**; unsupported rows remain
visible with a reason, not an invented address. One selected receive address is
derived on demand. The new investigation tab can explicitly derive all supported
**default leaves locally**, sharing one seed/host-path cache; it never performs
automatic batch network lookups. Bitcoin-family, XRP, Solana, Stellar, NEAR,
Cosmos, TRON and transparent-Zcash families retain their existing codecs.
The rank snapshot is historical (2026-09-11), not a current market listing.
The generator now records source snapshot dates rather than today's wall clock,
so `node tools/build_coins.mjs --check` remains meaningful on a different day.

USDT has an additional explicit network selector, backed by
`config/token-networks.json` / `js/coin-networks.js`, separate from the market
ranking so one token does not acquire invented rank rows:

| Network | Standard / identity | Default holder path | Decimals |
| --- | --- | --- | ---: |
| Ethereum, chain ID 1 | USDT ERC-20 | `m/44'/60'/0'/0/0` | 6 |
| BNB Smart Chain, chain ID 56 | Binance-Peg USDT / BSC-USD, BEP-20 | `m/44'/60'/0'/0/0` | 18 |
| TRON | USDT TRC-20 | `m/44'/195'/0'/0/0` | 6 |

Each choice displays its pinned contract identifier, decimals, fee asset and
network warning. **The derived address belongs to the holder, not the token
contract.** The BSC representation is pegged, not native Ethereum USDT; no backing
or redemption guarantee is made. A shared EVM receive address is not a bridge
and does not make different chains interchangeable. BSC uses the deployed coin-
type-60 convention, not Beacon Chain's 714; chain IDs are metadata, not HD coin
types. A separate research overlay enriches host identities and adds reviewed
host test networks without inventing token deployments. The underlying
historical registry and its support flags are unchanged. See [the standards
survey](docs/bip-standards.md) for pinned GitHub sources and independent
implementation comparisons.

Changing asset/network/phrase/passphrase clears stale selected output and
cancels queued address derivation; phrase/passphrase edits also cancel/clear the
whole local investigation. Dirty/unapplied phrases cannot be used. BTC WIFs
remain only in the explicitly blurred BIP-44/49/84 table. Do not fund educational
test phrases or enter real recovery mnemonics in this educational app.

### Coin evidence, local investigation and the existing metadata viewer

- **Fees & networks:** 58 host profiles, 58 source-reviewed fee models / 0 pending
  host fee reviews, 18 reviewed host test identities. [Round 83 evidence](docs/chain-fee-model-review-round-83-2026-11-17.md)
  completes the original 43 and separates Cronos POS from Cronos EVM; current
  parameters and historical network operation remain unverified. Sort only documented protocol zero or priced
  USD scenarios; unknown/unpriced is never free. Native gas, token execution,
  rollup data and resource/storage/service costs are distinguished. Each of all
  500 asset rows retains an explicit evidence gap and discovery links; this is
  not 500 independently verified contracts. [Inventory](docs/coin-research-inventory-2026-11-17.md).
- **Wallet investigation:** one account-0/default receive leaf per supported
  asset, local/checksum-valid BIP-39 only. Public address, public key, host and
  path rows start with `unqueried` holdings. Alternate paths, accounts, imported
  keys, contract wallets and exhaustive recovery/gap-limit scanning are out of
  scope. No private material is returned by this helper.
- **Read selected balance once:** requires explicit one-address disclosure
  consent and an editable HTTPS provider. EVM expected chain ID is checked
  before address/contract requests; balances are pinned to one reported block.
  Non-EVM network identities are not independently verified. Results distinguish
  error/unsupported/unavailable accounts from provider-observed zero/nonzero;
  no reader proves whole-wallet emptiness, ownership, spendability or honesty of
  the provider. Native EVM/Solana/Stellar/TRON and catalogued mainnet EVM ERC-20
  reads are implemented, other adapters/deployments are unsupported. No signing,
  connection, broadcasting or automatic batch query exists.
- **NFT / token metadata:** embeds the original `apps/index3.html`, now a local
  module-based read-only ERC-721/1155/ERC-20 inspector. Contract read consent and
  off-chain JSON consent are separate. tokenURI is a pointer, not proof JSON
  or media is on-chain; external images/animations/HTML/SVG are never loaded or
  executed automatically. The iframe receives no mnemonic or derived address.

Requests omit credentials/referrer/cache, reject redirects/obvious local URLs,
limit replies to 1 MiB and time out each read at 12 seconds. Browser URL checks
cannot rule out DNS rebinding/private DNS answers, so this must not become an
unrestricted server proxy. All provider tests use synthetic data, not live
holdings. [Detailed evidence, safety limits and sources](docs/coin-fees-and-investigation-2026-11-17.md).

Game of Life, NFT **art generation**, a catalog, 50 themes and CryptoMonopoly
were researched but not copied. The new metadata tab is inspection of the
repository's existing viewer, not an art/game or wallet-transfer surface.

## Checks

```sh
sh tests/run.sh          # suites 01-04, 06, 08-10 need nothing but Node >= 18
npm i --no-save wabt jsdom puppeteer-core @sparticuz/chromium
                         # wabt: lens3d.wasm freshness check; the rest: suites 05, 07
```

| suite | covers | assertions |
|------:|--------|-----------:|
| 01 | generalised layout both directions, mutual invertibility for all 511 counts, the 4…11 checksum widths, the 512-word ceiling and 513 rejection, encode/decode round trips, deterministic checksum corruption, and the measured false-accept rate of a random 12-word phrase | 91 |
| 02 | every lens `compute()` on a real 25-word key, plus known-answer maths (Grünwald–Letnikov coefficients, Möbius involution, eigenvalues, Hamming balls, Itô determinism, AES field multiply, GF(2) rank, spherical excess, cross-ratio invariance, Parseval) and the differential prediction checked against the real hash | 148 |
| 03 | every 2-D renderer (all 72 lenses) through an instrumented canvas context that reports non-finite coordinates, plus empty-data resilience | 140 |
| 04 | every 3-D layer builder: vertex counts, non-finite coordinates, determinism, null-not-throw with no key | 20 |
| 05 | the real `js/viewer.js` booted in jsdom: 72 rack rows, invert/flip/card/lens behaviour, custom lengths through 512 words and the 513 rejection, exact finite-field UI, all 500 historical asset choices, network-aware public vectors and stale-derivation clearing | 77 |
| 06 | the extreme the custom box allows — 512 words / 5632-bit ENT: sweep cost, matrix size, and all 72 lenses computing *and* drawing without NaN | 151 |
| 07 | real headless Chromium/SwiftShader and pixel-decoded WebGL/finite-field rasters; 25- and 512-word phrases, invert/flip/lens behaviour, known network holder vector, 500 local investigation rows (347 derived / 153 unsupported), consent gate, unknown-last fee ordering, integrated NFT page and no automatic external requests | 46 |
| 08 | the syllable counter and 5-7-5 layout the workbench shares (`tools/blink_contract.mjs` is unrelated; this one predates it) | 12 |
| 09 | the DOM stand-ins measured against Blink itself — `getContext`'s accepted ids, the memoised-context and wrong-type rules, `[PermissiveDictionaryConversion]`, the canvas size gates, `bufferData`/`texImage2D` overload arity, the WebAssembly-shaped buffer ceiling, and `getElementById` returning `Element?` | 56 |
| 10 | the WebAssembly rasteriser: `wasm/lens3d.wat` assembled and validated, its projection checked against `js/spacefill.js`, bit-exact parity with the JS shadow on vertices *and* texture, geometry invariants, overflow/NaN/viewport guards, and a real-Chromium boot of `lens3d-wasm.html` | 72 |
| 16 | descriptive key statistics known cases, p-value helpers, lag correlations, histogram accounting, and finite geometry for the distribution/autocorrelation 3-D layers | 33 |

Suite 05 gates `tests/run.sh` again. For a while it was *stale, not skipped*:
the invert A↔B block (§11), the lens rack (§12) and the generalised length menu
had been dropped from `keyspace.html` / `js/viewer.js` when the haiku, wallet
and statistics work was merged on top of an older copy of the page, while
`js/formal.js`, `js/lens-draw.js`, `js/lens-3d.js` and the suites that drive
them stayed in the tree. The layered page was re-merged from that history
(three-way against its base, keeping §6 statistics, §13 haiku and §14 wallet),
and `node tools/check-dom-ids.mjs --html keyspace.html --js js/viewer.js`
again finds every controller id in the markup.

Suite 05 stubs only the WebGL backend (a module-resolve hook) and the canvas
rasteriser; viewer.js, formal.js, lens-draw.js, bip39.js and
`wasm/entropy.wasm` all run for real.

Suite 07 closes the browser gap: the Chrome-for-Testing CDN is unreachable here,
but the `@sparticuz/chromium` npm tarball (registry.npmjs.org *is* reachable)
ships the browser plus its missing `libnspr4/libnss3/libnssutil3` in
`al2023.tar.br` and a software WebGL stack in `swiftshader.tar.br`. With those
extracted, headless Chromium boots the page and renders the 3-D scene
(≈4×10⁵ lit pixels decoded from the stage screenshot). Not covered: interactive
OrbitControls gestures and a hardware GPU path.

## The rasteriser in WebAssembly, and Blink as the DOM reference

`wasm/lens3d.wat` holds the three projection-determined 3-D layers — subcube,
geodesic, complement — as a 4 KB module that both builds the interleaved vertex
records and rasterises them into an RGBA texture, and `js/lens3d-ref.js` shadows
it op for op so the WebAssembly path is *checkable* rather than merely
plausible. `lens3d-wasm.html` runs either backend against the same client and
offers both GPU paths (wasm→VBO→`gl.POINTS`/`gl.LINES`, and wasm→RGBA→texture).

The DOM and WebGL surface that path touches is derived, not remembered:
`tools/blink_contract.mjs` mines `third_party/blink/renderer` from a Chromium
checkout into `config/blink-dom-contract.json`, `tools/dom-stub.mjs` builds its
canvas and WebGL recorder from that file, and suite 09 fails if they drift.
Design, findings and the re-mining recipe: `docs/blink-webgl-wasm.md`.

```sh
node tools/build_lens3d_wasm.mjs            # .wat → wasm/lens3d.wasm (needs wabt)
node tools/build_lens3d_wasm.mjs --check    # run.sh calls this; SKIPPED without wabt
node tools/blink_contract.mjs --src /path/to/chromium/src          # rewrite the JSON
node tools/blink_contract.mjs --src /path/to/chromium/src --check # drift check
```

## Packaging

```sh
sh tools/pack_keyspace.sh   # -> keyspace.xdc  (standalone Keyspace Viewer)
sh tools/pack_xdc.sh        # -> sitek.xdc     (SITE-K hub incl. the viewer)
```
