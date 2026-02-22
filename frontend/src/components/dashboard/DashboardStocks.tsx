"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStocks } from "@/lib/api";
import type { StockData, StocksResult, T212Position } from "@/types";

// Top 3 popular non-ETF stocks from the catalog
const TOP_STOCKS = [
  { symbol: "aapl.us", ticker: "AAPL", name: "Apple", risk: "medium" as const },
  { symbol: "msft.us", ticker: "MSFT", name: "Microsoft", risk: "medium" as const },
  { symbol: "nvda.us", ticker: "NVDA", name: "NVIDIA", risk: "high" as const },
];

const RISK_STYLE = {
  low: "bg-emerald-500/15 text-emerald-600",
  medium: "bg-amber-500/15 text-amber-600",
  high: "bg-rose-500/15 text-rose-600",
};

// The API may key results by ticker, symbol, or a variant — check all of them
function findStockData(
  stocks: StocksResult,
  symbol: string,
  ticker: string
): StockData | undefined {
  // Try the most likely key formats
  const candidates = [
    symbol,
    symbol.toLowerCase(),
    ticker,
    ticker.toUpperCase(),
    ticker.toLowerCase(),
  ];
  for (const key of candidates) {
    if (stocks[key]) return stocks[key];
  }
  // Fallback: case-insensitive scan of all keys
  const lowerSymbol = symbol.toLowerCase();
  const lowerTicker = ticker.toLowerCase();
  for (const [key, val] of Object.entries(stocks)) {
    const k = key.toLowerCase();
    if (k === lowerSymbol || k === lowerTicker) return val;
  }
  return undefined;
}

interface T212Cache {
  positions: T212Position[];
  cash: { free: number };
  fetchedAt: number;
}

function loadT212Cache(): T212Cache | null {
  try {
    const raw = localStorage.getItem("finbar.t212.cache");
    return raw ? (JSON.parse(raw) as T212Cache) : null;
  } catch {
    return null;
  }
}

function hasT212Creds(): boolean {
  try {
    return !!localStorage.getItem("finbar.t212");
  } catch {
    return false;
  }
}

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-IE", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function DashboardStocks() {
  const [stocks, setStocks] = useState<StocksResult | null>(null);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState(false);
  const [portfolio, setPortfolio] = useState<T212Cache | null>(null);
  const [connected, setConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPortfolio(loadT212Cache());
    setConnected(hasT212Creds());
  }, []);

  useEffect(() => {
    getStocks(TOP_STOCKS.map((s) => s.symbol))
      .then(setStocks)
      .catch(() => setStocksError(true))
      .finally(() => setStocksLoading(false));
  }, []);

  const topPositions: T212Position[] = portfolio?.positions
    ? [...portfolio.positions]
        .sort(
          (a, b) => b.currentPrice * b.quantity - a.currentPrice * a.quantity
        )
        .slice(0, 4)
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Trending Now ── */}
      <div className="app-panel rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            Trending Now
          </h2>
          <span className="text-[10px] text-[var(--muted-ink)]">Most popular</span>
        </div>

        {stocksLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--brand-soft)] border-t-[var(--brand)]" />
          </div>
        ) : (
          <div className="space-y-2">
            {TOP_STOCKS.map(({ symbol, ticker, name, risk }) => {
              const data = stocks
                ? findStockData(stocks, symbol, ticker)
                : undefined;
              const prices = data?.prices ?? [];
              const latest = prices[prices.length - 1];
              const prev = prices[prices.length - 2];
              const change =
                latest != null && prev != null && prev !== 0
                  ? ((latest - prev) / prev) * 100
                  : null;
              const isUp = change !== null && change >= 0;

              return (
                <div
                  key={symbol}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--ink)]">
                          {ticker}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_STYLE[risk]}`}
                        >
                          {risk}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[var(--muted-ink)]">
                        {name}
                      </div>
                      {stocksError && (
                        <div className="mt-1 text-[10px] text-[var(--muted-ink)]">
                          Live price unavailable
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {latest != null ? (
                        <>
                          <div className="font-bold text-[var(--ink)]">
                            ${fmt(latest)}
                          </div>
                          {change !== null && (
                            <div
                              className={`text-xs font-semibold ${isUp ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-[var(--muted-ink)]">
                          {stocksLoading ? "…" : "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Link
          href="/stocks"
          className="mt-4 block text-center text-xs font-semibold text-[var(--brand)] hover:underline"
        >
          Explore all stocks →
        </Link>
      </div>

      {/* ── My Portfolio ── */}
      <div className="app-panel rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            My Portfolio
          </h2>
          {connected && (
            <span className="text-[10px] text-[var(--muted-ink)]">
              Trading 212
            </span>
          )}
        </div>

        {!mounted ? null : topPositions.length > 0 ? (
          /* Has cached portfolio data — show it */
          <div className="space-y-2">
            {topPositions.map((p) => {
              const value = p.currentPrice * p.quantity;
              const cost = p.averagePrice * p.quantity;
              const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
              const isUp = pct >= 0;
              const ticker = p.ticker.replace(/_[A-Z]+_EQ$/, "");

              return (
                <div
                  key={p.ticker}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--ink)]">{ticker}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted-ink)]">
                        {fmt(p.quantity, 4)} shares · avg €{fmt(p.averagePrice)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-[var(--ink)]">
                        €{fmt(value)}
                      </div>
                      <div
                        className={`text-xs font-semibold ${isUp ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link
              href="/portfolio"
              className="mt-2 block text-center text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              View full portfolio →
            </Link>
          </div>
        ) : connected ? (
          /* Credentials exist but cache is empty — prompt to open portfolio page */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 text-3xl">🔄</div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              Portfolio connected
            </p>
            <p className="mt-1 max-w-[220px] text-xs text-[var(--muted-ink)]">
              Open your portfolio page to sync your latest positions here.
            </p>
            <Link
              href="/portfolio"
              className="mt-4 rounded-2xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              Open Portfolio →
            </Link>
          </div>
        ) : (
          /* Not connected at all */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 text-4xl">📊</div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              No portfolio connected
            </p>
            <p className="mt-1 max-w-[200px] text-xs text-[var(--muted-ink)]">
              Link your Trading 212 account to see your live positions here.
            </p>
            <Link
              href="/portfolio"
              className="mt-4 rounded-2xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              Connect Portfolio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
