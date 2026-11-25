# Backlog execution — round 78 (2026-11-16)

This round resumes the wiki-workspace item left incomplete in round 77. The
separate native TiddlyWiki workspace now builds successfully, its generated
outputs were backed up to the authorized Google Drive archive, and the remaining
conversion warnings were reviewed. No remote wiki was modified.

## Dependency and build

`package.json` and `package-lock.json` already pin TiddlyWiki **5.4.1**. The
failure in the prior attempt was environmental: the local `node_modules` tree
did not contain the declared package. Restoring the pinned package locally
(`npm install --no-save --ignore-scripts --no-audit --no-fund tiddlywiki@5.4.1`)
left the tracked dependency manifests unchanged.

The separate workspace was built with:

```sh
node tools/wiki-workspace/build.mjs --no-java
```

Result: **11,592 pages**, **3,265 unique source blobs**, snapshot
`bc4bd9afbd8f0044c10ff8590a3b715ace40b9bb19830c8f2f3b61b48625d75f`. The
primary artifacts are `dist/wiki/tiddlywiki.html` (62,704,016 bytes) and
`dist/wiki/tiddlywiki.xdc` (13,215,760 bytes). `--no-java` intentionally omits
the Java/TJWS server and JAR editions; the native TiddlyWiki HTML/XDC and
conversion exports were produced. These portable exports are not the complete
content-addressed source vault.

## Drive backup and integrity

The seven-file portable output bundle contains the TiddlyWiki HTML, XDC,
repository JSON, Tiddler JSON, MediaWiki XML, conversion report and checksums.
It is **82,448,849 bytes** and was uploaded to a dated folder in the authorized
Drive archive. Bundle SHA-256:

`1d54cc91312a6284dea7c1ed6d8c1b8299d76676a75b97d33705dd35c4f5e726`

No private Drive file IDs, links, or inventory details are recorded in this
public research note.

## Conversion-warning review

The four report warnings are intentional scope boundaries, not build failures:

1. No automatic upload to Wikipedia, Wikimedia or Tiddlyhost occurs.
2. Pages are placed under `Repository/`; unresolved or dialect-specific links
   require review.
3. Wiki-in-a-Jar image/DjVu/tag namespaces and contacts need a separate
   MediaWiki migration; the XML export does not contain media bytes.
4. Native source tiddlers use `text/plain` so they remain non-executable; this
   is not a lossless conversion between wiki renderers.

## Verification

- `npm run test:wiki-workspace` — passed: 23 Node tests and 2 Vitest tests.
- The generated catalog includes this repository's prior round 77 note; no
  remote wiki or hosted TiddlyWiki was changed.
