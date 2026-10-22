#!/usr/bin/env node
// tools/md5crypt.mjs — MD5 crypt ($1$, Poul-Henning Kamp) verifier.
//
// Sibling of tools/sha256crypt.mjs / tools/sha512crypt.mjs: implements the
// published $1$ scheme so that John the Ripper's **public format test
// vectors** can be wired into local, non-secret regression audits
// (backlog round 13, extending the round-11 sha256crypt audit;
// docs/john-ghidra-diablo-research.md open question 4).
// Verification only — no cracking.

import crypto from 'node:crypto';

const B64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const MAGIC = '$1$';

function md5(...chunks) {
  const h = crypto.createHash('md5');
  for (const c of chunks) h.update(c);
  return h.digest();
}

/** b64_from_24bit(B2, B1, B0, n) from the crypt encoding convention. */
function b64From24(b2, b1, b0, n, out) {
  let w = (b2 << 16) | (b1 << 8) | b0;
  for (let i = 0; i < n; i++) {
    out.push(B64[w & 0x3f]);
    w >>= 6;
  }
}

/** Compute the $1$ hash body (22 chars, without '$1$<salt>$') for pw+salt. */
export function md5crypt(password, salt) {
  const pw = Buffer.from(password, 'utf8');
  const sl = Buffer.from(String(salt).slice(0, 8), 'utf8');

  // Alternate sum.
  const alt = md5(pw, sl, pw);

  // Main context: pw + magic + salt + alt chunks + bit loop.
  const acc = [pw, Buffer.from(MAGIC, 'utf8'), sl];
  for (let cnt = pw.length; cnt > 16; cnt -= 16) acc.push(alt);
  if (pw.length) acc.push(alt.subarray(0, pw.length % 16 || 16));
  // PHK's "something really weird": for each bit of the password length,
  // add a NUL byte (bit set) or the first password byte (bit clear).
  for (let cnt = pw.length; cnt > 0; cnt >>= 1) {
    acc.push((cnt & 1) ? Buffer.alloc(1) : pw.subarray(0, 1));
  }
  let A = md5(...acc);

  // 1000-round stretch.
  for (let i = 0; i < 1000; i++) {
    const parts = [];
    parts.push((i & 1) ? pw : A);
    if (i % 3) parts.push(sl);
    if (i % 7) parts.push(pw);
    parts.push((i & 1) ? A : pw);
    A = md5(...parts);
  }

  // Permuted base64 output (16 bytes → 22 chars).
  const out = [];
  b64From24(A[0], A[6], A[12], 4, out);
  b64From24(A[1], A[7], A[13], 4, out);
  b64From24(A[2], A[8], A[14], 4, out);
  b64From24(A[3], A[9], A[15], 4, out);
  b64From24(A[4], A[10], A[5], 4, out);
  b64From24(0, 0, A[11], 2, out);
  return out.join('');
}

/** Parse a $1$... stored string → { salt, hash } (salt truncated to 8). */
export function parseMd5crypt(stored) {
  const m = /^\$1\$([^$]*)\$([^$]*)$/.exec(String(stored));
  if (!m) throw new Error('not a $1$ string');
  return { salt: m[1].slice(0, 8), saltFull: m[1], hash: m[2] };
}

/** Verify: true when password produces the stored hash. */
export function verifyMd5crypt(stored, password) {
  const { salt, hash } = parseMd5crypt(stored);
  return md5crypt(password, salt) === hash;
}
