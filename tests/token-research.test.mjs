import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { networksForCoin } from "../js/coin-networks.js";
import { profileForCoin, isNativeAsset, researchedNetworks } from "../js/coin-research.js";
import { tokenReviewForNetwork, validateTokenResearch } from "../tools/token-research-evidence.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const json = (path) => JSON.parse(read(path));
const coins = json("config/coins-top500.json").assets, catalogue = json("config/token-networks.json");
const hosts = json("config/chain-research.json"), ledger = json("config/token-research.json");
const manifest = json(ledger.sourceManifest);
const validate = (l = ledger, m = manifest, c = catalogue) => validateTokenResearch(l, m, coins, c, hosts);
const network = (assetId, id) => ({ ...catalogue.assets[assetId].find((row) => row.id === id), environment: "mainnet" });

test("independent token source reviews start in registry order without closing any full acceptance gate", () => {
  assert.deepEqual(validate(), { assetsStarted: 2, deploymentTuples: 4, cataloguedTuples: 3, researchOnlyTuples: 1, acceptanceGatesClosed: 0 });
  const candidates = coins.filter((coin) => !isNativeAsset(profileForCoin(hosts, coin), coin));
  assert.deepEqual(ledger.order, candidates.slice(0, 2).map((coin) => coin.id));
  assert.deepEqual(ledger.order, ["usdt-tether", "usdc-usd-coin"]);
  assert.match(read(ledger.report), /not two completed token investigations/i);
});

test("token evidence matches the complete mainnet tuple and stable ID without ticker aliases", () => {
  for (const id of ["ethereum", "bsc", "tron"]) {
    const n = network("usdt-tether", id), match = tokenReviewForNetwork(ledger, "usdt-tether", n);
    assert.equal(match.networkId, id); assert.equal(match.contract, n.contract);
    assert.equal(match.runtime.status, "unqueried"); assert.equal(match.transferTax.currentBasisPoints, null);
    assert.equal(tokenReviewForNetwork(ledger, "USDT", n), null);
    assert.equal(tokenReviewForNetwork(ledger, "unknown-stable-id", n), null);
    assert.equal(tokenReviewForNetwork(ledger, "usdc-usd-coin", n), null);
  }
  const eth = network("usdt-tether", "ethereum");
  assert.ok(tokenReviewForNetwork(ledger, "usdt-tether", { ...eth, contract: eth.contract.toLowerCase() }));
  assert.equal(tokenReviewForNetwork(ledger, "usdt-tether", { ...eth, contract: "0x" + "0".repeat(40) }), null);
});

test("wrong host, network ID, chain ID, family, decimals and missing/test environments cannot borrow a review", () => {
  const eth = network("usdt-tether", "ethereum");
  for (const patch of [
    { hostChain: "BSC" }, { chain: "TRX" }, { id: "bsc" }, { id: "registry" },
    { chainId: 56 }, { chainId: null }, { family: "tron" }, { decimals: 18 },
    { decimals: undefined }, { environment: undefined }, { environment: "testnet" }, { contract: null },
  ]) assert.equal(tokenReviewForNetwork(ledger, "usdt-tether", { ...eth, ...patch }), null, JSON.stringify(patch));
  assert.equal(tokenReviewForNetwork(ledger, "usdt-tether", null), null);
  assert.equal(tokenReviewForNetwork({}, "usdt-tether", eth), null);
  const duplicate = structuredClone(ledger); duplicate.assets["usdt-tether"].deployments.push(duplicate.assets["usdt-tether"].deployments[0]);
  assert.equal(tokenReviewForNetwork(duplicate, "usdt-tether", eth), null, "ambiguity must fail closed");
});

test("Binance-peg identity and 18 decimals remain separate from issuer-listed Ethereum and TRON USDT", () => {
  const [eth, bsc, tron] = ledger.assets["usdt-tether"].deployments;
  assert.deepEqual([eth.decimals, bsc.decimals, tron.decimals], [6, 18, 6]);
  assert.equal(eth.representation, "issuer-listed"); assert.equal(tron.representation, "issuer-listed");
  assert.equal(bsc.representation, "custodial-peg"); assert.equal(bsc.backing.status, "operator-claim-only");
  assert.equal(bsc.identity.status, "operator-peg-plus-catalogue");
  assert.equal(tron.chainId, null); assert.equal(tron.controlReview.status, "not-reviewed");
  assert.equal(eth.controlReview.status, "abi-surface-only"); assert.equal(bsc.controlReview.status, "not-reviewed");
});

