/**
 * viruslab.js — Ghidra WASM lab controller.
 *
 * Pipeline for a sample:
 *   fetch bytes → js/x86dis.js linear sweep + recursive descent → technique map
 *   → symbols → js/ghidra-wasm.js decompiles any address with real SLEIGH specs.
 *
 * The disassembler is ours (verified against objdump); the decompiler is
 * Ghidra's, compiled to WebAssembly.  Neither of them executes the sample.
 */

import { analyze, bootSectorInfo, entropyWindows, extractTechniques, mnemonicHistogram, renderListing as listingText, stringsIn, hex } from "./x86dis.js";
import { GhidraWasm } from "./ghidra-wasm.js";
import { SAMPLES, TIMELINE, LESSONS, REFERENCES, ANALYZABLE } from "./virus-catalog.js";

const $ = (id) => document.getElementById(id);
const isHexAddr = (s) => /^(0x)?[0-9a-f]+$/i.test(s.trim());

const state = {
  sample: null,
  bytes: null,
  analysis: null,
  techniques: null,
  symbols: [],
  labels: new Map(),
  ghidra: null,
  ghidraState: "loading",
  selectedAddr: null,
  sourceMode: "masm",
  userBase: 0x100,
  userLang: "x86:LE:16:Real Mode",
  userCompiler: null,
  userMode: 16,
  sourceText: null,
  sourceAlt: null,
};

/* --------------------------------------------------------------- DOM helpers */

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

const bytesToHexDump = (bytes, base, perLine = 16) => {
  const lines = [];
  for (let off = 0; off < bytes.length; off += perLine) {
    const slice = bytes.subarray(off, off + perLine);
    const addr = (base + off).toString(16).padStart(8, "0");
    const hexPart = [...slice].map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(perLine * 3 - 1);
    const ascii = [...slice].map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push({ addr, hexPart, ascii });
  }
  return lines;
};

/* ------------------------------------------------------------- C highlighter */

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
    else if (tok.startsWith("uRam") || tok.startsWith("iRam") || tok.startsWith("xRam")) out.push(`<span class="c-mem">${esc(tok)}</span>`);
    else if (tok.startsWith("uVar") || tok.startsWith("iVar") || tok.startsWith("bVar") || tok.startsWith("pcVar") || tok.startsWith("cVar")) out.push(`<span class="c-var">${esc(tok)}</span>`);
    else out.push(esc(tok));
    last = re.lastIndex;
  }
  out.push(esc(src.slice(last)));
  return out.join("");
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ------------------------------------------------------------- asm highlighting */

const ASM_FLOW = /^(j|loop|call|ret|int|iret|hlt)/;

function asmTokens(text) {
  const m = text.match(/^(\S+)(\s*)(.*)$/);
  if (!m) return esc(text);
  const [, mnem, gap, ops] = m;
  const cls = mnem === "db" ? "a-data" : ASM_FLOW.test(mnem) ? "a-flow" : mnem === "int" ? "a-int" : "";
  return `<span class="a-mnem ${cls}">${esc(mnem)}</span>${esc(gap)}${esc(ops)}`;
}

/* ---------------------------------------------------------------- catalog UI */

function renderCatalog() {
  const host = $("catalogList");
  host.textContent = "";
  const groups = [
    { title: "reassembled — full analysis", items: SAMPLES.filter((s) => s.binary) },
    {
      title: "source only — no bytes attached",
      items: SAMPLES.filter((s) => !s.binary),
      note: "These ship as late-80s MASM/TASM/386 source. The reference disassembler and the decompiler need a binary image, so these entries open in the SOURCE and TECHNIQUES views only.",
    },
  ];
  for (const group of groups) {
    host.append(el("div", { class: "cat-group", text: group.title }));
    if (group.note) host.append(el("p", { class: "cat-note", text: group.note }));
    for (const s of group.items) {
      const btn = el("button", {
        type: "button",
        class: `cat-item${state.sample?.id === s.id ? " on" : ""}${s.binary ? "" : " src-only"}`,
        onclick: () => selectSample(s.id),
      },
        el("span", { class: "cat-name", text: s.name }),
        el("span", { class: "cat-kind", text: s.kind.replace("-", " ") }),
      );
      host.append(btn);
    }
  }
}

/* ------------------------------------------------------------------ selection */

