/* CHIPWRIGHT · cw-synth.js — synthetic images for exercising the parsers.
 *
 * The dump tab has to work without hardware, which means it needs bytes that
 * are structurally correct enough to drive every parser in cw-firmware.js: a
 * UEFI volume whose header checksum actually validates, an Intel Flash
 * Descriptor whose region table decodes, a GPT disk whose two CRC-32s pass.
 *
 * These builders live in their own module rather than in cw-app.js so the
 * headless verify script can assert that each synthetic image is parsed as
 * intended. A demo image that the parsers reject would be worse than no demo
 * image at all: it would look like a parser bug.
 *
 * cw-firmware.js imports nothing from here, so importing it back is not a cycle.
 */

import { findFirmwareVolumes, walkFvFiles, findIfd, carveIfdRegions, parseMbr, parseGpt } from "./cw-firmware.js";
import { crc32 } from "./cw-data.js";
import { FV_FILESYSTEM2_GUID_BYTES } from "./cw-data-uefi.js";

const wr16 = (b, o, v) => { b[o] = v & 0xff; b[o + 1] = (v >>> 8) & 0xff; };
const wr32 = (b, o, v) => { b[o] = v & 0xff; b[o + 1] = (v >>> 8) & 0xff; b[o + 2] = (v >>> 16) & 0xff; b[o + 3] = (v >>> 24) & 0xff; };
const align8 = (n) => (n + 7) & ~7;

const LZMA_CUSTOM_DECOMPRESS_GUID = [0x98, 0x58, 0x4e, 0xee, 0x14, 0x39, 0x59, 0x42, 0x9d, 0x6e, 0xdc, 0x7b, 0xd7, 0x94, 0x03, 0xcf];
const EFI_SYSTEM_PARTITION_GUID = [0x28, 0x73, 0x2a, 0xc1, 0x1f, 0xf8, 0xd2, 0x11, 0xba, 0x4b, 0x00, 0xa0, 0xc9, 0x3e, 0xc9, 0x3b];

/* ================================================================== *
 * A UEFI firmware volume
 * ================================================================== */

/**
 * A volume whose header checksum genuinely validates, plus two FFS files: a DXE
 * driver carrying a USER_INTERFACE name section and a PE32 section, then a file
 * carrying a GUID_DEFINED (LZMA) wrapper. Files are 8-byte aligned, which is
 * the detail a naive walker loses sync on after the first odd-sized file.
 */
