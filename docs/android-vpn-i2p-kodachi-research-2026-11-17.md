# Android gateway rewrite: VPN alternatives, InviZible, I2P and Kodachi

**17 November 2026 report-series label and GitHub content cutoff, not an acquisition/build timestamp.** Live pages and repository metadata are not reconstructed historical snapshots. In particular, the current Kodachi page describes November 19/26 builds, **after this cutoff**; those are isolated below as publisher-claimed candidates, not asserted to have existed at the cutoff. Exact commits, URLs and evidence scope are in the [source register](research/android-vpn-i2p-kodachi-sources-2026-11-17.json).

## Decision and delivered boundary

A **single control interface is feasible**. Simply starting WireGuard, Bitmask, Proton VPN, InviZible Pro and its beta together is not a feasible Android tunnel design. Android permits **one active VPN service per user/profile**, and preparing another can revoke/replace the current VPN. Provider engines and stable/beta channels must be **alternatives**, not additive anonymity layers. This is the platform constraint in the [Android VPN guide](https://developer.android.com/develop/connectivity/vpn), not a UI preference.

The selected rewrite is the **existing Android gateway scaffold plus research**, with the unfinished Torrent Atlas in the same PR. The implementation deliberately does **not** take over the VPN slot:

> **PLAN ONLY: no tunnel engines, routing, DNS protection or kill switch are active in this scaffold.**

Implemented:

- Matching schema-v2 original Java/JavaScript planners, Android/native and browser interfaces, dependency-free Java CLI and inert sample plans.
- One provider choice: `proton-wireguard`, `bitmask`, or owner-managed `wireguard`; one InviZible channel: `stable` **or** `beta`; optional I2P destination-network planning.
- Machine-readable `protectionActive:false`, `enginesBundled:[]`, `tunEstablished:false`, `consentRequested:false`, and explicit unimplemented gates. Unsupported choices, configuration injection and wildcard exclusions fail validation.
- No manifest permissions or registered services, no VPN consent/start, no TUN establishment, no sockets, no provider discovery/login, no profile/private-key import, no root and no analytics/storage. The unregistered stop-only `GatewayVpnService` is not a runnable transport.
- Comment-only `.plan.txt` fragments, rather than plausible-looking `.ovpn`, `torrc` or resolver files. Externally altered JavaScript render values cannot inject active lines.
- A read-only exact-head CI review/build workflow, standard-ZIP WAR packaging and source/output receipts. See [build instructions](../apps/riseup-invizible-gateway/README.md) and [round 95](backlog-execution-round-95-2026-11-17.md) for actual validation status.

The old [October 25 report](riseup-invizible-combined-gateway-research-2026-10-25.md) is historical and superseded. Its statements implying an established TUN, working routing/DNS enforcement, sufficient IPv6 protection from route omission, or a complete upstream-license conclusion must not be used as current evidence.

## 1. What the requested components actually provide

| Component | Actual role | Integration consequence |
| --- | --- | --- |
| WireGuard Android | VPN protocol/client and embeddable tunnel library | Possible provider transport adapter inside the **one** VPN owner. Native ABI, socket protection, lifetime and license review still required. |
| Proton VPN | Provider service and feature-rich official app | Owner-generated standard WireGuard configurations can be used in another compatible client; that does **not** reproduce every Proton app feature, authentication flow or obfuscation option. No provider account/config acquired here. |
| Bitmask / LEAP | Provider-oriented client, provisioning and OpenVPN-related transport stack | Alternative to the WireGuard adapter. A Proton WireGuard profile is not a Bitmask provider definition, and future protocol marketing is not evidence of a shipped compatible engine. |
| Riseup VPN | Provider/application in the LEAP ecosystem | Historical scaffold name, not a separate protocol that can be concatenated with Proton and WireGuard. Provider permissions/terms/discovery remain separate. |
| InviZible Pro | Tor, DNSCrypt and I2P-related local modules with routing modes | Either future embedded modules under one router, **or** an explicitly configured proxy-only companion. Its own VPN mode cannot be a second simultaneous full-device VPN. |
| InviZible beta | Alternative release channel of that project | Not an additional proxy hop. Verify its own artifact, application ID, signer, upgrade/coexistence behavior and notes; do not infer them from the stable channel. |
| I2P / i2pd | Destination-based overlay router/network | Useful for `.i2p` services. Not an Internet-wide commercial VPN and not automatic clearnet anonymity. Reseeding, peer UDP/TCP, startup and battery are real requirements. |
| Tor | TCP-oriented anonymity overlay and application proxy | A SOCKS interface is not a generic UDP tunnel. Standard WireGuard UDP cannot simply be sent through Tor as TCP. Ordinary BitTorrent over Tor is discouraged. |
| DNSCrypt | Encrypted DNS transport/resolver component | Not whole-device routing, publisher authentication or protection from the resolver itself. Bootstrap and fallback behavior matter. |
| Kodachi | Privileged Linux privacy/security distribution and unified dashboard | A useful **control-plane precedent**, not proof that Android VPN apps stack or that every route fails closed. |

Primary material: [WireGuard embedding](https://www.wireguard.com/embedding/), [Proton WireGuard export](https://protonvpn.com/support/wireguard-configurations), [manual Android import](https://protonvpn.com/support/wireguard-manual-android/), [Bitmask model](https://bitmask.net/en/why-use-bitmask/), [InviZible proxy mode](https://invizible.net/en/proxy-mode/), [I2P introduction](https://geti2p.net/en/about/intro), [Tor torrent warning](https://support.torproject.org/about-tor/using-and-sharing/torrent/).

### InviZible stable versus beta: observed release metadata

At the November 17 source cutoff, the examined canonical releases are:

| Channel | Canonical release | Published date | ARM64 APK publisher-reported bytes |
| --- | --- | --- | ---: |
| Beta | [`v2.7.7-beta`](https://github.com/Gedsh/InviZible/releases/tag/v2.7.7-beta) | November 15, 2026 | 47,119,208 |
| Stable | [`v7.6.0-stable`](https://github.com/Gedsh/InviZible/releases/tag/v7.6.0-stable) | October 27, 2026 | 45,861,682 |

Both API records have `prerelease:false`; **that boolean does not distinguish these channels**. Use canonical tag/name/asset/release notes. Sizes and any upstream digest in the register are metadata, not locally computed APK hashes. Neither APK was downloaded, signed-certificate verified, installed or run.

The inspected stable-flavor source declares `pan.alexander.tordnscrypt.stable`; its pinned Gradle file declares compile SDK 37 / target 36 / min 23 / code 277. Those are **upstream source declarations**, not our scaffold's SDK requirements or proof of either downloaded APK. Do not extrapolate the beta package/signing identity or install both from names alone.

## 2. Feasible deployment choices

### A. Usable now, without pretending this scaffold is a VPN

Use **one current official provider client**: Proton VPN, official WireGuard with an owner-generated profile, or the appropriate Bitmask/provider app. Keep its verified update/signing path. Configure and test Android always-on / block-without-VPN only for that **working** client, not this planner.

If local Tor/I2P is needed, InviZible documents **proxy-only** arrangements. Only applications explicitly configured to use the local proxy are covered by that proxy; other applications may bypass it while remaining subject to the provider VPN. Verify bootstrap, exclusions and actual egress on the target device. This report did not test that combination. The [InviZible-with-VPN](https://invizible.net/en/invizible-with-vpn/), [Tor-over-VPN](https://invizible.net/en/tor-over-vpn/) and [VPN-over-Tor proxy](https://invizible.net/en/vpn-over-tor-proxy-mode/) pages describe **specific** arrangements, not universal compatibility. An HTTP-proxy example does not establish WireGuard-UDP-over-Tor.

### B. Future one-APK design: one TUN owner, alternative adapters

```text
One Android UI / non-secret desired plan
                  |
       one VpnService + packet-policy router      NOT IMPLEMENTED
          /               |              \
 provider adapter    selected TCP       .i2p destination
 WG OR LEAP/OVPN       -> local Tor       -> local I2P router
          \               |              /
            explicit egress policy / provider transport
                  |
          protected outer transport socket(s)
                  |
              underlying network
```

The diagram is a design hypothesis, **not the present data plane**. A real router must distinguish application traffic, resolver traffic, overlay transport and outer-provider transport. Protecting every Tor/I2P socket with `VpnService.protect()` would bypass the provider when policy requires provider egress; protecting none of the outer VPN transport sockets can create recursion. Only the actual outer transport should escape to the underlying network under that policy. Same-UID traffic and embedded engines need explicit routing/tagging rather than assumptions about package exclusions.

Required policy table before implementation:

| Traffic class | Intended path | Must not silently do |
| --- | --- | --- |
| Ordinary IPv4/IPv6 | Selected provider adapter | Fall back to underlying clear route on provider failure |
| Selected Tor TCP apps | Local Tor → selected provider, when combined | Treat arbitrary UDP as supported SOCKS traffic |
| `.onion` / `.i2p` names | Correct local overlay resolver/proxy | Leak names to public DNS or a generic outproxy |
| I2P peer/reseed traffic | Explicit provider or documented direct-overlay mode | Inherit a bypass exception unintentionally |
| DNS + DNS bootstrap | Explicit chosen resolver/path and pinned/bootstrap policy | Use a convenient unprotected system resolver after failure |
| Outer provider transport | Protected socket to underlying network | Re-enter its own TUN indefinitely |
| Unsupported UDP/IPv6 | Explicitly block in the implemented router | Equate absent IPv6 routes with leak prevention |
| LAN / excluded apps | Exact owner-reviewed exceptions | Call bypass “protected,” or assume lockdown allows it |

`requirements.defaultRoutes = ["0.0.0.0/0", "::/0"]` is a **requirement**, not an installed route. The implementation must carry or block IPv6 traffic and handle transitions before claiming protection. MTU/MSS values must come from engine/path tests; no magic universal value is selected.

### C. Why not merge upstream APKs or run both channels?

APK concatenation does not compose TUNs, sockets, package identities, native libraries, signatures or provider provisioning. Embedding upstream engines is a separate engineering and redistribution project. InviZible's GPL source, Proton's GPL source, Bitmask's GPL source, WireGuard's Apache-licensed Android library metadata and i2pd's BSD metadata are **not** a complete transitive/native license clearance. No upstream code or binaries were imported into this original planner.

## 3. Pinned source inspection, and its limits

Commits were selected with `until=2026-11-17T23:59:59Z`. Current archive/license/head observations are kept separate from those content pins. These are bounded README/metadata and selected-source inspections, **not** full builds, binary audits or all-language review:

| Repository | Content commit | Examined role / license discovery hint |
| --- | --- | --- |
| [Gedsh/InviZible](https://github.com/Gedsh/InviZible/tree/265ea2117a6d5c322362403be78862d83f065128) | `265ea2117a6d5c322362403be78862d83f065128` | README, manifest/build/service/module metadata; GPL-3.0 |
| [leapcode/bitmask_android](https://github.com/leapcode/bitmask_android/tree/3d92e696a270e543566af2f8a8878cea2dd4db75) | `3d92e696a270e543566af2f8a8878cea2dd4db75` | Provider/OpenVPN build model and LICENSE.txt; GPL-3.0 |
| [ProtonVPN/android-app](https://github.com/ProtonVPN/android-app/tree/416d2ee1d979615d7c644f19338b56f82cb39b68) | `416d2ee1d979615d7c644f19338b56f82cb39b68` | README, build/manifest and version catalog; GPL-3.0 |
| [WireGuard/wireguard-android](https://github.com/WireGuard/wireguard-android/tree/e7b3a3c118836e112620b1302a8ba1873ad4daac) | `e7b3a3c118836e112620b1302a8ba1873ad4daac` | Tunnel build/POM/GoBackend, TUN establishment/socket protection; Apache-2.0 metadata |
| [PurpleI2P/i2pd](https://github.com/PurpleI2P/i2pd/tree/bfeb5bf1198b46e048a6fe3b1e11668bf5dae2bf) | `bfeb5bf1198b46e048a6fe3b1e11668bf5dae2bf` | Router README/metadata; BSD-3-Clause metadata |
| [PurpleI2P/i2pd-android](https://github.com/PurpleI2P/i2pd-android/tree/df7e2420b6a5108caa7463bde420d3ab48ff2888) | `df7e2420b6a5108caa7463bde420d3ab48ff2888` | Android wrapper README/metadata; BSD-3-Clause metadata |
| [i2p/i2p.android.base](https://github.com/i2p/i2p.android.base/tree/4273bd0ff4510f4ee4867577e2317580e9810cc7) | `4273bd0ff4510f4ee4867577e2317580e9810cc7` | Official Java Android wrapper README; license API `NOASSERTION` |
| [i2p/i2p.i2p](https://github.com/i2p/i2p.i2p/tree/78272946cf4fce8c60a65561b2d23249ea7e88ad) | `78272946cf4fce8c60a65561b2d23249ea7e88ad` | Java router README; license API `NOASSERTION` |

The register lists **specific files actually cached/read**, their hashes and discovered native/submodule gitlinks. Enumerating a gitlink is not fetching/reviewing its target. Proton's pinned version catalog names `me.proton.vpn:wireguard-android:1.0.20230512.29`; this proves that dependency declaration, not that stock WireGuard and every Proton feature are interchangeable.

### I2P-specific consequences

[I2P's introduction](https://geti2p.net/en/about/intro) describes an overlay with its own destinations. Public outproxies introduce a separate operator/trust/availability boundary and are not an automatic feature of this plan. `.i2p` handling must not fall back to public DNS.

The [i2pd configuration documentation](https://docs.i2pd.website/en/latest/user-guide/configuration/) distinguishes NTCP2's proxy options from UDP-dependent SSU2. A generic “send through SOCKS” flag does not establish full transport coverage. [Router process instructions](https://docs.i2pd.website/en/latest/user-guide/run/) describe private datadirs and graceful shutdown; translating Unix process commands into an Android foreground-service/battery lifecycle remains work. The inspected [download page](https://i2p.net/en/downloads/) mixed an Android tile/version with inconsistent tarball links: it is not recorded as a verified current APK channel.

I2P-native torrent software and ordinary clearnet BitTorrent are different network models. Torrent Atlas performs **metadata work only** and never joins either. It does not send ordinary torrents over Tor or infer overlay reachability from a parsed magnet.

## 4. Metasearch: discovery, not proof

All four named discovery services were investigated in the combined project. For the gateway follow-through, exact query `Android I2P WireGuard Bitmask InviZible ProtonVPN` was sent to the three actual instances:

- [searx.space](https://searx.space/): directory, **not** a search endpoint. Selected directory entries inspected; its current page includes dates after the report cutoff, not a historical uptime snapshot.
- [BareSearch query](https://baresearch.org/search?q=Android+I2P+WireGuard+Bitmask+InviZible+ProtonVPN&categories=general&language=en): returned **No results**.
- [Utilibre query](https://search.utilibre.org/search?q=Android+I2P+WireGuard+Bitmask+InviZible+ProtonVPN&categories=general&language=en): mixed Bing/Fynd results, including the canonical I2P Android repository and much irrelevant generic Android material. The query service is `search.utilibre.org`, not the portal root.
- [LibreSearch query](https://libresearch.space/search?q=Android+I2P+WireGuard+Bitmask+InviZible+ProtonVPN&categories=general&language=en): returned **No results**.

No-results is an observed response, not proof no combined implementation exists or an instance is permanently offline. Primary Android, upstream repository and protocol documentation governs the architecture above; no search snippet authorizes downloading/running an APK. Password/torrent queries and their distinct responses are in the [companion report](password-managers-and-torrent-research-2026-11-17.md).

## 5. Kodachi side note: the single interface and the ISO

The user's UI observation is useful. Kodachi's publisher describes **one dashboard coordinating separate privileged Linux services**. Selected [whitepaper](https://kodachi.cloud/tools/whitepaper.html) sections discuss service management, signed binaries, paid/free dashboard differences and system policy. This is publisher architecture material, **not** an independent audit, complete source review, or a tested equivalent of Android's VpnService model.

A particularly important limitation is explicit in the [official overview](https://kodachi.cloud/docs/overview.html): routing metrics can leave a clear fallback route usable after tunnel loss. A green dashboard or single interface is therefore not sufficient evidence of a fail-closed packet path. Linux root/firewall/namespaces and Android's one-user-profile VPN slot are different mechanisms.

### DistroWatch → official publisher chain

1. [DistroWatch Kodachi listing](https://distrowatch.com/table.php?distribution=kodachi): active **10.0.3**, Debian Stable, x86_64, Xfce; links the official `kodachi.cloud` site and [downloads](https://kodachi.cloud/downloads/). The listing's major release is distinct from a later ISO rebuild.
2. Official download page: desktop XFCE and terminal/server editions; ISO, SHA-256/SHA-512, detached signature, `.sig.info`, PEM keys and release manifest links. Current route handlers are `download.php?f=xfce-iso` and `download.php?f=terminal-iso`; the initial review did not acquire them; the subsequent owner-authorized desktop acquisition is measured below.
3. Exact metadata candidates below. **Both claim November 19, later than the report cutoff.** They are not labeled “latest as of November 17.” The November 26 `10.0.3-60` APT metapackage / binary build 86 is a different identifier, not desktop ISO build 76 or terminal build 54.

| Edition | Filename / claimed build | Claimed exact bytes from `.sig.info` | Publisher SHA-256, not locally computed |
| --- | --- | ---: | --- |
| Desktop XFCE | `kodachi-os-xfce-10.0.3-amd64.iso` / `10.0.3.76` | 4,544,303,104 | `57693b32079bef101b75f21f3391bd036f1aae72836b8a06c921d236df626c14` |
| Terminal/server | `kodachi-os-terminal-10.0.3-amd64.iso` / `10.0.3.54` | 3,245,793,280 | `19432bb6d719ea5b9eebe1ede7c7caf107ddd187a68eafe3e3170b12402784ac` |

Sources: [desktop `.sig.info`](https://kodachi.cloud/downloads/installers/desktop/kodachi-os-xfce-10.0.3-amd64.iso.sig.info), [terminal `.sig.info`](https://kodachi.cloud/downloads/installers/terminal/kodachi-os-terminal-10.0.3-amd64.iso.sig.info), and the [structured provenance register](research/kodachi-iso-provenance-2026-11-17.json). At the initial metadata-only stage, size/hash agreement between same-publisher pages was **not** an ISO hash/signature verification. The subsequent desktop acquisition below supplies actual byte/hash evidence.

### Actual owner-requested desktop acquisition — still not booted

On the subsequent explicit **download the ISO** request, the read-only [acquisition run 45981578258](https://github.com/shdwelf/Html5/actions/runs/45981578258) downloaded the desktop ISO and matching verification files on a review runner. Source commit **`f132219d538d53f68928f61f17cbc7e1fea0b952`**, job/check **140446523366**. All five offline fetcher controls, acquisition, SHA-256/SHA-512 comparison, OpenSSL detached-signature verification and artifact upload succeeded. The [actual receipt](research/kodachi-iso-acquisition-2026-11-17.json) preserves the runner's reported acquisition clock independently of this report label.

- **4,544,303,104 ISO bytes**, computed SHA-256 **`57693b32079bef101b75f21f3391bd036f1aae72836b8a06c921d236df626c14`**; computed SHA-512 also matches the fixed publisher pin.
- 512-byte detached RSA signature verified by `openssl dgst -sha256` with the **downloaded v10.0.3 PEM key**. Its DER/SPKI SHA-256 is **`1c828cc3a3128a1f9b3f96c27a85d79567bd0ec1008159504fdfcdea1ec8da3b`**.
- **Independent publisher-key authentication remains unestablished.** A valid signature against a key from the same site establishes consistency with that key, not an independent trust anchor or OS security.
- [ISO + verification artifact](https://github.com/shdwelf/Html5/actions/runs/45981578258/artifacts/15188898562), **one-day retention**, archive size **4,544,310,423 bytes** (distinct from ISO size). GitHub reports expiry **2026-11-28T10:23:46Z**; use live artifact metadata. After expiry, rerun the fixed-origin acquisition workflow or use the official download route. No permanent-availability promise.
- The sandbox cannot reach the artifact CDN, so the ISO is **not falsely presented as a local workspace copy**. The runner acquired/uploaded it; the small receipt was retrieved via the authenticated GitHub Checks API. No multi-GB file was committed or added to public app bundles.
- **No boot, mount, installer execution, account, payment or OS configuration change.** The terminal/server edition was not downloaded. No arbitrary fetch URL or script-piped installer is used by the acquisition workflow.

The current [official verification scheme](https://kodachi.cloud/docs/security/file-verify.html) advertises RSA-4096/OpenSSL detached signatures, not a GPG command inferred from old mirrors. The page's v10.0.3 / v9.0.1 keys and BLAKE3 per-binary manifests must not be conflated with the exact desktop ISO/key/signature checked here. Before any boot, independently authenticate the key and review the OS's privilege/update/routing model; then use isolated failure-path tests. ISO integrity does not prove privacy, fail-closed networking or Android suitability.

## 6. Explicit remaining gates

| Gate | Required evidence before enabling a real VPN | Present status |
| --- | --- | --- |
| Engine and redistribution | Exact source/binary/native pins, dependency/SBOM/license review and signed update path | Not implemented; no engines bundled |
| Provider provisioning | Authenticated LEAP provider discovery or owner-managed WireGuard profile handling; safe secret lifetime | Not implemented; planner rejects secrets |
| Single data plane | Real TUN packet router, alternative provider adapter, protected outer sockets and loop tests | Not implemented; no consent/TUN/service registration |
| Resolver and overlay | Bootstrap/no-fallback, `.onion`/`.i2p` separation, supported TCP/UDP behavior | Requirements only |
| Failure safety | IPv4/IPv6/DNS/UDP probes during revoke, crash, reboot, handover, captive portal, network loss and lockdown | Not run |
| Lifecycle | Foreground-service rules, battery/memory/thermal limits, background/recreation, endpoint changes | Not implemented/tested |
| Signing / delivery | Measured build, APK manifest/signature inspection and source/output receipt | Build-review gate, not a packet-protection certificate; see round 95 |
| Owner device | Real device/network acceptance, exclusions/LAN/lockdown tests and recovery to a known-working VPN | Not run |
| Kodachi ISO | Independent publisher-key authentication before boot; isolation/failure-path review | Desktop bytes/hash and downloaded-key signature verified on runner; key trust open, never booted |

The gateway rewrite is complete **as an honest offline scaffold**. These gates remain open and must not be relabeled backlog completions. The original normalized register remains 31 terminal tasks (30 done, T9.3 declined). No owner keys, provider accounts, physical-device approval, private backup or financial/publication gate was changed.
