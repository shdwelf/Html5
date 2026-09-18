/* CHIPWRIGHT · cw-firmware.js — the dump analysis engine.
 *
 * Input: bytes from a flash reader, a POST capture, or a device dump.
 * Output: a report that says what the file is, what is in it, where it is
 * damaged, and what that damage means for a repair.
 *
 * The governing rule of this module is that a parser must never present an
 * inferred field as a read one. Where a value could not be verified it is
 * labelled as such, and where a signature matched but the surrounding structure
 * does not hold together, the report says so instead of continuing the parse.
 */

import {
  u32, hex, bin, rd, crc32, CRC32_CHECK, entropy, bytesToHex, hexToBytes,
  SIGNATURES, scanSignatures, parseUimage, decodeRdid, labelSize,
  UIMAGE_MAGIC, SPI_VENDOR_BY_ID,
} from "./cw-data.js";
import {
  IFD_SIGNATURE, IFD_LAYOUT, IFD_REGIONS, FV_FILESYSTEM_GUID_BYTES,
  FV_FILESYSTEM2_GUID_BYTES, FV_HEADER, FV_FILE_TYPES, FV_SECTION_TYPES,
  GPT_HEADER, MBR_LAYOUT, VARIABLE_STORE_SIGNATURES,
} from "./cw-data-uefi.js";
import { analyseCapacity, factorSummary } from "./cw-prime.js";

/* ------------------------------------------------------------------ *
 * 1. Dump hygiene — the checks that run before any parsing
 * ------------------------------------------------------------------ */

/**
 * Is this dump trustworthy? A corrupt dump written back is how a repairable
 * board becomes unrepairable, so this runs first and its verdict gates
 * everything below it.
 */
export function dumpHygiene(bytes) {
  const n = bytes.length;
  const findings = [];
  const push = (severity, what, why) => findings.push({ severity, what, why });

  if (n === 0) return { ok: false, findings: [{ severity: "fatal", what: "empty file", why: "Nothing to analyse." }] };

  // Byte histogram, used for three separate checks below.
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[bytes[i]]++;
  const distinct = hist.reduce((c, v) => c + (v ? 1 : 0), 0);

  // 1. Truncated capacity
  const cap = analyseCapacity(n);
  if (!cap.ok) push("fatal", "capacity is not an integer byte count", cap.note);
  else if (!cap.isPowerOfTwo) push("info", `length ${n} B is not a power of two (${cap.factorBytes})`,
    "That is normal for a 3 MiB / 24 Mbit part, but it means there is no wrap mask and a short read cannot be detected from the length alone. Confirm the real capacity from the device, not from this file.");

  // 2. Suspiciously uniform
  if (distinct <= 2) push("fatal", `the whole file uses only ${distinct} distinct byte value(s)`,
    distinct === 1
      ? `Every byte is 0x${bytes[0].toString(16).padStart(2, "0").toUpperCase()}. ${bytes[0] === 0xff ? "That is an erased flash or a chip that never drove MISO — see the 'flash reads 0xFF' symptom. A dump of all 0xFF is not a dump." : bytes[0] === 0x00 ? "That is a chip held low, a reversed SO/SI, or a programmer pin-map error. See the 'flash reads 0x00' symptom." : "A non-FF, non-00 uniform value means the bus is parked at a level, not that the device answered."}`
      : "Two-value content across a whole device is a bus fault, not data.");

  // 3. Trailing erasure — where an image that is smaller than the chip ends
  let tailStart = n;
  while (tailStart > 0 && bytes[tailStart - 1] === 0xff) tailStart--;
  const tailFF = n - tailStart;
  if (tailFF > 0 && tailFF < n) {
    const pct = (tailFF / n) * 100;
    if (pct > 5) push("info", `the last ${tailFF} B (${pct.toFixed(1)}%) are 0xFF`,
      "Either the image is smaller than the device (normal — the unused tail is left erased) or the read stopped early (a fault). Distinguish them by checking whether the structures found below end cleanly before the 0xFF run. A firmware volume whose FvLength stops exactly at the run boundary is the normal case.");
  }

  // 4. Leading padding
  let headEnd = 0;
  while (headEnd < n && bytes[headEnd] === 0xff) headEnd++;
  if (headEnd > 0 && headEnd < n) push("warn", `the first ${headEnd} B are 0xFF`,
    "A firmware image that does not start at offset 0 is unusual on SPI NOR. On Intel platforms it is normal for the BIOS region to sit at a descriptor-defined offset — check for the Intel Flash Descriptor signature before treating this as padding.");

  // 5. Entropy map, in 64 KiB windows
  const win = 65536;
  const windows = [];
  for (let off = 0; off < n; off += win) {
    const end = Math.min(off + win, n);
    const h = entropy(bytes, off, end);
    windows.push({ off, end, len: end - off, entropy: h });
  }
  const highEnt = windows.filter((w) => w.entropy > 7.5).length;
  const zeroEnt = windows.filter((w) => w.entropy < 0.5).length;
  if (highEnt > windows.length * 0.6) push("info", `${highEnt}/${windows.length} windows have entropy > 7.5 bits/byte`,
    "Most of the file is compressed or encrypted. That is expected for a modern firmware image, and it also means signature scanning will find very little — the structures are inside a compressed volume and have to be decompressed before they can be seen.");
  if (zeroEnt > 0 && zeroEnt < windows.length) push("info", `${zeroEnt} window(s) are near-uniform`,
    "Blank regions inside an otherwise populated image. Normal for reserved areas and for the tail of a BIOS region.");

  // 6. Repeated-block detection: identical 4 KiB blocks are filler, and a
  //    long run of them is where a partial write shows up.
  const seen = new Map();
  const dupBlocks = [];
  const blk = 4096;
  for (let off = 0; off + blk <= n; off += blk) {
    let h = 2166136261 >>> 0;
    for (let i = off; i < off + blk; i += 7) { h ^= bytes[i]; h = Math.imul(h, 16777619) >>> 0; }
    h ^= blk; h = Math.imul(h, 16777619) >>> 0;
    const key = h >>> 0;
    if (seen.has(key)) dupBlocks.push({ off, first: seen.get(key) });
    else seen.set(key, off);
  }
  if (dupBlocks.length > 4) push("info", `${dupBlocks.length} repeated 4 KiB block(s)`,
    "Identical blocks are usually filler or a repeated structure. A run of them in the middle of an image can also be the signature of a write that restarted from a checkpoint.");

  const fatal = findings.some((f) => f.severity === "fatal");
  return {
    ok: !fatal,
    length: n,
    distinctBytes: distinct,
    entropyOverall: entropy(bytes),
    windows,
    findings,
    verdict: fatal
      ? "This dump is not usable. The findings above are fatal — do not write this file to a device and do not treat its contents as evidence about the board."
      : findings.length
        ? `The dump is structurally plausible. ${findings.length} note(s) recorded; read them before trusting any single parse below.`
        : "The dump passes every hygiene check: real content, non-trivial entropy, and a length consistent with a device capacity.",
  };
}

