# Ghidra + CyberChef recipe card — encoding, obfuscation, encryption, disassembly

> This is a **safe-source** recipe set. Techniques below use (a) official
> Ghidra 12.x documentation, (b) public plug-in source and write-ups, (c) the
> CyberChef operation catalogue, and (d) non-malware in-repo examples such as
> the AVR bootloader corpus and JDK/JCreator toolchain evidence.
>
> The existing Dr Solomon workflow is cited **only as a hash-gated CI pattern**;
> that workflow analyzes historical malware samples, and those binaries are
> not used as recipe inputs, examples, or evidence here. No recipe is derived
> from `N17Pro3426/ViewerMade` or any other unvetted malware zoo. See
> `docs/geomate-viewermade-source-check-2026-10-07.md` for that account check.

The audience is someone running `analyzeHeadless` in CI (the same shape as
`.github/workflows/drsolomon-ghidra.yml`) and reaching for CyberChef as a
quick offline sanity check before writing a Ghidra postScript.

---

## 1. Provenance gate (mandatory pre-step for every new binary)

Before any binary ever reaches Ghidra in this repo, the CI job does:

1. Pin a SHA-256 of the expected artifact in the workflow file.
2. Download to `$RUNNER_TEMP` (never the workspace).
3. `sha256sum --check --strict`; abort on mismatch.
4. Run analysis inside `$RUNNER_TEMP/ghidra-projects` with `-deleteProject`.
5. Export only `*.asm`, `*.c`, `*.strings.txt`, `*.ghidra.json`; never the
   raw binary.
6. Delete the source binary before uploading artifacts (see the
   `Remove source binaries before artifact upload` step in the Dr Solomon
   workflow).

The hash-gated, temporary-directory, report-only structure is modelled on
`docs/dr-solomon-virus-encyclopaedia-ghidra.md`; that workflow's historical
virus inputs are not used as recipe sources or copied into this cookbook. For
new benign analyses, replace its input URL/hash with a clean, independently
licensed sample and keep the same containment/cleanup gates.

---

## 2. `analyzeHeadless` invocation patterns (Ghidra 12.1.4)

Source: `support/analyzeHeadlessREADME.html` from the public 12.1.4 release
(pinned in the Dr Solomon workflow:
`ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`).

### 2a. Import a PE/.exe and run a post-script

```bash
GHIDRA="$RUNNER_TEMP/ghidra_12.1.4_PUBLIC"
"$GHIDRA/support/analyzeHeadless" \
  "$RUNNER_TEMP/ghidra-projects" "PROJ_$(basename "$f")" \
  -import "$f" \
  -analysisTimeoutPerFile 300 \
  -scriptPath "$GITHUB_WORKSPACE/tools/ghidra_scripts" \
  -postScript JdkToolchainReport.java "$reports_dir" \
  -deleteProject
```

This follows the existing repository's `analyzeHeadless` loop shape, while
using the JDK/JCreator report on a non-malware sample. A `-postScript` runs on
the imported program after auto-analysis, so Function, SymbolTable, Listing,
and DecompInterface are available.

### 2b. Import a raw binary blob with a forced language/loader

Use this for firmware dumps, ROM extracts, and anything without a header
that the PE/NE/ELF/Mach-O loaders recognize (e.g. a SiLabs C8051 flash dump
if a Geomate.jr region is ever recovered):

```bash
"$GHIDRA/support/analyzeHeadless" \
  "$RUNNER_TEMP/ghidra-projects" "proj_raw" \
  -import "$f" \
  -loader BinaryLoader \
  -loader-baseAddr 0x0000 \
  -loader-blockName ROM \
  -processor 8051:BE:16:default \
  -postScript RawReport.java "$reports_dir" \
  -deleteProject
```

Processor strings Ghidra ships for the small chips that are relevant to
this repo's ongoing threads:

| chip / image                         | `-processor` value             |
| ------------------------------------ | ------------------------------ |
| 8051 / SiLabs C8051 raw code image   | `8051:BE:16:default`           |
| AVR (Optiboot/Micronucleus)       | `avr8:LE:16:atmega328p`        |
| ARM Cortex-M (bare-metal)         | `ARM:LE:32:Cortex`             |
| MIPS (GL-iNet MT300N-V2, etc.)    | `MIPS:BE:32:default`           |
| x86 16-bit real mode (DOS MZ)     | `x86:LE:16:Real Mode`          |
| x86 16-bit protected (Win16 NE)   | `x86:LE:16:Protected Mode`     |
| x86 32-bit PE                     | `x86:LE:32:default`            |
| x86 64-bit PE                     | `x86:LE:64:default`            |

