#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/dist/sanborn-codex.xdc"
mkdir -p "$root/dist"
cd "$root/public/apps/sanborn-codex"
zip -9 -r "$out" . -x "*.DS_Store"
cp "$out" "$root/sanborn-codex.xdc"
echo "wrote $out ($(wc -c < "$out") bytes)"
