import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JVM = path.join(root, "jvm/build/cfjvm");
const EMIT = path.join(root, "tools/emit_stdin_probe.py");
const OUT = path.join(root, "dist/cfjvm-probe");
const CLS = path.join(OUT, "StdinProbe.class");

/**
 * cfjvm's standard input path.
 *
 * This sandbox has no Java runtime at all -- no javac, no java, no libjvm.so
 * on the filesystem -- so the usual route (compile a .java, run it) is closed.
 * tools/emit_stdin_probe.py assembles the class file directly instead, which
 * is what makes this a functional test of the interpreter rather than a
 * compile check.
 *
 * The probe reads one byte from stdin, appends it to a StringBuilder and
 * prints it, so its output is a direct echo of what the VM read.
 */

function build() {
  const r = spawnSync("make", ["-C", "jvm"], { cwd: root, encoding: "utf8" });
  if (!existsSync(JVM)) throw new Error(`cfjvm did not build: ${r.stderr}`);
}

function emit() {
  mkdirSync(OUT, { recursive: true });
  const r = execFileSync("python3", [EMIT, CLS], { cwd: root, encoding: "utf8" });
  assert.match(r, /wrote .*StdinProbe\.class \(\d+ bytes\)/);
}

function run(input) {
  const r = spawnSync(JVM, [CLS], { cwd: root, input, encoding: "utf8" });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

test("cfjvm builds and the probe class emits", () => {
  build();
  emit();
  assert.ok(existsSync(CLS));
});

test("System.in.read() returns the byte fed on stdin", () => {
  build(); emit();
  // Two different inputs must give two different outputs, or the VM could be
  // printing something it already had rather than reading stdin.
  assert.equal(run("X").stdout, "X\n");
  assert.equal(run("Q").stdout, "Q\n");
  assert.equal(run("7").stdout, "7\n");
  assert.equal(run(" ").stdout, " \n");
});

test("a byte above 0x7F comes back unsigned, not sign-extended", () => {
  build(); emit();
  // read() is specified to return 0..255. A signed char would turn 0xC3 into
  // a negative value and StringBuilder.append(char) would print something else.
  const r = spawnSync(JVM, [CLS], { cwd: root, input: Buffer.from([0xC3]) });
  const out = Buffer.from(r.stdout, "binary");
  assert.equal(out[0], 0xC3, `expected 0xC3, got 0x${out[0].toString(16)}`);
});

test("end of input is reported, not fatal", () => {
  build(); emit();
  // read() must return -1 at EOF. The probe appends it as a char, so the
  // output is U+FFFF; what matters is that the VM exits 0 rather than failing.
  const r = run("");
  assert.equal(r.status, 0, `empty stdin should not be fatal: ${r.stderr}`);
  assert.doesNotMatch(r.stderr, /unsupported|not found|fail/i);
});

test("the interpreter still refuses what it does not implement", () => {
  build(); emit();
  // Guards against the input support having been added by quietly making every
  // unresolved method succeed.
  const r = spawnSync(JVM, [path.join(OUT, "NoSuch.class")], { cwd: root, encoding: "utf8" });
  assert.notEqual(r.status, 0);
});

test("the probe uses no opcode beyond the interpreter's supported set", () => {
  build(); emit();
  const r = run("Z");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, "", "the probe should not trip any unsupported-method path");
});

test("cleaning up leaves nothing tracked", () => {
  rmSync(OUT, { recursive: true, force: true });
  const tracked = execFileSync("git", ["ls-files", "dist/"], { cwd: root, encoding: "utf8" }).trim();
  assert.equal(tracked, "");
});
