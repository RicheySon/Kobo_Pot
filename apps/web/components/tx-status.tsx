import { phaseLabel, type TxPhase } from "@/lib/stellar/transactions";

export function TxStatus({
  phase,
  message,
  technical,
  hash,
  explorerUrl,
}: {
  phase: TxPhase;
  message?: string | null;
  technical?: string | null;
  hash?: string | null;
  explorerUrl?: string | null;
}) {
  if (phase === "idle" && !message) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-cream-deep bg-white p-4" aria-live="polite">
      <p className="font-medium text-ink">{message || phaseLabel(phase)}</p>
      {hash && explorerUrl ? (
        <a className="mt-2 inline-block text-sm text-pine-dark underline" href={explorerUrl}>
          View Testnet transaction
        </a>
      ) : null}
      {technical ? (
        <details className="mt-3 text-sm text-ink/80">
          <summary>Technical details</summary>
          <p className="mt-2 break-all">{technical}</p>
        </details>
      ) : null}
    </div>
  );
}
