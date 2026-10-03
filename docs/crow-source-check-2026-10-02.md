# Crow Cryptogram source check — 2026-10-02

## Executive finding

The research is reproducible for the cipher family and the proposed false starts, but there is still no source-supported Crow plaintext or key phrase in the public material inspected. The publisher's page lists Oleksii Sylichenko and Daisuke Kondo in its table of honor, yet publishes neither submitted solution file nor plaintext. A solve claim should therefore remain provisional unless it includes the key phrase, recovered plaintext, and an exact 600-digit re-encryption match.

## Source grading

| Source | Role | Claims directly supported | Limits |
| --- | --- | --- | --- |
| [The Crow's Cryptogram](https://www.ciphermachinesandcryptology.com/en/crow.htm) | Primary publisher page | 600 digits, 120 five-digit groups, English text, secret key phrase, verse is a hint, table-of-honor dates/names | Does not publish the key or plaintext; table-of-honor entries are publisher assertions, not independently audited solve artifacts |
| [SECOM page](https://www.ciphermachinesandcryptology.com/en/secom.htm) | Primary algorithm description from same publisher | Four stages: key-phrase digits, straddling checkerboard, two columnar transpositions, one disrupted; official worked example | It demonstrates the cipher and example, but does not itself prove the Crow's exact key or plaintext |
| [asilichenko/enigma README](https://raw.githubusercontent.com/asilichenko/enigma/master/README.md) | Solver's own primary code documentation | M3/M4 simulator, plugboard setup, hill-climbing stages, IoC shortcut, precomputation, threshold calibration | Enigma only; contains no Crow answer |
| [asilichenko/secom-cipher-gui](https://github.com/asilichenko/secom-cipher-gui) | Indexed GitHub repository page / historical primary project | Search-indexed README says it is a Java SECOM GUI, based on Dirk Rijmenants's description, GPL-3.0, with a 2023 release | Current GitHub API and direct repository page return 404 in this pass; source is not presently retrievable, so its code cannot be audited or used as proof of a Crow solution |
| [Sullivan & Weierud, Hillclimbing the Enigma Machine](https://cryptocellar.org/bgac/hillclimb-enigma.pdf) | Historical technical reference | Stecker board semantics, plugboard search difficulty, IoC use, hill-climbing rationale | Enigma method paper; not evidence about the Crow cipher family |
| [`tools/secom_probe.py`](../tools/secom_probe.py) | Local executable reproduction | Official SECOM example round-trips; Crow ciphertext length/histogram; candidate scan results | A reproduction can validate implementation and reject candidates, but cannot turn a negative search into proof that no other key exists |

## Cross-checks performed

### SECOM algorithm

The local implementation reproduces the publisher's worked example:

```text
Plain: RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL
Key:   MAKE NEW FRIENDS BUT KEEP THE OLD
```

The resulting 105-digit ciphertext and reverse decryption pass the stored control. This validates the key schedule, checkerboard, both transpositions, disrupted triangular fill, and padding path used by the probe.

### Crow ciphertext integrity

The embedded Crow ciphertext contains exactly 600 digits. Its transposition-invariant histogram is:

```text
2:144  3:116  8:88  5:56  7:46
6:45   4:40   1:33   0:23   9:9
```

The local verifier recomputes this from the ciphertext constant rather than trusting a copied note.

### Enigma / Stecker separation

The Enigma README and Sullivan–Weierud reference agree that Stecker pairs swap alphabetic letters before and after the rotor bank. `EN RT OS AI` is consequently valid as an Enigma plugboard setting, but it is not a 20-letter SECOM key phrase and cannot be applied to the Crow's digits. The local benchmark recovers `AI EN OS RT` from synthetic Enigma control data; that is a method test only.

### Poem keyspace

The normalized poem was searched as 107 contiguous 20-letter windows, with four duplicates already covered by named candidates, leaving 103 unique window candidates. Nine exact word-boundary spans contain exactly 20 letters. All candidates failed the calibrated English/IoC ladder. This result is reproducible, but it only rejects the contiguous-window hypothesis; it does not reject acrostics, indexed extraction, anagrams, or a key phrase semantically suggested by the poem.

## Claims that should not be promoted to “solved”

- `EN RT OS AI` is not a recovered Crow setting.
- The poem's first 20 letters are not a verified Crow key.
- The opening phrase `IN MY MEMORY I WILL ALWAYS SEE` is an exact-model rejection, not a discovered plaintext.
- The table-of-honor names establish a claimed solve history, not a public answer that can be independently re-encrypted from the page.

## Reproducibility commands

```bash
python3 tools/secom_probe.py
node tools/verify_lecture_hall.mjs
```

The strongest next source request would be the publisher's original solution attachment or a direct statement from a listed solver containing the 20-letter key phrase and plaintext. Without that artifact, further work should be labelled a key-space experiment, not a solved result.
