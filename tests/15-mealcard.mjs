/**
 * 15 · the kitchen meal-card ledger: js/mealcard.js driven directly, plus the
 * page's inline script checked against its own markup.
 *
 * What is asserted — and why each one is a bug class, not a formality:
 *   - money never touches float (fmt/parseAmount round-trip, rejects);
 *   - card ids are deterministic and distinct per index;
 *   - sha256hex agrees with node:crypto (the page's hash chain is real);
 *   - grants/spends move exact cents and the supply never changes (lossless);
 *   - overdrafts, double issues, unknown cards and self-pays fail closed;
 *   - flipping one byte anywhere breaks verification (tamper evidence);
 *   - claiming one send twice is caught;
 *   - voucher codes are deterministic and redeem at the right counter only;
 *   - export/import round-trips, and a tampered import is refused;
 *   - a fixed-seed scenario reproduces byte-exact goldens (no silent drift);
 *   - every id the page's inline script asks for exists in its markup.
 *
 * node tests/15-mealcard.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { suite, ROOT } from "./lib.mjs";
import * as mc from "../js/mealcard.js";

const s = suite("15 · kitchen meal-card ledger");
const throws = (fn) => {
  try {
    fn();
  } catch {
    return true;
  }
  return false;
};

// ------------------------------------------------------------------- money
s.eq("fmt dollars", mc.fmt(1234), "$12.34");
s.eq("fmt zero", mc.fmt(0), "$0.00");
s.eq("fmt pads", mc.fmt(5), "$0.05");
s.eq("parse plain", mc.parseAmount("12.34"), 1234);
s.eq("parse $ and whole", mc.parseAmount("$12"), 1200);
s.eq("parse rejects 3dp", mc.parseAmount("12.345"), null);
s.eq("parse rejects negative", mc.parseAmount("-5"), null);
s.eq("parse rejects junk", mc.parseAmount("lunch"), null);

// ---------------------------------------------------------------- identity
const SEED = "0123456789abcdef0123456789abcdef";
const id0 = mc.cardId(SEED, 0);
const id1 = mc.cardId(SEED, 1);
s.ok("card id shape", /^MEAL-[0-9A-F]{6}-[0-9A-F]{6}$/.test(id0), id0);
s.ok("card ids distinct per index", id0 !== id1, `${id0} vs ${id1}`);
s.eq("card id deterministic", mc.cardId(SEED, 0), id0);
s.ok("card secret distinct", mc.cardSecret(SEED, 0) !== mc.cardSecret(SEED, 1));
s.eq("seed hex enforced", throws(() => mc.cardId("zz", 0)), true);

// ------------------------------------------------- hash cross-check (2nd impl)
{
  const parts = [mc.bytes("mealcard-v1/id"), new Uint8Array([9, 9]), mc.bytes("x")];
  const want = createHash("sha256").update(Buffer.concat(parts)).digest("hex");
  s.eq("sha256hex == node:crypto", mc.sha256hex(parts), want);
}

// ------------------------------------------------------------------- flow
const L = mc.emptyLedger();
mc.openTreasury(L, 1000000, 0); // $10,000.00, difficulty 0 = deterministic
s.eq("treasury balance", mc.balance(L, mc.CORP_ID), 1000000);
s.eq("double open refused", throws(() => mc.openTreasury(L, 5, 0)), true);
const ada = mc.issueCard(L, SEED, 0, "Ada Lovelace");
const till = mc.issueCard(L, SEED, 99, "Till — Grill");
s.eq("double issue refused", throws(() => mc.issueCard(L, SEED, 0, "Ada again")), true);
s.eq("grant to unknown card refused", throws(() => mc.transfer(L, mc.CORP_ID, "MEAL-XXXXXX-XXXXXX", 1, "", 0)), true);

mc.transfer(L, mc.CORP_ID, ada, 2500, "corp grant", 0);
s.eq("grant credited", mc.balance(L, ada), 2500);
s.eq("treasury debited", mc.balance(L, mc.CORP_ID), 997500);
mc.transfer(L, ada, till, 850, "lunch — grill", 0);
s.eq("spend debited", mc.balance(L, ada), 1650);
s.eq("till credited", mc.balance(L, till), 850);
s.eq("supply constant (lossless)", mc.supply(L), 1000000);
s.eq("overdraft refused", throws(() => mc.transfer(L, ada, till, 999999, "", 0)), true);
s.eq("self-pay refused", throws(() => mc.transfer(L, ada, ada, 1, "", 0)), true);
s.eq("zero amount refused", throws(() => mc.transfer(L, ada, till, 0, "", 0)), true);

const v0 = mc.verifyLedger(L, 0);
s.ok("honest ledger verifies", v0.ok, v0.errors.join("; "));
s.ok("PoW recorded", L.accounts[ada][1].hash.startsWith("") && Number.isInteger(L.accounts[ada][1].nonce));

// ------------------------------------------------------------------- tamper
{
  const t = structuredClone(L);
  t.accounts[ada][1].amount = 851; // quiet edit, no re-mine
  const v = mc.verifyLedger(t, 0);
  s.ok("edited amount breaks verification", !v.ok, v.errors[0] || "");
}
{
  const t = structuredClone(L);
  t.accounts[till][0].balance = 851; // re-credit without a send
  const v = mc.verifyLedger(t, 0);
  s.ok("edited balance breaks verification", !v.ok, v.errors[0] || "");
}
{
  // Claim the same send twice on a second account.
  const t = structuredClone(L);
  const bob = mc.cardId(SEED, 7);
  t.cards[bob] = { index: 7, holder: "Bob", secret: mc.cardSecret(SEED, 7) };
  const sendHash = t.accounts[mc.CORP_ID][1].hash;
  const evil = mc.mine(bob, { height: 0, prev: "GENESIS", type: "open", funding: sendHash, amount: 2500, balance: 2500, memo: "evil" }, 0);
  t.accounts[bob] = [evil];
  const v = mc.verifyLedger(t, 0);
  s.ok("double claim caught", !v.ok, v.errors[0] || "");
}

// ---------------------------------------------------------------- vouchers
{
  const sec = mc.cardSecret(SEED, 0);
  const c0 = mc.voucherCode(sec, 0, 850);
  s.ok("voucher is 8 digits", /^\d{8}$/.test(c0), c0);
  s.eq("voucher deterministic", mc.voucherCode(sec, 0, 850), c0);
  s.ok("voucher binds amount", mc.voucherCode(sec, 0, 851) !== c0);
  s.eq("redeem finds counter", mc.redeemVoucher(sec, c0, 850, 0, 20), 0);
  const c7 = mc.voucherCode(sec, 7, 850);
  s.eq("redeem finds counter 7 in window", mc.redeemVoucher(sec, c7, 850, 0, 20), 7);
  s.eq("redeem misses outside window", mc.redeemVoucher(sec, c7, 850, 8, 5), -1);
  s.eq("wrong code refused", mc.redeemVoucher(sec, "00000000", 850, 0, 20), -1);
  s.eq("wrong amount refused", mc.redeemVoucher(sec, c7, 851, 0, 20), -1);
}

// ------------------------------------------------------------- export/import
{
  const text = mc.exportLedger(L);
  const back = mc.importLedger(text, 0);
  s.eq("import round-trips supply", mc.supply(back), 1000000);
  const evil = JSON.parse(text);
  evil.ledger.accounts[ada][0].balance = 999999;
  s.eq("tampered import refused", throws(() => mc.importLedger(JSON.stringify(evil), 0)), true);
  s.eq("garbage import refused", throws(() => mc.importLedger("not json", 0)), true);
}

// ------------------------------------------------------------------ goldens
// Fixed seed + difficulty 0 => every byte deterministic. If these change, the
// ledger format changed and the page, the docs and the goldens move together.
s.eq("golden card id 0", id0, "MEAL-2D4A7F-4BDADB");
s.eq("golden card id 99", till, "MEAL-FF23A9-099850");
{
  const g = mc.emptyLedger();
  mc.openTreasury(g, 1000000, 0);
  const a = mc.issueCard(g, SEED, 0, "Ada Lovelace");
  const t = mc.issueCard(g, SEED, 99, "Till — Grill");
  const { send } = mc.transfer(g, mc.CORP_ID, a, 2500, "corp grant", 0);
  mc.transfer(g, a, t, 850, "lunch — grill", 0);
  s.eq("golden grant send hash", send.hash, "d73fe80028bb632604ec6c2d2a60527c6a398956ef35d20253f556a02a7b0edb");
  s.eq("golden ledger export sha256",
    createHash("sha256").update(mc.exportLedger(g)).digest("hex"),
    "1be619b035dc40dc247ac466c294004f001e12f7ed2fdaf2d08f1d9138716ef7");
}

// ------------------------------------------------------- page wiring (ids)
{
  const page = readFileSync(`${ROOT}kitchen-meal-card.html`, "utf8");
  const defined = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const scripts = [...page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const refs = new Set();
  for (const src of scripts) {
    for (const m of src.matchAll(/\$\("([^"]+)"\)/g)) refs.add(m[1]);
    for (const m of src.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) refs.add(m[1]);
  }
  const missing = [...refs].filter((id) => !defined.has(id));
  s.ok("inline script ids all exist in markup", missing.length === 0,
    `${refs.size} referenced, ${defined.size} defined${missing.length ? ": " + missing.join(",") : ""}`);
  s.ok("page imports the ledger module", scripts.some((x) => x.includes('./js/mealcard.js')));
}

process.exit(s.done() ? 1 : 0);
