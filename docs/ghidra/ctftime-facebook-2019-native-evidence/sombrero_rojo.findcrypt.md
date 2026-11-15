# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `sombrero_rojo`
- Loader format: `Raw Binary`
- Language: `x86:LE:64:default`
- SHA-256: `5433df31bdc99d8980c5fe11cde9b68516d21e5a95efb85e94205539185026f8`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **3**
- Memory blocks scanned:
  - `ram`: `00000000`–`000c5307` (807688 bytes)

| Address | FindCrypt database label |
|---|---|
| `00096ea0` | `CRYPT_SHA256_K` |
| `00096ea0` | `CRYPT_SHACAL2_K` |
| `00096fb0` | `CRYPT_BLAKE2_IV` |

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.
