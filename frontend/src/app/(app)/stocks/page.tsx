"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getStocks } from "@/lib/api";
import type { StocksResult } from "@/types";

const StocksChart = dynamic(() => import("@/components/StocksChart"), { ssr: false });

const TICKER_INFO: Record<string, { name: string; description: string }> = {
  SPY: { name: "S&P 500 ETF", description: "Tracks the 500 largest US companies. The benchmark for the US market." },
  QQQ: { name: "Nasdaq 100 ETF", description: "Top 100 non-financial Nasdaq companies, heavy on tech and growth." },
  BND: { name: "Total Bond Market ETF", description: "Diversified US bond exposure. Lower risk, steady income." },
};

export default function StocksPage() {
  const [stocks, setStocks] = useState<StocksResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    getStocks(["spy.us", "qqq.us", "bnd.us"])
      .then((data) => {
        setStocks(data);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      })
      .catch(() => setError("Could not load stock data. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
          Market Data
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Stock Agent</h1>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          Live ETF performance via Stooq · Normalised to base 100 for comparison
        </p>
        {lastUpdated ? (
          <div className="mt-2 text-xs text-[var(--muted-ink)]">
            Last updated: {lastUpdated}
          </div>
        ) : null}
      </section>

      {loading && (
        <div className="app-panel fade-up rounded-3xl p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-soft)] border-t-[var(--brand)] rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="app-panel fade-up rounded-3xl p-6 text-center text-sm text-[var(--muted-ink)]">
          {error}
        </div>
      )}

      {stocks && !loading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>1-Year Performance (Normalised to 100)</CardTitle>
            </CardHeader>
            <CardContent>
              <StocksChart stocks={stocks} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(stocks).map(([ticker, data]) => {
              const info = TICKER_INFO[ticker];
              const prices = data.prices;
              const latest = prices.at(-1) ?? 0;
              const first = prices[0] ?? 0;
              const change = first > 0 ? ((latest - first) / first) * 100 : 0;
              const positive = change >= 0;
              return (
                <div
                  key={ticker}
                  className="app-panel fade-up rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-ink)]">
                      {ticker}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        positive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {change.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-[var(--ink)]">
                    {info?.name ?? ticker}
                  </div>
                  <div className="text-sm font-bold text-[var(--ink)]">
                    ${latest.toFixed(2)}
                    <span className="text-xs font-normal text-[var(--muted-ink)] ml-1">latest</span>
                  </div>
                  <p className="text-xs text-[var(--muted-ink)] leading-relaxed">
                    {info?.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-[var(--muted-ink)] text-center">
            Data from Stooq · Educational purposes only · Not financial advice
          </div>
        </>
      )}
    </div>
  );
}
