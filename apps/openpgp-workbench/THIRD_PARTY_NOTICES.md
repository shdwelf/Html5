# Third-party notices

## OpenPGP.js 6.3.2

This application uses the unmodified browser distribution `dist/openpgp.min.mjs` from the npm package `openpgp@6.3.2` (OpenPGP.js contributors; <https://github.com/openpgpjs/openpgpjs>). The package declares `LGPL-3.0+`. Its full license text is included in the generated app at `vendor/openpgp.LICENSE`.

The build script copies this browser bundle from the pinned npm package into `public/apps/openpgp-workbench/vendor/`; no runtime CDN or remote module import is used.

The application wrappers use OpenPGP.js's exported key, signature and packet APIs. The RSA keyring extension uses a freshly signed classic-preference User ID certification; it does not modify the vendored library or implement a cipher, KDF, hash, fingerprint or RSA primitive. No code from KDE Kleopatra, GnuPG, OpenKeychain, PGPony, Proton VPN or the unconfirmed Photon VPN candidate is copied into this app. Their source-review provenance is documented separately.
