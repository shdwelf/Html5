# CyberChef matrix-cipher deep dive

This note records the research and implementation contracts for the six additions in
`/apps/cyberchef/` (packs **Matrix Deep Dive — Hill, Two-Square & Phillips** and
**Matrix Deep Dive — Columnar, Myszkowski & Grilles**). All are **matrix-based**
classical systems — the message is embedded in one or more grids/squares/matrices —
and all are historical/puzzle ciphers, not protection for real data.

Companion to `docs/cyberchef-classical-cipher-deep-dive.md` (fractionation pass).

## Selection criteria

The kitchen already carried several matrix-flavoured systems: Playfair, a 2×2 Hill,
four-square, Bifid/Trifid, Polybius, ADFGX/ADFGVX, Nihilist, the straddling
checkerboard, columnar and route transpositions, AMSCO, and the tap/knock codes.
This pass fills the remaining well-documented matrix families:

| Recipe ID | What it adds | Implementation contract |
| --- | --- | --- |
| `hill3` | True linear-algebra cipher over ℤ/26 (Lester Hill 1929/1931) | Key = 9 letters read row-major into K; C = K·P (mod 26) on letter trigrams; pads `X`; decrypt inverts K via adjugate × det⁻¹ and refuses non-invertible keys (det must be coprime to 26 = 2·13). |
| `twoSquare` | Delastelle's *damiers bigrammatiques réduits* (1901) in **both** documented conventions | Horizontal (ACA): corners read from the *crossed* squares, same-row digraphs reverse verbatim; dedicated decrypt (mirror lookup). Vertical (Wikipedia): corners stay in each letter's own square, same-column digraphs pass through identical — the whole rule is an involution. Alphabet can merge J→I (ACA) or omit Q (Wikipedia). |
| `doubleColumn` | Two chained irregular keyed columnar transpositions | Same irregular fill as the published example (short final row, no invented padding); decrypt reverses key₂ then key₁. Keys ≥ 2 letters. |
| `myszkowski` | Myszkowski's 1902 variant for keys with repeated letters | Repeated key letters get one shared number (TOMATO → 432143); unique-number columns read downward, repeated numbers read left-to-right across all their columns; irregular grid, no padding. |
| `turningGrille` | Fleissner rotating perforated square (German WWI Drehgitter) | Hole positions numbered row-major from the base orientation (exactly how the ACA sheets report grilles in the sols); every cell must be exposed exactly once across the four rotations; even n ⇒ n²/4 holes over all cells, odd n ⇒ (n²−1)/4 holes and the centre cell stays empty; blocks of a full square, `X` padding on encrypt, clockwise or anticlockwise. |
| `phillips` | British WWI Phillips: eight row-shifted 5×5 matrices, period 40 | Squares #2–#5 step row 1 down one row per square from #1; #6–#8 then step row 2 down from #5; each square enciphers 5 letters as the diagonal down-right wrap; optional explicit 25-letter square overrides the keyword build. |

Two discoverable **Recipe Pack** entries group the additions (see above).

## Sources and verification vectors

