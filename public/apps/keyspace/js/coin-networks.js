import { defaultPath } from "./addrs.js";
import { deriveCoin } from "./coins.js";

/** Extra token networks live outside the historical market/rank registry. */
export function networksForCoin(registry, coin) {
  if (!coin) return [];
  const networks = registry?.assets?.[coin.id];
  if (networks?.length) return networks;
  return [{
    id: "registry", name: `${coin.chain || "unknown chain"} · registry default`,
    chain: coin.chain, family: coin.family, slip44: coin.slip44,
    chainId: coin.chain === "ETH" ? 1 : coin.chain === "BSC" ? 56 : null,
    standard: coin.type === "token" ? "host-chain token (contract not catalogued)" : "native asset",
    contract: null, decimals: null,
    warning: "Offline registry convention only. Confirm the network and derivation path in your own wallet; no balances or transactions are fetched.",
  }];
}

export function coinOnNetwork(registry, coin, networkId) {
  const network = networksForCoin(registry, coin).find((item) => item.id === networkId);
  if (!network) throw new RangeError("Unknown network for the selected asset");
  if (!coin.derive) throw new Error(coin.reason || "Asset derivation unsupported");
  const row = {
    ...coin, chain: network.chain, family: network.family, slip44: network.slip44,
    path: defaultPath(network.family, network.slip44),
  };
  return { row, network };
}

export function deriveCoinNetwork(coins, registry, mnemonic, assetId, networkId, options = {}) {
  const coin = coins.find((item) => item.id === assetId);
  if (!coin) throw new RangeError("Unknown asset");
  const { row, network } = coinOnNetwork(registry, coin, networkId);
  // Network identity and script family are fixed by the curated row, not by
  // user-supplied purpose/path overrides. The viewer is receive-address-only.
  const { passphrase = "", account = 0, change = 0, index = 0 } = options;
  return {
    ...deriveCoin([row], mnemonic, { id: row.id }, { passphrase, account, change, index }),
    network,
  };
}
