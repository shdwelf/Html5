# Ghidra + CyberChef recipe card — encoding, obfuscation, encryption, disassembly

> This is a **safe-source** recipe set. Every technique below uses (a) official
> Ghidra 12.x public documentation, (b) open source plug-ins with published
> source, (c) CyberChef's published operation list, or (d) a benign binary
> already checked into the repo (the 1992 Dr Solomon's Win16 NE set under
> `docs/dr-solomon-ghidra-evidence/`, the AVR corpus under `samples/avr/`, or
> the JDK/JCreator evidence under `docs/jcreator-ghidra-evidence/`).
>
> **No recipe here is derived from `N17Pro3426/ViewerMade` or any other
> unvetted malware zoo.** See `docs/geomate-viewermade-source-check-2026-10-07.md`
> for why that account was rejected as a source.

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

This matches what `docs/dr-solomon-virus-encyclopaedia-ghidra.md` already
follows for `DrSolomon.iso`. No future Ghidra workflow in this repo should
skip this gate.

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
  -postScript EncyclopediaReport.java "$reports_dir" \
  -deleteProject
```

This is exactly the loop the Dr Solomon workflow uses over every expanded
MZ/NE member. The post-script receives the program after auto-analysis, so
Function, SymbolTable, Listing, and DecompInterface are all wired up.

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

| chip                              | `-processor` value             |
| --------------------------------- | ------------------------------ |
| 8051 / SiLabs C8051 (CP210x peer) | `8051:BE:16:default`           |
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
  -process "WVENCYCL.EXE" \
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
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;
import ghidra.program.model.mem.Memory;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import java.io.*;
import java.util.*;

public class TemplateReport extends GhidraScript {
    @Override
    public void run() throws Exception {
        String outDir = getScriptArgs()[0];
        Program p = currentProgram;
        String base = p.getName();

        Listing listing = p.getListing();
        FunctionManager fm = p.getFunctionManager();
        SymbolTable st = p.getSymbolTable();

        // --- strings ----------------------------------------------------
        int nStrings = 0;
        PrintWriter sw = new PrintWriter(new File(outDir, base + ".strings.txt"));
        for (Data d : listing.getDefinedData(true)) {
            if (d.hasStringValue()) {
                String v = (String) d.getValue();
                if (v != null && v.length() >= 4) {
                    sw.printf("%s\t%s%n", d.getAddressString(false, true), v);
                    nStrings++;
                }
            }
        }
        sw.close();

        // --- imports ----------------------------------------------------
        Set<String> impLibs = new TreeSet<>();
        Map<String, TreeSet<String>> impSyms = new TreeMap<>();
        for (Symbol s : st.getExternalSymbols()) {
            String lib = s.getParentNamespace().getName();
            impLibs.add(lib);
            impSyms.computeIfAbsent(lib, k -> new TreeSet<>()).add(s.getName());
        }

        // --- decompile a capped set -------------------------------------
        DecompInterface ifc = new DecompInterface();
        ifc.openProgram(p);
        int cap = 48, decompiled = 0;
        PrintWriter cw = new PrintWriter(new File(outDir, base + ".c"));
        for (Function f : fm.getFunctions(true)) {
            if (decompiled >= cap) break;
            DecompileResults r = ifc.decompileFunction(f, 30, monitor);
            if (r.depiledFunction() != null) {
                cw.printf("// %s%n%s%n%n", f.getEntryPoint(), r.getDecompiledFunction().getC());
                decompiled++;
            }
        }
        ifc.dispose();
        cw.close();

        // --- JSON summary -----------------------------------------------
        PrintWriter jw = new PrintWriter(new File(outDir, base + ".ghidra.json"));
        jw.printf("{\"name\":\"%s\",\"execFormat\":\"%s\",\"lang\":\"%s\"," +
                  "\"functions\":%d,\"strings\":%d,\"imports\":%d}%n",
            base, p.getExecutableFormat(), p.getLanguageID().getIdAsString(),
            fm.getFunctionCount(), nStrings, impSyms.values().stream().mapToInt(Set::size).sum());
        jw.close();
    }
}
```

Every existing report in `docs/*-ghidra-evidence/` follows this structure
(instructions + strings + imports + decompiled cap + JSON summary).

---

## 4. Recipe cards

