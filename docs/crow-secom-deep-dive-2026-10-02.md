# Crow SECOM deep dive — source clue and near-key tests

## New source observation

The Crow page opens with “They **SEe and COMe**...”. The unusual capitalization spells `SECOM`, a strong cipher-family clue. It identifies the algorithm family but not the secret key phrase.

The publisher's [SECOM specification](https://www.ciphermachinesandcryptology.com/en/secom.htm) independently matches the local implementation: rank the first 20 key letters in two halves, mod-10 add, chain-add 50 digits, derive the checkerboard and transposition keys, then apply the normal and disrupted transpositions.

## Near-key tests

The poem/title fragment `THE TOWN I LOVED SO WELL` contains only 19 letters after normalization, so it cannot satisfy the documented 20-letter key requirement. Nevertheless, all 26 one-letter extensions were tested:

```text
THETOWNILOVEDSOWELLA ... THETOWNILOVEDSOWELLZ
```

None passed the calibrated English thresholds. The best low-IoC group still had chi-squared values above 440 and bigram scores below -0.14; the required thresholds are IoC ≤ 0.1177, chi-squared ≤ 335.0, and bigram ≥ -0.091.

The literal 20-letter poem windows, exact word-boundary 20-letter spans, and the opening candidate `IN MY MEMORY I WILL ALWAYS SEE` remain rejected as well.

## What this narrows

- `SECOM` is strongly identified by the page's capitalization.
- The poem supplies a key hint, but no tested literal contiguous fragment has produced English plaintext.
- `THE TOWN I LOVED SO WELL` is a near-key lead but is one character short and all 26 naive completions fail.
- `EN RT OS AI` remains unrelated Enigma plugboard control data.

## Source caution

The [Wikipedia VIC article](https://en.wikipedia.org/wiki/VIC_cipher) supports the historical family resemblance—chain addition, checkerboard, and disrupted double transposition—but does not publish the Crow key. It also carries a citation-needed notice. The Crow page and SECOM worked example remain the stronger sources for this investigation.

A future search should prioritize structured extraction rules that turn the poem into exactly 20 letters, especially capitalization, acrostics, line endings, or a key phrase suggested semantically by the poem. It should not silently pad or mutate a 19-letter title into a claimed solution.
