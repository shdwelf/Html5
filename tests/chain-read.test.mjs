import assert from "node:assert/strict";
import { test } from "node:test";
import { publicHttpsUrl, boundedText, readJson, rpcRead, queryHolding, readContractMetadata, readOffchainMetadata, metadataUrl, abiString, abiUint, hexQuantity, uint256, formatUnits } from "../js/chain-read.js";
import { stellarEncode } from "../js/codec.js";

const ENDPOINT = "https://rpc.example.test";
const ADDRESS = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
const CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const coin = { id: "eth-ethereum", derive: true };
const native = { assetKind: "native", environment: "mainnet", balanceAdapter: "evm", chainId: 1, name: "Ethereum" };
const input = { coin, network: native, address: ADDRESS, endpoint: ENDPOINT, consent: true };
export const word = (value) => "0x" + BigInt(value).toString(16).padStart(64, "0");
export const abiText = (s) => {
  const hex = Buffer.from(s).toString("hex");
  return word(32) + word(hex.length / 2).slice(2) + hex.padEnd(Math.ceil(hex.length / 64) * 64, "0");
};
function rpcMock(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body); calls.push({ url, init, ...body });
    return Response.json({ jsonrpc: "2.0", id: body.id, result: await handler(body) });
  };
  return { calls, fetchImpl };
}
const evmMock = (result = "0x0") => rpcMock(({ method }) => ({ eth_chainId: "0x1", eth_blockNumber: "0x123", eth_getBalance: result })[method]);

test("HTTPS URL guard rejects local/credential/unsafe schemes without pretending to resolve DNS", () => {
  assert.equal(publicHttpsUrl(ENDPOINT), ENDPOINT + "/");
  for (const url of ["http://rpc.example.test", "file:///etc/passwd", "javascript:alert(1)", "https://user:pass@rpc.example.test", "https://rpc.example.test/#key", "https://localhost", "https://localhost.", "https://x.localhost", "https://x.local", "https://x.internal", "https://intranet", "https://127.0.0.1", "https://0x7f000001", "https://2130706433", "https://[::1]"]) assert.throws(() => publicHttpsUrl(url));
});

test("balance and metadata APIs refuse network I/O without exact explicit consent", async () => {
  let calls = 0; const options = { fetchImpl: async () => { calls++; throw new Error("unexpected"); } };
  for (const consent of [undefined, false, "true", 1]) {
    await assert.rejects(queryHolding({ ...input, consent }, options), /consent/);
    await assert.rejects(readContractMetadata({ endpoint: ENDPOINT, chainId: 1, contract: CONTRACT, consent }, options), /consent/);
    await assert.rejects(readOffchainMetadata("https://metadata.example.test/1", consent, options), /consent/);
  }
  assert.equal(calls, 0);
  for (const method of ["eth_sendTransaction", "eth_sendRawTransaction", "personal_sign", "eth_requestAccounts", "wallet_switchEthereumChain", "solana_signTransaction"]) await assert.rejects(rpcRead(ENDPOINT, method, [], options), /allowlist/);
  assert.equal(calls, 0);
});

test("chain mismatch stops before selected address/contract disclosure", async () => {
  const mock = rpcMock(() => "0x38");
  await assert.rejects(queryHolding(input, mock), /chain ID mismatch/);
  assert.equal(mock.calls.length, 1);
  assert.deepEqual(mock.calls[0].params, []);
  assert.ok(!mock.calls[0].init.body.includes(ADDRESS));
  const invalid = evmMock();
  await assert.rejects(queryHolding({ ...input, network: { ...native, chainId: null } }, invalid), /expected EVM chain/);
  assert.equal(invalid.calls.length, 0);
});

