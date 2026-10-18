import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  GINA_IGNORED_FROM,
  GINA_MAX,
  GINA_MIN,
  MANDATORY_WLX,
  checkGuide,
  explain,
  parseGuide,
} from "../tools/gina-driver-guide-check.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name) => join(here, "fixtures", "gina", name);
const CLI = join(here, "..", "tools", "gina-driver-guide-check.mjs");

const find = (findings, id) => findings.find((f) => f.id === id);
const sev = (findings, id) => find(findings, id)?.severity;

function runCli(...files) {
  try {
    const out = execFileSync(process.execPath, [CLI, "--check", ...files], { encoding: "utf8" });
    return { status: 0, out };
  } catch (e) {
    return { status: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// --------------------------------------------------------------- constants

test("GINA version window matches the documented support range", () => {
  // Replaceable GINA: NT 3.51 through Server 2003; ignored from Vista.
  assert.equal(GINA_MIN, 3.51);
  assert.equal(GINA_MAX, 5.2);
  assert.equal(GINA_IGNORED_FROM, 6.0);
  assert.equal(MANDATORY_WLX.length, 9);
  assert.ok(MANDATORY_WLX.includes("WlxNegotiate"));
  assert.ok(MANDATORY_WLX.includes("WlxInitialize"));
});

// -------------------------------------------------------------- parser

test("parser reads a GinaDLL from an INF-style registry line", () => {
  const f = parseGuide(readFileSync(fx("legacy-xp-defective.md"), "utf8"));
  assert.ok(f.ginaDlls.includes("wbgina.dll"));
  assert.deepEqual(f.startTypes, [3]);
});

test("parser reads a GinaDLL mentioned in prose", () => {
  const f = parseGuide("The installer registers a custom GINA wbgina.dll for logon.");
  assert.deepEqual(f.ginaDlls, ["wbgina.dll"]);
});

test("parser does not invent GinaDLL values from punctuation or prose verbs", () => {
  // Regression: an earlier regex returned ["=", "back"] for this text.
  const f = parseGuide(readFileSync(fx("mixed-no-credential-provider.md"), "utf8"));
  assert.ok(!f.ginaDlls.includes("="));
  assert.ok(!f.ginaDlls.includes("back"));
  assert.ok(f.ginaDlls.includes("tokgina.dll"));
  assert.ok(f.ginaDlls.every((d) => /\.dll$/i.test(d)));
});

test("parser decodes hex and decimal StartType", () => {
  const f = parseGuide("StartType = 0x1\nStartType = 3\nStartType=2");
  assert.deepEqual(f.startTypes, [1, 3, 2]);
});

test("parser finds Windows targets from prose names and INF NT decorators", () => {
  assert.ok(parseGuide("Runs on Windows XP and Windows 2000.").targets.includes(5.1));
  assert.ok(parseGuide("[Token.NTamd64.6.1]").targets.includes(6.1));
  assert.ok(parseGuide("[Token.NTx86.10.0]").targets.includes(10.0));
  assert.deepEqual(parseGuide("nothing relevant here").targets, []);
});

test("parser recognises an explicit pre-Vista scoping statement", () => {
  assert.equal(parseGuide(readFileSync(fx("modern-correct.md"), "utf8")).scopesGinaToLegacy, true);
  assert.equal(parseGuide(readFileSync(fx("mixed-no-credential-provider.md"), "utf8")).scopesGinaToLegacy, false);
});

// ---------------------------------------------------------------- rules

const base = {
  ginaDlls: [], startTypes: [], targets: [], wlx: [], scopesGinaToLegacy: false,
  mentionsMsgina: false, mentionsCredentialProvider: false, mentionsMinidriver: false,
  mentionsScforce: false, mentionsGina: false, length: 0,
};

test("R2 FAILS when the driver start type is not SERVICE_SYSTEM_START", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["x.dll"], startTypes: [3] });
  assert.equal(sev(f, "R2"), "FAIL");
  assert.match(find(f, "R2").message, /SERVICE_SYSTEM_START/);
});

test("R2 PASSES when the start type is 0x1", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["x.dll"], startTypes: [1] });
  assert.equal(sev(f, "R2"), "PASS");
});

test("R2 FAILS when a GINA is installed but no start type is stated at all", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["x.dll"], startTypes: [] });
  assert.equal(sev(f, "R2"), "FAIL");
  assert.match(find(f, "R2").message, /never states the driver's StartType/);
});

test("R3 FAILS when a custom GINA has no MSGINA.DLL recovery path", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["wbgina.dll"] });
  assert.equal(sev(f, "R3"), "FAIL");
});

test("R3 PASSES when MSGINA.DLL fallback is documented", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["wbgina.dll"], mentionsMsgina: true });
  assert.equal(sev(f, "R3"), "PASS");
});

