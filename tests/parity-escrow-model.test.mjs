import { test } from "node:test";
import assert from "node:assert/strict";

import {
  GOLDKEY,
  NotRegistered,
  PinLockout,
  TierViolation,
  checksum,
  countingRng,
  createHierarchy,
  gfDiv,
  gfMul,
  gfSelfTest,
  recoverOne,
  shamirCombine,
  shamirSplit,
  xorParity,
} from "../js/parity-escrow-model.js";

const eq = (a, b) => Buffer.from(a).equals(Buffer.from(b));
const SECRET = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

// ------------------------------------------------------------- GF(256) field

test("GF(256) self-test verifies every roundtrip and inverse", () => {
  // 255 roundtrips + 255 inverses.
  assert.equal(gfSelfTest(), 510);
});

test("gfMul matches the FIPS-197 AES field test vector", () => {
  // FIPS-197 section 4.2: {57} * {83} = {c1}
  assert.equal(gfMul(0x57, 0x83), 0xc1);
});

test("gfMul by zero is zero, and multiplication is commutative", () => {
  assert.equal(gfMul(0, 0x53), 0);
  assert.equal(gfMul(0x53, 0), 0);
  assert.equal(gfMul(0x57, 0x83), gfMul(0x83, 0x57));
});

test("gfDiv refuses a zero divisor rather than returning NaN", () => {
  assert.throws(() => gfDiv(1, 0), RangeError);
  assert.equal(gfDiv(0, 5), 0);
  assert.equal(gfDiv(gfMul(9, 0x2b), 0x2b), 9);
});

test("the generator has order 255, not 51", () => {
  // Regression guard: doubling (generator 2) under 0x11b yields only 51
  // elements, because 0x11b is irreducible but NOT primitive. The table must
  // step by 3. If someone reverts to x<<=1 this fails.
  let x = 1;
  const seen = new Set();
  for (let i = 0; i < 255; i++) {
    seen.add(x);
    const t = x << 1;
    const xt = t & 0x100 ? (t ^ 0x11b) & 0xff : t;
    x = xt ^ x;
  }
  assert.equal(seen.size, 255);
  assert.equal(x, 1, "must return to 1 after 255 steps");
});

// ------------------------------------------------------ Shamir secret sharing

test("Shamir 3-of-5 reconstructs from every 3-subset tested", () => {
  const sh = shamirSplit(SECRET, 3, 5, countingRng(7));
  assert.equal(sh.length, 5);
  for (const combo of [[0, 1, 2], [0, 3, 4], [1, 2, 4], [2, 3, 4]]) {
    const got = shamirCombine(combo.map((i) => sh[i]));
    assert.ok(eq(got, SECRET), `subset ${combo} failed`);
  }
});

test("fewer than k shares do NOT reconstruct the secret", () => {
  const sh = shamirSplit(SECRET, 3, 5, countingRng(7));
  const got = shamirCombine([sh[0], sh[1]]);
  assert.equal(got.length, SECRET.length);
  assert.ok(!eq(got, SECRET), "below-threshold shares must not yield the secret");
});

test("shamirSplit validates its parameters", () => {
  assert.throws(() => shamirSplit(SECRET, 6, 5, countingRng(1)), RangeError, "n < k");
  assert.throws(() => shamirSplit(SECRET, 0, 5, countingRng(1)), RangeError, "k < 1");
  assert.throws(() => shamirSplit(SECRET, 3, 256, countingRng(1)), RangeError, "n > 255");
  assert.throws(() => shamirSplit(new Uint8Array(0), 3, 5, countingRng(1)), RangeError, "empty");
  assert.throws(() => shamirSplit([1, 2, 3], 3, 5, countingRng(1)), TypeError, "not Uint8Array");
});

test("shamirCombine rejects duplicate x-coordinates and mismatched lengths", () => {
  const sh = shamirSplit(SECRET, 2, 3, countingRng(2));
  assert.throws(() => shamirCombine([sh[0], sh[0]]), RangeError);
  assert.throws(() => shamirCombine([{ x: 1, y: new Uint8Array(4) }, { x: 2, y: new Uint8Array(8) }]), RangeError);
});

test("k=1 degenerates to n copies of the secret", () => {
  const sh = shamirSplit(SECRET, 1, 3, countingRng(5));
  for (const s of sh) assert.ok(eq(s.y, SECRET));
});

// ------------------------------------------------------------- XOR parity

test("xorParity recovers exactly one lost shard", () => {
  const a = new Uint8Array([1, 2, 3, 4]);
  const b = new Uint8Array([9, 8, 7, 6]);
  const p = xorParity([a, b]);
  assert.ok(eq(recoverOne([a, null], p, 1), b));
  assert.ok(eq(recoverOne([null, b], p, 0), a));
});

