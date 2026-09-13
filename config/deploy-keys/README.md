# Deploy keys

Public halves only. Anything that can authenticate (private keys, PEM blobs,
`*_deploy` files without a `.pub` suffix) must **never** be committed here —
`.gitignore` blocks the common patterns, but stay vigilant.

| File | Purpose |
| --- | --- |
| `sync-incoming-deploy.pub` | Public half of the deploy key that pushes snapshots of this repo to [`shdwelf/Html5-sync-incoming`](https://github.com/shdwelf/Html5-sync-incoming). Install it under that repo's **Settings → Deploy keys** with **Write access** checked. Key comment: `key-1789003862838`. Fingerprint: `SHA256:IUmqC00hlMUpFKoNU3ReAcKJQanmtxHVGxZUFfLuGOU`. |

The private half lives in exactly two places:

1. The `SYNC_INCOMING_DEPLOY_KEY` Actions secret on the `shdwelf/Html5` repo
   (consumed by `.github/workflows/deploy-sync-incoming.yml`).
2. An operator's local `~/.ssh/html5_sync_incoming_deploy` (`chmod 600`) for
   direct runs of `scripts/deploy-sync-incoming.sh`.

Full setup and usage: `docs/DEPLOY_SYNC_INCOMING.md`.
