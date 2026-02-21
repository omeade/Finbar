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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      {subtext ? (
        <div className="mt-1 text-xs text-neutral-500">{subtext}</div>
      ) : null}
    </div>
  );
}