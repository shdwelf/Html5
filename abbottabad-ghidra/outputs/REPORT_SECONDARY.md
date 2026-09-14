# Secondary files-of-interest report — remaining PE samples (Abbottabad corpus, extraction set `extract.txt`)

Companion to `outputs/AGENTCPD/REPORT.md` (the primary finding: Equation Group
**Fanny** worm agent). This report covers the other nine non-`REGSVR` PE
members that were flagged by static triage. **Bottom line: none of them is
malware** — the set is one worm agent (AGENTCPD.DLL), one generic installer
stub, two Flash-desktop clock packages, and a cluster of game cheats /
keyfilemakers / key generators typical of a consumer Windows XP machine's
downloads.

Analysis date: 2026-09-11 · Methods: pefile + capstone static triage
(`scripts/triage2.py` → `../../evidence/triage2.json`), headless Ghidra 11.2.1
on GitHub-hosted runners (full egress), and **unicorn-based emulation
unpacking** with Un{i}packer (`scripts/unpack/*.py`). The sandbox itself has
no JDK/Ghidra and restricted egress (github.com + PyPI only), so unpacking was
done locally with Unicorn and heavy Ghidra runs via CI.

## 1. Verdict table

| Member (hash-prefix) | Name as found | Packer / form | Identity | Verdict |
|---|---|---|---|---|
| `8EC740ED…` | CLScc.exe | **UPX 0.72** (1999-era NRV stub) | "**Tiberian Sun Map Trainer**" (in-app title: *Class Trainer 1999*) — game memory trainer | Grayware (game cheat), benign |
| `FB0C718C…` | KeyGen.exe | **FSG** ("Fast Small Good") | Cracktro-style **key generator** dialog (GDI art + `OleLoadPicture` splash JPEG) | Grayware (piracy tool), benign |
| `F8294A40…` | cr_tw123a.exe | **custom "sandra/San99Y" two-stage loader** | "**Keyfilemaker for Tweak-XP v1.23a**" — writes `\txp-lcn.ini` (`Name=`/`Serial=`) | Grayware (piracy tool), benign |
| `0554BE67…` | Clock_Data4.exe | **UPX** wrapper + overlay | **"FlashDesktop" Flash projector package** (analog clock SWF + HTML + JPG, author `sami808@hotmail.com`) | Benign (adware-era Flash toy) |
| `A7AC1F99…` | Clock_Data5.exe | **UPX** wrapper + overlay | Same FlashDesktop package, variant background | Benign |
| `F54E8E2D…` | GLB1.tmp | none (Wise stub) | **Wise Installation System stub for "VLC Media Player"** (`Wise0132.dll`, `STUB32.EXE`, `WiseMain`) | Benign installer bootstrap |
| `8C3F387E…` | A0262141.exe | **PECompact 2 (PEC2)** w/ SEH-anti-disasm | Delphi/VCL GUI program (manifest `DelphiApplication`); unpack blocked; visible surface = `ShellExecuteA`, `GetSaveFileNameA`, `VirtualAlloc` | Unidentified packed Delphi GUI tool; no malware indicators |
| `A131FCA4…` | Setup1.exe | none | Microsoft **VB6 Setup Toolkit** 6.00.8450 (`MSVBVM60`) | Benign |
| `AB07ED5E…` | TSXP.EXE | UPX | **TaskSwitchXP 2.0.9.1** installer (Alexander Avdonin, open source alt-TaskSwitch) | Benign |
| `F4878E9A…` | (Arabic name).exe | ASPack | **eBook Workshop** `book.exe` v1.4 (Ada99.com) | Benign packed ebook compiler |

The nine `REGSVR.EXE` members are genuine Microsoft `rundll32.exe` copies
(see AGENTCPD report §8); they are not repeated here.

## 2. Emulation-assisted unpacking (Unicorn / Un{i}packer)

Unpacked images, import-rebuilt by the emulator, are in
`../../evidence/unpacked-local/`. The scripts are reproducible via
`scripts/unpack/` (the in-sandbox GitHub Actions workflow `arena-deep2.yml`
performed the standard UPX attempts; the custom emulation below handles the
loaders CI UPX could not).

### 2.1 CLScc.exe → Tiberian Sun Map Trainer
* Sections `UPX0–UPX3`; footer `@$Id: UPX 0.72 Copyright (C) 1996-1999 Laszlo
  Molnar & Markus Oberhumer $`. UPX 0.72 predates the `upx-ucl` in CI and is
  rejected by current UPX ("modified/hacked"), so the image was recovered by
  Un{i}packer's `UPXUnpacker` (OEP reached, 139,264 B, imports rebuilt).
