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

Where a system has real geometry or real measurement behind it, it gets a
renderer. Where it does not, the entry is marked `card` and says why — for
example **typed λ-calculus** (stating Φ's type precisely needs a dependent
type, `Φ : (e : Bit^ENT) → Bit^(ENT/32)`, with no keyspace geometry to draw)
and most of the abstract-algebra entries (their content is a structure census,
not a picture).

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

### Algebra family

After the calculus families (λ, analysis, logic, time, stochastic, process)
comes the **algebra** family — 30 layers covering the named algebras, each
computed from the key's own bits and indices:

- measured: **linear** (GF(2) rank of the 12×11 index matrix), **Lie** (Jacobi
  residual of the cross product), **division** (‖pq‖ = ‖p‖‖q‖ on key
  quaternions), **exterior** (Gram determinant of the first two word vectors),
  **Banach** (spectral radius of the self-adjoint Gram operator), **σ-algebra**
  and **homological** (atoms and Betti numbers of the flip-response graph),
  **Clifford** / **tensor** / **symmetric** / **Boolean** / **Heyting** (graded
  dimensions of Cl(ℝ¹¹), T(V), Sym(V), B₁₁).
- structure census (cards): **abstract** (the symbol group (ℤ₂)¹¹ and
  |GL(11,2)|), **universal**, **associative** (M₂(GF(2))), **commutative** and
  **differential** (the checksum's Zhegalkin ring and its derivation),
  **geometric**, **Jordan**, **group**, **enveloping**, **Hopf**, **Frobenius**,
  **C***, **von Neumann**, **relational**, **process**, and **Kleene** — each
  with an exact number and a note on why it is a card rather than a picture.

The running motif: the 11-bit symbol space is 2048 = 2¹¹, which is also
|(ℤ₂)¹¹|, dim Cl(ℝ¹¹), |B₁₁| and the number of multivector/subset basis labels —
so a BIP-39 index reads naturally as a group element, a multivector, or a
subset of bits.

## Checks

Run from the repo root (Node ≥ 18, no dependencies for 1–4; suite 5 needs
`npm i jsdom` and a resolve hook that stubs the WebGL backend):

| suite | covers | assertions |
|------:|--------|-----------:|
| 1 | generalised layout both directions, encode/decode round trip, tamper detection at 12/24/25/33/56 words and 56-bit ENT | 64 |
| 2 | every lens `compute()` on a real 25-word key, plus known-answer maths (GL coefficients, Möbius involution, eigenvalues, Hamming balls, Itô determinism) | 81 |
| 3 | every 2-D renderer with an instrumented canvas context, plus empty-data resilience | 35 |
| 4 | every 3-D layer builder: vertex counts, non-finite coordinates, determinism | 18 |
| 5 | the real `js/viewer.js` boot and UI events in jsdom: 57 rack rows, 25-word switch, invert invariants, 264-bit flip sweep, card behaviour, custom bit length | 39 |

Two extremes are asserted separately: at 512 words (5632-bit ENT) the flip sweep
takes ~0.8 s, the influence matrix is ~22 MB, all 57 lens computes stay clean,
and every renderer emits finite coordinates (charts carry log₁₀ magnitudes
because 2^5624 is not a `Number`).

Not covered: actual WebGL rasterisation and OrbitControls interaction in a real
browser — no headless Chrome is reachable in this environment. Everything up to
the GL boundary is executed by the suites above.

## Packaging

```sh
sh tools/pack_keyspace.sh   # -> keyspace.xdc  (standalone Keyspace Viewer)
sh tools/pack_xdc.sh        # -> sitek.xdc     (SITE-K hub incl. the viewer)
```
