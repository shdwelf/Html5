// Typed bridge between the React app and the zero-dependency wallet stack
// (js/*.js + config/coins-top500.json). Derivation runs fully offline in
// the browser; nothing here touches the network.
import registry from "../../config/coins-top500.json";
import { findCoin, searchCoins, deriveCoin, type RegistryCoin } from "../../js/coins.js";

export type CoinRow = RegistryCoin;

export interface DerivedAddress {
  address: string;
  path: string;
  family: string;
  pubkeyHex: string;
}

export const COINS: CoinRow[] = registry.assets as CoinRow[];
export const REGISTRY_META = registry._meta;

export function searchRegistry(q: string, limit = 50): CoinRow[] {
  return searchCoins(COINS, q, limit) as CoinRow[];
}

export function getCoin(id: string): CoinRow | null {
  return findCoin(COINS, { id }) as CoinRow | null;
}

export function deriveAddress(
  coinId: string,
  mnemonic: string,
  opts: {
    account?: number;
    change?: number;
    index?: number;
    passphrase?: string;
    purpose?: number;
  } = {}
): DerivedAddress {
  const r = deriveCoin(COINS, mnemonic.trim(), { id: coinId }, opts);
  const family = r.family ?? r.coin.family;
  if (!family) throw new Error("Derived address has no declared encoding family");
  return {
    address: r.address,
    path: r.path,
    family,
    pubkeyHex: r.pubkeyHex,
  };
}

/** Offline simulator seeds: top-10 snapshot prices, 2026-09-11. */
export const MARKET_SEEDS: { symbol: string; name: string; price: number }[] = [
  { symbol: "BTC", name: "Bitcoin", price: 77884 },
  { symbol: "ETH", name: "Ethereum", price: 2579.48 },
  { symbol: "USDT", name: "Tether", price: 0.9998 },
  { symbol: "BNB", name: "BNB", price: 731.51 },
  { symbol: "XRP", name: "XRP", price: 1.376 },
  { symbol: "USDC", name: "USD Coin", price: 0.9999 },
  { symbol: "SOL", name: "Solana", price: 102.27 },
  { symbol: "TRX", name: "Tron", price: 0.336 },
  { symbol: "STETH", name: "Lido Staked Ether", price: 2574.88 },
  { symbol: "ZEC", name: "Zcash", price: 1177.99 },
];
