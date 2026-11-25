import { networksForCoin } from "./coin-networks.js";
import { profileForCoin, researchRecord, feeEstimate, parseFeeScenario, compareFeeEstimates } from "./coin-research.js";
import { deriveInvestigations } from "./wallet-investigation.js";
import { queryHolding } from "./chain-read.js";

/** No phrase/seed is put into DOM, storage, messages, URLs or a fetch payload. */
export function initCoinWorkbench(document, { coins, networks, research, getPhrase, onInspect, onListChange, readOptions = {} }) {
  const $ = (id) => document.getElementById(id);
  let scenario = parseFeeScenario("{}"), selected = null, derived = null, rows = [];
  let localController = null, remoteController = null, localEpoch = 0, remoteEpoch = 0;
  const main = (coin) => networksForCoin(networks, coin).find((network) => network.environment === "mainnet");
  const create = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const option = (value, label) => { const node = create("option", label); node.value = value; return node; };
  const firstOptions = [
    ["all", `All ${coins.length} assets`], ["native", "Curated native assets"],
    ["tokens", "Tokens / unverified asset deployment"], ["unsupported", "Derivation unsupported"],
    ["pending", "Fee research still pending"],
  ];
  const chains = [...new Set(coins.map((coin) => profileForCoin(research, coin)?.name || "Unmapped host"))].sort();
  $("topCoinGroup").replaceChildren(...firstOptions.map(([value, label]) => option(value, label)), ...chains.map((name) => option("host:" + name, name)));
  $("topCoinGroup").disabled = $("topCoinOrder").disabled = $("deriveAllCoinsLocal").disabled = false;

  function orderedCoins(list) {
    const group = $("topCoinGroup").value;
    let matches = list.filter((coin) => {
      const record = researchRecord(research, coin, main(coin));
      if (group === "native") return record.native;
      if (group === "tokens") return !record.native;
      if (group === "unsupported") return !coin.derive;
      if (group === "pending") return record.feeStatus === "pending";
      if (group.startsWith("host:")) return (profileForCoin(research, coin)?.name || "Unmapped host") === group.slice(5);
      return true;
    });
    if ($("topCoinOrder").value === "fee") matches = matches.map((coin) => ({ coin, estimate: feeEstimate(research, coin, main(coin), scenario) })).sort(compareFeeEstimates).map((row) => row.coin);
    return matches;
  }
  function renderCosts(list = coins) {
    const fragment = document.createDocumentFragment();
    for (const coin of orderedCoins(list)) {
      const network = main(coin), record = researchRecord(research, coin, network);
      const estimate = feeEstimate(research, coin, network, scenario);
      const tr = create("tr"); tr.dataset.assetId = coin.id;
      tr.append(create("td", `${coin.symbol} · ${coin.id}\n${record.chain || "unmapped"}`),
        create("td", `${record.feeAsset || "unknown"} · ${record.group}\nfee review: ${record.feeStatus}`),
        create("td", `${estimate.amount === null ? "unknown" : estimate.amount + " " + estimate.asset}\n${estimate.basis}`),
        create("td", estimate.usd === null ? "unranked" : `$${estimate.usd.toPrecision(6)} · scenario/minimum`));
      fragment.append(tr);
    }
    $("coinFeeRows").replaceChildren(fragment);
  }
  function renderResearch() {
    const coin = selected?.coin, network = selected?.network;
    $("coinResearchLinks").replaceChildren();
    if (!coin || !network) { $("coinResearchSummary").textContent = "No asset selected."; return; }
    const record = researchRecord(research, coin, network);
    const estimate = feeEstimate(research, coin, network, scenario);
    $("coinResearchSummary").textContent = [
      `${coin.name} (${coin.symbol}) · ${coin.id}`,
      `Host: ${record.chain || "unmapped"} · ${network.environment} · identity: ${record.identityStatus}`,
      ...(record.expectedGenesisHash ? [`Solana RPC identity preflight: getGenesisHash must match ${record.expectedGenesisHash}; one provider can still lie.`] : []),
      `Derivation: ${record.derivation}`,
      `Fee asset: ${record.feeAsset || "unknown"} · model: ${record.group} · fee review: ${record.feeStatus}`,
      record.feeFormula, record.assetReview,
      network.contract ? `Contract: ${network.contract} (NOT your receive address)` : "No verified token contract in this network record.",
      `Cost: ${estimate.amount === null ? "unknown" : estimate.amount + " " + estimate.asset} · ${estimate.basis}`,
      `USD: ${estimate.usd === null ? "unranked (missing estimate and/or USD price)" : estimate.usd + " (scenario/base only, NOT live)"}`,
      `Reviewed host test networks: ${record.testnets.map((item) => item.name).join(", ") || "none verified in this catalogue; not proof none exist"}`,
      "A matching host test network is not a verified deployment of this asset. Test/mainnet balances never carry over.",
      ...record.notes,
    ].join("\n\n");
    for (const source of [...record.sources.map((item) => ({ label: item.kind + " source", url: item.url })), ...record.links]) {
      const link = create("a", source.label); link.href = source.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      $("coinResearchLinks").append(link);
    }
  }
  function stopRemote() {
    remoteEpoch++;
    remoteController?.abort(); remoteController = null;
    $("coinProbeConsent").checked = false;
    $("coinProbeResult").textContent = "unqueried";
    $("querySelectedCoin").disabled = true;
  }
  function probeReady() {
    const network = selected?.network;
    const knownToken = network?.contract && network.environment === "mainnet" && network.balanceAdapter === "evm";
    return Boolean(derived && network?.balanceAdapter && (network.assetKind === "native" || knownToken));
  }
  function renderProbe() {
    $("coinProbeDisclosure").textContent = derived
      ? `Selected ${selected.coin.symbol} on ${selected.network.name}: ${derived.address}. ONLY this public address (and catalogued contract, if applicable) will be sent to the endpoint below. No automatic batch queries. Solana endpoints are checked against a curated genesis hash but can still lie; Stellar and TRON endpoints are not cluster-verified.`
      : "Derive or inspect one public address first. No balance has been queried.";
    $("querySelectedCoin").disabled = !probeReady() || !$("coinProbeConsent").checked;
    if (derived && !probeReady()) $("coinProbeResult").textContent = "unsupported: no read adapter or no verified token deployment; this is NOT a zero balance";
  }
  function setSelection(coin, network) {
    stopRemote(); derived = null; selected = coin && network ? { coin, network } : null;
    $("coinProbeEndpoint").value = network?.rpc || "";
    renderResearch(); renderProbe();
  }
  function clearDerived() { stopRemote(); derived = null; renderProbe(); }
  function setDerived(value) { stopRemote(); derived = { address: value.address, path: value.path }; renderProbe(); }
  function renderRows() {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const tr = create("tr"); tr.dataset.assetId = row.id;
      tr.append(create("td", `${row.symbol} · ${row.chain || "unmapped"}\n${row.id}`),
        create("td", row.status === "derived" ? `${row.path}\n${row.address}\nPublic key: ${row.pubkeyHex}` : row.reason),
        create("td", `${row.status} · holdings: ${row.holdings.status}`));
      const td = create("td");
      if (row.status === "derived") {
        const button = create("button", "Inspect", "act"); button.type = "button";
        button.dataset.inspectCoin = row.id; td.append(button);
      }
      tr.append(td); fragment.append(tr);
    }
    $("coinInvestigationRows").replaceChildren(fragment);
  }
  function invalidateAll() {
    localEpoch++; localController?.abort(); localController = null;
    rows = []; clearDerived(); renderRows();
    $("deriveAllCoinsLocal").disabled = false;
    $("cancelCoinInvestigation").disabled = true;
    $("coinInvestigationStatus").textContent = "Not derived / cleared. No whole-wallet or holdings scan was performed.";
  }
  $("deriveAllCoinsLocal").addEventListener("click", async () => {
    invalidateAll();
    const generation = localEpoch;
    localController = new AbortController();
    $("deriveAllCoinsLocal").disabled = true; $("cancelCoinInvestigation").disabled = false;
    try {
      const phrase = getPhrase(); // caller refuses a dirty/unapplied phrase
      const derivedRows = await deriveInvestigations(coins, networks, phrase.mnemonic, {
        passphrase: phrase.passphrase, signal: localController.signal,
        onProgress: (done, total) => { if (generation === localEpoch) $("coinInvestigationStatus").textContent = `Deriving locally: ${done}/${total}. No remote queries…`; },
      });
      if (generation !== localEpoch) return;
      rows = derivedRows;
      renderRows();
      const counts = Object.fromEntries(["derived", "unsupported", "error"].map((key) => [key, rows.filter((row) => row.status === key).length]));
      $("coinInvestigationStatus").textContent = `${counts.derived} default leaves derived · ${counts.unsupported} unsupported · ${counts.error} errors. All holdings UNQUERIED. This does not cover alternate accounts, indices, passphrases, imported keys or wallet-specific paths.`;
    } catch (error) {
      if (generation === localEpoch) $("coinInvestigationStatus").textContent = error.name === "AbortError" ? "Cancelled; no remote queries." : error.message;
    } finally { if (generation === localEpoch) $("deriveAllCoinsLocal").disabled = false; }
  });
  $("cancelCoinInvestigation").addEventListener("click", invalidateAll);
  $("coinInvestigationRows").addEventListener("click", (event) => {
    const id = event.target.closest("[data-inspect-coin]")?.dataset.inspectCoin;
    const row = rows.find((item) => item.id === id);
    if (row?.status === "derived") onInspect(row);
  });
  $("coinProbeEndpoint").addEventListener("input", () => { stopRemote(); renderProbe(); });
  $("coinProbeConsent").addEventListener("change", () => {
    if (!$("coinProbeConsent").checked) stopRemote();
    renderProbe();
  });
  $("querySelectedCoin").addEventListener("click", async () => {
    if (!probeReady() || !$("coinProbeConsent").checked) return;
    const generation = ++remoteEpoch;
    remoteController?.abort(); remoteController = new AbortController();
    $("querySelectedCoin").disabled = true;
    $("coinProbeResult").textContent = "querying selected public address (read-only)…";
    const coin = selected.coin, network = selected.network, leaf = { ...derived };
    try {
      const result = await queryHolding({ coin, network, address: leaf.address, endpoint: $("coinProbeEndpoint").value.trim(), consent: true }, { ...readOptions, signal: remoteController.signal });
      if (generation !== remoteEpoch) return;
      $("coinProbeResult").textContent = JSON.stringify(result, null, 2);
      const row = rows.find((item) => item.id === coin.id && item.address === leaf.address && item.networkId === network.id);
      if (row) { row.holdings = { status: result.status }; renderRows(); }
    } catch (error) {
      if (generation !== remoteEpoch) return;
      $("coinProbeResult").textContent = `error: ${error.name === "AbortError" ? "cancelled/timed out" : error.message}. Not a zero or no-holdings result.`;
      const row = rows.find((item) => item.id === coin.id && item.address === leaf.address && item.networkId === network.id);
      if (row) { row.holdings = { status: "error" }; renderRows(); }
    } finally {
      if (generation === remoteEpoch) { $("coinProbeConsent").checked = false; renderProbe(); }
    }
  });
  $("applyCoinFeeScenario").addEventListener("click", () => {
    try {
      const candidate = parseFeeScenario($("coinFeeScenario").value);
      // Commit atomically only after all affected asset arithmetic is bounded.
      for (const coin of coins) feeEstimate(research, coin, main(coin), candidate);
      scenario = candidate;
      $("coinFeeStatus").textContent = "Manual scenario applied locally. Free first, then priced USD scenarios; unpriced/unknown rows remain unranked. These are not all-in/live quotes.";
      renderResearch(); onListChange();
    } catch (error) { $("coinFeeStatus").textContent = "Scenario rejected: " + error.message; }
  });
  for (const id of ["topCoinGroup", "topCoinOrder"]) $(id).addEventListener("change", onListChange);
  const tabs = [...document.querySelectorAll("[data-coin-tab]")];
  function activate(button) {
    for (const tab of tabs) {
      const active = tab === button;
      tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle("on", active); $(tab.dataset.coinTab).hidden = !active;
    }
  }
  for (const tab of tabs) {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      const next = event.key === "ArrowRight" ? tabs[(index + 1) % tabs.length] : event.key === "ArrowLeft" ? tabs[(index + tabs.length - 1) % tabs.length] : event.key === "Home" ? tabs[0] : event.key === "End" ? tabs.at(-1) : null;
      if (next) { event.preventDefault(); activate(next); next.focus(); }
    });
  }
  renderCosts(); renderProbe();
  return { orderedCoins, renderCosts, setSelection, setDerived, clearDerived, invalidateAll };
}
