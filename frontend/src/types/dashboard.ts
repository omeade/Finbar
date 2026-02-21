export type NetWorthPoint = { month: string; value: number };
export type CashflowPoint = { month: string; income: number; spending: number };

export type DashboardSummary = {
  netWorthNow: number;
  cashNow: number;
  monthlySpending: number;
  monthlyIncome: number;
};