# Backlog execution round 47 — 2026-10-25 (side project: Riseup VPN × InviZible combined gateway)

The backlog itself continues in parallel (S2 finished in round 46 /
PR #155); this round executes the user-directed side project: search
GitHub for Riseup VPN and `Gedsh/InviZible`, combine the functionality
into one Android app + WAR + JAR with optimised configuration, and keep
researching.

## Research (GitHub)

- Riseup's client is **leapcode/bitmask_android** (GPL-3.0; RiseupVPN is
  the branded build; desktop `leapcode/bitmask-vpn`, Go). LEAP provider
  model: EIP service definition → OpenVPN via VpnService, obfs4/snowflake
  pluggable transports. Builds need JDK 21/SDK 35/NDK r28c + submodules —
  a multi-week native fork, not a reviewable single change.
- **Gedsh/InviZible** (GPL-3.0, ~2.8k★): Tor + DNSCrypt-proxy + Purple
  I2P behind one VpnService (or root tproxy); per-app routing, firewall.
- Both are GPL-3.0 so a combined derivative is licence-clean, but Android
  allows exactly one active `VpnService` — the combination is
  architectural, not a binary merge. Full write-up:
  `docs/riseup-invizible-combined-gateway-research-2026-10-25.md`.

## Deliverables (clean-room; no upstream code bundled)

- **Configuration core**, written once per language:
  `js/gateway-config.js` and
  `apps/riseup-invizible-gateway/app/src/main/java/org/arena/gateway/GatewayConfig.java`
  (the same class file is compiled into the JAR and the APK — no drift).
- **Optimisations as named, reasoned decisions** (each recorded in the
  generated profile): combined layering by default (provider tunnel as
  outer layer, Tor/DNSCrypt inside); DNS leak floor (DNSCrypt in-tunnel,
  Tor DNSPort 9053 in combined mode; provider DNS otherwise); kill switch
  (`alwaysOn` + `blockWithoutVpn`, `block-local`, `block-ipv6`); MTU 1400
  / `mssfix 1360`; LAN off unless opted in; bridges require the VPN layer;
  per-app exceptions exclude-only. Conflicting options resolve **loudly**
  (`warnings[]`).
- **Web UI**: `gateway-config.html` renders profile + OpenVPN + torrc +
  DNSCrypt artefacts live.
- **JAR** (runner-built): `research/gateway-config/gateway-config.jar`
  (sha256 `8fbe0571…`) + per-mode samples under
  `research/gateway-config/samples/{combined,vpn,tor-dnscrypt}/`.
- **APK** (runner-built): `research/gateway-config/gateway-debug.apk`
  (sha256 `b7b7ea3a…`), debug-signed scaffold `org.arena.gateway` — one
  VpnService front-end staging the generated profile.
- **WAR** (reproducible): `gateway-config.war`, 11,639 B, 4 entries
  (page, engine, `WEB-INF/web.xml`, jar in `WEB-INF/lib`), STAMPED
  1980-01-01 via `scripts/build-gateway-war.mjs` (`--check` verifies).

## Honesty boundaries (stated in the UI, service, README, research doc)

- The Android scaffold bundles **no tunnel engines** (no OpenVPN/Tor/
  DNSCrypt natives) and `GatewayVpnService` deliberately does not call
  `Builder.establish()`: an established TUN with nothing behind it would
  blackhole all traffic. Wiring real engines = add ics-openvpn /
  tor-android submodules and establish from the staged profile.
- The WAR is a static web app + library jar (no servlet execution).
- No upstream code, gateway lists, or credentials are bundled.

## Test evidence

- `tests/gateway-config.test.mjs` 5/5 — engine modes, decision
  immutables, loud conflicts, exception semantics, artefact renderers.
- `tests/gateway-war.test.mjs` 2/2 — byte-reproducibility (`--check`) and
  WAR layout incl. nested jar validity + deterministic stamp.
- Java parity: runner sample `profile.json` now carries the same
  `decisions` (6) — verified after rebuild run `40179573841`.
- CI: `.github/workflows/arena-gateway-build.yml` run `40179410035`
  (initial) and `40179573841` (parity) both `success`; outputs committed
  by the runner bot under `research/gateway-config/`.
