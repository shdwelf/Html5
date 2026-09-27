# Ghidra headless recon: `b43-fwcutter` (extracted from the Linux Kodachi 8 image)

This is a **real binary that ships inside Linux Kodachi**, decompiled headlessly with
the repository's own Ghidra-WASM bridge (`wasm/ghidra/`) — no JVM, no network at run
time. It is the concrete answer to *"run Ghidra on Kodachi"*: pull a genuine executable
out of the distro, load its bytes, and decompile.

## Provenance (how this binary was obtained)

Egress from this sandbox is restricted to GitHub, and multi‑GB `.iso`/`.ova` images
cannot be fetched. The one working channel for **real distro bytes** is cloning a Git
repository that commits the artifact in‑tree. Warith Al Maawali's official Kodachi
source repo does exactly that: the Kodachi‑8 build tree bakes 81 stock `.deb` packages
into the image.

| step | value |
|------|-------|
| Source repo | `github.com/WMAL/kodachios` (official Kodachi, WMAL) |
| Clone commit | `97adf1d8cf6d581998ffc18e0d0f3d0313315cb0` |
| Package in tree | `Kodachi-OS-8-EOL/open/bash/etc/bodhibuilder/debs/amd64/b43-fwcutter_1%3a019-3_amd64.deb` |
| `.deb` MD5 | `bba7a66c17a3c6c1926f5592fed63fc8` |
| `.deb` SHA256 | `1545d709c25b32c0f385d192215ab628a6cf803d9ff52a90a39a44ca7f971105` |
| Extraction | `ar x *.deb` → `tar xf data.tar.xz` → `usr/bin/b43-fwcutter` |

### Extracted ELF

| field | value |
|-------|-------|
| Path | `usr/bin/b43-fwcutter` |
| Size | `61552` bytes |
| MD5 | `a4e9520a21545f07b11b7a925d98e19e` |
| SHA256 | `41362c7281d2f50a07188727ba9c704e1346da609f4e741b529bdce768ff883b` |
| Type | ELF64 **PIE** (`DYN`), x86‑64, System V, stripped |
| Entry | `0x6300` |
| What it is | *b43-fwcutter version 019* — "A tool to extract firmware for a Broadcom 43xx device" (the driver Kodachi bundles so Broadcom Wi‑Fi works on live boot) |

## Decompilation method

- Engine: `wasm/ghidra/ghidra_decompiler.js` + `ghidra_decompiler.wasm` (the same
  Ghidra decompiler `ghidra-lab.html` runs in the browser), driven headlessly by
  **`tools/decompile_elf.mjs`** through the in‑repo `js/ghidra-wasm.js` bridge.
- Language `x86:LE:64:default`, compiler spec `gcc`.
- **Flat load / base:** the bridge loads a flat blob, so the whole file is mapped at
  `base = p_vaddr − p_offset` of the executable `PT_LOAD` segment. Here that segment
  has `Offset 0x0 → VirtAddr 0x0`, so **base = `0x0`** and *file offset == virtual
  address*; a function at virtual address `V` is decompiled by passing `func=V`.
- Reproduce:
  ```
  node tools/decompile_elf.mjs usr/bin/b43-fwcutter entry
  node tools/decompile_elf.mjs usr/bin/b43-fwcutter 0x57c0
  ```

## Cross‑check: PLT thunks → libc symbols

The binary is stripped, so Ghidra names calls `func_0x...`. Resolving the `.plt`
against `.dynsym` (`objdump -d`) pins each stub to a real import, and the resolved
names line up exactly with what the decompiled C does — evidence the decompilation is
faithful, not guessed:

| stub | symbol | seen in |
|------|--------|---------|
| `0x5748` | `__libc_start_main` | `_start` (`0x6300`) calls it with `main=0x57c0` |
| `0x5790` | `fopen` | `main` opens the driver file |
| `0x5788` | `__printf_chk` | `main` prints usage/`--list` output |
| `0x57b0` | `__fprintf_chk` | `main` error path ("Cannot open input file") |
| `0x5758` / `0x5730` | `strcmp` / `strlen` | option parsing (`0x6430`, `0x7170`) |
| `0x5778` / `0x56f8` | `malloc` / `free` | firmware‑blob buffers |
| `0x5720`/`0x5780`/`0x5768` | `fread`/`fseek`/`ftell` | reading the input driver file |
| `0x5760` / `0x5750` | `__memcpy_chk` / `memcmp` | blob copy + MD5/id compare |

## Functions decompiled

Real C for each is under `decompiled/`. PLT‑stub → libc mappings are prepended to each
file as a comment.

| addr | role (inferred from strings + call graph) |
|------|-------------------------------------------|
| `0x6300` | `_start` — tail‑calls `__libc_start_main(main=0x57c0, …)` |
| `0x57c0` | `main` — argument parsing, `--list`/`--version`, open driver, extract blobs |
| `0x6430` | option matcher (long/short flag + optional value) |
| `0x7170` | option matcher variant (used repeatedly in `main`'s parse loop) |
| `0x6a90` | input‑file open / format detection |
| `0x66f0` | firmware‑blob writer (per‑file) |
| `0x68d0` | header/record writer |
| `0x6d90` | byte‑swap / checksum over a blob (endian handling) |
| `0x6570` | brcmsmac‑path extraction |
| `0x6f50` | list/print of supported driver versions |
| `0x71e0` | seek+read helper into the driver object |

## Notable strings (context for the above)

```
b43-fwcutter version 019
A tool to extract firmware for a Broadcom 43xx device
Usage: %s [OPTION] [proprietary-driver-file]
  -l|--list             List supported driver versions
  -b|--brcmsmac         create firmware for brcmsmac
  -w|--target-dir DIR   Extract and write firmware to DIR
This file has an unknown MD5sum %s.
Sorry, the input file is either wrong or not supported by b43-fwcutter.
%s/brcm/bcm43xx-0.fw
```

## Honest scope

- This is **stock Ubuntu code shipped in the Kodachi image**, not Kodachi‑authored
  logic. WMAL/kodachios contains no Kodachi‑written native binaries (its dashboard is
  Bash); the `.deb`s are the only genuine machine code committed in‑tree, so they are
  the honest target for a "Ghidra on Kodachi" pass.
- The decompiler output uses Ghidra's synthetic types (`uint4`, `xunknown8`) and
  address‑named locals because the binary is stripped; that is expected for a
  no‑symbols PIE and does not indicate a bad load.
