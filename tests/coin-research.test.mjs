import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import { networksForCoin, coinOnNetwork, deriveCoinNetwork } from "../js/coin-networks.js";
import { profileForCoin, researchedNetworks, researchRecord, feeEstimate, parseFeeScenario, compareFeeEstimates } from "../js/coin-research.js";
import { mnemonicToSeed, deriveCoinFromSeed } from "../js/coins.js";
import { deriveInvestigations } from "../js/wallet-investigation.js";
import { segwitDecode, toHex } from "../js/codec.js";
import { hash160 } from "../js/hash.js";

const load = (name) => JSON.parse(readFileSync(new URL(`../config/${name}.json`, import.meta.url)));
const coins = load("coins-top500").assets, evidence = load("chain-research"), original = load("token-networks");
const networks = researchedNetworks(coins, original, evidence);
const coin = (id) => coins.find((row) => row.id === id || row.symbol === id);
const main = (row) => networksForCoin(networks, row).find((n) => n.environment === "mainnet");
const estimate = (id, scenario = "{}") => feeEstimate(evidence, coin(id), main(coin(id)), parseFeeScenario(scenario));
const ABANDON = "abandon ".repeat(11) + "about";

test("all 500 historical assets have explicit evidence gaps, never fabricated free costs", () => {
  assert.equal(coins.length, 500);
  assert.equal(Object.keys(evidence.chains).length, 57);
  assert.equal(Object.values(evidence.chains).filter((p) => p.feeStatus === "primary-reviewed").length, 17);
  const ids = new Set(coins.map((row) => row.id));
  for (const profile of Object.values(evidence.chains)) for (const id of profile.nativeAssetIds) assert.ok(ids.has(id), id);
  for (const row of coins) {
    const record = researchRecord(evidence, row, main(row)), cost = estimate(row.id);
    assert.equal(record.id, row.id);
    assert.equal(record.links.length, 4);
    assert.ok(record.assetReview && record.feeFormula && record.feeStatus);
    assert.equal(cost.live, false);
    if (cost.usd === 0) assert.equal(row.symbol, "XNO");
    if (!profileForCoin(evidence, row)) assert.equal(cost.amount, null);
  }
  assert.equal(estimate("XNO").amount, 0);
  assert.equal(estimate("LTC", '{"vbytes":140,"satPerVbyte":2}').amount, null, "Litecoin does not reuse Bitcoin's vbyte scenario without a dedicated model");
  assert.equal(estimate("DOGE", '{"vbytes":140,"satPerVbyte":2}').amount, null, "Dogecoin's rate-based policy is not the Bitcoin vbyte scenario");
  assert.equal(researchRecord(evidence, coin("DOGE"), main(coin("DOGE"))).feeAsset, "DOGE");
  assert.equal(researchRecord(evidence, coin("DOGE"), main(coin("DOGE"))).identityStatus, "pending");
  assert.equal(researchRecord(evidence, coin("LTC"), main(coin("LTC"))).feeAsset, "LTC");
  assert.equal(researchRecord(evidence, coin("LTC"), main(coin("LTC"))).identityStatus, "pending", "fee mechanics review is separate from chain identity review");
  assert.match(estimate("XNO").basis, /PoW\/service costs excluded/);
  assert.equal(coin("XNO").derive, false, "feeless does not enable an unsupported derivation");
  assert.equal(researchRecord(evidence, coin("usdt-tether"), main(coin("usdt-tether"))).native, false);
  assert.equal(researchRecord(evidence, coin("TFUEL"), main(coin("TFUEL"))).native, false, "same host != primary native transfer asset");
});

