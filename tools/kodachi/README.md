# Kodachi acquisition and static VPN inspection

These are review tools, not a VPN or a launcher. They never boot an image or
connect to a provider. The existing `fetch-iso.py` keeps its original fixed
publisher origin, size, SHA-256/SHA-512 and downloaded-key signature checks.
Independent publisher-key authentication is still an open trust boundary.

## Static inspection of the actual acquired desktop ISO

`inspect-iso.py` first rechecks the **4,544,303,104-byte** desktop 10.0.3/build-76
ISO against both original hash pins. Only then does it use hash-pinned Python
ISO/SquashFS readers. It reads the filesystem **as data**, without mounting,
booting, extracting a filesystem tree, invoking an installer, executing an
image file or following image symlinks/devices. The runtime libraries are review
dependencies, not public-app or Android dependencies.

```sh
# The supplied wheel hashes target CPython 3.11 / Linux x86-64.
python3.11 -m pip install --only-binary=:all: --require-hashes -r tools/kodachi/inspect-requirements.txt
python3.11 -m unittest discover -s tests -p 'kodachi_iso*_test.py' -v
python3.11 tools/kodachi/inspect-iso.py /path/to/kodachi-os-xfce-10.0.3-amd64.iso /fresh/directory/vpn-inspection.json
```

The read-only workflow retrieves the **existing acquisition artifact**, not a
silently substituted newer image. It fails if that short-lived artifact has
expired. Reacquire the same pinned original explicitly with `fetch-iso.py` when
needed; do not loosen pins or infer newer-build contents from an older result.

### What the search can establish

- Inventories regular-file paths in each SquashFS layer, OpenVPN profiles,
  WireGuard/NetworkManager configuration, `Own_VPN_Config`, selected Kodachi
  configuration/scripts and runtime binaries.
- Records file sizes/hashes, `auth-user-pass`/`askpass` references, empty versus
  placeholder/runtime/nonempty credential fields, short auth-file candidates,
  and selected literal paths/password-symbol counts in binaries.
- Separates historical published **OS login defaults** from evidence of a
  **VPN provider credential**. The occurrence of `r@@t00` or `Security4All` does
  not prove either is a working VPN password.
- Redacts unknown credential values, inline auth contents and private-key
  material from reports/annotations. Nothing is authenticated or tried.

### Limits and evidence

The tool has explicit entry/depth/file/byte bounds and reports skipped files.
Linux filenames (including non-UTF8/control characters) remain literal virtual
paths encoded safely in JSON, never host extraction paths or shell arguments.
A bounded static search is not an exhaustive secret-recovery, decompilation,
runtime/decryption or packet-path test. Runtime-fetched/derived secrets may not
be present in the ISO. The report contains the measured ISO hashes, scanner and
dependency-lock hashes, source commit and runner clock. Keep that clock distinct
from report-series filenames/cutoffs.

Full **redacted** inventories are short-lived Actions artifacts. A <=14-KB
prioritized preview is also exposed in <=2,000-byte Checks chunks (separate
step, at most eight notices) for a reviewer unable to reach the artifact CDN.
The preview is explicitly not the full inventory. No raw profiles, private
keys, credential values or ISO bytes are committed or uploaded by inspection.

## Ordered native Ghidra / crypto follow-through

The separate `kodachi-native-analysis.yml` first gates the corrected radar UI,
then the format-aware VPN setup interface, then the ISO/native-input controls.
Only the required session branch may retrieve the original acquisition artifact.
It rehashes and rescans that same image, including case-sensitive `r00t0r`,
`r00tor` and `r00t` searches in UTF-8 / UTF-16LE / UTF-16BE. Counts are literal
occurrences, not credential-role or working-password proof. Arbitrary URL
components are not published as filesystem path references.

`prepare-native.py` then copies **only** `online-auth` and `routing-switch` from
`/opt/kodachi/dashboard/hooks/` to fixed flat `.elf` filenames in a fresh private
runner directory, with mode **0600** and matching per-file hashes. This is a new,
explicit analysis step, not a claim that the original scan extracted a tree.
No symlink is followed and neither input is executed. Inputs/projects/raw logs
are temporary and are never uploaded or committed.

The runner uses SHA-256-pinned **Ghidra 12.1.4**, **Temurin Java 21**, and the
126-signature FindCrypt database pinned to commit
`5c2fd5bb50d13a4092da136dc7004becd8129c7b`. Original synthetic ELF disassembly,
real native decompilation, the three requested literal markers and an AES S-box
positive control must succeed before either ISO binary is analyzed. Auto-analysis
is bounded to 180 seconds per original binary, at most 500,000 instructions are
counted, and at most four functions are decompiled for 15 seconds each.
Initialized loaded Ghidra ranges are copied once to **at most 64 MiB** of buffers;
126 pattern scans use a bounded Boyer–Moore–Horspool search rather than repeated
address-at-a-time database reads. Cross-range/unloaded-memory matches are not
claimed. The exact Java search method also runs against a naive synthetic oracle
(overlaps, caps, range boundaries and 250 seeded cases). Running all
`kodachi_*test.py` controls therefore requires a JDK; CI explicitly sets Temurin 21.
Fixed-label stage notices diagnose a timeout without publishing raw logs.
Timeout/cap state is reported, not promoted to complete analysis.

Only fixed-label crypto counts, addresses, input/tool/source hashes and completed
C-output lengths/hashes are published. Decompiled C, arbitrary binary strings,
raw operands, keys and credentials are not published. FindCrypt/signature or
symbol-name matches are leads for review, **not** evidence of a usable key or an
automatically decrypted VPN password. No runtime network login, key guessing,
VPN connection or OS boot is performed. The Zulu/OpenJDK interface choices are
setup templates; the measured native workflow uses Temurin, not an invented
three-vendor execution matrix.
