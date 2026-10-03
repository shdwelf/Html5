# Crow poem keyspace search — 2026-10-02

## Search performed

The poem text was normalized to A–Z and searched as contiguous 20-letter candidates under the exact SECOM model in [`tools/secom_probe.py`](../tools/secom_probe.py). This is the defensible interpretation of “twenty letters from the poem”: it does not silently invent anagram order or arbitrary letter selection.

- Flattened poem length: 126 letters
- Raw contiguous 20-letter windows: 107
- Duplicate windows already represented by named candidates: 4
- Unique window candidates evaluated in the combined scan: 103
- Exact word-boundary spans with exactly 20 letters: 9

## Exact word-boundary candidates

| Words | Key candidate | IoC | chi-squared | bigram | Result |
| --- | --- | ---: | ---: | ---: | --- |
| NEVER FORGET THE TOWN WE | `NEVERFORGETTHETOWNWE` | 0.0980 | 464.7 | -0.468 | reject |
| FORGET THE TOWN WE LOVED | `FORGETTHETOWNWELOVED` | 0.1164 | 1797.8 | -0.409 | reject |
| WE LOVED A TOWN BETRAYED | `WELOVEDATOWNBETRAYED` | 0.1141 | 604.9 | -0.361 | reject |
| LOVED A TOWN BETRAYED BY | `LOVEDATOWNBETRAYEDBY` | 0.1042 | 2327.2 | -0.448 | reject |
| BY STRANGERS NOT ONCE OR | `BYSTRANGERSNOTONCEOR` | 0.1579 | 827.0 | -0.269 | reject |
| OR TWICE BUT THREE TIMES | `ORTWICEBUTTHREETIMES` | 0.1336 | 663.8 | -0.308 | reject |
| TWICE BUT THREE TIMES TO | `TWICEBUTTHREETIMESTO` | 0.1546 | 586.8 | -0.261 | reject |
| TRUTH AND SMELL OF GRIEF | `TRUTHANDSMELLOFGRIEF` | 0.1199 | 712.3 | -0.460 | reject |
| GRIEF WE FOUND IN SACRED | `GRIEFWEFOUNDINSACRED` | 0.1001 | 367.1 | -0.290 | reject |

The calibrated thresholds are bigram ≥ -0.091, chi-squared ≤ 335.0, and IoC ≤ 0.1177. A candidate must pass all three. None of the nine word-boundary candidates passes; the full 103-window scan also has zero survivors.

## Stecker cross-check

`EN RT OS AI` was not substituted into this search because it is an Enigma plugboard setting, while the Crow path consumes a 20-letter key phrase to derive its checkerboard and transposition schedule. Applying the Stecker pairs to the digit ciphertext is undefined; using them on an Enigma control recovers the synthetic control plaintext only.

## Limits and next step

This search does not test every arbitrary 20-letter subset of the poem. That space is combinatorial and destroys the poem's order; it would require a language model or an independently justified extraction rule. It also does not claim that the true key must be a literal contiguous poem window. A genuine solve still requires an exact 600-digit re-encryption match and independent confirmation.
