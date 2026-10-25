// Reference implementation of Ulrich Drepper's "SHA-crypt" algorithm ($6$, SHA-512).
// Specification: "Unix crypt with SHA-256/SHA-512", Ulrich Drepper, 2007.
// Matches Openwall John the Ripper's sha512crypt implementation (src/sha512crypt_common.h).
//
// Digest output length: 64 bytes.
// Default rounds: 5000 (clamped to 1000..999999999).
// Salt length: up to 16 characters from [a-zA-Z0-9./].
import { createHash } from "node:crypto";

const B64_CHARS = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function b64From24Bit(b2, b1, b0, n) {
  let w = ((b2 & 0xff) << 16) | ((b1 & 0xff) << 8) | (b0 & 0xff);
  let res = "";
  while (n-- > 0) {
    res += B64_CHARS[w & 0x3f];
    w >>= 6;
  }
  return res;
}

// Call-form contract (documented): passing a full `$6$…` string round-trips
// to the full string (verification form); passing a raw salt returns the
// encoded hash only (hash form). The two JtR suites depend on both shapes
// and are both kept as written.
export function sha512crypt(password, saltString, rounds = null) {
  const pwd = Buffer.from(password, "utf8");
  const fullInput = saltString.startsWith("$6$");
  let salt = saltString;
  if (fullInput) {
    const parts = salt.split("$");
    if (parts[2]?.startsWith("rounds=")) {
      rounds = parseInt(parts[2].slice(7), 10);
      salt = parts[3] ?? "";
    } else {
      salt = parts[2] ?? "";
    }
  }
  salt = salt.slice(0, 16);
  const saltBuf = Buffer.from(salt, "utf8");

  let r = 5000;
  if (rounds !== null && rounds !== undefined) {
    r = Math.max(1000, Math.min(999999999, rounds));
  }

  // Digest B = H(key || salt || key)
  const hashB = createHash("sha512");
  hashB.update(pwd);
  hashB.update(saltBuf);
  hashB.update(pwd);
  const b = hashB.digest();

  // Digest A = H(key || salt || B-repeats || bit-loop)
  const hashA = createHash("sha512");
  hashA.update(pwd);
  hashA.update(saltBuf);

  let plen = pwd.length;
  while (plen > 64) {
    hashA.update(b);
    plen -= 64;
  }
  hashA.update(b.subarray(0, plen));

  for (let cnt = pwd.length; cnt > 0; cnt >>= 1) {
    if (cnt & 1) {
      hashA.update(b);
    } else {
      hashA.update(pwd);
    }
  }
  let a = hashA.digest();

  // DP = repeated passes of pwd to get length equal to pwd.length * pwd.length bytes
  const hashDP = createHash("sha512");
  for (let i = 0; i < pwd.length; i++) hashDP.update(pwd);
  const dpFull = hashDP.digest();
  const pSeq = Buffer.alloc(pwd.length);
  for (let off = 0; off < pwd.length; off += 64) {
    dpFull.copy(pSeq, off, 0, Math.min(64, pwd.length - off));
  }

  // DS = repeated passes of salt to get length equal to salt.length * (16 + a[0]) bytes
  const hashDS = createHash("sha512");
  for (let i = 0; i < 16 + a[0]; i++) hashDS.update(saltBuf);
  const dsFull = hashDS.digest();
  const sSeq = Buffer.alloc(saltBuf.length);
  for (let off = 0; off < saltBuf.length; off += 64) {
    dsFull.copy(sSeq, off, 0, Math.min(64, saltBuf.length - off));
  }

  // Rounds loop
  let c = a;
  for (let i = 0; i < r; i++) {
    const h = createHash("sha512");
    if (i & 1) {
      h.update(pSeq);
    } else {
      h.update(c);
    }
    if (i % 3 !== 0) h.update(sSeq);
    if (i % 7 !== 0) h.update(pSeq);
    if (i & 1) {
      h.update(c);
    } else {
      h.update(pSeq);
    }
    c = h.digest();
  }

  // Permutation table for 64-byte SHA-512 output:
  // triplets:
  // 0, 21, 42
  // 22, 43, 1
  // 44, 2, 23
  // 3, 24, 45
  // 25, 46, 4
  // 47, 5, 26
  // 6, 27, 48
  // 28, 49, 7
  // 50, 8, 29
  // 9, 30, 51
  // 31, 52, 10
  // 53, 11, 32
  // 12, 33, 54
  // 34, 55, 13
  // 56, 14, 35
  // 15, 36, 57
  // 37, 58, 16
  // 59, 17, 38
  // 18, 39, 60
  // 40, 61, 19
  // 62, 20, 41
  // 63 (single byte -> 2 chars)
  const perm = [
    [0, 21, 42],
    [22, 43, 1],
    [44, 2, 23],
    [3, 24, 45],
    [25, 46, 4],
    [47, 5, 26],
    [6, 27, 48],
    [28, 49, 7],
    [50, 8, 29],
    [9, 30, 51],
    [31, 52, 10],
    [53, 11, 32],
    [12, 33, 54],
    [34, 55, 13],
    [56, 14, 35],
    [15, 36, 57],
    [37, 58, 16],
    [59, 17, 38],
    [18, 39, 60],
    [40, 61, 19],
    [62, 20, 41],
  ];

  let encoded = "";
  for (const [b0, b1, b2] of perm) {
    encoded += b64From24Bit(c[b0], c[b1], c[b2], 4);
  }
  encoded += b64From24Bit(0, 0, c[63], 2);

  if (!fullInput) return encoded;
  if (rounds !== null && rounds !== undefined && rounds !== 5000) {
    return `$6$rounds=${r}$${salt}$${encoded}`;
  }
  return `$6$${salt}$${encoded}`;
}

// --- helpers consumed by the JtR vector suite (round-13 extension) ---

export function parseSha512crypt(stored) {
  if (typeof stored !== "string" || !stored.startsWith("$6$")) {
    throw new Error("not a $6$ sha512crypt string");
  }
  const parts = stored.slice(3).split("$");
  let rounds = 5000;
  let salt;
  let hash;
  if (parts[0]?.startsWith("rounds=")) {
    rounds = parseInt(parts[0].slice(7), 10);
    salt = parts[1] ?? "";
    hash = parts[2] ?? "";
  } else {
    salt = parts[0] ?? "";
    hash = parts[1] ?? "";
  }
  if (!hash || !Number.isFinite(rounds)) throw new Error("not a $6$ sha512crypt string");
  return { salt, rounds, hash };
}

export function verifySha512crypt(stored, password) {
  const { salt, rounds, hash } = parseSha512crypt(stored);
  const generated = sha512crypt(password, salt, rounds);
  const generatedHash = generated.includes("$")
    ? generated.slice(generated.lastIndexOf("$") + 1)
    : generated;
  return generatedHash === hash;
}
