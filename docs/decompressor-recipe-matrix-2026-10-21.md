# Decompressor recipe matrix — 21 Oct 2026

*Stream S1 (T1.2: “search github for ace rar arj uue zip 7z iso img … pkware*
*universal decompressor ghirdra for recipes”). Sources surveyed in*
[`backlog-execution-round-1-2026-10-21.md`](backlog-execution-round-1-2026-10-21.md);
*this is the recipe view. Constraints: F2 (no ungarbling of the FNA102B name*
*database), F4 (password research stays at recipe level).*

Identification → open-source decoder → Ghidra/CyberChef hook, per format. Magic
checks come first everywhere; the repo’s two live samples anchor the LHA and ARJ rows
(`SNEAKERS.EXE` is *LHA SFX 2.12S*, method `-lh5-` at file offset `0x666`; `KGK.ARJ`
is ARJ revision 4, method 1, GARBLED — see `research/kgk-arj-listing-extract.txt`).

| Format | Identify | Open-source decoder | Recipe notes |
| --- | --- | --- | --- |
| **LHA/LZH** (`-lh0-`…`-lh7-`, LArc, PMarc) | header level-0/1/2 + method id in bytes 2–7 (`-lh5-`…) | [fragglet/lhasa](https://github.com/fragglet/lhasa) (ISC; per-method decoders, incl. `lh7_decoder.c` as a worked LZH ring-buffer example) · [jca02266/lha](https://github.com/jca02266/lha) | lhasa decompresses only. SFX variants hide the LHA stream after an MZ stub — scan for `-lh[0-9]-` to find entry (the dump’s regex hit is exactly this). |
| **ARJ** (rev 1–4, GARBLED flag `0x11`) | `0x60 0xEA` main header | [mkrueger/unarj-rs](https://github.com/mkrueger/unarj-rs) · `unarj` 2.65 · open `arj` 3.10.22 · in-repo `tools/arjwalk.py` (structure walk) | Garble = author password transform; F2/F4 apply. `arjwalk.py` already enumerates members + header CRCs (the KGK.ARJ inspection used it). |
| **ACE** | `**ACE**` magic | [wdlkmpx/unace1](https://github.com/topics/decompressor) (unace) · PeaZip addon | Proprietary format, patent-era; decoder-only. |
| **RAR** (1.5–5) | `Rar!\x1A\x07\x00` / `\x01\x00` | [DrMcCoy/dmc_unrar](https://github.com/topics/decompressor) (single-file C) · [selmf/unarr](https://github.com/selmf/unarr) (lib) · `unrar` 7.x | unarr also covers zip/7z/tar — good single library for triage tools. |
| **ZIP / ZIPX / SFX** | `PK\x03\x04` (scan inside MZ stubs for SFX) | zlib / `libarchive` · 7-Zip (zipx) | stdlib everywhere; SFX = MZ + embedded ZIP. |
| **7z** | `'7z\xBC\xAF\x27\x1C'` | [ip7z/7zip](https://github.com/ip7z/7zip) · unarr · LZMA SDK (PD) | Also the container of choice for the repo’s drive-sync payloads. |
| **ISO / IMG** | `CD001` at 0x8001 · raw geometry | 7-Zip (ISO/FAT/HFS/NTFS/SquashFS/UDF/VHD…) · `mtools` | Disk images are archive-of-archives: mount or extract, then re-run this table. |
| **uuencode / xxd / base64** | `begin ` / `begin-base64` / hexdump tables | uudecode(1), `base64 -d`, Python `binascii` | The failed session in the backlog export is superseded by `research/kgk-arj-listing-extract.txt` — no re-encoding needed. |
| **PKWARE DCL/implode, Zoo, HA, UC2, SQ** | per-format magics | `unarc-rs` · `ancient` (NetBSD) · [jekovcar/PeaZip](https://github.com/jekovcar/PeaZip) | Retro tail; `unarc-rs` covers the widest late-DOS grab-bag. |

## Cross-format front end

[peazip/PeaZip](https://github.com/peazip/PeaZip) and 7-Zip already chain most rows
(7z unpacks ARJ/LHA/CHM/SWF/Z + disk images; PeaZip adds ACE via addon). For triage
scripts, `libarchive`/`unarr`/`unarc-rs` are the embeddable tier.

## Ghidra/CyberChef hooks

- **Ghidra:** the SFX rows are stub-disassembly exercises (MZ stub → embedded
  archive). Recipe: find method magic, extract, then hash-gate per
  [`ghidra-cyberchef-recipes.md`](ghidra-cyberchef-recipes.md) §1 before any analysis.
- **CyberChef:** *Drop bytes / Extract archive* covers zip/7z/gzip; the LHA/ARJ/ACE
  rows have no built-in op — candidates for recipe ops built on the decoders above.
  Input-type and magic scanning ops (`Entropy`, `Magic`, `Scan for signatures`) form
  the front of every recipe.
- **Password/garble recipes (ARJ `-g`, SFX `-p`, LHA `-x`):** research-level only
  (F4); never pointed at the FNA102B shareware name database (F2).
