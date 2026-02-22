"use client";

import { Stat } from "@/components/ui/Stat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { mockCashflow, mockInsights, mockNetWorth } from "@/lib/mock";
import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then(
      (mod) => mod.DashboardCharts
    ),
  { ssr: false }
);
const EURO_FORMATTER = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const netWorthNow = mockNetWorth[mockNetWorth.length - 1]?.value ?? 0;
  const latestCashflow = mockCashflow[mockCashflow.length - 1];
  const monthlyIncome = latestCashflow?.income ?? 0;
  const monthlySpending = latestCashflow?.spending ?? 0;
  const formatCurrency = (value: number) => EURO_FORMATTER.format(value);

  return (
    <div className="space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Financial Command Center
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)] md:text-3xl">
              Make budget and portfolio calls with confidence
            </h1>
          </div>
          <button className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]">
            Run Unified Analysis
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Net Worth"
          value={formatCurrency(netWorthNow)}
          subtext="Last 6 months"
        />
        <Stat
          label="Monthly Income"
          value={formatCurrency(monthlyIncome)}
          subtext="Most recent month"
        />
        <Stat
          label="Monthly Spending"
          value={formatCurrency(monthlySpending)}
          subtext="Most recent month"
        />
        <Stat
          label="Budget Status"
          value={monthlySpending <= monthlyIncome ? "On Track" : "At Risk"}
          subtext="Based on cashflow"
        />
      </div>

      <DashboardCharts
        netWorth={mockNetWorth}
        cashflow={mockCashflow}
        formatCurrency={formatCurrency}
      />

      <Card>
        <CardHeader>
          <CardTitle>Today’s Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {mockInsights.map((i) => (
              <div
                key={i.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm"
              >
                <div className="font-medium text-[var(--ink)]">{i.title}</div>
                <div className="mt-2 text-[var(--muted-ink)]">{i.text}</div>
                <button className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)]">
                  Apply
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
