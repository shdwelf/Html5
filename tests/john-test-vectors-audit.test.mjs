import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256crypt, verifySha256crypt, parseSha256crypt } from '../tools/sha256crypt.mjs';

// John the Ripper's published sha256crypt format test vectors — public,
// non-secret fixtures (plaintexts are the classic test strings from the
// Drepper spec / JtR corpus). Source: openwall/john
// src/sha256crypt_common.h @ 5184bc0b8c10 (bleeding-jumbo, fetched 2026-10-21),
// the `static struct fmt_tests tests[]` array — see
// docs/john-ghidra-diablo-research.md open question 4.
export const JOHN_SHA256CRYPT_VECTORS = [
  ['$5$LKO/Ute40T3FNF95$U0prpBQd4PloSGU0pnpM4z9wKn4vZ1.jsrzQfPqxph9', 'U*U*U*U*'],
  ['$5$LKO/Ute40T3FNF95$fdgfoJEBoMajNxCv3Ru9LyQ0xZgv0OBMQoq80LQ/Qd.', 'U*U***U'],
  ['$5$LKO/Ute40T3FNF95$8Ry82xGnnPI/6HtFYnvPBTYgOL23sdMXn8C29aO.x/A', 'U*U***U*'],
  ['$5$9mx1HkCz7G1xho50$O7V7YgleJKLUhcfk9pgzdh3RapEaWqMtEp9UUBAKIPA', '*U*U*U*U'],
  // salt text longer than 16 chars must be truncated by the algorithm
  ['$5$kc7lRD1fpYg0g.IP.ThisShouldBeTruncated.$d7CMTcEqJyTXyeq8hTdu/jB/I6DGkoo62NXbHIR7S43', ''],
  ['$5$saltstring$5B8vYYiY.CVt1RlTTf8KbXBH3hsxY/GNooZaBBGWEc5', 'Hello world!'],
  ['$5$V8UMZ8/8.j$GGzeGHZy60318qdLiocMj7DddCnfr7jIcLMDIRy9Tr0', 'password'],
];

test('john vectors: all 7 published sha256crypt fixtures verify', () => {
  for (const [stored, pw] of JOHN_SHA256CRYPT_VECTORS) {
    assert.equal(verifySha256crypt(stored, pw), true, `vector for ${JSON.stringify(pw)}`);
  }
});

test('john vectors: wrong passwords fail', () => {
  for (const [stored] of JOHN_SHA256CRYPT_VECTORS) {
    assert.equal(verifySha256crypt(stored, 'not-the-password'), false);
  }
});

test('john vectors: parse round-trip (incl. 16-char salt truncation)', () => {
  const v = parseSha256crypt('$5$kc7lRD1fpYg0g.IP.ThisShouldBeTruncated.$d7CMTcEqJyTXyeq8hTdu/jB/I6DGkoo62NXbHIR7S43');
  assert.equal(v.salt, 'kc7lRD1fpYg0g.IP');
  assert.equal(v.rounds, 5000);
  assert.equal(v.hash, 'd7CMTcEqJyTXyeq8hTdu/jB/I6DGkoo62NXbHIR7S43');
});

test('john vectors: recomputation matches stored body', () => {
  const [stored, pw] = JOHN_SHA256CRYPT_VECTORS[5]; // "Hello world!" spec example
  const { salt, rounds, hash } = parseSha256crypt(stored);
  assert.equal(sha256crypt(pw, salt, rounds), hash);
});

test('john vectors: rejects non-$5$ input', () => {
  assert.throws(() => parseSha256crypt('$6$rounds=5000$salt$hash'), /not a \$5\$/);
});
