// Dual EC state recovery for FBCTF 2019 netscream, off-kitchen (@noble/curves).
// The full 65,536-candidate sweep takes minutes; the suite verifies the pinned winning
// completion directly and sweeps a short window around it so the search loop is exercised.
import test from "node:test";
import assert from "node:assert/strict";
import { PUBLISHED, setup, tryGuess, recover, keyFromState, dualEcStep } from "../tools/netscream_dualec_recover.mjs";

test("the published backdoor scalar really is the trapdoor: d·Q == G", () => {
  const ctx = setup();
  assert.equal(ctx.dQEqualsG, true);
});

test("the pinned 16-bit completion yields the organizer's debug key (source semantics)", () => {
  const ctx = setup();
  const hit = tryGuess(ctx, PUBLISHED.encHex, PUBLISHED.recoveredGuess);
  assert.ok(hit, "guess 5245 must lift to a curve point consistent with IV[30:32]");
  assert.equal(hit.state, PUBLISHED.recoveredState);
  assert.equal(hit.keyHex, PUBLISHED.keyHex);
  // and the recovered state regenerates the IV tail: r1 = x(s2·Q) masked to 240 bits,
  // whose top two bytes are IV[30:32]; the next step's output then opens the key.
  const s2 = BigInt("0x" + hit.state);
  const r1 = ctx.Q.multiply(s2).toAffine().x & ((1n << 240n) - 1n);
  assert.equal(r1.toString(16).padStart(60, "0").slice(0, 4), PUBLISHED.encHex.slice(60, 64));
  assert.equal(dualEcStep(ctx, s2).out.toString(16).padStart(60, "0"), PUBLISHED.keyHex.slice(0, 60));
  assert.equal(keyFromState(ctx, BigInt("0x" + hit.state)), PUBLISHED.keyHex);
});

test("a window sweep around the winner finds exactly that one state", () => {
  const ctx = setup();
  const matches = recover(ctx, PUBLISHED.encHex, { start: PUBLISHED.recoveredGuess - 64, limit: 129 });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].guess, PUBLISHED.recoveredGuess);
});

test("the README's msb30 reading does not reproduce the published key at the same completion", () => {
  const ctx = setup();
  const hit = tryGuess(ctx, PUBLISHED.encHex, PUBLISHED.recoveredGuess, { readmeVariant: true });
  assert.ok(!hit || hit.keyHex !== PUBLISHED.keyHex);
});
