"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserData, loginUser, registerUser } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { SETTINGS_KEY, SETTINGS_UPDATED_EVENT } from "@/lib/settings";

const BUDGET_CONTEXT_KEY = "finagent.budgetContext";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }

      // Load saved data from backend and populate localStorage
      try {
        const userData = await getUserData();
        if (userData.settings && Object.keys(userData.settings).length > 0) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(userData.settings));
          window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
        }
        if (userData.budget && Object.keys(userData.budget).length > 0) {
          localStorage.setItem(BUDGET_CONTEXT_KEY, JSON.stringify(userData.budget));
        }
      } catch {
        // Non-fatal — proceed without syncing
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] p-4">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.10)_0%,transparent_50%)]" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-[var(--ink)]">Finbar</span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">Your personal finance copilot</p>
        </div>

        {/* Card */}
        <div className="app-panel rounded-3xl p-6 shadow-xl">
          {/* Mode toggle */}
          <div className="mb-5 flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                mode === "login"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                mode === "register"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h1 className="mb-1 text-xl font-semibold tracking-tight text-[var(--ink)]">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mb-5 text-xs text-[var(--muted-ink)]">
            {mode === "login"
              ? "Sign in to access your financial dashboard."
              : "Start tracking your finances and investments."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-ink)]/50 transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              Password
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 pr-10 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-ink)]/50 transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-ink)] hover:text-[var(--ink)] transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {mode === "register" && (
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Confirm Password
                <div className="relative mt-1.5">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 pr-10 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-ink)]/50 transition focus:border-[var(--brand)] focus:ring-2 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-ink)] hover:text-[var(--ink)] transition"
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--muted-ink)]">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={toggleMode}
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--muted-ink)]/60">
          Your data is stored securely on your account.
        </p>
      </div>
    </div>
  );
}
