# OpenPGP keyserver working list — 2026-11-07

## Scope and method

Read-only comparison of `keyserver.ubuntu.com`, `pgpkeys.eu`, and `keys.openpgp.org`, with a discovery trail through GitHub, Archive.org, `searx.space`, `libresearch.space`, `baresearch.org`, and dated secondary/community sources. No keys were uploaded, no private identities were queried, and no propagation test was attempted. Direct statistics below are the servers' own single-request responses, not independent monitoring.

## Server working list

### `keyserver.ubuntu.com`

- **Software / protocol:** The homepage identifies the service as Hockeypuck. The homepage exposes search, Submit Key, exact-match and machine-readable index controls, fingerprint/full-key-hash display, and ASCII-armored/full-hash retrieval. A stats request at `/pks/lookup?op=stats` returned a Hockeypuck statistics page. This is direct UI/endpoint evidence; the upload form's POST was not captured or exercised.
- **Direct status snapshot:** `2026-11-07T12:10:52Z`; server-reported Hockeypuck **2.2**, total **7,964,606 keys**, HTTP port `11001`, Recon port `11370`. It listed two gossip peers, `hockeypuck-1` and `hockeypuck-external-0`, at internal `10.131.13.*` addresses. The peer list had no health/status fields.
- **Lookup / upload / retrieval:** Search and key submission are exposed in the homepage UI; index selection and armored or full-hash retrieval are explicitly visible. No key was submitted or retrieved for this review. Do not infer an identity-verification policy from the presence of a search or upload form.
- **Identity consent / verification:** The reviewed homepage and stats page did not establish an email-verification requirement or a consent/deletion policy. Treat User IDs returned by this service as unverified claims unless authenticated independently.
- **Synchronization:** The direct stats response proves only that the node advertised two gossip peers at the snapshot. It does not prove those peers were reachable or that updates converged. ArchWiki and the PGPkeys.eu 2024 article classify Ubuntu as not synchronizing with the Hockeypuck/SKS graph; those are secondary/operator-published classifications, not a measurement performed here.

### `pgpkeys.eu`

- **Software / protocol:** The homepage identifies Hockeypuck and exposes search, key submission, Delete Info, index selection, and direct retrieval (the page labels direct retrieval as binary). Its stats page is served at the HKP-style `/pks/lookup?op=stats` path. The form's POST behavior was not captured or tested.
- **Direct status snapshot:** `2026-11-07T12:10:53Z`; server-reported hostname `fr.pgpkeys.eu`, version **2.4.1**, total **6,353,751 keys**, HTTP port `11371`, Recon port `11370`.
- **Peer evidence:** The stats page listed **22 gossip peers**: **21 `OK`/`OK`** and one `Starting`/`Starting`. A separate **PKS Targets** table marked its listed entries `Permanent=false` and `Active=false`. That table is not the gossip-peer status table; do not interpret those flags as contradicting the peer rows or as proof of successful synchronization. Both are self-reported status at one instant.
- **Lookup / upload / retrieval:** Search, Submit Key, Delete Info, index options, and direct key retrieval controls are visible. A submit/delete request was not made, and the endpoint's email/UID verification and removal rules remain unverified.
- **Identity consent / verification:** No opt-in verification policy was found in the reviewed page text. Do not assume that a published name or email has been verified by the operator.
- **Synchronization:** The live stats peer table is direct evidence of a configured peer set and its reported state; it is not an end-to-end replication test. ArchWiki and the 2024 PGPkeys.eu article classify the service as synchronizing. The operator's article also says Ubuntu was not then synchronizing. These classifications are useful context, but should remain labeled secondary and dated.
- **Source/code caveat:** The GitHub repository `pgpkeys-eu/hockeypuck` was archived on **2026-05-08**. The live endpoint reported version 2.4.1, but that does not identify which source commit or build produced the live binary. The upstream `hockeypuck/hockeypuck` repository has later activity; do not claim the archived fork is the exact live implementation without a build-to-source link.

### `keys.openpgp.org`

- **Software / protocol:** The service documentation identifies the server as **Hagrid**. Its API page documents both a **limited HKP compatibility interface** and the native **VKS** interface.
- **Lookup / retrieval:** VKS supports `GET /vks/v1/by-fingerprint/<FINGERPRINT>` and `/by-keyid/<KEY-ID>` for primary or subkeys, and `/by-email/<URI-ENCODED EMAIL>` only for an exact address whose owner opted in. The response is ASCII-armored. HKP supports `op=get` and `op=index` with exact email, fingerprint, or long key ID matching; it returns at most one key and omits `op=vindex`. Partial/domain email search and enumeration are intentionally unavailable.
- **Upload / verification:** VKS `POST /vks/v1/upload` accepts one armored or base64 key in JSON and returns a token, fingerprint, and per-address state. `POST /vks/v1/request-verify` sends verification mail for selected addresses; the address becomes searchable after ownership verification. HKP `POST /pks/add` accepts armored submissions, but the API docs direct users to VKS for email verification. Uploads are limited to **1 MiB**.
- **Identity consent / data filtering:** The privacy page says publication of an email address requires **double opt-in**; exact-email lookup is enabled, but enumeration and name search are not. Email removal is available through the Manage flow. Non-email User ID data, image attributes, and unsupported packet types are filtered on upload. The FAQ says third-party certifications are not distributed by default, except attested certifications. Email verification shows control of an address at verification time; it is not proof that the name in a certificate is the real-world person, and is not a trust signature.
- **Synchronization:** The FAQ explicitly says the service is **not in the SKS pool** and is **not federated at present**. This is the operator's direct description, rather than an inference from an empty peer list.
- **Direct status evidence:** The Stats page was retrieved on 2026-11-07. It displays a chart of verified-email addresses, not a live total-key count. No key count or peer-health table was reported, so it is not comparable to the Hockeypuck totals above.
- **Caveats:** The server describes itself as key distribution/discovery, not a certification authority. The FAQ also documents client-compatibility limitations for keys without verified email addresses. Presence on this server is not, by itself, proof of identity or trust.

