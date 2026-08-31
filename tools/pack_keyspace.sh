#!/bin/sh
# Packs the Keyspace Viewer (keyspace.html) as a standalone webxdc app.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/keyspace.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"

mkdir -p "$tmp/css" "$tmp/js" "$tmp/wasm" "$tmp/vendor"
cp keyspace.html "$tmp/index.html"
cp webxdc.js "$tmp/"
cp css/viewer.css "$tmp/css/"
# every module viewer.js imports, plus the ones those import
cp js/viewer.js js/bip39.js js/bip39-en.js js/engine.js js/spacefill.js \
   js/entropy-live.js js/lexicon.js js/mathvis.js js/forms3d.js js/hdtopo.js \
   js/formal.js js/lens-draw.js js/lens-3d.js "$tmp/js/"
cp wasm/entropy.wasm "$tmp/wasm/"
cp vendor/three.module.min.js vendor/OrbitControls.js "$tmp/vendor/"
cp vendor/THREE_LICENSE "$tmp/vendor/" 2>/dev/null || true
cp icon.png "$tmp/icon.png"

cat > "$tmp/manifest.toml" <<'TOML'
name = "Keyspace Viewer"
source_code_url = "https://github.com/shdwelf/Html5"
TOML

(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
