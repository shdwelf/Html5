import test from 'node:test';
import assert from 'node:assert/strict';
import { md5crypt, verifyMd5crypt, parseMd5crypt } from '../tools/md5crypt.mjs';
import { sha512crypt, verifySha512crypt, parseSha512crypt } from '../tools/sha512crypt.mjs';

// Round-13 extension of the round-11 audit (tests/john-test-vectors-audit.test.mjs):
// John the Ripper's published md5crypt ($1$) and sha512crypt ($6$) format test
// vectors — public, non-secret fixtures. Sources (same pin as round 11):
// openwall/john @ 5184bc0b8c10, `src/MD5_fmt.c` and
// `src/sha512crypt_common.h`, the `static struct fmt_tests tests[]` arrays.
// Cross-checked against `openssl passwd -1/-6 -salt …` during development.
// See docs/john-ghidra-diablo-research.md open question 4 and
// docs/backlog-execution-round-13-2026-10-22.md.

export const JOHN_MD5CRYPT_VECTORS = [
  ['$1$12345678$aIccj83HRDBo6ux1bVx7D1', '0123456789ABCDE'],
  ['$1$7Uu2iTBB$Y4hQl2WvrOA3LBbLDxbAf0', '12345'],
  ['$1$12345678$f8QoJuo0DpBRfQSD0vglc1', '12345678'],
  ['$1$$qRPK7m23GJusamGpoGLby/', ''],
  ['$1$$AuJCr07mI7DSew03TmBIv/', 'no salt'],
  // salt bytes outside the usual [./0-9A-Za-z] alphabet: the format treats the
  // salt as literal bytes up to the next '$' (JtR fixture, "invalid salt").
  ['$1$`!@#%^&*$E6hD76/pKTS8qToBCkux30', 'invalid salt'],
  ['$1$JVDbGx8K$T9h8HK4LZxeLPMTAxCfpc1', 'password'],
  ['$1$84Othc1n$v1cuReaa5lRdGuHaOa76n0', 'a'],
  // 16/17/33-char passwords cross the alternate-sum chunking boundary.
  ['$1$mJxBkkl8$u7OHfWCPmNxvf0um7hH89.', ''.padEnd(16, 'a')],
  ['$1$Ub1gBUt4$TNaLxU7Pq5mk/MiDEb60b/', ''.padEnd(17, 'a')],
  ['$1$rSZfNcKX$N4XPvGrfhKsyoEcRSaqmG0', ''.padEnd(33, 'a')],
];

export const JOHN_SHA512CRYPT_VECTORS = [
  ['$6$LKO/Ute40T3FNF95$6S/6T2YuOIHY0N3XpLKABJ3soYcXD9mB7uVbtEZDj/LNscVhZoZ9DEH.sBciDrMsHOWOoASbNLTypH/5X26gN0', 'U*U*U*U*'],
  ['$6$OmBOuxFYBZCYAadG$WCckkSZok9xhp4U1shIZEV7CCVwQUwMVea7L3A77th6SaE9jOPupEMJB.z0vIWCDiN9WLh2m9Oszrj5G.gt330', '*U*U*U*U'],
  ['$6$ojWH1AiTee9x1peC$QVEnTvRVlPRhcLQCk/HnHaZmlGAAjCfrAN0FtOsOnUk5K5Bn/9eLHHiRzrTzaIKjW9NTLNIBUCtNVOowWS2mN.', ''],
  ['$6$saltstring$svn8UoSVapNtMuq1ukKS4tPQd8iKwSMHWjl/O817G3uBnIFNjnQJuesI68u4OTLiBFdcbYEdFCoEOfaS35inz1', 'Hello world!'],
  // 15/24/31/32-char passwords exercise the B-chunk remainder logic.
  ['$6$DsS6VmHwcMRA5mAo$vWl2YYUsgN3PTtwDLKhfOIEixnA0USAWN2IswislKP7p8pISFLG6PfBJZU8Smekyl0NiReg552lOmEPaOjhKp/', '123456789012345'],
  ['$6$qWotV46KKiE7Ys69$mk9slOOUDXIJ6ElSdzPJDVWFTkxynoUIHtOujyC7mwHe7ZuZp/UzhmHpBgvjahMrrxN55eowki.bTBT6AvRiL.', '123456789012345678901234'],
  ['$6$6IVHO6ILuFRibuMu$SSTNvTegZ5r3jjAish2m1hqfJeX64.btBb8hDQZNvAPx/K.kBfPaFvcXYkC3YxHEBLaOed3UAVDz7NAm.otik0', '1234567890123456789012345678901'],
  ['$6$ApJWFvgJKcXwSN73$c1wipqpEWqOvcxKg0KcBpMQsNEdbxqIK9M1shyQsGKxIRxCSwcVjAXqGfTTiAJdCVlO2UcBVFNn8m0EjDrujB/', '12345678901234567890123456789012'],
  // 80-char password exceeds one 64-byte digest block.
  ['$6$z5rY05O8xEsEkPIo$e.KPoL.0xBWZHeyY8VQloVEKw2QuDGA9UT7lxO9qduym0ne9sSvl9PZowelKvyji41CYy9Yq0CgJzR6LrmW9m/', '1234567890123456789012345678901234567890123456789012345678901234567890123456789'],
  ['$6$mwt2GD73BqSk4$ol0oMY1zzm59tnAFnH0OM9R/7SL4gi3VJ42AIVQNcGrYx5S1rlZggq5TBqvOGNiNQ0AmjmUMPc.70kL8Lqost.', 'password'],
  ['$6$rounds=4900$saltstring$p3pnU2njiDujK0Pp5us7qlUvkjVaAM0GilTprwyZ1ZiyGKvsfNyDCnlmc.9ahKmDqyqKXMH3frK1I/oEiEbTK/', 'Hello world!'],
  ['$6$TtrrO3IN$D7Qz38n3JOn4Cc6y0340giveWD8uUvBAdPeCI0iC1cGYCmYHDrVXUEoSf3Qp5TRgo7x0BXN4lKNEj7KOvFTZV1', '>7fSy+N\\W=o@Wd&'],
];

