# Deep Dive: Wiki in a Jar — `wiki.in.a.jar`, from USB stick to webxdc

*A provenance, architecture and conversion walkthrough of **Wiki in a Jar**
(0.8, 2008) — the 123 KB Java personal wiki that runs from a USB stick —
written to pair with this repo's Java image/DjVu patch
([`tools/wikiinajar/`](./tools/wikiinajar/),
[`docs/wikiinajar-image-support.md`](./docs/wikiinajar-image-support.md)) and
its new offline rebuild: **[`wikiinajar.html`](./wikiinajar.html)** →
**[`wikiinajar.xdc`](./wikiinajar.xdc)**
(`npm run build:wikiinajar`, source: `scripts/build-wikiinajar-xdc.mjs`).
The documentation page that ships in **both** editions is
[`tools/wikiinajar/public/docs/wiki/Wiki in a Jar.wiki`](./tools/wikiinajar/public/docs/wiki/Wiki%20in%20a%20Jar.wiki)
(Java) and the seeded **“Wiki in a Jar”** page inside the browser wiki.*

> **Related:** the DjVu half of this story is
> [`docs/wikiinajar-image-support.md`](./docs/wikiinajar-image-support.md);
> the “the embedded server is not ACME” byte-check is §5.3 of
> [`docs/lantronix-uclinux-deep-dive-2026-10-08.md`](./docs/lantronix-uclinux-deep-dive-2026-10-08.md);
> the pattern follows this repo's other single-file HTML5 → webxdc
> conversions (e.g. [`yubnub-deep-dive.md`](./yubnub-deep-dive.md)).

---

## 0. Scope & honesty note

This conversion was done on 2026-10-14. Claims below are labelled by how
they were established:

