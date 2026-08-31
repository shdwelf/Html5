/**
 * DriverGuide — HTML5 app.
 *  · REGISTRY   — read Windows registry exports (.reg) → detect drivers & Windows build
 *  · ZIP READER — hang-proof zip reader (bounded, streamed, cancellable, watchdog)
 *  · DLL LIB    — every missing-DLL with all redistributable versions
 *  · GUIDE      — latest driver versions + download & install steps
 *
 * No server, no network required (links in the guide open vendor pages).
 * Compiled against vendor data as of 2026-08-31.
 */
import { parseReg, buildTree, decodeValue, hiveOf, shortHivePath } from "./regparse.js";
import { DLL_CATALOG, PACKAGES, findDll, searchDll, latestOf, packageOf, missingDlls } from "./dll-catalog.js";
import { DRIVER_CATALOG, CLASS_GUIDS, matchCatalogVersion, findDriverById, DATA_AS_OF, windowsName } from "./driver-catalog.js";
import { readPeVersion } from "./pe-version.js";
import { Unzip, UnzipInflate, zipSync, strToU8 } from "../vendor/fflate/index.mjs";

/* ------------------------------------------------------------------ utils */
const $ = (id) => document.getElementById(id);
const tick = () => new Promise((r) => setTimeout(r, 0));
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmtBytes(n) {
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

function fmtDate(d) {
  if (!d) return "—";
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${names[+m[2] - 1]} ${+m[3]}, ${m[1]}`;
  }
  return d;
}

function short(s, n = 90) {
  s = String(s ?? "");
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function downloadBlob(bytes, filename) {
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "file";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}

/* ------------------------------------------------------ ZIP reader (safe) */
const ZIP_LIMITS = {
  maxInputBytes: 384 * 1024 * 1024, // refuse archives bigger than this
  maxTotalOut: 256 * 1024 * 1024, // total expanded bytes budget
  maxEntryOut: 64 * 1024 * 1024, // per-entry expanded budget
  maxEntries: 12000,
  timeoutMs: 120000, // watchdog — auto-abort a stuck read
  pushChunk: 262144, // streamed in 256 KB slices → UI stays alive
};

class ZipLimit extends Error {
  constructor(m) {
    super(m);
    this.name = "ZipLimit";
  }
}
class ZipAbort extends Error {
  constructor(m) {
    super(m);
    this.name = "ZipAbort";
  }
}

function normEntryName(name) {
  if (typeof name !== "string") return null;
  let n = name.replace(/\\/g, "/");
  if (n.startsWith("./")) n = n.slice(2);
  n = n.replace(/^\/+/, "");
  if (!n || n.endsWith("/") || n.endsWith("\\")) return null;
  return n;
}

function concatChunks(arr) {
  let total = 0;
  for (const c of arr) total += c.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of arr) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/**
 * Streaming, bounded, cancellable zip read. The watchdog (state.aborted) is
 * armed by the caller; every 256 KB slice the loop checks it and yields to the
 * event loop, so the UI can never freeze and CANCEL always works.
 */
async function readZipStreaming(buf, limits, state, onProgress) {
  const t0 = performance.now();
  const bytes = new Uint8Array(buf);
  if (bytes.length < 4) throw new Error("Not a ZIP archive — the file is too small.");
  if (bytes.length > limits.maxInputBytes) {
    throw new Error(`Archive is ${fmtBytes(bytes.length)}; the reader refuses inputs over ${fmtBytes(limits.maxInputBytes)} to stay hang-proof.`);
  }

  const entries = [];
  const pending = new Map();
  let expanded = 0;
  let fatal = null; // recorded failure — fflate may re-enter the callback with it

  const unz = new Unzip((file) => {
    const name = normEntryName(file.name);
    file.ondata = (err, data, final) => {
      // fflate re-delivers a callback's thrown error here; record once and stop.
      if (fatal) return;
      if (err) {
        fatal = err instanceof ZipLimit || err instanceof ZipAbort ? err : new Error(`Corrupt entry “${file.name}”: ${err}`);
        return;
      }
      if (!name) return; // directories & junk — drained, not stored
      try {
        let arr = pending.get(name);
        if (!arr) {
          arr = [];
          pending.set(name, arr);
        }
        arr.push(data);
        expanded += data.length;
        if (expanded > limits.maxTotalOut) {
          fatal = new ZipLimit(`Expanded data exceeds the ${fmtBytes(limits.maxTotalOut)} budget — this archive looks like a zip bomb.`);
          return;
        }
        let acc = 0;
        for (const c of arr) acc += c.length;
        if (acc > limits.maxEntryOut) {
          fatal = new ZipLimit(`Entry “${name}” expands past ${fmtBytes(limits.maxEntryOut)} — over the per-file budget.`);
          return;
        }
        if (final) {
          const merged = concatChunks(arr);
          entries.push({ name, data: merged, size: merged.length, csize: file.size ?? null, method: file.compression ?? null });
          pending.delete(name);
          if (entries.length > limits.maxEntries) {
            fatal = new ZipLimit(`More than ${limits.maxEntries} entries — refusing to continue.`);
          }
        }
      } catch (e) {
        fatal = e; // never throw back into fflate's callback chain (would re-enter)
      }
    };
    file.start();
  });
  unz.register(UnzipInflate);

  const CH = limits.pushChunk;
  for (let off = 0; off < bytes.length; off += CH) {
    if (state.cancelled) throw new ZipAbort("Cancelled by you — nothing was kept.");
    if (state.aborted) throw new ZipAbort("Watchdog fired: the read stalled and was aborted after the time limit.");
    const end = Math.min(bytes.length, off + CH);
    unz.push(bytes.subarray(off, end), end === bytes.length);
    if (fatal) throw fatal;
    onProgress?.({ phase: "read", pct: end / bytes.length, expanded, entries: entries.length });
    await tick();
  }
  if (!entries.length) throw new Error("No readable files inside this archive.");
  return { entries, expanded, ms: performance.now() - t0 };
}

function zipSelfTest() {
  const out = [];
  const run = async (label, fn) => {
    const t0 = performance.now();
    try {
      await fn();
      out.push(`✔ ${label} — ${(performance.now() - t0).toFixed(0)} ms`);
    } catch (e) {
      out.push(`✘ ${label} — ${e.message}`);
    }
  };
  return (async () => {
    await run("build + read a small zip in memory", async () => {
      const z = zipSync({
        "readme.txt": strToU8("DriverGuide self-test ✔"),
        "driver.reg": strToU8('Windows Registry Editor Version 5.00\n[HKEY_LOCAL_MACHINE\\SOFTWARE\\Test]\n"Value"="1"\n'),
      });
      const r = await readZipStreaming(z.buffer, ZIP_LIMITS, {}, () => {});
      const names = r.entries.map((e) => e.name).sort();
      if (names.join(",") !== "driver.reg,readme.txt") throw new Error(`unexpected entries: ${names.join(",")}`);
    });
    await run("zip-bomb guard trips cleanly (never hangs)", async () => {
      const z = zipSync({ "bomb.bin": new Uint8Array(80 * 1024 * 1024) }); // 80 MB of zeros
      try {
        await readZipStreaming(z.buffer, ZIP_LIMITS, {}, () => {});
        throw new Error("expected the size budget to reject this");
      } catch (e) {
        if (!(e instanceof ZipLimit)) throw e;
      }
    });
    await run("cancel button interrupts a read", async () => {
      const z = zipSync({ "big.bin": new Uint8Array(24 * 1024 * 1024) });
      const state = {};
      setTimeout(() => (state.cancelled = true), 5);
      try {
        await readZipStreaming(z.buffer, ZIP_LIMITS, state, () => {});
        throw new Error("expected cancellation");
      } catch (e) {
        if (!(e instanceof ZipAbort)) throw e;
      }
    });
    return out;
  })();
}

/* ------------------------------------------------------------- registry */
function detectFromReg(reg) {
  const res = { windows: null, drivers: [], drivers32: [], dllRefs: new Set() };
  for (const k of reg.keys) {
    const vals = {};
    for (const v of k.values) vals[v.name] = decodeValue(v);
    const path = k.path;

    if (/Windows NT\\CurrentVersion$/.test(path) && (vals.CurrentBuildNumber || vals.CurrentBuild)) {
      res.windows = {
        build: vals.CurrentBuildNumber || vals.CurrentBuild,
        ubr: vals.UBR,
        display: vals.DisplayVersion,
        product: vals.ProductName,
        edition: vals.EditionID,
      };
    }

    const cm = path.match(/Control\\Class\\\{([0-9a-fA-F-]+)\}\\(\d+)$/);
    if (cm) {
      const cls = CLASS_GUIDS[cm[1].toLowerCase()];
      if (cls && (vals.DriverDesc || vals.DriverVersion)) {
        const cat = catFor(cls.family, vals.ProviderName, vals.DriverDesc);
        res.drivers.push({
          source: "class",
          className: cls.name,
          family: cls.family,
          index: cm[2],
          desc: vals.DriverDesc,
          version: vals.DriverVersion,
          provider: vals.ProviderName,
          date: vals.DriverDate,
          inf: vals.InfPath,
          match: cat ? matchCatalogVersion(cat, vals.DriverVersion) : null,
          catId: cat?.id || null,
        });
      }
    }

    if (path.includes("\\Drivers32")) {
      for (const v of k.values) {
        const d = decodeValue(v);
        res.drivers32.push({ key: v.name, value: d });
        const m = String(d).match(/[\w.-]+\.dll/i);
        if (m) res.dllRefs.add(m[0]);
      }
    }

    if (path.includes("\\Uninstall\\") && vals.DisplayName && /nvidia|geforce|radeon|adrenalin|intel|arc|realtek/i.test(vals.DisplayName)) {
      const cat = catFor(null, vals.Publisher, vals.DisplayName);
      res.drivers.push({
        source: "uninstall",
        className: "Installed software",
        desc: vals.DisplayName,
        version: vals.DisplayVersion,
        provider: vals.Publisher,
        date: vals.InstallDate,
        match: cat ? matchCatalogVersion(cat, vals.DisplayVersion) : null,
        catId: cat?.id || null,
      });
    }
  }
  return res;
}

function catFor(family, provider, desc) {
  const hay = `${provider || ""} ${desc || ""}`;
  if (/realtek/i.test(hay) || (family === "media" && /realtek/i.test(hay))) return findDriverById("realtek");
  if (/nvidia|geforce/i.test(hay)) return findDriverById("nvidia");
  if (/amd|radeon|adrenalin|ati/i.test(hay)) return findDriverById("amd");
  if (/intel/i.test(hay)) return findDriverById("intel");
  if (family === "display") {
    // Unknown vendor on display class — offer the three majors generically.
    return null;
  }
  return null;
}

/* ---------------------------------------------------------------- app */
const state = {
  reg: null,
  zipEntries: [],
  zipState: null,
};

function setStatus(id, msg, kind = "") {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.className = "status" + (kind ? ` status-${kind}` : "");
}

function renderTabs() {
  const wanted = (location.hash.match(/^#(reg|zip|dll|guide)/) || [null, "reg"])[1];
  document.querySelectorAll(".dg-tab").forEach((t) => {
    const on = t.dataset.tab === wanted;
    t.classList.toggle("on", on);
    $(`tab-${t.dataset.tab}`).hidden = !on;
  });
  document.querySelectorAll(".dg-tab-btn").forEach((b) => b.classList.toggle("on", b.dataset.tab === wanted));
}

function initTabs() {
  document.querySelectorAll(".dg-tab-btn").forEach((b) => {
    b.addEventListener("click", () => {
      location.hash = b.dataset.tab;
      renderTabs();
    });
  });
  window.addEventListener("hashchange", renderTabs);
}

/* ------------------------------------------------------ registry tab */
const SAMPLE_REG = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion]
"ProductName"="Windows 11 Pro"
"DisplayVersion"="24H2"
"CurrentBuildNumber"="26100"
"CurrentBuild"="26100"
"UBR"="3194"
"EditionID"="Professional"

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000]
"DriverDesc"="NVIDIA GeForce RTX 4070"
"ProviderName"="NVIDIA"
"DriverVersion"="32.0.16.1656"
"DriverDate"="8-26-2026"
"InfPath"="nv_dispi.inf"

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e96c-e325-11ce-bfc1-08002be10318}\\0000]
"DriverDesc"="Realtek(R) Audio"
"ProviderName"="Realtek Semiconductor Corp."
"DriverVersion"="6.0.9998.1"
"DriverDate"="6-29-2026"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Drivers32]
"wave"="wdmaud.drv"
"vidc.cvid"="iccvid.dll"
"VIDC.YUY2"="msyuv.dll"
`;

function wireRegistryTab() {
  const input = $("regFile");
  const drop = $("regDrop");
  const sampleBtn = $("regSample");

  const loadText = async (text, name) => {
    if (text.length > 96 * 1024 * 1024) {
      setStatus("regStatus", "Registry export is over 96 MB — too large to parse in a browser tab.", "err");
      return;
    }
    setStatus("regStatus", `Parsing ${esc(name)}…`, "busy");
    const t0 = performance.now();
    const reg = await parseReg(text, (p) => {
      if (p.done) setStatus("regStatus", `Parsing ${esc(name)}… (${p.keys.toLocaleString()} keys, ${p.values.toLocaleString()} values)`, "busy");
    });
    state.reg = reg;
    const ms = (performance.now() - t0).toFixed(0);
    setStatus("regStatus", `${esc(name)} · ${reg.stats.keys.toLocaleString()} keys · ${reg.stats.values.toLocaleString()} values · ${ms} ms`, "ok");
    renderRegistry();
  };

  input.addEventListener("change", () => {
    const f = input.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => loadText(String(r.result || ""), f.name);
    r.onerror = () => setStatus("regStatus", "Could not read that file.", "err");
    r.readAsText(f);
    input.value = "";
  });

  drop.addEventListener("click", () => input.click());
  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("drag");
    })
  );
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => loadText(String(r.result || ""), f.name);
    r.readAsText(f);
  });

  sampleBtn.addEventListener("click", () => loadText(SAMPLE_REG, "sample.reg"));

  $("regSearch").addEventListener("input", (e) => {
    renderRegSearch(e.target.value);
  });

  $("dllErrorText").addEventListener("input", () => renderMissingFromError());
  $("dllErrorScan").addEventListener("click", () => renderMissingFromError(true));
}

