import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { test } from "node:test";
import { PUBLIC_CORPUS_EXCLUDED_SOURCES } from "../tools/wikiinajar/public-corpus-policy.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const fixture = read("apps/html5-offline-launcher/app/src/androidTest/assets/openpgp-recovery-smoke.js");
const instrumentation = read("apps/html5-offline-launcher/app/src/androidTest/java/org/arena/html5launcher/RecoveryWebViewSmokeTest.java");
const runner = read("scripts/test-html5-android-webview.sh");
const reporter = read("scripts/report-html5-android-runner.py");
const workflow = read(".github/workflows/html5-offline-launcher-build.yml");
const browser = read("tests/html5-android-recovery-browser.mjs");

test("test-APK fixture parses and generates only fresh synthetic material without storing, fetching or logging secrets", () => {
  assert.doesNotThrow(() => new Script(fixture));
  assert.match(fixture, /await import\("openpgp"\)/);
  assert.match(fixture, /await pgp\.generateKey/);
  assert.match(fixture, /v6Keys: true, aeadProtect: true/);
  assert.match(fixture, /mode === "slow" \? 224 : 96/);
  assert.equal((16 + (224 & 15)) * 2 ** ((224 >> 4) + 6), 16 * 1024 * 1024, "synthetic S2K hash-input allocation is bounded");
  assert.doesNotMatch(fixture, /-----BEGIN PGP|console\.|fetch\(|XMLHttpRequest|localStorage\.setItem|sessionStorage\.setItem|\.download\s*=/);
  assert.match(fixture, /noPersistence: localStorage\.length === 0 && sessionStorage\.length === 0/);
  const activity = read("apps/html5-offline-launcher/app/src/main/java/org/arena/html5launcher/MainActivity.java");
  assert.doesNotMatch(activity, /__androidRecoverySmoke|openpgp-recovery-smoke/);
});

test("worker observations preserve actual module construction, messages and native termination rather than faking replies", () => {
  assert.match(fixture, /class ObservedWorker extends NativeWorker/);
  assert.match(fixture, /super\(url, options\)/);
  assert.match(fixture, /return super\.postMessage\(message, \.\.\.transfer\)/);
  assert.match(fixture, /return super\.terminate\(\)/);
  assert.doesNotMatch(fixture, /onmessage\s*=|dispatchEvent\(new MessageEvent|decryptKey\s*=|WorkerClass\s*:/);
  assert.match(browser, /workercreated/); assert.match(browser, /workerdestroyed/);
  assert.match(browser, /Every actual recovery worker must be destroyed within 10 seconds/);
  assert.match(browser, /workers\.length, state\.records\.length/);
  assert.match(browser, /destroyed\.has\(worker\)/);
});

test("three bounded public-APK cases require exact v4/v6 success, zero-attempt refusal, no-match and all actual Stop/Clear controls", () => {
  assert.equal((instrumentation.match(/@Test\(timeout = 120000\)/g) || []).length, 3);
  for (const method of [
    "exactV4AndV6CandidatesRecoverAllSecretPacketsInRealLocalModuleWorkers",
    "unsupportedKeysAreRefusedBeforeAttemptsAndBoundedNoMatchIsNotSuccess",
    "stopAndBothClearControlsTerminateActualInFlightExpensiveWorkers",
  ]) assert.ok(instrumentation.includes(`void ${method}()`), method);
  assert.match(instrumentation, /assertFalse\([^\n]*BuildConfig\.NETWORK_ENABLED\)/);
  assert.match(instrumentation, /WebViewTestInput\.tapElement\(instrumentation, web, id\)/);
  assert.match(instrumentation, /"recovery-stop", "recovery-clear", "clear-all"/);
  assert.match(instrumentation, /snapshot\(\)\.attempts >= 1 && __androidRecoverySmoke\.snapshot\(\)\.live === 1/);
  assert.match(instrumentation, /Exact candidate #2 unlocked and validated all 2/);
  assert.match(instrumentation, /bounded plan is exhausted, not all possible passphrases/);
  assert.match(instrumentation, /"public", "unprotected", "argon2"/);
  assert.match(instrumentation, /assertEquals\(0, refused\.getInt\("attempts"\)\)/);
  assert.match(instrumentation, /fingerprint mismatch must never create a guessing worker/);
  assert.match(instrumentation, /terminated workers must not deliver late progress\/matches/);
  assert.doesNotMatch(instrumentation, /@Ignore|Assume\.|assumeTrue|requestSubmit\(|\.click\(\)/);
});

test("busy recovery progress cannot force an idle wait or bypass actual foreground/focus/touchscreen fences", () => {
  const gestures = read("apps/html5-offline-launcher/app/src/androidTest/java/org/arena/html5launcher/WebViewTestInput.java");
  const busyStart = gestures.indexOf("static void tapBusyElement(");
  const busyEnd = gestures.indexOf("private static void tapVisibleElement(");
  assert.ok(busyStart > 0 && busyEnd > busyStart);
  const busy = gestures.slice(busyStart, busyEnd);
  assert.match(busy, /web\.isShown\(\) && web\.hasWindowFocus\(\)/);
  assert.match(busy, /activeWindowPackage\(instrumentation\)/);
  assert.match(gestures, /getUiAutomation\(\)\.getRootInActiveWindow\(\)/);
  assert.match(gestures, /if \(root == null\) return ""/);
  assert.match(gestures, /if \(!root\.refresh\(\)\) return ""/);
  assert.match(gestures, /root\.getPackageName\(\)/);
  assert.match(busy, /targetPackage\.equals\(currentPackage\)/);
  assert.match(busy, /SystemClock\.uptimeMillis\(\) \+ 15000/);
  assert.match(gestures, /targetPackage\.equals\(device\.getCurrentPackageName\(\)\)/);
  assert.equal((gestures.match(/tapVisibleElement\(instrumentation, web, id\)/g) || []).length, 2);
  assert.match(instrumentation, /WebViewTestInput\.tapBusyElement\(instrumentation, web, action\)/);
  assert.match(gestures, /visible\.contains\(Math\.round\(x\), Math\.round\(y\)\)/);
  assert.match(gestures, /InputDevice\.SOURCE_TOUCHSCREEN/);
  assert.match(gestures, /instrumentation\.sendPointerSync\(down\)/);
  assert.match(gestures, /instrumentation\.sendPointerSync\(up\)/);
  assert.doesNotMatch(busy, /device\.getCurrentPackageName\(|waitForIdle\(|setWaitForIdleTimeout\(|\.click\(\)/);
});

test("recovery adds a separate mandatory three-case phase without removing or lengthening the original 14 cases", () => {
  const lines = runner.split("\n").filter((line) => line.startsWith("run_tests "));
  assert.equal(lines.length, 5);
  for (const original of [
    "run_tests public-local-files 3m :app:connectedPublicDebugAndroidTest org.arena.html5launcher.LocalFileExportSmokeTest",
    "run_tests network-local-files 3m :app:connectedNetworkDebugAndroidTest org.arena.html5launcher.LocalFileExportSmokeTest",
    "run_tests public-audio-policy 2m :app:connectedPublicDebugAndroidTest 'org.arena.html5launcher.OfflineWebViewSmokeTest#microphoneCaptureWorksOnlyForAncOriginAndAudioResource'",
    "run_tests public-headline-harry 2m :app:connectedPublicDebugAndroidTest 'org.arena.html5launcher.OfflineWebViewSmokeTest#headlineHarryStartControlBootsBundledDosProgramInAndroidWebView'",
  ]) assert.ok(lines.includes(original), original);
  assert.ok(lines.includes("run_tests public-openpgp-recovery 3m :app:connectedPublicDebugAndroidTest org.arena.html5launcher.RecoveryWebViewSmokeTest"));
  assert.ok(runner.indexOf("run_tests public-openpgp-recovery") < runner.indexOf("run_tests public-headline-harry"));
  for (const [phase, count] of Object.entries({ "public-local-files": 6, "network-local-files": 6, "public-openpgp-recovery": 3, "public-audio-policy": 1, "public-headline-harry": 1 })) {
    assert.ok(reporter.includes(`"${phase}": ${count}`)); assert.ok(workflow.includes(`"${phase}"`));
  }
  assert.match(reporter, /17 passed, zero failed\/skipped, all exits zero/);
  assert.match(workflow, /timeout-minutes: 20/);
  assert.match(workflow, /-gpu swangle -skin 720x1280 -memory 2048 -cores 2/);
});

test("CI requires the same fixture in Chromium, checks test-APK-only packaging and retains exact-result completion", () => {
  assert.equal(workflow.split("- 'tests/html5-android-recovery*'").length - 1, 2);
  assert.match(workflow, /node --test [^\n]*tests\/html5-android-recovery\.test\.mjs/);
  assert.match(workflow, /REQUIRE_OPENPGP_BROWSER=1 node tests\/html5-android-recovery-browser\.mjs/);
  assert.match(browser, /process\.env\.REQUIRE_OPENPGP_BROWSER === "1"/);
  assert.match(browser, /androidTest\/assets\/openpgp-recovery-smoke\.js/);
  assert.match(workflow, /Verify synthetic recovery harness is confined to test APKs/);
  assert.match(workflow, /Synthetic recovery fixture leaked into a production APK/);
  assert.match(workflow, /Synthetic recovery fixture missing or stale in test APK/);
  assert.match(workflow, /report-html5-android-runner\.py --require-complete/);
});

test("Android recovery operational evidence stays excluded from public offline manual corpora", () => {
  const path = "docs/openpgp-android-recovery-2026-11-17.md";
  assert.ok(PUBLIC_CORPUS_EXCLUDED_SOURCES.includes(path));
  const report = read(path);
  assert.match(report, /17 passed \/ 0 failed \/ 0 skipped \/ all five exits zero/);
  assert.match(report, /No owner key\/passphrase was requested/);
  assert.match(report, /not compilation/);
});
