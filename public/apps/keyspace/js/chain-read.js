/** Public-data-only blockchain reads. No wallet connection, signing or broadcast. */
import { base58Decode, base58CheckDecode, stellarDecode, toHex } from "./codec.js";

const MAX_BYTES = 1024 * 1024;
const READ_METHODS = new Set(["eth_chainId", "eth_blockNumber", "eth_getBalance", "eth_getCode", "eth_call", "getAccountInfo"]);
const checkAbort = (signal) => {
  if (signal?.aborted) throw new DOMException("Read cancelled or timed out", "AbortError");
};
let requestId = 0;

export function publicHttpsUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  // Browser-side URL checks only: DNS rebinding / private DNS answers cannot be
  // ruled out here. Never turn this function into an unrestricted server proxy.
  if (url.protocol !== "https:" || url.username || url.password || url.hash || !host.includes(".") ||
      host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") ||
      host.includes(":") || /^\d+(?:\.\d+){3}$/.test(host)) {
    throw new Error("Use a public HTTPS endpoint without credentials, fragments, or IP literals");
  }
  return url.href;
}

export async function boundedText(response, maximum = MAX_BYTES) {
  const length = response.headers?.get("content-length");
  if (length && Number(length) > maximum) throw new Error("Response exceeds the 1 MiB limit");
  if (!response.body?.getReader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).length > maximum) throw new Error("Response exceeds the 1 MiB limit");
    return text;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0, text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) throw new Error("Response exceeds the 1 MiB limit");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function readJson(url, { body, signal, fetchImpl = globalThis.fetch, allowNotFound = false } = {}) {
  const endpoint = publicHttpsUrl(url);
  const controller = new AbortController();
  const abort = () => controller.abort();
  checkAbort(signal);
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 12000);
  try {
    const response = await fetchImpl(endpoint, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer",
      cache: "no-store", redirect: "error",
    });
    checkAbort(controller.signal);
    if (allowNotFound && response.status === 404) return null;
    if (!response.ok) throw new Error(`Read-only service returned HTTP ${response.status}`);
    const text = await boundedText(response);
    checkAbort(controller.signal);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export async function rpcRead(endpoint, method, params, options) {
  if (!READ_METHODS.has(method)) throw new Error("RPC method is not on the read-only allowlist");
  const id = ++requestId;
  const json = await readJson(endpoint, { ...options, body: { jsonrpc: "2.0", id, method, params } });
  if (!json || json.jsonrpc !== "2.0" || json.id !== id) throw new Error("Malformed JSON-RPC response");
  if (json.error || !Object.hasOwn(json, "result")) throw new Error("RPC read failed; not a zero balance");
  return json.result;
}

