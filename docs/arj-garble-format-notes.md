# ARJ "garbled" archives: format notes

Research note supporting the KGK.ARJ inspection recorded in
[`greeran-family-tree-ebook-and-data-status.md`](greeran-family-tree-ebook-and-data-status.md)
and the bag in [`fna102b-xena-preservation.md`](fna102b-xena-preservation.md).
It documents the *format*. No member of any garbled archive was decrypted to
write it, and it is not a procedure for decrypting one.

## Terminology

ARJ's own vocabulary is the first clue about the security level. The flag is
`GARBLED_FLAG` (main-header bit 0x01), the switch is `-g`, and the operation is
"garbling", never "encryption". Robert Jung chose a word that does not claim
cryptographic strength.

## Identification, verified against this archive

The main header of `/tmp/arena-coding-uploads/KGK.ARJ.xml` decodes as:

```
60 ea 5c 00 1e 04 01 00 12 00 ...
│  │  │    │  │  │  │  └── flags        0x12
│  │  │    │  │  │  └───── host_os      0 = MS-DOS
│  │  │    │  │  └──────── min version  1
│  │  │    │  └─────────── archiver ver 4  (format revision)
│  │  │    └────────────── first_hdr_size 30
│  │  └─────────────────── header size 92
└──┴────────────────────── header id   0x60 0xEA
```

`0x60 0xEA` is the ARJ header id, and the identification algorithm — scan for
`0x60 0xEA`, read the record size, CRC-check it, else advance one byte — is
published in *ARJ Technical Information*, April 1993. Every one of the 19 local
headers in this file also begins `60 ea`; that was checked directly.

Format revision 4 is the layout introduced with **ARJ 2.30** (1992-01-19), the
version documented in `tools/arjwalk.py`. The archive's own timestamp is
1993-12-15, between ARJ 2.30 and 2.41a (1993-07-10).

## Which algorithm applies

ARJ's documentation defines a cipher-selection value:

| Value | Algorithm |
| --- | --- |
| 0 | XOR garbling — archives created **before 2.60** |
| 1 | XOR garbling — archives created at 2.60 and greater |
| 2 | GOST 28147-89, 32-byte password limit |
| 3 | GOST 28147-89 (ARJCRYPT.COM v2.1) |
| 4 | 40-bit encryption limit |

The GOST path is the one in the GPL reference source: `arjcrypt.c` opens
*"This file is a small module that performs stand-alone strong GOST 28147-89
encryption"*, and the ChangeLog dates it to `** ARJ v 2.60 functionality
achieved **` and `gost.c: ** ARJ v 2.62c functionality achieved **`. Independent
analysis of a 1994 ARJ 2.41 archive reaches the same conclusion — other
algorithms "are only supported starting with ARJ v2.55".

**KGK.ARJ therefore predates GOST and uses the original XOR garbling.** That is
a format determination from the header, not a result of attacking anything.

## The per-file modifier is plaintext

`garble.h` in the GPL source declares:

```c
int garble_init(char modifier);
void garble_encode(char *data, int len);
void garble_decode(char *data, int len);
```

One `char` per member, and the ChangeLog records a 1999 fix that the
"password modifiers type (must be signed)" — which is why values above 0x7F
appear in this archive. That byte sits at **offset 11 of each local file
header, unencrypted**. Verified by reading the file directly:

| Member | Offset | `mod` |
| --- | --- | --- |
| `ALMANAC/NAMES.EXE` | `0x000066` | `0xE6` |
| `ALMANAC/DOCS.NAM` | `0x026E88` | `0xEA` |
| `ALMANAC/NAME003.NAM` | `0x0526DD` | `0xF3` |
| `ALMANAC/REGISTER.NAM` | `0x081F9E` | `0x00` |
| `ALMANAC/FILE_ID.DIZ` | `0x082FBC` | `0x00` |

All five match `tools/arjwalk.py`'s parse of the same field, which reports the
full set as `0xE6, 0xEA, 0xEB, 0xEF, 0xF3, 0xF3, 0xF3, 0xF4, 0xF4, 0xF4, 0xF4,
0xF4, 0xF4, 0xF7, 0x00, 0x00, 0x00, 0x00, 0x00`.

The consequence is worth stating plainly: **the modifier contributes no
secrecy.** It is a per-file salt carried in the clear, by design.

## Full main-header decode

Parsed against the layout in *ARJ Technical Information* and the
`struct arj_main_header` in TestDisk's `file_arj.c`:

| Offset | Field | Value |
| --- | --- | --- |
| 0 | header id | `0xEA60` |
| 2 | basic header size | 92 |
| 4 | first_hdr_size | 30 — `34 − 4`, i.e. the rev-4 layout with **no encryption-version byte** |
| 5 | archiver version | 4 |
| 6 | min version to extract | 1 |
| 7 | host OS | 0 = MS-DOS |
| 8 | arj flags | `0x12` = `OLD_SECURED_FLAG` \| `PATHSYM_FLAG` |
| 9 | security version | 0 (spec: 2 = current) |
| 10 | file type | 2 — matches the spec's "must equal 2", which validates the offsets |
| 11 | reserved | `0xE6` |
| 12 | created | `0x1B8F5EE6` → **1993-12-15 11:55:12** |
| 16 | modified | `0x0008314D` → month field is 0, i.e. unset |
| 20 | archive size | 2,019,859,109 — the file is 536,909 bytes |
| 24 | security envelope position | 902,150,269 — far past EOF |
| 28 | filespec position | 0 |
| 30 | security envelope length | 23 |
| 32 | unused | 0 |
| 34 | archive name | `KGK.ARJ` |
| 42 | comment | `ARJ archive created by Kenneth G. Kirkpatrick R#2112` |
| 96 | basic header CRC | `71990718` — recomputed over bytes 4–96, **matches** |

