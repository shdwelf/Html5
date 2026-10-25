# Google Sheets chat-relay — URL fill-in from OCR + Drive investigation

Date: 2026-10-25. Source: one handwritten-note photograph uploaded by the
user (`image-1.jpeg`, 3120×1697). Method: the photo was transcribed in
2×-upscaled segment crops (each spreadsheet ID read glyph-by-glyph),
the filled URLs were then probed against Google Drive via the
connected `google_drive` connector, and everything is preserved in a
BagIt bag (`dist/google-sheets-chat-relay-bag/`, gitignored; see §6).

Standing rule in force: **no verification, no claim.** Where Drive
could not confirm an ID, that is stated plainly below rather than
papered over.

## 1. What the note specifies (transcription)

The note designs a two-spreadsheet chat relay:

```
URI:  https://docs.google.com/spreadsheets/d/[uri]/edit
      ? usp = drive_link

CHAT A   tabs: Send | Receive | Chat AB
CHAT B   tabs: Send | Receive | Chat AB

Each side's Receive pulls the other side's Send:
  =IMPORTRANGE("<other sheet's ID>", "Send!A:A")
Ranges named on the note: Send!A:A and Receive!A:A.
```

So a message typed in A's `Send` appears in B's `Receive` (and vice
versa), and each `Chat AB` tab is where the conversation is read.

## 2. The three transcribed IDs

| # | Where it appears on the note | Transcription (44-char canon) | Probes |
|---|---|---|---|
| 1 | `IMPORTRANGE(" … ", "Send!A:A")` (first formula) | `1bERn8PAUgIyhZc3TXBTc27nz-SXiE3-LB2XzP04QBmQ` | 4 variants, all 404 |
| 2 | `IMPORTRANGE(" … ", "Send!A:A")` (second formula) | `1jW9wRA-1uN9Te9ODDY0rnfkoJVkd5kX0ex5AwMzcoSc` | 2 variants, all 404 |
| 3 | bare ID under the filled template at the foot of the note | insertion-mark reading — see below | 4 insertion candidates, all 404 (2 earlier deletion candidates also 404) |

Transcription notes and residual ambiguities (kept honest):

- **ID 1** — the glyph in `SXiE3` looks like a colon in the photo but
  is a dotted *i* (a colon cannot occur in a Drive ID; `i` also makes
  the count exactly 44). `LB2` vs `L82`, and `UgI` (capital-I vs
  lowercase-L vs digit-1) are the classic confusables; the B and I
  readings were chosen from enlarged crops and the alternates probed.
- **ID 2** — one glyph after `Te9` is heavily scribbled out (treated
  as deleted by the writer; without it the count is exactly 44). The
  writer's zero is slashed (`Ø`), which pins `Y0` and `X0` as digit 0.
  `RA-1u` (digit-1 vs capital-I) is the residual confusable; both
  readings probed, plus the `RA-Zu` and leading-`I` re-reads (§4).
- **ID 3** — first pass read the raw glyph string as
  `1ivT2F7BMYzYOhOMx[blot]1IsDmpdStP2g5HaZ1KZ1_2VJzMEY` (45 glyphs)
  and dropped one of the `Mx[1]Is` pair to reach 44 chars:
  - P1: `1ivT2F7BMYzYOhOMx1sDmpdStP2g5HaZ1KZ1_2VJzMEY`
  - P2: `1ivT2F7BMYzYOhOMxIsDmpdStP2g5HaZ1KZ1_2VJzMEY`
  On the user's correction — the little ∧-shaped marks are **insertion
  carets** (the bracketed glyphs above the line are inserted at the
  caret point, not baseline text) and a crossed O is **0** — ID 3
  re-reads as the writer's own pattern
  `1ivT2F7BMYzYOhOMx[l,1]SDmpdStP2g5Ha2lK2l_2VJzMeY`, i.e. one inserted
  glyph (`l` or `1`) after `Mx`, then baseline `S`, and the tail
  bracket insertions turn `Z1KZ1` into `2lK2l`. Both bracket choices
  are exactly 44 chars:
  - N1: `1ivT2F7BMYzYOhOMxlSDmpdStP2g5Ha2lK2l_2VJzMeY`
  - N2: `1ivT2F7BMYzYOhOMx1SDmpdStP2g5Ha2lK2l_2VJzMeY`
  (Final-`MEY` capital-E variants of N1/N2 were also probed.)

