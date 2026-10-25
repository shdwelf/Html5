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
