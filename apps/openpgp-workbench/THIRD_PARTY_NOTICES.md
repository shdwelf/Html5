# Third-party notices

## OpenPGP.js 6.3.3

This application uses the unmodified browser distribution `dist/openpgp.min.mjs` from the npm package `openpgp@6.3.3` (OpenPGP.js contributors; <https://github.com/openpgpjs/openpgpjs>). The package declares `LGPL-3.0+`. Its full license text is included in the generated app at `vendor/openpgp.LICENSE`.

The build script copies this browser bundle from the pinned npm package into `public/apps/openpgp-workbench/vendor/`; no runtime CDN or remote module import is used.

The application wrappers use OpenPGP.js's exported key, signature and packet APIs. The RSA keyring extension uses a freshly signed classic-preference User ID certification; it does not modify the normal vendored browser module or implement a cipher, KDF, hash, fingerprint or RSA primitive. No code from KDE Kleopatra, GnuPG, OpenKeychain, PGPony, Proton VPN or the unconfirmed Photon VPN candidate is copied into this app. Their source-review provenance is documented separately.

## Explicit large-RSA worker — local dispatch patch

Chromium's native generator refuses RSA above 8192 bits. Only for the explicitly
selected 12288/16384-bit choices, this app uses a separate dedicated worker. Its
OpenPGP.js 6.3.3 **local build is not the unmodified upstream distribution**:
`scripts/openpgp-large-rsa-build.mjs` adds `bits <= 8192 &&` to the RSA generator's
Web Crypto dispatch condition in the exact npm `dist/openpgp.mjs` (SHA-256
`c6dcff139be7d67a65fabbc3a38437e94bfe8afbf1b06d6217b8c11b42d02778`). In a browser,
this selects the existing upstream `randomProbablePrime(..., 40)` fallback for
these larger sizes. No prime testing, randomness, signature, packet, KDF, cipher
or secret-protection implementation is changed. Native `crypto.getRandomValues`
remains required; no pseudo-random substitute or crypto-global override is used.

The worker is bundled using locked esbuild 0.28.2. Rebuilding requires both the
reviewed input digest and unique dispatch match; an upstream change fails
closed. The generated, readable corresponding worker source is included at
`vendor/openpgp-large-rsa-worker.source.mjs`, with digest/build receipt at
`vendor/large-rsa-build.json`. Upstream distribution legal banners are retained; the full LGPL license is included alongside the build. Obtain
the original source at the exact npm package or
<https://github.com/openpgpjs/openpgpjs/tree/804cf464668fa088e20f7d3fe4501e39aa4cd4e1>;
the one-condition modification and complete reproducible build recipe are in
`scripts/openpgp-large-rsa-build.mjs` in this repository. LGPL-3.0+ still applies
to the OpenPGP.js portions; upstream bundled MIT notices remain in the readable
and compact outputs. The normal vendored browser file, Node dependency and
existing default generation are unchanged. This is a compatibility patch, not
an independent cryptographic security audit or an upstream endorsement.
