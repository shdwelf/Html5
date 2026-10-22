# Wiki sample files, vault, and Drive map — 2026-10-16

## Short answer: why TiddlyWiki is hard to find on Drive

The TiddlyWiki files are **inside the backup payload**, not all listed as
standalone files at the Drive folder's top level. The native Webxdc file is
`files/tiddlywiki.xdc` inside `wiki-editions-supplement.zip`. The standalone
`web/tiddlywiki.html` is an entry in the canonical `more.wiki.in.a.jar`, which
is split into two Drive files. The versioned recipe is `wiki-backup.json`.

[Open the Html5 backup folder](https://drive.google.com/drive/folders/1yZhxIeQDNTgO5UXdhttAsiID2On_Eqgr)

| Drive item | Size / contents | Link |
| --- | ---: | --- |
| `wiki-editions-supplement.zip` | 5,061,774 bytes; includes `files/tiddlywiki.xdc` (4,521,176 bytes) | [Open supplement](https://drive.google.com/file/d/1Ll4k1Jhj5oBNhEG8ZcBIrdWl_YnQr8Fb/view?usp=drivesdk) |
| `more.wiki.in.a.jar.part-00` | 94,371,840 bytes | [Open part 00](https://drive.google.com/file/d/1QIdtCbboHZkf-QIJA-wDbSxeCTTllPiu/view?usp=drivesdk) |
| `more.wiki.in.a.jar.part-01` | 74,460,882 bytes | [Open part 01](https://drive.google.com/file/d/1xbE_EFJ6WheMslLithgfyRSR-6CLZD_X/view?usp=drivesdk) |
| `wiki-backup.json` | 6,006-byte recipe; pins expected names, sizes, ranges and SHA-256 values | [Open recipe](https://drive.google.com/file/d/1yyrDLWWYv_6--e1XUb3W4VoFhe1aPfP0/view?usp=drivesdk) |
| `restore-wiki-backup.py` | Standard-library restore helper | [Open helper](https://drive.google.com/file/d/1ZeMfcbx5lGIerzg2CZOgPxp4MG8KbopI/view?usp=drivesdk) |
| `SHA256SUMS` | Download-side integrity list | [Open checksums](https://drive.google.com/file/d/1aSC-6HZTMxBvVSCNjWSHcpfZ9Ozgpojq/view?usp=drivesdk) |

The recipe records `web/tiddlywiki.html` as a 12,903,789-byte member of the
shared JAR (SHA-256 `0cd46832fec95c5b105b9fcbd5e5f7f27ae58cf3e885f177dcaa33d66059f0d1`).
It records `files/tiddlywiki.xdc` in the supplement (SHA-256
`53830b9656da08c94a177d850be0cc505db5102b5da874c09fdd07d147bf1fe3`). The
canonical JAR is 168,832,722 bytes (SHA-256
`013f1f787765640b303785f244d48cd94bf0d2d06fece6d9064a7a8064a0e242`). These
values come from the Drive-hosted recipe; the related 2026-10-15 upload receipt
records Drive-side size/MD5 checks and a local restoration of that prior
snapshot. That backup is from branch `arena/dbace3b9-html5`, commit
`70596d89ee69b984c1ffb0997761ca281cae264d`, not a live copy of this session's
branch. No file or permission in Drive was changed during this check.

## What the wiki contains—and what it does not

The current repository's `tools/wiki-workspace/build.mjs` builds the native
TiddlyWiki from TiddlyWiki 5.4.1. The HTML/XDC edition includes a searchable
source catalog, metadata, bounded text previews, and a bundled DjVu demonstration.
The XDC package explicitly includes the original sample at
`wiki/media/djvu-smoke.djvu`, the demo page, and the local djvu-rs WebAssembly
assets. The small source fixture is `tools/wikiinajar/test/fixtures/boy.djvu`
(4,803 bytes; SHA-256 `8cde44879f3b961d0f3f317500fbfbf8a8f4fd07e030f39b04a0a472e5c17982`); its attribution file identifies the djvu-rs test corpus, credits
the djvu.js fixture source, and applies the Unlicense to the sample.

That demonstration is **not** the complete sample library. The exact bytes for
eligible repository files—including binary samples—live in the content-addressed
`/vault/<sha256>` tree inside the More Wiki JAR. TiddlyWiki's HTML/XDC deliberately
keeps previews and metadata rather than copying the entire binary vault into a
portable note file. This split limits package size and prevents source scripts
from being imported as executable TiddlyWiki modules. The wiki serves vault
entries as downloads, not executable content.

A direct `buildCatalog` scan of this checkout counted **162 `samples/` files**
among 2,354 eligible files; the content-addressed map held 2,066 unique exact-
byte blobs (197,529,585 bytes) after deduplication. A verification loop confirmed
that **all 162/162 sample paths resolve to a SHA-256 vault blob of matching
size**. Representative entries are `samples/bin/michelangelo.bin` (512 bytes),
`samples/archive/games/doom-sw.zip` (2,098,949 bytes), and
`samples/javacard/ShaApplet.java` (1,704 bytes). This is an in-memory verification
of the current source catalog/vault mapping, not a production XDC build or a
claim that the 168 MB historical Drive backup was rebuilt from this branch.

There are also two unrelated local-draft stores: browser storage for TiddlyWiki
edits, and the Greeran Book's browser-local `/`-style draft vault. Neither is the
repository's content-addressed source vault or the Drive backup.

For this continuation, the generated TiddlyWiki now has a **Sample files and
vault** guide, and the classic Wiki-in-a-Jar content set has the same map and
restore pointers. This documents the sample/demo, exact-source vault, Drive
archive, and their distinct roles without placing the full archive in Git.

## Safe restore

Keep the downloaded filenames unchanged. From the directory containing the
backup files:

```sh
sha256sum -c SHA256SUMS
python3 restore-wiki-backup.py --output restored-wiki --extract-source
```

The restore helper checks declared sizes and SHA-256 values, refuses an existing
output directory, and optionally extracts eligible source files. Review the
backup manifest and exclusions first. Treat historical or executable samples as
inert data; restoration does not require executing them.

Repository build/restore details are in
[`tools/wiki-workspace/README.md`](../tools/wiki-workspace/README.md), and the
original backup scope is in
[`docs/drive-backup-wiki-2026-10-15.md`](drive-backup-wiki-2026-10-15.md).
