/**
 * artifacts.js — structure dissectors for the files that contain no machine
 * code. The Ghidra engine routes MZ/NE/PE/COM images; everything else a
 * homestead throws at the lab — Flash movies, MIDIs, GIFs, JPEGs, PNGs —
 * gets walked here instead: headers, chunks, tags, tracks, comments,
 * lyrics. Same rules as the rest of the lab: parse, never execute;
 * display, never guess.
 */

/* ------------------------------------------------------------------- swf */

const SWF_TAGS = {
  0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject", 5: "RemoveObject",
  6: "DefineBits", 7: "DefineButton", 9: "SetBackgroundColor", 10: "DefineFont",
  11: "DefineText", 12: "DoAction", 13: "DefineFontInfo", 14: "DefineSound",
  15: "StartSound", 18: "SoundStreamHead", 19: "SoundStreamBlock", 20: "DefineBitsLossless",
  21: "DefineBitsJPEG2", 22: "DefineShape2", 23: "DefineButtonCXform", 24: "Protect",
  26: "PlaceObject2", 28: "RemoveObject2", 32: "DefineShape3", 33: "DefineText2",
  34: "DefineButton2", 35: "DefineBitsJPEG3", 36: "DefineBitsLossless2", 37: "DefineEditText",
  39: "DefineSprite", 41: "ProductInfo", 43: "FrameLabel", 45: "SoundStreamHead2",
  46: "DefineMorphShape", 48: "DefineFont2", 56: "ExportAssets", 57: "ImportAssets",
  58: "EnableDebugger", 59: "DoInitAction", 62: "DefineFontInfo2", 64: "EnableDebugger2",
  65: "ScriptLimits", 66: "SetTabIndex", 69: "FileAttributes", 70: "PlaceObject3",
  73: "DefineFontAlignZones", 75: "DefineFont3", 77: "MetaData", 78: "DefineScalingGrid",
  82: "DoABC", 83: "DefineShape4", 86: "DefineSceneAndFrameLabelData", 87: "DefineBinaryData",
  88: "DefineFontName", 91: "DefineFont4",
};

const SWF_ACTIONS = {
  0x00: "End", 0x04: "NextFrame", 0x05: "PreviousFrame", 0x06: "Play", 0x07: "Stop",
  0x08: "ToggleQuality", 0x09: "StopSounds", 0x0A: "Add", 0x0D: "Multiply",
  0x12: "Equals", 0x13: "Less", 0x17: "Pop", 0x18: "ToInteger", 0x1C: "GetVariable",
  0x1D: "SetVariable", 0x21: "StringAdd", 0x22: "GetProperty",
  0x23: "SetProperty", 0x26: "StringEquals", 0x29: "StringLess", 0x2D: "RandomNumber",
  0x32: "StringExtract", 0x35: "StringToNumber", 0x36: "StringValue",
  0x37: "StringLength", 0x3A: "Delete", 0x40: "NewObject", 0x45: "TypeOf",
  0x81: "GotoFrame", 0x82: "GetURL", 0x83: "StoreRegister",
  0x84: "WaitForFrame", 0x85: "SetTarget", 0x86: "GotoLabel", 0x87: "WaitForFrame2",
  0x88: "GetURL2", 0x8A: "WaitForFrame2", 0x8B: "ConstantPool", 0x8C: "GotoFrame2",
  0x8D: "DefineFunction2", 0x8F: "Try", 0x94: "With", 0x96: "Push",
  0x99: "Jump", 0x9B: "DefineFunction", 0x9D: "If", 0x9E: "Call", 0x9F: "GotoFrame2",
};

/** Read a bit-packed SWF RECT; returns { coords, endOff }. */
function swfRect(u8, off) {
  let bit = 0, byte = u8[off], nBits = byte >> 3;
  const read = (n) => {
    let v = 0;
    for (let i = 0; i < n; i++) {
      v = (v << 1) | ((byte >> (7 - bit)) & 1);
      if (++bit === 8) { bit = 0; byte = u8[++off] ?? 0; }
    }
    return v;
  };
  read(5);
  const coords = [read(nBits), read(nBits), read(nBits), read(nBits)];
  return { coords, endOff: off + (bit ? 1 : 0) };
}

/**
 * Parse an SWF. `inflate` is fflate's inflateSync (the CWS body is a zlib
 * stream after the 8-byte header). Returns null for non-SWF input.
 */
