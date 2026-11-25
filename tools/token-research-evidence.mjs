/** Offline evidence bookkeeping only. NOT imported by a balance reader, signer
 * or network catalogue. A match is not permission to read/send or proof of a
 * deployed implementation, current transfer tax, reserves or redeemability.
 */
import assert from "node:assert/strict";
import { base58CheckDecode, eip55 } from "../js/codec.js";
import { isNativeAsset, profileForCoin } from "../js/coin-research.js";

const contractId = (family, value) => typeof value === "string"
  ? family === "evm" && /^0x[0-9a-fA-F]{40}$/.test(value) ? value.toLowerCase() : family === "tron" ? value : null
  : null;

/** Match the entire mainnet tuple and stable asset ID, never a symbol, host
 * address, implementation or a mainnet contract copied onto a test network.
 * Ambiguous duplicate evidence fails closed; this does not enable a mapping.
 */
export function tokenReviewForNetwork(ledger, assetId, network) {
  if (ledger?.schema !== "html5-token-research-v1" || typeof assetId !== "string" || network?.environment !== "mainnet") return null;
  const asset = Object.hasOwn(ledger.assets || {}, assetId) ? ledger.assets[assetId] : null;
  if (asset?.status !== "source-reviewed-runtime-open" || asset.closed !== false || !Array.isArray(asset.deployments)) return null;
  const contract = contractId(network.family, network.contract);
  if (!contract) return null;
  const matches = asset.deployments.filter((item) => item.environment === "mainnet"
    && item.networkId === network.id && item.hostChain === (network.hostChain || network.chain)
    && item.family === network.family && item.chainId === network.chainId
    && item.decimals === network.decimals && contractId(item.family, item.contract) === contract);
  return matches.length === 1 ? matches[0] : null;
}

/** Reject overstated/mismatched research before generating the 500-row report.
 * V1 deliberately cannot label any token's complete acceptance gate closed.
 */