test("the Circle-listed USDC token proxy is research-only, not an implementation or an enabled balance-read mapping", () => {
  const [usdc] = ledger.assets["usdc-usd-coin"].deployments;
  assert.equal(usdc.contract, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  assert.equal(usdc.catalogue, "research-only"); assert.equal(usdc.controlReview.status, "pinned-reference-source-only");
  assert.equal(usdc.runtime.implementationAddress, null);
  assert.equal(catalogue.assets["usdc-usd-coin"], undefined);
  const coin = coins.find((row) => row.id === "usdc-usd-coin");
  assert.equal(networksForCoin(catalogue, coin)[0].contract, null);
  const enriched = researchedNetworks(coins, catalogue, hosts);
  for (const item of enriched.assets[coin.id]) {
    assert.equal(item.contract, null); assert.equal(item.decimals, null); assert.equal(item.tokenDeployment, "unverified");
  }
});

test("source observations cannot masquerade as raw-page digests, block anchors or independently verified reserves", () => {
  assert.equal(manifest.files.length, 13); assert.equal(manifest.unanchoredPages.length, 9);
  for (const page of manifest.unanchoredPages) { assert.equal(page.rawSha256, null); assert.equal(page.blockAnchor, null); }
  const circle = manifest.files.filter((source) => source.repo === "circlefin/stablecoin-evm");
  assert.equal(circle.length, 9);
  assert.ok(circle.every((source) => source.commit === "fc85788bc7c23cefe3df1a757133048bfddadeaa"));
  for (const asset of Object.values(ledger.assets)) for (const item of asset.deployments) {
    assert.equal(item.backing.independentlyVerified, false); assert.equal(item.runtime.blockHash, null);
    assert.equal(item.runtime.transactionTested, false); assert.equal(item.transferTax.currentBasisPoints, null);
  }
  assert.ok(manifest.rejectedAsPrimaryEvidence.some((item) => item.url === "https://github.com/tethercoin/USDT"));
});

test("ledger validation rejects drift, unsupported completion claims, bad source references and catalogue promotion", () => {
  const cases = [
    [(l) => { l.assets["usdt-tether"].closed = true; }, /false/],
    [(l) => { l.assets["usdt-tether"].symbol = "USDC"; }, /USDC/],
    [(l) => { l.order.reverse(); }, /deep/],
    [(l) => { l.assets["usdt-tether"].deployments[0].decimals = 18; }, /disagree/],
    [(l) => { l.assets["usdt-tether"].deployments[0].chainId = 56; }, /56/],
    [(l) => { l.assets["usdt-tether"].deployments[2].contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u"; }, /base58check/],
    [(l) => { l.assets["usdt-tether"].deployments[0].backing.independentlyVerified = true; }, /backing audit/],
    [(l) => { l.assets["usdt-tether"].deployments[0].transferTax.currentBasisPoints = 0; }, /deep/],
    [(l) => { l.assets["usdc-usd-coin"].deployments[0].runtime.blockNumber = 123; }, /deep/],
    [(l) => { l.assets["usdc-usd-coin"].deployments[0].identity.sourceIds = ["a-made-up-source"]; }, /unknown source/],
    [(l) => { l.assets["usdt-tether"].deployments.push(l.assets["usdt-tether"].deployments[0]); }, /disagree|duplicate/],
  ];
  for (const [change, expected] of cases) { const copy = structuredClone(ledger); change(copy); assert.throws(() => validate(copy), expected); }
  const changedCatalogue = structuredClone(catalogue);
  changedCatalogue.assets["usdc-usd-coin"] = [{ id: "ethereum" }];
  assert.throws(() => validate(ledger, manifest, changedCatalogue), /silently enable runtime reads/);
  const fakeDigest = structuredClone(manifest); fakeDigest.unanchoredPages[0].rawSha256 = "0".repeat(64);
  assert.throws(() => validate(ledger, fakeDigest), /not complete raw response digests/);
});

test("the separate evidence CI lane is bounded, read-only and cannot upload or deploy anything", () => {
  const workflow = read(".github/workflows/token-research-evidence.yml");
  assert.match(workflow, /contents: read/); assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /timeout-minutes: 5/);
  assert.match(workflow, /npm ci --ignore-scripts --no-audit --no-fund/);
  assert.match(workflow, /run: npm run check:coin-research/);
  assert.match(workflow, /run: node --test tests\/token-research\.test\.mjs tests\/coin-research\.test\.mjs tests\/coin-networks\.test\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|contents: write|upload-artifact|actions\/cache|continue-on-error|\|\| true|workflow_run/);
  const actions = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
  assert.equal(actions.length, 2);
  for (const action of actions) assert.match(action, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
});

test("report generation is offline, deterministic and never mutates market, host or runtime-network inputs", () => {
  const before = JSON.stringify({ ledger, manifest, coins, catalogue, hosts });
  validate(); tokenReviewForNetwork(ledger, "usdt-tether", network("usdt-tether", "bsc"));
  assert.equal(JSON.stringify({ ledger, manifest, coins, catalogue, hosts }), before);
  const result = spawnSync(process.execPath, ["tools/build-coin-research-inventory.mjs", "--check"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)), encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr + result.stdout); assert.match(result.stdout, /fresh/);
  const inventory = read("docs/coin-research-inventory-2026-11-17.md");
  assert.match(inventory, /2 stable asset IDs.*4 mainnet tuples/);
  assert.match(inventory, /0 complete token acceptance gates/);
  assert.equal(inventory.split("\n").filter((line) => /^\| \d+ \|/.test(line)).length, 500);
  assert.equal(Object.keys(catalogue.assets).length, 1, "source review does not silently expand the runtime catalogue");
  assert.equal(coins.filter((coin) => coin.derive).length, 347);
});
