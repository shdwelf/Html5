#!/usr/bin/env node
/** Offline research preflight, not a wallet/RPC client or chain/state proof.
 * Exact profiles below do not enable runtime reads or close acceptance gates.
 */
import { constants, openSync, fstatSync, readSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { keccak256 } from "../js/hash.js";
import { eip55, fromHex, toHex } from "../js/codec.js";

export const CAPTURE_LIMITS = Object.freeze({ fileBytes: 1024 * 1024, codeBytes: 64 * 1024, providers: 2, exchanges: 8 });
// Circle reference source fc85788b: these are NOT the ERC-1967 slots. Reading
// them is a layout probe, not evidence that this source matches deployed code.
export const USDC_LEGACY_SLOTS = Object.freeze({
  implementation: "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3",
  admin: "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b",
});
const profiles = [
  ["usdt-tether", "ethereum", "ETH", 1, "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6],
  ["usdt-tether", "bsc", "BSC", 56, "0x55d398326f99059fF775485246999027B3197955", 18],
  ["usdc-usd-coin", "ethereum", "ETH", 1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6],
].map(([assetId, networkId, hostChain, chainId, contract, decimals]) => Object.freeze({
  assetId, networkId, hostChain, chainId, contract, decimals, family: "evm", environment: "mainnet",
}));
const need = (condition, message) => { if (!condition) throw new Error(message); };
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exactKeys = (value, keys, message) => {
  need(record(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort()), message);
};
const quantity = (value) => typeof value === "string" && /^0x(?:0|[1-9a-f][0-9a-f]{0,15})$/.test(value);
const word = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
const same = (a, b, message) => need(isDeepStrictEqual(a, b), message);

export function buildTokenCapturePlan(assetId, networkId, anchor) {
  const tuple = profiles.find((p) => p.assetId === assetId && p.networkId === networkId);
  need(tuple, "Unsupported exact deployment: TRON, other assets/hosts and testnets need separate profiles.");
  exactKeys(anchor, ["number", "hash"], "A number/hash anchor is required; no tags or extra options.");
  need(quantity(anchor.number), "Block number must be a canonical uint64 hex quantity, not a tag.");
  need(word(anchor.hash) && anchor.hash === anchor.hash.toLowerCase() && BigInt(anchor.hash) !== 0n,
    "Block hash must be nonzero lowercase 32-byte data.");
  const pinned = () => ({ blockHash: anchor.hash, requireCanonical: true });
  const requests = [];
  const add = (id, method, params) => requests.push({ jsonrpc: "2.0", id, method, params });
  add("chain", "eth_chainId", []);
  add("header", "eth_getBlockByHash", [anchor.hash, false]);
  add("canonical-before", "eth_getBlockByNumber", [anchor.number, false]);
  add("code", "eth_getCode", [tuple.contract, pinned()]);
  add("decimals", "eth_call", [{ to: tuple.contract, data: "0x313ce567" }, pinned()]);
  if (tuple.assetId === "usdc-usd-coin") for (const [name, slot] of Object.entries(USDC_LEGACY_SLOTS)) {
    add(`legacy-${name}`, "eth_getStorageAt", [tuple.contract, slot, pinned()]);
  }
  add("canonical-after", "eth_getBlockByNumber", [anchor.number, false]);
  return { schema: "html5-token-capture-plan-v1", tuple: { ...tuple }, anchor: { ...anchor }, requests };
}

function headerFields(value, anchor) {
  need(record(value) && value.number === anchor.number && typeof value.hash === "string"
    && value.hash.toLowerCase() === anchor.hash, "Header number/hash does not match the requested anchor.");
  need(word(value.parentHash) && word(value.stateRoot) && quantity(value.timestamp), "Incomplete header fields.");
  // Ordinary block responses may contain other fields. None is echoed or
  // treated as a verified consensus header, transaction or storage proof.
  return { number: value.number, hash: value.hash.toLowerCase(), parentHash: value.parentHash.toLowerCase(),
    stateRoot: value.stateRoot.toLowerCase(), timestamp: value.timestamp };
}
function candidateAddress(value, token) {
  need(word(value) && /^0x0{24}/i.test(value) && BigInt(value) !== 0n, "Incomplete legacy layout probe: nonzero padded address word required.");
  const address = eip55(value.slice(-40));
  need(address !== token, "Legacy implementation/admin candidate must not replace or point to the token itself.");
  return address;
}
function validateProvider(provider, plan) {
  exactKeys(provider, ["label", "exchanges"], "Provider requires only a label and exchanges, not endpoint credentials.");
  need(typeof provider.label === "string" && /^[a-z0-9][a-z0-9-]{0,47}$/.test(provider.label), "Use a short non-secret provider label, not a URL.");
  need(Array.isArray(provider.exchanges) && provider.exchanges.length === plan.requests.length
    && provider.exchanges.length <= CAPTURE_LIMITS.exchanges, "Missing or extra RPC exchanges.");
  const results = new Map();
  for (const exchange of provider.exchanges) {
    exactKeys(exchange, ["request", "response"], "An exchange needs exactly request and response.");
    const expected = plan.requests.find((request) => request.id === exchange.request?.id);
    need(expected && !results.has(expected.id), "Unknown or duplicate request ID.");
    same(exchange.request, expected, "RPC request drift: method, contract, block pin, slot and calldata must match the plan.");
    exactKeys(exchange.response, ["jsonrpc", "id", "result"], "Successful JSON-RPC result required; errors cannot be evidence.");
    need(exchange.response.jsonrpc === "2.0" && exchange.response.id === expected.id
      && exchange.response.result !== null && exchange.response.result !== undefined, "Mismatched or null JSON-RPC response.");
    results.set(expected.id, exchange.response.result);
  }
  need(results.get("chain") === `0x${plan.tuple.chainId.toString(16)}`, "Wrong chain ID; a shared EVM address is not host evidence.");
  const header = headerFields(results.get("header"), plan.anchor);
  for (const id of ["canonical-before", "canonical-after"]) {
    same(headerFields(results.get(id), plan.anchor), header, "Canonical header changed or disagrees with the hash lookup.");
  }
  const code = results.get("code");
  need(typeof code === "string" && /^0x(?:[0-9a-fA-F]{2})+$/.test(code)
    && code.length <= 2 + CAPTURE_LIMITS.codeBytes * 2, "Nonempty bounded bytecode data required.");
  const decimals = results.get("decimals");
  need(word(decimals) && BigInt(decimals) === BigInt(plan.tuple.decimals), "Decimals must be one ABI word matching the exact deployment.");
  const legacyProxyProbe = plan.tuple.assetId === "usdc-usd-coin" ? {
    status: "unverified-reference-layout-probe",
    implementationCandidate: candidateAddress(results.get("legacy-implementation"), plan.tuple.contract),
    adminCandidate: candidateAddress(results.get("legacy-admin"), plan.tuple.contract),
  } : null;
  return { header, code: code.toLowerCase(), decimals: plan.tuple.decimals, legacyProxyProbe };
}

/** Two labeled captures can be consistent and still be fabricated or share an
 * upstream. This does NOT validate consensus, state proofs or independence.
 */
export function validateTokenCapture(capture) {
  exactKeys(capture, ["schema", "assetId", "networkId", "anchor", "providers"], "Unexpected capture schema fields.");
  need(capture.schema === "html5-token-rpc-capture-v1", "Unsupported capture schema.");
  const plan = buildTokenCapturePlan(capture.assetId, capture.networkId, capture.anchor);
  need(Array.isArray(capture.providers) && capture.providers.length === CAPTURE_LIMITS.providers, "Exactly two separately labeled provider captures are required.");
  const observations = capture.providers.map((provider) => validateProvider(provider, plan));
  need(capture.providers[0].label !== capture.providers[1].label, "Duplicate provider labels.");
  same(observations[0], observations[1], "Provider captures disagree; do not merge inconsistent state.");
  const observed = observations[0];
  return {
    schema: "html5-token-capture-preflight-v1", status: "consistent-provider-claims-only",
    tuple: plan.tuple, anchor: plan.anchor, providerLabels: capture.providers.map((provider) => provider.label),
    observations: { header: observed.header, codeBytes: (observed.code.length - 2) / 2,
      codeKeccak256: "0x" + toHex(keccak256(fromHex(observed.code.slice(2)))),
      decimals: observed.decimals, legacyProxyProbe: observed.legacyProxyProbe },
    acceptanceGatesClosed: 0, runtimePromotion: false, transactionTested: false,
    transferTax: { status: "unknown", currentBasisPoints: null }, backingIndependentlyVerified: false,
    unresolved: ["provider independence", "consensus/finality and header hash", "storage/state proofs",
      "deployed source and proxy layout match", "implementation bytecode", "control/fee/blacklist and migration state",
      "transaction behaviour", "independent reserves and redemption review"],
  };
}

/** Bounded regular-file input, including if it grows after fstat. Never accepts
 * a URL, stdin stream, device or FIFO; diagnostics never print raw input.
 */
export function readTokenCaptureFile(path) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fstatSync(fd);
    need(stat.isFile() && stat.size > 0 && stat.size <= CAPTURE_LIMITS.fileBytes, "Capture must be a nonempty regular file no larger than 1 MiB.");
    const buffer = Buffer.alloc(CAPTURE_LIMITS.fileBytes + 1);
    let bytes = 0;
    while (bytes < buffer.length) {
      const count = readSync(fd, buffer, bytes, buffer.length - bytes, null);
      if (count === 0) break;
      bytes += count;
    }
    need(bytes > 0 && bytes <= CAPTURE_LIMITS.fileBytes, "Capture exceeds the 1 MiB limit.");
    return JSON.parse(buffer.subarray(0, bytes).toString("utf8"));
  } finally { closeSync(fd); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === "plan" && args.length === 4) {
      result = buildTokenCapturePlan(args[0], args[1], { number: args[2], hash: args[3] });
    } else if (command === "validate" && args.length === 1) {
      result = validateTokenCapture(readTokenCaptureFile(args[0]));
    } else throw new Error("Invalid arguments.");
    console.log(JSON.stringify(result, null, 2));
  } catch {
    console.error("Token capture rejected. Usage: node tools/token-deployment-capture.mjs plan ASSET NETWORK HEX_NUMBER BLOCK_HASH | validate LOCAL_JSON_FILE. See docs/token-deployment-capture-2026-11-17.md. No network request or ledger write was made.");
    process.exitCode = 1;
  }
}
