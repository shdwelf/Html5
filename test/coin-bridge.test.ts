import { describe, expect, it } from "vitest";
import { COINS, REGISTRY_META, deriveAddress } from "../src/lib/coins";
import { deriveCoin } from "../js/coins.js";

// Published BIP-39 test vector only; never an owner mnemonic or funded key.
const phrase = "abandon ".repeat(11) + "about";
describe("typed public-only coin bridge", () => {
  it("uses the real historical snapshot fields instead of an invented built date", () => {
    expect(REGISTRY_META.marketSnapshot).toBe("2026-09-11");
    expect(REGISTRY_META.assets).toBe(COINS.length);
    expect(REGISTRY_META.derivable).toBe(COINS.filter((coin) => coin.derive).length);
    expect(Object.prototype.hasOwnProperty.call(REGISTRY_META, "built")).toBe(false);
  });
  it("preserves existing Ethereum address/path/public bytes", () => {
    const coin = COINS.find((item) => item.symbol === "ETH")!;
    const publicResult = deriveAddress(coin.id, phrase);
    expect(publicResult.address).toBe("0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
    expect(publicResult.path).toBe("m/44'/60'/0'/0/0");
    expect(publicResult.family).toBe("evm");
    expect(Object.keys(publicResult).sort()).toEqual(["address", "family", "path", "pubkeyHex"]);
  });
  it("reports the original Ed25519 row family without changing derivation or dropping public metadata", () => {
    const coin = COINS.find((item) => item.symbol === "SOL")!;
    const raw = deriveCoin(COINS, phrase, { id: coin.id });
    expect(raw.family).toBeUndefined();
    const bridged = deriveAddress(coin.id, phrase);
    expect(bridged.family).toBe("sol");
    expect(bridged.address).toBe(raw.address); expect(bridged.path).toBe(raw.path);
    expect(bridged.pubkeyHex).toBe(raw.pubkeyHex);
    expect(Object.keys(bridged).sort()).toEqual(["address", "family", "path", "pubkeyHex"]);
  });
});