- **verified (live)** — fetched from the public web during this research
  (SourceForge project/file pages, the SourceForge forum thread, the
  Soft112 “More Wiki in a Jar” page, the webxdc developer reference,
  NanoHTTPD and DjVu references). Linked in [§11](#11-sources).
- **verified (repo)** — read from bytes already in this repository: the
  patched 0.8 sources under `tools/wikiinajar/src/`, the build script,
  and the earlier byte-level investigation recorded in
  `docs/wikiinajar-image-support.md` and the Lantronix deep dive. The
  original 123,402-byte distribution zip itself lives in the connected
  Drive backup, **not** in Git, and was not re-downloaded for this turn.
- **inferred** — reasoned from names, routes or second-hand descriptions;
  always flagged, and queued in the research agenda ([§10](#10-continued-research-agenda))
  instead of being smoothed over.

Nothing here requires trusting this document: every load-bearing artifact
(the renderer, the seed pages, the bundle) is pinned by
`tests/wikiinajar.test.mjs`, and the Java side by
`ImageSupportSmokeTest.java` plus `tests/wikiinajar-djvu.test.mjs`.

## 1. What Wiki in a Jar is

> “Wiki in a Jar” is a small Wiki written in Java with great focus on
> simplicity. It is intended to run on a USB stick as a replacement for a
> paper note- and address book as a Personal Information Manager (PIM).
> It supports vcard (vcf) contact files.
> — SourceForge project summary (**verified live** 2026-10-14 [1](https://sourceforge.net/projects/wiki-in-a-jar/))

Unzip `WikiInAJar-0.8-20081128-bin.zip` (123.4 kB) anywhere — a USB stick
is the canonical home — run `bin/start.sh` or
`java -jar wiki.in.a.jar 3003`, and open `http://localhost:3003/wiki`.
There is no installer, no database server, no servlet container and **no
authentication**: the jar carries its own HTTP server, pages are plain
`.wiki` text files under `public/docs/wiki` (one file per page, filename
= page title), contacts are vCard files, and XSL skins render the result.
Author `rico_g`, GPL, web UI, Java (**verified live** [1](https://sourceforge.net/projects/wiki-in-a-jar/);
byte-level details **verified (repo)** in
`docs/wikiinajar-image-support.md`: inner jar 98,464 bytes, main class
`org.rgse.wikiinajar.server.Server`).

That 2008 design point — *one self-contained artifact, your data as plain
files, runs anywhere the runtime already is* — is exactly the webxdc
design point in 2026, with the browser as the runtime that is already
everywhere. That is why this program, of all the repo's subjects, converts
almost mechanically: §6 is a mapping table, not a redesign.

## 2. History & fork census

| When | What | Status / evidence |
| --- | --- | --- |
| 2007-03-17 | SourceForge `OldFiles` line begins | **verified live**: files page lists `OldFiles` dated 2007-03-17 [2](https://sourceforge.net/projects/wiki-in-a-jar/files/) |
| 2007 | 0.x line by rico_g; XRays framework + wiki grow together (GPL headers dated 2007 in the patched sources) | **verified (repo)** |
| 2008-09-16/19 | Axel C. Kramer prototype: Wikipedia-API import into Wiki in a Jar, images in an `/image` subdirectory, templates in a Derby `WikiDB` | **verified live**: SourceForge forum thread “Storing Wikipedia pages” [3](https://sourceforge.net/p/wiki-in-a-jar/discussion/467591/thread/578566c1/) — the earliest known “images in the wiki” fork conversation, two months before 0.8 |
| **2008-11-28** | **0.8 release** — `WikiInAJar-0.8-20081128-bin.zip` (123.4 kB), still the “latest version” on SourceForge | **verified live** [2](https://sourceforge.net/projects/wiki-in-a-jar/files/) |
| 2008-09-27 → 2009-01-07 | **More Wiki in a Jar 0.9.0→0.9.9** by **Jens Fauth (IceMan6paq)** — a German-magazine reader's fork after rico_g went quiet “more than a year”: full UTF-8, table/definition/indent support, nowiki/`<pre>`/comment fixes, anchor links (0.9.8), `<div>`/`<span>` (0.9.9, Arne Lottmann); **image linking still only “Planed”** in Jan 2009 | **verified live 2026-10-14**: Wayback snapshot of the project homepage (2009-01-14 capture) carries the complete release notes [13](https://web.archive.org/web/20090114071254/http://morewikiinajar.sourceforge.net:80/) [14](http://web.archive.org/cdx/search/cdx?url=morewikiinajar.sourceforge.net*&output=text&limit=20); Soft112 metadata [4](https://more-wiki-in-a-jar.soft112.com/) |
| 2009-10-12 | **Wiki in a Jar ²** (`wikiinajar2`) — “Some improvements of more Wiki In A Jar”, DokuWiki/Wikipedia-style edit support, PortableApps starter | **verified live**: SourceForge project page + 2009-10-12 review thread [5](https://sourceforge.net/projects/wikiinajar2/) |
| (mirror) | GitHub mirror `astecenko/Wiki-in-a-Jar`, exact 2008-11-28 `v0.8 update` source commit `a56cfdfc8d343f60c915825a01af24577846cede` | **verified (repo)**, recorded in `docs/wikiinajar-image-support.md` |
| 2012 | Fork `hugcoday/WikiInAJar` adds an `img:` namespace and an image route | **verified (repo)**, ibid. — proof the extension point is the intended one; its path handling is not safe enough to reuse unchanged |
| 2026 | This repo: (a) Java patch adding safe `img:`/`image:`/`djvu:` support + a WASM DjVu reader to 0.8; (b) the HTML5/webxdc rebuild in §6 | this document |

Two census gaps are deliberate agenda items, not oversights: whether
“More Wiki in a Jar” 0.9.9 has recoverable source/changelog beyond the
Soft112 blurb (R2), and a three-way diff of hugcoday's `img:` route
against this repo's `ImageController` (R1).

## 3. The original architecture (0.8, from the bytes)

**Server bootstrap.** `Server.main` refuses to start unless
`./public` exists, registers controllers with the XRays `ActionMapping`,
defaults the port to **3003** (arguments ≤1024 are ignored), and joins the
HTTP thread (**verified (repo)**: `tools/wikiinajar/src/org/rgse/wikiinajar/server/Server.java`
is the patched copy; the 0.6.1-line registration of eight controllers —
Wiki, Vcard, Tag, Find, Index, Admin, Calendar, Tab — is recorded in the
Lantronix deep dive §5.3; this repo's patch makes **nine** by registering
`ImageController`).

**The embedded server is not ACME.** `lib/xrays.jar` unzips to
`net.sf.wikiinajar.xrays.NanoHTTPD`, `HttpServer`, `ActionMapping`,
`PublicController`, `Request`, `View`, `Xml` — a single-file
NanoHTTPD-derived server (Jarno Elonen's 2001 embeddable Java HTTP
server, still maintained as NanoHttpd [6](https://github.com/NanoHttpd/nanohttpd))
relocated into the project's package, with an MVC layer and XSL skins
(`master.xsl`, `root.xsl`, per-view XML) on top (**verified (repo)**,
Lantronix deep dive §5.3–5.4 maps the ACME family separately so the two
are never conflated again).

**Content model.** Pages are files: `public/docs/wiki/<Title>.wiki`.
Contacts are `.vcf` files surfaced through the Vcard controller.

**Calendar, due dates and auto-tags (recovered 2026-10-14, R3).** The
mirror source settles what the Calendar actually does.
`CalendarController` serves one month at a time (twelve actions, year
from the URL id, defaulting to the current month), and
`Month.loadEvents()` fills it from exactly two sources: (1) every
vCard whose `BDAY` falls in that month — an anniversary, matched on
month alone via `Vcard.isBirthdayInMonth()`; and (2) every wiki
article whose **title** contains a date —
`WikiArticle.getDueDate()` runs `.*(\d{4})-(\d{2})-(\d{2}).*` over the
title only, never the body. So `2026-11-05 Dentist` is a calendar
event and a dated body line is not. The same machinery auto-tags:
dated articles and birthday contacts silently gain their month-name
and year as tags (on top of every article's default `all`, `wiki` and
first-letter tags, which this rebuild does not reproduce).
`DateUtils.parseDate()` accepts `yyyy-MM-dd` and `yyyyMMdd`. The
browser Calendar view and tag cloud were rewritten to these exact
semantics — the earlier `Date: YYYY-MM-DD` body-line rule shipped in
the first conversion was an adaptation, and is now recorded here as a
corrected mistake, not quietly deleted.

**Rendering.** `WikiLinkFilter` recognises `[[...]]` and delegates to
`WikiLink`, which splits `namespace:page|label` on the first `:` and `|`
and dispatches (`WikiLink.java`, **verified (repo)**):

| Namespace | 0.8 behaviour |
| --- | --- |
| `wiki` (default) | link to the page; missing page → edit link (`id="editlink"`) |
| `vcard` | link to the contact view |
| `tags` | renders nothing; tags the page |
| `tagtree` | link to the tag-tree view |
| `sidebar` | renders nothing |
| anything else | literal `page (Unknown namespace: ns)` in the output |

Stock 0.8 has **no** `img`/`image`/`djvu` namespace and no image route at
all — that absence is the entire reason `tools/wikiinajar/` exists.

## 4. This repo's Java extension (already shipped)

`tools/wikiinajar/build-image-support.sh` compiles GPL patch sources
against the original jar, runs `ImageSupportSmokeTest.java`, overlays the
skin assets and demo, and emits a replacement installation zip:

1. `WikiLink` recognises `img:`, `image:`, `djvu:` and delegates to
   `ImageFilter`, which emits escaped `<img class="wiki-image">` markup
   for raster files and an accessible DjVu `<figure>` (download link
   first, viewer second) for `.djvu`/`.djv`.
2. `ImageController` serves only supported suffixes beneath
   `public/docs/image`; per-segment validation plus canonical-path
   checks reject `..`, traversal and symlink escapes.
3. `PublicController` gets the same canonical-path treatment for skin
   resources; `ControllerResponse` gains case-insensitive MIME entries
   (WebP/AVIF/DjVu/`.mjs`/`.wasm`/JSON…).
4. The skin lazy-loads a vendored MIT **djvu-rs 0.42.0** WebAssembly
   decoder (scalar + SIMD128): `IntersectionObserver` at 300 px,
   one page at a time at 120 DPI capped to a 2200 px edge,
   Previous/Next controls, download fallback without JS/WASM.
5. Content: `Image Support Demo.wiki`, a demo PNG from the original
   distribution, an attributed DjVu smoke fixture — and, as of this
   conversion, the **`Wiki in a Jar.wiki` documentation page**, linked
   from Main Page by the build script.

Wikitext (identical in both editions):

```text
[[image:diagram.png|Diagram alt text]]
[[img:maps/toronto.webp|Map of Toronto]]
[[djvu:reference.djvu|Read the reference]]
```

DjVu itself is AT&T Labs' 1996 layered scanned-document format — IW44
wavelet colour layers, JB2 bilevel text masks, BZZ-compressed text —
MIME `image/vnd.djvu` [7](https://file-extensions.com/docs/djvu); the
bundled decoder is a pure-Rust clean-room implementation of the public
DjVu v3 spec (IFF/JB2/IW44/BZZ) [8](https://docs.rs/djvu-rs/latest/djvu_rs/),
validated in-repo by `tests/wikiinajar-djvu.test.mjs` against a real
fixture. Known limit, both editions: the old NanoHTTPD has **no
byte-range requests**, so a DjVu downloads in full when its viewer
scrolls near — small documents only (deep dive agenda R5).

## 5. Security audit

| Issue | 0.8 stock | This repo's editions |
| --- | --- | --- |
| Authentication / exposure | **None.** Anyone who can reach port 3003 can read and edit. Documented upstream behaviour; the fix is operational (trusted LAN only), stated in every README/page here | Browser edition inherits the browser profile's trust boundary; webxdc edition inherits the chat's membership. Still no per-page ACLs — stated in-app |
| Path traversal (media/static) | hugcoday-lineage `img:` handling not safe to reuse (**verified (repo)**) | Java: per-segment deny-list + canonical-path containment, traversal probes 404. Browser: `wikiSafePath` rejects `..`, leading `/`, controls and `\:?#*"<>|` before any lookup |
| XSS via wikitext | Link/alt text escaped in the patch (`TextUtils.escapeHtmlChars`, `ImageFilter.escapeAttribute`); smoke test asserts `"><script>` cannot break out | Renderer escapes **all** user text before applying markup; a test pins that `<script>` in a page or alt text renders as `&lt;script&gt;` |
| Remote-image / SSRF surface | None added: no upload endpoint, no remote URLs | None: media is local files / data URLs only; bare URLs autolink but never fetch |
| MIME confusion | Patched `ControllerResponse` is case-insensitive with explicit DjVu/WASM types | Bundle is static ZIP content served by the webxdc host; DjVu bytes are parsed by the sandboxed WASM decoder, never executed |

## 6. The xdc conversion — `wikiinajar.html` → `wikiinajar.xdc`

A webxdc is a ZIP (Deflate/Store) rooted at `index.html`; `manifest.toml`
supplies `name`/`source_code_url`; the host injects `webxdc.js` and the
app runs network-isolated, sharing state only via
`sendUpdate`/`setUpdateListener` [9](https://github.com/deltachat/deltachat-core-rust/blob/main/draft/webxdc-dev-reference.md) [10](https://webxdc.org/docs/spec/api.html).
The repo's established flow (Yubnub, CIA Museum, Four Corners…) is:
author one self-contained HTML file at the root, stage it into
`public/apps/<name>/`, zip deterministically. This conversion follows it
exactly (`scripts/build-wikiinajar-xdc.mjs`, `npm run build:wikiinajar`),
with one honest deviation: the DjVu WASM (1.1 MB, two variants) cannot
live *inside* the single HTML file and keep it a file you would mail
around, so the **bundle** carries `djvu-rs/` and `media/djvu-smoke.djvu`
beside `index.html`, and the bare `.html` degrades to the download-link
fallback — precisely the Java edition's no-JS contract.

| 0.8 (Java) | HTML5 / webxdc rebuild | Notes |
| --- | --- | --- |
| `java -jar wiki.in.a.jar 3003` + browser | open `wikiinajar.html`, or start `wikiinajar.xdc` in a chat | the browser is the stick now |
| `public/docs/wiki/<Title>.wiki` files | pages in `localStorage` (`wikiinajar.pages.v1`); Export emits jar JSON **and** single `.wiki` files the Java edition can drop straight into `public/docs/wiki` | one-page-one-record model preserved |
| Wiki / Index / Find controllers | Page / Index / Search views (hash routes `#/page/…`, `#/index`, `#/search`) | red (missing) links invite creation, as in 0.8 |
| `WikiLink` namespaces (`wiki`, `vcard`, `tags`, `tagtree`, `sidebar`) | same dispatch, same hidden `tags:`/`sidebar:`, same `(Unknown namespace: ns)` literal | pinned by renderer tests; `SideBar` is a real editable page rendered in the rail |
| — (hugcoday / this repo's patch) `img:`/`image:`/`djvu:` | same namespaces, same error strings, same 120 DPI / 2200 px DjVu viewer constants | media lives in a per-device library (`public/docs/image` analogue); **not** synced — update payloads are the wrong truck for megabytes |
| Vcard controller + `.vcf` files | Contacts view; `.vcf` import (`FN/TEL/EMAIL/ORG/BDAY`); `[[vcard:Name]]` links | vCard 2.1 quoted-printable edge cases: agenda R6 |
| Calendar controller (one month, `Month.loadEvents()`) | Calendar view with month navigation: contact `BDAY`s (monthly recurrence) + pages whose **title** contains `YYYY-MM-DD`; dated pages auto-tag month + year in both editions | **aligned 2026-10-14 (R3)** — the first conversion's body-line `Date:` rule was wrong and was replaced; default `all`/`wiki`/first-letter tags not reproduced |
| XSL skins | one inline stylesheet + print CSS | — |
| multi-user via shared server | multi-user via webxdc: page saves `sendUpdate({wikiinajar:{type:"page",…}})`, newest `updated` wins per page; deletes propagate | last-writer-wins is a research topic, not a solved one (R4); outside a chat, a simulator shim keeps the file fully functional |
| no byte-range requests (NanoHTTPD) | no byte-range fetches (ZIP-served statics) | DjVu whole-file-on-approach in both editions (R5) |

The seeded jar ships seven pages — **Main Page**, **Wiki in a Jar** (the
documentation page, §7), **Documentation**, **Wiki Syntax**,
**Image Support Demo**, **SideBar**, **SandBox** — so a fresh bundle is
self-documenting before the first edit, exactly as the Java build's Main
Page now links its documentation and demo.

**Bundled documentation (rebuilt 2026-10-14, one page per `*.md`).** At
build time the script also converts the repository's whole Markdown
library — all 11 root `*.md` (the five `*-deep-dive.md` plus PRIME,
KEYSPACE, ASTRONOMY, GODSEYE, the 4DWM review and the README) and all
128 `docs/*.md` files, **139 pages / 1.44 M source chars** — into native
wikitext with `tools/wikiinajar/md2wiki.mjs` and ships them as
`docs.json` (1.54 MB, beside `index.html` in the bundle; the converter
is dependency-free and deterministic). Conversion is structural, not
verbatim: ATX/setext headings become `==` headings, `**`/`*` become
`'''`/`''`, fences become space-indented pre blocks (including fences
indented inside list items), pipe tables survive as pipe tables, tasks
become ☐/☑ list items, and — the point of doing it — **links between
corpus documents become real `[[wiki links]]`** (587 generated across
the corpus), while non-corpus relative links keep their target as an
inline-code annotation and remote links stay remote. Titles come from
each file's first H1 (sanitised: `:` → ` -`, no `[]|`), disambiguated
on collision; every converted page ends with a provenance footer naming
its source file and `[[tags:documentation,…]]`. In the app the corpus
is *virtual*: a **Docs tab** groups the pages by folder, Index/Tags/
Search treat them as first-class pages, and nothing touches
`localStorage` until a page is edited — saving materialises a local
copy that shadows the bundle, deleting the copy reveals the bundled
original, and deleting a bundled-only page writes a local tombstone.
Rebuilding regenerates the bundled copies and never touches local
pages. (The Java edition was deliberately *not* flooded with 139
`.wiki` files — that was the unchosen scope; its documentation page
remains §7's single hub.)

## 7. The documentation page (both editions, one text)

The requested “wiki.in.a.jar page” exists twice from one source of truth
in spirit:

- **Java:** `tools/wikiinajar/public/docs/wiki/Wiki in a Jar.wiki` —
  conservative 0.8 wikitext only (`==`, lists, `'''`, `[[...]]`,
  `<pre><nowiki>`), covering launch, namespaces, media rules, the
  no-authentication warning, provenance, and the webxdc edition. The
  build script installs it and appends `* Documentation: [[Wiki in a Jar]]`
  to Main Page (idempotently, like the existing demo link).
- **Browser/webxdc:** the seeded **Wiki in a Jar** page in
  `wikiinajar.html` carries the same documentation in the rebuild's
  dialect (adding the pipe-table of namespaces), and `tests/wikiinajar.test.mjs`
  pins that both pages name the launch command, the media folder, the
  image/DjVu syntax and the safety warning — the two texts cannot
  silently drift apart on the load-bearing facts.

## 8. Neighbours — why the jar still matters

The single-file personal wiki has one famous survivor: **TiddlyWiki**,
“a complete wiki experience inside one portable HTML file” that runs
from a USB drive with no database or install [11](https://github.com/Tiddly-Wiki).
Wiki in a Jar made the opposite trade in the same years — a real HTTP
server and plain files instead of one self-modifying HTML document —
and lost the longevity race when browsers ate the “runs anywhere”
advantage. The webxdc edition is the synthesis neither had: TiddlyWiki's
single-artifact portability, the jar's plain-text page model, and a
sync channel (the chat itself) that neither 2008 design could assume.
DokuWiki-on-a-stick and the PortableApps lineage around
“Wiki in a Jar ²” [5](https://sourceforge.net/projects/wikiinajar2/) are
the same instinct with heavier machinery.

## 9. Build, test & validation

```bash
npm run build:wikiinajar          # wikiinajar.html -> wikiinajar.xdc (+ dist/)
node --test tests/wikiinajar.test.mjs
node --test tests/wikiinajar-djvu.test.mjs   # vendored decoder vs real fixture
tools/wikiinajar/build-image-support.sh <WikiInAJar-0.8-20081128-bin.zip> build/WikiInAJar-0.8-image-support.zip
```

Validation for this conversion (2026-10-14): bundle builds
deterministically (≈1.26 MB, 12 entries: `index.html`,
`manifest.toml`, `webxdc.js`, `icon.png`, `media/djvu-smoke.djvu`,
`docs.json`, `djvu-rs/` scalar + SIMD WASM); the test file pins the
offline single-file shape, the seed documentation, renderer semantics
(headings/lists/links/namespaces/error strings/escape-first XSS,
md2wiki `` `code` `` spans), tag & backlink collection, the bundle
shape, the Java `.wiki` page and this document's cross-links. The
documentation rebuild adds: md2wiki unit conversions, a corpus census
asserting one unique-titled page per root/`docs/*.md` file with
provenance footers and no surviving fences, a byte-level check that the
`.xdc`'s `docs.json` matches the staged one, and a full render pass —
all 139 converted pages go through the shipped renderer without
producing script or undefined output (1.78 M HTML chars). Later
passes added: R1 rejection checks and the Java-patch cross-reference,
the R3 Calendar semantics regression lock, the R7 conformance corpus,
the R6 vCard fixture corpus, the R5 lazy-DjVu transport probe, and
the R4 three-way merge algebra, and the R8 print/round-trip
contract, plus the R4 two-client sync simulation — 22 Node tests,
all green. The Java
smoke test and full-suite results for the patch predate this turn and
are recorded in `docs/wikiinajar-image-support.md`.

## 10. Continued research agenda

Open, numbered, and deliberately falsifiable — pick one up by citing its
number:

- **R1 — Fork diff. ✅ Resolved 2026-10-14.** Both mirrors cloned and
  diffed (`astecenko/Wiki-in-a-Jar@a56cfdf` trunk vs
  `hugcoday/WikiInAJar`, whose `Image.java` is credited to “han.xx”).
  The fork adds exactly three things: `models/Image` (a docroot
  constant), an `ImageController`, and `IMG_NAMESPACE` dispatch in
  `WikiLink`. Verdict — **adopt: nothing; reject, with reasons:**
  (1) its markup is `"<IMG src=\"/image/show/" + link + "\">" + link +
  "</IMG>"` — the path is concatenated **unescaped**, there is no alt
  text, and the fork's `WikiLink` actually *deletes* the 0.8 `|label`
  machinery (`splitByNamespace` replaces `splitWikiLink`), so
  `[[img:x.png|label]]` cannot even be expressed; (2) its controller
  is `new File(Image.getImageDir()+"/" + request.getPath().getId())`
  with an `exists()` check — no canonicalisation, no segment rules, no
  extension whitelist, so `../` walks out of the image directory and
  any file type inside it is served; (3) a miss returns an
  `errorResponse("找不到！ …")` instead of a 404. It also predates the
  label support it regressed, i.e. it forked an older snapshot than
  0.8. This repo's patch (escaped labels, per-segment + canonical
  checks, suffix whitelist, subdirectories, DjVu, MIME table) stands
  as the safer superset; the fork remains valuable as proof that
  `img:` was the community's chosen extension point (§2).
- **R2 — “More Wiki in a Jar” recovery.** The 0.9.9 changelog currently
  rests on one Soft112 line (“Several fixes and updates”, 2009-01-07)
  [4](https://more-wiki-in-a-jar.soft112.com/). Find the
  `morewikiinajar.sf.net` downloads (Wayback), extract a real feature
  list, and check whether 0.9.9's “full Wiki formatting syntax” implies
  markup this renderer should grow (tables? footnotes? templates?).
  *Attempted 2026-10-14:* Soft112 re-fetched — it adds only metadata
  (437 downloads, Windows XP/Vista/7 listing, file size N/A, no binary
  hosted there); the Wayback availability API returned HTTP 429.
  **✅ Resolved later the same day** via the CDX API: 26 captures
  (2008-10-09 → 2025) [14](http://web.archive.org/cdx/search/cdx?url=morewikiinajar.sourceforge.net*&output=text&limit=20),
  and the 2009-01-14 homepage snapshot carries the complete release
  notes [13](https://web.archive.org/web/20090114071254/http://morewikiinajar.sourceforge.net:80/).
  Author: **Jens Fauth (IceMan6paq)** — found the wiki through a
  German computer magazine, missed the standard formatting, forked
  after rico_g had been quiet “more than a year”. Release train:
  full UTF-8 + indent/definitions/`<pre>`/comments (0.9.0, Frank Dietrich),
  tables + `<tt>` (0.9.5), `=`-in-heading fix (0.9.6), **anchor links**
  (0.9.8 — adopted into this renderer the same day), `<span>`/`<div>`
  (0.9.9, Arne Lottmann — not adopted: escape-first is the security
  boundary). Still “Planed” in January 2009: **image linking** (the
  second independent confirmation it was the missing feature), a
  print view, a sidebar and version diffs — the roadmap this
  rebuild's print CSS, SideBar page and per-page history echo.
- **R3 — Calendar semantics. ✅ Resolved 2026-10-14** — see §3
  (“Calendar, due dates and auto-tags”). The browser Calendar, page
  tag chips and Tags view now implement the recovered semantics
  (title-dates + `BDAY` anniversaries, month navigation, month/year
  auto-tags); the previous body-line adaptation was replaced, and a
  test greps that it stays gone.
- **R4 — Sync conflicts. ✅ Resolved 2026-10-14.** The sync protocol
  is now v2: a save update carries `baseHash` (djb2 of the revision
  the edit started from) plus `baseUpdated` — 63 bytes of overhead on
  a median-corpus page (8,040 → 8,103 bytes measured against the 139
  bundled pages, median 7,940 chars), against ~15,990 bytes had the
  base *text* been shipped. The receiver looks the hash up in its
  current body, then its 10-deep history, and runs `wikiMerge3`: an
  LCS line-diff three-way merge where disjoint edits combine,
  same-anchor appends concatenate, identical edits deduplicate, and
  overlapping edits land as visible `<<<<<<< yours / ======= /
  >>>>>>> theirs` markers with a ⚠ flag in the page meta. When no
  common ancestor survives, nothing is silently lost either: the
  newer body wins and the superseded one is stashed in History with
  an `unbased`/`force`/`delete` conflict flag; explicit Share is the
  only forcing path. Deletes racing newer edits keep the page and
  flag `delete`. Covered by the R4 test (merge algebra + wire-format
  pins). The receiver was since factored into the pure
  `wikiApplySync`, and a two-client protocol simulation in the same
  suite now proves convergence for disjoint edits, no-loss flagged
  conflicts for same-line edits, and correct delete/edit races —
  against the shipped code, not a reimplementation. Still unproven,
  honestly: a live two-device Delta Chat session, which needs the
  chat host this sandbox cannot run.
- **R5 — DjVu range loading. ✅ Assessed 2026-10-14 — API proven,
  transport is the blocker; whole-file loading kept deliberately.**
  The vendored decoder exports `WasmLazyDocument.open(totalLen,
  fetchCb)`, indexing from head bytes and fetching only each
  requested page's range; a Node test in
  `tests/wikiinajar-djvu.test.mjs` proves the flow (range callback →
  `page_info` → `render_page` pixels) on the smoke fixture. None of
  this repo's transports can feed it ranges today: NanoHTTPD has no
  Range, the webxdc host serves whole ZIP entries, media items are
  already whole data URLs. Unblock condition, recorded instead of
  coded speculatively: a Range-capable HTTP origin for DjVu files.
  The 4 MB import guard stays a labelled guess.
- **R6 — vCard fidelity. ✅ Resolved 2026-10-14.** `parseVcards` now
  unfolds folded lines, strips QP soft breaks first, decodes
  `ENCODING=QUOTED-PRINTABLE` (UTF-8), accepts `itemN.` prefixes and
  `;TYPE=` params, unescapes `\,`/`\;`/`\n`, and keeps `BDAY` in
  `yyyy-MM-dd` / `yyyyMMdd` / `--MM-dd` forms. A two-card fixture
  corpus (2.1 QP + folded 3.0) pins it in the test suite. Recorded
  divergence: 0.8's `Vcard` retains all properties generically;
  this rebuild keeps the five displayed PIM fields
  (FN/TEL/EMAIL/BDAY/ORG) and promises nothing else.
- **R7 — Renderer conformance. ✅ Resolved 2026-10-14** (first pass
  plus the executed Java corpus below).
  The 0.8 chain is now enumerated from `RenderEngine` (NoWikiCapture →
  Section → Heading → Hr → Intended → Url → List → Strongest →
  Stronger → Strong → WikiLink → Break → HtmlTags → Table →
  NoWikiInsert) over `escapeHtmlChars` output — the same escape-first
  order this renderer uses. Aligned in this pass: `''''x''''` →
  `<i><b>` (StrongestFilter; tag names corrected to Java's own after
  the executed corpus below first read them as `<em><strong>`),
  `= H =` → `<h1>` (HeadingFilter
  emits `<h` + count), `-` list bullets (ListFilter's `[-#*]+`),
  MediaWiki `{| … |}` tables (TableFilter — the pipe-table form
  remains a marked md2wiki EXT), and `ftp://` autolinks (UrlFilter).
  Also aligned: literal `<br/>` in wikitext stays a break
  (BreakFilter un-escapes exactly that), and the HtmlTagsFilter
  allowlist (`code`, `tt`, `pre`) is un-escaped after markup — safe
  here because all user text was escaped first, so only the tag
  brackets revive, never injected markup. Known remaining
  divergences, deliberately kept and documented here rather than in
  code comments alone: SectionFilter's blank-line `<p>&#160;</p>`
  spacers (this renderer uses real paragraph separation), and
  HeadingFilter emitting invalid `<h7>`+ for long `=` runs (capped
  at 6 here). The automated side now exists as the **R7 conformance
  corpus** in the test suite (nested lists, first-`|` labels, `&amp;`
  reversal at both typing layers, anchor links, unbalanced-heading
  quirks — including one case, `== H ===`, where Java and this
  renderer produce the same `<h2>H =</h2>` by different mechanics,
  and the mirrored `=== H ==`, where they genuinely diverge).
  **✅ Executed 2026-10-14:** the corpus (extended to 18 cases) was
  run through the real filters — the astecenko trunk + XRays sources
  compiled unmodified under Temurin 21 (`RenderEngine.render(
  escapeHtmlChars(x))`, cwd seeded with `Main Page.wiki` to mirror
  the Node context). Results after normalising href prefixes and
  the documented SectionFilter spacers: 2 byte-identical, the rest
  classified — presentational only (`<li >` spacing, table
  `class='even|odd'` rows, `<pre id='intended'>`, `<hr/>` spelling),
  paragraph model (Java leaves body text bare; this renderer wraps
  `<p>`), route encoding (`Main+Page` form-encoding + `title=`
  attributes vs hash routes), and browser-side improvements kept on
  purpose (`target=_blank rel=noopener` on external links). Two
  facts were *proven* rather than inferred: `=== H ==` stays raw in
  Java (the pinned divergence is real), and anchor links are absent
  from 0.8 — `[[Main Page#Top]]` becomes an edit link for a page
  literally named `Main Page#Top`, so anchors stay credited to More
  0.9.8 alone. One new discovery: `WikiLink` rejects targets
  containing `\ * / : ? " < > |` with the literal text `(Link must
  not contain: \*/:?"<>|)` — the browser keeps `/`-titles as a
  documented storage-key divergence, now with the exact Java error
  string on record. Remaining R7 work: none queued; further cases
  belong in the Node corpus first.
- **R8 — Print & longevity. ✅ Resolved 2026-10-14.** Print: the
  `@media print` block now hides all chrome and non-visible views,
  flattens panels to white, wraps `<pre>`, and keeps headings with
  their text (`break-after: avoid`) — a jar page prints as a clean
  document; a test pins the rules. Round-trip: the unpatched 0.8
  *binary* is unreachable from this sandbox (SourceForge is outside
  its egress), so the original was instead compiled unmodified from
  the recovered trunk sources (wiki + XRays framework, Temurin 21)
  and booted on port 3003. Every seed page plus three converted
  corpus pages were written as `.wiki` files into its
  `public/docs/wiki/` — all render (`<h2>` structure intact, index
  lists them, calendar answers 200, no unescaped script). Boundaries
  found, honestly: jar JSON remains a browser-side format (Java has
  no JSON import — the `.wiki` file is the interchange, and always
  was), extension namespaces degrade to 0.8's own `Unknown
  namespace: …` text rather than corrupting pages, and titles must
  satisfy the Java filename rules (`\ * / : ? " < > |` forbidden) —
  a test now pins every seed title as Java-safe. “Readable in fifty
  years” holds for exactly the layer rico_g designed it for: plain
  text files with the title as the filename.

### Research log

- **2026-10-14** — This conversion. Live checks: SourceForge project,
  files and forum pages; Soft112 0.9.9 history; `wikiinajar2` project;
  webxdc format/API references; NanoHTTPD and DjVu format references
  (§11). Shipped `wikiinajar.html`, `wikiinajar.xdc`, the seed +
  Java documentation pages, and `tests/wikiinajar.test.mjs`. Next
  actions queued as R1–R8 above; R1 and R3 are pure source-reading and
  need no network beyond the two GitHub mirrors.
- **2026-10-14 (continued research: R1, R3, R7, R2-attempt)** —
  Cloned both GitHub mirrors into a scratch dir (not committed) and
  read the 0.8 sources directly. R3 resolved from
  `Month.loadEvents()` / `WikiArticle.getDueDate()` /
  `Vcard.isBirthdayInMonth()` / `DateUtils.DATE_FORMATS`; the app's
  Calendar was rewritten to the recovered semantics (its first-pass
  body-line rule is preserved above as a corrected mistake) and dated
  pages now auto-tag month + year. R1 resolved with an adopt-nothing
  verdict and three cited defects in the hugcoday route (§10). R7
  first pass: filter chain enumerated, five behaviours aligned in the
  renderer, four divergences documented as deliberate. R2 attempted:
  Soft112 metadata only; Wayback availability API 429 — retry via CDX
  queued in R2. Tests: 16/16 (wikiinajar + DjVu).
- **2026-10-14 (documentation rebuild)** — “A page for each `*.md`”:
  added `tools/wikiinajar/md2wiki.mjs` (Markdown → wikitext), taught
  the build to bundle all 139 root + `docs/*.md` files as `docs.json`,
  and gave the app virtual bundled pages (Docs tab, copy-on-edit,
  tombstone deletes) plus a seeded **Documentation** guide. Converter
  bugs found and fixed on the way: relative-link annotations
  duplicating `[path](path)` labels, and fences indented inside list
  items leaking literal fence markers into pages. Follow-ups worth queuing:
  reference-style links and setext-heavy sources are rare in this
  corpus (0 files use link definitions) but md2wiki's coverage should
  be re-audited whenever a new documentation style lands — see R7.
- **2026-10-14 (continued research: R2, R5, R6, R7 corpus)** — The
  Wayback CDX snapshot of the More Wiki in a Jar homepage resolved
  R2 (Jens Fauth's 0.9.0→0.9.9 release notes; the census above and
  the R2 entry carry the detail), and its 0.9.8 anchor links were
  implemented in the browser renderer the same day. R5's lazy DjVu
  opening is proven in Node but transport-blocked in-app (see the
  R5 entry). R6's vCard fixtures are in the suite and `parseVcards`
  hardened accordingly. The R7 conformance corpus codified nested
  lists, first-`|` labels, both `&amp;` typing layers and the
  unbalanced-heading quirks — one corpus expectation was wrong on
  inspection (typed `&amp;` *should* stay visible, matching Java),
  which is exactly what the corpus is for. 19 Node tests green.
- **2026-10-14 (continued research: R4)** — Sync grew a protocol v2:
  saves name their base revision by hash (63 bytes median overhead,
  measured), receivers three-way merge via `wikiMerge3` when the
  base survives in current body or history, and every fallback path
  (no base, forced Share, delete races) preserves the superseded
  body in History behind a visible ⚠ conflict flag instead of
  overwriting silently. The seeded documentation page now describes
  merging rather than newest-wins. 20 Node tests green.
- **2026-10-14 (continued research: R7 executed corpus, R8)** — The
  staged JDK 21 tarball in `.relay/jdk/` was reassembled (SHA-256
  verified) and the astecenko trunk + XRays sources compiled
  unmodified. The 18-case corpus ran through the real
  `RenderEngine`, confirming the pinned divergences by execution
  (raw `=== H ==`, no anchors in 0.8), correcting the emphasis tag
  names to `<b>`/`<i>`, and surfacing the `WikiLink` forbidden-char
  rejection with its exact error text (R7 entry). The same compiled
  original then served this rebuild's seed + converted pages as
  `.wiki` files — the R8 round-trip — while the browser edition
  gained a tested print stylesheet; the sync receiver was factored
  into pure `wikiApplySync` and a two-client protocol simulation
  added to the suite. 22 Node tests green. Scratch
  clones and the corpus harness live outside the repo and are
  reproducible from the commands in the R7/R8 entries.

## 11. Sources

1. SourceForge — Wiki in a Jar project summary (pitch, vCard support, Java/web UI). https://sourceforge.net/projects/wiki-in-a-jar/
2. SourceForge — Wiki in a Jar files (0.8 zip 123.4 kB, 2008-11-28; OldFiles 2007-03-17). https://sourceforge.net/projects/wiki-in-a-jar/files/
3. SourceForge forum — “Storing Wikipedia pages” (Kramer, 2008-09-16/19: Wikipedia API prototype, `/image` subdirectory, Derby WikiDB). https://sourceforge.net/p/wiki-in-a-jar/discussion/467591/thread/578566c1/
4. Soft112 — More Wiki in a Jar 0.9.9 (improved version by rico_g's lineage; version history, 2009-01-07). https://more-wiki-in-a-jar.soft112.com/
5. SourceForge — Wiki in a Jar ² (`wikiinajar2`: improvements of More Wiki in a Jar, DokuWiki/Wikipedia-style editing, PortableApps starter). https://sourceforge.net/projects/wikiinajar2/
6. NanoHttpd — tiny embeddable single-file Java HTTP server (Elonen lineage). https://github.com/NanoHttpd/nanohttpd
7. DjVu file-format documentation (AT&T 1996; IW44/JB2/BZZ; `image/vnd.djvu`). https://file-extensions.com/docs/djvu
8. djvu-rs crate documentation (pure-Rust DjVu v3 decoder: IFF, JB2, IW44, BZZ). https://docs.rs/djvu-rs/latest/djvu_rs/
9. Delta Chat core — Webxdc developer reference (ZIP format, `manifest.toml`, `webxdc.js`). https://github.com/deltachat/deltachat-core-rust/blob/main/draft/webxdc-dev-reference.md
10. Webxdc JavaScript API (`sendUpdate` / `setUpdateListener`, network isolation). https://webxdc.org/docs/spec/api.html
11. TiddlyWiki — single-HTML-file portable personal wiki. https://github.com/Tiddly-Wiki
12. In-repo: `docs/wikiinajar-image-support.md`; `docs/lantronix-uclinux-deep-dive-2026-10-08.md` §5.3–5.4; `tools/wikiinajar/` (patch sources, build, notices); GitHub mirrors `astecenko/Wiki-in-a-Jar` and `hugcoday/WikiInAJar` as recorded there.
13. Internet Archive Wayback Machine — More Wiki in a Jar homepage, captured 2009-01-14: “More wiki in a jar”, ©2008/2009 Jens Fauth, complete 0.9.0→0.9.9 release notes, screenshots and roadmap. https://web.archive.org/web/20090114071254/http://morewikiinajar.sourceforge.net:80/
14. Internet Archive CDX API — capture index for `morewikiinajar.sourceforge.net` (2008–2025), used after the availability API returned 429. http://web.archive.org/cdx/search/cdx?url=morewikiinajar.sourceforge.net*&output=text&limit=20
