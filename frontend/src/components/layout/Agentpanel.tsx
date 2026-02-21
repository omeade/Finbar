"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Tab = "Unified" | "Budget" | "Stocks";
const tabs: Tab[] = ["Unified", "Budget", "Stocks"];

export function AgentPanel() {
  const [tab, setTab] = useState<Tab>("Unified");

  return (
    <aside className="app-panel m-4 ml-0 hidden h-[calc(100vh-2rem)] w-96 shrink-0 flex-col rounded-3xl xl:flex">
      <div className="p-4">
        <div className="text-sm font-semibold tracking-wide text-[var(--muted-ink)]">
          Agent
        </div>

        <div className="mt-3 flex gap-2">
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
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted-ink)]">
          <div className="font-medium mb-2">Quick prompts</div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-white px-3 py-2 text-xs text-[var(--ink)]">
              Cut spending by €200
            </span>
            <span className="rounded-xl bg-white px-3 py-2 text-xs text-[var(--ink)]">
              Explain net worth jump
            </span>
            <span className="rounded-xl bg-white px-3 py-2 text-xs text-[var(--ink)]">
              Diversify portfolio
            </span>
          </div>

          <div className="mt-4 text-xs text-[var(--muted-ink)]">
            Chat wires to your Python agent endpoint next.
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <input
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
          placeholder={`Message ${tab} agent…`}
        />
      </div>
    </aside>
  );
}