### 2c. Re-run a script on an already-imported program without re-analyzing

```bash
"$GHIDRA/support/analyzeHeadless" \
  "$RUNNER_TEMP/ghidra-projects" "existing_proj" \
  -process "JCreator.exe" \
  -noanalysis \
  -scriptPath tools/ghidra_scripts \
  -postScript MySecondPass.java "$reports_dir"
```

Useful when a new post-script is added and you don't want to re-run the
full auto-analysis (which for large PEs can take many minutes).

---

## 3. PostScript skeleton (`tools/ghidra_scripts/TemplateReport.java`)

This is the shape every new headless report script should follow. It is
derived from the already-checked-in `EncyclopediaReport.java` and
`JdkToolchainReport.java` (but written here as a recipe, not a drop-in
replacement).

```java
// @category Html5
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import com.google.gson.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;

public class TemplateReport extends GhidraScript {
    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 1) throw new IllegalArgumentException("usage: TemplateReport.java <out-dir>");
        File outDir = new File(args[0]);
        if (!outDir.isDirectory() && !outDir.mkdirs()) throw new IOException("cannot create " + outDir);
        Program p = currentProgram;
        String base = p.getName();
        Listing listing = p.getListing();
        FunctionManager fm = p.getFunctionManager();
        SymbolTable symbols = p.getSymbolTable();

        int nStrings = 0;
        try (PrintWriter sw = new PrintWriter(new OutputStreamWriter(
                new FileOutputStream(new File(outDir, base + ".strings.txt")), StandardCharsets.UTF_8))) {
            DataIterator data = listing.getDefinedData(true);
            while (data.hasNext() && !monitor.isCancelled()) {
                Data d = data.next();
                if (!d.hasStringValue() || d.getValue() == null) continue;
                String value = String.valueOf(d.getValue());
                if (value.length() >= 4) {
                    sw.printf("%s\t%s%n", d.getAddress().toString(), value);
                    nStrings++;
                }
            }
        }

        Set<String> libraries = new TreeSet<>();
        Map<String, TreeSet<String>> imports = new TreeMap<>();
        SymbolIterator external = symbols.getExternalSymbols();
        while (external.hasNext() && !monitor.isCancelled()) {
            Symbol symbol = external.next();
            Namespace parent = symbol.getParentNamespace();
            String library = parent == null ? "" : parent.getName();
            libraries.add(library);
            imports.computeIfAbsent(library, unused -> new TreeSet<>()).add(symbol.getName());
        }

        int decompiled = 0;
        final int cap = 48;
        DecompInterface decompiler = new DecompInterface();
        decompiler.openProgram(p);
        try (PrintWriter cw = new PrintWriter(new OutputStreamWriter(
                new FileOutputStream(new File(outDir, base + ".c")), StandardCharsets.UTF_8))) {
            FunctionIterator functions = fm.getFunctions(true);
            while (functions.hasNext() && decompiled < cap && !monitor.isCancelled()) {
                Function function = functions.next();
                DecompileResults result = decompiler.decompileFunction(function, 30, monitor);
                if (result != null && result.getDecompiledFunction() != null) {
                    cw.printf("// %s%n%s%n%n", function.getEntryPoint(), result.getDecompiledFunction().getC());
                    decompiled++;
                }
            }
        } finally {
            decompiler.dispose();
        }

        JsonObject summary = new JsonObject();
        summary.addProperty("name", base);
        summary.addProperty("execFormat", p.getExecutableFormat());
        summary.addProperty("language", p.getLanguageID().getIdAsString());
        summary.addProperty("functions", fm.getFunctionCount());
        summary.addProperty("strings", nStrings);
        summary.addProperty("libraries", libraries.size());
        summary.addProperty("imports", imports.values().stream().mapToInt(Set::size).sum());
        try (Writer writer = new OutputStreamWriter(
                new FileOutputStream(new File(outDir, base + ".ghidra.json")), StandardCharsets.UTF_8)) {
            new GsonBuilder().setPrettyPrinting().create().toJson(summary, writer);
            writer.write("\n");
        }
    }
}
```

Every existing report in `docs/*-ghidra-evidence/` follows this structure
(instructions + strings + imports + decompiled cap + JSON summary).

