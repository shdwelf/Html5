# Unofficial PuTTY / Plink for Android — review port

An **actual PuTTY-source-based Android front end**, not a renamed JSch client and
not an official release or endorsement by the PuTTY team. It cross-compiles
**PuTTY 0.85's Plink** for `arm64-v8a` and `x86_64`, then runs it in a private
PTY from an Android Java activity. The upstream SSH implementation and
cryptography are not rewritten. The Windows/GTK PuTTY GUI is **not** ported.

## Scope before use

- Android **9 / API 28 minimum**, target API 35. ABI builds do not prove device
  compatibility. The receipt lists the environments actually tested.
- **Line-oriented `TERM=dumb` display only**, not a VT/xterm terminal. It strips
  terminal escape sequences and bounds output to 32,768 UTF-16 code units.
  Use simple line-based commands, not full-screen editors, menus or tmux.
- SSH2 with a **mandatory complete SHA-256 host-key fingerprint**, obtained over
  an independently trusted channel. No wildcard accept, TOFU bypass, telnet or
  HTTP fallback. Wrong keys must fail before a password prompt.
- Password / keyboard-interactive input goes through a PTY, **not argv, an
  environment variable, saved profile or app log**. The user must wait for the
  expected prompt and keep **Mask input** selected for secrets. The remote host
  can still echo anything sent; the input method sees typed text. Java/Android
  memory is not guaranteed to be wiped. There is no input history or transcript
  export. Queued Java input byte arrays are zeroed after use.
- Foreground-only: backgrounding disconnects, kills the child, clears input and
  display. Screenshot protection and backup exclusions are set. No background
  service, notification, analytics, update downloader or third-party runtime UI.
- No SFTP, PPK/private-key import, saved sessions, tunnels or agent forwarding in
  this first version. Agent use, agent forwarding, X11 and sharing are disabled.
- The installable review APK uses a **disposable CI debug signing certificate**
  (but the installed app's `debuggable` flag is **false**). It is **not a
  production signing identity**. Different runner builds may not upgrade over
  one another; do not uninstall an existing app without understanding data loss.
  Review/test before entering sensitive credentials. No physical-device claim.

## Build and integrity

```sh
# JDK 17, Python 3.12+, gpg/gpgv, CMake, Ninja, Gradle 8.7,
# Android SDK/build-tools 35 and NDK 27.2.12479018 are required.
export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/27.2.12479018"
bash tools/putty-android/test-core.sh
python3 tools/putty-android/fetch-source.py
bash tools/putty-android/build-native.sh
cd apps/putty-android
./gradlew assembleDebug assembleDebugAndroidTest lintDebug
```

The source fetcher permits only official HTTPS source hosts, limits downloads,
checks the pinned source archive SHA-256
`13fd4db2936d03b73812a7bcc2a658e4dd29cc776a56c3670a7fc6f1a0ee8af8`,
and requires a valid detached release signature from the full pinned 2026
release-certificate fingerprint
`1A07DAC0F220CF12248EA7195C67D0F88BC3E5B5`. The pin was source-checked against
[the official key page](https://www.chiark.greenend.org.uk/~sgtatham/putty/keys.html);
no independent offline web-of-trust attestation is claimed. PuTTY's complete MIT
licence and a source-verification receipt are bundled in the APK and shown in
Help. Build/download/native outputs remain ignored, except the explicitly
requested small APK and its delivery evidence under `research/putty-android/`.

The [workflow](../../.github/workflows/putty-android.yml) builds both ABIs,
checks lint and 16 KiB ELF load alignment, verifies the APK signature and native
bytes, and runs Android API 35 x86_64 instrumentation against a **disposable,
loopback-only runner SSH server**. Controls cover Plink `-V`, a wrong host key,
password-over-PTY login/command execution, failed exec, disconnect/reap and
activity privacy/lifecycle defaults. It may deliver the artifact to **this
session branch only** after all gates pass. Alignment checks are not a 16 KiB
runtime test; ARM64 and owner-device testing remain separate gates.

## SDF: instructions, not account validation

`tty.sdf.org` is SDF's documented **SSH** endpoint, not an HTTP validation API.
Create an account only through SDF's own signup instructions (`ssh new@sdf.org`)
and use only your own authorized account. After authenticating the SSH server
and signing into that account, run `validate` for **current** instructions. The
app never runs it automatically. A successful SSH connection does **not** certify
SDF membership. No SDF host-key fingerprint is embedded because none has been
independently authenticated in this investigation.

The supplied link text `freeshell.org` had an `http://freewheel.org` destination;
those names must **not** be treated as equivalent or used interchangeably for
credentials. No account signup/login/validation/payment has been performed.

Primary references: [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/),
[licence](https://www.chiark.greenend.org.uk/~sgtatham/putty/licence.html),
[SDF signup](https://sdf.org/?signup), [SDF membership](https://sdf.org/?join),
[SDF validation pointer](https://sdf.org/?faq?BASICS?07),
[SDF SSH host aliases](https://sdf.org/?faq?BASICS?08).
