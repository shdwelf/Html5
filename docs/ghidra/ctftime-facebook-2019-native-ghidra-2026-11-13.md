# FBCTF 2019: native Ghidra/FindCrypt metadata (CI-generated)

This report is the **static** output of a hash-gated GitHub Actions job, not an execution of either challenge. It is not a record of which team solved a task. Native Ghidra 12.1.4 imported `netscream.bin` as Executable and Linking Format (ELF) / `x86:LE:64:default` and disassembled 680 instructions across 114 functions. For both signature scans the complete original files were separately imported as raw bytes at base 0. The full disassembly and decompilation are retained as CI artifacts for review, **not** committed as text here.

| Public organizer sample | SHA-256 (bytes verified before import) | Native Ghidra loader | Pinned FindCrypt signature occurrences |
|---|---|---|---:|
| `crypto/netscream/dist/bin` (9,688 bytes) | `0a3b86e635d220fda3381432e67a139a2efa6cf587cc97e20e28caf08a714b89` | ELF x86-64 disassembly; raw full-file scan | 0 |
| `reversing/SOMBRERO_ROJO/dist/sombrero_rojo` (807,688 bytes) | `5433df31bdc99d8980c5fe11cde9b68516d21e5a95efb85e94205539185026f8` | **raw BinaryLoader only**, base 0; no auto-analysis (ELF header deliberately misleading) | 3 |

FindCrypt database: [TorgoTorgo/ghidra-findcrypt at `5c2fd5bb50d13a4092da136dc7004becd8129c7b`](https://github.com/TorgoTorgo/ghidra-findcrypt/tree/5c2fd5bb50d13a4092da136dc7004becd8129c7b), 126 records, database SHA-256 `ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897`. The native **AES S-box positive control matched**; it is a synthetic signature file, not part of either challenge. The Ghidra ELF symbol table contains, among other imports, `AES_ige_encrypt`, `AES_set_encrypt_key`, `BN_mask_bits`, `EC_GROUP_new_by_curve_name`; symbols alone do not prove which call site uses them.

Raw-loader SOMBRERO offsets (base 0 equals original **file offsets**):

| Offset | FindCrypt label | Interpretation after source review |
|---|---|---|
| `0x96ea0` | `SHA256_K` **and** `SHACAL2_K` | Same 256 bytes; the organizer source contains SHA-256 round constants, not evidence for SHACAL-2. |
| `0x96fb0` | `BLAKE2_IV` | Same 32-byte constants as SHA-256's initial state; organizer `sha256.c` uses SHA-256, not evidence for BLAKE2. |

**Boundaries:** This job uses Ghidra's `Memory.findBytes` with the verified FindCrypt signature database, **not** an installed FindCrypt plug-in's labeling pass. The independent `scripts/crypto-find.py` is a different heuristic and is not the source of this report. Zero matches in `netscream.bin` do **not** rule out cryptography: its AES and elliptic-curve implementations reside in the dynamically linked OpenSSL library, not the 9,688-byte file. SOMBRERO was not auto-disassembled here; a normalized-header copy must be separately hash-pinned and reviewed before calling it an ELF analysis. Do not run either challenge; SOMBRERO's source describes dropping and executing an embedded payload.

Origin, recipe vectors, contradictions in the organizer README, and 18-event scope: [`ctftime-facebook-2019-software-crypto-2026-11-13.md`](../ctftime-facebook-2019-software-crypto-2026-11-13.md). CI workflow: [`.github/workflows/arena-ctftime-ghidra.yml`](../../.github/workflows/arena-ctftime-ghidra.yml).
