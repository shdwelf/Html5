#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/keyspace.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
cp index.html manifest.toml icon.png webxdc.js "$tmp/"
cp -R css js wasm vendor "$tmp/"
# webxdc hosts inject webxdc.js; keep stub for file:// and static preview
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
