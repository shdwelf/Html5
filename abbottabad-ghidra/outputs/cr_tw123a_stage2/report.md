# Ghidra headless recon: cr_tw123a.stage2.exe

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 21
- Strings collected: 1546

## Metadata
- # of Bytes: `335872`
- # of Data Type Categories: `3`
- # of Data Types: `63`
- # of Defined Data: `285`
- # of Functions: `21`
- # of Instructions: `1052`
- # of Memory Blocks: `8`
- # of Symbols: `210`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `visualstudio:unknown`
- Compiler ID: `windows`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:43:38 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked-local/cr_tw123a.stage2.exe`
- Executable MD5: `72aa06400ad87771723922768c069502`
- Executable SHA256: `79c5fdb54708f4c1aead2c861de7fc7f1f5cecf425341330832df05624905cf3`
- FSRL: `file:///home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked-local/cr_tw123a.stage2.exe?MD5=72aa06400ad87771723922768c069502`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `ffdfffff`
- Minimum Address: `00400000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `cr_tw123a.stage2.exe`
- RTTI Found: `false`
- Relocatable: `false`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 00400000 | 4096 | R-- |
| .text | 00401000 | 4096 | RW- |
| .rdata | 00402000 | 4096 | RW- |
| .data | 00403000 | 4096 | RW- |
| .rsrc | 00404000 | 98304 | RW- |
| .sandra | 0041c000 | 8192 | RW- |
| .data | 0041e000 | 208896 | RW- |
| tdb | ffdff000 | 4096 | RW- |

## Imports
## Entry points / exports
- `0041cb33  entry`
- export `entry`

## IOCs
### url
- `http://www.tweak-xp.de`

## Decompiled functions (1)
- `entry` at 0041cb33 (score 6) -> decompiled/entry_0041cb33.c