# The Crow's Cryptogram investigation — and the Kryptos-misspellings Enigma experiment

*Investigation pass 2026-10-02. Reproducible from this repository:
`tools/crow_kryptos_enigma_experiment.py` (Python) and
`js/lecture-ciphers.js` → `kryptosEnigmaExperiment()` (JavaScript) produce
identical numbers; `tools/verify_lecture_hall.mjs` section 9 asserts them.
Corpus and records live in the cipher-suite bundle (crow-cryptogram literary
record, museum pane `pa`, Enigma preset "Kryptos Misspellings Experiment
(2026)").*

## The request, as received

The user's voice note asked, paraphrased: *maybe solve the crow cryptogram
with the 20 words from the poem; and the Kryptos — the misspellings are the
rotor settings on the Enigma; there is an Enigma with another rotor
(Wikipedia mentions); maybe the [ring] settings from the Morse, the
plugboard, and ring setting, from the spellings above.*

Two corrections the record has to carry before any cryptanalysis:

1. **The poem is 31 words, not 20.** Verbatim (Dirk Rijmenants,
   ciphermachinesandcryptology.com/en/crow.htm, page last changed
   05 September 2026):

   > Never forget the town we loved
   > A town betrayed by strangers
   > Not once or twice but three times
   > To unveil the truth and smell of grief
   > We found in sacred soil

2. **"An Enigma with another rotor" is the Kriegsmarine M4** — the
   four-rotor Enigma (Zusatzwalze **Beta** or **Gamma** + thin reflectors
   UKW-B/C Thin), introduced for the U-boat Triton ("Shark") network on
   1 February 1942 (Crypto Museum's wiring page says 2 February — the
   discrepancy is cited, not resolved).

## The corpus

- 600 digits in 120 five-digit groups (first groups: `81232 44783 73232
  32263 75722 86365 51963 87366 …`). Full text in `js/lecture-ciphers.js`
  (`CROW_2010.ciphertext`) and in the bundle.
- Hint line: *"The old crows are on the watch. They SEe and COMe…"*
- Table of Honor at fetch time: **1. Oleksii Sylichenko (Ukraine),
  8 February 2023; 2. Daisuke Kondo (Japan), 5 September 2026.** Neither
  solution method has been publicly disclosed in detail. Rijmenants
  describes the system as pencil-and-paper with a secret key phrase; the
  poem hints at the key phrase but is not itself used in the encryption.
- Published 2010; the cryptogram resisted all public attack for ~13 years.

## Computed statistical profile (not quoted — recomputed)

| Measure | Value | Reading |
|---|---|---|
| Digits / groups | 600 / 120 | as advertised |
| Digit IoC | **0.144** | far above uniform (0.100) |
| Digit 2 count | 144 | vs 60 expected uniform |
| Digit 3 count | 116 | digits **2 + 3 alone carry 43.3%** |
| Digit 9 count | **9** | nearly absent |
| Repeated whole 5-digit groups | 0 | the grouping carries no crib |
| Poem | 31 words, 126 letters | correction of the "20 words" memory |

The distribution is the signature of a **straddling-checkerboard-style hand
cipher** (frequent letters assigned to the dense low-digit rows), not of any
rotor machine's output. This is structural evidence against an Enigma
solution for the crow before a single machine is turned — and it survived
the experiment below as the strongest single fact in the file.

## The hypothesis, formalized

The four deliberate Kryptos misspellings (Sanborn's own carvings):

| Where | As carved | Intended | First divergence | Changed letter |
|---|---|---|---|---|
| K1 | **IQLUSION** | ILLUSION | position 2 | Q (for L) |
| K2 | **UNDERGRUUND** | UNDERGROUND | position 8 | U (for O) |
| K3 | **DESPARATLY** | DESPERATELY | position 5 | A (for E) |
| Morse slab | **DIGETAL** | DIGITAL | position 4 | E (for I) |

The user's mapping, made concrete (this is **one** instantiation of a family;
the experiment enumerates the family):

- **Grundstellung** ← IQLUSION → `IQLU`
- **Steckerbrett** ← UNDERGRUUND → pairs `UN DE RG` (see below)
- **Ringstellung** ← DESPARATLY → `DESP`
- **Zusatzwalze** ← Beta (the Morse slab's slot), reflector UKW-B Thin

A finding worth recording on its own: **sequential pairing of each
misspelling is over-determined.** UNDERGRUUND pairs as UN-DE-RG-RU-… but the
4th pair RU would **reuse R**; DESPARATLY's 4th pair AT would reuse A
(though LY remains legal if pairing skips-and-continues); IQLUSION's SI
would reuse I. A physical Steckerbrett accepts none of them — each word
yields at most 3 legal pairs, and any "settings from the misspellings"
reading must silently choose which rule to break. That is evidence about the
hypothesis itself, independent of any ciphertext.

## The experiment

Two independent engines (Python: `tools/crow_kryptos_enigma_experiment.py`;
JavaScript: `js/lecture-ciphers.js`, ported into both CyberChef kitchens)
were built to the canonical wirings (Rijmenants' Enigma Tech Details, Crypto
Museum, Wikipedia Enigma rotor details — three sources that agree). Both
engines pass the canonical vectors before any experiment runs:

- AAAAA → **BDZGO** (I-II-III / UKW-B / AAA / AAA) — the Wikipedia vector
- **M4 compatibility**: Beta at A + UKW-B Thin ≡ M3 UKW-B, and Gamma at A +
  UKW-C Thin ≡ M3 UKW-C (all 26 letters, any positions) — the property the
  pre-pass bundle's wrong wirings could not satisfy
- Double-step ADU → ADV → AEW → BFX
- Reciprocity and no-self-encryption with a full 10-plug board

(A methodological note for the file: an earlier draft of the Python engine
had a wrong reverse-path transform — it still passed reciprocity by symmetry
but produced wrong letters. It was caught by the BDZGO vector, which is why
the vectors run **before** every experiment, in the verify harness too.)

Targets: the crow corpus under three digit→letter bridges (0-9→A-J; digit
pairs mod 26; telephone-style 2=ABC…9=WXYZ collapsed), and Kryptos K4's 97
letters (`OBKRUOXOGHULBSOLIFBBWFLRVQQVPRNGKSSOTWTQSJQSSEKZZWATJKLUDIAWINFB
NYPVTTMZFPKWGDKZXTJCDIGKUHUAUEKCAR`) as the natural letter-native control.

Space: 6 starts (IQLU, UNDE, DESP, DIGE, QUAE — the four changed letters —
and UDDE) × 5 rings (DESP, IQLU, UNDE, DIGE, AAAA) × 4 plugboards
(undergruund/desparatly/iqlusion/none, each the legal sequential subset) ×
5 rotor sets (I-II-III × both wide reflectors; Beta-I-II-III + B-thin;
Gamma-I-II-III + C-thin; Beta-II-IV-I; Gamma-V-VI-VIII) × 4 targets
= **2,880 configurations**.

Scoring: composite Englishness (chi-square closeness to English letter
frequencies, index of coincidence, common-word density), 0..1, calibrated
against anchors so "far from English" is a measurement, not an adjective:

| Anchor | Score |
|---|---|
| The crow poem itself (English) | **0.616** |
| Kryptos K1 plaintext | 0.393 |
| Crow digits mapped 0-9→A-J, raw | 0.300 (IoC 0.144 — the digit bias shows) |
| K4 ciphertext, raw | 0.043 |

## Result — a clean negative

| Outcome | Value |
|---|---|
| Best of all 2,880 runs | **0.173** — Beta-II-IV-I, start UNDE, rings DESP, DESPARATLY plugs, on **K4**, not the crow |
| Best on any crow target | ~0.09 |
| The headline preset (IQLU / DESP / UN-DE-RG) on the crow (A-J bridge) | **0.070**, output head `PEQMUGPJHTKKMVHWIKTAQVNNQGNOHRPUYWPJJBTNMSXNONZR` |

Nothing lands within a factor of two of the poem's 0.616; the winners are
noise-level, and the top scores cluster on the K4 target simply because 97
random letters fit English letter frequencies better than 600 of them. The
hypothesis **fails decisively**, and the failure is now encoded in the
repository rather than left as a story: the verify harness asserts the best
score stays far below the English bar, and the CyberChef `enigma` op ships
the preset so anyone can reproduce `PEQMUG…` themselves.

The structural evidence explains why no Enigma setting could have worked:
the crow's digit distribution (2 and 3 = 43.3%, IoC 0.144) is checkerboard
fractionation, and an Enigma over a digit→letter bridge would preserve
roughly uniform letter output regardless of settings. The two systems do
not even share an alphabet.

## The poem riddle — documented, not solved

"A town we loved… betrayed by strangers… not once or twice but three times…
truth and smell of grief… sacred soil." The riddle presumably points at a
town name (the key phrase hint), with "three times" the load-bearing
constraint. Candidate towns exist in solver discussion (both honored solvers
declined to publish methods; no public town-riddle analysis was found — the
 crow page's hint line and poem are the only primary text). This pass
records the riddle, the "SEe"/"COMe" odd capitalization (two embedded
two-letter groups — noted, unresolved), and does **not** guess a town: an
invented answer would violate the hall's no-unverified-claims rule, and the
experiment above shows the shortcut (Enigma with Kryptos-derived settings)
is not the way in. What a real attack needs is the checkerboard shape
implied by the digit distribution and a key-phrase search over town names —
a hand-cryptanalysis campaign, not a machine-settings guess.

## Standing cautions

- Solver names/dates are from the crow page's Table of Honor at fetch time
  (05 September 2026 page date); methods are undisclosed — no claim is made
  here about how they solved it.
- The Englishness heuristic is a heuristic; the calibration anchors bound
  its meaning for this corpus.
- "QUAE/UDDE" and the ring/plug assignments are this pass's enumeration
  choices, not Sanborn's or Rijmenants' statements; the family is broad but
  finite, and the negative result covers all of it.
- K4's 2025 "recovery" (RR Auction sale of the archive, $962,500) is a
  separate record (`kryptos-k4-smithsonian`); this experiment treats K4's
  97 letters only as ciphertext, making no claim about their plaintext.
