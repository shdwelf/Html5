/**
 * DriverGuide · Windows registry (.reg) parser.
 * Reads REGEDIT4 / "Windows Registry Editor Version 5.00" exports.
 * Runs in batches so the UI thread stays alive even on multi-MB hive exports.
 * Never throws on malformed data — it degrades gracefully and reports stats.
 */

const REG_TYPES = [
  "REG_NONE",                    // hex(0)
  "REG_SZ",                      // hex(1)
  "REG_EXPAND_SZ",               // hex(2)
  "REG_BINARY",                  // hex(3) == hex
  "REG_DWORD",                   // hex(4)
  "REG_DWORD_BIG_ENDIAN",        // hex(5)
  "REG_LINK",                    // hex(6)
  "REG_MULTI_SZ",                // hex(7)
  "REG_RESOURCE_LIST",           // hex(8)
  "REG_FULL_RESOURCE_DESCRIPTOR",// hex(9)
  "REG_RESOURCE_REQUIREMENTS_LIST", // hex(a)
  "REG_QWORD",                   // hex(b)
];

const tick = () => new Promise((r) => setTimeout(r, 0));

function unescapeRegName(quoted) {
  return quoted
    .slice(1, -1)
    .replace(/\\\\/g, "\u0000")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\u0000/g, "\\");
}

function unescapeRegString(s) {
  return s
    .replace(/\\\\/g, "\u0000")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\0/g, "\0")
    .replace(/\u0000/g, "\\");
}

