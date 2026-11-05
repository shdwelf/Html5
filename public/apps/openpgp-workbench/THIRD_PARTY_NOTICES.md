# Third-party notices

## OpenPGP.js 6.3.2

This application uses the unmodified browser distribution `dist/openpgp.min.mjs` from the npm package `openpgp@6.3.2` (OpenPGP.js contributors; <https://github.com/openpgpjs/openpgpjs>). The package declares `LGPL-3.0+`. Its full license text is included in the generated app at `vendor/openpgp.LICENSE`.

The build script copies this browser bundle from the pinned npm package into `public/apps/openpgp-workbench/vendor/`; no runtime CDN or remote module import is used.
