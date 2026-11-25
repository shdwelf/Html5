import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import WavesExchange from "../src/components/WavesExchange";
import { EMPTY_PAPER_STATE, PAPER_SCALE, freshPaperBalances, formatPaperUnits, paperPriceUnits, placePaperOrder, paperReducer } from "../src/lib/paper-market";

const market = vi.hoisted(() => ({ rows: [
  { symbol: "BTC", name: "Bitcoin", price: 100, change24h: 0, history: [99, 100] },
  { symbol: "ETH", name: "Ethereum", price: 10, change24h: 0, history: [9, 10] },
] }));
vi.mock("../src/lib/market", () => ({
  useMarket: () => market.rows,
  Sparkline: () => <svg aria-hidden="true" data-testid="sample-chart" />,
}));
beforeEach(() => {
  localStorage.clear();
  market.rows = [
    { symbol: "BTC", name: "Bitcoin", price: 100, change24h: 0, history: [99, 100] },
    { symbol: "ETH", name: "Ethereum", price: 10, change24h: 0, history: [9, 10] },
  ];
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const start = () => fireEvent.click(screen.getByRole("button", { name: "Start paper portfolio" }));
const buy = () => fireEvent.click(screen.getByRole("button", { name: "Simulate buy WAVES" }));
const mustFill = (result: ReturnType<typeof placePaperOrder>) => {
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("bounded fixed-point paper model, not a wallet or fee estimator", () => {
  it("uses fresh virtual-only balances with no address or seed", () => {
    const first = freshPaperBalances(), second = freshPaperBalances();
    expect(first).toEqual({ CREDITS: 5000n * PAPER_SCALE, WAVES: 100n * PAPER_SCALE, BTC: 5_000_000n, ETH: 50_000_000n });
    first.WAVES = 0n; expect(second.WAVES).toBe(100n * PAPER_SCALE);
    expect(formatPaperUnits(1n)).toBe("0.00000001");
    expect(formatPaperUnits(150_000_000n)).toBe("1.5");
    expect(formatPaperUnits(0n)).toBe("0");
  });
  it("simulates a buy and sell without mutating the supplied portfolio", () => {
    const before = freshPaperBalances();
    const purchased = mustFill(placePaperOrder(before, "WAVES", "buy", "10", 1));
    expect(purchased.balances.CREDITS).toBe(4990n * PAPER_SCALE);
    expect(purchased.balances.WAVES).toBe(110n * PAPER_SCALE);
    expect(before).toEqual(freshPaperBalances());
    const sold = mustFill(placePaperOrder(purchased.balances, "WAVES", "sell", "10", 1));
    expect(sold.balances).toEqual(before);
  });
  it("accepts bounded fractional amounts and makes no credits through rounding", () => {
    const before = freshPaperBalances();
    const bought = mustFill(placePaperOrder(before, "BTC", "buy", "0.00000001", 1.12345678));
    expect(bought.cost).toBe(2n);
    const sold = mustFill(placePaperOrder(bought.balances, "BTC", "sell", "0.00000001", 1.12345678));
    expect(sold.cost).toBe(1n);
    expect(sold.balances.CREDITS).toBe(before.CREDITS - 1n);
    expect(placePaperOrder(before, "BTC", "sell", "0.00000001", 0.1).ok).toBe(false);
  });
  it("rejects zero, signed, exponent, nonfinite, malformed and overprecision input", () => {
    for (const amount of ["", "0", "0.00000000", "-1", "+1", "1e2", "1e309", "Infinity", "NaN", "0.000000001", "1,000", " 10 ", "10\n", "10\r", "10\r\n", "10\u2028", "1.5\n", "1000001", "1.", ".1"]) {
      expect(placePaperOrder(freshPaperBalances(), "WAVES", "buy", amount, 1).ok, amount).toBe(false);
    }
    expect(mustFill(placePaperOrder({ ...freshPaperBalances(), CREDITS: 2_000_000n * PAPER_SCALE }, "WAVES", "buy", "1000000", 1)).quantity).toBe(1_000_000n * PAPER_SCALE);
  });
  it("fails closed when prices are absent, nonfinite, below precision or outside the sample bound", () => {
    for (const price of [Number.NaN, Infinity, -Infinity, 0, -1, 0.000000001, 1_000_001]) {
      expect(paperPriceUnits(price)).toBeNull();
      expect(placePaperOrder(freshPaperBalances(), "BTC", "buy", "1", price).ok).toBe(false);
    }
    expect(paperPriceUnits(1_000_000)).toBe(1_000_000n * PAPER_SCALE);
  });
  it("refuses insufficient virtual funds or assets and leaves all balances intact", () => {
    const balances = freshPaperBalances();
    expect(placePaperOrder(balances, "WAVES", "buy", "5001", 1)).toEqual({ ok: false, error: "Not enough virtual credits for this practice buy." });
    expect(placePaperOrder(balances, "WAVES", "sell", "101", 1).ok).toBe(false);
    expect(balances).toEqual(freshPaperBalances());
  });
  it("cannot treat arbitrary assets, bad directions or malformed balances as a paper order", () => {
    for (const symbol of ["USDT", "__proto__", "DOGE", ""]) expect(placePaperOrder(freshPaperBalances(), symbol, "buy", "1", 1).ok).toBe(false);
    expect(placePaperOrder(freshPaperBalances(), "WAVES", "transfer", "1", 1).ok).toBe(false);
    for (const change of [{ WAVES: -1n }, { CREDITS: 10n ** 40n }, { BTC: Number.NaN }, { seed: "synthetic-legacy-marker" }]) {
      expect(placePaperOrder({ ...freshPaperBalances(), ...change } as ReturnType<typeof freshPaperBalances>, "WAVES", "buy", "1", 1).ok).toBe(false);
    }
  });
  it("serializes practice actions in the reducer and has explicit reset/end semantics", () => {
    const order = { type: "order", side: "buy", symbol: "WAVES", amount: "10", price: 1 } as const;
    expect(paperReducer(EMPTY_PAPER_STATE, order)).toBe(EMPTY_PAPER_STATE);
    const started = paperReducer(EMPTY_PAPER_STATE, { type: "start" });
    const twice = paperReducer(paperReducer(started, order), order);
    expect(twice.fills).toBe(2); expect(twice.balances?.WAVES).toBe(120n * PAPER_SCALE);
    const invalid = paperReducer(twice, { ...order, amount: "Infinity" });
    expect(invalid.balances).toBe(twice.balances); expect(invalid.fills).toBe(2);
    expect(paperReducer(twice, { type: "reset" }).balances).toEqual(freshPaperBalances());
    expect(paperReducer(twice, { type: "end" }).balances).toBeNull();
    expect(paperReducer(twice, { type: "end" }).notice).toMatch(/Nothing was submitted or saved/);
  });
});

describe("Waves practice UI", () => {
  it("discloses synthetic data and disables orders until a paper session is explicitly started", () => {
    render(<WavesExchange />);
    expect(screen.getByRole("heading", { name: "Waves market sandbox" })).toBeTruthy();
    expect(screen.getByText(/All prices, charts, balances and book levels here are synthetic/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Simulate buy WAVES" }).matches(":disabled")).toBe(true);
    expect(screen.queryByRole("button", { name: /create waves account|reveal.*seed/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Historical upstream release (external)" }).getAttribute("rel")).toBe("noopener noreferrer");
  });
  it("moves skip-link focus without changing the workbench codebase hash", () => {
    render(<WavesExchange />);
    const before = window.location.hash;
    fireEvent.click(screen.getByRole("link", { name: "Skip to practice order" }));
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Practice order" }));
    expect(window.location.hash).toBe(before);
  });
  it("works on the default WAVES pair even though the shared feed contains no WAVES ticker", () => {
    render(<WavesExchange />); start(); buy();
    expect(screen.getByTestId("paper-balance-WAVES").textContent).toBe("110");
    expect(screen.getByTestId("paper-balance-CREDITS").textContent).toBe("4990");
    expect(screen.getByRole("status").textContent).toMatch(/Nothing was submitted/);
    expect(screen.getByRole("table", { name: /Illustrative WAVES/ })).toBeTruthy();
  });
  it("has labeled pair/amount controls, pressed-state side buttons and visible virtual totals", () => {
    render(<WavesExchange />); start();
    fireEvent.change(screen.getByRole("combobox", { name: "Practice pair" }), { target: { value: "BTC" } });
    fireEvent.click(screen.getByRole("button", { name: "Practice sell" }));
    expect(screen.getByRole("button", { name: "Practice sell" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.change(screen.getByRole("textbox", { name: "Paper amount (BTC)" }), { target: { value: "0.05" } });
    fireEvent.click(screen.getByRole("button", { name: "Simulate sell BTC" }));
    expect(screen.getByTestId("paper-balance-BTC").textContent).toBe("0");
    expect(screen.getByTestId("paper-balance-CREDITS").textContent).toBe("5005");
  });
  it("shows inline validation, never alerts, and refuses invalid or unaffordable orders", () => {
    const alert = vi.spyOn(window, "alert");
    render(<WavesExchange />); start();
    const input = screen.getByRole("textbox", { name: "Paper amount (WAVES)" });
    for (const value of ["Infinity", "-1", "0", "999999"]) {
      fireEvent.change(input, { target: { value } });
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByRole("button", { name: "Simulate buy WAVES" }).matches(":disabled")).toBe(true);
    }
    expect(screen.getByTestId("paper-balance-CREDITS").textContent).toBe("5000");
    expect(alert).not.toHaveBeenCalled();
  });
  it("handles a selected ticker disappearing without dereferencing undefined history or accepting an order", () => {
    const view = render(<WavesExchange />); start();
    fireEvent.change(screen.getByRole("combobox", { name: "Practice pair" }), { target: { value: "BTC" } });
    market.rows = []; view.rerender(<WavesExchange />);
    expect(screen.getByText(/Practice price unavailable/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Simulate buy BTC" }).matches(":disabled")).toBe(true);
    expect(screen.getByText(/No book is displayed/)).toBeTruthy();
  });
  it("resets or ends only the in-memory paper session and never leaves a session on remount", () => {
    render(<WavesExchange />); start(); buy();
    fireEvent.click(screen.getByRole("button", { name: "Reset paper balances" }));
    expect(screen.getByTestId("paper-balance-WAVES").textContent).toBe("100");
    fireEvent.click(screen.getByRole("button", { name: "End practice session" }));
    expect(screen.queryByTestId("paper-balance-WAVES")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/Nothing was submitted or saved/);
    start(); buy(); cleanup(); render(<WavesExchange />);
    expect(screen.getByRole("button", { name: "Start paper portfolio" })).toBeTruthy();
  });
  it("does not read, overwrite, remove or disclose an existing legacy record and sends no network requests", () => {
    const legacy = JSON.stringify({ seed: "synthetic-legacy-marker", address: "not-a-real-account" });
    localStorage.setItem("waves_acc_v1", legacy);
    const storage = ["getItem", "setItem", "removeItem", "clear"].map((name) => vi.spyOn(Storage.prototype, name as "getItem"));
    const fetch = vi.fn(() => { throw new Error("No network allowed"); }); vi.stubGlobal("fetch", fetch);
    render(<WavesExchange />); start(); buy();
    fireEvent.click(screen.getByRole("button", { name: "Reset paper balances" }));
    fireEvent.click(screen.getByRole("button", { name: "End practice session" }));
    for (const spy of storage) expect(spy).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled(); expect(screen.queryByText("synthetic-legacy-marker")).toBeNull();
    for (const spy of storage) spy.mockRestore();
    expect(localStorage.getItem("waves_acc_v1")).toBe(legacy);
  });
  it("keeps the maintained screen and its navigation honestly labeled and free of wallet/storage/network operations", () => {
    const source = readFileSync("src/components/WavesExchange.tsx", "utf8") + readFileSync("src/lib/paper-market.ts", "utf8");
    expect(source).not.toMatch(/WORDLIST|Math\.random|localStorage\.|sessionStorage\.|indexedDB|fetch\s*\(|WebSocket|crypto\.subtle|genWavesAccount|revealSeed/);
    expect(readFileSync("src/App.tsx", "utf8")).toContain('id: "waves", label: "Waves practice"');
    expect(source).toContain(".hts"); expect(source).toContain("has not been identified");
  });
});
