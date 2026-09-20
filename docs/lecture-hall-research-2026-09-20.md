# Intelligence Lecture Hall — research log, 2026-09-20

Second pass over the lecture hall, continuing
`lecture-hall-research-2026-09-14.md`. Two new records were researched, written
and verified — **Cicada 3301** and **F5's Black Hat 2018 cipher challenge** — and
four of the 2026-09-14 records were rewritten or extended. The hall now holds
**10 records**. All six open threads from the previous pass are disposed of
below: two closed with primary sources, two answered, one strengthened into a
calibrated negative, one recorded as a documented absence.

Target file: `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html`,
tab `lecturehall` → component `qv`, data array `Pc`
(1,024,252 → 1,051,337 bytes, +27,085 across 16 splice steps).
Proof harness: `tools/verify_lecture_hall.mjs` — rewritten, now **119 checks**
in 8 sections, against `js/lecture-ciphers.js` (21 exports).

```bash
python3 tools/patch_lecture_hall_records_r2.py   # already applied; re-run fails loudly
node tools/verify_lecture_hall.mjs               # ALL CHECKS PASSED · 119 checks
node tools/verify_casefiles.mjs 8099             # still ALL CHECKS PASSED (no regression)
```

The hall's standing rule — *record the provenance, never flatten it, and record
the absence instead of filling it* — is what shaped every entry below. A second
rule emerged from this pass and is now enforced in code: **a negative result is
only as good as the test that produced it, so the test has to be calibrated
against a case it is known to catch.**

---

## 0. Disposition of the six threads from 2026-09-14 §6

| # | Thread | Disposition |
|---|---|---|
| 1 | Black Hat 2019 edition | **Documented absence.** Article 291348 fetched: it publishes a JSON model of the t-shirt's data structure and a zipped simplified variant, names no answer, prints no card text, and asks solvers to "avoid posting hints, answers, or spoilers here". No solution was ever published, so none is asserted. |
| 2 | Card #3 (pigpen) | **Recorded as unrecovered, with the reason.** The ciphertext exists only as a ~600×57 embedded image; the published Ruby generator excludes it ("easy puzzles (not pigpen)") and derives only `ctx1`/`ctx2`. Cards #1 and #2 re-derive byte-for-byte; #3 is not redrawn from a description. |
| 3 | The four Clandestine codes | **Strengthened into a calibrated negative** (§3). Not solved — and the attempt to solve them harder turned out to be worthless, which is now part of the record. |
| 4 | `messages.txt` provenance | **Answered internally** (§3). Cannot be checked against the physical 2018 literature and still cannot be; but line 7 in the clear and line 2 in ciphertext are the same string under one key, which is a stronger witness than a photograph. A dropped seventh line was also found in this repository's own port and restored. |
| 5 | The seal after 2018 | **Closed with a primary source** (§5). The U.S. Army Institute of Heraldry's official blazon still specifies the MD5 ring. |
| 6 | `820chi` | **Resolved** (§4). It is puzzle #1's decoded clue `826 CHI 60622`, one digit off — a misremembering, not a code. |

---

## 1. Cicada 3301 (`cicada-3301`) — new record

**Requested explicitly by the archivist**, with a specific claim to check: that
the Cicada key is on a **`cryptomomicon.mit.edu`** keyserver.

### 1.1 The source check

That hostname is **false**, and the check is trivial and reproducible:

```
cryptomomicon.mit.edu   → getaddrinfo ENOTFOUND   (does not resolve)
pgp.mit.edu             → 18.9.60.141
cryptonomicon.mit.edu   → 18.9.60.141   (pgp.mit.edu is a CNAME of it)
```

`cryptomomicon` is a one-letter corruption of `cryptonomicon` — an `n` becomes an
`m` — which is the hostname MIT gave its keyserver after Stephenson's novel. The
harness resolves both real names, asserts they reach the same address, and
asserts the corrupted name does **not** resolve.

More important than the correction is what Cicada actually said. The claim
presupposes that Cicada named a host. It did not. The whole of its instruction,
from the OutGuess payload of the 2012 welcome image, is:

> From here on out, we will cryptographically sign all messages with this key.
> It is available on the mit keyservers.  Key ID 7A35090F, as posted in
> a2e7j6ic78h0j. Patience is a virtue. Good luck. 3301

