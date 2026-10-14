# Recipe sourcing, round 4 — Kahn's Figure 2 width page, the 1940 Gronsfeld source, army manuals, and the PGP armoring recipe

Date: 2026-10-14
Kitchen after this round: `public/apps/cyberchef/index.html` → **493 operations**, 217 packs, 640 pack entries
New recipe this round: `pgpArmorCheck` (OpenPGP Radix-64 armor check, CRC-24)
Companion notes: `docs/field-cipher-deep-dive-2026-10-14.md` (field ciphers; §2d and §3a were written
from this round), `docs/cyberchef-sfx-coverage-audit-2026-10-13.md` (registry audit)
Verification: `node --test tests/cyberchef-field-cipher-deep-dive.test.mjs` → 15/15,
`node --test tests/openpgp-armor.test.mjs` → 3/3, plus the registry/SFX/cookbook suites and
`node scripts/audit-cyberchef-sfx-coverage.mjs`.

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
OpenPGP CFB variant with resynchronization (RFC 4880 §13.9) is recorded as a lead but was **not**
verified against a vector this round. An armor checksum is integrity only — it is not a MAC and says
nothing about who wrote a block.

## 5. The books added to the Drive on 2026-10-14 — first pass

| File (Drive, External Sources) | Identification | Use |
| --- | --- | --- |
| `Manual of Cryptography (Bri…` (5.88 MB) | **British War Office, *Manual of Cryptography* (c. 1914)**, Aegean Park Press reprint, ISBN 0-89412-042-5 | **Opened.** Contents captured — the backlog in the table below |
| `Manual of cryptography (Sac…` (15.4 MB) | **Sacco, *Manual of Cryptography***, Aegean 1977 edition = archive.org `manualofcryptogr0000sacc` (lending-restricted) | Lead. Friedman's 1951 translation notes for Sacco are a separate, unrestricted archive.org item, `41747279078647` |
| `US Army Field Manual of TOP_…` (3.69 MB) | **FM 21-31 *Topographic Symbols*** (1961, + Change 1, 31 Dec 1968), I.L. Holdridge digital edition 1999 | Screened out: map symbols, no ciphers |
| `The Cold War Spy Pocket Man…` (1.35 MB) | **Philip Parker (comp.), *The Cold War Spy Pocket Manual*** (Pool of London Press, 2015) | Screened: operational training, organization, the atom spies and Penkovsky, active measures, Berlin, suspect agents — and a **"Code and Cipher-Breaking Challenge"** chapter at the end. Kept as a lead; a challenge is only a control vector if the answer set is published, which this pass did not establish |
| `The Codebreakers – The Comp…` (epub, 9.96 MB) | Kahn, *The Codebreakers* | Narrative history and provenance; no matrices to control against |
| `Codes and Ciphers (Robert C_…)`, `Codebook A/E`, `field_manual.pdf`, `Attacking trigonometry prob…`, `2022 St. Croix Pocket Map` | Not yet opened (four cipher-adjacent, one unrelated map) | Next pass |

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


## 7. The two surfaces this round touched besides the kitchen

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

## 6. Ledger — what this round closed, and what is still open

Closed:

* **Kahn's Figure 2 width page** — the standing next step; §2d above, test 14, including the 1956
  personal-number change and the invariance of Line S.
* **A Gronsfeld primary source** (ledger item 5) — §2 and §3a above, test 15.
* **A VIC vector carrying both transpositions and a keygroup** (ledger item 4) — satisfied by the
  hollow-nickel message in `docs/field-cipher-deep-dive-2026-10-14.md` §2c (round 3); this round
  added the missing derivational page, so the vector no longer depends on an unread width rule.

Still open (unchanged):

* **Diana pad provenance** (ledger item 1) — no surviving pad-book scan; the 24-vs-26 letter alphabet
  question stands.
* **Diana + columnar transposition variant** (ledger item 2) — waiting on a published worked example.
* **The Russian checkerboard** (ledger item 3) — 40-cell Cyrillic board with its signs and the
  "message starts" marker; would allow end-to-end encipherment of the nickel message.
* **SECOM/Crow** (ledger item 6) — still no published plaintext; `tools/crow_letter_count_bounds.py`
  remains the falsifier for any letter-count claim.

New leads this round:

* the OpenPGP CFB resynchronization variant (RFC 4880 §13.9) as the next PGP-side vector;
* the 1914 War Office manual's cipher backlog (§5), starting with the zigzag and Nihilists' ciphers;
* Friedman's 1951 translation notes on Sacco, and the 1971 edition of FM 31-20.
