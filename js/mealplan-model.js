/**
 * mealplan-model.js — host-side golden model for the MealPlan JavaCard applet.
 *
 * This is the executable specification for smartcard/mealplan/. There is no JDK
 * in this repository, so the applet cannot be compiled here; the pattern this
 * repo already uses for rtl/ applies: write the real source, write a model that
 * implements the same APDU state machine, freeze vectors, and have the tests
 * hold the two to each other.
 *
 * ---------------------------------------------------------------------------
 * The security model, because it is the whole design and the part that is easy
 * to get backwards:
 *
 *   - VALUE ONLY MOVES WITH A MAC FROM THE ISSUER. Load and unload are
 *     authenticated with a per-card key derived from an issuer master key. A
 *     cafeteria terminal cannot add credit; it can only ask the backend to. An
 *     applet where the card accepts a load from whoever holds it is not a purse,
 *     it is a photocopier.
 *
 *   - SPEND REQUIRES TWO SECRETS: the cardholder PIN and a terminal MAC. The
 *     PIN proves it is the employee; the terminal MAC proves the request came
 *     from a till the company provisioned rather than from a laptop on the same
 *     reader.
 *
 *   - THE PASS USES A DIFFERENT KEY FROM THE PURSE. Door access and lunch money
 *     are separate credentials on the same card, so a skimmer at a till does not
 *     open the building, and a cloned badge cannot drain a balance.
 *
 *   - A MONOTONIC COUNTER (ATC) ON EVERY VALUE CHANGE. Offline stored value is
 *     attacked by replay and by cloning; the counter makes a captured receipt
 *     unusable a second time and makes a cloned card detectable at settlement.
 *
 *   - HARD CAPS ON BALANCE AND PER-TRANSACTION SPEND. Not defence of the card —
 *     defence of the company. It bounds what a single compromised till or a
 *     single stolen card can cost before anyone notices.
 *
 * Money is integer cents everywhere. Floating point never touches a balance.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/* ------------------------------------------------------------------ APDU codes */

export const CLA = 0x80;   // proprietary; 0x00 would be ISO-interindustry

export const INS = {
  SELECT: 0xa4,
  GET_STATUS: 0xb0,
  GET_CHALLENGE: 0x84,
  VERIFY_PIN: 0x20,
  LOAD: 0xe0,
  DEBIT: 0xe2,
  UNLOAD: 0xe4,
  PASS: 0xb2,
  SET_STATE: 0xe6,
};

/**
 * Status words. The distinction that matters operationally:
 *
 *   0x6982 SECURITY_NOT_SATISFIED  you are not authenticated — try authenticating
 *   0x6983 AUTH_BLOCKED           stop trying, the credential is locked
 *   0x6985 CONDITIONS_NOT_SATISFIED  authenticated, but this operation is not
 *                                  allowed right now (not selected, cap hit)
 *   0x6A80 WRONG_DATA             the MAC or the payload did not check out
 *
 * Conflating 0x6982 and 0x6A80 is the classic way to build an oracle: a reader
 * that returns different codes for "bad MAC" and "not logged in" tells an
 * attacker which of its guesses were structurally valid.
 */
export const SW = {
  OK: 0x9000,
  WRONG_LENGTH: 0x6700,
  CLA_NOT_SUPPORTED: 0x6e00,
  INS_NOT_SUPPORTED: 0x6d00,
  SECURITY_NOT_SATISFIED: 0x6982,
  AUTH_BLOCKED: 0x6983,
  CONDITIONS_NOT_SATISFIED: 0x6985,
  WRONG_DATA: 0x6a80,
  WRONG_P1P2: 0x6a86,
  FILE_NOT_FOUND: 0x6a82,
};

export const PIN_MAX_TRIES = 3;
export const CHALLENGE_LEN = 8;
export const MAC_LEN = 8;          // truncated HMAC-SHA-256
export const ISSUER_KEY_LEN = 16;

/**
 * Truncated HMAC-SHA-256.
 *
 * Chosen because it is the one MAC that maps cleanly onto both worlds: Node has
 * it natively, and Java Card 3.0.4+ exposes Signature.ALG_HMAC_SHA_256, which
 * the Feitian JC3 parts with a CC EAL5+ Java OS provide. Anything else would
 * mean the model and the applet computing different things, which would make
 * agreement between them worthless.
 */
export function mac(key, ...parts) {
  const h = createHmac('sha256', Buffer.from(key));
  for (const p of parts) h.update(Buffer.from(p));
  return h.digest().subarray(0, MAC_LEN);
}

