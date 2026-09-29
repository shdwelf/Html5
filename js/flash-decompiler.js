const $ = (id) => document.getElementById(id);

const TAGS = {
  0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject", 5: "RemoveObject",
  6: "DefineBits", 7: "DefineButton", 8: "JPEGTables", 9: "SetBackgroundColor",
  10: "DefineFont", 11: "DefineText", 12: "DoAction", 13: "DefineFontInfo",
  14: "DefineSound", 15: "StartSound", 17: "DefineButtonSound", 18: "SoundStreamHead",
  19: "SoundStreamBlock", 20: "DefineBitsLossless", 21: "DefineBitsJPEG2",
  22: "DefineShape2", 26: "PlaceObject2", 28: "RemoveObject2", 32: "DefineShape3",
  33: "DefineText2", 34: "DefineButton2", 35: "DefineBitsJPEG3", 36: "DefineBitsLossless2",
  37: "DefineEditText", 39: "DefineSprite", 43: "FrameLabel", 45: "SoundStreamHead2",
  46: "DefineMorphShape", 48: "DefineFont2", 56: "ExportAssets", 57: "ImportAssets",
  58: "EnableDebugger", 59: "DoInitAction", 60: "DefineVideoStream", 61: "VideoFrame",
  62: "DefineFontInfo2", 64: "EnableDebugger2", 65: "ScriptLimits", 66: "SetTabIndex",
  69: "FileAttributes", 70: "PlaceObject3", 71: "ImportAssets2", 73: "DefineFontAlignZones",
  74: "CSMTextSettings", 75: "DefineFont3", 76: "SymbolClass", 77: "Metadata",
  78: "DefineScalingGrid", 82: "DoABC", 83: "DefineShape4", 84: "DefineMorphShape2",
  86: "DefineSceneAndFrameLabelData", 87: "DefineBinaryData", 88: "DefineFontName",
  89: "StartSound2", 90: "DefineBitsJPEG4", 91: "DefineFont4"
};

const EGGS = [
  {
    title: "Right library lamp",
    body: "Hidden passage trigger: after the palace attack setup, click the right lamp in the library. The walkthrough calls out this passage rather than a normal menu action."
  },
  {
    title: "Jail lollipops → Alia",
    body: "Post-credits bonus-time note: the palace jail contains lollipops. Talk about them with Alia to reveal the extra interaction."
  },
  {
    title: "Duncan camera stash",
    body: "In the communication room, inspect Duncan's camera. Bringing Duncan back as a ghola unlocks the larger photo set."
  },
  {
    title: "Spice Monopoly reward",
    body: "Maintain roughly a 5 tons/day average harvest to unlock the Guild Navigator reward branch. This is gameplay-hidden behind the economy, not a direct scene button."
  }
];

let targets = [];
let selected = null;