async function selectSample(id) {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) return;
  state.sample = sample;
  state.selectedAddr = null;
  state.sourceMode = "masm";
  renderCatalog();
  showView(sample.binary ? "listing" : "source");

  if (!sample.binary) {
    state.bytes = null;
    state.analysis = null;
    state.techniques = null;
    state.symbols = [];
    state.labels = new Map();
    renderEmptyAnalysis(sample);
    await loadSource(sample);
    renderSource();
    renderTechniques();
    return;
  }

  $("loading").hidden = false;
  $("loading").textContent = `loading ${sample.binary} …`;
  let failed = false;
  try {
    const res = await fetch(sample.binary);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    loadBytes(bytes, {
      base: Number.parseInt(sample.base, 16),
      entry: Number.parseInt(sample.entry, 16),
      mode: 16,
      sample,
    });
    await loadSource(sample);
    renderAll();
  } catch (err) {
    $("loading").textContent = `could not load ${sample.binary}: ${err.message}`;
    failed = true;
    return;
  } finally {
    if (!failed) $("loading").hidden = true;
  }
}

/** Run the static pipeline over a byte range (sample or user-supplied file). */
function loadBytes(bytes, { base, entry, mode, sample = null }) {
  const boot = bytes.length === 512 ? bootSectorInfo(bytes) : null;
  const dataRanges = [];
  if (boot && boot.magic) dataRanges.push([0x1be, 0x200]);
  const analysis = analyze(bytes, { base, mode, entries: [entry], dataRanges });
  state.bytes = bytes;
  state.analysis = analysis;
  state.techniques = extractTechniques(analysis);
  state.userMode = mode;

  const labels = new Map();
  if (sample) for (const a of sample.annotations || []) labels.set(Number.parseInt(a.addr, 16), a.label);
  state.labels = labels;
  state.symbols = buildSymbolList(analysis, sample);
  state.selectedAddr = entry;
}

function buildSymbolList(analysis, sample) {
  const out = [];
  const seen = new Set();
  for (const [addr, ref] of [...analysis.refs.entries()].sort((a, b) => a[0] - b[0])) {
    const insn = analysis.insns.get(addr);
    if (!insn || insn.data) continue;
    const named = state.labels.has(addr) || (sample?.annotations || []).find((a) => Number.parseInt(a.addr, 16) === addr);
    const label = state.labels.get(addr) || (named ? named.label : null);
    out.push({ addr, label: label || `loc_${addr.toString(16)}`, ref, named: !!label });
    seen.add(addr);
  }
  return out;
}

function renderEmptyAnalysis(sample) {
  $("listing").innerHTML = `<p class="placeholder">No machine code for this entry. <b>${esc(sample.name)}</b> ships as assembler source only — read it in the SOURCE tab, or assemble it yourself and use <b>LOAD BINARY</b>.</p>`;
  $("techTables").innerHTML = "";
  $("hexDump").textContent = "";
  $("entropyCanvas").hidden = true;
  $("symbolList").textContent = "";
  $("statLine").textContent = "—";
  setFunctionOptions([]);
  $("cOut").innerHTML = `<p class="placeholder">Nothing to decompile yet. Pick a reassembled sample or load your own binary.</p>`;
}

function renderAll() {
  renderStats();
  renderListing();
  renderSymbols();
  renderHex();
  renderTechniques();
  renderSource();
  setFunctionOptions(state.symbols);
  $("loading").hidden = true;
}

/* -------------------------------------------------------------------- stats */

function renderStats() {
  const a = state.analysis;
  const boot = state.bytes.length === 512 ? bootSectorInfo(state.bytes) : null;
  const insnCount = [...a.insns.values()].filter((i) => !i.data).length;
  const top = mnemonicHistogram(a).slice(0, 6).map(([m, n]) => `${m}·${n}`).join(" ");
  $("statLine").innerHTML = [
    `<b>${state.bytes.length}</b> bytes`,
    `base <b>${hex(a.base)}</b>`,
    `<b>${insnCount}</b> instructions`,
    `<b>${a.codeBytes}</b> code / <b>${a.dataBytes}</b> data`,
    boot ? `boot sector · magic ${boot.magic ? "55AA ✓" : "—"} · ${boot.partitions} partition entries` : "",
    `<span class="dim">${esc(top)}</span>`,
  ].filter(Boolean).join(" · ");
}

/* ------------------------------------------------------------------ listing */

