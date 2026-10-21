import { describe, expect, it } from "vitest";
import { applyTrade, emptyBook, unrealizedPnL } from "./demoPortfolio";
import { feedbackAfterTrade, pickCoach, pnlWords } from "./decisionCoach";

describe("decision coach", () => {
  it("shows a first-visit walk on the market floor", () => {
    const card = pickCoach({ lang: "en", path: "home" }, []);
    expect(card?.id).toBe("first-visit");
    expect(card?.body.toLowerCase()).toMatch(/pretend|virtual|slice/);
  });

  it("warns that a rising price is not a promise", () => {
    const card = pickCoach({ lang: "en", path: "terminal", changePct: 4, tradeCount: 2, compared: true }, [
      "first-trade",
    ]);
    expect(card?.id).toBe("rising-price");
    expect(card?.body.toLowerCase()).toMatch(/not mean/);
    expect(card?.body.toLowerCase()).not.toMatch(/guaranteed profit/);
  });

  it("flags concentration on a large buy", () => {
    const card = pickCoach(
      { lang: "en", path: "terminal", concentration: 55, side: "buy", compared: true, tradeCount: 1 },
      ["first-trade", "compare", "rising-price", "falling-price"],
    );
    expect(card?.id).toBe("concentration");
  });

  it("praises reducing after a warning", () => {
    const text = feedbackAfterTrade("en", {
      reducedAfterWarning: true,
      concentration: 50,
      dropSell: false,
      why: "company-note",
      support: "note-and-chart",
      reflect: "calm",
    });
    expect(text.toLowerCase()).toMatch(/fewer|pause|habit/);
  });
});

describe("practice pnl", () => {
  it("records realized loss on a sell below average", () => {
    const bought = applyTrade(emptyBook(), { side: "buy", ticker: "SUNTEA", shares: 10, price: 100 });
    expect(bought.ok).toBe(true);
    if (!bought.ok) {
      return;
    }
    const sold = applyTrade(bought.book, { side: "sell", ticker: "SUNTEA", shares: 10, price: 90 });
    expect(sold.ok).toBe(true);
    if (!sold.ok) {
      return;
    }
    expect(sold.book.trades[0]?.realized).toBe(-100);
    expect(unrealizedPnL(sold.book, { SUNTEA: 90 })).toBe(0);
  });

  it("does not invent a live price in copy", () => {
    expect(pnlWords("en", "unrealized", 250).toLowerCase()).toMatch(/pretend|practice|paper/);
  });
});
