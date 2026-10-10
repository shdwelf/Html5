#!/usr/bin/env bash
# Rebuild the Headline Harry Webxdc from installer-recovered game files.
# The inner js-dos builder rejects packed floppy EXEs and creates a stable
# archive that boots MAP.EXE directly instead of stalling in INTRO.EXE.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/webxdc-headline-harry/app"
GAME_DIR="$ROOT/.xfer/harry/installed"

if [[ ! -d "$GAME_DIR" ]]; then
  echo "missing installer-recovered game files in $GAME_DIR" >&2
  echo "Run the arena-headline-harry workflow first; raw floppy files are packed and are not a runnable fallback." >&2
  exit 1
fi

mkdir -p "$APP/roms"
node "$ROOT/scripts/build-headline-harry-jsdos.mjs"

# Keep the packaged shell in sync with its canonical, reviewable source.
cp "$ROOT/public/apps/headline-harry/index.html" "$APP/index.html"

# Package the webxdc, then canonicalize its ZIP metadata. The repacker checks
# the inner bundle and mirrors the exact deliverable into both tracked XDCs.
rm -f "$ROOT/headline-harry.xdc"
(cd "$APP" && zip -q -9 -r "$ROOT/headline-harry.xdc" . -x '*.DS_Store')
node "$ROOT/scripts/fix-headline-harry-xdc.mjs"

printf 'Built %s from clean MZ executables; autoexec starts MAP.EXE directly.\n' "$ROOT/headline-harry.xdc"
unzip -l "$ROOT/headline-harry.xdc"
