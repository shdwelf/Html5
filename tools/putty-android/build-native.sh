#!/usr/bin/env bash
# Build real PuTTY/Plink as an Android packaged executable + private PTY JNI bridge.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
: "${ANDROID_NDK_HOME:?Set ANDROID_NDK_HOME to Android NDK 27.2.12479018}"
SOURCE="$ROOT/build/putty-android/source/putty-0.85"
DEST="$ROOT/apps/putty-android/app/src/main/jniLibs"
[[ -f "$SOURCE/LICENCE" ]] || { echo 'Run fetch-source.py first' >&2; exit 1; }
for ABI in arm64-v8a x86_64; do
  case "$ABI" in
    arm64-v8a) TRIPLE=aarch64-linux-android ;;
    x86_64) TRIPLE=x86_64-linux-android ;;
  esac
  BUILD="$ROOT/build/putty-android/native-$ABI"
  cmake -S "$SOURCE" -B "$BUILD" -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE="$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake" \
    -DANDROID_ABI="$ABI" -DANDROID_PLATFORM=android-28 -DANDROID_STL=none \
    -DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON \
    -DCMAKE_BUILD_TYPE=Release -DPUTTY_GTK_VERSION=NONE -DPUTTY_GSSAPI=OFF
  cmake --build "$BUILD" --target plink --parallel 4
  mkdir -p "$DEST/$ABI"
  cp "$BUILD/plink" "$DEST/$ABI/libplink.so"
  TOOLCHAIN="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin"
  "$TOOLCHAIN/${TRIPLE}28-clang" -std=c11 -fPIC -shared -Wall -Wextra -Werror \
    -Wl,-z,relro,-z,now,-z,noexecstack,-z,max-page-size=16384 \
    -I"$JAVA_HOME/include" -I"$JAVA_HOME/include/linux" \
    "$ROOT/apps/putty-android/app/src/main/cpp/pty.c" \
    -o "$DEST/$ABI/libputtypty.so"
  "$TOOLCHAIN/llvm-strip" "$DEST/$ABI/libplink.so" "$DEST/$ABI/libputtypty.so"
done
mkdir -p "$ROOT/apps/putty-android/app/src/main/assets"
cp "$SOURCE/LICENCE" "$ROOT/apps/putty-android/app/src/main/assets/PUTTY-LICENCE.txt"
cp "$ROOT/build/putty-android/source-receipt.json" "$ROOT/apps/putty-android/app/src/main/assets/putty-source.json"