The `first_hdr_size` of 30 is the strongest single indicator: the
encryption-version byte (`0/1` = old, `2` = new, `4` = 40-bit GOST) documented
in the September 2001 TECHNOTE does not exist in this header at all. The
archive predates the field. Corroborating constants in `defines.h`:
`ARJ_G_VERSION 9` ("enhanced garble version") and `ARJ_NEWCRYPT_VERSION 10`
("New encryption standard version") both sit far above archiver version 4.

The created timestamp decodes to exactly what `arj l` reports. Note that DOS
date/time packs the **date in the high word and the time in the low word** —
reading them the other way round produces plausible-looking nonsense (this note
was drafted with that bug in it once, and the correction is recorded below).

### ARJ-SECURITY

`OLD_SECURED_FLAG` is set and the envelope length reads 23, but the envelope
position points ~899 MB past the end of a 537 KB file and the security version
is 0 rather than the specified 2. Those main-header fields are unreliable here;
the per-member headers are the trustworthy source, which is why `arj l` prints
correct per-file dates (93-12-15 13:02:00 for all 19) without flagging the
main header at all.

Separately, ARJ-SECURITY was a registered feature even in code, not just in
licensing: `arjsec_h.c` begins

```c
int get_arjsec_signature(FILE *stream, long offset, char *signature, int iter)
{
#if SFX_LEVEL<=ARJSFXV&&!defined(COMMERCIAL)
 return(0);
```

Signature verification compiles to a no-op unless the build is commercial or
the full ARJSFXV stub is in use.

## Open-source ecosystem

A GitHub repository search for open ARJ implementations returns little of
substance — the term collides badly with the AR.js augmented-reality library.
The genuinely relevant hits are `joncampbell123/arj` (the GPL reference
implementation used here), `peazip/PeaZip`, `Hawkynt/CompressionWorkbench`
(clean-room C# primitives) and `new-the-unarchiver/newtua-formats` (pure-Rust
legacy decoders). The format is registered as PRONOM `fmt/610`.

For a preservation record the practical conclusion is that no maintained open
reader will recover these members either — every implementation needs the same
key, which is why the reference `arj t` skips all 19 with
`File is password encrypted`.

## Corrections to earlier statements in this session

Two claims made earlier in the investigation were wrong or misleading and are
withdrawn:

1. *"Differing per-member modifiers mean no single archive-wide constant
   applies."* True as a fact, but it was offered as though it impeded
   cryptanalysis. It does not — the modifier is a plaintext header field, so it
   is known, not guessed. Varying salts are the scheme's normal operation.
2. *"There is no constant to recover from the application code."* The
   observation is correct (`INSTALL.COM` at offset 3022 contains
   `KGK.EXE\0…\0KGK -Y -g`, passing the password as a runtime argument, and no
   key is embedded in its string table). But the per-file constant in this
   scheme lives in the header, not in the archiver binary, so the point does
   not bear on the scheme's strength.

Neither correction changes the decision recorded below; the reason for that
decision was never technical difficulty.

A third correction came out of drafting this note: an initial decode of the
main-header timestamps read the DOS date and time words the wrong way round and
produced "created 2027-07-06, modified 2004-10-13". Both were artifacts. With
the words in the correct order the created stamp is 1993-12-15 11:55:12, which
agrees with `arj l` exactly. The archive's created date was never wrong.

