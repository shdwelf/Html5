import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateRecipientInputs } from "../scripts/validate-html5-recipient-inputs.mjs";

// Shape fixtures only, deliberately not valid certificates. The release
// encryption tests independently require real key parsing and exact identity.
const PUBLIC = "-----BEGIN PGP PUBLIC KEY BLOCK-----\nsynthetic-shape-fixture-only\n-----END PGP PUBLIC KEY BLOCK-----";
const V4 = "A".repeat(40), V6 = "B".repeat(64);
const paired = (extra = {}) => ({ RECIPIENT_PUBLIC_KEY: PUBLIC, RECIPIENT_FINGERPRINT: V4, ...extra });
const script = new URL("../scripts/validate-html5-recipient-inputs.mjs", import.meta.url);
function cli(input = {}) {
  const env = { ...process.env };
  for (const name of ["RECIPIENT_PUBLIC_KEY", "RECIPIENT_FINGERPRINT", "RECIPIENT_PROFILE", "UPLOAD_TO_DRIVE"]) delete env[name];
  return spawnSync(process.execPath, [script.pathname], { env: { ...env, ...input }, encoding: "utf8", timeout: 10000 });
}

test("ordinary push/PR/empty dispatch needs no recipient and never requests plaintext private export", () => {
  assert.deepEqual(validateRecipientInputs({}), { recipient: false, profile: "classic-v4", uploadToDrive: false });
  assert.equal(validateRecipientInputs({ RECIPIENT_PROFILE: "modern-v6" }).recipient, false);
  const result = cli();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No recipient requested/);
  assert.match(result.stdout, /private plaintext is never uploaded/);
  assert.doesNotMatch(result.stdout + result.stderr, /::error/);
});

test("v4 default and explicit v6 routing accept only their full fingerprint lengths without changing values", () => {
  assert.deepEqual(validateRecipientInputs(paired()), { recipient: true, profile: "classic-v4", uploadToDrive: false });
  const v6 = paired({ RECIPIENT_FINGERPRINT: V6.toLowerCase(), RECIPIENT_PROFILE: "modern-v6" });
  assert.deepEqual(validateRecipientInputs(v6), { recipient: true, profile: "modern-v6", uploadToDrive: false });
  assert.equal(v6.RECIPIENT_FINGERPRINT, V6.toLowerCase());
  const result = cli(v6);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Exact public certificate, encryption key and ciphertext checks remain mandatory/);
  assert.ok(!result.stdout.includes(PUBLIC) && !result.stdout.includes(V6.toLowerCase()));
});

test("one missing recipient field and short/spaced/nonhex fingerprints fail with actionable static messages", () => {
  for (const input of [{ RECIPIENT_PUBLIC_KEY: PUBLIC }, { RECIPIENT_FINGERPRINT: V4 }]) {
    assert.throws(() => validateRecipientInputs(input), /Supply BOTH.*leave BOTH empty/);
  }
  for (const fingerprint of ["A".repeat(8), "A".repeat(39), "A".repeat(41), "B".repeat(63), "B".repeat(65), "G".repeat(40), ` ${V4}`, `${V4}\n`, `${V4.slice(0, 20)} ${V4.slice(20)}`, `0x${V4}`]) {
    assert.throws(() => validateRecipientInputs(paired({ RECIPIENT_FINGERPRINT: fingerprint })), /full primary fingerprint/);
  }
});

test("default v4 never silently accepts v6; profile mismatches explain the exact choice without truncating or downgrading", () => {
  assert.throws(() => validateRecipientInputs(paired({ RECIPIENT_FINGERPRINT: V6 })), /64-hex.*recipient_profile modern-v6.*explicitly/);
  assert.throws(() => validateRecipientInputs(paired({ RECIPIENT_PROFILE: "modern-v6" })), /40-hex.*recipient_profile classic-v4.*not pad or truncate/);
  assert.throws(() => validateRecipientInputs(paired({ RECIPIENT_PROFILE: "automatic" })), /No encryption profile is inferred or downgraded/);
});

test("private armor, multiple blocks, outside material and oversized public inputs are rejected before dependency/build work", () => {
  for (const key of [PUBLIC.replaceAll("PUBLIC KEY", "PRIVATE KEY"), `${PUBLIC}\n${PUBLIC}`, `outside\n${PUBLIC}`, `${PUBLIC}\ntrailing`, "not armored", PUBLIC.replace("synthetic-shape-fixture-only", "x".repeat(1024 * 1024))]) {
    assert.throws(() => validateRecipientInputs(paired({ RECIPIENT_PUBLIC_KEY: key })), /exactly one ASCII-armored PUBLIC KEY BLOCK/);
  }
  assert.equal(validateRecipientInputs(paired({ RECIPIENT_PUBLIC_KEY: `\r\n${PUBLIC.replaceAll("\n", "\r\n")}\r\n` })).recipient, true);
});

test("Drive remains explicit ciphertext-only recipient dispatch: false/absent does not upload and true needs both fields", () => {
  assert.throws(() => validateRecipientInputs({ UPLOAD_TO_DRIVE: "true" }), /Drive handoff requires both/);
  assert.throws(() => validateRecipientInputs(paired({ UPLOAD_TO_DRIVE: "yes" })), /explicit true\/false/);
  assert.equal(validateRecipientInputs(paired({ UPLOAD_TO_DRIVE: "false" })).uploadToDrive, false);
  assert.equal(validateRecipientInputs(paired({ UPLOAD_TO_DRIVE: "true" })).uploadToDrive, true);
});

test("CLI preserves nonzero refusal and annotates a reason without exposing supplied values or injected workflow commands", () => {
  const marker = "sensitive-input-marker\n::notice title=untrusted::never execute";
  for (const input of [
    paired({ RECIPIENT_PUBLIC_KEY: marker }),
    paired({ RECIPIENT_FINGERPRINT: marker }),
    paired({ RECIPIENT_PROFILE: marker }),
    paired({ UPLOAD_TO_DRIVE: marker }),
  ]) {
    const result = cli(input);
    assert.equal(result.status, 1, result.stdout);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /^::error title=Android-recipient-inputs::[^\r\n]+\n$/);
    assert.doesNotMatch(result.stderr, /sensitive-input-marker|::notice|synthetic-shape-fixture-only/);
  }
});

test("workflow invokes the tested preflight before compilation and retains encryption/identity/complete-device gates", () => {
  const workflow = readFileSync(new URL("../.github/workflows/html5-offline-launcher-build.yml", import.meta.url), "utf8");
  assert.equal(workflow.split("- 'scripts/validate-html5-recipient-inputs.mjs'").length - 1, 2);
  assert.equal(workflow.split("- 'tests/html5-recipient-inputs.test.mjs'").length - 1, 2);
  assert.ok(workflow.indexOf("run: node scripts/validate-html5-recipient-inputs.mjs") < workflow.indexOf("- name: Install locked OpenPGP"));
  assert.match(workflow, /node --test [^\n]*tests\/html5-recipient-inputs\.test\.mjs/);
  assert.match(workflow, /RECIPIENT_PUBLIC_KEY: \$\{\{ inputs\.recipient_public_key \}\}/);
  assert.match(workflow, /--expected-fingerprint "\$RECIPIENT_FINGERPRINT"/);
  assert.match(workflow, /--profile "\$RECIPIENT_PROFILE"/);
  assert.match(workflow, /if: \$\{\{ inputs\.recipient_public_key == '' \}\}/);
  assert.match(workflow, /report-html5-android-runner\.py --require-complete/);
  assert.doesNotMatch(workflow, /continue-on-error:/);
});
