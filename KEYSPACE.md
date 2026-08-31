# KEYSPACE VIEWER — layers, lenses, and the generalised word count

`keyspace.html` · `js/viewer.js` · `js/formal.js` · `js/lens-draw.js` · `js/lens-3d.js`

Open `keyspace.html` in a browser, or load `keyspace.xdc` into a messenger that
speaks webxdc. Offline, keyless, no build step. Everything below is computed
from the loaded key in the tab — nothing is fetched, nothing is estimated where
it can be measured.

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
(`layoutForWords` / `layoutForEntropyBits` are mutual inverses for n = 2…60,
asserted in the test suite). The custom box takes either a word count (2–512)
or an entropy bit length (any multiple of 8). Above the ladder the checksum is
a *smaller* fraction of the entropy, so the generalised lengths are not
"stronger BIP-39" — the UI says which rule produced the phrase.

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

Ten families, 44 lenses: invert (4), λ-calculus (4), analysis (7), logic (5),
algebra (7), geometry (6), trigonometry (4), time (3), stochastic (2), process
(2). The **algebra** group keeps the lenses it already had (`boolean`, `umbral`)
and merges in group theory (the sorting permutation's cycle type / order / sign),
linear algebra over GF(2) (rank of the word-bit matrix), finite fields
(GF(2⁸) byte arithmetic + inverses), the divisor lattice of the word count, and
the index sequence as a polynomial over Z. **Geometry** adds metric, Euclidean,
spherical, projective (cross-ratio), convex (hull/shoelace) and topological
(Euler / Betti) readings. **Trigonometry** adds the unit circle, the DFT with
Parseval, the laws of sines/cosines, and harmonic regression.

Where a system has real geometry or real measurement behind it, it gets a
renderer. Where it does not, the entry is marked `card` and says why — there is
exactly one today: **typed λ-calculus**, because stating Φ's type precisely
needs a dependent type (`Φ : (e : Bit^ENT) → Bit^(ENT/32)`), and there is no
keyspace geometry to draw from that.

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

## Checks

```sh
sh tests/run.sh          # suites 01-04 and 06 need nothing but Node >= 18
npm i --no-save jsdom puppeteer-core @sparticuz/chromium   # optional: enables 05 and 07
```

| suite | covers | assertions |
|------:|--------|-----------:|
| 01 | generalised layout both directions, mutual invertibility, encode/decode round trips, deterministic checksum corruption, and the measured false-accept rate of a random 12-word phrase | 73 |
| 02 | every lens `compute()` on a real 25-word key, plus known-answer maths (Grünwald–Letnikov coefficients, Möbius involution, eigenvalues, Hamming balls, Itô determinism, AES field multiply, GF(2) rank, spherical excess, cross-ratio invariance, Parseval) and the differential prediction checked against the real hash | 120 |
| 03 | every 2-D renderer (all 44 lenses) through an instrumented canvas context that reports non-finite coordinates, plus empty-data resilience | 100 |
| 04 | every 3-D layer builder: vertex counts, non-finite coordinates, determinism, null-not-throw with no key | 20 |
| 05 | the real `js/viewer.js` booted in jsdom: 44 rack rows, the 25-word switch, invert invariants through the buttons, the 264-bit flip sweep, card behaviour, toggle-vs-focus, custom bit length | 38 |
| 06 | the extreme the custom box allows — 512 words / 5632-bit ENT: sweep cost, matrix size, and all 44 lenses computing *and* drawing without NaN | 95 |
| 07 | the real thing: headless Chromium (from `@sparticuz/chromium`, whose tarball supplies the browser *and* the three NSS libs this sandbox lacks) with SwiftShader for WebGL, driving the live page — boot, 25-word switch, invert invariants, the measured flip sweep, and pixel-decoded proof that the stage rasterises | 20 |

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

## Packaging

```sh
sh tools/pack_keyspace.sh   # -> keyspace.xdc  (standalone Keyspace Viewer)
sh tools/pack_xdc.sh        # -> sitek.xdc     (SITE-K hub incl. the viewer)
```
