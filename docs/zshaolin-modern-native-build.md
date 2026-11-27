# ZShaolin Modern — native full-toolbox review build

## Status and identity

This is an **unofficial native Android application**, not a JavaScript terminal,
a browser-to-shell bridge, an upstream ZShaolin release or an official Termux
release. The selected scope is **`full_tools_lean_startup`**: keep the full modern
toolbox, but start only an interactive Zsh attached to a real terminal PTY.
Lean startup does **not** mean a small APK or a small installed dependency tree.

**Validated x86_64 review build:**
[run **46063037718**](https://github.com/shdwelf/Html5/actions/runs/46063037718),
source **`64218e56d82a3949d3884fca5cd912f9f405042a`**, **passed every mandatory
build, lint, five-test offline Android 13 runtime, signature, packaged-payload
and delivery gate**. The compact measured summary was retrieved and verified;
CI published the APK artifact. The **253-package** closure retains all **51
required commands**. This is an emulator-tested technical review build, not a
physical Samsung, ARM execution, root or distribution-complete release claim.

Separate **ARMv7 and ARM64 APKs also compiled and passed lint, signature and
packaged-payload measurement** in
[run **46063968229**](https://github.com/shdwelf/Html5/actions/runs/46063968229)
from the same source. Their summaries were retrieved and source/hash-verified.
**Neither ARM APK has been runtime-tested.** They do not inherit the x86_64
execution result. GitHub's PR metadata, not CI success, determines merge status.

The [Secure Folder/Cydia report](samsung-secure-folder-saurik-cydia-review.md)
and [SM-A037U1 report](android-a037u1-rooting-review.md) keep those investigations
separate. Public-binary Ghidra analysis does not establish physical-device root,
a working jailbreak, Secure Folder decryption or a security audit of every
bundled program. This app provides **no root exploit, VPN credentials or VPN
protection**.

## Compatibility — read before installing anything

- Approved application ID: **`com.termux`**, with native prefix
  **`/data/data/com.termux/files/usr`**. Upstream packages contain this compiled-in
  prefix. An arbitrary renamed package is not a working substitute.
- **Cannot coexist with Termux in the same Android user.** A different signing
  certificate prevents updating an existing Termux installation. Do not uninstall
  a working Termux app merely to try this build; protect its data first.
- **Primary Android user only.** A work profile, Secure Folder or secondary user
  is not a supported coexistence workaround. Installation verifies package/user
  identity and that the native prefix belongs to the same owned private directory.
- `minSdk 28`, `compileSdk 35`, deliberately **`targetSdk 28`** for private-prefix
  native execution on Android 10+. This forgoes newer target-SDK enforcement; it
  is not target-35 hardening or a Play Store eligibility claim.
- ABI variants are **`arm` → `armeabi-v7a`**, **`aarch64` → `arm64-v8a`** and
  **`x86_64` → `x86_64`**. Processor marketing alone does not establish the Android
  userspace ABI. No physical Samsung or ARM runtime result has been measured.
- Each CI job currently uses a fresh **ephemeral unofficial review signer** and
  deletes its private key. The measured certificate identifies that artifact,
  not Termux or the original publisher. Rebuilds/other ABI jobs need not share
  an update-compatible signing identity. Stable production signing is not set up.
- The release app is non-debuggable, requests only `INTERNET`, disables backup,
  declares platform cleartext traffic disabled, and does not export a command
  API. **Native tools can still make cleartext connections when explicitly
  invoked**; the manifest is not a firewall for curl/OpenSSH/the whole toolbox.
  These are scoped safeguards, not a malware-free or whole-system security claim.

## Measured x86_64 artifact — not a Samsung ABI choice

- [Download the CI review artifact](https://github.com/shdwelf/Html5/actions/runs/46063037718/artifacts/15230695366).
  GitHub login may be required; the workflow retains it for **14 days**. The ZIP
  contains the APK, full receipt, compact summary, public signature output and
  `SHA256SUMS.txt`. **Do not try the x86_64 APK on the Samsung.**
- APK: **`zshaolin-modern-2.0.0-review-x86_64.apk`**, **285,549,547 bytes**
  (about 272 MiB). First launch expands/configures the toolbox in app-private
  storage; lean startup is not a small-download/storage promise.
- APK SHA-256:
  **`2e5d3bd17fa3f480c78d5c676b27d5b19c2c9a59f1cd11e6110ca33d7f78904a`**.
- Verified signature: **APK Signature Scheme v2**. Observed unofficial review
  certificate SHA-256:
  **`69f9bc76ea51629c8c3ebb0d271381b93a412fa5ec014daf5a3730edf9634cf0`**.
  This identifies this new signer; it is not independent upstream authentication.

The [retrieved compact summary](research/zshaolin-modern-x86_64-apk-summary.json)
is **22,860 bytes**, SHA-256
**`ab4d5ab684d74d5405118a41370e7e1c9d46643a50effda068cfb4a39a8182b5`**.
Five ordered compressed Checks chunks were reconstructed and checked against
that length/hash, the successful run/job **140721890980**, source/run identity,
all **16** listed source-file hashes, seven packaged helper/config/startup/notice
hashes and all five named non-skipped test cases. Networking was disabled before
installation; native tools, public-key SSH, PTY output and Exit actually ran.

**Local retrieval boundary:** the summary is verified locally; the large APK and
full receipt were measured by CI but not downloaded into this restricted
sandbox. The full **120,521-byte** receipt is referenced by SHA-256
**`bb81c50248ec5a0a1a8c5c4a30c9cbbf6a96633c343b4ef792aee5afde269ecd`**
in the summary. That is a CI-reported hash, **not a local rehash of full receipt
or APK bytes**. The earlier review-artifact download failed at its Azure Blob
redirect; the public GitHub artifact link is the handoff path. After downloading,
verify the extracted APK against its SHA-256; do not compare that hash to the ZIP.

CI-reported upgraded binary versions include Zsh **5.9.2-2**, coreutils **9.12**,
Emacs **31.1-3**, Vim **9.2.1400**, OpenSSH **10.6p2**, GnuPG **2.5.24**, OpenSSL
**1:3.6.5**, Perl **5.44.0-1**, Lua **5.4.9**, FFmpeg **9.1**, ImageMagick
**7.1.2.36**, SoX **14.9.0**, Git **2.56.1** and curl **8.23.0**. These are measured
package labels, not a claim that every package is vulnerability-free or will
remain the latest release.

## ARM artifacts — compiled and measured, not runtime-tested

Both artifacts below were published by successful run **46063968229**, using the
same reviewed source **`64218e56d82a3949d3884fca5cd912f9f405042a`**. Each includes
the **253-package / 51-command** toolbox, non-debuggable app, terminal JNI,
verified v2 signature, the matching pinned bootstrap and all seven reviewed
security/startup/licence assets. CI did **not execute** the ARM test APKs or tools.

| ABI | GitHub artifact / APK inside | APK bytes |
| --- | --- | ---: |
| **`armeabi-v7a`** | [ARMv7 review download](https://github.com/shdwelf/Html5/actions/runs/46063968229/artifacts/15230136365) — `zshaolin-modern-2.0.0-review-armeabi-v7a.apk` | 265,398,239 |
| **`arm64-v8a`** | [ARM64 review download](https://github.com/shdwelf/Html5/actions/runs/46063968229/artifacts/15230621287) — `zshaolin-modern-2.0.0-review-arm64-v8a.apk` | 273,688,885 |

**Extracted APK SHA-256:**

- ARMv7: **`7b03b4200854e47cf85fed3cb718616c908e7a2f95e35481f6d1422bea295b36`**.
- ARM64: **`14e4cf1328f954ce075f3c851da64c17afee71f2d819c325cdb1164eecd54ebe`**.

**Observed unofficial certificate SHA-256:**

- ARMv7: **`41c50f095d3c9f8c9de4470bb2c6780195c24932bea3a73212e60988e94291c1`**.
- ARM64: **`e12eded406adcc252bee6116e8031ca0e9071e82bf729b8ddf3bace0872acfce`**.

The jobs generated **different ephemeral signers**; these are not upstream keys,
a stable update identity, or interchangeable update-compatible APK variants.
Artifact retention is 14 days. The large APKs/full receipts were measured by CI,
**not downloaded/rehash-verified locally**.

Retrieved measured compact summaries:

- [ARMv7](research/zshaolin-modern-arm-apk-summary.json): **22,291 bytes**, SHA-256
  **`8b0894321cdb977b6bbe30cdd5f3e3bac4bd00f14ec0bce613121990d4f8edd1`**,
  job **140724866005**, four ordered Checks chunks.
- [ARM64](research/zshaolin-modern-aarch64-apk-summary.json): **22,301 bytes**, SHA-256
  **`69d39b6873cffba28bd876942ece3ac505dc7e55023db599a5591373830d4213`**,
  job **140724866094**, four ordered Checks chunks.

Both retain empty instrumentation suites and **false** ARM-execution,
physical-Samsung, root and VPN-verification fields. All 16 source hashes and
seven packaged asset hashes matched local reviewed source. The
[local transport-verification record](research/zshaolin-modern-evidence-transport.json)
records all three summaries, artifact metadata and retrieval boundaries; it is
not a replacement full dependency receipt or local APK-byte verification.

**Choose only after checking the actual userspace ABI.** For an already
authorized debugging connection on the owner's own computer, this optional
read-only query returns CPU ABI labels, not an IMEI/serial:

```sh
adb shell getprop ro.product.cpu.abilist
```

A 64-bit CPU is not proof of a 64-bit Android userspace. Do not force-install a
mismatched APK, uninstall existing Termux, or change bootloader/profile/security
state to try either review build. No exact-SM-A037U1 runtime compatibility is
claimed; the APK does not root, decrypt or add Secure Folder support.

## Toolbox and startup

The [input specification](../tools/zshaolin-modern/inputs.json) requests **51
packages** and requires **51 command names**, plus their authenticated dependency
closure. Requested names and command names are checked separately: for example,
`vitetris` supplies `tetris`, `lua54` supplies `lua5.4`, and Vim's authenticated
post-install alternative supplies the `vim` link.

| Group | Examples retained |
| --- | --- |
| Shell / GNU and system utilities | Zsh, coreutils, findutils, util-linux, BusyBox, tmux, htop, ncurses tools |
| Editors / text | Emacs, Vim, Nano, groff, mandoc, awk, grep, sed, diff |
| Crypto / files | GnuPG, OpenSSL tools, pinentry, steghide, Midnight Commander |
| Languages | Perl, Lua 5.4 |
| Media | FFmpeg/ffprobe, ImageMagick CLI, SoX, x264, Speex, liboggz, dcraw, jhead |
| Network / recovery | OpenSSH, Git, curl, rsync, lynx, ncdu, TestDisk/PhotoRec |
| Games | libcaca, sl, curseofwar, vitetris/tetris, NetHack |

No SSH daemon, SSH agent, HTTP provisioning service, root prompt, package download,
editor or media program is automatically started with the terminal. Zsh startup
disables persistent shell history. Programs deliberately invoked later can have
their own state, history and network behavior; this is not a claim that the full
toolbox never writes data or connects to networks.

Explicit legacy changes remain in `inputs.json`: old GnuPG keyserver helpers are
replaced by current GnuPG/dirmngr; unavailable games have named modern
substitutes; ImageMagick's X11 viewers are not a bundled desktop; `shred` is **not**
a reliable physical-erasure guarantee on flash storage. No obsolete component is
silently counted as rebuilt.

## SSH remediation and owner-controlled use

The historical client-private-key-over-HTTP provisioning path is **removed**.
The replacement `z-ssh` accepts only an owner-supplied **public** key in the
app-private `$HOME/.ssh/authorized_keys`. It refuses private-key blocks,
`authorized_keys` command/options records, missing keys and symlinked SSH state.
It generates only a private **server host key**, locally with restrictive modes;
that host key is not a client authentication key to serve or export.

```sh
z-ssh help
# After installing your own PUBLIC key in $HOME/.ssh/authorized_keys:
z-ssh start
```

`start` explicitly runs SSH **in the foreground**, **127.0.0.1:2222 only**, with
public-key authentication. Password/keyboard-interactive authentication,
forwarding and HTTP setup are disabled; Ctrl-C stops it. A directly invoked
`sshd` also receives a hardened default configuration. The helper's configuration
forces a login-Zsh session rather than exposing arbitrary SSH subsystems.
The default is not a remote network listener or a VPN. Previously exposed client
private keys must be rotated; deleting the old server cannot retract copies.

## Build and mandatory measured gates

The [workflow](../.github/workflows/zshaolin-modern-apk.yml) is dispatch-gated for
native compilation. Local/source controls also run on relevant pushes and pull
requests. First validate x86_64 before requesting the ARM variants:

```sh
python3 -m unittest discover -s tests -p zshaolin_modern_test.py -v
python3 -m unittest discover -s tests -p 'android_*_review_test.py' -v
gh workflow run zshaolin-modern-apk.yml --ref arena/74f27a74-html5 \
  -f 'architectures=["x86_64"]'
```

The pipeline:

1. Hash-verifies pinned terminal-source and recipe/keyring archives; resolves an
   isolated APT dependency closure using signed indexes and SHA-256, never host
   dpkg state or unauthenticated package fallback. Records actual versions,
   package hashes/URLs, signed-index hashes and maintainer-script hashes.
2. Stages upstream Android `.deb` binaries and a SHA-pinned bootstrap inside the
   APK. **Only the app and terminal JNI are compiled here**; downloaded upstream
   binaries are not described as self-compiled.
3. Compiles with Java 17 / Gradle 8.7 / AGP 8.6.1 / NDK 27.2.12479018; requires
   release APK, release test APK, terminal JNI and lint success.
4. For x86_64, disables emulator mobile/Wi-Fi networking and verifies airplane
   and Wi-Fi settings again **before** payload setup. Requires explicit
   disposable-CI consent and emulator hardware; never targets a personal prefix.
5. Requires all five exact instrumentation cases, with **no failures or skips**:
   installed package/command state, actual native tools, no automatic listeners
   and keyless refusal, synthetic loopback public-key SSH, real PTY and Exit
   lifecycle. SSH policy parsing normalizes OpenSSH keyword casing, not insecure
   authentication values; the allowed listener set must be exact.
6. Runs `apksigner verify`, measures the actual certificate, checks package ID,
   target/non-debuggable state, bootstrap and every packaged `.deb`, and compares
   the packaged SSH/startup assets with reviewed source. Records APK SHA-256,
   size, source-file hashes and actual test XML hashes/case names.
7. Publishes the APK **only after those gates**. ARM builds record signature and
   payload measurements separately; they must not inherit an x86_64 or physical
   phone execution claim. Failure reports never become a delivery receipt.

The full dependency inventory belongs in `apk-receipt.json`; a compact hashed
summary is also transported through bounded Checks annotations. Reports are not
a substitute for the artifact bytes, an independent publisher trust anchor,
whole-program testing or exact-device compatibility. Review/source artifacts
expire after **14 days** under the current workflow.

## Licences and corresponding-source limits

- The modified legacy SSH helper retains its GPLv3-or-later notice and the GPLv3
  text. The native app's source/build files are in this repository.
- The pinned Termux source's `LICENSE.md` identifies GPLv3-only with Apache-2.0
  exceptions for inherited Android terminal code. Its exact licence statement,
  the Apache-2.0 text and an attribution `NOTICE` are included in APK assets and
  installed under `$PREFIX/share/zshaolin/`; GPLv3 text is also installed at
  `$PREFIX/share/ZSHAOLIN-COPYING`. Preserve upstream source copyright headers
  and licence/notice requirements; do not relabel everything as one licence.
- Upstream GNU, SSH, media, editor and game packages retain **their own mixed
  licences**, not blanket permission from ZShaolin's `COPYING`. Their exact
  binary versions and hashes are measured, but a signed APT index is not a
  licence-compliance certificate or a corresponding-source archive.
- CI preserves the pinned Termux source archive, recipe archive and local
  app/helper/build source separately from the APK. The recipe snapshot is a
  **reference/keyring pin**, not proof every live APT binary was built from that
  commit. Full matching upstream source tarballs, binary-to-recipe correspondence,
  all dependency-specific notices and complete corresponding-source fulfillment
  have **not been independently established for every native dependency**.
- Before wider redistribution, resolve those per-package obligations and provide
  the required matching source/build patches and notices with equivalent access.
  Fourteen-day review artifacts are not a durable public source offer. This is a
  technical **review build**, not a claim of distribution-complete clearance.

No private signing key, SSH runtime home, synthetic client private key, phone
log, raw screenshot, device identifier or user profile is a source deliverable.