test("xorParity refuses two holes instead of guessing", () => {
  const p = xorParity([new Uint8Array([1, 2]), new Uint8Array([3, 4])]);
  assert.throws(() => recoverOne([null, null], p, 0), /exactly one lost shard/);
});

test("xorParity rejects unequal shard lengths", () => {
  assert.throws(
    () => xorParity([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]),
    /equal length/,
  );
});

// ---------------------------------------------------- Hierarchy / escrow rules

function built() {
  const h = createHierarchy({ rng: countingRng(3), grandmasterShares: 2, grandmasterOf: 3 });
  h.establishRecoveryKey(SECRET);
  const master = h.addMaster({ pin: "ABCDEFGH", name: "dept" });
  return { h, master };
}

test("a user token cannot exist without a Master", () => {
  const { h } = built();
  assert.throws(() => h.registerUser({ masterId: "master-nope", pin: "1234" }), NotRegistered);
});

test("the recovery key must be established before any user token exists", () => {
  // GoldKey cannot retro-fit registration: doing so "will render any data it
  // has encrypted permanently inaccessible".
  const h = createHierarchy({ rng: countingRng(4), grandmasterShares: 2, grandmasterOf: 3 });
  const m = h.addMaster({ pin: "ABCDEFGH" });
  h.registerUser({ masterId: m.id, pin: "1234" });
  assert.throws(() => h.establishRecoveryKey(SECRET), TierViolation);
});

test("recovery needs a GrandMaster quorum; fewer shares is an error", () => {
  const { h } = built();
  assert.ok(eq(h.recoverKey([1, 2]), SECRET));
  assert.ok(eq(h.recoverKey([2, 3]), SECRET));
  assert.throws(() => h.recoverKey([1]), TierViolation);
  assert.throws(() => h.recoverKey([]), TierViolation);
});

test("Master PIN must be exactly the documented 8 characters", () => {
  const h = createHierarchy({ rng: countingRng(9) });
  assert.equal(GOLDKEY.PIN_LEN_MASTER, 8);
  assert.throws(() => h.addMaster({ pin: "SHORT" }), RangeError);
  assert.throws(() => h.addMaster({ pin: "TOOLONGPIN" }), RangeError);
  assert.ok(h.addMaster({ pin: "ABCDEFGH" }));
});

test("PIN locks out at exactly ten failed attempts", () => {
  const { h, master } = built();
  assert.equal(GOLDKEY.PIN_MAX_TRIES, 10);
  for (let i = 1; i <= 9; i++) {
    assert.equal(h.verifyPin("master", master.id, "WRONGPIN"), false, `attempt ${i}`);
  }
  assert.throws(() => h.verifyPin("master", master.id, "WRONGPIN"), PinLockout);
  // Locked stays locked even for the right PIN.
  assert.throws(() => h.verifyPin("master", master.id, "ABCDEFGH"), PinLockout);
});

test("a malformed PIN still consumes an attempt", () => {
  const { h, master } = built();
  for (let i = 0; i < 5; i++) {
    assert.throws(() => h.verifyPin("master", master.id, 12345), TypeError);
  }
  assert.equal(h.masters.find((m) => m.id === master.id).attempts, 5);
  // Five more malformed attempts must reach the lockout.
  for (let i = 0; i < 4; i++) assert.throws(() => h.verifyPin("master", master.id, null), TypeError);
  assert.throws(() => h.verifyPin("master", master.id, undefined), PinLockout);
});

test("a correct PIN resets the attempt counter", () => {
  const { h, master } = built();
  h.verifyPin("master", master.id, "WRONGPIN");
  h.verifyPin("master", master.id, "WRONGPIN");
  assert.equal(h.masters.find((m) => m.id === master.id).attempts, 2);
  assert.equal(h.verifyPin("master", master.id, "ABCDEFGH"), true);
  assert.equal(h.masters.find((m) => m.id === master.id).attempts, 0);
});

