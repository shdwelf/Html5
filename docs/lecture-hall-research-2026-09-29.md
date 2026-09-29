# Intelligence Lecture Hall — the Sanborn archive as a domain chain, 2026-09-29

This pass adds **one** record to the Cipher Machines & Cryptology suite's
Intelligence Lecture Hall (`Pc` array, hall count **24 → 25**):
`kryptos-k4-smithsonian`. It treats Jim Sanborn's Smithsonian archive as a
*provenance / domain chain* and source-checks every link against the
institution's own pages rather than the press summary of them.

- Reviewable source of the spliced text: `tools/patch_lecture_hall_kryptos.py`
- Proofs the record rests on: `tools/verify_lecture_hall.mjs` (count bumped to
  25; `kryptos-k4-smithsonian` added to the raised-bar list; four new content
  assertions)
- Crypto facts cross-checked in: `docs/sanborn-suite-deep-dive.md` and
  `docs/source-check-2026-09-29.md`
- Bundle patched: `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html`

## 0. Why this belongs in the hall

The hall's recurring lesson is that puzzles fall to *provenance work* as often as
to mathematics: the F5 challenges fell to published post-mortems, the Field Notes
wheel to a public ledger, Cicada to signed artifacts. Kryptos K4 is the purest
case yet — it "fell" in 2025 not to cryptanalysis but to two people reading the
plaintext off scraps in a public archive. So the record is built as a chain of
custody a reader can walk, and it never lets "recovered" read as "solved."

## 1. Primary source — the finding aid (utilised per request)

**Smithsonian Archives of American Art, "Jim Sanborn papers, circa 1945–2024"**,
call number **AAA.sanbojim**.

- Finding aid (HTML): <https://www.aaa.si.edu/collections/jim-sanborn-papers-22298>
- Biographical note: <https://www.aaa.si.edu/collections/jim-sanborn-papers-22298/biographical-note>
- Full container inventory: <https://www.aaa.si.edu/collections/jim-sanborn-papers-22298/contents-arrangement>
- Machine-readable **EAD XML**: <https://sirismm.si.edu/EADs/AAA.sanbojim-ead.xml>
- Finding aid **PDF**: <https://sirismm.si.edu/EADpdfs/AAA.sanbojim.pdf>

Facts taken verbatim from these pages:

| Field | Value |
| --- | --- |
| Size | **16.1 linear feet**, circa 1945–2024 |
| Immediate Source of Acquisition | **"Donated in 2023 and 2026 by Jim Sanborn."** |
| Processing | Processed by **Ricky Gomez**, 2024; finding aid updated 2026; EAD generated **2026-09-24** |
| Conditions Governing Access | **"This collection is open for research."** (no 50-year seal stated) |
| Related materials | Oral history interview with Sanborn by Avis Berman, 14–16 July 2009 |

## 2. The boxes — where the K4 plaintext actually lived

All Kryptos material is **Series 3: Commission Files, Box 6**, under the heading
**"Kryptos" CIA Headquarters**:

| Container | Folder title |
| --- | --- |
| 6:8 | Sculpture, 1993–2009 *(Digitized)* |
| 6:9 | Book, undated *(Digitized)* |
| 6:10 | Pre-Production and Notes, 1990–1999 *(Digitized)* |
| 6:11 | **Codes Research, circa 1980s–circa 2002** *(Digitized)* |
| 6:12 | Dedication, 1990 *(Digitized)* |
| 6:13–17 | **Correspondence, Attempts at Deciphering Codes** (1988–2015) *(Digitized)* |
| **6:18** | **Cracked Codes and Charts, 1990–circa 2013** *(Digitized)* |
| **6:19** | **Cracked Codes and Charts, circa 1999–2010** *(Digitized)* |
| 18:10–13 | Articles / Posters / Miscellaneous (Kryptos) |

The 2026 addition to Series 3 is described as *"additional articles, posters,
charts, and correspondence related to 'Kryptos'"* — the same word (**charts**)
the RR Auction catalogue used: *"copies of coding charts used to code Kryptos
(originals at the Smithsonian)."* The **"Cracked Codes and Charts"** folders
(6:18–19) are the coding-chart material the auction pointed at and where the K4
plaintext strips sat.

Same-name distractors the finding aid disambiguates: photographs of a **"Code
Room"** (Box 10:21) and a **"Compass Installation"** (Box 10:24) are separate
photo files; **Box 18:27** holds **Chase Brandon's 2011 reproduction requests for
his novel *The Kryptos Conundrum***. None is the K4 key.

## 3. Source-check on the "seal"

