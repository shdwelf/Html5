# Repository Wiki editions

A reproducible, **new 2026 edition**, alongside—not masquerading as—the
historical [Wiki in a Jar 0.8 patch](../wikiinajar/README.md).

## Build and run

Requires Node 20+, Python 3, `tar`, `curl`, Git and **JDK 11+** (tested with Temurin 21).
Set `JAVA_HOME` if Java is not on PATH. The existing recovered
`.relay/jdk/extracted/jdk*/` toolchain is auto-detected. No JDK is downloaded
or bundled by this build.

```sh
npm ci
npm run build:wiki-workspace
java -jar dist/wiki/wiki.in.a.jar 3003
# Or choose a different landing page:
java -jar dist/wiki/more.wiki.in.a.jar 3003
java -jar dist/wiki/tiddlywiki.in.a.jar 3003
```

Open `http://127.0.0.1:3003/`. Each JAR is self-contained and uses **actual
ACME/TJWS**, including the native TiddlyWiki engine, the classic browser wiki,
DjVu decoder, source catalog, exact-byte vault and exports. You can move the JAR
away from this checkout; it needs only a Java runtime. Source files are served
as downloads, never executed. Nothing starts another repository's application.

For a preview or an explicitly shared machine, pass `--bind 0.0.0.0`.
Loopback is the default. Use a trusted network or a TLS/authenticating reverse
proxy for shared access: the catalog and page revisions are public to every
reader who can reach this HTTP server. Private caches and credential filenames
are excluded, but **the build is not a secret scanner**. Review the manifest
before publishing. Do not use an unreviewed snapshot as a public Internet site.

### Editions and scope

| Artifact under `dist/wiki/` | What it is |
| --- | --- |
| `wiki.in.a.jar` | Classic browser wiki landing page, hosted by the new ACME server |
| `more.wiki.in.a.jar` | Repository library landing page, same complete vault and server |
| `tiddlywiki.in.a.jar` | Native TiddlyWiki 5.4.1 landing page, same complete vault and server |
| `wiki-reader-applet.jar` | Separate Java 8 AWT **read-only source reader**, not a JavaScript-to-Java conversion |
| `tiddlywiki.html` | Native single-file wiki containing text previews and metadata; optional DjVu iframe needs companion assets |
| `tiddlywiki.xdc` | Native offline TiddlyWiki, conservative plain-text chat sync and bundled DjVu demonstration |
| `repository.json` | Every included file, digest, explicit references, backlinks and every excluded path |
| `tiddlers.json` | Safe, importable `text/plain` source tiddlers |
| `mediawiki.xml` | MediaWiki 0.11 XML import, with title mapping and caveats in `conversion-report.json` |
| `WikiServer.javap.txt` | Actual `javap -c -p -s` bytecode disassembly, **not** C++ or native assembly |
| `SHA256SUMS` | Artifact digests |

The historical More Wiki in a Jar 0.9.9 source is **not recovered here**. The new
`more.wiki.in.a.jar` name denotes an extended repository edition, not that old
release. The three server JARs have different landing pages, not three
independent rewrites of the engine.

The JARs contain every **eligible regular file in the current working snapshot**,
including non-ignored workspace additions. `.git`, relay caches, private import
areas, environment/credential files, symlinks and build outputs are excluded
with reasons. This is not a clone of Git history and does not fetch every
repository in an account. Files are deduplicated by SHA-256. Library/JSON/XML
previews are capped at 96 KiB; portable native HTML/XDC previews default to 4 KiB
per source file. Both limits are clearly marked; exact bytes remain in the JAR
vault. TiddlyWiki HTML/XDC carry previews and the catalog, **not the complete
binary vault**. Use `--tw-preview-bytes 16384` to choose another native preview
limit (512–98304 bytes), accepting a larger HTML/XDC file.

Add explicitly chosen local checkouts:

```sh
node tools/wiki-workspace/build.mjs --repo OtherProject=/absolute/path/to/checkout
# Smaller, fast integration fixture:
node tools/wiki-workspace/build.mjs --fixture
# Build native TiddlyWiki/exports without compiling Java:
node tools/wiki-workspace/build.mjs --no-java
```

