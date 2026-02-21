"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StockData = { dates: string[]; normalised: number[] };
type Props = { stocks: Record<string, StockData> };

const PALETTE = [
  "#0b84d8",
  "#16a34a",
  "#f97316",
  "#7c3aed",
  "#e11d48",
  "#0f766e",
  "#6366f1",
  "#ca8a04",
  "#0ea5e9",
  "#84cc16",
];

function colorForTicker(ticker: string, index: number): string {
  const hash = ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTE[(hash + index) % PALETTE.length] ?? "#0b84d8";
}

export default function StocksChart({ stocks }: Props) {
  const tickers = Object.keys(stocks);
  const allDates = new Set<string>();
  for (const ticker of tickers) {
    for (const date of stocks[ticker]?.dates ?? []) {
      allDates.add(date);
    }
  }

  const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

  const perTickerByDate: Record<string, Map<string, number>> = {};
  for (const ticker of tickers) {
    const map = new Map<string, number>();
    const dates = stocks[ticker]?.dates ?? [];
    const values = stocks[ticker]?.normalised ?? [];
    for (let i = 0; i < dates.length; i += 1) {
      const date = dates[i];
      const value = values[i];
      if (typeof date === "string" && typeof value === "number") {
        map.set(date, value);
      }
    }
    perTickerByDate[ticker] = map;
  }

  const chartData = sortedDates.map((date) => {
    const point: Record<string, string | number | null> = { date };
    for (const ticker of tickers) {
      point[ticker] = perTickerByDate[ticker]?.get(date) ?? null;
    }
    return point;
  });

  // Sample to ~52 points max for readability
  const step = Math.max(1, Math.floor(chartData.length / 52));
  const sampled = chartData.filter((_, i) => i % step === 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={sampled} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d9e7e2" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#5d6f6a" }}
          tickFormatter={(v: string) => v.slice(5)} // show MM-DD
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#5d6f6a" }}
          tickFormatter={(v: number) => v.toFixed(0)}
          width={40}
          domain={["auto", "auto"]}
        />
        <Tooltip
          formatter={(v: number, name: string) => [`${v.toFixed(1)}`, name]}
          contentStyle={{ borderRadius: 12, border: "1px solid #d9e7e2", fontSize: 12 }}
          labelFormatter={(label: string) => `Date: ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {tickers.map((ticker, index) => (
          <Line
            key={ticker}
            type="monotone"
            dataKey={ticker}
            stroke={colorForTicker(ticker, index)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
