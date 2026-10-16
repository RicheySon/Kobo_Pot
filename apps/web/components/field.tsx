import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-ink/70">{hint}</span> : null}
      {error ? <span className="block text-clay">{error}</span> : null}
    </label>
  );
}