The press (Scientific American, Grokipedia summaries) reported that Sanborn asked
the Smithsonian to **seal the files for 50 years, until 2075**, and it complied.
Checking the institution's own record:

1. The **EAD generated 2026-09-24 still says "This collection is open for
   research."** No 50-year restriction is written into the finding aid.
2. The seal shows up **only as withdrawn images**: the "Cracked Codes and Charts"
   folders remain listed as *Digitized*, but the folder pages — live **and** the
   **22 Nov 2025 Wayback capture** — both display *"Image assets for this folder
   have not been fully processed."* The page images that revealed K4 are no
   longer served.

This is the honest, checkable version of "sealed": the *access statement* is
unchanged; the *digitised surrogates* were pulled.

## 4. archive.org (utilised per request)

Wayback CDX for `aaa.si.edu/collections/jim-sanborn-papers-22298*` confirms the
finding aid was public well before the discovery and that folder pages were
captured:

- `20240227` — collection landing page (200)
- `20250329` — contents-arrangement + Series 1–11 pages (200), **before** the
  September 2025 find
- `20251122` — `series-3/box-6-folder-10` captured (200), **after** the auction;
  its title still shows the older collection span **"circa 1950-2023"**, evidence
  the finding aid was revised when the 2026 addition landed (now "circa
  1945-2024").

Archived folder page:
<https://web.archive.org/web/20251122141135/https://www.aaa.si.edu/collections/jim-sanborn-papers-22298/series-3/box-6-folder-10>

## 5. The full domain / custody chain (what the record encodes)

```
Sanborn writes K4 plaintext (1990); cuts it into strips, tapes out of order
   for the CIA Office/Center of Historical Intelligence content review
        │
        ▼
Donated to Smithsonian AAA — 2023 (+ 2026 addition)   [aaa.si.edu]
        │  finding aid + EAD + PDF        [sirismm.si.edu]
        │  folders 6:18–19 digitised & public
        ▼
RR Auction catalogue (Aug 2025) cites "coding charts (originals at Smithsonian)"
        │
        ▼
Byrne photographs holdings 2 Sep 2025 → Kobek finds 5 pages of scrambled text
        │  Sanborn authenticates 3 Sep 2025
        ▼
Images withdrawn ("not fully processed"); access note still "open for research"
        │
        ▼
RR Auction "Decoding History" sale, 16 Oct–20 Nov 2025 → $962,500 (anonymous)
        │  lot = handwritten K4 plaintext + K4 coding system + 1988 alt-K4 (=K5)
        ▼
Buyer revealed 12 Jun 2026 = Paradigm → public verifier: SHA-256 → HMAC
   (Google Cloud KMS), $1/submission, nobody reads the answer
```

## 6. The record itself

- **id:** `kryptos-k4-smithsonian` · **confidence:** `Primary archive`
- **12 facts**, **8 source links**, summary and caution both > 200 chars — meets
  the hall's raised bar.
- It preserves the confirmed anchors (EAST/NORTHEAST/BERLIN/CLOCK) and labels the
  full "THE COMPASS ROSE IS HERE X …" reading a **community reconstruction**, not
  the sealed text; notes the Weltzeituhr/compass-rose clarification; and records
  the Q-signal (QTH = "your position") reading of the Morse slab as a motif, not a
  device.

## 7. Verification

`node tools/verify_lecture_hall.mjs` → **ALL CHECKS PASSED**, including:

- `lecture hall holds 25 records`
- `every record carries the full field set`
- `every record added or rewritten since 2026-09-14 meets the raised bar`
- `Kryptos record cites the finding aid (AAA.sanbojim, 16.1 ft) and the box/folder that held the charts`
- `Kryptos record keeps the source-check tension: reported 50-year seal vs finding aid still 'open for research'`
- `Kryptos record keeps recovered-not-solved: the cipher method was never publicly broken`
- `Kryptos record carries the onward custody chain: $962,500 sale, Paradigm steward, SHA-256→HMAC verifier`
- `inline app script re-parsed clean` · `record ids are unique`

## 8. Open threads for a later pass

- The **"twelve series"** note vs the **eleven** enumerated (Series 1–11) is a
  finding-aid inconsistency, recorded but unresolved — worth a reference-desk
  question, not a claim.
- If/when the 2026 addition is fully processed, the Kryptos box/folder numbers
  may shift; re-check `contents-arrangement` and the EAD before quoting them.
- The finding aid PDF was reachable via the page-retrieval service but returned
  transport code `000` to command-line `curl` in this sandbox (same limitation
  noted in `docs/source-check-2026-09-28.md`); treat that as a network boundary,
  not a dead link.
