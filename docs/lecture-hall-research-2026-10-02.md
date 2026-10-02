# Intelligence Lecture Hall — museums, Crow and the Enigma hypothesis, 2026-10-02

This pass adds four source-graded records to the Cipher Machines & Cryptology
suite (26 → 30 records), three reproducible CyberChef operations (366 → 369),
and a regression test. The central distinction is **artifact, catalog claim,
implementation and hypothesis**: none may stand in for another.

## 1. KGB Espionage Museum auction catalog

The authoritative sale record is Julien’s closed catalog #370 / auction #3292,
*The Cold War Relics Auction Featuring The KGB Espionage Museum Collection*,
closed 13 February 2021:

- <https://bid.juliensauctions.com/auctions/catalog/id/370>
- Lot-number cross-check: <https://auctiondaily.com/news/kgb-artifacts-come-to-auction-raising-intrigue-and-concerns/>
- Independent Fialka catalog: <https://www.sothebys.com/en/auctions/ecatalogue/2018/history-of-science-technology-n09886/lot.43.html>

### Findings

- Contemporary counts refer to different units: the Manhattan museum displayed
  more than 3,500 objects, while the auction offered hundreds of lots. A lot can
  contain several objects and the catalog also contains non-KGB categories.
- The Fialka M-125-3M is **lot 343**, estimated at $8,000–$12,000 and reported
  sold for $22,400. It is a ten-rotor Soviet/Warsaw Pact machine. “Russian
  Enigma” is an analogy, not a model name; it was not a device for decrypting
  German Enigma traffic.
- Camera-bearing ring, tie and purse are lots 128, 142 and 147. Lot numbers are
  stronger research handles than unattributed press photographs.
- Auction descriptions establish what a seller represented, the estimate and
  the sale result. They do not, without supporting provenance, authenticate
  operational KGB use. The museum and sale both contained replicas.

## 2. International Spy Museum machine trail

The museum’s own Code/Cipher Machine filter returns six highlighted objects:
Four Rotor Enigma, M-94, Kryha, M-138-A, Enigma Machine 3 and North Korean code
tables.

- Collection filter: <https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/?filters%5Btype%5D=code-cipher-machine>
- Four-rotor object: <https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/four-rotor-enigma-machine/>
- M-94: <https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/m-94-cipher-device-2/>

The museum’s four-rotor object is dated 1943–1944, bears Japanese characters and
is labeled as German-built for Japan. That object history must not be generalized
to every M4. Technically, Kriegsmarine M4 adds a **stationary Beta or Gamma
Greek wheel** and thin B/C reflector to the three-wheel stepping train. It is not
four ordinary rotors all stepping.

`enigmaM4` now models this directly. Its positive control is useful: Beta at A,
ring A, plus thin-B is electrically equivalent to wide UKW-B, so I-II-III,
rings/starts AAAA and plaintext `AAAAA` produce the familiar `BDZGO`.

## 3. The Crow’s Cryptogram

Primary challenge page:
<https://www.ciphermachinesandcryptology.com/en/crow.htm>

The page prints 600 digits in 120 groups and says only that the plaintext is
English and a secret phrase was used. Its typographic clue is unusually strong:

> They **SE**e and **COM**e

This spells **SECOM**, the manual system documented on the same site:
<https://www.ciphermachinesandcryptology.com/en/secom.htm>.

SECOM consumes the first **20 letters**, not the first 20 words, of its phrase.
It sequences two ten-letter halves, adds without carry, generates 50 *new* chain
digits, builds an extended checkerboard and performs ordinary plus triangular
disrupted transpositions.

The hint text plausibly points to Phil Coulter’s 1973 Derry song *The Town I
Loved So Well*. Its title has only 19 letters after spaces are removed, so it is
not itself a valid unchanged SECOM phrase. The opening lyric gives a testable
candidate:

```text
IN MY MEMORY I WILL ALWAYS SEE
INMYMEMORYIWILLALWAY   (first 20 letters)
```

This is **not a claimed solve**. The source publishes no accepted plaintext or
key, although it lists Oleksii Sylichenko (2023) and Daisuke Kondo (2026). The
new `secomSchedule` recipe exposes the exact schedule for testing candidates;
it intentionally does not use the suite’s older row-rotation teaching model as
proof of a real disrupted-transposition solve. Confirmation requires exact
re-encryption of all 600 digits.

## 4. The “20 words from the poem” question

That clue belongs to a different documented system: the Dutch Ordedienst poem
code described by Crypto Museum:
<https://www.cryptomuseum.com/crypto/od/poem/index.htm>.

Its shared poem begins with 20 agreed words. The worked example selects words at
positions 2, 6, 11 and 15 (`ONZE WAS ZIEN ALLE`), concatenates them as the
columnar key, and combines the right-aligned positions with secret `58265` to
produce indicator `EJHQT` and check group `OTRGJ`. `odPoemKey` reproduces those
values and keeps the exact poem/version visible as key material.

## 5. Kryptos misspellings are not yet an Enigma key sheet

The auditable anomalies include `IQLUSION`, `UNDERGRUUND`, `DESPARATLY`, the
Morse slab’s odd `DIGETAL…`, and a later-confirmed omitted S in K2. They do not,
by themselves, supply the required machine fields.

An M3 proposal needs rotor order, three ring settings, three start positions,
reflector and reciprocal plugboard. M4 additionally needs Beta/Gamma, four rings
and starts, and thin B/C. “Bright” is not an Enigma setting, despite its
lampboard; Morse is normally a transport encoding, not a plugboard schedule.
Wrong→right typo pairs can be investigated, but they are not evidence until a
rule fixed in advance yields disjoint reciprocal pairs and passes all positioned
K4 cribs.

The new lecture record therefore marks the result as a **negative finding**, not
an impossibility proof. Any future proposal must publish a complete deterministic
setup, preprocessing convention, all crib matches and a full round trip without
manual corrections.

## 6. Verification

```bash
node tools/verify_lecture_hall.mjs
npx vitest run \
  test/cyberchef-classical-deep-dive.test.ts \
  test/cyberchef-matrix-deep-dive.test.ts \
  test/cyberchef-field-museum.test.ts
```

The tests check M4’s M3-equivalence control and reciprocity, the official SECOM
worked schedule (`7162830495`, `3728109645`, `0880939030`, checker
`8139065427`), and the OD indicator/check pair (`EJHQT` / `OTRGJ`).
