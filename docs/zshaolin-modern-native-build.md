# ZShaolin Modern — native full-toolbox review build

## Status and identity

This is an **unofficial native Android application**, not a JavaScript terminal,
a browser-to-shell bridge, an upstream ZShaolin release or an official Termux
release. The selected scope is **`full_tools_lean_startup`**: keep the full modern
toolbox, but start only an interactive Zsh attached to a real terminal PTY.
Lean startup does **not** mean a small APK or a small installed dependency tree.

**Current validation:** the x86_64 APK, terminal JNI and test APK have compiled
and passed Android lint. In
[run **46061380083**](https://github.com/shdwelf/Html5/actions/runs/46061380083),
source **`721ccd567d598a89cff00b36ee2a0b49196b517f`**, **all five Android 13
runtime tests passed with networking disabled**. The final delivery step still
failed: after `apksigner verify` exited zero, the certificate parser rejected the
standard `Signer #1 certificate` output because it wrongly required a colon.
The parser correction is regression-tested against actual earlier build-tools
reports as well as synthetic formats. A new full validation is required; there
is not yet an accepted APK handoff, ARM execution result or current merged delivery.

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
- The release app is non-debuggable, requests only `INTERNET`, disables backup
  and cleartext network traffic, and does not export a command-execution API.
  These are scoped safeguards, not a malware-free or whole-system security claim.

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
