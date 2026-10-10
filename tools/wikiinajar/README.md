# Wiki-in-a-Jar 0.8 image and DjVu extension

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
