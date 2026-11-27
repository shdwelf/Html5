# Android Gateway Planner — NOT a VPN

Schema-v2 rewrite of the historical Riseup × InviZible scaffold. It is an **offline architecture planner**, not a working provider VPN, Tor router, DNS protector or kill switch. Do not replace a working VPN with it and do not configure it as always-on.

The [current investigation](../../docs/android-vpn-i2p-kodachi-research-2026-11-17.md) covers WireGuard, Proton-generated profiles, Bitmask/LEAP, InviZible stable/beta alternatives, I2P and the Kodachi/DistroWatch ISO side note. The old October report is historical and its incorrect TUN/security claims are explicitly superseded.

## Implemented boundary

- One native interface selects a planned mode, **one** alternative provider (`proton-wireguard`, `bitmask`, `wireguard`), **one** InviZible channel (`stable` or `beta`) and optional I2P destination-network planning.
- `GatewayConfig.java` and `js/gateway-config.js` produce matching schema-v2 JSON with mandatory **PLAN ONLY** warnings. IPv6, DNS/bootstrap, lockdown, transport and signing requirements are gates, not active protections. MTU is unspecified pending actual path measurements.
- `MainActivity` never requests VPN consent or starts a service. The manifest has **no permissions and no VPN/service declaration**. The remaining unregistered `GatewayVpnService` is a defensive stop-only stub; it never creates a builder/TUN, opens sockets or logs configuration.
- No provider login, gateway discovery, config/private-key import, engine binaries, upstream application code, root privileges or credentials are included. All generated `.plan.txt` fragments are comments, not runnable engine configs.
- A shared interface does not chain independently running Android VPN apps. Android allows one active VPN per user/profile. Stable/beta are alternatives, I2P is not an Internet-wide provider VPN, and ordinary WireGuard UDP does not run through Tor's TCP SOCKS interface.

## Build and check

JDK 17, Gradle 8.7 / AGP 8.5.2, Android SDK 34; minSdk 24. Review APK version `0.2.0-plan-only` / code 2. It is debug-signed, not an upstream or production release.

```sh
npm ci --ignore-scripts
node scripts/build-gateway-java.mjs
node scripts/build-gateway-samples.mjs
node scripts/build-gateway-war.mjs
GATEWAY_REQUIRE_JAVA=1 node --test tests/gateway-config.test.mjs tests/gateway-java.test.mjs tests/gateway-war.test.mjs
gradle -p apps/riseup-invizible-gateway assembleDebug lintDebug --no-daemon
java -jar research/gateway-config/gateway-config.jar --json
java -jar research/gateway-config/gateway-config.jar /tmp/plans combined false true false proton-wireguard stable cloudflare org.example.app
```

The JAR is original dependency-free planner code. Default builds use `javac --release 8`. The explicit `--legacy-ecj` script option is only a source/behavior-test fallback for a JRE-only sandbox; canonical distribution artifacts come from the JDK CI build. The WAR is a deterministic **static web app + library JAR**, no servlet execution. `WEB-INF/web.xml` targets Jakarta Servlet 6.0 (e.g. Tomcat 10.1), not an untested Tomcat 9 claim.

The read-only `arena-gateway-build.yml` reviews the exact PR head, builds/lints the APK, inspects its manifest and signature, tests Java/JS parity and uploads a measured source/output receipt. It never auto-commits, rebases or pushes. A successful planner build is **not** a leak test or packet-path/device certification. Remaining implementation gates are in the research report and round-95 follow-through.

## Measured review delivery

- [Plan-only APK](../../research/gateway-config/gateway-debug.apk), **15,361 bytes**, version **0.2.0-plan-only / code 2**; **no permissions or registered service**. This debug build is **not a VPN**. Remove/unselect the old scaffold if it had been configured as always-on and return to a known-working, tested VPN; this replacement cannot supply packet protection.
- [JAR](../../research/gateway-config/gateway-config.jar), **8,861 bytes**, and [static WAR](../../gateway-config.war), **20,330 bytes / five entries** after the browser-only static-analysis toolbox update; [SHA-256 list](../../research/gateway-config/SHA256SUMS.txt).
- Measured source **`a9c71e001ef6cb99bd8b6a035af00add7f623707`**, successful [run 45990944063](https://github.com/shdwelf/Html5/actions/runs/45990944063), check **140478329727**. [Build/current-source receipt](../../research/gateway-config/build-receipt.json), [manifest](../../research/gateway-config/apk-manifest.txt), [permissions](../../research/gateway-config/apk-permissions.txt), [apksigner output](../../research/gateway-config/apk-signature.txt).
- APK SHA-256 **`de85273b93cd176dfd5a00edc6a58109d209e30d3646d36bbbaa714a9864d8ac`**. Review certificate SHA-256 **`559c0fb5e0ad6b7735372a8ddc48ab9754987c8e7e94c6f9e116c85533e0ac54`** — disposable Android Debug identity, **not** upstream or production signing. A different old debug signer can prevent in-place installation; uninstalling loses local app data. No installation/owner-device acceptance was performed.
- The delivered binary was retrieved in bounded non-secret Checks chunks and its complete size/hash checked **before replacing** the old APK. The final read-only CI re-verifies the committed APK's v2 signature/manifest and successful measured run, current build-source hashes, Java parity and a fresh build. Later documentation/delivery heads are not falsely substituted for the measured compilation commit.

## Browser-only static-analysis setup

`gateway-config.html` and its static WAR now include local ELF/PE/CLI/Java-header
triage and explicit **Ghidra / ILSpy / javap** setup templates. Java 21 runtime
choices are **Temurin**, **Zulu**, or compatible **OpenJDK**, not alternate
cryptographic/decompiler engines. ILSpy needs a managed .NET input and a .NET
runtime; a native Rust ELF does not become .NET by renaming it.

The optional local file is at most 64 MiB; only its first 64 KiB are read.
No input is uploaded, executed, decompiled, persisted or decrypted in the planner.
Template paths are symbolic, never interpolated from a filename. Offline is the
default; forced-direct and explicit approved HTTPS-proxy acquisition examples do
not cause downloads or change system proxy/VPN settings. Ghidra crypto references
and FindCrypt constants are not a key, proof of encryption, or decryption.

The measured APK/JAR and their ten Java/Android source inputs remain unchanged.
The rebuilt **static web WAR** is a separate updated output, not an assertion that
the original native APK gained a decompiler. See the [ISO inspection report](../../docs/kodachi-vpn-iso-inspection-2026-11-17.md)
for actual measured analysis scope, tool pins and limits.
