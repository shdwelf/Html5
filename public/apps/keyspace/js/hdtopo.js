/** Schematic HD topology. Not BIP-32 HMAC; art + labels only. */

export const PURPOSES = [
  { id: 44, label: "BIP-44", note: "legacy P2PKH" },
  { id: 49, label: "BIP-49", note: "P2SH-P2WPKH" },
  { id: 84, label: "BIP-84", note: "native SegWit" },
  { id: 86, label: "BIP-86", note: "Taproot" },
];

export const COINS = [
  { type: 0, name: "BTC", slip: "SLIP-44" },
  { type: 2, name: "LTC", slip: "SLIP-44" },
  { type: 60, name: "ETH", slip: "SLIP-44" },
  { type: 145, name: "BCH", slip: "SLIP-44" },
  { type: 501, name: "SOL", slip: "SLIP-10 ed25519" },
  { type: 1815, name: "ADA", slip: "SLIP-10" },
];

export function pathTemplate(purpose, coin, account = 0) {
  return `m / ${purpose}' / ${coin}' / ${account}' / 0 / i`;
}

export const PIPELINE = [
  "ENT 128–256",
  "Φ checksum",
  "mnemonic",
  "PBKDF2×2048 → 512",
  "IL 256 ⊕ IR 256",
  "BIP-32 / SLIP-10",
  "purpose' / coin'",
  "Q = k·G",
];
