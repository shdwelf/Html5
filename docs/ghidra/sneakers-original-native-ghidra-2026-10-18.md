# Sneakers: native Ghidra + FindCrypt results

Static analysis only. None of the input executables were launched or emulated by this workflow.

## Reproducible toolchain

- Ghidra: `Ghidra 12.1.4 (20260921), SHA-256 ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`
- Eclipse Temurin/OpenJDK runtime: `openjdk version "21.0.12.1" 2026-08-18 LTS`
- FindCrypt database: `TorgoTorgo/ghidra-findcrypt database commit 5c2fd5bb50d13a4092da136dc7004becd8129c7b; 126 signatures; database SHA-256 ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897`
- The official Ghidra archive and FindCrypt database were SHA-256 checked before analysis.
- The database-driven scan passed a positive control: its AES encryption S-box matched `CRYPT_AES_Encryption_SBox`.
- This run uses the pinned FindCrypt signature database through Ghidra's `Memory.findBytes` API; it does not claim that the separately compiled FindCrypt extension loaded.

## MZ loader analyses

| Input / provenance | SHA-256 | Ghidra format | Language | Image base | Memory blocks / bytes | Functions | Instructions | Defined strings | Decompilations completed |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| `SNEAKERS.EXE` — original promotional program | `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961` | `Old-style DOS Executable (MZ)` | `x86:LE:16:Real Mode` | `0000:0000` | 7 / 124077 B | 600 | 40570 | 239 | 48/48 |

### Address-order disassembly excerpt — `SNEAKERS.EXE`

These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:

```asm
1000:0000          0000                           ADD byte ptr [BX + SI],AL
1000:0002          0000                           ADD byte ptr [BX + SI],AL
1000:0004          0000                           ADD byte ptr [BX + SI],AL
1000:0006          0000                           ADD byte ptr [BX + SI],AL
1000:0008          0000                           ADD byte ptr [BX + SI],AL
1000:000a          0000                           ADD byte ptr [BX + SI],AL
1000:000c          0000                           ADD byte ptr [BX + SI],AL
1000:000e          0000                           ADD byte ptr [BX + SI],AL
1000:0010          8e26a02d                       MOV FS,word ptr [0x2da0]
1000:0014          55                             PUSH BP
1000:0015          8bec                           MOV BP,SP
1000:0017          57                             PUSH DI
1000:0018          56                             PUSH SI
1000:0019          53                             PUSH BX
1000:001a          33ff                           XOR DI,DI
1000:001c          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:001f          0bc0                           OR AX,AX
1000:0021          7d12                           JGE 0x1000:0035
```

Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `SNEAKERS.EXE`.

| `SNEAK.EXE` — original LHA SFX companion | `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb` | `Old-style DOS Executable (MZ)` | `x86:LE:16:Real Mode` | `0000:0000` | 3 / 67172 B | 21 | 605 | 7 | 21/21 |

### Address-order disassembly excerpt — `SNEAK.EXE`

These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:

```asm
1000:0000          eb79                           JMP 0x1000:007b
1000:007b          fc                             CLD
1000:007c          bc0001                         MOV SP,0x100
1000:007f          8cc8                           MOV AX,CS
1000:0081          058800                         ADD AX,0x88
1000:0084          8ec0                           MOV AX,ES
1000:0086          eb01                           JMP 0x1000:0089
1000:0089          bb0401                         MOV BX,0x104
1000:008c          e85b02                         CALL 0x1000:02ea
1000:008f          06                             PUSH ES
1000:0090          1f                             POP DS
1000:0091          b430                           MOV AH,0x30
1000:0093          cd21                           INT 0x21
1000:0095          8bd8                           MOV BX,AX
1000:0097          1e                             PUSH DS
1000:0098          3c03                           CMP AL,0x3
1000:009a          721c                           JC 0x1000:00b8
1000:009c          368e062c00                     MOV ES,word ptr SS:[0x2c]
```

Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `SNEAK.EXE`.

| `RECONSTRUCTED_SNEAKERS.EXE` — repository reconstruction (comparison only) | `52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920` | `Old-style DOS Executable (MZ)` | `x86:LE:16:Real Mode` | `0000:0000` | 2 / 4221 B | 1 | 1837 | 0 | 1/1 |

### Address-order disassembly excerpt — `RECONSTRUCTED_SNEAKERS.EXE`

These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:

```asm
1000:00f4          8a04                           MOV AL,byte ptr [SI]
1000:00f6          3c24                           CMP AL,0x24
1000:00f8          742b                           JZ 0x1000:0125
1000:00fa          3c41                           CMP AL,0x41
1000:00fc          7224                           JC 0x1000:0122
1000:00fe          3c5a                           CMP AL,0x5a
1000:0100          7614                           JBE 0x1000:0116
1000:0102          3c61                           CMP AL,0x61
1000:0104          721c                           JC 0x1000:0122
1000:0106          3c7a                           CMP AL,0x7a
1000:0108          7718                           JA 0x1000:0122
1000:010a          3c6d                           CMP AL,0x6d
1000:010c          7604                           JBE 0x1000:0112
1000:010e          2c0d                           SUB AL,0xd
1000:0110          eb0e                           JMP 0x1000:0120
1000:0112          040d                           ADD AL,0xd
1000:0114          eb0a                           JMP 0x1000:0120
1000:0116          3c4d                           CMP AL,0x4d
```

Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `RECONSTRUCTED_SNEAKERS.EXE`.


## Native FindCrypt results

The pinned TorgoTorgo FindCrypt database was scanned inside native Ghidra with `Memory.findBytes` against each complete file imported through `BinaryLoader` at base address zero. This pass covers the MZ header and any file overlay, not just the DOS-loaded image. It uses the extension's signature data, but is a Ghidra script rather than the compiled GUI/auto-analysis extension. The separate MZ-loader analyses above are the source for code disassembly and decompilation.

### `SNEAKERS.EXE` — original promotional program

# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `SNEAKERS.EXE`
- Loader format: `Raw Binary`
- Language: `x86:LE:32:default`
- SHA-256: `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **0**
- Memory blocks scanned:
  - `ram`: `00000000`–`0021dc6c` (2219117 bytes)

No FindCrypt database signatures matched the loaded bytes.

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.

### `SNEAK.EXE` — original LHA SFX companion

# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `SNEAK.EXE`
- Loader format: `Raw Binary`
- Language: `x86:LE:32:default`
- SHA-256: `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **0**
- Memory blocks scanned:
  - `ram`: `00000000`–`001065c6` (1074631 bytes)

No FindCrypt database signatures matched the loaded bytes.

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.

### `RECONSTRUCTED_SNEAKERS.EXE` — repository reconstruction (comparison only)

# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `RECONSTRUCTED_SNEAKERS.EXE`
- Loader format: `Raw Binary`
- Language: `x86:LE:32:default`
- SHA-256: `52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **0**
- Memory blocks scanned:
  - `ram`: `00000000`–`0000107c` (4221 bytes)

No FindCrypt database signatures matched the loaded bytes.

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.

## Interpretation limits

A FindCrypt zero-hit result means only that this pinned database's signatures did not match the bytes scanned. It does not rule out custom/table-free cryptography, XOR/add/sub transforms, compressed or encoded resources, or algorithms with different constants. A hit would still require disassembly and cross-reference review before attributing an algorithm to the program.

The reconstruction comparator is included only to keep its previous puzzle/cipher claims distinct from the original promotional binaries. Do not transfer reconstruction behavior to either original EXE.