/* ------------------------------------------------------------------ *
 * 2. Intel Flash Descriptor — locate and carve
 * ------------------------------------------------------------------ */

export function findIfd(bytes) {
  const hits = [];
  // The signature is 5A A5 F0 0F little-endian at 0x10 from the descriptor
  // start, so scanning for the byte pattern is equivalent and cheap.
  const pat = [0x5a, 0xa5, 0xf0, 0x0f];
  for (let i = 0; i + 4 <= bytes.length; i++) {
    if (bytes[i] === pat[0] && bytes[i + 1] === pat[1] && bytes[i + 2] === pat[2] && bytes[i + 3] === pat[3]) hits.push(i);
  }
  if (!hits.length) return { found: false, note: "No Intel Flash Descriptor signature (5A A5 F0 0F) anywhere in the file. Either this is not an Intel-platform full dump, or the descriptor region was not read." };
  const off = hits[0];
  return {
    found: true,
    offsets: hits,
    signatureOffset: off,
    descriptorStart: off - IFD_LAYOUT.signatureOffset,
    note: hits.length > 1
      ? `Signature found at ${hits.length} offsets: ${hits.slice(0, 8).map((h) => hex(h)).join(", ")}. Only one is the real descriptor; the others are data that happens to match. The real one is the first, and it is only valid if the descriptor starts at offset 0 of the dump.`
      : `Signature at ${hex(off)}, so the descriptor starts at ${hex(off - IFD_LAYOUT.signatureOffset)}.`,
    atDumpStart: off === IFD_LAYOUT.signatureOffset,
    ev: "tool",
  };
}

/**
 * Carve regions from a descriptor. The region base/limit pairs are block
 * numbers scaled by 4 KiB (the descriptor's own granularity on every platform
 * this has been observed on), so a region spans
 *   [base << 12, (limit << 12) | 0xFFF]
 * inclusive — which is why the length formula has the |0xFFF and the +1.
 *
 * IMPORTANT: the offsets below are the ones this module will read, and they are
 * tagged "tool" because they come from ifdtool/flashrom's implementation rather
 * than from a published Intel document. Intel's descriptor spec is under NDA;
 * the open implementation is the authority everyone actually uses.
 */
/**
 * Carve regions from a descriptor.
 *
 * Layout used here, taken from coreboot's ifdtool and flashrom's ichspi driver
 * because Intel's own descriptor specification is not public:
 *
 *   +0x10  signature 5A A5 F0 0F
 *   +0x20  FLMAP0 — component section
 *   +0x24  FLMAP1 — bits[11:4] give FRBA (the region section offset, in 16-byte
 *                   units), bits[26:24] give NR (number of regions minus one)
 *   FRBA   FLREG0..7, each 4 bytes: bits[15:0] base, bits[31:16] limit, both in
 *          4 KiB blocks. Byte span = [base<<12, (limit<<12)|0xFFF] inclusive.
 *
 * Every decoded region is validated before it is returned: non-negative length,
 * inside the file, and not overlapping a previously accepted region. A layout
 * that fails validation is reported as a failure with the reason, rather than
 * emitted as plausible-looking numbers. ev: "tool".
 */
export function carveIfdRegions(bytes, { descriptorStart = 0 } = {}) {
  const base = descriptorStart;
  if (base < 0 || base + 0x30 > bytes.length) {
    return { ok: false, regions: [], ev: "tool",
      note: `Descriptor start ${hex(base)} leaves no room for the map section in a ${bytes.length}-byte file.` };
  }
  const flmap0 = rd.u32le(bytes, base + 0x20);
  const flmap1 = rd.u32le(bytes, base + 0x24);
  const frba = ((flmap1 >>> 4) & 0xff) * 0x10;
  const nr = ((flmap1 >>> 24) & 0x7) + 1;
  const fcba = ((flmap0 >>> 4) & 0xff) * 0x10;
  // NC is bits 25:24, NOT bits 9:8. Bits 11:4 already hold FCBA, so reading NC
  // from 9:8 aliases it against the component base and returns a component
  // count derived from the address — which is how a descriptor with a perfectly
  // good layout ends up reporting the wrong number of components. This matches
  // coreboot's ifdtool: `nc = ((flmap0 & 0x03000000) >> 24) + 1`.
  const nc = ((flmap0 >>> 24) & 0x3) + 1;

  const reject = (why) => ({
    ok: false, regions: [], ev: "tool",
    flmap0: hex(flmap0), flmap1: hex(flmap1), frba: hex(frba), nr, fcba: hex(fcba), nc,
    note: `${why} The field offsets used here come from coreboot's ifdtool, are tagged "tool", and differ between ICH/PCH generations. Confirm the decode against ifdtool's own output for this exact platform before carving anything by hand.`,
  });

  if (frba === 0 || frba + nr * 4 > bytes.length) return reject(`FLMAP1 ${hex(flmap1)} decodes to a region section at ${hex(frba)} for ${nr} regions, which falls outside the file.`);

  const regions = [];
  let prevEnd = -1;
  for (let i = 0; i < nr && i < IFD_REGIONS.length; i++) {
    const word = rd.u32le(bytes, frba + i * 4);
    const blkBase = word & 0xffff;
    const blkLimit = (word >>> 16) & 0xffff;
    if (blkBase === 0xffff && blkLimit === 0) continue; // unpopulated slot
    const lo = (blkBase << 12) >>> 0;
    const hi = (((blkLimit << 12) | 0xfff) >>> 0);
    const len = hi >= lo ? hi - lo + 1 : 0;
    const problems = [];
    if (blkLimit < blkBase) problems.push("limit < base");
    if (hi >= bytes.length) problems.push(`extends past end of file (dump is ${bytes.length} B)`);
    if (lo < prevEnd) problems.push(`overlaps the previous region, which ended at ${hex(prevEnd)}`);
    regions.push({
      index: i,
      name: IFD_REGIONS[i].name,
      what: IFD_REGIONS[i].what,
      base: lo, limit: hi, length: len,
      baseHex: hex(lo), limitHex: hex(hi), lengthLabel: len >= 1048576 ? `${(len / 1048576).toFixed(len % 1048576 ? 2 : 0)} MiB` : `${len} B`,
      raw: hex(word),
      inRange: hi < bytes.length,
      problems,
      ev: "tool",
    });
    prevEnd = hi + 1;
  }

  const bad = regions.filter((r) => r.problems.length);
  return {
    ok: regions.length > 0 && !bad.length,
    regions, frba, nr, fcba, nc, ev: "tool",
    flmap0: hex(flmap0), flmap1: hex(flmap1),
    note: regions.length === 0
      ? "Region section decoded but every slot is unpopulated."
      : bad.length
        ? `Decoded ${regions.length} region(s) but ${bad.length} failed validation: ${bad.map((b) => `${b.name} (${b.problems.join("; ")})`).join(", ")}. Do not carve from this until the layout is confirmed for the platform.`
        : `Decoded ${regions.length} non-overlapping region(s), all inside the file. Component section at ${hex(fcba)} for ${nc} component(s).`,
  };
}

