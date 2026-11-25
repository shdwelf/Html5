# Zangi public-source review — 2026-11-04

## Scope and method

This is a source-and-claims review, not an application security audit. Sources were
checked in the requested order: **official page → GitHub → F-Droid → Google Play →
APKPure → APKMonk → Archive.org**. Retrieval status and provenance are recorded
below. A statement in a vendor or mirror listing is attributed to that listing;
it is not treated as independently verified behavior.

## Source-by-source findings

| Order | Source | Finding and limits |
| --- | --- | --- |
| 1 | [Zangi official site](https://zangi.com/) | The company describes private messaging, end-to-end encryption, local storage, registration without a personal phone number, and proprietary transport/file-transfer features. These are company claims. No protocol specification, source code, key-verification design, or independent audit report was located on the public page during this review. |
| 2 | [GitHub search: “zangi messenger”](https://github.com/search?q=zangi+messenger&type=repositories) and [package search](https://github.com/search?q=com.beint.zangi&type=repositories) | No publisher-confirmed Zangi client source repository was found. This is a bounded search result, not proof that no repository exists elsewhere. Third-party references to the package do not establish official authorship. |
| 3 | [F-Droid package URL](https://f-droid.org/packages/com.beint.zangi/) | The package page returned 404. No F-Droid distribution or build recipe was verified. A missing page does not establish that the app has never been distributed there. |
| 4 | [Google Play listing](https://play.google.com/store/apps/details?id=com.beint.zangi&hl=en) | The listing identifies package `com.beint.zangi`, publisher Secret Phone, Inc., and 50M+ downloads; it showed an update dated 2026-10-25 when checked. The description claims AES-GCM-256 end-to-end encryption for messages, calls, media, and files. Google Play’s Data safety statements (including no data collected/shared and encryption in transit) are developer-provided disclosures, not an independent measurement of app behavior. |
| 5 | [APKPure listing](https://apkpure.com/zangi-private-messenger/com.beint.zangi) | The listing offers version 6.6.4 as an XAPK, states 64.7 MB and an update date of 2026-10-25, and displays a VirusTotal result of 0/64 plus SHA-256 `90e1dd5531184285a4b8d06733857275a8e656f9352a8512b63ebf1700e89f5f`. These are mirror-reported metadata and a point-in-time multi-engine result. Neither proves the package is official or free of malware, and the hash was not independently matched to a locally analyzed artifact. |
| 6 | [APKMonk listing](https://www.apkmonk.com/app/com.beint.zangi/) | Direct retrieval failed. A search-index snapshot showed version 6.0.4 dated 2024-12-06; it is stale relative to the Play/APKPure listing and was not treated as a current binary source. |
| 7 | [Archive.org item: Zangi APK v6.6.2](https://archive.org/details/zangi-apk-v6-6-2) | A community-uploaded v6.6.2 XAPK was found. It is a different version from the 6.6.4 public listing and does not establish the provenance or hash of a current package. Archive search did not return a verified 6.6.4 item. |

## Assessment

- **Public source-code status:** no official client repository, published protocol
  specification, or independently scoped security audit was confirmed in this
  source pass.
- **Encryption status:** the AES-GCM-256 and end-to-end-encryption descriptions
  are vendor claims. An algorithm name and key size alone do not establish
  endpoint key control, forward secrecy, authentication, contact verification,
  metadata protection, backup behavior, or implementation correctness.
- **Data-safety status:** store disclosures should be read as publisher
  declarations. They do not by themselves demonstrate what network traffic,
  telemetry, proxy infrastructure, operating-system integrations, or backups
  contain.
- **Mirror status:** APKPure’s reported scan/hash are useful leads, not a trust
  chain. The Archive.org item is community supplied; the APKMonk page was not
  retrieved. None substitutes for verifying the package signature and comparing
  it with a publisher-authenticated release.
- **Conclusion:** the public evidence supports describing Zangi as a
  closed-source messenger whose publisher claims end-to-end encryption. It does
  **not** support either a positive independent security verdict or a claim that
  the app is compromised.

No public APK was downloaded or executed for this review. No private artifact,
identifier, or link is included here.

## Source register

- [Zangi](https://zangi.com/)
- [Zangi on Google Play](https://play.google.com/store/apps/details?id=com.beint.zangi&hl=en)
- [Zangi on APKPure](https://apkpure.com/zangi-private-messenger/com.beint.zangi)
- [Zangi on APKMonk](https://www.apkmonk.com/app/com.beint.zangi/)
- [Zangi APK v6.6.2 on Archive.org](https://archive.org/details/zangi-apk-v6-6-2)
- [F-Droid package URL](https://f-droid.org/packages/com.beint.zangi/)
- [GitHub repository search](https://github.com/search?q=com.beint.zangi&type=repositories)
