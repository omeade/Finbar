import type { RiskProfile, Strategy } from "@/types";

export const PORTFOLIO_CONTEXT_KEY = "finagent.portfolioContext";
export const PORTFOLIO_CONTEXT_EVENT = "finagent:portfolio-context-updated";

export interface StoredPortfolioContext {
  strategy: Strategy | null;
  risk_profile: RiskProfile | null;
}

export function readStoredPortfolioContext(): StoredPortfolioContext {
  if (typeof window === "undefined") {
    return { strategy: null, risk_profile: null };
  }

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_CONTEXT_KEY);
    if (!raw) return { strategy: null, risk_profile: null };
    const parsed = JSON.parse(raw) as Partial<StoredPortfolioContext> | null;

    const riskProfile =
      parsed?.risk_profile === "conservative" ||
      parsed?.risk_profile === "balanced" ||
      parsed?.risk_profile === "aggressive"
        ? parsed.risk_profile
        : null;

    const strategy = parsed?.strategy ?? null;
    return { strategy, risk_profile: riskProfile };
  } catch {
    return { strategy: null, risk_profile: null };
  }
}

export function writeStoredPortfolioContext(context: StoredPortfolioContext): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PORTFOLIO_CONTEXT_KEY, JSON.stringify(context));
  window.dispatchEvent(new Event(PORTFOLIO_CONTEXT_EVENT));
}

export function clearStoredPortfolioContext(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PORTFOLIO_CONTEXT_KEY);
  window.dispatchEvent(new Event(PORTFOLIO_CONTEXT_EVENT));
}