/**
 * The region-safety rule, stated plainly, because it is the one that stops
 * people cloning boards.
 */
export const REGION_SAFETY = [
  { region: "BIOS", cloneable: "yes, with care", why: "This is the firmware itself. Two boards of the same model and revision can share it." },
  { region: "Descriptor", cloneable: "NO", why: "It carries the flash geometry and, on many platforms, board-specific data. A cloned descriptor can point the firmware at regions that do not exist on this board." },
  { region: "GbE", cloneable: "NO", why: "It holds the MAC address. Writing another board's GbE region puts two machines with the same identity on the same network, which produces exactly the symptoms people blame on a bad firmware flash: DHCP confusion, ARP flapping, sessions dropping at random." },
  { region: "ME", cloneable: "NO without re-provisioning", why: "The Management Engine region carries per-platform state and, on vPro parts, provisioning. A cloned ME region can leave the platform unprovisioned, in a recovery countdown, or refusing to boot. Cleaning the ME region is a documented procedure with vendor tooling; copying someone else's is not." },
  { region: "PDR / EC / vendor", cloneable: "NO", why: "Board- and controller-specific by definition." },
];

/* ------------------------------------------------------------------ *
 * 3. UEFI Firmware Volume walk
 * ------------------------------------------------------------------ */

function bytesMatch(bytes, off, pattern) {
  if (off < 0 || off + pattern.length > bytes.length) return false;
  for (let i = 0; i < pattern.length; i++) if (bytes[off + i] !== pattern[i]) return false;
  return true;
}

/** Scan for FV headers: 16 zero bytes, a filesystem GUID, then '_FVH' at +0x28. */
export function findFirmwareVolumes(bytes, { maxHits = 64 } = {}) {
  const hits = [];
  for (let i = 0; i + 0x48 <= bytes.length && hits.length < maxHits; i += 4) {
    let zero = true;
    for (let k = 0; k < 16; k++) if (bytes[i + k]) { zero = false; break; }
    if (!zero) continue;
    const isFs1 = bytesMatch(bytes, i + 0x10, FV_FILESYSTEM_GUID_BYTES);
    const isFs2 = bytesMatch(bytes, i + 0x10, FV_FILESYSTEM2_GUID_BYTES);
    if (!isFs1 && !isFs2) continue;
    if (!(bytes[i + 0x28] === 0x5f && bytes[i + 0x29] === 0x46 && bytes[i + 0x2a] === 0x56 && bytes[i + 0x2b] === 0x48)) continue;
    const fvLen = readU64lo(bytes, i + 0x20);
    const hdrLen = rd.u16le(bytes, i + 0x30);
    const attrs = rd.u32le(bytes, i + 0x2c);
    // Header checksum: the 16-bit words of the header sum to zero.
    let sum = 0;
    const words = Math.min(hdrLen, 0x200) >> 1;
    for (let w = 0; w < words; w++) sum = (sum + rd.u16le(bytes, i + w * 2)) & 0xffff;
    hits.push({
      offset: i,
      offsetHex: hex(i),
      fsGuid: isFs2 ? "FIRMWARE_FILE_SYSTEM2" : "FIRMWARE_FILE_SYSTEM",
      length: fvLen,
      lengthHex: hex(fvLen),
      headerLength: hdrLen,
      attributes: attrs,
      attributesHex: hex(attrs, 4),
      erasePolarityFF: !!(attrs & (1 << 11)),
      checksumOk: sum === 0,
      checksumSum: sum,
      inRange: i + fvLen <= bytes.length,
      plausible: fvLen >= 0x48 && (fvLen % 8 === 0) && i + fvLen <= bytes.length,
      ev: "std",
    });
  }
  return { count: hits.length, volumes: hits,
    note: hits.length === 0
      ? "No UEFI firmware volume found. Either this is not a UEFI image, or every volume is inside a compressed GUID_DEFINED section and has to be decompressed before it can be seen."
      : `${hits.length} volume header(s) matched. ${hits.filter((h) => !h.checksumOk).length} have a bad header checksum and ${hits.filter((h) => !h.plausible).length} have an implausible length — those are probably false matches or damaged headers, not volumes.` };
}

/** Read the low 32 bits of a u64 little-endian field (enough for any real FV). */
function readU64lo(bytes, off) { return rd.u32le(bytes, off); }

