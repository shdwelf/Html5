#!/usr/bin/env bash
# Boot the recovered MAP.EXE build, enter the Press Pass name, and capture the
# screen before and after submitting it. This is a manual/CI diagnostic, not a
# fake success assertion: screenshots and DOSBox logs are kept for review.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="${HEADLINE_HARRY_GAME_DIR:-$ROOT/.xfer/harry/installed}"
OUT_DIR="${HEADLINE_HARRY_SMOKE_DIR:-$(mktemp -d)}"
mkdir -p "$OUT_DIR"

python3 - "$GAME_DIR" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
exe = root / "MAP.EXE"
if not exe.is_file():
    raise SystemExit(f"missing recovered game executable: {exe}")
if exe.read_bytes()[:2] != b"MZ":
    raise SystemExit("MAP.EXE is not a clean installer-recovered MZ executable")
print(f"validated {exe} ({exe.stat().st_size} bytes, clean MZ)")
PY

xvfb_pid=""
dosbox_pid=""
cleanup() {
  if [[ -n "$dosbox_pid" ]] && kill -0 "$dosbox_pid" 2>/dev/null; then
    kill -TERM "$dosbox_pid" 2>/dev/null || true
    wait "$dosbox_pid" 2>/dev/null || true
  fi
  if [[ -n "$xvfb_pid" ]]; then
    kill "$xvfb_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ -z "${DISPLAY:-}" ]]; then export DISPLAY=:99; fi
if ! xdotool getdisplaygeometry >/dev/null 2>&1; then
  Xvfb "$DISPLAY" -screen 0 800x600x24 >/dev/null 2>&1 &
  xvfb_pid=$!
  for _ in $(seq 1 40); do
    if xdotool getdisplaygeometry >/dev/null 2>&1; then break; fi
    sleep 0.25
  done
fi
if ! xdotool getdisplaygeometry >/dev/null 2>&1; then
  echo "could not connect to X display $DISPLAY" >&2
  exit 1
fi

# Match the js-dos bundle's [autoexec]: mount the recovered C:\HH files and
# start MAP.EXE directly, bypassing the known INTRO.EXE command-line stall.
dosbox \
  -c "mount c $GAME_DIR" \
  -c "c:" \
  -c "MAP.EXE" \
  > "$OUT_DIR/dosbox.log" 2>&1 &
dosbox_pid=$!

window=""
for _ in $(seq 1 80); do
  window="$(xdotool search --onlyvisible --name '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
  if [[ -z "$window" ]]; then
    window="$(xdotool search --onlyvisible --class '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
  fi
  if [[ -z "$window" ]]; then
    mapfile -t visible_windows < <(xdotool search --onlyvisible --name '.*' 2>/dev/null || true)
    if [[ ${#visible_windows[@]} -eq 1 ]]; then window="${visible_windows[0]}"; fi
  fi
  if [[ -n "$window" ]]; then break; fi
  if ! kill -0 "$dosbox_pid" 2>/dev/null; then break; fi
  sleep 0.25
done

if [[ -z "$window" ]]; then
  echo "DOSBox window was not found; log follows:" >&2
  cat "$OUT_DIR/dosbox.log" >&2
  exit 1
fi

xdotool windowfocus --sync "$window" 2>/dev/null || true
eval "$(xdotool getwindowgeometry --shell "$window")"
printf 'window=%s width=%s height=%s\n' "$window" "$WIDTH" "$HEIGHT" | tee "$OUT_DIR/window.txt"

# The 800x600 reference frame is the verified Press Pass screenshot. Scale its
# textbox/button points to the actual DOSBox client window (some SDL builds use
# 640x400, others 800x600). The first frame is retained as the baseline.
field_x=$((WIDTH * 400 / 800))
field_y=$((HEIGHT * 290 / 600))
button_x=$((WIDTH * 400 / 800))
button_y=$((HEIGHT * 344 / 600))
sleep 5
import -window "$window" "$OUT_DIR/press-pass-before.png"

# Provide a deterministic, throwaway reporter name; no personal data is used.
xdotool mousemove --window "$window" "$field_x" "$field_y" click 1
xdotool type --clearmodifiers --delay 60 'ARENA REPORTER'
sleep 1
import -window "$window" "$OUT_DIR/press-pass-filled.png"
xdotool mousemove --window "$window" "$button_x" "$button_y" click 1
sleep 12
import -window "$window" "$OUT_DIR/after-press-pass.png"

for image in "$OUT_DIR/press-pass-before.png" "$OUT_DIR/press-pass-filled.png" "$OUT_DIR/after-press-pass.png"; do
  test -s "$image"
  identify "$image"
done

# Report the changed-pixel count for the central form area. The screenshot is
# intentionally preserved for human review because DOSBox/SDL scaling and the
# next screen can vary between host builds.
filled_crop="$OUT_DIR/filled-crop.png"
after_crop="$OUT_DIR/after-crop.png"
convert "$OUT_DIR/press-pass-filled.png" -crop 520x300+140+150 +repage "$filled_crop"
convert "$OUT_DIR/after-press-pass.png" -crop 520x300+140+150 +repage "$after_crop"
delta="$(compare -metric AE "$filled_crop" "$after_crop" null: 2>&1 || true)"
printf 'central-form changed pixels after submit: %s\n' "$delta" | tee "$OUT_DIR/submit-delta.txt"
printf 'Submission attempt captured; review after-press-pass.png to confirm whether OK advanced the game.\n'
