import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { unzipSync } from "../vendor/fflate/index.mjs";
import { PUBLIC_CORPUS_EXCLUDED_ASSETS, PUBLIC_CORPUS_EXCLUDED_SOURCES } from "../tools/wikiinajar/public-corpus-policy.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const text = (path) => read(path).toString("utf8");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receipt = JSON.parse(text("research/putty-android/build-receipt.json"));
const apk = read(`research/putty-android/${receipt.apk}`);
const entries = unzipSync(apk);
const evidence = JSON.parse(text("docs/research/putty-sdf-free-shell-sources-2026-11-17.json"));

test("delivered PuTTY APK exact bytes and SHA-256 match the build receipt and checksum file", () => {
  assert.equal(receipt.status, "built-apk-with-synthetic-android-integration-controls");
  assert.equal(apk.byteLength, receipt.apkBytes);
  assert.equal(sha(apk), receipt.apkSha256);
  assert.equal(text("research/putty-android/SHA256SUMS.txt"), `${receipt.apkSha256}  ${receipt.apk}\n`);
  assert.match(receipt.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(receipt.buildRun, /^https:\/\/github\.com\/shdwelf\/Html5\/actions\/runs\/\d+$/);
  assert.equal(receipt.androidDebuggable, false);
  assert.deepEqual(receipt.permissions, ["android.permission.INTERNET"]);
});

test("APK bundles the source receipt, original MIT licence and no different SSH engine", () => {
  assert.deepEqual(JSON.parse(Buffer.from(entries["assets/putty-source.json"]).toString()), receipt.source);
  assert.equal(receipt.source.version, "0.85");
  assert.equal(receipt.source.archiveSha256, "13fd4db2936d03b73812a7bcc2a658e4dd29cc776a56c3670a7fc6f1a0ee8af8");
  assert.equal(receipt.source.releaseCertificateFingerprint, "1A07DAC0F220CF12248EA7195C67D0F88BC3E5B5");
  assert.equal(receipt.source.releaseSignatureVerified, true);
  assert.equal(Buffer.from(entries["assets/PUTTY-LICENCE.txt"]).toString(), text("research/putty-android/PUTTY-LICENCE.txt"));
  assert.match(text("research/putty-android/PUTTY-LICENCE.txt"), /PuTTY is copyright 1997-2026 Simon Tatham/);
  assert.match(text("research/putty-android/PUTTY-LICENCE.txt"), /Permission is hereby granted, free of charge/);
  assert.ok(entries["classes.dex"] && entries["AndroidManifest.xml"]);
  assert.ok(!Object.keys(entries).some((name) => /jsch|russh|xterm|\.keystore$|\.jks$|\.ppk$|\.asc\.key$/i.test(name)));
});

test("packaged real Plink and PTY bridge have exact ABI bytes and 16 KiB ELF alignment", () => {
  assert.equal(receipt.native.length, 4);
  assert.deepEqual(Object.keys(entries).filter((name) => name.startsWith("lib/")).sort(),
    ["lib/arm64-v8a/libplink.so", "lib/arm64-v8a/libputtypty.so", "lib/x86_64/libplink.so", "lib/x86_64/libputtypty.so"]);
  for (const entry of receipt.native) {
    const elf = Buffer.from(entries[`lib/${entry.abi}/${entry.file}`]);
    assert.equal(elf.byteLength, entry.bytes);
    assert.equal(sha(elf), entry.sha256);
    assert.equal(elf.subarray(0, 4).toString(), "\x7fELF");
    assert.equal(elf[4], 2, "ELF64"); assert.equal(elf[5], 1, "little-endian");
    assert.equal(elf.readUInt16LE(16), 3, "ET_DYN (PIE executable or shared bridge)");
    assert.equal(elf.readUInt16LE(18), entry.abi === "arm64-v8a" ? 183 : 62);
    const offset = Number(elf.readBigUInt64LE(32)), size = elf.readUInt16LE(54), count = elf.readUInt16LE(56);
    let loads = 0;
    for (let i = 0; i < count; i++) {
      const header = offset + size * i;
      if (elf.readUInt32LE(header) === 1) {
        loads++;
        assert.ok(elf.readBigUInt64LE(header + 48) >= 16384n, "16 KiB ELF alignment, not a runtime test");
      }
    }
    assert.ok(loads > 0);
    if (entry.file === "libplink.so") assert.ok(elf.includes(Buffer.from("/system/bin/linker64\0")));
  }
});

test("review identity and actual emulator controls are not confused with upstream signing or SDF membership", () => {
  assert.equal(receipt.coreControlsPassed, 96);
  assert.equal(receipt.androidInstrumentedControlsPassed, 8);
  assert.equal(new Set(receipt.androidTests).size, 8);
  for (const suffix of ["wrongHostKeyFailsBeforePasswordPrompt", "trustedSyntheticSshAuthenticatesOverPtyAndRunsLineCommand", "backgroundAndRecreationDoNotRestoreInputOrOutput"])
    assert.ok(receipt.androidTests.some((name) => name.endsWith(suffix)));
  assert.match(receipt.signing, /Disposable.*debug.*not a production/i);
  assert.match(text("research/putty-android/apk-signature.txt"), /Verified using v2 scheme \(APK Signature Scheme v2\): true/);
  assert.ok(text("research/putty-android/apk-signature.txt").includes(receipt.debugCertificateSha256));
  assert.ok(receipt.notVerified.includes("SDF membership validation"));
  assert.ok(receipt.notVerified.includes("ARM64 runtime on a physical device"));
  assert.match(receipt.terminalScope, /line-oriented TERM=dumb/);
});

test("Android manifest and frontend keep network access explicit and credential state unsaved", () => {
  const manifest = text("apps/putty-android/app/src/main/AndroidManifest.xml");
  assert.equal((manifest.match(/<uses-permission /g) || []).length, 1);
  assert.match(manifest, /android.permission.INTERNET/);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.equal((manifest.match(/<activity /g) || []).length, 1);
  assert.doesNotMatch(manifest, /<service|<provider|<receiver|android.intent.action.VIEW/);
  const activity = text("apps/putty-android/app/src/main/java/org/html5/putty/MainActivity.java");
  assert.match(activity, /FLAG_SECURE/);
  assert.match(activity, /setSaveEnabled\(false\)/);
  assert.match(activity, /IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS/);
  assert.match(activity, /foreground = false/);
  assert.doesNotMatch(activity, /SharedPreferences|WebView|loadUrl|ACTION_VIEW|Log\.[idwev]\(/);
  assert.match(text("apps/putty-android/app/src/main/java/org/html5/putty/SessionConfig.java"), /"-hostkey", hostKey, host/);
});

test("SDF domain mismatch and provider availability are explicitly qualified with no public account actions", () => {
  assert.equal(evidence.github.order, "GitHub repository searches were performed before metasearch queries");
  assert.equal(evidence.sdf.linkMismatch.displayed, "freeshell.org");
  assert.equal(evidence.sdf.linkMismatch.suppliedHref, "http://freewheel.org/");
  assert.match(evidence.sdf.linkMismatch.freewheelFinding, /domain-for-sale/);
  assert.equal(Object.values(evidence.accountActions).filter((value) => value === true).length, 0);
  assert.ok(evidence.sdf.notEstablished.some((value) => /basic-validation fee/.test(value)));
  assert.ok(evidence.sdf.notEstablished.some((value) => /SSH host-key/.test(value)));
  const team = evidence.freeShellProviders.find((item) => item.id === "tilde-team");
  assert.match(team.currentAvailabilityCaution, /SSH access is currently disabled/);
  assert.match(team.recommendation, /Hold/);
  assert.match(evidence.freeShellProviders.find((item) => item.id === "freeshell-de").signup, /postcard/);
  assert.match(evidence.freeShellProviders.find((item) => item.id === "blinkenshell").signup, /vouches.*SMS/);
  const backlog = JSON.parse(text("docs/agent-backlog-2026-10-21.json"));
  assert.equal(backlog.tasks.length, 31);
  assert.equal(backlog.tasks.filter((item) => item.status === "done").length, 30);
  assert.deepEqual(backlog.tasks.filter((item) => item.status === "declined").map((item) => item.id), ["T9.3"]);
});

test("new operational shell research is excluded from public offline manuals", () => {
  for (const path of ["docs/putty-android-sdf-free-shell-investigation-2026-11-17.md", "docs/backlog-execution-round-94-2026-11-17.md"])
    assert.ok(PUBLIC_CORPUS_EXCLUDED_SOURCES.includes(path));
  assert.ok(PUBLIC_CORPUS_EXCLUDED_ASSETS.includes("docs/research/putty-sdf-free-shell-sources-2026-11-17.json"));
});

test("bounded CI error annotations preserve failure, escape log data and redact password values", () => {
  const wrapper = new URL("../tools/putty-android/run-checked.py", import.meta.url);
  const result = spawnSync("python3", [wrapper.pathname, "synthetic", "python3", "-c", "print('50% synthetic-password-123\\n::notice title=bad::untrusted'); raise SystemExit(23)"], {
    encoding: "utf8", timeout: 10000, env: { ...process.env, CI_SSH_PASSWORD: "synthetic-password-123" },
  });
  assert.equal(result.status, 23);
  const annotation = result.stdout.split("\n").find((line) => line.startsWith("::error "));
  assert.ok(annotation);
  assert.match(annotation, /50%25 \[REDACTED\]%0A::notice/);
  assert.ok(!annotation.includes("synthetic-password-123"));
  assert.ok(annotation.length < 12000);
});
