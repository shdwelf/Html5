import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { networksForCoin, coinOnNetwork, deriveCoinNetwork } from "../js/coin-networks.js";
import { ECDH } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { deriveCoin, findCoin, searchCoins, mnemonicToSeed } from "../js/coins.js";
import { eip55 } from "../js/codec.js";

const coins = JSON.parse(readFileSync(new URL("../config/coins-top500.json", import.meta.url), "utf8")).assets;
const registry = JSON.parse(readFileSync(new URL("../config/token-networks.json", import.meta.url), "utf8"));
const phrase = "abandon ".repeat(11) + "about";
const usdt = findCoin(coins, { id: "usdt-tether" });

test("network identities are separate from the unchanged market-rank snapshot", () => {
  assert.equal(coins.length, 500);
  assert.equal(coins.filter((row) => row.id === usdt.id).length, 1);
  assert.equal(registry.schema, "html5-token-networks-v1");
  assert.deepEqual(networksForCoin(registry, usdt).map((row) => row.id), ["ethereum", "bsc", "tron"]);
  assert.equal(usdt.chain, "ETH", "historical row remains Ethereum-only");
  for (const row of registry.assets[usdt.id]) {
    assert.match(row.source, /trustwallet\/assets\/blob\/5c8eba81275e50843ef7df1899161c8b65852dba/);
    assert.match(row.warning, /network|TRON/);
    if (row.family === "evm") assert.equal(eip55(row.contract), row.contract);
  }
  const [, bsc, tron] = registry.assets[usdt.id];
  assert.equal(bsc.chainId, 56);
  assert.equal(bsc.slip44, 60, "chain ID 56 and retired Beacon coin type 714 are not the deployed path");
  assert.equal(bsc.contract, "0x55d398326f99059fF775485246999027B3197955");
  assert.equal(bsc.decimals, 18);
  assert.match(bsc.warning, /pegged representation/);
  assert.equal(tron.slip44, 195);
  assert.equal(tron.chainId, null, "do not invent an EVM chain ID for TRON");
  assert.equal(tron.decimals, 6);
  assert.equal(registry.assets[usdt.id][0].decimals, 6);
  assert.deepEqual(networksForCoin(registry, null), []);
});

test("BEP-20 USDT derives the holder's EVM address, never the contract", () => {
  const eth = deriveCoinNetwork(coins, registry, phrase, usdt.id, "ethereum");
  const bsc = deriveCoinNetwork(coins, registry, phrase, usdt.id, "bsc");
  assert.equal(bsc.path, "m/44'/60'/0'/0/0");
  assert.equal(bsc.address, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
  assert.equal(eth.address, bsc.address);
  assert.equal(eth.pubkeyHex, bsc.pubkeyHex);
  const reference = HDKey.fromMasterSeed(mnemonicToSeedSync(phrase)).derive(bsc.path);
  assert.equal(bsc.pubkeyHex, Buffer.from(reference.publicKey).toString("hex"));
  const uncompressed = ECDH.convertKey(reference.publicKey, "secp256k1", undefined, undefined, "uncompressed");
  const referencePayload = Buffer.from(keccak_256(uncompressed.subarray(1))).subarray(-20).toString("hex");
  assert.equal(bsc.address.toLowerCase(), "0x" + referencePayload);
  assert.notEqual(bsc.address, bsc.network.contract);
  assert.equal(bsc.coin.chain, "BSC");
  assert.equal(eth.coin.chain, "ETH");
  assert.deepEqual(Object.keys(bsc).sort(), ["address", "coin", "family", "network", "path", "pubkeyHex"]);
  assert.equal(usdt.chain, "ETH", "network selection must not mutate the shared market row");
});

test("TRC-20 uses the TRON holder path and encoding", () => {
  const tron = deriveCoinNetwork(coins, registry, phrase, usdt.id, "tron");
  const native = deriveCoin(coins, phrase, { symbol: "TRX" });
  assert.equal(tron.path, "m/44'/195'/0'/0/0");
  assert.equal(tron.address, "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH");
  assert.equal(tron.address, native.address);
  const reference = HDKey.fromMasterSeed(mnemonicToSeedSync(phrase)).derive(tron.path);
  assert.equal(tron.pubkeyHex, Buffer.from(reference.publicKey).toString("hex"));
  assert.notEqual(tron.address, tron.network.contract);
});

test("network receive derivation retains passphrase/leaf choice but ignores path/purpose overrides", () => {
  const options = { passphrase: "TREZOR", account: 1, change: 0, index: 2, purpose: 84, path: "m/0'" };
  const result = deriveCoinNetwork(coins, registry, phrase, usdt.id, "bsc", options);
  assert.equal(result.path, "m/44'/60'/1'/0/2");
  assert.equal(result.address, deriveCoin(coins, phrase, { symbol: "ETH" }, { passphrase: "TREZOR", account: 1, index: 2 }).address);
  assert.notEqual(result.address, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
});

test("BIP-39 Unicode passphrase NFKD matches the independent scure implementation", () => {
  const composed = mnemonicToSeed(phrase, "caf\u00e9");
  const decomposed = mnemonicToSeed(phrase, "cafe\u0301");
  assert.deepEqual(composed, decomposed);
  assert.deepEqual(composed, mnemonicToSeedSync(phrase, "caf\u00e9"));
});

test("all existing asset families retain their default path; unknown/unsupported choices fail closed", () => {
  for (const coin of coins.filter((row) => row.derive)) {
    const networkId = networksForCoin(registry, coin)[0].id;
    assert.equal(coinOnNetwork(registry, coin, networkId).row.path, coin.path, coin.id);
  }
  const unsupported = coins.find((coin) => !coin.derive);
  assert.throws(() => coinOnNetwork(registry, unsupported, "registry"), /./);
  assert.throws(() => coinOnNetwork(registry, usdt, "bbep20"), /Unknown network/);
  assert.throws(() => deriveCoinNetwork(coins, registry, phrase, "missing", "bsc"), /Unknown asset/);
  assert.throws(() => deriveCoinNetwork(coins, registry, phrase, usdt.id, "unknown"), /Unknown network/);
  const tail = coins.at(-1);
  assert.ok(searchCoins(coins, tail.id, coins.length).some((coin) => coin.id === tail.id));
});

test("coin-registry freshness uses source snapshots, not the current wall clock", () => {
  const path = new URL("../config/coins-top500.json", import.meta.url);
  const meta = JSON.parse(readFileSync(path, "utf8"))._meta;
  assert.equal(meta.marketSnapshot, "2026-09-11");
  assert.equal(meta.slip44Snapshot, "2026-09-11");
  assert.equal(meta.built, undefined);
  const clock = "const D=Date;globalThis.Date=class extends D{constructor(...args){super(...(args.length?args:['2040-01-01T00:00:00Z']))}static now(){return 2208988800000}}";
  const result = spawnSync(process.execPath, [
    "--import", "data:text/javascript," + encodeURIComponent(clock),
    "tools/build_coins.mjs", "--check",
  ], { cwd: fileURLToPath(new URL("../", import.meta.url)), encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /500 assets, 347 derivable/);
});
