// Address encoders for every family in the top-500 registry, zero-dependency.
// secp256k1 families consume the 33-byte COMPRESSED public key (Bitcoin,
// Litecoin, Dogecoin, ...); EVM/TRON consume the 64-byte uncompressed
// x||y; ed25519 families consume the 32-byte public key (Solana, Stellar).
// Each encoder is known-answer or oracle checked in tests/11.

import { hash160, sha256, keccak256, taggedHash } from "./hash.js";
import {
  base58Encode, base58CheckEncode, segwitEncode, bech32Encode,
  convertBits, eip55, stellarEncode, B58_XRP, toHex,
} from "./codec.js";
import { taprootOutputKey } from "./secp256k1.js";

/**
 * Per-symbol Bitcoin-family parameters. Only entries the curator could
 * verify are listed; anything else must use another family or stay
 * unsupported (see coins-top500.json reason strings).
 * p2pkh/p2sh: base58check version bytes. hrp: bech32 human-readable part
 * (null where the chain never adopted segwit address formats).
 */
export const COIN_PARAMS = {
  BTC:  { p2pkh: [0x00],       p2sh: [0x05],       hrp: "bc" },
  LTC:  { p2pkh: [0x30],       p2sh: [0x32],       hrp: "ltc" },
  DOGE: { p2pkh: [0x1e],       p2sh: [0x16],       hrp: null },
  BCH:  { p2pkh: [0x00],       p2sh: [0x05],       hrp: null }, // legacy only; cashaddr out of scope
  BSV:  { p2pkh: [0x00],       p2sh: [0x05],       hrp: null },
  DASH: { p2pkh: [0x4c],       p2sh: [0x10],       hrp: null },
  DGB:  { p2pkh: [0x1e],       p2sh: [0x3f],       hrp: "dgb" },
  RVN:  { p2pkh: [0x3c],       p2sh: [0x7a],       hrp: null },
  QTUM: { p2pkh: [0x3a],       p2sh: null,         hrp: null },
  XVG:  { p2pkh: [0x1e],       p2sh: null,         hrp: null },
  XEC:  { p2pkh: [0x00],       p2sh: [0x05],       hrp: null }, // legacy only
  ZEC:  { p2pkh: [0x1c, 0xb8], p2sh: [0x1c, 0xbd], hrp: null }, // transparent only
};

export const COSMOS_HRP = {
  ATOM: "cosmos", TIA: "tia", SEI: "sei", CRO: "cro", LUNC: "terra",
  LUNA: "terra", AKT: "akash", DYDX: "dydx", RUNE: "thor", KAVA: "kava",
  AXL: "axelar", BAND: "band", INJ: "inj",
};

/** Default BIP purpose per family (Bitcoin families honour 44/49/84/86 overrides). */
export const FAMILY_PURPOSE = {
  "p2pkh": 44, "p2sh-p2wpkh": 49, "p2wpkh": 84, "p2tr": 86,
  "evm": 44, "tron": 44, "xrp": 44, "cosmos": 44, "evm-cosmos": 44,
  "zcash-t": 44, "sol": 44, "stellar": 44, "near": 44,
};

function params(symbol) {
  const p = COIN_PARAMS[symbol];
  if (!p) throw new Error("no bitcoin-family params for " + symbol);
  return p;
}

/** P2PKH (BIP-44): base58check(version || hash160(pub)). */
export function p2pkhAddr(pubCompressed, symbol) {
  return base58CheckEncode(hash160(pubCompressed), params(symbol).p2pkh);
}

/** P2SH-P2WPKH (BIP-49): base58check(p2sh-ver || hash160(0x0014 || hash160(pub))). */
export function p2shP2wpkhAddr(pubCompressed, symbol) {
  const p = params(symbol);
  if (!p.p2sh) throw new Error(symbol + " has no verified P2SH version");
  const redeem = new Uint8Array(22);
  redeem[0] = 0x00;
  redeem[1] = 0x14;
  redeem.set(hash160(pubCompressed), 2);
  return base58CheckEncode(hash160(redeem), p.p2sh);
}

/** P2WPKH (BIP-84): bech32(hrp, 0, hash160(pub)). */
export function p2wpkhAddr(pubCompressed, symbol) {
  const p = params(symbol);
  if (!p.hrp) throw new Error(symbol + " has no segwit address format");
  return segwitEncode(p.hrp, 0, hash160(pubCompressed));
}

/** P2TR key-spend (BIP-86): bech32m(hrp, 1, x(Q)) with Q = P + t*G. */
export function p2trAddr(pubCompressed, symbol) {
  const p = params(symbol);
  if (!p.hrp) throw new Error(symbol + " has no segwit address format");
  const t = taggedHash("TapTweak", pubCompressed.subarray(1));
  const q = taprootOutputKey(pubCompressed, t);
  return segwitEncode(p.hrp, 1, q);
}

