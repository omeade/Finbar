export type StockRisk = "low" | "medium" | "high";
export type StockGroup = "all" | "popular" | "low-risk" | "high-risk" | "etf";

export interface StockCatalogItem {
  symbol: string;
  ticker: string;
  name: string;
  risk: StockRisk;
  groups: Exclude<StockGroup, "all">[];
}

export const STOCK_GROUP_OPTIONS: { id: StockGroup; label: string; note: string }[] = [
  { id: "all", label: "Top 100", note: "Broad list of widely followed names." },
  { id: "popular", label: "Popular", note: "Frequently discussed large caps." },
  { id: "low-risk", label: "Lower Risk", note: "Defensive and steadier profiles." },
  { id: "high-risk", label: "Higher Risk", note: "Higher-volatility growth names." },
  { id: "etf", label: "ETFs", note: "Diversified index and sector funds." },
];

export const STOCK_CATALOG: StockCatalogItem[] = [
  { symbol: "spy.us", ticker: "SPY", name: "SPDR S&P 500 ETF", risk: "low", groups: ["etf", "popular", "low-risk"] },
  { symbol: "qqq.us", ticker: "QQQ", name: "Invesco QQQ Trust", risk: "medium", groups: ["etf", "popular"] },
  { symbol: "vti.us", ticker: "VTI", name: "Vanguard Total Stock Market ETF", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "voo.us", ticker: "VOO", name: "Vanguard S&P 500 ETF", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "ive.us", ticker: "IVE", name: "iShares S&P 500 Value ETF", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "ivv.us", ticker: "IVV", name: "iShares Core S&P 500 ETF", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "dia.us", ticker: "DIA", name: "SPDR Dow Jones Industrial ETF", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "bnd.us", ticker: "BND", name: "Vanguard Total Bond Market ETF", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "xlf.us", ticker: "XLF", name: "Financial Select Sector SPDR", risk: "medium", groups: ["etf"] },
  { symbol: "xle.us", ticker: "XLE", name: "Energy Select Sector SPDR", risk: "high", groups: ["etf", "high-risk"] },
  { symbol: "xlp.us", ticker: "XLP", name: "Consumer Staples Select Sector SPDR", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "xlu.us", ticker: "XLU", name: "Utilities Select Sector SPDR", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "xli.us", ticker: "XLI", name: "Industrial Select Sector SPDR", risk: "medium", groups: ["etf"] },
  { symbol: "xlv.us", ticker: "XLV", name: "Health Care Select Sector SPDR", risk: "low", groups: ["etf", "low-risk"] },
  { symbol: "xly.us", ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR", risk: "high", groups: ["etf", "high-risk"] },
  { symbol: "aapl.us", ticker: "AAPL", name: "Apple", risk: "medium", groups: ["popular"] },
  { symbol: "msft.us", ticker: "MSFT", name: "Microsoft", risk: "medium", groups: ["popular"] },
  { symbol: "nvda.us", ticker: "NVDA", name: "NVIDIA", risk: "high", groups: ["popular", "high-risk"] },
  { symbol: "amzn.us", ticker: "AMZN", name: "Amazon", risk: "medium", groups: ["popular"] },
  { symbol: "meta.us", ticker: "META", name: "Meta Platforms", risk: "high", groups: ["popular", "high-risk"] },
  { symbol: "goog.us", ticker: "GOOG", name: "Alphabet Class C", risk: "medium", groups: ["popular"] },
  { symbol: "tsla.us", ticker: "TSLA", name: "Tesla", risk: "high", groups: ["popular", "high-risk"] },
  { symbol: "brk-b.us", ticker: "BRK-B", name: "Berkshire Hathaway B", risk: "low", groups: ["popular", "low-risk"] },
  { symbol: "jpm.us", ticker: "JPM", name: "JPMorgan Chase", risk: "medium", groups: ["popular"] },
  { symbol: "v.us", ticker: "V", name: "Visa", risk: "low", groups: ["popular", "low-risk"] },
  { symbol: "ma.us", ticker: "MA", name: "Mastercard", risk: "medium", groups: ["popular"] },
  { symbol: "wmt.us", ticker: "WMT", name: "Walmart", risk: "low", groups: ["low-risk"] },
  { symbol: "cost.us", ticker: "COST", name: "Costco", risk: "low", groups: ["low-risk"] },
  { symbol: "ko.us", ticker: "KO", name: "Coca-Cola", risk: "low", groups: ["low-risk"] },
  { symbol: "pep.us", ticker: "PEP", name: "PepsiCo", risk: "low", groups: ["low-risk"] },
  { symbol: "mcd.us", ticker: "MCD", name: "McDonald's", risk: "low", groups: ["low-risk"] },
  { symbol: "jnj.us", ticker: "JNJ", name: "Johnson & Johnson", risk: "low", groups: ["low-risk"] },
  { symbol: "pfe.us", ticker: "PFE", name: "Pfizer", risk: "low", groups: ["low-risk"] },
  { symbol: "abbv.us", ticker: "ABBV", name: "AbbVie", risk: "low", groups: ["low-risk"] },
  { symbol: "mrk.us", ticker: "MRK", name: "Merck", risk: "low", groups: ["low-risk"] },
  { symbol: "unh.us", ticker: "UNH", name: "UnitedHealth Group", risk: "medium", groups: ["low-risk"] },
  { symbol: "hd.us", ticker: "HD", name: "Home Depot", risk: "medium", groups: ["popular"] },
  { symbol: "low.us", ticker: "LOW", name: "Lowe's", risk: "medium", groups: [] },
  { symbol: "pg.us", ticker: "PG", name: "Procter & Gamble", risk: "low", groups: ["low-risk"] },
  { symbol: "cl.us", ticker: "CL", name: "Colgate-Palmolive", risk: "low", groups: ["low-risk"] },
  { symbol: "orcl.us", ticker: "ORCL", name: "Oracle", risk: "medium", groups: ["popular"] },
  { symbol: "adbe.us", ticker: "ADBE", name: "Adobe", risk: "medium", groups: ["popular"] },
  { symbol: "crm.us", ticker: "CRM", name: "Salesforce", risk: "medium", groups: ["popular"] },
  { symbol: "csco.us", ticker: "CSCO", name: "Cisco", risk: "low", groups: ["low-risk"] },
  { symbol: "ibm.us", ticker: "IBM", name: "IBM", risk: "low", groups: ["low-risk"] },
  { symbol: "intc.us", ticker: "INTC", name: "Intel", risk: "medium", groups: [] },
  { symbol: "amd.us", ticker: "AMD", name: "Advanced Micro Devices", risk: "high", groups: ["high-risk", "popular"] },
  { symbol: "txn.us", ticker: "TXN", name: "Texas Instruments", risk: "low", groups: ["low-risk"] },
  { symbol: "avgo.us", ticker: "AVGO", name: "Broadcom", risk: "high", groups: ["high-risk"] },
  { symbol: "qcom.us", ticker: "QCOM", name: "Qualcomm", risk: "medium", groups: [] },
  { symbol: "amgn.us", ticker: "AMGN", name: "Amgen", risk: "low", groups: ["low-risk"] },
  { symbol: "gild.us", ticker: "GILD", name: "Gilead Sciences", risk: "low", groups: ["low-risk"] },
  { symbol: "lly.us", ticker: "LLY", name: "Eli Lilly", risk: "high", groups: ["high-risk", "popular"] },
  { symbol: "nke.us", ticker: "NKE", name: "Nike", risk: "medium", groups: [] },
  { symbol: "sbux.us", ticker: "SBUX", name: "Starbucks", risk: "medium", groups: [] },
  { symbol: "dis.us", ticker: "DIS", name: "Walt Disney", risk: "medium", groups: [] },
  { symbol: "nflx.us", ticker: "NFLX", name: "Netflix", risk: "high", groups: ["high-risk", "popular"] },
  { symbol: "pypl.us", ticker: "PYPL", name: "PayPal", risk: "high", groups: ["high-risk"] },
  { symbol: "shop.us", ticker: "SHOP", name: "Shopify", risk: "high", groups: ["high-risk"] },
  { symbol: "uber.us", ticker: "UBER", name: "Uber", risk: "high", groups: ["high-risk"] },
  { symbol: "lyft.us", ticker: "LYFT", name: "Lyft", risk: "high", groups: ["high-risk"] },
  { symbol: "snap.us", ticker: "SNAP", name: "Snap", risk: "high", groups: ["high-risk"] },
  { symbol: "pins.us", ticker: "PINS", name: "Pinterest", risk: "high", groups: ["high-risk"] },
  { symbol: "pltr.us", ticker: "PLTR", name: "Palantir", risk: "high", groups: ["high-risk", "popular"] },
  { symbol: "coin.us", ticker: "COIN", name: "Coinbase", risk: "high", groups: ["high-risk"] },
  { symbol: "sofi.us", ticker: "SOFI", name: "SoFi", risk: "high", groups: ["high-risk"] },
  { symbol: "rblx.us", ticker: "RBLX", name: "Roblox", risk: "high", groups: ["high-risk"] },
  { symbol: "ba.us", ticker: "BA", name: "Boeing", risk: "high", groups: ["high-risk"] },
  { symbol: "cat.us", ticker: "CAT", name: "Caterpillar", risk: "medium", groups: [] },
  { symbol: "de.us", ticker: "DE", name: "Deere & Company", risk: "medium", groups: [] },
  { symbol: "ge.us", ticker: "GE", name: "General Electric", risk: "medium", groups: [] },
  { symbol: "hon.us", ticker: "HON", name: "Honeywell", risk: "low", groups: ["low-risk"] },
  { symbol: "mmm.us", ticker: "MMM", name: "3M", risk: "low", groups: ["low-risk"] },
  { symbol: "cvx.us", ticker: "CVX", name: "Chevron", risk: "medium", groups: [] },
  { symbol: "xom.us", ticker: "XOM", name: "Exxon Mobil", risk: "medium", groups: [] },
  { symbol: "cop.us", ticker: "COP", name: "ConocoPhillips", risk: "high", groups: ["high-risk"] },
  { symbol: "slb.us", ticker: "SLB", name: "Schlumberger", risk: "high", groups: ["high-risk"] },
  { symbol: "bkng.us", ticker: "BKNG", name: "Booking Holdings", risk: "high", groups: ["high-risk"] },
  { symbol: "abnb.us", ticker: "ABNB", name: "Airbnb", risk: "high", groups: ["high-risk"] },
  { symbol: "mar.us", ticker: "MAR", name: "Marriott", risk: "medium", groups: [] },
  { symbol: "axp.us", ticker: "AXP", name: "American Express", risk: "medium", groups: [] },
  { symbol: "c.us", ticker: "C", name: "Citigroup", risk: "high", groups: ["high-risk"] },
  { symbol: "bac.us", ticker: "BAC", name: "Bank of America", risk: "medium", groups: [] },
  { symbol: "wfc.us", ticker: "WFC", name: "Wells Fargo", risk: "medium", groups: [] },
  { symbol: "gs.us", ticker: "GS", name: "Goldman Sachs", risk: "high", groups: ["high-risk"] },
  { symbol: "ms.us", ticker: "MS", name: "Morgan Stanley", risk: "high", groups: ["high-risk"] },
  { symbol: "blk.us", ticker: "BLK", name: "BlackRock", risk: "medium", groups: [] },
  { symbol: "spgi.us", ticker: "SPGI", name: "S&P Global", risk: "medium", groups: [] },
  { symbol: "mo.us", ticker: "MO", name: "Altria", risk: "medium", groups: ["low-risk"] },
  { symbol: "pm.us", ticker: "PM", name: "Philip Morris", risk: "medium", groups: ["low-risk"] },
  { symbol: "t.us", ticker: "T", name: "AT&T", risk: "low", groups: ["low-risk"] },
  { symbol: "vz.us", ticker: "VZ", name: "Verizon", risk: "low", groups: ["low-risk"] },
  { symbol: "tmus.us", ticker: "TMUS", name: "T-Mobile US", risk: "medium", groups: [] },
  { symbol: "cmcsa.us", ticker: "CMCSA", name: "Comcast", risk: "low", groups: ["low-risk"] },
  { symbol: "intu.us", ticker: "INTU", name: "Intuit", risk: "medium", groups: [] },
  { symbol: "adp.us", ticker: "ADP", name: "Automatic Data Processing", risk: "low", groups: ["low-risk"] },
  { symbol: "isrg.us", ticker: "ISRG", name: "Intuitive Surgical", risk: "high", groups: ["high-risk"] },
  { symbol: "regn.us", ticker: "REGN", name: "Regeneron", risk: "medium", groups: [] },
  { symbol: "mdt.us", ticker: "MDT", name: "Medtronic", risk: "low", groups: ["low-risk"] },
  { symbol: "syk.us", ticker: "SYK", name: "Stryker", risk: "medium", groups: [] },
  { symbol: "tm.us", ticker: "TM", name: "Toyota Motor ADR", risk: "low", groups: ["low-risk"] },
  { symbol: "sony.us", ticker: "SONY", name: "Sony Group ADR", risk: "medium", groups: [] },
  { symbol: "baba.us", ticker: "BABA", name: "Alibaba ADR", risk: "high", groups: ["high-risk"] },
  { symbol: "pdd.us", ticker: "PDD", name: "PDD Holdings ADR", risk: "high", groups: ["high-risk"] },
  { symbol: "jd.us", ticker: "JD", name: "JD.com ADR", risk: "high", groups: ["high-risk"] },
  { symbol: "nio.us", ticker: "NIO", name: "NIO ADR", risk: "high", groups: ["high-risk"] },
];

export function matchesGroup(item: StockCatalogItem, group: StockGroup): boolean {
  return group === "all" ? true : item.groups.includes(group);
}

export function searchCatalog(query: string): StockCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return STOCK_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.ticker.toLowerCase().includes(q) ||
      item.symbol.toLowerCase().includes(q)
  ).slice(0, 8);
}