test("selected EVM balance has block/units/provenance and cannot mean whole-wallet zero", async () => {
  const mock = evmMock(); const result = await queryHolding(input, mock);
  assert.equal(result.status, "observed-zero"); assert.equal(result.amount, "0");
  assert.equal(result.chainIdMatched, true); assert.equal(result.independentlyVerified, false);
  assert.equal(result.block, "0x123"); assert.match(result.scope, /not a whole-wallet scan/);
  assert.deepEqual(mock.calls.map((c) => c.method), ["eth_chainId", "eth_blockNumber", "eth_getBalance"]);
  assert.deepEqual(mock.calls.at(-1).params, [ADDRESS, "0x123"]);
  for (const { init } of mock.calls) {
    assert.equal(init.credentials, "omit"); assert.equal(init.referrerPolicy, "no-referrer");
    assert.equal(init.redirect, "error"); assert.equal(init.cache, "no-store");
    assert.doesNotMatch(init.body, /mnemonic|seed|private|abandon|passphrase/);
  }
  const positive = await queryHolding(input, evmMock("0xde0b6b3a7640000"));
  assert.equal(positive.status, "observed-nonzero"); assert.equal(positive.amount, "1");
});

test("ERC-20 balance uses only catalogued mainnet contract and decimals, not native gas", async () => {
  const network = { ...native, assetKind: "token-or-unverified", contract: CONTRACT, decimals: 6 };
  const mock = rpcMock(({ method, params }) => {
    if (method === "eth_chainId") return "0x1";
    if (method === "eth_blockNumber") return "0x123";
    if (method === "eth_getCode") return "0x6001";
    assert.equal(params[0].to, CONTRACT); assert.equal(params[1], "0x123");
    assert.equal(params[0].data, "0x70a08231" + ADDRESS.slice(2).padStart(64, "0"));
    return word(1_234_567);
  });
  assert.equal((await queryHolding({ ...input, network }, mock)).amount, "1.234567");
  assert.ok(!mock.calls.some((c) => c.method === "eth_getBalance"));
  for (const bad of [{ ...network, contract: null }, { ...network, environment: "testnet" }]) {
    const count = mock.calls.length;
    assert.equal((await queryHolding({ ...input, network: bad }, mock)).status, "unsupported");
    assert.equal(mock.calls.length, count);
  }
});

test("provider errors and malformed quantities are errors, not zero balances", async () => {
  for (const result of [null, undefined, "0x", "0x00", "0x-1", 0, "0x" + "f".repeat(65)]) {
    await assert.rejects(queryHolding(input, rpcMock(({ method }) => ({ eth_chainId: "0x1", eth_blockNumber: "0x123", eth_getBalance: result })[method])), `malformed balance ${String(result)}`);
  }
  await assert.rejects(queryHolding(input, { fetchImpl: async () => Response.json({ jsonrpc: "2.0", id: 0, result: "0x0" }) }), /Malformed/);
  await assert.rejects(queryHolding(input, { fetchImpl: async (_, init) => Response.json({ jsonrpc: "2.0", id: JSON.parse(init.body).id, error: { code: -1 } }) }), /not a zero/);
  await assert.rejects(queryHolding(input, { fetchImpl: async () => new Response("no", { status: 429 }) }), /HTTP 429/);
  await assert.rejects(queryHolding(input, { fetchImpl: async () => new Response("<html>bad</html>") }));
});

test("bounded JSON and cancellation reject oversized, invalid UTF-8 and stale reads", async () => {
  await assert.rejects(boundedText(new Response("x", { headers: { "content-length": "1048577" } })), /1 MiB/);
  await assert.rejects(boundedText(new Response("x".repeat(1048577))), /1 MiB/);
  await assert.rejects(boundedText(new Response(new Uint8Array([0xc3, 0x28]))));
  const controller = new AbortController(); controller.abort(); let calls = 0;
  await assert.rejects(readJson(ENDPOINT, { signal: controller.signal, fetchImpl: () => { calls++; } }), { name: "AbortError" });
  assert.equal(calls, 0);
  const late = new AbortController(); let release;
  const reading = readJson(ENDPOINT, { signal: late.signal, fetchImpl: () => new Promise((resolve) => { release = resolve; }) });
  late.abort(); release(Response.json({ shouldNotBeAccepted: true }));
  await assert.rejects(reading, { name: "AbortError" });
});

