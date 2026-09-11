# criteria

Research notes for the Ghidra lab. Everything in here is prose or generated
documentation — none of it is loaded by the app at runtime. The lab's own copy of
this material lives in `js/virus-catalog.js` and is rendered into the RESEARCH tab.

| file | what it is |
| --- | --- |
| `RESEARCH-VIRUSES.md` | Generated from `js/virus-catalog.js` by `node tools/render_research.mjs`. Do not hand-edit; edit the catalog module and re-run the script. |

## The standard applied to a claim

The lab exists to *read* old malicious code, so the notes hold themselves to
distinguishing three different kinds of statement:

1. **Observed** — the lab or a reference tool actually produced it. Every address,
   mnemonic and technique row in the lab falls here: the disassembler is
   cross-checked against `objdump` (`tools/verify_disasm.mjs`, currently 364/364
   instructions) and the decompiler output is produced by the vendored Ghidra
   wasm (`tools/verify_ghidra.mjs`, 21/21 symbols).
2. **Read from source** — reconstructed by reading the original assembler text.
   Execution narratives are this kind, and the lab labels them as such. Nothing
   here is a captured run, because the samples are never executed.
3. **Second-hand** — figures quoted from public reporting (infection counts,
   damage estimates, attribution). These are marked as estimates and are the
   weakest claims in the document.

## What is deliberately absent

- No live samples. The three binaries are reassembled from published source and
  are inert outside a 16-bit DOS/BIOS environment.
- No operational guidance. Techniques are named and located in the listing only
  so the detector side can be discussed; nothing here explains how to build
  something new.
- No certainty where the evidence is missing. When DS is unknown at a store, the
  lab reports "address unknown" rather than guessing a target.
