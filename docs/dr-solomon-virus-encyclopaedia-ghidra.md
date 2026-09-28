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
1070:0890	.Boot and/or partition sectors can be infected.
1070:08e1	<Boot and/or partition sectors and COM files can be infected.
1070:0932	<Boot and/or partition sectors and EXE files can be infected.
1070:0983	ABoot and/or partition sectors, COM and EXE files can be infected.
1070:09d4	)An "Other" form of infection takes place.
1070:0a25	<This *v* infection is a special case, please see the manual.
1070:0a77	The *v* is not memory resident.
1070:0ac7	&The *v* has a memory resident payload.
1070:0b18	/The *v* has a memory resident infection system.
```

### Code references to descriptive strings

No direct references to the matched string starts were recovered; Win16 resource or table indirection can obscure those links.

### Checked-in Ghidra evidence

- [Complete instruction listing](dr-solomon-ghidra-evidence/WVENCYCL.EXE.asm)
- [Selected decompiler output](dr-solomon-ghidra-evidence/WVENCYCL.EXE.c)
- [Defined strings](dr-solomon-ghidra-evidence/WVENCYCL.EXE.strings.txt)
- [Machine-readable metadata, imports, xrefs, and analyzer findings](dr-solomon-ghidra-evidence/WVENCYCL.EXE.ghidra.json)

### Disassembly excerpt at the entry point

The complete checked-in listing is linked above; this excerpt provides a
compact view of the decoded entry path.

```asm
; Ghidra 12.1.4
; Static disassembly only — the input was never executed
; Program: WVENCYCL.EXE
; SHA-256: 1eceb11ab373acfb08bd6a8e59c6bf1c26eec2404293229b84bbc177bb30dbd8
; Language: x86:LE:16:Protected Mode

FUN_1000_0002:
1000:0002          55                             PUSH BP
1000:0003          89e5                           MOV BP,SP
1000:0005          b80a00                         MOV AX,0xa
1000:0008          9acb036810                     CALLF 0x1068:03cb
1000:000d          83ec0a                         SUB SP,0xa
1000:0010          ff7610                         PUSH word ptr [BP + 0x10]
1000:0013          ff760e                         PUSH word ptr [BP + 0xe]
1000:0016          9aa0016010                     CALLF 0x1060:01a0
1000:001b          8946fa                         MOV word ptr [BP + -0x6],AX
1000:001e          8956fc                         MOV word ptr [BP + -0x4],DX
1000:0021          ff760c                         PUSH word ptr [BP + 0xc]
1000:0024          ff760a                         PUSH word ptr [BP + 0xa]
1000:0027          9aa0016010                     CALLF 0x1060:01a0
1000:002c          8946f6                         MOV word ptr [BP + -0xa],AX
1000:002f          8956f8                         MOV word ptr [BP + -0x8],DX
1000:0032          ff76fc                         PUSH word ptr [BP + -0x4]
1000:0035          ff76fa                         PUSH word ptr [BP + -0x6]
1000:0038          9a58016010                     CALLF 0x1060:0158
1000:003d          8946fa                         MOV word ptr [BP + -0x6],AX
1000:0040          8956fc                         MOV word ptr [BP + -0x4],DX
1000:0043          ff76f8                         PUSH word ptr [BP + -0x8]
1000:0046          ff76f6                         PUSH word ptr [BP + -0xa]
1000:0049          9a58016010                     CALLF 0x1060:0158
1000:004e          8946f6                         MOV word ptr [BP + -0xa],AX
1000:0051          8956f8                         MOV word ptr [BP + -0x8],DX
1000:0054          ff76fc                         PUSH word ptr [BP + -0x4]
1000:0057          ff76fa                         PUSH word ptr [BP + -0x6]
1000:005a          ff76f8                         PUSH word ptr [BP + -0x8]
1000:005d          ff76f6                         PUSH word ptr [BP + -0xa]
1000:0060          c47e06                         LES DI,[BP + 0x6]
1000:0063          06                             PUSH ES
1000:0064          57                             PUSH DI
1000:0065          9a88055010                     CALLF 0x1050:0588
1000:006a          8946fe                         MOV word ptr [BP + -0x2],AX
1000:006d          ff76fc                         PUSH word ptr [BP + -0x4]
```

### Decompiler excerpt

```c
/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: WVENCYCL.EXE
 * SHA-256: 1eceb11ab373acfb08bd6a8e59c6bf1c26eec2404293229b84bbc177bb30dbd8
 */

/* ------------------------------------------------------------
 * FUN_1000_2577 @ 1000:2577
 * selected: NE entry/export
 * body bytes: 47
 * completed: true
 */

void __stdcall16far FUN_1000_2577(undefined4 param_1)

{
  undefined2 uVar1;
  undefined4 uVar2;
  
  FUN_1068_03cb();
  uVar2 = FUN_1000_008a(0,0,0xbe,200,0,0,0);
  uVar1 = (undefined2)((ulong)param_1 >> 0x10);
  *(undefined2 *)((int)param_1 + 8) = (int)uVar2;
  *(undefined2 *)((int)param_1 + 10) = (int)((ulong)uVar2 >> 0x10);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0002 @ 1000:0002
 * selected: NE entry/export
 * body bytes: 136
 * completed: true
 */

undefined2 __stdcall16far
FUN_1000_0002(undefined4 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5)

{
  undefined2 uVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  
  FUN_1068_03cb();
  uVar2 = FUN_1060_01a0(param_4,param_5);
  uVar3 = FUN_1060_01a0(param_2,param_3);
  uVar2 = FUN_1060_0158(uVar2);
  uVar3 = FUN_1060_0158(uVar3);
  uVar1 = FUN_1050_0588((int)param_1,(int)((ulong)param_1 >> 0x10),uVar3,uVar2);
  FUN_1060_020d(uVar2);
  FUN_1060_020d(uVar3);
  return uVar1;
}



/* ------------------------------------------------------------
 * FUN_1000_008a @ 1000:008a
 * selected: NE entry/export
 * body bytes: 80
 * completed: true
 */

undefined4 __stdcall16far
FUN_1000_008a(undefined4 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5,undefined2 param_6)

{
  undefined2 uVar1;
  bool bVar2;
  undefined4 uVar3;
  
  FUN_1068_03cb();
  bVar2 = true;
  FUN_1068_03ef();
  uVar3 = CONCAT22(DAT_1070_92c4,DAT_1070_92c2);
  if (!bVar2) {
    uVar1 = (undefined2)((ulong)param_1 >> 0x10);
    FUN_1048_0002((int)param_1,uVar1,0,param_3,param_4,param_5,param_6);
    uVar3 = FUN_1048_04dd(0,0,0x18c8,0x67,(int)param_1,uVar1);
  }
  DAT_1070_92c4 = (undefined2)((ulong)uVar3 >> 0x10);
  DAT_1070_92c2 = (undefined2)uVar3;
  return param_1;
}



```

### Analyzer caveats

- Ghidra emitted no Error/Warning bookmarks for this program.

## Historical cross-check

- The 1992 disk image and S&S attribution come from the Internet Archive item
  metadata and are independently enforced by the disk hashes above.
- A separate 1995 print edition is catalogued as *Dr Solomon’s Virus
  Encyclopaedia* by Alan Solomon and Dmitry O. Gryaznov, ISBN 1-897661-00-2.
- This artifact is distinct from Eugene Kaspersky’s later AVP Virus
  Encyclopedia. Contemporary descriptions place AVP’s bilingual virus databank
  project in 1992, but that does not make this S&S disk an AVP binary.

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
