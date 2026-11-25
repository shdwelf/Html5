# Android SSH clients — APK sizes, smallest first

Version-pinned comparison · 17 November 2026. These are **selected artifact
snapshots**, not a claim that every row is the latest release on every store.
A small download is not a security recommendation.

## Size-ranked overview

Sizes below are **compressed downloads, not installed app storage**.
`1 MiB = 1,048,576 bytes`; exact-byte sources are converted consistently.
Approximate distributor values and ambiguous `KB` units are marked explicitly.
The two ConnectBot rows are different flavors of the **same version**, not
separate apps. All entries in this table are listed as single APKs; Termius's
split bundle is kept outside the APK ranking.

| Order | App / selected artifact | Download size | Android / evidence and important qualification |
| --- | --- | ---: | --- |
| 1 | [VX ConnectBot](https://vx-connectbot.en.uptodown.com/android/download) `1.7.1-30-git` | **748.54 KB**, mirror's units | Legacy comparison only. `KB` base is unspecified; no exact bytes claimed. Mirror lists `armeabi, x86`; modern 64-bit-only devices are not certified. Its May 2026 listing date does not establish recent upstream maintenance. |
| 2 | [AnotherTerm](https://github.com/green-green-avk/AnotherTerm/releases/tag/MkIIIv87_release) `MkIIIv87`, **redist / versioned** | **2.408 MiB** · 2,524,940 B | Publisher API metadata, release 2024-05-27. Source declares Android 4.0+ (API 14), not “Android 13 minimum”: API 33 is the target. ABI contents not APK-inspected. Old release; assess maintenance before trusting credentials. |
| 3 | [ConnectBot](https://github.com/connectbot/connectbot/releases/tag/v1.11.1) `1.11.1`, **google** | **6.622 MiB** · 6,943,704 B | Publisher API metadata, release 2026-10-13. Source declares Android 7+ and four ABIs. Uses Google Play Services to update the crypto provider, so the small APK is not the entire dependency footprint. |
| 4 | TermBot `1.9.6-termbot3` | **≈7.9 MiB**, rounded | F-Droid search extraction only; direct page fetch failed. Android 4+ / four ABIs are distributor claims. Added 2021-04-14; upstream is archived. Hardware-token/OpenPGP-card lead, not a current-device certification. [1](https://f-droid.org/packages/org.sufficientlysecure.termbot/) |
| 5 | [ConnectBot](https://github.com/connectbot/connectbot/releases/tag/v1.11.1) `1.11.1`, **oss** | **12.486 MiB** · 13,092,258 B | Same publisher version and source-declared Android 7+ / four ABIs, but **bundles the crypto provider**. Do not substitute the size or signer of F-Droid's separately distributed build. |
| 6 | [Shellwave](https://github.com/LordOfPolls/Shellwave/releases/tag/1.11.0) `1.11.0`, **foss** | **15.066 MiB** · 15,797,669 B | Publisher API metadata, release 2026-11-15. Pinned build source declares Android 12+ (API 31). APK ABI contents not independently inspected. |
| 7 | [JuiceSSH](https://www.apkmirror.com/apk/sonelli-ltd/juicessh-ssh-client/juicessh-ssh-client-3-2-2-release/juicessh-ssh-client-3-2-2-android-apk-download/) `3.2.2` / code `200` | **23.656 MiB** · 24,805,394 B | Third-party artifact page, uploaded February 2021. Lists Android 8+, target 10 and four ABIs. The site's “23.66 MB” is binary-valued; the comparison uses its explicit bytes. This old artifact is not a maintenance or safety endorsement. |
| 8 | [Termux](https://f-droid.org/packages/com.termux/) `0.118.3` / code `1002`, F-Droid suggested stable | **≈108 MiB**, rounded | Android 7+ / four ABIs listed; added 2025-05-29. This is a terminal environment, not a tiny dedicated SSH client. OpenSSH/bootstrap/dependencies and extracted data add storage beyond the compressed APK; that total was not measured. Do not mix in the beta or ABI-specific GitHub sizes. |

“Four ABIs” means `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.
For ConnectBot these are **pinned build declarations**, not a claim of APK
manifest inspection or that every architecture was run. Approximate rows are
placed only where their coarse sizes clearly permit; no exact byte count is
invented for them. The machine-readable manifest keeps exact and approximate
observations in separate lists.

### Termius: compared, but not a standalone APK

The [specific Termius 8.0.1 / code 1008 artifact page](https://www.apkmirror.com/apk/termius-corporation/termius-ssh-telnet-client/termius-modern-ssh-client-8-0-1-release/termius-modern-ssh-client-8-0-1-android-apk-download/)
reports **46,507,753 bytes = 44.353 MiB**, and explicitly labels the download
**“Base APK and 11 splits” / “APK Bundle”**, Android 8+.
It is **excluded from the single-APK ranking**. The release index instead
prints 54.22 MB: version alone is insufficient to identify a comparable size.
Neither the bundle archive size nor an aggregate split listing is the
per-device delivered size or installed footprint. The [official Android
download page](https://termius.com/download/android) points to Google Play.
No account, cloud-vault/sync enrollment or installation was performed.

## Practical shortlist

- **General-purpose small-client pick: ConnectBot**, through its
  [official distribution/verification guidance](https://connectbot.org/download/).
  Choose the `google` dependency model only where Google Play Services is
  acceptable; choose `oss` for a bundled provider. Compare the **same version
  and signer**. Upstream warns that Play signing-key rotation can prevent a
  later GitHub APK from updating a Play-upgraded installation. Never uninstall
  an existing app just to change signer without an independently checked
  export/restore plan.
- **Smallest publisher-listed sample here: AnotherTerm**, but its 2024 release
  is a significant maintenance caveat. `app-redist-versioned-release.apk` was
  selected deliberately: the almost-identical-size `downgradable` flavor fixes
  `versionCode`, and the slightly smaller `oldgood` compatibility flavor is
  explicitly not recommended upstream for Android newer than 12. A smaller
  file is not a reason to weaken update/host-key checks.
- **Modern UI candidate: Shellwave**, if Android 12+ is available. This is a
  source/metadata lead, not a usability, host-key, cryptographic or physical
  device audit.
- **Already need a full local shell/package manager? Termux plus OpenSSH** is
  a different use case; budget its packages/data, not merely its APK.
- **VX ConnectBot, TermBot and the sampled JuiceSSH build are historical or
  stale comparisons**, not recommendations for storing production credentials.

Before using any SSH client, verify the server host-key fingerprint through an
independent channel. Prefer maintained distribution/update paths, protected
keys and minimal permissions. APK SHA-256 metadata checks integrity against a
named artifact; it does **not** by itself establish a trusted signing identity,
absence of vulnerabilities or safe host-key behavior. This investigation does
not recommend sending owner recovery phrases/OpenPGP keys to an SSH app.

## Evidence and reproducibility

[Machine-readable artifact/source manifest](research/android-ssh-apk-sizes-2026-11-17.json):
5 exact-byte APK observations, 3 rounded/legacy observations, 1 excluded split
bundle and 6 immutable source-file SHA-256/size pins. Publisher release and
asset IDs, exact filenames, flavors, URLs and advertised digests are retained.
The AnotherTerm API returned no digest; none is fabricated. Reported sizes and
digests are **metadata**, not locally downloaded/measured/verified APKs.

No APK was downloaded, installed or executed. No installed-footprint,
signature-certificate, device/ABI, SSH connection, authentication or security
acceptance result is claimed. Page/search extractions are labeled as such,
not misrepresented as archived raw-page hashes. Upstream source inspection is
not proof of reproducible binary correspondence. This is a sampled comparison,
not proof that smaller/other clients or newer releases do not exist.

The separate [Waves note](waves-paper-practice-2026-11-17.md) addresses the
remembered **saved-page renamed `.hts`** workflow and the synthetic serving
control, not a proposal to run archived wallet code. The WordPress/small-web
review remains **draft-only**; this report/provenance is not added to public
offline manual bundles or used to sign up to any shell service.
