// T9.1: virtualized card reader — APDU codec, filesystem, PIN lockout, applets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseApdu, buildApdu, createReader, demoCard, SW } from "../js/cardreader.js";

const swOf = (resp) => (resp[resp.length - 2] << 8) | resp[resp.length - 1];
const text = (bytes) => new TextDecoder().decode(bytes);

test("APDU codec parses command cases and round-trips", () => {
  const sel = buildApdu({ ins: 0xA4, p1: 0x04, data: Uint8Array.from([0xA0, 0x00]) });
  const parsed = parseApdu(sel);
  assert.equal(parsed.ins, 0xA4);
  assert.deepEqual([...parsed.data], [0xA0, 0x00]);
  const read = buildApdu({ ins: 0xB0, p1: 0, p2: 4, le: 16 });
  assert.equal(parseApdu(read).le, 16);
  assert.throws(() => parseApdu(Uint8Array.from([0x00, 0xA4])), /too short/);
  assert.throws(() => parseApdu(Uint8Array.from([0x00, 0xA4, 0, 0, 9, 1])), /truncated/);
});

test("filesystem walk: MF -> DF -> EF, with honest not-found statuses", () => {
  const r = createReader(demoCard());
  assert.equal(swOf(r.selectFile("3F00")), SW.OK);
  assert.equal(text(r.unwrap(r.selectFile("2F01"))), "EF:2F01");
  assert.match(text(r.unwrap(r.readBinary(0, 64))), /SITE-K demo card/);
  assert.equal(swOf(r.selectFile("7F10")), SW.OK);
  assert.equal(swOf(r.selectFile("FFFF")), SW.FILE_NOT_FOUND);
  // every exchange went over the wire as APDU hex
  assert.ok(r.log.length >= 4 && r.log.every((e) => /^[0-9A-F ]+$/.test(e.cmd)));
});

test("PIN gate: protected EF refuses before VERIFY, opens after, writes stick", () => {
  const r = createReader(demoCard());
  r.selectFile("7F10");
  r.selectFile("6F02");
  assert.equal(swOf(r.readBinary(0, 64)), SW.SECURITY_STATUS);
  assert.equal(swOf(r.verifyPin("1234")), SW.OK);
  assert.match(text(r.unwrap(r.readBinary(0, 64))), /grandmaster: DEMO-ONLY/);
  assert.equal(swOf(r.updateBinary(0, new TextEncoder().encode("master"))), SW.OK);
  assert.match(text(r.unwrap(r.readBinary(0, 6))), /master/);
});

test("wrong PINs burn retries 63C2 -> 63C0 -> blocked 6983, and blocked is sticky", () => {
  const card = demoCard();
  const r = createReader(card);
  assert.equal(swOf(r.verifyPin("0000")), SW.retriesLeft(2));
  assert.equal(swOf(r.verifyPin("0000")), SW.retriesLeft(1));
  assert.equal(swOf(r.verifyPin("0000")), SW.AUTH_BLOCKED);
  assert.equal(swOf(r.verifyPin("1234")), SW.AUTH_BLOCKED); // even the right PIN is refused now
});

test("JavaCard-style applet selection routes proprietary instructions", () => {
  const r = createReader(demoCard());
  assert.match(text(r.unwrap(r.selectApplet("A000000001"))), /DEMO-APPLET/);
  const pong = r.transmit(buildApdu({ ins: 0x50 }));
  assert.equal(text(r.unwrap(pong)), "PONG");
  assert.equal(swOf(r.transmit(buildApdu({ ins: 0x99 }))), SW.INS_NOT_SUPPORTED);
  assert.equal(swOf(r.selectApplet("A000000099")), SW.FILE_NOT_FOUND);
});

test("read-only EFs and bad offsets fail closed", () => {
  const r = createReader(demoCard());
  r.selectFile("2F01");
  assert.equal(swOf(r.updateBinary(0, new TextEncoder().encode("x"))), SW.SECURITY_STATUS);
  assert.equal(swOf(r.readBinary(10000, 4)), SW.WRONG_OFFSET);
});
