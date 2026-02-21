"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { RiskProfile, SimulationResult, Strategy } from "@/types";
import { runSimulation } from "@/lib/api";

const SimulationChart = dynamic(() => import("@/components/SimulationChart"), { ssr: false });

interface Props {
  strategy: Strategy;
  riskProfile: RiskProfile;
  onBack: () => void;
}

export default function SimulationStep({ strategy, riskProfile, onBack }: Props) {
  const [monthlyAmount, setMonthlyAmount] = useState(
    Math.max(strategy.monthly_investable, 50)
  );
  const [years, setYears] = useState(10);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    runSimulation(monthlyAmount, years, riskProfile)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [monthlyAmount, years, riskProfile]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Investment Simulation</h2>
        <p className="text-gray-500 mt-1">
          See what your money could look like over time using Dollar-Cost Averaging (DCA).
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monthly Investment —{" "}
              <span className="text-indigo-600 font-semibold">€{monthlyAmount}</span>
            </label>
            <input
              type="range"
              min={10}
              max={2000}
              step={10}
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>€10</span>
              <span>€2,000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Time Horizon —{" "}
              <span className="text-indigo-600 font-semibold">{years} years</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>1 year</span>
              <span>30 years</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : result ? (
          <SimulationChart data={result} monthlyAmount={monthlyAmount} />
        ) : null}
      </div>

      {/* DCA explanation */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs text-indigo-700 leading-relaxed">
          <span className="font-semibold">What is DCA?</span> Dollar-Cost Averaging means investing a fixed
          amount regularly regardless of market conditions. This removes the stress of timing the market and
          smooths out volatility over time.
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center mb-6">
        ⚠️ Simulations use historical average return rates. Actual results will vary. Past performance does
        not guarantee future results. This is educational, not financial advice.
      </p>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => window.scrollTo(0, 0)}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
