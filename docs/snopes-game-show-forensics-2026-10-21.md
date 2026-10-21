# Snopes deep dive — game-show fakes and their forensics (21 Oct 2026)

*Request: “investigate snopes.com deep dive” — in the context of the
Jeopardy!/Wheel of Fortune corpus work
([`game-show-ghidra-research-2026-10-21.md`](game-show-ghidra-research-2026-10-21.md)).
A study of how the fact-checkers (and one unusually good amateur) dissect viral
game-show forgeries. Ratings and findings below are Snopes' own, cited by URL.*

## 1. The “Clam Digger” video (Snopes: **Fake**, 2020→2023)

<https://www.snopes.com/fact-check/wheel-of-fortune-clam-digger/> — a TikTok
clip (3.3M+ views) shows contestant “Darren” picking **N** instead of D on
`CLAM _IGGER`, with Pat Sajak's horrified reaction. Snopes' analysis chain:

1. **Plausibility gate:** if it had aired, news/blogs would have covered it —
   zero contemporaneous reports exist.
2. **Production forensics:** low-quality **green-screen** compositing; the
   contestant “Darren” is not in any episode guide.
3. **Source-episode reconstruction** (the best part, by former WoF winner
   **Robert Santoli**, added in the Nov 2023 update): the background is the
   **Dec 8, 2009** episode (reran Feb 5, 2011); footage from round 3 (puzzle
   *“SOLD TO THE HIGHEST BIDDER”*) was combined with Vanna's board from round 2
   (*“LOYAL & CEILING FAN”*), and individual letters were **butchered from
   other puzzles in the same episode** (the M from the bonus-round puzzle
   *“MAXIMUM PROFITS”*). That is puzzle-database-grade provenance work — the
   same reference data the DOS game corpora would contain.

## 2. “B*****s / Bitcoin is the future” (Snopes: **Fake**, 2021→2024)

<https://www.snopes.com/fact-check/wheel-of-fortune-bitches/> +
<https://www.snopes.com/fact-check/wheel-fortune-future-puzzle/> — a faked solve
pair (“Bitches in the future” fail → “Bitcoin is the future” win). Tells
catalogued: **wrong board font** (spotted in Reuters' Nov 2021 debunk), the
`@CryptoParody` watermark, and mixed real/fake provenance — visuals and audio
lifted from a genuine **2018** episode where a contestant really did guess
*“A group of pill-pushers”* (real answer likely *“A group of well-wishers”*),
with Sajak's genuine outburst re-contextualized. Two Snopes entries exist for
the same recycled fake — the meme resurfaced on TikTok (2023) and X (2024).

## 3. “_UCK _E IN THE A__ TONIGHT” (Snopes: **False**, 2015)

<https://www.snopes.com/fact-check/luck-be-in-the-air-tonight/> — the classic
board-image fake: claimed answer “Luck Be in the Air Tonight”. The **internal
consistency** check kills it: the I of “Air” would already be filled (the I's
in “in” and “tonight” are), so the claimed solve is logically impossible —
the board was Photoshopped. Snopes' own rule: *“the most logical answer is …
Photoshop.”* A beautiful minimal lesson: check the game's own rules (letter
fill state) before any pixel forensics.

## 4. Techniques distilled (usable on future forgeries)

| Technique | Where it appears | Binary-side analogue |
| --- | --- | --- |
| Consistency with game rules (letter-fill logic) | 2015 board fake | validate against a puzzle DB extracted from the games |
| Font/metadata mismatch | Bitcoin fake (Reuters) | string-encoding forensics in resource tables |
| Source-episode reconstruction | Clam Digger (Santoli) | provenance chains / corpus cross-greps (`sierra_xgrep`, `cow_level_xgrep` pattern) |
| Absence-of-coverage heuristic | Clam Digger | negative-result documentation |
| Watermark / origin tracing | Bitcoin fake (@CryptoParody) | uploader/metadata checks on preservation items |

Snopes' game-show beat lives at <https://www.snopes.com/tag/game-shows/> (also
cited via `web_search` captures; individual claims re-checkable at the URLs
above). Ratings taxonomy note: Snopes distinguishes **Fake** (manufactured
content) from **False** (authentic-looking content that is wrong) — the
game-show corpus is mostly the former.

## 5. Why this sits in this repo

The deep dive feeds the media-forensics posture the archive work already has
(preservation provenance, checksums, source-of-truth chains) and pairs with the
game corpora: an extracted puzzle database is exactly the reference that
decides whether a viral “episode puzzle” is real. No game footage or episode
rips are redistributed here — analysis and links only.
