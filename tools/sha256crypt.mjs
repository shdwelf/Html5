#!/usr/bin/env node
// tools/sha256crypt.mjs — SHA-256 crypt (Drepper spec, $5$) verifier.
//
// Implements the published "Unix crypt using SHA-256 and SHA-512" algorithm
// (Ulrich Drepper; the scheme behind `crypt.crypt` $5$ entries) so that John
// the Ripper's **public format test vectors** can be wired into local,
// non-secret regression audits (open question 4 in
// docs/john-ghidra-diablo-research.md). Verification only — no cracking.

import crypto from 'node:crypto';

const B64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ROUNDS_DEFAULT = 5000;
const ROUNDS_MIN = 1000;
const ROUNDS_MAX = 999999999;

function sha256(...chunks) {
  const h = crypto.createHash('sha256');
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

/** Compute the $5$ hash body (without '$5$' / 'rounds=' prefix) for pw+salt. */
export function sha256crypt(password, salt, rounds = ROUNDS_DEFAULT) {
  const pw = Buffer.from(password, 'utf8');
  const sl = Buffer.from(salt, 'utf8');
  const roundsClamped = Math.min(Math.max(rounds, ROUNDS_MIN), ROUNDS_MAX);

  // Alternate sum (digest B).
  const alt = sha256(pw, sl, pw);
  // Digest A: single pass — pw + salt + B-chunks + bit loop.
  const acc = [pw, sl];
  for (let cnt = pw.length; cnt > 32; cnt -= 32) acc.push(alt);
  acc.push(alt.subarray(0, pw.length % 32 || (pw.length ? 32 : 0)));
  for (let cnt = pw.length; cnt > 0; cnt >>= 1) {
    acc.push((cnt & 1) ? alt : pw);
  }
  let A = sha256(...acc);

  // P sequence: digest of pw repeated pwlen *times* (total pwlen^2 bytes),
  // stretched back to pwlen bytes.
  const dp = sha256(Buffer.concat(Array(pw.length).fill(pw)));
  const P = pw.length ? repeatTo(dp, pw.length) : Buffer.alloc(0);

  // S sequence: digest of salt repeated (16 + A[0]) *times*, stretched to saltlen.
  const ds = sha256(Buffer.concat(Array(16 + A[0]).fill(sl)));
  const S = sl.length ? repeatTo(ds, sl.length) : Buffer.alloc(0);

  // Rounds loop.
  for (let i = 0; i < roundsClamped; i++) {
    const parts = [];
    parts.push((i & 1) ? P : A);
    if (i % 3) parts.push(S);
    if (i % 7) parts.push(P);
    parts.push((i & 1) ? A : P);
    A = sha256(...parts);
  }

  // Spec's permuted base64 output (32 bytes → 43 chars).
  const out = [];
  b64From24(A[0], A[10], A[20], 4, out);
  b64From24(A[21], A[1], A[11], 4, out);
  b64From24(A[12], A[22], A[2], 4, out);
  b64From24(A[3], A[13], A[23], 4, out);
  b64From24(A[24], A[4], A[14], 4, out);
  b64From24(A[15], A[25], A[5], 4, out);
  b64From24(A[6], A[16], A[26], 4, out);
  b64From24(A[27], A[7], A[17], 4, out);
  b64From24(A[18], A[28], A[8], 4, out);
  b64From24(A[9], A[19], A[29], 4, out);
  b64From24(0, A[31], A[30], 3, out);
  return out.join('');
}

/** Parse a $5$... stored string → { salt, rounds, hash } (salt truncated to 16). */
export function parseSha256crypt(stored) {
  const m = /^\$5\$(?:rounds=(\d+)\$)?([^$]*)\$([^$]*)$/.exec(String(stored));
  if (!m) throw new Error('not a $5$ string');
  return {
    rounds: m[1] ? parseInt(m[1], 10) : ROUNDS_DEFAULT,
    salt: m[2].slice(0, 16),
    saltFull: m[2],
    hash: m[3],
  };
}

/** Constant-time-ish verify: true when password produces the stored hash. */
export function verifySha256crypt(stored, password) {
  const { salt, rounds, hash } = parseSha256crypt(stored);
  return sha256crypt(password, salt, rounds) === hash;
}