## 3. Complete URLs (template filled)

Filled into the note's own template
`https://docs.google.com/spreadsheets/d/<ID>/edit?usp=drive_link`:

1. `https://docs.google.com/spreadsheets/d/1bERn8PAUgIyhZc3TXBTc27nz-SXiE3-LB2XzP04QBmQ/edit?usp=drive_link`
2. `https://docs.google.com/spreadsheets/d/1jW9wRA-1uN9Te9ODDY0rnfkoJVkd5kX0ex5AwMzcoSc/edit?usp=drive_link`
3. `https://docs.google.com/spreadsheets/d/1ivT2F7BMYzYOhOMxlSDmpdStP2g5Ha2lK2l_2VJzMeY/edit?usp=drive_link` (candidate N1, inserted `l`)
   `https://docs.google.com/spreadsheets/d/1ivT2F7BMYzYOhOMx1SDmpdStP2g5Ha2lK2l_2VJzMeY/edit?usp=drive_link` (candidate N2, inserted `1`)
   (Earlier deletion candidates P1/P2:
   `…/d/1ivT2F7BMYzYOhOMx1sDmpdStP2g5HaZ1KZ1_2VJzMEY/edit?usp=drive_link`
   and `…/d/1ivT2F7BMYzYOhOMxIsDmpdStP2g5HaZ1KZ1_2VJzMEY/edit?usp=drive_link`.)

**Status: unverified.** Every URL above returned Drive API 404 from
the connected account (§4). They are the correct fill-ins of the
note's template from a careful OCR, but they are NOT confirmed-live
links.

## 4. Drive investigation (connected `google_drive` account)

What was actually checked, in order:

1. `validate_credential` — credentials valid (the connector does not
   expose the account identity).
2. Name search `name contains 'CHAT'` — **0 files**.
3. Full spreadsheet census, user corpora and `allDrives`, order by
   modified: **exactly 2 spreadsheets exist** in / are shared to this
   account, neither trashed:
   - `Field Notes Database` — `1xaLzkek8CIg7v-P37vlmvMW3PjBNClFp7Qu98FuoXfw`, created 2014-02-13, modified 2025-03-10.
   - `Agents of F.I.E.L.D.` — `1wblw6aHEL91QScBoOuL6qWPrPACO86uXbzqIF5xfp3s`, created 2018-11-24, modified 2023-07-22.
   Neither name nor ID matches anything on the note (excluded on
   metadata alone; their contents were not opened — out of scope).
4. `files.get` probes: ID-1 primary + `I→l`, `I→1`, `B→8` variants;
   ID-2 primary + `1→I` variant; ID-3 candidates P1, P2 —
   **every probe returned Google Drive API 404 "File not found"**.
