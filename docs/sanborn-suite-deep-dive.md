# Sanborn Suite — deep dive (Kryptos K4, the Q-signal thread, and the archives)

*Research pass 2026-09-29. Continues `docs/sanborn-kryptos-webxdc.md` (the webxdc
packaging/UX work) with the substantive Kryptos research that feeds the two
companion apps — `sanborn-codex` and `kryptos-vrml` — plus the `sanborn-suite.xdc`
bundle. This note updates the K4 solution record, walks the "Q as signed by army
radio" lead, and inventories where solutions are now submitted and where the
authoritative material is archived.*

Source-checking companion: `docs/source-check-2026-09-29.md`.

---

## 1. What the suite is

| App / file | Role |
| --- | --- |
| `public/apps/sanborn-codex/index.html` (+ root `sanborn-codex.html`) | 30-installation Jim Sanborn portal, Kryptos Cipher Lab, 26×26 tableau |
| `public/apps/kryptos-vrml/index.html` (+ standalone `apps/kryptos_vrml.html`) | Raw-WebGL Kryptos/sites viewer, K1–K5 data, cipher simulator, K4 method-ranking panel |
| `sanborn-suite.xdc` | Packed webxdc container for the suite |
| `sanborn-codex.xdc`, `kryptos-vrml.xdc` | Packed webxdc containers for the two apps |

The two apps are the deliverable surface; this document is the research substrate
behind their K4 text, and the source-check note is the audit trail.

---

## 2. Status of K4 as of 2026-09-29 — recovered, not solved

The single most important framing, and the one the apps must not blur:

