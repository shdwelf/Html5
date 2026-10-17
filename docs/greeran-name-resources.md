# Greeran Family Tree: name-resource review

- **Reviewed:** 16 October 2026
- **Scope:** the six name sources supplied for possible name-meaning, name-variant, or frequency enrichment.

## Decision and use

**NameAlmanac is the only one of the six supplied sources that presents meanings with an explicit source citation.** Its pages also present U.S. Social Security Administration (SSA) name-history data. A deeper review of its cited source led to a direct Wiktionary lookup and a small curated set of six paraphrased etymology notes in the app. Profiles with a usable first-name token can open NameAlmanac and Wiktionary using only that name. The app does not issue lookups or download name data in the background; the browser follows a link only after a user chooses it.

This is a research aid, not genealogical evidence. NameAlmanac's popularity data describes U.S. SSA birth registrations, not the people in this tree. Some rare, historical, or non-U.S. names may have no page or sourced meaning. No meaning, frequency, gender classification, or name variant has been copied into the GEDCOM, and no individual facts or relationships were changed. `greeran-family-4dwm.ged` remains the baseline export; the Kirkpatrick first-name merge is still pending a verified source GEDCOM and authorized data source.

Both lookups are optional and external: when clicked, a link contacts its destination with only the first name in the URL; links suppress the referrer. The rest of the app remains self-contained and makes no automatic lookup.

## Source-by-source review

