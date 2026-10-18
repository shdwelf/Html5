# Sneakers Computer Press Kit · Webxdc

A self-contained Webxdc player shell, patterned after `headline-harry.xdc`, for the DOS press-kit preview already present in this repository.

## Build

From the repository root:

```sh
make webxdc
# or
node scripts/build-sneakers-press-kit-xdc.mjs
```

The reproducible output is `sneakers-press-kit.xdc`, a ZIP-format Webxdc with `index.html` at its root. Check a previously built file without rewriting it:

```sh
node scripts/build-sneakers-press-kit-xdc.mjs --check
```

For a standalone browser preview, run `python3 webxdc-sneakers/serve-preview.py` from the repository root. It serves the same app directory with cross-origin-isolation headers for the local WASM runtime.

The archive carries the complete local js-dos 8.4.1 runtime, a local `SNEAKERS.jsdos` bundle, app icon, manifest, Webxdc preview shim, and this README. The player starts the bundle with js-dos v8's options API and uses relative paths; no CDN, Archive.org download, cloud save, or remote game fetch is used at runtime.

## Source investigation and provenance

The three references supplied for this build are kept as source links in the app:

- [Retrogames.pro: Sneakers Computer Press Kit](https://retrogames.pro/2023/06/23/sneakers-computer-press-kit-universal-city-studios-pc-dos-play-online-in-your-browser/) — secondary browser-play article.
- [Internet Archive: `Sneakers_Film_Promotional_Floppy`](https://archive.org/details/Sneakers_Film_Promotional_Floppy) — primary archival record for the floppy and associated files.
- [eBay item 365528826482](https://www.ebay.com/itm/365528826482) — time-sensitive collector listing; an auction/listing is not, by itself, evidence that a particular digital file matches the archival image.

The repository's earlier research note, `webxdc-dos/public/roms/README_SNEAKERS.md`, records Archive.org metadata for the original `sneakers.img` (1,474,560 bytes) and `Sneakers_Promotional_Diskette.zip` (2,066,643 bytes), along with their listed hashes. Those original disk/ZIP bytes are **not** present in this checkout and are **not** embedded here. The existing note also records that the original ZIP was not downloaded for byte-level comparison; its opening manifest paragraph predates the current reconstruction and should not be treated as an inventory of the original archive.

Instead, this Webxdc packages the repository's browser-ready reconstruction:

- `webxdc-dos/public/roms/SNEAKERS.jsdos` (9,451 bytes; SHA-256 `1e8201c36ea965d66b592073f6f71ccb0570145ff5f645578465690d61c1c21b`)
- inner `SNEAKERS.EXE` (4,221 bytes; SHA-256 `52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920`)
- the compact reconstructed DAT, crossword, print text, PCX samples, and `RUN.BAT` documented in `webxdc-dos/public/roms/README_SNEAKERS.md`.

The reconstructed program reproduces a small title/password/menu experience for offline DOSBox testing. It is **not the original Universal City Studios executable**, a complete press-kit restore, or a byte-for-byte verified copy of the Archive.org disk. The splash screen and About panel state this distinction before the user boots it.

## Run and test

Open `sneakers-press-kit.xdc` in Delta Chat / ArcaneChat and tap **BOOT THE PRESS KIT**. At the DOS prompt, type `setec astronomy`, press Enter, then use the keyboard to choose a menu option. On touch devices, open js-dos' ☰ sidebar for its on-screen keyboard.

The existing DOSBox smoke test can validate that the reconstructed local bundle reaches its press-kit menu when its system dependencies are available:

```sh
bash tools/smoke_sneakers_dosbox.sh
```

## Rights and preservation note

The film and press-kit materials remain copyrighted by Universal City Studios and other respective rights holders. “Abandonware” does not mean public domain. This Webxdc is an offline preservation/compatibility artifact; it does not assert ownership or provide the original disk image.