test("reviewed host test identities never inherit a mainnet token contract", () => {
  const tests = Object.values(evidence.chains).flatMap((p) => p.testnets);
  assert.equal(tests.length, 18);
  assert.equal(new Set(tests.map((n) => n.id)).size, tests.length);
  for (const n of tests) { assert.equal(n.identityStatus, "primary-reviewed"); assert.ok(n.source.startsWith("https://")); }
  const usdt = networksForCoin(networks, coin("usdt-tether"));
  assert.equal(usdt.filter((n) => n.environment === "mainnet").length, 3);
  assert.equal(usdt.filter((n) => n.environment === "testnet").length, 4);
  for (const n of usdt.filter((n) => n.environment === "testnet")) {
    assert.equal(n.contract, null); assert.equal(n.decimals, null);
    assert.equal(n.tokenDeployment, "unverified"); assert.match(n.name, /host only/);
    assert.equal(feeEstimate(evidence, coin("usdt-tether"), n).usd, null);
  }
  assert.equal(original.assets["usdt-tether"].length, 3, "input registry was not mutated");
  const mon = networksForCoin(networks, coin("MON")).find((n) => n.id === "monad-testnet");
  assert.equal(mon.chainId, 10143);
});

test("Bitcoin testnet4 and signet use coin type 1 / tb while mainnet is unchanged", () => {
  const btc = coin("BTC");
  const native = deriveCoinNetwork(coins, networks, ABANDON, btc.id, "registry");
  assert.ok(native.address.startsWith("bc1")); assert.equal(native.path, "m/84'/0'/0'/0/0");
  const tests = networksForCoin(networks, btc).filter((n) => n.environment === "testnet");
  const seed = mnemonicToSeedSync(ABANDON);
  const oracle = HDKey.fromMasterSeed(seed).derive("m/84'/1'/0'/0/0");
  try {
    for (const n of tests) {
      const { row } = coinOnNetwork(networks, btc, n.id);
      assert.equal(row.chain, "BTC_TEST"); assert.equal(row.slip44, 1);
      const result = deriveCoinNetwork(coins, networks, ABANDON, btc.id, n.id);
      assert.equal(result.path, "m/84'/1'/0'/0/0");
      assert.equal(result.pubkeyHex, toHex(oracle.publicKey));
      const decoded = segwitDecode(result.address);
      assert.equal(decoded.hrp, "tb");
      assert.deepEqual(decoded.program, hash160(oracle.publicKey));
    }
  } finally { oracle.wipePrivateData(); seed.fill(0); }
});

test("fee ranking compares USD scenarios, not SOL/XRP/ETH native magnitudes", () => {
  assert.equal(estimate("ETH").amount, null);
  assert.equal(estimate("SOL").amount, 0.000005);
  assert.equal(estimate("XRP").amount, 0.00001);
  assert.equal(estimate("XLM").amount, 0.00001);
  assert.equal(estimate("MON").amount, 0.0021);
  assert.equal(estimate("SOL").usd, null);
  const s = parseFeeScenario('{"prices":{"ETH":2000,"SOL":100,"XRP":1},"gasGwei":{"ETH":12},"tokenGas":{"usdt-tether":65000},"vbytes":140,"satPerVbyte":2}');
  const eth = feeEstimate(evidence, coin("ETH"), main(coin("ETH")), s);
  assert.equal(eth.amount, 0.000252); assert.equal(eth.usd, 0.504);
  const avaxScenario = parseFeeScenario('{"prices":{"AVAX":40},"gasGwei":{"AVAX":30},"tokenGas":{"avax-avalanche":42000,"usdt-tether":42000}}');
  const avaxNative = feeEstimate(evidence, coin("AVAX"), main(coin("AVAX")), avaxScenario);
  assert.equal(avaxNative.amount, 0.00063); assert.equal(avaxNative.usd, 0.0252);
  assert.match(avaxNative.basis, /user-entered 30 gwei/);
  const hypotheticalAvaxHost = { ...main(coin("usdt-tether")), id: "hypothetical-avax", hostChain: "AVAX", chain: "AVAX", feeAsset: "AVAX" };
  const hypotheticalTokenCost = feeEstimate(evidence, coin("usdt-tether"), hypotheticalAvaxHost, avaxScenario);
  assert.equal(hypotheticalTokenCost.amount, 0.00126); assert.equal(hypotheticalTokenCost.usd, 0.0504);
  assert.equal(hypotheticalTokenCost.live, false, "arithmetic fixture is not evidence of an Avalanche USDT deployment");
  assert.equal(feeEstimate(evidence, coin("usdt-tether"), main(coin("usdt-tether")), s).amount, 0.00078);
  assert.equal(feeEstimate(evidence, coin("BTC"), main(coin("BTC")), s).amount, 0.0000028);
  const sorted = ["ETH", "XNO", "BTC", "SOL", "XRP"].map((id) => ({ coin: coin(id), estimate: feeEstimate(evidence, coin(id), main(coin(id)), s) })).sort(compareFeeEstimates);
  assert.deepEqual(sorted.map(({ coin }) => coin.symbol), ["XNO", "XRP", "SOL", "ETH", "BTC"]);
  assert.equal(estimate("usdt-tether", '{"gasGwei":{"ETH":12}}').amount, null, "no default native gas for tokens");
  assert.equal(estimate(coins.find((c) => c.chain === "BASE").id).amount, null, "rollup fee cannot silently omit parent-data component");
});

