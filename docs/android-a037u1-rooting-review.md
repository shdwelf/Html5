# Galaxy A03s SM-A037U1/DS — screenshot investigation

## What the screenshots establish

These are visual observations of the owner's Settings screenshots, **not** a
connected-device probe, an authenticated firmware acquisition or proof of root.
No raw screenshot, IMEI, serial number or other phone identifier is included in
this report or its [sanitized evidence record](../tools/android-root-review/screenshot-findings.json).

| Field | Visible value |
| --- | --- |
| Product / model | Galaxy A03s / **SM-A037U1/DS** |
| Android / One UI Core | **13 / 5.1** |
| Full build number | **`TP1A.220624.014.A037U1UESBDYI1`** |
| Baseband / firmware suffix | **`A037U1UESBDYI1`** — the ambiguous character is `I`, not lowercase `l` |
| Kernel | `4.19.191-27242513-abA037U1UESBDYI1` |
| Kernel build label | September 16, 2025 |
| SE for Android | **Enforcing** |
| Android security patch level | **July 1, 2025**, directly visible in the follow-up |
| Google Play system update | August 1, 2024 — a separate field |
| Phone status | **Official** — not bootloader or management-state evidence |
| Sales model code | `SM-A037UZKLLLA` — a product SKU, distinct from the Settings model-name label |
| Security-software release label | `SMR Jul-2025 Release 1` |