| Supplied resource | What it actually offers | License and provenance notes | Decision |
| --- | --- | --- | --- |
| [NameAlmanac](https://namealmanac.com/about) | U.S. SSA given-name histories and, where sourced, short meanings quoted from Wiktionary. Example: [Mary](https://namealmanac.com/name/mary). | Its [terms](https://namealmanac.com/terms) offer site-created tables, charts, analyses, and text under **CC BY 4.0** with credit and a link. The underlying SSA counts and per-name count CSVs are public domain. Meaning quotations remain Wiktionary material under **CC BY-SA 4.0** and require Wiktionary attribution/share-alike. The site's meaning page identifies the Wiktionary entry and license; see also its [editorial policy](https://namealmanac.com/editorial-policy) and [methodology](https://namealmanac.com/methodology). | **Used as an on-demand link only.** No NameAlmanac page text or statistics are cached or copied into the app or GEDCOM. |
| [tfmorris/Names](https://github.com/tfmorris/Names) | Given-name and surname variants for genealogical search/matching; not a meanings dictionary. | The repository has an Apache-2.0 license, but its README says updates incorporating WeRelate material should respect **CC BY-SA**. It also documents inputs associated with Ancestry-labeled pairs, Behind the Name, WeRelate contributors, and published dictionaries. The compiled tables do not provide clear per-row rights/provenance. | Not copied. Potentially useful for a separately reviewed matching feature, but not safe to treat the whole table as uniformly Apache-licensed. |
| [FinNLP/humannames](https://github.com/FinNLP/humannames) | A large first-/last-name list in JSON and text formats; no meanings. | The repository uses MIT terms. Its README describes the data source as scraping social-media websites and government censuses, without per-record provenance or a separate data-rights map. | Not imported. It does not add meanings, and the data lineage is too broad for a useful, traceable family-tree enrichment. |
| [teamclairvoyant/NameDatabases](https://github.com/teamclairvoyant/NameDatabases) | A short README containing links to other name databases and matching projects; it is not itself a name dataset. | No license for the link list or linked datasets was identified in the repository. | Not copied. Used as a pointer list during this review only. |
| [KarlAmort/firstname-database](https://github.com/KarlAmort/firstname-database) | A first-name table with gender codes and country-specific frequency bands; no meanings. | The data file states **GNU Free Documentation License 1.2 or later** and identifies earlier authors and an updated source. Its README warns that gender classifications can vary across countries (and sometimes within a name). | Not imported. It could support a separately attributed frequency reference, but those categories must not overwrite or infer any person's recorded sex. |
| [Debdut/names.io](https://github.com/Debdut/names.io) | First- and last-name lists assembled from many upstream sources; no meanings. | The repository has an Apache-2.0 license. Its README lists many upstreams, including government data, public repositories, name sites, and reference works, without a per-source or per-record license map. A repository-level code/data license does not resolve those mixed upstream rights. | Not imported. No need for another broad names-only list, and its upstream reuse terms are not traceable enough for redistribution here. |

## Wiktionary deep dive and license check

The app links directly to the English Wiktionary page for each usable first name. For six names represented in this family tree, it also shows a short, paraphrased etymology note next to the source link: **Mary, John, William, Bernard, Hugh, and Catherine**. These are notes about a name form, not claims about an individual's identity, heritage, or personal meaning. For other names, the app offers the live Wiktionary link without inventing an offline summary.

Reviewing the actual entries shows why a single dictionary-style “meaning” can overstate the evidence:

- [Mary](https://en.wiktionary.org/wiki/Mary#English) traces the English form through Maria and earlier language forms, while describing the original meaning as uncertain.
- [John](https://en.wiktionary.org/wiki/John#English) presents “God is gracious” as a possible expansion of its Hebrew source, not as a certain meaning.
- [Catherine](https://en.wiktionary.org/wiki/Catherine#English) describes the etymology as debated and treats the association with *katharos* (“pure”) as folk etymology.
- [William](https://en.wiktionary.org/wiki/William#English), [Bernard](https://en.wiktionary.org/wiki/Bernard#English), and [Hugh](https://en.wiktionary.org/wiki/Hugh#English) provide historical forms and language roots; the entries do not all offer a simple, definitive gloss.

For licensing, the dedicated [Wiktionary CC BY-SA 4.0 license text](https://en.wiktionary.org/wiki/Wiktionary:Text_of_Creative_Commons_Attribution-ShareAlike_4.0_International_License) requires attribution and a license link; adaptations must be shared alike and changes identified. The separate [Wiktionary:Copyrights overview](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) marks itself outdated, so the review relies on the dedicated license text. The six app notes are paraphrases, preserve uncertainty, and are explicitly licensed under **CC BY-SA 4.0**. Their bundled notice is `assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md`; the rest of the app and the GEDCOM are not covered by that notice. No Wiktionary text has been added to the GEDCOM.

## Reuse and attribution guardrails

- Profile links are user-initiated and suppress the referrer. The NameAlmanac page is not reproduced in the app; its **About**, **Terms**, **Editorial Policy**, and **Methodology** pages are linked from [namealmanac.com](https://namealmanac.com/about).
- The six concise Wiktionary etymology notes are adaptations under **CC BY-SA 4.0**. Each profile note links to its source entry; the bundled attribution notice lists all six entries, the license, and the paraphrasing changes. Any additional copied or adapted Wiktionary material must receive the same attribution/share-alike care; do not imply the existing GEDCOM source data is licensed under that notice.
- If a future change copies a NameAlmanac analysis or chart, credit NameAlmanac and link to the source under **CC BY 4.0**. Keep that attribution alongside the copied material.
- Do not bulk-copy the `Names`, `humannames`, or `names.io` tables without reviewing their upstream data terms. Do not use a names-only list as proof of an individual's identity, sex, ancestry, or relationship.
- The local 1993 First Name Almanac shareware archive remains unused. Its contents were not extracted, and its redistribution notice is not permission to incorporate its database.

## Rebuild and related provenance

The selected lookups and curated notes are part of `greeran-family-4dwm.html`. The family-tree XDC includes the attribution notice at `assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md`; rebuild it and the documentation bundle with:

```sh
npm run build:greeran-family
npm run build:wikiinajar
npm run check:greeran-gedcom
```

See [`greeran-family-tree-ebook-and-data-status.md`](greeran-family-tree-ebook-and-data-status.md) for the earlier GEDCOM, Drive, EPUB, and package provenance.