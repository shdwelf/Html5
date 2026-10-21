#!/usr/bin/env node
// tools/polyglot_scan.mjs — offline polyglot/parasite signature scanner.
//
// Companion to docs/polyglot-files-deep-dive-2026-10-21.md. Reports every
// known format magic at every offset, then classifies the file:
//   unknown | single | parasite-or-stack | multi-offset | chimera-candidate
// (chimera-candidate = signature match ranges overlap; parasite-or-stack =
// a format at offset 0 plus later non-overlapping signatures — SFX/GIFAR shape.)
//
// Detection-only: recognition of well-known magics in local files you own.
// No polyglot crafting, no network use.

import fs from 'node:fs';

/** @type {Array<{id:string,name:string,magic:number[],anywhere:boolean}>} */
export const SIGS = [
  { id: 'jpeg',    name: 'JPEG',            magic: [0xff, 0xd8, 0xff],                      anywhere: true },
  { id: 'png',     name: 'PNG',             magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], anywhere: true },
  { id: 'gif87',   name: 'GIF87a',          magic: [...Buffer.from('GIF87a')],             anywhere: true },
  { id: 'gif89',   name: 'GIF89a',          magic: [...Buffer.from('GIF89a')],             anywhere: true },
  { id: 'zip',     name: 'ZIP local file',  magic: [0x50, 0x4b, 0x03, 0x04],               anywhere: true },
  { id: 'zip-eocd', name: 'ZIP empty',      magic: [0x50, 0x4b, 0x05, 0x06],               anywhere: true },
  { id: 'rar',     name: 'RAR',             magic: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07],   anywhere: true },
  { id: '7z',      name: '7-Zip',           magic: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c],   anywhere: true },
  { id: 'pdf',     name: 'PDF',             magic: [...Buffer.from('%PDF-')],              anywhere: true },
  { id: 'elf',     name: 'ELF',             magic: [0x7f, 0x45, 0x4c, 0x46],               anywhere: true },
  { id: 'class',   name: 'Java class/JAR',  magic: [0xca, 0xfe, 0xba, 0xbe],               anywhere: true },
  { id: 'gzip',    name: 'gzip',            magic: [0x1f, 0x8b, 0x08],                      anywhere: true },
  { id: 'bzip2',   name: 'bzip2',           magic: [...Buffer.from('BZh')],                anywhere: true },
  { id: 'xz',      name: 'xz',              magic: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00],   anywhere: true },
  { id: 'cab',     name: 'CAB',             magic: [...Buffer.from('MSCF')],               anywhere: true },
  { id: 'arj',     name: 'ARJ',             magic: [0x60, 0xea],                            anywhere: true },
  { id: 'tiff',    name: 'TIFF',            magic: [0x49, 0x49, 0x2a, 0x00],               anywhere: true },
  { id: 'bmp',     name: 'BMP',             magic: [...Buffer.from('BM')],                 anywhere: true },
  { id: 'mz',      name: 'MZ executable',   magic: [0x4d, 0x5a],                            anywhere: false },
];

function matchAt(buf, sig, offset) {
  if (offset + sig.magic.length > buf.length) return false;
  for (let i = 0; i < sig.magic.length; i++) {
    if (buf[offset + i] !== sig.magic[i]) return false;
  }
  return true;
}

/**
 * Scan a buffer for known magics.
 * @param {Uint8Array} buf
 * @returns {{matches:Array<{id:string,name:string,offset:number,end:number}>, classification:string}}
 */
export function scanBuffer(buf) {
  const b = Buffer.from(buf);
  /** @type {Array<{id:string,name:string,offset:number,end:number}>} */
  const matches = [];
  for (const sig of SIGS) {
    const max = sig.anywhere ? b.length - sig.magic.length : 0;
    for (let off = 0; off <= max; off++) {
      if (matchAt(b, sig, off)) {
        matches.push({ id: sig.id, name: sig.name, offset: off, end: off + sig.magic.length });
      }
    }
  }
  matches.sort((x, y) => x.offset - y.offset || x.end - y.end);

  let classification = 'unknown';
  if (matches.length === 1) classification = 'single';
  else if (matches.length > 1) {
    let overlap = false;
    for (let i = 0; i < matches.length && !overlap; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        if (matches[i].offset < matches[j].end && matches[j].offset < matches[i].end) { overlap = true; break; }
      }
    }
    if (overlap) classification = 'chimera-candidate';
    else classification = matches.some((m) => m.offset === 0) ? 'parasite-or-stack' : 'multi-offset';
  }
  return { matches, classification };
}

function main(argv) {
  const files = argv.slice(2);
  if (!files.length) {
    console.error('usage: node tools/polyglot_scan.mjs <file...>');
    process.exit(2);
  }
  let bad = 0;
  for (const f of files) {
    const buf = fs.readFileSync(f);
    const { matches, classification } = scanBuffer(buf);
    console.log(`${f}: ${classification}`);
    for (const m of matches) console.log(`  +${m.offset} ${m.name}`);
    if (classification === 'chimera-candidate' || classification === 'parasite-or-stack') bad++;
  }
  // Exit 1 when suspicious files were found (scriptable in triage pipelines).
  process.exit(bad ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv);
