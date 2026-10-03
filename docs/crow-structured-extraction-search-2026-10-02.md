# Crow structured poem extraction search — 2026-10-02

## Purpose

This pass tests the next search class after rejecting literal contiguous windows: structured extraction rules that preserve the poem's order and explicitly include the page's `SEe and COMe` capitalization clue.

## Candidate families

`tools/search_crow_extractions.py` generates and scores:

- Word acrostic windows
- Word telestich windows
- Line initials and line endings combined with poem streams
- Exact contiguous word spans and line-internal spans
- `SECOM` plus 15-letter poem windows, and the reverse order
- `SECOM` combined with semantic fragments such as `NEVER FORGET`, `BETRAYED BY STRANGERS`, `UNVEIL THE TRUTH`, and `SACRED SOIL`
- Pairwise concatenations of semantic fragments when they total exactly 20 letters
- Odd/even letter streams from the normalized poem
- Odd/even word streams from the normalized poem

## Results

```text
structured candidates: 458
survivors: 0
```

The calibrated thresholds were:

```text
bigram >= -0.0915
chi-squared <= 334.9830
IoC <= 0.1177
```

The strongest rough bigram candidate was:

```text
ITERTADMLOGIFEONISCE
IoC       0.1587
chi-squared 563.8
bigram   +0.121
```

It came from the odd-letter stream and fails the IoC and chi-squared checks. The best `SECOM`-anchored candidate remained:

```text
SECOMSTRANGERSNOTONC
IoC       0.1559
chi-squared 468.8
bigram   +0.087
```

It also fails the IoC and chi-squared checks. This is an instructive false positive: a good bigram score alone is not sufficient because the SECOM checkerboard can bias wrong-key output toward common English letters.

Other near candidates such as `SECOMERSNOTONCEORTWI`, `SECOMOUNDINSACREDSOI`, and `SECOMSTOUNVEILTHETRU` also fail at least one load-bearing metric. No candidate produced a legitimate plaintext lead.

Some generated keys are structurally invalid because they do not yield two transposition widths; the search records those as invalid and does not treat them as decryptions.

## Interpretation

The capitalization clue strongly identifies the SECOM family, but adding `SECOM` to poem fragments does not reveal the secret phrase. The search now covers literal windows plus a bounded set of plausible extraction constructions. It is not an exhaustive search of arbitrary subsets, anagrams, or all possible semantic paraphrases.

The next evidence-bearing step would require either a more specific extraction rule from the artwork/page layout or a source artifact from one of the listed solvers. A valid solution still requires exact re-encryption of all 600 digits.
