/**
 * mealcard.js — corporate kitchen meal-card ledger: a block-lattice with
 * Nano/Banano manners and a Pirate flag on top.
 *
 * Design (what is borrowed, honestly):
 *   - block-lattice: every meal card carries its own chain of blocks
 *     (Nano/Banano). Blocks are open / send / receive / change.
 *   - feeless + lossless: amounts are integer cents, no fees, no float; a
 *     receive must reference its send and credit exactly the sent amount.
 *   - light anti-spam proof-of-work per block (Nano-style, difficulty is
 *     configurable and defaults to trivial so the till stays instant).
 *   - Pirate flavour is the wallet UX (ARRR PirateOcean: one balance, send /
 *     receive, memo line) and the "nothing leaves the building" privacy:
 *     this ledger never touches a network. There is no shielded pool and no
 *     zero-knowledge proof here, and the page says so.
 *   - the two-program split from the smartcard work applies: the card (or
 *     its QR/voucher) is the JavaCard side, this page is the JavaOS terminal.
 *
 * Consensus, stated plainly: the corporation's kitchen till is the principal
 * representative. A spend is final when the till's chain has received it.
 * Double-spend protection is balance + full-chain verification
 * (verifyLedger recomputes every hash, link, balance and PoW).
 *
 * Pure logic: no DOM, no storage, no randomness. The page (inline script in
 * kitchen-meal-card.html) owns seeds, persistence and rendering. Unit-tests
 * drive this module directly (tests/15-mealcard.mjs).
 */

import { sha256 } from "./hash.js";

export const VERSION = "mealcard-v1";
export const CORP_ID = "CORP-TREASURY";
export const BLOCK_TYPES = ["open", "send", "receive", "change"];

// ------------------------------------------------------------------ bytes

const te = new TextEncoder();

export function bytes(str) {
  return te.encode(str);
}

export function hex(u8) {
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function sha256hex(parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    buf.set(p, o);
    o += p.length;
  }
  return hex(sha256(buf));
}

function u32be(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0, false);
  return b;
}

