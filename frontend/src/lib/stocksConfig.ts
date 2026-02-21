// Single source of truth for available stocks — shared between stocks and simulate-stock pages

export const SYMBOL_MAP: Record<string, string> = {
  SPY: "spy.us",
  QQQ: "qqq.us",
  BND: "bnd.us",
};

export const TICKER_INFO: Record<string, { name: string; description: string }> = {
  SPY: {
    name: "S&P 500 ETF",
    description: "Tracks the 500 largest US companies. The benchmark for the US market.",
  },
  QQQ: {
    name: "Nasdaq 100 ETF",
    description: "Top 100 non-financial Nasdaq companies, heavy on tech and growth.",
  },
  BND: {
    name: "Total Bond Market ETF",
    description: "Diversified US bond exposure. Lower risk, steady income.",
  },
};
