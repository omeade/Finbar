export const MARKET_SELECTION_STORAGE_KEY = "finbar.market.selectedSymbols";

export const DEFAULT_MARKET_SYMBOLS = ["spy.us", "qqq.us", "aapl.us", "msft.us", "nvda.us"];

function normalizeSymbols(symbols: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of symbols) {
    const value = raw.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    cleaned.push(value);
  }
  return cleaned;
}

export function loadMarketSelectedSymbols(fallback: string[] = DEFAULT_MARKET_SYMBOLS): string[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(MARKET_SELECTION_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    const normalized = normalizeSymbols(parsed.filter((item) => typeof item === "string"));
    return normalized.length ? normalized : fallback;
  } catch {
    return fallback;
  }
}

export function saveMarketSelectedSymbols(symbols: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeSymbols(symbols);
    window.localStorage.setItem(MARKET_SELECTION_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore persistence errors (private mode/storage restrictions).
  }
}
