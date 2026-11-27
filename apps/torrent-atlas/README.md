# Torrent Atlas

A local-first browser search launchpad and metadata workbench. The maintained source is here; `node scripts/build-torrent-atlas.mjs` produces the exact eight-file copy in `public/apps/torrent-atlas/`. Serve over HTTPS or a trusted local development origin. No npm/CDN package is loaded in the app.

## What works

- **Discover:** 27 typed research sources, seven fixed-origin outbound search templates and local filtering. Consent → prepare/review exact URL → separately open/copy it. This is **not a live result aggregator** and preparing a URL sends nothing. Searx.space is a directory; Utilibre's search lives on `search.utilibre.org`.
- **Magnet lab:** bounded hex/base32 v1, SHA-256 v2 and hybrid-claim inspection. Conflicts/invalid encodings fail closed. Minimal copy drops trackers, web seeds, explicit peers, selections and unknown parameters. No magnet handler is invoked.
- **Inspect:** strict canonical bencode, original-info-byte SHA-1/SHA-256 hashes, file/path/size/private-flag checks, independent expected-hash comparison, v2 piece-layer/Merkle-root consistency and hybrid file/padding consistency. All paths/endpoints are inert text, never extracted or contacted.
- **Create:** deterministic **v1** metainfo for a flat selection of 1–256 files, ≤256 MiB total, configurable 16 KiB–4 MiB pieces; hashes correctly span file boundaries. Private torrents require an explicit tracker and suppress magnet export. Files are neither uploaded nor seeded.
- **Save:** explicit browser download, honestly labeled as a request rather than a confirmed filesystem write. The existing Android `Html5LocalFiles` v1 adapter, when present, uses its system picker and bounded native read-back receipt. Its origin, size, gesture and permission policies are **unchanged**.
- **Password research:** 37 products/clients/retired features and a qualified best-overall paid recommendation, **1Password**. This app is not a password manager; never enter actual credentials, vaults or private keys.

The [investigation](../../docs/password-managers-and-torrent-research-2026-11-17.md) explains evidence coverage, named metasearch responses, GitHub pins, Internet Archive findings and limitations. All test torrents contain synthetic data; no swarm is joined.

## Bounds and security boundary

Metadata ≤4 MiB; nesting ≤32; bencode nodes/pieces ≤65,536; files ≤4,096; magnet ≤16,384 characters/128 parameters; tracker/web-seed entries ≤32 per type. Source creation ≤256 MiB/256 files. Each inspect/create operation gets a new module worker with a hard 60-second deadline. Cancel, edit, tool-switch and page-hide terminate work and discard stale results. No local/session storage, IndexedDB, service worker, analytics, peer/DHT/tracker code or automatic remote request exists. CSP blocks connections and remote execution.

This is a deliberately conservative subset. Legacy non-UTF-8 torrents, unordered/ambiguous dictionaries, unsafe/colliding filenames, symlinks, unsupported exact-topic hashes, over-limit metadata and malformed/extra v2 layers are rejected rather than repaired. Creation does not implement v2/hybrid generation, directory selection or resume/seeding. Minimal magnets can lose peer discovery and never make a private download anonymous. Browser WebTorrent's WebRTC restrictions and server-side Webtor's operator trust are distinct.

**Not proved:** payload correctness, signatures/publisher identity, rights, malware absence, seed availability, provider uptime, owner-device usability or end-to-end anonymity. A matching infohash identifies metadata; it does not prove any of those properties. Ordinary BitTorrent should not be routed over Tor.

## Development / validation

```sh
npm run build:torrent-atlas
npm run check:torrent-atlas
node --test tests/torrent-atlas.test.mjs tests/torrent-atlas-worker.test.mjs
node tests/torrent-atlas-browser.mjs
```

The browser suite uses locked Chromium and synthetic inputs; outbound requests are intercepted, never allowed to reach providers. Native save is covered using adapter test doubles, **not an owner-device test**. The existing launcher instrumentation remains responsible for real Android picker/read-back controls. The app is included in public/network catalogs, never added to the fixed private allowlist or microphone allowlist.
