#!/usr/bin/env bash
# Rebuild headline-harry.xdc from the extracted game files.
# Requires: .xfer/harry/game (produced by the arena-headline-harry workflow).
set -euo pipefail
cd "$(dirname "$0")"

APP="app"
OUT="../headline-harry.xdc"

# Prefer the installer-recovered clean executables; fall back to the raw
# floppy extraction (which is packed/scrambled and won't boot) with a warning.
if [ -f ../.xfer/harry/installed/MAP.EXE ]; then
  GAME_DIR="../.xfer/harry/installed"
elif [ -f ../.xfer/harry/game-raw/MAP.EXE ]; then
  GAME_DIR="../.xfer/harry/game-raw"
  echo "WARNING: using raw floppy files (packed, will not run) - run the install workflow first" >&2
else
  echo "missing game files (run the fetch workflow first)" >&2; exit 1
fi

test -f "$GAME_DIR/MAP.EXE" || { echo "missing $GAME_DIR/MAP.EXE" >&2; exit 1; }

# 1) js-dos bundle: game files + .jsdos/dosbox.conf
rm -rf .bundle
mkdir -p .bundle/.jsdos
cp "$GAME_DIR"/* .bundle/
cat > .bundle/.jsdos/dosbox.conf <<'CONF'
[jsdos]
# js-dos bundle for Headline Harry and The Great Paper Race (1991, DOS)
[cpu]
core=auto
cputype=auto
cycles=auto

[mixer]
rate=22050

[sblaster]
sbtype=sb16

[speaker]
pcspeaker=true

[autoexec]
mount c .
c:
intro
map
CONF

( cd .bundle && rm -f "../$APP/roms/headline-harry.jsdos" && zip -q -9 -r "../$APP/roms/headline-harry.jsdos" . )

# 2) webxdc package: everything under app/, index.html at zip root
( cd "$APP" && rm -f "../headline-harry.xdc" "$OUT" && zip -q -9 -r "$OUT" . -x '*.DS_Store' )

echo "built $OUT"
unzip -l "$OUT"
