import { FinancialSnapshot, RiskProfile, SimulationResult, Strategy } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function generateStrategy(
  snapshot: FinancialSnapshot,
  riskProfile: RiskProfile
): Promise<Strategy> {
  const res = await fetch(`${BASE}/api/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot, risk_profile: riskProfile }),
  });
  if (!res.ok) throw new Error("Strategy generation failed");
  return res.json();
}

export async function runSimulation(
  monthlyAmount: number,
  years: number,
  riskProfile: RiskProfile
): Promise<SimulationResult> {
  const res = await fetch(`${BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthly_amount: monthlyAmount, years, risk_profile: riskProfile }),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return res.json();
}

export async function sendChatMessage(
  message: string,
  context: { strategy: Strategy | null; risk_profile: RiskProfile | null }
): Promise<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) throw new Error("Chat failed");
  const data = await res.json();
  return data.response;
}
