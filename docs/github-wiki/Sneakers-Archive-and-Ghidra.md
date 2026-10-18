# Sneakers: original archive, static analysis, and DOSBox input

## Provenance: original ZIP versus reconstruction

The [original promotional ZIP](https://archive.org/details/Sneakers_Film_Promotional_Floppy) was supplied via Google Drive and verified against the Archive.org metadata hashes. Its byte size is **2,066,643**; MD5 `7ee0f238f94fbbe06649d719d92fc769`, SHA-1 `a94c7ef89f60c37f488d6163f5f8d7bc05b9cd31`, SHA-256 `b6e3d2a99de90b6de401a5d8d0023299c632e65ca98246bbe5d4842336f01eef`.

The ZIP contains these two entries—not a floppy image:

| Entry | Size | SHA-256 | Notes |
|---|---:|---|---|
| `SNEAKERS.EXE` | 2,219,117 B | `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961` | Original DOS MZ program, directly launched by the exact-source Webxdc. |
| `SNEAK.EXE` | 1,074,631 B | `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb` | LHA SFX 2.12S companion; its embedded LHA member is named `SNEAKERS.EXE`. LHA compression is not encryption. |

The separate Archive.org file `sneakers.img` is **not** a member of this ZIP. The exact-source deliverable [`sneakers-press-kit-exact.xdc`](https://github.com/shdwelf/Html5/blob/main/sneakers-press-kit-exact.xdc) keeps the raw ZIP unchanged at `original/Sneakers_Promotional_Diskette.zip`; its runnable js-dos bundle's two executable members are compared byte-for-byte with the ZIP entries. This is distinct from [`sneakers-press-kit.xdc`](https://github.com/shdwelf/Html5/blob/main/sneakers-press-kit.xdc), the earlier 4,221-byte repository reconstruction.

## What the Ghidra work did—and did not—find

The initial local triage used the repository's Ghidra decompiler compiled to WebAssembly via [`tools/decompile_mz.mjs`](https://github.com/shdwelf/Html5/blob/main/tools/decompile_mz.mjs), with `x86:LE:16:Real Mode`. Native Ghidra `analyzeHeadless` and a JDK are not installed in this sandbox, so that first result is **not** an official headless-Ghidra export. The executable was not run during static analysis.

This branch adds [`arena-sneakers-ghidra.yml`](https://github.com/shdwelf/Html5/blob/main/.github/workflows/arena-sneakers-ghidra.yml), which uses Eclipse Temurin/OpenJDK 21 and verifies the official Ghidra 12.1.4 archive hash. It pins TorgoTorgo's FindCrypt signature database at commit `5c2fd5bb50d13a4092da136dc7004becd8129c7b` and verifies its SHA-256. The initial build of the GPL-3.0 extension failed before analysis; the passing workflow instead applies its pinned 126-signature database through Ghidra's `Memory.findBytes` API and checks the scan against a synthetic AES S-box positive control. This is a database-driven Ghidra script, **not a claim that the FindCrypt GUI/auto-analysis extension loaded**. The native run [39160712053](https://github.com/shdwelf/Html5/actions/runs/39160712053) passed; its compact report and per-program evidence are checked in at [`docs/ghidra/sneakers-original-native-ghidra-2026-10-18.md`](https://github.com/shdwelf/Html5/blob/main/docs/ghidra/sneakers-original-native-ghidra-2026-10-18.md) and [`docs/ghidra/sneakers-original-native-evidence/`](https://github.com/shdwelf/Html5/tree/main/docs/ghidra/sneakers-original-native-evidence).

Native Ghidra 12.1.4 imported the originals with its 16-bit real-mode MZ loader. For `SNEAKERS.EXE`, the DOS header's `CS:IP 0000:02D8` maps to Ghidra entry `1000:02d8`; the file has a 4,608-byte header, 117,389 on-disk image bytes, and a 2,097,120-byte overlay. The Ghidra memory map also includes 2,080 bytes of uninitialized data (BSS), for 124,077 mapped bytes total. Ghidra identified 600 functions and 40,570 instructions; the bounded report decompiled 48 selected functions, including the entry function. The entry listing begins with segment/stack setup and an ES-relative memory-limit check, consistent with startup/memory management rather than a cryptographic transform.

`SNEAK.EXE` is a much smaller MZ stub followed by a large overlay: its declared MZ area is 1,636 bytes (32-byte header plus 1,604-byte image), with 1,072,995 bytes after that; Ghidra additionally maps 65,536 bytes of uninitialized memory. Its canonical Ghidra entry is `1000:0000`, the real-mode alias of the header-relative `CS:IP FFF0:0100`. Its first instructions jump to the stub body, set up registers, query the DOS version with `INT 21h/AH=30h`, and check for DOS 3 or later. The native pass identified 21 functions and decompiled all 21. These findings are consistent with an LHA self-extracting companion; compression is not encryption.

The pinned FindCrypt database scan matched **zero** signatures in either complete original file (and zero in the reconstruction comparator). The raw `BinaryLoader` passes cover all 2,219,117 bytes of `SNEAKERS.EXE` and 1,074,631 bytes of `SNEAK.EXE`, including their overlays. The AES positive control passed. A zero-hit result only says those 126 known signatures were absent; it does not rule out custom or table-free transformations. The exact entry-point assembly excerpts, counts, toolchain hashes, and raw-scan outputs are in the native report above.

The initial Ghidra-WASM triage below remains a separate, preliminary analysis. Its observations around memory management, PSP handling, and the routine at `0x1043A` should be treated as hypotheses until each routine is independently cross-referenced in the native project. The original executable's strings identify the **GRASP** graphics/animation runtime, version 4.00d (July 27, 1992), with resources such as `doss.txt`, `sneaklog.clp`, and `dossback.pic`; input-related strings include `ifmouseget`, `fakemouse`, `mousedriver`, `waitkey`, “Microsoft-Compatible Mouse Driver Found.”, and “Press Any Key to Continue.” These string findings support adding emulated pointer and soft-keyboard input, but do not prove a particular boot screen or full runtime success.

## Encryption findings and correction to earlier notes

The old ciphers often associated with “Sneakers”—XOR `0x5A`, ROT13, Caesar `+7`, the `setec astronomy` gate, and the Scrabble/password logic—describe the **small repository-built reconstruction**, not the original 2.2 MB Archive.org executable. Those results were previously conflated with the original and have now been marked as reconstruction-only in the reverse-engineering notes.

The repository's `scripts/crypto-find.py` known-constant scan found **zero standard crypto/hash signature hits** in the original `SNEAKERS.EXE` and `SNEAK.EXE`. A bounded ASCII and single-byte-XOR search for selected `SETEC`/password-related strings also found no matches. This is not proof that the original has no custom or resource-specific transform: the scanner does not detect arbitrary XOR loops, custom ciphers, or all compression formats. The LHA signature in `SNEAK.EXE` establishes a compression wrapper, not cryptographic protection.

- [Ghidra-WASM triage report](https://github.com/shdwelf/Html5/blob/main/docs/sneakers-original-ghidra-wasm-2026-10-18.md)
- [Original executable crypto-constant scan](https://github.com/shdwelf/Html5/blob/main/docs/ghidra/sneakers-original-crypto-scan-2026-10-18.md)
- [Earlier reverse-engineering note, corrected at its top and §19](https://github.com/shdwelf/Html5/blob/main/webxdc-dos/public/roms/README_SNEAKERS.md)

## DOSBox + Xvfb research

GitHub code search turned up several useful headless DOS patterns:

1. This repository has [`arena-sneakers-smoke.yml`](https://github.com/shdwelf/Html5/blob/main/.github/workflows/arena-sneakers-smoke.yml) and [`tools/smoke_sneakers_dosbox.sh`](https://github.com/shdwelf/Html5/blob/main/tools/smoke_sneakers_dosbox.sh). They install DOSBox, Xvfb, xdotool, ImageMagick, unzip, and Tesseract; the reconstructed-bundle script starts `Xvfb :99`, focuses the DOSBox window, sends keyboard input, captures the window, and checks OCR. This branch also adds [`tools/smoke_sneakers_original_dosbox.sh`](https://github.com/shdwelf/Html5/blob/main/tools/smoke_sneakers_original_dosbox.sh): it verifies the original ZIP/member hashes, launches the original `SNEAKERS.EXE`, sends Space through XTest, and captures startup/after-key screens. CI run [39159330499](https://github.com/shdwelf/Html5/actions/runs/39159330499) passed for both the reconstruction and original executable and uploaded screenshots/logs. The sandbox could not download the artifact from GitHub's storage host, so the images have not been visually reviewed and no particular in-app screen is claimed.
2. [`wicanr2/kinginformation-dq3-re` DOSBox validation notes](https://github.com/wicanr2/kinginformation-dq3-re/blob/3fefa4efe70575321cb22c710e386d629998a6b4/docs/14-dosbox-validation.md) document an Ubuntu container with DOSBox + Xvfb + xdotool + ImageMagick, a `svga_s3`/`output=surface` config, and bounded waits. This is a close technical pattern for a reproducible original-binary screenshot run.
3. [`RealDeuce/OpenDoors` `tools/unit-xvfb`](https://github.com/RealDeuce/OpenDoors/blob/a02e7e6619c6a575c9957d96a7e2d55f7cb1d2a1/tools/unit-xvfb) is a generic wrapper that waits for Xvfb readiness with `xdpyinfo` before dispatching tests; it is not specifically a DOSBox launcher.
4. [`wicanr2/fd2_re` DOSBox screenshot helper](https://github.com/wicanr2/fd2_re/blob/2d6f62c8272c9a0018cf7f0e59b48b03fa8c9f14/tools/docker/fd2-dosbox-screenshot.sh) uses a bounded Xvfb readiness check and scripted key/screenshot timelines; its notes explicitly distinguish diagnostic DOSBox captures from its primary oracle.

A direct `xvfb-run dosbox` code search did not surface a more useful pattern than starting Xvfb explicitly. The Sneakers workflow adds a separate original-binary job beside the existing reconstruction test. The DOSBox/Xvfb job passed and produced screenshots/logs, but those remain diagnostic evidence until visually inspected; the sandbox's network policy blocked the artifact download.

## Open research

- Extend the native Ghidra review from the entry-point excerpts to the program's resource-handling routines and GRASP data; the current zero-signature result does not rule out custom packing or transforms. Do not infer a cipher merely from the film's Scrabble puzzle.
- Review the original DOSBox/Xvfb screenshots, OCR, and logs in smoke run 39159330499. The sandbox could not retrieve the artifact; a passing automation check is not by itself proof of a particular screen, every mouse path, or every VGA mode.
- Confirm whether the original SFX's embedded LHA payload is byte-identical to the directly supplied `SNEAKERS.EXE`.
