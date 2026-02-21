"use client";

import { usePathname } from "next/navigation";

function titleFromPath(path: string) {
  if (path.startsWith("/dashboard")) return "Dashboard";
  if (path.startsWith("/budget")) return "Budget Agent";
  if (path.startsWith("/stocks")) return "Stock Agent";
  if (path.startsWith("/portfolio")) return "Portfolio";
  if (path.startsWith("/settings")) return "Settings";
  return "FinAgent";
}

export function Topbar() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </div>
        <div className="hidden md:block text-xs text-neutral-500">
          Overview and actions from your agents
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          className="hidden md:block w-72 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          placeholder="Search transactions or tickers…"
        />
        <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900">
          Profile
        </button>
      </div>
    </header>
  );
}