# ZShaolin APK investigation and the `r@@t0r` Kodachi candidate

**17 November 2026 is the report-series label.** Upstream commit dates, sandbox observations and GitHub runner clocks are preserved separately, not represented as observations made on that label date. Evidence: [ZShaolin source/review register](research/zshaolin-apk-investigation-2026-11-17.json) and [complete supplemental ISO report](research/kodachi-supplemental-literal-2026-11-17.json).

## Results first

- **No exact ZShaolin APK was obtained or supplied.** This is a pinned source investigation plus static inspection of one upstream repository-shipped ARM shared object, **not** an APK signature/DEX/payload audit, runtime test, or safe/malicious verdict. No third-party “mod” APK was downloaded and no app was installed.
- **Source-confirmed concern:** the legacy `z-ssh` setup flow generates a client private key with an empty passphrase, embeds it into a provisioning script and serves that directory over **plain HTTP on port 2221**, after starting SSHD on port 2222. No TLS or HTTP authentication is configured by this helper. That is a serious key-disclosure risk if used on an untrusted/reachable network; no live key or endpoint was accessed in this investigation.
- **`r@@t0r` had zero matches** in the new bounded scan of **1,175 original-ISO candidate files / 491,894,381 bytes**, across UTF-8, UTF-16LE and UTF-16BE. It also had zero matches in the **321 regular file blobs** of the pinned ZShaolin source tree. These are separate searches, neither of which verifies an APK password or rejects a VPN login.
- **No working Kodachi VPN password is established.** Nothing was authenticated, decrypted or booted. The gateway is still an offline planner, not a VPN.

## Which ZShaolin was inspected?

