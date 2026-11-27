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
