# Secure Folder, Saurik/Cydia, Ghidra and passive domain evidence

## Conclusions and scope

- **Secure Folder is not the work-profile briefcase.** Samsung lists the Galaxy
  A03s, explicitly including **SM-A037U1**, under **Android – Others / N/A** in
  its Knox device classification. Samsung explains that this category has
  limited/no Knox compatibility but can support **generic Android Enterprise**.
  This is stronger model-specific evidence than a generic Galaxy tutorial, but
  it is **not a test of Secure Folder on this installed firmware** and does not
  establish that ordinary Android file encryption or all trusted hardware is
  absent. [S1][S2]
- **Jay Freeman (saurik) has a documented historical connection to `saurik.net`**,
  not just `saurik.com`. The evidence is his dated public writing, not a guess
  from shared hosting. Current domain registrant identity was not verified.
  [F1][F2][F3]
- **Cydia is an iOS APT package-manager frontend**, not a Samsung Android 13
  rooting package or a universal encryption key. The desktop Impactor, on-device
  Eraser and Substrate are different projects with different purposes. [F4][F5][F6]
- The historical Android **“Master Key”** work concerns APK verification/parser
  discrepancies. Freeman's article explicitly places its `local.prop` rooting
  instructions at approximately **Android 4.1 and earlier**. This does not
  establish a working method for this Android 13 A03s or recover a publisher's
  private signing key. [F7]
- **Ghidra analysis, executable encryption metadata, signature verification and
  phone-data decryption are separate results.** No owner iOS device, iOS build,
  encrypted app image, passcode or keys were supplied; no jailbreak, Secure
  Folder access or physical Samsung root is verified.

This review uses public webpages, dated archives, a pinned third-party source
mirror and a separately gated public-binary static workflow. No profile was
created/deleted, administrator removed, security policy changed, account signed
in, phone unlocked/wiped/flashed or third-party service scanned. No raw phone
screenshots, device identifiers, account details or private IRC logs are included.

## 1. Secure Folder on the exact A03s

The owner's sanitized evidence identifies **SM-A037U1/DS**, **Android 13 / One UI
Core 5.1**, firmware **`A037U1UESBDYI1`**, and Android patch **July 1, 2025**.
It does not show a Secure Folder menu or its successful setup. See the
[profile investigation](android-work-profile-private-mode.md) and
[rooting prerequisites](android-a037u1-rooting-review.md).

### What the Samsung evidence actually establishes

1. The Samsung Knox team's device list explicitly includes **SM-A037U1** in the
   A03s row marked **Android – Others**, **N/A**. The article concerns ending
   *new enrollment for Knox Guard client 1.0 on P/Q OS*; it is **not evidence of
   this phone's current Knox Guard state, enrollment or lock**. [S1]
2. Samsung's category explanation distinguishes full **Secured by Knox** from
   **Android – Others**. It discusses missing Knox root-of-trust key support,
   lists KPE/Knox Service Plugin as unsupported, and nevertheless lists
   **Android Enterprise (Generic)** and selected cloud products as supported.
   Do not generalize this into “no encryption,” “no TEE,” “no management,” or
   “a work profile is impossible.” [S2]
3. The One UI Core article enumerates unsupported **KPE features**, including
   RKP, SDP and DualDAR. That is not a complete per-model consumer Secure Folder
   compatibility matrix. The dynamically rendered supported-device table
   returned no rows in one retrieval; the explicit A03s row above comes from the
   independently fetched Samsung blog, not an imagined table result. [S3]
4. Samsung's consumer guide describes an encrypted Knox-backed Secure Folder and
   a supported-device path **Settings → Security and privacy → More security
   settings → Secure Folder**. Its instructions alone do not establish support
   on this particular A03s firmware. [S4]

**Safe owner check:** use Settings search for **Secure Folder**, and report only
whether that setting exists and its help/support message. Do not create a
container, sign in, uninstall anything or disclose its password for this review.
If absent, do not install random “Secure Folder unlock” APKs, turn off SELinux or
root the phone to try to supply missing platform support. A briefcase-badged
work app can exist independently of this result. **Android Private Space needs
Android 15+**, not this phone's Android 13. [S5]

