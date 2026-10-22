#!/usr/bin/env bash
# Boot the recovered MAP.EXE build, enter the Press Pass name, and attempt to
# activate OK. Keep before/after screenshots and DOSBox diagnostics for review.
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
# 640x400, others 800x600).
field_x=$((WIDTH * 400 / 800))
field_y=$((HEIGHT * 290 / 600))
button_x=$((WIDTH * 400 / 800))
button_y=$((HEIGHT * 344 / 600))
sleep 5
import -window "$window" "$OUT_DIR/press-pass-before.png"

# Provide a deterministic, throwaway reporter name; no personal data is used.
xdotool mousemove --sync --window "$window" "$field_x" "$field_y"
xdotool click --delay 120 1
xdotool type --clearmodifiers --delay 60 'ARENA REPORTER'
sleep 1
import -window "$window" "$OUT_DIR/press-pass-filled.png"

crop_image() {
  convert "$1" -crop 520x300+140+150 +repage "$2"
}
changed_pixels() {
  local metric
  metric="$(compare -metric AE "$1" "$2" null: 2>&1 || true)"
  metric="${metric%%$'\n'*}"
  if [[ "$metric" =~ ^[0-9]+$ ]]; then printf '%s' "$metric"; else printf '0'; fi
}

crop_image "$OUT_DIR/press-pass-before.png" "$OUT_DIR/before-crop.png"
crop_image "$OUT_DIR/press-pass-filled.png" "$OUT_DIR/filled-crop.png"
name_delta="$(changed_pixels "$OUT_DIR/before-crop.png" "$OUT_DIR/filled-crop.png")"
printf 'reporter-name changed pixels: %s\n' "$name_delta" | tee "$OUT_DIR/submit-delta.txt"
if (( name_delta < 100 )); then
  echo "reporter name did not visibly render in the Press Pass field" >&2
  exit 1
fi

# First try a real mouse activation. Record X11's pointer location as well as
# the image diff; DOSBox may capture/lock the pointer, so use keyboard focus as
# a fallback only if the form still appears unchanged.
xdotool mousemove --sync --window "$window" "$button_x" "$button_y"
xdotool getmouselocation --shell > "$OUT_DIR/mouse-at-ok.txt"
xdotool click --delay 120 1
sleep 3
import -window "$window" "$OUT_DIR/after-mouse-click.png"
crop_image "$OUT_DIR/after-mouse-click.png" "$OUT_DIR/after-mouse-crop.png"
mouse_delta="$(changed_pixels "$OUT_DIR/filled-crop.png" "$OUT_DIR/after-mouse-crop.png")"
printf 'mouse-click changed pixels: %s\n' "$mouse_delta" | tee -a "$OUT_DIR/submit-delta.txt"

submit_delta="$mouse_delta"
submit_method="mouse click"
if (( mouse_delta < 1500 )); then
  echo "mouse click produced no clear screen transition; trying Tab + Enter" | tee -a "$OUT_DIR/submit-delta.txt"
  xdotool key --clearmodifiers Tab
  xdotool key --clearmodifiers Return
  sleep 3
  import -window "$window" "$OUT_DIR/after-keyboard-submit.png"
  crop_image "$OUT_DIR/after-keyboard-submit.png" "$OUT_DIR/after-keyboard-crop.png"
  keyboard_delta="$(changed_pixels "$OUT_DIR/filled-crop.png" "$OUT_DIR/after-keyboard-crop.png")"
  printf 'Tab+Enter changed pixels: %s\n' "$keyboard_delta" | tee -a "$OUT_DIR/submit-delta.txt"
  submit_delta="$keyboard_delta"
  submit_method="Tab + Enter"
fi

if (( submit_delta < 1500 )); then
  echo "Tab + Enter produced no clear screen transition; trying Space" | tee -a "$OUT_DIR/submit-delta.txt"
  xdotool key --clearmodifiers space
  sleep 8
  import -window "$window" "$OUT_DIR/after-space-submit.png"
  crop_image "$OUT_DIR/after-space-submit.png" "$OUT_DIR/after-space-crop.png"
  space_delta="$(changed_pixels "$OUT_DIR/filled-crop.png" "$OUT_DIR/after-space-crop.png")"
  printf 'Space changed pixels: %s\n' "$space_delta" | tee -a "$OUT_DIR/submit-delta.txt"
  submit_delta="$space_delta"
  submit_method="Space"
fi

sleep 5
import -window "$window" "$OUT_DIR/after-press-pass.png"
for image in \
  "$OUT_DIR/press-pass-before.png" \
  "$OUT_DIR/press-pass-filled.png" \
  "$OUT_DIR/after-mouse-click.png" \
  "$OUT_DIR/after-press-pass.png"; do
  test -s "$image"
  identify "$image"
done

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo '### Headline Harry Press Pass DOSBox smoke'
    echo "- Reporter-name changed pixels: $name_delta"
    echo "- Activation method: $submit_method"
    echo "- Post-submit changed pixels in the form area: $submit_delta"
    echo '- Review the uploaded `after-press-pass.png` to identify the resulting screen.'
  } >> "$GITHUB_STEP_SUMMARY"
fi

if (( submit_delta < 1500 )); then
  echo "Press Pass did not visibly advance after mouse and keyboard activation attempts; see captured screenshots" >&2
  exit 1
fi
printf 'Screen changed after %s; inspect after-press-pass.png to confirm the next game screen.\n' "$submit_method"
