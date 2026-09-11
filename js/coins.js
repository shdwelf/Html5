// Coin registry + mnemonic-to-address derivation, zero-dependency.
// The registry JSON (config/coins-top500.json) is loaded by the caller —
// fs in Node, fetch/vite-import in browsers — and passed in, so this
// module stays environment-free. Covered by tests/11.

import { pbkdf2HmacSha512 } from "./hash.js";
import { toHex } from "./codec.js";
import { secpMaster, secpDerive, secpPub, edMaster, edDerive } from "./bip32.js";
import { privToPoint, compress } from "./secp256k1.js";
import { pubFromSeed } from "./ed25519.js";
import {
  FAMILY_PURPOSE, defaultPath, addressFromSecp, addressFromEd,
} from "./addrs.js";

const ED_FAMILIES = new Set(["sol", "stellar", "near"]);
export const isEdFamily = (family) => ED_FAMILIES.has(family);

/** BIP-39 seed: PBKDF2-HMAC-SHA512(mnemonic, "mnemonic"+passphrase, 2048). */
export function mnemonicToSeed(mnemonic, passphrase = "") {
  const nf = (s) => s.normalize("NFKD");
  const pw = new TextEncoder().encode(nf(mnemonic));
  const salt = new TextEncoder().encode(nf("mnemonic" + passphrase));
  return pbkdf2HmacSha512(pw, salt, 2048, 64);
}

export function findCoin(coins, { id, symbol, rank } = {}) {
  if (id !== undefined) return coins.find((c) => c.id === id) || null;
  if (rank !== undefined) return coins.find((c) => c.rank === rank) || null;
  if (symbol !== undefined) {
    const up = String(symbol).toUpperCase();
    const hits = coins.filter((c) => c.symbol.toUpperCase() === up);
    if (hits.length === 1) return hits[0];
    if (hits.length > 1)
      throw new Error(`symbol ${symbol} is ambiguous (${hits.map((h) => h.id).join(", ")}); use id`);
    return null;
  }
  return null;
}

export function searchCoins(coins, q, limit = 25) {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return coins.slice(0, limit);
  const starts = [], contains = [];
  for (const c of coins) {
    const sym = c.symbol.toLowerCase(), name = c.name.toLowerCase();
    if (sym.startsWith(needle) || name.startsWith(needle)) starts.push(c);
    else if (sym.includes(needle) || name.includes(needle) || c.id.includes(needle)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

/**
 * Derive the address for a registry row. `sel` is {id} (preferred),
 * {symbol} (must be unambiguous), or {rank}. Account/change/index select
 * the leaf; `purpose` overrides the family default for the Bitcoin
 * families (44/49/84/86); `path` overrides everything.
 */
export function deriveCoin(coins, mnemonic, sel, opts = {}) {
  const coin = sel && typeof sel === "object" && !Array.isArray(sel) && sel.rank !== undefined
    ? findCoin(coins, sel) : findCoin(coins, sel);
  if (!coin) throw new Error("unknown coin: " + JSON.stringify(sel));
  if (!coin.derive) throw new Error(`${coin.symbol} (${coin.id}): ${coin.reason || "derivation unsupported"}`);
  const { account = 0, change = 0, index = 0, passphrase = "", purpose, path } = opts;
  const seed = mnemonicToSeed(mnemonic, passphrase);
  let usePath = path;
  if (!usePath) {
    if (purpose !== undefined && ED_FAMILIES.has(coin.family))
      throw new Error("purpose override is secp-only");
    if (purpose !== undefined) {
      if (![44, 49, 84, 86].includes(purpose)) throw new Error("bad purpose " + purpose);
      usePath = `m/${purpose}'/${coin.slip44}'/${account}'/${change}/${index}`;
    } else {
      usePath = defaultPath(coin.family, coin.slip44, { account, change, index });
    }
  }
  if (ED_FAMILIES.has(coin.family)) {
    const node = edDerive(edMaster(seed), usePath);
    const pub = pubFromSeed(node.key);
    return {
      coin, path: usePath,
      address: addressFromEd(coin.family, pub),
      pubkeyHex: toHex(pub),
    };
  }
  const node = secpDerive(secpMaster(seed), usePath);
  const pt = privToPoint(node.priv);
  const comp = compress(pt);
  const x = comp.subarray(1);
  const yb = (() => {
    // y from the point (kept as bytes for the 64-byte uncompressed form)
    const out = new Uint8Array(32);
    let v = pt.y;
    for (let i = 31; i >= 0; i--) {
      out[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return out;
  })();
  const pub64 = new Uint8Array(64);
  pub64.set(x, 0);
  pub64.set(yb, 32);
  // A purpose override re-encodes the same key in another script family so
  // one row can serve legacy/segwit/taproot wallets (Bitcoin-likes only).
  let family = coin.family;
  if (purpose === 44 && ["p2wpkh", "p2tr", "p2sh-p2wpkh"].includes(family)) family = "p2pkh";
  else if (purpose === 49) family = "p2sh-p2wpkh";
  else if (purpose === 84) family = "p2wpkh";
  else if (purpose === 86) family = "p2tr";
  return {
    coin, path: usePath, family,
    // chain (not symbol): BTC-hosted tokens like DOG/ORDI encode as Bitcoin.
    address: addressFromSecp(family, coin.chain, comp, pub64),
    pubkeyHex: toHex(comp),
  };
}
