# Spycraft: The Great Game demo — static analysis

> Evidence generated without launching the installer, game, or any extracted executable. Ghidra imported candidate binaries for static analysis only.

## Provenance and hash gate

- **Item:** Internet Archive `Spycraft.` / `spycraft.zip`
- **Acquisition:** https://archive.org/download/Spycraft./spycraft.zip
- **Publisher attribution / date:** Activision / 1996
- **Archive size:** 2,410,498 bytes (2.30 MiB)
- **MD5:** `6eb0f915fb10123eb89575ac46132357`
- **SHA-1:** `cd1ab69040bcdce7e4131e62216fd65ac8361b22`
- **SHA-256:** `a195c7ad45e3236503242e95f47234685a5cceb1cba0000fc746fb015d612cfe`
- **Gate:** passed exact expected size, MD5, and SHA-1

The selected corpus is the small publisher-attributed 1996 demo, not a retail-disc image. The workflow stops before extraction if the recorded size, MD5, or SHA-1 differs.

## Archive inventory

The ZIP contains **6 files** totaling **3,425,491 expanded bytes**. Category counts are labels, so a file may appear in more than one category.

| Category | Files |
|---|---:|
| executable-candidate | 2 |
| game-data | 4 |

### Members

| Archive member | Bytes | Signature | Categories |
|---|---:|---|---|
| `ACTRES/LOGO.DIR` | 369,448 | `RIFX/MV93` | game-data |
| `SPYCRAFT/FILEIO.DLL` | 12,832 | `MZ` | executable-candidate |
| `SPYCRAFT/LINGO.INI` | 826 | `INI text` | game-data |
| `SPYCRAFT/SPYCRAFT.DIR` | 2,317,010 | `XFIR/39VM` | game-data |
| `SPYCRAFT/SPYCRAFT.EXE` | 712,817 | `MZ` | executable-candidate |
| `SPYCRAFT/SPYCRAFT.INI` | 12,558 | `INI text` | game-data |

### Executable candidates

Candidates are selected by filename suffix or an `MZ` header. Header parsing below is independent of Ghidra and intentionally conservative.

| Archive member | Bytes | SHA-256 | Header | Architecture / target |
|---|---:|---|---|---|
| `SPYCRAFT/FILEIO.DLL` | 12,832 | `0b2aba6d615d596573bc243b181596355ef0f77df5bb24c0bec3bde97992316b` | NE | Windows |
| `SPYCRAFT/SPYCRAFT.EXE` | 712,817 | `0bc0bd01c6ea453e39918c37f5c8af4b5f136c0ddc6350fd1a16fbf88c51c7d2` | NE | Windows |

## Ghidra results

| Program | Format | Language | Functions | Instructions | Strings | Decompiles |
|---|---|---|---:|---:|---:|---:|
| `FILEIO.DLL` | New Executable (NE) | `x86:LE:16:Protected Mode` | 123 | 3379 | 46 | 48 |
| `SPYCRAFT.EXE` | New Executable (NE) | `x86:LE:16:Protected Mode` | 22 | 709 | 156 | 18 |

### Evidence-based findings

- Both executable candidates are 16-bit Windows New Executable (NE) files: `SPYCRAFT/FILEIO.DLL` and `SPYCRAFT/SPYCRAFT.EXE`.
- The archive carries Director-style resource containers: `ACTRES/LOGO.DIR` (RIFX/MV93), `SPYCRAFT/SPYCRAFT.DIR` (XFIR/39VM).
- Defined resource strings identify the executable as a Macromedia Director-era projector: `Director version 4.0b1` and `Director Player 4.0`.
- Its own initialization strings require Windows 3.1 or later, enhanced/protected mode, and at least 4 MB of free memory; these are period platform requirements, not modern compatibility claims.
- The player resources enumerate Video for Windows (`.avi`) and Windows Sound (`.wav`); the broader string listing also names Director movies, QuickTime, FLI/FLC, bitmap, GIF, TIFF, and other importable media formats.
- `FILEIO.DLL` exposes 21 named FileIO entry points (`_FILEIO_MNEW`, `_FILEIO_MDISPOSE`, `_FILEIO_MWRITECHAR`, `_FILEIO_MWRITESTRING`, `_FILEIO_MREADCHAR`, `_FILEIO_MREADWORD`, …), consistent with the recovered XObject factory/help strings for scripted file access.
- No defined executable string matched CIA, KGB, or Spycraft narrative terms. In this demo, story/interface material is therefore more likely to reside in the Director containers than in the generic player and FileIO executable strings; this is a bounded inference, not a decoded-container result.
- Ghidra recorded 17 warning/error analysis bookmarks. Function and instruction counts are partial loader results for segmented 16-bit NE code, not complete source-level coverage.

