/**
 * casefiles.js — CASEFILES lab controller (kr0me corp + Rodger Ramrod).
 *
 * Pipeline for a recovered artifact:
 *   fetch from the archive → SHA-1 against the archive's own index
 *   → fflate unzip in memory → sniff (MZ/NE/LE/PE/COM/text)
 *   → js/x86dis.js sweep + technique map → js/ghidra-wasm.js decompile.
 *
 * The only network traffic is browser → archive.org / web.archive.org, user
 * triggered, per file. Nothing is executed, nothing is uploaded.
 */

import {
  analyze, entropyWindows, extractTechniques,
  mnemonicHistogram, stringsIn, hex,
} from "./x86dis.js";
import { GhidraWasm } from "./ghidra-wasm.js";
import { unzipSync, unzlibSync } from "../vendor/fflate/index.mjs";
import { dissect } from "./artifacts.js";
import {
  SITE, LIBRARY, NOT_CAPTURED, CURATED, RAMROD, METHOD, REFERENCES,
  RIDDLE, DR7, HACKHU, DIRT, SATMURACH, WARRICK, SHADOWELF,
  VXHEAVENS, TROJANLAIR, TROJANSLAIR,
  waybackUrl, waybackView, cdxUrl,
} from "./krome-catalog.js";
const $ = (id) => document.getElementById(id);
const isHexAddr = (s) => /^(0x)?[0-9a-f]+$/i.test(s.trim());

const state = {
  engine: null,
  engineState: "loading",
  caseId: null,          // "ramrod" | "krome" | "demo" | "local"
  recovered: new Map(),  // name -> {bytes, verified, expected, ts, kind}
  members: new Map(),    // zip member name -> Uint8Array
  memberSrc: "",         // provenance string for the current zip
  artifact: null,        // {name, bytes, meta, analysis, techniques, symbols}
  selectedAddr: null,
  lang: "x86:LE:16:Real Mode",
  compiler: "default",
  log: [],
};

/* --------------------------------------------------------------- dom utils */

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid) node.append(kid);
  return node;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmtBytes = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);
const shortDate = (ts) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;

function logTo(msg, level = "info") {
  state.log.push({ t: new Date(), msg, level });
  const host = $("engineLog");
  host.append(el("div", { class: `line ${level}`, text: msg }));
  host.scrollTop = host.scrollHeight;
}

/* ------------------------------------------------------------- sha1/base32 */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = ((val << 8) | b) >>> 0;
    bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

async function sha1B32(bytes) {
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return base32(digest);
}

/* --------------------------------------------------------------- sniffer */

const dvOf = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

function ascii(bytes, off, len) {
  let s = "";
  for (let i = 0; i < len && off + i < bytes.length; i++) s += String.fromCharCode(bytes[off + i]);
  return s;
}

function parsePE(bytes) {
  const dv = dvOf(bytes);
  const peOff = dv.getUint32(0x3c, true);
  if (peOff + 24 > bytes.length || ascii(bytes, peOff, 4) !== "PE\0\0") return null;
  const machine = dv.getUint16(peOff + 4, true);
  const nsec = dv.getUint16(peOff + 6, true);
  const optSize = dv.getUint16(peOff + 20, true);
  const opt = peOff + 24;
  const magic = dv.getUint16(opt, true);
  const plus = magic === 0x20b; // PE32+ — the UEFI .efi format
  if (magic !== 0x10b && !plus) return { kind: "PE", note: `PE (magic ${magic.toString(16)}) — not mapped in this lab`, machine };
  const entryRVA = dv.getUint32(opt + 16, true);
  const imageBase = plus ? Number(dv.getBigUint64(opt + 24, true)) : dv.getUint32(opt + 28, true);
  const sections = [];
  let top = 0;
  const secBase = opt + optSize;
  for (let i = 0; i < nsec; i++) {
    const s = secBase + i * 40;
    if (s + 40 > bytes.length) break;
    const name = ascii(bytes, s, 8).replace(/\0.*$/, "");
    const vsize = dv.getUint32(s + 8, true);
    const va = dv.getUint32(s + 12, true);
    const rawSize = dv.getUint32(s + 16, true);
    const raw = dv.getUint32(s + 20, true);
    sections.push({ name, va, vsize, rawSize, raw });
    top = Math.max(top, va + vsize);
  }
  if (top > 32 * 1024 * 1024) return { kind: "PE", note: `image too large to map (${fmtBytes(top)})`, machine };
  const image = new Uint8Array(top || bytes.length);
  for (const s of sections) image.set(bytes.subarray(s.raw, s.raw + Math.min(s.rawSize, s.vsize)), s.va);
  return {
    kind: "PE", machine, entryRVA, imageBase,
    entry: (imageBase + entryRVA) >>> 0,
    image, sections,
    lang: plus ? "x86:LE:64:default" : "x86:LE:32:default",
    compiler: plus ? "gcc" : "windows",
    note: plus
      ? `PE32+ · UEFI-capable · ${nsec} sections · entry ${hex(imageBase + entryRVA)} — decompiles as x86:LE:64`
      : `PE32 · ${nsec} sections · entry ${hex(imageBase + entryRVA)}`,
  };
}

function sniff(bytes) {
  if (bytes.length >= 18 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    const dv = dvOf(bytes);
    const pe = bytes.length >= 0x40 ? parsePE(bytes) : null;
    if (pe) return pe;
    const lfanew = bytes.length >= 0x40 ? dv.getUint32(0x3c, true) : 0;
    const sig = lfanew && lfanew + 2 <= bytes.length ? ascii(bytes, lfanew, 2) : "";
    if (sig === "NE") return { kind: "NE", lfanew, note: `NE (Win16) at ${hex(lfanew)} — the lab analyzes the 16-bit MZ stub` };
    if (sig === "LE" || sig === "LX") return { kind: sig, lfanew, note: `${sig} linear executable — DOS4GW-era payload; the lab analyzes the 16-bit loader stub` };
    const cparhdr = dv.getUint16(0x08, true);
    const cs = dv.getUint16(0x16, true);
    const ip = dv.getUint16(0x14, true);
    const ss = dv.getUint16(0x0e, true);
    const sp = dv.getUint16(0x10, true);
    const loadSeg = cparhdr << 4;
    let entry = loadSeg + (cs << 4) + ip;
    let clipped = false;
    if (entry >= bytes.length && loadSeg + ip < bytes.length) { entry = loadSeg + ip; clipped = true; }
    if (entry >= bytes.length) { entry = loadSeg; clipped = true; }
    return { kind: "MZ", cparhdr, cs, ip, ss, sp, loadSeg, entry, clipped, lang: "x86:LE:16:Real Mode", note: `MZ · header ${cparhdr << 4} B · entry ${hex(entry)}${clipped ? " (clipped)" : ""}` };
  }
  let printable = 0, sample = Math.min(bytes.length, 512);
  for (let i = 0; i < sample; i++) if (bytes[i] === 9 || bytes[i] === 10 || bytes[i] === 13 || (bytes[i] >= 32 && bytes[i] < 127)) printable++;
  if (sample && printable / sample > 0.85) return { kind: "TXT", note: "text" };
  return { kind: "COM", lang: "x86:LE:16:Real Mode", note: "no MZ header — treated as a raw .COM image at 0x100" };
}

/* -------------------------------------------------------------- artifacts */

/**
 * The static pass shared by loadArtifact and the Ghidra sweep: sniff the
 * container, route it to the disassembler, and produce everything the
 * decompiler needs (image, language, compiler, base, entry).
 */
function staticPass(bytes) {
  const meta = sniff(bytes);
  let analysis = null;
  let mode = 16;
  let base = 0x100, entry = 0x100;
  let lang = "x86:LE:16:Real Mode";
  let compiler = "default";

  if (meta.kind === "PE" && meta.image) {
    mode = meta.lang === "x86:LE:64:default" ? 64 : 32;
    base = meta.imageBase; entry = meta.entry;
    lang = meta.lang;
    compiler = meta.compiler || "windows";
    analysis = analyze(meta.image, { base, entry, mode });
  } else if (meta.kind === "MZ") {
    base = meta.loadSeg; entry = meta.entry;
    analysis = analyze(bytes, { base, entry, mode: 16 });
  } else if (meta.kind === "COM") {
    base = 0x100; entry = 0x100;
    analysis = analyze(bytes, { base, entry, mode: 16 });
  }
  return { meta, analysis, mode, base, entry, lang, compiler, image: meta.kind === "PE" && meta.image ? meta.image : bytes };
}

function loadArtifact(name, bytes, provenance = "") {
  const prep = staticPass(bytes);
  const { meta, analysis } = prep;
  state.lang = prep.lang;
  state.compiler = prep.compiler;

  state.base = prep.base;
  state.entry = prep.entry;
  state.artifact = {
    name, bytes, meta, provenance,
    image: prep.image,
    analysis, techniques: analysis ? extractTechniques(analysis) : null,
    mode: prep.mode, base: prep.base, entry: prep.entry,
    symbols: analysis ? buildSymbols(analysis) : [],
    structure: dissect(bytes, unzlibSync),
  };
  state.selectedAddr = analysis ? prep.entry : null;
  syncLangControls();
  renderArtifact();
  if (analysis) showTab("listing"); else showTab("hex");
  logTo(`loaded ${name} — ${meta.note || meta.kind}`, "ok");
}

function buildSymbols(analysis) {
  const out = [];
  for (const [addr, ref] of [...analysis.refs.entries()].sort((a, b) => a[0] - b[0])) {
    const insn = analysis.insns.get(addr);
    if (!insn || insn.data) continue;
    out.push({ addr, label: `loc_${addr.toString(16)}`, ref });
  }
  return out;
}

