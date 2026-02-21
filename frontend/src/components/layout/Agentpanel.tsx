"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { sendChatMessageWithMeta } from "@/lib/api";
import type { RiskProfile, Strategy } from "@/types";
import {
  PORTFOLIO_CONTEXT_EVENT,
  PORTFOLIO_CONTEXT_KEY,
  readStoredPortfolioContext,
} from "@/lib/portfolioContext";

type Tab = "Unified" | "Budget" | "Stocks";
const tabs: Tab[] = ["Unified", "Budget", "Stocks"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: Record<Tab, string[]> = {
  Unified: ["Cut spending by €200", "Explain net worth jump", "Diversify portfolio"],
  Budget: ["Where am I overspending?", "How much can I save?", "Best budget strategy?"],
  Stocks: ["What is an ETF?", "Why diversify?", "Explain index funds"],
};

export function AgentPanel() {
  const [tab, setTab] = useState<Tab>("Unified");
  const [context, setContext] = useState<{
    strategy: Strategy | null;
    risk_profile: RiskProfile | null;
  }>({ strategy: null, risk_profile: null });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about your finances, investments, or strategy. Educational only — not financial advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasPortfolioContext = Boolean(context.strategy && context.risk_profile);

  useEffect(() => {
    setContext(readStoredPortfolioContext());

    function onStorage(event: StorageEvent) {
      if (event.key === PORTFOLIO_CONTEXT_KEY) {
        setContext(readStoredPortfolioContext());
      }
    }

    function onPortfolioContextUpdated() {
      setContext(readStoredPortfolioContext());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(PORTFOLIO_CONTEXT_EVENT, onPortfolioContextUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PORTFOLIO_CONTEXT_EVENT, onPortfolioContextUpdated);
    };
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const payload = await sendChatMessageWithMeta(trimmed, context);
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

  return (
    <aside className="app-panel m-4 ml-0 hidden h-[calc(100vh-2rem)] w-96 shrink-0 flex-col rounded-3xl xl:flex">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
          <div className="text-sm font-semibold tracking-wide text-[var(--muted-ink)]">Agent</div>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-3 py-2 text-xs border transition",
                tab === t
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[var(--border)] text-[var(--muted-ink)] hover:bg-[var(--surface-soft)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "mt-3 rounded-2xl border px-3 py-2 text-xs",
            hasPortfolioContext
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          {hasPortfolioContext
            ? `Context linked: ${context.risk_profile} profile • €${context.strategy?.monthly_investable ?? 0}/mo plan`
            : "No portfolio context yet. Complete Portfolio to personalize replies."}
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <div className="text-xs font-medium text-[var(--muted-ink)] mb-2">Quick prompts</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS[tab].map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="rounded-xl bg-white px-3 py-1.5 text-xs text-[var(--ink)] border border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition"
              >
                {prompt}
              </button>
            ))}
          </div>
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
                  ? "bg-[var(--brand)] text-white rounded-br-sm"
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
            className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            placeholder={`Message ${tab} agent…`}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-[var(--brand)] text-white rounded-xl hover:bg-[var(--brand-strong)] disabled:opacity-40 transition text-xs font-medium"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted-ink)] mt-1.5 text-center">
          Educational only · Not financial advice
        </p>
        {debugLog ? (
          <details className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800">
            <summary className="cursor-pointer font-semibold">AI debug log</summary>
            <pre className="mt-1 whitespace-pre-wrap break-words font-mono">{debugLog}</pre>
          </details>
        ) : null}
      </div>
    </aside>
  );
}
