"use client";

import { useState } from "react";
import { FinancialSnapshot } from "@/types";

interface Props {
  onNext: (data: FinancialSnapshot) => void;
}

export default function FinancialSnapshotStep({ onNext }: Props) {
  const [form, setForm] = useState<FinancialSnapshot>({
    monthly_income: 3000,
    monthly_expenses: 1800,
    emergency_fund_months: 2,
    has_debt: false,
    time_horizon_years: 5,
  });

  const surplus = form.monthly_income - form.monthly_expenses;

  function set<K extends keyof FinancialSnapshot>(key: K, value: FinancialSnapshot[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Financial Snapshot</h2>
        <p className="text-gray-500 mt-1">
          Tell us about your finances. This simulates what a Monzo integration would provide automatically.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Monthly Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Monthly Income (after tax)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
            <input
              type="number"
              min={0}
              value={form.monthly_income}
              onChange={(e) => set("monthly_income", Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Monthly Expenses
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
            <input
              type="number"
              min={0}
              value={form.monthly_expenses}
              onChange={(e) => set("monthly_expenses", Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Rent, food, transport, subscriptions, etc.</p>
        </div>

        {/* Monthly Surplus banner */}
        <div
          className={`rounded-xl p-4 flex items-center justify-between ${
            surplus >= 0 ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
          }`}
        >
          <span className={`text-sm font-medium ${surplus >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            Monthly surplus
          </span>
          <span className={`text-xl font-bold ${surplus >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            €{surplus.toLocaleString()}
          </span>
        </div>

        {/* Emergency Fund */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Emergency Fund — <span className="text-indigo-600 font-semibold">{form.emergency_fund_months} months</span>
          </label>
          <input
            type="range"
            min={0}
            max={12}
            value={form.emergency_fund_months}
            onChange={(e) => set("emergency_fund_months", Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0 months</span>
            <span className="text-amber-500 font-medium">3 months recommended</span>
            <span>12 months</span>
          </div>
        </div>

        {/* Time Horizon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Investment Time Horizon — <span className="text-indigo-600 font-semibold">{form.time_horizon_years} years</span>
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={form.time_horizon_years}
            onChange={(e) => set("time_horizon_years", Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1 year</span>
            <span>30 years</span>
          </div>
        </div>

        {/* Has Debt */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.has_debt}
            onChange={(e) => set("has_debt", e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-gray-700">I have high-interest debt (credit cards, personal loans)</span>
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onNext(form)}
          disabled={surplus < 0}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next: Risk Profile →
        </button>
      </div>
    </div>
  );
}