test('john vectors: published md5crypt fixtures verify', () => {
  for (const [stored, pw] of JOHN_MD5CRYPT_VECTORS) {
    assert.equal(verifyMd5crypt(stored, pw), true, `vector for ${JSON.stringify(pw)}`);
  }
});

test('john vectors: md5crypt wrong passwords fail', () => {
  for (const [stored] of JOHN_MD5CRYPT_VECTORS) {
    assert.equal(verifyMd5crypt(stored, 'not-the-password'), false);
  }
});

test('john vectors: md5crypt parse (empty salt, 8-char truncation)', () => {
  assert.deepEqual(parseMd5crypt('$1$$qRPK7m23GJusamGpoGLby/'),
    { salt: '', saltFull: '', hash: 'qRPK7m23GJusamGpoGLby/' });
  assert.equal(parseMd5crypt('$1$123456789$xx').salt, '12345678');
  assert.equal(md5crypt('0123456789ABCDE', '12345678'), 'aIccj83HRDBo6ux1bVx7D1');
});

test('john vectors: published sha512crypt fixtures verify', () => {
  for (const [stored, pw] of JOHN_SHA512CRYPT_VECTORS) {
    assert.equal(verifySha512crypt(stored, pw), true, `vector for ${JSON.stringify(pw)}`);
  }
});

test('john vectors: sha512crypt wrong passwords fail (default-rounds set)', () => {
  for (const [stored] of JOHN_SHA512CRYPT_VECTORS) {
    assert.equal(verifySha512crypt(stored, 'not-the-password'), false);
  }
});

// Kept separate: 391,939 rounds costs ~1 s per verify, so this fixture is
// exercised once instead of inside the wrong-password loop above.
test('john vectors: sha512crypt explicit high rounds fixture', () => {
  const stored = '$6$rounds=391939$saltstring$P5HDSEq.sTdSBNmknrLQpg6UHp.9.vuEv6QibJNP8ecoNGo9Wa.3XuR7LKu8FprtxGDpGv17Y27RfTHvER4kI0';
  assert.equal(parseSha512crypt(stored).rounds, 391939);
  assert.equal(verifySha512crypt(stored, 'amy'), true);
});

test('john vectors: parse rejects sibling formats', () => {
  assert.throws(() => parseMd5crypt('$5$salt$hash'), /not a \$1\$/);
  assert.throws(() => parseSha512crypt('$1$salt$hash'), /not a \$6\$/);
  const { salt, rounds, hash } = parseSha512crypt(JOHN_SHA512CRYPT_VECTORS[3][0]);
  assert.equal(sha512crypt('Hello world!', salt, rounds), hash);
});
