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
  assert.equal(Object.keys(evidence.chains).length, 58);
  assert.equal(Object.values(evidence.chains).filter((p) => p.feeStatus === "primary-reviewed").length, 58);
  assert.equal(Object.values(evidence.chains).filter((p) => p.feeStatus === "pending").length, 0);
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
  const nearRecord = researchRecord(evidence, coin("NEAR"), main(coin("NEAR")));
  assert.equal(nearRecord.feeStatus, "primary-reviewed");
  assert.equal(nearRecord.feeAsset, "NEAR");
  assert.equal(nearRecord.identityStatus, "primary-reviewed");
  assert.match(nearRecord.feeFormula, /gas burned.*gas price/i);
  assert.match(nearRecord.feeFormula, /storage staking is separate/i);
  assert.equal(estimate("NEAR").amount, null, "reviewed formula is not a transaction-specific fee quote");
  const nearManual = feeEstimate(evidence, coin("NEAR"), main(coin("NEAR")), parseFeeScenario('{"nativeFees":{"near-near-protocol":0.0004}}'));
  assert.equal(nearManual.amount, 0.0004);
  assert.equal(nearManual.live, false);
  assert.match(nearManual.basis, /user-entered/);
  assert.match(estimate("XNO").basis, /PoW\/service costs excluded/);
  assert.equal(coin("XNO").derive, false, "feeless does not enable an unsupported derivation");
  assert.equal(researchRecord(evidence, coin("usdt-tether"), main(coin("usdt-tether"))).native, false);
  for (const id of ["THETA", "TFUEL"]) {
    const record = researchRecord(evidence, coin(id), main(coin(id)));
    assert.equal(record.native, true, "Theta has two native assets, distinct from TNT tokens");
    assert.equal(record.feeAsset, "TFUEL");
    assert.equal(estimate(id).amount, null, "native does not imply a fixed transfer fee");
  }
});

test("round 83 closes exactly the 43 pending host models with reproducible evidence, not live quotes", () => {
  const pending = "ZEC DOGE BCH LTC NEAR AVAX CRO FTM ETC DASH ATOM VET INJ FLR LUNC XDC BSV PLS SEI TIA THETA KAIA RUNE AKT XEC QTUM DGB DYDX WEMIX RSK ISLM KAVA PEAQ KUB XVG 0G AXL RON RVN BAND LUNA MERLIN HECO".split(" ");
  assert.deepEqual(evidence.feeReviewBatch.previouslyPending, pending);
  assert.deepEqual(evidence.feeReviewBatch.addedProfiles, ["CRONOS_EVM"]);
  const report = readFileSync(new URL(`../${evidence.feeReviewBatch.report}`, import.meta.url), "utf8");
  for (const [i, key] of pending.entries()) {
    const profile = evidence.chains[key];
    assert.match(report, new RegExp(`### ${i + 1}\\. ${key} —`));
    assert.equal(profile.feeStatus, "primary-reviewed");
    assert.notEqual(profile.feeModel, "unknown");
    assert.ok(profile.feeAsset && profile.feeFormula);
    assert.ok(profile.sources.some((s) => s.kind === "fees" && s.url.startsWith("https://")), key);
    assert.equal(profile.feeReview.parameterState, "unqueried");
    assert.equal(profile.feeReview.transactionTested, false);
    assert.equal(profile.nativeBaseFee, undefined, "review does not invent a constant fee");
    for (const row of coins.filter((c) => profileForCoin(evidence, c) === profile)) {
      assert.equal(estimate(row.id).amount, null, `${key} must remain transaction-specific`);
    }
  }
  const manifest = JSON.parse(readFileSync(new URL(`../${evidence.feeReviewBatch.sourceManifest}`, import.meta.url)));
  assert.equal(manifest.files.length, 46);
  for (const source of manifest.files) {
    assert.match(source.commit, /^[0-9a-f]{40}$/);
    assert.match(source.sha256, /^[0-9a-f]{64}$/);
    assert.ok(source.url.includes(`/blob/${source.commit}/${source.path}`));
    assert.ok(source.bytes > 0 && source.lines > 0);
  }
  assert.equal(evidence.chains.HECO.operationalStatus, "unverified-historical");
});

