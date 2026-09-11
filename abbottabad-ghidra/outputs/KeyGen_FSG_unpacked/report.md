# Ghidra headless recon: KeyGen_FSG.unpacked.exe

- Language: `x86:LE:32:default`
- Image base: `00400000`
- Functions: 57
- Strings collected: 1331

## Metadata
- # of Bytes: `205312`
- # of Data Type Categories: `14`
- # of Data Types: `175`
- # of Defined Data: `325`
- # of Functions: `100`
- # of Instructions: `707`
- # of Memory Blocks: `3`
- # of Symbols: `274`
- Address Size: `32`
- Analyzed: `true`
- Compiler: `unknown`
- Compiler ID: `windows`
- Created With Ghidra Version: `11.2.1`
- Date Created: `Fri Sep 11 18:43:25 UTC 2026`
- Endian: `Little`
- Executable Format: `Portable Executable (PE)`
- Executable Location: `/home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked-local/KeyGen_FSG.unpacked.exe`
- Executable MD5: `bd16f8bb853ad0069b69b35e9d4f86bf`
- Executable SHA256: `02154eca622d926104b816343197983530c2925b461c1c5f7f56e8e1c34b0d15`
- FSRL: `file:///home/runner/work/Html5/Html5/abbottabad-ghidra/evidence/unpacked-local/KeyGen_FSG.unpacked.exe?MD5=bd16f8bb853ad0069b69b35e9d4f86bf`
- Language ID: `x86:LE:32:default (4.1)`
- Maximum Address: `00432fff`
- Minimum Address: `00400000`
- Preferred Root Namespace Category: ``
- Processor: `x86`
- Program Name: `KeyGen_FSG.unpacked.exe`
- Relocatable: `false`
- SectionAlignment: `4096`
- Should Ask To Analyze: `false`

## Sections
| name | start | size | R W X |
|---|---|---:|:-:|
| Headers | 00400000 | 512 | R-- |
| SECTION.0 | 00401000 | 40960 | RW- |
| SECTION.1 | 0040b000 | 163840 | RW- |

## Imports
### COMCTL32.DLL (1)

- `InitCommonControls`

### GDI32.DLL (16)

- `BitBlt`
- `CreateCompatibleBitmap`
- `CreateCompatibleDC`
- `CreateFontA`
- `CreatePen`
- `CreateSolidBrush`
- `DeleteDC`
- `DeleteObject`
- `GetDeviceCaps`
- `GetTextExtentPoint32A`
- `Rectangle`
- `SelectObject`
- `SetBkColor`
- `SetBkMode`
- `SetTextColor`
- `TextOutA`

### KERNEL32.DLL (11)

- `CreateThread`
- `ExitProcess`
- `FindResourceA`
- `GetModuleHandleA`
- `GetTickCount`
- `LoadResource`
- `LockResource`
- `MulDiv`
- `SetLastError`
- `SizeofResource`
- `Sleep`

### OLE32.DLL (5)

- `CoInitialize`
- `CoTaskMemAlloc`
- `CoTaskMemFree`
- `CoUninitialize`
- `CreateStreamOnHGlobal`

### OLEAUT32.DLL (1)

- `OleLoadPicture`

### USER32.DLL (9)

- `BeginPaint`
- `DialogBoxParamA`
- `EndDialog`
- `EndPaint`
- `GetDC`
- `ReleaseCapture`
- `SendDlgItemMessageA`
- `SendMessageA`
- `SetDlgItemTextA`

## Entry points / exports
- `0040102e  entry`
- export `entry`

## IOCs
## Decompiled functions (4)
- `entry` at 0040102e (score 6) -> decompiled/entry_0040102e.c
- `ExitProcess` at 004017d8 (score 3) -> decompiled/ExitProcess_004017d8.c
- `SendDlgItemMessageA` at 00401838 (score 3) -> decompiled/SendDlgItemMessageA_00401838.c
- `SendMessageA` at 0040183e (score 3) -> decompiled/SendMessageA_0040183e.c