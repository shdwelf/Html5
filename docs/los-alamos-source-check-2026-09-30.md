# Los Alamos badge archive — source-domain check

> **Bibliographic index:** [Source-check bibliography](source-check-bibliography.md) — normalized references, source-status notes, and coverage audit.

Reviewed **30 September 2026** as a follow-up to the Project Y badge catalog,
filename-variation work, and the subsequent no-filter domain deep dive.

For the extended evidence table, chronology, count reconciliation, and risk
register, see [`los-alamos-domain-deep-dive-2026-09-30.md`](los-alamos-domain-deep-dive-2026-09-30.md).

## Scope of this pass

This is a domain-chain/source check for the badge collection shipped by
`los-alamos.html`. It does **not** authenticate every portrait or transcribe new
badge numbers. The goal is to decide which domains should be trusted for which
claims, where older links have gone stale, and how to label alternate scans.

"No filter" in this pass means the source surface was treated broadly: current
LANL pages, older LANL paths preserved in Commons metadata, OSTI LA-UR records,
NPS mirrors, Wikimedia Commons, PhotoShelter references, Google Drive links in a
LANL public-release PDF, derivative mirror sites, and secondary/contextual pages
were all considered and ranked.

## Domain chain findings

| Domain / source | What was checked | Result for the app |
| --- | --- | --- |
| `www.lanl.gov/about/history-innovation/badges` | Current LANL Historic Badges page. It describes restored images from more than 1,400 Manhattan Project workers, links the NSRC restoration story, and presents a public gallery/index frame. | Prefer this as the current first-party human-readable doorway. The plain fetched HTML does not expose a complete per-person table, so the app still uses the Commons snapshot for file-level indexing. |
| `about.lanl.gov/history-innovation/badges/` | Older-looking path cited by Commons and by the 2023 LA-UR article. Earlier direct fetch failed from this environment; search and current LANL routing point to the `www.lanl.gov` page above. | Preserve it when quoting a file page's original source, but do not rely on it as the current canonical URL. |
| `www.osti.gov/biblio/1841894` / LA-UR-22-20541 | OSTI record and public-release slide deck for the Project Y Badge Photo Collection. It says NSRC held several hundred badge photos, estimated at about 30% of total Project Y badge photos, and that many originals were destroyed/lost; it documents FY20 physical restoration and FY22 digital restoration. | Strong official support for collection incompleteness, restoration lineage, and why restored images are not just bigger copies of legacy 130 × 180 scans. |
| `www.osti.gov/biblio/1957895` / LA-UR-23-21584 | OSTI record and article PDF. It says NSRC restored/digitized about 1,400 early badge photos, inventoried names/codes, published them through the Lab site, and found people with duplicate photos/codes while code meanings remain unresolved. | Strongest official support for the app's variation policy and the "do not infer badge-code meaning" rule. |
| `commons.wikimedia.org` / `upload.wikimedia.org` | The category page lists Los Alamos badge subcategories A–W, Y, Z and file pages carry per-file source, author, history, and licensing/permission text. Example older low-resolution files cite the old LANL wartime staff page; newer high-resolution files cite LANL Historic Badges or PhotoShelter. | Keep Commons as the per-file landing page and image-delivery source. Do not collapse separate Commons filenames into one asserted person unless a reviewed profile explicitly does so. |
| `www.lanl.gov/history/wartime/staff.shtml` and old `ProjectYBadges/...` image URLs | The old LANL staff page and example direct badge GIF paths now return LANL "Page Not Found" pages. Wellerstein's 2012 article and many Commons file descriptions preserve this as the historical origin for the 130 × 180 scans. | Treat as an archival/dead source lead. Do not hotlink or depend on the dead path; retain Commons file pages as the reachable citation trail. |
| `lanl.photoshelter.com` | Cited by some high-resolution Commons file pages. Direct fetch triggered PhotoShelter bot protection. | Treat as a source trail embedded in Commons metadata, not an app dependency. |
| `drive.google.com` folder in LA-UR-23-21584 | The public-release PDF embeds a Drive folder URL for example/access images. | Useful evidence of a LANL-published working access path, but not stable enough to replace OSTI/LANL/Commons citations. |
| `www.lanl.gov/media/publications/the-vault/...` | LANL's "Restored images, preserved legacy," "Guarding Science," and "Metropolis Collection" articles. | Good first-party context for restoration, security practice, and archival custody. They are not badge-issue ledgers. |
| `blog.nuclearsecrecy.com` | Alex Wellerstein's 2012 "The Faces of Project Y" describes a 1,229-image composite built from LANL badge files, warns that names came from source filenames, and notes typos/mistakes. | Good secondary source for the original collection scale and filename-derived labels. Use it to explain why variations and spelling problems exist, not as a replacement for individual file records. |
| `thebulletin.org` | The Bulletin feature shows a single montage image and contextual text: badges were worn by all Los Alamos staff, the wartime workforce exceeded 2,500 at its height, and the feature is a curated selection. | Use as contextual reading and the reduced reference montage only. It is not a readable roster, an OCR source, or a license source for individual badge photos. |
| `nps.gov` | NPS archived LANL Badge Restorations release. | Good government corroboration of the 2021 NSRC restoration story, but marked archived/not updated. |
| `ahf.nuclearmuseum.org` | The Nuclear Museum / Atomic Heritage pages document human-computing context, named profiles, and oral-history leads. | Good for biography and research leads (Mary Frankel, Jean Bacher, Kay Manley, Eldred Nelson, Donald Flanders). Not an image-rights source for Commons badge scans. |
| `picryl.com` / `getarchive.net` mirrors | Derivative public-domain mirror/search pages containing scraped badge metadata and image-number hints. | Search-discovery only. Verify every useful claim against Commons/LANL/OSTI before adding it to the app. |

