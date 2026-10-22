#!/usr/bin/env node
// tools/toy_mz_demo.mjs — a tiny, fully redistributable DOS MZ executable
// builder + parser.
//
// Answers open question 3 in docs/john-ghidra-diablo-research.md: the same
// loader/resource-analysis techniques can be demonstrated without proprietary
// game assets. The fixture is generated in code (no third-party bytes): an MZ
// header with a real relocation entry, a DOS print/exit stub (int 21h), and a
// mini "RSRC" string table that a resource pass would extract.
//
// Offline fixture generation and parsing only — no execution, no network.

/** Build the toy MZ image. Returns { bytes: Buffer, strings: string[] }. */
export function buildToyMZ(strings = ['HELLO-FROM-TOY', 'TOY-RESOURCE-1']) {
  const HEADER_BYTES = 64;             // 4 paragraphs
  const RELOC_OFFSET = 0x1C;           // e_lfarlc: right after the fixed fields
  const RELOC_COUNT = 1;
  const codeOffset = HEADER_BYTES;

  // DOS stub: mov ah,09 ; mov dx, msg ; int 21h ; mov ax,4C00h ; int 21h
  // (msg is the first string-table entry; CS:DX fixup via the relocation.)
  const stub = Buffer.from([
    0xb4, 0x09,                    // mov ah, 0x09
    0xba, 0x00, 0x00,              // mov dx, imm16  (patched by reloc: msg offset)
    0xcd, 0x21,                    // int 21h        (print $-terminated string)
    0xb8, 0x00, 0x4c,              // mov ax, 0x4C00
    0xcd, 0x21,                    // int 21h        (exit)
    0x0d, 0x0a, 0x24,              // CRLF + '$' terminator for the message
  ]);

  // Mini resource table: 'RSRC' + count + [u8 len][ascii] entries.
  const rsrc = [Buffer.from('RSRC'), Buffer.from([strings.length])];
  for (const s of strings) rsrc.push(Buffer.from([s.length]), Buffer.from(s, 'ascii'));
  const rsrcBuf = Buffer.concat(rsrc);

  const total = HEADER_BYTES + stub.length + rsrcBuf.length;
  const pages = Math.ceil(total / 512) || 1;
  const cblp = total % 512;

  const h = Buffer.alloc(HEADER_BYTES);
  h.write('MZ', 0, 'ascii');
  h.writeUInt16LE(cblp, 0x02);                 // bytes on last page
  h.writeUInt16LE(pages, 0x04);                // pages in file
  h.writeUInt16LE(RELOC_COUNT, 0x06);          // relocation entries
  h.writeUInt16LE(HEADER_BYTES / 16, 0x08);    // header size in paragraphs
  h.writeUInt16LE(0x0010, 0x0A);               // minalloc
  h.writeUInt16LE(0xFFFF, 0x0C);               // maxalloc
  h.writeUInt16LE(0x0000, 0x0E);               // SS
  h.writeUInt16LE(0x0100, 0x10);               // SP
  h.writeUInt16LE(0x0000, 0x12);               // checksum
  h.writeUInt16LE(0x0000, 0x14);               // IP
  h.writeUInt16LE(0x0000, 0x16);               // CS
  h.writeUInt16LE(RELOC_OFFSET, 0x18);         // e_lfarlc
  h.writeUInt16LE(0x0000, 0x1A);               // overlay number
  // Relocation entry: segment:offset of the imm16 in `mov dx, imm16`
  // (offset 3 within the stub; segment 0 because code starts at CS:0000).
  h.writeUInt16LE(0x0003, RELOC_OFFSET);       // offset
  h.writeUInt16LE(0x0000, RELOC_OFFSET + 2);   // segment

  const bytes = Buffer.concat([h, stub, rsrcBuf]);
  return { bytes, strings: [...strings] };
}

/** Parse a toy MZ image back into header fields + resource strings. */
export function parseMZ(bytes) {
  const b = Buffer.from(bytes);
  if (b.length < 64 || b.subarray(0, 2).toString('ascii') !== 'MZ') {
    throw new Error('not an MZ image');
  }
  const u16 = (o) => b.readUInt16LE(o);
  const fields = {
    e_magic: 'MZ', e_cblp: u16(0x02), e_cp: u16(0x04), e_crlc: u16(0x06),
    e_cparhdr: u16(0x08), e_minalloc: u16(0x0A), e_maxalloc: u16(0x0C),
    e_ss: u16(0x0E), e_sp: u16(0x10), e_csum: u16(0x12), e_ip: u16(0x14),
    e_cs: u16(0x16), e_lfarlc: u16(0x18), e_ovno: u16(0x1A),
  };
  const relocs = [];
  for (let i = 0; i < fields.e_crlc; i++) {
    const o = fields.e_lfarlc + i * 4;
    relocs.push({ offset: u16(o), segment: u16(o + 2) });
  }
  const codeStart = fields.e_cparhdr * 16;
  const marker = b.indexOf('RSRC', codeStart);
  const strings = [];
  if (marker >= 0) {
    const count = b[marker + 4];
    let p = marker + 5;
    for (let i = 0; i < count && p < b.length; i++) {
      const len = b[p];
      strings.push(b.subarray(p + 1, p + 1 + len).toString('ascii'));
      p += 1 + len;
    }
  }
  return { fields, codeStart, relocs, rsrcOffset: marker, strings };
}

function main() {
  const { bytes, strings } = buildToyMZ();
  const parsed = parseMZ(bytes);
  console.log(`toy MZ: ${bytes.length} bytes, sha256-ready fixture`);
  console.log(`  header: pages=${parsed.fields.e_cp} cblp=${parsed.fields.e_cblp} hdr=${parsed.fields.e_cparhdr}paras relocs=${parsed.fields.e_crlc}`);
  console.log(`  stub at 0x${parsed.codeStart.toString(16)}, RSRC at 0x${parsed.rsrcOffset.toString(16)}`);
  for (const s of parsed.strings) console.log(`  + ${s}`);
  if (JSON.stringify(parsed.strings) !== JSON.stringify(strings)) {
    console.error('string round-trip FAILED');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
