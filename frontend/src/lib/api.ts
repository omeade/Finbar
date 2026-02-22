import type {
  ChatResponse,
  FinancialSnapshot,
  RiskProfile,
  SimulationResult,
  StockSearchResult,
  StockUniverseResponse,
  StocksResult,
  Strategy,
  T212AccountCash,
  T212AccountInfo,
  T212AccountType,
  T212Position,
} from "@/types";
import { type AuthUser, clearAuth, getAuthToken, setAuth } from "./auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function authHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers({ ...authHeader(), ...init?.headers });
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
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Login failed");
  }
  const data = (await res.json()) as AuthResponse;
  setAuth(data.token, data.user);
  return data;
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Registration failed");
  }
  const data = (await res.json()) as AuthResponse;
  setAuth(data.token, data.user);
  return data;
}

export function logoutUser(): void {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ── User data sync ────────────────────────────────────────────────────────────

interface UserDataPayload {
  settings?: Record<string, unknown>;
  budget?: Record<string, unknown>;
}

interface UserDataResponse {
  settings: Record<string, unknown>;
  budget: Record<string, unknown>;
}

export async function getUserData(): Promise<UserDataResponse> {
  return apiGet<UserDataResponse>("/api/user/data");
}

export async function updateUserData(data: UserDataPayload): Promise<void> {
  await apiPut("/api/user/data", data);
}

// ── Strategy ──────────────────────────────────────────────────────────────────

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

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatContext {
  strategy: Strategy | null;
  risk_profile: RiskProfile | null;
  budget?: {
    income: number;
    expenses: number;
    savings: number;
    surplus: number;
    savingsRate: string;
    investable: number;
    riskProfile: RiskProfile;
    emergencyFundMonths: number;
    hasDebt: boolean;
    timeHorizonYears: number;
    budgetStatus: "healthy" | "tight" | "overspending";
  } | null;
  settings?: {
    displayName: string;
    currency: string;
    monthlySavingsGoal: number;
    responseLength?: "short" | "normal" | "detailed";
  } | null;
  portfolio?: {
    cash: { free: number; invested: number; total: number; ppl: number } | null;
    positions: Array<{ ticker: string; quantity: number; averagePrice: number; currentPrice: number; ppl: number }>;
  } | null;
}

export async function sendChatMessage(
  message: string,
  context: ChatContext
): Promise<string> {
  const data = await apiPost<ChatResponse>("/api/chat", { message, context });
  return data.response;
}

export async function sendChatMessageWithMeta(
  message: string,
  context: ChatContext
): Promise<ChatResponse> {
  return apiPost<ChatResponse>("/api/chat", { message, context });
}

// ── Stocks ────────────────────────────────────────────────────────────────────

export async function getStocks(symbols: string[] = ["spy.us", "qqq.us", "bnd.us"]): Promise<StocksResult> {
  const query = encodeURIComponent(symbols.join(","));
  return apiGet<StocksResult>(`/api/stocks?symbols=${query}`);
}

export async function getStockGroups(): Promise<StockUniverseResponse> {
  return apiGet<StockUniverseResponse>("/api/stocks/groups");
}

export async function searchStock(query: string, days = 365): Promise<StockSearchResult> {
  const q = encodeURIComponent(query.trim());
  return apiGet<StockSearchResult>(`/api/stocks/search?q=${q}&days=${days}`);
}

// ── Trading 212 ───────────────────────────────────────────────────────────────

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
}
