"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getStocks } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { StocksResult } from "@/types";

const StocksChart = dynamic(() => import("@/components/StocksChart"), {
  ssr: false,
});

const ETF_SYMBOLS = ["spy.us", "qqq.us", "vti.us"];

const ETF_META: Record<string, { ticker: string; label: string }> = {
  "spy.us": { ticker: "SPY", label: "S&P 500" },
  "qqq.us": { ticker: "QQQ", label: "Nasdaq 100" },
  "vti.us": { ticker: "VTI", label: "Total Market" },
};

const LEGEND_COLORS = ["#0b84d8", "#16a34a", "#f97316"];

export function DashboardCharts() {
  const [stocks, setStocks] = useState<StocksResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStocks(ETF_SYMBOLS)
      .then(setStocks)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!stocks) return null;
    const entries = Object.entries(stocks).filter(
      ([, d]) => d.dates.length > 1 && d.normalised.length > 1
    );
    return entries.length > 0 ? Object.fromEntries(entries) : null;
  }, [stocks]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Top ETF Performance</CardTitle>
          <div className="flex items-center gap-4">
            {ETF_SYMBOLS.map((sym, i) => (
              <span
                key={sym}
                className="flex items-center gap-1.5 text-xs text-[var(--muted-ink)]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: LEGEND_COLORS[i] }}
                />
                {ETF_META[sym]?.ticker}
                <span className="hidden sm:inline">
                  — {ETF_META[sym]?.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-soft)] border-t-[var(--brand)]" />
          </div>
        ) : error || !chartData ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-ink)]">
            ETF data unavailable — is the backend running?
          </div>
        ) : (
          <StocksChart stocks={chartData} />
        )}
      </CardContent>
    </Card>
  );
}
