# Wiki-in-a-Jar 0.8 image and DjVu extension

> For the **new self-contained ACME repository JARs**, native TiddlyWiki/Webxdc,
> revision store and encrypted vault exchange, use
> [`../wiki-workspace/README.md`](../wiki-workspace/README.md).
> The build on this page remains the separate historical 0.8 patch.

> **Editions:** this tool patches the Java original. The same wiki also
> ships as a single offline HTML file ([`wikiinajar.html`](../../wikiinajar.html))
> and a Webxdc bundle (`wikiinajar.xdc`, `npm run build:wikiinajar`); the
> documentation page [`public/docs/wiki/Wiki in a Jar.wiki`](public/docs/wiki/Wiki%20in%20a%20Jar.wiki)
> installed by the build below is mirrored as the seeded “Wiki in a Jar”
> page there. History, architecture, security audit and the open research
> agenda: [`wikiinajar-deep-dive.md`](../../wikiinajar-deep-dive.md).

This extension rebuilds the Drive-backed Wiki-in-a-Jar 0.8 distribution with:

- `[[img:file.png|Alt text]]` and `[[image:file.webp|Alt text]]` raster syntax;
- `[[djvu:file.djvu|Caption]]` / `[[img:file.djvu|Caption]]` DjVu readers;
- a local `/image/show/...` route rooted safely at `public/docs/image`;
- correct JavaScript, WebAssembly, and image MIME types;
- canonical-path checks for both image files and existing skin resources;
- a lazy-loaded browser reader using the bundled MIT-licensed `djvu-rs` WebAssembly decoder.

The browser reader renders one page at a time, includes previous/next controls,
and keeps a download link. It downloads each DjVu file in full when its viewer
scrolls near the viewport; the original NanoHTTPD does not implement byte-range
requests. Keep large documents in a separate viewer or use smaller documents.
The application has no authentication and is intended for a trusted local
network only.

## Repository notes

`sync-docs.mjs` copies the newest dated notes from the repository's `docs/` directory
into the wiki content set (`public/docs/wiki/*.wiki`) and writes
`wiki-pages.json` as the manifest:

```sh
node tools/wikiinajar/sync-docs.mjs            # newest nine dated notes
node tools/wikiinajar/sync-docs.mjs --count 3  # newest three
node tools/wikiinajar/sync-docs.mjs --check    # fail if any page has drifted from its note
```

Each page keeps the note verbatim except for its headings, which are promoted to
`=`-style wiki headings, and carries a `Source: docs/...` line plus a link back to the
Main Page. `build-image-support.sh` copies the whole content set and appends a
"Repository notes" section to the Main Page, newest first, straight from the manifest.
The Node suite (`tests/wikiinajar-docs-sync.test.mjs`) runs `--check`, so a page that
outlives the note it came from fails the tests rather than shipping silently.

## Recovered distribution and runtime verification

The original 123,402-byte distribution was retrieved again on 2026-10-15 after
the PR #116 Drive backup completed. Its identity, fresh patch build and nine
loopback HTTP checks are recorded in
[the backup/continuation note](../../docs/drive-backup-wiki-2026-10-15.md).
This is historical 0.8 / XRays / NanoHTTPD, **not** ACME or More Wiki 0.9.9.

For a trusted rebuilt installation, the bounded harness starts and stops its
own JVM and refuses a configuration that enables remote clients:

```sh
python3 tools/wikiinajar/test/http-smoke.py --app /path/to/extracted/wiki.in.a.jar \
  --report /path/to/http-smoke.json
```

`--app` names the installation directory containing both `wiki.in.a.jar` and
`public/`, not the JAR file itself. Java lookup follows `JAVA_HOME`, the recovered
local JDK, then PATH. The historical socket binds all interfaces and filters
non-loopback peers by default; this is not authentication. The readiness check
sends a complete HTTP request because a bare connect/close probe can terminate
the old accept loop. This harness does not fix or harden that legacy engine.

## Build

The original 123,402-byte `WikiInAJar-0.8-20081128-bin.zip` is in the connected
Google Drive backup, not in Git. Download it to the workspace, then run:

```sh
JAVA_HOME=/path/to/a/jdk \
  tools/wikiinajar/build-image-support.sh \
  google_drive/WikiInAJar-0.8-20081128-bin.zip \
  build/WikiInAJar-0.8-image-support.zip
```

The script targets Java 8 bytecode, runs Java-level smoke assertions, patches
the original jar's `Server`, `WikiLink`, `PublicController`, and
`ControllerResponse` classes, overlays the web assets, and emits a replacement
installation zip. If `JAVA_HOME` is not set, a JDK on `PATH` is used; the local
`.relay/jdk` JDK is auto-detected when present.

After extracting the output, run `bin/start.sh` or:

```sh
java -jar wiki.in.a.jar 3003
```

Put images under `public/docs/image`. Supported raster types are PNG, JPEG,
GIF, WebP, BMP, and AVIF; `.djv` and `.djvu` are decoded in-browser. The package
includes a demo icon and a tiny attributed DjVu smoke page.

## Tests

`build-image-support.sh` runs `ImageSupportSmokeTest.java` against the actual
Wiki-in-a-Jar 0.8 jar before repackaging. The main Node suite also checks that
the bundled WebAssembly decoder can parse and render a real DjVu page:

```sh
npm test
```

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for upstream and license
attribution.
