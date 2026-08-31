#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/sitek.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
cp index.html adl.html keyspace.html terrarium.html louisiana.html manifest.toml manifest.webmanifest webxdc.js sw.js sitemap.xml sitemap_adl_geospatial.xml "$tmp/"
cp icon.png "$tmp/" 2>/dev/null || true
cp -R css js wasm vendor img src docs "$tmp/"
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store" -x "img/.DS_Store" -x "*__pycache__*")
echo "wrote $out ($(wc -c < "$out") bytes)"

# Build standalone adl.xdc as well
"$root/tools/pack_adl_xdc.sh"

