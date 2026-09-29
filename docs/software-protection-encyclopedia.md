# Software protection and archive formats encyclopedia

*2026-09-29 · historical, defensive research notes*

This chapter extends the repository's DOS and executable-analysis material into
old software-protection and archive ecosystems. It is deliberately limited to
**lawful archival, interoperability, and malware-analysis work**. It does not
collect cracks, serials, key generators, bypasses, or instructions for
circumventing a license. Do not visit or download from warez/cracking sites;
use publisher releases, public-domain mirrors, and the Internet Archive's
Wayback Machine instead. Archive snapshots are evidence of historical
availability, not a recommendation to execute their contents.

## Source hygiene

For a reproducible investigation, record the snapshot URL, capture date,
SHA-256, file type, and license. Work on a copy inside an offline VM or static
triage pipeline. Treat every executable, keygen, patch, and archive found in
an old index as untrusted—even when its filename looks familiar. The preferred
workflow in this repository is:

1. download only from a legal, documented source;
2. hash it before unpacking;
3. inspect with `file`, `sha256sum`, and the repository's MZ/COM triage tools;
4. unpack archives without executing files, with path traversal and symlink
   protections enabled;
5. document observable behavior and provenance, never a working license bypass.

The names `astalavista.box.sk`, `cracks.to`, and `serial.to` belong to a
historical subject area, not to this project's source list. They should be
handled as potentially hostile or unavailable references. The Wayback Machine
at `https://web.archive.org/` is the appropriate first stop for a historical
index page; it is not a source for executable payloads.

## ARJ and PKZIP: archive formats, not protection bypasses

**ARJ** (Robert K. Jung, beginning in 1991) is a DOS-era archive format with
multi-volume support, comments, extended attributes, and several compression
methods. Its header contains a magic value, basic metadata, and CRC fields.
For defensive tooling, validate header lengths before reading them, reject
nested or absolute paths, cap expansion ratios, and verify the CRC after
extraction. A CRC is an integrity check, not cryptographic authentication.

**PKZIP/ZIP** became the dominant exchange format. Classic ZIP encryption is
legacy password-based encryption and should not be treated as confidentiality
against a determined attacker. Modern ZIP AES extensions improve the design,
but implementation and password quality still matter. For research, compare
central-directory metadata and local headers, test malformed archives, and
preserve the original bytes. Do not turn a format study into password recovery
for somebody else's archive.

Useful non-executable questions include: does the parser agree on compressed
and uncompressed sizes; are duplicate names normalized consistently; are UTF-8
flags honored; and does extraction remain inside the destination directory?
These checks are more valuable than a collection of historical crack files.

## PGP and GnuPG

OpenPGP separates public-key encryption, signatures, compression, and packet
framing. A detached signature authenticates a file only when its signing key
is independently trusted; a successful decryption does not prove provenance.
For archival verification, preserve the `.asc` signature and key fingerprint,
record the exact GnuPG version, and verify with a trusted key obtained through
an independent channel. Prefer modern algorithms and current tooling; legacy
ciphers and weak digest preferences should be treated as migration findings.

GnuPG (`gpg`) is appropriate for verifying a research corpus, not for defeating
passwords or recovering private keys. A minimal verification record should
include the fingerprint, signature status, file hash, and whether the key was
trusted—rather than only the command's exit code.

## Key generators and serial sites: what can be studied safely

A key generator can be examined as an **untrusted executable**: identify its
format, imports, strings, embedded certificates, and network behavior in a
sandbox, then compare those observations with a vendor's official activation
scheme. It is not appropriate to derive or publish a serial algorithm, patch,
or bypass. For teaching reverse engineering, use a purpose-built toy binary or
an open-source license-check example where the author grants permission.

Historical pages from warez indexes can still support legitimate scholarship:
study terminology, link structure, takedown history, and preservation gaps;
quote only what is necessary; and link to an archive snapshot rather than a
live download. This keeps the encyclopedia useful without amplifying malware,
credential theft, or copyright infringement.

## Educational game-wizard and hint-system study

A useful, lawful disassembly target is not a keygen but the **hint and game
wizard layer** of a legally obtained educational title. Model it as a small
state machine: current lesson, question type, attempts, hint depth, score,
and the transition taken after a correct or incorrect answer. A static study
can label strings, inspect jump tables, and document how difficulty and hints
are selected without publishing a registration bypass. A clean-room
reimplementation should use newly written content and assets.

