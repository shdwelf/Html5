#!/usr/bin/env bash
# Run the checked-in Sneakers js-dos payload in native DOSBox under Xvfb.
# Writes DOSBox diagnostics, a post-password screenshot, and OCR output to SNEAKERS_SMOKE_DIR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE="$ROOT/webxdc-dos/public/roms/SNEAKERS.jsdos"
WORK_DIR="${SNEAKERS_SMOKE_DIR:-$(mktemp -d)}"
GAME_DIR="$WORK_DIR/game"
mkdir -p "$GAME_DIR"

unzip -q "$BUNDLE" -d "$GAME_DIR"
python3 - "$GAME_DIR" <<'PY'
import pathlib, struct, sys
root = pathlib.Path(sys.argv[1])
exe = (root / "SNEAKERS.EXE").read_bytes()
assert exe[:2] == b"MZ", "SNEAKERS.EXE is not an MZ executable"
last = struct.unpack_from("<H", exe, 2)[0]
pages = struct.unpack_from("<H", exe, 4)[0]
declared = (pages - 1) * 512 + last if last else pages * 512
assert declared == len(exe), f"MZ size mismatch: header {declared}, file {len(exe)}"
bat = (root / "RUN.BAT").read_text(encoding="cp437").upper()
assert "SNEAKERS.EXE" in bat, "RUN.BAT does not start SNEAKERS.EXE"
conf = (root / ".jsdos" / "dosbox.conf").read_text(encoding="utf-8")
autoexec = conf.split("[autoexec]", 1)[-1].strip().splitlines()
assert autoexec[-1].strip().upper() == "RUN.BAT", f"unexpected autoexec: {autoexec}"
print(f"validated MZ payload ({len(exe)} bytes) and RUN.BAT autoexec")
PY

if [[ -z "${DISPLAY:-}" ]]; then
  export DISPLAY=:99
  Xvfb "$DISPLAY" -screen 0 800x600x24 >/dev/null 2>&1 &
  xvfb_pid=$!
fi
emulator_pid=""
cleanup() {
  if [[ -n "$emulator_pid" ]] && kill -0 "$emulator_pid" 2>/dev/null; then
    kill -TERM "$emulator_pid" 2>/dev/null || true
  fi
  if [[ -n "${xvfb_pid:-}" ]]; then
    kill "$xvfb_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT
sleep 2

# The emulator may keep its DOS prompt open after the game's menu exits, so
# capture the verified screen first and terminate DOSBox after the interaction.
dosbox \
  -c "mount c $GAME_DIR" \
  -c "c:" \
  -c "RUN.BAT" \
  -c "exit" \
  > "$WORK_DIR/dosbox.log" 2>&1 &
emulator_pid=$!

(
  sleep 5
  window=""
  for _ in $(seq 1 40); do
    window="$(xdotool search --onlyvisible --class '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
    if [[ -z "$window" ]]; then
      window="$(xdotool search --onlyvisible --name '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
    fi
    if [[ -n "$window" ]]; then break; fi
    sleep 0.25
  done
  if [[ -z "$window" ]]; then
    echo "DOSBox window was not found under DISPLAY=$DISPLAY" >&2
    exit 1
  fi
  xdotool windowfocus --sync "$window" 2>/dev/null || true
  xdotool type --clearmodifiers --delay 45 'setec astronomy'
  xdotool key Return
  sleep 3
  import -window root "$WORK_DIR/after-password.png"
  xdotool type --clearmodifiers '7'
  xdotool key Return
) &
bot_pid=$!
bot_status=0
wait "$bot_pid" || bot_status=$?
if [[ "$bot_status" -ne 0 ]]; then
  cat "$WORK_DIR/dosbox.log" >&2
  echo "DOSBox input automation failed with status $bot_status" >&2
  exit "$bot_status"
fi

sleep 2
if kill -0 "$emulator_pid" 2>/dev/null; then
  echo "DOSBox remained open after the exit selection; stopping it after screen capture."
  kill -TERM "$emulator_pid" 2>/dev/null || true
fi
wait "$emulator_pid" 2>/dev/null || true
emulator_pid=""

test -s "$WORK_DIR/after-password.png"
colors="$(identify -format '%k' "$WORK_DIR/after-password.png")"
test "$colors" -gt 10
convert "$WORK_DIR/after-password.png" -trim +repage -resize 250% -colorspace Gray -auto-level -threshold 55% "$WORK_DIR/ocr.png"
tesseract "$WORK_DIR/ocr.png" "$WORK_DIR/ocr" --psm 6 >/dev/null 2>&1
normalized="$(tr '[:upper:]' '[:lower:]' < "$WORK_DIR/ocr.txt" | tr -cd '[:alnum:]\n')"
printf '%s\n' '--- DOSBox screen OCR ---'
cat "$WORK_DIR/ocr.txt"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    printf '%s\n' '### Sneakers DOSBox smoke test' '' "Screenshot colors: $colors" '' '```text'
    cat "$WORK_DIR/ocr.txt"
    printf '%s\n' '```'
  } >> "$GITHUB_STEP_SUMMARY"
fi
if ! grep -q 'accessgranted' <<<"$normalized" || ! grep -q 'sneakerspresskit' <<<"$normalized" || ! grep -q 'select' <<<"$normalized"; then
  summary="$(tr '\n' ' ' < "$WORK_DIR/ocr.txt")"
  echo "::error title=Sneakers DOSBox screen did not reach the press-kit menu::$summary"
  exit 1
fi
printf 'DOSBox reached the Sneakers press-kit menu; screenshot has %s colors.\n' "$colors"
cat "$WORK_DIR/dosbox.log"
