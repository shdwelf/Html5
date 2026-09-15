# File-of-Interest Report — `AGENTCPD.DLL` (WORM_FANNY / Equation Group "Fanny" worm USB agent)

**Case corpus:** ODNI/CIA Abbottabad Compound Materials release,
`Everything.20171021.zip` (archive.org item `AbbottabadCompoundMaterials`, 322,305,813,413 bytes).
**Member:** `2011-1234/000201001/91985CF1B695F95A72DF8E27C75EAFC5_AGENTCPD.DLL`
(flag=1 in the release manifest). Extracted by authenticated HTTP range reads
with CRC32 verification (see `.arena-relay/scripts/extract.py`).
**Analysis date:** 2026-09-11 · **Method:** static only — Ghidra 11.2.1 headless
(Jython post-scripts) **and** the WebAssembly build of Ghidra's C++ decompiler
(`@mauricelam/ghidra-decompiler-wasm` 0.0.4) running under Node.

---

## 1. Executive summary

`AGENTCPD.DLL` is the removable-media / air-gap-bridging agent component of the
**Fanny worm** (Trend Micro `WORM_FANNY.AA`; Microsoft `TrojanDownloader:Win32/EqtonFanys.A!dha`;
ESET `Win32/Agent.OSW`; Symantec `W32.Fanni`), attributed by Kaspersky Lab to the
**Equation Group** [1][2][3]. Fanny is a USB-spreading reconnaissance worm first
seen in December 2008 that used the LNK zero-day later made famous by Stuxnet and
that mapped / commanded air-gapped networks through infected USB sticks [2][3].
Trend Micro documents this exact file, path, export and loader invocation:

> It runs rundll32.exe to load … `%Windows%\MSAGENT\AGENTCPD.DLL` `_start@16 0` [1]

Identification rests on four unique-in-combination artifacts, all reproduced
directly from the decompiled code: mutex **`Global\DirectMarketing`**, registry
key **`Software\Microsoft\MSNetMng`** with `Status`/`Version`/`Policy`/`COM`
values, export **`_start@16`**, and the filename **`agentcpd.dll`** [1].

