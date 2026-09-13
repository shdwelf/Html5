/**
 * avr-lab.js — controller for avr-lab.html.
 *
 * Walks an Atmel AVR firmware image the way tools/ghidra_avr.mjs does: parse the
 * Intel HEX for real (checksums, record types, load address), decode every
 * instruction with js/avrdis.js, then follow control flow from the reset vector
 * to find out which of the image's self-programming (SPM) sites a redirect can
 * actually reach.
 *
 * The decoder is the same object the tools use, and it is checked
 * instruction-for-instruction against an avr-objdump listing that upstream
 * published (tools/verify_avrdis.mjs, 225/225 plus 78/78 resolved branch
 * targets). Nothing here is a second implementation, and nothing here is
 * decompiled to C: the vendored Ghidra-wasm bridge cannot do AVR8, which
 * `node tools/ghidra_avr.mjs … --probe` reproduces rather than hides.
 *
 * No network, no wasm: this is parsing and a control-flow walk.
 */

import { decode, disassemble, walkInfo, parseListing, parseSymbols } from "./avrdis.js";
import { parseIntelHex } from "./avrhex.js";

const $ = (id) => document.getElementById(id);

const SAMPLES = {
  optiboot: {
    label: "Optiboot 8.0",
    hex: "samples/avr/optiboot_atmega328.hex",
    lst: "samples/avr/optiboot_atmega328.lst",
    sha256: "a23cf7be63c6ad4ecb6f6bad86a07d45c5953ba1ab7da6cb0a41db593683ed5b",
  },
  micronucleus: {
    label: "Micronucleus 2.6",
    hex: "samples/avr/micronucleus_m328p_extclock.hex",
    lst: null,
    sha256: null,
  },
};

const SITE_MNEMONICS = ["spm", "lpm", "elpm", "wdr", "sleep", "break", "reti"];

// ------------------------------------------------------------------- analysis

/**
 * Decode and walk an image. Pure: no DOM, no fetching - the test drives this
 * directly with the vendored files, which is what makes the page's numbers
 * checkable.
 */
