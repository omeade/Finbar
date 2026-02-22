export function Stat({
  label,
  value,
  subtext,
  delta,
  deltaGood,
}: {
  label: string;
  value: string;
  subtext?: string;
  delta?: string;
  deltaGood?: boolean;
}) {
  return (
    <div className="app-panel fade-up rounded-3xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--ink)]">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
              deltaGood === true
                ? "bg-emerald-100 text-emerald-700"
                : deltaGood === false
                  ? "bg-red-100 text-red-700"
                  : "bg-[var(--surface-soft)] text-[var(--muted-ink)]"
            }`}
          >
            {delta}
          </span>
        )}
        {subtext && (
          <span className="text-xs text-[var(--muted-ink)]">{subtext}</span>
        )}
      </div>
    </div>
  );
}
