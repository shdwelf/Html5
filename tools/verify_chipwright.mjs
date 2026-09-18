#!/usr/bin/env node
/**
 * verify_chipwright.mjs — the headless proof for chipwright.html.
 *
 *   node tools/verify_chipwright.mjs
 *
 * Five things are asserted, and each catches a different way this page can
 * quietly stop being trustworthy:
 *
 *   1. MARKUP   no duplicate ids, and every tab has both a button and a panel.
 *   2. CONTRACT every id the controller asks for exists in the markup, and
 *               every interactive control in the markup is wired or read.
 *   3. ARITHMETIC  cw-app.js's own self-check suite — checksums against their
 *               published check values, the sieve against Gutenberg #65, the
 *               TAP simulator, the firmware parsers, the ISA tables, GF(2).
 *   4. RENDER   boot() plus every button, select option, input and demo runs
 *               under a DOM stand-in without throwing.
 *   5. CACHE    sw.js precaches the page and its modules.
 *
 * Step 4 is the one that earns its keep. A vanilla-JS page of this size fails
 * in a specific way: one renderer reads a field the module does not return,
 * and the tab goes blank — no console error until someone clicks it. Running
 * every control here turns that into a build failure.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { install, TOUCHED, WIRED, READ } from "./chipwright-dom.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "chipwright.html";
const CONTROLLER = "js/cw-app.js";
const MODULES = [
  "js/cw-data.js", "js/cw-tap.js", "js/cw-data-storage.js", "js/cw-data-uefi.js",
  "js/cw-data-onewire.js", "js/cw-data-jvm.js", "js/cw-data-firmware.js",
  "js/cw-firmware.js", "js/cw-synth.js", "js/cw-arch.js", "js/cw-subst.js",
  "js/cw-probe.js", "js/cw-prime.js", "js/cw-app.js",
];
const TABS = ["dossier", "jtag", "dump", "uefi", "storage", "onewire", "javacard", "arch", "subst", "prime", "refs"];

const failures = [];
const fail = (section, msg) => failures.push({ section, msg });
const ok = (s) => process.stdout.write(`  ${s}\n`);

const html = readFileSync(join(ROOT, PAGE), "utf8");
const js = readFileSync(join(ROOT, CONTROLLER), "utf8");

/* ------------------------------------------------------------------ *
 * 1. Markup
 * ------------------------------------------------------------------ */

const allIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const idSet = new Set(allIds);
const dupes = [...new Set(allIds.filter((id, i) => allIds.indexOf(id) !== i))];
if (dupes.length) fail("markup", `duplicate id(s): ${dupes.join(", ")} — getElementById returns the first, so the second is unreachable`);