export function parseSWF(bytes, inflate) {
  const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
  if (!["FWS", "CWS", "ZWS"].includes(sig)) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = bytes[3];
  const fileLen = dv.getUint32(4, true);
  let body = bytes;
  let base = 8;                                    // FWS: rect sits after the 8-byte header
  if (sig !== "FWS") {
    if (!inflate) return { sig, version, fileLen, truncated: true };
    try { body = inflate(bytes.subarray(8)); base = 0; } catch { return { sig, version, fileLen, inflateFailed: true }; }
  }
  const { coords, endOff } = swfRect(body, base);
  const width = Math.ceil((coords[2] - coords[0]) / 20);
  const height = Math.ceil((coords[3] - coords[1]) / 20);
  const fps = dv2(body, endOff) / 256;
  const frames = dv2(body, endOff + 2);
  const tags = [];
  const actions = { count: 0, names: [], urls: [], constants: [] };
  let p = endOff + 4;
  while (p + 2 <= body.length && tags.length < 512) {
    const codeAndLen = dv2(body, p); p += 2;
    const code = codeAndLen >> 6;
    let len = codeAndLen & 0x3f;
    if (len === 0x3f) { if (p + 4 > body.length) break; len = new DataView(body.buffer, body.byteOffset, body.byteLength).getInt32(p, true); p += 4; }
    if (p + len > body.length) { tags.push({ code, name: SWF_TAGS[code] || `Tag${code}`, len, clipped: true }); break; }
    const tag = { code, name: SWF_TAGS[code] || `Tag${code}`, len };
    if (code === 43 && len > 0) tag.label = cstr(body, p);              // FrameLabel
    if (code === 24) tag.protect = len > 0 ? cstr(body, p) : "(password-protected)";
    if (code === 77) tag.meta = utf8(body.subarray(p, p + Math.min(len, 120)));
    if (code === 56 && len >= 2) {                                      // ExportAssets
      const n = dv2(body, p);
      tag.exports = [];
      let q = p + 2;
      for (let i = 0; i < Math.min(n, 8) && q < p + len; i++) { q += 2; tag.exports.push(cstr(body, q)); q = body.indexOf(0, q) + 1; }
    }
    if (code === 12 || code === 59) {                                   // DoAction / DoInitAction
      let q = p + (code === 59 ? 2 : 0);
      const end = p + len;
      while (q < end && actions.count < 4096) {
        const op = body[q++];
        if (op === 0) break;
        let oplen = 0;
        if (op >= 0x80) { if (q + 2 > end) break; oplen = dv2(body, q); q += 2; }
        actions.count++;
        const nm = SWF_ACTIONS[op] || `Action0x${op.toString(16)}`;
        if (!actions.names.includes(nm)) actions.names.push(nm);
        if (op === 0x83 && q + oplen <= end) {                          // GetURL
          const payload = body.subarray(q, q + oplen);
          const url = cstr(payload, 0);
          const t0 = payload.indexOf(0);
          const target = t0 >= 0 ? cstr(payload, t0 + 1) : "";
          actions.urls.push({ url, target });
        }
        if (op === 0x8B && q + oplen <= end) {                          // ConstantPool
          const n = dv2(body, q);
          let r = q + 2;
          for (let i = 0; i < Math.min(n, 24) && r < q + oplen; i++) {
            const s = cstr(body, r);
            actions.constants.push(s);
            r += s.length + 1;
          }
        }
        q += oplen;
      }
    }
    tags.push(tag);
    p += len;
    if (code === 0) break;
  }
  return { sig, version, fileLen, width, height, fps, frames, tags, actions, inflateBytes: body.length };
}

/* ------------------------------------------------------------------ midi */

/**
 * Parse a Standard MIDI File: header, then each track's delta-time event
 * stream (running status honored). Collects track names, tempo, program,
 * note-on counts, lyrics and text — the MIDIs on a 1999 homepage carry
 * their own liner notes.
 */
export function parseMIDI(bytes) {
  if (ascii4(bytes, 0) !== "MThd") return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const format = (bytes[8] << 8) | bytes[9];
  const ntrks = (bytes[10] << 8) | bytes[11];
  const division = (bytes[12] << 8) | bytes[13];
  const tracks = [];
  const texts = [];
  let p = 14;
  let guard = 0;
  while (p + 8 <= bytes.length && ascii4(bytes, p) === "MTrk" && tracks.length < 64) {
    const len = dv.getUint32(p + 4, false);
    const end = Math.min(p + 8 + len, bytes.length);
    const tr = { index: tracks.length, bytes: len, name: null, instrument: null, bpm: null, program: null, noteOns: 0, lyrics: [] };
    let q = p + 8, running = 0, iter = 0;
    while (q < end && iter++ < 200000) {
      if (q >= end) break;
      { let d = bytes[q++]; while ((d & 0x80) && q < end) d = bytes[q++]; } // consume varlen delta-time
      let st = bytes[q];
      if (st & 0x80) { running = st; q++; } else st = running;
      if (st === 0xff) {
        const type = bytes[q++] ?? 0;
        let mlen = 0, shift = 0;
        while (q < end && shift < 21) { const b = bytes[q++]; mlen = (mlen << 7) | (b & 0x7f); if (!(b & 0x80)) break; shift += 7; }
        const data = bytes.subarray(q, Math.min(q + mlen, end));
        if (type === 0x03 && !tr.name) tr.name = utf8(data);
        else if (type === 0x04 && !tr.instrument) tr.instrument = utf8(data);
        else if (type === 0x51 && mlen >= 3 && tr.bpm === null) tr.bpm = Math.round(60000000 / ((data[0] << 16) | (data[1] << 8) | data[2]));
        else if (type === 0x05 && tr.lyrics.length < 96) tr.lyrics.push(utf8(data));
        else if (type === 0x01 && texts.length < 32) texts.push(utf8(data));
        q += mlen;
        if (type === 0x2f) break;
      } else if (st >= 0x80) {
        const hi = st & 0xf0;
        const dlen = hi === 0xc0 || hi === 0xd0 ? 1 : 2;
        if (hi === 0xc0 && tr.program === null) tr.program = bytes[q] ?? null;
        if (hi === 0x90 && (bytes[q + 1] ?? 0) > 0) tr.noteOns++;
        q += dlen;
      } else break;
    }
    tracks.push(tr);
    p = end;
    if (++guard > 256) break;
  }
  return { format, ntrks, division, tracks, texts, p };
}

