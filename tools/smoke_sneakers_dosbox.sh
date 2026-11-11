#!/usr/bin/env bash
# Run the checked-in Sneakers js-dos payload in native DOSBox under Xvfb.
# Writes DOSBox diagnostics, password/menu screenshots, and OCR output to SNEAKERS_SMOKE_DIR.
set -eEuo pipefail
trap 'code=$?; echo "::error title=Sneakers smoke failure::line $LINENO: $BASH_COMMAND (exit $code)"; exit "$code"' ERR

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

# Leave DOSBox at its DOS prompt if the game returns. An explicit `-c exit`
# can close the SDL window before the keyboard driver locates it, hiding both
# a successful game return and a failed autoexec from the diagnostic capture.
dosbox \
  -c "mount c $GAME_DIR" \
  -c "c:" \
  -c "RUN.BAT" \
  > "$WORK_DIR/dosbox.log" 2>&1 &
emulator_pid=$!

(
  set -x
  sleep 5
  # Find the SDL window for a focused XTest keyboard stream and a screenshot
  # of the window itself (Xvfb's root image does not composite child windows).
  window=""
  for _ in $(seq 1 40); do
    window="$(xdotool search --onlyvisible --name '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
    if [[ -z "$window" ]]; then
      window="$(xdotool search --onlyvisible --class '.*[Dd][Oo][Ss][Bb][Oo][Xx].*' 2>/dev/null | head -n1 || true)"
    fi
    # DOSBox/SDL builds differ in WM_NAME/WM_CLASS; on the workflow's bare
    # Xvfb display, accept the sole visible client as the emulator window.
    if [[ -z "$window" ]]; then
      mapfile -t visible_windows < <(xdotool search --onlyvisible --name '.*' 2>/dev/null || true)
      if [[ ${#visible_windows[@]} -eq 1 ]]; then window="${visible_windows[0]}"; fi
    fi
    if [[ -n "$window" ]]; then break; fi
    if ! kill -0 "$emulator_pid" 2>/dev/null; then break; fi
    sleep 0.25
  done
  if [[ -z "$window" ]]; then
    listing="$(xdotool search --onlyvisible --name '.*' 2>/dev/null | while read -r id; do printf '%s %s\n' "$id" "$(xdotool getwindowname "$id" 2>/dev/null || true)"; done)"
    echo "DOSBox window not found; visible windows: ${listing:-none}; emulator alive: $(kill -0 "$emulator_pid" 2>/dev/null && echo yes || echo no)" >&2
    cat "$WORK_DIR/dosbox.log" >&2
    echo "::error title=Sneakers DOSBox window missing::$listing"
    exit 1
  fi
  printf '%s\n' "$window" > "$WORK_DIR/window.id"
  xdotool windowfocus --sync "$window" 2>/dev/null || true

  # Fixed sleeps made the test race DOSBox/game startup on slower CI runners:
  # the window could exist while its frame was still blank, so XTest typed into
  # a screen that had not reached the password prompt. Poll the actual DOSBox
  # frame and OCR state transitions before sending any input.
  capture_screen() {
    local stem="$1"
    if ! import -window "$window" "$stem.png" 2>/dev/null; then return 1; fi
    SCREEN_COLORS="$(identify -format '%k' "$stem.png" 2>/dev/null || true)"
    [[ "$SCREEN_COLORS" =~ ^[0-9]+$ ]] || return 1
    (( SCREEN_COLORS > 1 )) || return 1
    convert "$stem.png" -trim +repage -resize 250% -colorspace Gray -auto-level -threshold 55% "$stem-ocr.png"
    if ! tesseract "$stem-ocr.png" "$stem" --psm 6 >/dev/null 2>&1; then return 1; fi
    SCREEN_TEXT="$(tr '[:upper:]' '[:lower:]' < "$stem.txt" | tr -cd '[:alnum:]\n')"
  }

  wait_for_password_prompt() {
    local deadline=$((SECONDS + 45))
    while (( SECONDS < deadline )); do
      if capture_screen "$WORK_DIR/before-password" \
        && grep -Eq 'accesscode|entercode|securitysystem' <<<"$SCREEN_TEXT"; then
        return 0
      fi
      if ! kill -0 "$emulator_pid" 2>/dev/null; then break; fi
      sleep 1
    done
    echo "Timed out waiting for the Sneakers password prompt; last OCR: $(tr '\n' ' ' < "$WORK_DIR/before-password.txt" 2>/dev/null || true)" >&2
    return 1
  }

  wait_for_press_kit_menu() {
    local deadline=$((SECONDS + 45))
    while (( SECONDS < deadline )); do
      if capture_screen "$WORK_DIR/after-password" \
        && grep -q 'sneakerspresskit' <<<"$SCREEN_TEXT" \
        && grep -Eq 'castbiographies|plotsynopsis|productionnotes|photogallery|printpressmaterials|crosswordvertical' <<<"$SCREEN_TEXT" \
        && grep -q 'exit' <<<"$SCREEN_TEXT"; then
        return 0
      fi
      if ! kill -0 "$emulator_pid" 2>/dev/null; then break; fi
      sleep 1
    done
    echo "Timed out waiting for the Sneakers press-kit menu; last OCR: $(tr '\n' ' ' < "$WORK_DIR/after-password.txt" 2>/dev/null || true)" >&2
    return 1
  }

  if ! wait_for_password_prompt; then
    echo "::error title=Sneakers DOSBox password prompt missing::window=$window colors=${SCREEN_COLORS:-unknown}"
    exit 1
  fi
  xdotool type --clearmodifiers --delay 45 'setec astronomy'
  xdotool key Return
  if ! wait_for_press_kit_menu; then
    echo "::error title=Sneakers DOSBox press-kit menu missing::window=$window colors=${SCREEN_COLORS:-unknown}"
    exit 1
  fi
  xdotool type --clearmodifiers '7'
  xdotool key Return
) > "$WORK_DIR/input.log" 2>&1 &
bot_pid=$!
bot_status=0
wait "$bot_pid" || bot_status=$?
if [[ "$bot_status" -ne 0 ]]; then
  cat "$WORK_DIR/input.log" >&2
  cat "$WORK_DIR/dosbox.log" >&2
  summary="$(tr '\n' ' ' < "$WORK_DIR/input.log")"
  echo "::error title=Sneakers keyboard automation failed::$summary"
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
# Tesseract sometimes drops the final characters of the selection prompt even
# when the menu is visibly present. Require the title, a real menu entry, and
# the Exit item instead of depending on an exact OCR reading of "Select".
if ! grep -q 'sneakerspresskit' <<<"$normalized" \
  || ! grep -Eq 'castbiographies|plotsynopsis|productionnotes|photogallery|printpressmaterials|crosswordvertical' <<<"$normalized" \
  || ! grep -q 'exit' <<<"$normalized"; then
  summary="$(tr '\n' ' ' < "$WORK_DIR/ocr.txt")"
  window="$(cat "$WORK_DIR/window.id" 2>/dev/null || true)"
  echo "::error title=Sneakers DOSBox screen did not reach the press-kit menu::window=$window colors=$colors OCR=$summary"
  exit 1
fi
printf 'DOSBox reached the Sneakers press-kit menu; screenshot has %s colors.\n' "$colors"
cat "$WORK_DIR/dosbox.log"
