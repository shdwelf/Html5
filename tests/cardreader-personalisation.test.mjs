// T9.1 personalisation: the issuer write path (CREATE FILE / DELETE FILE).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApdu, createCard, createReader, SW } from "../js/cardreader.js";

const swOf = (resp) => (resp[resp.length - 2] << 8) | resp[resp.length - 1];
const text = (bytes) => new TextDecoder().decode(bytes);
const fid = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));

function blankReader() {
  const card = createCard({ files: { "3F00": { type: "MF", children: {} } }, applets: [] });
  return createReader(card);
}
const create = (r, idHex, type, size, read = 0, write = 0) =>
  r.transmit(buildApdu({ ins: 0xE0, data: Uint8Array.from([...fid(idHex), type, (size >> 8) & 0xFF, size & 0xFF, read, write]) }));
const remove = (r, idHex) => r.transmit(buildApdu({ ins: 0xE4, data: fid(idHex) }));

test("personalisation is PIN-gated: no VERIFY, no provisioning", () => {
  const r = blankReader();
  assert.equal(swOf(create(r, "7F20", 0x01, 0)), SW.SECURITY_STATUS);
  assert.equal(swOf(remove(r, "7F20")), SW.SECURITY_STATUS);
  assert.equal(swOf(r.verifyPin("1234")), SW.OK);
  assert.equal(swOf(create(r, "7F20", 0x01, 0)), SW.OK);
});

test("a provisioned DF/EF works end-to-end through the normal file commands", () => {
  const r = blankReader();
  r.verifyPin("1234");
  assert.equal(swOf(create(r, "7F20", 0x01, 0)), SW.OK); // wallet DF under MF
  assert.equal(swOf(r.selectFile("7F20")), SW.OK);
  assert.equal(swOf(create(r, "6F03", 0x02, 16, 0x01, 0x00)), SW.OK); // PIN-read EF, 16 bytes
  assert.equal(swOf(r.selectFile("6F03")), SW.OK);
  assert.equal(swOf(r.updateBinary(0, new TextEncoder().encode("CARD-OK"))), SW.OK);
  assert.match(text(r.unwrap(r.readBinary(0, 7))), /CARD-OK/);
  // a second reader session sees the same card image (provisioning persisted on the card)
  assert.equal(swOf(r.selectFile("3F00")), SW.OK);
  assert.equal(swOf(r.selectFile("7F20")), SW.OK);
});

test("issuer refusals fail closed: duplicate FID, MF deletion, ghosts, bad types", () => {
  const r = blankReader();
  r.verifyPin("1234");
  assert.equal(swOf(create(r, "2F01", 0x02, 4)), SW.OK);
  assert.equal(swOf(create(r, "2F01", 0x02, 4)), SW.CONDITIONS); // duplicate FID
  assert.equal(swOf(create(r, "3F00", 0x01, 0)), SW.CONDITIONS); // cannot recreate the MF
  assert.equal(swOf(remove(r, "3F00")), SW.CONDITIONS); // cannot delete the MF
  assert.equal(swOf(remove(r, "FFFF")), SW.FILE_NOT_FOUND); // ghost
  assert.equal(swOf(r.transmit(buildApdu({ ins: 0xE0, data: Uint8Array.from([0x2F, 0x02, 0x09, 0, 4, 0, 0]) }))), SW.WRONG_DATA); // unknown type byte
  assert.equal(swOf(r.transmit(buildApdu({ ins: 0xE0, data: Uint8Array.from([0x2F]) }))), SW.WRONG_LENGTH);
});

test("deleting the selected file falls back to the MF; deleted files stay deleted", () => {
  const r = blankReader();
  r.verifyPin("1234");
  create(r, "2F01", 0x02, 4);
  r.selectFile("2F01");
  assert.equal(swOf(remove(r, "2F01")), SW.OK);
  assert.equal(swOf(r.selectFile("2F01")), SW.FILE_NOT_FOUND);
  assert.equal(swOf(r.readBinary(0, 4)), SW.FILE_NOT_FOUND); // selection is the MF, not a dangling EF
});
