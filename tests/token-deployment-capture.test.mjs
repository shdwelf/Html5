import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { buildTokenCapturePlan, validateTokenCapture, readTokenCaptureFile, CAPTURE_LIMITS, USDC_LEGACY_SLOTS } from "../tools/token-deployment-capture.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ledger = JSON.parse(read("config/token-research.json"));
const root = fileURLToPath(new URL("../", import.meta.url));
const anchor = { number: "0x1234", hash: "0x" + "11".repeat(32) };
const abi = (value) => "0x" + BigInt(value).toString(16).padStart(64, "0");
const planFor = (asset = "usdt-tether", network = "ethereum") => buildTokenCapturePlan(asset, network, anchor);
const exchange = (capture, id, provider = 0) => capture.providers[provider].exchanges.find((row) => row.request.id === id);
const syntheticCapture = (asset = "usdt-tether", network = "ethereum") => {
  const plan = planFor(asset, network);
  const header = { number: anchor.number, hash: anchor.hash, parentHash: "0x" + "22".repeat(32),
    stateRoot: "0x" + "33".repeat(32), timestamp: "0x1", transactions: [] };
  const values = { chain: "0x" + plan.tuple.chainId.toString(16), header, "canonical-before": header,
    "canonical-after": header, code: "0x6001600055", decimals: abi(plan.tuple.decimals),
    "legacy-implementation": "0x" + "0".repeat(24) + "44".repeat(20),
    "legacy-admin": "0x" + "0".repeat(24) + "55".repeat(20) };
  return { schema: "html5-token-rpc-capture-v1", assetId: asset, networkId: network, anchor: { ...anchor },
    providers: ["synthetic-a", "synthetic-b"].map((label) => ({ label, exchanges: plan.requests.map((request) => ({
      request: structuredClone(request), response: { jsonrpc: "2.0", id: request.id, result: structuredClone(values[request.id]) },
    })) })) };
};
const rejected = (change, expected, asset, network) => {
  const capture = syntheticCapture(asset, network); change(capture);
  assert.throws(() => validateTokenCapture(capture), expected);
};

test("the three exact EVM profiles match the existing source ledger and cannot invent runtime mappings", () => {
  for (const [asset, network] of [["usdt-tether", "ethereum"], ["usdt-tether", "bsc"], ["usdc-usd-coin", "ethereum"]]) {
    const plan = planFor(asset, network), original = ledger.assets[asset].deployments.find((row) => row.networkId === network);
    for (const key of ["networkId", "hostChain", "chainId", "contract", "decimals", "family", "environment"]) {
      assert.equal(plan.tuple[key], original[key], key);
    }
    assert.equal(plan.tuple.assetId, asset);
    assert.equal(original.runtime.status, "unqueried");
  }
  const runtime = JSON.parse(read("config/token-networks.json"));
  assert.equal(runtime.assets["usdc-usd-coin"], undefined);
  assert.deepEqual(Object.keys(runtime.assets), ["usdt-tether"]);
});

test("TRON, ticker aliases, testnets, wrappers and stETH/wstETH cannot borrow an EVM profile", () => {
  for (const [asset, network] of [["usdt-tether", "tron"], ["USDT", "ethereum"], ["usdc-usd-coin", "bsc"],
    ["usdt-tether", "sepolia"], ["usdt-tether", "ethereum-testnet"], ["steth-lido-staked-ether", "ethereum"],
    ["wsteth-wrapped-steth", "ethereum"], ["__proto__", "ethereum"], ["usdt-tether", "__proto__"]]) {
    assert.throws(() => buildTokenCapturePlan(asset, network, anchor), /Unsupported exact deployment/);
  }
});

test("plans accept only explicit bounded canonical number/hash anchors, never latest/safe/finalized or silent fallbacks", () => {
  for (const number of ["latest", "pending", "safe", "finalized", "1234", "0x", "0x00", "0x0123", "0xAB", "0x1234\n", "0x1234\r\n", "0x1234\u2028", "0x10000000000000000", 1234, null]) {
    assert.throws(() => buildTokenCapturePlan("usdt-tether", "ethereum", { ...anchor, number }), /Block number/);
  }
  for (const hash of [null, "0x1234", "0x" + "0".repeat(64), "0x" + "AB".repeat(32), "0x" + "gg".repeat(32), anchor.hash + "\n", anchor.hash + "\r\n", anchor.hash + "\u2028"]) {
    assert.throws(() => buildTokenCapturePlan("usdt-tether", "ethereum", { ...anchor, hash }), /Block hash/);
  }
  for (const patch of [{ tag: "latest" }, { requireCanonical: false }, { blockNumber: anchor.number }]) {
    assert.throws(() => buildTokenCapturePlan("usdt-tether", "ethereum", { ...anchor, ...patch }), /no tags or extra/);
  }
  assert.ok(buildTokenCapturePlan("usdt-tether", "ethereum", { ...anchor, number: "0xffffffffffffffff" }));
});

