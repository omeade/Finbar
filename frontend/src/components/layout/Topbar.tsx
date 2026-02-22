"use client";

import { usePathname } from "next/navigation";
import { logoutUser } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { titleFromPath } from "@/lib/navigation";

export function Topbar() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const authUser = getAuthUser();
  const initials = authUser?.email ? authUser.email[0].toUpperCase() : "?";

  return (
    <header className="mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/82 px-4 py-3 backdrop-blur md:mx-4 md:mt-4 md:px-6 md:py-4 lg:flex-nowrap">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden h-10 w-1.5 rounded-full bg-gradient-to-b from-[var(--brand)] to-[var(--accent)] md:block" />
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-wide text-[var(--muted-ink)]">{today}</div>
          <div className="truncate text-base font-semibold tracking-tight text-[var(--ink)] md:text-lg">{title}</div>
        </div>
        <div className="hidden text-xs text-[var(--muted-ink)] lg:block">
          Overview and actions from your agents
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <input
          className="hidden w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-200 xl:block"
          placeholder="Search transactions or tickers…"
        />
        <button
          onClick={() => logoutUser()}
          title={`Signed in as ${authUser?.email ?? ""}`}
          className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-[11px] font-bold text-white">
            {initials}
          </span>
          <span className="hidden sm:block">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
