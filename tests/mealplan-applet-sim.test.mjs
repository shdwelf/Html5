/*
 * mealplan-applet-sim.test.mjs -- the converted applet, run, against the model.
 *
 * The other two meal-plan suites are static. mealplan-model.test.mjs exercises
 * js/mealplan-model.js on its own; mealplan-applet.test.mjs parses
 * MealPlanApplet.java and checks its constants against the model. Neither sends
 * an APDU, so neither can catch two implementations that agree on the APDU table
 * and disagree on the MAC -- the failure mode that matters most for a purse,
 * because it looks correct on both sides and breaks on the first real card.
 *
 * This suite runs the applet in the Java Card simulator and has js/mealplan-model
 * .js play the issuer and the terminal. Node derives the keys and computes the
 * MACs; the applet verifies them through the Java Card Signature API. Two
 * independent HMAC-SHA-256 implementations have to agree on every authenticated
 * command.
 *
 * It caught three things the static suites could not: personalise() read the
 * install data from the wrong offset in the GlobalPlatform block and loaded keys
 * derived from the public instance AID; deriveKey() truncated to the 8-byte tag
 * width instead of the 16-byte key width the applet personalises; and the purse
 * keys were transient, so a card reset would have left a balance nobody could
 * authenticate a transaction against.
 *
 * Needs tools/build_mealplan_applet.sh --sim (fetched and compiled on demand),
 * which is why it is slower than the other suites: every test starts a JVM.
 */

import test, { before } from 'node:test';
import assert from 'node:assert/strict';

import {
  RealCard, ensureBuilt, swName, deriveKey, mac, INS, SW, MAC_LEN, PIN_MAX_TRIES,
} from '../tools/run_mealplan_sim.mjs';

const MASTER = Buffer.alloc(16, 0x11);
const UID = Buffer.from('C1A00001', 'hex');

const OPTS = {
  uid: UID,
  issuerKey: deriveKey(MASTER, 'MP-I', UID),
  accessKey: deriveKey(MASTER, 'MP-A', UID),
  pin: Buffer.from('1234'),
  maxBalance: 10000,   // 100.00
  maxDebit: 1250,      // 12.50
};

/** One freshly installed card per test; a JVM each, so keep them purposeful. */
async function withCard(fn) {
  const card = await RealCard.open(OPTS);
  try { return await fn(card); } finally { await card.close(); }
}

let toolchainError = null;
before(() => {
  try {
    ensureBuilt();
  } catch (error) {
    toolchainError = error;
  }
});

/**
 * Card-backed tests share one toolchain preparation step. If the pinned
 * GitHub-hosted JDK/Java Card fetch is unavailable, report those cases as
 * skipped rather than as 17 misleading `spawn .../bin/java ENOENT` failures;
 * the static key-width test below still runs.
 */
const simTest = (name, body) => test(name, async (t) => {
  if (toolchainError) {
    t.skip(`MealPlan Java Card toolchain unavailable: ${String(toolchainError.message).split('\n')[0]}`);
    return;
  }
  await body();
});

const be16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };
const be32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };

/* --------------------------------------------------------------- provisioning */

test('derived keys are the width the applet personalises, not the tag width', () => {
  // deriveKey() used to route through mac(), which truncates to MAC_LEN = 8.
  // A 64-bit key is weaker than the 64-bit tag it protects, and the applet
  // personalises 16 bytes, so install would have rejected every real card.
  assert.equal(OPTS.issuerKey.length, 16);
  assert.equal(OPTS.accessKey.length, 16);
  assert.notEqual(MAC_LEN, 16, 'the tag width must differ from the key width');
});

simTest('a fresh card starts empty, unauthenticated, with a full PIN counter', () => withCard(async (c) => {
  const s = await c.status();
  assert.equal(s.balance, 0);
  assert.equal(s.atc, 0);
  assert.equal(s.tries, PIN_MAX_TRIES);
  assert.equal(s.pinValidated, false);
}));

simTest('challenges come from the platform and are never repeated', () => withCard(async (c) => {
  const a = await c.challenge();
  const b = await c.challenge();
  assert.equal(a.length, 8);
  assert.notDeepEqual(a, b);
  assert.notDeepEqual(a, Buffer.alloc(8), 'a zero challenge would make every MAC forgeable');
}));

/* ----------------------------------------------------------------- the purse */

