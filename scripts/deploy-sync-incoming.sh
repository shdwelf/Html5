#!/usr/bin/env bash
#
# Deploy (push) a branch snapshot of this repo to shdwelf/Html5-sync-incoming
# using an SSH deploy key.
#
# Nothing is merged: the source ref is pushed onto a namespaced branch
# (default: deploy/html5-<source-branch>) in the target repo, whose history
# is unrelated to this one. Never point TARGET_BRANCH at the target's main.
#
# Key sources (first match wins):
#   1. SYNC_INCOMING_KEY_DATA   private key PEM content (e.g. from a secret;
#                               written to a temp file with 0600, wiped on exit)
#   2. SYNC_INCOMING_KEY        path to the private key file (default below)
#
# Configuration (all optional):
#   SYNC_INCOMING_REPO     target repo slug            (default: shdwelf/Html5-sync-incoming)
#   SYNC_INCOMING_KEY      private key path            (default: ~/.ssh/html5_sync_incoming_deploy)
#   SOURCE_REF             ref to push                 (default: current branch, else HEAD)
#   TARGET_BRANCH          branch to create/update      (default: deploy/html5-<source-branch-or-sha>)
#   SSH_PORT_MODE          22 or 443                   (default: 22; 443 uses ssh.github.com for
#                                                      networks that filter port 22)
#   KNOWN_HOSTS_FILE       known_hosts to use          (default: ~/.ssh/known_hosts; seeded with
#                                                      GitHub's published host keys when absent)
#   FORCE_WITH_LEASE       1 to update an existing deploy branch (default: 0, plain push)
#   SKIP_AUTH_CHECK        1 to skip the `ssh -T` preflight (default: 0)
#   DRY_RUN                1 to print the push command without running it (default: 0)
#   EXPECTED_FINGERPRINT   abort unless the key matches (default: pinned to key-1789003862838;
#                          set to empty to skip the pin check)
#
# Examples:
#   scripts/deploy-sync-incoming.sh
#   TARGET_BRANCH=deploy/html5-manual-1 scripts/deploy-sync-incoming.sh
#   SSH_PORT_MODE=443 scripts/deploy-sync-incoming.sh
#   DRY_RUN=1 scripts/deploy-sync-incoming.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TARGET_REPO="${SYNC_INCOMING_REPO:-shdwelf/Html5-sync-incoming}"
KEY_PATH="${SYNC_INCOMING_KEY:-$HOME/.ssh/html5_sync_incoming_deploy}"
SSH_PORT_MODE="${SSH_PORT_MODE:-22}"
KNOWN_HOSTS_FILE="${KNOWN_HOSTS_FILE:-$HOME/.ssh/known_hosts}"
FORCE_WITH_LEASE="${FORCE_WITH_LEASE:-0}"
SKIP_AUTH_CHECK="${SKIP_AUTH_CHECK:-0}"
DRY_RUN="${DRY_RUN:-0}"
EXPECTED_FINGERPRINT="${EXPECTED_FINGERPRINT:-SHA256:IUmqC00hlMUpFKoNU3ReAcKJQanmtxHVGxZUFfLuGOU}"

TMP_KEY=""
cleanup() {
  if [ -n "$TMP_KEY" ] && [ -f "$TMP_KEY" ]; then
    shred -u "$TMP_KEY" 2>/dev/null || rm -f "$TMP_KEY"
  fi
}
trap cleanup EXIT

# --- Resolve the private key -------------------------------------------------
if [ -n "${SYNC_INCOMING_KEY_DATA:-}" ]; then
  TMP_KEY="$(mktemp -t sync-incoming-deploy.XXXXXX)"
  chmod 600 "$TMP_KEY"
  printf '%s\n' "$SYNC_INCOMING_KEY_DATA" > "$TMP_KEY"
  KEY_PATH="$TMP_KEY"
  echo "Using deploy key from SYNC_INCOMING_KEY_DATA (temp file, wiped on exit)." >&2
fi

if [ ! -f "$KEY_PATH" ]; then
  echo "ERROR: deploy key not found at $KEY_PATH" >&2
  echo "  Provide it via SYNC_INCOMING_KEY=<path> or SYNC_INCOMING_KEY_DATA='<pem>'." >&2
  echo "  Setup guide: docs/DEPLOY_SYNC_INCOMING.md" >&2
  exit 1
fi
if [ -z "$TMP_KEY" ]; then
  KEY_MODE="$(stat -c %a "$KEY_PATH" 2>/dev/null || stat -f %Lp "$KEY_PATH")"
  if [ "$KEY_MODE" != "600" ]; then
    echo "WARNING: $KEY_PATH is mode $KEY_MODE; tightening to 0600." >&2
    chmod 600 "$KEY_PATH"
  fi
fi

# --- Pin the key identity ----------------------------------------------------
if ! ssh-keygen -y -f "$KEY_PATH" >/dev/null 2>&1; then
  echo "ERROR: $KEY_PATH is not a readable private key." >&2
  exit 1