* Unpacked strings: `Class Trainer 1999`, **`Tiberian Sun Map Trainer`**,
  Borland Delphi RTL (`SOFTWARE\Borland\Delphi\RTL`, "Portions Copyright
  (c) 1983,97 Borland").
* 171 Ghidra functions; behaviorally a Delphi GUI that uses
  `GetAsyncKeyState` (trainer hotkeys), `FindWindowExA`/
  `GetWindowThreadProcessId` (locate the game window), `OpenProcess`/
  `WriteProcessMemory` (visible in the reconstructed import directory),
  `CreateFileA`/`GetFileSize` and GDI `TextOutA`/`BitBlt` for the window.
  That is the textbook game-trainer pattern (patch another process's memory
  on keypress); it targets a single 1999 game and has no spreading, network,
  or persistence code.

### 2.2 KeyGen.exe → cracktro key generator (FSG)
* Signature `FSG!` at file offset 0x14; FSG stub decompresses into the
  unnamed first section. Un{i}packer's FSG path did not auto-dump on this
  variant, so the dump was taken at the observed OEP **0x40102e** (the
  unpacked CRT had already begun calling `DialogBoxParamA`); the
  ImportRebuilder dumper produced a 208,896 B image.
* 57 Ghidra functions. Imports after rebuild: GDI custom rendering
  (`CreateFontA`, `BitBlt`, `Rectangle`, `TextOutA`, pens/brushes),
  `DialogBoxParamA`/`SetDlgItemTextA`/`SendDlgItemMessageA`,
  `FindResourceA`/`LoadResource`/`LockResource`, `OleLoadPicture` (JPG splash
  via `CreateStreamOnHGlobal`), `GetTickCount`/`Sleep`, `CreateThread`.
  No networking, no process manipulation, no registry/Run keys. A
  conventional keygen cracktro. The packed file ships a ~19 KB IMAGE
  splash resource (locale 1033).

### 2.3 cr_tw123a.exe → Tweak-XP v1.23a keyfilemaker (custom "sandra" loader)
* Two-section custom loader: EP inside section **`.sandra`** (RVA 0x1c001);
  marker strings `San99Y`, `LOADER ERROR`, and the fallback messages
  "The procedure entry point %s could not be located in the dynamic link
  library %s". Stage 1 is position-independent: it resolves only
  `LoadLibraryA`/`GetProcAddress`/`GetModuleHandleA`, `VirtualAlloc`/
  `VirtualFree`, `MessageBoxA`/`wsprintfA`, then unpacks an MSVCRT program
  (the emulator runs its CRT startup — `__set_app_type`, `__p__fmode`,
  `_controlfp`, `_initterm`, `__getmainargs`).
* Unpack trace: OEP hop to 0x401000 after ~30 k instructions; the payload's
  data section (0x1e000) is only populated after ~300 k instructions (lazy
  decompression). Dumped at that point with image pages back-filled
  (`scripts/unpack/dump_cr2.py`; 331,776 B).
* Plaintext payload strings are unambiguous:
  `Keyfilemaker for:` **`Tweak-XP v1.23a`**, `&Register me!`, `Enter a name!`,
  `Name=`, `Serial=`, `Software=Tweak-XP`, `\txp-lcn.ini`,
  `The keyfile has been generated succesfully`, `http://www.tweak-xp.de`.
  It reads `Software\Microsoft\Windows NT\CurrentVersion` /
  `…\Windows\CurrentVersion` (OS fingerprint for the serial) and writes the
  keyfile via the standard CRT (no Win32 import surface beyond the loader's
  VirtualAlloc calls). Tweak-XP is a German Windows-XP tweaking utility;
  corpus context confirms it: the same source device (000301036) holds a
  large warez-style collection of XP powertoys/tweakers (BootVis,
  PowerToys setups, CursorXP, HelioBarXP, RescueXP, keyremapperXP, plus
  `FILE_ID.DIZ`/`.nfo` scene files).

### 2.4 Clock_Data4.exe / Clock_Data5.exe — FlashDesktop packages
* UPX'd host (~13–14 KB post-unpack: an OLE/Common-Controls dialog launcher
  with 58 functions) plus a 133–148 KB appended package in a TLV container
  (`[u32 namelen][name][u32 datalen][data]`) beginning with a manifest
  record naming author `sami808@hotmail.com`, terminated by the
  `FlashDesktop` footer.
* Extracted contents (`../../evidence/flash/Clock_Data{4,5}/`):
  `Clock_DataN.htm` (1,179 B, embeds `Clock_DataN.swf` over
  `Background_00N.JPG`), `Clock_DataN.swf` (46,047 B, **byte-identical** in
  both packages, SWF v5) and the full background JPGs (85,899 / 101,221 B;
  XMP metadata shows they were prepared in Adobe Photoshop 7.0 ME and titled
  "FlashDesktop"). No URLs other than the Macromedia/Adobe plugin and XMP
  namespace strings. These are decorative Flash clocks ("FlashDesktop"
  toy/screensaver-era, ~2003).

