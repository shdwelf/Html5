// Focused Bitcoin wallet derivatives for the Keyspace Viewer.
// Uses the repository's vector-tested, zero-dependency BIP-39/BIP-32 stack.
// Returned private material is for an explicit local UI and must be masked by
// callers; this module performs no storage, logging, networking, or sharing.

import { mnemonicToSeed } from "./coins.js";
import { extendedKey, secpDerive, secpMaster, secpPub } from "./bip32.js";
import { p2pkhAddr, p2shP2wpkhAddr, p2wpkhAddr } from "./addrs.js";
import { base58CheckEncode, toHex } from "./codec.js";

const SCHEMES = {
  "44": { accountKind: "xpub", address: (pub) => p2pkhAddr(pub, "BTC") },
  "49": { accountKind: "ypub", address: (pub) => p2shP2wpkhAddr(pub, "BTC") },
  "84": { accountKind: "zpub", address: (pub) => p2wpkhAddr(pub, "BTC") },
};

/** Compressed-mainnet Wallet Import Format: base58check(0x80 || key || 0x01). */
export function privateKeyToWif(privateKey) {
  if (!(privateKey instanceof Uint8Array) || privateKey.length !== 32)
    throw new Error("WIF needs a 32-byte private key");
  const compressed = new Uint8Array(33);
  compressed.set(privateKey, 0);
  compressed[32] = 0x01;
  return base58CheckEncode(compressed, [0x80]);
}

/** Derive BIP-44/49/84 account public keys and the first `count` receive rows. */
export function deriveBitcoinWallet(mnemonic, passphrase = "", count = 5) {
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error("row count must be 1…20");
  const seed = mnemonicToSeed(String(mnemonic), String(passphrase));
  const root = secpMaster(seed);
  const schemes = {};

  for (const [purpose, meta] of Object.entries(SCHEMES)) {
    const accountPath = `m/${purpose}'/0'/0'`;
    const account = secpDerive(root, accountPath);
    const rows = [];
    for (let index = 0; index < count; index++) {
      const path = `${accountPath}/0/${index}`;
      const leaf = secpDerive(root, path);
      rows.push({
        path,
        address: meta.address(secpPub(leaf)),
        wif: privateKeyToWif(leaf.priv),
      });
    }
    schemes[purpose] = {
      accountKind: meta.accountKind,
      accountPublic: extendedKey(account, meta.accountKind),
      rows,
    };
  }

  return {
    seedHex: toHex(seed),
    rootPrivate: extendedKey(root, "xprv"),
    schemes,
  };
}
