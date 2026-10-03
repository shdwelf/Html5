# Los Alamos badge archive — no-filter domain deep dive

> **Bibliographic index:** [Source-check bibliography](source-check-bibliography.md) — normalized references, source-status notes, and coverage audit.

Reviewed **30 September 2026** after the filename-variation pass. This note is
an unfiltered source-domain investigation for the full Project Y badge surface in
`los-alamos.html`: the 1,404-file Commons snapshot, the seven curated local
records, the Bulletin montage context, and the LANL/NSRC restoration chain.

## Executive finding

The strongest chain is now:

1. **LANL / NSRC custody and restoration** — the badge-photo collection is held by
   LANL's National Security Research Center, restored beginning in FY20, and
   digitized/released through LANL public channels.
2. **OSTI report wrappers** — DOE/OSTI preserves the public-release records and
   gives stable LA-UR numbers for the restoration/digitization story.
3. **LANL public history pages and assets** — the public `www.lanl.gov` Historic
   Badges page and Vault article explain the restoration and provide the current
   canonical public doorway.
4. **Wikimedia Commons** — Commons is the app's practical per-file catalog and
   image-delivery layer, with individual file histories, rights statements, and
   source links.
5. **Secondary/contextual sources** — Wellerstein, Bulletin, AHF/Nuclear Museum,
   NPS, and PICRYL are useful for discovery and interpretation but should not
   overwrite file-level provenance.

The important correction from the earlier source check is that the current LANL
page is reachable as:

```text
https://www.lanl.gov/about/history-innovation/badges
```

Older Commons records and the 2023 OSTI article cite the older-looking
`https://about.lanl.gov/history-innovation/badges/` path. That older path should
be preserved when quoting a file page, but the app should prefer the `www.lanl.gov`
canonical page for current human-readable context.

## Source/domain matrix

| Domain / artifact | Authority level | What it proves | What it does **not** prove |
| --- | --- | --- | --- |
| `www.lanl.gov/about/history-innovation/badges` | First-party current public page | LANL presents Historic Badges as restored images of more than 1,400 Manhattan Project workers; the page links to the Vault restoration article and shows a gallery/index frame. | The fetched HTML does not expose a complete per-person data table; it is not a badge-issue ledger. |
| `www.lanl.gov/media/publications/the-vault/0821-before-and-after` | First-party LANL restoration article | NSRC restored more than 1,400 badge photos; the photos are part of NSRC collections; restoration involved cleaning, removing stains/tape, and protective sleeves. | It does not list all names or badge codes. |
| `www.lanl.gov/media/publications/the-vault/0822-guarding-science` | First-party LANL security context | Wartime access was controlled by guarded gates, passes, background checks, and color/shape-coded badges. | It does not decode every letter-number badge identifier in the photo collection. |
| `www.osti.gov/biblio/1841894` / DOI `10.2172/1841894` | DOE bibliographic record for LA-UR-22-20541 | NSRC had several hundred badge photos; that collection was estimated at about 30% of total Project Y badge photos; many originals were believed destroyed or lost; the FY20/FY22 restoration workflow is documented. | The report's public extraction is a slide deck, not a database dump of all file records. |
| `www.osti.gov/biblio/1957895` / DOI `10.2172/1957895` | DOE bibliographic record for LA-UR-23-21584 | NSRC restored/digitized about 1,400 early badge photos, scanned/inventoried names and codes, and publicly exposed them through the Lab website; it explicitly says some people have multiple photos and codes. | It says code meanings remain uncertain; therefore codes cannot be interpreted as department, chronology, or clearance without more evidence. |
| `commons.wikimedia.org` / `upload.wikimedia.org` | Public repository and delivery CDN | Per-file title, file history, source, author, rights templates, dimensions, thumbnails, and stable file-page links. This is the app's practical A–Z file catalog. | User-uploaded metadata can contain stale source URLs, source typos, inconsistent rights templates, and alternate scans that are not reconciled. |
| `lanl.photoshelter.com` | Official-ish asset back end cited by Commons | Some high-resolution Commons uploads cite PhotoShelter item URLs and metadata marks PhotoShelter software. | Direct access triggered bot protection in this environment; do not make app runtime depend on it. |
| `cdn.lanl.gov` | LANL asset CDN | Delivers images embedded in LANL pages. | CDN URLs are assets, not citation records; they can change independently of page text. |
| `drive.google.com` folder in LA-UR-23-21584 | First-party-linked working folder | The 2023 LA-UR document points to a Google Drive folder for examples/access. | The folder URL is not a stable archival citation and should not replace OSTI/LANL/Commons links. |
| `nps.gov/mapr/.../lanl-badge-restorations.htm` | Official government mirror / archived release | Confirms the 2021 restoration story, names NSRC, and shows before/after examples. | The page is marked archived and not updated; use as corroboration, not the current canonical page. |
| `blog.nuclearsecrecy.com` | Expert secondary source by Alex Wellerstein | Confirms the older LANL low-resolution corpus was around 1,229 files, filename labels were programmatic, and source typos existed. | It is not a first-party LANL catalog and should not decide current file rights. |
| `thebulletin.org` | Contextual publication using the montage | Provides the curated "faces" framing and the user-requested reference montage. | The montage is not a readable roster, OCR source, or license source. |
| `ahf.nuclearmuseum.org` | Biographical/contextual secondary source | Useful for human-computing biographies and oral-history leads. | It is not the image-rights source for the Commons badge files. |
| `picryl.com` / `getarchive.net` mirrors | Derivative discovery layer | Exposes many high-resolution badge pages with scraped metadata, useful for search discovery and image-number hints. | Do not treat as authoritative provenance, rights, or identity verification. |