- **The K4 *plaintext* was recovered from an archive in September 2025. The K4
  *cipher method* has never been publicly broken.** Recovering the message from
  a filing cabinet is not a cryptanalytic solve. All discoverers and the artist
  agree on this distinction.
  ([Scientific American](https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/),
  [Cipher Museum](https://ciphermuseum.com/ciphers/kryptos.html))

Timeline of the 2025–2026 events:

| Date | Event |
| --- | --- |
| Aug 2025 | Sanborn (turning 80 in Nov 2025, in poor health) announces he will auction the complete Kryptos secret through RR Auction to relieve himself of stewardship and support disability programs. Estimate $300k–$500k. |
| Sep 2, 2025 | Richard Byrne photographs Sanborn's publicly accessible papers at the Smithsonian's **Archives of American Art**, tipped off by the auction catalog's mention of "copies of coding charts used to code Kryptos (originals at the Smithsonian)". |
| Sep 2, 2025 (evening) | Jarett Kobek notices the photos include **five pages of scrambled text** — the K4 plaintext, cut into strips and taped out of order. |
| Sep 3, 2025 | Kobek & Byrne email Sanborn the recovered plaintext. Sanborn confirms it is authentic. |
| Sep–Oct 2025 | Sanborn asks the Smithsonian to **seal the files for 50 years (until 2075)**; it complies. Kobek & Byrne pledge never to publish. |
| Oct 16 – Nov 20, 2025 | RR Auction "Decoding History: Kryptos K4 & K5, Enigma, and the Rosetta Stone" runs online. |
| Nov 20, 2025 | The complete archive sells for **$962,500** to an anonymous bidder (far past estimate). Sanborn nets ~$770,000. |
| Jun 12, 2026 | The buyer reveals itself: **Paradigm**, a crypto-focused VC firm (co-founded by a Coinbase co-founder). It launches an automated K4 submission verifier and a 10-puzzle CTF. |

Why the scraps existed at all: before installation in 1990, the CIA's Office/Center
of **Historical Intelligence** needed to confirm the encrypted text was not
offensive or embarrassing. Sanborn cut the plaintext into strips and taped them
back **out of order** — legible enough to vet the content, scrambled enough to
stop reconstruction. Those strips later went into his donated archive by accident
while he assembled documents during cancer treatment.
([verawren/Substack](https://verawren.substack.com/p/the-answer-that-isnt-a-solution),
[Scientific American](https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/))

---

## 3. The K4 plaintext — with and without the misspellings

### 3a. The reconstructed reading (community, solvekryptos.com)

The full authenticated plaintext is **not public** (sealed until 2075; the buyer
holds the method). What circulates is a **community reconstruction** that (a)
preserves the four artist-confirmed anchors at their exact positions and (b)
fills the rest with plausible English that the site's back-solved mechanism
reproduces by construction. Roughly 24 of 97 positions are anchor-confirmed; the
rest is reconstruction, not independent confirmation.
([solvekryptos.com](https://solvekryptos.com/), [/resources](https://solvekryptos.com/resources))

Ciphertext (97 chars, as inscribed):

```
OBKRUOXOGHULBSOLIFBBWFLRVQQPRNGKSSOTWTQSJQSSEKZZWATJKLUDIAWINFBNYPVTTMZFPKWGDKZXTJCDIGKUHUAUEKCAR
```

Reconstructed plaintext (97 chars), lineated as the community presents it:

```
THE COMPASS ROSE IS HERE X
EAST NORTHEAST
THIS IS YOUR POSITION X
COMMISSION
BERLIN CLOCK
WHICH IS NORTHEAST OF HERE X
```

Continuous:

```
THECOMPASSROSEISHEREXEASTNORTHEASTTHISISYOURPOSITIONXCOMMISSIONBERLINCLOCKWHICHISNORTHEASTOFHEREX
```

The four fixed anchors:

| Positions | Ciphertext | Plaintext | First disclosed |
| --- | --- | --- | --- |
| 22–25 | FLRV | **EAST** | Aug 2020 |
| 26–34 | QQPRNGKSS | **NORTHEAST** | Jan 2020 |
| 64–69 | NYPVTT | **BERLIN** | Nov 2010 |
| 70–74 | MZFPK | **CLOCK** | Nov 2014 |

`P = (C − R) mod 26` holds at all 97 positions in the reconstructed mechanism —
that is *internal consistency*, not proof. The site models K4 as a **Quagmire III
variant with a physical keystream and a one-bit gate**, keyword KRYPTOS (the same
as K1–K3), helper letters read from the tableau side of the copper screen at the
same row/column, with a position-fixed gate adding 0 or 1 to each shift. The
substitution/helper cards are **back-solved from the plaintext**, so the model is
falsifiable-by-anchor but not forward-derived from public data.
([solvekryptos.com/about](https://solvekryptos.com/about))

### 3b. "With or without the misspellings"

Sanborn seeds **deliberate misspellings** through the work; the request to record
the K4 reading "with or without the misspellings" is well founded because the
reconstruction above contains **none**, whereas every previously solved / carved
Sanborn text does.

Confirmed intentional misspellings elsewhere in Kryptos:

| Where | As carved / decrypted | Intended word |
| --- | --- | --- |
| K1 | **IQLUSION** | illusion |
| K2 | **UNDERGRUUND** | underground |
| K3 | **DESPARATLY** | desperately |
| Morse slab | **DIGETAL** (INTERPRETATIT / INTERPRETATU) | digital (interpretation) |

Sources: [Wired 2009](https://www.wired.com/2009/04/ff-kryptos/),
[Popular Mechanics](https://www.popularmechanics.com/technology/security/a30750852/cia-kryptos-puzzle/),
[Grokipedia](https://grokipedia.com/page/Kryptos),
[solvekryptos.com/about](https://solvekryptos.com/about).

**Implication for the K4 record.** Because the true plaintext is sealed, we cannot
know whether K4 carries a fifth intentional misspelling. The honest position, now
reflected in the apps:

1. The circulating reconstruction is **clean English** (no misspellings) — it is a
   reconstruction, not a transcription of Sanborn's strips.
2. Sanborn's authenticated strips **could** contain a deliberate misspelling (his
   consistent habit across K1–K3 and the Morse slabs), and any such variant would
   still satisfy the four anchors.
3. Therefore the reading should be presented as *"reconstructed (clean); an
   artist-authentic variant may contain a deliberate misspelling, as K1–K3 and the
   DIGETAL slab all do."* We do **not** invent a specific misspelled form.

---

## 4. The "Q as signed by army radio" lead — a Q-signal, not a named device

The lead: a **Q** in the Kryptos material that behaves the way **army/military
radiotelegraph operators** use it, and the question of whether it points to an
"army encryption device."

### 4a. What Q means on a military radio circuit

**Q-signals (Q-codes)** are a standardized three-letter radiotelegraph shorthand,
each beginning with **Q**, used since the early 20th century by maritime, aviation,
amateur, **and army/military** CW operators. Each code stands for a full
question-or-statement pair. The one that matters here:

- **QTH** — *"What is your position (in latitude and longitude, or by any other
  indication)?"* / *"My position is …"*
  ([giangrandi.org Q-code](https://www.giangrandi.org/electronics/radio/qcode.shtml),
  [radio-hobbyist](https://radio-hobbyist.com/ham-radio-q-codes/),
  [inmorsecode.com](https://inmorsecode.com/learn/q-codes/))

So a "Q as signed by army radio" is best read as a **Q-signal** — procedural
operator shorthand — **not** the name of an encryption machine.

### 4b. Why this lands squarely on K4

The Kryptos courtyard's **Morse-code entrance slabs** (perforated copper in red
granite, flanking the walk to the New Headquarters Building) carry these fragments:

```
VIRTUALLY INVISIBLE
DIGETAL INTERPRETATIT   (deliberately misspelled)
SHADOW FORCES
LUCID MEMORY
T IS YOUR POSITION      (often read [WHA]T IS YOUR POSITION)
SOS
RQ
```

([solvekryptos.com/about](https://solvekryptos.com/about),
[puzzling.stackexchange](https://puzzling.stackexchange.com/questions/25931/unsolved-mysteries-kryptos),
[kryptosfan Morse page](https://kryptosfan.wordpress.com/morse-code/))

The chain that ties the Q-signal lead to the recovered plaintext:

1. **QTH = "your position."** The Morse slab literally says **"T IS YOUR
   POSITION"**, and the recovered K4 plaintext says **"THIS IS YOUR POSITION X"**.
   Both are the plain-language expansion of the Q-signal **QTH**.
2. **Q brackets the solved text.** K3's final sentence, `CAN YOU SEE ANYTHING?`, is
   bracketed by an **X** and a **Q**; the Morse slab carries a standalone **RQ**;
   K3 ends in **Q**. Q is used on the sculpture the way a CW operator uses a
   Q-signal — as a procedural marker around content, not as a plaintext letter.
   ([Wired 2009](https://www.wired.com/2009/04/ff-kryptos/),
   [puzzling.stackexchange](https://puzzling.stackexchange.com/questions/25931/unsolved-mysteries-kryptos))
3. A long-standing community observation (2013): **"QTH is Morse for 'what is your
   position.' K3 ends in a Q,"** with a proposed `OB → TH` step (key `RQ`) at the
   head of K4 (`OBKR…`).
   ([kryptosfan Morse comments](https://kryptosfan.wordpress.com/morse-code/))

### 4c. "Maybe an army encryption device"

Assessed and, on the evidence, **downgraded**:

- Sanborn's cryptographic collaborator was **Edward Scheidt**, retired chairman of
  the CIA's Cryptographic Center, who built K1–K3 from **classical hand systems**
  (keyed Vigenère on the KRYPTOS alphabet; columnar transposition) and described
  K4 as needing a "second level" / masking layer — hand methods, not a named
  machine.
  ([Popular Mechanics](https://www.popularmechanics.com/technology/security/a30750852/cia-kryptos-puzzle/),
  [Wired 2009](https://www.wired.com/2009/04/ff-kryptos/))
- No first-party source ties K4's method to a specific army cipher device (SIGABA,
  M-209, KL-7, etc.). The auctioned "K4 coding system" is described as Sanborn's
  own charts and method, not a machine.
  ([RR Auction](https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/))

**Conclusion.** The **Q** here is a **Q-signal from army/military radiotelegraph
procedure** — specifically **QTH ("your position")**, which the sculpture states
twice (Morse "T IS YOUR POSITION"; K4 "THIS IS YOUR POSITION"). It is a thematic /
procedural marker consistent with the navigational reading of K4 (compass rose →
bearing → position → waypoint). It is **not** evidence of an army encryption
*device*; the method is classical/hand-built per Scheidt, and is what Paradigm now
holds privately. This is a **navigational-radio motif**, recorded as a well-sourced
interpretation, not a decryption.

---

## 5. The archives and the boxes — where solutions are submitted now

"Go through the archives and boxes for the solutions submitted" resolves to three
distinct custody layers:

### 5a. Smithsonian Archives of American Art — sealed
Sanborn's donated papers (the accidental K4-plaintext strips, coding charts) live
here. **Sealed for 50 years at Sanborn's request — closed until 2075.** This is the
archive that produced the recovery; it is now off-limits.
([Scientific American](https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/))

### 5b. RR Auction lot — the physical "boxes"
The single comprehensive archive lot ("The Complete Secrets of Kryptos") included,
per RR Auction:
- Sanborn's **handwritten plaintext of K4**;
- the **original K4 coding system**;
- the **unpublished 1988 alternate K1** plaintext + coding chart;
- the **unpublished 1988 alternate K4** plaintext + coding chart — **now known as
  K5**;
- handwritten, signed **screen-cutting plaintexts**;
- the original **scrambled texts shown to the Department of Historical
  Intelligence**;
- a mini-model of the sculpture and other ephemera.

Sold Nov 20, 2025 for **$962,500** to an anonymous buyer, who also gets a private
afternoon with Sanborn walking through K4 and K5.
([RR Auction](https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/),
[Wired 2026](https://www.wired.com/story/crypto-guys-bought-the-answer-to-the-cias-mysterious-kryptos-sculpture/))

### 5c. Paradigm — the live submission verifier
As of **June 12, 2026** the buyer is **Paradigm**. Solutions are now submitted at
Paradigm's new Kryptos site. The verification design:

1. Sanborn typed the K4 plaintext into an isolated, new computer.
2. That device ran the plaintext through a **one-way function (SHA-256)**.
3. The hash was sent to **Google Cloud Key Management Service**, which produced a
   **keyed verification tag (HMAC)**.
4. A submission is hashed the same way and HMAC-checked — **matches without anyone
   (including Paradigm) ever seeing the answer**. Paradigm states it never opened
   the sealed envelopes containing the K4/K5 plaintext.

Operational facts:
- **$1 per submission** (Sanborn had charged $50) — the fee is anti-brute-force,
  not a prize entry; there is **no cash prize for K4 itself**.
- K1–K3 answers are published on the new site; K4 is the open target.
- A companion **CTF** of ten new Kryptos-like puzzles pays **$1,000** to each
  puzzle's first solver.
- **K5:** Sanborn says once K4 falls, K5 becomes solvable; Paradigm will then
  publish the encrypted K5. Paradigm holds sealed K4 **and** K5 plaintexts,
  unopened.

Sources:
[Paradigm — Project Kryptos](https://www.paradigm.xyz/writing/kryptos),
[Wired 2026](https://www.wired.com/story/crypto-guys-bought-the-answer-to-the-cias-mysterious-kryptos-sculpture/),
[Economic Times](https://economictimes.indiatimes.com/news/international/us/a-famous-10-foot-cia-sculpture-just-changed-hands-and-the-crypto-firm-that-bought-its-last-secret-says-it-hasnt-peeked-because-the-mystery-of-kryptos-is-still-the-point/articleshow/131702353.cms).

---

## 6. The Berlin Clock clarification (feeds the K4 reading)

When Sanborn revealed CLOCK (2014) he told solvers to "delve into that particular
clock." For 11 years the community assumed the **Mengenlehreuhr** (Set Theory
Clock / Berlin-Uhr). In **November 2025** Sanborn clarified the intended referent
is the **Weltzeituhr (World Clock) at Alexanderplatz** — Erich John's 16-ton,
~10 m turret world clock, opened 30 Sep 1969, showing 148 cities. Crucially it
**sits on a compass-rose mosaic**, mirroring Kryptos's own courtyard compass rose,
and dovetailing with the plaintext's opening "THE COMPASS ROSE IS HERE."
([solvekryptos.com/about](https://solvekryptos.com/about),
[Boxentriq](https://www.boxentriq.com/guides/kryptos-cipher-solutions))

---

## 7. Changes applied to the apps this pass

`public/apps/kryptos-vrml/index.html` and the standalone `apps/kryptos_vrml.html`
(kept byte-aligned):

- **K4 plaintext block:** kept the reconstructed reading and added the explicit
  "reconstruction, not transcription; a Sanborn-authentic variant may carry a
  deliberate misspelling (cf. IQLUSION / UNDERGRUUND / DESPARATLY / DIGETAL)"
  caveat.
- **New Q-signal note:** recorded QTH = "your position" as the Morse "T IS YOUR
  POSITION" ↔ K4 "THIS IS YOUR POSITION" link, and the X/Q + RQ bracketing, with
  the explicit finding that Q is a radiotelegraph Q-signal, **not** an army
  encryption device.
- **Submission/archive note:** recorded the three custody layers (sealed
  Smithsonian, RR Auction lot, Paradigm SHA-256→HMAC verifier at $1/submission),
  and the CTF.

See `docs/source-check-2026-09-29.md` for the per-claim verification.

---

## 8. Certainty ladder (how the apps should phrase things)

| Tier | Claim | Basis |
| --- | --- | --- |
| **Confirmed** | EAST / NORTHEAST / BERLIN / CLOCK at their positions | Artist-released cribs 2010–2020 |
| **Confirmed** | Plaintext recovered from Smithsonian archive Sep 2025; Sanborn authenticated it; method NOT publicly broken | Scientific American, Wired, RR Auction |
| **Confirmed** | $962,500 sale (Nov 20 2025); buyer = Paradigm; $1 SHA-256→HMAC verifier; K5 exists | RR Auction, Paradigm, Wired |
| **Confirmed** | Berlin Clock = Weltzeituhr at Alexanderplatz | Sanborn, Nov 2025 |
| **Confirmed** | K1/K2/K3/Morse deliberate misspellings (IQLUSION/UNDERGRUUND/DESPARATLY/DIGETAL) | Wired, Popular Mechanics |
| **Interpretation (well-sourced)** | Q = radiotelegraph Q-signal (QTH = "your position"); ties Morse slab to K4 "THIS IS YOUR POSITION" | Q-code refs + Morse-slab record |
| **Reconstruction (not confirmed)** | Full 97-char reading "THE COMPASS ROSE IS HERE…" and the Quagmire-III + one-bit-gate mechanism | solvekryptos.com back-solve |
| **Downgraded / unsupported** | K4 method is a named "army encryption device" | No first-party source; Scheidt built classical hand systems |
