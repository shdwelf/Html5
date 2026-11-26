# PuTTY → Android, SDF validation and free shell accounts

Report-series date: **17 November 2026**; the dated filename is retained for
continuity, not used as an acquisition timestamp. GitHub reports the successful
build's start as **2026-11-26T14:31:55Z**. Individual page-fetch timestamps were
not captured in the summarized source register; no same-day retrieval is inferred
from the filename. Run IDs and exact source commits identify the build evidence.

Public-documentation investigation plus a source-based Android review port.
This is not an endorsement of a public shell provider, a production security
certification or an account-validation result.

## 1. GitHub first, then metasearch

GitHub repository searches were run first (`putty in:name`, 1,753 matches as
returned, first ten by stars; `putty android`, seven matches). The names alone
were not treated as proof that a working Android PuTTY port existed:

| Inspected candidate | Source-checked finding | Decision |
| --- | --- | --- |
| [`github/putty`](https://github.com/github/putty) | Archived client-testing mirror | Not the current release source |
| [`rhuijben/putty`](https://github.com/rhuijben/putty) | Useful Unix/Plink/CMake source inspection; returned release tags stopped at 0.83, while the official site lists 0.85 | Do not silently build the older mirror as current |
| [`Windows-Search/PuttyForAndroid`](https://github.com/Windows-Search/PuttyForAndroid/tree/b62cf01918427125577c135e9944ea1478a90eed) | Complete returned tree had no Android application/native implementation; keystore-named contents were not opened or used | Not selected as a working port |
| [`teliy/SeaShell`](https://github.com/teliy/SeaShell/tree/5cf608b97306d64dba110781a7804f01308f0bcf) | Kotlin/xterm.js + JSch (`com.github.mwiede:jsch:0.2.25`), GPLv3; README discloses password storage in SharedPreferences | An alternative SSH client, **not** PuTTY source; not copied or installed |
| [`alexandrosnt/Reach`](https://github.com/alexandrosnt/Reach/blob/b6819691ea963ace7f24bf7ba9b99a596b5f9cc2/src-tauri/Cargo.toml) | Rust/Tauri; manifest uses `russh` | Alternative, not a PuTTY port |
| [Termux's actual `x11-packages/putty` recipe](https://github.com/termux/termux-packages/blob/f917b2394074478ade9251ec8199d3f617bb5ec5/x11-packages/putty/build.sh) | Real 0.85 source package, with GTK/X11 dependencies and the same source SHA-256 published upstream | Confirms a real Android packaging path, but not a standalone native-UI APK |

Metasearch then used the requested [searx.space](https://searx.space/) directory,
[BareSearch](https://baresearch.org/) and
[Utilibre](https://search.utilibre.org/). Both latter instances returned general
PuTTY results with `!mwmbl`, but several narrow Android/SDF queries rendered
“No results.” A fallback
[ononoki PuTTY/Android query](https://searx.ononoki.org/search?q=PuTTY+Android)
returned a genuine multi-engine result set with the official PuTTY pages and
third-party client/APK claims. Its free-shell query led to Blinkenshell;
Utilibre's freeshell query led to freeshell.de. **Provider facts below were
checked on their own sites**, not inferred from snippets. Some SDF searches
were mostly irrelevant acronym results; another instance returned only its
front page, and a fetch failed. These are retrieval limitations, not evidence
that ports or validation methods do not exist.

The [structured evidence register](research/putty-sdf-free-shell-sources-2026-11-17.json)
retains exact queries, outcomes, inspected revisions, primary URLs and limits.
It summarizes returned text; it does not pretend to be a raw-page archive or
comprehensive search of every GitHub repository/SearXNG engine.

## 2. A genuine PuTTY-source Android review port

[Official PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/) lists
**0.85, released 16 August 2026**. The
[official FAQ A.3](https://www.chiark.greenend.org.uk/~sgtatham/putty/faq.html#faq-ports)
says there is no official Android/iOS port. We must not label a random
“PuTTY APK,” JSch application or desktop ADB-enabled PuTTY fork as that release.

The implementation is [`apps/putty-android/`](../apps/putty-android/):

- Cross-compile **the actual official PuTTY 0.85 Plink source** to Android
  ARM64 and x86-64; use a small private PTY/JNI bridge and a Java Android UI.
  The SSH engine is not replaced. PuTTY's Windows/GTK GUI is **not** ported.
  [FAQ A.4.2](https://www.chiark.greenend.org.uk/~sgtatham/putty/faq.html#faq-ipc)
  itself recommends Plink subprocess integration for another application.
- Fetch only pinned official HTTPS source locations. Require both source
  SHA-256 and a valid detached signature from the full pinned 2026 release
  certificate. The complete upstream MIT licence is included unchanged.
- Android **9 / API 28 minimum**, target **35**, ABIs `arm64-v8a`, `x86_64`.
  Minimum SDK / ABI compilation are not runtime or physical-device guarantees.
- Require a complete **`SHA256:` server host-key pin** plus an explicit
  destination confirmation. No wildcards, “accept any key,” credential fallback
  to HTTP/telnet, agent use/forwarding, X11 or sharing.
- Passwords and keyboard-interactive responses cross the PTY, never process
  arguments, environment variables, profiles or app logs. Masked input is the
  default; switching masking clears existing input. No local input echo/history.
- Memory-only output is bounded to 32,768 UTF-16 code units; escape/control
  strings are removed rather than interpreted. No WebView, remote hyperlinks,
  OSC clipboard, analytics, auto-update downloader or remote command endpoint.
- Foreground-only: backgrounding terminates the child and clears input/output;
  screenshot protection and backup exclusions are configured. The keyboard or
  remote host can still observe/echo input; Java/OS memory erasure is not promised.
- **Line-oriented `TERM=dumb` only**, not a full VT/xterm terminal. No full-screen
  editor/menu/tmux guarantee, SFTP UI, private-key import, saved profiles or
  tunnels in this first version. Public-key-only and menu-driven signup flows
  may need a maintained full-featured SSH client instead.

### Source pins

| Input | Exact pin / provenance |
| --- | --- |
| [Official `putty-0.85.tar.gz`](https://the.earth.li/~sgtatham/putty/0.85/putty-0.85.tar.gz) | SHA-256 `13fd4db2936d03b73812a7bcc2a658e4dd29cc776a56c3670a7fc6f1a0ee8af8` from [official sums](https://the.earth.li/~sgtatham/putty/0.85/sha256sums), also matched by the pinned Termux recipe |
| [Release certificate](https://www.chiark.greenend.org.uk/~sgtatham/putty/keys/release-2026.asc) | Full fingerprint `1A07DAC0F220CF12248EA7195C67D0F88BC3E5B5` from the [official keys page](https://www.chiark.greenend.org.uk/~sgtatham/putty/keys.html) |
| [Licence](https://www.chiark.greenend.org.uk/~sgtatham/putty/licence.html) | MIT permits adaptation/redistribution with notices; no warranty |

The certificate pin came from the official HTTPS page; an independent offline
web-of-trust chain is **not** claimed. Upstream's release signature does **not**
sign this Android UI, APK or runner build. The APK's own signing identity is a
**disposable CI debug certificate**, not PuTTY's release identity or a stable
production update key. The installed review variant deliberately has Android
`debuggable=false`. Do not use sensitive credentials before review/device tests.

### Build and controls

The [source-build workflow](../.github/workflows/putty-android.yml) requires
core controls, signed-source verification, two-ABI native compilation, Android
lint, synthetic Android SSH/lifecycle tests, APK signature verification and a
bounded delivery receipt. It checks 16 KiB ELF alignment, **not** a 16 KiB-page
runtime. It may commit the requested small APK and evidence only to this session
branch after its gates pass. No signing private key is committed.

**Delivered review APK:**
[`unofficial-putty-0.85-review.apk`](../research/putty-android/unofficial-putty-0.85-review.apk),
**792,988 bytes / 774.402 KiB** compressed (installed footprint not measured).
SHA-256:
`644b8c16d1a1fdf8cf77f336434d310b5075bc10304d7b9a3e91b132a314a9cd`.

Successful [build 45839948669](https://github.com/shdwelf/Html5/actions/runs/45839948669)
measured source **`cf84be50547cd4507a2bc5b732af9f525b6d92be`** and passed
**96 core + 9 source-fetch + 8 Android emulator controls**, including actual
synthetic SSH authentication and command execution, wrong-host-key refusal and
lifecycle privacy. APK v2 signature verification, full source origin checks,
exact packaged native bytes and lint passed. The artifact was fetched from
this session branch and its SHA-256 independently recomputed locally.

The [build receipt](../research/putty-android/build-receipt.json) retains exact
native sizes/digests, signing-certificate fingerprint, tested environment and
unverified gates. Later documentation changes are not called a new APK build.
A synthetic SSH test is **not** a public-provider login or SDF membership
validation. Physical ARM64, other Android versions, 16 KiB runtime, production
signing and full VT/SFTP/key-import features remain unverified/unimplemented as
explicitly listed. See also the [round-94 completion record](backlog-execution-round-94-2026-11-17.md).

## 3. SDF / freeshell: resolve the hostname mistake first

The supplied Markdown displayed **`freeshell.org`** but linked to
**`http://freewheel.org`**. Public source checks resolved the mismatch:

- [`https://freeshell.org/`](https://freeshell.org/) served the SDF Public Access
  UNIX System homepage with official `sdf.org` signup/member-support links.
- The supplied `freewheel.org` link redirected to a **GoDaddy domain-for-sale
  page**, not an SDF account portal. No contact/price/signup form was submitted.
  Do **not** send an SDF password, validation information or money there.
- [`tty.sdf.org`](https://sdf.org/?faq?BASICS?08) is documented as an **SSH shell
  host alias**, not an HTTP account-validation API. Use SSH, ordinarily port 22,
  not `http://tty.sdf.org` as a password endpoint.

### What the primary documentation actually establishes

| Question | Source-checked answer |
| --- | --- |
| How do I sign up? | [SDF signup](https://sdf.org/?signup): `ssh new@sdf.org` or SDF's own web/browser options. No signup was performed. |
| Where is my shell? | [SDF host FAQ](https://sdf.org/?faq?BASICS?08): `tty.sdf.org`; use your own username. The [public `menu` account](https://sdf.org/?ssh) is for vintage systems, not your personal account. |
| How do I get current validation instructions? | [Official FAQ BASICS 07](https://sdf.org/?faq?BASICS?07): type **`validate` at the shell**. This has not been run on anyone's account. |
| Is the basic account free? | [Join page](https://sdf.org/?join): **USERS free**, with the listed extra services after validation. This is not proof that every validation route costs zero or that an unvalidated account has every feature. |
| Can an existing member help? | Same join page: **MetaARPA can validate a new user's account**. A legitimate sponsor may choose to help; we did not impersonate one or request/bypass validation. |
| Is there an educational route? | Same page: qualifying instructors can validate enrolled students. Eligibility and any classroom changes require SDF's process. |
| Are enhancements separate? | **ARPA $36 one-time** for outbound SSH/development and other benefits; **MetaARPA $11 quarterly**, ordinarily requiring ARPA (waiver link published). These are advertised enhancement tiers, **not** a quote for basic validation. No money was sent. |
| What is the exact current basic-validation fee? | **Not established from the fetched current primary pages.** Old secondary “mail $1” accounts are not treated as a current price. Read the live `validate` instructions or ask membership support. |
| What is the current trusted SSH host key? | **Not independently established here.** No key was guessed, scanned and called trusted, or copied from an old tutorial into the app. Obtain it from SDF over a trusted channel before authentication. |
| Was this user's account validated? | **No.** No specific authorized account or credentials were supplied; no login/account enumeration, validation, recovery action, payment or credential test occurred. |

A safe **owner-performed** sequence is:

1. Use SDF's official signup/member-support links, not the misspelled domain.
2. Obtain and independently verify the current host-key fingerprint for the
   exact host. `ssh-keyscan` alone is not authenticated identity evidence.
3. Connect to your own account over SSH; keep password and private keys out of
   chat. Do not lower checks if the host key differs.
4. Run `validate` **to read current instructions**. Review any fee or membership
   effect before taking action; a willing MetaARPA sponsor or qualifying
   educational route is distinct from paying for enhancements.
5. Check the resulting membership status using SDF's own instructions. A banner,
   successful SSH login, a working APK and an account's membership are different
   facts. No automation here claims one proves another.

Some SDF user tutorials retain old software, endpoint or “SSL” wording. Prefer
current main-site instructions and SSH2; do not copy obsolete DSA/MD5 examples or
accept a host-key change without independent confirmation.

## 4. Other free shell accounts: practical comparison

**Documentation availability is not an accepted signup or a successful login.**
These are shared community systems, not free root-access VPSs. No account was
created and no provider was probed with SSH. Read resource/abuse rules; never
upload recovery phrases, OpenPGP secret keys, production secrets or private
backups to a shared public shell.

| Provider | Free access / signup evidence | Friction, limits and suitability |
| --- | --- | --- |
| **[envs.net](https://envs.net/)** | Homepage explicitly says always free; [request form](https://envs.net/signup/) asks username, email, interest and an **OpenSSH public key**, minimum **16** | Manual response/approval and community rules. [Help](https://help.envs.net/help/#ssh) lists SSH ports 22/2222 and public host-key fingerprints, not live key verification here. A strong Linux/community candidate if approved; this APK has no private-key import yet. |
| **[tilde.club](https://tilde.club/)** | Community-supported shared Unix; [signup form](https://tilde.club/signup/) asks email/interest/**public** key, minimum **13**; sampled form/FAQ lists no mandatory payment step | Manual approval, code of conduct, [FAQ](https://tilde.club/wiki/faq.html) quota **1 GB soft / 3 GB hard**, one-week grace. Good for learning/social/web use, not guaranteed instant provisioning or production hosting. |
| **[freeshell.de](https://freeshell.de/)** | Non-profit free-shell provider; advertises Ubuntu 24.04 LTS and web/mail/database/container facilities | [Current activation process](https://freeshell.de/get-started/): request → email token → **physically post a postcard containing the token** → wait for activation. Postage/time are not zero. No token requested or postcard sent. Different provider from SDF. |
| **[tilde.institute](https://tilde.institute/)** | Public-access OpenBSD community; current [joining page](https://tilde.institute/signup) directs people to TLS IRC `institute.tilde.chat:6697`, participate and request an account | Human/community process, not an automatic web form; sampled page lists no payment step. [FAQ](https://tilde.institute/faq) restricts abuse/mining and resource-heavy services; no extra firewall ports promised. |
| **[Blinkenshell](https://blinkenshell.org/docs/signup-process/)** | Documented **free basic** route: email, rules/shell quiz, NickServ, two vouches, SMS (or admin contact if unavailable); at least an hour before vouching | Real social/verification cost, not one-click. [Basic rules](https://blinkenshell.org/wiki/Info/Rules) disallow bots/bouncers/servers, account sharing, scanning and for-profit use. [Supporter](https://blinkenshell.org/docs/supporter/) is separately **€3/month or 400 SEK/year**; signup also advertises optional **50 SEK** instant activation. We did not pay or use that option. A full VT terminal may be needed for its menus. |
| **[tilde.team](https://tilde.team/)** — **hold** | Says always free and still has a signup form | Homepage's **August 2026 compromise/outage notice explicitly says SSH access is currently disabled** while services are moved. A signup form is not evidence of restoration. Do not recommend it as a currently working shell without a newer official restoration notice. |

**Practical picks:** envs.net for a Linux/community request, tilde.club for the
social/web-learning model, tilde.institute for OpenBSD interest, or freeshell.de
if postcard validation fits. SDF remains suitable for its own community/retro
features once its membership/validation restrictions are understood. None has
been independently operationally or security-audited by this report. Policies,
fees and signup availability can change; recheck before applying.

## 5. Backlog and non-actions

This is new, scoped mobile/SSH follow-through. The normalized original register
still has **31 terminal rows: 30 done and T9.3 declined**. No old row is
re-closed, no aggregate historical stream label is promoted into a new
completion claim, and no owner/device/financial gate is cleared by public
research or a synthetic emulator.

The earlier archive/OpenPGP work, including fuzzy discovery with exact
cryptographic-identity gates, is unchanged. No full graph scan is restarted.
No unapproved key recovery, public account login, donation/payment, mail/IRC
message, signup-form submission or WordPress publication is part of this work.
