# Hardy Boys and Nancy Drew cipher-source screen for CyberChef Kitchen

**Date:** 2026-11-02
**Purpose:** Record the initial private Drive search for source material that could support CyberChef Kitchen recipes. In this repository, “recipe” means a reproducible transform/operation chain, not a cookbook recipe. This is a **keyword screen**, not a full-text reading or a claim that a novel defines a cipher algorithm.

**Follow-up:** The 2026-11-03 review found additional Drive files and supported two source-informed presets; see the [follow-up note](cyberchef-mystery-recipes-follow-up-2026-11-03.md). The original Hardy Boys zero-hit results below apply only to the first `application/octet-stream` bundle, not the separate PDF found later.

## Drive search results and limitations

The initial 2026-11-02 Drive filename search found one Hardy Boys collection stored as `application/octet-stream` and six Nancy Drew collections stored as EPUBs. A later search identified a separate 27.8 MB Hardy Boys PDF that exceeds the reader’s extraction cap. No private Drive file IDs, links, excerpts, or scans are reproduced here.

| Corpus | Drive full-text screen | What can be concluded |
| --- | --- | --- |
| **Nancy Drew** | All six returned for `cipher` and `substitution`; five for `code`; two for `cryptogram`; one for `Morse`, `transposition`, and `decoder`. All six also returned for the title/phrase searches `crossword`, `tapping`, and `Red Gate Farm`. | The Drive index associates cipher-related terms with the collection, but it returns no snippets, page numbers, or distinct novel titles. The six files cannot be mapped to individual editions from these results. A hit is a lead, not a verified worked cipher. |
| **Hardy Boys** | The original bundle returned no results for `cipher`, `code`, `cryptogram`, `Morse`, `substitution`, `telegraph`, `transposition`, `decoder`, `secret code`, or `Twisted Claw`. The separate PDF exceeds the reader’s extraction cap. | The first file is not text-extractable because of its stored media type; the second is too large for the reader. These limits leave the source **inconclusive** and do not show that the books contain no codes. |

The Drive reader does not extract EPUB or generic `application/octet-stream` files; the later Hardy Boys PDF is over its 25 MB extraction cap. It could not read the Nancy Drew EPUBs or the first Hardy Boys bundle. Queries for common titles/terms matched all six Nancy Drew files, so the results do not isolate a specific volume. “Recipe,” “cook,” and “cooking” queries likewise returned matches without excerpts; those are not usable evidence of either culinary recipes or cryptographic methods.

## Publicly verifiable candidate leads

| Candidate | Publisher/catalog evidence | Recipe value now |
| --- | --- | --- |
| ***Nancy Drew 16: The Clue of the Tapping Heels* (1939)** | [Penguin Random House's catalog page](https://www.penguinrandomhouse.com/books/333717/nancy-drew-16-the-clue-of-the-tapping-heels-by-carolyn-keene/) explicitly identifies Morse-code tapping as part of the mystery. | The app already has International Morse, so this does not require a new cipher primitive. The later source-based preset and slash-word-boundary fix are documented in the [follow-up note](cyberchef-mystery-recipes-follow-up-2026-11-03.md). The Drive search did not reveal the relevant page or edition. |
| ***Nancy Drew 44: The Clue in the Crossword Cipher* (1967)** | [Penguin Random House's catalog page](https://www.penguinrandomhouse.com/books/333744/nancy-drew-44-the-clue-in-the-crossword-cipher-by-carolyn-keene/) confirms the title, edition, and series. | The title alone does not specify an algorithm. A “crossword cipher” may be a bespoke puzzle construction rather than a reusable cipher; inspect a lawful copy before coding. |
| ***Hardy Boys 18: The Twisted Claw* (1939)** | [Penguin Random House's catalog page](https://www.penguinrandomhouse.com/books/333659/hardy-boys-18-the-twisted-claw-by-franklin-w-dixon/) confirms the book and edition. A [community summary of the original text](https://hardyboys.fandom.com/wiki/The_Twisted_Claw_(original_text)) reports a Fenton Hardy secret-code sheet, but the publisher synopsis does not document its mechanics. | A secondary lead only. The Drive file was not searchable, so neither the book's presence in that file nor the code's exact mapping is confirmed. Do not implement a guessed code table. |

## CyberChef decision

**No operation or recipe was added from the 2026-11-02 keyword screen itself.** The Drive results did not provide an algorithm, a worked example, or a source page suitable for a test vector. Existing Kitchen operations already cover Morse and common classical transforms; `danBrownCodes` and `danBrownAll` are also present in the app. The later source-based presets are documented separately in the [2026-11-03 follow-up](cyberchef-mystery-recipes-follow-up-2026-11-03.md). Adding a “Hardy Boys cipher” or “Nancy Drew cipher” from a title or keyword match would overstate the evidence.

A future recipe should require a named edition and page, a directly observed rule or example, an independent test vector, and a duplicate check against current operations. The Hardy Boys source needs a text-searchable, lawfully accessible copy; the Nancy Drew hits need snippets/page references that distinguish the relevant book. Keep private Drive copies and links out of the public repository.
