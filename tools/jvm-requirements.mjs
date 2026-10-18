#!/usr/bin/env node
/**
 * Compare what a Java program requires of a JVM against what a given JVM
 * actually implements.
 *
 * It exists because "will this JAR run on the xPort Pro?" was being answered
 * from memory. The answer is measurable. cfjvm's capability profile is parsed
 * out of jvm/cfjvm.c rather than asserted here, so if the interpreter grows
 * socket support the verdict changes without anyone editing a table.
 *
 * Usage:
 *   node tools/jvm-requirements.mjs --target <dir-or-file> [--target ...]
 *                                   [--jvm jvm/cfjvm.c] [--json]
 *
 * Exit status: 0 if every required capability is provided, 1 if any is missing,
 * 2 on a usage or parse error.
 */

import { readFileSync, statSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
function multi(flag) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag) { out.push(argv[++i]); while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) out.push(argv[++i]); }
  }
  return out;
}
const targets = multi("--target");
const jvmArg = argv[argv.indexOf("--jvm") + 1] || "jvm/cfjvm.c";
const root = process.cwd();

/* --------------------------------------------------------------- capability set */

/**
 * Each capability: how to spot it in Java source, and the marker that shows a
 * JVM provides it. The markers are grepped out of the interpreter's C source,
 * so they must be things cfjvm.c would literally contain if it gained support.
 */
