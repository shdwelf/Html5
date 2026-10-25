// T9.1 algorithms book: canonical algorithms, card-sized, served over APDU.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApdu, createCard, createReader, SW } from "../js/cardreader.js";
import {
  ALGORITHMS_AID, algorithmsApplet,
  crc16Ccitt, luhnValidate, luhnCheckDigit, binarySearch, insertionSort, gcd, modExp, fnv1a32,
} from "../js/card-algorithms.js";

const enc = (s) => new TextEncoder().encode(s);
const swOf = (resp) => (resp[resp.length - 2] << 8) | resp[resp.length - 1];

function algoReader() {
  const card = createCard({
    files: { "3F00": { type: "MF", children: {} } },
    applets: [algorithmsApplet()],
  });
  const r = createReader(card);
  r.selectApplet(ALGORITHMS_AID);
  return r;
}
const call = (r, ins, data, p1 = 0) => r.transmit(buildApdu({ ins, p1, data }));

test("reference implementations hit their published known answers", () => {
  assert.equal(crc16Ccitt(enc("123456789")), 0x29b1); // CRC-16/CCITT-FALSE catalogue check value
  assert.equal(crc16Ccitt(new Uint8Array(0)), 0xffff);
  assert.equal(luhnValidate(enc("79927398713")), true); // ISO/IEC 7812-1 worked example
  assert.equal(luhnValidate(enc("79927398710")), false);
  assert.equal(luhnCheckDigit(enc("7992739871")), 0x33); // -> digit '3'
  assert.equal(binarySearch(Uint8Array.from([1, 3, 5, 7, 9]), 7), 3);
  assert.equal(binarySearch(Uint8Array.from([1, 3, 5, 7, 9]), 4), -1);
  assert.deepEqual([...insertionSort(Uint8Array.from([5, 2, 4, 1, 3]))], [1, 2, 3, 4, 5]);
  assert.equal(gcd(1071, 462), 21); // Euclid's classic walk
  assert.equal(modExp(4, 13, 497), 445); // CLRS repeated-squaring worked example
  assert.equal(modExp(2, 10, 1000), 24);
  assert.equal(fnv1a32(new Uint8Array(0)), 0x811c9dc5);
  assert.equal(fnv1a32(enc("a")), 0xe40c292c);
  assert.equal(fnv1a32(enc("foobar")), 0xbf9cf968);
});

test("the same answers come back over the APDU wire", () => {
  const r = algoReader();
  assert.deepEqual([...r.unwrap(call(r, 0x10, enc("123456789")))], [0x29, 0xb1]);
  assert.deepEqual([...r.unwrap(call(r, 0x22, enc("79927398713")))], [1]);
  assert.deepEqual([...r.unwrap(call(r, 0x22, enc("7992739871"), 1))], [0x33]);
  assert.deepEqual([...r.unwrap(call(r, 0x30, Uint8Array.from([7, 1, 3, 5, 7, 9])))], [3]);
  assert.deepEqual([...r.unwrap(call(r, 0x40, Uint8Array.from([9, 0, 255, 16])))], [0, 9, 16, 255]);
  assert.deepEqual([...r.unwrap(call(r, 0x50, Uint8Array.from([0x04, 0x2f, 0x01, 0xce])))], [0, 21]); // 1071, 462
  assert.deepEqual([...r.unwrap(call(r, 0x60, enc("foobar")))], [0xbf, 0x9c, 0xf9, 0x68]);
  assert.deepEqual([...r.unwrap(call(r, 0x70, Uint8Array.from([0, 4, 0, 13, 0x01, 0xf1])))], [0x01, 0xbd]); // 4^13 mod 497 = 445
});

test("card-honest refusals: unsorted search input, bad digits, gcd(0,0), unknown INS", () => {
  const r = algoReader();
  assert.equal(swOf(call(r, 0x30, Uint8Array.from([7, 9, 1, 7]))), 0x6a80); // unsorted -> wrong data
  assert.equal(swOf(call(r, 0x30, Uint8Array.from([4, 1, 3, 5]))), 0x6a83); // absent -> record not found
  assert.equal(swOf(call(r, 0x22, enc("79927A98713"))), 0x6a80); // non-digit -> wrong data
  assert.equal(swOf(call(r, 0x50, Uint8Array.from([0, 0, 0, 0]))), 0x6a80); // gcd(0,0) undefined
  assert.equal(swOf(call(r, 0x50, Uint8Array.from([0, 5]))), SW.WRONG_LENGTH);
  assert.equal(swOf(call(r, 0x7f, enc("x"))), SW.INS_NOT_SUPPORTED); // falls through to 6D00
});
