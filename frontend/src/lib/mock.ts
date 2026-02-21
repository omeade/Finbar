import type { CashflowPoint, Insight, NetWorthPoint } from "@/types/dashboard";

export const mockNetWorth: NetWorthPoint[] = [
  { month: "Sep", value: 12000 },
  { month: "Oct", value: 13100 },
  { month: "Nov", value: 12800 },
  { month: "Dec", value: 14650 },
  { month: "Jan", value: 15520 },
  { month: "Feb", value: 16210 },
];

export const mockCashflow: CashflowPoint[] = [
  { month: "Sep", income: 2400, spending: 1850 },
  { month: "Oct", income: 2400, spending: 2050 },
  { month: "Nov", income: 2550, spending: 1980 },
  { month: "Dec", income: 2550, spending: 2300 },
  { month: "Jan", income: 2600, spending: 2100 },
  { month: "Feb", income: 2600, spending: 1950 },
];

export const mockInsights: Insight[] = [
  { title: "Budget", text: "Dining is up 18% vs your average. Consider setting a cap." },
  { title: "Investing", text: "Portfolio is 42% tech. Diversifying could reduce volatility." },
  { title: "Savings", text: "You could reach a €1,000 emergency buffer in ~3 months at €85/week." },
];