/* ---------------------------------------------------------------- images */

export function parseGIF(bytes) {
  const sig = ascii6(bytes, 0);
  if (sig !== "GIF87a" && sig !== "GIF89a") return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = dv.getUint16(6, true), height = dv.getUint16(8, true);
  const flags = bytes[10], bg = bytes[11];
  const gct = flags & 0x80 ? 2 << (flags & 7) : 0;
  const comments = [], apps = [];
  let p = 13 + gct * 3, guard = 0;
  while (p < bytes.length && guard++ < 4096) {
    const b = bytes[p++];
    if (b === 0x3b) break;
    if (b === 0x2c) { p += 9; const l = bytes[p++]; p += l * (l & 0x80 ? 3 : 0); const LZW = bytes[p++]; break /* image data: stop walking */; }
    if (b === 0x21) {
      const label = bytes[p++];
      let first = true;
      while (p < bytes.length) {
        const blen = bytes[p++];
        if (!blen) break;
        if (label === 0xfe && first) comments.push(utf8(bytes.subarray(p, p + Math.min(blen, 200))));
        if (label === 0xff && first && blen >= 11) apps.push(ascii(bytes, p, 11).trim());
        first = false;
        p += blen;
      }
    }
    // any other block: skip one byte conservatively
  }
  return { sig, width, height, gct, bg, comments, apps };
}

export function parseJPEG(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 2, width = null, height = null, sof = null, exif = false, icc = false;
  const comments = [];
  while (p + 4 <= bytes.length && bytes[p] === 0xff) {
    const marker = bytes[p + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { p += 2; continue; }
    const len = dv.getUint16(p + 2, false);
    if (marker === 0xfe && comments.length < 8) comments.push(utf8(bytes.subarray(p + 4, p + 2 + len)));
    if (marker === 0xe1) exif = true;
    if (marker === 0xe2) icc = true;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      height = dv.getUint16(p + 5, false); width = dv.getUint16(p + 7, false); sof = `SOF${marker - 0xc0}`;
      break;
    }
    p += 2 + len;
  }
  return { width, height, sof, exif, icc, comments };
}

export function parsePNG(bytes) {
  const s = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!s.every((b, i) => bytes[i] === b)) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const w = dv.getUint32(16, false), h = dv.getUint32(20, false);
  const depth = bytes[24], colorType = bytes[25];
  const texts = [];
  let p = 8;
  while (p + 8 <= bytes.length && texts.length < 16) {
    const len = dv.getUint32(p, false);
    const type = ascii4(bytes, p + 4);
    if (type === "IEND") break;
    if ((type === "tEXt" || type === "zTXt" || type === "iTXt") && len < 4096) texts.push(utf8(bytes.subarray(p + 8, p + 8 + Math.min(len, 300))).replace(/\u0000/g, " · "));
    p += 12 + len;
  }
  return { width: w, height: h, depth, colorType, texts };
}

/* ---------------------------------------------------------------- router */

/**
 * Route bytes to the right dissector. `inflate` (fflate inflateSync) is only
 * needed for compressed SWF. Returns null when nothing applies.
 */
export function dissect(bytes, inflate) {
  if (!bytes || bytes.length < 16) return null;
  const kind =
    parseSWF(bytes, inflate) ??
    (ascii4(bytes, 0) === "MThd" ? parseMIDI(bytes) : null) ??
    parseGIF(bytes) ?? parseJPEG(bytes) ?? parsePNG(bytes);
  if (!kind) return null;
  const sig = kind.sig || "";
  const type = ["FWS", "CWS", "ZWS"].includes(sig) ? "swf"
    : sig.startsWith("GIF") ? "gif"
    : kind.format !== undefined ? "midi"
    : kind.sof ? "jpeg"
    : "png";
  return { type, ...kind };
}

/* --------------------------------------------------------------- helpers */

function dv2(u8, off) { return u8[off] | (u8[off + 1] << 8); }
function ascii4(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]); }
function ascii6(b, o) { return String.fromCharCode(...b.subarray(o, o + 6)); }
function cstr(b, o) { let e = o; while (e < b.length && b[e] !== 0) e++; return utf8(b.subarray(o, e)); }
function utf8(b) { try { return new TextDecoder("utf-8", { fatal: false }).decode(b); } catch { return ""; } }
