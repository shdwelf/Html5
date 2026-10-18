import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INS, CLA, SW, PIN_MAX_TRIES, CHALLENGE_LEN, MAC_LEN, ISSUER_KEY_LEN }
  from '../js/mealplan-model.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const JAVA = join(ROOT, 'smartcard', 'mealplan', 'src',
  'com', 'shdwelf', 'mealplan', 'MealPlanApplet.java');

const src = readFileSync(JAVA, 'utf8');

/** Pull `public static final <type> NAME = (byte) 0xNN;` out of the source. */
function constant(name) {
  const m = src.match(new RegExp(
    `public static final (?:byte|short)\\s+${name}\\s*=\\s*\\((?:byte|short)\\)\\s*(0x[0-9A-Fa-f]+|\\d+)`));
  assert.ok(m, `constant ${name} not found in MealPlanApplet.java`);
  return Number(m[1]);
}

/**
 * The point of this suite.
 *
 * The applet is compiled by tools/build_mealplan_applet.sh, which needs a JDK
 * and the Java Card kit and is not part of `npm test`. What can be checked
 * everywhere, and is, is that the two implementations agree on every constant
 * they share — the APDU table, the status words and the lengths. Those are
 * exactly the places a port goes wrong, and a mismatch would look correct on
 * each side in isolation and fail on the first real card.
 */

test('MealPlanApplet.java exists and declares the applet class', () => {
  assert.ok(existsSync(JAVA));
  assert.match(src, /public class MealPlanApplet extends Applet/);
});

test('the CLA matches the model', () => {
  assert.equal(constant('CLA_PROP'), CLA);
});

test('every INS matches the model', () => {
  const map = {
    INS_GET_STATUS: 'GET_STATUS',
    INS_GET_CHAL: 'GET_CHALLENGE',
    INS_VERIFY_PIN: 'VERIFY_PIN',
    INS_LOAD: 'LOAD',
    INS_DEBIT: 'DEBIT',
    INS_UNLOAD: 'UNLOAD',
    INS_PASS: 'PASS',
    INS_SET_STATE: 'SET_STATE',
  };
  for (const [java, js] of Object.entries(map))
    assert.equal(constant(java), INS[js], `${java} vs model INS.${js}`);
});

test('the auth-blocked status word matches the model', () => {
  assert.equal(constant('SW_AUTH_BLOCKED'), SW.AUTH_BLOCKED);
});

test('the PIN, challenge, MAC and key lengths match the model', () => {
  assert.equal(constant('PIN_MAX_TRIES'), PIN_MAX_TRIES);
  assert.equal(constant('PIN_LEN'), 4);
  assert.equal(constant('CHALLENGE_LEN'), CHALLENGE_LEN);
  assert.equal(constant('MAC_LEN'), MAC_LEN);
  assert.equal(constant('KEY_LEN'), ISSUER_KEY_LEN);
});

test('the applet uses the same MAC primitive as the model', () => {
  // The model truncates HMAC-SHA-256. If the card used anything else the two
  // would each look right and never interoperate.
  assert.match(src, /Signature\.ALG_HMAC_SHA_256/);
  assert.match(src, /HMACKey/);
  assert.doesNotMatch(src, /ALG_AES_MAC|ALG_DES_MAC/,
    'the model uses HMAC-SHA-256, not a block-cipher MAC');
});

test('the MAC is truncated to MAC_LEN the way the model truncates it', () => {
  assert.match(src, /if \(m > MAC_LEN\) m = MAC_LEN|if \(produced < MAC_LEN\)/);
});

/* ------------------------------------------------ Java Card language rules */

test('no allocation outside install()', () => {
  // Java Card forbids `new` outside install(); it throws at convert time on
  // some platforms and simply cannot be supported on others.
  const body = src.slice(src.indexOf('public void process'));
  const allocations = body.match(/\bnew\s+[A-Z][A-Za-z0-9_]*/g) || [];
  assert.deepEqual(allocations, [],
    `allocation inside process() or a helper: ${allocations.join(', ')}`);
});

test('session state is transient, so a card left in a reader forgets the PIN', () => {
  assert.match(src, /CLEAR_ON_DESELECT/,
    'PIN-validated flag and challenge must clear on deselect');
  assert.match(src, /makeTransientBooleanArray/);
  assert.match(src, /makeTransientByteArray/);
});

test('the PIN uses the platform primitive, not a hand-rolled compare', () => {
  assert.match(src, /OwnerPIN/);
  assert.match(src, /pin\.check\(/);
  assert.match(src, /getTriesRemaining\(\)/,
    'the retry counter must come from OwnerPIN, not a private byte');
});

test('the purse key and the pass key are separate', () => {
  assert.match(src, /issuerKey/);
  assert.match(src, /accessKey/);
  // The pass response must be signed with the access key, never the issuer key.
  const passFn = src.slice(src.indexOf('private void passResponse'),
    src.indexOf('private void setState'));
  assert.match(passFn, /mac\.init\(accessKey/);
  assert.doesNotMatch(passFn, /issuerKey/);
});

test('value changes are gated on a MAC and the caps are enforced', () => {
  assert.match(src, /verifyIssuerMac\(INS_LOAD/);
  assert.match(src, /verifyIssuerMac\(INS_UNLOAD/);
  assert.match(src, /verifyMac\(terminalKey, INS_DEBIT/);
  assert.match(src, /maxBalance/);
  assert.match(src, /maxDebit/);
  assert.match(src, /gt\(buf, cd, maxDebit\)/,
    'the debit amount must be compared from the command-data offset, not 0');
});

test('no int or long locals, which Java Card does not have', () => {
  const decls = src.match(/^\s*(int|long)\s+[a-zA-Z_]/gm) || [];
  assert.deepEqual(decls, [], `int/long local declarations: ${decls.join(', ')}`);
});

test('array indices are computed in short, not int', () => {
  assert.match(src, /\(short\) \(aOff \+ i\)/);
  assert.match(src, /\(short\) \(bOff \+ i\)/);
  assert.match(src, /\(short\) \(tagOff \+ i\)/);
});