function syncLangControls() {
  $("langSelect").value = state.lang;
  rebuildCompilerSelect();
  $("baseInput").value = state.artifact ? "0x" + (state.base >>> 0).toString(16) : "0x100";
}

function rebuildCompilerSelect() {
  const lang = state.engine?.findLanguage(state.lang);
  const sel = $("compSelect");
  sel.textContent = "";
  if (!lang) { sel.append(el("option", { value: "default", text: "default" })); return; }
  for (const c of lang.compilers) sel.append(el("option", { value: c.id, text: c.name }));
  sel.value = lang.compilers.some((c) => c.id === state.compiler) ? state.compiler : lang.compilers[0].id;
  state.compiler = sel.value;
}

/* ------------------------------------------------------------ decompiler */

async function ensureEngine() {
  if (state.engineState === "ready") return state.engine;
  if (state.engineState === "loading") throw new Error("engine still loading");
  throw new Error("engine failed to load");
}

/**
 * Small DOS-era images end in data (strings, MZ leftovers), and the
 * decompiler's flow recovery will happily walk off the end of a 63-byte file.
 * A run of RETFs gives every runaway path a clean terminator without touching
 * any address below the real end of the image.
 */
function paddedForDecompile(bytes, pad = 64) {
  const out = new Uint8Array(bytes.length + pad);
  out.set(bytes);
  out.fill(0xcb, bytes.length);
  return out;
}

async function decompileAt(addr) {
  const art = state.artifact;
  if (!art) return;
  try {
    const engine = await ensureEngine();
    $("cStatus").textContent = "decompiling…";
    const res = await engine.decompile(paddedForDecompile(art.image), {
      lang: state.lang, compiler: state.compiler,
      base: "0x" + (state.base >>> 0).toString(16),
      func: "0x" + addr.toString(16),
    });
    $("cOut").innerHTML = highlightC(res.text);
    $("cStatus").textContent = `${res.lang} · ${res.compiler} · ${res.ms.toFixed(0)} ms`;
    logTo(`decompiled ${art.name} @ ${hex(addr)} in ${res.ms.toFixed(0)} ms`, "ok");
  } catch (err) {
    $("cStatus").textContent = "failed";
    $("cOut").innerHTML = `<p class="placeholder">decompiler: ${esc(err.message)}</p>`;
    logTo(`decompile failed: ${err.message}`, "error");
  }
}

const C_KEYWORDS = new Set(["void", "int", "char", "unsigned", "signed", "long", "short", "return", "if", "else", "while", "for", "do", "switch", "case", "break", "continue", "goto", "sizeof", "code", "undefined", "undefined1", "undefined2", "undefined4", "uint", "uint3", "uint4", "ushort", "uchar", "ulong", "int2", "int3", "int4", "bool", "float", "double", "struct", "union", "enum", "typedef", "static", "const", "extern", "register", "volatile"]);

function highlightC(src) {
  const out = [];
  const re = /(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|(\b(?:0x[0-9a-fA-F]+|\d+)\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(esc(src.slice(last, m.index)));
    const tok = m[0];
    if (m[1] || m[2]) out.push(`<span class="c-com">${esc(tok)}</span>`);
    else if (m[3]) out.push(`<span class="c-str">${esc(tok)}</span>`);
    else if (m[4]) out.push(`<span class="c-num">${esc(tok)}</span>`);
    else if (C_KEYWORDS.has(tok)) out.push(`<span class="c-key">${esc(tok)}</span>`);
    else if (/^(uRam|iRam|xRam)/.test(tok)) out.push(`<span class="c-mem">${esc(tok)}</span>`);
    else if (/^(uVar|iVar|bVar|pcVar|cVar|puVar|piVar|in_|auStack|local|unaff)/.test(tok)) out.push(`<span class="c-var">${esc(tok)}</span>`);
    else out.push(esc(tok));
    last = re.lastIndex;
  }
  out.push(esc(src.slice(last)));
  return out.join("");
}

/* ------------------------------------------------------------- rendering */

const ASM_FLOW = /^(j|loop|call|ret|int|iret|hlt)/;

function asmTokens(text) {
  const m = text.match(/^(\S+)(\s*)(.*)$/);
  if (!m) return esc(text);
  const [, mnem, gap, ops] = m;
  const cls = mnem === "db" ? "a-data" : ASM_FLOW.test(mnem) ? "a-flow" : mnem === "int" ? "a-int" : "";
  return `<span class="a-mnem ${cls}">${esc(mnem)}</span>${esc(gap)}${esc(ops)}`;
}

function renderArtifact() {
  const art = state.artifact;
  if (!art) return;
  $("loading").hidden = true;

  if (!art.analysis) {
    $("statLine").innerHTML = `<b>${art.bytes.length}</b> bytes · <b>${esc(art.meta.kind)}</b> · ${esc(art.meta.note || "")}${art.provenance ? ` · <span class="dim">${esc(art.provenance)}</span>` : ""}`;
    const st = art.structure;
    if (st) {
      const box = el("div", { class: "zip-members" });
      box.append(el("p", { class: "panel-note", html: `<b>${esc(st.type.toUpperCase())} structure</b> — ${esc(structureSummary(st))} <span class="dim">(parsed, never executed — no machine code for the decompiler here)</span>` }));
      box.append(structureTable(st));
      $("listing").textContent = "";
      $("listing").append(box);
    } else {
      $("listing").innerHTML = `<p class="placeholder">${esc(art.name)} — ${esc(art.meta.note || art.meta.kind)}. No code view for this container; see HEX · ENTROPY.</p>`;
    }
    $("hexDump").textContent = hexDumpText(art.bytes, 0);
    $("stringList").textContent = stringsIn(art.bytes).slice(0, 400).join("\n");
    drawEntropy(art.bytes);
    $("symbolList").textContent = "";
    setFuncOptions([]);
    return;
  }

  const a = art.analysis;
  const insnCount = [...a.insns.values()].filter((i) => !i.data).length;
  const top = mnemonicHistogram(a).slice(0, 6).map(([m, n]) => `${m}·${n}`).join(" ");
  $("statLine").innerHTML = [
    `<b>${esc(art.name)}</b>`,
    `<b>${art.bytes.length}</b> bytes`,
    `base <b>${hex(a.base)}</b>`,
    `<b>${insnCount}</b> instructions`,
    `<b>${a.codeBytes}</b> code / <b>${a.dataBytes}</b> data`,
    `<span class="dim">${esc(top)}</span>`,
    art.provenance ? `<span class="dim">${esc(art.provenance)}</span>` : "",
  ].filter(Boolean).join(" · ");

  const frag = document.createDocumentFragment();
  for (const addr of a.order) {
    const insn = a.insns.get(addr);
    frag.append(el("div", {
      class: `row${insn.data ? " data" : ""}${state.selectedAddr === addr ? " sel" : ""}${insn.data ? "" : " clickable"}`,
      "data-addr": addr.toString(16),
      title: insn.data ? (insn.dataNote || "data") : `${insn.len} byte${insn.len > 1 ? "s" : ""}`,
    },
      el("span", { class: "addr", text: addr.toString(16).padStart(6, "0") }),
      el("span", { class: "bytes", text: insn.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ").slice(0, 23) }),
      el("span", { class: "text", html: asmTokens(insn.repr) }),
    ));
  }
  const host = $("listing");
  host.textContent = "";
  host.append(frag);

  $("symbolList").textContent = "";
  for (const s of art.symbols.slice(0, 120)) {
    $("symbolList").append(el("button", {
      type: "button", class: "sym",
      onclick: () => selectAddress(s.addr),
    },
      el("span", { class: "sym-name", text: s.label }),
      el("span", { class: "sym-ref", text: `c${s.ref.calls}·j${s.ref.jumps}` }),
    ));
  }

  $("hexDump").textContent = hexDumpText(art.bytes, art.base);
  $("stringList").textContent = stringsIn(art.bytes).slice(0, 400).join("\n");
  drawEntropy(art.bytes);
  setFuncOptions(art.symbols);
  $("funcInput").value = "0x" + (art.entry >>> 0).toString(16);
  renderTech();
}

function renderTech() {
  const host = $("techTables");
  host.textContent = "";
  const t = state.artifact?.techniques;
  if (!t || !t.length) { host.append(el("p", { class: "placeholder", text: "no DOS/BIOS service usage recovered — this build may be 32-bit flat code or packed." })); return; }
  for (const row of t) {
    host.append(el("div", { class: "tech-row" },
      el("span", { class: "tech-key", text: row.label }),
      el("span", { class: "tech-val", text: row.note }),
      el("span", { class: "tech-addrs", text: row.addrs.map((x) => hex(x)).join("  ") }),
    ));
  }
}

function hexDumpText(bytes, base, perLine = 16) {
  const lines = [];
  for (let off = 0; off < bytes.length; off += perLine) {
    const slice = bytes.subarray(off, off + perLine);
    const addr = ((base || 0) + off).toString(16).padStart(8, "0");
    const hx = [...slice].map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(perLine * 3 - 1);
    const asciiPart = [...slice].map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${addr}  ${hx}  |${asciiPart}|`);
  }
  return lines.join("\n");
}

function drawEntropy(bytes) {
  const canvas = $("entropyCanvas");
  canvas.hidden = false;
  const ctx = canvas.getContext("2d");
  const wins = entropyWindows(bytes);
  canvas.width = Math.max(wins.length, 64);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  wins.forEach((e, i) => {
    const h = (e / 8) * canvas.height;
    ctx.fillStyle = e > 7.2 ? "#ff5470" : e > 6 ? "#f7d56a" : "#4be585";
    ctx.fillRect(i, canvas.height - h, 1, h);
  });
}

function setFuncOptions(symbols) {
  const sel = $("funcSelect");
  sel.textContent = "";
  if (!symbols?.length) { sel.append(el("option", { value: "", text: "—" })); return; }
  for (const s of symbols) sel.append(el("option", { value: s.addr.toString(16), text: `${s.label} (${hex(s.addr)})` }));
}

function selectAddress(addr) {
  state.selectedAddr = addr;
  renderArtifact();
  const row = $("listing").querySelector(`.row[data-addr="${addr.toString(16)}"]`);
  if (row) row.scrollIntoView({ block: "center" });
  $("funcInput").value = "0x" + addr.toString(16);
  showTab("c");
  decompileAt(addr);
}

/* ------------------------------------------------------------------ cases */

const CASES = {
  ramrod: {
    title: "RODGER RAMROD", sub: "Nonaz Inc. · 1996 · DOS4GW",
    chip: "archive.org · 3 items",
  },
  krome: {
    title: "KR0ME CORP", sub: "members.tripod.com/~retrotech · 1995–98",
    chip: `wayback · ${LIBRARY.length} captures`,
  },
  dss: {
    title: "DSS ARCHAEOLOGY", sub: "dr7.com · hackhu.com · the card wars",
    chip: "wayback · warrick mode",
  },
  shadowelf: {
    title: "SHADOW ELF", sub: "geocities.com/SiliconValley/Park/8099 · the archivist's homepage",
    chip: `wayback · ${SHADOWELF.files.length} pinned captures`,
  },
  vcl: {
    title: "VIRUS CREATION LAB", sub: "VX Heavens constructors shelf · Nowhere Man · 1992",
    chip: `wayback · ${VXHEAVENS.files.length} pinned captures`,
  },
  trojanslair: {
    title: "TROJAN'S LAIR", sub: "tlsecurity.net · SubSeven-era depot · 2000–2003",
    chip: `wayback · ${TROJANSLAIR.files.length} pinned captures`,
  },
  demo: {
    title: "DEMO.EXE", sub: "63-byte MZ in this repo",
    chip: "local · offline",
  },
};

function selectCase(id) {
  state.caseId = id;
  document.querySelectorAll("[data-case]").forEach((b) => b.classList.toggle("on", b.dataset.case === id));
  const host = $("casePanel");
  host.textContent = "";
  if (id === "ramrod") renderRamrodPanel(host);
  if (id === "krome") renderKromePanel(host);
  if (id === "dss") renderDssPanel(host);
  if (id === "shadowelf") renderShadowelfPanel(host);
  if (id === "vcl") renderVclPanel(host);
  if (id === "trojanslair") renderTrojanPanel(host);
  if (id === "demo") loadArtifact("demo.exe", DEMO_BYTES, "repository demo.exe");
  renderDossier();
  showTab(id === "demo" ? "listing" : "dossier");
}

/* ---- rodger ramrod panel ---- */

function renderRamrodPanel(host) {
  const panel = el("section", { class: "panel" });
  panel.append(el("div", { class: "panel-head" }, el("h2", { text: "eXoDOS package" }), el("span", { class: "panel-tag", text: "fetch + verify" })));
  const body = el("div", { class: "recovery-body" });
  body.append(el("p", { class: "panel-note", html:
    `Fetch <b>${esc(RAMROD.exodos.path)}</b> (${fmtBytes(RAMROD.exodos.bytes)}) from the public eXoDOS torrent item, ` +
    `SHA-1 it against the archive metadata (<code>${RAMROD.exodos.sha1.slice(0, 16)}…</code>), unzip in memory and list the DOS files. ` +
    `Byte-identical to the stream-only shareware zip. The 22&nbsp;MB <code>RRR.DAT</code> stays unopened.` }));
  body.append(el("div", { class: "field-row" },
    el("button", { type: "button", class: "mini on", id: "btnFetchRamrod", onclick: fetchRamrod, text: "FETCH + VERIFY" }),
    el("span", { class: "mini-note dim", id: "ramrodStatus", text: "idle" }),
  ));
  panel.append(body);
  panel.append(el("div", { id: "ramrodMembers", class: "members" }));
  host.append(panel);
  host.append(renderDropPanel("Or drop the files here — the shareware zip, an extracted STKRUN.EXE / MAIN.EXE, or any DOS image."));
  const existing = state.recovered.get("ramrod");
  if (existing) renderRamrodMembers(existing);
}

async function fetchRamrod() {
  const status = $("ramrodStatus");
  try {
    status.textContent = "fetching 8.4 MB …";
    const res = await fetch(RAMROD.exodos.fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.status === 403 ? "the archive refused this client (try the drop zone or cdfwps.rar)" : res.statusText}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    status.textContent = "hashing …";
    const hexdigest = [...new Uint8Array(await crypto.subtle.digest("SHA-1", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
    const verified = hexdigest === RAMROD.exodos.sha1;
    logTo(`Rodger_Ramrod_1996.zip · sha1 ${hexdigest} · ${verified ? "MATCHES archive.org metadata" : "MISMATCH — expected " + RAMROD.exodos.sha1}`, verified ? "ok" : "error");
    status.textContent = verified ? "sha1 ✓ verified" : "sha1 ✗ mismatch";
    const members = unzipSync(bytes);
    state.recovered.set("ramrod", { members, verified, expected: RAMROD.exodos.sha1, src: RAMROD.exodos.fetchUrl });
    renderRamrodMembers(state.recovered.get("ramrod"));
    renderDossier();
  } catch (err) {
    status.textContent = "failed";
    logTo(`ramrod fetch: ${err.message}`, "error");
    $("ramrodMembers").append(el("p", { class: "placeholder", html:
      `${esc(err.message)}<br/>The stream-only item needs the archive's player session; use <b>FETCH + VERIFY</b> again later, ` +
      `or drop the zip / binaries below if you already have them.` }));
  }
}

