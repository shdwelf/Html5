import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("embedded keepsake QR codes match their direct links", () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["scripts/build-greeran-family-qr.mjs"], {
      cwd: root,
      stdio: "pipe",
    });
  });
});
