# Greeran Family Tree: name-resource review

- **Reviewed:** 16 October 2026
- **Scope:** the six name sources supplied for possible name-meaning, name-variant, or frequency enrichment.

## Decision and use

**NameAlmanac is the only supplied source that presents name meanings with an explicit source citation.** Its pages also present U.S. Social Security Administration (SSA) name-history data. The family-tree app now offers a user-initiated NameAlmanac link from an individual's profile. The app does not issue a lookup request or download name data in the background; the browser follows the external link only after a user chooses it. The URL contains only the selected person's first name.

This is a research aid, not genealogical evidence. NameAlmanac's popularity data describes U.S. SSA birth registrations, not the people in this tree. Some rare, historical, or non-U.S. names may have no page or sourced meaning. No meaning, frequency, gender classification, or name variant has been copied into the GEDCOM, and no individual facts or relationships were changed. `greeran-family-4dwm.ged` remains the baseline export; the Kirkpatrick first-name merge is still pending a verified source GEDCOM and authorized data source.

The link is optional and external: when clicked, the browser contacts NameAlmanac with only the first name in the URL; the link suppresses the referrer. The rest of the app remains self-contained and makes no automatic name lookup.

## Source-by-source review

| Supplied resource | What it actually offers | License and provenance notes | Decision |
| --- | --- | --- | --- |
| [NameAlmanac](https://namealmanac.com/about) | U.S. SSA given-name histories and, where sourced, short meanings quoted from Wiktionary. Example: [Mary](https://namealmanac.com/name/mary). | Its [terms](https://namealmanac.com/terms) offer site-created tables, charts, analyses, and text under **CC BY 4.0** with credit and a link. The underlying SSA counts and per-name count CSVs are public domain. Meaning quotations remain Wiktionary material under **CC BY-SA 4.0** and require Wiktionary attribution/share-alike. The site's meaning page identifies the Wiktionary entry and license; see also its [editorial policy](https://namealmanac.com/editorial-policy) and [methodology](https://namealmanac.com/methodology). | **Used as an on-demand link only.** No text or statistics are cached or copied into the app or GEDCOM. |
| [tfmorris/Names](https://github.com/tfmorris/Names) | Given-name and surname variants for genealogical search/matching; not a meanings dictionary. | The repository has an Apache-2.0 license, but its README says updates incorporating WeRelate material should respect **CC BY-SA**. It also documents inputs associated with Ancestry-labeled pairs, Behind the Name, WeRelate contributors, and published dictionaries. The compiled tables do not provide clear per-row rights/provenance. | Not copied. Potentially useful for a separately reviewed matching feature, but not safe to treat the whole table as uniformly Apache-licensed. |
| [FinNLP/humannames](https://github.com/FinNLP/humannames) | A large first-/last-name list in JSON and text formats; no meanings. | The repository uses MIT terms. Its README describes the data source as scraping social-media websites and government censuses, without per-record provenance or a separate data-rights map. | Not imported. It does not add meanings, and the data lineage is too broad for a useful, traceable family-tree enrichment. |
| [teamclairvoyant/NameDatabases](https://github.com/teamclairvoyant/NameDatabases) | A short README containing links to other name databases and matching projects; it is not itself a name dataset. | No license for the link list or linked datasets was identified in the repository. | Not copied. Used as a pointer list during this review only. |
| [KarlAmort/firstname-database](https://github.com/KarlAmort/firstname-database) | A first-name table with gender codes and country-specific frequency bands; no meanings. | The data file states **GNU Free Documentation License 1.2 or later** and identifies earlier authors and an updated source. Its README warns that gender classifications can vary across countries (and sometimes within a name). | Not imported. It could support a separately attributed frequency reference, but those categories must not overwrite or infer any person's recorded sex. |
| [Debdut/names.io](https://github.com/Debdut/names.io) | First- and last-name lists assembled from many upstream sources; no meanings. | The repository has an Apache-2.0 license. Its README lists many upstreams, including government data, public repositories, name sites, and reference works, without a per-source or per-record license map. A repository-level code/data license does not resolve those mixed upstream rights. | Not imported. No need for another broad names-only list, and its upstream reuse terms are not traceable enough for redistribution here. |

## Reuse and attribution guardrails

- The profile link opens the live NameAlmanac page; it does not reproduce that page's content. Its **About**, **Terms**, **Editorial Policy**, and **Methodology** pages are linked from [namealmanac.com](https://namealmanac.com/about).
- If a future change copies a NameAlmanac analysis or chart, credit NameAlmanac and link to the source under **CC BY 4.0**. If it copies a Wiktionary-derived meaning, cite the exact Wiktionary entry and preserve **CC BY-SA 4.0** for that material. Keep this attribution alongside the copied record; do not imply the existing GEDCOM source data is licensed under either license.
- Do not bulk-copy the `Names`, `humannames`, or `names.io` tables without reviewing their upstream data terms. Do not use a names-only list as proof of an individual's identity, sex, ancestry, or relationship.
- The local 1993 First Name Almanac shareware archive remains unused. Its contents were not extracted, and its redistribution notice is not permission to incorporate its database.

## Rebuild and related provenance

The selected lookup is part of `greeran-family-4dwm.html`; rebuilding the package also refreshes `greeran-family-4dwm.xdc` and the baseline GEDCOM snapshot:

```sh
npm run build:greeran-family
npm run check:greeran-gedcom
```

See [`greeran-family-tree-ebook-and-data-status.md`](greeran-family-tree-ebook-and-data-status.md) for the earlier GEDCOM, Drive, EPUB, and package provenance.