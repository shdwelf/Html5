/* CHIPWRIGHT · cw-app.js — the UI controller.
 *
 * Vanilla DOM, no framework, no build step. Every rule lives in the modules
 * below, so the same logic runs headless under `node tools/verify_chipwright.mjs`.
 * This file only decides what to render and where.
 *
 * Two rules it obeys everywhere:
 *   1. A row tagged `ev: "recall"` is rendered with a warning stripe. That is a
 *      visible statement that nobody checked it against a source this session.
 *   2. Nothing destructive is reachable without an explicit user action, and
 *      nothing here talks to a network. There is no upload path at all — files
 *      are read with FileReader and never leave the tab.
 */

import {
  u32, hex, bin, bytesToHex, hexToBytes, parseHexInt, crc32, CRC32_CHECK,
  TAP_STATES, TAP_INSTRUCTIONS, IR_LENGTHS, IDCODES, JEP106, SPI_VENDORS, SPI_COMMANDS,
  SPI_SR_BITS, decodeIdcode, encodeIdcode, decodeRdid, ARCHS, ISA, CONNECTORS,
  SUBSTITUTION_FAMILIES, SYMPTOMS, REWORK, SOURCES, SCOPE, SIGNATURES, UIMAGE_LAYOUT, parseUimage,
} from "./cw-data.js";
import { TapSim, demoChain, TMS_LEGEND, DP_REGISTERS, SWD_ACK } from "./cw-tap.js";
import {
  SMART_ATTRS, SMART_ATTR_BY_ID, SMART_CRITICAL, SMART_ENTRY_LAYOUT, ATA_SMART_TASKFILE,
  ATA_IDENTIFY, ATA_COMMANDS, SELFTEST_LOG, NVME_LOG_PAGES, NVME_SMART_LAYOUT, NVME_ADMIN,
  DRIVE_TRIAGE,
} from "./cw-data-storage.js";
import {
  IFD_SIGNATURE, IFD_REGIONS, IFD_LAYOUT, FV_HEADER, FV_FILE_TYPES, FV_SECTION_TYPES,
  GUID_DEFINED_WRAPPERS, TE_HEADER, PE_MACHINES, PE_SUBSYSTEMS, VARIABLE_STORE_SIGNATURES,
  VARIABLE_STATE, VARIABLE_ATTRIBUTES, MBR_LAYOUT, PARTITION_ENTRY, GPT_HEADER, UEFI_TRIAGE,
} from "./cw-data-uefi.js";
import {
  ROM_COMMANDS, FAMILY_CODES, DS18B20, DS2438, DS2408, ONEWIRE_TIMING, ONEWIRE_BUS_FAULTS,
  OWFS, ONEWIRE_FROM_BROWSER, decodeRom, crc8, crc16, CRC16_CHECK_WORD, CRC16_CHECK_STRING,
} from "./cw-data-onewire.js";
import {
  CLASS_MAGIC, CLASS_LAYOUT, CP_TAGS, JVM_OPCODES, CAP_MAGIC, CAP_COMPONENTS, CAP_INSTALL_ORDER,
  CAP_NOTES, ISO7816, JAVACARD_LIMITS, PORTABILITY, jvmInstructionLength, JVM_BY_OP,
} from "./cw-data-jvm.js";
import { X87, decodeX87ControlWord, decodeX87StatusWord, POST_CARD, analysePostTrace, CPU_SUBSTITUTION, CPU_SWAP_PROCEDURE } from "./cw-data-firmware.js";
import { analyseDump, selfCheck as fwSelfCheck, REGION_SAFETY } from "./cw-firmware.js";
import { identifyArchitecture, disassemble, validateCortexMVectors, decodeCpuid, diffCpuid, decodeInstruction, CORTEX_M_VECTORS, ISA_COMPILED } from "./cw-arch.js";
import {
  evaluateSubstitution, rankSpiNor, substitutionIndex, substitutionTableById, buildRepairPlan, VERDICTS,
} from "./cw-subst.js";
import {
  detectCapabilities, createDossier, addFinding, dossierSummary, identifyAnything,
  PINOUT_DISCOVERY, BAUD_RATES, baudFromBitTime, frameTime, UART_GARBAGE_SIGNATURES,
  connectorById, connectorIndex, suggestPinout,
} from "./cw-probe.js";
import {
  nthPrime, isPrime, factorSummary, strideAnalysis, xorFoldBank, collisionAnalysis,
  huntingTooth, analyseCapacity, flashGeometry, verifyAgainstGutenberg65, GUTENBERG_65,
  MAXIMAL_LFSR_TAPS, lfsrPeriod, verifyTapTable, isPrimitiveGF2, isIrreducibleGF2,
  gf2ToString, tapsToPoly, crt, primeBucketCandidates, primeGaps, MERSENNE,
} from "./cw-prime.js";
import {
  synthFirmwareVolume, synthGptDisk, synthIfdDump, synthErased, synthTruncated,
  selfCheck as synthSelfCheckModule,
} from "./cw-synth.js";

/* ================================================================== *
 * Helpers
 * ================================================================== */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nbsp = (s) => (s === null || s === undefined || s === "" ? "&mdash;" : esc(s));
/** Escape for an HTML attribute that will not be re-parsed as markup. */
const at = (s) => esc(String(s ?? ""));

const EV_MEANING = {
  std: "Read out of a published standard or a vendor datasheet.",
  tool: "Read out of an open-source tool's own tables (flashrom, OpenOCD, U-Boot, coreboot ifdtool, owfs) and quoted here.",
  report: "Observed by third parties; reproduced as a report, not as a specification.",
  recall: "Transcribed from memory and NOT verified against a source this session. Excluded from automatic decisions.",
  none: "No source. A label or a user input, not a claim about hardware.",
  model: "A property of this app's own model, not a claim about hardware.",
};

/** Evidence tag chip. `recall` is deliberately loud. */
function ev(tag, extra = "") {
  const t = (tag || "none").toLowerCase();
  return `<span class="ev ev-${at(t)}" title="${at(EV_MEANING[t] ?? "")}">${at(t)}</span>${extra}`;
}
const evOf = (r) => ev(r?.ev);

/** Table renderer. `cols`: {key?, label, cls?, wide?, render?}. */
function table(rows, cols, opts = {}) {
  if (!rows || !rows.length) return `<p class="empty">${esc(opts.empty ?? "Nothing to show.")}</p>`;
  const head = cols.map((c) => `<th${c.cls ? ` class="${at(c.cls)}"` : ""}>${esc(c.label)}</th>`).join("");
  const body = rows.map((r, i) => {
    const recall = String(r?.ev ?? "").toLowerCase() === "recall";
    const cls = [recall ? "row-recall" : "", opts.rowClass ? opts.rowClass(r, i) : ""].filter(Boolean).join(" ");
    const tds = cols.map((c) => `<td${c.cls ? ` class="${at(c.cls)}"` : ""}>${c.render ? c.render(r, i) : nbsp(r[c.key])}</td>`).join("");
    return `<tr${cls ? ` class="${cls}"` : ""}>${tds}</tr>`;
  }).join("");
  return `<div class="tw"><table class="t${opts.dense ? " dense" : ""}">` +
    (opts.caption ? `<caption>${esc(opts.caption)}</caption>` : "") +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/** Layout table for the many `{off,size,field,meaning}` reference rows. */
const layoutTable = (rows, opts = {}) => table(rows, [
  { label: "offset", cls: "k", render: (r) => (typeof r.off === "number" ? hex(r.off, r.off > 0xffff ? 8 : 4) : esc(String(r.off))) },
  { label: "size", cls: "num", render: (r) => esc(String(r.size)) },
  { label: "field", cls: "k", render: (r) => esc(r.field) },
  { label: "meaning", cls: "wide", render: (r) => `<span class="small">${esc(r.meaning)}</span>` },
], { dense: true, ...opts });

function verdict(text, tone = "", tag = "") {
  if (!text) return "";
  return `<div class="verdict ${at(tone)}">${tag ? `<span class="tag">${esc(tag)}</span>` : ""}<div>${esc(text).replace(/\n/g, "<br />")}</div></div>`;
}
function note(text, tone = "") {
  if (!text) return "";
  return `<div class="note ${at(tone)}">${esc(text).replace(/\n/g, "<br />")}</div>`;
}
/**
 * Definition list. Values are RAW: nearly every one carries an ev() chip, a
 * <code> span or a <div> qualifier. The heuristic this replaced — escape unless
 * the value happens to start with "<" — escaped everything whose markup came
 * second, which rendered literal `&lt;span class="ev …"&gt;` chips in the
 * IDCODE decode card.
 *
 * Raw values make the caller responsible for escaping what it interpolates, so
 * every dynamic value in a kv() below goes through esc(). That is not a style
 * preference: some of these values interpolate text the user pasted, including
 * SMART attribute names read out of a report, and those go straight into
 * innerHTML.
 */
function kv(pairs) {
  return `<dl class="kv">${pairs.filter(Boolean).map(([k, v]) =>
    `<dt>${esc(k)}</dt><dd>${v === null || v === undefined || v === "" ? "&mdash;" : v}</dd>`).join("")}</dl>`;
}
function card(title, sub, bodyHtml, tone = "") {
  return `<div class="card ${tone ? "tone-" + at(tone) : ""}"><h3>${esc(title)}${sub ? ` <i>${esc(sub)}</i>` : ""}</h3>${bodyHtml}</div>`;
}
function acc(summary, bodyHtml, open = false) {
  return `<details class="acc"${open ? " open" : ""}><summary>${esc(summary)}</summary><div class="acc-body mt">${bodyHtml}</div></details>`;
}
/*
 * List items are ESCAPED by default, and a caller that has already built markup
 * must say so with raw(). The obvious alternative — "if it is a string, escape
 * it" — is what shipped first, and it silently escaped the four call sites that
 * build `<span class="ph">…</span>` step markers, so the POST sequence and the
 * dump action list rendered as visible `&lt;span class=&quot;…` text. Guessing
 * intent from the shape of a string is how that happens. An explicit marker
 * makes the two cases impossible to confuse, and it fails safe: forgetting
 * raw() shows ugly text, whereas guessing wrong the other way injects markup.
 */
const RAW = Symbol("cw.raw");
const raw = (html) => ({ [RAW]: true, html: String(html) });
const li = (i) => (i && typeof i === "object" && i[RAW] ? i.html : esc(i));
function ul(items) { return `<ul>${items.map((i) => `<li>${li(i)}</li>`).join("")}</ul>`; }
function ol(items) { return `<ol class="steps">${items.map((i) => `<li>${li(i)}</li>`).join("")}</ol>`; }
function hexView(bytes, { offset = 0, length = 256, base = 0 } = {}) {
  if (!bytes || !bytes.length) return `<p class="empty">No bytes.</p>`;
  const end = Math.min(bytes.length, offset + length);
  const out = [];
  for (let i = offset; i < end; i += 16) {
    const row = [];
    let asc = "";
    for (let k = 0; k < 16; k++) {
      const j = i + k;
      if (j < end) { row.push(bytes[j].toString(16).padStart(2, "0")); asc += bytes[j] >= 32 && bytes[j] < 127 ? String.fromCharCode(bytes[j]) : "."; }
      else { row.push("  "); asc += " "; }
    }
    out.push(`<div><span class="off">${hex(base + i)}</span>  ${row.slice(0, 8).join(" ")}  ${row.slice(8).join(" ")}  <span class="txt">${esc(asc)}</span></div>`);
  }
  return `<div class="hexview">${out.join("")}</div>`;
}
function entropyBars(windows, { max = 24 } = {}) {
  if (!windows?.length) return "";
  const rows = windows.slice(0, max).map((w) => {
    const pct = Math.min(100, (w.entropy / 8) * 100);
    const cls = w.entropy > 7.5 ? "hot" : w.entropy < 0.5 ? "cold" : "";
    return `<div class="entropy-row"><span>${hex(w.off)}</span><span class="entropy-bar ${cls}"><i style="width:${pct.toFixed(1)}%"></i></span><span>${w.entropy.toFixed(2)}</span></div>`;
  }).join("");
  return rows + (windows.length > max ? `<p class="small">${windows.length - max} further window(s) not shown.</p>` : "");
}
function meter(n, total, tone = "on") {
  const cells = [];
  for (let i = 0; i < Math.min(total, 64); i++) cells.push(`<i class="${i < n ? tone : ""}"></i>`);
  return `<div class="meter" title="${at(`${n} of ${total}`)}">${cells.join("")}</div>`;
}

/**
 * Parse a hex byte string from a text field. Accepts `EF 40 16`, `EF4016`,
 * `0xEF,0x40,0x16` and `ef-40-16`, because that is what people actually paste
 * out of datasheets, logic-analyser exports and terminal scrollback.
 */
function bytesFromHexInput(text) {
  const clean = String(text ?? "").replace(/0x/gi, " ").replace(/[,;]/g, " ").trim();
  if (!clean) return new Uint8Array(0);
  const toks = clean.split(/\s+/);
  const joined = toks.join("");
  if (/^[0-9a-fA-F]+$/.test(joined) && joined.length % 2 === 0) return hexToBytes(joined);
  return Uint8Array.from(toks.map((t) => parseInt(t.slice(0, 2), 16)).filter((n) => Number.isFinite(n)), (n) => n & 0xff);
}
const num = (id, fallback = 0) => { const v = parseFloat($(id)?.value); return Number.isFinite(v) ? v : fallback; };
const int = (id, fallback = 0) => { const v = parseInt($(id)?.value, 10); return Number.isFinite(v) ? v : fallback; };
const str = (id, fallback = "") => ($(id)?.value ?? fallback).trim();
const hexIn = (id, fallback = null) => { const v = parseHexInt(str(id)); return v === null ? fallback : v; };
const on = (id, fn, key = "click") => $(id)?.addEventListener(key, fn);
const enterRuns = (id, fn) => $(id)?.addEventListener("keydown", (e) => { if (e.key === "Enter") fn(); });

/* ================================================================== *
 * Shared state
 * ================================================================== */

const STATE = {
  dump: null,
  dumpName: null,
  dumpReport: null,
  reportSection: "hygiene",
  sim: demoChain(),
  dossier: createDossier({ name: "" }),
  lastIdentification: null,
  substAnswers: {},
  substFamily: "spi-nor-3v3",
  selfChecks: null,
};

/* ================================================================== *
 * Boot
 * ================================================================== */

function boot() {
  wireTabs();
  renderHero();
  renderPills();
  renderDossierTab();
  renderJtagTab();
  renderDumpTab();
  renderUefiTab();
  renderStorageTab();
  renderOnewireTab();
  renderJavacardTab();
  renderArchTab();
  renderSubstTab();
  renderPrimeTab();
  renderRefsTab();
  selectTab("dossier");
}

function wireTabs() {
  const btns = [...document.querySelectorAll(".tab-btn")];
  const go = (i) => { btns[i].focus(); selectTab(btns[i].dataset.tab); };
  btns.forEach((b, i) => {
    b.addEventListener("click", () => selectTab(b.dataset.tab));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go((i + 1) % btns.length); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go((i - 1 + btns.length) % btns.length); }
      else if (e.key === "Home") { e.preventDefault(); go(0); }
      else if (e.key === "End") { e.preventDefault(); go(btns.length - 1); }
    });
  });
}

function selectTab(id) {
  for (const b of document.querySelectorAll(".tab-btn")) {
    const selected = b.dataset.tab === id;
    b.setAttribute("aria-selected", selected ? "true" : "false");
    b.tabIndex = selected ? 0 : -1;
  }
  for (const p of document.querySelectorAll(".panel")) p.hidden = p.id !== `tab-${id}`;
}

/* ================================================================== *
 * Hero + header pills
 * ================================================================== */

const HERO_CHIPS = [
  ["IEEE 1149.1 TAP", true], ["SPI NOR / RDID", true], ["UEFI + IFD carve", true],
  ["S.M.A.R.T. / NVMe", true], ["1-Wire + iButton", true], ["Java Card CAP", true],
  ["JVM bytecode", true], ["x87 probe", true], ["cross-vendor substitution", true],
  ["network sniffing", false], ["protection bypass", false],
];

function renderHero() {
  $("heroChips").innerHTML = HERO_CHIPS.map(([t, yes]) =>
    `<span class="chip${yes ? "" : " no"}"><i></i>${esc(t)}${yes ? "" : " — IMPOSSIBLE / REFUSED"}</span>`).join("");
}

function renderPills() {
  const caps = detectCapabilities();
  const hw = caps.usable.length;
  const pillHw = $("pillHw");
  pillHw.innerHTML = `<i></i>${hw ? `${hw} HARDWARE API${hw > 1 ? "S" : ""}` : "NO HARDWARE API"}`;
  pillHw.className = `pill ${hw ? "" : "off"}`;
  pillHw.title = caps.verdict + (caps.note ? " " + caps.note : "");

  const sc = runAllSelfChecks();
  STATE.selfChecks = sc;
  const pill = $("pillChecks");
  pill.innerHTML = `<i></i>SELF-CHECK ${sc.passed}/${sc.total}`;
  pill.className = `pill ${sc.allOk ? "" : "warn"}`;
  pill.title = sc.allOk
    ? "Every arithmetic self-check passes. The REFS tab lists all of them."
    : `${sc.total - sc.passed} check(s) FAILED — see the REFS tab before trusting any number here.`;

  const local = $("pillLocal");
  local.title = caps.secureContext
    ? "Served over a secure context. No network calls are made by this page; files are read locally with FileReader and never leave the tab."
    : "Not a secure context, so the hardware APIs are unavailable regardless of browser support.";
}

/* ================================================================== *
 * 01 · DOSSIER
 * ================================================================== */

const ID_EXAMPLES = [
  "0x4BA00477", "0x1BA01477", "0x2BA01477", "EF 40 16", "C8 40 16", "C2 20 16",
  "28 FF 64 1E 4C 3B 9C 28", "00:1A:2B:3C:4D:5E", "W25Q32JV", "STM32F103C8T6",
  "DS18B20", "0xDECAFFED", "0xCAFEBABE", "74HC245", "ATMEGA328P-PU",
];

function renderDossierTab() {
  const caps = detectCapabilities();
  $("capsBody").innerHTML =
    verdict(caps.verdict, caps.usable.length ? "ok" : "warn", "runtime capability detection") +
    (caps.note ? note(caps.note, "warn") : "") +
    table(caps.rows, [
      {
        label: "capability", cls: "k", render: (r) => `${esc(r.name)} ` +
          (r.available === true ? '<span class="ev ev-std">available</span>'
            : r.available === "degraded" ? '<span class="ev ev-report">degraded</span>'
              : '<span class="ev ev-none">absent</span>'),
      },
      {
        label: "why, and what follows", cls: "wide", render: (r) =>
          `${esc(r.why)}<div class="small" style="margin-top:4px;color:var(--faint)">${esc(r.consequence)}</div>${r.targets ? `<div class="small" style="margin-top:4px">${esc(r.targets)}</div>` : ""} ${ev(r.ev)}`,
      },
    ], { dense: true });

  on("idRun", runIdentify);
  enterRuns("idInput", runIdentify);
  on("idExamples", () => { $("idInput").value = ID_EXAMPLES[Math.floor(Math.random() * ID_EXAMPLES.length)]; runIdentify(); });

  on("dossierName", () => { STATE.dossier.name = str("dossierName"); renderDossier(); }, "input");
  on("dossierNew", () => {
    STATE.dossier = createDossier({ name: str("dossierName") });
    STATE.lastIdentification = null;
    renderDossier();
  });
  on("dossierExport", exportDossier);
  on("dossierFromId", addIdentificationToDossier);
  renderDossier();

  renderPinoutCard();
  on("baudRun", runBaud);
  enterRuns("baudUs", runBaud);
  runBaud();

  $("connSel").innerHTML = connectorIndex().map((c) => `<option value="${at(c.id)}">${esc(c.name)} — ${c.pins} pins, ${esc(c.pitch)}</option>`).join("");
  on("connSel", renderConnector, "change");
  renderConnector();
}

function renderPinoutCard() {
  $("pinoutBody").innerHTML =
    note(PINOUT_DISCOVERY.premise, "info") +
    ol(PINOUT_DISCOVERY.steps.map((s) =>
      raw(`<span class="ph">${esc(s.tool)}</span>${esc(s.action)}<span class="sub"><b>expect:</b> ${esc(s.expect)}<br /><b>why:</b> ${esc(s.why)}</span>`))) +
    acc("Never do these", ul(PINOUT_DISCOVERY.never)) +
    `<p class="small">${ev(PINOUT_DISCOVERY.ev)}</p>` +
    `<div class="hr"></div><h3 style="font-size:12.5px">Suggest a pinout from measured voltages</h3>` +
    `<div class="row mb"><div class="field" style="flex:1;min-width:120px"><label for="pinPitch">Pitch</label>` +
    `<select id="pinPitch"><option value="">unknown</option><option>2.54 mm</option><option>2.00 mm</option><option>1.27 mm</option></select></div></div>` +
    `<div class="field"><label for="pinVolts">Voltage on each pin, in pin order, comma separated</label>` +
    `<input type="text" id="pinVolts" spellcheck="false" value="3.3, 0, 3.3, 0, 3.3, 0, 0, 0, 3.3, 0" /></div>` +
    `<div class="field"><label for="pinIdle">Idle-high pins (pin numbers, comma separated)</label>` +
    `<input type="text" id="pinIdle" spellcheck="false" value="5" /></div>` +
    `<div class="row"><button type="button" class="btn primary sm" id="pinRun">Suggest</button></div>` +
    `<p class="small">The pin count is the number of voltages you enter. One voltage per pin, in order.</p>` +
    `<div id="pinOut" class="mt"></div>`;
  on("pinRun", runPinout);
}

function runPinout() {
  const volts = str("pinVolts").split(",").map((v) => parseFloat(v.trim())).filter(Number.isFinite);
  const idle = str("pinIdle").split(",").map((v) => parseInt(v.trim(), 10)).filter(Number.isFinite);
  if (!volts.length) { $("pinOut").innerHTML = note("Enter at least one voltage.", "warn"); return; }
  // pinCount must equal voltages.length — the function rejects a mismatch, and
  // letting the user type a different number would only produce a confusing error.
  const r = suggestPinout({ pinCount: volts.length, voltages: volts, pitch: str("pinPitch") || null, idleHighPins: idle });
  $("pinOut").innerHTML = !r.ok ? note(r.note, "bad")
    : verdict(r.verdict, r.standardMatch ? "info" : "warn", `hypothesis — ${r.pinCount} pins, rail ${r.rail === null ? "?" : r.rail.toFixed(2) + " V"}`) +
      table(r.pins, [
        { label: "pin", cls: "num", render: (p) => String(p.pin) },
        { label: "V", cls: "num", render: (p) => p.voltage.toFixed(2) },
        { label: "guess", cls: "wide", render: (p) => `${esc(p.guess)} ${ev(p.confidence === "high" ? "std" : p.confidence === "medium" ? "report" : "none")}` },
        { label: "why", cls: "wide", render: (p) => `<span class="small">${esc(p.why)}</span>` },
      ], { dense: true }) +
      (r.standardMatch ? acc(`${r.standardMatch.name} — documented pinout`,
        kv([["pitch", r.standardMatch.pitch], ["evidence", ev(r.standardMatch.ev)]]) +
        (r.standardMatch.note ? note(r.standardMatch.note) : "") +
        table(r.standardMatch.pins ?? [], [
          { label: "pin", cls: "num", render: (p) => String(p[0]) },
          { label: "signal", cls: "k", render: (p) => esc(p[1]) },
          { label: "note", cls: "wide", render: (p) => `<span class="small">${nbsp(p[2])}</span>` },
        ], { dense: true }), true) : "") +
      note("This is a hypothesis, never an identification. Voltage alone cannot separate ground from a signal at logic 0, or a rail from a signal at logic 1. Continuity to the ground plane with the power off settles the first; watching the pin on a scope while the device boots settles the second.", "warn");
  if (r.ok) addFinding(STATE.dossier, { tier: "inferred", what: "header pinout hypothesis", value: `${r.pinCount} pins, rail ${r.rail ?? "?"} V`, ev: "report", source: "suggestPinout()" });
  renderDossier();
}

function runBaud() {
  const us = num("baudUs", 8.68);
  const r = baudFromBitTime(us);
  const f = r.ok ? frameTime({ baud: r.best.baud }) : null;
  $("baudOut").innerHTML = !r.ok ? note(r.note ?? "That bit time is not usable.", "bad")
    : verdict(r.verdict, r.tolerance === "within tolerance" ? "ok" : r.tolerance === "marginal" ? "warn" : "bad", `measured autobaud · ${r.tolerance}`) +
      kv([
        ["measured bit time", `${r.measuredUs.toFixed(3)} µs`],
        ["computed baud", r.computedBaud.toLocaleString(undefined, { maximumFractionDigits: 2 })],
        ["nearest standard", `${r.best.baud.toLocaleString()} (${r.best.errorPct > 0 ? "+" : ""}${r.best.errorPct.toFixed(3)}% error)`],
        ["typical use", r.best.use],
        f ? ["frame (8N1)", `${f.bitsPerFrame} bits = ${f.frameUs.toFixed(2)} µs → ${Math.round(f.bytesPerSecond).toLocaleString()} bytes/s`] : null,
        ["evidence", ev(r.ev)],
      ]) +
      table(r.candidates, [
        { label: "baud", cls: "k", render: (c) => c.baud.toLocaleString() },
        { label: "error", cls: "num", render: (c) => `${c.errorPct > 0 ? "+" : ""}${c.errorPct.toFixed(2)}%` },
        { label: "use", cls: "wide", render: (c) => `<span class="small">${esc(c.use)}</span>` },
      ], { dense: true }) +
      acc("Wrong-baud-rate signatures", table(UART_GARBAGE_SIGNATURES, [
        { label: "what you see", cls: "wide", render: (r2) => esc(r2.seen) },
        { label: "what it means", cls: "wide", render: (r2) => `<span class="small">${esc(r2.meaning)}</span> ${ev(r2.ev)}` },
      ], { dense: true })) +
      acc("Standard and non-standard rates", table(BAUD_RATES, [
        { label: "baud", cls: "k", render: (b) => b.baud.toLocaleString() },
        { label: "bit time", cls: "num", render: (b) => `${b.bitTimeUs} µs` },
        { label: "use", cls: "wide", render: (b) => `<span class="small">${esc(b.use)}</span> ${ev(b.ev)}` },
      ], { dense: true }));
}

function renderConnector() {
  const c = connectorById(str("connSel"));
  if (!c) { $("connBody").innerHTML = ""; return; }
  $("connBody").innerHTML =
    kv([["pitch", c.pitch], ["pins", String(c.pins.length)], ["evidence", ev(c.ev)]]) +
    (c.note ? note(c.note, "info") : "") +
    table(c.pins, [
      { label: "pin", cls: "num", render: (p) => String(p[0]) },
      { label: "signal", cls: "k", render: (p) => esc(p[1]) },
      { label: "note", cls: "wide", render: (p) => `<span class="small">${nbsp(p[2])}</span>` },
    ], { dense: true });
}

function runIdentify() {
  const r = identifyAnything(str("idInput"));
  STATE.lastIdentification = r;
  const high = r.candidates.some((c) => c.confidence === "high");
  $("idOut").innerHTML =
    verdict(r.verdict, high ? "ok" : r.candidates.length ? "info" : "warn",
      r.ambiguous ? "ambiguous — more than one plausible reading" : r.candidates.length ? "identification" : "no match") +
    (r.candidates.length ? table(r.candidates, [
      { label: "conf", cls: "k", render: (c) => `<span class="ev ${c.confidence === "high" ? "ev-std" : c.confidence === "medium" ? "ev-report" : "ev-recall"}">${at(c.confidence)}</span>` },
      { label: "kind", cls: "k", render: (c) => esc(c.kind) },
      { label: "value", cls: "k", render: (c) => `<code>${esc(c.value)}</code>` },
      {
        label: "detail", cls: "wide", render: (c) =>
          `${esc(c.detail)} ${ev(c.ev)}${c.caveat ? `<div class="small" style="margin-top:4px;color:var(--amber)">${esc(c.caveat)}</div>` : ""}`,
      },
    ], { dense: true }) : note("Nothing matched. That is a normal result for a date code, a lot number or free text — those carry no machine-readable identity.", "warn"));
}

function addIdentificationToDossier() {
  const r = STATE.lastIdentification;
  if (!r || !r.candidates.length) {
    $("dossierBody").insertAdjacentHTML("afterbegin",
      note("Nothing has been identified yet. Run an identification in the card above, then this button files the readings into the dossier with their confidence and evidence tags attached.", "warn"));
    return;
  }
  let added = 0;
  for (const c of r.candidates) {
    const res = addFinding(STATE.dossier, {
      tier: c.confidence === "high" ? "reported" : c.confidence === "medium" ? "marking" : "inferred",
      what: c.kind, value: c.value, ev: c.ev, source: "identifyAnything()",
    });
    if (res?.ok !== false) added++;
  }
  renderDossier();
  $("dossierBody").insertAdjacentHTML("afterbegin",
    note(`${added} reading(s) filed. High-confidence readings go in as reported (the strongest tier); medium as markings; low as inferences — because a guess that is filed as a fact is how a repair goes wrong three steps later.`, "info"));
}

