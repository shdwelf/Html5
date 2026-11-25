/** In-memory teaching model only. These are virtual units, not token amounts,
 * Waves cryptography, a wallet, a matching engine or transaction estimates.
 */
export const PAPER_SCALE = 100_000_000n;
export const PAPER_ASSETS = ["WAVES", "BTC", "ETH"] as const;
export type PaperAsset = typeof PAPER_ASSETS[number];
export type PaperSide = "buy" | "sell";
export type PaperBalances = Record<PaperAsset | "CREDITS", bigint>;
const MAX_UNITS = 1_000_000_000_000n * PAPER_SCALE;
const INITIAL: Readonly<PaperBalances> = Object.freeze({
  CREDITS: 5_000n * PAPER_SCALE, WAVES: 100n * PAPER_SCALE,
  BTC: 5_000_000n, ETH: 50_000_000n,
});
export const freshPaperBalances = (): PaperBalances => ({ ...INITIAL });
export function formatPaperUnits(value: bigint): string {
  const whole = value / PAPER_SCALE;
  const fraction = (value % PAPER_SCALE).toString().padStart(8, "0").replace(/0+$/, "");
  return whole.toString() + (fraction ? "." + fraction : "");
}
export function paperPriceUnits(price: number): bigint | null {
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) return null;
  const units = Math.round(price * Number(PAPER_SCALE));
  return Number.isSafeInteger(units) && units > 0 ? BigInt(units) : null;
}
function amountUnits(amount: string): bigint | null {
  if (!/^\d{1,7}(?:\.\d{1,8})?$/.test(amount)) return null;
  const [whole, fraction = ""] = amount.split(".");
  const units = BigInt(whole) * PAPER_SCALE + BigInt(fraction.padEnd(8, "0"));
  return units > 0 && units <= 1_000_000n * PAPER_SCALE ? units : null;
}
type PaperResult = { ok: true; balances: PaperBalances; cost: bigint; quantity: bigint }
  | { ok: false; error: string };
export function placePaperOrder(balances: PaperBalances, symbol: string, side: string, amount: string, price: number): PaperResult {
  if (!(PAPER_ASSETS as readonly string[]).includes(symbol) || !["buy", "sell"].includes(side)) {
    return { ok: false, error: "Choose a supported practice asset and side." };
  }
  if (Object.keys(balances).length !== 4 || Object.values(balances).some((n) => typeof n !== "bigint" || n < 0n || n > MAX_UNITS)
    || !["CREDITS", ...PAPER_ASSETS].every((key) => Object.prototype.hasOwnProperty.call(balances, key))) {
    return { ok: false, error: "Invalid paper portfolio. Reset the practice session." };
  }
  const quantity = amountUnits(amount), scaledPrice = paperPriceUnits(price);
  if (quantity === null) return { ok: false, error: "Enter a positive decimal up to 1,000,000 with at most eight decimal places." };
  if (scaledPrice === null) return { ok: false, error: "Practice price unavailable. No order was simulated." };
  // Buy rounds up and sell rounds down to one virtual credit unit. This keeps
  // tiny practice orders from creating credits through rounding, not a fee model.
  const product = quantity * scaledPrice;
  const cost = (product + (side === "buy" ? PAPER_SCALE - 1n : 0n)) / PAPER_SCALE;
  if (cost <= 0n || cost > MAX_UNITS) return { ok: false, error: "Order is outside the practice precision or size limit." };
  const asset = symbol as PaperAsset;
  if (side === "buy" && balances.CREDITS < cost) return { ok: false, error: "Not enough virtual credits for this practice buy." };
  if (side === "sell" && balances[asset] < quantity) return { ok: false, error: `Not enough paper ${asset} for this practice sell.` };
  const next = { ...balances,
    CREDITS: balances.CREDITS + (side === "buy" ? -cost : cost),
    [asset]: balances[asset] + (side === "buy" ? quantity : -quantity),
  };
  if (Object.values(next).some((n) => n > MAX_UNITS)) return { ok: false, error: "Practice portfolio size limit reached." };
  return { ok: true, balances: next, cost, quantity };
}

export interface PaperState { balances: PaperBalances | null; fills: number; notice: string }
export const EMPTY_PAPER_STATE: PaperState = { balances: null, fills: 0, notice: "" };
export type PaperAction = { type: "start" | "reset" | "end" }
  | { type: "order"; symbol: string; side: PaperSide; amount: string; price: number };
export function paperReducer(state: PaperState, action: PaperAction): PaperState {
  if (action.type === "end") return { balances: null, fills: 0, notice: "Practice session ended. Nothing was submitted or saved." };
  if (action.type === "start" || action.type === "reset") return {
    balances: freshPaperBalances(), fills: 0, notice: "Fresh paper portfolio. Virtual units only; nothing is saved after leaving this screen.",
  };
  if (!state.balances || action.type !== "order") return state;
  const order = placePaperOrder(state.balances, action.symbol, action.side, action.amount, action.price);
  if (!order.ok) return { ...state, notice: order.error };
  return { balances: order.balances, fills: state.fills + 1,
    notice: `Practice ${action.side}: ${formatPaperUnits(order.quantity)} paper ${action.symbol} for ${formatPaperUnits(order.cost)} virtual credits. Nothing was submitted.` };
}
