export function Stat({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="app-panel fade-up rounded-3xl p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-ink)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
        {value}
      </div>
      {subtext ? (
        <div className="mt-1 text-xs text-[var(--muted-ink)]">{subtext}</div>
      ) : null}
    </div>
  );
}