export function validateTokenResearch(ledger, manifest, coins, catalogue, hosts) {
  assert.equal(ledger.schema, "html5-token-research-v1");
  assert.match(ledger.reviewed, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(manifest.schema, "html5-token-identity-source-review-v1");
  assert.equal(manifest.reviewed, ledger.reviewed);
  assert.equal(ledger.sourceManifest, "docs/research/token-identity-source-manifest-2026-11-17.json");
  assert.equal(ledger.report, "docs/token-identity-review-round-84-2026-11-17.md");
  const sources = new Map();
  const register = (source) => {
    assert.match(source.id, /^[a-z][a-z0-9-]{1,63}$/);
    assert.ok(!sources.has(source.id), "duplicate source ID");
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:"); assert.equal(url.username, ""); assert.equal(url.password, "");
    sources.set(source.id, source);
  };
  for (const file of manifest.files) {
    register(file);
    assert.ok(["publisher-source", "secondary-catalogue"].includes(file.publisherKind));
    assert.match(file.repo, /^[\w-]+\/[\w.-]+$/);
    assert.match(file.commit, /^[a-f0-9]{40}$/); assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(file.bytes) && file.bytes > 0);
    assert.ok(Number.isSafeInteger(file.lines) && file.lines > 0);
    assert.equal(file.url, `https://github.com/${file.repo}/blob/${file.commit}/${file.path}`);
    assert.ok(!file.path.split("/").some((part) => part === ".."));
  }
  for (const page of manifest.unanchoredPages) {
    register(page);
    assert.equal(page.rawSha256, null, "page observations are not complete raw response digests");
    assert.equal(page.blockAnchor, null, "mutable pages do not establish a chain block anchor");
    assert.ok(page.excerpts.length && page.excerpts.every((text) => typeof text === "string" && text.length));
    assert.ok(page.limitation && page.retrieval);
  }
  const refs = (evidence) => {
    assert.ok(Array.isArray(evidence.sourceIds) && evidence.sourceIds.length, "evidence needs source IDs");
    assert.equal(new Set(evidence.sourceIds).size, evidence.sourceIds.length);
    for (const id of evidence.sourceIds) assert.ok(sources.has(id), `unknown source ID: ${id}`);
    return evidence.sourceIds.map((id) => sources.get(id));
  };
  assert.deepEqual(ledger.order, Object.keys(ledger.assets));
  assert.equal(new Set(ledger.order).size, ledger.order.length);
  let lastRank = 0, tuples = 0, catalogued = 0, researchOnly = 0;
  const seen = new Set();
  for (const id of ledger.order) {
    const asset = ledger.assets[id], coin = coins.find((row) => row.id === id);
    assert.ok(coin, `unknown stable registry ID: ${id}`);
    assert.ok(!isNativeAsset(profileForCoin(hosts, coin), coin), "native host evidence is a separate lane");
    assert.equal(asset.symbol, coin.symbol); assert.equal(asset.historicalRank, coin.rank);
    assert.ok(coin.rank > lastRank, "source-review order must follow the historical registry"); lastRank = coin.rank;
    assert.equal(asset.status, "source-reviewed-runtime-open"); assert.equal(asset.closed, false);
    assert.ok(Array.isArray(asset.openGates) && asset.openGates.length > 0);
    assert.ok(Array.isArray(asset.deployments) && asset.deployments.length > 0);
    for (const item of asset.deployments) {
      tuples++;
      assert.match(item.networkId, /^[a-z][a-z0-9-]*$/);
      assert.equal(item.environment, "mainnet", "test deployments require independent evidence and schema support");
      const host = hosts.chains[item.hostChain]; assert.ok(host, "unknown host");
      assert.equal(item.family, host.family); assert.equal(item.chainId, host.chainId ?? null);
      assert.ok(Number.isInteger(item.decimals) && item.decimals >= 0 && item.decimals <= 255);
      if (item.family === "evm") {
        assert.match(item.contract, /^0x[0-9a-fA-F]{40}$/);
        assert.notEqual(item.contract.toLowerCase(), "0x" + "0".repeat(40));
        assert.equal(eip55(item.contract), item.contract, "EVM catalogue identifier must be checksummed");
      } else {
        assert.equal(item.family, "tron", "new address families need independent schema/encoding controls");
        const decoded = base58CheckDecode(item.contract);
        assert.equal(decoded.length, 21); assert.equal(decoded[0], 0x41);
        assert.equal(item.chainId, null, "TRON must not acquire an invented EVM chain ID");
      }
      const tuple = `${id}:${item.networkId}`;
      assert.ok(!seen.has(tuple), "duplicate deployment tuple"); seen.add(tuple);
      const identity = refs(item.identity), backing = refs(item.backing);
      if (item.representation === "issuer-listed") {
        assert.equal(item.identity.status, "issuer-listed");
        assert.ok(identity.some((source) => source.publisherKind === "issuer-documentation"));
        assert.equal(item.backing.status, "issuer-claim-only");
        assert.ok(backing.some((source) => source.publisherKind === "issuer-claim"));
      } else {
        assert.equal(item.representation, "custodial-peg");
        assert.equal(item.identity.status, "operator-peg-plus-catalogue");
        assert.ok(identity.some((source) => source.publisherKind === "peg-operator-documentation"));
        assert.equal(item.backing.status, "operator-claim-only");
        assert.ok(backing.some((source) => source.publisherKind === "peg-operator-documentation"));
      }
      assert.equal(item.decimalEvidence.status, "catalogue-and-explorer");
      const decimals = refs(item.decimalEvidence);
      assert.ok(decimals.some((source) => source.publisherKind === "secondary-catalogue"));
      assert.ok(decimals.some((source) => source.publisherKind === "explorer-secondary"));
      const control = refs(item.controlReview);
      assert.ok(["not-reviewed", "abi-surface-only", "pinned-reference-source-only"].includes(item.controlReview.status));
      assert.ok(item.controlReview.notes);
      if (item.controlReview.status === "pinned-reference-source-only") assert.ok(control.some((source) => source.publisherKind === "publisher-source"));
      assert.equal(item.backing.independentlyVerified, false, "a source claim is not a backing audit");
      assert.deepEqual(item.transferTax, { status: "unqueried", currentBasisPoints: null, transactionTested: false });
      assert.deepEqual(item.runtime, { status: "unqueried", blockNumber: null, blockHash: null, implementationAddress: null, transactionTested: false });
      const current = catalogue.assets?.[id]?.find((row) => row.id === item.networkId);
      if (item.catalogue === "existing") {
        assert.ok(current, "existing tuple is absent from runtime catalogue");
        assert.equal(tokenReviewForNetwork(ledger, id, { ...current, environment: "mainnet" }), item, "runtime catalogue and research tuple disagree");
        catalogued++;
      } else {
        assert.equal(item.catalogue, "research-only"); assert.equal(current, undefined, "research-only must not silently enable runtime reads");
        researchOnly++;
      }
    }
  }
  return { assetsStarted: ledger.order.length, deploymentTuples: tuples, cataloguedTuples: catalogued, researchOnlyTuples: researchOnly, acceptanceGatesClosed: 0 };
}