/* ---- kr0me corp panel ---- */

/** Member list under the ramrod panel, shared by fetch + reselect paths. */
function renderRamrodMembers(rec) {
  const host = $("ramrodMembers");
  if (!host || !rec?.members) return;
  host.textContent = "";
  host.append(el("p", { class: "panel-note", html:
    `<b>Rodger Ramrod (1996).zip</b> — ${Object.keys(rec.members).length} members · sha1 ${rec.verified ? "✓" : "✗"} <code>${esc(rec.expected)}</code>` }));
  const list = el("div", { class: "members" });
  for (const [name, bytes] of Object.entries(rec.members)) {
    const meta = sniff(bytes);
    list.append(el("button", {
      type: "button", class: "member-row",
      onclick: () => loadArtifact(name, bytes, "eXoDOS Rodger Ramrod (1996).zip · sha1 ✓"),
    },
      el("span", { class: "member-name", text: name }),
      el("span", { class: "member-meta", text: `${fmtBytes(bytes.length)} · ${meta.kind}` }),
    ));
  }
  host.append(list);
}

function renderKromePanel(host) {
  const panel = el("section", { class: "panel" });
  panel.append(el("div", { class: "panel-head" }, el("h2", { text: "Wayback library" }), el("span", { class: "panel-tag", text: `${LIBRARY.length} captures` })));
  const search = el("input", { id: "kromeSearch", type: "search", placeholder: "filter files…", spellcheck: "false", oninput: () => renderKromeList(search.value) });
  panel.append(el("div", { class: "field-row" }, search));
  const curatedZips = LIBRARY.filter((r) => !r.suspect && CURATED[r.name]);
  panel.append(el("div", { class: "field-row" },
    el("button", {
      type: "button", class: "mini on", id: "btnKromeSweep",
      onclick: () => ghidraSweep({
        files: curatedZips.map((r) => ({ name: r.name, url: `http://members.tripod.com/~retrotech/${r.name}`, ts: r.ts })),
        nameOf: (f) => f.name,
        caseLabel: "kr0me corp curated zips",
        statusId: "kromeSweepStatus", btnId: "btnKromeSweep", cardHostId: "kromeRecovered", reportId: "kromeGhidraReport",
      }),
      text: `GHIDRA SWEEP — ${curatedZips.length} CURATED ZIPS`,
    }),
    el("span", { class: "mini-note dim", id: "kromeSweepStatus", text: "recover → unzip → disassemble → decompile, every member, one report" }),
  ));
  panel.append(el("div", { id: "kromeGhidraReport" }));
  panel.append(el("div", { id: "kromeList", class: "catalog" }));
  host.append(panel);
  host.append(el("section", { class: "panel" },
    el("div", { class: "panel-head" }, el("h2", { text: "Recovery log" })),
    el("div", { id: "kromeRecovered", class: "members" }),
  ));
  renderKromeList("");
  for (const [name, rec] of state.recovered) if (rec.caseId === "krome") appendRecoveredCard(name, rec);
}

const KIND_LABEL = { z: "file", h: "page", t: "text", "!": "late capture" };

function renderKromeList(filter) {
  const host = $("kromeList");
  if (!host) return;
  host.textContent = "";
  const f = filter.trim().toLowerCase();
  for (const entry of LIBRARY) {
    if (f && !(entry.name.toLowerCase().includes(f) || entry.desc.toLowerCase().includes(f))) continue;
    const cur = CURATED[entry.name];
    const btn = el("button", {
      type: "button",
      class: `cat-item${entry.suspect ? " src-only" : ""}`,
      onclick: () => recoverKrome(entry),
      title: cur ? `${cur.tag} — ${cur.body}` : `recover ${entry.name}`,
    },
      el("span", { class: "cat-name", text: entry.name }),
      el("span", { class: "cat-kind", text: `${KIND_LABEL[entry.kind]} · ${shortDate(entry.ts)}` }),
      entry.desc ? el("span", { class: "cat-note", text: entry.desc }) : null,
      cur ? el("span", { class: "cat-note curated", text: `★ ${cur.tag}` }) : null,
    );
    host.append(btn);
  }
}

