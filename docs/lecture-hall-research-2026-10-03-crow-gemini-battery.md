# Crow continuation — Gemini-plan exhaustive battery, Wordsworth stream, 2026-10-03

This pass executes the analysis plan the requester quoted from a Gemini
session (monographic frequencies, digram/periodicity, disruption hunting,
checkerboard reversal, and a *structured 20-letter extraction of the hint
text*), plus the requester's additions: a Wordsworth candidate source
("a host of golden daffodils", Project Gutenberg), a CyberChef kitchen
fix, and a cheyenne.xdc load-failure investigation, with a pull request.

Deltas: `tools/secom_ref_impl.py` (independent SECOM engine),
`tools/crow_gemini_battery.py` (six-part battery),
`docs/crow-gemini-battery-2026-10-03-output.txt` (raw run),
two repo fixes (`apps/cyberchef.html`, `js/cheyenne.js` + rebuilt
`cheyenne.xdc` bundle). Lecture-hall records and the verifier are
deliberately untouched; the battery is self-verifying.

Nothing here is, or claims to be, a solution.

## 1. Two engines, and the payoff of cross-validation

Pass one built the exact SECOM model in `tools/secom_probe.py` (official
worksheet vector, 105 digits). This pass adds a second, from-scratch
implementation in `tools/secom_ref_impl.py`. Comparing them stage by stage
produced one cosmetic difference (the probe decodes the space symbol `*`
to a space, the ref keeps `*`) and one **material discovery**:

- The worksheet numbers the checkerboard top with *"assign 1 to the
  smallest digit … **treating 0 as the last number**"*. The official
  example has no 0 in that row, so a 0-smallest implementation also
  passes the published vector — but **70 of the 111 previously merged
  candidates (63%) have a 0 in their last chain row** and were therefore
  rejected under a non-worksheet board numbering in the merged record.
  All 69 unique contaminated phrases are re-tested in this pass under the
  worksheet rule (both engines agree bit-for-bit on zero-free schedules,
  and both numbering modes agree with each other when no 0 is present).

The battery also reproduces the documented degenerate-key edge case: 42
of this pass's phrases produce a chain block whose distinct digit values
cannot close two width sums > 9; such keys are unusable and are skipped
with a count (first noted in the earlier pass for a symmetric phrase).

## 2. The statistical battery, honestly reported

### B1 — Monographic frequencies: the distribution is NOT flat

| digit | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| count | 23 | 33 | 144 | 116 | 40 | 56 | 45 | 46 | 88 | 9 |
| % | 3.8 | 5.5 | 24.0 | 19.3 | 6.7 | 9.3 | 7.5 | 7.7 | 14.7 | 1.5 |

χ² against uniform is **275.2** (df=9, 1% critical ≈ 21.7), digit-level
sum-of-squares 0.1459 against a 0.1000 floor, and the triple {2,3,8} holds
**58.0%** of all digits. The quoted plan's expectation of a "mostly flat
(homophonic or pseudorandom)" distribution is **refuted** — exactly
because SECOM has no homophonic component, the checkerboard's uneven
encoding survives both transpositions perfectly (transposition permutes
digits but never changes their counts). The histogram is the single most
informative public property of the cryptogram.

### B2–B4 — Adjacency, repeats, autocorrelation

- 599 overlapping digrams: association χ² = 98.1 (df≈81, crit ≈103),
  mutual information 0.1235 bits — **consistent with independence**;
  the stream behaves like a permutation (top digrams 22×36, 32×29, 82×26
  are pure mass products of B1).
- Kasiski: 3-gram repeats 139 distinct / 262 total, 4-grams 49/58,
  5-grams 6/6, gap gcd = 1 in every family. No period leaks.
- Autocorrelation lags 1–150: max |z| = 2.34 (lag 72); **no lag passes
  |z| > 3** (≈0.4 expected by chance). No hidden cycle.

### B5–B6 — Grid width and disruption hunt