## Snapshot comparison

| Server | Server-reported version / count | Directly observed synchronization evidence | Identity policy evidence |
| --- | --- | --- | --- |
| Ubuntu | Hockeypuck 2.2; 7,964,606 keys at 12:10:52Z | Two advertised internal gossip peers; no per-peer status | No verification policy established by pages reviewed |
| PGPkeys.eu | Hockeypuck 2.4.1; 6,353,751 keys at 12:10:53Z | 22 listed peers; 21 OK/OK, one Starting/Starting; separate PKS Targets flags are not peer health | No verification policy established by pages reviewed |
| keys.openpgp.org | No total key count exposed; verified-email activity chart | FAQ says not federated and not in SKS pool | Double-opt-in email publication, exact-email lookup, data filtering and self-service removal documented |

Counts are server-reported objects, not counts of unique people, currently usable keys, or authenticated identities. The two Hockeypuck counts are not necessarily comparable across software versions or retention policies. The stats snapshots were taken during a partial UTC day.

## Search and evidence trail

- **GitHub:** The upstream [Hockeypuck repository](https://github.com/hockeypuck/hockeypuck) had a latest visible merge dated 2026-09-07 when inspected. The [PGPkeys EU fork](https://github.com/pgpkeys-eu/hockeypuck) is archived (2026-05-08). [Mailvelope's keyserver](https://github.com/mailvelope/keyserver) is a separate email-verifying implementation; its README describes removal, a REST API, and HKP support. These are implementation sources, not proof of the exact software behind another operator's deployed binary.
- **Archive.org:** Item [`arxiv-cs0308015`](https://archive.org/details/arxiv-cs0308015), *Rethinking OpenPGP PKI and OpenPGP Public Keyserver* (Yamane et al.), is a historical lead. The Archive item associates it with arXiv `cs/0308015` and publication metadata `2003-08-07`, while the scanned paper's first page says `February 1, 2008`. Treat the conflicting dates as metadata/version history, not a single unambiguous publication date. It is not evidence about current server behavior.
- **SearXNG:** [`searx.space`](https://searx.space/) is an instance directory (73 online instances shown when fetched on 2026-11-07), not a keyserver source. Its search route returned empty content in the earlier pass. HTML searches for “OpenPGP keyserver” worked at [`libresearch.space`](https://libresearch.space/search?q=OpenPGP%20keyserver) and [`baresearch.org`](https://baresearch.org/search?q=OpenPGP%20keyserver); JSON requests returned 403. Those result pages are discovery aids and their snippets/cache are not direct evidence.
- **Secondary classification:** ArchWiki's [OpenPGP article](https://wiki.archlinux.org/title/OpenPGP) (retrieved 2026-11-07; revision `oldid=886892`) lists PGPkeys.eu as synchronizing and Ubuntu as not, with Hagrid/keys.openpgp.org as not. Andrew Gallagher's [2024 PGPkeys.eu article](https://blog.pgpkeys.eu/state-keyservers-2024.html) gives a similar operator-authored classification and discusses the then-current network. A [GnuPG-users discussion from 2026-10-19–21](https://mail-archive.com/search?f=1&l=gnupg-users%40gnupg.org&o=newest&q=subject%3A%22Keyservers%22) contains community arguments about federation, WKD, and operator evidence; it is opinion/discussion, not a synchronization measurement.

## Security interpretation and remaining gate

A keyserver is a distribution/discovery mechanism, not proof that a User ID belongs to the person named. Verify the **full fingerprint** over an independent trusted channel and apply the recipient's own trust policy. Email verification (where offered) only demonstrates control of the address at a point in time.

No public key was uploaded for this comparison; that avoids polluting a live directory and avoids making claims about propagation from a synthetic or unauthorized test. A true end-to-end sync test would require an operator-authorized controlled test key and repeated independent retrievals. Remaining research gates are to verify PGPkeys.eu's Delete Info behavior and operator policy, and to ask the Ubuntu/PGPkeys operators for current synchronization configuration if that detail is required.

## Sources and observation dates

All three services and their public documentation were fetched on **2026-11-07**. Direct stats timestamps are included above.

- [Ubuntu homepage](https://keyserver.ubuntu.com/) and [stats](https://keyserver.ubuntu.com/pks/lookup?op=stats)
- [PGPkeys.eu homepage](https://pgpkeys.eu/) and [stats](https://pgpkeys.eu/pks/lookup?op=stats)
- keys.openpgp.org [Usage](https://keys.openpgp.org/about/usage/), [FAQ](https://keys.openpgp.org/about/faq/), [Privacy](https://keys.openpgp.org/about/privacy/), [API](https://keys.openpgp.org/about/api/), and [Stats](https://keys.openpgp.org/about/stats/)
- [Hockeypuck](https://github.com/hockeypuck/hockeypuck), [PGPkeys EU Hockeypuck fork](https://github.com/pgpkeys-eu/hockeypuck), and [Mailvelope keyserver](https://github.com/mailvelope/keyserver)