"the mit keyservers" — plural, unnamed, and pointing at an imgur album rather
than at a server. The record therefore carries both spellings, so the correction
cannot be lost by a later reader who only remembers the wrong one.

### 1.2 The deep dive: verifying the key ID with no keyserver

The instructive part of Cicada is not its steganography but that it made
signature verification the precondition of participation — and that its own
artefacts let you check that precondition offline. This pass did, from the
published signature bytes alone:

* base64-decoding the Welcome signature block puts an **OpenPGP issuer
  subpacket** at byte 19: `0a 09 10 181f01e57a35090f`;
* those eight bytes are the signer's **long key ID**, `181F01E57A35090F`;
* the v4 **fingerprint** gpg prints is
  `6D85 4CD7 9333 22A6 01C3 286D 181F 01E5 7A35 090F` — 40 hex digits, 160 bits
  of SHA-1 — whose last 16 digits are that long key ID;
* and its **low 32 bits are `7A35090F`**, exactly the short key ID Cicada
  published, per RFC 4880's derivation.

So the key ID Cicada asks you to trust is readable out of the signature itself.
No keyserver, no GnuPG, and no network access is needed to confirm that the
number in the message and the number in the armour are the same number. That is
the whole lesson, and the harness reproduces it by parsing bytes.

gpg's own caveat on the 2016 message is quoted in the record rather than
paraphrased, because it is the counterweight:

> Good signature from "Cicada 3301 (845145127)"
> WARNING: This key is not certified with a trusted signature!
> There is no indication that the signature belongs to the owner.

A signature proves which key wrote a message. It never proves who holds the key.

### 1.3 The RSA sub-puzzle: attempted, not reproduced

The 2012 round shipped a `Crypt::RSA::ES::OAEP` (Version 1.99) message with
`e = 65537` and a modulus described as having "a low bit modulus and is
therefore breakable", each solver receiving a unique message and being told not
to collaborate.

Measured here: the published modulus is **112 decimal digits = 372 bits**, and
`e = 65537 = 2^16 + 1`, the Fermat prime F4. Four methods were attempted — trial
division to 97, Fermat (2×10^6 iterations), Pollard rho (2.4×10^7), Pollard p−1
(B1 = 10^6) — and **none produced a factor**; there is no small prime factor to
find. The record says "not factored here" and lists what was tried. It does not
borrow Cicada's word "breakable", which is the puzzle-setter's framing of its
own artefact rather than a measurement anyone has published.

### 1.4 Kept as arithmetic, not numerology

3301 is prime. 65537 is `2^16 + 1` and the Fermat prime F4. 65536 is `2^16`. The
periodical cicada's broods run on 13- and 17-year cycles, both prime. Why this
insect and why this number are **not published**, so the record does not invent a
reason — it states the arithmetic and stops.

### 1.5 Imposture, and an anomaly left open

Cicada legislated against impostors twice and both denials are signed: the July
2015 Planned Parenthood intrusion by an unrelated group calling itself "3301",
and the 2012 claim by Chile's investigative police (PDI, Los Andes Province)
that it was a hacker group.

One anomaly is **recorded, not resolved**: the April 2017 message is signed with
the same key, but its armour reads `Version: CicadaPG v.3301` — a string no
GnuPG release ever printed — and its hash header is SHA512 where every earlier
message said SHA1. It is nonetheless the last message the public record treats
as verified, and it says only: "Beware false paths. Always verify PGP signature
from 7A35090F."

---

## 2. F5's Black Hat 2018 cipher challenge (`f5-blackhat-2018`) — new record

**Source.** F5 published a post-mortem for 2016 (article 275036) and a JSON
model for 2019 (article 291348), but **nothing at all for 2018**. The only
public account is Eviatar Gerzi's writeup of 14 September 2018 — a participant's
record, written weeks after the event, illustrated with his own photographs.
Classified `Community archive`: first-hand, partial, corrigible.

That provenance made the record a test rather than a citation. The writeup names
three strings, and three strings that decrypt and re-encrypt into one another
exactly are very hard to invent by accident:

