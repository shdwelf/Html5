# Galaxy A03s: work-profile briefcase and “private mode”

## Current device evidence

The owner’s follow-up screenshots directly show **Android 13**, build
**`TP1A.220624.014.A037U1UESBDYI1`**, **Android security patch level July 1, 2025**,
and a **Phone status: Official** label. The Google Play system-update date is a
separate field. The sales model code and Settings model name are different
kinds of labels; neither proves a modification, an unlocked bootloader or
firmware compatibility with a different model.

No raw screenshots, MAC address, network addresses, serial number or IMEI are
copied here. See the [sanitized observations](../tools/android-root-review/screenshot-findings.json)
and [separate rooting prerequisites](android-a037u1-rooting-review.md).

The screenshots do **not** identify a profile administrator, show a specific
Private mode setting, or prove malware/rootkit activity. “Official” is not a
statement that the phone has no work profile, no administrator or an unlocked
bootloader.

## What the briefcase normally means

A **briefcase badge on an app** identifies a work-profile copy. A **Work profile
Quick Settings tile** controls whether that profile runs. Android’s work
profile keeps its apps/data separate from the personal profile; the exact
management powers depend on personal versus company ownership and policy.
The briefcase alone does not identify the administrator or prove employer
ownership, spyware, root or a VPN. [1](https://support.google.com/work/android/answer/6191949?hl=en)

A work profile may also be created by a tool the owner deliberately installed
for app isolation. For example, [Shelter’s own README](https://github.com/PeterCxy/Shelter)
says it uses Android work-profile APIs to isolate/clone apps; its protection is
limited by the Android implementation. This is an explanation, **not** a
recommendation to provision another profile, replace an existing administrator
or install a new DPC before checking what is already present.

**Pause is not delete.** Pausing a work profile stops its work apps and
notifications; it does not remove their data. Removing the profile deletes its
local apps/data. Organization policies may limit pausing or removal. Do not
select **Remove work profile**, factory reset or remove a management app merely
to investigate an icon. [2](https://support.google.com/work/android/answer/7029561/pause-or-turn-on-your-work-profile?hl=en)
[1](https://support.google.com/work/android/answer/6191949?hl=en)

### Where to look without changing anything

**Location and label matter.** A named **Work mode** under Samsung **Modes and
Routines**, if that feature exists on the device, is an automation/focus preset;
it is not itself proof of an Android managed work profile. Samsung documents
custom mode names/icons and a separate Quick Settings Modes tile, and warns
that feature availability varies by device/software. A status-bar symbol or
custom tile alone is therefore less specific than a briefcase badge on an app
and a confirmed Work tab. Do not assume this A03s has Modes and Routines just
because another Galaxy does.
[1](https://www.samsung.com/us/support/answer/ANS10002538/)

- Open the app drawer and look for a **Work** tab or briefcase-badged apps.
- Expand Quick Settings and read the label under the suspected briefcase tile.
- On Samsung, inspect **Settings → Accounts and backup → Manage accounts** for
  a work section; menu names can differ. The Android help page uses
  **Passwords and accounts → Work**. Also inspect, without deactivating,
  **Security and privacy → Other/More security settings → Device admin apps**
  if that menu exists. A device-admin listing alone is not proof of a managed
  work profile or an attribution to an organization.
- If sharing evidence, crop to the **tile/menu label and management explanation**.
  Omit account names, employer details, admin component names, addresses, QR
  codes and device identifiers. No additional About-phone screenshot is needed.

## The different meanings of “private mode”

| Feature | Meaning for this Android 13 phone |
| --- | --- |
| **Android Private Space** | The standard Android feature requires **Android 15 or later** plus other eligibility conditions. It is not a stock Android 13 feature. Installing an APK or changing a launcher does not upgrade the OS capability. |
| **Samsung Secure Folder** | A separate Samsung Knox-backed feature for supported models/firmware. It is not the same as an Android Enterprise work profile. Exact support on this A03s/One UI Core build is **not confirmed**. |
| **Legacy Samsung Private Mode** | An older Samsung feature name; do not apply old Galaxy S-series tutorials as proof that this A03s firmware has the same setting. |
| **Browser private/incognito mode** | A browser-session feature, not an OS work profile, bootloader unlock, root permission or whole-device network tunnel. Its specific behavior depends on the browser. |
| **Private DNS** | A separate network setting; it is not an app-isolation mode or a VPN and does not grant root. |

Google’s Private Space requirements explicitly state **Android 15+**, primary
user and other platform/management conditions. Even on a supported OS, Private
Space is not promised to be undiscoverable to apps, device logs or an ADB user.
[1](https://support.google.com/android/answer/15341885?hl=en)

Samsung’s [official Secure Folder guide](https://www.samsung.com/uk/support/mobile-devices/what-is-the-secure-folder-and-how-do-i-use-it/)
describes Knox-backed encrypted storage and shows the supported-device path
**Settings → Security and privacy → More security settings → Secure Folder**.
The guide is not a compatibility statement for this exact A03s build.

**Stronger model-specific evidence:** the Samsung Knox team's
[device list](https://www.samsungknox.com/en/blog/ending-support-for-knox-guard-agent-version-1.0)
explicitly includes **SM-A037U1** in the A03s row marked **Android – Others / N/A**.
Samsung's [category explanation](https://docs.samsungknox.com/admin/fundamentals/kbas/kba-349-about-android-others-android-go-devices/)
says these devices have limited/no full Knox compatibility but can support
**Android Enterprise (Generic)** and selected cloud products. This supports a
Secure Folder compatibility caveat; it is **not** a test of the installed
Secure Folder feature, proof of no ordinary Android encryption/TEE/work profile,
or evidence of this phone's current Knox Guard enrollment. The device-list
article concerns old client 1.0/P/Q enrollment policy, not this Android 13
phone's lock state. See the [Secure Folder / Cydia / domain deep dive](samsung-secure-folder-saurik-cydia-review.md).

Use Settings search for **Secure Folder**. If it is absent, report that; do not
assume a random Secure Folder APK, enabling root or changing SELinux can
supply missing platform support. Rooting can also conflict with Knox features;
it is not a privacy-mode prerequisite. Do not share account credentials or
container passwords for this investigation.

## Important VPN distinction

VPN scope can be **per Android user/profile**. A work-profile VPN is not proof
that personal-profile traffic uses it, and a personal VPN is not automatically
proof of work-profile coverage. The Android Enterprise security paper explicitly
describes per-user/work-profile VPN separation. Check the profile and VPN app’s
actual scope; a key icon alone does not establish provider identity, working
Kodachi credentials, Internet reachability or absence of leaks.
[2](https://services.google.com/fh/files/misc/android-enterprise-security-paper-2023.pdf)

A work profile, Secure Folder or browser private session is therefore **not a
replacement for a tested VPN configuration**, and none supplies root access.
No current screenshot establishes a working Kodachi VPN configuration.

## Optional non-identifying local check

For a USB-debugging connection you already authorized on your own computer:

```sh
python3 tools/android-root-review/profile-state.py
```

The script runs only:

- `adb shell getprop ro.build.version.sdk`
- `adb shell pm list features`
- `adb shell pm list users`

It reads their output in memory and returns **counts/flags only**. It does not
save or print profile names, user IDs, account names, admin components, raw
errors or the original command output. The managed-profile and quiet-mode bits
come from [Android 13 UserInfo source](https://github.com/aosp-mirror/platform_frameworks_base/blob/android-13.0.0_r1/core/java/android/content/pm/UserInfo.java).
A standard managed-profile bit is not enough to distinguish all Samsung vendor
containers or identify their administrator; the report explicitly leaves those
questions unresolved. No `dumpsys device_policy`, package inventory or device
identifier dump is requested.

The script never creates/deletes/pauses a profile, provisions a DPC, modifies
policy, runs `su`, unlocks or flashes the phone. It is an optional **local**
read-only diagnostic, not a connection from this session to your phone. Review
its summary before sharing.

## Consequence for the ZShaolin build

The owner-approved modernization uses the Termux-compatible native prefix
**`/data/data/com.termux/files/usr`** and app ID **`com.termux`**. It is **primary
Android user only**. Installing/cloning it inside a work profile, Secure Folder
or a secondary user is **not a supported workaround** for an existing Termux
installation: the hardcoded native paths would belong to the wrong sandbox.
The app checks this before installing its payload and must fail closed.

The full-toolbox build remains unprivileged and independent of bootloader
unlocking. Only Zsh is intended to start; work-profile creation, root and VPN
services are not startup features. The source removes the original HTTP
client-private-key provisioning flow. An actual compiled/signed APK and
runtime receipt are still required before calling the build finished; source
controls and a configured CI workflow alone do not satisfy that requirement.
