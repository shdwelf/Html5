# Wiki-in-a-Jar 0.8 image and DjVu support

Investigation and implementation notes for the Drive-backed
`WikiInAJar-0.8-20081128-bin.zip`.

## Source and runtime investigation

- The binary was retrieved from Google Drive (`WikiInAJar-0.8-20081128-bin.zip`,
  123,402 bytes) and extracted only into ignored working files. Its inner jar is
  98,464 bytes and carries `org.rgse.wikiinajar.server.Server` as its main class.
- The 0.8 application jar contains no `ImageController`, `ImageFilter`, or
  `img`/`image`/`djvu` namespace. `WikiLinkFilter` recognizes `[[...]]` and
  delegates links to `WikiLink`; `RenderEngine` then applies the existing filter
  chain. The skin's article XSL copies rendered article content as HTML.
- The GitHub mirror [`astecenko/Wiki-in-a-Jar`](https://github.com/astecenko/Wiki-in-a-Jar)
  has the exact 2008-11-28 `v0.8 update` source commit
  `a56cfdfc8d343f60c915825a01af24577846cede`. A later 2012 fork,
  [`hugcoday/WikiInAJar`](https://github.com/hugcoday/WikiInAJar), adds an
  `img:` namespace and an image route, confirming the intended extension point;
  its path handling is not safe enough to reuse unchanged.
- The previously reported compiler blocker is resolved. The split, ignored
  `.relay/jdk/jdk21.tar.gz.part-*` files reassemble to the SHA-256 recorded in
  `.relay/jdk/jdk21.sha256`; the extracted Temurin JDK is 21.0.12.1 and includes
  `javac`, `jar`, and `javap`. No credential or Drive files were changed.

## What the extension adds

The build script compiles source patches against the original 0.8 jar and
repackages the full installation:

1. `WikiLink` recognizes `img:`, `image:`, and `djvu:` namespaces. It produces
   escaped local `<img>` markup for supported raster files and an accessible
   DjVu figure with a persistent download link for `.djvu`/`.djv` files.
2. `ImageController` serves only supported image/DjVu suffixes beneath
   `public/docs/image`. Canonical-path checks reject `..`, traversal, and
   symlinks that resolve outside the image directory.
3. The patched server registers `ImageController`. The static skin controller
   also checks canonical paths before opening resources.
4. `ControllerResponse` supplies correct case-insensitive MIME types for the
   supported raster formats, DjVu, JavaScript modules, WebAssembly, and JSON.
5. The skin loads a vendored MIT-licensed `djvu-rs` 0.42.0 WebAssembly decoder.
   DjVu placeholders are activated lazily near the viewport, render one page
   at a time, and include previous/next controls. The download link remains
   usable when JavaScript/WebAssembly is disabled.
6. A demo article, a sample PNG taken from the original distribution, and a
   small attributed DjVu smoke fixture make the feature visible in the rebuilt
   package.

Wikitext examples:

```text
[[image:diagram.png|Diagram alt text]]
[[img:maps/toronto.webp|Map of Toronto]]
[[djvu:reference.djvu|Read the reference]]
```

Local media belongs under `public/docs/image`. No upload endpoint is added.

## Build and validation

Run `tools/wikiinajar/build-image-support.sh` with the Drive distribution zip
and an output zip path. The script targets Java 8 bytecode, compiles the patched
classes, runs `ImageSupportSmokeTest.java`, overlays the skin assets and demo,
and creates a replacement installation archive. See
[`tools/wikiinajar/README.md`](../tools/wikiinajar/README.md).

The vendored browser decoder is validated by a Node test that initializes the
same scalar/SIMD WebAssembly package shipped with the app, parses a real DjVu
fixture, and renders its first page to RGBA pixels. This is separate from the
Java server smoke test.

Validation completed:

- The rebuilt jar boots under the recovered Temurin JDK. Java assertions cover
  `img:`, `image:`, and `djvu:` markup, output escaping, traversal rejection,
  unsupported suffixes, and case-insensitive MIME selection.
- The packaged demo server returned HTTP 200 for the demo article. The rendered
  XML contained one raster `<img>` and one DjVu viewer figure; the code examples
  stayed literal. PNG/DjVu/JavaScript/WebAssembly routes returned their expected
  MIME types, and image/static-path traversal probes returned 404.
- `node --test tests/wikiinajar-djvu.test.mjs` passed. Full `npm test` passed:
  34 Vitest files / 300 tests, plus 183 Node tests passed and 5 optional Node
  tests were skipped.

## Limitations and safety

- The old NanoHTTPD does not implement byte-range requests. The reader downloads
  a DjVu file in full when it is near the viewport; use smaller files where
  browser memory is constrained.
- The app has no authentication. Do not expose its default server directly to
  the public Internet.
- The image endpoint does not accept remote URLs and does not add image-upload
  functionality. User-provided files must be copied into the local image
  directory.
- Browser rendering requires modern JavaScript, WebAssembly, and Canvas. The
  original file can still be downloaded without the viewer.

## Third-party notices

See [`tools/wikiinajar/THIRD_PARTY_NOTICES.md`](../tools/wikiinajar/THIRD_PARTY_NOTICES.md)
for GPL source provenance, the MIT WebAssembly package, and the smoke-fixture
attribution.
