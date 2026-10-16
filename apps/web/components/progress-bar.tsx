export function ProgressBar({ value, label }: { value: number; label: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(width)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-cream-deep" aria-hidden="true">
        <div className="h-full rounded-full bg-pine" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