test("Solana checks curated cluster genesis hash before the address read, and distinguishes missing from zero", async () => {
  const genesisHash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
  const network = { ...native, chainId: null, balanceAdapter: "solana", expectedGenesisHash: genesisHash }, address = "11111111111111111111111111111111";
  const run = (value) => {
    const mock = rpcMock(({ method, params }) => {
      if (method === "getGenesisHash") { assert.deepEqual(params, []); return genesisHash; }
      assert.equal(method, "getAccountInfo"); assert.equal(params[1].dataSlice.length, 0);
      return { context: { slot: 1 }, value };
    });
    return queryHolding({ ...input, network, address }, mock).then((result) => ({ result, mock }));
  };
  const absent = await run(null);
  assert.equal(absent.result.status, "unavailable");
  assert.deepEqual(absent.mock.calls.map((call) => call.method), ["getGenesisHash", "getAccountInfo"]);
  assert.equal(absent.result.clusterIdentityMatched, true); assert.equal(absent.result.independentlyVerified, false);
  const zero = await run({ lamports: 0 }); assert.equal(zero.result.status, "observed-zero");
  assert.equal((await run({ lamports: 1e9 })).result.amount, "1");
  await assert.rejects(run({ lamports: Number.MAX_SAFE_INTEGER + 1 }));

  const mismatch = rpcMock(() => "wrong-genesis");
  await assert.rejects(queryHolding({ ...input, network, address }, mismatch), /genesis hash mismatch/);
  assert.deepEqual(mismatch.calls.map((call) => call.method), ["getGenesisHash"]);
  assert.ok(!mismatch.calls[0].init.body.includes(address));
  const unreviewed = rpcMock(() => { throw new Error("must not query"); });
  assert.equal((await queryHolding({ ...input, network: { ...network, expectedGenesisHash: null }, address }, unreviewed)).status, "unsupported");
  assert.equal(unreviewed.calls.length, 0);
});

test("Stellar missing account is unavailable, while returned account identity must match", async () => {
  const address = stellarEncode(48, new Uint8Array(32)), network = { ...native, balanceAdapter: "stellar" };
  assert.equal((await queryHolding({ ...input, address, network }, { fetchImpl: async () => new Response("{}", { status: 404 }) })).status, "unavailable");
  const response = (account_id, balance) => ({ fetchImpl: async (url) => { assert.ok(url.endsWith("/accounts/" + address)); return Response.json({ account_id, balances: [{ asset_type: "native", balance }] }); } });
  assert.equal((await queryHolding({ ...input, address, network }, response(address, "0.0000000"))).status, "observed-zero");
  await assert.rejects(queryHolding({ ...input, address, network }, response("other", "0.0000000")), /Mismatched/);
  await assert.rejects(queryHolding({ ...input, address, network }, response(address, "0")), /Malformed/);
});

test("TRON distinguishes unactivated from returned zero and refuses another account", async () => {
  const address = "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH", network = { ...native, balanceAdapter: "tron" };
  const run = (json) => queryHolding({ ...input, address, network }, { fetchImpl: async (_, init) => {
    assert.deepEqual(JSON.parse(init.body), { address, visible: true }); return Response.json(json);
  } });
  assert.equal((await run({})).status, "unavailable");
  assert.equal((await run({ address })).status, "observed-zero");
  assert.equal((await run({ address, balance: 1000000 })).amount, "1");
  await assert.rejects(run({ address: "bad" }), /Mismatched/);
  await assert.rejects(run({ address, balance: "0" }), /Unsafe/);
});

