# Wiki samples and vault

## Three different layers

1. **Native TiddlyWiki HTML/XDC** — portable index, metadata, bounded text previews, and a small bundled DjVu demo. The XDC includes the sample and local WebAssembly decoder; it does not include the complete binary source vault.
2. **More Wiki JAR** — exact eligible repository files, including binary samples, in a content-addressed `/vault/<sha256>` tree. Files are served as downloads, not executed.
3. **Browser drafts** — local TiddlyWiki edits and The Greeran Book's localStorage vault are separate from the repository file vault and the Drive backup.

The demo sample is `tools/wikiinajar/test/fixtures/boy.djvu`. Its attribution and Unlicense notice are in `tools/wikiinajar/test/fixtures/ATTRIBUTION.md`. The workspace build includes it at `wiki/media/djvu-smoke.djvu` in the TiddlyWiki Webxdc, together with `djvu-demo.html` and the decoder assets.

## Find TiddlyWiki in Drive

[Open the Html5 backup folder](https://drive.google.com/drive/folders/1yZhxIeQDNTgO5UXdhttAsiID2On_Eqgr).

The native TiddlyWiki XDC is **inside** [`wiki-editions-supplement.zip`](https://drive.google.com/file/d/1Ll4k1Jhj5oBNhEG8ZcBIrdWl_YnQr8Fb/view?usp=drivesdk), at `files/tiddlywiki.xdc`. The standalone `web/tiddlywiki.html` is inside the canonical More Wiki JAR, which is split across [`more.wiki.in.a.jar.part-00`](https://drive.google.com/file/d/1QIdtCbboHZkf-QIJA-wDbSxeCTTllPiu/view?usp=drivesdk) and [`more.wiki.in.a.jar.part-01`](https://drive.google.com/file/d/1xbE_EFJ6WheMslLithgfyRSR-6CLZD_X/view?usp=drivesdk). The [backup recipe](https://drive.google.com/file/d/1yyrDLWWYv_6--e1XUb3W4VoFhe1aPfP0/view?usp=drivesdk) and [restore helper](https://drive.google.com/file/d/1ZeMfcbx5lGIerzg2CZOgPxp4MG8KbopI/view?usp=drivesdk) explain the byte-exact reconstruction; verify with `SHA256SUMS` before using it.

The 2026-10-15 Drive backup is a versioned snapshot of an earlier branch and is not a live mirror of the current source branch. Its access permissions were not changed during this check. See the full [sample, vault, and Drive map](https://github.com/shdwelf/Html5/blob/main/docs/wiki-samples-vault-drive-map-2026-10-16.md) for file sizes, hashes, and restore commands.

## Safe handling

Some repository samples are legacy executable or archive files. Restoring the backup only reconstructs files; it does not require running them. Treat samples as inert data and analyze them only in a suitable isolated environment.
