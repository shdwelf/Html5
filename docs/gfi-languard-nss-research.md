# GFI LANguard Network Security Scanner — research notes (21 Oct 2026)

*Part of the “ghirdra” research line alongside
[`john-ghidra-diablo-research.md`](john-ghidra-diablo-research.md): authorized,
source-led study of era security tooling. F4 posture throughout — recipe/notes
level. **A network scanner is an attack-capable tool:** nothing here is a
procedure for scanning, auditing, or patching a network you do not own and are
not explicitly authorized to test.*

## 1. What it is

**GFI LANguard (N.S.S., LANguard Network Security Scanner)** is GFI Software's
network vulnerability-management product: port/service discovery, missing-patch
and hotfix detection, vulnerability checks, share/user/USB/service inventory,
AV-signature state, and patch deployment — first as freeware, later as the
commercial "GFI LanGuard" still sold today (12.x line).

## 2. Timeline (sources pinned)

| Era | Version / artifact | Notes |
| --- | --- | --- |
| ~2000–2001 | **LANguard freeware** | Period review (*Login Internet Expert* n.43, Nov/Dec 2003): “About three years ago GFI launched a freeware application called LANguard, capable of performing in-depth probing especially on Windows-type systems … netbios queries and verifying the contents of the analysed host's registry”. Tucows freeware **“LANguard Network Scanner”**, 2001-08-01, 2.3 MB — preserved at [archive.org/details/tucows_213719_LANguard_Network_Scanner](https://archive.org/details/tucows_213719_LANguard_Network_Scanner) (F3: relay/user capture). |
| 2003 | **NSS 3.3** | *PC Magazine* review: 30-day trial gates scheduled scans, the report generator, results comparison, Internet security updates, and hot-fix deployment — i.e. the commercial product grew around the update channel and the deployment feature ([PCMag](https://pcmag.com/article2/0,2817,1400313,00.asp); GFI's own reprint of the 3.3 review at `gfi.com/lannetscan/lanss_loginreview_en.pdf`). |
| 2006 | **NSS 8** | The [NSS 8 manual](https://www.gfi.com/lannetscan/lanscan8manual.pdf) (still hosted by GFI) enumerates the feature set: OVAL + SANS Top 20 + CVE vulnerability checks, missing Microsoft security updates, rogue/backdoor users, open shares + permissions, enumeration of groups/USB devices/network devices/services/remote processes/installed apps, security-product signature checks; brochure touts 2,000+ OVAL checks and a VBScript **script editor + debugger**. |
| 2008–2010 | **9.x** | Freeware tier shrinks to ≤5 IPs; OVAL 5,000+; 50,000 assessments claimed per scan (period listings). |
| 2012–2015 | **11.x** | Agents, patch rollback, multi-platform scans (Win/Mac/Linux), third-party patching (QuickTime/Flash/Firefox/Java), sudo-aware Linux scans (12.1), OVAL 11,500+ checks. |
| 2016– | **12.x** (12.16, 2026-06-30) | Web console, WAN/MSP agents, GFI AppManager integration (12.15), hardened update-source validation (12.16). |

## 3. Why it is a fair “ghirdra” target

The era builds are ordinary PE files with a *documented* output surface — a
lawful static study can cover:

- **File/installer identification** — PE headers, runtimes, and the update
  payloads of a version you own or that is freely redistributable (the 2001
  Tucows freeware item is the cleanest historical specimen).
- **Report/export formats** — the HTML/XML scan reports and results-compare
  deltas are data formats, safe to parse and document without touching a network.
- **The vulnerability database format** — OVAL definitions are public XML
  (MITRE); comparing how a scanner version ingests/represents them is
  file-format work.
- **Update channel history** — how the product retrieved patch/vulnerability
  data (the 3.3 review shows the update channel was the commercial pivot);
  treat any captured update payload as untrusted input (cf. the CVE-2018-20250
  SFX note in [`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md)).
- **Scan-engine dispatch** — strings/xrefs around NetBIOS, remote-registry,
  SMB/`admin$`-style deployment code tell the *shape* of the tool; do not write
  scan payloads or network procedures.

Boundary (same as the John notes): authorized lab use only; never process
third-party networks or harvested data; do not publish deployment bypasses or
scan recipes; a copy of a scanner you own may be studied like any other binary.

## 4. Suggested next steps

1. When a specimen is user-supplied (F3), triage with `tools/exe_triage.py` /
   `tools/game_triage.py`-style header+strings passes and record hashes.
2. Document one era report format end-to-end (parse → schema notes) as the
   format case study.
3. Cross-link the patch-deployment feature into
   [`software-protection-encyclopedia.md`](software-protection-encyclopedia.md)
   if the admin-vs-scanner boundary needs a longer entry.

## 5. Provenance

Every version claim above is sourced inline (GFI's own hosted PDFs, PCMag's
2003 review, the period *Login Internet Expert* review, the archive.org Tucows
item, GFI's current product-release pages). Era installers themselves are **not**
redistributed here — links only, per F3.
