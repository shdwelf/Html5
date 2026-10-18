/**
 * Hierarchical parity + escrow model, patterned on the GoldKey
 * GrandMaster -> Master -> User token hierarchy.
 *
 * It exists because GoldKey's own published FAQ documents two gaps that a
 * backup design has to close:
 *
 *   1. "If your GoldKey is not registered to a Master, there is no way to
 *      recover the data without knowing the PIN."  And registering after the
 *      fact "will render any data it has encrypted permanently inaccessible."
 *      => registration must be mandatory and must happen before data exists.
 *
 *   2. "Duplicate a GoldKey ... Certificates, PIV settings, and unrecognized
 *      groups are not preserved."
 *      => a duplicate is NOT a faithful backup, so the parity record has to
 *         detect a lossy copy rather than treat it as equivalent.
 *
 * On top of that, a single Master token is a single point of failure, so the
 * recovery key is Shamir-shared across the tier instead of living on one
 * device. Backup payload integrity/recovery uses XOR parity, which is the
 * literal "parity backup" part.
 *
 * All arithmetic is GF(256) with the AES polynomial 0x11b, so shares are
 * byte-shaped and can be stored in the same EEPROM layout as the applet's
 * existing key material.
 *
 * NO REAL KEY MATERIAL. Every secret here is generated locally from an
 * injectable RNG and never leaves this module.
 */

// ---------------------------------------------------------------- GF(256)

const POLY = 0x11b; // x^8 + x^4 + x^3 + x + 1 (AES): irreducible but NOT primitive
const GENERATOR = 0x03; // ...so the generator is 3, not 2. Doubling gives only 51 elements.

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

/** Multiply by 2 in GF(256). */
function xtime(v) {
  const t = v << 1;
  return t & 0x100 ? (t ^ POLY) & 0xff : t;
}

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = xtime(x) ^ x; // x * 3
  }
  // Double the table so mul() never needs a modulo.
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  LOG[0] = 0; // undefined by definition; guarded in mul()
})();

export function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

export function gfDiv(a, b) {
  if (b === 0) throw new RangeError("gfDiv: division by zero");
  if (a === 0) return 0;
  let d = LOG[a] - LOG[b];
  if (d < 0) d += 255;
  return EXP[d];
}

/** Self-check the field tables. Returns the number of identities verified. */
export function gfSelfTest() {
  let checks = 0;
  // Every non-zero element must have a unique log, and exp(log(x)) == x.
  const seen = new Set();
  for (let x = 1; x < 256; x++) {
    if (EXP[LOG[x]] !== x) throw new Error(`gfSelfTest: roundtrip failed at ${x}`);
    seen.add(LOG[x]);
    checks++;
  }
  if (seen.size !== 255) throw new Error("gfSelfTest: log table is not a permutation");
  // Multiplicative inverses.
  for (let x = 1; x < 256; x++) {
    if (gfMul(x, gfDiv(1, x)) !== 1) throw new Error(`gfSelfTest: no inverse for ${x}`);
    checks++;
  }
  return checks;
}

// --------------------------------------------------- Shamir secret sharing

/**
 * Split `secret` (Uint8Array) into `n` shares, `k` of which reconstruct it.
 * Each byte gets an independent random polynomial of degree k-1 whose constant
 * term is that byte. Share x-coordinates are 1..n.
 */
export function shamirSplit(secret, k, n, rng = Math.random) {
  if (!Number.isInteger(k) || !Number.isInteger(n)) throw new TypeError("k and n must be integers");
  if (k < 1) throw new RangeError("threshold k must be >= 1");
  if (n < k) throw new RangeError("n must be >= k");
  if (n > 255) throw new RangeError("n must be <= 255 (x-coordinates are bytes 1..255)");
  if (!(secret instanceof Uint8Array)) throw new TypeError("secret must be a Uint8Array");
  if (secret.length === 0) throw new RangeError("secret must be non-empty");

  const bytes = (count) => {
    const out = new Uint8Array(count);
    for (let i = 0; i < count; i++) out[i] = Math.floor(rng() * 256) & 0xff;
    return out;
  };

  const shares = [];
  for (let i = 1; i <= n; i++) shares.push({ x: i, y: new Uint8Array(secret.length) });

  for (let b = 0; b < secret.length; b++) {
    const coeffs = new Uint8Array(k);
    coeffs[0] = secret[b];
    const tail = bytes(k - 1);
    for (let i = 1; i < k; i++) coeffs[i] = tail[i - 1];

    for (const sh of shares) {
      let acc = 0;
      for (let d = k - 1; d >= 0; d--) acc = gfMul(acc, sh.x) ^ coeffs[d]; // Horner
      sh.y[b] = acc;
    }
  }
  return shares;
}