Dependency sources are pinned by commit and SHA-256, fetched into ignored
`.cache/wiki-deps/`, and compiled locally. Once cached, the build needs no
network. `npm ci` pins TiddlyWiki's npm integrity. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licensing and the Servlet
API mirror's provenance limitations. Generated artifacts stay in ignored
`dist/` and `build/`; recreate them instead of committing hundreds of MiB.
The selected output/staging directories are recreated on each build, including
`--no-java`, so stale JARs cannot masquerade as a new snapshot. Stop a server
before rebuilding the JAR it is using. Byte-identical repeats require the same
Node/JDK toolchains; the fixture was built twice with matching artifact hashes.

## Drive backup and recovery

The committed PR #116 baseline and its release outputs have a
[verified Drive backup and continuation record](../../docs/drive-backup-wiki-2026-10-15.md).
The shared JAR bytes are split below the upload limit and deduplicated across
editions; the supplied restore helper reproduces all twelve release artifacts
without recompression. It can also extract the eligible source tree, but does
not claim to restore missing Git history, private runtime data or browser drafts.

```sh
python3 tools/wiki-workspace/restore-backup.py --backup /path/to/downloads \
  --output /path/to/new-restored-directory --extract-source
npm run test:wiki-backup
```

The backup is pinned to its named commit/snapshot. Later work is recorded as a
separate continuation rather than overwriting that baseline. SHA-256 checks and
an output-directory overwrite refusal are mandatory in the restore helper.

## Revisions and vault

Read-only is the default. To enable persistence, supply a newly generated
high-entropy token in **the process environment**, not a URL or command argument:

```sh
export WIKI_WRITE_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
java -jar dist/wiki/more.wiki.in.a.jar --data /your/private/wiki-data
```

Enter that token only in your own server's authorization field. It remains in
browser memory. Do not share it in chat. Pages are separate from immutable
repository blobs: editing a page never modifies the original source file.

- `GET /api/capabilities`: edition, server and write availability.
- `GET /api/pages/<page-id>`: UTF-8 body with an ETag.
- `PUT /api/pages/<page-id>`: bearer token, exact `If-Match`, UTF-8 body ≤1 MiB.
  Missing precondition → 428; stale revision → 409. Nothing is overwritten
  on conflict. Revisions and parent pointers persist under `--data`. Writes use
  atomic rename where supported; no fsync/power-loss durability guarantee is made.
- `GET /api/history/<page-id>`: up to 1,000 revision records, newest first.
- `GET /api/revisions/<page-id>/<revision>`: a previous body, for explicit restore.
- `GET /vault/<sha256>`: immutable repository bytes, attachment disposition.
- `GET /media/<sha256>`: only allowlisted raster/DjVu MIME types, no HTML/SVG.
- `PUT /api/vault/<ciphertext-sha256>` and `GET` of the same path: bearer-protected
  **opaque encrypted envelopes**, at most 16 MiB. Server never receives the
  passphrase. Public repository bytes are not encrypted by this feature.

The library exports a page and optionally its source file (≤8 MiB) using the
**existing** `haiku-vault-v1.` wire format from `src/lib/vaultfile.ts`:
`01 | salt[16] | IV[12] | AES-GCM ciphertext+tag`, ordinary Base64,
PBKDF2-HMAC-SHA256 ×120,000. Browser WebCrypto interoperability is tested against
the Workbench implementation. Wallet/seed payloads are rejected by the wiki
import validator rather than published as notes. Use a strong independent
passphrase. There is no hidden default password and no BIP-39 secret extraction.

The Workbench's IndexedDB `BookVfs` is not silently mounted by a Java process.
The new catalog adopts its content-addressed/deduplicated design and exchanges
explicit files. Browser storage, public snapshot blobs and encrypted envelopes
are separate trust/storage layers. The existing S.S.E. app is **Secret Space
Encryptor**, with a different container and codecs; it is not silently converted
into Haiku v1. No searchable-encryption protocol, unspecified Base65 scheme,
encrypted qcow2 volume or secure-element key wrapping is claimed.

## Calendar and compatibility

`wikiinajar.html` now shows a month grid even with zero events. The Calendar
navigation uses inline SVG rather than relying on an emoji font. Click a day,
choose a title and create a dated page. Local **and bundled** dated titles appear;
contact birthdays recur in valid months. Busy days show two compact previews
and an expandable full agenda; small screens show counts instead of tall columns
of wrapped titles. The active view precedes the sidebar on mobile. No artificial
personal events are seeded.

