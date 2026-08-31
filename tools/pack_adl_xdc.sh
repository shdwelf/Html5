#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/adl.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"

# Prepare standalone WebXDC bundle for ADL Gazetteer
cp adl.html "$tmp/index.html"
cp icon.png "$tmp/" 2>/dev/null || true
cp webxdc.js "$tmp/"
cp sitemap.xml "$tmp/" 2>/dev/null || true
cp sitemap_adl_geospatial.xml "$tmp/" 2>/dev/null || true

# Write WebXDC manifest.toml
cat << 'EOF' > "$tmp/manifest.toml"
name = "ADL Gazetteer"
short_name = "ADL"
description = "Alexandria Digital Library Gazetteer, GazBean & USGS GNIS Spatial Workbench"
source_code_url = "https://github.com/shdwelf/Html5"
EOF

# Copy asset directories
mkdir -p "$tmp/css" "$tmp/js" "$tmp/src" "$tmp/docs"
cp -R css/* "$tmp/css/" 2>/dev/null || true
cp -R js/* "$tmp/js/" 2>/dev/null || true
cp -R src/* "$tmp/src/" 2>/dev/null || true
cp -R docs/* "$tmp/docs/" 2>/dev/null || true

# Package into .xdc ZIP archive
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store" -x "*__pycache__*")
echo "Wrote $out ($(wc -c < "$out") bytes)"
