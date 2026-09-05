# Cylinder reconciliation research findings

Research date: **August 23, 2026**

This note records the technical findings behind the UCSB Cylinder Audio Archive
reconciliation interface. It separates confirmed public facts from deployment
assumptions so a prototype cannot accidentally be treated as a production
catalog writer.

## Executive finding

The requested connection should not be built as “Pegasus writes to the Library
of Congress.” The safe, current direction is:

```text
UCSB Alma / approved batch
       │  SRU 1.2, Alma Bib API, or MARCXML export
       ▼
server-side reconciliation service
       │  Z39.50 search/present (read-only discovery)
       ├──────────────► LCDB — bibliographic candidates
       ├──────────────► NAF  — name authority candidates
       └──────────────► SAF  — subject authority candidates
       │
       ▼ cataloger reviews a field-level merge preview
UCSB Alma Bib API / reviewed import profile
```

**Pegasus is historical.** The original pilot loaded MARC records into Pegasus,
but UCSB retired the Aleph back end in 2017 and moved the live Cylinder Archive
to Ex Libris Alma SRU. The current profile should keep “Pegasus” only as a
legacy identifier and staff-facing compatibility label.

The Library of Congress public Z39.50 service provides initialization, search,
and present. It is not an update endpoint. “Sync” therefore means retrieving LC
candidates and applying a cataloger-approved merge to UCSB Alma.

## Confirmed endpoints and identifiers

### UCSB

| Purpose | Confirmed value | Evidence |
| --- | --- | --- |
| Current Alma SRU | `https://ucsb.alma.exlibrisgroup.com/view/sru/01UCSB_INST` | UCSB's public AV Lab code |
| Alma institution code | `01UCSB_INST` | UCSB public code and UC campus-code documentation |
| Legacy Pegasus/Aleph SRU | `http://pegasus.library.ucsb.edu:5661/sba01pub` | Commented retired endpoint in UCSB code |
| Public catalog | `https://search.library.ucsb.edu/` | UCSB Library links / Primo VE |
| Durable cylinder IDs | `https://www.library.ucsb.edu/OBJID/CylinderNNNN` | Cylinder MARC 856 and public pages |
| Current source format | SRU 1.2 / MARCXML | UCSB migration notice and current code |

A current UCSB Audio Preservation Lab script still queries Alma by MMS ID and
uses the SRU base above. Live SRU queries succeeded during this research and
returned current MARCXML for all five interface examples:

| Cylinder | UCSB MMS ID | OCLC number |
| --- | --- | --- |
| 13259 — Maple leaf rag home recording | `990041103680203776` | `881047763` |
| 0774 — William Tell : fantasie | `990025192730203776` | `39012442` |
| 11362 — Around the world | `990036983190203776` | `780204521` |
| 16097 — inaudible speaking and singing | `990046974130203776` | `958382220` |
| 0348 — Danish dance of greeting | `990025147250203776` | `39400399` |

The sampled SRU records also expose `(EXLNZ-01UCS_NETWORK)` identifiers. This is
strong evidence that these bibs are linked to the UC Network Zone, so an IZ
write must respect Alma local-extension behavior.

### Library of Congress

| Database | Host / port | Database name | Use |
| --- | --- | --- | --- |
| Bibliographic | `lx2.loc.gov:210` | `LCDB` | MARC 21 bibliographic candidates |
| Name authorities | `lx2.loc.gov:210` | `NAF` | authorized 1XX/7XX headings |
| Subject authorities | `lx2.loc.gov:210` | `SAF` | authorized 6XX headings |

All three use Z39.50-1995, MARC 21 UTF-8, element set `F`, and no login. HTTPS
SRU gateways are also published at `/sru/lcdb`, `/sru/naf`, and `/sru/saf`.

LC migrated its catalog from Voyager to Folio in July 2025. Public Z39.50 access
was restored in January 2026. The connection values remained the same, but the
supported Bib-1 attributes were reduced. As of the April 30, 2026 LC guidance,
LCDB supports these useful Use attributes:

- title `4`
- subject heading `21`
- author `1003`
- standard identifier `1007`
- keyword/any `1016`
- OCLC number `1211`
- LCCN `9`

The server returns at most 50 records per present response, expires inactive
sessions after 60 seconds, and limits result sets to 10,000 records.

## The actual UCSB metadata landscape

The public evidence shows several related data layers rather than one Pegasus
database:

