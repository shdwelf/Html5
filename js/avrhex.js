/**
 * avrhex.js — Intel HEX parsing for AVR firmware images.
 *
 * Extracted from tools/ghidra_avr.mjs so the parsers and the disassembler can be
 * imported by other tools (tools/verify_avrdis.mjs) without executing a tool's
 * command-line body. Record types 00 (data), 01 (EOF), 02/04 (extended address),
 * 03/05 (start address, ignored); every record's checksum is verified and any
 * failure is reported rather than swallowed.
 */

// ------------------------------------------------------------------- Intel HEX

/**
 * Parse Intel HEX into a flat image. Returns { bytes, base, min, max, records,
 * errors }. `bytes` spans min..max with 0xFF fill, which is what an erased AVR
 * flash reads as.
 */
export function parseIntelHex(text) {
  const chunks = [];
  const errors = [];
  let min = Infinity, max = -Infinity, records = 0, extended = 0, eof = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line[0] !== ":") { errors.push(`not a record: ${line.slice(0, 20)}`); continue; }
    const bytes = [];
    for (let i = 1; i + 1 < line.length; i += 2) bytes.push(parseInt(line.slice(i, i + 2), 16));
    if (bytes.some((b) => Number.isNaN(b))) { errors.push(`bad hex: ${line.slice(0, 20)}`); continue; }
    const [len, addrHi, addrLo, type, ...rest] = bytes;
    if (rest.length !== len + 1) { errors.push(`length mismatch: ${line.slice(0, 20)}`); continue; }
    const sum = (len + addrHi + addrLo + type + rest.reduce((a, b) => a + b, 0)) & 0xff;
    if (sum !== 0) errors.push(`checksum: ${line.slice(0, 20)}`);
    const data = rest.slice(0, len);
    records++;
    switch (type) {
      case 0x00: {
        const at = extended + (addrHi << 8) + addrLo;
        chunks.push({ at, data });
        min = Math.min(min, at);
        max = Math.max(max, at + data.length);
        break;
      }
      case 0x01: eof = true; break;
      case 0x02: extended = ((data[0] << 8) | data[1]) << 4; break;
      case 0x04: extended = ((data[0] << 8) | data[1]) << 16; break;
      case 0x03: case 0x05: break; // start address records: not data
      default: errors.push(`record type 0x${type.toString(16)} at ${line.slice(0, 20)}`);
    }
  }
  if (!records) throw new Error("no Intel HEX records found");
  if (!eof) errors.push("missing end-of-file record (:00000001FF)");

  const size = max - min;
  const image = new Uint8Array(size).fill(0xff);
  for (const { at, data } of chunks) image.set(data, at - min);
  return { bytes: image, base: min, min, max, records, errors };
}

