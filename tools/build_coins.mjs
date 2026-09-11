// Join config/market-top500.json (rank/name/chain/family) with
// config/slip44.json (authoritative coin numbers) into
// config/coins-top500.json (derivation-ready registry).
//
//   node tools/build_coins.mjs          # rewrite coins-top500.json
//   node tools/build_coins.mjs --check  # exit 1 if the checked-in file drifts
//   node tools/build_coins.mjs --fetch  # refresh slip44.json from GitHub first
//
// Encoder parameters (version bytes, HRPs) are imported from js/addrs.js so
// the build and the runtime can never disagree about what is derivable.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COIN_PARAMS, COSMOS_HRP, FAMILY_PURPOSE, defaultPath } from "../js/addrs.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MARKET = path.join(ROOT, "config", "market-top500.json");
const SLIP44 = path.join(ROOT, "config", "slip44.json");
const OUT = path.join(ROOT, "config", "coins-top500.json");

// Coin numbers for the single-key families: the address is a pure function of
// the key, so the whole family shares one number. Cross-checked against the
// registry at build time (warn on mismatch); all five currently agree.
const FAMILY_COIN = {
  sol: 501, tron: 195, xrp: 144, stellar: 148, near: 397,
};
// EVM chains resolve per chain: a token lives at its chain's address, so the
// row inherits the CHAIN's coin number. Registry-first, except chains whose
// deployed convention is documented to be the shared Ethereum path:
//   BSC (registry 714 is the retired Beacon chain), AVAX C-chain (registry
//   9000 is the pre-mainnet AVA entry), L2s and ETH forks without their own
//   path (60 in every wallet), PLS (full ETH fork), HYPE/MON/S (MetaMask-
//   first; registry entries are vestigial/pre-launch), FTM (MetaMask/Ledger
//   hold it at the ETH path), RSK (137 per RSK docs; unregistered), RON/KUB/
//   FLR/WEMIX (EVM clones with no registration; 60 in every wallet).
const EVM_CHAIN_OVERRIDE = {
  ETH: 60, BSC: 60, AVAX: 60, BASE: 60, ARB: 60, OP: 60, S: 60, MON: 60,
  HECO: 60, MERLIN: 60, "0G": 60, CRO: 60, PLS: 60, HYPE: 60, FTM: 60,
  RSK: 137, RON: 60, KUB: 60, FLR: 60, WEMIX: 60, PEAQ: 60,
};
const COSMOS_COIN = {
  CRO: 394, RUNE: 931, KAVA: 459, BAND: 494, LUNC: 330, LUNA: 330, INJ: 60,
};
const COSMOS_DEFAULT = 118;