### Imported libraries

| Library / namespace | Imported symbols |
|---|---:|
| `KERNEL` | 28 |
| `USER` | 1 |

### Research strings with code references

| Program | Address | Defined string |
|---|---|---|
| `FILEIO.DLL` | `1008:0067` | `File directory full` |
| `FILEIO.DLL` | `1008:0100` | `Directory not found` |
| `FILEIO.DLL` | `1010:0000` | `-- FileIO External Factory. 9feb93 JT` |
| `FILEIO.DLL` | `1010:0026` | `FileIO` |
| `FILEIO.DLL` | `1010:002d` | `ISS    mNew, mode, fileNameOrType  --Creates a new instance of the XObject` |
| `FILEIO.DLL` | `1010:0078` | `X      mDispose                --Disposes of XObject instance.` |
| `FILEIO.DLL` | `1010:0504` | `II     +mSetOverrideDrive, driveLetter --Set override drive letter ('A' - 'Z') to use when loading linked castmembers.  Use 0x00 to clear override.` |
| `SPYCRAFT.EXE` | `1418:0007` | `Director version 4.0b1` |
| `SPYCRAFT.EXE` | `1420:0000` | `Director` |
| `SPYCRAFT.EXE` | `1430:0001` | `Director files (*.dir)` |
| `SPYCRAFT.EXE` | `1430:0018` | `Director Movies (*.dir)` |
| `SPYCRAFT.EXE` | `1430:003c` | `XObject (*.dll)` |
| `SPYCRAFT.EXE` | `1430:0092` | `Director Movie (*.dir)` |
| `SPYCRAFT.EXE` | `1430:00a9` | `Video for Windows (*.avi)` |
| `SPYCRAFT.EXE` | `1430:00c3` | `Quicktime Movie (*.mov)` |
| `SPYCRAFT.EXE` | `1440:0001` | `Windows Sound (*.wav)` |
| `SPYCRAFT.EXE` | `1450:0049` | ` Could not find or open ASIPORT.RSR` |
| `SPYCRAFT.EXE` | `1460:0016` | `Windows version must be 3.1 or higher.` |
| `SPYCRAFT.EXE` | `1460:005e` | `Windows must be in enhanced and protected mode.` |
| `SPYCRAFT.EXE` | `1460:0090` | `Not enough free memory to run Director.` |
| `SPYCRAFT.EXE` | `1460:00b9` | `Problem during initialization. Director cannot be run.` |
| `SPYCRAFT.EXE` | `1468:0001` | `Director Player 4.0` |
| `SPYCRAFT.EXE` | `1468:0015` | `DIRECTOR.HLP` |
| `SPYCRAFT.EXE` | `1478:006c` | `Unable to copy the driver file %s to your Windows directory.\n\nYour disk may be full.` |
| `SPYCRAFT.EXE` | `1478:00c2` | `This program requires at least 4MB free memory to run.` |

## Interpretation limits

- This is a static inventory and reverse-engineering pass, not a playthrough and not a claim about runtime behavior.
- Import names and strings indicate capabilities or terminology available to a binary; they do not prove a code path ran.
- Ghidra's recovered names and decompilation are analytic reconstructions, not original Activision source code.
- A demo may differ materially from the 1996 retail releases and later reissues.
- Selected decompilation, defined-string listings, and Ghidra JSON are committed as derived evidence. Full disassembly remains only in the time-limited workflow artifact; copyrighted input binaries are never committed or uploaded.

## Reproduction

Run the `Spycraft demo / static Ghidra analysis` GitHub Actions workflow. It downloads the exact gated archive and the repository-pinned official Ghidra release, inventories safely extracted members, imports candidate executables one at a time, and uploads only derived reports and logs.
