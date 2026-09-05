#!/bin/sh
# Packs God's Eye View (godseye.html) as a standalone webxdc app.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/godseye.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"

mkdir -p "$tmp/css" "$tmp/js" "$tmp/img" "$tmp/vendor"
cp godseye.html "$tmp/index.html"
cp webxdc.js "$tmp/"
cp css/godseye.css "$tmp/css/"
cp js/godseye.js "$tmp/js/"
cp vendor/three.module.min.js "$tmp/vendor/"
cp vendor/OrbitControls.js "$tmp/vendor/"
cp vendor/THREE_LICENSE "$tmp/vendor/" 2>/dev/null || true
cp -R vendor/satellite "$tmp/vendor/satellite"
mkdir -p "$tmp/vendor/world"
cp vendor/world/countries.geo.json "$tmp/vendor/world/"
cp vendor/world/UNLICENSE "$tmp/vendor/world/" 2>/dev/null || true
cp img/godseye-icon.png "$tmp/img/godseye-icon.png"
cp img/godseye-icon.png "$tmp/icon.png"

cat > "$tmp/manifest.toml" <<'TOML'
name = "God's Eye View"
source_code_url = "https://github.com/shdwelf/Html5"
TOML

(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