The historical trail here leads to MECC (Minnesota Educational Computing
Consortium/Corporation). *Number Munchers* is a MECC educational game first
released for Apple II in 1986, later appearing on DOS and Macintosh. Its
successor and neighboring titles are best studied as instructional design:
criteria-based grid play, escalating difficulty, feedback, and classroom
settings—not as targets for key generation. The Internet Archive has a
[preservation record for a *Number Munchers* Apple II disk](https://archive.org/details/wozaday_Number_Munchers_800K); use that record for metadata and provenance, not executable extraction from unknown uploads.

The phrase “time rides through American history” most closely matches **Time
Navigator**, a MECC educational American-history game in which the player uses
a time-travel vehicle. It belongs beside *The Oregon Trail*, *Freedom!*, and
other MECC learning adventures as a study of historical simulation and
branching decisions. Any historical claims should be checked against manuals,
period catalogs, and museum or archive records; avoid treating game text as a
complete historical account.

For this repository, a safe “universal hint system” implementation could
expose a JSON lesson format such as:

```json
{
  "topic": "factors",
  "prompt": "Choose a factor of 24",
  "hints": ["A factor divides evenly", "Try a number below 12"],
  "answer": "6"
}
```

The wizard can reveal hints progressively, log pedagogical events locally,
and support a “show solution” mode for testing. No license key, serial
formula, or vendor check is involved.

## Abandonware, commercial game series, and system internals

“Abandonware” is a preservation label, not a copyright exception. A product
being unsupported or difficult to buy does not make redistribution, cracks, or
serials lawful. For the expert-software series below, preserve manuals,
box/edition metadata, patches, screenshots, and checksums from authorized
sources; use rights-cleared demos, source releases, or files supplied by the
rightsholder for executable analysis.

### Wing Commander and Privateer

The *Wing Commander* and *Privateer* families are useful case studies in DOS
resource formats, MZ/overlay loading, configuration detection, and simulation
state. A permitted static-analysis project can map executable headers, identify
resource tables, compare versions, and document how save files and data assets
are structured. It should not publish a copy-protection bypass or modified
commercial binary. Where possible, prefer open-source reimplementations and
official re-releases for hands-on experiments.

### Wolfenstein 3D

*Wolfenstein 3D* is particularly valuable because id Software later released
source code under a permissive license, while original commercial data remains
separate. Study the source build, renderer, map representation, and asset
loading with the source and freely redistributable assets; do not infer that
source availability grants permission to redistribute original episode data.
For DOS-era comparisons, record whether a sample is COM, MZ, a protected-mode
loader, or a packed executable before attempting any static disassembly.

### Radmin and remote administration tools

Radmin is remote-administration software rather than an appropriate “crack”
target. Its history can be studied from vendor documentation and authorized
lab installations: authentication boundaries, service installation, transport
security, logging, and uninstall behavior. Never scan or connect to systems
without explicit authorization. A safe lab uses isolated virtual machines,
non-routable test networks, synthetic credentials, and packet captures made
with consent. The same rule applies to any remote-support or RAT-like tool.

### System internals

A useful companion track is operating-system internals: DOS MZ loading and
relocations, Win32 PE sections and imports, processes and threads, virtual
memory, services, handles, and event logging. Keep exercises observational and
reproducible—parse a file, inspect a process you own, or analyze a toy program.
Do not disable security controls, inject into third-party processes, steal
credentials, or turn reverse engineering into persistence or evasion. Existing
repository tools such as `tools/game_triage.py` and the Ghidra evidence
workflows are appropriate starting points for static, offline analysis.

## Suggested next entries

- ARJ header and multi-volume parsing, with malformed-input test fixtures;
- ZIP extraction safety and Zip Slip regression tests;
- OpenPGP packet taxonomy and signature-verification provenance;
- static triage of historical DOS packers using the existing `tools/` scripts;
- a timeline of shareware licensing and legitimate registration services.

Related repository chapters: [`dos-game-disassembly.md`](dos-game-disassembly.md),
[`exe-protection-deep-dive.md`](exe-protection-deep-dive.md), and
[`virus-encyclopedia.md`](virus-encyclopedia.md).