function renderRegistry() {
  const reg = state.reg;
  if (!reg) return;
  const det = detectFromReg(reg);

  // system card
  const sys = $("regSystem");
  if (det.windows) {
    const w = det.windows;
    sys.innerHTML = `
      <div class="sys-row"><span>Windows</span><b>${esc(w.product || "Windows")} ${esc(w.display || "")}</b></div>
      <div class="sys-row"><span>Build</span><b>${esc(w.build)}${w.ubr ? `.${esc(w.ubr)}` : ""}</b><i>${esc(windowsName(w.build) || "")}</i></div>
      <div class="sys-row"><span>Edition</span><b>${esc(w.edition || "—")}</b></div>`;
  } else {
    sys.innerHTML = `<p class="empty">No <code>Windows NT\\CurrentVersion</code> key in this export — add that branch to the .reg for OS info.</p>`;
  }

  // drivers
  const wrap = $("regDrivers");
  wrap.innerHTML = "";
  const list = det.drivers.filter((d) => d.desc || d.version);
  if (!list.length) {
    wrap.innerHTML = `<p class="empty">No driver keys found. Export a branch like <code>HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class</code> or <code>HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall</code>.</p>`;
  } else {
    for (const d of list) wrap.appendChild(driverCard(d));
  }

  // drivers32 + dll refs
  const d32 = $("regDllRefs");
  d32.innerHTML = "";
  if (det.drivers32.length) {
    for (const r of det.drivers32) {
      const row = document.createElement("div");
      row.className = "dllref";
      row.innerHTML = `<code>${esc(r.key)}</code> → <span>${esc(r.value)}</span>`;
      d32.appendChild(row);
    }
  } else {
    d32.innerHTML = `<p class="empty">No <code>Drivers32</code> section in this export.</p>`;
  }

  // tree
  const tree = buildTree(reg.keys);
  const wrapTree = $("regTree");
  wrapTree.innerHTML = "";
  const container = document.createElement("div");
  for (const node of tree.children.values()) container.appendChild(treeRow(node));
  wrapTree.appendChild(container);

  $("regCounts").textContent = `${reg.stats.keys.toLocaleString()} keys · ${reg.stats.values.toLocaleString()} values`;
  renderRegSearch($("regSearch").value);
}