async function recoverKrome(entry) {
  return recoverCapture({
    name: entry.name,
    url: `http://members.tripod.com/~retrotech/${entry.name}`,
    ts: entry.ts,
    hostId: "kromeRecovered",
  });
}

/** Raw capture + pinned CDX digest for ANY archived URL — the Warrick primitive. */
const rawFor = (url, ts) => `https://web.archive.org/web/${ts}id_/${url}`;
const cdxFor = (url, ts) =>
  `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&timestamp=${ts}&limit=1&output=json`;

/**
 * The gate itself, factored out so the Ghidra sweep can walk captures
 * without the per-file UI (member pickers, tab switches). Steps: expected
 * digest (given, or the CDX index for this capture) → raw id_ memento →
 * SHA-1 → verdict. Never executes anything.
 */
async function fetchVerified({ url, ts, digest }) {
  let expected = digest;
  if (!expected) {
    const cdxRes = await fetch(cdxFor(url, ts));
    if (!cdxRes.ok) throw new Error(`CDX HTTP ${cdxRes.status}`);
    const rows = await cdxRes.json();
    const row = rows.length > 1 ? rows[1] : rows[0];
    if (!row) throw new Error("CDX returned no row");
    expected = row[5];
  }
  const res = await fetch(rawFor(url, ts));
  if (!res.ok) throw new Error(`capture HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const got = await sha1B32(bytes);
  return { bytes, expected, got, verified: got === expected };
}

async function recoverCapture({ name, url, ts, digest, hostId = "kromeRecovered", provenance = null }) {
  const card = appendRecoveredCard(name, { status: "recovering…" }, hostId);
  try {
    const { bytes, expected, got, verified } = await fetchVerified({ url, ts, digest });
    card.replaceWith(appendRecoveredCard(name, {
      status: verified ? "sha1 ✓" : `sha1 ✗ (got ${got}, CDX said ${expected})`,
      verified, bytes: bytes.length, expected, ts,
    }, hostId));
    logTo(`${name} · ${verified ? "VERIFIED" : "MISMATCH"} · sha1 ${got}`, verified ? "ok" : "error");
    if (!verified) return;
    // 4. open
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
      const members = unzipSync(bytes);
      state.recovered.set(name, { caseId: state.caseId, members, verified, expected: got, ts });
      openMemberPicker(name, members, { ts, expected: got, provenance: provenance || url });
    } else {
      state.recovered.set(name, { caseId: state.caseId, members: { [name]: bytes }, verified, expected: got, ts });
      loadArtifact(name, bytes, provenance || `wayback ${shortDate(ts)} · sha1 ✓`);
    }
    renderDossier();
  } catch (err) {
    card.replaceWith(appendRecoveredCard(name, { status: `failed — ${err.message}`, verified: false }, hostId));
    logTo(`${name}: ${err.message}`, "error");
  }
}

function appendRecoveredCard(name, rec, hostId = "kromeRecovered") {
  const host = $(hostId);
  const card = el("div", { class: "member-card", "data-name": name },
    el("span", { class: "member-name", text: name }),
    el("span", { class: `member-status ${rec.verified === true ? "ok" : rec.verified === false ? "bad" : ""}`, text: rec.status || "" }),
  );
  if (host) host.prepend(card);
  return card;
}

function openMemberPicker(zipName, members, rec) {
  state.members = new Map(Object.entries(members));
  state.memberSrc = rec.provenance
    ? `${zipName} · ${rec.provenance.replace(/^https?:\/\//, "")} · wayback ${shortDate(rec.ts)} · sha1 ✓`
    : `${zipName} · wayback ${shortDate(rec.ts)} · sha1 ✓`;
  const view = el("div", { class: "zip-members" });
  view.append(el("p", { class: "panel-note", html: `<b>${esc(zipName)}</b> — ${Object.keys(members).length} members, verified against CDX digest ${esc(rec.expected)}. Click one to analyze:` }));
  const list = el("div", { class: "members" });
  for (const [name, bytes] of state.members) {
    const meta = sniff(bytes);
    list.append(el("button", {
      type: "button", class: "member-row",
      onclick: () => loadArtifact(`${zipName}!/${name}`, bytes, state.memberSrc),
    },
      el("span", { class: "member-name", text: name }),
      el("span", { class: "member-meta", text: `${fmtBytes(bytes.length)} · ${meta.kind}` }),
    ));
  }
  view.append(list);
  const host = $("dossierBody");
  host.prepend(el("section", { class: "case-block" }, view));
  showTab("dossier");
}

/* ---- dss panel + warrick mode ---- */

function renderDssPanel(host) {
  const p1 = el("section", { class: "panel" });
  p1.append(el("div", { class: "panel-head" }, el("h2", { text: "WARRICK MODE" }), el("span", { class: "panel-tag", text: "any domain" })));
  p1.append(el("p", { class: "panel-note", html:
    `CDX-driven site recovery in the spirit of <a target="_blank" rel="noreferrer" href="${WARRICK.url}">Warrick</a> ` +
    `(oduwsdl) — list every live capture of a domain, then pull any of them through the SHA-1 gate.` }));
  const input = el("input", { id: "warrickDomain", value: "dr7.com/dssfiles/", spellcheck: "false", "aria-label": "domain to recover" });
  p1.append(el("div", { class: "field-row" },
    input,
    el("button", { type: "button", class: "mini on", onclick: runWarrick, text: "SWEEP" }),
    el("span", { class: "mini-note dim", id: "warrickStatus", text: "idle" }),
  ));
  const presets = el("div", { class: "field-row" });
  for (const d of ["dr7.com/dssfiles/", "hackhu.com/", "members.tripod.com/~retrotech/", "dr7.com/dreckware/"]) {
    presets.append(el("button", { type: "button", class: "mini", onclick: () => { input.value = d; runWarrick(); }, text: d.replace(/\/$/, "") }));
  }
  p1.append(presets);
  p1.append(el("div", { id: "warrickList", class: "catalog" }));
  host.append(p1);

  const p2 = el("section", { class: "panel" });
  p2.append(el("div", { class: "panel-head" }, el("h2", { text: "DR7 · dssfiles" }), el("span", { class: "panel-tag", text: `${DR7.files.length} curated` })));
  p2.append(el("div", { class: "field-row" },
    el("button", {
      type: "button", class: "mini on", id: "btnDssSweep",
      onclick: () => ghidraSweep({
        files: DR7.files,
        nameOf: (f) => `dr7.com/dssfiles/${f.name}`,
        caseLabel: "DR7 dssfiles",
        statusId: "dssSweepStatus", btnId: "btnDssSweep", cardHostId: "dssRecovered", reportId: "dssGhidraReport",
      }),
      text: `GHIDRA SWEEP — ${DR7.files.length} DSSFILES ZIPS`,
    }),
    el("span", { class: "mini-note dim", id: "dssSweepStatus", text: "card tools through the same gate and the same decompiler" }),
  ));
  p2.append(el("div", { id: "dssGhidraReport" }));
  const list = el("div", { class: "catalog" });
  for (const f of DR7.files) {
    list.append(el("button", {
      type: "button", class: "cat-item",
      onclick: () => recoverCapture({ name: `dr7.com/dssfiles/${f.name}`, url: f.url, ts: f.ts, hostId: "dssRecovered" }),
    },
      el("span", { class: "cat-name", text: f.name }),
      el("span", { class: "cat-kind", text: `${fmtBytes(f.warc)} · ${shortDate(f.ts)}` }),
      f.desc ? el("span", { class: "cat-note", text: f.desc }) : null,
    ));
  }
  p2.append(list);
  host.append(p2);

  host.append(el("section", { class: "panel" },
    el("div", { class: "panel-head" }, el("h2", { text: "Recovery log" })),
    el("div", { id: "dssRecovered", class: "members" }),
  ));
}

async function runWarrick() {
  const status = $("warrickStatus");
  const host = $("warrickList");
  if (!host) return;
  host.textContent = "";
  const domain = $("warrickDomain").value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!domain) return;
  status.textContent = "querying CDX …";
  try {
    const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}/*&output=json&collapse=urlkey&limit=500&filter=statuscode:200`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CDX HTTP ${res.status}`);
    const rows = (await res.json()).slice(1);
    const isFile = (u) => /\.(zip|exe|com|bin|rar|7z|arj|lzh|cab|sys|rom|efi|dat)(\?|$)/i.test(u);
    rows.sort((a, b) => (isFile(b[2]) ? 1 : 0) - (isFile(a[2]) ? 1 : 0));
    status.textContent = `${rows.length} captures`;
    for (const r of rows.slice(0, 300)) {
      let path = r[2];
      try { path = new URL(r[2]).pathname; } catch { /* keep raw */ }
      const name = path.split("/").pop() || path;
      const file = isFile(r[2]);
      host.append(el("button", {
        type: "button", class: `cat-item${file ? "" : " src-only"}`,
        onclick: () => recoverCapture({
          name: `${name}@${shortDate(r[1])}`,
          url: r[2], ts: r[1], digest: r[5], hostId: "dssRecovered",
        }),
      },
        el("span", { class: "cat-name", text: name }),
        el("span", { class: "cat-kind", text: `${r[3] || "?"} · ${shortDate(r[1])}` }),
        el("span", { class: "cat-note", text: decodeURIComponent(path).slice(0, 60) }),
      ));
    }
    logTo(`warrick sweep ${domain}: ${rows.length} live captures`, "ok");
  } catch (err) {
    status.textContent = "failed";
    logTo(`warrick ${domain}: ${err.message}`, "error");
  }
}

/* ---- shadow elf panel ---- */

