# Intelligence Lecture Hall — research log, 2026-09-14

Continuation of the lecture-hall work started in `dss-casefiles-riddle-warrick.md`
(“Wave 3 — the lecture hall”). Four new records were researched, written and
verified; the hall now holds **8 records**.

Target file: `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html`,
tab `lecturehall` → component `qv`, data array `Pc`.
Proof harness: `tools/verify_lecture_hall.mjs` (40 checks) against
`js/lecture-ciphers.js` (the wheel + Playfair/ROT1/Atbash reference code).

```bash
node tools/verify_lecture_hall.mjs     # ALL CHECKS PASSED
node tools/verify_casefiles.mjs 8099   # still ALL CHECKS PASSED (37 checks)
```

The hall's standing rule — *record the provenance, never flatten it, and record
the absence instead of filling it* — is what shaped every entry below.

---

## 1. F5’s Black Hat 2016 cipher challenge (`f5-blackhat-2016`)

**Source.** F5 DevCentral technical article 275036, *BlackHat 2016 F5 Cipher
Challenge*, by “pliam”, 11 August 2016 — the operator’s own post-mortem, which
publishes the four ciphertexts, the hints, the solutions, the key square, the
Ruby generator and the Playfair class. A second, later edition is documented in
article 291348, *Can you solve the #F5CipherChallenge at Black Hat 2019?*
(7 August 2019), which supplies “a JSON block which is a model of the data
structure on the t-shirt” for solvers who prefer code to cardboard.

**Published artefacts, verbatim.**

```
Card puzzle #1   HSHRZQHCCKD
Card puzzle #2   DIZKKVWRMZNBHGVIB
Card puzzle #3   (pigpen glyphs, image only)
T-shirt puzzle   SF PS DS IY FR CS MB DM IN QN NP HR FV EI BX YG WF QW XC WY SM LK
```

**What it was.** F5’s stated goal was “a puzzle which could be broken by hand
with pencil and paper, but which would still resist sophisticated cryptographic
techniques.” The adversary was an online solver, not a cryptographer. Cards #1–#3
are ROT1 of “IT IS A RIDDLE”, Atbash of “WRAPPED IN A MYSTERY” and a pigpen
variant of “INSIDE AN ENIGMA”; the T-shirt is Playfair over a plaintext whose
inner two clauses were pre-warped (Atbash, then ROT1) — so the solver peels
Playfair, then ROT1, then Atbash. The Playfair key is the concatenation of the
three card solutions, 42 characters: `ITISARIDDLEWRAPPEDINAMYSTERYINSIDEANENIGMA`
→ square `ITSAR / DLEWP / NMYGB / CFHKO / QUVXZ`. Answer: “THERE IS NOTHING MORE
DECEPTIVE THAN AN OBVIOUS FACT.”

**Reproduced here, not quoted.** `js/lecture-ciphers.js` re-implements the
published Ruby (including its quirks: doubles broken with an inserted `x`, odd
tail padded with `q`, the `{1, 7, 9, 13, 18}` shift set chosen so the Caesar
layer never lands on J and collides with the I/J merge). The harness rebuilds the
square, re-encrypts and matches the 22-digram ciphertext exactly, then re-peels
the three intermediates F5 prints in the walk-through:

```
layer 1 (Playfair)  THEREISNOTHINGLNQDCDBDOSHUDSGZMYLKXDQKEGTYWF
layer 2 (+ROT1)     THEREISNOTHINGMOREDECEPTIVETHANZMLYERLFHUZXG
layer 3 (+Atbash)   THEREISNOTHINGMOREDECEPTIVETHANANOBVIOUSFACT
```

**Correction carried in the record.** The brief that kicked off this pass — an
AI-written summary — asserted that “the hardest layer was broken by players who
manually deduced the key structure based on F5 network security terminology
(such as product names like BIG-IP or ASM).” The primary source says the
opposite: the key *was* the three card solutions, concatenated, and no F5 product
name appears anywhere in the design. That claim also mislabels the contest (there
is no “F5 network security contest”; the 2016 event is the F5 Cipher Challenge at
Black Hat USA). The record now flags the legend so it cannot be re-propagated.

---

## 2. The MD5 in the USCYBERCOM seal (`uscybercom-seal-md5`)

**The claim to check.** The brief stated the seal carries a 32-digit hash of the
command’s mission statement, cracked in under three hours after a WIRED contest.
No actual hash string survived in the prompt — the place where the digest should
have been was blank — so the first job was pinning the bytes.

**Transcription.** The string is `9ec4c12949a4f31474f299058ce2b22a`, set into the
gold ring of the emblem, as rendered by PCMag (9 Jul 2010) and AFCEA Signal
(8 Jul 2010). CRN renders it `9ec4c1294a4f31474f299058ce2b22a` — **31 characters**,
one short of a valid MD5: a copy failure, not a cipher. The hall keeps both
readings, because a hash you cannot transcribe is a hash you cannot verify.

**Verified independently.**

```bash
printf '%s' "$MISSION" | md5sum    # 9ec4c12949a4f31474f299058ce2b22a
```

