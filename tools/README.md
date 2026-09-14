# tools

Everything in this directory is a development/verification helper. None of it is
needed to serve the app — `ghidra-lab.html` is plain static HTML + ES modules.

| tool | what it does |
| --- | --- |
| `serve.mjs` | Static server with `application/wasm` + COOP/COEP headers. `node tools/serve.mjs 8080` → <http://localhost:8080/ghidra-lab.html> |
| `verify_disasm.mjs` | Cross-checks `js/x86dis.js` against `objdump -M i8086` on every sample. Currently **364/364 instructions agree**. |
| `verify_ghidra.mjs` | Headlessly decompiles every code symbol in the catalog through the vendored Ghidra wasm, using the same loader the page uses. |
| `check-dom-ids.mjs` | Contract test: every `$("id")` in `js/viruslab.js` must exist in `ghidra-lab.html`. |
| `stage_ghidra_specs.py` | Re-vendors the Ghidra decompiler wasm + the x86 **and Atmel AVR** SLEIGH specs into `wasm/ghidra` (from `npm pack @mauricelam/ghidra-decompiler-wasm`). |
| `ghidra_avr.mjs` | Atmel AVR firmware walkthrough: real Intel HEX parsing (checksums, load address), decoding via `js/avrdis.js`, a control-flow walk from the reset vector, and the boot-chain opcode sites (`SPM`, `LPM`, `WDR`) each labelled with its function and whether a redirect can reach it. `--lst FILE` points at an `avr-objdump` listing for the symbol names. `--probe` documents that the vendored wasm bridge cannot decompile AVR8 (word-addressed Harvard code space). |
| `verify_avrdis.mjs` | Checks `js/avrdis.js` against the `avr-objdump` listing Optiboot ships (`samples/avr/optiboot_atmega328.lst`): every instruction, every resolved branch target, the symbol table, and the reachability facts on two independent bootloaders. Exit 1 on any mismatch. |
| `avr-lab.html` + `js/avr-lab.js` | The AVR firmware walk in a tab: load one of the vendored bootloaders (or paste a `.hex`), decode it, walk it from the reset vector, and see each `SPM`/`LPM`/`WDR` site named and marked reachable or dead. No wasm, no network. |
| `tests/13-avr-lab.mjs` | Drives that page controller under the DOM stub with the ids from the markup, and asserts it reproduces the numbers the tools report on both vendored images. |
| `verify_rtl.py` | The vchip verification: vectors → CXXRTL build → transcript diff vs the reference model and the golden → 20 SAT proofs → boot-chain checks. `sh tools/setup_rtl.sh` installs Yosys first. |
| `gen_vchip_vectors.mjs` | Expands `rtl/scenarios/vchip_scenarios.json` into the golden vectors; fails on drift unless `--write`. |
| `run_vchip_scenarios.mjs` | Runs the scenarios through the JS reference model (`js/vchip-model.js`, the spec) and prints the transcript. |
| `bootchain.py` | Boot-chain requirement checker: MBR/GPT/ESP/PE32+/loader structure checks + the platform status word, with `--selftest`, `--fixtures`, `--transcript`, `--layout-json`. |
| `verify_bootchain.mjs` | Keeps `js/bootchain.js` equal to the RTL-derived layout and to `tools/bootchain.py`, cycle by cycle. |
| `setup_rtl.sh` | Installs the user-space Yosys build and runs `verify_rtl.py`. |
| `smoke_pipeline.mjs` | Runs the whole DOM-free analysis path over every sample and prints what the panels would show. Catches crashes and empty panels without a browser. |
| `render_research.mjs` | Renders `js/virus-catalog.js` to `criteria/RESEARCH-VIRUSES.md`. |
| `verify_lecture_hall.mjs` | Headless proof for the cipher suite’s Intelligence Lecture Hall: re-derives every published ciphertext (Field Notes wheel, F5 Black Hat 2016, the USCYBERCOM seal digest) and audits the bundle the records live in. No dependencies. |
| `build_entropy_wasm.py` | Pre-existing: hand-assembles the small keyspace projector wasm. |

## Verification workflow

