import { useMemo, useState } from "react";
import { useMarket, Sparkline, fmt } from "../lib/market";
import {
  COINS,
  REGISTRY_META,
  searchRegistry,
  getCoin,
  deriveAddress,
  type CoinRow,
} from "../lib/coins";

const SCRIPT_FAMILIES = new Set(["p2pkh", "p2sh-p2wpkh", "p2wpkh", "p2tr"]);

function DerivePanel({ coin }: { coin: CoinRow }) {
  const [mnemonic, setMnemonic] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [account, setAccount] = useState(0);
  const [index, setIndex] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!mnemonic.trim()) return null;
    try {
      const d = deriveAddress(coin.id, mnemonic, {
        account,
        index,
        passphrase,
        ...(purpose ? { purpose: parseInt(purpose, 10) } : {}),
      });
      return { ok: true as const, ...d };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [coin.id, mnemonic, passphrase, account, index, purpose]);

  const copy = async () => {
    if (result?.ok) {
      await navigator.clipboard.writeText(result.address).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const num = (v: string, set: (n: number) => void) => {
    const n = parseInt(v, 10);
    set(Number.isInteger(n) && n >= 0 ? n : 0);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold text-zinc-100">
          Derive {coin.symbol} address
        </h3>
        <span className="font-mono text-xs text-zinc-500">
          {coin.family ?? "unsupported"} · SLIP-44 {coin.slip44 ?? "—"} ·{" "}
          {coin.path ?? coin.reason}
        </span>
      </div>
      {!coin.derive ? (
        <p className="mt-2 text-sm text-amber-400/90">{coin.reason}</p>
      ) : (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-zinc-500">
                Recovery phrase
              </span>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="abandon abandon … about"
                rows={2}
                spellCheck={false}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-zinc-500">
                Passphrase (optional)
              </span>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Account
                </span>
                <input
                  type="number"
                  min={0}
                  value={account}
                  onChange={(e) => num(e.target.value, setAccount)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Index
                </span>
                <input
                  type="number"
                  min={0}
                  value={index}
                  onChange={(e) => num(e.target.value, setIndex)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Purpose
                </span>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={!SCRIPT_FAMILIES.has(coin.family ?? "")}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 disabled:opacity-40"
                >
                  <option value="">default</option>
                  <option value="44">44 legacy</option>
                  <option value="49">49 wrapped</option>
                  <option value="84">84 segwit</option>
                  <option value="86">86 taproot</option>
                </select>
              </label>
            </div>
          </div>
          {result && result.ok && (
            <div className="mt-3 rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm break-all text-emerald-200">
                  {result.address}
                </span>
                <button
                  onClick={copy}
                  className="shrink-0 rounded-md border border-emerald-800 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-900/40"
                >
                  {copied ? "copied ✓" : "copy"}
                </button>
              </div>
              <div className="mt-1 font-mono text-xs text-zinc-500">
                {result.path} · {result.family}
              </div>
            </div>
          )}
          {result && !result.ok && (
            <p className="mt-3 text-sm text-rose-400">{result.error}</p>
          )}
        </>
      )}
      <p className="mt-2 text-xs text-zinc-600">
        Derivation runs locally in your browser — the phrase never leaves this
        page. Still, prefer a hardware wallet for real funds.
      </p>
    </div>
  );
}

export default function MarketData() {
  const tickers = useMarket(2000);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("btc-bitcoin");

  const filtered = useMemo(
    () => (query.trim() ? searchRegistry(query.trim()) : COINS),
    [query]
  );
  const selected = getCoin(selectedId) ?? COINS[0];
  const derivable = COINS.filter((c) => c.derive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Market Data</h2>
        <span className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          live feed
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3 text-right">Price (USDT)</th>
              <th className="px-4 py-3 text-right">24h</th>
              <th className="px-4 py-3 text-right">Chart</th>
            </tr>
          </thead>
          <tbody>
            {tickers.map((t) => {
              const up = t.change24h >= 0;
              return (
                <tr key={t.symbol} className="border-t border-zinc-800/70">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-100">{t.symbol}</div>
                    <div className="text-xs text-zinc-500">{t.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-200">
                    ${fmt(t.price)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      up ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {up ? "+" : ""}
                    {t.change24h.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Sparkline
                        data={t.history}
                        color={up ? "#34d399" : "#fb7185"}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-600">
        Offline simulated ticker (random-walk from the {REGISTRY_META.built}{" "}
        top-10 snapshot) so the app stays fully standalone.
      </p>

      <DerivePanel coin={selected} />

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-100">
          Top-500 registry{" "}
          <span className="text-xs font-normal text-zinc-500">
            {derivable}/500 derivable · snapshot {REGISTRY_META.built}
          </span>
        </h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter: sol, bitcoin, 60…"
          spellCheck={false}
          className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </div>
      <div className="max-h-[480px] overflow-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2 text-right">#</th>
              <th className="px-3 py-2">Asset</th>
              <th className="px-3 py-2">Chain</th>
              <th className="px-3 py-2">Family</th>
              <th className="px-3 py-2">Path</th>
              <th className="px-3 py-2 text-right">SLIP-44</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                title={c.derive ? c.id : c.reason ?? undefined}
                className={`cursor-pointer border-t border-zinc-800/70 hover:bg-zinc-800/40 ${
                  c.id === selectedId ? "bg-zinc-800/60" : ""
                } ${c.derive ? "" : "opacity-45"}`}
              >
                <td className="px-3 py-1.5 text-right font-mono text-zinc-500">
                  {c.rank}
                </td>
                <td className="px-3 py-1.5">
                  <span className="font-semibold text-zinc-100">
                    {c.symbol}
                  </span>{" "}
                  <span className="text-xs text-zinc-500">{c.name}</span>
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-zinc-400">
                  {c.chain ?? "—"}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-zinc-400">
                  {c.family ?? "—"}
                </td>
                <td className="px-3 py-1.5 font-mono text-xs text-zinc-400">
                  {c.path ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-xs text-zinc-400">
                  {c.slip44 ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
