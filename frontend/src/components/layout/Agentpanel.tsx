"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { sendChatMessageWithMeta, type ChatContext } from "@/lib/api";
import {
  PORTFOLIO_CONTEXT_EVENT,
  PORTFOLIO_CONTEXT_KEY,
  readStoredPortfolioContext,
} from "@/lib/portfolioContext";
import { BUDGET_CONTEXT_KEY } from "@/app/(app)/budget/page";

const SETTINGS_KEY = "finagent.settings";
const T212_CACHE_KEY = "finbar.t212.cache";

type Tab = "Unified" | "Budget" | "Stocks";
const tabs: Tab[] = ["Unified", "Budget", "Stocks"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: Record<Tab, string[]> = {
  Unified: ["Summarise my finances", "Am I on track to invest?", "How can I improve my budget?"],
  Budget: ["Where am I overspending?", "How much can I save?", "Should I invest this month?"],
  Stocks: ["What is an ETF?", "Explain my portfolio allocation", "How diversified am I?"],
};

function readAllContext(): ChatContext {
  const portfolio = readStoredPortfolioContext();

  let budget: ChatContext["budget"] = null;
  try {
    const raw = localStorage.getItem(BUDGET_CONTEXT_KEY);
    if (raw) budget = JSON.parse(raw) as ChatContext["budget"];
  } catch { /* ignore */ }

  let settings: ChatContext["settings"] = null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as {
        displayName?: string;
        currency?: string;
        monthlySavingsGoal?: number;
        responseLength?: "short" | "normal" | "detailed";
      };
      settings = {
        displayName: s.displayName ?? "there",
        currency: s.currency ?? "EUR",
        monthlySavingsGoal: s.monthlySavingsGoal ?? 0,
        responseLength: s.responseLength ?? "normal",
      };
    }
  } catch { /* ignore */ }

  let t212: ChatContext["portfolio"] = null;
  try {
    const raw = localStorage.getItem(T212_CACHE_KEY);
    if (raw) {
      const cache = JSON.parse(raw) as {
        cash?: { free: number; invested: number; total: number; ppl: number };
        positions?: Array<{ ticker: string; quantity: number; averagePrice: number; currentPrice: number; ppl: number }>;
      };
      if (cache.cash || cache.positions) {
        t212 = {
          cash: cache.cash ?? null,
          positions: cache.positions ?? [],
        };
      }
    }
  } catch { /* ignore */ }

  return {
    strategy: portfolio.strategy,
    risk_profile: portfolio.risk_profile,
    budget,
    settings,
    portfolio: t212,
  };
}

export function AgentPanel() {
  const [tab, setTab] = useState<Tab>("Unified");
  const [quickPromptsOpen, setQuickPromptsOpen] = useState(true);
  const [context, setContext] = useState<ChatContext>(() => ({
    strategy: null,
    risk_profile: null,
    budget: null,
    settings: null,
    portfolio: null,
  }));
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about your budget, investments, or the app. I have access to your financial inputs whenever you fill them in. Educational only — not financial advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasPortfolioContext = Boolean(context.strategy && context.risk_profile);
  const hasBudgetContext = Boolean(context.budget);

  useEffect(() => {
    setContext(readAllContext());

    function refresh() {
      setContext(readAllContext());
    }

    function onStorage(event: StorageEvent) {
      if (
        event.key === PORTFOLIO_CONTEXT_KEY ||
        event.key === BUDGET_CONTEXT_KEY ||
        event.key === SETTINGS_KEY ||
        event.key === T212_CACHE_KEY
      ) {
        refresh();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(PORTFOLIO_CONTEXT_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PORTFOLIO_CONTEXT_EVENT, refresh);
    };
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    // Refresh context before sending so we always use the latest inputs
    const latestContext = readAllContext();
    setContext(latestContext);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const payload = await sendChatMessageWithMeta(trimmed, latestContext);
      setMessages((prev) => [...prev, { role: "assistant", content: payload.response }]);

      if (payload.source === "fallback") {
        const detail = [
          `code=${payload.error_code ?? "unknown"}`,
          `type=${payload.error_type ?? "unknown"}`,
          `model=${payload.model ?? "unknown"}`,
          `time=${payload.timestamp_utc ?? new Date().toISOString()}`,
          `message=${payload.error_message ?? "n/a"}`,
        ].join("\n");
        setDebugLog(detail);
        console.error("[AgentPanel] AI fallback triggered", payload);
      } else {
        setDebugLog(null);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      const shortError =
        detail.includes("429") || detail.includes("RESOURCE_EXHAUSTED")
          ? "Live AI unavailable (quota limit reached)."
          : detail.includes("Failed to fetch")
          ? "Cannot reach backend."
          : "Chat unavailable right now.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${shortError} Please try again.`,
        },
      ]);
      setDebugLog(`code=request_failed\ntime=${new Date().toISOString()}\nmessage=${detail}`);
      console.error("[AgentPanel] chat request failed", error);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  const contextSummary = hasPortfolioContext
    ? `Strategy: ${context.risk_profile} • €${context.strategy?.monthly_investable ?? 0}/mo`
    : hasBudgetContext
    ? `Budget loaded • €${context.budget?.surplus ?? 0} surplus`
    : null;

  return (
    <aside className="app-panel m-4 ml-0 hidden h-[calc(100vh-2rem)] w-[22rem] shrink-0 flex-col self-start rounded-3xl xl:sticky xl:top-4 xl:flex 2xl:w-96">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
          <div className="text-sm font-semibold tracking-wide text-[var(--muted-ink)]">Agent</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs whitespace-nowrap transition-all duration-300",
                tab === t
                  ? "border-[var(--brand)] bg-gradient-to-r from-[var(--brand)] to-[#22a7ea] text-white shadow-md shadow-sky-900/20"
                  : "border-[var(--border)] text-[var(--muted-ink)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "mt-3 rounded-2xl border px-3 py-2 text-xs",
            contextSummary
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
          )}
        >
          {contextSummary ?? "No data yet. Visit the Advisor page to enter your finances."}
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-[var(--muted-ink)]">Quick prompts</div>
            <button
              onClick={() => setQuickPromptsOpen((prev) => !prev)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              aria-expanded={quickPromptsOpen}
              aria-label={quickPromptsOpen ? "Hide quick prompts" : "Show quick prompts"}
            >
              {quickPromptsOpen ? "Hide" : "Show"}
            </button>
          </div>
          {quickPromptsOpen ? (
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS[tab].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="rounded-xl bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] border border-[var(--border)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] text-xs rounded-2xl px-3 py-2.5 leading-relaxed",
                msg.role === "user"
                  ? "bg-gradient-to-r from-[var(--brand)] to-[#22a7ea] text-white rounded-br-sm"
                  : "bg-[var(--surface-soft)] text-[var(--ink)] border border-[var(--border)] rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface-soft)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-[var(--muted-ink)] rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            placeholder={`Message ${tab} agent…`}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-gradient-to-r from-[var(--brand)] to-[#22a7ea] px-3 py-2 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted-ink)] mt-1.5 text-center">
          Educational only · Not financial advice
        </p>
        {debugLog ? (
          <details className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-600">
            <summary className="cursor-pointer font-semibold">AI debug log</summary>
            <pre className="mt-1 whitespace-pre-wrap break-words font-mono">{debugLog}</pre>
          </details>
        ) : null}
      </div>
    </aside>
  );
}