export function analyse(hexText, listingText = null) {
  let img;
  try {
    img = parseIntelHex(String(hexText || ""));
  } catch (err) {
    // parseIntelHex throws on input with no records at all; a text box is user
    // input, so the page reports it instead of dying on it.
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
  if (!img || img.bytes.length === 0) {
    return { ok: false, error: "no data records found — is this an Intel HEX file?" };
  }
  if (img.errors.length) {
    return { ok: false, error: `Intel HEX errors: ${img.errors.slice(0, 3).join("; ")}` };
  }

  const symbols = listingText ? parseSymbols(listingText) : new Map();
  const symbolAt = (addr) => {
    let best = null;
    for (const [a, name] of symbols) if (a <= addr && (best === null || a > best.addr)) best = { addr: a, name };
    return best ? (addr === best.addr ? best.name : `${best.name}+0x${(addr - best.addr).toString(16)}`) : null;
  };

  const flow = walkInfo(img.bytes, { base: img.base });
  const instructions = [...flow.ins.values()].map((i) => ({
    addr: i.addr,
    bytes: [...i.raw].map((b) => b.toString(16).padStart(2, "0")).join(" "),
    mnemonic: i.mnemonic,
    operands: i.operands,
    size: i.size,
    target: i.target ?? null,
    reachable: flow.reachable.has(i.addr),
    in: symbolAt(i.addr),
  }));

  const first = flow.ins.get(img.base) || null;
  const reset = first && (first.mnemonic === "rjmp" || first.mnemonic === "jmp") && first.target != null
    ? { kind: first.mnemonic, target: first.target, in: symbolAt(first.target) }
    : null;

  const sites = instructions.filter((i) => SITE_MNEMONICS.includes(i.mnemonic));
  const byMnemonic = new Map();
  for (const s of sites) {
    if (!byMnemonic.has(s.mnemonic)) byMnemonic.set(s.mnemonic, []);
    byMnemonic.get(s.mnemonic).push(s);
  }

  // A cross-check the page can make on its own: every target the walk follows
  // should land on a decoded instruction start. Not every bit pattern inside an
  // image is code, so this is a warning, not a stop.
  const stray = instructions.filter((i) => i.target != null && i.target >= img.base && i.target < img.max
    && !flow.ins.has(i.target));

  return {
    ok: true,
    base: img.base,
    max: img.max,
    bytes: img.bytes.length,
    words: img.bytes.length / 2,
    records: img.records,
    instructions,
    sites,
    byMnemonic,
    reset,
    symbols,
    strayTargets: stray,
    reachable: flow.reachable.size,
    total: flow.ins.size,
    entries: flow.entries.size,
  };
}

// ----------------------------------------------------------------- rendering

function row(table, cells, className = "") {
  const tr = document.createElement("tr");
  if (className) tr.className = className;
  for (const cell of cells) {
    const td = document.createElement("td");
    td.textContent = String(cell.text ?? cell);
    if (cell && cell.cls) td.className = cell.cls;
    tr.appendChild(td);
  }
  table.appendChild(tr);
  return tr;
}

function kv(table, key, value, cls = "") {
  const tr = row(table, [key, value]);
  if (cls) tr.className = cls;
  return tr;
}

let lastReport = null;

export function render(report) {
  lastReport = report;
  const status = $("status");
  const summary = $("summary");
  const sites = $("sites");
  const disasm = $("disasm");
  status.className = "verdict";
  status.textContent = "";
  summary.textContent = "";
  sites.textContent = "";
  disasm.textContent = "";

  if (!report || !report.ok) {
    status.className = "verdict bad";
    status.textContent = report && report.error ? report.error : "No image loaded yet — pick a sample above, or paste a .hex and press Analyse.";
    $("disasm-count").textContent = "";
    return;
  }

  status.className = "verdict good";
  status.textContent = `${report.total} instructions decoded · ${report.reachable} reachable from the reset vector`
    + (report.sites.length ? ` · ${report.sites.filter((s) => !s.reachable).length} dead self-programming site(s)` : "");

  kv(summary, "size", `${report.bytes} bytes (${report.words} words)`);
  kv(summary, "load address", `0x${report.base.toString(16)} … 0x${(report.max - 1).toString(16)}`);
  kv(summary, "records", `${report.records} Intel HEX records, checksums verified`);
  kv(summary, "reset vector", report.reset
    ? `${report.reset.kind} → 0x${report.reset.target.toString(16)}${report.reset.in ? ` (${report.reset.in})` : ""}`
    : "no rjmp/jmp at the image base");
  kv(summary, "control flow", `${report.reachable} of ${report.total} instructions reachable, ${report.entries} entry point(s)`);
  if (report.symbols.size) kv(summary, "symbols", `${report.symbols.size} from the avr-objdump listing`);
  if (report.strayTargets.length) {
    kv(summary, "warning", `${report.strayTargets.length} followed target(s) are not instruction starts`, "bad");
  }

  if (report.byMnemonic.size === 0) {
    kv(sites, "sites", "none of SPM/LPM/ELPM/WDR appear in this image");
  }
  for (const [mnemonic, list] of report.byMnemonic) {
    const live = list.filter((s) => s.reachable).length;
    kv(sites, mnemonic.toUpperCase(), `${list.length} site(s) — ${live} reachable, ${list.length - live} dead`,
      live === list.length ? "" : "bad");
    for (const s of list) {
      kv(sites, `  0x${s.addr.toString(16)}${s.in ? ` <${s.in}>` : ""}`,
        s.reachable ? "reachable from the reset vector" : "dead: no path from the reset vector or any conditional",
        s.reachable ? "" : "bad");
    }
  }

  const filter = $("filter-sites") ? $("filter-sites").value : "all";
  const shown = report.instructions.filter((i) => filter === "sites" ? SITE_MNEMONICS.includes(i.mnemonic)
    : filter === "dead" ? !i.reachable : true);
  const count = $("disasm-count");
  if (count) count.textContent = `${shown.length} of ${report.instructions.length} shown`;
  for (const i of shown.slice(0, 400)) {
    row(disasm, [
      `0x${i.addr.toString(16)}`,
      i.bytes,
      i.in ? `${i.mnemonic} ${i.operands}`.trim() : `${i.mnemonic} ${i.operands}`.trim(),
      i.in || "",
      i.reachable ? "" : "dead",
    ], i.reachable ? "" : "bad");
  }
  if (shown.length > 400) row(disasm, ["…", `${shown.length - 400} more`, "", "", ""]);
}

// -------------------------------------------------------------------- loading

const fetchText = async (path) => {
  const res = await fetch(new URL(`../${path}`, import.meta.url), { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
};

export async function loadSample(name, { withListing = true } = {}) {
  const sample = SAMPLES[name];
  if (!sample) return render({ ok: false, error: `unknown sample ${name}` });
  try {
    const hex = await fetchText(sample.hex);
    const lst = withListing && sample.lst ? await fetchText(sample.lst) : null;
    render(analyse(hex, lst));
    $("hex-input").value = hex.trim();
  } catch (err) {
    render({ ok: false, error: `${sample.label} could not be fetched (${err.message}) — paste the .hex below and press Analyse.` });
  }
}

// --------------------------------------------------------------------- wiring

export function wire() {
  const select = $("sample-select");
  const load = $("load-sample");
  const paste = $("analyse-paste");
  const listingSelect = $("listing-select");
  const filter = $("filter-sites");

  if (select && load) load.addEventListener("click", () => { void loadSample(select.value, { withListing: !listingSelect || listingSelect.value !== "none" }); });
  if (filter) filter.addEventListener("change", () => render(lastReport));
  if (paste) {
    paste.addEventListener("click", () => {
      const text = $("hex-input") ? $("hex-input").value : "";
      const wantListing = listingSelect && listingSelect.value !== "none";
      if (wantListing && SAMPLES.optiboot) {
        void (async () => {
          let lst = null;
          try { lst = await fetchText(SAMPLES.optiboot.lst); } catch { /* annotate only if reachable */ }
          render(analyse(text, lst));
        })();
      } else {
        render(analyse(text));
      }
    });
  }
}

wire();
render(null);
const served = typeof location !== "undefined" && /^https?:$/.test(String(location.protocol || ""));
if (typeof fetch === "function" && served) {
  // Auto-load on a real page; a file:// open will fail here, which the render
  // above has already told the reader how to work around.
  void loadSample("optiboot");
}
