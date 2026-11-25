/** Public TypeScript interface to the unchanged local JS derivation module.
 * No runtime implementation or new network/asset support is supplied here.
 */
export interface RegistryCoin {
  rank: number;
  id: string;
  symbol: string;
  name: string;
  type: "coin" | "token";
  chain: string | null;
  family: string | null;
  slip44: number | null;
  slip44Source: string | null;
  registryName: string | null;
  purpose: number | null;
  path: string | null;
  derive: boolean;
  reason: string | null;
}
export interface CoinSelector { id?: string; symbol?: string; rank?: number }
export interface CoinDerivationOptions {
  account?: number;
  change?: number;
  index?: number;
  purpose?: number;
  path?: string;
  passphrase?: string;
}
export interface CoinDerivation<T extends RegistryCoin = RegistryCoin> {
  coin: T;
  path: string;
  address: string;
  pubkeyHex: string;
  // The JS Ed25519 branch returns the original coin but omits this field.
  family?: string;
}
export function isEdFamily(family: string | null): boolean;
export function mnemonicToSeed(mnemonic: string, passphrase?: string): Uint8Array;
export function findCoin<T extends RegistryCoin>(coins: T[], selection?: CoinSelector): T | null;
export function searchCoins<T extends RegistryCoin>(coins: T[], query: string, limit?: number): T[];
export function deriveCoin<T extends RegistryCoin>(coins: T[], mnemonic: string, selection: CoinSelector, options?: CoinDerivationOptions): CoinDerivation<T>;
export function deriveCoinFromSeed<T extends RegistryCoin>(coin: T, seed: Uint8Array, options?: CoinDerivationOptions): CoinDerivation<T>;
