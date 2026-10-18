import test from 'node:test';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  MealPlanCard, deriveKey, mac, findReplay, findGaps,
  INS, CLA, SW, PIN_MAX_TRIES, CHALLENGE_LEN, MAC_LEN,
} from '../js/mealplan-model.js';

const UID = Buffer.from('0102030405060708');
const MASTER = Buffer.alloc(16, 0x11);

function card(over = {}) {
  return new MealPlanCard({
    uid: UID,
    issuerKey: deriveKey(MASTER, 'MP-I', UID),
    accessKey: deriveKey(MASTER, 'MP-A', UID),
    pin: Buffer.alloc(4, 0x31),
    maxBalance: 5000,
    maxDebit: 1500,
    ...over,
  });
}
const okPIN = Buffer.alloc(4, 0x31);

function funded(c, amount = 2000) {
  c.process({ cla: 0x00, ins: INS.SELECT });
  c.process({ cla: CLA, ins: INS.GET_CHALLENGE });
  const r = c.process({ cla: CLA, ...c.loadCommand(amount) });
  assert.equal(r.sw, SW.OK, 'fixture failed to fund the card');
  return c;
}

/* ------------------------------------------------------------------ positive */

test('load then status reports the balance in integer cents', () => {
  const c = funded(card(), 1234);
  const st = c.process({ cla: CLA, ins: INS.GET_STATUS });
  assert.equal(st.sw, SW.OK);
  assert.equal(st.data.readUInt32BE(0), 1234);
});

test('a PIN-verified, terminal-signed debit succeeds and clears the PIN', () => {
  const c = funded(card());
  const termKey = Buffer.alloc(16, 0x22);
  c.process({ cla: CLA, ins: INS.GET_CHALLENGE });
  const body = Buffer.concat([Buffer.from([INS.SET_STATE]),
    Buffer.from([0, c.atc, 1]), termKey]);
  c.process({ cla: CLA, ins: INS.SET_STATE, p1: 1,
    data: Buffer.concat([c.challenge, termKey, mac(c.issuerKey, body)]) });

  assert.equal(c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: okPIN }).sw, SW.OK);
  const r = c.process({ cla: CLA, ...c.debitCommand(750, termKey, termKey) });
  assert.equal(r.sw, SW.OK);
  assert.equal(c.balance, 1250);

  // The PIN is single-use per purchase: a second debit must re-verify.
  const again = c.process({ cla: CLA, ...c.debitCommand(100, termKey, termKey) });
  assert.equal(again.sw, SW.SECURITY_NOT_SATISFIED);
  assert.equal(c.balance, 1250, 'balance moved without a PIN');
});

test('the ATC advances exactly once per value change', () => {
  const c = funded(card(), 3000);
  const before = c.atc;
  c.process({ cla: CLA, ins: INS.GET_STATUS });
  assert.equal(c.atc, before, 'a read must not advance the counter');
  c.process({ cla: CLA, ins: INS.GET_CHALLENGE });
  c.process({ cla: CLA, ...c.unloadCommand(500) });
  assert.equal(c.atc, before + 1);
});

/* ------------------------------------------------------------------ negative */

test('debit without a PIN is refused and the balance does not move', () => {
  const c = funded(card());
  const r = c.process({ cla: CLA, ins: INS.DEBIT, data: Buffer.alloc(4 + MAC_LEN) });
  assert.equal(r.sw, SW.SECURITY_NOT_SATISFIED);
  assert.equal(c.balance, 2000);
});

test('a forged load MAC is refused and the balance does not move', () => {
  const c = funded(card(), 1000);
  c.process({ cla: CLA, ins: INS.GET_CHALLENGE });
  const forged = Buffer.concat([Buffer.from([0, 0, 39, 16]), c.challenge, Buffer.alloc(MAC_LEN, 0xff)]);
  const r = c.process({ cla: CLA, ins: INS.LOAD, data: forged });
  assert.equal(r.sw, SW.WRONG_DATA);
  assert.equal(c.balance, 1000, 'a forged load changed the balance');
});

test('a load cannot be replayed: the challenge is single use', () => {
  const c = funded(card(), 1000);
  c.process({ cla: CLA, ins: INS.GET_CHALLENGE });
  const cmd = c.loadCommand(500);
  assert.equal(c.process({ cla: CLA, ...cmd }).sw, SW.OK);
  assert.equal(c.balance, 1500);
  // Same command again, same ATC-bound MAC. Must not credit twice.
  assert.equal(c.process({ cla: CLA, ...cmd }).sw, SW.CONDITIONS_NOT_SATISFIED);
  assert.equal(c.balance, 1500);
});

test('the PIN locks after three wrong tries and stays locked', () => {
  const c = card();
  c.process({ cla: 0x00, ins: INS.SELECT });
  const bad = Buffer.alloc(4, 0x99);
  assert.equal(c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: bad }).sw, SW.SECURITY_NOT_SATISFIED);
  assert.equal(c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: bad }).sw, SW.SECURITY_NOT_SATISFIED);
  assert.equal(c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: bad }).sw, SW.AUTH_BLOCKED);
  assert.equal(c.pinTries, 0);
  // Even the correct PIN must now be refused; only the issuer can unlock.
  assert.equal(c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: okPIN }).sw, SW.AUTH_BLOCKED);
});

