# Sneakers original executables · crypto-constant scan · 2026-10-18

This is a **repository heuristic**, not a native Ghidra `FindCrypt` report. It runs `scripts/crypto-find.py`, which searches for known byte tables and constants associated with AES, MD5, SHA, DES-like tables, Blowfish, RC5/6, TEA, CRC-32, and Base64 alphabets. A hit needs disassembly review; zero hits do not rule out custom or constant-free obfuscation.

## Inputs and results

| File | Bytes | SHA-256 | Known-constant hits |
|---|---:|---|---:|
| Original `SNEAKERS.EXE` from the supplied promotional ZIP | 2,219,117 | `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961` | 0 |
| Original `SNEAK.EXE` LHA SFX companion | 1,074,631 | `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb` | 0 |
| Repository reconstruction `SNEAKERS.EXE` | 4,221 | `52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920` | 0 |

The original ZIP SHA-256 is `b6e3d2a99de90b6de401a5d8d0023299c632e65ca98246bbe5d4842336f01eef`; its MD5 and SHA-1 match the Archive.org metadata. The two ZIP members are the original executables named above.

## Interpretation

- No scanned standard-cipher/hash constants were found in either original executable.
- A separate ASCII-string search found no literal `SETEC`, `ASTRONOMY`, `password`, `cipher`, `encrypt`, or `decrypt` strings in the original `SNEAKERS.EXE`. A bounded single-byte-XOR search for `SETEC ASTRONOMY`, `setec astronomy`, `password`, `encrypted`, and `cryptography` also had no hits.
- `SNEAK.EXE` is identified by its own strings as **LHA's SFX 2.12S** and contains an LHA member called `SNEAKERS.EXE`. That is archive compression, not evidence of cryptographic encryption.
- The previous repository note's `XOR 0x5A`, ROT13, Caesar +7, and `setec astronomy` gate describe the **4,221-byte repository reconstruction**, not the 2,219,117-byte original executable. The reconstruction itself also has zero signatures in this constant scan because these simple transforms are not represented by the standard tables/constants this script searches for.

**Limit:** no standard signature or literal is not proof that the original contains no custom transformation. The report does not decrypt GRASP assets, identify every data transform, or substitute for a full Ghidra control-flow review.

## Reproduce

```sh
tmp=$(mktemp -d)
unzip -p webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip SNEAKERS.EXE > "$tmp/SNEAKERS.EXE"
unzip -p webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip SNEAK.EXE > "$tmp/SNEAK.EXE"
python3 scripts/crypto-find.py "$tmp/SNEAKERS.EXE" "$tmp/SNEAK.EXE"
```