test("all state reads require the same canonical block hash, exact token, fixed selector and no personal from address", () => {
  for (const [asset, network] of [["usdt-tether", "ethereum"], ["usdt-tether", "bsc"], ["usdc-usd-coin", "ethereum"]]) {
    const plan = planFor(asset, network);
    assert.equal(plan.requests.length, asset === "usdc-usd-coin" ? 8 : 6);
    assert.equal(plan.requests[2].id, "canonical-before");
    assert.equal(plan.requests.at(-1).id, "canonical-after");
    for (const request of plan.requests) {
      assert.ok(["eth_chainId", "eth_getBlockByHash", "eth_getBlockByNumber", "eth_getCode", "eth_call", "eth_getStorageAt"].includes(request.method));
      if (["eth_getCode", "eth_call", "eth_getStorageAt"].includes(request.method)) {
        assert.deepEqual(request.params.at(-1), { blockHash: anchor.hash, requireCanonical: true });
      }
      if (request.method === "eth_call") assert.deepEqual(request.params[0], { to: plan.tuple.contract, data: "0x313ce567" });
      if (request.method === "eth_getBlockByHash" || request.method === "eth_getBlockByNumber") assert.equal(request.params[1], false);
    }
  }
});

test("legacy USDC slots and the decimals selector have independent Keccak known-answer controls; ERC-1967 is different", () => {
  const hash = (text) => "0x" + Buffer.from(keccak_256(new TextEncoder().encode(text))).toString("hex");
  assert.equal(hash("decimals()").slice(0, 10), "0x313ce567");
  for (const key of ["implementation", "admin"]) {
    assert.equal(USDC_LEGACY_SLOTS[key], hash(`org.zeppelinos.proxy.${key}`));
    const standardSlot = "0x" + (BigInt(hash(`eip1967.proxy.${key}`)) - 1n).toString(16).padStart(64, "0");
    assert.notEqual(USDC_LEGACY_SLOTS[key], standardSlot);
    assert.equal(planFor("usdc-usd-coin").requests.find((r) => r.id === `legacy-${key}`).params[1], USDC_LEGACY_SLOTS[key]);
  }
  assert.equal(planFor("usdt-tether", "bsc").requests.some((r) => r.method === "eth_getStorageAt"), false);
});

test("consistent synthetic captures produce only provider claims, with bytecode digest and every financial/runtime gate open", () => {
  for (const [asset, network, decimals] of [["usdt-tether", "ethereum", 6], ["usdt-tether", "bsc", 18], ["usdc-usd-coin", "ethereum", 6]]) {
    const capture = syntheticCapture(asset, network), before = JSON.stringify(capture);
    const result = validateTokenCapture(capture);
    assert.equal(JSON.stringify(capture), before);
    assert.equal(result.status, "consistent-provider-claims-only");
    assert.equal(result.observations.decimals, decimals);
    assert.equal(result.observations.codeBytes, 5);
    assert.equal(result.observations.codeKeccak256, "0x" + Buffer.from(keccak_256(Buffer.from("6001600055", "hex"))).toString("hex"));
    assert.equal(result.acceptanceGatesClosed, 0); assert.equal(result.runtimePromotion, false);
    assert.equal(result.transactionTested, false); assert.equal(result.backingIndependentlyVerified, false);
    assert.deepEqual(result.transferTax, { status: "unknown", currentBasisPoints: null });
    assert.ok(result.unresolved.includes("provider independence"));
    assert.ok(result.unresolved.includes("storage/state proofs"));
    if (asset === "usdc-usd-coin") {
      assert.equal(result.observations.legacyProxyProbe.status, "unverified-reference-layout-probe");
      assert.equal(result.observations.legacyProxyProbe.implementationCandidate, "0x" + "44".repeat(20));
      assert.notEqual(result.tuple.contract, result.observations.legacyProxyProbe.implementationCandidate);
    } else assert.equal(result.observations.legacyProxyProbe, null);
    assert.equal(result.tuple.contract, planFor(asset, network).tuple.contract);
  }
});