| | |
|---|---|
| ciphertext | `WVBYTJPYHGPBHBIRYAIBFPQUYBZILI` (30 characters) |
| alphabet key | `GDPQWLZIHMSONAKFYXTVJRBCEU` |
| passphrase | `truthsreturnzero` |
| plaintext | `NECESSITYDISPENSETHWITHDECORUM` — "NECESSITY DISPENSETH WITH DECORUM", attributed to Thomas Carlyle |

### 2.1 The chain, and the ordering rule

Crossword blue squares → "keyed / vigenere / rumking", pointing at rumkin.com's
Keyed Vigenère tool. Red squares → "truths / return / zero", the passphrase.
Shirt front → three robots holding flags in **flag-semaphore** positions,
spelling `F5`, naming the method. Shirt back → **moons**, each carrying a
clock-face angle that is really a pair of flag directions.

The ordering rule was astronomical, not cryptographic: if each moon transmits one
element of the key alphabet simultaneously and the planets rebroadcast, in what
order does Earth receive them? Planets by distance from Earth; within a planet,
its moons by distance from that planet — so Luna's `G` first, then Mars's `D` and
`P` (Phobos at ~10,000 km ahead of Deimos at ~20,000 km), and so on. The 26 moons
of seven bodies yield the alphabet key.

Planet groups, in order: Earth `G`; Mars `DP`; Jupiter `QWLZ`; Saturn `IHMSON`;
Uranus `AKFYX`; Neptune `TVJ`; Pluto `RBCEU`. The harness asserts that these
concatenate to the whole key, and that the key is a **permutation of all 26
letters** — one letter per moon, no repeats — rather than assuming it.

### 2.2 Why the convention had to be pinned

Of the six plausible ways to index a keyed Vigenère (ciphertext position and
passphrase position each taken in either the keyed or the plain alphabet),
**exactly one** reproduces the plaintext: both operands indexed in the keyed
alphabet, `plain = KA[(idx_KA(c) − idx_KA(k)) mod 26]`. The harness runs all six
and asserts the other five fail, because a cipher that "works" under any
convention has not been verified. It also asserts that re-encrypting the
plaintext returns the published ciphertext, and that an **unkeyed** Vigenère
(identity alphabet key) does not solve it — which is the point of the shirt: the
moons carry the order of the tableau, not the message.

The bonus question was also astronomical — which planet receives all twenty-six
keys first, counting rounds by rebroadcasts rather than by distance. The
writeup's result is Saturn, reached by counting 0-jump, 1-jump and 2-jump rounds.

### 2.3 What the three years show

2016 layered three classical ciphers against an online solver and published
everything afterwards. 2018 hid the key order in physical astronomy, made the
cipher itself the easy part, and published nothing. 2019 handed solvers a JSON
tree model of the shirt and never published an answer at all. The middle year is
the only one whose entire solution re-derives from a participant's account.

---

## 3. Clandestine corpus (`fieldnotes-wheel`) — rewritten and extended

### 3.1 A fidelity defect in this repository's own port

`js/lecture-ciphers.js` carried **six** lines of `messages.txt`. The upstream
file has **seven**. The seventh is the publisher's domain in the clear —
`fieldnotesbrand.com` — and it is the corpus's own answer key, because it is
exactly what line 2's ciphertext decodes to once the dial's ambiguity is
resolved. The port now carries all seven, fetched through the GitHub API rather
than retyped, and the harness asserts both the line count and the round trip.

### 3.2 Line 2: two ways a legible transcription can still be wrong

Read exactly as the file prints it, `5OWB3D6JWA1HSD3.U64` decodes under `FN` to
`F6ELDNOTESBRAND.COM` — a 6 where an I belongs. But the wheel's own output for
the publisher's domain is `50WB3D6JWA1HSD3.U64`: the file carries a **letter O**
in the second position where the dial emits a **zero**. The two differ in exactly
one glyph.

* read that `O` as a `0` → `FIELDNOTESBRAND.COM`, exactly;
* read it as printed → `F6ELDNOTESBRAND.COM`, the 6 being the zero's shadow;
* read the file's ASCII `1` as a lowercase `l` → `F6ELDNOTESVRAND.COM`, which is
  precisely the annotation printed on the same line, `f[6]eldnotes[V]rand.com`.

