"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Tab = "Unified" | "Budget" | "Stocks";

export function AgentPanel() {
  const [tab, setTab] = useState<Tab>("Unified");

  const tabs: Tab[] = ["Unified", "Budget", "Stocks"];

  return (
    <aside className="hidden xl:flex h-[calc(100vh-1px)] w-96 shrink-0 flex-col border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="p-4">
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
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
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-200">
          <div className="font-medium mb-2">Quick prompts</div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-neutral-100 px-3 py-2 text-xs dark:bg-neutral-900">
              Cut spending by €200
            </span>
            <span className="rounded-xl bg-neutral-100 px-3 py-2 text-xs dark:bg-neutral-900">
              Explain net worth jump
            </span>
            <span className="rounded-xl bg-neutral-100 px-3 py-2 text-xs dark:bg-neutral-900">
              Diversify portfolio
            </span>
          </div>

          <div className="mt-4 text-xs text-neutral-500">
            Chat wires to your Python agent endpoint next.
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <input
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          placeholder={`Message ${tab} agent…`}
        />
      </div>
    </aside>
  );
}