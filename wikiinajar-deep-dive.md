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
| 2009-01-07 | **More Wiki in a Jar 0.9.9** (`morewikiinajar.sf.net`) — “improved version of Wiki in a jar by rico_g”, “full Wiki formatting syntax”, Windows-listed | **verified live**: Soft112 version history (“posted on 2009-01-07”, “Several fixes and updates”) [4](https://more-wiki-in-a-jar.soft112.com/) |
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
Contacts are `.vcf` files surfaced through the Vcard controller; the
Calendar controller surfaces dated PIM entries (**inferred** in detail —
the exact date syntax is agenda R3; the browser rebuild therefore
documents its `Date: YYYY-MM-DD` + `BDAY` rule as an adaptation, in-app).

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
| Calendar controller | Calendar view: contact `BDAY`s + `Date: YYYY-MM-DD` page lines | **adaptation, labelled in-app** — original semantics unrecovered (R3) |
| XSL skins | one inline stylesheet + print CSS | — |
| multi-user via shared server | multi-user via webxdc: page saves `sendUpdate({wikiinajar:{type:"page",…}})`, newest `updated` wins per page; deletes propagate | last-writer-wins is a research topic, not a solved one (R4); outside a chat, a simulator shim keeps the file fully functional |
| no byte-range requests (NanoHTTPD) | no byte-range fetches (ZIP-served statics) | DjVu whole-file-on-approach in both editions (R5) |

The seeded jar ships six pages — **Main Page**, **Wiki in a Jar** (the
documentation page, §7), **Wiki Syntax**, **Image Support Demo**,
**SideBar**, **SandBox** — so a fresh bundle is self-documenting before
the first edit, exactly as the Java build's Main Page now links its
documentation and demo.

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
deterministically (645 KB, 11 entries: `index.html`, `manifest.toml`,
`webxdc.js`, `icon.png`, `media/djvu-smoke.djvu`, `djvu-rs/` scalar +
SIMD WASM); the new test file pins the offline single-file shape, the
seed documentation, renderer semantics (headings/lists/links/namespaces/
error strings/escape-first XSS), tag & backlink collection, the bundle
shape, the Java `.wiki` page and this document's cross-links. The Java
smoke test and full-suite results for the patch predate this turn and
are recorded in `docs/wikiinajar-image-support.md`.

## 10. Continued research agenda

Open, numbered, and deliberately falsifiable — pick one up by citing its
number:

- **R1 — Fork diff.** Clone `hugcoday/WikiInAJar` beside
  `astecenko/Wiki-in-a-Jar@a56cfdf`, diff its `img:` route against
  `tools/wikiinajar/src/.../ImageController.java` line by line, and
  record which of its behaviours (caching? resizing? MIME table?) this
  repo should adopt or explicitly reject.
- **R2 — “More Wiki in a Jar” recovery.** The 0.9.9 changelog currently
  rests on one Soft112 line (“Several fixes and updates”, 2009-01-07)
  [4](https://more-wiki-in-a-jar.soft112.com/). Find the
  `morewikiinajar.sf.net` downloads (Wayback), extract a real feature
  list, and check whether 0.9.9's “full Wiki formatting syntax” implies
  markup this renderer should grow (tables? footnotes? templates?).
- **R3 — Calendar semantics.** Read `CalendarController` in the 0.6.1/0.8
  source and state exactly what it aggregates (page dates? vCard
  `BDAY`? anniversaries?), then align or deliberately diverge the
  browser Calendar view, which is currently a labelled adaptation.
- **R4 — Sync conflicts.** Last-writer-wins per page is the webxdc
  default of least surprise, not a merging strategy. Prototype a
  line-based three-way merge (the per-page history already keeps the
  last 10 revisions locally) and measure update-payload sizes against
  real chat limits before promising collaboration.
- **R5 — DjVu range loading.** NanoHTTPD lacks Range; the webxdc static
  host is no better. Assess `WasmLazyDocument`/indirect documents in
  djvu-rs 0.42 for page-at-a-time fetching, or accept whole-file loads
  with a documented size budget (the 4 MB import guard is a guess —
  replace it with a measured one).
- **R6 — vCard fidelity.** Real-world `.vcf` exports (2.1
  quoted-printable, folded lines, `CHARSET`) break naive parsers;
  build a fixture corpus and harden `parseVcards` against it, checking
  what 0.8's Vcard model actually retained.
- **R7 — Renderer conformance.** Fuzz the browser renderer against the
  Java `WikiLinkFilter` chain on the demo corpus (nested lists, pipes
  inside labels, `&amp;` reversal) and publish the diff table; the
  pipe-table and bare-URL behaviours are already marked EXT in code.
- **R8 — Print & longevity.** The Java pitch was “readable in fifty
  years”. Verify the exported jar JSON + `.wiki` files round-trip
  through the *unpatched* 0.8 binary, and give the browser edition a
  tested print stylesheet so a jar can still be flattened to paper.

### Research log

- **2026-10-14** — This conversion. Live checks: SourceForge project,
  files and forum pages; Soft112 0.9.9 history; `wikiinajar2` project;
  webxdc format/API references; NanoHTTPD and DjVu format references
  (§11). Shipped `wikiinajar.html`, `wikiinajar.xdc`, the seed +
  Java documentation pages, and `tests/wikiinajar.test.mjs`. Next
  actions queued as R1–R8 above; R1 and R3 are pure source-reading and
  need no network beyond the two GitHub mirrors.

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
