import type {
  ChatResponse,
  FinancialSnapshot,
  RiskProfile,
  SimulationResult,
  StockSearchResult,
  StocksResult,
  Strategy,
  T212AccountCash,
  T212AccountInfo,
  T212AccountType,
  T212Position,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function generateStrategy(
  snapshot: FinancialSnapshot,
  riskProfile: RiskProfile
): Promise<Strategy> {
  return apiPost<Strategy>("/api/strategy", { snapshot, risk_profile: riskProfile });
}

export async function runSimulation(
  monthlyAmount: number,
  years: number,
  riskProfile: RiskProfile
): Promise<SimulationResult> {
  return apiPost<SimulationResult>("/api/simulate", {
    monthly_amount: monthlyAmount,
    years,
    risk_profile: riskProfile,
  });
}

export async function sendChatMessage(
  message: string,
  context: { strategy: Strategy | null; risk_profile: RiskProfile | null }
): Promise<string> {
  const data = await apiPost<ChatResponse>("/api/chat", { message, context });
  return data.response;
}

export async function sendChatMessageWithMeta(
  message: string,
  context: { strategy: Strategy | null; risk_profile: RiskProfile | null }
): Promise<ChatResponse> {
  return apiPost<ChatResponse>("/api/chat", { message, context });
}

export async function getStocks(symbols: string[] = ["spy.us", "qqq.us", "bnd.us"]): Promise<StocksResult> {
  const query = encodeURIComponent(symbols.join(","));
  return apiGet<StocksResult>(`/api/stocks?symbols=${query}`);
}

function t212Headers(apiKey: string, apiSecret: string): Record<string, string> {
  return {
    Accept: "application/json",
    "X-T212-Key": apiKey,
    "X-T212-Secret": apiSecret,
  };
}

export async function validateT212Key(
  apiKey: string,
  apiSecret: string,
  accountType: T212AccountType
): Promise<T212AccountInfo> {
  return apiGet<T212AccountInfo>(`/api/t212/account/info?account_type=${accountType}`, {
    headers: t212Headers(apiKey, apiSecret),
  });
}

export async function getT212Cash(
  apiKey: string,
  apiSecret: string,
  accountType: T212AccountType
): Promise<T212AccountCash> {
  return apiGet<T212AccountCash>(`/api/t212/account/cash?account_type=${accountType}`, {
    headers: t212Headers(apiKey, apiSecret),
  });
}

export async function getT212Portfolio(
  apiKey: string,
  apiSecret: string,
  accountType: T212AccountType
): Promise<T212Position[]> {
  return apiGet<T212Position[]>(`/api/t212/portfolio?account_type=${accountType}`, {
    headers: t212Headers(apiKey, apiSecret),
  });
export async function searchStock(query: string, days = 365): Promise<StockSearchResult> {
  const q = encodeURIComponent(query.trim());
  return apiGet<StockSearchResult>(`/api/stocks/search?q=${q}&days=${days}`);
}