function renderListing() {
  const host = $("listing");
  host.textContent = "";
  const a = state.analysis;
  if (!a) return renderEmptyAnalysis(state.sample || { name: "—" });
  const frag = document.createDocumentFragment();
  const targets = a.refs;
  const labelled = new Set();

  for (const addr of a.order) {
    const insn = a.insns.get(addr);
    const label = state.labels.get(addr);
    if (label || (targets.has(addr) && !insn.data)) {
      const name = label || `loc_${addr.toString(16)}`;
      labelled.add(name);
      frag.append(el("div", { class: `row label${label ? " named" : ""}` },
        el("span", { class: "addr" }),
        el("span", { class: "bytes" }),
        el("span", { class: "text", text: `${name}:` })));
    }
    const byteText = insn.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ");
    const row = el("div", {
      class: `row${insn.data ? " data" : ""}${state.selectedAddr === addr ? " sel" : ""}`,
      "data-addr": addr.toString(16),
      title: insn.data ? (insn.dataNote || "data") : `${insn.len} byte${insn.len > 1 ? "s" : ""}`,
    },
      el("span", { class: "addr", text: addr.toString(16).padStart(6, "0") }),
      el("span", { class: "bytes", text: byteText.slice(0, 23) }),
      el("span", { class: "text", html: asmTokens(insn.repr) }),
    );
    if (!insn.data) {
      row.classList.add("clickable");
      row.addEventListener("click", () => selectAddress(addr));
    }
    frag.append(row);
  }
  host.append(frag);
}

function renderSymbols() {
  const host = $("symbolList");
  host.textContent = "";
  if (!state.symbols.length) { host.append(el("p", { class: "placeholder", text: "no call targets recovered" })); return; }
  for (const s of state.symbols) {
    host.append(el("button", {
      type: "button",
      class: `sym${s.named ? " named" : ""}`,
      onclick: () => selectAddress(s.addr),
    },
      el("span", { class: "sym-name", text: s.label }),
      el("span", { class: "sym-ref", text: `c${s.ref.calls}·j${s.ref.jumps}` }),
    ));
  }
}

async function selectAddress(addr) {
  state.selectedAddr = addr;
  renderListing();
  const row = $("listing").querySelector(`.row[data-addr="${addr.toString(16)}"]`);
  if (row) row.scrollIntoView({ block: "center" });
  const sel = $("funcSelect");
  const opt = [...sel.options].find((o) => Number.parseInt(o.value, 16) === addr);
  if (opt) sel.value = opt.value; else sel.value = "";
  $("funcInput").value = "0x" + addr.toString(16);
  if (!state.bytes) return;
  if (state.ghidraState === "ready") { showView("c"); await decompileAt(addr); }
  else if (state.ghidraState === "loading") { showView("c"); $("cOut").innerHTML = `<p class="placeholder">waiting for the Ghidra wasm module…</p>`; }
}

/* ------------------------------------------------------------------ hex view */