Both ambiguities belong to a 36-character dial that mixes letters with digits,
not to a transcriber. Line 7 confirms the answer from the other end: decoding it
gives gibberish, which is the tell that it is plaintext.

### 3.3 The four short codes: a negative that had to be calibrated

The narrow sweep — all 1296 keys, both directions, the codes exactly as printed —
yields no domain-shaped string. That was the 2026-09-14 claim and it still holds
(4 rows × 2,592 key/direction pairs, **0** candidates).

Thread 3 asked for harder hypotheses, so this pass allowed letter/digit lookalike
variants (`O↔0, I↔1, S↔5, B↔8, Z↔2, G↔6, T↔7`) against a 46-entry TLD list —
217,728 attempts. It produced **224** "domain-shaped" strings across **56**
distinct outputs. Read naively that looks like progress. It is not:

* **not one** of those bodies contains a word;
* run the same test on the corpus's own line 2 as a **positive control** and it
  fires **32** times — so the criterion does have power;
* run it on **16 random strings of identical shape** and it produces **more** hits
  than the real codes do.

The loosened test therefore cannot distinguish a recovery from noise, and the
record says so instead of claiming a stronger negative than the method supports.
An uncalibrated negative is only a rumour about a search. Under `FN` the four
decode to `4JCC3GIBRM8E2A8.B6Z`, `Q8WTR0G0OPQXVZS.RLF`, `NSB2EH6YFKA74X.YKN`
and `0GN2JOR4ESXTICH.C0D`, all quoted in the harness so any future change to the
port is caught. They remain **unrecovered**.

---

## 4. Agents of F.I.E.L.D. (`f1eldn0tes-agents`) — the complete ledger

The 2026-09-14 pass had 10 of the 21 rows and could re-derive 8 codes. With the
complete key table from `f1eldn0tes.com/known` this pass carries **all 21 rows**
and re-derives **18 of 21**.

### 4.1 The finding that unlocked the rest

The archive documents a **different operation per puzzle**. Running every row
through one uniform `decode` is what made #11 look like a partial failure and
#21 look like a wrong key. The real vocabulary:

| operation | rows |
|---|---|
| `decode` | #1–4, #7, #10, #12–15, #18, #19, #20 |
| `encode` (direction reversed) | #6 |
| `decode` + 5×4 box read | #5 |
| `decode` + book cipher | #8 |
| `decode` twice (`VK` then `KS`) | #9 |
| quartet pre-shift 2-0-0-1, then `decode` | #16 |
| `decode` + spiral (geometry unpublished) | #11 |
| one letter per previous key, polyalphabetic | #21 |

Keys 1→20: `SH, KG, HP, OG, JB, GS, EH, BG, VK(+KS), 06, JB, JS, NS, MB, BS, H9,
54, FE, JB, IE`.

### 4.2 Puzzle #8 — a book cipher that dates a tokenisation

Under `BG` (Benjamin Gates) the code decodes not to letters but to fourteen
digits: `70225849304224`. Read as seven two-digit word numbers —
**70, 22, 58, 49, 30, 42, 24** — and taken as positions in the opening sentence
of the **Declaration of Independence**, the first letters spell **TTMEPLA**,
which the archive writes "TTM EP LA" for the Time Travel Mart in Echo Park.

The convention only works if **"Nature's" counts as one word**. Splitting the
possessive shifts every later index and gives `TTOGPLA`. Seven independent
letters agreeing is not luck, so the answer fixes the tokenisation rather than
the reverse. All seven indices are ≤ 71 and fall inside that one sentence, which
is why the sentence — not the document — is the key text.

*Provenance, stated:* the sentence was checked against a GitHub-hosted
transcript (`halterman/CppBook-SourceCode`, `Chap21/declaration.txt`, fetched
through the GitHub API) because the build sandbox has no route to
`archives.gov`. Recorded so a reader can repeat the check against a better copy.

### 4.3 Puzzle #5 — how much a phrase can hide

The archive says the wheel output "had to be read as a box cipher (stacked 4x5
and read the columns left-to-right)". The geometry that reproduces
`CRIMINALRECORDS30307` is **five rows of four**. Four rows of five gives
`CAR0NO3IC0ME3IRSRLD7`. "4x5" meant four wide; the harness asserts both readings
so the distinction survives the next retelling.