simTest('a load authenticated by the issuer moves value and bumps the counter', () => withCard(async (c) => {
  await c.challenge();
  const r = await c.load(2500);
  assert.equal(r.sw, SW.OK, `load rejected: ${swName(r.sw)}`);

  const s = await c.status();
  assert.equal(s.balance, 2500);
  assert.equal(s.atc, 1);

  // The receipt is MAC(issuerKey, ATC || balance), so the backend can settle
  // against it. Checked here in Node against what the card returned.
  const want = mac(OPTS.issuerKey, be16(1), be32(2500));
  assert.deepEqual(r.body.subarray(6, 6 + MAC_LEN), want, 'receipt MAC mismatch');
}));

simTest('a load with a forged MAC is refused', () => withCard(async (c) => {
  const chal = await c.challenge();
  await c.sync();
  const amt = be32(2500);
  // Right shape, wrong MAC: this is the attack the whole design exists to stop.
  const data = Buffer.concat([amt, chal, Buffer.alloc(MAC_LEN, 0xAB)]);
  const r = await c.raw(Buffer.concat([Buffer.from([0x80, INS.LOAD, 0, 0, data.length]), data]));
  assert.equal(r.sw, SW.WRONG_DATA, `forged load accepted: ${swName(r.sw)}`);
  assert.equal((await c.status()).balance, 0, 'value moved on a forged load');
}));

simTest('a load with the issuer key over the wrong bytes is refused', () => withCard(async (c) => {
  const chal = await c.challenge();
  await c.sync();
  const amt = be32(2500);
  // Correctly keyed MAC over amount || ATC instead of ATC || amount. Agrees on
  // every constant with the applet, disagrees on byte order, and must fail.
  const bad = mac(OPTS.issuerKey, amt, be16(c.model.atc));
  const data = Buffer.concat([amt, chal, bad]);
  const r = await c.raw(Buffer.concat([Buffer.from([0x80, INS.LOAD, 0, 0, data.length]), data]));
  assert.equal(r.sw, SW.WRONG_DATA, 'MAC over misordered bytes was accepted');
}));

simTest('a challenge cannot be replayed, even with a valid MAC', () => withCard(async (c) => {
  const chal = await c.challenge();
  await c.sync();
  const atc = c.model.atc;
  const amt = be32(1000);
  const tag = mac(OPTS.issuerKey, Buffer.from([INS.LOAD]), be16(atc), amt);
  const data = Buffer.concat([amt, chal, tag]);
  const apdu = Buffer.concat([Buffer.from([0x80, INS.LOAD, 0, 0, data.length]), data]);

  assert.equal((await c.raw(apdu)).sw, SW.OK, 'first load should succeed');
  const again = await c.raw(apdu);
  assert.notEqual(again.sw, SW.OK, `challenge replayed: ${swName(again.sw)}`);
  assert.equal((await c.status()).balance, 1000, 'replayed load moved value twice');
}));

simTest('a load above the ceiling is refused outright, not clamped', () => withCard(async (c) => {
  await c.challenge();
  const r = await c.load(OPTS.maxBalance + 1);
  assert.equal(r.sw, SW.CONDITIONS_NOT_SATISFIED, `over-cap load accepted: ${swName(r.sw)}`);
  // Clamping would quietly give the backend a different number than it asked
  // for, which is a reconciliation bug nobody would hear about.
  assert.equal((await c.status()).balance, 0);
}));

/* -------------------------------------------------------------------- spend */

simTest('a debit needs the PIN as well as the terminal MAC', () => withCard(async (c) => {
  await c.challenge();
  await c.load(5000);
  await c.setTerminalKey(Buffer.alloc(16, 0x55));

  const noPin = await c.debit(500, Buffer.alloc(16, 0x55));
  assert.equal(noPin.sw, SW.SECURITY_NOT_SATISFIED, `debit without PIN: ${swName(noPin.sw)}`);

  assert.equal((await c.verifyPin()).sw, SW.OK);
  const withPin = await c.debit(500, Buffer.alloc(16, 0x55));
  assert.equal(withPin.sw, SW.OK, `debit with both secrets: ${swName(withPin.sw)}`);
  assert.equal((await c.status()).balance, 4500);
}));

simTest('a debit is refused before the terminal key is provisioned', () => withCard(async (c) => {
  await c.challenge();
  await c.load(5000);
  assert.equal((await c.verifyPin()).sw, SW.OK);
  const r = await c.debit(500, Buffer.alloc(16, 0x55));
  assert.equal(r.sw, SW.CONDITIONS_NOT_SATISFIED, `unprovisioned debit: ${swName(r.sw)}`);
}));