- Width scan w=2..45 by mean column SSQ: leaders are w=41–45 — a known
  artifact (columns shrink to ~13 digits and SSQ inflates); no
  informative middle-width spike. Column-χ² leaders are trivially small
  widths. Horizontal bigram MI is flat.
- Homogeneity: first/second half χ²=13.9 (df≈9), quarter χ²=34.7
  (df≈27, crit ≈40), KS gap 0.060. **No frequency step**: the disruption
  triangle does not leak as a distribution break.

### B7 — Controls: the width-recovery step is a dead end

Encrypting a 460-symbol English control text with a known phrase
(w1=11, w2=17): on **simple-transposition-only** output, w1 ranks #36 of
44 by column SSQ; on the full double-disrupted output, w1 ranks #35 and
w2 #29. Column-marginal statistics are the wrong instrument even for a
single transposition of fractionated text; the classic remedy is a
digram *contact* method between column pairs, and the second, disrupted
pass of SECOM exists precisely to defeat it. The plan's "find the grid
width, then read vertically" step fails on this construction even under
ideal, fully-known conditions.

## 3. Part C — the checkerboard skeleton, recovered key-independently

Because monogram counts survive transposition exactly, the checkerboard
can be fitted from the histogram alone (English letter masses, unknown
space rate σ, unknown digit-symbol rate ρ, rank-optimised assignment,
then an exact rotated-row geometry fit over 6 prefix placements × 7!
letter placements ≈ 30k boards):

- **Prefixes: digit 2 heads the BCDFGHJKLM row, digit 3 heads the
  PQRUVWXYZ\* row, digit 9 heads the 0123456789 row** (χ² 0.1699 vs
  runner-up set {2,8,9} at 0.1863; robust across σ,ρ grids).
- One-digit letters, coarse rank-match: **8:E, 5:T, 7:A, 6:O, 4:I,
  1:N, 0:S**; exact geometry fit refines to **8:E, 5:T, 6:A, 7:N, 4:O,
  1:I, 0:S**. Both stages agree on E=8 (the strongest single, 88/600),
  T=5, S=0; the A/N and O/I micro-swaps sit within a real message's
  sampling noise and are marked indicative, not proven.
