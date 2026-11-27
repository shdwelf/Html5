# Kodachi 10 ISO — VPN configuration, literal searches and bounded native analysis

**Report-series label: 17 November 2026, not the publication, acquisition or measurement time.** The publisher, GitHub and runner timestamps are preserved separately in the [structured evidence register](research/kodachi-vpn-iso-inspection-2026-11-17.json); later observations are not represented as known at the report-series date.

## Answer and boundaries

**No working VPN password has been established.** The measured bounded scan of the original Desktop XFCE **10.0.3 / build 76** ISO searched **1,175 candidate files / 491,894,381 bytes**. It found no occurrence of the requested `r00t0r`, `r00tor` or `r00t` literals in those scanned files in UTF-8, UTF-16LE or UTF-16BE. This is not a search of every ISO byte or a test of runtime-derived/downloaded credentials.

The upstream repository publishes **`kodachi` / `Security4All` as an OS login default**, not as an established VPN provider credential. The scan counted 19 `Security4All` byte occurrences and zero `r@@t00` occurrences in its bounded candidates. Neither a default-login mention, a field named “password,” nor a crypto table is proof of a usable VPN password. **Nothing was tried against an account or VPN endpoint.**

No image boot, mount, chroot, installer, image-binary execution, provider login, VPN connection, key guessing or decryption was performed. Unknown credential values/private-key contents remain redacted. The gateway remains an **offline planner, not a VPN**.

## Exact original image and trust

