export function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{label}</p><p className="tabular mt-1 text-xl font-semibold">{value}</p></div>;
}
