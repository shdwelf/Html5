# Ghidra headless recon: AGENTCPD.DLL

- Language: `x86:LE:32:default`
- Image base: `10000000`
- Functions: 97
- Strings collected: 386

## Metadata
- # of Bytes: `36864`
- # of Data Type Categories: `14`
- # of Data Types: `158`
- # of Defined Data: `1037`
- # of Functions: `172`
- # of Instructions: `5693`
- # of Memory Blocks: `6`
- # of Symbols: `823`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `visualstudio:unknown`
- Compiler ID: `windows`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 17:48:03 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/user/work/AGENTCPD.DLL`
- Executable MD5: `91985cf1b695f95a72df8e27c75eafc5`
- Executable SHA256: `1e77ae780e3f6389ffd6eae92887e531bf156943e31302c93be08a57ea90e6dd`
- FSRL: `file:///home/user/work/AGENTCPD.DLL?MD5=91985cf1b695f95a72df8e27c75eafc5`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `ffdfffff`
- Minimum Address: `10000000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `AGENTCPD.DLL`
- RTTI Found: `false`
- Relocatable: `true`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 10000000 | 4096 | R-- |
| .text | 10001000 | 16384 | R-X |
| .rdata | 10005000 | 4096 | R-- |
| .data | 10006000 | 4096 | RW- |
| .reloc | 10007000 | 4096 | R-- |
| tdb | ffdff000 | 4096 | RW- |

## Imports
### ADVAPI32.DLL (8)

- `GetUserNameA`
- `RegCloseKey`
- `RegCreateKeyExA`
- `RegDeleteKeyA`
- `RegNotifyChangeKeyValue`
- `RegOpenKeyExA`
- `RegQueryValueExA`
- `RegSetValueExA`

### KERNEL32.DLL (40)

- `CloseHandle`
- `CopyFileA`
- `CreateEventA`
- `CreateFileA`
- `CreateMutexA`
- `CreateThread`
- `CreateToolhelp32Snapshot`
- `DeleteFileA`
- `ExitThread`
- `FindClose`
- `FindFirstFileA`
- `FindNextFileA`
- `FreeLibrary`
- `GetCommandLineA`
- `GetComputerNameA`
- `GetEnvironmentVariableA`
- `GetLastError`
- `GetProcAddress`
- `GetSystemInfo`
- `GetSystemTime`
- `GetTempPathA`
- `GetTickCount`
- `GetVersionExA`
- `GetVolumeInformationA`
- `LoadLibraryA`
- `MoveFileA`
- `Process32First`
- `Process32Next`
- `ReadFile`
- `ResetEvent`
- `SetErrorMode`
- `SetFileAttributesA`
- `SetFilePointer`
- `SetUnhandledExceptionFilter`
- `Sleep`
- `VirtualAlloc`
- `VirtualFree`
- `WaitForMultipleObjects`
- `WaitForSingleObject`
- `WriteFile`

### MSVCRT.DLL (30)

- `_adjust_fdiv`
- `_except_handler3`
- `_getdiskfree`
- `_initterm`
- `_iob`
- `_itoa`
- `exit`
- `fclose`
- `fflush`
- `fopen`
- `fprintf`
- `fread`
- `free`
- `fseek`
- `ftell`
- `fwrite`
- `malloc`
- `memcmp`
- `memcpy`
- `memset`
- `rand`
- `srand`
- `strcat`
- `strcpy`
- `strlen`
- `strncat`
- `strncpy`
- `strrchr`
- `strstr`
- `tolower`

## Entry points / exports
- `100022d8  _start@16`
- `10004eb7  entry`
- export `_start@16`
- export `entry`

## IOCs
## Decompiled functions (5)
- `_start@16` at 100022d8 (score 9) -> decompiled/_start_16_100022d8.c
- `entry` at 10004eb7 (score 6) -> decompiled/entry_10004eb7.c
- `Process32Next` at 10004f80 (score 3) -> decompiled/Process32Next_10004f80.c
- `Process32First` at 10004f86 (score 3) -> decompiled/Process32First_10004f86.c
- `CreateToolhelp32Snapshot` at 10004f8c (score 3) -> decompiled/CreateToolhelp32Snapshot_10004f8c.c