const NO_ENCODER_REASON = {
  XMR: "CryptoNote ring signatures + keccak subaddresses: out of scope",
  ADA: "Shelley bech32 + staking credentials need blake2b: not implemented",
  WBT: "Whitechain params unverified",
  CC: "Canton Network params unknown",
  GRAM: "TON address codec not implemented",
  HBAR: "Hedera shard.realm.num accounts not implemented",
  SUI: "Sui (blake2b-derived) addresses not implemented",
  TAO: "Substrate SS58 (blake2b) not implemented",
  ICP: "Internet Computer account IDs not implemented",
  PI: "Pi Network params unknown",
  KAS: "Kaspa P2PK payload layout unverified",
  ALGO: "Algorand (sha512/256 checksum) not implemented",
  FIL: "Filecoin (blake2b + LEB128) not implemented",
  APT: "Aptos (sha3 auth-key) not implemented",
  DEL: "Decimal chain params unknown",
  STX: "Stacks c32 encoding not implemented",
  EOS: "EOSIO account names are not derivable addresses",
  AR: "Arweave uses RSA keys: incompatible with seed derivation",
  IOTA: "IOTA (blake2b) addresses not implemented",
  NEO: "NEO N3 script-hash version unverified",
  EGLD: "MultiversX bech32 + shard layout not implemented",
  MINA: "Mina (Poseidon) addresses not implemented",
  ZEN: "Horizen transparent versions unverified",
  ZANO: "CryptoNote-based: out of scope",
  AB: "AB chain params unknown",
  QUBIC: "Qubic address codec not implemented",
  ZIL: "Zilliqa bech32 payload layout unverified",
  CKB: "Nervos CKB lumos-style codec not implemented",
  ENJ: "Enjin Matrixchain migration: ambiguous home chain",
  ASTR: "Astar SS58/H160 dual format: ambiguous",
  ONT: "Ontology (scrypt/6000 multisig) not implemented",
  CSPR: "Casper (blake2b) addresses not implemented",
  SC: "Siacoin (blake2b + ed25519) not implemented",
  QRL: "QRL uses XMSS (hash-based, stateful): incompatible",
  FLOW: "Flow (RLP-derived) addresses not implemented",
  ARRR: "Pirate is shielded-only (z-addrs): out of scope",
  XNO: "Nano (blake2b checksum) not implemented",
  ROSE: "Oasis consensus encodings unverified",
  LSK: "Lisk32 address version unverified",
  POLYX: "Substrate SS58 (blake2b) not implemented",
  PCI: "PayProtocol chain params unknown",
  CCD: "Concordium account format not implemented",
  IOST: "IOST named accounts are not derivable addresses",
  WAVES: "Waves (blake2b/keccak) addresses not implemented",
  XPL: "Plasma derivation coin unverified",
  DCR: "Decred (blake256) addresses not implemented",
  XTZ: "Tezos (blake2b) addresses not implemented",
};

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function fetchSlip44() {
  const res = await fetch("https://api.github.com/repos/satoshilabs/slips/contents/slip-0044.md", {
    headers: { "User-Agent": "Html5-coin-registry", Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("slip44 fetch failed: " + res.status);
  const d = await res.json();
  const md = Buffer.from(d.content, "base64").toString("utf8");
  const rows = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/);
    if (m && m[1] !== "Coin type") {
      const sym = m[2].trim();
      if (sym === "---" || sym === "") continue;
      rows.push({ coin: parseInt(m[1], 10), symbol: sym, name: m[3].trim() });
    }
  }
  const out = {
    _meta: {
      source: "https://github.com/satoshilabs/slips/blob/master/slip-0044.md",
      sha: d.sha, fetched: new Date().toISOString().slice(0, 10), entries: rows.length,
    },
    coins: rows,
  };
  fs.writeFileSync(SLIP44, JSON.stringify(out, null, 1) + "\n");
  console.log(`slip44.json refreshed: ${rows.length} entries (${d.sha.slice(0, 12)})`);
  return out;
}

function build(slip) {
  const market = loadJSON(MARKET);
  const bySymbol = new Map();
  for (const c of slip.coins) {
    const up = c.symbol.toUpperCase();
    if (!bySymbol.has(up)) bySymbol.set(up, []);
    bySymbol.get(up).push(c);
  }
  const warnings = [];
  const singleHit = (key) => {
    const hits = bySymbol.get(String(key).toUpperCase()) || [];
    return hits.length === 1 ? hits[0] : null;
  };
  // Deliberate divergences are re-checked against the registry on every
  // build: if the registry ever agrees with our choice the warning (and the
  // override) should be removed.
  const crossCheck = (label, ours, key) => {
    const reg = singleHit(key);
    if (reg && reg.coin !== ours)
      warnings.push(`${label}: registry says ${reg.coin}, using ${ours} (${reg.name}; deliberate, see docs/bip-standards.md)`);
    return reg ? reg.name : null;
  };
  const assets = market.assets.map((a) => {
    let slip44 = null, slipSource = null, registryName = null;
    if (a.family && FAMILY_COIN[a.family] !== undefined) {
      slip44 = FAMILY_COIN[a.family];
      slipSource = "family";
      registryName = crossCheck(a.symbol, slip44, a.chain);
    } else if (a.family === "evm") {
      if (EVM_CHAIN_OVERRIDE[a.chain] !== undefined) {
        slip44 = EVM_CHAIN_OVERRIDE[a.chain];
        slipSource = "chain-override";
        registryName = crossCheck(`${a.symbol} [${a.chain}]`, slip44, a.chain);
      } else {
        const reg = singleHit(a.chain);
        if (reg) {
          slip44 = reg.coin;
          slipSource = "chain-registry";
          registryName = reg.name;
        } else {
          slip44 = 60;
          slipSource = "evm-fallback";
          warnings.push(`${a.symbol}: no coin number for EVM chain ${a.chain}; fell back to 60`);
        }
      }
    } else if (a.family === "evm-cosmos") {
      slip44 = 60;
      slipSource = "chain-override";
      registryName = crossCheck(`${a.symbol} [${a.chain}]`, slip44, a.chain);
    } else if (a.family === "cosmos") {
      slip44 = COSMOS_COIN[a.chain] ?? COSMOS_DEFAULT;
      slipSource = "family-map";
      const hits = bySymbol.get(a.symbol.toUpperCase()) || [];
      const reg = hits.length === 1 ? hits[0] : null;
      if (reg && reg.coin !== slip44)
        warnings.push(`${a.symbol}: registry says ${reg.coin}, family-map says ${slip44} (map wins)`);
      if (reg) registryName = reg.name;
    } else if (a.family) {
      // Bitcoin-family coin (or BTC-hosted token): registry by symbol/chain.
      const key = (a.type === "token" ? a.chain : a.symbol).toUpperCase();
      const hits = bySymbol.get(key) || [];
      if (hits.length === 1) {
        slip44 = hits[0].coin;
        slipSource = "registry";
        registryName = hits[0].name;
      } else if (hits.length > 1) {
        const exact = hits.filter((h) => h.name.toUpperCase() === a.name.toUpperCase());
        const words = new Set(a.name.toUpperCase().split(/[^A-Z0-9]+/));
        const named = exact.length === 1 ? exact : hits.filter((h) =>
          h.name.toUpperCase().split(/[^A-Z0-9]+/).some((w) => w && words.has(w)));
        if (named.length === 1) {
          slip44 = named[0].coin;
          slipSource = "registry-disambiguated";
          registryName = named[0].name;
        } else {
          warnings.push(`${a.symbol}: ${hits.length} registry hits, no name match (coins ${hits.map((h) => h.coin).join(",")})`);
        }
      } else {
        warnings.push(`${a.symbol}: no SLIP-0044 entry for ${key}`);
      }
    }
    const purpose = a.family ? FAMILY_PURPOSE[a.family] ?? null : null;
    let path = null, derive = false, reason = null;
    if (a.family && slip44 !== null && purpose !== null) {
      let paramsOk = false;
      if (["evm", "tron", "xrp", "sol", "stellar", "near", "zcash-t"].includes(a.family)) {
        paramsOk = true;
      } else if (a.family === "p2pkh") {
        paramsOk = !!COIN_PARAMS[a.chain]?.p2pkh;
      } else if (a.family === "p2wpkh" || a.family === "p2tr") {
        paramsOk = !!COIN_PARAMS[a.chain]?.hrp;
      } else if (a.family === "cosmos" || a.family === "evm-cosmos") {
        paramsOk = !!COSMOS_HRP[a.chain];
      }
      if (paramsOk) {
        path = defaultPath(a.family, slip44, { account: 0, change: 0, index: 0 });
        derive = true;
      } else {
        reason = `no verified address params for family ${a.family} on ${a.chain}`;
      }
    } else if (!a.family) {
      reason = NO_ENCODER_REASON[a.chain || a.symbol] || (a.chain
        ? `no encoder for host chain ${a.chain}`
        : `host chain unknown for ${a.symbol}`);
    } else {
      reason = `no SLIP-0044 coin number for ${a.symbol}`;
    }
    return {
      rank: a.rank, id: a.id, symbol: a.symbol, name: a.name, type: a.type,
      chain: a.chain, family: a.family, slip44, slip44Source: slipSource,
      registryName, purpose, path, derive, reason,
    };
  });
  const derived = assets.filter((a) => a.derive).length;
  const meta = {
    source: "market-top500.json + slip44.json",
    built: new Date().toISOString().slice(0, 10),
    assets: assets.length, derivable: derived,
    slip44Sha: slip._meta.sha, slip44Entries: slip._meta.entries,
  };
  return { out: { _meta: meta, assets }, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const slip = args.includes("--fetch") ? await fetchSlip44() : loadJSON(SLIP44);
  const { out, warnings } = build(slip);
  const text = JSON.stringify(out, null, 1) + "\n";
  for (const w of [...new Set(warnings)]) console.log("warn: " + w);
  console.log(`${out.assets.length} assets, ${out._meta.derivable} derivable`);
  if (args.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
    if (cur === text) {
      console.log("coins-top500.json is up to date");
    } else {
      console.log("coins-top500.json is STALE (run node tools/build_coins.mjs)");
      process.exit(1);
    }
    return;
  }
  fs.writeFileSync(OUT, text);
  console.log("wrote " + OUT);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
