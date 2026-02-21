"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getStocks, searchStock } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  matchesGroup,
  searchCatalog,
  STOCK_CATALOG,
  STOCK_GROUP_OPTIONS,
  type StockCatalogItem,
  type StockGroup,
  type StockRisk,
} from "@/lib/stocksCatalog";
import type { StocksResult } from "@/types";

const StocksChart = dynamic(() => import("@/components/StocksChart"), { ssr: false });

const RISK_STYLE: Record<StockRisk, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

type DisplayStock = Pick<StockCatalogItem, "symbol" | "ticker" | "name" | "risk">;

export default function StocksPage() {
  const [group, setGroup] = useState<StockGroup>("all");
  const [expandedList, setExpandedList] = useState(false);
  const [selected, setSelected] = useState<string[]>(["spy.us", "qqq.us", "aapl.us", "msft.us", "nvda.us"]);
  const [customStocks, setCustomStocks] = useState<Record<string, DisplayStock>>({});

  const [stocks, setStocks] = useState<StocksResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    const isEtf = (item: StockCatalogItem) => item.groups.includes("etf");
    if (group === "all") {
      return STOCK_CATALOG.filter((item) => !isEtf(item));
    }
    if (group === "etf") {
      return STOCK_CATALOG.filter((item) => isEtf(item));
    }
    return STOCK_CATALOG.filter((item) => !isEtf(item) && matchesGroup(item, group));
  }, [group]);
  const suggestions = useMemo(() => searchCatalog(query), [query]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const visibleList = useMemo(
    () => (expandedList ? filteredCatalog : filteredCatalog.slice(0, 10)),
    [expandedList, filteredCatalog]
  );

  useEffect(() => {
    if (selected.length === 0) {
      setStocks(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    getStocks(selected)
      .then((data) => {
        setStocks(data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setError("Could not load stock data. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    setExpandedList(false);
  }, [group]);

  function addToChart(symbol: string) {
    if (selectedSet.has(symbol) || selected.length >= 12) return;
    setSelected((prev) => [...prev, symbol]);
  }

  function removeFromChart(symbol: string) {
    setSelected((prev) => prev.filter((s) => s !== symbol));
  }

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    setSearchError(null);
    try {
      const localMatch = searchCatalog(trimmed)[0];
      if (localMatch) {
        addToChart(localMatch.symbol);
        return;
      }

      const response = await searchStock(trimmed);
      const symbol = response.resolved_symbol;
      addToChart(symbol);
      setCustomStocks((prev) => ({
        ...prev,
        [symbol]: {
          symbol,
          ticker: response.label,
          name: response.label,
          risk: "medium",
        },
      }));
    } catch {
      setSearchError("No matching result found. Try company name, ticker (AAPL), or full symbol (aapl.us).");
    } finally {
      setSearching(false);
    }
  }

  const selectedMeta: DisplayStock[] = selected.map((symbol) => {
    const fromCatalog = STOCK_CATALOG.find((item) => item.symbol === symbol);
    if (fromCatalog) return fromCatalog;
    return (
      customStocks[symbol] ?? {
        symbol,
        ticker: symbol.split(".")[0]?.toUpperCase() ?? symbol.toUpperCase(),
        name: symbol,
        risk: "medium",
      }
    );
  });

  const chartStocks = useMemo(() => {
    if (!stocks) return null;
    const entries = Object.entries(stocks).filter(([, data]) => data.dates.length > 1 && data.normalised.length > 1);
    if (entries.length === 0) return null;
    return Object.fromEntries(entries);
  }, [stocks]);

  return (
    <div className="min-w-0 space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
          Market Data
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Market</h1>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          Explore company stocks, keep ETFs/indices in their own group, and build your comparison chart.
        </p>
        {lastUpdated ? <div className="mt-2 text-xs text-[var(--muted-ink)]">Last updated: {lastUpdated}</div> : null}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Find Stocks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search company name or ticker (e.g. Apple, AAPL)"
              className="w-full min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            />
            <button
              onClick={runSearch}
              disabled={searching || !query.trim()}
              className="w-full shrink-0 whitespace-nowrap rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-50 sm:w-auto"
            >
              {searching ? "Searching..." : "Add to Chart"}
            </button>
          </div>
          {searchError ? <div className="text-xs text-rose-600">{searchError}</div> : null}
          {suggestions.length > 0 && query.trim() ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => addToChart(item.symbol)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--brand)]"
                >
                  {item.name} ({item.ticker})
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Groups</CardTitle>
            <div className="text-xs text-[var(--muted-ink)]">
              {group === "all" ? "Company list (no ETFs/indices)" : null}
              {group === "etf" ? "Only ETFs and index trackers" : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {STOCK_GROUP_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setGroup(option.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  group === option.id
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                    : "border-[var(--border)] bg-white text-[var(--muted-ink)] hover:border-[var(--brand)]"
                )}
                title={option.note}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[90px_1fr_100px_120px] gap-2 border-b border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                <div>Ticker</div>
                <div>Company</div>
                <div>Risk</div>
                <div className="text-right">Action</div>
              </div>
              <div className="max-h-[430px] overflow-y-auto">
                {visibleList.map((item) => (
                  <div
                    key={item.symbol}
                    className="grid grid-cols-[90px_1fr_100px_120px] gap-2 border-b border-[var(--border)] px-3 py-2 text-sm last:border-b-0"
                  >
                    <div className="font-semibold text-[var(--ink)]">{item.ticker}</div>
                    <div className="truncate text-[var(--ink)]">{item.name}</div>
                    <div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", RISK_STYLE[item.risk])}>
                        {item.risk}
                      </span>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => addToChart(item.symbol)}
                        disabled={selectedSet.has(item.symbol) || selected.length >= 12}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] disabled:opacity-45"
                      >
                        {selectedSet.has(item.symbol) ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {filteredCatalog.length > 10 ? (
            <button
              onClick={() => setExpandedList((v) => !v)}
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)]"
            >
              {expandedList ? "Show Preview (10)" : `Show All (${filteredCatalog.length})`}
            </button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Chart Selection ({selected.length}/12)</CardTitle>
            <button
              onClick={() => {
                const next = filteredCatalog.slice(0, 8).map((i) => i.symbol);
                setSelected(next);
              }}
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)]"
            >
              Load Current Group
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedMeta.length > 0 ? (
              selectedMeta.map((item) => (
                <div
                  key={item.symbol}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-[var(--ink)]">{item.ticker}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", RISK_STYLE[item.risk])}>
                    {item.risk}
                  </span>
                  <button
                    onClick={() => removeFromChart(item.symbol)}
                    className="text-[var(--muted-ink)] hover:text-rose-600"
                    aria-label={`Remove ${item.ticker}`}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--muted-ink)]">No stocks selected.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Chart (Bottom)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-soft)] border-t-[var(--brand)]" />
            </div>
          ) : error ? (
            <div className="text-sm text-[var(--muted-ink)]">{error}</div>
          ) : chartStocks ? (
            <StocksChart stocks={chartStocks} />
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted-ink)]">
              No chart lines available for the selected symbols right now. Try different stocks or refresh.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
