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
#   tools/build_mealplan_applet.sh          build the CAP
#   tools/build_mealplan_applet.sh --sim    ... and build the simulator harness
#
# --sim additionally fetches easymock/objenesis and compiles it, plus the two
# shim trees under tools/sim/, so that tools/run_mealplan_sim.mjs can drive the
# converted applet headlessly. See docs/feitian-javacard-toolchain.md for why
# the shims exist at all: the free simulator's Signature, OwnerPIN and HMAC key
# support are declared but not implemented.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="$ROOT/.cache/applet-toolchain"
JDK_DIR="$CACHE/zulu8.68.0.19-ca-jdk8.0.362-linux_x64"
APG_DIR="$CACHE/AppletPlayground"
KIT="$APG_DIR/ext/java_card_kit-3_0_3"
VJCRE="$APG_DIR/lib/vjcre.jar"
SRC="$ROOT/smartcard/mealplan/src"
OUT="$ROOT/build/mealplan"

PKG="com.shdwelf.mealplan"
PKG_AID="0xA0:0x00:0x00:0x06:0x17:0x02:0x4D:0x50:0x01:0x01:0x00:0x00:0x00:0x00:0x00:0x01"
APPLET_AID="0xA0:0x00:0x00:0x06:0x17:0x02:0x4D:0x50:0x01:0x01:0x00:0x00:0x00:0x00:0x00:0x02"

mkdir -p "$CACHE"

# Pinned 2026-10-23, after the GitHub JDK/runtime survey in
# docs/github-jdk-runtime-research-2026-10-23.md. The Zulu tree is an
# unofficial Git-hosted copy, so a moving branch is not an acceptable input:
# fetch exact commits and verify the executables/jars that will run here.
MR_ADOPT_COMMIT="7e7d2a8649fbc6d7c590a7e1de8dfaf4289fc04c"
FEITIAN_COMMIT="013b66f783de2947c45f92a779b332a2b7633a17"
OBJENESIS_COMMIT="da5fd820038d2b4a3eaf78ff885f445d05adb7f1"
ZULU8_RELEASE_SHA256="2d22f9cd0f6763ba1ffc1e9a72da7a08a6a76fc90358c521a53b418611e9f86b"
ZULU8_JAVA_SHA256="2618e30a65f22f2739179de39b8e06027718e544860b5672e1d7470bbce66fe7"
ZULU8_JAVAC_SHA256="828c2ff27e0a0d6e17abae963ec7e23a4db5b874177ddedac5415780423a83a2"
JAVACARD_API_SHA256="60bfd9767a6ff3dae69e6b93b0cc99ae798d8f8239812efe6fc9df71acbceead"
JAVACARD_TOOLS_SHA256="dffae8309e7dd785e9e12e2f2726533acb936ec26ad5d24f5b75859762a7cdfc"
VJCRE_SHA256="520875d63650b3bfc010c8304d6f67b00599b853be4940f5360b6b1a6221f9ef"

sha256_check() {
  local expected="$1" file="$2"
  printf '%s  %s\n' "$expected" "$file" | sha256sum -c - >/dev/null || {
    echo "!! SHA-256 mismatch for $file" >&2
    echo "!! expected $expected" >&2
    exit 1
  }
}

checkout_pinned() {
  local repo="$1" commit="$2"
  git -C "$repo" fetch --quiet --depth 1 origin "$commit"
  git -C "$repo" checkout --quiet --detach FETCH_HEAD
  test "$(git -C "$repo" rev-parse HEAD)" = "$commit" || {
    echo "!! $repo is not at pinned commit $commit" >&2
    exit 1
  }
}

# ------------------------------------------------------------------ toolchain

if [ ! -x "$JDK_DIR/bin/javac" ]; then
  echo ">> fetching Zulu OpenJDK 8u362 (sparse, blobless)"
  rm -rf "$CACHE/mradopt"
  git clone --quiet --filter=blob:none --sparse --no-checkout --depth 1 \
    https://github.com/MR-Adopt/MR-Adopt.github.io.git "$CACHE/mradopt"
  git -C "$CACHE/mradopt" sparse-checkout set \
    tool/software/zulu_jdks/zulu8.68.0.19-ca-jdk8.0.362-linux_x64
  checkout_pinned "$CACHE/mradopt" "$MR_ADOPT_COMMIT"
  mv "$CACHE/mradopt/tool/software/zulu_jdks/zulu8.68.0.19-ca-jdk8.0.362-linux_x64" "$JDK_DIR"
  rm -rf "$CACHE/mradopt"
fi