The module is the USB-side half of Fanny: it enumerates and watches removable
drives (via `USBSTOR\Enum` / `PartMgr\Enum` registry-notification events),
maintains per-device tracking records, harvests staged `*.bmp` data from a
`\restore\` folder on removable media, fingerprints the host and the running
process list, and installs persistence (Winlogon `Shell` hijack +
`msdtc32.exe`). It contains **no networking imports** — consistent with an
air-gap bridge; the C2/exfil channel lives in other Fanny components
(`shelldoc.dll`, `msupdate.exe`, `comhost.dll`) [1].

## 2. File identity

| Property | Value |
|---|---|
| Size | 32,768 bytes (PE image SizeOfImage 0x8000) |
| Format | PE32 DLL, Intel 386 (0x14c), Windows GUI subsystem, ImageBase `0x10000000` |
| Compile timestamp | 2008-07-28 (unix 1217233679) |
| MD5 | `91985cf1b695f95a72df8e27c75eafc5` |
| SHA-1 | `4d0c7d0dd431fd5cfe9ad5bf9e1dfb79a0c014c0` |
| SHA-256 | `1e77ae780e3f6389ffd6eae92887e531bf156943e31302c93be08a57ea90e6dd` |
| Zip CRC32 | `0x086444fb` (verified on extraction) |
| Sections | `.text` RX 16,384 B (entropy 6.33), `.rdata` R 4,096, `.data` RW 4,096, `.reloc` R 4,096 — not packed |
| Exports | `_start@16` @ `0x100022d8` (sole code export) |
| DLL entry | `0x10004eb7` |
| Imports | 78 functions across KERNEL32, ADVAPI32, MSVCRT (no WININET/WS2_32/URLMON) |
| Ghidra | 97 functions (87 non-thunk), 5,693 instructions, 386 strings |

## 3. Analysis method (two Ghidra front-ends)

1. **Ghidra 11.2.1 headless** (Temurin JDK 21): auto-analysis plus two Jython
   scripts — `scripts/ghidra_recon.py` (metadata, sections, imports, IOC scan,
   priority decompiles) and `scripts/ghidra_dump.py` (decompiles every non-thunk
   function into `all/`, plus addressed `strings.txt` and `function_index.tsv`).
2. **Ghidra-decompiler WASM** [4]: Ghidra's C++ decompiler (SLEIGH
   `x86.sla`, processor spec `x86.pspec`, compiler spec `x86win.cspec`) compiled
   to WebAssembly with Emscripten, driven from Node by
   `scripts/wasm_decompile.cjs`. A PE virtual-memory image is produced with
   `scripts/map_pe.py` (sections placed at their RVAs; the raw on-disk file
   cannot be fed directly because of section alignment).
   `_detect_architecture()` on the raw DLL returns `x86:LE:32:default`;
   `decompile_pcode()` is then called per function address. Outputs are in
   `wasm/`.

Because the WASM build has no PE loader, its output uses synthetic names
(`pcRam1000502c` = indirect call through IAT slot `0x1000502c`). The IAT slots
were resolved separately (full table in §7); e.g. `pcRam1000502c = CreateMutexA`,
`pcRam10005040 = WaitForSingleObject`.

## 4. Code structure and behavior (function-by-function)

### 4.1 Loading

* **DllMain `entry @ 0x10004eb7`** — on `DLL_PROCESS_ATTACH` calls
  `FUN_100022e9`, which calls `CreateThread(0,0, FUN_1000232f, …)` and stashes the
  thread handle in `DAT_10006274`. On detach it `CloseHandle`s it.
* **Export `_start@16 @ 0x100022d8`** — the documented `rundll32 … _start@16 0`
  entry [1]. It is the thread block/wrapper:
  ```c
  /* headless Ghidra */
  WaitForSingleObject(DAT_10006274, INFINITE);
  ```

### 4.2 Worker thread `FUN_1000232f`

`SetErrorMode(0x8007)`, installs a custom unhandled-exception filter
(`DAT_10002435`, anti-crash), calls initializer `FUN_10001893(1)`, then enters an
infinite `WaitForMultipleObjects(2, handles, FALSE, INFINITE)` loop over two
events:

* event 0 → registry configuration/policy change (set via
  `RegNotifyChangeKeyValue` in `FUN_10003618`/`FUN_10001000`): re-reads config;
* event 1 → removable-media scan (`FUN_10003a1d` volume enumeration): for each
  candidate volume it validates a per-volume record (`FUN_100015a2`), appends a
  SYSTEMTIME-stamped Policy record (`FUN_10002174`), runs the propagation /
  collection engine (`FUN_10001114`), and, when the optional writer callback is
  present, queues a status record (`FUN_10002254`).

### 4.3 Single instance, configuration, uninstall — `FUN_10001893`

* `CreateMutexA(0, TRUE, "Global\\DirectMarketing")`; if creation fails or
  `GetLastError()==0xB7` (`ERROR_ALREADY_EXISTS`), it calls `exit(0)` — the
  documented Fanny single-instance mutex [1].
* Allocates a **128 KB transfer buffer** (`malloc(0x20000)`).
* `FUN_10001a85` opens/creates `HKLM\Software\Microsoft\MSNetMng` (falls back to
  HKCU). On first creation, `FUN_10001b1b` seeds `Status=2`, a random non-zero
  `Version`/`Policy` byte (`srand(GetTickCount())`) and immediately installs
  persistence (`FUN_10001bb8`). On subsequent loads `FUN_10001e7f` reads the
  stored state. `Policy` is a binary blob prefixed by an 88-byte SYSTEMTIME /
  version header, appended over time (`FUN_10002174`,
  `RegQueryValueEx`/`RegSetValueEx`).
* Initial scan walks drive letters **A:–W:** with `GetVolumeInformationA`
  (23 iterations, letters built as `'d'+i`) and feeds each volume serial number
  to the same `FUN_100015a2`/`FUN_10001114`/`FUN_10002174` pipeline.
* Shutdown path (`param 2`): closes handles, frees buffers and
  `RegDeleteKeyA(HKEY_LOCAL_MACHINE, "Software\\Microsoft\\MSNetMng")`,
  `ExitThread(0)`.

### 4.4 Persistence / self-install — `FUN_10001bb8`

1. Takes the path of the launching image from `GetCommandLineA()` (stripping
   quotes); if the basename does not end in `.exe`, appends `.exe`.
2. Builds the destination from environment variables and fragments stored
   non-contiguously in `.rdata` (`"\\"`, `"ms"`, `"dtc"`, `"32.exe"`):
   * HKLM install: `%SYSTEMROOT%\System32\msdtc32.exe`
   * HKCU install: `%TEMP%\msdtc32.exe`
3. `MoveFileA(<self>, <destination>)`.
4. Opens `…\Windows NT\CurrentVersion\Winlogon`, reads `Shell` (defaulting to
   `Explorer.exe`), space-pads the old value and **appends the full malware
   path**, then writes it back with `RegSetValueExA` — a classic Winlogon Shell
   hijack (Explorer tolerates space-separated extra tokens, launching them too).

### 4.5 Removable-media engine — `FUN_10001114`

Operates on a device-record table (records 9 bytes each over a ~0x1d4-byte block,
max ~0x33 entries, magic `0x30313230` = ASCII `"0120"` header) derived from the
USB storage enumeration keys
`SYSTEM\CurrentControlSet\Services\USBSTOR\Enum` and
`…\Services\PartMgr\Enum` (strings at `0x10006120`/`0x1000620c`). For each
matching device it:

* builds/emits tagged binary records — type `0x17` (device description,
  0x1e6-byte fixed record emitted through writer `FUN_10004b9b`) and type `0x16`
  (incremental update written via `FUN_1000243d`/`FUN_10001015`), capped at five
  rounds, with an 8-byte end record;
* reads/writes the removable volume through `CreateFileA`/`ReadFile`/
  `WriteFile`/`SetFilePointer` (`FUN_1000243d`, `FUN_10002478`), skipping
  full/short segments;
* behavior is gated on the random `Version` byte (`DAT_10006010`), i.e.
  infected vs. uninfected media follow different write paths — propagation of
  records/cargo to newly inserted media.

`FUN_100044a2` (string `FILENAME`) creates a named staging file on a volume
(prefix + `"FILENAME"`), seeks it to exactly **1,000,000 bytes** and writes a
16-byte marker (sparse marker/reserved tail), then appends collected data —
storage hidden behind a 1 MB seek.

### 4.6 Data harvest — `FUN_100016bb`

For a given volume it enumerates `<drive>:\restore\*.bmp` (`FindFirstFileA`):
the first match is `CopyFileA`'d to `%TEMP%`; every subsequent BMP is
**`MoveFileA`'d** (i.e. removed from the removable device) into `%TEMP%`. This is
collection of staged bitmap payloads (screenshots/scan drops) from media that
shuttled data out of air-gapped machines.

### 4.7 Host fingerprinting — `FUN_10002507` et al.

Builds a 101-byte (`0x65`) record containing: the Version byte,
`GetComputerNameA` (offset 5), `GetUserNameA` (offset 0x25);
`FUN_10002c27` adds the running-process list via
`CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS)`/`Process32First/Next`; other
routines gather OS version (`GetVersionExA`), system info, volume serial /
filesystem (`GetVolumeInformationA`), free space (`_getdiskfree`), and Windows
registration data (`RegisteredOwner`, `RegisteredOrganization`, `ProductId`
under `Software\Microsoft\Windows NT\CurrentVersion`). This matches Trend
Micro's theft list (OS version, computer name, user name, running processes) [1].

### 4.8 What is *not* here

No `fanny.bmp`, `__d__.lnk … __j__.lnk`, `comhost.dll`, `mscorwin.dll`,
`ECELP4.ACM`, `shelldoc.dll`, `msupdate.exe`, URL or C2 string exists in this
binary (raw-string grep: none). Those belong to the dropper/exploit/network
components documented by Trend Micro [1]; AGENTCPD is specifically the
`%Windows%\msagent` USB agent. The LNK zero-day exploitation likewise resides in
the dropper, not here.

## 5. WASM-decompiler demonstration (the requested angle)

No `.wasm` file can exist in a May-2011 corpus: WebAssembly's MVP shipped in
2017. Here WebAssembly is the **analysis vehicle** — Ghidra's own decompiler
compiled to WASM [4] — applied to the 2008 PE32 target.

Reproduction:
```bash
# 1. virtual-memory PE image (sections at RVAs)
python3 abbottabad-ghidra/scripts/map_pe.py \
    /home/user/work/AGENTCPD.DLL /home/user/work/AGENTCPD.mapped.bin