fi
if [ -n "$EXPECTED_FINGERPRINT" ]; then
  ACTUAL_FINGERPRINT="$(ssh-keygen -l -f "$KEY_PATH" 2>/dev/null | awk '{print $2}')"
  if [ "$ACTUAL_FINGERPRINT" != "$EXPECTED_FINGERPRINT" ]; then
    echo "ERROR: deploy key fingerprint mismatch." >&2
    echo "  expected: $EXPECTED_FINGERPRINT" >&2
    echo "  actual:   $ACTUAL_FINGERPRINT" >&2
    echo "  Refusing to deploy with an unexpected key (override: EXPECTED_FINGERPRINT=)." >&2
    exit 1
  fi
  echo "Deploy key fingerprint OK: $ACTUAL_FINGERPRINT" >&2
fi

# --- Resolve source and target refs ------------------------------------------
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  CURRENT_BRANCH="detached-$(git rev-parse --short HEAD)"
fi
SOURCE_REF="${SOURCE_REF:-$CURRENT_BRANCH}"
SAFE_BRANCH="$(printf '%s' "$CURRENT_BRANCH" | tr '/' '-' | tr -cd 'A-Za-z0-9._-')"
TARGET_BRANCH="${TARGET_BRANCH:-deploy/html5-$SAFE_BRANCH}"

case "$TARGET_BRANCH" in
  main|master)
    echo "ERROR: refusing to deploy onto '$TARGET_BRANCH' — histories are unrelated." >&2
    echo "  Use a namespaced branch such as deploy/html5-<name>." >&2
    exit 1
    ;;
esac

# --- Known hosts (seed GitHub's published keys when missing) ------------------
# Source: https://api.github.com/meta (ssh_keys). Public host keys, safe to embed.
seed_known_hosts() {
  mkdir -p "$(dirname "$KNOWN_HOSTS_FILE")"
  touch "$KNOWN_HOSTS_FILE"
  chmod 600 "$KNOWN_HOSTS_FILE"
  if ! ssh-keygen -F github.com -f "$KNOWN_HOSTS_FILE" >/dev/null 2>&1; then
    cat >> "$KNOWN_HOSTS_FILE" <<'EOF'
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=
ssh.github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
ssh.github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
ssh.github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=
EOF
    echo "Seeded $KNOWN_HOSTS_FILE with GitHub's published host keys." >&2
  fi
}
seed_known_hosts

# --- Transport ----------------------------------------------------------------
if [ "$SSH_PORT_MODE" = "443" ]; then
  SSH_URL="ssh://git@ssh.github.com:443/$TARGET_REPO.git"
  SSH_HOST="ssh.github.com"
  SSH_PORT="443"
else
  SSH_URL="git@github.com:$TARGET_REPO.git"
  SSH_HOST="github.com"
  SSH_PORT="22"
fi
export GIT_SSH_COMMAND="ssh -i $KEY_PATH -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$KNOWN_HOSTS_FILE -o ConnectTimeout=15 -p $SSH_PORT"

# --- Preflight ----------------------------------------------------------------
if [ "$SKIP_AUTH_CHECK" != "1" ]; then
  echo "Preflight: ssh -T -p $SSH_PORT git@$SSH_HOST ..." >&2
  AUTH_OUT="$(ssh -i "$KEY_PATH" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
    -o UserKnownHostsFile="$KNOWN_HOSTS_FILE" -o ConnectTimeout=15 -p "$SSH_PORT" \
    "git@$SSH_HOST" 2>&1 || true)"
  echo "$AUTH_OUT" >&2
  case "$AUTH_OUT" in
    *"successfully authenticated"*) ;;
    *)
      echo "ERROR: SSH authentication preflight failed (see above)." >&2
      echo "  Is the public half installed as a deploy key on $TARGET_REPO?" >&2
      echo "  If port 22 is filtered on this network, retry with SSH_PORT_MODE=443." >&2
      exit 1
      ;;
  esac
fi

# --- Push ---------------------------------------------------------------------
PUSH_EXTRA=""
if [ "$FORCE_WITH_LEASE" = "1" ]; then
  PUSH_EXTRA="--force-with-lease"
fi

echo "Deploying $SOURCE_REF -> $TARGET_REPO#$TARGET_BRANCH via $SSH_URL" >&2
if [ "$DRY_RUN" = "1" ]; then
  echo "DRY_RUN=1 — would execute:" >&2
  # shellcheck disable=SC2086
  echo "  GIT_SSH_COMMAND='$GIT_SSH_COMMAND' git push $PUSH_EXTRA $SSH_URL '$SOURCE_REF:refs/heads/$TARGET_BRANCH'" >&2
  exit 0
fi

# shellcheck disable=SC2086
git push $PUSH_EXTRA "$SSH_URL" "$SOURCE_REF:refs/heads/$TARGET_BRANCH"

echo "Deployed: https://github.com/$TARGET_REPO/tree/$TARGET_BRANCH" >&2