function driverCard(d) {
  const card = document.createElement("article");
  card.className = "driver-card";
  let matchHtml = "";
  if (d.match?.version) {
    const cat = findDriverById(d.catId);
    const isLatest = d.match.exact && d.match.version.v === cat?.latest;
    matchHtml = `
      <div class="match ${isLatest ? "match-latest" : "match-old"}">
        <b>${esc(d.match.version.v)}</b> · ${esc(d.match.version.kind || "")}
        <span>${isLatest ? "✓ LATEST" : "⬆ UPDATE AVAILABLE"}</span>
      </div>
      ${!isLatest && cat ? `<div class="match-advice">Latest for this hardware: <b>${esc(cat.latest)}</b> (${esc(fmtDate(cat.versions.find((v) => v.v === cat.latest)?.date))}) — <a href="${esc(cat.page)}" target="_blank" rel="noopener">download on vendor page ↗</a></div>` : ""}
      ${cat ? allVersionsTable(cat, d.match.version.v) : ""}`;
  } else if (d.match?.nearest) {
    matchHtml = `<div class="match match-old"><b>Unrecognized build</b><span>nearest catalog: ${esc(d.match.nearest.version)}</span></div>`;
  } else if (d.catId) {
    const cat = findDriverById(d.catId);
    matchHtml = `<div class="match match-old"><b>Version not in catalog</b><span><a href="${esc(cat.page)}" target="_blank" rel="noopener">check the vendor page ↗</a></span></div>`;
  } else {
    matchHtml = `<div class="match"><b>Driver listed</b><span>no catalog entry for this vendor — see the guide tab</span></div>`;
  }

  card.innerHTML = `
    <header>
      <div class="driver-title">
        <h3>${esc(d.desc || "Unnamed driver")}</h3>
        <p>${esc(d.className)}${d.index ? ` · device ${esc(d.index)}` : ""}${d.source === "uninstall" ? " · from Uninstall key" : ""}</p>
      </div>
      <div class="driver-meta">
        ${d.provider ? `<span>${esc(d.provider)}</span>` : ""}
        ${d.date ? `<span>${esc(d.date)}</span>` : ""}
        ${d.version ? `<code>v${esc(d.version)}</code>` : ""}
      </div>
    </header>
    ${matchHtml}`;
  return card;
}

