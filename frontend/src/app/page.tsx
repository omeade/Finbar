import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="app-panel fade-up w-full max-w-lg rounded-3xl p-7">
        <div className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-strong)]">
          Personal Finance AI
        </div>
        <div className="mt-4 text-3xl font-semibold text-[var(--ink)]">
          FinAgent
        </div>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">
          Budget + Stock agents with dashboards and charts.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          Go to Dashboard
        </Link>

        <div className="mt-4 text-xs text-[var(--muted-ink)]">
          Backend can run locally (FastAPI/Flask) — UI connects via API.
        </div>
      </div>
    </main>
  );
}
