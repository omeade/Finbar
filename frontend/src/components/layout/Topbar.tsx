"use client";

import { usePathname } from "next/navigation";
import { titleFromPath } from "@/lib/navigation";

export function Topbar() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="mx-3 mt-3 flex items-center justify-between gap-3 rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/85 px-4 py-3 backdrop-blur md:mx-4 md:mt-4 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--muted-ink)]">{today}</div>
          <div className="text-base font-semibold text-[var(--ink)] md:text-lg">{title}</div>
        </div>
        <div className="hidden text-xs text-[var(--muted-ink)] lg:block">
          Overview and actions from your agents
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          className="hidden w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] md:block"
          placeholder="Search transactions or tickers…"
        />
        <button className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--brand)]">
          Profile
        </button>
      </div>
    </header>
  );
}
