# CyberChef classical-cipher deep dive

This note records the research and implementation contracts for the six additions in
`/apps/cyberchef/`. They are **historical / puzzle ciphers and codes**, not secure
choices for new confidential data. Use the kitchen's authenticated modern encryption
recipes for real protection.

## Selection criteria

The kitchen already covered many common historical systems (Caesar, Vigenère,
Bifid, Trifid, ADFGVX, Enigma, Morse, VIC, Morbit, and Pollux). This pass chose
well-defined gaps that are useful in cipher puzzles and are independently documented:

| Recipe ID | What it adds | Implementation contract |
| --- | --- | --- |
| `adfgx` | The 5×5, letters-only WWI predecessor to ADFGVX | J maps to I; keyed Polybius square; stable duplicate-key sort; irregular final column is reconstructed without invented padding. |
| `fractionatedMorse` | Morse fractionation with keyed ternary trigrams | `x` separates letters and `xx` words; the impossible `xxx` is excluded, leaving 26 trigram positions. |
| `routeTransposition` | Configurable rectangular route cipher | Independent write/read paths: rows, columns, snake rows, snake columns, and clockwise spiral. Blank padding is supported and is not silently added during decrypt. |
| `straddlingCheckerboard` | Compact variable-length numeric code | Eight high-frequency letters use one-digit positions; two configurable row labels introduce two-digit positions for the remaining 18 letters. |
| `runningKey` | Non-repeating Vigenère keystream | The supplied key text must be at least as long as the message's letters. It never falls back to a repeated Vigenère key. |
| `keyedSubstitution` | Auditable monoalphabetic substitution | Builds keyword + remaining A–Z, or accepts an explicit unique 26-letter mapping; punctuation and case survive. |

Two discoverable **Recipe Pack** entries group the additions:

- **Classical Deep Dive — Fractionation & Checkerboards**
- **Classical Deep Dive — Running Keys & Routes**

## Sources and verification vectors

- [Boxentriq's ADFGX guide](https://www.boxentriq.com/ciphers/adfgx-cipher) specifies
a keyed 5×5 square and stable keyword columnar transposition. Its documented example
is preserved in the test suite: `MEET`, square key `KEYWORD`, transposition key `KEY`
produces `AAAGDXAD`.
- [Practical Cryptography's Fractionated Morse guide](http://practicalcryptography.com/ciphers/fractionated-morse-cipher/)
gives the keyed alphabet `ROUNDTABLECFGHIJKMPQSVWXYZ` and the worked result
`DEFEND THE EAST` → `ESOAVVLJRSSTRX`.
- The [American Cryptogram Association sample issue](https://www.cryptogram.org/downloads/SampleCryptogram2022.pdf)
describes writing `SOLVE A GOOD CRYPT TODAY` across five columns and reading vertically,
which yields `SACTOGROLOYDVOPAEDTY`.
- The [ACA cipher-type catalog](https://www.cryptogram.org/resource-area/cipher-types/)
lists Fractionated Morse, checkerboards, route transposition, and running key among
its pencil-and-paper systems. It is useful corroboration that these are distinct
families rather than variants of the existing recipes.

`test/cyberchef-classical-deep-dive.test.ts` loads the actual standalone HTML and
checks these vectors, six recipe registrations, the two packs, and encrypt/decrypt
round trips. That guards against a recipe being added to the UI but not the live
operation registry.
