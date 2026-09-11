# Ghidra headless recon: 8C3F387E85090907ED7864D07980AF86_A0262141.exe

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 1
- Strings collected: 6000

## Metadata
- # of Bytes: `836608`
- # of Data Type Categories: `12`
- # of Data Types: `117`
- # of Defined Data: `724`
- # of Functions: `15`
- # of Instructions: `92`
- # of Memory Blocks: `3`
- # of Symbols: `123`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `borland:pascal`
- Compiler ID: `borlanddelphi`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:22:55 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/.relay/samples/8C3F387E85090907ED7864D07980AF86_A0262141.exe`
- Executable MD5: `8c3f387e85090907ed7864d07980af86`
- Executable SHA256: `4a15f6919dfd1285eb903c47aad878aa9ba61c59d417d59fde4e1682bc126c73`
- FSRL: `file:///home/runner/work/Html5/Html5/.relay/samples/8C3F387E85090907ED7864D07980AF86_A0262141.exe?MD5=8c3f387e85090907ed7864d07980af86`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `004ccfff`
- Minimum Address: `00400000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `8C3F387E85090907ED7864D07980AF86_A0262141.exe`
- Relocatable: `false`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 00400000 | 1024 | R-- |
| CODE | 00401000 | 819200 | RWX |
| .rsrc | 004c9000 | 16384 | RWX |

## Imports
### ADVAPI32.DLL (1)

- `RegQueryValueExA`

### COMCTL32.DLL (1)

- `ImageList_SetIconSize`

### COMDLG32.DLL (1)

- `GetSaveFileNameA`

### GDI32.DLL (1)

- `UnrealizeObject`

### KERNEL32.DLL (4)

- `GetProcAddress`
- `LoadLibraryA`
- `VirtualAlloc`
- `VirtualFree`

### OLE32.DLL (1)

- `CoTaskMemAlloc`

### OLEAUT32.DLL (1)

- `SysFreeString`

### SHELL32.DLL (1)

- `ShellExecuteA`

### USER32.DLL (1)

- `GetKeyboardType`

### VERSION.DLL (1)

- `VerQueryValueA`

### WINMM.DLL (1)

- `timeGetTime`

## Entry points / exports
- `00401000  entry`
- export `entry`

## IOCs
### ipv4
- `1.0.0.0`
- `6.0.0.0`

## Decompiled functions (1)
- `entry` at 00401000 (score 6) -> decompiled/entry_00401000.c