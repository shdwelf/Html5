# T9.1 — the algorithms book, card-sized (2026-10-23)

T9.1's last open strand asked, in effect: the backlog has an
"algorithms book" (the canon named in T10.2's cross-check is CLRS,
*Introduction to Algorithms*, 4th ed., MIT Press 2022; UCSB's own
sequence assigns Weiss and Sahni instead —
docs/ucsb-course-readers-2026-10-23.md). Which of it survives contact
with a smartcard? This note answers by building the survivable part.

## The card envelope (the constraints that do the selecting)

From the substrate `js/cardreader.js` already models:

- one short APDU in, one out — 255 data bytes unless extended-length
  APDUs are in play (BasicCard Professional allows 2048);
- transient RAM measured in single-digit kilobytes on real cards,
  EEPROM writes that wear (~10⁵ cycles) and must not be the inner
  loop of anything;
- integer arithmetic only; no heap, no recursion budget, no floating
  point unit worth the name;
- the interindustry INS space is pre-claimed (SELECT `A4`, VERIFY
  `20`, READ/UPDATE BINARY `B0`/`D6`) — applets live in the gaps.

## What shipped: the ALGO-BOOK applet

`js/card-algorithms.js` implements seven canonical algorithms as pure
reference functions and binds them as proprietary instructions of one
AID-selected applet (`A000000002`), tested over the wire through the
virtual reader (`tests/card-algorithms.test.mjs`, 3/3):

| INS | Algorithm | Lineage | Known answer pinned in tests |
|---|---|---|---|
| `10` | CRC-16/CCITT-FALSE | Peterson & Weldon polynomial codes; CRC catalogue | `"123456789" → 0x29B1` |
| `22` | Luhn validate / check digit | ISO/IEC 7812-1 Annex B | `79927398713` valid; payload `7992739871` → digit `3` |
| `30` | binary search | Weiss ch. 2; CLRS exercise lineage | key 7 in `[1,3,5,7,9]` → index 3 |
| `40` | insertion sort | CLRS ch. 2 | `[5,2,4,1,3] → [1,2,3,4,5]` |
| `50` | Euclid's GCD (uint16) | CLRS 31.2 | `gcd(1071, 462) = 21` |
| `60` | FNV-1a 32 hashing | Fowler/Noll/Vo; CLRS ch. 11 lineage | `"foobar" → 0xBF9CF968` |
| `70` | repeated-squaring modExp (uint16) | CLRS 31.6 | `4^13 mod 497 = 445` (CLRS's own example) |

Card-honest behaviour is part of the spec: unsorted input to binary
search is refused (`6A80`) rather than silently wrong, an absent key
is `6A83`, `gcd(0,0)` is `6A80` (undefined, not zero), and unknown
instructions fall through to the core's `6D00`.

## What was deliberately left out, and why

- **FFT (CLRS ch. 30), geometric algorithms (ch. 33), anything
  floating-point.** No FPU, no honest fixed-point story at these
  operand sizes; a card that needs them is the wrong device.
- **Hand-rolled RSA / big-number modexp.** The uint16 modExp above is
  the *algorithm shape* from CLRS 31.6; real cards run RSA/ECC on a
  crypto coprocessor with blinding. Software big-number crypto on a
  card CPU is slow and side-channel naked — the correct port is
  "call the coprocessor", which a virtual reader can only model as
  an applet boundary, not reproduce.
- **Sort/search over more than fits in RAM.** The tractable card
  pattern is record files (EFs) plus one bounded pass, or host-side
  indexing with card-side verification — the book's external-memory
  chapters (CLRS 18/ B-trees) arrive on-card as the filesystem
  itself, which is why the filesystem choice
  (docs/smartcard-filesystem-choice-2026-10-23.md) came first.
- **Write-heavy algorithms in EEPROM.** Sort in transient memory,
  commit once; wear is a budget, not an implementation detail.

## Sourcing note

No book was bought or downloaded for this strand and none is needed:
every algorithm above is standard, its known-answer vector is public
(catalogue check values, ISO worked examples, CLRS's printed
examples), and the implementations here are written from the
mathematics, not transcribed from a text. Editions for the shelf:
CLRS 4e (2022) as canon; Weiss, *Data Structures & Algorithm
Analysis in C++*, as the language-matched alternate UCSB actually
assigns. If a future strand wants chapter-keyed exercises, key them
to Weiss per the T10.3 finding.

## Status

Strand closed: the card-tractable subset of the algorithms book is
implemented, wired, and pinned by published known answers. What
remains in T9.1 is only what needs hardware or a provisioning model:
physical-card/GlobalPlatform load, and card personalisation
(CREATE FILE / write-path) on the virtual reader.
