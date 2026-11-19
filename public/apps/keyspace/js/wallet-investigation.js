import { mnemonicToEntropy, parsePhrase } from "./bip39.js";
import { mnemonicToSeed, deriveCoinFromSeed } from "./coins.js";
import { networksForCoin, coinOnNetwork } from "./coin-networks.js";

/**
 * Enumerate one curated default leaf per asset, NOT every possible wallet path.
 * Tokens on a host share a public result; PBKDF2 runs once. No network/storage.
 */
export async function deriveInvestigations(coins, networks, mnemonic, {
  passphrase = "", signal, onProgress = () => {},
  yieldControl = () => new Promise((resolve) => setTimeout(resolve, 0)),
} = {}) {
  const cancelled = () => {
    if (signal?.aborted) throw new DOMException("Local derivation cancelled", "AbortError");
  };
  cancelled();
  const words = parsePhrase(mnemonic);
  const analysis = await mnemonicToEntropy(words);
  mnemonic = words.join(" ");
  cancelled();
  if (!analysis.ok || !analysis.layout?.standard) throw new Error("Use a standard, checksum-valid BIP-39 phrase");
  const seed = mnemonicToSeed(mnemonic, passphrase);
  const cache = new Map(), rows = [];
  try {
    for (const coin of coins) {
      cancelled();
      const network = networksForCoin(networks, coin).find((item) => !item.environment || item.environment === "mainnet");
      const row = { id: coin.id, symbol: coin.symbol, chain: network?.hostChain || coin.chain, holdings: { status: "unqueried" } };
      if (!coin.derive) {
        rows.push({ ...row, status: "unsupported", reason: coin.reason });
        continue;
      }
      try {
        const { row: selected } = coinOnNetwork(networks, coin, network.id);
        const key = [selected.family, selected.chain, selected.path].join("|");
        if (!cache.has(key)) {
          await yieldControl();
          cancelled();
          cache.set(key, deriveCoinFromSeed(selected, seed));
        }
        const result = cache.get(key);
        rows.push({ ...row, status: "derived", networkId: network.id, path: result.path, address: result.address, pubkeyHex: result.pubkeyHex });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        rows.push({ ...row, status: "error", reason: "Default-leaf derivation failed" });
      }
      onProgress(rows.length, coins.length);
    }
    cancelled();
    return rows;
  } finally {
    seed.fill(0);
    cache.clear();
  }
}
