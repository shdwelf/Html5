# Armstrong–Madison cipher: source review and offline workbench

**Review date:** 2026-11-17. **Cryptographic result:** no complete, independently verified decipherment established by this review. Research and software integration are bounded deliverables, not evidence that the historical cipher has been solved.

## 1. The supplied XDC is the integration target

The uploaded `armstrong-madison-cipher.xdc.xml` is a **ZIP/Webxdc archive, not XML**: 2,451,221 bytes, SHA-256 `9bd424b0c8349f30d6fb9872eab68d4db64281a689a3a5b0e4e0aeb5b80e7d96`. Its three entries are `index.html`, `manifest.toml`, and `icon.png`. The original is retained byte-for-byte at `apps/armstrong-madison/input/armstrong-madison-cipher.xdc`; per-entry identities are in [attachment.json](research/armstrong-madison-1808/attachment.json). The icon is supplied artwork, not documentary evidence.

The maintained build preserves the imported workbench's **18 original sections** and adds a default **Verified research** section, plus a separately readable `research.html`. It does not discard the original solver, concordance, statistical tools or historical notes. However, preserved narratives are **not newly certified research**. In particular, statements in the imported Combined text, piracy, Bastille, Arnold and related tabs do not establish what the encrypted letter says. The source-review banner makes that boundary visible on every section.

Two software defects/behaviors are addressed by narrow, hash-gated build patches:

- The imported working-key setter calls its own callback recursively instead of the React state setter. The replacement uses a bounded, validated workspace service. Assignment, AFIO-key loading and clearing must actually work, not merely render controls.
- The imported hook loads/saves browser storage and sends Webxdc updates automatically. The reviewed build starts with guesses **in memory only**. Local save/load/forget, JSON import/export and chat share/load are explicit actions. Incoming shared guesses are validated, buffered and applied only on request; later arrivals do not overwrite local work. Old `madison1808.key` data is not silently deleted or automatically restored.

The browser's public library and Android public/network inventories discover `public/apps/armstrong-madison/index.html`. The two-app private inventory and native microphone/network permissions are unchanged. This review does not claim a new Android APK build or physical Delta Chat/device certification.

## 2. Identification and primary evidence

The user's “maidson” is most plausibly **Madison**; the attachment independently makes the intended date explicit: **John Armstrong Jr. → James Madison, Paris, 20 February 1808**.

