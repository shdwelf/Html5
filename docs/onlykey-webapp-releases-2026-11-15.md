# OnlyKey web apps: `apps.crp.to`, `/app/past_releases?version=beta7`, and `apps.onlykey.io`

*Date: 2026-11-15. Scope: what the two OnlyKey web-app origins are, how the
`past_releases` page and its `?version=beta7` query work, which firmware each
site serves, and where the static sources live. Provenance is link/relay
only (F3): everything below was read from the live pages and from the public
GitHub repositories named inline; nothing was executed against a key.*

## Why this came up

`https://apps.crp.to/app/past_releases?version=beta7` renders as a bare
"Loading…" shell when fetched without JavaScript. The page is not empty: the
content is produced client-side by the Webcrypt bundle, and the `?version=`
query is a redirect switch, not a filter. The static tree behind it is public,
so the behaviour can be read instead of guessed.

## The two origins

| origin | app | firmware it serves | source repository |
| --- | --- | --- | --- |
| `https://apps.crp.to` | OnlyKey Webcrypt App **3.0.0** (prod) + the archived beta builds | **v3.0.4 and earlier**, all `v0.2-beta.*` firmware, and "no key at all" | `onlykey/onlykey.github.io` (default branch `heroku-deploy`, Apache-2.0, `CNAME` = `apps.crp.to`) |
| `https://apps.onlykey.io` | OnlyKey Webcrypt App **4.0.0** (prod, Sep 2026) | **newer than v3.0.4** | `trustcrypto/apps.onlykey.io` (Apache-2.0, GitHub Pages from `docs/`, `CNAME` = `apps.onlykey.io`) |

The split is enforced on both sides:

- **Firmware side.** The key only answers a web app whose origin is compiled
  into its trusted-origin table (`webcryptcheck()` / `fido2/device.cpp` in
  `OnlyKey-Firmware`). Newer firmware trusts both sites; v3.0.4 and earlier
  trust only `apps.crp.to`.
