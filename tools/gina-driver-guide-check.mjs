#!/usr/bin/env node
/**
 * GINA driver-guide checker.
 *
 * WHY THIS EXISTS INSTEAD OF A GHIDRA RUN
 * ---------------------------------------
 * The question was "why is gina.dll in the drivers guide". Ghidra cannot answer
 * it here -- there is no analyzeHeadless on this machine, no JDK (JDK 21 fails
 * with "Failed setting boot class path"), and no gina.dll binary in the tree.
 * It is also the wrong tool: GINA is not an obfuscated binary, it is a documented
 * Microsoft extension point. So this encodes Microsoft's published rules as
 * executable checks and runs them against a driver guide + INF.
 *
 * The short answer, from learn.microsoft.com/windows/win32/secauthn/gina:
 *
 *   "It is essential to set the start parameter for the device driver to system
 *    (Winnt.h: SERVICE_SYSTEM_START) to ensure that the driver is loaded by the
 *    time the GINA is invoked."
 *
 * A token vendor must document GINA because on NT 3.51 .. Server 2003 a custom
 * GINA was the ONLY supported way to present a third-party credential on the
 * secure logon desktop, the driver's service start type gates whether the token
 * is even visible there, and a broken custom GINA can lock the machine out --
 * so the guide owes the reader a recovery path back to MSGINA.DLL. From Vista
 * the whole mechanism is ignored in favour of Credential Providers.
 *
 * Usage:
 *   node tools/gina-driver-guide-check.mjs --check <guide.md> [more.md ...]
 *   node tools/gina-driver-guide-check.mjs --explain
 */

import { readFileSync } from "node:fs";

/** Windows versions where a replaceable GINA is honoured at all. */
export const GINA_MIN = 3.51; // NT Server 3.51 / NT Workstation 4.0 SP3
export const GINA_MAX = 5.2; // Windows Server 2003
export const GINA_IGNORED_FROM = 6.0; // Vista: "GINA DLLs are ignored in Windows Vista"

export const WINDOWS_NAMES = Object.freeze({
  3.51: "Windows NT 3.51",
  4.0: "Windows NT 4.0",
  5.0: "Windows 2000",
  5.1: "Windows XP",
  5.2: "Windows Server 2003",
  6.0: "Windows Vista",
  6.1: "Windows 7",
  6.2: "Windows 8",
  10.0: "Windows 10/11",
});

/** Registry paths, exact strings as Microsoft documents them. */
export const GINA_REG_PATH = "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon";
export const CP_REG_PATH = "Software\\Microsoft\\Windows\\CurrentVersion\\Authentication\\CredentialProviders";

/**
 * GINA entry points Winlogon must be able to resolve. A custom GINA that omits
 * these fails at load or at the first secure attention sequence.
 */
export const MANDATORY_WLX = Object.freeze([
  "WlxNegotiate",
  "WlxInitialize",
  "WlxActivateUserShell",
  "WlxDisplaySASNotice",
  "WlxLoggedOutSAS",
  "WlxLoggedOnSAS",
  "WlxWkstaLockedSAS",
  "WlxLogoff",
  "WlxShutdown",
]);

export const SEVERITY = Object.freeze({ FAIL: "FAIL", WARN: "WARN", INFO: "INFO", PASS: "PASS" });

