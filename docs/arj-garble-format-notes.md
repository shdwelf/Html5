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