- **App side.** Newer firmware completes the OKCONNECT handshake on
  `apps.crp.to` (that origin is in its table) but then speaks *transit v2*,
  which the 3.0.0 app does not, so everything after the handshake would be
  refused. Commit `c96d2bd` (2026-09-22, "Send firmware newer than v3.0.4 to
  apps.onlykey.io", merged as PR #41 on 2026-09-23) adds a `version-route`
  plugin that listens for node-onlykey's `ok-connected`, reads
  `onlykeyApi.FWversion` (sent in the clear in the handshake reply) and, **on
  `apps.crp.to` only**, redirects a newer key to the same page on
  `apps.onlykey.io`. `test/version-route.test.js` pins the rules: the numeric
  triple decides (`v3.0.5-prodc` → `[3,0,5]` → redirect; `v3.0.4-prod`,
  `v2.10.9`, `v0.2-beta.8c`, empty and undefined all stay); `localhost`,
  `onlykey.herokuapp.com` and `onlyagent.app` never redirect; shared pages keep
  path, query and fragment (`/app/encrypt.html?type=e#m` →
  `https://apps.onlykey.io/app/encrypt?type=e#m`), pages that do not exist on
  the new site (`/app/password-generator`) go to its home page.
  `version-route-core.js` is the same file the 4.0.0 app uses.

## `apps.crp.to` landing page and routes

The landing page (CryptoTrust LLC, "OnlyKey Apps") links: Set Time for OTP;
Encrypt & Sign Messages `/app/encrypt`; Encrypt & Sign Files
`/app/encrypt-file`; Decrypt & Verify `/app/decrypt`, `/app/decrypt-file`;
Keybase / Protonmail User Search `/app/search`; "old Webcrypt app releases"
`/app/past_releases`; and "Beta7 firmware compatible Webcrypt app version"
`/app/past_releases?version=beta7`. The README's documented email-signature
pattern (`/app/encrypt?type=e&recipients=<keybase-user>`,
`/app/encrypt-file?type=e&recipients=<keybase-user>`) still resolves here.

Content-Security-Policy on the 3.0.0 pages: `default-src 'self'`,
`script-src 'self' 'unsafe-eval'`, nonce-pinned stylesheets,
`connect-src 'self' https://keybase.io https://onlykey.herokuapp.com
wss://onlykey.herokuapp.com`, `img-src` limited to Gravatar and Keybase
avatar hosts.

## How `past_releases` and `?version=beta7` work

`src/plugins/past_releases/past_releases.js` (bundled into
`docs/app/bundle.<hash>.js`, loaded by `docs/app/past_releases.html`) does, in
order:

1. `fetch('../past_releases/past_releases.json')` — a static manifest:

   ```json
   {"current":"prod3.0.0",
    "Beta8":{"name":"OnlyKey Webcrypt App","version":"8","stage":"Beta",
             "change_log":["Added File Encrypt/Decrypt Support"],
             "authors":["Tim ~ onlykey.io"],
             "firmware_release_url":"https://github.com/trustcrypto/OnlyKey-Firmware/releases/tag/v0.2-beta.8"},
    "beta7":{"name":"OnlyKey Webcrypt App","version":"7","stage":"beta",
             "change_log":["Added Encrypt/Decrypt PGP Support","Added User Search with Keybase.io"],
             "authors":["Tim ~ onlykey.io"],
             "firmware_release_url":"https://github.com/trustcrypto/OnlyKey-Firmware/releases/tag/v0.2-beta.7"},
    "prod3.0.0":{"name":"OnlyKey Webcrypt App","version":"3.0.0","stage":"prod",
             "change_log":["Added Multiple Recipient Support for GPG Encryption","Added Password Generator",
                           "Added ECC PGP Key Support","Added 3rd Party Support"],
             "authors":["Brad ~ bmatusiak.us","Tim ~ onlykey.io"]}}
   ```

2. Renders the `current` entry first with an "Open prod3.0.0 (live)" button
   pointing at `../` (the live app), then one block per archived release with
   an "Open \<stage\>\<version\>" button pointing at
   `../past_releases/<key>/` — i.e. `https://apps.crp.to/past_releases/beta7/`
   and `https://apps.crp.to/past_releases/Beta8/` — plus its change log, a
   "Firmware" button to the matching firmware tag, and the authors.
3. Reads `app.pages.getAllUrlParams().version`; if that key exists in the
   manifest it sets `window.location = "../past_releases/" + version` after
   200 ms. So `?version=beta7` is simply a **JavaScript redirect to the
   archived beta7 build** — with JS disabled nothing happens, which is the
   "Loading…" shell that was observed.

Two small reading notes on the plugin: the "Firmware" button is built from
`releaseData.firmware_release_url[i]`, where `i` is the last change-log index
left over from the preceding `for…in` loop — indexing a string yields one
character, so that button's `href` is a single character (`t` for beta7,
whose log has two entries, `h` for Beta8 with one) rather than the release
URL; and `prod3.0.0` has no `firmware_release_url` at all.
Neither affects the `?version=` redirect.

## The archived builds (static, no server logic)

| path under `docs/` | what it is |
| --- | --- |
| `past_releases/beta7/` | `index.html`, `encrypt.html`, `decrypt.html`, `js/u2f-api.js`, two `bundle.<hash>.js` (1,819,522 B each), `release.js` (`version "7"`, `stage "beta"`, firmware tag `v0.2-beta.7`). CSP is hash-pinned (`script-src 'self' 'sha256-…'`), `connect-src 'self' https://keybase.io`. |
| `past_releases/Beta8/` | adds `encrypt-file*.html` / `decrypt-file*.html` (including `-vir` variants that load `src/virtru-sdk.min.js`), `search.html`, `js/cbor.js`, `src/{app.js, onlykey-api.js, kbpgp.js, ecc.js, forge.min.js, nacl.min.js, asn1.js}`, `release.js` (`version "8"`, firmware tag `v0.2-beta.8`). |
| `past_releases/past_releases.json` | the manifest above |
| `app/past_releases.html` | the plugin host page (3.0.0 bundle) |

