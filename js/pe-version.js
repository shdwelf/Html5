/**
 * DriverGuide · minimal PE (portable executable) reader.
 * Pulls the version resource (RT_VERSION) out of .dll/.exe/.sys/.ocx files
 * so the ZIP reader can show a DLL's real version without running it.
 * All reads are bounds-checked; returns null instead of throwing.
 */

const u16 = (b, o) => (b[o] | (b[o + 1] << 8)) >>> 0;
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

function utf16At(b, off, wordLen) {
  let s = "";
  const max = Math.min(b.length, off + wordLen * 2);
  for (let i = off; i + 1 < max; i += 2) {
    const c = b[i] | (b[i + 1] << 8);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

/**
 * @param {Uint8Array} bytes  contents of a PE file
 * @returns {null|{fileVersion:string, productVersion:string, productName:string, fileDescription:string, companyName:string, originalFilename:string}}
 */
export function readPeVersion(bytes) {
  try {
    if (!bytes || bytes.length < 0x40) return null;
    if (bytes[0] !== 0x4d || bytes[1] !== 0x5a) return null; // "MZ"
    const peOff = u32(bytes, 0x3c);
    if (peOff + 0x18 > bytes.length) return null;
    if (bytes[peOff] !== 0x50 || bytes[peOff + 1] !== 0x45) return null; // "PE"
    const optOff = peOff + 4 + 20; // COFF header
    const magic = u16(bytes, optOff);
    if (magic !== 0x10b && magic !== 0x20b) return null;
    const numSections = u16(bytes, peOff + 4 + 2);
    const ddOff = optOff + (magic === 0x10b ? 96 : 112);
    const numDirs = u16(bytes, optOff + (magic === 0x10b ? 92 : 108));
    if (numDirs <= 2) return null;
    const resDirRva = u32(bytes, ddOff + 2 * 8);
    const resDirSize = u32(bytes, ddOff + 2 * 8 + 4);
    if (!resDirRva) return null;

    // Section table → RVA→file offset
    const secOff = optOff + (magic === 0x10b ? 224 : 240);
    const sections = [];
    for (let i = 0; i < numSections; i++) {
      const s = secOff + i * 40;
      if (s + 40 > bytes.length) break;
      sections.push({
        vsize: u32(bytes, s + 8),
        vaddr: u32(bytes, s + 12),
        rawSize: u32(bytes, s + 16),
        rawPtr: u32(bytes, s + 20),
      });
    }
    const rvaToOff = (rva) => {
      for (const s of sections) {
        if (rva >= s.vaddr && rva < s.vaddr + Math.max(s.vsize, s.rawSize)) {
          const off = s.rawPtr + (rva - s.vaddr);
          if (off + 4 <= bytes.length) return off;
        }
      }
      return null;
    };

    const resOff = rvaToOff(resDirRva);
    if (resOff === null) return null;

    // Resource directory walk: type → id → lang → data entry
    const walkDir = (off, depth) => {
      if (off + 16 > bytes.length) return null;
      const named = u16(bytes, off + 12);
      const idCount = u16(bytes, off + 14);
      const entries = named + idCount;
      for (let i = 0; i < entries; i++) {
        const e = off + 16 + i * 8;
        if (e + 8 > bytes.length) return null;
        const nameId = u32(bytes, e);
        const dataOff = u32(bytes, e + 4);
        if (nameId & 0x80000000) continue; // named entries — skip, we want numeric ids
        if (depth === 0 && nameId !== 16) continue; // RT_VERSION
        if (depth < 2) {
          const child = dataOff & 0x7fffffff;
          const r = walkDir(rvaToOff(resDirRva + child), depth + 1);
          if (r) return r;
        } else {
          const entryOff = rvaToOff(resDirRva + dataOff);
          if (entryOff === null || entryOff + 8 > bytes.length) continue;
          const dataRva = u32(bytes, entryOff);
          const size = u32(bytes, entryOff + 4);
          const voff = rvaToOff(dataRva);
          if (voff === null) continue;
          return { off: voff, size: Math.min(size, bytes.length - voff) };
        }
      }
      return null;
    };

    const ver = walkDir(resOff, 0);
    if (!ver) return null;
    const v = bytes.subarray(ver.off, ver.off + ver.size);

    // VS_FIXEDFILEINFO — find signature (word-aligned scan: real files pad
    // the VS_VERSION_INFO key to a 4-byte boundary, but some don't)
    let ffi = -1;
    for (let i = 0; i + 0x34 <= v.length; i += 2) {
      if (u32(v, i) === 0xfeef04bd) { ffi = i; break; }
    }
    if (ffi === -1) return null;
    const ms = u32(v, ffi + 8);
    const ls = u32(v, ffi + 12);
    const fileVersion = `${ms >>> 16}.${ms & 0xffff}.${ls >>> 16}.${ls & 0xffff}`;
    const pms = u32(v, ffi + 16);
    const pls = u32(v, ffi + 20);
    const productVersion = `${pms >>> 16}.${pms & 0xffff}.${pls >>> 16}.${pls & 0xffff}`;

    // StringFileInfo — walk blocks (wLength, wValueLength, wType, szKey…)
    const out = { fileVersion, productVersion, productName: null, fileDescription: null, companyName: null, originalFilename: null, fileVersionRaw: null };
    const walkStrings = (off, end) => {
      let o = off;
      while (o + 6 <= end) {
        const wlen = u16(v, o);
        if (wlen < 6 || o + wlen > end) break;
        const wvallen = u16(v, o + 2);
        const wtype = u16(v, o + 4);
        const keyStart = o + 6;
        const key = utf16At(v, keyStart, (wlen - 6) / 2).toLowerCase();
        const keyLenWords = (key.length + 1);
        let valOff = keyStart + keyLenWords * 2;
        if (valOff & 3) valOff += 4 - (valOff & 3);
        if (wtype === 1 && wvallen > 0) {
          const val = utf16At(v, valOff, wvallen);
          if (key === "filedescription" && !out.fileDescription) out.fileDescription = val;
          else if (key === "productname" && !out.productName) out.productName = val;
          else if (key === "companyname" && !out.companyName) out.companyName = val;
          else if (key === "originalfilename" && !out.originalFilename) out.originalFilename = val;
          else if (key === "fileversion" && !out.fileVersionRaw) out.fileVersionRaw = val;
        }
        o += wlen;
        if (o & 3) o += 4 - (o & 3); // blocks are DWORD aligned
      }
    };

    // Find "StringFileInfo" subtree
    let sfiOff = -1, sfiEnd = -1;
    for (let i = 0; i + 6 <= v.length; i += 4) {
      const wlen = u16(v, i);
      if (wlen < 6 || i + wlen > v.length) continue;
      if (utf16At(v, i + 6, 15).toLowerCase() === "stringfileinfo") {
        const valOff = i + 6 + 15 * 2;
        sfiOff = valOff;
        sfiEnd = Math.min(i + wlen, v.length);
        break;
      }
    }
    if (sfiOff !== -1) {
      // skip language table header
      let langOff = sfiOff;
      if (langOff + 6 <= sfiEnd) {
        const wlen = u16(v, langOff);
        const key = utf16At(v, langOff + 6, 8).toLowerCase();
        if (key.startsWith("0")) {
          let childOff = langOff + 6 + 8 * 2;
          if (childOff & 3) childOff += 4 - (childOff & 3);
          walkStrings(childOff, sfiEnd);
        } else {
          walkStrings(sfiOff, sfiEnd);
        }
      }
    }
    return out;
  } catch {
    return null;
  }
}
