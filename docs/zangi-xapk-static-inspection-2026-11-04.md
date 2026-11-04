# Zangi XAPK static inspection — 2026-11-04

## Scope and handling

Four user-supplied RAR5 volumes were processed in a temporary directory outside
the repository. The extracted package and split APKs were not copied into Git or
Dropbox, and no package code was executed. This note omits private transfer
identifiers, links, file paths, and copied content.

## Findings

- The four-volume RAR archive passed UnRAR's integrity test. The contained XAPK
  passed its ZIP CRC test and had no absolute or parent-traversal entry paths.
- The extracted XAPK's SHA-256 matched the digest on the public APKPure listing,
  already recorded in the [public-source review](zangi-public-source-review-2026-11-04.md).
  This identifies the supplied attachment with that published APKPure artifact;
  it does **not** establish that any separate Drive item has identical bytes.
- The XAPK manifest identifies package `com.beint.zangi`, version `6.6.4`
  (version code `2653`), minimum SDK `23`, target SDK `37`, and three APK splits:
  base, `arm64-v8a`, and `xxhdpi`.
- The base and both configuration splits had v1 JAR/PKCS#7 signatures that
  verified against the included signer certificate with certificate-chain
  validation disabled; all listed JAR entry digests matched. The three splits
  used the same certificate. Their signature metadata advertises Android
  signing schemes v2 and v3, which were not independently verified in this
  pass. Signature consistency is not a publisher-identity or security verdict.
- The base manifest declares 89 permission names. Among them are camera,
  microphone, coarse/fine location, contacts, phone state, media/storage,
  Bluetooth, and overlay-related permissions. A manifest declaration alone
  does not show that a permission was granted at runtime or that the app used it.

## Limits and next gate

This was a package-integrity and manifest pass, not a malware analysis, runtime
or network test, complete DEX disassembly, or independent E2EE audit. No claim
about the app's security follows from the matching public checksum or valid
signatures. APKPure's VirusTotal summary remains a listing-reported result, not
an independent scan performed here.

The cellular-automata / “Holy Grail” decryption task is separate and remains
blocked on identifying its target program and supplying an exact known
plaintext/ciphertext or CA-state vector. The Zangi package was not assumed to be
that target; no CyberChef operation or cookbook card was added.
