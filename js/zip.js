/**
 * Minimal ZIP writer (STORE, or DEFLATE via stored deflate blocks).
 *
 * webxdc (.xdc) packages are plain ZIP archives, so this is what backs the
 * "WEBXDC" export button as well as the Duke3D total-conversion bundle
 * when it is handed over as a .zip alongside the .grp.
 *
 * Pure module: no DOM.
 */

import { crc32 } from "./binfmt.js";

function dosDateTime(d = new Date()) {
  const year = Math.max(1980, d.getUTCFullYear());
  const time = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  const date = ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { time, date };
}

function strBytes(s) {
  return new TextEncoder().encode(s);
}

/**
 * @param {Array<{name:string,data:Uint8Array|string,comment?:string}>} files
 * @param {object} opts { deflate?:boolean, date?:Date, comment?:string }
 * @returns {Uint8Array}
 */
export function zipFiles(files, opts = {}) {
  const useDeflate = !!opts.deflate;
  const { time, date } = dosDateTime(opts.date || new Date());
  const parts = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = strBytes(f.name);
    const raw = typeof f.data === "string" ? strBytes(f.data) : f.data;
    const crc = crc32(raw);
    let stored = raw;
    let method = 0;
    if (useDeflate) {
      stored = rawDeflate(raw); // raw DEFLATE stream of stored blocks
      method = 8;
    }
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, method, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, stored.length, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    parts.push(local, stored);

    const cen = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, method, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, stored.length, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cen.set(nameBytes, 46);
    central.push(cen);

    offset += local.length + stored.length;
  }

  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const total = offset + cdSize + end.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of parts) {
    out.set(c, p);
    p += c.length;
  }
  for (const c of central) {
    out.set(c, p);
    p += c.length;
  }
  out.set(end, p);
  return out;
}

/** Raw DEFLATE stream of stored blocks (no zlib header, no adler). */
export function rawDeflate(data) {
  const maxBlock = 65535;
  const blocks = Math.max(1, Math.ceil(data.length / maxBlock));
  const out = new Uint8Array(data.length + blocks * 5);
  let o = 0;
  for (let i = 0; i < blocks; i++) {
    const start = i * maxBlock;
    const len = Math.min(maxBlock, data.length - start);
    out[o++] = i === blocks - 1 ? 1 : 0;
    out[o++] = len & 0xff;
    out[o++] = (len >>> 8) & 0xff;
    out[o++] = ~len & 0xff;
    out[o++] = (~len >>> 8) & 0xff;
    out.set(data.subarray(start, start + len), o);
    o += len;
  }
  return out;
}
