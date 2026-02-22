"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { validateT212Key, getT212Cash, getT212Portfolio } from "@/lib/api";
import type { T212AccountCash, T212AccountType, T212Position } from "@/types";

const STORAGE_KEY = "finbar.t212";
const CACHE_KEY = "finbar.t212.cache";
const CACHE_TTL_MS = 2 * 60 * 1000;      // show cached data up to 2 min old without re-fetching
const REFRESH_COOLDOWN_MS = 30 * 1000;   // enforce 30s between manual refreshes

interface PortfolioCache {
  cash: T212AccountCash;
  positions: T212Position[];
  fetchedAt: number;
}

function loadCache(): PortfolioCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as PortfolioCache) : null;
  } catch {
    return null;
  }
}

function saveCache(data: PortfolioCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage quota — ignore
  }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

function ageLabel(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

interface StoredT212 {
  apiKey: string;
  apiSecret: string;
  accountType: T212AccountType;
}

function loadStored(): StoredT212 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredT212) : null;
  } catch {
    return null;
  }
}

function saveStored(data: StoredT212) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStored() {
  localStorage.removeItem(STORAGE_KEY);
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-IE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function PnlText({ value, className = "" }: { value: number; className?: string }) {
  const color = value >= 0 ? "text-emerald-600" : "text-rose-600";
  return (
    <span className={`${color} ${className}`}>
      {value >= 0 ? "+" : ""}
      {fmt(value)}
    </span>
  );
}

// ── Connect Screen ────────────────────────────────────────────────────────────

function ConnectScreen({
  onConnect,
}: {
  onConnect: (apiKey: string, apiSecret: string, accountType: T212AccountType) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [accountType, setAccountType] = useState<T212AccountType>("demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (!apiKey.trim() || !apiSecret.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await validateT212Key(apiKey.trim(), apiSecret.trim(), accountType);
      onConnect(apiKey.trim(), apiSecret.trim(), accountType);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("401")) setError("Invalid credentials. Check both your API key and secret key.");
      else if (msg.includes("429")) setError("Too many requests. Wait a moment and retry.");
      else setError("Could not connect to Trading 212. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
          Portfolio
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Connect Trading 212</h1>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          Link your Trading 212 account to view your live portfolio.
        </p>
      </section>

      <div className="app-panel fade-up rounded-3xl p-6 max-w-lg mx-auto space-y-6">
        {/* Steps */}
        <div className="space-y-4">
          {[
            {
              num: "1",
              title: "Open Trading 212",
              body: "Launch the Trading 212 app or log in at trading212.com.",
            },
            {
              num: "2",
              title: "Generate an API key",
              body: 'Go to Settings → API (under "Others") → tap Generate Key. You\'ll receive an API Key ID and a Secret Key — copy both.',
            },
            {
              num: "3",
              title: "Paste your credentials below",
              body: "Your credentials are stored locally on this device only and never sent to any third party.",
            },
          ].map((s) => (
            <div key={s.num} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-[var(--brand)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.num}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">{s.title}</div>
                <div className="text-xs text-[var(--muted-ink)] mt-0.5 leading-relaxed">{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Account type toggle */}
        <div>
          <div className="text-xs font-medium text-[var(--muted-ink)] mb-2">Account type</div>
          <div className="flex gap-2">
            {(["demo", "live"] as T212AccountType[]).map((t) => (
              <button
                key={t}
                onClick={() => setAccountType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  accountType === t
                    ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                    : "bg-transparent text-[var(--muted-ink)] border-[var(--border)] hover:border-[var(--brand)]"
                }`}
              >
                {t === "demo" ? "Paper / Demo" : "Live Account"}
              </button>
            ))}
          </div>
          {accountType === "live" && (
            <p className="mt-2 text-xs text-amber-600">
              You are connecting to your real money account.
            </p>
          )}
        </div>

        {/* Credentials inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-ink)] mb-1.5">
              API Key ID
            </label>
            <input
              type="text"
              placeholder="Your Trading 212 API Key ID"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--brand)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-ink)] mb-1.5">
              Secret Key
            </label>
            <input
              type="password"
              placeholder="Your Trading 212 Secret Key"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--brand)]"
            />
            <p className="mt-1 text-[10px] text-[var(--muted-ink)]">
              The secret is shown only once after generation — make sure you saved it.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={!apiKey.trim() || !apiSecret.trim() || loading}
          className="w-full py-3 rounded-xl bg-[var(--brand)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? "Connecting…" : "Connect →"}
        </button>

        <p className="text-[10px] text-center text-[var(--muted-ink)]">
          Educational purposes only · Not financial advice
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function PortfolioDashboard({
  apiKey,
  apiSecret,
  accountType,
  onDisconnect,
}: {
  apiKey: string;
  apiSecret: string;
  accountType: T212AccountType;
  onDisconnect: () => void;
}) {
  const [cash, setCash] = useState<T212AccountCash | null>(null);
  const [positions, setPositions] = useState<T212Position[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [cooldownUntil, setCooldownUntil] = useState(0);

  // Tick every second to update "last updated" label and cooldown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const applyData = useCallback((c: T212AccountCash, p: T212Position[], ts: number) => {
    setCash(c);
    setPositions([...p].sort((a, b) => b.currentPrice * b.quantity - a.currentPrice * a.quantity));
    setFetchedAt(ts);
  }, []);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) {
      if (Date.now() < cooldownUntil) return;
      setRefreshing(true);
    }
    setFetchError(null);
    try {
      const [cashData, posData] = await Promise.all([
        getT212Cash(apiKey, apiSecret, accountType),
        getT212Portfolio(apiKey, apiSecret, accountType),
      ]);
      const ts = Date.now();
      applyData(cashData, posData, ts);
      saveCache({ cash: cashData, positions: posData, fetchedAt: ts });
      if (isManual) setCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("401")) {
        setFetchError("Credentials are no longer valid. Please reconnect.");
      } else if (msg.includes("429")) {
        setFetchError("Trading 212 rate limit hit — showing cached data. Try again in a minute.");
      } else {
        setFetchError("Could not reach Trading 212. Showing cached data.");
      }
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [apiKey, apiSecret, accountType, cooldownUntil, applyData]);

  // On mount: load cache instantly, then fetch if cache is stale
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      applyData(cached.cash, cached.positions, cached.fetchedAt);
      setInitialLoading(false);
      if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
        fetchData();
      }
    } else {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDisconnect() {
    clearCache();
    onDisconnect();
  }

  const cooldownSecsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const hasCachedData = cash !== null;

  const totalInvested = positions.reduce((s, p) => s + p.averagePrice * p.quantity, 0);
  const totalValue = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const totalPpl = positions.reduce((s, p) => s + p.ppl, 0);
  const totalPplPct = totalInvested > 0 ? (totalPpl / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Portfolio
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">My Investments</h1>
          </div>
          <div className="flex items-center gap-3">
            {fetchedAt && (
              <span className="text-[10px] text-[var(--muted-ink)]">
                {refreshing ? "Updating…" : `Updated ${ageLabel(now - fetchedAt)}`}
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                accountType === "live"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {accountType === "live" ? "Live" : "Demo"}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || cooldownSecsLeft > 0}
              className="text-xs text-[var(--muted-ink)] hover:text-[var(--ink)] transition disabled:opacity-40"
            >
              {cooldownSecsLeft > 0 ? `Wait ${cooldownSecsLeft}s` : "Refresh"}
            </button>
            <button
              onClick={handleDisconnect}
              className="text-xs text-[var(--muted-ink)] hover:text-rose-600 transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      </section>

      {initialLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--brand-soft)] border-t-[var(--brand)] rounded-full animate-spin" />
        </div>
      )}

      {fetchError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800 flex items-center justify-between">
          <span>{fetchError}</span>
          {!hasCachedData && (
            <button
              onClick={() => fetchData(true)}
              disabled={cooldownSecsLeft > 0}
              className="ml-3 underline text-amber-700 hover:text-amber-900 disabled:opacity-50"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!initialLoading && hasCachedData && cash && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total Value", value: fmt(totalValue + (cash.free ?? 0)), sub: "portfolio + cash" },
              { label: "Invested", value: fmt(totalInvested), sub: "in positions" },
              { label: "Free Cash", value: fmt(cash.free ?? 0), sub: "available" },
              {
                label: "Total P&L",
                value: <PnlText value={totalPpl} />,
                sub: `${totalPplPct >= 0 ? "+" : ""}${fmt(totalPplPct)}%`,
              },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="app-panel fade-up rounded-2xl p-4 border border-[var(--border)]"
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--muted-ink)] mb-1">
                  {label}
                </div>
                <div className="text-xl font-bold text-[var(--ink)]">{value}</div>
                <div className="text-xs text-[var(--muted-ink)] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Positions table */}
          {positions.length === 0 ? (
            <div className="app-panel rounded-3xl p-8 text-center text-sm text-[var(--muted-ink)]">
              No open positions found.
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Open Positions ({positions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {["Ticker", "Quantity", "Avg Price", "Current", "Value", "P&L", "Return"].map(
                          (h) => (
                            <th
                              key={h}
                              className="pb-2 text-left text-[10px] uppercase tracking-wider text-[var(--muted-ink)] font-semibold pr-4 last:pr-0"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((p) => {
                        const value = p.currentPrice * p.quantity;
                        const cost = p.averagePrice * p.quantity;
                        const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
                        return (
                          <tr
                            key={p.ticker}
                            className="border-b border-[var(--border)] last:border-0"
                          >
                            <td className="py-3 pr-4 font-semibold text-[var(--ink)]">
                              {p.ticker.replace(/_[A-Z]+_EQ$/, "")}
                            </td>
                            <td className="py-3 pr-4 text-[var(--muted-ink)]">{fmt(p.quantity, 4)}</td>
                            <td className="py-3 pr-4 text-[var(--muted-ink)]">{fmt(p.averagePrice)}</td>
                            <td className="py-3 pr-4 text-[var(--ink)]">{fmt(p.currentPrice)}</td>
                            <td className="py-3 pr-4 font-medium text-[var(--ink)]">{fmt(value)}</td>
                            <td className="py-3 pr-4">
                              <PnlText value={p.ppl} />
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  pct >= 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {pct >= 0 ? "+" : ""}
                                {fmt(pct, 1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allocation bars */}
          {positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {positions.slice(0, 10).map((p) => {
                    const value = p.currentPrice * p.quantity;
                    const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
                    const ticker = p.ticker.replace(/_[A-Z]+_EQ$/, "");
                    return (
                      <div key={p.ticker} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-[var(--muted-ink)] text-right truncate">
                          {ticker}
                        </div>
                        <div className="flex-1 h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-14 text-xs font-medium text-[var(--ink)] text-right">
                          {fmt(pct, 1)}%
                        </div>
                      </div>
                    );
                  })}
                  {positions.length > 10 && (
                    <p className="text-xs text-[var(--muted-ink)] text-center pt-1">
                      + {positions.length - 10} more positions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-[var(--muted-ink)] text-center">
            Educational purposes only · Not financial advice · Data from Trading 212
          </p>
        </>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [creds, setCreds] = useState<StoredT212 | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCreds(loadStored());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  function handleConnect(apiKey: string, apiSecret: string, accountType: T212AccountType) {
    const data = { apiKey, apiSecret, accountType };
    saveStored(data);
    setCreds(data);
  }

  function handleDisconnect() {
    clearStored();
    setCreds(null);
  }

  if (!creds) {
    return <ConnectScreen onConnect={handleConnect} />;
  }

  return (
    <PortfolioDashboard
      apiKey={creds.apiKey}
      apiSecret={creds.apiSecret}
      accountType={creds.accountType}
      onDisconnect={handleDisconnect}
    />
  );
}
