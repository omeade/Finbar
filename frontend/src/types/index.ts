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