const shadowelfName = (f) => (f.name === "index.html" ? "SiliconValley/Park/8099/" : `SiliconValley/Park/8099/${f.name}`);

function renderShadowelfPanel(host) {
  const panel = el("section", { class: "panel" });
  panel.append(el("div", { class: "panel-head" }, el("h2", { text: "THE SHADOW ELF'S HOMEPAGE" }), el("span", { class: "panel-tag", text: `${SHADOWELF.files.length} pinned captures` })));
  panel.append(el("p", { class: "panel-note", html:
    `<a target="_blank" rel="noreferrer" href="https://web.archive.org/web/19990204033556/${esc(SHADOWELF.url)}">${esc(SHADOWELF.url.replace("http://", ""))}</a> — ` +
    `the archivist's own GeoCities homestead, kept with the same gate as the attack tools. ` +
    `Every row carries its CDX SHA-1 pinned at catalog time; the console fetches the raw <code>id_</code> memento, hashes it, and shows a mismatch instead of hiding one. ` +
    `<b>Ghidra scope:</b> a homepage has no machine code — the LISTING view parses SWF tags, MIDI tracks/lyrics and image chunks instead; the decompiler's targets live in the kr0me and DSS cases.` }));
  panel.append(el("div", { class: "field-row" },
    el("button", { type: "button", class: "mini on", id: "btnShadowAll", onclick: recoverAllShadowelf, text: `RECOVER ALL ${SHADOWELF.files.length}` }),
    el("span", { class: "mini-note dim", id: "shadowAllStatus", text: "idle — or click files individually" }),
  ));
  const list = el("div", { class: "catalog" });
  for (const f of SHADOWELF.files) {
    list.append(el("button", {
      type: "button", class: "cat-item",
      onclick: () => recoverCapture({ name: shadowelfName(f), url: f.url, ts: f.ts, digest: f.digest, hostId: "shadowRecovered" }),
    },
      el("span", { class: "cat-name", text: f.name }),
      el("span", { class: "cat-kind", text: `${shortDate(f.ts)} · ${f.digest.slice(0, 8)}` }),
      f.desc ? el("span", { class: "cat-note", text: f.desc }) : null,
    ));
  }
  panel.append(list);
  host.append(panel);
  host.append(el("section", { class: "panel" },
    el("div", { class: "panel-head" }, el("h2", { text: "Recovery log" })),
    el("div", { id: "shadowRecovered", class: "members" }),
  ));
}

async function recoverAllShadowelf() {
  const status = $("shadowAllStatus");
  const btn = $("btnShadowAll");
  if (!status || !btn || btn.disabled) return;
  btn.disabled = true;
  let ok = 0, bad = 0;
  for (let i = 0; i < SHADOWELF.files.length; i++) {
    const f = SHADOWELF.files[i];
    const name = shadowelfName(f);
    status.textContent = `recovering ${i + 1}/${SHADOWELF.files.length} — ${f.name} …`;
    await recoverCapture({ name, url: f.url, ts: f.ts, digest: f.digest, hostId: "shadowRecovered" });
    if (state.recovered.get(name)) ok++; else bad++;
    await new Promise((r) => setTimeout(r, 500)); // be polite to the archive
  }
  status.textContent = `done — ${ok} verified, ${bad} failed`;
  btn.disabled = false;
  logTo(`shadowelf sweep: ${ok}/${SHADOWELF.files.length} captures verified against pinned digests`, ok === SHADOWELF.files.length ? "ok" : "error");
}

/* ---- virus creation laboratory panel ---- */

function renderVclPanel(host) {
  const panel = el("section", { class: "panel" });
  panel.append(el("div", { class: "panel-head" }, el("h2", { text: "VIRUS CREATION LABORATORY" }), el("span", { class: "panel-tag", text: `${VXHEAVENS.files.length} pinned captures` })));
  panel.append(el("p", { class: "panel-note", html:
    `Nowhere Man's 1992 constructor, off VX Heavens' Constructors shelf — ` +
    `every row carries its CDX SHA-1 pinned at catalog time. ` +
    `The shelf page calls <code>vcl.zip</code> the <b>[VCL] (cracked version)</b>, 190,066 B, ` +
    `MD5 <code>${VXHEAVENS.shelf.md5}</code>; the gate checks the archive's SHA-1 instead, ` +
    `and the dossier lists the VCL.DOC manifest to compare against.` }));
  const zips = VXHEAVENS.files.filter((f) => f.name.endsWith(".zip"));
  panel.append(el("div", { class: "field-row" },
    el("button", {
      type: "button", class: "mini on", id: "btnVclSweep",
      onclick: () => ghidraSweep({
        files: zips,
        nameOf: (f) => `vxheavens.com/dl/gen/${f.name}`,
        caseLabel: "VX Heavens VCL zips",
        statusId: "vclSweepStatus", btnId: "btnVclSweep", cardHostId: "vclRecovered", reportId: "vclGhidraReport",
      }),
      text: `GHIDRA SWEEP — ${zips.length} VCL ZIPS`,
    }),
    el("span", { class: "mini-note dim", id: "vclSweepStatus", text: "VCL.EXE is 16-bit Borland C++ — a real decompile target" }),
  ));
  panel.append(el("div", { id: "vclGhidraReport" }));
  const list = el("div", { class: "catalog" });
  for (const f of VXHEAVENS.files) {
    list.append(el("button", {
      type: "button", class: "cat-item",
      onclick: () => recoverCapture({ name: f.name, url: f.url, ts: f.ts, digest: f.digest, hostId: "vclRecovered" }),
    },
      el("span", { class: "cat-name", text: f.name }),
      el("span", { class: "cat-kind", text: `${shortDate(f.ts)} · ${f.digest.slice(0, 8)}` }),
      f.desc ? el("span", { class: "cat-note", text: f.desc }) : null,
    ));
  }
  panel.append(list);
  host.append(panel);
  host.append(el("section", { class: "panel" },
    el("div", { class: "panel-head" }, el("h2", { text: "Recovery log" })),
    el("div", { id: "vclRecovered", class: "members" }),
  ));
}

/* ---- trojan's lair panel ---- */

function renderTrojanPanel(host) {
  const panel = el("section", { class: "panel" });
  panel.append(el("div", { class: "panel-head" }, el("h2", { text: "TROJAN'S LAIR" }), el("span", { class: "panel-tag", text: `${TROJANSLAIR.files.length} pinned captures` })));
  panel.append(el("p", { class: "panel-note", html:
    `TL Security's SubSeven-era depot — every row carries its CDX SHA-1 pinned at catalog time. ` +
    `The remembered address (<code>trojanslair.org</code>) was never captured; the bytes live at ` +
    `<code>tlsecurity.net</code> behind the 377-byte <code>trojanslair.com</code> doorway, both pinned below. ` +
    `Win32 builds throughout: the sweep routes them to <code>x86:LE:32</code>.` }));
  const exes = TROJANSLAIR.files.filter((f) => f.name.endsWith(".exe"));
  panel.append(el("div", { class: "field-row" },
    el("button", {
      type: "button", class: "mini on", id: "btnTrojanSweep",
      onclick: () => ghidraSweep({
        files: exes,
        nameOf: (f) => `tlsecurity.net/${f.name}`,
        caseLabel: "Trojan's Lair builds",
        statusId: "trojanSweepStatus", btnId: "btnTrojanSweep", cardHostId: "trojanRecovered", reportId: "trojanGhidraReport",
      }),
      text: `GHIDRA SWEEP — ${exes.length} TROJAN BUILDS`,
    }),
    el("span", { class: "mini-note dim", id: "trojanSweepStatus", text: "packed builds will say so in red — mismatches excluded, never hidden" }),
  ));
  panel.append(el("div", { id: "trojanGhidraReport" }));
  const list = el("div", { class: "catalog" });
  for (const f of TROJANSLAIR.files) {
    list.append(el("button", {
      type: "button", class: "cat-item",
      onclick: () => recoverCapture({ name: f.name, url: f.url, ts: f.ts, digest: f.digest, hostId: "trojanRecovered" }),
    },
      el("span", { class: "cat-name", text: f.name }),
      el("span", { class: "cat-kind", text: `${shortDate(f.ts)} · ${f.digest.slice(0, 8)}` }),
      f.desc ? el("span", { class: "cat-note", text: f.desc }) : null,
    ));
  }
  panel.append(list);
  host.append(panel);
  host.append(el("section", { class: "panel" },
    el("div", { class: "panel-head" }, el("h2", { text: "Recovery log" })),
    el("div", { id: "trojanRecovered", class: "members" }),
  ));
}

/* ---- ghidra sweep ---- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Walk a case's recoverable captures through the full pipeline: SHA-1 gate
 * → unzip → sniff → disassemble → decompile. One button, whole case; every
 * verdict lands in a case-wide report table. Static only — nothing runs.
 */