1. **Alma** is the current bibliographic system of record and supplies live MARC
   data to the Cylinder Archive over SRU.
2. **FileMaker** is still used by UCSB's AV Lab workflow for operational cylinder
   metadata such as title, performer, composer, label/catalog number, year, and
   processing state.
3. **Audio storage** uses canonical identifiers such as
   `cusb-cyl13259b.wav`; web derivatives are published separately.
4. **Alexandria / Calisphere** expose digital-collection representations and
   ARKs derived from the catalog records.
5. **OCLC/WorldCat** already receives UCSB cylinder catalog records and is likely
   to provide broader manifestation-level coverage than LCDB.

The interface should reconcile Alma bibliographic data. It should not overwrite
FileMaker workflow state, media-file metadata, ARKs, or repository links.

## Field evidence from UCSB's public MARC fixture

A public UCSB Alexandria test fixture for a cylinder record contains:

- `028 $a/$b` issue number and label
- `035 $a` OCLC number
- `024 $a` local ARK with `$2 local`
- `100/110/700/710` creators and performers with relator terms/codes
- `245` title statement
- `260` publication statement (older AACR2 records) or `264` in newer RDA data
- `300` duration, speed, and dimensions
- `500`, `511`, `520`, `530`, `561`, and `590` descriptive, performer,
  availability, provenance, and local notes
- repeated `650` subjects
- repeated `852` copy/holding information
- repeated `856` durable audio links
- local `9XX` processing fields

This confirms that a blanket “replace all fields” operation is unsafe. Repeated
`852` and `856` fields may identify separate physical copies and digital files.
The ARK in `024`, provenance in `561`, local note in `590`, and durable object
links in `856` are not LC enrichment candidates.

## Recommended candidate search sequence

1. If `035$a` contains an OCLC identifier, query LCDB with Use attribute `1211`.
2. Query the normalized `028$a` issue number with Use `1007`; then verify label
   name in `028$b`. An issue-number hit without a matching label is not enough.
3. Query `245$a` with Use `4` and a creator/performer with Use `1003`.
4. Fall back to Use `1016` with title, label, and issue-number tokens.
5. Independently query NAF for names and SAF for subjects.
6. Re-read every candidate's MARC fields and calculate a local ranking. Never
   trust result ordering as a match decision.

Suggested ranking weights are checked into `config/cylinder-z3950.json`. They are
for candidate ordering only. There is deliberately no auto-write threshold.

### Why `028` matters

MARC 028 is the publisher/distributor number field. First indicator `0` denotes
a sound-recording issue number and first indicator `1` a matrix number. For
commercial cylinders this identifier, combined with the label in `028$b`, is
often more manifestation-specific than title and performer. Home recordings
usually lack it and must not be forced onto a commercial-recording candidate.

## Merge and write-back safety

### Never copy from LC

- LC `001/003/005` control data
- LC holdings (`852`)
- LC digital links (`856`)
- target-system `9XX` fields

### Preserve at UCSB

- local ARK (`024` with `$2 local`)
- existing `035` identifiers, deduplicated rather than replaced
- access/restriction, provenance, and preservation fields
- local/copy notes (`5XX`, especially `$5 CU-SB`, `561`, `583`, and `590`)
- every `852`, `856`, and local `9XX`
- indicators, relator codes, subfield order, and `$9 local` on Alma local
  extensions

### Write-back controls

Production update is `PUT /almaws/v1/bibs/{mms_id}` with XML, not JSON. The
server should use:

- `validate=true`
- `override_warning=false`
- `override_lock=false`
- `stale_version_check=true` so the source `005` acts as an optimistic lock
- `check_match=true`
- the UCSB-approved normalization process and cataloger level

The API key must remain server-side. Save the source MARCXML, LC response,
proposed patch, approver, timestamps, response status, and resulting `005` in an
append-only audit event. An idempotency key should bind batch ID, MMS ID, source
`005`, and patch digest.

For Network Zone-linked records, only local extensions can safely be updated
from the Institution Zone. The connector must identify IZ/NZ ownership before
presenting a writable proposal.

## Batch strategy

Do not harvest the Cylinder Archive in bulk through Alma SRU. Ex Libris states
that SRU is intended for search/retrieve integrations, not bulk export.

- Up to 100 known MMS IDs can be retrieved in one Alma Bib API request.
- For a cataloger-selected reconciliation batch, use an itemized Alma set or an
  explicit MMS-ID list.