test("a duplicate is flagged lossy and never presented as a faithful backup", () => {
  const { h, master } = built();
  const u = h.registerUser({ masterId: master.id, pin: "1234" });
  // Put real state on the source first. Without this the assertion below is
  // vacuous: copying empty certificates is indistinguishable from dropping them,
  // and a mutant that preserves them still passes.
  h.issueCertificate(u.id, { slot: "9a", label: "piv-auth" });
  h.issueCertificate(u.id, { slot: "9c", label: "digital-signature" });
  h.setPivSettings(u.id, { pinPolicy: 3, touchPolicy: 2 });
  h.attachUnrecognizedGroup(u.id, "finance");

  const d = h.duplicate(u.id, { masterPin: "ABCDEFGH" });
  assert.equal(d.lossy, true);
  assert.equal(d.faithfulBackup, false);
  assert.deepEqual(d.lost, ["certificates", "pivSettings", "unrecognizedGroups"]);
  assert.deepEqual(d.lost, [...GOLDKEY.DUPLICATE_LOSES]);

  // The copy really did drop them...
  assert.deepEqual(d.token.certificates, []);
  assert.equal(d.token.pivSettings, null);
  assert.deepEqual(d.token.unrecognizedGroups, []);
  // ...while the source kept them, proving the drop is in the copy path.
  const src = h.users.find((x) => x.id === u.id);
  assert.equal(src.certificates.length, 2);
  assert.deepEqual(src.pivSettings, { pinPolicy: 3, touchPolicy: 2 });
  assert.deepEqual(src.unrecognizedGroups, ["finance"]);
  // And the duplicate is a distinct token.
  assert.notEqual(d.token.id, u.id);
});

test("certificate count stops at the documented limit of 24", () => {
  const { h, master } = built();
  const u = h.registerUser({ masterId: master.id, pin: "1234" });
  assert.equal(GOLDKEY.MAX_CERTS, 24);
  for (let i = 0; i < 24; i++) assert.equal(h.issueCertificate(u.id, { slot: `c${i}` }), i + 1);
  assert.throws(() => h.issueCertificate(u.id, { slot: "overflow" }), RangeError);
});

test("duplication requires the correct Master PIN", () => {
  const { h, master } = built();
  const u = h.registerUser({ masterId: master.id, pin: "1234" });
  assert.throws(() => h.duplicate(u.id, { masterPin: "WRONGPIN" }), TierViolation);
});

test("modifying a Master requires a GrandMaster quorum", () => {
  const { h, master } = built();
  assert.throws(
    () => h.modifyMaster(master.id, { grandmasterSharesPresent: [1], patch: { name: "x" } }),
    TierViolation,
  );
  const out = h.modifyMaster(master.id, { grandmasterSharesPresent: [1, 3], patch: { name: "renamed" } });
  assert.equal(out.name, "renamed");
});

test("group creation stops at the documented limit of 63", () => {
  const h = createHierarchy({ rng: countingRng(11) });
  assert.equal(GOLDKEY.MAX_GROUPS, 63);
  for (let i = 0; i < 63; i++) h.createGroup(`g${i}`);
  assert.equal(h.groups.length, 63);
  assert.throws(() => h.createGroup("overflow"), RangeError);
});

test("recoverPayload rebuilds a lost shard for odd-length data", () => {
  const { h, master } = built();
  const payload = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1]); // 9 bytes -> padded shards
  const u = h.registerUser({ masterId: master.id, pin: "1234", payload });
  assert.ok(eq(h.recoverPayload(u.id, 0), payload));
  assert.ok(eq(h.recoverPayload(u.id, 1), payload));
});

test("recoverPayload also round-trips an even-length payload", () => {
  const { h, master } = built();
  const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
  const u = h.registerUser({ masterId: master.id, pin: "1234", payload });
  assert.ok(eq(h.recoverPayload(u.id, 0), payload));
  assert.ok(eq(h.recoverPayload(u.id, 1), payload));
});

test("auditRegistration flags tokens orphaned by a locked-out Master", () => {
  const { h, master } = built();
  const u = h.registerUser({ masterId: master.id, pin: "1234" });
  let a = h.auditRegistration();
  assert.equal(a.fullyCovered, true);
  assert.equal(a.totalUsers, 1);
  assert.equal(a.recoveryEstablished, true);
  assert.deepEqual(a.orphans, []);

  for (let i = 0; i < 10; i++) {
    try { h.verifyPin("master", master.id, "WRONGPIN"); } catch { /* lockout on the 10th */ }
  }
  a = h.auditRegistration();
  assert.equal(a.fullyCovered, false);
  assert.deepEqual(a.orphans, [u.id]);
});

test("checksum detects a single-byte change", () => {
  const a = new Uint8Array([1, 2, 3, 4]);
  const b = new Uint8Array([1, 2, 3, 5]);
  assert.equal(checksum(a), checksum(new Uint8Array([1, 2, 3, 4])));
  assert.notEqual(checksum(a), checksum(b));
  assert.notEqual(checksum(new Uint8Array(0)), checksum(new Uint8Array([0])));
});
