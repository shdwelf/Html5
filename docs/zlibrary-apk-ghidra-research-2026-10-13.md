# Z-Library / z-lib.se provenance & APK-triage research (2026-10-13)

*Ask: locate `zlib.txt`, its mirrors, a backup APK (Drive), and get a
Ghidra + Temurin/OpenJDK pipeline ready to analyse the Z-Library APK.
Findings below. This doc deliberately contains **no working mirror
list**: Z-Library distributes copyrighted works without authorisation
(US DOJ criminal case, below), and the mirror ecosystem is the single
most scam-ridden corner of the book web — publishing “current mirrors”
would steer readers to phishing clones as often as to anything real.
What is delivered instead: provenance, seizure status, fake-APK
indicators, and a ready-to-run triage pipeline for an APK you supply.*

---

## 1. Locate sweep — `zlib.txt` and the APK

| Location searched | Method | Result |
| --- | --- | --- |
| This repo | `find -iname '*zlib*' / '*z-lib*' / '*.apk'` (excluding .git) | No `zlib.txt`, no APK. Only `docs/jcreator-ghidra-evidence/zlib.dll.*` — that's the **zlib compression library** from the JCreator/Ghidra work, unrelated. |
| Whole home dir | `find /home/user -iname 'zlib.txt' -o -iname '*.apk'` | Nothing. |
| Google Drive | `search_files`: `name contains 'zlib'`; `name contains '.txt' and (… 'lib'/'mirror')`; `mimeType = 'application/vnd.android.package-archive'` | No `zlib.txt`, **no APK at all** in Drive. |
| Google Drive (context) | `name contains 'zlibrary' / 'z-lib' / 'apk'` | **8 ebook files** whose filenames carry `(z-library.sk, 1lib.sk, z-lib.sk)` provenance (Nancy Drew / Hardy Boys / Agatha Christie sets, *The Hunt for Red October*), uploaded 2026-10-09. So a **book backup exists in Drive — an APK backup does not.** (Files not opened or downloaded for this research.) |

**Blocker (resolved same day):** the user supplied two APKs via Drive;
§7 is the completed triage. §4's pipeline is what ran (runner-side:
GitHub Actions fetched the link-shared files into gitignored payload —
briefly made link-readable with the owner's authorisation, reverted to
private immediately after the fetch — and `tools/apk_triage.py` under
Temurin JDK 21 did the analysis; binaries never entered git history).

## 2. z-lib.se — what it actually is in 2026

- Z-Library's clearnet domains have been seized in waves: **Nov 2022**
  (240+ domains, incl. z-lib.org, b-ok.org, 3lib.net; DOJ/FBI, EDNY
  criminal copyright + wire-fraud + money-laundering charges against two
  alleged operators arrested in Argentina), **May & Nov 2023**, **Jan &
  May 2024**.
