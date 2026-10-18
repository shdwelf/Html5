import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = path.join(root, "tools", "jvm-requirements.mjs");
const FIX = path.join(root, "dist", "jvm-req-fixtures");

/**
 * Requirements analysis for "can this Java server run on a given JVM?"
 *
 * The regression tests here exist because the first version of the tool got
 * both of these wrong, in the same direction, twice. It reported cfjvm as
 * supporting invokedynamic because cfjvm.c contains the comment "no support
 * for invokedynamic", and it reported a 2005-era telnet daemon as using Java
 * method references because 29 of its log messages read
 * "readNEVariables()::NE_IN_ERROR". Both are text-matching bugs that made the
 * verdict look more permissive than the truth.
 */

function run(args, opts = {}) {
  try {
    const stdout = execFileSync(process.execPath, [TOOL, ...args], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    return { status: e.status, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

function fixture(name, body) {
  const dir = path.join(FIX, name);
  mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, "Probe.java");
  writeFileSync(fp, body);
  return path.relative(root, dir);
}

/** A fake JVM whose C source mentions a capability only in a disclaimer. */
function fakeJvm(name, body) {
  const fp = path.join(FIX, name);
  mkdirSync(FIX, { recursive: true });
  writeFileSync(fp, body);
  return path.relative(root, fp);
}

test("cfjvm's implemented class set is read out of its own source", () => {
  const r = run(["--target", "jvm/tests", "--jvm", "jvm/cfjvm.c"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /classes implemented: 9/);
  for (const c of ["java/lang/String", "java/lang/System", "java/io/PrintStream"]) {
    assert.ok(r.stdout.includes(c), `cfjvm class list missing ${c}`);
  }
  // It must not claim anything beyond the class library.
  assert.match(r.stdout, /capabilities: \(none beyond the class library\)/);
});

test("a comment disclaiming a feature does not count as providing it", () => {
  // Regression: cfjvm.c says "no support for invokedynamic" and the first
  // version of the tool read that as support.
  const jvm = fakeJvm("disclaim.c", [
    "/* This JVM has no support for sockets and no threads whatsoever. */",
    '// It does not call socket() and never links pthreads.',
    'static const char *cls[] = { "java/lang/Object" };',
  ].join("\n"));
  const r = run(["--target", "jvm/tests", "--jvm", jvm]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /capabilities: \(none beyond the class library\)/);
});

test("a string literal is not a method reference", () => {
  // Regression: telnetd-x log messages like "readNEVariables()::NE_IN_ERROR"
  // were counted as Java 8 method references in Java 1.4 code.
  const t = fixture("stringlit", [
    "public class Probe {",
    "  void f() { System.out.println(\"readNEVariables()::NE_IN_ERROR\"); }",
    "  void g() { String s = \"a -> b\"; System.out.println(s); }",
    "}",
  ].join("\n"));
  const r = run(["--target", t, "--jvm", "jvm/cfjvm.c"]);
  assert.equal(r.status, 0, "lambdas must not be required: " + r.stdout);
  assert.doesNotMatch(r.stdout, /lambdas/);
});

test("real code that uses the features is still detected", () => {
  const t = fixture("realuse", [
    "import java.net.ServerSocket;",
    "import java.net.Socket;",
    "import java.io.IOException;",
    "public class Probe implements Runnable {",
    "  public void run() {",
    "    try {",
    "      ServerSocket ss = new ServerSocket(6400);",
    "      Socket s = ss.accept();",
    "      synchronized (this) { System.out.println(s); }",
    "    } catch (IOException e) { throw new RuntimeException(e); }",
    "  }",
    "  public static void main(String[] a) { new Thread(new Probe()).start(); }",
    "}",
  ].join("\n"));
  const r = run(["--target", t, "--jvm", "jvm/cfjvm.c"]);
  assert.equal(r.status, 1, "a socket server must be refused: " + r.stdout);
  for (const cap of ["socket-io", "threads", "exceptions", "synchronization"]) {
    assert.match(r.stdout, new RegExp(`\\[MISSING\\] ${cap}`), `${cap} should be MISSING`);
  }
  assert.match(r.stdout, /verdict: CANNOT run/);
});

test("exit status distinguishes can-run from cannot-run", () => {
  const ok = run(["--target", "jvm/tests", "--jvm", "jvm/cfjvm.c"]);
  assert.equal(ok.status, 0);
  const no = run(["--target", fixture("realuse", "public class Probe {}"), "--jvm", "jvm/cfjvm.c"]);
  assert.equal(no.status, 0, "an empty class needs nothing");
  assert.equal(run(["--jvm", "jvm/cfjvm.c"]).status, 2, "no --target is a usage error");
  assert.equal(run(["--target", "dist", "--jvm", "nope.c"]).status, 2, "missing JVM is an error");
});

test("--json is parseable and agrees with the text verdict", () => {
  const r = run(["--target", "jvm/tests", "--jvm", "jvm/cfjvm.c", "--json"]);
  const j = JSON.parse(r.stdout);
  assert.equal(j.jvm.classes.length, 9);
  assert.equal(j.results.length, 1);
  assert.equal(j.results[0].files, 1);
  assert.deepEqual(j.results[0].missing, []);

  const t = fixture("realuse", "public class Probe implements Runnable { public void run() {} }");
  const r2 = run(["--target", t, "--jvm", "jvm/cfjvm.c", "--json"]);
  const j2 = JSON.parse(r2.stdout);
  assert.ok(j2.results[0].missing.includes("threads"));
  assert.equal(r2.status, 1);
});

test("the real abandonware telnet daemon is refused, with the reason given", () => {
  // Only runs if the upstream clone is present; the point is that the verdict
  // comes from measured source, not from a hand-written table.
  const rel = ".cache/telnetd-x/telnetd-x/src/main/java";
  if (!existsSync(path.join(root, rel))) return;
  const r = run(["--target", rel, "--jvm", "jvm/cfjvm.c"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /CANNOT run — missing socket-io, threads, exceptions, synchronization, reflection/);
  assert.match(r.stdout, /49 \.java files/);
});

test("fixtures are cleaned up and live outside the repository", () => {
  rmSync(FIX, { recursive: true, force: true });
  const tracked = execFileSync("git", ["ls-files", "dist/"], { cwd: root, encoding: "utf8" }).trim();
  assert.equal(tracked, "", "nothing under dist/ may be committed");
});