---

## 4. Recipe cards

### 4.1 ENCODING — identify and decode common XOR/ADD/NOT/SUB string obfuscation

A common pattern is a byte loop with an immediate XOR/add/subtract and an
index that wraps at a small key length. First distinguish code from data and
measure entropy on the candidate bytes; high entropy alone does not prove
obfuscation (it can also be compression, encrypted data, or a short sample).
This card uses a **synthetic byte string**, so the recipe itself is
reproducible without analyzing a malware sample.

**CyberChef worked check.** The ASCII bytes for `HELLO` XORed with `0x42` are
`0a070e0e0d`. In CyberChef, add these operations in order:

1. **From Hex** — delimiter `Auto`.
2. **XOR Brute Force** — `Key length: 1`, `Sample length: 5`, `Sample offset: 0`,
   `Scheme: Standard`, `Null preserving: false`, `Print key: true`,
   `Output as hex: false`, `Crib: hello`.

The output includes key `42` and plaintext `HELLO`. CyberChef currently caps
this operation at a two-byte key because of browser-performance limits; it is
not a four-byte/rolling-key solver. For a two-byte key, set `Key length: 2`
and supply a longer crib. For longer schedules, script the loop over a
small sample or use a Ghidra postScript; do not assume the brute-force
operation covers it.

For a real, benign binary, copy a bounded candidate byte range from Ghidra's
Listing into **From Hex**, then use the smallest justified transform and a
known-plaintext crib. Avoid uploading binary contents to an external service.
For ADD/SUB/NOT, use CyberChef's **Add**, **Subtract**, or **NOT** operations
with a tested candidate constant. **ROT13** is for alphabetic text; it is not
an arbitrary-byte transform.

**Ghidra recipe.** After confirming a key on the bounded excerpt, repeat the
operation against a copy of the full candidate buffer and export the decoded
bytes to a separate file for a second static import. Do not overwrite the
source program's memory or execute the output:

```java
MemoryBlock block = currentProgram.getMemory().getBlock("candidate_data");
if (block == null || !block.isInitialized()) throw new Exception("no candidate block");
if (block.getSize() > 1_000_000) throw new Exception("candidate exceeds review cap");
byte[] decoded = new byte[(int) block.getSize()];
int got = currentProgram.getMemory().getBytes(block.getStart(), decoded, 0, decoded.length);
if (got != decoded.length) throw new Exception("short memory read");
byte key = (byte) 0x42; // only after independently confirming the key
for (int i = 0; i < decoded.length; i++) decoded[i] ^= key;
java.nio.file.Files.write(java.nio.file.Path.of(getScriptArgs()[0], "decoded.bin"), decoded);
```

### 4.2 ENCODING — base64 / hex / URL-encoding detection inside strings

In CyberChef, use **Strings** (single-byte encoding, minimum length 4) to
make candidate text visible, then **Regular expression** with
`[A-Za-z0-9+/]{40,}={0,2}` to locate likely Base64 runs. Send a selected run
to **From Base64** and inspect the result with **Strings**, **Magic**, or
**Entropy**. Treat a regex hit as a candidate, not proof: Base64 text can be
ordinary identifiers, and random-looking decoded bytes can still be wrong.

For hex text, use **Regular expression** with
`(?:[0-9A-Fa-f]{2}[\s,:-]*){8,}` and pass a selected run through **From Hex**.
For percent-encoded text, search for `(?:%[0-9A-Fa-f]{2}){2,}` and use **URL
Decode**. Inspect decoded output with **Strings** or **Magic**, and distinguish
hex data from ordinary identifiers or serial fields before interpreting it.

In Ghidra, `Data.hasStringValue()` catches printable strings. For Base64,
hex, or percent-encoded blobs stored in byte arrays, search the loaded data for
the relevant alphabet/escape pattern, then decode only a copied, bounded
candidate. This can expose embedded URLs, serial-protocol strings, or
file-format signatures without relying on any malware sample.

### 4.3 OBFUSCATION — detect embedded constants for known primitives (FindCrypt)

