# BIP-39 offline-launcher candidate audit

## Decision

Neither candidate is included in the Android offline launcher yet. The launcher remains at its previously validated 93 public HTML entrypoints. This avoids importing a candidate with unreviewed mnemonic persistence or unclear bundled-license provenance.

## `haiku.xdc` — BIP-39 Haiku Workbench

- The archive contains 14 ordinary files; its paths are relative and contain no traversal components.
- Static inspection found no remote asset tags or network API calls. The English BIP-39 wordlist and application code are local.
- The archive has no license/notice file in its file list.
- The workbench persists pipes and deliveries in `localStorage`; these values may include mnemonics. It also persists wallet items as AES-GCM ciphertext, but derives the encryption key from the Enso settings/ID (including public defaults), not a user-chosen secret. This is not an acceptable basis for treating saved mnemonics as protected.
- **Disposition:** do not package until the data flow is redesigned so mnemonic-bearing queues and wallet state are not silently persisted, and the code/wordlist license notices are established. No haiku, journal, or personal-record content was copied into the launcher.

## `apps/bip39-standalone.html` — Mnemonic Code Converter

- The file is 4,555,966 bytes (SHA-256 `129b03505824879b8a4429576e3de6951c8599644c1afcaae80840f79237695a`). It is not byte-identical to the official iancoleman/bip39 0.4.3 standalone build (4,259,358 bytes; SHA-256 `6b98b367acdee51961118f57d0ba40e57f369d031a43c673ad76cda97cf61db1`).
- The page's static external-resource tags were not present in the scan; it contains public outbound documentation links and a bundled generic XHR implementation. These are not proof of an active network request, but they do require a behavioral/offline check before inclusion.
- The official 0.4.3 upstream project is MIT-licensed. The local file differs from that pinned build, and its bundled dependency inventory/notices have not been audited completely. The upstream lockfile lists a large transitive dependency set.
- No browser test with real secrets was performed. Any future tests must use public/dummy vectors only and must not persist real mnemonic or wallet material.
- **Disposition:** do not package this modified file until its exact source/build provenance, active network behavior, and bundled dependency licenses are reviewed. A replacement with the exact pinned upstream release would still need the dependency-notice and offline checks.

## Scope note

This audit did not open or extract `internalstorage.7z` or any possible backup. It is limited to the two named candidate files already in the repository.