function renderHex() {
  if (!state.bytes) return;
  const lines = bytesToHexDump(state.bytes, state.analysis.base);
  $("hexDump").innerHTML = lines.map((l) =>
    `<span class="hl"><i>${l.addr}</i>  ${esc(l.hexPart)}  <em>${esc(l.ascii)}</em></span>`
  ).join("\n");

  const windows = entropyWindows(state.bytes, 32);
  const canvas = $("entropyCanvas");
  canvas.hidden = false;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  const h = canvas.height = 120 * (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);
  const barW = w / windows.length;
  windows.forEach((win, i) => {
    const frac = win.entropy / 8;
    ctx.fillStyle = frac > 0.75 ? "#ff8d9c" : frac > 0.55 ? "#f6c574" : "#76e6b1";
    ctx.globalAlpha = 0.35 + frac * 0.5;
    ctx.fillRect(i * barW, h - frac * h, Math.max(1, barW - 1), frac * h);
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(144,158,209,0.3)";
  ctx.beginPath(); ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25); ctx.stroke();

  const strs = stringsIn(state.bytes, 5);
  $("stringList").innerHTML = strs.length
    ? strs.map((s) => `<span class="hl"><i>${s.off.toString(16).padStart(4, "0")}</i> ${esc(s.text)}</span>`).join("\n")
    : "<p class='placeholder'>no printable runs of 5+ characters</p>";
}

/* -------------------------------------------------------------- techniques */

function renderTechniques() {
  const host = $("techTables");
  host.textContent = "";
  const s = state.sample;
  if (!s) return;

  const card = (title, note, body, cls = "") => el("section", { class: `tech-card ${cls}` },
    el("h3", { text: title }),
    note ? el("p", { class: "tech-note", text: note }) : null,
    body);

  // authored narrative
  if (s.narrative?.length) {
    host.append(card("Execution narrative", "Reconstructed by reading the source; the lab never runs the sample.",
      el("ol", { class: "narr" }, ...s.narrative.map((line) => el("li", { text: line })))));
  }

  if (!state.analysis) {
    if (s.techniques?.length) {
      host.append(card("Techniques", null, el("ul", { class: "tech-list" }, ...s.techniques.map((t) => el("li", { text: t })))));
    }
    if (s.whyItMatters) host.append(card("Why it matters", null, el("p", { class: "prose", text: s.whyItMatters })));
    return;
  }

  const t = state.techniques;
  const cellNode = (cell, i) => el("td", {
    html: i === 0 && typeof cell === "string" ? cell : esc(String(cell)),
  });
  const table = (cols, rows, empty) => {
    if (!rows.length) return el("p", { class: "placeholder", text: empty });
    const thead = el("thead", {}, el("tr", {}, ...cols.map((c) => el("th", { text: c }))));
    const tbody = el("tbody", {}, ...rows.map((r) => el("tr", {}, ...r.map(cellNode))));
    return el("div", { class: "table-wrap" }, el("table", { class: "tech-table" }, thead, tbody));
  };

  host.append(card("Interrupts called", "AH/function recovery is a heuristic: the lab looks back up to 14 instructions in the same block for `mov ah, N`.",
    table(["addr", "service", "ah", "resolved function"],
      t.ints.map((i) => [`<button class="link" data-addr="${i.addr.toString(16)}">${i.addr.toString(16)}</button>`, i.name, i.ah === null ? "?" : "0x" + i.ah.toString(16).padStart(2, "0"), i.service || "—"]),
      "no interrupt calls found")));

  host.append(card("Interrupt vector writes", "Writes below 0x400 target the real-mode IVT (four bytes per vector: low word offset, high word segment). These are only attributed after the lab has seen DS set to a known value, so a `mov [0x4c], ax` with DS=0 counts and the same instruction with unknown DS does not.", table(["addr", "vector", "slot", "value"], t.hooks.map((h) => [`<button class="link" data-addr="${h.addr.toString(16)}">${h.addr.toString(16)}</button>`, h.name, h.half, h.value]), "no direct IVT writes in this image")));

  host.append(card("Interrupt vector reads", "Reading the old handler out of the IVT is how a hooking virus keeps a pointer to the BIOS/DOS original so it can chain to it later.", table(["addr", "vector", "slot", "into"], t.ivtReads.map((h) => [`<button class="link" data-addr="${h.addr.toString(16)}">${h.addr.toString(16)}</button>`, h.name, h.half, h.target || "—"]), "no IVT reads detected")));

  host.append(card("BIOS data area", "Absolute addresses between 0x400 and 0x500 are the BIOS data area rather than the IVT. 0x413 is the base-memory size in KB — a resident virus decrements it to shrink DOS's idea of installed RAM and then hides in the gap.", table(["addr", "cell", "rw", "value", "note"], [
    ...t.biosReads.map((w) => [`<button class="link" data-addr="${w.addr.toString(16)}">${w.addr.toString(16)}</button>`, "0x" + w.disp.toString(16), "read", "—", w.note]),
    ...t.biosWrites.map((w) => [`<button class="link" data-addr="${w.addr.toString(16)}">${w.addr.toString(16)}</button>`, "0x" + w.disp.toString(16), "write", String(w.value), w.note]),
  ], "no BIOS data area access in this image")));

  const labelAt = (addr) => state.labels.get(addr) || null;
  host.append(card("Writes to its own image", "Stores the lab has resolved into the sample's own address space, because DS was known to point at the image (CS) or at linear zero with the image living at 0x7C00. `resolves to` is the address in this listing's numbering.", table(["addr", "writes", "value", "resolves to"], t.internalWrites.map((w) => {
    const name = typeof w.resolved === "number" ? labelAt(w.resolved) : null;
    const at = typeof w.resolved === "number" ? `0x${w.resolved.toString(16)}` : "—";
    return [`<button class="link" data-addr="${w.addr.toString(16)}">${w.addr.toString(16)}</button>`, `${w.mnem} ${w.size === 1 ? "byte" : "word"}`, String(w.value), name ? `<b>${esc(name)}</b> <span class="dim">${at}</span>` : at];
  }), "no self-writes detected")));

  host.append(card("Absolute stores outside the IVT and BDA", "Writes to absolute addresses past the BIOS data area with a known zero-based DS — for a boot-sector virus that means the loader region or its own relocated copy.", table(["addr", "writes", "value", "absolute address"], t.absoluteWrites.map((w) => [`<button class="link" data-addr="${w.addr.toString(16)}">${w.addr.toString(16)}</button>`, `${w.mnem} ${w.size === 1 ? "byte" : "word"}`, String(w.value), "0x" + w.resolved.toString(16)]), "none")));

  host.append(card("Bulk memory moves", "Block copies are how these samples relocate themselves out of the boot buffer or append their body to a host file.", table(["addr", "instruction"], t.bulkWrites.map((b) => [`<button class="link" data-addr="${b.addr.toString(16)}">${b.addr.toString(16)}</button>`, b.text]), "no block moves in this image")));

  if (t.unresolved.length) {
    host.append(card("Stores the lab declines to attribute", "These are real stores, but DS/ES was unknown at that point, so claiming a target would be guesswork. Treat them as \"address unknown\", not as \"no target\".", table(["addr", "instruction", "segment", "displacement"], t.unresolved.map((w) => [`<button class="link" data-addr="${w.addr.toString(16)}">${w.addr.toString(16)}</button>`, w.mnem, w.seg || "?", "0x" + w.disp.toString(16)]), "none"), "tech-card-caveat"));
  }

  host.append(card("Sample metadata", null, el("dl", { class: "meta-dl" },
    ...[["file", s.binary || s.source], ["size", `${state.bytes.length} bytes`], ["load address", hex(state.analysis.base)],
        ["entry", s.entry || hex(state.analysis.base)], ["language", s.lang], ["era", s.era], ["family", s.family],
        ["signature", s.signature || "—"], ["origin", s.origin]]
      .flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { html: /^https?:/.test(v) ? `<a href="${esc(v)}" target="_blank" rel="noreferrer">${esc(v)}</a>` : esc(String(v)) })]))));

  if (s.techniques?.length) {
    host.append(card("Techniques observed", null, el("ul", { class: "tech-list" }, ...s.techniques.map((x) => el("li", { text: x })))));
  }
  if (s.whyItMatters) host.append(card("Why it matters", null, el("p", { class: "prose", text: s.whyItMatters })));
  if (s.refs?.length) host.append(card("References", null, el("ul", { class: "ref-list" },
    ...s.refs.map((r) => el("li", {}, el("a", { href: r.url, target: "_blank", rel: "noreferrer", text: r.label }))))));

  host.querySelectorAll("button.link").forEach((b) => b.addEventListener("click", () => {
    const addr = Number.parseInt(b.dataset.addr, 16);
    showView("listing");
    selectAddress(addr);
  }));
}