function hexToBytes(hex) {
  const clean = hex.replace(/[,\s]/g, "");
  if (!/^[0-9a-fA-F]*$/.test(clean)) return null;
  const out = new Uint8Array(clean.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function hexToUtf16(hex) {
  const b = hexToBytes(hex);
  if (!b) return null;
  let s = "";
  for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(b[i] | (b[i + 1] << 8));
  return s.replace(/\0+$/, "");
}

function hexToMulti(hex) {
  const b = hexToBytes(hex);
  if (!b) return null;
  const parts = [];
  let cur = "";
  for (let i = 0; i + 1 < b.length; i += 2) {
    const ch = b[i] | (b[i + 1] << 8);
    if (ch === 0) {
      if (cur !== "") {
        parts.push(cur);
        cur = "";
      } else if (parts.length) {
        break; // double null = end-of-list marker
      }
    } else cur += String.fromCharCode(ch);
  }
  if (cur) parts.push(cur);
  return parts.join("\n");
}

/** Human-readable decode of a parsed value (used for search + display). */
export function decodeValue(v) {
  if (v.type === "REG_DWORD") {
    const n = parseInt(v.data, 16);
    return Number.isFinite(n) ? String(n) : v.data;
  }
  if (v.type === "REG_QWORD") {
    const n = parseInt(v.data, 16);
    return Number.isFinite(n) ? String(n) : v.data;
  }
  if (v.type === "REG_BINARY" || v.type === "REG_NONE") return v.data;
  if (v.type === "REG_EXPAND_SZ" || v.type === "REG_SZ") {
    if (v.asString) return v.data; // already decoded plain text
    const s = hexToUtf16(v.data);
    return s !== null ? unescapeRegString(s) : v.data;
  }
  if (v.type === "REG_MULTI_SZ") {
    const s = hexToMulti(v.data);
    return s !== null ? s : v.data;
  }
  return v.data;
}

/**
 * Parse a .reg export. Yields to the event loop every few thousand lines.
 * @returns {{keys:Array, stats:Object}}
 */
export async function parseReg(text, onProgress) {
  const stats = { keys: 0, values: 0, skipped: 0, bytes: text.length, lines: 0 };
  const keys = [];
  let currentKey = null;
  let pending = null; // {name,type,data} — multi-line hex value
  let lineStart = 0;
  let lineNo = 0;

  const emit = (v) => {
    if (currentKey) {
      currentKey.values.push(v);
      stats.values++;
    } else stats.skipped++;
  };

  const finishPending = () => {
    if (pending) {
      emit(pending);
      pending = null;
    }
  };

  while (lineStart <= text.length) {
    let nl = text.indexOf("\n", lineStart);
    let raw;
    if (nl === -1) {
      raw = text.slice(lineStart);
      lineStart = text.length + 1;
    } else {
      raw = text.slice(lineStart, nl);
      lineStart = nl + 1;
    }
    lineNo++;
    if (raw.endsWith("\r")) raw = raw.slice(0, -1);

    if ((lineNo & 2047) === 0) {
      if (onProgress) onProgress({ phase: "parse", line: lineNo, keys: stats.keys, values: stats.values });
      await tick();
    }

    const line = raw.trim();
    stats.lines++;

    if (line === "" || line.startsWith(";")) continue;

    // Continuation of a multi-line hex value.
    if (pending) {
      pending.data += line;
      if (!line.endsWith(",")) {
        emit(pending);
        pending = null;
      }
      continue;
    }

    // Key header: [HKEY_...\...]
    if (line.startsWith("[") && line.endsWith("]") && line.length > 2) {
      finishPending();
      const path = line.slice(1, -1);
      currentKey = { path, values: [] };
      keys.push(currentKey);
      stats.keys++;
      continue;
    }

    if (!currentKey) {
      stats.skipped++;
      continue;
    }

    // Value line: "name"=... | @=...
    const vm = line.match(/^("(?:[^"\\]|\\.)*"|@)\s*=\s*(.*)$/);
    if (!vm) {
      stats.skipped++;
      continue;
    }
    const name = vm[1] === "@" ? "" : unescapeRegName(vm[1]);
    let rhs = vm[2].trim();

    const tm = rhs.match(/^(hex(?:\(([0-9a-f]+)\))?|dword|qword)\s*:\s*(.*)$/i);
    if (tm) {
      const kind = tm[1].toLowerCase();
      let type;
      if (kind === "dword") type = "REG_DWORD";
      else if (kind === "qword") type = "REG_QWORD";
      else if (kind === "hex") type = "REG_BINARY";
      else {
        const n = parseInt(tm[2], 16);
        type = REG_TYPES[n] || "REG_BINARY";
      }
      let data = (tm[3] || "").trim();
      if (data.endsWith(",")) {
        pending = { name, type, data };
      } else {
        emit({ name, type, data });
      }
    } else {
      // REG_SZ — strip the surrounding quotes, then unescape inner escapes
      let s = rhs;
      if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) s = s.slice(1, -1);
      emit({ name, type: "REG_SZ", data: unescapeRegString(s), asString: true });
    }
  }

  finishPending();
  if (onProgress) onProgress({ phase: "parse", line: lineNo, keys: stats.keys, values: stats.values, done: true });
  return { keys, stats, text };
}

/** Build a nested tree from the flat key list (for the collapsible viewer). */
export function buildTree(keys) {
  const root = { name: "(root)", path: "", children: new Map(), values: [], leaf: false };
  for (const k of keys) {
    const segs = k.path.split("\\");
    let node = root;
    let p = "";
    for (const s of segs) {
      p = p ? `${p}\\${s}` : s;
      if (!node.children.has(s)) {
        node.children.set(s, { name: s, path: p, children: new Map(), values: [], leaf: false });
      }
      node = node.children.get(s);
    }
    node.values = k.values;
  }
  return root;
}

const KEY_PATH_RE = /(HKEY_[A-Z_]+|\w*)(.*)/;

/** Root hive of a key path, e.g. HKEY_LOCAL_MACHINE\SOFTWARE → HKLM */
export function hiveOf(path) {
  const first = path.split("\\")[0] || "";
  const map = {
    "HKEY_LOCAL_MACHINE": "HKLM",
    "HKEY_CURRENT_USER": "HKCU",
    "HKEY_CLASSES_ROOT": "HKCR",
    "HKEY_USERS": "HKU",
    "HKEY_CURRENT_CONFIG": "HKCC",
    "HKEY_DYN_DATA": "HKDD",
  };
  return map[first.toUpperCase()] || first;
}

export function shortHivePath(path) {
  const segs = path.split("\\");
  if (segs.length > 1) return `${hiveOf(path)}\\…\\${segs.slice(-2).join("\\")}`;
  return path;
}