function hexToBytes(h) {
  if (!/^[0-9a-fA-F]*$/.test(h) || h.length % 2) throw new Error("seed must be even-length hex");
  const b = new Uint8Array(h.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return b;
}

// ------------------------------------------------------------------- money

/** Integer cents in, "$12.34" out. No float anywhere near money. */
export function fmt(cents) {
  const neg = cents < 0;
  const c = Math.abs(Math.trunc(cents));
  return `${neg ? "-" : ""}$${Math.trunc(c / 100)}.${String(c % 100).padStart(2, "0")}`;
}

/** "12.34" / "$12.34" / "12" -> cents, or null when unparseable. */
export function parseAmount(text) {
  const m = String(text || "").trim().replace(/^\$/, "").match(/^(\d{1,9})(?:\.(\d{0,2}))?$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 100 + parseInt((m[2] || "").padEnd(2, "0"), 10);
}

// --------------------------------------------------------------- identity

/** Deterministic card id from the corp seed: MEAL-A1B2C3-D4E5F6. */
export function cardId(seedHex, index) {
  const h = sha256hex([bytes(`${VERSION}/id`), hexToBytes(seedHex), u32be(index)]);
  const a = h.slice(0, 6).toUpperCase();
  const b = h.slice(6, 12).toUpperCase();
  return `MEAL-${a}-${b}`;
}

/** Per-card secret (voucher codes + future card personalization). */
export function cardSecret(seedHex, index) {
  return sha256hex([bytes(`${VERSION}/secret`), hexToBytes(seedHex), u32be(index)]);
}

// ------------------------------------------------------------------ ledger

export function emptyLedger() {
  return { version: VERSION, accounts: {}, cards: {} };
}

/** Canonical bytes of a block (everything but its own hash). */
export function blockBytes(block) {
  const { hash, ...rest } = block;
  const keys = Object.keys(rest).sort();
  const canon = {};
  for (const k of keys) canon[k] = rest[k];
  return bytes(JSON.stringify(canon));
}

export function blockHash(block) {
  return sha256hex([blockBytes(block)]);
}

/** Nano-style anti-spam PoW: hash must open with `difficulty` zero nibbles. */
export function mine(account, draft, difficulty) {
  let nonce = 0;
  for (;;) {
    const candidate = { ...draft, account, nonce };
    const hash = blockHash(candidate);
    if (hash.startsWith("0".repeat(difficulty))) return { ...candidate, hash };
    nonce++;
    if (nonce > 0xffffffff) throw new Error("PoW search exhausted (raise less, lower difficulty)");
  }
}

function head(ledger, account) {
  const chain = ledger.accounts[account];
  return chain && chain.length ? chain[chain.length - 1] : null;
}

export function balance(ledger, account) {
  const h = head(ledger, account);
  return h ? h.balance : 0;
}

function append(ledger, block) {
  if (!ledger.accounts[block.account]) ledger.accounts[block.account] = [];
  ledger.accounts[block.account].push(block);
  return block;
}

/**
 * Open the corp treasury with an initial issue. The treasury is the only
 * account allowed to create value (its open block has no funding send).
 */
export function openTreasury(ledger, issueCents, difficulty = 1) {
  if (head(ledger, CORP_ID)) throw new Error("treasury already open");
  if (!Number.isInteger(issueCents) || issueCents <= 0) throw new Error("issue must be positive integer cents");
  const draft = { height: 0, prev: "GENESIS", type: "open", funding: null, balance: issueCents, memo: `treasury issue ${fmt(issueCents)}` };
  return append(ledger, mine(CORP_ID, draft, difficulty));
}

export function issueCard(ledger, seedHex, index, holder) {
  const id = cardId(seedHex, index);
  if (ledger.cards[id]) throw new Error(`${id} already issued`);
  ledger.cards[id] = { index, holder: String(holder || `holder-${index}`), secret: cardSecret(seedHex, index) };
  return id;
}

/**
 * Move value. Appends a `send` on `from` and a `receive` (or first-block
 * `open`) on `to`, both mined. Lossless: the receive references the send's
 * hash and credits exactly its amount; fails closed otherwise.
 */
export function transfer(ledger, from, to, amountCents, memo = "", difficulty = 1) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error("amount must be positive integer cents");
  if (from === to) throw new Error("sender and receiver differ");
  const fh = head(ledger, from);
  if (!fh) throw new Error(`${from} has no chain (unfunded account)`);
  if (from !== CORP_ID && fh.balance < amountCents) throw new Error(`insufficient funds: ${fmt(fh.balance)} < ${fmt(amountCents)}`);
  if (to !== CORP_ID && !ledger.cards[to]) throw new Error(`${to} is not an issued card`);

  const sendDraft = {
    height: fh.height + 1, prev: fh.hash, type: "send",
    to, amount: amountCents, balance: from === CORP_ID ? fh.balance - amountCents : fh.balance - amountCents, memo,
  };
  if (sendDraft.balance < 0) throw new Error("treasury overdraft denied (fail closed)");
  const send = append(ledger, mine(from, sendDraft, difficulty));

  const th = head(ledger, to);
  const recvDraft = th
    ? { height: th.height + 1, prev: th.hash, type: "receive", funding: send.hash, amount: amountCents, balance: th.balance + amountCents, memo }
    : { height: 0, prev: "GENESIS", type: "open", funding: send.hash, amount: amountCents, balance: amountCents, memo };
  const recv = append(ledger, mine(to, recvDraft, difficulty));
  return { send, recv };
}

/** Rotate an account's representative (which till confirms for it). */
export function changeRep(ledger, account, rep, difficulty = 1) {
  const h = head(ledger, account);
  if (!h) throw new Error(`${account} has no chain`);
  const draft = { height: h.height + 1, prev: h.hash, type: "change", rep: String(rep), balance: h.balance, memo: `rep -> ${rep}` };
  return append(ledger, mine(account, draft, difficulty));
}

// ------------------------------------------------------------------ verify

/**
 * Recompute everything: hashes, links, heights, balances, funding refs,
 * PoW. Returns { ok, errors[] }. The till runs this before honoring a
 * voucher or an imported ledger.
 */
export function verifyLedger(ledger, difficulty = 1) {
  const errors = [];
  if (!ledger || ledger.version !== VERSION) errors.push("unknown ledger version");
  const accounts = (ledger && ledger.accounts) || {};
  const sends = new Map(); // sendHash -> { to, amount }
  for (const [account, chain] of Object.entries(accounts)) {
    if (!Array.isArray(chain) || !chain.length) {
      errors.push(`${account}: empty chain`);
      continue;
    }
    let prev = "GENESIS";
    let height = 0;
    let bal = 0;
    for (const b of chain) {
      if (b.account !== account) errors.push(`${account}#${height}: account tag mismatch`);
      if (b.height !== height) errors.push(`${account}#${height}: height gap`);
      if (b.prev !== prev) errors.push(`${account}#${height}: prev-link break`);
      if (blockHash(b) !== b.hash) errors.push(`${account}#${height}: hash mismatch (tampered?)`);
      if (!String(b.hash).startsWith("0".repeat(difficulty))) errors.push(`${account}#${height}: PoW below difficulty ${difficulty}`);
      if (!BLOCK_TYPES.includes(b.type)) errors.push(`${account}#${height}: unknown type ${b.type}`);
      if (b.type === "send") {
        if (!Number.isInteger(b.amount) || b.amount <= 0) errors.push(`${account}#${height}: bad send amount`);
        if (b.balance !== bal - b.amount) errors.push(`${account}#${height}: send balance ${b.balance} != ${bal - b.amount}`);
        if (b.balance < 0) errors.push(`${account}#${height}: negative balance`);
        sends.set(b.hash, { to: b.to, amount: b.amount });
        bal = b.balance;
      } else if (b.type === "receive" || b.type === "open") {
        const f = sends.get(b.funding);
        if (account === CORP_ID && b.type === "open" && b.funding === null) {
          if (height !== 0) errors.push(`${account}#${height}: treasury re-issue`);
          bal = b.balance;
        } else {
          if (!f) errors.push(`${account}#${height}: funding send ${String(b.funding).slice(0, 12)} unknown`);
          else if (f.to !== account) errors.push(`${account}#${height}: funding send pays ${f.to}, not ${account}`);
          else if (f.amount !== b.amount) errors.push(`${account}#${height}: LOSSY — credited ${b.amount}, send was ${f.amount}`);
          else if (b.balance !== bal + b.amount) errors.push(`${account}#${height}: receive balance ${b.balance} != ${bal + b.amount}`);
          if (f && f.amount === b.amount) bal = b.balance;
        }
        if (b.type === "open" && height !== 0 && !(account === CORP_ID)) errors.push(`${account}#${height}: second open block`);
      } else if (b.type === "change") {
        if (b.balance !== bal) errors.push(`${account}#${height}: change moved money`);
      }
      prev = b.hash;
      height++;
    }
  }
  // Every send funds at most one receive (no double-claim).
  const claims = new Map();
  for (const [account, chain] of Object.entries(accounts)) {
    for (const b of chain || []) {
      if ((b.type === "receive" || b.type === "open") && b.funding) {
        if (claims.has(b.funding)) errors.push(`${account}#${b.height}: send ${b.funding.slice(0, 12)} claimed twice`);
        claims.set(b.funding, account);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Total in circulation (treasury + cards). Constant after issue: lossless. */
export function supply(ledger) {
  let n = 0;
  for (const account of Object.keys(ledger.accounts || {})) n += balance(ledger, account);
  return n;
}

// ----------------------------------------------------------------- vouchers
//
// Offline demo construction (NOT HOTP — no SHA-1 here): the card shows an
// 8-digit code for (counter, amount); the till, which shares the card secret,
// replays a look-ahead window. Documented as a demo, enforced by tests.

export function voucherCode(secretHex, counter, amountCents) {
  const h = sha256hex([bytes(`${VERSION}/voucher`), hexToBytes(secretHex), u32be(counter),
    new Uint8Array([amountCents & 255, (amountCents >> 8) & 255, (amountCents >> 16) & 255, (amountCents >> 24) & 255])]);
  return String(parseInt(h.slice(0, 8), 16) % 100000000).padStart(8, "0");
}

/** Till side: find the counter in [hint .. hint+window) matching code+amount. */
export function redeemVoucher(secretHex, code, amountCents, hint = 0, window = 20) {
  for (let c = hint; c < hint + window; c++) {
    if (voucherCode(secretHex, c, amountCents) === code) return c;
  }
  return -1;
}

// ------------------------------------------------------------------- codec

export function exportLedger(ledger) {
  return JSON.stringify({ exported: VERSION, ledger }, null, 2);
}

export function importLedger(text, difficulty = 1) {
  const obj = JSON.parse(String(text));
  const ledger = obj && obj.ledger ? obj.ledger : obj;
  const v = verifyLedger(ledger, difficulty);
  if (!v.ok) throw new Error(`import refused: ${v.errors[0]}`);
  return ledger;
}
