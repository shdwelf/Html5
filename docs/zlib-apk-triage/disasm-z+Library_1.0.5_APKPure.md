# Deep disassembly — z+Library_1.0.5_APKPure.apk

Static disassembly inventory (JADX + strings + Ghidra). Nothing executed.

## JADX decompilation

- Exit 3; Java sources recovered: 8386 files
- Top packages: `com.google.android` ×1131, `kotlin.reflect.jvm` ×853, `com.fasterxml.jackson` ×550, `com.unity3d.services` ×469, `org.springframework.core` ×230, `kotlinx.coroutines.flow` ×178, `com.onesignal` ×173, `org.joda.time` ×166

### API surface (paths counted, never printed)

- Retrofit-style endpoints declared: 1 (GET 1)
- First-segment groups: `search` ×1
- baseUrl() hosts: —
- Authorization-header constructions: 8 refs; Bearer literals: 0; API-key header refs: 0

### Encryption & transport posture

- Cipher transformations: none found
- Message digests: `SHA-1` ×2, `SHA-256` ×2, `SHA256` ×2, `SHA1` ×1
- ECB-mode ciphers: none found ✓
- Legacy digests (MD5/SHA-1): ['SHA-1', 'SHA1']
- PBKDF2 / scrypt / bcrypt / Argon refs: 0; SecretKeySpec literals: 8; hard-coded IV candidates (IvParameterSpec with literal): 0
- Android Keystore refs: 0; EncryptedSharedPreferences refs: 0; plain SharedPreferences files: 43

### TLS trust behaviour

- Custom X509TrustManager classes: none; empty checkServerTrusted bodies: 1
- HostnameVerifier refs: 68; CertificatePinner refs: 23; SSLContext inits: 10
- WebView JS interfaces: 10; cleartext http:// literals: 74

### Hard-coded secret candidates

- Long base64-looking string literals (≥40 chars): 160 (count only — values withheld; most are assets/fonts in practice)
- "api_key"/"secret"/"token" constant assignments: 11

## Native libraries

- .so files: 30
- `lib/x86_64/libflutter.so` (11,648,400 B) — versions: —; crypto-symbol strings: 10
- `lib/arm64-v8a/libflutter.so` (10,551,352 B) — versions: —; crypto-symbol strings: 10
- `lib/armeabi-v7a/libapp.so` (9,618,012 B) — versions: —; crypto-symbol strings: 0
- `lib/x86_64/libapp.so` (9,044,912 B) — versions: —; crypto-symbol strings: 0
- `lib/arm64-v8a/libapp.so` (8,717,232 B) — versions: —; crypto-symbol strings: 0
- `lib/armeabi-v7a/libflutter.so` (7,424,676 B) — versions: —; crypto-symbol strings: 10
- `lib/x86_64/libmodpdfium.so` (5,547,800 B) — versions: ['tor 12']; crypto-symbol strings: 0
- `lib/x86/libmodpdfium.so` (5,380,076 B) — versions: ['tor 12']; crypto-symbol strings: 0
- `lib/arm64-v8a/libmodpdfium.so` (5,216,024 B) — versions: ['tor 12']; crypto-symbol strings: 0
- `lib/armeabi-v7a/libmodpdfium.so` (4,683,804 B) — versions: ['tor 12']; crypto-symbol strings: 0
- `lib/x86_64/libc++_shared.so` (1,046,192 B) — versions: —; crypto-symbol strings: 0
- `lib/arm64-v8a/libc++_shared.so` (1,022,136 B) — versions: —; crypto-symbol strings: 0
- `lib/x86/libc++_shared.so` (990,124 B) — versions: —; crypto-symbol strings: 0
- `lib/armeabi-v7a/libc++_shared.so` (609,992 B) — versions: —; crypto-symbol strings: 0

## Ghidra headless — `libflutter.so`

- analyzeHeadless exit 1; report lines: 0

```
(no GHIDRA-REPORT lines produced)
```

