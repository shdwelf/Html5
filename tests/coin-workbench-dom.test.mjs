import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { initCoinWorkbench } from "../js/coin-workbench.js";
import { researchedNetworks } from "../js/coin-research.js";
import { initNftViewer } from "../js/nft-viewer.js";

const load = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const all = JSON.parse(load("config/coins-top500.json")).assets;
const research = JSON.parse(load("config/chain-research.json"));
const coins = ["eth-ethereum", "btc-bitcoin", "usdt-tether", "xno-nano"].map((id) => all.find((c) => c.id === id));
const networks = researchedNetworks(coins, JSON.parse(load("config/token-networks.json")), research);
const ABANDON = "abandon ".repeat(11) + "about";
const ADDRESS = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
const waitFor = async (fn) => { const end = Date.now() + 15000; while (!fn()) { if (Date.now() > end) throw new Error("DOM wait timed out"); await new Promise((r) => setTimeout(r, 10)); } };
const change = (w, id, value, kind = "input") => { const el = w.document.getElementById(id); el.value = value; el.dispatchEvent(new w.Event(kind, { bubbles: true })); };
const word = (n) => "0x" + BigInt(n).toString(16).padStart(64, "0");
const abiText = (s) => { const h = Buffer.from(s).toString("hex"); return word(32) + word(h.length / 2).slice(2) + h.padEnd(Math.ceil(h.length / 64) * 64, "0"); };

test("workbench derives without network, groups/sorts evidence and requires single-address consent", async (t) => {
  const dom = new JSDOM(load("keyspace.html")); t.after(() => dom.window.close());
  const { window: w } = dom, $ = (id) => w.document.getElementById(id);
  const calls = []; let inspect;
  const workbench = initCoinWorkbench(w.document, {
    coins, networks, research,
    getPhrase: () => ({ mnemonic: ABANDON, passphrase: "" }),
    onInspect: (row) => { inspect = row; }, onListChange: () => workbench.renderCosts(),
    readOptions: { fetchImpl: async (url, init) => {
      const body = JSON.parse(init.body); calls.push({ url, ...body });
      return Response.json({ jsonrpc: "2.0", id: body.id, result: ({ eth_chainId: "0x1", eth_blockNumber: "0x123", eth_getBalance: "0x0" })[body.method] });
    } },
  });
  assert.equal(calls.length, 0);
  assert.equal($("coinFeeRows").children.length, 4);
  change(w, "topCoinGroup", "native", "change"); assert.equal(workbench.orderedCoins(coins).length, 3);
  change(w, "topCoinGroup", "unsupported", "change"); assert.deepEqual(workbench.orderedCoins(coins).map((c) => c.symbol), ["XNO"]);
  change(w, "topCoinGroup", "all", "change"); change(w, "topCoinOrder", "fee", "change");
  assert.equal(workbench.orderedCoins(coins)[0].symbol, "XNO");
  $("coinFeeScenario").value = '{"gasGwei":{"ETH":1e15},"tokenGas":{"usdt-tether":1e15}}';
  $("applyCoinFeeScenario").click(); assert.match($("coinFeeStatus").textContent, /rejected/);
  assert.equal(workbench.orderedCoins(coins)[0].symbol, "XNO", "rejected scenario did not poison state");
  $("coinTabInvestigate").click();
  assert.equal($("coinInvestigatePanel").hidden, false); assert.equal($("coinCostsPanel").hidden, true);
  $("coinTabInvestigate").dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.equal($("coinTabMetadata").getAttribute("aria-selected"), "true");
  $("deriveAllCoinsLocal").click();
  await waitFor(() => $("coinInvestigationStatus").textContent.includes("All holdings UNQUERIED"));
  assert.equal($("coinInvestigationRows").children.length, 4);
  assert.match($("coinInvestigationStatus").textContent, /3 default leaves derived · 1 unsupported · 0 errors/);
  assert.equal(calls.length, 0);
  $("coinInvestigationRows").querySelector('[data-inspect-coin="eth-ethereum"]').click();
  assert.equal(inspect.address, ADDRESS);
  workbench.setSelection(coins[0], networks.assets[coins[0].id][0]); workbench.setDerived(inspect);
  $("querySelectedCoin").click(); assert.equal(calls.length, 0);
  $("coinProbeConsent").checked = true; $("coinProbeConsent").dispatchEvent(new w.Event("change"));
  $("querySelectedCoin").click();
  await waitFor(() => $("coinProbeResult").textContent.includes('"observed-zero"'));
  assert.equal(calls.length, 3); assert.deepEqual(calls[2].params, [ADDRESS, "0x123"]);
  assert.equal($("coinProbeConsent").checked, false, "consent is one-shot");
  assert.match($("coinInvestigationRows").firstElementChild.textContent, /observed-zero/);
  workbench.invalidateAll(); assert.equal($("coinInvestigationRows").children.length, 0);
  assert.equal($("coinProbeResult").textContent, "unqueried"); assert.equal($("querySelectedCoin").disabled, true);
});

