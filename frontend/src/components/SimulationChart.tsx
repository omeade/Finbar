"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SimulationResult } from "@/types";

interface Props {
  data: SimulationResult;
}

function formatEuro(value: number) {
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`;
  return `€${value.toFixed(0)}`;
}

export default function SimulationChart({ data }: Props) {
  const chartData = data.years.map((year, i) => ({
    year: `Year ${year}`,
    Typical: data.scenarios.typical[i]?.value ?? 0,
    "Best Case": data.scenarios.best[i]?.value ?? 0,
    "Worst Case": data.scenarios.worst[i]?.value ?? 0,
    Contributions: data.scenarios.typical[i]?.contributions ?? 0,
  }));

  const finalTypical = data.scenarios.typical.at(-1)?.value ?? 0;
  const finalBest = data.scenarios.best.at(-1)?.value ?? 0;
  const finalWorst = data.scenarios.worst.at(-1)?.value ?? 0;
  const totalContributions = data.total_contributions;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Contributed</p>
          <p className="font-bold text-gray-900">{formatEuro(totalContributions)}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
          <p className="text-xs text-indigo-500 mb-1">Typical</p>
          <p className="font-bold text-indigo-700">{formatEuro(finalTypical)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xs text-emerald-500 mb-1">Best Case</p>
          <p className="font-bold text-emerald-700">{formatEuro(finalBest)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
          <p className="text-xs text-rose-500 mb-1">Worst Case</p>
          <p className="font-bold text-rose-700">{formatEuro(finalWorst)}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6b7280" }} />
          <YAxis tickFormatter={formatEuro} tick={{ fontSize: 12, fill: "#6b7280" }} width={56} />
          <Tooltip
            formatter={(value: number, name: string) => [`€${value.toLocaleString()}`, name]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <ReferenceLine
            y={totalContributions}
            stroke="#9ca3af"
            strokeDasharray="4 4"
            label={{ value: "Contributions", fill: "#9ca3af", fontSize: 11, position: "right" }}
          />
          <Line
            type="monotone"
            dataKey="Typical"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Best Case"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Worst Case"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