test("request/response pairing supports reordered batches without accepting duplicate, missing or extra exchanges", () => {
  const capture = syntheticCapture(); capture.providers[0].exchanges.reverse();
  assert.equal(validateTokenCapture(capture).status, "consistent-provider-claims-only");
  rejected((c) => { c.providers[0].exchanges.pop(); }, /Missing or extra/);
  rejected((c) => { c.providers[0].exchanges.push(c.providers[0].exchanges[0]); }, /Missing or extra/);
  rejected((c) => { c.providers[0].exchanges[1] = c.providers[0].exchanges[0]; }, /duplicate/);
  rejected((c) => { exchange(c, "code").response.id = "decimals"; }, /Mismatched/);
  rejected((c) => { exchange(c, "code").request.id = "unrequested"; }, /Unknown/);
});

test("RPC errors, null results, missing fields and mixed success/error envelopes are never accepted as evidence", () => {
  for (const response of [null, {}, { jsonrpc: "2.0", id: "code", error: { code: -32000, message: "noncanonical" } },
    { jsonrpc: "2.0", id: "code", result: null }, { jsonrpc: "1.0", id: "code", result: "0x6000" },
    { jsonrpc: "2.0", id: "code", result: "0x6000", error: null }]) {
    rejected((c) => { exchange(c, "code").response = response; }, /JSON-RPC/);
  }
});

test("wrong chain, noncanonical number encodings, header substitution and reorg markers fail closed", () => {
  for (const value of ["0x38", "0x01", 1, "1"]) rejected((c) => { exchange(c, "chain").response.result = value; }, /Wrong chain/);
  for (const id of ["header", "canonical-before", "canonical-after"]) {
    rejected((c) => { exchange(c, id).response.result.number = "0x1235"; }, /Header number/);
    rejected((c) => { exchange(c, id).response.result.hash = "0x" + "66".repeat(32); }, /Header number/);
    rejected((c) => { exchange(c, id).response.result = null; }, /JSON-RPC/);
  }
  rejected((c) => { exchange(c, "canonical-after").response.result.stateRoot = "0x" + "77".repeat(32); }, /header changed/);
  rejected((c) => { exchange(c, "header").response.result.parentHash = "0x1234"; }, /Incomplete header/);
  rejected((c) => { exchange(c, "header").response.result.timestamp = "0x01"; }, /Incomplete header/);
});

test("weaker state anchors, changed contracts, arbitrary calldata, slots or write methods cannot replace the plan", () => {
  for (const patch of ["latest", anchor.number, { blockHash: anchor.hash }, { blockHash: anchor.hash, requireCanonical: false },
    { blockNumber: anchor.number }, { blockHash: "0x" + "66".repeat(32), requireCanonical: true }]) {
    rejected((c) => { exchange(c, "code").request.params[1] = patch; }, /RPC request drift/);
  }
  rejected((c) => { exchange(c, "code").request.params[0] = planFor("usdt-tether", "bsc").tuple.contract; }, /RPC request drift/);
  rejected((c) => { exchange(c, "decimals").request.params[0].data = "0xa9059cbb"; }, /RPC request drift/);
  rejected((c) => { exchange(c, "decimals").request.params[0].from = "0x" + "99".repeat(20); }, /RPC request drift/);
  rejected((c) => { exchange(c, "code").request.method = "eth_sendTransaction"; }, /RPC request drift/);
  rejected((c) => { exchange(c, "legacy-admin").request.params[1] = "0x0"; }, /RPC request drift/, "usdc-usd-coin");
});

test("BSC's 18 decimals cannot inherit Ethereum's six, and short/malformed ABI results are rejected", () => {
  for (const result of [abi(6), "0x12", abi(256), abi(18) + "\n", abi(18) + "\r\n", "0x" + "gg".repeat(32), 18, true]) {
    rejected((c) => { exchange(c, "decimals").response.result = result; }, /Decimals/, "usdt-tether", "bsc");
  }
});