async function ghidraSweep({ files, nameOf, caseLabel, statusId, btnId, cardHostId, reportId, memberCap = 12, decompileBudget = 48 }) {
  const status = $(statusId), btn = $(btnId);
  if (!status || !btn || btn.disabled) return;
  btn.disabled = true;
  try {
    const engine = await ensureEngine();
    const recovered = [];
    let okFiles = 0, failFiles = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const name = nameOf(f);
      status.textContent = `[${i + 1}/${files.length}] recovering ${f.name} …`;
      const card = appendRecoveredCard(name, { status: "recovering…" }, cardHostId);
      try {
        const { bytes, expected, got, verified } = await fetchVerified({ url: f.url, ts: f.ts, digest: f.digest });
        if (!verified) {
          card.replaceWith(appendRecoveredCard(name, { status: `sha1 ✗ (got ${got}, CDX said ${expected})`, verified: false }, cardHostId));
          logTo(`${name}: MISMATCH — excluded from the sweep`, "error");
          failFiles++;
        } else {
          card.replaceWith(appendRecoveredCard(name, { status: "sha1 ✓", verified: true, bytes: bytes.length, expected, ts: f.ts }, cardHostId));
          okFiles++;
          const members = bytes[0] === 0x50 && bytes[1] === 0x4b ? unzipSync(bytes) : { [name]: bytes };
          state.recovered.set(name, { caseId: state.caseId, members, verified, expected: got, ts: f.ts });
          recovered.push({ zip: name, members });
        }
      } catch (err) {
        card.replaceWith(appendRecoveredCard(name, { status: `failed — ${err.message}`, verified: false }, cardHostId));
        logTo(`${name}: ${err.message}`, "error");
        failFiles++;
      }
      await sleep(400); // be polite to the archive
    }

    const rows = [];
    let budget = decompileBudget;
    for (const { zip, members } of recovered) {
      let walked = 0;
      for (const [mname, mbytes] of Object.entries(members)) {
        if (++walked > memberCap) { rows.push({ member: `${zip}!/${mname}`, bytes: 0, kind: "—", note: "member cap reached for this archive" }); break; }
        const prep = staticPass(mbytes);
        const exec = prep.analysis !== null && (prep.meta.kind !== "COM" || /\.(com|sys|bin|ovl)$/i.test(mname));
        if (!exec) {
          rows.push({ member: `${zip}!/${mname}`, bytes: mbytes.length, kind: prep.meta.kind, note: prep.meta.note || "data — not routed to the decompiler" });
          continue;
        }
        if (budget-- <= 0) { rows.push({ member: `${zip}!/${mname}`, bytes: mbytes.length, kind: prep.meta.kind, note: "decompile budget reached — re-run the sweep to continue" }); continue; }
        status.textContent = `ghidra: ${mname} …`;
        const insnCount = [...prep.analysis.insns.values()].filter((x) => !x.data).length;
        const strs = stringsIn(mbytes).filter((s) => s.length >= 5).slice(0, 2).join(" · ").slice(0, 70);
        let decomp;
        try {
          const res = await engine.decompile(paddedForDecompile(prep.image), {
            lang: prep.lang, compiler: prep.compiler,
            base: "0x" + (prep.base >>> 0).toString(16),
            func: "0x" + (prep.entry >>> 0).toString(16),
          });
          decomp = { ok: true, lines: res.text.split("\n").length, ms: res.ms };
        } catch (err) {
          decomp = { ok: false, note: err.message };
        }
        rows.push({ member: `${zip}!/${mname}`, bytes: mbytes.length, kind: `${prep.meta.kind} · ${prep.lang.replace("x86:LE:", "")}`, insns: insnCount, decomp, note: strs });
        await sleep(80);
      }
    }
    renderSweepReport(reportId, caseLabel, rows, { okFiles, failFiles, total: files.length });
    const decompiled = rows.filter((r) => r.decomp?.ok).length;
    status.textContent = `sweep done — ${okFiles}/${files.length} verified · ${decompiled} members decompiled`;
    logTo(`ghidra sweep ${caseLabel}: ${okFiles}/${files.length} captures sha1 ✓, ${decompiled} members decompiled`, okFiles === files.length ? "ok" : "error");
  } catch (err) {
    status.textContent = `sweep failed — ${err.message}`;
    logTo(`ghidra sweep: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

function renderSweepReport(reportId, label, rows, tally) {
  const host = $(reportId);
  if (!host) return;
  host.textContent = "";
  const t = el("table", { class: "hash-table" });
  t.append(el("thead", {}, el("tr", {},
    el("th", { text: "member" }), el("th", { text: "bytes" }), el("th", { text: "kind · lang" }),
    el("th", { text: "insns" }), el("th", { text: "ghidra decompile" }), el("th", { text: "notable strings" }))));
  const tb = el("tbody");
  for (const r of rows) {
    tb.append(el("tr", {},
      el("td", { class: "mono", text: r.member }),
      el("td", { text: r.bytes ? String(r.bytes) : "—" }),
      el("td", { text: r.kind || "—" }),
      el("td", { text: r.insns !== undefined ? String(r.insns) : "—" }),
      el("td", { class: r.decomp ? (r.decomp.ok ? "" : "bad") : "dim", text: r.decomp ? (r.decomp.ok ? `✓ ${r.decomp.lines} lines · ${r.decomp.ms} ms` : `✗ ${r.decomp.note}`) : "—" }),
      el("td", { class: "dim", text: r.note || "" }),
    ));
  }
  t.append(tb);
  host.append(el("p", { class: "panel-note", html:
    `<b>${esc(label)}</b> — ${rows.length} members walked · ${tally.okFiles}/${tally.total} captures sha1 ✓ · ` +
    `${tally.failFiles} failed${tally.failFiles ? " (displayed, never hidden)" : ""}` }), t);
}

/* ---- structure dissector views ---- */

function structureSummary(st) {
  if (st.type === "swf") return `Flash ${st.version} (${st.sig}) · ${st.width}×${st.height} @ ${Math.round(st.fps * 100) / 100} fps · ${st.frames} frame(s) · ${st.tags.length} tags · ${st.actions.count} ActionScript op(s)`;
  if (st.type === "midi") return `Standard MIDI File, format ${st.format} · ${st.tracks.length} track(s) · ${st.division} ticks/quarter-note`;
  if (st.type === "gif") return `${st.sig} · ${st.width}×${st.height} · ${st.gct || "no"}-color global palette`;
  if (st.type === "jpeg") return `JPEG · ${st.width ?? "?"}×${st.height ?? "?"} (${st.sof || "no SOF found"})`;
  if (st.type === "png") return `PNG · ${st.width}×${st.height} · ${st.depth}-bit · color type ${st.colorType}`;
  return st.type;
}

function structureTable(st) {
  const rows = [];
  if (st.type === "swf") {
    for (const tag of st.tags.slice(0, 40)) {
      rows.push([tag.name, tag.len + " B" + (tag.label !== undefined ? ` · label "${tag.label}"` : "") + (tag.meta ? ` · ${tag.meta.replace(/\s+/g, " ").slice(0, 80)}` : "") + (tag.exports ? ` · exports ${tag.exports.join(", ")}` : "") + (tag.protect !== undefined ? ` · ${tag.protect}` : "") + (tag.clipped ? " · truncated" : "")]);
    }
    if (st.actions.names.length) rows.push(["ActionScript ops", st.actions.names.join(", ")]);
    for (const u of st.actions.urls) rows.push(["GetURL", `${u.url}${u.target ? ` → ${u.target}` : ""}`]);
    if (st.actions.constants.length) rows.push(["ConstantPool", st.actions.constants.join(", ").slice(0, 120)]);
  } else if (st.type === "midi") {
    for (const tr of st.tracks) {
      rows.push([`track ${tr.index + 1}`, `${tr.bytes} B` + (tr.name ? ` · "${tr.name}"` : "") + (tr.bpm ? ` · ${tr.bpm} bpm` : "") + (tr.program !== null ? ` · program ${tr.program}` : "") + (tr.instrument ? ` · ${tr.instrument}` : "") + ` · ${tr.noteOns} note-on(s)`]);
      if (tr.lyrics.length) rows.push([`track ${tr.index + 1} lyrics`, tr.lyrics.join(" ").slice(0, 160)]);
    }
    for (const x of st.texts) rows.push(["text", x.slice(0, 120)]);
  } else if (st.type === "gif") {
    for (const c of st.comments) rows.push(["comment", c]);
    for (const a of st.apps) rows.push(["app extension", a]);
    rows.push(["background", `color index ${st.bg}`]);
  } else if (st.type === "jpeg") {
    for (const c of st.comments) rows.push(["COM segment", c]);
    if (st.exif) rows.push(["APP1", "Exif metadata present"]);
    if (st.icc) rows.push(["APP2", "ICC color profile present"]);
  } else if (st.type === "png") {
    for (const x of st.texts) rows.push(["text chunk", x]);
    rows.push(["IHDR", `${st.width}×${st.height} · ${st.depth}-bit · color type ${st.colorType}`]);
  }
  const t = el("table", { class: "hash-table" });
  t.append(el("thead", {}, el("tr", {}, el("th", { text: "field" }), el("th", { text: "value" }))));
  const tb = el("tbody");
  for (const [k, v] of rows) tb.append(el("tr", {}, el("td", { text: k }), el("td", { class: "mono", text: String(v).slice(0, 160) })));
  t.append(tb);
  return t;
}

/* ---- dossier + research tabs ---- */

function renderDossier() {
  const host = $("dossierBody");
  host.textContent = "";
  if (state.caseId === "ramrod") renderRamrodDossier(host);
  if (state.caseId === "krome") renderKromeDossier(host);
  if (state.caseId === "dss") renderDssDossier(host);
  if (state.caseId === "shadowelf") renderShadowelfDossier(host);
  if (state.caseId === "vcl") renderVclDossier(host);
  if (state.caseId === "trojanslair") renderTrojanDossier(host);
  if (state.caseId === "demo") host.append(el("section", { class: "case-block" },
    el("h3", { text: "demo.exe — the engine's sanity check" }),
    el("p", { class: "prose", text: "A 63-byte MZ binary that lives in the repository. It exists so you can prove the whole pipeline (sniff → disassemble → decompile) works before asking the Wayback Machine for anything." }),
  ));
}

function renderRamrodDossier(host) {
  const R = RAMROD;
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `Rodger Ramrod `, el("small", { text: "· dossier" })),
    el("p", { class: "prose", text: R.whyItMatters }),
    el("dl", { class: "meta-dl" },
      el("dt", { text: "publisher" }), el("dd", { text: `${R.publisher} — ${R.team}` }),
      el("dt", { text: "released" }), el("dd", { text: `${R.released} · ${R.price}` }),
      el("dt", { text: "platform" }), el("dd", { text: R.platform }),
    ),
  ));
  host.append(renderHashTable("The three archive copies", [
    ["shareware ZIP (stream-only)", R.shareware, R.shareware.url],
    ["eXoDOS repack (fetchable)", R.exodos, R.exodos.fetchUrl],
    ["full game RAR (public domain mark)", R.full, R.full.url],
  ]));
  const man = el("table", { class: "hash-table" });
  man.append(el("thead", {}, el("tr", {}, el("th", { text: "file" }), el("th", { text: "size" }), el("th", { text: "role" }))));
  const tb = el("tbody");
  for (const m of R.manifest) tb.append(el("tr", {},
    el("td", { text: m.file }), el("td", { text: fmtBytes(m.bytes) }), el("td", { text: m.role })));
  man.append(tb);
  host.append(el("section", { class: "case-block" }, el("h3", { text: "Package manifest (src-62)" }), man));
  const rec = state.recovered.get("ramrod");
  if (rec) {
    const list = el("div", { class: "members" });
    for (const [name, bytes] of Object.entries(rec.members)) {
      const meta = sniff(bytes);
      list.append(el("button", {
        type: "button", class: "member-row",
        onclick: () => loadArtifact(name, bytes, `eXoDOS Rodger Ramrod (1996).zip · sha1 ✓`),
      },
        el("span", { class: "member-name", text: name }),
        el("span", { class: "member-meta", text: `${fmtBytes(bytes.length)} · ${meta.kind}` }),
      ));
    }
    host.append(el("section", { class: "case-block" }, el("h3", { text: "Recovered members" }), list));
  }
}

function renderDssDossier(host) {
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${DR7.name} `, el("small", { text: `· ${DR7.years}` })),
    el("p", { class: "prose", text: DR7.blurb }),
    el("p", { class: "panel-note", html:
      `Front page capture: <a target="_blank" rel="noreferrer" href="https://web.archive.org/web/19981201185215/http://www.dr7.com/">DR7 DSS Digital Corruption, Dec 1 1998</a> — ` +
      `"Digital Satellite Info You Can Trust!"` }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${HACKHU.name} `, el("small", { text: `· ${HACKHU.years}` })),
    el("p", { class: "prose", text: HACKHU.blurb }),
    el("p", { class: "prose dim", text: HACKHU.url_note }),
    el("p", { class: "panel-note", html:
      `Front page capture: <a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20001019055513/http://www.hackhu.com/">HackHu, Oct 19 2000</a>` }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${DIRT.name} `, el("small", { text: `· ${DIRT.vendor} · ${DIRT.years}` })),
    el("p", { class: "prose", text: DIRT.blurb }),
  ));
  const t = el("table", { class: "hash-table" });
  t.append(el("thead", {}, el("tr", {}, el("th", { text: "cryptome file" }), el("th", { text: "what" }), el("th", { text: "wayback status" }))));
  const tb = el("tbody");
  for (const f of DIRT.cryptome) {
    tb.append(el("tr", {},
      el("td", {}, el("a", { href: f.url, target: "_blank", rel: "noreferrer", text: f.file })),
      el("td", { text: f.desc }),
      el("td", { text: f.wayback }),
    ));
  }
  t.append(tb);
  host.append(el("section", { class: "case-block" }, t,
    el("p", { class: "prose dim", text: DIRT.verdict })));
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${SATMURACH.name} `, el("small", { text: "· checked" })),
    el("p", { class: "prose", text: SATMURACH.blurb }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${WARRICK.name} `, el("small", { text: "· the recovery tool this mode salutes" })),
    el("p", { class: "prose", text: WARRICK.blurb }),
    el("p", { class: "panel-note", html: `<a target="_blank" rel="noreferrer" href="${WARRICK.url}">${WARRICK.url}</a>` }),
  ));
}

