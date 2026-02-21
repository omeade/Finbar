"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CashflowPoint, NetWorthPoint } from "@/types/dashboard";

type Props = {
  netWorth: NetWorthPoint[];
  cashflow: CashflowPoint[];
  formatCurrency: (value: number) => string;
};

export function DashboardCharts({ netWorth, cashflow, formatCurrency }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Net Worth</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d7e6e0" />
              <XAxis dataKey="month" stroke="#5d6f6a" />
              <YAxis tickFormatter={formatCurrency} stroke="#5d6f6a" />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid #d9e7e2",
                  backgroundColor: "#ffffff",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0f766e"
                strokeWidth={3}
                dot={false}
              />
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
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d7e6e0" />
              <XAxis dataKey="month" stroke="#5d6f6a" />
              <YAxis tickFormatter={formatCurrency} stroke="#5d6f6a" />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid #d9e7e2",
                  backgroundColor: "#ffffff",
                }}
              />
              <Bar dataKey="income" fill="#0f766e" radius={[8, 8, 0, 0]} />
              <Bar dataKey="spending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