- **May 2024 round specifically took `z-lib.se`** — reporting at the time
  identifies it as the project's **main email domain**, seized alongside
  Z-Library.se and singlelogin domains (TorrentFreak, 2024-05-30/31;
  Wikipedia's Z-Library article, seized-domain list). Any `z-lib.se`
  page resolving today should be treated as a seized shell, a parked
  page, or an impersonator — not a source of truth.
- **The clone problem is documented, not hypothetical:** *The Hindu*
  (2023) covered `Z-Lib.is` **phishing** for funds; the r/zlibrary
  community maintains scam-alert threads about credential-harvesting
  lookalikes (e.g. a “Z lib id” fake that harvested passwords); SEO
  “verified APK” pages show obvious tells (one such page claims daily
  verification while stamping `APK last verified: 1970-01-01`).
- The name means “hooray” in Ewok — the same homonym trap as the
  archive.org `YubNub` item in the Yubnub research. *Z-Library, zlibrary,
  1lib, z-lib.sk* filenames are provenance strings, not identity proof.

**Conclusion:** `zlib.txt`-style mirror lists are unverifiable by
construction — domains churn faster than any list, and every entry is
one seizure or one clone away from being a credential trap. That is
precisely why an APK, if one is to be used at all, gets the §4
treatment before it touches a phone.

## 3. Toolchain — Temurin/OpenJDK, verified today

| Piece | State |
| --- | --- |
| JDK parts staged in repo | `.relay/jdk/jdk21.tar.gz.part-00..02` + `jdk21.sha256` (`ce79869e…faee94`) |
| Assembly | `cat part-* > jdk21.tar.gz` → sha256 **matches** → extracted |
| Runtime | `openjdk version "21.0.12.1" LTS`, **Temurin-21.0.12.1+1**, IMPLEMENTOR="Eclipse Adoptium" — i.e. OpenJDK/JRE/JVM satisfied by Eclipse Temurin as requested |
| Ghidra | Latest release **Ghidra 12.1.4** (`NationalSecurityAgency/ghidra`, 543 MB zip; JDK 21 ✓). Sandbox binary download is blocked (release-asset redirect host not whitelisted — apktool jar came back 0 bytes, verified), so fetch on a networked host: `gh release download Ghidra_12.1.4_build -R NationalSecurityAgency/ghidra` |
| JADX | **v1.5.6** (`skylot/jadx`, 69 MB zip) — DEX→Java front door |
| Apktool | **v3.0.3** (`iBotPeaches/Apktool`, 14 MB jar) — manifest/resources decode |
| In-repo | `tools/ghidra_scripts/*.java`, `tools/verify_ghidra.mjs`, `wasm/ghidra/` (browser WASM decompiler — native binaries; APK DEX still wants desktop Ghidra's Dalvik loader or JADX first) |

## 4. APK triage pipeline (runs the moment an APK is supplied)

```bash
export JAVA_HOME=/tmp/jdk21   # Temurin 21 assembled in §3
sha256sum suspect.apk                       # pin identity before anything runs it
java -jar apktool.jar d -f suspect.apk -o out/apktool   # manifest, permissions, strings
jadx -d out/jadx suspect.apk                # DEX -> Java; grep http/ URLs, login flows
analyzeHeadless proj ZLibAPK -import suspect.apk -postScript Decompile -deleteProject
```

What to extract and judge (fake-Z-Library indicators):
package id & signing cert (self-signed/unknown vs any consistent
history) · permissions vs function (SMS/contacts/accessibility on a
book reader = walk away) · hard-coded endpoints (does it talk to the
domains it claims, or to fresh proxy/lookalike hosts?) · login flow
(where do credentials POST?) · payment SDKs / “premium” card forms ·
obfuscation + dynamic code loading (`DexClassLoader`, `loadLibrary`
blobs) · embedded URLs vs §2 seizure timeline. Never install on a
primary device; emulator + network capture first.

## 5. Safe & legal shelves for the same books

Public-domain and licensed lending need no mirrors: **Project
Gutenberg**, **Standard Ebooks**, **Open Library / Internet Archive
lending**, **Libby/OverDrive** via a library card — several of the
Drive-backed sets (Christie, Nancy Drew, Hardy Boys) straddle
public-domain boundaries by country, which Open Library handles
correctly per-title.

## 7. User-supplied APKs — completed triage (2026-10-13)

Two samples arrived via Drive (both APKPure-sourced), analysed by
`tools/apk_triage.py` on the Actions runner (Temurin 21; reports:
[`docs/zlib-apk-triage/`](zlib-apk-triage/SUMMARY.md)). Static only —
nothing installed or executed.

| | **A: Z-Lib_1.11.4_APKPure.apk** | **B: z+Library_1.0.5_APKPure.apk** |
| --- | --- | --- |
| SHA-256 | `159a142595ab2f6be62a4b231d5d6193739607bfe1d816271bf52f217de32120` | `86baf591e1b05b80f93cc73f4b98c7c87747c28c5464287f0a7280543d5f02c2` |
| Package / label | `com.positron_it.zlib` / “Z-Lib” | `com.zlib.zlibrary` / “ZLibrary” |
| Version (SDK) | 1.11.4 (21), min 19 / target 33 | 1.0.5 (14), min 21 / target 34 |
| Stack | Kotlin + OkHttp + Firebase; 1 DEX; embedded **Tor** (torproject/onion strings ×35) | **Flutter** (3 DEX, 30 native libs); no Tor strings |
| Signer | Self-signed **CN=Positron_IT**, minted 2021-07-15, SHA-256 `dffe2363…1f3b` | Self-issued cert claiming **CN=Android, O=Google Inc.** (the AOSP test-key identity), minted 2023-10-05, SHA-256 `d9f7cd88…6d` |
| Permissions | 10 total; storage, CAMERA, REQUEST_INSTALL_PACKAGES | 34 total; **FINE_LOCATION**, RECEIVE_BOOT_COMPLETED, media ×3, AD_ID, launcher-badge set |
| Indicators | no SMS/contacts/location; dynamic-load ×2 (Tor transports); device-id strings ×17 (analytics/Tor libs) | accessibility ×5, WebView JS/file-access ×7, reflection ×4 |

**Verdicts.**

- **Sample A is internally consistent with a genuine long-lived client.**
  A stable named-developer certificate in continuous use since 2021, a
  permission set that maps 1:1 onto its features (storage = book files,
  camera = QR login, install-packages = self-update for a sideloaded
  app), and embedded Tor — matching the project's known onion-access
  model. Caveat, stated plainly: “consistent” is not “proven”. APKPure
  is a repackaging intermediary, and without a reference fingerprint
  from the developer's own channel no third-party copy can be
  cryptographically certified. The hash above is the identity to pin.
- **Sample B cannot be trusted as official — treat as untrusted.**
  Its signing certificate *impersonates the AOSP “Android / Google
  Inc.” identity*: self-issued, and matching Android's public test-key
  profile, whose private keys are public by design — **anyone on Earth
  can sign an APK that looks exactly like this.** There is no
  provenance to verify, and its behaviour profile argues against it
  anyway: precise location, boot persistence and an ad-ID in an ebook
  reader. If B is installed anywhere: remove it; if credentials were
  ever typed into it, change that password anywhere it was reused.
- The two are *different applications* (different packages, signers,
  stacks) both presenting as the same service — the fake-clone pattern
  from §2, found in the wild in the user's own uploads.

Signal-vs-noise note: the generated endpoint tables include string-regex
fallout from bundled ML/JS libraries (TensorFlow `.cc` operator names,
JS `this.*` tokens); the identity, signer and permission findings above
are manifest/certificate facts, not string inference. A deeper
Ghidra 12.1.4 + Temurin pass over B's native libraries remains
available on the runner if IOC-level certainty is ever needed.

## 8. Deep disassembly + encryption check (2026-10-13)

JADX 1.5.6 decompilation (7,159 / 8,386 Java files recovered), native
string census, and a bounded Ghidra 12.1.4 headless pass
(`CryptoInventory.java`, Temurin 21) — reports in
[`docs/zlib-apk-triage/disasm-*`](zlib-apk-triage/SUMMARY.md).
Endpoints are reported at registrable-domain level; one onion host
that slipped through in raw form was redacted (follow-up commit; the
value remains in this branch's early bot commits and is, in any case,
the same address long published on Reddit/Wikipedia).

**Sample A (Z-Lib 1.11.4)** — a real API client: 32 Retrofit
endpoints (22 GET / 10 POST) under one API prefix, dual base URLs
(clearnet + onion), 4 Authorization-header constructions. Crypto:
`AES/CBC/PKCS5Padding` ×2, **no ECB** ✓, but legacy MD5/SHA-1 digests
present (consistent with content hashing), 14 SecretKeySpec literals
and 2 hard-coded-IV candidates to audit before trusting local
encryption, **no Android Keystore and no EncryptedSharedPreferences**
— 21 plain SharedPreferences files, so any stored session token sits
in plaintext app storage. TLS: one obfuscated custom
X509TrustManager with an empty `checkServerTrusted` body found (may
belong to a bundled component — flagged, not convicted), 23
CertificatePinner refs, 131 cleartext-http literals (Tor transports
and library noise dominate). Native: `libtor.so` per ABI carrying
**Tor 0.4.7.14 with OpenSSL 1.1.1u strings — a 2022-era Tor, EOL**;
`libbarhopper` explains the CAMERA permission (ML barcode/QR).

**Sample B (z+Library 1.0.5)** — a WebView shell wearing a reader's
clothes: exactly **1** Retrofit endpoint in 8,386 files; the bulk is
**Unity Ads** (`com.unity3d.services` ×469), **OneSignal** push
(×173 — explains boot receiver + AD_ID), Jackson/Spring bulk, a
PDFium fork for rendering, 10 JavaScript interfaces, and the
`trust_location` plugin behind ACCESS_FINE_LOCATION. No app-level
Cipher transformations visible to JADX (Dart-side code in
`libapp.so` is opaque to it — stated as a limit, not an all-clear).

**GitHub source-tracing from the disassembly** (the “search GitHub
for the API/libraries” ask): every load-bearing component in A is
traceable to public source — OkHttp (`lysine-dev/okhttp` ★47.1k,
ex-square org), Retrofit (`lysine-dev/retrofit` ★44.0k),
`drewnoakes/metadata-extractor` ★2.8k, Tor (canonical source on
Tor Project's GitLab; stale GitHub mirror `torproject/tor` ★5.1k),
and Guardian Project's `guardianproject/tor-android` ★291 (pushed
2026-10-13). B's are likewise public: `flutter/flutter` ★180k,
`OneSignal/OneSignal-Android-SDK` ★631, PDFium via
`bblanchon/pdfium-binaries` ★1.5k, `FasterXML/jackson-core` ★2.4k.
Unofficial “zlibrary API” client repos also exist on GitHub (several
hundred stars at the top) — noted as landscape, deliberately not
linked: they are operational clients for the service in §2, and the
apps' own API routes stay redacted here for the same reason. The
legitimate takeaway stands: A's networking stack is ordinary OSS all
the way down; nothing about its crypto inventory is exotic — its
risks are plaintext token storage, an EOL Tor, and provenance.

**Ghidra headless outcome (completed):** `analyzeHeadless`
(CryptoInventory.java, Temurin 21) exit 0 on both lead native
libraries. A's `libtor.so` (sha256 `cf36154c…b18e4`): 14,104
functions, 60 crypto-named (`tor_main`, `tor_init`, …), 30,843
defined strings of which 7,291 crypto-matching — a genuine,
self-contained Tor build, exactly as its version strings claimed.
B's `libflutter.so` (sha256 `7eb2fb3f…0194`): 25,724 functions but
only 6 crypto-named (BoringSSL memory wrappers) and 728
crypto-matching strings — an engine binary; B's actual logic sits in
Dart `libapp.so`, which neither JADX nor this pass reads. Net
encryption verdict: **A's crypto is Tor/OpenSSL doing what Tor does,
plus mediocre local-storage hygiene; B's crypto is unauditable
engine+Dart bulk wrapped around ads/push SDKs — combined with its
impersonated test-key signature (§7), “untrusted” stands.**

**Backlog completion (same day, owner-approved):** the
`libapp.so` pass ran — Ghidra imports the Dart AOT snapshot
(ARM:LE:32) but recovers **0 functions / 0 external symbols**; only
10,127 defined strings (59 http, 62 crypto-matching, incl. PDF
AES-encryption strings from its renderer). As predicted, Dart AOT
yields string-level IOCs only; the §7/§8 verdict on B needs no
revision. In the same runner round, the three Drive backup
manifests were reconciled (`docs/drive-sync/`): snapshots are
88.6–92.3% identical to the repo, with **25 + 2 + 0 files present
only on the Drive side** (recoverable content, listed in the diffs)
and 1,343–1,883 repo-side additions since. All five temporarily
link-shared Drive files (3 manifests + 2 APKs) were reverted to
private immediately after the fetch. Session backups were mirrored
to Google Drive and Dropbox (`/Html5-Backups/`, content-hash
verified) — see PR discussion for file IDs and hashes.

## 9. Sources (2026-10-13)

Drive `search_files` × 4 queries + repo/home `find` (results table §1) ·
JDK parts sha256 re-computed locally; `java -version` output quoted ·
`gh api …/releases/latest` for NationalSecurityAgency/ghidra (12.1.4),
skylot/jadx (1.5.6), iBotPeaches/Apktool (3.0.3) · Wikipedia “Z-Library”
(domain seizure waves; May 2024 z-lib.se email domain) · TorrentFreak
2024-05-30 “FBI Carries Out Fresh Round of Z-Library Domain Name
Seizures” · The Hindu 2023 on Z-Lib.is phishing · r/zlibrary scam-alert
threads (fake-site credential harvesting) · Bleeping Computer / Ars
Technica seizure coverage 2022–2023.