/** Walk the FFS files inside one volume. */
export function walkFvFiles(bytes, fv) {
  const files = [];
  if (!fv || !fv.plausible) return { ok: false, files, note: "Volume header is not plausible; refusing to walk into it." };
  let off = fv.offset + fv.headerLength;
  const end = fv.offset + fv.length;
  const erased = fv.erasePolarityFF ? 0xff : 0x00;
  while (off + 24 <= end && off + 24 <= bytes.length && files.length < 4096) {
    // A file header is 24 bytes; three 0xFF (or 0x00) bytes of state/type area
    // means free space, and the walk skips to the next 8-byte boundary.
    const h0 = bytes[off], h1 = bytes[off + 1], h2 = bytes[off + 2];
    if (h0 === erased && h1 === erased && h2 === erased) { off += 8; continue; }
    const type = bytes[off + 18];
    // Size is a 24-bit field at +20..+22.
    const size = bytes[off + 20] | (bytes[off + 21] << 8) | (bytes[off + 22] << 16);
    if (size < 24 || off + size > end) {
      files.push({ offset: off, type, typeName: fvFileTypeName(type), size, truncated: true,
        note: `Declared size ${size} runs past the end of the volume — the file header is damaged or the walk has lost sync.` });
      break;
    }
    // EFI_FFS_FILE_HEADER is 24 bytes: Name GUID[16], IntegrityCheck{Header,File}
    // at +0x10, Type at +0x12, Attributes at +0x13, Size[3] at +0x14, State at +0x17.
    const state = bytes[off + 23];
    const attrs = bytes[off + 19];
    const sections = walkFvSections(bytes, off + 24, off + size);
    const nameSection = sections.find((s) => s.type === 0x15);
    files.push({
      offset: off, offsetHex: hex(off),
      guid: guidString(bytes, off),
      type, typeName: fvFileTypeName(type),
      size, sizeHex: hex(size),
      attributes: attrs,
      attributesHex: hex(attrs, 2),
      dataChecksumValid: !!(attrs & 0x40),
      headerChecksum: bytes[off + 0x10],
      fileChecksum: bytes[off + 0x11],
      state, stateHex: hex(state, 2),
      stateMeaning: ffsStateMeaning(state, fv.erasePolarityFF),
      sections,
      name: nameSection ? nameSection.utf16 : null,
      ev: "std",
    });
    off += size;
    if (off % 8) off += 8 - (off % 8); // FFS files are 8-byte aligned
  }
  return { ok: true, files, note: `${files.length} file(s) walked; ${files.filter((f) => f.truncated).length} truncated.` };
}

/**
 * The FFS state byte is not a value, it is a set of bits that get cleared in a
 * fixed order as a variable/file is committed, and the erase polarity decides
 * which level means "still set". Reading it as a number is the mistake; reading
 * it as "how far through the write did this get" is the point.
 */
export function ffsStateMeaning(state, eraseFF = true) {
  const bits = [
    { bit: 0x01, name: "HEADER_VALID", meaning: "The header has been written." },
    { bit: 0x02, name: "DATA_VALID", meaning: "The file data has been written and its checksum is valid." },
    { bit: 0x04, name: "IN_DELETED_TRANSITION", meaning: "Being replaced; a valid copy exists elsewhere in the volume." },
    { bit: 0x08, name: "DELETED", meaning: "Logically gone, physically still present until the volume is reclaimed." },
  ];
  // In an erase-to-FF volume, a bit that is still 1 has NOT been cleared, so it
  // is still "asserted" in the logical sense used by the spec tables.
  const set = bits.filter((b) => eraseFF ? (state & b.bit) : !(state & b.bit));
  return set.length ? set.map((b) => b.name).join(" | ") : (eraseFF ? "fully written / all state bits cleared" : "erased");
}

export function fvFileTypeName(t) {
  const f = FV_FILE_TYPES.find((x) => x.type === t);
  return f ? f.name : `unknown 0x${t.toString(16).toUpperCase().padStart(2, "0")}`;
}
export function fvSectionTypeName(t) {
  const s = FV_SECTION_TYPES.find((x) => x.type === t);
  return s ? s.name : `unknown 0x${t.toString(16).toUpperCase().padStart(2, "0")}`;
}

export function walkFvSections(bytes, start, end) {
  const out = [];
  let off = start;
  while (off + 4 <= end && off + 4 <= bytes.length && out.length < 64) {
    const size = bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16);
    const type = bytes[off + 3];
    if (size < 4 || off + size > end) break;
    const rec = { offset: off, type, typeName: fvSectionTypeName(type), size, dataOffset: off + 4, dataLength: size - 4, ev: "std" };
    if (type === 0x15) {
      // USER_INTERFACE: UCS-2 name.
      let s = "";
      for (let i = off + 4; i + 1 < off + size && i + 1 < bytes.length; i += 2) {
        const c = bytes[i] | (bytes[i + 1] << 8);
        if (!c) break;
        s += String.fromCharCode(c);
      }
      rec.utf16 = s;
    } else if (type === 0x10 || type === 0x12) {
      rec.imageKind = type === 0x10 ? "PE32" : "TE";
      rec.machine = type === 0x12 ? rd.u16le(bytes, off + 4 + 2) : null;
    } else if (type === 0x02) {
      rec.guid = guidString(bytes, off + 4);
      rec.dataOffset = off + 4 + 16 + 2 + 2;
      rec.dataLength = size - (4 + 16 + 2 + 2);
      rec.wrapperNote = "GUID_DEFINED: the payload is not at dataOffset until you know what the GUID says to do with it. LZMA and Tiano both need decompression; a signing wrapper needs verification. Reading the bytes here as if they were code is the mistake this row exists to prevent.";
    }
    out.push(rec);
    off += size;
    if (off % 4) off += 4 - (off % 4);
  }
  return out;
}

