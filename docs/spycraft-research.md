# *Spycraft: The Great Game* — research and reproducible static analysis

## Why this title belongs in the study

Activision released *Spycraft: The Great Game* in 1996 as a multimedia espionage adventure. The publisher's current [Steam listing](https://store.steampowered.com/app/569220/Spycraft_The_Great_Game/) describes a 29 February 1996 release, full-motion video, CIA stock footage, and participation by former CIA Director William Colby and former KGB Major General Oleg Kalugin. Those claims describe the game's production and presentation; they do not make the game an official history or training product.

The game is useful here as a period artifact: it shows how mid-1990s interactive media translated intelligence institutions, image analysis, cryptography, surveillance, and geopolitical narrative into interfaces and puzzles. Interpretation must keep the fictional game, its expert participation, and documented intelligence history in separate evidentiary categories.

## Selected analysis corpus

The reproducible workflow analyzes the small publisher-attributed demo rather than an unverified retail image:

| Field | Value |
|---|---|
| Internet Archive item | [`Spycraft.`](https://archive.org/details/Spycraft.) |
| Title | *Spycraft: The Great Game Demo* |
| Creator / publisher attribution | Activision |
| Publication date | 1996 |
| Original member | `spycraft.zip` |
| Size | `2,410,498` bytes |
| MD5 | `6eb0f915fb10123eb89575ac46132357` |
| SHA-1 | `cd1ab69040bcdce7e4131e62216fd65ac8361b22` |

The exact values above come from the item's [metadata API](https://archive.org/metadata/Spycraft.). The workflow recomputes size, MD5, SHA-1, and SHA-256 after download and **stops before extraction** if the recorded size, MD5, or SHA-1 differs. Retail-disc preservation listings are not used when the published demo is sufficient for format and engine research.

## Static-only Ghidra method

The workflow at `.github/workflows/spycraft-ghidra.yml`:

1. Downloads `spycraft.zip` from the selected Internet Archive item with bounded retries.
2. Enforces the exact provenance gate before reading any archive member.
3. Uses `tools/spycraft/inventory.py` to reject absolute paths, traversal, case-colliding members, links, excessive file counts, and excessive expansion.
4. Computes MD5, SHA-1, and SHA-256 for every safely extracted member; identifies executable candidates by suffix/header; and parses conservative MZ/NE/PE header facts without loading them.
5. Downloads the official Ghidra 12.1.4 release, verifies repository-pinned SHA-256 `ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`, and runs it with Temurin 21.
6. Imports each candidate into a separate disposable headless project. `SpycraftReport.java` records format, architecture/language, memory map and entropy, entry points, imports, strings, references, functions, static disassembly, and selected decompilation.
7. Deletes the Ghidra projects and the downloaded/extracted copyrighted inputs. Only logs and derived evidence are uploaded or committed.

No installer, game executable, DLL, script, or media member is launched. Import names, strings, and decompiler output are evidence about a binary's structure and available code—not proof of runtime behavior.

## Outputs

After a successful run, the workflow writes:

- `docs/spycraft-ghidra-analysis.md` — readable provenance, inventory, and findings.
- `docs/spycraft-ghidra-evidence/inventory.json` — archive-member paths, sizes, categories, formats, and hashes.
- `docs/spycraft-ghidra-evidence/analysis.json` — aggregate machine-readable Ghidra results.
- `docs/spycraft-ghidra-evidence/reports/` — per-program JSON, defined strings, and selected decompilation. Full disassembly stays in the time-limited Actions artifact rather than the repository.

Copyrighted demo inputs are intentionally absent from Git and from the uploaded artifact.

## First reproducible run

The first successful workflow run analyzed archive SHA-256 `a195c7ad45e3236503242e95f47234685a5cceb1cba0000fc746fb015d612cfe`. Its six members are two Director containers (`ACTRES/LOGO.DIR` and `SPYCRAFT/SPYCRAFT.DIR`), two INI files, `SPYCRAFT/FILEIO.DLL`, and `SPYCRAFT/SPYCRAFT.EXE`.

Both executable candidates are 16-bit Windows New Executable (NE) files. Ghidra 12.1.4 identified them as `x86:LE:16:Protected Mode`. Defined executable strings identify a Director 4.0-era player, enumerate period multimedia formats including Director movies, Video for Windows, QuickTime, FLI/FLC, WAV, bitmap, GIF, and TIFF, and state Windows 3.1/enhanced-mode/386/4 MB initialization requirements. The companion FileIO module exposes named read, write, seek, status, filename, delete, and override-drive entry points matching its recovered XObject factory/help text.

No defined executable string in this corpus matched CIA, KGB, or Spycraft narrative terms. The bounded interpretation is that most game-specific story, interface, and Lingo material resides in the Director containers rather than in the generic player/FileIO executables. Those containers were inventoried and hash-preserved but not decoded by this Ghidra pass. Ghidra also recorded segmented-code analysis errors, so recovered function/instruction totals are partial loader results rather than complete source-level coverage. See [`spycraft-ghidra-analysis.md`](./spycraft-ghidra-analysis.md) for exact hashes, counts, caveats, and generated evidence paths.

## Research limits

- A demo can differ materially from the 1996 DOS, Windows, Classic Mac, retail CD-ROM, and later packaged releases.
- The game's narrative and simulated tools are not evidence of real CIA methods.
- Former officials' participation and stock footage do not imply institutional endorsement.
- Ghidra generates analytic reconstructions; its function names, types, control flow, and C-like output are not Activision source code.
- This project documents provenance and static findings so another researcher can reproduce or challenge the interpretation without redistributing the game.