test("empty, odd, malformed or oversized bytecode is rejected without assuming any source match", () => {
  for (const result of ["0x", "0x0", "6000", "0xzz", "0x6000\n", "0x6000\r\n", "0x" + "60".repeat(CAPTURE_LIMITS.codeBytes + 1), null]) {
    rejected((c) => { exchange(c, "code").response.result = result; }, /bytecode|JSON-RPC/);
  }
  const capture = syntheticCapture();
  for (const p of [0, 1]) exchange(capture, "code", p).response.result = "0x" + "60".repeat(CAPTURE_LIMITS.codeBytes);
  assert.equal(validateTokenCapture(capture).observations.codeBytes, CAPTURE_LIMITS.codeBytes);
});

test("legacy slots reject zero/malformed/self-referential address words rather than silently changing layouts", () => {
  for (const id of ["legacy-implementation", "legacy-admin"]) for (const value of [abi(0), "0x1234", "0x" + "ff".repeat(32), abi(planFor("usdc-usd-coin").tuple.contract)]) {
    rejected((c) => { exchange(c, id).response.result = value; }, /legacy layout|must not replace/, "usdc-usd-coin");
  }
});

test("provider count/labels and normalized state must agree, without pretending labels prove independent operators", () => {
  rejected((c) => { c.providers.pop(); }, /Exactly two/);
  rejected((c) => { c.providers.push(c.providers[0]); }, /Exactly two/);
  rejected((c) => { c.providers[1].label = c.providers[0].label; }, /Duplicate provider/);
  for (const label of ["https://provider.invalid/secret-fixture", "synthetic-a\n", "synthetic-a\r\n", "synthetic-a\u2028"]) {
    rejected((c) => { c.providers[0].label = label; }, /non-secret provider label/);
  }
  rejected((c) => { exchange(c, "code", 1).response.result = "0x6000"; }, /captures disagree/);
  rejected((c) => { exchange(c, "legacy-admin", 1).response.result = abi(42); }, /captures disagree/, "usdc-usd-coin");
  const c = syntheticCapture();
  for (const id of ["header", "canonical-before", "canonical-after"]) {
    exchange(c, id, 1).response.result.stateRoot = "0x" + "77".repeat(32);
  }
  assert.throws(() => validateTokenCapture(c), /captures disagree/);
});

test("unknown fields cannot smuggle completion, tax, balance-read promotion, credentials or substitute tuples into output", () => {
  for (const patch of [{ acceptanceGatesClosed: 1 }, { runtimePromotion: true }, { transferTax: 0 }, { tuple: planFor().tuple }]) {
    rejected((c) => Object.assign(c, patch), /Unexpected capture schema fields/);
  }
  rejected((c) => { c.providers[0].endpoint = "https://provider.invalid/secret-fixture"; }, /endpoint credentials/);
  rejected((c) => { c.providers[0].exchanges[0].optional = true; }, /exactly request and response/);
  rejected((c) => { c.schema = "html5-token-research-v1"; }, /Unsupported capture schema/);
  rejected((c) => { c.providers = null; }, /Exactly two/);
});

test("returned plans do not leak mutable profile or anchor state into later plans", () => {
  const inputAnchor = { ...anchor }, plan = buildTokenCapturePlan("usdt-tether", "ethereum", inputAnchor);
  plan.tuple.decimals = 18; plan.anchor.hash = "changed"; plan.requests[3].params[1].requireCanonical = false;
  assert.equal(inputAnchor.hash, anchor.hash);
  assert.equal(planFor().tuple.decimals, 6);
  assert.equal(planFor().requests[3].params[1].requireCanonical, true);
});

