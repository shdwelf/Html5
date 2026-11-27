# Backlog round 95 — gateway planner, Torrent Atlas, password research and message inputs

**17 November 2026 report-series label / source-content cutoff, not the time of every live observation or build.** Later publisher/API/runner clocks are preserved separately, not retroactively claimed to describe the cutoff. New user-directed follow-through, not a re-closure of a normalized original task.

## Ordered scope and deliverables

1. **Android gateway scaffold rewrite + research**, selected by the owner: a single offline architecture interface, alternative Proton WireGuard / Bitmask / generic WireGuard provider adapters and stable **or** beta InviZible channel. Original Java/JS schema-v2 planners, Java CLI, inert sample fragments, standard-ZIP WAR and an Android review-build workflow. **No engines, routing, DNS protection, kill switch or VPN consent are active.** The unsafe-looking takeover/active-config implications of the historical scaffold were removed, not cosmetically relabeled.
2. **Torrent Atlas browser app in the same PR**, explicitly selected rather than deferring it: consented outbound search launchpad, magnet parsing/minimization, strict bounded v1/v2/hybrid metadata inspection, deterministic v1 file-based creation and explicit saves. No live result aggregator, tracker/DHT/swarm, invisible proxy or payload download. Existing native/public/private origin and export bounds remain intact.
3. **Password-manager and discovery research:** all named metasearch sites, canonical GitHub pins, Internet Archive metadata and Shadow Libraries directory distinctions. Qualified **1Password** paid best-overall recommendation, with Bitwarden / independently operated KeePass ecosystem alternatives. Full-paper malicious-server findings and vendor/audit/version caveats, not marketing-based immunity claims or security scores. No vault/account/migration test.
4. **Kodachi unified-UI investigation**, DistroWatch → official ISO provenance, then the explicit follow-up **download the ISO**: actual desktop ISO acquisition on a read-only runner, hash checks and downloaded-key signature verification. Never booted/mounted/installed; independent publisher-key trust remains open. ISO stays outside Git and snapshot limits.
5. **OpenPGP correction**, clarified as **encrypted messages/files**: pasted armor or armored/binary file inputs in the password-message workflow. Passphrase-recipient messages need no private key; public-key-only ciphertext still requires its matching private key / authorized hardware key in a suitable trusted client. Byte-preserving decryption in a terminating worker, inert text and separately acknowledged `.bin` save. No private-key-input fallback, secret-key persistence, signature-verification claim or unrelated recovery expansion.

References:

- [Android VPN / I2P / Kodachi report](android-vpn-i2p-kodachi-research-2026-11-17.md), [upstream/source register](research/android-vpn-i2p-kodachi-sources-2026-11-17.json), [ISO provenance](research/kodachi-iso-provenance-2026-11-17.json), [actual acquisition receipt](research/kodachi-iso-acquisition-2026-11-17.json).
- [Password / torrent investigation](password-managers-and-torrent-research-2026-11-17.md), [structured register](research/password-managers-torrent-sources-2026-11-17.json), [Atlas implementation](../apps/torrent-atlas/README.md).
- [Gateway build/boundary](../apps/riseup-invizible-gateway/README.md), [OpenPGP input/boundary](../apps/openpgp-workbench/README.md). Reports/registers remain outside public offline Wiki/SITE-K manual corpora by explicit policy.

## Executed validation — incremental evidence, not yet final-head release certification

