# Ghidra headless recon: F54E8E2D4A979D6D83AC636569596369_GLB1.tmp

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 26
- Strings collected: 366

## Metadata
- # of Bytes: `19064`
- # of Data Type Categories: `12`
- # of Data Types: `191`
- # of Defined Data: `527`
- # of Functions: `96`
- # of Instructions: `2790`
- # of Memory Blocks: `6`
- # of Symbols: `524`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `visualstudio:unknown`
- Compiler ID: `windows`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:23:29 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/.relay/samples/F54E8E2D4A979D6D83AC636569596369_GLB1.tmp`
- Executable MD5: `f54e8e2d4a979d6d83ac636569596369`
- Executable SHA256: `22ebe85d46dcea6472f4a956f0226b34f8e4553593faf969684b84a3ef63080e`
- FSRL: `file:///home/runner/work/Html5/Html5/.relay/samples/F54E8E2D4A979D6D83AC636569596369_GLB1.tmp?MD5=f54e8e2d4a979d6d83ac636569596369`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `ffdfffff`
- Minimum Address: `00400000`
- PE Property[CompanyName]: ``
- PE Property[XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX]: ``
- PE Property[XXXXXXXXXXX]: `|,LegalCopyright`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `F54E8E2D4A979D6D83AC636569596369_GLB1.tmp`
- RTTI Found: `false`
- Relocatable: `false`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 00400000 | 1024 | R-- |
| .text | 00401000 | 8704 | R-X |
| .rdata | 00404000 | 2048 | R-- |
| .data | 00405000 | 1144 | RW- |
| .rsrc | 00406000 | 2048 | R-- |
| tdb | ffdff000 | 4096 | RW- |

## Imports
### ADVAPI32.DLL (3)

- `AdjustTokenPrivileges`
- `LookupPrivilegeValueA`
- `OpenProcessToken`

### GDI32.DLL (14)

- `CreateFontA`
- `CreatePalette`
- `CreateSolidBrush`
- `DeleteObject`
- `GetDeviceCaps`
- `GetStockObject`
- `PatBlt`
- `RealizePalette`
- `SelectObject`
- `SelectPalette`
- `SetBkMode`
- `SetTextColor`
- `StretchDIBits`
- `TextOutA`

### KERNEL32.DLL (32)

- `ExitProcess`
- `FormatMessageA`
- `FreeLibrary`
- `GetCommandLineA`
- `GetCurrentProcess`
- `GetLastError`
- `GetModuleFileNameA`
- `GetModuleHandleA`
- `GetProcAddress`
- `GetTempFileNameA`
- `GetTempPathA`
- `GetVersionExA`
- `GetWindowsDirectoryA`
- `GlobalAlloc`
- `GlobalFree`
- `GlobalLock`
- `GlobalUnlock`
- `LoadLibraryA`
- `LocalFree`
- `MulDiv`
- `OpenFile`
- `SetErrorMode`
- `WinExec`
- `_lclose`
- `_lcreat`
- `_llseek`
- `_lopen`
- `_lread`
- `_lwrite`
- `lstrcatA`
- `lstrcpyA`
- `lstrlenA`

### USER32.DLL (21)

- `BeginPaint`
- `CreateWindowExA`
- `DefWindowProcA`
- `DrawTextA`
- `EndPaint`
- `ExitWindowsEx`
- `GetClientRect`
- `GetDC`
- `InvalidateRect`
- `LoadCursorA`
- `LoadIconA`
- `MessageBoxA`
- `PostQuitMessage`
- `RegisterClassA`
- `ReleaseDC`
- `SendMessageA`
- `SetTimer`
- `SetWindowPos`
- `ShowWindow`
- `UpdateWindow`
- `wsprintfA`

## Entry points / exports
- `00402a80  _MainWndProc@16`
- `00403082  _StubFileWrite@12`
- `004021af  entry`
- export `entry`
- export `_MainWndProc@16`
- export `_StubFileWrite@12`

## IOCs
## Decompiled functions (3)
- `entry` at 004021af (score 6) -> decompiled/entry_004021af.c
- `_MainWndProc@16` at 00402a80 (score 6) -> decompiled/_MainWndProc_16_00402a80.c
- `_StubFileWrite@12` at 00403082 (score 6) -> decompiled/_StubFileWrite_12_00403082.c