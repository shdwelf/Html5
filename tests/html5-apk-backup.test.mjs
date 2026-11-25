import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { DROPBOX_APK_LIMIT_BYTES, verifyApkBackup } from "../scripts/verify-html5-apk-backup.mjs";

async function fixture(t, content) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "html5-apk-backup-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const apkPath = path.join(directory, "app-public-debug.apk");
  await writeFile(apkPath, content);
  const digest = createHash("sha256").update(content).digest("hex");
  await writeFile(`${apkPath}.sha256`, `${digest}  ${apkPath}\n`);
  return apkPath;
}

test("APK backup verification accepts a valid APK and matching checksum under the Dropbox cap", async (t) => {
  const apkPath = await fixture(t, Buffer.from("synthetic APK fixture"));
  const result = await verifyApkBackup(apkPath);
  assert.equal(result.bytes, Buffer.byteLength("synthetic APK fixture"));
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
});

test("APK backup verification matches the repository-relative sha256sum label used by CI", async (t) => {
  const apkPath = await fixture(t, Buffer.from("synthetic APK fixture"));
  const label = "apps/html5-offline-launcher/app/build/outputs/apk/public/debug/app-public-debug.apk";
  const digest = createHash("sha256").update("synthetic APK fixture").digest("hex");
  await writeFile(`${apkPath}.sha256`, `${digest}  ${label}\n`);
  assert.equal((await verifyApkBackup(apkPath, { checksumLabel: label })).sha256, digest);
});

test("APK backup cap is inclusive at the exact byte limit", async (t) => {
  const apkPath = await fixture(t, Buffer.from("12345"));
  assert.equal((await verifyApkBackup(apkPath, { maxBytes: 5 })).bytes, 5);
  await assert.rejects(verifyApkBackup(apkPath, { maxBytes: 4 }), /exceeds the 4-byte per-file backup limit/);
});

test("the production per-file cap is 100 decimal megabytes", () => {
  assert.equal(DROPBOX_APK_LIMIT_BYTES, 100_000_000);
});

test("APK backup verification rejects stale checksum sidecars", async (t) => {
  const apkPath = await fixture(t, Buffer.from("synthetic APK fixture"));
  await writeFile(`${apkPath}.sha256`, `${"0".repeat(64)}  ${apkPath}\n`);
  await assert.rejects(verifyApkBackup(apkPath), /sidecar is missing, malformed, stale/);
});

test("APK backup verification rejects sidecars that name another file", async (t) => {
  const apkPath = await fixture(t, Buffer.from("synthetic APK fixture"));
  const digest = createHash("sha256").update("synthetic APK fixture").digest("hex");
  await writeFile(`${apkPath}.sha256`, `${digest}  another.apk\n`);
  await assert.rejects(verifyApkBackup(apkPath), /sidecar is missing, malformed, stale/);
});
