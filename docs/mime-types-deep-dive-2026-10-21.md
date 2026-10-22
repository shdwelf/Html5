# MIME types — deep dive (21 Oct 2026)

*Request: “investigate mime-types deep dive … update wiki with mime types”.
Companion to [`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md)
(round 9) — where that one covers multi-format *bytes*, this covers the
*labels* those bytes carry. Tooling: [`tools/mime_lookup.mjs`](../tools/mime_lookup.mjs)
+ `tests/mime-lookup.test.mjs`. The wiki quick-reference lives in
[`README.md`](README.md) § “MIME quick reference”.*

## 1. What the label is

A **media type** (historically “MIME type”) is a `type/subtype` string
(`image/png`, `application/json`) — originally for email attachments
(RFC 2045–2049, 1992; RFCs 1521/1522 before them), adopted by HTTP
(`Content-Type`), and canonically specified today by **RFC 6838 / BCP 13**
(2013, obsoletes RFC 4288). The **IANA media types registry**
(<https://www.iana.org/assignments/media-types>, 2000+ registrations) is
authoritative. Structure:

- **Top-level types**: `text`, `image`, `audio`, `video`, `application`,
  `multipart`, `message`, plus later `model`, `font` (RFC 8081). RFC 9694
  governs new top-levels.
- **Naming**: type/subtype tree per RFC 6838 §4 — `standards` / `vendor` /
  `personal` / `x-` (deprecated); `+suffix` structured-syntax markers
  (`application/vnd.api+json`, `image/svg+xml`); RFC 9239 even fixed
  ECMAScript's types (`text/javascript` is canonical).
- **Parameters** carry the rest of the label: `charset`, `boundary`
  (multipart, RFC 7578), etc. — `type/subtype; param=value` (RFC 2045 token
  grammar).

HTTP, unsurprisingly, disagrees in places — RFC 9110 §8.3 is the Content-Type
authority for web payloads.

## 2. The three sources of truth (and when they disagree)

| Signal | Example | Failure mode |
| --- | --- | --- |
| **Declared** — a header/registry/metadata | `Content-Type: image/png` | wrong or attacker-supplied |
| **Extension** — filename suffix | `photo.jpg` | renamed file |
| **Sniffed** — magic bytes | `FF D8 FF` = JPEG | polyglots (round 9) |

The disagreement cases *are* the security surface. One precedent from this
repo's archive work: CDX captures reporting `text/html` for 1999–2000 Krome
Corp late captures (`kromecorp-rodger-ramrod-casefile.md`) — the declared
label is a capture artifact, not the file's nature.

## 3. Sniffing and `nosniff`

Browsers sniff when the type is absent/unknown — but per the **WHATWG MIME
Sniffing standard**, “sniffing is not *the bytes win*”: the supplied type
decides which byte patterns may override it (§7). Hard-won facts (MDN,
WHATWG §7.2, past-XSS ch.5):

- **Sniffing never turns `text/plain` into HTML** — but a response with *no*
  type or an unknown one whose first bytes are `<` renders as a page **on the
  site's origin** (stored XSS via upload).
- Script destinations accept an absurd range of types without `nosniff`
  (`application/zip`, `application/json`, `text/csv`… all executable as
  script in lenient browsers; `font/woff2` and `video/mp4` are the two that
  fail).
- `X-Content-Type-Options: nosniff` (fetch standard; MDN) blocks style/script
  mismatches and forces the declared type everywhere else.
- **The redeagle caveat:** `nosniff` only helps if your declared type is
  right — replaying a client-supplied Content-Type moves the attacker's
  influence into your database. **Derive the type from your own validation
  (sniff + allow-list), store that.** This is exactly the recipe encoded in
  `tools/mime_lookup.mjs` `checkUpload()`: sniff bytes, map extension, flag
  mismatches, never trust the client's label.

RFC 6838 §4.6 requires registrants to state whether a type carries active
content and how consumers protect users — the registry's own security clause.

## 4. Lab recipe (offline)

```text
node tools/mime_lookup.mjs <file...>     # sniffed vs claimed, flags mismatches
node tools/polyglot_scan.mjs <file...>   # multi-format bytes (round 9)
```

Server-side checklist (the defensive half): set a real `Content-Type` +
`X-Content-Type-Options: nosniff` on **all** responses (Apache: `Header always
set X-Content-Type-Options "nosniff"`); serve uploads as
`application/octet-stream` (or the *derived* type) in a non-HTML context with
`Content-Disposition: attachment`; maintain an allow-list keyed by sniffed
MIME — see the `validateUpload` pattern (zerotool.dev's lookup guide) and the
`file`/`polydet`/TrID detection failures in the polyglot deep dive.

## 5. Repo touchpoints

- `tools/mime_lookup.mjs` — curated IANA-style table for this corpus
  (archives/images/executables/web), sniff + extension + consistency check.
- `tools/polyglot_scan.mjs` — the bytes that defeat labels.
- Format notes that name MIME types: [`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md)
  (`application/x-arj` family), `wikiinajar-image-support.md`
  (case-insensitive MIME serving in `ControllerResponse`),
  `drive-backup-wiki-2026-10-15.md` (route MIME audits),
  `zlibrary-apk-ghidra-research-2026-10-13.md` (`mimeType =` Drive queries).
- MIME types registered *by this project's artifacts*: `image/png`, `.xdc`
  (application/zip world), `application/wasm` (build_casefiles.mjs).

## 6. Provenance

RFC 2045/2046/2049, RFC 6838 (BCP 13) incl. §4.6, RFC 7578, RFC 8081,
RFC 8259, RFC 9110 §8.3, RFC 9239, RFC 9694; IANA media-types registry; MDN
(Guides/MIME_types, X-Content-Type-Options, MIME type verification); WHATWG
MIME Sniffing standard §7/§7.2; http.dev media-types + x-content-type-options;
beyond-xss ch.5 (scriptable types survey); zerotool.dev validateUpload recipe;
redeagle.tech sniffing note. Cited inline; nothing fetched into the repo.
