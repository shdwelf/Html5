#!/usr/bin/env node
// tools/mime_lookup.mjs — offline MIME (media type) reference + upload checks.
//
// Companion to docs/mime-types-deep-dive-2026-10-21.md. Curated subset of the
// IANA-registered types that this corpus actually meets (archives, images,
// executables, web formats): magic-byte sniffing, extension mapping, and the
// claimed-vs-actual consistency check from the upload-validation recipe.
//
// Offline reference only — no network, no server.

import fs from 'node:fs';

/** Curated magic → MIME (IANA-registered names). */
export const MAGIC_MIME = [
  { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff], exts: ['.jpg', '.jpeg'] },
  { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], exts: ['.png'] },
  { mime: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38], exts: ['.gif'] }, // GIF87a/GIF89a
  { mime: 'image/bmp', magic: [0x42, 0x4d], exts: ['.bmp'] },
  { mime: 'image/tiff', magic: [0x49, 0x49, 0x2a, 0x00], exts: ['.tif', '.tiff'] },
  { mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46, 0x2d], exts: ['.pdf'] },
  { mime: 'application/zip', magic: [0x50, 0x4b, 0x03, 0x04], exts: ['.zip', '.jar', '.apk', '.docx', '.xlsx'] },
  { mime: 'application/zip', magic: [0x50, 0x4b, 0x05, 0x06], exts: ['.zip'] },
  { mime: 'application/gzip', magic: [0x1f, 0x8b, 0x08], exts: ['.gz', '.tgz'] },
  { mime: 'application/x-bzip2', magic: [0x42, 0x5a, 0x68], exts: ['.bz2'] },
  { mime: 'application/x-xz', magic: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00], exts: ['.xz'] },
  { mime: 'application/x-7z-compressed', magic: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], exts: ['.7z'] },
  { mime: 'application/vnd.rar', magic: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07], exts: ['.rar'] },
  { mime: 'application/x-arj', magic: [0x60, 0xea], exts: ['.arj'] },
  { mime: 'application/x-executable', magic: [0x7f, 0x45, 0x4c, 0x46], exts: ['.elf', '.so'] },
  { mime: 'application/x-msdownload', magic: [0x4d, 0x5a], exts: ['.exe', '.dll'] }, // MZ — header check only
  { mime: 'application/java-vm', magic: [0xca, 0xfe, 0xba, 0xbe], exts: ['.class'] },
  { mime: 'video/mp4', magic: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], exts: ['.mp4'] }, // ftyp at 4
];

/** Extension-only fallback (no reliable magic at offset 0). */
export const EXT_MIME = {
  '.txt': 'text/plain', '.csv': 'text/csv', '.json': 'application/json',
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html',
  '.css': 'text/css', '.xml': 'application/xml', '.md': 'text/markdown',
  '.wasm': 'application/wasm', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.iso': 'application/x-iso9660-image', '.arj': 'application/x-arj',
  '.lzh': 'application/x-lzh-compressed', '.ace': 'application/x-ace-compressed',
};

export function sniffMime(buf) {
  const b = Buffer.from(buf);
  for (const e of MAGIC_MIME) {
    if (b.length < e.magic.length) continue;
    let ok = true;
    for (let i = 0; i < e.magic.length; i++) {
      if (b[i] !== e.magic[i]) { ok = false; break; }
    }
    if (ok) return e.mime;
  }
  return null;
}

export function extMime(filename) {
  const name = String(filename || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';
  for (const e of MAGIC_MIME) if (e.exts.includes(ext)) return e.mime;
  return EXT_MIME[ext] || 'application/octet-stream';
}

/**
 * Upload-validation check (the "claimed vs actual" recipe):
 * returns { sniffed, claimed, consistent, note }.
 */
export function checkUpload(filename, buf) {
  const sniffed = sniffMime(buf);
  const claimed = extMime(filename);
  const consistent = sniffed == null ? true : sniffed === claimed;
  let note;
  if (sniffed == null) note = 'no magic match — rely on extension mapping, serve as octet-stream + nosniff';
  else if (!consistent) note = `MISMATCH: bytes say ${sniffed}, name says ${claimed} — reject or re-derive type (never replay a client-supplied Content-Type)`;
  else note = 'sniffed type matches extension mapping';
  return { sniffed, claimed, consistent, note };
}

function main(argv) {
  const files = argv.slice(2);
  if (!files.length) {
    console.error('usage: node tools/mime_lookup.mjs <file...>');
    process.exit(2);
  }
  for (const f of files) {
    const r = checkUpload(f, fs.readFileSync(f));
    console.log(`${f}\n  sniffed: ${r.sniffed ?? '(none)'}  claimed: ${r.claimed}\n  ${r.consistent ? 'OK' : 'FLAG'} — ${r.note}`);
    if (!r.consistent) process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv);