/* ------------------------------------------------------------------- source */

async function loadSource(sample) {
  if (!sample?.source) { state.sourceText = null; return; }
  try {
    const res = await fetch(sample.source);
    state.sourceText = res.ok ? await res.text() : null;
  } catch { state.sourceText = null; }
  state.sourceAlt = null;
  if (state.sourceMode === "gas" && state.sample?.assembled) {
    try {
      const res = await fetch(state.sample.assembled);
      state.sourceAlt = res.ok ? await res.text() : null;
    } catch { state.sourceAlt = null; }
  }
}

async function renderSource() {
  const host = $("sourceOut");
  const s = state.sample;
  host.textContent = "";
  if (!s) return;

  const bar = $("sourceBar");
  bar.textContent = "";
  if (s.assembled) {
    const makeBtn = (mode, label) => el("button", {
      type: "button", class: `mini${state.sourceMode === mode ? " on" : ""}`, text: label,
      onclick: async () => { state.sourceMode = mode; await loadSource(s); await renderSource(); },
    });
    bar.append(el("span", { class: "mini-note", text: "source" }), makeBtn("masm", "original (MASM/TASM)"), makeBtn("gas", "reassembly input (GNU as)"));
    bar.append(el("span", { class: "mini-note dim", text: s.origin }));
  } else if (s.origin) {
    bar.append(el("span", { class: "mini-note dim", text: s.origin }));
  }

  const text = state.sourceMode === "gas" && state.sourceAlt ? state.sourceAlt : state.sourceText;
  if (!text) { host.innerHTML = `<p class="placeholder">source not available</p>`; return; }

  if (state.sourceMode === "gas" && state.sourceAlt) {
    host.innerHTML = `<code class="src-gas">${highlightGas(state.sourceAlt)}</code>`;
    return;
  }

  // MASM/TASM source: link labels to their address in the listing when known.
  const addrFor = new Map();
  for (const [addr, name] of state.labels) addrFor.set(name, addr);
  const lines = text.split(/\r?\n/);
  host.innerHTML = lines.map((line) => {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):/);
    let inner = esc(line).replace(/(;.*)$/, '<span class="src-com">$1</span>');
    if (m && addrFor.has(m[1])) {
      const a = addrFor.get(m[1]);
      return `<span class="src-line linked" data-addr="${a.toString(16)}" title="jump to ${hex(a)}">${inner}</span>`;
    }
    return `<span class="src-line">${inner}</span>`;
  }).join("\n");

  host.querySelectorAll(".src-line.linked").forEach((node) => node.addEventListener("click", () => {
    showView("listing");
    selectAddress(Number.parseInt(node.dataset.addr, 16));
  }));
}