function allVersionsTable(cat, currentVersion) {
  const rows = cat.versions
    .map((v) => {
      const isCur = v.v === currentVersion;
      const isLatest = v.v === cat.latest;
      return `<tr class="${isLatest ? "row-latest" : ""}">
        <td><b>${esc(v.v)}</b>${isLatest ? " <i class='tag tag-latest'>LATEST</i>" : ""}${isCur ? " <i class='tag tag-cur'>IN REGISTRY</i>" : ""}</td>
        <td>${esc(fmtDate(v.date))}</td>
        <td>${esc(v.kind || "")}</td>
        <td class="note-cell">${esc(v.note || "")}</td>
      </tr>`;
    })
    .join("");
  return `
    <details class="versions">
      <summary>ALL VERSIONS · ${esc(cat.vendor)} ${esc(cat.name)} (${cat.versions.length})</summary>
      <table class="vtable">
        <thead><tr><th>Version</th><th>Released</th><th>Kind</th><th>Note</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="table-foot">Download from the official page — every version is listed there: <a href="${esc(cat.page)}" target="_blank" rel="noopener">${esc(cat.page)} ↗</a></p>
    </details>`;
}

function treeRow(node) {
  const details = document.createElement("details");
  details.className = "tree-node";
  const sum = document.createElement("summary");
  sum.innerHTML = `<span class="tree-name">${esc(node.name)}</span>${node.values.length ? `<span class="tree-badge">${node.values.length}</span>` : ""}`;
  details.appendChild(sum);

  const holder = document.createElement("div");
  holder.className = "tree-children";
  details.appendChild(holder);

  details.addEventListener("toggle", () => {
    if (!details.open || holder.dataset.loaded) return;
    holder.dataset.loaded = "1";
    for (const [name, child] of node.children) holder.appendChild(treeRow(child));
  });

  if (node.values.length) {
    const vd = document.createElement("div");
    vd.className = "tree-values";
    for (const v of node.values.slice(0, 30)) {
      const row = document.createElement("div");
      row.className = "tree-value";
      row.innerHTML = `<code>${esc(v.name || "@")}</code><i>${esc(v.type)}</i><span>${esc(short(decodeValue(v), 80))}</span>`;
      vd.appendChild(row);
    }
    if (node.values.length > 30) {
      const more = document.createElement("div");
      more.className = "tree-more";
      more.textContent = `+ ${node.values.length - 30} more values`;
      vd.appendChild(more);
    }
    details.appendChild(vd);
  }
  return details;
}