- Corollaries: with σ ≈ 0–0.05 the plaintext uses the `*` space sparingly
  or not at all; the 9/600 row-3 prefix mass implies only about four
  encoded numeral symbols in the whole message (fitting the "not once or
  twice but three times" flavour); up to four pad nulls inflate the tail.
- The remaining checkerboard unknowns (the relative order of the ten top
  digits, i.e. which letter sits in which column) cannot be validated
  from monograms; second-digit bonds are destroyed by the transposition.
  What survives is a tight board skeleton that any proposed key must
  reproduce — a cheap falsifier before any re-encryption.

## 4. Part D — structured extraction of the hint text

Mechanical micro-extractions (all < 20 letters, hence documented, not
decryptable): caps stream `TTSECOMNANTW`, line acrostic `NTANTW`,
line telestich `TDSSFL`, main diagonal `NHOOVN`, first-words
`NEVERTHEANOTTOWE` (16), second-words `FORGETTOWNTOWNONCEUNVEILFOUND`
(29, windows taken), last-words `FORGETLOVEDSTRANGERSTIMESGRIEFSOIL`
(34, windows taken). The odd caps in "They SEe and COMe" → **SECOM**, as
long established.

Decryptable streams (all 20-letter windows, both board modes): intro
sentence, poem blob, intro+poem, poem reversed, per-line reversed,
word-order reversed, word-initials, word-finals, stride-2 and stride-3
reads, the Coulter song blob (1973 Derry hypothesis from the earlier
pass), and — new at the requester's direction — the **Wordsworth
"I wandered lonely as a cloud" blob transcribed from Project Gutenberg
EBook #12383** (ed. Knight, 1896 text; 606 windows of 20 letters) plus an
acrostic-augmented variant and ten named lines/paraphrases, and a
4,977-phrase semantic permutation family over the hint's token set with
DERRY/DOIRE/LONDONDERRY/SIEGE/DAFFODILS/GOLDEN/CLOUD additions.

## 5. Part E — calibrated scan result

Sylichenko-style discipline: an English sample (IoC 0.0678, χ² 25.2,
bigram +0.175) and a null decrypt (IoC 0.1673, χ² 633.5, bigram −0.246)
define the ladder (bigram ≥ −0.036 AND χ² ≤ 329.4 AND IoC ≤ 0.1175);
two positive controls encrypt-then-scan and **survive**, as they must.
The IoC rung remains load-bearing because the board biases all wrong-key
output toward E,S,T,O,N,I,A.

- **6,480 unique 20-letter candidates**; 110 overlap the merged record,
  6370 are new; **12,767 decrypt-and-score events** (both board modes);
  42 degenerate keys skipped.
- **Survivors: 0.** The best new decrypts by bigram
  (LONDONDERRYNEVERSIEG +0.152, Wordsworth window VEMOODTHEYFLASHUPONT
  +0.151, …) all carry IoC ≥ 0.1466 — letter soup the ESTONIA board
  flatters, and the ladder kills every one. The Wordsworth hypothesis is
  tested and rejected along with the rest; per-variant caveat — the
  Gutenberg volume's 1807 variants alter a few words ("Along the Lake,
  beneath the trees, / Ten thousand dancing in the breeze."), and those
  variant lines are *not* in this scan.

Verdict: the phrase remains unknown. The negative result, the corrected
rejection record (70 contaminated prior tests re-run properly), the board
skeleton, and the two-engine tooling are the research product.

## 6. What remains open, concretely

1. Keyphrase space beyond poetry windows: quote/proverb corpora, book
  titles, and multilingual phrases (the riddle's tone invites a memorial
  or folk-saying source). Each is one decrypt event on this tooling.
2. A genuine cryptanalytic attack: simulated-annealing over column
  orders for both transpositions, scoring intermediate text by digram
  compatibility against a checkerboard-aware digram model (Rijmenants'
  own "double transposition" literature describes the contact method the
  disruption defends against); the B7 controls say simpler instruments
  are insufficient.
3. Constraint propagation from Part C: the board skeleton plus the two
  transposition widths derivable once a key schedule is hypothesised
  cuts the search space appreciably; anyone attempting the anneal should
  seed from the skeleton, not from scratch.

## 7. Repository fixes in this pass

- **`apps/cyberchef.html`** ended with an injected Cloudflare challenge
  iframe script (`window.__CF$cv$params`, `/cdn-cgi/challenge-platform/…`)
  left by a proxy save — the "code broke on the bottom" report. Removed;
  the app script now closes cleanly (`renderOpsList();renderRecipe();`),
  zero `__CF`/`cdn-cgi` references remain. Eight other saved pages carry
  the same injection; left untouched here and listed in the PR as a
  follow-up.
- **`cheyenne.xdc`** investigated: zip integrity, webxdc structure
  (index.html at root, manifest.toml, icon, simulator shim), bundle ==
  authoring sources, all JS syntax-clean, warm ESM smoke boot in Node.
  The only unguarded failure path left is real: `THREE.WebGLRenderer`
  throws in GPU-less hosts (xdc simulators/old webviews), dying
  silently. `js/cheyenne.js` now preflights WebGL2/WebGL and surfaces any
  boot error in a readable card instead of loading forever; the bundle
  was rebuilt reproducibly (`node scripts/build-cheyenne-xdc.mjs`, smoke
  test green, 14 entries, no errors).

## 8. Reproduce

```sh
python3 tools/secom_ref_impl.py        # official worksheet vector: PASS
node -e "import('./js/cheyenne.js')"   # cheyenne module-graph smoke: OK
python3 tools/crow_gemini_battery.py   # full battery (≈10 s)
```

Raw battery output: `docs/crow-gemini-battery-2026-10-03-output.txt`.