const CAPABILITIES = [
  {
    id: "socket-io",
    label: "TCP socket I/O",
    java: [/\bjava\.net\.Socket\b/, /\bServerSocket\b/, /\bSocketChannel\b/, /\bjava\.net\.DatagramSocket\b/],
    jvm: [/ServerSocket|\bsocket\s*\(|SOCK_STREAM|net\/Socket/],
    why: "a telnet or ssh server cannot exist without it",
  },
  {
    id: "threads",
    label: "multiple threads of execution",
    java: [/\bnew\s+Thread\b/, /\bimplements\s+Runnable\b/, /\bextends\s+Thread\b/, /\bThread\.(sleep|currentThread|start)\b/, /\bExecutorService\b/],
    jvm: [/java\/lang\/Thread|\bpthread_create\b/],
    why: "every session needs its own execution; a single-threaded VM serves one caller at a time",
  },
  {
    id: "exceptions",
    label: "exception handling",
    java: [/\bthrows\b/, /\bcatch\s*\(/, /\bthrow\s+new\b/],
    jvm: [/athrow|exception_table|java\/lang\/Throwable/],
    why: "blocking reads report end-of-stream and errors by throwing",
  },
  {
    id: "synchronization",
    label: "monitor synchronization",
    java: [/\bsynchronized\b/, /\b\.wait\s*\(/, /\b\.notify(All)?\s*\(/],
    jvm: [/monitorenter|monitorexit/],
    why: "shared state between the accept loop and the sessions",
  },
  {
    id: "reflection",
    label: "reflection",
    java: [/\bjava\.lang\.reflect\./, /\.getDeclaredMethod\s*\(/, /\.newInstance\s*\(/],
    jvm: [/getDeclaredMethod|java\/lang\/reflect/],
    why: "shells and terminals are usually instantiated by class name",
  },
  {
    id: "file-io",
    label: "file I/O",
    java: [/\bjava\.io\.File\b/, /\bFileInputStream\b/, /\bFileOutputStream\b/, /\bRandomAccessFile\b/],
    jvm: [/java\/io\/File|java\/io\/FileInputStream|\bfopen\b/],
    why: "message bases and user records live on disk",
  },
  {
    id: "nio",
    label: "java.nio / NIO2",
    java: [/\bjava\.nio\./, /\bAsynchronousSocketChannel\b/, /\bSelector\b/],
    jvm: [/java\/nio/],
    why: "modern Java servers default to asynchronous channels",
  },
  {
    id: "concurrent",
    label: "java.util.concurrent",
    java: [/\bjava\.util\.concurrent\./, /\bConcurrentHashMap\b/, /\bCountDownLatch\b/, /\bAtomicInteger\b/],
    jvm: [/java\/util\/concurrent/],
    why: "thread pools and concurrent collections",
  },
  {
    id: "lambdas",
    label: "invokedynamic / lambdas",
    java: [/->\s*[\{\w]/, /::/],
    jvm: [/invokedynamic/],
    why: "Java 8+ lambda call sites compile to invokedynamic",
  },
  {
    id: "floating-point",
    label: "floating-point arithmetic",
    java: [/\bdouble\b/, /\bfloat\b/, /\bMath\.(sqrt|sin|cos|pow)\b/],
    jvm: [/dadd|fadd|double.*add/],
    why: "cfjvm deliberately omits floating point",
  },
];


/**
 * Return only the code: comments and string/char literal contents removed.
 *
 * Both bugs this file originally had were the same mistake — matching raw
 * source text. cfjvm.c's "no support for invokedynamic" disclaimer registered
 * as support, and 29 telnetd-x log messages reading
 * "readNEVariables()::NE_IN_ERROR" registered as Java method references.
 * A single-pass scan handles nesting correctly, where regex passes do not.
 */
function codeOnly(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2; out += " "; continue;
    }
    if (c === '"' || c === "\'") {
      const q = c; i++;
      while (i < n && src[i] !== q) { if (src[i] === "\\") i++; i++; }
      i++; out += '""'; continue;
    }
    out += c; i++;
  }
  return out;
}

/* --------------------------------------------------------------- parse the JVM */

function jvmProfile(cPath) {
  if (!existsSync(cPath)) throw new Error(`no such JVM source: ${cPath}`);
  const raw = readFileSync(cPath, "utf8");
  // The classes the interpreter knows about appear as string literals, so the
  // class list comes from the raw text. Capability markers are matched against
  // code only, so a comment disclaiming a feature cannot count as providing it.
  const classes = [...new Set([...raw.matchAll(/"(java(?:x)?\/[A-Za-z0-9_/$]+)"/g)].map((m) => m[1]))].sort();
  const code = codeOnly(raw);
  const provided = {};
  for (const c of CAPABILITIES) provided[c.id] = c.jvm.some((re) => re.test(code));
  return { path: cPath, bytes: raw.length, classes, provided };
}

/* ------------------------------------------------------------- parse the target */

function javaFiles(p, acc = []) {
  const st = statSync(p);
  if (st.isFile()) { if (p.endsWith(".java")) acc.push(p); return acc; }
  for (const e of readdirSync(p, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules" || e.name === "target") continue;
    javaFiles(path.join(p, e.name), acc);
  }
  return acc;
}

function analyseTarget(p) {
  const files = javaFiles(path.resolve(root, p));
  if (files.length === 0) throw new Error(`no .java files under ${p}`);
  const hits = {};      // capId -> {files:Set, matches:number}
  const classRefs = new Set();
  let lines = 0;
  for (const f of files) {
    const raw = readFileSync(f, "utf8");
    lines += raw.split("\n").length;
    const src = codeOnly(raw);
    for (const m of src.matchAll(/\bjava(?:x)?\.[A-Za-z0-9_.]+/g)) classRefs.add(m[0]);
    for (const c of CAPABILITIES) {
      for (const re of c.java) {
        const n = (src.match(new RegExp(re.source, "g")) || []).length;
        if (n > 0) {
          hits[c.id] ||= { files: new Set(), matches: 0 };
          hits[c.id].files.add(path.relative(root, f));
          hits[c.id].matches += n;
        }
      }
    }
  }
  return { path: p, files: files.length, lines, hits, classRefs: [...classRefs].sort() };
}

/* ------------------------------------------------------------------------ main */

function main() {
  if (targets.length === 0) {
    console.error("usage: node tools/jvm-requirements.mjs --target <dir> [--target ...] [--jvm jvm/cfjvm.c] [--json]");
    process.exit(2);
  }
  let jvm;
  try { jvm = jvmProfile(path.resolve(root, jvmArg)); }
  catch (e) { console.error(String(e.message || e)); process.exit(2); }

  const results = [];
  for (const t of targets) {
    let a;
    try { a = analyseTarget(t); }
    catch (e) { console.error(String(e.message || e)); process.exit(2); }

    const required = CAPABILITIES.filter((c) => a.hits[c.id]);
    const missing = required.filter((c) => !jvm.provided[c.id]);
    const satisfied = required.filter((c) => jvm.provided[c.id]);
    const unknownClasses = a.classRefs.filter((c) => {
      const slashed = c.replace(/\.$/, "").replace(/\./g, "/");
      return !jvm.classes.includes(slashed);
    });
    results.push({ target: a.path, files: a.files, lines: a.lines,
      required: required.map((c) => c.id), missing: missing.map((c) => c.id),
      satisfied: satisfied.map((c) => c.id),
      unknownClasses: unknownClasses.length,
      detail: Object.fromEntries(required.map((c) => [c.id, {
        label: c.label, why: c.why, provided: jvm.provided[c.id],
        files: a.hits[c.id].files.size, matches: a.hits[c.id].matches,
      }])),
    });
  }

  if (asJson) {
    console.log(JSON.stringify({ jvm: { path: jvmArg, classes: jvm.classes, provided: jvm.provided }, results }, null, 2));
    process.exit(results.every((r) => r.missing.length === 0) ? 0 : 1);
  }

  console.log(`JVM: ${jvmArg}`);
  console.log(`  classes implemented: ${jvm.classes.length}  ->  ${jvm.classes.join(", ")}`);
  console.log(`  capabilities: ${CAPABILITIES.filter((c) => jvm.provided[c.id]).map((c) => c.id).join(", ") || "(none beyond the class library)"}`);
  console.log("");
  for (const r of results) {
    console.log(`target: ${r.target}  (${r.files} .java files, ${r.lines} lines)`);
    if (r.required.length === 0) { console.log("  requires no capability outside the core class library"); continue; }
    for (const c of CAPABILITIES.filter((c) => r.detail[c.id])) {
      const d = r.detail[c.id];
      const mark = d.provided ? "  ok  " : "MISSING";
      console.log(`  [${mark}] ${c.id} — ${d.label} (${d.files} file(s), ${d.matches} hit(s))`);
      if (!d.provided) console.log(`           ${d.why}`);
    }
    console.log(`  classes referenced but not implemented: ${r.unknownClasses}`);
    console.log(`  verdict: ${r.missing.length === 0 ? "CAN run" : `CANNOT run — missing ${r.missing.join(", ")}`}`);
    console.log("");
  }
  process.exit(results.every((r) => r.missing.length === 0) ? 0 : 1);
}

main();
