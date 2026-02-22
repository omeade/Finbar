"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  SETTINGS_KEY,
  SETTINGS_UPDATED_EVENT,
  ThemeAccent,
  ThemeMode,
} from "@/lib/settings";
import { getAuthUser, isAuthenticated } from "@/lib/auth";
import { updateUserData } from "@/lib/api";

type ResponseLength = "short" | "normal" | "detailed";
type StartPage = "/dashboard" | "/budget" | "/stocks" | "/learn" | "/portfolio";

type AppSettings = {
  displayName: string;
  email: string;
  currency: "EUR" | "USD" | "GBP";
  monthlySavingsGoal: number;
  responseLength: ResponseLength;
  showAgentDebug: boolean;
  reduceAnimations: boolean;
  compactCards: boolean;
  startPage: StartPage;
  themeMode: ThemeMode;
  themeAccent: ThemeAccent;
};

const DEFAULT_SETTINGS: AppSettings = {
  displayName: "Alex",
  email: "alex@example.com",
  currency: "EUR",
  monthlySavingsGoal: 500,
  responseLength: "normal",
  showAgentDebug: true,
  reduceAnimations: false,
  compactCards: false,
  startPage: "/dashboard",
  themeMode: "light",
  themeAccent: "ocean",
};

let _settingsCache: AppSettings = DEFAULT_SETTINGS;
let _settingsRaw: string | null = null;

function readStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw === _settingsRaw) return _settingsCache;
    _settingsRaw = raw;
    _settingsCache = raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }
      : DEFAULT_SETTINGS;
    return _settingsCache;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function subscribeSettings(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function onStorage(event: StorageEvent) {
    if (event.key === SETTINGS_KEY) onStoreChange();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(SETTINGS_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SETTINGS_UPDATED_EVENT, onStoreChange);
  };
}

function writeSettings(next: AppSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
  if (isAuthenticated()) {
    updateUserData({ settings: next as unknown as Record<string, unknown> }).catch(() => {});
  }
}

export default function SettingsPage() {
  const settings = useSyncExternalStore(subscribeSettings, readStoredSettings, () => DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const authUser = getAuthUser();

  // Keep settings.email in sync with the real account email
  useEffect(() => {
    if (authUser?.email && settings.email !== authUser.email) {
      writeSettings({ ...settings, email: authUser.email });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.email]);

  const completion = useMemo(() => {
    let score = 0;
    if (settings.displayName.trim()) score += 25;
    if (authUser?.email) score += 25;
    if (settings.monthlySavingsGoal > 0) score += 25;
    if (settings.responseLength) score += 25;
    return score;
  }, [settings, authUser?.email]);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    writeSettings({ ...settings, [key]: value });
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="fade-up relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-r from-[#0b84d8] to-[#1ca36d] p-6 text-white shadow-[0_28px_60px_-30px_rgba(11,132,216,0.65)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-sky-100/25 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Personalization
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings Studio</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90">
              Tailor your workspace, AI tone, and startup behavior. Changes save automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-xs backdrop-blur">
            <div className="font-semibold text-white">Setup Completion: {completion}%</div>
            <div className="mt-0.5 text-white/80">
              {savedAt ? `Last saved at ${savedAt}` : "Not saved yet"}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className="app-panel rounded-3xl p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Profile & Money</h2>
              <p className="text-xs text-[var(--muted-ink)]">Identity, currency, and your monthly target.</p>
            </div>
            <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-strong)]">
              Core
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              Display Name
              <input
                value={settings.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <div className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              Account Email
              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
                <span className="text-sm text-[var(--ink)]">{authUser?.email ?? "—"}</span>
                <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-strong)]">
                  Account
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Currency
                <select
                  value={settings.currency}
                  onChange={(e) => set("currency", e.target.value as AppSettings["currency"])}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Monthly Savings Goal
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={settings.monthlySavingsGoal}
                  onChange={(e) => set("monthlySavingsGoal", Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="app-panel rounded-3xl p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">AI Assistant</h2>
              <p className="text-xs text-[var(--muted-ink)]">Control depth, diagnostics, and assistant behavior.</p>
            </div>
            <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-strong)]">
              AI
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Response Length
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["short", "normal", "detailed"] as ResponseLength[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => set("responseLength", size)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition",
                      settings.responseLength === size
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-ink)] hover:border-[var(--brand)]"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => set("showAgentDebug", !settings.showAgentDebug)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs transition",
                settings.showAgentDebug
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]/70"
                  : "border-[var(--border)] bg-[var(--surface-soft)]"
              )}
            >
              <span className="font-medium text-[var(--ink)]">Show agent debug logs</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  settings.showAgentDebug
                    ? "bg-[var(--surface-soft)] text-[var(--brand)]"
                    : "bg-[var(--surface-soft)] text-[var(--muted-ink)]"
                )}
              >
                {settings.showAgentDebug ? "On" : "Off"}
              </span>
            </button>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-xs leading-relaxed text-[var(--muted-ink)]">
              This controls whether technical error metadata appears in the side agent panel.
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="app-panel rounded-3xl p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Experience</h2>
          <p className="mt-1 text-xs text-[var(--muted-ink)]">Theme, motion, and layout density controls.</p>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Appearance
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["light", "dark"] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => set("themeMode", mode)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition",
                      settings.themeMode === mode
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-ink)]"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Accent
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "ocean", color: "from-sky-500 to-blue-600" },
                    { key: "mint", color: "from-teal-500 to-emerald-500" },
                    { key: "sunset", color: "from-orange-500 to-amber-500" },
                  ] as { key: ThemeAccent; color: string }[]
                ).map((accent) => (
                  <button
                    key={accent.key}
                    onClick={() => set("themeAccent", accent.key)}
                    className={cn(
                      "rounded-xl border p-1 transition",
                      settings.themeAccent === accent.key
                        ? "border-[var(--brand)]"
                        : "border-[var(--border)]"
                    )}
                  >
                    <div className={cn("h-7 rounded-lg bg-gradient-to-r", accent.color)} />
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => set("reduceAnimations", !settings.reduceAnimations)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs transition",
                settings.reduceAnimations
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]/70"
                  : "border-[var(--border)] bg-[var(--surface-soft)]"
              )}
            >
              <span className="font-medium text-[var(--ink)]">Reduce animations</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                {settings.reduceAnimations ? "Enabled" : "Disabled"}
              </span>
            </button>
            <button
              onClick={() => set("compactCards", !settings.compactCards)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs transition",
                settings.compactCards
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]/70"
                  : "border-[var(--border)] bg-[var(--surface-soft)]"
              )}
            >
              <span className="font-medium text-[var(--ink)]">Compact card layout</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                {settings.compactCards ? "Enabled" : "Disabled"}
              </span>
            </button>
          </div>
        </section>

        <section className="app-panel rounded-3xl p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Startup</h2>
          <p className="mt-1 text-xs text-[var(--muted-ink)]">Choose where your dashboard opens and reset anytime.</p>
          <div className="mt-4 space-y-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              Default Page
              <select
                value={settings.startPage}
                onChange={(e) => set("startPage", e.target.value as StartPage)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
              >
                <option value="/dashboard">Dashboard</option>
                <option value="/budget">Budget</option>
                <option value="/stocks">Stocks</option>
                <option value="/learn">Learn</option>
                <option value="/portfolio">Portfolio</option>
              </select>
            </label>
            <button
              onClick={() => {
                writeSettings(DEFAULT_SETTINGS);
                setSavedAt(
                  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                );
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:bg-[var(--surface-soft)]"
            >
              Reset to defaults
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
