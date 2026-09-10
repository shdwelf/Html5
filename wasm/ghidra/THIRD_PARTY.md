# Third-party notices — `wasm/ghidra/`

## Ghidra decompiler, compiled to WebAssembly

- **Package:** `@mauricelam/ghidra-decompiler-wasm@0.0.4`
- **Upstream:** <https://github.com/mauricelam/ghidra-decompiler>
- **License:** Apache-2.0
- **Files vendored:** `ghidra_decompiler.js`, `ghidra_decompiler.wasm`

This is a fork of the NSA's Ghidra decompiler
(<https://github.com/NationalSecurityAgency/ghidra>, Apache-2.0) with a
standalone/WASM build target that adds a memory-backed `Architecture` and
`Sleigh` bridge (`wasm_wrapper.cc`). The wasm exposes `init_decompiler`,
`decompile_pcode`, `detect_architecture` and `free_string`. No modifications
were made to the vendored binaries.

## SLEIGH processor specifications

- **Source:** the Ghidra distribution (same repository, `Processors/x86/`)
- **License:** Apache-2.0
- **Files vendored:** `x86.sla`, `x86-64.sla`, and the `x86-16*` / `x86-64*` /
  `x86gcc` / `x86win` / `x86borland` / `x86delphi` `.pspec` / `.cspec` files,
  plus a reduced `processors.json` that advertises only the six languages whose
  specs are present.

## Sample sources

`samples/src/*.asm`, `samples/src/*.md` and `samples/src/*.txt` are reproduced
from the public corpus at <https://github.com/ksaj/Ontario1024> for study. The
three `.gas.s` files and `samples/bin/*.bin` are ports/assemblies produced for
this lab; see `tools/README.md` for the exact commands.
