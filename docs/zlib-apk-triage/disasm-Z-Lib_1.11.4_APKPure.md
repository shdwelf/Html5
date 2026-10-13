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

- analyzeHeadless exit 0; report lines: 80

```
GHIDRA-REPORT program=libtor.so language=x86:LE:64:default sha256=cf36154cfea32c75cc13666d21e74ca6a79b390c81a5a8447e5653970a5b18e4
GHIDRA-REPORT functions_total=14104 functions_crypto_named=60
GHIDRA-FN tor_main_configuration_new
GHIDRA-FN tor_main_configuration_set_command_line
GHIDRA-FN tor_main_configuration_setup_control_socket
GHIDRA-FN tor_main_configuration_free
GHIDRA-FN tor_api_get_provider_version
GHIDRA-FN tor_main
GHIDRA-FN tor_init
GHIDRA-FN tor_remove_file
GHIDRA-FN run_tor_main_loop
GHIDRA-FN tor_run_main
GHIDRA-FN tor_init_connection_lists
GHIDRA-FN tor_shutdown_event_loop_and_exit
GHIDRA-FN tor_event_loop_shutdown_is_pending
GHIDRA-FN tor_mainloop_free_all
GHIDRA-FN connection_tls_start_handshake
GHIDRA-FN connection_tls_continue_handshake
GHIDRA-FN channel_tls_connect
GHIDRA-FN channel_tls_get_listener
GHIDRA-FN channel_tls_start_listener
GHIDRA-FN channel_tls_free_all
GHIDRA-FN channel_tls_handle_incoming
GHIDRA-FN channel_tls_from_base
GHIDRA-FN channel_tls_to_base
GHIDRA-FN channel_tls_to_base_const
GHIDRA-FN channel_tls_from_base_const
GHIDRA-FN channel_tls_handle_state_change_on_orconn
GHIDRA-FN channel_tls_handle_cell
GHIDRA-FN channel_tls_handle_var_cell
GHIDRA-FN channel_tls_update_marks
GHIDRA-FN control_event_my_descriptor_changed
GHIDRA-FN control_event_hs_descriptor_requested
GHIDRA-FN control_event_hs_descriptor_created
GHIDRA-FN control_event_hs_descriptor_upload
GHIDRA-FN control_event_hs_descriptor_upload_end
GHIDRA-FN control_event_hsv3_descriptor_received
GHIDRA-FN control_event_hs_descriptor_uploaded
GHIDRA-FN control_event_hsv3_descriptor_failed
GHIDRA-FN control_event_hs_descriptor_content
GHIDRA-FN control_event_hs_descriptor_upload_failed
GHIDRA-FN router_get_mutable_consensus_status_by_descriptor_digest
GHIDRA-FN router_get_consensus_status_by_descriptor_digest
GHIDRA-FN router_get_descriptor_digests
GHIDRA-FN router_get_dl_status_by_descriptor_digest
GHIDRA-FN nodelist_find_nodes_with_microdesc
GHIDRA-FN node_get_curve25519_onion_key
GHIDRA-FN node_get_rsa_id_digest
GHIDRA-FN node_has_curve25519_onion_key
GHIDRA-FN node_get_rsa_onion_key
GHIDRA-FN nodes_in_same_family
GHIDRA-FN router_exit_policy_all_nodes_reject
GHIDRA-FN router_add_running_nodes_to_smartlist
GHIDRA-FN router_get_by_descriptor_digest
GHIDRA-FN extrainfo_get_by_descriptor_digest
GHIDRA-FN signed_descriptor_get_body
GHIDRA-FN signed_descriptor_get_annotations
GHIDRA-FN router_descriptor_is_older_than
GHIDRA-FN update_all_descriptor_downloads
GHIDRA-FN update_router_descriptor_downloads
GHIDRA-FN router_reset_descriptor_download_failures
GHIDRA-FN launch_descriptor_downloads
GHIDRA-REPORT external_symbols=231 external_crypto_named=0
GHIDRA-REPORT defined_strings=30843 strings_http=132 strings_crypto=7291
GHIDRA-STR tor_main
GHIDRA-STR crypto_sign_ed25519_ref10_fe_0
GHIDRA-STR crypto_sign_ed25519_ref10_fe_1
GHIDRA-STR crypto_sign_ed25519_ref10_fe_add
GHIDRA-STR crypto_sign_ed25519_ref10_fe_cmov
GHIDRA-STR crypto_sign_ed25519_ref10_fe_copy
GHIDRA-STR crypto_sign_ed25519_ref10_fe_frombytes
GHIDRA-STR crypto_sign_ed25519_ref10_fe_invert
GHIDRA-STR crypto_sign_ed25519_ref10_fe_isnegative
GHIDRA-STR crypto_sign_ed25519_ref10_fe_isnonzero
GHIDRA-STR crypto_sign_ed25519_ref10_fe_mul
GHIDRA-STR crypto_sign_ed25519_ref10_fe_neg
GHIDRA-STR crypto_sign_ed25519_ref10_fe_pow22523
GHIDRA-STR crypto_sign_ed25519_ref10_fe_sq
GHIDRA-STR crypto_sign_ed25519_ref10_fe_sq2
GHIDRA-STR crypto_sign_ed25519_ref10_fe_sub
```

<details><summary>analyzeHeadless log tail</summary>

```
 (AutoAnalysisManager)  
INFO  REPORT: Analysis succeeded for file: file:///tmp/apk-disasm/Z-Lib_1.11.4_APKPure-so/libtor.so (HeadlessAnalyzer)  
INFO  REPORT: Execute script: CryptoInventory.java '/tmp/apk-disasm/ghidra-report-Z-Lib_1.11.4_APKPure.txt'  (HeadlessAnalyzer)  
INFO  SCRIPT: /home/runner/work/Html5/Html5/tools/ghidra_scripts/CryptoInventory.java (HeadlessAnalyzer)  
INFO  ANALYZING changes made by post scripts: file:///tmp/apk-disasm/Z-Lib_1.11.4_APKPure-so/libtor.so (HeadlessAnalyzer)  
INFO  REPORT: Post-analysis succeeded for file: file:///tmp/apk-disasm/Z-Lib_1.11.4_APKPure-so/libtor.so (HeadlessAnalyzer)  
INFO  /libtor.so: file created (runner) (LocalFileSystem)  
INFO  REPORT: Save succeeded for: /libtor.so (ApkNat:/libtor.so) (HeadlessAnalyzer)  
INFO  REPORT: Import succeeded (HeadlessAnalyzer)  
openjdk version "21.0.12.1" 2026-08-18 LTS
OpenJDK Runtime Environment Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS, mixed mode)
```

</details>