/**
 * Per-card key diversification.
 *
 * The issuer keeps one master key. Each card gets HMAC(master, label || uid)
 * truncated to ISSUER_KEY_LEN. Compromising one card therefore reveals nothing
 * about any other card, and the master key never has to leave the backend HSM.
 *
 * This deliberately does not go through mac(), even though mac() is the same
 * HMAC: mac() truncates to MAC_LEN, which is 8 bytes, because that is the tag
 * width on the wire. A derived key truncated the same way would be 64 bits --
 * weaker than the 64-bit tag it is supposed to protect, and half the KEY_LEN the
 * applet personalises. The applet is the authority on key length here, so this
 * takes the width from the exported constant rather than from the MAC.
 */
export function deriveKey(master, label, uid) {
  const h = createHmac('sha256', Buffer.from(master));
  h.update(Buffer.from(label, 'utf8'));
  h.update(Buffer.from(uid));
  return h.digest().subarray(0, ISSUER_KEY_LEN);
}

const be16 = (n) => {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(n >>> 0);
  return b;
};
const be32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
};

/* ------------------------------------------------------------------------- card */

export class MealPlanCard {
  /**
   * @param {object} opts
   * @param {Buffer} opts.uid            card serial, the diversifier
   * @param {Buffer} opts.issuerKey      mac(master, "MP-I", uid)
   * @param {Buffer} opts.accessKey      mac(master, "MP-A", uid) - separate on purpose
   * @param {Buffer} opts.pin            fixed length, zero padded
   * @param {number} opts.maxBalance     cents; hard ceiling
   * @param {number} opts.maxDebit       cents; per-transaction ceiling
   */
  constructor(opts) {
    if (!Number.isInteger(opts.maxBalance) || opts.maxBalance <= 0)
      throw new TypeError('maxBalance must be a positive integer (cents)');
    if (!Number.isInteger(opts.maxDebit) || opts.maxDebit <= 0)
      throw new TypeError('maxDebit must be a positive integer (cents)');
    // Checked because the applet personalises KEY_LEN bytes and will reject a
    // short key at install. Without this the model happily runs an 8-byte key
    // that no card could ever be provisioned with, and the two implementations
    // drift apart while every test still passes.
    for (const name of ['issuerKey', 'accessKey']) {
      const k = opts[name];
      if (!k || k.length !== ISSUER_KEY_LEN)
        throw new TypeError(`${name} must be exactly ${ISSUER_KEY_LEN} bytes, got ${k ? k.length : 0}`);
    }

    this.uid = Buffer.from(opts.uid);
    this.issuerKey = Buffer.from(opts.issuerKey);
    this.accessKey = Buffer.from(opts.accessKey);
    this.pin = Buffer.from(opts.pin);
    this.maxBalance = opts.maxBalance;
    this.maxDebit = opts.maxDebit;

    this.balance = 0;        // cents
    this.atc = 0;            // monotonic, never reset
    this.pinTries = PIN_MAX_TRIES;
    this.pinVerified = false;   // cleared on every SELECT and on power-up
    this.selected = false;
    this.challenge = null;
    this.challengeUsed = true;
    this.terminalKey = null;
    this.log = [];           // last N value changes, for settlement
  }

  /* ------------------------------------------------------------ host helpers */
  /*
   * These live on the model so tests and the backend simulator can build valid
   * commands. The card itself never calls them; it only ever verifies.
   */

  /** What the backend sends to add credit. Never constructible by the card. */
  loadCommand(amount, terminalKey = null) {
    const c = this.challenge;
    const body = Buffer.concat([Buffer.from([INS.LOAD]), be16(this.atc), be32(amount)]);
    return {
      ins: INS.LOAD, p1: 0, p2: 0,
      data: Buffer.concat([be32(amount), c, mac(this.issuerKey, body)]),
      terminalKey,
    };
  }

  debitCommand(amount, terminalKey, terminalSecret) {
    const body = Buffer.concat([Buffer.from([INS.DEBIT]), be16(this.atc), be32(amount)]);
    return {
      ins: INS.DEBIT, p1: 0, p2: 0,
      data: Buffer.concat([be32(amount), mac(terminalSecret, body)]),
      terminalKey,
    };
  }

  unloadCommand(amount) {
    const body = Buffer.concat([Buffer.from([INS.UNLOAD]), be16(this.atc), be32(amount)]);
    return {
      ins: INS.UNLOAD, p1: 0, p2: 0,
      data: Buffer.concat([be32(amount), this.challenge, mac(this.issuerKey, body)]),
    };
  }

  /* ------------------------------------------------------------------ APDUs */