`tools/verify_lecture_hall.mjs` recomputes it with `node:crypto` against
`USCYBERCOM.missionStatement` in `js/lecture-ciphers.js` (392 characters) and
asserts the near misses **fail**: a trailing newline gives
`5a7a7c3fa0be751ed3350bb5184623ee`; “specific” for “specified” gives something
else again. The preimage is therefore punctuation-pinned to the published
sentence, which is exactly the property a seal-shaped checksum is for.

**Framing the record corrects.** Nothing was “decoded”. MD5 is one-way; the
community recovered it by guessing the plaintext (the command’s own published
mission statement) and hashing it back. And the primacy story is itself
contested: WIRED credits a Danger Room reader, `jemelehill`, after “a little more
than three hours”; CRN credits Sean-Paul Correll of Panda Security, “around 10
a.m.”, an hour after WIRED published the string. Both are preserved; the hall
does not pick a winner on second-hand accounts. Contest prize per the reporting:
a T-shirt or a ticket to the International Spy Museum.

**Algorithmic context, honestly bounded.** When the emblem was designed, MD5
collision resistance had been broken since Wang et al. (2004) and the CMU SEI had
called MD5 “cryptographically broken and unsuitable for further use” (Dec 2008);
the 2008 rogue-CA and 2012 Flame attacks followed. None of that breaks *this*
use: a “what did the text say” seal needs preimage resistance, which MD5 retains.
The record says so in those terms rather than scoring the DoD for using a
deprecated hash.

---

## 3. The Field Notes cipher wheel, modelled by Jurph (`fieldnotes-wheel`)

**Sources.** `github.com/Jurph/cipherwheel` (25 commits, last touched 6 Dec 2020;
`cipherwheel.py`, `messages.txt`, `testharness.py`) and the Fall-2018 “Clandestine”
release literature the repo transcribes.

**Mechanism, verified.** A 36-character pool (A–Z, 0–9) split into two
interleaved demi-alphabets: key letter 1 rotates the whole wheel (a Caesar offset
in radix 36), key letter 2 slides one half against the other, halved, so only 18
of 36 second letters do anything. Enumeration in this repo confirms the README’s
claim numerically: **1296 keys reach exactly 648 distinct alphabets**, and at the
default hardware offsets `[13, 13]` two keys — `XV` and `XW` — produce the
identity alphabet. A user who lands on a null key believes a message is secret.
That also disposes of the README’s aside that changing the rotors “invalidates
some of the unit tests”: because each key letter cancels its rotor, re-rotoring
the hardware only relabels keys — the reachable set stays 648.

The author’s threat model is quoted in the record because it is rarer than the
code: “a monoalphabetic substitution cipher, which is a toy cipher. It *encodes*,
rather than *encrypts*, your secrets… adequate for protecting television spoilers,
riddles, and any other puzzle that can be solved by a high school student with
fewer than ~4 hours of effort”, plus a pointer to AES-256 and to Simon Singh’s
substitution cracker.

**New material recovered in this pass.** Exhaustively searching the 648
alphabets over the corpus in `messages.txt` (rather than copying any solution
page) recovers two of its lines under the two-letter key `FN`:

```
0j'a d6j wduhgfjw3 0d u63w j6 3wu0f7wh 0j bsjwh, …
 → IT'S NOT ENCRYPTED IN CODE TO DECIPHER IT LATER, IT'S ENCRYPTED IN CODE TO DECIPHER IT NOW

5owb3d6jwa1hsd3.u64
 → F6ELDNOTESBRAND.COM     (the dial mixes digits and letters: 6 stands where I is expected;
                            the corpus itself annotates this as “f[6]eldnotes[V]rand.com”)
```

The corpus’s four short codes (`m9uuty01h4qwksq.1op` and three more) stay
**unrecovered**: `FN` yields gibberish, and no key in the reachable set turns any
of them into a domain-shaped string — the harness asserts that negative
(0 candidates over 648 alphabets × 4 codes × 2 directions) so the claim is
re-checked on every run, not remembered.

**Fidelity note that nearly sank the port.** Upstream’s cipher dict is
`zip(wheel_alphabet(key), pool)` and its `encrypt` walks *keyed → original*,
which is the opposite of what the names suggest. The JS port initially “corrected”
that intuition and then failed every published vector. `js/lecture-ciphers.js`
keeps the upstream direction and documents why: with it, encoding a known answer
reproduces a published ciphertext *and* decoding the literature’s ciphertext
yields English. A conformance gate is worth more than a plausible rename.

---

## 4. Agents of F.I.E.L.D. — f1eldn0tes.com (`f1eldn0tes-agents`)

**What it is.** A Tumblr run by solvers — not the publisher, whose domain is
fieldnotesbrand.com — documenting the 21-puzzle alternate reality game that ran
with the Clandestine edition. Each entry carries a Code (wheel ciphertext in
four-character groups), a quoted line, a two-letter Key, a Solution (shop name +
ZIP) and an Enumeration number, with a SPOILERS banner and a separate page for
people who want to try it themselves. That format is why the archive is testable.

