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
| game-data | 2 |
| other | 2 |

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

### Imported libraries

| Library / namespace | Imported symbols |
|---|---:|
| `KERNEL` | 28 |
| `USER` | 1 |

### Research strings with code references

| Program | Address | Defined string |
|---|---|---|
| `SPYCRAFT.EXE` | `1430:00a9` | `Video for Windows (*.avi)` |
| `SPYCRAFT.EXE` | `1440:0001` | `Windows Sound (*.wav)` |

## Interpretation limits

- This is a static inventory and reverse-engineering pass, not a playthrough and not a claim about runtime behavior.
- Import names and strings indicate capabilities or terminology available to a binary; they do not prove a code path ran.
- Ghidra's recovered names and decompilation are analytic reconstructions, not original Activision source code.
- A demo may differ materially from the 1996 retail releases and later reissues.
- Full per-program disassembly, selected decompilation, defined-string listings, and Ghidra JSON are retained as workflow artifacts rather than committed copyrighted binaries.

## Reproduction

Run the `Spycraft demo / static Ghidra analysis` GitHub Actions workflow. It downloads the exact gated archive and the repository-pinned official Ghidra release, inventories safely extracted members, imports candidate executables one at a time, and uploads only derived reports and logs.