- **Hill (3×3)** — [Wikipedia, Hill cipher](https://en.wikipedia.org/wiki/Hill_cipher):
  key `GYBNQKURP` (= rows 6 24 1 / 13 16 10 / 20 17 15) gives `ACT → POH` and
  `CAT → FIN`, and documents the inverse matrix `IFKVIVVMI`; the recipe reproduces
  that inverse exactly, and `POH` decrypts back to `ACT`.
- **Two-square (vertical)** — [Wikipedia, Two-square cipher](https://en.wikipedia.org/wiki/Two-square_cipher):
  square keys `EXAMPLE` / `KEYWORD`, *Q omitted*,
  `he lp me ob iw an ke no bi → HE DL XW SD JY AN HO TK DG`, including the
  same-column transparency (`HE`, `AN`).
- **Two-square (horizontal)** — [ACA TWO-SQUARE sheet (PDF)](https://www.cryptogram.org/downloads/aca.info/ciphers/TwoSquare.pdf):
  squares `DIALO…` / `BIOGR…` (keywords `DIALOGUE` / `BIOGRAPHY`, I/J merged):
  `another digraphic setupx → IR RT EH MK GI ME QG RU NM MZ SV`; every pair was
  re-checked by hand against the cross-square corner rule, the same-row reversal
  (`he → EH`, `ig → GI`) and the decryption mirror. [dcode's Two-square page](https://www.dcode.fr/two-square-cipher)
  documents the identical convention ("if the letters are on the same line, reverse
  them") and served as a second corroboration.
- **Double columnar** — [Wikipedia, Transposition cipher](https://en.wikipedia.org/wiki/Transposition_cipher):
  the irregular first pass (`ZEBRAS`, `WEAREDISCOVEREDFLEEATONCE →
  EVLNACDTESEAROFODEECWIREE`) re-encrypted with `STRIPE` gives
  `CAEENSOIAEDRLEFWEDREEVTOC` (printed as `CAEEN SOIAE DRLEF WEDRE EVTOC`).
  Same article documents Übchi, SOE/OSS/NKVD field use.
- **Myszkowski** — [Wikipedia, Transposition cipher § Myszkowski](https://en.wikipedia.org/wiki/Transposition_cipher#Myszkowski_transposition):
  key `TOMATO` → labels `432143`, giving `ROFOA CDTED SEEEA CWEIV RLENE`
  (`ROFOACDTEDSEEEACWEIVRLENE`). Independently confirmed by the
  [ACA MYSZKOWSKI sheet (PDF)](https://www.cryptogram.org/downloads/aca.info/ciphers/Myszkowski.pdf):
  key `BANANA` over its 89-letter sample reproduces the printed ciphertext
  (`NOPEE OUNRI … EFYFO POTM`) byte-exactly.
- **Turning grille** — [ACA GRILLE sheet (PDF)](https://www.cryptogram.org/downloads/aca.info/ciphers/Grille.pdf):
  4×4 grille reported as `1 8 10 12`, clockwise, `the turning grille →
  TILUNRGHGELTENIR` — reproduced exactly inside the kitchen. A second independent
  vector comes from [The Black Chamber grille walkthrough](https://theblackchamber552383191.wordpress.com/2020/11/18/grille-transposition/):
  6×6 holes `3 6 10 21 24 26 28 32 35` (the default key) decrypt the ordered
  alphabet block `ABCD…9` to `CFJUXZ158 GHORTWY69 BEIKMP047 ADLNQSV23`; encryption
  returns the alphabet exactly. Rotation direction, write-order and take-off order
  match both sources.
- **Phillips** — [ACA PHILLIPS sheet (PDF)](https://www.cryptogram.org/downloads/aca.info/ciphers/Phillips.pdf):
  square `DIAGO/CBSLN/EFHKM/UTRQP/VWXYZ`; the 81-letter self-describing message
  ("Squares one and five are actually the same as are squares two and eight…")
  encrypts to `KZWLY TGEDT QETAR BTYGT LFXWL PPOXL TYKUT KGKYT KZWLY TGXSE
  QETIR ZQAAQ TCITY KPPVB LHEFH GREYX O` — reproduced in full. The ACA note checks
  out mathematically: squares #5 and #8 are cyclic row shifts of #1 and #2, and a
  cyclic row shift preserves the diagonal-down-right map, so only six of the eight
  squares are distinct. Cross-checked with the
  [CryptoCrack Phillips description](https://sites.google.com/site/cryptocrackprogram/user-guide/cipher-types/substitution/phillips)
  (same construction, key `PATIENCE`) and the
  [CWU Kryptos-challenge Phillips worksheet (PDF)](https://www.cwu.edu/academics/math/_documents/kryptos-challenges/cwu-kryptos-challenge-phillips-cipher.pdf):
  key `COMPETE` reproduces its first 40 letters exactly
  (`SQUARESONEANDFIVEARETHESAMEANDSOARETWOAN → ZXVIYGZIWGIWLGPAVIPVHRTZIKGRWUFIXDGOBIMW`).

## Discrepancies found during the source check

Noted so future passes don't "fix" intentional conventions:

- Wikipedia's two-square matrix **omits Q** and keeps `I` and `J` separate, while
  ACA puzzles and dcode **merge I/J** — the recipe exposes both so each documented
  vector reproduces byte-exactly.
- The horizontal (ACA) and vertical (Wikipedia) two-square are *not* the same rule
  rotated: the horizontal reads corners from the crossed squares (and needs a
  distinct decrypt pass), while the vertical keeps each digraph's letters in their
  own square, making encrypt its own decrypt. Both are offered; horizontal is the
  default as in the ACA sheets.
- The CWU classroom worksheet's ciphertext tail (`…LTWQRO`) is inconsistent with
  its own square construction for the last group (verified letter-by-letter); the
  first 40 letters are used as the vector. The ACA Phillips sheet, by contrast, is
  internally exact for all 81 letters.
- The ACA Grille sheet's note "reported in the sols as 1 8 10 12" initially looks
  like a typo against the printed 4×4 pattern — it is not a typo: hole 12 is the
  third-row fourth-column cell and reproduces the printed ciphertext.
- A Wikipedia Hill key is only *decryptable* when its determinant is coprime to
  26 (e.g. `GYBNQKURP`, det ≡ 25 ✓). The existing 2×2 `hill` op only checks this
  on decrypt; `hill3` encrypts with any key but refuses to decrypt singular keys.

## Test coverage

`test/cyberchef-matrix-deep-dive.test.ts` loads the standalone HTML and asserts the
six registrations, the two packs, the 366-recipe banner, every documented vector
above (both directions where the source documents the inverse), grille-hole
validation errors, a non-invertible Hill key error, and encrypt/decrypt round
trips. Run with `npx vitest run test/cyberchef-matrix-deep-dive.test.ts`.
