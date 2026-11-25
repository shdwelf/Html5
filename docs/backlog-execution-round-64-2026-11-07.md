# Backlog execution round 64 — 2026-11-07 (Zangi VPN tunneling, NanoProxy, Z-Library/IPFS research)

## Scope and handling

This round is public-source research only. The user asked to compare a Zangi-with-VPN path and a separate VPN path, research-first, and limited Z-Library/IPFS follow-up to authorized content. No code was changed, no VPN or Z-Library binary was built or run, no book-title query or IPFS content retrieval was made, and no mirror list or CID was collected. No private Drive ID or link appears in this report. No Zangi XAPK was executed.

## 1. Zangi's in-app VPN Tunneling switch

The user was correct: Zangi's current Premium FAQ documents an in-app **VPN Tunneling** switch. The vendor says that it routes **Zangi traffic only** through a globally distributed set of randomly selected “nano proxies,” to help with restricted or unreliable direct connections. It explicitly says the feature does not route all device traffic and is separate from the app's end-to-end encryption. The FAQ locates the toggle under **Settings → VPN Tunneling**. The current Google Play listing also advertises the feature.

These are vendor/store claims, not an independent performance or privacy audit. The public FAQ does not identify the tunnel protocol, proxy endpoints, authentication, DNS handling, proxy operators, or whether Android `VpnService` is used versus an app-level transport. The earlier Zangi DEX report did not analyze this feature's implementation. There is no Zangi APK/XAPK staged in this checkout, so no additional static package inspection was attempted.

**Rebuild implication:** the published Zangi app already claims to contain this optional feature; enabling it does not require a rebuild. A reproducible source rebuild is still blocked: the prior public-source review found no publisher-confirmed source repository, protocol specification, or build recipe. Repacking the closed-source XAPK would not be a source rebuild, and was not attempted.

## 2. NanoProxy naming and separate-VPN feasibility

The phrase “nano proxies” in Zangi's FAQ describes a Zangi-operated feature. It is not evidence that Zangi uses any public GitHub project named NanoProxy, and no public endpoint or compatibility contract for Zangi's proxy network was found.

Two unrelated GitHub projects help distinguish the names:

- `leekcake/NanoProxyAndroid` is an archived Android support utility for KanColle. Static source review shows its `NanoProxyServiceDesu` extends the ordinary Android `Service` class and starts its proxy server on port 3952. Its manifest does not declare an Android `VpnService` or `BIND_VPN_SERVICE`; the repository page shows no explicit license. It is not a suitable VPN implementation or a verified general-purpose tunnel client.
- `ryanbekhen/nanoproxy` is a Go HTTP/SOCKS5 **proxy server**, MIT-licensed. Its README describes the project as pre-production; its optional Tor mode is provided through a container image, and its README says it logs requests/responses. This is a server-side proxy, not an Android VPN client or a connection to Zangi's in-app nano-proxy feature. No security audit or code execution was performed.
A separate Android VPN client would need its own tunnel engine to read packets from a TUN interface and send them through an identified, authorized endpoint. A SOCKS/HTTP proxy by itself does not create that TUN bridge or provide transport encryption. A per-app design could target `com.beint.zangi` without modifying Zangi, but compatibility with Zangi's built-in feature is unknown. If the built-in feature uses Android `VpnService`, another VPN app could conflict because Android exposes one active VPN service per user/profile; the public sources do not establish whether Zangi uses that mechanism.

The repository's existing `apps/riseup-invizible-gateway` remains a configuration/orchestration scaffold without tunnel engines; `GatewayVpnService` deliberately does not call `Builder.establish()`. Java, Gradle, and ADB were not available in this workspace. No standalone VPN implementation or APK was created.

## 3. GitHub search: unofficial Z-Library projects

GitHub repository/topic searches surfaced a broad mix of unofficial API wrappers, Android/reader clients, scrapers, and mirror/entry-point indexes. Their repository names, popularity, recent commits, or self-described “official” labels do not authenticate the operator, establish that an APK is safe, or establish authorization to distribute the indexed books. This report does not include operational mirror links or instructions. No app was installed, no repository was executed, and no copyrighted title was searched.

For follow-up, use only public-domain or otherwise authorized catalogs/content, as the user selected. Any specific repo should be reviewed for provenance, license, credential handling, endpoints, dependencies, and data collection before adoption. The earlier [Z-Library APK/Ghidra research](zlibrary-apk-ghidra-research-2026-10-13.md) remains the provenance and scam-risk baseline.

## 4. IPFS search projects and limits

The public GitHub search found several IPFS search projects, but none verified a complete, currently maintained, rights-aware index suitable for arbitrary book searches:

- [`ipfs-search/ipfs-search`](https://github.com/ipfs-search/ipfs-search) describes a DHT-gossip sniffer and crawler backed by OpenSearch and RabbitMQ, with a Node.js API/frontend. That is a centralized index/crawler over IPFS-addressed content, not a fully decentralized search index. The latest visible master commit is from 2023, and `ipfs-search.com` currently displays a domain-for-sale page.
- [`Mubelotix/admarus`](https://github.com/Mubelotix/admarus) describes peer-to-peer search, but the repository was archived in October 2025; README scale/performance claims are the author's, not independent measurements.
- [`navinkeizer/Deece`](https://github.com/navinkeizer/Deece) describes an experimental decentralized index; its README says the server is down and the project is unmaintained.

No live content query was issued and no CID or IPFS object was retrieved. A future authorized-content path should begin with a verified public-domain/licensed manifest or user-provided authorized CIDs, not a general shadow-library index.

## Status and next gates

| Track | Result | Gate before implementation |
| --- | --- | --- |
| Zangi built-in tunneling | Official FAQ verifies an app-only Premium switch using Zangi's nano-proxy network, per vendor description. | A technical mechanism/source is not public; no source-based Zangi rebuild is available. |
| Separate VPN | Feasible only as a distinct VPN client, not by treating a proxy server as a VPN. | Select app-only vs device-wide routing, a lawful server/provider, secure tunnel protocol, authentication, and whether the Zangi in-app tunnel is enabled. |
| Z-Library/IPFS | GitHub landscape and IPFS search architectures reviewed at repo/metadata level only. | Keep any content lookup within public-domain or explicitly authorized material; no unverified mirror/CID use. |

## Sources

- [Zangi Premium FAQ](https://zangi.com/faq/premium)
- [Zangi Google Play listing](https://play.google.com/store/apps/details?id=com.beint.zangi&hl=en_US)
- [`leekcake/NanoProxyAndroid`](https://github.com/leekcake/NanoProxyAndroid), [manifest](https://github.com/leekcake/NanoProxyAndroid/blob/master/app/src/main/AndroidManifest.xml), and [service source](https://github.com/leekcake/NanoProxyAndroid/blob/master/app/src/main/java/com/leekcake/kancolle/proxy/nanodesu/NanoProxyServiceDesu.java)
- [`ryanbekhen/nanoproxy`](https://github.com/ryanbekhen/nanoproxy)
- [GitHub Z-Library topic search](https://github.com/topics/zlibrary)
- [`ipfs-search/ipfs-search`](https://github.com/ipfs-search/ipfs-search) and [current `ipfs-search.com` landing page](https://ipfs-search.com/)
- [`Mubelotix/admarus`](https://github.com/Mubelotix/admarus) and [`navinkeizer/Deece`](https://github.com/navinkeizer/Deece)
- [Android VPN developer guide](https://developer.android.com/develop/connectivity/vpn)