/** Reconstruct the secret from at least k shares via Lagrange interpolation at 0. */
export function shamirCombine(shares) {
  if (!Array.isArray(shares) || shares.length < 1) throw new RangeError("need at least one share");
  const len = shares[0].y.length;
  for (const s of shares) {
    if (s.y.length !== len) throw new RangeError("shares have differing lengths");
    if (s.x < 1 || s.x > 255) throw new RangeError("share x out of range");
  }
  const xs = new Set(shares.map((s) => s.x));
  if (xs.size !== shares.length) throw new RangeError("duplicate share x-coordinates");

  const out = new Uint8Array(len);
  for (const si of shares) {
    let li = 1; // L_i(0) = prod_{j!=i} x_j / (x_j ^ x_i)
    for (const sj of shares) {
      if (sj === si) continue;
      li = gfMul(li, gfDiv(sj.x, sj.x ^ si.x));
    }
    for (let b = 0; b < len; b++) out[b] ^= gfMul(si.y[b], li);
  }
  return out;
}

// ------------------------------------------------------------ XOR parity

/** XOR-parity shard across an array of equal-length Uint8Array data shards. */
export function xorParity(shards) {
  if (!Array.isArray(shards) || shards.length === 0) throw new RangeError("need at least one shard");
  const len = shards[0].length;
  for (const s of shards) {
    if (!(s instanceof Uint8Array)) throw new TypeError("shards must be Uint8Array");
    if (s.length !== len) throw new RangeError("shards must be equal length");
  }
  const p = new Uint8Array(len);
  for (const s of shards) for (let i = 0; i < len; i++) p[i] ^= s[i];
  return p;
}

/**
 * Rebuild one missing data shard from the survivors plus the parity shard.
 * Exactly one hole is recoverable; two or more is not, and this says so
 * rather than returning something plausible.
 */
export function recoverOne(shards, parity, missingIndex) {
  if (missingIndex < 0 || missingIndex >= shards.length) throw new RangeError("missingIndex out of range");
  const holes = shards.filter((s) => s == null).length;
  if (holes !== 1) throw new RangeError(`XOR parity recovers exactly one lost shard, found ${holes}`);
  const len = parity.length;
  const out = Uint8Array.from(parity);
  shards.forEach((s, i) => {
    if (s == null || i === missingIndex) return;
    for (let b = 0; b < len; b++) out[b] ^= s[b];
  });
  return out;
}

// --------------------------------------------------------- GoldKey invariants

/**
 * Published GoldKey parameters, kept as named constants so the tests assert
 * against the documented figures instead of magic numbers.
 */
export const GOLDKEY = Object.freeze({
  PIN_LEN_MASTER: 8, // Legit Reviews: 8-character Master PIN + 3 security questions
  PIN_MAX_TRIES: 10, // goldkey.com: "disabled after ten attempts to guess your PIN"
  MAX_GROUPS: 63, // PCMag: "up to 63 groups"
  MAX_CERTS: 24, // product catalogue: up to 24 certificates with private keys
  TIERS: Object.freeze(["grandmaster", "master", "user"]),
  // Lost on duplication, per the Master Management manual.
  DUPLICATE_LOSES: Object.freeze(["certificates", "pivSettings", "unrecognizedGroups"]),
});

export class PinLockout extends Error {}
export class NotRegistered extends Error {}
export class TierViolation extends Error {}

/**
 * Deterministic counter-based RNG for tests. Not cryptographic -- it exists so
 * share-splitting is reproducible in the test suite.
 */
export function countingRng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0x100000000;
  };
}

/**
 * The hierarchy. Mirrors GrandMaster -> Master -> User, and enforces the two
 * rules GoldKey's FAQ implies: nothing is creatable without a parent, and a
 * duplicate is flagged as lossy rather than accepted as equal.
 */