Primary source: [dyne/ZShaolin at `9e4857a8fae42eb1e476a9a6ea26df172bf8e87e`](https://github.com/dyne/ZShaolin/tree/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e), upstream commit clock **2014-12-21T22:52:28Z**. The official [project page](https://dyne.org/software/zshaolin/) describes a GNU/Linux command-line environment inside Android without requiring root. It is not a Kodachi component or a demonstrated VPN implementation.

At observation, GitHub returned **no releases** and the complete pinned tree contained **no `.apk` files**. The official [file directory](https://files.dyne.org/zshaolin/) listed README/packages/sources/toolchains, not a top-level APK. Its historical `.xda-dev` path could not be fetched; that is not proof that no official APK exists anywhere. Mirror version dates, file sizes and historical “no risk” badges are not accepted as a measured binary identity or current safety verdict.

The pinned source archive was **443,706 bytes**, SHA-256 **`3d0dc8aad25032f5f2635a9f83ff9ac9ba73f85bf52175037a139fe7b74d6b37`**. Every regular file was checked against its pinned Git blob identity. **321 regular files / 1,568,698 bytes** were copied as non-executable mode-0600 data for review; two symlinks were recorded but neither extracted as links nor followed. Build scripts, native files and the bundled JAR were not executed. Nested archives/JAR members were not expanded. Source and binary input copies stay outside Git/public app packages.

### Manifest and native component: source facts, not APK measurements

| Item | Measured source / repository component |
| --- | --- |
| Source package | `org.dyne.zshaolin` |
| Source version | `1.1`, versionCode **18**; not a version read from an acquired APK |
| Source SDK declarations | min **4**, target **14**, max **20** |
| Requested permissions | `INTERNET`, `WRITE_EXTERNAL_STORAGE`, `WAKE_LOCK`, `VIBRATE` |
| Other service guard | Input method uses `BIND_INPUT_METHOD`; no VPN service is declared in this manifest |
| NDK source ABI | `armeabi-v7a`; no ARM64 library in the checked tree |
| Checked-in native file | `termapk/libs/armeabi/libjackpal-androidterm2.so`, **13,860 bytes** |
| Native SHA-256 | `47ed51afb295215f959361929470628d8c23ec2773c4b578aa961d4f6ed4174c` |
| Static ELF result | **ELF32, little-endian ARM, ET_DYN**, `JNI_OnLoad`, imports including `fork`, `execl`, `ioctl`, `waitpid`, `kill`, and **DT_TEXTREL** |
| Method | System `readelf` header/dynamic-section/dynamic-symbol reads; no library loading, disassembly or decompilation |

The [JNI source](https://github.com/dyne/ZShaolin/blob/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e/termapk/jni/termExec.cpp#L90-L130) opens `/dev/ptmx`, forks and executes a native command. Android process/PTY semantics do not become browser JavaScript by decompilation. The repository's existing [HTML5 bridge](zshaolin-javascript-port.md) remains a bounded command-surface emulation, not an Android runtime or a native shell.

Legacy SDK/ABI declarations, native text relocations and old tool versions are **review/compatibility concerns**, not an assertion that a particular unseen APK is exploitable or that it installs/works on a modern device. No current-Android compatibility matrix or CVE-by-version audit was performed. The framework's GPLv3 source license is not blanket redistribution clearance for every bundled tool.

## Security-relevant source paths

### 1. SSH is key-based; the provisioning channel is the concern

[`conf/etc/ssh/sshd_config`](https://github.com/dyne/ZShaolin/blob/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e/conf/etc/ssh/sshd_config#L13-L69) specifies port **2222**, `PubkeyAuthentication yes`, **`PasswordAuthentication no`**, `PermitEmptyPasswords no` and `ChallengeResponseAuthentication no`. `StrictModes no` and `UsePrivilegeSeparation no` are also legacy settings in that file, not a hardening recommendation. A guessed “root password” is not how this source configuration authorizes SSH access.

The separate [`conf/helpers/z-ssh` flow, lines 88–115](https://github.com/dyne/ZShaolin/blob/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e/conf/helpers/z-ssh#L88-L115):

1. Generates a client RSA key with an empty passphrase if absent.
2. Installs its public key as `authorized_keys` only when that file is absent.
3. Embeds the **private key** in a generated client provisioning script.
4. Starts an HTTP server for that directory on **2221** after starting SSHD on **2222**. A separate `secure` action stops the HTTP server.

**Recommendation:** do not enable that legacy HTTP-key provisioning flow. Use a maintained SSH implementation and an authenticated channel for public-key setup. If that flow was previously used on an exposed network, rotate the affected key; stopping the server cannot retract a key already copied. This is a confirmed source-level flow and a conditional key-disclosure risk, **not** a newly assigned CVE, live exploit, evidence that a supplied APK contains it, or a claim that the user's device was exposed. No generated private key or real credential value was retrieved or published.

### 2. `.mp3` asset names do not imply encryption

[`pack/conf.zsh`, lines 105–116](https://github.com/dyne/ZShaolin/blob/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e/pack/conf.zsh#L105-L116) builds a tar, compresses it with LZMA and copies it to `assets/system.tar.lzma.mp3`, alongside `busybox.mp3`. The [installer](https://github.com/dyne/ZShaolin/blob/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e/termapk/src/org/dyne/zshaolin/startup/installer.java) copies those assets into app-private storage, makes BusyBox executable and invokes tar. **Those commands were read, not run.**

The pinned assets directory contains only `.keep`; the actual release system payload is missing. This source path demonstrates compression and an asset suffix, not AES/password encryption or a successful `r@@t0r` decryption attempt.

### 3. Do not confuse the two HTTP code paths

The Java `webserver` class contains a port-10000 socket constructor, but [`TermService`, lines 204–206](https://github.com/dyne/ZShaolin/blob/9e4857a8fae42eb1e476a9a6ea26df172bf8e87e/termapk/src/com/spartacusrex/spartacuside/TermService.java#L204-L206) comments out its construction and startup. Its file-serving handler is additionally guarded by `if(false && ...)`. It is **not a measured open service**. The `z-ssh` shell helper's HTTP provisioning flow above is a different path and must not be dismissed because this Java scaffold is dormant.

## New Kodachi `r@@t0r` check

The candidate is exactly **`r@@t0r`**, with two `@` signs and the digit **zero**. It is not the previously searched `r@@t00`, `r00t0r`, `r00tor` or `r00t`.

Actual original-ISO [run **46041752784**](https://github.com/shdwelf/Html5/actions/runs/46041752784), check **140651111904**, **succeeded** at source **`dd40f8a70ad19f4ea3658f85ca03de9ec37e7aad`**. It retrieved the exact original acquisition artifact and reverified the **4,544,303,104-byte** Desktop XFCE **10.0.3/build 76** ISO, SHA-256 **`57693b32079bef101b75f21f3391bd036f1aae72836b8a06c921d236df626c14`**, plus SHA-512, before parsing. The recorded scan clock is **2026-11-27T17:27:47.143385+00:00**.

| Scope | `r@@t0r` result |
| --- | --- |
| Original ISO bounded candidates | **1,175 scanned / 491,894,381 bytes**; zero matching files |
| UTF-8 / UTF-16LE / UTF-16BE substring counts | **0 / 0 / 0** |
| Standalone ASCII count | **0** |
| Pinned ZShaolin source-tree regular blobs, separate scan | **321 files / 1,568,698 bytes**; zero matching files in the same three encodings |
| APK bytes | **Not searched: no APK obtained** |
| Live password acceptance / rejection | **Unknown / unknown: no authentication attempted** |

The supplemental wrapper imports a fresh instance of the measured scanner and **explicitly appends this one literal in memory**. The historical scanner, dependency lock, acquisition pins, native workflow and Ghidra script remain byte-identical; earlier three-term/Ghidra reports are not retroactively relabeled as having searched this new term. The new scan also repeated the prior three literals, with zero matches again. **Ghidra was not rerun**, and no new loaded-memory/reference/decryption result is claimed.

Bounds remain **700,000 entries / 64 directory levels / 20,000 candidate files / 8 MiB per config / 64 MiB per binary / 768 MiB total reads**. The same three oversized files were skipped: `ai-cmd` (**77,920,756 bytes**) and two ONNX files (**90,405,214 / 67,408,117 bytes**). No symlinks/devices, arbitrary system/browser data, nested archives, unloaded memory or runtime-downloaded/derived credentials were searched. A bounded negative is not absence from every ISO byte and is not evidence that a provider rejected this password.

All **three ordered base64 Checks chunks** were decoded and verified against the source/input hashes. The **complete 4,334-byte report**, SHA-256 **`61ac0019cd7c2d2c5e13ceda4c7fb0962fbaf04fcb750944cd18b4a2fbcfc96e`**, is preserved verbatim in the supplemental JSON. Redacted metadata artifact **15220316928** has GitHub-reported archive SHA-256 `f4cae8e0841163d90763251271ba18977915e7fa556dbeaf91896f3c19de5801`; its ZIP was not retrieved locally, and the complete report was reviewed through Checks instead.

## Validation and remaining input

- **43/43 local Python controls**: prior 33 plus ten new exact-candidate/encoding/boundary/redaction/private-output controls. Actual-run CI passed **28 original static/acquisition + ten supplemental controls** before the real ISO read. These overlap; counts are not summed into unique coverage.
- **15/15 focused Node evidence/package controls**, including six new source/actual-ISO/transport/role/corpus controls and five historical evidence controls. Counts overlap. The read-only gateway review includes the new follow-up controls; no application or Android input was changed for this research.
- Workflow YAML, shell and embedded Python parsed; read-only GitHub permissions and original-artifact pinning verified. This is **not** an actionlint, APK installation or VPN test.
- Historical source-bound native evidence still passes its existing controls. Independent publisher-key trust, boot, provider authentication, actual VPN packet/leak protection, APK certificate trust and owner-device acceptance remain open.
- **For APK-specific continuation, provide the exact original APK** (or an authenticated publisher release URL/hash). Then its certificate, binary manifest, DEX, native libraries and compressed system payload can be inspected as data without installing it. Until then, source version `1.1` and the ARM `.so` must not be called an audited release APK.

Operational reports/registers remain excluded from public Wiki/SITE-K/ADL manual corpora. No private cloud app, backup or unrelated account was accessed. See the [earlier Kodachi ISO/native report](kodachi-vpn-iso-inspection-2026-11-17.md) for the original trust, credential-role and bounded-Ghidra limitations.
