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
   or functioning root on this physical device. Do not relabel a configured
   workflow as an executed analysis: its measured receipt must be obtained.

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
or the original ZShaolin publisher. Back up an existing Termux installation;
do not uninstall it merely to try an untested build.

The in-progress source stages Zsh, GNU tools, Emacs/Vim, SSH/crypto, languages,
media tools and games, using a pinned terminal engine and authenticated upstream
Android packages. It removes private-client-key-over-HTTP provisioning at the
helper source, requires a client-supplied public key, and defaults SSH to
loopback. No server, SSH agent, root prompt or network download is supposed to
start with the terminal. Obsolete game/keyserver-helper replacements are
explicit in [the build specification](../tools/zshaolin-modern/inputs.json),
not silently reported as reconstructed originals.

**The APK is not yet compiled or runtime-validated.** Source, configured tests
and planned dependencies are not an installable deliverable. No pull request
has been merged for this unfinished build. ZShaolin itself does not require
root and will not provide root or VPN protection.
