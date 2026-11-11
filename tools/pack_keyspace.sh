#!/bin/sh
# Stages the Keyspace Viewer as a local offline app and packs its WebXDC.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/keyspace.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"

mkdir -p "$tmp/css" "$tmp/js" "$tmp/wasm" "$tmp/vendor" "$tmp/config"
cp keyspace.html "$tmp/index.html"
cp webxdc.js "$tmp/"
cp LICENSE "$tmp/"
cp css/viewer.css "$tmp/css/"
# every module viewer.js imports, plus the ones those import
cp js/viewer.js js/bip39.js js/bip39-en.js js/engine.js js/spacefill.js \
   js/entropy-live.js js/lexicon.js js/mathvis.js js/forms3d.js js/hdtopo.js \
   js/formal.js js/lens-draw.js js/lens-3d.js js/syllables.js js/enso-id.js \
   js/wallet-derivatives.js js/coins.js js/bip32.js js/addrs.js js/codec.js \
   js/hash.js js/secp256k1.js js/ed25519.js js/key-stats.js "$tmp/js/"
cp wasm/entropy.wasm "$tmp/wasm/"
cp vendor/three.module.min.js vendor/OrbitControls.js "$tmp/vendor/"
cp vendor/THREE_LICENSE "$tmp/vendor/"
cp icon.png "$tmp/icon.png"
cp config/coins-top500.json "$tmp/config/"

cat > "$tmp/manifest.toml" <<'TOML'
name = "Keyspace Viewer"
source_code_url = "https://github.com/shdwelf/Html5"
TOML

# The offline catalogue opens the same self-contained app tree that ships in
# keyspace.xdc; keep this generated copy rooted at index.html.
app_dir="$root/public/apps/keyspace"
rm -rf "$app_dir"
mkdir -p "$(dirname "$app_dir")"
cp -R "$tmp/." "$app_dir/"

# zip updates an existing archive in place and otherwise leaves removed files
# behind. Recreate it so the package is exactly the declared dependency set.
rm -f "$out"
(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
