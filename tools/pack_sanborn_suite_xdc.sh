#!/bin/sh
# Pack every bundled Jim Sanborn installation as one offline webxdc app.
#
# sanborn-suite.xdc is retained for existing links; sanborn-installations.xdc is
# the explicit distribution name for the complete 30-installation Codex plus
# the 11-entry source-checked Kryptos viewer.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/dist/sanborn-suite.xdc"
installations_out="$root/dist/sanborn-installations.xdc"
mkdir -p "$root/dist"
rm -f "$out" "$installations_out" "$root/sanborn-suite.xdc" "$root/sanborn-installations.xdc"
node "$root/scripts/build-sanborn-suite.mjs"
cd "$root/public/apps/sanborn-suite"
zip -9 -r "$out" . -x "*.DS_Store" > /dev/null
cp "$out" "$installations_out"
cp "$out" "$root/sanborn-suite.xdc"
cp "$installations_out" "$root/sanborn-installations.xdc"
unzip -t "$root/sanborn-installations.xdc" > /dev/null
echo "wrote $root/sanborn-installations.xdc ($(wc -c < "$root/sanborn-installations.xdc") bytes)"
echo "wrote $root/sanborn-suite.xdc ($(wc -c < "$root/sanborn-suite.xdc") bytes; compatibility name)"
