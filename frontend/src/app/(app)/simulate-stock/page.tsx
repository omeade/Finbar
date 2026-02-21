"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { getStocks } from "@/lib/api";
import type { StocksResult } from "@/types";

const SYMBOL_MAP: Record<string, string> = {
  SPY: "spy.us",
  QQQ: "qqq.us",
  BND: "bnd.us",
};

const SYMBOL_DESC: Record<string, string> = {
  SPY: "S&P 500 ETF · 500 largest US companies",
  QQQ: "Nasdaq 100 ETF · Tech & growth focused",
  BND: "Total Bond Market ETF · Lower risk, steady income",
};

type RangeKey = "1M" | "6M" | "1Y" | "MAX";

type DataPoint = { date: string; price: number; normalised: number };
type SimPoint = { date: string; price: number; portfolio: number; totalContrib: number };
type BuyEvent = { date: string; amount: number; price: number; sharesBought: number };

function parseStockResult(data: StocksResult | null, symbolKey: string): DataPoint[] {
  if (!data) return [];
  let s = data[symbolKey];
  if (!s) {
    const labelKey = (symbolKey ?? "").split(".")[0]?.toUpperCase() ?? "";
    s = data[labelKey];
  }
  if (!s || !s.dates) return [];
  const stock = s; // const binding so closures narrow correctly
  return stock.dates
    .map((d, i) => ({
      date: d,
      price: Number(stock.prices[i]),
      normalised: Number(stock.normalised[i]),
    }))
    .filter((p) => Number.isFinite(p.price) && Number.isFinite(p.normalised));
}