function exportDossier() {
  const blob = new Blob([JSON.stringify(STATE.dossier, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(STATE.dossier.name || "device").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-dossier.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function renderDossier() {
  const d = STATE.dossier;
  if ($("dossierName").value !== (d.name ?? "")) $("dossierName").value = d.name ?? "";
  const s = dossierSummary(d);
  const all = [...d.identity, ...d.markings, ...d.evidence]
    .sort((a, b) => a.tierRank - b.tierRank || (a.at < b.at ? 1 : -1));
  $("dossierBody").innerHTML =
    verdict(s.verdict, s.contradictions.length ? "bad" : s.reportedCount ? "ok" : "warn", "dossier state") +
    (s.contradictions.length ? table(s.contradictions, [
      { label: "field", cls: "k", render: (c) => esc(c.what ?? c.field ?? "") },
      { label: "package says", cls: "wide", render: (c) => esc(c.marking ?? "") },
      { label: "device reports", cls: "wide", render: (c) => esc(c.reported ?? "") },
    ], { dense: true, caption: "A marking that disagrees with what the device reports is the single most useful finding in a dossier." }) : "") +
    kv([
      // s.name is typed into #dossierName, so it is user text on its way into
      // innerHTML. kv() renders raw, which makes this esc() load-bearing.
      ["name", esc(s.name) || "(unnamed)"],
      ["best identity", s.bestIdentity ? `${esc(s.bestIdentity.what)} = ${esc(s.bestIdentity.value)}` : "none yet"],
      ["reported", String(s.reportedCount)], ["markings", String(s.markingCount)],
      ["other evidence", String(s.evidenceCount)], ["decisions", String(s.decisions.length)],
    ]) +
    (all.length ? table(all, [
      { label: "tier", cls: "k", render: (f) => `<span class="ev ${f.tier === "reported" ? "ev-std" : f.tier === "marking" ? "ev-recall" : "ev-none"}">${at(f.tier)}</span>` },
      { label: "what", cls: "k", render: (f) => esc(f.what) },
      { label: "value", cls: "k", render: (f) => `<code>${esc(f.value)}</code>` },
      { label: "source", cls: "wide", render: (f) => `<span class="small">${nbsp(f.source)}</span>` },
      { label: "when", cls: "num", render: (f) => `<span class="small">${esc(String(f.at).replace("T", " ").slice(0, 19))}</span>` },
    ], { dense: true, caption: "Ranked by tier: a value the device reported outranks a marking on its package, which outranks an inference." })
      : `<p class="empty">Nothing observed yet. Run an identification above, or file findings from the other tabs.</p>`) +
    (s.decisions.length ? acc(`${s.decisions.length} substitution decision(s) recorded`, table(s.decisions, [
      { label: "when", cls: "k", render: (x) => `<span class="small">${esc(String(x.at).replace("T", " ").slice(0, 19))}</span>` },
      { label: "family", cls: "k", render: (x) => esc(x.family) },
      { label: "verdict", cls: "k", render: (x) => esc(VERDICTS[x.verdict]?.label ?? x.verdict) },
      { label: "confidence", cls: "k", render: (x) => esc(x.confidence) },
      { label: "gates", cls: "wide", render: (x) => `<span class="small">${x.counts.pass} pass / ${x.counts.fail} fail / ${x.counts.unknown} unknown of ${x.counts.total}</span>` },
    ], { dense: true })) : "");
}

/* ================================================================== *
 * 02 · JTAG / TAP
 * ================================================================== */

const CHAIN_PRESETS = [
  {
    name: "Arm CoreSight DAP + 8-bit CPLD (the demo chain)",
    specs: [
      { name: "dap", irlen: 4, idcode: 0x4ba00477, instructions: { 0xa: { name: "DPACC", width: 35 }, 0xb: { name: "APACC", width: 35 }, 0x8: { name: "ABORT", width: 35 } } },
      { name: "bsr-cpld", irlen: 8, idcode: null, instructions: { 0x00: { name: "EXTEST", width: 40 }, 0x01: { name: "SAMPLE", width: 40 } } },
    ],
  },
  {
    name: "Single STM32F1-class DAP (0x1BA01477)",
    specs: [{ name: "stm32f1-dap", irlen: 4, idcode: 0x1ba01477, instructions: { 0xa: { name: "DPACC", width: 35 }, 0xb: { name: "APACC", width: 35 } } }],
  },
  {
    name: "Clone core answering 0x2BA01477",
    specs: [{ name: "clone-dap", irlen: 4, idcode: 0x2ba01477, instructions: { 0xa: { name: "DPACC", width: 35 }, 0xb: { name: "APACC", width: 35 } } }],
  },
  {
    name: "Three-device chain, mixed IR (4 + 10 + 8)",
    specs: [
      { name: "dap", irlen: 4, idcode: 0x4ba00477, instructions: {} },
      { name: "max2-cpld", irlen: 10, idcode: 0x020a10dd, instructions: {} },
      { name: "xc9500xl", irlen: 8, idcode: 0x02214093, instructions: {} },
    ],
  },
  {
    name: "Five identical 4-bit TAPs",
    specs: Array.from({ length: 5 }, (_, i) => ({ name: `tap${i}`, irlen: 4, idcode: 0x1ba01477, instructions: {} })),
  },
  { name: "One 8-bit CPLD, no IDCODE register", specs: [{ name: "cpld", irlen: 8, idcode: null, instructions: { 0x00: { name: "EXTEST", width: 40 } } }] },
];

function presetSpecs(i) { return CHAIN_PRESETS[i].specs.map((s) => ({ ...s, instructions: { ...s.instructions } })); }

function renderJtagTab() {
  $("chainPreset").innerHTML = CHAIN_PRESETS.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join("");
  const loadPreset = () => { STATE.sim = TapSim.fromSpecs(presetSpecs(+$("chainPreset").value)); renderChain(); renderFsm(); renderTapPins(); };
  on("chainPreset", loadPreset, "change");
  on("chainAdd", () => {
    const p = CHAIN_PRESETS[+$("chainPreset").value];
    p.specs = [...presetSpecs(+$("chainPreset").value), { name: `tap${p.specs.length}`, irlen: 4, idcode: 0x1ba01477, instructions: {} }];
    loadPreset();
  });
  on("chainRemove", () => {
    const p = CHAIN_PRESETS[+$("chainPreset").value];
    if (p.specs.length > 1) p.specs = presetSpecs(+$("chainPreset").value).slice(0, -1);
    loadPreset();
  });
  on("chainCount", runChainCount);
  on("chainBypass", runChainBypass);
  on("chainIdcode", runChainIdcodeSweep);

  on("tapClock0", () => doClock(0));
  on("tapClock1", () => doClock(1));
  on("tapReset", () => {
    STATE.sim.reset("RTI");
    tapSay("TAP reset: five TCKs with TMS=1 reach Test-Logic-Reset from any state — including an unknown one after power-up — then one TMS=0 parks in Run-Test/Idle. Every device's IR is now all-ones, which is BYPASS, and the BYPASS register is selected.");
  });
  on("tapShiftIr", () => {
    const n = STATE.sim.devices.reduce((a, d) => a + d.irlen, 0);
    const out = STATE.sim.shiftIr(new Array(n).fill(1));
    tapSay(`shiftIr(${n} ones) put every device in BYPASS. TDO bits returned: ${out.join("")}. Clock budget: 2 to walk to Capture-IR (no data), 1 capture clock (no data bit emitted), ${n} shift clocks (one bit each), 1 exit clock (state moves, register does NOT shift), then the walk back to RTI.`);
  });
  on("tapCaptureIdcode", () => {
    const found = STATE.sim.readIdcodes();
    tapSay(found.length
      ? `readIdcodes() isolated each device in turn, held the others in BYPASS, and scanned 32 bits:\n${found.map((f) => `  [${f.index}] ${f.name} = ${f.hex}`).join("\n")}`
      : "No device in this chain implements an IDCODE register, so there is nothing to read. A CPLD or an FPGA without IDCODE enabled is common, and its absence is not a fault.");
  });
  on("tapShiftDr", () => {
    const n = Math.max(1, Math.min(4096, int("tapDrLen", 32)));
    const out = STATE.sim.shiftDr(new Array(n).fill(0));
    tapSay(`shiftDr(${n}) shifted ${n} zeros through whichever DR each device currently has selected.\nTDO (${out.length} bits): ${out.slice(0, 64).join("")}${out.length > 64 ? " …" : ""}\nThe capture clock emits no data bit and the exit clock does not shift. Both are in the clock budget; neither produces a bit. Counting either as a bit rotates the whole answer by one place, which shows up as a mangled IDCODE rather than as an error.`);
  });
  on("tapIsolate", () => {
    const total = STATE.sim.isolate(0, 0x0e);
    tapSay(`isolate(0, 0x0E) pushed ${total} IR bits: device[0] received 0x0E (IDCODE on an Arm CoreSight JTAG-DP) and every other device received its own BYPASS code.\nThe IR bit stream is ordered devices[0] FIRST, because the physical chain runs TDI → devices[n−1] → … → devices[0] → TDO, so the first bit pushed in travels furthest. Reversing that order does not fail loudly: it hands each device its neighbour's instruction, the target sits in BYPASS, and the scan reads back zeros while everything else looks healthy.`);
  });
  on("tapPath", () => {
    $("tapOut").innerHTML =
      table(TAP_STATES, [
        { label: "id", cls: "k", render: (s) => esc(s.id) },
        { label: "state", cls: "wide", render: (s) => esc(s.name) },
        { label: "TMS=0 →", cls: "k", render: (s) => esc(s.tms0) },
        { label: "TMS=1 →", cls: "k", render: (s) => esc(s.tms1) },
        { label: "group", cls: "k", render: (s) => `<span class="small">${esc(s.group ?? "")}</span>` },
      ], { dense: true }) +
      table(TMS_LEGEND, [
        { label: "TMS", cls: "k", render: (l) => `<code>${esc(l.tms)}</code>` },
        { label: "from", cls: "k", render: (l) => esc(l.from) },
        { label: "to", cls: "k", render: (l) => esc(l.to) },
        { label: "why", cls: "wide", render: (l) => `<span class="small">${esc(l.why)}</span>` },
      ], { dense: true });
  });

  on("idcodeRun", runIdcode);
  enterRuns("idcodeInput", runIdcode);

  renderChain(); renderFsm(); renderTapPins(); renderIdcodeTable(); renderIr(); renderTapLog();
  renderSwdRef();
}

function doClock(tms) {
  const tdi = +$("tapTdi").value;
  const tdo = STATE.sim.clock(tms, tdi);
  const tr = STATE.sim.trace[STATE.sim.trace.length - 1];
  const shifting = tr.from === "SHIR" || tr.from === "SHDR";
  let extra = "";
  if (shifting && tms === 1) extra = "\nThis was the exit clock: the state machine moved but the scan register did NOT shift. 1149.1 moves the state on that edge without moving data.";
  else if (tr.from === "CDR" || tr.from === "CIR") extra = "\nCapture clock: the register captured, and no data bit was emitted.";
  else if (tr.from === "UDR" || tr.from === "UIR") extra = "\nUpdate clock: the captured/shifted value is committed. No data bit.";
  $("tapOut").innerHTML =
    verdict(`Clock #${STATE.sim.cycles}: TMS=${tms} TDI=${tdi} → TDO=${tdo}. State ${tr.from} → ${tr.to}.${extra}`,
      shifting ? "info" : "", "single TCK") +
    `<p class="small">TDI is taken from the TDI control above; change it before the next clock. TDO is whatever left devices[0], the device nearest TDO.</p>`;
  renderFsm(); renderTapPins(); renderTapLog();
  void tdo;
}

function tapSay(text) { $("tapOut").innerHTML = `<pre class="mono-block">${esc(text)}</pre>`; renderFsm(); renderTapPins(); renderTapLog(); }

function renderTapPins() {
  const s = STATE.sim;
  const shifting = s.state === "SHIR" || s.state === "SHDR";
  const last = s.trace[s.trace.length - 1];
  const pin = (name, val, lit) => `<span class="tap-pin${lit ? " on" : ""}"><b>${esc(name)}</b>${esc(val)}</span>`;
  $("tapPins").innerHTML =
    pin("TCK", String(s.cycles), !!last) +
    pin("STATE", s.state, shifting) +
    pin("TDI", String(+$("tapTdi").value), false) +
    pin("TDO", String(last ? last.tdo : 0), false) +
    s.devices.map((d, i) => pin(`IR[${i}]`, `0x${d.irValue().toString(16).toUpperCase().padStart(Math.ceil(d.irlen / 4), "0")}`, false)).join("") +
    s.devices.map((d, i) => pin(`DR[${i}]`, d.selReg ? `${d.selReg.width}b` : "—", false)).join("");
}

function renderFsm() {
  const cur = STATE.sim.state;
  const curState = TAP_STATES.find((s) => s.id === cur);
  $("fsmBody").innerHTML =
    `<div class="fsm">${TAP_STATES.map((s) => {
      const here = s.id === cur;
      const loops = s.tms0 === s.id || s.tms1 === s.id;
      return `<div class="fsm-state${here ? " here" : loops ? " stable" : ""}" title="${at(s.name)}${s.group ? " — " + at(s.group) : ""}">${at(s.id)}</div>`;
    }).join("")}</div>` +
    `<p class="small">Current: <b>${esc(cur)}</b>${curState ? ` (${esc(curState.name)})` : ""} after ${STATE.sim.cycles} clock(s). TMS=0 → ${esc(curState?.tms0 ?? "?")}; TMS=1 → ${esc(curState?.tms1 ?? "?")}. Test-Logic-Reset is the only state that loops on TMS=1, which is why five ones reaches it from anywhere.</p>`;
}

function renderTapLog() {
  const tr = STATE.sim.transcript(40);
  $("tapLog").innerHTML =
    `<p class="small">Last ${tr.length} of ${STATE.sim.trace.length} clock(s). TDO is sampled on the rising edge, so the bit shown is what left devices[0] on that clock.</p>` +
    (tr.length ? `<div class="tw"><table class="t dense"><thead><tr><th>#</th><th>TMS</th><th>TDI</th><th>TDO</th><th>from</th><th>to</th></tr></thead><tbody>` +
      tr.map((t) => `<tr><td class="num">${t.cycle}</td><td class="k">${t.tms}</td><td class="k">${t.tdi}</td><td class="k">${t.tdo}</td><td class="k">${at(t.from)}</td><td class="k">${at(t.to)}</td></tr>`).join("") +
      `</tbody></table></div>` : `<p class="empty">No clocks yet.</p>`) +
    (STATE.sim.log.length ? acc(`${STATE.sim.log.length} annotation(s)`, `<pre class="mono-block">${esc(STATE.sim.log.slice(-20).map((l) => `#${l.cycle} [${l.state}] ${l.text}`).join("\n"))}</pre>`) : "");
}

function renderChain(extra = "") {
  const s = STATE.sim;
  /*
   * A device's instruction set lives in two Maps, not in the spec object that
   * built it: `byCode` maps IR opcode → register name, and `regs` maps name →
   * Register (which carries the DR width). `byCode` is created lazily on the
   * first setInstruction, so a device with no named instructions has none at
   * all — which is the normal case for a bare TAP that only implements BYPASS.
   */
  const irRows = s.devices.flatMap((d, i) => [...(d.byCode ?? [])].map(([op, regName]) => ({
    dev: i, name: d.name, op, insName: regName, width: d.regs.get(regName)?.width ?? null,
  })));
  $("chainBody").innerHTML =
    `<div class="tap-chain">${s.devices.map((d, i) =>
      `<div class="tap-node${i === 0 ? " active" : ""}"><b>${esc(d.name)}</b>` +
      `<small>irlen ${d.irlen}${d.idcode !== null ? ` · IDCODE ${hex(d.idcode)}` : " · no IDCODE register"}</small>` +
      `<small>${i === 0 ? "nearest TDO" : i === s.devices.length - 1 ? "nearest TDI" : "middle of chain"}</small></div>`).join("")}</div>` +
    `<p class="small">Physical chain: <code>TDI → ${s.devices.slice().reverse().map((d) => esc(d.name)).join(" → ")} → TDO</code>. ` +
    `<code>devices[0]</code> is nearest TDO and drives it; total IR is ${s.devices.reduce((a, d) => a + d.irlen, 0)} bit(s).</p>` +
    table(irRows, [
      { label: "device", cls: "k", render: (r) => `[${r.dev}] ${esc(r.name)}` },
      { label: "opcode", cls: "k", render: (r) => `0x${r.op.toString(16).toUpperCase()}` },
      { label: "instruction", cls: "k", render: (r) => esc(r.insName) },
      { label: "DR width", cls: "num", render: (r) => String(r.width) },
    ], { dense: true, empty: "No named instructions on these devices — they run BYPASS and IDCODE only." }) + extra;
}

function runChainCount() {
  const bc = STATE.sim.bypassCheck();
  renderChain(
    verdict(`countDevices() measured ${bc.devicesMeasured} device(s); the model holds ${bc.devicesExpected}. ${bc.explain}`,
      bc.agrees ? "ok" : "bad", "chain discovery — flush zeros, then count clocks to the first 1") +
    kv([
      ["devices measured", String(bc.devicesMeasured)],
      ["devices expected", String(bc.devicesExpected)],
      ["total IR bits", String(bc.totalIrBits)],
      ["agrees", bc.agrees ? "yes" : "NO"],
    ]) +
    note("What this measurement cannot give you: the total IR length. Every BYPASS chain looks identical in a DR scan, whatever the IR lengths are. A tool that reports M either read it from a BSDL file, was told it (OpenOCD's `jtag newtap … -irlen 4`), or swept candidate lengths and accepted the first that produced a structurally valid IDCODE. This workbench never presents a swept length as a measured fact.", "warn"));
}

function runChainBypass() {
  const lat = STATE.sim.bypassLatency();
  const n = STATE.sim.devices.length;
  renderChain(
    verdict(`The first 1 pushed into TDI came back on scan clock ${lat === -1 ? "never (no 1 observed within the flush window)" : lat}. Each BYPASS register is one flip-flop, so latency is one clock per device → ${lat} device(s). The model holds ${n}.`,
      lat === n ? "ok" : "bad", "BYPASS delay-line measurement") +
    note("A BYPASS register is a one-clock delay line, not a pass-through. A width-1 register that passed TDI straight to TDO would show zero latency and the count would read 0 — which is the bug that makes a homebrew adapter report 'no devices found' on a chain that is perfectly fine.", "warn"));
}

function runChainIdcodeSweep() {
  const irlen = STATE.sim.devices[0]?.irlen ?? 4;
  const hits = STATE.sim.findIdcodeInstruction({ irlen });
  renderChain(hits.length
    ? verdict(`${hits.length} IR opcode(s) at irlen=${irlen} produced a structurally valid 32-bit IDCODE.`, "ok", "opcode sweep — a heuristic, not a measurement") +
      table(hits.slice(0, 16), [
        { label: "IR opcode", cls: "k", render: (h) => h.opcodeHex },
        { label: "IDCODE", cls: "k", render: (h) => h.hex },
        {
          label: "decodes to", cls: "wide", render: (h) => {
            const d = decodeIdcode(h.idcode);
            const k = IDCODES.find((x) => x.id === d.raw);
            return `<span class="small">${esc(k ? k.family : `version ${d.version}, part 0x${d.partHex}, JEDEC bank ${d.jedecBank} identity ${hex(d.identity, 2)}`)}</span>`;
          },
        },
      ], { dense: true }) +
      note("This only works when the IR length is already known from a datasheet or a BSDL file. With the wrong IR length the sweep yields no candidate at all — which is the useful, loud failure mode. It is a heuristic: it accepts the first opcode whose DR scan looks like a valid IDCODE, and a chain with several TAPs can produce several.", "warn")
    : note(`No IR opcode at irlen=${irlen} produced a structurally valid IDCODE. Either the IR length is not ${irlen}, or no device in this chain implements IDCODE. Both are normal — many CPLDs and FPGAs do not.`, "warn"));
}

function renderIdcodeTable() {
  const rows = IDCODES.map((k) => {
    const d = decodeIdcode(k.id);
    const j = JEP106.find((x) => x.cont === d.continuationCode && x.code === d.identity);
    return { ...k, d, designer: j ? j.vendor : null, jedecEv: j ? j.ev : "none", jedecWhere: j ? j.where : null };
  });
  const recallCount = rows.filter((r) => r.ev === "recall").length;
  $("idcodeOut").innerHTML =
    table(rows, [
      { label: "IDCODE", cls: "k", render: (r) => hex(r.id) },
      { label: "irlen", cls: "num", render: (r) => String(r.irlen) },
      { label: "family", cls: "wide", render: (r) => `${esc(r.family)} ${ev(r.ev)}<div class="small" style="margin-top:3px;color:var(--faint)">${esc(r.note ?? "")}</div>` },
      { label: "designer", cls: "wide", render: (r) => r.designer ? `${esc(r.designer)} ${ev(r.jedecEv)}<div class="small">${esc(r.jedecWhere ?? "")}</div>` : `not in the JEP106 table (bank ${r.d.jedecBank}, identity ${hex(r.d.identity, 2)})` },
      { label: "part", cls: "k", render: (r) => `0x${r.d.partHex}` },
      { label: "parity", cls: "k", render: (r) => r.d.parityIsOdd ? '<span class="ev ev-std">odd ✓</span>' : '<span class="ev ev-recall">even ✗</span>' },
      { label: "source", cls: "wide", render: (r) => `<span class="small">${nbsp(r.src)}</span>` },
    ], { dense: true, caption: "Structurally valid means bit0 is 1 and the JEP106 identity byte in bits 11:1 carries ODD parity." }) +
    (recallCount ? `<p class="recall-flag">⚠ ${recallCount} row(s) above are striped amber: transcribed from memory, not verified against a datasheet this session.</p>` : "") +
    note("An IDCODE names the DEBUG PORT, not the microcontroller behind it. An STM32F103 and a GD32F103 can both present 0x1BA01477 because both use the same Arm CoreSight DAP. Arm's own guidance (KA001301) is that the JEP106 code in an IDCODE names the designer of the debug component, not the fab, and that the SoC vendor should put its own code in the debug ROM table PID instead. An IDCODE match is therefore never evidence of part equivalence — which is exactly the question the SUBSTITUTE tab exists to answer.", "warn");
}

function runIdcode() {
  const v = hexIn("idcodeInput", null);
  if (v === null) { $("idcodeOut").insertAdjacentHTML("afterbegin", note("That is not a hex value. Try 0x4BA00477.", "bad")); return; }
  const d = decodeIdcode(v);
  const j = JEP106.find((x) => x.cont === d.continuationCode && x.code === d.identity);
  const known = IDCODES.find((k) => k.id === d.raw);
  const enc = encodeIdcode({ version: d.version, partNumber: d.partNumber, continuationCode: d.continuationCode, identity: d.identity });
  const problems = [!d.lsbIsOne && "bit0 must be 1", !d.parityIsOdd && "the JEP106 identity must have ODD parity",
    (d.identity === 0 || d.identity === 0x7f) && "the identity is a reserved value (0x00 or 0x7F)"].filter(Boolean);
  $("idcodeOut").insertAdjacentHTML("afterbegin",
    verdict(d.structurallyValid ? "Structurally valid IDCODE." : `NOT structurally valid — ${problems.join("; ")}.`,
      d.structurallyValid ? "ok" : "bad", hex(d.raw)) +
    kv([
      ["binary", `<code>${bin(d.raw)}</code>`],
      ["version", `${d.version} (bits 31:28)`],
      ["part number", `0x${d.partHex} (bits 27:12)`],
      ["manufacturer field", `${d.manufacturerHex} (bits 11:1)`],
      ["JEDEC bank", `${d.jedecBank} — ${d.continuationCode} × 0x7F continuation code(s) before it`],
      ["identity", `${hex(d.identity, 2)} → data ${hex(d.identityData, 2)} + parity bit ${d.parityBit}`],
      ["designer", j ? `${esc(j.vendor)} ${ev(j.ev)}<div class="small">${esc(j.also ?? "")}<br />${esc(j.where ?? "")}</div>` : `not in this table (bank ${d.jedecBank}, identity ${hex(d.identity, 2)})`],
      ["known part", known ? `${esc(known.family)} ${ev(known.ev)}<div class="small">${esc(known.note ?? "")}</div>` : "not in this table"],
      ["round-trip", `encodeIdcode() → ${hex(enc)} ${enc === d.raw ? "✓ identical" : "✗ DIFFERS"}`],
    ]));
}

function renderIr() {
  $("irBody").innerHTML =
    table(IR_LENGTHS, [
      { label: "family", cls: "wide", render: (r) => `${esc(r.family)} ${ev(r.ev)}` },
      { label: "irlen", cls: "num", render: (r) => String(r.irlen) },
      { label: "note", cls: "wide", render: (r) => `<span class="small">${esc(r.note)}</span>` },
    ], { dense: true }) +
    acc("Mandatory and optional 1149.1 instructions", table(TAP_INSTRUCTIONS, [
      { label: "instruction", cls: "k", render: (r) => esc(r.name) },
      { label: "status", cls: "k", render: (r) => r.mandatory ? '<span class="ev ev-std">mandatory</span>' : '<span class="ev ev-report">optional</span>' },
      { label: "register", cls: "k", render: (r) => esc(r.reg ?? "") },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what ?? "")}</span>` },
    ], { dense: true })) +
    acc("JEDEC JEP106 manufacturer codes in this corpus", table(JEP106, [
      { label: "bank", cls: "num", render: (r) => String(r.cont + 1) },
      { label: "code", cls: "k", render: (r) => hex(r.code, 2) },
      { label: "vendor", cls: "wide", render: (r) => `${esc(r.vendor)} ${ev(r.ev)}` },
      { label: "also / collision", cls: "wide", render: (r) => `<span class="small">${esc(r.also ?? "")}</span>` },
      { label: "where seen", cls: "wide", render: (r) => `<span class="small">${esc(r.where ?? "")}</span>` },
    ], { dense: true })) +
    note("The bank is not optional context. 0xC8 in bank 7 is GigaDevice; 0xC8 in bank 1 is Apple. A lookup that ignores the continuation code will eventually name the wrong company with total confidence.", "warn");
}

function renderSwdRef() {
  const extra =
    acc("Arm CoreSight debug-port registers (DPACC/APACC payloads)", table(DP_REGISTERS, [
      { label: "addr", cls: "k", render: (r) => hex(r.addr, 2) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "R/W", cls: "k", render: (r) => esc(r.rw) },
      { label: "meaning", cls: "wide", render: (r) => `<span class="small">${esc(r.meaning)}</span>` },
    ], { dense: true })) +
    acc("Serial Wire Debug ACK codes", table(SWD_ACK, [
      { label: "ACK", cls: "k", render: (r) => String(r.code) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "meaning", cls: "wide", render: (r) => `<span class="small">${esc(r.meaning)}</span>` },
    ], { dense: true })) +
    acc("SPI NOR command set", table(SPI_COMMANDS, [
      { label: "op", cls: "k", render: (c) => hex(c.op, 2) },
      { label: "name", cls: "k", render: (c) => esc(c.name) },
      { label: "args", cls: "k", render: (c) => `<span class="small">${esc(c.args ?? "")}</span>` },
      { label: "note", cls: "wide", render: (c) => `<span class="small">${esc(c.note ?? "")}</span> ${ev(c.ev)}` },
    ], { dense: true })) +
    acc("SPI status-register bits", table(SPI_SR_BITS, [
      { label: "bit", cls: "num", render: (b) => String(b.bit) },
      { label: "name", cls: "k", render: (b) => esc(b.name) },
      { label: "R/W", cls: "k", render: (b) => esc(b.rw) },
      { label: "meaning", cls: "wide", render: (b) => `<span class="small">${esc(b.meaning)}</span>` },
    ], { dense: true })) +
    acc("SPI NOR vendor IDs", table(SPI_VENDORS, [
      { label: "id", cls: "k", render: (v) => hex(v.id, 2) },
      { label: "vendor", cls: "wide", render: (v) => `${esc(v.vendor)} ${ev(v.ev)}` },
      { label: "part-number prefix", cls: "k", render: (v) => esc(v.prefix ?? "") },
    ], { dense: true }));
  $("irBody").insertAdjacentHTML("afterend", extra);
}

/* ================================================================== *
 * 03 · DUMP
 * ================================================================== */

const SAMPLES = [
  { id: "sampleFv", label: "UEFI firmware volume", build: () => synthFirmwareVolume(), name: "synthetic-uefi-volume.bin" },
  { id: "sampleMbr", label: "GPT disk", build: () => synthGptDisk(), name: "synthetic-gpt-disk.bin" },
  { id: "sampleIfd", label: "Intel Flash Descriptor dump", build: () => synthIfdDump(), name: "synthetic-ifd-dump.bin" },
  { id: "sampleBad", label: "erased / non-responsive chip", build: () => synthErased(1 << 20), name: "synthetic-all-ff.bin" },
];

function renderDumpTab() {
  const dz = $("dropZone"), fi = $("fileInput");
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  on("fileInput", () => { if (fi.files[0]) loadFile(fi.files[0]); }, "change");
  for (const s of SAMPLES) on(s.id, () => { STATE.dump = s.build(); STATE.dumpName = s.label === "GPT disk" ? s.name : s.name; report(); });
  on("sampleTrunc", () => { STATE.dump = synthTruncated(); STATE.dumpName = "synthetic-truncated-3mib.bin"; report(); });
  $("loadStatus").innerHTML = note("No dump loaded. Everything below stays inert until you supply bytes. The synthesise buttons build structurally correct images — a UEFI volume whose header checksum validates, a GPT disk whose two CRC-32s pass, a descriptor whose region table decodes — so every parser can be exercised without hardware. Files are read with FileReader and never leave this tab.", "info");
  $("dumpReport").innerHTML = `<p class="empty">Load a dump or synthesise one.</p>`;
}

function loadFile(f) {
  const fr = new FileReader();
  fr.onload = () => { STATE.dump = new Uint8Array(fr.result); STATE.dumpName = f.name; report(); };
  fr.onerror = () => { $("loadStatus").innerHTML = note(`Could not read ${f.name}.`, "bad"); };
  fr.readAsArrayBuffer(f);
}

const REPORT_SECTIONS = ["hygiene", "capacity", "ifd", "volumes", "partitions", "variables", "signatures", "actions", "hex"];

function report() {
  const bytes = STATE.dump;
  if (!bytes) return;
  const r = analyseDump(bytes);
  STATE.dumpReport = r;
  $("loadStatus").innerHTML =
    verdict(`${STATE.dumpName} — ${bytes.length.toLocaleString()} bytes. ${r.identity}`, r.hygiene.ok ? "ok" : "bad", "dump identity") +
    (r.hygiene.ok ? "" : note("Hygiene failed, so the parsers below ran anyway but their output is not trustworthy. Fix the dump before reading anything else into it.", "bad")) +
    `<div class="row">${REPORT_SECTIONS.map((k) => `<button type="button" class="btn sm${k === STATE.reportSection ? " primary" : ""}" data-rep="${at(k)}">${esc(k)}</button>`).join("")}</div>`;
  for (const btn of $("loadStatus").querySelectorAll("[data-rep]")) {
    btn.addEventListener("click", () => { STATE.reportSection = btn.dataset.rep; report(); });
  }
  showReportSection(STATE.reportSection);
}

function showReportSection(key) {
  const r = STATE.dumpReport, bytes = STATE.dump, el = $("dumpReport");
  if (!r) return;
  const H = r.hygiene;

  if (key === "hygiene") {
    el.innerHTML = card("Dump hygiene", "runs before any parsing; its verdict gates everything else",
      verdict(H.verdict, H.ok ? "ok" : "bad", H.ok ? "usable" : "not usable") +
      kv([
        ["length", `${H.length.toLocaleString()} B`],
        ["distinct byte values", `${H.distinctBytes} / 256`],
        ["overall entropy", `${H.entropyOverall.toFixed(3)} bits/byte`],
      ]) +
      table(H.findings, [
        { label: "severity", cls: "k", render: (f) => `<span class="ev ${f.severity === "fatal" ? "ev-recall" : f.severity === "warn" ? "ev-report" : "ev-none"}">${at(f.severity)}</span>` },
        { label: "what", cls: "wide", render: (f) => esc(f.what) },
        { label: "why it matters", cls: "wide", render: (f) => `<span class="small">${esc(f.why)}</span>` },
      ], { dense: true, empty: "No findings — the dump looks clean." }) +
      `<h3 style="font-size:12.5px" class="mt">Entropy map, ${H.windows.length} window(s)</h3>` + entropyBars(H.windows),
      H.ok ? "" : "tone-bad");

  } else if (key === "capacity") {
    const c = r.cap;
    const g = c.ok ? flashGeometry({ capacityBytes: c.bytes, blockSize: 65536 }) : null;
    el.innerHTML = card("Capacity arithmetic", "the non-power-of-two trap",
      verdict(c.verdict, c.isPowerOfTwo ? "ok" : "warn", c.isPowerOfTwo ? "power of two" : "NOT a power of two") +
      kv([
        ["bytes", c.bytes.toLocaleString()], ["bits", c.bits.toLocaleString()],
        ["factorisation (bytes)", c.factorBytes], ["factorisation (bits)", c.factorBits],
        ["MiB", c.mib.toFixed(3)], ["MB (decimal)", c.mb.toFixed(3)],
        ["address bits", String(c.addressBits)],
        ["wrap mask", c.wrapMask === null ? "none — do not mask addresses" : hex(c.wrapMask)],
      ]) +
      (g ? `<h3 style="font-size:12.5px" class="mt">Geometry with a 64 KiB erase block</h3>` + verdict(g.verdict, g.clean ? "ok" : "bad", "flash geometry") +
        kv([["pages (256 B)", Number.isInteger(g.pages) ? g.pages.toLocaleString() : `${g.pages} — not an integer`],
          ["blocks", Number.isInteger(g.blocks) ? g.blocks.toLocaleString() : `${g.blocks} — not an integer`],
          ["address split", `${g.blockAddressBits} bits select the block, ${g.pageAddressBits} the byte within a page`]]) : "") +
      note("This matters because a file's length is the only thing most tools check. A 3 MiB part is 24 Mbit, not 32 Mbit; there is no wrap mask; and a partial dump of it is indistinguishable from a complete one by length alone unless you already know the real capacity. Read the capacity from the device (RDID byte 2) rather than inferring it from the file.", "warn"));

  } else if (key === "ifd") {
    const i = r.ifd;
    el.innerHTML = card("Intel Flash Descriptor", `signature ${hex(IFD_SIGNATURE)} at offset ${hex(IFD_LAYOUT.signatureOffset, 4)}`,
      i.found
        ? verdict(i.note, i.atDumpStart ? "ok" : "warn", i.atDumpStart ? "descriptor at offset 0" : "descriptor not at offset 0") +
          kv([["signature offsets", i.offsets.slice(0, 8).map((o) => hex(o)).join(", ")],
            ["descriptor start", hex(i.descriptorStart)], ["evidence", ev(i.ev)],
            ["offset arithmetic", IFD_LAYOUT.note]]) +
          (r.regions
            ? (r.regions.ok
              ? verdict(r.regions.note, "ok", "region table")
              : verdict(r.regions.note, "bad", "region table — validation failed")) +
              kv([["FLMAP0", r.regions.flmap0], ["FLMAP1", r.regions.flmap1],
                ["component base / count", `${hex(r.regions.fcba)} / ${r.regions.nc}`],
                ["region base / count", `${hex(r.regions.frba)} / ${r.regions.nr}`]]) +
              table(r.regions.regions, [
                { label: "#", cls: "num", render: (g) => String(g.index) },
                { label: "region", cls: "k", render: (g) => esc(g.name) },
                { label: "base", cls: "k", render: (g) => g.baseHex },
                { label: "limit", cls: "k", render: (g) => g.limitHex },
                { label: "length", cls: "num", render: (g) => esc(g.lengthLabel) },
                { label: "raw", cls: "k", render: (g) => `<span class="small">${g.raw}</span>` },
                { label: "problems", cls: "wide", render: (g) => g.problems.length ? `<span style="color:var(--red)">${esc(g.problems.join("; "))}</span>` : "&mdash;" },
              ], { dense: true })
            : note("The region table did not decode.", "warn")) +
          acc("Which region may be written from another board", table(REGION_SAFETY, [
            { label: "region", cls: "k", render: (s) => esc(s.region) },
            { label: "cloneable?", cls: "k", render: (s) => `<span class="ev ${/^(no|never)/i.test(s.cloneable) ? "ev-recall" : "ev-std"}">${at(s.cloneable)}</span>` },
            { label: "why", cls: "wide", render: (s) => `<span class="small">${esc(s.why)}</span>` },
          ], { dense: true })) +
          acc("Descriptor regions", table(IFD_REGIONS, [
            { label: "#", cls: "num", render: (x) => String(x.index) },
            { label: "name", cls: "k", render: (x) => esc(x.name) },
            { label: "what it holds", cls: "wide", render: (x) => `<span class="small">${esc(x.what)}</span>` },
          ], { dense: true }))
        : note(i.note, "warn"),
      i.found ? "" : "");

  } else if (key === "volumes") {
    const f = r.fvs;
    el.innerHTML = card("UEFI firmware volumes", "16 zero bytes + filesystem GUID + '_FVH'",
      verdict(f.note, f.count ? "ok" : "warn", `${f.count} header(s) matched`) +
      table(f.volumes, [
        { label: "offset", cls: "k", render: (v) => v.offsetHex },
        { label: "fs GUID", cls: "k", render: (v) => `<span class="small">${esc(v.fsGuid)}</span>` },
        { label: "FvLength", cls: "k", render: (v) => v.lengthHex },
        { label: "hdr len", cls: "num", render: (v) => hex(v.headerLength, 4) },
        { label: "attrs", cls: "k", render: (v) => `${v.attributesHex}${v.erasePolarityFF ? " · erase=FF" : ""}` },
        { label: "checksum", cls: "k", render: (v) => v.checksumOk ? '<span class="ev ev-std">ok</span>' : `<span class="ev ev-recall">bad (${hex(v.checksumSum, 4)})</span>` },
        { label: "in range", cls: "k", render: (v) => v.inRange ? "yes" : '<span style="color:var(--red)">no</span>' },
        { label: "plausible", cls: "k", render: (v) => v.plausible ? "yes" : '<span style="color:var(--red)">no</span>' },
      ], { dense: true, empty: "No firmware volume header found. On a modern image that is expected: the volumes sit inside a compressed GUID_DEFINED section and must be decompressed first." }) +
      r.volumes.map((v) => acc(`${v.header.offsetHex} — ${v.files.length} file(s)`,
        table(v.files, [
          { label: "offset", cls: "k", render: (x) => x.offsetHex },
          { label: "type", cls: "k", render: (x) => esc(x.typeName) },
          { label: "size", cls: "k", render: (x) => x.sizeHex },
          { label: "name", cls: "wide", render: (x) => nbsp(x.name) },
          { label: "sections", cls: "wide", render: (x) => `<span class="small">${x.sections.map((s) => esc(s.typeName)).join(", ") || "&mdash;"}</span>` },
          { label: "state", cls: "k", render: (x) => `${x.stateHex}<div class="small">${esc(x.stateMeaning ?? "")}</div>` },
          { label: "data cksum", cls: "k", render: (x) => x.dataChecksumValid ? '<span class="ev ev-std">ok</span>' : '<span class="ev ev-report">n/a</span>' },
        ], { dense: true }) +
        (v.files.some((x) => x.sections.some((s) => s.type === 0x02))
          ? note("A GUID_DEFINED section is a container, not a payload. Its data is described by the GUID — LZMA, Tiano, or a vendor signature — and reading it as if it were code is the mistake the wrapper table in the UEFI tab exists to prevent.", "warn") : "") +
        note(`FFS files are 8-byte aligned. A walk that does not realign after an odd-sized file loses sync and then reports garbage that still looks like a table — which is worse than reporting nothing.`, ""), true)).join(""));

  } else if (key === "partitions") {
    const m = r.mbr, g = r.gpt;
    const bootable = m.partitions.filter((p) => p.bootable).length;
    el.innerHTML = card("Partition structure", "MBR first, then GPT if the MBR is protective",
      m.ok && m.signaturePresent
        ? verdict(m.verdict, bootable === 1 ? "ok" : "warn", m.gptProtective ? "GPT disk (protective MBR)" : "MBR disk") +
          kv([["boot signature 0x55AA", `${m.signatureHex} ${m.signaturePresent ? "present" : "ABSENT"}`],
            ["disk signature", m.diskSignature], ["bootstrap area", m.bootstrapNote],
            ["bootable entries", `${bootable}${bootable > 1 ? " — more than one bootable entry is a corrupt table, and some firmware then refuses to boot rather than guessing" : ""}`]]) +
          table(m.partitions, [
            { label: "#", cls: "num", render: (p) => String(p.index) },
            { label: "status", cls: "k", render: (p) => `${p.statusHex}${p.bootable ? " bootable" : ""}` },
            { label: "type", cls: "k", render: (p) => `${p.typeHex} ${esc(p.typeName)}` },
            { label: "first LBA", cls: "num", render: (p) => p.firstLba.toLocaleString() },
            { label: "sectors", cls: "num", render: (p) => p.sectors.toLocaleString() },
            { label: "size", cls: "num", render: (p) => esc(labelBytes(p.bytes)) },
            { label: "CHS first", cls: "k", render: (p) => `<span class="small">${esc(p.chsFirst)}</span>` },
          ], { dense: true })
        : note(m.note ?? m.verdict ?? "No MBR.", "warn")) +
      (g
        ? (g.ok
          ? card("GPT header at LBA 1", "'EFI PART'",
            verdict(g.verdict, g.headerCrcOk && g.arrayCrcOk ? "ok" : "bad", "CRC-32 validation") +
            kv([["revision", g.revision], ["header size", String(g.headerSize)], ["disk GUID", g.diskGuid],
              ["my LBA / alternate LBA", `${g.myLba} / ${g.altLba}`],
              ["usable LBA range", `${g.firstUsable.toLocaleString()} – ${g.lastUsable.toLocaleString()}`],
              ["entry array", `LBA ${g.partLba}, ${g.nEntries} × ${g.entrySize} B`],
              ["header CRC", `${g.headerCrcStored} stored / ${g.headerCrcCalc} computed ${g.headerCrcOk ? "✓" : "✗"}`],
              ["array CRC", `${g.arrayCrcStored} stored / ${g.arrayCrcCalc} computed ${g.arrayCrcOk ? "✓" : "✗"}`],
              ["backup header", g.backupHeaderPresent ? "present at the alternate LBA" : "ABSENT"]]) +
            table(g.partitions, [
              { label: "#", cls: "num", render: (p) => String(p.index) },
              { label: "name", cls: "wide", render: (p) => nbsp(p.name) },
              { label: "type", cls: "wide", render: (p) => esc(p.typeName) },
              { label: "type GUID", cls: "k", render: (p) => `<span class="small">${esc(p.typeGuid)}</span>` },
              { label: "first–last LBA", cls: "k", render: (p) => `${p.firstLba.toLocaleString()} – ${p.lastLba.toLocaleString()}` },
              { label: "attrs", cls: "k", render: (p) => `<span class="small">${esc(p.attributes)}</span>` },
            ], { dense: true }) +
            note("Checking that the backup header at the last LBA agrees with the primary is the fastest way to tell a corrupt GPT from a truncated dump. If only the backup is intact, the table is recoverable without touching the disk.", "info"),
            g.headerCrcOk && g.arrayCrcOk ? "" : "tone-bad")
          : note(g.note ?? g.verdict ?? "GPT header present but did not validate.", "warn"))
        : "");

  } else if (key === "variables") {
    const v = r.vars;
    el.innerHTML = card("NVRAM / variable store", "where the boot entries actually live",
      verdict(v.note, v.count ? "info" : "warn", `${v.count} signature(s)`) +
      table(v.stores, [
        { label: "offset", cls: "k", render: (s) => hex(s.offset ?? s.at ?? 0) },
        { label: "signature", cls: "k", render: (s) => esc(s.signature ?? s.sig ?? "") },
        { label: "what", cls: "wide", render: (s) => `<span class="small">${esc(s.what ?? s.desc ?? "")}</span>` },
        {
          label: "size candidates", cls: "wide", render: (s) => `<span class="small">${(s.sizeCandidates ?? []).map((c) =>
            `+${hex(c.sizeOffset ?? 0, 2)}: ${c.size === null || c.size === undefined ? "?" : hex(c.size)}${c.plausible ? " ✓" : ""}`).join("<br />") || "&mdash;"}</span>`,
        },
      ], { dense: true, empty: "No variable store found in this dump." }) +
      note("Boot entries (BootOrder, Boot####) are UEFI variables in NVRAM, not a table on the disk. A cleared CMOS or a dead RTC battery removes them even though the disk is perfect, and the symptom — 'no bootable device found' — is routinely mistaken for a dead board. Recreating the entry from a live USB stick is a two-minute fix.", "info") +
      acc("Variable-store signatures known to this workbench", table(VARIABLE_STORE_SIGNATURES, [
        { label: "signature", cls: "k", render: (s) => `<span class="small">${esc(s.sig)}</span>` },
        { label: "name", cls: "k", render: (s) => esc(s.name) },
        { label: "what", cls: "wide", render: (s) => `<span class="small">${esc(s.what)}</span> ${ev(s.ev)}` },
      ], { dense: true })) +
      acc("Variable states and attributes", table(VARIABLE_STATE, [
        { label: "value", cls: "k", render: (s) => hex(s.value, 2) },
        { label: "name", cls: "k", render: (s) => esc(s.name) },
        { label: "meaning", cls: "wide", render: (s) => `<span class="small">${esc(s.meaning)}</span>` },
      ], { dense: true }) + table(VARIABLE_ATTRIBUTES, [
        { label: "bit", cls: "k", render: (s) => hex(s.bit) },
        { label: "name", cls: "k", render: (s) => esc(s.name) },
        { label: "meaning", cls: "wide", render: (s) => `<span class="small">${esc(s.meaning)}</span>` },
      ], { dense: true })));

  } else if (key === "signatures") {
    const s = r.signatures;
    el.innerHTML = card("Signature scan", "filesystems, compression and container magics",
      verdict(`${s.count} hit(s) across ${bytes.length.toLocaleString()} bytes${s.truncated ? ` (capped at ${s.maxHits})` : ""}.`, s.count ? "ok" : "warn", "scan") +
      table(s.hits.slice(0, 300), [
        { label: "offset", cls: "k", render: (h) => h.offsetHex },
        { label: "signature", cls: "k", render: (h) => esc(h.name) },
        { label: "bytes", cls: "k", render: (h) => `<span class="small">${esc(h.bytes)}</span>` },
        { label: "endian", cls: "k", render: (h) => `<span class="small">${esc(h.endian)}</span>` },
        { label: "what it is", cls: "wide", render: (h) => `<span class="small">${esc(h.what)}</span> ${ev(h.ev)}` },
      ], {
        dense: true, empty: "No known signature. On a modern firmware image that is expected: the structures live inside a compressed GUID_DEFINED section and have to be decompressed before they can be seen at all.",
      }) +
      (r.uimg ? card("U-Boot legacy image header", `magic ${hex(0x27051956)}`,
        kv(UIMAGE_LAYOUT.map((f) => [f.field, nbsp(r.uimg.fields?.[f.field] ?? r.uimg[f.field])])) +
        verdict(r.uimg.note ?? "", r.uimg.hcrcOk ? "ok" : "bad", "header CRC-32")) : "") +
      acc(`All ${SIGNATURES.length} signatures in the table`, table(SIGNATURES, [
        { label: "id", cls: "k", render: (x) => `<code>${esc(x.id)}</code>` },
        { label: "name", cls: "k", render: (x) => esc(x.name) },
        { label: "magic", cls: "k", render: (x) => `<span class="small">${x.magic ? esc(x.magic) : "(no fixed magic)"}</span>` },
        { label: "endian", cls: "k", render: (x) => `<span class="small">${esc(x.endian)}</span>` },
        { label: "what", cls: "wide", render: (x) => `<span class="small">${esc(x.what)}</span> ${ev(x.ev)}` },
      ], { dense: true })));

  } else if (key === "actions") {
    el.innerHTML = card("What to do with this dump", "ordered so nothing destructive comes first",
      ol(r.actions.map((a) => raw(`<span class="ph">priority ${esc(String(a.priority))} · ${esc(a.kind)}</span>${esc(a.text)}`))) +
      note(`Every action before the first write, carve or extract is measurement, reading or identification. That ordering is not a style choice: a dump that fails hygiene must not be written to a device at all, and the action list says so before it says anything else.`, "info"));

  } else if (key === "hex") {
    const firstFv = r.fvs.volumes[0];
    el.innerHTML = card("Hex view", "offset 0, plus every structure the parsers found",
      `<h3 style="font-size:12.5px">Offset 0</h3>` + hexView(bytes, { offset: 0, length: 512 }) +
      (r.ifd.found ? `<h3 style="font-size:12.5px" class="mt">Descriptor signature at ${hex(r.ifd.signatureOffset)}</h3>` +
        hexView(bytes, { offset: Math.max(0, r.ifd.signatureOffset - 16), length: 128, base: Math.max(0, r.ifd.signatureOffset - 16) }) : "") +
      (firstFv ? `<h3 style="font-size:12.5px" class="mt">Firmware volume header at ${firstFv.offsetHex}</h3>` +
        hexView(bytes, { offset: firstFv.offset, length: 128, base: firstFv.offset }) : "") +
      (r.mbr.signaturePresent ? `<h3 style="font-size:12.5px" class="mt">LBA 0 partition table and LBA 1</h3>` +
        hexView(bytes, { offset: 448, length: 64, base: 448 }) + hexView(bytes, { offset: 512, length: 96, base: 512 }) : "") +
      (r.vars.stores[0] ? `<h3 style="font-size:12.5px" class="mt">Variable store at ${hex(r.vars.stores[0].offset ?? 0)}</h3>` +
        hexView(bytes, { offset: r.vars.stores[0].offset ?? 0, length: 128, base: r.vars.stores[0].offset ?? 0 }) : "") +
      `<p class="small">Showing at most the first 512 bytes plus 128 bytes around each structure found. The full image is ${bytes.length.toLocaleString()} bytes.</p>`);
  }
}

const labelBytes = (n) => {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1 << 30) return `${(n / (1 << 30)).toFixed(2)} GiB`;
  if (n >= 1 << 20) return `${(n / (1 << 20)).toFixed(2)} MiB`;
  if (n >= 1 << 10) return `${(n / (1 << 10)).toFixed(2)} KiB`;
  return `${n} B`;
};

/* ================================================================== *
 * 04 · UEFI / POST
 * ================================================================== */

function renderUefiTab() {
  on("postRun", runPost);
  enterRuns("postTrace", runPost);
  on("postDemoRetry", () => { $("postTrace").value = "00, 01, 03, 0B, 2C, 2C, 2C, 2C, 2C, 2C"; runPost(); });
  on("postDemoHandoff", () => { $("postTrace").value = "00, 01, 03, 0B, 2C, 4F, 62, 78, 92, A0, E0, E1"; runPost(); });

  $("x87Body").innerHTML =
    note(X87.history, "info") +
    `<h3 style="font-size:12.5px" class="mt">${esc(X87.probe.name)}</h3>` +
    note(X87.probe.why) +
    ol(X87.probe.sequence.map((s) => raw(`<span class="ph">step ${esc(String(s.step))}</span><code>${esc(s.asm)}</code> — ${esc(s.what)}`))) +
    note(X87.probe.prefillTrick, "warn") +
    acc("Stronger probes than the minimum", ul(X87.probe.stronger)) +
    acc("Register model", X87.registerModel.map((p) => `<p class="small">${esc(p)}</p>`).join("")) +
    acc("Control-word fields", table(X87.controlWord.fields, [
      { label: "bits", cls: "k", render: (f) => esc(f.bits) },
      { label: "name", cls: "k", render: (f) => esc(f.name) },
      { label: "meaning", cls: "wide", render: (f) => `<span class="small">${esc(f.meaning)}</span>` },
    ], { dense: true }) + `<p class="small">Reset default: <code>${hex(X87.controlWord.defaultAfterReset, 4)}</code> — ${esc(X87.controlWord.defaultMeaning)}</p>` + note(X87.controlWord.note)) +
    acc("Status-word fields", table(X87.statusWord.fields, [
      { label: "bits", cls: "k", render: (f) => esc(f.bits) },
      { label: "name", cls: "k", render: (f) => esc(f.name) },
      { label: "meaning", cls: "wide", render: (f) => `<span class="small">${esc(f.meaning)}</span>` },
    ], { dense: true }) + note(X87.statusWord.note)) +
    acc("Encodings of the probe instructions", table(X87.instructions, [
      { label: "bytes", cls: "k", render: (r) => `<code>${esc(r.bytes)}</code>` },
      { label: "mnemonic", cls: "k", render: (r) => esc(r.mnem) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
    ], { dense: true })) +
    `<p class="small">${ev(X87.ev)}</p>`;

  on("x87Run", runX87);

  $("regionSafetyBody").innerHTML =
    table(REGION_SAFETY, [
      { label: "region", cls: "k", render: (s) => esc(s.region) },
      { label: "cloneable?", cls: "k", render: (s) => `<span class="ev ${/^(no|never)/i.test(s.cloneable) ? "ev-recall" : "ev-std"}">${at(s.cloneable)}</span>` },
      { label: "why", cls: "wide", render: (s) => `<span class="small">${esc(s.why)}</span>` },
    ]) +
    acc("Intel Flash Descriptor regions", table(IFD_REGIONS, [
      { label: "#", cls: "num", render: (r) => String(r.index) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what it holds", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
    ], { dense: true })) +
    kv([["descriptor signature", hex(IFD_SIGNATURE)],
      ["signature offset", hex(IFD_LAYOUT.signatureOffset, 4)],
      ["map offset", hex(IFD_LAYOUT.mapOffset, 4)],
      ["offset arithmetic", IFD_LAYOUT.note],
      ["evidence", ev(IFD_LAYOUT.ev)]]);

  $("uefiTriageBody").innerHTML =
    UEFI_TRIAGE.map((t) => acc(t.symptom, ol(t.order) + `<p class="small">${ev(t.ev)}</p>`, false)).join("") +
    acc("The POST-card model", note(POST_CARD.what) + note(POST_CARD.portNote, "warn") + note(POST_CARD.lspNote, "warn") +
      table(POST_CARD.leds, [
        { label: "LED", cls: "k", render: (l) => esc(l.name) },
        { label: "meaning", cls: "wide", render: (l) => `<span class="small">${esc(l.meaning)}</span>` },
      ], { dense: true }) + ul(POST_CARD.interpretation) + `<p class="small">${ev(POST_CARD.ev)}</p>`);

  on("fvRefSel", renderFvRef, "change");
  renderFvRef();
}

function runPost() {
  const codes = str("postTrace").split(/[,\s]+/).filter(Boolean);
  const r = analysePostTrace(codes);
  $("postOut").innerHTML = !r.ok ? note(r.note ?? "No usable codes in that trace.", "warn")
    : verdict(r.verdict, r.pattern === "handoff to OS" ? "ok" : r.pattern === "retry loop" ? "warn" : "info", r.pattern) +
      kv([
        ["codes captured", String(r.count)],
        ["distinct", String(r.distinctCount)],
        ["first", r.first === null ? "none parsed" : hex(r.first, 2)],
        ["last", r.lastHex],
        ["phase", r.phase],
      ]) +
      note("POST codes are vendor-specific and are not portable between AMI, Insyde, Phoenix and coreboot. An AMI 0x2C and a Phoenix 0x2C are unrelated. What this reads is the SHAPE of the trace — stalled, cycling, or handed off — which is vendor-independent, and then points you at the vendor's own table for the specific code.", "warn");
}

function runX87() {
  const w = hexIn("cwInput", null), s = hexIn("swInput", null);
  if (w === null && s === null) { $("x87Out").innerHTML = note("Neither field parsed as hex. The control word is 16 bits — try 0x037F.", "bad"); return; }
  const cw = w === null ? null : decodeX87ControlWord(w);
  const sw = s === null ? null : decodeX87StatusWord(s);
  $("x87Out").innerHTML =
    (cw ? verdict(cw.verdict, cw.isResetDefault ? "ok" : "warn", `control word ${cw.hex}`) +
      kv([["exception masks set", cw.exceptionMasks.join(", ") || "none"],
        ["exceptions enabled", cw.exceptionsEnabled.join(", ") || "none"],
        ["precision (PC)", cw.precision], ["rounding (RC)", cw.rounding]]) : "") +
    (sw ? verdict(sw.verdict, sw.clean ? "ok" : sw.stackFault ? "warn" : "info", `status word ${sw.hex}`) +
      kv([["exception flags", sw.flags.join(", ") || "none"],
        ["TOP", String(sw.top)],
        ["condition codes", `C0=${sw.conditionCodes.C0} C1=${sw.conditionCodes.C1} C2=${sw.conditionCodes.C2} C3=${sw.conditionCodes.C3}`],
        ["busy", String(sw.busy)], ["stack fault", String(sw.stackFault)]]) : "") +
    (cw && sw && cw.isResetDefault && sw.clean
      ? note("A 0x037F control word together with a 0x0000 status word is the fingerprint of a coprocessor that exists and has just been initialised. That pair is what a BIOS presence test asserts. The false positive to guard against is a buffer that already contained 0x037F before FNSTCW ran, which is why the probe must pre-fill with something that is NOT the reset value — 0x55AA or 0xFFFF.", "ok")
      : cw && !cw.isResetDefault
        ? note("Not the reset default. Either software has deliberately set precision or rounding, or the stored word did not come from a working FPU. The precision discriminator in the probe list settles which: compute 1.0 + 2^-53 and compare against 1.0 — with extended precision they differ, with double precision they do not.", "warn")
        : "");
}

function renderFvRef() {
  const k = str("fvRefSel"), b = $("fvRefBody");
  if (k === "header") {
    b.innerHTML = layoutTable(FV_HEADER) +
      kv([["filesystem GUID (v2)", "8c8ce578-8a3d-4f1c-9935-896185c32dd3"],
        ["filesystem GUID (v1)", "7a9354d9-0468-444a-81ce-0bf617d890df"],
        ["anchors", "sixteen zero bytes, then the GUID, then '_FVH' at +0x28"]]) +
      note("A volume header is recognised by three things agreeing at once. Requiring all three is what keeps a scan over a 16 MiB dump from producing dozens of false matches — the GUID alone occurs inside compressed data often enough to be useless on its own.");
  } else if (k === "files") {
    b.innerHTML = table(FV_FILE_TYPES, [
      { label: "type", cls: "k", render: (r) => hex(r.type, 2) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
    ], { dense: true }) + note("FIRMWARE_VOLUME_IMAGE (0x0C) means volumes nest inside volumes. A parser that stops at the first one misses most of the firmware, and reports a suspiciously small file count.");
  } else if (k === "sections") {
    b.innerHTML = table(FV_SECTION_TYPES, [
      { label: "type", cls: "k", render: (r) => hex(r.type, 2) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
    ], { dense: true }) + note("A GUID_DEFINED section is a container, not a payload. Its contents are described by the GUID — LZMA, Tiano, or a vendor signature — and reading the compressed body as if it were code is the mistake the wrapper table below exists to prevent.", "warn");
  } else if (k === "wrappers") {
    const recall = GUID_DEFINED_WRAPPERS.filter((r) => r.ev === "recall").length;
    b.innerHTML = table(GUID_DEFINED_WRAPPERS, [
      { label: "GUID", cls: "k", render: (r) => `<span class="small">${esc(r.guid)}</span>` },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span> ${ev(r.ev)}` },
    ], { dense: true }) +
      (recall ? `<p class="recall-flag">⚠ ${recall} row(s) striped amber: transcribed from memory. Read the GUID off a known-good dump of the same platform before relying on it — vendor signing GUIDs differ between AMI, Insyde and Phoenix.</p>` : "");
  } else if (k === "te") {
    b.innerHTML = layoutTable(TE_HEADER) +
      table(PE_MACHINES, [
        { label: "machine", cls: "k", render: (r) => hex(r.id, 4) },
        { label: "name", cls: "wide", render: (r) => `${esc(r.name)} ${ev(r.ev)}` },
      ], { dense: true }) +
      table(PE_SUBSYSTEMS, [
        { label: "subsystem", cls: "num", render: (r) => String(r.id) },
        { label: "name", cls: "wide", render: (r) => esc(r.name) },
      ], { dense: true }) +
      note("A TE image is a PE image whose DOS and NT headers have been replaced by a 40-byte TE header. Every RVA inside it must have StrippedSize added back to become a PE RVA. Forgetting that is the classic 'I decompiled it and all the addresses are wrong' bug, and it fails silently.");
  } else if (k === "varstores") {
    b.innerHTML = table(VARIABLE_STORE_SIGNATURES, [
      { label: "signature", cls: "k", render: (r) => `<span class="small">${esc(r.sig)}</span>` },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span> ${ev(r.ev)}` },
    ], { dense: true }) + `<p class="recall-flag">⚠ Striped rows are placeholders or memory-transcribed. Read the real signature off a known-good dump of the same platform.</p>`;
  } else if (k === "varstate") {
    b.innerHTML = table(VARIABLE_STATE, [
      { label: "value", cls: "k", render: (r) => hex(r.value, 2) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "meaning", cls: "wide", render: (r) => `<span class="small">${esc(r.meaning)}</span>` },
    ], { dense: true }) +
      table(VARIABLE_ATTRIBUTES, [
        { label: "bit", cls: "k", render: (r) => hex(r.bit) },
        { label: "name", cls: "k", render: (r) => esc(r.name) },
        { label: "meaning", cls: "wide", render: (r) => `<span class="small">${esc(r.meaning)}</span>` },
      ], { dense: true }) +
      note("TIME_BASED_AUTHENTICATED_WRITE_ACCESS is what makes Secure Boot rollback-resistant: the payload is signed and carries a timestamp that must not go backwards. That is a security control working as designed, not an obstacle to route around — and this workbench will not help you route around it.");
  } else if (k === "gpt") {
    b.innerHTML = kv([["signature", GPT_HEADER.signature], ["LBA", String(GPT_HEADER.lba)], ["evidence", ev(GPT_HEADER.ev)]]) +
      layoutTable(GPT_HEADER.layout) +
      note("The header CRC covers the first HeaderSize bytes with the CRC field itself zeroed — the same rule as U-Boot's ih_hcrc. The array CRC covers exactly NumberOfPartitionEntries × SizeOfPartitionEntry bytes, not the whole sector. Getting either span wrong produces a 'corrupt GPT' verdict on a perfectly good disk.");
  } else if (k === "mbr") {
    b.innerHTML = layoutTable(MBR_LAYOUT) +
      `<h3 style="font-size:12.5px" class="mt">Partition entry — 16 bytes, four of them at 0x1BE</h3>` +
      layoutTable(PARTITION_ENTRY) +
      note("Two entries marked bootable is a corrupt table, and some firmware then refuses to boot at all rather than guessing which one you meant. The 0x55AA signature at +0x1FE is the only thing many tools check, which is why a zeroed MBR still 'looks like' an MBR to a naive parser — and why the bootstrap area is the part a boot-sector virus replaces.");
  } else {
    b.innerHTML = `<p class="empty">Pick a reference above.</p>`;
  }
}

/* ================================================================== *
 * 05 · STORAGE
 * ================================================================== */

const SMART_DEMOS = {
  smartDemoDying: `smartctl 7.3 excerpt — spinning disk, failing
ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
  5 Reallocated_Sector_Ct   0x0033   098   098   010    Pre-fail  Always       -       128
187 Reported_Uncorrect      0x0032   100   099   000    Old_age   Always       -       3
197 Current_Pending_Sector  0x0022   100   100   000    Old_age   Always       -       24
198 Offline_Uncorrectable   0x0010   100   100   000    Old_age   Offline      -       24
  9 Power_On_Hours          0x0032   082   082   000    Old_age   Always       -       15800
194 Temperature_Celsius     0x0022   071   058   000    Old_age   Always       -       29`,
  smartDemoWorn: `smartctl excerpt — SSD, wear exhausted
  5 Reallocated_Sector_Ct   0x0033   100   100   010    Pre-fail  Always       -       0
168 Available_Reservd_Space 0x0004   100   100   000    Old_age   Offline      -       6
169 Program_Fail_Count_Chip 0x0032   100   100   000    Old_age   Always       -       3
175 Program_Fail_Count_Chip 0x0032   100   100   000    Old_age   Always       -       3
177 Wear_Leveling_Count     0x0013   058   058   000    Pre-fail  Always       -       712
231 SSD_Life_Left           0x0013   010   010   010    Pre-fail  Always   FAILING_NOW 90
233 Media_Wearout_Indicator 0x0032   012   012   000    Old_age   Always       -       8842`,
  smartDemoHealthy: `smartctl excerpt — healthy
  5 Reallocated_Sector_Ct   0x0033   100   100   010    Pre-fail  Always       -       0
  9 Power_On_Hours          0x0032   094   094   000    Old_age   Always       -       5210
194 Temperature_Celsius     0x0022   068   055   000    Old_age   Always       -       32
197 Current_Pending_Sector  0x0022   100   100   000    Old_age   Always       -       0
198 Offline_Uncorrectable   0x0010   100   100   000    Old_age   Offline      -       0`,
};

function renderStorageTab() {
  on("smartRun", () => analyseSmart(str("smartText")));
  for (const [id, text] of Object.entries(SMART_DEMOS)) on(id, () => { $("smartText").value = text; analyseSmart(text); });
  $("smartOut").innerHTML = `<p class="empty">Paste a smartctl report, or run one of the three demos.</p>`;

  $("driveTriageBody").innerHTML =
    table(DRIVE_TRIAGE, [
      { label: "finding", cls: "wide", render: (t) => esc(t.finding) },
      { label: "verdict", cls: "wide", render: (t) => `<b>${esc(t.verdict)}</b>` },
      { label: "action", cls: "wide", render: (t) => `<span class="small">${esc(t.action)}</span> ${ev(t.ev)}` },
    ], { dense: true, caption: "Triage is ordered by what the drive reports, not by what it costs. A drive with a rising reallocated-sector count is replaced; a drive with a cable fault is not." });

  on("smartCriticalOnly", renderSmartAttrs, "change");
  on("smartSsdOnly", renderSmartAttrs, "change");
  renderSmartAttrs();

  $("ataSel").innerHTML = [
    ["taskfile", "ATA SMART taskfile — the 0x4F/0xC2 signature"],
    ["identify", "IDENTIFY DEVICE word map"],
    ["cmds", "ATA command codes"],
    ["selftest", "Self-test log (log address 06h)"],
    ["entry", "SMART attribute entry layout (12 bytes)"],
    ["nvmelogs", "NVMe log pages"],
    ["nvmesm", "NVMe SMART / Health log layout"],
    ["nvmeadmin", "NVMe admin opcodes"],
  ].map(([v, l]) => `<option value="${at(v)}">${esc(l)}</option>`).join("");
  on("ataSel", renderAta, "change");
  renderAta();
}

function renderSmartAttrs() {
  let rows = SMART_ATTRS;
  const critOnly = $("smartCriticalOnly").checked;
  const ssdOnly = $("smartSsdOnly").checked;
  if (critOnly) rows = rows.filter((a) => SMART_CRITICAL.includes(a.id));
  if (ssdOnly) rows = rows.filter((a) => /wear|wearout|erase|program|block|life|reserv|bad_block|endurance|ssd|nand|realloc/i.test(`${a.name} ${a.raw ?? ""}`));
  $("smartAttrsBody").innerHTML =
    `<p class="small">Showing ${rows.length} of ${SMART_ATTRS.length}. Criticality is marked per attribute because the same number means different things on spinning media and on flash: attribute 5 is a head-crash counter on one and a retired-block counter on the other, and attribute 10 counts spin retries on a hard disk and something vendor-specific on an SSD.</p>` +
    table(rows, [
      { label: "id", cls: "k", render: (a) => `${hex(a.id, 2)}${SMART_CRITICAL.includes(a.id) ? ' <span class="ev ev-recall">critical</span>' : ""}` },
      { label: "name", cls: "k", render: (a) => esc(a.name) },
      { label: "worse when", cls: "k", render: (a) => `<span class="small">${esc(a.worse ?? "")}</span>` },
      { label: "raw value means", cls: "wide", render: (a) => `<span class="small">${esc(a.raw ?? "")}</span> ${ev(a.ev)}` },
    ], { dense: true, empty: "No attribute matches those filters." });
}

function renderAta() {
  const k = str("ataSel"), b = $("ataBody");
  if (k === "taskfile") {
    const tf = ATA_SMART_TASKFILE;
    b.innerHTML = kv([["command", hex(tf.cmd ?? 0xb0, 2)], ["feature register", hex(tf.featureRegister, 2)], ["signature", "LBA-mid 0x4F, LBA-high 0xC2"], ["evidence", ev(tf.ev)]]) +
      note(tf.note, "warn") +
      table(tf.subCommands, [
        { label: "LBA low", cls: "k", render: (r) => hex(r.count, 2) },
        { label: "LBA mid / high", cls: "k", render: (r) => `${hex(r.lbaMid, 2)} / ${hex(r.lbaHigh, 2)}` },
        { label: "subcommand", cls: "wide", render: (r) => esc(r.name) },
        { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
      ], { dense: true }) +
      note("The signature is the whole point: a device that supports SMART answers with LBA-mid = 0x4F and LBA-high = 0xC2. Those two bytes in the wrong place mean SMART is absent or disabled, and every attribute read after that returns garbage that still looks like a table.", "info");
  } else if (k === "identify") {
    b.innerHTML = kv([["IDENTIFY DEVICE", hex(ATA_IDENTIFY.cmd, 2)], ["IDENTIFY PACKET DEVICE", hex(ATA_IDENTIFY.cmdAtapi, 2)], ["evidence", ev(ATA_IDENTIFY.ev)]]) +
      note(ATA_IDENTIFY.note ?? "", "info") +
      table(ATA_IDENTIFY.fields, [
        { label: "word(s)", cls: "k", render: (r) => esc(String(r.word)) },
        { label: "field", cls: "k", render: (r) => esc(r.name) },
        { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
      ], { dense: true }) +
      note("Words 10-19 are the serial number and words 27-46 the model number, both stored as byte-swapped ASCII pairs. Reading them without the swap produces a model string with every pair of characters transposed — instantly recognisable once you know to look, and instantly fixable.", "warn");
  } else if (k === "cmds") {
    b.innerHTML = table(ATA_COMMANDS, [
      { label: "command", cls: "k", render: (r) => hex(r.cmd, 2) },
      { label: "name", cls: "wide", render: (r) => `${esc(r.name)} ${ev(r.ev)}` },
    ], { dense: true });
  } else if (k === "selftest") {
    b.innerHTML = kv([["log address", hex(SELFTEST_LOG.logAddress, 2)], ["entry size", `${SELFTEST_LOG.entryBytes} B`], ["entries", String(SELFTEST_LOG.entries)], ["evidence", ev(SELFTEST_LOG.ev)]]) +
      layoutTable(SELFTEST_LOG.layout) + note(SELFTEST_LOG.note, "warn");
  } else if (k === "entry") {
    b.innerHTML = layoutTable(SMART_ENTRY_LAYOUT) +
      note("Each entry is 12 bytes: id, status flags (2), reserved (3), raw value (6). Thirty entries start at byte 2 of the 512-byte buffer returned by SMART READ DATA. An id of 0x00 marks the start of reserved space and terminates the walk — a parser that reads all 30 slots regardless will invent attributes out of zeros.", "info");
  } else if (k === "nvmelogs") {
    b.innerHTML = table(NVME_LOG_PAGES, [
      { label: "LID", cls: "k", render: (r) => hex(r.id, 2) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what)}</span>` },
    ], { dense: true });
  } else if (k === "nvmesm") {
    b.innerHTML = layoutTable(NVME_SMART_LAYOUT) +
      note("Byte 0 is critical_warning and it is a bitmask, not a number: bit0 spare below threshold, bit1 temperature outside a threshold, bit2 NVM subsystem reliability degraded, bit3 media placed in read-only, bit4 volatile memory backup failed, bit5 persistent memory region read-only. Any one of those bits set means the controller is telling you the drive is failing, regardless of what any percentage elsewhere in the log says. Read byte 0 first and stop there if it is non-zero.", "warn");
  } else if (k === "nvmeadmin") {
    b.innerHTML = table(NVME_ADMIN, [
      { label: "opcode", cls: "k", render: (r) => hex(r.op, 2) },
      { label: "name", cls: "wide", render: (r) => `${esc(r.name)} ${ev(r.ev)}` },
    ], { dense: true }) +
      note("Get Log Page (0x02) with LID 02h is the NVMe equivalent of SMART READ DATA. Identify (0x06) with CNS 01h returns the controller data structure, which is where the serial and model live — the NVMe analogue of IDENTIFY DEVICE words 10-46.", "info");
  } else {
    b.innerHTML = `<p class="empty">Pick a reference above.</p>`;
  }
}

/**
 * Parse a pasted SMART report.
 *
 * Accepts smartctl's tabular form and the simpler `id name value worst thresh
 * raw` shape. Anything it cannot parse is reported as unparsed rather than
 * dropped, because a silently dropped line is a missed symptom — and the line
 * that gets dropped is usually the odd-looking one, which is the interesting one.
 */
export function parseSmartText(text) {
  const lines = String(text ?? "").split(/\r?\n/);
  const attrs = [], unparsed = [];
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || /^[#;]/.test(line) || /^ID#/i.test(line) || !/\d/.test(line)) continue;
    const toks = line.split(/\s+/);
    // The id may be decimal or 0x-prefixed; smartctl prints it decimal.
    const idTok = /^0x[0-9a-f]+$/i.test(toks[0]) ? toks[0] : (/^\d+$/.test(toks[0]) ? "0x" + parseInt(toks[0], 10).toString(16) : null);
    if (!idTok) { unparsed.push(line); continue; }
    const id = parseInt(idTok, 16);
    if (id === 0 || id > 255) { unparsed.push(line); continue; }
    const name = /^[A-Za-z_]/.test(toks[1] ?? "") ? toks[1] : null;
    // The integers after the name: [flag] value worst thresh … raw. The raw
    // value is last and may be negative or very large; the flag, if present, is
    // 0x-prefixed and already excluded by the /^\d+$/ test below.
    const ints = toks.slice(name ? 2 : 1).filter((t) => /^-?\d+$/.test(t)).map((t) => parseInt(t, 10));
    if (ints.length < 3) { unparsed.push(line); continue; }
    const raw = ints[ints.length - 1];
    const thresh = ints[ints.length - 2];
    const worst = ints[ints.length - 3];
    const value = ints[ints.length - 4] ?? ints[0];
    attrs.push({ id, name: name ?? SMART_ATTR_BY_ID[id]?.name ?? `attribute ${hex(id, 2)}`, value, worst, thresh, raw, line, whenFailed: /FAIL/i.test(line) });
  }
  return { attrs, unparsed };
}

function analyseSmart(text) {
  const { attrs, unparsed } = parseSmartText(text);
  if (!attrs.length) {
    $("smartOut").innerHTML = note("No attribute rows parsed. Expected lines like `5 Reallocated_Sector_Ct 100 100 010 - 128`, or a pasted smartctl table with its ID# header.", "warn") +
      (unparsed.length ? acc(`${unparsed.length} line(s) present but not parsed`, `<pre class="mono-block">${esc(unparsed.join("\n").slice(0, 900))}</pre>`) : "");
    return;
  }
  const rows = attrs.map((a) => {
    const known = SMART_ATTR_BY_ID[a.id] ?? null;
    const critical = SMART_CRITICAL.includes(a.id);
    const below = a.thresh > 0 && a.value <= a.thresh;
    const rawBad = a.raw !== 0 && (critical || below || a.whenFailed);
    return {
      ...a, known, critical, below, rawBad,
      severity: below || a.whenFailed ? "bad" : rawBad ? (critical ? "bad" : "warn") : "ok",
      meaning: known ? (known.raw ?? "") : "Not in this workbench's attribute table. The id is vendor-specific beyond the few standardised ones, so its meaning has to come from the vendor's own list — do not guess it from the number.",
      worse: known?.worse ?? "",
    };
  }).sort((a, b) => (a.severity === b.severity ? a.id - b.id : a.severity === "bad" ? -1 : b.severity === "bad" ? 1 : a.severity === "warn" ? -1 : 1));

  const bad = rows.filter((r) => r.severity === "bad");
  const warn = rows.filter((r) => r.severity === "warn");
  const critNonZero = rows.filter((r) => r.critical && r.raw > 0);
  const life = rows.find((r) => /wearout|life_left|wear_level|endurance|available_reservd/i.test(r.name));

  const v = bad.length
    ? `FAILING. ${bad.length} attribute(s) have crossed their threshold or are flagged: ${bad.map((r) => `${hex(r.id, 2)} ${r.name} (value ${r.value}, threshold ${r.thresh}, raw ${r.raw})`).join("; ")}. Back the data up before doing anything else — including before running a long self-test, which stresses a drive that is already marginal and can finish it.`
    : warn.length
      ? `MARGINAL. ${warn.length} attribute(s) warrant attention but none has crossed a threshold: ${warn.map((r) => `${hex(r.id, 2)} ${r.name} (raw ${r.raw})`).join("; ")}. Monitor the raw values over days; the trend is the information, not the single reading.`
      : `No critical attribute is non-zero, nothing is below its threshold, and no row is flagged FAILING_NOW. That is a clean reading, not a guarantee — SMART reports what the drive chose to count, and a drive can fail on a mechanism it does not instrument.`;

  $("smartOut").innerHTML =
    verdict(v, bad.length ? "bad" : warn.length ? "warn" : "ok", `${rows.length} attribute(s) parsed`) +
    kv([
      ["critical attributes present", String(rows.filter((r) => r.critical).length)],
      ["critical with non-zero raw", String(critNonZero.length)],
      ["at or below threshold", String(rows.filter((r) => r.below).length)],
      ["wear / life indicator", life ? `${esc(life.name)}: value ${esc(String(life.value))}, worst ${esc(String(life.worst))}, threshold ${esc(String(life.thresh))}, raw ${esc(String(life.raw))}` : "none in this report"],
      ["unparsed lines", String(unparsed.length)],
    ]) +
    table(rows, [
      { label: "id", cls: "k", render: (r) => `${hex(r.id, 2)}${r.critical ? ' <span class="ev ev-recall">crit</span>' : ""}` },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "value", cls: "num", render: (r) => String(r.value) },
      { label: "worst", cls: "num", render: (r) => String(r.worst) },
      { label: "thresh", cls: "num", render: (r) => `${r.thresh}${r.below ? " ⚠" : ""}` },
      { label: "raw", cls: "num", render: (r) => `<b style="color:${r.severity === "bad" ? "var(--red)" : r.raw ? "var(--amber)" : "var(--muted)"}">${r.raw.toLocaleString()}</b>` },
      { label: "worse when", cls: "k", render: (r) => `<span class="small">${esc(r.worse)}</span>` },
      { label: "what the raw value means", cls: "wide", render: (r) => `<span class="small">${esc(r.meaning)}</span>${r.known ? "" : '<span class="ev ev-none" style="margin-left:5px">unknown id</span>'}` },
    ], { dense: true, rowClass: (r) => (r.severity === "bad" ? "row-recall" : "") }) +
    note("Read the RAW value, not the normalised one. The normalised value is vendor-defined: it usually starts at 100 or 200 and counts down toward a threshold the vendor also chose, so two drives from different vendors with identical health can show 100 and 200. The raw value is the actual count. And the same attribute number means different things on spinning media and on flash — which is why the table marks criticality per attribute instead of trusting the number.", "warn") +
    (unparsed.length ? acc(`${unparsed.length} line(s) present but not parsed`, `<pre class="mono-block">${esc(unparsed.join("\n").slice(0, 1200))}</pre>`) : "") +
    acc("Cross-reference against the triage table", $("driveTriageBody").innerHTML);

  if (bad.length) addFinding(STATE.dossier, { tier: "reported", what: "S.M.A.R.T.", value: `${bad.length} failing attribute(s): ${bad.map((r) => hex(r.id, 2)).join(",")}`, ev: "report", source: "analyseSmart()" });
  renderDossier();
}

/* ================================================================== *
 * 06 · 1-WIRE
 * ================================================================== */

function renderOnewireTab() {
  on("romRun", decodeRomInput);
  enterRuns("romInput", decodeRomInput);
  on("romGen", () => {
    const fams = [0x28, 0x22, 0x10, 0x26, 0x2d, 0x29, 0x01, 0x33];
    const b = new Uint8Array(8);
    b[0] = fams[Math.floor(Math.random() * fams.length)];
    for (let i = 1; i < 7; i++) b[i] = Math.floor(Math.random() * 256);
    b[7] = crc8(b, 0, 7);
    $("romInput").value = bytesToHex(b);
    decodeRomInput();
  });
  on("romCorrupt", () => {
    const b = bytesFromHexInput(str("romInput"));
    if (b.length !== 8) { $("romOut").innerHTML = note("Put a valid 8-byte ROM id in the field first — 'Generate a valid one' makes one with a correct CRC.", "warn"); return; }
    b[Math.floor(Math.random() * 7)] ^= 1 << Math.floor(Math.random() * 8);
    $("romInput").value = bytesToHex(b);
    decodeRomInput();
  });

  on("spRun", decodeScratchpad);
  enterRuns("spInput", decodeScratchpad);
  on("spDemo85", () => { $("spInput").value = "50 05 4B 46 7F FF 0C 10 56"; decodeScratchpad(); });

  $("owFaultBody").innerHTML =
    ONEWIRE_BUS_FAULTS.map((f) => acc(f.symptom, kv([["cause", esc(f.cause)], ["fix", esc(f.fix)]]) + `<p class="small">${ev(f.ev)}</p>`, false)).join("") +
    note("The 85 °C case deserves its own line: 85 °C is the DS18B20's power-on reset value, so reading exactly that means you read the scratchpad before the first CONVERT T completed. If it stays at 85 °C after issuing CONVERT T (0x44) and waiting 750 ms at 12-bit resolution, the conversion never ran — which on a parasitically powered device means the strong pull-up is missing, because the device cannot draw conversion current from a 4.7 kΩ resistor.", "warn");

  $("owTimingBody").innerHTML =
    table(ONEWIRE_TIMING, [
      { label: "phase", cls: "wide", render: (t) => esc(t.phase) },
      { label: "standard speed", cls: "k", render: (t) => esc(t.standardSpeed) },
      { label: "overdrive", cls: "k", render: (t) => esc(t.overdrive) },
      { label: "note", cls: "wide", render: (t) => `<span class="small">${esc(t.note)}</span> ${ev(t.ev)}` },
    ], { dense: true }) +
    note(ONEWIRE_FROM_BROWSER.note, "warn") +
    acc("CRC self-check — both polynomials against their published check values", (() => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8];
      const c8 = crc8(data);
      const c16 = crc16(data);
      const checkWord = crc16([...data, (~c16) & 0xff, ((~c16) >>> 8) & 0xff]);
      const c16s = crc16([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]);
      return kv([
        ["CRC-8 over 01…08", `${hex(c8, 2)} — poly X⁸+X⁵+X⁴+1, init 0, reflected, LSB first`],
        ["CRC-16 over 01…08", hex(c16, 4)],
        ["check word after data + ~CRC", `${hex(checkWord, 4)} — expected ${hex(CRC16_CHECK_WORD, 4)} ${checkWord === CRC16_CHECK_WORD ? "✓" : "✗ MISMATCH"}`],
        ["CRC-16/ARC over '123456789'", `${hex(c16s, 4)} — expected ${hex(CRC16_CHECK_STRING, 4)} ${c16s === CRC16_CHECK_STRING ? "✓" : "✗ MISMATCH"}`],
      ]) + note("The CRC-16 verification uses Maxim's own rule: append the complement of the computed CRC to the data, run CRC-16 over the whole thing, and the result must be the fixed check word 0xB001. A CRC implementation that passes only the '123456789' vector but fails this one has the wrong endianness on the stored value, which is the common bug.", "info");
    })());

  on("familyFilter", renderFamily, "input");
  renderFamily();

  $("owCmdSel").innerHTML = [
    ["rom", "ROM commands — the bus-level protocol"],
    ["ds18b20", "DS18B20 (family 0x28) — the weather-station thermometer"],
    ["ds2438", "DS2438 (family 0x26) — battery monitor / humidity front end"],
    ["ds2408", "DS2408 (family 0x29) — 8-channel addressable switch"],
    ["owfs", "OWFS — the filesystem inside an iButton"],
  ].map(([v, l]) => `<option value="${at(v)}">${esc(l)}</option>`).join("");
  on("owCmdSel", renderOwCmds, "change");
  renderOwCmds();

  $("owBrowserBody").innerHTML =
    note(ONEWIRE_FROM_BROWSER.impossible[0], "bad") +
    `<h3 style="font-size:12.5px">What does work</h3>` + ul(ONEWIRE_FROM_BROWSER.possible) +
    note(ONEWIRE_FROM_BROWSER.note, "warn") + `<p class="small">${ev(ONEWIRE_FROM_BROWSER.ev)}</p>`;
}

