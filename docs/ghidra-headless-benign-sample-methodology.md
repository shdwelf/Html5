# Headless Ghidra methodology for benign samples

This is the repository-wide procedure for a **benign, licensed binary** that
needs repeatable Ghidra static analysis in CI. It reuses the hash gate,
temporary work directory, per-file timeout, evidence-only output, and cleanup
pattern from `.github/workflows/drsolomon-ghidra.yml`, but **does not reuse that
workflow's historical virus inputs**. The Ghidra/CyberChef recipe cards live in
`docs/ghidra-cyberchef-recipes.md`.

## Hard gates before Ghidra sees a file

1. **Document why this exact file is in scope.** State its origin, version,
   path, license/permission, intended analysis question, and whether the sample
   is non-malware. A public URL by itself is not proof of a benign purpose or
   a license to redistribute.
2. **Pin its SHA-256 before analysis.** Put the expected digest in the workflow
   or a reviewed manifest. Download to `$RUNNER_TEMP`, run
   `sha256sum --check --strict`, and abort on mismatch. Do not check a
   downloaded executable into the repository just to make CI convenient.
3. **Keep analysis static and isolated.** `analyzeHeadless` imports and
   analyzes bytes; do not run the program, invoke its installer, emulate it, or
   let a postScript launch it. Do not attach hardware or flash a device.
4. **Use an approved license/purpose.** If the EULA or license forbids
   reverse-engineering, stop before acquiring or importing the file. In
   particular, the Geomate.jr 2014 guide contains a reverse-engineering
   prohibition; no Geomate.jr loader or firmware is covered by this generic
   procedure.
5. **Export reports, not inputs.** Keep project databases, source binaries,
   installers, extracted executables, and scratch files under
   `$RUNNER_TEMP`; commit only reviewed text/JSON evidence that is safe and
   permitted to publish.

## A checked-in benign example and provenance

The repo has two open-source AVR bootloader images that can demonstrate a
hash-gated workflow without selecting a malware sample:

| File | Public origin | Pinned SHA-256 | License / notes |
| --- | --- | --- | --- |
| `samples/avr/optiboot_atmega328.hex` | Optiboot 8.0, commit `f3308fc40dc386a5f655f129ff12c68e7ceb89d6` | `0d9097a14032b1a882ac660add5d4092ad43e897903309a52d94f9949edf8877` | GPL-2.0-or-later; unmodified Intel HEX |
| `samples/avr/micronucleus_m328p_extclock.hex` | Micronucleus 2.6, commit `882e7b4af38cb2795353e4e99336616963c6cd12` | `e022981e8387c542a267ca413ecae8b08d8cb0fa11370e49df675038302f4641` | GPL-2.0-or-later; unmodified Intel HEX |

Full download paths, hashes, and source/license detail are in
`samples/avr/PROVENANCE.md`. These are bootloader programs containing flash-
programming instructions; this procedure examines them as data only and never
runs them or sends them to hardware. The published upstream listing for
Optiboot provides a useful independent check of instruction decoding.

## Pin Ghidra itself

Use an official release, not an unreviewed mirror. The existing template pins
Ghidra 12.1.4 (build `20260921`) and checks the archive digest before
extracting it:

- Release tag: [Ghidra_12.1.4_build](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- Archive: `ghidra_12.1.4_PUBLIC_20260921.zip`
- SHA-256: `ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`
- Java: Temurin 21 in CI
- CLI reference: [Ghidra 12.1.4 Headless Analyzer README](https://ghidradocs.com/12.1.4_PUBLIC/support/analyzeHeadlessREADME.html)

The release version/date/hash are explicit so an upstream asset replacement
fails closed. Pin the same values in the workflow rather than resolving
"latest" during a run.

## Reproducible headless invocation

For the checked-in Optiboot Intel HEX file, Ghidra's AVR language ID is
`avr8:LE:16:default` (the 12.1.4 Atmel language definition lists this ID).
A typical CI invocation, after validating the sample and installing Ghidra,
looks like:

```bash
set -euo pipefail
root="$RUNNER_TEMP/ghidra-benign"
projects="$root/projects"
reports="$root/reports"
mkdir -p "$projects" "$reports"

input="$GITHUB_WORKSPACE/samples/avr/optiboot_atmega328.hex"
expected='0d9097a14032b1a882ac660add5d4092ad43e897903309a52d94f9949edf8877'
printf '%s  %s\n' "$expected" "$input" | sha256sum --check --strict

headless="$RUNNER_TEMP/ghidra_12.1.4_PUBLIC/support/analyzeHeadless"
timeout 10m "$headless" "$projects" "OPTIBOOT_ATMEGA328" \
  -import "$input" \
  -processor avr8:LE:16:default \
  -analysisTimeoutPerFile 300 \
  -max-cpu 2 \
  -scriptPath "$GITHUB_WORKSPACE/tools/ghidra_scripts" \
  -postScript GenericProgramReport.java "$reports" \
  -deleteProject
```

`tools/ghidra_scripts/GenericProgramReport.java` writes bounded `.asm`,
`.strings.txt`, `.c`, and `.ghidra.json` reports from Ghidra's program
database. A postScript runs after auto-analysis; `-noanalysis` should only be
added for a deliberate second pass over an existing project.

For another input class, select a loader/language from verified metadata:

| Input | Loader / language approach |
| --- | --- |
| PE `.exe` / `.dll` | Let Ghidra choose PE, or use `-loader PeLoader`; record image base and imports. |
| DOS MZ / Win16 NE | Use the matching MZ/NE loader; preserve segment:offset addresses. |
| Raw firmware/ROM | `-loader BinaryLoader -loader-baseAddr <address> -processor <verified-language-id>`; establish the address map from device documentation first. |
| Intel HEX | Use the Intel HEX loader and an explicit processor ID where format detection does not supply one. |

Do not guess the processor ID: verify it against the pinned Ghidra release's
`*.ldefs` file. For example, `8051:BE:16:default` appears in the 12.1.4 8051
language definition, while AVR variants have their own listed IDs.

## Reports and review

A useful report contains only findings that can be re-derived from the
program database:

- program name, Ghidra version, executable format, language/compiler, image
  base, and SHA-256;
- memory blocks and their permissions; record entropy as a triage statistic,
  not a malware/packing verdict;
- entry points, imports, defined strings, and references to selected data;
- disassembly and a **capped** number of decompilations, each with a timeout;
- warnings when code/data boundaries, loader choice, or raw image base remain
  uncertain.

Escape strings and JSON correctly; do not rely on hand-built JSON string
concatenation. Record an analysis failure as a failure—do not silently report
an empty listing as "no behavior". The working examples are
`tools/ghidra_scripts/EncyclopediaReport.java` (report mechanics only; its
associated corpus is historical malware) and
`tools/ghidra_scripts/JdkToolchainReport.java` (JCreator/JDK question-specific
probes).

## Cleanup and artifact rules

- Give every program its own project name, apply a finite timeout, and pass
  `-deleteProject` so headless project databases do not accumulate.
- In an `if: always()` step, remove downloaded archives, extracted executables,
  installers, and temporary Ghidra projects before artifact upload.
- Upload only reports/logs with a short retention window. A report may itself
  contain sensitive strings; review it before committing or uploading.
- Do not commit generated reports automatically unless the repository's
  evidence policy calls for them and the content/license review passes.

## Verification status in this workspace

Ghidra and a JDK are not installed in the current sandbox, so
`GenericProgramReport.java` has not been compiled here and no new Ghidra run or
analysis output is claimed. The sample hashes, command-line flags, report API
shape, processor IDs, and cleanup pattern are documented from checked-in
provenance and the pinned public Ghidra release. Run the command on a
network-connected CI runner before treating the generated report as evidence.

## Geomate.jr boundary

This is **not** authorization to reverse engineer the Geomate.jr loader or
firmware. The Brand 44 user's guide records a clause against reverse
engineering. Keep the Geomate work at the existing public-source research and
local GPX-import level unless the user has read that clause and explicitly
instructs otherwise. No Ghidra import or analysis of Geomate.jr bytes has been
performed.

## References

- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build) and [Headless Analyzer README](https://ghidradocs.com/12.1.4_PUBLIC/support/analyzeHeadlessREADME.html).
- [Optiboot 8.0 source release](https://github.com/Optiboot/optiboot/tree/f3308fc40dc386a5f655f129ff12c68e7ceb89d6) and [Micronucleus 2.6 source release](https://github.com/micronucleus/micronucleus/tree/882e7b4af38cb2795353e4e99336616963c6cd12); license/hash ledger: `samples/avr/PROVENANCE.md`.
- Ghidra's 12.1.4 language definitions: [8051](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/Ghidra/Processors/8051/data/languages/8051.ldefs) and [AVR8](https://github.com/NationalSecurityAgency/ghidra/blob/Ghidra_12.1.4_build/Ghidra/Processors/Atmel/data/languages/avr8.ldefs).
- Existing automation examples: `.github/workflows/drsolomon-ghidra.yml` (CI mechanics only; malware input) and `.github/workflows/jcreator-ghidra.yml` (native IDE/JDK analysis).
