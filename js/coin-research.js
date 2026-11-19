import { networksForCoin } from "./coin-networks.js";

/** Research never silently changes the historical registry's derivation support. */
export function profileKey(research, coin) {
  return research?.assetProfileOverrides?.[coin?.id] || coin?.chain || null;
}
export function profileForCoin(research, coin) {
  return research?.chains?.[profileKey(research, coin)] || null;
}
export function isNativeAsset(profile, coin) {
  return Boolean(profile?.nativeAssetIds?.includes(coin?.id));
}

/** Preserve curated mainnet contracts; NEVER copy them onto a test network. */
export function researchedNetworks(coins, tokenRegistry, research) {
  const assets = {};
  for (const coin of coins) {
    const mains = networksForCoin(tokenRegistry, coin).map((network) => {
      const key = network.chain || profileKey(research, coin);
      const profile = research.chains[key];
      return {
        ...network, hostChain: key, environment: "mainnet",
        chainId: network.chainId ?? profile?.chainId ?? null,
        feeAsset: network.feeAsset ?? profile?.feeAsset ?? null,
        rpc: profile?.rpc || "", balanceAdapter: profile?.balanceAdapter || null,
        identityStatus: profile?.identityStatus || "pending",
        assetKind: isNativeAsset(profile, coin) ? "native" : "token-or-unverified",
        tokenDeployment: network.contract ? "catalogued" : "unverified",
      };
    });
    const tests = [];
    const visited = new Set();
    for (const main of mains) {
      const profile = research.chains[main.hostChain];
      for (const testnet of profile?.testnets || []) {
        if (testnet.identityStatus !== "primary-reviewed" || visited.has(testnet.id)) continue;
        visited.add(testnet.id);
        const native = isNativeAsset(profile, coin);
        tests.push({
          ...main, ...testnet,
          chain: testnet.addressChain || main.chain,
          slip44: testnet.slip44 ?? main.slip44,
          name: `${testnet.name} · ${native ? "test asset" : "host only; token unverified"}`,
          contract: null, decimals: null, tokenDeployment: "unverified",
          standard: native ? "native test asset" : "host test network; no verified token deployment",
          warning: "Test funds are separate and intended to have no economic value. Use a separate test mnemonic. Matching address encoding does not verify a token deployment or a wallet's path convention.",
        });
      }
    }
    assets[coin.id] = [...mains, ...tests];
  }
  return { ...tokenRegistry, assets };
}

export function researchLinks(coin) {
  const q = encodeURIComponent(`${coin.name} ${coin.symbol} ${coin.id} official network transaction fees testnet contract`);
  return [
    { label: "BareSearch", url: `https://baresearch.org/search?q=${q}` },
    { label: "LibreSearch", url: `https://libresearch.space/search?q=${q}` },
    { label: "Utilibre search", url: `https://search.utilibre.org/search?q=${q}` },
    { label: "SearXNG instance directory", url: "https://searx.space/" },
  ];
}

export function researchRecord(research, coin, network) {
  const profile = research.chains[network?.hostChain || profileKey(research, coin)];
  const native = isNativeAsset(profile, coin);
  return {
    id: coin.id, symbol: coin.symbol, chain: network?.hostChain || coin.chain,
    group: profile?.feeModel || "unknown", native,
    identityStatus: profile?.identityStatus || "pending",
    feeStatus: profile?.feeStatus || "pending",
    feeAsset: network?.feeAsset || profile?.feeAsset || null,
    feeFormula: profile?.feeFormula || "Host identity/fees not verified; no cost estimate.",
    assetReview: native ? "Native candidate curated by stable asset ID; host identity and fee review are separate evidence fields, not 500 independent asset reviews."
      : network?.contract ? "This network's contract is catalogued; backing, current code and transfers are not verified."
        : "Token/asset deployment not verified. A host address is NOT evidence of holdings or a token contract.",
    derivation: coin.derive ? "local default leaf supported" : coin.reason,
    testnets: profile?.testnets || [], sources: profile?.sources || [],
    notes: profile?.notes || [], links: researchLinks(coin),
  };
}