## Timeline reconstructed from the domain chain

| Date / era | Evidence | Source consequence |
| --- | --- | --- |
| 1943–1947 | Commons/LANL metadata commonly date the badge-photo collection to ca. 1943–1947; OSTI slide deck labels Project Y collection 1943–1945. | Keep dates approximate unless a file page supplies a stronger per-photo date. |
| Decades after WWII | OSTI LA-UR-22-20541 says many Project Y badge photos were destroyed or lost and existing NSRC photos had deteriorated. | Never claim the current 1,404-file index is a complete employee roster or all badges ever issued. |
| Older LANL wartime staff page era | Wellerstein's 2012 article and older Commons files cite `lanl.gov/history/wartime/staff.shtml` and 130 × 180 direct badge images. | Treat those URLs as historical source trails; direct paths now fail and should not be app dependencies. |
| 2012–2013 public montage era | Wellerstein built a 1,229-file composite from LANL filenames; Bulletin published a curated montage/context piece. | Useful context for why the collection matters; not a source for cell-by-cell identity mapping. |
| FY20 restoration | LANL/NPS/OSTI say NSRC physically restored the photos, removed debris/tape/stains, and put them in archival sleeves. | Explains newer high-quality image lineage and why old/new scans differ. |
| FY22 digital restoration / LA-UR-22-20541 | OSTI slide deck says digital restoration began and used peer review for historical accuracy in the first batch. | Newer files are not merely larger copies of old 130 × 180 scans; they can be restored derivatives with their own rights/notice trail. |
| Feb 2023 / LA-UR-23-21584 | OSTI says NSRC restored/digitized about 1,400 photos, scanned/inventoried names and codes over four months, and published them online. | This supports the app's 1,404-file scale while reinforcing that names/codes require source-level caution. |
| 2023 Commons high-resolution uploads | Commons file pages for Bacher, Feynman, von Neumann, Frankel, Metropolis and others cite LANL Historic Badges, PhotoShelter, or image metadata with `Project Y Badge Photos` and `LA-UR-22-25508`. | Keep high-resolution Commons files separate from older low-resolution alternates; do not transfer licenses blindly. |

