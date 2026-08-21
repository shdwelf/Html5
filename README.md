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

## Runtime notes

- `js-dos` and its DOSBox runtime are loaded from `v8.js-dos.com`; its runtime includes WebAssembly.
- The user-facing application talks only to the public Archive URL, not to localhost.
- If a browser blocks the cross-origin ZIP, use the offline-copy option above.
- The source item’s metadata names `SNEAKERS.EXE` as its startup program.

## Rights and provenance

This is a preservation-oriented launcher, not a redistribution or ownership claim. *Sneakers*, its artwork, and the press-kit contents remain the property of their respective rightsholders. Keep downloaded source media and generated graphics out of version control unless you have appropriate rights.