### 4.1 ENCODING — identify and decode common XOR/ADD/NOT/SUB string obfuscation

**Where you'll see it.** A DOS/Win16/Win32 binary where the strings table
is visibly packed (high entropy in `.data`, but the code uses lots of
`XOR reg, imm8` / `ADD [mem], imm8` loops over byte buffers). The Dr
Solomon `WVENCYCL.EXE` data segment, for example, is *not* obfuscated —
its `Data15` block is 0.9 entropy and strings are in plain ASCII — so the
first check is entropy:

```bash
# Within a Ghidra post-script: get the initialized block that has the
# highest entropy; if < 4.0 it is most likely plain text/strings.
python3 -c "import math; print('entropy of all-zeros:', -sum(1/256*math.log2(1/256) for _ in range(0)))"
```

**CyberChef sanity check.** Before writing a Ghidra script, copy 64–256
bytes out of the suspicious buffer via the Ghidra listing and paste into
CyberChef:

```
From_Hex('Auto')
XOR({'option':'Hex','string':'0x??'},'Standard',false)
  ↳ brute-force single-byte XOR over the range 0x00–0xFF and scan the
    output for 'http', '.dll', 'SOFTWARE\\', 'Geocache', 'GPX', 'SOH',
    'STX' (GPX waypoint tags) and other dictionary words.
```

For multi-byte/rolling XOR:

```
From_Hex('Auto')
XOR_Bruteforce(4,'')   # key length up to 4, crib ''
```

For ADD/SUB/NOT obfuscation (common in skidded trojans and jokeware — but
we apply this only against clean samples in this repo):

```
From_Hex('Auto')
NOT() or ADD(0x??) or SUB(0x??) or ROT13(true,true,false)
```

**Ghidra recipe.** Once the key byte(s) are found in CyberChef, reproduce
the decode in a post-script and re-write the decoded bytes into a new
memory block so the rest of auto-analysis can pick up the cross-references:

```java
Memory mem = currentProgram.getMemory();
MemoryBlock enc = mem.getBlock("Data15");           // example
byte[] buf = new byte[(int) enc.getSize()];
enc.getBytes(enc.getStart(), buf);
byte key = 0x42;                                    // found via CyberChef
for (int i = 0; i < buf.length; i++) buf[i] ^= key;
MemoryBlock dec = mem.createInitializedBlock(
    "Data15_decoded", enc.getStart(), new ByteArrayInputStream(buf),
    buf.length, monitor, false);
// the listing will now show decoded strings and xrefs should follow.
```

### 4.2 ENCODING — base64 / hex / URL-encoding detection inside strings

CyberChef chain to detect whether a string blob is actually base-64:

```
Strings('Single-byte',4,'All printable chars',false,false,false)
Regular_expression('User defined','[A-Za-z0-9+/]{40,}={0,2}',true,true,false)
From_Base64('A-Za-z0-9+/=',true,false)
Entropy('Shannon',false)
```

In Ghidra, `d.hasStringValue()` already catches printable strings; for
base64 blobs stored in `byte[]` arrays, the detector pattern above is what
you port into a post-script. Useful when hunting embedded exfil URLs,
custom cache-list payloads, or serial-bridge commands.

### 4.3 OBFUSCATION — detect embedded constants for known primitives (FindCrypt)

**Tool:** `ghidra-findcrypt` (public, on GitHub; ships as a Ghidra script
that runs against the loaded program's bytes and lists known S-boxes,
IVs, permutation tables for AES, DES, RC4, ChaCha20, SHA-1/2, BLAKE2,
etc.). The Dr Solomon run produced no Error/Warning bookmarks and no
cryptographic constants of note, which is consistent with a plain NE
informational browser.

**CyberChef cross-check.** When a FindCrypt hit fires (e.g. the AES S-box
at `0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, …`), copy 256 bytes
from that address and confirm in CyberChef:

```
From_Hex('Auto')
AES_Encrypt({'option':'Hex','string':'00000000000000000000000000000000'},
            {'option':'ECB','string':'Hex','string':''})
```

Caveat: FindCrypt hits only say "constant is present"; they don't say
which cipher construction the program uses. Per the published write-up
on Oppo ozip reversing [2], you then follow xrefs from the constant to
the function that calls `aes_set_decrypt_key` / `AES_init_ctx` / the
equivalent local routine, and read its first argument — that is where
the key is loaded. (Also note the known false-positive: BLAKE2b IV bytes
overlap SHA-512 IV, per the Shielder U-Boot write-up [5].)

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