The approved native ZShaolin application is **primary-user-only** because of its
Termux-compatible hardcoded prefix. A work profile, Secure Folder or secondary
user is **not** a supported way to make it coexist with an existing Termux app.
Protect existing Termux data before any later installation decision; no uninstall
or data migration has been performed.

## 2. Freeman, `.net`, Cydia and the name collisions

| Evidence / project | What it establishes | What it does not establish |
| --- | --- | --- |
| Freeman's project index | First-person project index; Cydia is an iPhone APT frontend, Cycript a JavaScript/Objective-C bridge, Substrate a code-modification platform; also links historical Android exploit research. [F1] | Every site with a similar name is his, or those projects root current Android. |
| **2002-06-29 Chora/SVN announcement** | Explicitly names `mail.saurik.net/chora/`, emphasizes “.net, not .com,” and describes adding a redirect from the `.com` URL. The index links this announcement. [F2] | Current registration ownership or a currently working Chora installation. |
| **2003-09-02 Nmap+V message** | Describes connecting to `irc.saurik.com`; its illustrative server replies identify `irc.saurik.net`. Strong historical relation between the two IRC names. [F3] | A recovered conversation/channel log, a present server test or permission to scan it. |
| **Cydia / Telesphoreo** | UIKit frontend to Debian APT and a GNU/BSD userspace distribution for the iPhone. `.deb` repositories are not Android APK repositories. [F4] | An Android-native app, the jailbreak exploit itself or a decryption service. |
| **Desktop Cydia Impactor** | Author-linked GUI for IPA/iOS and APK/Android work; describes historical Master Key support. Its page warns that IPA installation requires a paid developer account since late 2019. [F5] | Current account-service operation, iOS-version compatibility or a jailbreak produced by sideloading alone. No account credentials were entered. |
| **`com.saurik.impactor` / Cydia Eraser** | Historical APT metadata names version **0.9.43** “Cydia Eraser,” describes unjailbreaking, and limits firmware to **7.1–10.3.3**. Older records used the Impactor name. [F6] | A harmless diagnostic to run on this phone; not the same binary as desktop Impactor. **Not executed.** |
| **Substrate / Cycript** | Code modification/bridging tools, as described by the author. [F1] | Automatically provide the prerequisite device privileges or a universal jailbreak. |
| **Android “Master Key”** | 2013-era APK verification/installation discrepancies, with separate exploitation and patch discussions. [F7] | Recovery of an RSA private key, Android 13 applicability or access to Samsung Secure Folder data. |

No iPhone/iPad model, SoC or complete iOS build was provided. A working-jailbreak
compatibility claim would require those facts plus a matching maintained tool
and a measured owner-device result. Old package dependencies and search snippets
cannot substitute for that evidence. No “latest compatible jailbreak” was chosen
or run.

## 3. What “encryption” means in this investigation

| Layer | Suitable evidence | Limit here |
| --- | --- | --- |
| Download identity | Exact package bytes and SHA-256 | A measured digest identifies bytes; it is not independently authenticated publisher identity. |
| Repository/package authenticity | A verified signature chain anchored to a separately trusted key | A legacy MD5 field from an HTTPS index is **not** that chain. |
| Mach-O executable encryption | Inspect each slice's `LC_ENCRYPTION_INFO` / `_64`, `cryptoff`, `cryptsize`, `cryptid` | Header metadata is not a decryption key. Zero/absent commands do not prove no data/embedded-resource encryption elsewhere. [E1] |
| Reverse engineering | Actual instruction recovery, named references and bounded decompilation | Ghidra is not a universal decryptor, key extractor, malware-free certificate or proof of exploit compatibility. |
| TSS / SHSH / APTicket | Device/firmware-specific authorization/signature evidence | Historical cached signatures are not Apple's private signing key or a key to user files. Freeman's iOS 6 article documents narrow applicability and unusable cached data. [E2][E3] |
| iOS user-data protection | Hardware/key hierarchy, per-file protection classes and authorized unlocked-key state | Apple describes class keys and a Secure Enclave isolated even from the main kernel. A kernel jailbreak alone is not proof of recovering those protected keys. [E4][E5] |
| Samsung Secure Folder | Exact supported model/firmware and authorized container access | Neither an iOS Cydia binary nor a Magisk static review establishes container decryption. |

