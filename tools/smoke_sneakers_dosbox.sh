#!/usr/bin/env bash
# Run the checked-in Sneakers js-dos payload in native DOSBox under Xvfb.
# On success, writes dosbox.log and after-password.png to SNEAKERS_SMOKE_DIR.
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
  trap 'kill "$xvfb_pid" 2>/dev/null || true' EXIT
  sleep 2
fi

# Focus DOSBox, enter the documented password, capture the result screen, then
# dismiss its final key wait so the emulator exits instead of timing out.
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
  xdotool windowfocus "$window" 2>/dev/null || true
  xdotool type --window "$window" --clearmodifiers --delay 45 'setec astronomy'
  xdotool key --window "$window" Return
  sleep 3
  import -window root "$WORK_DIR/after-password.png"
  xdotool key --window "$window" Return
) &
bot_pid=$!

set +e
timeout 35s dosbox \
  -c "mount c $GAME_DIR" \
  -c "c:" \
  -c "RUN.BAT" \
  -c "exit" \
  > "$WORK_DIR/dosbox.log" 2>&1
status=$?
set -e
wait "$bot_pid" || true
if [[ "$status" -ne 0 ]]; then
  cat "$WORK_DIR/dosbox.log" >&2
  echo "DOSBox exited with status $status" >&2
  exit "$status"
fi

test -s "$WORK_DIR/after-password.png"
colors="$(magick "$WORK_DIR/after-password.png" -format '%k' info:)"
test "$colors" -gt 10
printf 'DOSBox exited cleanly; post-password screenshot has %s colors.\n' "$colors"
cat "$WORK_DIR/dosbox.log"
