# Ghidra headless recon: F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 8
- Strings collected: 1101

## Metadata
- # of Bytes: `131072`
- # of Data Type Categories: `8`
- # of Data Types: `78`
- # of Defined Data: `178`
- # of Functions: `14`
- # of Instructions: `130`
- # of Memory Blocks: `8`
- # of Symbols: `120`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `visualstudio:unknown`
- Compiler ID: `windows`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:23:19 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/.relay/samples/F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe`
- Executable MD5: `f8294a40f19351b9f2c05717d6350b2e`
- Executable SHA256: `cdc4d4ec546c1933ab3fd41f3dfe724ee3221516999341c1ca197180683b3a56`
- FSRL: `file:///home/runner/work/Html5/Html5/.relay/samples/F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe?MD5=f8294a40f19351b9f2c05717d6350b2e`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `ffdfffff`
- Minimum Address: `00400000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `F8294A40F19351B9F2C05717D6350B2E_cr_tw123a.exe`
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
| .data | 0041e000 | 4096 | RW- |
| tdb | ffdff000 | 4096 | RW- |

## Imports
### ADVAPI32.DLL (1)

- `RegCloseKey`

### KERNEL32.DLL (3)

- `GetModuleHandleA`
- `GetProcAddress`
- `LoadLibraryA`

### MSVCRT.DLL (1)

- `time`

### USER32.DLL (1)

- `SetFocus`

## Entry points / exports
- `0041c001  entry`
- export `entry`

## IOCs
## Decompiled functions (1)
- `entry` at 0041c001 (score 6) -> decompiled/entry_0041c001.c