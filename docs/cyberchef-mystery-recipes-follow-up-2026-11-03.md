# Mystery-book cipher recipes: Drive follow-up and source review

**Research date:** 2026-11-03

**Scope:** Additional Google Drive source screening, book-specific cipher leads, and the smallest recipe changes supported by evidence. Here, “recipe” means a reusable CyberChef operation chain/preset, not a cookbook formula.

## Drive follow-up

The earlier screen was not a complete inventory. A second filename/content search found additional collections and reference works. No private Drive IDs, links, excerpts, or scans are included in this note.

| Drive material | What the available tools established | Research use / limit |
| --- | --- | --- |
| Hardy Boys | A second file whose name describes the original 58-book series is a 27.8 MB PDF, over the Drive reader’s 25 MB extraction cap. The earlier generic `application/octet-stream` bundle remains a separate item. | The larger PDF could not be text-reviewed; earlier zero-hit searches apply only to the first bundle. Neither file yielded an inspectable code table or page-level test vector. |
| Nancy Drew | Six book-bundle files remain EPUBs. | The Drive text reader does not extract these EPUBs, and full-text search gives no snippets, page numbers, or per-volume identification. |
| Sherlock Holmes | Drive has a complete-collection EPUB; its format is not extractable through the reader. | The relevant 1903 story was checked in the public-domain text at [Standard Ebooks](https://standardebooks.org/ebooks/arthur-conan-doyle/the-return-of-sherlock-holmes/text/the-adventure-of-the-dancing-men) and [Project Gutenberg](https://www.gutenberg.org/files/108/108-h/108-h.htm), rather than inferred from an EPUB keyword hit. |
| Tom Swift | The *Tom Swift Megapack* is a 12.9 MB PDF that the reader can extract. A Drive full-text query for “Morse” returned this file, but without any excerpt, title, or page. | The returned text began at the collection’s front matter/first story; the query does not identify which story or how a signal is represented. This is a lead only, not a basis for a new recipe. |
| *Codes and Ciphers: Julius Caesar, the Enigma, and the Internet* | A smaller PDF was text-extractable. Its contents list broad families such as substitution, polyalphabetic, transposition, Playfair, and book ciphers. | Used only as a high-level inventory check; no book text is reproduced. Those method families already have corresponding operations in the Kitchen, so the reference did not reveal a missing general-purpose primitive. Cambridge’s [publisher record](https://www.cambridge.org/9780521008907) gives bibliographic details. |

The central limitation remains: a Drive search hit is not a worked example. Results do not expose snippets or page numbers, and the accessible copies do not provide inspectable Hardy Boys/Nancy Drew passages through the reader.

## Book-specific findings

### *The Adventure of the Dancing Men* — word-end flags

Doyle’s public-domain story presents the figures as letters in a substitution system. Holmes treats the small flags as a likely way to break the message into words; the narrative describes this as a hypothesis he tests against the other messages. The flag convention is therefore supported by the primary story text, while the existing app’s complete 26-letter ASCII stand-in table is a modern reconstruction, not a transcription of every original drawing.

**Kitchen change:** the existing `gcwDancingMen` operation now has an optional **Word boundaries** setting. In flag mode, encoding appends `⚑` after each word’s final symbol and decoding restores the spaces. The old unflagged mode remains the default for compatibility. A named **Sherlock Holmes — Dancing Men (word-end flags)** recipe preset selects the source-faithful flag behavior. The marker is explicitly documented as a text stand-in for the drawn flag.

### *Nancy Drew 16: The Clue of the Tapping Heels* — Morse word breaks

Penguin Random House’s catalog says the strange tapping sounds in the mystery come in Morse code ([book record](https://www.penguinrandomhouse.com/books/333717/nancy-drew-16-the-clue-of-the-tapping-heels-by-carolyn-keene/)). International Morse is already implemented, so this does not justify a new cipher primitive. It did reveal a useful decoder issue: the app’s encoder uses `/` between words, but the decoder discarded those boundaries.

**Kitchen change:** decoding now joins letters within each slash-delimited group and restores a space between groups, while the existing no-slash output remains unchanged. A **Nancy Drew 16 — Tapping Heels (Morse decoder)** preset selects decode mode. It accepts written dot/dash Morse; it does not infer dots, dashes, or timing from audio or raw tap sequences.

### *Nancy Drew 44: The Clue in the Crossword Cipher* — no confirmed reusable cipher

The publisher’s catalog confirms the book and describes a worn crossword clue on a wooden plaque, but does not specify a general cipher procedure ([book record](https://www.penguinrandomhouse.com/books/333744/nancy-drew-44-the-clue-in-the-crossword-cipher-by-carolyn-keene/)). A 2026 reader review reports that the clue resolves to intersecting words in another language rather than a conventional cipher ([PuzzCulture review](https://puzzculture.com/2026/07/07/summer-reading-nancy-drew-44-the-clue-in-the-crossword-cipher/)). That is a secondary reading, not page-level verification from the Drive copy. The title alone is not enough to code a “crossword cipher” operation; none was added.

### *Hardy Boys 18: The Twisted Claw* — code-sheet lead, not a specification

The publisher confirms the title and edition ([book record](https://www.penguinrandomhouse.com/books/333659/hardy-boys-18-the-twisted-claw-by-franklin-w-dixon/)). A community summary reports that the story uses Fenton Hardy’s code sheet, but does not provide a complete reproducible table ([secondary summary](https://hardyboys.fandom.com/wiki/The_Twisted_Claw_(original_text))). The newly found Drive PDF exceeds the reader’s extraction cap. There is still no verified mapping, page reference, or test vector, so no Hardy Boys decoder was added.

## Recipe decision and checks

Two source-informed presets were added, and two existing decoder behaviors were made faithful to their documented word separators. No new cipher algorithm was inferred from Drive keyword hits, and no private Drive content was copied into the repository.

The new test file pins the fixed vector `D A` → `<o>|⚑ o/|\⚑` against the modern stand-in table and flag placement, in addition to checking alphabet uniqueness, flagged multiword round trips, backward-compatible unflagged output, Morse slash-separated word round trips, and both recipe presets. See [`tests/cyberchef-mystery-recipes.test.mjs`](../tests/cyberchef-mystery-recipes.test.mjs).

## Sources

- Doyle, Arthur Conan. “The Adventure of the Dancing Men,” in *The Return of Sherlock Holmes*: [Standard Ebooks text](https://standardebooks.org/ebooks/arthur-conan-doyle/the-return-of-sherlock-holmes/text/the-adventure-of-the-dancing-men); [Project Gutenberg collection](https://www.gutenberg.org/files/108/108-h/108-h.htm).
- Penguin Random House catalog records: [Nancy Drew 16](https://www.penguinrandomhouse.com/books/333717/nancy-drew-16-the-clue-of-the-tapping-heels-by-carolyn-keene/), [Nancy Drew 44](https://www.penguinrandomhouse.com/books/333744/nancy-drew-44-the-clue-in-the-crossword-cipher-by-carolyn-keene/), [Hardy Boys 18](https://www.penguinrandomhouse.com/books/333659/hardy-boys-18-the-twisted-claw-by-franklin-w-dixon/).
- PuzzCulture, “Summer Reading: Nancy Drew #44: The Clue in the Crossword Cipher,” 2026-07-07 (secondary review): https://puzzculture.com/2026/07/07/summer-reading-nancy-drew-44-the-clue-in-the-crossword-cipher/.
- *Codes and Ciphers: Julius Caesar, the Enigma, and the Internet*, R. F. Churchhouse, Cambridge University Press: https://www.cambridge.org/9780521008907.
