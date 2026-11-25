import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DROPBOX_APK_LIMIT_BYTES = 100_000_000;

async function sha256File(filePath) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return digest.digest("hex");
}

export async function verifyApkBackup(
  apkPath,
  { maxBytes = DROPBOX_APK_LIMIT_BYTES, checksumLabel = apkPath } = {},
) {
  const info = await stat(apkPath);
  if (!info.isFile() || info.size === 0) {
    throw new Error(`APK backup must be a non-empty regular file: ${apkPath}`);
  }
  if (info.size > maxBytes) {
    throw new Error(`APK exceeds the ${maxBytes}-byte per-file backup limit: ${apkPath} (${info.size} bytes)`);
  }

  const checksumPath = `${apkPath}.sha256`;
  const checksum = await readFile(checksumPath, "utf8");
  const expectedLine = `${await sha256File(apkPath)}  ${checksumLabel}\n`;
  if (checksum !== expectedLine) {
    throw new Error(`APK SHA-256 sidecar is missing, malformed, stale, or names a different path: ${checksumPath}`);
  }
  return { bytes: info.size, sha256: expectedLine.slice(0, 64) };
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const profile of ["public", "network"]) {
    const apkPath = path.join(
      repoRoot,
      "apps",
      "html5-offline-launcher",
      "app",
      "build",
      "outputs",
      "apk",
      profile,
      "debug",
      `app-${profile}-debug.apk`,
    );
    const result = await verifyApkBackup(apkPath, {
      checksumLabel: path.relative(repoRoot, apkPath),
    });
    console.log(`${profile}: ${result.bytes} bytes; SHA-256 ${result.sha256}; within Dropbox per-file limit`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
