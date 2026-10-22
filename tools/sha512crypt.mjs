#!/usr/bin/env node
// tools/sha512crypt.mjs — SHA-512 crypt (Drepper spec, $6$) verifier.
//
// Sibling of tools/sha256crypt.mjs ($5$, backlog round 11): implements the
// published "Unix crypt using SHA-256 and SHA-512" algorithm (Ulrich
// Drepper) so that John the Ripper's **public format test vectors** can be
// wired into local, non-secret regression audits (backlog round 13;
// docs/john-ghidra-diablo-research.md open question 4).
// Verification only — no cracking.

import crypto from 'node:crypto';

const B64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ROUNDS_DEFAULT = 5000;
const ROUNDS_MIN = 1000;
const ROUNDS_MAX = 999999999;

function sha512(...chunks) {
  const h = crypto.createHash('sha512');
  for (const c of chunks) h.update(c);
  return h.digest();
}

function repeatTo(buf, len) {
  const out = Buffer.alloc(len);
  for (let i = 0; i < len; i++) out[i] = buf[i % buf.length];
  return out;
}

/** b64_from_24bit(B2, B1, B0, n) from the spec. */
function b64From24(b2, b1, b0, n, out) {
  let w = (b2 << 16) | (b1 << 8) | b0;
  for (let i = 0; i < n; i++) {
    out.push(B64[w & 0x3f]);
    w >>= 6;
  }
}

/** Compute the $6$ hash body (without '$6$' / 'rounds=' prefix) for pw+salt. */
export function sha512crypt(password, salt, rounds = ROUNDS_DEFAULT) {
  const pw = Buffer.from(password, 'utf8');
  const sl = Buffer.from(salt, 'utf8');
  const roundsClamped = Math.min(Math.max(rounds, ROUNDS_MIN), ROUNDS_MAX);

  // Alternate sum (digest B).
  const alt = sha512(pw, sl, pw);
  // Digest A: single pass — pw + salt + B-chunks (64-byte digest) + bit loop.
  const acc = [pw, sl];
  for (let cnt = pw.length; cnt > 64; cnt -= 64) acc.push(alt);
  acc.push(alt.subarray(0, pw.length % 64 || (pw.length ? 64 : 0)));
  for (let cnt = pw.length; cnt > 0; cnt >>= 1) {
    acc.push((cnt & 1) ? alt : pw);
  }
  let A = sha512(...acc);

  // P sequence: digest of pw repeated pwlen *times*, stretched to pwlen.
  const dp = sha512(Buffer.concat(Array(pw.length).fill(pw)));
  const P = pw.length ? repeatTo(dp, pw.length) : Buffer.alloc(0);

  // S sequence: digest of salt repeated (16 + A[0]) *times*, stretched.
  const ds = sha512(Buffer.concat(Array(16 + A[0]).fill(sl)));
  const S = sl.length ? repeatTo(ds, sl.length) : Buffer.alloc(0);

  // Rounds loop.
  for (let i = 0; i < roundsClamped; i++) {
    const parts = [];
    parts.push((i & 1) ? P : A);
    if (i % 3) parts.push(S);
    if (i % 7) parts.push(P);
    parts.push((i & 1) ? A : P);
    A = sha512(...parts);
  }

  // Spec's permuted base64 output (64 bytes → 86 chars).
  const out = [];
  b64From24(A[0], A[21], A[42], 4, out);
  b64From24(A[22], A[43], A[1], 4, out);
  b64From24(A[44], A[2], A[23], 4, out);
  b64From24(A[3], A[24], A[45], 4, out);
  b64From24(A[25], A[46], A[4], 4, out);
  b64From24(A[47], A[5], A[26], 4, out);
  b64From24(A[6], A[27], A[48], 4, out);
  b64From24(A[28], A[49], A[7], 4, out);
  b64From24(A[50], A[8], A[29], 4, out);
  b64From24(A[9], A[30], A[51], 4, out);
  b64From24(A[31], A[52], A[10], 4, out);
  b64From24(A[53], A[11], A[32], 4, out);
  b64From24(A[12], A[33], A[54], 4, out);
  b64From24(A[34], A[55], A[13], 4, out);
  b64From24(A[56], A[14], A[35], 4, out);
  b64From24(A[15], A[36], A[57], 4, out);
  b64From24(A[37], A[58], A[16], 4, out);
  b64From24(A[59], A[17], A[38], 4, out);
  b64From24(A[18], A[39], A[60], 4, out);
  b64From24(A[40], A[61], A[19], 4, out);
  b64From24(A[62], A[20], A[41], 4, out);
  b64From24(0, 0, A[63], 2, out);
  return out.join('');
}

/** Parse a $6$... stored string → { salt, rounds, hash } (salt truncated to 16). */
export function parseSha512crypt(stored) {
  const m = /^\$6\$(?:rounds=(\d+)\$)?([^$]*)\$([^$]*)$/.exec(String(stored));
  if (!m) throw new Error('not a $6$ string');
  return {
    rounds: m[1] ? parseInt(m[1], 10) : ROUNDS_DEFAULT,
    salt: m[2].slice(0, 16),
    saltFull: m[2],
    hash: m[3],
  };
}

/** Verify: true when password produces the stored hash. */
export function verifySha512crypt(stored, password) {
  const { salt, rounds, hash } = parseSha512crypt(stored);
  return sha512crypt(password, salt, rounds) === hash;
}
