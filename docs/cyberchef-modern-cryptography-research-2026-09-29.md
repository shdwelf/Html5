# CyberChef modern-cryptography recipe research — 2026-09-29

This is the next research pass for the CyberChef learning kitchen. The books and
lecture notes below are used as **design references**, not as a claim that a small
JavaScript recipe is a production implementation. The existing ML-KEM and ML-DSA
recipes remain explicitly educational and must not be labelled FIPS-compatible.

## Reading map

| Source | What it contributes to the kitchen |
| --- | --- |
| Katz & Lindell, *Introduction to Modern Cryptography* | security games, reductions, indistinguishability, and the distinction between a construction and its proof |
| Pass–Shelat–Rosulek–Smart–Trevisan course material | multiparty/security definitions, secret sharing, zero knowledge, and modern proof vocabulary |
| Goldwasser–Bellare, *Lecture Notes on Cryptography* | probability, computational problems, signatures, encryption, and the experiment-based presentation style |
| Bellare–Rogaway | concrete security, game hopping, authenticated encryption and reduction accounting |
| Boneh–Shoup, *A Graduate Course in Applied Cryptography* | self-contained algebra/probability appendices and construction case studies; the current public draft is v0.6 (2023) |
| Debris-Alazard, *Code-based Cryptography: Lecture Notes* | Hamming geometry, linear codes, syndrome decoding, information-set decoding, McEliece and Niederreiter |

Primary links: [Boneh–Shoup](https://toc.cryptobook.us/book.pdf),
[Goldwasser–Bellare](https://www.cs.umd.edu/~jkatz/crypto/lecture_notes.html),
[Debris-Alazard, arXiv:2304.03541](https://arxiv.org/abs/2304.03541), and
[NIST FIPS 203](https://doi.org/10.6028/NIST.FIPS.203).

## Recipe boundary

The useful recipe unit is a **small, inspectable mathematical experiment**:

1. normalize and display the algebraic object;
2. run a deterministic toy operation;
3. show an invariant or verification result;
4. state the security caveat beside the output.

Do not expose recipes that invite users to enter real secrets, and do not call a
reduced parameter set “ML-KEM”, “ML-DSA”, “secure”, or “post-quantum secure”. A
recipe should carry `educational`, `reduced`, and `not for real data` metadata.

## Lattice mathematics to build before more recipes

The common foundation is the quotient polynomial ring

\[
 R_q = \mathbb Z_q[x]/(x^n+1),
\]

with vectors and matrices over `R_q`. Multiplication is cyclic convolution with
sign reversal at degree `n` (because `x^n = -1`), then coefficient reduction
modulo `q`. This is the operation needed by both the ML-KEM-style and ML-DSA-style
educational recipes; it should be implemented once and tested independently.

### Minimal primitives

- centered modular reduction, with a documented tie convention;
- add/subtract and schoolbook multiplication in `R_q`;
- vector dot products and matrix-vector products over `R_q`;
- coefficient-wise compression/decompression (rounding, not truncation);
- deterministic seeded sampling for test vectors only;
- norm, Hamming weight, and coefficient histogram displays;
- optional NTT later, only after the schoolbook implementation agrees with it.

### MLWE/KEM teaching model

For a toy module-LWE sample, generate

\[
 t = A s + e \pmod q,
\]

where `A` is public, `s` is a small secret, and `e` is a small error vector. The
recipe can display the residual `t - A s` and confirm that it equals `e`. This
teaches why the error hides the linear relation without pretending to provide a
KEM. FIPS 203 is the normative source for ML-KEM; the toy operation is not a
conforming implementation.

### SIS/LWE visualizer

For a small integer matrix `A`, let `z` be a short vector and display
`A z mod q`. A second panel searches a bounded box for collisions. This gives a
concrete view of short-integer relations and why “find a short relation” is a
problem statement, not an encryption algorithm.

### Code-based bridge

Keep the code-based track mathematically separate from lattices:

- a linear code is `C = {mG : m in F_q^k}`;
- a parity-check matrix satisfies `H c^T = 0`;
- a received word is `y = c + e` and its syndrome is `s = H y^T = H e^T`;
- bounded-distance decoding succeeds when the error weight is below half the
  minimum distance.

A safe recipe can enumerate a tiny code, calculate syndromes, and compare brute
force decoding with a deliberately hidden permutation. Debris-Alazard’s notes are
the source for the decoding-first progression and the warning that toy dimensions
say nothing about deployed security.

## Verification checklist for the next implementation pass

- ring multiplication agrees with a slow coefficient-by-coefficient oracle;
- `(a+b)c = ac+bc`, multiplication is associative in tested toy rings, and
  reduction is applied after every public operation;
- MLWE residual tests recover the injected error exactly;
- syndrome of every generated codeword is zero;
- all UI labels distinguish toy demonstrations from standardized algorithms;
- vectors are fixed and readable, with no hidden randomness or network calls;
- tests include malformed dimensions, non-invertible parameters, and coefficient
  values outside the canonical range.

## Research conclusion

The next useful change is not another named “cipher”. It is a shared, tested ring
and linear-algebra layer, followed by tiny LWE/SIS and syndrome-decoding visual
recipes. That ordering follows the references’ progression from definitions and
security experiments to constructions, and prevents the existing kitchen from
turning a pedagogical toy into an accidental cryptographic API.