Reading ciphertext as ARM instructions would not demonstrate meaningful
recovered code. The static workflow **refuses to analyze a selected slice with a
nonzero encryption `cryptid`** rather than altering it or attempting a DRM/key
bypass. It does not acquire installed apps, memory dumps, firmware or phone data.

## 4. Cydia source and binary review

### Qualified source observations, not a current-binary verdict

Canonical `git.saurik.com`/gitweb retrieval failed in this environment. A pinned
**third-party** mirror, **`autopear/Cydia@bb0ace74560c5c96c8dbefec00c8e3881c504558`**,
identifies `git://git.saurik.com/cydia.git` in its README. Its source is not thereby
authenticated as the author's current source or matched to a specific release
binary. The inspected `MobileCydia.mm` is **289,013 bytes**, Git blob
**`76a3a3f1e71d0d7f4b0b5d2eebc8d5093100b9b0`**, SHA-256
**`efb6b29f19f08e6772adf88510232e31483206c83bb64b38db54c6894d56967c`**;
its header states GPLv3-or-later. [F8]

Privacy/transport review leads in that historical source:

- Lines **242–247**, **9321–9323** obtain a device identifier using the older
  `uniqueIdentifier` API or MobileGestalt's `UniqueDeviceID`.
- Lines **7832–7855** construct source-check requests; `X-Unique-ID` is set when
  that value exists, without an HTTPS condition around that particular header.
  The additional `X-Cydia-Id` header is separately conditioned on
  `isCydiaSecure`. This is a specific source-path privacy lead, **not proof that
  every request discloses an ID or that a current build does so**.
- Lines **4552–4562** change a particular Cydia TSS URL to
  **`http://gs.apple.com/TSS/`**; lines **9384–9387** seed several **HTTP** repository
  URLs. Transport confidentiality, APT signature authentication and restore
  authorization are separate properties; plain HTTP alone does not prove
  arbitrary package forgery or recovery of cryptographic keys.

These observations justify checking exact versions, request scopes and package
verification in any future owner-authorized review. They are not malware
attribution, a whole-source audit or proof of current server behavior. Source
retrieval itself is **not** Ghidra decompilation.

### Fixed public native candidate and actual-analysis gate

The author-linked HTTPS APT index lists the historical candidate:

- package **`cydia`**, version **`1.1.30`**, architecture **`iphoneos-arm`**;
- **`debs/cydia_1.1.30_iphoneos-arm.deb`**, index size **1,292,624 bytes**;
- index MD5 **`bb0cdc40d3abac5b874972ad8a8b70a1`**. [F6]

This is an explicit **historical candidate**, **not a claim it is the latest
Cydia**. An HTTPS size/MD5 cross-check is not a modern repository-signature chain
or independent publisher-key authentication. The first acquisition measures a
SHA-256 before analysis; no binary-source reproducibility match is assumed.

[`tools/cydia-static-review/`](../tools/cydia-static-review/) and the
[dispatch-only workflow](../.github/workflows/cydia-static-review.yml) provide:

1. Bounded exact-entry archive reading, never package installation or maintainer
   script execution.
2. Per-slice Mach-O architecture, load-command/encryption and embedded-signature
   range inventory. A signature **range** is not cryptographic verification.
3. SHA-pinned **Ghidra 12.1.4 / Temurin 21**, an inert native positive control,
   time-bounded actual ARM/ARM64 analysis and at most four sampled decompilation
   hashes per input, prioritizing references to a fixed API list.
4. Measured JSON evidence only after checking native hashes, actual recovered
   instructions/functions, at least one completed decompilation per selected
   slice and the positive control. No arbitrary strings or decompiled source
   are published. Empty fixed-name API categories are **not negative proof**.

