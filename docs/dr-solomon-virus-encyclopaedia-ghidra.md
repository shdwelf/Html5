# Dr Solomon’s Virus Encyclopaedia — recovery and Ghidra static analysis

> **Safety boundary:** all results below come from filesystem parsing and static
> Ghidra analysis. No DOS/Windows program, installer, driver, demonstration, or
> antivirus component was executed or emulated.

## Finding

The requested artifact resolves to **Dr Solomon’s Virus Encyclopaedia**, bundled
with the 1992 *Dr Solomon’s Anti-Virus Toolkit for Windows & DOS* by S & S
International Ltd. It is not a product of a software publisher called “Spectre
Press”; that phrase was a mistaken lead. The primary preserved item is Internet
Archive identifier [`dr-solomon`](https://archive.org/details/dr-solomon). Its file
is named `DrSolomon.iso`, but the bytes are a **720 KiB FAT12 floppy image**, not
an ISO-9660 CD image.

The disk’s `WVENCYCL.EX_` member expands with Microsoft SZDD/LZSS to
`WVENCYCL.EXE`, the Windows encyclopaedia program. The disk also carries the
DOS/Windows scanner, guard, repair, installer, help, and virus-data components.
The report keeps those components in scope so the encyclopaedia is not mistaken
for a stand-alone virus sample.

## Provenance gate

- Archive file: `DrSolomon.iso` (737,280 bytes)
- MD5 (Archive metadata cross-check): `c11cd5385d9c69bbaf5224235e09e569`
- SHA-1 (Archive metadata cross-check): `9cfb8f096f78da0582dfb2171754e8b739724c6a`
- SHA-256 (computed by this pipeline): `9606fdcb4b54674d92ec7948d5836e596c6c0d3828a57e57e81c2a14c9fddb52`
- Gate result: **PASS**
- Extractor: `tools/drsolomon_extract.py` (FAT12 + SZDD implemented locally)

The MD5/SHA-1 values are identifiers copied from the Archive metadata, not a
claim that those algorithms remain collision-resistant. The pipeline computes
SHA-256 as the retained modern digest and refuses an image whose size, MD5, or
SHA-1 differs from the pinned artifact.

## Disk inventory

FAT12 geometry: 512 bytes/sector · 
1440 sectors · 
112 root entries · 
2 FAT copies.

| expanded file | bytes | static type | SHA-256 | source member |
| --- | ---: | --- | --- | --- |
| `AVTKDOS1.LST` | 5 | text/data | `d1426a572f3750bb…` | `AVTKDOS1.LST` |
| `AVTKWIN.LST` | 5 | text/data | `d1426a572f3750bb…` | `AVTKWIN.LST` |
| `BWCC.DLL` | 151,984 | Windows 16-bit NE executable | `1d1c8e045f4cd51e…` | `BWCC.DL_` |
| `CLEANPAR.EXE` | 22,847 | DOS MZ executable | `c75c21b46641ac35…` | `CLEANPAR.EXE` |
| `EXPAND.EXE` | 14,563 | DOS MZ executable | `459bdef9e48f1104…` | `EXPAND.EXE` |
| `FINDVIRU.EXE` | 39,938 | DOS MZ executable | `49770f752ebda19b…` | `FINDVIRU.EXE` |
| `GUARDMEM.COM` | 4,616 | binary data | `58352a9557e3d7f7…` | `GUARDMEM.CO_` |
| `GUARDMEM.PIF` | 545 | binary data | `94243df6532846e7…` | `GUARDMEM.PI_` |
| `INSTALL.EXE` | 14,189 | DOS MZ executable | `9a695e5347cf6a1d…` | `INSTALL.EXE` |
| `LZEXPAND.DLL` | 9,936 | Windows 16-bit NE executable | `faf467ce496dd596…` | `LZEXPAND.DLL` |
| `MEM.DRV` | 6,071 | binary data | `53b81cafdbd03d80…` | `MEM.DR_` |
| `QFVD.DRV` | 3,931 | binary data | `d4f869239bcd718c…` | `QFVD.DRV` |
| `SETUP.EXE` | 13,568 | Windows 16-bit NE executable | `938cbc5db1c33fa3…` | `SETUP.EXE` |
| `SETUP_.001` | 73,984 | Windows 16-bit NE executable | `efa71163fc5ad692…` | `SETUP_.00_` |
| `TOOLKIT.EXE` | 122,599 | DOS MZ executable | `56ab9cd1ba04eef0…` | `TOOLKIT.EX_` |
| `TOOLKIT.HLP` | 65,479 | text/data | `f44904fcb488734d…` | `TOOLKIT.HL_` |
| `VIRDATA.DAT` | 43,894 | binary data | `1b6930a0d72918af…` | `VIRDATA.DA_` |
| `WFINDVIR.EXE` | 136,197 | Windows 16-bit NE executable | `69fef5c1c40caa18…` | `WFINDVIR.EX_` |
| `WTLK2.DLL` | 3,840 | Windows 16-bit NE executable | `fcc3a81c70a51d85…` | `WTLK2.DL_` |
| `WTOOLKIT.EXE` | 264,965 | Windows 16-bit NE executable | `d89411f2f18ee5ab…` | `WTOOLKIT.EX_` |
| `WTOOLKIT.HLP` | 70,680 | binary data | `0c2726ff5b05b21c…` | `WTOOLKIT.HL_` |
| `WVENCYCL.EXE` | 73,477 | Windows 16-bit NE executable | `1eceb11ab373acfb…` | `WVENCYCL.EX_` |

## Ghidra sweep

The workflow imports every expanded MZ/NE executable into official NSA Ghidra
12.1.4, allows standard auto-analysis, exports a complete instruction listing,
defined strings, imports, analyzer warnings, and up to 48 decompiled functions,
then deletes the temporary Ghidra project and source bytes. The Git repository
retains this report plus `WVENCYCL.EXE` assembly, selected decompilation, strings,
and JSON metadata—not the executable corpus.

| program | format | language | functions | instructions | strings | imports | decompiled |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| `BWCC.DLL` | New Executable (NE) | `x86:LE:16:Protected Mode` | 403 | 10362 | 296 | 132 | 48/48 |
| `CLEANPAR.EXE` | Old-style DOS Executable (MZ) | `x86:LE:16:Real Mode` | 1 | 315 | 0 | 0 | 1/1 |
| `EXPAND.EXE` | Old-style DOS Executable (MZ) | `x86:LE:16:Real Mode` | 97 | 4678 | 26 | 0 | 48/48 |
| `FINDVIRU.EXE` | Old-style DOS Executable (MZ) | `x86:LE:16:Real Mode` | 1 | 315 | 0 | 0 | 1/1 |
| `INSTALL.EXE` | Old-style DOS Executable (MZ) | `x86:LE:16:Real Mode` | 1 | 234 | 0 | 0 | 1/1 |
| `LZEXPAND.DLL` | New Executable (NE) | `x86:LE:16:Protected Mode` | 85 | 2517 | 25 | 22 | 41/41 |
| `SETUP.EXE` | New Executable (NE) | `x86:LE:16:Protected Mode` | 265 | 2958 | 12 | 57 | 48/48 |
| `SETUP_.001` | New Executable (NE) | `x86:LE:16:Protected Mode` | 622 | 10707 | 52 | 114 | 48/48 |
| `TOOLKIT.EXE` | Old-style DOS Executable (MZ) | `x86:LE:16:Real Mode` | 1 | 315 | 0 | 0 | 1/1 |
| `WFINDVIR.EXE` | New Executable (NE) | `x86:LE:16:Protected Mode` | 774 | 31706 | 85 | 118 | 48/48 |
| `WTLK2.DLL` | New Executable (NE) | `x86:LE:16:Protected Mode` | 84 | 851 | 3 | 24 | 20/20 |
| `WTOOLKIT.EXE` | New Executable (NE) | `x86:LE:16:Protected Mode` | 754 | 17561 | 342 | 117 | 48/48 |
| `WVENCYCL.EXE` | New Executable (NE) | `x86:LE:16:Protected Mode` | 634 | 12637 | 149 | 108 | 48/48 |

## Encyclopaedia executable

- File: `WVENCYCL.EXE` · 73,477 bytes
- SHA-256: `1eceb11ab373acfb08bd6a8e59c6bf1c26eec2404293229b84bbc177bb30dbd8`
- Loader verdict: **New Executable (NE)**
- SLEIGH language: `x86:LE:16:Protected Mode` · compiler spec `default`
- Image base/range: `0000:0000` · `1000:0000`–`1150:037b`
- Recovered: **634 functions**, **12637 instructions**, **149 strings**, **108 external symbols**
- Decompiler: **48/48** selected functions produced C

### What the static evidence establishes

- This is a segmented 16-bit Windows NE application, not an encyclopedia
  document and not a stand-alone DOS virus sample.
- Its `USER`, `GDI`, `KERNEL`, and `BWCC` imports identify a graphical Win16
  front end using Borland's custom controls. Embedded references to
  `WTOOLKIT.HLP` connect it to the surrounding Anti-Virus Toolkit.
- Its descriptive records distinguish infectiousness, infected object classes
  (COM, EXE, boot/partition sectors), memory residence, and payload/infection
  behavior. That is consistent with an informational browser over structured
  virus descriptions; it does not establish that `WVENCYCL.EXE` carries or runs
  the viruses it describes.
- Ghidra's generated names (`FUN_…`, `DAT_…`) remain provisional. The checked-in
  evidence preserves addresses and bytes so later symbol recovery can be audited.

### Recovered data path and record layout

- `WVENCYCL.EXE` expects the separate `VIRDATA.DAT`; its data segment contains
  `Cannot find VIRDATA.DAT`. This separates the browser code from the 43,894-byte
  virus-description corpus shipped beside it.
- The parser at `FUN_1000_0c97` reads 4 KiB buffers and dispatches tagged records
  beginning with bytes `B5` through `B8`. The `B5` path increments the item index
  and inserts recovered text into the UI; `B6`/`B7` retain comma-delimited text
  and file offsets. Those tag meanings are structural interpretations, not
  recovered source-level names.
- The `B8` path unpacks bit fields from four source bytes into a ten-byte
  classification vector. Renderers `FUN_1000_0195` and `FUN_1000_02cb` use those
  values as indexes into prose tables for prevalence, infectiousness, damage,
  target type, residence, stealth, and other effects.
- The prose tables use Pascal `ShortString` storage: one length byte followed by
  fixed-capacity text. Their observed strides include `0x3d` (60 characters plus
  length), `0x51` (80 plus length), and `0x5b` (90 plus length). Printable length
  bytes explain apparent prefixes such as `/`, `<`, and `A` in unnormalized Ghidra
  strings. Together with `BWCC`, this is consistent with a Borland Pascal toolchain.
- Segment `1068` contains the linked Pascal/DOS file runtime, including `INT 21h`
  services `AH=3Fh` (read), `3Eh` (close), and `42h` (seek). Generic write helpers
  are present too; their inclusion alone does not show that the encyclopaedia
  modifies the corpus.

### Memory map

| block | address range | bytes | R/W/X | entropy |
| --- | --- | ---: | --- | ---: |
| `Code1` | `1000:0000`–`1000:268d` | 9,870 | `R-X` | 6.5337 |
| `Code2` | `1008:0000`–`1008:02e9` | 746 | `R-X` | 6.075 |
| `Code3` | `1010:0000`–`1010:03d5` | 982 | `R-X` | 6.0875 |
| `Code4` | `1018:0000`–`1018:01c9` | 458 | `R-X` | 5.8668 |
| `Code5` | `1020:0000`–`1020:0558` | 1,369 | `R-X` | 6.2764 |
| `Code6` | `1028:0000`–`1028:0eda` | 3,803 | `R-X` | 6.4699 |
| `Code7` | `1030:0000`–`1030:003f` | 64 | `R-X` | 4.385 |
| `Code8` | `1038:0000`–`1038:016a` | 363 | `R-X` | 5.2719 |
| `Code9` | `1040:0000`–`1040:1eca` | 7,883 | `R-X` | 6.0266 |
| `Code10` | `1048:0000`–`1048:0864` | 2,149 | `R-X` | 5.8998 |
| `Code11` | `1050:0000`–`1050:0605` | 1,542 | `R-X` | 5.8723 |
| `Code12` | `1058:0000`–`1058:00ec` | 237 | `R-X` | 5.5129 |
| `Code13` | `1060:0000`–`1060:0238` | 569 | `R-X` | 5.9322 |
| `Code14` | `1068:0000`–`1068:0d7e` | 3,455 | `R-X` | 6.9058 |
| `Data15` | `1070:0000`–`1070:9fe5` | 40,934 | `RW-` | 0.9048 |
| `Rsrc0` | `1078:0000`–`1078:02ff` | 768 | `R--` | 2.3616 |
| `Rsrc1` | `1080:0000`–`1080:00ff` | 256 | `R--` | 3.2979 |
| `Rsrc2` | `1088:0000`–`1088:00ff` | 256 | `R--` | 3.1581 |
| `Rsrc3` | `1090:0000`–`1090:01ff` | 512 | `R--` | 4.1676 |
| `Rsrc4` | `1098:0000`–`1098:01ff` | 512 | `R--` | 3.0298 |
| `Rsrc5` | `10a0:0000`–`10a0:01ff` | 512 | `R--` | 2.9476 |
| `Rsrc6` | `10a8:0000`–`10a8:00ff` | 256 | `R--` | 4.2389 |
| `Rsrc7` | `10b0:0000`–`10b0:00ff` | 256 | `R--` | 4.3198 |
| `Rsrc8` | `10b8:0000`–`10b8:00ff` | 256 | `R--` | 3.8842 |
| `Rsrc9` | `10c0:0000`–`10c0:00ff` | 256 | `R--` | 1.7837 |
| `Rsrc10` | `10c8:0000`–`10c8:00ff` | 256 | `R--` | 0.3287 |
| `Rsrc11` | `10d0:0000`–`10d0:03ff` | 1,024 | `R--` | 3.0956 |
| `Rsrc12` | `10d8:0000`–`10d8:03ff` | 1,024 | `R--` | 3.0588 |
| `Rsrc13` | `10e0:0000`–`10e0:02ff` | 768 | `R--` | 2.7761 |
| `Rsrc14` | `10e8:0000`–`10e8:01ff` | 512 | `R--` | 3.175 |
| `Rsrc15` | `10f0:0000`–`10f0:03ff` | 1,024 | `R--` | 3.0443 |
| `Rsrc16` | `10f8:0000`–`10f8:03ff` | 1,024 | `R--` | 3.5745 |
| `Rsrc17` | `1100:0000`–`1100:03ff` | 1,024 | `R--` | 3.1262 |
| `Rsrc18` | `1108:0000`–`1108:03ff` | 1,024 | `R--` | 3.2112 |
| `Rsrc19` | `1110:0000`–`1110:05ff` | 1,536 | `R--` | 2.6727 |
| `Rsrc20` | `1118:0000`–`1118:03ff` | 1,024 | `R--` | 3.6635 |
| `Rsrc21` | `1120:0000`–`1120:02ff` | 768 | `R--` | 2.9521 |
| `Rsrc22` | `1128:0000`–`1128:02ff` | 768 | `R--` | 2.5988 |
| `Rsrc23` | `1130:0000`–`1130:03ff` | 1,024 | `R--` | 3.7692 |
| `Rsrc24` | `1138:0000`–`1138:04ff` | 1,280 | `R--` | 3.5225 |
| `Rsrc25` | `1140:0000`–`1140:03ff` | 1,024 | `R--` | 3.8404 |
| `Rsrc26` | `1148:0000`–`1148:03ff` | 1,024 | `R--` | 3.7504 |
| `EXTERNAL` | `1150:0000`–`1150:037b` | 892 | `R--` | — |

### Entry points

- `1000:260b` — `entry`
- `1000:2577` — `FUN_1000_2577`
- `1000:0002` — `FUN_1000_0002`
- `1000:008a` — `FUN_1000_008a`
- `1000:00da` — `FUN_1000_00da`
- `1000:0113` — `FUN_1000_0113`
- `1000:157a` — `FUN_1000_157a`
- `1000:25a6` — `FUN_1000_25a6`
- `1000:25c9` — `FUN_1000_25c9`
- `1000:0195` — `FUN_1000_0195`
- `1000:02cb` — `FUN_1000_02cb`
- `1000:04a8` — `FUN_1000_04a8`
- `1000:0c97` — `FUN_1000_0c97`
- `1000:1783` — `FUN_1000_1783`
- `1000:1c16` — `FUN_1000_1c16`
- `1000:1c38` — `FUN_1000_1c38`
- `1000:1e25` — `FUN_1000_1e25`
- `1000:202a` — `FUN_1000_202a`
- `1000:204f` — `FUN_1000_204f`
- `1000:2081` — `FUN_1000_2081`
- `1000:20b4` — `FUN_1000_20b4`
- `1000:211e` — `FUN_1000_211e`
- `1000:0ab0` — `FUN_1000_0ab0`
- `1008:0002` — `FUN_1008_0002`
- `1008:0102` — `FUN_1008_0102`
- `1008:01b4` — `FUN_1008_01b4`
- `1008:02a7` — `FUN_1008_02a7`
- `1010:03b6` — `FUN_1010_03b6`
- `1010:003c` — `FUN_1010_003c`
- `1010:0066` — `FUN_1010_0066`
- `1010:00d1` — `FUN_1010_00d1`
- `1010:015d` — `FUN_1010_015d`
- … 226 additional NE entry/export addresses are retained in [`WVENCYCL.EXE.ghidra.json`](dr-solomon-ghidra-evidence/WVENCYCL.EXE.ghidra.json).

### Imported API surface

- **BWCC:** `DIALOGBOXPARAM`, `CREATEDIALOGPARAM`, `BWCCDEFDLGPROC`, `BWCCMESSAGEBOX`
- **GDI:** `SETBKCOLOR`, `SETTEXTCOLOR`, `TEXTOUT`, `ESCAPE`, `SELECTOBJECT`, `CREATEDC`, `DELETEDC`, `GETSTOCKOBJECT`, `GETTEXTMETRICS`
- **KERNEL:** `GLOBALALLOC`, `GLOBALFREE`, `GLOBALLOCK`, `GLOBALUNLOCK`, `GLOBALHANDLE`, `GLOBALCOMPACT`, `WAITEVENT`, `GETMODULEFILENAME`, `MAKEPROCINSTANCE`, `FREEPROCINSTANCE`, `GETPROFILESTRING`, `INITTASK`, `__AHINCR`, `GETWINFLAGS`, `GETFREESPACE`, `ALLOCCSTODSALIAS`, `FREESELECTOR`, `PRESTOCHANGOSELECTOR`, `GLOBALDOSALLOC`, `GLOBALDOSFREE`
- **KEYBOARD:** `Ordinal_5`, `Ordinal_6`
- **USER:** `MESSAGEBOX`, `INITAPP`, `POSTQUITMESSAGE`, `SETCAPTURE`, `RELEASECAPTURE`, `SETFOCUS`, `GETFOCUS`, `REMOVEPROP`, `GETPROP`, `SETPROP`, `SCREENTOCLIENT`, `ISICONIC`, `GETWINDOWRECT`, `ENABLEWINDOW`, `GETWINDOWTEXT`, `SETWINDOWTEXT`, `BEGINPAINT`, `ENDPAINT`, `CREATEWINDOW`, `SHOWWINDOW`, `GETPARENT`, `ISWINDOW`, `ISCHILD`, `DESTROYWINDOW`, `REGISTERCLASS`, `SCROLLWINDOW`, `SETSCROLLPOS`, `SETSCROLLRANGE`, `GETDC`, `RELEASEDC` (+43 more)

### Notable defined strings

For readability, this excerpt removes a printable leading byte when it exactly
matches the remaining Pascal `ShortString` length. The raw Ghidra strings remain
available in the checked-in evidence.

```text
1070:016e	WTOOLKIT.HLP
1070:019c	Virus Encyclopaedia Information:
1070:01f6	WTOOLKIT.HLP
1070:0204	WTOOLKIT.HLP
1070:021a	WTOOLKIT.HLP
1070:03a7	It is not infectious at all,
1070:03e4	It is barely infectious,
1070:0421	It is somewhat infectious,
1070:045e	It is quite infectious,
1070:049b	It is very infectious,
1070:04d8	It is extremely infectious,
1070:074d	Nothing is infected.
1070:079e	COM files are infected.
1070:07ef	EXE files are infected.
1070:0840	COM and EXE files are infected.
1070:0890	Boot and/or partition sectors can be infected.
1070:08e1	Boot and/or partition sectors and COM files can be infected.
1070:0932	Boot and/or partition sectors and EXE files can be infected.
1070:0983	Boot and/or partition sectors, COM and EXE files can be infected.
1070:09d4	An "Other" form of infection takes place.
1070:0a25	This *v* infection is a special case, please see the manual.
1070:0a77	The *v* is not memory resident.
1070:0ac7	The *v* has a memory resident payload.
1070:0b18	The *v* has a memory resident infection system.
```

### Code references to descriptive strings

No direct references to the matched string starts were recovered; Win16 resource or table indirection can obscure those links.

### Checked-in Ghidra evidence

- [Complete instruction listing](dr-solomon-ghidra-evidence/WVENCYCL.EXE.asm)
- [Selected decompiler output](dr-solomon-ghidra-evidence/WVENCYCL.EXE.c)
- [Defined strings](dr-solomon-ghidra-evidence/WVENCYCL.EXE.strings.txt)
- [Machine-readable metadata, imports, xrefs, and analyzer findings](dr-solomon-ghidra-evidence/WVENCYCL.EXE.ghidra.json)

### Disassembly excerpt from the data parser

The complete checked-in listing is linked above; this excerpt provides a
compact view of the parser at `FUN_1000_0c97`.

```asm
FUN_1000_0c97:
1000:0c97          55                             PUSH BP
1000:0c98          89e5                           MOV BP,SP
1000:0c9a          b8bc16                         MOV AX,0x16bc
1000:0c9d          9acb036810                     CALLF 0x1068:03cb
1000:0ca2          81ecbc16                       SUB SP,0x16bc
1000:0ca6          c6068e1a00                     MOV byte ptr [0x1a8e],0x0
1000:0cab          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0caf          16                             PUSH SS
1000:0cb0          57                             PUSH DI
1000:0cb1          bfac99                         MOV DI,0x99ac
1000:0cb4          1e                             PUSH DS
1000:0cb5          57                             PUSH DI
1000:0cb6          9a91086810                     CALLF 0x1068:0891
1000:0cbb          bf780c                         MOV DI,0xc78
1000:0cbe          0e                             PUSH CS
1000:0cbf          57                             PUSH DI
1000:0cc0          9a10096810                     CALLF 0x1068:0910
1000:0cc5          9ad7042010                     CALLF 0x1020:04d7
1000:0cca          08c0                           OR AL,AL
1000:0ccc          7520                           JNZ 0x1000:0cee
1000:0cce          c47e06                         LES DI,[BP + 0x6]
1000:0cd1          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:0cd5          bf7c01                         MOV DI,0x17c
1000:0cd8          1e                             PUSH DS
1000:0cd9          57                             PUSH DI
1000:0cda          bf9401                         MOV DI,0x194
1000:0cdd          1e                             PUSH DS
1000:0cde          57                             PUSH DI
1000:0cdf          6a10                           PUSH 0x10
1000:0ce1          9a5c005011                     CALLF 0x1150:005c
1000:0ce6          c6068e1a01                     MOV byte ptr [0x1a8e],0x1
1000:0ceb          e98408                         JMP 0x1000:1572
LAB_1000_0cee:
1000:0cee          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:0cf2          16                             PUSH SS
1000:0cf3          57                             PUSH DI
1000:0cf4          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0cf8          16                             PUSH SS
1000:0cf9          57                             PUSH DI
1000:0cfa          bfac99                         MOV DI,0x99ac
1000:0cfd          1e                             PUSH DS
```

### Decompiler excerpt: packed classification record

Ghidra's C shows the `B8` parser unpacking source bits into the ten-byte
classification vector later consumed by the prose renderers.

```c
      }
      else if (bVar2 == 0xb8) {
        local_1219 = 0;
        local_1217 = 0;
        local_1215 = 0;
        local_1213 = 0;
        local_20c = (uint)local_1210[local_206 + 1];
        FUN_1068_0cee(local_20c,&local_121e,unaff_SS,local_1210 + local_206 + 2,unaff_SS);
        *(byte *)(iVar5 + local_20a * 10 + 0x9e6) = local_121e >> 5;
        *(byte *)(iVar5 + local_20a * 10 + 0x9e7) = (local_121e & 0x1c) >> 2;
        *(byte *)(iVar5 + local_20a * 10 + 0x9e8) = local_121d >> 5;
        *(byte *)(iVar5 + local_20a * 10 + 0x9e9) = local_121d & 0xf;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ea) = local_121c >> 6;
        *(byte *)(iVar5 + local_20a * 10 + 0x9eb) = (local_121c & 0x38) >> 3;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ec) = local_121c & 7;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ed) = local_121b & 0x1f;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ee) = local_121e & 1;
        if ((local_121d & 8) == 8) {
          *(undefined1 *)(iVar5 + local_20a * 10 + 0x9ee) = 99;
        }
        if (*(char *)(iVar5 + local_20a * 10 + 0x9ee) == '\0') {
          *(undefined1 *)(iVar5 + local_20a + 0x2b) = 0;
        }
        *(byte *)(iVar5 + local_20a * 10 + 0x9ef) = local_121b >> 5;
        uVar8 = FUN_1068_012d(0x1f);
        iVar6 = iVar5 + local_20a * 4;
        *(undefined2 *)(iVar6 + 0x6b94) = (int)uVar8;
        *(undefined2 *)(iVar6 + 0x6b96) = (int)((ulong)uVar8 >> 0x10);
        if (local_1219 == -1) {
          local_102[0] = 0;
        }
        else if (local_1215 == -1) {
          local_102[0] = 0;
        }
        else {
          local_102[0] = 0;
          if (local_1219 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc88,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1219);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
          if (local_1217 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc8e,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1217);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
          if (local_1215 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc90,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1215);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
          if (local_1213 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc8e,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1213);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
        }
        uVar8 = *(undefined4 *)(iVar5 + local_20a * 4 + 0x6b94);
        FUN_1068_08ab(0x1e,(int)uVar8,(int)((ulong)uVar8 >> 0x10),local_102,unaff_SS);
        local_206 = local_206 + local_1210[local_206 + 1] + 2;
      }
      else if (bVar2 == 7) {
        local_206 = local_206 + 1;
        if (0xdac < local_206) {
          bVar7 = CARRY2(local_206,local_210);
          local_210 = local_206 + local_210;
```

### Analyzer caveats

- Ghidra emitted no Error/Warning bookmarks for this program.

## Historical cross-check

- The 1992 disk image and S&S attribution come from the Internet Archive item
  metadata and are independently enforced by the disk hashes above.
- A [separate 1995 print edition](https://archive.org/details/drsolomonsviruse0000alan)
  is catalogued as *Dr Solomon’s Virus Encyclopaedia* by Alan Solomon and
  Dmitry O. Gryaznov, ISBN 1-897661-00-2.
- This artifact is distinct from Eugene Kaspersky’s later AVP Virus Encyclopedia.
  [Published AVP history](https://doi.org/10.1109/93.790614) places that bilingual
  virus databank project in 1992, but that does not make this S&S disk an AVP binary.

## Reproduce

```bash
# The workflow pins and downloads DrSolomon.iso, then:
python3 tools/drsolomon_extract.py DrSolomon.iso /tmp/drsolomon
# For each expanded MZ/NE member:
analyzeHeadless /tmp/ghidra-projects NAME -import FILE \
  -scriptPath tools/ghidra_scripts \
  -postScript EncyclopediaReport.java /tmp/drsolomon/reports -deleteProject
python3 tools/drsolomon_report.py \
  /tmp/drsolomon/inventory.json /tmp/drsolomon/reports \
  docs/dr-solomon-virus-encyclopaedia-ghidra.md
```

The automation lives in `.github/workflows/drsolomon-ghidra.yml`. The principal
`WVENCYCL.EXE` static outputs are checked in under `docs/dr-solomon-ghidra-evidence/`;
the run artifact also contains exports for every analyzed executable. Raw disk and
executable bytes are intentionally excluded from both destinations.
