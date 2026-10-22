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

- analyzeHeadless exit 0; report lines: 53

```
GHIDRA-REPORT program=libflutter.so language=x86:LE:64:default sha256=7eb2fb3ff4637811477b394810758a285b525804177fc4ffb7f02ac7c3e80194
GHIDRA-REPORT functions_total=25724 functions_crypto_named=6
GHIDRA-FN OPENSSL_memory_alloc
GHIDRA-FN OPENSSL_memory_free
GHIDRA-FN OPENSSL_memory_get_size
GHIDRA-FN OPENSSL_memory_alloc
GHIDRA-FN OPENSSL_memory_free
GHIDRA-FN OPENSSL_memory_get_size
GHIDRA-REPORT external_symbols=451 external_crypto_named=3
GHIDRA-IMPORT OPENSSL_memory_alloc
GHIDRA-IMPORT OPENSSL_memory_free
GHIDRA-IMPORT OPENSSL_memory_get_size
GHIDRA-REPORT defined_strings=15776 strings_http=30 strings_crypto=728
GHIDRA-STR OPENSSL_memory_alloc
GHIDRA-STR OPENSSL_memory_free
GHIDRA-STR OPENSSL_memory_get_size
GHIDRA-STR ChaCha20 for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR AES-NI GCM module for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR AES for Intel AES-NI, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR GHASH for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR SHA1 block transform for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR SHA256 block transform for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR SHA512 block transform for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR Vector Permutation AES for x86_64/SSSE3, Mike Hamburg (Stanford University)
GHIDRA-STR Montgomery Multiplication with scatter/gather for x86_64, CRYPTOGAMS by <appro@openssl.org>
GHIDRA-STR X509_StartValidity
GHIDRA-STR X509_EndValidity
GHIDRA-STR Ffi_dl_processLibrary
GHIDRA-STR Dart_ClassLibrary
GHIDRA-STR encipherOnly
GHIDRA-STR decipherOnly
GHIDRA-STR Encipher Only
GHIDRA-STR Decipher Only
GHIDRA-STR X509v3 Inhibit Any Policy
GHIDRA-STR X509v3 Any Policy
GHIDRA-STR smimeencrypt
GHIDRA-STR setext-genCrypt
GHIDRA-STR EnterSafepoint
GHIDRA-STR X509v3 Issuing Distribution Point
GHIDRA-STR keyEncipherment
GHIDRA-STR dataEncipherment
GHIDRA-STR Key Encipherment
GHIDRA-STR Data Encipherment
GHIDRA-STR sslclient
GHIDRA-STR ssl_client
GHIDRA-STR SSL client
GHIDRA-STR SSL Client
GHIDRA-STR DescriptorSet
GHIDRA-STR id-GostR3411-94-CryptoProParamSet
GHIDRA-STR id-Gost28147-89-CryptoPro-D-ParamSet
GHIDRA-STR id-GostR3410-94-CryptoPro-D-ParamSet
GHIDRA-STR id-GostR3410-94-CryptoPro-XchC-ParamSet
GHIDRA-STR id-Gost28147-89-CryptoPro-C-ParamSet
```

<details><summary>analyzeHeadless log tail</summary>

```
 (AutoAnalysisManager)  
INFO  REPORT: Analysis succeeded for file: file:///tmp/apk-disasm/z+Library_1.0.5_APKPure-so/libflutter.so (HeadlessAnalyzer)  
INFO  REPORT: Execute script: CryptoInventory.java '/tmp/apk-disasm/ghidra-report-z+Library_1.0.5_APKPure.txt'  (HeadlessAnalyzer)  
INFO  SCRIPT: /home/runner/work/Html5/Html5/tools/ghidra_scripts/CryptoInventory.java (HeadlessAnalyzer)  
INFO  ANALYZING changes made by post scripts: file:///tmp/apk-disasm/z+Library_1.0.5_APKPure-so/libflutter.so (HeadlessAnalyzer)  
INFO  REPORT: Post-analysis succeeded for file: file:///tmp/apk-disasm/z+Library_1.0.5_APKPure-so/libflutter.so (HeadlessAnalyzer)  
INFO  /libflutter.so: file created (runner) (LocalFileSystem)  
INFO  REPORT: Save succeeded for: /libflutter.so (ApkNat:/libflutter.so) (HeadlessAnalyzer)  
INFO  REPORT: Import succeeded (HeadlessAnalyzer)  
openjdk version "21.0.12.1" 2026-08-18 LTS
OpenJDK Runtime Environment Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS, mixed mode)
```

</details>