function highlightGas(src) {
  return src.split("\n").map((line) => {
    const stripped = line.replace(/;.*$/, "");
    const comment = line.slice(stripped.length);
    let out = esc(stripped);
    out = out.replace(/^(\s*)([A-Za-z_.][A-Za-z0-9_.]*)(:)/, '$1<span class="g-label">$2$3</span>');
    out = out.replace(/^(\s*)([a-z][a-z0-9]*)(\s)/, '$1<span class="g-mnem">$2</span>$3');
    out = out.replace(/(0x[0-9a-fA-F]+)/g, '<span class="g-num">$1</span>');
    out = out.replace(/\b(offset|byte ptr|word ptr|dword ptr)\b/g, '<span class="g-op">$1</span>');
    return `<span class="src-line">${out}${comment ? `<span class="src-com">${esc(comment)}</span>` : ""}</span>`;
  }).join("\n");
}

/* ------------------------------------------------------------------ ghidra */

function setFunctionOptions(symbols) {
  const sel = $("funcSelect");
  sel.textContent = "";
  const opts = [];
  if (state.analysis) opts.push({ addr: state.analysis.base, label: "entry", named: true });
  for (const s of symbols) opts.push(s);
  if (!opts.length) { sel.append(el("option", { value: "", text: "no functions" })); return; }
  for (const o of opts) {
    sel.append(el("option", { value: "0x" + o.addr.toString(16), text: `${o.label} @ 0x${o.addr.toString(16)}` }));
  }
}

async function decompileAt(addr) {
  if (!state.bytes) return;
  const sample = state.sample;
  const lang = sample?.binary ? sample.lang : state.userLang;
  const compiler = sample?.binary ? sample.compiler : state.userCompiler;
  const base = sample?.binary ? sample.base : "0x" + state.userBase.toString(16);
  const out = $("cOut");
  $("cStatus").textContent = "working…";
  try {
    const res = await state.ghidra.decompile(state.bytes, { lang, compiler, base, func: "0x" + addr.toString(16) });
    out.innerHTML = highlightC(res.text);
    $("cStatus").innerHTML = `<b>${res.text.split("\n").length}</b> lines in <b>${res.ms.toFixed(0)} ms</b> · <span class="dim">${esc(res.lang)} / ${esc(res.compiler)}</span>`;
  } catch (err) {
    out.innerHTML = `<p class="error">decompile failed: ${esc(err.message)}</p>`;
    $("cStatus").textContent = "error";
  }
}

async function decompileAll() {
  if (state.ghidraState !== "ready" || !state.bytes) return;
  const list = state.symbols.filter((s) => s.named).slice(0, 10);
  const targets = list.length ? list : state.symbols.slice(0, 6);
  const out = $("cOut");
  out.innerHTML = "";
  for (const s of targets) {
    const head = el("div", { class: "c-func-head" }, el("span", { text: `${s.label} @ 0x${s.addr.toString(16)}` }));
    out.append(head);
    const pre = el("pre", { class: "c-block" });
    out.append(pre);
    $("cStatus").textContent = `decompiling ${s.label}…`;
    try {
      const res = await state.ghidra.decompile(state.bytes, {
        lang: state.sample?.binary ? state.sample.lang : state.userLang,
        compiler: state.sample?.binary ? state.sample.compiler : state.userCompiler,
        base: state.sample?.binary ? state.sample.base : "0x" + state.userBase.toString(16),
        func: "0x" + s.addr.toString(16),
      });
      pre.innerHTML = highlightC(res.text);
      head.append(el("span", { class: "dim", text: ` · ${res.ms.toFixed(0)} ms` }));
    } catch (err) {
      pre.innerHTML = `<span class="error">${esc(err.message)}</span>`;
    }
  }
  $("cStatus").innerHTML = `<b>${targets.length}</b> functions · total wasm time <b>${state.ghidra.stats.ms.toFixed(0)} ms</b>`;
}

function setEngineState(kind, text) {
  state.ghidraState = kind;
  const chip = $("engineChip");
  chip.className = `engine-chip ${kind}`;
  chip.textContent = text;
  $("decompileAll").disabled = kind !== "ready";
  $("decompileNow").disabled = kind !== "ready";
}