**Initial measurement attempt:** workflow run **46057741990**, source
**`46e1553ab4e1f6cbbf19b97b9d829edc3c35d41c`**, failed acquisition because the
legacy package URL redirected from HTTPS to HTTP. No package was retained for
analysis and no Ghidra/native result was produced. The revised redirect handler
rejects plaintext hops **before requesting them**; it can substitute HTTPS only
for the exact fixed Cydia asset on an explicit author-host allowlist. It records
that substitution rather than claiming the old server never downgraded. A
successful all-HTTPS retrieval and actual analysis are still required. No Cydia
binary/Ghidra success, executed jailbreak or recovered encryption keys are
claimed at this stage.

## 5. Robtex domain deep dive — collector evidence, not attribution

The following are observations of the **public Robtex webpages**, not direct
queries we made to authoritative DNS or proof that an endpoint currently accepts
connections. The `.net` and `.com` names are kept separate. Public infrastructure
addresses below are not addresses copied from the owner's phone.

| Name | Robtex response | Interpretation / limit |
| --- | --- | --- |
| `saurik.net` | Lists **`ns.douglasthrift.net`**, **`ns.saurik.com`**, both flagged **“Not in zone NS records”**; unsigned; no apex A shown. [R1] | Possible delegation/zone-observation inconsistency to verify independently; not a finding of compromise or current registrant identity. |
| `saurik.com` | Apex **`13.56.96.53`**, Amazon **AS16509**; four AWS nameservers **ns-1335**, **ns-1947**, **ns-57**, **ns-661** with full names shown by Robtex; unsigned. [R2] | Hosting/delegation observation only. It does not mean Freeman owns AWS or every co-hosted domain. |
| `irc.saurik.com` | No current host A/CNAME in the fetched top/trace host tables; former A **`74.208.44.105`** observed **2015-08-22→2016-07-25**; former CNAME **`carrier.saurik.com`** observed **2015-08-22→2021-03-30**. [R3] | Collector observation intervals, not exact service lifetimes. Parent-domain records shown below the host are not the host's own records. |
| `irc.saurik.net` | No host address shown; parent `.net` delegation appears separately. [R4] | An empty rendered response is not proof no IRC server ever existed. The dated 2003 message is independent historical evidence. |
| `apt.saurik.com` | CNAME **`d35rlteizluyd2.cloudfront.net`** and edge addresses. [R5] | Consistent with CDN delivery, not independent package authenticity. Edge addresses can vary. |
| `cydia.saurik.com` | An earlier retrieved trace included **`d185mnr38l0hna.cloudfront.net`** despite an empty top table; a later fetch returned only the page header. [R6] | Incomplete/changing collector rendering; do not promote either to independently validated live DNS. |

### Reading the domain evidence correctly

- **`.net`'s historical relationship is established by Freeman's dated writing**,
  not by Robtex's shared-nameserver list or a present owner assertion.
- **“Previous names,” “Next names,” “Same first word,” and “Similar names” are
  not evidence of historical aliases, previous owners or one organization.**
  Unrelated neighboring names have not been added to the ownership graph.
- “Unsigned”/“no DS” concerns the DNSSEC chain, **not** proof that the TLS
  connection is broken, the site is malicious, or a file signature is valid.
  A signed parent does not automatically sign a child zone.
- Robtex history is a collector's limited sample, not domain creation time,
  full uptime/service history or proof that a missing record never existed.
  Site-provided timeline/clock labels were not independently time-validated.
- Reputation badges and shared CDN/IP/NS infrastructure do not authenticate an
  app publisher, current domain registrant or software supply chain.
- **No port scan, IRC connection, DNS zone transfer, password attempt, private-log
  recovery, RDAP registrant verification or independent CT/DNS validation was
  performed.** A fetch failure at the `.net` root says only that retrieval failed.

A later infrastructure-verification phase could compare authoritative delegation,
resolver results and public RDAP/CT records, keeping registrant privacy and
historic/current records separate. That phase is **not completed evidence here**.

## 6. Continued metasearch — measured response quality