  /**
   * Process one APDU. Returns { sw, data }.
   *
   * Written as one dispatch rather than as a class hierarchy so that it maps
   * line for line onto the `switch (buffer[ISO7816.OFFSET_INS])` that
   * JavaCard's Applet.process() requires.
   */
  process(apdu) {
    const { cla, ins, p1 = 0, p2 = 0, data = Buffer.alloc(0) } = apdu;

    // A power-up or a fresh SELECT clears session state. Forgetting this is how
    // an applet ends up honouring a PIN verified for a different terminal.
    if (ins === INS.SELECT) return this._select(data);
    if (!this.selected) return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };
    if (cla !== CLA) return { sw: SW.CLA_NOT_SUPPORTED, data: null };

    switch (ins) {
      case INS.GET_STATUS:      return this._status();
      case INS.GET_CHALLENGE:   return this._challenge();
      case INS.VERIFY_PIN:      return this._verifyPin(data);
      case INS.LOAD:            return this._load(data);
      case INS.DEBIT:           return this._debit(data);
      case INS.UNLOAD:          return this._unload(data);
      case INS.PASS:            return this._pass(data);
      case INS.SET_STATE:       return this._setState(p1, data);
      default:                  return { sw: SW.INS_NOT_SUPPORTED, data: null };
    }
  }

  _select() {
    this.selected = true;
    this.pinVerified = false;
    this.challenge = null;
    this.challengeUsed = true;
    return { sw: SW.OK, data: null };
  }

  _status() {
    return {
      sw: SW.OK,
      data: Buffer.concat([
        be32(this.balance),
        be16(this.atc),
        Buffer.from([this.pinTries, this.pinVerified ? 1 : 0]),
        this.uid,
      ]),
    };
  }

  _challenge() {
    this.challenge = randomBytes(CHALLENGE_LEN);
    this.challengeUsed = false;
    return { sw: SW.OK, data: this.challenge };
  }

  _verifyPin(data) {
    if (this.pinTries <= 0) return { sw: SW.AUTH_BLOCKED, data: null };
    const presented = Buffer.alloc(this.pin.length);
    data.copy(presented, 0, 0, Math.min(data.length, this.pin.length));

    // Constant-time compare. A byte-at-a-time loop leaks the PIN length and,
    // over enough attempts, the prefix — on a card, through timing.
    const ok = presented.length === this.pin.length && timingSafeEqual(presented, this.pin);
    if (!ok) {
      this.pinTries -= 1;
      this.pinVerified = false;
      return { sw: this.pinTries <= 0 ? SW.AUTH_BLOCKED : SW.SECURITY_NOT_SATISFIED, data: null };
    }
    this.pinTries = PIN_MAX_TRIES;
    this.pinVerified = true;
    return { sw: SW.OK, data: Buffer.from([this.pinTries]) };
  }

  /** Load: issuer MAC over (INS || ATC || amount), bound to a fresh challenge. */
  _load(data) {
    if (data.length !== 4 + CHALLENGE_LEN + MAC_LEN) return { sw: SW.WRONG_LENGTH, data: null };
    if (this.challenge === null || this.challengeUsed)
      return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };

    const amount = data.readUInt32BE(0);
    const chal = data.subarray(4, 4 + CHALLENGE_LEN);
    const tag = data.subarray(4 + CHALLENGE_LEN);

    if (!timingSafeEqual(chal, this.challenge)) return { sw: SW.WRONG_DATA, data: null };
    this.challengeUsed = true;   // single use, valid or not

    const body = Buffer.concat([Buffer.from([INS.LOAD]), be16(this.atc), be32(amount)]);
    const want = mac(this.issuerKey, body);
    if (!timingSafeEqual(tag, want)) return { sw: SW.WRONG_DATA, data: null };

    if (!Number.isInteger(amount) || amount <= 0) return { sw: SW.WRONG_DATA, data: null };
    // The cap is checked before the MAC would be wasted on it, but enforced
    // after: an over-cap request must not be silently clamped, because a
    // backend that asked for 50000 and got 5000 has a reconciliation bug.
    if (this.balance + amount > this.maxBalance) return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };

    this.balance += amount;
    return this._commit('LOAD', amount);
  }

  /** Debit: cardholder PIN *and* a terminal MAC. Both, always. */
  _debit(data) {
    if (data.length !== 4 + MAC_LEN) return { sw: SW.WRONG_LENGTH, data: null };
    if (!this.pinVerified) return { sw: SW.SECURITY_NOT_SATISFIED, data: null };
    if (this.terminalKey === null) return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };

    const amount = data.readUInt32BE(0);
    const tag = data.subarray(4);
    const body = Buffer.concat([Buffer.from([INS.DEBIT]), be16(this.atc), be32(amount)]);
    if (!timingSafeEqual(tag, mac(this.terminalKey, body))) return { sw: SW.WRONG_DATA, data: null };

    if (amount <= 0 || amount > this.maxDebit) return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };
    if (amount > this.balance) return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };

    this.balance -= amount;
    // A debit is a one-shot authorisation: clear the PIN so the next purchase
    // needs it again. Otherwise a card left in a reader spends indefinitely.
    this.pinVerified = false;
    return this._commit('DEBIT', -amount);
  }

  _unload(data) {
    if (data.length !== 4 + CHALLENGE_LEN + MAC_LEN) return { sw: SW.WRONG_LENGTH, data: null };
    if (this.challenge === null || this.challengeUsed)
      return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };

    const amount = data.readUInt32BE(0);
    const chal = data.subarray(4, 4 + CHALLENGE_LEN);
    const tag = data.subarray(4 + CHALLENGE_LEN);
    if (!timingSafeEqual(chal, this.challenge)) return { sw: SW.WRONG_DATA, data: null };
    this.challengeUsed = true;

    const body = Buffer.concat([Buffer.from([INS.UNLOAD]), be16(this.atc), be32(amount)]);
    if (!timingSafeEqual(tag, mac(this.issuerKey, body))) return { sw: SW.WRONG_DATA, data: null };
    if (amount <= 0 || amount > this.balance) return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };

    this.balance -= amount;
    return this._commit('UNLOAD', -amount);
  }

  /**
   * Door pass: the reader sends its nonce, the card answers with an HMAC under
   * the access key over (nonce || ATC). Including the ATC means a captured
   * response cannot be replayed at the door later — the reader has seen that
   * counter value already.
   */
  _pass(data) {
    if (data.length !== CHALLENGE_LEN) return { sw: SW.WRONG_LENGTH, data: null };
    const resp = mac(this.accessKey, data, be16(this.atc));
    return { sw: SW.OK, data: Buffer.concat([be16(this.atc), resp]) };
  }

  /** Provision the terminal key. Issuer-authenticated, like load and unload. */
  _setState(p1, data) {
    if (p1 !== 0x01) return { sw: SW.WRONG_P1P2, data: null };
    if (this.challenge === null || this.challengeUsed)
      return { sw: SW.CONDITIONS_NOT_SATISFIED, data: null };
    if (data.length !== CHALLENGE_LEN + ISSUER_KEY_LEN + MAC_LEN)
      return { sw: SW.WRONG_LENGTH, data: null };

    const chal = data.subarray(0, CHALLENGE_LEN);
    const key = data.subarray(CHALLENGE_LEN, CHALLENGE_LEN + ISSUER_KEY_LEN);
    const tag = data.subarray(CHALLENGE_LEN + ISSUER_KEY_LEN);
    if (!timingSafeEqual(chal, this.challenge)) return { sw: SW.WRONG_DATA, data: null };
    this.challengeUsed = true;

    const body = Buffer.concat([Buffer.from([INS.SET_STATE]), be16(this.atc), Buffer.from([p1]), key]);
    if (!timingSafeEqual(tag, mac(this.issuerKey, body))) return { sw: SW.WRONG_DATA, data: null };

    this.terminalKey = Buffer.from(key);
    return { sw: SW.OK, data: null };
  }

  /** Bump the counter, record the entry, and MAC the receipt. */
  _commit(kind, delta) {
    this.atc = (this.atc + 1) & 0xffff;
    const entry = { kind, delta, atc: this.atc, balance: this.balance, uid: this.uid.toString('hex') };
    this.log.push(entry);
    if (this.log.length > 16) this.log.shift();
    const receipt = mac(this.issuerKey, be16(this.atc), be32(this.balance & 0xffffffff));
    return { sw: SW.OK, data: Buffer.concat([be16(this.atc), be32(this.balance), receipt]) };
  }
}

/* --------------------------------------------------------------- settlement */

/**
 * Reconcile a card's log against the issuer's own records.
 *
 * This is where a cloned card shows up: two cards presenting the same UID with
 * overlapping ATC ranges, or a card whose balance moved without a matching
 * receipt. The check is cheap and it is the only thing that catches an offline
 * attack after the fact.
 */
export function findReplay(logs) {
  const seen = new Map();   // uid -> Set(atc)
  const replays = [];
  for (const entry of logs) {
    if (!seen.has(entry.uid)) seen.set(entry.uid, new Set());
    const s = seen.get(entry.uid);
    if (s.has(entry.atc)) replays.push(entry);
    s.add(entry.atc);
  }
  return replays;
}

/** A gap in a card's ATC sequence means a transaction was suppressed. */
export function findGaps(log) {
  const gaps = [];
  const atcs = log.map((e) => e.atc).sort((a, b) => a - b);
  for (let i = 1; i < atcs.length; i++)
    if (atcs[i] !== atcs[i - 1] + 1) gaps.push([atcs[i - 1], atcs[i]]);
  return gaps;
}
