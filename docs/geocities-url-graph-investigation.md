# GeoCities URL-graph investigation: source checks and reproducible bounds

This is a **method/source-check record**, not a declaration that a graph was
successfully searched or that a historical site is in a collection. Only an
identified run's final receipt establishes its actual coverage and results.
No visitor entries, contact details, owner secrets or raw archive payloads belong
in this public document, repository or CI artifacts.

## Exact public file, not an ambiguous collection version

The [Internet Archive item](https://archive.org/details/geocities-webarchive-collection-derivatives)
and its [file metadata](https://archive.org/metadata/geocities-webarchive-collection-derivatives)
were checked independently of a file-content search. A ranged prefix GET
confirmed the actual CSV header `crawl_date,source,target,anchor_text`.

| File path within the item | Compressed bytes | Publisher MD5 | Publisher SHA-1 |
| --- | ---: | --- | --- |
| `geocities-webgraph.csv.gz` | 19,168,630,898 | `c287d07252211d7426d7d6bfad6c715c` | `685e88b0daff1d6c625355690aa450e20d314e2c` |
| `v2/geocities-webgraph.csv.gz` | 19,170,067,494 | `823feb0e44972a8faf00c4b3025ebff9` | `6612c0d270fa877f857eff8e47fb87c743ccdc72` |

The investigation selects the **unversioned first file**, not both. The item
calls the collection v3; that description alone does not establish the exact
extraction/version history of an unversioned file. The two paths/digests must
not be combined or described as one completed search.

The first 1,048,576 compressed bytes had SHA-256
`dd73be014bc0385c40f0c7d76c82e70dbb40427978ba47025cf9983e233e0a01`.
A prefix/header probe is **not** a complete-file search. MD5/SHA-1 matching
checks transfer consistency with public metadata, not independent authenticity
or a signed provenance chain. The scanner also computes a full-transfer
SHA-256 for the receipt; no publisher SHA-256 is assumed.

## Pinned library source: useful, but not the dataset's execution recipe

The AUT tag `aut-1.2.0` resolved through annotated tag object
`80ef7a6f5abee2c46ce2f5a1a189016b9ea87426` to commit
`569b3fe02870f05f64f2e5f55ceddb3e276b3dc4`. This resolves a source revision;
no cryptographic tag-signature verification is claimed.

| Source at that commit | What was actually established | SHA-256 of retrieved source |
| --- | --- | --- |
| [`app/WebGraphExtractor.scala`](https://github.com/archivesunleashed/aut/blob/569b3fe02870f05f64f2e5f55ceddb3e276b3dc4/src/main/scala/io/archivesunleashed/app/WebGraphExtractor.scala) | Stub: its `apply` returns the input DataFrame. It must not be cited as the extraction implementation. | `5680ed21cd3e439ffc02dc39a00e9d03f5e15f2fed844d48618806bea0e1c269` |
| [`package.scala`](https://github.com/archivesunleashed/aut/blob/569b3fe02870f05f64f2e5f55ceddb3e276b3dc4/src/main/scala/io/archivesunleashed/package.scala) | The actual RDD `webgraph()` calls `removeFiledesc()`, `keepValidPages()` and `ExtractLinks`; produces `crawl_date,src,dest,anchor`. | `d01a95f6486b50de7fab03a73ce99a46ec1166aa90e0adcb9dea0603cee683d0` |
| [`matchbox/ExtractLinks.scala`](https://github.com/archivesunleashed/aut/blob/569b3fe02870f05f64f2e5f55ceddb3e276b3dc4/src/main/scala/io/archivesunleashed/matchbox/ExtractLinks.scala) | Jsoup selects `a[href]`, resolves `abs:href` against the source and emits nonempty source/target/anchor-text tuples. This is not a JavaScript execution or form/image/frame-outlink extractor. | `a3a9cdc658852f1b0c61bc0b88837e3cda6da9d700edc11162162fc296a45104` |

In this pinned implementation, valid pages have a crawl date, HTTP status 200,
HTML/XHTML MIME type or an HTML-looking extension, and are not `robots.txt`.
Those library filters are important limits on graph interpretation. They do
**not** establish which records the publisher processed for this exact file.
The actual file's renamed header is directly observed, not inferred from AUT.

A separate pinned [AUT/ARCH derivative example notebook](https://github.com/archivesunleashed/notebooks/blob/8211b24ab6106e4da5f422b30cbc8b7bac83b4b6/PySpark%20Examples/arch-derivatives.ipynb)
(commit `8211b24ab6106e4da5f422b30cbc8b7bac83b4b6`, file SHA-256
`5e992fa62a584498f4d1d6b8e0f56f2ac587ff03946c4568aa523fb338ea20e2`)
shows CSV output with `escape` set to the quote itself: **doubled quotes**, not
backslash escaping. That distinguishes a valid literal backslash before a
closing quote from another CSV dialect. It is an implementation example, not
proof that this notebook generated the published dataset. The stream parser
must still validate the actual complete CSV and gzip framing.

## Pipeline and completeness rules

`tools/geocities-link-graph.py` permits only public HTTPS `archive.org` or
`*.archive.org` transport destinations, including redirects. It loads bounded
metadata and gates a full scan on an exact named-file metadata/header/range
probe. It submits no forms and uses no accounts, tokens or secrets.

The downloader consumes four concurrent 64-MiB ranges **in byte order**. No
19-GB compressed file or decompressed graph is written to disk. Input is hashed
while zlib verifies every gzip member; expanded blocks flow by pipe to the
compiled `tools/geocities-link-graph.cpp` CSV prefilter. The native code:

- parses quoted commas, doubled quotes, embedded newlines, CRLF and repeated
  part headers across arbitrary input-block boundaries;
- never retains the anchor column, even for a matching row;
- prefilters source/target URLs for `8099` or `shadowelf`, including one
  percent-decoding pass; a broad string match is **never** a backlink finding;
- bounds retained URL fields at 65,536 bytes; longer fields are scanned with an
  incremental matcher, not accumulated or silently skipped;
- excludes oversized non-HTTP schemes from HTTP-URL classification. An
  oversized HTTP **candidate** is explicitly counted as unclassified; it
  prevents a complete-search finding even if the full transfer was read.

The Python classifier rechecks actual parsed hosts/paths and the exact public
`owner=Shadowelf` book profile using the audit's target policy. It distinguishes
original-source rows, self-links, external-source site edges, external-source
public-book edges and unrelated number/handle matches. The policy is bounded:
HTTP(S), the documented original/mirror host set and once-decoded target path,
not every possible historical alias or same-name account.

At most 256 distinct inbound edge observations are retained, with duplicate
counts and explicit omissions if this bound is reached. Query strings and
fragments are removed except the already-public exact book owner; contact-like
or oversized paths are redacted. No User ID, contact, link label, surrounding
visitor message or anchor text is emitted. A URL hash binds a retained
observation to its full in-memory URL without exporting arbitrary query fields.

A final `completeGraphSearched: true` requires **all** of:

1. Every advertised compressed byte read through EOF, with exact size, MD5 and
   SHA-1 matching the current named-file metadata.
2. Complete, CRC-validated gzip members with no truncated member or trailing
   junk, within the 24-GiB compressed / 512-GiB expanded / 90-minute limits.
3. Recognized CSV schema, a clean native CSV EOF, and matching expanded-byte
   counts; parser errors are fixed diagnostics, not dumped remote records.
4. Matching native/Python candidate totals and **zero unclassified candidates**.

`fullPayloadRead` and `exactCandidateCoverageComplete` remain separate. A
partial or failed receipt cannot be reinterpreted as “no backlinks.” Retained
edge-list omissions likewise cannot be described as an exhaustive edge list.

For at most 16 retained public GeoCities source URLs, the investigator attempts
a read-only Wayback replay at the graph's crawl date, bounded to 2 MiB each. A
source page is marked verified only when actual parsed HTML has the matching
target kind and is not an access-barrier response. Failure remains unresolved.
A different source URL does not independently prove different ownership, server
ring enrollment or a contemporary relationship; modern mirrors and own pages
still need source criticism.

## Reproduce without downloading an entire graph locally

Offline synthetic controls compile and exercise the real native parser:

```sh
python3 -m unittest discover -s tests -p geocities_link_graph_test.py
node --test tests/geocities-link-graph.test.mjs tests/archive-backlink-audit.test.mjs
```

They cover quoting, chunk/member boundaries, complete transfer checksums,
truncation/corruption, long anchors/URLs, exact-host/path rejection, percent
escapes, self-links, redaction, limits, range ordering and kind-specific source
verification. They make **no network requests**.

The read-only `.github/workflows/geocities-link-graph.yml` lane runs those
controls on relevant branch/PR changes. A full public-file search is explicitly
dispatched, not silently repeated on every PR or main synchronization:

```sh
gh workflow run geocities-link-graph.yml --ref arena/74f27a74-html5
```

The separate `archive-backlink-audit.yml` lane preserves the requested ring →
guestbooks → public-pagination-source → collection-catalog order. Replay-relative
form actions resolve against the original origin. Only public-view field names,
the known public owner/list value and bounded numeric pagination values are
retained; management/private forms and unrelated values are refused/redacted.
Actual public-view links are retained only when every query parameter is safe,
not synthesized by converting POST fields to guessed GET URLs.

Both lanes upload **sanitized JSON receipts only**, with 14-day retention.
Bounded, escaped Checks-API annotations expose observations when artifact CDN
access fails. Truncated annotations are marked explicitly: successful CI,
source-code inspection, catalog availability and a partial annotation are not
substitutes for a complete identified research receipt.

## Standing evidence boundaries

- Original `conquer` / member-id `4` navigation is outgoing site code, not an
  independent member list or proof the ring server enrolled the site.
- A graph edge is a lead until its source page is checked. No match in one graph
  is not absence from all mirrors, WARC/WAT records, archive collections or the
  Library of Congress gift.
- Public guestbook POST pagination source is not an archived older-record GET
  URL. Never guess private/management endpoints or submit live forms.
- The earlier recovery is **13 distinct visible entries**, not the 250 reported
  by the historical guestbook. Graph/catalog/source checks do not recover more
  messages by themselves.
- Existing normalized backlog rows remain terminal. This is user-requested
  follow-through, not new fabricated task closure or a waiver of owner/device,
  GUI, cryptographic-authorization or financial/deployment gates.
