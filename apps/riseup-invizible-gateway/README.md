# Riseup × InviZible Gateway — Android scaffold

Single-module Android app for the combined-gateway side project
(research: `docs/riseup-invizible-combined-gateway-research-2026-10-25.md`).

- `org.arena.gateway.GatewayConfig` — the clean-room configuration
  core (modes `vpn` / `tor-dnscrypt` / `combined`, optimised
  decisions). The **same source file** is compiled into the CLI JAR
  by `arena-gateway-build.yml`.
- `org.arena.gateway.MainActivity` — mode picker + profile summary.
- `org.arena.gateway.GatewayVpnService` — the single `VpnService`
  front-end. It stages the profile and logs the TUN parameters; it
  does **not** establish a tunnel, because the native engines
  (OpenVPN/Tor/DNSCrypt from the GPL-3.0 upstreams
  `leapcode/bitmask_android` and `Gedsh/InviZible`) are not bundled
  in this scaffold.

Build (runner, see `.github/workflows/arena-gateway-build.yml`):
debug APK with Gradle 8.7 + AGP 8.5.2, SDK 34, debug-signed. The APK
and the CLI JAR are committed under `research/gateway-config/` with
SHA-256 sums. No upstream code, gateway lists, or credentials are
included.
