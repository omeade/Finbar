import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          FinAgent
        </div>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Budget + Stock agents with dashboards and charts.
        </p>

        <Link
          href="/dashboard"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Go to Dashboard
        </Link>

        <div className="mt-4 text-xs text-neutral-500">
          Backend can run locally (FastAPI/Flask) — UI connects via API.
        </div>
      </div>
    </main>
  );
}