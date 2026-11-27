import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as openpgp from 'openpgp';
import { checkedMessageInput, CLASSIC_OPENPGP_CONFIG, decryptOpenPgpBytes, decryptOpenPgpText, encryptClassicText, MAX_ENCRYPTED_BYTES, MAX_PLAINTEXT_BYTES } from '../apps/openpgp-workbench/crypto.mjs';
const armor = readFileSync('tests/fixtures/openpgp/gnupg-enc-sym-cfb-1.asc', 'utf8');
const raw = (await openpgp.unarmor(armor)).data;

test('independent GnuPG control decrypts from pasted armor, armored-file bytes, binary bytes and ArrayBuffer without any private key', async () => {
  assert.ok(raw instanceof Uint8Array);
  for (const input of [armor, new TextEncoder().encode(armor), raw, raw.slice().buffer]) assert.equal(await decryptOpenPgpText(input, 'password'), 'Hello, world!\n');
});
test('binary payload survives exactly and embedded paths have no output authority', async () => {
  const payload = Uint8Array.of(0, 255, 254, 128, 0, 13, 10, 1);
  const message = await openpgp.createMessage({ binary: payload, filename: '../../untrusted.html' });
  const encrypted = await openpgp.encrypt({ message, passwords: ['synthetic file password'], format: 'binary', config: CLASSIC_OPENPGP_CONFIG });
  assert.deepEqual(await decryptOpenPgpBytes(encrypted, 'synthetic file password'), payload);
  await assert.rejects(decryptOpenPgpText(encrypted, 'synthetic file password'), /not valid UTF-8/);
});
test('public-key-only encryption explains the actual private-key requirement, never asks for a substitute or changes keyring state', async () => {
  const key = await openpgp.generateKey({ type: 'ecc', curve: 'curve25519Legacy', userIDs: [{ name: 'Synthetic message control' }] });
  const ciphertext = await openpgp.encrypt({ message: await openpgp.createMessage({ text: 'not opened without matching secret' }), encryptionKeys: await openpgp.readKey({ armoredKey: key.publicKey }) });
  await assert.rejects(decryptOpenPgpBytes(ciphertext, 'unrelated password'), (error) => error.code === 'PRIVATE_KEY_REQUIRED' && /matching private key/.test(error.message));
});
test('one explicit input format, no concatenation/URL/base64 guessing or key/signature imports', () => {
  for (const input of ['', 'https://example.invalid/message.asc', 'SGVsbG8=', new Uint8Array(), new TextEncoder().encode('not OpenPGP'), '-----BEGIN PGP PRIVATE KEY BLOCK-----\nx\n-----END PGP PRIVATE KEY BLOCK-----', '-----BEGIN PGP PUBLIC KEY BLOCK-----\nx\n-----END PGP PUBLIC KEY BLOCK-----', '-----BEGIN PGP SIGNATURE-----\nx\n-----END PGP SIGNATURE-----', armor + armor, armor + ' trailing junk']) assert.throws(() => checkedMessageInput(input));
  assert.deepEqual(checkedMessageInput('\uFEFF\n' + armor), { armoredMessage: armor.trim() });
});
test('file bytes are bounded before library parsing and Argon2 memory is capped', async () => {
  assert.throws(() => checkedMessageInput(new Uint8Array(MAX_ENCRYPTED_BYTES + 1)), /2,097,152/);
  assert.equal(CLASSIC_OPENPGP_CONFIG.maxArgon2MemoryExponent, 16);
  await assert.rejects(decryptOpenPgpBytes(raw, 'incorrect password'), /decrypt|key|passphrase/i);
  const modified = raw.slice(); modified[modified.length - 1] ^= 1;
  await assert.rejects(decryptOpenPgpBytes(modified, 'password'), /decrypt|integrity|modification|MDC/i);
});
test('duplicate encrypted bodies and reordered or excessive recipients are not silently ignored', async () => {
  // This independent GnuPG fixture starts with an old-format tag-3 SKESK,
  // 13-byte body, followed by one SEIPD. Split its original bytes rather than
  // serializing a lazy Message stream twice or substituting a parser mock.
  assert.deepEqual([...raw.slice(0, 2)], [0x8c, 13]);
  const recipient = raw.slice(0, 15), body = raw.slice(15);
  for (const packets of [[recipient, body, body], [body, recipient], [recipient, recipient, recipient, recipient, recipient, body]]) {
    await assert.rejects(decryptOpenPgpBytes(Buffer.concat(packets), 'password'), /Unsupported encrypted message profile|Unexpected packet/);
  }
});
test('compressed output beyond 1 MiB does not produce a partial payload', async () => {
  const ciphertext = await openpgp.encrypt({ message: await openpgp.createMessage({ binary: new Uint8Array(MAX_PLAINTEXT_BYTES + 1) }), passwords: ['synthetic bound test'], format: 'binary', config: { ...CLASSIC_OPENPGP_CONFIG, preferredCompressionAlgorithm: openpgp.enums.compression.zlib } });
  assert.ok(ciphertext.length < MAX_ENCRYPTED_BYTES);
  await assert.rejects(decryptOpenPgpBytes(ciphertext, 'synthetic bound test'), /limit|size|larger|more than|decompress|too big/i);
});

test('the exact advertised 1 MiB payload boundary remains usable, not merely an oversize rejection', async () => {
  const armor = await encryptClassicText('x'.repeat(MAX_PLAINTEXT_BYTES), 'synthetic boundary control');
  const bytes = await decryptOpenPgpBytes(armor, 'synthetic boundary control');
  assert.equal(bytes.length, MAX_PLAINTEXT_BYTES); assert.ok(bytes.every((byte) => byte === 120));
});

test('Android test-only encrypted file fixture decrypts to its exact four synthetic bytes', async () => {
  const path = 'apps/html5-offline-launcher/app/src/androidTest/assets/openpgp-message-smoke.json';
  const fixture = JSON.parse(readFileSync(path, 'utf8'));
  assert.equal(fixture.schema, 1); assert.equal(fixture.plaintextHex, '00fffe01');
  const bytes = Buffer.from(fixture.ciphertextBase64, 'base64'); assert.equal(bytes.length, 123);
  assert.deepEqual(await decryptOpenPgpBytes(bytes, fixture.passphrase), new Uint8Array(Buffer.from(fixture.plaintextHex, 'hex')));
});