## Variation policy added by this pass

The UI now marks **filename-based source-file variations**. A variation group is a
set of records whose source labels normalize to the same name (with middle
initials and common crop/original suffixes ignored), plus a few explicit reviewed
aliases such as the J. R. / J. Robert Oppenheimer files. The grouping is designed
to help reviewers find alternate scans, not to merge identities.

Important boundaries:

- A variation chip means "review these source files together," not "same exposure,"
  "same badge issue," or "same person proven by face."
- Badge numbers remain transcribed only for the seven researched records.
- Alternate scans retain their own Commons file pages and rights statements.
- Bare or ambiguous names are not force-merged. For example, a surname-only source
  label is left separate unless an explicit reviewed alias is present.
- The source-label parser was corrected so full names containing the letters "id"
  are not truncated; examples such as **David** and **Reid** now display correctly.
- The expanded domain check found official support for this caution: LA-UR-23-21584
  explicitly reports multiple photos for some staff, sometimes with different
  codes, while the meaning of those codes remains unresolved.

## Immediate outcomes

- Added a **Variation files** tab and per-card variation chips in the app.
- Detail panels now list sibling source files in the same variation group with a
  caution that the relationship is filename-derived.
- Exported CSV now includes a variation-group column.
- Added the no-filter domain deep dive linked above.
- Tests now cover embedded-`id` parsing, comma/surname-first labels, older
  `Surname Given Badge` labels, and representative variation groups for Feynman,
  Oppenheimer, Metropolis, and David Anderson.

## Remaining research leads

1. Build a controlled Commons metadata audit for all high-resolution files to
   extract image numbers (`21-...`), short titles, PhotoShelter/LANL source paths,
   and LA-UR references.
2. Seed a duplicate-code review queue from LA-UR-23-21584's examples: Bosnjak,
   O'Brien, Mary Argo, Padilla, Simonsen, and Ladabour.
3. For each desired curated expansion, inspect the original file page and visible
   photograph before transcribing any badge identifier.
4. Prioritize human-computing leads already supported by the Nuclear Museum page:
   Mary Frankel, Jean Bacher, Kay Manley, Eldred Nelson, and Donald Flanders.
5. If a true badge-issue ledger or LANL/NSRC finding aid becomes available, keep it
   separate from the filename-variation groups and document which fields it proves.
