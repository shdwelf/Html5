# tools

Everything in this directory is a development/verification helper. None of it is
needed to serve the app — `ghidra-lab.html` is plain static HTML + ES modules.

| tool | what it does |
| --- | --- |
| `serve.mjs` | Static server with `application/wasm` + COOP/COEP headers. `node tools/serve.mjs 8080` → <http://localhost:8080/ghidra-lab.html> |
| `verify_disasm.mjs` | Cross-checks `js/x86dis.js` against `objdump -M i8086` on every sample. Currently **364/364 instructions agree**. |
| `verify_ghidra.mjs` | Headlessly decompiles every code symbol in the catalog through the vendored Ghidra wasm, using the same loader the page uses. |
| `check-dom-ids.mjs` | Contract test: every `$("id")` in `js/viruslab.js` must exist in `ghidra-lab.html`. |
| `stage_ghidra_specs.py` | Re-vendors the Ghidra decompiler wasm + the x86 SLEIGH specs into `wasm/ghidra`. |
| `smoke_pipeline.mjs` | Runs the whole DOM-free analysis path over every sample and prints what the panels would show. Catches crashes and empty panels without a browser. |
| `render_research.mjs` | Renders `js/virus-catalog.js` to `criteria/RESEARCH-VIRUSES.md`. |
| `build_entropy_wasm.py` | Pre-existing: hand-assembles the small keyspace projector wasm. |

## Verification workflow

```bash
node tools/check-dom-ids.mjs                       # markup/controller contract
node tools/verify_disasm.mjs                       # disassembler vs objdump
node tools/serve.mjs 8099 &                        # wasm + specs over HTTP
node tools/verify_ghidra.mjs 8099                  # decompile every symbol
node tools/smoke_pipeline.mjs                      # analysis path over every sample
node tools/render_research.mjs                     # regenerate criteria/RESEARCH-VIRUSES.md
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
