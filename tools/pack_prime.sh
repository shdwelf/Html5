#!/bin/sh
# Pack the standalone Prime Viewer webxdc app.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/prime.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"
mkdir -p "$tmp/css" "$tmp/js" "$tmp/vendor"
cp prime.html "$tmp/index.html"
cp css/prime.css "$tmp/css/"
cp js/prime-viewer.js js/primes.js "$tmp/js/"
cp vendor/three.module.min.js vendor/OrbitControls.js vendor/THREE_LICENSE "$tmp/vendor/"
cp webxdc.js icon.png "$tmp/"
cat > "$tmp/manifest.toml" <<'TOML'
name = "Prime Viewer"
source_code_url = "https://github.com/shdwelf/Html5"
TOML
rm -f "$out"
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
