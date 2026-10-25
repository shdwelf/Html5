# Riseup VPN × InviZible — combined gateway research (side project, 2026-10-25)

**Ask:** search GitHub for Riseup VPN and `Gedsh/InviZible`; try creating
a single Android app + WAR + JAR combining their functionality with an
optimised configuration. **Status:** researched; combined deliverables
built clean-room in this repo (below). Round record:
`backlog-execution-round-47-2026-10-25.md`.

## The two upstreams (as found on GitHub, 2026-10-25)

| | Riseup VPN | InviZible Pro |
| --- | --- | --- |
| Canonical repo | `leapcode/bitmask_android` (RiseupVPN is the Riseup-branded Bitmask client; desktop is `leapcode/bitmask-vpn`, Go) | `Gedsh/InviZible` (★ ~2.8k) |
| Licence | GPL-3.0 | GPL-3.0 |
| Language/stack | Java/Kotlin + Go core; submodules `ics-openvpn`, `tor-android`, `bitmask-core-android`; needs JDK 21 + Android SDK 35 + NDK to build | Java/Kotlin, app module `tordnscrypt`; Tor/Purple I2P built by in-repo build scripts; DNSCrypt-proxy bundled |
| Model | **Provider VPN**: one-click client for LEAP-platform providers. The provider publishes an EIP service definition (gateways, transports, credentials); the app fetches it, builds an OpenVPN (or bridged/obfuscated) tunnel through Android `VpnService`, with always-on / block-without-VPN as the kill switch | **Local anonymity stack**: bundles Tor + DNSCrypt + Purple I2P daemons and routes device traffic into them through one `VpnService` front-end (or root tproxy), with per-app routing, firewall rules, and module-level torrc/dnscrypt configuration |
| DNS | Provider-pushed, inside the tunnel | DNSCrypt (encrypted, optionally filtering) + Tor DNS |
| Hidden networks | via bridges/pluggable transports for censorship resistance | `.onion` (Tor) and `.i2p` (Purple I2P) native |

## The combination problem (why a binary-level merge is the wrong deliverable)

1. **Android allows exactly one active `VpnService`.** Both apps are,
   at the OS boundary, a single TUN front-end plus daemons behind it.
   A merged app is therefore *one* VpnService orchestrating both stacks
   — not two apps glued together.
2. **The native payload is the bulk of both projects** (OpenVPN, Tor,
   I2P, DNSCrypt binaries + Go core, NDK cross-builds, submodule pins).
   Forking both into one tree is a multi-week upstream-tracking fork,
   not a reviewable change here — and the build sandbox has no JDK,
   Android SDK, or NDK at all.
3. **Licence:** both are GPL-3.0, so a combined derivative is lawful
   under GPL-3.0 with attribution. This side project instead ships
   **original clean-room code** (no upstream code copied): a unified
   configuration engine that reproduces the *orchestration contract*
   of both models, so a future GPL fork can consume its output.

## What was built (this repo)

A single configuration core with three front-ends, so the "combined
functionality" is real at the layer both apps share — the profile that
tells one VpnService what to become:

- **`js/gateway-config.js`** — pure rule engine. Modes: `vpn`
  (Bitmask-style provider tunnel), `tor-dnscrypt` (InviZible-style
  local Tor+DNSCrypt routing), and `combined` (VPN tunnel up first,
  DNSCrypt reached *through* the tunnel, Tor as a per-app layer, I2P
  optional). It emits the unified profile JSON plus OpenVPN client
  directives, `torrc`, and `dnscrypt-proxy.toml`, and records every
  optimisation as a named decision (DNS forced in-tunnel/encrypted,
  kill switch, IPv6 leak block, LAN bypass off, MTU/MSS clamping,
  per-app exceptions) — conflicts are resolved explicitly, never
  silently.
- **`tools/gateway-config/` (JAR)** — `GatewayConfig.java` is the same
  rule core in dependency-free Java, shared verbatim with the Android
  app; `GatewayMain.java` is a CLI. `arena-gateway-build.yml` compiles
  `gateway-config.jar` on a Temurin runner (the sandbox has no JVM),
  runs it, and commits the jar + sample outputs.
- **`apps/riseup-invizible-gateway/` (Android app)** — a single-module
  Java app (`org.arena.gateway`): one Activity (mode picker + profile
  summary) and one `GatewayVpnService` that builds the TUN interface
  from the same unified profile. The native engines (OpenVPN/Tor/
  DNSCrypt binaries) are **not** bundled — the service is the
  orchestration shell a GPL fork of the upstreams would fill; the UI
  says so. The runner builds `gateway-debug.apk` (debug-signed).
- **`gateway-config.war`** — `scripts/build-gateway-config-war.mjs`
  repackages the web UI (`gateway-config.html` + the JS engine) with
  the JAR under `WEB-INF/lib/`, following the repo's deterministic
  xdc→WAR pattern (static web.xml, Tomcat 9/10, provenance manifest).

## Optimised configuration (the defaults the engine enforces, with rationale)

| Decision | Value | Why |
| --- | --- | --- |
| DNS in `vpn` mode | provider DNS, `block-outside-dns` semantics via TUN DNS + `redirect-gateway` | DNS outside the tunnel is the classic VPN leak |
| DNS in `combined` mode | DNSCrypt (DoH/ODoH-capable resolver) reached through the tunnel; Tor DNS only for `.onion` | encrypted DNS without exposing resolver choice to the local network |
| Kill switch | Android always-on + block-without-VPN; firewall default-deny on tunnel-down | both upstreams treat leak-on-drop as a bug |
| IPv6 | block (no v6 routes until tunnel carries v6) | v6 bypass is a silent leak class |
| LAN bypass | off by default | InviZible-style firewall posture; local-network exceptions are opt-in per app |
| MTU | OpenVPN `tun-mtu 1400`, `mssfix 1360` | avoids fragmentation PMTU blackholes on mobile/carrier NAT |
| Censorship | `bridges: obfs4/snowflake` option in `vpn`/`combined` | Bitmask's pluggable-transport path; costs latency, so opt-in with the warning printed |
| Per-app | default-route all; exceptions list is explicit and echoed in the profile | InviZible's per-app routing, kept auditable |

## Limits

- No upstream code, binaries, gateway lists, or credentials are
  bundled; provider endpoints are configuration inputs, and the
  defaults point at the public LEAP provider model, not at harvested
  Riseup account data (there is none — RiseupVPN needs no account, and
  none was created or used).
- The Android APK is a debug-signed orchestration scaffold; it
  establishes a TUN interface from the profile but ships no tunnel
  engine. Claiming otherwise would be fabrication.
- The WAR is a static web app + library jar; no servlet executes the
  Java on the server (repo WAR precedent — a framework would add
  attack surface, not function).
