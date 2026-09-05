/** BIP-39 haiku workbench — vanilla port of shdwelf/bip39-haiku-workbench. */
import { parsePhrase, mnemonicToEntropy, randomMnemonic, WORDLIST } from "./bip39.js";
import { countSyllables, partition575, grammarScore, greedy575 } from "./syllables.js";
import {
  DEFAULT_SETTINGS,
  HUE_NAMES,
  STRETCH_NAMES,
  STROKE_SIZE_NAMES,
  encodeEnsoId,
  decodeEnsoId,
  prettyId,
  randomSettings,
  drawEnso,
  settingsSummary,
} from "./enso-id.js";

const $ = (id) => document.getElementById(id);
const PIPE_KEY = "haiku_pipe_v1";
const DELIVER_KEY = "haiku_pipe_deliveries_v1";
const VAULT_KEY = "haiku_vault_v1";
const SETTINGS_KEY = "haiku_enso_settings_v1";
const MAX_PIPES = 20;
const TYPE_META = {
  mnemonic: { icon: "🔑", name: "Mnemonic" },
  haiku: { icon: "🍃", name: "Haiku" },
  address: { icon: "🪙", name: "Address" },
  xpub: { icon: "🌳", name: "xpub" },
  json: { icon: "{}", name: "JSON" },
  text: { icon: "¶", name: "Text" },
};

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function bytesToB64(bytes) {
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveAesKey(password, salt) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey("raw", enc.encode(password || "default-vault-key"), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptJson(value, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const data = new TextEncoder().encode(JSON.stringify(value));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  const packed = new Uint8Array(1 + salt.length + iv.length + ct.length);
  packed[0] = 1;
  packed.set(salt, 1);
  packed.set(iv, 17);
  packed.set(ct, 29);
  return bytesToB64(packed);
}

async function decryptJson(cipher, password) {
  const packed = b64ToBytes(cipher);
  if (packed[0] !== 1 || packed.length < 46) throw new Error("bad vault");
  const salt = packed.slice(1, 17);
  const iv = packed.slice(17, 29);
  const ct = packed.slice(29);
  const key = await deriveAesKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plain));
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadPipes() {
  const pipes = readJson(PIPE_KEY, []);
  return Array.isArray(pipes) ? pipes.slice(0, MAX_PIPES) : [];
}

function loadDeliveries() {
  const rows = readJson(DELIVER_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function savePipes(pipes) {
  writeJson(PIPE_KEY, pipes.slice(0, MAX_PIPES));
}

function saveDeliveries(rows) {
  writeJson(DELIVER_KEY, rows);
}

function pushPipe(draft) {
  const content = draft.content ?? "";
  const pipe = {
    id: uid(),
    content,
    contentType: draft.contentType || "text",
    sourceId: draft.sourceId || "workbench",
    sourceName: draft.sourceName || "Workbench",
    label: draft.label || "piped value",
    createdAt: Date.now(),
  };
  const pipes = [pipe, ...loadPipes()].slice(0, MAX_PIPES);
  savePipes(pipes);
  return pipe;
}

function sendToTool(toolId, pipe) {
  const deliveries = loadDeliveries();
  deliveries.push({
    id: uid(),
    toolId,
    content: pipe.content ?? "",
    contentType: pipe.contentType,
    sourceName: pipe.sourceName,
    createdAt: Date.now(),
  });
  saveDeliveries(deliveries);
}

function consumeDeliveries(toolId) {
  const all = loadDeliveries();
  const mine = all.filter((d) => d.toolId === toolId);
  saveDeliveries(all.filter((d) => d.toolId !== toolId));
  return mine;
}

const state = {
  settings: { ...DEFAULT_SETTINGS },
  items: [],
  mining: false,
  cancel: false,
  tab: "enso",
};

function ensoId() {
  return encodeEnsoId(state.settings);
}

function persistSettings() {
  writeJson(SETTINGS_KEY, state.settings);
}

async function persistVault() {
  try {
    const cipher = await encryptJson(state.items, ensoId());
    writeJson(VAULT_KEY, cipher);
  } catch {
    /* ignore */
  }
}

async function restoreVault() {
  const cipher = readJson(VAULT_KEY, "");
  if (!cipher || typeof cipher !== "string") {
    state.items = [];
    return;
  }
  try {
    const items = await decryptJson(cipher, ensoId());
    state.items = Array.isArray(items) ? items : [];
  } catch {
    state.items = [];
  }
}

function setTab(id) {
  state.tab = id;
  document.querySelectorAll(".studio-tab").forEach((btn) => {
    const on = btn.dataset.panel === id;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll("[data-panel-view]").forEach((panel) => {
    const on = panel.id === `${id}Panel`;
    panel.classList.toggle("active", on);
    panel.hidden = !on;
  });
  if (id === "enso") paintEnso();
  if (id === "inbox") renderInbox();
  if (id === "wallet") renderCollection();
}

function paintEnso() {
  const canvas = $("ensoCanvas");
  if (!canvas) return;
  drawEnso(canvas, state.settings);
  const id = ensoId();
  $("ensoIdPretty").textContent = prettyId(id);
  $("ensoIdRaw").textContent = id;
  $("vaultKeyChip").textContent = prettyId(id);
  const summary = $("ensoSummary");
  summary.replaceChildren();
  for (const [k, v] of settingsSummary(state.settings)) {
    const row = document.createElement("div");
    row.innerHTML = `<span></span><b></b>`;
    row.querySelector("span").textContent = k;
    row.querySelector("b").textContent = v;
    summary.append(row);
  }
}

function bindRange(id, key, format) {
  const input = $(id);
  const out = $(`${id}Value`);
  const apply = () => {
    state.settings[key] = Number(input.value);
    if (out) out.textContent = format ? format(state.settings[key]) : String(state.settings[key]);
    persistSettings();
    paintEnso();
  };
  input.addEventListener("input", apply);
  apply();
}

function flash(node, text) {
  if (!node) return;
  node.hidden = !text;
  node.textContent = text || "";
}

async function itemFromMnemonic(mnemonic, id) {
  const words = parsePhrase(mnemonic);
  const check = await mnemonicToEntropy(words);
  if (!check.ok) return null;
  const part = partition575(words);
  const greedy = greedy575(words);
  return {
    id: "HK" + uid().replace(/-/g, "").slice(0, 6).toUpperCase(),
    mnemonic: words.join(" "),
    lines: part ? part.lines : greedy.lines.map((l) => l.join(" ")),
    counts: part ? part.counts : greedy.counts,
    grammarScore: grammarScore(words),
    ensoId: id,
    createdAt: Date.now(),
    checksum: true,
  };
}

async function mineOne(opts) {
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    if (state.cancel) return null;
    const { words } = await randomMnemonic(12);
    const part = partition575(words);
    if (!part) continue;
    const gs = grammarScore(words);
    if (opts.requireGrammar && gs < opts.grammarThreshold) continue;
    return {
      id: "HK" + uid().replace(/-/g, "").slice(0, 6).toUpperCase(),
      mnemonic: words.join(" "),
      lines: part.lines,
      counts: part.counts,
      grammarScore: gs,
      ensoId: opts.ensoId,
      createdAt: Date.now(),
      checksum: true,
    };
  }
  return null;
}

function mineAsync(opts) {
  return new Promise((resolve) => {
    let tries = 0;
    const batch = 80;
    const step = async () => {
      if (state.cancel) return resolve(null);
      const w = await mineOne({ ...opts, maxAttempts: batch });
      tries += batch;
      if (w || tries >= opts.maxAttempts) return resolve(w);
      requestAnimationFrame(step);
    };
    step();
  });
}

function renderCollection() {
  const host = $("collectionList");
  const empty = $("collectionEmpty");
  $("collectionCount").textContent = String(state.items.length);
  if (!state.items.length) {
    empty.hidden = false;
    host.replaceChildren();
    return;
  }
  empty.hidden = true;
  host.replaceChildren();
  for (const item of state.items) {
    const card = document.createElement("article");
    card.className = "haiku-card";
    card.innerHTML = `
      <header>
        <span class="mono">${item.id}</span>
        <button type="button" class="quiet" data-del>delete</button>
      </header>
      <div class="haiku-lines"></div>
      <dl>
        <div><dt>Checksum</dt><dd class="ok">valid BIP-39</dd></div>
        <div><dt>Readability</dt><dd>${item.grammarScore}/100</dd></div>
        <div><dt>Meter</dt><dd>${item.counts.join("-")}</dd></div>
      </dl>
      <details>
        <summary>reveal mnemonic</summary>
        <code></code>
      </details>
      <div class="pipe-row">
        <button type="button" data-pipe="mnemonic">Pipe mnemonic</button>
        <button type="button" data-pipe="haiku">Pipe haiku</button>
        <button type="button" data-share>Share</button>
      </div>
    `;
    const lines = card.querySelector(".haiku-lines");
    item.lines.forEach((line, i) => {
      const p = document.createElement("p");
      p.innerHTML = `<span></span> <small>(${item.counts[i] ?? 0})</small>`;
      p.querySelector("span").textContent = line;
      lines.append(p);
    });
    card.querySelector("code").textContent = item.mnemonic;
    card.querySelector("[data-del]").addEventListener("click", async () => {
      state.items = state.items.filter((row) => row.id !== item.id);
      await persistVault();
      renderCollection();
    });
    card.querySelectorAll("[data-pipe]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.dataset.pipe;
        pushPipe({
          content: kind === "haiku" ? item.lines.filter(Boolean).join("\n") : item.mnemonic,
          contentType: kind,
          sourceId: "wallet",
          sourceName: "Haiku Wallet",
          label: `${item.id} ${kind}`,
        });
        renderInbox();
        flash($("walletFlash"), `Parked ${kind} in the pipe inbox.`);
        setTimeout(() => flash($("walletFlash"), ""), 2400);
      });
    });
    card.querySelector("[data-share]").addEventListener("click", () => shareItem(item));
    host.append(card);
  }
}

function shareItem(item) {
  const text = `${item.lines.join("\n")}\n\n[${item.counts.join("-")}] · ${item.id}\nEntertainment only — not a funded wallet.`;
  const payload = { payload: { item: { id: item.id, lines: item.lines, counts: item.counts } }, info: "haiku wallet" };
  if (window.webxdc?.sendToChat) {
    window.webxdc.sendToChat({ text }).catch(() => {});
  }
  if (window.webxdc?.sendUpdate) {
    window.webxdc.sendUpdate(payload, "haiku wallet");
  }
  flash($("walletFlash"), "Shared to chat when a messenger host is present.");
  setTimeout(() => flash($("walletFlash"), ""), 2400);
}

function renderInbox() {
  const host = $("inboxList");
  const pipes = loadPipes();
  $("inboxBadge").textContent = String(pipes.length);
  if (!pipes.length) {
    host.innerHTML = `<p class="empty">Inbox empty. Park a mnemonic, haiku, or note from any tool.</p>`;
    return;
  }
  host.replaceChildren();
  for (const pipe of pipes) {
    const meta = TYPE_META[pipe.contentType] || TYPE_META.text;
    const row = document.createElement("article");
    row.className = "pipe-card";
    row.innerHTML = `
      <header>
        <span>${meta.icon} ${meta.name}</span>
        <small></small>
      </header>
      <p class="pipe-label"></p>
      <code></code>
      <div class="pipe-row">
        <button type="button" data-to="wallet">Push to wallet</button>
        <button type="button" data-to="inspector">Push to inspector</button>
        <button type="button" data-drop>Drop</button>
      </div>
    `;
    row.querySelector("small").textContent = pipe.sourceName;
    row.querySelector(".pipe-label").textContent = pipe.label;
    row.querySelector("code").textContent = pipe.content || "(empty)";
    row.querySelector("[data-drop]").addEventListener("click", () => {
      savePipes(loadPipes().filter((p) => p.id !== pipe.id));
      renderInbox();
    });
    row.querySelectorAll("[data-to]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sendToTool(btn.dataset.to, pipe);
        drainPipes();
        renderInbox();
      });
    });
    host.append(row);
  }
}

