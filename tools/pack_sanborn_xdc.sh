#!/bin/sh
# Pack sanborn-codex.xdc — Sanborn Codex webxdc (offline build, no remote HDRI).
# Source of truth: sanborn-codex.html (patched single-file bundle).
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/sanborn-codex.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
cp sanborn-codex.html "$tmp/index.html"
cp webxdc.js "$tmp/webxdc.js"
cp icon.png "$tmp/icon.png"
cat > "$tmp/manifest.toml" <<'EOF'
name = "Sanborn Codex — The Encrypted Art of Jim Sanborn"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
EOF
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store" > /dev/null)
echo "wrote $out ($(wc -c < "$out") bytes)"
