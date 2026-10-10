#!/usr/bin/env bash
# fetch-rtjar.sh — download a Java 7 rt.jar (bootclasspath for ECJ 3.10).
# Source: github.com/emabrey/openjdk7-rt (single committed rt.jar). Fetched via
# codeload.github.com because raw.githubusercontent.com is NOT reachable here.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$HERE/.rt"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "fetching openjdk7-rt via codeload..." >&2
curl -sSL "https://codeload.github.com/emabrey/openjdk7-rt/tar.gz/master" -o "$TMP/rt.tgz"
tar xzf "$TMP/rt.tgz" -C "$TMP"
SRC="$(find "$TMP" -name rt.jar | head -1)"
[ -n "$SRC" ] || { echo "rt.jar not found in tarball" >&2; exit 1; }
cp "$SRC" "$HERE/.rt/rt.jar"
echo "rt.jar -> $HERE/.rt/rt.jar ($(stat -c%s "$HERE/.rt/rt.jar") bytes)" >&2
