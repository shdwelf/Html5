#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/sitek.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
cp index.html keyspace.html validator.html art-studio.html terrarium.html louisiana.html godseye.html driverguide.html manifest.toml manifest.webmanifest webxdc.js sw.js "$tmp/"
cp icon.png "$tmp/" 2>/dev/null || true
cp -R css js wasm vendor img "$tmp/"
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store" -x "img/.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
