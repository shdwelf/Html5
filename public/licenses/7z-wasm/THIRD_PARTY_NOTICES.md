# Third-party codec notice

The Haiku Vault v2 optional LZMA2 codec uses `7z-wasm` version 1.2.0, which
wraps 7-Zip 24.09 as WebAssembly. The upstream package's `License.txt` and
`unRarLicense.txt` are included verbatim in this directory. The 7-Zip code is
under GNU LGPL terms with the upstream unRAR restriction; consult both files
before redistributing or modifying the codec. This application invokes only the
standard 7z/LZMA2 coder and does not create RAR archives.

The browser runtime is copied without inlining from the pinned npm package by
`scripts/build-7z-wasm-assets.mjs`. It is distributed as separate JavaScript
and WASM files under `vendor/7z-wasm/`; the application loads those local files
lazily for v2 compression/decompression. Package source and version are
available at <https://github.com/use-strict/7z-wasm/tree/521d2cf93f5964f4e77b01049e19f1b29305c454>.
