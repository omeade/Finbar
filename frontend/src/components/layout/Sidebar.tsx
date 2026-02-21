"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-panel m-3 mb-0 rounded-3xl p-4 md:m-4 md:mr-0 md:mb-4 md:h-[calc(100vh-2rem)] md:w-64 md:shrink-0">
      <div className="mb-6">
        <div className="inline-flex h-8 items-center rounded-full border border-[#93c8ef] bg-[var(--brand-soft)] px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-strong)]">
          Investment Copilot
        </div>
        <div className="mt-3 text-xl font-semibold tracking-tight text-[var(--ink)]">
          Finbar
        </div>
        <div className="text-xs text-[var(--muted-ink)]">Budget + stock intelligence in one place</div>
      </div>

      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-gradient-to-r from-[var(--brand)] to-[#22a7ea] text-white shadow-lg shadow-sky-900/20"
                  : "text-[var(--muted-ink)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] hover:translate-x-0.5"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
