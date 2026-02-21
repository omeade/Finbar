"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function BudgetPage() {
  const [income, setIncome] = useState(3000);
  const [expenses, setExpenses] = useState(1800);
  const [savings, setSavings] = useState(200);

  const surplus = income - expenses - savings;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0";
  const investable = surplus > 0 ? Math.round(surplus * 0.5) : 0;

  const status =
    surplus < 0 ? "overspending" : surplus < 200 ? "tight" : "healthy";

  const STATUS_STYLES = {
    overspending: "bg-rose-100 text-rose-700",
    tight: "bg-amber-100 text-amber-700",
    healthy: "bg-emerald-100 text-emerald-700",
  };

  const STATUS_LABELS = {
    overspending: "Overspending",
    tight: "Tight",
    healthy: "Healthy",
  };

  return (
    <div className="space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
          Budget Agent
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
          Monthly Budget Analyser
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          Enter your numbers to see how much you can safely invest each month.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Your Monthly Figures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { label: "Income (after tax)", value: income, set: setIncome },
                { label: "Total Expenses", value: expenses, set: setExpenses },
                { label: "Monthly Savings Target", value: savings, set: setSavings },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-[var(--muted-ink)] mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-ink)] text-sm">€</span>
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => set(Number(e.target.value))}
                      className="w-full pl-7 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--ink)] bg-white outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="app-panel fade-up rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                Budget Status
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Surplus", value: surplus, highlight: surplus >= 0 },
                { label: "Savings Rate", value: `${savingsRate}%`, highlight: true },
                { label: "Investable", value: investable, highlight: investable > 0 },
                { label: "After Investing", value: surplus - investable, highlight: null },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted-ink)] mb-1">{label}</div>
                  <div
                    className={`text-lg font-bold ${
                      highlight === true
                        ? "text-[var(--brand)]"
                        : highlight === false
                        ? "text-rose-600"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    {typeof value === "number" ? `€${value.toLocaleString()}` : value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {investable > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] p-4">
              <div className="text-xs font-semibold text-[var(--brand-strong)] mb-1">
                💡 Investing Suggestion
              </div>
              <p className="text-xs text-[var(--brand-strong)] leading-relaxed">
                With a €{surplus.toLocaleString()} surplus, investing €{investable.toLocaleString()}/month
                (50%) is a safe starting point. Head to Portfolio to build your strategy.
              </p>
            </div>
          )}

          {surplus < 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-xs font-semibold text-rose-700 mb-1">⚠️ Overspending</div>
              <p className="text-xs text-rose-600 leading-relaxed">
                You&apos;re spending €{Math.abs(surplus).toLocaleString()} more than you earn. Reduce expenses
                before starting to invest.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown bar */}
      {income > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Expenses", amount: expenses, color: "bg-rose-400" },
                { label: "Savings", amount: savings, color: "bg-amber-400" },
                { label: "Investable", amount: Math.max(investable, 0), color: "bg-[var(--brand)]" },
                { label: "Remaining", amount: Math.max(surplus - investable, 0), color: "bg-gray-200" },
              ].map(({ label, amount, color }) => {
                const pct = income > 0 ? Math.max((amount / income) * 100, 0) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-[var(--muted-ink)] text-right">{label}</div>
                    <div className="flex-1 h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs font-medium text-[var(--ink)]">
                      €{amount.toLocaleString()} <span className="text-[var(--muted-ink)]">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-[var(--muted-ink)] text-center">
        Educational purposes only · Not financial advice
      </p>
    </div>
  );
}