function renderRegSearch(q) {
  const wrap = $("regSearchResults");
  const reg = state.reg;
  q = (q || "").trim().toLowerCase();
  if (!reg || !q) {
    wrap.innerHTML = "";
    return;
  }
  const hits = [];
  for (const k of reg.keys) {
    const pathHit = k.path.toLowerCase().includes(q);
    const vHits = pathHit ? [] : k.values.filter((v) => v.name.toLowerCase().includes(q) || decodeValue(v).toLowerCase().includes(q));
    if (pathHit || vHits.length) hits.push({ k, vHits, pathHit });
    if (hits.length >= 200) break;
  }
  if (!hits.length) {
    wrap.innerHTML = `<p class="empty">No matches for “${esc(q)}”.</p>`;
    return;
  }
  wrap.innerHTML = `<p class="hits">${hits.length === 200 ? "first 200 of more" : hits.length} matching key${hits.length === 1 ? "" : "s"}</p>`;
  for (const { k, vHits, pathHit } of hits) {
    const row = document.createElement("div");
    row.className = "search-hit";
    const vals = pathHit ? k.values.slice(0, 4) : vHits.slice(0, 4);
    row.innerHTML = `<code>${esc(shortHivePath(k.path))}</code>` +
      vals.map((v) => `<span><b>${esc(v.name || "@")}</b> = ${esc(short(decodeValue(v), 60))}</span>`).join("") +
      (vals.length < k.values.length ? `<span class="more">+${k.values.length - vals.length} more</span>` : "");
    wrap.appendChild(row);
  }
}

/* --------------------------------------------------- missing-DLL scan */
function renderMissingFromError(force) {
  const el = $("dllErrorText");
  const wrap = $("dllErrorResults");
  const text = el.value;
  if (!text.trim()) {
    wrap.innerHTML = "";
    return;
  }
  const names = new Set();
  const re = /[A-Za-z0-9_][\w.-]*\.dll\b/gi;
  let m;
  while ((m = re.exec(text))) names.add(m[0].toLowerCase());
  const found = [];
  for (const n of names) {
    const dll = findDll(n);
    if (dll) found.push(dll);
  }
  if (!found.length) {
    wrap.innerHTML = `<p class="empty">No known runtime DLLs matched. If the names are custom to the app, look in its install folder, not the system.</p>`;
    return;
  }
  const byPkg = new Map();
  for (const dll of found) {
    const p = packageOf(dll);
    const key = p ? p.id : dll.pkg;
    if (!byPkg.has(key)) byPkg.set(key, []);
    byPkg.get(key).push(dll);
  }
  wrap.innerHTML = `<p class="hits">${found.length} known missing DLL${found.length === 1 ? "" : "s"} → ${byPkg.size} package${byPkg.size === 1 ? "" : "s"} fix them</p>`;
  for (const [pkgId, dlls] of byPkg) {
    const p = PACKAGES[pkgId];
    const card = document.createElement("div");
    card.className = "fix-card";
    const pkgName = p?.name || dlls[0].pkg;
    const urls = p
      ? `<a class="btn btn-sm" href="${esc(p.url64)}" target="_blank" rel="noopener">DOWNLOAD ${pkgId === "netfx" ? "RUNTIME" : "x64"} ↗</a>${p.url32 ? `<a class="btn btn-sm" href="${esc(p.url32)}" target="_blank" rel="noopener">x86 ↗</a>` : ""}`
      : "";
    card.innerHTML = `
      <header><h4>${esc(pkgName)}</h4>${urls}</header>
      <ul>${dlls.map((d) => `<li><code>${esc(d.name)}</code> — ${esc(d.desc)} <i>latest ${esc(latestOf(d)?.v || "—")}</i></li>`).join("")}</ul>
      ${p?.note ? `<p class="fix-note">${esc(p.note)}</p>` : ""}`;
    wrap.appendChild(card);
  }
}