export function synthFirmwareVolume({ size = 0x2000, eraseFF = true } = {}) {
  const b = new Uint8Array(size).fill(eraseFF ? 0xff : 0x00);

  /* Header. Three anchors must agree at once for a scanner to accept it:
   * sixteen zero bytes at +0x00, the filesystem GUID at +0x10, '_FVH' at +0x28.
   * Filling the volume with 0xFF first and then forgetting to zero the
   * ZeroVector is the easiest way to build a demo image nothing will find. */
  b.fill(0, 0, 16);
  b.set(FV_FILESYSTEM2_GUID_BYTES, 0x10);
  wr32(b, 0x20, size);                 // FvLength
  wr32(b, 0x24, 0);                    // Signature placeholder
  b[0x28] = 0x5f; b[0x29] = 0x46; b[0x2a] = 0x56; b[0x2b] = 0x48; // '_FVH'
  wr32(b, 0x2c, 1 << 11);              // Attributes: EFI_FVB2_ERASE_POLARITY
  wr16(b, 0x30, 0x48);                 // HeaderLength
  wr16(b, 0x32, 0);                    // Checksum — filled in below
  wr16(b, 0x34, 0);                    // ExtHeaderOffset
  b[0x36] = 0;                         // Reserved
  b[0x37] = 2;                         // Revision
  wr32(b, 0x38, size / 4096);          // BlockMap[0].NumBlocks
  wr32(b, 0x3c, 4096);                 // BlockMap[0].BlockLength
  wr32(b, 0x40, 0);                    // BlockMap terminator
  wr32(b, 0x44, 0);

  // The 16-bit sum of every u16 in the header, including the checksum field
  // itself, must come to zero.
  let sum = 0;
  for (let w = 0; w < 0x48 / 2; w++) sum = (sum + (b[w * 2] | (b[w * 2 + 1] << 8))) & 0xffff;
  wr16(b, 0x32, (0x10000 - sum) & 0xffff);

  /* File 1 — DXE driver: USER_INTERFACE section then PE32 section. */
  let off = 0x48;
  const nameBytes = [];
  for (const ch of "ChipwrightTestDxe") nameBytes.push(ch.charCodeAt(0), 0);
  nameBytes.push(0, 0);
  const nameSec = 4 + nameBytes.length;
  // 96 bytes: 'MZ' at 0, e_lfanew at 0x3C pointing at 0x40, 'PE\0\0' there, and
  // the COFF header from 0x44. Machine is the first COFF field.
  const pe = new Uint8Array(96);
  pe.set([0x4d, 0x5a], 0);
  wr32(pe, 0x3c, 0x40);                // e_lfanew
  pe.set([0x50, 0x45, 0x00, 0x00], 0x40);
  wr16(pe, 0x44, 0x014c);              // IMAGE_FILE_MACHINE_I386
  wr16(pe, 0x46, 1);                   // NumberOfSections
  wr16(pe, 0x5c, 0x010b);              // Optional header magic = PE32
  wr16(pe, 0x74, 2);                   // Subsystem = IMAGE_SUBSYSTEM_WINDOWS_GUI
  const peSec = 4 + pe.length;
  const file1 = 24 + nameSec + peSec;
  for (let i = 0; i < 16; i++) b[off + i] = 0x10 + i;
  b[off + 0x12] = 0x07;                // EFI_FV_FILETYPE_DRIVER
  b[off + 0x14] = file1 & 0xff;
  b[off + 0x15] = (file1 >>> 8) & 0xff;
  b[off + 0x16] = (file1 >>> 16) & 0xff;
  b[off + 0x17] = 0xfd;                // HEADER_VALID | DATA_VALID under FF polarity
  let p = off + 24;
  b[p] = nameSec & 0xff; b[p + 1] = (nameSec >>> 8) & 0xff; b[p + 2] = 0; b[p + 3] = 0x15;
  b.set(nameBytes, p + 4);
  p += nameSec;
  b[p] = peSec & 0xff; b[p + 1] = (peSec >>> 8) & 0xff; b[p + 2] = 0; b[p + 3] = 0x10;
  b.set(pe, p + 4);
  off = align8(off + file1);

  /* File 2 — GUID_DEFINED section wrapping an LZMA payload. */
  const payload = new Uint8Array(48).fill(0x5a);
  const gSec = 4 + 16 + 2 + 2 + payload.length;
  const file2 = 24 + gSec;
  for (let i = 0; i < 16; i++) b[off + i] = 0x20 + i;
  b[off + 0x12] = 0x07;
  b[off + 0x14] = file2 & 0xff;
  b[off + 0x15] = (file2 >>> 8) & 0xff;
  b[off + 0x16] = (file2 >>> 16) & 0xff;
  b[off + 0x17] = 0xfd;
  p = off + 24;
  b[p] = gSec & 0xff; b[p + 1] = (gSec >>> 8) & 0xff; b[p + 2] = 0; b[p + 3] = 0x02;
  b.set(LZMA_CUSTOM_DECOMPRESS_GUID, p + 4);
  wr16(b, p + 20, 0x09);               // DataOffset
  wr16(b, p + 22, 0);                  // Attributes
  b.set(payload, p + 24);

  return b;
}

/* ================================================================== *
 * A GPT disk: protective MBR + header at LBA 1 + entry array at LBA 2
 * ================================================================== */

/**
 * `sectors` is deliberately small so the whole image can be walked. Both CRCs
 * are computed and stored, so parseGpt() validates them — a synthetic disk
 * whose CRCs did not pass would prove nothing about the parser. A backup header
 * is written at the last LBA so `backupHeaderPresent` is a real observation.
 */
