import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jvmDir = path.join(root, "jvm");

/**
 * cfjvm is a from-scratch Java class-file interpreter written to test a claim
 * in docs/xport-pro-synchronet-fit.md: that no JVM can run on the xPort Pro's
 * MMU-less ColdFire uClinux. The verification is DIFFERENTIAL - the same .class
 * files run on the real JDK and under cfjvm and the outputs must be
 * byte-identical - so the expected values come from Java itself and cannot
 * drift.
 */

function findJavac() {
  if (process.env.JAVA_HOME && existsSync(path.join(process.env.JAVA_HOME, "bin", "javac"))) {
    return path.join(process.env.JAVA_HOME, "bin", "javac");
  }
  const caches = [
    path.join(root, ".cache", "jdk", "adopt", "tool", "software", "zulu_jdks"),
    path.join(root, ".cache", "applet-toolchain"),
  ];
  for (const cache of caches) {
    if (!existsSync(cache)) continue;
    for (const d of readdirSync(cache).sort()) {
      const p = path.join(cache, d, "bin", "javac");
      if (existsSync(p)) return p;
    }
  }
  const onPath = spawnSync("command", ["-v", "javac"], { encoding: "utf8" });
  return onPath.stdout?.trim() || null;
}

test("cfjvm compiles under -Wall -Wextra -Werror", () => {
  const r = spawnSync("make", ["-C", jvmDir, "build/cfjvm"], { encoding: "utf8" });
  assert.equal(r.status, 0, `build failed:\n${r.stdout}\n${r.stderr}`);
  assert.ok(existsSync(path.join(jvmDir, "build", "cfjvm")), "cfjvm binary was not produced");
});

test("cfjvm output is byte-identical to the reference JDK", (t) => {
  const javac = findJavac();
  if (!javac) {
    // Reported as a skip, never as a pass: without a reference implementation
    // there is nothing to diff against.
    t.skip("no javac available (set JAVA_HOME or populate .cache/jdk); differential test cannot run");
    return;
  }
  const r = spawnSync("make", ["-C", jvmDir, "test"], { encoding: "utf8", env: process.env });
  if (r.status !== 0) {
    assert.fail(`differential test failed:\n${r.stdout}\n${r.stderr}`);
  }
  assert.match(r.stdout, /OK - cfjvm output is byte-identical to the JDK \(\d+ lines\)/);
  const lines = Number(r.stdout.match(/\((\d+) lines\)/)[1]);
  // Guard against the test quietly degenerating into a comparison of nothing.
  assert.ok(lines >= 30, `only ${lines} lines compared; the smoke test looks truncated`);
});

test("the reference output covers the features the interpreter claims", (t) => {
  const expected = path.join(jvmDir, "build", "expected.txt");
  if (!existsSync(expected)) {
    t.skip("run `make -C jvm test` first to generate the reference output");
    return;
  }
  const out = readFileSync(expected, "utf8");
  // Each of these pins a behaviour that a broken opcode would change.
  const checks = [
    ["long multiply across the 32-bit boundary", "3703703670369"],
    ["int overflow wraps rather than saturating", "-2147483647"],
    ["short conversion sign-extends", "-25536"],
    ["byte conversion sign-extends", "-56"],
    ["tableswitch dispatch", "zero two many"],
    ["lookupswitch dispatch", "five thousand other seventy thousand"],
    ["virtual dispatch picks the subclass", "derived 3 7"],
    ["and the superclass when not overridden", "base 9"],
    ["StringBuilder accumulation", "0-1-2- len=6"],
    ["static field mutation persists", "15"],
    ["command-line arguments arrive", "arg2=three"],
  ];
  for (const [what, needle] of checks) {
    assert.ok(out.includes(needle), `${what}: expected to find ${JSON.stringify(needle)}`);
  }
});

test("cfjvm refuses input it cannot handle rather than inventing an answer", (t) => {
  const bin = path.join(jvmDir, "build", "cfjvm");
  if (!existsSync(bin)) {
    t.skip("cfjvm is not built");
    return;
  }
  // A non-class file must be rejected on its magic number, not interpreted.
  const dir = mkdtempSync(path.join(os.tmpdir(), "cfjvm-"));
  const bad = path.join(dir, "NotAClass.class");
  writeFileSync(bad, Buffer.from("this is not a class file at all"));
  const r = spawnSync(bin, [bad], { encoding: "utf8" });
  assert.notEqual(r.status, 0, "a non-class file must not be accepted");
  assert.match(r.stderr, /bad magic/);
});