## Badge codes and duplicates: updated boundary

The 2023 OSTI article is now the strongest source for the code caveat. It says:

- Project Y security badges were issued to staff and military personnel.
- Badge photos include codes.
- The code meaning remains a mystery; examples considered include department,
  security level, or chronology, but none is resolved there.
- Shape and color indicated role/security clearance, but this does not let a
  monochrome file title or source label decode an individual badge.
- NSRC staff found many people with multiple photos, sometimes with different
  codes. The public article gives examples: Raymond J. Bosnjak, Inez C. O'Brien,
  Mary F. Argo, Tony Padilla, Constance L. Simonsen, and Rufina V. Ladabour.

This directly supports the app's variation policy: alternate scans and same-name
records should be discoverable together, but kept as separate source records.

## Count reconciliation

The apparent count conflict is mostly about different denominators:

- **1,229** — Wellerstein's 2012 extraction from the old LANL low-resolution page.
- **more than / about 1,400** — LANL/NSRC restoration and digitization reporting.
- **1,404 source files** — this app's 14 September 2026 Commons A–Z file snapshot.
- **several hundred / estimated 30% of total Project Y badge photos** — OSTI
  LA-UR-22-20541's description of the NSRC-held physical collection relative to
  total photos taken.
- **more than 8,000 people worked at the Los Alamos Lab** — OSTI LA-UR-23-21584's
  larger workforce figure; this is not a badge-photo file count.
- **2,500 staff at wartime height** — Bulletin's contextual staffing figure;
  this is a point-in-time staffing estimate, not a total-through-war headcount.

The app should continue to label its dataset as a **source-file snapshot**, not a
unique-person list or a full staff roster.

## Domain risk register

| Risk | Impact | Mitigation in app/docs |
| --- | --- | --- |
| Canonical LANL URL moved from `about.lanl.gov` to `www.lanl.gov` | Older source links can look broken or ambiguous. | Preserve file-page quoted source URLs, but link current context to `www.lanl.gov/about/history-innovation/badges`. |
| Commons license templates vary between older federal-public-domain and newer LANL attribution notices | Incorrect reuse labels could be propagated. | Keep rights at per-file source pages; local notices for curated photos reproduce the exact relevant notice. |
| PhotoShelter bot protection | Runtime/source auditing may fail if relying on PhotoShelter. | Use Commons file pages and LANL/OSTI pages for citation; do not hotlink PhotoShelter. |
| Mirror sites scrape and repackage metadata | Search results may look authoritative but are derivative. | Use PICRYL/getarchive only as discovery leads; verify against Commons/LANL/OSTI. |
| Same person may have multiple photos/codes | Merging can erase evidence or create false badge-code claims. | Variation chips are review cues only; CSV preserves filenames and variation status. |
| Badges are visible but small/monochrome | Color/shape/number readings can be overinterpreted. | Curated records require manual per-image review and source notes; unreviewed badges remain untranscribed. |

## Next research queue — no filter

1. **All high-resolution LANL/PhotoShelter-derived Commons pages:** extract image
   numbers (`21-...`), short titles, and LA-UR text where visible on file pages.
   This likely requires Commons API access or a controlled crawl, because the LANL
   page HTML does not expose the full A–Z table in the plain fetch.
2. **Duplicate-code set:** seed a reviewer queue from the explicit LA-UR-23-21584
   duplicate examples: Bosnjak, O'Brien, Mary Argo, Padilla, Simonsen, Ladabour.
3. **Legacy-vs-restored pairs:** compare old 130 × 180 scans against newer restored
   JPEGs for the same source label; record whether they are the same exposure,
   a crop, or a different badge/code.
4. **Rights normalization:** keep older PD-USGov-DOE files and newer LANL attribution
   files distinct until each file page is checked.
5. **Human-computing biographies:** continue the Nuclear Museum lead list, but only
   promote a person to "researched" once image provenance, badge/code reading, and
   biography source are all separately documented.
