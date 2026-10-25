// Reference implementation of Poul-Henning Kamp's MD5-crypt algorithm ($1$).
// Designed in 1994 for FreeBSD to replace DES crypt(3).
// Matches Openwall John the Ripper's MD5_fmt.c test vectors.
// Salt: up to 8 characters.
// Output: $1$<salt>$<hash> (22 chars of base64).
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

export function md5crypt(password, saltString) {
  const pwd = Buffer.from(password, "utf8");
  let salt = saltString;
  if (salt.startsWith("$1$")) {
    salt = salt.slice(3).split("$")[0];
  }
  salt = salt.slice(0, 8);
  const saltBuf = Buffer.from(salt, "utf8");

  // Hash B = MD5(password || salt || password)
  const hashB = createHash("md5");
  hashB.update(pwd);
  hashB.update(saltBuf);
  hashB.update(pwd);
  const b = hashB.digest();

  // Hash A = MD5(password || "$1$" || salt || B-repeats || bit-loop)
  const hashA = createHash("md5");
  hashA.update(pwd);
  hashA.update(Buffer.from("$1$", "utf8"));
  hashA.update(saltBuf);

  let plen = pwd.length;
  while (plen > 16) {
    hashA.update(b);
    plen -= 16;
  }
  hashA.update(b.subarray(0, plen));

  for (let cnt = pwd.length; cnt > 0; cnt >>= 1) {
    if (cnt & 1) {
      hashA.update(Buffer.from([0]));
    } else {
      hashA.update(pwd.subarray(0, 1));
    }
  }
  let a = hashA.digest();

  // 1000 rounds
  for (let i = 0; i < 1000; i++) {
    const h = createHash("md5");
    if (i & 1) {
      h.update(pwd);
    } else {
      h.update(a);
    }
    if (i % 3 !== 0) {
      h.update(saltBuf);
    }
    if (i % 7 !== 0) {
      h.update(pwd);
    }
    if (i & 1) {
      h.update(a);
    } else {
      h.update(pwd);
    }
    a = h.digest();
  }

  // Kamp's permutation for 16-byte MD5 digest:
  // triplets:
  // (0, 6, 12), (1, 7, 13), (2, 8, 14), (3, 9, 15), (4, 10, 5)
  // last byte: (-, -, 11) -> 2 chars
  const perm = [
    [0, 6, 12],
    [1, 7, 13],
    [2, 8, 14],
    [3, 9, 15],
    [4, 10, 5]
  ];

  let encoded = "";
  for (const [b0, b1, b2] of perm) {
    encoded += b64From24Bit(a[b0], a[b1], a[b2], 4);
  }
  encoded += b64From24Bit(0, 0, a[11], 2);

  return `$1$${salt}$${encoded}`;
}