function fmt$(v: number) {
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMonth(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="app-panel rounded-2xl px-3 py-2.5 text-xs shadow-xl">
      <div className="mb-2 font-semibold text-[var(--ink)]">{label ? fmtDate(label) : ""}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--muted-ink)]">{p.name}:</span>
          <span className="font-semibold text-[var(--ink)]">{fmt$(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export default function SimulateStockPage() {
  const [symbolKey, setSymbolKey] = useState("spy.us");
  const [symbolLabel, setSymbolLabel] = useState("SPY");
  const [data, setData] = useState<DataPoint[]>([]);
  const [range, setRange] = useState<RangeKey>("1Y");
  const [loading, setLoading] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState(500);
  const [autoInvest, setAutoInvest] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [speed, setSpeed] = useState(80);

  // Fetch
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setIsPlaying(false);
    getStocks([symbolKey])
      .then((res) => {
        if (!mounted) return;
        const parsed = parseStockResult(res, symbolKey);
        parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(parsed);
        setPlayIndex(Math.max(0, parsed.length - 1));
      })
      .catch((err) => {
        console.error("getStocks error", err);
        if (mounted) setData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [symbolKey]);

  // Range filter
  const filtered = useMemo((): DataPoint[] => {
    if (!data.length) return [];
    const last = data[data.length - 1]!;
    const end = new Date(last.date);
    let start = new Date(data[0]!.date);
    if (range === "1M") {
      start = new Date(end);
      start.setMonth(end.getMonth() - 1);
    } else if (range === "6M") {
      start = new Date(end);
      start.setMonth(end.getMonth() - 6);
    } else if (range === "1Y") {
      start = new Date(end);
      start.setFullYear(end.getFullYear() - 1);
    }
    return data.filter((p) => new Date(p.date) >= start && new Date(p.date) <= end);
  }, [data, range]);

  // Clamp playIndex when filtered changes
  useEffect(() => {
    setPlayIndex((p) => Math.min(p, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // DCA simulation — tracks totalContrib per point for live stats
  const simulation = useMemo((): { points: SimPoint[]; buys: BuyEvent[] } => {
    if (!filtered.length) return { points: [], buys: [] };
    let shares = 0;
    let totalContrib = 0;
    const points: SimPoint[] = [];
    const buys: BuyEvent[] = [];

    for (let i = 0; i < filtered.length; i++) {
      const cur = filtered[i]!;
      const price = cur.price;
      const curDate = new Date(cur.date + "T00:00:00Z");
      const isLast = i === filtered.length - 1;
      const isMonthEnd =
        isLast ||
        new Date(filtered[i + 1]!.date + "T00:00:00Z").getUTCMonth() !== curDate.getUTCMonth();

      // Buy on first day, then on each subsequent month-end (no double-buy on day 0)
      if (autoInvest && (i === 0 || (isMonthEnd && i > 0))) {
        const sharesBought = monthlyAmount / price;
        shares += sharesBought;
        totalContrib += monthlyAmount;
        buys.push({ date: cur.date, amount: monthlyAmount, price, sharesBought });
      }

      points.push({ date: cur.date, price, portfolio: shares * price, totalContrib });
    }

    return { points, buys };
  }, [filtered, monthlyAmount, autoInvest]);

  // Playback
  useEffect(() => {
    if (!isPlaying) return;
    if (playIndex >= filtered.length - 1) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setPlayIndex((p) => Math.min(p + 1, filtered.length - 1)), speed);
    return () => clearTimeout(t);
  }, [isPlaying, playIndex, filtered.length, speed]);

  function onSymbolChange(label: string) {
    setSymbolLabel(label);
    setSymbolKey(SYMBOL_MAP[label] ?? label.toLowerCase());
  }

  // Current playback stats
  const currentPoint: DataPoint | undefined = filtered[playIndex];
  const currentSim: SimPoint | undefined = simulation.points[playIndex];
  const portfolioValue = currentSim?.portfolio ?? 0;
  const contributions = currentSim?.totalContrib ?? 0;
  const returnAmount = portfolioValue - contributions;
  const returnPct = contributions > 0 ? (returnAmount / contributions) * 100 : 0;
  const isPositive = returnAmount >= 0;
  const buysToDate = simulation.buys.filter(
    (b) => !currentPoint || b.date <= currentPoint.date
  );

  const firstDate = filtered[0];
  const lastDate = filtered.at(-1);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Portfolio Simulator
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">DCA Simulator</h1>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">
              {SYMBOL_DESC[symbolLabel] ?? `Simulating dollar-cost averaging into ${symbolLabel}`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Asset selector */}
            <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
              {Object.keys(SYMBOL_MAP).map((k) => (
                <button
                  key={k}
                  onClick={() => onSymbolChange(k)}
                  className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-all ${
                    symbolLabel === k
                      ? "bg-[var(--brand)] text-white shadow-sm"
                      : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Range selector */}
            <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
              {(["1M", "6M", "1Y", "MAX"] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                    range === r
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="app-panel fade-up rounded-3xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            Portfolio Value
          </div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">{fmt$(portfolioValue)}</div>
          <div className="mt-0.5 text-xs text-[var(--muted-ink)]">
            {currentPoint ? fmtDate(currentPoint.date) : "—"}
          </div>
        </div>

        <div className="app-panel fade-up rounded-3xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            Total Return
          </div>
          <div
            className={`mt-1 text-xl font-bold ${
              isPositive ? "text-[var(--accent)]" : "text-rose-500"
            }`}
          >
            {isPositive ? "+" : ""}
            {fmt$(returnAmount)}
          </div>
          <div
            className={`mt-0.5 text-xs font-semibold ${
              isPositive ? "text-[var(--accent)]" : "text-rose-500"
            }`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(returnPct).toFixed(1)}%
          </div>
        </div>

        <div className="app-panel fade-up rounded-3xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            Contributions
          </div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">{fmt$(contributions)}</div>
          <div className="mt-0.5 text-xs text-[var(--muted-ink)]">
            {buysToDate.length} purchase{buysToDate.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="app-panel fade-up rounded-3xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            Current Price
          </div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">
            {currentPoint ? fmt$(currentPoint.price) : "—"}
          </div>
          <div className="mt-0.5 text-xs text-[var(--muted-ink)]">
            {symbolLabel} · {range}
          </div>
        </div>
      </div>

      {/* Chart + Controls */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <div className="app-panel fade-up rounded-3xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
              Portfolio Growth
            </div>
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-soft)] border-t-[var(--brand)]" />
            )}
          </div>

          <div style={{ height: 360 }}>
            {simulation.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={simulation.points}
                  margin={{ top: 10, right: 55, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    strokeOpacity={0.7}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtMonth}
                    tick={{ fontSize: 11, fill: "var(--muted-ink)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    yAxisId="portfolio"
                    tickFormatter={(v) =>
                      Number(v) >= 1000
                        ? `$${(Number(v) / 1000).toFixed(0)}k`
                        : `$${Number(v).toFixed(0)}`
                    }
                    tick={{ fontSize: 11, fill: "var(--muted-ink)" }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />
                  <YAxis
                    yAxisId="price"
                    orientation="right"
                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                    tick={{ fontSize: 11, fill: "var(--muted-ink)" }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltip
                        active={props.active}
                        payload={props.payload as { name: string; value: number; color: string }[]}
                        label={props.label as string}
                      />
                    )}
                  />

                  {/* Portfolio area */}
                  <Area
                    yAxisId="portfolio"
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fill="url(#portfolioGrad)"
                    name="Portfolio Value"
                    dot={false}
                    activeDot={{ r: 5, fill: "#16a34a", strokeWidth: 2, stroke: "white" }}
                  />

                  {/* Price line */}
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke="var(--brand)"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={false}
                    name="Stock Price"
                    activeDot={{ r: 4, fill: "var(--brand)", strokeWidth: 2, stroke: "white" }}
                  />

                  {/* Buy markers */}
                  {simulation.buys.map((b, i) => (
                    <ReferenceDot
                      key={i}
                      yAxisId="price"
                      x={b.date}
                      y={b.price}
                      r={3.5}
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth={1.5}
                      isFront
                    />
                  ))}

                  {/* Playback cursor */}
                  {currentPoint && (
                    <ReferenceDot
                      yAxisId="price"
                      x={currentPoint.date}
                      y={currentPoint.price}
                      r={7}
                      fill="var(--ink)"
                      stroke="white"
                      strokeWidth={2.5}
                      isFront
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-ink)]">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-soft)] border-t-[var(--brand)]" />
                    Loading data…
                  </div>
                ) : (
                  <div className="text-sm text-[var(--muted-ink)]">
                    No data for selected symbol
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--muted-ink)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 rounded bg-[var(--accent)]" />
              Portfolio Value
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-5 border-t-2 border-dashed"
                style={{ borderColor: "var(--brand)" }}
              />
              Stock Price
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
              Buy Event
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-[var(--ink)]" />
              Cursor
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="app-panel fade-up rounded-3xl p-5 flex flex-col gap-5">
          {/* Strategy */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
              Strategy
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-ink)]">
                  Monthly Contribution
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--muted-ink)]">$</span>
                  <input
                    type="number"
                    value={monthlyAmount}
                    min={50}
                    max={50000}
                    onChange={(e) => setMonthlyAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={Math.min(monthlyAmount, 5000)}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="mt-2 w-full cursor-pointer accent-[var(--brand)]"
                />
                <div className="mt-0.5 flex justify-between text-[10px] text-[var(--muted-ink)]">
                  <span>$50</span>
                  <span>$5,000</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--ink)]">Auto-invest</div>
                  <div className="text-[11px] text-[var(--muted-ink)]">Buy at each month-end</div>
                </div>
                <button
                  onClick={() => setAutoInvest((v) => !v)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    autoInvest ? "bg-[var(--brand)]" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      autoInvest ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Playback */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
              Playback
            </div>

            {/* Current date display */}
            <div className="mb-3 rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-ink)]">
                Viewing
              </div>
              <div className="mt-0.5 text-base font-bold text-[var(--ink)]">
                {currentPoint ? fmtDate(currentPoint.date) : "—"}
              </div>
            </div>

            {/* Scrubber */}
            <div className="mb-3">
              <input
                type="range"
                min={0}
                max={Math.max(0, filtered.length - 1)}
                value={playIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlayIndex(Number(e.target.value));
                }}
                className="w-full cursor-pointer accent-[var(--brand)]"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-[var(--muted-ink)]">
                <span>{firstDate ? fmtMonth(firstDate.date) : "—"}</span>
                <span>{lastDate ? fmtMonth(lastDate.date) : "—"}</span>
              </div>
            </div>

            {/* Play / Restart */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (playIndex >= filtered.length - 1) setPlayIndex(0);
                  setIsPlaying((p) => !p);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)]"
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setPlayIndex(0);
                }}
                title="Restart"
                className="rounded-2xl border border-[var(--border)] px-3.5 py-2.5 text-base font-medium text-[var(--ink)] transition-colors hover:border-[var(--brand)]"
              >
                ↺
              </button>
            </div>

            {/* Speed */}
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-shrink-0 text-xs text-[var(--muted-ink)]">Speed</span>
              <div className="flex flex-1 gap-1">
                {(
                  [
                    { label: "1×", value: 200 },
                    { label: "2×", value: 100 },
                    { label: "5×", value: 40 },
                    { label: "10×", value: 20 },
                  ] as const
                ).map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setSpeed(value)}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all ${
                      speed === value
                        ? "bg-[var(--brand)] text-white"
                        : "border border-[var(--border)] text-[var(--muted-ink)] hover:border-[var(--brand)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy log */}
      <div className="app-panel fade-up rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
            Buy Log
          </div>
          <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-xs text-[var(--muted-ink)]">
            {simulation.buys.length} purchase{simulation.buys.length !== 1 ? "s" : ""} ·{" "}
            {fmt$(simulation.buys.reduce((s, b) => s + b.amount, 0))} total
          </span>
        </div>

        {simulation.buys.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--muted-ink)]">
            No purchases recorded for this range.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            <div className="mb-1.5 grid grid-cols-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-ink)]">
              <span>Date</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Price</span>
              <span className="text-right">Shares</span>
            </div>
            {simulation.buys.map((b, i) => (
              <div
                key={i}
                className="grid grid-cols-4 items-center rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-soft)]"
              >
                <span className="font-medium text-[var(--ink)]">{fmtDate(b.date)}</span>
                <span className="text-right font-semibold text-[var(--brand)]">
                  {fmt$(b.amount)}
                </span>
                <span className="text-right text-[var(--muted-ink)]">{fmt$(b.price)}</span>
                <span className="text-right font-medium text-[var(--accent)]">
                  {b.sharesBought.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pb-2 text-center text-xs text-[var(--muted-ink)]">
        Data from Stooq · Simulations are illustrative only · Not financial advice
      </div>
    </div>
  );
}
