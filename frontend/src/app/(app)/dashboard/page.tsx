"use client";

import { Stat } from "@/components/ui/Stat";
import { mockCashflow } from "@/lib/mock";
import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then(
      (mod) => mod.DashboardCharts
    ),
  { ssr: false }
);

const DashboardStocks = dynamic(
  () =>
    import("@/components/dashboard/DashboardStocks").then(
      (mod) => mod.DashboardStocks
    ),
  { ssr: false }
);

const EURO_FORMATTER = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const prev = mockCashflow[mockCashflow.length - 2];
  const curr = mockCashflow[mockCashflow.length - 1];
  const income = curr?.income ?? 0;
  const spending = curr?.spending ?? 0;
  const saved = income - spending;
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0;

  const spendingDelta =
    prev != null ? ((spending - prev.spending) / prev.spending) * 100 : null;
  const prevSaved = prev != null ? prev.income - prev.spending : null;
  const savedDelta =
    prevSaved != null && prevSaved !== 0
      ? ((saved - prevSaved) / prevSaved) * 100
      : null;

  const fmt = (v: number) => EURO_FORMATTER.format(v);
  const fmtDelta = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section className="app-panel fade-up rounded-3xl overflow-hidden relative p-6 md:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand)] opacity-[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-[var(--accent)] opacity-[0.08] blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--brand)] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
            February 2026
          </div>
          <h1 className="text-3xl font-bold text-[var(--ink)] md:text-4xl leading-snug">
            You&apos;re up {fmt(saved)}<br />
            <span className="text-[var(--brand)]">this month.</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">
            {fmt(income)} in &nbsp;·&nbsp; {fmt(spending)} out &nbsp;·&nbsp;{" "}
            {fmt(saved)} saved
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Monthly Income"
          value={fmt(income)}
          subtext="Most recent month"
        />
        <Stat
          label="Monthly Spending"
          value={fmt(spending)}
          delta={spendingDelta !== null ? fmtDelta(spendingDelta) : undefined}
          deltaGood={spendingDelta !== null ? spendingDelta < 0 : undefined}
          subtext="vs last month"
        />
        <Stat
          label="Saved This Month"
          value={fmt(saved)}
          delta={savedDelta !== null ? fmtDelta(savedDelta) : undefined}
          deltaGood={savedDelta !== null ? savedDelta > 0 : undefined}
          subtext="vs last month"
        />
        <Stat
          label="Savings Rate"
          value={`${savingsRate}%`}
          subtext="of income saved"
        />
      </div>

      {/* ── ETF Chart ── */}
      <DashboardCharts />

      {/* ── Stocks ── */}
      <DashboardStocks />
    </div>
  );
}