async function addMnemonic(phrase, sourceName) {
  const item = await itemFromMnemonic(phrase, ensoId());
  if (!item) {
    flash($("walletFlash"), `Received an invalid BIP-39 phrase${sourceName ? ` from ${sourceName}` : ""}.`);
    setTimeout(() => flash($("walletFlash"), ""), 2800);
    return;
  }
  if (state.items.some((row) => row.mnemonic === item.mnemonic)) return;
  state.items = [item, ...state.items];
  await persistVault();
  renderCollection();
  flash($("walletFlash"), sourceName ? `Imported a phrase from ${sourceName}.` : "Phrase folded into the vault.");
  setTimeout(() => flash($("walletFlash"), ""), 2800);
}

function drainPipes() {
  const wallet = consumeDeliveries("wallet");
  wallet.forEach((d) => {
    const phrase = String(d.content ?? "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    addMnemonic(phrase, d.sourceName);
  });
  const inspector = consumeDeliveries("inspector");
  if (inspector.length) {
    const last = inspector[inspector.length - 1];
    $("inspectInput").value = String(last.content ?? "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    analyzeInspector();
    flash($("inspectFlash"), `Received ${last.contentType} from ${last.sourceName}`);
    setTimeout(() => flash($("inspectFlash"), ""), 2600);
  }
}

async function analyzeInspector() {
  const text = $("inspectInput").value;
  const words = parsePhrase(text);
  const box = $("inspectResult");
  if (!words.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const unknown = words.filter((w) => !WORDLIST.includes(w));
  const check = words.length ? await mnemonicToEntropy(words) : { ok: false };
  const valid = unknown.length === 0 && check.ok;
  const total = words.reduce((s, w) => s + countSyllables(w), 0);
  const part = partition575(words);
  const greedy = greedy575(words);
  const isHaiku = Boolean(part) || greedy.isHaiku;
  const lines = part ? part.lines.map((l) => l.split(" ")) : greedy.lines;
  const counts = part ? part.counts : greedy.counts;
  $("inspectWords").textContent = String(words.length);
  $("inspectSyl").textContent = String(total);
  $("inspectChecksum").textContent = valid ? "valid ✓" : "invalid ✕";
  $("inspectChecksum").className = valid ? "ok" : "bad";
  $("inspectHaiku").textContent = isHaiku ? "yes ✓" : "no";
  $("inspectHaiku").className = isHaiku ? "ok" : "warn";
  const unknownNote = $("inspectUnknown");
  unknownNote.hidden = unknown.length === 0;
  unknownNote.textContent = unknown.length ? `Not in the BIP-39 wordlist: ${unknown.join(", ")}` : "";
  const lineHost = $("inspectLines");
  lineHost.replaceChildren();
  lines.forEach((line, i) => {
    const row = document.createElement("div");
    row.className = "line-row";
    row.innerHTML = `<span></span><b></b>`;
    row.querySelector("span").textContent = line.join(" ") || "—";
    row.querySelector("b").textContent = `${counts[i] || 0}/${[5, 7, 5][i]}`;
    row.querySelector("b").className = counts[i] === [5, 7, 5][i] ? "ok" : "warn";
    lineHost.append(row);
  });
}

async function forge() {
  if (state.mining) {
    state.cancel = true;
    return;
  }
  const count = Math.max(1, Math.min(20, Number($("mineCount").value) || 1));
  const requireGrammar = $("requireGrammar").checked;
  const grammarThreshold = Number($("grammarThreshold").value);
  state.mining = true;
  state.cancel = false;
  $("forgeButton").textContent = "STOP";
  $("forgeButton").classList.add("hot");
  $("mineAnim").hidden = false;
  $("mineProgress").style.width = "0%";
  let forged = 0;
  $("mineStatus").textContent = `Forging ensō & haiku… 0/${count}`;
  for (let i = 0; i < count; i++) {
    if (state.cancel) break;
    const w = await mineAsync({
      ensoId: ensoId(),
      requireGrammar,
      grammarThreshold,
      maxAttempts: 60000,
    });
    if (w) {
      state.items = [w, ...state.items];
      forged += 1;
      await persistVault();
      renderCollection();
    }
    const pct = ((i + 1) / count) * 100;
    $("mineProgress").style.width = `${pct}%`;
    $("mineStatus").textContent = `Forging ensō & haiku… ${forged}/${count}`;
  }
  state.mining = false;
  $("forgeButton").textContent = count > 1 ? `FORGE ${count} WALLETS` : "FORGE WALLET";
  $("forgeButton").classList.remove("hot");
  $("mineAnim").hidden = true;
  if (!forged) flash($("walletFlash"), "No 5-7-5 phrase found in this pass. Try again or lower the grammar gate.");
}

function exportPlain() {
  const text = state.items
    .map(
      (w, i) =>
        `#${i + 1}  id:${w.id}  ensō:${w.ensoId}\n` +
        w.lines.join("\n") +
        `\n[${w.counts.join("-")}]\n` +
        `mnemonic: ${w.mnemonic}\n`
    )
    .join("\n----------------------------------------\n");
  download(text, "haiku-wallets.txt", "text/plain");
}

async function exportEncrypted() {
  const cipher = await encryptJson(state.items, ensoId());
  const header = "# Haiku Wallet vault — AES-256-GCM. Decrypt with your Ensō ID.\n";
  download(header + cipher, "haiku-vault.txt", "text/plain");
}

function fillHueSelect() {
  const sel = $("paperHue");
  sel.replaceChildren();
  for (const h of HUE_NAMES) {
    const opt = document.createElement("option");
    opt.value = String(h.hue);
    opt.textContent = h.name;
    sel.append(opt);
  }
}

async function boot() {
  const saved = readJson(SETTINGS_KEY, null);
  if (saved && typeof saved === "object") state.settings = { ...DEFAULT_SETTINGS, ...saved };
  fillHueSelect();
  $("paperHue").value = String(state.settings.paperHue);
  $("direction").value = String(state.settings.direction);
  $("signatureStyle").value = String(state.settings.signatureStyle);
  $("brushstrokeSize").value = String(state.settings.brushstrokeSize);
  $("inkLoad").value = state.settings.inkLoad;
  $("brushSize").value = state.settings.brushSize;
  $("inkDensity").value = state.settings.inkDensity;
  $("stretch").value = state.settings.stretch;
  $("paperTexture").value = state.settings.paperTexture;
  $("bristleDensity").value = state.settings.bristleDensity;
  $("startRotation").value = state.settings.startRotation;
  $("terrainSeed").value = state.settings.seed;
  if (!/haiku\.html$/i.test(location.pathname.split("/").pop() || "")) {
    document.querySelectorAll("[data-site-only]").forEach((el) => { el.hidden = true; });
  }

  bindRange("inkLoad", "inkLoad");
  bindRange("brushSize", "brushSize");
  bindRange("inkDensity", "inkDensity");
  bindRange("stretch", "stretch", (v) => STRETCH_NAMES[v] || String(v));
  bindRange("paperTexture", "paperTexture");
  bindRange("bristleDensity", "bristleDensity");
  bindRange("startRotation", "startRotation", (v) => `${v}°`);
  bindRange("terrainSeed", "seed");

  $("paperHue").addEventListener("change", () => {
    state.settings.paperHue = Number($("paperHue").value);
    persistSettings();
    paintEnso();
  });
  $("direction").addEventListener("change", () => {
    state.settings.direction = Number($("direction").value);
    persistSettings();
    paintEnso();
  });
  $("signatureStyle").addEventListener("change", () => {
    state.settings.signatureStyle = Number($("signatureStyle").value);
    persistSettings();
    paintEnso();
  });
  $("brushstrokeSize").addEventListener("change", () => {
    state.settings.brushstrokeSize = Number($("brushstrokeSize").value);
    persistSettings();
    paintEnso();
  });

  $("randomSeed").addEventListener("click", () => {
    state.settings = randomSettings();
    $("paperHue").value = String(state.settings.paperHue);
    $("direction").value = String(state.settings.direction);
    $("signatureStyle").value = String(state.settings.signatureStyle);
    $("brushstrokeSize").value = String(state.settings.brushstrokeSize);
    $("inkLoad").value = state.settings.inkLoad;
    $("brushSize").value = state.settings.brushSize;
    $("inkDensity").value = state.settings.inkDensity;
    $("stretch").value = state.settings.stretch;
    $("paperTexture").value = state.settings.paperTexture;
    $("bristleDensity").value = state.settings.bristleDensity;
    $("startRotation").value = state.settings.startRotation;
    $("terrainSeed").value = state.settings.seed;
    for (const id of ["inkLoad", "brushSize", "inkDensity", "stretch", "paperTexture", "bristleDensity", "startRotation", "terrainSeed"]) {
      $(id).dispatchEvent(new Event("input"));
    }
    persistSettings();
    paintEnso();
  });
  $("rerollTerrain").addEventListener("click", () => {
    state.settings.seed = Math.floor(Math.random() * 65536);
    $("terrainSeed").value = state.settings.seed;
    $("terrainSeed").dispatchEvent(new Event("input"));
  });
  $("pngButton").addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = `enso-${ensoId()}.png`;
    a.href = $("ensoCanvas").toDataURL("image/png");
    a.click();
  });
  $("loadId").addEventListener("click", async () => {
    const decoded = decodeEnsoId($("idInput").value);
    if (!decoded) {
      flash($("ensoFlash"), "Invalid Ensō ID");
      setTimeout(() => flash($("ensoFlash"), ""), 2200);
      return;
    }
    state.settings = decoded;
    persistSettings();
    await restoreVault();
    location.reload();
  });

  document.querySelectorAll(".studio-tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.panel));
  });

  $("forgeButton").addEventListener("click", forge);
  $("requireGrammar").addEventListener("change", () => {
    $("grammarWrap").hidden = !$("requireGrammar").checked;
  });
  $("grammarThreshold").addEventListener("input", () => {
    $("grammarValue").textContent = $("grammarThreshold").value;
  });
  $("exportPlain").addEventListener("click", exportPlain);
  $("exportAes").addEventListener("click", exportEncrypted);
  $("clearVault").addEventListener("click", async () => {
    if (!confirm("Delete all saved haiku wallets?")) return;
    state.items = [];
    await persistVault();
    renderCollection();
  });
  $("pipeInWallet").addEventListener("click", () => {
    const pipes = loadPipes().filter((p) => p.contentType === "mnemonic" || p.contentType === "text");
    const first = pipes[0];
    if (!first) {
      flash($("walletFlash"), "No mnemonic in the inbox.");
      setTimeout(() => flash($("walletFlash"), ""), 2200);
      return;
    }
    addMnemonic(first.content, first.sourceName);
  });

  $("inspectInput").addEventListener("input", () => analyzeInspector());
  $("pipeInInspect").addEventListener("click", () => {
    const pipes = loadPipes().filter((p) => ["mnemonic", "haiku", "text"].includes(p.contentType));
    const first = pipes[0];
    if (!first) return;
    $("inspectInput").value = String(first.content ?? "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    analyzeInspector();
  });
  $("pipeOutInspect").addEventListener("click", () => {
    const text = $("inspectInput").value.trim();
    if (!text) return;
    pushPipe({
      content: text,
      contentType: "mnemonic",
      sourceId: "inspector",
      sourceName: "Mnemonic Inspector",
      label: `${parsePhrase(text).length}-word phrase`,
    });
    renderInbox();
  });

  await restoreVault();
  paintEnso();
  renderCollection();
  renderInbox();
  drainPipes();
  setTab("enso");
}

boot().catch((err) => {
  console.error(err);
  const term = $("bootError");
  if (term) {
    term.hidden = false;
    term.textContent = err.message || String(err);
  }
});
