#!/bin/sh
# Pack the vanilla haiku workbench as a standalone WebXDC.
# Does not vendor the React/Vite tree from shdwelf/bip39-haiku-workbench.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/haiku.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
cp haiku.html "$tmp/index.html"
mkdir -p "$tmp/css" "$tmp/js" "$tmp/img"
cp css/haiku.css "$tmp/css/"
cp js/haiku-workbench.js js/enso-id.js js/syllables.js js/bip39.js js/bip39-en.js "$tmp/js/"
cp webxdc.js "$tmp/"
cp img/haiku-icon.png "$tmp/icon.png"
cp img/haiku-icon.png "$tmp/img/haiku-icon.png"
cat > "$tmp/manifest.toml" <<'EOF'
name = "BIP-39 Haiku Workbench"
source_code_url = "https://github.com/shdwelf/Html5"
EOF
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