CyberChef helps to confirm the installer is actually an MSI:

```
From_Hex('Auto')
Drop_bytes(0,false)
Regular_expression('User defined','.{0}Magic.{0}Number',true,true,false)
```

(MSI files are OLE compound documents and start with the magic bytes
`D0 CF 11 E0 A1 B1 1A E1` — CyberChef's "Magic" operation identifies
most container formats.)

### 4.5 ENCRYPTION — locate a custom cipher / XOR-with-key schedule in Ghidra

If FindCrypt produces no AES/DES/RC4/ChaCha constants, the program may be
using a short repeating-key XOR or a table-less stream cipher. Recipe:

1. In the Symbol Tree, sort functions by size. The biggest non-import
   function that takes two `byte *` arguments and a length is the
   encrypt/decrypt candidate.
2. In the Decompile window, look for nested loops over the input length
   with an index taken modulo a small constant — that is the key
   schedule. The Ghidra "Learning Ghidra" tutorial on the synthetic
   `fw_decrypt` sample [4] is the textbook example: it shows a hard-coded
   password string (`passwd.3309`), a pre-whitening XOR
   (`^ 0xa7 ^ 0x8b ^ 0x2d ^ 0x05`), and a call into `ecb128Decrypt`.
3. Copy any contiguous high-entropy bytes near the function (possible
   S-box or key constant) into CyberChef and run the XOR/ADD/SUB
   brute-forcer of §4.1 against a known-plaintext crib (e.g. `<?xml`,
   `GPX`, `geocache`, `Groundspeak`, `wpt`, or the file's magic bytes
   like `.cry` header candidate `00 00 00`).
4. Once the key bytes are recovered, write a small Ghidra script to
   patch-display the decrypted region (as in §4.1), then look at what
   it contains — lat/lon floats, GPX XML, SQLite headers, whatever.

This is the exact shape of analysis that would apply to a recovered
`geomateQtGuiApp.exe` or `.cry` region image, *if and when* a copy is
obtained from a trusted source and the Geomate.jr EULA is read first.
The 2014 user's guide states "you may not … reverse engineer this
Software", which the repo honours: no loader bytes are requested,
shipped, or analyzed here.

### 4.6 DISASSEMBLY — 8-bit / 16-bit firmware disassembly (8051 / AVR)

For the SiLabs CP210x-adjacent C8051 family (the bridge chip the Geomate
update kit uses — that driver does not contain geocache caches, but it
is the transport), Ghidra ships an 8051 SLEIGH module. Recipe:

1. Import the raw flash binary with `-loader BinaryLoader -processor
   8051:BE:16:default` (note big-endian; the banked 16-bit CODE space
   maps at `0x0000`).
2. The 8051 reset vector is at `0x0000`; if `0x0000` is `02 xx yy` (LJMP)
   or `80 xx` (SJMP) or `e1 xx` (AJMP), that is the entry — see the
   Reverse Engineering Stack Exchange 8051 thread [1].
3. Note the standard pitfall: many C8051-family devices have a masked
   on-chip ROM at the top of CODE space. Calls above the firmware's
   load address are into ROM, not into your image; you cannot
   disassemble them without dumping the ROM separately (see the
   C8051F34x glitch work [3] for how that was done for a related SiLabs
   part — not performed here).

For AVR (Optiboot / Micronucleus), the repo's existing tool
`tools/ghidra_avr.mjs` disagregates to 225/225 opcodes vs `avr-objdump`
(`docs/GHIDRA_COOKBOOK.md`); for new AVR parts, use
`-processor avr8:LE:16:<part>` and feed Ghidra the `.hex` or `.bin`.

### 4.7 DISASSEMBLY — NE/PE disassembly caveats observed on clean samples

From the Dr Solomon run in this repo:

- **Win16 NE** uses segmented addressing; Ghidra prints entry points as
  `SEG:OFFSET` (e.g. `1000:260b`). Treat the segment as part of the
  address, not a selector to resolve.
- **Pascal `ShortString`** is a one-byte length followed by text.
  Ghidra's default string scanner often prints the length byte as a
  printable prefix character (looking like "/A<…"), which is why the
  report normalizes it by stripping the leading byte when it matches the
  remaining length.