export function synthGptDisk({ sectors = 64, partCount = 1, corruptArrayCrc = false } = {}) {
  const b = new Uint8Array(sectors * 512);

  // Protective MBR: one partition of type 0xEE covering the disk.
  b[0x1be + 4] = 0xee;
  b[0x1be + 5] = 0xff; b[0x1be + 6] = 0xff; b[0x1be + 7] = 0xff;
  wr32(b, 0x1be + 8, 1);
  wr32(b, 0x1be + 12, Math.min(sectors - 1, 0xffffffff));
  b[0x1fe] = 0x55; b[0x1ff] = 0xaa;

  const H = 512;
  b.set([0x45, 0x46, 0x49, 0x20, 0x50, 0x41, 0x52, 0x54], H); // 'EFI PART'
  wr32(b, H + 0x08, 0x00010000);       // Revision 1.0
  wr32(b, H + 0x0c, 92);               // HeaderSize
  wr32(b, H + 0x10, 0);                // HeaderCRC32 — filled in last
  wr32(b, H + 0x14, 0);                // Reserved
  wr32(b, H + 0x18, 1);                // MyLBA
  wr32(b, H + 0x20, sectors - 1);      // AlternateLBA
  wr32(b, H + 0x28, 34);               // FirstUsableLBA
  wr32(b, H + 0x30, sectors - 34 > 34 ? sectors - 34 : 60); // LastUsableLBA
  b.set([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
    0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00], H + 0x38);
  wr32(b, H + 0x48, 2);                // PartitionEntryLBA
  wr32(b, H + 0x50, partCount);        // NumberOfPartitionEntries
  wr32(b, H + 0x54, 128);              // SizeOfPartitionEntry

  for (let i = 0; i < partCount; i++) {
    const e = 1024 + i * 128;
    b.set(EFI_SYSTEM_PARTITION_GUID, e);
    b.set([(i + 1) * 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, i], e + 16);
    wr32(b, e + 32, 34 + i * 8);
    wr32(b, e + 40, 41 + i * 8);
    b.set("EFI System Partition".split("").flatMap((c) => [c.charCodeAt(0), 0]), e + 56);
  }

  // The array CRC covers exactly nEntries × entrySize bytes, not the whole
  // sector. Getting that span wrong is the usual reason a hand-built GPT
  // "fails validation" for no visible reason.
  wr32(b, H + 0x58, crc32(b, 1024, 1024 + partCount * 128) ^ (corruptArrayCrc ? 0xdeadbeef : 0));
  wr32(b, H + 0x10, crc32(b, H, H + 92));

  if (sectors > 4) {
    const B = (sectors - 1) * 512;
    b.set(b.subarray(H, H + 92), B);
    wr32(b, B + 0x18, sectors - 1);    // MyLBA
    wr32(b, B + 0x20, 1);              // AlternateLBA
    wr32(b, B + 0x10, 0);
    wr32(b, B + 0x10, crc32(b, B, B + 92));
  }
  return b;
}

/* ================================================================== *
 * An Intel Flash Descriptor dump
 * ================================================================== */

/**
 * Region base/limit pairs are 12-bit block numbers: a region's byte offset is
 * `base << 12` and its length is `((limit << 12) | 0xFFF) - (base << 12) + 1`.
 * FLMAP0 bits 11:4 give the component base (FCBA) and bits 25:24 the component
 * count minus one; FLMAP1 bits 11:4 give the region base (FRBA) and bits 26:24
 * the region count minus one.
 *
 * With `overlapGbE` the GbE region overlaps ME, so the validator has something
 * real to complain about rather than reporting a suspiciously clean table.
 */
export function synthIfdDump({ size = 4 << 20, overlapGbE = true } = {}) {
  const b = new Uint8Array(size).fill(0xff);
  const BLOCK = 0x1000;
  const blocks = Math.floor(size / BLOCK);

  b[0x10] = 0x5a; b[0x11] = 0xa5; b[0x12] = 0xf0; b[0x13] = 0x0f;
  // FLMAP0: FCBA in bits 11:4 (byte address >> 4), NC-1 in bits 25:24.
  wr32(b, 0x20, ((0x20 >>> 4) << 4) | ((2 & 0x3) << 24));
  // FLMAP1: FRBA in bits 11:4, NR-1 in bits 26:24.
  wr32(b, 0x24, ((0x40 >>> 4) << 4) | ((3 & 0x7) << 24));

  // Region entries hold 12-bit BLOCK numbers, not byte addresses: base block in
  // bits 15:0 and limit block in bits 31:16. Writing byte addresses here is the
  // classic mistake — every region then appears to start megabytes past the end
  // of the flash, and the report says the descriptor is corrupt when it is fine.
  const region = (i, baseBlk, limitBlk) => wr32(b, 0x40 + i * 4, ((limitBlk & 0xffff) << 16) | (baseBlk & 0xffff));
  region(0, 0x000, 0x000);                                    // Descriptor, first 4 KiB
  region(1, 0x001, Math.min(0x0ff, blocks - 1));              // BIOS
  region(2, 0x100, 0x1ff);                                    // ME
  region(3, overlapGbE ? 0x1f0 : 0x200, overlapGbE ? 0x1ff : 0x20f); // GbE

  const fv = synthFirmwareVolume({ size: 0x2000 });
  b.set(fv.subarray(0, Math.min(fv.length, size - 0x1000)), 0x1000);
  return b;
}

/* ================================================================== *
 * Degenerate images — the ones that matter most in practice
 * ================================================================== */

/** All 0xFF: an erased chip, a chip held in reset, or a read that never happened. */
export function synthErased(size = 4 << 20) { return new Uint8Array(size).fill(0xff); }

