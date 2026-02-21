export interface FinancialSnapshot {
  monthly_income: number;
  monthly_expenses: number;
  emergency_fund_months: number;
  has_debt: boolean;
  time_horizon_years: number;
}

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export interface AllocationItem {
  asset: string;
  percentage: number;
  description: string;
}

export interface Strategy {
  monthly_investable: number;
  monthly_surplus: number;
  allocation: AllocationItem[];
  rationale: string;
  education: string[];
  risk_warning: string;
  ready_to_invest: boolean;
}

export interface SimulationPoint {
  year: number;
  value: number;
  contributions: number;
  gain: number;
}

export interface SimulationResult {
  scenarios: {
    typical: SimulationPoint[];
    best: SimulationPoint[];
    worst: SimulationPoint[];
  };
  total_contributions: number;
  years: number[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  source?: "fallback";
  error_code?: string;
  error_type?: string;
  error_message?: string;
  timestamp_utc?: string;
  model?: string;
}

export interface StockData {
  dates: string[];
  prices: number[];
  normalised: number[];
  error?: string;
}

export type StocksResult = Record<string, StockData>;

export interface T212Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  ppl: number;
  fxPpl: number;
  initialFillDate: string;
  frontend?: string;
  maxBuy: number;
  maxSell: number;
  pieQuantity: number;
}

export interface T212AccountCash {
  free: number;
  invested: number;
  pieCash: number;
  result: number;
  total: number;
  ppl: number;
}

export interface T212AccountInfo {
  id: number;
  currencyCode: string;
}

export type T212AccountType = "live" | "demo";
export interface StockSearchResult {
  query: string;
  resolved_symbol: string;
  label: string;
  data: StockData;
}
