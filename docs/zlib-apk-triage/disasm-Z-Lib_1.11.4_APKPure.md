# Deep disassembly — Z-Lib_1.11.4_APKPure.apk

Static disassembly inventory (JADX + strings + Ghidra). Nothing executed.

## JADX decompilation

- Exit 3; Java sources recovered: 7159 files
- Top packages: `com.google.android` ×1014, `com.positron_it.zlib` ×519, `w4` ×481, `x4` ×324, `com.drew.metadata` ×288, `r9` ×157, `b5` ×148, `r` ×88

### API surface (paths counted, never printed)

- Retrofit-style endpoints declared: 32 (GET 22, POST 10)
- First-segment groups: `/eapi` ×31, `eapi/book` ×1
- baseUrl() hosts: `zlibrary.se` ×1, `<redacted>.onion` ×1
- Authorization-header constructions: 4 refs; Bearer literals: 0; API-key header refs: 0

### Encryption & transport posture

- Cipher transformations: `AES/CBC/PKCS5PADDING` ×2
- Message digests: `SHA1` ×2, `SHA-256` ×1, `MD5` ×1, `SHA-1` ×1
- ECB-mode ciphers: none found ✓
- Legacy digests (MD5/SHA-1): ['SHA1', 'MD5', 'SHA-1']
- PBKDF2 / scrypt / bcrypt / Argon refs: 0; SecretKeySpec literals: 14; hard-coded IV candidates (IvParameterSpec with literal): 2
- Android Keystore refs: 0; EncryptedSharedPreferences refs: 0; plain SharedPreferences files: 21

### TLS trust behaviour

- Custom X509TrustManager classes: ['f']; empty checkServerTrusted bodies: 1
- HostnameVerifier refs: 30; CertificatePinner refs: 23; SSLContext inits: 9
- WebView JS interfaces: 1; cleartext http:// literals: 131

### Hard-coded secret candidates

- Long base64-looking string literals (≥40 chars): 163 (count only — values withheld; most are assets/fonts in practice)
- "api_key"/"secret"/"token" constant assignments: 9

## Native libraries

- .so files: 12
- `lib/x86_64/libtor.so` (6,945,240 B) — versions: ['OpenSSL \n3', 'OpenSSL 1.0.1', 'OpenSSL 1.1.1b', 'OpenSSL 1.1.1u', 'Tor 0.1.2.17', 'Tor 0.4.7.14', 'tor 0.4.7.14', 'tor/14917.', 'tor/21155.', 'tor/8742.']; crypto-symbol strings: 743
- `lib/x86/libtor.so` (6,733,512 B) — versions: ['OpenSSL \n3', 'OpenSSL 1.0.1', 'OpenSSL 1.1.1b', 'OpenSSL 1.1.1u', 'Tor 0.1.2.17', 'Tor 0.4.7.14', 'tor 0.4.7.14', 'tor/14917.', 'tor/21155.', 'tor/8742.']; crypto-symbol strings: 743
- `lib/arm64-v8a/libtor.so` (6,430,512 B) — versions: ['OpenSSL \n3', 'OpenSSL 1.0.1', 'OpenSSL 1.1.1b', 'OpenSSL 1.1.1u', 'Tor 0.1.2.17', 'Tor 0.4.7.14', 'tor 0.4.7.14', 'tor/14917.', 'tor/21155.', 'tor/8742.']; crypto-symbol strings: 743
- `lib/armeabi-v7a/libtor.so` (6,262,428 B) — versions: ['OpenSSL \n3', 'OpenSSL 1.0.1', 'OpenSSL 1.1.1b', 'OpenSSL 1.1.1u', 'Tor 0.1.2.17', 'Tor 0.4.7.14', 'tor 0.4.7.14', 'tor/14917.', 'tor/21155.', 'tor/8742.']; crypto-symbol strings: 743
- `lib/x86/libbarhopper_v3.so` (5,821,296 B) — versions: —; crypto-symbol strings: 0
- `lib/x86_64/libbarhopper_v3.so` (5,741,384 B) — versions: —; crypto-symbol strings: 0
- `lib/arm64-v8a/libbarhopper_v3.so` (4,418,592 B) — versions: —; crypto-symbol strings: 0
- `lib/armeabi-v7a/libbarhopper_v3.so` (2,857,212 B) — versions: —; crypto-symbol strings: 0
- `lib/x86_64/libimage_processing_util_jni.so` (44,920 B) — versions: —; crypto-symbol strings: 0
- `lib/x86/libimage_processing_util_jni.so` (34,220 B) — versions: —; crypto-symbol strings: 0
- `lib/arm64-v8a/libimage_processing_util_jni.so` (27,856 B) — versions: —; crypto-symbol strings: 0
- `lib/armeabi-v7a/libimage_processing_util_jni.so` (20,764 B) — versions: —; crypto-symbol strings: 0

## Ghidra headless — `libtor.so`

- analyzeHeadless exit 1; report lines: 0

```
(no GHIDRA-REPORT lines produced)
```