/* ---------------------------------------------------------- zip tab */
function wireZipTab() {
  const input = $("zipFile");
  const drop = $("zipDrop");
  const cancelBtn = $("zipCancel");
  const selfTestBtn = $("zipSelfTest");
  const selfLog = $("zipSelfLog");

  const loadZip = async (file) => {
    if (state.zipState) {
      state.zipState.cancelled = true; // stop any in-flight read first
      state.zipState = null;
    }
    if (file.size > ZIP_LIMITS.maxInputBytes) {
      setStatus("zipStatus", `“${esc(file.name)}” is ${fmtBytes(file.size)} — over the ${fmtBytes(ZIP_LIMITS.maxInputBytes)} hang-proof cap.`, "err");
      return;
    }
    setStatus("zipStatus", `Reading “${esc(file.name)}”…`, "busy");
    showZipProgress(true, 0);
    const buf = await file.arrayBuffer();
    const zstate = { cancelled: false, aborted: false };
    state.zipState = zstate;
    const watchdog = setTimeout(() => {
      if (!zstate.cancelled) zstate.aborted = true;
    }, ZIP_LIMITS.timeoutMs);
    try {
      const r = await readZipStreaming(buf, ZIP_LIMITS, zstate, (p) => {
        showZipProgress(true, p.pct, `${fmtBytes(p.expanded)} expanded · ${p.entries} files`);
      });
      clearTimeout(watchdog);
      state.zipEntries = r.entries;
      state.zipState = null;
      showZipProgress(false);
      setStatus("zipStatus", `${esc(file.name)} · ${r.entries.length} files · ${fmtBytes(r.expanded)} expanded · ${r.ms.toFixed(0)} ms — reader never blocked`, "ok");
      renderZipEntries();
    } catch (e) {
      clearTimeout(watchdog);
      state.zipState = null;
      showZipProgress(false);
      setStatus("zipStatus", `${esc(file.name)}: ${esc(e.message)}`, "err");
      $("zipEntries").innerHTML = "";
      $("zipPreview").innerHTML = "";
    }
  };

  input.addEventListener("change", () => {
    const f = input.files?.[0];
    if (f) loadZip(f);
    input.value = "";
  });
  drop.addEventListener("click", () => input.click());
  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("drag");
    })
  );
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) loadZip(f);
  });

  cancelBtn.addEventListener("click", () => {
    if (state.zipState) {
      state.zipState.cancelled = true;
      setStatus("zipStatus", "Cancelling…", "busy");
    }
  });

  $("zipFilter").addEventListener("input", (e) => renderZipEntries(e.target.value));

  selfTestBtn.addEventListener("click", async () => {
    selfLog.hidden = false;
    selfLog.innerHTML = `<p class="empty">Running reader health checks…</p>`;
    const lines = await zipSelfTest();
    selfLog.innerHTML = lines.map((l) => `<div class="${l.startsWith("✔") ? "ok" : "bad"}">${esc(l)}</div>`).join("");
  });
}

function showZipProgress(on, pct, note) {
  $("zipProgressWrap").hidden = !on;
  if (!on) return;
  $("zipProgressBar").style.width = `${Math.round((pct || 0) * 100)}%`;
  $("zipProgressPct").textContent = `${Math.round((pct || 0) * 100)}%`;
  $("zipProgressNote").textContent = note || "";
}