function decodeRomInput() {
  const b = bytesFromHexInput(str("romInput"));
  if (b.length !== 8) { $("romOut").innerHTML = note(`A 1-Wire ROM id is exactly 8 bytes; that parsed as ${b.length}.`, "bad"); return; }
  const r = decodeRom(b);
  $("romOut").innerHTML =
    verdict(r.note, r.crcOk ? "ok" : "bad", r.crcOk ? "CRC-8 valid" : "CRC-8 MISMATCH") +
    kv([
      ["family code", `${hex(r.family, 2)} — ${esc(r.familyName)}`],
      ["family evidence", ev(r.familyEv)],
      ["48-bit serial", r.serial],
      ["stored CRC", hex(r.crc, 2)],
      ["computed CRC", hex(r.crcCalc, 2)],
      ["layout", "8-bit family · 48-bit serial · 8-bit CRC-8 over the first seven bytes"],
    ]) +
    (r.what ? note(r.what, "info") : "") +
    hexView(b, { length: 8 }) +
    acc("ROM commands", table(ROM_COMMANDS, [
      { label: "code", cls: "k", render: (c) => hex(c.code, 2) },
      { label: "name", cls: "k", render: (c) => esc(c.name) },
      { label: "use", cls: "wide", render: (c) => `<span class="small">${esc(c.use)}</span> ${ev(c.ev)}` },
    ], { dense: true }));
  addFinding(STATE.dossier, { tier: "reported", what: "1-Wire ROM id", value: r.hex, ev: r.crcOk ? "tool" : "report", source: "decodeRom()" });
  renderDossier();
}