/** EVM: EIP-55 of the last 20 bytes of keccak(x || y). */
export function evmAddr(pub64) {
  if (pub64.length !== 64) throw new Error("evm needs 64-byte x||y");
  return eip55(toHex(keccak256(pub64).subarray(12)));
}

/** TRON: base58check(0x41 || evm-bytes). */
export function tronAddr(pub64) {
  if (pub64.length !== 64) throw new Error("tron needs 64-byte x||y");
  return base58CheckEncode(keccak256(pub64).subarray(12), [0x41]);
}

/** XRP: base58check with the XRP alphabet, version 0x00, hash160 payload. */
export function xrpAddr(pubCompressed) {
  return base58CheckEncode(hash160(pubCompressed), [0x00], B58_XRP);
}

/** Cosmos-SDK: plain bech32(hrp, hash160(pub)). */
export function cosmosAddr(pubCompressed, symbolOrHrp) {
  const hrp = COSMOS_HRP[symbolOrHrp] || symbolOrHrp;
  if (!hrp || !/^[a-z0-9]+$/.test(hrp)) throw new Error("bad cosmos hrp: " + symbolOrHrp);
  return bech32Encode(hrp, convertBits(hash160(pubCompressed), 8, 5, true), "bech32");
}

/** Injective-style: bech32(hrp, evm-bytes) derived on the ETH (60) path. */
export function evmCosmosAddr(pub64, symbolOrHrp) {
  const hrp = COSMOS_HRP[symbolOrHrp] || symbolOrHrp;
  if (!hrp || !/^[a-z0-9]+$/.test(hrp)) throw new Error("bad cosmos hrp: " + symbolOrHrp);
  if (pub64.length !== 64) throw new Error("evm-cosmos needs 64-byte x||y");
  return bech32Encode(hrp, convertBits(keccak256(pub64).subarray(12), 8, 5, true), "bech32");
}

/** Zcash transparent (t1...): base58check(0x1cb8 || hash160(pub)). */
export function zcashTAddr(pubCompressed) {
  return base58CheckEncode(hash160(pubCompressed), [0x1c, 0xb8]);
}

/** Solana: plain base58(ed25519-pubkey), no version or checksum. */
export function solAddr(edPub32) {
  if (edPub32.length !== 32) throw new Error("sol needs 32-byte ed25519 key");
  return base58Encode(edPub32);
}

/** Stellar: strkey version 6<<3 ('G...'). */
export function stellarAddr(edPub32) {
  if (edPub32.length !== 32) throw new Error("stellar needs 32-byte ed25519 key");
  return stellarEncode(6 << 3, edPub32);
}

/** NEAR implicit account: hex(ed25519-pubkey). */
export function nearAddr(edPub32) {
  if (edPub32.length !== 32) throw new Error("near needs 32-byte ed25519 key");
  return toHex(edPub32);
}

/**
 * Default derivation path for a family. `change`/`index` only apply to the
 * secp BIP-44/49/84/86 five-level form; ed25519 paths are hardened-only.
 */
export function defaultPath(family, slip44, { account = 0, change = 0, index = 0 } = {}) {
  if (family === "sol") return `m/44'/${slip44}'/${account}'/0'`;
  if (family === "stellar") return `m/44'/${slip44}'/${account}'`;
  if (family === "near") return `m/44'/${slip44}'/0'`;
  const purpose = FAMILY_PURPOSE[family];
  if (purpose === undefined) throw new Error("no purpose for family " + family);
  return `m/${purpose}'/${slip44}'/${account}'/${change}/${index}`;
}

/** Dispatch secp compressed-pubkey -> address for the secp families. */
export function addressFromSecp(family, symbol, pubCompressed, pub64) {
  switch (family) {
    case "p2pkh": return p2pkhAddr(pubCompressed, symbol);
    case "p2sh-p2wpkh": return p2shP2wpkhAddr(pubCompressed, symbol);
    case "p2wpkh": return p2wpkhAddr(pubCompressed, symbol);
    case "p2tr": return p2trAddr(pubCompressed, symbol);
    case "zcash-t": return zcashTAddr(pubCompressed);
    case "evm": return evmAddr(pub64);
    case "tron": return tronAddr(pub64);
    case "xrp": return xrpAddr(pubCompressed);
    case "cosmos": return cosmosAddr(pubCompressed, symbol);
    case "evm-cosmos": return evmCosmosAddr(pub64, symbol);
    default: throw new Error("not a secp family: " + family);
  }
}

/** Dispatch ed25519-pubkey -> address for the ed families. */
export function addressFromEd(family, edPub32) {
  switch (family) {
    case "sol": return solAddr(edPub32);
    case "stellar": return stellarAddr(edPub32);
    case "near": return nearAddr(edPub32);
    default: throw new Error("not an ed family: " + family);
  }
}
