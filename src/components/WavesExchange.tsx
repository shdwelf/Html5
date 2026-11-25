import { useReducer, useState } from "react";
import { useMarket, Sparkline, type Ticker } from "../lib/market";
import {
  EMPTY_PAPER_STATE, PAPER_ASSETS, formatPaperUnits, paperPriceUnits,
  paperReducer, placePaperOrder, type PaperSide,
} from "../lib/paper-market";

// An explicit illustrative price, not a fabricated current WAVES quote. The
// shared offline feed has BTC/ETH but does not currently include WAVES.
const SAMPLE_WAVES: Ticker = {
  symbol: "WAVES", name: "Waves (practice only)", price: 1, change24h: 0,
  history: [0.99, 1.01, 0.98, 1.02, 1],
};
const panel = "min-w-0 rounded-xl border border-zinc-700 bg-zinc-900/60 p-5";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";

export default function WavesExchange() {
  const feed = useMarket(2000);
  const market = [SAMPLE_WAVES, ...feed.filter((ticker) => ticker.symbol === "BTC" || ticker.symbol === "ETH")];
  const [state, dispatch] = useReducer(paperReducer, EMPTY_PAPER_STATE);
  const [pair, setPair] = useState("WAVES");
  const [side, setSide] = useState<PaperSide>("buy");
  const [amount, setAmount] = useState("10");
  const ticker = market.find((item) => item.symbol === pair);
  const price = ticker?.price ?? Number.NaN;
  const priceUnits = paperPriceUnits(price);
  const assessment = state.balances ? placePaperOrder(state.balances, pair, side, amount, price) : null;
  const chart = ticker?.history?.filter((value) => Number.isFinite(value)) ?? [];
  const ready = assessment?.ok === true;
  const levels = (direction: number) => priceUnits === null ? [] : Array.from({ length: 5 }, (_, i) => ({
    price: priceUnits * BigInt(10_000 + direction * (i + 1) * 8) / 10_000n,
    amount: 15 + i * 23,
  }));

  return (
    <section aria-labelledby="waves-practice-title" className="space-y-5">
      <a href="#paper-order" onClick={(event) => {
        // The parent workbench uses the URL hash to choose a codebase. Move
        // keyboard focus locally instead of accidentally leaving the suite.
        event.preventDefault();
        document.getElementById("paper-order")?.focus();
      }} className={`sr-only focus:not-sr-only ${focus}`}>Skip to practice order</a>
      <header className="rounded-xl border border-cyan-700/60 bg-cyan-950/30 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Offline practice · no real funds</p>
        <h2 id="waves-practice-title" className="mt-2 text-2xl font-semibold text-zinc-50">Waves market sandbox</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-200">
          Learn the shape of an order with paper assets and virtual credits. All prices, charts,
          balances and book levels here are synthetic. This is not a Waves wallet or exchange;
          it cannot create an account, receive deposits, connect a wallet or submit an order.
        </p>
        <p className="mt-2 text-sm text-cyan-200">The WAVES example starts at 1 virtual credit, not a current market price.</p>
      </header>

      <p role="status" aria-live="polite" className="min-h-6 text-sm leading-6 text-zinc-200">
        {state.notice || "Start a paper portfolio to practice. No seed phrase, address or account is needed."}
      </p>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <section aria-labelledby="paper-portfolio-title" className={`${panel} space-y-4`}>
          <h3 id="paper-portfolio-title" className="text-lg font-semibold">Paper portfolio</h3>
          <p className="text-sm leading-6 text-zinc-300">Session memory only. Leaving this screen or reloading ends the practice session.</p>
          {state.balances ? (
            <>
              <dl className="space-y-3">
                {(["CREDITS", ...PAPER_ASSETS] as const).map((symbol) => (
                  <div key={symbol} className="flex flex-wrap justify-between gap-2 border-b border-zinc-800 pb-2 text-sm">
                    <dt className="text-zinc-300">{symbol === "CREDITS" ? "Virtual credits" : `Paper ${symbol}`}</dt>
                    <dd className="break-all font-mono text-zinc-100" data-testid={`paper-balance-${symbol}`}>
                      {formatPaperUnits(state.balances![symbol])}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-zinc-300">Simulated fills this session: <strong>{state.fills}</strong></p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => dispatch({ type: "reset" })}
                  className={`rounded-lg border border-zinc-500 px-3 py-2 text-sm hover:bg-zinc-800 ${focus}`}>Reset paper balances</button>
                <button type="button" onClick={() => dispatch({ type: "end" })}
                  className={`rounded-lg px-3 py-2 text-sm text-zinc-300 underline underline-offset-4 ${focus}`}>End practice session</button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => dispatch({ type: "start" })}
              className={`w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-zinc-950 hover:bg-cyan-300 ${focus}`}>Start paper portfolio</button>
          )}
          <details className="rounded-lg border border-zinc-700 p-3 text-sm leading-6 text-zinc-300">
            <summary className={`cursor-pointer font-medium text-zinc-100 ${focus}`}>About earlier browser records</summary>
            <p className="mt-2">An older demo may have saved a record under <code>waves_acc_v1</code>.
              This screen does not read, overwrite or delete it. That demo record is not proof of a valid
              Waves account. Do not deposit funds or paste a real recovery phrase here.</p>
          </details>
        </section>

        <section id="paper-order" tabIndex={-1} aria-labelledby="paper-order-title" className={`${panel} space-y-4 ${focus}`}>
          <h3 id="paper-order-title" className="text-lg font-semibold">Practice order</h3>
          <p className="text-sm leading-6 text-zinc-300">Immediate simulated fills only: no matcher, real liquidity, trading fee or network fee is modeled.</p>
          <form onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "order", symbol: pair, side, amount, price });
          }}>
            <fieldset disabled={!state.balances} className="space-y-4 disabled:opacity-60">
              <legend className="sr-only">Configure a paper trade</legend>
              <label className="block space-y-2 text-sm">
                <span>Practice pair</span>
                <select value={pair} onChange={(event) => setPair(event.target.value)}
                  className={`w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 ${focus}`}>
                  {market.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} / virtual credits</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Practice order side">
                {(["buy", "sell"] as const).map((value) => <button type="button" key={value} aria-pressed={side === value}
                  onClick={() => setSide(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${side === value ? "border-cyan-300 bg-cyan-400 text-zinc-950" : "border-zinc-600 text-zinc-200"} ${focus}`}>
                  {value === "buy" ? "Practice buy" : "Practice sell"}
                </button>)}
              </div>
              <label className="block space-y-2 text-sm">
                <span>Paper amount ({pair})</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" maxLength={16}
                  autoComplete="off" spellCheck={false} aria-describedby="paper-amount-help paper-order-feedback"
                  aria-invalid={assessment !== null && !assessment.ok}
                  className={`w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 font-mono ${focus}`} />
              </label>
              <p id="paper-amount-help" className="text-xs leading-5 text-zinc-400">Positive decimals, up to eight places; maximum 1,000,000 paper units.</p>
              <dl className="space-y-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><dt>Sample price</dt><dd className="font-mono">{priceUnits === null ? "Unavailable" : `${formatPaperUnits(priceUnits)} credits`}</dd></div>
                <div className="flex flex-wrap justify-between gap-2"><dt>Practice total</dt><dd className="font-mono">{assessment?.ok ? `${formatPaperUnits(assessment.cost)} credits` : "—"}</dd></div>
              </dl>
              <p id="paper-order-feedback" className="min-h-10 text-sm leading-5 text-amber-200">
                {assessment && !assessment.ok ? assessment.error : "Virtual units only. No transaction will be sent."}
              </p>
              <button type="submit" disabled={!ready}
                className={`w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-zinc-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300 ${focus}`}>
                Simulate {side} {pair}
              </button>
            </fieldset>
          </form>
          {!state.balances && <p className="text-sm text-cyan-200">Start a paper portfolio to enable the practice controls.</p>}
        </section>

        <section aria-labelledby="sample-book-title" className={`${panel} space-y-4`}>
          <h3 id="sample-book-title" className="text-lg font-semibold">Illustrative order book</h3>
          <p className="text-sm leading-6 text-zinc-300">Fixed example sizes around the sample price. These are not market orders or available liquidity.</p>
          {chart.length > 1 && <div role="img" aria-label={`Synthetic ${pair} price illustration; not historical market data`}>
            <Sparkline data={chart} w={180} h={40} />
          </div>}
          {priceUnits === null ? <p className="text-sm text-amber-200">Sample price unavailable. No book is displayed.</p> : (
            <table className="w-full table-fixed text-right text-xs">
              <caption className="sr-only">Illustrative {pair} levels in virtual credits</caption>
              <thead><tr className="border-b border-zinc-700 text-zinc-300"><th scope="col" className="py-2 text-left">Side</th><th scope="col">Credits</th><th scope="col">Paper units</th></tr></thead>
              <tbody>
                {[...levels(1).reverse().map((row) => ({ ...row, side: "Ask" })), ...levels(-1).map((row) => ({ ...row, side: "Bid" }))].map((row, i) => (
                  <tr key={i}><th scope="row" className={`py-1.5 text-left font-normal ${row.side === "Ask" ? "text-rose-300" : "text-emerald-300"}`}>{row.side}</th>
                    <td className="break-all font-mono text-zinc-100">{formatPaperUnits(row.price)}</td><td className="font-mono text-zinc-300">{row.amount}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs leading-5 text-zinc-400">Paper quantities and credits use eight decimal places. Buy totals round up; sell totals round down. This is not a real fee estimate.</p>
        </section>
      </div>
      <footer className="text-sm leading-6 text-zinc-400">
        This educational screen is not the historical Waves Lite Client. The reported <code>.hts</code> file has not been identified.
        {" "}<a href="https://github.com/wavesplatform/WavesGUI/releases/tag/v0.5.18" target="_blank" rel="noopener noreferrer"
          className={`text-cyan-300 underline underline-offset-4 ${focus}`}>Historical upstream release (external)</a>.
        Archived wallet software is not recommended for real keys or funds.
      </footer>
    </section>
  );
}