export function evmAddress(value) {
  if (typeof value !== "string" || !/^0x[0-9a-f]{40}$/i.test(value)) throw new Error("Expected a 20-byte EVM public address");
  return value;
}
export function uint256(value) {
  if (!/^(?:0|[1-9][0-9]*)$/.test(String(value)) || String(value).length > 78) throw new Error("Token ID must be a uint256 decimal integer");
  const n = BigInt(value);
  if (n >= (1n << 256n)) throw new Error("Token ID exceeds uint256");
  return n.toString(16).padStart(64, "0");
}
export function hexQuantity(value) {
  if (typeof value !== "string" || !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value) || value.length > 66) throw new Error("Invalid RPC hex quantity");
  return BigInt(value);
}
export function abiUint(value) {
  if (typeof value !== "string" || !/^0x[0-9a-f]{64}$/i.test(value)) throw new Error("Invalid ABI uint256 response");
  return BigInt(value);
}
export function abiString(value) {
  if (typeof value !== "string" || !/^0x(?:[0-9a-f]{2})*$/i.test(value) || value.length > MAX_BYTES * 2 + 2) throw new Error("Invalid ABI string bytes");
  const hex = value.slice(2);
  const decode = (data) => new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(data.match(/../g) || [], (byte) => parseInt(byte, 16)));
  if (hex.length === 64) return decode(hex).replace(/\0+$/g, ""); // legacy bytes32 metadata
  if (hex.length < 128) throw new Error("Truncated ABI string");
  const offset = BigInt("0x" + hex.slice(0, 64));
  if (offset !== 32n) throw new Error("Invalid ABI string offset");
  const length = BigInt("0x" + hex.slice(64, 128));
  if (length > 65536n || 128n + length * 2n > BigInt(hex.length)) throw new Error("Invalid ABI string length");
  return decode(hex.slice(128, 128 + Number(length) * 2));
}
export function formatUnits(raw, decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255 || typeof raw !== "bigint" || raw < 0n) throw new Error("Invalid balance units");
  const digits = raw.toString().padStart(decimals + 1, "0");
  return decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`.replace(/\.?0+$/, "") : digits;
}

async function checkedEvm(endpoint, chainId, options) {
  if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new Error("A catalogued expected EVM chain ID is required");
  const actual = hexQuantity(await rpcRead(endpoint, "eth_chainId", [], options));
  if (actual !== BigInt(chainId)) throw new Error("RPC chain ID mismatch; no address/contract lookup was sent");
  return rpcRead(endpoint, "eth_blockNumber", [], options).then((block) => { hexQuantity(block); return block; });
}
const call = (endpoint, contract, data, block, options) => rpcRead(endpoint, "eth_call", [{ to: contract, data }, block], options);
const balanceResult = (raw, decimals, extra) => ({
  status: raw === 0n ? "observed-zero" : "observed-nonzero",
  raw: raw.toString(), amount: formatUnits(raw, decimals), decimals,
  ...extra, queriedAt: new Date().toISOString(),
  scope: "Provider-reported balance at one address, not a whole-wallet scan, independent proof, or spendability check.",
});

/** Only the selected public address (and catalogued contract, if any) crosses this API. */
export async function queryHolding({ coin, network, address, endpoint, consent }, options = {}) {
  if (consent !== true) throw new Error("Explicit public-address disclosure consent is required");
  if (!coin?.derive || !network) return { status: "unsupported", reason: "No supported local address derivation" };
  const native = network.assetKind === "native";
  const base = { assetId: coin.id, network: network.name, provider: new URL(publicHttpsUrl(endpoint)).origin };
  if (!native && (!network.contract || network.environment !== "mainnet")) {
    return { ...base, status: "unsupported", reason: "No verified token deployment for this network; native gas balance is not this asset's balance" };
  }
  const adapter = network.balanceAdapter;
  if (adapter === "evm") {
    evmAddress(address);
    const contract = !native ? evmAddress(network.contract) : null;
    const block = await checkedEvm(endpoint, network.chainId, options);
    let raw, decimals;
    if (native) {
      raw = hexQuantity(await rpcRead(endpoint, "eth_getBalance", [address, block], options));
      decimals = 18;
    } else {
      const code = await rpcRead(endpoint, "eth_getCode", [contract, block], options);
      if (!/^0x(?:[0-9a-f]{2})+$/i.test(code)) throw new Error("No valid token contract code; balance unavailable");
      raw = abiUint(await call(endpoint, contract, "0x70a08231" + address.slice(2).padStart(64, "0"), block, options));
      decimals = network.decimals;
      if (!Number.isInteger(decimals)) throw new Error("Token decimals are not catalogued");
    }
    return balanceResult(raw, decimals, { ...base, block, chainId: network.chainId, chainIdMatched: true, independentlyVerified: false });
  }
  if (!native) return { ...base, status: "unsupported", reason: "Token balance adapter not implemented for this network" };
  if (adapter === "solana") {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) || base58Decode(address).length !== 32) throw new Error("Invalid Solana public address");
    // getBalance returns zero even for a missing account. Read the account with
    // a zero-byte data slice to distinguish an uncreated account from zero.
    const result = await rpcRead(endpoint, "getAccountInfo", [address, { commitment: "finalized", encoding: "base64", dataSlice: { offset: 0, length: 0 } }], options);
    if (!Number.isSafeInteger(result?.context?.slot) || result.context.slot < 0 || !Object.hasOwn(result, "value")) throw new Error("Malformed Solana account response");
    if (result.value === null) return { ...base, status: "unavailable", reason: "Account not found/created at the reported slot; not a verified zero", slot: result.context.slot, chainIdMatched: false, independentlyVerified: false };
    if (!Number.isSafeInteger(result.value?.lamports) || result.value.lamports < 0) throw new Error("Unsafe/malformed lamport balance");
    return balanceResult(BigInt(result.value.lamports), 9, { ...base, slot: result.context.slot, chainIdMatched: false, independentlyVerified: false });
  }
  if (adapter === "stellar") {
    if (!/^G[A-Z2-7]{55}$/.test(address)) throw new Error("Invalid Stellar public address");
    stellarDecode(address); // checksum, not just an alphabet/length check
    const data = await readJson(endpoint.replace(/\/$/, "") + "/accounts/" + address, { ...options, allowNotFound: true });
    if (!data) return { ...base, status: "unavailable", reason: "Account not found/created; not a verified zero or whole-wallet result" };
    if (data.account_id !== address || !Array.isArray(data.balances)) throw new Error("Mismatched/malformed Stellar account response");
    const amount = data.balances.find((item) => item?.asset_type === "native")?.balance;
    if (typeof amount !== "string" || amount.length > 40 || !/^\d+\.\d{7}$/.test(amount)) throw new Error("Malformed Stellar native balance");
    return balanceResult(BigInt(amount.replace(".", "")), 7, { ...base, ledger: data.last_modified_ledger ?? null, chainIdMatched: false, independentlyVerified: false });
  }
  if (adapter === "tron") {
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) throw new Error("Invalid TRON public address");
    const decodedAddress = base58CheckDecode(address);
    if (decodedAddress.length !== 21 || decodedAddress[0] !== 0x41) throw new Error("Invalid TRON public address");
    const expectedHex = toHex(decodedAddress);
    const data = await readJson(endpoint.replace(/\/$/, "") + "/wallet/getaccount", { ...options, body: { address, visible: true } });
    if (!data?.address) return { ...base, status: "unavailable", reason: "Account not returned/activated; not a verified zero" };
    // visible=true normally returns base58; tolerate the matching hex wire
    // address, never an unrelated or malformed account that happens to omit 0.
    if (data.address !== address && (typeof data.address !== "string" || data.address.toLowerCase() !== expectedHex)) throw new Error("Mismatched/malformed TRON account response");
    const value = data.balance ?? 0; // protobuf omits default zero for an existing account
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Unsafe/malformed TRON balance");
    return balanceResult(BigInt(value), 6, { ...base, chainIdMatched: false, independentlyVerified: false });
  }
  return { ...base, status: "unsupported", reason: "Read-only balance adapter not implemented" };
}

/** On-chain facts only. tokenURI is a pointer, NOT proof its JSON/image is on-chain. */
export async function readContractMetadata({ endpoint, chainId, contract, tokenId = "0", kind = "nft", consent }, options = {}) {
  if (consent !== true) throw new Error("Explicit contract lookup consent is required");
  evmAddress(contract);
  if (!["nft", "erc20"].includes(kind)) throw new Error("Unknown metadata kind");
  const id = kind === "nft" ? uint256(tokenId) : null;
  const block = await checkedEvm(endpoint, chainId, options);
  const code = await rpcRead(endpoint, "eth_getCode", [contract, block], options);
  if (!/^0x(?:[0-9a-f]{2})+$/i.test(code)) throw new Error("No valid contract code on the selected chain");
  const errors = [];
  const optional = async (name, selector, args, decode) => {
    try { return decode(await call(endpoint, contract, selector + args, block, options)); }
    catch (error) { if (options.signal?.aborted || error.name === "AbortError") throw error; errors.push(name + ": unavailable/reverted or malformed"); return null; }
  };
  const name = await optional("name", "0x06fdde03", "", abiString);
  const symbol = await optional("symbol", "0x95d89b41", "", abiString);
  const result = { chainId, block, contract, kind, name, symbol, errors, provider: new URL(endpoint).origin, metadataFetched: false };
  if (kind === "erc20") {
    const decimals = await optional("decimals", "0x313ce567", "", abiUint);
    result.decimals = decimals !== null && decimals <= 255n ? Number(decimals) : null;
    if (decimals !== null && decimals > 255n) errors.push("decimals: outside uint8");
    const supply = await optional("totalSupply", "0x18160ddd", "", abiUint);
    result.totalSupplyRaw = supply?.toString() ?? null;
  } else {
    const supports = (iface) => optional("supportsInterface " + iface, "0x01ffc9a7", iface.padEnd(64, "0"), (raw) => {
      const value = abiUint(raw); if (value > 1n) throw new Error("Invalid ABI boolean"); return value === 1n;
    });
    result.erc165 = await supports("01ffc9a7");
    const invalidInterface = await supports("ffffffff");
    const valid165 = result.erc165 === true && invalidInterface === false;
    result.erc721 = valid165 ? await supports("80ac58cd") : null;
    result.erc1155 = valid165 ? await supports("d9b67a26") : null;
    if (!valid165) errors.push("ERC-165 probe did not establish standard interface reporting; NFT-specific reads skipped");
    result.tokenId = BigInt("0x" + id).toString();
    result.tokenURI = null;
    if (result.erc721) {
      result.owner = await optional("ownerOf", "0x6352211e", id, (raw) => {
        abiUint(raw); if (!/^0x0{24}/i.test(raw)) throw new Error("Invalid ABI address"); return "0x" + raw.slice(-40);
      });
      result.tokenURI = await optional("tokenURI", "0xc87b56dd", id, abiString);
    }
    if (!result.tokenURI && result.erc1155) {
      const uri = await optional("uri", "0x0e89341c", id, abiString);
      result.tokenURI = uri?.replace(/\{id\}/g, id) ?? null;
    }
    result.metadataLocation = result.tokenURI?.startsWith("data:application/json") ? "data URI returned by contract" : "external/unknown pointer; content is not automatically on-chain";
  }
  return result;
}

export function metadataUrl(uri) {
  if (typeof uri !== "string" || uri.length > 65536) throw new Error("Invalid metadata URI");
  if (uri.startsWith("ipfs://")) uri = "https://ipfs.io/ipfs/" + uri.slice(7).replace(/^ipfs\//, "");
  else if (uri.startsWith("ar://")) uri = "https://arweave.net/" + uri.slice(5);
  return publicHttpsUrl(uri);
}
export async function readOffchainMetadata(uri, consent, options = {}) {
  if (consent !== true) throw new Error("Separate off-chain metadata consent is required");
  let json;
  if (typeof uri === "string" && /^data:application\/json(?:;charset=utf-8)?(?:;base64)?,/i.test(uri)) {
    if (uri.length > 65536) throw new Error("Data URI exceeds the 64 KiB limit");
    const comma = uri.indexOf(","), body = uri.slice(comma + 1);
    const text = uri.slice(0, comma).toLowerCase().endsWith(";base64")
      ? new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0))) : decodeURIComponent(body);
    json = JSON.parse(text);
  } else json = await readJson(metadataUrl(uri), options);
  if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("Metadata must be a JSON object");
  return json; // caller renders as text; never execute HTML/SVG/animation
}