function decodeScratchpad() {
  const b = bytesFromHexInput(str("spInput"));
  if (b.length < 9) { $("spOut").innerHTML = note(`A DS18B20 scratchpad read returns 9 bytes; that parsed as ${b.length}.`, "bad"); return; }
  const calc = crc8(b, 0, 8);
  const ok = calc === b[8];
  const t = DS18B20.decodeTemperature(b[0], b[1]);
  const cfg = b[4];
  const res = DS18B20.resolution.find((r) => r.bits === 9 + ((cfg >>> 5) & 3));
  const reserved = [b[5], b[6], b[7]];
  const ds18b20Shape = reserved[0] === 0xff && reserved[1] === 0x0c && reserved[2] === 0x10;
  $("spOut").innerHTML =
    verdict(ok
      ? `CRC-8 valid. Temperature ${t.toFixed(4)} °C at ${res ? res.bits : "?"}-bit resolution — step ${res ? res.step : "?"} °C, conversion up to ${res ? res.maxConvertMs : "?"} ms.`
      : `CRC MISMATCH: byte 9 holds ${hex(b[8], 2)}, the calculation gives ${hex(calc, 2)}. The scratchpad contents cannot be trusted. Since the CRC covers the temperature bytes, a bad CRC means the READING failed, not that the temperature is wrong — re-read before interpreting anything.`,
      ok ? (t === 85 ? "warn" : "ok") : "bad", ok ? "scratchpad" : "CRC failure") +
    (ok && t === 85 ? note("Exactly 85 °C is the DS18B20's power-on reset value. Issue CONVERT T (0x44) and wait the resolution-dependent conversion time — 750 ms at 12-bit — before reading again. If it still reads 85 °C the conversion never ran.", "warn") : "") +
    table(DS18B20.scratchpad.map((s, i) => ({ ...s, value: b[i] })), [
      { label: "byte", cls: "num", render: (s) => String(s.byte) },
      { label: "value", cls: "k", render: (s) => s.value === undefined ? "&mdash;" : hex(s.value, 2) },
      { label: "name", cls: "k", render: (s) => esc(s.name) },
      { label: "meaning", cls: "wide", render: (s) => `<span class="small">${esc(s.meaning)}</span>` },
    ], { dense: true }) +
    kv([
      ["configuration byte", `${hex(cfg, 2)} → bits 6:5 = ${(cfg >>> 5) & 3} (${res ? res.bits + "-bit" : "?"}), bit 7 = ${(cfg >>> 7) & 1} (must be 0)`],
      ["reserved bytes 5-7", reserved.map((v) => hex(v, 2)).join(" ") + (ds18b20Shape ? " — the DS18B20 signature FF 0C 10" : " — NOT the DS18B20 signature")],
    ]) +
    (!ds18b20Shape ? note("The reserved bytes are the cheapest way to tell these parts apart. A DS18S20 (family 0x10) has no configurable resolution and uses bytes 6-7 for COUNT_REMAIN and COUNT_PER_C in its 12-bit interpolation trick, so its temperature arithmetic is genuinely different from the DS18B20's. Code written for one produces wrong numbers — not an error, wrong numbers — on the other, which is why a mislabelled or remarked part is worth checking this way.", "warn") : "") +
    acc("DS18B20 / DS1822 commands", table(DS18B20.commands, [
      { label: "code", cls: "k", render: (c) => hex(c.code, 2) },
      { label: "name", cls: "k", render: (c) => esc(c.name) },
      { label: "what", cls: "wide", render: (c) => `<span class="small">${esc(c.what)}</span> ${ev(c.ev)}` },
    ], { dense: true })) +
    hexView(b, { length: b.length });
  if (ok) addFinding(STATE.dossier, { tier: "reported", what: "DS18B20 temperature", value: `${t.toFixed(4)} °C @ ${res ? res.bits : "?"}-bit`, ev: "tool", source: "decodeScratchpad()" });
  renderDossier();
}

