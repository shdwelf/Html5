#!/bin/sh
# Pack SITE-K and its offline companion applications.
#
# SITE-K is a multi-page shell.  Keep the HTML entry points listed explicitly:
# copying only the original shell pages made newer routes (including the full
# Project Y site exhibit) disappear after the .xdc was installed.
set -eu
root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
out="$root/sitek.xdc"
dist="$root/dist/sitek.xdc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$root"

# Root pages reachable from the SITE-K shell, plus the current site exhibits.
# Do not sweep every archival/upload HTML file into this package: many of those
# are independent historical snapshots with their own packaging requirements.
site_pages='
index.html
keyspace.html
prime.html
astronomy.html
validator.html
art-studio.html
terrarium.html
louisiana.html
glendora.html
calc.html
casefiles.html
socal-calc.html
socal-subsurface.html
cheyenne.html
four-corners.html
convention-centers.html
los-alamos.html
ghidra-lab.html
warrick.html
flash-decompiler.html
distro-dossier.html
satellite-constellations.html
vincennes-4dwm.html
'
for page in $site_pages; do
  test -f "$page" || { echo "missing SITE-K page: $page" >&2; exit 1; }
  cp "$page" "$tmp/"
done

cp manifest.webmanifest webxdc.js sw.js "$tmp/"
cp icon.png "$tmp/" 2>/dev/null || true

# The repository root manifest is for the Art Studio standalone app.  SITE-K
# needs its own manifest in the archive so the host presents the correct title.
cat > "$tmp/manifest.toml" <<'TOML'
name = "SITE-K · Offline Site Collection"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
TOML

# These are the complete local dependency trees for the shell and pages above.
# In particular, Project Y needs its site data, six VRML exports, photos, and
# the local three.js modules; omitting any one of them leaves a tab blank in a
# network-restricted webxdc host.
cp -R css js wasm vendor img src docs assets data models "$tmp/"

rm -f "$out" "$dist"
mkdir -p "$root/dist"
(cd "$tmp" && zip -9 -r "$out" . \
  -x "*.DS_Store" -x "img/.DS_Store" -x "*__pycache__*" > /dev/null)
cp "$out" "$dist"
unzip -t "$out" > /dev/null
echo "wrote $out ($(wc -c < "$out") bytes)"

# Keep the separately installable companions in sync with the multi-site shell.
"$root/tools/pack_los_alamos_xdc.sh"
"$root/tools/pack_adl_xdc.sh"
"$root/tools/pack_prime.sh"
"$root/tools/pack_astronomy.sh"
"$root/tools/pack_sanborn_suite_xdc.sh"