The first screenshot cut off the Android patch-date value; the **follow-up
shows July 1, 2025 directly**, resolving that earlier limitation. Do not confuse
it with the Google Play system-update date. A third-party firmware catalog
separately lists this firmware with Android 13, SW revision **B** and patch
level **2025-07-01**. Agreement does not authenticate a firmware archive or
measure the phone's rollback fuses.
[1](https://samfw.com/firmware/SM-A037U1)

## Rooting implications

1. **The exact model matters.** This is the U1/DS label, not evidence that an
   international A037F/G/M image or generic “A03s root” package will work. Do not
   cross-flash a different model or select an older bootloader revision based
   on a generic tutorial. A catalog's revision B is not a measurement of the
   phone's rollback fuses.
2. **OEM unlocking available ≠ bootloader unlocked.** The owner separately
   reported an available OEM-unlocking toggle. Neither screenshot displays it,
   and neither displays Download Mode OEM Lock or KnoxGuard/RMM. In the pinned
   official Magisk instructions, `ON (U)` still means *locked with unlocking
   enabled*; `OFF (U)` means *fully unlocked*. If no OEM Lock value is present,
   the instructions warn of possible USA/Canada market restrictions.
3. **KnoxGuard is an independent gate.** Active/Locked states block the normal
   Magisk path. Do not try to bypass account, carrier-management or ownership
   controls. No such bypass has been attempted or supplied here.
4. **Enforcing does not prove “unrooted.”** It describes SELinux enforcement,
   not the bootloader state. Similarly, a `4.19.191` kernel label alone does
   not demonstrate a usable vulnerability: vendor backports and exact binary
   configuration matter.
5. **No working root tool is verified for this phone.** The screenshots show no
   Magisk installation, root grant or measured root-shell result. There is no
   connected phone, exact stock AP archive or patched firmware in this work.
6. **Ghidra is static evidence, not a rooting test.** The added review pipeline
   pins an official Magisk release and Ghidra, verifies input hashes and APK
   signature consistency, then inspects two ARM init binaries. A successful
   report would still not prove a malware-free APK, an exploitable bootloader
   or functioning root on this physical device. The **bounded review has now
   executed successfully**; the measured receipt below is evidence of that
   analysis, not a device-root test.

Primary source: [official Magisk Samsung requirements, pinned to the selected
release](https://github.com/topjohnwu/Magisk/blob/0972f67d97f9b6302b67c5171283330c74114b4a/docs/install.md#samsung-devices).
Those instructions warn that installing Magisk on Samsung irreversibly trips
the Knox Warranty Bit and that first installation requires a full data wipe,
separate from any bootloader-unlocking wipe. Back up first; this investigation
has **not** authorized or performed any wipe, unlock or flash.

The **Official** phone-status label does not establish an unlocked bootloader,
an unmanaged device or absence of a work profile. The product SKU and Settings
model name are different kinds of labels; their spelling is not by itself
proof of tampering or permission to cross-flash.

The key-shaped status-bar icon is not proof of a particular VPN provider,
configuration, working tunnel or absence of leaks. Nothing here establishes a
working Kodachi VPN configuration. See the [work-profile briefcase / private-mode
investigation](android-work-profile-private-mode.md) for profile isolation,
Android 15 Private Space versus this Android 13 device, and VPN scope.

## Executed Magisk / Ghidra static review

The validated [GitHub Actions run 46054707860](https://github.com/shdwelf/Html5/actions/runs/46054707860)
executed from **`130910469950b67319046b808a4f5ec27a48b301`**, not from later
documentation commits. The [retrieved measured report](research/android-root-static-review.json)
is **12,956 bytes**, SHA-256
**`f1ad4aae4e63e88ccb6e48cd12cf02313009af1f85102194b7d7a12246325cfd`**.
It was recovered from three ordered compressed Checks annotations and checked
against their declared byte length/hash, the run's source commit and run ID.
The source-file hashes in the receipt also matched the local reviewed files at
retrieval. The original certificate-parser bytes are now retained in
[`tools/android-ci/historical/`](../tools/android-ci/historical/) after a later
format-compatibility repair; the old receipt is unchanged and does not pretend
the new parser ran in that historical job. No APK, firmware, device screenshot
or device dump was saved with this static receipt.

Inputs: the pinned official **Magisk v31.1 APK**, SHA-256
`89cefac0a318afa39fb3880c45c87b036c05bc1ebf02a7a715b7f8d7c26ac6e7`,
and **Ghidra 12.1.4**, running with Temurin 21 on a disposable CI host. Android's
`apksigner verify` succeeded using APK signature scheme v2. The observed signer
certificate SHA-256 was
`b4cb83b4dad99f997dbe872f013aa16c14eec41d167021f371f7e1330f273ee6`.
That is signature consistency plus an observed certificate, **not independent
authentication of the author's signing key**.

| Static input | Instructions visited | Functions defined | Completed sampled decompilations |
| --- | ---: | ---: | ---: |
| `lib/arm64-v8a/libmagiskinit.so` | 36,712 | 1,233 | 4 |
| `lib/armeabi-v7a/libmagiskinit.so` | 43,203 | 713 | 4 |
| Inert compiled positive control | 91 | 18 | 4 |

The report records input hashes, fixed imported-API categories and the size/hash
of the sampled decompiled output. It does not publish arbitrary strings or
execute the APK/native inputs. Sampling four functions is **not a whole-program
or whole-APK security audit**. The positive control verifies that the analysis
pipeline actually disassembled/decompiled native code; it does not prove
Magisk's behavior or compatibility with the phone.

The report explicitly leaves **device connected, firmware acquired/flashed,
root verified, and malware-free verdict false**. The embedded screenshot
observations retain their original screenshot-only limits; an executed CI
analysis does not retroactively turn a Settings screenshot into device-side
root evidence.

## Next non-destructive evidence

Please provide only:

- A **cropped Developer Options OEM-unlocking row**.
- If comfortable viewing Download Mode **without selecting unlock or flash**,
  the **OEM Lock** and **KG / KnoxGuard / RMM** text values. Redact or omit DID,
  IMEI, serial, barcodes and QR codes. Do not long-press an unlock confirmation
  just to obtain information. If no OEM Lock field is shown, say so.
- CPU ABI information, if available, to choose the APK architecture. A 64-bit
  processor alone does not prove the installed Android userspace supports
  `arm64-v8a`.

For an already authorized USB-debugging connection on your own computer, the
optional local collector asks only for a fixed whitelist of non-identifying
properties:

```sh
python3 tools/android-root-review/device-state.py
```

It runs `adb shell getprop <one-whitelisted-property>` only. It does **not** run
`adb root`, `su`, `adb devices`, reboot, unlock or flash; it does not dump all
properties or print raw ADB errors. Review the output before sharing. Do not
supply an IMEI or serial. Download Mode values can be supplied as explicit
arguments for a conservative prerequisite assessment, but even a positive
prerequisite assessment always leaves `workingRootVerified` false.

## ZShaolin status and scope

The selected scope remains **full modern toolbox, lean startup**, with explicit
owner approval for the **Termux-compatible `com.termux` package ID**. That build
cannot coexist with Termux in the same Android user and is not signed by Termux
or the original ZShaolin publisher. Protect existing Termux data; a work profile,
Secure Folder or secondary user is not a supported coexistence workaround.

**The x86_64 technical review build has now passed all mandatory gates** in
[run **46063037718**](https://github.com/shdwelf/Html5/actions/runs/46063037718),
source **`64218e56d82a3949d3884fca5cd912f9f405042a`**. This includes actual offline
payload installation, all **five named Android 13 tests with no failures/skips**,
release APK/JNI compilation, lint, signature verification and measurement of the
packaged remediation/startup assets. CI published the APK; the locally retrieved
[compact summary](research/zshaolin-modern-x86_64-apk-summary.json) was hash-checked
with all 16 source-file hashes. The **253-package** closure retains **51 required
commands**, including native shell/editors/crypto/media/SSH tools.

The [native build guide](zshaolin-modern-native-build.md) gives the artifact,
APK/signer hashes, exact versions, target-28 tradeoff, licence/corresponding-source
limits and retrieval boundary. The large APK/full receipt were measured in CI,
**not downloaded or rehashed locally**. Do not try x86_64 on this Samsung.
Separate **ARMv7/ARM64 APKs** compiled and passed lint, v2 signature verification
and packaged-payload measurement in
[run **46063968229**](https://github.com/shdwelf/Html5/actions/runs/46063968229).
Both compact summaries were retrieved and verified against their hashes and
all 16 source-file hashes; artifact links/checksums are in the guide. **Neither
ARM variant was executed.** These measurements do not identify this phone's
userspace ABI or prove exact-device compatibility. Each job has a different
ephemeral signer, not an upstream or stable update identity.

The historical client-private-key-over-HTTP provisioning path is removed. The
packaged replacement requires a client-supplied **public** key and foreground
loopback-only SSH; no server, SSH agent, root prompt or network download starts
with the terminal. Named legacy substitutions remain explicit in the
[specification](../tools/zshaolin-modern/inputs.json). An observed new review
signer is not an upstream identity or a stable update-signing service.

For reproducibility, the failure chronology is retained rather than treating an
earlier compile-only result as a runtime pass:

| Run | Actual outcome |
| --- | --- |
| 46054704496 / 46056425429 | APK/JNI/lint progressed; runtime setup failed, later isolated to the private-directory identity gate. |
| 46057354939 | Owned inode/device identity accepted; bootstrap path validation rejected an entry. |
| 46058615404 | Benign-path normalization with traversal/collision guards progressed; atomic prefix promotion failed. |
| 46059585202 | Same-mount `Os.rename` progressed through installation; five tests completed, one case-sensitive SSH dump assertion failed. |
| 46061380083 | OpenSSH keyword-case normalization and disabled-network setup passed all five tests; final certificate-output parser rejected a standard signer-label format after successful signature verification. |
| **46063037718** | **All runtime, signature, payload and delivery gates passed** after the parser repair and installed licence notices. |

The pinned OpenSSH 10.6 source emits canonical CamelCase keywords (see
[`servconf.h`](https://github.com/openssh/openssh-portable/blob/d449e662b6b8b8cb20e852d8084c269af1c5e8f1/servconf.h)
and [`servconf.c`](https://github.com/openssh/openssh-portable/blob/d449e662b6b8b8cb20e852d8084c269af1c5e8f1/servconf.c)).
Only dump casing was normalized; password/keyboard-interactive authentication
must remain disabled and the listener set must be exactly loopback port 2222.
No production SSH policy was relaxed and no personal-device logs were exposed.
GitHub PR metadata, not a successful build, determines merge status.

**ZShaolin does not require or provide root or VPN protection.** The successful
emulator build does not change the Samsung bootloader, Knox Guard, Secure Folder
or physical-root findings above.