test('a correct PIN restores the full retry count', () => {
  const c = card();
  c.process({ cla: 0x00, ins: INS.SELECT });
  c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: Buffer.alloc(4, 0x99) });
  assert.equal(c.pinTries, PIN_MAX_TRIES - 1);
  c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: okPIN });
  assert.equal(c.pinTries, PIN_MAX_TRIES);
});

test('the balance cap and the per-transaction cap are both enforced', () => {
  const c = funded(card(), 4500);
  c.process({ cla: CLA, ins: INS.GET_CHALLENGE });
  assert.equal(c.process({ cla: CLA, ...c.loadCommand(1000) }).sw,
    SW.CONDITIONS_NOT_SATISFIED, 'loaded past maxBalance');
  assert.equal(c.balance, 4500, 'an over-cap load was silently clamped');

  const t = funded(card(), 4000);
  t.process({ cla: CLA, ins: INS.VERIFY_PIN, data: okPIN });
  t.terminalKey = Buffer.alloc(16, 0x33);
  const r = t.process({ cla: CLA, ...t.debitCommand(2000, t.terminalKey, t.terminalKey) });
  assert.equal(r.sw, SW.CONDITIONS_NOT_SATISFIED, 'spent past maxDebit');
  assert.equal(t.balance, 4000);
});

test('overdraft is refused', () => {
  const c = funded(card(), 300);
  c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: okPIN });
  c.terminalKey = Buffer.alloc(16, 0x44);
  const r = c.process({ cla: CLA, ...c.debitCommand(400, c.terminalKey, c.terminalKey) });
  assert.equal(r.sw, SW.CONDITIONS_NOT_SATISFIED);
  assert.equal(c.balance, 300);
});

test('SELECT clears the PIN, so a card left in a reader cannot keep spending', () => {
  const c = funded(card());
  c.process({ cla: CLA, ins: INS.VERIFY_PIN, data: okPIN });
  assert.equal(c.pinVerified, true);
  c.process({ cla: 0x00, ins: INS.SELECT });
  assert.equal(c.pinVerified, false);
});

test('an unselected card refuses everything but SELECT', () => {
  const c = card();
  for (const ins of [INS.GET_STATUS, INS.LOAD, INS.DEBIT, INS.PASS])
    assert.equal(c.process({ cla: CLA, ins }).sw, SW.CONDITIONS_NOT_SATISFIED);
});

/* ------------------------------------------------------- purse/pass separation */

test('the pass uses a different key from the purse', () => {
  const c = card();
  assert.notDeepEqual(c.accessKey, c.issuerKey);
  assert.notDeepEqual(deriveKey(MASTER, 'MP-I', UID), deriveKey(MASTER, 'MP-A', UID));
  // Diversification: a different card must not share either key.
  const other = Buffer.from('0102030405060709');
  assert.notDeepEqual(deriveKey(MASTER, 'MP-I', UID), deriveKey(MASTER, 'MP-I', other));
});

test('the pass response binds the reader nonce and the counter', () => {
  const c = card();
  c.process({ cla: 0x00, ins: INS.SELECT });
  const n1 = Buffer.alloc(CHALLENGE_LEN, 0x01);
  const n2 = Buffer.alloc(CHALLENGE_LEN, 0x02);
  const a = c.process({ cla: CLA, ins: INS.PASS, data: n1 });
  const b = c.process({ cla: CLA, ins: INS.PASS, data: n1 });
  const d = c.process({ cla: CLA, ins: INS.PASS, data: n2 });
  assert.equal(a.sw, SW.OK);
  assert.deepEqual(a.data, b.data, 'same nonce and counter should agree');
  assert.notDeepEqual(a.data, d.data, 'response must depend on the nonce');
  // Replay across a value change must differ, because the ATC is in the MAC.
  const atcBefore = a.data.readUInt16BE(0);
  funded(c, 100);
  const e = c.process({ cla: CLA, ins: INS.PASS, data: n1 });
  assert.notEqual(e.data.readUInt16BE(0), atcBefore);
  assert.notDeepEqual(a.data, e.data);
});

test('MAC is truncated HMAC-SHA-256, computed independently here', () => {
  const key = Buffer.alloc(16, 0x5a);
  const want = createHmac('sha256', key).update(Buffer.from('abc')).digest().subarray(0, MAC_LEN);
  assert.deepEqual(mac(key, Buffer.from('abc')), want);
});

/* ------------------------------------------------------------------ settlement */

test('a duplicated ATC is flagged as a replay', () => {
  const log = [
    { uid: 'aa', atc: 1 }, { uid: 'aa', atc: 2 }, { uid: 'aa', atc: 2 },
    { uid: 'bb', atc: 1 },
  ];
  const found = findReplay(log);
  assert.equal(found.length, 1);
  assert.equal(found[0].atc, 2);
  assert.equal(findReplay([{ uid: 'aa', atc: 1 }, { uid: 'bb', atc: 1 }]).length, 0,
    'the same ATC on two different cards is not a replay');
});

test('a suppressed transaction shows up as a gap', () => {
  assert.deepEqual(findGaps([{ atc: 1 }, { atc: 2 }, { atc: 4 }]), [[2, 4]]);
  assert.deepEqual(findGaps([{ atc: 1 }, { atc: 2 }, { atc: 3 }]), []);
});
