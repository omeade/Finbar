export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/budget", label: "Budget Agent" },
  { href: "/stocks", label: "Stock Agent" },
  { href: "/simulate-stock", label: "Simulate Stock" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/settings", label: "Settings" },
] as const;

export function titleFromPath(pathname: string): string {
  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  return match?.label ?? "FinAgent";
}