function renderShadowelfDossier(host) {
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${SHADOWELF.name} `, el("small", { text: `· ${SHADOWELF.years}` })),
    el("p", { class: "prose", text: SHADOWELF.blurb }),
    el("p", { class: "panel-note", html:
      `Splash capture: <a target="_blank" rel="noreferrer" href="https://web.archive.org/web/19990204033556/${esc(SHADOWELF.url)}">Feb 4, 1999</a> · ` +
      `<a target="_blank" rel="noreferrer" href="https://web.archive.org/web/19990209044842/${esc(SHADOWELF.url)}intro.htm">intro.htm</a> · ` +
      `<a target="_blank" rel="noreferrer" href="https://web.archive.org/web/19991008031725/${esc(SHADOWELF.url)}sites.htm">sites.htm</a>` }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "What survives" }),
    el("p", { class: "prose", text:
      "Twelve HTML pages, nine images, five MIDIs and one Flash movie still answer " +
      "200-OK — 27 files, each pinned above with the CDX SHA-1 taken at catalog " +
      "time. The GeoCities toolbar-era view captures carry Yahoo's watermark " +
      "javascript; the raw id_ mementos this lab fetches are the original bytes, " +
      "which is exactly why the digest gate matches." }),
    el("p", { class: "prose", text:
      "The capture record is lopsided the way GeoCities always is: the crawl hit " +
      "the HTML first (Feb 1999), came back for the images and MIDIs in 2000, and " +
      "kept photographing the front page until 2009 — long after the elf stopped " +
      "updating. Recovery order doesn't matter; each file verifies on its own." }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "Why it's in this lab" }),
    el("p", { class: "prose", text:
      "Because the method has to be general. The same SHA-1 gate that reassembles " +
      "kr0me corp's virus archive and dr7.com's card depot reassembles a 1999 " +
      "GeoCities homepage: query the CDX for a digest, fetch the id_ memento, hash it, display " +
      "any mismatch. GeoCities closed in 2009 and took millions of pages with it; " +
      "this one came back. That's the whole thesis of the lab, demonstrated on the " +
      "archivist's own address." }),
  ));
}

function renderVclDossier(host) {
  const V = VXHEAVENS;
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${V.name} `, el("small", { text: `· ${V.years}` })),
    el("p", { class: "prose", text: V.blurb }),
    el("p", { class: "panel-note", html:
      `Shelf page: <a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20141010043629/http://vxheavens.com/vx.php?id=tv03">Virus Creation Lab (tv03), Oct 10 2014</a> · ` +
      `<a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20101129093503/http://vxheavens.com/vx.php?id=tidx">Constructors index (200 tools)</a> · ` +
      `<a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20141010092440/http://vxheavens.com/vl.php?dir=Virus.DOS.VCL">216 VCL-made samples</a> · ` +
      `<a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20030128200211/http://www.textfiles.com/virus/DOCUMENTATION/vcl.txt">VCL.DOC via textfiles</a>` }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "What the shelf page says" }),
    el("p", { class: "prose", text: V.shelfNote }),
  ));
  const man = el("table", { class: "hash-table" });
  man.append(el("thead", {}, el("tr", {}, el("th", { text: "file" }), el("th", { text: "role per VCL.DOC" }))));
  const tb = el("tbody");
  for (const [file, role] of V.manifest) tb.append(el("tr", {}, el("td", { text: file }), el("td", { text: role })));
  man.append(tb);
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "Inside vcl.zip (expected — compare after recovery)" }), man));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "Why it's in this lab" }),
    el("p", { class: "prose", text:
      "The main lab's timeline runs MtE (1991) → PS-MPC/G2 kits (1993); VCL " +
      "is the missing 1992 link — the first constructor with a commercial-grade " +
      "face, and the one whose output the scanners ate for breakfast. VCL.EXE " +
      "itself is the prize for the decompiler: 16-bit Borland C++ with a " +
      "self-check that wipes the program if its data files are altered. Static " +
      "analysis only, as ever — the gate verifies, Ghidra reads, nothing runs." }),
    el("p", { class: "prose dim", text: V.caveat }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `The trojanlair lead `, el("small", { text: "· UNCONFIRMED" })),
    el("p", { class: "prose", text: TROJANLAIR.lead }),
  ));
  const ul = el("ul", { class: "ref-list" });
  for (const c of TROJANLAIR.checked) ul.append(el("li", { text: c }));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "Places checked" }), ul,
    el("p", { class: "prose dim", text: TROJANLAIR.verdict })));
}

function renderTrojanDossier(host) {
  const T = TROJANSLAIR;
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `${T.name} `, el("small", { text: `· ${T.years}` })),
    el("p", { class: "prose", text: T.blurb }),
    el("p", { class: "panel-note", html:
      `Splash: <a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20000815070027/http://www.tlsecurity.net/">TL Security, Aug 15 2000</a> · ` +
      `Doorway: <a target="_blank" rel="noreferrer" href="https://web.archive.org/web/20001119090300/http://www.trojanslair.com/">trojanslair.com, Nov 19 2000</a> · ` +
      `<a target="_blank" rel="noreferrer" href="https://web.archive.org/cdx/search/cdx?url=tlsecurity.net/*&output=json&collapse=urlkey&filter=statuscode:200">CDX shelf listing</a>` }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "The shelves" }),
    el("p", { class: "prose", text: T.shelves }),
  ));
  host.append(el("section", { class: "case-block" },
    el("h3", { text: "Twelve builds for Ghidra" }),
    el("p", { class: "prose", text:
      "The pinned executables run from a 1.5 KB IIS denial-of-service to the " +
      "2.9 MB SubSeven 2.2 — the full RAT shelf of 2000–2002. The BioNet 3.12 " +
      "unpacked build should decompile cleanest; the packed ones will show " +
      "high entropy and short listings instead of pretending. Either outcome " +
      "is the analysis: the sweep prints per-member verdicts, and anything " +
      "that fails the SHA-1 gate is excluded with its got/expected digests " +
      "on display." }),
    el("p", { class: "prose dim", text:
      "Static analysis only — these are live trojans of their era, and the " +
      "lab reads them the way it reads everything else: bytes in, " +
      "disassembly out, nothing executed, nothing re-hosted." }),
  ));
}