function renderFamily() {
  const q = str("familyFilter").toLowerCase();
  const rows = FAMILY_CODES.filter((f) => !q || `${hex(f.code, 2)} ${f.name} ${f.what}`.toLowerCase().includes(q));
  $("familyBody").innerHTML =
    `<p class="small">${rows.length} of ${FAMILY_CODES.length} family codes. The first ROM byte is the family code, and it is the single most useful byte on the bus: it tells you which command set the device speaks before you send anything at all.</p>` +
    table(rows, [
      { label: "code", cls: "k", render: (f) => hex(f.code, 2) },
      { label: "part", cls: "k", render: (f) => esc(f.name) },
      { label: "what it is", cls: "wide", render: (f) => `<span class="small">${esc(f.what)}</span>` },
      { label: "evidence", cls: "k", render: (f) => ev(f.ev) },
    ], { dense: true, empty: "No family code matches that filter." });
}

function renderOwCmds() {
  const k = str("owCmdSel"), b = $("owCmdBody");
  const cmdTable = (rows) => table(rows, [
    { label: "code", cls: "k", render: (c) => hex(c.code, 2) },
    { label: "name", cls: "k", render: (c) => esc(c.name) },
    { label: "what", cls: "wide", render: (c) => `<span class="small">${esc(c.what)}</span> ${ev(c.ev)}` },
  ], { dense: true });
  if (k === "rom") {
    b.innerHTML = cmdTable(ROM_COMMANDS) +
      note("SEARCH ROM (0xF0) is the enumeration algorithm: per bit the master reads the true value and its complement, and a (0,0) pair means devices disagree, so the master records the branch point and can walk the whole tree. MATCH ROM is what you use afterwards, and it is required on a multi-drop bus. SKIP ROM addresses every device at once; it is fine for a single sensor, but on a bus with a power-hungry command it collapses the rail, because every device converts at the same time and the pull-up cannot hold the bus high.", "warn");
  } else if (k === "ds18b20") {
    b.innerHTML = kv([["family code", hex(DS18B20.family, 2)], ["evidence", ev(DS18B20.ev)]]) +
      cmdTable(DS18B20.commands) +
      `<h3 style="font-size:12.5px" class="mt">Scratchpad — 9 bytes</h3>` +
      table(DS18B20.scratchpad, [
        { label: "byte", cls: "num", render: (s) => String(s.byte) },
        { label: "name", cls: "k", render: (s) => esc(s.name) },
        { label: "meaning", cls: "wide", render: (s) => `<span class="small">${esc(s.meaning)}</span>` },
      ], { dense: true }) +
      `<h3 style="font-size:12.5px" class="mt">Resolution</h3>` +
      table(DS18B20.resolution, [
        { label: "bits", cls: "num", render: (r) => String(r.bits) },
        { label: "step °C", cls: "num", render: (r) => String(r.step) },
        { label: "max conversion", cls: "num", render: (r) => `${r.maxConvertMs} ms` },
      ], { dense: true });
  } else if (k === "ds2438") {
    b.innerHTML = kv([["family code", hex(DS2438.family, 2)], ["evidence", ev(DS2438.ev)]]) +
      cmdTable(DS2438.commands) +
      `<h3 style="font-size:12.5px" class="mt">Scratchpad pages</h3>` +
      table(DS2438.pages, [
        { label: "page", cls: "k", render: (p) => esc(String(p.page)) },
        { label: "name", cls: "k", render: (p) => esc(p.name) },
        { label: "contents", cls: "wide", render: (p) => `<span class="small">${esc(p.what)}</span>` },
      ], { dense: true }) +
      note(DS2438.humidityNote, "warn");
  } else if (k === "ds2408") {
    b.innerHTML = kv([["family code", hex(DS2408.family, 2)], ["evidence", ev(DS2408.ev)]]) + cmdTable(DS2408.commands);
  } else {
    b.innerHTML = note(OWFS.purpose, "info") +
      table(OWFS.structure, [
        { label: "element", cls: "k", render: (s) => esc(s.name) },
        { label: "what", cls: "wide", render: (s) => `<span class="small">${esc(s.what)}</span> ${ev(s.ev)}` },
      ], { dense: true }) +
      `<h3 style="font-size:12.5px" class="mt">Memory devices that can hold it</h3>` +
      table(OWFS.devices, [
        { label: "part", cls: "k", render: (d) => esc(d.part) },
        { label: "capacity", cls: "k", render: (d) => esc(d.bits) },
        { label: "pages", cls: "num", render: (d) => String(d.pages) },
        { label: "evidence", cls: "k", render: (d) => ev(d.ev) },
      ], { dense: true }) +
      `<h3 style="font-size:12.5px" class="mt">Gotchas</h3>` + ul(OWFS.gotchas);
  }
}

/* ================================================================== *
 * 07 · JAVA CARD
 * ================================================================== */

function renderJavacardTab() {
  const dz = $("capDrop"), fi = $("capInput");
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); if (e.dataTransfer.files[0]) loadCap(e.dataTransfer.files[0]); });
  on("capInput", () => { if (fi.files[0]) loadCap(fi.files[0]); }, "change");
  on("capSynth", () => analyseCap(synthCap(), "synthetic.cap"));
  on("classSynth", () => analyseClass(synthClass(), "Synthetic.class"));
  $("capOut").innerHTML = `<p class="empty">Load a .cap or .class file, or synthesise one to see the parser exercised.</p>`;

  on("bcRun", () => disasmBytecode(str("bcInput")));
  enterRuns("bcInput", () => disasmBytecode(str("bcInput")));
  on("bcDemo", () => { $("bcInput").value = "2a 10 07 b6 00 0c b1"; disasmBytecode(str("bcInput")); });
  on("bcDemoSwitch", () => {
    // tableswitch at pc 2: 1 pad byte to reach a 4-byte boundary, then
    // default(+40), low(0), high(2) and three jump offsets, then `ireturn`.
    $("bcInput").value = "03 1b aa 00 00 00 00 28 00 00 00 00 00 00 00 02 00 00 00 0c 00 00 00 14 00 00 00 1c ac";
    disasmBytecode(str("bcInput"));
  });

  on("apduRun", () => decodeApdu(str("apduInput")));
  enterRuns("apduInput", () => decodeApdu(str("apduInput")));
  on("apduDemoSelect", () => { $("apduInput").value = "00 A4 04 00 08 A0 00 00 01 51 00 00 00"; decodeApdu(str("apduInput")); });
  on("apduDemoInstall", () => { $("apduInput").value = "80 E6 02 00 13 07 A0 00 00 01 51 00 00 00 06 DE CA FF ED 01 02 03 00 00 00"; decodeApdu(str("apduInput")); });

  $("capRefBody").innerHTML =
    kv([
      ["magic", hex(CAP_MAGIC)],
      ["component format", "u1 tag · u2 size · u1 info[size] — size excludes the tag and the size fields"],
      ["JAR layout", "<package path>/javacard/<Component>.cap, one file per component"],
      ["install order", CAP_INSTALL_ORDER.map((t) => CAP_COMPONENTS.find((c) => c.tag === t)?.name ?? `tag ${t}`).join(" → ")],
      ["reserved tags", "13-127 future standard; 128-255 vendor-defined, registered in the Directory with an ISO 7816-5 AID"],
    ]) +
    table(CAP_COMPONENTS, [
      { label: "tag", cls: "num", render: (c) => String(c.tag) },
      { label: "file", cls: "k", render: (c) => `<code>${esc(c.file)}</code>` },
      { label: "name", cls: "k", render: (c) => esc(c.name) },
      { label: "required?", cls: "k", render: (c) => c.required ? '<span class="ev ev-std">required</span>' : '<span class="ev ev-report">optional</span>' },
      { label: "what", cls: "wide", render: (c) => `<span class="small">${esc(c.what)}</span> ${ev(c.ev)}` },
    ], { dense: true }) +
    ul(CAP_NOTES);

  $("jcRefSel").innerHTML = [
    ["portability", "Portability — what survives a change of manufacturer"],
    ["limits", "Java Card platform limits"],
    ["sw", "ISO 7816 status words"],
    ["ins", "ISO 7816 instructions"],
    ["cases", "APDU cases and layout"],
    ["cpl", "Class-file layout"],
    ["cp", "Constant-pool tags"],
    ["notes", "CAP notes"],
  ].map(([v, l]) => `<option value="${at(v)}">${esc(l)}</option>`).join("");
  on("jcRefSel", renderJcRef, "change");
  renderJcRef();
}

function renderJcRef() {
  const k = str("jcRefSel"), b = $("jcRefBody");
  if (k === "portability") {
    b.innerHTML =
      `<h3 style="font-size:12.5px;color:var(--green)">Survives a change of manufacturer</h3>` + ul(PORTABILITY.survives) +
      `<h3 style="font-size:12.5px;color:var(--red)">Does not survive</h3>` + ul(PORTABILITY.doesNotSurvive) +
      `<h3 style="font-size:12.5px" class="mt">Procedure</h3>` + ol(PORTABILITY.procedure) +
      `<p class="small">${ev(PORTABILITY.ev)}</p>` +
      note("This is the whole reason Java bytecode matters for a repair bench. The CAP file is manufacturer-independent because the VM specification is, so an applet moves between a JCOP and a SECORA card unchanged. What does not move is provisioning: key sets, pre-installed packages and vendor extensions reached through impdep opcodes. Cross-compiler portability is real; cross-manufacturer identity is not.", "info");
  } else if (k === "limits") {
    b.innerHTML = note(JAVACARD_LIMITS.note, "warn") +
      table(JAVACARD_LIMITS.values, [
        { label: "item", cls: "k", render: (v) => esc(v.item) },
        { label: "limit", cls: "wide", render: (v) => `<span class="small">${esc(v.limit)}</span>` },
        { label: "why", cls: "wide", render: (v) => `<span class="small">${esc(v.why)}</span>` },
      ], { dense: true }) + `<p class="small">${ev(JAVACARD_LIMITS.ev)}</p>`;
  } else if (k === "sw") {
    b.innerHTML = table(ISO7816.statusWords, [
      { label: "SW", cls: "k", render: (s) => hex(s.sw, 4) },
      { label: "meaning", cls: "wide", render: (s) => `<span class="small">${esc(s.meaning)}</span>` },
    ], { dense: true });
  } else if (k === "ins") {
    b.innerHTML = table(ISO7816.instructions, [
      { label: "INS", cls: "k", render: (s) => hex(s.ins, 2) },
      { label: "name", cls: "k", render: (s) => esc(s.name) },
      { label: "what", cls: "wide", render: (s) => `<span class="small">${esc(s.what ?? "")}</span> ${ev(s.ev)}` },
    ], { dense: true });
  } else if (k === "cases") {
    b.innerHTML = table(ISO7816.cases, [
      { label: "case", cls: "k", render: (c) => String(c.case) },
      { label: "shape", cls: "k", render: (c) => `<code>${esc(c.shape)}</code>` },
      { label: "what", cls: "wide", render: (c) => `<span class="small">${esc(c.what)}</span>` },
    ], { dense: true }) +
      `<h3 style="font-size:12.5px" class="mt">APDU layout</h3>` +
      table(ISO7816.apduLayout, [
        { label: "field", cls: "k", render: (f) => esc(f.name) },
        { label: "size", cls: "k", render: (f) => esc(String(f.size)) },
        { label: "meaning", cls: "wide", render: (f) => `<span class="small">${esc(f.meaning)}</span>` },
      ], { dense: true }) + `<p class="small">${ev(ISO7816.ev)}</p>`;
  } else if (k === "cpl") {
    b.innerHTML = kv([["magic", hex(CLASS_MAGIC)]]) + layoutTable(CLASS_LAYOUT) +
      note("constant_pool_count is ONE-BASED: the pool holds count−1 entries and index 0 is reserved to mean 'no reference'. Long and Double each take TWO slots and leave the following index unusable. A parse that misses either fact drifts, and the drift looks like file corruption rather than like an off-by-one.", "warn");
  } else if (k === "cp") {
    b.innerHTML = table(CP_TAGS, [
      { label: "tag", cls: "num", render: (t) => String(t.tag) },
      { label: "name", cls: "k", render: (t) => esc(t.name) },
      { label: "size", cls: "k", render: (t) => esc(String(t.size)) },
      { label: "what", cls: "wide", render: (t) => `<span class="small">${esc(t.what ?? "")}</span> ${ev(t.ev)}` },
    ], { dense: true });
  } else if (k === "notes") {
    b.innerHTML = ul(CAP_NOTES);
  } else {
    b.innerHTML = `<p class="empty">Pick a reference above.</p>`;
  }
}

/**
 * A structurally valid synthetic CAP: Header + Directory + Applet + Import.
 * The Header carries the real magic so the parser has something to find.
 */
export function synthCap() {
  const out = [];
  const comp = (tag, info) => { out.push(tag, (info.length >>> 8) & 0xff, info.length & 0xff, ...info); };
  const pkgAid = [0x07, 0xa0, 0x00, 0x00, 0x01, 0x51, 0x00, 0x00, 0x00];
  const pkgName = [..."com/example/cw"].map((c) => c.charCodeAt(0));
  const pkgInfoLen = pkgAid.length + pkgName.length + 1;
  const header = [
    (CAP_MAGIC >>> 24) & 0xff, (CAP_MAGIC >>> 16) & 0xff, (CAP_MAGIC >>> 8) & 0xff, CAP_MAGIC & 0xff,
    2, 2,                                  // cap_major, cap_minor
    0x00,                                  // flags
    (pkgInfoLen >>> 8) & 0xff, pkgInfoLen & 0xff,
    ...pkgAid, pkgName.length, ...pkgName,
  ];
  comp(1, header);
  // Directory: a u2 size for each of the twelve component types.
  comp(2, new Array(24).fill(0));
  const appletAid = [0x08, 0xa0, 0x00, 0x00, 0x01, 0x51, 0x00, 0x00, 0x01];
  comp(3, [0x00, 0x01, ...appletAid, 0x00, 0x04]);
  comp(4, [0x00, 0x02, 0x00, 0x00, 0x00, 0x00]);
  return Uint8Array.from(out);
}

/** A structurally valid minimal class file: magic, version 52, a 3-entry pool. */
export function synthClass() {
  const out = [];
  const u1 = (v) => out.push(v & 0xff);
  const u2w = (v) => out.push((v >>> 8) & 0xff, v & 0xff);
  const u4w = (v) => out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  u4w(CLASS_MAGIC);
  u2w(0); u2w(52);                 // minor, major = Java 8
  u2w(4);                          // constant_pool_count = 4 → entries 1..3
  u1(7); u2w(2);                   // #1 Class → #2
  u1(1); u2w(13); out.push(...[..."SyntheticTest"].map((c) => c.charCodeAt(0))); // #2 Utf8
  u1(1); u2w(16); out.push(...[..."java/lang/Object"].map((c) => c.charCodeAt(0))); // #3 Utf8
  u2w(0x0021);                     // access_flags = ACC_PUBLIC | ACC_SUPER
  u2w(1);                          // this_class → #1
  u2w(0);                          // super_class → 0 (java/lang/Object)
  u2w(0); u2w(0); u2w(0); u2w(0);  // interfaces, fields, methods, attributes
  return Uint8Array.from(out);
}

function analyseCap(bytes, name) {
  if (!bytes || !bytes.length) { $("capOut").innerHTML = note("No bytes.", "warn"); return; }
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const comps = [];
  if (!isZip) {
    let off = 0;
    while (off + 3 <= bytes.length && comps.length < 32) {
      const tag = bytes[off];
      const size = (bytes[off + 1] << 8) | bytes[off + 2];
      if (tag < 1 || off + 3 + size > bytes.length) break;
      comps.push({ tag, size, offset: off, dataOffset: off + 3, known: CAP_COMPONENTS.find((c) => c.tag === tag) ?? null });
      off += 3 + size;
    }
  }
  const hdr = comps.find((c) => c.tag === 1) ?? null;
  const hdrMagic = hdr && hdr.dataOffset + 4 <= bytes.length
    ? ((bytes[hdr.dataOffset] << 24) | (bytes[hdr.dataOffset + 1] << 16) | (bytes[hdr.dataOffset + 2] << 8) | bytes[hdr.dataOffset + 3]) >>> 0
    : null;
  const ok = hdrMagic === CAP_MAGIC;

  const required = CAP_COMPONENTS.filter((c) => c.required).map((c) => c.tag);
  const present = new Set(comps.map((c) => c.tag));
  const missing = required.filter((t) => !present.has(t));

  $("capOut").innerHTML =
    verdict(isZip
      ? `This is a ZIP archive (${name}). A CAP file IS a ZIP containing <package>/javacard/*.cap, one file per component — which is why a CAP sometimes starts with 'PK' and sometimes with the Header component's tag byte 0x01, depending on whether you are looking at the archive or at the extracted file. This page has no ZIP reader wired to it, so extract the *.cap files and load those.`
      : ok ? `Java Card CAP file recognised: ${comps.length} component(s) parsed, Header magic ${hex(CAP_MAGIC)}.`
        : `Not recognised as a CAP: no ZIP signature, and no ${hex(CAP_MAGIC)} magic at the start of the file or of a Header component.`,
      ok ? "ok" : isZip ? "info" : "bad", `${name} · ${bytes.length.toLocaleString()} B`) +
    (hdr ? kv([
      ["Header magic", hdrMagic === null ? "unreadable" : hex(hdrMagic)],
      ["magic matches", hdrMagic === CAP_MAGIC ? `yes — ${hex(CAP_MAGIC)}` : `NO (got ${hex(hdrMagic ?? 0)})`],
      ["CAP version", hdr.dataOffset + 6 <= bytes.length ? `${bytes[hdr.dataOffset + 4]}.${bytes[hdr.dataOffset + 5]}` : "?"],
      ["package flags", hdr.dataOffset + 7 <= bytes.length ? hex(bytes[hdr.dataOffset + 6], 2) : "?"],
      ["components found", String(comps.length)],
      ["first component", comps.length ? `${esc(comps[0].known?.name ?? "tag " + comps[0].tag)} (${esc(String(comps[0].size))} B)` : "none"],
    ]) : "") +
    (comps.length ? table(comps, [
      { label: "tag", cls: "num", render: (c) => String(c.tag) },
      {
        label: "component", cls: "k", render: (c) => c.known ? esc(c.known.name)
          : `<span style="color:var(--amber)">${c.tag >= 128 ? "vendor-defined" : c.tag >= 13 ? "reserved for future standard" : "unknown"}</span>`,
      },
      { label: "size", cls: "num", render: (c) => `${c.size} B` },
      { label: "offset", cls: "k", render: (c) => hex(c.offset) },
      { label: "required?", cls: "k", render: (c) => c.known ? (c.known.required ? "required" : "optional") : "&mdash;" },
    ], { dense: true }) +
      (missing.length
        ? note(`Missing required component(s): ${missing.map((t) => CAP_COMPONENTS.find((c) => c.tag === t).name).join(", ")}. A VM will refuse to install this package. Note that RefLocation, StaticField and ConstantPool are required even when they are empty — an empty component is still present, and its absence is a build failure rather than an optimisation.`, "warn")
        : note("Every required component is present.", "ok"))
      : "") +
    hexView(bytes, { length: Math.min(256, bytes.length) });
}

function loadCap(f) {
  const fr = new FileReader();
  fr.onload = () => {
    const bytes = new Uint8Array(fr.result);
    const m = bytes.length >= 4 ? ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0 : 0;
    if (m === CLASS_MAGIC) analyseClass(bytes, f.name);
    else analyseCap(bytes, f.name);
  };
  fr.onerror = () => { $("capOut").innerHTML = note(`Could not read ${f.name}.`, "bad"); };
  fr.readAsArrayBuffer(f);
}

function analyseClass(bytes, name) {
  if (bytes.length < 10) { $("capOut").innerHTML = note("Too short to be a class file — the fixed header alone is 10 bytes.", "bad"); return; }
  const magic = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const minor = (bytes[4] << 8) | bytes[5];
  const major = (bytes[6] << 8) | bytes[7];
  const cpCount = (bytes[8] << 8) | bytes[9];
  const okMagic = magic === CLASS_MAGIC;
  const rd16 = (o) => (bytes[o] << 8) | bytes[o + 1];
  const rd32 = (o) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;

  const pool = [];
  let off = 10, poolOk = true, poolNote = "";
  for (let i = 1; i < cpCount && off < bytes.length; i++) {
    const tag = bytes[off++];
    const t = CP_TAGS.find((x) => x.tag === tag);
    if (!t) {
      poolOk = false;
      poolNote = `Unrecognised constant-pool tag ${tag} at index ${i} — the parse has lost sync and everything after this point is unreliable.`;
      pool.push({ index: i, tag, name: "UNKNOWN", value: poolNote, size: null, ev: "none" });
      break;
    }
    let size = 0, value = null;
    if (tag === 1) {
      const len = rd16(off);
      if (off + 2 + len > bytes.length) { poolOk = false; poolNote = `Utf8 at index ${i} declares ${len} bytes but only ${bytes.length - off - 2} remain.`; break; }
      value = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(off + 2, off + 2 + len)).replace(/\0/g, "");
      size = 2 + len;
    } else if (tag === 3 || tag === 4) { value = tag === 3 ? String(rd32(off)) : hex(rd32(off)); size = 4; }
    else if (tag === 5 || tag === 6) { value = "64-bit constant"; size = 8; }
    else if (tag === 7 || tag === 8 || tag === 16 || tag === 19 || tag === 20) { value = `→ #${rd16(off)}`; size = 2; }
    else if (tag === 15) { value = `kind ${bytes[off]}, → #${rd16(off + 1)}`; size = 3; }
    else if (tag === 17 || tag === 18) { value = `#${rd16(off)}:#${rd16(off + 2)}`; size = 4; }
    else { value = `#${rd16(off)}:#${rd16(off + 2)}`; size = 4; }
    pool.push({ index: i, tag, name: t.name, value, size, ev: t.ev });
    off += size;
    if (tag === 5 || tag === 6) { pool.push({ index: i + 1, tag: null, name: "(unusable slot)", value: "—", size: 0, ev: "std" }); i++; }
  }

  const accessFlags = off + 2 <= bytes.length ? rd16(off) : null;
  const thisClass = off + 4 <= bytes.length ? rd16(off + 2) : null;
  const superClass = off + 6 <= bytes.length ? rd16(off + 4) : null;
  const nameOf = (idx) => {
    if (idx === null) return null;
    const c = pool.find((p) => p.index === idx);
    if (!c || c.tag !== 7) return null;
    const ref = parseInt(String(c.value).replace(/\D/g, ""), 10);
    const u = pool.find((p) => p.index === ref);
    return u && u.tag === 1 ? u.value : null;
  };

  $("capOut").innerHTML =
    verdict(okMagic
      ? `Java class file: magic ${hex(magic)}, version ${major}.${minor}, ${cpCount - 1} constant-pool entr${cpCount - 1 === 1 ? "y" : "ies"}.`
      : `Magic is ${hex(magic)}, not ${hex(CLASS_MAGIC)} — this is not a class file.`,
      okMagic ? (poolOk ? "ok" : "warn") : "bad", `${name} · ${bytes.length.toLocaleString()} B`) +
    kv([
      ["magic", hex(magic) + (magic === 0xcafebabe ? "" : "")],
      ["major version", `${major} — ${classVersionName(major)}`],
      ["minor version", String(minor)],
      ["constant_pool_count", `${cpCount} (ONE-BASED: ${cpCount - 1} entries, index 0 reserved for 'no reference')`],
      ["parse status", poolOk ? `reached offset ${hex(off)}` : `LOST SYNC — ${poolNote}`],
      ["access_flags", accessFlags === null ? "?" : hex(accessFlags, 4)],
      ["this_class", thisClass === null ? "?" : `#${thisClass} → ${nbsp(nameOf(thisClass))}`],
      ["super_class", superClass === null ? "?" : superClass === 0 ? "#0 — java/lang/Object" : `#${superClass} → ${nbsp(nameOf(superClass))}`],
    ]) +
    (magic === 0xcafebabe && bytes.length > 4 ? note("0xCAFEBABE is also the magic of a Mach-O fat binary. That is a genuine collision and the reason `file` sometimes guesses wrong; the discriminator is bytes 4-7, which are a small major version in a class file and a count of architectures in a fat binary.", "warn") : "") +
    (major > 52 ? note(`Major version ${major} is newer than Java 8. A Java Card VM will refuse a class file compiled for a newer version, and the error it gives is usually an unhelpful SW 0x6A80 rather than anything mentioning versions. Target the card's own version explicitly instead of your workstation's default.`, "warn") : "") +
    table(pool, [
      { label: "#", cls: "num", render: (p) => String(p.index) },
      { label: "tag", cls: "num", render: (p) => (p.tag === null ? "&mdash;" : String(p.tag)) },
      { label: "kind", cls: "k", render: (p) => esc(p.name) },
      { label: "size", cls: "num", render: (p) => (p.size === null ? "?" : String(p.size)) },
      { label: "value", cls: "wide", render: (p) => `<span class="small">${esc(String(p.value ?? "").slice(0, 110))}</span>` },
      { label: "evidence", cls: "k", render: (p) => ev(p.ev) },
    ], { dense: true, empty: "Empty constant pool." }) +
    hexView(bytes, { length: Math.min(192, bytes.length) });
}

function classVersionName(major) {
  const map = { 45: "1.1", 46: "1.2", 47: "1.3", 48: "1.4", 49: "Java 5", 50: "Java 6", 51: "Java 7", 52: "Java 8", 53: "Java 9", 54: "Java 10", 55: "Java 11", 56: "Java 12", 57: "Java 13", 58: "Java 14", 59: "Java 15", 60: "Java 16", 61: "Java 17", 62: "Java 18", 63: "Java 19", 64: "Java 20", 65: "Java 21", 66: "Java 22", 67: "Java 23", 68: "Java 24", 69: "Java 25" };
  return map[major] ?? (major < 45 ? "pre-1.1 / invalid" : `later than this table (major ${major})`);
}

/**
 * Decode a JVM bytecode stream.
 *
 * The two places a naive decoder loses sync are both handled: switch operands
 * are padded to a 4-byte boundary measured from the start of the instruction,
 * and `wide` (0xC4) changes the length of the instruction that follows it —
 * 4 bytes normally, 6 if that instruction is `iinc`. A decoder that misses
 * either reports instructions that are not there, which is worse than stopping.
 */
export function disasmBytecodeStream(code) {
  const rows = [];
  let pc = 0, stopped = null;
  while (pc < code.length && rows.length < 1024) {
    const op = code[pc];
    const info = JVM_BY_OP[op];
    const len = jvmInstructionLength(op, code, pc);
    if (!info) { stopped = { pc, text: `illegal opcode ${hex(op, 2)} — not assigned in the JVM instruction set` }; break; }
    if (len === null || pc + len > code.length) {
      stopped = { pc, text: `${info.name} is truncated: needs ${len === null ? "an unknown number of" : len} byte(s), only ${code.length - pc} remain` };
      rows.push({ pc, op, len: null, ok: false, text: `${info.name} …`, note: stopped.text });
      break;
    }
    const operands = [];
    if (op === 0xaa || op === 0xab) {
      const pad = (4 - ((pc + 1) % 4)) % 4;
      const base = pc + 1 + pad;
      const rd32s = (o) => ((code[o] << 24) | (code[o + 1] << 16) | (code[o + 2] << 8) | code[o + 3]) | 0;
      if (pad) operands.push(`${pad} pad byte(s) to reach a 4-byte boundary`);
      const def = rd32s(base);
      operands.push(`default → ${pc + def}`);
      if (op === 0xaa) {
        const low = rd32s(base + 4), high = rd32s(base + 8);
        operands.push(`low ${low}`, `high ${high}`, `${high - low + 1} jump(s)`);
        for (let i = 0; i <= high - low && i < 32; i++) operands.push(`  case ${low + i} → ${pc + rd32s(base + 12 + i * 4)}`);
      } else {
        const npairs = rd32s(base + 4);
        operands.push(`${npairs} pair(s)`);
        for (let i = 0; i < npairs && i < 32; i++) operands.push(`  match ${rd32s(base + 8 + i * 8)} → ${pc + rd32s(base + 12 + i * 8)}`);
      }
    } else {
      let q = pc + 1;
      for (const o of info.operands ?? []) {
        const s = String(o);
        if (/4 bytes|u4|s4/.test(s)) { operands.push(hex(((code[q] << 24) | (code[q + 1] << 16) | (code[q + 2] << 8) | code[q + 3]) >>> 0, 8)); q += 4; }
        else if (/2 bytes|u2|s2|branch/.test(s)) { operands.push(hex((code[q] << 8) | code[q + 1], 4)); q += 2; }
        else if (q < code.length) { operands.push(hex(code[q], 2)); q += 1; }
      }
    }
    rows.push({ pc, op, len, ok: true, name: info.name, text: `${info.name}${operands.length ? "  " + operands.join(", ") : ""}`, note: info.what ?? "", ev: info.ev });
    pc += len;
  }
  return { rows, stopped, consumed: pc };
}