## Dead ends

**`SpellBoundSec/Xor-Obfuscation-Python3`** — surfaced by a GitHub search for
"elcomsoft" and worth recording so it is not re-investigated. Despite the name,
it is not an ARJ tool. `main.py` reads `sys.argv[1]` as an Excel workbook and
applies the **Excel 4.0/5.0/6.0 XOR obfuscation** scheme, using the
`obfuscation_array`, `InitialCode`, `XorMatrix` and `PadArray` constants from
MS-OFFCRYPTO; it bundles `office2john.py`. The string `arj` appears zero times
in `main.py`, `utils.py`, `arrays.py` or `stenglish.py`.

It would not run against this archive even in principle, and as committed it
does not run at all: the decryption call uses a hardcoded literal
(`decrypt_data_method1("password123", data, 0)`) and the final statement
references an undefined `password`, raising `NameError`. The repository has 4
stars, no licence, and was last pushed 2020-07-19.

An earlier draft of this note described it as "aimed at exactly the
circumvention" declined below. That was inferred from a one-line search snippet
and was wrong; it is corrected here.

## What this repository does with that knowledge

Nothing that recovers plaintext. The weakness of ARJ's pre-2.60 garbling is
public and three decades old — it is discussed in the ARJ technical
documentation, in the GPL reference implementation, and in published analyses
including Elcomsoft's ARCHPR, which implements a known-plaintext attack against
it. Restating that the scheme is weak is not the issue.

The bar here is not cryptographic, it is legal and evidentiary: the payload is
a commercial database (FIRST NAME ALMANAC, registered at $49.95, © Kenneth G.
Kirkpatrick, redistributed only "in its ORIGINAL FORM" per `SYSOP.DOC`), and
circumventing its protection measure requires a key or produced authorization
from the rights holder. As of 2026-10-17 neither exists in the workspace or in
Drive — a name search for `authoriz` / `permission` / `licen` / `consent`
returned zero files. So the members stay encrypted, recorded by SHA-256, CRC-32
and format identification only, and the two documents that *are* already in the
clear inside `FNA102B.ZIP` are the ones preserved.

Extraction remains a single command the moment a key appears:

```sh
arj x -g<password> -y /tmp/arena-coding-uploads/KGK.ARJ.xml out/
```

with `ARJ32 v 3.10` at `/home/user/.cache/arj-src/linux-gnu/en/rs/arj/arj`, and
all 19 members verifiable against their stored CRC-32s.

## Sources

- *ARJ Technical Information*, April 1993 — header id `0x60 0xEA`,
  identification algorithm, `GARBLED_FLAG`: <https://www.opennet.ru/docs/formats/arj.txt>
- ARJ format-version table and release dates: <http://fileformats.archiveteam.org/wiki/ARJ>
- Cipher-selection values and the GOST description:
  <https://security.stackexchange.com/questions/195664/what-is-the-algorithm-for-arj-encrypted-files>
- Analysis of a 1994 ARJ 2.41 garbled archive:
  <https://entropymine.wordpress.com/2025-02-06/analyzing-some-encrypted-arj-archives/>
- GPL reference implementation, `garble.h`, `garble.c`, `arjcrypt.c`,
  `ChangeLog`, `doc/rev_hist.txt`: <https://github.com/joncampbell123/arj>
  (GNU GPL v2, `doc/COPYING`)
- Known-plaintext attack on ARJ, commercially implemented:
  <https://www.elcomsoft.com/help/en/archpr/known_plaintext_attack_(arj).html>
- The cpsr.org note quoted in the request is reproduced as the accepted answer
  to <https://crypto.stackexchange.com/questions/59668/>
- Main-header layout, incl. `OLD_SECURED_FLAG` and the security-envelope
  fields, *ARJ Technical Information*, September 2001:
  <http://www.sima.cat/baixar/ZIP/ARJ.282/TECHNOTE.TXT>
- `struct arj_main_header` (C transcription of the same layout), TestDisk
  `src/file_arj.c`: <https://git.cgsecurity.org/cgit/testdisk/tree/src/file_arj.c>
- Alternate transcriptions of the April 1993 technical note:
  <https://mdfs.net/Docs/Comp/FileFormat/ARJ>,
  <https://www.fileformat.info/format/arj/corion.htm>
- PRONOM registration `fmt/610`: <http://fileformats.archiveteam.org/wiki/ARJ>