function fmtBytes(n) {
  if (!n) return "—";
  const units = ["B", "KiB", "MiB", "GiB"];
  let v = Number(n), i = 0;
  while (v > 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i ? 2 : 0)} ${units[i]}`;
}

function proxyUrl(url) {
  const preset = $("proxyPreset").value;
  if (preset === "direct") return url;
  let template = $("proxyTemplate").value.trim();
  if (preset === "corsproxy") template = "https://corsproxy.io/?{url}";
  if (preset === "allorigins") template = "https://api.allorigins.win/raw?url={url}";
  return template.includes("{url}") ? template.replace("{url}", encodeURIComponent(url)) : template + encodeURIComponent(url);
}

function renderTargets() {
  const host = $("targetList");
  host.innerHTML = "";
  $("targetCount").textContent = `${targets.length} items`;
  for (const t of targets) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `target${selected?.id === t.id ? " on" : ""}`;
    btn.innerHTML = `<b>${t.label}</b><small>${t.date} · ${t.family}</small><span class="badges"><span class="badge">${t.source}</span>${t.nsfw ? '<span class="badge nsfw">NSFW</span>' : ''}<span class="badge">${fmtBytes(t.bytes)}</span></span>`;
    btn.addEventListener("click", () => {
      selected = t;
      $("activeUrl").value = t.url;
      renderTargets();
      setStatus("selected");
      $("output").textContent = `${t.label}\n\n${t.notes}\n\nURL:\n${t.url}`;
      renderStats({ target: t });
    });
    host.appendChild(btn);
  }
}

function renderTimeline() {
  const host = $("timeline");
  host.innerHTML = "";
  for (const t of [...targets].sort((a, b) => a.sort.localeCompare(b.sort))) {
    const el = document.createElement("article");
    el.className = "event";
    el.innerHTML = `<div class="date">${t.date}</div><div class="card"><b>${t.label}</b><p>${t.notes}</p><div class="badges"><span class="badge">${t.family}</span>${t.nsfw ? '<span class="badge nsfw">NSFW</span>' : ''}</div></div>`;
    host.appendChild(el);
  }
}

function renderEggs() {
  const host = $("eggs");
  host.innerHTML = EGGS.map((e) => `<article class="egg"><b>${e.title}</b><p>${e.body}</p></article>`).join("");
}

function setStatus(text) { $("status").textContent = text; }

function renderStats(data = {}) {
  const t = data.target || selected || {};
  const stats = [
    ["target", t.id || "—"],
    ["bytes", data.bytes ? fmtBytes(data.bytes) : fmtBytes(t.bytes)],
    ["signature", data.signature || "—"],
    ["tags", data.tagCount ?? "—"]
  ];
  $("stats").innerHTML = stats.map(([k, v]) => `<div class="stat"><small>${k}</small><b>${v}</b></div>`).join("");
}

function readU16(dv, off) { return dv.getUint16(off, true); }
function readU32(dv, off) { return dv.getUint32(off, true); }

function bits(bytes, bitIndex, count) {
  let value = 0;
  for (let i = 0; i < count; i++) {
    const bi = bitIndex + i;
    const b = bytes[bi >> 3];
    const bit = (b >> (7 - (bi & 7))) & 1;
    value = (value << 1) | bit;
  }
  return value;
}

function parseRect(bytes, start = 0) {
  const nbits = bits(bytes, start, 5);
  let p = start + 5;
  const xmin = bits(bytes, p, nbits); p += nbits;
  const xmax = bits(bytes, p, nbits); p += nbits;
  const ymin = bits(bytes, p, nbits); p += nbits;
  const ymax = bits(bytes, p, nbits); p += nbits;
  return { xmin, xmax, ymin, ymax, bytes: Math.ceil(p / 8) };
}

async function inflateCws(buf) {
  if (!("DecompressionStream" in window)) throw new Error("This browser does not expose DecompressionStream; use the GitHub FFDec workflow for compressed SWFs.");
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([buf.slice(8)]).stream().pipeThrough(ds);
  const body = await new Response(stream).arrayBuffer();
  const out = new Uint8Array(8 + body.byteLength);
  out.set(new Uint8Array(buf.slice(0, 8)), 0);
  out[0] = "F".charCodeAt(0);
  out.set(new Uint8Array(body), 8);
  return out.buffer;
}

function asciiStrings(bytes) {
  const text = Array.from(bytes, (b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "\n")).join("");
  return [...text.matchAll(/[ -~]{5,}/g)].map((m) => m[0]);
}

function parseTags(bytes, start) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = start;
  const tags = [];
  const counts = new Map();
  while (off + 2 <= bytes.length && tags.length < 20000) {
    const codeAndLen = readU16(dv, off); off += 2;
    const code = codeAndLen >> 6;
    let len = codeAndLen & 0x3f;
    if (len === 0x3f) { if (off + 4 > bytes.length) break; len = readU32(dv, off); off += 4; }
    const dataOff = off;
    const name = TAGS[code] || `Tag${code}`;
    counts.set(name, (counts.get(name) || 0) + 1);
    if (tags.length < 240) tags.push({ code, name, len, off: dataOff });
    off += len;
    if (code === 0 || off > bytes.length) break;
  }
  return { tags, counts, parsedBytes: off };
}

async function parseSwf(buf) {
  const raw = new Uint8Array(buf);
  if (raw.length < 12) throw new Error("Too short for SWF header");
  let signature = String.fromCharCode(raw[0], raw[1], raw[2]);
  const version = raw[3];
  const declaredLen = readU32(new DataView(buf), 4);
  let bytes = raw;
  if (signature === "CWS") {
    const inflated = await inflateCws(buf);
    bytes = new Uint8Array(inflated);
    signature = "CWS→FWS";
  } else if (signature === "ZWS") {
    throw new Error("ZWS/LZMA SWF: use the GitHub FFDec workflow; browser decompression is not implemented here.");
  } else if (signature !== "FWS") {
    throw new Error(`Not an SWF signature: ${signature}`);
  }

  const rect = parseRect(bytes, 8);
  let off = 8 + rect.bytes;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const frameRateFixed = readU16(dv, off); off += 2;
  const frameCount = readU16(dv, off); off += 2;
  const width = Math.round((rect.xmax - rect.xmin) / 20);
  const height = Math.round((rect.ymax - rect.ymin) / 20);
  const frameRate = ((frameRateFixed >> 8) + ((frameRateFixed & 0xff) / 256)).toFixed(2);
  const tagInfo = parseTags(bytes, off);
  const strings = asciiStrings(bytes).filter((s) => /https?:|getURL|Behind|Dune|Balsamique|Patreon|lollipop|camera|library|jessica|duncan|alia|spice/i.test(s)).slice(0, 160);
  return { signature, version, declaredLen, actualLen: raw.length, inflatedLen: bytes.length, width, height, frameRate, frameCount, ...tagInfo, strings };
}

async function fetchSelected() {
  const url = $("activeUrl").value.trim();
  if (!url) return;
  if (selected?.nsfw && !$("allowNsfw").checked) {
    setStatus("blocked");
    $("output").textContent = "NSFW target blocked. Enable the checkbox to fetch metadata/binary through the selected proxy.";
    return;
  }
  setStatus("fetching");
  renderStats({ target: selected });
  const finalUrl = proxyUrl(url);
  try {
    const res = await fetch(finalUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buf = await res.arrayBuffer();
    setStatus("parsing");
    const parsed = await parseSwf(buf);
    const topTags = [...parsed.counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
    renderStats({ target: selected, bytes: parsed.actualLen, signature: parsed.signature, tagCount: parsed.tags.length });
    $("output").textContent = [
      `URL: ${url}`,
      `Fetched via: ${finalUrl}`,
      `Signature: ${parsed.signature}`,
      `Version: ${parsed.version}`,
      `Declared length: ${fmtBytes(parsed.declaredLen)} (${parsed.declaredLen})`,
      `Fetched length: ${fmtBytes(parsed.actualLen)} (${parsed.actualLen})`,
      `Inflated length: ${fmtBytes(parsed.inflatedLen)} (${parsed.inflatedLen})`,
      `Stage: ${parsed.width}×${parsed.height} · ${parsed.frameRate} fps · ${parsed.frameCount} frames`,
      "",
      "Top tags:",
      ...topTags.map(([name, count]) => `  ${String(count).padStart(5)}  ${name}`),
      "",
      "First parsed tags:",
      ...parsed.tags.slice(0, 80).map((t) => `  @0x${t.off.toString(16).padStart(8, "0")}  ${String(t.len).padStart(7)}  ${t.name} (${t.code})`),
      "",
      "Interesting printable runs:",
      ...(parsed.strings.length ? parsed.strings.map((s) => `  ${s}`) : ["  —"])
    ].join("\n");
    setStatus("parsed");
  } catch (err) {
    setStatus("error");
    $("output").textContent = `Fetch/parse failed: ${err.message || err}\n\nTry a different CORS proxy, or run the GitHub FFDec workflow for this target.`;
  }
}

function workflowUrls() {
  return targets.filter((t) => t.url && (t.url.endsWith(".swf") || t.url.includes(".swf"))).map((t) => `${t.id}\t${t.url}`).join("\n");
}

async function boot() {
  const res = await fetch("./data/flash-decompiler-targets.json");
  targets = await res.json();
  selected = targets[0];
  $("activeUrl").value = selected.url;
  renderTargets();
  renderTimeline();
  renderEggs();
  renderStats({ target: selected });

  $("proxyPreset").addEventListener("change", () => {
    const preset = $("proxyPreset").value;
    if (preset === "direct") $("proxyTemplate").value = "";
    if (preset === "corsproxy") $("proxyTemplate").value = "https://corsproxy.io/?{url}";
    if (preset === "allorigins") $("proxyTemplate").value = "https://api.allorigins.win/raw?url={url}";
  });
  $("fetchBtn").addEventListener("click", fetchSelected);
  $("copyWorkflow").addEventListener("click", async () => {
    await navigator.clipboard?.writeText(workflowUrls()).catch(() => {});
    $("workflowHint").textContent = workflowUrls();
  });
}

boot().catch((err) => {
  setStatus("boot error");
  $("output").textContent = err.stack || String(err);
});
