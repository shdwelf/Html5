/**
 * card-algorithms.js — the algorithms book, card-sized (T9.1).
 *
 * Canonical algorithms (CLRS / Weiss chapter references in
 * docs/card-algorithms-book-2026-10-23.md) chosen because they fit the
 * smartcard envelope that js/cardreader.js models: one short APDU in
 * (<= 255 data bytes), one short APDU out, integer arithmetic only, no
 * allocation beyond the input, no recursion, no floating point. Each
 * algorithm ships as a pure reference function and is bound on-card as
 * a proprietary INS of one AID-selected applet, so the same code is
 * exercised over the wire exactly as a real card would serve it.
 *
 * Honest scope: these are the tractable chapters. The doc lists what
 * was deliberately left out (FFT, geometric algorithms, hand-rolled
 * RSA) and why — a card is not a small computer, it is a tiny one.
 */

import { SW } from "./cardreader.js";

const WRONG_DATA = 0x6a80; // ISO/IEC 7816-4: incorrect parameters in the data field
const RECORD_NOT_FOUND = 0x6a83; // ISO/IEC 7816-4: referenced data not found

// ------------------------------------------------------- reference algorithms

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no xorout. */
export function crc16Ccitt(bytes) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

const isDigitBytes = (bytes) => bytes.length > 0 && bytes.every((b) => b >= 0x30 && b <= 0x39);

/** ISO/IEC 7812-1 Luhn: validate a digit string including its check digit. */
export function luhnValidate(digits) {
  let sum = 0;
  digits.forEach((b, i) => {
    let d = b - 0x30;
    if ((digits.length - i) % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  });
  return sum % 10 === 0;
}

/** Luhn check digit for a payload (digits without the check digit). */
export function luhnCheckDigit(payload) {
  for (let c = 0; c <= 9; c++) {
    if (luhnValidate([...payload, 0x30 + c])) return 0x30 + c;
  }
  throw new Error("unreachable: some digit always closes a Luhn sum");
}

/** Binary search over an ascending byte array. Returns index or -1. */
export function binarySearch(sorted, key) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === key) return mid;
    if (sorted[mid] < key) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}

/** Insertion sort (CLRS ch. 2), in place on a copy; O(n^2) but n <= 255. */
export function insertionSort(bytes) {
  const a = Uint8Array.from(bytes);
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return a;
}

/** Euclid's algorithm (CLRS 31.2) over uint16 inputs. */
export function gcd(a, b) {
  while (b !== 0) { const t = a % b; a = b; b = t; }
  return a;
}

/**
 * Repeated-squaring modular exponentiation (CLRS 31.6) over uint16
 * operands. Products stay below 2^32, exact in a JS number; a real
 * card delegates this to its crypto coprocessor — see the doc.
 */
export function modExp(base, exp, mod) {
  let result = 1 % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return result;
}

/** FNV-1a 32-bit (Fowler/Noll/Vo): the practitioner hash, CLRS ch. 11 lineage. */
export function fnv1a32(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h;
}

// ------------------------------------------------------------- on-card binding

export const ALGORITHMS_AID = "A000000002";

const u16be = (n) => [(n >> 8) & 0xff, n & 0xff];
const readU16be = (d, o) => (d[o] << 8) | d[o + 1];

/**
 * The ALGO-BOOK applet. INS map (proprietary class, first refusal via
 * the reader's applet routing). The gaps are forced: 0xA4 (SELECT),
 * 0x20 (VERIFY), 0xB0/0xD6 (READ/UPDATE BINARY) are claimed by the
 * 7816-4 core before an applet ever sees the APDU — a Luhn instruction
 * parked on 0x22 instead of 0x20 is this constraint made visible:
 *   0x10 CRC-16/CCITT-FALSE of data            -> 2 bytes BE
 *   0x22 P1=0 Luhn validate / P1=1 check digit -> 1 byte (0x01/0x00 | ASCII digit)
 *   0x30 data = key || sorted bytes            -> 1-byte index | 6A83
 *   0x40 insertion sort                        -> the sorted bytes
 *   0x50 data = a||b (uint16 BE) Euclid GCD    -> 2 bytes BE
 *   0x60 FNV-1a 32 of data                     -> 4 bytes BE
 *   0x70 data = base||exp||mod (uint16 BE)     -> 2 bytes BE
 */
export function algorithmsApplet() {
  return {
    aid: ALGORITHMS_AID,
    name: "ALGO-BOOK",
    process(_card, apdu) {
      const d = apdu.data;
      switch (apdu.ins) {
        case 0x10:
          return { data: u16be(crc16Ccitt(d)), sw: SW.OK };
        case 0x22: {
          if (!isDigitBytes(d)) return { data: [], sw: WRONG_DATA };
          if (apdu.p1 === 0x01) return { data: [luhnCheckDigit(d)], sw: SW.OK };
          return { data: [luhnValidate(d) ? 1 : 0], sw: SW.OK };
        }
        case 0x30: {
          if (d.length < 1) return { data: [], sw: SW.WRONG_LENGTH };
          const arr = d.subarray(1);
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] < arr[i - 1]) return { data: [], sw: WRONG_DATA }; // refuse unsorted input
          }
          const idx = binarySearch(arr, d[0]);
          return idx < 0 ? { data: [], sw: RECORD_NOT_FOUND } : { data: [idx], sw: SW.OK };
        }
        case 0x40:
          return { data: insertionSort(d), sw: SW.OK };
        case 0x50: {
          if (d.length !== 4) return { data: [], sw: SW.WRONG_LENGTH };
          const a = readU16be(d, 0), b = readU16be(d, 2);
          if (a === 0 && b === 0) return { data: [], sw: WRONG_DATA }; // gcd(0,0) is undefined
          return { data: u16be(gcd(a, b)), sw: SW.OK };
        }
        case 0x60: {
          const h = fnv1a32(d);
          return { data: [(h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff], sw: SW.OK };
        }
        case 0x70: {
          if (d.length !== 6) return { data: [], sw: SW.WRONG_LENGTH };
          const mod = readU16be(d, 4);
          if (mod === 0) return { data: [], sw: WRONG_DATA };
          return { data: u16be(modExp(readU16be(d, 0), readU16be(d, 2), mod)), sw: SW.OK };
        }
        default:
          return null; // fall through to the card's 6D00
      }
    },
  };
}