test("ambiguous CRO defaults get separate research profiles without rewriting paths or explicit token networks", () => {
  const cro = coin("CRO"), vvs = coin("VVS");
  assert.equal(main(cro).hostChain, "CRO"); assert.equal(main(cro).family, "cosmos");
  assert.equal(main(cro).chainId, null);
  assert.equal(main(vvs).hostChain, "CRONOS_EVM"); assert.equal(main(vvs).family, "evm");
  assert.equal(main(vvs).chainId, 25);
  assert.equal(main(vvs).chain, "CRO", "historical derivation host code remains unchanged");
  assert.equal(vvs.path, "m/44'/60'/0'/0/0");
  assert.equal(cro.path, "m/44'/394'/0'/0/0");
  assert.equal(main(vvs).rpc, ""); assert.equal(main(vvs).balanceAdapter, null);
  assert.equal(researchRecord(evidence, vvs, main(vvs)).native, false);
  const explicit = { assets: { [vvs.id]: [{ ...main(vvs), id: "different-explicit-host", chain: "ETH" }] } };
  assert.equal(researchedNetworks([vvs], explicit, evidence).assets[vvs.id][0].hostChain, "ETH");
});

test("non-universal fee rules retain their own model, asset, and limitations", () => {
  assert.equal(evidence.chains.VET.feeAsset, "VTHO");
  assert.equal(evidence.chains.RSK.feeAsset, "RBTC");
  assert.equal(evidence.chains.MERLIN.feeAsset, "BTC");
  assert.deepEqual(evidence.chains.DYDX.feeAssets, ["DYDX", "USDC"]);
  for (const key of ["AVAX", "FLR", "0G"]) assert.equal(evidence.chains[key].feeModel, "gas-charged-floor");
  assert.match(evidence.chains.AVAX.feeFormula, /gasLimit \/ 2/);
  assert.match(evidence.chains["0G"].feeFormula, /80 \/ 100/);
  assert.match(evidence.chains.XVG.feeFormula, /999/);
  assert.match(evidence.chains.XEC.feeFormula, /100 internal satoshi units = 1 XEC/);
  assert.ok(evidence.chains.XEC.sources.some((source) => source.url.endsWith('/src/consensus/amount.cpp')));
  assert.match(evidence.chains.LUNC.feeFormula, /tax/);
  assert.match(evidence.chains.QTUM.feeFormula, /nGasFee/);
  assert.match(evidence.chains.RUNE.feeFormula, /native_tx_fee_rune/);
  for (const id of ["AVAX", "FLR", "0G", "QTUM", "XVG", "VVS"]) {
    assert.equal(estimate(id, JSON.stringify({ gasGwei: { [coin(id).chain]: 1 } })).amount, null, "no generic Ethereum gas shortcut");
  }
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
  const sol = networksForCoin(networks, coin("SOL"));
  assert.equal(main(coin("SOL")).expectedGenesisHash, "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d");
  assert.equal(sol.find((n) => n.id === "solana-devnet").expectedGenesisHash, "GH7ome3EiwEr7tu9JuTh2dpYWBJK3z69Xm1ZE3MEE6JC");
  assert.equal(sol.find((n) => n.id === "solana-testnet").expectedGenesisHash, "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY");
  const stellar = networksForCoin(networks, coin("XLM"));
  assert.equal(main(coin("XLM")).expectedNetworkPassphrase, "Public Global Stellar Network ; September 2015");
  assert.equal(stellar.find((n) => n.id === "stellar-testnet").expectedNetworkPassphrase, "Test SDF Network ; September 2015");
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
  assert.equal(avaxNative.amount, null, "gas price alone cannot determine charged gas or its protocol floor");
  const hypotheticalAvaxHost = { ...main(coin("usdt-tether")), id: "hypothetical-avax", hostChain: "AVAX", chain: "AVAX", feeAsset: "AVAX" };
  assert.equal(feeEstimate(evidence, coin("usdt-tether"), hypotheticalAvaxHost, avaxScenario).amount, null, "tokenGas must not silently bypass a protocol floor model");
  const chargedTotal = parseFeeScenario('{"prices":{"AVAX":40},"nativeFees":{"avax-avalanche":0.00126,"usdt-tether@hypothetical-avax":0.00126}}');
  const explicitAvax = feeEstimate(evidence, coin("AVAX"), main(coin("AVAX")), chargedTotal);
  assert.equal(explicitAvax.amount, 0.00126); assert.equal(explicitAvax.usd, 0.0504); assert.match(explicitAvax.basis, /user-entered/);
  const hypotheticalTokenCost = feeEstimate(evidence, coin("usdt-tether"), hypotheticalAvaxHost, chargedTotal);
  assert.equal(hypotheticalTokenCost.amount, 0.00126); assert.equal(hypotheticalTokenCost.usd, 0.0504);
  assert.equal(hypotheticalTokenCost.live, false, "explicit-total fixture is not evidence of an Avalanche USDT deployment");
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