async function bootGhidra() {
  const logHost = $("engineLog");
  const log = (msg, level = "info") => {
    if (level === "ghidra" && !msg.trim()) return;
    logHost.append(el("div", { class: `log-${level}`, text: msg }));
    logHost.scrollTop = logHost.scrollHeight;
  };
  setEngineState("loading", "GHIDRA WASM · loading");
  state.ghidra = new GhidraWasm({ log });
  log("vendored bundle: @mauricelam/ghidra-decompiler-wasm 0.0.4 (Apache-2.0)", "info");
  log(`languages shipped: ${["x86:LE:16:Real Mode", "x86:LE:32:default", "x86:LE:64:default"].join(", ")}`, "info");
  try {
    await state.ghidra.load();
    const langs = state.ghidra.languages.map((l) => l.id);
    $("langSelect").textContent = "";
    for (const id of langs) $("langSelect").append(el("option", { value: id, text: id, selected: id === "x86:LE:16:Real Mode" ? "" : null }));
    $("langSelect").value = "x86:LE:16:Real Mode";
    syncCompilerOptions();
    setEngineState("ready", "GHIDRA WASM · ready");
    log(`ready · ${langs.length} languages`, "ok");
  } catch (err) {
    setEngineState("error", "GHIDRA WASM · unavailable");
    log(`engine unavailable: ${err.message}`, "error");
    log("the disassembler, technique map and hex views are pure JavaScript and keep working without it", "info");
  }
}

function syncCompilerOptions() {
  const sel = $("langSelect");
  const comp = $("compSelect");
  comp.textContent = "";
  const lang = state.ghidra?.findLanguage(sel.value);
  if (!lang) return;
  for (const c of lang.compilers) comp.append(el("option", { value: c.id, text: c.name }));
  state.userLang = sel.value;
  state.userCompiler = lang.compilers[0].id;
  state.userMode = sel.value.includes(":64:") ? 32 : sel.value.includes(":32:") ? 32 : 16;
}

/* ---------------------------------------------------------------- research */

function renderResearch() {
  const host = $("researchBody");
  if (host.dataset.done) return;
  host.dataset.done = "1";

  host.append(el("section", { class: "res-card" },
    el("h3", { text: "The corpus: what the 1989–1995 DOS scene actually invented" }),
    el("p", { class: "prose", html: "Every entry in the sample list demonstrates a distinct primitive, and the primitives outlived the platform. Boot-sector relocation, IVT hooking, memory theft, delta-offset position independence, directory-sweep infection, self-decryption, debugger detection, timing side channels, and finally code generation — the polymorphic engine. Nothing in the last thirty years is conceptually new; it is the same list with better plumbing." }),
    el("ul", { class: "res-list" },
      el("li", { html: "<b>Boot path:</b> Michelangelo, Stoned, Kilroy, EXEBUG2, KS Test — today's UEFI bootkits and ESP implants." }),
      el("li", { html: "<b>File infection + residency:</b> Malmsey Habitat, Lezbo, Proto-3, Zippy — today's process injection and reflective DLL loading." }),
      el("li", { html: "<b>Signature evasion:</b> KS Test self-decryption, Proto-3 XOR, TPE v1.1→v1.3 — today's packers, crypters and RaaS builders." }),
      el("li", { html: "<b>Analyst countermeasures:</b> Anti-debug 1a–1e, DOS_7 — today's ptrace/ETW checks, VM detection and EDR killers." }),
      el("li", { html: "<b>Undocumented OS interfaces:</b> INT 2Eh in the companion demo, INT 0/3/8 abuse — today's unhooked syscalls and direct kernel object manipulation." }))));

  host.append(el("section", { class: "res-card" },
    el("h3", { text: "Timeline: 1971 → today" }),
    el("p", { class: "prose dim", text: "Selected milestones. Damage figures are the widely-cited estimates and vary a lot between sources — treat them as order-of-magnitude, not audited numbers." }),
    el("div", { class: "timeline" }, ...TIMELINE.map((t) => el("div", { class: "tl-item" },
      el("div", { class: "tl-year", text: String(t.year) }),
      el("div", { class: "tl-body" },
        el("div", { class: "tl-head" }, el("b", { text: t.name }), el("span", { class: "tl-tag", text: t.class })),
        el("div", { class: "tl-meta", text: t.platform }),
        el("p", { class: "tl-note", text: t.note })))))));

  host.append(el("section", { class: "res-card" },
    el("h3", { text: "What actually carries forward" }),
    el("div", { class: "lesson-grid" }, ...LESSONS.map((l) => el("article", { class: "lesson" },
      el("h4", { text: l.title }), el("p", { class: "prose", text: l.body }))))));

  host.append(el("section", { class: "res-card" },
    el("h3", { text: "Reading, sources and provenance" }),
    el("ul", { class: "ref-list" }, ...REFERENCES.map((r) => el("li", {}, el("a", { href: r.url, target: "_blank", rel: "noreferrer", text: r.label })))),
    el("p", { class: "prose dim", html: "Sample sources are reproduced from the public corpus at <a href=\"https://github.com/ksaj/Ontario1024\" target=\"_blank\" rel=\"noreferrer\">ksaj/Ontario1024</a> for study, with the author's own note that these are real early-90s samples and will not run on anything modern. The three reassembled binaries were rebuilt here from that source with GNU as (.code16); the originals were MASM/TASM and would not assemble anywhere in this pipeline. They are 16-bit real-mode code: without a BIOS, an IVT and a floppy controller they are inert data, and the lab only ever disassembles or decompiles them." })));
}