- **DOS MZ** real-mode executables compiled with a single-segment model
  frequently decompile as "1 function, ~300 instructions" with zero
  imports — that's the tiny C runtime stub calling into an overlay or
  `INT 21h` directly. Don't mistake that for "Ghidra missed the real
  code"; the real code is entered via interrupt.
- **`INT 21h`** is enumerated in the disassembly listing; in NE/PE,
  imports through KERNEL/USER/GDI are enumerated as external symbols and
  are the primary way to map what the program does.

### 4.8 DISASSEMBLY — CyberChef as a pre-processor for raw hex

When a binary blob's format is unknown, CyberChef is the fastest way to
test hypotheses before it ever reaches Ghidra:

```
From_Hex('Auto')
Entropy('Shannon',false)
Frequency('Byte',false,false)
Detect_File_Type(false,'')
Strings('Single-byte',4,'All printable chars',false,false,false)
Regular_expression('User defined','[A-Za-z0-9+/]{40,}={0,2}',true,true,false)
XOR_Bruteforce(4,'')
```

A histogram that spikes at 16/32/64 equally spaced byte values is a sign
of packed BCD or fixed-point numbers (relevant for GNSS lat/lon in
32-bit fixed-point); a near-flat histogram with entropy > 7.5 is either
compressed or encrypted.

---

## 5. Cross-reference table

| Goal                                   | Ghidra                                   | CyberChef                                          |
| -------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| Identify a Windows PE                  | `-loader PeLoader` (default for `.exe`)  | `Detect_File_Type`                                 |
| Identify an MSI/InstallShield          | extract with `msiextract` first          | `Magic` checks D0 CF 11 E0 OLE signature           |
| Identify a raw 8051 flash dump         | `-loader BinaryLoader -processor 8051…`  | `Disassemble('8051','')` (if you have the opcodes) |
| Find embedded AES/DES constants        | FindCrypt/ghidra-findcrypt post-script   | `AES_Encrypt` / `DES_Encrypt` with known key       |
| Defeat single-byte XOR strings         | post-script patch into a decoded block   | `XOR_Bruteforce`                                  |
| Decode base64/hex/URL blobs            | `Data.isString()` filter + manual        | `From_Base64`, `From_Hex`, `URL_Decode`            |
| Cross-check 16-bit NE segmented calls  | Listing view, addresses are `SEG:OFF`    | —                                                  |
| Pull imports (which DLLs/APIs used)    | `SymbolTable.getExternalSymbols()`       | `Strings` → regex for API names                    |
| Capped decompile for audit             | `DecompInterface.decompileFunction` cap  | —                                                  |

## Sources

- [1] Reverse Engineering Stack Exchange, *Reverse Engineering 8051
  firmware* — 8051 reset-vector idioms (AJMP/LJMP at 0x0000, calls above
  the load address indicating masked ROM).
- [2] B. Kerler, *Reversing an Oppo ozip encryption key from encrypted
  firmware* (2019) — following `aes_set_decrypt_key` xrefs to the key
  bytes.
- [3] `debug-silicon/C8051F34x_Glitch` (GitHub) — SiLabs C8051F34x flash
  read via voltage glitch; BootROM discovery; security-lock SFR at 0xB4.
  (Described for architecture reference; no glitch hardware is used in
  this repo.)
- [4] *Learning Ghidra — Second Tutorial: Breaking an embedded firmware
  encryption scheme* — worked `fw_decrypt` example with XOR whitening,
  `ecb128Decrypt`, CRC32, and key extraction.
- [5] Shielder, *Reversing embedded device bootloader (U-Boot) p.1*
  (2022) — ghidra-findcrypt usage, BLAKE2/SHA-512 false-positive.
- Ghidra 12.1.4 `support/analyzeHeadlessREADME.html` (pinned SHA-256
  `ddac49f9…0d4db`) — CLI flag reference.
- Existing in-repo evidence: `docs/dr-solomon-virus-encyclopaedia-ghidra.md`,
  `docs/jcreator-jdk-ghidra.md`, `docs/GHIDRA_COOKBOOK.md`,
  `tools/ghidra_scripts/EncyclopediaReport.java`,
  `tools/ghidra_scripts/JdkToolchainReport.java`.