function renderHashTable(title, rows) {
  const t = el("table", { class: "hash-table" });
  t.append(el("thead", {}, el("tr", {}, el("th", { text: "copy" }), el("th", { text: "size" }), el("th", { text: "md5" }), el("th", { text: "sha1" }), el("th", { text: "crc32" }))));
  const tb = el("tbody");
  for (const [label, h, url] of rows) {
    tb.append(el("tr", {},
      el("td", {}, el("a", { href: url, target: "_blank", rel: "noreferrer", text: label })),
      el("td", { text: fmtBytes(h.bytes) }),
      el("td", { class: "mono", text: h.md5 }),
      el("td", { class: "mono", text: h.sha1 }),
      el("td", { class: "mono", text: h.crc32 }),
    ));
  }
  t.append(tb);
  return el("section", { class: "case-block" }, el("h3", { text: title }), t);
}

function renderKromeDossier(host) {
  host.append(el("section", { class: "case-block" },
    el("h3", {}, `kr0me corp `, el("small", { text: `· ${SITE.years} · ${SITE.operator}` })),
    el("p", { class: "prose", text: SITE.blurb }),
    el("p", { class: "prose dim", text: SITE.copyright }),
    el("p", { class: "panel-note", html:
      `Index capture: <a target="_blank" rel="noreferrer" href="${waybackView("", SITE.pages.index.ts)}">${SITE.pages.index.title}</a> · ` +
      `Catalogue: <a target="_blank" rel="noreferrer" href="${waybackView("files.html", SITE.pages.files.ts)}">${SITE.pages.files.title}</a>` }),
  ));

  host.append(el("section", { class: "case-block" },
    el("h3", {}, "The hidden riddle ", el("small", { text: `· ${RIDDLE.page} · ${shortDate(RIDDLE.ts)}` })),
    el("p", { class: "prose", text: RIDDLE.preamble }),
    el("blockquote", { class: "riddle" },
      ...RIDDLE.text.map((l) => el("div", { text: l })),
      el("div", { class: "riddle-footer", text: `— ${RIDDLE.footer}` })),
    el("p", { class: "prose dim", text: `Hint given: "${RIDDLE.hint}" · pointer: ${RIDDLE.pointer}` }),
    el("p", { class: "prose", text: RIDDLE.reading }),
    el("p", { class: "prose dim", text: RIDDLE.trail }),
  ));

  const curated = LIBRARY.filter((e) => CURATED[e.name]);
  const grid = el("div", { class: "res-list" });
  for (const e of curated) {
    const c = CURATED[e.name];
    grid.append(el("div", { class: "res-card" },
      el("b", { text: e.name }),
      el("span", { class: "tag", text: c.tag }),
      el("p", { text: c.body }),
    ));
  }
  host.append(el("section", { class: "case-block" }, el("h3", { text: "Tools worth a Ghidra session" }), grid));
  const never = el("ul", { class: "ref-list" });
  for (const n of NOT_CAPTURED) never.append(el("li", {}, el("b", { text: n.name }), ` — ${n.desc}. ${n.note}.`));
  host.append(el("section", { class: "case-block" }, el("h3", { text: "Linked but never captured" }), never));
}

function renderResearch() {
  const host = $("researchBody");
  host.textContent = "";
  for (const m of METHOD) host.append(el("section", { class: "case-block" }, el("h3", { text: m.h }), el("p", { class: "prose", text: m.p })));
  const ul = el("ul", { class: "ref-list" });
  for (const r of REFERENCES) ul.append(el("li", {}, el("a", { href: r.url, target: "_blank", rel: "noreferrer", text: r.label })));
  host.append(el("section", { class: "case-block" }, el("h3", { text: "References" }), ul));
}

/* ------------------------------------------------------------------- tabs */

const TABS = ["dossier", "listing", "c", "hex", "research"];

function showTab(id) {
  document.querySelectorAll(".tab[data-view]").forEach((t) => t.classList.toggle("on", t.dataset.view === id));
  document.querySelectorAll(".view[data-view]").forEach((v) => { v.hidden = v.dataset.view !== id; });
}

/* -------------------------------------------------------------- drop zone */

function wireDrop() {
  const input = $("fileInput");
  input.addEventListener("change", async () => {
    for (const file of input.files) await ingestLocal(file);
    input.value = "";
  });
}

async function ingestLocal(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    let members;
    try { members = unzipSync(bytes); } catch (err) { logTo(`${file.name}: not a zip we can open (${err.message})`, "error"); return; }
    state.caseId = state.caseId || "local";
    const names = Object.keys(members);
    logTo(`${file.name} — ${names.length} members, local drop (not hash-verified)`, "info");
    const pick = names.filter((n) => /\.(exe|com|sys|ovl)$/i.test(n));
    openLocalPicker(file.name, members, pick);
  } else {
    loadArtifact(file.name, bytes, "local drop (not hash-verified)");
  }
}

function openLocalPicker(zipName, members, suggested) {
  const host = $("dossierBody");
  const block = el("section", { class: "case-block" },
    el("h3", { text: `${zipName} — ${Object.keys(members).length} members` }),
    el("p", { class: "panel-note", text: suggested.length ? `Executables: ${suggested.slice(0, 12).join(", ")}` : "No .exe/.com names detected — pick any member:" }));
  const list = el("div", { class: "members" });
  const order = [...suggested, ...Object.keys(members).filter((n) => !suggested.includes(n))];
  for (const name of order.slice(0, 200)) {
    const bytes = members[name];
    const meta = sniff(bytes);
    list.append(el("button", {
      type: "button", class: "member-row" + (suggested.includes(name) ? " suggested" : ""),
      onclick: () => loadArtifact(`${zipName}!/${name}`, bytes, "local drop (not hash-verified)"),
    },
      el("span", { class: "member-name", text: name }),
      el("span", { class: "member-meta", text: `${fmtBytes(bytes.length)} · ${meta.kind}` }),
    ));
  }
  block.append(list);
  host.prepend(block);
  showTab("dossier");
}

/* -------------------------------------------------------------- bootstrap */

async function loadDemo() {
  const res = await fetch("./demo.exe");
  return new Uint8Array(await res.arrayBuffer());
}

async function init() {
  renderResearch();
  wireDrop();

  // case buttons
  for (const [id, c] of Object.entries(CASES)) {
    $("caseList").append(el("button", { type: "button", class: "cat-item", "data-case": id, onclick: () => selectCase(id) },
      el("span", { class: "cat-name", text: c.title }),
      el("span", { class: "cat-kind", text: c.sub }),
      el("span", { class: "cat-note", text: c.chip }),
    ));
  }

  // engine
  state.engine = new GhidraWasm({
    log: (m, lvl) => { if (lvl === "ok" || lvl === "error") logTo(m, lvl); },
  });
  logTo("loading ghidra decompiler wasm …");
  try {
    await state.engine.load();
    state.engineState = "ready";
    $("engineChip").textContent = "GHIDRA WASM · ready";
    logTo(`engine ready · ${state.engine.languages.map((l) => l.id).join(", ")}`, "ok");
  } catch (err) {
    state.engineState = "failed";
    $("engineChip").textContent = "GHIDRA WASM · failed";
    logTo(`engine failed: ${err.message}`, "error");
  }

  rebuildCompilerSelect();
  for (const l of state.engine.languages) $("langSelect").append(el("option", { value: l.id, text: l.id }));
  $("langSelect").value = state.lang;
  rebuildCompilerSelect();
  $("langSelect").addEventListener("change", (e) => { state.lang = e.target.value; rebuildCompilerSelect(); });
  $("compSelect").addEventListener("change", (e) => { state.compiler = e.target.value; });

  $("decompileNow").addEventListener("click", () => {
    const v = $("funcInput").value.trim();
    if (isHexAddr(v)) decompileAt(Number.parseInt(v, 16));
  });
  $("funcInput").addEventListener("keydown", (e) => { if (e.key === "Enter") $("decompileNow").click(); });
  $("funcSelect").addEventListener("change", (e) => { if (e.target.value) decompileAt(Number.parseInt(e.target.value, 16)); });
  $("copyC").addEventListener("click", async () => {
    const text = $("cOut").textContent;
    try { await navigator.clipboard.writeText(text); $("cStatus").textContent = "copied"; } catch { /* ignore */ }
  });
  $("exportListing").addEventListener("click", () => {
    const art = state.artifact;
    if (!art?.analysis) return;
    const lines = [`; ${art.name} — ${art.meta.note || art.meta.kind}`, `; ${art.provenance || "no provenance"}\n`];
    for (const addr of art.analysis.order) {
      const insn = art.analysis.insns.get(addr);
      lines.push(`${addr.toString(16).padStart(8, "0")}  ${insn.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(20)} ${insn.repr}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = el("a", { href: URL.createObjectURL(blob), download: `${art.name.replace(/[^\w.-]+/g, "_")}.asm` });
    document.body.append(a); a.click(); a.remove();
  });

  document.querySelectorAll(".tab[data-view]").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.view)));

  // demo binary (also enables offline sanity checking)
  try {
    DEMO_BYTES = await loadDemo();
  } catch { /* offline file:// — the drop zone still works */ }

  logTo("CASEFILES ready — pick a case.");
  selectCase("krome");
}

init();
