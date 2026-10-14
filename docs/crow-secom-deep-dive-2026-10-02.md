# Crow SECOM deep dive — source clue and near-key tests

## New source observation

The Crow page opens with “They **SEe and COMe**...”. The unusual capitalization spells `SECOM`, a strong cipher-family clue. It identifies the algorithm family but not the secret key phrase.

The publisher's [SECOM specification](https://www.ciphermachinesandcryptology.com/en/secom.htm) independently matches the local implementation: rank the first 20 key letters in two halves, mod-10 add, chain-add 50 digits, derive the checkerboard and transposition keys, then apply the normal and disrupted transpositions.

## Near-key tests

The poem/title fragment `THE TOWN I LOVED SO WELL` contains only 19 letters after normalization, so it cannot satisfy the documented 20-letter key requirement. Nevertheless, all 26 one-letter extensions were tested:

```text
THETOWNILOVEDSOWELLA ... THETOWNILOVEDSOWELLZ
```

None passed the calibrated English thresholds. Rechecked with the corrected board on 2026-10-13, the only four variants meeting the IoC ceiling (W, X, Y, Z) each score chi-squared 592.6 and bigram −0.376. The best overall chi-squared is 435.4 for the V completion, but its IoC is 0.1571; the best bigram score is −0.144 for L, but its IoC is 0.1493 and chi-squared is 548.0. The required thresholds are IoC ≤ 0.1177, chi-squared ≤ 335.0, and bigram ≥ −0.091.

The literal 20-letter poem windows, exact word-boundary 20-letter spans, and the opening candidate `IN MY MEMORY I WILL ALWAYS SEE` remain rejected as well.

## What this narrows

- `SECOM` is strongly identified by the page's capitalization.
- The poem supplies a key hint, but no tested literal contiguous fragment has produced English plaintext.
- `THE TOWN I LOVED SO WELL` is a near-key lead but is one character short and all 26 naive completions fail.
- `EN RT OS AI` remains unrelated Enigma plugboard control data.

## Source caution

The [Wikipedia VIC article](https://en.wikipedia.org/wiki/VIC_cipher) supports the historical family resemblance—chain addition, checkerboard, and disrupted double transposition—but does not publish the Crow key. It also carries a citation-needed notice. The Crow page and SECOM worked example remain the stronger sources for this investigation.

A future search should prioritize structured extraction rules that turn the poem into exactly 20 letters, especially capitalization, acrostics, line endings, or a key phrase suggested semantically by the poem. It should not silently pad or mutate a 19-letter title into a claimed solution.

## Exact-workbench cross-check — 2026-10-13

The supplied `THETOWNILOVEDSOWELLA` worksheet agrees with the schedule inspector:

```text
Ranks : 8219605347 9328704561
Seed  : 7537309808
50    : 2800397880 0803265680 8835811488 6183925264 7912177801
Board : 5914267803
K1(16): 7515788819035320
K2(11): 03818642820
```

This surfaced a drift bug: the schedule inspector ranked the derived digit row in
SECOM order (`1…9,0`), while the exact encrypt/decrypt path reused an alphabetic
lexical sorter (`0…9`) and reported a different internal board. The exact path now
uses the same stable numeric ordering as the inspector; `tools/secom_probe.py` has
the same correction. A regression test checks the supplied schedule and a second
phrase for which the old ordering also changed the actual transposition keys.

The previously pasted 433-character “letter soup” came from the exact path's old
`0…9` board ordering. With the corrected `1…9,0` board, the 600-digit Crow
ciphertext yields 514 output characters (483 A–Z letters). Its metrics are IoC
0.1539, English chi-squared 531.4, and bigram score −0.424; all three are outside
the calibrated English thresholds (IoC ≤ 0.1177, chi-squared ≤ 335.0, bigram ≥
−0.091). For this particular phrase the old and corrected boards happen to derive
the same K1/K2, but the checkerboard mapping differs, so the decoded letters do
change. The candidate remains rejected.

The complete documented hint scan was re-run against the corrected decoder: 8
named phrases plus 103 unique 20-letter windows, zero survivors. Separately, all
26 one-letter completions of `THETOWNILOVEDSOWELL` were rescored under the same
calibrated ladder; zero survive. `tools/secom_probe.py` now reproduces both scans.
These are bounded negative results, not proof that no other phrase exists; the
Crow key and plaintext are still unknown.