simTest('a debit authorised by the wrong terminal is refused', () => withCard(async (c) => {
  await c.challenge();
  await c.load(5000);
  await c.setTerminalKey(Buffer.alloc(16, 0x55));
  assert.equal((await c.verifyPin()).sw, SW.OK);
  // A different till's key: a laptop on the same reader must not spend.
  const r = await c.debit(500, Buffer.alloc(16, 0x66));
  assert.equal(r.sw, SW.WRONG_DATA, `foreign terminal debit: ${swName(r.sw)}`);
  assert.equal((await c.status()).balance, 5000);
}));

simTest('a debit above the per-transaction cap is refused', () => withCard(async (c) => {
  await c.challenge();
  await c.load(5000);
  await c.setTerminalKey(Buffer.alloc(16, 0x55));
  assert.equal((await c.verifyPin()).sw, SW.OK);
  const r = await c.debit(OPTS.maxDebit + 1, Buffer.alloc(16, 0x55));
  assert.equal(r.sw, SW.CONDITIONS_NOT_SATISFIED, `over-cap debit: ${swName(r.sw)}`);
}));

simTest('one authorisation buys one purchase', () => withCard(async (c) => {
  await c.challenge();
  await c.load(5000);
  await c.setTerminalKey(Buffer.alloc(16, 0x55));
  assert.equal((await c.verifyPin()).sw, SW.OK);
  assert.equal((await c.debit(500, Buffer.alloc(16, 0x55))).sw, SW.OK);
  assert.equal((await c.status()).pinValidated, false, 'PIN stayed verified after a spend');
  const second = await c.debit(500, Buffer.alloc(16, 0x55));
  assert.equal(second.sw, SW.SECURITY_NOT_SATISFIED, 'one PIN check bought two purchases');
}));

simTest('the PIN counter blocks after the configured number of failures', () => withCard(async (c) => {
  const wrong = Buffer.from('9999');
  for (let i = 0; i < PIN_MAX_TRIES; i++) {
    const r = await c.verifyPin(wrong);
    assert.notEqual(r.sw, SW.OK, `wrong PIN accepted on attempt ${i + 1}`);
  }
  const blocked = await c.verifyPin(OPTS.pin);
  assert.equal(blocked.sw, SW.AUTH_BLOCKED,
    `the correct PIN after lockout gave ${swName(blocked.sw)}, not AUTH_BLOCKED`);
  assert.equal((await c.status()).tries, 0);
}));

/* ----------------------------------------------------------------- door pass */

simTest('the pass is signed with the access key over nonce and counter', () => withCard(async (c) => {
  await c.challenge();
  await c.load(1000);                       // advances the ATC so it is not zero
  await c.sync();

  const nonce = Buffer.from('0102030405060708', 'hex');
  const r = await c.pass(nonce);
  assert.equal(r.sw, SW.OK, `pass: ${swName(r.sw)}`);
  assert.equal(r.body.readUInt16BE(0), c.model.atc);

  // Verified in Node with the access key, which is not the purse key.
  const want = mac(OPTS.accessKey, nonce, be16(c.model.atc));
  assert.deepEqual(r.body.subarray(2), want, 'pass MAC mismatch');
  const purseAttempt = mac(OPTS.issuerKey, nonce, be16(c.model.atc));
  assert.notDeepEqual(r.body.subarray(2), purseAttempt,
    'the door credential is using the purse key');
}));

simTest('a captured pass response does not replay once the counter moves', () => withCard(async (c) => {
  const nonce = Buffer.from('0a0b0c0d0e0f0011', 'hex');
  await c.sync();
  const first = (await c.pass(nonce)).body;

  await c.challenge();
  await c.load(100);                       // ATC advances
  await c.sync();
  const second = (await c.pass(nonce)).body;

  assert.notDeepEqual(first, second, 'same nonce and same ATC gave the same pass response');
}));

/* ------------------------------------------------------------------ framing */

simTest('an unknown instruction and a foreign class are both rejected', () => withCard(async (c) => {
  assert.equal((await c.raw([0x80, 0x77, 0, 0, 0])).sw, SW.INS_NOT_SUPPORTED);
  assert.equal((await c.raw([0x00, INS.GET_STATUS, 0, 0, 0])).sw, SW.CLA_NOT_SUPPORTED);
}));

/* ------------------------------------------------- shim honesty: the caveat */

simTest('the simulator is running JDK crypto under the BouncyCastle name', () => withCard(async (c) => {
  // Recorded rather than buried: vjcre.jar's own Signature is an empty stub, so
  // the shim in tools/sim/simshim supplies HMAC. If this ever reports real
  // BouncyCastle, the MAC comparisons above are being computed by code this
  // repository does not control, and that should be noticed.
  assert.match(c.sim.banner, /crypto=jdk-shim\([1-9]\d*\)/,
    `unexpected crypto provider: ${c.sim.banner}`);
}));
