#!/usr/bin/env bash
# build_mealplan_applet.sh — build the MealPlan Java Card applet to a CAP file.
#
# Neither the JDK nor the Java Card kit is vendored in this repository. Both are
# fetched at build time, from sources this sandbox can actually reach:
#
#   JDK 8   MR-Adopt/MR-Adopt.github.io, tool/software/zulu_jdks/...-linux_x64
#           Zulu OpenJDK 8u362. Fetched with a blobless sparse clone, so only
#           that one directory's blobs are downloaded (204 MB, a few seconds).
#           JDK 8 specifically: Java Card 3.0.3's converter rejects class file
#           version 51, so -target 1.6 is required, and JDK 17+ has dropped
#           support for that source level.
#
#   JC kit  FeitianSmartcardReader/AppletPlayground, which ships Oracle's Java
#           Card 2.2.1 / 2.2.2 / 3.0.3 kits in ext/ along with the vjcre
#           simulator in lib/. This is Feitian's own repository, so it is the
#           closest thing to an official developer package that is reachable
#           without a vendor login.
#
# The fetched toolchains land in .cache/ (gitignored). Oracle's jars are not
# committed: they are redistributable by Feitian, not by this repository.
#
#   tools/build_mealplan_applet.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="$ROOT/.cache/applet-toolchain"
JDK_DIR="$CACHE/zulu8.68.0.19-ca-jdk8.0.362-linux_x64"
APG_DIR="$CACHE/AppletPlayground"
KIT="$APG_DIR/ext/java_card_kit-3_0_3"
SRC="$ROOT/smartcard/mealplan/src"
OUT="$ROOT/build/mealplan"

PKG="com.shdwelf.mealplan"
PKG_AID="0xA0:0x00:0x00:0x06:0x17:0x02:0x4D:0x50:0x01:0x01:0x00:0x00:0x00:0x00:0x00:0x01"
APPLET_AID="0xA0:0x00:0x00:0x06:0x17:0x02:0x4D:0x50:0x01:0x01:0x00:0x00:0x00:0x00:0x00:0x02"

mkdir -p "$CACHE"

# ------------------------------------------------------------------ toolchain

if [ ! -x "$JDK_DIR/bin/javac" ]; then
  echo ">> fetching Zulu OpenJDK 8u362 (sparse, blobless)"
  rm -rf "$CACHE/mradopt"
  git clone --quiet --filter=blob:none --sparse --depth 1 \
    https://github.com/MR-Adopt/MR-Adopt.github.io.git "$CACHE/mradopt"
  git -C "$CACHE/mradopt" sparse-checkout set \
    tool/software/zulu_jdks/zulu8.68.0.19-ca-jdk8.0.362-linux_x64
  mv "$CACHE/mradopt/tool/software/zulu_jdks/zulu8.68.0.19-ca-jdk8.0.362-linux_x64" "$JDK_DIR"
  rm -rf "$CACHE/mradopt"
fi

if [ ! -f "$KIT/lib/api_classic.jar" ]; then
  echo ">> fetching Feitian AppletPlayground (Java Card kits + vjcre simulator)"
  rm -rf "$APG_DIR"
  git clone --quiet --depth 1 \
    https://github.com/FeitianSmartcardReader/AppletPlayground.git "$APG_DIR"
fi

export PATH="$JDK_DIR/bin:$PATH"
echo ">> $(javac -version 2>&1)  api_classic.jar from $(basename "$KIT")"

# --------------------------------------------------------------------- compile

rm -rf "$OUT"; mkdir -p "$OUT/classes" "$OUT/cap"

# -encoding UTF-8: the source has non-ASCII punctuation and javac's default
# encoding is the platform's, which is ASCII here and fails on an em dash.
# -source/-target 1.6: the converter rejects class file version 51.
javac -g -encoding UTF-8 -source 1.6 -target 1.6 \
  -bootclasspath "$KIT/lib/api_classic.jar" \
  -d "$OUT/classes" \
  "$SRC/com/shdwelf/mealplan/MealPlanApplet.java" 2>&1 \
  | grep -viE '^warning: \[options\]|bootstrap class path|^Note:' || true

test -f "$OUT/classes/com/shdwelf/mealplan/MealPlanApplet.class" \
  || { echo "!! javac produced no class file"; exit 1; }

# -------------------------------------------------------------------- convert

# The converter refuses to write into a directory that already holds output for
# the package and reports a bare "Verification failed"; hence the rm above.
java -cp "$KIT/lib/tools.jar:$KIT/lib/api_classic.jar" \
  com.sun.javacard.converter.Main \
  -classdir "$OUT/classes" -out CAP EXP \
  -exportpath "$KIT/api_export_files" -d "$OUT/cap" \
  -applet "$APPLET_AID" com.shdwelf.mealplan.MealPlanApplet \
  "$PKG" "$PKG_AID" 1.0 2>&1 | grep -viE '^Oct |^INFO: *$' || true

CAP="$OUT/cap/com/shdwelf/mealplan/javacard/mealplan.cap"
test -f "$CAP" || { echo "!! converter produced no CAP"; exit 1; }

echo
echo ">> package AID  $PKG_AID"
echo ">> applet  AID  $APPLET_AID"
echo ">> CAP          $CAP ($(wc -c < "$CAP") bytes)"
echo ">> EXP          $OUT/cap/com/shdwelf/mealplan/javacard/mealplan.exp"
echo
echo "Components inside the CAP:"
unzip -l "$CAP" | awk 'NR>3 && $4 != "" {printf "  %-24s %6s bytes\n", $4, $1}' | grep '\.cap'
