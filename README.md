# Sneakers Computer Press Kit — browser preservation player

A small, static player for the [1992 *Sneakers* Computer Press Kit](https://archive.org/details/Sneakers_Film_Promotional_Floppy). It launches the original public ZIP in a DOSBox WebAssembly runtime (js-dos). No game/program files or film artwork are checked into this repository: the player requests the item’s public Internet Archive download at runtime.

## Run locally

```sh
python3 -m http.server 8000
# visit http://localhost:8000
```

Click **Launch original disk**. The original application needs keyboard focus inside the DOS display.

For an offline or CORS-safe copy, download `Sneakers_Promotional_Diskette.zip` from the source item and save it as `public/Sneakers_Promotional_Diskette.zip`. Then change `diskUrl` in `app.js` to that relative path. This keeps the build independent of a third-party host while making the source and provenance explicit.

## Reproducible disk review and graphics GIF

The script below is intentionally a *preservation aid*, rather than a claim that all data files are ordinary images. It:

1. retains the downloaded original under `source/`;
2. records SHA-256 and a filename/format inventory;
3. copies conventional DOS graphics (`PCX`, `BMP`, `GIF`, `PNG`, `JPG`) to `artifacts/graphics/`;
4. converts renderable graphics to PNG and produces `artifacts/sneakers-graphics.gif` when ImageMagick is installed;
5. creates a non-executing static-analysis worksheet for `SNEAKERS.EXE` (hashes and printable strings).

```sh
mkdir -p source
# Download this yourself from the Internet Archive source item:
# source/Sneakers_Promotional_Diskette.zip
python3 tools/extract_assets.py source/Sneakers_Promotional_Diskette.zip
```

Optional dependencies for visual conversion: ImageMagick (`magick`) and a build with PCX support. The script still writes its inventory without them. Output is ignored by Git because it may contain third-party copyrighted promotional graphics.

## webxdc package

Build a shareable `.xdc` container with:

```sh
make webxdc
# dist/sneakers-press-kit.xdc
```

The result is a validated deflated ZIP containing `index.html`, `manifest.toml`, an icon, and the project’s source/documentation. It is intentionally network-safe in webxdc’s isolated viewer: the original third-party disk ZIP and external WASM runtime are **not** bundled. When opened in a webxdc messenger it presents an offline project card rather than attempting an unavailable network fetch. Use the regular browser build to launch the preserved disk, or separately add media you have the right to distribute.

## Screen saver and access controls

The original release is described by the archive as locked via passwords. This project **does not decrypt, crack, defeat, or publish a bypass for passwords, encryption, copy protection, or access restrictions**. The screen saver is preserved by running the original program in the WASM player. Use the program’s own documented menus/credentials, or obtain permission from the rightsholder, to access protected portions.

## EXE triage and the QBasic request

A compiled DOS `MZ` executable is native x86 machine code, not a QBasic source container. There is no reliable automatic conversion from `SNEAKERS.EXE` to QBasic: compilation discards source names, comments, BASIC line layout, and much of the original program structure. A decompiler can produce assembly or imperfect C-like pseudocode, which must then be manually ported for a QBasic-style rewrite.

Once you have a legally obtained local copy of the program, run the included conservative triage pass:

```sh
python3 tools/exe_triage.py artifacts/disk/SNEAKERS.EXE
```

It writes a hash, entropy score, and offsets of likely embedded image/archive signatures. It does **not** execute, decrypt, or automatically carve data. Use the original disk’s separate files first, and use Ghidra’s 16-bit x86 DOS loader for manual disassembly/decompilation.

### HTML5 local inspector

`analyzer.html` is the no-dependency HTML5 counterpart for the first inspection pass. Open it locally, select a local `SNEAKERS.EXE`, and it performs header parsing, SHA-256, entropy, signature scanning, and printable-string extraction entirely in the browser. The selected program is never uploaded or executed. It is included in the `.xdc` package as well.

This is deliberately not presented as a browser conversion of [Ghidra](https://github.com/NationalSecurityAgency/ghidra): Ghidra is a substantial Java desktop application, and full decompilation requires its native analysis infrastructure. The HTML5 inspector supplies a safe, portable triage stage before using Ghidra locally.

## Runtime notes

- Outside webxdc, `js-dos` and its DOSBox runtime are loaded on demand from `v8.js-dos.com`; its runtime includes WebAssembly.
- The player keeps the js-dos control sidebar and configures a large soft keyboard, 4:3 rendering, soft fullscreen, and no automatic mouse capture for mobile use.
- Use js-dos’ keyboard/sidebar icon to show the touch keyboard. The page has both enter and exit fullscreen controls; the exit control uses js-dos’ fullscreen API rather than relying on browser keyboard shortcuts.
- The user-facing application talks only to the public Archive URL, not to localhost.
- If a browser blocks the cross-origin ZIP, use the offline-copy option above.
- The source item’s metadata names `SNEAKERS.EXE` as its startup program.

## Rights and provenance

This is a preservation-oriented launcher, not a redistribution or ownership claim. *Sneakers*, its artwork, and the press-kit contents remain the property of their respective rightsholders. Keep downloaded source media and generated graphics out of version control unless you have appropriate rights.