if [ ! -f "$KIT/lib/api_classic.jar" ]; then
  echo ">> fetching Feitian AppletPlayground (Java Card kits + vjcre simulator)"
  rm -rf "$APG_DIR"
  git clone --quiet --depth 1 \
    https://github.com/FeitianSmartcardReader/AppletPlayground.git "$APG_DIR"
  checkout_pinned "$APG_DIR" "$FEITIAN_COMMIT"
fi

sha256_check "$ZULU8_RELEASE_SHA256" "$JDK_DIR/release"
sha256_check "$ZULU8_JAVA_SHA256" "$JDK_DIR/bin/java"
sha256_check "$ZULU8_JAVAC_SHA256" "$JDK_DIR/bin/javac"
sha256_check "$JAVACARD_API_SHA256" "$KIT/lib/api_classic.jar"
sha256_check "$JAVACARD_TOOLS_SHA256" "$KIT/lib/tools.jar"
sha256_check "$VJCRE_SHA256" "$VJCRE"

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

if [ "${1:-}" != "--sim" ]; then exit 0; fi

# ------------------------------------------------------------------ simulator

# jcardsim instantiates applet classes without calling their constructors, via
# objenesis. Only two objenesis classes are referenced, but they pull in the
# whole instantiator tree, and no reachable host carries the jar -- so compile
# it from the official source.
if [ ! -f "$CACHE/objenesis.jar" ]; then
  echo
  echo ">> fetching easymock/objenesis and compiling it"
  rm -rf "$CACHE/objenesis-src"
  git clone --quiet --depth 1 https://github.com/easymock/objenesis.git "$CACHE/objenesis-src"
  checkout_pinned "$CACHE/objenesis-src" "$OBJENESIS_COMMIT"
  rm -rf "$CACHE/objenesis-classes"; mkdir -p "$CACHE/objenesis-classes"
  find "$CACHE/objenesis-src/main/src/main/java" -name '*.java' > "$CACHE/objenesis-src.txt"
  javac -nowarn -encoding UTF-8 -d "$CACHE/objenesis-classes" \
    "@$CACHE/objenesis-src.txt" 2>&1 | grep -viE 'Unsafe is internal|^Note:' || true
  jar cf "$CACHE/objenesis.jar" -C "$CACHE/objenesis-classes" .
  rm -rf "$CACHE/objenesis-src" "$CACHE/objenesis-classes"
fi
echo ">> objenesis $CACHE/objenesis.jar ($(wc -c < "$CACHE/objenesis.jar") bytes)"

# The shims replace the simulator's unimplemented Signature, OwnerPIN and HMAC
# key support, and occupy the org.bouncycastle provider name that VRE's
# verifier insists on resolving. Both trees are host-side Java: they are
# compiled without -target 1.6 and are never part of the CAP.
rm -rf "$OUT/shim-classes" "$OUT/sim-classes"
mkdir -p "$OUT/shim-classes" "$OUT/sim-classes"

echo ">> compiling simulator shims"
find "$ROOT/tools/sim/simshim" -name '*.java' > "$OUT/shim-srcs.txt"
javac -nowarn -encoding UTF-8 -classpath "$VJCRE" \
  -d "$OUT/shim-classes" "@$OUT/shim-srcs.txt" 2>&1 | grep -viE '^Note:' || true

echo ">> compiling simulator harness"
# api_classic.jar must come FIRST. vjcre.jar carries its own copy of the Java
# Card API and at least one constant in it is wrong: its ISO7816.SW_WRONG_DATA
# is 26368 (0x6700), the same value as SW_WRONG_LENGTH, where Oracle's is 27264
# (0x6A80). Compiling the applet against vjcre therefore bakes a wrong status
# word into the class file, and the simulator then faithfully reports a card
# that no real card would be. Compiling against the real API inlines the right
# value; at runtime the classes still resolve to vjcre's implementations, which
# is the normal compile-against-api / run-against-simulator split.
javac -nowarn -encoding UTF-8 -source 1.6 -target 1.6 \
  -classpath "$KIT/lib/api_classic.jar:$VJCRE" \
  -d "$OUT/sim-classes" \
  "$SRC/com/shdwelf/mealplan/MealPlanApplet.java" \
  "$ROOT/tools/sim/MealPlanSim.java" \
  "$ROOT/tools/sim/bcshim/org/bouncycastle/jce/provider/BouncyCastleProvider.java" 2>&1 \
  | grep -viE 'bootstrap class path|source value|target value|deprecat' || true

test -f "$OUT/sim-classes/MealPlanSim.class" || { echo "!! harness did not compile"; exit 1; }
test -f "$OUT/shim-classes/pro/javacard/vre/vSignature.class" \
  || { echo "!! shims did not compile"; exit 1; }

echo
echo ">> simulator ready"
echo ">>   shims  $OUT/shim-classes"
echo ">>   harness $OUT/sim-classes"
