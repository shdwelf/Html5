# John the Ripper, Ghidra, OpenJDK, and Diablo research notes

*2026-09-29 · source-led, authorized research only*

## GitHub starting points

- [Openwall John the Ripper](https://github.com/openwall/john) — the
  maintained Jumbo repository. John is an offline password-auditing tool;
  use it only against hashes and systems for which the investigator has
  explicit authorization.
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra) — NSA's software
  reverse-engineering framework, including disassembly, decompilation, and
  scripting support.
- [OpenJDK](https://github.com/openjdk/jdk) — the reference open-source JDK
  development repository. “OpenJVM” is commonly used informally for the JVM
  implementations in the OpenJDK ecosystem; verify which project and build
  are meant before comparing internals.

Pin a commit or release, record the JDK version and host architecture, and
keep downloaded binaries separate from the source checkout. GitHub repository
names and forks are not proof of provenance: check the owner, tags, signatures,
license, and checksum.

## Safe John workflow

John can support a password-policy audit when the organization owns the
password database and has approved the test. A safe report records the hash
format, test scope, wordlist provenance, duration, and remediation; it does
not publish recovered passwords or attack recipes. Use synthetic fixtures for
CI and demonstrations. Never process credential dumps, third-party hashes, or
online login endpoints.

For this encyclopedia, the useful static-analysis angle is to study John's
format/plugin architecture, test vectors, and CPU-feature dispatch—not to
recover a real secret. Compare source changes between pinned tags, run the
project's own tests, and document performance only on non-sensitive fixtures.

## Ghidra with OpenJDK

Ghidra requires a supported Java runtime. Use the JDK version documented by
the specific Ghidra release, rather than assuming the newest OpenJDK is
compatible. A reproducible setup should capture:

```text
java -version
GHIDRA_INSTALL_DIR/support/analyzeHeadless <project> <name> \
  -import sample.exe -analysisTimeoutPerFile 300
```

Run headless analysis on a copy, preferably in an offline VM. For DOS or PE
samples, begin with file identification, hashes, headers, imports, strings,
and section boundaries. Treat decompiler output as a hypothesis and confirm
important conclusions against bytes, control-flow references, and test
fixtures. The repository's existing `docs/GHIDRA_COOKBOOK.md` and
`abbottabad-ghidra/` evidence workflow provide local examples.

## Diablo series: preservation and analysis boundary

If “Diablo” means Blizzard's *Diablo* series, a lawful research track can
cover executable formats, asset containers, save-file structure, network
protocol history, and the evolution from DOS/Windows binaries to later
engines. Use official re-releases, legally owned installations, open-source
engine reimplementations, or developer-released material. Keep original game
assets private when redistribution is not permitted.

A static case study can inventory PE/MZ headers, locate resource tables,
compare patch versions, and describe data-driven systems. It must not produce
multiplayer cheats, license bypasses, malware, credential theft tooling, or
instructions for attacking Battle.net or another player's machine. For
network research, use a disconnected test harness and synthetic packets.

## Open questions for the next pass

1. Which Diablo title and release should be the corpus target?
2. Which Ghidra release and OpenJDK LTS version should be pinned for the
   project environment?
3. Can a small, redistributable toy binary demonstrate the same loader and
   resource-analysis techniques without proprietary game assets?
4. Can John's existing test vectors be wired into a local, non-secret audit
   regression test?