Only public, non-identifying terms were submitted; no phone identifiers,
passwords, account names or container details were searched. Public metasearch
operators/upstream engines can see queries; this is not an anonymity guarantee.

| Discovery service and query | Retrieved result | Treatment |
| --- | --- | --- |
| [SearXNG directory](https://searx.space/) | Displayed **75 online instances** in the fetched directory snapshot. | Directory/monitor information only, not evidence that all engines work or all results are reliable. |
| [LibreSearch: `saurik.net Jay Freeman Cydia`](https://libresearch.space/search?q=saurik.net%20Jay%20Freeman%20Cydia) | Useful author/Cydia/packaging leads, primarily marked DuckDuckGo in the later response; an earlier response also contained opaque redirect links. | Followed canonical author/archive URLs separately; opaque `go/v1` links were not followed or trusted. |
| [BareSearch: `saurik.net Cydia Robtex`](https://baresearch.org/search?q=saurik.net%20Cydia%20Robtex) | Explicit **no results** response. | Describes this request only; not proof the subject/evidence does not exist. |
| [Utilibre: `saurik Cydia Android 13 Master Key`](https://search.utilibre.org/search?q=saurik%20Cydia%20Android%2013%20Master%20Key) | Mixed irrelevant Wikipedia-homepage Bing results and relevant **mwmbl** Master Key leads. | Discarded the irrelevant results; fetched the author's actual article before using its claims. |

`/id/17` and `/masterkey1.html` are not independent corroborations when they lead
to the same article. Multiple public instances can also share upstream engines.
Neither result count nor ranking establishes Android 13 compatibility, software
safety, current ownership or a working jailbreak.

## 7. ZShaolin continuation and remaining owner evidence

The modern APK compilation, terminal JNI and lint gates have succeeded, but the
mandatory Android 13 runtime gate has not yet succeeded. Diagnostic run
**46056425429** failed in setup at the combined **package / primary-user /
private-directory identity check**, before payload installation. Its bounded
synthetic result made that failure visible; no phone logs were collected.

Commit **`3ae2e617f6d7955aeb4bd0192ef15a64458f071e`** replaces canonical-path-string
comparison with **owned directory inode/device identity** to handle Android's
`/data/data` and `/data/user/0` bind-mount aliases. It preserves the package-ID and
primary-user restrictions and adds a negative cache-directory control. Rerun
**46057354939** passed that identity guard and then failed at bootstrap path
validation. The next correction normalizes benign `./` components, rejects all
parent traversal before normalization, deduplicates normalized archive/link
names and retains canonical containment checks. These are measured failure-stage
and source-correction results, **not a passing payload installation**. The runtime
acceptance/delivery gates remain mandatory; there is no validated APK handoff or
current merge to report.

To narrow the phone questions without changing security state:

- Report only whether **Secure Folder appears in Settings search** and the
  non-identifying support message. Do not send passwords, account details or
  screenshots containing IMEI/serial/MAC/network identifiers.
- For **iOS** jailbreak compatibility, supply only the **device model and exact
  iOS version/build** if there is a separate Apple device to review. Do not send
  Apple ID credentials, passcodes, ECID/UDID or private files.
- Samsung bootloader/Knox Guard prerequisites remain in the separate report.
  No OEM toggle, Ghidra result or “Official” label proves root/unlock.
- This work creates **no working Kodachi VPN credentials, configuration or
  packet protection**. Work-profile/Secure Folder privacy is not VPN coverage.

## Source register

### Samsung

- **S1:** [Knox team's device list and Knox Guard client 1.0 enrollment notice](https://www.samsungknox.com/en/blog/ending-support-for-knox-guard-agent-version-1.0), published 2024-11-27; explicit A03s/SM-A037U1 row.
- **S2:** [About Secured by Knox, Android – Others and Android Go](https://docs.samsungknox.com/admin/fundamentals/kbas/kba-349-about-android-others-android-go-devices/), updated 2023-07-26; category scope and generic Enterprise support.
- **S3:** [KPE features unsupported on One UI Core](https://docs.samsungknox.com/admin/knox-platform-for-enterprise/kbas/kba-362-features-unsupported-one-ui-core/), updated 2024-02-20; not a complete Secure Folder support matrix.
- **S4:** [Samsung Secure Folder guide](https://www.samsung.com/uk/support/mobile-devices/what-is-the-secure-folder-and-how-do-i-use-it/); generic supported-device instructions, not exact-firmware measurement.
- **S5:** [Google Private Space requirements](https://support.google.com/android/answer/15341885?hl=en); Android 15+, separate from Android 13 work profiles.

### Freeman / Cydia

- **F1:** [Author's project index](https://www.saurik.com/); first-party identity/project descriptions.
- **F2:** [2002 Chora/SVN announcement](https://svn.haxx.se/dev/archive-2002-06/1614.shtml); explicitly distinguishes `.net` and `.com`.
- **F3:** [2003 Nmap+V mailing-list message](https://seclists.org/nmap-dev/2003/q3/104); protocol example, not a private IRC transcript.
- **F4:** [Bringing Debian APT to the iPhone](https://www.saurik.com/telesphoreo.html) and [Cydia repository structure](https://www.saurik.com/packaging.html); historical platform/packaging design.
- **F5:** [Author-linked Cydia Impactor page](https://www.cydiaimpactor.com/); features and dated paid-account caveat, not tested current operation.
- **F6:** [Historical APT Packages index](https://apt.saurik.com/dists/ios/main/binary-iphoneos-arm/Packages) and [Release metadata](https://apt.saurik.com/dists/ios/Release); candidate coordinates/dependencies, not independently authenticated publisher key.
- **F7:** [Exploit (& Fix) Android “Master Key”](https://www.saurik.com/masterkey1.html); 2013 issue and approximate Android 4.1 rooting scope.
- **F8:** [Pinned third-party source mirror](https://github.com/autopear/Cydia/tree/bb0ace74560c5c96c8dbefec00c8e3881c504558), especially [MobileCydia.mm](https://github.com/autopear/Cydia/blob/bb0ace74560c5c96c8dbefec00c8e3881c504558/MobileCydia.mm); source-level observations only, no binary reproducibility match.

### Encryption / signatures

- **E1:** [Apple xnu Mach-O header at a fixed commit](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/EXTERNAL_HEADERS/mach-o/loader.h); load-command definitions, not decryption. Retrieved header SHA-256 **`8780a1e622375833b563f488bc820422c2fb5b8727bb8df8ceaa73ab6f0f88e3`**.
- **E2:** [Caching Apple's Signature Server](https://www.saurik.com/shsh.html); historical iPhone 3G[S]/TSS context.
- **E3:** [Where did my iOS 6 TSS data go?](https://www.saurik.com/apticket.html); narrow cached-ticket applicability and unusable saved data.
- **E4:** [Apple Data Protection overview](https://support.apple.com/guide/security/data-protection-overview-secf6276da8a/web); hierarchy and per-file protection classes.
- **E5:** [Apple Secure Enclave](https://support.apple.com/guide/security/the-secure-enclave-sec59b0b31ff/web); designed isolation from the main processor/kernel.

### Passive-domain webpages

- **R1:** [Robtex `saurik.net`](https://robtex.com/en/dns-lookup/net/saurik).
- **R2:** [Robtex `saurik.com`](https://robtex.com/en/dns-lookup/com/saurik).
- **R3:** [Robtex `irc.saurik.com`](https://robtex.com/en/dns-lookup/com/saurik/irc).
- **R4:** [Robtex `irc.saurik.net`](https://robtex.com/en/dns-lookup/net/saurik/irc).
- **R5:** [Robtex `apt.saurik.com`](https://robtex.com/en/dns-lookup/com/saurik/apt).
- **R6:** [Robtex `cydia.saurik.com`](https://robtex.com/en/dns-lookup/com/saurik/cydia); incomplete/changing rendered response.

Raw source archives, native inputs and Ghidra projects are disposable build/cache
material, not committed binaries. This operational review and measured receipts
are excluded from public offline Wiki/SITE-K manual bundles.