**Audit ledger — 8 of 8 codes re-derived, plus the two odd cases.**

| # | key | result |
|---|-----|--------|
| 10 | `06` (Number 6, *The Prisoner*) | `LUSH DIVE OSLO` → **exact** |
| 12 | `JS` (Jack Skellington) | `BAFFLINGBREW S1F4 41` → **exact** |
| 13 | `NS` (Nakia/Shuri) | `FRANCES VINTAGE 85013` → **exact** |
| 14 | `MB` (Modesty Blaise) | `AIDA E1 6JE` → **exact** |
| 15 | `BS` (Sydney Bristow, reversed) | `SON OF A SAILOR 78702` → **exact** |
| 16 | `H9` (HAL 9000) | `TWO HANDS PAPERIE 80302` → **exact**, but only after the documented “shift each quartet by 2-0-0-1” pre-step; wheel alone gives `RWO28ND5NAPRPIELY30F` |
| 17 | `54` (“LIV”) | `OLD FOX BOOKS 21401` → **exact** |
| 18 | `FE` (Iron Man) | `COFFEE STUDIO 60640` → **exact** |
| 9 | `VK` then `KS` | double decode consistent: both stages land on `1S2NAV14QOFDQ` → `OBLATION 97209` |
| 11 | `JB` (Jason Bourne) | matches through `VORT`, then diverges — the blog states a spiral reading, so this is a transposition, not an error |
| 19 / 20 | `JB` / `IE` | **the blog prints one Code for both puzzles.** Under `IE` that string reads `OVERLYGODLYESCAPADE02378`, which is not #20’s published answer, and #19’s 19-character answer cannot produce a 24-character code. At least one of the two is a transcription collision; #19’s own code is not reconstructible from the page. Flagged, not silently repaired. |

**Why it belongs in this hall.** Same method as +ORC, Fravia and the kr0meCorp
hunt: treat an opaque system as an adversary, publish the derivation, invite
strangers to attack it, and let the artefact be the referee. The endgame chained
21 answers into 7 what3words coordinates over Little Free Libraries, then
sticker-indexed the Clandestine “Practical Enumerations” into
`IOBSERVEARCTURUSFREAKOUTGARRIGOUFIDELITYNITROGEN` → `25-19-37`. The physical
steps (16 FedEx counters for #20, a Jackbox Twitch stream for #21, whose key was
“each of the previous 20 keys, in order” — a polyalphabetic finish line) are
recorded because the medium *is* the finding: a 2018 consumer puzzle game ran on
paper, in shops, on a Tumblr of volunteers.

---

## 5. Bundle integrity and the label repair

`apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html`,
1 006 544 → 1 024 252 bytes (+17 708), appended inside the `Pc` array so the
bundle keeps its single-line minified shape. The inline app script (911 590
bytes) was re-extracted and re-parsed clean via `vm.Script`, as a check in the
harness.

While adding a `Community archive` row it became clear the hall’s vocabulary
disagreed with itself: the legend (`Vv`) described *Community recollection*,
which the filter row could not select; the filter and the colour map (`Vc`)
offered *Community archive*, which the legend never defined — so a record carrying
either label was half invisible. Both lists are now complete, and the harness
asserts the invariant for every label any record uses:
**legend ∩ colour map ∩ filter row**. The scope line grew to name published
puzzle engineering alongside underground computing, counterintelligence, search
culture and institutional memory.

A quality bar was also raised, and is enforced: new records need ≥ 8 facts, ≥ 4
provenance links, ≥ 200-character summary and caution, and may not assert an
unverified answer as fact.

The splice itself is reproducible: `tools/patch_lecture_hall_records.py` holds the
record text as authored and every anchor it replaced. It is **already applied** and
deliberately fails loudly if run again against the patched bundle (each anchor must
occur exactly once), so it can be reviewed or replayed from a clean copy but never
double-applied.

---

## 6. Open threads for the next pass

1. **Black Hat 2019 edition** — fetch article 291348 in full: the JSON t-shirt
   model plus its card ciphertexts would extend the F5 record into a series, and
   its solver writeups (if any) are unexamined.
2. **Card puzzle #3 (pigpen)** — the article embeds the ciphertext as a 600×57
   image; the glyph alphabet variant is not in the text record. Recovering the
   image (or a second-hand transcription) would let the harness re-derive all
   three cards instead of two.
3. **The four Clandestine codes** — try non-wheel hypotheses (per-line keys, a
   different rotor offset than `[13,13]`, a transposition layer like #11’s
   spiral) before recording them as permanently unread.
4. **`messages.txt` provenance** — confirm against the physical 2018 literature;
   the repo’s transcription is the only copy this pass could reach.
5. **The seal after 2018** — whether USCYBERCOM’s redesigned emblem still carries
   `9ec4c12949a4f31474f299058ce2b22a` was **not** verified in this pass and is
   deliberately not claimed in the record.
6. **`820chi`** — raised by the archivist mid-session as a possible clue. Nothing
   in these four sources, in `messages.txt`, or in this repository contains it, and
   no wheel key maps it to anything English-shaped. Left as an unanswered query
   rather than a finding.