const RE_MSGINA = /msgina\.dll/i;
// Require a .dll extension: without it this captured the "=" from
// 'GinaDLL = "tokgina.dll"' and the word "back" from "set GinaDLL back to
// MSGINA.DLL", producing GinaDLL values of "=" and "back".
const RE_GINADLL_ASSIGN = /GinaDLL\b\s*[=,]*\s*["']?([A-Za-z0-9_.\-]+\.dll)\b/gi;
// Prose mentions such as "Custom GINA wbgina.dll".
const RE_GINADLL_PROSE = /\b([A-Za-z0-9_\-]*gina\.dll)\b/gi;
const RE_STARTTYPE = /StartType\s*=\s*(0x[0-9a-fA-F]+|\d+)/g;
const RE_WLX = /Wlx[A-Za-z]+/g;
const RE_CREDPROV = /credential\s*provider/i;
const RE_MINIDRIVER = /minidriver|smart\s*card\s*minidriver/i;
const RE_SCFORCE = /scforceoption/i;

/**
 * Extract the facts a rule needs from guide/INF text. Pure text in, facts out,
 * so the parser can be tested without the rule engine and vice versa.
 */
export function parseGuide(text) {
  const ginaDlls = new Set();
  for (const m of text.matchAll(RE_GINADLL_ASSIGN)) ginaDlls.add(m[1]);
  for (const m of text.matchAll(RE_GINADLL_PROSE)) ginaDlls.add(m[1]);

  const startTypes = [];
  for (const m of text.matchAll(RE_STARTTYPE)) {
    const raw = m[1];
    startTypes.push(raw.startsWith("0x") ? parseInt(raw, 16) : parseInt(raw, 10));
  }

  // INF NT decorators, e.g. [GoldKey.NTamd64.6.1] or NTx86.5.1
  const targets = new Set();
  for (const m of text.matchAll(/NT(?:amd64|x86|ia64)?\.(\d+(?:\.\d+)?)/g)) targets.add(parseFloat(m[1]));
  // Explicit prose mentions.
  for (const [ver, name] of Object.entries(WINDOWS_NAMES)) {
    if (text.includes(name)) targets.add(parseFloat(ver));
  }

  const wlx = [...new Set(text.match(RE_WLX) || [])];

  // Does the guide explicitly confine its GINA material to pre-Vista systems?
  // Without this, a correctly written guide that spans XP..10 gets a false R1
  // warning even when it says "applies only to Windows XP and earlier".
  const scopesGinaToLegacy =
    (/gina/i.test(text) && /applies only to/i.test(text) && /earlier|pre-vista|legacy/i.test(text)) ||
    /pre-vista only/i.test(text);

  return {
    ginaDlls: [...ginaDlls].sort(),
    startTypes,
    targets: [...targets].sort((a, b) => a - b),
    wlx,
    scopesGinaToLegacy,
    mentionsMsgina: RE_MSGINA.test(text),
    mentionsCredentialProvider: RE_CREDPROV.test(text),
    mentionsMinidriver: RE_MINIDRIVER.test(text),
    mentionsScforce: RE_SCFORCE.test(text),
    mentionsGina: /gina/i.test(text),
    length: text.length,
  };
}

/**
 * Run every rule against parsed facts. Returns findings; the caller decides
 * what a non-zero exit means. Nothing here prints a hardcoded pass -- each
 * finding is derived from the parsed input.
 */
export function checkGuide(facts) {
  const f = [];
  const add = (severity, id, message, source) => f.push({ severity, id, message, source });

  const ginaTargets = facts.targets.filter((t) => t >= GINA_MIN && t <= GINA_MAX);
  const postVista = facts.targets.filter((t) => t >= GINA_IGNORED_FROM);

  // ---- R1: GINA is dead from Vista on. If the guide claims GINA support for a
  // Vista+ target without saying so, that is a defect, not a style choice.
  if (facts.mentionsGina && postVista.length > 0 && ginaTargets.length === 0 && !facts.scopesGinaToLegacy) {
    add(SEVERITY.FAIL, "R1",
      `Guide presents GINA for ${postVista.map((t) => WINDOWS_NAMES[t] || t).join(", ")} only. ` +
      `GINA DLLs are ignored from Vista onward; the logon path must be a Credential Provider.`,
      "learn.microsoft.com/windows/win32/secauthn/gina");
  } else if (facts.mentionsGina && postVista.length > 0 && ginaTargets.length > 0 && !facts.scopesGinaToLegacy) {
    add(SEVERITY.WARN, "R1",
      `Guide spans ${WINDOWS_NAMES[ginaTargets[0]]}..${WINDOWS_NAMES[postVista[postVista.length - 1]]} ` +
      `without stating that the GINA section applies only to the pre-Vista targets.`,
      "learn.microsoft.com/windows/win32/secauthn/gina");
  } else if (facts.mentionsGina && postVista.length > 0 && facts.scopesGinaToLegacy) {
    add(SEVERITY.PASS, "R1",
      "Guide spans pre-Vista and later targets and explicitly confines GINA to the legacy ones.",
      "learn.microsoft.com/windows/win32/secauthn/gina");
  } else {
    add(SEVERITY.PASS, "R1", "GINA/Vista target split is consistent.", "as above");
  }

  // ---- R2: SERVICE_SYSTEM_START. The single most important driver-guide rule.
  if (facts.mentionsGina && facts.startTypes.length > 0) {
    const bad = facts.startTypes.filter((s) => s !== 0x1);
    if (bad.length > 0) {
      add(SEVERITY.FAIL, "R2",
        `Driver StartType ${bad.map((s) => "0x" + s.toString(16)).join(", ")} is not SERVICE_SYSTEM_START (0x1). ` +
        `The driver will not be loaded by the time the GINA is invoked, so the token is invisible at logon.`,
        "learn.microsoft.com/windows/win32/secauthn/gina");
    } else {
      add(SEVERITY.PASS, "R2", "All declared StartType values are SERVICE_SYSTEM_START (0x1).", "as above");
    }
  } else if (facts.mentionsGina && facts.ginaDlls.length > 0) {
    add(SEVERITY.FAIL, "R2",
      "Guide installs a GinaDLL but never states the driver's StartType. Microsoft calls this " +
      "'essential' -- the reader cannot get the token onto the logon screen without it.",
      "learn.microsoft.com/windows/win32/secauthn/gina");
  }

  // ---- R3: a non-default GinaDLL needs a documented recovery path.
  const custom = facts.ginaDlls.filter((d) => !/^msgina\.dll$/i.test(d));
  if (custom.length > 0 && !facts.mentionsMsgina) {
    add(SEVERITY.FAIL, "R3",
      `Guide installs custom GINA ${custom.join(", ")} but never mentions MSGINA.DLL. A broken custom ` +
      `GINA can prevent logon entirely; the documented recovery is to set GinaDLL back to MSGINA.DLL.`,
      "learn.microsoft.com/archive/blogs/windowsvistanow/smart-card-logon-and-authentication");
  } else if (custom.length > 0) {
    add(SEVERITY.PASS, "R3", `Custom GINA ${custom.join(", ")} with a documented MSGINA.DLL fallback.`, "as above");
  }

  // ---- R4: mandatory Wlx exports.
  if (custom.length > 0) {
    const missing = MANDATORY_WLX.filter((w) => !facts.wlx.includes(w));
    if (missing.length > 0) {
      add(SEVERITY.WARN, "R4",
        `Custom GINA does not document ${missing.length} mandatory entry point(s): ${missing.join(", ")}.`,
        "learn.microsoft.com/windows/win32/secauthn/interaction-between-winlogon-and-gina");
    } else {
      add(SEVERITY.PASS, "R4", `All ${MANDATORY_WLX.length} mandatory Wlx entry points documented.`, "as above");
    }
  }

  // ---- R5: Vista+ needs Credential Providers.
  if (postVista.length > 0 && !facts.mentionsCredentialProvider) {
    add(SEVERITY.FAIL, "R5",
      `Guide targets ${postVista.map((t) => WINDOWS_NAMES[t] || t).join(", ")} but never mentions Credential ` +
      `Providers, which replaced GINA from Vista onward.`,
      "learn.microsoft.com/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/dn579271");
  }

  // ---- R6: modern Windows uses a minidriver, not CSP middleware.
  if (postVista.some((t) => t >= 6.1) && !facts.mentionsMinidriver) {
    add(SEVERITY.WARN, "R6",
      "Guide targets Windows 7 or later but ships no smart card minidriver. A minidriver removes the " +
      "need for CSP middleware and is what GoldKey itself ships.",
      "secureidnews.com/news-item/goldkey-releases-minidriver-with-two-factor-authentication");
  }

  // ---- R7: scforceoption is the second factor's weak point.
  if (facts.mentionsScforce) {
    add(SEVERITY.INFO, "R7",
      "Guide references scforceoption. Worth stating that an administrator with a password alone can zero " +
      "it via Remote Registry, which defeats smart-card enforcement without the second factor.",
      "security.stackexchange.com/questions/75794");
  }

  return f;
}

/** The plain-language answer, for --explain. */
export function explain() {
  return [
    "Why GINA appears in a token driver guide",
    "",
    "GINA (Graphical Identification and Authentication) is a replaceable DLL loaded early in",
    "boot inside the Winlogon process on Windows NT 3.51 through Server 2003. It owns the",
    "secure attention sequence and therefore the logon dialog.",
    "",
    "A driver guide must cover it for four reasons:",
    "",
    "  1. It was the only supported pre-logon hook. Before Vista, a custom GINA was the only",
    "     way to present a third-party credential on the secure logon desktop.",
    "",
    "  2. Driver start-type ordering. Microsoft states it is 'essential to set the start",
    "     parameter for the device driver to system (SERVICE_SYSTEM_START) to ensure that the",
    "     driver is loaded by the time the GINA is invoked'. Get it wrong and the token is",
    "     invisible at logon. This is an install-guide concern, which is why it is in the guide.",
    "",
    "  3. Lockout recovery. The default is MSGINA.DLL, selected via",
    "     HKLM\\" + GINA_REG_PATH + "\\GinaDLL. A broken custom GINA can make the",
    "     machine unusable, and the documented fix is to point GinaDLL back at MSGINA.DLL.",
    "",
    "  4. It is legacy, and the guide spans the break. GINA is ignored from Vista onward,",
    "     where it is replaced by Winlogon + Logon UI + Credential Providers registered under",
    "     HKLM\\" + CP_REG_PATH + ".",
    "",
    "So a GINA section in a modern guide is the pre-Vista path. On anything from Vista",
    "forward the relevant artefacts are a smart card minidriver plus a Credential Provider.",
  ].join("\n");
}

function summarise(findings) {
  const counts = { FAIL: 0, WARN: 0, INFO: 0, PASS: 0 };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes("--explain")) {
    console.log(explain());
    return 0;
  }
  const i = args.indexOf("--check");
  if (i < 0 || args.length <= i + 1) {
    console.error("usage: --check <guide.md> [...]   |   --explain");
    return 2;
  }
  const files = args.slice(i + 1).filter((a) => !a.startsWith("--"));
  let totalFail = 0;
  let totalFindings = 0;
  let filesChecked = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch (e) {
      console.error(`${file}: cannot read (${e.code || e.message})`);
      totalFail++;
      continue;
    }
    const facts = parseGuide(text);
    const findings = checkGuide(facts);
    filesChecked++;
    totalFindings += findings.length;
    console.log(`\n=== ${file} (${text.length} bytes) ===`);
    console.log(`    targets: ${facts.targets.map((t) => WINDOWS_NAMES[t] || t).join(", ") || "(none declared)"}`);
    console.log(`    GinaDLL: ${facts.ginaDlls.join(", ") || "(none)"}   StartType: ${facts.startTypes.map((s) => "0x" + s.toString(16)).join(", ") || "(none)"}`);
    console.log(`    Wlx exports documented: ${facts.wlx.length}`);
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.id}: ${f.message}`);
      console.log(`          source: ${f.source}`);
    }
    const c = summarise(findings);
    console.log(`  -> ${c.FAIL} fail, ${c.WARN} warn, ${c.INFO} info, ${c.PASS} pass`);
    totalFail += c.FAIL;
  }
  console.log(`\nChecked ${filesChecked} file(s), ${totalFindings} finding(s), ${totalFail} failure(s).`);
  return totalFail > 0 ? 1 : 0;
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (invokedDirectly) process.exit(main(process.argv));