test("ABI decoding rejects offset/length/boolean/range abuse without float balances", () => {
  assert.equal(abiString(abiText("Hello 🌍")), "Hello 🌍");
  assert.equal(abiString("0x" + Buffer.from("USDT").toString("hex").padEnd(64, "0")), "USDT");
  for (const value of ["0x", word(1) + word(3).slice(2), word(32) + word(65537).slice(2), "0xzz", "0x0"]) assert.throws(() => abiString(value));
  for (const value of ["0x0", "0x" + "f".repeat(66), 0]) assert.throws(() => abiUint(value));
  assert.equal(abiUint(word((1n << 256n) - 1n)), (1n << 256n) - 1n);
  assert.throws(() => uint256(-1)); assert.throws(() => uint256(1n << 256n));
  assert.throws(() => uint256("01")); assert.throws(() => hexQuantity("0x00"));
  assert.equal(formatUnits(0n, 18), "0"); assert.equal(formatUnits(10n ** 30n + 1n, 18), "1000000000000.000000000000000001");
});

test("contract metadata stays on-chain until separately consented; no signing methods", async () => {
  const uri = "ipfs://bafytest/metadata/1.json";
  const mock = rpcMock(({ method, params }) => {
    if (method === "eth_chainId") return "0x1";
    if (method === "eth_blockNumber") return "0x123";
    if (method === "eth_getCode") return "0x6001";
    const data = params[0].data;
    if (data.startsWith("0x06fdde03")) return abiText("Untrusted Name");
    if (data.startsWith("0x95d89b41")) return abiText("TEST");
    if (data.startsWith("0x01ffc9a7")) return word(["01ffc9a7", "80ac58cd"].includes(data.slice(10, 18)) ? 1 : 0);
    if (data.startsWith("0x6352211e")) return "0x" + ADDRESS.slice(2).padStart(64, "0");
    if (data.startsWith("0xc87b56dd")) return abiText(uri);
    throw new Error("unknown read");
  });
  const result = await readContractMetadata({ endpoint: ENDPOINT, chainId: 1, contract: CONTRACT, tokenId: "1", consent: true }, mock);
  assert.equal(result.erc721, true); assert.equal(result.erc1155, false);
  assert.equal(result.owner.toLowerCase(), ADDRESS.toLowerCase());
  assert.equal(result.tokenURI, uri); assert.equal(result.metadataFetched, false);
  assert.equal(result.errors.length, 0);
  assert.ok(mock.calls.every((c) => c.url.startsWith(ENDPOINT)), "no gateway request");
  let fetched;
  const json = await readOffchainMetadata(uri, true, { fetchImpl: async (url) => { fetched = url; return Response.json({ name: "only inert data", image: "javascript:alert(1)" }); } });
  assert.equal(fetched, "https://ipfs.io/ipfs/bafytest/metadata/1.json"); assert.equal(json.name, "only inert data");
  assert.throws(() => metadataUrl(json.image));
  const data = await readOffchainMetadata('data:application/json,%7B%22name%22%3A%22local%22%7D', true, { fetchImpl: async () => { throw new Error("must stay local"); } });
  assert.equal(data.name, "local");
  await assert.rejects(readOffchainMetadata("data:text/html,<script>x</script>", true));
  await assert.rejects(readOffchainMetadata('data:application/json,[]', true), /JSON object/);
});

test("ERC-20 optional reads surface unavailable metadata, never fake empty names/zero supply", async () => {
  const mock = rpcMock(({ method, params }) => {
    if (method === "eth_chainId") return "0x1";
    if (method === "eth_blockNumber") return "0x123";
    if (method === "eth_getCode") return "0x6001";
    return params[0].data === "0x313ce567" ? word(256) : "0x";
  });
  const data = await readContractMetadata({ endpoint: ENDPOINT, chainId: 1, contract: CONTRACT, tokenId: "", kind: "erc20", consent: true }, mock);
  assert.equal(data.decimals, null); assert.equal(data.totalSupplyRaw, null); assert.equal(data.name, null);
  assert.ok(data.errors.some((s) => s.includes("outside uint8")));
});