### 4.4 Puzzle #11 — a proved permutation, and a missing shape

Under `JB` the code decodes to `VORTR67EI2XN41SEVUO`, whose **multiset is exactly
that of** `VORTEXSOUVENIR67214` — which is what "via reading in a spiral" means.
This pass then searched every rectangular spiral on grids up to 5×5 in eight
orientations, with the text laid in by rows, by columns or by spiral and read
back out in any of the same orders. **Nothing reproduces the published answer.**

The geometry lives on the notebook page, which the archive **does not publish**.
So the record proves the transposition and records the missing shape rather than
guessing one. (The page's own ordering device — thirteen dots aligned to the
letters `E G F A K D H I J M B L C` — belongs to the licence-plate
transdeletion, not to the wheel output.) Do not retry the spiral search.

### 4.5 Puzzles #19 and #20 — a corruption, now proved

The blog prints **one** code for #19 and #20 — `3STO IDV3 AIDT 7RPM PATF H04N` —
against two different keys (`JB` for J.B. Fletcher, `IE` for Irwin "Whistler"
Emery) and two different answers. Under `IE` it decodes to
`OVERLYGODLYESCAPADE02378`; under `JB` to `5EVA4FX5W4FV9TR8RWVHJMQP`. Neither is
a shop and a ZIP.

This pass ran all 1296 keys in both directions against both published answers in
both orientations: **10,368 attempts, zero successes**. The code printed for #19
and #20 belongs to neither puzzle. It is a transcription collision in the
archive, not an unsolved stage — flagged, quantified, and still not repaired.

### 4.6 Puzzle #21 — a polyalphabetic finish line

Twenty letters against the previous twenty keys, one letter each, reconstructs
exactly: **`PLAYJACKBOXTWITCH330`** = "PLAY JACKBOX TWITCH 330". A flat "decode
with key *i*" gets 18 of the 20 letters and reads like a wrong key —
`PLAYJ8CKSOXTWITCH330`. A polyalphabetic finish line is precisely where a static
wheel cipher stops being trustworthy, and whoever designed the endgame knew it.

### 4.7 Thread 6 closed: `820chi`

Puzzle #1, key `SH` for Sherlock Holmes ("When you have eliminated the
impossible…"), decodes `D7BH 0NB5 B77.` to **`826 CHI 60622`** — the clue for the
Secret Agent Supply Store in Chicago. The string `820chi` itself decodes to
nothing English-shaped under any of the 1296 keys in either direction. It was
never a code; it was a misremembering of a shop clue, one digit off, carried into
a research log and then into this hall. Both strings are recorded side by side so
neither is lost.

### 4.8 What the AMA added

