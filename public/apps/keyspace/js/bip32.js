// BIP-32 (secp256k1) + SLIP-0010 (ed25519) HD derivation, zero-dependency.
// Extended-key serialisation covers the version bytes wallets actually use
// (x/ypub/zpub + testnet). Cross-checked against @scure/bip32 and
// micro-ed25519-hdkey during development; the agreed vectors are baked
// into tests/11.

import { hmacSha512, hash160, hash256 } from "./hash.js";
import { base58Encode, B58_BTC } from "./codec.js";
import { N, bytesToBig, privToPoint, compress, pointAdd, scalarMul, parseCompressed } from "./secp256k1.js";

const HARDENED = 0x80000000;

export function parsePath(path) {
  const m = path.trim().match(/^m(\/(\d+)('|[hH])?)*$/);
  if (!m) throw new Error("bad path: " + path);
  const parts = path.trim().split("/").slice(1);
  return parts.map((p) => {
    const hard = p.endsWith("'") || p.endsWith("h") || p.endsWith("H");
    const idx = parseInt(hard ? p.slice(0, -1) : p, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= HARDENED)
      throw new Error("bad path index: " + p);
    return hard ? idx + HARDENED : idx;
  });
}

function ser32(i) {
  return new Uint8Array([(i >>> 24) & 0xff, (i >>> 16) & 0xff, (i >>> 8) & 0xff, i & 0xff]);
}

function fingerprintOf(pubCompressed) {
  return hash160(pubCompressed).subarray(0, 4);
}

// ------------------------------------------------------------ secp BIP-32

export function secpMaster(seed) {
  const I = hmacSha512(new TextEncoder().encode("Bitcoin seed"), seed);
  return {
    priv: I.subarray(0, 32),
    chain: I.subarray(32, 64),
    depth: 0,
    index: 0,
    parentFpr: new Uint8Array(4),
  };
}

function ckdPrivSecp(node, index) {
  const hardened = index >= HARDENED;
  let data;
  if (hardened) {
    data = new Uint8Array(1 + 32 + 4);
    data[0] = 0x00;
    data.set(node.priv, 1);
  } else {
    const pub = compress(privToPoint(node.priv));
    data = new Uint8Array(33 + 4);
    data.set(pub, 0);
  }
  data.set(ser32(index), data.length - 4);
  const I = hmacSha512(node.chain, data);
  const il = bytesToBig(I.subarray(0, 32));
  if (il >= N) throw new Error("invalid child (IL >= n)");
  const k = (il + bytesToBig(node.priv)) % N;
  if (k === 0n) throw new Error("invalid child (key zero)");
  const priv = new Uint8Array(32);
  let v = k;
  for (let i = 31; i >= 0; i--) {
    priv[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return {
    priv,
    chain: I.subarray(32, 64),
    depth: node.depth + 1,
    index,
    parentFpr: fingerprintOf(compress(privToPoint(node.priv))),
  };
}

export function secpDerive(node, path) {
  let n = node;
  for (const index of typeof path === "string" ? parsePath(path) : path)
    n = ckdPrivSecp(n, index);
  return n;
}

export function secpPub(node) {
  return node.pub ? node.pub : compress(privToPoint(node.priv));
}

function ckdPubSecp(node, index) {
  if (index >= HARDENED) throw new Error("public derivation cannot do hardened");
  const data = new Uint8Array(33 + 4);
  data.set(node.pub, 0);
  data.set(ser32(index), 33);
  const I = hmacSha512(node.chain, data);
  const il = bytesToBig(I.subarray(0, 32));
  if (il >= N) throw new Error("invalid child (IL >= n)");
  const q = pointAdd(parseCompressed(node.pub), scalarMul(il));
  if (!q) throw new Error("invalid child (infinity)");
  return {
    pub: compress(q),
    chain: I.subarray(32, 64),
    depth: node.depth + 1,
    index,
    parentFpr: fingerprintOf(node.pub),
  };
}

/**
 * Non-hardened derivation from a public node
 * ({pub, chain, depth, index, parentFpr}), e.g. a watch-only xpub.
 */
export function secpDerivePub(node, path) {
  if (!node.pub || node.pub.length !== 33) throw new Error("public node needs 33-byte pub");
  const rel = typeof path === "string" && !path.trim().startsWith("m/") ? "m/" + path.trim() : path;
  let n = node;
  for (const index of typeof path === "string" ? parsePath(rel) : rel)
    n = ckdPubSecp(n, index);
  return n;
}

// version bytes: [private, public]
const VERSIONS = {
  xprv: [0x0488ade4, 0x0488b21e],
  yprv: [0x049d7878, 0x049d7cb2],
  zprv: [0x04b2430c, 0x04b24746],
  tprv: [0x04358394, 0x043587cf],
  uprv: [0x044a5262, 0x044a5262 ^ 0], // placeholder replaced below
};
// testnet script/single-sig variants share the tpub public version family
VERSIONS.uprv = [0x044a5262, 0x044a4e28];
VERSIONS.vprv = [0x045f18bc, 0x045f1cf6];

export function serializeExtended(node, kind = "xprv") {
  const pub = kind.endsWith("pub");
  const vers = VERSIONS[pub ? kind.replace(/pub$/, "prv") : kind];
  if (!vers) throw new Error("unknown extended kind: " + kind);
  const out = new Uint8Array(78);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, pub ? vers[1] : vers[0], false);
  out[4] = node.depth;
  out.set(node.parentFpr, 5);
  dv.setUint32(9, node.index, false);
  out.set(node.chain, 13);
  if (pub) {
    out.set(secpPub(node), 45);
  } else {
    out[45] = 0x00;
    out.set(node.priv, 46);
  }
  return out;
}

export function extendedKey(node, kind = "xprv") {
  const raw = serializeExtended(node, kind);
  // base58check with empty version prefix (version is inside the payload)
  const v = new Uint8Array(82);
  v.set(raw, 0);
  v.set(hash256(raw).subarray(0, 4), 78);
  return base58Encode(v, B58_BTC);
}

// ------------------------------------------------------- SLIP-0010 ed25519
// Hardened-only chain; the raw IL at each level feeds the next HMAC and the
// final IL is used AS the RFC 8032 seed (sha512+clamp inside keygen) — this
// is the deployed Solana/Stellar/NEAR behaviour.

export function edMaster(seed) {
  const I = hmacSha512(new TextEncoder().encode("ed25519 seed"), seed);
  return { key: I.subarray(0, 32), chain: I.subarray(32, 64) };
}

export function edDerive(node, path) {
  const idxs = typeof path === "string" ? parsePath(path) : path;
  let n = node;
  for (const index of idxs) {
    if (index < HARDENED) throw new Error("ed25519 needs hardened derivation");
    const data = new Uint8Array(1 + 32 + 4);
    data[0] = 0x00;
    data.set(n.key, 1);
    data.set(ser32(index), 33);
    const I = hmacSha512(n.chain, data);
    n = { key: I.subarray(0, 32), chain: I.subarray(32, 64) };
  }
  return n;
}