/* -------------------------------------------------------------------- views */

function showView(name) {
  for (const tab of document.querySelectorAll(".tab")) tab.classList.toggle("on", tab.dataset.view === name);
  for (const view of document.querySelectorAll(".view")) view.hidden = view.dataset.view !== name;
  if (name === "research") renderResearch();
  if (name === "hex" && state.analysis) requestAnimationFrame(renderHex);
}

/* --------------------------------------------------------------------- boot */

async function loadUserFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const baseStr = $("baseInput").value.trim();
  const base = baseStr.startsWith("0x") ? Number.parseInt(baseStr, 16) : Number.parseInt(baseStr, 10) || 0;
  state.userBase = base;
  state.sample = {
    id: "__user__",
    name: file.name,
    kind: "user upload",
    binary: null,
    source: null,
    origin: `local file · ${bytes.length} bytes`,
    base: "0x" + base.toString(16),
    entry: "0x" + base.toString(16),
    lang: state.userLang,
    compiler: state.userCompiler,
    summary: "Binary supplied from this machine. Nothing is uploaded anywhere: the bytes are read with FileReader and handed straight to the local wasm decompiler.",
  };
  loadBytes(bytes, { base, entry: base, mode: state.userMode, sample: null });
  // user uploads may be ELF/PE — let the bridge try to name the architecture
  if (state.ghidraState === "ready") {
    try {
      const guess = await state.ghidra.detect(bytes);
      if (guess && state.ghidra.findLanguage(guess)) {
        $("langSelect").value = guess;
        syncCompilerOptions();
        state.sample.lang = guess;
        state.sample.compiler = state.userCompiler;
        $("engineLog").append(el("div", { class: "log-ok", text: `detected architecture: ${guess}` }));
      }
    } catch { /* detection is best-effort */ }
  }
  renderCatalog();
  renderAll();
  showView("listing");
}

function exportListing() {
  if (!state.analysis) return;
  const text = listingText(state.analysis, state.labels);
  const blob = new Blob([`; ${state.sample?.name || "sample"} — listing from ghidra-lab.html\n; base ${hex(state.analysis.base)}\n\n${text}\n`], { type: "text/plain" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `${state.sample?.id || "sample"}.listing.asm` });
  a.click();
  URL.revokeObjectURL(a.href);
}

async function main() {
  renderCatalog();
  renderResearch();

  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));

  $("funcSelect").addEventListener("change", (e) => {
    const addr = Number.parseInt(e.target.value, 16);
    if (!Number.isNaN(addr)) { $("funcInput").value = e.target.value; selectAddress(addr); }
  });
  $("decompileNow").addEventListener("click", () => {
    const raw = $("funcInput").value.trim();
    const addr = isHexAddr(raw) ? Number.parseInt(raw, 16) : state.selectedAddr;
    if (addr !== null && addr !== undefined && !Number.isNaN(addr)) decompileAt(addr);
  });
  $("decompileAll").addEventListener("click", decompileAll);
  $("exportListing").addEventListener("click", exportListing);
  $("fileInput").addEventListener("change", (e) => { if (e.target.files[0]) loadUserFile(e.target.files[0]); });
  $("langSelect").addEventListener("change", syncCompilerOptions);
  $("copyC").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("cOut").innerText); $("copyC").textContent = "COPIED"; setTimeout(() => { $("copyC").textContent = "COPY"; }, 1200); } catch { /* clipboard blocked */ }
  });

  const params = new URLSearchParams(location.search);
  const wanted = params.get("sample") || params.get("s");
  const first = wanted && SAMPLES.some((s) => s.id === wanted) ? wanted : ANALYZABLE[0].id;
  await selectSample(first);
  bootGhidra();
}

main();