The January 2019 `r/FieldNuts` AMA with The Mystery League and Field Notes
supplies what no solution page could: 24 puzzles were planned and cut to 21
mid-hunt; entire puzzles changed deep into the run; the four-digit location codes
in #20 were **FedEx store IDs**; the Scrabble-bingo puzzle used Jim and Bryan
because those are Field Notes' own people, which solvers read as a reference to
the Cincinnati Reds' managers; and #17's "fluke" is confirmed by the designers —
solvers read the Olivia Pope stage with key `PO` in the *encoding* direction,
though it was meant to be key `54` (`LIV`, Olivia Pope's nickname) in the
*decoding* direction. The fluke is reproducible: `decode(54)` and `encode(PO)`
both give `OLDFOXBOOKS21401`, from two different alphabets — the 36×18 keyspace
leaking in both directions at once.

Asked about the character "Em Dash", the recorded answer is "We don't know. And
we probably never will." That is preserved as an absence.

The endgame, for completeness: safe combination **25-19-37**; the dot-grid
phrase yields Vigenère keys **OUTOFSORTS / STEREOTYPE / IMPRESSION**; the 21
answers chained into 7 what3words coordinates over Little Free Libraries.

---

## 5. USCYBERCOM seal (`uscybercom-seal-md5`) — thread 5 closed

The U.S. Army **Institute of Heraldry**'s official blazon for the seal
(`tioh.army.mil`, HeraldryId 16683) still specifies the ring:

> Within the blue disk is a golden circle laid with MD5 hash that ties the
> command back to the early days of computer networking; USCYBERCOM's mission
> statement is encrypted within this code.

The command was elevated to a unified combatant command in May 2018 and this
heraldic record was not superseded — so the ring is not a 2010 curiosity that was
quietly dropped.

The blazon also **promotes the press's error into an official description**. An
MD5 digest does not encrypt anything and cannot be decrypted, yet the command's
own heraldry says the mission statement "is encrypted within this code". That is
why the record keeps saying *commitment* rather than *cipher*: the misconception
is not a journalist's shorthand a better article could fix.

A third transcription, caught by counting rather than reading: Computerworld
described the preimage as "Cybercom's **58-word** mission statement". The text
that actually hashes to `9ec4c12949a4f31474f299058ce2b22a` is **55 words and 392
characters**. Even the length of the preimage had to be recomputed here.

---

## 6. Tooling: the harness rewrite and two bugs it caught

`tools/verify_lecture_hall.mjs` was rewritten into 8 sections — wheel
conformance, the Clandestine corpus, the full F.I.E.L.D. ledger, F5 2016, F5
2018, USCYBERCOM plus heraldry, Cicada 3301, and bundle integrity — 40 checks
becoming 119. Everything computable is recomputed: MD5 via `node:crypto`,
Playfair re-encryption of the published ciphertext, the keyed Vigenère in both
directions, OpenPGP subpacket parsing, DNS resolution, RSA factoring attempts.
Nothing is quoted from a web page as a result.

Two defects surfaced, both worth recording because both were **in the checking
code, not the checked material**:

1. **A patch step corrupted the bundle and the corruption was invisible.**
   `replace_summary` had an off-by-one that kept the old closing quote, emitting
   `strange."",facts:` — a doubled quote in a 1 MB minified single-line file.
   The app would have failed to load. Fixed, and the patch tool now
   **parses the inline script with `node:vm` before writing anything**, and
   verifies the record-id list is exactly the original plus the two additions.
   A patch tool for a minified bundle that cannot prove its output still parses
   is not a safe tool.
2. **One of the new checks was wrong, and it was wrong in the safe direction.**
   The Cicada record check banned `solved|cracked|broken` as a bare substring,
   which fires inside "re**solved**" and "un**solved**" — banning ordinary
   English rather than a claim. It now uses word boundaries with negations
   stripped first. The lesson generalises: a check that fails for the wrong
   reason will eventually be relaxed for the wrong reason.

`tools/patch_lecture_hall_records_r2.py` follows the first pass's conventions —
fail loudly, never double-apply — but locates anchors programmatically (record by
id, field by name, string by a short unique substring) instead of matching
300-character literals. It also carries `pc_region`, a bracket matcher that
deliberately recognises **only `"`** strings: the records were emitted by a JSON
serialiser, so `"`-only matching is exact, and a naive three-quote matcher
mistakes an apostrophe in prose for a string delimiter and silently mis-ranges
the record.

---

## 7. Open threads for the next pass

1. **Cicada's April 2017 armour.** `Version: CicadaPG v.3301` and a SHA512 hash
   header where every earlier message said SHA1. Recorded as an anomaly.
   Determining whether a custom signing tool existed, or whether the message is a
   well-signed impostor, needs material this repository cannot reach.
2. **The four Clandestine codes.** Still unrecovered. Any further attempt must
   beat the calibration in §3.3 — a test that does not fire on the known recovery
   in line 2 is not a test.
3. **Puzzle #11's spiral geometry** and **the #19/#20 collision** both need the
   physical notebook pages, which the archive does not publish. Do not retry the
   exhaustive spiral search; it is proved empty for grids up to 5×5.
4. **F5 2019.** The JSON tree model is published; no solution is, and none is
   claimed. The 2019 chunks 2–4 of article 291348 were not fetched — if the card
   ciphertexts appear there, the record could extend as the 2016 one did.
5. **Cicada's Liber Primus.** The third round is unfinished. Any future record
   must keep it unfinished; the temptation to summarise a claimed solution is
   exactly what the PGP rule was written against.
6. **Card #3's pigpen alphabet.** Recovering the ~600×57 image, or a trustworthy
   transcription of it, would let the harness re-derive all three cards instead
   of two, and would make the 42-character Playfair key fully machine-checked
   rather than assembled from documented plaintexts.
