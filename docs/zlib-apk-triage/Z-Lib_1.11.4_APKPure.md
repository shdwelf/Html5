# APK triage — Z-Lib_1.11.4_APKPure.apk

- File: `Z-Lib_1.11.4_APKPure.apk`
- Size: 33,076,250 bytes
- SHA-256: `159a142595ab2f6be62a4b231d5d6193739607bfe1d816271bf52f217de32120`
- MD5: `b2c096e698f05879275fb03b73cedf99`
- Method: static only — ZIP census, manifest decode, string/IOC extraction. Nothing installed or executed.

## ZIP census

- Entries: 1179 · DEX files: 1 (classes.dex) · native libs: 12 · assets: 3
- ABIs: ['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64']

## Identity

- Package: `com.positron_it.zlib` · app label: 'Z-Lib'
- Version: 1.11.4 (code 21) · SDK min/target: 19 / 33
- Signing schemes: v1, v2
- Cert SHA-256 (androguard): ['dffe2363f9a7dc721ffa6ed706df988ac6e2072221b6f9b9dadb755e566d1f3b']

```
Owner: CN=Positron_IT, OU=Positron_IT, O=Positron_IT
Issuer: CN=Positron_IT, OU=Positron_IT, O=Positron_IT
Serial number: 58d854e6
Valid from: Thu Jul 15 15:08:35 UTC 2021 until: Mon Jul 09 15:08:35 UTC 2046
SHA1: C7:B0:45:40:C0:53:48:8F:8F:4A:72:99:39:44:3D:7B:23:C9:AA:C9
SHA256: DF:FE:23:63:F9:A7:DC:72:1F:FA:6E:D7:06:DF:98:8A:C6:E2:07:22:21:B6:F9:B9:DA:DB:75:5E:56:6D:1F:3B
Signature algorithm name: SHA256withRSA
```

## Permissions

- Declared: 10 · watchlist hits: 5

- ⚠ `android.permission.CAMERA`
- ⚠ `android.permission.READ_EXTERNAL_STORAGE`
- ⚠ `android.permission.REQUEST_INSTALL_PACKAGES`
- ⚠ `android.permission.WAKE_LOCK`
- ⚠ `android.permission.WRITE_EXTERNAL_STORAGE`

<details><summary>All permissions</summary>

- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.ACCESS_WIFI_STATE`
- `android.permission.CAMERA`
- `android.permission.CHANGE_WIFI_STATE`
- `android.permission.INTERNET`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.REQUEST_INSTALL_PACKAGES`
- `android.permission.WAKE_LOCK`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE`

</details>

## Components

- Activities: 7 · services: 10 · receivers: 2 · providers: 5
- Main activity: com.positron_it.zlib.ui.splash.SplashActivity

## Hard-coded endpoints (registrable domains; paths withheld)

| Domain | Refs | Note |
| --- | ---: | --- |
| `torproject.org` | 64 |  |
| `schedulers.io` | 49 |  |
| `openssl.org` | 45 |  |
| `adobe.com` | 44 |  |
| `com.app` | 33 |  |
| `www.to` | 32 |  |
| `android.me` | 31 |  |
| `android.su` | 15 |  |
| `transpose.cc` | 12 |  |
| `util.cc` | 12 |  |
| `bugs.to` | 12 |  |
| `tensorflow.org` | 8 |  |
| `freehaven.net` | 8 |  |
| `livw11.pro` | 8 |  |
| `slice.cc` | 8 |  |
| `pad.cc` | 8 |  |
| `elementwise.cc` | 8 |  |
| `reduce.cc` | 8 |  |
| `split.cc` | 8 |  |
| `blog.to` | 8 |  |
| `subcredential.su` | 8 |  |
| `aiim.org` | 6 |  |
| `org.to` | 6 |  |
| `android.net` | 5 |  |
| `githubusercontent.com` | 4 |  |
| `goo.gl` | 4 |  |
| `iptc.org` | 4 |  |
| `purl.org` | 4 |  |
| `xml.org` | 4 |  |
| `crashlytics.com` | 4 |  |
| `http` | 4 |  |
| `googlesource.com` | 4 |  |
| `android.app` | 4 |  |
| `conv3d.cc` | 4 |  |
| `reverse.cc` | 4 |  |
| `if.cc` | 4 |  |
| `quantize.cc` | 4 |  |
| `mutex.cc` | 4 |  |
| `floor.cc` | 4 |  |
| `mfcc.cc` | 4 |  |

Total distinct non-infra domains: 193

## SDK / library fingerprints

- Firebase (Google)
- OkHttp / Okio networking
- Kotlin runtime

## Abuse / capability indicators (string-level)

- ⚠ dynamic code loading (DexClassLoader/PathClassLoader): 2 hit(s)
- · process exec (Runtime.exec / ProcessBuilder): 0 hit(s)
- ⚠ native library loading (loadLibrary): 1 hit(s)
- ⚠ device identifiers (IMEI/Android ID): 17 hit(s)
- · SMS sending API: 0 hit(s)
- ⚠ accessibility abuse surface: 1 hit(s)
- · crypto-mining markers (stratum/monero/xmrig): 0 hit(s)
- ⚠ reflection into hidden APIs: 1 hit(s)
- ⚠ credential-form WebView flags (JS + file access): 1 hit(s)
- ⚠ Tor / onion routing: 35 hit(s)
- · payment SDKs (card capture surface): 0 hit(s)

## Analyst notes

- Certificate comparison across samples and any APKPure repackaging assessment belong in the summary doc, written after all samples are triaged.