function renderZipEntries(filter) {
  const wrap = $("zipEntries");
  const entries = state.zipEntries;
  filter = (filter || "").trim().toLowerCase();
  if (!entries.length) {
    wrap.innerHTML = "";
    return;
  }
  const shown = filter ? entries.filter((e) => e.name.toLowerCase().includes(filter)) : entries;
  wrap.innerHTML = `<p class="hits">${shown.length} of ${entries.length} entries${filter ? ` matching “${esc(filter)}”` : ""}</p>`;
  const table = document.createElement("table");
  table.className = "ztable";
  table.innerHTML = `<thead><tr><th>Name</th><th>Size</th><th>Method</th><th></th></tr></thead>`;
  const tbody = document.createElement("tbody");
  const preview = (e) => previewEntry(e);
  for (const e of shown.slice(0, 600)) {
    const tr = document.createElement("tr");
    const ext = (e.name.split(".").pop() || "").toLowerCase();
    const isDll = /^(dll|sys|exe|ocx|drv)$/.test(ext);
    tr.innerHTML = `
      <td class="zname">${isDll ? "<span class='tag tag-dll'>PE</span>" : ""}${esc(e.name)}</td>
      <td>${fmtBytes(e.size)}</td>
      <td>${e.method === 8 ? "deflate" : e.method === 0 ? "stored" : e.method ?? "—"}</td>
      <td><button class="btn btn-sm" data-name="${esc(e.name)}">OPEN</button></td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  if (shown.length > 600) {
    const more = document.createElement("p");
    more.className = "empty";
    more.textContent = "Only the first 600 entries are listed — use the filter to narrow down.";
    wrap.appendChild(more);
  }
  table.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const e = entries.find((x) => x.name === b.dataset.name);
      if (e) preview(e);
    });
  });
  renderDllCheck(entries);
}

function renderDllCheck(entries) {
  const wrap = $("zipDllCheck");
  const present = new Set(entries.map((e) => e.name.split("/").pop().toLowerCase()));
  const found = DLL_CATALOG.filter((d) => present.has(d.name.toLowerCase()));
  const missing = missingDlls(present);
  const byPkg = new Map();
  for (const d of missing) {
    if (!byPkg.has(d.pkg)) byPkg.set(d.pkg, []);
    byPkg.get(d.pkg).push(d);
  }
  wrap.innerHTML = "";
  if (!entries.length) return;
  const head = document.createElement("p");
  head.className = "hits";
  head.innerHTML = `Known runtime DLLs <b>found</b> in archive: <b class="ok">${found.length}</b> · catalog DLLs <b>not found</b> here: <b class="bad">${missing.length}</b>`;
  wrap.appendChild(head);
  if (found.length) {
    const p = document.createElement("p");
    p.className = "fix-note";
    p.textContent = "Found: " + found.map((d) => d.name).join(", ");
    wrap.appendChild(p);
  }
  for (const [pkgId, dlls] of byPkg) {
    const p = PACKAGES[pkgId];
    const card = document.createElement("div");
    card.className = "fix-card fix-card-sm";
    card.innerHTML = `
      <header><h4>${esc(p?.name || pkgId)}</h4>
        ${p ? `<a class="btn btn-sm" href="${esc(p.url64)}" target="_blank" rel="noopener">DOWNLOAD ↗</a>` : ""}
      </header>
      <ul>${dlls.slice(0, 8).map((d) => `<li><code>${esc(d.name)}</code></li>`).join("")}${dlls.length > 8 ? `<li class="more">+${dlls.length - 8} more…</li>` : ""}</ul>`;
    wrap.appendChild(card);
  }
}

function previewEntry(e) {
  const wrap = $("zipPreview");
  const ext = (e.name.split(".").pop() || "").toLowerCase();
  const dl = `<button class="btn btn-sm" id="zipDownloadOne">DOWNLOAD ${esc(e.name.split("/").pop())}</button>`;
  let body = "";
  const isText = ["txt", "ini", "inf", "reg", "log", "cfg", "xml", "json", "md", "csv", "smi", "bat", "cmd", "nfo", "config", "strings", "readme", "license", "html", "htm"].includes(ext);

  if (isText && e.size <= 2 * 1024 * 1024) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(e.data);
    body = `<pre class="preview-text">${esc(text.slice(0, 120000))}</pre>${text.length > 120000 ? "<p class='empty'>truncated</p>" : ""}`;
  } else if (/^(dll|sys|exe|ocx|drv)$/.test(ext)) {
    const pe = readPeVersion(e.data);
    if (pe) {
      const dllHit = findDll(e.name.split("/").pop());
      const latest = dllHit ? latestOf(dllHit) : null;
      body = `
        <div class="pe-card">
          <h4>VERSION INFO · ${esc(e.name.split("/").pop())}</h4>
          <div class="sys-row"><span>File version</span><b>${esc(pe.fileVersion)}</b></div>
          <div class="sys-row"><span>Product version</span><b>${esc(pe.productVersion)}</b></div>
          ${pe.fileDescription ? `<div class="sys-row"><span>Description</span><b>${esc(pe.fileDescription)}</b></div>` : ""}
          ${pe.productName ? `<div class="sys-row"><span>Product</span><b>${esc(pe.productName)}</b></div>` : ""}
          ${pe.companyName ? `<div class="sys-row"><span>Company</span><b>${esc(pe.companyName)}</b></div>` : ""}
          ${pe.originalFilename ? `<div class="sys-row"><span>Original file</span><b>${esc(pe.originalFilename)}</b></div>` : ""}
          ${dllHit ? `<div class="pe-hint">Catalog: <b>${esc(dllHit.name)}</b> · ${esc(dllHit.desc)}<br/>Latest redistributable build: <b>${esc(latest?.v || "—")}</b>${latest && latest.v !== pe.fileVersion ? " — this copy is older than the latest" : ""}</div>` : ""}
        </div>`;
    } else {
      body = `<p class="empty">Could not read a version resource from this binary (stripped or non-PE).</p>
              <p class="fix-note">First bytes: ${esc(hexHead(e.data, 32))}</p>`;
    }
  } else if (/^(zip)$/.test(ext)) {
    body = `<p class="empty">Nested archive — save it first, then drop it into this reader.</p>`;
  } else {
    // binary-ish
    const looksBinary = e.data.length > 0 && (e.data.subarray(0, 4096).includes(0) || e.data.length > 2 * 1024 * 1024);
    body = looksBinary
      ? `<p class="fix-note">Binary file · ${fmtBytes(e.size)} · first bytes:</p><pre class="preview-text">${esc(hexHead(e.data, 128))}</pre>`
      : `<pre class="preview-text">${esc(new TextDecoder("utf-8").decode(e.data).slice(0, 120000))}</pre>`;
  }

  wrap.innerHTML = `
    <header class="preview-head">
      <div><h4>${esc(e.name)}</h4><p>${fmtBytes(e.size)} · ${e.method === 8 ? "deflate" : e.method === 0 ? "stored" : "?"}${e.csize != null ? ` · compressed ${fmtBytes(e.csize)}` : ""}</p></div>
      <div>${dl}${ext === "reg" && e.size <= 2 * 1024 * 1024 ? `<button class="btn btn-sm hot" id="zipLoadReg">LOAD INTO REGISTRY ↗</button>` : ""}</div>
    </header>
    ${body}`;
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  $("zipDownloadOne")?.addEventListener("click", () => downloadBlob(e.data, e.name.split("/").pop()));
  $("zipLoadReg")?.addEventListener("click", async () => {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(e.data);
    setStatus("regStatus", "Loading .reg from archive…", "busy");
    document.querySelector('[data-tab="reg"]').click();
    const reg = await parseReg(text);
    state.reg = reg;
    setStatus("regStatus", `${esc(e.name)} · ${reg.stats.keys} keys · ${reg.stats.values} values`, "ok");
    renderRegistry();
  });
}

function hexHead(bytes, n) {
  const out = [];
  for (let i = 0; i < Math.min(n, bytes.length); i++) out.push(bytes[i].toString(16).padStart(2, "0"));
  return out.join(" ");
}

/* -------------------------------------------------------- dll library */
function renderDllLibrary() {
  const q = $("dllSearch").value;
  const pkg = $("dllPkgFilter").value;
  const wrap = $("dllTable");
  let list = searchDll(q);
  if (pkg) list = list.filter((d) => d.pkg === pkg);
  wrap.innerHTML = "";
  if (!list.length) {
    wrap.innerHTML = `<p class="empty">No DLLs match.</p>`;
    return;
  }
  const table = document.createElement("table");
  table.className = "vtable dll-table";
  table.innerHTML = `<thead><tr><th>DLL</th><th>What it is</th><th>Latest build</th><th>Bits</th><th>Package</th></tr></thead>`;
  const tbody = document.createElement("tbody");
  for (const d of list) {
    const latest = latestOf(d);
    const p = packageOf(d);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${esc(d.name)}</b></td>
      <td class="note-cell">${esc(d.desc)}</td>
      <td><code>${esc(latest?.v || "—")}</code><br/><i>${esc(latest?.note || "")}</i></td>
      <td>${esc(d.bits.join("/"))}</td>
      <td>${esc(p?.name || d.pkg)}${p ? `<br/><a class="mini" href="${esc(p.url64)}" target="_blank" rel="noopener">download ↗</a>` : ""}</td>`;
    const versions = document.createElement("details");
    versions.className = "row-versions";
    const sum = document.createElement("summary");
    sum.textContent = `All versions (${d.versions.length})`;
    versions.appendChild(sum);
    const body = document.createElement("div");
    body.innerHTML = `<table class="mini-table"><thead><tr><th>Version</th><th>Note</th></tr></thead><tbody>` +
      d.versions.map((v) => `<tr><td><code>${esc(v.v)}</code></td><td>${esc(v.note || "")}</td></tr>`).join("") +
      `</tbody></table>`;
    versions.appendChild(body);
    tr.appendChild(versions);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  wrap.appendChild(pkgCards(list));
}

function pkgCards(dlls) {
  const ids = new Set(dlls.map((d) => d.pkg));
  const wrap = document.createElement("div");
  wrap.className = "pkg-cards";
  for (const id of ids) {
    const p = PACKAGES[id];
    if (!p) continue;
    const card = document.createElement("div");
    card.className = "fix-card fix-card-sm";
    card.innerHTML = `
      <header><h4>${esc(p.name)}</h4>
        <span><a class="btn btn-sm" href="${esc(p.url64)}" target="_blank" rel="noopener">x64 ↗</a>${p.url32 ? `<a class="btn btn-sm" href="${esc(p.url32)}" target="_blank" rel="noopener">x86 ↗</a>` : ""}</span>
      </header>
      <p class="fix-note">${esc(p.note || "")}</p>`;
    wrap.appendChild(card);
  }
  return wrap;
}

/* ---------------------------------------------------------- guide tab */
function renderGuide() {
  const wrap = $("guideLatest");
  wrap.innerHTML = "";
  for (const cat of DRIVER_CATALOG) {
    const latest = cat.versions.find((v) => v.v === cat.latest);
    const card = document.createElement("article");
    card.className = "latest-card";
    card.innerHTML = `
      <header>
        <div class="latest-logo">${esc(cat.vendor.slice(0, 1))}</div>
        <div>
          <h3>${esc(cat.vendor)}</h3>
          <p>${esc(cat.name)}</p>
        </div>
        <a class="btn btn-sm" href="${esc(cat.page)}" target="_blank" rel="noopener">DOWNLOAD ↗</a>
      </header>
      <div class="latest-version"><b>${esc(cat.latest)}</b><span>${esc(fmtDate(latest?.date))} · ${esc(latest?.kind || "")}</span></div>
      <p class="fix-note">${esc(cat.dlNote)}</p>`;
    wrap.appendChild(card);
  }
  $("guideAsOf").textContent = `Vendor data compiled ${DATA_AS_OF} — always confirm the very latest build on the vendor page.`;
}

/* ------------------------------------------------------------------ boot */
function wireGlobalDrop() {
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());
}

function wireQueryLinks() {
  document.querySelectorAll("a[data-dll]").forEach((a) => {
    a.addEventListener("click", () => {
      document.querySelector('[data-tab="dll"]').click();
      const s = $("dllSearch");
      s.value = a.dataset.dll;
      renderDllLibrary();
    });
  });
}

function init() {
  initTabs();
  renderTabs();
  wireRegistryTab();
  wireZipTab();
  renderDllLibrary();
  renderGuide();
  wireGlobalDrop();
  wireQueryLinks();

  $("dllSearch").addEventListener("input", renderDllLibrary);
  $("dllPkgFilter").addEventListener("change", renderDllLibrary);

  // quick links in the intro
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => {
      document.querySelector(`[data-tab="${el.dataset.goto}"]`)?.click();
    });
  });

  if (location.hash.startsWith("#zip")) renderTabs();
}

if (typeof document !== "undefined") init();
export { readZipStreaming, ZIP_LIMITS, detectFromReg, parseReg };
