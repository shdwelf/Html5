# Recipe sourcing, round 4 — Kahn's Figure 2 width page, the 1940 Gronsfeld source, army manuals, and the PGP armoring recipe

Date: 2026-10-14
Kitchen after this round: `public/apps/cyberchef/index.html` → **495 operations**, 219 packs, 642 pack entries
New recipes this round: `pgpArmorCheck` (OpenPGP Radix-64 armor check, CRC-24), `pgpSymDecrypt` (§4b:
OpenPGP symmetric-key decrypt — SKESK + SEIPD, RFC 4880 §13.9 CFB and the §5.13 MDC), and `enigmaChains`
(§5b: the 1932 Polish Enigma indicator-chain analysis, from Churchhouse's two worked examples)
Companion notes: `docs/field-cipher-deep-dive-2026-10-14.md` (field ciphers; §2d and §3a were written
from this round), `docs/cyberchef-sfx-coverage-audit-2026-10-13.md` (registry audit)
Verification: `node --test tests/cyberchef-field-cipher-deep-dive.test.mjs` → 15/15,
`node --test tests/openpgp-armor.test.mjs` → 3/3, `node --test tests/openpgp-sym-decrypt.test.mjs` → 7/7,
`node --test tests/enigma-chains.test.mjs` → 4/4, plus the registry/SFX/cookbook suites,
`node scripts/audit-cyberchef-sfx-coverage.mjs` (495 ops / 219 packs / 642 entries, 0 dangling,
0 orphaned) and `node tools/verify_lecture_hall.mjs` (33 records).

---

## 1. Kahn's Figure 2 width page — the last unread page of the VIC schedule

The standing next step was the page that introduces the second transposition tableau, because the
widths of the two tableaux had only ever been read at second hand. The released text
(*Number One From Moscow*, CIA Studies in Intelligence, at
`https://www.cia.gov/resources/csi/static/Number-One-From-Moscow.pdf`) settles it in one sentence,
and its own key table carries the arithmetic:

| Quantity | Published value | Origin |
| --- | --- | --- |
| Line P | `4062783411` | chain addition of Line H, extended to 50 digits |
| Eighth / ninth numbers | `4` / `1` | read left to right |
| Tableau widths | `13+4 = 17`, `13+1 = 14` | agent's personal number + those two digits |
| Rows annotating the same sum | Line L `13+4=17 (tableau 1)`, Line M `13+1=14 (tableau 2)` | printed beside the rows |
| Line Q / Line R | `96033183664690475` (17 digits) / `30274304287712` (14 digits) | the two breeder keys |
| Line S | `5073894612` | sequential key of P = the checkerboard's header row |

Three points are now pinned by the 14th test in the deep-dive suite:

1. **The two readings of the rule agree.** Kahn hedges — "the eighth and ninth numbers — or perhaps
   the last two dissimilar numbers — in Line P" — because Line P ends `… 1 1`, so the last two
   dissimilar digits *are* the eighth (4) and the ninth (1).
2. **The widths are derived, not chosen.** They are exactly the lengths of the two breeder keys that
   the schedule already produces; nothing in the schedule takes a width as an input.
3. **The 1956 raise is the same arithmetic.** With the personal number changed from 13 to 20
   (Kahn: "so that the width of the transposition tableaux was increased"), the widths become
   `20+4 = 24` and `20+1 = 21` and the breeder keys lengthen to `960331836646904753027430` and
   `428771231408872709558`, while **Line S is unchanged** — the substitution layer is untouched.
   That is the design intent the article states for the change, and it is the reason a 1956-onwards
   message cannot be read with the 1953 widths.

Full write-up: `docs/field-cipher-deep-dive-2026-10-14.md` §2d.

## 2. The Gronsfeld primary source — closed with a 1940 US Army publication

The open thread asked for a primary source for the digit-key convention rather than the generic
"Vigenère with a numeric key". One turned up in an unlikely place: **Captain John V. Grombach,
"The Invisible Weapon", *Infantry Journal*, July–August 1940, pp. 340–344** (archive.org item
`invisible-weapon-grombach`, read as `Invisible Weapon Grombach_djvu.txt`):

> In the Gronsfeld, there is a set of key numbers in a series that can be easily memorized. These
> numbers are written down over the "clear" and repeated as often as necessary. Each letter of the
> "clear" is then represented in the written message by a letter which is the number of letters
> further in the alphabet called for by the key number over it.

That fixes the direction (forward, `p + k mod 26`) in the words of a 1940 staff article — and the
same article recommends "a **reverse** of the Gronsfeld cipher especially adapted for radio", so the
sign is a property of the source, not a matter of taste. The 15th test asserts the forward reading,
the reverse reading, the round trip and the two side conditions (key read as digits only; a
non-letter passes through without consuming a key digit). The article prints no worked example, so
the vector is constructed from its stated rule and labelled as such in the test.

A useful negative from the same round: the 1914 **British War Office *Manual of Cryptography***
(see §5) does **not** use the name Gronsfeld anywhere in its printed contents list, even though it
describes the neighbouring systems (sliding-alphabet, Beaufort, Playfair, Cæsar). The 1940 article
is therefore the better citation for the name and the convention.

## 3. archive.org sweep — Kurt Saxon, the paramilitary manuals, and what a screen can prove

The round asked specifically for Kurt Saxon and for Bond-style army manuals. Results:

| Item | What it actually is | Verdict |
| --- | --- | --- |
| `the-poor-mans-james-bond` (Kurt Saxon, *The Poor Man's James Bond*, 479-page scan, 113 MB PDF) | By its own contents list: "Ultimate Boobytrap", "Full Auto Conversion: AR-15, MARK 1, MIMI-14, STEN GUN", "Fireworks & Explosives Like Granddad Used To Make", "Pyrotechny", "We Shall Fight In The Streets", "Arson By Electronics", "U.S. Marines & Army Hand-to-Hand Combat" | **No cipher material in the contents.** The item's OCR is not indexed for search (`fulltext/inside.php` → "No hOCR or Abbyy file present" on both storage nodes), so a keyword screen would mean reading the whole 1.7 MB text layer; the contents page is enough to rule the volume out for recipes |
| `KurtSaxonPoorMansJamesBondVolume2…5`, `THESURVIVOR1…9`, `the-survivor-06`, `GRANDDADS*`, `the-weaponeer-1984`, `combatsurvivalweapons…fourwindsshotgun` | The same genre — Saxon's and others' improvised-weapons, explosives, survival and DIY series | Screened out as a class for cipher recipes; retained as a primary-artifact set of 1970s–80s American paramilitary publishing |
| `invisible-weapon-grombach` (Infantry Journal, 1940) | A 1940 US Army staff article on radio, espionage and "the invisible weapon" | **The productive hit.** Source of the Gronsfeld statement in §2; its other cipher leads (the grille or "cardan" method, and a "radio adaptation of the Nihilist Bacon biliteral" with its own key square) are recorded as untried |
| FM 31-20 (1965) | Special Forces operational techniques | Already read in round 3; its chapter 9 defers crypto to pre-mission briefings |

Two of the archived "army manual" leads can also be closed as identifications, because the Drive
copies turned out to be them (§5): the file titled "US Army Field Manual of TOP_" is **FM 21-31
*Topographic Symbols* (19 June 1961, with Change 1 of 31 December 1968)** — map symbols,
abbreviations and marginal information — and there is nothing cryptographic in it at all.

## 4. Kleopatra on GitHub, GnuPG, and the new `pgpArmorCheck` recipe

* `KDE/kleopatra` — repository description: "Certificate manager and GUI for OpenPGP and CMS
  cryptography" (last push at the time of the check: 2026-10-13; working tree ≈1.2 GB). It is a Qt
  front end: it drives GnuPG (and CMS/keybox tooling) rather than implementing any primitive, so it
  is not a recipe source by itself. The recipe-bearing layer is GnuPG's own implementation of
  OpenPGP.
* `gpg/gnupg`, `tests/openpgp/` — GnuPG ships ready-made control material that is ideal for this
  purpose: `armor.scm`, `bug1223-good.asc`, `bug894-test.asc`, `bug537-test.data.asc`,
  `4gb-packet.asc`, and ~100 sibling tests. Control vectors that a project tests itself against are
  exactly the artefacts this project's recipe standard requires.
* **The recipe.** `pgpArmorCheck` — *OpenPGP Radix-64 armor check (CRC-24)*, category Modern, two
  modes: **Armor** reads a `-----BEGIN PGP …` block, decodes the payload and compares the 24-bit CRC
  with the printed `=XXXX` line; **Data** computes the same value for text, hex or base64 input and
  prints the line a writer would append. The CRC is polynomial `0x1864CFB`, initial value
  `0xB704CE`, no final inversion, re-encoded in Radix-64 (RFC 4880 §6.1).
* **The control vector.** `tests/openpgp/bug1223-good.asc`: 592-byte packet stream, printed checksum
  `=xsEd`, computed `0xC6C11D` — verified by an independent implementation before the recipe was
  written, then asserted in `tests/openpgp-armor.test.mjs` (3 tests: the published vector, the
  negative vectors — one damaged payload character, a block with no CRC line, a non-armored input —
  and Data mode, including the empty input's `=twTO`).
* **Counters.** 492 → 493 operations. Badge, Cookbook card, README and the three registry tests were
  moved together, and the recipe ships in its own pack, `OpenPGP Armor (Kleopatra / GnuPG)`: 216 → 217 packs,
  639 → 640 pack entries.

Not done, and not claimed: no Kleopatra source was read for algorithm content (it has none), and the
OpenPGP CFB variant with resynchronization (RFC 4880 §13.9) was still an unverified lead when this
section was written — §4b below closes it, and corrects its description against the vector. An armor checksum is integrity only — it is not a MAC and says
nothing about who wrote a block.

## 4b. The OpenPGP CFB resynchronization variant, controlled — the `pgpSymDecrypt` recipe

§4 closed with RFC 4880 §13.9 recorded as a lead and explicitly *not* verified. This pass verified it
against the artefact the GnuPG project tests itself with — and the verification overturned the
one-line description the lead carried.

* **The records.** `tests/openpgp/samplemsgs/enc-sym-cfb-1.asc` and `enc-sym-cfb-2.asc` in `gpg/gnupg`,
  the repository that supplied the armor vector in §4. Each file is the same payload, `"Hello, world!\n"`,
  under the same passphrase `password` — once with AES-128, once with AES-256 — and each carries its own
  `=XXXX` armor CRC line, so the two recipes check one another.
* **The packets.** Both are `SKESK` v4 (tag 3, 13 octets: version 4, cipher id, S2K type 3, hash id 2,
  8-octet salt, count byte, and **no** encrypted session key) followed by `SEIPD` v1 (tag 18, 63 octets =
  version byte + 62 octets of CFB ciphertext). The count byte is `0xED`, i.e. (16 + 13) << (14 + 6) =
  **30,408,704 octets** hashed per digest round: this is a 30 MB string-to-key, and the reason the page
  needed a streaming SHA-1 instead of one WebCrypto call over a materialised buffer.
* **What §13.9 actually is.** The lead's description — "a feedback register reloaded with the two extra
  octets at BS+2" — does not survive the vector. The ciphertext decomposes one way only: **CFB with a
  128-bit feedback register and a zero IV**, keystream block *k* covering ciphertext octets 16*k*…16*k*+15,
  i.e. plain CFB over the whole encrypted-packet stream. The two extra octets are not a separate feedback
  step at all: the sender's plaintext *prefix* is BS+2 octets long and its last two octets **repeat the two
  before them** — `… 8a 65 b4 | 65 b4` in the AES-128 message, `… 78 04 | 78 04` in the AES-256 one. A
  receiver that reads 16 octets, decrypts the pair at 17–18 and checks that repetition *has* performed the
  resynchronization. The shift-two alternative (reload the register with the 16 octets ending at the pair)
  was implemented first, and the vector killed it: the decrypted stream then fails to parse as a packet.
  Both messages decrypt to a well-formed literal-data packet (tag 11, format `b`, no filename, stored
  2022-11-02T14:01:58Z and 14:02:13Z) whose 14-octet payload is `Hello, world!\n` — the same 62 octets
  pin the CFB chain, the S2K counter and the MDC at once.
* **The MDC of §5.13.** The last 22 octets are the MDC packet's `D3 14` tag/length pair and a 20-octet
  SHA-1. The hash covers **every plaintext octet that precedes the hash** — the 18-octet prefix, the inner
  literal packet, and the `D3 14` pair itself (42 octets in these messages). The pair is therefore inside
  the hashed stream, not prepended to the hash input; a search over the candidate inputs (prefix in,
  prefix out, `D3 14` first, `D3 14` last, hash-then-pair) leaves exactly one survivor, and it verifies
  both messages. Session keys, for the record: AES-128 `4427a90b…352b33`, AES-256
  `c6f7e952…c15002c`.
* **The recipe.** `pgpSymDecrypt` — *OpenPGP symmetric-key decrypt (SKESK + SEIPD)*, category Modern, one
  passphrase argument, armored or raw (hex/base64) input. It reports the packets, the cipher and its
  feedback size, the S2K parameters and digest rounds, the derived session key, the prefix with the §13.9
  pair check, the inner packet, the MDC verdict and the payload. It refuses, by name, the forms it does
  not implement: public-key messages (PKESK, tag 1), the §5.3 SKESK *with* an encrypted session key, AEAD
  Encrypted Data (tag 20, RFC 9580), S2K types other than 3, and hash ids other than SHA-1/SHA-256. The
  in-page SHA-1 and SHA-256 cores are checked against the FIPS 180-4 vectors (`""`, `abc`, the 448-bit
  block) and against node's `crypto` across twelve lengths straddling the 55/56/63/64-octet padding
  boundaries; `tests/openpgp-sym-decrypt.test.mjs` (7 tests) carries the two GnuPG vectors, the refusal
  cases drawn from the same sample set (`enc-1-key-1.asc`, `enc-sym-ocb-1.asc`), a one-character
  corruption of the armor, and a wrong passphrase — which is **reported** (failed prefix check, failed
  MDC), never returned as plaintext noise.
* **Counters.** 493 → 494 operations, 217 → 218 packs, 640 → 641 pack entries; badge, Cookbook card,
  README, the three registry tests and the two notes moved together.

## 5. The books added to the Drive on 2026-10-14 — first pass

| File (Drive, External Sources) | Identification | Use |
| --- | --- | --- |
| `Manual of Cryptography (Bri…` (5.88 MB) | **British War Office, *Manual of Cryptography* (c. 1914)**, Aegean Park Press reprint, ISBN 0-89412-042-5 | **Opened.** Contents captured — the backlog in the table below |
| `Manual of cryptography (Sac…` (15.4 MB) | **Sacco, *Manual of Cryptography***, Aegean 1977 edition = archive.org `manualofcryptogr0000sacc` (lending-restricted) | Lead. Friedman's 1951 translation notes for Sacco are a separate, unrestricted archive.org item, `41747279078647` |
| `US Army Field Manual of TOP_…` (3.69 MB) | **FM 21-31 *Topographic Symbols*** (1961, + Change 1, 31 Dec 1968), I.L. Holdridge digital edition 1999 | Screened out: map symbols, no ciphers |
| `The Cold War Spy Pocket Man…` (1.35 MB) | **Philip Parker (comp.), *The Cold War Spy Pocket Manual*** (Pool of London Press, 2015) | Screened: operational training, organization, the atom spies and Penkovsky, active measures, Berlin, suspect agents — and a **"Code and Cipher-Breaking Challenge"** chapter at the end. Kept as a lead; a challenge is only a control vector if the answer set is published, which this pass did not establish |
| `The Codebreakers – The Comp…` (epub, 9.96 MB) | Kahn, *The Codebreakers* | Narrative history and provenance; no matrices to control against |
| `Codes and Ciphers (Robert C_…)` (1.42 MB) | **R. F. Churchhouse, *Codes and Ciphers: Julius Caesar, the Enigma and the internet*** (CUP, 2004) | **Opened and mined — it produced the vector in §5b.** Caesar and simple substitution, Vigenère with indicators and depths, letter frequencies, "how many letters to solve", transposition, Playfair, codes, spy ciphers and one-time pads, random numbers, Enigma, the Hagelin, the SZ42, RSA, DES and elliptic curves. Its chapter 9 worked examples (pp. 125–126) are printed with their answers, and became the `enigmaChains` recipe; the rest of the classical material is what the kitchen already controls, so it stays a citable secondary source. |
| `Codebook A – Top Secret…` (7.51 MB) | Open Court classroom reader (La Salle, Ill.; archive.org `codebookatopsecrO000mich`) | **Opened.** Reading selections for school use, no cipher systems. Screened out |
| `Codebook E` (15.02 MB) | M. V. Jacobson phonics workbook (Lippincott, 1975) | **Opened.** Phonics/phonetic reading exercises. Screened out |
| `field_manual.pdf` (5.08 MB) | Unidentified scan | **Opened, unusable.** Extraction returns empty on a 5,080,687-byte image-only scan and this environment has no OCR: the file is excluded rather than guessed at |
| `Attacking trigonometry prob…` (10.27 MB) | **David S. Kahn, *Attacking Trigonometry Problems*** (Dover, 2015) | **Opened.** A trigonometry workbook; the author shares a surname with the cryptologist and nothing else. No cipher material. Screened out |
| `The Codebreakers` (epub, 9.96 MB) | Kahn, *The Codebreakers* | **Blocked by the environment.** The connector extracts PDF/DOCX/XLSX/text only, and a 9.96 MB `application/epub+zip` cannot be pulled through the file tools (its raw download would return ~13 MB of base64). Recorded as unread — and its well-known content (Hagelin's C-series, the Black Chamber, radio intercept) offers narrative, not matrices |
| `2022 St. Croix Pocket Map` (12.18 MB) | Tourist map | Unrelated to ciphers; the survey of the batch is otherwise complete |

**The Drive itself is now enumerated end to end** (four pages, 171 items). Whatever the earlier request
hoped to find there, no Schneier, Singh, *Pragmatic Programmer* or O'Reilly files are present, so that
channel has no further material to mine; the cipher-relevant items are the ones named in this table plus
the two manuals and the pocket manual already recorded above.

**The 1914 War Office manual's own contents page is the most valuable thing in the batch**, because
each name is a system with a page number attached — one extraction away from a worksheet:

* Chapter III(a) transposition: Hebrew transposition cipher, zigzag cipher, permutation cipher,
  Nihilists' cipher, Federal Army cipher (A).
* Chapter III(b) substitution: Cæsar's cipher, Wolseley or Sudan cipher, sliding-alphabet cipher,
  Beaufort cipher, Playfair cipher.
* Chapter V, systems not described in chapter III: diagonal transposition cipher, stencil cipher,
  Federal Army cipher (B), double slide figure cipher or code, Bacon's cipher, vowel cipher,
  Napoleon's cipher or *tableau de Porta*, Wheatstone's cryptograph, Marmont's figure cipher or code,
  the Masonic cipher, Schotti's dot cipher, line cipher.
* Front matter, "List of works consulted": Fleissner von Wostrowitz 1881, Kerckhoffs 1883,
  Josse 1885, Viaris 1888, Valério 1893, Delastelle 1902.

Bibliographic caution: the scan credit prints `archive.org/details/manualofcryptogrO00Obrit`, which
does **not** resolve through the Internet Archive search API; the only identifier matching
`manualofcryptogr*` there is `manualofcryptogr0000sacc`, which is Sacco's manual, not the British
one. The citation of record for the British manual is therefore the Drive copy's own front matter
(War Office, c. 1914, B364/20, H&S 1139wo) with the Aegean reprint ISBN.


## 5b. Churchhouse mined for a vector — the Enigma indicator chains

§5's batch held one file with real cipher content, and it paid: the book prints **worked examples with
their answers**, which is the control-vector standard this project uses. Chapter 9 ("The indicator chains
in the Enigma", pp. 125–126) carries the 1932 Polish pairing analysis in two of them.

* **Example 9.1 (mini-Enigma).** Twelve doublets — `AK BL CI DD EB FG GE HH IA JC KJ LF` — from
  enciphering the letter-pairs AA…LL at a common ground setting on a 12-letter Enigma-type machine. The
  book states the result in words: "two chains of 5 different letters and two chains of just 1 letter",
  printing `AKJCI`, `BLFGE`, `DD` and `HH`.
* **Example 9.2 (data from an actual Enigma).** Twenty-six doublets, "sorted by the first letter of the
  enciphered indicator": `AB BQ CD DK EZ FF GH HC IR JT KS LP ML NU OO PI QN RA SJ TV UM VY WX XW YG ZE`.
  Two chains are printed — `ABQNUMLPIR` and `CDKSJTVYGH`, "both of length 10". Under the same rule the
  remaining six doublets close out as `EZ`, `WX` and the fixed points `FF`, `OO`, so the chain-length
  multiset is 10, 10, 2, 2, 1, 1: every length occurs an even number of times, which *is* the Polish
  property the chapter describes. (The two printed chains were verified by hand against the printed
  doublets before any code was written; the remaining four fall out of the same rule.)

**The recipe.** `enigmaChains` — *Enigma indicator chains (Polish pairing analysis)*, category Classical.
It reads doublets (space- or line-separated, or a continuous run of letters in text mode), joins them
where the second letter of one is the first letter of the next, stops when a letter repeats, and reports
each chain with its length, whether it closes or dead-ends, how it closes, the length multiset with the
pairing verdict, and the structure counts. An odd-length input is refused rather than silently shifted.
`tests/enigma-chains.test.mjs` (4 tests) pins both book examples, the continuous-input path, the refusal
cases, and a deliberately partial batch — dropping one fixed point from Example 9.1 leaves lengths
5, 5, 1, and the report says the property fails, because a partial or corrupted batch is exactly when
reading a false pairing out of the data would be the expensive mistake.

**Counters.** 494 → 495 operations, 218 → 219 packs, 641 → 642 pack entries, the recipe shipping in its
own pack, `Enigma Indicator Chains (Polish, 1932)`.

**Why the book is not mined further.** Its contents page names Caesar and simple substitution, Vigenère
with indicators and depths, transposition, Playfair, codes, book ciphers and one-time pads, random-number
generation, Enigma, the Hagelin, the SZ42, RSA, DES and elliptic curves. The kitchen already controls the
classical set, Enigma, the one-time pad and the modern primitives; a Hagelin recipe would need chapter 10's
cage and wheel example read out of a text layer that has lost most of its spaces, which the connector's
extraction and its fixed windows both work against. It stays a lead rather than half-done.

## 6. The two surfaces this round touched besides the kitchen

* **Virtual Intelligence Lecture Hall** (inside the cipher-machine suite,
  `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html`). The floating 2026-10-05 update
  card — its `#lecture-hall-update` style block, `<aside>` and 50-choice dice script — was removed
  from the top of the app, so the suite opens straight into its navigation. The hall itself now
  holds **33 records**: the width page above is filed as `kahn-figure-2-widths`, and the dead
  cryptome URL in the neighbouring hollow-nickel record was repointed at the live CIA copy. The
  harness (`node tools/verify_lecture_hall.mjs`) asserts the new count, the raised bar for the new
  record (≥8 facts, ≥4 links, summary and caution ≥200 characters, no asserted answer) and the
  record's cross-checks against the deep-dive test file.
* **wiki-in-a-jar** (`tools/wikiinajar/`). The offline wiki now ships the newest nine dated notes
  from `docs/` as wiki pages, generated by `tools/wikiinajar/sync-docs.mjs` and listed in
  `wiki-pages.json`; `--check` regenerates each page from its note and fails if the two have drifted,
  and `tests/wikiinajar-docs-sync.test.mjs` runs that check. This note and the updated deep-dive
  note are both in the set after the round's re-sync.

## 7. Ledger — what this round closed, and what is still open

Closed:

* **Kahn's Figure 2 width page** — the standing next step; §2d above, test 14, including the 1956
  personal-number change and the invariance of Line S.
* **A Gronsfeld primary source** (ledger item 5) — §2 and §3a above, test 15.
* **A VIC vector carrying both transpositions and a keygroup** (ledger item 4) — satisfied by the
  hollow-nickel message in `docs/field-cipher-deep-dive-2026-10-14.md` §2c (round 3); this round
  added the missing derivational page, so the vector no longer depends on an unread width rule.
* **The OpenPGP CFB resynchronization variant** (RFC 4880 §13.9), recorded in §4 as the next PGP-side
  lead — closed in §4b, and the lead's own description corrected by the vector.
* **The 2026-10-14 Drive additions** (§5) — all four cipher-adjacent files opened, identified and
  either used or excluded for a recorded reason, and the Drive enumerated end to end (171 items).
* **Churchhouse's *Codes and Ciphers*** (§5b) — mined, and it produced a recipe: chapter 9's two worked
  indicator-chain examples are now `enigmaChains`, controlled by the book's own printed chains.

Still open:

* **The Cold War Spy Pocket Manual's "Code and Cipher-Breaking Challenge."** The chapter is the last
  one before the sources list, and no answer set is printed with it in the table of contents; a search
  of the web — the Washington Post review, the publisher's page, the MI6-HQ review — turns up the
  challenge being praised as unsolved-by-the-reviewer and nothing more. A challenge without a published
  answer cannot be a control vector, so it stays a lead, not a recipe.
* **Diana pad provenance** (ledger item 1) — no surviving pad-book scan; the 24-vs-26 letter alphabet
  question stands.
* **Diana + columnar transposition variant** (ledger item 2) — waiting on a published worked example.
* **The Russian checkerboard** (ledger item 3) — 40-cell Cyrillic board with its signs and the
  "message starts" marker; would allow end-to-end encipherment of the nickel message.
* **SECOM/Crow** (ledger item 6) — still no published plaintext; `tools/crow_letter_count_bounds.py`
  remains the falsifier for any letter-count claim.

Leads that remain, and the one that is closed by the environment rather than by evidence:

* the 1914 War Office manual's cipher backlog (§5), starting with the zigzag and Nihilists' ciphers;
* a Hagelin machine recipe from Churchhouse chapter 10, if a copy with a usable text layer turns up —
  the chapter's cage/wheel example is the vector, but the extraction available here has lost its spaces;
* Friedman's 1951 translation notes on Sacco, and the 1971 edition of FM 31-20;
* `The Codebreakers` in this Drive is an epub, which the Drive connector cannot extract and the file
  tools cannot fetch without turning it into ~13 MB of inline base64. If a PDF or text copy is ever
  added to the Drive, the book becomes readable there; nothing else about it is blocked.