- [Founders Online, February letter](https://founders.archives.gov/documents/Madison/99-01-02-2728) supplies the date, clear opening “The”, numbers, graphical-writing placeholders and closing. It identifies **DNA, RG 59, Diplomatic Despatches, France**. The retained file is a normalized extraction, not a raw HTTP capture or a new manuscript transcription. This 99-series Early Access text is not a final authoritative edition.
- [NARA NAID 188671566, object page 29](https://catalog.archives.gov/id/188671566?objectPage=29) is M34 roll 14. The catalog download for object page 29 is `M34-014-0030.jpg`: **object page and scan filename are offset**. Cryptiana points to objects 29–32 and describes object 31 as a clearer duplicate of 30. This is a reported locator, not this review's own visual collation.
- The [Papers of James Madison image index](https://pjm.as.virginia.edu/john-armstrong-jr-james-madison-20-february-1808) links three image panels and the editorial text. An image panel, manuscript leaf and microfilm frame need not be the same unit.

**Acquisition limit:** the NARA catalog and UVA index were read, but the direct NARA JPEG request failed with HTTP 500. No manuscript image bytes or complete graphical transcription were acquired or bundled. Do not describe the typed reader as a facsimile, the icon as a scan, or placeholder shapes in the imported lab as real shorthand readings.

### Contemporary missing-key evidence

[Graham → Madison, 10 May 1808](https://founders.archives.gov/documents/Madison/99-01-02-3062) reports a letter in Armstrong's packet with a cipher key he could not find in the office. [Madison → Jefferson, 15 May 1808](https://founders.archives.gov/documents/Madison/99-01-02-3082) says:

> The undecyphered letter from A. was probably misaddressed to the Secretary of State. No such Cypher is in the office, and must be one concerted with another correspondent.

**Neither note names 20 February.** Identifying the missing-key item with the February outlier is a strong contextual inference used by the secondary research, not an explicit dated identification. Madison's “probably” must remain conditional. It does not prove the intended recipient, the key's loss forever, or that the letter was never subsequently decoded.

The Office of the Historian confirms [Madison was secretary of state through March 1809](https://history.state.gov/departmenthistory/people/madison-james) and [Armstrong was minister plenipotentiary in France, 1804–1810](https://history.state.gov/departmenthistory/people/armstrong-john). The later titles president and secretary of war are anachronistic for this letter.

## 3. What the AFIO announcement establishes—and does not

[AFIO's 27 May 2025 announcement](https://www.afio.com/member-news/2025/05/27/we-have-a-winner-in-the-armstrong-madison-encrypted-letter-contest/) names Yaacov Apelbaum as contest winner, prints a 60-word maritime paragraph and supplies **56 number-to-word labels**. The claim and every factual table pair were checked against the publisher page. The exact table and paragraph are retained for auditing, clearly labeled as claims.

An announcement is evidence that a solution was **claimed**, not a substitute for a complete, ordered number/graphic-to-text alignment. The publisher emphasizes grammatical coherence, period style, frequency and contextual comparisons, then dismisses unmapped codes as non-essential. Those procedures do not explain the missing numeric occurrences or the graphics.

Checking its two linked reference letters reveals another important limit:

- [15 July 1804](https://founders.archives.gov/documents/Madison/02-07-02-0460): travel arrangements, Hamilton's death and a report about France—not the maritime-neutrality discussion described by the announcement.
- [7 June 1806](https://founders.archives.gov/documents/Madison/02-12-02-0036): genuinely concerns the ship **Hope**, restitution and documents. Relevant background, but not the February key.

These reference/role errors deserve correction, but are not themselves a mathematical disproof. The stronger test is what the stated key actually renders, retaining unknowns and order.

## 4. Recomputed accounting: 365 / 366, not an unqualified 369

The audit uses the retained [Founders extraction](research/armstrong-madison-1808/founders-feb20.txt), the [publisher's key](research/armstrong-madison-1808/afio-key.json), and original local analysis code in `apps/armstrong-madison/analysis.mjs`.

| Reading policy | Numeric readings | Mapped occurrences | Coverage |
|---|---:|---:|---:|
| Fully printed numeric readings; damaged prefix excluded | **365** | **130** | **35.6164%** |
| Provisionally interpret `17⟨   ⟩` as the complete number 17 | **366** | **131** | **35.7923%** |
| Pinned GitHub comparison / naive digit extraction including editorial line counts | **369** | **133** | **36.0434%** |

Both defensible editorial-reading policies have **216 distinct numeric values** and **51 distinct values covered** by the claimed key. The five table codes absent from these readings are **6, 39, 131, 432 and 1358**. The strict reading leaves **235 numeric occurrences unmapped**, independently of the graphical material.

The GitHub comparison is exactly the stream obtained by blindly extracting all digit runs from the editorial body. It adds the **2** in “2 lines of symbols” and two **1s** in “1 line of symbols”. These are instructions about graphics, not cipher numbers. The comparison's table therefore overcounts code 1 twice and code 2 once. We preserve its pinned bytes and attribution rather than silently altering an upstream file. The result in [audit.json](research/armstrong-madison-1808/audit.json) is independently recomputed, not borrowed from the critique's headline numbers.

There are **34 editorial graphic descriptions**, expanding to **35 passage/line placeholders** because one describes two lines. This is not a count of 35 identified glyphs, shorthand words, or independently segmented manuscript units.

### Uncertainty is not silently repaired

- Founders prints **203**. The attachment and [Cryptiana](https://cryptiana.web.fc2.com/code/madison_armstrong.htm) instead suggest **1203**, with the specialist transcription marking uncertainty. The source-checked reader keeps Founders' reading and discloses the variant; the imported reader's variant is not relabeled as primary certainty.
- Cryptiana also questions a digit in an opening **1841**.
- The damaged **17** prefix may be part of a longer number. It is excluded by default and separately available as a provisional reading.
- A largest observed label of **1900** is not proof of a particular codebook size, alphabet, or system.

A permissive longest-common-subsequence diagnostic matches **40 of the announcement's 60 words**, leaving **90 of the 130 mapped numeric occurrences unused** in strict mode. This deliberately omission-allowing diagnostic is **not a validation score or statistical significance test**. It assumes the publisher's one-number/one-word assignments; the clear opening “The” and graphics are not supplied as wildcard words. Missing vocabulary could occur in graphical passages, so absence from the word table alone is not a disproof. A complete solution would still need to account for those passages and all repeated code occurrences.

## 5. The opening crib and shorthand hypothesis

The [15 February 1808 Armstrong → Jefferson letter](https://founders.archives.gov/documents/Jefferson/99-01-02-7420) really contains a recommendation of a bearer as active, sober, industrious and brave. This verifies the **parallel text**, not its proposed assignment to the cipher.

[Comments on Klaus Schmeh's article](https://klausschmeh.net/can-you-decipher-this-letter-sent-to-u-s-president-james-madison/) propose a recommendation opening, Taylor shorthand, optional zero padding and more complicated numerical models. Comments are kept separate from the article and primary editions. The commenter later retracts overconfident continuations. Notably, the primary open letter says **“man, and…”**, whereas the proposed cipher crib continues **“man of…”**.

The complete editorial readings do contain **26 distinct pairs of the form n and 10n**, reproduced in the audit. That observation does not establish equal meanings, the commenter's claimed chance expectation, or a rule to strip trailing zeros. No significance test or shorthand identification was executed here.

## 6. The August postscript is a different problem

The [Library of Congress record mjm015002](https://www.loc.gov/item/mjm015002/) and [Founders' August text](https://founders.archives.gov/documents/Madison/99-01-02-3466) identify a separate **30 August 1808** letter/postscript (digital ID `mjm.10_0520_0522`, reel 10).

[Cryptiana's reconstruction](https://cryptiana.web.fc2.com/code/decode20.htm) and the GitHub work reconstruct the familiar **THE=972** system using other letters, including a 4 May 1806 known plaintext. The GitHub near-complete August reading contains inferred assignments, two proposed transcription changes and a final **555→1555** emendation. These have not been independently collated with the scans in this review. They are not credited as our own recovered key and must not be presented as solving February.

## 7. Named metasearch services: actual outcomes

| Service / request | Observed outcome | What it does not establish |
|---|---|---|
| [baresearch.org](https://baresearch.org/search?q=Armstrong+Madison+cipher&categories=general&language=en) | Unquoted query and quoted 1808 follow-up returned no results | Absence of historical sources |
| [libresearch.space](https://libresearch.space/search?q=Armstrong+Madison+cipher&categories=general&language=en) | Useful Brave-derived Cryptiana/Schmeh leads; broken `http://go/v1` wrappers; quoted follow-up empty | Independent corroboration from each result; canonical pages were fetched separately |
| [utilibre.org](https://utilibre.org/en/) and [search.utilibre.org](https://search.utilibre.org/search?q=%22Armstrong%22+%22Madison%22+%22cipher%22) | Root is a tools directory; actual search endpoint queried, mostly unrelated names/companies/sports | A new cipher witness |
| [searx.space](https://searx.space/) | Instance directory inspected in that role | A cipher results page, or one independent search per listed instance |

Search-service output is volatile and may share upstream engines. Directory uptime/version/instance totals are not used to date or validate historical evidence. All nine bounded query families and their outcomes are recorded in [dossier.json](research/armstrong-madison-1808/dossier.json). The viewer is **not** a live metasearch client and sends no background queries.

## 8. GitHub, Internet Archive and Project Gutenberg

### GitHub

- `dbourdeau/cyphersolver` is pinned to **d8ac608093e1149f9456eaa2c99bb456ca0abc92**. Eight bounded files were obtained through GitHub's Contents/Blobs API; Git blob identities and SHA-256 values were verified. The retained comparison transcript remains under its upstream MIT notice. The [receipt](research/armstrong-madison-1808/github-receipt.json) distinguishes cached inspection files from the two retained upstream files. No downloaded solver was executed.
- [NoAutopilot/cipher-lab PR51](https://github.com/NoAutopilot/cipher-lab/pull/51), head **2abf1de5613b2248dbda2f75e8a70e851a971229**, is **closed, not merged**. Its Livingston duplicate alignment is explicitly provisional and assigns no February plaintext. Target-directory metadata was inspected after a recursive-tree API response failed; no complete second repository acquisition is claimed.
- GitHub metadata identifies `aryasn2026/cyphersolver` as a fork of the first project, not independent corroboration. Its README was discovery only; no source/license from that fork was imported.

### Internet Archive

The exact Armstrong/Madison/cipher-or-cypher Advanced Search returned two auction catalogs, not an identified February witness. Better-targeted searches located:

- [Madison, Letters and other writings, vol. 2 (1865)](https://archive.org/details/lettersotherwrit02madi): metadata and selected OCR around the 1808 material were inspected. No full-volume absence claim and no new plaintext/key.
- [Taylor's stenography essay (1786)](https://archive.org/details/bim_eighteenth-century_an-essay-intended-to-est_taylor-samuel_1786): bibliographic metadata confirms a relevant period source, not a symbol-by-symbol match.
- [Harding's Taylor-derived revision (1827)](https://archive.org/details/universalstenogr00hard): later context; it postdates the cipher and cannot establish the exact system used in 1808.

### Project Gutenberg

Direct Gutenberg ebook, HTML and text retrievals failed. Instead the full **1,300,025-byte** text of ebook **53767**, *The Writings of Thomas Jefferson*, vol. 5, was obtained from [GITenberg at 714c07904a75b84e7191cc9d1e5dfb48e1def1bb](https://github.com/GITenberg/The-Writings-of-Thomas-Jefferson-Vol-5-of-9-Being-His-Autobiography-Correspondence-Reports-Me__53767/tree/714c07904a75b84e7191cc9d1e5dfb48e1def1bb). The mirror's Git blob IDs, full-text hash, metadata and a retained **2 May 1808 Jefferson → Armstrong** excerpt are recorded in [gutenberg-receipt.json](research/armstrong-madison-1808/gutenberg-receipt.json).

A bounded case-insensitive literal search is recorded, not represented as exhaustive corpus cryptanalysis. Its one “the bearer of this” hit concerns **Jefferson → Dupont de Nemours, 2 March 1809**, not the February recommendation; the hit is retained separately. The May excerpt supplies context about communications with Armstrong, **not** an independently recovered cipher plaintext. The mirror's “Harden” spelling is retained, not silently changed to “Warden”. A mirror of the same edition is not another witness, and successful mirror retrieval is not described as successful direct Gutenberg acquisition.

## 9. Reproduction, packaging and safety boundaries

```sh
npm run build:armstrong-madison
npm run check:armstrong-madison
node --test tests/armstrong-madison.test.mjs tests/html5-offline-launcher.test.mjs tests/local-file-exports.test.mjs
node tests/armstrong-madison-browser.mjs
node --test tests/webxdc-packages.test.mjs
npm run check:app-catalog
node scripts/build-html5-offline-launcher-assets.mjs --check --profile public
node scripts/build-html5-offline-launcher-assets.mjs --check --profile private
node scripts/build-html5-offline-launcher-assets.mjs --check --profile network
```

- The builder verifies the immutable supplied ZIP and members before applying exact-match patches. Drift fails closed. A missing license for the supplied complete workbench is not silently replaced with an invented open-source grant; embedded React notices and retained comparison-file notices are included.
- The generated `armstrong-madison-cipher.xdc` is deterministic with pinned, timezone-free DOS ZIP wall-clock fields. That metadata is not an acquisition, review or validation timestamp. Fresh-build checks also run in `Pacific/Auckland` and `America/Los_Angeles`. Its root is `index.html` plus a valid `manifest.toml`, host bridge placeholder, artwork, report, notices and bounded evidence. Source identity, byte count and hash are in `docs/research/armstrong-madison-1808/build-receipt.json`; that receipt is deliberately outside its own hashed archive.
- `research.html` is self-contained and also embedded in the workbench, so portable HTML exports retain the review. The embedded review is sandboxed. No CDN, fonts, analytics, service worker, external automatic image loads, remote code or runtime search service is needed. CSP denies connection APIs; external citations require user navigation and may be blocked by offline hosts.
- Portable runtime XDC exports contain the embedded review, source report and notices but omit the optional artwork and separate evidence files. The repository-built XDC includes the full retained evidence. Exports do **not** silently include the in-memory or locally saved working key. Export guesses separately if wanted.
- Native Android saves, when an existing supported adapter is present, require a matching byte count and SHA-256 receipt. A browser download request is not reported as verified saved. No private-profile, origin, network, microphone or storage-read policy is broadened.

Validation outcomes are reported from actual command execution, separately from these reproducible commands. Desktop Chromium/ZIP checks are not physical-phone or Delta Chat certification.

## 10. Remaining cryptographic work

1. Acquire and collate primary scans; resolve digit alternatives and the damaged group with frame/crop coordinates.
2. Transcribe the graphical layer before identifying a shorthand or asserting plaintext lengths. Compare period originals rather than relying on a later revision alone.
3. Seek a retained plaintext/private key in appropriate correspondence collections. The Warden finding-aid PDF retrieval failed; no box inventory or newly discovered document is claimed and **no archival request was sent** by this review.
4. Test any opening crib against repeat constraints and held-out material. An attractive parallel and a coherent maritime paragraph are both inadequate substitutes for a full alignment.
5. Publish an exact model/key, ordered rendering of every numeric and graphical unit, justified emendations and independent validation. Do not discard inconvenient occurrences or declare the August reconstruction a February solution.

The complete source register, evidence levels, retrieval failures and next steps are bundled offline. **The honest stopping point is a reproducible review with unresolved evidence—not an invented decipherment.**