# -> 268435456 268455607 32768   (imagebase, entry, SizeOfImage)

# 2. architecture auto-detect + decompile, full Ghidra decompiler in WASM
node abbottabad-ghidra/scripts/wasm_decompile.cjs \
    AGENTCPD.DLL auto 0x10000000 0x100022d8 windows
#   detected: x86:LE:32:default
node abbottabad-ghidra/scripts/wasm_decompile.cjs \
    AGENTCPD.mapped.bin x86:LE:32:default 0x10000000 0x10001893 windows
```
Outputs: `wasm/100022d8_start16.c`, `wasm/10001893_mutex_thread.c`,
`wasm/10001bb8_shell_persistence.c`, `wasm/100016bb_bmp_harvest.c`.

Cross-check on the export (two independent builds of the same Ghidra engine):

```c
/* WASM decompiler (no symbols; IAT slot 0x10005040 = WaitForSingleObject) */
void 0x100022d8(void) {
  (*pcRam10005040)(xRam10006274, 0xffffffff);
  return;
}
/* headless Ghidra 11.2.1 (PE symbols resolved) */
void _start@16(...) {
  WaitForSingleObject(DAT_10006274, -0x1);
  return;
}
```
The WASM build also automatically discovered and decompiled callees
(`func_0x10001a85`, etc.) and recovered the mutex guard verbatim:
```c
iVar2 = (*pcRam1000502c)(0, 1, 0x1000605c);   /* CreateMutexA(0, TRUE, "Global\\DirectMarketing") */
if (iVar2 != 0) {
  iVar2 = (*pcRam10005028)();                 /* GetLastError() */
  if (iVar2 == 0xb7) { (*pcRam1000511c)(0);} /* ERROR_ALREADY_EXISTS -> exit */
```
This demonstrates that the browser-deployable WASM decompiler reaches the same
results as desktop Ghidra for an obfuscation-free x86 PE, given a correctly
mapped memory image and IAT annotation.

## 6. Indicators of compromise

| Type | IOC |
|---|---|
| File (this report) | `%Windows%\msagent\AGENTCPD.DLL` / md5 `91985cf1b695f95a72df8e27c75eafc5` |
| File (installer name used by this module) | `%SystemRoot%\System32\msdtc32.exe`, `%TEMP%\msdtc32.exe` |
| Mutex | `Global\DirectMarketing` (`RPCMutex` is used by a sibling component [1]) |
| Registry | `HKLM/HKCU\Software\Microsoft\MSNetMng` values `Status`, `Version`, `Policy`, `COM` |
| Registry persistence | `…\Windows NT\CurrentVersion\Winlogon!Shell` = `Explorer.exe  …\msdtc32.exe` |
| Registry watches | `SYSTEM\CurrentControlSet\Services\USBSTOR\Enum`, `…\Services\PartMgr\Enum` |
| Removable-media artifacts | `\restore\*.bmp` collection; `FILENAME` staging files with 1,000,000-byte seek |
| Loader command | `rundll32.exe AGENTCPD.DLL,_start@16 0` |
| Associated Fanny files [1] | `fanny.bmp`, `__d__.lnk`–`__j__.lnk`, `%System%\ECELP4.ACM`, `%System%\shelldoc.dll`, `%System%\comhost.dll`, `%System%\mscorwin.dll`, `%Temp%\msupdate.exe` |
| Associated C2 [1] | `supplystore.mooo.com/ads/QueryRecord200586_f2ahx.html` (sibling component) |

## 7. IAT slots used to annotate WASM output (selected)

`0x1000501c` RegNotifyChangeKeyValue · `0x1000502c` CreateMutexA ·
`0x1000503c` GetVolumeInformationA · `0x10005040` WaitForSingleObject ·
`0x10005044` CreateThread · `0x10005048` WaitForMultipleObjects ·
`0x10005060` FindFirstFileA · `0x10005064` CopyFileA ·
`0x10005068` FindNextFileA · `0x1000506c` MoveFileA ·
`0x10005078` CreateFileA · `0x10005084` WriteFile · `0x10005088` ReadFile ·
`0x100050a4` CreateToolhelp32Snapshot · `0x100050a8/a c` Process32First/Next ·
`0x100050c0` GetComputerNameA · `0x10005000` GetUserNameA ·
`0x100050e0` _getdiskfree · `0x10005098` GetVersionExA.
(full 78-entry table reproducible from the PE import directory.)

## 8. Elimination of the other candidate (REGSVR.EXE)

The nine replicated `REGSVR.EXE` members hypothesized to be malware are
**benign, genuine Microsoft `rundll32.exe`** renamed on disk: PE version
resources carry `OriginalFilename RUNDLL32.EXE`. Seven copies are byte-identical
(Win7 6.1.7260, md5 `477a024b9bd8fc8c2687d421e3790349`), one is Vista
6.0.6000, one XP SP2 5.1.2600. Evidence: `../../evidence/triage.json`.

## 9. Limitations

* Static analysis only; no execution or network behavior was observed (and the
  analyzed module contains no network code). The release was deliberately
  neutralized by the originating agencies; conclusions are from disassembly and
  published vendor intelligence, not from a live infection.
* The dropper/LNK-exploit/network components were not present in the 20 sampled
  members; statements about them rely on Trend Micro's WORM_FANNY.AA analysis [1].
* Function names are Ghidra-generated (`FUN_*`); semantic labels above were
  assigned from API usage, strings and cross-references.

## 10. Artifacts

```
abbottabad-ghidra/outputs/AGENTCPD/
├── REPORT.md                     this file
├── iocs.txt                     machine-readable IOC list
├── report.md / report.json      ghidra_recon.py output (metadata/imports/IOCs)
├── decompiled/                  priority decompiles from headless Ghidra
├── all/                         ALL 87 non-thunk functions decompiled (C)
├── function_index.tsv           addr, name, file, instruction count
├── strings.txt                  all defined strings with addresses
└── wasm/                        decompiler output from the WASM build (C)
abbottabad-ghidra/scripts/
├── ghidra_recon.py / ghidra_dump.py   Jython headless scripts
├── map_pe.py                    PE → virtual-memory image for the WASM driver
└── wasm_decompile.cjs           Node driver for ghidra-decompiler-wasm
```

## References

[1] Trend Micro, *WORM_FANNY.AA — Threat Encyclopedia* — https://www.trendmicro.com/vinfo/us/threat-encyclopedia/malware/worm_fanny.aa
[2] Kaspersky Lab (Securelist), *A Fanny Equation: "I am your father, Stuxnet"*, 2015-02-17 — https://securelist.com/a-fanny-equation-i-am-your-father-stuxnet/68787/
[3] Threatpost, *Massive, Decades-Long Cyberespionage Framework Uncovered* (Equation Group / Fanny air-gap USB bridging), 2015-02-17 — https://threatpost.com/massive-decades-long-cyberespionage-framework-uncovered/111080/
[4] Maurice Lam (fork of NationalSecurityAgency/ghidra decompiler), *ghidra-decompiler — standalone & WebAssembly build* — https://github.com/mauricelam/ghidra-decompiler