**Tool:** [TorgoTorgo/ghidra-findcrypt](https://github.com/TorgoTorgo/ghidra-findcrypt)
is an open-source Ghidra auto-analysis extension that labels known
cryptographic constants. Its README describes matches as hints for analysts,
not proof that a particular call site uses that algorithm.

**Safe cross-check.** Select a hit in Ghidra and view/copy its bytes as hex.
For an AES S-box candidate, compare the bytes with the published AES
substitution table (FIPS 197); CyberChef's **From Hex** and **Find** operations
can help inspect a copied range. Do not run AES Encrypt on the S-box and treat
the result as validation: an S-box match alone does not establish a cipher
implementation or key.

For a separate known-answer test, CyberChef's **AES Encrypt** operation takes
an explicit key, IV, mode, input representation, output representation,
additional authenticated data, and IV-output option. For the FIPS 197 AES-128
block vector, use key `000102030405060708090a0b0c0d0e0f`, plaintext
`00112233445566778899aabbccddeeff`, mode `ECB/NoPadding`, input/output
`Hex`, and compare with `69c4e0d86a7b0430d8cdb78070b4c55a`. This verifies a
known-answer operation; it does not prove a binary uses AES or reveal its key.

The inspected CyberChef operation catalog also provides **AES Encrypt/Decrypt**,
**DES Encrypt/Decrypt**, **Triple DES Encrypt/Decrypt**, **RC4**, **RC4 Drop**,
**ChaCha**, **Salsa20**, **Blowfish Encrypt/Decrypt**, **Twofish Encrypt/Decrypt**,
**TEA Encrypt/Decrypt**, and **XTEA Encrypt/Decrypt**. Use these to reproduce a
published known-answer vector with the correct key/nonce/mode/padding. Do not
label deprecated algorithms such as DES or RC4 secure, and do not treat a
successful toy test as evidence that a target binary uses that construction.
Per the published Oppo ozip analysis [2], binary RE still follows references
from a constant to `aes_set_decrypt_key` / `AES_init_ctx` and traces the key
argument; a constant search by itself cannot find the key. The Shielder
write-up [5] also shows a false positive: BLAKE2b IV bytes overlap SHA-512 IV.

### 4.4 OBFUSCATION — InstallShield / MSI unpacking before PE import

The Geomate.jr loader ships as an InstallShield `.msi` (per the 2014
Brand 44 user's guide). **Do not run the installer.** Static-only
unpack:

- `lessmsi x file.msi out/` (open-source, cross-platform) or
- `msiextract` from `msitools` (Linux) extracts the `File` table
  without executing any custom action.
- After extraction, import the PE payload (e.g. `geomateQtGuiApp.exe`)
  with `analyzeHeadless` using `-loader PeLoader` (Ghidra picks it by
  default for `.exe`/`.dll`).

CyberChef's **Magic** operation can identify the OLE Compound File header
(`D0 CF 11 E0 A1 B1 1A E1`) used by traditional MSI containers. That header
is only a format clue: do not execute the installer or any custom action.


### 4.5 ENCRYPTION — locate a custom cipher / XOR-with-key schedule in Ghidra

If FindCrypt produces no known-cipher constants, consider simple XOR/add/sub
loops as hypotheses, not as conclusions. Use these static-analysis steps only
on a clean, authorized sample:

1. Identify candidate functions through call sites, references to byte
   buffers, and repeated operations; function size and pointer-like arguments
   are weak heuristics, not reliable signatures.
2. In the Decompile window, inspect loop bounds, key/index reuse, and the
   output's data flow. The educational Ghidra tutorial [4] demonstrates a
   `fw_decrypt` example with a pre-whitening XOR schedule and an
   `ecb128Decrypt` call; it is a worked pattern, not a universal signature.
3. Use CyberChef's **XOR Brute Force** only for one- or two-byte candidate
   keys and only with a justified crib. For longer schedules, create a small
   local script over a bounded sample. Do not guess a target file's magic
   bytes; obtain a valid plaintext example or format specification first.
4. Once a transform is established, export the decoded bytes to a separate
   file and re-import that file statically for format recognition. Preserve
   the original input and record the transform, offsets, and hash of each
   output.

This is the exact shape of analysis that would apply to a recovered
`geomateQtGuiApp.exe` or `.cry` region image, *if and when* a copy is
obtained from a trusted source and the Geomate.jr EULA is read first.
The 2014 user's guide states "you may not … reverse engineer this
Software", which the repo honours: no loader bytes are requested,
shipped, or analyzed here.

### 4.6 DISASSEMBLY — 8-bit / 16-bit firmware disassembly (8051 / AVR)

If a clean, licensed 8051 raw firmware image is available, Ghidra 12.1.4
ships a matching SLEIGH language. This is a generic architecture recipe; it
is **not** a claim that the CP210x Windows driver or a Geomate.jr cable
contains an accessible C8051 flash dump.

1. Import the raw image with `-loader BinaryLoader -processor
   8051:BE:16:default` (verified in Ghidra 12.1.4's `8051.ldefs`; big-endian,
   16-bit address space). Choose the base address from the device/format metadata; `0x0000` is only appropriate for an image mapped at the reset vector.
2. The 8051 reset vector is at `0x0000`; common entry opcodes include `02 xx yy`
   (LJMP) and `80 xx` (SJMP). Verify the target bytes and references rather
   than assuming every image begins with executable code; see [1].
3. Some C8051-family parts include masked on-chip ROM not present in a flash
   dump. Calls outside the loaded image may be unresolved references, not
   code that Ghidra missed. The C8051F34x glitch work [3] describes a related
   research technique; no glitch hardware or device is used here.

For AVR (Optiboot / Micronucleus), the repo's existing tool
`tools/ghidra_avr.mjs` disaggregates to 225/225 opcodes vs `avr-objdump`
(`docs/GHIDRA_COOKBOOK.md`). Ghidra 12.1.4's AVR language definition lists
`avr8:LE:16:default`, `avr8:LE:16:extended`, `avr8:LE:16:atmega256`, and
`avr8:LE:24:xmega`; use an ID from that shipped list rather than assuming a
part-specific variant exists.

### 4.7 DISASSEMBLY — format-aware review checklist

Use the loader's metadata as a starting point, not as a complete explanation
of the program:

- For an **MZ** input, compare Ghidra's entry with the header's `CS:IP`, check
  relocation/segment information, and look for overlays before concluding
  that a small disassembly is the whole program.
- For a **Win16 NE** input, keep segment:offset identity when documenting code
  addresses; do not collapse a segmented entry to an offset alone.
- For a **PE** input, record image base, entry point, sections, and imported
  symbols. A static import table is a clue, not a complete API inventory:
  dynamically resolved functions and packed/importless binaries need separate
  handling. The Microsoft [PE/COFF specification](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
  defines the header/section/import structures Ghidra is presenting.
- When a header value and Ghidra's language/loader choice disagree, stop and
  correct the import configuration before interpreting decompiled functions.

These are format-validation steps, not claims derived from a checked-in
malware sample.

### 4.8 DISASSEMBLY — CyberChef as a pre-processor for raw hex

Before importing an unknown, authorized binary, use CyberChef's **From Hex**
(for a copied hex excerpt), **Magic**, **Entropy**, **Frequency**, and **Strings**
operations to gather clues. Add **Regular expression** for likely Base64 text,
or **XOR Brute Force** with a short, justified crib. Keep the byte excerpt
bounded and local. The inspected CyberChef catalog also has **Disassemble ARM**
and **Disassemble x86**; it does not provide an 8051 disassembler.

Entropy and byte-frequency plots are heuristics only. High entropy is
consistent with compression, encryption, random data, or a small unrepresentative
sample; it is not a verdict. A histogram can reveal repeated constants or
text-like distributions, but does not identify a number encoding on its own.

---

## 5. Cross-reference table

| Goal | Ghidra | CyberChef |
| --- | --- | --- |
| Identify a Windows PE | `-loader PeLoader` (normally auto-selected for PE) | **Magic** |
| Identify an MSI container | Extract statically with `msiextract`/`lessmsi` first | **Magic** recognizes the OLE header; no execution |
| Load raw 8051 bytes | `-loader BinaryLoader -processor 8051:BE:16:default` | No 8051 disassembler; **From Hex**, **Strings**, and **XOR Brute Force** are pre-screening aids |
| Locate candidate crypto constants | ghidra-findcrypt analysis labels + xrefs | **From Hex** for byte inspection; a known-answer **AES Encrypt/Decrypt** test is separate and does not prove binary use |
| Test a one-byte XOR hypothesis | Bounded postScript or separate decoded-file import | **XOR Brute Force**, key length 1, known crib |
| Decode Base64/hex/URL text | Inspect defined strings and code/data references | **From Base64**, **From Hex**, **URL Decode** |
| Review Win16 NE addresses | Inspect the loader's segment map; preserve segment:offset | No NE disassembler |
| Pull imports/API references | `SymbolTable.getExternalSymbols()` + `ReferenceManager` | **Strings**/regex can hint at dynamic API names |
| Capped decompile for audit | `DecompInterface.decompileFunction` with timeout/cap | — |

## In-app recipe packs

The custom offline kitchen at `public/apps/cyberchef/index.html` now exposes
recipe packs for Base64/Base32/URL/Unicode/hex round-trips, byte-exact file
Base64, a toy ASCII XOR/crib demonstration, AES-CBC/AES-GCM round-trips using
an explicitly non-secret demo password, Camellia/ChaCha20/RC4 toy round-trips,
and static MZ header triage before a Ghidra import. These packs reuse existing
operations; they do not add a Ghidra runtime or disassembler to the browser.
The MZ pack only inspects a supplied header. Actual disassembly still uses the
headless workflow in `docs/ghidra-headless-benign-sample-methodology.md`.

## Sources

- [1] Reverse Engineering Stack Exchange, [*Reverse Engineering 8051 firmware*](https://reverseengineering.stackexchange.com/questions/17601/reverse-engineering-8051-firmware) (2018) — reset entry at `0x0000` and out-of-image calls as a possible indication of missing ROM; a forum answer, so verify against the actual device.
- [2] B. Kerler, [*Reversing an Oppo ozip encryption key from encrypted firmware*](https://bkerler.github.io/reversing/2019/04/24/the-game-begins/) (2019) — following `aes_set_decrypt_key` cross-references to the supplied key.
- [3] [debug-silicon/C8051F34x_Glitch](https://github.com/debug-silicon/C8051F34x_Glitch) — related SiLabs flash/BootROM security research; architecture reference only, no glitch technique is used in this repo.
- [4] [Learning Ghidra — Second Tutorial: Breaking an embedded firmware encryption scheme](https://learning-ghidra.readthedocs.io/en/latest/tutorials/second-tutorial/second-tutorial/) — educational `fw_decrypt` example with XOR whitening and `ecb128Decrypt`.
- [5] Shielder, [*Reversing embedded device bootloader (U-Boot) — p.1*](https://www.shielder.com/blog/2022/03/reversing-embedded-device-bootloader-u-boot-p.1/) (2022) — ghidra-findcrypt use and the BLAKE2/SHA-512 IV false-positive.
- [Ghidra 12.1.4 Headless Analyzer README](https://ghidradocs.com/12.1.4_PUBLIC/support/analyzeHeadlessREADME.html) — release-pinned CLI documentation; the downloaded archive in the workflow is SHA-256 checked.
- [Ghidra 12.1.4 8051 language definition](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/Ghidra/Processors/8051/data/languages/8051.ldefs) and [AVR8 language definitions](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/Ghidra/Processors/Atmel/data/languages/avr8.ldefs) — processor IDs listed above.
- CyberChef source, pinned at commit [`609951ac13967da6d497e0600c922f56bfd0b7af`](https://github.com/gchq/CyberChef/tree/609951ac13967da6d497e0600c922f56bfd0b7af/src/core/operations): [XOR Brute Force](https://github.com/gchq/CyberChef/blob/609951ac13967da6d497e0600c922f56bfd0b7af/src/core/operations/XORBruteForce.mjs), [AES Encrypt](https://github.com/gchq/CyberChef/blob/609951ac13967da6d497e0600c922f56bfd0b7af/src/core/operations/AESEncrypt.mjs), [From Hex](https://github.com/gchq/CyberChef/blob/609951ac13967da6d497e0600c922f56bfd0b7af/src/core/operations/FromHex.mjs), and [Strings](https://github.com/gchq/CyberChef/blob/609951ac13967da6d497e0600c922f56bfd0b7af/src/core/operations/Strings.mjs). The checked source caps XOR brute-force key length at 2 bytes.
- NIST, [FIPS 197 — Advanced Encryption Standard](https://csrc.nist.gov/pubs/fips/197/final) — AES-128 known-answer block used above.
- Microsoft, [PE format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format) — header, section, and import-table reference.
- In-repo automation/report references only: `docs/dr-solomon-virus-encyclopaedia-ghidra.md` (CI pattern for a historical malware corpus, **not a recipe sample**), `docs/jcreator-jdk-ghidra.md`, `docs/GHIDRA_COOKBOOK.md`, `tools/ghidra_scripts/EncyclopediaReport.java`, and `tools/ghidra_scripts/JdkToolchainReport.java`.
