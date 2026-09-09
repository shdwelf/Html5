#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/dist/kryptos-vrml.xdc"
mkdir -p "$root/dist"
cd "$root/public/apps/kryptos-vrml"
zip -9 -r "$out" . -x "*.DS_Store"
cp "$out" "$root/kryptos-vrml.xdc"
echo "wrote $out ($(wc -c < "$out") bytes)"