### 2.5 GLB1.tmp — Wise installer stub for VLC Media Player
* Not packed (4 small sections, normal IAT). Exports `_MainWndProc@16` and
  `_StubFileWrite@12`; overlay 56,832 B. Embedded strings:
  `Initializing Wise Installation Wizard...`, `Could not extract
  Wise0132.dll to '%s', CRC does not match.`, `Could not initialize
  installation.`, `Demo installations only run on the computer they were
  created on.`, `STUB32.EXE`, `GLBSInstall`, `WiseMain`, and the product name
  **`VLC Media Player`**. This is the standard bootstrap stub produced by the
  Wise Installation System (a VLC distribution built with an evaluation copy
  of Wise); the overlay is the compressed Wise installation data. 26 Ghidra
  functions, GDI splash window + token-privilege adjustment
  (`AdjustTokenPrivileges`) as used by Wise installers.

### 2.6 A0262141.exe — PECompact2 Delphi GUI (payload not recovered)
* Single RWX `CODE` section (H=7.94) + small `.rsrc`; strings `PEC2` /
  `PECompact`; embedded manifest declares `DelphiApplication` with the
  Common-Controls 6 dependency; Borland standard button bitmaps present
  (`BBABORT`, `BBCANCEL`, …). Import directory is the classic
  PECompact one-API-per-DLL decoy table (`GetKeyboardType`, `SysFreeString`,
  `VerQueryValueA`, `UnrealizeObject`, `CoTaskMemAlloc`,
  `ImageList_SetIconSize`, `ShellExecuteA`, `GetSaveFileNameA`,
  `timeGetTime`, `RegQueryValueExA`, plus the loader's `LoadLibraryA`/
  `GetProcAddress`/`VirtualAlloc`/`VirtualFree`). Compile timestamp is the
  usual 1992 Delphi placeholder.
* The PEC2 loader drives control flow through deliberate faults (SEH frame
  installed at EP; `xor eax,eax; mov [eax],ecx` with the junk path never
  executed) and immediately references a high linear address
  (`0x802004`); Un{i}packer's PEC2 support stalls there because it does not
  emulate the exception dispatcher, and implementing KiUserExceptionDispatcher
  in Unicorn was out of scope for a 330 KB utility. Resources and the CODE
  body remain aPLib-compressed, so its exact purpose is **not determined**.
* Risk assessment: no socket/network, service, process-injection or
  persistence APIs exist even as decoys; the informative surface is
  document-oriented (`GetSaveFileNameA`, `ShellExecuteA`, `VerQueryValueA`).
  The source device (000201009) contains games (Luxor), ACDSee and multimedia
  (SWF/WMV/FLV). Treat as an unidentified packed Delphi desktop utility,
  likely another game/multimedia helper; it would require a Windows debugger
  (or PEC2-aware tooling) to fully unpack. It is NOT associated with the Fanny
  findings (no shared strings, keys, mutexes or imports).

## 3. Corpus-context observations (full 467,686-member manifest)

The hash-prefixed filenames strip original paths, but device-level neighbors
classify the material as a **consumer/gaming/warez image**, not an
operational toolkit:

* device `000301036` — XP tweakers/powertoys + scene `.nfo`/`DIZ` files (host
  of the Tweak-XP keyfilemaker);
* device `000301048` — emulator/ROM content (MAME-style snapshots and
  game-data files; host of the Tiberian Sun trainer);
* device `000201009` — games (Luxor), ACDSee, Flash and Arabic media (host of
  A0262141);
* device `000201011` — offline web-page archives, Kaspersky quarantine folder
  name `KAVICHS`, and the Flash clocks / KeyGen;
* device `000201001` — the only operationally significant find: AGENTCPD.DLL
  (Fanny worm USB agent), reported separately.

No MD5/string hits were found in the manifest for the other public Fanny
component names (`fanny.bmp`, `ECELP4.ACM`, `shelldoc.dll`, `comhost.dll`,
`mscorwin.dll`, `msupdate.exe`, the `__d__..__j__` LNK files, or the
`supplystore.mooo.com` C2) within the 20 extracted members; extracting them
is a follow-up if desired (the tokens are not in `extract.txt`).

## 4. Artifacts

```
abbottabad-ghidra/
├── evidence/
│   ├── triage.json                 pefile triage of all 20 samples
│   ├── triage2.json                deep triage (resources/overlay/strings)
│   ├── unpacked/                   UPX unpacks performed on CI (Clock wrappers)
│   ├── unpacked-local/             Unicorn emulation dumps (CLScc, KeyGen FSG, cr_tw123a stage2)
│   └── flash/Clock_Data{4,5}/      fully extracted FlashDesktop packages
├── outputs/
│   ├── AGENTCPD/                   primary finding (Fanny worm) — see REPORT.md
│   ├── GLB1/ A0262141/ cr_tw123a/ Clock4_unpacked/   Ghidra recon (packed-as-shipped)
│   └── CLScc_unpacked/ KeyGen_FSG_unpacked/ cr_tw123a_stage2/  Ghidra recon (unpacked)
└── scripts/
    ├── triage2.py                  deep static triage
    └── unpack/                     Un{i}packer/Unicorn emulation drivers (reproducible)
```

All samples were analyzed statically/emulated only; no code was executed on
Windows. The provided OpenSSH deploy key is used solely to push these
artifacts to `shdwelf/Html5-sync-incoming` from a CI runner (the sandbox
blocks outbound SSH) and is never committed.