`/legacy-applet.html` and the separate applet JAR are historical compatibility
artifacts. Modern browsers do not run Java plug-ins. JDK 21 has no appletviewer;
JDK 26 removed the Applet API. Use an isolated legacy JDK 8 appletviewer only
if you deliberately need to test the reader. The recommended GUI is the browser.

## TiddlyWiki, Webxdc and MediaWiki exchange

```sh
node tools/wiki-workspace/convert.mjs exported-wikiinajar-jar.json dist/wiki-import
```

This accepts the current browser's **Export jar** JSON (version 1), preserves
saved text/history in TiddlyWiki fields and XML revisions, skips tombstones,
and emits `tiddlers.json`, `mediawiki.xml`, and a title/conversion report.
It does not contact MediaWiki, Wikipedia, Wikimedia or Tiddlyhost. Import into
a disposable/local MediaWiki first (`maintenance/run.php importDump …`, with
appropriate administrative permission). Images/contacts and dialect-specific
namespaces are not silently converted into MediaWiki uploads.

Native TiddlyWiki source tiddlers deliberately use `text/plain`; repository HTML,
JavaScript and TiddlyWiki system/module imports must never run automatically.
The Webxdc edition syncs only non-system plain-text/wiki-note changes ≤24 KB;
concurrent edits are retained as `Conflict/<serial>/<title>` tiddlers. This is
optimistic conflict preservation, not a CRDT, attachment sync, or Git history.
The official browser-storage plugin keeps edits locally; export HTML/JSON for
backup. A real messenger/device round trip still needs user validation.

## JavaCard and bytecode research

`javacard/VaultDigestApplet.java` is a **source prototype**, now API-compiled and
protocol-tested against a pinned, test-only jCardSim 2.2.2 implementation. It
stores 32 bytes and gates updates with an installation-supplied PIN. This is
not a CAP build, Oracle/card-vendor SDK verification, physical-card installation,
HTTP stack or proof of hardware security. The APDU contract, strict failure
policy and simulator limitations are in [javacard/README.md](javacard/README.md).

```sh
npm run test:wiki-javacard             # optional; JDK 11+, pinned test-only API
npm run test:wiki-javacard -- --offline
```

The 28 scoped checks include two probes confirming limitations, not validating
rollback/Le behavior. No physical reader is accessed; the old simulator is never
added to the wiki runtime. See the
[before/after validation report](../../docs/wiki-javacard-validation-2026-10-15.md).

The PC/SC host client is compiled into the server JAR but never invoked by HTTP:

```sh
java -cp dist/wiki/more.wiki.in.a.jar org.html5.wiki.CardAnchorClient --list
java -cp dist/wiki/more.wiki.in.a.jar org.html5.wiki.CardAnchorClient --read 0
```

`javap` disassembly is generated during the Java build. Ghidra can inspect JVM
class files with its JVM processor, but decompiler output is not a mechanically
correct C++ port. A native/AOT/WASM port requires another runtime and semantic
tests. See the [source-checked research report](../../docs/wiki-workspace-research-2026-10-15.md).

## Validation

```sh
npm run test:wiki-workspace
npm run test:wiki-server   # builds small executable fixture, then tests real HTTP + restart
npm test                  # existing project suite, including calendar/DjVu regressions
```

An optional schema check uses Python `lxml` against the pinned upstream XSD:
`python3 tools/wiki-workspace/validate-mediawiki.py dist/wiki/mediawiki.xml`.
Build/run evidence and explicit pending checks are recorded in the research report.

Optional real Chromium smoke (separate test-only dependencies, not shipped in
any wiki). Start the JAR in another terminal first:

```sh
npm install --prefix .cache/wiki-browser --no-save --no-package-lock --ignore-scripts playwright-core@1.64.1
CHROMIUM_EXECUTABLE=/path/to/chromium node tools/wiki-workspace/browser-smoke.mjs
```

The script checks full-catalog/native counts, the metadata template, local-note
persistence after reload, encrypted file round-trip, compatible exported JSON,
DjVu rendering, event creation and mobile layout bounds. Screenshots stay in
`.cache/wiki-browser-results/`. An optional `@sparticuz/chromium@153.0.0` in the
same prefix can provide a Linux browser instead; minimal images also need its
NSS/NSPR libraries on `LD_LIBRARY_PATH`. That fallback's permissive launch flags
make this a rendering/functional check, **not** a browser-security audit.
