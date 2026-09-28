#!/bin/sh
# Pack the fused Sanborn Suite (codex + kryptos-vrml in one file) as a .xdc.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/dist/sanborn-suite.xdc"
mkdir -p "$root/dist"
rm -f "$out"
node "$root/scripts/build-sanborn-suite.mjs"
cd "$root/public/apps/sanborn-suite"
zip -9 -r "$out" . -x "*.DS_Store"
cp "$out" "$root/sanborn-suite.xdc"
echo "wrote $out ($(wc -c < "$out") bytes)"
