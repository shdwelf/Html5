# Sneakers Press Kit · original ZIP (byte-verified) · Webxdc

A second, separate Webxdc for the original promotional ZIP supplied from Google Drive. It preserves that ZIP byte-for-byte and boots the original `SNEAKERS.EXE` in js-dos/DOSBox WASM. It does **not** replace or modify `sneakers-press-kit.xdc`, which remains the earlier repository-built reconstruction.

## Verified source and package contents

Source file: `source/Sneakers_Promotional_Diskette.zip`, the user-provided copy of the [Internet Archive promotional floppy item](https://archive.org/details/Sneakers_Film_Promotional_Floppy).

| Item | Size | SHA-256 |
|---|---:|---|
| Original ZIP | 2,066,643 bytes | `b6e3d2a99de90b6de401a5d8d0023299c632e65ca98246bbe5d4842336f01eef` |
| `SNEAKERS.EXE` | 2,219,117 bytes | `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961` |
| `SNEAK.EXE` | 1,074,631 bytes | `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb` |

The ZIP's MD5 (`7ee0f238f94fbbe06649d719d92fc769`) and SHA-1 (`a94c7ef89f60c37f488d6163f5f8d7bc05b9cd31`) match the Archive.org metadata recorded in `webxdc-dos/public/roms/README_SNEAKERS.md`. Its two entries are `SNEAKERS.EXE` and `SNEAK.EXE`—not a floppy image. `SNEAK.EXE` is an LHA SFX companion whose embedded member is named `SNEAKERS.EXE`; this app launches the directly supplied `SNEAKERS.EXE` and keeps both original executables.

The generated XDC contains the source archive at `original/Sneakers_Promotional_Diskette.zip` with identical bytes. The `SNEAKERS.EXE` and `SNEAK.EXE` files inside `roms/SNEAKERS.jsdos` are each checked against the corresponding member of that original ZIP. The DOSBox config, player UI, and emulator runtime are added packaging—not edits to either original executable. The separate Archive.org `sneakers.img` item is not part of this ZIP and is not claimed to be included.

## Build

From the repository root:

```sh
make webxdc-exact
# or
npm run build:sneakers-press-kit-exact
# or
node scripts/build-sneakers-press-kit-exact-xdc.mjs
```

The deterministic output is `sneakers-press-kit-exact.xdc`. Check that the checked-in app staging files and XDC match the builder without rewriting them:

```sh
node scripts/build-sneakers-press-kit-exact-xdc.mjs --check
```

A local preview is available with:

```sh
python3 webxdc-sneakers-exact/serve-preview.py
```

## Keyboard, mouse, and touch

The player uses the same js-dos v8 options API and canvas-focus behavior as `webxdc-headline-harry/app/index.html`: the DOS canvas is made focusable and is focused after boot, when DOS is ready, and on pointer-down. Mouse capture is left off so clicks and touch pointer input are not trapped by pointer lock.

js-dos's ☰ sidebar exposes its on-screen keyboard; this package supplies a touch-friendly layout with letters, digits, Enter, Escape, Backspace, arrows, Tab, and Space. Touch taps/drags over the emulated display are sent to DOSBox as mouse input. A physical keyboard or mouse is not required. If the original program pauses for a key, open the sidebar keyboard and press one there.

The player and game are fully local after installation: the XDC includes js-dos 8.4.1 and the original game files; no remote game fetch, CDN, or cloud save is used.

## Tests and limits

Run the focused package tests with:

```sh
node --test tests/sneakers-press-kit-exact.test.mjs tests/sneakers-press-kit.test.mjs
```

The tests verify the original archive's MD5/SHA-1/SHA-256, ZIP integrity, exact archive embedding, executable hashes and byte-for-byte member equality, bundle/config launch path, input/focus setup, and deterministic XDC contents. The sandbox did not have DOSBox or a browser executable available for a live DOS runtime smoke test, so the original program's in-emulator startup has not been independently observed here. The GitHub Actions `arena-sneakers-smoke` workflow now also runs the original executable under DOSBox + Xvfb, sends a key through XTest, and uploads startup/after-key screenshots, OCR, and logs. Treat that as diagnostic evidence; the screenshot must be reviewed before claiming a particular menu or mouse path works.

## Provenance distinction and rights

- `sneakers-press-kit-exact.xdc`: original ZIP preserved byte-for-byte; original program executable launched.
- `sneakers-press-kit.xdc`: earlier compact repository-built reconstruction, unchanged and not byte-identical to the Archive.org files.

The materials remain copyrighted by Universal City Studios and other respective rights holders. “Abandonware” does not mean public domain. This package records the supplied archive's provenance and hashes; it does not grant redistribution rights.
