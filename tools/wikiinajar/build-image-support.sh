#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
INPUT_PACKAGE="${1:-}"
OUTPUT_PACKAGE="${2:-$REPO_ROOT/build/WikiInAJar-0.8-image-support.zip}"

if [[ -z "$INPUT_PACKAGE" || ! -f "$INPUT_PACKAGE" ]]; then
  echo "Usage: $0 <WikiInAJar-0.8-20081128-bin.zip> [output.zip]" >&2
  exit 2
fi

for command_name in unzip node python3; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 2
  fi
done

if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate_bin in "$REPO_ROOT"/.relay/jdk/extracted/jdk*/bin; do
    if [[ -x "$candidate_bin/javac" && -x "$candidate_bin/java" ]]; then
      JAVA_HOME="${candidate_bin%/bin}"
      break
    fi
  done
fi

find_java_tool() {
  local tool_name="$1"
  if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/$tool_name" ]]; then
    printf '%s\n' "$JAVA_HOME/bin/$tool_name"
  elif command -v "$tool_name" >/dev/null 2>&1; then
    command -v "$tool_name"
  else
    return 1
  fi
}

JAVAC_BIN="${JAVAC:-$(find_java_tool javac || true)}"
JAVA_BIN="${JAVA:-$(find_java_tool java || true)}"
JAR_BIN="${JAR:-$(find_java_tool jar || true)}"
if [[ -z "$JAVAC_BIN" || -z "$JAVA_BIN" || -z "$JAR_BIN" ]]; then
  echo "A JDK is required (javac, java, and jar). Set JAVA_HOME or put a JDK on PATH." >&2
  exit 2
fi

OUTPUT_PACKAGE="$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "$OUTPUT_PACKAGE")"
mkdir -p "$(dirname -- "$OUTPUT_PACKAGE")"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
PACKAGE_DIR="$WORK_DIR/package"
mkdir -p "$PACKAGE_DIR"
unzip -q "$INPUT_PACKAGE" -d "$PACKAGE_DIR"

APP_JAR="$(find "$PACKAGE_DIR" -type f -name 'wiki.in.a.jar' -print -quit)"
if [[ -z "$APP_JAR" ]]; then
  echo "The input ZIP does not contain wiki.in.a.jar." >&2
  exit 1
fi
APP_ROOT="$(dirname -- "$APP_JAR")"
if [[ ! -d "$APP_ROOT/public/skins/default/common" || ! -d "$APP_ROOT/public/docs/wiki" ]]; then
  echo "The archive does not have the expected Wiki-in-a-Jar 0.8 layout." >&2
  exit 1
fi

CLASSES_DIR="$WORK_DIR/classes"
TEST_CLASSES_DIR="$WORK_DIR/test-classes"
mkdir -p "$CLASSES_DIR" "$TEST_CLASSES_DIR"
find "$SCRIPT_DIR/src" -type f -name '*.java' -print0 \
  | xargs -0 "$JAVAC_BIN" --release 8 -encoding UTF-8 \
      -classpath "$APP_JAR" -d "$CLASSES_DIR"

TEST_SOURCE="$SCRIPT_DIR/test/java/org/rgse/wikiinajar/helpers/wiki/render/ImageSupportSmokeTest.java"
"$JAVAC_BIN" --release 8 -encoding UTF-8 \
  -classpath "$CLASSES_DIR:$APP_JAR" -d "$TEST_CLASSES_DIR" "$TEST_SOURCE"
"$JAVA_BIN" -ea -classpath "$CLASSES_DIR:$APP_JAR:$TEST_CLASSES_DIR" \
  org.rgse.wikiinajar.helpers.wiki.render.ImageSupportSmokeTest

"$JAR_BIN" --update --file "$APP_JAR" -C "$CLASSES_DIR" .

mkdir -p "$APP_ROOT/public/docs/image"
cp -R "$SCRIPT_DIR/public/skins/default/." "$APP_ROOT/public/skins/default/"
cp "$SCRIPT_DIR/public/docs/wiki/Image Support Demo.wiki" \
  "$APP_ROOT/public/docs/wiki/Image Support Demo.wiki"
cp "$APP_ROOT/public/skins/default/common/mag.png" \
  "$APP_ROOT/public/docs/image/demo.png"
cp "$SCRIPT_DIR/test/fixtures/boy.djvu" \
  "$APP_ROOT/public/docs/image/djvu-smoke.djvu"
cp "$SCRIPT_DIR/test/fixtures/ATTRIBUTION.md" \
  "$APP_ROOT/public/docs/image/ATTRIBUTION.txt"
cp "$SCRIPT_DIR/INSTALLATION-README.txt" "$APP_ROOT/README-image-support.txt"

MAIN_PAGE="$APP_ROOT/public/docs/wiki/Main Page.wiki"
if ! grep -Fq '[[Image Support Demo]]' "$MAIN_PAGE"; then
  printf '\n* Try the image and DjVu demo: [[Image Support Demo]]\n' >> "$MAIN_PAGE"
fi
node "$SCRIPT_DIR/patch-public.mjs" "$APP_ROOT"

python3 - "$APP_ROOT" "$OUTPUT_PACKAGE" <<'PY'
from pathlib import Path
import sys
import zipfile

app_root = Path(sys.argv[1])
output = Path(sys.argv[2])
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(app_root.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(app_root.parent).as_posix())
PY

echo "Built $OUTPUT_PACKAGE"
echo "Patched classes: WikiLink image/DjVu rendering, ImageController, MIME handling, and static-path checks."
echo "The output includes the original 0.8 app, the DjVu WebAssembly reader, and a demo article."