5. Second pass (user's insertion-mark correction): ID-3 N1, N2 and
   their final-`MEY` variants; ID-2 `RA-Zu…` and leading-`I` re-reads
   — **all 404 again**. The spreadsheet census re-run on the second
   pass still returns exactly the same 2 files, so the account's
   accessible set has not changed.

## 5. Interpretation

- Drive returns the *same* 404 for "file does not exist", "file is
  not shared with this account", and "file was deleted" — the API
  cannot distinguish them, and neither can this report.
- The census is the decisive fact: whatever the three IDs point to,
  **none of the note's sheets is in, or shared to, the connected
  Google account**, whose only spreadsheets date from 2014/2018. The
  most parsimonious reading is that CHAT A / CHAT B (and the third
  file) live in the note-writer's own Google account and were never
  shared here. A simultaneous one-glyph OCR error in both 44-char
  formula IDs — after segment-crop transcription and alternate-glyph
  probes — is possible but less likely.
- Consequently the content investigation (tab names, `Send`/`Receive`/
  `Chat AB` values, `IMPORTRANGE` formulas as actually stored, sharing
  settings) **could not be performed**. No content claims are made.
- To close this out, either (a) share the sheets to the connected
  account (view access is enough), or (b) open each sheet in a
  browser and paste the ID from the URL bar. Then the census,
  tab/formula read-back, and permission listing can be completed and
  the URLs above promoted from "transcribed" to "verified".

## 6. BagIt preservation

Bag (RFC 8493), gitignored per the house convention for Drive-derived
material: `dist/google-sheets-chat-relay-bag/`

```
bagit.txt  bag-info.txt  manifest-sha256.txt  tagmanifest-sha256.txt
data/source-image-1.jpeg        (copy of the user's uploaded photo)
data/ocr-transcription.md       (full note transcription + glyph notes)
data/sheet-ids.json             (IDs, variants, URLs, probe status)
data/drive-investigation.json   (census + all probe results)
data/complete-urls.txt          (the §3 URLs, one per line)
```

This committed document is the bag's human-readable register.

## 7. Third pass — three patterns tried; fresh valid set created

The user supplied three ID-3 patterns:

1. `1ivT2F7BMYzYOhOMx[l,1]SDmpdStP2g5Ha2[1,l]K2[l,1]_2VJzMeY` (8 expansions)
2. `1ivT2F7BMYzYOhOMx[l,1]SDmpdStP2g5Ha2lK2l_2VJzMeY` (= N1/N2, already 404)
3. `1ivT2F7BMYzY[0,O]h[0,O]Mx[l,L,1]SDmpdStP2g5Ha2[L,1,l]K2[l,L,1]_2VJzMeY`
   (108 expansions; only the rule-prioritised subset was probed:
   crossed-zero `0h0`, `0hO`, `Oh0` with inserted `l`/`1` and the
   `2lK2l` tail — the remaining 100 are unfocused glyph permutations
   and were not brute-forced.)

Every newly probed expansion (6 from pattern 1, 6 targeted from
pattern 3) returned Drive API 404, and the spreadsheet census still
lists only the same 2 unrelated files. Conclusion unchanged: the
note's sheets are not accessible to the connected account.

Per the user's fallback preference ("rather have three valid sheet
ids two for chat and one to work on"), a fresh set was created in the
connected Drive and verified by `files.get`:

| Sheet | ID | Complete URL |
|---|---|---|
| CHAT A | `1HYP7RCRSpXG7F6r_1z6nJWDrM2BV4hrtTOo0gsqN1vY` | `https://docs.google.com/spreadsheets/d/1HYP7RCRSpXG7F6r_1z6nJWDrM2BV4hrtTOo0gsqN1vY/edit?usp=drive_link` |
| CHAT B | `1YBFY5wATQH65OZQCNiPAUut4LNL2Avr8qrJLRgP2e7o` | `https://docs.google.com/spreadsheets/d/1YBFY5wATQH65OZQCNiPAUut4LNL2Avr8qrJLRgP2e7o/edit?usp=drive_link` |
| Work Sheet | `1hkeFxMbHYW6oRqCVnvSaS_j3XSfN76avLZGM6EWdgNk` | `https://docs.google.com/spreadsheets/d/1hkeFxMbHYW6oRqCVnvSaS_j3XSfN76avLZGM6EWdgNk/edit?usp=drive_link` |

Investigation of the created set (read-back via Drive export):
- CHAT A / CHAT B each have tabs `Send | Receive | Chat AB`;
  `Send!A1:A2` carries the instruction line and a seed message;
  `Receive!A1` holds `=IMPORTRANGE("<other ID>","Send!A:A")`
  (verified in the exported workbook XML for CHAT A → CHAT B;
  CHAT B mirrors it). On first open, Sheets shows `#REF!` until
  "Allow access" is clicked for each IMPORTRANGE — expected.
- Three blank placeholder spreadsheets created during setup were
  moved to trash; only the table above is canonical.
- These new IDs are **verified valid** (Drive metadata retrieved).
  The note-derived IDs in §3 remain **unverified**.

## 8. Fourth pass — full pattern-3 expansion set (108)

Pattern: `1ivT2F7BMYzY[0,O]h[0,O]Mx[l,L,1]SDmpdStP2g5Ha2[L,1,l]K2[l,L,1]_2VJzMeY`
= 2×2×3×3×3 = **108 expansions**, all 44 chars. 14 were already probed
in passes 1–3; the remaining 94 were probed in this pass in
rule-prioritised order (crossed-zero `0h0` first, then `0hO`, `Oh0`,
`OhO`; inserted `l`, then `L`, then `1`; tail slots in pattern order).
One call (`…Oh0Mx1…2LK2L…`) first returned a transient Drive 400 and
was re-probed: 404. **Result: all 108 expansions return Drive API
404 from the connected account.** No expansion is a verified link;
combined with the unchanged census (only the 2 unrelated sheets plus
the §7 created set are accessible), the note's third sheet — like
IDs 1–2 — is not shared to this account. The §7 created set remains
the verified three-ID deliverable.

## 9. Fifth pass — capital-E variant set (108 more; 216 total)

The user extended the final slot to `M[e,E]Y`, giving
`1ivT2F7BMYzY[0,O]h[0,O]Mx[l,L,1]SDmpdStP2g5Ha2[L,1,l]K2[l,L,1]_2VJzM[e,E]Y`
= **216 expansions**. The lowercase-`e` half is §8 (108/108, all 404).
The capital-`E` half (108): 2 expansions had already been probed in
earlier passes (`…OhOMx[l,1]…Ha2lK2l_2VJzMEY`, both 404); the
remaining 106 were probed in enumerated order in this pass.
**Result: all 108 capital-E expansions return Drive API 404 from
the connected account; the complete 216-expansion sweep is now
exhausted with zero hits.** This closes the ID-3 bracket patterns:
no expansion of either the `MeY` or `MEY` reading is a verified
link, and the §7 created set (CHAT A / CHAT B / Work Sheet) remains
the only verified three-ID deliverable. Any future recovery of the
note's original sheets would require the files to be shared to the
connected account or exact IDs supplied from an account that can
open them.

## 10. Sixth pass — Pattern D (648 fresh expansions; superseded by §11)

Pattern: `1ivT2F7BMYzY[0,O]h[0,O]Mx[l,L,1]SDmpdStP2g5Ha[2,Z]][L,1,l]K2[l,L,1]_[Z,2]VJzM[e,E]Y`
(864 cells; the `Ha2 … _2` quadrant is exactly the 216 of §§8–9,
already all-404). The remaining **648 expansions** — quadrants
`(Ha2,_Z)`, `(HaZ,_Z)`, `(HaZ,_2)` — were probed in full via
`files.get`. **Result: 648/648 attempted — 634 returned named Drive
404; 14 returned an anonymous Drive HTTP 400 that does not name an
ID** (one each in index batches 72–89, 144–161, 162–179, 216–233,
270–287, 306–323, 414–431, 558–575, 576–593, 630–647 of the
648-list; two each in 126–143 and 594–611). At probe time these were
logged as transient and unresolved. §11 shows the same 400 signature
is in fact bound to specific IDs and hid the real sheet under the
Pattern E reading; Pattern D's fourteen 400-affected IDs were not
individually isolated, and since ID 3 is now verified under Pattern
E (§11), Pattern D is closed as a superseded reading. Its expansion
list is regenerable deterministically from the pattern above.

## 11. Seventh pass — Pattern E (lowercase `s`): ID 3 FOUND

Pattern (differs from Pattern D only by lowercase `s` after the
`Mx[l,L,1]` slot):
`1ivT2F7BMYzY[0,O]h[0,O]Mx[l,L,1]sDmpdStP2g5Ha[2,Z]][L,1,l]K2[l,L,1]_[Z,2]VJzM[e,E]Y`
= 2×2×3×2×3×3×2×2 = **864 expansions**, all 44 chars, structurally
disjoint from §§8–10 (uppercase `S`). Enumeration is combo-major
over `(Ha[2,Z], _[Z,2])`: quadrants `(2,2)` 0–215, `(2,Z)` 216–431,
`(Z,Z)` 432–647, `(Z,2)` 648–863.

**Sweep result:** all 864 probed via `files.get` — **851 returned
named Drive 404**; 13 batches (18–35, 72–89, 126–143, 216–233,
342–359, 360–377, 378–395, 432–449, 486–503, 504–521, 540–557,
720–737, 810–827) each contained exactly one **anonymous HTTP 400**.
Bisection of batch 18–35 isolated its 400 to a single ID,
deterministically:

- **Index 22: `1ivT2F7BMYzY0h0MxLsDmpdStP2g5Ha2LK21_2VJzMeY`**
  (winning glyphs: `YzY0`, `h0`, `Mx`=L inserted, lowercase `s`,
  `Ha2`, `[L,1,l]`=L, `K2`+`1`, `_2`, `M`+lowercase `e`+`Y`).
  It returns HTTP 400 through the connector on every operation tried
  — `files.get` (three field masks, incl. `supportsAllDrives`),
  `permissions.list`, text read, XLSX export, download, and copy —
  while all 17 batch-mates return named 404s.
- Anonymous web calibration agreed the ID is special: Google's
  usercontent download, `/open?id=`, and `lh3` thumbnail endpoints
  return **HTTP 500** for index 22 vs **404** for confirmed-404
  siblings (indices 18, 23); the Sheets/Docs apps show "does not
  exist" anonymously, as expected for a private file.

**Owner verification (2026-10-25):** the user opened
`https://docs.google.com/spreadsheets/d/1ivT2F7BMYzY0h0MxLsDmpdStP2g5Ha2LK21_2VJzMeY/edit`
in a signed-in browser and confirmed **it opens a spreadsheet**.
**ID 3 is therefore FOUND:** `1ivT2F7BMYzY0h0MxLsDmpdStP2g5Ha2LK21_2VJzMeY`.
This supersedes the ID-3 "unverified" status in §3 and the closing
remark of §9 for ID 3 (IDs 1–2 remain unverified).

**Access caveat (honest):** the sheet's title, tabs, and cells have
not yet been captured through tooling. A fresh census of the
connected account lists only 5 spreadsheets (CHAT A, CHAT B, Work
Sheet, *Agents of F.I.E.L.D.*, *Field Notes Database*) — ID 3 is not
shared to the connected account, which is why every connector call
on it fails (the uniform 400 is the connector's behaviour for this
file; the underlying Drive refusal is not further diagnosable from
here). Reading its contents requires sharing ID 3 to the connected
account, connecting the account that can open it, or the owner
relaying the contents.

The remaining 12 Pattern E 400-batches each contain one further
ID-bound-400 candidate by the same signature; those IDs were not
individually isolated and remain unresolved — they are not rival
candidates for the note's third sheet now that index 22 is verified.
The full 864-ID list and sweep state are preserved in the gitignored
sweep files (`dist/google-sheets-chat-relay-bag/sweeps/pattern5-ids.json`,
`pattern5-state.json`); earlier passes' gitignored bag payloads under
`dist/` do not persist across sandboxes, so this register is the
durable record.
