import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("Drive ciphertext transport checks chunk state, exact release/recipient/digests, HTTPS sessions and rejects redirects without live network access", () => {
  const result = spawnSync("python3", [fileURLToPath(new URL("./drive-backup-upload.py", import.meta.url))], { encoding: "utf8", timeout: 15000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Ran 6 tests/);
  assert.match(result.stderr, /\bOK\b/);
});

test("Drive handoff is opt-in dispatch-only with a scoped secret; no account token, credential output or plaintext upload path", () => {
  const source = readFileSync(new URL("../scripts/upload-encrypted-drive-backups.py", import.meta.url), "utf8");
  assert.match(source, /os\.environ\.pop\("DRIVE_UPLOAD_SESSIONS_JSON"\)/);
  assert.doesNotMatch(source, /print\([^\n]*(?:sessionUri|\buri\b)|Authorization["']\s*:/);
  const workflow = readFileSync(new URL("../.github/workflows/html5-offline-launcher-build.yml", import.meta.url), "utf8");
  const start = workflow.indexOf("- name: Upload ciphertext to one-time Drive sessions");
  assert.ok(start >= 0);
  const step = workflow.slice(start, workflow.indexOf("- name: Report public APK", start));
  assert.match(step, /github\.event_name == 'workflow_dispatch' && inputs\.upload_to_drive/);
  assert.match(step, /secrets\.HTML5_RELEASE_UPLOAD_SESSIONS/);
  assert.match(step, /ENCRYPTED_APK_DIRECTORY:.*encrypted-apks/);
  assert.doesNotMatch(step, /outputs\/apk|PRIVATE KEY|--decrypt|contents: write/);
});


test("manual Actions encryption keeps all three builds and exposes an explicit v4/v6 recipient profile without automatic prompting or downgrade", () => {
  const workflow = readFileSync(new URL("../.github/workflows/html5-offline-launcher-build.yml", import.meta.url), "utf8");
  assert.match(workflow, /recipient_profile:[\s\S]*?type: choice[\s\S]*?- classic-v4[\s\S]*?- modern-v6/);
  assert.match(workflow, /40-hex v4 or 64-hex v6/);
  assert.match(workflow, /for profile in public network private/);
  assert.match(workflow, /--profile "\$RECIPIENT_PROFILE"/);
  assert.match(workflow, /classic-v4\) \[\[ \$\{#RECIPIENT_FINGERPRINT\} == 40 \]\]/);
  assert.match(workflow, /modern-v6\) \[\[ \$\{#RECIPIENT_FINGERPRINT\} == 64 \]\]/);
  for (const profile of ["Public", "Private", "Network"]) assert.ok(workflow.includes(`:app:assemble${profile}Debug`));
});