test("local-file input is bounded to regular files and rejects empty, oversized, malformed and symbolic-link input", () => {
  const dir = mkdtempSync(join(tmpdir(), "html5-token-capture-"));
  try {
    const file = join(dir, "capture.json"), text = JSON.stringify(syntheticCapture());
    writeFileSync(file, text); assert.deepEqual(readTokenCaptureFile(file), JSON.parse(text));
    writeFileSync(file, text.padEnd(CAPTURE_LIMITS.fileBytes, " "));
    assert.equal(validateTokenCapture(readTokenCaptureFile(file)).status, "consistent-provider-claims-only");
    writeFileSync(file, text.padEnd(CAPTURE_LIMITS.fileBytes + 1, " "));
    assert.throws(() => readTokenCaptureFile(file), /1 MiB/);
    writeFileSync(file, ""); assert.throws(() => readTokenCaptureFile(file), /nonempty/);
    writeFileSync(file, "not-json-fixture"); assert.throws(() => readTokenCaptureFile(file), SyntaxError);
    const link = join(dir, "link.json"); symlinkSync(file, link);
    assert.throws(() => readTokenCaptureFile(link));
    assert.throws(() => readTokenCaptureFile(dir), /regular file/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("CLI plans and validates only explicit local input, prints no raw rejected data, and returns nonzero on failure", () => {
  const run = (args) => spawnSync(process.execPath, ["tools/token-deployment-capture.mjs", ...args], { cwd: root, encoding: "utf8", timeout: 10000 });
  const planned = run(["plan", "usdt-tether", "bsc", anchor.number, anchor.hash]);
  assert.equal(planned.status, 0, planned.stderr);
  assert.equal(JSON.parse(planned.stdout).tuple.decimals, 18);
  const dir = mkdtempSync(join(tmpdir(), "html5-token-cli-"));
  try {
    const file = join(dir, "capture.json"); writeFileSync(file, JSON.stringify(syntheticCapture("usdc-usd-coin")));
    const result = run(["validate", file]); assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).acceptanceGatesClosed, 0);
    writeFileSync(file, '{"password":"do-not-log-fixture"');
    for (const args of [["validate", file], [], ["plan", "USDT", "ethereum", "latest", "secret-fixture"],
      ["validate", "https://provider.invalid/secret-fixture"], ["validate", file, "extra"]]) {
      const rejected = run(args); assert.equal(rejected.status, 1); assert.equal(rejected.stdout, "");
      assert.match(rejected.stderr, /Token capture rejected/);
      assert.doesNotMatch(rejected.stderr, /do-not-log-fixture|secret-fixture|password|SyntaxError|ENOENT/);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("the capture tool cannot perform network/child-process/write operations or enter the browser runtime", () => {
  const source = read("tools/token-deployment-capture.mjs");
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|WebSocket|node:(?:http|https|net|tls|child_process)|writeFile|appendFile|createWriteStream|execSync|spawn\s*\(/);
  assert.doesNotMatch(source, /process\.env|localStorage|sessionStorage|indexedDB/);
  for (const path of ["js/chain-read.js", "js/coin-networks.js", "js/coin-research.js", "tools/build-coin-research-inventory.mjs"]) {
    assert.doesNotMatch(read(path), /token-deployment-capture/);
  }
});

test("source provenance distinguishes immutable raw-file digests from live chain and deployment claims", () => {
  const manifest = JSON.parse(read("docs/research/token-deployment-capture-sources-2026-11-17.json"));
  assert.equal(manifest.schema, "html5-token-capture-source-review-v1");
  assert.equal(manifest.reviewed, "2026-11-17"); assert.equal(manifest.files.length, 5);
  for (const f of manifest.files) {
    assert.match(f.commit, /^[a-f0-9]{40}$/); assert.match(f.sha256, /^[a-f0-9]{64}$/);
    assert.equal(f.url, `https://github.com/${f.repo}/blob/${f.commit}/${f.path}`);
    assert.ok(Number.isSafeInteger(f.bytes) && f.bytes > 1000);
    assert.ok(Number.isSafeInteger(f.lines) && f.lines > 30);
    assert.equal(f.liveDeploymentVerified, false);
  }
  assert.ok(manifest.rejectedShortcuts.some((r) => r.includes("Moved")));
  const report = read("docs/token-deployment-capture-2026-11-17.md");
  assert.match(report, /not live deployment evidence/);
  assert.match(report, /TRON.*separate/);
  assert.match(report, /zero complete token acceptance gates/);
  assert.match(report, /provider labels do not prove independence/);
  assert.match(report, /No mainnet RPC was contacted/);
});

test("the bounded read-only CI lane requires the new capture controls and retains its original inventory/tuple assertions", () => {
  const workflow = read(".github/workflows/token-research-evidence.yml");
  for (const path of ["tools/token-deployment-capture.mjs", "tests/token-deployment-capture.test.mjs", "docs/token-deployment-capture-*.md", "docs/research/token-deployment-capture-sources-*.json"]) {
    assert.equal(workflow.split(`- '${path}'`).length - 1, 2, path);
  }
  assert.match(workflow, /run: node --test tests\/token-deployment-capture\.test\.mjs/);
  assert.match(workflow, /run: node --test tests\/token-research\.test\.mjs tests\/coin-research\.test\.mjs tests\/coin-networks\.test\.mjs/);
  assert.match(workflow, /run: npm run check:coin-research/);
  assert.match(workflow, /timeout-minutes: 5/); assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /secrets\.|contents: write|upload-artifact|continue-on-error|\|\| true|pull_request_target/);
});
