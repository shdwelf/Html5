#!/bin/sh
# Pack renga.xdc — Renga Camouflage (Two Voices at Harvest) webxdc.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/renga.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
cp renga.html "$tmp/index.html"
cp webxdc.js "$tmp/webxdc.js"
cp icon.png "$tmp/icon.png"
cat > "$tmp/manifest.toml" <<'EOF'
name = "Renga Camouflage — Two Voices at Harvest"
orientation = "portrait"
source_code_url = "https://github.com/shdwelf/Html5"
EOF
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store" > /dev/null)
echo "wrote $out ($(wc -c < "$out") bytes)"