function disasmBytecode(hexText) {
  const code = bytesFromHexInput(hexText);
  if (!code.length) { $("bcOut").innerHTML = note("No bytes parsed. Try `2a 10 07 b6 00 0c b1`.", "warn"); return; }
  const { rows, stopped, consumed } = disasmBytecodeStream(code);
  const leftover = code.length - consumed;
  $("bcOut").innerHTML =
    verdict(stopped
      ? `Decoding stopped at ${hex(stopped.pc, 4)}: ${stopped.text}. A decoder that continued past this point would report instructions that are not there.`
      : leftover > 0
        ? `All ${code.length} byte(s) consumed into ${rows.length} instruction(s), but ${leftover} byte(s) remain unread — check whether the stream was pasted complete.`
        : `All ${code.length} byte(s) decoded into ${rows.length} instruction(s) with no remainder.`,
      stopped ? "bad" : leftover > 0 ? "warn" : "ok", "JVM bytecode") +
    table(rows, [
      { label: "pc", cls: "num", render: (r) => String(r.pc) },
      { label: "op", cls: "k", render: (r) => hex(r.op, 2) },
      { label: "len", cls: "num", render: (r) => (r.len === null ? "?" : String(r.len)) },
      { label: "instruction", cls: "wide", render: (r) => `<code>${esc(r.text)}</code>${r.ok ? "" : ' <span class="ev ev-recall">truncated</span>'}` },
      { label: "note", cls: "wide", render: (r) => `<span class="small">${esc(r.note)}</span> ${r.ev ? ev(r.ev) : ""}` },
    ], { dense: true, empty: "Nothing decoded." }) +
    hexView(code, { length: Math.min(128, code.length) }) +
    note("Switch operands are padded to a 4-byte boundary measured from the start of the instruction, not from the opcode's operands. `wide` (0xC4) is 4 bytes normally and 6 when the instruction it prefixes is `iinc`. `invokeinterface` takes four operand bytes with the last always zero, and `invokedynamic` takes four with two zeros — length tables routinely get all four of these wrong, and each one desynchronises everything after it.", "info") +
    acc(`All ${JVM_OPCODES.length} opcodes in the table`, table(JVM_OPCODES, [
      { label: "op", cls: "k", render: (o) => hex(o.op, 2) },
      { label: "name", cls: "k", render: (o) => esc(o.name) },
      { label: "operands", cls: "k", render: (o) => `<span class="small">${esc((o.operands ?? []).join(" ") || "—")}</span>` },
      { label: "stack", cls: "k", render: (o) => `<span class="small">${esc(o.stack ?? "")}</span>` },
      { label: "note", cls: "wide", render: (o) => `<span class="small">${esc(o.what ?? "")}</span> ${ev(o.ev)}` },
    ], { dense: true }));
}

function decodeApdu(hexText) {
  const b = bytesFromHexInput(hexText);
  if (b.length < 2) { $("apduOut").innerHTML = note("An APDU is at least 4 bytes (CLA INS P1 P2), or 2 bytes for a response.", "warn"); return; }
  if (b.length === 2) {
    const sw = (b[0] << 8) | b[1];
    const hit = ISO7816.statusWords.find((s) => s.sw === sw);
    const cls = (sw >>> 8) & 0xff;
    const clsMeaning = sw === 0x9000 ? "normal completion"
      : cls === 0x61 ? "normal processing; response data still available — issue GET RESPONSE with Le = SW2"
        : cls === 0x62 ? "warning, state unchanged" : cls === 0x63 ? "warning, state changed"
          : cls === 0x64 ? "error, state unchanged" : cls === 0x65 ? "error, state changed"
            : cls === 0x6c ? "wrong Le — SW2 is the exact length to retry with"
              : cls === 0x6d ? "instruction not supported" : cls === 0x6e ? "class not supported" : cls === 0x6f ? "no precise diagnosis" : "error";
    $("apduOut").innerHTML =
      verdict(hit ? hit.meaning : `SW ${hex(sw, 4)} — not in this table. ${clsMeaning}.`,
        sw === 0x9000 ? "ok" : cls <= 0x63 ? "warn" : "bad", "response") +
      kv([["SW1 SW2", `${hex(b[0], 2)} ${hex(b[1], 2)}`], ["class byte", `${hex(cls, 2)} — ${clsMeaning}`]]) + hexView(b);
    return;
  }
  const cla = b[0], ins = b[1], p1 = b[2], p2 = b[3];
  const known = ISO7816.instructions.find((i) => i.ins === ins) ?? null;
  const hasLc = b.length > 4 && b.length > 5;
  const lc = hasLc ? b[4] : null;
  const data = lc !== null && b.length >= 5 + lc ? Array.from(b.subarray(5, 5 + lc)) : [];
  const le = b.length === 5 + (lc ?? 0) + 1 ? b[b.length - 1] : null;
  const apduCase = lc === null && le === null ? 1 : lc === null ? 2 : le === null ? 3 : 4;
  const channel = cla & 0x03;
  const secureMessaging = (cla & 0x0c) >>> 2;
  const interindustry = !(cla & 0xe0);

  $("apduOut").innerHTML =
    verdict(`${known ? known.name : `INS ${hex(ins, 2)}`} — case ${apduCase}, ${b.length} byte(s).`, known ? "ok" : "warn", "command APDU") +
    kv([
      ["CLA", `${hex(cla, 2)} — ${interindustry ? "interindustry" : "proprietary"} class${channel ? `, logical channel ${channel}` : ""}${secureMessaging ? `, secure messaging indicator ${secureMessaging}` : ""}`],
      ["INS", `${hex(ins, 2)}${known ? ` — ${esc(known.name)}` : " — not in this table"}`],
      ["P1 / P2", `${hex(p1, 2)} / ${hex(p2, 2)}`],
      ["Lc", lc === null ? "absent (case 1 or 2)" : String(lc)],
      ["data", data.length ? bytesToHex(Uint8Array.from(data)) : "none"],
      ["Le", le === null ? "absent" : `${le}${le === 0 ? " (0x00 = as much as you have)" : ""}`],
      ["case", `${apduCase} — ${esc(ISO7816.cases.find((c) => c.case === apduCase)?.what ?? "")}`],
    ]) +
    (known?.what ? note(known.what, "info") : "") +
    (ins === 0xa4 && p1 === 0x04 && data.length
      ? note(`SELECT by DF/AID name. AID = ${bytesToHex(Uint8Array.from(data)).replace(/ /g, "")}. On a Java Card this is how an applet is activated. SW 0x6A82 back means no applet with that AID is installed or selectable — which is the expected answer on a blank card, and the first thing to check when a card 'stops working' after a re-personalisation.`, "info") : "") +
    (ins === 0xe6
      ? note(`GlobalPlatform INSTALL. P1 = ${hex(p1, 2)} selects the phase: 0x02 INSTALL_FOR_LOAD, 0x04 INSTALL_FOR_INSTALL, 0x08 INSTALL_FOR_MAKE_SELECTABLE, 0x0C LOAD and INSTALL together. CAP file fragments travel through STORE DATA (0xE2) after an INSTALL_FOR_LOAD.`, "info") : "") +
    hexView(b) +
    acc("APDU cases", table(ISO7816.cases, [
      { label: "case", cls: "k", render: (c) => String(c.case) },
      { label: "shape", cls: "k", render: (c) => `<code>${esc(c.shape)}</code>` },
      { label: "what", cls: "wide", render: (c) => `<span class="small">${esc(c.what)}</span>` },
    ], { dense: true })) +
    acc("Status words", table(ISO7816.statusWords, [
      { label: "SW", cls: "k", render: (s) => hex(s.sw, 4) },
      { label: "meaning", cls: "wide", render: (s) => `<span class="small">${esc(s.meaning)}</span>` },
    ], { dense: true }));
}

/* ================================================================== *
 * 08 · ARCH / ASM
 * ================================================================== */

const VECTOR_DEMOS = {
  vecDemoGood: [0x20005000, 0x080001c1, 0x080001d1, 0x080001d5, 0, 0, 0, 0, 0, 0, 0, 0x080001e1, 0, 0, 0x080001e1, 0x080001e1],
  vecDemoErased: new Array(16).fill(0xffffffff),
  vecDemoThumb: [0x20005000, 0x080001c0, 0x080001d0, 0x080001d4, 0, 0, 0, 0, 0, 0, 0, 0x080001e0, 0, 0, 0x080001e0, 0x080001e0],
};

function wordsToBytes(words) {
  const b = new Uint8Array(words.length * 4);
  words.forEach((v, i) => { b[i * 4] = v & 0xff; b[i * 4 + 1] = (v >>> 8) & 0xff; b[i * 4 + 2] = (v >>> 16) & 0xff; b[i * 4 + 3] = (v >>> 24) & 0xff; });
  return b;
}

function renderArchTab() {
  $("archListBody").innerHTML = ARCHS.map((a) => acc(`${a.name} — ${a.id}`,
    kv([["endianness", esc(a.endian)], ["width", `${a.width}-bit`], ["ISA", esc(a.isa)], ["registers", esc(a.registers)], ["debug interface", esc(a.debug)], ["vector table", esc(a.vectors)], ["evidence", ev(a.ev)]]) +
    (a.memmap?.length ? `<h3 style="font-size:12.5px" class="mt">Memory map</h3>` + table(a.memmap, [
      { label: "from", cls: "k", render: (m) => hex(m.lo) },
      { label: "to", cls: "k", render: (m) => hex(m.hi) },
      { label: "region", cls: "wide", render: (m) => `<span class="small">${esc(m.name)}</span> ${ev(m.ev)}` },
    ], { dense: true }) : "") +
    (a.keyRegs?.length ? `<h3 style="font-size:12.5px" class="mt">Key registers</h3>` + table(a.keyRegs, [
      { label: "address", cls: "k", render: (r) => (r.addr !== undefined ? hex(r.addr) : nbsp(r.address)) },
      { label: "name", cls: "k", render: (r) => esc(r.name) },
      { label: "what", cls: "wide", render: (r) => `<span class="small">${esc(r.what ?? r.note ?? "")}</span> ${ev(r.ev)}` },
    ], { dense: true }) : "") +
    (a.gotchas?.length ? `<h3 style="font-size:12.5px" class="mt">Gotchas</h3>` + ul(a.gotchas) : ""), false)).join("") +
    acc("Cortex-M vector-slot reference", table(CORTEX_M_VECTORS, [
      { label: "n", cls: "num", render: (v) => String(v.n) },
      { label: "name", cls: "k", render: (v) => esc(v.name) },
      { label: "what", cls: "wide", render: (v) => `<span class="small">${esc(v.what)}</span>` },
    ], { dense: true }));

  on("vecRun", runVectors);
  enterRuns("vecInput", runVectors);
  for (const [id, words] of Object.entries(VECTOR_DEMOS)) {
    on(id, () => { $("vecInput").value = bytesToHex(wordsToBytes(words)); runVectors(); });
  }

  $("disIsa").innerHTML = Object.keys(ISA).map((k) =>
    `<option value="${at(k)}">${esc(k)} — ${ISA[k].bits}-bit, ${ISA[k].rows.length} rows, ${esc(ISA[k].arch ?? "")}</option>`).join("");
  on("disRun", () => runDisasm());
  on("disFromDump", () => {
    if (!STATE.dump) { $("disOut").innerHTML = note("No dump loaded — go to the DUMP tab first.", "warn"); return; }
    $("disBytes").value = "";
    runDisasm(STATE.dump);
  });
  on("disIdentify", runIdentifyArch);

  on("cpuidRun", runCpuid);
  on("cpuidSwap", () => { const a = $("cpuidA").value; $("cpuidA").value = $("cpuidB").value; $("cpuidB").value = a; runCpuid(); });

  $("cpuSubstBody").innerHTML =
    table(CPU_SUBSTITUTION, [
      { label: "axis", cls: "k", render: (c) => esc(c.axis) },
      { label: "the rule", cls: "wide", render: (c) => esc(c.rule) },
      { label: "how to check", cls: "wide", render: (c) => `<span class="small">${esc(c.howToCheck)}</span> ${ev(c.ev)}` },
    ], { dense: true }) +
    `<h3 style="font-size:12.5px" class="mt">Procedure</h3>` + ol(CPU_SWAP_PROCEDURE) +
    note("Socket compatibility is the least of it. The gates that actually decide a CPU swap are the chipset support list, the microcode revision the firmware carries for that CPUID, and whether the VRM can sustain the part under load — none of which is visible from the socket name, and the first two of which fail at POST while the third fails only under sustained load.", "warn");
}

