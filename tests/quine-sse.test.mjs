// T9.4: quine verification + S.S.E.-style URL sealing tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { verifyQuine, runCaptured, packQuine, unpackQuine, buildQuineUrl, packedFromUrl, assessUrl, QR_URL_BUDGET } from "../js/quine-sse.js";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

// A true quine: running it prints exactly itself (verified against V8/Node).
const QUINE = '!function $(){console.log("!"+$+"()")}()';

test("a real quine verifies byte-for-byte; impostors are refused", () => {
  assert.equal(verifyQuine(QUINE).ok, true);
  assert.equal(verifyQuine('console.log("hello")').ok, false);
  assert.equal(verifyQuine("throw new Error('boom')").ok, false);
  assert.match(runCaptured(QUINE), /function \$/);
});

test("the sample quine packed into a URL unseals back to itself and re-verifies", async () => {
  const packed = await packQuine(QUINE, "opensesame");
  assert.match(packed, /^quine-sse-v1\.[A-Za-z0-9_-]+$/);
  const url = buildQuineUrl("https://example.test/quine-sse.html", packed);
  assert.equal(await unpackQuine(packedFromUrl(url), "opensesame"), QUINE);
  assert.equal(verifyQuine(await unpackQuine(packed, "opensesame")).ok, true);
});

test("wrong passwords, tampering and foreign payloads are rejected", async () => {
  const packed = await packQuine(QUINE, "opensesame");
  await assert.rejects(unpackQuine(packed, "wrong"), /Unseal failed/);
  const mid = 30;
  const tampered = packed.slice(0, mid) + (packed[mid] === "A" ? "B" : "A") + packed.slice(mid + 1);
  await assert.rejects(unpackQuine(tampered, "opensesame"), /Unseal failed/);
  await assert.rejects(unpackQuine("haiku-vault-v1.AAAA", "x"), /magic/);
  await assert.rejects(packQuine(QUINE, ""), /needs a password/);
});

test("budget verdicts keep unprintable labels from being promised", async () => {
  const small = assessUrl(buildQuineUrl("https://example.test/q", await packQuine(QUINE, "pw")));
  assert.equal(small.fitsQr, true);
  assert.equal(small.fitsSseBudget, true);
  const fat = assessUrl("https://example.test/q#q=" + "A".repeat(QR_URL_BUDGET + 100));
  assert.equal(fat.fitsQr, false);
  assert.match(fat.verdict, /not one QR label/);
});