test("R4 lists exactly the missing mandatory Wlx entry points", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["x.dll"], wlx: ["WlxNegotiate"] });
  assert.equal(sev(f, "R4"), "WARN");
  assert.match(find(f, "R4").message, /8 mandatory entry point/);
  assert.match(find(f, "R4").message, /WlxInitialize/);
  assert.ok(!find(f, "R4").message.includes("WlxNegotiate,"));
});

test("R4 PASSES when all nine entry points are documented", () => {
  const f = checkGuide({ ...base, mentionsGina: true, ginaDlls: ["x.dll"], wlx: [...MANDATORY_WLX] });
  assert.equal(sev(f, "R4"), "PASS");
});

test("R5 FAILS for Vista+ targets with no Credential Provider", () => {
  const f = checkGuide({ ...base, targets: [6.1], mentionsGina: true });
  assert.equal(sev(f, "R5"), "FAIL");
});

test("R5 stays silent once Credential Providers are mentioned", () => {
  const f = checkGuide({ ...base, targets: [6.1], mentionsGina: true, mentionsCredentialProvider: true });
  assert.equal(find(f, "R5"), undefined);
});

test("R1 FAILS when GINA is offered for Vista+ targets only", () => {
  const f = checkGuide({ ...base, targets: [6.1], mentionsGina: true });
  assert.equal(sev(f, "R1"), "FAIL");
});

test("R1 PASSES when a spanning guide scopes GINA to pre-Vista", () => {
  const f = checkGuide({ ...base, targets: [5.1, 10.0], mentionsGina: true, scopesGinaToLegacy: true });
  assert.equal(sev(f, "R1"), "PASS");
});

test("R1 WARNs when a spanning guide does not scope GINA", () => {
  const f = checkGuide({ ...base, targets: [5.1, 6.1], mentionsGina: true });
  assert.equal(sev(f, "R1"), "WARN");
});

test("R6 warns about a missing minidriver on Windows 7+", () => {
  assert.equal(sev(checkGuide({ ...base, targets: [6.1] }), "R6"), "WARN");
  assert.equal(find(checkGuide({ ...base, targets: [6.1], mentionsMinidriver: true }), "R6"), undefined);
  assert.equal(find(checkGuide({ ...base, targets: [5.1] }), "R6"), undefined);
});

test("R7 flags scforceoption as bypassable by a password-only administrator", () => {
  const f = checkGuide({ ...base, mentionsScforce: true });
  assert.equal(sev(f, "R7"), "INFO");
  assert.match(find(f, "R7").message, /Remote Registry/);
});

test("every finding carries a source citation", () => {
  const f = checkGuide({ ...base, targets: [6.1], mentionsGina: true, ginaDlls: ["x.dll"], startTypes: [3] });
  assert.ok(f.length >= 3);
  for (const x of f) assert.ok(x.source && x.source.length > 5, `${x.id} has no source`);
});

// ------------------------------------------------------------ fixtures + CLI

test("the defective XP fixture fails R2 and R3", () => {
  const f = checkGuide(parseGuide(readFileSync(fx("legacy-xp-defective.md"), "utf8")));
  assert.equal(sev(f, "R2"), "FAIL");
  assert.equal(sev(f, "R3"), "FAIL");
  assert.equal(f.filter((x) => x.severity === "FAIL").length, 2);
});

test("the correct modern fixture produces no failures and no warnings", () => {
  const f = checkGuide(parseGuide(readFileSync(fx("modern-correct.md"), "utf8")));
  assert.equal(f.filter((x) => x.severity === "FAIL").length, 0);
  assert.equal(f.filter((x) => x.severity === "WARN").length, 0);
  assert.equal(sev(f, "R4"), "PASS");
});

test("CLI exits 1 when any file fails", () => {
  const r = runCli(fx("legacy-xp-defective.md"));
  assert.equal(r.status, 1);
  // That fixture trips R2 (start type 0x3) and R3 (no MSGINA fallback).
  assert.match(r.out, /2 failure\(s\)/);
});

test("CLI exits 0 on a clean guide", () => {
  const r = runCli(fx("modern-correct.md"));
  assert.equal(r.status, 0);
  assert.match(r.out, /0 failure\(s\)/);
});

test("CLI exits 2 on missing arguments rather than silently passing", () => {
  const r = runCli();
  assert.equal(r.status, 2);
  assert.match(r.out, /usage:/);
});

test("CLI reports a missing file as a failure instead of skipping it", () => {
  const r = runCli(join(here, "fixtures", "gina", "does-not-exist.md"));
  assert.equal(r.status, 1);
  assert.match(r.out, /cannot read/);
});

test("explain() states the SERVICE_SYSTEM_START requirement and the Vista break", () => {
  const t = explain();
  assert.match(t, /SERVICE_SYSTEM_START/);
  assert.match(t, /ignored from Vista/);
  assert.match(t, /MSGINA\.DLL/);
  assert.match(t, /Credential Provider/);
});
