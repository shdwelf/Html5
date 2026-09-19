#!/bin/sh
# Packs Project Y — Los Alamos Badge Archive (los-alamos.html) as a standalone webxdc app.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/los-alamos.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"

mkdir -p "$tmp/css" "$tmp/js" "$tmp/data/project-y" "$tmp/assets/los-alamos" "$tmp/models/project-y" "$tmp/vendor"

cp los-alamos.html "$tmp/index.html"
cp webxdc.js "$tmp/" 2>/dev/null || true
cp css/los-alamos.css css/project-y-sites.css css/project-y-4dwm.css "$tmp/css/"
cp js/los-alamos.js js/los-alamos-data.js js/project-y-catalog-utils.js js/project-y-sites.js js/project-y-sites-data.js js/project-y-4dwm.js "$tmp/js/"
cp data/project-y/catalog.js data/project-y/manifest.json "$tmp/data/project-y/"
# commons-index.txt is the human-readable source snapshot; not required at runtime but bundled for provenance
cp data/project-y/commons-index.txt "$tmp/data/project-y/" 2>/dev/null || true
cp assets/los-alamos/* "$tmp/assets/los-alamos/"
cp models/project-y/*.wrl "$tmp/models/project-y/"
cp vendor/three.module.min.js vendor/OrbitControls.js "$tmp/vendor/"
cp vendor/THREE_LICENSE "$tmp/vendor/" 2>/dev/null || true
cp icon.png "$tmp/icon.png" 2>/dev/null || true
# docs for offline provenance
mkdir -p "$tmp/docs"
cp docs/los-alamos-*.md docs/project-y-*.md "$tmp/docs/" 2>/dev/null || true
cp docs/project-y-verification.md "$tmp/docs/" 2>/dev/null || true

cat > "$tmp/manifest.toml" <<'TOML'
name = "Project Y — Los Alamos Badge Archive"
source_code_url = "https://github.com/shdwelf/Html5"
TOML

(cd "$tmp" && zip -9 -r "$out" . -x "*.DS_Store")
echo "wrote $out ($(wc -c < "$out") bytes)"
