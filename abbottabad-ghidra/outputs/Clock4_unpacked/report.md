# Ghidra headless recon: Clock_Data4.unpacked.exe

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 58
- Strings collected: 391

## Metadata
- # of Bytes: `36864`
- # of Data Type Categories: `19`
- # of Data Types: `186`
- # of Defined Data: `488`
- # of Functions: `120`
- # of Instructions: `4296`
- # of Memory Blocks: `6`
- # of Symbols: `745`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `visualstudio:unknown`
- Compiler ID: `windows`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:23:42 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked/Clock_Data4.unpacked.exe`
- Executable MD5: `2da75d6505112c725cecaec235120eb2`
- Executable SHA256: `0b5d441bc462a8ec124297ece41ea6d4d92f7916f4a744cb69f41c51a60f60b2`
- FSRL: `file:///home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked/Clock_Data4.unpacked.exe?MD5=2da75d6505112c725cecaec235120eb2`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `ffdfffff`
- Minimum Address: `00400000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `Clock_Data4.unpacked.exe`
- RTTI Found: `false`
- Relocatable: `false`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 00400000 | 4096 | R-- |
| .text | 00401000 | 16384 | R-X |
| .rdata | 00405000 | 4096 | R-- |
| .data | 00406000 | 4096 | RW- |
| .rsrc | 00407000 | 4096 | R-- |
| tdb | ffdff000 | 4096 | RW- |

## Imports
### ADVAPI32.DLL (3)

- `RegCloseKey`
- `RegOpenKeyA`
- `RegQueryValueExA`

### COMCTL32.DLL (1)

- `InitCommonControlsEx`

### KERNEL32.DLL (44)

- `ExitProcess`
- `ExpandEnvironmentStringsA`
- `FreeEnvironmentStringsA`
- `FreeEnvironmentStringsW`
- `GetACP`
- `GetCPInfo`
- `GetCommandLineA`
- `GetCurrentProcess`
- `GetEnvironmentStrings`
- `GetEnvironmentStringsW`
- `GetFileType`
- `GetModuleFileNameA`
- `GetModuleHandleA`
- `GetOEMCP`
- `GetProcAddress`
- `GetStartupInfoA`
- `GetStdHandle`
- `GetStringTypeA`
- `GetStringTypeW`
- `GetVersion`
- `GetWindowsDirectoryA`
- `HeapAlloc`
- `HeapCreate`
- `HeapDestroy`
- `HeapFree`
- `HeapReAlloc`
- `LCMapStringA`
- `LCMapStringW`
- `LoadLibraryA`
- `MultiByteToWideChar`
- `RtlUnwind`
- `SetHandleCount`
- `TerminateProcess`
- `UnhandledExceptionFilter`
- `VirtualAlloc`
- `VirtualFree`
- `WideCharToMultiByte`
- `WriteFile`
- `_lclose`
- `_lcreat`
- `_llseek`
- `_lopen`
- `_lread`
- `_lwrite`

### OLE32.DLL (3)

- `CoCreateInstance`
- `OleInitialize`
- `OleUninitialize`

### USER32.DLL (13)

- `DialogBoxParamA`
- `EnableWindow`
- `EndDialog`
- `GetDlgItem`
- `GetSystemMetrics`
- `GetWindowRect`
- `LoadIconA`
- `MessageBoxA`
- `PostMessageA`
- `SendMessageA`
- `SetWindowPos`
- `SetWindowTextA`
- `UpdateWindow`

## Entry points / exports
- `004019b9  entry`
- export `entry`

## IOCs
## Decompiled functions (10)
- `entry` at 004019b9 (score 6) -> decompiled/entry_004019b9.c
- `operator_new` at 004019ab (score 1) -> decompiled/operator_new_004019ab.c
- `_malloc` at 00401b27 (score 1) -> decompiled/_malloc_00401b27.c
- `__nh_malloc` at 00401b39 (score 1) -> decompiled/__nh_malloc_00401b39.c
- `__exit` at 00401bd9 (score 1) -> decompiled/__exit_00401bd9.c
- `__global_unwind2` at 00402498 (score 1) -> decompiled/__global_unwind2_00402498.c
- `__local_unwind2` at 004024da (score 1) -> decompiled/__local_unwind2_004024da.c
- `_strlen` at 00403570 (score 1) -> decompiled/_strlen_00403570.c
- `_strncpy` at 004039b0 (score 1) -> decompiled/_strncpy_004039b0.c
- `_memset` at 004041b0 (score 1) -> decompiled/_memset_004041b0.c