| Item | Measured identity |
| --- | --- |
| ISO | `kodachi-os-xfce-10.0.3-amd64.iso`, Desktop XFCE 10.0.3/build 76 |
| ISO bytes | **4,544,303,104** |
| SHA-256 | `57693b32079bef101b75f21f3391bd036f1aae72836b8a06c921d236df626c14` |
| Acquisition | [Run 45981578258](https://github.com/shdwelf/Html5/actions/runs/45981578258), source `f132219d538d53f68928f61f17cbc7e1fea0b952` |
| Original artifact | `15188898562`; ZIP SHA-256 `c67e74c915e032a21405c78e6c772d8e36f82d741e61890a6feade1d0097c775` |
| GitHub-reported expiry | **2026-11-28T10:23:46Z**; not permanent storage |
| Integrity/trust | Size, SHA-256 and SHA-512 rechecked before parsing. Acquisition verified the detached signature with a downloaded publisher key; **independent publisher-key authentication remains open**. |

Full SHA-512, downloaded-key/signature evidence and runner acquisition clock are in the [acquisition receipt](research/kodachi-iso-acquisition-2026-11-17.json). The original ISO stayed in temporary review-runner storage, outside Git and public app packages. A terminal/server ISO or newer APT binary build is not substituted for this desktop image. On artifact expiry, explicitly reacquire the same pinned image; do not silently analyze a different build.

## Static selection and measured results

The hash-locked Python ISO/SquashFS readers treat the image as data. They list regular-file paths, classify VPN profiles/configuration and selected Kodachi runtime/configuration, and read bounded candidates. They never follow filesystem links, read devices, unpack nested archives or extract a filesystem tree.

The scan listed **1,117 outer ISO files**, then **200,981 regular files, 57,277 symlinks and nine special entries** in `/live/filesystem.squashfs`. Of **1,178 selected candidates**, **1,175 were scanned**: 1,147 Kodachi runtime/config items, 26 auth/VPN-reference items, one OS-release file and one VPN-configuration item. Directory entries/inodes are not misreported as additional scanned file contents.

| Evidence | Bounded result / interpretation |
| --- | --- |
| OpenVPN `auth-user-pass` / `askpass` directives | **0 files** with recognized active directives |
| Inline auth / short one-or-two-line auth-file candidates | **0 / 0** |
| VPN-configuration inventory | **1**: `/etc/openvpn/update-resolv-conf`, **1,468 bytes**, SHA-256 `a6ff4776fdef05dabb51adf91ed3fb0bb45d41e8d364836c7cc2f8a7899585f1`. A helper-script inventory entry is not a provider profile/password. |
| Provider API metadata | `/opt/kodachi/dashboard/hooks/config/vpn-providers-public-api.json`, **39,221 bytes**, SHA-256 `57eff2cee49a931f3589310492f5596944b4131f59886335bc247ca6d8012aad` |
| Provider template aggregate | **13 records: eight null/no-template and five object-valued templates**. No immediate credential-named object-field states were reported; that is not a claim that every nested template is empty. Six named null entries (custom, TorGuard, ExpressVPN, ProtonVPN, Windscribe and Mullvad) are individually visible, with seven further records omitted from the prioritized preview. |
| Credential-field heuristic | **Three redacted nonempty-literal leads**: `username` / `password` at lines **2468 / 2469** of `/usr/local/libexec/kodachi/kodachi-repo-apt`, and `LIVE_PASSWORD` at line **70** of `/usr/local/bin/kodachi-verify-install-residue`. Code/schema/template fields also match the heuristic. Field labels and file roles do **not** establish provider credentials; their values/runtime use were not recovered or authenticated. |
| Selected top-level native runtime inventory | **28 ELF files** with sizes/hashes; only two are selected for subsequent Ghidra analysis. |

### Requested literals

| Case-sensitive term | Matching scanned files, across the three encodings | UTF-8 substring occurrences | Standalone ASCII occurrences |
| --- | ---: | ---: | ---: |
| `r00t0r` | **0** | **0** | **0** |
| `r00tor` | **0** | **0** | **0** |
| `r00t` | **0** | **0** | **0** |

`r00t` is also a substring of the longer two terms. Separate standalone-ASCII counts prevent a substring hit from being presented as a distinct password/token. Zero matching files means no match in any of the three searched encodings **within this selection**, not global absence, a proof of password strength or permission to attempt authentication.

### Explicit scan limits

- At most **700,000 entries**, **64** directory levels, **20,000** candidates, **8 MiB** per text configuration, **64 MiB** per binary and **768 MiB** total candidate reads.
- Three size-bound exclusions: `hooks/ai-cmd` (**77,920,756 bytes**), `models/all-MiniLM-L6-v2.onnx` (**90,405,214**) and `models/kodachi-intent-classifier.onnx` (**67,408,117**). These are not silently counted as negative searches.
- Candidate classification does not read unrelated browser data, `/etc/shadow`, every system library, unallocated/padding bytes, nested/compressed assets or downloaded/derived runtime state.
- The locally reviewed transport is a bounded, prioritized **preview**, not the full redacted inventory. Counts cover the scanner's full candidate pass; preview records can be omitted. Arbitrary binary strings and apparent concatenated path fragments are not treated as resolved filesystem paths.

## Native Ghidra outcome

The first actual-binary native run, [46030444593](https://github.com/shdwelf/Html5/actions/runs/46030444593), passed original synthetic native disassembly/decompilation/literal and AES controls but hit its **12-minute outer input limit (exit 124)**. The buffered-search rerun [46033629633](https://github.com/shdwelf/Html5/actions/runs/46033629633) also timed out. Its fixed-label diagnostics show both synthetic reports completed but **the actual `online-auth` input never reached the reporting post-script**. Neither is counted as successful actual-binary analysis; buffering alone was not demonstrated to fix the failure.

The restricted [run **46037020264**](https://github.com/shdwelf/Html5/actions/runs/46037020264) **succeeded** on both original-ISO inputs after disabling automatic whole-program analysis. Source **`6d8d91b24b09a823829530a8bfa9e7f1533d6098`**, actual-evidence check **140635210613**. Ordered radar/interface/Python controls, original-image rehash/rescan, synthetic native/literal/AES controls, both actual reports and exact input/tool/source validation all passed. The runner recorded the static scan at **2026-11-27T16:53:14.505746+00:00** and native-summary assembly at **2026-11-27T16:53:52.493382+00:00**.

| Actual ELF | Initialized loaded bytes searched | Restricted disassembly windows | Existing instructions counted | Completed bounded decompilations | Matching FindCrypt pattern labels |
| --- | ---: | ---: | ---: | ---: | ---: |
| `online-auth` | **9,451,340** | **4** | **174** | **4 / 4** | **26** |
| `routing-switch` | **15,459,492** | **4** | **174** | **4 / 4** | **25** |

**This is deliberately narrow native evidence.** Actual window selections were an **entry point plus imported-function fallbacks**, not identified crypto/credential-handling functions; the crypto-symbol-category counts were empty in this limited analysis database. Five defined functions in that database are **not** a claim that either complete binary has only five functions. No credential-handling call path, actual password cipher or key was recovered. The false instruction-cap and auto-analysis-timeout flags are not whole-program completion evidence: automatic analysis was disabled.

Both inputs matched AES forward/inverse S-box patterns (**four each**), SHA-256 constants (**two each**), SHA-512 constants (**one each**) and ChaCha initialization patterns (**four each**), among other fixed labels. These are **pattern labels, not 26/25 proven algorithms in use**: shared constants can receive multiple names (for example SHA-256 / SHACAL2), short matches can be incidental, and CRC32 is not encryption. No claim is made about which table participates in VPN credential handling.

In loaded `routing-switch` memory, `auth-user-pass` matched **16** times and `vpn-credentials.json` **two** times; neither matched in loaded `online-auth` memory. No explored exact-start references to those hits were recorded within this limited analysis. A filename literal does not establish that such a file exists in the ISO, contains a password, or is decrypted by these selected functions. The requested three terms, `r@@t00` and `Security4All` had zero loaded-memory matches in both binaries; the separate candidate scan supplies the broader file-level counts.

All ordered preview and compressed native-summary Checks chunks were retrieved and validated locally, including exact source/input/tool/database hashes. The complete decoded native summary was **35,385 bytes**, SHA-256 **`9fe5ecb466ad2809048986b0e0736e0788d94a9e8a0082360b5e6b3f89d23e8b`**; it contains no C source. The [87,044-byte redacted metadata artifact](https://github.com/shdwelf/Html5/actions/runs/46037020264/artifacts/15218580752) has GitHub-reported expiry **2026-12-11T16:53:52Z**. That full artifact was not retrieved locally; the committed curated register preserves the reviewed bounded preview and complete native-summary evidence without claiming review of every inventory record.

### Native method and toolchain

`prepare-native.py` rescans the pinned ISO and copies exactly these two regular AMD64 ELF64 files to fixed flat **mode-0600, non-executable** data files in a fresh private runner directory:

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| `/opt/kodachi/dashboard/hooks/online-auth` | 9,458,752 | `0c812d83ce153460350e1cb4a631a8ae7567d9cb604d2077bc2c5b8f67fe906c` |
| `/opt/kodachi/dashboard/hooks/routing-switch` | 15,468,736 | `80bbbf29ea2ff222a60b9c85f9b6050accb1c806e0777689b336a90df4aeb62b` |

This is an explicit two-file temporary preparation step, not filesystem-tree extraction or execution. Each copy's size/hash must match the rescanned inventory before Ghidra import.

- **Ghidra 12.1.4**, official release archive SHA-256 `ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`; measured **Temurin Java 21.0.13.1+2** on the native runner. The local Java-oracle control used the separately recovered Temurin 21.0.12.1+1, not a second Ghidra execution matrix.
- **126 FindCrypt signatures** from `TorgoTorgo/ghidra-findcrypt` commit `5c2fd5bb50d13a4092da136dc7004becd8129c7b`, blob `36e799563f152ba6e442a9bcd9dc71cd23a96309`, database SHA-256 `ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897`. The pinned database is used by the original bounded headless report, not represented as a full plugin installation/audit.
- **Whole-program auto-analysis is disabled (`-noanalysis`)** and the report refuses runs with it enabled. At most **four restricted 4-KiB disassembly windows** are selected from an entry point, imported crypto symbols or explicitly labeled fallbacks, with automatic code analysis disabled. Count at most **500,000 existing instructions**, collect at most **32 matches/pattern** and decompile at most **four functions, 15 seconds/function**. The original-input command has a **six-minute outer bound**. A false auto-analysis-timeout flag means analysis was disabled, **not** that whole-program analysis completed. Bounded function/control-flow coverage and cap states remain explicit.
- Exact buffered Java search checked against a naive synthetic oracle: overlapping matches, hit cap, range-boundary exclusion and **250 seeded cases**. Actual Ghidra synthetic ELF disassembly/decompilation and exact literal counts, plus an AES-S-box positive control, must pass before original inputs.
- Only fixed labels/counts/addresses, input/tool/source hashes and completed C-output lengths/hashes leave the runner. **No decompiled C, raw logs/operands, arbitrary binary strings, credentials, input binaries, private keys or Ghidra projects are published.**

A signature or symbol-name category is an **analysis lead**, potentially from linked library code or unrelated tables. It does not establish a particular credential encryption scheme, key derivation parameters, key material, password role, runtime call path or successful decryption. Four bounded function decompilations are not whole-program source recovery.

## Public-source cross-check, separate from the ISO

Selected README/v10 workflow profiles were read at [WMAL/kodachios `b9cddada`](https://github.com/WMAL/kodachios/tree/b9cddada130b57e81926b343d8b7720b95eac1c2). The README's OS default login and v10 profiles' authenticated/online preconditions help distinguish OS login, online authentication and provider routing. No documented authentication/routing command was executed. The public projection omits closed-source service implementations and runtime credentials/keys; it cannot prove their absence from this ISO.

Historical Kodachi **8** evidence in [`kodachi-deep-dive.md`](../kodachi-deep-dive.md) remains separate. It is not a source for claimed Kodachi **10** file contents or working provider passwords.

## Interface follow-through and remaining gates

Before the native stage, the ordered workflow checks the corrected tiled **4DWM radar**, then the offline VPN-analysis setup interface. Radar starts with clearly labeled synthetic demo traffic; live direct requests are explicit, proxy use requires separate consent, and failure does not silently fall through to another proxy. Details/instruments no longer cover the radar canvas at the tested responsive sizes.

[`gateway-config.html`](../gateway-config.html) offers format-aware **Ghidra / ILSpy / javap** templates and offline/direct/approved-HTTPS-proxy acquisition examples. Temurin, Zulu and compatible OpenJDK are Java runtime alternatives, not different decryptors. A native Rust ELF is not a managed .NET assembly; **ILSpy was not run on these inputs**, and no three-vendor JDK execution matrix is claimed. The interface reads at most a 64-KiB local header from a file capped at 64 MiB; it uploads, executes, installs and decrypts nothing. The rebuilt static WAR is separate from the unchanged measured APK/JAR.

No owner account, provider subscription, credential import, live packet/leak test, boot authorization, physical-device acceptance or independent publisher-key trust gate is closed by this work. Original normalized backlog remains **31 terminal tasks: 30 done, T9.3 declined**. See [round 96](backlog-execution-round-96-2026-11-17.md), the [reader/tool instructions](../tools/kodachi/README.md) and the structured register for exact source-linked evidence. Review reports/registers stay outside public offline Wiki/SITE-K/ADL manual corpora.