- For collection-wide work, use Alma's Export Bibliographic Records or a
  publishing job, then process the resulting MARCXML/MARC file.
- Write records individually with optimistic locking, or submit a reviewed
  import job using a UCSB-approved match and merge profile.

## Coverage limitation

LCDB is not guaranteed to contain item-level records for UCSB's cylinders. The
LC catalog does contain a collection-level record for UCSB's Cylinder
Preservation and Digitization Project, and LC maintains major wax-cylinder
collections, but a title-level LC match should be treated as optional.

A concrete false-positive risk appeared during research: LC's National Jukebox
has a **Danish dance of greeting** disc recorded by Prince's Band for Columbia
(catalog A3039), while UCSB Cylinder 0348 is a National Promenade Band cylinder
on Edison Blue Amberol 2243. Title-only matching would merge different
manifestations. The label plus `028` issue number, carrier, performer, and date
must veto that match even though the titles agree.

UCSB states that its records are already represented in OCLC/WorldCat. For
commercial-cylinder copy cataloging, an authenticated OCLC target may therefore
be a better bibliographic source. LC remains especially valuable for name and
subject authority reconciliation. The production design should support both,
rather than treating a missing LCDB hit as a metadata error.

## Cultural and descriptive review

The archive includes historical language, ethnic recordings, Indigenous
materials, vernacular recordings, and legacy subject terminology. Automated
heading replacement may alter context or access. Flag deprecated or potentially
harmful terminology for a cataloger; preserve quoted historical titles and
notes according to local policy. Never infer that public-domain audio means
unrestricted cultural or ethical reuse.

## Decisions still required from UCSB

1. Confirm whether the full Cylinder set follows the sampled records and is
   linked to the UC Network Zone, and identify which fields are UCSB local
   extensions.
2. Provide the approved Alma API application, cataloger level, normalization
   process, and merge rule IDs through deployment secrets—not chat or Git.
3. Choose how itemized batch IDs enter the service: Alma set API, uploaded MMS
   list, or an export job.
4. Confirm whether FileMaker remains an operational source that needs read-only
   status display in this interface.
5. Test a statistically useful sample against LCDB to measure actual hit rate.
6. Decide whether OCLC should be the primary bibliographic target and LC NAF/SAF
   the primary authority targets.
7. Approve local policies for 5XX notes, legacy headings, restricted material,
   and audit-log retention.

## Primary sources

- [UCSB pilot: MARC records loaded into Pegasus and OCLC](https://cylinders.library.ucsb.edu/pilotintro.php)
- [UCSB 2017 migration from Aleph Z39.50 to Alma SRU](https://cylinders.library.ucsb.edu/alma.php)
- [UCSB archive overview and current Alma SRU architecture](https://cylinders.library.ucsb.edu/overview.php)
- [Current UCSB AV Lab microservices](https://gitlab.com/ucsb-lib/src-avlab-microservices)
- [Live UCSB Alma SRU example: Cylinder 13259](https://ucsb.alma.exlibrisgroup.com/view/sru/01UCSB_INST?version=1.2&operation=searchRetrieve&recordSchema=marcxml&maximumRecords=1&query=alma.mms_id%3D990041103680203776)
- [Retired UCSB code showing current and legacy endpoints](https://github.com/brnco/ucsb-src-microservices/blob/master/mtd.py)
- [UCSB Alexandria legacy cylinder MARC fixture](https://github.com/curationexperts/alexandria-legacy/blob/master/spec/fixtures/marcxml/cylinder_sample_marc.xml)
- [LC Folio Z39.50/SRU configuration](https://www.loc.gov/z3950/lcserver.html)
- [LC National Jukebox title collision: Danish dance of greeting](https://www.loc.gov/item/jukebox-648076/)
- [Alma SRU documentation](https://developers.exlibrisgroup.com/alma/integrations/sru/)
- [Alma Retrieve Bibs API](https://developers.exlibrisgroup.com/alma/apis/docs/bibs/R0VUIC9hbG1hd3MvdjEvYmlicw==/)
- [Alma Update Bib API](https://developers.exlibrisgroup.com/alma/apis/docs/bibs/UFVUIC9hbG1hd3MvdjEvYmlicy97bW1zX2lkfQ==/)
- [MARC 028 definition](https://www.loc.gov/marc/bibliographic/bd028.html)