test("manual zero is explicit; scenario parser rejects arbitrary code and numeric abuse", () => {
  const e = estimate("ETH", '{"nativeFees":{"eth-ethereum":0}}');
  assert.equal(e.usd, 0); assert.match(e.basis, /user-entered/);
  for (const text of ["[]", "null", '{"url":"https://evil.test"}', '{"prices":{"ETH":0}}', '{"nativeFees":{"x":-1}}', '{"gasGwei":{"ETH":"12"}}', '{"vbytes":1e99}', 'x'.repeat(32769)]) assert.throws(() => parseFeeScenario(text));
  assert.throws(() => parseFeeScenario(JSON.stringify({ prices: Object.fromEntries(Array.from({ length: 1001 }, (_, i) => [i, 1])) })));
  assert.throws(() => estimate("usdt-tether", '{"gasGwei":{"ETH":1e15},"tokenGas":{"usdt-tether":1e15}}'), /numeric range/);
});

test("seed API is equivalent to mnemonic wrapper, bounded and public-output-only", () => {
  const row = coin("ETH"), seed = mnemonicToSeed(ABANDON);
  try {
    const r = deriveCoinFromSeed(row, seed);
    assert.equal(r.address, "0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
    assert.deepEqual(Object.keys(r).sort(), ["address", "coin", "family", "path", "pubkeyHex"]);
    assert.ok(seed.some((b) => b !== 0), "caller-owned seed is not mutated prematurely");
    for (const index of [-1, 0x80000000, 0.5]) assert.throws(() => deriveCoinFromSeed(row, seed, { index }), /31-bit/);
    assert.throws(() => deriveCoinFromSeed(row, seed.slice(0, 32)), /64-byte/);
  } finally { seed.fill(0); }
});

test("500 default leaves derive locally with shared results and every holding unqueried", async () => {
  let yields = 0;
  const rows = await deriveInvestigations(coins, networks, ABANDON, { yieldControl: async () => { yields++; } });
  assert.equal(rows.length, 500);
  assert.equal(rows.filter((r) => r.status === "derived").length, 347);
  assert.equal(rows.filter((r) => r.status === "unsupported").length, 153);
  assert.equal(rows.filter((r) => r.status === "error").length, 0);
  assert.ok(yields < 65 && yields > 20, `${yields} unique derivation tuples`);
  assert.ok(rows.every((r) => r.holdings.status === "unqueried"));
  const json = JSON.stringify(rows);
  assert.ok(!json.includes(ABANDON) && !/"(?:seed|priv|privateKey|mnemonic)"/.test(json));
  assert.equal(rows.find((r) => r.id === "usdt-tether").address, rows.find((r) => r.id === "eth-ethereum").address);
  assert.equal(rows.find((r) => r.id === "trx-tron").address, "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH");
});

test("batch rejects non-standard/checksum-invalid phrases and yields to cancellation", async () => {
  await assert.rejects(deriveInvestigations(coins, networks, "abandon ".repeat(12).trim()), /checksum-valid/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(deriveInvestigations(coins, networks, ABANDON, { signal: controller.signal }), { name: "AbortError" });
  const running = new AbortController(); let yielded = 0;
  await assert.rejects(deriveInvestigations(coins, networks, ABANDON, { signal: running.signal, yieldControl: async () => { yielded++; running.abort(); } }), { name: "AbortError" });
  assert.equal(yielded, 1);
});