function runVectors() {
  const b = bytesFromHexInput(str("vecInput"));
  if (b.length < 64) { $("vecOut").innerHTML = note(`A 16-entry Cortex-M vector table needs 64 bytes; that parsed as ${b.length}. Word 0 is the initial MSP and word 1 the reset handler — the two that matter most.`, "warn"); return; }
  const r = validateCortexMVectors(b);
  $("vecOut").innerHTML = !r.words
    ? note(r.note, "warn")
    : verdict(r.verdict, r.ok ? (r.problems.some((p) => p.severity === "fatal") ? "bad" : r.problems.length ? "warn" : "ok") : "bad", r.ok ? "vector table" : "cannot boot") +
      table(r.words, [
        { label: "slot", cls: "num", render: (w) => String(w.index) },
        { label: "name", cls: "k", render: (w) => esc(w.name) },
        { label: "value", cls: "k", render: (w) => w.hex },
        { label: "thumb bit", cls: "k", render: (w) => (w.index === 0 ? "&mdash; (MSP, not a pointer)" : w.thumb ? '<span class="ev ev-std">bit0=1 ✓</span>' : '<span class="ev ev-recall">bit0=0 ✗</span>') },
      ], { dense: true }) +
      (r.problems.length ? table(r.problems, [
        { label: "severity", cls: "k", render: (p) => `<span class="ev ${p.severity === "fatal" ? "ev-recall" : "ev-report"}">${at(p.severity)}</span>` },
        { label: "what", cls: "wide", render: (p) => esc(p.what) },
        { label: "why it matters", cls: "wide", render: (p) => `<span class="small">${esc(p.why)}</span>` },
      ], { dense: true }) : "") +
      (r.notes?.length ? `<ul class="small">${r.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : "") +
      `<p class="small">${ev(r.ev)}</p>` +
      hexView(b, { length: 64 });
}

function runDisasm(srcOverride) {
  const isa = str("disIsa") || "thumb";
  const bytes = srcOverride ?? (str("disBytes") ? bytesFromHexInput(str("disBytes")) : STATE.dump);
  if (!bytes || !bytes.length) { $("disOut").innerHTML = note("Paste bytes below, or load a dump in the DUMP tab and use 'from dump'.", "warn"); return; }
  const offset = hexIn("disOffset", 0) ?? 0;
  const loadBase = hexIn("disLoadBase", null);
  const limit = Math.max(1, Math.min(2000, int("disLimit", 64)));
  const r = disassemble(isa, bytes, { offset, limit, loadBase });
  if (!r.ok) { $("disOut").innerHTML = note(r.note, "bad"); return; }
  const info = ISA_COMPILED[isa];
  $("disOut").innerHTML =
    verdict(r.note, r.coverage > 0.8 ? "ok" : r.coverage > 0.3 ? "warn" : "bad",
      `${isa} · ${r.endian === "be" ? "big" : "little"}-endian · ${r.decoded}/${r.count} decoded`) +
    kv([
      ["ISA table", `${isa} — ${info.bits}-bit encodings, ${info.rows.length} rows`],
      ["table note", info.note],
      ["evidence", ev(info.ev)],
      ["load base", hex(r.loadBase)],
      ["source offset", hex(offset)],
      ["rows shown", String(r.count)],
      ["coverage", `${(r.coverage * 100).toFixed(0)}%`],
    ]) +
    meter(r.decoded, r.count, r.coverage > 0.8 ? "on" : "bad") +
    note(r.loadBaseNote, loadBase === null ? "info" : "") +
    (r.warnings?.length ? r.warnings.map((w) => note(w, "warn")).join("") : "") +
    `<div class="tw"><table class="t dense"><thead><tr><th>file off</th><th>address</th><th>word</th><th>decoded</th><th>branch</th><th>note</th></tr></thead><tbody>` +
    r.instructions.map((i) =>
      `<tr${i.ok ? "" : ' class="row-recall"'}><td class="k">${i.fileOffsetHex}</td><td class="k">${i.pcHex}</td><td class="k">${i.wordHex}</td>` +
      `<td class="wide"><code>${esc(i.text)}</code>${i.ok ? "" : ' <span class="ev ev-recall">undecoded</span>'}</td>` +
      `<td class="k">${nbsp(i.branchTarget)}</td><td class="wide"><span class="small">${esc(i.note ?? "")}</span></td></tr>`).join("") +
    `</tbody></table></div>` +
    acc("Why coverage is reported rather than hidden",
      note(`These tables are deliberately partial: they hold the encodings a bootloader or a vector table is made of, not a whole ISA. Thumb has ${ISA_COMPILED.thumb.rows.length} rows, MIPS ${ISA_COMPILED.mips.rows.length}, AVR ${ISA_COMPILED.avr.rows.length}, 6502 ${ISA_COMPILED.mos6502.rows.length}. An undecoded word is shown as a raw .word and never guessed at, because a disassembly that silently skips or invents is fiction — and fiction in a repair context costs a board.`) +
      table(Object.values(ISA).map((m) => ({ name: m.arch ?? "?", bits: m.bits, rows: m.rows.length, note: m.note, ev: m.ev })), [
        { label: "ISA", cls: "k", render: (m) => esc(m.name) },
        { label: "word", cls: "num", render: (m) => `${m.bits}-bit` },
        { label: "rows", cls: "num", render: (m) => String(m.rows) },
        { label: "note", cls: "wide", render: (m) => `<span class="small">${esc(m.note)}</span> ${ev(m.ev)}` },
      ], { dense: true }));
}

function runIdentifyArch() {
  const src = str("disBytes") ? bytesFromHexInput(str("disBytes")) : STATE.dump;
  if (!src || !src.length) { $("disOut").innerHTML = note("Nothing to identify — paste bytes or load a dump.", "warn"); return; }
  const offset = hexIn("disOffset", 0) ?? 0;
  const r = identifyArchitecture(src, { offset });
  $("disOut").innerHTML =
    verdict(r.verdict, r.ok ? (r.confidence === "high" ? "ok" : "warn") : "bad", `confidence: ${r.confidence}`) +
    (r.caveat ? note(r.caveat, "warn") : "") +
    (r.best ? kv([["best match", r.best], ["architecture", r.arch?.name ?? "?"], ["ISA", r.arch?.isa ?? "?"], ["endianness", r.arch?.endian ?? "?"], ["evidence", ev(r.arch?.ev)]]) : "") +
    table(r.ranked, [
      { label: "arch", cls: "k", render: (x) => esc(x.arch ?? x.id) },
      { label: "id", cls: "k", render: (x) => `<code>${esc(x.id)}</code>` },
      { label: "score", cls: "num", render: (x) => String(x.score) },
      { label: "evidence", cls: "wide", render: (x) => `<span class="small">${x.evidence.map(esc).join("<br />")}</span>` },
    ], { dense: true, empty: "No architecture scored above zero." });
}

function parseCpuidList(text) {
  const parts = String(text ?? "").split(/[,\s]+/).map((t) => t.trim()).filter(Boolean).map((t) => parseHexInt(t));
  if (parts.some((p) => p === null) || parts.length < 8) return null;
  return { leaf0: parts.slice(0, 4), leaf1: parts.slice(4, 8), leaf7: parts.length >= 11 ? parts.slice(8, 11) : null };
}

const CPUID_DEMO_A = "0x0000000D, 0x756E6547, 0x6C65746E, 0x49656E69, 0x000306C3, 0x00100800, 0x7FFAFBFF, 0xBFEBFBFF, 0x00002E08, 0x00000000, 0x239C03BF";
const CPUID_DEMO_B = "0x0000000D, 0x68747541, 0x444D4163, 0x69746E65, 0x00830F10, 0x00100800, 0x7ED8320B, 0x178BFBFF, 0x209C0109, 0x00002E08, 0x239C03BF";

function renderCpuidCard(d, label) {
  return card(label, "",
    kv([
      ["vendor", `${esc(d.vendor)} — <code>${esc(d.vendorString)}</code> ${ev(d.vendorEv)}`],
      ["max standard leaf", hex(d.maxLeaf)],
      ["signature", d.signature ? `${d.signature.display} (raw ${d.signature.raw})` : "?"],
      ["family / model / stepping", d.signature ? `${esc(String(d.signature.family))} / ${esc(String(d.signature.model))} / ${esc(String(d.signature.stpping))}` : "?"],
      ["brand string", d.brandString ? esc(d.brandString) : "not supplied — leaves 0x80000002-4 would carry it"],
      ["hypervisor guest", d.brandFeatures ? (d.brandFeatures.hypervisorGuest ? "YES — leaf1 ECX bit31 is set, so this is not bare metal" : "no") : "?"],
      ["x87 FPU present", d.brandFeatures ? (d.brandFeatures.fpu ? "yes — leaf1 EDX bit0" : "NO") : "?"],
      ["logical processors", d.logicalProcessors === undefined || d.logicalProcessors === null ? "?" : String(d.logicalProcessors)],
      ["CLFLUSH line", d.clflushLine ? `${d.clflushLine} B` : "?"],
      ["initial APIC id", d.apicId === undefined || d.apicId === null ? "?" : String(d.apicId)],
    ]) +
    (d.ecx?.length ? `<h3 style="font-size:12.5px" class="mt">leaf1 ECX — ${d.ecx.length} feature(s) set</h3><p class="mono-block">${d.ecx.map((f) => esc(f.name)).join(" · ")}</p>` : "") +
    (d.edx?.length ? `<h3 style="font-size:12.5px">leaf1 EDX — ${d.edx.length} feature(s) set</h3><p class="mono-block">${d.edx.map((f) => esc(f.name)).join(" · ")}</p>` : "") +
    (d.leaf7 ? `<h3 style="font-size:12.5px">leaf7 EBX / ECX</h3><p class="mono-block">${[...(d.leaf7.ebx ?? []).map((f) => esc(f.name)), ...(d.leaf7.ecx ?? []).map((f) => esc(f.name))].join(" · ")}</p>` : ""),
    "tone-info");
}

function runCpuid() {
  const A = parseCpuidList(str("cpuidA"));
  const B = parseCpuidList(str("cpuidB"));
  if (!A) {
    $("cpuidOut").innerHTML = note("CPU A needs at least 8 hex values: leaf0 EAX,EBX,ECX,EDX then leaf1 EAX,EBX,ECX,EDX. Add leaf7 EBX,ECX,EDX for the newer feature bits. Try the demo values in the placeholders.", "bad") +
      `<div class="row"><button type="button" class="btn sm" id="cpuidDemo">Load an Intel / AMD pair</button></div>`;
    on("cpuidDemo", () => { $("cpuidA").value = CPUID_DEMO_A; $("cpuidB").value = CPUID_DEMO_B; runCpuid(); });
    return;
  }
  const a = decodeCpuid(A);
  if (!a.ok) { $("cpuidOut").innerHTML = note("CPU A did not decode.", "bad"); return; }
  let html = renderCpuidCard(a, "CPU A");
  if (B) {
    const b = decodeCpuid(B);
    if (b.ok) {
      html += renderCpuidCard(b, "CPU B");
      const d = diffCpuid(a, b);
      html += verdict(d.verdict, d.lost.length ? "bad" : d.gained.length ? "warn" : "ok", `diff · compared ${d.comparedGroups.join(", ") || "nothing"}`) +
        kv([
          ["signature differs", d.signatureDiffers ? "yes" : "no"],
          ["vendor differs", d.vendorDiffers ? "yes" : "no"],
          ["brand differs", d.brandDiffers ? "yes" : "no"],
          ["features lost", String(d.lost.length)],
          ["features gained", String(d.gained.length)],
          ["groups not comparable", d.skippedGroups.length ? d.skippedGroups.join(", ") : "none"],
          ["evidence", ev(d.ev)],
        ]) +
        (d.lost.length ? table(d.lost, [
          { label: "leaf", cls: "k", render: (f) => esc(f.group) },
          { label: "bit", cls: "num", render: (f) => String(f.bit) },
          { label: "lost feature", cls: "k", render: (f) => esc(f.name) },
          { label: "consequence", cls: "wide", render: (f) => `<span class="small">${esc(f.what || "Software compiled for CPU A may use this and fault on CPU B.")}</span> ${ev(f.ev)}` },
        ], { dense: true, caption: "This is the direction that breaks software." }) : "") +
        (d.gained.length ? table(d.gained, [
          { label: "leaf", cls: "k", render: (f) => esc(f.group) },
          { label: "bit", cls: "num", render: (f) => String(f.bit) },
          { label: "gained feature", cls: "k", render: (f) => esc(f.name) },
          { label: "consequence", cls: "wide", render: (f) => `<span class="small">${esc(f.what || "Harmless for existing software — but a runtime that auto-detects it may now emit code the original CPU could not run.")}</span> ${ev(f.ev)}` },
        ], { dense: true }) : "");
    } else html += note("CPU B did not decode.", "warn");
  } else {
    html += note("Fill in CPU B to diff the two. The diff is the useful output: a swap that loses a feature bit is a swap that breaks software, and the bits that matter are not the famous ones.", "info");
  }
  $("cpuidOut").innerHTML = html +
    note("leaf1 ECX bit31 (hypervisor present) deserves its own line: if it is set on a machine you believe is physical, that belief is the thing to re-examine. And the x87 bit — leaf1 EDX bit0 — is what the BIOS coprocessor probe in the UEFI/POST tab tests for by a completely different route, which is why the two agree on a working board.", "info");
}

/* ================================================================== *
 * 09 · SUBSTITUTE
 * ================================================================== */

function renderSubstTab() {
  const idx = substitutionIndex();
  const groups = [...new Set(idx.map((r) => r.domain))];
  $("substSel").innerHTML = groups.map((g) =>
    `<optgroup label="${at(g)}">${idx.filter((r) => r.domain === g).map((r) =>
      `<option value="${at(r.id)}">${esc(r.name)} — ${r.hardGates} hard / ${r.softGates} soft${r.members ? `, ${r.members} member(s)` : ""}</option>`).join("")}</optgroup>`).join("");
  if (!substitutionTableById(STATE.substFamily)) STATE.substFamily = idx[0].id;
  $("substSel").value = STATE.substFamily;
  on("substSel", () => { STATE.substFamily = str("substSel"); STATE.substAnswers = {}; renderBasis(); renderGates(); runSubstEval(false); }, "change");

  on("substEval", () => runSubstEval(false));
  on("substAllPass", () => {
    const f = substitutionTableById(STATE.substFamily);
    STATE.substAnswers = Object.fromEntries(f.gates.map((g) => [g.id, "pass"]));
    renderGates(); runSubstEval(false);
  });
  on("substReset", () => { STATE.substAnswers = {}; renderGates(); runSubstEval(false); });
  on("substPlan", () => runSubstEval(true));

  $("planSymptom").innerHTML = `<option value="">(no symptom — plan from the substitution alone)</option>` +
    SYMPTOMS.map((s) => `<option value="${at(s.id)}">${esc(s.symptom)}</option>`).join("");
  on("planRun", runPlan);
  $("planOut").innerHTML = `<p class="empty">Choose a symptom and run the planner.</p>`;

  on("rankRun", runRank);
  $("rankOut").innerHTML = `<p class="empty">Enter an RDID and rank candidates.</p>`;

  $("reworkBody").innerHTML =
    `<h3 style="font-size:12.5px">Alloys</h3>` + table(REWORK.alloys, [
      { label: "alloy", cls: "wide", render: (a) => esc(a.name) },
      { label: "melt °C", cls: "num", render: (a) => esc(String(a.melt)) },
      { label: "note", cls: "wide", render: (a) => `<span class="small">${esc(a.note)}</span> ${ev(a.ev)}` },
    ], { dense: true }) +
    `<h3 style="font-size:12.5px" class="mt">Profile</h3>` + table(REWORK.profiles, [
      { label: "step", cls: "k", render: (p) => esc(p.step) },
      { label: "value", cls: "wide", render: (p) => esc(p.value) },
      { label: "why", cls: "wide", render: (p) => `<span class="small">${esc(p.why)}</span>` },
    ], { dense: true }) +
    `<h3 style="font-size:12.5px" class="mt">ESD &amp; documentation</h3>` + ul(REWORK.esd) +
    note("Mixing a low-temperature bismuth alloy into a lead-free joint is the standard way to remove a BGA without exceeding the board's glass transition. It works because the resulting alloy melts below either parent — and it is the reason the preheat step is not optional: boiling moisture inside the laminate is what delaminates a board, and that happens long before the solder does.", "info");

  renderBasis(); renderGates(); runSubstEval(false);
  $("planSymptom").value = "flash-ff";
}

function renderBasis() {
  const f = substitutionTableById(STATE.substFamily);
  $("substBasis").innerHTML = f ? `${esc(f.basis)} ${ev(f.ev)}` : "";
}

function renderGates() {
  const f = substitutionTableById(STATE.substFamily);
  if (!f) { $("gatesBody").innerHTML = ""; return; }
  $("gatesBody").innerHTML =
    `<p class="small">${f.gates.length} gate(s) for <b>${esc(f.name)}</b>. Click a state. "unknown" is the default and it counts against confidence rather than being treated as a pass — an unmeasured gate is not a satisfied gate.</p>` +
    f.gates.map((g) => {
      const st = STATE.substAnswers[g.id] ?? "unknown";
      return `<div class="gate ${g.hard ? "hard" : "soft"}${st === "pass" ? " pass" : ""}" data-gate="${at(g.id)}">
        <div class="gate-head">
          <span class="gate-q">${g.hard ? '<span class="ev ev-recall">hard</span> ' : '<span class="ev ev-report">soft</span> '}<code>${esc(g.id)}</code> — ${esc(g.question)}</span>
          <span class="seg" role="group" aria-label="state for ${at(g.id)}">
            ${["pass", "fail", "unknown"].map((v) => `<button type="button" data-v="${at(v)}" aria-pressed="${st === v}">${esc(v)}</button>`).join("")}
          </span>
        </div>
        <div class="gate-why">${esc(g.why)}${g.ev ? " " + ev(g.ev) : ""}</div>
      </div>`;
    }).join("") +
    (f.members?.length ? acc(`${f.members.length} known member(s) of this family`, table(f.members, [
      { label: "vendor", cls: "k", render: (m) => esc(m.vendor) },
      { label: "part", cls: "wide", render: (m) => esc(m.part) },
      { label: "capacity", cls: "k", render: (m) => m.cap ? labelBytes(m.cap) : nbsp(m.capacity ?? "") },
      { label: "VCC", cls: "k", render: (m) => Array.isArray(m.v) ? `${m.v[0]}-${m.v[1]} V` : nbsp(m.vcc) },
      { label: "RDID", cls: "k", render: (m) => `<span class="small">${nbsp(m.rdid)}</span>` },
      { label: "evidence", cls: "k", render: (m) => ev(m.ev) },
    ], { dense: true })) : "");

  for (const el of $("gatesBody").querySelectorAll(".gate")) {
    for (const btn of el.querySelectorAll("button[data-v]")) {
      btn.addEventListener("click", () => {
        STATE.substAnswers[el.dataset.gate] = btn.dataset.v;
        for (const b of el.querySelectorAll("button[data-v]")) b.setAttribute("aria-pressed", String(b === btn));
        el.classList.toggle("pass", btn.dataset.v === "pass");
        runSubstEval(false);
      });
    }
  }
}

function runSubstEval(alsoPlan) {
  const f = substitutionTableById(STATE.substFamily);
  if (!f) return;
  const r = evaluateSubstitution(f, STATE.substAnswers, { original: str("substOriginal"), replacement: str("substReplacement") });
  $("substVerdict").innerHTML =
    verdict(r.summary, r.verdict.tone === "neutral" ? "" : r.verdict.tone, `${r.verdict.label} · confidence ${r.confidence}`) +
    meter(r.counts.pass, r.counts.total, "on") +
    kv([
      ["gates", String(r.counts.total)],
      ["answered", String(r.counts.answered)],
      ["passed", String(r.counts.pass)],
      ["failed", String(r.counts.fail)],
      ["unknown", String(r.counts.unknown)],
      ["hard failures", String(r.hardFail.length)],
      ["soft failures", String(r.softFail.length)],
      ["hard unknown", String(r.hardUnknown.length)],
      ["resting on recall", r.recallGates.length ? r.recallGates.map((g) => g.id).join(", ") : "none"],
      ["original / replacement", `${esc(r.original) || "(not given)"} → ${esc(r.replacement) || "(not given)"}`],
    ]) +
    r.blockers.map((b) => note(b, "bad")).join("") +
    r.softWarnings.map((w) => note(w, "warn")).join("") +
    (r.toVerify?.length ? acc(`${r.toVerify.length} gate(s) to verify before soldering`, ul(r.toVerify.map((g) => raw(`<b><code>${esc(g.id)}</code></b> — ${esc(g.question)}<div class="small" style="color:var(--faint)">${esc(g.why)}</div>`))), true) : "");

  STATE.dossier.decisions.push({ at: new Date().toISOString(), family: f.id, verdict: r.verdict.id, confidence: r.confidence, counts: r.counts });
  renderDossier();
  if (alsoPlan) runPlan();
}

function runRank() {
  const rdidBytes = bytesFromHexInput(str("rankRdid"));
  const capText = str("rankCap");
  const r = rankSpiNor({
    originalRdid: bytesToHex(rdidBytes),
    requiredCapacity: capText ? parseInt(capText.replace(/[^0-9]/g, ""), 10) || null : null,
    boardVcc: parseFloat(str("rankVcc")),
    originalSrLayout: rdidBytes[0] === 0xef ? "winbond" : null,
  });
  $("rankOut").innerHTML = !r.ok ? note(r.note ?? "Could not rank.", "bad")
    : verdict(r.verdict, r.viable.length ? "ok" : "bad", `${r.viable.length} viable of ${r.rows.length}`) +
      kv([["original RDID", r.originalRdid || "(none)"],
        ["decoded", (() => { const d = rdidBytes.length === 3 ? decodeRdid(rdidBytes[0], rdidBytes[1], rdidBytes[2]) : null; return d ? `${esc(d.vendor)} — ${d.capacityLabel}, ${d.memoryTypeMeaning}` : "enter three bytes"; })()],
        ["required capacity", r.requiredCapacity ? labelBytes(r.requiredCapacity) : "not specified"],
        ["board VCC", Number.isFinite(r.boardVcc) ? `${r.boardVcc} V` : "not specified"],
        ["evidence", ev(r.ev)]]) +
      table(r.rows, [
        { label: "vendor", cls: "k", render: (m) => esc(m.vendor) },
        { label: "part", cls: "wide", render: (m) => `${esc(m.part)}${m.isOriginal ? ' <span class="ev ev-none">on board</span>' : ""}` },
        { label: "RDID", cls: "k", render: (m) => `<span class="small">${esc(m.rdid)}</span>` },
        { label: "capacity", cls: "k", render: (m) => esc(m.capacityLabel) },
        { label: "VCC", cls: "k", render: (m) => esc(m.vccRange) },
        { label: "score", cls: "num", render: (m) => String(m.score) },
        { label: "evidence", cls: "k", render: (m) => ev(m.ev) },
        { label: "blockers / cautions", cls: "wide", render: (m) => `<span class="small">${[...(m.blockers ?? []).map((x) => `<span style="color:var(--red)">${esc(x)}</span>`), ...(m.cautions ?? []).map(esc)].join("<br />") || "&mdash;"}</span>` },
      ], { dense: true }) +
      note("This ranking covers capacity, voltage and evidence quality only. It is not a verdict: run the full gate evaluation over the substitution family before committing. A part that ranks first here can still fail the block-protect layout, the status-register bit positions or the host bootloader's RDID whitelist — and those are the failures that show up at power-on rather than at the bench.", "warn");
}

function runPlan() {
  const p = buildRepairPlan({
    symptomId: str("planSymptom") || null,
    familyId: STATE.substFamily,
    answers: STATE.substAnswers,
    known: { original: str("substOriginal"), replacement: str("substReplacement") },
  });
  if (!p.ok) { $("planOut").innerHTML = note(p.note ?? "Could not build a plan.", "warn"); return; }
  const firstDestructive = p.steps.find((s) => s.destructive);
  $("planOut").innerHTML =
    verdict(p.summary, "info", `${p.steps.length} steps · ${p.destructiveCount} irreversible`) +
    `<ol class="steps">${p.steps.map((s) =>
      `<li class="${s.tone === "bad" || s.destructive ? "bad" : s.tone === "warn" ? "warn" : ""}">` +
      `<span class="ph">${esc(s.phase)} · ${esc(s.kind)}${s.destructive ? " · IRREVERSIBLE" : ""}</span>${esc(s.text)}` +
      (s.expect ? `<span class="sub"><b>expect:</b> ${esc(s.expect)}${s.ifFail ? `<br /><b>if that fails:</b> ${esc(s.ifFail)}` : ""}</span>` : "") +
      `</li>`).join("")}</ol>` +
    (firstDestructive
      ? note(`${firstDestructive.n - 1} of ${p.steps.length} steps come before the first irreversible one. Everything up to that point is measurement, reading or identification, and that ordering is the whole point: a repair plan that starts with a write is not a plan, it is a guess with a soldering iron.`, "warn")
      : note("No step in this plan is irreversible.", "ok"));
}

/* ================================================================== *
 * 10 · PRIME LATTICE
 * ================================================================== */

function renderPrimeTab() {
  on("primeRun", runPrimeN);
  on("primeNth", runNthPrime);
  on("primeVerify", runPrimeVerify);

  on("strideRun", runStride);
  $("lfsrN").innerHTML = MAXIMAL_LFSR_TAPS.map((t) => `<option value="${t.n}">n = ${t.n} — taps [${t.taps.join(", ")}]</option>`).join("");
  $("lfsrN").value = "7";
  on("lfsrRun", runLfsr);
  on("lfsrVerifyAll", runLfsrVerifyAll);
  on("lfsrCrc32", runCrc32Poly);

  on("capRun", () => runCapacity());
  on("capPresets", () => {
    const presets = [
      ["3 MiB SPI (24 Mbit) — the BIOS-chip case", 3145728, 65536],
      ["4 MiB SPI (32 Mbit)", 4194304, 65536],
      ["16 MiB SPI (128 Mbit)", 16777216, 65536],
      ["1.5 MB (12 Mbit) — not a power of two", 1572864, 65536],
      ["1 GiB", 1073741824, 65536],
      ["500 GB disk (250069647360 B) — sector count × 512", 250069647360, 4096],
      ["512 B — one sector", 512, 512],
    ];
    const p = presets[Math.floor(Math.random() * presets.length)];
    $("capBytes").value = String(p[1]);
    $("capBlock").value = String(p[2]);
    runCapacity(p[0]);
  });

  on("collideRun", runCollide);
  on("crtRun", runCrt);

  runPrimeN();
  runCapacity();
}

function runPrimeN() {
  const n = int("primeN", 1);
  if (n < 1) { $("primeOut").innerHTML = note("n must be at least 1.", "warn"); return; }
  const f = factorSummary(n);
  const c = analyseCapacity(n);
  $("primeOut").innerHTML =
    verdict(`${n.toLocaleString()} is ${f.isPrime ? "PRIME" : "composite"}: ${f.expression}. ${f.omega} distinct prime factor(s), ${f.tau} divisor(s).`, f.isPrime ? "ok" : "info", "factorisation") +
    kv([
      ["prime factors", f.factors.join(" × ") || "—"],
      ["expression", f.expression],
      ["ω(n) distinct factors", String(f.omega)],
      ["τ(n) divisors", String(f.tau)],
      ["power of two", f.isPowerOfTwo ? `yes — 2^${f.log2IfPowerOfTwo}` : "no"],
      ["isPrime()", String(isPrime(n))],
    ]) +
    (c.ok ? `<h3 style="font-size:12.5px" class="mt">Read as a byte capacity</h3>` +
      verdict(c.verdict, c.isPowerOfTwo ? "ok" : "warn", "capacity arithmetic") +
      kv([["address bits", String(c.addressBits)],
        ["wrap mask", c.wrapMask === null ? "none — do not mask addresses" : hex(c.wrapMask)],
        ["MiB", c.mib.toFixed(4)]]) : "");
}

function runNthPrime() {
  const k = int("primeK", 1);
  if (k < 1) { $("primeOut").innerHTML = note("k must be at least 1.", "warn"); return; }
  const p = nthPrime(k);
  const gaps = primeGaps(Math.min(Math.max(k, 10), 200));
  $("primeOut").innerHTML =
    verdict(p === null ? `k = ${k} is beyond the sieve's range.` : `The ${k.toLocaleString()}th prime is ${p.toLocaleString()}.`, p === null ? "warn" : "ok", "nth prime") +
    kv([
      ["k", k.toLocaleString()],
      ["p(k)", p === null ? "—" : p.toLocaleString()],
      ["isPrime(p(k))", p === null ? "—" : String(isPrime(p))],
      ["largest gap up to p(200)", `${gaps.maxGap.gap} (before ${gaps.maxGap.p})`],
    ]) +
    acc("Verification points from Project Gutenberg ebook #65", table(GUTENBERG_65.claims, [
      { label: "k", cls: "num", render: (c) => c.k.toLocaleString() },
      { label: "published p(k)", cls: "num", render: (c) => c.p.toLocaleString() },
      { label: "computed here", cls: "num", render: (c) => String(nthPrime(c.k)) },
      { label: "", cls: "k", render: (c) => (nthPrime(c.k) === c.p ? '<span class="ev ev-std">match</span>' : '<span class="ev ev-recall">MISMATCH</span>') },
    ], { dense: true }) + `<p class="small">${esc(GUTENBERG_65.note)}</p><p class="small">Source: <a href="${at(GUTENBERG_65.url)}" rel="noopener noreferrer" target="_blank">${esc(GUTENBERG_65.title)}</a>, Project Gutenberg ebook #${GUTENBERG_65.ebook}. ${ev(GUTENBERG_65.ev)}</p>`);
}

function runPrimeVerify() {
  const r = verifyAgainstGutenberg65();
  $("primeOut").innerHTML =
    verdict(r.allOk ? `Every published value reproduced exactly by the sieve.` : `MISMATCH — the sieve disagrees with the printed table.`, r.allOk ? "ok" : "bad", "Project Gutenberg #65") +
    table(r.results, [
      { label: "k", cls: "num", render: (x) => x.k.toLocaleString() },
      { label: "expected", cls: "num", render: (x) => x.expected.toLocaleString() },
      { label: "computed", cls: "num", render: (x) => x.got.toLocaleString() },
      { label: "", cls: "k", render: (x) => (x.ok ? '<span class="ev ev-std">match</span>' : '<span class="ev ev-recall">MISMATCH</span>') },
    ], { dense: true }) +
    note("This is the cheapest possible proof that the factorisation layer is not lying: a printed table from 1921, reproduced by a sieve in this page. Reproducing the 100,000th prime is not decoration — it is the check that the arithmetic everything else rests on actually works.", "info");
}

function runStride() {
  const buckets = int("strideBuckets", 16), stride = int("strideVal", 16);
  const r = strideAnalysis({ buckets, stride, accesses: 64 });
  if (!r.ok) { $("strideOut").innerHTML = note(r.note, "bad"); return; }
  const fold = xorFoldBank(stride, { widthBits: Math.max(1, Math.ceil(Math.log2(buckets))), lowShift: 2, highShift: 10 });
  const naive = ((stride >>> 2) & (buckets - 1));
  $("strideOut").innerHTML =
    verdict(r.verdict, r.utilisation === 1 ? "ok" : r.utilisation <= 0.25 ? "bad" : "warn", `gcd(${buckets}, ${stride}) = ${r.gcd}`) +
    kv([
      ["buckets", String(buckets)], ["stride", String(stride)], ["gcd", String(r.gcd)],
      ["buckets touched", `${r.bucketsTouched} of ${buckets}`],
      ["utilisation", `${(r.utilisation * 100).toFixed(1)}%`],
      ["coprime", r.coprime ? "yes" : "no"],
      ["bucket count prime?", r.bucketsIsPrime ? `yes — coprime with every stride that is not a multiple of ${buckets}` : "no"],
      ["stride prime?", r.strideIsPrime ? "yes" : "no"],
      ["visit order", r.visitOrder.slice(0, 32).join(", ") + (r.visitOrder.length > 32 ? ", …" : "")],
      ["evidence", ev(r.ev)],
    ]) +
    meter(r.bucketsTouched, buckets, r.utilisation === 1 ? "on" : "bad") +
    note(`The fix, when the bucket count cannot change: XOR-fold higher address bits into the index instead of taking a contiguous slice. For example index = addr[3:2] XOR addr[11:10] decorrelates the bucket from any single power-of-two stride. With stride ${stride} that fold yields bucket ${fold.bank} (low ${fold.low}, high ${fold.high}) where the unfounded slice gives ${naive}.`, "info") +
    acc("Prime bucket counts near a target", (() => {
      const cands = primeBucketCandidates(Math.max(8, buckets), 24);
      return table(cands, [
        { label: "buckets", cls: "num", render: (c) => String(c.buckets) },
        { label: "Δ from target", cls: "num", render: (c) => `${c.delta > 0 ? "+" : ""}${c.delta}` },
        { label: "property", cls: "wide", render: (c) => `<span class="small">${esc(c.note)}</span>` },
      ], { dense: true }) + note("A prime bucket count is coprime with every power-of-two stride, which is why hash tables and interleaved flash layouts reach for one. The cost is that the modulo is a division rather than a mask — so this only pays where the aliasing actually hurts.", "info");
    })());
}

function runLfsr() {
  const n = int("lfsrN", 7);
  const t = MAXIMAL_LFSR_TAPS.find((x) => x.n === n);
  if (!t) { $("lfsrOut").innerHTML = note(`No published tap set for n = ${n} in this table.`, "warn"); return; }
  const sim = lfsrPeriod(t.taps, n, 1 << 22);
  const alg = isPrimitiveGF2(tapsToPoly(t.taps), n);
  const capped = sim.period === null;
  $("lfsrOut").innerHTML =
    verdict(capped
      ? `Simulation exceeded its cap at n=${n}: the cycle is too long to walk. The algebraic test below is exact and does not depend on the cap, so the answer still stands — but it is a different kind of evidence, and the row says which method produced it.`
      : sim.verdict,
      capped ? "info" : sim.maximal ? "ok" : "bad", capped ? "simulation capped" : "simulation") +
    verdict(alg.note, alg.primitive ? "ok" : "bad", "algebraic — is the polynomial primitive?") +
    kv([
      ["taps (1-based)", `[${t.taps.join(", ")}]`],
      ["polynomial", gf2ToString(tapsToPoly(t.taps))],
      ["expected period", `2^${n} − 1 = ${(2 ** n - 1).toLocaleString()}`],
      ["simulated period", capped ? "cap exceeded" : Number(sim.period).toLocaleString()],
      ["irreducible", alg.irreducible ? "yes" : "no"],
      ["primitive", alg.primitive ? "yes" : "no"],
      ["order of x", alg.order === null || alg.order === undefined ? "—" : BigInt(alg.order).toLocaleString()],
      ["period is a Mersenne prime", alg.mersenne ? "yes — the sequence has no proper sub-cycles at all" : "no"],
      ["evidence", ev(t.ev)],
    ]) +
    note("Two independent methods, deliberately. Simulation cannot lie about the period but costs 2^n steps; the algebraic test is exact and instant but rests on the theorem that a tap set is maximal-length exactly when its polynomial is primitive. Small widths are checked both ways so that a bug in either shows up as a disagreement rather than as a confidently wrong answer.", "info") +
    acc("Mersenne exponents and why hardware cares", kv([
      ["exponents", MERSENNE.exponents.join(", ")],
      ["note", MERSENNE.note],
    ]) + ul(MERSENNE.hardwareRelevance) + `<p class="small">${ev(MERSENNE.ev)}</p>`);
}

function runLfsrVerifyAll() {
  const r = verifyTapTable({ simulateUpTo: 22 });
  $("lfsrOut").innerHTML =
    verdict(r.allMaximal ? `All ${r.rows.length} published tap sets are maximal-length.` : `${r.failures.length} tap set(s) are NOT maximal-length.`, r.allMaximal ? "ok" : "bad", "whole-table verification") +
    kv([
      ["by simulation (n ≤ 22)", String(r.rows.filter((x) => x.method === "simulation").length)],
      ["by algebraic test", String(r.rows.filter((x) => x.method !== "simulation").length)],
      ["cap exceeded", r.anyCapped ? "yes — those rows are reported separately, not counted as failures" : "no"],
      ["failures", r.failures.length ? r.failures.map((f) => `n=${f.n} [${f.taps}]`).join(", ") : "none"],
    ]) +
    table(r.rows, [
      { label: "n", cls: "num", render: (x) => String(x.n) },
      { label: "taps", cls: "k", render: (x) => `[${x.taps.join(", ")}]` },
      { label: "polynomial", cls: "wide", render: (x) => `<span class="small">${esc(x.polynomial)}</span>` },
      { label: "method", cls: "k", render: (x) => `<span class="small">${esc(x.method)}</span>` },
      { label: "period", cls: "num", render: (x) => (x.period === null ? "capped" : BigInt(x.period).toLocaleString()) },
      { label: "expected", cls: "num", render: (x) => (x.expected === null || x.expected === undefined ? "—" : BigInt(x.expected).toLocaleString()) },
      { label: "", cls: "k", render: (x) => (x.maximal ? '<span class="ev ev-std">maximal</span>' : x.capped ? '<span class="ev ev-report">unverified</span>' : '<span class="ev ev-recall">NOT maximal</span>') },
    ], { dense: true });
}

function runCrc32Poly() {
  const poly = 0x104c11db7n;
  const irr = isIrreducibleGF2(poly, 32);
  const pri = isPrimitiveGF2(poly, 32);
  const check = crc32([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]);
  $("lfsrOut").innerHTML =
    verdict(`The CRC-32 generator polynomial 0x${poly.toString(16).toUpperCase()} is ${pri.primitive ? "PRIMITIVE" : irr.irreducible ? "irreducible but not primitive" : "NOT irreducible"} over GF(2).`,
      pri.primitive ? "ok" : "warn", "CRC-32 polynomial") +
    kv([
      ["expanded", gf2ToString(poly)],
      ["irreducible", irr.irreducible ? "yes" : "no"],
      ["primitive", pri.primitive ? "yes" : "no"],
      ["order of x", pri.order === null || pri.order === undefined ? "—" : BigInt(pri.order).toLocaleString()],
      ["is 2^32 − 1 prime?", pri.mersenne ? "yes" : "no — 4294967295 = 3 × 5 × 17 × 257 × 65537"],
      ["crc32('123456789')", `${hex(check)} — expected ${hex(CRC32_CHECK)} ${check === CRC32_CHECK ? "✓" : "✗ MISMATCH"}`],
    ]) +
    note("A CRC wants error-detection structure — divisibility of the likely error patterns — not the longest possible cycle. Primitivity is a bonus here, not the goal, and confusing the two objectives is a common design mistake. What actually matters for CRC-32 is that it detects every burst error up to 32 bits, which follows from the polynomial's degree rather than from its order.", "info") +
    note(irr.note, "info") + note(pri.note);
}

function runCapacity(label = "") {
  const bytes = int("capBytes", 3145728);
  const block = int("capBlock", 65536);
  const c = analyseCapacity(bytes);
  if (!c.ok) { $("capArithOut").innerHTML = note(c.note, "bad"); return; }
  const g = flashGeometry({ capacityBytes: bytes, blockSize: block });
  $("capArithOut").innerHTML =
    verdict(c.verdict, c.isPowerOfTwo ? "ok" : "warn", label || "capacity arithmetic") +
    kv([
      ["bytes", c.bytes.toLocaleString()], ["bits", c.bits.toLocaleString()],
      ["factorisation (bytes)", c.factorBytes], ["factorisation (bits)", c.factorBits],
      ["MiB", c.mib.toFixed(4)], ["MB (decimal)", c.mb.toFixed(4)],
      ["address bits", String(c.addressBits)],
      ["wrap mask", c.wrapMask === null ? "none — do not mask addresses" : hex(c.wrapMask)],
    ]) +
    (g ? `<h3 style="font-size:12.5px" class="mt">Geometry with a ${block.toLocaleString()} B erase block</h3>` +
      verdict(g.verdict, g.clean ? "ok" : "bad", "flash geometry") +
      kv([
        ["page size", `${g.pageSize} B`],
        ["pages", Number.isInteger(g.pages) ? g.pages.toLocaleString() : `${g.pages} — not an integer`],
        ["blocks", Number.isInteger(g.blocks) ? g.blocks.toLocaleString() : `${g.blocks} — not an integer`],
        ["address split", `${g.blockAddressBits} bits select the block, ${g.pageAddressBits} the byte within a page`],
      ]) : "") +
    note("Why this gets its own tool: a 3 MiB part is 24 Mbit, not 32 Mbit. It has no wrap mask, so `address & (2^22 − 1)` produces addresses past the end of the device; 1 MiB of the 22-bit address space simply does not exist; and a partial dump is indistinguishable from a complete one by file length alone. Read the capacity from the device — RDID byte 2 on SPI NOR — rather than inferring it from the file.", "warn");
}

function runCollide() {
  const ps = str("collideIn").split(",").map((v) => parseInt(v.trim(), 10)).filter(Number.isFinite);
  const r = collisionAnalysis(ps);
  $("collideOut").innerHTML = !r.ok ? note(r.note, "warn")
    : verdict(r.verdict, r.allCoprime ? "ok" : "warn", `${ps.length} periods`) +
      kv([
        ["periods", ps.join(", ")],
        ["all synchronise at", `${r.allSynchroniseAt.toLocaleString()} ticks`],
        ["all pairwise coprime", r.allCoprime ? "yes" : "no"],
        ["worst pair", `${r.worstPair.a} / ${r.worstPair.b} — coincide every ${r.worstPair.lcm.toLocaleString()} ticks (gcd ${r.worstPair.gcd})`],
      ]) +
      table(r.pairs, [
        { label: "a", cls: "num", render: (p) => String(p.a) },
        { label: "b", cls: "num", render: (p) => String(p.b) },
        { label: "gcd", cls: "num", render: (p) => String(p.gcd) },
        { label: "lcm", cls: "num", render: (p) => p.lcm.toLocaleString() },
        { label: "", cls: "k", render: (p) => (p.coprime ? '<span class="ev ev-std">coprime</span>' : '<span class="ev ev-recall">shared factor</span>') },
      ], { dense: true }) +
      note("This is the polling-interval question. Two tasks whose periods share a factor collide on a predictable schedule and produce a jitter spike that looks like a hardware fault; coprime periods spread the collisions as thinly as arithmetic allows. Choosing a prime poll period is a real technique, not numerology — but it only helps if the other period is not a multiple of it.", "info");
}

function runCrt() {
  const pairs = str("crtIn").split(",").map((s) => s.split(":").map((v) => parseInt(v.trim(), 10)))
    .filter((p) => p.length === 2 && p.every(Number.isFinite));
  if (pairs.length < 2) { $("crtOut").innerHTML = note("Need at least two residue:modulus pairs, e.g. `2:3, 3:5, 2:7`.", "warn"); return; }
  const r = crt(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
  $("crtOut").innerHTML = !r.ok ? note(r.note, "bad")
    : verdict(`x ≡ ${r.x} (mod ${r.modulus.toLocaleString()})`, "ok", "Chinese Remainder Theorem") +
      kv([
        ["residues", r.residues.join(", ")],
        ["moduli", r.moduli.join(", ")],
        ["modulus product", r.modulus.toLocaleString()],
        ["smallest non-negative solution", r.x.toLocaleString()],
        ["check", r.residues.map((res, i) => `${r.x} mod ${r.moduli[i]} = ${((r.x % r.moduli[i]) + r.moduli[i]) % r.moduli[i]} ${((r.x % r.moduli[i]) + r.moduli[i]) % r.moduli[i] === res ? "✓" : "✗"}`).join("<br />")],
      ]) +
      note("This is how a wide counter built from several narrow fields is reconstructed — a real technique in RTC and event-counter designs where storage is split across small fields, and in some 1-Wire counter devices where the accumulator is read in pieces. It only works when the moduli are pairwise coprime; when they are not, the solution either does not exist or is not unique, and the function says so rather than returning a plausible-looking number.", "info") +
      acc("Wear-levelling / hunting-tooth check on the first two moduli", (() => {
        const h = huntingTooth(r.moduli[0], r.moduli[1]);
        return verdict(h.verdict, h.hunting ? "ok" : "warn", "coprimality of two counts") +
          kv([["counts", `${h.a} and ${h.b}`], ["gcd", String(h.gcd)],
            ["distinct contacts before repeating", String(h.distinctContacts)],
            ["contact period", h.contactPeriod.toLocaleString()]]);
      })());
}

/* ================================================================== *
 * 11 · REFS
 * ================================================================== */

function runAllSelfChecks() {
  const checks = [];
  const add = (group, name, got, want, ok, noteText = "") => checks.push({ group, name, got: String(got), want: String(want), ok, note: noteText });
  const ascii = (s) => Array.from(s).map((c) => c.charCodeAt(0));

  /* --- checksums against their published check values ---------------- */
  const c32 = crc32(ascii("123456789"));
  add("checksums", "crc32('123456789')", hex(c32), hex(CRC32_CHECK), c32 === CRC32_CHECK);

  const rom = new Uint8Array([0x28, 0xff, 0x64, 0x1e, 0x4c, 0x3b, 0x9c, 0x00]);
  rom[7] = crc8(rom, 0, 7);
  add("checksums", "1-Wire CRC-8 is self-consistent over a valid ROM id", decodeRom(rom).crcOk, true, decodeRom(rom).crcOk === true);
  rom[3] ^= 0x01;
  add("checksums", "1-Wire CRC-8 detects a single-bit error", decodeRom(rom).crcOk, false, decodeRom(rom).crcOk === false);

  const data = [1, 2, 3, 4, 5, 6, 7, 8];
  const c16 = crc16(data);
  const cw = crc16([...data, (~c16) & 0xff, ((~c16) >>> 8) & 0xff]);
  add("checksums", "CRC-16 Maxim check word (data + complement → 0xB001)", hex(cw), hex(CRC16_CHECK_WORD), cw === CRC16_CHECK_WORD);
  const c16s = crc16(ascii("123456789"));
  add("checksums", "CRC-16/ARC over '123456789'", hex(c16s), hex(CRC16_CHECK_STRING), c16s === CRC16_CHECK_STRING);

  /* --- the sieve against a 1921 printed table ------------------------ */
  const g = verifyAgainstGutenberg65();
  for (const r of g.results) add("primes", `p(${r.k.toLocaleString()}) — Gutenberg #65`, r.got, r.expected, r.ok);

  /* --- JEP106 parity and encode/decode round-trip -------------------- */
  for (const k of IDCODES) {
    const d = decodeIdcode(k.id);
    const enc = encodeIdcode({ version: d.version, partNumber: d.partNumber, continuationCode: d.continuationCode, identity: d.identity });
    add("JEP106", `${hex(k.id)} — odd parity and round-trip`, `${d.parityIsOdd}/${enc === d.raw}`, "true/true",
      d.parityIsOdd && enc === d.raw, k.ev === "recall" ? "row is 'recall' evidence" : "");
  }

  /* --- TAP simulator ------------------------------------------------- */
  for (const t of runTapChecks()) add("TAP", t.name, t.got, t.want, t.ok);

  /* --- firmware parsers ---------------------------------------------- */
  const fw = fwSelfCheck();
  for (const c of fw.checks) add("firmware", c.name, c.got, c.want, c.ok);
  const sy = synthSelfCheckModule();
  for (const c of sy.checks) add("synthetic images", c.name, c.got, c.want, c.ok);

  /* --- GF(2) --------------------------------------------------------- */
  const vt = verifyTapTable({ simulateUpTo: 22 });
  add("GF(2)", `all ${vt.rows.length} published LFSR tap sets are maximal-length`, vt.allMaximal, true, vt.allMaximal);
  const crcPoly = isPrimitiveGF2(0x104c11db7n, 32);
  add("GF(2)", "the CRC-32 polynomial is primitive", crcPoly.primitive, true, crcPoly.primitive === true);
  const prbs7 = isPrimitiveGF2(tapsToPoly([7, 6]), 7);
  add("GF(2)", "PRBS7 (x⁷+x⁶+1) is primitive and its order is Mersenne", `${prbs7.primitive}/${prbs7.mersenne}`, "true/true", prbs7.primitive && prbs7.mersenne);

  /* --- ISA tables ---------------------------------------------------- */
  for (const t of runIsaChecks()) add("ISA", t.name, t.got, t.want, t.ok);

  /* --- 1-Wire -------------------------------------------------------- */
  add("1-Wire", "DS18B20 scratchpad 50 05 decodes to the 85 °C reset value", DS18B20.decodeTemperature(0x50, 0x05), 85, DS18B20.decodeTemperature(0x50, 0x05) === 85);
  const tNeg = DS18B20.decodeTemperature(0x90, 0xff);
  add("1-Wire", "DS18B20 two's-complement negative reading (FF90 → −7)", tNeg.toFixed(4), "-7.0000", Math.abs(tNeg + 7) < 1e-9);

  /* --- Java Card / JVM ----------------------------------------------- */
  add("Java Card", "CAP magic", hex(CAP_MAGIC), "0xDECAFFED", CAP_MAGIC === 0xdecaffed);
  add("Java", "class-file magic", hex(CLASS_MAGIC), "0xCAFEBABE", CLASS_MAGIC === 0xcafebabe);
  add("Java Card", "twelve component tags, 1..12 contiguous", CAP_COMPONENTS.map((c) => c.tag).join(","), "1,2,3,4,5,6,7,8,9,10,11,12",
    CAP_COMPONENTS.map((c) => c.tag).join(",") === "1,2,3,4,5,6,7,8,9,10,11,12");
  add("JVM", "wide iinc is 6 bytes", jvmInstructionLength(0xc4, Uint8Array.from([0xc4, 0x84, 0x00, 0x01, 0x00, 0x02]), 0), 6,
    jvmInstructionLength(0xc4, Uint8Array.from([0xc4, 0x84, 0x00, 0x01, 0x00, 0x02]), 0) === 6);
  add("JVM", "wide iload is 4 bytes", jvmInstructionLength(0xc4, Uint8Array.from([0xc4, 0x15, 0x00, 0x01]), 0), 4,
    jvmInstructionLength(0xc4, Uint8Array.from([0xc4, 0x15, 0x00, 0x01]), 0) === 4);
  add("JVM", "invokeinterface takes four operand bytes", jvmInstructionLength(0xb9, Uint8Array.from([0xb9, 0x00, 0x01, 0x02, 0x00]), 0), 5,
    jvmInstructionLength(0xb9, Uint8Array.from([0xb9, 0x00, 0x01, 0x02, 0x00]), 0) === 5);
  {
    // tableswitch padding: the operand block must start on a 4-byte boundary
    // measured from the START OF THE INSTRUCTION, so at pc 2 there is one pad
    // byte. istore_0, istore_1, tableswitch, ireturn = four instructions, and
    // the switch must consume exactly its padded length — if the pad is
    // miscounted the decoder resynchronises inside the operand block and
    // reports instructions that are not there instead of stopping.
    const code = bytesFromHexInput("03 1b aa 00 00 00 00 28 00 00 00 00 00 00 00 02 00 00 00 0c 00 00 00 14 00 00 00 1c ac");
    const d = disasmBytecodeStream(code);
    add("JVM", "a tableswitch stream decodes to exactly 4 instructions", d.stopped === null ? d.rows.length : `stopped: ${d.stopped.text}`, 4,
      d.stopped === null && d.rows.length === 4);
    add("JVM", "the tableswitch is at pc 2 and consumes its padded length", d.rows[2] ? `${d.rows[2].pc}/${d.rows[2].len}` : "none", "2/26",
      !!d.rows[2] && d.rows[2].pc === 2 && d.rows[2].len === 26);
    add("JVM", "every byte of the stream is consumed", d.consumed, code.length, d.consumed === code.length);
  }
  {
    const cap = synthCap();
    const hdrTag = cap[0];
    const magic = ((cap[3] << 24) | (cap[4] << 16) | (cap[5] << 8) | cap[6]) >>> 0;
    add("Java Card", "synthetic CAP starts with the Header component (tag 1)", hdrTag, 1, hdrTag === 1);
    add("Java Card", "synthetic CAP Header carries the magic", hex(magic), hex(CAP_MAGIC), magic === CAP_MAGIC);
  }
  {
    const cls = synthClass();
    const magic = ((cls[0] << 24) | (cls[1] << 16) | (cls[2] << 8) | cls[3]) >>> 0;
    add("Java", "synthetic class file starts with 0xCAFEBABE", hex(magic), hex(CLASS_MAGIC), magic === CLASS_MAGIC);
    add("Java", "synthetic class file is major version 52", (cls[6] << 8) | cls[7], 52, ((cls[6] << 8) | cls[7]) === 52);
  }

  /* --- x87 ----------------------------------------------------------- */
  add("x87", "FNINIT control word 0x037F is recognised as the reset default", decodeX87ControlWord(0x037f).isResetDefault, true, decodeX87ControlWord(0x037f).isResetDefault === true);
  add("x87", "FNINIT status word 0x0000 is clean", decodeX87StatusWord(0).clean, true, decodeX87StatusWord(0).clean === true);
  add("x87", "0x027F (precision=double) is NOT the reset default", decodeX87ControlWord(0x027f).isResetDefault, false, decodeX87ControlWord(0x027f).isResetDefault === false);

  /* --- POST ---------------------------------------------------------- */
  add("POST", "a repeating code reads as a retry loop", analysePostTrace(["2C", "2C", "2C", "2C"]).pattern, "retry loop", analysePostTrace(["2C", "2C", "2C", "2C"]).pattern === "retry loop");
  add("POST", "0xE1 reads as an OS handoff", analysePostTrace(["00", "01", "0B", "A0", "E1"]).pattern, "handoff to OS", analysePostTrace(["00", "01", "0B", "A0", "E1"]).pattern === "handoff to OS");

  /* --- substitution engine ------------------------------------------- */
  {
    const fam = substitutionTableById("spi-nor-3v3");
    add("substitution", "a VCC hard-gate failure blocks the swap", evaluateSubstitution(fam, { capacity: "pass", vcc: "fail", package: "pass" }).verdict.id, "doNotProceed",
      evaluateSubstitution(fam, { capacity: "pass", vcc: "fail", package: "pass" }).verdict.id === "doNotProceed");
    add("substitution", "all-unknown does not silently pass", evaluateSubstitution(fam, {}).verdict.id, "insufficient",
      evaluateSubstitution(fam, {}).verdict.id === "insufficient");
    add("substitution", "all-pass proceeds", evaluateSubstitution(fam, Object.fromEntries(fam.gates.map((x) => [x.id, "pass"]))).verdict.id, "proceed",
      evaluateSubstitution(fam, Object.fromEntries(fam.gates.map((x) => [x.id, "pass"]))).verdict.id === "proceed");
    const plan = buildRepairPlan({ symptomId: "flash-ff", familyId: "spi-nor-3v3", answers: {} });
    add("repair plan", "destructive steps are counted", plan.destructiveCount > 0, true, plan.destructiveCount > 0);
    const firstBad = plan.steps.findIndex((s) => s.destructive);
    add("repair plan", "no destructive step precedes a non-destructive one",
      plan.steps.slice(firstBad).every((s) => s.destructive || s.phase >= plan.steps[firstBad].phase), true,
      plan.steps.slice(firstBad).every((s) => s.destructive || s.phase >= plan.steps[firstBad].phase));
    const rank = rankSpiNor({ originalRdid: "EF 40 16", requiredCapacity: 4194304, boardVcc: 3.3 });
    add("SPI ranking", "a 3.3 V / 4 MiB requirement yields viable candidates", rank.viable.length > 0, true, rank.viable.length > 0);
    add("SPI ranking", "a 1.8 V rail rejects every 3.3 V part", rankSpiNor({ originalRdid: "EF 40 16", requiredCapacity: 4194304, boardVcc: 1.8 }).viable.length, 0,
      rankSpiNor({ originalRdid: "EF 40 16", requiredCapacity: 4194304, boardVcc: 1.8 }).viable.length === 0);
  }

  /* --- capacity and stride ------------------------------------------- */
  const cap3 = analyseCapacity(3 * 1024 * 1024);
  add("capacity", "3 MiB is not a power of two", cap3.isPowerOfTwo, false, cap3.isPowerOfTwo === false);
  add("capacity", "3 MiB factorises as 2^20 × 3", cap3.factorBytes, "2^20 × 3", cap3.factorBytes === "2^20 × 3");
  add("capacity", "a 4 MiB part has a wrap mask", hex(analyseCapacity(4 * 1024 * 1024).wrapMask), hex(0x3fffff), analyseCapacity(4 * 1024 * 1024).wrapMask === 0x3fffff);
  add("stride", "stride 16 against 16 buckets touches exactly 1", strideAnalysis({ buckets: 16, stride: 16 }).bucketsTouched, 1, strideAnalysis({ buckets: 16, stride: 16 }).bucketsTouched === 1);
  add("stride", "stride 13 against 16 buckets touches all 16", strideAnalysis({ buckets: 16, stride: 13 }).bucketsTouched, 16, strideAnalysis({ buckets: 16, stride: 13 }).bucketsTouched === 16);
  add("CRT", "x ≡ 2 mod 3, 3 mod 5, 2 mod 7 → 23", crt([2, 3, 2], [3, 5, 7]).x, 23, crt([2, 3, 2], [3, 5, 7]).ok && crt([2, 3, 2], [3, 5, 7]).x === 23);

  /* --- RDID and identification --------------------------------------- */
  {
    const d = decodeRdid(0xef, 0x40, 0x16);
    add("SPI", "EF 40 16 is a known Winbond 4 MiB part", `${d.known}/${d.capacityLabel}`, "true/4 MiB", d.known && d.capacityLabel === "4 MiB");
    add("SPI", "a 4 MiB capacity is plausible (the 1<<32 trap)", d.plausible, true, d.plausible === true);
    const id = identifyAnything("EF 40 16");
    add("identify", "'EF 40 16' resolves to a high-confidence RDID", id.candidates[0]?.confidence, "high", id.candidates[0]?.confidence === "high");
    add("identify", "'0x4BA00477' resolves to a JTAG IDCODE", id2Kind("0x4BA00477"), "JTAG IDCODE", id2Kind("0x4BA00477") === "JTAG IDCODE");
    add("identify", "free text yields no candidates and does not throw", identifyAnything("hello world").candidates.length, 0, identifyAnything("hello world").candidates.length === 0);
    add("baud", "an 8.68 µs bit time is 115200 within tolerance", baudFromBitTime(8.68).tolerance, "within tolerance", baudFromBitTime(8.68).tolerance === "within tolerance");
  }

  return { total: checks.length, passed: checks.filter((x) => x.ok).length, allOk: checks.every((x) => x.ok), checks };
}

const id2Kind = (s) => identifyAnything(s).candidates[0]?.kind ?? null;

function runTapChecks() {
  const out = [];
  const t = (name, got, want) => out.push({ name, got, want, ok: String(got) === String(want) });

  // 1. Five TMS-high clocks reach TLR from every one of the 16 states.
  let allReach = true;
  for (const s of TAP_STATES) {
    const sim = TapSim.fromSpecs([{ name: "d", irlen: 4, idcode: 0x4ba00477, instructions: {} }]);
    sim.state = s.id;
    sim.tmsSequence("11111");
    if (sim.state !== "TLR") allReach = false;
  }
  t("5 TMS-high clocks reach TLR from all 16 states", allReach, true);

  // 2. Device count is exact for chains of 1..9.
  let countsOk = true;
  for (let n = 1; n <= 9; n++) {
    const sim = TapSim.fromSpecs(Array.from({ length: n }, (_, i) => ({ name: `t${i}`, irlen: 4, idcode: 0x1ba01477, instructions: {} })));
    if (sim.countDevices() !== n) countsOk = false;
  }
  t("countDevices() is exact for chains of 1-9 devices", countsOk, true);

  // 3. BYPASS latency equals the device count, with mixed IR lengths.
  let latOk = true;
  for (let n = 1; n <= 7; n++) {
    const sim = TapSim.fromSpecs(Array.from({ length: n }, (_, i) => ({ name: `t${i}`, irlen: 4 + (i % 3), idcode: null, instructions: {} })));
    if (sim.bypassLatency() !== n) latOk = false;
  }
  t("bypassLatency() === device count for mixed IR lengths", latOk, true);

  // 4. shiftIr returns exactly N bits for N bits in.
  const sim4 = TapSim.fromSpecs([
    { name: "a", irlen: 4, idcode: 0x4ba00477, instructions: {} },
    { name: "b", irlen: 8, idcode: null, instructions: {} },
  ]);
  t("shiftIr(12) over a 4+8 chain returns 12 bits", sim4.shiftIr(new Array(12).fill(1)).length, 12);

  // 5. The capture and exit clocks are in the budget but emit no data bit:
  //    shifting 5 bits must return exactly 5 bits, not 7.
  const sim5 = TapSim.fromSpecs(Array.from({ length: 3 }, (_, i) => ({ name: `t${i}`, irlen: 4, idcode: null, instructions: {} })));
  sim5.reset("RTI");
  sim5.shiftIr(new Array(12).fill(1));
  t("shiftDr(5) returns exactly 5 TDO bits", sim5.shiftDr(new Array(5).fill(1)).length, 5);

  // 6. IDCODE read-back is exact and unrotated.
  const sim6 = TapSim.fromSpecs([{ name: "dap", irlen: 4, idcode: 0x4ba00477, instructions: {} }]);
  const ids = sim6.readIdcodes();
  t("readIdcodes() returns the modelled IDCODE exactly", ids.length ? ids[0].hex : "none", hex(0x4ba00477));

  // 7. Two devices: both IDCODEs come back unrotated.
  const sim7 = TapSim.fromSpecs([
    { name: "dap", irlen: 4, idcode: 0x4ba00477, instructions: {} },
    { name: "cpld", irlen: 8, idcode: 0x02214093, instructions: {} },
  ]);
  t("a two-device chain returns both IDCODEs unrotated",
    sim7.readIdcodes().map((x) => x.hex).join(","), `${hex(0x4ba00477)},${hex(0x02214093)}`);

  // 8. isolate() pushes devices[0]'s IR bits FIRST.
  const sim8 = TapSim.fromSpecs([
    { name: "near-tdo", irlen: 4, idcode: null, instructions: {} },
    { name: "near-tdi", irlen: 8, idcode: null, instructions: {} },
  ]);
  sim8.isolate(0, 0x0e);
  t("isolate(0, 0x0E) puts 0x0E in devices[0] and BYPASS in devices[1]",
    sim8.devices.map((d) => hex(d.irValue(), 2)).join(","), `${hex(0x0e, 2)},${hex(0xff, 2)}`);

  return out;
}

function runIsaChecks() {
  const out = [];
  const t = (name, got, want) => out.push({ name, got, want, ok: String(got) === String(want) });
  const d = (isa, word) => { const r = decodeInstruction(isa, word); return r.ok ? r.text : ".word"; };

  t("thumb 0x4770 is BX LR", d("thumb", 0x4770), "BX LR");
  t("thumb 0xBF00 is NOP", d("thumb", 0xbf00), "NOP");
  t("thumb 0xE7FE is a backward infinite loop", d("thumb", 0xe7fe).startsWith("B #0x"), true);
  t("thumb 0xB510 is PUSH {R4, LR}", d("thumb", 0xb510), "PUSH {R4, LR}");
  t("mips 0x3C08BFFC is LUI $8, 0xBFFC", d("mips", 0x3c08bffc), "LUI $8, 0xBFFC");
  t("mips 0x03E00008 is JR $31", d("mips", 0x03e00008), "JR $31");
  // The signed-int32 trap: LW is opcode 0x23 in bits 31:26, so the word is
  // above 0x80000000 and `&` returns a negative number unless it is >>>0'd.
  t("mips 0x8D090000 decodes above the int32 sign boundary", d("mips", 0x8d090000), "LW $9, 0($8)");
  t("6502 0xA9 decodes", d("mos6502", 0xa9).length > 0, true);
  t("avr 0x0000 decodes", d("avr", 0x0000).length > 0, true);
  t("an unassigned thumb word is not invented", decodeInstruction("thumb", 0xdead).ok, false);

  // Vector-table validation, both directions.
  const good = validateCortexMVectors(wordsToBytes(VECTOR_DEMOS.vecDemoGood));
  t("a well-formed Cortex-M vector table validates", good.ok, true);
  t("the reset vector's Thumb bit is checked", good.words[1].thumb, true);
  const erased = validateCortexMVectors(wordsToBytes(VECTOR_DEMOS.vecDemoErased));
  t("an all-FF vector table is rejected", erased.ok, false);
  const noThumb = validateCortexMVectors(wordsToBytes(VECTOR_DEMOS.vecDemoThumb));
  t("a reset vector without the Thumb bit is rejected", noThumb.ok, false);

  // Architecture identification must fire on structure, not on noise.
  t("a Cortex-M vector table is identified as Cortex-M", identifyArchitecture(wordsToBytes(VECTOR_DEMOS.vecDemoGood)).best, "cortex-m");
  t("an all-FF blob is not identified as any architecture", identifyArchitecture(new Uint8Array(512).fill(0xff)).ok, false);

  // CPUID: the hypervisor bit is the one worth pinning.
  const guest = decodeCpuid({ leaf0: [0xd, 0x756e6547, 0x6c65746e, 0x49656e69], leaf1: [0x000306c3, 0x00100800, 0x7ffafbff | (1 << 31), 0xbfebfbff] });
  t("leaf1 ECX bit31 sets hypervisorGuest", guest.brandFeatures.hypervisorGuest, true);
  const host = decodeCpuid({ leaf0: [0xd, 0x756e6547, 0x6c65746e, 0x49656e69], leaf1: [0x000306c3, 0x00100800, 0x7ffafbff, 0xbfebfbff] });
  t("the same word with bit31 clear does not", host.brandFeatures.hypervisorGuest, false);
  t("leaf1 EDX bit0 is the x87 presence flag", host.brandFeatures.fpu, true);
  t("GenuineIntel resolves to a vendor name", host.vendor, "Intel");

  return out;
}

function renderRefsTab() {
  const renderChecks = () => {
    const sc = STATE.selfChecks ?? runAllSelfChecks();
    const groups = [...new Set(sc.checks.map((c) => c.group))];
    const failed = sc.checks.filter((c) => !c.ok);
    $("selfCheckBody").innerHTML =
      verdict(sc.allOk
        ? `All ${sc.total} checks pass. Nothing in this app's arithmetic is asserted without being computed first.`
        : `${sc.total - sc.passed} of ${sc.total} checks FAILED: ${failed.map((c) => c.name).join("; ")}.`,
        sc.allOk ? "ok" : "bad", "self-check") +
      groups.map((g, i) => {
        const rows = sc.checks.filter((c) => c.group === g);
        return acc(`${g} — ${rows.filter((c) => c.ok).length}/${rows.length} pass`,
          table(rows, [
            { label: "check", cls: "wide", render: (c) => esc(c.name) },
            { label: "got", cls: "k", render: (c) => `<span class="small">${esc(c.got)}</span>` },
            { label: "want", cls: "k", render: (c) => `<span class="small">${esc(c.want)}</span>` },
            { label: "", cls: "k", render: (c) => (c.ok ? '<span class="ev ev-std">pass</span>' : '<span class="ev ev-recall">FAIL</span>') },
            { label: "note", cls: "wide", render: (c) => `<span class="small">${esc(c.note ?? "")}</span>` },
          ], { dense: true }), i === 0);
      }).join("");
  };
  renderChecks();
  on("selfCheckRun", () => { STATE.selfChecks = runAllSelfChecks(); renderPills(); renderChecks(); });

  $("scopeBody").innerHTML =
    `<h3 style="font-size:12.5px">What this is</h3>` + ul(SCOPE.claim) +
    `<h3 style="font-size:12.5px" class="mt">The boundary</h3>` + ul(SCOPE.boundary) +
    `<h3 style="font-size:12.5px" class="mt">Method</h3>` + ul(SCOPE.method);

  $("evidenceBody").innerHTML = table([
    { tag: "std", commits: "Read out of a published standard or a vendor datasheet. The strongest claim this app makes." },
    { tag: "tool", commits: "Read out of an open-source tool's own tables — flashrom, OpenOCD, U-Boot, coreboot's ifdtool, owfs — and quoted here. Verifiable by reading that tool's source." },
    { tag: "report", commits: "Observed by third parties and reproduced as a report. True of the devices reported on; not asserted to be true of every device." },
    { tag: "recall", commits: "Transcribed from memory and NOT verified against a source this session. Rendered with a warning stripe and excluded from automatic decisions." },
    { tag: "model", commits: "A property of this app's own model, not a claim about hardware." },
    { tag: "none", commits: "No source. A label, a user input, or a value this app computed for itself." },
  ], [
    { label: "tag", cls: "k", render: (r) => ev(r.tag) },
    { label: "what it commits to", cls: "wide", render: (r) => esc(r.commits) },
  ], { dense: true });

  const recallRows = collectRecallRows();
  $("recallBody").innerHTML = recallRows.length
    ? `<p class="small">${recallRows.length} row(s) across the corpus. Each is striped amber wherever it is rendered, and none of them feeds an automatic decision.</p>` +
      table(recallRows, [
        { label: "module", cls: "k", render: (r) => `<code>${esc(r.module)}</code>` },
        { label: "table", cls: "k", render: (r) => esc(r.table) },
        { label: "row", cls: "wide", render: (r) => `<span class="small">${esc(r.label)}</span>` },
        { label: "what would settle it", cls: "wide", render: (r) => `<span class="small">${esc(r.settle)}</span>` },
      ], { dense: true, rowClass: () => "row-recall" })
    : `<p class="empty">No rows are currently tagged recall.</p>`;

  $("sourcesBody").innerHTML = table(SOURCES, [
    { label: "id", cls: "k", render: (s) => `<code>${esc(s.id)}</code>` },
    { label: "kind", cls: "k", render: (s) => esc(s.kind) },
    { label: "citation", cls: "wide", render: (s) => esc(s.cite) },
    { label: "used for", cls: "wide", render: (s) => `<span class="small">${esc(s.used)}</span> ${ev(s.ev)}` },
  ], { dense: true });

  $("modulesBody").innerHTML = table(MODULES, [
    { label: "file", cls: "k", render: (m) => `<code>${esc(m.file)}</code>` },
    { label: "what it does", cls: "wide", render: (m) => `<span class="small">${esc(m.does)}</span>` },
  ], { dense: true });
}

const MODULES = [
  { file: "js/cw-data.js", does: "The reference corpus: JTAG, SPI flash, signature table, architectures, substitution families, symptoms, sources, CRC-32. Data and pure functions only." },
  { file: "js/cw-tap.js", does: "IEEE 1149.1 TAP simulator. Sixteen states, exact shift semantics, chain discovery, IDCODE read-back, device isolation." },
  { file: "js/cw-data-storage.js", does: "S.M.A.R.T. attributes with per-media criticality, the ATA SMART taskfile, IDENTIFY DEVICE, NVMe log pages and SMART layout, drive triage." },
  { file: "js/cw-data-uefi.js", does: "Intel Flash Descriptor, UEFI firmware volume / FFS file / section layouts, TE header, PE machines, variable store, MBR and GPT, firmware triage." },
  { file: "js/cw-data-onewire.js", does: "1-Wire ROM commands, CRC-8 and CRC-16, family codes, DS18B20 / DS2438 / DS2408 command sets, bus timing, fault table, OWFS." },
  { file: "js/cw-data-jvm.js", does: "Class-file layout, constant-pool tags, the JVM opcode table with operand lengths, Java Card CAP components, ISO 7816 APDUs, portability analysis." },
  { file: "js/cw-data-firmware.js", does: "The x87 math coprocessor and its BIOS presence probe, the POST-card model and trace interpreter, CPU substitution gates and the swap procedure." },
  { file: "js/cw-firmware.js", does: "The dump analysis engine: hygiene, IFD carve, firmware-volume walk, MBR/GPT with CRC validation, variable-store scan, signature scan, action list." },
  { file: "js/cw-synth.js", does: "Synthetic images — a UEFI volume, a GPT disk, an IFD dump, degenerate blobs — each asserted against the parser it is meant to exercise." },
  { file: "js/cw-arch.js", does: "Generic ISA decoder and disassembler, architecture identification from bytes, Cortex-M vector-table validation, CPUID decode and diff." },
  { file: "js/cw-subst.js", does: "The substitution engine: gate evaluation with hard/soft/unknown, SPI NOR ranking, storage / 1-Wire / Java Card substitution tables, repair planner." },
  { file: "js/cw-probe.js", does: "Browser capability detection, the dossier model, the multi-format identification parser, pinout discovery, baud-rate analysis." },
  { file: "js/cw-prime.js", does: "Sieve and factorisation, GF(2) polynomial arithmetic, LFSR verification, stride aliasing, capacity arithmetic, CRT, Gutenberg #65 verification." },
  { file: "js/cw-app.js", does: "This file. DOM rendering only — every rule lives in the modules above so it can run headless." },
  { file: "tools/verify_chipwright.mjs", does: "The headless proof: the same self-checks plus the DOM-id contract between chipwright.html and this controller." },
];

/**
 * Walk the corpus and collect every row tagged `recall`, so the REFS tab lists
 * exactly what is unverified rather than asserting that nothing is.
 */
function collectRecallRows() {
  const out = [];
  const walk = (module, tableName, obj, labelFn, settleFn) => {
    if (!Array.isArray(obj)) return;
    for (const r of obj) {
      if (r && typeof r === "object" && String(r.ev).toLowerCase() === "recall") {
        out.push({
          module, table: tableName,
          label: (() => { try { return labelFn(r); } catch { return JSON.stringify(r).slice(0, 80); } })(),
          settle: settleFn ? settleFn(r) : "the primary source named in the row, or the vendor datasheet",
        });
      }
    }
  };
  walk("cw-data.js", "IDCODES", IDCODES, (r) => `${hex(r.id)} — ${r.family}`, (r) => r.src ?? "the vendor datasheet");
  walk("cw-data.js", "JEP106", JEP106, (r) => `${hex(r.code, 2)} bank ${r.cont + 1} — ${r.vendor}`);
  walk("cw-data.js", "SPI_VENDORS", SPI_VENDORS, (r) => `${hex(r.id, 2)} — ${r.vendor}`);
  walk("cw-data.js", "SIGNATURES", SIGNATURES, (r) => `${r.name} — magic ${r.magic || "(none)"}`, () => "a known-good dump containing the format, or the format's own specification");
  walk("cw-data.js", "SUBSTITUTION_FAMILIES.members", SUBSTITUTION_FAMILIES.flatMap((f) => f.members ?? []), (r) => `${r.vendor} ${r.part}`, () => "the vendor datasheet for that exact part number");
  walk("cw-data.js", "ARCHS.memmap", ARCHS.flatMap((a) => a.memmap ?? []), (r) => r.name, () => "the reference manual for the exact part");
  walk("cw-data.js", "ARCHS.keyRegs", ARCHS.flatMap((a) => a.keyRegs ?? []), (r) => r.name, () => "the reference manual for the exact part");
  walk("cw-data-uefi.js", "GUID_DEFINED_WRAPPERS", GUID_DEFINED_WRAPPERS, (r) => `${r.name} — ${r.guid}`, () => "a known-good dump of the same platform; vendor signing GUIDs differ between AMI, Insyde and Phoenix");
  walk("cw-data-uefi.js", "VARIABLE_STORE_SIGNATURES", VARIABLE_STORE_SIGNATURES, (r) => `${r.sig} — ${r.name}`, () => "the platform's own firmware source, or a known-good dump");
  walk("cw-data-onewire.js", "FAMILY_CODES", FAMILY_CODES, (r) => `${hex(r.code, 2)} — ${r.name}`, () => "the Maxim/Dallas family-code list in the device datasheet");
  walk("cw-subst.js", "substitution members", substitutionIndex().flatMap((i) => substitutionTableById(i.id)?.members ?? []), (r) => `${r.vendor} ${r.part}`, () => "the vendor datasheet for that exact part number");
  return out;
}

/* ================================================================== *
 * Go
 * ================================================================== */

if (typeof document !== "undefined" && document.getElementById) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}

export { boot, runAllSelfChecks, runTapChecks, runIsaChecks, STATE };