for (const t of TABS) {
  if (!idSet.has(`tab-btn-${t}`)) fail("markup", `tab "${t}" has no button #tab-btn-${t}`);
  if (!idSet.has(`tab-${t}`)) fail("markup", `tab "${t}" has no panel #tab-${t}`);
}
const btnTabs = [...html.matchAll(/class="tab-btn[^"]*"[^>]*data-tab="([^"]+)"/g)].map((m) => m[1]);
const panelTabs = [...html.matchAll(/<section[^>]*id="tab-([a-z]+)"/g)].map((m) => m[1]);
for (const t of btnTabs) if (!panelTabs.includes(t)) fail("markup", `tab button data-tab="${t}" has no matching panel`);
for (const t of panelTabs) if (!btnTabs.includes(t)) fail("markup", `panel #tab-${t} has no button that selects it`);

ok(`markup: ${idSet.size} unique ids, ${TABS.length} tabs, ${dupes.length} duplicate(s)`);

/* ------------------------------------------------------------------ *
 * 2. DOM-id contract, both directions
 * ------------------------------------------------------------------ */

/*
 * Ids the controller creates for itself inside rendered markup count as
 * present — renderPinoutCard() builds #pinRun and wires it in the same call,
 * and runCpuid() injects #cpuidDemo. Blink resolves those fine at runtime.
 */
const createdIds = new Set([
  ...[...js.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
  ...[...js.matchAll(/\.id\s*=\s*"([^"]+)"/g)].map((m) => m[1]),
]);

/*
 * Helper-aware, because cw-app.js does not call getElementById directly:
 * on(), str(), int(), num(), hexIn() and enterRuns() all funnel into $().
 * A regex that only knew $() and getElementById() would report every one of
 * those as unused, which is how the earlier version of this check passed
 * while telling you nothing.
 */
const ACCESSORS = ["$", "on", "str", "int", "num", "hexIn", "enterRuns", "getElementById"];
const referenced = new Set();
for (const a of ACCESSORS) {
  const re = new RegExp(`(?:^|[^.\\w])${a.replace("$", "\\$")}\\(\\s*"([^"]+)"`, "g");
  for (const m of js.matchAll(re)) referenced.add(m[1]);
}
const missing = [...referenced].filter((id) => !idSet.has(id) && !createdIds.has(id)).sort();
if (missing.length) fail("contract", `id(s) the controller asks for that the markup does not define: ${missing.join(", ")}`);

/* Reverse: a control in the markup that nothing wires and nothing reads is a
 * dead button — the most common failure in a hand-written vanilla-JS page. */
const controls = [...html.matchAll(/<(button|input|select|textarea)[^>]*\sid="([^"]+)"/g)].map((m) => m[2]);
const deadControls = controls.filter((id) => !WIRED.has(id) && !READ.has(id) && !js.includes(`"${id}"`)).sort();

ok(`contract: ${referenced.size} ids referenced, ${createdIds.size} created by the controller, ${missing.length} missing`);

/* ------------------------------------------------------------------ *
 * 3 + 4. Run the controller headless
 * ------------------------------------------------------------------ */

install(html);
const mod = await import(join(ROOT, CONTROLLER));

const sc = mod.runAllSelfChecks();
const groups = {};
for (const c of sc.checks) (groups[c.group] ??= []).push(c);
for (const [g, rows] of Object.entries(groups)) {
  const bad = rows.filter((r) => !r.ok);
  if (bad.length) for (const b of bad) fail("arithmetic", `[${g}] ${b.name}: got ${b.got}, want ${b.want}`);
}
ok(`arithmetic: ${sc.passed}/${sc.total} self-checks pass across ${Object.keys(groups).length} groups`);

/* Every control, exercised. */
const errors = [];
const step = (name, fn) => { try { fn(); } catch (e) { errors.push({ name, err: `${e?.constructor?.name}: ${e?.message}` }); } };

step("boot()", () => mod.boot());

const buttons = [...html.matchAll(/<button[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
for (const id of buttons) step(`click #${id}`, () => document.getElementById(id)?.dispatch("click"));

for (const m of html.matchAll(/<select[^>]*\sid="([^"]+)"[\s\S]*?<\/select>/g)) {
  const el = document.getElementById(m[1]);
  if (!el) continue;
  for (const o of m[0].matchAll(/<option[^>]*value="([^"]*)"/g)) {
    step(`select #${m[1]} = "${o[1]}"`, () => { el.value = o[1]; el.dispatch("change"); });
  }
}

/* Text and number inputs get a probe string that every decoder in the page can
 * find something in, so the renderers run on data rather than on "". */
const PROBE = "0x4BA00477 EF4016 28FF641E4C3B9C28 2:3,3:5,2:7 50 05 4B 46 7F FF 0C 10 56 3.3,0,3.3,0,3.3 2a 10 07 b6 00 0c b1 115200";
for (const m of html.matchAll(/<input[^>]*\sid="([^"]+)"[^>]*>/g)) {
  const el = document.getElementById(m[1]);
  if (!el || /type="(file|checkbox|radio)"/.test(m[0])) continue;
  step(`type into #${m[1]}`, () => { el.value = /baud|us$|bytes|buckets|stride|count|cap|limit|n$/i.test(m[1]) ? "16" : PROBE; el.dispatch("input"); });
  step(`Enter in #${m[1]}`, () => el.dispatch("keydown", { key: "Enter" }));
}
for (const m of html.matchAll(/<textarea[^>]*\sid="([^"]+)"/g)) {
  const el = document.getElementById(m[1]);
  if (el) step(`type into #${m[1]}`, () => { el.value = "00, 01, 03, 0B, 2C, 4F, 62, E1"; el.dispatch("input"); });
}
for (const m of html.matchAll(/<input[^>]*type="checkbox"[^>]*\sid="([^"]+)"|<input[^>]*\sid="([^"]+)"[^>]*type="checkbox"/g)) {
  const id = m[1] ?? m[2];
  const el = document.getElementById(id);
  if (!el) continue;
  for (const v of [true, false]) step(`toggle #${id} = ${v}`, () => { el.checked = v; el.dispatch("change"); el.dispatch("input"); });
}

/* Gate buttons are created inside rendered markup, so they only exist after
 * the substitution tab has drawn them. Click every state of every gate. */
step("substitution gates", () => {
  const body = document.getElementById("gatesBody");
  for (const g of body.querySelectorAll(".gate")) {
    for (const b of g.querySelectorAll("button[data-v]")) step(`gate ${g.dataset.gate} = ${b.dataset.v}`, () => b.dispatch("click"));
  }
});

/* The report section switcher only exists once a dump is loaded. */
step("dump report sections", () => {
  document.getElementById("sampleFv")?.dispatch("click");
  const status = document.getElementById("loadStatus");
  for (const b of status.querySelectorAll('[data-rep]')) step(`report section ${b.dataset.rep}`, () => b.dispatch("click"));
});

/* The remaining paste-driven decoders, each with an input that means something. */
const DEMOS = [
  ["smartDemoDying", "smartDemoWorn", "smartDemoHealthy"],
  ["postDemoRetry", "postDemoHandoff"],
  ["vecDemoGood", "vecDemoErased", "vecDemoThumb"],
  ["apduDemoSelect", "apduDemoInstall"],
  ["bcDemo", "bcDemoSwitch"],
  ["sampleFv", "sampleMbr", "sampleIfd", "sampleBad", "sampleTrunc"],
  ["romGen", "romCorrupt", "spDemo85"],
  ["idExamples", "cpuidDemo", "pinRun", "dossierExport", "dossierFromId"],
  ["primeVerify", "lfsrVerifyAll", "lfsrCrc32", "capPresets", "selfCheckRun"],
];
for (const group of DEMOS) {
  for (const id of group) step(`demo #${id}`, () => document.getElementById(id)?.dispatch("click"));
}

/* TAP controls in the order a person would use them. */
const TAP_SEQ = ["chainPreset", "chainAdd", "chainRemove", "chainCount", "chainBypass", "chainIdcode",
  "tapReset", "tapClock0", "tapClock1", "tapShiftIr", "tapCaptureIdcode", "tapShiftDr", "tapIsolate", "tapPath"];
for (const id of TAP_SEQ) step(`tap #${id}`, () => document.getElementById(id)?.dispatch("click"));

if (errors.length) for (const e of errors) fail("render", `${e.name} threw ${e.err}`);
ok(`render: boot + ${buttons.length} buttons, every select option, every input and ${DEMOS.flat().length + TAP_SEQ.length} demos — ${errors.length} error(s)`);

/*
 * Injection. Several renderers write user-pasted text into innerHTML — SMART
 * attribute names out of a report, the original/replacement part fields, the
 * identification input, the dossier name. Those values now travel through kv(),
 * which renders raw so it can carry evidence chips. Raw output is only safe
 * because every interpolation goes through esc(), and that is a property worth
 * asserting rather than assuming: one missed esc() is a stored-XSS-shaped hole
 * in a page people will point at their own hardware with.
 *
 * The check is two-sided on purpose. Asserting only "no live tag" would also
 * pass if the renderer silently dropped the text, which is its own bug — so it
 * also asserts the escaped form is present.
 */
const PAYLOAD = '<img src=x onerror=alert(1)>';
const escapedForm = "&lt;img src=x onerror=alert(1)&gt;";
const INJECTION_TARGETS = [
  ["smartText", "smartOut", `9 ${PAYLOAD} 100 100 010 - 7\n5 Reallocated_Sector_Ct 100 100 010 - 0`],
  ["substOriginal", "substVerdict", PAYLOAD],
  ["substReplacement", "substVerdict", PAYLOAD],
  ["idInput", "idOut", PAYLOAD],
  ["dossierName", "dossierBody", PAYLOAD],
  ["postTrace", "postOut", `00, 01, ${PAYLOAD}`],
  ["pinVolts", "pinOut", `3.3, 0, ${PAYLOAD}`],
  ["collideIn", "collideOut", `7, ${PAYLOAD}`],
  ["crtIn", "crtOut", `2:3, ${PAYLOAD}`],
  ["rankRdid", "rankOut", PAYLOAD],
  ["bcInput", "bcOut", PAYLOAD],
  ["apduInput", "apduOut", PAYLOAD],
  ["vecInput", "vecOut", PAYLOAD],
  ["romInput", "romOut", PAYLOAD],
  ["spInput", "spOut", PAYLOAD],
  ["disBytes", "disOut", PAYLOAD],
  ["cpuidA", "cpuidOut", PAYLOAD],
  ["baudUs", "baudOut", PAYLOAD],
];
const leaks = [];
for (const [inputId, outId, payload] of INJECTION_TARGETS) {
  const inp = document.getElementById(inputId);
  const out = document.getElementById(outId);
  if (!inp || !out) { leaks.push(`${inputId}/${outId} not found`); continue; }
  inp.value = payload;
  inp.dispatch("input");
  inp.dispatch("change");
  inp.dispatch("keydown", { key: "Enter" });
  // Also drive the button that reads this field, where there is one.
  const runner = { smartText: "smartRun", substOriginal: "substEval", idInput: "idRun", postTrace: "postRun",
    pinVolts: "pinRun", collideIn: "collideRun", crtIn: "crtRun", rankRdid: "rankRun", bcInput: "bcRun",
    apduInput: "apduRun", vecInput: "vecRun", romInput: "romRun", spInput: "spRun", disBytes: "disRun",
    cpuidA: "cpuidRun", baudUs: "baudRun" }[inputId];
  if (runner) document.getElementById(runner)?.dispatch("click");
  const htmlOut = out.innerHTML;
  /*
   * Look for a live tag start only — a bare "<" followed by a tag name. Do NOT
   * also match `onerror=`, which was the first version of this detector: the
   * correctly-escaped payload `&lt;img src=x onerror=alert(1)&gt;` contains
   * that substring, so the detector reported three leaks in output that was
   * already safe. Inert text is inert; only an unescaped tag start can execute.
   */
  if (/<\s*(img|svg|script|iframe|object|embed|link|style|body|meta)\b/i.test(htmlOut)) {
    leaks.push(`${outId}: a live tag survived from #${inputId}`);
  }
}
if (leaks.length) for (const l of leaks) fail("injection", l);

/* The escaped form must actually appear where the payload was echoed back. */
/*
 * Only for renderers that are DESIGNED to echo the input back. Asserting it
 * everywhere would be wrong: identifyAnything() on pure markup finds no
 * candidates and renders nothing at all, which is correct behaviour rather than
 * a dropped value. What matters is that a renderer which does echo the text
 * escapes it — otherwise "we escaped everything" and "we rendered nothing"
 * become indistinguishable, and the second can hide a regression.
 */
const echoChecks = [
  /*
   * The payload leads the line, so it has no parseable attribute id and lands
   * in `unparsed` — which analyseSmart() reports verbatim inside a <pre>.
   * That is the path that echoes text back. (A payload AFTER a valid id would
   * parse as an attribute whose name comes from the table instead, and nothing
   * would be echoed at all — safe, but it would not test escaping.)
   */
  ["smartOut", "smartText", "smartRun", `${PAYLOAD} 100 100 010 - 7`],
  ["substVerdict", "substOriginal", "substEval", PAYLOAD],
  ["dossierBody", "dossierName", null, PAYLOAD],
];
const dropped = [];
for (const [outId, inputId, runner, value] of echoChecks) {
  const inp = document.getElementById(inputId);
  inp.value = value;
  inp.dispatch("input");
  if (runner) document.getElementById(runner)?.dispatch("click");
  if (!document.getElementById(outId).innerHTML.includes(escapedForm)) {
    dropped.push(`${outId} does not contain the escaped payload from #${inputId} — the text was dropped rather than escaped, or never rendered`);
  }
}
for (const d of dropped) fail("injection", d);
ok(`injection: ${INJECTION_TARGETS.length} fields fed ${JSON.stringify(PAYLOAD)}, ${leaks.length} live tag(s), ${dropped.length} silent drop(s)`);

/* Now that everything has run, the reverse contract check has real data. */
const stillDead = deadControls.filter((id) => !WIRED.has(id) && !READ.has(id));
if (stillDead.length) fail("contract", `control(s) in the markup that nothing wires and nothing reads: ${stillDead.join(", ")}`);
ok(`contract (reverse): ${controls.length} controls, ${WIRED.size} wired, ${READ.size} read, ${stillDead.length} dead`);

/* Every module the page loads must exist and parse. */
for (const m of MODULES) {
  if (!existsSync(join(ROOT, m))) fail("modules", `${m} is imported but does not exist`);
}
const scriptSrcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1].replace(/^\.\//, ""));
for (const s of scriptSrcs) if (!existsSync(join(ROOT, s))) fail("modules", `chipwright.html loads ${s}, which does not exist`);
const linkHrefs = [...html.matchAll(/<link[^>]*href="([^"]+\.css)"/g)].map((m) => m[1].replace(/^\.\//, ""));
for (const l of linkHrefs) if (!existsSync(join(ROOT, l))) fail("modules", `chipwright.html links ${l}, which does not exist`);
ok(`modules: ${MODULES.length} js modules, ${scriptSrcs.length} script tag(s), ${linkHrefs.length} stylesheet(s)`);

/* ------------------------------------------------------------------ *
 * 5. Service worker precache
 * ------------------------------------------------------------------ */

if (existsSync(join(ROOT, "sw.js"))) {
  const sw = readFileSync(join(ROOT, "sw.js"), "utf8");
  const precache = sw.slice(sw.indexOf("PRECACHE"), sw.indexOf("];", sw.indexOf("PRECACHE")));
  const need = [PAGE, "css/chipwright.css", ...MODULES];
  const absent = need.filter((f) => !precache.includes(`./${f}`));
  if (absent.length) fail("cache", `sw.js does not precache: ${absent.join(", ")} — the page will not work offline after one visit`);
  ok(`cache: ${need.length - absent.length}/${need.length} chipwright assets precached`);
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log("");
if (failures.length) {
  const bySection = {};
  for (const f of failures) (bySection[f.section] ??= []).push(f.msg);
  for (const [s, msgs] of Object.entries(bySection)) {
    console.error(`${s.toUpperCase()} — ${msgs.length} failure(s)`);
    for (const m of msgs.slice(0, 40)) console.error(`  ✗ ${m}`);
    if (msgs.length > 40) console.error(`  … and ${msgs.length - 40} more`);
  }
  console.error(`\n${failures.length} failure(s). chipwright.html is NOT verified.`);
  process.exit(1);
}
console.log(`chipwright.html verified: ${sc.total} arithmetic self-checks, ${idSet.size} markup ids, ${controls.length} controls exercised, 0 errors.`);
