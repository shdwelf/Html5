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

**Blocker:** there is currently no APK to analyse. Supply one (drop the
`.apk` in Drive or the repo) and §4 runs as-is.

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

## 6. Sources (2026-10-13)

Drive `search_files` × 4 queries + repo/home `find` (results table §1) ·
JDK parts sha256 re-computed locally; `java -version` output quoted ·
`gh api …/releases/latest` for NationalSecurityAgency/ghidra (12.1.4),
skylot/jadx (1.5.6), iBotPeaches/Apktool (3.0.3) · Wikipedia “Z-Library”
(domain seizure waves; May 2024 z-lib.se email domain) · TorrentFreak
2024-05-30 “FBI Carries Out Fresh Round of Z-Library Domain Name
Seizures” · The Hindu 2023 on Z-Lib.is phishing · r/zlibrary scam-alert
threads (fake-site credential harvesting) · Bleeping Computer / Ars
Technica seizure coverage 2022–2023.
