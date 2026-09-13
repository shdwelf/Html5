# Deploying to `Html5-sync-incoming` via deploy key

`scripts/deploy-sync-incoming.sh` pushes a branch snapshot of this repo to
[`shdwelf/Html5-sync-incoming`](https://github.com/shdwelf/Html5-sync-incoming)
over SSH, authenticating with a dedicated deploy key. `.github/workflows/
deploy-sync-incoming.yml` runs the same script in CI on demand.

Nothing is merged. The source ref lands on a namespaced branch
(`deploy/html5-<source-branch>` by default) in the target repo, whose history
is unrelated to this one. The script refuses to push onto `main`/`master`.

## Keypair

| Half | Location |
| --- | --- |
| Public (`ssh-ed25519 … key-1789003862838`) | `config/deploy-keys/sync-incoming-deploy.pub` (committed — public is fine) |
| Private (OpenSSH PEM) | **Never committed.** Lives only in the `SYNC_INCOMING_DEPLOY_KEY` Actions secret and operators' local `~/.ssh`. |

Fingerprints (verify these wherever the key is installed):

- `SHA256:IUmqC00hlMUpFKoNU3ReAcKJQanmtxHVGxZUFfLuGOU`
- The script pins this fingerprint by default (`EXPECTED_FINGERPRINT`) and
  aborts if a different key is offered.

## One-time setup

### 1. Register the public key on the target repo (write access)

1. Open <https://github.com/shdwelf/Html5-sync-incoming/settings/keys>.
2. **Add deploy key**, title e.g. `Html5 deploy (key-1789003862838)`.
3. Paste the entire contents of `config/deploy-keys/sync-incoming-deploy.pub`.
4. Check **Allow write access** (read-only is the default and cannot push).
5. **Add key**.

Notes:

- A key can be a deploy key on exactly one repository, and it cannot also be
  attached to a user account. If GitHub says the key is already in use, it
  must be removed from wherever it currently lives first.
- Deploy keys are repo-scoped: this key can push to `Html5-sync-incoming`
  only — it grants nothing else, which is the point.

### 2. Store the private key as an Actions secret on this repo

1. Open <https://github.com/shdwelf/Html5/settings/secrets/actions>.
2. **New repository secret**, name exactly `SYNC_INCOMING_DEPLOY_KEY`.
3. Paste the **full private key**, including the
   `-----BEGIN/END OPENSSH PRIVATE KEY-----` lines.
4. **Add secret**.

### 3. (Local runs) Install the private key on your machine

```bash
# paste the private key PEM, then lock it down
umask 077
cat > ~/.ssh/html5_sync_incoming_deploy <<'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
... (private key body) ...
-----END OPENSSH PRIVATE KEY-----
EOF
chmod 600 ~/.ssh/html5_sync_incoming_deploy
ssh-keygen -l -f ~/.ssh/html5_sync_incoming_deploy
# must show SHA256:IUmqC00hlMUpFKoNU3ReAcKJQanmtxHVGxZUFfLuGOU
```

The script seeds `~/.ssh/known_hosts` with GitHub's published host keys
automatically; no `ssh-keyscan` step needed.

## Usage

### From CI (recommended)

**Actions → Deploy to Html5-sync-incoming → Run workflow**, pick the source
branch, optionally override the target branch. The workflow pushes the exact
checked-out SHA.

### From a terminal (anywhere SSH to GitHub works)

```bash
# push current branch -> deploy/html5-<current-branch>
scripts/deploy-sync-incoming.sh

# explicit target branch
TARGET_BRANCH=deploy/html5-arena-01a09595 scripts/deploy-sync-incoming.sh

# update an existing deploy branch (safe force: fails if the remote moved unexpectedly)
FORCE_WITH_LEASE=1 TARGET_BRANCH=deploy/html5-arena-01a09595 scripts/deploy-sync-incoming.sh

# networks that filter port 22: tunnel SSH over port 443
SSH_PORT_MODE=443 scripts/deploy-sync-incoming.sh

# show exactly what would run, without pushing or contacting GitHub
DRY_RUN=1 SKIP_AUTH_CHECK=1 scripts/deploy-sync-incoming.sh

# key from an env var instead of a file (e.g. another CI system's secret)
SYNC_INCOMING_KEY_DATA="$(cat ~/.ssh/html5_sync_incoming_deploy)" scripts/deploy-sync-incoming.sh
```

All knobs (`SYNC_INCOMING_REPO`, `SOURCE_REF`, `TARGET_BRANCH`,
`SSH_PORT_MODE`, `KNOWN_HOSTS_FILE`, `FORCE_WITH_LEASE`, `SKIP_AUTH_CHECK`,
`DRY_RUN`, `EXPECTED_FINGERPRINT`) are documented in the script header.

## What the script does

1. Resolves the private key (file or `SYNC_INCOMING_KEY_DATA` temp file,
   shredded on exit) and verifies it parses.
2. Checks the key fingerprint against the pinned value.
3. Derives `SOURCE_REF`/`TARGET_BRANCH`, refusing `main`/`master` targets.
4. Seeds known-hosts with GitHub's published keys when `github.com` is absent.
5. Preflights with `ssh -T git@github.com` (or `ssh.github.com:443`) and
   requires `successfully authenticated`.
6. `git push`es `<source>:refs/heads/<target>` over the key-pinned
   `GIT_SSH_COMMAND`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Hi …! You've successfully authenticated, but GitHub does not provide shell access.` then push `Permission denied` | Key authenticates but is not a **write** deploy key on the **target** repo. Re-check step 1 (target repo ≠ this repo; write box checked). |
| `Permission denied (publickey)` | Deploy key missing on target, or wrong private half. Compare `ssh-keygen -y -f <key>` against the `.pub` file. |
| `kex_exchange_identification: Connection closed/reset` on port 22 | Network filters SSH. Retry with `SSH_PORT_MODE=443`. |
| `deploy key fingerprint mismatch` | A different key was offered. Point `SYNC_INCOMING_KEY` at the right file (or clear `EXPECTED_FINGERPRINT` to skip the pin). |
| `Key is already in use` (GitHub UI) | That public key is registered elsewhere — deploy keys are single-repo. Remove it there first. |
| Workflow fails: `Secret SYNC_INCOMING_DEPLOY_KEY is not set` | Step 2 not done, or secret name misspelled. |
| Push rejected (non-fast-forward) on re-deploy | Target branch already exists with diverged history. Re-run with `FORCE_WITH_LEASE=1` (deploy branches are machine-owned). |
| `refusing to deploy onto 'main'` | Safety guard. Deploy branches only — merge in the target repo deliberately, never by automation. |

## Rotating the key

1. `ssh-keygen -t ed25519 -C key-<new-id> -f /tmp/new-deploy -N ""`.
2. Replace `config/deploy-keys/sync-incoming-deploy.pub`, update the old
   deploy key on the target repo, update the `SYNC_INCOMING_DEPLOY_KEY`
   secret, and update `EXPECTED_FINGERPRINT` (script default + this doc +
   `config/deploy-keys/README.md`).
3. Delete the old deploy key from the target repo.

## Security notes

- The private key was transmitted in chat to set this up. Treat it as
  semi-exposed: once deploys work, consider rotating per the steps above.
- `.gitignore` blocks `*.pem`, `*.key`, `*_deploy` and similar patterns so
  private material cannot be committed by accident. The committed `.pub`
  file is public by design.
- CI logs never print the key: it travels via `SYNC_INCOMING_KEY_DATA`
  straight into a `0600` temp file.
