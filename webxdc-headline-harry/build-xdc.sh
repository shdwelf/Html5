#!/usr/bin/env bash
# Rebuild the Headline Harry Webxdc from the installer-recovered game files.
#
# Raw floppy executables start with `ff 4d 5a` and are packed; shipping those
# as INTRO.EXE/MAP.EXE makes DOSBox stall at the intro command. This build
# intentionally refuses that source and uses the clean MZ files recovered by
# the arena-headline-harry workflow. It boots MAP.EXE directly because the
# standalone intro does not return reliably in the js-dos Webxdc host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/webxdc-headline-harry/app"
GAME_DIR="$ROOT/.xfer/harry/installed"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

if [[ ! -f "$GAME_DIR/INTRO.EXE" || ! -f "$GAME_DIR/MAP.EXE" ]]; then
  echo "missing installer-recovered game files in $GAME_DIR" >&2
  echo "Run the arena-headline-harry workflow first; raw floppy files are packed and are not a runnable fallback." >&2
  exit 1
fi

# Fail closed if this is the `ff MZ` packed floppy copy rather than the
# installer output. Both app executables must have a normal DOS MZ header.
for exe in INTRO.EXE MAP.EXE; do
  magic="$(od -An -N2 -tx1 "$GAME_DIR/$exe" | tr -d '[:space:]')"
  if [[ "$magic" != "4d5a" ]]; then
    echo "$GAME_DIR/$exe is not a clean MZ executable (header: $magic); refusing to package it" >&2
    exit 1
  fi
done

mkdir -p "$BUILD_DIR/.jsdos" "$APP/roms"
while IFS= read -r -d '' file; do
  cp -p "$file" "$BUILD_DIR/"
done < <(find "$GAME_DIR" -maxdepth 1 -type f -print0)

# Skip INTRO.EXE's interactive command-line stall and enter the game menu.
# The original HARRY.BAT remains in the bundle unchanged for reference.
cat > "$BUILD_DIR/.jsdos/dosbox.conf" <<'CONF'
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
MAP.EXE
CONF

# 1) deterministic source payload; the outer repacker below normalizes ZIP
# metadata and verifies that the local engine set is complete.
rm -f "$APP/roms/headline-harry.jsdos"
(cd "$BUILD_DIR" && zip -q -9 -r "$APP/roms/headline-harry.jsdos" .)

# Keep the packaged shell in sync with its canonical, reviewable source.
cp "$ROOT/public/apps/headline-harry/index.html" "$APP/index.html"

# 2) package the webxdc, then canonicalize the archive; the repacker mirrors
# the exact deliverable into both tracked XDC paths.
rm -f "$ROOT/headline-harry.xdc"
(cd "$APP" && zip -q -9 -r "$ROOT/headline-harry.xdc" . -x '*.DS_Store')
node "$ROOT/scripts/fix-headline-harry-xdc.mjs"

printf 'Built %s from clean MZ executables; autoexec starts MAP.EXE directly.\n' "$ROOT/headline-harry.xdc"
unzip -l "$ROOT/headline-harry.xdc"