test("clearing selection ignores a late provider result; batch cancellation leaves no stale rows", async (t) => {
  const dom = new JSDOM(load("keyspace.html")); t.after(() => dom.window.close());
  const { window: w } = dom, $ = (id) => w.document.getElementById(id);
  let release;
  const workbench = initCoinWorkbench(w.document, {
    coins, networks, research, getPhrase: () => ({ mnemonic: ABANDON }), onInspect() {}, onListChange() {},
    readOptions: { fetchImpl: (_, init) => new Promise((resolve) => { release = () => resolve(Response.json({ jsonrpc: "2.0", id: JSON.parse(init.body).id, result: "0x1" })); }) },
  });
  workbench.setSelection(coins[0], networks.assets[coins[0].id][0]); workbench.setDerived({ address: ADDRESS });
  $("coinProbeConsent").checked = true; $("coinProbeConsent").dispatchEvent(new w.Event("change"));
  $("querySelectedCoin").click(); assert.ok(release);
  workbench.clearDerived(); release(); await new Promise((r) => setTimeout(r, 30));
  assert.equal($("coinProbeResult").textContent, "unqueried");
  $("deriveAllCoinsLocal").click(); $("cancelCoinInvestigation").click();
  await new Promise((r) => setTimeout(r, 500));
  assert.equal($("coinInvestigationRows").children.length, 0);
  assert.match($("coinInvestigationStatus").textContent, /cleared/);
});

test("actual NFT viewer never auto-fetches or executes metadata/media", async (t) => {
  const dom = new JSDOM(load("apps/index3.html"), { url: "https://local.example.test/apps/index3.html" });
  t.after(() => dom.window.close()); const { window: w } = dom, $ = (id) => w.document.getElementById(id);
  const calls = [];
  initNftViewer(w.document, { fetchImpl: async (url, init) => {
    calls.push({ url, init });
    if (init.method === "GET") return Response.json({ name: '<img src="https://leak.example.test/pixel">', image: "https://media.example.test/pixel.png", animation_url: "javascript:alert(1)", external_url: "http://unsafe.example.test" });
    const b = JSON.parse(init.body); let result;
    if (b.method === "eth_chainId") result = "0x1";
    else if (b.method === "eth_blockNumber") result = "0x123";
    else if (b.method === "eth_getCode") result = "0x6001";
    else {
      const data = b.params[0].data;
      if (data.startsWith("0x06fdde03")) result = abiText('<img src=x onerror="alert(1)">');
      else if (data.startsWith("0x95d89b41")) result = abiText("TEST");
      else if (data.startsWith("0x01ffc9a7")) result = word(["01ffc9a7", "80ac58cd"].includes(data.slice(10, 18)) ? 1 : 0);
      else if (data.startsWith("0x6352211e")) result = "0x" + ADDRESS.slice(2).padStart(64, "0");
      else result = abiText("https://metadata.example.test/1.json");
    }
    return Response.json({ jsonrpc: "2.0", id: b.id, result });
  } });
  assert.equal(calls.length, 0);
  $("exampleBtn").click(); assert.equal(calls.length, 0);
  $("loadBtn").click(); assert.equal(calls.length, 0); assert.match($("status").textContent, /disclosure/);
  $("lookupConsent").checked = true; $("loadBtn").click();
  await waitFor(() => $("status").textContent.includes("On-chain read completed"));
  assert.equal($("lookupConsent").checked, false, "contract disclosure consent is one-shot");
  assert.ok(calls.every((c) => c.init.method === "POST"));
  assert.equal($("summary").querySelectorAll("img,iframe,script").length, 0);
  assert.match($("summary").textContent, /<img src=x/);
  const onchainCalls = calls.length;
  $("metadataBtn").click(); assert.equal(calls.length, onchainCalls);
  $("metadataConsent").checked = true; $("metadataBtn").click();
  await waitFor(() => $("status").textContent.includes("Metadata JSON fetched"));
  assert.equal($("metadataConsent").checked, false, "off-chain consent is one-shot too");
  assert.equal(calls.length, onchainCalls + 1);
  assert.equal($("preview").querySelectorAll("img,iframe,video,script,svg").length, 0);
  assert.equal($("metadataJson").querySelectorAll("img").length, 0);
  assert.equal($("preview").querySelectorAll("a").length, 1);
  assert.equal($("preview").querySelector("a").rel, "noopener noreferrer");
  change(w, "contract", ADDRESS);
  assert.equal($("summary").children.length, 0); assert.equal($("metadataBtn").disabled, true);
  assert.equal($("lookupConsent").checked, false);
});

