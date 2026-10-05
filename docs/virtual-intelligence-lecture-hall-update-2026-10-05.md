# Virtual Intelligence Lecture Hall — update 2026-10-05

This update records the latest supplied cipher-machine findings without treating
candidate plaintext as a solved message. The strings below are research inputs
for reproducible analysis and recipe verification.

## Key and candidate streams

- Key phrase: `THETOWNILOVEDSOWELLA` (the supplied alternate forms ending in
  `...SOWELLZ` and `...SOWELLS` are retained as test variants).
- Candidate keystream: `EYIEKAAE2ECSKE0TI380EEK24E27BGSI1ITENITE3S3TITAN18SLZ8STLEA`.
- Completion marker: `LONDONDERRYNEVERSIEG`.
- Candidate semantic stream: `VEMOODTHEYFLASHUPONT`.
- Candidate semantic stream: `LOVEDFORGETTRUTHSTRA`.
- Candidate stride stream: `ITERTADMLOGIFEONISCE`.
- Candidate semantic stream: `BETRAYEDFORGETSTRANG`.
- Candidate semantic stream: `TIMESGRIEFFORGETLOVE`.
- Candidate semantic stream: `LOVEDTRUTHGRIEFTHREE`.
- Reversed poem stream: `VNUOTSEMITEERHTTUBEC`.
- Candidate token permutations: `LONDONDERRYNEVERDOIR` and
  `TRUTHTHREENEVERGRIEF`.

## Recorded scoring (as supplied)

| candidate | method | corpus | IoC | chi² | bigram |
| --- | --- | --- | ---: | ---: | ---: |
| `VEMOODTHEYFLASHUPONT` | stream:wordsworth | Gutenb worksheet | 0.1635 | 319.7 | +0.151 |
| `LOVEDFORGETTRUTHSTRA` | semantic-permutation:token-per | legacy | 0.1553 | 472.5 | +0.124 |
| `ITERTADMLOGIFEONISCE` | stream:stride 2 offset 0 | legacy | 0.1587 | 563.8 | +0.121 |
| `BETRAYEDFORGETSTRANG` | semantic-permutation:token-per | worksheet | 0.1559 | 647.6 | +0.119 |
| `TIMESGRIEFFORGETLOVE` | semantic-permutation:token-per | legacy | 0.1563 | 369.3 | +0.115 |
| `LOVEDTRUTHGRIEFTHREE` | semantic-permutation:token-per | worksheet | 0.1619 | 553.8 | +0.108 |
| `VNUOTSEMITEERHTTUBEC` | stream:poem reversed | worksheet | 0.1694 | 359.6 | +0.104 |
| `LONDONDERRYNEVERDOIR` | semantic-permutation:token-per | worksheet/legacy | 0.1466 | 531.7 | +0.103 |
| `TRUTHTHREENEVERGRIEF` | semantic-permutation:token-per | worksheet/legacy | 0.1551 | 325.6 | +0.099 |

**Interpretation:** IoC and chi-square are triage signals, not proof of a
plaintext. Every recipe must preserve the transform, corpus, key variant, and
score so that a result can be independently reproduced.

## Recipe-check requirements

1. Test all three key spellings and reject non-ASCII digits unless the recipe
   explicitly declares a mixed alphanumeric alphabet.
2. Keep `semantic-permutation`, `stream:wordsworth`, `stream:stride`, and
   `stream:poem reversed` as separate recipes; do not collapse them into one
   ambiguous operation.
3. Add round-trip vectors and a negative vector for each candidate.
4. Display IoC, chi-square, and bigram values with the corpus name and mark
   them as candidate ranking only.
5. Keep CyberChef-compatible operation names and exportable recipe JSON beside
   the cipher-machine lecture entry.

No candidate above is promoted to a confirmed historical solution by this note.
