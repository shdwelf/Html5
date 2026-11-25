/** Bounded synthetic-test CI evidence; never uploads a key, TAP log or fixture. */
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function nativeTapResult(tap) {
  assert.equal(typeof tap, "string");
  const count = (name) => {
    const matches = [...tap.matchAll(new RegExp(`^# ${name} (\\d+)$`, "gm"))];
    assert.equal(matches.length, 1, `one complete TAP ${name} total is required`);
    return Number(matches[0][1]);
  };
  const result = { schema: 1, tests: count("tests"), passed: count("pass"), failed: count("fail"), skipped: count("skipped"), firstFailure: /^not ok \d+ - (.+)$/m.exec(tap)?.[1].slice(0, 400) || null };
  assert.equal(result.tests, result.passed + result.failed + result.skipped, "incomplete/cancelled native results cannot become success");
  return { ...result, success: result.tests === 4 && result.passed === 4 && result.failed === 0 && result.skipped === 0 && result.firstFailure === null };
}
export const escapeAnnotation = (text) => text.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 3);
    assert.ok(statSync(process.argv[2]).size <= 8 * 1024 * 1024, "synthetic TAP evidence exceeds its bound");
    const result = nativeTapResult(readFileSync(process.argv[2], "utf8"));
    console.log(`::notice title=OpenPGP-v6-native-results::${escapeAnnotation(JSON.stringify(result))}`);
    if (!result.success) {
      console.log(`::error title=OpenPGP-v6-native-failure::${escapeAnnotation(result.firstFailure || "All four independent native cases must pass with zero skips.")}`);
      process.exitCode = 1;
    }
  } catch {
    console.log("::error title=OpenPGP-v6-native-results::Missing, oversized or incomplete native test evidence; no success is claimed.");
    process.exitCode = 1;
  }
}
