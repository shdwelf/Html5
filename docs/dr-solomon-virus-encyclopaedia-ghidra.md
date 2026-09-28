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
retains this evidence report—not the executable corpus.

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
- `1010:01b5` — `FUN_1010_01b5`
- `1010:022e` — `FUN_1010_022e`
- `1010:0002` — `FUN_1010_0002`
- `1010:0090` — `FUN_1010_0090`
- `1010:025a` — `FUN_1010_025a`
- `1010:02eb` — `FUN_1010_02eb`
- `1010:036d` — `FUN_1010_036d`
- `1018:01aa` — `FUN_1018_01aa`
- `1018:000f` — `FUN_1018_000f`
- `1020:052f` — `FUN_1020_052f`
- `1020:0002` — `FUN_1020_0002`
- `1020:002d` — `FUN_1020_002d`
- `1020:02ea` — `FUN_1020_02ea`
- `1020:026b` — `FUN_1020_026b`
- `1020:04d7` — `FUN_1020_04d7`
- `1028:0e27` — `FUN_1028_0e27`
- `1028:0d15` — `FUN_1028_0d15`
- `1028:03e4` — `FUN_1028_03e4`
- `1028:04bc` — `FUN_1028_04bc`
- `1028:04d6` — `FUN_1028_04d6`
- `1028:0532` — `FUN_1028_0532`
- `1028:0599` — `FUN_1028_0599`
- `1028:01c1` — `FUN_1028_01c1`
- `1028:028a` — `FUN_1028_028a`
- `1028:0cd0` — `FUN_1028_0cd0`
- `1028:0aec` — `FUN_1028_0aec`
- `1028:0bcf` — `FUN_1028_0bcf`
- `1028:0c0f` — `FUN_1028_0c0f`
- `1028:0c47` — `FUN_1028_0c47`
- `1028:0c5e` — `FUN_1028_0c5e`
- `1028:0d78` — `FUN_1028_0d78`
- `1030:0002` — `FUN_1030_0002`
- `1038:0002` — `FUN_1038_0002`
- `1040:0341` — `FUN_1040_0341`
- `1040:03ff` — `FUN_1040_03ff`
- `1040:0bcd` — `FUN_1040_0bcd`
- `1040:0c57` — `FUN_1040_0c57`
- `1040:0c73` — `FUN_1040_0c73`
- `1040:065b` — `FUN_1040_065b`
- `1040:068d` — `FUN_1040_068d`
- `1040:0827` — `FUN_1040_0827`
- `1040:0874` — `FUN_1040_0874`
- `1040:05f3` — `FUN_1040_05f3`
- `1040:060d` — `FUN_1040_060d`
- `1040:0641` — `FUN_1040_0641`
- `1040:0627` — `FUN_1040_0627`
- `1040:0e2f` — `FUN_1040_0e2f`
- `1040:0d01` — `FUN_1040_0d01`
- `1040:08c6` — `FUN_1040_08c6`
- `1040:10d2` — `FUN_1040_10d2`
- `1040:0d84` — `FUN_1040_0d84`
- `1040:0e87` — `FUN_1040_0e87`
- `1040:0edd` — `FUN_1040_0edd`
- `1040:05dc` — `FUN_1040_05dc`
- `1040:0df3` — `FUN_1040_0df3`
- `1040:0a9f` — `FUN_1040_0a9f`
- `1040:0f21` — `FUN_1040_0f21`
- `1040:06b4` — `FUN_1040_06b4`
- `1040:0736` — `FUN_1040_0736`
- `1040:055c` — `FUN_1040_055c`
- `1040:0b3f` — `FUN_1040_0b3f`
- `1040:0b86` — `FUN_1040_0b86`
- `1040:090a` — `FUN_1040_090a`
- `1040:0f0b` — `FUN_1040_0f0b`
- `1040:0f76` — `FUN_1040_0f76`
- `1040:0fb5` — `FUN_1040_0fb5`
- `1040:0fe6` — `FUN_1040_0fe6`
- `1040:103d` — `FUN_1040_103d`
- `1040:1093` — `FUN_1040_1093`
- `1040:1148` — `FUN_1040_1148`
- `1040:10ef` — `FUN_1040_10ef`
- `1040:11b9` — `FUN_1040_11b9`
- `1040:148c` — `FUN_1040_148c`
- `1040:14cb` — `FUN_1040_14cb`
- `1040:123a` — `FUN_1040_123a`
- `1040:1294` — `FUN_1040_1294`
- `1040:1256` — `FUN_1040_1256`
- `1040:15e2` — `FUN_1040_15e2`
- `1040:1630` — `FUN_1040_1630`
- `1040:1651` — `FUN_1040_1651`
- `1040:16a6` — `FUN_1040_16a6`
- `1040:16cd` — `FUN_1040_16cd`
- `1040:173d` — `FUN_1040_173d`
- `1040:17ad` — `FUN_1040_17ad`
- `1040:182e` — `FUN_1040_182e`
- `1040:183a` — `FUN_1040_183a`
- `1040:18b1` — `FUN_1040_18b1`
- `1040:18d7` — `FUN_1040_18d7`
- `1040:195f` — `FUN_1040_195f`
- `1040:1505` — `FUN_1040_1505`
- `1040:19b2` — `FUN_1040_19b2`
- `1040:1a59` — `FUN_1040_1a59`
- `1040:1a86` — `FUN_1040_1a86`
- `1040:1a9c` — `FUN_1040_1a9c`
- `1040:1aa8` — `FUN_1040_1aa8`
- `1040:1b01` — `FUN_1040_1b01`
- `1040:1b30` — `FUN_1040_1b30`
- `1040:1b4d` — `FUN_1040_1b4d`
- `1040:1bd0` — `FUN_1040_1bd0`
- `1040:1c27` — `FUN_1040_1c27`
- `1040:1c73` — `FUN_1040_1c73`
- `1040:1cb5` — `FUN_1040_1cb5`
- `1040:1d8a` — `FUN_1040_1d8a`
- `1040:1e01` — `FUN_1040_1e01`
- `1040:1d02` — `FUN_1040_1d02`
- `1040:1e65` — `FUN_1040_1e65`
- `1040:1ea7` — `FUN_1040_1ea7`
- `1040:0097` — `FUN_1040_0097`
- `1040:0045` — `FUN_1040_0045`
- `1040:0071` — `FUN_1040_0071`
- `1040:0133` — `FUN_1040_0133`
- `1040:018b` — `FUN_1040_018b`
- `1040:01dc` — `FUN_1040_01dc`
- `1040:02fa` — `FUN_1040_02fa`
- `1040:03e9` — `FUN_1040_03e9`
- `1040:0466` — `FUN_1040_0466`
- `1040:049e` — `FUN_1040_049e`
- `1040:0524` — `FUN_1040_0524`
- `1040:08dd` — `FUN_1040_08dd`
- `1040:0ce1` — `FUN_1040_0ce1`
- `1040:0db6` — `FUN_1040_0db6`
- `1040:0ea9` — `FUN_1040_0ea9`
- `1048:0002` — `FUN_1048_0002`
- `1048:007a` — `FUN_1048_007a`
- `1048:00b1` — `FUN_1048_00b1`
- `1048:014f` — `FUN_1048_014f`
- `1048:023d` — `FUN_1048_023d`
- `1048:0345` — `FUN_1048_0345`
- `1048:0394` — `FUN_1048_0394`
- `1048:03dc` — `FUN_1048_03dc`
- `1048:0274` — `FUN_1048_0274`
- `1048:028b` — `FUN_1048_028b`
- `1048:0408` — `FUN_1048_0408`
- `1048:02ef` — `FUN_1048_02ef`
- `1048:037b` — `FUN_1048_037b`
- `1048:0429` — `FUN_1048_0429`
- `1048:04ab` — `FUN_1048_04ab`
- `1048:04dd` — `FUN_1048_04dd`
- `1048:0517` — `FUN_1048_0517`
- `1048:052d` — `FUN_1048_052d`
- `1048:0549` — `FUN_1048_0549`
- `1048:0795` — `FUN_1048_0795`
- `1048:0589` — `FUN_1048_0589`
- `1048:07c9` — `FUN_1048_07c9`
- `1048:07ea` — `FUN_1048_07ea`
- `1048:083c` — `FUN_1048_083c`
- `1048:021d` — `FUN_1048_021d`
- `1048:0569` — `FUN_1048_0569`
- `1050:0002` — `FUN_1050_0002`
- `1050:001c` — `FUN_1050_001c`
- `1050:0036` — `FUN_1050_0036`
- `1050:0049` — `FUN_1050_0049`
- `1050:00bb` — `FUN_1050_00bb`
- `1050:011f` — `FUN_1050_011f`
- `1050:0171` — `FUN_1050_0171`
- `1050:019b` — `FUN_1050_019b`
- `1050:01d2` — `FUN_1050_01d2`
- `1050:0248` — `FUN_1050_0248`
- `1050:025f` — `FUN_1050_025f`
- `1050:0293` — `FUN_1050_0293`
- `1050:02e7` — `FUN_1050_02e7`
- `1050:03ac` — `FUN_1050_03ac`
- `1050:03e1` — `FUN_1050_03e1`
- `1050:0469` — `FUN_1050_0469`
- `1050:04bc` — `FUN_1050_04bc`
- `1050:04dd` — `FUN_1050_04dd`
- `1050:0588` — `FUN_1050_0588`
- `1050:05ae` — `FUN_1050_05ae`
- `1050:05c5` — `FUN_1050_05c5`
- `1050:05ea` — `FUN_1050_05ea`
- `1058:00d1` — `FUN_1058_00d1`
- `1058:0002` — `FUN_1058_0002`
- `1058:0021` — `FUN_1058_0021`
- `1058:0044` — `FUN_1058_0044`
- `1058:007d` — `FUN_1058_007d`
- `1060:0002` — `FUN_1060_0002`
- `1060:0019` — `FUN_1060_0019`
- `1060:0030` — `FUN_1060_0030`
- `1060:0077` — `FUN_1060_0077`
- `1060:009f` — `FUN_1060_009f`
- `1060:00bd` — `FUN_1060_00bd`
- `1060:00e0` — `FUN_1060_00e0`
- `1060:0109` — `FUN_1060_0109`
- `1060:0131` — `FUN_1060_0131`
- `1060:0158` — `FUN_1060_0158`
- `1060:017e` — `FUN_1060_017e`
- `1060:01a0` — `FUN_1060_01a0`
- `1060:020d` — `FUN_1060_020d`
- `1068:0002` — `FUN_1068_0002`
- `1068:005d` — `FUN_1068_005d`
- `1068:0061` — `FUN_1068_0061`
- `1068:0891` — `FUN_1068_0891`
- `1068:08ab` — `FUN_1068_08ab`
- `1068:08cf` — `FUN_1068_08cf`
- `1068:0910` — `FUN_1068_0910`
- `1068:093c` — `FUN_1068_093c`
- `1068:0982` — `FUN_1068_0982`
- `1068:09ad` — `FUN_1068_09ad`
- `1068:0a39` — `FUN_1068_0a39`
- `1068:012d` — `FUN_1068_012d`
- `1068:0147` — `FUN_1068_0147`
- `1068:0866` — `FUN_1068_0866`
- `1068:038f` — `FUN_1068_038f`
- `1068:03cb` — `FUN_1068_03cb`
- `1068:0760` — `FUN_1068_0760`
- `1068:0527` — `FUN_1068_0527`
- `1068:052c` — `FUN_1068_052c`
- `1068:0667` — `FUN_1068_0667`
- `1068:06ab` — `FUN_1068_06ab`
- `1068:072c` — `FUN_1068_072c`
- `1068:0796` — `FUN_1068_0796`
- `1068:07fe` — `FUN_1068_07fe`
- `1068:0d26` — `FUN_1068_0d26`
- `1068:0d12` — `FUN_1068_0d12`
- `1068:082e` — `FUN_1068_082e`
- `1068:0cee` — `FUN_1068_0cee`
- `1068:0c72` — `FUN_1068_0c72`
- `1068:0cbd` — `FUN_1068_0cbd`
- `1068:03ef` — `FUN_1068_03ef`
- `1068:0439` — `FUN_1068_0439`
- `1068:0d3d` — `FUN_1068_0d3d`
- `1068:0aa8` — `FUN_1068_0aa8`
- `1068:05d8` — `FUN_1068_05d8`
- `1068:0608` — `FUN_1068_0608`
- `1068:062d` — `FUN_1068_062d`
- `1068:064d` — `FUN_1068_064d`

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

### Disassembly excerpt at the entry point

The full listing is retained as a workflow artifact; this excerpt is the
reviewable, checked-in proof that Ghidra decoded the entry path.

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



/* ------------------------------------------------------------
 * FUN_1000_00da @ 1000:00da
 * body bytes: 57
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

The automation lives in `.github/workflows/drsolomon-ghidra.yml`. Its retained
artifact contains the complete `.asm`, `.c`, string, and JSON exports; raw disk
and executable bytes are intentionally excluded from that artifact.