test("revoking selected-address consent clears pending state and ignores a late reply", async (t) => {
  const dom = new JSDOM(load("keyspace.html")); t.after(() => dom.window.close());
  const { window: w } = dom, $ = (id) => w.document.getElementById(id);
  let release, signal; let calls = 0;
  const workbench = initCoinWorkbench(w.document, {
    coins, networks, research, getPhrase: () => ({ mnemonic: ABANDON }), onInspect() {}, onListChange() {},
    readOptions: { fetchImpl: (_, init) => {
      calls++; signal = init.signal;
      return new Promise((resolve) => { release = () => resolve(Response.json({ jsonrpc: "2.0", id: JSON.parse(init.body).id, result: "0x1" })); });
    } },
  });
  workbench.setSelection(coins[0], networks.assets[coins[0].id][0]); workbench.setDerived({ address: ADDRESS });
  $("coinProbeConsent").checked = true; $("coinProbeConsent").dispatchEvent(new w.Event("change"));
  $("querySelectedCoin").click();
  assert.match($("coinProbeResult").textContent, /querying/);
  $("coinProbeConsent").checked = false; $("coinProbeConsent").dispatchEvent(new w.Event("change"));
  assert.equal(signal.aborted, true);
  assert.equal($("coinProbeResult").textContent, "unqueried");
  assert.equal($("querySelectedCoin").disabled, true);
  release(); await new Promise((r) => setTimeout(r, 30));
  assert.equal(calls, 1, "revocation prevents the subsequent address-bearing calls");
  assert.equal($("coinProbeResult").textContent, "unqueried");
});

test("NFT consent revocation aborts contract/metadata reads and suppresses late data", async (t) => {
  const dom = new JSDOM(load("apps/index3.html")); t.after(() => dom.window.close());
  const { window: w } = dom, $ = (id) => w.document.getElementById(id);
  let pending, signal, deferContract = true; let calls = 0;
  initNftViewer(w.document, { fetchImpl: (_, init) => {
    calls++;
    if (init.method === "GET" || deferContract) {
      signal = init.signal;
      return new Promise((resolve) => { pending = () => resolve(Response.json(init.method === "GET"
        ? { name: "late untrusted data", image: "https://media.example.test/late.png" }
        : { jsonrpc: "2.0", id: JSON.parse(init.body).id, result: "0x1" })); });
    }
    const b = JSON.parse(init.body); let result;
    if (b.method === "eth_chainId") result = "0x1";
    else if (b.method === "eth_blockNumber") result = "0x123";
    else if (b.method === "eth_getCode") result = "0x6001";
    else {
      const data = b.params[0].data;
      if (data.startsWith("0x01ffc9a7")) result = word(["01ffc9a7", "80ac58cd"].includes(data.slice(10, 18)) ? 1 : 0);
      else if (data.startsWith("0x6352211e")) result = "0x" + ADDRESS.slice(2).padStart(64, "0");
      else result = abiText("https://metadata.example.test/1.json");
    }
    return Promise.resolve(Response.json({ jsonrpc: "2.0", id: b.id, result }));
  } });
  $("exampleBtn").click(); $("lookupConsent").checked = true; $("loadBtn").click();
  $("lookupConsent").checked = false; $("lookupConsent").dispatchEvent(new w.Event("change"));
  assert.equal(signal.aborted, true);
  pending(); await new Promise((r) => setTimeout(r, 30));
  assert.equal(calls, 1); assert.equal($("summary").children.length, 0);
  assert.match($("status").textContent, /cancelled\/cleared/);
  assert.equal($("loadBtn").disabled, false);

  deferContract = false;
  $("lookupConsent").checked = true; $("loadBtn").click();
  await waitFor(() => $("status").textContent.includes("On-chain read completed"));
  $("metadataConsent").checked = true; $("metadataBtn").click();
  assert.match($("status").textContent, /Fetching selected metadata/);
  $("metadataConsent").checked = false; $("metadataConsent").dispatchEvent(new w.Event("change"));
  assert.equal(signal.aborted, true);
  pending(); await new Promise((r) => setTimeout(r, 30));
  assert.equal($("metadataJson").textContent, "{}");
  assert.equal($("preview").querySelectorAll("a,img,iframe").length, 0);
  assert.match($("status").textContent, /cancelled\/cleared/);
  assert.ok($("summary").children.length > 0, "metadata revocation preserves already-read contract facts");
  assert.equal($("metadataBtn").disabled, false);
});