const object = (value) => value && typeof value === "object" && !Array.isArray(value);
/** Bounded arithmetic inputs only: no price feed, scripts, expressions or network I/O. */
export function parseFeeScenario(text) {
  if (typeof text !== "string" || text.length > 32768) throw new Error("Fee scenario must be at most 32768 characters of JSON");
  const data = JSON.parse(text || "{}");
  if (!object(data)) throw new Error("Fee scenario must be an object");
  const allowed = ["prices", "nativeFees", "gasGwei", "tokenGas", "vbytes", "satPerVbyte"];
  if (Object.keys(data).some((key) => !allowed.includes(key))) throw new Error("Unknown fee scenario key");
  const number = (value, key, positive = false) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value > 1e15 || (positive ? value <= 0 : value < 0)) {
      throw new Error(`${key} must be a ${positive ? "positive" : "non-negative"} finite number ≤ 10^15`);
    }
    return value;
  };
  const result = {};
  for (const key of ["prices", "nativeFees", "gasGwei", "tokenGas"]) {
    const map = data[key] ?? {};
    if (!object(map) || Object.keys(map).length > 1000) throw new Error(`${key} must be a map with at most 1000 entries`);
    result[key] = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, number(v, `${key}.${k}`, key !== "nativeFees")]));
  }
  for (const key of ["vbytes", "satPerVbyte"]) if (data[key] !== undefined) result[key] = number(data[key], key, true);
  return result;
}

/** No comparison of different native units. Only priced, labeled scenarios get a USD rank. */
export function feeEstimate(research, coin, network, scenario = parseFeeScenario("{}")) {
  const record = researchRecord(research, coin, network);
  const profile = research.chains[network?.hostChain || profileKey(research, coin)];
  const result = { amount: null, usd: null, asset: record.feeAsset, basis: "unknown / needs a transaction-specific estimate", live: false };
  if (network?.environment && network.environment !== "mainnet") {
    return { ...result, basis: "test network; no mainnet economic ranking" };
  }
  const own = (map, key) => Object.hasOwn(map || {}, key) ? map[key] : undefined;
  const manual = own(scenario.nativeFees, `${coin.id}@${network?.id || "registry"}`) ?? own(scenario.nativeFees, coin.id);
  if (manual !== undefined && result.asset) {
    result.amount = manual;
    result.basis = "user-entered native-fee scenario, not a quote";
  } else if (record.native && profile?.nativeBaseFee !== undefined) {
    result.amount = Number(profile.nativeBaseFee);
    result.basis = profile.feeModel === "protocol-zero" ? "zero protocol fee; PoW/service costs excluded" : "documented native base/minimum only; extras excluded";
  } else if (["ETH", "BSC", "HYPE", "AVAX"].includes(network?.hostChain || coin.chain) && profile?.feeModel === "gas") {
    const gasPrice = own(scenario.gasGwei, network?.hostChain || coin.chain);
    const units = record.native ? 21000 : own(scenario.tokenGas, coin.id);
    if (gasPrice !== undefined && units !== undefined) {
      result.amount = units * gasPrice / 1e9;
      result.basis = `${units} gas × user-entered ${gasPrice} gwei; ${record.native ? "simple native transfer" : "user-supplied token gas"}, not a quote`;
    }
  } else if (record.native && coin.chain === "BTC" && scenario.vbytes && scenario.satPerVbyte) {
    result.amount = scenario.vbytes * scenario.satPerVbyte / 1e8;
    result.basis = `${scenario.vbytes} vB × user-entered ${scenario.satPerVbyte} sat/vB; not a quote`;
  }
  if (result.amount !== null && (!Number.isFinite(result.amount) || result.amount > 1e15)) throw new RangeError("Fee scenario exceeds the numeric range");
  if (result.amount === 0) result.usd = 0; // protocol zero or explicitly entered scenario, never missing data
  else if (result.amount !== null && own(scenario.prices, result.asset) !== undefined) {
    result.usd = result.amount * scenario.prices[result.asset];
    if (!Number.isFinite(result.usd) || result.usd > 1e30) throw new RangeError("USD fee scenario exceeds the numeric range");
  }
  return result;
}

export function compareFeeEstimates(a, b) {
  const left = a.estimate.usd, right = b.estimate.usd;
  if (left === null && right !== null) return 1;
  if (right === null && left !== null) return -1;
  if (left !== null && right !== null && left !== right) return left - right;
  return a.coin.rank - b.coin.rank;
}