/** Mixed-endian GUID string, the way every UEFI tool prints it. */
export function guidString(bytes, off) {
  if (off + 16 > bytes.length) return null;
  const d1 = rd.u32le(bytes, off), d2 = rd.u16le(bytes, off + 4), d3 = rd.u16le(bytes, off + 6);
  const tail = Array.from(bytes.slice(off + 8, off + 16)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${d1.toString(16).padStart(8, "0")}-${d2.toString(16).padStart(4, "0")}-${d3.toString(16).padStart(4, "0")}-${tail.slice(0, 4)}-${tail.slice(4)}`;
}

/* ------------------------------------------------------------------ *
 * 4. Partition / boot structure
 * ------------------------------------------------------------------ */

export function parseMbr(bytes) {
  if (bytes.length < 512) return { ok: false, note: `Only ${bytes.length} bytes — an MBR is 512.` };
  const sig = rd.u16le(bytes, 0x1fe);
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const o = 0x1be + i * 16;
    const status = bytes[o];
    const type = bytes[o + 4];
    const lba = rd.u32le(bytes, o + 8);
    const count = rd.u32le(bytes, o + 12);
    if (status === 0 && type === 0 && lba === 0 && count === 0) continue;
    parts.push({
      index: i, status, bootable: status === 0x80, statusHex: hex(status, 2),
      type, typeHex: hex(type, 2), typeName: partitionTypeName(type),
      firstLba: lba, sectors: count,
      bytes: count * 512,
      chsFirst: `${bytes[o + 2] & 0x3f}/${bytes[o + 1]}/${((bytes[o + 2] & 0xc0) << 2) | bytes[o + 3]}`,
    });
  }
  const bootable = parts.filter((p) => p.bootable);
  const protective = parts.some((p) => p.type === 0xee);
  return {
    ok: true,
    signaturePresent: sig === 0xaa55,
    signatureHex: hex(sig, 4),
    diskSignature: hex(rd.u32le(bytes, 0x1b8)),
    partitions: parts,
    gptProtective: protective,
    verdict: sig !== 0xaa55
      ? "The 0x55AA boot signature is absent. Most BIOSes will not boot this disk, and most tools will not recognise it as an MBR — but the bootstrap code and partition table may still be intact, which is exactly what a boot-sector virus or a zeroing tool leaves behind."
      : protective
        ? "This is a GPT protective MBR (partition type 0xEE). The real partition table is at LBA 1 — parse the GPT header instead. Treating this as an MBR disk will show you one partition covering the whole drive."
        : bootable.length === 0
          ? "Signature present but no partition is marked bootable (status 0x80). The firmware has nothing to hand off to."
          : bootable.length > 1
            ? `${bootable.length} partitions are marked bootable. That is a corrupt table; many firmware implementations refuse to boot rather than guess.`
            : `Valid MBR with one bootable partition: type ${bootable[0].typeHex} (${bootable[0].typeName}) at LBA ${bootable[0].firstLba}.`,
    bootstrapNote: bytes.slice(0, 440).every((b) => b === 0)
      ? "The 440-byte bootstrap area is entirely zero. Either the disk was written by a tool that only builds a partition table, or the boot code has been removed."
      : `The bootstrap area contains code (${entropy(bytes, 0, 440).toFixed(2)} bits/byte).`,
  };
}

export function partitionTypeName(t) {
  const map = { 0x00: "Empty", 0x01: "FAT12", 0x04: "FAT16 <32M", 0x05: "Extended (CHS)", 0x06: "FAT16", 0x07: "NTFS / exFAT / HPFS", 0x0b: "FAT32 (CHS)", 0x0c: "FAT32 (LBA)", 0x0e: "FAT16 (LBA)", 0x0f: "Extended (LBA)", 0x11: "Hidden FAT12", 0x17: "Hidden NTFS", 0x1b: "Hidden FAT32", 0x27: "Hidden NTFS (WinRE)", 0x42: "Windows dynamic volume", 0x82: "Linux swap", 0x83: "Linux filesystem", 0x8e: "Linux LVM", 0xa5: "FreeBSD", 0xa6: "OpenBSD", 0xa9: "NetBSD", 0xee: "GPT protective MBR", 0xef: "EFI System Partition", 0xfd: "Linux RAID", 0xde: "Dell utility", 0xc0: "CTFS", 0xdb: "CP/M / CTOS" };
  return map[t] || "Vendor-specific / unknown";
}

export function parseGpt(bytes, { sectorSize = 512 } = {}) {
  const off = sectorSize; // LBA 1
  if (bytes.length < off + 92) return { ok: false, note: "File too short to contain a GPT header at LBA 1." };
  const sig = rd.ascii(bytes, off, 8);
  if (sig !== "EFI PART") return { ok: false, note: `No 'EFI PART' at LBA 1 (found ${JSON.stringify(sig)}). Not a GPT disk, or the protective MBR is not followed by a header.` };
  const revision = rd.u32le(bytes, off + 0x08);
  const headerSize = rd.u32le(bytes, off + 0x0c);
  const hdrCrc = rd.u32le(bytes, off + 0x10);
  const myLba = Number(rd.u32le(bytes, off + 0x18));
  const altLba = Number(rd.u32le(bytes, off + 0x20));
  const firstUsable = Number(rd.u32le(bytes, off + 0x28));
  const lastUsable = Number(rd.u32le(bytes, off + 0x30));
  const diskGuid = guidString(bytes, off + 0x38);
  const partLba = Number(rd.u32le(bytes, off + 0x48));
  const nEntries = rd.u32le(bytes, off + 0x50);
  const entrySize = rd.u32le(bytes, off + 0x54);
  const arrCrc = rd.u32le(bytes, off + 0x58);

  const saved = rd.u32le(bytes, off + 0x10);
  bytes[off + 0x10] = 0; bytes[off + 0x11] = 0; bytes[off + 0x12] = 0; bytes[off + 0x13] = 0;
  const calcCrc = crc32(bytes, off, off + headerSize);
  bytes[off + 0x10] = saved & 0xff; bytes[off + 0x11] = (saved >>> 8) & 0xff; bytes[off + 0x12] = (saved >>> 16) & 0xff; bytes[off + 0x13] = (saved >>> 24) & 0xff;

  const arrOff = partLba * sectorSize;
  const arrLen = nEntries * entrySize;
  let arrCalcCrc = null;
  if (arrOff + arrLen <= bytes.length) arrCalcCrc = crc32(bytes, arrOff, arrOff + arrLen);

  const partitions = [];
  for (let i = 0; i < nEntries && arrOff + (i + 1) * entrySize <= bytes.length; i++) {
    const e = arrOff + i * entrySize;
    const typeGuid = guidString(bytes, e);
    if (!typeGuid || typeGuid === "00000000-0000-0000-0000-000000000000") continue;
    let name = "";
    for (let k = 0; k < 36; k++) {
      const c = rd.u16le(bytes, e + 56 + k * 2);
      if (!c) break;
      name += String.fromCharCode(c);
    }
    partitions.push({
      index: i, typeGuid, uniqueGuid: guidString(bytes, e + 16),
      firstLba: Number(rd.u32le(bytes, e + 32)), lastLba: Number(rd.u32le(bytes, e + 40)),
      attributes: hex(rd.u32le(bytes, e + 48)),
      name,
      typeName: gptTypeName(typeGuid),
    });
  }

  const altOff = altLba * sectorSize;
  const backupPresent = altOff + 92 <= bytes.length && rd.ascii(bytes, altOff, 8) === "EFI PART";

  return {
    ok: true, revision: hex(revision), headerSize, diskGuid,
    myLba, altLba, firstUsable, lastUsable, partLba, nEntries, entrySize,
    headerCrcOk: hdrCrc === calcCrc, headerCrcStored: hex(hdrCrc), headerCrcCalc: hex(calcCrc),
    arrayCrcStored: hex(arrCrc), arrayCrcCalc: arrCalcCrc === null ? null : hex(arrCalcCrc),
    arrayCrcOk: arrCalcCrc !== null && arrCalcCrc === arrCrc,
    backupHeaderPresent: backupPresent,
    partitions,
    verdict: [
      hdrCrc === calcCrc ? "Header CRC-32 valid." : `Header CRC MISMATCH (stored ${hex(hdrCrc)}, computed ${hex(calcCrc)}) — the header has been modified or the read is corrupt.`,
      arrCalcCrc === null ? "Partition entry array is beyond the end of this file, so its CRC could not be checked. A truncated dump." : (arrCalcCrc === arrCrc ? "Partition array CRC-32 valid." : `Partition array CRC MISMATCH (stored ${hex(arrCrc)}, computed ${hex(arrCalcCrc)}).`),
      backupPresent ? "The backup header at the alternate LBA is present. Compare the two before concluding anything is corrupt — a damaged primary with an intact backup is recoverable, and the reverse tells you the disk was truncated rather than corrupted." : `No backup header at LBA ${altLba}. Either the dump is shorter than the disk, or the backup has been overwritten.`,
      `${partitions.length} partition(s) decoded.`,
    ].join(" "),
    ev: "std",
  };
}

export function gptTypeName(guid) {
  const g = (guid || "").toLowerCase();
  const map = {
    "c12a7328-f81f-11d2-ba4b-00a0c93ec93b": "EFI System Partition",
    "21686148-6449-6e6f-744e-656564454649": "BIOS Boot Partition (GRUB)",
    "e6d6d379-f507-44c2-a23c-238f2a3df928": "Linux root (x86-64) / general Linux data",
    "0fc63daf-8483-4772-8e79-3d69d8477de4": "Linux filesystem data",
    "0657fd6d-a4ab-43c4-84e5-0933c84b4f4f": "Linux swap",
    "a19d880f-05fc-4d3b-a006-743f0f84911e": "Linux RAID",
    "ebd0a0a2-b9e5-4433-87c0-68b6b72699c7": "Microsoft basic data",
    "de94bba4-06d1-4d40-a16a-bfd50179d6ac": "Windows recovery environment",
    "e3c9e316-0b5c-4db8-817d-f92df00215ae": "Microsoft reserved",
    "5808c8aa-7e8f-42e0-85d2-e1e90434cfb3": "Windows LDM metadata",
    "48465300-0000-11aa-aa11-00306543ecac": "macOS HFS+",
    "7c3457ef-0000-11aa-aa11-00306543ecac": "macOS APFS",
    "824cc7a0-36a8-11e3-890a-952519ad3f61": "FreeBSD swap",
    "516e7cb4-6ecf-11d6-8ff8-00022d09712b": "FreeBSD data",
    "53746f72-6167-11aa-aa11-00306543ecac": "macOS boot",
  };
  return map[g] || "Vendor-specific / unrecognised";
}

/* ------------------------------------------------------------------ *
 * 5. Variable store scan
 * ------------------------------------------------------------------ */

/**
 * Find variable stores.
 *
 * Honest caveat, stated up front: the *signature* search below is reliable, but
 * the offset of the store's Size field is not the same in every implementation.
 * UEFI's own VARIABLE_STORE_HEADER puts a 16-byte GUID signature first and Size
 * at +0x10; the "$VSS" ASCII form used by AMI and others is a 4-byte signature
 * with Size at +0x04; the Phoenix "$EVSA" form has its own record layout again.
 * So the declared size is reported for each candidate offset and flagged as
 * needing confirmation, rather than one of them being asserted as correct.
 */
export function findVariableStores(bytes, { maxHits = 16 } = {}) {
  const pats = [
    { pat: [0x24, 0x56, 0x53, 0x53], name: "$VSS", desc: "UEFI/AMI variable store", sizeOffsets: [4, 0x10] },
    { pat: [0x24, 0x45, 0x56, 0x53, 0x41], name: "$EVSA", desc: "Extended variable store (Phoenix/Insyde)", sizeOffsets: [5, 0x10] },
    { pat: [0x4e, 0x56, 0x52, 0x41, 0x4d], name: "NVRAM", desc: "Legacy Phoenix NVRAM", sizeOffsets: [8] },
    { pat: [0x4c, 0x56, 0x53], name: "LVS", desc: "Legacy variable store", sizeOffsets: [4] },
  ];
  const out = [];
  for (const { pat, name, desc, sizeOffsets } of pats) {
    for (let i = 0; i + pat.length <= bytes.length && out.length < maxHits; i++) {
      let m = true;
      for (let k = 0; k < pat.length; k++) if (bytes[i + k] !== pat[k]) { m = false; break; }
      if (!m) continue;
      const candidates = sizeOffsets.map((so) => {
        const size = i + so + 4 <= bytes.length ? rd.u32le(bytes, i + so) : null;
        const plausible = size !== null && size >= 28 && size <= bytes.length - i && size % 4 === 0;
        return { sizeOffset: so, size, sizeHex: size === null ? null : hex(size), plausible };
      });
      const best = candidates.find((c) => c.plausible) || null;
      out.push({
        offset: i, offsetHex: hex(i), signature: name, desc,
        sizeCandidates: candidates,
        declaredSize: best ? best.size : null,
        plausible: !!best,
        ev: "tool",
      });
    }
  }
  return {
    count: out.length, stores: out,
    note: out.length
      ? `${out.length} variable-store signature(s) matched. ${out.filter((s) => s.plausible).length} have a plausible size at one of the candidate offsets; ${out.filter((s) => !s.plausible).length} do not and are probably false matches inside compressed data.`
      : "No known variable-store signature found. The store may sit in a region this dump does not include, or the platform uses a vendor format not in the table.",
  };
}

/* ------------------------------------------------------------------ *
 * 6. The full report
 * ------------------------------------------------------------------ */

export function analyseDump(bytes, opts = {}) {
  const hygiene = dumpHygiene(bytes);
  const sigs = scanSignatures(bytes, { maxHits: opts.maxHits ?? 256 });
  const ifd = findIfd(bytes);
  const regions = ifd.found ? carveIfdRegions(bytes, { descriptorStart: ifd.descriptorStart }) : null;
  const fvs = findFirmwareVolumes(bytes);
  const volumes = fvs.volumes.filter((v) => v.plausible).slice(0, opts.walkVolumes ?? 4).map((v) => ({ header: v, ...walkFvFiles(bytes, v) }));
  const mbr = parseMbr(bytes);
  const gpt = mbr.gptProtective ? parseGpt(bytes) : null;
  const vars = findVariableStores(bytes);
  const cap = analyseCapacity(bytes.length);
  const uimg = bytes.length >= 64 && rd.u32be(bytes, 0) === UIMAGE_MAGIC ? parseUimage(bytes, 0) : null;

  const identity = [];
  if (ifd.found) identity.push(`Intel Flash Descriptor at ${hex(ifd.signatureOffset)} — this is a full platform dump, not just a BIOS region.`);
  if (fvs.count) identity.push(`${fvs.count} UEFI firmware volume(s) — this is a UEFI platform image.`);
  if (mbr.ok && mbr.signaturePresent) identity.push(mbr.gptProtective ? "GPT disk image (protective MBR + header at LBA 1)." : "MBR disk image.");
  if (uimg) identity.push(`U-Boot legacy image: ${uimg.name || "(unnamed)"}.`);
  if (sigs.hits.length) identity.push(`${sigs.hits.length} filesystem/compression signature(s): ${[...new Set(sigs.hits.map((h) => h.name))].slice(0, 8).join(", ")}.`);
  if (!identity.length) identity.push("No recognisable container. The file may be a raw blob, a compressed volume, or a partial read.");

  return {
    hygiene, ifd, regions, fvs, volumes, mbr, gpt, vars, cap, uimg, signatures: sigs,
    identity: identity.join(" "),
    actions: buildActions({ hygiene, ifd, regions, fvs, mbr, gpt, vars, sigs, uimg }),
  };
}

function buildActions({ hygiene, ifd, regions, fvs, mbr, gpt, vars, sigs }) {
  const a = [];
  if (!hygiene.ok) { a.push({ priority: 1, kind: "stop", text: "Do not write this file to a device. Re-dump it: isolate the chip from the board, slow the programmer clock, read twice and diff." }); return a; }
  a.push({ priority: 1, kind: "record", text: "Record the dump's SHA-256 and byte length now. Every later statement about this board is only meaningful if it points at exactly this file." });
  if (ifd.found) {
    a.push({ priority: 2, kind: "carve", text: `Carve the regions before doing anything else. ${regions && regions.ok ? `${regions.regions.length} region(s) decoded.` : "The region table did not decode — confirm the descriptor layout against ifdtool for this platform before carving by hand."}` });
    a.push({ priority: 2, kind: "safety", text: "Only the BIOS region is safe to move between boards of the same model AND revision. Descriptor, GbE, ME, PDR and EC regions carry per-board identity. Writing another board's GbE region clones its MAC address onto your network." });
  }
  if (fvs.count) a.push({ priority: 3, kind: "parse", text: `${fvs.count} firmware volume(s). Walk the files, but expect most executable content to be inside LZMA or Tiano GUID_DEFINED sections — decompress before disassembling.` });
  if (vars.count) a.push({ priority: 4, kind: "parse", text: `${vars.count} variable-store signature(s). Boot entries (BootOrder, Boot####) live here, not on the disk. A cleared NVRAM removes them and produces 'no bootable device' on a perfectly good disk.` });
  if (mbr.ok && mbr.signaturePresent) {
    if (mbr.gptProtective && gpt) a.push({ priority: 3, kind: "parse", text: gpt.headerCrcOk ? `GPT header CRC valid; ${gpt.partitions.length} partition(s).` : "GPT header CRC invalid — check the backup header at the alternate LBA before concluding the table is damaged." });
    else a.push({ priority: 3, kind: "parse", text: `MBR: ${mbr.partitions.length} partition(s), ${mbr.partitions.filter((p) => p.bootable).length} bootable. ${mbr.bootstrapNote}` });
  }
  const sq = sigs.hits.filter((h) => ["squashfs", "squashfs-be", "cramfs", "jffs2", "ubifs"].includes(h.id));
  if (sq.length) a.push({ priority: 5, kind: "extract", text: `Embedded root filesystem(s): ${[...new Set(sq.map((s) => s.name))].join(", ")}. These are where the userspace, the config and the credentials live — and where a repair usually has to put a file back.` });
  if (!a.length) a.push({ priority: 1, kind: "record", text: "Nothing recognisable. Take a signature scan with the endianness flipped and with the byte order reversed — a dump read with the wrong bit order looks like noise." });
  return a.sort((x, y) => x.priority - y.priority);
}

/* ------------------------------------------------------------------ *
 * 7. Self-check — proves the parsers against the standard check values
 * ------------------------------------------------------------------ */

export function selfCheck() {
  const out = [];
  // CRC-32 against its published check value.
  const ascii = (s) => Array.from(s).map((c) => c.charCodeAt(0));
  out.push({ name: "crc32('123456789') === 0xCBF43926", got: hex(crc32(ascii("123456789"))), want: hex(CRC32_CHECK), ok: crc32(ascii("123456789")) === CRC32_CHECK });

  // A synthesised FV header must be found by the scanner.
  const fv = new Uint8Array(0x1000);
  fv.set(FV_FILESYSTEM2_GUID_BYTES, 0x10);
  fv[0x28] = 0x5f; fv[0x29] = 0x46; fv[0x2a] = 0x56; fv[0x2b] = 0x48;
  const len = 0x1000;
  fv[0x20] = len & 0xff; fv[0x21] = (len >>> 8) & 0xff; fv[0x22] = (len >>> 16) & 0xff; fv[0x23] = (len >>> 24) & 0xff;
  fv[0x30] = 0x48;
  fv[0x2c] = 1 << 11; // erase polarity FF
  // make the header checksum sum to zero
  let sum = 0;
  for (let w = 0; w < 0x24; w++) sum = (sum + rd.u16le(fv, w * 2)) & 0xffff;
  const fix = (0x10000 - sum) & 0xffff;
  fv[0x32] = fix & 0xff; fv[0x33] = (fix >>> 8) & 0xff;
  const found = findFirmwareVolumes(fv);
  out.push({ name: "synthetic FV header detected with valid checksum", got: `${found.count} volume(s), checksumOk=${found.volumes[0]?.checksumOk}`, want: "1 volume(s), checksumOk=true", ok: found.count === 1 && found.volumes[0].checksumOk });

  // MBR round-trip.
  const disk = new Uint8Array(1024);
  disk[0x1be] = 0x80; disk[0x1be + 4] = 0x07;
  disk[0x1be + 8] = 63; disk[0x1c6] = 0xff; disk[0x1c7] = 0xff;
  disk[0x1fe] = 0x55; disk[0x1ff] = 0xaa;
  const m = parseMbr(disk);
  out.push({ name: "MBR signature + one bootable NTFS partition", got: `${m.signaturePresent}/${m.partitions.length}/${m.partitions[0]?.typeHex}`, want: "true/1/0x07", ok: m.signaturePresent && m.partitions.length === 1 && m.partitions[0].type === 0x07 });

  // GPT header round-trip with a real CRC.
  const g = new Uint8Array(2048);
  g.set(ascii("EFI PART"), 512);
  g[512 + 0x0c] = 92;
  g[512 + 0x18] = 1; g[512 + 0x20] = 3;
  g[512 + 0x28] = 34; g[512 + 0x30] = 30;
  g[512 + 0x48] = 2; g[512 + 0x50] = 1; g[512 + 0x54] = 128;
  // EFI System Partition GUID C12A7328-F81F-11D2-BA4B-00A0C93EC93B, stored
  // mixed-endian: the first three fields little-endian, the last eight raw.
  g.set([0x28, 0x73, 0x2a, 0xc1, 0x1f, 0xf8, 0xd2, 0x11, 0xba, 0x4b, 0x00, 0xa0, 0xc9, 0x3e, 0xc9, 0x3b], 1024);
  const gcrc = crc32(g, 512, 512 + 92);
  g[512 + 0x10] = gcrc & 0xff; g[512 + 0x11] = (gcrc >>> 8) & 0xff; g[512 + 0x12] = (gcrc >>> 16) & 0xff; g[512 + 0x13] = (gcrc >>> 24) & 0xff;
  const acrc = crc32(g, 1024, 1024 + 128);
  g[512 + 0x58] = acrc & 0xff; g[512 + 0x59] = (acrc >>> 8) & 0xff; g[512 + 0x5a] = (acrc >>> 16) & 0xff; g[512 + 0x5b] = (acrc >>> 24) & 0xff;
  // recompute header CRC after the array CRC field changed
  g[512 + 0x10] = 0; g[512 + 0x11] = 0; g[512 + 0x12] = 0; g[512 + 0x13] = 0;
  const gcrc2 = crc32(g, 512, 512 + 92);
  g[512 + 0x10] = gcrc2 & 0xff; g[512 + 0x11] = (gcrc2 >>> 8) & 0xff; g[512 + 0x12] = (gcrc2 >>> 16) & 0xff; g[512 + 0x13] = (gcrc2 >>> 24) & 0xff;
  const gp = parseGpt(g);
  out.push({ name: "GPT header + partition array CRCs validate", got: `${gp.ok}/${gp.headerCrcOk}/${gp.arrayCrcOk}/${gp.partitions.length}`, want: "true/true/true/1", ok: gp.ok && gp.headerCrcOk && gp.arrayCrcOk && gp.partitions.length === 1 });
  out.push({ name: "ESP partition type recognised", got: gp.partitions[0]?.typeName, want: "EFI System Partition", ok: gp.partitions[0]?.typeName === "EFI System Partition" });

  // IFD signature detection.
  const ifd = new Uint8Array(0x1000);
  ifd[0x10] = 0x5a; ifd[0x11] = 0xa5; ifd[0x12] = 0xf0; ifd[0x13] = 0x0f;
  const f = findIfd(ifd);
  out.push({ name: "IFD signature found at 0x10 → descriptor starts at 0", got: `${f.found}/${f.atDumpStart}`, want: "true/true", ok: f.found && f.atDumpStart });

  // Capacity arithmetic on the canonical non-power-of-two case.
  const c3 = analyseCapacity(3 * 1024 * 1024);
  out.push({ name: "3 MiB flagged as non-power-of-two", got: `${c3.isPowerOfTwo}/${c3.factorBytes}`, want: "false/2^20 × 3", ok: c3.isPowerOfTwo === false && c3.factorBytes === "2^20 × 3" });

  return { allOk: out.every((o) => o.ok), checks: out };
}

export { bytesToHex, hexToBytes, bin, u32, hex, rd, SIGNATURES, decodeRdid, labelSize, SPI_VENDOR_BY_ID, VARIABLE_STORE_SIGNATURES, FV_HEADER, MBR_LAYOUT, factorSummary };
