"use client";

import { useEffect, useState } from "react";
import { FinancialSnapshot, RiskProfile, Strategy } from "@/types";
import { generateStrategy } from "@/lib/api";

interface Props {
  snapshot: FinancialSnapshot;
  riskProfile: RiskProfile;
  onNext: (strategy: Strategy) => void;
  onBack: () => void;
}

const ALLOCATION_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
];

const PROFILE_LABEL: Record<RiskProfile, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

export default function StrategyResultStep({ snapshot, riskProfile, onNext, onBack }: Props) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    generateStrategy(snapshot, riskProfile)
      .then(setStrategy)
      .catch(() => setError("Failed to generate strategy. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [snapshot, riskProfile]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Generating your personalised strategy…</p>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-red-500">{error || "Something went wrong"}</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Investment Strategy</h2>
        <p className="text-gray-500 mt-1">
          Based on your financial snapshot and{" "}
          <span className="font-medium text-indigo-600">{PROFILE_LABEL[riskProfile]}</span> risk profile.
        </p>
      </div>

      {/* Not ready warning */}
      {!strategy.ready_to_invest && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Before you invest…</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Consider paying off high-interest debt and building a 3-month emergency fund first. The strategy
              below is ready when you are.
            </p>
          </div>
        </div>
      )}

      {/* Investable amount */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Monthly Surplus</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">€{strategy.monthly_surplus.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-wide">Safe to Invest</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            €{strategy.monthly_investable.toLocaleString()}/mo
          </p>
        </div>
      </div>

      {/* Allocation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
        <div className="space-y-3">
          {strategy.allocation.map((item, i) => (
            <div key={item.asset}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-800">{item.asset}</span>
                <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]}`}
                  style={{ width: `${item.percentage}%`, transition: "width 0.6s ease" }}
                />
              </div>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rationale */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Why this strategy?</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{strategy.rationale}</p>
      </div>

      {/* Education */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Key Concepts</h3>
        <div className="flex flex-wrap gap-2">
          {strategy.education.map((concept) => (
            <span
              key={concept}
              className="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1.5 rounded-full border border-indigo-100"
            >
              💡 {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Risk warning */}
      <p className="text-xs text-gray-400 text-center px-4 mb-6">
        ⚠️ {strategy.risk_warning} This is educational, not financial advice.
      </p>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(strategy)}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          See Simulation →
        </button>
      </div>
    </div>
  );
}
