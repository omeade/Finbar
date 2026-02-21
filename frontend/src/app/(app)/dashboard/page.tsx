"use client";

import { Stat } from "@/components/ui/Stat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { mockCashflow, mockInsights, mockNetWorth } from "@/lib/mock";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const netWorthNow = mockNetWorth[mockNetWorth.length - 1]?.value ?? 0;
  const latestCashflow = mockCashflow[mockCashflow.length - 1];
  const monthlyIncome = latestCashflow?.income ?? 0;
  const monthlySpending = latestCashflow?.spending ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Net Worth" value={`€${netWorthNow.toLocaleString()}`} subtext="Last 6 months" />
        <Stat label="Monthly Income" value={`€${monthlyIncome.toLocaleString()}`} subtext="Most recent month" />
        <Stat label="Monthly Spending" value={`€${monthlySpending.toLocaleString()}`} subtext="Most recent month" />
        <Stat
          label="Budget Status"
          value={monthlySpending <= monthlyIncome ? "On Track" : "At Risk"}
          subtext="Based on cashflow"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockNetWorth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cashflow (Income vs Spending)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCashflow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" />
                <Bar dataKey="spending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today’s Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {mockInsights.map((i) => (
              <div
                key={i.title}
                className="rounded-2xl border border-neutral-200 p-4 text-sm dark:border-neutral-800"
              >
                <div className="font-medium">{i.title}</div>
                <div className="mt-2 text-neutral-600 dark:text-neutral-300">{i.text}</div>
                <button className="mt-3 rounded-xl border border-neutral-200 px-3 py-2 text-xs hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900">
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