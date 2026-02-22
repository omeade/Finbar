"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { generateStrategy, getStocks } from "@/lib/api";
import type { RiskProfile, StockData, Strategy } from "@/types";
import { cn } from "@/lib/cn";

export const BUDGET_CONTEXT_KEY = "finagent.budgetContext";

type MarketSnapshot = {
  spy: number | null;
  qqq: number | null;
  bnd: number | null;
};

function oneYearChange(data?: StockData): number | null {
  if (!data || data.prices.length < 2) return null;
  const first = data.prices[0] ?? 0;
  const last = data.prices[data.prices.length - 1] ?? 0;
  if (!first) return null;
  return ((last - first) / first) * 100;
}

export default function BudgetPage() {
  const [income, setIncome] = useState(3000);
  const [expenses, setExpenses] = useState(1800);
  const [savings, setSavings] = useState(200);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(3);
  const [hasDebt, setHasDebt] = useState(false);
  const [timeHorizonYears, setTimeHorizonYears] = useState(8);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  const surplus = income - expenses - savings;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0";
  const investable = surplus > 0 ? Math.round(surplus * 0.5) : 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      BUDGET_CONTEXT_KEY,
      JSON.stringify({
        income,
        expenses,
        savings,
        surplus,
        savingsRate,
        investable,
        riskProfile,
        emergencyFundMonths,
        hasDebt,
        timeHorizonYears,
        budgetStatus: surplus < 0 ? "overspending" : surplus < 200 ? "tight" : "healthy",
      })
    );
  }, [income, expenses, savings, surplus, savingsRate, investable, riskProfile, emergencyFundMonths, hasDebt, timeHorizonYears]);

  const status =
    surplus < 0 ? "overspending" : surplus < 200 ? "tight" : "healthy";

  const STATUS_STYLES = {
    overspending: "bg-rose-500/15 text-rose-600",
    tight: "bg-amber-500/15 text-amber-600",
    healthy: "bg-emerald-500/15 text-emerald-600",
  };

  const STATUS_LABELS = {
    overspending: "Overspending",
    tight: "Tight",
    healthy: "Healthy",
  };

  async function runAdvisor() {
    setLoadingStrategy(true);
    setStrategyError(null);
    try {
      const snapshot = {
        monthly_income: income,
        monthly_expenses: expenses,
        emergency_fund_months: emergencyFundMonths,
        has_debt: hasDebt,
        time_horizon_years: timeHorizonYears,
      };

      const [strategyRes, marketRes] = await Promise.all([
        generateStrategy(snapshot, riskProfile),
        getStocks(["spy.us", "qqq.us", "bnd.us"]),
      ]);

      setStrategy(strategyRes);
      setMarket({
        spy: oneYearChange(marketRes.SPY),
        qqq: oneYearChange(marketRes.QQQ),
        bnd: oneYearChange(marketRes.BND),
      });
    } catch {
      setStrategy(null);
      setMarket(null);
      setStrategyError("Could not generate strategy right now. Check backend/API setup and try again.");
    } finally {
      setLoadingStrategy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
          Advisor
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
          Monthly Advisor
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          Enter your finances, choose risk profile, then generate a strategy with market context.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Your Financial Inputs</CardTitle>
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
                      className="w-full pl-7 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-ink)] mb-1.5">
                    Risk Profile
                  </label>
                  <select
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value as RiskProfile)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--brand)]"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="balanced">Balanced</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-ink)] mb-1.5">
                    Emergency Fund (months)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={emergencyFundMonths}
                    onChange={(e) => setEmergencyFundMonths(Number(e.target.value))}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={hasDebt}
                    onChange={(e) => setHasDebt(e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  High-interest debt
                </label>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-ink)] mb-1.5">
                    Horizon (years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={timeHorizonYears}
                    onChange={(e) => setTimeHorizonYears(Number(e.target.value))}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
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
                (50%) is a safe starting point.
              </p>
            </div>
          )}

          {surplus < 0 && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <div className="text-xs font-semibold text-rose-600 mb-1">⚠️ Overspending</div>
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
                { label: "Remaining", amount: Math.max(surplus - investable, 0), color: "bg-[var(--border)]" },
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

      <div className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
              Strategy Engine
            </div>
            <div className="mt-1 text-sm text-[var(--muted-ink)]">
              Build a strategy using your inputs + live market context from Stooq.
            </div>
          </div>
          <button
            onClick={runAdvisor}
            disabled={loadingStrategy || surplus < 0}
            className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            {loadingStrategy ? "Generating..." : "Generate Strategy"}
          </button>
        </div>
      </div>

      {(strategy || strategyError) && (
        <Card>
          <CardHeader>
            <CardTitle>Advisor Strategy Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategyError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600">
                {strategyError}
              </div>
            ) : null}

            {strategy ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-ink)]">
                      Recommended Risk
                    </div>
                    <div className="mt-1 text-base font-semibold text-[var(--ink)] capitalize">{riskProfile}</div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-ink)]">
                      Monthly Investable
                    </div>
                    <div className="mt-1 text-base font-semibold text-[var(--ink)]">
                      €{Math.round(strategy.monthly_investable).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-ink)]">
                      Ready to Invest
                    </div>
                    <div className="mt-1 text-base font-semibold text-[var(--ink)]">
                      {strategy.ready_to_invest ? "Yes" : "Not Yet"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
                    Allocation
                  </div>
                  <div className="space-y-2">
                    {strategy.allocation.map((a) => (
                      <div key={a.asset} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-[var(--ink)]">{a.asset}</span>
                          <span className="font-bold text-[var(--ink)]">{a.percentage}%</span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted-ink)]">{a.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)] mb-1">
                    Strategy Explanation
                  </div>
                  <p className="text-sm text-[var(--ink)] leading-relaxed">{strategy.rationale}</p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)] mb-2">
                    Market Context (Stooq, 1Y)
                  </div>
                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    {[
                      { label: "S&P 500 (SPY)", value: market?.spy },
                      { label: "Nasdaq 100 (QQQ)", value: market?.qqq },
                      { label: "US Bonds (BND)", value: market?.bnd },
                    ].map((m) => {
                      const val = m.value;
                      const positive = (val ?? 0) >= 0;
                      return (
                        <div key={m.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                          <div className="text-xs text-[var(--muted-ink)]">{m.label}</div>
                          <div className={cn(
                            "mt-1 font-semibold",
                            val == null ? "text-[var(--muted-ink)]" : positive ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {val == null ? "No data" : `${positive ? "+" : ""}${val.toFixed(1)}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-[var(--muted-ink)] text-center">
        Educational purposes only · Not financial advice
      </p>
    </div>
  );
}