```bash
node tools/check-dom-ids.mjs                       # markup/controller contract
node tools/verify_disasm.mjs                       # disassembler vs objdump
node tools/serve.mjs 8099 &                        # wasm + specs over HTTP
node tools/verify_ghidra.mjs 8099                  # decompile every symbol
node tools/smoke_pipeline.mjs                      # analysis path over every sample
node tools/render_research.mjs                     # regenerate criteria/RESEARCH-VIRUSES.md

# the virtual chipset (RTL) and the boot-chain requirements
sh tools/setup_rtl.sh                              # Yosys (user-space) + full verification
python3 tools/verify_rtl.py --quick                # RTL/model conformance only, ~5 s
python3 tools/bootchain.py --selftest              # requirement rules vs crafted fixtures
python3 tools/bootchain.py --image disk.img --policy uefi
node tools/verify_bootchain.mjs                    # JS mirror vs the RTL-derived layout
node tests/11-chipset-lab.mjs                      # the chipset-lab page controller
node tools/verify_avrdis.mjs                                  # AVR decoder vs avr-objdump (225/225 + 78/78 targets)
node tools/ghidra_avr.mjs samples/avr/optiboot_atmega328.hex   # AVR HEX + control-flow walk + opcode sites
node tools/ghidra_avr.mjs samples/avr/optiboot_atmega328.hex --probe   # AVR decompiler matrix
node tests/13-avr-lab.mjs                                     # the avr-lab page controller
node tools/serve.mjs 8080 && open http://localhost:8080/avr-lab.html
node tools/verify_lecture_hall.mjs                   # lecture-hall claims + suite bundle integrity
```

## Rebuilding the sample binaries

`samples/bin/*.bin` were produced from the ported GNU as sources in
`samples/src/*.gas.s`. The originals are MASM/TASM and do not assemble anywhere
in this toolchain, so each sample was transliterated (`org` and segment
semantics preserved) and assembled with binutils on a host with `as`/`objcopy`:

```bash
# boot sector (org 0, 512 bytes, partition table at 0x1BE, 0xAA55 at 0x1FE)
as --32 -o mich.o samples/src/michelangelo.gas.s
objcopy -O binary -j .text mich.o samples/bin/michelangelo.bin

# .COM images are assembled at org 0x100 and the first 0x100 bytes stripped
as --32 -o malmsey.o samples/src/malmsey-habitat-13.gas.s
objcopy -O binary -j .text malmsey.o /tmp/malmsey.raw
tail -c +257 /tmp/malmsey.raw > samples/bin/malmsey-habitat-13.bin
```

Label addresses for the catalog annotations come from `nm` on those objects:

```bash
nm malmsey.o | awk '{print $1, $3}'
```

## The technique map's segment model

`extractTechniques()` in `js/x86dis.js` is the only part of the analysis that
guesses, and it guesses in exactly two places:

- **DS value.** Tracked forward from `mov ds, ax` / `push cs; pop ds` / immediate
  loads. A `.COM` starts with `DS = CS` (DOS guarantees it); a boot sector starts
  with DS *unknown* until the code sets it. DS deliberately survives `int` and
  `call`, because every hooking handler in this corpus preserves it.
- **AX value.** Only for `xor ax, ax` and immediate loads, used to resolve
  `mov ds, ax` and friends. Cleared on real control transfers, not on everything.

Everything else is read straight out of the instruction stream: a store's
classification follows from DS plus the displacement (below 0x400 = IVT, 0x400
to 0x4FF = BIOS data area, above = absolute). When DS is unknown, the store is
reported as unattributed rather than attributed wrongly — see the
"Stores the lab declines to attribute" card, which exists precisely so the UI
never presents a guess as a finding.

## Re-vendoring the Ghidra wasm

`wasm/ghidra/` holds the WebAssembly build of Ghidra's C++ decompiler from
`@mauricelam/ghidra-decompiler-wasm` (Apache-2.0) plus the x86 SLEIGH specs it
needs, reduced to the six languages the lab offers and ~3.6 MB total.

```bash
npm pack @mauricelam/ghidra-decompiler-wasm
tar xzf mauricelam-ghidra-decompiler-wasm-*.tgz package/dist
python3 tools/stage_ghidra_specs.py package/dist
```

The bundle is emscripten output exposing four functions the page calls through
`ccall`: `init_decompiler`, `decompile_pcode`, `detect_architecture` and
`free_string`. `js/ghidra-wasm.js` wraps them; the `.sla` file is passed as a
raw buffer rather than a filesystem path, which is why the specs ship as part of
the page instead of being resolved by a virtual FS.

Upstream sources: <https://github.com/mauricelam/ghidra-decompiler> (fork of NSA
Ghidra's `Ghidra/Features/Decompiler`, Apache-2.0). See
`wasm/ghidra/THIRD_PARTY.md`.