/** All 0x00: a chip that answers but has never been programmed. */
export function synthZeroed(size = 1 << 20) { return new Uint8Array(size); }

/**
 * A truncated read of a 3 MiB / 24 Mbit part. The point is that a non-power-of-two
 * capacity makes a partial dump indistinguishable from a complete one by length
 * alone, unless you know the real capacity.
 */
export function synthTruncated({ full = 3 * 1024 * 1024, keep = 1024 * 1024 } = {}) {
  const b = new Uint8Array(full);
  for (let i = 0; i < full; i++) b[i] = (i * 31 + (i >>> 8)) & 0xff;
  return b.subarray(0, keep);
}

/* ================================================================== *
 * Self-check
 * ================================================================== */

/**
 * Every builder must produce an image its parser accepts. A builder that drifts
 * out of step with the parser is worse than no builder, because the demo then
 * looks like a parser bug and sends you chasing the wrong module.
 */
export function selfCheck() {
  const out = [];
  const t = (name, got, want) => out.push({ name, got: String(got), want: String(want), ok: String(got) === String(want) });

  const fv = synthFirmwareVolume();
  const found = findFirmwareVolumes(fv);
  t("synthetic FV: header found", found.count, 1);
  t("synthetic FV: header checksum validates", found.volumes[0]?.checksumOk, true);
  const walked = found.count ? walkFvFiles(fv, found.volumes[0]) : { files: [] };
  t("synthetic FV: both files walked", walked.files.length, 2);
  t("synthetic FV: named file recovered", walked.files.find((f) => f.name)?.name, "ChipwrightTestDxe");
  t("synthetic FV: GUID_DEFINED section present",
    walked.files.some((f) => f.sections.some((s) => /guid/i.test(s.typeName ?? ""))), true);

  const disk = synthGptDisk();
  const mbr = parseMbr(disk);
  t("synthetic GPT: protective MBR recognised", mbr.gptProtective, true);
  const gpt = parseGpt(disk);
  t("synthetic GPT: header CRC validates", gpt.headerCrcOk, true);
  t("synthetic GPT: entry-array CRC validates", gpt.arrayCrcOk, true);
  t("synthetic GPT: backup header present", gpt.backupHeaderPresent, true);
  t("synthetic GPT: ESP partition named", gpt.partitions[0]?.typeName, "EFI System Partition");
  t("synthetic GPT: corrupting the array CRC is detected", parseGpt(synthGptDisk({ corruptArrayCrc: true })).arrayCrcOk, false);

  // Two variants, because the assertions pull in opposite directions: a clean
  // layout has to validate end to end, and the deliberately broken one has to be
  // caught. Testing only the broken one would hide a parser that rejects
  // everything; testing only the clean one would hide a parser that accepts
  // anything.
  const ifd = synthIfdDump({ overlapGbE: false });
  const f = findIfd(ifd);
  t("synthetic IFD: signature found", f.found, true);
  t("synthetic IFD: signature is at 0x10", f.signatureOffset, 16);
  t("synthetic IFD: descriptor starts at 0", f.descriptorStart, 0);
  const reg = carveIfdRegions(ifd, { descriptorStart: f.descriptorStart });
  t("synthetic IFD: four regions decode", reg.regions.length, 4);
  t("synthetic IFD: clean layout validates", reg.ok, true);
  t("synthetic IFD: NC read from bits 25:24, not aliased against FCBA", reg.nc, 3);
  t("synthetic IFD: NR read from bits 26:24", reg.nr, 4);
  t("synthetic IFD: BIOS region is inside the file", reg.regions[1].inRange, true);
  t("synthetic IFD: region bases are block numbers scaled by 0x1000", reg.regions[2].base, 0x100 * 0x1000);

  const bad = synthIfdDump({ overlapGbE: true });
  const badReg = carveIfdRegions(bad, { descriptorStart: findIfd(bad).descriptorStart });
  t("synthetic IFD: clean layout reports no problems", reg.regions.every((r) => !r.problems.length), true);
  t("synthetic IFD: the deliberate GbE/ME overlap is flagged",
    badReg.regions.some((r) => r.problems.some((p) => /overlap/.test(p))), true);
  t("synthetic IFD: an overlapping layout does not validate", badReg.ok, false);

  const erased = synthErased(1 << 20);
  t("synthetic erased image is all 0xFF", erased.every((x) => x === 0xff), true);
  t("synthetic truncated image is 3 MiB cut to 1 MiB", synthTruncated().length, 1024 * 1024);

  return { allOk: out.every((c) => c.ok), checks: out };
}

export { wr16, wr32, align8 };