| Control | Executed result / evidence scope |
| --- | --- |
| Canonical local Java build | Recovered Temurin **21.0.12.1+1** executed; `javac --release 8` built the planner JAR; mandatory Java tests **4/4**, no skips, including **144** Java/JS topology combinations, defaults, nine inert fragment topologies and invalid CLI inputs. Android SDK/Gradle compilation is a separate runner gate. |
| WAR | Standard raw-DEFLATE ZIP, canonical-JDK JAR embedded; current local build **15,822 bytes / four entries**. Independent `fflate` controls verify source-exact assets and schema-v2 receipt. A reproducible WAR is not a VPN or deployed servlet service. |
| Torrent metadata interoperability | Pinned libtorrent **2.0.11** generated **18** deterministic v1/v2/hybrid fixtures and parsed **four** Atlas exports. **Zero network sessions**; no payload/peer or seed-availability validation. Test-tool dependencies are not app runtime dependencies. |
| Atlas + gateway browser | Latest real Chromium suite **14/14 passed**: actual local workers, metadata/file creation, private gates, wrong-hash save receipt, stale result/save rejection, cancellation, no-worker failure and offline gateway choices. Native saves are adapter doubles, not owner-device evidence. |
| OpenPGP message UI/browser | Real Chromium suite **8/8 passed** with synthetic files and independent GnuPG ciphertext: paste/armor/binary input, exact binary save, wrong password, public-key-only explanation, Stop/page-hide/edit termination, no external request or persistent secret storage. Full regression and final-head reruns are recorded below when complete. |
| ISO fetcher offline controls | **5/5 passed**; fixed origin/size/hash/signature metadata and corruption/refusal controls. |
| Actual Kodachi ISO | [Run 45981578258](https://github.com/shdwelf/Html5/actions/runs/45981578258), source **`f132219d538d53f68928f61f17cbc7e1fea0b952`**, success. Desktop **4,544,303,104 bytes**, matching SHA-256/SHA-512 and OpenSSL signature against same-site downloaded key. **Not independently authenticated or booted.** |

Test totals above overlap; do not add them to form a claimed unique overall total. Early development failures are not concealed: missing HTML controls initially caused 22 DOM failures; an Atlas wrong-hash test double initially returned a valid digest. Both were corrected and the affected suites rerun. A later strict-envelope control was added to reject multiple/reordered encrypted bodies rather than silently accepting an ambiguous message.

### ISO delivery

[Desktop ISO and verification files](https://github.com/shdwelf/Html5/actions/runs/45981578258/artifacts/15188898562), **one-day retention**. GitHub reports expiry **2026-11-28T10:23:46Z**. The artifact ZIP is **4,544,310,423 bytes**, distinct from ISO size; its live metadata is authoritative. The sandbox could retrieve the small receipt via Checks annotations but not the artifact CDN, so no local ISO copy is falsely claimed. Reacquire from the official fixed-origin tool after expiry. The terminal edition remains metadata-only.

## Repository regression at implementation head

- Full **`npm test` exited 0** at **`8b1bd51cc06e3841ae457dcb5977d64395c04ea8`**: **38 Vitest files / 338 tests passed**; Node **1,522 tests, 1,503 passed, 19 skipped, zero failed/cancelled**. Skips are optional/platform/large-key gates, not promoted to passes.
- Focused gateway / Java / WAR / Atlas / message / keyring DOM / launcher / native-export-policy / corpus checks: **238/238 passed**, mandatory real Java and no skips. Subsequent file-selector CSS and Android test-harness changes passed **40/40** focused checks; totals overlap.
- New password-message unit/worker/DOM controls: **21/21**, including duplicate/reordered encrypted-body rejection. Latest isolated baseline OpenPGP browser controls: **11 passed / one same-job 16,384-bit public-control skip**, zero failures. The initial parallel browser/full-test run timed out on public-keyring reload and cascaded one hidden-panel click failure; the unchanged-head isolated rerun and native CI passed. No public-key authorization gate was weakened to make that rerun pass.
- The broad browser launcher hit its 600-second tool envelope while the unrelated all-viewer software-rendering child was still running. Its child subsequently reported **1/1 passed**, and all earlier launched suites completed; this is **not** falsely described as an observed zero exit from that timed-out top-level command.
- Tracked-source audit (after staging the new app): **189 source entrypoints**; **97 public / 99 network / two fixed private apps**. All mixed/private inventory stays ignored. New research/registers are explicitly excluded from public manual bundles. The refreshed Wiki archive contains **348 approved documentation pages**; corpus privacy checks pass.

## Android delivery and final-head review

The initial matching-source gateway build/lint/manifest/signature job **passed** at [run 45984332874](https://github.com/shdwelf/Html5/actions/runs/45984332874), check **140455959779**, implementation head **8b1bd51c**. It produced a **15,353-byte** plan-only APK and the canonical **8,861-byte** JAR; source/output hashes are measured, not guessed. The first annotation transport truncated the APK at 4,096 base64 characters; the decoder refused it before replacing the old file. Smaller checked chunks and a fresh build are required for delivery.

The separate HTML5 Android library check at [run 45984332846](https://github.com/shdwelf/Html5/actions/runs/45984332846) failed in real file-input gesture instrumentation (public/network local-file phases); recovery **3/3**, audio **1/1** and Headline Harry **1/1** passed. A native file-selector target CSS fix and an actual binary-message file-picker/save control were added; the phase is not skipped or converted into success. Final exact-head checks are still being completed for [PR #252](https://github.com/shdwelf/Html5/pull/252). The PR is initially a draft; its live metadata, head, exact checks and merge state govern final delivery. A prior successful ISO acquisition or historical merged PR #251 does not validate the new gateway/Atlas/message implementation. Old gateway APK/SHA files must be replaced with the measured plan-only build rather than distributed as current.

## Retained owner / engineering gates

- Original normalized backlog remains **31 terminal tasks: 30 done, T9.3 declined**; no original row was changed by this round. Historic aggregate stream labels are not reopened task authorizations.
- No real VPN/TUN/packet/router/kill-switch implementation; no leak, DNS/UDP/IPv6, Android reboot/handover/lockdown/failure-path or owner-device claim. One UI does not compose Android VPN apps; no upstream engine/license clearance is inferred from README/API metadata.
- No upstream InviZible/Proton/Bitmask APK acquired or installed, provider account/config/private key imported, subscription/payment/signup or manager migration. The gateway review APK is original planner code, not a bundled upstream client.
- ISO hash/signature consistency with a downloaded key is not independent publisher identity, absence of malware, privacy efficacy or boot authorization. Never booted; no host OS installation/configuration change.
- No swarm, DHT/tracker/peer, external search API fan-out, index backend, remote payload fetch, archive extraction, seed-count/availability or distribution-rights certification. Synthetic independent metadata interoperability is narrower than those claims.
- No recovered owner private key, unauthorized credential attack, private certificate/fingerprint substitute, secret persistence or weakening of exact-recipient/public-keyring/Keybase/network/native file-policy gates.
- Existing preserve/inspect-only archive, exact-recipient encrypted backup, physical-device, financial and draft-publication gates remain unchanged. No cloud app or private backup was accessed for this research.
