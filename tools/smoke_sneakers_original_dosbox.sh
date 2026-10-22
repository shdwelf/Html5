#!/usr/bin/env bash
# Diagnostic boot of the original SNEAKERS.EXE from the exact promotional ZIP
# under DOSBox + Xvfb. Captures the first screen and a screen after a key event.
# This is not a byte-preservation test; tests/sneakers-press-kit-exact.test.mjs
# verifies those bytes. No physical display, keyboard, or mouse is used here.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ZIP="$ROOT/webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip"
WORK_DIR="${SNEAKERS_ORIGINAL_SMOKE_DIR:-$(mktemp -d)}"
GAME_DIR="$WORK_DIR/game"
DISPLAY="${DISPLAY:-:99}"
mkdir -p "$GAME_DIR"
export DISPLAY

python3 - "$SOURCE_ZIP" "$GAME_DIR" <<'PY'
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile
import sys

source, dest = Path(sys.argv[1]), Path(sys.argv[2])
expected = {
    "SNEAKERS.EXE": (2_219_117, "d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961"),
    "SNEAK.EXE": (1_074_631, "4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb"),
}
assert sha256(source.read_bytes()).hexdigest() == "b6e3d2a99de90b6de401a5d8d0023299c632e65ca98246bbe5d4842336f01eef"
with ZipFile(source) as zf:
    assert zf.testzip() is None, "source ZIP failed its CRC check"
    assert sorted(zf.namelist()) == sorted(expected), f"unexpected source ZIP members: {zf.namelist()}"
    for name, (size, digest) in expected.items():
        data = zf.read(name)
        assert len(data) == size and sha256(data).hexdigest() == digest, f"source member mismatch: {name}"
        assert data[:2] == b"MZ", f"not a DOS MZ executable: {name}"
        (dest / name).write_bytes(data)
print("verified original ZIP and both MZ executable members")
PY

cat > "$WORK_DIR/dosbox.conf" <<EOF
[sdl]
fullscreen=false
fulldouble=false
output=surface
autolock=false
waitonerror=false

[dosbox]
machine=svga_s3
memsize=16

[render]
frameskip=0
aspect=false
scaler=none

[cpu]
core=auto
cputype=auto
cycles=auto

[mixer]
nosound=true

[midi]
mpu401=none

[sblaster]
sbtype=none

[dos]
xms=true
ems=true
umb=true
keyboardlayout=us

[autoexec]
mount c $GAME_DIR
c:
SNEAKERS.EXE
EOF

Xvfb "$DISPLAY" -screen 0 1024x768x24 -nolisten tcp >"$WORK_DIR/xvfb.log" 2>&1 &
xvfb_pid=$!
dosbox_pid=""
cleanup() {
  if [[ -n "$dosbox_pid" ]] && kill -0 "$dosbox_pid" 2>/dev/null; then
    kill -TERM "$dosbox_pid" 2>/dev/null || true
    wait "$dosbox_pid" 2>/dev/null || true
  fi
  if [[ -n "${xvfb_pid:-}" ]]; then
    kill "$xvfb_pid" 2>/dev/null || true
    wait "$xvfb_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

ready=false
for _ in $(seq 1 50); do
  if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then ready=true; break; fi
  if ! kill -0 "$xvfb_pid" 2>/dev/null; then break; fi
  sleep 0.1
done
if [[ "$ready" != true ]]; then
  echo "Xvfb failed to become ready on $DISPLAY" >&2
  cat "$WORK_DIR/xvfb.log" >&2
  exit 1
fi

dosbox -conf "$WORK_DIR/dosbox.conf" >"$WORK_DIR/dosbox.log" 2>&1 &
dosbox_pid=$!
window=""
for _ in $(seq 1 40); do
  window="$(xdotool search --onlyvisible --name '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
  if [[ -z "$window" ]]; then
    window="$(xdotool search --onlyvisible --class '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
  fi
  if [[ -z "$window" ]]; then
    mapfile -t visible < <(xdotool search --onlyvisible --name '.*' 2>/dev/null || true)
    if [[ ${#visible[@]} -eq 1 ]]; then window="${visible[0]}"; fi
  fi
  [[ -n "$window" ]] && break
  if ! kill -0 "$dosbox_pid" 2>/dev/null; then break; fi
  sleep 0.25
done
if [[ -z "$window" ]]; then
  echo "DOSBox window not found" >&2
  cat "$WORK_DIR/dosbox.log" >&2
  exit 1
fi
printf '%s\n' "$window" > "$WORK_DIR/window.id"
xdotool windowfocus --sync "$window" 2>/dev/null || true
sleep 5
import -window "$window" "$WORK_DIR/startup.png"

# Advance a possible “Press Any Key” prompt using XTest keyboard input. This
# exercises the DOSBox keyboard path without a physical keyboard.
xdotool windowfocus --sync "$window" 2>/dev/null || true
xdotool key --clearmodifiers space
sleep 3
import -window "$window" "$WORK_DIR/after-key.png"

for shot in "$WORK_DIR/startup.png" "$WORK_DIR/after-key.png"; do
  test -s "$shot"
  colors="$(identify -format '%k' "$shot")"
  printf '%s: %s colors\n' "$(basename "$shot")" "$colors"
  if [[ "$colors" -lt 2 ]]; then
    echo "DOSBox capture is monochrome/blank: $shot" >&2
    cat "$WORK_DIR/dosbox.log" >&2
    exit 1
  fi
  stem="${shot%.png}"
  tesseract "$shot" "$stem" --psm 6 >/dev/null 2>&1 || true
done

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    printf '%s\n' '### Original Sneakers DOSBox/Xvfb diagnostic' ''
    printf '%s\n' 'Original ZIP and both executable members passed SHA-256/CRC checks.'
    for txt in "$WORK_DIR/startup.txt" "$WORK_DIR/after-key.txt"; do
      printf '\n#### %s OCR\n\n```text\n' "$(basename "$txt")"
      cat "$txt" 2>/dev/null || true
      printf '%s\n' '```'
    done
  } >> "$GITHUB_STEP_SUMMARY"
fi

printf '%s\n' '--- startup OCR ---'
cat "$WORK_DIR/startup.txt" 2>/dev/null || true
printf '%s\n' '--- after-key OCR ---'
cat "$WORK_DIR/after-key.txt" 2>/dev/null || true
printf '%s\n' '--- DOSBox log ---'
cat "$WORK_DIR/dosbox.log"
printf 'Original DOSBox diagnostic complete; images and logs are in %s\n' "$WORK_DIR"
