#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/css" "$TMP/js" "$TMP/vendor"
cp "$ROOT/astronomy.html" "$TMP/index.html"
cp "$ROOT/css/astronomy.css" "$TMP/css/"
cp "$ROOT/js/astronomy.js" "$ROOT/js/astronomy-viewer.js" "$TMP/js/"
cp "$ROOT/vendor/three.module.min.js" "$ROOT/vendor/OrbitControls.js" "$ROOT/vendor/THREE_LICENSE" "$TMP/vendor/"
cp "$ROOT/webxdc.js" "$TMP/"
[[ -f "$ROOT/icon.png" ]] && cp "$ROOT/icon.png" "$TMP/"
cat > "$TMP/manifest.toml" <<'EOF'
name = "Helios Observatory"
source_code_url = "https://github.com/shdwelf/Html5"
EOF
(cd "$TMP" && zip -qr "$ROOT/astronomy.xdc" .)
echo "Created astronomy.xdc"