The beta7 build is therefore the **U2F-transport** Webcrypt (its only
transport shim is `js/u2f-api.js`), matching firmware `v0.2-beta.7`; Beta8
adds file encryption and the CBOR helper; 3.0.0 moved to the `node-onlykey`
API (`trustcrypto/node-onlykey`, `dist/onlykey3rd-party.js`,
`src/onlykey-fido2/onlykey/*`, last pushed 2022-03-20) and multi-recipient
PGP. `onlykey.github.io` branches still present: `development`,
`get-oksesskey`, `heroku-deploy` (default), `old-github-pages`,
`recursive-u2f`, `route-new-firmware-to-apps-onlykey-io`.

## `apps.onlykey.io` — Webcrypt App 4.0.0

`docs/release.js` in `trustcrypto/apps.onlykey.io` (first commit "Web app
4.0.0" 2026-09-23, source added 2026-09-24, CNAME 2026-10-07):

- For OnlyKey firmware newer than v3.0.4 (served at apps.onlykey.io)
- Post-quantum: age with derived X-Wing keys, and PGP with PQC composite keys
- Authenticated transit encryption (v2) between the app and the key
- Clear message when stored-key (PGP) use is not enabled on the key
- Added Multiple Recipient Support for GPG Encryption · Password Generator ·
  ECC PGP Key Support · 3rd Party Support (carried over from 3.0.0)

Source tree of note: `src/onlykey-fido2/onlykey/{age_file.js, age_pqc.js,
composite_pgp.js, protocol.js, onlykey-api.js, onlykey-pgp.js,
kbpgp-2.1.0.ok.ecc.js, vendor/@noble/*}`; pages `age-encrypt`/`age-decrypt`,
`pqc-encrypt`/`pqc-decrypt`, and the same `past_releases.html` host. Build is
`bash BUILD.sh 1` → `docs/` (production, no debug console), with
`node test/version-route.test.js` as the routing check. Recent pull requests
(all Oct 2026): #1 "PGP: accept keys made by current GnuPG" (subpacket 34),
#2 derive-transit select, #3 CSP nonce / XSS fix, #4 age
`mlkem768x25519` stanza spec, #5 age / rage / typage interop.

## What this means for the repo

- The OnlyKey recipes in `public/apps/cookbook/index.html` §9 and the HMAC /
  derive / backup notes in `docs/GHIDRA_COOKBOOK.md` concern the *device*
  protocol; they are unaffected by which web origin is used. Anyone following
  them with a key on firmware newer than v3.0.4 should expect the 3.0.0 site
  to bounce them to `apps.onlykey.io` after the handshake, by design.
- `?version=beta7` is only useful with `v0.2-beta.7` firmware; the archived
  build is U2F-only and has no file encryption. It is a static directory, so
  it can be mirrored for offline reading from the `heroku-deploy` branch
  without any build step.
- Both repos are Apache-2.0. No private material, keys or session data were
  involved in this reading.

## Sources

- `https://apps.crp.to/` and `https://apps.crp.to/app/past_releases?version=beta7` (live pages, fetched 2026-11-15)
- GitHub `onlykey/onlykey.github.io` @ `heroku-deploy`: `README.md`, `CNAME`, `src/plugins/past_releases/past_releases.js`, `src/release.js`, `docs/release.js`, `docs/past_releases/past_releases.json`, `docs/past_releases/beta7/{index.html,release.js}`, `docs/past_releases/Beta8/release.js`, `docs/app/past_releases.html`, `test/version-route.test.js`, commits `768f450`, `dc1f5fe`, `76ff386`, `c96d2bd`, `ab12e1e`, `4650ffd`, `4ebc146`
- GitHub `trustcrypto/apps.onlykey.io`: `README.md`, `docs/release.js`, `BUILD.sh`, `package.json`, `src/app.js`, `src/entry.js`, `docs/CNAME`, PRs #1–#5
- GitHub `trustcrypto/node-onlykey` (repository metadata and tree)
