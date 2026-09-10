# UCSB Cylinder record reconciliation interface

The cataloger workspace is available at `index.html#cylinders` and directly at
`cylinder-sync.html`. It provides a responsive queue, confidence filtering,
side-by-side MARC review, local-field preservation, approval controls, CSV
report export, and a connection-profile view.

Detailed research and production recommendations are in
[`CYLINDER_RESEARCH.md`](./CYLINDER_RESEARCH.md). The machine-readable target,
match, merge, and write-back settings are in
[`config/cylinder-z3950.json`](../config/cylinder-z3950.json).

## Confirmed connection profile

### UCSB source

- Current SRU base:
  `https://ucsb.alma.exlibrisgroup.com/view/sru/01UCSB_INST`
- Protocol: SRU 1.2 with MARCXML
- Institution code: `01UCSB_INST`
- Legacy Pegasus/Aleph SRU:
  `http://pegasus.library.ucsb.edu:5661/sba01pub` (retired; audit/migration only)

### Library of Congress targets

- Host: `lx2.loc.gov`
- Port: `210`
- Bibliographic database: `LCDB`
- Name authorities: `NAF`
- Subject authorities: `SAF`
- Record syntax: MARC 21 UTF-8
- Element set: `F`
- Authentication: none
- HTTPS SRU fallbacks: `https://lx2.loc.gov/sru/{lcdb|naf|saf}`

LC moved to Folio in 2025 and restored public Z39.50 access in January 2026.
The host and database names did not change, but supported Bib-1 attributes are
now more limited. The checked-in profile uses only attributes documented by LC
on April 30, 2026.

## Correct data flow

The public LC endpoint is search/present only. It cannot receive UCSB updates.
The production flow is:

1. Read a UCSB itemized batch from Alma SRU, the Bib API, or a MARCXML export.
2. Search LCDB for bibliographic candidates and NAF/SAF for authority candidates.
3. Normalize and score results, then display a field-level merge preview.
4. Require a cataloger to approve each proposed change.
5. Write approved MARCXML to the UCSB Alma Bib API or a reviewed Alma import
   profile.

For commercial cylinder manifestations, use OCLC numbers and the MARC 028 issue
number plus label before title/performer matching. LCDB coverage is not expected
to be complete. UCSB already publishes records to OCLC, so OCLC may ultimately
be the stronger bibliographic target while LC NAF/SAF supply authority control.

## Merge safety

The public UCSB cylinder MARC fixture contains local ARKs, provenance, multiple
physical copies, and multiple audio links. A blanket overlay is unsafe.

The profile therefore:

- never imports target `001/003/005`, `852`, `856`, or `9XX` fields;
- preserves UCSB ARKs, identifiers, restrictions, provenance, preservation
  notes, holdings, and digital-object links;
- appends and deduplicates descriptive 5XX notes instead of blindly replacing
  them;
- requires review before changing titles, publication data, physical
  description, names, or subjects;
- preserves Alma `$9 local` markers and record/subfield ordering.

## Production write controls

Use the Alma XML update endpoint:

```text
PUT https://api-na.hosted.exlibrisgroup.com/almaws/v1/bibs/{mms_id}
```

Recommended controls:

```text
validate=true
override_warning=false
override_lock=false
stale_version_check=true
check_match=true
```

The server must also apply a UCSB-approved normalization process and cataloger
level. Never put the Alma API key in browser JavaScript or this repository.

For known batches, the Alma Retrieve Bibs API accepts up to 100 MMS IDs per
request. For collection-wide reconciliation, use an Alma Export Bibliographic
Records or publishing job; Ex Libris explicitly does not support SRU as a bulk
export mechanism.

## Prototype boundary

This repository is a static HTML5 application. The included queue uses
representative public Cylinder Audio Archive records and changes review state
in the browser. It does not contact or modify UCSB or LC systems.

Production deployment needs a trusted server-side connector, secret management,
optimistic locking using MARC `005`, IZ/NZ ownership checks, idempotency, an
append-only audit log, and cataloger-approved merge rules.

## Legacy naming

The original Davidson Library pilot loaded MARC records into Pegasus and OCLC.
The archive's web search later queried Aleph through Z39.50. UCSB retired Aleph
and moved the live site to Alma SRU on October 24, 2017. The interface retains
“Pegasus” only as a legacy compatibility label; Alma is the current source and
write target.

## References

- [UCSB Cylinder Audio Archive pilot](https://cylinders.library.ucsb.edu/pilotintro.php)
- [UCSB migration to Alma SRU](https://cylinders.library.ucsb.edu/alma.php)
- [UCSB archive architecture](https://cylinders.library.ucsb.edu/overview.php)
- [LC Z39.50/SRU configuration](https://www.loc.gov/z3950/lcserver.html)
- [Alma SRU documentation](https://developers.exlibrisgroup.com/alma/integrations/sru/)
- [Alma Update Bib API](https://developers.exlibrisgroup.com/alma/apis/docs/bibs/UFVUIC9hbG1hd3MvdjEvYmlicy97bW1zX2lkfQ==/)