export function createHierarchy({ rng = Math.random, grandmasterShares = 3, grandmasterOf = 5 } = {}) {
  if (grandmasterShares > grandmasterOf) throw new RangeError("shares must be <= of");

  const masters = new Map(); // id -> master record
  const users = new Map(); //   id -> user record
  const groups = new Set();
  let seq = 0;
  const nextId = (p) => `${p}-${++seq}`;

  // The GrandMaster recovery key is split across the enterprise tier so that no
  // single GrandMaster token is a total loss.
  let recoveryShares = null;
  let recoveryChecksum = null;

  /**
   * Verify a PIN. Consumes an attempt on every call -- including a malformed
   * one -- and locks at GoldKey's documented threshold. Attempt-on-malformed is
   * the pattern the jCardSim validation run flagged as missing from the applet.
   */
  function verifyPin(kind, id, candidate) {
    const rec = (kind === "master" ? masters : users).get(id);
    if (!rec) throw new NotRegistered(`no such ${kind}: ${id}`);
    if (rec.locked) throw new PinLockout(`${kind} ${id} is locked out`);
    if (typeof candidate !== "string") {
      rec.attempts++; // malformed input still burns an attempt
      if (rec.attempts >= GOLDKEY.PIN_MAX_TRIES) {
        rec.locked = true;
        // Report the lockout, not the type error: the token is now disabled,
        // which is the more consequential fact, and this matches the string
        // path so both routes to the threshold behave identically.
        throw new PinLockout(`${kind} ${id} disabled after ${GOLDKEY.PIN_MAX_TRIES} attempts`);
      }
      throw new TypeError("PIN must be a string");
    }
    if (candidate === rec.pin) {
      rec.attempts = 0;
      return true;
    }
    rec.attempts++;
    if (rec.attempts >= GOLDKEY.PIN_MAX_TRIES) {
      rec.locked = true;
      throw new PinLockout(`${kind} ${id} disabled after ${GOLDKEY.PIN_MAX_TRIES} attempts`);
    }
    return false;
  }

  const api = {
    get masters() { return [...masters.values()]; },
    get users() { return [...users.values()]; },
    get groups() { return [...groups]; },

    /**
     * Establish the enterprise recovery key. MUST be called before any user
     * token is registered, because GoldKey cannot retro-fit registration
     * without destroying existing data.
     */
    establishRecoveryKey(secret) {
      if (!(secret instanceof Uint8Array)) throw new TypeError("secret must be a Uint8Array");
      if (users.size > 0) {
        throw new TierViolation(
          "recovery key established after user tokens existed; GoldKey cannot " +
          "retro-fit registration without rendering existing data inaccessible"
        );
      }
      recoveryShares = shamirSplit(secret, grandmasterShares, grandmasterOf, rng);
      recoveryChecksum = checksum(secret);
      return { shares: recoveryShares.length, threshold: grandmasterShares };
    },

    recoverKey(present) {
      if (recoveryShares == null) throw new TierViolation("no recovery key established");
      if (!Array.isArray(present)) throw new TypeError("present must be an array of share x-values");
      const picked = recoveryShares.filter((s) => present.includes(s.x));
      if (picked.length < grandmasterShares) {
        throw new TierViolation(
          `need ${grandmasterShares} GrandMaster shares, have ${picked.length}`
        );
      }
      return shamirCombine(picked);
    },

    addMaster({ pin, name } = {}) {
      if (typeof pin !== "string" || pin.length !== GOLDKEY.PIN_LEN_MASTER) {
        throw new RangeError(`Master PIN must be exactly ${GOLDKEY.PIN_LEN_MASTER} characters`);
      }
      const rec = {
        id: nextId("master"),
        name: name ?? null,
        pin,
        attempts: 0,
        locked: false,
        registered: [],
      };
      masters.set(rec.id, rec);
      return rec;
    },

    /**
     * Register a user token to a Master. Refuses an unregistered token by
     * construction: there is no code path that creates a user without a parent.
     */
    registerUser({ masterId, pin, payload = new Uint8Array(0) }) {
      const m = masters.get(masterId);
      if (!m) throw new NotRegistered(`no such master: ${masterId}`);
      if (m.locked) throw new PinLockout(`master ${masterId} is locked out`);
      if (typeof pin !== "string" || pin.length === 0) throw new RangeError("user PIN required");
      if (groups.size >= GOLDKEY.MAX_GROUPS) throw new RangeError(`group limit ${GOLDKEY.MAX_GROUPS} reached`);

      const data = Uint8Array.from(payload);
      // XOR parity needs equal-length shards, so pad the tail and remember the
      // true length. Without this an odd-length payload throws at split time.
      const half = Math.max(1, Math.ceil(data.length / 2));
      const shardA = new Uint8Array(half);
      const shardB = new Uint8Array(half);
      shardA.set(data.subarray(0, half));
      if (data.length > half) shardB.set(data.subarray(half, half * 2));
      const parity = xorParity([shardA, shardB]);

      const rec = {
        id: nextId("user"),
        masterId,
        pin,
        attempts: 0,
        locked: false,
        certificates: [],
        pivSettings: null,
        unrecognizedGroups: [],
        payloadLen: data.length,
        payloadChecksum: checksum(data),
        shards: [Array.from(shardA), Array.from(shardB)],
        parity: Array.from(parity),
      };
      users.set(rec.id, rec);
      m.registered.push(rec.id);
      return rec;
    },

    verifyPin,

    /**
     * Duplicate a token. Deliberately reports what is NOT carried over, because
     * GoldKey's manual says certificates, PIV settings and unrecognized groups
     * are dropped -- so a duplicate must never be treated as a real backup.
     */
    duplicate(userId, { masterPin }) {
      const src = users.get(userId);
      if (!src) throw new NotRegistered(`no such user: ${userId}`);
      if (verifyPin("master", src.masterId, masterPin) !== true) {
        throw new TierViolation("Master PIN required to duplicate");
      }
      const copy = {
        ...structuredClone(src),
        id: nextId("user"),
        certificates: [],
        pivSettings: null,
        unrecognizedGroups: [],
      };
      users.set(copy.id, copy);
      masters.get(src.masterId).registered.push(copy.id);
      return {
        token: copy,
        lossy: true,
        lost: [...GOLDKEY.DUPLICATE_LOSES],
        faithfulBackup: false,
      };
    },

    /** A GrandMaster is required to modify a Master -- enforced, not documented. */
    modifyMaster(masterId, { grandmasterSharesPresent, patch }) {
      if (!masters.has(masterId)) throw new NotRegistered(`no such master: ${masterId}`);
      if (recoveryShares == null) throw new TierViolation("no GrandMaster tier established");
      const picked = recoveryShares.filter((s) => (grandmasterSharesPresent || []).includes(s.x));
      if (picked.length < grandmasterShares) {
        throw new TierViolation(
          `a GrandMaster quorum (${grandmasterShares} shares) is required to modify a Master`
        );
      }
      Object.assign(masters.get(masterId), patch || {});
      return masters.get(masterId);
    },

    createGroup(name) {
      if (groups.size >= GOLDKEY.MAX_GROUPS) throw new RangeError(`group limit ${GOLDKEY.MAX_GROUPS} reached`);
      groups.add(name);
      return name;
    },

    /**
     * Rebuild a token payload when one shard is lost, using the stored parity.
     * Returns the exact original bytes (padding stripped) or throws -- it never
     * returns a plausible-looking wrong answer.
     */
    recoverPayload(userId, lostIndex = 0) {
      const rec = users.get(userId);
      if (!rec) throw new NotRegistered(`no such user: ${userId}`);
      const shards = rec.shards.map((s) => Uint8Array.from(s));
      shards[lostIndex] = null;
      const parity = Uint8Array.from(rec.parity);
      const rebuilt = recoverOne(shards, parity, lostIndex);
      const all = rec.shards.map((s, i) => (i === lostIndex ? rebuilt : Uint8Array.from(s)));
      const joined = new Uint8Array(all[0].length + all[1].length);
      joined.set(all[0], 0);
      joined.set(all[1], all[0].length);
      const out = joined.subarray(0, rec.payloadLen);
      if (checksum(out) !== rec.payloadChecksum) {
        throw new RangeError("recovered payload failed checksum");
      }
      return Uint8Array.from(out);
    },

    /**
     * Attach a certificate to a token. Exists so the lossy-duplicate rule is
     * actually observable: without real state on the source token, "copy drops
     * certificates" is indistinguishable from "copy preserves empty ones".
     */
    issueCertificate(userId, cert) {
      const rec = users.get(userId);
      if (!rec) throw new NotRegistered(`no such user: ${userId}`);
      if (rec.certificates.length >= GOLDKEY.MAX_CERTS) {
        throw new RangeError(`certificate limit ${GOLDKEY.MAX_CERTS} reached`);
      }
      rec.certificates.push(cert);
      return rec.certificates.length;
    },

    setPivSettings(userId, settings) {
      const rec = users.get(userId);
      if (!rec) throw new NotRegistered(`no such user: ${userId}`);
      rec.pivSettings = settings;
      return rec.pivSettings;
    },

    attachUnrecognizedGroup(userId, name) {
      const rec = users.get(userId);
      if (!rec) throw new NotRegistered(`no such user: ${userId}`);
      rec.unrecognizedGroups.push(name);
      return rec.unrecognizedGroups.length;
    },

    /** True when every user token is attached to a live Master. */
    auditRegistration() {
      const orphans = [];
      for (const u of users.values()) {
        const m = masters.get(u.masterId);
        if (!m || m.locked) orphans.push(u.id);
      }
      return {
        totalUsers: users.size,
        orphans,
        fullyCovered: orphans.length === 0,
        recoveryEstablished: recoveryShares != null,
        recoveryThreshold: grandmasterShares,
        recoveryShares: recoveryShares ? recoveryShares.length : 0,
      };
    },
  };

  return api;
}

/** FNV-1a over bytes. Small, dependency-free, and enough to detect drift. */
export function checksum(bytes) {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
