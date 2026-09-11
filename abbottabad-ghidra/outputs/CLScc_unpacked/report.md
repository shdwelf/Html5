# Ghidra headless recon: CLScc.unpacked.exe

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 171
- Strings collected: 913

## Metadata
- # of Bytes: `136192`
- # of Data Type Categories: `18`
- # of Data Types: `486`
- # of Defined Data: `599`
- # of Functions: `248`
- # of Instructions: `3959`
- # of Memory Blocks: `5`
- # of Symbols: `663`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `borland:pascal`
- Compiler ID: `borlanddelphi`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:43:05 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked-local/CLScc.unpacked.exe`
- Executable MD5: `0a33f41fb326bb8493378fc364ff4b27`
- Executable SHA256: `e886c88881bb9ea17fe5d9554e95736b1e6e49857fa2bc790bf0f153250aeca2`
- FSRL: `file:///home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked-local/CLScc.unpacked.exe?MD5=0a33f41fb326bb8493378fc364ff4b27`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `00421fff`
- Minimum Address: `00400000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `CLScc.unpacked.exe`
- Relocatable: `true`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 00400000 | 1024 | R-- |
| UPX0 | 00401000 | 49152 | RWX |
| UPX1 | 0040d000 | 4096 | RW- |
| UPX2 | 0040e000 | 4096 | R-X |
| UPX3 | 0040f000 | 77824 | R-- |

## Imports
### ADVAPI32.DLL (3)

- `RegCloseKey`
- `RegOpenKeyExA`
- `RegQueryValueExA`

### GDI32.DLL (10)

- `BitBlt`
- `CreateCompatibleDC`
- `CreateFontA`
- `DeleteObject`
- `GetDeviceCaps`
- `GetObjectA`
- `SelectObject`
- `SetBkMode`
- `SetTextColor`
- `TextOutA`

### KERNEL32.DLL (38)

- `CloseHandle`
- `CreateFileA`
- `DeleteCriticalSection`
- `EnterCriticalSection`
- `ExitProcess`
- `FreeLibrary`
- `GetCommandLineA`
- `GetCurrentThreadId`
- `GetFileSize`
- `GetFileType`
- `GetLastError`
- `GetLocaleInfoA`
- `GetModuleFileNameA`
- `GetModuleHandleA`
- `GetStartupInfoA`
- `GetStdHandle`
- `GetThreadLocale`
- `InitializeCriticalSection`
- `LeaveCriticalSection`
- `LoadLibraryExA`
- `LocalAlloc`
- `LocalFree`
- `MulDiv`
- `OpenProcess`
- `RaiseException`
- `ReadFile`
- `RtlUnwind`
- `SetEndOfFile`
- `SetFilePointer`
- `TlsGetValue`
- `TlsSetValue`
- `VirtualAlloc`
- `VirtualFree`
- `VirtualQuery`
- `WriteFile`
- `WriteProcessMemory`
- `lstrcpyA`
- `lstrlenA`

### OLEAUT32.DLL (2)

- `SysFreeString`
- `VariantClear`

### USER32.DLL (20)

- `CreateWindowExA`
- `DefWindowProcA`
- `DispatchMessageA`
- `DrawEdge`
- `FindWindowExA`
- `GetAsyncKeyState`
- `GetDC`
- `GetKeyboardType`
- `GetMessageA`
- `GetWindowThreadProcessId`
- `KillTimer`
- `LoadBitmapA`
- `LoadCursorA`
- `LoadIconA`
- `MessageBoxA`
- `RegisterClassA`
- `ReleaseDC`
- `SetTimer`
- `TranslateMessage`
- `UpdateWindow`

## Entry points / exports
- `00404534  entry`
- export `entry`

## IOCs
## Decompiled functions (10)
- `entry` at 00404534 (score 6) -> decompiled/entry_00404534.c
- `CreateFileA` at 00401014 (score 3) -> decompiled/CreateFileA_00401014.c
- `WriteFile` at 0040105c (score 3) -> decompiled/WriteFile_0040105c.c
- `ExitProcess` at 00401064 (score 3) -> decompiled/ExitProcess_00401064.c
- `GetStartupInfoA` at 0040109c (score 3) -> decompiled/GetStartupInfoA_0040109c.c
- `VirtualAlloc` at 00401128 (score 3) -> decompiled/VirtualAlloc_00401128.c
- `OpenProcess` at 00403c2c (score 3) -> decompiled/OpenProcess_00403c2c.c
- `WriteProcessMemory` at 00403c34 (score 3) -> decompiled/WriteProcessMemory_00403c34.c
- `GetAsyncKeyState` at 00403cb4 (score 3) -> decompiled/GetAsyncKeyState_00403cb4.c
- `GetWindowThreadProcessId` at 00403ccc (score 3) -> decompiled/GetWindowThreadProcessId_00403ccc.c